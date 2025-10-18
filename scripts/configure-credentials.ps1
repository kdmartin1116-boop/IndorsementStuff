# 🔐 Credential Configuration Manager

param(
    [switch]$ConfigureOAuth = $false,
    [switch]$ConfigureCloud = $false,
    [switch]$ConfigureServices = $false,
    [switch]$ValidateAll = $false,
    [switch]$ShowGuides = $false,
    [switch]$InteractiveSetup = $false
)

$EnvFile = "C:\Users\xxcha\OneDrive\Desktop\IndorsementStuff\new\.env.production"
$SecretsFile = "C:\Users\xxcha\OneDrive\Desktop\IndorsementStuff\new\deployment\k8s\secrets.yaml"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Show-OAuthSetupGuide {
    Write-ColorOutput "🔑 OAUTH CREDENTIALS SETUP GUIDE" "Cyan"
    Write-ColorOutput "=================================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "🔵 GOOGLE OAUTH SETUP:" "Blue"
    Write-ColorOutput "======================" "Blue"
    Write-Host ""
    
    Write-ColorOutput "1. Go to Google Cloud Console:" "Yellow"
    Write-ColorOutput "   https://console.cloud.google.com/" "Gray"
    Write-Host ""
    
    Write-ColorOutput "2. Create or select a project:" "Yellow"
    Write-ColorOutput "   • Click 'Select a project' → 'New Project'" "Gray"
    Write-ColorOutput "   • Name: 'Indorsement Platform'" "Gray"
    Write-ColorOutput "   • Click 'Create'" "Gray"
    Write-Host ""
    
    Write-ColorOutput "3. Enable APIs:" "Yellow"
    Write-ColorOutput "   • Go to 'APIs & Services' → 'Library'" "Gray"
    Write-ColorOutput "   • Search and enable: 'Google+ API'" "Gray"
    Write-ColorOutput "   • Search and enable: 'Gmail API'" "Gray"
    Write-Host ""
    
    Write-ColorOutput "4. Configure OAuth consent screen:" "Yellow"
    Write-ColorOutput "   • Go to 'APIs & Services' → 'OAuth consent screen'" "Gray"
    Write-ColorOutput "   • Choose 'External'" "Gray"
    Write-ColorOutput "   • Fill in required fields:" "Gray"
    Write-ColorOutput "     - App name: Indorsement Platform" "Gray"
    Write-ColorOutput "     - User support email: your-email@domain.com" "Gray"
    Write-ColorOutput "     - Developer contact: your-email@domain.com" "Gray"
    Write-Host ""
    
    Write-ColorOutput "5. Create OAuth credentials:" "Yellow"
    Write-ColorOutput "   • Go to 'APIs & Services' → 'Credentials'" "Gray"
    Write-ColorOutput "   • Click '+ Create Credentials' → 'OAuth 2.0 Client IDs'" "Gray"
    Write-ColorOutput "   • Application type: 'Web application'" "Gray"
    Write-ColorOutput "   • Name: 'Indorsement Web App'" "Gray"
    Write-ColorOutput "   • Authorized redirect URIs:" "Gray"
    Write-ColorOutput "     - http://localhost:3000/auth/google/callback" "Gray"
    Write-ColorOutput "     - https://api.indorsement.com/auth/google/callback" "Gray"
    Write-Host ""
    
    Write-ColorOutput "6. Save credentials:" "Yellow"
    Write-ColorOutput "   • Copy Client ID and Client Secret" "Gray"
    Write-ColorOutput "   • Format: 123456789-abcdefg.apps.googleusercontent.com" "Gray"
    Write-Host ""
    
    Write-ColorOutput "🟠 MICROSOFT OAUTH SETUP:" "Blue"
    Write-ColorOutput "==========================" "Blue"
    Write-Host ""
    
    Write-ColorOutput "1. Go to Azure Portal:" "Yellow"
    Write-ColorOutput "   https://portal.azure.com/" "Gray"
    Write-Host ""
    
    Write-ColorOutput "2. Register application:" "Yellow"
    Write-ColorOutput "   • Go to 'Azure Active Directory' → 'App registrations'" "Gray"
    Write-ColorOutput "   • Click 'New registration'" "Gray"
    Write-ColorOutput "   • Name: 'Indorsement Platform'" "Gray"
    Write-ColorOutput "   • Supported account types: 'Accounts in any organizational directory and personal Microsoft accounts'" "Gray"
    Write-ColorOutput "   • Redirect URI: 'Web' → 'https://api.indorsement.com/auth/microsoft/callback'" "Gray"
    Write-Host ""
    
    Write-ColorOutput "3. Create client secret:" "Yellow"
    Write-ColorOutput "   • Go to 'Certificates & secrets'" "Gray"
    Write-ColorOutput "   • Click 'New client secret'" "Gray"
    Write-ColorOutput "   • Description: 'Indorsement App Secret'" "Gray"
    Write-ColorOutput "   • Expires: '24 months'" "Gray"
    Write-ColorOutput "   • Copy the secret value immediately!" "Gray"
    Write-Host ""
    
    Write-ColorOutput "4. Configure API permissions:" "Yellow"
    Write-ColorOutput "   • Go to 'API permissions'" "Gray"
    Write-ColorOutput "   • Add 'Microsoft Graph' → 'Delegated permissions'" "Gray"
    Write-ColorOutput "   • Select: User.Read, profile, openid, email" "Gray"
    Write-Host ""
}

