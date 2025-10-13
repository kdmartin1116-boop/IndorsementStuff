# Multi-User Backup Script
# Run as Administrator to access all user profiles

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupDrive = "E:"  # Change to your flash drive letter
)

$BackupRoot = "$BackupDrive\PCBackup_$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -Path $BackupRoot -ItemType Directory -Force

# Get all user profiles (excluding system accounts)
$UserProfiles = Get-ChildItem C:\Users | Where-Object {
    $_.PSIsContainer -and 
    $_.Name -notin @('Public', 'Default', 'All Users', 'Default User') -and
    !$_.Name.StartsWith('.')
}

Write-Host "Found $($UserProfiles.Count) user profiles to backup:" -ForegroundColor Green
$UserProfiles.Name | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }

foreach ($UserProfile in $UserProfiles) {
    $UserPath = $UserProfile.FullName
    $UserBackupPath = "$BackupRoot\Users\$($UserProfile.Name)"
    
    Write-Host "`nBacking up user: $($UserProfile.Name)" -ForegroundColor Cyan
    
    # Define folders to backup for each user
    $FoldersToBackup = @(
        @{Source="Desktop"; Display="Desktop"},
        @{Source="Documents"; Display="Documents"},
        @{Source="Downloads"; Display="Downloads"},
        @{Source="Pictures"; Display="Pictures"},
        @{Source="Videos"; Display="Videos"},
        @{Source="Music"; Display="Music"},
        @{Source="Favorites"; Display="Browser Favorites"},
        @{Source="AppData\Roaming\Microsoft\Windows\Start Menu"; Display="Start Menu"},
        @{Source="AppData\Local\Google\Chrome\User Data"; Display="Chrome Data"},
        @{Source="AppData\Local\Microsoft\Edge\User Data"; Display="Edge Data"}
    )
    
    foreach ($Folder in $FoldersToBackup) {
        $SourcePath = Join-Path $UserPath $Folder.Source
        $DestPath = Join-Path $UserBackupPath $Folder.Source
        
        if (Test-Path $SourcePath) {
            Write-Host "  Copying $($Folder.Display)..." -ForegroundColor Gray
            try {
                robocopy $SourcePath $DestPath /E /XO /R:2 /W:5 /NP /NDL | Out-Null
                if ($LASTEXITCODE -le 3) {
                    Write-Host "    ✅ Success" -ForegroundColor Green
                } else {
                    Write-Host "    ⚠️  Partial copy (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
                }
            }
            catch {
                Write-Host "    ❌ Error: $_" -ForegroundColor Red
            }
        } else {
            Write-Host "  Skipping $($Folder.Display) (not found)" -ForegroundColor DarkGray
        }
    }
}

# Backup shared/system items
Write-Host "`nBacking up system items..." -ForegroundColor Cyan

# Export installed programs
Write-Host "  Exporting installed programs..." -ForegroundColor Gray
Get-WmiObject -Class Win32_Product | Select-Object Name, Version, InstallDate | 
    Export-Csv "$BackupRoot\InstalledPrograms.csv" -NoTypeInformation

# Export Windows features
Write-Host "  Exporting Windows features..." -ForegroundColor Gray
Get-WindowsOptionalFeature -Online | Where-Object State -eq "Enabled" | 
    Export-Csv "$BackupRoot\WindowsFeatures.csv" -NoTypeInformation

# Backup Public folder
if (Test-Path "C:\Users\Public") {
    Write-Host "  Backing up Public folder..." -ForegroundColor Gray
    robocopy "C:\Users\Public" "$BackupRoot\Public" /E /XO /R:2 /W:5 /NP /NDL | Out-Null
}

Write-Host "`n🎉 Backup completed!" -ForegroundColor Green
Write-Host "Backup location: $BackupRoot" -ForegroundColor Yellow

# Generate backup report
$ReportPath = "$BackupRoot\BackupReport.txt"
@"
PC Backup Report
Generated: $(Get-Date)
Computer: $env:COMPUTERNAME

Users Backed Up:
$($UserProfiles.Name | ForEach-Object { "  - $_" } | Out-String)

Backup Contents:
  - All user profiles (Desktop, Documents, Downloads, etc.)
  - Browser data (Chrome, Edge)
  - Start Menu customizations
  - Installed programs list
  - Windows features list
  - Public folder contents

Total Backup Size: $((Get-ChildItem $BackupRoot -Recurse | Measure-Object Length -Sum).Sum / 1GB) GB (approximate)

To restore: Copy files back to respective user folders after fresh Windows installation.
"@ | Out-File $ReportPath

Write-Host "📋 Backup report saved to: $ReportPath" -ForegroundColor Cyan