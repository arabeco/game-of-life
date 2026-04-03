param(
    [string]$OutputDir = "C:\Users\Afonso\Downloads\GOL1.006\marketing\choque-03-dia-te-controla\slides",
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
$sourceDir = Join-Path $root "marketing\choque 1-5\3"

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
    "Seu dia`nte controla?",
    "Você acorda`njá reagindo.",
    "Passa horas`napagando`nurgências.",
    "E o essencial`nfica sempre`npara depois.",
    "Isso cansa`nmais do que`ndeveria.",
    "Quem não governa`no próprio dia`nserve ao caos.",
    "Seu dia`nnão precisa`nte arrastar."
)

& $template -OutputDir $OutputDir -BackgroundPaths $backgrounds -Slides $slides -SheetTitle "Choque 03 - Dia te controla" -Theme "Petrol" -TextStyle $TextStyle -FontChoice $FontChoice
