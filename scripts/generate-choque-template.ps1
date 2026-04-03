param(
    [string]$OutputDir,
    [string[]]$BackgroundPaths,
    [string[]]$Slides,
    [string]$SheetTitle = "",
    [ValidateSet("Crimson","Slate","Petrol","Plum","Bronze")]
    [string]$Theme = "Slate",
    [ValidateSet("White","Gold","Silver","BridgeGold")]
    [string]$TextStyle = "White",
    [ValidateSet("Auto","Arial","Franklin","Bahnschrift","Bridge")]
    [string]$FontChoice = "Auto"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-Color {
    param([int]$A, [int]$R, [int]$G, [int]$B)
    [System.Drawing.Color]::FromArgb($A, $R, $G, $B)
}

function Get-FontFamily {
    param([string[]]$Candidates)

    $installed = [System.Drawing.Text.InstalledFontCollection]::new()
    foreach ($candidate in $Candidates) {
        $match = $installed.Families | Where-Object { $_.Name -eq $candidate } | Select-Object -First 1
        if ($null -ne $match) { return $match }
    }

    return [System.Drawing.FontFamily]::GenericSansSerif
}

function Get-HeadlineFontFamily {
    param([string]$FontChoice)

    switch ($FontChoice) {
        "Arial" {
            return Get-FontFamily -Candidates @("Arial", "Segoe UI Semibold", "Bahnschrift SemiBold", "Franklin Gothic Demi")
        }
        "Franklin" {
            return Get-FontFamily -Candidates @("Franklin Gothic Demi", "Franklin Gothic Heavy", "Arial", "Segoe UI Semibold")
        }
        "Bahnschrift" {
            return Get-FontFamily -Candidates @("Bahnschrift SemiBold", "Bahnschrift", "Segoe UI Semibold", "Arial")
        }
        "Bridge" {
            return Get-FontFamily -Candidates @("Cormorant Garamond", "Garamond", "Book Antiqua", "Palatino Linotype", "Georgia", "Times New Roman")
        }
        default {
            return Get-FontFamily -Candidates @("Franklin Gothic Demi", "Bahnschrift SemiBold", "Arial", "Segoe UI Semibold", "Gill Sans MT", "Trebuchet MS")
        }
    }
}

function Initialize-Graphics {
    param([System.Drawing.Graphics]$Graphics)

    $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $Graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
}

function New-Canvas {
    param([int]$Width, [int]$Height)

    $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    Initialize-Graphics -Graphics $graphics
    @{
        Bitmap = $bitmap
        Graphics = $graphics
    }
}

function Draw-ImageCover {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$ImagePath,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height
    )

    $image = [System.Drawing.Image]::FromFile($ImagePath)
    try {
        $scale = [Math]::Max($Width / $image.Width, $Height / $image.Height)
        $drawWidth = [float]($image.Width * $scale)
        $drawHeight = [float]($image.Height * $scale)
        $drawX = [float]($X + (($Width - $drawWidth) / 2))
        $drawY = [float]($Y + (($Height - $drawHeight) / 2))
        $Graphics.DrawImage($image, $drawX, $drawY, $drawWidth, $drawHeight)
    } finally {
        $image.Dispose()
    }
}

function Get-ThemeSpec {
    param([string]$Theme)

    switch ($Theme) {
        "Crimson" {
            return @{
                Start = (New-Color 118 18 5 8)
                End = (New-Color 164 6 2 5)
                Accent = (New-Color 255 255 255 255)
            }
        }
        "Petrol" {
            return @{
                Start = (New-Color 118 5 20 30)
                End = (New-Color 164 3 10 17)
                Accent = (New-Color 255 255 255 255)
            }
        }
        "Plum" {
            return @{
                Start = (New-Color 118 28 12 35)
                End = (New-Color 164 10 4 13)
                Accent = (New-Color 255 255 255 255)
            }
        }
        "Bronze" {
            return @{
                Start = (New-Color 118 39 24 10)
                End = (New-Color 164 15 8 3)
                Accent = (New-Color 255 255 255 255)
            }
        }
        default {
            return @{
                Start = (New-Color 124 10 10 12)
                End = (New-Color 174 4 4 6)
                Accent = (New-Color 255 255 255 255)
            }
        }
    }
}