function Show-CloudServicesGuide {
    Write-ColorOutput "☁️ CLOUD SERVICES SETUP GUIDE" "Cyan"
    Write-ColorOutput "===============================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "🟡 AWS SETUP:" "Yellow"
    Write-ColorOutput "==============" "Yellow"
    Write-Host ""
    
    Write-ColorOutput "1. Create AWS Account:" "White"
    Write-ColorOutput "   https://aws.amazon.com/" "Gray"
    Write-Host ""
    
    Write-ColorOutput "2. Create IAM User:" "White"
    Write-ColorOutput "   • Go to IAM Console → Users → Add user" "Gray"
    Write-ColorOutput "   • User name: 'indorsement-app'" "Gray"
    Write-ColorOutput "   • Access type: 'Programmatic access'" "Gray"
    Write-Host ""
    
    Write-ColorOutput "3. Attach policies:" "White"
    Write-ColorOutput "   • AmazonS3FullAccess" "Gray"
    Write-ColorOutput "   • AmazonSESFullAccess" "Gray"
    Write-ColorOutput "   • CloudWatchLogsFullAccess" "Gray"
    Write-ColorOutput "   • Or create custom policy with minimal permissions" "Gray"
    Write-Host ""
    
    Write-ColorOutput "4. Save credentials:" "White"
    Write-ColorOutput "   • Access Key ID: AKIAIOSFODNN7EXAMPLE" "Gray"
    Write-ColorOutput "   • Secret Access Key: wJalrXUtnFEMI/K7MDENG/..." "Gray"
    Write-Host ""
    
    Write-ColorOutput "5. Create S3 bucket:" "White"
    Write-ColorOutput "   • Bucket name: 'indorsement-documents-prod'" "Gray"
    Write-ColorOutput "   • Region: 'us-east-1' (or your preferred region)" "Gray"
    Write-ColorOutput "   • Block public access: Enable" "Gray"
    Write-Host ""
    
    Write-ColorOutput "🔵 AZURE SETUP (Alternative):" "Blue"
    Write-ColorOutput "=============================" "Blue"
    Write-Host ""
    
    Write-ColorOutput "1. Create Azure Account:" "White"
    Write-ColorOutput "   https://portal.azure.com/" "Gray"
    Write-Host ""
    
    Write-ColorOutput "2. Create Service Principal:" "White"
    Write-ColorOutput "   • Go to 'Azure Active Directory' → 'App registrations'" "Gray"
    Write-ColorOutput "   • Create new registration" "Gray"
    Write-ColorOutput "   • Create client secret" "Gray"
    Write-Host ""
    
    Write-ColorOutput "3. Create Storage Account:" "White"
    Write-ColorOutput "   • Go to 'Storage accounts' → 'Create'" "Gray"
    Write-ColorOutput "   • Account name: 'indorsementstorage'" "Gray"
    Write-ColorOutput "   • Create blob container: 'documents'" "Gray"
    Write-Host ""
}

