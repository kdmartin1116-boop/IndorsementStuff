# Credential Configuration Tool for Production Deployment
# Manages OAuth, cloud services, and API credentials

param(
    [switch]$CheckCredentials,
    [switch]$UpdateCredentials,
    [switch]$ValidateCredentials,
    [switch]$ShowGuide,
    [string]$Service
)

function Show-CredentialGuide {
    Write-Host "`n🔐 CREDENTIAL CONFIGURATION GUIDE" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    
    Write-Host "`n📋 Required Credentials:" -ForegroundColor Yellow
    Write-Host "1. OAuth Providers (Google, GitHub, Auth0)"
    Write-Host "2. AWS Services (S3, RDS, ElastiCache)"
    Write-Host "3. Email Services (SendGrid, AWS SES)"
    Write-Host "4. AI Services (OpenAI, Anthropic)"
    Write-Host "5. Monitoring (Sentry, DataDog)"
    
    Write-Host "`n🛠️ Configuration Commands:" -ForegroundColor Green
    Write-Host ".\scripts\credential-configurator.ps1 -CheckCredentials    # Check current status"
    Write-Host ".\scripts\credential-configurator.ps1 -UpdateCredentials   # Interactive update"
    Write-Host ".\scripts\credential-configurator.ps1 -ValidateCredentials # Test connections"
    Write-Host ".\scripts\credential-configurator.ps1 -Service oauth       # Configure specific service"
}

function Test-Credentials {
    Write-Host "`n🔍 CHECKING CREDENTIAL STATUS" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    
    $envFile = ".env.production"
    $secretsFile = "deployment\k8s\secrets.yaml"
    
    if (-not (Test-Path $envFile)) {
        Write-Host "❌ Production environment file missing: $envFile" -ForegroundColor Red
        return $false
    }
    
    if (-not (Test-Path $secretsFile)) {
        Write-Host "❌ Kubernetes secrets file missing: $secretsFile" -ForegroundColor Red
        return $false
    }
    
    $content = Get-Content $envFile -Raw
    $missingCredentials = @()
    
    # Check OAuth credentials
    if ($content -match "GOOGLE_CLIENT_ID=your_google_client_id") { $missingCredentials += "Google OAuth" }
    if ($content -match "GITHUB_CLIENT_ID=your_github_client_id") { $missingCredentials += "GitHub OAuth" }
    if ($content -match "AUTH0_CLIENT_ID=your_auth0_client_id") { $missingCredentials += "Auth0" }
    
    # Check AWS credentials
    if ($content -match "AWS_ACCESS_KEY_ID=your_aws_access_key") { $missingCredentials += "AWS Access Key" }
    if ($content -match "AWS_SECRET_ACCESS_KEY=your_aws_secret_key") { $missingCredentials += "AWS Secret Key" }
    
    # Check API services
    if ($content -match "OPENAI_API_KEY=your_openai_api_key") { $missingCredentials += "OpenAI API" }
    if ($content -match "SENDGRID_API_KEY=your_sendgrid_api_key") { $missingCredentials += "SendGrid API" }
    
    Write-Host "`n📊 Credential Status:" -ForegroundColor Yellow
    if ($missingCredentials.Count -eq 0) {
        Write-Host "✅ All credentials appear to be configured!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "⚠️  Missing or placeholder credentials:" -ForegroundColor Yellow
        foreach ($cred in $missingCredentials) {
            Write-Host "   - $cred" -ForegroundColor Red
        }
        return $false
    }
}

