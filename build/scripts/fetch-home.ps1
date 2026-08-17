$out = Join-Path $PSScriptRoot '..\legacy-home-source.html'
Invoke-WebRequest -Uri 'https://hoarfrost.cloud/' -OutFile $out -UseBasicParsing
Write-Host "Saved:" (Get-Item $out).Length "bytes"
