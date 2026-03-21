Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptsRoot = "C:\Users\Afonso\Downloads\GOL1.006\scripts"

$metallicBlock = @'
function Draw-SubtleGoldShimmer {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$CenterX,
        [float]$CenterY,
        [float]$BandWidth,
        [float]$BandHeight,
        [float]$Angle,
        [int]$PeakAlpha = 16
    )

    $state = $Graphics.Save()
    $baseBrush = $null
    $coreBrush = $null
    try {
        $Graphics.TranslateTransform($CenterX, $CenterY)
        $Graphics.RotateTransform($Angle)

        $baseRect = [System.Drawing.RectangleF]::new(
            [float](-$BandWidth / 2),
            [float](-$BandHeight / 2),
            $BandWidth,
            $BandHeight
        )

        $baseBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
            [System.Drawing.PointF]::new($baseRect.Left, 0),
            [System.Drawing.PointF]::new($baseRect.Right, 0),
            (New-Color 0 255 238 196),
            (New-Color 0 255 238 196)
        )

        $baseBlend = [System.Drawing.Drawing2D.ColorBlend]::new()
        $baseBlend.Colors = [System.Drawing.Color[]]@(
            (New-Color 0 255 238 196),
            (New-Color ([int][Math]::Round($PeakAlpha * 0.35)) 221 187 116),
            (New-Color $PeakAlpha 247 236 206),
            (New-Color ([int][Math]::Round($PeakAlpha * 0.35)) 221 187 116),
            (New-Color 0 255 238 196)
        )
        $baseBlend.Positions = [single[]](0.0, 0.34, 0.5, 0.66, 1.0)
        $baseBrush.InterpolationColors = $baseBlend
        $Graphics.FillRectangle($baseBrush, $baseRect)

        $coreRect = [System.Drawing.RectangleF]::new(
            [float](-($BandWidth * 0.16)),
            [float](-$BandHeight / 2),
            [float]($BandWidth * 0.32),
            $BandHeight
        )

        $coreBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
            [System.Drawing.PointF]::new($coreRect.Left, 0),
            [System.Drawing.PointF]::new($coreRect.Right, 0),
            (New-Color 0 255 244 210),
            (New-Color 0 255 244 210)
        )

        $coreBlend = [System.Drawing.Drawing2D.ColorBlend]::new()
        $coreBlend.Colors = [System.Drawing.Color[]]@(
            (New-Color 0 255 244 210),
            (New-Color ([int][Math]::Round($PeakAlpha * 0.55)) 233 208 150),
            (New-Color ([int][Math]::Round($PeakAlpha * 0.8)) 250 244 224),
            (New-Color ([int][Math]::Round($PeakAlpha * 0.55)) 233 208 150),
            (New-Color 0 255 244 210)
        )
        $coreBlend.Positions = [single[]](0.0, 0.28, 0.5, 0.72, 1.0)
        $coreBrush.InterpolationColors = $coreBlend
        $Graphics.FillRectangle($coreBrush, $coreRect)
    } finally {
        if ($null -ne $baseBrush) { $baseBrush.Dispose() }
        if ($null -ne $coreBrush) { $coreBrush.Dispose() }
        $Graphics.Restore($state)
    }
}

function Get-GoldBrush {
    param([int]$Width, [int]$Height)

    $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        [System.Drawing.RectangleF]::new(0, 0, $Width, $Height),
        (New-Color 255 247 235 204),
        (New-Color 255 174 137 78),
        18
    )

    $blend = [System.Drawing.Drawing2D.ColorBlend]::new()
    $blend.Colors = [System.Drawing.Color[]]@(
        (New-Color 255 157 122 70),
        (New-Color 255 231 204 144),
        (New-Color 255 250 242 214),
        (New-Color 255 214 183 122),
        (New-Color 255 146 113 66)
    )
    $blend.Positions = [single[]](0.0, 0.26, 0.5, 0.74, 1.0)
    $brush.InterpolationColors = $blend
    return $brush
}

