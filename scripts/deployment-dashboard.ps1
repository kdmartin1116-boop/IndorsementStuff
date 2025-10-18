# Comprehensive Deployment Dashboard and Progress Tracker
# Shows real-time status of all deployment components and steps

param(
    [switch]$ShowDashboard,
    [switch]$RunFullCheck,
    [switch]$Interactive,
    [switch]$ExportReport,
    [int]$RefreshInterval = 5
)

function Show-DeploymentDashboard {
    Write-Host "`n🚀 INDORSEMENT PLATFORM DEPLOYMENT DASHBOARD" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    
    # Step 1: Infrastructure Status
    Write-Host "`n📊 STEP 1: INFRASTRUCTURE STATUS" -ForegroundColor Yellow
    Write-Host "=================================" -ForegroundColor Yellow
    
    $infraStatus = Test-InfrastructureStatus
    Show-StatusSection -Title "Docker Desktop" -Status $infraStatus.Docker -Details $infraStatus.DockerDetails
    Show-StatusSection -Title "Kubernetes" -Status $infraStatus.Kubernetes -Details $infraStatus.KubernetesDetails  
    Show-StatusSection -Title "System Resources" -Status $infraStatus.Resources -Details $infraStatus.ResourcesDetails
    
    # Step 2: Credential Status
    Write-Host "`n🔐 STEP 2: CREDENTIAL STATUS" -ForegroundColor Yellow
    Write-Host "=============================" -ForegroundColor Yellow
    
    $credStatus = Test-CredentialStatus
    Show-StatusSection -Title "OAuth Providers" -Status $credStatus.OAuth -Details $credStatus.OAuthDetails
    Show-StatusSection -Title "Cloud Services" -Status $credStatus.Cloud -Details $credStatus.CloudDetails
    Show-StatusSection -Title "API Services" -Status $credStatus.APIs -Details $credStatus.APIDetails
    
    # Step 3: Domain & SSL Status
    Write-Host "`n🌐 STEP 3: DOMAIN & SSL STATUS" -ForegroundColor Yellow
    Write-Host "===============================" -ForegroundColor Yellow
    
    $domainStatus = Test-DomainStatus
    Show-StatusSection -Title "Domain Configuration" -Status $domainStatus.Domain -Details $domainStatus.DomainDetails
    Show-StatusSection -Title "SSL Certificates" -Status $domainStatus.SSL -Details $domainStatus.SSLDetails
    Show-StatusSection -Title "DNS Resolution" -Status $domainStatus.DNS -Details $domainStatus.DNSDetails
    
    # Step 4: Deployment Status  
    Write-Host "`n🚢 STEP 4: DEPLOYMENT STATUS" -ForegroundColor Yellow
    Write-Host "=============================" -ForegroundColor Yellow
    
    $deployStatus = Test-DeploymentStatus
    Show-StatusSection -Title "Docker Images" -Status $deployStatus.Images -Details $deployStatus.ImageDetails
    Show-StatusSection -Title "Kubernetes Pods" -Status $deployStatus.Pods -Details $deployStatus.PodDetails
    Show-StatusSection -Title "Services" -Status $deployStatus.Services -Details $deployStatus.ServiceDetails
    Show-StatusSection -Title "Ingress" -Status $deployStatus.Ingress -Details $deployStatus.IngressDetails
    
    # Overall Summary
    Write-Host "`n🎯 OVERALL DEPLOYMENT READINESS" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    
    $overallScore = Calculate-OverallReadiness -Infra $infraStatus -Cred $credStatus -Domain $domainStatus -Deploy $deployStatus
    Show-ReadinessScore -Score $overallScore
    Show-NextSteps -Score $overallScore
}

