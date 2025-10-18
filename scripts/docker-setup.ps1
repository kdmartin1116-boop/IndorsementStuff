# 🐳 Docker Desktop Setup Helper

param(
    [switch]$CheckSystem = $false,
    [switch]$CheckDocker = $false,
    [switch]$CheckKubernetes = $false,
    [switch]$SetupGuide = $false,
    [switch]$TroubleshootDocker = $false,
    [switch]$InstallComponents = $false
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-WindowsFeatures {
    Write-ColorOutput "🔍 CHECKING WINDOWS FEATURES" "Blue"
    Write-ColorOutput "=============================" "Blue"
    Write-Host ""
    
    $features = @(
        @{Name="Microsoft-Windows-Subsystem-Linux"; DisplayName="WSL"; Required=$true},
        @{Name="VirtualMachinePlatform"; DisplayName="Virtual Machine Platform"; Required=$true},
        @{Name="Microsoft-Hyper-V"; DisplayName="Hyper-V"; Required=$false}
    )
    
    $allEnabled = $true
    
    foreach ($feature in $features) {
        try {
            $state = Get-WindowsOptionalFeature -Online -FeatureName $feature.Name -ErrorAction Stop
            if ($state.State -eq "Enabled") {
                Write-ColorOutput "✅ $($feature.DisplayName): Enabled" "Green"
            } else {
                $status = if ($feature.Required) { "❌" } else { "⚠️" }
                $color = if ($feature.Required) { "Red" } else { "Yellow" }
                Write-ColorOutput "$status $($feature.DisplayName): Disabled" $color
                if ($feature.Required) { $allEnabled = $false }
            }
        }
        catch {
            Write-ColorOutput "❌ $($feature.DisplayName): Could not check (may need admin rights)" "Red"
            if ($feature.Required) { $allEnabled = $false }
        }
    }
    
    Write-Host ""
    
    if (-not $allEnabled) {
        Write-ColorOutput "⚠️  Required Windows features are missing" "Yellow"
        Write-ColorOutput "💡 Run with -InstallComponents to enable required features" "Cyan"
    } else {
        Write-ColorOutput "✅ All required Windows features are enabled" "Green"
    }
    
    return $allEnabled
}

function Test-DockerInstallation {
    Write-ColorOutput "🐳 CHECKING DOCKER INSTALLATION" "Blue"
    Write-ColorOutput "===============================" "Blue"
    Write-Host ""
    
    $dockerOk = $true
    
    # Check if Docker is installed
    try {
        $dockerVersion = docker --version 2>$null
        Write-ColorOutput "✅ Docker CLI: $dockerVersion" "Green"
    }
    catch {
        Write-ColorOutput "❌ Docker CLI not found" "Red"
        Write-ColorOutput "💡 Download from: https://www.docker.com/products/docker-desktop/" "Yellow"
        return $false
    }
    
    # Check if Docker daemon is running
    try {
        $dockerInfo = docker info 2>$null
        Write-ColorOutput "✅ Docker daemon is running" "Green"
    }
    catch {
        Write-ColorOutput "❌ Docker daemon not running" "Red"
        Write-ColorOutput "💡 Start Docker Desktop application" "Yellow"
        $dockerOk = $false
    }
    
    # Check Docker Desktop version
    try {
        $dockerDesktopPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $dockerDesktopPath) {
            Write-ColorOutput "✅ Docker Desktop installed" "Green"
        } else {
            Write-ColorOutput "⚠️  Docker Desktop not found in standard location" "Yellow"
        }
    }
    catch {
        Write-ColorOutput "⚠️  Could not locate Docker Desktop" "Yellow"
    }
    
    return $dockerOk
}

