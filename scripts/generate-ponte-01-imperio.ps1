param(
    [string]$OutputDir = "C:\Users\Afonso\Downloads\GOL1.006\marketing\ponte-01-imperio\slides",
    [string]$BackgroundPath = "C:\Users\Afonso\Downloads\GOL1.006\marketing\round0\1.jpg",
    [string]$PlaquePath = "C:\Users\Afonso\Downloads\GOL1.006\marketing\round0\placa.jpg",
    [string]$PrintPath = "C:\Users\Afonso\Downloads\GOL1.006\marketing\round11\arenas2.jpeg",
    [string]$Word = "",
    [string]$Definition = "",
    [string]$SheetTitle = "",
    [ValidateSet("Default","Abertura","Jade","Wine","Red","Petrol","Ivory","Velvet")]
    [string]$PlaqueTone = "Default",
    [switch]$BrightBackground,
    [switch]$NoSlide2Darkening
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
    return [System.Drawing.FontFamily]::GenericSerif
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

function Draw-CenterText {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.Font]$Font,
        [System.Drawing.Brush]$Brush,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$MinScale = 0.58
    )

    $format = [System.Drawing.StringFormat]::new()
    $createdFont = $null
    try {
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        $format.Trimming = [System.Drawing.StringTrimming]::None
        $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoClip

        $paddingX = [float][Math]::Max(12, [Math]::Ceiling($Font.Size * 0.12))
        $paddingY = [float][Math]::Max(12, [Math]::Ceiling($Font.Size * 0.18))
        $safeRect = [System.Drawing.RectangleF]::new(
            [float]($X + $paddingX),
            [float]($Y + $paddingY),
            [float][Math]::Max(12, $Width - ($paddingX * 2)),
            [float][Math]::Max(12, $Height - ($paddingY * 2))
        )

        $drawFont = $Font
        $fontFound = $false
        $minSize = [float][Math]::Max(18, [Math]::Floor($Font.Size * $MinScale))

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

        if (-not $fontFound -and $drawFont -eq $Font -and $Font.Size -gt 18) {
            $createdFont = [System.Drawing.Font]::new($Font.FontFamily, $minSize, $Font.Style, [System.Drawing.GraphicsUnit]::Pixel)
            $drawFont = $createdFont
        }

        $Graphics.DrawString($Text, $drawFont, $Brush, $safeRect, $format)
    } finally {
        if ($null -ne $createdFont) { $createdFont.Dispose() }
        $format.Dispose()
    }
}

function Draw-CenterTextWithShadow {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.Font]$Font,
        [System.Drawing.Brush]$Brush,
        [System.Drawing.Brush]$ShadowBrush,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$ShadowOffset = 4,
        [float]$MinScale = 0.58
    )

    Draw-CenterText -Graphics $Graphics -Text $Text -Font $Font -Brush $ShadowBrush -X ($X + $ShadowOffset) -Y ($Y + $ShadowOffset) -Width $Width -Height $Height -MinScale $MinScale
    Draw-CenterText -Graphics $Graphics -Text $Text -Font $Font -Brush $Brush -X $X -Y $Y -Width $Width -Height $Height -MinScale $MinScale
}

function Draw-SingleLineFitText {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.Font]$Font,
        [System.Drawing.Brush]$Brush,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$MinScale = 0.5
    )

    $format = [System.Drawing.StringFormat]::new()
    $createdFont = $null
    try {
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        $format.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter
        $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap

        $paddingX = [float][Math]::Max(12, [Math]::Ceiling($Font.Size * 0.12))
        $paddingY = [float][Math]::Max(8, [Math]::Ceiling($Font.Size * 0.08))
        $safeRect = [System.Drawing.RectangleF]::new(
            [float]($X + $paddingX),
            [float]($Y + $paddingY),
            [float][Math]::Max(12, $Width - ($paddingX * 2)),
            [float][Math]::Max(12, $Height - ($paddingY * 2))
        )

        $drawFont = $Font
        $fontFound = $false
        $minSize = [float][Math]::Max(18, [Math]::Floor($Font.Size * $MinScale))

        for ($size = [float]$Font.Size; $size -ge $minSize; $size -= 1.0) {
            if ([Math]::Abs($size - $Font.Size) -lt 0.05) {
                $candidate = $Font
            } else {
                $candidate = [System.Drawing.Font]::new($Font.FontFamily, $size, $Font.Style, [System.Drawing.GraphicsUnit]::Pixel)
            }

            $measured = $Graphics.MeasureString($Text, $candidate, [System.Drawing.SizeF]::new(5000, $safeRect.Height), $format)
            if ($measured.Width -le ($safeRect.Width + 1) -and $measured.Height -le ($safeRect.Height + 1)) {
                if ($candidate -ne $Font) { $createdFont = $candidate }
                $drawFont = $candidate
                $fontFound = $true
                break
            }

            if ($candidate -ne $Font) { $candidate.Dispose() }
        }

        if (-not $fontFound -and $drawFont -eq $Font -and $Font.Size -gt 18) {
            $createdFont = [System.Drawing.Font]::new($Font.FontFamily, $minSize, $Font.Style, [System.Drawing.GraphicsUnit]::Pixel)
            $drawFont = $createdFont
        }

        $Graphics.DrawString($Text, $drawFont, $Brush, $safeRect, $format)
    } finally {
        if ($null -ne $createdFont) { $createdFont.Dispose() }
        $format.Dispose()
    }
}