function Show-ExternalServicesGuide {
    Write-ColorOutput "🌐 EXTERNAL SERVICES SETUP GUIDE" "Cyan"
    Write-ColorOutput "=================================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "📧 SENDGRID EMAIL SETUP:" "Green"
    Write-ColorOutput "========================" "Green"
    Write-Host ""
    
    Write-ColorOutput "1. Create SendGrid Account:" "White"
    Write-ColorOutput "   https://sendgrid.com/" "Gray"
    Write-ColorOutput "   • Sign up for free account (40,000 emails/month)" "Gray"
    Write-Host ""
    
    Write-ColorOutput "2. Create API Key:" "White"
    Write-ColorOutput "   • Go to Settings → API Keys" "Gray"
    Write-ColorOutput "   • Click 'Create API Key'" "Gray"
    Write-ColorOutput "   • Name: 'Indorsement Platform'" "Gray"
    Write-ColorOutput "   • Permissions: 'Full Access' or 'Restricted Access'" "Gray"
    Write-ColorOutput "   • Copy API key: SG.xxxxxxxxxxxxxxxxxxxx" "Gray"
    Write-Host ""
    
    Write-ColorOutput "3. Verify sender identity:" "White"
    Write-ColorOutput "   • Go to Settings → Sender Authentication" "Gray"
    Write-ColorOutput "   • Verify your domain or single sender email" "Gray"
    Write-Host ""
    
    Write-ColorOutput "🤖 OPENAI API SETUP:" "Blue"
    Write-ColorOutput "====================" "Blue"
    Write-Host ""
    
    Write-ColorOutput "1. Create OpenAI Account:" "White"
    Write-ColorOutput "   https://platform.openai.com/" "Gray"
    Write-Host ""
    
    Write-ColorOutput "2. Create API Key:" "White"
    Write-ColorOutput "   • Go to API Keys section" "Gray"
    Write-ColorOutput "   • Click 'Create new secret key'" "Gray"
    Write-ColorOutput "   • Name: 'Indorsement Platform'" "Gray"
    Write-ColorOutput "   • Copy key: sk-xxxxxxxxxxxxxxxxxxxxxxxx" "Gray"
    Write-Host ""
    
    Write-ColorOutput "3. Set usage limits:" "White"
    Write-ColorOutput "   • Go to Usage → Limits" "Gray"
    Write-ColorOutput "   • Set monthly spending limit" "Gray"
    Write-Host ""
    
    Write-ColorOutput "📊 MONITORING SERVICES:" "Yellow"
    Write-ColorOutput "======================" "Yellow"
    Write-Host ""
    
    Write-ColorOutput "Sentry (Error Tracking):" "White"
    Write-ColorOutput "• Sign up: https://sentry.io/" "Gray"
    Write-ColorOutput "• Create project: 'Indorsement Platform'" "Gray"
    Write-ColorOutput "• Copy DSN: https://xxxxx@sentry.io/xxxxx" "Gray"
    Write-Host ""
    
    Write-ColorOutput "Mixpanel (Analytics):" "White"
    Write-ColorOutput "• Sign up: https://mixpanel.com/" "Gray"
    Write-ColorOutput "• Create project: 'Indorsement Platform'" "Gray"
    Write-ColorOutput "• Copy Project Token: xxxxxxxxxxxxxxxxxxxxxxxx" "Gray"
}

