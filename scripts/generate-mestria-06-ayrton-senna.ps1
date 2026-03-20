param(
    [string]$OutputDir = "C:\Users\Afonso\Downloads\GOL1.006\marketing\mestria-06-ayrton-senna\slides"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-Color {
    param(
        [int]$A,
        [int]$R,
        [int]$G,
        [int]$B
    )

    return [System.Drawing.Color]::FromArgb($A, $R, $G, $B)
}

function Get-FontFamily {
    param(
        [string[]]$Candidates
    )

    $installed = [System.Drawing.Text.InstalledFontCollection]::new()
    foreach ($candidate in $Candidates) {
        $match = $installed.Families | Where-Object { $_.Name -eq $candidate } | Select-Object -First 1
        if ($null -ne $match) {
            return $match
        }
    }

    return [System.Drawing.FontFamily]::GenericSerif
}

function Initialize-Graphics {
    param(
        [System.Drawing.Graphics]$Graphics
    )

    $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $Graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
}

function New-Canvas {
    param(
        [int]$Width,
        [int]$Height
    )

    $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    Initialize-Graphics -Graphics $graphics
    return @{
        Bitmap = $bitmap
        Graphics = $graphics
    }
}

function Draw-FittedImage {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$ImagePath,
        [int]$Width,
        [int]$Height
    )

    $image = [System.Drawing.Image]::FromFile($ImagePath)
    try {
        $scale = [Math]::Max($Width / $image.Width, $Height / $image.Height)
        $drawWidth = [int][Math]::Ceiling($image.Width * $scale)
        $drawHeight = [int][Math]::Ceiling($image.Height * $scale)
        $drawX = [int][Math]::Floor(($Width - $drawWidth) / 2)
        $drawY = [int][Math]::Floor(($Height - $drawHeight) / 2)
        $Graphics.DrawImage($image, $drawX, $drawY, $drawWidth, $drawHeight)
    } finally {
        $image.Dispose()
    }
}

function Get-VisibleImageBounds {
    param(
        [System.Drawing.Image]$Image,
        [int]$AlphaThreshold = 8
    )

    $ownsBitmap = $false
    $bitmap = $null

    if ($Image -is [System.Drawing.Bitmap]) {
        $bitmap = $Image
    } else {
        $bitmap = [System.Drawing.Bitmap]::new($Image)
        $ownsBitmap = $true
    }

    try {
        $minX = $bitmap.Width
        $minY = $bitmap.Height
        $maxX = -1
        $maxY = -1

        for ($y = 0; $y -lt $bitmap.Height; $y++) {
            for ($x = 0; $x -lt $bitmap.Width; $x++) {
                if ($bitmap.GetPixel($x, $y).A -gt $AlphaThreshold) {
                    if ($x -lt $minX) { $minX = $x }
                    if ($y -lt $minY) { $minY = $y }
                    if ($x -gt $maxX) { $maxX = $x }
                    if ($y -gt $maxY) { $maxY = $y }
                }
            }
        }

        if ($maxX -lt 0 -or $maxY -lt 0) {
            return [System.Drawing.Rectangle]::new(0, 0, $bitmap.Width, $bitmap.Height)
        }

        return [System.Drawing.Rectangle]::new($minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1))
    } finally {
        if ($ownsBitmap -and $null -ne $bitmap) {
            $bitmap.Dispose()
        }
    }
}

function Draw-ImageInBox {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$ImagePath,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$Opacity = 1.0,
        [switch]$Cover,
        [switch]$AlignBottom,
        [switch]$AlignRight,
        [switch]$TrimTransparency
    )

    $image = [System.Drawing.Image]::FromFile($ImagePath)
    $attributes = [System.Drawing.Imaging.ImageAttributes]::new()
    try {
        $sourceRect = if ($TrimTransparency) {
            Get-VisibleImageBounds -Image $image
        } else {
            [System.Drawing.Rectangle]::new(0, 0, $image.Width, $image.Height)
        }

        $scale = if ($Cover) {
            [Math]::Max($Width / $sourceRect.Width, $Height / $sourceRect.Height)
        } else {
            [Math]::Min($Width / $sourceRect.Width, $Height / $sourceRect.Height)
        }
        $drawWidth = [float]($sourceRect.Width * $scale)
        $drawHeight = [float]($sourceRect.Height * $scale)
        $drawX = [float]$X
        $drawY = [float]$Y

        if (-not $AlignRight) {
            $drawX = [float]($X + (($Width - $drawWidth) / 2))
        } else {
            $drawX = [float]($X + $Width - $drawWidth)
        }

        if ($AlignBottom) {
            $drawY = [float]($Y + $Height - $drawHeight)
        } else {
            $drawY = [float]($Y + (($Height - $drawHeight) / 2))
        }

        $matrix = [System.Drawing.Imaging.ColorMatrix]::new()
        $matrix.Matrix00 = 1.0
        $matrix.Matrix11 = 1.0
        $matrix.Matrix22 = 1.0
        $matrix.Matrix33 = [Math]::Max(0.0, [Math]::Min(1.0, $Opacity))
        $matrix.Matrix44 = 1.0
        $attributes.SetColorMatrix($matrix)

        $destRect = [System.Drawing.Rectangle]::new(
            [int][Math]::Round($drawX),
            [int][Math]::Round($drawY),
            [int][Math]::Round($drawWidth),
            [int][Math]::Round($drawHeight)
        )
        $Graphics.DrawImage(
            $image,
            $destRect,
            $sourceRect.X,
            $sourceRect.Y,
            $sourceRect.Width,
            $sourceRect.Height,
            [System.Drawing.GraphicsUnit]::Pixel,
            $attributes
        )
    } finally {
        $attributes.Dispose()
        $image.Dispose()
    }
}

