# 🌐 Domain and SSL Configuration Manager

param(
    [switch]$SetupDomain = $false,
    [switch]$ConfigureSSL = $false,
    [switch]$ValidateSetup = $false,
    [switch]$ShowGuides = $false,
    [switch]$GenerateCertificates = $false,
    [switch]$InteractiveSetup = $false
)

$EnvFile = "C:\Users\xxcha\OneDrive\Desktop\IndorsementStuff\new\.env.production"
$IngressFile = "C:\Users\xxcha\OneDrive\Desktop\IndorsementStuff\new\deployment\k8s\ingress.yaml"
$CertManagerFile = "C:\Users\xxcha\OneDrive\Desktop\IndorsementStuff\new\deployment\k8s\cert-manager.yaml"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Show-DomainSetupGuide {
    Write-ColorOutput "🌐 DOMAIN SETUP GUIDE" "Cyan"
    Write-ColorOutput "=====================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "📝 DOMAIN REGISTRATION:" "Blue"
    Write-ColorOutput "=======================" "Blue"
    Write-Host ""
    
    Write-ColorOutput "1. Choose a domain registrar:" "Yellow"
    Write-ColorOutput "   • Namecheap (recommended): https://www.namecheap.com/" "Gray"
    Write-ColorOutput "   • GoDaddy: https://www.godaddy.com/" "Gray"
    Write-ColorOutput "   • Google Domains: https://domains.google/" "Gray"
    Write-ColorOutput "   • Cloudflare Registrar: https://www.cloudflare.com/" "Gray"
    Write-Host ""
    
    Write-ColorOutput "2. Register your domain:" "Yellow"
    Write-ColorOutput "   • Search for available domains" "Gray"
    Write-ColorOutput "   • Suggested names:" "Gray"
    Write-ColorOutput "     - indorsement.com" "Gray"
    Write-ColorOutput "     - indorsementplatform.com" "Gray"
    Write-ColorOutput "     - myindorsement.com" "Gray"
    Write-ColorOutput "     - [yourname]indorsement.com" "Gray"
    Write-Host ""
    
    Write-ColorOutput "🔧 DNS CONFIGURATION:" "Blue"
    Write-ColorOutput "======================" "Blue"
    Write-Host ""
    
    Write-ColorOutput "Option 1: Cloudflare DNS (Recommended):" "Green"
    Write-ColorOutput "=======================================" "Green"
    Write-Host ""
    
    Write-ColorOutput "1. Sign up for Cloudflare:" "Yellow"
    Write-ColorOutput "   https://www.cloudflare.com/" "Gray"
    Write-Host ""
    
    Write-ColorOutput "2. Add your domain:" "Yellow"
    Write-ColorOutput "   • Click 'Add Site'" "Gray"
    Write-ColorOutput "   • Enter your domain name" "Gray"
    Write-ColorOutput "   • Choose Free plan" "Gray"
    Write-Host ""
    
    Write-ColorOutput "3. Update nameservers at registrar:" "Yellow"
    Write-ColorOutput "   • Get Cloudflare nameservers (e.g., ns1.cloudflare.com)" "Gray"
    Write-ColorOutput "   • Update at your domain registrar" "Gray"
    Write-ColorOutput "   • Wait 24-48 hours for propagation" "Gray"
    Write-Host ""
    
    Write-ColorOutput "4. Configure DNS records in Cloudflare:" "Yellow"
    Write-ColorOutput "   A Records:" "Gray"
    Write-ColorOutput "   • Name: @ (root domain)" "Gray"
    Write-ColorOutput "   • IPv4: [Your server IP]" "Gray"
    Write-ColorOutput "   • Proxy: Enabled (orange cloud)" "Gray"
    Write-Host ""
    Write-ColorOutput "   • Name: www" "Gray"
    Write-ColorOutput "   • IPv4: [Your server IP]" "Gray"
    Write-ColorOutput "   • Proxy: Enabled (orange cloud)" "Gray"
    Write-Host ""
    Write-ColorOutput "   • Name: api" "Gray"
    Write-ColorOutput "   • IPv4: [Your server IP]" "Gray"
    Write-ColorOutput "   • Proxy: Enabled (orange cloud)" "Gray"
    Write-Host ""
    
    Write-ColorOutput "Option 2: Direct DNS (Alternative):" "Yellow"
    Write-ColorOutput "====================================" "Yellow"
    Write-Host ""
    
    Write-ColorOutput "Configure A records at your registrar:" "White"
    Write-ColorOutput "• @ → [Your server IP]" "Gray"
    Write-ColorOutput "• www → [Your server IP]" "Gray"
    Write-ColorOutput "• api → [Your server IP]" "Gray"
    Write-Host ""
    
    Write-ColorOutput "💡 LOCAL DEVELOPMENT SETUP:" "Blue"
    Write-ColorOutput "============================" "Blue"
    Write-Host ""
    
    Write-ColorOutput "For testing without a domain:" "White"
    Write-ColorOutput "1. Edit hosts file (as administrator):" "Gray"
    Write-ColorOutput "   C:\Windows\System32\drivers\etc\hosts" "Gray"
    Write-Host ""
    Write-ColorOutput "2. Add entries:" "Gray"
    Write-ColorOutput "   127.0.0.1 indorsement.local" "Gray"
    Write-ColorOutput "   127.0.0.1 api.indorsement.local" "Gray"
    Write-ColorOutput "   127.0.0.1 www.indorsement.local" "Gray"
    Write-Host ""
}

