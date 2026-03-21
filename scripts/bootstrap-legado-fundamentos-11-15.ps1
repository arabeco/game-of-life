Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = "C:\Users\Afonso\Downloads\GOL1.006"
$marketingRoot = Join-Path $root "marketing"
$scriptsRoot = Join-Path $root "scripts"

function Remove-Diacritics {
    param([string]$Text)
    $normalized = $Text.Normalize([Text.NormalizationForm]::FormD)
    $builder = New-Object System.Text.StringBuilder
    foreach ($char in $normalized.ToCharArray()) {
        $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
        if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$builder.Append($char)
        }
    }
    $builder.ToString().Normalize([Text.NormalizationForm]::FormC)
}

function New-Slug {
    param([string]$Text)
    $ascii = Remove-Diacritics $Text
    $ascii = $ascii.ToLowerInvariant()
    $ascii = [Regex]::Replace($ascii, "[^a-z0-9]+", "-")
    $ascii = $ascii.Trim("-")
    return $ascii
}

function Convert-ToPsString {
    param([string]$Text)
    '"' + ($Text.Replace('`', '``').Replace('"', '""').Replace("`r`n", "`n").Replace("`n", '`n')) + '"'
}

function Repair-Mojibake {
    param([string]$Text)
    if ([string]::IsNullOrEmpty($Text)) { return $Text }
    if ($Text -notmatch '[ÃÂâ]') { return $Text }
    $latin1 = [System.Text.Encoding]::GetEncoding(28591)
    return [System.Text.Encoding]::UTF8.GetString($latin1.GetBytes($Text))
}

function Repair-HashtableStrings {
    param([hashtable]$Item)
    $fixed = @{}
    foreach ($key in $Item.Keys) {
        $value = $Item[$key]
        if ($value -is [string]) {
            $fixed[$key] = Repair-Mojibake $value
        } else {
            $fixed[$key] = $value
        }
    }
    return $fixed
}

function Convert-ToMultilineTitle {
    param([string]$Text)
    switch ($Text) {
        "A Engenharia do Encantamento" { return "A Engenharia do`nEncantamento" }
        "A Busca da Perfeição" { return "A Busca da`nPerfeição" }
        "A Defesa da Razão" { return "A Defesa`nda Razão" }
        "A Progressão Inabalável" { return "A Progressão`nInabalável" }
        "A Arquitetura de um Sonho" { return "A Arquitetura`nde um Sonho" }
        "Fronteiras de Energia" { return "Fronteiras`nde energia" }
        "Hidratação Matinal Antes de Tudo" { return "Hidratação matinal`nantes de tudo" }
        "Positividade Tóxica vs. Respeito ao Próprio Corpo" { return "Positividade tóxica`nvs.`nrespeito ao próprio corpo" }
        "Design de Ambiente para Foco Suave" { return "Design de ambiente`npara foco suave" }
        "Banho de Sol de 10 Minutos" { return "Banho de sol`nde 10 minutos" }
        default { return $Text }
    }
}

function Write-Utf8BomFile {
    param(
        [string]$Path,
        [string]$Content
    )
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($true))
}

$legadoTemplateScript = Get-Content -Raw -Path (Join-Path $scriptsRoot "generate-legado-01-liberdade-derradeira.ps1")
$fundamentosTemplateScript = Get-Content -Raw -Path (Join-Path $scriptsRoot "generate-fundamentos-01-descanso-falso-vs-real.ps1")

