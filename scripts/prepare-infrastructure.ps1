# ☸️ Infrastructure Preparation Helper

param(
    [switch]$CheckKubernetes = $false,
    [switch]$CheckDocker = $false,
    [switch]$SetupLocal = $false,
    [switch]$ShowRequirements = $false,
    [switch]$TestConnectivity = $false
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-DockerDesktop {
    Write-ColorOutput "🐳 Checking Docker Desktop..." "Blue"
    
    try {
        $dockerVersion = docker --version 2>$null
        Write-ColorOutput "✅ Docker installed: $dockerVersion" "Green"
        
        docker info >$null 2>&1
        Write-ColorOutput "✅ Docker daemon is running" "Green"
        
        # Check if Kubernetes is enabled in Docker Desktop
        $kubeContext = kubectl config current-context 2>$null
        if ($kubeContext -like "*docker-desktop*") {
            Write-ColorOutput "✅ Docker Desktop Kubernetes is active" "Green"
            return $true
        } else {
            Write-ColorOutput "⚠️  Docker Desktop Kubernetes not active" "Yellow"
            Write-ColorOutput "💡 Enable Kubernetes in Docker Desktop settings" "Yellow"
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Docker issue: $_" "Red"
        return $false
    }
}

function Test-KubernetesCluster {
    Write-ColorOutput "☸️ Checking Kubernetes cluster..." "Blue"
    
    try {
        $clusterInfo = kubectl cluster-info 2>$null
        Write-ColorOutput "✅ Kubernetes cluster accessible" "Green"
        
        $nodes = kubectl get nodes --no-headers 2>$null
        $nodeCount = ($nodes | Measure-Object).Count
        Write-ColorOutput "✅ Cluster has $nodeCount node(s)" "Green"
        
        # Check node resources
        $resources = kubectl top nodes 2>$null
        if ($resources) {
            Write-ColorOutput "✅ Node metrics available" "Green"
        } else {
            Write-ColorOutput "⚠️  Node metrics not available (metrics-server may not be installed)" "Yellow"
        }
        
        return $true
    }
    catch {
        Write-ColorOutput "❌ Kubernetes cluster not accessible: $_" "Red"
        return $false
    }
}

function Show-InfrastructureRequirements {
    Write-ColorOutput "☸️ INFRASTRUCTURE REQUIREMENTS" "Yellow"
    Write-ColorOutput "===============================" "Yellow"
    Write-Host ""
    
    Write-ColorOutput "🎯 DEVELOPMENT/TESTING (Local):" "Cyan"
    Write-ColorOutput "├── Docker Desktop with Kubernetes enabled" "Gray"
    Write-ColorOutput "├── 8GB+ RAM available" "Gray"
    Write-ColorOutput "├── 20GB+ disk space" "Gray"
    Write-ColorOutput "└── Administrative privileges" "Gray"
    Write-Host ""
    
    Write-ColorOutput "🏭 PRODUCTION (Cloud):" "Cyan"
    Write-ColorOutput "├── Kubernetes Cluster (3+ nodes)" "Gray"
    Write-ColorOutput "│   ├── 4 vCPU, 8GB RAM per node (minimum)" "Gray"
    Write-ColorOutput "│   ├── 100GB+ storage per node" "Gray"
    Write-ColorOutput "│   └── Load balancer support" "Gray"
    Write-ColorOutput "├── Managed Database" "Gray"
    Write-ColorOutput "│   ├── PostgreSQL 14+ (4 vCPU, 16GB RAM)" "Gray"
    Write-ColorOutput "│   ├── 500GB+ storage" "Gray"
    Write-ColorOutput "│   └── Automated backups" "Gray"
    Write-ColorOutput "├── Redis Cache" "Gray"
    Write-ColorOutput "│   ├── Redis 7.0+ (2 vCPU, 8GB RAM)" "Gray"
    Write-ColorOutput "│   └── High availability setup" "Gray"
    Write-ColorOutput "├── Object Storage" "Gray"
    Write-ColorOutput "│   ├── S3, Azure Blob, or GCS" "Gray"
    Write-ColorOutput "│   └── CDN integration" "Gray"
    Write-ColorOutput "└── SSL Certificates" "Gray"
    Write-ColorOutput "    ├── Wildcard SSL for *.indorsement.com" "Gray"
    Write-ColorOutput "    └── Certificate management (cert-manager)" "Gray"
}

function Setup-LocalEnvironment {
    Write-ColorOutput "🛠️  SETTING UP LOCAL DEVELOPMENT ENVIRONMENT" "Green"
    Write-ColorOutput "=============================================" "Green"
    Write-Host ""
    
    # Check prerequisites
    if (-not (Test-DockerDesktop)) {
        Write-ColorOutput "❌ Please install and configure Docker Desktop first" "Red"
        Write-ColorOutput "💡 Download from: https://www.docker.com/products/docker-desktop" "Yellow"
        return $false
    }
    
    if (-not (Test-KubernetesCluster)) {
        Write-ColorOutput "❌ Please enable Kubernetes in Docker Desktop" "Red"
        Write-ColorOutput "💡 Docker Desktop → Settings → Kubernetes → Enable Kubernetes" "Yellow"
        return $false
    }
    
    # Install required Kubernetes components
    Write-ColorOutput "📦 Installing required Kubernetes components..." "Blue"
    
    try {
        # Install ingress-nginx
        Write-ColorOutput "Installing ingress-nginx..." "Blue"
        kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
        
        # Wait for ingress controller
        Write-ColorOutput "Waiting for ingress controller to be ready..." "Blue"
        kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=300s
        
        # Install metrics-server (for local development)
        Write-ColorOutput "Installing metrics-server..." "Blue"
        kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
        
        # Patch metrics-server for local development
        kubectl patch deployment metrics-server -n kube-system --type='merge' -p='{"spec":{"template":{"spec":{"containers":[{"name":"metrics-server","args":["--cert-dir=/tmp","--secure-port=4443","--kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname","--kubelet-use-node-status-port","--metric-resolution=15s","--kubelet-insecure-tls"]}]}}}}'
        
        Write-ColorOutput "✅ Local Kubernetes environment setup complete!" "Green"
        return $true
    }
    catch {
        Write-ColorOutput "❌ Failed to setup local environment: $_" "Red"
        return $false
    }
}

function Test-ExternalConnectivity {
    Write-ColorOutput "🌐 TESTING EXTERNAL CONNECTIVITY" "Blue"
    Write-ColorOutput "=================================" "Blue"
    Write-Host ""
    
    $services = @(
        @{Name="Docker Hub"; Url="https://registry-1.docker.io"; Required=$true},
        @{Name="Kubernetes manifests"; Url="https://raw.githubusercontent.com"; Required=$true},
        @{Name="NPM Registry"; Url="https://registry.npmjs.org"; Required=$true},
        @{Name="Google APIs"; Url="https://accounts.google.com"; Required=$false},
        @{Name="OpenAI API"; Url="https://api.openai.com"; Required=$false}
    )
    
    $allPassed = $true
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri $service.Url -Method HEAD -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
            $status = if ($response.StatusCode -eq 200) { "✅" } else { "⚠️" }
            Write-ColorOutput "$status $($service.Name)" "Green"
        }
        catch {
            $status = if ($service.Required) { "❌" } else { "⚠️" }
            $color = if ($service.Required) { "Red" } else { "Yellow" }
            Write-ColorOutput "$status $($service.Name) - $($_.Exception.Message)" $color
            
            if ($service.Required) {
                $allPassed = $false
            }
        }
    }
    
    if ($allPassed) {
        Write-ColorOutput "✅ All connectivity tests passed!" "Green"
    } else {
        Write-ColorOutput "❌ Some required services are not accessible" "Red"
        Write-ColorOutput "💡 Check firewall/proxy settings" "Yellow"
    }
    
    return $allPassed
}

