param(
    [string]$OutputDir = "C:\Users\Afonso\Downloads\GOL1.006\marketing\choque-04-cansado-sem-sair-do-lugar\slides",
    [ValidateSet("White","Gold","Silver","BridgeGold")]
    [string]$TextStyle = "White",
    [ValidateSet("Auto","Arial","Franklin","Bahnschrift","Bridge")]
    [string]$FontChoice = "Auto"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-BackgroundSet {
    param(
        [string]$SourceDir,
        [string[]]$Fallbacks,
        [int]$NeededCount = 8
    )

    $sourceImages = @()
    if (Test-Path $SourceDir) {
        $sourceImages = Get-ChildItem -Path $SourceDir -File |
            Where-Object { $_.Extension -match '^\.(jpg|jpeg|png|webp)$' } |
            Sort-Object @{
                Expression = { if ($_.BaseName -match '^\d+$') { [int]$_.BaseName } else { [int]::MaxValue } }
                Ascending = $true
            }, @{
                Expression = { $_.BaseName.Length }
                Ascending = $false
            }, @{
                Expression = { $_.BaseName }
                Ascending = $true
            } |
            Select-Object -ExpandProperty FullName
    }

    $resolved = [System.Collections.Generic.List[string]]::new()
    foreach ($image in $sourceImages) {
        if ($resolved.Count -ge $NeededCount) { break }
        $resolved.Add($image)
    }

    $fallbackIndex = 0
    while ($resolved.Count -lt $NeededCount) {
        $resolved.Add($Fallbacks[$fallbackIndex])
        $fallbackIndex = ($fallbackIndex + 1) % $Fallbacks.Count
    }

    return ,$resolved.ToArray()
}

$root = Split-Path $PSScriptRoot -Parent
$template = Join-Path $PSScriptRoot "generate-choque-template.ps1"
$sourceDir = Join-Path $root "marketing\choque 1-5\4"

$fallbacks = @(
    (Join-Path $root "marketing\round0\1.jpg"),
    (Join-Path $root "marketing\round0\2.jpg"),
    (Join-Path $root "marketing\round0\3.jpg"),
    (Join-Path $root "marketing\round0\4.jpg"),
    (Join-Path $root "marketing\round0\5.jpg"),
    (Join-Path $root "marketing\round0\6.jpg"),
    (Join-Path $root "marketing\round0\7.jpg"),
    (Join-Path $root "marketing\round0\8.jpg")
)

$backgrounds = Resolve-BackgroundSet -SourceDir $sourceDir -Fallbacks $fallbacks -NeededCount 8
$slides = @(
    "Você está cansado`nmas não sai`ndo lugar?",
    "Esforço espalhado`nparece avanço.",
    "Mas ruído`ntambém esgota.",
    "Você faz muito.`nRegistra pouco.",
    "E quase nunca`nfecha o que`nmudaria o jogo.",
    "Sem medida,`naté melhora real`nparece ilusão.",
    "Exaustão`nnão prova`nconstrução."
)

& $template -OutputDir $OutputDir -BackgroundPaths $backgrounds -Slides $slides -SheetTitle "Choque 04 - Cansado sem sair do lugar" -Theme "Plum" -TextStyle $TextStyle -FontChoice $FontChoice
