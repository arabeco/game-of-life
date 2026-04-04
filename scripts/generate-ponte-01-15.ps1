Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = "C:\Users\Afonso\Downloads\GOL1.006"
$marketingRoot = Join-Path $repoRoot "marketing"
$generator = Join-Path $repoRoot "scripts\generate-ponte-01-imperio.ps1"
$definitionsPath = Join-Path $marketingRoot "ponte-definicoes-01-15.md"
$plaquePath = Join-Path $marketingRoot "round0\placa.jpg"

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
if ($matches.Count -ne 15) {
    throw "Nao consegui ler as 15 definicoes da ponte em $definitionsPath."
}

$printMap = @{
    1  = (Join-Path $marketingRoot "round11\arenas2.jpeg")
    2  = (Join-Path $marketingRoot "round14\acaomodal.jpeg")
    3  = (Join-Path $marketingRoot "round12\maestria2.jpg")
    4  = (Join-Path $marketingRoot "round11\arenamodal.jpeg")
    5  = (Join-Path $marketingRoot "round2\planner.jpeg")
    6  = (Join-Path $marketingRoot "round3\relatoriocard.jpeg")
    7  = (Join-Path $marketingRoot "round7\relatorioatlas.jpeg")
    8  = (Join-Path $marketingRoot "round6\deepwork.jpeg")
    9  = (Join-Path $marketingRoot "round13\codexes2.jpg")
    10 = (Join-Path $marketingRoot "round8\patentes.jpeg")
    11 = (Join-Path $marketingRoot "vitrine-01-customizacao\inventario.jpeg")
    12 = (Join-Path $marketingRoot "round13\codexes.jpeg")
    13 = (Join-Path $marketingRoot "round9\oraculo.jpeg")
    14 = (Join-Path $marketingRoot "round10\quests.jpeg")
    15 = (Join-Path $marketingRoot "round10\clan.png")
}

$brightBackgrounds = @(2, 4, 9, 14, 15)

$items = foreach ($match in $matches) {
    $id = [int]$match.Groups[1].Value
    $word = $match.Groups[2].Value.Trim()
    $definition = $match.Groups[3].Value.Trim()
    $slug = Get-Slug -Text $word
    $backgroundPath = Join-Path $marketingRoot ("round0\{0}.jpg" -f $id)
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
        PlaqueTone = if ($id -ge 11) { "Jade" } else { "Default" }
        BrightBackground = ($brightBackgrounds -contains $id)
        OutputDir = Join-Path $marketingRoot ("ponte-{0}-{1}\slides" -f $id.ToString("00"), $slug)
    }
}

foreach ($item in $items | Sort-Object Id) {
    $backgroundZoom = if ($item.Id -ge 11) { 1.08 } else { 1.0 }
    $footerTextBottom = if ($item.Id -ge 11) { 112 } else { 88 }
    $footerLogoRight = if ($item.Id -ge 11) { 96 } else { 74 }
    $footerLogoBottom = if ($item.Id -ge 11) { 88 } else { 62 }

    & $generator `
        -OutputDir $item.OutputDir `
        -BackgroundPath $item.BackgroundPath `
        -PlaquePath $plaquePath `
        -PrintPath $item.PrintPath `
        -Word $item.Word `
        -Definition $item.Definition `
        -PlaqueTone $item.PlaqueTone `
        -BackgroundZoom $backgroundZoom `
        -FooterTextBottom $footerTextBottom `
        -FooterLogoRight $footerLogoRight `
        -FooterLogoBottom $footerLogoBottom `
        -BrightBackground:$item.BrightBackground
}

($items | Sort-Object Id | Select-Object Id,Word,Slug,PrintPath,OutputDir) | Format-Table -AutoSize
