Add-Type -AssemblyName System.Drawing
$items = Get-ChildItem C:\Users\Afonso\Downloads\GOL1.006\marketing -Directory | Where-Object { $_.Name -like 'vitrine-*' -or $_.Name -like 'produto-*' } | Sort-Object Name | ForEach-Object { Join-Path $_.FullName 'slides\contact-sheet.png' }
$labels = Get-ChildItem C:\Users\Afonso\Downloads\GOL1.006\marketing -Directory | Where-Object { $_.Name -like 'vitrine-*' -or $_.Name -like 'produto-*' } | Sort-Object Name | Select-Object -ExpandProperty Name
$thumbW = 280; $thumbH = 385; $headerH = 32; $gap = 24; $cols = 3
$rows = [int][Math]::Ceiling($items.Count / $cols)
$canvasW = ($cols * $thumbW) + (($cols + 1) * $gap)
$canvasH = ($rows * ($thumbH + $headerH)) + (($rows + 1) * $gap)
$bmp = New-Object System.Drawing.Bitmap($canvasW, $canvasH)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::FromArgb(255,10,10,12))
$ifc = New-Object System.Drawing.Text.InstalledFontCollection
$fontFam = $ifc.Families | Where-Object { $_.Name -eq 'Book Antiqua' } | Select-Object -First 1
if(-not $fontFam){ $fontFam = [System.Drawing.FontFamily]::GenericSerif }
$font = New-Object System.Drawing.Font($fontFam, 14, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,235,225,200))
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,210,175,55), 1.5)
for($i=0; $i -lt $items.Count; $i++){
  if(-not (Test-Path $items[$i])){ continue }
  $col = $i % $cols; $row = [int]($i / $cols)
  $x = $gap + ($col * ($thumbW + $gap)); $y = $gap + ($row * ($thumbH + $headerH + $gap))
  $g.DrawString($labels[$i], $font, $brush, [float]$x, [float]$y)
  $img = [System.Drawing.Image]::FromFile($items[$i])
  try {
    $drawY = $y + $headerH
    $g.DrawImage($img, $x, $drawY, $thumbW, $thumbH)
    $g.DrawRectangle($pen, $x, $drawY, $thumbW, $thumbH)
  } finally { $img.Dispose() }
}
$out = 'C:\Users\Afonso\Downloads\GOL1.006\marketing\produto-auditoria-sheet.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $font.Dispose(); $brush.Dispose(); $pen.Dispose()
Write-Output "CREATED=$out"
