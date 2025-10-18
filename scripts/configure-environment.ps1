# 🔧 Environment Configuration Helper
# This script helps you configure your production environment variables

param(
    [switch]$GenerateSecrets = $false,
    [switch]$ValidateConfig = $false,
    [switch]$ShowRequired = $false
)

$EnvFile = "C:\Users\xxcha\OneDrive\Desktop\IndorsementStuff\new\.env.production"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Generate-SecureSecret {
    param([int]$Length = 64)
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    $secret = ""
    for ($i = 0; $i -lt $Length; $i++) {
        $secret += $chars[(Get-Random -Maximum $chars.Length)]
    }
    return $secret
}

function Show-RequiredUpdates {
    Write-ColorOutput "🔧 REQUIRED ENVIRONMENT VARIABLE UPDATES" "Yellow"
    Write-ColorOutput "=========================================" "Yellow"
    Write-Host ""
    
    $required = @(
        @{Name="DATABASE_URL"; Description="PostgreSQL connection string"; Example="postgresql://user:password@localhost:5432/indorsement_prod"},
        @{Name="REDIS_URL"; Description="Redis connection string"; Example="redis://localhost:6379"},
        @{Name="JWT_SECRET"; Description="256-bit secret for JWT tokens"; Example="(generate with -GenerateSecrets)"},
        @{Name="JWT_REFRESH_SECRET"; Description="256-bit secret for refresh tokens"; Example="(generate with -GenerateSecrets)"},
        @{Name="OAUTH_GOOGLE_CLIENT_ID"; Description="Google OAuth client ID"; Example="123456789-abcdef.apps.googleusercontent.com"},
        @{Name="OAUTH_GOOGLE_CLIENT_SECRET"; Description="Google OAuth client secret"; Example="GOCSPX-abcdef123456"},
        @{Name="AWS_ACCESS_KEY_ID"; Description="AWS access key"; Example="AKIAIOSFODNN7EXAMPLE"},
        @{Name="AWS_SECRET_ACCESS_KEY"; Description="AWS secret key"; Example="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"},
        @{Name="SMTP_PASS"; Description="SendGrid API key"; Example="SG.abcdef123456"},
        @{Name="OPENAI_API_KEY"; Description="OpenAI API key"; Example="sk-abcdef123456"}
    )
    
    foreach ($item in $required) {
        Write-ColorOutput "📋 $($item.Name)" "Cyan"
        Write-ColorOutput "   Description: $($item.Description)" "Gray"
        Write-ColorOutput "   Example: $($item.Example)" "Green"
        Write-Host ""
    }
    
    Write-ColorOutput "💡 TIP: Use the -GenerateSecrets flag to generate secure secrets automatically" "Yellow"
}

function Generate-Secrets {
    Write-ColorOutput "🔐 GENERATING SECURE SECRETS" "Green"
    Write-ColorOutput "============================" "Green"
    Write-Host ""
    
    $secrets = @{
        "JWT_SECRET" = Generate-SecureSecret -Length 64
        "JWT_REFRESH_SECRET" = Generate-SecureSecret -Length 64
        "SESSION_SECRET" = Generate-SecureSecret -Length 64
        "ENCRYPTION_KEY" = Generate-SecureSecret -Length 64
    }
    
    foreach ($secret in $secrets.GetEnumerator()) {
        Write-ColorOutput "$($secret.Key)=" "Cyan" -NoNewline
        Write-ColorOutput "$($secret.Value)" "Yellow"
    }
    
    Write-Host ""
    Write-ColorOutput "💾 Copy these values to your .env.production file" "Green"
    Write-ColorOutput "⚠️  Keep these secrets secure and never commit them to version control!" "Red"
}

function Validate-Config {
    if (-not (Test-Path $EnvFile)) {
        Write-ColorOutput "❌ .env.production file not found!" "Red"
        return $false
    }
    
    Write-ColorOutput "🔍 VALIDATING PRODUCTION CONFIGURATION" "Blue"
    Write-ColorOutput "======================================" "Blue"
    Write-Host ""
    
    $content = Get-Content $EnvFile -Raw
    $issues = @()
    
    # Check for placeholder values
    $placeholders = @(
        "CHANGE_THIS_PASSWORD",
        "CHANGE_THIS_TO_A_SECURE",
        "your-google-oauth-client-id",
        "your-aws-access-key-id",
        "your-sendgrid-api-key",
        "sk-your-openai-api-key"
    )
    
    foreach ($placeholder in $placeholders) {
        if ($content -match $placeholder) {
            $issues += "❌ Found placeholder value: $placeholder"
        }
    }
    
    # Check for required variables
    $required = @("DATABASE_URL", "REDIS_URL", "JWT_SECRET", "AWS_ACCESS_KEY_ID")
    foreach ($var in $required) {
        if ($content -notmatch "$var=.+") {
            $issues += "❌ Missing or empty required variable: $var"
        }
    }
    
    if ($issues.Count -eq 0) {
        Write-ColorOutput "✅ Configuration validation passed!" "Green"
        return $true
    } else {
        Write-ColorOutput "⚠️  Configuration issues found:" "Yellow"
        foreach ($issue in $issues) {
            Write-ColorOutput "   $issue" "Red"
        }
        return $false
    }
}

function Show-NextSteps {
    Write-ColorOutput "🎯 NEXT STEPS FOR ENVIRONMENT CONFIGURATION" "Cyan"
    Write-ColorOutput "===========================================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "1. 🔐 Generate Secrets:" "Yellow"
    Write-ColorOutput "   .\configure-environment.ps1 -GenerateSecrets" "Gray"
    Write-Host ""
    
    Write-ColorOutput "2. 📝 Edit .env.production file:" "Yellow"
    Write-ColorOutput "   notepad .env.production" "Gray"
    Write-ColorOutput "   # Update all CHANGE_THIS_ values with actual credentials" "Gray"
    Write-Host ""
    
    Write-ColorOutput "3. ✅ Validate Configuration:" "Yellow"
    Write-ColorOutput "   .\configure-environment.ps1 -ValidateConfig" "Gray"
    Write-Host ""
    
    Write-ColorOutput "4. 🚀 Proceed to Secrets Setup:" "Yellow"
    Write-ColorOutput "   Continue with Kubernetes secrets configuration" "Gray"
}

# Main execution
if ($GenerateSecrets) {
    Generate-Secrets
} elseif ($ValidateConfig) {
    $isValid = Validate-Config
    if (-not $isValid) {
        Write-Host ""
        Write-ColorOutput "💡 Run with -ShowRequired to see what needs to be updated" "Yellow"
    }
} elseif ($ShowRequired) {
    Show-RequiredUpdates
} else {
    Show-NextSteps
}