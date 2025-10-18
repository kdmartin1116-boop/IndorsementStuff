# 🚀 Indorsement Platform - Windows PowerShell Deployment Script

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "staging", "rollback", "health", "status")]
    [string]$Action = "menu",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipChecks = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose = $false
)

# Configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir = Split-Path -Parent $ScriptRoot

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [ValidateSet("Info", "Success", "Warning", "Error")]
        [string]$Type = "Info"
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    switch ($Type) {
        "Info"    { Write-Host "[$timestamp] $Message" -ForegroundColor Cyan }
        "Success" { Write-Host "✅ $Message" -ForegroundColor Green }
        "Warning" { Write-Host "⚠️  $Message" -ForegroundColor Yellow }
        "Error"   { Write-Host "❌ $Message" -ForegroundColor Red }
    }
}

function Test-Prerequisites {
    Write-ColorOutput "Checking prerequisites..." "Info"
    
    # Check required tools
    $tools = @(
        @{Name="docker"; Command="docker --version"},
        @{Name="kubectl"; Command="kubectl version --client"},
        @{Name="npm"; Command="npm --version"}
    )
    
    foreach ($tool in $tools) {
        try {
            $null = Invoke-Expression $tool.Command 2>$null
            Write-ColorOutput "$($tool.Name) is available" "Success"
        }
        catch {
            Write-ColorOutput "$($tool.Name) is required but not installed" "Error"
            throw "Missing prerequisite: $($tool.Name)"
        }
    }
    
    # Check kubectl context
    try {
        $context = kubectl config current-context 2>$null
        Write-ColorOutput "kubectl context: $context" "Info"
    }
    catch {
        Write-ColorOutput "kubectl not connected to cluster" "Warning"
    }
    
    # Check Docker daemon
    try {
        docker info >$null 2>&1
        Write-ColorOutput "Docker daemon is running" "Success"
    }
    catch {
        Write-ColorOutput "Docker daemon is not running" "Error"
        throw "Docker daemon is not accessible"
    }
}

function Deploy-Backend {
    Write-ColorOutput "🔨 Building and deploying backend..." "Info"
    
    # Build Docker image
    Push-Location "$RootDir\backend"
    try {
        $gitCommit = git rev-parse --short HEAD 2>$null
        if (-not $gitCommit) { $gitCommit = "unknown" }
        
        $imageTag = "$gitCommit-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        
        Write-ColorOutput "Building Docker image with tag: $imageTag" "Info"
        docker build -t "indorsement-backend:$imageTag" -t "indorsement-backend:latest" -f Dockerfile.production .
        
        if ($LASTEXITCODE -ne 0) {
            throw "Docker build failed"
        }
        
        Write-ColorOutput "Docker image built successfully" "Success"
        
        # Save image tag for Kubernetes deployment
        $imageTag | Out-File -FilePath "$RootDir\deployment\backend-image-tag.txt" -Encoding UTF8
    }
    finally {
        Pop-Location
    }
}

function Deploy-Frontend {
    Write-ColorOutput "🌐 Building and deploying frontend..." "Info"
    
    Push-Location "$RootDir\frontend"
    try {
        # Install dependencies
        Write-ColorOutput "Installing frontend dependencies..." "Info"
        npm ci
        
        if ($LASTEXITCODE -ne 0) {
            throw "npm ci failed"
        }
        
        # Run tests
        Write-ColorOutput "Running frontend tests..." "Info"
        npm test -- --watchAll=false --passWithNoTests
        
        # Build for production
        Write-ColorOutput "Building frontend for production..." "Info"
        npm run build
        
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend build failed"
        }
        
        Write-ColorOutput "Frontend built successfully" "Success"
    }
    finally {
        Pop-Location
    }
}

