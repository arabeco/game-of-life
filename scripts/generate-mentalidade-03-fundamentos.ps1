param(
    [string]$OutputDir = "C:\Users\Afonso\Downloads\GOL1.006\marketing\mentalidade-03-fundamentos\slides"
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

function Get-GoldBrush {
    param([int]$Width, [int]$Height)

    [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        [System.Drawing.RectangleF]::new(0, 0, $Width, $Height),
        (New-Color 255 253 242 191),
        (New-Color 255 140 106 47),
        15
    )
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
$bodyFont = [System.Drawing.Font]::new($bodyFamily, 37, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 28, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
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

$Aacute = [char]0x00C1
$Atilde = [char]0x00C3
$Ccedilla = [char]0x00C7
$Eacute = [char]0x00C9
$Ecirc = [char]0x00CA
$Iacute = [char]0x00CD
$Oacute = [char]0x00D3
$Uacute = [char]0x00DA
$aacute = [char]0x00E1
$agrave = [char]0x00E0
$atilde = [char]0x00E3
$ccedilla = [char]0x00E7
$eacute = [char]0x00E9
$ecirc = [char]0x00EA
$iacute = [char]0x00ED
$oacute = [char]0x00F3
$uacute = [char]0x00FA

$created = New-Object System.Collections.Generic.List[string]

# Slide 1
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
Draw-CenterText -Graphics $graphics -Text "Mentalidade" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 122 -Width 912 -Height 168
Draw-CenterText -Graphics $graphics -Text "Os melhores`nrepetem o b${aacute}sico`npor mais tempo." -Font $heroTitleFont -Brush $goldBrushSlide -X 156 -Y 300 -Width 768 -Height 350
Draw-CenterText -Graphics $graphics -Text "O raro nasce de fundamentos comuns`nexecutados sem vaidade." -Font $bodyFont -Brush $offWhiteBrush -X 192 -Y 700 -Width 696 -Height 108
Draw-Pill -Graphics $graphics -Text "Mentalidade 03" -Font $bodyBoldFont -X 392 -Y 822 -Width 296 -Height 54
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide1 = Join-Path $OutputDir "slide-01-capa.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide1
$created.Add($slide1)

# Slide 2
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
Draw-CenterText -Graphics $graphics -Text "Base" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 458 -Width 912 -Height 150
Draw-EditorialPanel -Graphics $graphics -X 136 -Y 252 -Width 808 -Height 682
Draw-CenterText -Graphics $graphics -Text "Amadores trocam o`nsimples cedo demais." -Font $titleLargeFont -Brush $goldBrushSlide -X 184 -Y 308 -Width 712 -Height 178
Draw-CenterText -Graphics $graphics -Text "Abandonam o que funciona porque o b${aacute}sico parece sem glamour`nantes de gerar resultado composto." -Font $bodyFont -Brush $offWhiteBrush -X 190 -Y 520 -Width 700 -Height 156
Draw-CenterText -Graphics $graphics -Text "Quem troca de base demais nunca acumula for${ccedilla}a." -Font $bodySmallFont -Brush $mutedBrush -X 154 -Y 694 -Width 772 -Height 78
Draw-CenterText -Graphics $graphics -Text "Novidade n${atilde}o substitui`nfundamento." -Font $titleMediumFont -Brush $whiteBrush -X 188 -Y 798 -Width 704 -Height 92
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide2 = Join-Path $OutputDir "slide-02-logica-01.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide2
$created.Add($slide2)

# Slide 3
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
Draw-CenterText -Graphics $graphics -Text "Repeti${ccedilla}${atilde}o" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 458 -Width 912 -Height 150
Draw-EditorialPanel -Graphics $graphics -X 132 -Y 252 -Width 816 -Height 694
Draw-CenterText -Graphics $graphics -Text "Elite domina o que`nparece ${oacute}bvio." -Font $titleLargeFont -Brush $goldBrushSlide -X 180 -Y 302 -Width 720 -Height 178
Draw-CenterText -Graphics $graphics -Text "Repete fundamentos sob t${eacute}dio, refina detalhe e sustenta padr${atilde}o`nat${eacute} o simples virar raro." -Font $bodyFont -Brush $offWhiteBrush -X 188 -Y 546 -Width 704 -Height 172
Draw-CenterText -Graphics $graphics -Text "Maestria ${eacute} fundamento`nsustentado." -Font $titleMediumFont -Brush $whiteBrush -X 182 -Y 798 -Width 716 -Height 92
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide3 = Join-Path $OutputDir "slide-03-logica-02.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide3
$created.Add($slide3)

# Slide 4
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
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
Draw-CenterText -Graphics $graphics -Text "Mentalidade 03  |  Fundamentos" -Font $eyebrowFont -Brush $eyebrowBrush -X 220 -Y 1060 -Width 640 -Height 28
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
Draw-CenterText -Graphics $contactGraphics -Text "MENTALIDADE 03  |  FUNDAMENTOS" -Font ([System.Drawing.Font]::new($headlineFamily, 42, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $sheetGold -X 180 -Y 42 -Width 1240 -Height 60
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
$goldBrushSlide.Dispose()
$sheetBrush.Dispose()
$sheetGold.Dispose()

foreach ($file in $created) {
    Write-Output "CREATED=$file"
}



