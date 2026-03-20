param(
    [string]$OutputDir = "C:\Users\Afonso\Downloads\GOL1.006\marketing\tatica-01-10-areas\slides"
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
        (New-Color 186 2 3 6),
        (New-Color 156 7 8 11)
    )
    $Graphics.FillRectangle($overlayBrush, 0, 0, $Width, $Height)
    $overlayBrush.Dispose()

    $panelX = 82
    $panelY = 82
    $panelWidth = $Width - 164
    $panelHeight = $Height - 164

    $panelBrush = [System.Drawing.SolidBrush]::new((New-Color 164 5 6 9))
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
        [int]$Height,
        [System.Drawing.Brush]$Brush = $null
    )

    $fill = [System.Drawing.SolidBrush]::new((New-Color 62 13 14 18))
    $pen = [System.Drawing.Pen]::new((New-Color 220 212 175 55), 1.6)
    $textBrush = if ($Brush) { $Brush } else { [System.Drawing.SolidBrush]::new((New-Color 245 247 230 194)) }
    try {
        $Graphics.FillRectangle($fill, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($pen, $X, $Y, $Width, $Height)
        Draw-CenterText -Graphics $Graphics -Text $Text -Font $Font -Brush $textBrush -X $X -Y $Y -Width $Width -Height $Height
    } finally {
        $fill.Dispose()
        $pen.Dispose()
        if (-not $Brush) { $textBrush.Dispose() }
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

    $panelBrush = [System.Drawing.SolidBrush]::new((New-Color 76 8 10 14))
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

function Draw-ArenaCard {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [string]$Title,
        [string]$Body,
        [System.Drawing.Font]$TitleFont,
        [System.Drawing.Font]$BodyFont,
        [System.Drawing.Brush]$TitleBrush,
        [System.Drawing.Brush]$BodyBrush
    )

    Draw-EditorialPanel -Graphics $Graphics -X $X -Y $Y -Width $Width -Height $Height
    Draw-CenterText -Graphics $Graphics -Text $Title -Font $TitleFont -Brush $TitleBrush -X ($X + 20) -Y ($Y + 28) -Width ($Width - 40) -Height 72
    Draw-CenterText -Graphics $Graphics -Text $Body -Font $BodyFont -Brush $BodyBrush -X ($X + 20) -Y ($Y + 106) -Width ($Width - 40) -Height ($Height - 132)
}

function Draw-ArrowDown {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$CenterX,
        [float]$TopY,
        [float]$BottomY,
        [System.Drawing.Color]$Color
    )

    $pen = [System.Drawing.Pen]::new($Color, 3.0)
    try {
        $Graphics.DrawLine($pen, $CenterX, $TopY, $CenterX, $BottomY)
        $Graphics.DrawLine($pen, $CenterX, $BottomY, $CenterX - 12, $BottomY - 16)
        $Graphics.DrawLine($pen, $CenterX, $BottomY, $CenterX + 12, $BottomY - 16)
    } finally {
        $pen.Dispose()
    }
}

