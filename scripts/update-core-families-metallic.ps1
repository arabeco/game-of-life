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

$drawCenterTextBlock = @'
function Draw-CenterText {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.Font]$Font,
        [System.Drawing.Brush]$Brush,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height
    )

    $format = [System.Drawing.StringFormat]::new()
    $createdFont = $null
    try {
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        $format.Trimming = [System.Drawing.StringTrimming]::None
        $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoClip

        $paddingX = [float][Math]::Max(10, [Math]::Ceiling($Font.Size * 0.12))
        $paddingY = [float][Math]::Max(10, [Math]::Ceiling($Font.Size * 0.18))
        $safeRect = [System.Drawing.RectangleF]::new(
            [float]($X + $paddingX),
            [float]($Y + $paddingY),
            [float][Math]::Max(12, $Width - ($paddingX * 2)),
            [float][Math]::Max(12, $Height - ($paddingY * 2))
        )

        $drawFont = $Font
        $fontFound = $false
        $minSize = [float][Math]::Max(18, [Math]::Floor($Font.Size * 0.62))

        for ($size = [float]$Font.Size; $size -ge $minSize; $size -= 1.0) {
            if ([Math]::Abs($size - $Font.Size) -lt 0.05) {
                $candidate = $Font
            } else {
                $candidate = [System.Drawing.Font]::new($Font.FontFamily, $size, $Font.Style, [System.Drawing.GraphicsUnit]::Pixel)
            }

            $measured = $Graphics.MeasureString($Text, $candidate, [System.Drawing.SizeF]::new($safeRect.Width, 5000), $format)
            if ($measured.Width -le ($safeRect.Width + 1) -and $measured.Height -le ($safeRect.Height + 1)) {
                if ($candidate -ne $Font) { $createdFont = $candidate }
                $drawFont = $candidate
                $fontFound = $true
                break
            }

            if ($candidate -ne $Font) { $candidate.Dispose() }
        }

        if (-not $fontFound) {
            for ($size = [float]($minSize - 1); $size -ge 16; $size -= 0.5) {
                $candidate = [System.Drawing.Font]::new($Font.FontFamily, $size, $Font.Style, [System.Drawing.GraphicsUnit]::Pixel)
                $measured = $Graphics.MeasureString($Text, $candidate, [System.Drawing.SizeF]::new($safeRect.Width, 5000), $format)
                if ($measured.Width -le ($safeRect.Width + 1) -and $measured.Height -le ($safeRect.Height + 1)) {
                    $createdFont = $candidate
                    $drawFont = $candidate
                    $fontFound = $true
                    break
                }
                $candidate.Dispose()
            }
        }

        if (-not $fontFound -and $drawFont -eq $Font -and $Font.Size -gt 16) {
            $createdFont = [System.Drawing.Font]::new($Font.FontFamily, 16, $Font.Style, [System.Drawing.GraphicsUnit]::Pixel)
            $drawFont = $createdFont
        }

        $Graphics.DrawString($Text, $drawFont, $Brush, $safeRect, $format)
    } finally {
        if ($null -ne $createdFont) {
            $createdFont.Dispose()
        }
        $format.Dispose()
    }
}
'@

$drawSmallBrandBlock = @'
function Draw-SmallBrand {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$LogoPath,
        [System.Drawing.Font]$Font,
        [System.Drawing.Brush]$Brush
    )

    $logo = [System.Drawing.Image]::FromFile($LogoPath)
    try {
        $Graphics.DrawImage($logo, 848, 1142, 98, 98)
    } finally {
        $logo.Dispose()
    }

    $Graphics.DrawString("GLYPH.LIFE", $Font, $Brush, [System.Drawing.PointF]::new(110, 1198))
}
'@

function Replace-MetallicFunctions {
    param([string]$Text)

    return [regex]::Replace(
        $Text,
        '(?ms)(function Draw-SubtleGoldShimmer \{.*?\}\s*)?function Get-GoldBrush \{.*?\}\s*(function Get-SilverBrush \{.*?\}\s*)?function Draw-Pill',
        "$metallicBlock`r`n`r`nfunction Draw-Pill"
    )
}

