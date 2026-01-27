# Script para iniciar o servidor automaticamente
Set-Location $PSScriptRoot
Write-Host "Iniciando servidor na porta 3000..." -ForegroundColor Green
Write-Host "Acesse: http://localhost:3000" -ForegroundColor Cyan
Start-Process python -ArgumentList "-m", "http.server", "3000" -NoNewWindow