function Show-SSLSetupGuide {
    Write-ColorOutput "🔒 SSL CERTIFICATE SETUP GUIDE" "Cyan"
    Write-ColorOutput "===============================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "🆓 OPTION 1: Let's Encrypt (Recommended)" "Green"
    Write-ColorOutput "=========================================" "Green"
    Write-Host ""
    
    Write-ColorOutput "Automatic with cert-manager in Kubernetes:" "White"
    Write-ColorOutput "• Free SSL certificates" "Gray"
    Write-ColorOutput "• Automatic renewal" "Gray"
    Write-ColorOutput "• Wildcard support" "Gray"
    Write-Host ""
    
    Write-ColorOutput "Prerequisites:" "Yellow"
    Write-ColorOutput "• Domain configured and pointing to your server" "Gray"
    Write-ColorOutput "• Kubernetes cluster running" "Gray"
    Write-ColorOutput "• Port 80 and 443 accessible" "Gray"
    Write-Host ""
    
    Write-ColorOutput "☁️ OPTION 2: Cloudflare SSL (Easiest)" "Blue"
    Write-ColorOutput "======================================" "Blue"
    Write-Host ""
    
    Write-ColorOutput "1. In Cloudflare dashboard:" "Yellow"
    Write-ColorOutput "   • Go to SSL/TLS → Overview" "Gray"
    Write-ColorOutput "   • Set encryption mode: 'Full (strict)'" "Gray"
    Write-ColorOutput "   • Enable 'Always Use HTTPS'" "Gray"
    Write-Host ""
    
    Write-ColorOutput "2. Generate Origin Certificate:" "Yellow"
    Write-ColorOutput "   • Go to SSL/TLS → Origin Server" "Gray"
    Write-ColorOutput "   • Click 'Create Certificate'" "Gray"
    Write-ColorOutput "   • Choose 'Let Cloudflare generate'" "Gray"
    Write-ColorOutput "   • Hostnames: *.yourdomain.com, yourdomain.com" "Gray"
    Write-ColorOutput "   • Key format: PEM" "Gray"
    Write-ColorOutput "   • Download certificate and private key" "Gray"
    Write-Host ""
    
    Write-ColorOutput "💰 OPTION 3: Commercial SSL" "Yellow"
    Write-ColorOutput "============================" "Yellow"
    Write-Host ""
    
    Write-ColorOutput "Providers:" "White"
    Write-ColorOutput "• Comodo/Sectigo" "Gray"
    Write-ColorOutput "• DigiCert" "Gray"
    Write-ColorOutput "• GeoTrust" "Gray"
    Write-ColorOutput "• RapidSSL" "Gray"
    Write-Host ""
    
    Write-ColorOutput "Process:" "White"
    Write-ColorOutput "1. Generate Certificate Signing Request (CSR)" "Gray"
    Write-ColorOutput "2. Purchase certificate from provider" "Gray"
    Write-ColorOutput "3. Complete domain validation" "Gray"
    Write-ColorOutput "4. Download certificate files" "Gray"
    Write-Host ""
}

