param(
    [int[]]$OnlyIds = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$repoRoot = "C:\Users\Afonso\Downloads\GOL1.006"
$marketingRoot = Join-Path $repoRoot "marketing"
$printRoot = Join-Path $marketingRoot "print"
$outputRoot = Join-Path $marketingRoot "abertura-vitrine"

$backgrounds = @(
    (Join-Path $printRoot "01.jpg"),
    (Join-Path $printRoot "02.jpg"),
    (Join-Path $printRoot "03.jpg")
)

$logoPath = Join-Path $repoRoot "public\logo-diamond.png"

function New-Color([int]$a, [int]$r, [int]$g, [int]$b) {
    return [System.Drawing.Color]::FromArgb($a, $r, $g, $b)
}

function Get-FontFamily {
    param([string[]]$Candidates)
    foreach ($name in $Candidates) {
        try {
            $family = New-Object System.Drawing.FontFamily($name)
            if ($family -and $family.Name -eq $name) { return $family }
        } catch {}
    }
    return New-Object System.Drawing.FontFamily("Georgia")
}

function Get-CoverRect {
    param([int]$srcW, [int]$srcH, [int]$dstW, [int]$dstH)
    $scale = [Math]::Max($dstW / $srcW, $dstH / $srcH)
    $newW = [int][Math]::Ceiling($srcW * $scale)
    $newH = [int][Math]::Ceiling($srcH * $scale)
    $x = [int][Math]::Floor(($dstW - $newW) / 2)
    $y = [int][Math]::Floor(($dstH - $newH) / 2)
    return [pscustomobject]@{ X=$x; Y=$y; W=$newW; H=$newH }
}

function New-RoundedRectanglePath {
    param(
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$Radius
    )

    $diameter = [Math]::Min($Radius * 2, [Math]::Min($Width, $Height))
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
    $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
    $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function Draw-FitText {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.FontFamily]$Family,
        [int]$BaseSize,
        [System.Drawing.Brush]$Brush,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height,
        [System.Drawing.StringFormat]$Format,
        [int]$MinSize = 24,
        [int]$ShadowOffset = 3,
        [System.Drawing.Brush]$ShadowBrush = $null,
        [System.Drawing.Brush]$OutlineBrush = $null,
        [int]$OutlineOffset = 2
    )
    $Rect = New-Object System.Drawing.RectangleF -ArgumentList $X, $Y, $Width, $Height
    $size = $BaseSize
    while ($size -ge $MinSize) {
        $font = New-Object System.Drawing.Font($Family, $size, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $measured = $Graphics.MeasureString($Text, $font, $Rect.Size, $Format)
        if ($measured.Height -le $Rect.Height -and $measured.Width -le $Rect.Width) {
            if ($OutlineBrush) {
                $offsets = @(
                    @(-$OutlineOffset, 0), @($OutlineOffset, 0),
                    @(0, -$OutlineOffset), @(0, $OutlineOffset),
                    @(-$OutlineOffset, -$OutlineOffset), @($OutlineOffset, $OutlineOffset),
                    @(-$OutlineOffset, $OutlineOffset), @($OutlineOffset, -$OutlineOffset)
                )
                foreach ($o in $offsets) {
                    $outlineRect = New-Object System.Drawing.RectangleF -ArgumentList ($X + $o[0]), ($Y + $o[1]), $Width, $Height
                    $Graphics.DrawString($Text, $font, $OutlineBrush, $outlineRect, $Format)
                }
            }
            if ($ShadowBrush) {
                $shadowRect = New-Object System.Drawing.RectangleF -ArgumentList ($X + $ShadowOffset), ($Y + $ShadowOffset), $Width, $Height
                $Graphics.DrawString($Text, $font, $ShadowBrush, $shadowRect, $Format)
            }
            $Graphics.DrawString($Text, $font, $Brush, $Rect, $Format)
            $font.Dispose()
            return
        }
        $font.Dispose()
        $size -= 2
    }
}

function Draw-StackedBlocks {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string[]]$Blocks,
        [System.Drawing.FontFamily]$Family,
        [System.Drawing.Brush]$Brush,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height,
        [System.Drawing.StringFormat]$Format,
        [System.Drawing.Brush]$ShadowBrush = $null,
        [System.Drawing.Brush]$OutlineBrush = $null
    )

    $cleanBlocks = @($Blocks | Where-Object { $_ -and $_.Trim().Length -gt 0 })
    if ($cleanBlocks.Count -eq 0) { return }

    $gap = 8
    $availableHeight = $Height - (($cleanBlocks.Count - 1) * $gap)
    $cursorY = $Y

    for ($i = 0; $i -lt $cleanBlocks.Count; $i++) {
        $block = $cleanBlocks[$i]
        if ($cleanBlocks.Count -eq 3) {
            $blockHeight = switch ($i) {
                0 { [int]($availableHeight * 0.10) }
                1 { [int]($availableHeight * 0.38) }
                default { [int]($availableHeight * 0.46) }
            }
            $baseSize = switch ($i) {
                0 { 74 }
                1 { 168 }
                default { 168 }
            }
            $minSize = switch ($i) {
                0 { 50 }
                1 { 118 }
                default { 118 }
            }
        } else {
            $blockHeight = [int][Math]::Floor($availableHeight / $cleanBlocks.Count)
            $baseSize = if ($i -eq 0) { 84 } else { 168 }
            $minSize = if ($i -eq 0) { 56 } else { 118 }
        }
        Draw-FitText -Graphics $Graphics -Text $block.Trim() -Family $Family -BaseSize $baseSize -Brush $Brush -X $X -Y $cursorY -Width $Width -Height $blockHeight -Format $Format -MinSize $minSize -ShadowOffset 3 -ShadowBrush $ShadowBrush -OutlineBrush $OutlineBrush -OutlineOffset 2
        $cursorY += $blockHeight + $gap
    }
}