function Get-FeatureFrameHeight {
    param(
        [string]$ImagePath,
        [float]$FrameWidth,
        [float]$InnerHorizontalPadding = 44,
        [float]$InnerVerticalPadding = 36,
        [float]$MinHeight = 360,
        [float]$MaxHeight = 760
    )

    $image = [System.Drawing.Image]::FromFile($ImagePath)
    try {
        $visibleBounds = Get-VisibleImageBounds -Image $image
        $contentWidth = [Math]::Max(80, $FrameWidth - $InnerHorizontalPadding)
        $scale = $contentWidth / $visibleBounds.Width
        $height = ($visibleBounds.Height * $scale) + $InnerVerticalPadding
        return [float][Math]::Max($MinHeight, [Math]::Min($MaxHeight, $height))
    } finally {
        $image.Dispose()
    }
}

function Get-FeatureFrameWidth {
    param(
        [string]$ImagePath,
        [float]$FrameHeight,
        [float]$InnerHorizontalPadding = 28,
        [float]$InnerVerticalPadding = 24,
        [float]$MinWidth = 180,
        [float]$MaxWidth = 320
    )

    $image = [System.Drawing.Image]::FromFile($ImagePath)
    try {
        $visibleBounds = Get-VisibleImageBounds -Image $image
        $contentHeight = [Math]::Max(80, $FrameHeight - $InnerVerticalPadding)
        $scale = $contentHeight / $visibleBounds.Height
        $width = ($visibleBounds.Width * $scale) + $InnerHorizontalPadding
        return [float][Math]::Max($MinWidth, [Math]::Min($MaxWidth, $width))
    } finally {
        $image.Dispose()
    }
}

function Draw-ShadowEllipse {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [int]$Alpha = 70
    )

    for ($i = 8; $i -ge 1; $i--) {
        $stepAlpha = [Math]::Max(6, [int]($Alpha - ($i * 7)))
        $brush = [System.Drawing.SolidBrush]::new((New-Color $stepAlpha 0 0 0))
        try {
            $Graphics.FillEllipse(
                $brush,
                $X - ($i * 4),
                $Y - ($i * 2),
                $Width + ($i * 8),
                $Height + ($i * 4)
            )
        } finally {
            $brush.Dispose()
        }
    }
}

function Draw-InnerContour {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height
    )

    $outerPen = [System.Drawing.Pen]::new((New-Color 214 237 205 114), 2.6)
    $innerPen = [System.Drawing.Pen]::new((New-Color 138 255 236 196), 1.0)
    try {
        $Graphics.DrawRectangle($outerPen, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($innerPen, $X + 10, $Y + 10, $Width - 20, $Height - 20)
    } finally {
        $outerPen.Dispose()
        $innerPen.Dispose()
    }
}

function Draw-FeatureFrame {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [string]$ImagePath,
        [float]$Opacity = 1.0,
        [switch]$CoverImage,
        [float]$ContentPaddingX = 22,
        [float]$ContentPaddingTop = 18,
        [float]$ContentPaddingBottom = 18,
        [float]$AccentWidth = 12
    )

    $outerBrush = [System.Drawing.SolidBrush]::new((New-Color 62 5 6 10))
    $innerBrush = [System.Drawing.SolidBrush]::new((New-Color 108 9 11 16))
    $outerPen = [System.Drawing.Pen]::new((New-Color 185 212 175 55), 2.0)
    $innerPen = [System.Drawing.Pen]::new((New-Color 120 255 236 196), 1.0)
    $accentBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        [System.Drawing.Point]::new([int]$X, [int]$Y),
        [System.Drawing.Point]::new([int]$X, [int]($Y + $Height)),
        (New-Color 84 244 216 118),
        (New-Color 6 244 216 118)
    )

    try {
        $Graphics.FillRectangle($outerBrush, $X, $Y, $Width, $Height)
        $Graphics.FillRectangle($innerBrush, $X + 10, $Y + 10, $Width - 20, $Height - 20)
        $Graphics.FillRectangle($accentBrush, $X + 10, $Y + 10, $AccentWidth, $Height - 20)
        $Graphics.DrawRectangle($outerPen, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($innerPen, $X + 10, $Y + 10, $Width - 20, $Height - 20)
        $clipRect = [System.Drawing.Rectangle]::new(
            [int][Math]::Round($X + 10),
            [int][Math]::Round($Y + 10),
            [int][Math]::Round($Width - 20),
            [int][Math]::Round($Height - 20)
        )
        $state = $Graphics.Save()
        try {
            $Graphics.SetClip($clipRect)
            Draw-ImageInBox -Graphics $Graphics -ImagePath $ImagePath -X ($X + $ContentPaddingX) -Y ($Y + $ContentPaddingTop) -Width ($Width - ($ContentPaddingX * 2)) -Height ($Height - $ContentPaddingTop - $ContentPaddingBottom) -Opacity $Opacity -AlignBottom -Cover:$CoverImage -TrimTransparency
        } finally {
            $Graphics.Restore($state)
        }
    } finally {
        $outerBrush.Dispose()
        $innerBrush.Dispose()
        $outerPen.Dispose()
        $innerPen.Dispose()
        $accentBrush.Dispose()
    }
}