function Test-InfrastructureStatus {
    $status = @{
        Docker = "Unknown"
        DockerDetails = @()
        Kubernetes = "Unknown" 
        KubernetesDetails = @()
        Resources = "Unknown"
        ResourcesDetails = @()
    }
    
    # Test Docker
    try {
        $dockerVersion = docker --version 2>$null
        if ($dockerVersion) {
            $dockerInfo = docker info --format "{{json .}}" 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($dockerInfo) {
                $status.Docker = "Ready"
                $status.DockerDetails += "Version: $dockerVersion"
                $status.DockerDetails += "Status: Running"
                $status.DockerDetails += "Containers: $($dockerInfo.Containers)"
            } else {
                $status.Docker = "Not Running"
                $status.DockerDetails += "Docker is installed but not running"
            }
        } else {
            $status.Docker = "Not Installed"
            $status.DockerDetails += "Docker Desktop not found"
        }
    } catch {
        $status.Docker = "Error"
        $status.DockerDetails += "Error: $($_.Exception.Message)"
    }
    
    # Test Kubernetes
    try {
        $kubectlVersion = kubectl version --client=true 2>$null
        if ($kubectlVersion) {
            $clusterInfo = kubectl cluster-info 2>$null
            if ($clusterInfo) {
                $status.Kubernetes = "Ready"
                $status.KubernetesDetails += "kubectl available"
                $status.KubernetesDetails += "Cluster accessible"
            } else {
                $status.Kubernetes = "No Cluster"
                $status.KubernetesDetails += "kubectl available but no cluster connection"
            }
        } else {
            $status.Kubernetes = "Not Installed"
            $status.KubernetesDetails += "kubectl not found"
        }
    } catch {
        $status.Kubernetes = "Error"
        $status.KubernetesDetails += "Error: $($_.Exception.Message)"
    }
    
    # Test Resources
    try {
        $memory = Get-CimInstance -ClassName Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum
        $totalMemoryGB = [math]::Round($memory.Sum / 1GB, 1)
        
        $cpu = Get-CimInstance -ClassName Win32_Processor
        $cores = ($cpu | Measure-Object -Property NumberOfCores -Sum).Sum
        
        if ($totalMemoryGB -ge 8 -and $cores -ge 4) {
            $status.Resources = "Sufficient"
            $status.ResourcesDetails += "RAM: ${totalMemoryGB}GB (Recommended: 8GB+)"
            $status.ResourcesDetails += "CPU Cores: $cores (Recommended: 4+)"
        } else {
            $status.Resources = "Limited"
            $status.ResourcesDetails += "RAM: ${totalMemoryGB}GB (Need: 8GB+)"
            $status.ResourcesDetails += "CPU Cores: $cores (Need: 4+)"
        }
    } catch {
        $status.Resources = "Unknown"
        $status.ResourcesDetails += "Unable to check system resources"
    }
    
    return $status
}