function Draw-LargeLines {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.FontFamily]$Family,
        [System.Drawing.Brush]$Brush,
        [System.Drawing.Brush]$HighlightBrush,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height,
        [System.Drawing.StringFormat]$Format,
        [System.Drawing.Brush]$ShadowBrush = $null,
        [System.Drawing.Brush]$OutlineBrush = $null
    )

    function Get-Segments {
        param([string]$Line)
        $parts = [regex]::Split($Line, '(\[\[.*?\]\])')
        $segments = @()
        foreach ($part in $parts) {
            if ([string]::IsNullOrEmpty($part)) { continue }
            if ($part -match '^\[\[(.*)\]\]$') {
                $segments += [pscustomobject]@{ Text = $matches[1]; Highlight = $true }
            } else {
                $segments += [pscustomobject]@{ Text = $part; Highlight = $false }
            }
        }
        return ,$segments
    }

    function Get-LineWidth {
        param(
            [System.Drawing.Graphics]$Graphics,
            [object[]]$Segments,
            [System.Drawing.Font]$Font
        )
        $totalWidth = 0.0
        foreach ($segment in $Segments) {
            $measure = $Graphics.MeasureString($segment.Text, $Font, 5000, $formatLeft)
            $totalWidth += $measure.Width
        }
        return $totalWidth
    }

    function Draw-SegmentsLine {
        param(
            [System.Drawing.Graphics]$Graphics,
            [object[]]$Segments,
            [System.Drawing.Font]$Font,
            [float]$StartX,
            [float]$StartY,
            [System.Drawing.Brush]$DefaultBrush,
            [System.Drawing.Brush]$HighlightBrush,
            [System.Drawing.Brush]$ShadowBrush,
            [System.Drawing.Brush]$OutlineBrush
        )
        $cursorX = $StartX
        foreach ($segment in $Segments) {
            $segmentBrush = if ($segment.Highlight) { $HighlightBrush } else { $DefaultBrush }
            $segmentWidth = $Graphics.MeasureString($segment.Text, $Font, 5000, $formatLeft).Width

            if ($OutlineBrush) {
                $offsets = @(
                    @(-2, 0), @(2, 0), @(0, -2), @(0, 2),
                    @(-2, -2), @(2, 2), @(-2, 2), @(2, -2)
                )
                foreach ($offset in $offsets) {
                    $Graphics.DrawString($segment.Text, $Font, $OutlineBrush, ($cursorX + $offset[0]), ($StartY + $offset[1]))
                }
            }

            if ($ShadowBrush) {
                $Graphics.DrawString($segment.Text, $Font, $ShadowBrush, ($cursorX + 3), ($StartY + 3))
            }

            $Graphics.DrawString($segment.Text, $Font, $segmentBrush, $cursorX, $StartY)
            $cursorX += $segmentWidth
        }
    }

    $lines = $Text -split "\r?\n"
    $nonBlankLines = @($lines | Where-Object { $_.Trim().Length -gt 0 })
    $nonBlankCount = $nonBlankLines.Count
    $mainBase = if ($nonBlankCount -le 6) { 132 } elseif ($nonBlankCount -eq 7) { 122 } else { 110 }
    $minSize = [Math]::Max(34, $mainBase - 28)

    $prepared = @()
    foreach ($rawLine in $lines) {
        $line = $rawLine.Trim()
        if ($line.Length -eq 0) {
            $prepared += [pscustomobject]@{ Kind = "gap"; Line = $null; Segments = $null }
        } else {
            $prepared += [pscustomobject]@{ Kind = "line"; Line = $line; Segments = (Get-Segments -Line $line) }
        }
    }

    $sharedFontSize = $mainBase
    while ($sharedFontSize -ge $minSize) {
        $font = New-Object System.Drawing.Font($Family, $sharedFontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $tooWide = $false
        foreach ($entry in $prepared) {
            if ($entry.Kind -ne "line") { continue }
            $lineWidth = Get-LineWidth -Graphics $Graphics -Segments $entry.Segments -Font $font
            if ($lineWidth -gt $Width) {
                $tooWide = $true
                break
            }
        }
        if (-not $tooWide) {
            $font.Dispose()
            break
        }
        $font.Dispose()
        $sharedFontSize -= 2
    }

    $plan = @()
    foreach ($entry in $prepared) {
        if ($entry.Kind -eq "gap") {
            $gapSize = [int]([Math]::Ceiling($sharedFontSize * 0.18))
            $plan += [pscustomobject]@{ Kind = "gap"; Size = $gapSize }
            continue
        }

        $font = New-Object System.Drawing.Font($Family, $sharedFontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $finalLineWidth = Get-LineWidth -Graphics $Graphics -Segments $entry.Segments -Font $font
        $startX = if ($Format.Alignment -eq [System.Drawing.StringAlignment]::Center) {
            [float]($X + (($Width - $finalLineWidth) / 2))
        } else {
            [float]$X
        }
        $advance = [int]([Math]::Ceiling($sharedFontSize * 0.80))
        $plan += [pscustomobject]@{
            Kind = "line"
            Segments = $entry.Segments
            FontSize = $sharedFontSize
            StartX = $startX
            Advance = $advance
        }
        $font.Dispose()
    }

    $totalHeight = 0
    foreach ($entry in $plan) {
        $totalHeight += if ($entry.Kind -eq "gap") { $entry.Size } else { $entry.Advance }
    }
    $cursorY = $Y + [Math]::Max(0, [int][Math]::Floor(($Height - $totalHeight) / 2))

    foreach ($entry in $plan) {
        if ($entry.Kind -eq "gap") {
            $cursorY += $entry.Size
            continue
        }
        $font = New-Object System.Drawing.Font($Family, $entry.FontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        Draw-SegmentsLine -Graphics $Graphics -Segments $entry.Segments -Font $font -StartX $entry.StartX -StartY $cursorY -DefaultBrush $Brush -HighlightBrush $HighlightBrush -ShadowBrush $ShadowBrush -OutlineBrush $OutlineBrush
        $cursorY += $entry.Advance
        $font.Dispose()
    }
}

function Draw-Foot {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.FontFamily]$Family,
        [System.Drawing.Brush]$Brush,
        [int]$Width,
        [int]$Height,
        [string]$Text,
        [string]$LogoPath
    )
    $font = New-Object System.Drawing.Font($Family, 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $Graphics.DrawString($Text, $font, $Brush, 88, ($Height - 88))
    $font.Dispose()
    if (Test-Path $LogoPath) {
        $logo = [System.Drawing.Image]::FromFile($LogoPath)
        $size = 72
        $x = $Width - 74 - $size
        $y = $Height - 62 - $size
        $Graphics.DrawImage($logo, $x, $y, $size, $size)
        $logo.Dispose()
    }
}

$headlineFamily = Get-FontFamily -Candidates @("Cormorant Garamond","Garamond","Book Antiqua","Palatino Linotype","Georgia","Times New Roman")
$bodyFamily = Get-FontFamily -Candidates @("Book Antiqua","Palatino Linotype","Georgia","Cambria","Times New Roman")

$goldBrush = New-Object System.Drawing.SolidBrush (New-Color 255 218 190 120)
$ivoryBrush = New-Object System.Drawing.SolidBrush (New-Color 235 243 238 232)
$shadowBrush = New-Object System.Drawing.SolidBrush (New-Color 160 8 7 6)
$outlineBrush = New-Object System.Drawing.SolidBrush (New-Color 220 248 245 240)
$titleOutlineBrush = New-Object System.Drawing.SolidBrush (New-Color 200 16 13 11)
$blackOutlineBrush = New-Object System.Drawing.SolidBrush (New-Color 220 10 10 10)
$phoneBorderPen = New-Object System.Drawing.Pen (New-Color 245 206 170 92), 4
$formatCenter = New-Object System.Drawing.StringFormat
$formatCenter.Alignment = [System.Drawing.StringAlignment]::Center
$formatCenter.LineAlignment = [System.Drawing.StringAlignment]::Center
$formatLeft = New-Object System.Drawing.StringFormat
$formatLeft.Alignment = [System.Drawing.StringAlignment]::Near
$formatLeft.LineAlignment = [System.Drawing.StringAlignment]::Center

$itemsPath = Join-Path $marketingRoot "abertura-vitrine-01-10.json"
if (!(Test-Path $itemsPath)) { throw "Arquivo nao encontrado: $itemsPath" }
$items = Get-Content -Raw -Encoding UTF8 $itemsPath | ConvertFrom-Json
if ($OnlyIds.Count -gt 0) {
    $items = $items | Where-Object { $OnlyIds -contains $_.Id }
}

foreach ($item in $items) {
    $bgPath = $backgrounds[($item.Id - 1) % $backgrounds.Count]
    if (!(Test-Path $bgPath)) { throw "Fundo não encontrado: $bgPath" }
    $printPath = $null
    if ($item.Print) {
        $printPath = Join-Path $printRoot $item.Print
        if (!(Test-Path $printPath)) { throw "Print não encontrado: $printPath" }
    }

    $outDir = Join-Path $outputRoot ("abertura-vitrine-{0}-{1}\slides" -f $item.Id.ToString("00"), $item.Slug)
    if (Test-Path $outDir) { Remove-Item -LiteralPath $outDir -Recurse -Force }
    New-Item -ItemType Directory -Path $outDir | Out-Null

    foreach ($slideIndex in 1..3) {
        $width = 1080
        $height = 1350
        $bitmap = New-Object System.Drawing.Bitmap($width, $height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

        $bg = [System.Drawing.Image]::FromFile($bgPath)
        $cover = Get-CoverRect -srcW $bg.Width -srcH $bg.Height -dstW $width -dstH $height
        $graphics.DrawImage($bg, $cover.X, $cover.Y, $cover.W, $cover.H)
        $bg.Dispose()

        if ($slideIndex -eq 1) {
            Draw-FitText -Graphics $graphics -Text $item.Title -Family $headlineFamily -BaseSize 112 -Brush $goldBrush -X 90 -Y 42 -Width 900 -Height 170 -Format $formatCenter -MinSize 44 -ShadowOffset 4 -ShadowBrush $shadowBrush -OutlineBrush $titleOutlineBrush -OutlineOffset 2

            Draw-FitText -Graphics $graphics -Text $item.Line -Family $bodyFamily -BaseSize 54 -Brush $ivoryBrush -X 120 -Y 188 -Width 840 -Height 112 -Format $formatCenter -MinSize 28 -ShadowOffset 3 -ShadowBrush $shadowBrush

            if ($printPath) {
                $targetX = 220
                $targetY = 348
                $targetW = 640
                $targetH = 872
                $print = [System.Drawing.Image]::FromFile($printPath)
                $scale = [Math]::Min($targetW / $print.Width, $targetH / $print.Height)
                $newW = [int][Math]::Round($print.Width * $scale)
                $newH = [int][Math]::Round($print.Height * $scale)
                $px = [int][Math]::Round($targetX + ($targetW - $newW) / 2)
                $py = [int][Math]::Round($targetY + ($targetH - $newH) / 2)
                $radius = 28
                $shadow = New-Object System.Drawing.SolidBrush (New-Color 120 0 0 0)
                $shadowPath = New-RoundedRectanglePath -X ($px + 8) -Y ($py + 10) -Width $newW -Height $newH -Radius $radius
                $graphics.FillPath($shadow, $shadowPath)
                $shadow.Dispose()
                $shadowPath.Dispose()

                $clipPath = New-RoundedRectanglePath -X $px -Y $py -Width $newW -Height $newH -Radius $radius
                $graphics.SetClip($clipPath)
                $graphics.DrawImage($print, $px, $py, $newW, $newH)
                $graphics.ResetClip()
                $graphics.DrawPath($phoneBorderPen, $clipPath)
                $clipPath.Dispose()
                $print.Dispose()
            }
        }

        if ($slideIndex -eq 2) {
            $gradRect = New-Object System.Drawing.RectangleF -ArgumentList 0, 0, $width, $height
            $silverTop = New-Color 255 245 245 245
            $silverBot = New-Color 255 180 180 185
            $silverGradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush($gradRect, $silverTop, $silverBot, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
            Draw-LargeLines -Graphics $graphics -Text $item.Slide2 -Family $headlineFamily -Brush $silverGradient -HighlightBrush $goldBrush -X 18 -Y 120 -Width 1044 -Height 980 -Format $formatCenter -ShadowBrush $shadowBrush -OutlineBrush $blackOutlineBrush
            $silverGradient.Dispose()
        }

        if ($slideIndex -eq 3) {
            Draw-FitText -Graphics $graphics -Text "GLYPH" -Family $headlineFamily -BaseSize 114 -Brush $goldBrush -X 120 -Y 520 -Width 840 -Height 120 -Format $formatCenter -MinSize 72 -ShadowOffset 4 -ShadowBrush $shadowBrush -OutlineBrush $outlineBrush -OutlineOffset 3

            Draw-FitText -Graphics $graphics -Text "Organize seu império." -Family $bodyFamily -BaseSize 52 -Brush $ivoryBrush -X 120 -Y 640 -Width 840 -Height 90 -Format $formatCenter -MinSize 30 -ShadowOffset 3 -ShadowBrush $shadowBrush

            Draw-Foot -Graphics $graphics -Family $headlineFamily -Brush $goldBrush -Width $width -Height $height -Text "glyph.life" -LogoPath $logoPath
        }

        $outPath = Join-Path $outDir ("slide-{0:00}.png" -f $slideIndex)
        $bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

$items | Select-Object Id,Title,Slug | Format-Table -AutoSize

$phoneBorderPen.Dispose()