$legados = @(
    @{
        Index = 11
        Title = "A Engenharia do Encantamento"
        Person = "Walt Disney"
        Quote = "A maneira de começar`né parar de falar`ne começar a fazer."
        Support = "O homem que transformou imaginação em linguagem industrial de encantamento."
        Analysis1 = "Walt Disney ajudou a redesenhar o entretenimento moderno ao unir narrativa, animação, personagem e parque temático dentro de um sistema coerente.`nEle não criou só obras; criou um ecossistema de imaginação escalável."
        Analysis1Close = "Ele industrializou encantamento sem matar a magia."
        Analysis2 = "Porque sonhar é comum. O raro é converter sonho em operação, padrão e legado comercial duradouro.`nDisney mostrou que imaginação de alto nível também exige execução brutal."
        Analysis2Close = "Ele provou que fantasia séria também é engenharia."
    },
    @{
        Index = 12
        Title = "A Busca da Perfeição"
        Person = "Nadia Comăneci"
        Quote = "Eu não fujo de um desafio.`nCorro em direção a ele."
        Support = "A ginasta que transformou perfeição em fato histórico aos 14 anos."
        Analysis1 = "Nadia Comăneci chocou o mundo ao conquistar a primeira nota 10 da história da ginástica olímpica.`nAquela nota não foi só uma vitória. Foi um deslocamento de régua em um esporte inteiro."
        Analysis1Close = "Ela não venceu dentro do padrão. Mudou o padrão."
        Analysis2 = "Porque perfeição costuma ser palavra simbólica. Comăneci a transformou em placar real, diante do mundo, com disciplina e precisão incompatíveis com a idade."
        Analysis2Close = "Ela fez o impossível caber em números."
    },
    @{
        Index = 13
        Title = "A Defesa da Razão"
        Person = "Hipácia de Alexandria"
        Quote = "Reserve seu direito de pensar.`nAté pensar errado é melhor`ndo que não pensar."
        Support = "A pensadora que defendeu conhecimento e lucidez em um tempo hostil à razão."
        Analysis1 = "Hipácia foi matemática, astrônoma e filósofa em Alexandria, liderando ensino e produção intelectual em uma era de conflito político e religioso.`nSua presença pública como mulher de pensamento já era, por si, um ato raro."
        Analysis1Close = "Ela ocupou o centro da inteligência onde quase não havia espaço para isso."
        Analysis2 = "Porque defender razão em tempos inflamados custa caro.`nHipácia virou símbolo de lucidez ameaçada justamente porque se recusou a abandonar pensamento rigoroso diante da pressão do tempo."
        Analysis2Close = "Ela lembrou que pensar com firmeza também é coragem."
    },
    @{
        Index = 14
        Title = "A Progressão Inabalável"
        Person = "Confúcio"
        Quote = "Não importa o quão devagar`nvocê vá, desde que`nvocê não pare."
        Support = "O filósofo que moldou ética, liderança e educação por milênios."
        Analysis1 = "Confúcio organizou um corpo de ensinamentos sobre moralidade, disciplina, conduta e governo que atravessou séculos e moldou civilizações inteiras na Ásia.`nSua influência não foi episódica. Foi estrutural."
        Analysis1Close = "Ele não venceu por estrondo. Venceu por permanência."
        Analysis2 = "Porque existem ideias que brilham e somem. As dele entraram no comportamento, na política, na educação e no ideal de liderança.`nIsso é impacto de profundidade rara."
        Analysis2Close = "Ele transformou consistência em civilização."
    },
    @{
        Index = 15
        Title = "A Arquitetura de um Sonho"
        Person = "Martin Luther King Jr."
        Quote = "Dê o primeiro passo na fé.`nVocê não precisa ver a escada inteira."
        Support = "O líder que mobilizou milhões com visão moral, não com violência."
        Analysis1 = "Martin Luther King Jr. liderou a luta pelos direitos civis nos Estados Unidos articulando oratória, coragem pública e não-violência em escala histórica.`nSeu papel não foi só discursar. Foi organizar direção moral para um movimento inteiro."
        Analysis1Close = "Ele deu linguagem a uma exigência histórica."
        Analysis2 = "Porque mover massas sem ódio, sem armas e sem perder firmeza exige força incomum.`nKing fez da palavra uma arquitetura de mobilização real."
        Analysis2Close = "Ele mostrou que discurso, quando tem coluna, move história."
    }
)

