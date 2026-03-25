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
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c01',
  'Sono de Elite',
  'Protocolo de recuperacao noturna para dormir melhor sem mudar sua rotina toda.',
  'Soberano System',
  5,
  50,
  false,
  '🌙',
  7,
  array['fisico', 'basico', 'aprendizado', 'bem-estar', 'sono', 'recuperacao'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c01",
    "title": "Sono de Elite",
    "description": "Protocolo de recuperacao noturna para dormir melhor sem mudar sua rotina toda.",
    "author": "Soberano System",
    "price": 50,
    "durationDays": 7,
    "coverImage": "🌙",
    "tags": ["fisico", "basico", "aprendizado", "bem-estar", "sono", "recuperacao"],
    "primaryAssetId": "fisico",
    "campaignTier": "basico",
    "campaignType": "aprendizado",
    "campaignTheme": "bem_estar",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura de Base",
        "description": "Entenda o que destrava ou sabota sua recuperacao noturna.",
        "actions": [
          {
            "name": "Por que voce acorda cansado",
            "description": "Leia a aula na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 1,
            "briefing": "O sono nao e um estado uniforme. Enquanto voce dorme, o corpo passa por ciclos de aproximadamente 90 minutos, alternando entre sono leve, sono profundo e sono REM. O problema nao e so a quantidade de horas - e onde dentro desse ciclo o alarme te acorda. Ser arrancado do sono profundo produz aquela sensacao de peso e desorientacao que dura horas, independente de ter dormido 7 ou 9 horas. Voce nao acorda cansado porque dormiu pouco. Muitas vezes acorda cansado porque acordou na hora errada.\n[[page]]\nO segundo fator e o cortisol. Esse hormonio, que deveria subir naturalmente ao amanhecer para te preparar para o dia, tem seu ritmo sabotado por luz artificial, telas a noite e horarios irregulares de sono. Quando o cortisol nao sobe no momento certo, o corpo nao completa a transicao do sono para o estado de alerta - e voce passa as primeiras horas do dia lutando contra a biologia em vez de trabalhar com ela.\n[[page]]\nO terceiro fator, e o mais ignorado, e a temperatura. O corpo precisa reduzir sua temperatura central para entrar em sono profundo. Quarto quente, coberta pesada demais, banho quente imediatamente antes de dormir - tudo isso atrasa a entrada no sono profundo e reduz o tempo total de recuperacao real, mesmo que voce passe 8 horas na cama.\n[[page]]\nVoce nao precisa de suplemento, de app de monitoramento ou de rotina perfeita para dormir melhor. Precisa entender o que esta sabotando o que ja deveria acontecer naturalmente - e remover esses obstaculos um por um.",
            "context": { "energyLevel": "medium", "timeOfDay": "evening" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Aplicacao Noturna",
        "description": "Desacelere o sistema antes de dormir.",
        "actions": [
          {
            "name": "Protocolo de desaceleracao",
            "description": "30 minutos antes de dormir: tela desligada, luz baixa e 1 anotacao do dia.",
            "icon": "📝",
            "duration": 30,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "Seu sistema nervoso nao tem um botao de desligar. Ele precisa de uma rampa de descida - um conjunto de sinais ambientais e comportamentais que avisem ao corpo que o dia acabou e que e seguro soltar a guarda. Sem essa rampa, voce deita, fecha os olhos e a cabeca continua em modo de execucao.\n[[page]]\nO protocolo e simples: 30 minutos antes de dormir, tela desligada ou em modo noturno com brilho minimo. Luz do ambiente reduzida - trocar o teto por um abajur ou deixar so a luz do corredor ja faz diferenca mensuravel. Uma anotacao rapida do que ficou aberto no dia - nao para resolver, mas para retirar da memoria ativa e colocar em algum lugar fisico. E temperatura do quarto mais baixa do que voce acha que precisa. Esses quatro elementos, juntos, constroem a rampa de descida que o corpo precisa para entrar em sono profundo mais rapido e permanecer mais tempo nele.",
            "preFlight": ["Luz baixa", "Celular fora da mao", "Caderno ou notas"],
            "context": { "energyLevel": "low", "timeOfDay": "night" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1320
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c02',
  'Leitura Ativa',
  'Habito de leitura com retencao real para absorver de verdade o que voce le.',
  'Soberano System',
  5,
  50,
  false,
  '📚',
  7,
  array['consciencia', 'basico', 'aprendizado', 'produtividade', 'leitura', 'retencao'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c02",
    "title": "Leitura Ativa",
    "description": "Habito de leitura com retencao real para absorver de verdade o que voce le.",
    "author": "Soberano System",
    "price": 50,
    "durationDays": 7,
    "coverImage": "📚",
    "tags": ["consciencia", "basico", "aprendizado", "produtividade", "leitura", "retencao"],
    "primaryAssetId": "consciencia",
    "campaignTier": "basico",
    "campaignType": "aprendizado",
    "campaignTheme": "produtividade",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura de Base",
        "description": "Entenda por que tanta leitura evapora rapido.",
        "actions": [
          {
            "name": "Por que voce esquece o que le",
            "description": "Leia a aula na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 1,
            "briefing": "O problema nao e memoria. E metodo.\n[[page]]\nA maioria das pessoas le de forma passiva - os olhos percorrem as linhas, as palavras fazem sentido no momento, e duas semanas depois sobra so uma impressao vaga do que o livro era \"sobre\". Isso nao e falha de inteligencia. E o resultado de um processo de leitura que nunca foi projetado para reter, so para avancar.\n[[page]]\nO cerebro retem o que reconstroi, nao o que absorve.\n\nQuando voce le sem interagir com o texto - sem parar, sem questionar, sem conectar com o que ja sabe - o conteudo passa pelo processamento de curto prazo e nao chega a memoria de longo prazo. E o mesmo mecanismo que faz voce esquecer o nome de alguem segundos depois de ser apresentado: a informacao entrou, mas nao teve ancora suficiente para fixar.\n[[page]]\nSublinhar nao resolve. Na maioria das vezes, piora.\n\nSublinhar da a sensacao de estar aprendendo sem o trabalho real de aprender. Voce marca a frase porque ela parece importante - mas o cerebro nao processou por que ela e importante, nem como ela se conecta ao resto. Releituras de trechos sublinhados produzem a ilusao de familiaridade, que o cerebro confunde com compreensao. Nao e a mesma coisa.\n[[page]]\nA tecnica que funciona e a da reconstrucao.\n\nAo final de cada sessao de leitura - nao do livro inteiro, da sessao - feche o livro e escreva com suas proprias palavras a ideia principal que ficou. Uma ideia. Nao um resumo, nao bullet points, nao transcricao. A ideia que o seu cerebro escolheu reter quando voce nao podia mais olhar para o texto. Esse processo de reconstrucao e o que move a informacao do processamento passivo para a memoria ativa - e e o que faz a diferenca entre ler e aprender.",
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Retencao em Campo",
        "description": "Leia menos no automatico e retenha mais no fim da sessao.",
        "actions": [
          {
            "name": "Sessao de 20 minutos com metodo",
            "description": "Leia 20 minutos e registre com suas palavras 1 ideia que ficou.",
            "icon": "📝",
            "duration": 20,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "20 minutos e suficiente quando o processo e certo.\n[[page]]\nA maioria das pessoas acredita que precisa de longos blocos de tempo para ler de forma produtiva. Nao precisa. 20 minutos de leitura ativa produzem mais retencao do que 2 horas de leitura passiva - porque o que determina o aprendizado nao e o tempo gasto, e o que o cerebro faz com o conteudo durante e depois da leitura.\n[[page]]\nO protocolo e simples e nao negocia.\n\nLeia por 20 minutos sem interrupcao - sem celular, sem notificacao, sem pausas para checar qualquer coisa. Quando o tempo acabar, feche o livro ou vire a tela. Nao vale \"so mais um paragrafo\". O encerramento deliberado e parte do metodo - ele sinaliza ao cerebro que chegou a hora de consolidar o que foi lido.\n[[page]]\nEntao escreva. Com suas palavras. Sem olhar para o texto.\n\nUma ideia. Pode ser uma frase, pode ser um paragrafo. O criterio nao e tamanho - e que seja genuinamente sua reconstrucao do que ficou, nao uma transcricao do que voce lembra ter lido. Se voce nao consegue escrever nada sem olhar para o texto, isso e um dado importante: significa que a leitura foi passiva. Sem julgamento - so observacao. Na proxima sessao, leia menos e processe mais.",
            "preFlight": ["Livro atual", "Caneta ou notas", "Ambiente sem notificacao"],
            "context": { "energyLevel": "medium", "timeOfDay": "night" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1260
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c03',
  'Corpo em Movimento',
  'Anti-sedentarismo para quem trabalha sentado, com movimento que cabe no dia real.',
  'Soberano System',
  5,
  50,
  false,
  '🚶',
  7,
  array['fisico', 'basico', 'pratica', 'exercicio', 'movimento', 'sedentarismo'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c03",
    "title": "Corpo em Movimento",
    "description": "Anti-sedentarismo para quem trabalha sentado, com movimento que cabe no dia real.",
    "author": "Soberano System",
    "price": 50,
    "durationDays": 7,
    "coverImage": "🚶",
    "tags": ["fisico", "basico", "pratica", "exercicio", "movimento", "sedentarismo"],
    "primaryAssetId": "fisico",
    "campaignTier": "basico",
    "campaignType": "pratica",
    "campaignTheme": "exercicio",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Quebra de Inercia",
        "description": "Tire o corpo do modo cadeira ao longo do dia.",
        "actions": [
          {
            "name": "Alerta de movimento",
            "description": "A cada 90 minutos sentado: levante e faca 10 agachamentos ou 2 minutos de caminhada.",
            "icon": "⏰",
            "duration": 5,
            "repetitions": 4,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "Gastos impulsivos raramente parecem impulsos no momento.\n[[page]]\nA compra por impulso tem uma narrativa. \"Estava em promocao.\" \"Eu mereco.\" \"Vou usar muito.\" \"Era so R$30.\" Cada uma dessas frases e real no momento em que e pensada - o problema e que elas sao produzidas pelo mesmo sistema que esta tomando a decisao, entao parecem racionais quando nao sao. O impulso nao se apresenta como impulso. Ele se apresenta como bom senso.\n[[page]]\nPor baixo de quase todo gasto impulsivo existe um gatilho emocional.\n\nTedio, ansiedade, frustracao, celebracao, inseguranca - emocoes geram desconforto, e o consumo oferece alivio rapido. A compra ativa o sistema de recompensa do cerebro de forma imediata e previsivel. O problema e que esse alivio dura minutos, e o gasto dura meses no extrato. Com o tempo, o padrao se automatiza: emocao desconfortavel -> compra -> alivio temporario -> culpa -> nova emocao desconfortavel. O ciclo se fecha e recomeça.\n[[page]]\nO gasto invisivel nao e o maior. E o mais frequente.\n\nAssinaturas esquecidas, compras pequenas que nao parecem contar, conveniencias que viram habito - esses gastos nunca sao o problema isoladamente. O problema e que eles nao sao percebidos como decisoes. Eles acontecem no piloto automatico, fora do campo de consciencia onde qualquer avaliacao real poderia ocorrer. Voce nao decide gastar. Voce simplesmente gasta.\n[[page]]\nO primeiro passo nao e cortar. E ver.\n\nNao existe controle real sobre o que nao e percebido. Antes de qualquer planilha, antes de qualquer meta de economia, e preciso tornar o invisivel visivel - registrar o que acontece, quando acontece e o que estava sendo sentido antes de acontecer. Esse registro nao e punicao. E o unico jeito de trabalhar com dados reais em vez de suposicoes sobre o proprio comportamento financeiro.",
            "preFlight": ["Alarme ou lembrete", "Espaco minimo para levantar"],
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX"],
            "scheduledStartTime": 600
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Fechamento do Corpo",
        "description": "Solte as travas do dia antes de dormir.",
        "actions": [
          {
            "name": "Sequencia noturna de 5 minutos",
            "description": "Antes de dormir, execute 3 alongamentos fixos do protocolo.",
            "icon": "🧘",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "Registrar nao e julgar. E observar.\n[[page]]\nDurante 7 dias, toda vez que voce gastar dinheiro - ou sentir vontade de gastar e nao gastar - anote. O valor, o que foi, e em uma linha: o que voce estava sentindo antes. Nao precisa ser preciso. \"Estava entediado.\" \"Tinha acabado de ter uma reuniao ruim.\" \"Estava feliz e queria comemorar.\" Qualquer coisa que captura o estado emocional anterior ao gasto.\n[[page]]\nA classificacao vem depois, nao antes.\n\nAo registrar, nao tente decidir na hora se foi impulso ou intencao. So anote. A classificacao acontece no final do dia, quando voce olha para os registros com distancia emocional. Impulso e o gasto que voce nao teria feito se tivesse esperado 24 horas. Intencao e o gasto que voce teria feito de qualquer forma. Essa distincao, feita com calma, e mais honesta do que qualquer julgamento feito no momento da compra.\n[[page]]\nAo final de 7 dias, o padrao aparece sozinho.\n\nVoce nao precisa analisar. So precisa olhar. Em que situacoes voce gasta sem pensar? Que tipo de gasto se repete? Que valor medio tem o impulso tipico? Essas perguntas nao tem resposta certa - tem a sua resposta, que e a unica que importa para mudar o comportamento.",
            "preFlight": ["Espaco no chao", "Roupa confortavel"],
            "context": { "energyLevel": "low", "timeOfDay": "night" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1290
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c04',
  'Controle de Impulsos',
  'Gestao de gastos e decisoes no automatico para enxergar o padrao antes de cortar.',
  'Soberano System',
  5,
  50,
  false,
  '💸',
  7,
  array['financas', 'basico', 'aprendizado', 'estrategia', 'gastos', 'impulso'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c04",
    "title": "Controle de Impulsos",
    "description": "Gestao de gastos e decisoes no automatico para enxergar o padrao antes de cortar.",
    "author": "Soberano System",
    "price": 50,
    "durationDays": 7,
    "coverImage": "💸",
    "tags": ["financas", "basico", "aprendizado", "estrategia", "gastos", "impulso"],
    "primaryAssetId": "financas",
    "campaignTier": "basico",
    "campaignType": "aprendizado",
    "campaignTheme": "estrategia",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura de Base",
        "description": "Veja o gasto invisivel antes de tentar controlar tudo.",
        "actions": [
          {
            "name": "O gasto que voce nao ve",
            "description": "Leia a aula na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 1,
            "briefing": "D1 - O Controle\n[[page]]\nExiste uma linha que divide tudo na sua vida em dois lados.\n\nDe um lado: o que depende de voce. Seus pensamentos, suas escolhas, suas respostas, seus esforcos. Do outro lado: tudo o mais. O que as pessoas pensam de voce, o resultado das suas decisoes, o clima, o transito, a economia, o comportamento dos outros. Os estoicos chamavam essa divisao de dicotomia do controle - e consideravam a confusao entre os dois lados a principal fonte de sofrimento humano.\n[[page]]\nO problema nao e que coisas ruins acontecem. E que gastamos energia tentando controlar o que nao controlamos.\n\nVoce se preocupa com a opiniao do seu chefe sobre uma apresentacao que ja foi entregue. Voce rumina sobre uma conversa que ja aconteceu. Voce anseia por um resultado que depende de dez variaveis fora do seu alcance. Toda essa energia gasta no lado errado da linha nao muda nada no mundo externo - so drena o que voce tinha disponivel para o que realmente depende de voce.\n[[page]]\nIdentificar o lado da linha onde cada coisa esta nao e resignacao. E precisao.\n\nQuando voce para e pergunta \"isso depende de mim?\" antes de gastar energia em qualquer coisa, duas coisas acontecem. O que esta fora do seu controle perde o poder de te paralisar - porque voce conscientemente escolhe nao investir ali. E o que esta dentro do seu controle recebe atencao total - porque e o unico lugar onde seu esforco produz resultado real.\n[[page]]\nA pratica nao elimina o desconforto. Ela redireciona onde voce coloca o peso.\n[[page]]\nD2 - A Adversidade\n[[page]]\nOs estoicos nao acreditavam em evitar dificuldade. Acreditavam em usa-la.\n\nPara Marco Aurelio, Seneca e Epicteto - tres homens que viveram sob perseguicao, exilio e escravidao - a adversidade nao era o oposto do crescimento. Era o instrumento dele. O obstaculo nao estava no caminho. O obstaculo era o caminho. Essa inversao nao e otimismo forcado. E uma conclusao pratica sobre como o carater humano se desenvolve.\n[[page]]\nNinguem se torna resiliente em condicoes confortaveis.\n\nTolerancia a frustracao, capacidade de continuar sob pressao, clareza de valores quando tudo esta dificil - essas qualidades nao aparecem porque voce as deseja. Aparecem porque foram testadas e voce escolheu continuar. A adversidade e o unico ambiente onde esse teste pode acontecer. Evita-la sistematicamente nao e prudencia - e a garantia de que voce nunca vai descobrir do que e capaz.\n[[page]]\nA pergunta estoica diante de qualquer dificuldade e sempre a mesma: o que isso me permite praticar?\n\nPaciencia. Criatividade. Humildade. Persistencia. Cada obstaculo especifico convoca uma virtude especifica - e a virtude so se desenvolve quando e convocada de verdade, nao em simulacao. A adversidade e o unico teste que conta.\n[[page]]\nIsso nao significa que dificuldade nao doi. Significa que a dor pode ter direcao.\n[[page]]\nD3 - O Tempo\n[[page]]\nVoce age como se tivesse tempo sobrando. Os estoicos agiam como se nao tivessem.\n\nSeneca escreveu que o problema nao e termos pouco tempo - e desperdicarmos muito do que temos. A vida e longa o suficiente para quase tudo que importa, se usada com intencao. O que a encurta nao e o calendario. E a atencao dividida, o adiamento cronico e a ilusao de que o momento certo esta sempre a frente.\n[[page]]\nA morte nao e o tema estoico favorito por morbidez. E por clareza.\n\nA pratica do memento mori - lembrar que voce vai morrer - nao foi criada para deprimir. Foi criada para calibrar. Quando voce tem consciencia real da finitude, as decisoes sobre onde colocar atencao e energia mudam. O que voce estava tolerando por preguica se torna inaceitavel. O que voce estava adiando por medo se torna urgente. A perspectiva da morte nao paralisa - ela prioriza.\n[[page]]\nViver bem nao e viver muito. E viver com presenca no que esta acontecendo agora.\n\nO passado nao existe mais. O futuro ainda nao existe. O unico lugar onde qualquer coisa real pode acontecer e o momento presente - e e exatamente o lugar onde a maioria das pessoas menos esta. Pensar no passado, antecipar o futuro, planejar, ruminar, imaginar - tudo isso tem seu lugar. Mas quando ocupa o espaco do presente de forma cronica, a vida passa sem ser vivida.\n[[page]]\nD4 - A Virtude\n[[page]]\nPara os estoicos, virtude nao era um conceito moral abstrato. Era uma habilidade pratica.\n\nCoragem, justica, temperanca e sabedoria - as quatro virtudes cardinais do estoicismo - nao eram qualidades que voce tinha ou nao tinha. Eram capacidades que se desenvolviam com pratica deliberada, da mesma forma que um musculo se desenvolve com treino. Voce nao era corajoso ou covarde por natureza. Voce praticava coragem ou evitava situacoes que a exigiam.\n[[page]]\nA virtude era o unico bem real porque era o unico bem que nao podia ser tirado de voce.\n\nRiqueza, reputacao, saude, relacionamentos - tudo isso pode ser perdido por circunstancias fora do seu controle. Sua forma de responder ao que acontece com voce nunca pode ser tirada sem a sua permissao. E por isso que Epicteto, que foi escravo, escrevia sobre liberdade com mais autoridade do que a maioria dos homens livres. Ele entendia que a liberdade real nao estava nas correntes - estava em como ele escolhia responder a elas.\n[[page]]\nPraticar virtude nao e ser perfeito. E fazer a escolha certa uma vez a mais do que voce teria feito ontem.\n[[page]]\nD5 - O Julgamento\n[[page]]\nVoce nao reage as coisas. Voce reage a sua interpretacao das coisas.\n\nEpicteto dizia que os homens nao sao perturbados pelos eventos, mas pelas opinioes que formam sobre os eventos. Um engarrafamento nao e estressante - a ideia de que seu tempo esta sendo desperdicado e que produz o stress. Uma critica nao e dolorosa - a interpretacao de que ela ameaca sua imagem e que doi. O evento e neutro. O julgamento e seu.\n[[page]]\nIsso tem uma implicacao pratica enorme: voce pode mudar como se sente sem mudar o que acontece.\n\nNao por negacao - os estoicos eram realistas, nao ingenuos. Mas por revisao do julgamento. Antes de reagir a qualquer coisa, existe um espaco - pequeno, mas real - entre o estimulo e a resposta. Nesse espaco esta a sua liberdade. A pratica estoica e expandir esse espaco: perceber o julgamento antes de agir a partir dele.\n[[page]]\nA pergunta que expande esse espaco e simples: isso e tao grave quanto parece agora?\n\nNa maioria das vezes, a resposta honesta e nao.\n[[page]]\nD6 - A Comunidade\n[[page]]\nOs estoicos acreditavam que o ser humano nao existe isolado. Existe em relacao.\n\nMarco Aurelio escrevia repetidamente sobre a interdependencia humana - a ideia de que cada pessoa e parte de um sistema maior, e que agir bem dentro desse sistema nao e altruismo. E a funcao natural de quem entende onde esta. Voce foi formado por outros. Voce sera lembrado pelo que fez pelos outros. Ignorar isso nao e independencia - e uma forma de desorientacao.\n[[page]]\nMas comunidade estoica nao e conformidade. E responsabilidade.\n\nFazer parte de um grupo, de uma familia, de uma sociedade, nao significa abrir mao dos proprios valores para agradar. Significa contribuir com o que voce tem de melhor para o sistema do qual faz parte - e manter seus principios mesmo quando o grupo pressiona na direcao oposta. O estoico nao segue a multidao. Mas tambem nao vive para se distinguir dela. Vive para servir ao que e genuinamente bom.\n[[page]]\nA pergunta estoica sobre qualquer relacao e: o que eu devo a essa pessoa como ser humano? Nao como resultado, nao como troca - como dever.\n[[page]]\nD7 - O Carater\n[[page]]\nCarater nao e o que voce mostra quando esta sendo observado. E o que voce faz quando nao esta.\n\nOs estoicos tinham pouco interesse em reputacao e muito interesse em carater - porque entendiam que reputacao e o que os outros pensam de voce, e carater e o que voce realmente e. A distancia entre os dois e a medida da sua integridade. Construir reputacao sem carater e construir sobre areia - funciona enquanto as circunstancias colaboram, e desmorona quando param de colaborar.\n[[page]]\nCarater se revela sob pressao, nao sob conforto.\n\nE facil ser generoso quando esta sobrando. E facil ser paciente quando nada esta testando sua paciencia. E facil manter principios quando mante-los nao custa nada. O estoicismo nao tinha interesse nessa versao de virtude - ela nao conta porque nao foi testada. O que conta e como voce age quando esta cansado, quando esta com raiva, quando ninguem esta olhando e quando a escolha certa e a mais dificil.\n[[page]]\nAo final desse ciclo de 7 dias, a pergunta nao e o que voce aprendeu sobre estoicismo. E o que voce fez diferente por causa disso.",
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Diagnostico do Impulso",
        "description": "Observe a vontade de gastar sem tentar corrigir antes da hora.",
        "actions": [
          {
            "name": "Registro do impulso do dia",
            "description": "Anote 1 gasto ou vontade de gastar e classifique: impulso ou intencao.",
            "icon": "📝",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "O principio lido hoje nao e teoria. E uma lente.\n[[page]]\nAo final do dia, voce vai olhar para o que aconteceu atraves dessa lente especifica - nao para todos os seus problemas, nao para sua vida inteira. Para um momento. Uma situacao. Uma decisao. Algo do dia de hoje que o principio ilumina de uma forma que voce nao teria visto sem ele.\n[[page]]\nO formato e fixo e leva menos de 5 minutos.\n\nTres perguntas, tres respostas curtas. O que aconteceu - descreva o momento sem julgamento, so os fatos. Como o principio do dia se aplica a esse momento - nao o que voce deveria ter feito, o que o principio diria sobre o que aconteceu. E o que voce faria diferente com essa perspectiva - uma acao concreta, nao uma intencao vaga.\n[[page]]\nA honestidade aqui vale mais do que a resposta certa.\n\nVoce nao esta sendo avaliado. Esta construindo um registro real do que acontece quando voce tenta aplicar uma ideia filosofica a vida real - e isso inclui os dias em que nao conseguiu, os dias em que o principio nao ajudou e os dias em que voce agiu exatamente contra o que acabou de ler. Esses registros sao os mais valiosos.",
            "preFlight": ["Bloco de notas", "Honestidade sem culpa"],
            "context": { "energyLevel": "low", "timeOfDay": "night" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1260
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c05',
  'Presenca Real',
  'Qualidade nos vinculos proximos para estar de verdade quando esta com alguem.',
  'Soberano System',
  5,
  50,
  false,
  '🤝',
  7,
  array['conexoes', 'basico', 'pratica', 'socializacao', 'presenca', 'relacoes'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c05",
    "title": "Presenca Real",
    "description": "Qualidade nos vinculos proximos para estar de verdade quando esta com alguem.",
    "author": "Soberano System",
    "price": 50,
    "durationDays": 7,
    "coverImage": "🤝",
    "tags": ["conexoes", "basico", "pratica", "socializacao", "presenca", "relacoes"],
    "primaryAssetId": "conexoes",
    "campaignTier": "basico",
    "campaignType": "pratica",
    "campaignTheme": "socializacao",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura de Base",
        "description": "Diferencie presenca fisica de presenca real.",
        "actions": [
          {
            "name": "A diferenca entre estar junto e estar presente",
            "description": "Leia a aula na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 1,
            "briefing": "",
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Presenca Intencional",
        "description": "Leve a atencao inteira para 1 encontro real por dia.",
        "actions": [
          {
            "name": "Janela de presenca intencional",
            "description": "Escolha 1 interacao do dia e mantenha o celular virado para baixo ou fora do bolso.",
            "icon": "🫱",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "",
            "preFlight": ["Uma interacao real", "Celular longe da mao"],
            "context": { "energyLevel": "medium", "timeOfDay": "evening" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1140
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c06',
  'Detox Digital',
  'Reducao de tela e ruido mental sem drama e sem cortar tudo de vez.',
  'Soberano System',
  5,
  50,
  false,
  '📵',
  7,
  array['espaco-mental', 'basico', 'manutencao', 'psicologia', 'tela', 'scroll'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c06",
    "title": "Detox Digital",
    "description": "Reducao de tela e ruido mental sem drama e sem cortar tudo de vez.",
    "author": "Soberano System",
    "price": 50,
    "durationDays": 7,
    "coverImage": "📵",
    "tags": ["espaco-mental", "basico", "manutencao", "psicologia", "tela", "scroll"],
    "primaryAssetId": "espaco-mental",
    "campaignTier": "basico",
    "campaignType": "manutencao",
    "campaignTheme": "psicologia",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura de Base",
        "description": "Entenda o custo real do scroll infinito.",
        "actions": [
          {
            "name": "O que o scroll faz com o seu cerebro",
            "description": "Leia a aula na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 1,
            "briefing": "",
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Janela Sem Tela",
        "description": "Recupere um intervalo limpo no seu dia.",
        "actions": [
          {
            "name": "Janela livre de tela",
            "description": "Defina 1 periodo do dia sem tela por pelo menos 30 minutos.",
            "icon": "🧘",
            "duration": 30,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "",
            "preFlight": ["Horario escolhido", "Celular longe"],
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 480
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c07',
  'Voz e Presenca',
  'Comunicacao e expressao pessoal para falar com clareza e ser ouvido de verdade.',
  'Soberano System',
  5,
  50,
  false,
  '🎙️',
  7,
  array['conexoes', 'basico', 'pratica', 'socializacao', 'comunicacao', 'clareza'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c07",
    "title": "Voz e Presenca",
    "description": "Comunicacao e expressao pessoal para falar com clareza e ser ouvido de verdade.",
    "author": "Soberano System",
    "price": 50,
    "durationDays": 7,
    "coverImage": "🎙️",
    "tags": ["conexoes", "basico", "pratica", "socializacao", "comunicacao", "clareza"],
    "primaryAssetId": "conexoes",
    "campaignTier": "basico",
    "campaignType": "pratica",
    "campaignTheme": "socializacao",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura de Base",
        "description": "Veja o que faz alguem ser ouvido de verdade.",
        "actions": [
          {
            "name": "Por que algumas pessoas sao ouvidas e outras nao",
            "description": "Leia a aula na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 1,
            "briefing": "",
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Sintese em Campo",
        "description": "Treine clareza antes de abrir a boca.",
        "actions": [
          {
            "name": "Exercicio de sintese",
            "description": "Escolha 1 ideia que voce precisa comunicar hoje e escreva em 2 frases antes de falar.",
            "icon": "✍️",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "",
            "preFlight": ["Tema que voce vai comunicar", "2 frases escritas antes"],
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 540
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c08',
  'Estoicismo Aplicado',
  'Filosofia pratica no cotidiano com 1 principio por dia, sem floreio.',
  'Soberano System',
  5,
  50,
  false,
  '🏛️',
  7,
  array['consciencia', 'basico', 'aprendizado', 'psicologia', 'estoicismo', 'principios'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c08",
    "title": "Estoicismo Aplicado",
    "description": "Filosofia pratica no cotidiano com 1 principio por dia, sem floreio.",
    "author": "Soberano System",
    "price": 50,
    "durationDays": 7,
    "coverImage": "🏛️",
    "tags": ["consciencia", "basico", "aprendizado", "psicologia", "estoicismo", "principios"],
    "primaryAssetId": "consciencia",
    "campaignTier": "basico",
    "campaignType": "aprendizado",
    "campaignTheme": "psicologia",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Principio do Dia",
        "description": "Receba 1 principio por dia e leve isso para a vida real.",
        "actions": [
          {
            "name": "Principio do dia",
            "description": "Leia o principio do dia na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "",
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 420
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Auditoria do Dia",
        "description": "Aplique o principio em 1 situacao concreta do seu dia.",
        "actions": [
          {
            "name": "Auditoria do dia pelo principio",
            "description": "Escreva 3 linhas: o que aconteceu, como o principio se aplicaria e o que voce fara diferente.",
            "icon": "📝",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "",
            "preFlight": ["1 situacao real do dia", "3 linhas honestas"],
            "context": { "energyLevel": "low", "timeOfDay": "night" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1260
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c09',
  'Mobilidade e Flexibilidade',
  'Corpo funcional alem da academia com movimento que previne e recupera.',
  'Soberano System',
  5,
  50,
  false,
  '🤸',
  7,
  array['fisico', 'basico', 'pratica', 'exercicio', 'mobilidade', 'flexibilidade'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c09",
    "title": "Mobilidade e Flexibilidade",
    "description": "Corpo funcional alem da academia com movimento que previne e recupera.",
    "author": "Soberano System",
    "price": 50,
    "durationDays": 7,
    "coverImage": "🤸",
    "tags": ["fisico", "basico", "pratica", "exercicio", "mobilidade", "flexibilidade"],
    "primaryAssetId": "fisico",
    "campaignTier": "basico",
    "campaignType": "pratica",
    "campaignTheme": "exercicio",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Mobilidade Matinal",
        "description": "Acorde o corpo com um protocolo simples e funcional.",
        "actions": [
          {
            "name": "Sequencia de mobilidade matinal",
            "description": "10 minutos ao acordar com rotacao de quadril, abertura de ombros e mobilizacao de coluna.",
            "icon": "🧘",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "",
            "preFlight": ["Espaco minimo", "Chao livre"],
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 420
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Ponto de Tensao",
        "description": "Ataque a regiao do corpo que mais acumulou rigidez no dia.",
        "actions": [
          {
            "name": "Ponto de tensao do dia",
            "description": "Identifique onde o corpo travou hoje e faca o alongamento especifico indicado para essa regiao.",
            "icon": "🎯",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "",
            "preFlight": ["Perceber a tensao principal do corpo"],
            "context": { "energyLevel": "low", "timeOfDay": "night" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1260
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c10',
  'Criatividade em Sprint',
  'Desbloqueio criativo com metodo para sair do branco e entrar em movimento em minutos.',
  'Soberano System',
  5,
  50,
  false,
  '⚡',
  7,
  array['consciencia', 'basico', 'pratica', 'produtividade', 'criatividade', 'sprint'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c10",
    "title": "Criatividade em Sprint",
    "description": "Desbloqueio criativo com metodo para sair do branco e entrar em movimento em minutos.",
    "author": "Soberano System",
    "price": 50,
    "durationDays": 7,
    "coverImage": "⚡",
    "tags": ["consciencia", "basico", "pratica", "produtividade", "criatividade", "sprint"],
    "primaryAssetId": "consciencia",
    "campaignTier": "basico",
    "campaignType": "pratica",
    "campaignTheme": "produtividade",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura de Base",
        "description": "Quebre o mito da inspiracao perfeita.",
        "actions": [
          {
            "name": "Criatividade nao e inspiracao - e pressao",
            "description": "Leia a aula na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 1,
            "briefing": "",
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Sprint Criativo",
        "description": "Produza sem filtrar por uma janela curta e real.",
        "actions": [
          {
            "name": "Sprint de 15 minutos",
            "description": "Escolha 1 problema criativo aberto e produza por 15 minutos sem filtrar.",
            "icon": "✍️",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "",
            "preFlight": ["Problema criativo aberto", "Cronometro em 15 minutos"],
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 600
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
