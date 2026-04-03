Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scripts = @(
    "generate-choque-01-vida-baguncada.ps1",
    "generate-choque-02-comeca-tudo.ps1",
    "generate-choque-03-dia-te-controla.ps1",
    "generate-choque-04-cansado-sem-sair-do-lugar.ps1",
    "generate-choque-05-vivendo-no-automatico.ps1"
)

foreach ($script in $scripts) {
    & (Join-Path $PSScriptRoot $script)
}
