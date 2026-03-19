param(
    [string]$OutputDir = "C:\Users\Afonso\Downloads\GOL1.006\marketing\filosofia-03-piloto-automatico\slides"
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
    try {
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        $Graphics.DrawString($Text, $Font, $Brush, [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height), $format)
    } finally {
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
        [int]$Height,
        [string]$Tone = "obsidian"
    )

    Draw-FittedImage -Graphics $Graphics -ImagePath $BackgroundPath -Width $Width -Height $Height

    $topColor = switch ($Tone) {
        "marfim" { New-Color 112 255 251 245 }
        "safira" { New-Color 176 4 12 26 }
        default { New-Color 186 2 3 6 }
    }
    $bottomColor = switch ($Tone) {
        "marfim" { New-Color 92 234 226 212 }
        "safira" { New-Color 160 7 11 22 }
        default { New-Color 156 7 8 11 }
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
        "marfim" { New-Color 160 248 243 235 }
        default { New-Color 164 5 6 9 }
    }
    $panelBrush = [System.Drawing.SolidBrush]::new($panelColor)
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

    $fill = [System.Drawing.SolidBrush]::new((New-Color 62 13 14 18))
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
        [float]$Height,
        [string]$Tone = "obsidian"
    )

    $panelColor = switch ($Tone) {
        "marfim" { New-Color 132 255 250 243 }
        default { New-Color 76 8 10 14 }
    }
    $panelBrush = [System.Drawing.SolidBrush]::new($panelColor)
    $outerPen = [System.Drawing.Pen]::new((New-Color 180 212 175 55), 1.6)
    $innerPenColor = switch ($Tone) {
        "marfim" { New-Color 110 130 116 88 }
        default { New-Color 120 255 236 196 }
    }
    $innerPen = [System.Drawing.Pen]::new($innerPenColor, 1.0)
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
$bgMarfim = "C:\Users\Afonso\Downloads\GOL1.006\marketing\background\whiteback.jpg"
$bgSapphire = "C:\Users\Afonso\Downloads\GOL1.006\marketing\background\darkblueback.jpg"

$headlineFamily = Get-FontFamily -Candidates @("Palatino Linotype", "Georgia", "Times New Roman")
$bodyFamily = Get-FontFamily -Candidates @("Segoe UI", "Arial", "Tahoma")