function Update-OAuthCredentials {
    Write-Host "`n🔑 OAUTH CREDENTIAL CONFIGURATION" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
    
    Write-Host "`n📝 OAuth Setup Instructions:" -ForegroundColor Yellow
    
    Write-Host "`n1. Google OAuth:" -ForegroundColor Green
    Write-Host "   • Go to: https://console.developers.google.com/"
    Write-Host "   • Create project or select existing"
    Write-Host "   • Enable Google+ API"
    Write-Host "   • Create OAuth 2.0 credentials"
    Write-Host "   • Add redirect URI: https://yourdomain.com/auth/google/callback"
    
    Write-Host "`n2. GitHub OAuth:" -ForegroundColor Green
    Write-Host "   • Go to: https://github.com/settings/developers"
    Write-Host "   • Create new OAuth App"
    Write-Host "   • Authorization callback URL: https://yourdomain.com/auth/github/callback"
    
    Write-Host "`n3. Auth0 Setup:" -ForegroundColor Green
    Write-Host "   • Go to: https://auth0.com/dashboard"
    Write-Host "   • Create new application"
    Write-Host "   • Select Single Page Application"
    Write-Host "   • Add callback URLs and origins"
    
    $updateNow = Read-Host "`nWould you like to update OAuth credentials now? (y/n)"
    if ($updateNow -eq 'y' -or $updateNow -eq 'Y') {
        Update-EnvironmentFile -Section "oauth"
    }
}

function Update-CloudCredentials {
    Write-Host "`n☁️ CLOUD SERVICE CONFIGURATION" -ForegroundColor Cyan
    Write-Host "===============================" -ForegroundColor Cyan
    
    Write-Host "`n📝 AWS Setup Instructions:" -ForegroundColor Yellow
    Write-Host "1. Create IAM user with programmatic access"
    Write-Host "2. Attach policies: AmazonS3FullAccess, AmazonRDSFullAccess"
    Write-Host "3. Generate access key and secret"
    Write-Host "4. Create S3 bucket for file storage"
    Write-Host "5. Set up RDS PostgreSQL instance"
    
    Write-Host "`n📧 Email Service Setup:" -ForegroundColor Yellow
    Write-Host "1. SendGrid: Create account and generate API key"
    Write-Host "2. AWS SES: Verify domain and create SMTP credentials"
    
    $updateNow = Read-Host "`nWould you like to update cloud credentials now? (y/n)"
    if ($updateNow -eq 'y' -or $updateNow -eq 'Y') {
        Update-EnvironmentFile -Section "cloud"
    }
}

function Update-EnvironmentFile {
    param([string]$Section)
    
    $envFile = ".env.production"
    $content = Get-Content $envFile -Raw
    
    switch ($Section) {
        "oauth" {
            Write-Host "`n🔑 Enter OAuth Credentials:" -ForegroundColor Green
            
            $googleClientId = Read-Host "Google Client ID"
            $googleClientSecret = Read-Host "Google Client Secret"
            $githubClientId = Read-Host "GitHub Client ID"
            $githubClientSecret = Read-Host "GitHub Client Secret"
            
            if ($googleClientId) {
                $content = $content -replace "GOOGLE_CLIENT_ID=your_google_client_id", "GOOGLE_CLIENT_ID=$googleClientId"
                $content = $content -replace "GOOGLE_CLIENT_SECRET=your_google_client_secret", "GOOGLE_CLIENT_SECRET=$googleClientSecret"
            }
            
            if ($githubClientId) {
                $content = $content -replace "GITHUB_CLIENT_ID=your_github_client_id", "GITHUB_CLIENT_ID=$githubClientId"
                $content = $content -replace "GITHUB_CLIENT_SECRET=your_github_client_secret", "GITHUB_CLIENT_SECRET=$githubClientSecret"
            }
        }
        
        "cloud" {
            Write-Host "`n☁️ Enter AWS Credentials:" -ForegroundColor Green
            
            $awsAccessKey = Read-Host "AWS Access Key ID"
            $awsSecretKey = Read-Host "AWS Secret Access Key"
            $awsRegion = Read-Host "AWS Region (default: us-east-1)"
            $s3Bucket = Read-Host "S3 Bucket Name"
            
            if ($awsAccessKey) {
                $content = $content -replace "AWS_ACCESS_KEY_ID=your_aws_access_key", "AWS_ACCESS_KEY_ID=$awsAccessKey"
                $content = $content -replace "AWS_SECRET_ACCESS_KEY=your_aws_secret_key", "AWS_SECRET_ACCESS_KEY=$awsSecretKey"
            }
            
            if ($awsRegion) {
                $content = $content -replace "AWS_REGION=us-east-1", "AWS_REGION=$awsRegion"
            }
            
            if ($s3Bucket) {
                $content = $content -replace "S3_BUCKET=indorsement-storage", "S3_BUCKET=$s3Bucket"
            }
        }
        
        "apis" {
            Write-Host "`n🤖 Enter API Credentials:" -ForegroundColor Green
            
            $openaiKey = Read-Host "OpenAI API Key"
            $sendgridKey = Read-Host "SendGrid API Key"
            $sentryDsn = Read-Host "Sentry DSN"
            
            if ($openaiKey) {
                $content = $content -replace "OPENAI_API_KEY=your_openai_api_key", "OPENAI_API_KEY=$openaiKey"
            }
            
            if ($sendgridKey) {
                $content = $content -replace "SENDGRID_API_KEY=your_sendgrid_api_key", "SENDGRID_API_KEY=$sendgridKey"
            }
            
            if ($sentryDsn) {
                $content = $content -replace "SENTRY_DSN=your_sentry_dsn", "SENTRY_DSN=$sentryDsn"
            }
        }
    }
    
    Set-Content $envFile -Value $content
    Write-Host "✅ Environment file updated!" -ForegroundColor Green
    
    # Update Kubernetes secrets too
    Update-KubernetesSecrets
}