$fundamentos = @(
    @{
        Index = 11
        Title = "Fronteiras de Energia"
        Support = "Dizer sim para tudo também é uma forma de exaustão."
        Logic1Title = "Quem absorve tudo`nse perde de si."
        Logic1Body = "Aceitar demandas demais, responder rápido a tudo e carregar o clima emocional dos outros esgota sem fazer barulho.`nA pessoa parece disponível. Por dentro, vira território invadido."
        Logic1Close = "Energia sem fronteira vira vazamento."
        Logic2Title = "Limite bom`nprotege presença."
        Logic2Body = "Dizer não com clareza, reduzir disponibilidade automática e parar de tratar urgência alheia como dever próprio muda o corpo inteiro.`nFronteira não é frieza. É manutenção de integridade."
        Logic2Close = "Sem limite, até generosidade adoece."
    },
    @{
        Index = 12
        Title = "Hidratação Matinal Antes de Tudo"
        Support = "Antes de pedir desempenho, religue o sistema."
        Logic1Title = "A manhã começa`npelo básico."
        Logic1Body = "Depois de horas dormindo, o corpo acorda pedindo água, não estímulo complexo.`nComeçar direto com café, tela e correria empurra o organismo para demanda antes de devolver base."
        Logic1Close = "Sistema seco responde pior."
        Logic2Title = "Água primeiro`né sinal de ordem."
        Logic2Body = "Um copo grande ao acordar ajuda a religar digestão, circulação e sensação de presença física.`nNão parece épico. Mas é o tipo de fundamento que melhora o resto do dia sem alarde."
        Logic2Close = "Base boa quase sempre parece simples."
    },
    @{
        Index = 13
        Title = "Positividade Tóxica vs. Respeito ao Próprio Corpo"
        Support = "Nem toda cobrança interna é disciplina. Às vezes é negação."
        Logic1Title = "Forçar sempre`nnão é maturidade."
        Logic1Body = "Quando cansaço, dor ou saturação aparecem, muita gente responde com culpa vestida de superação.`nO discurso parece forte, mas muitas vezes só mascara desconexão do próprio corpo."
        Logic1Close = "Produtividade sem escuta pode ser autossabotagem elegante."
        Logic2Title = "Respeitar o corpo`nnão enfraquece."
        Logic2Body = "A pausa certa, o ajuste certo e o ritmo certo preservam capacidade de longo prazo.`nIgnorar sinal não é bravura. É cobrança burra com estética de virtude."
        Logic2Close = "Escuta madura sustenta mais que heroísmo cego."
    },
    @{
        Index = 14
        Title = "Design de Ambiente para Foco Suave"
        Support = "Ambiente não é detalhe. Ele empurra estado mental."
        Logic1Title = "Foco também`nse constrói fora da cabeça."
        Logic1Body = "Luz ruim, excesso visual, ar pesado e ruído aleatório cobram atenção o tempo inteiro.`nMuita gente tenta compensar isso com força de vontade, quando o espaço inteiro está sabotando a permanência."
        Logic1Close = "Contexto ruim encarece concentração."
        Logic2Title = "Ajuste fino`nreduz atrito."
        Logic2Body = "Luz natural, menos bagunça, algum verde, cheiro limpo e uma mesa minimamente respirável mudam o tom do trabalho.`nFoco suave não é fraqueza. É concentração sem tensão desnecessária."
        Logic2Close = "Ambiente bom economiza força mental."
    },
    @{
        Index = 15
        Title = "Banho de Sol de 10 Minutos"
        Support = "Luz certa cedo regula muito mais do que humor."
        Logic1Title = "Corpo precisa de manhã`npara entender o dia."
        Logic1Body = "Alguns minutos de luz natural nos olhos ajudam a calibrar ritmo circadiano, energia e hora de dormir.`nSem isso, o corpo perde referência e a mente paga em névoa, irritação e sono ruim."
        Logic1Close = "Biologia sem referência vira ruído."
        Logic2Title = "Exposição breve,`nefeito acumulado."
        Logic2Body = "Caminhar um pouco ao ar livre pela manhã parece simples demais para ser relevante. Mas fundamento costuma funcionar assim.`nPoucos minutos consistentes regulam melhor do que muita compensação tardia."
        Logic2Close = "Luz cedo organiza o resto do relógio."
    }
)