function Draw-Backdrop {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$BackgroundPath,
        [int]$Width,
        [int]$Height,
        [string]$Theme
    )

    Draw-ImageCover -Graphics $Graphics -ImagePath $BackgroundPath -X 0 -Y 0 -Width $Width -Height $Height

    $themeSpec = Get-ThemeSpec -Theme $Theme

    $overlayBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        [System.Drawing.Point]::new(0, 0),
        [System.Drawing.Point]::new($Width, $Height),
        $themeSpec.Start,
        $themeSpec.End
    )
    $Graphics.FillRectangle($overlayBrush, 0, 0, $Width, $Height)
    $overlayBrush.Dispose()

}

function Get-WrappedLines {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.Font]$Font,
        [float]$MaxWidth
    )

    $allLines = [System.Collections.Generic.List[string]]::new()
    $paragraphs = $Text -split "`r?`n"

    foreach ($paragraph in $paragraphs) {
        $trimmed = $paragraph.Trim()
        if ([string]::IsNullOrWhiteSpace($trimmed)) {
            $allLines.Add("")
            continue
        }

        $words = $trimmed -split "\s+"
        $current = ""

        foreach ($word in $words) {
            $candidate = if ([string]::IsNullOrWhiteSpace($current)) { $word } else { "$current $word" }
            $measured = $Graphics.MeasureString($candidate, $Font)

            if ($measured.Width -le $MaxWidth -or [string]::IsNullOrWhiteSpace($current)) {
                $current = $candidate
            } else {
                $allLines.Add($current)
                $current = $word
            }
        }

        if (-not [string]::IsNullOrWhiteSpace($current)) {
            $allLines.Add($current)
        }
    }

    return ,$allLines.ToArray()
}

function Get-FittedTextLayout {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.FontFamily]$FontFamily,
        [float]$BaseSize,
        [System.Drawing.FontStyle]$Style,
        [System.Drawing.RectangleF]$Bounds,
        [float]$MinSize = 48
    )

    for ($size = $BaseSize; $size -ge $MinSize; $size -= 3) {
        $font = [System.Drawing.Font]::new($FontFamily, $size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
        try {
            $lines = Get-WrappedLines -Graphics $Graphics -Text $Text -Font $font -MaxWidth ([float]($Bounds.Width * 0.94))
            $lineHeight = [float][Math]::Ceiling($font.GetHeight($Graphics) * 0.9)
            $totalHeight = $lines.Count * $lineHeight
            $maxLineWidth = 0.0

            foreach ($line in $lines) {
                $lineWidth = $Graphics.MeasureString($line, $font).Width
                if ($lineWidth -gt $maxLineWidth) { $maxLineWidth = $lineWidth }
            }

            if ($maxLineWidth -le ($Bounds.Width * 0.97) -and $totalHeight -le ($Bounds.Height * 0.95)) {
                return @{
                    Size = $size
                    Lines = $lines
                    LineHeight = $lineHeight
                }
            }
        } finally {
            $font.Dispose()
        }
    }

    $fallbackFont = [System.Drawing.Font]::new($FontFamily, $MinSize, $Style, [System.Drawing.GraphicsUnit]::Pixel)
    try {
        $fallbackLines = Get-WrappedLines -Graphics $Graphics -Text $Text -Font $fallbackFont -MaxWidth ([float]($Bounds.Width * 0.94))
        return @{
            Size = $MinSize
            Lines = $fallbackLines
            LineHeight = [float][Math]::Ceiling($fallbackFont.GetHeight($Graphics) * 0.9)
        }
    } finally {
        $fallbackFont.Dispose()
    }
}

