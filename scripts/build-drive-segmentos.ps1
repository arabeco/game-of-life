Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = "C:\Users\Afonso\Downloads\GOL1.006"
$marketingRoot = Join-Path $root "marketing"
$targetRoot = Join-Path $marketingRoot "drive-segmentos"

function Ensure-Dir {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Reset-Dir {
    param([string]$Path)
    if (Test-Path $Path) {
        $resolved = [System.IO.Path]::GetFullPath($Path)
        $workspace = [System.IO.Path]::GetFullPath($root)
        if (-not $resolved.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing to clear path outside workspace: $resolved"
        }
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
}

function Copy-Post {
    param(
        [string]$SourceFolder,
        [string]$DestFolder
    )

    $sourceSlides = Join-Path $SourceFolder "slides"
    if (-not (Test-Path $sourceSlides)) {
        throw "Slides not found: $sourceSlides"
    }

    Ensure-Dir -Path $DestFolder
    Copy-Item -Path $sourceSlides -Destination (Join-Path $DestFolder "slides") -Recurse -Force
}

function Write-Index {
    param(
        [string]$Path,
        [string[]]$Lines
    )

    [System.IO.File]::WriteAllLines($Path, $Lines, [System.Text.Encoding]::UTF8)
}

Reset-Dir -Path $targetRoot

$segments = @(
    @{
        Key = "ponte\01-base-01-10"
        Title = "Ponte 01-10 | Base"
        Posts = @(
            "ponte-01-imperio",
            "ponte-02-clareza",
            "ponte-03-criterio",
            "ponte-04-ordem",
            "ponte-05-comando",
            "ponte-06-medida",
            "ponte-07-rastro",
            "ponte-08-presenca",
            "ponte-09-disciplina",
            "ponte-10-evolucao"
        )
    },
    @{
        Key = "ponte\02-jade-11-15"
        Title = "Ponte 11-15 | Jade"
        Posts = @(
            "ponte-11-identidade",
            "ponte-12-metodo",
            "ponte-13-leitura",
            "ponte-14-travessia",
            "ponte-15-sistema"
        )
    },
    @{
        Key = "ponte\03-vermelho-16-20"
        Title = "Ponte 16-20 | Vermelho"
        Posts = @(
            "ponte-16-direcao",
            "ponte-17-centro",
            "ponte-18-constancia",
            "ponte-19-potencia",
            "ponte-20-soberania"
        )
    },
    @{
        Key = "ponte\04-azul-veludo-21-25"
        Title = "Ponte 21-25 | Azul Veludo"
        Posts = @(
            "ponte-21-lucidez",
            "ponte-22-prioridade",
            "ponte-23-folego",
            "ponte-24-dominio",
            "ponte-25-solidez"
        )
    },
    @{
        Key = "choque\01-choque-01-05"
        Title = "Choque 01-05"
        Posts = @(
            "choque-01-vida-baguncada",
            "choque-02-comeca-tudo",
            "choque-03-dia-te-controla",
            "choque-04-cansado-sem-sair-do-lugar",
            "choque-05-vivendo-no-automatico"
        )
    },
    @{
        Key = "abertura\01-abertura-01-10"
        Title = "Abertura 01-10"
        Posts = @(
            "abertura-01-o-primeiro-sinal",
            "abertura-02-o-produto-em-movimento",
            "abertura-03-a-acao-viva",
            "abertura-04-o-sistema-responde",
            "abertura-05-a-primeira-era",
            "abertura-06-a-identidade-visivel",
            "abertura-07-o-arsenal-aberto",
            "abertura-08-a-economia-ganha-forma",
            "abertura-09-o-legado-respira",
            "abertura-10-bonus-de-fundacao"
        )
    }
)

$rounds = @(
    @{
        Name = "round-01"
        Title = "Round 01"
        Posts = @(
            "fundamentos-01-descanso-falso-vs-real",
            "mentalidade-01-foco-seletivo",
            "vitrine-01-customizacao",
            "curadoria-01-cristiano-ronaldo",
            "filosofia-01-reagir-vs-imperio",
            "legado-01-liberdade-derradeira"
        )
    },
    @{
        Name = "round-02"
        Title = "Round 02"
        Posts = @(
            "fundamentos-02-o-ritual-de-descompressao-noturna",
            "mentalidade-02-proteja-a-mente",
            "vitrine-02-planner",
            "curadoria-02-marco-aurelio",
            "filosofia-02-motivacao-armadilha",
            "legado-02-a-bussola-da-coragem"
        )
    },
    @{
        Name = "round-03"
        Title = "Round 03"
        Posts = @(
            "fundamentos-03-terapia-verde-de-5-minutos",
            "mentalidade-03-fundamentos",
            "vitrine-03-relatorio-ciclo",
            "curadoria-03-kobe-bryant",
            "filosofia-03-piloto-automatico",
            "legado-03-a-mente-sem-fronteiras"
        )
    },
    @{
        Name = "round-04"
        Title = "Round 04"
        Posts = @(
            "fundamentos-04-fome-emocional-vs-fome-fisica",
            "mentalidade-04-cortar-mais",
            "vitrine-04-forja-ouro",
            "curadoria-04-bruce-lee",
            "filosofia-04-mito-da-multitarefa",
            "legado-04-o-poder-da-observacao-paciente"
        )
    },
    @{
        Name = "round-05"
        Title = "Round 05"
        Posts = @(
            "fundamentos-05-sincronia-de-energia",
            "mentalidade-05-prioridades",
            "vitrine-05-legado",
            "curadoria-05-leonardo-da-vinci",
            "filosofia-05-disciplina-vs-arrependimento",
            "legado-05-a-arte-da-antecipacao"
        )
    },
    @{
        Name = "round-06"
        Title = "Round 06"
        Posts = @(
            "fundamentos-06-alinhamento-de-postura-e-respiracao",
            "mentalidade-06-decidir-pronto",
            "vitrine-06-deep-focus",
            "mestria-06-ayrton-senna",
            "filosofia-06-conforto-demais",
            "legado-06-a-precisao-invisivel"
        )
    },
    @{
        Name = "round-07"
        Title = "Round 07"
        Posts = @(
            "fundamentos-07-o-peso-do-ambiente-desorganizado",
            "mentalidade-07-sem-permissao",
            "vitrine-07-ciclos-e-eras",
            "mestria-07-beyonce",
            "filosofia-07-quem-nao-mede",
            "legado-07-a-curiosidade-como-bussola"
        )
    },
    @{
        Name = "round-08"
        Title = "Round 08"
        Posts = @(
            "fundamentos-08-sunday-reset",
            "mentalidade-08-critica-materia-prima",
            "vitrine-08-patentes-rank-insignias",
            "mestria-08-arnold-schwarzenegger",
            "filosofia-08-ambiente-vence-vontade",
            "legado-08-o-martelo-da-lucidez"
        )
    },
    @{
        Name = "round-09"
        Title = "Round 09"
        Posts = @(
            "fundamentos-09-o-doce-estrategico",
            "mentalidade-09-vencer-nao-parecer-ocupado",
            "vitrine-09-oraculo",
            "mestria-09-muhammad-ali",
            "filosofia-09-informacao-sem-execucao",
            "legado-09-o-filtro-do-controle"
        )
    },
    @{
        Name = "round-10"
        Title = "Round 10"
        Posts = @(
            "fundamentos-10-a-dependencia-invisivel-da-cafeina",
            "mentalidade-10-decadas-nao-humores",
            "vitrine-10-clas-quests-operacao",
            "mestria-10-marie-curie",
            "filosofia-10-progresso-sem-registro",
            "legado-10-a-anatomia-do-genio"
        )
    },
    @{
        Name = "round-11"
        Title = "Round 11"
        Posts = @(
            "fundamentos-11-fronteiras-de-energia",
            "mentalidade-11-sem-plateia",
            "produto-11-arenas",
            "mestria-11-serena-williams",
            "filosofia-11-meta-sem-campo",
            "legado-11-a-eletricidade-da-visao"
        )
    },
    @{
        Name = "round-12"
        Title = "Round 12"
        Posts = @(
            "fundamentos-12-hidratacao-matinal-antes-de-tudo",
            "mentalidade-12-codigo-proprio",
            "produto-12-quiz-de-maestria",
            "mestria-12-miyamoto-musashi",
            "filosofia-12-clareza-sem-confronto",
            "legado-12-a-busca-da-perfeicao"
        )
    },
    @{
        Name = "round-13"
        Title = "Round 13"
        Posts = @(
            "fundamentos-13-positividade-toxica-vs-respeito-ao-proprio-corpo",
            "mentalidade-13-vantagem-acumulada",
            "produto-13-codex",
            "mestria-13-michael-phelps",
            "filosofia-13-metodo-vence-motivacao",
            "legado-13-a-defesa-da-razao"
        )
    },
    @{
        Name = "round-14"
        Title = "Round 14"
        Posts = @(
            "fundamentos-14-design-de-ambiente-para-foco-suave",
            "mentalidade-14-energia-capital",
            "produto-14-acoes",
            "mestria-14-pele",
            "filosofia-14-talento-sem-repeticao",
            "legado-14-a-progressao-inabalavel"
        )
    },
    @{
        Name = "round-15"
        Title = "Round 15"
        Posts = @(
            "fundamentos-15-banho-de-sol-de-10-minutos",
            "mentalidade-15-mal-compreendidos",
            "produto-15-painel-diario-sitrep",
            "mestria-15-nelson-mandela",
            "filosofia-15-lideranca-sem-sacrificio",
            "legado-15-a-arquitetura-de-um-sonho"
        )
    }
)

$rootIndex = [System.Collections.Generic.List[string]]::new()
$rootIndex.Add("# Drive Segmentos")
$rootIndex.Add("")
$rootIndex.Add("Estrutura pronta para subida por blocos.")
$rootIndex.Add("")
$rootIndex.Add("## Segmentos")

foreach ($segment in $segments) {
    $segmentDir = Join-Path $targetRoot $segment.Key
    Ensure-Dir -Path $segmentDir

    $segmentIndex = [System.Collections.Generic.List[string]]::new()
    $segmentIndex.Add("# $($segment.Title)")
    $segmentIndex.Add("")

    $position = 1
    foreach ($post in $segment.Posts) {
        $sourceFolder = Join-Path $marketingRoot $post
        $postDir = Join-Path $segmentDir ("{0:D2}-{1}" -f $position, $post)
        Copy-Post -SourceFolder $sourceFolder -DestFolder $postDir
        $segmentIndex.Add(("- {0:D2}. {1}" -f $position, $post))
        $position++
    }

    Write-Index -Path (Join-Path $segmentDir "INDEX.md") -Lines $segmentIndex
    $rootIndex.Add(("- {0}" -f $segment.Key.Replace('\', '/')))
}

$rootIndex.Add("")
$rootIndex.Add("## Rounds")

$roundsRoot = Join-Path $targetRoot "rounds"
Ensure-Dir -Path $roundsRoot

foreach ($round in $rounds) {
    $roundDir = Join-Path $roundsRoot $round.Name
    Ensure-Dir -Path $roundDir

    $roundIndex = [System.Collections.Generic.List[string]]::new()
    $roundIndex.Add("# $($round.Title)")
    $roundIndex.Add("")

    $position = 1
    foreach ($post in $round.Posts) {
        $sourceFolder = Join-Path $marketingRoot $post
        $postDir = Join-Path $roundDir ("{0:D2}-{1}" -f $position, $post)
        Copy-Post -SourceFolder $sourceFolder -DestFolder $postDir
        $roundIndex.Add(("- {0:D2}. {1}" -f $position, $post))
        $position++
    }

    Write-Index -Path (Join-Path $roundDir "INDEX.md") -Lines $roundIndex
    $rootIndex.Add("- rounds/$($round.Name)")
}

Write-Index -Path (Join-Path $targetRoot "INDEX.md") -Lines $rootIndex
Write-Output "CREATED=$targetRoot"
