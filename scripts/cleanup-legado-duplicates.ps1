Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$toDelete = @(
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-02-a-ba-ssola-da-coragem',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-04-o-poder-da-observaa-a-o-paciente',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-05-a-arte-da-antecipaa-a-o',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-06-a-precisa-o-invisa-vel',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-07-a-curiosidade-como-ba-ssola',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-08-a-alavanca-do-nao',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-08-a-alavanca-do-na-o',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-10-a-visa-o-ala-m-da-a-poca',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-10-a-visao-alem-da-poca',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-11-a-engenharia-do-encantamento',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-12-a-busca-da-perfeia-a-o',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-13-a-defesa-da-raza-o',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-14-a-progressa-o-inabala-vel',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-legado-02-a-ba-ssola-da-coragem.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-legado-04-o-poder-da-observaa-a-o-paciente.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-legado-05-a-arte-da-antecipaa-a-o.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-legado-06-a-precisa-o-invisa-vel.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-legado-07-a-curiosidade-como-ba-ssola.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-legado-08-a-alavanca-do-na-o.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-legado-10-a-visa-o-ala-m-da-a-poca.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-legado-12-a-busca-da-perfeia-a-o.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-legado-13-a-defesa-da-raza-o.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-legado-14-a-progressa-o-inabala-vel.ps1'
)

foreach ($path in $toDelete) {
    if (Test-Path -LiteralPath $path) {
        $item = Get-Item -LiteralPath $path
        if ($item.PSIsContainer) {
            Remove-Item -LiteralPath $path -Recurse -Force
        } else {
            Remove-Item -LiteralPath $path -Force
        }
        Write-Output "DELETED=$path"
    }
}