function Draw-ClippedImageBox {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$ImagePath,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$Opacity = 1.0,
        [switch]$Cover,
        [switch]$AlignBottom,
        [switch]$AlignRight
    )

    $clipRect = [System.Drawing.Rectangle]::new(
        [int][Math]::Round($X),
        [int][Math]::Round($Y),
        [int][Math]::Round($Width),
        [int][Math]::Round($Height)
    )

    $state = $Graphics.Save()
    try {
        $Graphics.SetClip($clipRect)
        Draw-ImageInBox -Graphics $Graphics -ImagePath $ImagePath -X $X -Y $Y -Width $Width -Height $Height -Opacity $Opacity -Cover:$Cover -AlignBottom:$AlignBottom -AlignRight:$AlignRight -TrimTransparency
    } finally {
        $Graphics.Restore($state)
    }
}

function Draw-GlowRectangle {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height
    )

    for ($i = 18; $i -ge 1; $i--) {
        $alpha = [Math]::Max(8, 54 - ($i * 2))
        $pen = [System.Drawing.Pen]::new((New-Color $alpha 212 175 55), [float]($i * 1.1))
        $pen.Alignment = [System.Drawing.Drawing2D.PenAlignment]::Center
        $Graphics.DrawRectangle($pen, $X, $Y, $Width, $Height)
        $pen.Dispose()
    }
}

function Draw-BackgroundBase {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$BackgroundPath,
        [int]$Width,
        [int]$Height,
        [string]$Tone = "obsidian"
    )

    Draw-FittedImage -Graphics $Graphics -ImagePath $BackgroundPath -Width $Width -Height $Height

    $topColor = switch ($Tone) {
        "rubi" { New-Color 182 32 5 10 }
        default { New-Color 175 2 3 6 }
    }
    $bottomColor = switch ($Tone) {
        "rubi" { New-Color 156 58 9 18 }
        default { New-Color 145 7 8 11 }
    }
    $overlayBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        [System.Drawing.Point]::new(0, 0),
        [System.Drawing.Point]::new($Width, $Height),
        $topColor,
        $bottomColor
    )
    $Graphics.FillRectangle($overlayBrush, 0, 0, $Width, $Height)
    $overlayBrush.Dispose()

    $panelX = 82
    $panelY = 82
    $panelWidth = $Width - 164
    $panelHeight = $Height - 164

    $panelColor = switch ($Tone) {
        "rubi" { New-Color 168 20 6 10 }
        default { New-Color 162 5 6 9 }
    }
    $panelBrush = [System.Drawing.SolidBrush]::new($panelColor)
    $Graphics.FillRectangle($panelBrush, $panelX, $panelY, $panelWidth, $panelHeight)
    $panelBrush.Dispose()

    Draw-GlowRectangle -Graphics $Graphics -X $panelX -Y $panelY -Width $panelWidth -Height $panelHeight

    $borderPen = [System.Drawing.Pen]::new((New-Color 245 237 205 114), 2.8)
    $Graphics.DrawRectangle($borderPen, $panelX, $panelY, $panelWidth, $panelHeight)
    $borderPen.Dispose()
}

function Get-GoldBrush {
    param(
        [int]$Width,
        [int]$Height
    )

    return [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        [System.Drawing.RectangleF]::new(0, 0, $Width, $Height),
        (New-Color 255 253 242 191),
        (New-Color 255 140 106 47),
        15
    )
}

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

function Draw-Label {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.Font]$Font,
        [System.Drawing.Brush]$Brush,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height
    )

    $Graphics.DrawString($Text, $Font, $Brush, [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height))
}

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
        $format.Trimming = [System.Drawing.StringTrimming]::Word
        $format.FormatFlags = [System.Drawing.StringFormatFlags]::LineLimit

        $paddingX = [float][Math]::Max(12, [Math]::Ceiling($Font.Size * 0.16))
        $paddingY = [float][Math]::Max(12, [Math]::Ceiling($Font.Size * 0.24))
        $safeRect = [System.Drawing.RectangleF]::new(
            [float]($X + $paddingX),
            [float]($Y + $paddingY),
            [float][Math]::Max(12, $Width - ($paddingX * 2)),
            [float][Math]::Max(12, $Height - ($paddingY * 2))
        )

        $drawFont = $Font
        $minSize = [float][Math]::Max(18, [Math]::Floor($Font.Size * 0.72))

        for ($size = [float]$Font.Size; $size -ge $minSize; $size -= 1.5) {
            if ([Math]::Abs($size - $Font.Size) -lt 0.05) {
                $candidate = $Font
            } else {
                $candidate = [System.Drawing.Font]::new($Font.FontFamily, $size, $Font.Style, [System.Drawing.GraphicsUnit]::Pixel)
            }

            $measured = $Graphics.MeasureString($Text, $candidate, [System.Drawing.SizeF]::new($safeRect.Width, 5000), $format)
            if ($measured.Width -le ($safeRect.Width + 2) -and $measured.Height -le ($safeRect.Height + 2)) {
                if ($candidate -ne $Font) { $createdFont = $candidate }
                $drawFont = $candidate
                break
            }

            if ($candidate -ne $Font) { $candidate.Dispose() }
        }

        if ($drawFont -eq $Font -and $Font.Size -gt $minSize) {
            $createdFont = [System.Drawing.Font]::new($Font.FontFamily, $minSize, $Font.Style, [System.Drawing.GraphicsUnit]::Pixel)
            $drawFont = $createdFont
        }

        $drawRect = [System.Drawing.RectangleF]::new(
            $safeRect.X,
            [float]($safeRect.Y + 2),
            $safeRect.Width,
            [float][Math]::Max(12, $safeRect.Height - 4)
        )

        $Graphics.DrawString($Text, $drawFont, $Brush, $drawRect, $format)
    } finally {
        if ($null -ne $createdFont) {
            $createdFont.Dispose()
        }
        $format.Dispose()
    }
}