function Configure-Domain {
    Write-ColorOutput "🌐 DOMAIN CONFIGURATION" "Green"
    Write-ColorOutput "========================" "Green"
    Write-Host ""
    
    $domain = Read-Host "Enter your domain name (e.g., indorsement.com)"
    if (-not $domain) {
        Write-ColorOutput "❌ Domain name is required" "Red"
        return
    }
    
    $useWww = Read-Host "Include www subdomain? (Y/n)"
    $useApi = Read-Host "Use api subdomain for backend? (Y/n)"
    
    $wwwDomain = if ($useWww -ne 'n' -and $useWww -ne 'N') { "www.$domain" } else { $null }
    $apiDomain = if ($useApi -ne 'n' -and $useApi -ne 'N') { "api.$domain" } else { $domain }
    
    Write-ColorOutput "Configuration summary:" "Yellow"
    Write-ColorOutput "• Main domain: $domain" "White"
    if ($wwwDomain) { Write-ColorOutput "• WWW domain: $wwwDomain" "White" }
    Write-ColorOutput "• API domain: $apiDomain" "White"
    Write-Host ""
    
    # Update environment file
    try {
        $envContent = Get-Content $EnvFile -Raw
        $envContent = $envContent -replace "FRONTEND_URL=.*", "FRONTEND_URL=https://$domain"
        $envContent = $envContent -replace "BACKEND_URL=.*", "BACKEND_URL=https://$apiDomain"
        $envContent = $envContent -replace "DOMAIN=.*", "DOMAIN=$domain"
        
        $envContent | Set-Content $EnvFile -NoNewline
        
        Write-ColorOutput "✅ Environment file updated" "Green"
    }
    catch {
        Write-ColorOutput "❌ Failed to update environment file: $_" "Red"
    }
    
    # Generate ingress configuration
    $ingressConfig = @"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: indorsement-ingress
  namespace: default
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  tls:
  - hosts:
    - $domain
"@

    if ($wwwDomain) {
        $ingressConfig += "`n    - $wwwDomain"
    }
    if ($apiDomain -ne $domain) {
        $ingressConfig += "`n    - $apiDomain"
    }

    $ingressConfig += @"

    secretName: indorsement-tls
  rules:
  - host: $domain
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
"@

    if ($wwwDomain) {
        $ingressConfig += @"

  - host: $wwwDomain
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
"@
    }

    if ($apiDomain -ne $domain) {
        $ingressConfig += @"

  - host: $apiDomain
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8000
"@
    } else {
        $ingressConfig += @"
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8000
"@
    }

    try {
        # Create deployment directory if it doesn't exist
        $deploymentDir = Split-Path $IngressFile -Parent
        if (-not (Test-Path $deploymentDir)) {
            New-Item -ItemType Directory -Path $deploymentDir -Force | Out-Null
        }
        
        $ingressConfig | Set-Content $IngressFile -NoNewline
        Write-ColorOutput "✅ Ingress configuration generated: $IngressFile" "Green"
    }
    catch {
        Write-ColorOutput "❌ Failed to create ingress configuration: $_" "Red"
    }
}

function Configure-SSL {
    Write-ColorOutput "🔒 SSL CERTIFICATE CONFIGURATION" "Green"
    Write-ColorOutput "=================================" "Green"
    Write-Host ""
    
    Write-ColorOutput "Choose SSL option:" "White"
    Write-ColorOutput "1. Let's Encrypt (Free, automatic)" "Green"
    Write-ColorOutput "2. Cloudflare Origin Certificate" "Blue"
    Write-ColorOutput "3. Upload custom certificate" "Yellow"
    Write-Host ""
    
    $sslChoice = Read-Host "Select option (1-3)"
    
    switch ($sslChoice) {
        "1" { Configure-LetsEncrypt }
        "2" { Configure-CloudflareSSL }
        "3" { Configure-CustomSSL }
        default { Write-ColorOutput "❌ Invalid option" "Red" }
    }
}

function Configure-LetsEncrypt {
    Write-ColorOutput "🆓 CONFIGURING LET'S ENCRYPT" "Green"
    Write-ColorOutput "=============================" "Green"
    Write-Host ""
    
    $email = Read-Host "Enter email for Let's Encrypt notifications"
    if (-not $email) {
        Write-ColorOutput "❌ Email is required for Let's Encrypt" "Red"
        return
    }
    
    # Generate cert-manager configuration
    $certManagerConfig = @"
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: $email
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: $email
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        ingress:
          class: nginx
"@

    try {
        # Create deployment directory if it doesn't exist
        $deploymentDir = Split-Path $CertManagerFile -Parent
        if (-not (Test-Path $deploymentDir)) {
            New-Item -ItemType Directory -Path $deploymentDir -Force | Out-Null
        }
        
        $certManagerConfig | Set-Content $CertManagerFile -NoNewline
        Write-ColorOutput "✅ cert-manager configuration generated: $CertManagerFile" "Green"
        
        Write-ColorOutput "Next steps:" "Yellow"
        Write-ColorOutput "1. Install cert-manager: kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v1.13.0/cert-manager.yaml" "Gray"
        Write-ColorOutput "2. Apply configuration: kubectl apply -f $CertManagerFile" "Gray"
        Write-ColorOutput "3. Deploy ingress: kubectl apply -f $IngressFile" "Gray"
    }
    catch {
        Write-ColorOutput "❌ Failed to create cert-manager configuration: $_" "Red"
    }
}