function Repair-Mojibake {
    param([string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $Text
    }

    if ($Text -notmatch '[ÃÂÊÔÕáéíóúç]') {
        return $Text
    }

    $sourceEncoding = [System.Text.Encoding]::GetEncoding(1252)
    $bytes = $sourceEncoding.GetBytes($Text)
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

function New-TextFillBrush {
    param(
        [System.Drawing.RectangleF]$Bounds,
        [string]$TextStyle
    )

    $angle = 18
    if ($TextStyle -eq "Silver") { $angle = 102 }

    $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        $Bounds,
        (New-Color 255 245 241 234),
        (New-Color 255 222 216 206),
        $angle
    )

    if ($TextStyle -eq "White") {
        $blend = [System.Drawing.Drawing2D.ColorBlend]::new()
        $blend.Positions = [single[]]@(0.0, 0.24, 0.5, 0.76, 1.0)
        $blend.Colors = [System.Drawing.Color[]]@(
            (New-Color 255 205 209 214),
            (New-Color 255 238 239 236),
            (New-Color 255 255 252 247),
            (New-Color 255 234 233 228),
            (New-Color 255 196 200 205)
        )
        $brush.InterpolationColors = $blend
        return $brush
    }

    $blend = [System.Drawing.Drawing2D.ColorBlend]::new()
    $blend.Positions = [single[]]@(0.0, 0.28, 0.58, 0.8, 1.0)

    switch ($TextStyle) {
        "Gold" {
            $blend.Colors = [System.Drawing.Color[]]@(
                (New-Color 255 118 85 35),
                (New-Color 255 185 142 62),
                (New-Color 255 228 188 96),
                (New-Color 255 168 125 50),
                (New-Color 255 108 77 30)
            )
        }
        "BridgeGold" {
            $blend.Colors = [System.Drawing.Color[]]@(
                (New-Color 255 120 84 34),
                (New-Color 255 182 138 62),
                (New-Color 255 228 194 106),
                (New-Color 255 166 123 54),
                (New-Color 255 112 78 31)
            )
        }
        "Silver" {
            $blend.Colors = [System.Drawing.Color[]]@(
                (New-Color 255 122 132 147),
                (New-Color 255 198 207 218),
                (New-Color 255 241 245 250),
                (New-Color 255 184 193 205),
                (New-Color 255 116 125 139)
            )
        }
    }

    $brush.InterpolationColors = $blend
    return $brush
}

function Draw-OutlinedTextBlock {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.RectangleF]$Bounds,
        [System.Drawing.FontFamily]$FontFamily,
        [float]$BaseSize = 96,
        [string]$TextStyle = "White"
    )

    $layout = Get-FittedTextLayout -Graphics $Graphics -Text $Text -FontFamily $FontFamily -BaseSize $BaseSize -Style ([System.Drawing.FontStyle]::Bold) -Bounds $Bounds -MinSize 46
    $lineHeight = [float]$layout.LineHeight
    $lines = $layout.Lines
    $totalHeight = $lines.Count * $lineHeight
    $startY = [float]($Bounds.Y + (($Bounds.Height - $totalHeight) / 2))

    $stringFormat = [System.Drawing.StringFormat]::new()
    $stringFormat.Alignment = [System.Drawing.StringAlignment]::Near
    $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Near
    $stringFormat.FormatFlags = [System.Drawing.StringFormatFlags]::NoClip

    $outlineWidth = [float][Math]::Max(5.0, [Math]::Round($layout.Size * 0.075, 1))
    $outlinePen = [System.Drawing.Pen]::new((New-Color 255 14 14 14), $outlineWidth)
    $outlinePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $innerStrokePen = [System.Drawing.Pen]::new((New-Color 84 68 68 68), [float][Math]::Max(1.6, [Math]::Round($layout.Size * 0.024, 1)))
    $innerStrokePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $shadowOffsets = @(
        @{ Offset = [float][Math]::Max(2, [Math]::Round($layout.Size * 0.018)); Alpha = 130 },
        @{ Offset = [float][Math]::Max(4, [Math]::Round($layout.Size * 0.034)); Alpha = 92 },
        @{ Offset = [float][Math]::Max(7, [Math]::Round($layout.Size * 0.052)); Alpha = 54 }
    )

    try {
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            $y = [float]($startY + ($i * $lineHeight))
            $font = [System.Drawing.Font]::new($FontFamily, $layout.Size, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
            try {
                $lineSize = $Graphics.MeasureString($line, $font)
                $x = [float]($Bounds.X + (($Bounds.Width - $lineSize.Width) / 2))

                foreach ($shadow in $shadowOffsets) {
                    $shadowBrush = [System.Drawing.SolidBrush]::new((New-Color $shadow.Alpha 0 0 0))
                    try {
                        $shadowPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
                        $shadowPath.AddString($line, $FontFamily, [int][System.Drawing.FontStyle]::Bold, $layout.Size, [System.Drawing.PointF]::new($x + $shadow.Offset, $y + $shadow.Offset), $stringFormat)
                        $Graphics.FillPath($shadowBrush, $shadowPath)
                        $shadowPath.Dispose()
                    } finally {
                        $shadowBrush.Dispose()
                    }
                }

                $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
                $path.AddString($line, $FontFamily, [int][System.Drawing.FontStyle]::Bold, $layout.Size, [System.Drawing.PointF]::new($x, $y), $stringFormat)
                $Graphics.DrawPath($outlinePen, $path)
                $Graphics.DrawPath($innerStrokePen, $path)
                $fillBounds = $path.GetBounds()
                $fillBrush = New-TextFillBrush -Bounds $fillBounds -TextStyle $TextStyle
                $Graphics.FillPath($fillBrush, $path)
                $fillBrush.Dispose()
                $path.Dispose()
            } finally {
                $font.Dispose()
            }
        }
    } finally {
        $outlinePen.Dispose()
        $innerStrokePen.Dispose()
        $stringFormat.Dispose()
    }
}

