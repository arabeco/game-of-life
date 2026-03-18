param(
    [string]$OutputPath = "C:\Users\Afonso\Downloads\GOL1.006\marketing\glyph-instagram-post-01.png"
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
        $pen = [System.Drawing.Pen]::new((New-Color $alpha 212 175 55), [float]($i * 1.15))
        $pen.Alignment = [System.Drawing.Drawing2D.PenAlignment]::Center
        $Graphics.DrawRectangle($pen, $X, $Y, $Width, $Height)
        $pen.Dispose()
    }
}

function Draw-Orbit {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$CenterX,
        [float]$CenterY,
        [float]$Width,
        [float]$Height,
        [float]$Angle,
        [int]$Alpha,
        [float]$Thickness
    )

    $Graphics.TranslateTransform($CenterX, $CenterY)
    $Graphics.RotateTransform($Angle)

    $pen = [System.Drawing.Pen]::new((New-Color $Alpha 212 175 55), $Thickness)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $Graphics.DrawArc($pen, -$Width / 2, -$Height / 2, $Width, $Height, 20, 285)
    $pen.Dispose()

    $penSoft = [System.Drawing.Pen]::new((New-Color ([Math]::Max(10, [int]($Alpha * 0.42))) 255 235 180), [float]($Thickness * 0.45))
    $penSoft.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penSoft.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $Graphics.DrawArc($penSoft, -$Width / 2, -$Height / 2, $Width, $Height, 46, 174)
    $penSoft.Dispose()

    $Graphics.ResetTransform()
}

$root = Split-Path -Parent $OutputPath
if (-not (Test-Path $root)) {
    New-Item -ItemType Directory -Path $root -Force | Out-Null
}

$width = 1080
$height = 1350
$bitmap = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$backgroundRect = [System.Drawing.Rectangle]::new(0, 0, $width, $height)
$backgroundBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Point]::new(0, 0),
    [System.Drawing.Point]::new($width, $height),
    (New-Color 255 4 4 6),
    (New-Color 255 16 17 22)
)
$backgroundBrush.SetBlendTriangularShape(0.35, 0.85)
$graphics.FillRectangle($backgroundBrush, $backgroundRect)
$backgroundBrush.Dispose()

$panelX = 116
$panelY = 124
$panelWidth = 848
$panelHeight = 1104

for ($i = 0; $i -lt 140; $i++) {
    $alpha = Get-Random -Minimum 5 -Maximum 18
    $x = Get-Random -Minimum 32 -Maximum ($width - 32)
    $y = Get-Random -Minimum 32 -Maximum ($height - 32)
    $size = Get-Random -Minimum 1 -Maximum 3
    $starBrush = [System.Drawing.SolidBrush]::new((New-Color $alpha 248 232 189))
    $graphics.FillEllipse($starBrush, $x, $y, $size, $size)
    $starBrush.Dispose()
}

$panelBrush = [System.Drawing.SolidBrush]::new((New-Color 245 6 6 8))
$graphics.FillRectangle($panelBrush, $panelX, $panelY, $panelWidth, $panelHeight)
$panelBrush.Dispose()

Draw-GlowRectangle -Graphics $graphics -X $panelX -Y $panelY -Width $panelWidth -Height $panelHeight

$borderPen = [System.Drawing.Pen]::new((New-Color 255 237 205 114), 3.2)
$graphics.DrawRectangle($borderPen, $panelX, $panelY, $panelWidth, $panelHeight)
$borderPen.Dispose()

$linePen = [System.Drawing.Pen]::new((New-Color 85 221 182 86), 1.4)
$graphics.DrawLine($linePen, 0, 118, $panelX + 44, $panelY + 10)
$graphics.DrawLine($linePen, 0, 610, $panelX, 610)
$graphics.DrawLine($linePen, $width, 146, $panelX + $panelWidth - 36, $panelY + 20)
$graphics.DrawLine($linePen, $width, 648, $panelX + $panelWidth, 648)
$graphics.DrawLine($linePen, $panelX + 74, 0, $panelX + 158, $panelY)
$graphics.DrawLine($linePen, $panelX + $panelWidth - 110, 0, $panelX + $panelWidth - 38, $panelY)
$linePen.Dispose()

$orbitCenterX = $width / 2
$orbitCenterY = 470
Draw-Orbit -Graphics $graphics -CenterX $orbitCenterX -CenterY $orbitCenterY -Width 442 -Height 306 -Angle -25 -Alpha 120 -Thickness 15
Draw-Orbit -Graphics $graphics -CenterX $orbitCenterX -CenterY $orbitCenterY -Width 484 -Height 338 -Angle 28 -Alpha 84 -Thickness 9
Draw-Orbit -Graphics $graphics -CenterX $orbitCenterX -CenterY $orbitCenterY -Width 410 -Height 284 -Angle 46 -Alpha 48 -Thickness 4

