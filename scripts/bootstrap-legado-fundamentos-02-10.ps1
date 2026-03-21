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
    if ($Text -notmatch 'Ã|Â|â|�') { return $Text }
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
        "A Bússola da Coragem" { return "A Bússola`nda Coragem" }
        "A Mente Sem Fronteiras" { return "A Mente Sem`nFronteiras" }
        "O Poder da Observação Paciente" { return "O Poder da`nObservação`nPaciente" }
        "A Arte da Antecipação" { return "A Arte da`nAntecipação" }
        "A Precisão Invisível" { return "A Precisão`nInvisível" }
        "A Curiosidade como Bússola" { return "A Curiosidade`ncomo Bússola" }
        "A Alavanca do Não" { return "A Alavanca`ndo Não" }
        "O Filtro do Controle" { return "O Filtro do`nControle" }
        "A Visão Além da Época" { return "A Visão Além`nda Época" }
        "O Ritual de Descompressão Noturna" { return "O Ritual de`nDescompressão`nNoturna" }
        "Terapia Verde de 5 Minutos" { return "Terapia Verde`nde 5 Minutos" }
        "Fome Emocional vs. Fome Física" { return "Fome emocional`nvs.`nFome física" }
        "Sincronia de Energia" { return "Sincronia`nde energia" }
        "Alinhamento de Postura e Respiração" { return "Alinhamento de`nPostura e Respiração" }
        "O Peso do Ambiente Desorganizado" { return "O peso do ambiente`ndesorganizado" }
        "Sunday Reset" { return "Sunday`nReset" }
        "O Doce Estratégico" { return "O doce`nestratégico" }
        "A Dependência Invisível da Cafeína" { return "A dependência invisível`nda cafeína" }
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
$legadoTemplateMd = Get-Content -Raw -Path (Join-Path $marketingRoot "legado-01-liberdade-derradeira.md")
$fundamentosTemplateMd = Get-Content -Raw -Path (Join-Path $marketingRoot "fundamentos-01-descanso-falso-vs-real.md")