function Draw-FinalSymbol {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$Width,
        [int]$Height
    )

    $logoPath = "C:\Users\Afonso\Downloads\GOL1.006\public\logo-diamond.png"
    if (-not (Test-Path $logoPath)) {
        return
    }

    $size = 82
    $x = [int](($Width - $size) / 2)
    $y = $Height - 228
    $image = [System.Drawing.Image]::FromFile($logoPath)
    try {
        $glowBrush = [System.Drawing.SolidBrush]::new((New-Color 30 238 198 100))
        $Graphics.FillEllipse($glowBrush, $x - 20, $y - 20, $size + 40, $size + 40)
        $glowBrush.Dispose()

        $Graphics.DrawImage($image, $x, $y, $size, $size)
    } finally {
        $image.Dispose()
    }
}

function Draw-SlideDots {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$CurrentIndex,
        [int]$TotalSlides,
        [int]$Width,
        [int]$Height
    )

    $spacing = 22
    $dotSize = 10
    $activeSize = 14
    $totalWidth = (($TotalSlides - 1) * $spacing) + $activeSize
    $startX = [int](($Width - $totalWidth) / 2)
    $y = $Height - 62

    for ($i = 0; $i -lt $TotalSlides; $i++) {
        $isActive = $i -eq $CurrentIndex
        $size = if ($isActive) { $activeSize } else { $dotSize }
        $x = $startX + ($i * $spacing)
        $dotColor = if ($isActive) { New-Color 220 255 255 255 } else { New-Color 118 255 255 255 }
        $brush = [System.Drawing.SolidBrush]::new($dotColor)
        $Graphics.FillEllipse($brush, $x, $y, $size, $size)
        $brush.Dispose()
    }
}

function Draw-Watermark {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$Width,
        [int]$Height,
        [bool]$IsFinal
    )

    $fontFamily = Get-FontFamily -Candidates @("Georgia", "Book Antiqua", "Garamond", "Times New Roman")
    $fontSize = if ($IsFinal) { 30 } else { 24 }
    $font = [System.Drawing.Font]::new($fontFamily, $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $watermarkColor = if ($IsFinal) { New-Color 152 255 255 255 } else { New-Color 82 255 255 255 }
    $brush = [System.Drawing.SolidBrush]::new($watermarkColor)
    try {
    $Graphics.DrawString("glyph.life", $font, $brush, [System.Drawing.RectangleF]::new(0, $Height - 118, $Width, 28), $format)
    } finally {
        $font.Dispose()
        $format.Dispose()
        $brush.Dispose()
    }
}

