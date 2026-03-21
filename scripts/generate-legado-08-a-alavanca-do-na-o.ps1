param(
    [string]$OutputDir = "C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-08-a-alavanca-do-na-o\slides"
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
        (New-Color 216 2 2 6),
        (New-Color 208 5 5 9)
    )
    $Graphics.FillRectangle($overlayBrush, 0, 0, $Width, $Height)
    $overlayBrush.Dispose()

    $panelX = 82
    $panelY = 82
    $panelWidth = $Width - 164
    $panelHeight = $Height - 164

    $panelBrush = [System.Drawing.SolidBrush]::new((New-Color 198 8 8 14))
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

function Get-OptionalImagePath {
    param([string]$Root)

    if (-not (Test-Path $Root)) { return $null }
    $candidate = Get-ChildItem -Path $Root -File | Where-Object {
        $_.Extension -match '^\.(png|jpg|jpeg|webp)$'
    } | Sort-Object Name | Select-Object -First 1

    if ($null -eq $candidate) { return $null }
    return $candidate.FullName
}

function Get-VisibleImageBounds {
    param(
        [System.Drawing.Image]$Image,
        [int]$AlphaThreshold = 8
    )

    $ownsBitmap = $false
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
        if ($ownsBitmap) { $bitmap.Dispose() }
    }
}

