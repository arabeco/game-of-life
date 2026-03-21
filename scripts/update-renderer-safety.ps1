Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptsDir = "C:\Users\Afonso\Downloads\GOL1.006\scripts"

$newDrawCenterText = @'
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
'@

$curadoria01ImageHelpers = @'
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
'@

$curadoria01FeatureFrameHeight = @'
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
'@

$files = Get-ChildItem $scriptsDir -Filter 'generate-*.ps1' -File
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $updated = $content

    $drawCenterStart = $updated.IndexOf('function Draw-CenterText {')
    if ($drawCenterStart -ge 0) {
        $drawCenterSearchFrom = $drawCenterStart + 1
        $drawCenterNext = $updated.IndexOf("`r`nfunction ", $drawCenterSearchFrom)
        if ($drawCenterNext -lt 0) {
            $drawCenterNext = $updated.IndexOf("`nfunction ", $drawCenterSearchFrom)
        }
        if ($drawCenterNext -gt $drawCenterStart) {
            $updated = $updated.Substring(0, $drawCenterStart) + $newDrawCenterText + "`r`n`r`n" + $updated.Substring($drawCenterNext + 2)
        }
    }

    if ($file.Name -eq 'generate-curadoria-01-cr7.ps1') {
        $imageInBoxStart = $updated.IndexOf('function Draw-ImageInBox {')
        $featureHeightStart = $updated.IndexOf('function Get-FeatureFrameHeight {')
        $shadowStart = $updated.IndexOf('function Draw-ShadowEllipse {')
        if ($imageInBoxStart -ge 0 -and $featureHeightStart -gt $imageInBoxStart) {
            $updated = $updated.Substring(0, $imageInBoxStart) + $curadoria01ImageHelpers + "`r`n`r`n" + $updated.Substring($featureHeightStart)
        }
        $featureHeightStart = $updated.IndexOf('function Get-FeatureFrameHeight {')
        $shadowStart = $updated.IndexOf('function Draw-ShadowEllipse {')
        if ($featureHeightStart -ge 0 -and $shadowStart -gt $featureHeightStart) {
            $updated = $updated.Substring(0, $featureHeightStart) + $curadoria01FeatureFrameHeight + "`r`n`r`n" + $updated.Substring($shadowStart)
        }
        $updated = $updated.Replace(
            'Draw-ImageInBox -Graphics $Graphics -ImagePath $ImagePath -X ($X + 22) -Y ($Y + 18) -Width ($Width - 44) -Height ($Height - 36) -Opacity $Opacity -AlignBottom -Cover:$CoverImage',
            'Draw-ImageInBox -Graphics $Graphics -ImagePath $ImagePath -X ($X + 22) -Y ($Y + 18) -Width ($Width - 44) -Height ($Height - 36) -Opacity $Opacity -AlignBottom -Cover:$CoverImage -TrimTransparency'
        )
        $updated = $updated.Replace(
            'Draw-ImageInBox -Graphics $graphics -ImagePath $cr7Slide3Path -X 692 -Y 224 -Width 280 -Height 210 -Opacity 0.98 -AlignBottom -AlignRight',
            'Draw-ImageInBox -Graphics $graphics -ImagePath $cr7Slide3Path -X 692 -Y 224 -Width 280 -Height 210 -Opacity 0.98 -AlignBottom -AlignRight -TrimTransparency'
        )
    }

    if ($updated -ne $content) {
        Set-Content -Path $file.FullName -Value $updated -Encoding UTF8
        Write-Output "UPDATED=$($file.FullName)"
    }
}
