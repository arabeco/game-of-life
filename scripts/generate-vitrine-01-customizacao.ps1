param(
    [string]$OutputDir = "C:\Users\Afonso\Downloads\GOL1.006\marketing\vitrine-01-customizacao\slides",
    [string]$Screen1Path = "",
    [string]$Screen2Path = ""
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
        [switch]$AlignBottom
    )

    $image = [System.Drawing.Image]::FromFile($ImagePath)
    $attributes = [System.Drawing.Imaging.ImageAttributes]::new()
    try {
        $scale = if ($Cover) {
            [Math]::Max($Width / $image.Width, $Height / $image.Height)
        } else {
            [Math]::Min($Width / $image.Width, $Height / $image.Height)
        }

        $drawWidth = [float]($image.Width * $scale)
        $drawHeight = [float]($image.Height * $scale)
        $drawX = [float]($X + (($Width - $drawWidth) / 2))
        $drawY = if ($AlignBottom) {
            [float]($Y + $Height - $drawHeight)
        } else {
            [float]($Y + (($Height - $drawHeight) / 2))
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
            0,
            0,
            $image.Width,
            $image.Height,
            [System.Drawing.GraphicsUnit]::Pixel,
            $attributes
        )
    } finally {
        $attributes.Dispose()
        $image.Dispose()
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

    $topColor = if ($Tone -eq "safira") { (New-Color 172 4 14 28) } else { (New-Color 176 2 3 6) }
    $bottomColor = if ($Tone -eq "safira") { (New-Color 150 6 10 20) } else { (New-Color 148 7 8 11) }
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

    $panelBrush = [System.Drawing.SolidBrush]::new((New-Color 162 5 6 9))
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

function New-BodyPanel {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height
    )

    $brush = [System.Drawing.SolidBrush]::new((New-Color 80 5 7 10))
    $pen = [System.Drawing.Pen]::new((New-Color 132 212 175 55), 1.2)
    try {
        $Graphics.FillRectangle($brush, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($pen, $X, $Y, $Width, $Height)
    } finally {
        $brush.Dispose()
        $pen.Dispose()
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

    $outerPen = [System.Drawing.Pen]::new((New-Color 214 237 205 114), 2.0)
    $innerPen = [System.Drawing.Pen]::new((New-Color 138 255 236 196), 1.0)
    try {
        $Graphics.DrawRectangle($outerPen, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($innerPen, $X + 10, $Y + 10, $Width - 20, $Height - 20)
    } finally {
        $outerPen.Dispose()
        $innerPen.Dispose()
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

function Draw-PhoneSlot {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$X,
        [int]$Y,
        [int]$Width,
        [int]$Height,
        [string]$ImagePath = "",
        [string]$Title = "",
        [string]$Subtitle = "",
        [System.Drawing.Font]$TitleFont,
        [System.Drawing.Font]$SubtitleFont,
        [System.Drawing.Brush]$TitleBrush,
        [System.Drawing.Brush]$SubtitleBrush,
        [string]$LogoPath = ""
    )

    $shellBrush = [System.Drawing.SolidBrush]::new((New-Color 148 8 10 14))
    $screenBrush = [System.Drawing.SolidBrush]::new((New-Color 255 7 9 12))
    $outerPen = [System.Drawing.Pen]::new((New-Color 230 240 208 112), 2.4)
    $innerPen = [System.Drawing.Pen]::new((New-Color 130 255 236 196), 1.0)
    $notchBrush = [System.Drawing.SolidBrush]::new((New-Color 255 18 20 24))

    try {
        $Graphics.FillRectangle($shellBrush, $X, $Y, $Width, $Height)
        $Graphics.FillRectangle($screenBrush, $X + 12, $Y + 12, $Width - 24, $Height - 24)
        $Graphics.DrawRectangle($outerPen, $X, $Y, $Width, $Height)
        $Graphics.DrawRectangle($innerPen, $X + 12, $Y + 12, $Width - 24, $Height - 24)
        $Graphics.FillRectangle($notchBrush, $X + [int]($Width * 0.28), $Y + 12, [int]($Width * 0.44), 10)

        $screenRect = [System.Drawing.Rectangle]::new($X + 16, $Y + 28, $Width - 32, $Height - 44)
        $state = $Graphics.Save()
        try {
            $Graphics.SetClip($screenRect)
            if ($ImagePath -and (Test-Path $ImagePath)) {
                Draw-ImageInBox -Graphics $Graphics -ImagePath $ImagePath -X $screenRect.X -Y $screenRect.Y -Width $screenRect.Width -Height $screenRect.Height -Opacity 1.0
            } else {
                $placeholderBrush = [System.Drawing.SolidBrush]::new((New-Color 255 11 14 18))
                $Graphics.FillRectangle($placeholderBrush, $screenRect)
                $placeholderBrush.Dispose()

                if ($LogoPath -and (Test-Path $LogoPath)) {
                    $logo = [System.Drawing.Image]::FromFile($LogoPath)
                    try {
                        $Graphics.DrawImage($logo, $screenRect.X + 42, $screenRect.Y + 74, $screenRect.Width - 84, $screenRect.Width - 84)
                    } finally {
                        $logo.Dispose()
                    }
                }

                if ($Title) {
                    Draw-CenterText -Graphics $Graphics -Text $Title -Font $TitleFont -Brush $TitleBrush -X ($screenRect.X + 24) -Y ($screenRect.Y + 260) -Width ($screenRect.Width - 48) -Height 84
                }
                if ($Subtitle) {
                    Draw-CenterText -Graphics $Graphics -Text $Subtitle -Font $SubtitleFont -Brush $SubtitleBrush -X ($screenRect.X + 30) -Y ($screenRect.Y + 350) -Width ($screenRect.Width - 60) -Height 90
                }
            }
        } finally {
            $Graphics.Restore($state)
        }
    } finally {
        $shellBrush.Dispose()
        $screenBrush.Dispose()
        $outerPen.Dispose()
        $innerPen.Dispose()
        $notchBrush.Dispose()
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

$root = Split-Path -Parent $OutputDir
if (-not (Test-Path $root)) { New-Item -ItemType Directory -Path $root -Force | Out-Null }
if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }

$width = 1080
$height = 1350

$logoPath = "C:\Users\Afonso\Downloads\GOL1.006\public\logo-diamond.png"
$bgObsidian = "C:\Users\Afonso\Downloads\GOL1.006\marketing\background\blackback.jpg"
$bgSapphire = "C:\Users\Afonso\Downloads\GOL1.006\marketing\background\darkblueback.jpg"

$headlineFamily = Get-FontFamily -Candidates @("Palatino Linotype", "Georgia", "Times New Roman")
$bodyFamily = Get-FontFamily -Candidates @("Segoe UI", "Arial", "Tahoma")

$eyebrowFont = [System.Drawing.Font]::new($bodyFamily, 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$heroTitleFont = [System.Drawing.Font]::new($headlineFamily, 60, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleHugeFont = [System.Drawing.Font]::new($headlineFamily, 68, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 48, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 36, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$cardTitleFont = [System.Drawing.Font]::new($headlineFamily, 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleSmallFont = [System.Drawing.Font]::new($headlineFamily, 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$bodyFont = [System.Drawing.Font]::new($bodyFamily, 25, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 21, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bodyBoldFont = [System.Drawing.Font]::new($bodyFamily, 23, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$ctaFont = [System.Drawing.Font]::new($headlineFamily, 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$watermarkFont = [System.Drawing.Font]::new($headlineFamily, 132, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$whiteBrush = [System.Drawing.SolidBrush]::new((New-Color 238 245 242 237))
$offWhiteBrush = [System.Drawing.SolidBrush]::new((New-Color 215 236 233 227))
$mutedBrush = [System.Drawing.SolidBrush]::new((New-Color 180 210 206 199))
$eyebrowBrush = [System.Drawing.SolidBrush]::new((New-Color 165 255 236 196))
$goldSoftBrush = [System.Drawing.SolidBrush]::new((New-Color 220 234 206 110))
$goldWashBrush = [System.Drawing.SolidBrush]::new((New-Color 24 244 216 118))
$ghostBrush = [System.Drawing.SolidBrush]::new((New-Color 26 255 255 255))
$goldBrushSlide = Get-GoldBrush -Width $width -Height $height

$Aacute = [char]0x00C1
$Atilde = [char]0x00C3
$Ccedilla = [char]0x00C7
$Eacute = [char]0x00C9
$Iacute = [char]0x00CD
$Oacute = [char]0x00D3
$aacute = [char]0x00E1
$atilde = [char]0x00E3
$ccedilla = [char]0x00E7
$eacute = [char]0x00E9
$ecirc = [char]0x00EA
$iacute = [char]0x00ED
$oacute = [char]0x00F3

$phoneSlotWidth = 292
$phoneSlotHeight = 760
$textPanelWidth = 420
$textPanelHeight = 410
$proofPhoneSlotWidth = 260
$proofPhoneSlotHeight = 660

$created = New-Object System.Collections.Generic.List[string]

$proofRoot = Split-Path -Parent $OutputDir
$proofFiles = New-Object System.Collections.Generic.List[string]

function Add-ProofImagePath {
    param(
        [System.Collections.Generic.List[string]]$List,
        [string]$Path
    )

    if (-not $Path) { return }
    if (-not (Test-Path $Path)) { return }
    if ($List.Contains($Path)) { return }
    $List.Add($Path)
}

function Get-PrintLabel {
    param([string]$Path)

    $base = [System.IO.Path]::GetFileNameWithoutExtension($Path).ToLowerInvariant()
    switch ($base) {
        "inventario" { return "Invent${aacute}rio" }
        "codexes" { return "Codexes" }
        default {
            $words = ($base -replace "[_-]+", " ").Split(" ", [System.StringSplitOptions]::RemoveEmptyEntries)
            $titleWords = foreach ($word in $words) {
                if ($word.Length -eq 1) {
                    $word.ToUpper()
                } else {
                    $word.Substring(0, 1).ToUpper() + $word.Substring(1).ToLower()
                }
            }
            return ($titleWords -join " ")
        }
    }
}

Add-ProofImagePath -List $proofFiles -Path $Screen1Path
Add-ProofImagePath -List $proofFiles -Path $Screen2Path

Get-ChildItem -LiteralPath $proofRoot -File -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Extension -match '^\.(png|jpg|jpeg)$' -and
        $_.Name -notlike 'slide-*' -and
        $_.Name -notlike 'contact-sheet*'
    } |
    Sort-Object Name |
    ForEach-Object {
        Add-ProofImagePath -List $proofFiles -Path $_.FullName
    }

$proofImages = @($proofFiles.ToArray())

# PadrÃ£o-base da Vitrine: uma coluna editorial e uma coluna de destaque
$vitrineFeatureCardX = 624
$vitrineFeatureCardY = 278
$vitrineFeatureCardWidth = 286
$vitrineFeatureCardHeight = 604
$vitrinePhoneSlotX = 126
$vitrinePhoneSlotY = 302
$vitrinePhoneSlotWidth = 294
$vitrinePhoneSlotHeight = 684
$vitrineTextPanelX = 468
$vitrineTextPanelY = 288
$vitrineTextPanelWidth = 436
$vitrineTextPanelHeight = 604
$slideNumber = 1

# Slide 1
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgSapphire -Width $width -Height $height -Tone "safira"
Draw-CenterText -Graphics $graphics -Text "Arsenal" -Font $watermarkFont -Brush $goldWashBrush -X 84 -Y 132 -Width 912 -Height 180
Draw-CenterText -Graphics $graphics -Text "Sua identidade`nevolui com a`nsua execu${ccedilla}${atilde}o." -Font $heroTitleFont -Brush $goldBrushSlide -X 164 -Y 350 -Width 752 -Height 250
Draw-CenterText -Graphics $graphics -Text "No GLYPH, bordas, skins e prest${iacute}gio visual`ndeixam de ser detalhe. Seu perfil passa a`nmostrar a sua patente." -Font $bodyFont -Brush $offWhiteBrush -X 194 -Y 650 -Width 692 -Height 112
Draw-Pill -Graphics $graphics -Text "Vitrine 01" -Font $bodyBoldFont -X 296 -Y 824 -Width 208 -Height 52
Draw-Pill -Graphics $graphics -Text "Customiza${ccedilla}${atilde}o" -Font $bodyBoldFont -X 524 -Y 824 -Width 252 -Height 52
Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide1 = Join-Path $OutputDir ("slide-{0:d2}-capa.png" -f $slideNumber)
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide1
$created.Add($slide1)
$slideNumber++

# Slide 2
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgSapphire -Width $width -Height $height -Tone "safira"
Draw-CenterText -Graphics $graphics -Text "Glyph" -Font $watermarkFont -Brush $goldWashBrush -X 86 -Y 118 -Width 908 -Height 180

Draw-EditorialTextPanel -Graphics $graphics -X 208 -Y 312 -Width 664 -Height 592

$logo3 = [System.Drawing.Image]::FromFile($logoPath)
try {
    $graphics.DrawImage($logo3, 474, 346, 132, 132)
} finally {
    $logo3.Dispose()
}

Draw-CenterText -Graphics $graphics -Text "O GLYPH transforma`nrotina em sistema`nvis${iacute}vel." -Font $titleLargeFont -Brush $goldBrushSlide -X 276 -Y 500 -Width 528 -Height 164
Draw-CenterText -Graphics $graphics -Text "Voc${ecirc} planeja, executa e fecha o ciclo.`nO app organiza a sua evolu${ccedilla}${atilde}o em sinais claros,`nsem virar s${oacute} mais uma lista solta." -Font $bodyFont -Brush $offWhiteBrush -X 286 -Y 686 -Width 508 -Height 146
Draw-CenterText -Graphics $graphics -Text "Menos ru${iacute}do. Mais dire${ccedilla}${atilde}o." -Font $titleSmallFont -Brush $whiteBrush -X 300 -Y 828 -Width 480 -Height 60

Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush
$slide2 = Join-Path $OutputDir ("slide-{0:d2}-sobre-app.png" -f $slideNumber)
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slide2
$created.Add($slide2)
$slideNumber++

# Slides de prova: apenas prints reais, em quantidade variavel
if ($proofImages.Count -eq 0) {
    $proofImages = @("", "")
}

$proofPageCount = [int][Math]::Ceiling($proofImages.Count / 2.0)
for ($proofPage = 0; $proofPage -lt $proofPageCount; $proofPage++) {
    $startIndex = $proofPage * 2
    $currentPair = @()
    for ($j = $startIndex; $j -lt [Math]::Min($startIndex + 2, $proofImages.Count); $j++) {
        $currentPair += $proofImages[$j]
    }

    $canvas = New-Canvas -Width $width -Height $height
    $bitmap = $canvas.Bitmap
    $graphics = $canvas.Graphics
    Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgSapphire -Width $width -Height $height -Tone "safira"
    Draw-CenterText -Graphics $graphics -Text "Arsenal em uso." -Font $titleLargeFont -Brush $goldBrushSlide -X 166 -Y 156 -Width 748 -Height 96

    if ($currentPair.Count -ge 2) {
        $leftPath = $currentPair[0]
        $rightPath = $currentPair[1]
        Draw-PhoneSlot -Graphics $graphics -X 164 -Y 318 -Width $proofPhoneSlotWidth -Height 560 -ImagePath $leftPath -Title "Print 1" -Subtitle "Tela real do app" -TitleFont $titleSmallFont -SubtitleFont $bodySmallFont -TitleBrush $goldBrushSlide -SubtitleBrush $mutedBrush -LogoPath $logoPath
        Draw-PhoneSlot -Graphics $graphics -X 656 -Y 318 -Width $proofPhoneSlotWidth -Height 560 -ImagePath $rightPath -Title "Print 2" -Subtitle "Tela real do app" -TitleFont $titleSmallFont -SubtitleFont $bodySmallFont -TitleBrush $goldBrushSlide -SubtitleBrush $mutedBrush -LogoPath $logoPath
        Draw-Pill -Graphics $graphics -Text (Get-PrintLabel -Path $leftPath) -Font $bodyBoldFont -X 198 -Y 904 -Width 194 -Height 46
        Draw-Pill -Graphics $graphics -Text (Get-PrintLabel -Path $rightPath) -Font $bodyBoldFont -X 690 -Y 904 -Width 194 -Height 46
    } elseif ($currentPair.Count -eq 1) {
        $singlePath = $currentPair[0]
        Draw-PhoneSlot -Graphics $graphics -X 393 -Y 290 -Width 294 -Height 640 -ImagePath $singlePath -Title "Print real" -Subtitle "Tela do app" -TitleFont $titleSmallFont -SubtitleFont $bodySmallFont -TitleBrush $goldBrushSlide -SubtitleBrush $mutedBrush -LogoPath $logoPath
        Draw-Pill -Graphics $graphics -Text (Get-PrintLabel -Path $singlePath) -Font $bodyBoldFont -X 422 -Y 968 -Width 236 -Height 46
    }

    Draw-SmallBrand -Graphics $graphics -LogoPath $logoPath -Font $ctaFont -Brush $goldSoftBrush

    $proofSuffix = if ($proofPageCount -gt 1) {
        ("prova-{0:d2}" -f ($proofPage + 1))
    } else {
        "prova"
    }

    $proofPath = Join-Path $OutputDir ("slide-{0:d2}-{1}.png" -f $slideNumber, $proofSuffix)
    Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $proofPath
    $created.Add($proofPath)
    $slideNumber++
}

# Slide final
$canvas = New-Canvas -Width $width -Height $height
$bitmap = $canvas.Bitmap
$graphics = $canvas.Graphics
Draw-BackgroundBase -Graphics $graphics -BackgroundPath $bgSapphire -Width $width -Height $height -Tone "safira"
$watermarkBrush2 = [System.Drawing.SolidBrush]::new((New-Color 16 244 216 118))
try {
    Draw-CenterText -Graphics $graphics -Text "Vitrine" -Font $watermarkFont -Brush $watermarkBrush2 -X 78 -Y 448 -Width 924 -Height 150
} finally {
    $watermarkBrush2.Dispose()
}

$logo2 = [System.Drawing.Image]::FromFile($logoPath)
try {
    $graphics.DrawImage($logo2, 296, 210, 488, 488)
} finally {
    $logo2.Dispose()
}
Draw-CenterText -Graphics $graphics -Text "GLYPH" -Font ([System.Drawing.Font]::new($headlineFamily, 86, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $goldBrushSlide -X 170 -Y 770 -Width 740 -Height 94
Draw-CenterText -Graphics $graphics -Text "Organize seu imp${eacute}rio." -Font $titleMediumFont -Brush $whiteBrush -X 180 -Y 868 -Width 720 -Height 68
Draw-Pill -Graphics $graphics -Text "glyph.life" -Font $bodyBoldFont -X 386 -Y 972 -Width 308 -Height 54
Draw-CenterText -Graphics $graphics -Text "Vitrine 01  |  Arsenal e customiza${ccedilla}${atilde}o" -Font $eyebrowFont -Brush $eyebrowBrush -X 210 -Y 1060 -Width 660 -Height 28
$slideFinal = Join-Path $OutputDir ("slide-{0:d2}-fecho.png" -f $slideNumber)
Save-Slide -Bitmap $bitmap -Graphics $graphics -Path $slideFinal
$created.Add($slideFinal)

# Contact sheet
$slideCount = $created.Count
$thumbWidth = 560
$thumbHeight = 700
$gridColumns = 2
$gridRows = [int][Math]::Ceiling($slideCount / [double]$gridColumns)
$contactHeight = [int](200 + ($gridRows * 770) + 180)
$contact = New-Canvas -Width 1600 -Height $contactHeight
$contactBitmap = $contact.Bitmap
$contactGraphics = $contact.Graphics
$contactGraphics.Clear((New-Color 255 8 8 10))
$sheetBrush = [System.Drawing.SolidBrush]::new((New-Color 255 240 236 226))
$sheetGold = Get-GoldBrush -Width 1600 -Height 2200
Draw-CenterText -Graphics $contactGraphics -Text "VITRINE 01  |  CUSTOMIZA${Ccedilla}${Atilde}O DE PERFIL" -Font ([System.Drawing.Font]::new($headlineFamily, 44, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $sheetGold -X 180 -Y 42 -Width 1240 -Height 60
Draw-CenterText -Graphics $contactGraphics -Text "Prancha de revis${atilde}o - $slideCount slides prontos" -Font ([System.Drawing.Font]::new($bodyFamily, 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)) -Brush $sheetBrush -X 300 -Y 108 -Width 1000 -Height 32

for ($i = 0; $i -lt $created.Count; $i++) {
    $thumb = [System.Drawing.Image]::FromFile($created[$i])
    try {
        $row = [int][Math]::Floor($i / $gridColumns)
        $column = $i % $gridColumns
        $x = if ($column -eq 0) { 110 } else { 930 }
        $y = 200 + ($row * 770)
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
$titleHugeFont.Dispose()
$titleLargeFont.Dispose()
$titleMediumFont.Dispose()
$cardTitleFont.Dispose()
$titleSmallFont.Dispose()
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
$ghostBrush.Dispose()
$goldBrushSlide.Dispose()
$sheetBrush.Dispose()
$sheetGold.Dispose()

foreach ($file in $created) {
    Write-Output "CREATED=$file"
}