function Test-CredentialStatus {
    $status = @{
        OAuth = "Unknown"
        OAuthDetails = @()
        Cloud = "Unknown"
        CloudDetails = @()
        APIs = "Unknown" 
        APIDetails = @()
    }
    
    $envFile = ".env.production"
    if (-not (Test-Path $envFile)) {
        $status.OAuth = "Missing"
        $status.Cloud = "Missing"
        $status.APIs = "Missing"
        $status.OAuthDetails += "Environment file not found"
        $status.CloudDetails += "Environment file not found"
        $status.APIDetails += "Environment file not found"
        return $status
    }
    
    $envContent = Get-Content $envFile -Raw
    
    # Check OAuth
    $oauthPlaceholders = 0
    $oauthConfigs = @("GOOGLE_CLIENT_ID", "GITHUB_CLIENT_ID", "AUTH0_CLIENT_ID")
    foreach ($config in $oauthConfigs) {
        if ($envContent -match "$config=your_") { $oauthPlaceholders++ }
    }
    
    if ($oauthPlaceholders -eq 0) {
        $status.OAuth = "Configured"
        $status.OAuthDetails += "All OAuth providers configured"
    } elseif ($oauthPlaceholders -lt $oauthConfigs.Count) {
        $status.OAuth = "Partial"
        $status.OAuthDetails += "$oauthPlaceholders/$($oauthConfigs.Count) providers need configuration"
    } else {
        $status.OAuth = "Not Configured"
        $status.OAuthDetails += "All OAuth providers need configuration"
    }
    
    # Check Cloud Services
    $cloudPlaceholders = 0
    $cloudConfigs = @("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "S3_BUCKET")
    foreach ($config in $cloudConfigs) {
        if ($envContent -match "$config=your_|$config=indorsement-") { $cloudPlaceholders++ }
    }
    
    if ($cloudPlaceholders -eq 0) {
        $status.Cloud = "Configured"
        $status.CloudDetails += "AWS and storage configured"
    } elseif ($cloudPlaceholders -lt $cloudConfigs.Count) {
        $status.Cloud = "Partial"
        $status.CloudDetails += "$cloudPlaceholders/$($cloudConfigs.Count) cloud configs need setup"
    } else {
        $status.Cloud = "Not Configured"
        $status.CloudDetails += "Cloud services need configuration"
    }
    
    # Check APIs
    $apiPlaceholders = 0
    $apiConfigs = @("OPENAI_API_KEY", "SENDGRID_API_KEY", "SENTRY_DSN")
    foreach ($config in $apiConfigs) {
        if ($envContent -match "$config=your_") { $apiPlaceholders++ }
    }
    
    if ($apiPlaceholders -eq 0) {
        $status.APIs = "Configured"
        $status.APIDetails += "All API services configured"
    } elseif ($apiPlaceholders -lt $apiConfigs.Count) {
        $status.APIs = "Partial"
        $status.APIDetails += "$apiPlaceholders/$($apiConfigs.Count) API keys need setup"
    } else {
        $status.APIs = "Not Configured"
        $status.APIDetails += "API services need configuration"
    }
    
    return $status
}

function Test-DomainStatus {
    $status = @{
        Domain = "Unknown"
        DomainDetails = @()
        SSL = "Unknown"
        SSLDetails = @()
        DNS = "Unknown"
        DNSDetails = @()
    }
    
    $envFile = ".env.production"
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile -Raw
        $domainMatch = $envContent | Select-String "DOMAIN=(.+)" 
        
        if ($domainMatch -and $domainMatch.Matches[0].Groups[1].Value -ne "localhost") {
            $domain = $domainMatch.Matches[0].Groups[1].Value
            $status.Domain = "Configured"
            $status.DomainDetails += "Domain: $domain"
            
            # Test DNS
            try {
                $dnsResult = Resolve-DnsName $domain -ErrorAction SilentlyContinue
                if ($dnsResult) {
                    $status.DNS = "Resolving"
                    $status.DNSDetails += "Resolves to: $($dnsResult.IPAddress -join ', ')"
                } else {
                    $status.DNS = "Not Resolving"
                    $status.DNSDetails += "DNS resolution failed"
                }
            } catch {
                $status.DNS = "Error"
                $status.DNSDetails += "DNS check error"
            }
            
            # Test SSL
            try {
                $uri = "https://$domain"
                $request = [System.Net.WebRequest]::Create($uri)
                $request.Timeout = 5000
                $response = $request.GetResponse()
                $status.SSL = "Valid"
                $status.SSLDetails += "SSL certificate is valid"
                $response.Close()
            } catch {
                $status.SSL = "Invalid"
                $status.SSLDetails += "SSL not configured or invalid"
            }
        } else {
            $status.Domain = "Not Configured"
            $status.DomainDetails += "Using localhost"
            $status.DNS = "N/A"
            $status.DNSDetails += "No domain configured"
            $status.SSL = "N/A" 
            $status.SSLDetails += "No domain configured"
        }
    } else {
        $status.Domain = "Missing"
        $status.DomainDetails += "Environment file not found"
    }
    
    return $status
}

function Test-DeploymentStatus {
    $status = @{
        Images = "Unknown"
        ImageDetails = @()
        Pods = "Unknown"
        PodDetails = @()
        Services = "Unknown"
        ServiceDetails = @()
        Ingress = "Unknown"
        IngressDetails = @()
    }
    
    # Check Docker Images
    try {
        $frontendImage = docker images indorsement-frontend:latest --quiet 2>$null
        $backendImage = docker images indorsement-backend:latest --quiet 2>$null
        
        $imageCount = 0
        if ($frontendImage) { 
            $imageCount++
            $status.ImageDetails += "Frontend image: Built"
        } else {
            $status.ImageDetails += "Frontend image: Not built"
        }
        
        if ($backendImage) { 
            $imageCount++
            $status.ImageDetails += "Backend image: Built"
        } else {
            $status.ImageDetails += "Backend image: Not built"
        }
        
        if ($imageCount -eq 2) {
            $status.Images = "Ready"
        } elseif ($imageCount -eq 1) {
            $status.Images = "Partial"
        } else {
            $status.Images = "Not Built"
        }
    } catch {
        $status.Images = "Error"
        $status.ImageDetails += "Error checking images"
    }
    
    # Check Kubernetes Deployment
    try {
        $pods = kubectl get pods -n indorsement --no-headers 2>$null
        if ($pods) {
            $podLines = $pods -split "`n" | Where-Object { $_ }
            $readyPods = ($podLines | Where-Object { $_ -match "Running" }).Count
            $totalPods = $podLines.Count
            
            $status.Pods = if ($readyPods -eq $totalPods -and $totalPods -gt 0) { "Running" } 
                          elseif ($readyPods -gt 0) { "Partial" } 
                          else { "Not Running" }
            $status.PodDetails += "Ready: $readyPods/$totalPods pods"
        } else {
            $status.Pods = "Not Deployed"
            $status.PodDetails += "No pods found in indorsement namespace"
        }
        
        # Check Services
        $services = kubectl get services -n indorsement --no-headers 2>$null
        if ($services) {
            $serviceLines = $services -split "`n" | Where-Object { $_ }
            $status.Services = "Running"
            $status.ServiceDetails += "$($serviceLines.Count) services active"
        } else {
            $status.Services = "Not Deployed"
            $status.ServiceDetails += "No services found"
        }
        
        # Check Ingress
        $ingress = kubectl get ingress -n indorsement --no-headers 2>$null
        if ($ingress) {
            $status.Ingress = "Configured"
            $status.IngressDetails += "Ingress controller active"
        } else {
            $status.Ingress = "Not Configured"
            $status.IngressDetails += "No ingress found"
        }
        
    } catch {
        $status.Pods = "Error"
        $status.Services = "Error"
        $status.Ingress = "Error"
        $status.PodDetails += "Error checking Kubernetes"
    }
    
    return $status
}