function Deploy-Kubernetes {
    Write-ColorOutput "☸️ Deploying to Kubernetes..." "Info"
    
    # Create namespace if it doesn't exist
    $namespace = "indorsement-production"
    kubectl create namespace $namespace --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply ConfigMaps
    Write-ColorOutput "Applying ConfigMaps..." "Info"
    kubectl apply -f "$RootDir\deployment\k8s\configmaps.yaml" -n $namespace
    
    # Apply Secrets (if exists)
    $secretsFile = "$RootDir\deployment\k8s\secrets.yaml"
    if (Test-Path $secretsFile) {
        Write-ColorOutput "Applying Secrets..." "Info"
        kubectl apply -f $secretsFile -n $namespace
    } else {
        Write-ColorOutput "Secrets file not found - using template" "Warning"
        Write-ColorOutput "Please create secrets.yaml from secrets.yaml.template" "Warning"
    }
    
    # Update deployment with new image tag
    if (Test-Path "$RootDir\deployment\backend-image-tag.txt") {
        $imageTag = Get-Content "$RootDir\deployment\backend-image-tag.txt" -Raw
        $imageTag = $imageTag.Trim()
        
        Write-ColorOutput "Updating deployment with image tag: $imageTag" "Info"
        
        # Replace image tag in deployment file
        $deploymentContent = Get-Content "$RootDir\deployment\k8s\backend-deployment.yaml" -Raw
        $deploymentContent = $deploymentContent -replace "{{IMAGE_TAG}}", $imageTag
        $deploymentContent | kubectl apply -f - -n $namespace
    } else {
        Write-ColorOutput "Applying deployment without image tag replacement..." "Info"
        kubectl apply -f "$RootDir\deployment\k8s\backend-deployment.yaml" -n $namespace
    }
    
    # Apply services
    Write-ColorOutput "Applying Services and Ingress..." "Info"
    kubectl apply -f "$RootDir\deployment\k8s\backend-service.yaml" -n $namespace
    
    # Wait for rollout
    Write-ColorOutput "Waiting for deployment to complete..." "Info"
    kubectl rollout status deployment/indorsement-backend -n $namespace --timeout=300s
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "Kubernetes deployment completed successfully" "Success"
    } else {
        throw "Kubernetes deployment failed"
    }
}

function Test-Health {
    Write-ColorOutput "🔍 Checking application health..." "Info"
    
    # Try to get ingress URL
    try {
        $ingressHost = kubectl get ingress indorsement-ingress -n indorsement-production -o jsonpath='{.spec.rules[0].host}' 2>$null
        
        if ($ingressHost) {
            $healthUrl = "https://$ingressHost/health"
            Write-ColorOutput "Testing health endpoint: $healthUrl" "Info"
            
            $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 10 -UseBasicParsing
            
            if ($response.StatusCode -eq 200) {
                Write-ColorOutput "Backend is healthy" "Success"
                return $true
            }
        }
    }
    catch {
        Write-ColorOutput "External health check failed, trying port-forward..." "Warning"
    }
    
    # Fallback to port-forward
    try {
        Write-ColorOutput "Setting up port-forward for health check..." "Info"
        
        $portForwardJob = Start-Job -ScriptBlock {
            kubectl port-forward svc/indorsement-backend-service 3000:80 -n indorsement-production
        }
        
        Start-Sleep -Seconds 5
        
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 10 -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "Backend is healthy (via port-forward)" "Success"
            return $true
        }
    }
    catch {
        Write-ColorOutput "Health check failed: $_" "Error"
        return $false
    }
    finally {
        if ($portForwardJob) {
            Stop-Job $portForwardJob -ErrorAction SilentlyContinue
            Remove-Job $portForwardJob -ErrorAction SilentlyContinue
        }
    }
}

function Show-Status {
    Write-ColorOutput "📊 Current Deployment Status" "Info"
    Write-Host ""
    
    # Kubernetes resources
    Write-Host "🔧 Kubernetes Resources:" -ForegroundColor Yellow
    try {
        kubectl get pods,svc,ingress -n indorsement-production
    }
    catch {
        Write-ColorOutput "Failed to get Kubernetes resources" "Warning"
    }
    
    Write-Host ""
    
    # Recent logs
    Write-Host "📋 Recent Logs:" -ForegroundColor Yellow
    try {
        kubectl logs -n indorsement-production deployment/indorsement-backend --tail=10
    }
    catch {
        Write-ColorOutput "Failed to get logs" "Warning"
    }
}

