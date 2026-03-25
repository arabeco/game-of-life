begin;

insert into public.codex_catalog (
  id,
  title,
  description,
  author_name,
  price_brl,
  price_gold,
  is_premium,
  cover_image,
  duration_days,
  tags,
  template
)
values
(
  '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a03',
  'Foco Blindado',
  'Deep Work de alto nivel para construir a capacidade de trabalho concentrado por longos periodos.',
  'Soberano System',
  50,
  500,
  false,
  '🧠',
  21,
  array['espaco-mental', 'avancado', 'pratica', 'produtividade', 'deep-work', 'foco'],
  $json$
  {
    "id": "7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a03",
    "title": "Foco Blindado",
    "description": "Deep Work de alto nivel para construir a capacidade de trabalho concentrado por longos periodos.",
    "author": "Soberano System",
    "price": 500,
    "durationDays": 21,
    "coverImage": "🧠",
    "tags": ["espaco-mental", "avancado", "pratica", "produtividade", "deep-work", "foco"],
    "primaryAssetId": "espaco-mental",
    "campaignTier": "avancado",
    "campaignType": "pratica",
    "campaignTheme": "produtividade",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Fundamento do Foco",
        "description": "Entenda por que o foco profundo virou recurso raro.",
        "actions": [
          {
            "name": "Leitura estrutural do foco",
            "description": "Leia o texto da semana na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 3,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "Semana 1 - A maioria vive o roteiro de outro\n[[page]]\nVoce nao escolheu a maioria das coisas que acredita.\n\nSeus valores foram herdados da familia, da escola, da religiao, da cultura onde cresceu. Suas metas foram moldadas pelo que as pessoas ao seu redor consideravam sucesso. Sua ideia de quem voce deveria ser foi construida por comparacao - com irmaos, colegas, figuras publicas, personagens de ficcao. Tudo isso aconteceu antes que voce tivesse ferramentas para questionar qualquer coisa.\n[[page]]\nIsso nao e culpa de ninguem. E o processo padrao de socializacao humana.\n\nO problema nao e ter sido influenciado - isso e inevitavel. O problema e nunca ter parado para auditar o que foi instalado. Muitas pessoas chegam aos 30, 40, 50 anos perseguindo objetivos que nunca escolheram conscientemente, evitando coisas que nunca decidiram evitar, e vivendo de acordo com uma versao de sucesso que pertence a outra pessoa.\n[[page]]\nA sensacao de vazio que vem com conquistas externas geralmente tem essa origem.\n\nVoce bate a meta. Consegue o cargo. Compra o apartamento. E a satisfacao dura menos do que esperava - porque a meta nao era sua de verdade. Era a meta que fazia sentido para o roteiro que voce estava seguindo sem perceber. Nao e ingratidao. E desalinhamento entre o que voce construiu e quem voce realmente e.\n[[page]]\nEste Codex comeca com uma pergunta simples e desconfortavel: o que voce quer de verdade, se ninguem estiver olhando?\n[[page]]\nSemana 2 - Construindo a identidade deliberada\n[[page]]\nIdentidade nao e algo que voce descobre. E algo que voce decide e constroi.\n\nA ideia de que existe um \"eu verdadeiro\" esperando para ser encontrado e romantica mas imprecisa. O que existe e um conjunto de valores, comportamentos e padroes que voce escolhe ou herda - e que, com o tempo, se tornam quem voce e. A diferenca entre uma identidade herdada e uma identidade deliberada e simples: uma aconteceu com voce, a outra foi construida por voce.\n[[page]]\nValores reais se revelam nas decisoes dificeis, nao nas declaracoes faceis.\n\nTodo mundo diz que valoriza familia, saude e honestidade. Mas o que voce faz quando esses valores entram em conflito com conveniencia, dinheiro ou aprovacao social? E nesse momento que os valores reais aparecem - nao os que voce declara, os que voce age. Mapear essa distancia entre o que voce diz valorizar e o que seus comportamentos revelam que voce valoriza e o trabalho central desta semana.\n[[page]]\nConstruir identidade deliberada nao e criar uma persona. E eliminar o que nao e voce.\n\nO processo e mais de remocao do que de adicao. Voce nao precisa inventar quem quer ser do zero - precisa identificar o que foi instalado sem escolha e decidir conscientemente o que fica e o que vai. O que sobra depois dessa auditoria e mais proximo do que voce realmente e do que qualquer coisa que voce tentaria construir partindo do zero.\n[[page]]\nAo final desta semana voce tera 3 principios. Nao regras, nao metas - principios. As ideias que guiam suas decisoes quando nao ha manual de instrucao.\n[[page]]\nSemana 3 - O compromisso com quem voce decidiu ser\n[[page]]\nSaber quem voce quer ser e agir como essa pessoa sao dois processos completamente diferentes.\n\nA maioria das pessoas tem clareza suficiente sobre seus valores quando pensa com calma. O problema e que a vida nao acontece com calma. Acontece com pressao, cansaco, tentacao e circunstancias que nao pedem licenca. E nesses momentos que a identidade ou se ancora ou se dissolve - e a diferenca entre as duas e o quanto o compromisso foi tornado explicito e concreto antes da pressao aparecer.\n[[page]]\nUm compromisso vago nao resiste a uma situacao especifica.\n\n\"Quero ser mais disciplinado\" nao te ajuda quando sao 23h e voce esta cansado e a decisao dificil esta na sua frente. \"Meu principio e: quando estou cansado e quando mais preciso confiar no sistema\" - isso ajuda. A especificidade do compromisso e o que determina se ele funciona sob pressao ou so em condicoes ideais.\n[[page]]\nO manifesto pessoal que voce vai escrever esta semana nao e para mostrar para ninguem.\n\nE um documento interno. Uma declaracao de quem voce decidiu ser, escrita por voce, para voce, no momento em que tinha clareza suficiente para faze-lo - para ser lida nos momentos em que a clareza vai embora. Nao precisa ser longo. Precisa ser honesto e especifico o suficiente para ser util quando voce mais precisar dele.\n[[page]]\nIdentidade construida sem compromisso explicito e intencao. Com compromisso, e arquitetura.",
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG"],
            "scheduledStartTime": 420
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Sessao e Auditoria",
        "description": "Treine foco progressivo e registre o que tenta invadir sua sessao.",
        "actions": [
          {
            "name": "Sessao de Deep Focus no app",
            "description": "S1: 45 min. S2: 60 min. S3: 90 min com revisao de qualidade ao final.",
            "icon": "🎯",
            "duration": 90,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 4,
            "briefing": "Semana 1 - Auditoria de valores.\n\nListe 10 valores que voce diria que sao seus. Depois, para cada um, responda honestamente: esse valor foi escolhido ou herdado? Voce age de acordo com ele quando custa algo? Se a resposta for nao para as duas perguntas, ele provavelmente nao e um valor real - e uma aspiracao. Separe os dois. O que sobrar na coluna dos valores reais e o material com que voce vai trabalhar.\n[[page]]\nSemana 2 - Os 3 principios.\n\nA partir dos valores reais identificados na semana 1, escreva 3 principios que guiam suas decisoes. Principio nao e valor - e valor em acao. \"Honestidade\" e um valor. \"Quando tenho que escolher entre ser honesto e ser aprovado, escolho ser honesto\" e um principio. Cada um dos seus 3 principios deve ser especifico o suficiente para ser util em uma situacao real.\n[[page]]\nSemana 3 - O manifesto.\n\nCom os principios escritos, redija o manifesto. Formato livre - pode ser um paragrafo, pode ser uma lista, pode ser uma carta para voce mesmo. O criterio e um so: ao ler, voce reconhece a pessoa descrita ali como quem voce quer ser - nao como quem voce acha que deveria ser aos olhos dos outros. Ao final, esse documento entra no Legado do ciclo.",
            "preFlight": ["1 tarefa declarada", "Ambiente configurado", "Celular fora do alcance"],
            "context": { "energyLevel": "high", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX"],
            "scheduledStartTime": 540
          },
          {
            "name": "Auditoria de interferencia",
            "description": "Registre em 1 linha o que interrompeu ou tentou interromper sua sessao.",
            "icon": "📝",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "Uma pergunta. Todo dia. Menos de 1 minuto.\n[[page]]\nAs decisoes que voce tomou hoje estavam alinhadas com os principios que voce escreveu? Sim, parcialmente ou nao. Se parcialmente ou nao - uma linha sobre o que desalinhou. Nao para se punir. Para ver o padrao.\n[[page]]\nO registro diario de alinhamento e o que transforma o manifesto de documento em bussola.\n\nSem esse registro, o manifesto vira mais um texto bonito que voce escreveu e esqueceu. Com ele, voce tem 21 dias de dados reais sobre a distancia entre quem voce declarou ser e como voce age sob as condicoes reais da sua vida. Esse gap e o trabalho. Nao e fracasso - e o mapa.",
            "context": { "energyLevel": "low", "timeOfDay": "night" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX"],
            "scheduledStartTime": 1260
          }
        ]
      },
      {
        "level": 3,
        "title": "Fase 3: Marco de Profundidade",
        "description": "Conquiste um dia inteiro de trabalho profundo e registre isso como marco.",
        "actions": [
          {
            "name": "Dia de trabalho profundo completo",
            "description": "Dedique 1 dia do ciclo a 1 unico projeto sem reunioes, mensagens ou redes.",
            "icon": "🏁",
            "duration": 240,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 5,
            "briefing": "Esta semana voce vai tomar 1 decisao dificil usando exclusivamente os principios escritos.\n[[page]]\nNao a decisao mais conveniente. Nao a mais popular. A decisao que seus principios apontam - mesmo que seja desconfortavel, mesmo que ninguem entenda, mesmo que voce prefira nao ter que toma-la. Pode ser no trabalho, nas relacoes, nas financas, no tempo. O tamanho nao importa. O que importa e que seja real e que seja dificil.\n[[page]]\nRegistre a decisao e o raciocinio.\n\nO que era a situacao. Qual principio se aplicava. O que voce decidiu. E como foi. Esse registro entra no Legado como Marco de identidade - nao porque foi perfeito, mas porque foi consciente.",
            "preFlight": ["Projeto unico definido", "Agenda protegida", "Mensagens silenciadas"],
            "context": { "energyLevel": "high", "timeOfDay": "morning" }
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a05',
  'O Pacto de Soberania',
  'Identidade e proposito para definir quem voce esta se tornando e construir compromisso real com isso.',
  'Soberano System',
  40,
  400,
  false,
  '👑',
  21,
  array['proposito', 'avancado', 'aprendizado', 'estrategia', 'identidade', 'soberania'],
  $json$
  {
    "id": "7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a05",
    "title": "O Pacto de Soberania",
    "description": "Identidade e proposito para definir quem voce esta se tornando e construir compromisso real com isso.",
    "author": "Soberano System",
    "price": 400,
    "durationDays": 21,
    "coverImage": "👑",
    "tags": ["proposito", "avancado", "aprendizado", "estrategia", "identidade", "soberania"],
    "primaryAssetId": "proposito",
    "campaignTier": "avancado",
    "campaignType": "aprendizado",
    "campaignTheme": "estrategia",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura Estrutural",
        "description": "Desmonte identidades herdadas e comece a construir a sua.",
        "actions": [
          {
            "name": "Leitura estrutural do pacto",
            "description": "Leia o texto da semana na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 3,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "Semana 1 - A mentalidade do construtor vs a do consumidor\n[[page]]\nA diferenca entre quem acumula patrimonio e quem nao acumula raramente e renda.\n\nE mentalidade. Duas pessoas com o mesmo salario, na mesma cidade, com as mesmas despesas fixas - uma constroi patrimonio ao longo dos anos e a outra nao. A diferenca nao esta na planilha. Esta na forma como cada uma interpreta o papel do dinheiro na propria vida. Uma ve dinheiro como recurso para consumir. A outra ve como ferramenta para construir.\n[[page]]\nO consumidor otimiza para o presente. O construtor otimiza para o sistema.\n\nO consumidor pensa em como o dinheiro vai melhorar sua vida agora - o jantar, a viagem, o produto, o conforto imediato. O construtor pensa em como o dinheiro pode trabalhar para gerar mais dinheiro - como cada real alocado hoje muda as opcoes disponiveis daqui a 5, 10, 20 anos. Nenhum dos dois e errado em abstrato. O problema e quando a mentalidade do consumidor opera de forma exclusiva e inconsciente, sem nenhum espaco para a logica do construtor.\n[[page]]\nSua relacao psicologica com dinheiro foi formada antes que voce tivesse escolha.\n\nO que seus pais diziam sobre dinheiro. Se havia escassez ou abundancia na infancia. As primeiras experiencias de ganhar, perder ou nao ter. Tudo isso criou crencas que operam em segundo plano toda vez que voce toma uma decisao financeira - e que frequentemente contradizem o que voce racionalmente sabe que deveria fazer. Entender de onde vem essas crencas nao resolve tudo, mas torna visivel o que estava operando no escuro.\n[[page]]\nEste Codex nao comeca com planilha. Comeca com a pergunta: qual e a sua historia com dinheiro?\n[[page]]\nSemana 2 - Os instrumentos basicos de crescimento\n[[page]]\nTres conceitos mudam tudo quando realmente entram na pratica: reserva, alocacao e juros compostos.\n\nA reserva de emergencia nao e investimento. E protecao. Sem ela, qualquer imprevisto - carro, saude, demissao - se transforma em divida. E divida e o oposto de construcao de patrimonio: ela toma dinheiro do futuro para pagar o presente. A reserva existe para que imprevistos sejam inconvenientes, nao catastrofes. O tamanho ideal e entre 3 e 6 meses das suas despesas fixas mensais, em algo liquido e seguro.\n[[page]]\nAlocacao e a decisao de para onde o dinheiro vai antes de ter a chance de ir para outro lugar.\n\nO erro mais comum e gastar o que sobra e guardar o que sobrar depois. Nao sobra. O modelo que funciona e o inverso: ao receber, separa primeiro o que vai para reserva ou investimento - mesmo que seja pouco - e vive com o que resta. Essa inversao simples muda o comportamento financeiro mais do que qualquer corte de gasto, porque remove a decisao do momento em que o dinheiro esta disponivel e a tentacao e maior.\n[[page]]\nJuros compostos sao a unica forca no universo financeiro que trabalha para voce enquanto voce dorme.\n\nR$200 por mes investidos a uma taxa de 10% ao ano durante 20 anos se transformam em aproximadamente R$150.000. O mesmo valor guardado embaixo do colchao se transforma em R$48.000. A diferenca de R$102.000 nao veio de trabalho extra - veio do tempo e da consistencia. O segredo dos juros compostos nao e o rendimento. E comecar cedo e nao interromper.\n[[page]]\nO instrumento mais poderoso nao e o melhor investimento. E a consistencia no mais simples.\n[[page]]\nSemana 3 - Patrimonio como projeto de vida\n[[page]]\nDinheiro e uma ferramenta. A pergunta mais importante nao e quanto voce tem - e para que voce esta construindo.\n\nPessoas que acumulam patrimonio sem proposito claro frequentemente chegam a um ponto de saturacao onde mais dinheiro nao produz mais satisfacao - porque nunca foi definido o suficiente. Pessoas que constroem com proposito claro sabem quando chegaram, sabem o que fazer com o que construiram e sentem o progresso ao longo do caminho, nao so no destino.\n[[page]]\nLiberdade financeira nao e riqueza. E escolha.\n\nO objetivo real do patrimonio nao e um numero no extrato. E a capacidade de dizer nao ao que nao quer e sim ao que quer - sem que a decisao seja determinada pelo dinheiro. Pode ser trabalhar menos. Pode ser mudar de carreira sem medo. Pode ser suportar um periodo de transicao sem entrar em panico. O patrimonio compra opcoes. E opcoes sao o que liberdade real significa na pratica.\n[[page]]\nA meta financeira que funciona e a que esta conectada a algo concreto e pessoal.\n\nNao \"quero ter dinheiro\" - isso e intencao vaga. \"Quero ter reserva suficiente para ficar 6 meses sem renda se precisar mudar de emprego\" e uma meta. \"Quero investir R$500 por mes ate ter R$100.000 para dar entrada em um imovel em 8 anos\" e uma meta. Especifica, com valor, com prazo e com significado pessoal claro. Esse tipo de meta resiste aos meses ruins porque tem uma razao concreta por tras.\n[[page]]\nAo final deste ciclo voce vai ter um sistema, uma meta e um primeiro movimento real. Isso ja e mais do que a maioria das pessoas tem.",
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG"],
            "scheduledStartTime": 480
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Construir e Alinhar",
        "description": "Escreva principios, manifesto e veja se o dia honrou isso.",
        "actions": [
          {
            "name": "Construcao do manifesto pessoal",
            "description": "S1: valores reais vs herdados. S2: 3 principios. S3: redigir o Pacto.",
            "icon": "✍️",
            "duration": 20,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 4,
            "briefing": "Semana 1 - Mapeamento do territorio real.\n\nAntes de qualquer decisao, voce precisa saber onde esta. Liste tudo: entradas mensais reais, despesas fixas, despesas variaveis medias e dividas ativas com juros e parcelas. Nao o que voce acha que gasta - o que o extrato mostra. Esse mapeamento vai revelar pelo menos uma surpresa. Sempre revela. O objetivo nao e se sentir mal com o que encontrar. E trabalhar com dados reais em vez de suposicoes.\n[[page]]\nSemana 2 - Definicao da meta de 12 meses.\n\nCom o mapa em maos, defina 1 meta financeira concreta para os proximos 12 meses. Ela precisa ter valor especifico, prazo definido e significado pessoal claro - nao pode ser vaga. Depois, defina a estrategia: quanto vai separar por mes, onde vai guardar ou investir e o que vai ajustar nos gastos para viabilizar. Crie a Arena de Financas no Glyph com as acoes mensais derivadas dessa meta.\n[[page]]\nSemana 3 - Sistema de alocacao.\n\nImplemente o modelo de alocacao antes do gasto: defina qual percentual ou valor fixo vai para reserva ou investimento assim que o dinheiro entrar. Automatize se possivel - transferencia programada, debito automatico. O que e automatico nao depende de forca de vontade. E forca de vontade e o recurso mais escasso que existe quando o salario cai na conta.",
            "preFlight": ["Silencio", "Caderno aberto", "Coragem para cortar o que nao e seu"],
            "context": { "energyLevel": "high", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "QUA", "SEX"],
            "scheduledStartTime": 420
          },
          {
            "name": "Alinhamento do dia",
            "description": "Registre se as decisoes de hoje estavam alinhadas com quem voce declarou ser.",
            "icon": "📝",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "Uma pergunta ao final de cada dia.\n[[page]]\nHouve alguma decisao financeira hoje - grande ou pequena? Se sim: estava alinhada com a meta de 12 meses que voce definiu? Sim, parcialmente ou nao. Uma linha sobre o que foi a decisao e como ela se encaixa ou nao no sistema que voce esta construindo.\n[[page]]\nO registro diario nao e para criar culpa. E para criar consciencia.\n\nA maioria das decisoes financeiras ruins nao sao tomadas por falta de conhecimento. Sao tomadas no automatico, sem perceber que uma decisao esta sendo tomada. O registro forca a percepcao - e percepcao e o primeiro passo para qualquer mudanca real de comportamento. Ao final de 21 dias o padrao entre intencao e comportamento real aparece com clareza que nenhuma autoavaliacao subjetiva consegue produzir.",
            "context": { "energyLevel": "low", "timeOfDay": "night" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1260
          }
        ]
      },
      {
        "level": 3,
        "title": "Fase 3: Decisao pelo Pacto",
        "description": "Teste seu pacto numa escolha dificil e registre isso como marco.",
        "actions": [
          {
            "name": "Decisao pelo pacto",
            "description": "Tome 1 decisao dificil da semana usando exclusivamente os principios escritos no ciclo.",
            "icon": "🏁",
            "duration": 20,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 5,
            "briefing": "Esta semana voce vai executar 1 acao financeira concreta e nova.\n[[page]]\nAbrir uma conta de investimento que ainda nao abriu. Fazer o primeiro aporte - qualquer valor. Cancelar uma assinatura que existe no debito automatico ha meses sem uso real. Quitar uma divida pequena que ficou parada. Fazer uma transferencia programada automatica para reserva. O que for - desde que seja a primeira vez que voce faz essa acao especifica.\n[[page]]\nPequeno e real vale mais do que grande e imaginario.\n\nR$50 investidos hoje valem mais do que R$5.000 planejados para o mes que vem. O primeiro movimento quebra a inercia - e inercia financeira e o maior obstaculo para a maioria das pessoas, nao falta de conhecimento ou de dinheiro. Depois do primeiro movimento, o segundo e sempre mais facil.\n[[page]]\nRegistre no Legado como Marco financeiro.\n\nO que foi a acao. Quanto envolveu. O que significa para voce. Nao pelo tamanho - pela decisao consciente que representa. Esse e o registro do momento em que voce parou de planejar e comecou a construir.",
            "preFlight": ["1 decisao dificil real", "Principios escritos na mao"],
            "context": { "energyLevel": "high", "timeOfDay": "afternoon" }
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e03',
  'Corpo de Elite',
  'Protocolo completo de composicao corporal com forca, mobilidade e recuperacao integrados.',
  'Soberano System',
  40,
  400,
  false,
  '💪',
  21,
  array['fisico', 'avancado', 'pratica', 'exercicio', 'composicao', 'recuperacao'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e03",
    "title": "Corpo de Elite",
    "description": "Protocolo completo de composicao corporal com forca, mobilidade e recuperacao integrados.",
    "author": "Soberano System",
    "price": 400,
    "durationDays": 21,
    "coverImage": "💪",
    "tags": ["fisico", "avancado", "pratica", "exercicio", "composicao", "recuperacao"],
    "primaryAssetId": "fisico",
    "campaignTier": "avancado",
    "campaignType": "pratica",
    "campaignTheme": "exercicio",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura dos Pilares",
        "description": "Aprenda o sistema que integra treino, mobilidade e recuperacao.",
        "actions": [
          {
            "name": "Leitura estrutural do corpo funcional",
            "description": "Leia o texto da semana na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 3,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "",
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG"],
            "scheduledStartTime": 420
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Protocolo e Triangulo",
        "description": "Treine o sistema e acompanhe os tres sinais do dia.",
        "actions": [
          {
            "name": "Treino do dia - protocolo integrado",
            "description": "Cada dia traz treino de forca, mobilidade ou recuperacao ativa com progressao por semana.",
            "icon": "💪",
            "duration": 40,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 4,
            "briefing": "",
            "preFlight": ["Agua", "Espaco livre", "Disposicao para seguir o protocolo do dia"],
            "context": { "energyLevel": "high", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"],
            "scheduledStartTime": 420
          },
          {
            "name": "Triangulo do dia",
            "description": "Registre treino feito, qualidade do sono e alimentacao intencional.",
            "icon": "📝",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "",
            "context": { "energyLevel": "low", "timeOfDay": "night" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1260
          }
        ]
      },
      {
        "level": 3,
        "title": "Fase 3: Benchmark Pessoal",
        "description": "Meça sua evolucao real e transforme isso em dado de legado.",
        "actions": [
          {
            "name": "Benchmark pessoal",
            "description": "Teste flexoes, prancha e 1 exercicio escolhido no inicio e no fim do ciclo.",
            "icon": "🏁",
            "duration": 20,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 4,
            "briefing": "",
            "preFlight": ["Cronometro", "Espaco livre", "Medicao anotada"],
            "context": { "energyLevel": "high", "timeOfDay": "morning" }
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e04',
  'Lideranca sem Cargo',
  'Influencia, decisao e responsabilidade para liderar antes de ter o titulo.',
  'Soberano System',
  35,
  350,
  false,
  '🧭',
  21,
  array['trabalho', 'avancado', 'aprendizado', 'estrategia', 'lideranca', 'influencia'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e04",
    "title": "Lideranca sem Cargo",
    "description": "Influencia, decisao e responsabilidade para liderar antes de ter o titulo.",
    "author": "Soberano System",
    "price": 350,
    "durationDays": 21,
    "coverImage": "🧭",
    "tags": ["trabalho", "avancado", "aprendizado", "estrategia", "lideranca", "influencia"],
    "primaryAssetId": "trabalho",
    "campaignTier": "avancado",
    "campaignType": "aprendizado",
    "campaignTheme": "estrategia",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura de Lideranca",
        "description": "Entenda como lideres reais se movem antes de receber autoridade formal.",
        "actions": [
          {
            "name": "Leitura estrutural da lideranca",
            "description": "Leia o texto da semana na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 3,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "",
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG"],
            "scheduledStartTime": 480
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Pratica e Reflexo",
        "description": "Exerga onde faltou lideranca, aja e meca o que sua iniciativa moveu.",
        "actions": [
          {
            "name": "Pratica de lideranca do dia",
            "description": "S1: onde voce poderia ter liderado. S2: 1 acao intencional de influencia. S3: 1 decisao dificil pendente.",
            "icon": "🧭",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 3,
            "briefing": "",
            "preFlight": ["Situacao real", "Disposicao para assumir responsabilidade"],
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX"],
            "scheduledStartTime": 1020
          },
          {
            "name": "Quem voce moveu hoje",
            "description": "Registre se alguma pessoa, projeto ou situacao avancou por sua iniciativa.",
            "icon": "📝",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "",
            "context": { "energyLevel": "low", "timeOfDay": "night" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1260
          }
        ]
      },
      {
        "level": 3,
        "title": "Fase 3: Iniciativa Propria",
        "description": "Proponha e execute algo real sem ter sido solicitado.",
        "actions": [
          {
            "name": "Projeto de iniciativa propria",
            "description": "Proponha e execute 1 iniciativa pequena, mas real, no trabalho ou comunidade.",
            "icon": "🏁",
            "duration": 30,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 5,
            "briefing": "",
            "preFlight": ["Iniciativa definida", "Primeiro passo claro", "Responsavel assumido por voce"],
            "context": { "energyLevel": "high", "timeOfDay": "afternoon" }
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e05',
  'Maestria Financeira',
  'Construcao de patrimonio com intencao para sair do controle e entrar no crescimento real.',
  'Soberano System',
  30,
  300,
  false,
  '🏦',
  21,
  array['financas', 'avancado', 'aprendizado', 'estrategia', 'patrimonio', 'crescimento'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e05",
    "title": "Maestria Financeira",
    "description": "Construcao de patrimonio com intencao para sair do controle e entrar no crescimento real.",
    "author": "Soberano System",
    "price": 300,
    "durationDays": 21,
    "coverImage": "🏦",
    "tags": ["financas", "avancado", "aprendizado", "estrategia", "patrimonio", "crescimento"],
    "primaryAssetId": "financas",
    "campaignTier": "avancado",
    "campaignType": "aprendizado",
    "campaignTheme": "estrategia",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura do Construtor",
        "description": "Troque a mentalidade do consumidor pela do construtor de patrimonio.",
        "actions": [
          {
            "name": "Leitura estrutural do patrimonio",
            "description": "Leia o texto da semana na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 3,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "",
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG"],
            "scheduledStartTime": 480
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Sistema e Lente",
        "description": "Mapeie o sistema financeiro real e avalie o comportamento pela meta.",
        "actions": [
          {
            "name": "Construcao do sistema financeiro pessoal",
            "description": "S1: mapear patrimonio atual. S2: meta de 12 meses. S3: criar arena de financas no Glyph.",
            "icon": "🏦",
            "duration": 20,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 3,
            "briefing": "",
            "preFlight": ["Ativos", "Dividas", "Fluxo mensal real"],
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" },
            "scheduledDays": ["SEG", "QUA", "SEX"],
            "scheduledStartTime": 1140
          },
          {
            "name": "Decisao financeira do dia pela lente do construtor",
            "description": "Registre se a decisao financeira do dia estava alinhada com a meta de 12 meses.",
            "icon": "📝",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "",
            "context": { "energyLevel": "low", "timeOfDay": "night" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1260
          }
        ]
      },
      {
        "level": 3,
        "title": "Fase 3: Primeiro Movimento Real",
        "description": "Execute um marco financeiro concreto que inaugure seu novo padrao.",
        "actions": [
          {
            "name": "Primeiro movimento real",
            "description": "Abra conta de investimento, faca o primeiro aporte ou quite 1 divida pequena pela primeira vez.",
            "icon": "🏁",
            "duration": 20,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 4,
            "briefing": "",
            "preFlight": ["Movimento escolhido", "Valor ou acao definida", "Registro do marco preparado"],
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" }
          }
        ]
      }
    ]
  }
  $json$::jsonb
)
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  author_name = excluded.author_name,
  price_brl = excluded.price_brl,
  price_gold = excluded.price_gold,
  is_premium = excluded.is_premium,
  cover_image = excluded.cover_image,
  duration_days = excluded.duration_days,
  tags = excluded.tags,
  template = excluded.template;

commit;