function Draw-TacticalRadar {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$CenterX,
        [float]$CenterY,
        [float]$Radius,
        [int[]]$Values,
        [string[]]$Labels,
        [int[]]$HighlightIndices,
        [System.Drawing.Font]$LabelFont,
        [System.Drawing.Font]$ValueFont
    )

    $count = $Values.Length
    $gridPen = [System.Drawing.Pen]::new((New-Color 105 255 245 220), 1.1)
    $axisPen = [System.Drawing.Pen]::new((New-Color 70 212 175 55), 1.0)
    $polyPen = [System.Drawing.Pen]::new((New-Color 245 244 216 118), 3.0)
    $polyBrush = [System.Drawing.SolidBrush]::new((New-Color 88 212 175 55))
    $labelBrush = [System.Drawing.SolidBrush]::new((New-Color 220 242 238 232))
    $highlightBrush = [System.Drawing.SolidBrush]::new((New-Color 255 228 108 64))
    $valueBrush = [System.Drawing.SolidBrush]::new((New-Color 255 255 255 255))
    $dotBrush = [System.Drawing.SolidBrush]::new((New-Color 255 253 242 191))

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

            $isHighlight = $HighlightIndices -contains $i
            $markerBrush = if ($isHighlight) { $highlightBrush } else { $dotBrush }
            $markerSize = if ($isHighlight) { 14 } else { 10 }
            $Graphics.FillEllipse($markerBrush, $shapeX - ($markerSize / 2), $shapeY - ($markerSize / 2), $markerSize, $markerSize)

            $labelRadius = $Radius + 74
            $labelX = [float]($CenterX + [Math]::Cos($angle) * $labelRadius - 78)
            $labelY = [float]($CenterY + [Math]::Sin($angle) * $labelRadius - 18)
            Draw-CenterText -Graphics $Graphics -Text $Labels[$i] -Font $LabelFont -Brush $labelBrush -X $labelX -Y $labelY -Width 156 -Height 34

            $valueX = [float]($CenterX + [Math]::Cos($angle) * ($shapeRadius + 28) - 20)
            $valueY = [float]($CenterY + [Math]::Sin($angle) * ($shapeRadius + 28) - 18)
            Draw-CenterText -Graphics $Graphics -Text ([string]$Values[$i]) -Font $ValueFont -Brush $valueBrush -X $valueX -Y $valueY -Width 40 -Height 36
        }

        $Graphics.FillPolygon($polyBrush, $shapePoints)
        $Graphics.DrawPolygon($polyPen, $shapePoints)
    } finally {
        $gridPen.Dispose()
        $axisPen.Dispose()
        $polyPen.Dispose()
        $polyBrush.Dispose()
        $labelBrush.Dispose()
        $highlightBrush.Dispose()
        $valueBrush.Dispose()
        $dotBrush.Dispose()
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
$heroTitleFont = [System.Drawing.Font]::new($headlineFamily, 64, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 48, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleSmallFont = [System.Drawing.Font]::new($headlineFamily, 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$bodyFont = [System.Drawing.Font]::new($bodyFamily, 26, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 22, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodyBoldFont = [System.Drawing.Font]::new($bodyFamily, 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$ctaFont = [System.Drawing.Font]::new($headlineFamily, 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$watermarkFont = [System.Drawing.Font]::new($headlineFamily, 112, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$radarLabelFont = [System.Drawing.Font]::new($bodyFamily, 16, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$radarValueFont = [System.Drawing.Font]::new($bodyFamily, 16, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$whiteBrush = [System.Drawing.SolidBrush]::new((New-Color 240 245 242 237))
$offWhiteBrush = [System.Drawing.SolidBrush]::new((New-Color 218 236 233 227))
$mutedBrush = [System.Drawing.SolidBrush]::new((New-Color 186 210 206 199))
$eyebrowBrush = [System.Drawing.SolidBrush]::new((New-Color 165 255 236 196))
$goldSoftBrush = [System.Drawing.SolidBrush]::new((New-Color 220 234 206 110))
$goldWashBrush = [System.Drawing.SolidBrush]::new((New-Color 24 244 216 118))
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
$otilde = [char]0x00F5
$uacute = [char]0x00FA

$labels = @(
    "Consci${ecirc}ncia",
    "Espa${ccedilla}o mental",
    "Espiritual",
    "Prop${oacute}sito",
    "Projetos",
    "Conex${otilde}es",
    "Finan${ccedilla}as",
    "Trabalho",
    "Hobbies",
    "F${iacute}sico"
)
$values = @(6,3,6,7,6,4,6,7,5,4)
$highlightIndices = @(1,5,9)

$created = New-Object System.Collections.Generic.List[string]

# Slide 1
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
Draw-CenterText -Graphics $graphics -Text "T${aacute}tica" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 122 -Width 912 -Height 168
Draw-CenterText -Graphics $graphics -Text "N${atilde}o tente subir`n10 degraus de`numa vez." -Font $heroTitleFont -Brush $goldBrushSlide -X 164 -Y 360 -Width 752 -Height 214
Draw-CenterText -Graphics $graphics -Text "Quem tenta consertar tudo no mesmo dia`ndestr${oacute}i o pr${oacute}prio foco." -Font $bodyFont -Brush $offWhiteBrush -X 198 -Y 634 -Width 684 -Height 92
Draw-Pill -Graphics $graphics -Text "T${aacute}tica 01" -Font $bodyBoldFont -X 416 -Y 802 -Width 248 -Height 54
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide1 = Join-Path $OutputDir "slide-01-capa.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide1
$created.Add($slide1)

# Slide 2
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
Draw-CenterText -Graphics $graphics -Text "Radar" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 248 -Width 912 -Height 150
Draw-CenterText -Graphics $graphics -Text "Encontre as 3 ${aacute}reas`nmais fracas." -Font $titleLargeFont -Brush $goldBrushSlide -X 186 -Y 190 -Width 708 -Height 128
Draw-TacticalRadar -Graphics $graphics -CenterX 540 -CenterY 618 -Radius 206 -Values $values -Labels $labels -HighlightIndices $highlightIndices -LabelFont $radarLabelFont -ValueFont $radarValueFont
Draw-Pill -Graphics $graphics -Text "Espa${ccedilla}o mental 3" -Font $bodyBoldFont -X 148 -Y 902 -Width 244 -Height 48
Draw-Pill -Graphics $graphics -Text "Conex${otilde}es 4" -Font $bodyBoldFont -X 418 -Y 902 -Width 244 -Height 48
Draw-Pill -Graphics $graphics -Text "F${iacute}sico 4" -Font $bodyBoldFont -X 688 -Y 902 -Width 244 -Height 48
Draw-CenterText -Graphics $graphics -Text "O Radar serve para localizar onde a sua energia est${aacute} vazando.`nDiagn${oacute}stico antes de disciplina." -Font $bodySmallFont -Brush $offWhiteBrush -X 192 -Y 990 -Width 696 -Height 74
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide2 = Join-Path $OutputDir "slide-02-radar.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide2
$created.Add($slide2)

# Slide 3
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
Draw-CenterText -Graphics $graphics -Text "Arena" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 248 -Width 912 -Height 150
Draw-CenterText -Graphics $graphics -Text "Abra 1 Arena para`ncada ponto fraco." -Font $titleLargeFont -Brush $goldBrushSlide -X 176 -Y 180 -Width 728 -Height 124

$columns = @(
    @{ X = 104; Title = "Arena 01"; Tag = "Espa${ccedilla}o mental"; Body = "1 frente focada`npara mente, ru${iacute}do`ne clareza." },
    @{ X = 382; Title = "Arena 02"; Tag = "Conex${otilde}es"; Body = "1 frente focada`npara presen${ccedilla}a,`nlimites e v${iacute}nculo." },
    @{ X = 660; Title = "Arena 03"; Tag = "F${iacute}sico"; Body = "1 frente focada`npara corpo, sono`ne energia base." }
)

foreach ($col in $columns) {
    Draw-Pill -Graphics $graphics -Text $col.Tag -Font $bodyBoldFont -X ([int]$col.X) -Y 352 -Width 220 -Height 48
    Draw-ArrowDown -Graphics $graphics -CenterX ($col.X + 110) -TopY 406 -BottomY 470 -Color (New-Color 230 212 175 55)
    Draw-ArenaCard -Graphics $graphics -X $col.X -Y 498 -Width 220 -Height 260 -Title $col.Title -Body $col.Body -TitleFont $titleSmallFont -BodyFont $bodySmallFont -TitleBrush $goldBrushSlide -BodyBrush $offWhiteBrush
}

Draw-CenterText -Graphics $graphics -Text "3 ${aacute}reas fracas. 3 Arenas focadas. Ignore o resto at${eacute} estabilizar." -Font $bodyFont -Brush $offWhiteBrush -X 126 -Y 834 -Width 828 -Height 70
Draw-CenterText -Graphics $graphics -Text "Foco ${eacute} sacrif${iacute}cio." -Font $titleMediumFont -Brush $whiteBrush -X 220 -Y 918 -Width 640 -Height 64
Draw-Pill -Graphics $graphics -Text "3 ${aacute}reas  ->  3 Arenas  ->  1 ciclo" -Font $bodyBoldFont -X 282 -Y 1004 -Width 516 -Height 52
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide3 = Join-Path $OutputDir "slide-03-arenas.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide3
$created.Add($slide3)

# Slide 4
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgObsidian -Width $width -Height $height
$watermarkBrush2 = [System.Drawing.SolidBrush]::new((New-Color 18 244 216 118))
try {
    Draw-CenterText -Graphics $graphics -Text "Foco" -Font $watermarkFont -Brush $watermarkBrush2 -X 84 -Y 456 -Width 912 -Height 150
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
Draw-CenterText -Graphics $graphics -Text "T${aacute}tica 01  |  Nivelar as 10 ${aacute}reas" -Font $eyebrowFont -Brush $eyebrowBrush -X 220 -Y 1060 -Width 640 -Height 28
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
Draw-CenterText -Graphics $contactGraphics -Text "T${Aacute}TICA 01  |  NIVELAR AS 10 ${Aacute}REAS" -Font ([System.Drawing.Font]::new($headlineFamily, 42, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $sheetGold -X 180 -Y 42 -Width 1240 -Height 60
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
$titleSmallFont.Dispose()
$bodyFont.Dispose()
$bodySmallFont.Dispose()
$bodyBoldFont.Dispose()
$ctaFont.Dispose()
$watermarkFont.Dispose()
$radarLabelFont.Dispose()
$radarValueFont.Dispose()
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

