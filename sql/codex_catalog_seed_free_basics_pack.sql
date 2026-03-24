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
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b01',
  'Foco Basico (Anti-Distracao)',
  'Instale uma semana de blindagem contra ruido e recupere janelas reais de foco.',
  'Soberano System',
  0,
  0,
  false,
  '🎯',
  7,
  array['espaco-mental', 'pratica', 'produtividade', 'foco', 'anti-distracao'],
  $json$
  {
    "id": "8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b01",
    "title": "Foco Basico (Anti-Distracao)",
    "description": "Instale uma semana de blindagem contra ruido e recupere janelas reais de foco.",
    "author": "Soberano System",
    "price": 0,
    "durationDays": 7,
    "coverImage": "🎯",
    "tags": ["espaco-mental", "pratica", "produtividade", "foco", "anti-distracao"],
    "primaryAssetId": "espaco-mental",
    "campaignType": "pratica",
    "campaignTheme": "produtividade",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Blindagem do Ambiente",
        "description": "Remova o atrito digital antes de pedir profundidade da mente.",
        "actions": [
          {
            "name": "Instalar bloqueador de sites",
            "description": "Escolha um bloqueador simples e monte uma lista minima de sites que roubam seu foco.",
            "icon": "🧱",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 1,
            "briefing": "Foco nao nasce no heroismo. Ele nasce quando o ruido perde acesso facil a voce.",
            "preFlight": ["Celular por perto", "Notebook aberto", "Lista dos sites mais usados"],
            "context": { "energyLevel": "medium", "timeOfDay": "morning" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Blocos de Profundidade",
        "description": "Testes curtos e longos para ensinar o sistema a sustentar concentracao.",
        "actions": [
          {
            "name": "Bloco de 30 min sem celular",
            "description": "Afaste o celular e complete uma meia hora de concentracao sem notificacoes.",
            "icon": "📵",
            "duration": 30,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "O primeiro passo e provar ao seu cerebro que meia hora limpa ja e possivel.",
            "preFlight": ["Modo aviao", "Cronometro", "Uma tarefa definida"],
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX"],
            "scheduledStartTime": 840
          },
          {
            "name": "Bloco de 60 min focado",
            "description": "Escolha uma unica tarefa relevante e sustente sessenta minutos inteiros de foco.",
            "icon": "⏳",
            "duration": 60,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 3,
            "briefing": "Depois do bloco curto, o bloco longo instala musculatura real de profundidade.",
            "preFlight": ["Janela de tempo livre", "Meta unica", "Agua por perto"],
            "context": { "energyLevel": "high", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "QUA", "SEX"],
            "scheduledStartTime": 540
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b02',
  'Manha Energetica',
  'Ajuste a partida do dia para acordar com mais energia, hidratacao e luz.',
  'Soberano System',
  0,
  0,
  false,
  '🌅',
  7,
  array['fisico', 'pratica', 'bem-estar', 'manha', 'energia'],
  $json$
  {
    "id": "8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b02",
    "title": "Manha Energetica",
    "description": "Ajuste a partida do dia para acordar com mais energia, hidratacao e luz.",
    "author": "Soberano System",
    "price": 0,
    "durationDays": 7,
    "coverImage": "🌅",
    "tags": ["fisico", "pratica", "bem-estar", "manha", "energia"],
    "primaryAssetId": "fisico",
    "campaignType": "pratica",
    "campaignTheme": "bem_estar",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Partida Limpa",
        "description": "Ative o corpo assim que o dia comecar.",
        "actions": [
          {
            "name": "Acordar no primeiro alarme",
            "description": "Levante no primeiro toque sem negociar com a cama.",
            "icon": "⏰",
            "duration": 2,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 3,
            "briefing": "A primeira decisao do dia define o tom das proximas.",
            "context": { "energyLevel": "low", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 420
          },
          {
            "name": "Beber 500ml de agua em jejum",
            "description": "Hidrate o corpo antes de cafe, tela ou conversa.",
            "icon": "💧",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "Seu sistema acorda seco. Agua cedo devolve presenca ao corpo.",
            "preFlight": ["Garrafa cheia", "Agua ao lado da cama ou pia livre"],
            "context": { "energyLevel": "low", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 425
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Ritmo Solar",
        "description": "Use luz e ar livre para acordar de verdade.",
        "actions": [
          {
            "name": "5 min de luz solar ou ar livre",
            "description": "Leve o corpo para a varanda, rua ou janela aberta e deixe a manha entrar.",
            "icon": "☀️",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "Luz cedo ajuda a regular energia, humor e a hora certa de sentir sono a noite.",
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 435
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b03',
  'Manutencao da Base (Casa)',
  'Arrume o minimo vital da casa para reduzir ruido mental e atrito diario.',
  'Soberano System',
  0,
  0,
  false,
  '🧹',
  7,
  array['espaco-mental', 'manutencao', 'autocuidado', 'casa', 'ordem'],
  $json$
  {
    "id": "8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b03",
    "title": "Manutencao da Base (Casa)",
    "description": "Arrume o minimo vital da casa para reduzir ruido mental e atrito diario.",
    "author": "Soberano System",
    "price": 0,
    "durationDays": 7,
    "coverImage": "🧹",
    "tags": ["espaco-mental", "manutencao", "autocuidado", "casa", "ordem"],
    "primaryAssetId": "espaco-mental",
    "campaignType": "manutencao",
    "campaignTheme": "autocuidado",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Acordar sem caos",
        "description": "Deixe o quarto entregar a primeira sensacao de ordem do dia.",
        "actions": [
          {
            "name": "Arrumar a cama ao levantar",
            "description": "Estique, alinhe e feche a cama antes de sair do quarto.",
            "icon": "🛏️",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "A cama pronta vira um sinal silencioso de que o dia ja comecou em ordem.",
            "context": { "energyLevel": "low", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 430
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Mesa sem ruido",
        "description": "Limpe o centro de operacao para facilitar foco e execucao.",
        "actions": [
          {
            "name": "Limpar a mesa de trabalho ou setup",
            "description": "Remova copos, cabos soltos, lixo visual e coisas que nao pertencem ao campo.",
            "icon": "🧼",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "Ambiente limpo reduz pequenas friccoes e deixa a mente menos congestionada.",
            "preFlight": ["Saco de lixo ou pano", "Um destino para os objetos soltos"],
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX"],
            "scheduledStartTime": 500
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b04',
  'HIIT Express (Queima Rapida)',
  'Tres treinos curtos e intensos para elevar pulso, calor e disposicao em duas semanas.',
  'Soberano System',
  0,
  0,
  false,
  '🔥',
  14,
  array['fisico', 'pratica', 'exercicio', 'hiit', 'energia'],
  $json$
  {
    "id": "8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b04",
    "title": "HIIT Express (Queima Rapida)",
    "description": "Tres treinos curtos e intensos para elevar pulso, calor e disposicao em duas semanas.",
    "author": "Soberano System",
    "price": 0,
    "durationDays": 14,
    "coverImage": "🔥",
    "tags": ["fisico", "pratica", "exercicio", "hiit", "energia"],
    "primaryAssetId": "fisico",
    "campaignType": "pratica",
    "campaignTheme": "exercicio",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Aquecimento e gatilho",
        "description": "Prepare o corpo para intensidade sem entrar frio demais.",
        "actions": [
          {
            "name": "Aquecimento de 5 minutos",
            "description": "Mobilidade, corrida parada e respiracao mais ativa para subir o corpo.",
            "icon": "⚡",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 1,
            "briefing": "Aquecimento curto evita que o treino nasca travado e reduz risco de lesao.",
            "preFlight": ["Espaco livre", "Agua por perto"],
            "context": { "energyLevel": "medium", "timeOfDay": "morning" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Tres disparos",
        "description": "Treinos curtos, alternados e sem enrolacao.",
        "actions": [
          {
            "name": "Treino HIIT 1",
            "description": "15 minutos alternando explosao e descanso curto.",
            "icon": "🏃",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 3,
            "briefing": "Primeiro disparo: entender o ritmo e encontrar sua margem.",
            "context": { "energyLevel": "high", "timeOfDay": "morning" }
          },
          {
            "name": "Treino HIIT 2 ou 3",
            "description": "Repita mais dois disparos em dias alternados na mesma janela da semana.",
            "icon": "🔥",
            "duration": 15,
            "repetitions": 2,
            "actionType": "Acao Recorrente",
            "difficulty": 4,
            "briefing": "A consistencia dos disparos vale mais do que inventar volume demais.",
            "preFlight": ["Timer pronto", "Roupa leve", "Descanso de um dia entre treinos"],
            "context": { "energyLevel": "high", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "QUA", "SEX"],
            "scheduledStartTime": 420
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b05',
  'Fundamentos da Calistenia',
  'Mapeie sua base corporal e execute um primeiro treino tecnico de calistenia.',
  'Soberano System',
  0,
  0,
  false,
  '🤸',
  7,
  array['fisico', 'pratica', 'exercicio', 'calistenia', 'base'],
  $json$
  {
    "id": "8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b05",
    "title": "Fundamentos da Calistenia",
    "description": "Mapeie sua base corporal e execute um primeiro treino tecnico de calistenia.",
    "author": "Soberano System",
    "price": 0,
    "durationDays": 7,
    "coverImage": "🤸",
    "tags": ["fisico", "pratica", "exercicio", "calistenia", "base"],
    "primaryAssetId": "fisico",
    "campaignType": "pratica",
    "campaignTheme": "exercicio",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Diagnostico corporal",
        "description": "Veja sua base real antes de tentar forcar volume.",
        "actions": [
          {
            "name": "Teste de flexoes maximas",
            "description": "Conte quantas repeticoes limpas voce consegue fazer sem roubar tecnica.",
            "icon": "💪",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 2,
            "briefing": "O ponto de partida importa mais do que parecer forte no primeiro dia.",
            "context": { "energyLevel": "medium", "timeOfDay": "morning" }
          },
          {
            "name": "Teste de agachamentos",
            "description": "Faça uma serie limpa e observe estabilidade, ritmo e respiracao.",
            "icon": "🦵",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 2,
            "briefing": "Seu corpo da sinais claros quando a base ainda precisa de ajuste.",
            "context": { "energyLevel": "medium", "timeOfDay": "morning" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Circuito de entrada",
        "description": "Monte um treino simples para ensinar forma, ritmo e constancia.",
        "actions": [
          {
            "name": "Treino basico de calistenia",
            "description": "Complete um circuito com flexoes inclinadas, agachamentos e prancha.",
            "icon": "🏋️",
            "duration": 20,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 3,
            "briefing": "Aqui voce deixa de medir e comeca a construir.",
            "preFlight": ["Espaco livre", "Cronometro", "Apoio estavel para inclinacao"],
            "context": { "energyLevel": "high", "timeOfDay": "afternoon" }
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b06',
  'Motor de Produtividade',
  'Configure o dia para proteger prioridade, entrega e ritmo de trabalho.',
  'Soberano System',
  0,
  0,
  false,
  '🛠️',
  7,
  array['trabalho', 'pratica', 'produtividade', 'execucao', 'prioridade'],
  $json$
  {
    "id": "8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b06",
    "title": "Motor de Produtividade",
    "description": "Configure o dia para proteger prioridade, entrega e ritmo de trabalho.",
    "author": "Soberano System",
    "price": 0,
    "durationDays": 7,
    "coverImage": "🛠️",
    "tags": ["trabalho", "pratica", "produtividade", "execucao", "prioridade"],
    "primaryAssetId": "trabalho",
    "campaignType": "pratica",
    "campaignTheme": "produtividade",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Vespera util",
        "description": "Prepare o terreno no dia anterior para reduzir dispersao no dia seguinte.",
        "actions": [
          {
            "name": "Listar as 3 tarefas mais importantes de amanha",
            "description": "Na noite anterior, escreva as tres entregas que mais importam.",
            "icon": "📝",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "Planejamento curto a noite reduz a inercia mental ao acordar.",
            "context": { "energyLevel": "low", "timeOfDay": "night" },
            "scheduledDays": ["DOM", "SEG", "TER", "QUA", "QUI"],
            "scheduledStartTime": 1260
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Golpe principal",
        "description": "Proteja a tarefa numero um antes que o resto tome o dia.",
        "actions": [
          {
            "name": "Executar a tarefa #1 antes do meio-dia",
            "description": "Pegue a primeira prioridade e avance nela antes de abrir o resto do ruido.",
            "icon": "🚀",
            "duration": 60,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 3,
            "briefing": "A energia boa do inicio do dia precisa ir para a frente, nao para o periferico.",
            "preFlight": ["Tarefa #1 definida", "Agenda limpa no inicio da manha"],
            "context": { "energyLevel": "high", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX"],
            "scheduledStartTime": 540
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b07',
  'Diario de Bordo (Journaling)',
  'Aprenda o minimo do journaling e transforme o dia em material de clareza.',
  'Soberano System',
  0,
  0,
  false,
  '📓',
  7,
  array['consciencia', 'aprendizado', 'psicologia', 'journaling', 'clareza'],
  $json$
  {
    "id": "8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b07",
    "title": "Diario de Bordo (Journaling)",
    "description": "Aprenda o minimo do journaling e transforme o dia em material de clareza.",
    "author": "Soberano System",
    "price": 0,
    "durationDays": 7,
    "coverImage": "📓",
    "tags": ["consciencia", "aprendizado", "psicologia", "journaling", "clareza"],
    "primaryAssetId": "consciencia",
    "campaignType": "aprendizado",
    "campaignTheme": "psicologia",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Microaula de Journaling",
        "description": "Primeiro entenda o mecanismo. Depois use a escrita como ferramenta.",
        "actions": [
          {
            "name": "Ler microaula: Journaling basico",
            "description": "Leia a microaula com calma, entenda a funcao do journaling e marque quando terminar.",
            "icon": "📚",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 1,
            "briefing": "Journaling e o habito de registrar pensamentos, decisoes e percepcoes por escrito, de forma regular. Nao e um diario sentimental nem uma tarefa escolar — e uma ferramenta de processamento mental. Quando voce escreve o que esta na cabeca, voce para de carregar aquilo em loop e comeca a enxergar com mais clareza.\n\nO erro mais comum e achar que precisa escrever certo, bonito ou muito. A maioria das pessoas trava antes de comecar porque espera inspiracao ou o momento perfeito. O journaling que funciona e o feio, o curto, o honesto — 3 linhas escritas todo dia valem mais do que 3 paginas escritas uma vez por mes.\n\nA regra simples e: escreva pelo menos 1 paragrafo sobre o seu dia, sem filtro e sem reler na hora. Pode ser o que aconteceu, o que voce sentiu, o que te incomodou ou o que voce decidiu. O objetivo nao e produzir um texto — e deixar o pensamento sair da cabeca e ganhar forma.\n\nCom o tempo, o journaling vira um espelho. Voce comeca a perceber padroes: o que drena sua energia, o que te motiva, onde voce age diferente do que pensa. Esse nivel de autoconhecimento nao aparece so pensando — ele aparece quando voce escreve e rele.\n\nAgora faca a proxima acao para fixar isso na pratica.",
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Aplicacao guiada",
        "description": "Agora use a ferramenta em um formato curto e simples.",
        "actions": [
          {
            "name": "Escrever 1 paragrafo sobre o dia atual",
            "description": "Registre o que marcou o dia, o que pesou e o que quer carregar para amanha.",
            "icon": "✍️",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "Aplicacao: use um formato de tres linhas. 1) Hoje aconteceu... 2) Isso me fez sentir... 3) Amanha eu quero... Nao corrija, nao floreie e nao tente parecer profundo. O objetivo aqui e treinar honestidade e observacao. Quanto mais simples e verdadeiro, melhor.",
            "preFlight": ["Caderno ou app de notas", "Um lugar minimamente silencioso"],
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
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b08',
  'Bussola Nutricional (Basico)',
  'Entenda sua base alimentar sem culpa e comece a observar o que entra no sistema.',
  'Soberano System',
  0,
  0,
  false,
  '🥗',
  7,
  array['fisico', 'aprendizado', 'nutricao', 'alimentacao', 'clareza'],
  $json$
  {
    "id": "8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b08",
    "title": "Bussola Nutricional (Basico)",
    "description": "Entenda sua base alimentar sem culpa e comece a observar o que entra no sistema.",
    "author": "Soberano System",
    "price": 0,
    "durationDays": 7,
    "coverImage": "🥗",
    "tags": ["fisico", "aprendizado", "nutricao", "alimentacao", "clareza"],
    "primaryAssetId": "fisico",
    "campaignType": "aprendizado",
    "campaignTheme": "nutricao",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Microaula de Nutricao Basica",
        "description": "Primeiro aprenda o conceito. Depois observe sua realidade.",
        "actions": [
          {
            "name": "Ler microaula: Taxa metabolica basal",
            "description": "Leia a microaula, entenda o que e TMB e marque quando terminar.",
            "icon": "🧮",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 1,
            "briefing": "A taxa metabolica basal (TMB) e a quantidade de calorias que seu corpo precisa para funcionar em repouso absoluto — respirar, bombear sangue, manter a temperatura, sustentar os orgaos. E o seu gasto minimo de energia, antes de qualquer movimento ou atividade.\n\nA maioria das pessoas nunca parou para calcular isso e por isso vive no escuro nutricional. Come por habito, por ansiedade ou por impulso — sem saber se esta acima, abaixo ou na faixa certa do que o corpo precisa. Sem essa referencia, qualquer mudanca alimentar e tentativa e erro no escuro.\n\nO erro mais comum e achar que comer menos e sempre melhor. Muita gente corta calorias abaixo da propria TMB sem saber, e o corpo responde com fadiga, queda de rendimento e dificuldade para perder gordura de verdade. Comer menos do que o corpo precisa para sobreviver e diferente de comer menos do que voce gasta.\n\nA regra simples e: descubra sua TMB, multiplique pelo seu nivel de atividade e voce tem seu gasto diario real. A partir dai, voce decide com consciencia — nao com achismo.\n\nAgora faca a proxima acao para fixar isso na pratica: registre tudo que voce comeu hoje e compare com sua TMB estimada.",
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Observacao guiada",
        "description": "Aplique a microaula olhando para um dia real de alimentacao.",
        "actions": [
          {
            "name": "Mapear tudo que comeu em um dia",
            "description": "Anote um dia inteiro de alimentacao sem julgar, editar ou tentar parecer melhor.",
            "icon": "📋",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 1,
            "briefing": "Aplicacao: registre horario, o que comeu, quanto comeu e como estava se sentindo. Se conseguir, note tambem o contexto: estava com pressa, cansado, ansioso, com fome real ou so no automatico? O objetivo nao e montar dieta. E descobrir padroes. Clareza vem antes de disciplina.",
            "preFlight": ["Bloco de notas", "Fotos das refeicoes se ajudar"],
            "context": { "energyLevel": "low", "timeOfDay": "night" }
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b09',
  'Radar Financeiro',
  'Ganhe visibilidade rapida do dinheiro que entra, sai e vaza.',
  'Soberano System',
  0,
  0,
  false,
  '📊',
  7,
  array['financas', 'manutencao', 'estrategia', 'dinheiro', 'clareza'],
  $json$
  {
    "id": "8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b09",
    "title": "Radar Financeiro",
    "description": "Ganhe visibilidade rapida do dinheiro que entra, sai e vaza.",
    "author": "Soberano System",
    "price": 0,
    "durationDays": 7,
    "coverImage": "📊",
    "tags": ["financas", "manutencao", "estrategia", "dinheiro", "clareza"],
    "primaryAssetId": "financas",
    "campaignType": "manutencao",
    "campaignTheme": "estrategia",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Ver o fluxo",
        "description": "Tire o dinheiro do escuro nem que seja por um unico dia.",
        "actions": [
          {
            "name": "Anotar todos os gastos de um unico dia",
            "description": "Registre tudo que saiu, do cafe ao aplicativo, sem tentar filtrar nada.",
            "icon": "🧾",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 1,
            "briefing": "O primeiro ganho financeiro e perceber padroes que estavam invisiveis.",
            "preFlight": ["App de notas ou planilha", "Extrato ou historico do dia"],
            "context": { "energyLevel": "medium", "timeOfDay": "evening" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Cortar o vazamento",
        "description": "Uma decisao pequena ja muda a sensacao de controle.",
        "actions": [
          {
            "name": "Cancelar 1 assinatura inutil ou definir limite no cartao",
            "description": "Escolha uma unica trava concreta para parar ou conter um vazamento.",
            "icon": "💳",
            "duration": 20,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 2,
            "briefing": "Controle financeiro cresce quando uma decisao sai da ideia e vira regra.",
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" }
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b10',
  'Sincronia de Rede',
  'Reative a rede e tire uma conexao do limbo com intencao.',
  'Soberano System',
  0,
  0,
  false,
  '🤝',
  7,
  array['conexoes', 'pratica', 'socializacao', 'network', 'presenca'],
  $json$
  {
    "id": "8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b10",
    "title": "Sincronia de Rede",
    "description": "Reative a rede e tire uma conexao do limbo com intencao.",
    "author": "Soberano System",
    "price": 0,
    "durationDays": 7,
    "coverImage": "🤝",
    "tags": ["conexoes", "pratica", "socializacao", "network", "presenca"],
    "primaryAssetId": "conexoes",
    "campaignType": "pratica",
    "campaignTheme": "socializacao",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Reabrir o canal",
        "description": "Volte a existir no radar de alguem com uma mensagem real.",
        "actions": [
          {
            "name": "Puxar assunto com um amigo ou contato antigo",
            "description": "Envie uma mensagem curta, humana e sem pedir nada em troca.",
            "icon": "💬",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 2,
            "briefing": "Reconectar nao exige performance. Exige presenca simples e sincera.",
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" }
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Tornar real",
        "description": "Converta a conversa em interacao marcada.",
        "actions": [
          {
            "name": "Marcar uma interacao real ou call",
            "description": "Convide para um cafe, videochamada, treino ou qualquer encontro curto e concreto.",
            "icon": "📞",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Compromisso",
            "difficulty": 2,
            "briefing": "Relacao fortalece quando sai da intencao solta e ganha data.",
            "preFlight": ["Uma proposta simples", "Dois horarios possiveis"],
            "context": { "energyLevel": "medium", "timeOfDay": "evening" }
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
