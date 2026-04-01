Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = "C:\Users\Afonso\Downloads\GOL1.006"
$marketingRoot = Join-Path $repoRoot "marketing"
$generator = Join-Path $repoRoot "scripts\generate-ponte-01-imperio.ps1"
$definitionsPath = Join-Path $marketingRoot "ponte-definicoes-16-25.md"
$plaquePath = Join-Path $marketingRoot "round0\placa.jpg"
$backgroundRoot = Join-Path $marketingRoot "abertura"

function Remove-Diacritics {
    param([string]$Text)

    $normalized = $Text.Normalize([Text.NormalizationForm]::FormD)
    $builder = [System.Text.StringBuilder]::new()
    foreach ($char in $normalized.ToCharArray()) {
        if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($char) -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$builder.Append($char)
        }
    }
    return $builder.ToString().Normalize([Text.NormalizationForm]::FormC)
}

function Get-Slug {
    param([string]$Text)

    $base = Remove-Diacritics -Text $Text
    $base = $base.ToLowerInvariant()
    $base = $base -replace '[^a-z0-9]+', '-'
    return $base.Trim('-')
}

$raw = [System.IO.File]::ReadAllText($definitionsPath, [System.Text.Encoding]::UTF8)
$matches = [regex]::Matches($raw, '(?ms)^\s*(\d+)\.\s+`([^`]+)`\s*\r?\n\s*Defini\S*:\s*`([^`]+)`')
if ($matches.Count -ne 10) {
    throw "Nao consegui ler as 10 definicoes da ponte em $definitionsPath."
}

$printMap = @{
    16 = (Join-Path $marketingRoot "round11\arenas2.jpeg")
    17 = (Join-Path $marketingRoot "round2\planner.jpeg")
    18 = (Join-Path $marketingRoot "round3\relatoriocard.jpeg")
    19 = (Join-Path $marketingRoot "round6\deepwork.jpeg")
    20 = (Join-Path $marketingRoot "vitrine-01-customizacao\inventario.jpeg")
    21 = (Join-Path $marketingRoot "round9\oraculo.jpeg")
    22 = (Join-Path $marketingRoot "round14\acaomodal.jpeg")
    23 = (Join-Path $marketingRoot "round7\relatorioatlas.jpeg")
    24 = (Join-Path $marketingRoot "round8\patentes.jpeg")
    25 = (Join-Path $marketingRoot "round10\clan.png")
}

$brightBackgrounds = @(19, 21, 24, 25)

$items = foreach ($match in $matches) {
    $id = [int]$match.Groups[1].Value
    $word = $match.Groups[2].Value.Trim()
    $definition = $match.Groups[3].Value.Trim()
    $slug = Get-Slug -Text $word
    $backgroundPath = Join-Path $backgroundRoot ("{0}.jpg" -f $id)
    $printPath = $printMap[$id]

    if (-not (Test-Path $backgroundPath)) { throw "Fundo nao encontrado para item ${id}: $backgroundPath" }
    if (-not (Test-Path $printPath)) { throw "Print nao encontrado para item ${id}: $printPath" }

    [pscustomobject]@{
        Id = $id
        Word = $word
        Definition = $definition
        Slug = $slug
        BackgroundPath = $backgroundPath
        PrintPath = $printPath
        PlaqueTone = if ($id -le 20) { "Red" } else { "Velvet" }
        BrightBackground = ($brightBackgrounds -contains $id)
        OutputDir = Join-Path $marketingRoot ("ponte-{0}-{1}\slides" -f $id.ToString("00"), $slug)
    }
}

foreach ($item in $items | Sort-Object Id) {
    $args = @(
        "-ExecutionPolicy", "Bypass",
        "-File", $generator,
        "-OutputDir", $item.OutputDir,
        "-BackgroundPath", $item.BackgroundPath,
        "-PlaquePath", $plaquePath,
        "-PrintPath", $item.PrintPath,
        "-Word", $item.Word,
        "-Definition", $item.Definition,
        "-SheetTitle", ("Ponte {0} | {1}" -f $item.Id.ToString("00"), $item.Word),
        "-PlaqueTone", $item.PlaqueTone
    )

    if ($item.BrightBackground) {
        $args += "-BrightBackground"
    }

    & powershell @args
}

($items | Sort-Object Id | Select-Object Id,Word,PlaqueTone,PrintPath,OutputDir) | Format-Table -AutoSize
