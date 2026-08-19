param(
  [Parameter(Mandatory = $true)][string]$DistDir,
  [Parameter(Mandatory = $true)][string]$ZipPath
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path $ZipPath) {
  Remove-Item $ZipPath -Force
}

$distFull = (Resolve-Path $DistDir).Path
$zip = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)

Get-ChildItem -Path $distFull -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($distFull.Length + 1).Replace('\', '/')
  [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel)
}

$zip.Dispose()

Write-Host "[itch-zip] Created $ZipPath"