function Test-KubernetesInDocker {
    Write-ColorOutput "☸️ CHECKING KUBERNETES IN DOCKER" "Blue"
    Write-ColorOutput "==================================" "Blue"
    Write-Host ""
    
    # Check kubectl availability
    try {
        $kubectlVersion = kubectl version --client --short 2>$null
        Write-ColorOutput "✅ kubectl CLI: Available" "Green"
    }
    catch {
        Write-ColorOutput "❌ kubectl not found" "Red"
        Write-ColorOutput "💡 kubectl is included with Docker Desktop when Kubernetes is enabled" "Yellow"
        return $false
    }
    
    # Check cluster connectivity
    try {
        $clusterInfo = kubectl cluster-info 2>$null
        $context = kubectl config current-context 2>$null
        
        if ($context -like "*docker-desktop*") {
            Write-ColorOutput "✅ Kubernetes cluster: Connected (Docker Desktop)" "Green"
            
            # Check nodes
            $nodes = kubectl get nodes --no-headers 2>$null
            if ($nodes) {
                $nodeCount = ($nodes -split "`n").Count
                Write-ColorOutput "✅ Kubernetes nodes: $nodeCount node(s) ready" "Green"
            }
            
            return $true
        } else {
            Write-ColorOutput "⚠️  Connected to cluster: $context (not Docker Desktop)" "Yellow"
            Write-ColorOutput "💡 Switch context to docker-desktop or enable Kubernetes in Docker Desktop" "Yellow"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Kubernetes cluster not accessible" "Red"
        Write-ColorOutput "💡 Enable Kubernetes in Docker Desktop Settings" "Yellow"
        return $false
    }
}

function Install-WindowsComponents {
    Write-ColorOutput "🛠️  INSTALLING REQUIRED WINDOWS COMPONENTS" "Green"
    Write-ColorOutput "==========================================" "Green"
    Write-Host ""
    
    # Check if running as administrator
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if (-not $isAdmin) {
        Write-ColorOutput "❌ This operation requires administrator privileges" "Red"
        Write-ColorOutput "💡 Right-click PowerShell and 'Run as Administrator'" "Yellow"
        return $false
    }
    
    try {
        Write-ColorOutput "📦 Enabling Windows Subsystem for Linux..." "Blue"
        dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
        
        Write-ColorOutput "📦 Enabling Virtual Machine Platform..." "Blue"
        dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
        
        Write-ColorOutput "✅ Windows components enabled successfully" "Green"
        Write-ColorOutput "🔄 A restart is required to complete the installation" "Yellow"
        
        $restart = Read-Host "Restart computer now? (y/N)"
        if ($restart -eq 'y' -or $restart -eq 'Y') {
            Write-ColorOutput "🔄 Restarting computer..." "Yellow"
            Restart-Computer -Force
        } else {
            Write-ColorOutput "⚠️  Please restart your computer manually to complete the setup" "Yellow"
        }
        
        return $true
    }
    catch {
        Write-ColorOutput "❌ Failed to install Windows components: $_" "Red"
        return $false
    }
}

function Show-DockerSetupGuide {
    Write-ColorOutput "🐳 DOCKER DESKTOP SETUP GUIDE" "Cyan"
    Write-ColorOutput "==============================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "📋 STEP-BY-STEP INSTALLATION:" "Yellow"
    Write-Host ""
    
    Write-ColorOutput "1. 🔧 Prepare Windows:" "White"
    Write-ColorOutput "   • Run: .\docker-setup.ps1 -InstallComponents" "Gray"
    Write-ColorOutput "   • Restart computer when prompted" "Gray"
    Write-Host ""
    
    Write-ColorOutput "2. 📥 Download Docker Desktop:" "White"
    Write-ColorOutput "   • Go to: https://www.docker.com/products/docker-desktop/" "Gray"
    Write-ColorOutput "   • Click 'Download for Windows'" "Gray"
    Write-ColorOutput "   • Run installer as Administrator" "Gray"
    Write-Host ""
    
    Write-ColorOutput "3. ⚙️ Configure Docker Desktop:" "White"
    Write-ColorOutput "   • Enable Kubernetes in Settings" "Gray"
    Write-ColorOutput "   • Set memory to 8GB+ (Settings → Resources)" "Gray"
    Write-ColorOutput "   • Apply and restart" "Gray"
    Write-Host ""
    
    Write-ColorOutput "4. ✅ Verify Installation:" "White"
    Write-ColorOutput "   • Run: .\docker-setup.ps1 -CheckDocker" "Gray"
    Write-ColorOutput "   • Run: .\docker-setup.ps1 -CheckKubernetes" "Gray"
    Write-Host ""
    
    Write-ColorOutput "🔗 HELPFUL LINKS:" "Cyan"
    Write-ColorOutput "   • Docker Desktop: https://www.docker.com/products/docker-desktop/" "Blue"
    Write-ColorOutput "   • WSL2 Update: https://aka.ms/wsl2kernel" "Blue"
    Write-ColorOutput "   • Troubleshooting: https://docs.docker.com/desktop/troubleshoot/" "Blue"
}

function Troubleshoot-Docker {
    Write-ColorOutput "🔧 DOCKER TROUBLESHOOTING" "Yellow"
    Write-ColorOutput "==========================" "Yellow"
    Write-Host ""
    
    Write-ColorOutput "🔍 COMMON ISSUES AND SOLUTIONS:" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "❌ Docker Desktop won't start:" "Red"
    Write-ColorOutput "   • Check Windows features are enabled" "Gray"
    Write-ColorOutput "   • Restart Docker Desktop as Administrator" "Gray"
    Write-ColorOutput "   • Reset Docker Desktop (Settings → Troubleshoot → Reset)" "Gray"
    Write-Host ""
    
    Write-ColorOutput "❌ Kubernetes stuck 'Starting':" "Red"
    Write-ColorOutput "   • Reset Kubernetes cluster (Settings → Kubernetes)" "Gray"
    Write-ColorOutput "   • Increase Docker memory allocation" "Gray"
    Write-ColorOutput "   • Check firewall/antivirus blocking Docker" "Gray"
    Write-Host ""
    
    Write-ColorOutput "❌ 'docker' command not found:" "Red"
    Write-ColorOutput "   • Restart PowerShell/Command Prompt" "Gray"
    Write-ColorOutput "   • Check Docker Desktop is running" "Gray"
    Write-ColorOutput "   • Reinstall Docker Desktop" "Gray"
    Write-Host ""
    
    Write-ColorOutput "🛠️ DIAGNOSTIC COMMANDS:" "Cyan"
    Write-ColorOutput "   docker system info" "Gray"
    Write-ColorOutput "   docker system events" "Gray"
    Write-ColorOutput "   kubectl config current-context" "Gray"
    Write-ColorOutput "   kubectl get nodes" "Gray"
}

function Show-MainMenu {
    Write-ColorOutput "🐳 DOCKER DESKTOP SETUP HELPER" "Cyan"
    Write-ColorOutput "===============================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "Choose an option:" "White"
    Write-ColorOutput "1. 🔍 Check system requirements" "Yellow"
    Write-ColorOutput "2. 🐳 Check Docker installation" "Yellow"
    Write-ColorOutput "3. ☸️ Check Kubernetes setup" "Yellow"
    Write-ColorOutput "4. 📋 Show setup guide" "Yellow"
    Write-ColorOutput "5. 🛠️ Install Windows components" "Yellow"
    Write-ColorOutput "6. 🔧 Troubleshooting guide" "Yellow"
    Write-ColorOutput "7. 🚪 Exit" "Yellow"
    Write-Host ""
    
    $choice = Read-Host "Select option (1-7)"
    
    switch ($choice) {
        "1" { Test-WindowsFeatures }
        "2" { Test-DockerInstallation }
        "3" { Test-KubernetesInDocker }
        "4" { Show-DockerSetupGuide }
        "5" { Install-WindowsComponents }
        "6" { Troubleshoot-Docker }
        "7" { Write-ColorOutput "👋 Goodbye!" "Green"; return }
        default { Write-ColorOutput "❌ Invalid option" "Red" }
    }
    
    Write-Host ""
    Read-Host "Press Enter to continue"
    Show-MainMenu
}

# Main execution
if ($CheckSystem) {
    Test-WindowsFeatures
} elseif ($CheckDocker) {
    Test-DockerInstallation
} elseif ($CheckKubernetes) {
    Test-KubernetesInDocker
} elseif ($SetupGuide) {
    Show-DockerSetupGuide
} elseif ($TroubleshootDocker) {
    Troubleshoot-Docker
} elseif ($InstallComponents) {
    Install-WindowsComponents
} else {
    Show-MainMenu
}