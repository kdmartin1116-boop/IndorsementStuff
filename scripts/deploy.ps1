# 🚀 Production Deployment Manager

param(
    [switch]$Deploy = $false,
    [switch]$ValidateReadiness = $false,
    [switch]$ShowStatus = $false,
    [switch]$Rollback = $false,
    [switch]$Scale = $false,
    [switch]$Logs = $false,
    [switch]$Health = $false,
    [string]$Environment = "production"
)

$ProjectRoot = "C:\Users\xxcha\OneDrive\Desktop\IndorsementStuff\new"
$DeploymentPath = "$ProjectRoot\deployment"
$EnvFile = "$ProjectRoot\.env.production"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Show-DeploymentStatus {
    Write-ColorOutput "📊 DEPLOYMENT STATUS" "Cyan"
    Write-ColorOutput "====================" "Cyan"
    Write-Host ""
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-ColorOutput "✅ Docker: $dockerVersion" "Green"
    }
    catch {
        Write-ColorOutput "❌ Docker not available" "Red"
        return $false
    }
    
    # Check Kubernetes
    try {
        $kubectlVersion = kubectl version --client --short
        Write-ColorOutput "✅ kubectl: $kubectlVersion" "Green"
        
        $kubeNodes = kubectl get nodes --no-headers 2>$null
        if ($kubeNodes) {
            Write-ColorOutput "✅ Kubernetes cluster connected" "Green"
        } else {
            Write-ColorOutput "⚠️ Kubernetes cluster not accessible" "Yellow"
        }
    }
    catch {
        Write-ColorOutput "❌ kubectl not available" "Red"
    }
    
    # Check deployments
    try {
        Write-Host ""
        Write-ColorOutput "Current deployments:" "Yellow"
        kubectl get deployments -o wide 2>$null
        
        Write-Host ""
        Write-ColorOutput "Current services:" "Yellow"
        kubectl get services -o wide 2>$null
        
        Write-Host ""
        Write-ColorOutput "Current ingress:" "Yellow"
        kubectl get ingress -o wide 2>$null
        
        Write-Host ""
        Write-ColorOutput "Current pods:" "Yellow"
        kubectl get pods -o wide 2>$null
    }
    catch {
        Write-ColorOutput "⚠️ Could not retrieve Kubernetes resources" "Yellow"
    }
}

function Validate-DeploymentReadiness {
    Write-ColorOutput "🔍 VALIDATING DEPLOYMENT READINESS" "Blue"
    Write-ColorOutput "===================================" "Blue"
    Write-Host ""
    
    $readinessScore = 0
    $maxScore = 10
    $issues = @()
    
    # Check Docker
    try {
        docker --version | Out-Null
        Write-ColorOutput "✅ Docker installed and running" "Green"
        $readinessScore++
    }
    catch {
        $issues += "❌ Docker not installed or not running"
    }
    
    # Check Kubernetes
    try {
        kubectl version --client | Out-Null
        Write-ColorOutput "✅ kubectl available" "Green"
        $readinessScore++
        
        $context = kubectl config current-context 2>$null
        if ($context) {
            Write-ColorOutput "✅ Kubernetes context: $context" "Green"
            $readinessScore++
        } else {
            $issues += "❌ No Kubernetes context configured"
        }
    }
    catch {
        $issues += "❌ kubectl not available"
    }
    
    # Check environment file
    if (Test-Path $EnvFile) {
        Write-ColorOutput "✅ Environment file exists" "Green"
        $readinessScore++
        
        $envContent = Get-Content $EnvFile -Raw
        
        # Check for required credentials
        if ($envContent -notmatch "your-.*-client-id" -and $envContent -match "OAUTH_GOOGLE_CLIENT_ID=.+") {
            Write-ColorOutput "✅ OAuth credentials configured" "Green"
            $readinessScore++
        } else {
            $issues += "⚠️ OAuth credentials not fully configured"
        }
        
        if ($envContent -notmatch "your-.*-access-key" -and $envContent -match "AWS_ACCESS_KEY_ID=.+") {
            Write-ColorOutput "✅ AWS credentials configured" "Green"
            $readinessScore++
        } else {
            $issues += "⚠️ AWS credentials not configured"
        }
        
        if ($envContent -match "DOMAIN=.+" -and $envContent -notmatch "DOMAIN=localhost") {
            Write-ColorOutput "✅ Domain configured" "Green"
            $readinessScore++
        } else {
            $issues += "⚠️ Production domain not configured"
        }
    } else {
        $issues += "❌ Environment file not found"
    }
    
    # Check deployment files
    $requiredFiles = @(
        "$DeploymentPath\k8s\backend-deployment.yaml",
        "$DeploymentPath\k8s\frontend-deployment.yaml",
        "$DeploymentPath\k8s\database-deployment.yaml",
        "$DeploymentPath\k8s\secrets.yaml"
    )
    
    $filesExist = 0
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            $filesExist++
        }
    }
    
    if ($filesExist -eq $requiredFiles.Count) {
        Write-ColorOutput "✅ All deployment files present" "Green"
        $readinessScore++
    } else {
        $issues += "❌ Missing deployment files ($filesExist/$($requiredFiles.Count))"
    }
    
    # Check Docker images
    try {
        $images = docker images --format "table {{.Repository}}:{{.Tag}}" | Select-String "indorsement"
        if ($images) {
            Write-ColorOutput "✅ Docker images built" "Green"
            $readinessScore++
        } else {
            $issues += "⚠️ Docker images not built"
        }
    }
    catch {
        $issues += "❌ Cannot check Docker images"
    }
    
    # Check network connectivity
    try {
        Test-NetConnection -ComputerName "google.com" -Port 443 -InformationLevel Quiet | Out-Null
        Write-ColorOutput "✅ Internet connectivity available" "Green"
        $readinessScore++
    }
    catch {
        $issues += "❌ No internet connectivity"
    }
    
    Write-Host ""
    Write-ColorOutput "READINESS SCORE: $readinessScore/$maxScore" "$(if ($readinessScore -ge 8) { 'Green' } elseif ($readinessScore -ge 6) { 'Yellow' } else { 'Red' })"
    
    if ($issues.Count -gt 0) {
        Write-Host ""
        Write-ColorOutput "Issues found:" "Yellow"
        foreach ($issue in $issues) {
            Write-ColorOutput "  $issue" "Red"
        }
        
        Write-Host ""
        Write-ColorOutput "Recommended actions:" "Yellow"
        Write-ColorOutput "• Run docker-setup.ps1 if Docker issues" "Gray"
        Write-ColorOutput "• Run configure-credentials.ps1 for credential issues" "Gray"
        Write-ColorOutput "• Run configure-domain-ssl.ps1 for domain issues" "Gray"
        Write-ColorOutput "• Run build-images.ps1 to build Docker images" "Gray"
    }
    
    return $readinessScore -ge 8
}