function Invoke-Rollback {
    Write-ColorOutput "⏪ Rolling back deployment..." "Info"
    
    try {
        kubectl rollout undo deployment/indorsement-backend -n indorsement-production
        kubectl rollout status deployment/indorsement-backend -n indorsement-production
        Write-ColorOutput "Rollback completed successfully" "Success"
    }
    catch {
        Write-ColorOutput "Rollback failed: $_" "Error"
        throw
    }
}

function Deploy-Production {
    Write-ColorOutput "🚀 Starting Production Deployment" "Info"
    
    # Check environment file
    $envFile = "$RootDir\.env.production"
    if (-not (Test-Path $envFile)) {
        Write-ColorOutput "Production environment file not found" "Warning"
        Write-ColorOutput "Creating from template..." "Info"
        Copy-Item "$RootDir\.env.production.template" $envFile
        Write-ColorOutput "⚠️  Please edit .env.production with your actual values!" "Warning"
        Read-Host "Press Enter when you've updated the environment file"
    }
    
    try {
        # Prerequisites
        if (-not $SkipChecks) {
            Test-Prerequisites
        }
        
        # Build and deploy
        Deploy-Backend
        Deploy-Frontend
        Deploy-Kubernetes
        
        # Health check
        Write-ColorOutput "Performing post-deployment health check..." "Info"
        Start-Sleep -Seconds 10
        
        if (Test-Health) {
            Write-ColorOutput "🎉 Production deployment completed successfully!" "Success"
            
            Write-Host ""
            Write-ColorOutput "📋 Deployment Summary:" "Info"
            Write-ColorOutput "- Environment: production" "Info"
            Write-ColorOutput "- Backend: Deployed to Kubernetes" "Info"
            Write-ColorOutput "- Frontend: Built and ready for CDN" "Info"
            Write-ColorOutput "- Health Status: ✅ Healthy" "Info"
            
            Write-Host ""
            Write-ColorOutput "🔗 Useful Commands:" "Info"
            Write-ColorOutput "  Check pods: kubectl get pods -n indorsement-production" "Info"
            Write-ColorOutput "  View logs: kubectl logs -f deployment/indorsement-backend -n indorsement-production" "Info"
            Write-ColorOutput "  Port forward: kubectl port-forward svc/indorsement-backend-service 3000:80 -n indorsement-production" "Info"
        } else {
            Write-ColorOutput "Deployment completed but health check failed" "Warning"
        }
    }
    catch {
        Write-ColorOutput "Deployment failed: $_" "Error"
        throw
    }
}

function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host "🎯 Indorsement Platform - Windows PowerShell Deployment" -ForegroundColor Cyan
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1) Deploy to Production" -ForegroundColor White
    Write-Host "2) Health Check" -ForegroundColor White
    Write-Host "3) Show Status" -ForegroundColor White
    Write-Host "4) Rollback Deployment" -ForegroundColor White
    Write-Host "5) Test Prerequisites" -ForegroundColor White
    Write-Host "6) Exit" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Select option (1-6)"
    
    switch ($choice) {
        "1" { 
            Deploy-Production
            Read-Host "Press Enter to continue"
            Show-Menu
        }
        "2" { 
            Test-Health
            Read-Host "Press Enter to continue"
            Show-Menu
        }
        "3" { 
            Show-Status
            Read-Host "Press Enter to continue"
            Show-Menu
        }
        "4" { 
            Invoke-Rollback
            Read-Host "Press Enter to continue"
            Show-Menu
        }
        "5" { 
            Test-Prerequisites
            Read-Host "Press Enter to continue"
            Show-Menu
        }
        "6" { 
            Write-ColorOutput "Goodbye! 👋" "Info"
            exit 0
        }
        default { 
            Write-ColorOutput "Invalid option" "Warning"
            Start-Sleep -Seconds 1
            Show-Menu
        }
    }
}

# Main execution
try {
    if ($Verbose) {
        $VerbosePreference = "Continue"
    }
    
    switch ($Action) {
        "production" { Deploy-Production }
        "staging" { Deploy-Production }
        "health" { Test-Health }
        "status" { Show-Status }
        "rollback" { Invoke-Rollback }
        "menu" { Show-Menu }
        default { Show-Menu }
    }
}
catch {
    Write-ColorOutput "Script failed: $_" "Error"
    Write-ColorOutput "Stack trace: $($_.ScriptStackTrace)" "Error"
    exit 1
}