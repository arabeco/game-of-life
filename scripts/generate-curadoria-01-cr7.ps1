param(
    [string]$OutputDir = "C:\Users\Afonso\Downloads\GOL1.006\marketing\curadoria-01-cristiano-ronaldo\slides"
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
        (New-Color 175 2 3 6),
        (New-Color 145 7 8 11)
    )
    $Graphics.FillRectangle($overlayBrush, 0, 0, $Width, $Height)
    $overlayBrush.Dispose()

    $panelX = 82
    $panelY = 82
    $panelWidth = $Width - 164
    $panelHeight = $Height - 164

    $panelBrush = [System.Drawing.SolidBrush]::new((New-Color 162 5 6 9))
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
        $Graphics.DrawImage($logo, 875, 1168, 110, 110)
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
    try {
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        $Graphics.DrawString($Text, $Font, $Brush, [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height), $format)
    } finally {
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
        Draw-CenterText -Graphics $Graphics -Text $Text -Font $Font -Brush $textBrush -X $X -Y $Y -Width $Width -Height $Height
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
        Draw-CenterText -Graphics $Graphics -Text $Title -Font $TitleFont -Brush $GoldBrush -X ($X + 10) -Y ($Y + 18) -Width ($Width - 20) -Height 72
        Draw-CenterText -Graphics $Graphics -Text $Body -Font $BodyFont -Brush $BodyBrush -X ($X + 18) -Y ($Y + 92) -Width ($Width - 36) -Height ($Height - 108)
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
$bgObsidian = "C:\Users\Afonso\Downloads\GOL1.006\public\legacy-skins\1.jpg"
$bgSapphire = "C:\Users\Afonso\Downloads\GOL1.006\public\legacy-skins\5.jpg"

$headlineFamily = Get-FontFamily -Candidates @("Palatino Linotype", "Georgia", "Times New Roman")
$bodyFamily = Get-FontFamily -Candidates @("Segoe UI", "Arial", "Tahoma")

$eyebrowFont = [System.Drawing.Font]::new($bodyFamily, 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleHugeFont = [System.Drawing.Font]::new($headlineFamily, 66, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 54, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 40, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleCardFont = [System.Drawing.Font]::new($headlineFamily, 31, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$bodyFont = [System.Drawing.Font]::new($bodyFamily, 27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 22, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodyBoldFont = [System.Drawing.Font]::new($bodyFamily, 24, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$ctaFont = [System.Drawing.Font]::new($headlineFamily, 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$monoTitleFont = [System.Drawing.Font]::new($headlineFamily, 150, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$radarLabelFont = [System.Drawing.Font]::new($bodyFamily, 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$radarValueFont = [System.Drawing.Font]::new($bodyFamily, 16, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$whiteBrush = [System.Drawing.SolidBrush]::new((New-Color 238 245 242 237))
$offWhiteBrush = [System.Drawing.SolidBrush]::new((New-Color 215 236 233 227))
$mutedBrush = [System.Drawing.SolidBrush]::new((New-Color 180 210 206 199))
$eyebrowBrush = [System.Drawing.SolidBrush]::new((New-Color 165 255 236 196))
$goldTextBrush = [System.Drawing.SolidBrush]::new((New-Color 255 244 216 118))
$goldSoftBrush = [System.Drawing.SolidBrush]::new((New-Color 220 234 206 110))
$ghostBrush = [System.Drawing.SolidBrush]::new((New-Color 28 255 255 255))

$goldBrushSlide = Get-GoldBrush -Width $width -Height $height

$created = New-Object System.Collections.Generic.List[string]

# Slide 1
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
Draw-Label -Graphics $graphics -Text "CURADORIA 01" -Font $eyebrowFont -Brush $eyebrowBrush -X 124 -Y 116 -Width 240 -Height 24
Draw-Label -Graphics $graphics -Text "RADAR DE MAESTRIA" -Font $eyebrowFont -Brush $eyebrowBrush -X 124 -Y 156 -Width 260 -Height 24
Draw-CenterText -Graphics $graphics -Text "CR7" -Font $monoTitleFont -Brush $ghostBrush -X 250 -Y 142 -Width 580 -Height 220
Draw-CenterText -Graphics $graphics -Text "COMO O GLYPH`nLERIA O`nCRISTIANO`nRONALDO?" -Font $titleHugeFont -Brush $goldBrushSlide -X 150 -Y 378 -Width 780 -Height 430
Draw-Pill -Graphics $graphics -Text "NIVEL DE MAESTRIA 89" -Font $bodyBoldFont -X 326 -Y 870 -Width 428 -Height 58
Draw-CenterText -Graphics $graphics -Text "NAO E FAN PAGE.`nE LEITURA DE SISTEMA." -Font $titleMediumFont -Brush $offWhiteBrush -X 180 -Y 954 -Width 720 -Height 120
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide1 = Join-Path $OutputDir "slide-01-capa.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide1
$created.Add($slide1)

# Slide 2
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgSapphire -Width $width -Height $height
Draw-Label -Graphics $graphics -Text "QUEM E" -Font $eyebrowFont -Brush $eyebrowBrush -X 124 -Y 116 -Width 200 -Height 24
Draw-CenterText -Graphics $graphics -Text "CR7" -Font $monoTitleFont -Brush $ghostBrush -X 356 -Y 126 -Width 420 -Height 180
New-BodyPanel -Graphics $graphics -X 156 -Y 330 -Width 768 -Height 520
Draw-CenterText -Graphics $graphics -Text "CR7 NAO VIROU`nICONE POR IMPULSO." -Font $titleLargeFont -Brush $goldBrushSlide -X 190 -Y 392 -Width 700 -Height 168
Draw-CenterText -Graphics $graphics -Text "Virou porque transformou treino,`nimagem, carreira e ambicao`nem padrao diario." -Font $bodyFont -Brush $offWhiteBrush -X 208 -Y 572 -Width 664 -Height 136
Draw-CenterText -Graphics $graphics -Text "NAO E HYPE. E SISTEMA." -Font $titleMediumFont -Brush $whiteBrush -X 166 -Y 728 -Width 748 -Height 84
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide2 = Join-Path $OutputDir "slide-02-quem-e.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide2
$created.Add($slide2)

# Slide 3
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
Draw-Label -Graphics $graphics -Text "ATIVOS MAIS ALTOS" -Font $eyebrowFont -Brush $eyebrowBrush -X 124 -Y 116 -Width 260 -Height 24
Draw-CenterText -Graphics $graphics -Text "O TOPO NAO`nNASCEU DO ACASO." -Font $titleLargeFont -Brush $goldBrushSlide -X 162 -Y 194 -Width 756 -Height 160
Draw-StatCard -Graphics $graphics -X 118 -Y 434 -Width 260 -Height 420 -Title "FISICO`n10" -Body "O corpo virou`nmaquina de`nexecucao." -TitleFont $titleCardFont -BodyFont $bodyFont -GoldBrush $goldBrushSlide -BodyBrush $offWhiteBrush
Draw-StatCard -Graphics $graphics -X 410 -Y 434 -Width 260 -Height 420 -Title "TRABALHO`n10" -Body "A rotina virou`nvantagem`ncompetitiva." -TitleFont $titleCardFont -BodyFont $bodyFont -GoldBrush $goldBrushSlide -BodyBrush $offWhiteBrush
Draw-StatCard -Graphics $graphics -X 702 -Y 434 -Width 260 -Height 420 -Title "PROPOSITO`n10" -Body "A carreira ganhou`ndirecao total`ne ambicao longa." -TitleFont $titleCardFont -BodyFont $bodyFont -GoldBrush $goldBrushSlide -BodyBrush $offWhiteBrush
Draw-CenterText -Graphics $graphics -Text "Fisico, Trabalho e Proposito.`nA execucao virou identidade." -Font $bodyFont -Brush $mutedBrush -X 168 -Y 930 -Width 744 -Height 96
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide3 = Join-Path $OutputDir "slide-03-ativos.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide3
$created.Add($slide3)

# Slide 4
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgSapphire -Width $width -Height $height
Draw-Label -Graphics $graphics -Text "RADAR COMPLETO" -Font $eyebrowFont -Brush $eyebrowBrush -X 124 -Y 116 -Width 240 -Height 24
Draw-CenterText -Graphics $graphics -Text "NIVEL DE MAESTRIA" -Font $titleMediumFont -Brush $goldBrushSlide -X 200 -Y 128 -Width 680 -Height 60
Draw-CenterText -Graphics $graphics -Text "89" -Font $monoTitleFont -Brush $whiteBrush -X 350 -Y 174 -Width 380 -Height 180
$labels = @("CONSCIENCIA","ESPACO MENTAL","ESPIRITUAL","PROPOSITO","PROJETOS","CONEXOES","FINANCAS","TRABALHO","HOBBIES","FISICO")
$values = @(8,10,7,10,9,8,10,10,7,10)
Draw-RadarChart -Graphics $graphics -CenterX 540 -CenterY 705 -Radius 250 -Values $values -Labels $labels -LabelFont $radarLabelFont -ValueFont $radarValueFont
Draw-CenterText -Graphics $graphics -Text "O nivel do CR7 nao e motivacao.`nE sistema de execucao sustentado por anos." -Font $bodyFont -Brush $offWhiteBrush -X 186 -Y 1016 -Width 708 -Height 120
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide4 = Join-Path $OutputDir "slide-04-radar.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide4
$created.Add($slide4)

# Slide 5
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
$logo = [System.Drawing.Image]::FromFile($logoPath)
try {
    $graphics.DrawImage($logo, 296, 220, 488, 488)
} finally {
    $logo.Dispose()
}
Draw-CenterText -Graphics $graphics -Text "GLYPH" -Font ([System.Drawing.Font]::new($headlineFamily, 86, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $goldBrushSlide -X 170 -Y 770 -Width 740 -Height 94
Draw-CenterText -Graphics $graphics -Text "Organize seu imperio." -Font $titleMediumFont -Brush $whiteBrush -X 180 -Y 868 -Width 720 -Height 68
Draw-Pill -Graphics $graphics -Text "glyph.life" -Font $bodyBoldFont -X 386 -Y 972 -Width 308 -Height 54
Draw-CenterText -Graphics $graphics -Text "CURADORIA 01  |  CRISTIANO RONALDO" -Font $eyebrowFont -Brush $eyebrowBrush -X 220 -Y 1060 -Width 640 -Height 28
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
Draw-CenterText -Graphics $contactGraphics -Text "CURADORIA 01  |  CRISTIANO RONALDO" -Font ([System.Drawing.Font]::new($headlineFamily, 46, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $sheetGold -X 180 -Y 42 -Width 1240 -Height 60
Draw-CenterText -Graphics $contactGraphics -Text "Review board - 5 slides prontos" -Font ([System.Drawing.Font]::new($bodyFamily, 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $sheetBrush -X 300 -Y 108 -Width 1000 -Height 32

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
$titleMediumFont.Dispose()
$titleCardFont.Dispose()
$bodyFont.Dispose()
$bodySmallFont.Dispose()
$bodyBoldFont.Dispose()
$ctaFont.Dispose()
$monoTitleFont.Dispose()
$radarLabelFont.Dispose()
$radarValueFont.Dispose()
$whiteBrush.Dispose()
$offWhiteBrush.Dispose()
$mutedBrush.Dispose()
$eyebrowBrush.Dispose()
$goldTextBrush.Dispose()
$goldSoftBrush.Dispose()
$ghostBrush.Dispose()
$goldBrushSlide.Dispose()
$sheetBrush.Dispose()
$sheetGold.Dispose()

foreach ($file in $created) {
    Write-Output "CREATED=$file"
}