function Show-NextSteps {
    Write-ColorOutput "🎯 INFRASTRUCTURE PREPARATION STEPS" "Cyan"
    Write-ColorOutput "====================================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "1. 🐳 Setup Docker & Kubernetes:" "Yellow"
    Write-ColorOutput "   .\prepare-infrastructure.ps1 -SetupLocal" "Gray"
    Write-Host ""
    
    Write-ColorOutput "2. ✅ Verify Infrastructure:" "Yellow"
    Write-ColorOutput "   .\prepare-infrastructure.ps1 -CheckDocker" "Gray"
    Write-ColorOutput "   .\prepare-infrastructure.ps1 -CheckKubernetes" "Gray"
    Write-Host ""
    
    Write-ColorOutput "3. 🌐 Test Connectivity:" "Yellow"
    Write-ColorOutput "   .\prepare-infrastructure.ps1 -TestConnectivity" "Gray"
    Write-Host ""
    
    Write-ColorOutput "4. 📋 View Requirements:" "Yellow"
    Write-ColorOutput "   .\prepare-infrastructure.ps1 -ShowRequirements" "Gray"
}

# Main execution
if ($CheckDocker) {
    Test-DockerDesktop
} elseif ($CheckKubernetes) {
    Test-KubernetesCluster
} elseif ($SetupLocal) {
    Setup-LocalEnvironment
} elseif ($ShowRequirements) {
    Show-InfrastructureRequirements
} elseif ($TestConnectivity) {
    Test-ExternalConnectivity
} else {
    Show-NextSteps
}