function Configure-CloudflareSSL {
    Write-ColorOutput "☁️ CONFIGURING CLOUDFLARE SSL" "Blue"
    Write-ColorOutput "==============================" "Blue"
    Write-Host ""
    
    Write-ColorOutput "Prerequisites:" "Yellow"
    Write-ColorOutput "• Domain managed by Cloudflare" "Gray"
    Write-ColorOutput "• Origin certificate downloaded from Cloudflare" "Gray"
    Write-Host ""
    
    $certPath = Read-Host "Enter path to certificate file (.pem)"
    $keyPath = Read-Host "Enter path to private key file (.key)"
    
    if (-not (Test-Path $certPath)) {
        Write-ColorOutput "❌ Certificate file not found: $certPath" "Red"
        return
    }
    
    if (-not (Test-Path $keyPath)) {
        Write-ColorOutput "❌ Private key file not found: $keyPath" "Red"
        return
    }
    
    try {
        # Create TLS secret
        $certContent = Get-Content $certPath -Raw
        $keyContent = Get-Content $keyPath -Raw
        
        $tlsSecret = @"
apiVersion: v1
kind: Secret
metadata:
  name: indorsement-tls
  namespace: default
type: kubernetes.io/tls
data:
  tls.crt: $([Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($certContent)))
  tls.key: $([Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($keyContent)))
"@

        $secretFile = "C:\Users\xxcha\OneDrive\Desktop\IndorsementStuff\new\deployment\k8s\tls-secret.yaml"
        $tlsSecret | Set-Content $secretFile -NoNewline
        
        Write-ColorOutput "✅ TLS secret created: $secretFile" "Green"
        Write-ColorOutput "Apply with: kubectl apply -f $secretFile" "Gray"
    }
    catch {
        Write-ColorOutput "❌ Failed to create TLS secret: $_" "Red"
    }
}

function Configure-CustomSSL {
    Write-ColorOutput "📜 CONFIGURING CUSTOM SSL CERTIFICATE" "Yellow"
    Write-ColorOutput "======================================" "Yellow"
    Write-Host ""
    
    $certPath = Read-Host "Enter path to certificate file (.crt or .pem)"
    $keyPath = Read-Host "Enter path to private key file (.key)"
    $chainPath = Read-Host "Enter path to certificate chain file (optional, press Enter to skip)"
    
    if (-not (Test-Path $certPath)) {
        Write-ColorOutput "❌ Certificate file not found: $certPath" "Red"
        return
    }
    
    if (-not (Test-Path $keyPath)) {
        Write-ColorOutput "❌ Private key file not found: $keyPath" "Red"
        return
    }
    
    try {
        $certContent = Get-Content $certPath -Raw
        $keyContent = Get-Content $keyPath -Raw
        
        if ($chainPath -and (Test-Path $chainPath)) {
            $chainContent = Get-Content $chainPath -Raw
            $certContent = $certContent + "`n" + $chainContent
        }
        
        $tlsSecret = @"
apiVersion: v1
kind: Secret
metadata:
  name: indorsement-tls
  namespace: default
type: kubernetes.io/tls
data:
  tls.crt: $([Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($certContent)))
  tls.key: $([Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($keyContent)))
"@

        $secretFile = "C:\Users\xxcha\OneDrive\Desktop\IndorsementStuff\new\deployment\k8s\tls-secret.yaml"
        $tlsSecret | Set-Content $secretFile -NoNewline
        
        Write-ColorOutput "✅ TLS secret created: $secretFile" "Green"
        Write-ColorOutput "Apply with: kubectl apply -f $secretFile" "Gray"
    }
    catch {
        Write-ColorOutput "❌ Failed to create TLS secret: $_" "Red"
    }
}

