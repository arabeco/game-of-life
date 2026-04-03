Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

powershell -ExecutionPolicy Bypass -File "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-choque-01-vida-baguncada.ps1" `
  -OutputDir "C:\Users\Afonso\Downloads\GOL1.006\marketing\choque-01-vida-baguncada-bridge\slides" `
  -TextStyle BridgeGold `
  -FontChoice Bridge