function Build-DockerImages {
    Write-ColorOutput "🔨 BUILDING DOCKER IMAGES" "Blue"
    Write-ColorOutput "==========================" "Blue"
    Write-Host ""
    
    # Build backend image
    Write-ColorOutput "Building backend image..." "Yellow"
    try {
        Set-Location "$ProjectRoot\backend"
        docker build -t indorsement-backend:latest -t indorsement-backend:production .
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Backend image built successfully" "Green"
        } else {
            throw "Backend build failed"
        }
    }
    catch {
        Write-ColorOutput "❌ Failed to build backend image: $_" "Red"
        return $false
    }
    
    # Build frontend image
    Write-ColorOutput "Building frontend image..." "Yellow"
    try {
        Set-Location "$ProjectRoot\frontend"
        docker build -t indorsement-frontend:latest -t indorsement-frontend:production .
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Frontend image built successfully" "Green"
        } else {
            throw "Frontend build failed"
        }
    }
    catch {
        Write-ColorOutput "❌ Failed to build frontend image: $_" "Red"
        return $false
    }
    
    Set-Location $ProjectRoot
    return $true
}

function Deploy-ToKubernetes {
    Write-ColorOutput "🚀 DEPLOYING TO KUBERNETES" "Green"
    Write-ColorOutput "===========================" "Green"
    Write-Host ""
    
    # Create namespace if it doesn't exist
    Write-ColorOutput "Creating namespace..." "Yellow"
    kubectl create namespace indorsement 2>$null
    
    # Apply secrets first
    Write-ColorOutput "Applying secrets..." "Yellow"
    kubectl apply -f "$DeploymentPath\k8s\secrets.yaml"
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Failed to apply secrets" "Red"
        return $false
    }
    
    # Apply database deployment
    Write-ColorOutput "Deploying database..." "Yellow"
    kubectl apply -f "$DeploymentPath\k8s\database-deployment.yaml"
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Failed to deploy database" "Red"
        return $false
    }
    
    # Wait for database to be ready
    Write-ColorOutput "Waiting for database to be ready..." "Yellow"
    kubectl wait --for=condition=available --timeout=300s deployment/database-deployment
    
    # Apply backend deployment
    Write-ColorOutput "Deploying backend..." "Yellow"
    kubectl apply -f "$DeploymentPath\k8s\backend-deployment.yaml"
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Failed to deploy backend" "Red"
        return $false
    }
    
    # Apply frontend deployment
    Write-ColorOutput "Deploying frontend..." "Yellow"
    kubectl apply -f "$DeploymentPath\k8s\frontend-deployment.yaml"
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Failed to deploy frontend" "Red"
        return $false
    }
    
    # Apply services
    Write-ColorOutput "Creating services..." "Yellow"
    kubectl apply -f "$DeploymentPath\k8s\services.yaml"
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Failed to create services" "Red"
        return $false
    }
    
    # Apply cert-manager (if exists)
    if (Test-Path "$DeploymentPath\k8s\cert-manager.yaml") {
        Write-ColorOutput "Applying cert-manager..." "Yellow"
        kubectl apply -f "$DeploymentPath\k8s\cert-manager.yaml"
    }
    
    # Apply ingress
    if (Test-Path "$DeploymentPath\k8s\ingress.yaml") {
        Write-ColorOutput "Applying ingress..." "Yellow"
        kubectl apply -f "$DeploymentPath\k8s\ingress.yaml"
    }
    
    Write-ColorOutput "✅ Deployment completed successfully!" "Green"
    return $true
}