$legados = @(
    @{
        Index = 2
        Title = "A Bússola da Coragem"
        Person = "Harriet Tubman"
        Quote = "Todo grande sonho`ncomeça com um sonhador.`nVocê já carrega a força,`na paciência e a paixão."
        Support = "A mulher que fugiu da escravidão e voltou ao inferno para tirar outros de lá."
        Analysis1 = "Nascida escravizada nos Estados Unidos, Harriet Tubman fugiu para o Norte e depois voltou ao Sul pelo menos treze vezes.`nGuiou dezenas de pessoas à liberdade pela Underground Railroad, operando em silêncio, estratégia e risco extremo."
        Analysis1Close = "Ela não correu só para se salvar. Correu para voltar."
        Analysis2 = "Porque escapar já era improvável. Voltar repetidas vezes, sabendo o custo de ser capturada, é outro nível de coragem.`nTubman transformou sobrevivência em responsabilidade."
        Analysis2Close = "Ela fez da própria liberdade uma rota."
    },
    @{
        Index = 3
        Title = "A Mente Sem Fronteiras"
        Person = "Stephen Hawking"
        Quote = "Por pior que a vida pareça,`nhá sempre algo que você`npode fazer e ter sucesso."
        Support = "O cientista que reformulou o universo enquanto o próprio corpo parava."
        Analysis1 = "Mesmo com uma doença degenerativa que paralisou quase todo o corpo, Stephen Hawking continuou produzindo ciência de ponta.`nInvestigou buracos negros, cosmologia e ajudou a popularizar perguntas que antes pareciam inalcançáveis."
        Analysis1Close = "O corpo encolheu. A mente não."
        Analysis2 = "Porque a maioria perderia produção, ambição e direção sob tamanha limitação física.`nHawking converteu restrição extrema em foco intelectual radical."
        Analysis2Close = "Ele manteve horizonte onde quase tudo virava limite."
    },
    @{
        Index = 4
        Title = "O Poder da Observação Paciente"
        Person = "Jane Goodall"
        Quote = "O que você faz`nfaz diferença.`nE você decide`nque diferença quer fazer."
        Support = "A pesquisadora que trocou pressa por décadas de observação até mudar a biologia."
        Analysis1 = "Jane Goodall passou décadas observando chimpanzés em campo, com paciência e presença raríssimas.`nO que ela viu derrubou certezas da ciência sobre ferramenta, emoção, vínculo e o lugar do humano na natureza."
        Analysis1Close = "Ela provou que profundidade exige permanência."
        Analysis2 = "Porque quase todo mundo quer resultado rápido. Goodall apostou na lentidão, na observação contínua e no acúmulo paciente até mudar uma área inteira."
        Analysis2Close = "Ela venceu pelo tempo que soube sustentar."
    },
    @{
        Index = 5
        Title = "A Arte da Antecipação"
        Person = "Sun Tzu"
        Quote = "A suprema arte`nda guerra é derrotar`no inimigo sem lutar."
        Support = "O estrategista que ensinou o mundo a vencer antes do confronto."
        Analysis1 = "Sun Tzu condensou estratégia, leitura de terreno, timing e economia de força num corpo de pensamento que atravessou séculos.`nSeus princípios saíram do campo de guerra e entraram em política, negócios e tomada de decisão."
        Analysis1Close = "Ele ensinou a vitória antes do choque."
        Analysis2 = "Porque quase todos confundem força com choque.`nSun Tzu organizou a ideia de que inteligência, leitura e preparação podem decidir antes da luta começar."
        Analysis2Close = "Ele ensinou o valor de vencer antes do ruído."
    },
    @{
        Index = 6
        Title = "A Precisão Invisível"
        Person = "Katherine Johnson"
        Quote = "Sou tão boa`nquanto qualquer um,`nmas não melhor."
        Support = "A matemática cujos cálculos ajudaram a colocar a exploração espacial em pé."
        Analysis1 = "Katherine Johnson calculou, à mão, trajetórias orbitais e janelas de reentrada nas primeiras missões espaciais dos Estados Unidos.`nEm um ambiente hostil a mulheres negras, sua precisão sustentou missões críticas."
        Analysis1Close = "Sem aparecer, ela sustentou a trajetória."
        Analysis2 = "Porque o trabalho decisivo dela acontecia onde quase ninguém olha: nos números certos, na hora certa, sem margem para erro.`nGrandeza silenciosa, mas estrutural."
        Analysis2Close = "Ela provou que precisão também é heroísmo."
    },
    @{
        Index = 7
        Title = "A Curiosidade como Bússola"
        Person = "Albert Einstein"
        Quote = "A imaginação é mais`nimportante que o conhecimento."
        Support = "O físico que mexeu na ideia de tempo, espaço e realidade."
        Analysis1 = "Albert Einstein reformulou a física ao propor a relatividade, deslocando a compreensão de espaço, tempo, luz e gravidade.`nEle não apenas resolveu problemas: mudou o tabuleiro sobre o qual a ciência fazia perguntas."
        Analysis1Close = "Ele expandiu o que o intelecto humano podia alcançar."
        Analysis2 = "Porque não basta ser inteligente: é preciso ver o que ninguém estava conseguindo formular.`nEinstein abriu uma nova arquitetura mental para interpretar o real."
        Analysis2Close = "Ele pensou além da moldura do seu século."
    },
    @{
        Index = 8
        Title = "A Alavanca do Não"
        Person = "Rosa Parks"
        Quote = "Quando a mente`nestá decidida,`no medo diminui."
        Support = "A mulher cujo não deslocou a história de um país inteiro."
        Analysis1 = "Rosa Parks recusou-se a ceder seu lugar em um ônibus segregado no Alabama.`nA partir daquele gesto, o boicote aos ônibus de Montgomery ganhou força e a luta pelos direitos civis entrou em outra escala."
        Analysis1Close = "Foi um gesto mínimo com efeito sísmico."
        Analysis2 = "Porque sistemas injustos costumam parecer grandes demais para um gesto isolado.`nParks mostrou que um ato limpo, no ponto certo, pode deslocar a moral inteira de um sistema."
        Analysis2Close = "Ela mostrou o poder histórico de um não firme."
    },
    @{
        Index = 9
        Title = "O Filtro do Controle"
        Person = "Epicteto"
        Quote = "Não é o que acontece,`nmas como você reage`nque importa."
        Support = "O filósofo que separou o que fere do que você entrega a isso."
        Analysis1 = "Epicteto nasceu escravizado e se tornou um dos pensadores estoicos mais influentes da história.`nSua filosofia organizou uma distinção brutal: o que está sob seu controle e o que não está."
        Analysis1Close = "Ele transformou reação em disciplina."
        Analysis2 = "Porque sofrer costuma empurrar o ser humano para o impulso.`nEpicteto fez o contrário: construiu uma filosofia inteira em torno de disciplina interior."
        Analysis2Close = "Ele converteu limite em critério."
    },
    @{
        Index = 10
        Title = "A Visão Além da Época"
        Person = "Ada Lovelace"
        Quote = "A imaginação`né a faculdade`nda descoberta."
        Support = "A mente que imaginou programação antes de existir computador."
        Analysis1 = "Ada Lovelace escreveu, no século XIX, a visão de uma máquina capaz de manipular símbolos e seguir instruções gerais.`nAntes do computador existir fisicamente, ela já enxergava a lógica da programação."
        Analysis1Close = "Ela enxergou uma máquina antes da máquina."
        Analysis2 = "Porque imaginar a estrutura de algo antes de sua existência material exige visão rara.`nAda não previu só uma máquina: previu uma linguagem."
        Analysis2Close = "Ela viu futuro onde os outros viam mecanismo."
    }
)