foreach ($item in $legados) {
    $item = Repair-HashtableStrings $item
    $slug = New-Slug $item.Title
    $folderName = "legado-{0:D2}-{1}" -f $item.Index, $slug
    $assetRoot = Join-Path $marketingRoot "$folderName\assets"
    if (-not (Test-Path $assetRoot)) { New-Item -ItemType Directory -Path $assetRoot -Force | Out-Null }

    $scriptContent = $legadoTemplateScript
    $scriptContent = $scriptContent.Replace('marketing\legado-01-liberdade-derradeira\slides', "marketing\$folderName\slides")
    $scriptContent = $scriptContent.Replace('marketing\legado-01-liberdade-derradeira\assets', "marketing\$folderName\assets")
    $scriptContent = $scriptContent.Replace('Legado 01  |  Viktor Frankl', ('Legado {0:D2}  |  {1}' -f $item.Index, $item.Person))
    $scriptContent = $scriptContent.Replace('LEGADO 01  |  A LIBERDADE DERRADEIRA', ('LEGADO {0:D2}  |  {1}' -f $item.Index, $item.Title.ToUpper()))
    $scriptContent = $scriptContent.Replace('"A Liberdade`nDerradeira"', (Convert-ToPsString (Convert-ToMultilineTitle $item.Title)))
    $scriptContent = [Regex]::Replace($scriptContent, '\$analysis1Title = .+', ('$analysis1Title = ' + (Convert-ToPsString ("O que {0} fez?" -f $item.Person))))
    $scriptContent = [Regex]::Replace($scriptContent, '\$quoteText = .+', ('$quoteText = ' + (Convert-ToPsString $item.Quote)))
    $scriptContent = [Regex]::Replace($scriptContent, '\$supportCore = .+', ('$supportCore = ' + (Convert-ToPsString $item.Support)))
    $scriptContent = [Regex]::Replace($scriptContent, '\$analysis1 = .+', ('$analysis1 = ' + (Convert-ToPsString $item.Analysis1)))
    $scriptContent = [Regex]::Replace($scriptContent, '\$analysis1Close = .+', ('$analysis1Close = ' + (Convert-ToPsString $item.Analysis1Close)))
    $scriptContent = [Regex]::Replace($scriptContent, '\$analysis2Body = .+', ('$analysis2Body = ' + (Convert-ToPsString $item.Analysis2)))
    $scriptContent = [Regex]::Replace($scriptContent, '\$analysis2Close = .+', ('$analysis2Close = ' + (Convert-ToPsString $item.Analysis2Close)))
    Write-Utf8BomFile -Path (Join-Path $scriptsRoot ("generate-{0}.ps1" -f $folderName)) -Content $scriptContent
}

foreach ($item in $fundamentos) {
    $item = Repair-HashtableStrings $item
    $slug = New-Slug $item.Title
    $folderName = "fundamentos-{0:D2}-{1}" -f $item.Index, $slug

    $scriptContent = $fundamentosTemplateScript
    $scriptContent = $scriptContent.Replace('marketing\fundamentos-01-descanso-falso-vs-real\slides', "marketing\$folderName\slides")
    $scriptContent = $scriptContent.Replace('Fundamentos 01', ('Fundamentos {0:D2}' -f $item.Index))
    $scriptContent = $scriptContent.Replace('Fundamentos 01  |  Descanso falso vs. descanso real', ('Fundamentos {0:D2}  |  {1}' -f $item.Index, $item.Title))
    $scriptContent = $scriptContent.Replace('FUNDAMENTOS 01  |  DESCANSO FALSO VS. DESCANSO REAL', ('FUNDAMENTOS {0:D2}  |  {1}' -f $item.Index, $item.Title.ToUpper()))
    $scriptContent = $scriptContent.Replace('"Descanso falso`nvs.`nDescanso real."', (Convert-ToPsString (Convert-ToMultilineTitle $item.Title)))
    $scriptContent = [Regex]::Replace($scriptContent, '\$coverSupport = .+', ('$coverSupport = ' + (Convert-ToPsString $item.Support)))
    $scriptContent = [Regex]::Replace($scriptContent, '\$logic1Title = .+', ('$logic1Title = ' + (Convert-ToPsString $item.Logic1Title)))
    $scriptContent = [Regex]::Replace($scriptContent, '\$logic1Body = .+', ('$logic1Body = ' + (Convert-ToPsString $item.Logic1Body)))
    $scriptContent = [Regex]::Replace($scriptContent, '\$logic1Close = .+', ('$logic1Close = ' + (Convert-ToPsString $item.Logic1Close)))
    $scriptContent = [Regex]::Replace($scriptContent, '\$logic2Title = .+', ('$logic2Title = ' + (Convert-ToPsString $item.Logic2Title)))
    $scriptContent = [Regex]::Replace($scriptContent, '\$logic2Body = .+', ('$logic2Body = ' + (Convert-ToPsString $item.Logic2Body)))
    $scriptContent = [Regex]::Replace($scriptContent, '\$logic2Close = .+', ('$logic2Close = ' + (Convert-ToPsString $item.Logic2Close)))
    Write-Utf8BomFile -Path (Join-Path $scriptsRoot ("generate-{0}.ps1" -f $folderName)) -Content $scriptContent
}

$generatedScripts = @()
$generatedScripts += $legados | ForEach-Object { Join-Path $scriptsRoot ("generate-legado-{0:D2}-{1}.ps1" -f $_.Index, (New-Slug $_.Title)) }
$generatedScripts += $fundamentos | ForEach-Object { Join-Path $scriptsRoot ("generate-fundamentos-{0:D2}-{1}.ps1" -f $_.Index, (New-Slug $_.Title)) }

foreach ($script in $generatedScripts) {
    & $script
}

Write-Output "BOOTSTRAP_11_15_DONE"
