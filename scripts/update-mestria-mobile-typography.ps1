$scriptPaths = @(
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-curadoria-01-cr7.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-curadoria-02-marco-aurelio.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-curadoria-03-kobe-bryant.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-curadoria-04-bruce-lee.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-curadoria-05-leonardo-da-vinci.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-mestria-06-ayrton-senna.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-mestria-07-beyonce.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-mestria-08-arnold-schwarzenegger.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-mestria-09-muhammad-ali.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-mestria-10-marie-curie.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-mestria-11-serena-williams.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-mestria-12-miyamoto-musashi.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-mestria-13-michael-phelps.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-mestria-14-pele.ps1",
    "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-mestria-15-nelson-mandela.ps1"
)

foreach ($path in $scriptPaths) {
    $text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

    $replacements = [ordered]@{
        '$paddingX = [float][Math]::Max(12, [Math]::Ceiling($Font.Size * 0.16))' = '$paddingX = [float][Math]::Max(8, [Math]::Ceiling($Font.Size * 0.10))'
        '$paddingY = [float][Math]::Max(12, [Math]::Ceiling($Font.Size * 0.24))' = '$paddingY = [float][Math]::Max(8, [Math]::Ceiling($Font.Size * 0.16))'
        '$minSize = [float][Math]::Max(18, [Math]::Floor($Font.Size * 0.72))' = '$minSize = [float][Math]::Max(24, [Math]::Floor($Font.Size * 0.80))'
        'Draw-CenterText -Graphics $Graphics -Text $Title -Font $TitleFont -Brush $GoldBrush -X ($X + 12) -Y ($Y + 28) -Width ($Width - 24) -Height 92' = 'Draw-CenterText -Graphics $Graphics -Text $Title -Font $TitleFont -Brush $GoldBrush -X ($X + 10) -Y ($Y + 18) -Width ($Width - 20) -Height 112'
        'Draw-CenterText -Graphics $Graphics -Text $Body -Font $BodyFont -Brush $BodyBrush -X ($X + 18) -Y ($Y + 122) -Width ($Width - 36) -Height ($Height - 138)' = 'Draw-CenterText -Graphics $Graphics -Text $Body -Font $BodyFont -Brush $BodyBrush -X ($X + 14) -Y ($Y + 126) -Width ($Width - 28) -Height ($Height - 142)'
        'Draw-CenterText -Graphics $Graphics -Text $Title -Font $TitleFont -Brush $GoldBrush -X ($X + 10) -Y ($Y + 18) -Width ($Width - 20) -Height 72' = 'Draw-CenterText -Graphics $Graphics -Text $Title -Font $TitleFont -Brush $GoldBrush -X ($X + 10) -Y ($Y + 18) -Width ($Width - 20) -Height 112'
        'Draw-CenterText -Graphics $Graphics -Text $Body -Font $BodyFont -Brush $BodyBrush -X ($X + 18) -Y ($Y + 92) -Width ($Width - 36) -Height ($Height - 108)' = 'Draw-CenterText -Graphics $Graphics -Text $Body -Font $BodyFont -Brush $BodyBrush -X ($X + 14) -Y ($Y + 126) -Width ($Width - 28) -Height ($Height - 142)'
        '$titleHugeFont = [System.Drawing.Font]::new($headlineFamily, 66, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleHugeFont = [System.Drawing.Font]::new($headlineFamily, 78, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
        '$titleHugeFont = [System.Drawing.Font]::new($headlineFamily, 68, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleHugeFont = [System.Drawing.Font]::new($headlineFamily, 78, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
        '$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 54, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 66, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
        '$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 58, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 66, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
        '$titlePanelFont = [System.Drawing.Font]::new($headlineFamily, 46, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titlePanelFont = [System.Drawing.Font]::new($headlineFamily, 58, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
        '$titlePanelFont = [System.Drawing.Font]::new($headlineFamily, 50, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titlePanelFont = [System.Drawing.Font]::new($headlineFamily, 58, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
        '$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 40, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 52, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
        '$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 44, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 52, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
        '$titleCardFont = [System.Drawing.Font]::new($headlineFamily, 31, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleCardFont = [System.Drawing.Font]::new($headlineFamily, 42, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
        '$titleCardFont = [System.Drawing.Font]::new($headlineFamily, 38, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleCardFont = [System.Drawing.Font]::new($headlineFamily, 42, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
        '$bodyFont = [System.Drawing.Font]::new($bodyFamily, 27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)' = '$bodyFont = [System.Drawing.Font]::new($bodyFamily, 40, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)'
        '$bodyFont = [System.Drawing.Font]::new($bodyFamily, 35, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)' = '$bodyFont = [System.Drawing.Font]::new($bodyFamily, 40, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)'
        '$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 22, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)' = '$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)'
        '$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)' = '$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)'
        '$curadoriaWatermarkFont = [System.Drawing.Font]::new($headlineFamily, 68, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$curadoriaWatermarkFont = [System.Drawing.Font]::new($headlineFamily, 60, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
        '$slide2PanelWidth = 486' = '$slide2PanelWidth = 532'
        '$slide2PanelHeight = 424' = '$slide2PanelHeight = 500'
        '-X ($slide2PanelX + 34) -Y ($slide2PanelY + 48) -Width ($slide2PanelWidth - 68) -Height 110' = '-X ($slide2PanelX + 18) -Y ($slide2PanelY + 24) -Width ($slide2PanelWidth - 36) -Height 152'
        '-X ($slide2PanelX + 44) -Y ($slide2PanelY + 182) -Width ($slide2PanelWidth - 88) -Height 130' = '-X ($slide2PanelX + 20) -Y ($slide2PanelY + 188) -Width ($slide2PanelWidth - 40) -Height 188'
        '-X ($slide2PanelX + 48) -Y ($slide2PanelY + 320) -Width ($slide2PanelWidth - 96) -Height 74' = '-X ($slide2PanelX + 20) -Y ($slide2PanelY + 390) -Width ($slide2PanelWidth - 40) -Height 96'
        '$slide2PanelHeight = 496' = '$slide2PanelHeight = 534'
        '-X ($slide2PanelX + 24) -Y ($slide2PanelY + 32) -Width ($slide2PanelWidth - 48) -Height 120' = '-X ($slide2PanelX + 18) -Y ($slide2PanelY + 24) -Width ($slide2PanelWidth - 36) -Height 150'
        '-X ($slide2PanelX + 34) -Y ($slide2PanelY + 182) -Width ($slide2PanelWidth - 68) -Height 154' = '-X ($slide2PanelX + 20) -Y ($slide2PanelY + 188) -Width ($slide2PanelWidth - 40) -Height 210'
        '-X ($slide2PanelX + 36) -Y ($slide2PanelY + 360) -Width ($slide2PanelWidth - 72) -Height 92' = '-X ($slide2PanelX + 20) -Y ($slide2PanelY + 420) -Width ($slide2PanelWidth - 40) -Height 98'
        '-X ($slide2PanelX + 24) -Y ($slide2PanelY + 28) -Width ($slide2PanelWidth - 48) -Height 128' = '-X ($slide2PanelX + 18) -Y ($slide2PanelY + 24) -Width ($slide2PanelWidth - 36) -Height 150'
        '-X ($slide2PanelX + 26) -Y ($slide2PanelY + 176) -Width ($slide2PanelWidth - 52) -Height 194' = '-X ($slide2PanelX + 20) -Y ($slide2PanelY + 182) -Width ($slide2PanelWidth - 40) -Height 224'
        '-X ($slide2PanelX + 28) -Y ($slide2PanelY + 404) -Width ($slide2PanelWidth - 56) -Height 110' = '-X ($slide2PanelX + 20) -Y ($slide2PanelY + 420) -Width ($slide2PanelWidth - 40) -Height 112'
        '-X ($slide2PanelX + 30) -Y ($slide2PanelY + 188) -Width ($slide2PanelWidth - 60) -Height 176' = '-X ($slide2PanelX + 20) -Y ($slide2PanelY + 182) -Width ($slide2PanelWidth - 40) -Height 224'
        '-X ($slide2PanelX + 30) -Y ($slide2PanelY + 390) -Width ($slide2PanelWidth - 60) -Height 104' = '-X ($slide2PanelX + 20) -Y ($slide2PanelY + 420) -Width ($slide2PanelWidth - 40) -Height 112'
    }

    foreach ($pair in $replacements.GetEnumerator()) {
        $text = $text.Replace($pair.Key, $pair.Value)
    }

    [System.IO.File]::WriteAllText($path, $text, [System.Text.Encoding]::UTF8)
    Write-Host "Updated $path"
}