function Show-StatusSection {
    param(
        [string]$Title,
        [string]$Status,
        [array]$Details
    )
    
    $statusIcon = switch ($Status) {
        "Ready" { "✅" }
        "Configured" { "✅" }
        "Running" { "✅" }
        "Valid" { "✅" }
        "Sufficient" { "✅" }
        "Resolving" { "✅" }
        "Partial" { "⚠️ " }
        "Limited" { "⚠️ " }
        "Not Running" { "❌" }
        "Not Installed" { "❌" }
        "Not Configured" { "❌" }
        "Not Built" { "❌" }
        "Not Deployed" { "❌" }
        "Invalid" { "❌" }
        "Missing" { "❌" }
        "Error" { "🔴" }
        default { "❓" }
    }
    
    $statusColor = switch ($Status) {
        { $_ -in @("Ready", "Configured", "Running", "Valid", "Sufficient", "Resolving") } { "Green" }
        { $_ -in @("Partial", "Limited") } { "Yellow" }
        { $_ -in @("Not Running", "Not Installed", "Not Configured", "Not Built", "Not Deployed", "Invalid", "Missing") } { "Red" }
        { $_ -in @("Error") } { "Magenta" }
        default { "Gray" }
    }
    
    Write-Host "  $statusIcon $Title" -ForegroundColor $statusColor -NoNewline
    Write-Host " - $Status" -ForegroundColor $statusColor
    
    foreach ($detail in $Details) {
        Write-Host "    $detail" -ForegroundColor Gray
    }
}

function Calculate-OverallReadiness {
    param($Infra, $Cred, $Domain, $Deploy)
    
    $scores = @()
    
    # Infrastructure Score (30%)
    $infraScore = 0
    if ($Infra.Docker -eq "Ready") { $infraScore += 40 }
    elseif ($Infra.Docker -eq "Not Running") { $infraScore += 20 }
    
    if ($Infra.Kubernetes -eq "Ready") { $infraScore += 40 }
    elseif ($Infra.Kubernetes -eq "No Cluster") { $infraScore += 20 }
    
    if ($Infra.Resources -eq "Sufficient") { $infraScore += 20 }
    elseif ($Infra.Resources -eq "Limited") { $infraScore += 10 }
    
    $scores += @{Name="Infrastructure"; Score=$infraScore; Weight=0.3}
    
    # Credentials Score (25%)
    $credScore = 0
    if ($Cred.OAuth -eq "Configured") { $credScore += 35 }
    elseif ($Cred.OAuth -eq "Partial") { $credScore += 15 }
    
    if ($Cred.Cloud -eq "Configured") { $credScore += 35 }
    elseif ($Cred.Cloud -eq "Partial") { $credScore += 15 }
    
    if ($Cred.APIs -eq "Configured") { $credScore += 30 }
    elseif ($Cred.APIs -eq "Partial") { $credScore += 10 }
    
    $scores += @{Name="Credentials"; Score=$credScore; Weight=0.25}
    
    # Domain Score (20%)
    $domainScore = 0
    if ($Domain.Domain -eq "Configured") { $domainScore += 40 }
    if ($Domain.DNS -eq "Resolving") { $domainScore += 30 }
    if ($Domain.SSL -eq "Valid") { $domainScore += 30 }
    
    $scores += @{Name="Domain"; Score=$domainScore; Weight=0.20}
    
    # Deployment Score (25%)
    $deployScore = 0
    if ($Deploy.Images -eq "Ready") { $deployScore += 30 }
    elseif ($Deploy.Images -eq "Partial") { $deployScore += 15 }
    
    if ($Deploy.Pods -eq "Running") { $deployScore += 35 }
    elseif ($Deploy.Pods -eq "Partial") { $deployScore += 15 }
    
    if ($Deploy.Services -eq "Running") { $deployScore += 20 }
    if ($Deploy.Ingress -eq "Configured") { $deployScore += 15 }
    
    $scores += @{Name="Deployment"; Score=$deployScore; Weight=0.25}
    
    # Calculate weighted average
    $totalScore = 0
    foreach ($score in $scores) {
        $totalScore += $score.Score * $score.Weight
    }
    
    return @{
        Total = [math]::Round($totalScore)
        Breakdown = $scores
    }
}