$fundamentos = @(
    @{
        Index = 2
        Title = "O Ritual de Descompressão Noturna"
        Support = "O dia não termina sozinho.`nO corpo precisa ser avisado."
        Logic1Title = "Sem um ritual de saída,`na mente continua em turno."
        Logic1Body = "Tela forte, luz alta e microestímulos mantêm o cérebro em estado de alerta.`nSe você encerra o dia no mesmo ritmo em que trabalhou, o corpo deita, mas não desliga."
        Logic1Close = "Sono ruim começa antes da cama."
        Logic2Title = "Descompressão`né transição."
        Logic2Body = "Luz mais baixa, banho, skincare, silêncio e redução de tela criam uma mensagem clara: o expediente acabou.`nO sistema nervoso entende contexto antes de entender discurso."
        Logic2Close = "Ritual bom ensina o corpo a encerrar."
    },
    @{
        Index = 3
        Title = "Terapia Verde de 5 Minutos"
        Support = "Às vezes o sistema não precisa de mais força.`nPrecisa de chão."
        Logic1Title = "Contato rápido com o verde`nmuda o estado interno."
        Logic1Body = "Regar uma planta, mexer na terra ou reorganizar um pequeno jardim interrompe o ciclo de ruído.`nO corpo sai da abstração contínua e volta para um estímulo concreto e regulador."
        Logic1Close = "Cinco minutos certos mudam a química do dia."
        Logic2Title = "Pausa ativa`nnão é fuga."
        Logic2Body = "Quando a pausa devolve presença, ela não drena. Ela reorganiza.`nVerde, luz e gesto manual simples funcionam melhor do que distração automática para baixar tensão."
        Logic2Close = "Nem toda pausa distrai. Algumas recalibram."
    },
    @{
        Index = 4
        Title = "Fome Emocional vs. Fome Física"
        Support = "Nem todo desejo por comida é energia.`nÀs vezes é fuga."
        Logic1Title = "Desejo urgente`nnem sempre é fome."
        Logic1Body = "A fome física cresce aos poucos e aceita comida de verdade.`nA emocional costuma pedir açúcar, pressa e recompensa imediata. Ela aparece mais como anestesia do que como necessidade."
        Logic1Close = "Impulso não é diagnóstico."
        Logic2Title = "Nomear a origem`nevita excesso."
        Logic2Body = "Se você aprende a distinguir cansaço, estresse e carência de fome real, para de usar comida como válvula de escape.`nClareza reduz culpa e melhora decisão."
        Logic2Close = "Entender o gatilho é metade do controle."
    },
    @{
        Index = 5
        Title = "Sincronia de Energia"
        Support = "Não adianta forçar potência`nna hora errada."
        Logic1Title = "Seu relógio interno`njá dá pistas."
        Logic1Body = "Há horas em que você pensa melhor, fala melhor e executa melhor.`nIgnorar isso para seguir uma rotina genérica cria fricção desnecessária e sensação de inadequação."
        Logic1Close = "Disciplina boa respeita realidade."
        Logic2Title = "Mapear energia`né estratégia."
        Logic2Body = "Quando trabalho profundo entra no seu pico natural e tarefas leves caem nos vales, o dia rende com menos ruído.`nNão é indulgência. É alocação inteligente."
        Logic2Close = "Energia bem lida vira constância."
    },
    @{
        Index = 6
        Title = "Alinhamento de Postura e Respiração"
        Support = "Às vezes a mente não está ruim.`nO corpo é que está comprimido."
        Logic1Title = "Postura ruim`ncobra caro."
        Logic1Body = "Ombros fechados, pescoço tenso e respiração curta mantêm o corpo em alerta baixo o dia inteiro.`nIsso reduz foco, aumenta fadiga e faz ansiedade parecer problema só mental."
        Logic1Close = "Tensão física vaza para a mente."
        Logic2Title = "Ajuste pequeno,`nefeito real."
        Logic2Body = "Abrir peito, soltar cervical e respirar fundo por alguns ciclos devolve oxigênio, presença e margem de decisão.`nÀs vezes o reset começa por centímetros."
        Logic2Close = "Corpo melhor posicionado pensa melhor."
    },
    @{
        Index = 7
        Title = "O Peso do Ambiente Desorganizado"
        Support = "O espaço em volta também participa`ndo seu estado mental."
        Logic1Title = "Caos visual`nnão é neutro."
        Logic1Body = "Mesa abarrotada, quarto bagunçado e excesso de estímulo visual puxam a atenção para microtensões o tempo todo.`nA mente gasta energia só para conviver com o atrito."
        Logic1Close = "Desordem também é carga."
        Logic2Title = "Organizar espaço`né limpar ruído."
        Logic2Body = "Não se trata de perfeccionismo. Trata-se de retirar fricção invisível.`nQuando o ambiente para de competir com sua atenção, sobra mais clareza para agir."
        Logic2Close = "Ambiente limpo devolve largura mental."
    },
    @{
        Index = 8
        Title = "Sunday Reset"
        Support = "A segunda não começa na segunda.`nEla começa no domingo."
        Logic1Title = "Quem entra cru na semana`njá sai atrás."
        Logic1Body = "Sem algum preparo, a segunda vira reação.`nRoupa, comida, agenda e pendências mal fechadas jogam correria logo na largada e roubam sensação de comando."
        Logic1Close = "A semana perde força antes do primeiro foco."
        Logic2Title = "Reset bom`nnão é excesso."
        Logic2Body = "Basta preparar o básico: refeições simples, agenda visível, espaço minimamente organizado e alguns minutos de silêncio.`nA ideia não é controlar tudo. É reduzir atrito de partida."
        Logic2Close = "Preparação simples evita caos caro."
    },
    @{
        Index = 9
        Title = "O Doce Estratégico"
        Support = "Não é sobre demonizar prazer.`nÉ sobre parar de ser governado por ele."
        Logic1Title = "Beliscar o dia inteiro`ncobra mais."
        Logic1Body = "Pequenas recompensas espalhadas parecem inofensivas, mas mantêm o corpo em busca constante de novo pico.`nIsso bagunça saciedade, foco e estabilidade energética."
        Logic1Close = "Pico frequente vira desgaste."
        Logic2Title = "Prazer com contexto`né outra coisa."
        Logic2Body = "Quando o doce entra em momento definido, sem culpa e sem repetição caótica, ele deixa de comandar o resto do dia.`nEstratégia reduz impulsividade sem precisar de extremismo."
        Logic2Close = "Controle não exige proibição total."
    },
    @{
        Index = 10
        Title = "A Dependência Invisível da Cafeína"
        Support = "Nem sempre o café é problema.`nÀs vezes ele só mascara outro."
        Logic1Title = "Estímulo`npode esconder fadiga."
        Logic1Body = "Se você precisa de cafeína para parecer funcional logo cedo, talvez o déficit esteja no sono, na recuperação ou na inflamação diária do estilo de vida.`nO ritual vira muleta sem você perceber."
        Logic1Close = "Energia emprestada cobra juros."
        Logic2Title = "Pergunta certa:`nrende ou tapa buraco?"
        Logic2Body = "Quando o café entra sobre uma base minimamente descansada, ele ajuda.`nQuando entra para encobrir exaustão crônica, só empurra o problema para depois. Diagnóstico antes do estímulo."
        Logic2Close = "Café não substitui sistema nervoso regulado."
    }
)

foreach ($item in $legados) {
    $item = Repair-HashtableStrings $item
    $slug = New-Slug $item.Title
    $folderName = "legado-{0:D2}-{1}" -f $item.Index, $slug
    $outputDir = Join-Path $marketingRoot "$folderName\slides"
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
    $outputDir = Join-Path $marketingRoot "$folderName\slides"

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

Write-Output "BOOTSTRAP_DONE"