function Draw-BrandOnlySlide {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$Width,
        [int]$Height
    )

    $brandFamily = Get-HeadlineFontFamily -FontChoice "Bridge"
    $brandFont = [System.Drawing.Font]::new($brandFamily, 158, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $shadowBrush = [System.Drawing.SolidBrush]::new((New-Color 116 7 6 5))
    $brandBrush = New-TextFillBrush -Bounds ([System.Drawing.RectangleF]::new(0, 0, $Width, $Height)) -TextStyle "BridgeGold"
    $format = [System.Drawing.StringFormat]::new()

    try {
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoClip

        $shadowRect = [System.Drawing.RectangleF]::new(0, 0, $Width + 8, $Height + 8)
        $mainRect = [System.Drawing.RectangleF]::new(0, 0, $Width, $Height)
        $Graphics.DrawString("GLYPH", $brandFont, $shadowBrush, $shadowRect, $format)
        $Graphics.DrawString("GLYPH", $brandFont, $brandBrush, $mainRect, $format)
    } finally {
        $brandFont.Dispose()
        $shadowBrush.Dispose()
        $brandBrush.Dispose()
        $format.Dispose()
    }
}

function Draw-BrandFooter {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$Width,
        [int]$Height
    )

    $logoPath = "C:\Users\Afonso\Downloads\GOL1.006\public\logo-diamond.png"
    $siteFamily = Get-FontFamily -Candidates @("Cormorant Garamond", "Garamond", "Book Antiqua", "Palatino Linotype", "Georgia", "Times New Roman")
    $siteFont = [System.Drawing.Font]::new($siteFamily, 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $siteBrush = [System.Drawing.SolidBrush]::new((New-Color 212 244 236 214))
    $siteShadow = [System.Drawing.SolidBrush]::new((New-Color 96 5 4 3))

    try {
        $Graphics.DrawString("glyph.life", $siteFont, $siteShadow, [System.Drawing.PointF]::new(91, $Height - 86))
        $Graphics.DrawString("glyph.life", $siteFont, $siteBrush, [System.Drawing.PointF]::new(88, $Height - 88))

        if (Test-Path $logoPath) {
            $logo = [System.Drawing.Image]::FromFile($logoPath)
            try {
                $logoSize = 68
                $logoX = $Width - 148
                $logoY = $Height - 138
                $glowBrush = [System.Drawing.SolidBrush]::new((New-Color 24 230 190 96))
                try {
                    $Graphics.FillEllipse($glowBrush, $logoX - 10, $logoY - 10, $logoSize + 20, $logoSize + 20)
                } finally {
                    $glowBrush.Dispose()
                }
                $Graphics.DrawImage($logo, $logoX, $logoY, $logoSize, $logoSize)
            } finally {
                $logo.Dispose()
            }
        }
    } finally {
        $siteFont.Dispose()
        $siteBrush.Dispose()
        $siteShadow.Dispose()
    }
}

