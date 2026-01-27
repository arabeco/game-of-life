# Script para iniciar o Vite automaticamente
Set-Location $PSScriptRoot
Write-Host "Iniciando Vite na porta 5173..." -ForegroundColor Green
Write-Host "Acesse: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host ""
npm run dev