$logoPath = "C:\Users\Afonso\Downloads\GOL1.006\public\logo-diamond.png"
$logo = [System.Drawing.Image]::FromFile($logoPath)
$logoTargetX = 296
$logoTargetY = 228
$logoTargetSize = 488

for ($i = 18; $i -ge 1; $i--) {
    $alpha = [Math]::Max(2, 5 - [Math]::Floor($i / 5))
    $glowBrush = [System.Drawing.SolidBrush]::new((New-Color $alpha 207 162 53))
    $graphics.FillEllipse($glowBrush, $logoTargetX - $i * 2.1, $logoTargetY - $i * 1.9, $logoTargetSize + $i * 4.2, $logoTargetSize + $i * 3.8)
    $glowBrush.Dispose()
}

$graphics.DrawImage($logo, $logoTargetX, $logoTargetY, $logoTargetSize, $logoTargetSize)
$logo.Dispose()

$goldBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.RectangleF]::new(0, 0, $width, 150),
    (New-Color 255 253 242 191),
    (New-Color 255 140 106 47),
    18
)

$headlineFamily = Get-FontFamily -Candidates @("Palatino Linotype", "Georgia", "Times New Roman")
$subFamily = Get-FontFamily -Candidates @("Segoe UI", "Arial", "Tahoma")

$headlineFont = [System.Drawing.Font]::new($headlineFamily, 43, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$brandFont = [System.Drawing.Font]::new($headlineFamily, 78, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subFont = [System.Drawing.Font]::new($subFamily, 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$ctaFont = [System.Drawing.Font]::new($headlineFamily, 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$eyebrowFont = [System.Drawing.Font]::new($subFamily, 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$centerFormat = [System.Drawing.StringFormat]::new()
$centerFormat.Alignment = [System.Drawing.StringAlignment]::Center
$centerFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

$leftFormat = [System.Drawing.StringFormat]::new()
$leftFormat.Alignment = [System.Drawing.StringAlignment]::Near
$leftFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

$eyebrowBrush = [System.Drawing.SolidBrush]::new((New-Color 160 255 236 196))
$graphics.DrawString("LIFE SYSTEM  |  PRODUTIVIDADE PREMIUM", $eyebrowFont, $eyebrowBrush, [System.Drawing.RectangleF]::new($panelX + 120, 760, $panelWidth - 240, 26), $centerFormat)
$eyebrowBrush.Dispose()

$graphics.DrawString("FORJE SUA", $headlineFont, $goldBrush, [System.Drawing.RectangleF]::new($panelX + 100, 820, $panelWidth - 200, 54), $centerFormat)
$graphics.DrawString("PROXIMA VERSAO.", $headlineFont, $goldBrush, [System.Drawing.RectangleF]::new($panelX + 70, 876, $panelWidth - 140, 54), $centerFormat)
$graphics.DrawString("GLYPH", $brandFont, $goldBrush, [System.Drawing.RectangleF]::new($panelX + 80, 948, $panelWidth - 160, 80), $centerFormat)

$subBrush = [System.Drawing.SolidBrush]::new((New-Color 210 236 233 227))
$graphics.DrawString("Evolucao com proposito. Link na bio.", $subFont, $subBrush, [System.Drawing.RectangleF]::new($panelX + 160, 1036, $panelWidth - 320, 28), $centerFormat)
$subBrush.Dispose()

$separatorPen = [System.Drawing.Pen]::new((New-Color 120 212 175 55), 1.2)
$graphics.DrawLine($separatorPen, $panelX + 258, 1090, $panelX + $panelWidth - 258, 1090)
$separatorPen.Dispose()

$ctaBrush = [System.Drawing.SolidBrush]::new((New-Color 255 234 206 110))
$graphics.DrawString("GLYPH.LIFE", $ctaFont, $ctaBrush, [System.Drawing.RectangleF]::new($panelX + 72, 1134, 280, 34), $leftFormat)
$ctaBrush.Dispose()

$texturePen = [System.Drawing.Pen]::new((New-Color 18 255 255 255), 1.0)
for ($i = 0; $i -lt 7; $i++) {
    $offset = $i * 18
    $graphics.DrawArc($texturePen, $panelX - 190 + $offset, $panelY - 130 + $offset, 410, 410, 204, 58)
    $graphics.DrawArc($texturePen, $panelX + $panelWidth - 204 - $offset, $panelY - 124 + $offset, 350, 350, 280, 50)
}
$texturePen.Dispose()

$bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$goldBrush.Dispose()
$headlineFont.Dispose()
$brandFont.Dispose()
$subFont.Dispose()
$ctaFont.Dispose()
$eyebrowFont.Dispose()
$centerFormat.Dispose()
$leftFormat.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Output "CREATED=$OutputPath"