function Ensure-DrawCenterText {
    param([string]$Text)

    if ($Text -match 'function Draw-CenterText') { return $Text }
    return [regex]::Replace(
        $Text,
        '(?ms)(function New-Canvas \{.*?\}\s*)function Draw-FittedImage',
        '$1' + $drawCenterTextBlock + "`r`nfunction Draw-FittedImage"
    )
}

function Ensure-DrawSmallBrand {
    param([string]$Text)

    if ($Text -match 'function Draw-SmallBrand') { return $Text }
    return [regex]::Replace(
        $Text,
        '(?ms)(function Save-Slide \{)',
        $drawSmallBrandBlock + "`r`n`r`n" + '$1'
    )
}

function Ensure-SilverVariable {
    param([string]$Text)

    if ($Text -match '\$silverBrushSlide = Get-SilverBrush') { return $Text }
    return [regex]::Replace(
        $Text,
        '(?m)^(\$goldBrushSlide = Get-GoldBrush -Width \$width -Height \$height)\s*$',
        '$1' + "`r`n" + '$silverBrushSlide = Get-SilverBrush -Width $width -Height $height'
    )
}

function Ensure-SilverDisposal {
    param([string]$Text)

    if ($Text -match '\$silverBrushSlide\.Dispose\(\)') { return $Text }
    return [regex]::Replace(
        $Text,
        '(?m)^(\$goldBrushSlide\.Dispose\(\))\s*$',
        '$silverBrushSlide.Dispose()' + "`r`n" + '$1'
    )
}

function Replace-BodyBrushes {
    param(
        [string]$Text,
        [bool]$UseSilver
    )

    if (-not $UseSilver) { return $Text }
    $Text = $Text.Replace('-Brush $offWhiteBrush', '-Brush $silverBrushSlide')
    $Text = $Text.Replace('BodyBrush $offWhiteBrush', 'BodyBrush $silverBrushSlide')
    $Text = $Text.Replace('SubtitleBrush $offWhiteBrush', 'SubtitleBrush $silverBrushSlide')
    return $Text
}

function Insert-ShimmerCalls {
    param(
        [string]$Text,
        [string[]]$Calls
    )

    $Text = [regex]::Replace($Text, '(?m)^Draw-SubtleGoldShimmer -Graphics \$graphics .*?(\r?\n)?', '')
    $Text = [regex]::Replace($Text, '(?m)^-CenterX .*?(\r?\n)?', '')
    $Text = [regex]::Replace($Text, '(?m)^\s*\d+\s+-CenterY .*?(\r?\n)?', '')
    $Text = [regex]::Replace($Text, '(?m)^\s*\d+\s+-\w+ .*?(\r?\n)?', '')
    $Text = [regex]::Replace($Text, '(?m)^\s*\d+(?:\s+-\w+\s+-?\d+)+(?:\s*)$', '')
    $Text = [regex]::Replace($Text, '(?m)^\s*-?\d+(?:\s+-\w+\s+-?\d+)+\s*$', '')
    $pattern = '(?m)^Draw-BackgroundBase -Graphics \$graphics .*?$'
    $matches = [regex]::Matches($Text, $pattern)
    if ($matches.Count -eq 0) { return $Text }

    $builder = [System.Text.StringBuilder]::new()
    $cursor = 0
    for ($i = 0; $i -lt $matches.Count; $i++) {
        $m = $matches[$i]
        [void]$builder.Append($Text.Substring($cursor, $m.Index - $cursor))
        [void]$builder.Append($m.Value)
        if ($i -lt $Calls.Count) {
            [void]$builder.Append("`r`n")
            [void]$builder.Append($Calls[$i])
        }
        $cursor = $m.Index + $m.Length
    }
    [void]$builder.Append($Text.Substring($cursor))
    return $builder.ToString()
}