function Draw-ImageCoverRect {
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

function Draw-ImageContainRect {
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
        $scale = [Math]::Min($Width / $image.Width, $Height / $image.Height)
        $drawWidth = [float]($image.Width * $scale)
        $drawHeight = [float]($image.Height * $scale)
        $drawX = [float]($X + (($Width - $drawWidth) / 2))
        $drawY = [float]($Y + (($Height - $drawHeight) / 2))
        $Graphics.DrawImage($image, $drawX, $drawY, $drawWidth, $drawHeight)
    } finally {
        $image.Dispose()
    }
}

function Apply-PlaqueTone {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [string]$Tone
    )

    if ($Tone -eq "Default") { return }

    $rect = [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height)
    $brush = $null
    try {
        switch ($Tone) {
            "Abertura" {
                $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    $rect,
                    (New-Color 118 42 22 62),
                    (New-Color 134 70 29 94),
                    90
                )
                $blend = [System.Drawing.Drawing2D.ColorBlend]::new()
                $blend.Colors = [System.Drawing.Color[]]@(
                    (New-Color 98 28 13 43),
                    (New-Color 122 56 21 77),
                    (New-Color 112 88 34 116),
                    (New-Color 120 52 18 72),
                    (New-Color 98 26 11 39)
                )
                $blend.Positions = [single[]](0.0, 0.24, 0.5, 0.76, 1.0)
                $brush.InterpolationColors = $blend
                $Graphics.FillRectangle($brush, $rect)

                $highlight = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height * 0.6),
                    (New-Color 24 238 224 196),
                    (New-Color 0 238 224 196),
                    90
                )
                try {
                    $Graphics.FillRectangle($highlight, $X, $Y, $Width, $Height * 0.62)
                } finally {
                    $highlight.Dispose()
                }
            }
            "Jade" {
                $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    $rect,
                    (New-Color 116 14 62 56),
                    (New-Color 132 24 92 82),
                    90
                )
                $blend = [System.Drawing.Drawing2D.ColorBlend]::new()
                $blend.Colors = [System.Drawing.Color[]]@(
                    (New-Color 98 8 42 39),
                    (New-Color 122 17 72 64),
                    (New-Color 108 29 105 94),
                    (New-Color 120 18 77 69),
                    (New-Color 96 8 39 36)
                )
                $blend.Positions = [single[]](0.0, 0.24, 0.5, 0.76, 1.0)
                $brush.InterpolationColors = $blend
                $Graphics.FillRectangle($brush, $rect)

                $highlight = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height * 0.6),
                    (New-Color 24 209 233 221),
                    (New-Color 0 209 233 221),
                    90
                )
                try {
                    $Graphics.FillRectangle($highlight, $X, $Y, $Width, $Height * 0.62)
                } finally {
                    $highlight.Dispose()
                }
            }
            "Wine" {
                $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    $rect,
                    (New-Color 116 78 18 32),
                    (New-Color 132 108 26 44),
                    90
                )
                $blend = [System.Drawing.Drawing2D.ColorBlend]::new()
                $blend.Colors = [System.Drawing.Color[]]@(
                    (New-Color 102 58 13 25),
                    (New-Color 124 92 22 38),
                    (New-Color 110 126 34 52),
                    (New-Color 122 88 20 37),
                    (New-Color 98 54 12 24)
                )
                $blend.Positions = [single[]](0.0, 0.24, 0.5, 0.76, 1.0)
                $brush.InterpolationColors = $blend
                $Graphics.FillRectangle($brush, $rect)

                $highlight = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height * 0.6),
                    (New-Color 22 242 213 185),
                    (New-Color 0 242 213 185),
                    90
                )
                try {
                    $Graphics.FillRectangle($highlight, $X, $Y, $Width, $Height * 0.62)
                } finally {
                    $highlight.Dispose()
                }
            }
            "Red" {
                $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    $rect,
                    (New-Color 116 78 18 32),
                    (New-Color 132 108 26 44),
                    90
                )
                $blend = [System.Drawing.Drawing2D.ColorBlend]::new()
                $blend.Colors = [System.Drawing.Color[]]@(
                    (New-Color 102 58 13 25),
                    (New-Color 124 92 22 38),
                    (New-Color 110 126 34 52),
                    (New-Color 122 88 20 37),
                    (New-Color 98 54 12 24)
                )
                $blend.Positions = [single[]](0.0, 0.24, 0.5, 0.76, 1.0)
                $brush.InterpolationColors = $blend
                $Graphics.FillRectangle($brush, $rect)

                $highlight = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height * 0.6),
                    (New-Color 22 242 213 185),
                    (New-Color 0 242 213 185),
                    90
                )
                try {
                    $Graphics.FillRectangle($highlight, $X, $Y, $Width, $Height * 0.62)
                } finally {
                    $highlight.Dispose()
                }
            }
            "Petrol" {
                $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    $rect,
                    (New-Color 116 11 52 62),
                    (New-Color 132 19 74 87),
                    90
                )
                $blend = [System.Drawing.Drawing2D.ColorBlend]::new()
                $blend.Colors = [System.Drawing.Color[]]@(
                    (New-Color 102 8 36 44),
                    (New-Color 126 14 60 72),
                    (New-Color 112 24 88 103),
                    (New-Color 124 13 58 70),
                    (New-Color 98 7 32 39)
                )
                $blend.Positions = [single[]](0.0, 0.24, 0.5, 0.76, 1.0)
                $brush.InterpolationColors = $blend
                $Graphics.FillRectangle($brush, $rect)

                $highlight = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height * 0.6),
                    (New-Color 22 209 233 221),
                    (New-Color 0 209 233 221),
                    90
                )
                try {
                    $Graphics.FillRectangle($highlight, $X, $Y, $Width, $Height * 0.62)
                } finally {
                    $highlight.Dispose()
                }
            }
            "Ivory" {
                $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    $rect,
                    (New-Color 150 220 219 214),
                    (New-Color 164 190 188 182),
                    90
                )
                $blend = [System.Drawing.Drawing2D.ColorBlend]::new()
                $blend.Colors = [System.Drawing.Color[]]@(
                    (New-Color 150 186 184 178),
                    (New-Color 162 226 224 218),
                    (New-Color 154 244 242 236),
                    (New-Color 160 214 212 206),
                    (New-Color 148 178 176 170)
                )
                $blend.Positions = [single[]](0.0, 0.24, 0.5, 0.76, 1.0)
                $brush.InterpolationColors = $blend
                $Graphics.FillRectangle($brush, $rect)

                $highlight = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height * 0.6),
                    (New-Color 20 255 255 255),
                    (New-Color 0 255 255 255),
                    90
                )
                try {
                    $Graphics.FillRectangle($highlight, $X, $Y, $Width, $Height * 0.62)
                } finally {
                    $highlight.Dispose()
                }
            }
            "Velvet" {
                $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    $rect,
                    (New-Color 132 22 34 72),
                    (New-Color 146 34 52 104),
                    90
                )
                $blend = [System.Drawing.Drawing2D.ColorBlend]::new()
                $blend.Colors = [System.Drawing.Color[]]@(
                    (New-Color 108 14 24 58),
                    (New-Color 128 28 43 86),
                    (New-Color 118 49 70 132),
                    (New-Color 130 26 39 82),
                    (New-Color 104 12 22 52)
                )
                $blend.Positions = [single[]](0.0, 0.24, 0.5, 0.76, 1.0)
                $brush.InterpolationColors = $blend
                $Graphics.FillRectangle($brush, $rect)

                $highlight = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                    [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height * 0.6),
                    (New-Color 22 198 218 255),
                    (New-Color 0 198 218 255),
                    90
                )
                try {
                    $Graphics.FillRectangle($highlight, $X, $Y, $Width, $Height * 0.62)
                } finally {
                    $highlight.Dispose()
                }
            }
        }
    } finally {
        if ($null -ne $brush) { $brush.Dispose() }
    }
}

