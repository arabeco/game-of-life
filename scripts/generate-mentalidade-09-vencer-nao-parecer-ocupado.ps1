param(
    [string]$OutputDir = "C:\Users\Afonso\Downloads\GOL1.006\marketing\mentalidade-09-vencer-nao-parecer-ocupado\slides"
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
        [int]$Height
    )

    Draw-FittedImage -Graphics $Graphics -ImagePath $BackgroundPath -Width $Width -Height $Height

    $overlayBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        [System.Drawing.Point]::new(0, 0),
        [System.Drawing.Point]::new($Width, $Height),
        (New-Color 226 1 2 4),
        (New-Color 214 3 4 7)
    )
    $Graphics.FillRectangle($overlayBrush, 0, 0, $Width, $Height)
    $overlayBrush.Dispose()

    $panelX = 82
    $panelY = 82
    $panelWidth = $Width - 164
    $panelHeight = $Height - 164

    $panelBrush = [System.Drawing.SolidBrush]::new((New-Color 198 4 4 6))
    $Graphics.FillRectangle($panelBrush, $panelX, $panelY, $panelWidth, $panelHeight)
    $panelBrush.Dispose()

    Draw-GlowRectangle -Graphics $Graphics -X $panelX -Y $panelY -Width $panelWidth -Height $panelHeight

    $borderPen = [System.Drawing.Pen]::new((New-Color 245 237 205 114), 2.8)
    $innerPen = [System.Drawing.Pen]::new((New-Color 126 255 236 196), 1.0)
    $Graphics.DrawRectangle($borderPen, $panelX, $panelY, $panelWidth, $panelHeight)
    $Graphics.DrawRectangle($innerPen, $panelX + 12, $panelY + 12, $panelWidth - 24, $panelHeight - 24)
    $borderPen.Dispose()
    $innerPen.Dispose()
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

    $fill = [System.Drawing.SolidBrush]::new((New-Color 72 13 14 18))
    $pen = [System.Drawing.Pen]::new((New-Color 220 212 175 55), 1.6)
    $textBrush = [System.Drawing.SolidBrush]::new((New-Color 245 247 230 194))
    try {
        $Graphics.FillRectangle($fill, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($pen, $X, $Y, $Width, $Height)
        Draw-CenterText -Graphics $Graphics -Text $Text -Font $Font -Brush $textBrush -X $X -Y $Y -Width $Width -Height $Height
    } finally {
        $fill.Dispose()
        $pen.Dispose()
        $textBrush.Dispose()
    }
}