function Wait-ForDeployment {
    Write-ColorOutput "⏳ WAITING FOR DEPLOYMENT TO BE READY" "Blue"
    Write-ColorOutput "======================================" "Blue"
    Write-Host ""
    
    $deployments = @("backend-deployment", "frontend-deployment", "database-deployment")
    
    foreach ($deployment in $deployments) {
        Write-ColorOutput "Waiting for $deployment..." "Yellow"
        kubectl wait --for=condition=available --timeout=600s deployment/$deployment
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ $deployment is ready" "Green"
        } else {
            Write-ColorOutput "⚠️ $deployment timed out or failed" "Yellow"
        }
    }
}

function Show-DeploymentLogs {
    Write-ColorOutput "📜 DEPLOYMENT LOGS" "Blue"
    Write-ColorOutput "==================" "Blue"
    Write-Host ""
    
    $service = Read-Host "Enter service name (backend/frontend/database) or press Enter for all"
    
    if (-not $service -or $service -eq "") {
        Write-ColorOutput "Backend logs:" "Yellow"
        kubectl logs -l app=backend --tail=50
        
        Write-Host ""
        Write-ColorOutput "Frontend logs:" "Yellow"
        kubectl logs -l app=frontend --tail=50
        
        Write-Host ""
        Write-ColorOutput "Database logs:" "Yellow"
        kubectl logs -l app=database --tail=50
    } else {
        Write-ColorOutput "$service logs:" "Yellow"
        kubectl logs -l app=$service --tail=100 -f
    }
}

function Check-Health {
    Write-ColorOutput "🏥 HEALTH CHECK" "Green"
    Write-ColorOutput "===============" "Green"
    Write-Host ""
    
    # Check pod status
    Write-ColorOutput "Pod status:" "Yellow"
    kubectl get pods -o wide
    
    Write-Host ""
    
    # Check service endpoints
    Write-ColorOutput "Service endpoints:" "Yellow"
    kubectl get endpoints
    
    Write-Host ""
    
    # Check ingress
    Write-ColorOutput "Ingress status:" "Yellow"
    kubectl get ingress
    
    Write-Host ""
    
    # Test backend health endpoint
    try {
        $backendService = kubectl get service backend-service -o jsonpath='{.spec.clusterIP}' 2>$null
        if ($backendService) {
            Write-ColorOutput "Testing backend health..." "Yellow"
            $response = Invoke-RestMethod -Uri "http://$backendService:8000/health" -TimeoutSec 10 -ErrorAction Stop
            Write-ColorOutput "✅ Backend health check passed" "Green"
        }
    }
    catch {
        Write-ColorOutput "⚠️ Backend health check failed: $_" "Yellow"
    }
}

function Scale-Deployment {
    Write-ColorOutput "📈 SCALING DEPLOYMENT" "Blue"
    Write-ColorOutput "=====================" "Blue"
    Write-Host ""
    
    $deployment = Read-Host "Enter deployment name (backend-deployment/frontend-deployment)"
    $replicas = Read-Host "Enter number of replicas"
    
    if ($deployment -and $replicas) {
        Write-ColorOutput "Scaling $deployment to $replicas replicas..." "Yellow"
        kubectl scale deployment/$deployment --replicas=$replicas
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Scaling completed" "Green"
            kubectl get deployment/$deployment
        } else {
            Write-ColorOutput "❌ Scaling failed" "Red"
        }
    }
}

function Rollback-Deployment {
    Write-ColorOutput "🔄 ROLLBACK DEPLOYMENT" "Yellow"
    Write-ColorOutput "======================" "Yellow"
    Write-Host ""
    
    $deployment = Read-Host "Enter deployment name (backend-deployment/frontend-deployment)"
    
    if ($deployment) {
        Write-ColorOutput "Rolling back $deployment..." "Yellow"
        kubectl rollout undo deployment/$deployment
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Rollback completed" "Green"
            kubectl rollout status deployment/$deployment
        } else {
            Write-ColorOutput "❌ Rollback failed" "Red"
        }
    }
}