function Draw-SoftShadow {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height
    )

    for ($i = 14; $i -ge 1; $i--) {
        $alpha = [int][Math]::Max(5, 28 - $i)
        $brush = [System.Drawing.SolidBrush]::new((New-Color $alpha 0 0 0))
        try {
            $Graphics.FillRectangle($brush, $X - $i, $Y - $i, $Width + ($i * 2), $Height + ($i * 2))
        } finally {
            $brush.Dispose()
        }
    }
}

function Draw-OffsetShadow {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$OffsetX = 16,
        [float]$OffsetY = 20,
        [int]$Layers = 12,
        [int]$PeakAlpha = 24
    )

    for ($i = $Layers; $i -ge 1; $i--) {
        $ratio = $i / [double]$Layers
        $alpha = [int][Math]::Max(3, [Math]::Round($PeakAlpha * $ratio))
        $brush = [System.Drawing.SolidBrush]::new((New-Color $alpha 0 0 0))
        try {
            $shadowX = [float]($X + ($OffsetX * (1 - $ratio)))
            $shadowY = [float]($Y + ($OffsetY * (1 - $ratio)))
            $expand = [float]([Math]::Ceiling($i * 0.55))
            $Graphics.FillRectangle($brush, $shadowX - $expand, $shadowY - $expand, $Width + ($expand * 2), $Height + ($expand * 2))
        } finally {
            $brush.Dispose()
        }
    }
}