function Draw-EditorialPanel {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height
    )

    $panelBrush = [System.Drawing.SolidBrush]::new((New-Color 92 8 10 14))
    $outerPen = [System.Drawing.Pen]::new((New-Color 180 212 175 55), 1.6)
    $innerPen = [System.Drawing.Pen]::new((New-Color 120 255 236 196), 1.0)
    try {
        $Graphics.FillRectangle($panelBrush, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($outerPen, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($innerPen, $X + 12, $Y + 12, $Width - 24, $Height - 24)
    } finally {
        $panelBrush.Dispose()
        $outerPen.Dispose()
        $innerPen.Dispose()
    }
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

$root = Split-Path -Parent $OutputDir
if (-not (Test-Path $root)) { New-Item -ItemType Directory -Path $root -Force | Out-Null }
if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }

$width = 1080
$height = 1350

$logoPath = "C:\Users\Afonso\Downloads\GOL1.006\public\logo-diamond.png"
$bgObsidian = "C:\Users\Afonso\Downloads\GOL1.006\marketing\background\blackback.jpg"

$headlineFamily = Get-FontFamily -Candidates @("Cormorant Garamond", "Garamond", "Book Antiqua", "Palatino Linotype", "Georgia", "Times New Roman")
$bodyFamily = Get-FontFamily -Candidates @("Book Antiqua", "Palatino Linotype", "Georgia", "Cambria", "Times New Roman")

$eyebrowFont = [System.Drawing.Font]::new($bodyFamily, 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$heroTitleFont = [System.Drawing.Font]::new($headlineFamily, 66, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 60, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 48, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$bodyFont = [System.Drawing.Font]::new($bodyFamily, 44, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 33, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodyBoldFont = [System.Drawing.Font]::new($bodyFamily, 24, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$ctaFont = [System.Drawing.Font]::new($headlineFamily, 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$watermarkFont = [System.Drawing.Font]::new($headlineFamily, 116, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$whiteBrush = [System.Drawing.SolidBrush]::new((New-Color 240 245 242 237))
$offWhiteBrush = [System.Drawing.SolidBrush]::new((New-Color 220 236 233 227))
$mutedBrush = [System.Drawing.SolidBrush]::new((New-Color 186 210 206 199))
$eyebrowBrush = [System.Drawing.SolidBrush]::new((New-Color 165 255 236 196))
$goldSoftBrush = [System.Drawing.SolidBrush]::new((New-Color 220 234 206 110))
$goldWashBrush = [System.Drawing.SolidBrush]::new((New-Color 18 244 216 118))
$goldBrushSlide = Get-GoldBrush -Width $width -Height $height
$silverBrushSlide = Get-SilverBrush -Width $width -Height $height
$Aacute = [char]0x00C1
$Atilde = [char]0x00C3
$Ccedilla = [char]0x00C7
$Eacute = [char]0x00C9
$Ecirc = [char]0x00CA
$Iacute = [char]0x00CD
$Oacute = [char]0x00D3
$Uacute = [char]0x00DA
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
$uacute = [char]0x00FA

$created = New-Object System.Collections.Generic.List[string]

# Slide 1
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 748 -CenterY 438 -BandWidth 236 -BandHeight 1520 -Angle 15 -PeakAlpha 14

Draw-CenterText -Graphics $graphics -Text "Mentalidade" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 122 -Width 912 -Height 168
Draw-CenterText -Graphics $graphics -Text "Os melhores n${atilde}o`ntentam parecer`nocupados." -Font $heroTitleFont -Brush $goldBrushSlide -X 138 -Y 286 -Width 804 -Height 388
Draw-CenterText -Graphics $graphics -Text "Tentam vencer.`nMovimento demais tamb${eacute}m pode ser teatro." -Font $bodyFont -Brush $silverBrushSlide -X 170 -Y 720 -Width 740 -Height 116
Draw-Pill -Graphics $graphics -Text "Mentalidade 09" -Font $bodyBoldFont -X 382 -Y 836 -Width 316 -Height 54
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide1 = Join-Path $OutputDir "slide-01-capa.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide1
$created.Add($slide1)

# Slide 2
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 868 -CenterY 604 -BandWidth 194 -BandHeight 1560 -Angle -18 -PeakAlpha 12

Draw-CenterText -Graphics $graphics -Text "Ru${iacute}do" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 458 -Width 912 -Height 150
Draw-EditorialPanel -Graphics $graphics -X 122 -Y 236 -Width 836 -Height 724
Draw-CenterText -Graphics $graphics -Text "Muita atividade`npode esconder medo." -Font $titleLargeFont -Brush $goldBrushSlide -X 162 -Y 278 -Width 756 -Height 196
Draw-CenterText -Graphics $graphics -Text "Quem quer parecer importante enche o dia`nde movimento, resposta e tarefa lateral.`nQuase sempre para evitar a jogada decisiva." -Font $bodyFont -Brush $silverBrushSlide -X 162 -Y 520 -Width 756 -Height 228
Draw-CenterText -Graphics $graphics -Text "Ocupacao falsa protege o ego." -Font $titleMediumFont -Brush $whiteBrush -X 176 -Y 798 -Width 728 -Height 92
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide2 = Join-Path $OutputDir "slide-02-logica-01.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide2
$created.Add($slide2)

# Slide 3
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 348 -CenterY 652 -BandWidth 220 -BandHeight 1560 -Angle 19 -PeakAlpha 12

Draw-CenterText -Graphics $graphics -Text "Vit${oacute}ria" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 458 -Width 912 -Height 150
Draw-EditorialPanel -Graphics $graphics -X 122 -Y 236 -Width 836 -Height 730
Draw-CenterText -Graphics $graphics -Text "A elite mede impacto,`nn${atilde}o volume." -Font $titleLargeFont -Brush $goldBrushSlide -X 154 -Y 256 -Width 772 -Height 246
Draw-CenterText -Graphics $graphics -Text "Menos movimentos, mais resultado.`nQuem opera em alto n${iacute}vel concentra for${ccedilla}a`nonde a vit${oacute}ria realmente acontece." -Font $bodyFont -Brush $silverBrushSlide -X 162 -Y 558 -Width 756 -Height 210
Draw-CenterText -Graphics $graphics -Text "Nao parecer cheio. Vencer." -Font $titleMediumFont -Brush $whiteBrush -X 176 -Y 798 -Width 728 -Height 92
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide3 = Join-Path $OutputDir "slide-03-logica-02.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide3
$created.Add($slide3)

# Slide 4
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
Draw-SubtleGoldShimmer -Graphics $graphics -CenterX 674 -CenterY 582 -BandWidth 206 -BandHeight 1520 -Angle -13 -PeakAlpha 10

$watermarkBrush2 = [System.Drawing.SolidBrush]::new((New-Color 18 244 216 118))
try {
    Draw-CenterText -Graphics $graphics -Text "Mentalidade" -Font $watermarkFont -Brush $watermarkBrush2 -X 84 -Y 456 -Width 912 -Height 150
} finally {
    $watermarkBrush2.Dispose()
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
Draw-CenterText -Graphics $graphics -Text "Mentalidade 09  |  Os melhores nao tentam parecer ocupados. Tentam vencer." -Font $eyebrowFont -Brush $eyebrowBrush -X 64 -Y 1060 -Width 952 -Height 28
$slide4 = Join-Path $OutputDir "slide-04-fecho.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide4
$created.Add($slide4)

# Contact sheet
$contact = New-Canvas -Width 1600 -Height 2200
$contactBitmap = $contact.Bitmap
$contactGraphics = $contact.Graphics
$contactGraphics.Clear((New-Color 255 8 8 10))
$sheetBrush = [System.Drawing.SolidBrush]::new((New-Color 255 240 236 226))
$sheetGold = Get-GoldBrush -Width 1600 -Height 2200
Draw-CenterText -Graphics $contactGraphics -Text "MENTALIDADE 09  |  OS MELHORES NAO TENTAM PARECER OCUPADOS. TENTAM VENCER." -Font ([System.Drawing.Font]::new($headlineFamily, 24, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $sheetGold -X 180 -Y 42 -Width 1240 -Height 60
Draw-CenterText -Graphics $contactGraphics -Text "Prancha de revis${atilde}o - 4 slides prontos" -Font ([System.Drawing.Font]::new($bodyFamily, 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $sheetBrush -X 300 -Y 108 -Width 1000 -Height 32

$thumbWidth = 560
$thumbHeight = 700
$positions = @(
    @{ X = 110; Y = 200 },
    @{ X = 930; Y = 200 },
    @{ X = 110; Y = 970 },
    @{ X = 930; Y = 970 }
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
$heroTitleFont.Dispose()
$titleLargeFont.Dispose()
$titleMediumFont.Dispose()
$bodyFont.Dispose()
$bodySmallFont.Dispose()
$bodyBoldFont.Dispose()
$ctaFont.Dispose()
$watermarkFont.Dispose()
$whiteBrush.Dispose()
$offWhiteBrush.Dispose()
$mutedBrush.Dispose()
$eyebrowBrush.Dispose()
$goldSoftBrush.Dispose()
$goldWashBrush.Dispose()
$silverBrushSlide.Dispose()
$goldBrushSlide.Dispose()
$sheetBrush.Dispose()
$sheetGold.Dispose()

foreach ($file in $created) {
    Write-Output "CREATED=$file"
}