function Draw-Pill {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.Font]$Font,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height
    )

    $fill = [System.Drawing.SolidBrush]::new((New-Color 62 13 14 18))
    $pen = [System.Drawing.Pen]::new((New-Color 220 212 175 55), 1.6)
    $textBrush = [System.Drawing.SolidBrush]::new((New-Color 245 247 230 194))
    try {
        $Graphics.FillRectangle($fill, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($pen, $X, $Y, $Width, $Height)
        Draw-CenterText -Graphics $Graphics -Text $Text -Font $Font -Brush $textBrush -X ($X + 10) -Y ($Y + 4) -Width ($Width - 20) -Height ($Height - 10)
    } finally {
        $fill.Dispose()
        $pen.Dispose()
        $textBrush.Dispose()
    }
}

function Draw-StatCard {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height,
        [string]$Title,
        [string]$Body,
        [System.Drawing.Font]$TitleFont,
        [System.Drawing.Font]$BodyFont,
        [System.Drawing.Brush]$GoldBrush,
        [System.Drawing.Brush]$BodyBrush
    )

    $cardBrush = [System.Drawing.SolidBrush]::new((New-Color 82 4 5 8))
    $cardPen = [System.Drawing.Pen]::new((New-Color 160 212 175 55), 1.4)
    try {
        $Graphics.FillRectangle($cardBrush, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($cardPen, $X, $Y, $Width, $Height)
        Draw-CenterText -Graphics $Graphics -Text $Title -Font $TitleFont -Brush $GoldBrush -X ($X + 12) -Y ($Y + 28) -Width ($Width - 24) -Height 92
        Draw-CenterText -Graphics $Graphics -Text $Body -Font $BodyFont -Brush $BodyBrush -X ($X + 18) -Y ($Y + 122) -Width ($Width - 36) -Height ($Height - 138)
    } finally {
        $cardBrush.Dispose()
        $cardPen.Dispose()
    }
}

function Draw-RadarChart {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$CenterX,
        [float]$CenterY,
        [float]$Radius,
        [int[]]$Values,
        [string[]]$Labels,
        [System.Drawing.Font]$LabelFont,
        [System.Drawing.Font]$ValueFont
    )

    $count = $Values.Length
    $gridPen = [System.Drawing.Pen]::new((New-Color 105 255 245 220), 1.2)
    $axisPen = [System.Drawing.Pen]::new((New-Color 85 212 175 55), 1.1)
    $polyPen = [System.Drawing.Pen]::new((New-Color 245 244 216 118), 3.2)
    $polyBrush = [System.Drawing.SolidBrush]::new((New-Color 92 212 175 55))
    $labelBrush = [System.Drawing.SolidBrush]::new((New-Color 230 242 238 232))
    $dotBrush = [System.Drawing.SolidBrush]::new((New-Color 255 253 242 191))
    $valueBrush = [System.Drawing.SolidBrush]::new((New-Color 255 255 255 255))

    try {
        for ($ring = 1; $ring -le 5; $ring++) {
            $ringRadius = $Radius * ($ring / 5.0)
            $points = [System.Drawing.PointF[]]::new($count)
            for ($i = 0; $i -lt $count; $i++) {
                $angle = (-90 + ($i * (360 / $count))) * [Math]::PI / 180
                $points[$i] = [System.Drawing.PointF]::new(
                    [float]($CenterX + [Math]::Cos($angle) * $ringRadius),
                    [float]($CenterY + [Math]::Sin($angle) * $ringRadius)
                )
            }
            $Graphics.DrawPolygon($gridPen, $points)
        }

        $shapePoints = [System.Drawing.PointF[]]::new($count)
        for ($i = 0; $i -lt $count; $i++) {
            $angle = (-90 + ($i * (360 / $count))) * [Math]::PI / 180
            $outerX = [float]($CenterX + [Math]::Cos($angle) * $Radius)
            $outerY = [float]($CenterY + [Math]::Sin($angle) * $Radius)
            $Graphics.DrawLine($axisPen, $CenterX, $CenterY, $outerX, $outerY)

            $shapeRadius = $Radius * ($Values[$i] / 10.0)
            $shapeX = [float]($CenterX + [Math]::Cos($angle) * $shapeRadius)
            $shapeY = [float]($CenterY + [Math]::Sin($angle) * $shapeRadius)
            $shapePoints[$i] = [System.Drawing.PointF]::new($shapeX, $shapeY)
            $Graphics.FillEllipse($dotBrush, $shapeX - 5.5, $shapeY - 5.5, 11, 11)

            $labelRadius = $Radius + 84
            $labelX = [float]($CenterX + [Math]::Cos($angle) * $labelRadius - 80)
            $labelY = [float]($CenterY + [Math]::Sin($angle) * $labelRadius - 18)
            if ($i -eq 0) { $labelY += 16 }
            Draw-CenterText -Graphics $Graphics -Text $Labels[$i] -Font $LabelFont -Brush $labelBrush -X $labelX -Y $labelY -Width 160 -Height 36

            $valueX = [float]($CenterX + [Math]::Cos($angle) * ($shapeRadius + 32) - 18)
            $valueY = [float]($CenterY + [Math]::Sin($angle) * ($shapeRadius + 32) - 18)
            Draw-CenterText -Graphics $Graphics -Text ([string]$Values[$i]) -Font $ValueFont -Brush $valueBrush -X $valueX -Y $valueY -Width 36 -Height 36
        }

        $Graphics.FillPolygon($polyBrush, $shapePoints)
        $Graphics.DrawPolygon($polyPen, $shapePoints)
    } finally {
        $gridPen.Dispose()
        $axisPen.Dispose()
        $polyPen.Dispose()
        $polyBrush.Dispose()
        $labelBrush.Dispose()
        $dotBrush.Dispose()
        $valueBrush.Dispose()
    }
}