function Get-SilverBrush {
    param([int]$Width, [int]$Height)

    $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        [System.Drawing.RectangleF]::new(0, 0, $Width, $Height),
        (New-Color 255 212 219 228),
        (New-Color 255 131 141 156),
        102
    )

    $blend = [System.Drawing.Drawing2D.ColorBlend]::new()
    $blend.Colors = [System.Drawing.Color[]]@(
        (New-Color 255 122 132 147),
        (New-Color 255 198 207 218),
        (New-Color 255 241 245 250),
        (New-Color 255 184 193 205),
        (New-Color 255 116 125 139)
    )
    $blend.Positions = [single[]](0.0, 0.24, 0.5, 0.76, 1.0)
    $brush.InterpolationColors = $blend
    return $brush
}
'@

function Update-SharedMetallicParts {
    param(
        [string]$Path,
        [ValidateSet('Legado', 'Fundamentos')] [string]$Family
    )

    $text = Get-Content -Path $Path -Raw

    if ($text -notmatch 'function Draw-SubtleGoldShimmer') {
        $text = [regex]::Replace(
            $text,
            '(?ms)function Get-GoldBrush \{.*?\}\s*function Draw-Pill',
            "$metallicBlock`r`n`r`nfunction Draw-Pill"
        )
    } else {
        $text = [regex]::Replace(
            $text,
            '(?ms)function Draw-SubtleGoldShimmer \{.*?\}\s*function Get-GoldBrush \{.*?\}\s*function Get-SilverBrush \{.*?\}\s*function Draw-Pill',
            "$metallicBlock`r`n`r`nfunction Draw-Pill"
        )
    }

    if ($text -notmatch '\$silverBrushSlide = Get-SilverBrush') {
        $silverReplacement = @'
$1
$silverBrushSlide = Get-SilverBrush -Width $width -Height $height
'@
        $text = [regex]::Replace(
            $text,
            '(?m)^(\$goldBrushSlide = Get-GoldBrush -Width \$width -Height \$height)\s*$',
            $silverReplacement
        )
    }

    if ($Family -eq 'Legado') {
        $text = $text.Replace(
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgLegacy -Width $width -Height $height' + "`r`n" +
            'Draw-CenterText -Graphics $graphics -Text "Legado" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 48 -Width 912 -Height 110',
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgLegacy -Width $width -Height $height' + "`r`n" +
            'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 758 -CenterY 444 -BandWidth 238 -BandHeight 1520 -Angle 16 -PeakAlpha 15' + "`r`n" +
            'Draw-CenterText -Graphics $graphics -Text "Legado" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 48 -Width 912 -Height 110'
        )
        $text = $text.Replace(
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgLegacy -Width $width -Height $height' + "`r`n" +
            'Draw-CenterText -Graphics $graphics -Text "Feito" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 498 -Width 912 -Height 130',
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgLegacy -Width $width -Height $height' + "`r`n" +
            'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 876 -CenterY 618 -BandWidth 194 -BandHeight 1560 -Angle -18 -PeakAlpha 13' + "`r`n" +
            'Draw-CenterText -Graphics $graphics -Text "Feito" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 498 -Width 912 -Height 130'
        )
        $text = $text.Replace(
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgLegacy -Width $width -Height $height' + "`r`n" +
            'Draw-CenterText -Graphics $graphics -Text "Raridade" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 498 -Width 912 -Height 130',
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgLegacy -Width $width -Height $height' + "`r`n" +
            'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 364 -CenterY 650 -BandWidth 224 -BandHeight 1560 -Angle 20 -PeakAlpha 12' + "`r`n" +
            'Draw-CenterText -Graphics $graphics -Text "Raridade" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 498 -Width 912 -Height 130'
        )
        $text = $text.Replace(
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgLegacy -Width $width -Height $height' + "`r`n" +
            '$watermarkBrush2 = [System.Drawing.SolidBrush]::new((New-Color 18 244 216 118))',
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgLegacy -Width $width -Height $height' + "`r`n" +
            'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 680 -CenterY 584 -BandWidth 206 -BandHeight 1520 -Angle -14 -PeakAlpha 11' + "`r`n" +
            '$watermarkBrush2 = [System.Drawing.SolidBrush]::new((New-Color 18 244 216 118))'
        )

        $text = $text.Replace('Draw-CenterText -Graphics $graphics -Text $quoteText -Font $bodyFont -Brush $offWhiteBrush', 'Draw-CenterText -Graphics $graphics -Text $quoteText -Font $bodyFont -Brush $silverBrushSlide')
        $text = $text.Replace('Draw-CenterText -Graphics $graphics -Text $analysis1 -Font $bodyFont -Brush $offWhiteBrush', 'Draw-CenterText -Graphics $graphics -Text $analysis1 -Font $bodyFont -Brush $silverBrushSlide')
        $text = $text.Replace('Draw-CenterText -Graphics $graphics -Text $analysis2Body -Font $bodyFont -Brush $offWhiteBrush', 'Draw-CenterText -Graphics $graphics -Text $analysis2Body -Font $bodyFont -Brush $silverBrushSlide')
    }

    if ($Family -eq 'Fundamentos') {
        $text = $text.Replace(
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgFoundations -Width $width -Height $height' + "`r`n" +
            'Draw-CenterText -Graphics $graphics -Text "Fundamentos" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 76 -Width 912 -Height 120',
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgFoundations -Width $width -Height $height' + "`r`n" +
            'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 744 -CenterY 446 -BandWidth 236 -BandHeight 1520 -Angle 15 -PeakAlpha 14' + "`r`n" +
            'Draw-CenterText -Graphics $graphics -Text "Fundamentos" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 76 -Width 912 -Height 120'
        )
        $text = $text.Replace(
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgFoundations -Width $width -Height $height' + "`r`n" +
            'Draw-CenterText -Graphics $graphics -Text "Pausa" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 500 -Width 912 -Height 128',
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgFoundations -Width $width -Height $height' + "`r`n" +
            'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 860 -CenterY 612 -BandWidth 196 -BandHeight 1560 -Angle -17 -PeakAlpha 12' + "`r`n" +
            'Draw-CenterText -Graphics $graphics -Text "Pausa" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 500 -Width 912 -Height 128'
        )
        $text = $text.Replace(
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgFoundations -Width $width -Height $height' + "`r`n" +
            'Draw-CenterText -Graphics $graphics -Text "Recarga" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 500 -Width 912 -Height 128',
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgFoundations -Width $width -Height $height' + "`r`n" +
            'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 356 -CenterY 654 -BandWidth 220 -BandHeight 1560 -Angle 18 -PeakAlpha 12' + "`r`n" +
            'Draw-CenterText -Graphics $graphics -Text "Recarga" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 500 -Width 912 -Height 128'
        )
        $text = $text.Replace(
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgFoundations -Width $width -Height $height' + "`r`n" +
            '$watermarkBrush2 = [System.Drawing.SolidBrush]::new((New-Color 18 244 216 118))',
            'Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgFoundations -Width $width -Height $height' + "`r`n" +
            'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 670 -CenterY 584 -BandWidth 208 -BandHeight 1520 -Angle -13 -PeakAlpha 11' + "`r`n" +
            '$watermarkBrush2 = [System.Drawing.SolidBrush]::new((New-Color 18 244 216 118))'
        )

        $text = $text.Replace('Draw-CenterText -Graphics $graphics -Text $coverSupport -Font $bodyFont -Brush $offWhiteBrush', 'Draw-CenterText -Graphics $graphics -Text $coverSupport -Font $bodyFont -Brush $silverBrushSlide')
        $text = $text.Replace('Draw-CenterText -Graphics $graphics -Text $logic1Body -Font $bodyFont -Brush $offWhiteBrush', 'Draw-CenterText -Graphics $graphics -Text $logic1Body -Font $bodyFont -Brush $silverBrushSlide')
        $text = $text.Replace('Draw-CenterText -Graphics $graphics -Text $logic2Body -Font $bodyFont -Brush $offWhiteBrush', 'Draw-CenterText -Graphics $graphics -Text $logic2Body -Font $bodyFont -Brush $silverBrushSlide')
    }

    Set-Content -Path $Path -Value $text -Encoding UTF8
}

$legadoFiles = Get-ChildItem -Path $scriptsRoot -Filter 'generate-legado-*.ps1' | Where-Object { $_.Name -notlike 'generate-legado-01-*' }
$fundFiles = Get-ChildItem -Path $scriptsRoot -Filter 'generate-fundamentos-*.ps1'

foreach ($file in $legadoFiles) {
    Update-SharedMetallicParts -Path $file.FullName -Family Legado
}

foreach ($file in $fundFiles) {
    Update-SharedMetallicParts -Path $file.FullName -Family Fundamentos
}

Write-Output "UPDATED=$($legadoFiles.Count + $fundFiles.Count)"
