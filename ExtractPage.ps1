# PDF Page Extractor Script
# Usage: .\ExtractPage.ps1 -InputPDF "path\to\file.pdf" -PageNumber 15 -OutputPDF "extracted_page.pdf"

param(
    [Parameter(Mandatory=$true)]
    [string]$InputPDF,
    
    [Parameter(Mandatory=$true)]
    [int]$PageNumber,
    
    [Parameter(Mandatory=$true)]
    [string]$OutputPDF
)

# Check if input file exists
if (-not (Test-Path $InputPDF)) {
    Write-Error "Input PDF file not found: $InputPDF"
    exit 1
}

# Use Windows built-in print functionality via Edge
Write-Host "Opening PDF in Edge to extract page $PageNumber..."

# Create a temporary HTML file that opens the PDF and prints specific page
$tempHtml = [System.IO.Path]::GetTempFileName() + ".html"
$htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <script>
        window.onload = function() {
            // This will open the print dialog
            setTimeout(function() {
                window.print();
            }, 2000);
        }
    </script>
</head>
<body>
    <embed src="file:///$($InputPDF.Replace('\', '/'))" type="application/pdf" width="100%" height="100%">
</body>
</html>
"@

$htmlContent | Out-File -FilePath $tempHtml -Encoding UTF8

# Open in Edge
Start-Process "msedge.exe" -ArgumentList $tempHtml

Write-Host "Instructions:"
Write-Host "1. When Edge opens with the PDF, press Ctrl+P"
Write-Host "2. Under 'Pages', select 'Custom' and enter: $PageNumber"
Write-Host "3. Change 'Destination' to 'Save as PDF'"
Write-Host "4. Save as: $OutputPDF"
Write-Host "5. Close Edge when done"

# Clean up temp file after 60 seconds
Start-Sleep 60
Remove-Item $tempHtml -ErrorAction SilentlyContinue