function Save-Slide {
    param(
        [System.Drawing.Bitmap]$Bitmap,
        [System.Drawing.Graphics]$Graphics,
        [string]$Path
    )

    try {
        $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $Graphics.Dispose()
        $Bitmap.Dispose()
    }
}

function New-BodyPanel {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height
    )

    $brush = [System.Drawing.SolidBrush]::new((New-Color 78 5 7 10))
    $pen = [System.Drawing.Pen]::new((New-Color 132 212 175 55), 1.2)
    try {
        $Graphics.FillRectangle($brush, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($pen, $X, $Y, $Width, $Height)
    } finally {
        $brush.Dispose()
        $pen.Dispose()
    }
}

function Draw-EditorialTextPanel {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height
    )

    New-BodyPanel -Graphics $Graphics -X $X -Y $Y -Width $Width -Height $Height
    Draw-InnerContour -Graphics $Graphics -X ($X + 12) -Y ($Y + 12) -Width ($Width - 24) -Height ($Height - 24)
}

$root = Split-Path -Parent $OutputDir
if (-not (Test-Path $root)) {
    New-Item -ItemType Directory -Path $root -Force | Out-Null
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$width = 1080
$height = 1350

$logoPath = "C:\Users\Afonso\Downloads\GOL1.006\public\logo-diamond.png"
$bgObsidian = "C:\Users\Afonso\Downloads\GOL1.006\marketing\background\blackback.jpg"
$bgRubi = "C:\Users\Afonso\Downloads\GOL1.006\marketing\background\rubiback.jpg"
$bgSapphire = "C:\Users\Afonso\Downloads\GOL1.006\marketing\background\darkblueback.jpg"
$round6MestriaRoot = "C:\Users\Afonso\Downloads\GOL1.006\marketing\round6\mestria"
$round6FallbackRoot = "C:\Users\Afonso\Downloads\GOL1.006\marketing\round6"
$round6MestriaSourceRoot = if ((Get-ChildItem -LiteralPath $round6MestriaRoot -File -ErrorAction SilentlyContinue | Measure-Object).Count -ge 3) {
    $round6MestriaRoot
} else {
    $round6FallbackRoot
}

$round6MestriaAssets = @(Get-ChildItem -LiteralPath $round6MestriaSourceRoot -File -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Extension -match '^\.(png|jpg|jpeg|webp)$' -and (
            $round6MestriaSourceRoot -eq $round6MestriaRoot -or
            $_.Name -like 'image-removebg*' -or
            $_.Extension -match '^\.(png|webp)$'
        )
    } |
    ForEach-Object {
        $image = [System.Drawing.Image]::FromFile($_.FullName)
        try {
            $visible = Get-VisibleImageBounds -Image $image
            [PSCustomObject]@{
                Path = $_.FullName
                Width = $visible.Width
                Height = $visible.Height
                VerticalScore = [double]$visible.Height / [Math]::Max(1, $visible.Width)
                SquareDistance = [Math]::Abs(1.0 - ([double]$visible.Width / [Math]::Max(1, $visible.Height)))
            }
        } finally {
            $image.Dispose()
        }
    })

if ($round6MestriaAssets.Count -lt 3) {
    throw "Mestria 06 precisa de 3 imagens em marketing\\round6\\mestria ou marketing\\round6."
}

$slide3Asset = $round6MestriaAssets | Sort-Object SquareDistance | Select-Object -First 1
$coverAssets = $round6MestriaAssets | Where-Object { $_.Path -ne $slide3Asset.Path } | Sort-Object VerticalScore -Descending | Select-Object -First 2
$cr7CoverPath = $coverAssets[0].Path
$cr7PanelPath = $coverAssets[1].Path
$cr7Slide3Path = $slide3Asset.Path

$headlineFamily = Get-FontFamily -Candidates @("Cormorant Garamond", "Garamond", "Book Antiqua", "Palatino Linotype", "Georgia", "Times New Roman")
$bodyFamily = Get-FontFamily -Candidates @("Book Antiqua", "Palatino Linotype", "Georgia", "Cambria", "Times New Roman")