function Configure-OAuthCredentials {
    Write-ColorOutput "🔑 OAUTH CREDENTIALS CONFIGURATION" "Green"
    Write-ColorOutput "===================================" "Green"
    Write-Host ""
    
    # Google OAuth
    Write-ColorOutput "🔵 Google OAuth Configuration:" "Blue"
    $googleClientId = Read-Host "Enter Google Client ID"
    $googleClientSecret = Read-Host "Enter Google Client Secret" -AsSecureString
    $googleClientSecretText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($googleClientSecret))
    
    # Microsoft OAuth
    Write-ColorOutput "🟠 Microsoft OAuth Configuration:" "Blue"
    $msClientId = Read-Host "Enter Microsoft Client ID"
    $msClientSecret = Read-Host "Enter Microsoft Client Secret" -AsSecureString
    $msClientSecretText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($msClientSecret))
    
    # Update environment file
    try {
        $envContent = Get-Content $EnvFile -Raw
        $envContent = $envContent -replace "OAUTH_GOOGLE_CLIENT_ID=.*", "OAUTH_GOOGLE_CLIENT_ID=$googleClientId"
        $envContent = $envContent -replace "OAUTH_GOOGLE_CLIENT_SECRET=.*", "OAUTH_GOOGLE_CLIENT_SECRET=$googleClientSecretText"
        $envContent = $envContent -replace "OAUTH_MICROSOFT_CLIENT_ID=.*", "OAUTH_MICROSOFT_CLIENT_ID=$msClientId"
        $envContent = $envContent -replace "OAUTH_MICROSOFT_CLIENT_SECRET=.*", "OAUTH_MICROSOFT_CLIENT_SECRET=$msClientSecretText"
        
        $envContent | Set-Content $EnvFile -NoNewline
        
        Write-ColorOutput "✅ Environment file updated" "Green"
    }
    catch {
        Write-ColorOutput "❌ Failed to update environment file: $_" "Red"
    }
    
    # Update secrets file
    try {
        $secretsContent = Get-Content $SecretsFile -Raw
        $secretsContent = $secretsContent -replace "google-client-id: .*", "google-client-id: `"$googleClientId`""
        $secretsContent = $secretsContent -replace "google-client-secret: .*", "google-client-secret: `"$googleClientSecretText`""
        $secretsContent = $secretsContent -replace "microsoft-client-id: .*", "microsoft-client-id: `"$msClientId`""
        $secretsContent = $secretsContent -replace "microsoft-client-secret: .*", "microsoft-client-secret: `"$msClientSecretText`""
        
        $secretsContent | Set-Content $SecretsFile -NoNewline
        
        Write-ColorOutput "✅ Secrets file updated" "Green"
    }
    catch {
        Write-ColorOutput "❌ Failed to update secrets file: $_" "Red"
    }
}

function Configure-CloudServices {
    Write-ColorOutput "☁️ CLOUD SERVICES CONFIGURATION" "Green"
    Write-ColorOutput "================================" "Green"
    Write-Host ""
    
    # AWS Configuration
    Write-ColorOutput "🟡 AWS Configuration:" "Yellow"
    $awsAccessKey = Read-Host "Enter AWS Access Key ID"
    $awsSecretKey = Read-Host "Enter AWS Secret Access Key" -AsSecureString
    $awsSecretKeyText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($awsSecretKey))
    $awsRegion = Read-Host "Enter AWS Region (default: us-east-1)"
    if (-not $awsRegion) { $awsRegion = "us-east-1" }
    $s3Bucket = Read-Host "Enter S3 Bucket Name (default: indorsement-documents-prod)"
    if (-not $s3Bucket) { $s3Bucket = "indorsement-documents-prod" }
    
    # Update environment file
    try {
        $envContent = Get-Content $EnvFile -Raw
        $envContent = $envContent -replace "AWS_ACCESS_KEY_ID=.*", "AWS_ACCESS_KEY_ID=$awsAccessKey"
        $envContent = $envContent -replace "AWS_SECRET_ACCESS_KEY=.*", "AWS_SECRET_ACCESS_KEY=$awsSecretKeyText"
        $envContent = $envContent -replace "AWS_REGION=.*", "AWS_REGION=$awsRegion"
        $envContent = $envContent -replace "S3_BUCKET=.*", "S3_BUCKET=$s3Bucket"
        
        $envContent | Set-Content $EnvFile -NoNewline
        
        Write-ColorOutput "✅ AWS credentials updated in environment file" "Green"
    }
    catch {
        Write-ColorOutput "❌ Failed to update environment file: $_" "Red"
    }
    
    # Update secrets file
    try {
        $secretsContent = Get-Content $SecretsFile -Raw
        $secretsContent = $secretsContent -replace "aws-access-key-id: .*", "aws-access-key-id: `"$awsAccessKey`""
        $secretsContent = $secretsContent -replace "aws-secret-access-key: .*", "aws-secret-access-key: `"$awsSecretKeyText`""
        
        $secretsContent | Set-Content $SecretsFile -NoNewline
        
        Write-ColorOutput "✅ AWS credentials updated in secrets file" "Green"
    }
    catch {
        Write-ColorOutput "❌ Failed to update secrets file: $_" "Red"
    }
}

