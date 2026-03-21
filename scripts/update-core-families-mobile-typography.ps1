$families = @(
    @{
        Pattern = 'generate-vitrine-*.ps1'
        Pattern2 = 'generate-produto-*.ps1'
        Replacements = [ordered]@{
            '$paddingX = [float][Math]::Max(12, [Math]::Ceiling($Font.Size * 0.16))' = '$paddingX = [float][Math]::Max(8, [Math]::Ceiling($Font.Size * 0.10))'
            '$paddingY = [float][Math]::Max(12, [Math]::Ceiling($Font.Size * 0.24))' = '$paddingY = [float][Math]::Max(8, [Math]::Ceiling($Font.Size * 0.16))'
            '$minSize = [float][Math]::Max(18, [Math]::Floor($Font.Size * 0.72))' = '$minSize = [float][Math]::Max(24, [Math]::Floor($Font.Size * 0.80))'
            '$titleHugeFont = [System.Drawing.Font]::new($headlineFamily, 68, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleHugeFont = [System.Drawing.Font]::new($headlineFamily, 78, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$titleHugeFont = [System.Drawing.Font]::new($headlineFamily, 72, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleHugeFont = [System.Drawing.Font]::new($headlineFamily, 78, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 48, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 66, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 58, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 66, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 36, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 52, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 44, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 52, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$cardTitleFont = [System.Drawing.Font]::new($headlineFamily, 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$cardTitleFont = [System.Drawing.Font]::new($headlineFamily, 42, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$cardTitleFont = [System.Drawing.Font]::new($headlineFamily, 36, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$cardTitleFont = [System.Drawing.Font]::new($headlineFamily, 42, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$titleSmallFont = [System.Drawing.Font]::new($headlineFamily, 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleSmallFont = [System.Drawing.Font]::new($headlineFamily, 44, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$titleSmallFont = [System.Drawing.Font]::new($headlineFamily, 40, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleSmallFont = [System.Drawing.Font]::new($headlineFamily, 44, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$bodyFont = [System.Drawing.Font]::new($bodyFamily, 25, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)' = '$bodyFont = [System.Drawing.Font]::new($bodyFamily, 42, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)'
            '$bodyFont = [System.Drawing.Font]::new($bodyFamily, 42, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)' = '$bodyFont = [System.Drawing.Font]::new($bodyFamily, 42, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)'
            '$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 21, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)' = '$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)'
            '$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 32, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)' = '$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)'
        }
    },
    @{
        Pattern = 'generate-filosofia-*.ps1'
        Replacements = [ordered]@{
            '$paddingX = [float][Math]::Max(12, [Math]::Ceiling($Font.Size * 0.16))' = '$paddingX = [float][Math]::Max(8, [Math]::Ceiling($Font.Size * 0.10))'
            '$paddingY = [float][Math]::Max(12, [Math]::Ceiling($Font.Size * 0.24))' = '$paddingY = [float][Math]::Max(8, [Math]::Ceiling($Font.Size * 0.16))'
            '$minSize = [float][Math]::Max(18, [Math]::Floor($Font.Size * 0.72))' = '$minSize = [float][Math]::Max(24, [Math]::Floor($Font.Size * 0.80))'
            '$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 50, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 66, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 38, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 52, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$bodyFont = [System.Drawing.Font]::new($bodyFamily, 27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)' = '$bodyFont = [System.Drawing.Font]::new($bodyFamily, 42, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)'
            '$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 22, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)' = '$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)'
        }
    },
    @{
        Pattern = 'generate-mentalidade-*.ps1'
        Replacements = [ordered]@{
            '$paddingX = [float][Math]::Max(12, [Math]::Ceiling($Font.Size * 0.16))' = '$paddingX = [float][Math]::Max(8, [Math]::Ceiling($Font.Size * 0.10))'
            '$paddingY = [float][Math]::Max(12, [Math]::Ceiling($Font.Size * 0.24))' = '$paddingY = [float][Math]::Max(8, [Math]::Ceiling($Font.Size * 0.16))'
            '$minSize = [float][Math]::Max(18, [Math]::Floor($Font.Size * 0.72))' = '$minSize = [float][Math]::Max(24, [Math]::Floor($Font.Size * 0.80))'
            '$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 48, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleLargeFont = [System.Drawing.Font]::new($headlineFamily, 64, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)' = '$titleMediumFont = [System.Drawing.Font]::new($headlineFamily, 50, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)'
            '$bodyFont = [System.Drawing.Font]::new($bodyFamily, 27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)' = '$bodyFont = [System.Drawing.Font]::new($bodyFamily, 42, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)'
            '$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 23, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)' = '$bodySmallFont = [System.Drawing.Font]::new($bodyFamily, 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)'
            'Draw-EditorialPanel -Graphics $graphics -X 180 -Y 286 -Width 720 -Height 596' = 'Draw-EditorialPanel -Graphics $graphics -X 160 -Y 276 -Width 760 -Height 640'
            'Draw-EditorialPanel -Graphics $graphics -X 168 -Y 286 -Width 744 -Height 610' = 'Draw-EditorialPanel -Graphics $graphics -X 156 -Y 276 -Width 768 -Height 640'
            '-X 236 -Y 360 -Width 608 -Height 138' = '-X 184 -Y 336 -Width 712 -Height 178'
            '-X 256 -Y 548 -Width 568 -Height 118' = '-X 182 -Y 546 -Width 716 -Height 174'
            '-X 280 -Y 694 -Width 520 -Height 62' = '-X 190 -Y 730 -Width 700 -Height 82'
            '-X 246 -Y 774 -Width 588 -Height 74' = '-X 176 -Y 798 -Width 728 -Height 92'
            '-X 228 -Y 356 -Width 624 -Height 138' = '-X 182 -Y 334 -Width 716 -Height 176'
            '-X 248 -Y 534 -Width 584 -Height 182' = '-X 182 -Y 528 -Width 716 -Height 220'
            '-X 252 -Y 786 -Width 576 -Height 70' = '-X 182 -Y 798 -Width 716 -Height 92'
            '-X 182 -Y 546 -Width 716 -Height 174' = '-X 182 -Y 520 -Width 716 -Height 152'
            '-X 190 -Y 552 -Width 700 -Height 160' = '-X 190 -Y 520 -Width 700 -Height 156'
            '-X 176 -Y 550 -Width 728 -Height 192' = '-X 176 -Y 520 -Width 728 -Height 176'
            '-X 190 -Y 730 -Width 700 -Height 82' = '-X 190 -Y 684 -Width 700 -Height 76'
            '-X 188 -Y 746 -Width 704 -Height 92' = '-X 188 -Y 688 -Width 704 -Height 80'
            '-X 180 -Y 786 -Width 720 -Height 96' = '-X 180 -Y 700 -Width 720 -Height 78'
            '-X 240 -Y 694 -Width 600 -Height 62' = '-X 206 -Y 686 -Width 668 -Height 74'
            '-X 190 -Y 684 -Width 700 -Height 76' = '-X 190 -Y 704 -Width 700 -Height 72'
            '-X 206 -Y 686 -Width 668 -Height 74' = '-X 206 -Y 706 -Width 668 -Height 72'
            '-X 188 -Y 688 -Width 704 -Height 80' = '-X 188 -Y 706 -Width 704 -Height 72'
            '-X 180 -Y 700 -Width 720 -Height 78' = '-X 180 -Y 716 -Width 720 -Height 72'
            '-X 190 -Y 704 -Width 700 -Height 72' = '-X 176 -Y 688 -Width 728 -Height 96'
            '-X 206 -Y 706 -Width 668 -Height 72' = '-X 176 -Y 688 -Width 728 -Height 96'
            '-X 188 -Y 706 -Width 704 -Height 72' = '-X 176 -Y 688 -Width 728 -Height 96'
            '-X 180 -Y 716 -Width 720 -Height 72' = '-X 176 -Y 688 -Width 728 -Height 96'
            '-X 176 -Y 844 -Width 728 -Height 94' = '-X 176 -Y 798 -Width 728 -Height 92'
            '-X 182 -Y 836 -Width 716 -Height 92' = '-X 182 -Y 798 -Width 716 -Height 92'
            '-X 188 -Y 826 -Width 704 -Height 112' = '-X 188 -Y 798 -Width 704 -Height 92'
            '-X 182 -Y 830 -Width 716 -Height 116' = '-X 182 -Y 798 -Width 716 -Height 92'
            '-X 176 -Y 858 -Width 728 -Height 108' = '-X 176 -Y 798 -Width 728 -Height 92'
            '-X 176 -Y 858 -Width 728 -Height 112' = '-X 176 -Y 798 -Width 728 -Height 92'
            '-X 176 -Y 844 -Width 728 -Height 110' = '-X 176 -Y 798 -Width 728 -Height 92'
            '-X 176 -Y 856 -Width 728 -Height 112' = '-X 176 -Y 798 -Width 728 -Height 92'
            '-X 226 -Y 774 -Width 628 -Height 74' = '-X 176 -Y 798 -Width 728 -Height 92'
            '-X 220 -Y 786 -Width 640 -Height 70' = '-X 176 -Y 798 -Width 728 -Height 92'
        }
    }
)

$scriptsDir = "C:\Users\Afonso\Downloads\GOL1.006\scripts"

foreach ($family in $families) {
    $patterns = @($family.Pattern)
    if ($family.ContainsKey('Pattern2')) { $patterns += $family.Pattern2 }

    foreach ($pattern in $patterns) {
        Get-ChildItem $scriptsDir -Filter $pattern | ForEach-Object {
            $path = $_.FullName
            $text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
            foreach ($pair in $family.Replacements.GetEnumerator()) {
                $text = $text.Replace($pair.Key, $pair.Value)
            }
            [System.IO.File]::WriteAllText($path, $text, [System.Text.Encoding]::UTF8)
            Write-Host "Updated $path"
        }
    }
}