$eyebrowFont = [System.Drawing.Font]::new($bodyFamily, 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleHugeFont = [System.Drawing.Font]::new($headlineFamily, 68, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 58, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titlePanelFont = [System.Drawing.Font]::new($headlineFamily, 50, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 44, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleCardFont = [System.Drawing.Font]::new($headlineFamily, 38, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$bodyFont = [System.Drawing.Font]::new($bodyFamily, 35, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodyBoldFont = [System.Drawing.Font]::new($bodyFamily, 25, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$ctaFont = [System.Drawing.Font]::new($headlineFamily, 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$monoTitleFont = [System.Drawing.Font]::new($headlineFamily, 150, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$curadoriaWatermarkFont = [System.Drawing.Font]::new($headlineFamily, 68, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$radarLabelFont = [System.Drawing.Font]::new($bodyFamily, 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$radarValueFont = [System.Drawing.Font]::new($bodyFamily, 16, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$whiteBrush = [System.Drawing.SolidBrush]::new((New-Color 238 245 242 237))
$offWhiteBrush = [System.Drawing.SolidBrush]::new((New-Color 215 236 233 227))
$mutedBrush = [System.Drawing.SolidBrush]::new((New-Color 180 210 206 199))
$eyebrowBrush = [System.Drawing.SolidBrush]::new((New-Color 165 255 236 196))
$goldTextBrush = [System.Drawing.SolidBrush]::new((New-Color 255 244 216 118))
$goldSoftBrush = [System.Drawing.SolidBrush]::new((New-Color 220 234 206 110))
$ghostBrush = [System.Drawing.SolidBrush]::new((New-Color 28 255 255 255))
$curadoriaWatermarkBrush = [System.Drawing.SolidBrush]::new((New-Color 18 244 216 118))

$goldBrushSlide = Get-GoldBrush -Width $width -Height $height

$created = New-Object System.Collections.Generic.List[string]

$Aacute = [char]0x00C1
$Atilde = [char]0x00C3
$Ccedilla = [char]0x00C7
$Eacute = [char]0x00C9
$Ecirc = [char]0x00CA
$Iacute = [char]0x00CD
$Oacute = [char]0x00D3
$Otilde = [char]0x00D5
$aacute = [char]0x00E1
$acirc = [char]0x00E2
$agrave = [char]0x00E0
$atilde = [char]0x00E3
$ccedilla = [char]0x00E7
$eacute = [char]0x00E9
$ecirc = [char]0x00EA
$iacute = [char]0x00ED
$oacute = [char]0x00F3
$otilde = [char]0x00F5

# Boxes editoriais padronizados para Mestria.
$curadoriaPortraitFrameWidth = 214
$curadoriaPortraitFrameHeight = 620
$curadoriaEditorialPanelWidth = 432
$curadoriaEditorialPanelHeight = 404

# Slide 1
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgRubi -Width $width -Height $height -Tone "rubi"
$slide1FrameHeight = 612
$slide1FrameWidth = Get-FeatureFrameWidth -ImagePath $cr7CoverPath -FrameHeight $slide1FrameHeight -InnerHorizontalPadding 26 -InnerVerticalPadding 18 -MinWidth 240 -MaxWidth 320
$slide1FrameBottom = 980
$slide1FrameX = [float](948 - $slide1FrameWidth)
$slide1FrameY = [float]($slide1FrameBottom - $slide1FrameHeight)
Draw-CenterText -Graphics $graphics -Text "Ayrton Senna" -Font $curadoriaWatermarkFont -Brush $curadoriaWatermarkBrush -X 92 -Y 128 -Width 896 -Height 120
Draw-FeatureFrame -Graphics $graphics -X $slide1FrameX -Y $slide1FrameY -Width $slide1FrameWidth -Height $slide1FrameHeight -ImagePath $cr7CoverPath -Opacity 1.0 -ContentPaddingX 10 -ContentPaddingTop 16 -ContentPaddingBottom 16 -AccentWidth 10
Draw-CenterText -Graphics $graphics -Text "Como o Glyph`nleria Ayrton`nSenna?" -Font $titleHugeFont -Brush $goldBrushSlide -X 94 -Y 392 -Width 592 -Height 448
Draw-Pill -Graphics $graphics -Text "N${Iacute}vel de maestria 89" -Font $bodyBoldFont -X 186 -Y 860 -Width 392 -Height 56
Draw-CenterText -Graphics $graphics -Text "N${Atilde}o era s${oacute} velocidade.`nEra presen${ccedilla}a, prop${oacute}sito e press${atilde}o limpa." -Font $titleMediumFont -Brush $offWhiteBrush -X 94 -Y 980 -Width 642 -Height 142
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide1 = Join-Path $OutputDir "slide-01-capa.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide1
$created.Add($slide1)

# Slide 2
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgRubi -Width $width -Height $height -Tone "rubi"
Draw-CenterText -Graphics $graphics -Text "Ayrton Senna" -Font $curadoriaWatermarkFont -Brush $curadoriaWatermarkBrush -X 90 -Y 128 -Width 900 -Height 120
$slide2PanelX = 118
$slide2PanelY = 334
$slide2PanelWidth = 548
$slide2PanelHeight = 534
$slide2FrameY = 284
$slide2FrameHeight = 660
$slide2FrameWidth = Get-FeatureFrameWidth -ImagePath $cr7PanelPath -FrameHeight $slide2FrameHeight -InnerHorizontalPadding 42 -InnerVerticalPadding 18 -MinWidth 240 -MaxWidth 286
$slide2FrameX = [float](958 - $slide2FrameWidth)
Draw-EditorialTextPanel -Graphics $graphics -X $slide2PanelX -Y $slide2PanelY -Width $slide2PanelWidth -Height $slide2PanelHeight
Draw-CenterText -Graphics $graphics -Text "Ele n${Atilde}o guiava`ns${oacute} com t${eacute}cnica." -Font $titleMediumFont -Brush $goldBrushSlide -X ($slide2PanelX + 24) -Y ($slide2PanelY + 28) -Width ($slide2PanelWidth - 48) -Height 128
Draw-CenterText -Graphics $graphics -Text "Corria com presen${ccedilla}a, leitura de risco`ne uma intensidade moral rara.`nA press${atilde}o n${atilde}o quebrava seu eixo." -Font $bodyFont -Brush $offWhiteBrush -X ($slide2PanelX + 26) -Y ($slide2PanelY + 176) -Width ($slide2PanelWidth - 52) -Height 194
Draw-CenterText -Graphics $graphics -Text "Competi${ccedilla}${atilde}o virou devo${ccedilla}${atilde}o.`nPress${atilde}o virou nitidez." -Font $titleMediumFont -Brush $whiteBrush -X ($slide2PanelX + 28) -Y ($slide2PanelY + 404) -Width ($slide2PanelWidth - 56) -Height 110
Draw-FeatureFrame -Graphics $graphics -X $slide2FrameX -Y $slide2FrameY -Width $slide2FrameWidth -Height $slide2FrameHeight -ImagePath $cr7PanelPath -Opacity 0.98 -ContentPaddingX 14 -ContentPaddingTop 12 -ContentPaddingBottom 10
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide2 = Join-Path $OutputDir "slide-02-quem-e.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide2
$created.Add($slide2)

# Slide 3
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgRubi -Width $width -Height $height -Tone "rubi"
Draw-CenterText -Graphics $graphics -Text "Ayrton Senna" -Font $curadoriaWatermarkFont -Brush $curadoriaWatermarkBrush -X 92 -Y 128 -Width 896 -Height 120
Draw-CenterText -Graphics $graphics -Text "Radar de um`ncompetidor raro." -Font $titleLargeFont -Brush $goldBrushSlide -X 120 -Y 232 -Width 626 -Height 176
Draw-ClippedImageBox -Graphics $graphics -ImagePath $cr7Slide3Path -X 738 -Y 184 -Width 214 -Height 254 -Opacity 0.98 -AlignBottom
Draw-StatCard -Graphics $graphics -X 118 -Y 468 -Width 260 -Height 420 -Title "Espa${ccedilla}o mental`n10" -Body "Clareza brutal`nem alta press${atilde}o." -TitleFont $titleCardFont -BodyFont $bodyFont -GoldBrush $goldBrushSlide -BodyBrush $offWhiteBrush
Draw-StatCard -Graphics $graphics -X 410 -Y 468 -Width 260 -Height 420 -Title "Prop${oacute}sito`n10" -Body "Correr tamb${eacute}m era`nexpress${atilde}o de f${eacute}`ne dever interno." -TitleFont $titleCardFont -BodyFont $bodyFont -GoldBrush $goldBrushSlide -BodyBrush $offWhiteBrush
Draw-StatCard -Graphics $graphics -X 702 -Y 468 -Width 260 -Height 420 -Title "F${iacute}sico`n10" -Body "Refino corporal`npara competir no`nlimite da tens${atilde}o." -TitleFont $titleCardFont -BodyFont $bodyFont -GoldBrush $goldBrushSlide -BodyBrush $offWhiteBrush
Draw-CenterText -Graphics $graphics -Text "Espa${ccedilla}o mental, Prop${oacute}sito e F${iacute}sico.`nVelocidade era s${oacute} a superf${iacute}cie." -Font $bodyFont -Brush $mutedBrush -X 150 -Y 964 -Width 780 -Height 104
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide3 = Join-Path $OutputDir "slide-03-ativos.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide3
$created.Add($slide3)

# Slide 4
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgRubi -Width $width -Height $height -Tone "rubi"
New-BodyPanel -Graphics $graphics -X 126 -Y 326 -Width 828 -Height 792
Draw-InnerContour -Graphics $graphics -X 146 -Y 346 -Width 788 -Height 752
Draw-CenterText -Graphics $graphics -Text "N${Iacute}vel de maestria" -Font $titleMediumFont -Brush $goldBrushSlide -X 200 -Y 128 -Width 680 -Height 60
Draw-CenterText -Graphics $graphics -Text "89" -Font $monoTitleFont -Brush $whiteBrush -X 350 -Y 174 -Width 380 -Height 180
$labels = @(
    "Consci${ecirc}ncia",
    "Espa${ccedilla}o mental",
    "ESPIRITUAL",
    "Prop${oacute}sito",
    "Projetos",
    "Conex${otilde}es",
    "Finan${ccedilla}as",
    "Trabalho",
    "Hobbies",
    "F${iacute}sico"
)
$values = @(9,10,10,10,8,8,8,9,7,10)
Draw-RadarChart -Graphics $graphics -CenterX 540 -CenterY 678 -Radius 250 -Values $values -Labels $labels -LabelFont $radarLabelFont -ValueFont $radarValueFont
Draw-CenterText -Graphics $graphics -Text "Mestria" -Font $curadoriaWatermarkFont -Brush $curadoriaWatermarkBrush -X 92 -Y 920 -Width 896 -Height 92
Draw-CenterText -Graphics $graphics -Text "A precis${atilde}o de Senna vinha de dentro.`nVelocidade era s${oacute} a superf${iacute}cie." -Font $bodySmallFont -Brush $offWhiteBrush -X 170 -Y 1012 -Width 740 -Height 96
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide4 = Join-Path $OutputDir "slide-04-radar.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide4
$created.Add($slide4)

# Slide 5
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgRubi -Width $width -Height $height -Tone "rubi"
$watermarkFont = [System.Drawing.Font]::new($headlineFamily, 118, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$watermarkBrush = [System.Drawing.SolidBrush]::new((New-Color 16 244 216 118))
$strongBorderPen = [System.Drawing.Pen]::new((New-Color 255 242 210 110), 3.6)
$strongInnerPen = [System.Drawing.Pen]::new((New-Color 166 255 236 196), 1.2)
try {
    $graphics.DrawRectangle($strongBorderPen, 82, 82, 916, 1186)
    $graphics.DrawRectangle($strongInnerPen, 96, 96, 888, 1158)
    Draw-CenterText -Graphics $graphics -Text "Mestria" -Font $watermarkFont -Brush $watermarkBrush -X 70 -Y 454 -Width 940 -Height 150
} finally {
    $watermarkFont.Dispose()
    $watermarkBrush.Dispose()
    $strongBorderPen.Dispose()
    $strongInnerPen.Dispose()
}
$logo = [System.Drawing.Image]::FromFile($logoPath)
try {
    $graphics.DrawImage($logo, 296, 220, 488, 488)
} finally {
    $logo.Dispose()
}
Draw-CenterText -Graphics $graphics -Text "GLYPH" -Font ([System.Drawing.Font]::new($headlineFamily, 86, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $goldBrushSlide -X 170 -Y 770 -Width 740 -Height 94
Draw-CenterText -Graphics $graphics -Text "Organize seu imp${eacute}rio." -Font $titleMediumFont -Brush $whiteBrush -X 180 -Y 868 -Width 720 -Height 68
Draw-Pill -Graphics $graphics -Text "glyph.life" -Font $bodyBoldFont -X 386 -Y 972 -Width 308 -Height 54
Draw-CenterText -Graphics $graphics -Text "Mestria 06  |  Ayrton Senna" -Font $eyebrowFont -Brush $eyebrowBrush -X 186 -Y 1060 -Width 708 -Height 28
$slide5 = Join-Path $OutputDir "slide-05-fecho.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide5
$created.Add($slide5)

# Contact sheet
$contact = New-Canvas -Width 1600 -Height 2200
$contactBitmap = $contact.Bitmap
$contactGraphics = $contact.Graphics
$contactGraphics.Clear((New-Color 255 8 8 10))
$sheetBrush = [System.Drawing.SolidBrush]::new((New-Color 255 240 236 226))
$sheetGold = Get-GoldBrush -Width 1600 -Height 2200
Draw-CenterText -Graphics $contactGraphics -Text "MESTRIA 06  |  AYRTON SENNA" -Font ([System.Drawing.Font]::new($headlineFamily, 46, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $sheetGold -X 180 -Y 42 -Width 1240 -Height 60
Draw-CenterText -Graphics $contactGraphics -Text "Prancha de revis${atilde}o - 5 slides prontos" -Font ([System.Drawing.Font]::new($bodyFamily, 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $sheetBrush -X 300 -Y 108 -Width 1000 -Height 32

$thumbWidth = 560
$thumbHeight = 700
$positions = @(
    @{ X = 110; Y = 180 },
    @{ X = 930; Y = 180 },
    @{ X = 110; Y = 940 },
    @{ X = 930; Y = 940 },
    @{ X = 520; Y = 1700 }
)

for ($i = 0; $i -lt $created.Count; $i++) {
    $thumb = [System.Drawing.Image]::FromFile($created[$i])
    try {
        $x = [int]$positions[$i].X
        $y = [int]$positions[$i].Y
        $contactGraphics.DrawImage($thumb, $x, $y, $thumbWidth, $thumbHeight)
        $pen = [System.Drawing.Pen]::new((New-Color 180 212 175 55), 2)
        $contactGraphics.DrawRectangle($pen, $x, $y, $thumbWidth, $thumbHeight)
        $pen.Dispose()
    } finally {
        $thumb.Dispose()
    }
}

$contactPath = Join-Path $OutputDir "contact-sheet.png"
Save-Slide -Bitmap $contactBitmap -Graphics $contactGraphics -Path $contactPath
$created.Add($contactPath)

$eyebrowFont.Dispose()
$titleHugeFont.Dispose()
$titleLargeFont.Dispose()
$titlePanelFont.Dispose()
$titleMediumFont.Dispose()
$titleCardFont.Dispose()
$bodyFont.Dispose()
$bodySmallFont.Dispose()
$bodyBoldFont.Dispose()
$ctaFont.Dispose()
$monoTitleFont.Dispose()
$curadoriaWatermarkFont.Dispose()
$radarLabelFont.Dispose()
$radarValueFont.Dispose()
$whiteBrush.Dispose()
$offWhiteBrush.Dispose()
$mutedBrush.Dispose()
$eyebrowBrush.Dispose()
$goldTextBrush.Dispose()
$goldSoftBrush.Dispose()
$ghostBrush.Dispose()
$curadoriaWatermarkBrush.Dispose()
$goldBrushSlide.Dispose()
$sheetBrush.Dispose()
$sheetGold.Dispose()

foreach ($file in $created) {
    Write-Output "CREATED=$file"
}