function Configure-ExternalServices {
    Write-ColorOutput "🌐 EXTERNAL SERVICES CONFIGURATION" "Green"
    Write-ColorOutput "===================================" "Green"
    Write-Host ""
    
    # SendGrid
    Write-ColorOutput "📧 SendGrid Configuration:" "Green"
    $sendgridKey = Read-Host "Enter SendGrid API Key" -AsSecureString
    $sendgridKeyText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sendgridKey))
    
    # OpenAI
    Write-ColorOutput "🤖 OpenAI Configuration:" "Blue"
    $openaiKey = Read-Host "Enter OpenAI API Key (optional)" -AsSecureString
    $openaiKeyText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($openaiKey))
    
    # Sentry
    Write-ColorOutput "🐛 Sentry Configuration:" "Yellow"
    $sentryDsn = Read-Host "Enter Sentry DSN (optional)"
    
    # Mixpanel
    Write-ColorOutput "📊 Mixpanel Configuration:" "Magenta"
    $mixpanelToken = Read-Host "Enter Mixpanel Token (optional)"
    
    # Update files
    try {
        # Environment file
        $envContent = Get-Content $EnvFile -Raw
        $envContent = $envContent -replace "SMTP_PASS=.*", "SMTP_PASS=$sendgridKeyText"
        if ($openaiKeyText) {
            $envContent = $envContent -replace "OPENAI_API_KEY=.*", "OPENAI_API_KEY=$openaiKeyText"
        }
        if ($sentryDsn) {
            $envContent = $envContent -replace "SENTRY_DSN=.*", "SENTRY_DSN=$sentryDsn"
        }
        if ($mixpanelToken) {
            $envContent = $envContent -replace "MIXPANEL_TOKEN=.*", "MIXPANEL_TOKEN=$mixpanelToken"
        }
        
        $envContent | Set-Content $EnvFile -NoNewline
        
        # Secrets file
        $secretsContent = Get-Content $SecretsFile -Raw
        $secretsContent = $secretsContent -replace "smtp-pass: .*", "smtp-pass: `"$sendgridKeyText`""
        if ($openaiKeyText) {
            $secretsContent = $secretsContent -replace "openai-api-key: .*", "openai-api-key: `"$openaiKeyText`""
        }
        if ($sentryDsn) {
            $secretsContent = $secretsContent -replace "sentry-dsn: .*", "sentry-dsn: `"$sentryDsn`""
        }
        if ($mixpanelToken) {
            $secretsContent = $secretsContent -replace "mixpanel-token: .*", "mixpanel-token: `"$mixpanelToken`""
        }
        
        $secretsContent | Set-Content $SecretsFile -NoNewline
        
        Write-ColorOutput "✅ External services configured successfully" "Green"
    }
    catch {
        Write-ColorOutput "❌ Failed to update configuration files: $_" "Red"
    }
}

function Validate-AllCredentials {
    Write-ColorOutput "🔍 VALIDATING ALL CREDENTIALS" "Blue"
    Write-ColorOutput "==============================" "Blue"
    Write-Host ""
    
    $issues = @()
    
    if (Test-Path $EnvFile) {
        $envContent = Get-Content $EnvFile -Raw
        
        # Check for placeholders
        $placeholders = @(
            "your-google-oauth-client-id",
            "your-aws-access-key-id",
            "your-sendgrid-api-key",
            "sk-your-openai-api-key"
        )
        
        foreach ($placeholder in $placeholders) {
            if ($envContent -match $placeholder) {
                $issues += "❌ Environment: Found placeholder '$placeholder'"
            }
        }
        
        # Check for required values
        if ($envContent -match "OAUTH_GOOGLE_CLIENT_ID=.+\.apps\.googleusercontent\.com") {
            Write-ColorOutput "✅ Google OAuth Client ID configured" "Green"
        } else {
            $issues += "⚠️ Google OAuth Client ID missing or invalid format"
        }
        
        if ($envContent -match "AWS_ACCESS_KEY_ID=AKIA[0-9A-Z]{16}") {
            Write-ColorOutput "✅ AWS Access Key ID configured" "Green"
        } else {
            $issues += "⚠️ AWS Access Key ID missing or invalid format"
        }
        
        if ($envContent -match "SMTP_PASS=SG\..+") {
            Write-ColorOutput "✅ SendGrid API Key configured" "Green"
        } else {
            $issues += "⚠️ SendGrid API Key missing or invalid format"
        }
    } else {
        $issues += "❌ Environment file not found"
    }
    
    if ($issues.Count -eq 0) {
        Write-ColorOutput "🎉 All credential validations passed!" "Green"
        return $true
    } else {
        Write-ColorOutput "⚠️ Credential validation issues found:" "Yellow"
        foreach ($issue in $issues) {
            Write-ColorOutput "   $issue" "Red"
        }
        return $false
    }
}

