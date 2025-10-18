# 🎛️ Deployment Dashboard

Clear-Host

$ProjectRoot = "C:\Users\xxcha\OneDrive\Desktop\IndorsementStuff\new"
$EnvFile = "$ProjectRoot\.env.production"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Show-Header {
    Write-ColorOutput "╔══════════════════════════════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║                    🚀 INDORSEMENT PLATFORM                          ║" "Cyan"
    Write-ColorOutput "║                     Production Deployment Dashboard                   ║" "Cyan"
    Write-ColorOutput "╚══════════════════════════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
}

function Check-StepStatus {
    param([string]$StepName, [scriptblock]$CheckScript)
    
    try {
        $result = & $CheckScript
        if ($result) {
            Write-ColorOutput "✅ $StepName" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ $StepName" "Red"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ $StepName (Error: $_)" "Red"
        return $false
    }
}

function Show-DeploymentProgress {
    Write-ColorOutput "📋 DEPLOYMENT PROGRESS CHECKLIST" "Yellow"
    Write-ColorOutput "==================================" "Yellow"
    Write-Host ""
    
    $completedSteps = 0
    $totalSteps = 4
    
    # Step 1: Docker Desktop with Kubernetes
    Write-ColorOutput "STEP 1: Infrastructure Setup" "Cyan"
    Write-ColorOutput "─────────────────────────────" "Cyan"
    
    $dockerOk = Check-StepStatus "Docker Desktop installed and running" {
        try {
            docker --version | Out-Null
            $true
        } catch { $false }
    }
    
    $kubernetesOk = Check-StepStatus "Kubernetes enabled and accessible" {
        try {
            kubectl version --client | Out-Null
            kubectl get nodes 2>$null | Out-Null
            $true
        } catch { $false }
    }
    
    if ($dockerOk -and $kubernetesOk) {
        $completedSteps++
        Write-ColorOutput "✅ Step 1 Complete!" "Green"
    } else {
        Write-ColorOutput "🔧 Step 1 Action Required:" "Yellow"
        Write-ColorOutput "   Run: .\scripts\docker-setup.ps1 -InteractiveSetup" "Gray"
    }
    
    Write-Host ""
    
    # Step 2: Credentials Configuration
    Write-ColorOutput "STEP 2: Credentials Configuration" "Cyan"
    Write-ColorOutput "─────────────────────────────────" "Cyan"
    
    $oauthOk = $false
    $cloudOk = $false
    $servicesOk = $false
    
    if (Test-Path $EnvFile) {
        $envContent = Get-Content $EnvFile -Raw
        
        $oauthOk = Check-StepStatus "OAuth credentials (Google, Microsoft)" {
            $envContent -match "OAUTH_GOOGLE_CLIENT_ID=.+\.apps\.googleusercontent\.com" -and 
            $envContent -notmatch "your-google-oauth-client-id"
        }
        
        $cloudOk = Check-StepStatus "Cloud services (AWS/Azure)" {
            $envContent -match "AWS_ACCESS_KEY_ID=AKIA.+" -and 
            $envContent -notmatch "your-aws-access-key-id"
        }
        
        $servicesOk = Check-StepStatus "External services (SendGrid, OpenAI)" {
            $envContent -match "SMTP_PASS=SG\..+" -and 
            $envContent -notmatch "your-sendgrid-api-key"
        }
    } else {
        Write-ColorOutput "❌ Environment file not found" "Red"
    }
    
    if ($oauthOk -and $cloudOk -and $servicesOk) {
        $completedSteps++
        Write-ColorOutput "✅ Step 2 Complete!" "Green"
    } else {
        Write-ColorOutput "🔧 Step 2 Action Required:" "Yellow"
        Write-ColorOutput "   Run: .\scripts\configure-credentials.ps1 -InteractiveSetup" "Gray"
    }
    
    Write-Host ""
    
    # Step 3: Domain and SSL Setup
    Write-ColorOutput "STEP 3: Domain and SSL Configuration" "Cyan"
    Write-ColorOutput "────────────────────────────────────" "Cyan"
    
    $domainOk = $false
    $sslOk = $false
    
    if (Test-Path $EnvFile) {
        $envContent = Get-Content $EnvFile -Raw
        
        $domainOk = Check-StepStatus "Production domain configured" {
            $envContent -match "DOMAIN=.+" -and 
            $envContent -notmatch "DOMAIN=localhost" -and
            $envContent -match "FRONTEND_URL=https://"
        }
        
        $sslOk = Check-StepStatus "SSL certificates configured" {
            (Test-Path "$ProjectRoot\deployment\k8s\cert-manager.yaml") -or 
            (Test-Path "$ProjectRoot\deployment\k8s\tls-secret.yaml")
        }
    }
    
    if ($domainOk -and $sslOk) {
        $completedSteps++
        Write-ColorOutput "✅ Step 3 Complete!" "Green"
    } else {
        Write-ColorOutput "🔧 Step 3 Action Required:" "Yellow"
        Write-ColorOutput "   Run: .\scripts\configure-domain-ssl.ps1 -InteractiveSetup" "Gray"
    }
    
    Write-Host ""
    
    # Step 4: Deployment
    Write-ColorOutput "STEP 4: Production Deployment" "Cyan"
    Write-ColorOutput "─────────────────────────────" "Cyan"
    
    $imagesOk = Check-StepStatus "Docker images built" {
        try {
            $images = docker images --format "{{.Repository}}" | Select-String "indorsement"
            $images.Count -gt 0
        } catch { $false }
    }
    
    $deployedOk = Check-StepStatus "Application deployed to Kubernetes" {
        try {
            kubectl get deployment backend-deployment 2>$null | Out-Null
            kubectl get deployment frontend-deployment 2>$null | Out-Null
            $true
        } catch { $false }
    }
    
    if ($imagesOk -and $deployedOk) {
        $completedSteps++
        Write-ColorOutput "✅ Step 4 Complete!" "Green"
    } else {
        Write-ColorOutput "🔧 Step 4 Action Required:" "Yellow"
        Write-ColorOutput "   Run: .\scripts\deploy.ps1 -Deploy" "Gray"
    }
    
    Write-Host ""
    
    # Overall Progress
    Write-ColorOutput "📊 OVERALL PROGRESS" "Magenta"
    Write-ColorOutput "===================" "Magenta"
    
    $progressPercent = ($completedSteps / $totalSteps) * 100
    $progressBar = "█" * [math]::Round($progressPercent / 10)
    $emptyBar = "░" * (10 - [math]::Round($progressPercent / 10))
    
    Write-ColorOutput "$completedSteps/$totalSteps steps completed ($([math]::Round($progressPercent))%)" "White"
    Write-ColorOutput "[$progressBar$emptyBar]" "$(if ($progressPercent -eq 100) { 'Green' } elseif ($progressPercent -ge 75) { 'Yellow' } else { 'Red' })"
    Write-Host ""
    
    if ($completedSteps -eq $totalSteps) {
        Write-ColorOutput "🎉 DEPLOYMENT COMPLETE!" "Green"
        Write-ColorOutput "========================" "Green"
        
        if (Test-Path $EnvFile) {
            $envContent = Get-Content $EnvFile -Raw
            if ($envContent -match "DOMAIN=(.+)") {
                $domain = $matches[1]
                Write-ColorOutput "🌐 Your application is live at:" "Cyan"
                Write-ColorOutput "   https://$domain" "White"
            }
        }
    }
    
    return $completedSteps, $totalSteps
}

function Show-QuickActions {
    Write-ColorOutput "⚡ QUICK ACTIONS" "Yellow"
    Write-ColorOutput "================" "Yellow"
    Write-Host ""
    
    Write-ColorOutput "Infrastructure:" "Cyan"
    Write-ColorOutput "  1. Setup Docker & Kubernetes     → .\scripts\docker-setup.ps1" "Gray"
    Write-Host ""
    
    Write-ColorOutput "Configuration:" "Cyan"
    Write-ColorOutput "  2. Configure credentials          → .\scripts\configure-credentials.ps1" "Gray"
    Write-ColorOutput "  3. Setup domain & SSL            → .\scripts\configure-domain-ssl.ps1" "Gray"
    Write-Host ""
    
    Write-ColorOutput "Deployment:" "Cyan"
    Write-ColorOutput "  4. Deploy to production          → .\scripts\deploy.ps1" "Gray"
    Write-ColorOutput "  5. Check deployment status       → .\scripts\deploy.ps1 -ShowStatus" "Gray"
    Write-ColorOutput "  6. View application logs         → .\scripts\deploy.ps1 -Logs" "Gray"
    Write-Host ""
    
    Write-ColorOutput "Monitoring:" "Cyan"
    Write-ColorOutput "  7. Run health checks             → .\scripts\deploy.ps1 -Health" "Gray"
    Write-ColorOutput "  8. Scale application             → .\scripts\deploy.ps1 -Scale" "Gray"
    Write-Host ""
}

function Show-SystemInfo {
    Write-ColorOutput "💻 SYSTEM INFORMATION" "Blue"
    Write-ColorOutput "=====================" "Blue"
    Write-Host ""
    
    try {
        $dockerVersion = docker --version 2>$null
        Write-ColorOutput "Docker: $(if ($dockerVersion) { $dockerVersion } else { 'Not installed' })" "White"
    } catch {
        Write-ColorOutput "Docker: Not installed" "Red"
    }
    
    try {
        $kubectlVersion = kubectl version --client --short 2>$null
        Write-ColorOutput "kubectl: $(if ($kubectlVersion) { $kubectlVersion } else { 'Not installed' })" "White"
    } catch {
        Write-ColorOutput "kubectl: Not installed" "Red"
    }
    
    try {
        $nodeVersion = node --version 2>$null
        Write-ColorOutput "Node.js: $(if ($nodeVersion) { $nodeVersion } else { 'Not installed' })" "White"
    } catch {
        Write-ColorOutput "Node.js: Not installed" "Red"
    }
    
    try {
        $pythonVersion = python --version 2>$null
        Write-ColorOutput "Python: $(if ($pythonVersion) { $pythonVersion } else { 'Not installed' })" "White"
    } catch {
        Write-ColorOutput "Python: Not installed" "Red"
    }
    
    Write-Host ""
}

function Show-NextSteps {
    param($completedSteps, $totalSteps)
    
    if ($completedSteps -lt $totalSteps) {
        Write-ColorOutput "🎯 NEXT STEPS" "Green"
        Write-ColorOutput "==============" "Green"
        Write-Host ""
        
        switch ($completedSteps) {
            0 {
                Write-ColorOutput "1. Install Docker Desktop with Kubernetes enabled" "Yellow"
                Write-ColorOutput "   Command: .\scripts\docker-setup.ps1 -InteractiveSetup" "Gray"
            }
            1 {
                Write-ColorOutput "2. Configure OAuth, AWS, and service credentials" "Yellow"
                Write-ColorOutput "   Command: .\scripts\configure-credentials.ps1 -InteractiveSetup" "Gray"
            }
            2 {
                Write-ColorOutput "3. Set up your production domain and SSL certificates" "Yellow"
                Write-ColorOutput "   Command: .\scripts\configure-domain-ssl.ps1 -InteractiveSetup" "Gray"
            }
            3 {
                Write-ColorOutput "4. Deploy your application to production!" "Yellow"
                Write-ColorOutput "   Command: .\scripts\deploy.ps1 -Deploy" "Gray"
            }
        }
        Write-Host ""
    }
}

function Show-MainMenu {
    Write-ColorOutput "🎛️ DASHBOARD MENU" "Cyan"
    Write-ColorOutput "==================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "Choose an action:" "White"
    Write-ColorOutput "1. 🔄 Refresh dashboard" "Yellow"
    Write-ColorOutput "2. 🐳 Setup Docker & Kubernetes" "Yellow"
    Write-ColorOutput "3. 🔑 Configure credentials" "Yellow"
    Write-ColorOutput "4. 🌐 Setup domain & SSL" "Yellow"
    Write-ColorOutput "5. 🚀 Deploy application" "Yellow"
    Write-ColorOutput "6. 📊 Show deployment status" "Yellow"
    Write-ColorOutput "7. 📚 View setup guides" "Yellow"
    Write-ColorOutput "8. 🚪 Exit" "Yellow"
    Write-Host ""
    
    $choice = Read-Host "Select option (1-8)"
    
    switch ($choice) {
        "1" { 
            Clear-Host
            Show-Dashboard
        }
        "2" { 
            & "$ProjectRoot\scripts\docker-setup.ps1"
            Read-Host "Press Enter to continue"
            Clear-Host
            Show-Dashboard
        }
        "3" { 
            & "$ProjectRoot\scripts\configure-credentials.ps1"
            Read-Host "Press Enter to continue"
            Clear-Host
            Show-Dashboard
        }
        "4" { 
            & "$ProjectRoot\scripts\configure-domain-ssl.ps1"
            Read-Host "Press Enter to continue"
            Clear-Host
            Show-Dashboard
        }
        "5" { 
            & "$ProjectRoot\scripts\deploy.ps1"
            Read-Host "Press Enter to continue"
            Clear-Host
            Show-Dashboard
        }
        "6" { 
            & "$ProjectRoot\scripts\deploy.ps1" -ShowStatus
            Read-Host "Press Enter to continue"
            Clear-Host
            Show-Dashboard
        }
        "7" {
            Write-ColorOutput "📚 Available guides:" "Cyan"
            Write-ColorOutput "• Docker Setup: DOCKER_SETUP_GUIDE.md" "Gray"
            Write-ColorOutput "• Credentials: CREDENTIAL_SETUP_GUIDE.md" "Gray"
            Write-ColorOutput "• Domain & SSL: Configure domain and certificates" "Gray"
            Write-ColorOutput "• Deployment: Full production deployment process" "Gray"
            Read-Host "Press Enter to continue"
            Clear-Host
            Show-Dashboard
        }
        "8" { 
            Write-ColorOutput "👋 Thanks for using the Indorsement Platform!" "Green"
            return
        }
        default { 
            Write-ColorOutput "❌ Invalid option" "Red"
            Start-Sleep 2
            Clear-Host
            Show-Dashboard
        }
    }
}

function Show-Dashboard {
    Show-Header
    $completed, $total = Show-DeploymentProgress
    Show-SystemInfo
    Show-QuickActions
    Show-NextSteps $completed $total
    Show-MainMenu
}

# Start the dashboard
Show-Dashboard