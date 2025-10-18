# Domain and SSL Configuration Tool for Production Deployment
# Manages domain setup, SSL certificates, and ingress configuration

param(
    [switch]$CheckDomain,
    [switch]$SetupDomain,
    [switch]$ConfigureSSL,
    [switch]$ShowGuide,
    [string]$Domain,
    [string]$CertProvider = "letsencrypt"
)

function Show-DomainGuide {
    Write-Host "`n🌐 DOMAIN & SSL CONFIGURATION GUIDE" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    
    Write-Host "`n📋 Domain Setup Steps:" -ForegroundColor Yellow
    Write-Host "1. Purchase/configure domain"
    Write-Host "2. Set up DNS records"
    Write-Host "3. Configure SSL certificates"
    Write-Host "4. Update ingress configuration"
    Write-Host "5. Verify domain routing"
    
    Write-Host "`n🛠️ Configuration Commands:" -ForegroundColor Green
    Write-Host ".\scripts\domain-configurator.ps1 -CheckDomain                    # Check domain status"
    Write-Host ".\scripts\domain-configurator.ps1 -SetupDomain -Domain example.com # Setup specific domain"
    Write-Host ".\scripts\domain-configurator.ps1 -ConfigureSSL                   # Setup SSL certificates"
    Write-Host ".\scripts\domain-configurator.ps1 -ShowGuide                      # Show this guide"
}

