from pathlib import Path
import unicodedata

ROOT = Path(r"C:\Users\Afonso\Downloads\GOL1.006")
MARKETING = ROOT / "marketing"
SCRIPTS = ROOT / "scripts"


def slugify(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text)
    ascii_text = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    out = []
    last_dash = False
    for ch in ascii_text.lower():
        if ch.isalnum():
            out.append(ch)
            last_dash = False
        else:
            if not last_dash:
                out.append("-")
                last_dash = True
    slug = "".join(out).strip("-")
    return slug


def ps_string(text: str) -> str:
    return '"' + text.replace("`", "``").replace('"', '""').replace("\r\n", "\n").replace("\n", "`n") + '"'


def multiline_title(text: str) -> str:
    mapping = {
        "A Engenharia do Encantamento": "A Engenharia do\nEncantamento",
        "A Busca da Perfeição": "A Busca da\nPerfeição",
        "A Defesa da Razão": "A Defesa\nda Razão",
        "A Progressão Inabalável": "A Progressão\nInabalável",
        "A Arquitetura de um Sonho": "A Arquitetura\nde um Sonho",
        "Fronteiras de Energia": "Fronteiras\nde energia",
        "Hidratação Matinal Antes de Tudo": "Hidratação matinal\nantes de tudo",
        "Positividade Tóxica vs. Respeito ao Próprio Corpo": "Positividade tóxica\nvs.\nrespeito ao próprio corpo",
        "Design de Ambiente para Foco Suave": "Design de ambiente\npara foco suave",
        "Banho de Sol de 10 Minutos": "Banho de sol\nde 10 minutos",
    }
    return mapping.get(text, text)