function Update-Script {
    param(
        [string]$Path,
        [ValidateSet('Mestria','Produto','Filosofia','Mentalidade')] [string]$Family
    )

    $text = Get-Content -Path $Path -Raw
    $text = Ensure-DrawCenterText -Text $text
    $text = Ensure-DrawSmallBrand -Text $text
    $text = Replace-MetallicFunctions -Text $text

    $useSilver = $Family -ne 'Filosofia'
    if ($useSilver) {
        $text = Ensure-SilverVariable -Text $text
        $text = Ensure-SilverDisposal -Text $text
    }
    $text = Replace-BodyBrushes -Text $text -UseSilver:$useSilver

    switch ($Family) {
        'Mestria' {
            $calls = @(
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 758 -CenterY 440 -BandWidth 236 -BandHeight 1520 -Angle 15 -PeakAlpha 15',
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 874 -CenterY 610 -BandWidth 194 -BandHeight 1560 -Angle -18 -PeakAlpha 13',
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 358 -CenterY 650 -BandWidth 222 -BandHeight 1560 -Angle 19 -PeakAlpha 12',
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 824 -CenterY 604 -BandWidth 188 -BandHeight 1540 -Angle -16 -PeakAlpha 11',
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 676 -CenterY 584 -BandWidth 206 -BandHeight 1520 -Angle -13 -PeakAlpha 11'
            )
        }
        'Produto' {
            $calls = @(
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 744 -CenterY 442 -BandWidth 238 -BandHeight 1520 -Angle 15 -PeakAlpha 14',
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 862 -CenterY 610 -BandWidth 194 -BandHeight 1560 -Angle -17 -PeakAlpha 12',
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 354 -CenterY 652 -BandWidth 220 -BandHeight 1560 -Angle 18 -PeakAlpha 12',
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 672 -CenterY 584 -BandWidth 208 -BandHeight 1520 -Angle -13 -PeakAlpha 10'
            )
        }
        'Mentalidade' {
            $calls = @(
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 748 -CenterY 438 -BandWidth 236 -BandHeight 1520 -Angle 15 -PeakAlpha 14',
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 868 -CenterY 604 -BandWidth 194 -BandHeight 1560 -Angle -18 -PeakAlpha 12',
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 348 -CenterY 652 -BandWidth 220 -BandHeight 1560 -Angle 19 -PeakAlpha 12',
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 674 -CenterY 582 -BandWidth 206 -BandHeight 1520 -Angle -13 -PeakAlpha 10'
            )
        }
        'Filosofia' {
            $calls = @(
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 738 -CenterY 432 -BandWidth 228 -BandHeight 1500 -Angle 14 -PeakAlpha 9',
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 852 -CenterY 596 -BandWidth 190 -BandHeight 1540 -Angle -17 -PeakAlpha 8',
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 344 -CenterY 646 -BandWidth 214 -BandHeight 1540 -Angle 18 -PeakAlpha 8',
                'Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 662 -CenterY 578 -BandWidth 198 -BandHeight 1500 -Angle -12 -PeakAlpha 7'
            )
        }
    }

    $text = Insert-ShimmerCalls -Text $text -Calls $calls
    Set-Content -Path $Path -Value $text -Encoding UTF8
}

$mestriaFiles = @(
    Get-ChildItem -Path $scriptsRoot -Filter 'generate-curadoria-*.ps1'
    Get-ChildItem -Path $scriptsRoot -Filter 'generate-mestria-*.ps1'
) | Sort-Object Name -Unique

$produtoFiles = Get-ChildItem -Path $scriptsRoot -Filter 'generate-vitrine-*.ps1' | Sort-Object Name
$filosofiaFiles = Get-ChildItem -Path $scriptsRoot -Filter 'generate-filosofia-*.ps1' | Sort-Object Name
$mentalidadeFiles = Get-ChildItem -Path $scriptsRoot -Filter 'generate-mentalidade-*.ps1' | Sort-Object Name

foreach ($file in $mestriaFiles) { Update-Script -Path $file.FullName -Family Mestria }
foreach ($file in $produtoFiles) { Update-Script -Path $file.FullName -Family Produto }
foreach ($file in $filosofiaFiles) { Update-Script -Path $file.FullName -Family Filosofia }
foreach ($file in $mentalidadeFiles) { Update-Script -Path $file.FullName -Family Mentalidade }

Write-Output "UPDATED=$($mestriaFiles.Count + $produtoFiles.Count + $filosofiaFiles.Count + $mentalidadeFiles.Count)"