function Test-DomainConfiguration {
    param([string]$DomainName)
    
    Write-Host "`n🔍 CHECKING DOMAIN CONFIGURATION" -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    
    if (-not $DomainName) {
        $DomainName = Read-Host "Enter domain name to check"
    }
    
    Write-Host "`n📡 Testing DNS resolution for: $DomainName" -ForegroundColor Yellow
    
    try {
        $dnsResult = Resolve-DnsName $DomainName -ErrorAction SilentlyContinue
        if ($dnsResult) {
            Write-Host "✅ DNS resolves to: $($dnsResult.IPAddress -join ', ')" -ForegroundColor Green
        } else {
            Write-Host "❌ DNS resolution failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ DNS lookup error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n🔒 Testing SSL certificate..." -ForegroundColor Yellow
    try {
        $uri = "https://$DomainName"
        $request = [System.Net.WebRequest]::Create($uri)
        $request.Timeout = 10000
        $response = $request.GetResponse()
        Write-Host "✅ SSL certificate is valid" -ForegroundColor Green
        $response.Close()
    } catch {
        Write-Host "⚠️  SSL not configured or invalid: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Check ingress configuration
    $ingressFile = "deployment\k8s\ingress.yaml"
    if (Test-Path $ingressFile) {
        $content = Get-Content $ingressFile -Raw
        if ($content -match $DomainName) {
            Write-Host "✅ Domain found in ingress configuration" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Domain not found in ingress configuration" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Ingress configuration file not found" -ForegroundColor Red
    }
}

function Setup-Domain {
    param([string]$DomainName)
    
    Write-Host "`n🌐 DOMAIN SETUP CONFIGURATION" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    
    if (-not $DomainName) {
        $DomainName = Read-Host "Enter your domain name (e.g., indorsement.com)"
    }
    
    Write-Host "`n📝 Domain Setup Instructions for: $DomainName" -ForegroundColor Yellow
    
    Write-Host "`n1. DNS Configuration:" -ForegroundColor Green
    Write-Host "   Add these DNS records to your domain provider:"
    Write-Host "   • A Record:     @ → [Your Server IP]"
    Write-Host "   • A Record:     www → [Your Server IP]"
    Write-Host "   • CNAME Record: api → $DomainName"
    Write-Host "   • CNAME Record: app → $DomainName"
    
    Write-Host "`n2. Kubernetes Configuration:" -ForegroundColor Green
    Write-Host "   Updating ingress and service configurations..."
    
    Update-IngressConfiguration -Domain $DomainName
    Update-EnvironmentDomain -Domain $DomainName
    
    Write-Host "`n3. SSL Certificate Setup:" -ForegroundColor Green
    Write-Host "   Choose SSL certificate method:"
    Write-Host "   1. Let's Encrypt (Automatic, Free)"
    Write-Host "   2. Custom Certificate (Manual)"
    
    $sslChoice = Read-Host "Enter choice (1-2)"
    
    switch ($sslChoice) {
        "1" { Setup-LetsEncrypt -Domain $DomainName }
        "2" { Setup-CustomSSL -Domain $DomainName }
        default { 
            Write-Host "Invalid choice, defaulting to Let's Encrypt" -ForegroundColor Yellow
            Setup-LetsEncrypt -Domain $DomainName
        }
    }
}

function Update-IngressConfiguration {
    param([string]$Domain)
    
    Write-Host "`n🔄 Updating ingress configuration..." -ForegroundColor Yellow
    
    $ingressFile = "deployment\k8s\ingress.yaml"
    $template = @"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: indorsement-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
  - hosts:
    - $Domain
    - www.$Domain
    - api.$Domain
    secretName: indorsement-tls
  rules:
  - host: $Domain
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: indorsement-frontend
            port:
              number: 80
  - host: www.$Domain
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: indorsement-frontend
            port:
              number: 80
  - host: api.$Domain
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: indorsement-backend
            port:
              number: 8000
"@
    
    Set-Content $ingressFile -Value $template
    Write-Host "✅ Ingress configuration updated for $Domain" -ForegroundColor Green
}

function Update-EnvironmentDomain {
    param([string]$Domain)
    
    Write-Host "`n🔄 Updating environment configuration..." -ForegroundColor Yellow
    
    $envFile = ".env.production"
    if (Test-Path $envFile) {
        $content = Get-Content $envFile -Raw
        
        # Update domain-related environment variables
        $content = $content -replace "DOMAIN=localhost", "DOMAIN=$Domain"
        $content = $content -replace "FRONTEND_URL=http://localhost:3000", "FRONTEND_URL=https://$Domain"
        $content = $content -replace "BACKEND_URL=http://localhost:8000", "BACKEND_URL=https://api.$Domain"
        $content = $content -replace "CORS_ORIGIN=http://localhost:3000", "CORS_ORIGIN=https://$Domain,https://www.$Domain"
        
        Set-Content $envFile -Value $content
        Write-Host "✅ Environment configuration updated" -ForegroundColor Green
    }
}

function Setup-LetsEncrypt {
    param([string]$Domain)
    
    Write-Host "`n🔒 SETTING UP LET'S ENCRYPT SSL" -ForegroundColor Cyan
    Write-Host "===============================" -ForegroundColor Cyan
    
    Write-Host "`n📝 Let's Encrypt Setup Instructions:" -ForegroundColor Yellow
    Write-Host "1. cert-manager will be installed in your Kubernetes cluster"
    Write-Host "2. Automatic certificate provisioning will be configured"
    Write-Host "3. Certificates will auto-renew every 90 days"
    
    # Create cert-manager issuer
    $issuerFile = "deployment\k8s\cert-issuer.yaml"
    $issuerTemplate = @"
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@$Domain
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
"@
    
    Set-Content $issuerFile -Value $issuerTemplate
    Write-Host "✅ cert-manager issuer configuration created" -ForegroundColor Green
    
    Write-Host "`n🚀 To complete Let's Encrypt setup after deployment:" -ForegroundColor Yellow
    Write-Host "kubectl apply -f deployment/k8s/cert-issuer.yaml"
}

function Setup-CustomSSL {
    param([string]$Domain)
    
    Write-Host "`n🔐 CUSTOM SSL CERTIFICATE SETUP" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    
    Write-Host "`n📝 Custom SSL Instructions:" -ForegroundColor Yellow
    Write-Host "1. Obtain SSL certificate from your provider"
    Write-Host "2. Ensure you have these files:"
    Write-Host "   • Certificate file (*.crt or *.pem)"
    Write-Host "   • Private key file (*.key)"
    Write-Host "   • Certificate chain/bundle (optional)"
    
    $certPath = Read-Host "`nEnter path to certificate file (or press Enter to skip)"
    $keyPath = Read-Host "Enter path to private key file (or press Enter to skip)"
    
    if ($certPath -and $keyPath -and (Test-Path $certPath) -and (Test-Path $keyPath)) {
        Write-Host "`n🔄 Creating Kubernetes TLS secret..." -ForegroundColor Yellow
        
        $secretFile = "deployment\k8s\tls-secret.yaml"
        $certData = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes($certPath))
        $keyData = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes($keyPath))
        
        $secretTemplate = @"
apiVersion: v1
kind: Secret
metadata:
  name: indorsement-tls
  namespace: default
type: kubernetes.io/tls
data:
  tls.crt: $certData
  tls.key: $keyData
"@
        
        Set-Content $secretFile -Value $secretTemplate
        Write-Host "✅ TLS secret configuration created" -ForegroundColor Green
        
        Write-Host "`n🚀 To apply after deployment:" -ForegroundColor Yellow
        Write-Host "kubectl apply -f deployment/k8s/tls-secret.yaml"
    } else {
        Write-Host "`n⚠️  Certificate files not found or not provided" -ForegroundColor Yellow
        Write-Host "You can manually create the TLS secret later with:" -ForegroundColor Yellow
        Write-Host "kubectl create secret tls indorsement-tls --cert=path/to/cert.crt --key=path/to/private.key"
    }
}

function Test-SSLConfiguration {
    param([string]$Domain)
    
    Write-Host "`n🧪 TESTING SSL CONFIGURATION" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    
    if (-not $Domain) {
        $Domain = Read-Host "Enter domain to test"
    }
    
    Write-Host "`n🔍 Testing SSL for: https://$Domain" -ForegroundColor Yellow
    
    try {
        # Test SSL certificate
        $uri = "https://$Domain"
        $request = [System.Net.WebRequest]::Create($uri)
        $request.Timeout = 10000
        
        $response = $request.GetResponse()
        $cert = $request.ServicePoint.Certificate
        
        if ($cert) {
            $cert2 = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($cert)
            Write-Host "✅ SSL Certificate Details:" -ForegroundColor Green
            Write-Host "   Subject: $($cert2.Subject)"
            Write-Host "   Issuer: $($cert2.Issuer)"
            Write-Host "   Valid From: $($cert2.NotBefore)"
            Write-Host "   Valid To: $($cert2.NotAfter)"
            
            $daysUntilExpiry = ($cert2.NotAfter - (Get-Date)).Days
            if ($daysUntilExpiry -lt 30) {
                Write-Host "⚠️  Certificate expires in $daysUntilExpiry days!" -ForegroundColor Yellow
            } else {
                Write-Host "✅ Certificate valid for $daysUntilExpiry more days" -ForegroundColor Green
            }
        }
        
        $response.Close()
        
    } catch {
        Write-Host "❌ SSL test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution logic
if ($CheckDomain) {
    Test-DomainConfiguration -DomainName $Domain
} elseif ($SetupDomain) {
    Setup-Domain -DomainName $Domain
} elseif ($ConfigureSSL) {
    Write-Host "`n🔒 SSL CONFIGURATION" -ForegroundColor Cyan
    Write-Host "===================" -ForegroundColor Cyan
    
    if (-not $Domain) {
        $Domain = Read-Host "Enter your domain name"
    }
    
    Write-Host "`nChoose SSL configuration method:"
    Write-Host "1. Let's Encrypt (Automatic)"
    Write-Host "2. Custom Certificate"
    Write-Host "3. Test existing SSL"
    
    $choice = Read-Host "Enter choice (1-3)"
    
    switch ($choice) {
        "1" { Setup-LetsEncrypt -Domain $Domain }
        "2" { Setup-CustomSSL -Domain $Domain }
        "3" { Test-SSLConfiguration -Domain $Domain }
        default { Write-Host "Invalid choice" -ForegroundColor Red }
    }
} else {
    Show-DomainGuide
}