def write_bom(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8-sig")


LEGADO_TEMPLATE = (SCRIPTS / "generate-legado-01-liberdade-derradeira.ps1").read_text(encoding="utf-8-sig")
FUND_TEMPLATE = (SCRIPTS / "generate-fundamentos-01-descanso-falso-vs-real.ps1").read_text(encoding="utf-8-sig")


legados = [
    {
        "Index": 11,
        "Title": "A Engenharia do Encantamento",
        "Person": "Walt Disney",
        "Quote": "A maneira de começar\né parar de falar\ne começar a fazer.",
        "Support": "O homem que transformou imaginação em linguagem industrial de encantamento.",
        "Analysis1": "Walt Disney ajudou a redesenhar o entretenimento moderno ao unir narrativa, animação, personagem e parque temático dentro de um sistema coerente.\nEle não criou só obras; criou um ecossistema de imaginação escalável.",
        "Analysis1Close": "Ele industrializou encantamento sem matar a magia.",
        "Analysis2": "Porque sonhar é comum. O raro é converter sonho em operação, padrão e legado comercial duradouro.\nDisney mostrou que imaginação de alto nível também exige execução brutal.",
        "Analysis2Close": "Ele provou que fantasia séria também é engenharia.",
    },
    {
        "Index": 12,
        "Title": "A Busca da Perfeição",
        "Person": "Nadia Comăneci",
        "Quote": "Eu não fujo de um desafio.\nCorro em direção a ele.",
        "Support": "A ginasta que transformou perfeição em fato histórico aos 14 anos.",
        "Analysis1": "Nadia Comăneci chocou o mundo ao conquistar a primeira nota 10 da história da ginástica olímpica.\nAquela nota não foi só uma vitória. Foi um deslocamento de régua em um esporte inteiro.",
        "Analysis1Close": "Ela não venceu dentro do padrão. Mudou o padrão.",
        "Analysis2": "Porque perfeição costuma ser palavra simbólica. Comăneci a transformou em placar real, diante do mundo, com disciplina e precisão incompatíveis com a idade.",
        "Analysis2Close": "Ela fez o impossível caber em números.",
    },
    {
        "Index": 13,
        "Title": "A Defesa da Razão",
        "Person": "Hipácia de Alexandria",
        "Quote": "Reserve seu direito de pensar.\nAté pensar errado é melhor\ndo que não pensar.",
        "Support": "A pensadora que defendeu conhecimento e lucidez em um tempo hostil à razão.",
        "Analysis1": "Hipácia foi matemática, astrônoma e filósofa em Alexandria, liderando ensino e produção intelectual em uma era de conflito político e religioso.\nSua presença pública como mulher de pensamento já era, por si, um ato raro.",
        "Analysis1Close": "Ela ocupou o centro da inteligência onde quase não havia espaço para isso.",
        "Analysis2": "Porque defender razão em tempos inflamados custa caro.\nHipácia virou símbolo de lucidez ameaçada justamente porque se recusou a abandonar pensamento rigoroso diante da pressão do tempo.",
        "Analysis2Close": "Ela lembrou que pensar com firmeza também é coragem.",
    },
    {
        "Index": 14,
        "Title": "A Progressão Inabalável",
        "Person": "Confúcio",
        "Quote": "Não importa o quão devagar\nvocê vá, desde que\nvocê não pare.",
        "Support": "O filósofo que moldou ética, liderança e educação por milênios.",
        "Analysis1": "Confúcio organizou um corpo de ensinamentos sobre moralidade, disciplina, conduta e governo que atravessou séculos e moldou civilizações inteiras na Ásia.\nSua influência não foi episódica. Foi estrutural.",
        "Analysis1Close": "Ele não venceu por estrondo. Venceu por permanência.",
        "Analysis2": "Porque existem ideias que brilham e somem. As dele entraram no comportamento, na política, na educação e no ideal de liderança.\nIsso é impacto de profundidade rara.",
        "Analysis2Close": "Ele transformou consistência em civilização.",
    },
    {
        "Index": 15,
        "Title": "A Arquitetura de um Sonho",
        "Person": "Martin Luther King Jr.",
        "Quote": "Dê o primeiro passo na fé.\nVocê não precisa ver a escada inteira.",
        "Support": "O líder que mobilizou milhões com visão moral, não com violência.",
        "Analysis1": "Martin Luther King Jr. liderou a luta pelos direitos civis nos Estados Unidos articulando oratória, coragem pública e não-violência em escala histórica.\nSeu papel não foi só discursar. Foi organizar direção moral para um movimento inteiro.",
        "Analysis1Close": "Ele deu linguagem a uma exigência histórica.",
        "Analysis2": "Porque mover massas sem ódio, sem armas e sem perder firmeza exige força incomum.\nKing fez da palavra uma arquitetura de mobilização real.",
        "Analysis2Close": "Ele mostrou que discurso, quando tem coluna, move história.",
    },
]

fundamentos = [
    {
        "Index": 11,
        "Title": "Fronteiras de Energia",
        "Support": "Dizer sim para tudo também é uma forma de exaustão.",
        "Logic1Title": "Quem absorve tudo\nse perde de si.",
        "Logic1Body": "Aceitar demandas demais, responder rápido a tudo e carregar o clima emocional dos outros esgota sem fazer barulho.\nA pessoa parece disponível. Por dentro, vira território invadido.",
        "Logic1Close": "Energia sem fronteira vira vazamento.",
        "Logic2Title": "Limite bom\nprotege presença.",
        "Logic2Body": "Dizer não com clareza, reduzir disponibilidade automática e parar de tratar urgência alheia como dever próprio muda o corpo inteiro.\nFronteira não é frieza. É manutenção de integridade.",
        "Logic2Close": "Sem limite, até generosidade adoece.",
    },
    {
        "Index": 12,
        "Title": "Hidratação Matinal Antes de Tudo",
        "Support": "Antes de pedir desempenho, religue o sistema.",
        "Logic1Title": "A manhã começa\npelo básico.",
        "Logic1Body": "Depois de horas dormindo, o corpo acorda pedindo água, não estímulo complexo.\nComeçar direto com café, tela e correria empurra o organismo para demanda antes de devolver base.",
        "Logic1Close": "Sistema seco responde pior.",
        "Logic2Title": "Água primeiro\né sinal de ordem.",
        "Logic2Body": "Um copo grande ao acordar ajuda a religar digestão, circulação e sensação de presença física.\nNão parece épico. Mas é o tipo de fundamento que melhora o resto do dia sem alarde.",
        "Logic2Close": "Base boa quase sempre parece simples.",
    },
    {
        "Index": 13,
        "Title": "Positividade Tóxica vs. Respeito ao Próprio Corpo",
        "Support": "Nem toda cobrança interna é disciplina. Às vezes é negação.",
        "Logic1Title": "Forçar sempre\nnão é maturidade.",
        "Logic1Body": "Quando cansaço, dor ou saturação aparecem, muita gente responde com culpa vestida de superação.\nO discurso parece forte, mas muitas vezes só mascara desconexão do próprio corpo.",
        "Logic1Close": "Produtividade sem escuta pode ser autossabotagem elegante.",
        "Logic2Title": "Respeitar o corpo\nnão enfraquece.",
        "Logic2Body": "A pausa certa, o ajuste certo e o ritmo certo preservam capacidade de longo prazo.\nIgnorar sinal não é bravura. É cobrança burra com estética de virtude.",
        "Logic2Close": "Escuta madura sustenta mais que heroísmo cego.",
    },
    {
        "Index": 14,
        "Title": "Design de Ambiente para Foco Suave",
        "Support": "Ambiente não é detalhe. Ele empurra estado mental.",
        "Logic1Title": "Foco também\nse constrói fora da cabeça.",
        "Logic1Body": "Luz ruim, excesso visual, ar pesado e ruído aleatório cobram atenção o tempo inteiro.\nMuita gente tenta compensar isso com força de vontade, quando o espaço inteiro está sabotando a permanência.",
        "Logic1Close": "Contexto ruim encarece concentração.",
        "Logic2Title": "Ajuste fino\nreduz atrito.",
        "Logic2Body": "Luz natural, menos bagunça, algum verde, cheiro limpo e uma mesa minimamente respirável mudam o tom do trabalho.\nFoco suave não é fraqueza. É concentração sem tensão desnecessária.",
        "Logic2Close": "Ambiente bom economiza força mental.",
    },
    {
        "Index": 15,
        "Title": "Banho de Sol de 10 Minutos",
        "Support": "Luz certa cedo regula muito mais do que humor.",
        "Logic1Title": "Corpo precisa de manhã\npara entender o dia.",
        "Logic1Body": "Alguns minutos de luz natural nos olhos ajudam a calibrar ritmo circadiano, energia e hora de dormir.\nSem isso, o corpo perde referência e a mente paga em névoa, irritação e sono ruim.",
        "Logic1Close": "Biologia sem referência vira ruído.",
        "Logic2Title": "Exposição breve,\nefeito acumulado.",
        "Logic2Body": "Caminhar um pouco ao ar livre pela manhã parece simples demais para ser relevante. Mas fundamento costuma funcionar assim.\nPoucos minutos consistentes regulam melhor do que muita compensação tardia.",
        "Logic2Close": "Luz cedo organiza o resto do relógio.",
    },
]


for item in legados:
    slug = slugify(item["Title"])
    folder = f"legado-{item['Index']:02d}-{slug}"
    (MARKETING / folder / "assets").mkdir(parents=True, exist_ok=True)
    content = LEGADO_TEMPLATE
    content = content.replace(r"marketing\legado-01-liberdade-derradeira\slides", fr"marketing\{folder}\slides")
    content = content.replace(r"marketing\legado-01-liberdade-derradeira\assets", fr"marketing\{folder}\assets")
    content = content.replace("Legado 01  |  Viktor Frankl", f"Legado {item['Index']:02d}  |  {item['Person']}")
    content = content.replace("LEGADO 01  |  A LIBERDADE DERRADEIRA", f"LEGADO {item['Index']:02d}  |  {item['Title'].upper()}")
    content = content.replace('"A Liberdade`nDerradeira"', ps_string(multiline_title(item["Title"])))
    content = content.replace('$analysis1Title = "O que Viktor Frankl fez?"', '$analysis1Title = ' + ps_string(f"O que {item['Person']} fez?"))
    content = content.replace('$quoteText = "Entre o est${iacute}mulo e a resposta`nh${aacute} um espa${ccedilla}o.`nNesse espa${ccedilla}o est${aacute}`no poder de escolher."', '$quoteText = ' + ps_string(item["Quote"]))
    content = content.replace('$supportCore = "A hist${oacute}ria fascinante de um homem que saiu do horror com uma teoria sobre sentido."', '$supportCore = ' + ps_string(item["Support"]))
    content = content.replace('$analysis1 = "Psiquiatra judeu austr${iacute}aco, foi preso em campos de concentra${ccedilla}${atilde}o nazistas, perdeu pai, m${atilde}e, irm${atilde}o e esposa.`nAo sobreviver, transformou essa experi${ecirc}ncia na Logoterapia: uma psicologia centrada na busca de sentido."', '$analysis1 = ' + ps_string(item["Analysis1"]))
    content = content.replace('$analysis1Close = "Ele n${atilde}o voltou s${oacute} vivo. Voltou com um mapa."', '$analysis1Close = ' + ps_string(item["Analysis1Close"]))
    content = content.replace('$analysis2Body = "Porque o projeto daqueles campos era quebrar identidade, vontade e dignidade.`nFrankl n${atilde}o apenas suportou o horror: ele observou o que ainda restava livre dentro do ser humano e construiu uma linguagem para isso."', '$analysis2Body = ' + ps_string(item["Analysis2"]))
    content = content.replace('$analysis2Close = "Ele preservou sentido onde quase nada restava."', '$analysis2Close = ' + ps_string(item["Analysis2Close"]))
    write_bom(SCRIPTS / f"generate-{folder}.ps1", content)

for item in fundamentos:
    slug = slugify(item["Title"])
    folder = f"fundamentos-{item['Index']:02d}-{slug}"
    content = FUND_TEMPLATE
    content = content.replace(r"marketing\fundamentos-01-descanso-falso-vs-real\slides", fr"marketing\{folder}\slides")
    content = content.replace("Fundamentos 01", f"Fundamentos {item['Index']:02d}")
    content = content.replace("Fundamentos 01  |  Descanso falso vs. descanso real", f"Fundamentos {item['Index']:02d}  |  {item['Title']}")
    content = content.replace("FUNDAMENTOS 01  |  DESCANSO FALSO VS. DESCANSO REAL", f"FUNDAMENTOS {item['Index']:02d}  |  {item['Title'].upper()}")
    content = content.replace('"Descanso falso`nvs.`nDescanso real."', ps_string(multiline_title(item["Title"])))
    content = content.replace('$coverSupport = "Nem toda pausa recarrega.`nAlgumas s${oacute} anestesiam."', '$coverSupport = ' + ps_string(item["Support"]))
    content = content.replace('$logic1Title = "Se a mente continua`nsendo bombardeada,"', '$logic1Title = ' + ps_string(item["Logic1Title"]))
    content = content.replace('$logic1Body = "o corpo at${eacute} para, mas o sistema nervoso n${atilde}o desliga.`nScroll infinito, v${iacute}deo curto e ru${iacute}do constante n${atilde}o restauram nada."', '$logic1Body = ' + ps_string(item["Logic1Body"]))
    content = content.replace('$logic1Close = "Anestesia parece al${iacute}vio. N${atilde}o ${eacute}."', '$logic1Close = ' + ps_string(item["Logic1Close"]))
    content = content.replace('$logic2Title = "Descanso real`nreduz ru${iacute}do."', '$logic2Title = ' + ps_string(item["Logic2Title"]))
    content = content.replace('$logic2Body = "Ele desacelera a mente, devolve energia utiliz${aacute}vel e prepara o corpo para o pr${oacute}ximo ciclo.`nSil${ecirc}ncio, luz baixa e interrup${ccedilla}${atilde}o do excesso fazem mais do que distra${ccedilla}${atilde}o."', '$logic2Body = ' + ps_string(item["Logic2Body"]))
    content = content.replace('$logic2Close = "Descansar ${eacute} sair do desgaste."', '$logic2Close = ' + ps_string(item["Logic2Close"]))
    write_bom(SCRIPTS / f"generate-{folder}.ps1", content)

print("GEN_OK")
