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
values (
  '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a01',
  'Despertar de Ferro',
  'Resetar o sistema nervoso e ativar a musculatura em 15 minutos.',
  'Soberano System',
  200,
  200,
  false,
  '🏋️',
  7,
  array['fisico', 'movimento', 'ativacao', 'explosao'],
  $json$
  {
    "id": "7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a01",
    "title": "Despertar de Ferro",
    "description": "Resetar o sistema nervoso e ativar a musculatura em 15 minutos.",
    "author": "Soberano System",
    "price": 200,
    "durationDays": 7,
    "coverImage": "🏋️",
    "tags": ["fisico", "movimento", "ativacao", "explosao"],
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Mobilidade de Trono",
        "description": "Desbloqueie articulacoes e prepare o corpo para sair da inercia.",
        "actions": [
          {
            "name": "Mobilidade de Trono",
            "description": "Sequencia de agachamento profundo e rotacao de coluna.",
            "icon": "🦴",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Ação Recorrente",
            "difficulty": 2,
            "briefing": "Desbloqueie suas articulacoes antes de pedir explosao ao corpo.",
            "preFlight": ["Espaco livre", "Roupa leve", "Respiracao nasal"],
            "context": { "energyLevel": "low", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX"],
            "scheduledStartTime": 420
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Explosao Cardiaca",
        "description": "Aumente frequencia, calor e prontidao fisica com carga curta e intensa.",
        "actions": [
          {
            "name": "Explosao Cardiaca",
            "description": "Burpees e polichinelos de alta intensidade.",
            "icon": "🔥",
            "duration": 10,
            "repetitions": 3,
            "actionType": "Ação Recorrente",
            "difficulty": 4,
            "briefing": "Frequencia maxima agora. Suba o giro e ensine o corpo a responder.",
            "preFlight": ["Cronometro pronto", "Espaco ventilado", "Agua por perto"],
            "context": { "energyLevel": "high", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "QUA", "SEX"],
            "scheduledStartTime": 435
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a02',
  'Reset Dopaminergico',
  'Eliminar o brain fog e estabilizar a energia via biohacking alimentar.',
  'Soberano System',
  350,
  350,
  false,
  '⚗️',
  14,
  array['clareza', 'nutricao', 'jejum', 'biohacking'],
  $json$
  {
    "id": "7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a02",
    "title": "Reset Dopaminergico",
    "description": "Eliminar o brain fog e estabilizar a energia via biohacking alimentar.",
    "author": "Soberano System",
    "price": 350,
    "durationDays": 14,
    "coverImage": "⚗️",
    "tags": ["clareza", "nutricao", "jejum", "biohacking"],
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Alquimia Matinal",
        "description": "Abra o dia com um ritual biologico de clareza e ativacao.",
        "actions": [
          {
            "name": "Alquimia Matinal (Shot)",
            "description": "Limao, curcuma, gengibre e pimenta preta.",
            "icon": "🍋",
            "duration": 3,
            "repetitions": 1,
            "actionType": "Ação Recorrente",
            "difficulty": 1,
            "briefing": "Sua primeira medicina do dia. Ative o corpo antes do ruido entrar.",
            "preFlight": ["Limao", "Curcuma", "Gengibre", "Pimenta preta"],
            "context": { "energyLevel": "low", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 390
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Jejum de Soberano",
        "description": "Use o silencio digestivo para recuperar foco, estabilidade e energia limpa.",
        "actions": [
          {
            "name": "Jejum de Soberano (16h)",
            "description": "Protocolo de hidratacao e sais durante a janela de jejum.",
            "icon": "⏳",
            "duration": 16,
            "repetitions": 1,
            "actionType": "Ação Recorrente",
            "difficulty": 5,
            "briefing": "O silencio digestivo gera clareza mental e reduz o arrasto dopaminergico.",
            "preFlight": ["Agua", "Sais", "Janela alimentar definida"],
            "context": { "energyLevel": "medium", "timeOfDay": "night" }
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a03',
  'Foco Blindado',
  'Instalar a habilidade de entrar em estado de Flow sob comando.',
  'Soberano System',
  500,
  500,
  false,
  '🧠',
  14,
  array['foco', 'flow', 'deep-work', 'espaco-mental'],
  $json$
  {
    "id": "7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a03",
    "title": "Foco Blindado",
    "description": "Instalar a habilidade de entrar em estado de Flow sob comando.",
    "author": "Soberano System",
    "price": 500,
    "durationDays": 14,
    "coverImage": "🧠",
    "tags": ["foco", "flow", "deep-work", "espaco-mental"],
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Saneamento de Ruido",
        "description": "Limpe o ambiente e reduza interferencias antes de exigir profundidade.",
        "actions": [
          {
            "name": "Saneamento de Ruido",
            "description": "Protocolo de fechamento de abas e modo aviao.",
            "icon": "🔕",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Ação Recorrente",
            "difficulty": 3,
            "briefing": "Mate as notificacoes antes que elas matem seu tempo.",
            "preFlight": ["Modo aviao", "Abas fechadas", "Mesa limpa"],
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX"],
            "scheduledStartTime": 510
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Sessao de Profundidade",
        "description": "Entre em imersao total e sustente uma janela limpa de producao cognitiva.",
        "actions": [
          {
            "name": "Sessao de Profundidade",
            "description": "Tecnica de blocos de tempo sem interrupcao.",
            "icon": "🎯",
            "duration": 90,
            "repetitions": 1,
            "actionType": "Ação Recorrente",
            "difficulty": 5,
            "briefing": "Imersao total. Nada existe fora deste projeto.",
            "preFlight": ["Objetivo unico definido", "Timer armado", "Celular fora do alcance"],
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
  '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a04',
  'Logistica de Vanguarda',
  'Reduzir a carga cognitiva atraves da ordem externa impecavel.',
  'Soberano System',
  350,
  350,
  false,
  '🛡️',
  7,
  array['ordem', 'logistica', 'ambiente', 'planejamento'],
  $json$
  {
    "id": "7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a04",
    "title": "Logistica de Vanguarda",
    "description": "Reduzir a carga cognitiva atraves da ordem externa impecavel.",
    "author": "Soberano System",
    "price": 350,
    "durationDays": 7,
    "coverImage": "🛡️",
    "tags": ["ordem", "logistica", "ambiente", "planejamento"],
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Limpeza de Deck",
        "description": "Organize o campo imediato para reduzir friccao operacional.",
        "actions": [
          {
            "name": "Limpeza de Deck",
            "description": "Organizacao fisica do campo de trabalho imediato.",
            "icon": "🧹",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Ação Recorrente",
            "difficulty": 2,
            "briefing": "Mesa limpa, mente limpa.",
            "preFlight": ["Lixo removido", "Cabos alinhados", "Superficie limpa"],
            "context": { "energyLevel": "low", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX"],
            "scheduledStartTime": 480
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Planejamento de Batalha",
        "description": "Mapeie compromissos e entre na semana com direcao clara.",
        "actions": [
          {
            "name": "Planejamento de Batalha (Domingo)",
            "description": "Mapear compromissos e definir as 3 campanhas prioritarias.",
            "icon": "🗺️",
            "duration": 30,
            "repetitions": 1,
            "actionType": "Ação Recorrente",
            "difficulty": 4,
            "briefing": "Venca a semana antes dela comecar.",
            "preFlight": ["Agenda aberta", "3 prioridades definidas", "Blocos livres revisados"],
            "context": { "energyLevel": "medium", "timeOfDay": "evening" },
            "scheduledDays": ["DOM"],
            "scheduledStartTime": 1080
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
  'Assumir o governo total sobre as 10 areas da Maestria.',
  'Soberano System',
  400,
  400,
  false,
  '👑',
  21,
  array['proposito', 'maestria', 'governanca', 'identidade'],
  $json$
  {
    "id": "7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a05",
    "title": "O Pacto de Soberania",
    "description": "Assumir o governo total sobre as 10 areas da Maestria.",
    "author": "Soberano System",
    "price": 400,
    "durationDays": 21,
    "coverImage": "👑",
    "tags": ["proposito", "maestria", "governanca", "identidade"],
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Microaula de Diagnostico",
        "description": "Entenda primeiro o que significa diagnosticar a propria maestria com honestidade.",
        "actions": [
          {
            "name": "Ler microaula: Diagnostico de Maestria",
            "description": "Leia a microaula, entenda a funcao do diagnostico e marque quando terminar.",
            "icon": "🔟",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Ação Recorrente",
            "difficulty": 2,
            "briefing": "Diagnostico de Maestria e o processo de olhar honestamente para as principais areas da sua vida e identificar onde voce esta, onde deveria estar e o que esta faltando. Nao e uma analise academica — e um raio-X pessoal que exige coragem para encarar o que esta sendo evitado.\n\nA maioria das pessoas vive reagindo. Vai resolvendo o que aparece, apagando incendio, e nunca para para perguntar: Em que nivel eu realmente estou? O que eu quero dominar? O que esta me segurando? Sem esse diagnostico, voce pode passar anos se esforcando na direcao errada.\n\nO erro mais comum e confundir movimento com progresso. Estar ocupado nao significa estar evoluindo. O diagnostico serve exatamente para diferenciar o que parece produtivo do que realmente move o ponteiro nas areas que importam para voce.\n\nA regra simples e: escolha as areas centrais da sua vida (saude, mente, relacoes, financas, proposito) e de uma nota honesta para cada uma. Nao para se punir — mas para saber onde direcionar energia com intencao.\n\nO diagnostico nao e o fim — e o comeco. Ele transforma vago em especifico, ansiedade em foco, e desejo em direcao. Agora faca a proxima acao para fixar isso na pratica: sua Consagracao de Era comeca com o que voce acabou de enxergar.",
            "preFlight": ["Silencio", "Caderno aberto", "Ultimo ciclo em maos"],
            "context": { "energyLevel": "medium", "timeOfDay": "evening" },
            "scheduledDays": ["DOM"],
            "scheduledStartTime": 1140
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Aplicacao do pacto",
        "description": "Depois do diagnostico, transforme leitura em direcao concreta.",
        "actions": [
          {
            "name": "Consagracao de Era",
            "description": "Escrita do manifesto pessoal para o ciclo atual.",
            "icon": "✍️",
            "duration": 10,
            "repetitions": 1,
            "actionType": "Ação Recorrente",
            "difficulty": 5,
            "briefing": "Aplicacao: seu pacto precisa responder tres coisas. O que voce vai parar, o que vai proteger e o que vai construir neste ciclo. Se o texto nao virar regra pratica, ele e so uma frase bonita. O manifesto bom corta, prioriza e governa.",
            "preFlight": ["Manifesto anterior revisado", "Intencao do ciclo", "Frase de soberania"],
            "context": { "energyLevel": "high", "timeOfDay": "morning" },
            "scheduledDays": ["SEG"],
            "scheduledStartTime": 420
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