function Update-KubernetesSecrets {
    Write-Host "`n🔄 Updating Kubernetes secrets..." -ForegroundColor Yellow
    
    $envFile = ".env.production"
    $secretsFile = "deployment\k8s\secrets.yaml"
    
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile
        $secretsContent = Get-Content $secretsFile -Raw
        
        foreach ($line in $envContent) {
            if ($line -match "^([^=]+)=(.+)$") {
                $key = $matches[1]
                $value = $matches[2]
                $encodedValue = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($value))
                
                # Update corresponding secret in YAML
                $pattern = "(\s+$key\s*:\s*)[^\s]+"
                $replacement = "`${1}$encodedValue"
                $secretsContent = $secretsContent -replace $pattern, $replacement
            }
        }
        
        Set-Content $secretsFile -Value $secretsContent
        Write-Host "✅ Kubernetes secrets updated!" -ForegroundColor Green
    }
}

function Test-CredentialConnections {
    Write-Host "`n🧪 TESTING CREDENTIAL CONNECTIONS" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
    
    # This would typically make actual API calls to test credentials
    # For now, we'll do basic validation
    
    Write-Host "`n⚠️  Note: Connection testing requires the application to be running." -ForegroundColor Yellow
    Write-Host "Once deployed, use these endpoints to test:" -ForegroundColor Yellow
    Write-Host "• OAuth: https://yourdomain.com/auth/test"
    Write-Host "• AWS: https://yourdomain.com/api/health/aws"
    Write-Host "• Email: https://yourdomain.com/api/health/email"
    Write-Host "• AI: https://yourdomain.com/api/health/ai"
}

# Main execution logic
if ($CheckCredentials) {
    Test-Credentials
} elseif ($UpdateCredentials) {
    Write-Host "`n🔄 INTERACTIVE CREDENTIAL UPDATE" -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    
    Write-Host "`nWhich credentials would you like to update?"
    Write-Host "1. OAuth (Google, GitHub, Auth0)"
    Write-Host "2. Cloud Services (AWS, Email)"
    Write-Host "3. API Services (OpenAI, Sentry)"
    Write-Host "4. All credentials"
    
    $choice = Read-Host "`nEnter choice (1-4)"
    
    switch ($choice) {
        "1" { Update-OAuthCredentials }
        "2" { Update-CloudCredentials }
        "3" { Update-EnvironmentFile -Section "apis" }
        "4" { 
            Update-OAuthCredentials
            Update-CloudCredentials
            Update-EnvironmentFile -Section "apis"
        }
        default { Write-Host "Invalid choice" -ForegroundColor Red }
    }
} elseif ($ValidateCredentials) {
    Test-CredentialConnections
} elseif ($Service) {
    switch ($Service.ToLower()) {
        "oauth" { Update-OAuthCredentials }
        "cloud" { Update-CloudCredentials }
        "apis" { Update-EnvironmentFile -Section "apis" }
        default { Write-Host "Unknown service: $Service" -ForegroundColor Red }
    }
} else {
    Show-CredentialGuide
}