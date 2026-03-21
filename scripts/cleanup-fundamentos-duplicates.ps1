Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$toDelete = @(
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\fundamentos-02-o-ritual-de-descompressa-o-noturna',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\fundamentos-04-fome-emocional-vs-fome-fa-sica',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\fundamentos-06-alinhamento-de-postura-e-respiraa-a-o',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\fundamentos-09-o-doce-estrata-gico',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\fundamentos-10-a-dependa-ncia-invisa-vel-da-cafea-na',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\fundamentos-12-hidrataa-a-o-matinal-antes-de-tudo',
    'C:\Users\Afonso\Downloads\GOL1.006\marketing\fundamentos-13-positividade-ta-xica-vs-respeito-ao-pra-prio-corpo',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-fundamentos-02-o-ritual-de-descompressa-o-noturna.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-fundamentos-04-fome-emocional-vs-fome-fa-sica.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-fundamentos-06-alinhamento-de-postura-e-respiraa-a-o.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-fundamentos-09-o-doce-estrata-gico.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-fundamentos-10-a-dependa-ncia-invisa-vel-da-cafea-na.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-fundamentos-12-hidrataa-a-o-matinal-antes-de-tudo.ps1',
    'C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-fundamentos-13-positividade-ta-xica-vs-respeito-ao-pra-prio-corpo.ps1'
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