function Show-ReadinessScore {
    param($Score)
    
    $scoreColor = if ($Score.Total -ge 90) { "Green" }
                 elseif ($Score.Total -ge 70) { "Yellow" }
                 elseif ($Score.Total -ge 50) { "Yellow" }
                 else { "Red" }
    
    Write-Host "`n🎯 Overall Readiness: $($Score.Total)%" -ForegroundColor $scoreColor
    
    Write-Host "`n📊 Score Breakdown:" -ForegroundColor Gray
    foreach ($section in $Score.Breakdown) {
        $sectionPercent = [math]::Round($section.Score)
        Write-Host "  $($section.Name): $sectionPercent%" -ForegroundColor Gray
    }
}

function Show-NextSteps {
    param($Score)
    
    Write-Host "`n🎯 NEXT STEPS" -ForegroundColor Cyan
    Write-Host "=============" -ForegroundColor Cyan
    
    if ($Score.Total -ge 90) {
        Write-Host "🚀 Ready for production deployment!" -ForegroundColor Green
        Write-Host "Run: .\scripts\deploy-production.ps1 -Deploy" -ForegroundColor Green
    }
    elseif ($Score.Total -ge 70) {
        Write-Host "⚡ Almost ready! Complete remaining setup:" -ForegroundColor Yellow
        Write-Host "1. Check credential placeholders"
        Write-Host "2. Verify domain configuration"
        Write-Host "3. Run: .\scripts\deploy-production.ps1 -CheckReadiness"
    }
    elseif ($Score.Total -ge 50) {
        Write-Host "🔧 Significant setup needed:" -ForegroundColor Yellow
        Write-Host "1. .\scripts\docker-setup.ps1 -InstallComponents"
        Write-Host "2. .\scripts\credential-configurator.ps1 -UpdateCredentials" 
        Write-Host "3. .\scripts\domain-configurator.ps1 -SetupDomain"
    }
    else {
        Write-Host "📋 Start with infrastructure setup:" -ForegroundColor Red
        Write-Host "1. Install Docker Desktop with Kubernetes"
        Write-Host "2. Configure system resources (8GB+ RAM, 4+ cores)"
        Write-Host "3. Run: .\scripts\docker-setup.ps1 -SetupGuide"
    }
}

function Start-InteractiveDashboard {
    do {
        Clear-Host
        Show-DeploymentDashboard
        
        Write-Host "`n🔄 Dashboard refreshing every $RefreshInterval seconds..." -ForegroundColor Gray
        Write-Host "Press Ctrl+C to exit" -ForegroundColor Gray
        
        Start-Sleep -Seconds $RefreshInterval
    } while ($true)
}

# Main execution logic
if ($ShowDashboard -or $args.Count -eq 0) {
    Show-DeploymentDashboard
} elseif ($Interactive) {
    Start-InteractiveDashboard
} elseif ($RunFullCheck) {
    Write-Host "🔍 Running comprehensive deployment check..." -ForegroundColor Cyan
    Show-DeploymentDashboard
} elseif ($ExportReport) {
    $reportFile = "deployment-report-$(Get-Date -Format 'yyyy-MM-dd-HH-mm').txt"
    Show-DeploymentDashboard | Out-File $reportFile
    Write-Host "✅ Report exported to: $reportFile" -ForegroundColor Green
} else {
    Show-DeploymentDashboard
}