function Start-InteractiveSetup {
    Write-ColorOutput "🔐 INTERACTIVE CREDENTIAL SETUP" "Cyan"
    Write-ColorOutput "================================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "This wizard will help you configure all required credentials." "White"
    Write-ColorOutput "You can skip optional services by pressing Enter without input." "Gray"
    Write-Host ""
    
    $continue = Read-Host "Continue with interactive setup? (Y/n)"
    if ($continue -eq 'n' -or $continue -eq 'N') {
        return
    }
    
    Write-Host ""
    Write-ColorOutput "=== STEP 1: OAuth Credentials ===" "Yellow"
    Configure-OAuthCredentials
    
    Write-Host ""
    Write-ColorOutput "=== STEP 2: Cloud Services ===" "Yellow"
    Configure-CloudServices
    
    Write-Host ""
    Write-ColorOutput "=== STEP 3: External Services ===" "Yellow"
    Configure-ExternalServices
    
    Write-Host ""
    Write-ColorOutput "=== STEP 4: Validation ===" "Yellow"
    Validate-AllCredentials
    
    Write-Host ""
    Write-ColorOutput "🎉 Interactive setup complete!" "Green"
}

function Show-MainMenu {
    Write-ColorOutput "🔐 CREDENTIAL CONFIGURATION MANAGER" "Cyan"
    Write-ColorOutput "====================================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "Choose configuration option:" "White"
    Write-ColorOutput "1. 🔑 Configure OAuth (Google, Microsoft)" "Yellow"
    Write-ColorOutput "2. ☁️ Configure Cloud Services (AWS, Azure)" "Yellow"
    Write-ColorOutput "3. 🌐 Configure External Services (SendGrid, OpenAI, etc.)" "Yellow"
    Write-ColorOutput "4. 📋 Show setup guides" "Yellow"
    Write-ColorOutput "5. ✅ Validate all credentials" "Yellow"
    Write-ColorOutput "6. 🤖 Interactive setup wizard" "Yellow"
    Write-ColorOutput "7. 🚪 Exit" "Yellow"
    Write-Host ""
    
    $choice = Read-Host "Select option (1-7)"
    
    switch ($choice) {
        "1" { Configure-OAuthCredentials }
        "2" { Configure-CloudServices }
        "3" { Configure-ExternalServices }
        "4" { 
            Show-OAuthSetupGuide
            Write-Host ""
            Show-CloudServicesGuide
            Write-Host ""
            Show-ExternalServicesGuide
        }
        "5" { Validate-AllCredentials }
        "6" { Start-InteractiveSetup }
        "7" { Write-ColorOutput "👋 Goodbye!" "Green"; return }
        default { Write-ColorOutput "❌ Invalid option" "Red" }
    }
    
    if ($choice -ne "7") {
        Write-Host ""
        Read-Host "Press Enter to continue"
        Show-MainMenu
    }
}

# Main execution
if ($ConfigureOAuth) {
    Configure-OAuthCredentials
} elseif ($ConfigureCloud) {
    Configure-CloudServices
} elseif ($ConfigureServices) {
    Configure-ExternalServices
} elseif ($ValidateAll) {
    Validate-AllCredentials
} elseif ($ShowGuides) {
    Show-OAuthSetupGuide
    Show-CloudServicesGuide
    Show-ExternalServicesGuide
} elseif ($InteractiveSetup) {
    Start-InteractiveSetup
} else {
    Show-MainMenu
}