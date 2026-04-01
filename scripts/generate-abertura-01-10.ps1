Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = "C:\Users\Afonso\Downloads\GOL1.006"
$marketingRoot = Join-Path $repoRoot "marketing"
$aberturaRoot = Join-Path $marketingRoot "abertura"
$generator = Join-Path $repoRoot "scripts\generate-ponte-01-imperio.ps1"
$plaquePath = Join-Path $marketingRoot "round0\placa.jpg"

$items = @(
    [pscustomobject]@{
        Id = 1
        Title = "O Primeiro Sinal"
        Word = "Sinal"
        Definition = "O GLYPH deixou de ser projeto e ganhou presença real. A estrutura já existe, opera e responde."
        Background = (Join-Path $aberturaRoot "16.jpg")
        Print = (Join-Path $aberturaRoot "office.jpeg")
        Slug = "o-primeiro-sinal"
    }
    [pscustomobject]@{
        Id = 2
        Title = "O Produto em Movimento"
        Word = "Movimento"
        Definition = "A experiência já se move. O sistema organiza o dia, processa fluxo e devolve resposta visual real."
        Background = (Join-Path $aberturaRoot "17.jpg")
        Print = (Join-Path $aberturaRoot "planner2.jpeg")
        Slug = "o-produto-em-movimento"
    }
    [pscustomobject]@{
        Id = 3
        Title = "A Ação Viva"
        Word = "Ação"
        Definition = "Execução sem abstração. Ação criada, foco ativo e conclusão sob comando."
        Background = (Join-Path $aberturaRoot "18.jpg")
        Print = (Join-Path $aberturaRoot "deepaction.jpeg")
        Slug = "a-acao-viva"
    }
    [pscustomobject]@{
        Id = 4
        Title = "O Sistema Responde"
        Word = "Resposta"
        Definition = "O sistema já lê contexto, cruza sinais e devolve orientação em tempo real."
        Background = (Join-Path $aberturaRoot "19.jpg")
        Print = (Join-Path $aberturaRoot "oraculo.jpeg")
        Slug = "o-sistema-responde"
    }
    [pscustomobject]@{
        Id = 5
        Title = "A Primeira Era"
        Word = "Era"
        Definition = "A fundação já tem calendário, continuidade e leitura de fase. O GLYPH começou a marcar o próprio tempo."
        Background = (Join-Path $aberturaRoot "20.jpg")
        Print = (Join-Path $aberturaRoot "season.jpeg")
        Slug = "a-primeira-era"
    }
    [pscustomobject]@{
        Id = 6
        Title = "A Identidade Visível"
        Word = "Identidade"
        Definition = "Perfil, presença e pertencimento já existem no sistema. A forma também comunica evolução."
        Background = (Join-Path $aberturaRoot "21.jpg")
        Print = (Join-Path $aberturaRoot "perfil.jpeg")
        Slug = "a-identidade-visivel"
    }
    [pscustomobject]@{
        Id = 7
        Title = "O Arsenal Aberto"
        Word = "Arsenal"
        Definition = "Forma, sinais e elementos visuais começam a transformar progresso em linguagem."
        Background = (Join-Path $aberturaRoot "22.jpg")
        Print = (Join-Path $aberturaRoot "inventario.jpeg")
        Slug = "o-arsenal-aberto"
    }
    [pscustomobject]@{
        Id = 8
        Title = "A Economia Ganha Forma"
        Word = "Economia"
        Definition = "Loja, ouro e escolha deixam de ser promessa e viram mecânica viva dentro do produto."
        Background = (Join-Path $aberturaRoot "23.jpg")
        Print = (Join-Path $aberturaRoot "loja.jpeg")
        Slug = "a-economia-ganha-forma"
    }
    [pscustomobject]@{
        Id = 9
        Title = "O Legado Respira"
        Word = "Legado"
        Definition = "O esforço já deixa rastro. Ciclos fechados agora podem ser projetados como memória visível."
        Background = (Join-Path $aberturaRoot "24.jpg")
        Print = (Join-Path $aberturaRoot "legado.jpeg")
        Slug = "o-legado-respira"
    }
    [pscustomobject]@{
        Id = 10
        Title = "Bônus de Fundação"
        Word = "Fundação"
        Definition = "Quem entra cedo não entra vazio. Fundação também merece marca, bônus e lembrança."
        Background = (Join-Path $aberturaRoot "25.jpg")
        Print = (Join-Path $aberturaRoot "levelup.jpg")
        Slug = "bonus-de-fundacao"
    }
)

foreach ($item in $items) {
    if (-not (Test-Path $item.Background)) { throw "Fundo nao encontrado: $($item.Background)" }
    if (-not (Test-Path $item.Print)) { throw "Print nao encontrado: $($item.Print)" }

    $outputDir = Join-Path $marketingRoot ("abertura-{0}-{1}\slides" -f $item.Id.ToString("00"), $item.Slug)
    powershell -ExecutionPolicy Bypass -File $generator `
        -OutputDir $outputDir `
        -BackgroundPath $item.Background `
        -PlaquePath $plaquePath `
        -PrintPath $item.Print `
        -Word $item.Word `
        -Definition $item.Definition `
        -SheetTitle ("Abertura {0} | {1}" -f $item.Id.ToString("00"), $item.Title) `
        -PlaqueTone "Abertura" `
        -NoSlide2Darkening
}

$items | Select-Object Id,Title,Word,Background,Print | Format-Table -AutoSize