function Draw-PlaqueFrame {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height
    )

    $outerPen = [System.Drawing.Pen]::new((New-Color 128 14 12 10), 1.2)
    $goldPen = [System.Drawing.Pen]::new((New-Color 94 198 170 102), 1.0)
    $innerPen = [System.Drawing.Pen]::new((New-Color 62 245 232 196), 0.9)
    $lowPen = [System.Drawing.Pen]::new((New-Color 54 8 7 6), 2.0)
    $topGlow = $null
    try {
        $Graphics.DrawRectangle($outerPen, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($goldPen, $X + 2, $Y + 2, $Width - 4, $Height - 4)
        $Graphics.DrawRectangle($innerPen, $X + 7, $Y + 7, $Width - 14, $Height - 14)
        $Graphics.DrawLine($lowPen, $X + 10, $Y + $Height - 4, $X + $Width - 10, $Y + $Height - 4)

        $topGlow = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
            [System.Drawing.RectangleF]::new($X + 2, $Y + 2, $Width - 4, [Math]::Max(22, $Height * 0.16)),
            (New-Color 38 255 247 224),
            (New-Color 0 255 247 224),
            90
        )
        $Graphics.FillRectangle($topGlow, $X + 2, $Y + 2, $Width - 4, [Math]::Max(22, $Height * 0.16))
    } finally {
        if ($null -ne $topGlow) { $topGlow.Dispose() }
        $outerPen.Dispose()
        $goldPen.Dispose()
        $innerPen.Dispose()
        $lowPen.Dispose()
    }
}

function New-RoundedRectPath {
    param(
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$Radius
    )

    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $diameter = [float]($Radius * 2)

    if ($diameter -gt $Width) { $diameter = $Width }
    if ($diameter -gt $Height) { $diameter = $Height }

    $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
    $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
    $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function Draw-RoundedImagePanel {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$ImagePath,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$Radius,
        [System.Drawing.Color]$FillColor,
        [System.Drawing.Pen]$OuterPen,
        [System.Drawing.Pen]$InnerPen
    )

    $outerPath = New-RoundedRectPath -X $X -Y $Y -Width $Width -Height $Height -Radius $Radius
    $innerPath = New-RoundedRectPath -X ($X + 7) -Y ($Y + 7) -Width ($Width - 14) -Height ($Height - 14) -Radius ([Math]::Max(1, $Radius - 4))
    $fillBrush = [System.Drawing.SolidBrush]::new($FillColor)
    $state = $Graphics.Save()
    try {
        $Graphics.FillPath($fillBrush, $outerPath)
        $Graphics.SetClip($innerPath)
        Draw-ImageContainRect -Graphics $Graphics -ImagePath $ImagePath -X ($X + 9) -Y ($Y + 9) -Width ($Width - 18) -Height ($Height - 18)
        $Graphics.Restore($state)
        $state = $Graphics.Save()
        $Graphics.DrawPath($OuterPen, $outerPath)
        $Graphics.DrawPath($InnerPen, $innerPath)
    } finally {
        $Graphics.Restore($state)
        $fillBrush.Dispose()
        $outerPath.Dispose()
        $innerPath.Dispose()
    }
}

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
            (New-Color ([int][Math]::Round($PeakAlpha * 0.35)) 236 198 102),
            (New-Color $PeakAlpha 255 243 196),
            (New-Color ([int][Math]::Round($PeakAlpha * 0.35)) 236 198 102),
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
            (New-Color ([int][Math]::Round($PeakAlpha * 0.55)) 248 222 142),
            (New-Color ([int][Math]::Round($PeakAlpha * 0.8)) 255 248 218),
            (New-Color ([int][Math]::Round($PeakAlpha * 0.55)) 248 222 142),
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

