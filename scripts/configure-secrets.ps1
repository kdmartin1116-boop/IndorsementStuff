# 🔐 Kubernetes Secrets Configuration Helper

param(
    [switch]$ValidateSecrets = $false,
    [switch]$ShowRequired = $false,
    [switch]$CreateNamespace = $false,
    [switch]$ApplySecrets = $false
)

$SecretsFile = "C:\Users\xxcha\OneDrive\Desktop\IndorsementStuff\new\deployment\k8s\secrets.yaml"
$Namespace = "indorsement-production"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-KubernetesAccess {
    try {
        $null = kubectl cluster-info 2>$null
        return $true
    }
    catch {
        return $false
    }
}

function Show-RequiredSecrets {
    Write-ColorOutput "🔐 KUBERNETES SECRETS CONFIGURATION" "Yellow"
    Write-ColorOutput "====================================" "Yellow"
    Write-Host ""
    
    Write-ColorOutput "📋 CRITICAL SECRETS TO UPDATE:" "Cyan"
    Write-Host ""
    
    $secrets = @(
        @{Name="OAuth Credentials"; Keys=@("google-client-id", "google-client-secret"); Required=$true},
        @{Name="AWS Credentials"; Keys=@("aws-access-key-id", "aws-secret-access-key"); Required=$true},
        @{Name="Email Service"; Keys=@("smtp-pass"); Required=$true},
        @{Name="AI Services"; Keys=@("openai-api-key"); Required=$false},
        @{Name="Monitoring"; Keys=@("sentry-dsn", "new-relic-license-key"); Required=$false},
        @{Name="Push Notifications"; Keys=@("fcm-server-key", "apns-private-key"); Required=$false}
    )
    
    foreach ($secret in $secrets) {
        $status = if ($secret.Required) { "🔴 REQUIRED" } else { "🟡 OPTIONAL" }
        Write-ColorOutput "$status $($secret.Name)" "White"
        foreach ($key in $secret.Keys) {
            Write-ColorOutput "   - $key" "Gray"
        }
        Write-Host ""
    }
    
    Write-ColorOutput "💡 SETUP INSTRUCTIONS:" "Green"
    Write-ColorOutput "1. Edit: deployment\k8s\secrets.yaml" "Gray"
    Write-ColorOutput "2. Replace 'your-*' placeholders with actual values" "Gray"
    Write-ColorOutput "3. Run: .\configure-secrets.ps1 -ValidateSecrets" "Gray"
    Write-ColorOutput "4. Run: .\configure-secrets.ps1 -ApplySecrets" "Gray"
}

function Validate-Secrets {
    if (-not (Test-Path $SecretsFile)) {
        Write-ColorOutput "❌ secrets.yaml file not found!" "Red"
        return $false
    }
    
    Write-ColorOutput "🔍 VALIDATING KUBERNETES SECRETS" "Blue"
    Write-ColorOutput "=================================" "Blue"
    Write-Host ""
    
    $content = Get-Content $SecretsFile -Raw
    $issues = @()
    
    # Check for placeholder values
    $placeholders = @(
        "CHANGE_THIS_PASSWORD",
        "CHANGE_THIS_",
        "your-google-",
        "your-aws-",
        "your-sendgrid-",
        "sk-your-openai"
    )
    
    foreach ($placeholder in $placeholders) {
        if ($content -match $placeholder) {
            $issues += "❌ Found placeholder: $placeholder"
        }
    }
    
    # Check for required base64 encoded values (certificates)
    if ($content -match "LS0tLS1CRUdJTi.*") {
        Write-ColorOutput "✅ Found base64 encoded certificate data" "Green"
    } else {
        $issues += "⚠️  No base64 certificate data found (may need SSL certificates)"
    }
    
    if ($issues.Count -eq 0) {
        Write-ColorOutput "✅ Secrets validation passed!" "Green"
        return $true
    } else {
        Write-ColorOutput "⚠️  Secrets validation issues:" "Yellow"
        foreach ($issue in $issues) {
            Write-ColorOutput "   $issue" "Red"
        }
        return $false
    }
}

function Create-Namespace {
    if (-not (Test-KubernetesAccess)) {
        Write-ColorOutput "❌ Kubernetes cluster not accessible!" "Red"
        return $false
    }
    
    Write-ColorOutput "🏗️  Creating Kubernetes namespace: $Namespace" "Blue"
    
    try {
        $result = kubectl create namespace $Namespace --dry-run=client -o yaml | kubectl apply -f -
        Write-ColorOutput "✅ Namespace created/updated successfully" "Green"
        return $true
    }
    catch {
        Write-ColorOutput "❌ Failed to create namespace: $_" "Red"
        return $false
    }
}

function Apply-Secrets {
    if (-not (Test-KubernetesAccess)) {
        Write-ColorOutput "❌ Kubernetes cluster not accessible!" "Red"
        Write-ColorOutput "💡 Make sure kubectl is configured and cluster is running" "Yellow"
        return $false
    }
    
    if (-not (Test-Path $SecretsFile)) {
        Write-ColorOutput "❌ secrets.yaml file not found!" "Red"
        return $false
    }
    
    Write-ColorOutput "🚀 APPLYING KUBERNETES SECRETS" "Green"
    Write-ColorOutput "===============================" "Green"
    Write-Host ""
    
    # Create namespace first
    if (-not (Create-Namespace)) {
        return $false
    }
    
    try {
        Write-ColorOutput "📦 Applying secrets to namespace: $Namespace" "Blue"
        $result = kubectl apply -f $SecretsFile -n $Namespace
        
        Write-ColorOutput "✅ Secrets applied successfully!" "Green"
        Write-Host ""
        
        # Verify secrets were created
        Write-ColorOutput "🔍 Verifying created secrets:" "Blue"
        kubectl get secrets -n $Namespace | Select-String "indorsement"
        
        return $true
    }
    catch {
        Write-ColorOutput "❌ Failed to apply secrets: $_" "Red"
        return $false
    }
}

function Show-NextSteps {
    Write-ColorOutput "🎯 KUBERNETES SECRETS SETUP STEPS" "Cyan"
    Write-ColorOutput "==================================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "1. 📝 Configure Secrets:" "Yellow"
    Write-ColorOutput "   .\configure-secrets.ps1 -ShowRequired" "Gray"
    Write-ColorOutput "   # Edit deployment\k8s\secrets.yaml with your values" "Gray"
    Write-Host ""
    
    Write-ColorOutput "2. ✅ Validate Configuration:" "Yellow"
    Write-ColorOutput "   .\configure-secrets.ps1 -ValidateSecrets" "Gray"
    Write-Host ""
    
    Write-ColorOutput "3. 🚀 Apply to Kubernetes:" "Yellow"
    Write-ColorOutput "   .\configure-secrets.ps1 -ApplySecrets" "Gray"
    Write-Host ""
    
    Write-ColorOutput "⚠️  SECURITY REMINDER:" "Red"
    Write-ColorOutput "   - Never commit secrets.yaml to version control" "Red"
    Write-ColorOutput "   - Add secrets.yaml to .gitignore" "Red"
    Write-ColorOutput "   - Rotate secrets regularly in production" "Red"
}

# Main execution
if ($ShowRequired) {
    Show-RequiredSecrets
} elseif ($ValidateSecrets) {
    Validate-Secrets
} elseif ($CreateNamespace) {
    Create-Namespace
} elseif ($ApplySecrets) {
    Apply-Secrets
} else {
    Show-NextSteps
}