function Draw-ImageInBox {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$ImagePath,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height
    )

    $image = [System.Drawing.Image]::FromFile($ImagePath)
    $sourceRect = Get-VisibleImageBounds -Image $image
    try {
        $scale = [Math]::Min($Width / $sourceRect.Width, $Height / $sourceRect.Height)
        $drawWidth = [float]($sourceRect.Width * $scale)
        $drawHeight = [float]($sourceRect.Height * $scale)
        $drawX = [float]($X + (($Width - $drawWidth) / 2))
        $drawY = [float]($Y + $Height - $drawHeight)
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
            [System.Drawing.GraphicsUnit]::Pixel
        )
    } finally {
        $image.Dispose()
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
        [System.Drawing.Font]$PlaceholderFont,
        [System.Drawing.Brush]$PlaceholderBrush
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
        $Graphics.FillRectangle($accentBrush, $X + 10, $Y + 10, 10, $Height - 20)
        $Graphics.DrawRectangle($outerPen, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($innerPen, $X + 10, $Y + 10, $Width - 20, $Height - 20)

        if (-not [string]::IsNullOrWhiteSpace($ImagePath) -and (Test-Path $ImagePath)) {
            $clipRect = [System.Drawing.Rectangle]::new(
                [int][Math]::Round($X + 10),
                [int][Math]::Round($Y + 10),
                [int][Math]::Round($Width - 20),
                [int][Math]::Round($Height - 20)
            )
            $state = $Graphics.Save()
            try {
                $Graphics.SetClip($clipRect)
                Draw-ImageInBox -Graphics $Graphics -ImagePath $ImagePath -X ($X + 20) -Y ($Y + 18) -Width ($Width - 40) -Height ($Height - 36)
            } finally {
                $Graphics.Restore($state)
            }
        } else {
            Draw-CenterText -Graphics $Graphics -Text "Imagem`nde capa" -Font $PlaceholderFont -Brush $PlaceholderBrush -X ($X + 26) -Y ($Y + 90) -Width ($Width - 52) -Height ($Height - 180)
        }
    } finally {
        $outerBrush.Dispose()
        $innerBrush.Dispose()
        $outerPen.Dispose()
        $innerPen.Dispose()
        $accentBrush.Dispose()
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
$bgLegacy = "C:\Users\Afonso\Downloads\GOL1.006\marketing\background\purpleback.jpg"
$assetRoot = "C:\Users\Afonso\Downloads\GOL1.006\marketing\legado-08-a-alavanca-do-na-o\assets"
if (-not (Test-Path $assetRoot)) { New-Item -ItemType Directory -Path $assetRoot -Force | Out-Null }
$coverImagePath = Get-OptionalImagePath -Root $assetRoot

$headlineFamily = Get-FontFamily -Candidates @("Cormorant Garamond", "Garamond", "Book Antiqua", "Palatino Linotype", "Georgia", "Times New Roman")
$bodyFamily = Get-FontFamily -Candidates @("Book Antiqua", "Palatino Linotype", "Georgia", "Cambria", "Times New Roman")

$eyebrowFont = [System.Drawing.Font]::new($bodyFamily, 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$heroTitleFont = [System.Drawing.Font]::new($headlineFamily, 78, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 68, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 56, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$bodyFont = [System.Drawing.Font]::new($bodyFamily, 48, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodyBoldFont = [System.Drawing.Font]::new($bodyFamily, 24, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$ctaFont = [System.Drawing.Font]::new($headlineFamily, 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$watermarkFont = [System.Drawing.Font]::new($headlineFamily, 116, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$whiteBrush = [System.Drawing.SolidBrush]::new((New-Color 240 245 242 237))
$offWhiteBrush = [System.Drawing.SolidBrush]::new((New-Color 220 236 233 227))
$mutedBrush = [System.Drawing.SolidBrush]::new((New-Color 186 210 206 199))
$eyebrowBrush = [System.Drawing.SolidBrush]::new((New-Color 165 255 236 196))
$goldSoftBrush = [System.Drawing.SolidBrush]::new((New-Color 220 234 206 110))
$goldWashBrush = [System.Drawing.SolidBrush]::new((New-Color 10 244 216 118))
$goldBrushSlide = Get-GoldBrush -Width $width -Height $height

$created = New-Object System.Collections.Generic.List[string]

$aacute = [char]0x00E1
$ccedilla = [char]0x00E7
$eacute = [char]0x00E9
$ecirc = [char]0x00EA
$iacute = [char]0x00ED
$oacute = [char]0x00F3
$uacute = [char]0x00FA
$atilde = [char]0x00E3

$quoteText = "Quando a mente`nestÃ¡ decidida,`no medo diminui."
$supportCore = "A mulher cujo nÃ£o deslocou a histÃ³ria de um paÃ­s inteiro."
$analysis1Title = "O que Viktor Frankl fez?"
$analysis1 = "Rosa Parks recusou-se a ceder seu lugar em um Ã´nibus segregado no Alabama.`nA partir daquele gesto, o boicote aos Ã´nibus de Montgomery ganhou forÃ§a e a luta pelos direitos civis entrou em outra escala."
$analysis1Close = "Foi um gesto mÃ­nimo com efeito sÃ­smico."
$analysis2Title = "Por que isso foi raro?"
$analysis2Body = "Porque sistemas injustos costumam parecer grandes demais para um gesto isolado.`nParks mostrou que um ato limpo, no ponto certo, pode deslocar a moral inteira de um sistema."
$analysis2Close = "Ela mostrou o poder histÃ³rico de um nÃ£o firme."
$brandLine = "Organize seu imp${eacute}rio."
$sheetLine = "Prancha de revis${atilde}o - 4 slides prontos"

# Slide 1
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgLegacy -Width $width -Height $height
Draw-CenterText -Graphics $graphics -Text "Legado" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 48 -Width 912 -Height 110
Draw-Pill -Graphics $graphics -Text "Legado 08  |  Rosa Parks" -Font $bodyBoldFont -X 318 -Y 188 -Width 444 -Height 54
Draw-CenterText -Graphics $graphics -Text "A Alavanca`ndo NÃ£o" -Font $heroTitleFont -Brush $goldBrushSlide -X 180 -Y 262 -Width 720 -Height 174
Draw-CenterText -Graphics $graphics -Text $quoteText -Font $bodyFont -Brush $offWhiteBrush -X 94 -Y 468 -Width 584 -Height 272
Draw-CenterText -Graphics $graphics -Text $supportCore -Font $titleMediumFont -Brush $whiteBrush -X 90 -Y 790 -Width 596 -Height 176
Draw-FeatureFrame -Graphics $graphics -X 720 -Y 492 -Width 208 -Height 378 -ImagePath $coverImagePath -PlaceholderFont $titleMediumFont -PlaceholderBrush $mutedBrush
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide1 = Join-Path $OutputDir "slide-01-capa.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide1
$created.Add($slide1)

# Slide 2
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgLegacy -Width $width -Height $height
Draw-CenterText -Graphics $graphics -Text "Feito" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 498 -Width 912 -Height 130
Draw-EditorialPanel -Graphics $graphics -X 106 -Y 210 -Width 868 -Height 768
Draw-CenterText -Graphics $graphics -Text $analysis1Title -Font $titleLargeFont -Brush $goldBrushSlide -X 126 -Y 232 -Width 828 -Height 132
Draw-CenterText -Graphics $graphics -Text $analysis1 -Font $bodyFont -Brush $offWhiteBrush -X 118 -Y 386 -Width 844 -Height 412
Draw-CenterText -Graphics $graphics -Text $analysis1Close -Font $titleMediumFont -Brush $whiteBrush -X 136 -Y 834 -Width 808 -Height 128
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide2 = Join-Path $OutputDir "slide-02-analise-01.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide2
$created.Add($slide2)

# Slide 3
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgLegacy -Width $width -Height $height
Draw-CenterText -Graphics $graphics -Text "Raridade" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 498 -Width 912 -Height 130
Draw-EditorialPanel -Graphics $graphics -X 106 -Y 210 -Width 868 -Height 776
Draw-CenterText -Graphics $graphics -Text $analysis2Title -Font $titleLargeFont -Brush $goldBrushSlide -X 120 -Y 236 -Width 840 -Height 136
Draw-CenterText -Graphics $graphics -Text $analysis2Body -Font $bodyFont -Brush $offWhiteBrush -X 116 -Y 394 -Width 848 -Height 408
Draw-CenterText -Graphics $graphics -Text $analysis2Close -Font $titleMediumFont -Brush $whiteBrush -X 136 -Y 840 -Width 808 -Height 126
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide3 = Join-Path $OutputDir "slide-03-analise-02.png"
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide3
$created.Add($slide3)

# Slide 4
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgLegacy -Width $width -Height $height
$watermarkBrush2 = [System.Drawing.SolidBrush]::new((New-Color 18 244 216 118))
try {
    Draw-CenterText -Graphics $graphics -Text "Legado" -Font $watermarkFont -Brush $watermarkBrush2 -X 84 -Y 456 -Width 912 -Height 150
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
Draw-CenterText -Graphics $graphics -Text $brandLine -Font $titleMediumFont -Brush $whiteBrush -X 180 -Y 868 -Width 720 -Height 68
Draw-Pill -Graphics $graphics -Text "glyph.life" -Font $bodyBoldFont -X 386 -Y 972 -Width 308 -Height 54
Draw-CenterText -Graphics $graphics -Text "Legado 08  |  Rosa Parks" -Font $eyebrowFont -Brush $eyebrowBrush -X 178 -Y 1060 -Width 724 -Height 28
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
Draw-CenterText -Graphics $contactGraphics -Text "LEGADO 08  |  A ALAVANCA DO NÃ£O" -Font ([System.Drawing.Font]::new($headlineFamily, 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $sheetGold -X 180 -Y 42 -Width 1240 -Height 60
Draw-CenterText -Graphics $contactGraphics -Text $sheetLine -Font ([System.Drawing.Font]::new($bodyFamily, 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $sheetBrush -X 300 -Y 108 -Width 1000 -Height 32

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