function Get-DeepGoldBrush {
    param([int]$Width, [int]$Height)

    $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        [System.Drawing.RectangleF]::new(0, 0, $Width, $Height),
        (New-Color 255 214 176 92),
        (New-Color 255 128 92 36),
        18
    )

    $blend = [System.Drawing.Drawing2D.ColorBlend]::new()
    $blend.Colors = [System.Drawing.Color[]]@(
        (New-Color 255 120 84 34),
        (New-Color 255 182 138 62),
        (New-Color 255 228 194 106),
        (New-Color 255 166 123 54),
        (New-Color 255 112 78 31)
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

function Draw-SiteFooter {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$LogoPath,
        [System.Drawing.Font]$Font,
        [System.Drawing.Brush]$Brush,
        [int]$Width,
        [int]$Height
    )

    $logo = [System.Drawing.Image]::FromFile($LogoPath)
    try {
        $Graphics.DrawImage($logo, $Width - 146, $Height - 134, 72, 72)
    } finally {
        $logo.Dispose()
    }

    $Graphics.DrawString("glyph.life", $Font, $Brush, [System.Drawing.PointF]::new(88, $Height - 88))
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

function New-ContactSheet {
    param(
        [string[]]$SlidePaths,
        [string]$OutputPath,
        [string]$Title = ""
    )

    $sheetWidth = 2340
    $sheetHeight = 1510
    $sheet = New-Canvas -Width $sheetWidth -Height $sheetHeight
    $bitmap = $sheet.Bitmap
    $graphics = $sheet.Graphics

    $bg = [System.Drawing.SolidBrush]::new((New-Color 255 7 8 11))
    try {
        $graphics.FillRectangle($bg, 0, 0, $sheetWidth, $sheetHeight)
    } finally {
        $bg.Dispose()
    }

    $goldBrush = Get-GoldBrush -Width $sheetWidth -Height $sheetHeight
    $headlineFamily = Get-FontFamily -Candidates @("Cormorant Garamond", "Garamond", "Book Antiqua", "Palatino Linotype", "Georgia", "Times New Roman")
    $titleFont = [System.Drawing.Font]::new($headlineFamily, 40, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    try {
        if ([string]::IsNullOrWhiteSpace($Title)) {
            $sheetTitle = "Ponte 01 | Imp" + [char]233 + "rio"
        } else {
            $sheetTitle = $Title
        }
        $graphics.DrawString($sheetTitle, $titleFont, $goldBrush, [System.Drawing.PointF]::new(92, 46))
        for ($i = 0; $i -lt $SlidePaths.Count; $i++) {
            $x = 90 + ($i * 1080)
            $y = 120
            $img = [System.Drawing.Image]::FromFile($SlidePaths[$i])
            try {
                $graphics.DrawImage($img, $x, $y, 1080, 1350)
            } finally {
                $img.Dispose()
            }
        }
        $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $titleFont.Dispose()
        $goldBrush.Dispose()
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

$root = Split-Path -Parent $OutputDir
if (-not (Test-Path $root)) { New-Item -ItemType Directory -Path $root -Force | Out-Null }
if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }

$width = 1080
$height = 1350
$logoPath = "C:\Users\Afonso\Downloads\GOL1.006\public\logo-diamond.png"

$headlineFamily = Get-FontFamily -Candidates @("Cormorant Garamond", "Garamond", "Book Antiqua", "Palatino Linotype", "Georgia", "Times New Roman")
$bodyFamily = Get-FontFamily -Candidates @("Book Antiqua", "Palatino Linotype", "Georgia", "Cambria", "Times New Roman")

$wordFont = [System.Drawing.Font]::new($headlineFamily, 110, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$definitionFont = [System.Drawing.Font]::new($bodyFamily, 48, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$miniBrandFont = [System.Drawing.Font]::new($headlineFamily, 92, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$taglineFont = [System.Drawing.Font]::new($bodyFamily, 60, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$siteFont = [System.Drawing.Font]::new($headlineFamily, 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$goldBrush = Get-GoldBrush -Width $width -Height $height
$silverBrush = Get-SilverBrush -Width $width -Height $height
$brandGoldBrush = Get-DeepGoldBrush -Width 980 -Height 260
$brandShadowBrush = [System.Drawing.SolidBrush]::new((New-Color 148 8 7 6))
$marfimBrush = [System.Drawing.SolidBrush]::new((New-Color 242 238 235 228))
$overlayBrush = [System.Drawing.SolidBrush]::new((New-Color 92 4 5 8))
$shadowBrush = [System.Drawing.SolidBrush]::new((New-Color 58 0 0 0))
$printFramePen = [System.Drawing.Pen]::new((New-Color 118 212 180 86), 1.4)
$printInnerPen = [System.Drawing.Pen]::new((New-Color 56 245 226 178), 0.7)
$bottomFade = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Point]::new(0, 930),
    [System.Drawing.Point]::new(0, 1350),
    (New-Color 0 0 0 0),
    (New-Color 210 5 6 8)
)

$defaultWord = "Imp" + [char]233 + "rio"
$defaultDefinition = "A funda" + [char]231 + [char]227 + "o do seu pr" + [char]243 + "prio territ" + [char]243 + "rio, onde a sua vis" + [char]227 + "o de mundo molda a realidade."
$tagline = "Gerencie seu imp" + [char]233 + "rio."

if ([string]::IsNullOrWhiteSpace($Word)) { $Word = $defaultWord }
if ([string]::IsNullOrWhiteSpace($Definition)) { $Definition = $defaultDefinition }

$overlayAlpha = if ($BrightBackground) { 116 } else { 92 }
$screenAlpha = if ($NoSlide2Darkening) { 0 } elseif ($BrightBackground) { 220 } else { 208 }
$brandShadowAlpha = if ($BrightBackground) { 182 } else { 148 }
$overlayBrush.Dispose()
$overlayBrush = [System.Drawing.SolidBrush]::new((New-Color $overlayAlpha 4 5 8))
$brandShadowBrush.Dispose()
$brandShadowBrush = [System.Drawing.SolidBrush]::new((New-Color $brandShadowAlpha 8 7 6))

$plaqueProbe = [System.Drawing.Image]::FromFile($PlaquePath)
try {
    $plaqueRatio = $plaqueProbe.Height / $plaqueProbe.Width
} finally {
    $plaqueProbe.Dispose()
}

# Slide 1
$slide1 = New-Canvas -Width $width -Height $height
$bitmap1 = $slide1.Bitmap
$graphics1 = $slide1.Graphics

Draw-ImageCoverRect -Graphics $graphics1 -ImagePath $BackgroundPath -X 0 -Y 0 -Width $width -Height $height
$graphics1.FillRectangle($overlayBrush, 0, 0, $width, $height)
Draw-SubtleGoldShimmer -Graphics $graphics1 -CenterX 300 -CenterY 680 -BandWidth 250 -BandHeight 1600 -Angle -18 -PeakAlpha 12
Draw-SubtleGoldShimmer -Graphics $graphics1 -CenterX 840 -CenterY 520 -BandWidth 220 -BandHeight 1500 -Angle 16 -PeakAlpha 10

$plaqueWidth = 520
$plaqueHeight = [int][Math]::Round($plaqueWidth * $plaqueRatio)
$plaqueX = [int][Math]::Round(($width - $plaqueWidth) / 2)
$plaqueY = [int][Math]::Round(($height - $plaqueHeight) / 2)
Draw-OffsetShadow -Graphics $graphics1 -X $plaqueX -Y $plaqueY -Width $plaqueWidth -Height $plaqueHeight -OffsetX 20 -OffsetY 26 -Layers 12 -PeakAlpha 22
Draw-SoftShadow -Graphics $graphics1 -X $plaqueX -Y $plaqueY -Width $plaqueWidth -Height $plaqueHeight
Draw-ImageContainRect -Graphics $graphics1 -ImagePath $PlaquePath -X $plaqueX -Y $plaqueY -Width $plaqueWidth -Height $plaqueHeight
Apply-PlaqueTone -Graphics $graphics1 -X $plaqueX -Y $plaqueY -Width $plaqueWidth -Height $plaqueHeight -Tone $PlaqueTone
Draw-PlaqueFrame -Graphics $graphics1 -X $plaqueX -Y $plaqueY -Width $plaqueWidth -Height $plaqueHeight

Draw-SingleLineFitText -Graphics $graphics1 -Text $Word -Font $wordFont -Brush $goldBrush -X ($plaqueX + 42) -Y ($plaqueY + 88) -Width ($plaqueWidth - 84) -Height 118 -MinScale 0.42
Draw-CenterText -Graphics $graphics1 -Text $Definition -Font $definitionFont -Brush $silverBrush -X ($plaqueX + 46) -Y ($plaqueY + 204) -Width ($plaqueWidth - 92) -Height 300 -MinScale 0.72
Draw-SiteFooter -Graphics $graphics1 -LogoPath $logoPath -Font $siteFont -Brush $goldBrush -Width $width -Height $height

$slide1Path = Join-Path $OutputDir "slide-01-capa.png"
Save-Slide -Bitmap $bitmap1 -Graphics $graphics1 -Path $slide1Path

# Slide 2
$slide2 = New-Canvas -Width $width -Height $height
$bitmap2 = $slide2.Bitmap
$graphics2 = $slide2.Graphics

Draw-ImageCoverRect -Graphics $graphics2 -ImagePath $BackgroundPath -X 0 -Y 0 -Width $width -Height $height
if ($screenAlpha -gt 0) {
    $screenDim = [System.Drawing.SolidBrush]::new((New-Color $screenAlpha 3 4 6))
    $graphics2.FillRectangle($screenDim, 0, 0, $width, $height)
    $screenDim.Dispose()
}

$printBoxWidth = 190
$printBoxHeight = 318
$printBoxX = [int][Math]::Round(($width - $printBoxWidth) / 2)
$printBoxY = 900
Draw-SoftShadow -Graphics $graphics2 -X $printBoxX -Y $printBoxY -Width $printBoxWidth -Height $printBoxHeight
Draw-RoundedImagePanel -Graphics $graphics2 -ImagePath $PrintPath -X $printBoxX -Y $printBoxY -Width $printBoxWidth -Height $printBoxHeight -Radius 18 -FillColor (New-Color 76 8 9 13) -OuterPen $printFramePen -InnerPen $printInnerPen

Draw-CenterTextWithShadow -Graphics $graphics2 -Text "GLYPH" -Font $miniBrandFont -Brush $brandGoldBrush -ShadowBrush $brandShadowBrush -X 80 -Y 488 -Width 920 -Height 92 -ShadowOffset 4 -MinScale 0.9
Draw-CenterTextWithShadow -Graphics $graphics2 -Text $tagline -Font $taglineFont -Brush $brandGoldBrush -ShadowBrush $brandShadowBrush -X 70 -Y 586 -Width 940 -Height 68 -ShadowOffset 3 -MinScale 0.86
Draw-SiteFooter -Graphics $graphics2 -LogoPath $logoPath -Font $siteFont -Brush $goldBrush -Width $width -Height $height

$slide2Path = Join-Path $OutputDir "slide-02-app.png"
Save-Slide -Bitmap $bitmap2 -Graphics $graphics2 -Path $slide2Path

New-ContactSheet -SlidePaths @($slide1Path, $slide2Path) -OutputPath (Join-Path $OutputDir "contact-sheet.png") -Title $SheetTitle

$wordFont.Dispose()
$definitionFont.Dispose()
$miniBrandFont.Dispose()
$taglineFont.Dispose()
$siteFont.Dispose()
$goldBrush.Dispose()
$silverBrush.Dispose()
$brandGoldBrush.Dispose()
$brandShadowBrush.Dispose()
$marfimBrush.Dispose()
$overlayBrush.Dispose()
$shadowBrush.Dispose()
$printFramePen.Dispose()
$printInnerPen.Dispose()
