Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$baseScript = "C:\Users\Afonso\Downloads\GOL1.006\scripts\generate-choque-01-vida-baguncada.ps1"

$tests = @(
    @{ Name = "arial"; Font = "Arial" },
    @{ Name = "franklin"; Font = "Franklin" },
    @{ Name = "bahnschrift"; Font = "Bahnschrift" }
)

foreach ($test in $tests) {
    $outputDir = "C:\Users\Afonso\Downloads\GOL1.006\marketing\choque-font-test-{0}\slides" -f $test.Name
    powershell -ExecutionPolicy Bypass -File $baseScript -OutputDir $outputDir -TextStyle Gold -FontChoice $test.Font
}