if ($BackgroundPaths.Count -lt $Slides.Count) {
    throw "Expected at least $($Slides.Count) background images, but got $($BackgroundPaths.Count)."
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$width = 1080
$height = 1350
$fontFamily = Get-HeadlineFontFamily -FontChoice $FontChoice
$slidePaths = [System.Collections.Generic.List[string]]::new()
$normalizedSlides = @($Slides | ForEach-Object { Repair-Mojibake $_ })
$copySlideCount = $normalizedSlides.Count
$totalSlides = $copySlideCount + 1

for ($i = 0; $i -lt $totalSlides; $i++) {
    $canvas = New-Canvas -Width $width -Height $height
    $bitmap = $canvas.Bitmap
    $graphics = $canvas.Graphics

    try {
        $backgroundIndex = if ($i -lt $BackgroundPaths.Count) { $i } else { $BackgroundPaths.Count - 1 }
        Draw-Backdrop -Graphics $graphics -BackgroundPath $BackgroundPaths[$backgroundIndex] -Width $width -Height $height -Theme $Theme

        $isBrandSlide = $i -eq ($totalSlides - 1)
        if ($isBrandSlide) {
            Draw-BrandOnlySlide -Graphics $graphics -Width $width -Height $height
        } else {
            $textBounds = [System.Drawing.RectangleF]::new(88, 138, 904, 996)
            Draw-OutlinedTextBlock -Graphics $graphics -Text $normalizedSlides[$i] -Bounds $textBounds -FontFamily $fontFamily -BaseSize 108 -TextStyle $TextStyle
        }

        if ($isBrandSlide) {
            Draw-BrandFooter -Graphics $graphics -Width $width -Height $height
        } else {
            Draw-Watermark -Graphics $graphics -Width $width -Height $height -IsFinal $false
        }
        Draw-SlideDots -Graphics $graphics -CurrentIndex $i -TotalSlides $totalSlides -Width $width -Height $height

        $slideName = "slide-{0:D2}.png" -f ($i + 1)
        $slidePath = Join-Path $OutputDir $slideName
        $bitmap.Save($slidePath, [System.Drawing.Imaging.ImageFormat]::Png)
        $slidePaths.Add($slidePath)
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

$sheetColumns = 4
$sheetRows = [int][Math]::Ceiling($slidePaths.Count / $sheetColumns)
$sheetWidth = 1920
$sheetPadding = 28
$sheetCellWidth = [int](($sheetWidth - (($sheetColumns + 1) * $sheetPadding)) / $sheetColumns)
$sheetCellHeight = [int][Math]::Round($sheetCellWidth * ($height / $width))
$sheetHeight = ($sheetRows * $sheetCellHeight) + (($sheetRows + 1) * $sheetPadding)

$sheetCanvas = New-Canvas -Width $sheetWidth -Height $sheetHeight
$sheetBitmap = $sheetCanvas.Bitmap
$sheetGraphics = $sheetCanvas.Graphics

try {
    $sheetGraphics.Clear((New-Color 255 10 10 12))

    for ($i = 0; $i -lt $slidePaths.Count; $i++) {
        $row = [int][Math]::Floor($i / $sheetColumns)
        $col = $i % $sheetColumns
        $x = $sheetPadding + ($col * ($sheetCellWidth + $sheetPadding))
        $y = $sheetPadding + ($row * ($sheetCellHeight + $sheetPadding))

        Draw-ImageCover -Graphics $sheetGraphics -ImagePath $slidePaths[$i] -X $x -Y $y -Width $sheetCellWidth -Height $sheetCellHeight

        $pen = [System.Drawing.Pen]::new((New-Color 255 255 255 255), 1.8)
        $sheetGraphics.DrawRectangle($pen, $x, $y, $sheetCellWidth, $sheetCellHeight)
        $pen.Dispose()
    }

    if (-not [string]::IsNullOrWhiteSpace($SheetTitle)) {
        $sheetFontFamily = Get-FontFamily -Candidates @("Georgia", "Book Antiqua", "Garamond", "Times New Roman")
        $sheetFont = [System.Drawing.Font]::new($sheetFontFamily, 20, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $sheetBrush = [System.Drawing.SolidBrush]::new((New-Color 190 255 255 255))
        $sheetFormat = [System.Drawing.StringFormat]::new()
        $sheetFormat.Alignment = [System.Drawing.StringAlignment]::Near
        $sheetFormat.LineAlignment = [System.Drawing.StringAlignment]::Near
        $sheetGraphics.DrawString($SheetTitle, $sheetFont, $sheetBrush, [System.Drawing.RectangleF]::new(24, 12, 800, 28), $sheetFormat)
        $sheetFont.Dispose()
        $sheetBrush.Dispose()
        $sheetFormat.Dispose()
    }

    $sheetPath = Join-Path $OutputDir "contact-sheet.png"
    $sheetBitmap.Save($sheetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "CREATED=$sheetPath"
} finally {
    $sheetGraphics.Dispose()
    $sheetBitmap.Dispose()
}