function Validate-DomainSSL {
    Write-ColorOutput "🔍 VALIDATING DOMAIN & SSL SETUP" "Blue"
    Write-ColorOutput "=================================" "Blue"
    Write-Host ""
    
    $issues = @()
    
    # Check environment file
    if (Test-Path $EnvFile) {
        $envContent = Get-Content $EnvFile -Raw
        
        if ($envContent -match "DOMAIN=(.+)") {
            $domain = $matches[1]
            Write-ColorOutput "✅ Domain configured: $domain" "Green"
            
            # Test DNS resolution
            try {
                $dnsResult = Resolve-DnsName $domain -ErrorAction Stop
                Write-ColorOutput "✅ DNS resolution successful" "Green"
            }
            catch {
                $issues += "❌ DNS resolution failed for $domain"
            }
        } else {
            $issues += "⚠️ Domain not configured in environment"
        }
        
        if ($envContent -match "FRONTEND_URL=https://") {
            Write-ColorOutput "✅ HTTPS configured for frontend" "Green"
        } else {
            $issues += "⚠️ HTTPS not configured for frontend URL"
        }
    } else {
        $issues += "❌ Environment file not found"
    }
    
    # Check ingress configuration
    if (Test-Path $IngressFile) {
        $ingressContent = Get-Content $IngressFile -Raw
        
        if ($ingressContent -match "cert-manager.io/cluster-issuer") {
            Write-ColorOutput "✅ cert-manager configured in ingress" "Green"
        } else {
            $issues += "⚠️ cert-manager not configured in ingress"
        }
        
        if ($ingressContent -match "tls:") {
            Write-ColorOutput "✅ TLS configured in ingress" "Green"
        } else {
            $issues += "⚠️ TLS not configured in ingress"
        }
    } else {
        $issues += "⚠️ Ingress configuration not found"
    }
    
    # Check cert-manager configuration
    if (Test-Path $CertManagerFile) {
        Write-ColorOutput "✅ cert-manager configuration found" "Green"
    } else {
        $issues += "⚠️ cert-manager configuration not found"
    }
    
    if ($issues.Count -eq 0) {
        Write-ColorOutput "🎉 All domain and SSL validations passed!" "Green"
        return $true
    } else {
        Write-ColorOutput "⚠️ Domain/SSL validation issues found:" "Yellow"
        foreach ($issue in $issues) {
            Write-ColorOutput "   $issue" "Red"
        }
        return $false
    }
}

function Start-InteractiveSetup {
    Write-ColorOutput "🌐 INTERACTIVE DOMAIN & SSL SETUP" "Cyan"
    Write-ColorOutput "==================================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "This wizard will help you configure domain and SSL certificates." "White"
    Write-Host ""
    
    $continue = Read-Host "Continue with interactive setup? (Y/n)"
    if ($continue -eq 'n' -or $continue -eq 'N') {
        return
    }
    
    Write-Host ""
    Write-ColorOutput "=== STEP 1: Domain Configuration ===" "Yellow"
    Configure-Domain
    
    Write-Host ""
    Write-ColorOutput "=== STEP 2: SSL Configuration ===" "Yellow"
    Configure-SSL
    
    Write-Host ""
    Write-ColorOutput "=== STEP 3: Validation ===" "Yellow"
    Validate-DomainSSL
    
    Write-Host ""
    Write-ColorOutput "🎉 Interactive setup complete!" "Green"
}

function Show-MainMenu {
    Write-ColorOutput "🌐 DOMAIN & SSL CONFIGURATION MANAGER" "Cyan"
    Write-ColorOutput "======================================" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "Choose configuration option:" "White"
    Write-ColorOutput "1. 🌐 Configure domain" "Yellow"
    Write-ColorOutput "2. 🔒 Configure SSL certificates" "Yellow"
    Write-ColorOutput "3. 📋 Show setup guides" "Yellow"
    Write-ColorOutput "4. ✅ Validate configuration" "Yellow"
    Write-ColorOutput "5. 🤖 Interactive setup wizard" "Yellow"
    Write-ColorOutput "6. 🚪 Exit" "Yellow"
    Write-Host ""
    
    $choice = Read-Host "Select option (1-6)"
    
    switch ($choice) {
        "1" { Configure-Domain }
        "2" { Configure-SSL }
        "3" { 
            Show-DomainSetupGuide
            Write-Host ""
            Show-SSLSetupGuide
        }
        "4" { Validate-DomainSSL }
        "5" { Start-InteractiveSetup }
        "6" { Write-ColorOutput "👋 Goodbye!" "Green"; return }
        default { Write-ColorOutput "❌ Invalid option" "Red" }
    }
    
    if ($choice -ne "6") {
        Write-Host ""
        Read-Host "Press Enter to continue"
        Show-MainMenu
    }
}

# Main execution
if ($SetupDomain) {
    Configure-Domain
} elseif ($ConfigureSSL) {
    Configure-SSL
} elseif ($ValidateSetup) {
    Validate-DomainSSL
} elseif ($ShowGuides) {
    Show-DomainSetupGuide
    Show-SSLSetupGuide
} elseif ($InteractiveSetup) {
    Start-InteractiveSetup
} else {
    Show-MainMenu
}