$eyebrowFont = [System.Drawing.Font]::new($bodyFamily, 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$heroTitleFont = [System.Drawing.Font]::new($headlineFamily, 68, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 60, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 48, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$bodyFont = [System.Drawing.Font]::new($bodyFamily, 36, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 28, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodyBoldFont = [System.Drawing.Font]::new($bodyFamily, 24, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$ctaFont = [System.Drawing.Font]::new($headlineFamily, 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$watermarkFont = [System.Drawing.Font]::new($headlineFamily, 118, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$whiteBrush = [System.Drawing.SolidBrush]::new((New-Color 240 49 42 32))
$offWhiteBrush = [System.Drawing.SolidBrush]::new((New-Color 240 73 63 50))
$mutedBrush = [System.Drawing.SolidBrush]::new((New-Color 186 124 116 103))
$eyebrowBrush = [System.Drawing.SolidBrush]::new((New-Color 190 108 93 58))
$goldSoftBrush = [System.Drawing.SolidBrush]::new((New-Color 240 168 132 54))
$goldWashBrush = [System.Drawing.SolidBrush]::new((New-Color 34 164 136 62))
$marfimTitleBrush = [System.Drawing.SolidBrush]::new((New-Color 255 145 112 42))
$goldBrushSlide = Get-GoldBrush -Width $width -Height $height

$Aacute = [char]0x00C1
$Atilde = [char]0x00C3
$Ccedilla = [char]0x00C7
$Eacute = [char]0x00C9
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
$uacute = [char]0x00FA

$created = New-Object System.Collections.Generic.List[string]

# Slide 1
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgMarfim -Width $width -Height $height -Tone "marfim"
Draw-CenterText -Graphics $graphics -Text "Filosofia" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 120 -Width 912 -Height 170
Draw-CenterText -Graphics $graphics -Text "O custo invis${iacute}vel`ndo piloto`nautom${aacute}tico." -Font $heroTitleFont -Brush $marfimTitleBrush -X 146 -Y 320 -Width 788 -Height 300
Draw-CenterText -Graphics $graphics -Text "Voc${ecirc} pisca, a semana some,`ne nada realmente muda de lugar." -Font $bodyFont -Brush $offWhiteBrush -X 178 -Y 654 -Width 724 -Height 120
Draw-Pill -Graphics $graphics -Text "Filosofia 03" -Font $bodyBoldFont -X 414 -Y 812 -Width 252 -Height 54
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide1 = Join-Path $OutputDir "slide-01-capa.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide1
$created.Add($slide1)

# Slide 2
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgMarfim -Width $width -Height $height -Tone "marfim"
Draw-CenterText -Graphics $graphics -Text "Piloto" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 122 -Width 912 -Height 168
Draw-EditorialPanel -Graphics $graphics -X 150 -Y 276 -Width 780 -Height 636 -Tone "marfim"
Draw-CenterText -Graphics $graphics -Text "O piloto autom${aacute}tico`nrouba dias inteiros." -Font $titleLargeFont -Brush $marfimTitleBrush -X 208 -Y 328 -Width 664 -Height 176
Draw-CenterText -Graphics $graphics -Text "Voc${ecirc} acorda, reage, apaga inc${ecirc}ndios, rola o dia at${eacute} a noite`ne termina sem progresso consciente." -Font $bodyFont -Brush $offWhiteBrush -X 214 -Y 556 -Width 652 -Height 164
Draw-CenterText -Graphics $graphics -Text "O tempo passa mesmo`nsem a sua presen${ccedilla}a." -Font $titleMediumFont -Brush $whiteBrush -X 208 -Y 792 -Width 664 -Height 104
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide2 = Join-Path $OutputDir "slide-02-reagir.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide2
$created.Add($slide2)

# Slide 3
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgMarfim -Width $width -Height $height -Tone "marfim"
Draw-CenterText -Graphics $graphics -Text "Leme" -Font $watermarkFont -Brush $goldWashBrush -X 80 -Y 118 -Width 920 -Height 176
Draw-EditorialPanel -Graphics $graphics -X 146 -Y 272 -Width 788 -Height 652 -Tone "marfim"
Draw-CenterText -Graphics $graphics -Text "Quem recupera`npresen${ccedilla}a recupera`ndire${ccedilla}${atilde}o." -Font $titleLargeFont -Brush $marfimTitleBrush -X 204 -Y 324 -Width 672 -Height 182
Draw-CenterText -Graphics $graphics -Text "Nomeia o alvo, registra o dia e for${ccedilla}a inten${ccedilla}${atilde}o antes do caos.`nA consci${ecirc}ncia devolve o leme." -Font $bodyFont -Brush $offWhiteBrush -X 210 -Y 560 -Width 660 -Height 170
Draw-CenterText -Graphics $graphics -Text "Presen${ccedilla}a quebra`no autom${aacute}tico." -Font $titleMediumFont -Brush $whiteBrush -X 208 -Y 812 -Width 664 -Height 104
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide3 = Join-Path $OutputDir "slide-03-construir.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide3
$created.Add($slide3)

# Slide 4
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgMarfim -Width $width -Height $height -Tone "marfim"
$watermarkBrush2 = [System.Drawing.SolidBrush]::new((New-Color 18 244 216 118))
try {
    Draw-CenterText -Graphics $graphics -Text "Filosofia" -Font $watermarkFont -Brush $watermarkBrush2 -X 84 -Y 458 -Width 912 -Height 150
} finally {
    $watermarkBrush2.Dispose()
}

$logo2 = [System.Drawing.Image]::FromFile($logoPath)
try {
    $graphics.DrawImage($logo2, 316, 212, 448, 448)
} finally {
    $logo2.Dispose()
}

Draw-CenterText -Graphics $graphics -Text "GLYPH" -Font ([System.Drawing.Font]::new($headlineFamily, 86, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $marfimTitleBrush -X 170 -Y 770 -Width 740 -Height 94
Draw-CenterText -Graphics $graphics -Text "Organize seu imp${eacute}rio." -Font $titleMediumFont -Brush $whiteBrush -X 180 -Y 868 -Width 720 -Height 68
Draw-Pill -Graphics $graphics -Text "glyph.life" -Font $bodyBoldFont -X 386 -Y 972 -Width 308 -Height 54
Draw-CenterText -Graphics $graphics -Text "Filosofia 03  |  Piloto autom${aacute}tico" -Font $eyebrowFont -Brush $eyebrowBrush -X 210 -Y 1060 -Width 660 -Height 28
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
Draw-CenterText -Graphics $contactGraphics -Text "FILOSOFIA 03  |  PILOTO AUTOM${Aacute}TICO" -Font ([System.Drawing.Font]::new($headlineFamily, 42, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $sheetGold -X 180 -Y 42 -Width 1240 -Height 60
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
$marfimTitleBrush.Dispose()
$goldBrushSlide.Dispose()
$sheetBrush.Dispose()
$sheetGold.Dispose()

foreach ($file in $created) {
    Write-Output "CREATED=$file"
}