function Start-FullDeployment {
    Write-ColorOutput "🚀 STARTING FULL PRODUCTION DEPLOYMENT" "Cyan"
    Write-ColorOutput "=======================================" "Cyan"
    Write-Host ""
    
    # Step 1: Validate readiness
    Write-ColorOutput "Step 1: Validating deployment readiness..." "Blue"
    if (-not (Validate-DeploymentReadiness)) {
        Write-ColorOutput "❌ Deployment readiness validation failed" "Red"
        Write-ColorOutput "Please resolve the issues above before deploying" "Yellow"
        return $false
    }
    
    Write-Host ""
    
    # Step 2: Build images
    Write-ColorOutput "Step 2: Building Docker images..." "Blue"
    if (-not (Build-DockerImages)) {
        Write-ColorOutput "❌ Docker image build failed" "Red"
        return $false
    }
    
    Write-Host ""
    
    # Step 3: Deploy to Kubernetes
    Write-ColorOutput "Step 3: Deploying to Kubernetes..." "Blue"
    if (-not (Deploy-ToKubernetes)) {
        Write-ColorOutput "❌ Kubernetes deployment failed" "Red"
        return $false
    }
    
    Write-Host ""
    
    # Step 4: Wait for deployment
    Write-ColorOutput "Step 4: Waiting for deployment to be ready..." "Blue"
    Wait-ForDeployment
    
    Write-Host ""
    
    # Step 5: Health check
    Write-ColorOutput "Step 5: Running health checks..." "Blue"
    Check-Health
    
    Write-Host ""
    Write-ColorOutput "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!" "Green"
    Write-ColorOutput "=====================================" "Green"
    Write-Host ""
    
    # Show access information
    $envContent = Get-Content $EnvFile -Raw
    if ($envContent -match "DOMAIN=(.+)") {
        $domain = $matches[1]
        Write-ColorOutput "🌐 Your application is now available at:" "Cyan"
        Write-ColorOutput "   Frontend: https://$domain" "White"
        Write-ColorOutput "   Backend:  https://api.$domain" "White"
    }
    
    Write-Host ""
    Write-ColorOutput "📊 Monitor your deployment with:" "Yellow"
    Write-ColorOutput "   .\scripts\deploy.ps1 -ShowStatus" "Gray"
    Write-ColorOutput "   .\scripts\deploy.ps1 -Logs" "Gray"
    Write-ColorOutput "   .\scripts\deploy.ps1 -Health" "Gray"
    
    return $true
}

function Show-MainMenu {
    Write-ColorOutput "🚀 PRODUCTION DEPLOYMENT MANAGER" "Cyan"
    Write-ColorOutput "=================================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "Choose deployment option:" "White"
    Write-ColorOutput "1. 🚀 Start full deployment" "Green"
    Write-ColorOutput "2. 🔍 Validate deployment readiness" "Yellow"
    Write-ColorOutput "3. 📊 Show deployment status" "Yellow"
    Write-ColorOutput "4. 📜 View logs" "Yellow"
    Write-ColorOutput "5. 🏥 Health check" "Yellow"
    Write-ColorOutput "6. 📈 Scale deployment" "Yellow"
    Write-ColorOutput "7. 🔄 Rollback deployment" "Yellow"
    Write-ColorOutput "8. 🚪 Exit" "Yellow"
    Write-Host ""
    
    $choice = Read-Host "Select option (1-8)"
    
    switch ($choice) {
        "1" { Start-FullDeployment }
        "2" { Validate-DeploymentReadiness }
        "3" { Show-DeploymentStatus }
        "4" { Show-DeploymentLogs }
        "5" { Check-Health }
        "6" { Scale-Deployment }
        "7" { Rollback-Deployment }
        "8" { Write-ColorOutput "👋 Goodbye!" "Green"; return }
        default { Write-ColorOutput "❌ Invalid option" "Red" }
    }
    
    if ($choice -ne "8") {
        Write-Host ""
        Read-Host "Press Enter to continue"
        Show-MainMenu
    }
}

# Main execution
Set-Location $ProjectRoot

if ($Deploy) {
    Start-FullDeployment
} elseif ($ValidateReadiness) {
    Validate-DeploymentReadiness
} elseif ($ShowStatus) {
    Show-DeploymentStatus
} elseif ($Rollback) {
    Rollback-Deployment
} elseif ($Scale) {
    Scale-Deployment
} elseif ($Logs) {
    Show-DeploymentLogs
} elseif ($Health) {
    Check-Health
} else {
    Show-MainMenu
}