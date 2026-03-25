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
  '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a01',
  'Despertar de Ferro',
  'Treino estruturado com progressao real para acumular forca semana a semana.',
  'Soberano System',
  20,
  200,
  false,
  '🏋️',
  14,
  array['fisico', 'medio', 'pratica', 'exercicio', 'forca', 'progressao'],
  $json$
  {
    "id": "7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a01",
    "title": "Despertar de Ferro",
    "description": "Treino estruturado com progressao real para acumular forca semana a semana.",
    "author": "Soberano System",
    "price": 200,
    "durationDays": 14,
    "coverImage": "🏋️",
    "tags": ["fisico", "medio", "pratica", "exercicio", "forca", "progressao"],
    "primaryAssetId": "fisico",
    "campaignTier": "medio",
    "campaignType": "pratica",
    "campaignTheme": "exercicio",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Fundamento da Progressao",
        "description": "Entenda por que progresso sustentado vence intensidade solta.",
        "actions": [
          {
            "name": "Semana 1: Por que progressao bate intensidade / Semana 2: Recuperacao e treino",
            "description": "Leia a aula da semana na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 2,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "",
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG"],
            "scheduledStartTime": 420
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Treino e Registro",
        "description": "Aplique o protocolo e acompanhe o que seu corpo esta construindo.",
        "actions": [
          {
            "name": "Treino do dia - serie progressiva",
            "description": "Protocolo de 4 exercicios compostos. Semana 1 com volume base. Semana 2 com +1 serie por exercicio.",
            "icon": "🏋️",
            "duration": 35,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 3,
            "briefing": "",
            "preFlight": ["Espaco livre", "Carga ou peso corporal", "Agua por perto"],
            "context": { "energyLevel": "high", "timeOfDay": "morning" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX"],
            "scheduledStartTime": 420
          },
          {
            "name": "Log de carga e sensacao",
            "description": "Anote o que foi feito, a carga usada e como o corpo respondeu no dia.",
            "icon": "📝",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "",
            "preFlight": ["Bloco de notas ou campo rapido"],
            "context": { "energyLevel": "low", "timeOfDay": "night" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX"],
            "scheduledStartTime": 1260
          }
        ]
      }
    ]
  }
  $json$::jsonb
),
(
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d08',
  'Construcao de Cla',
  'Criar ou fortalecer seu circulo de alto nivel, porque quem esta ao seu redor define seu teto.',
  'Soberano System',
  15,
  150,
  false,
  '🛡️',
  14,
  array['conexoes', 'medio', 'pratica', 'socializacao', 'cla', 'vinculos'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d08",
    "title": "Construcao de Cla",
    "description": "Criar ou fortalecer seu circulo de alto nivel, porque quem esta ao seu redor define seu teto.",
    "author": "Soberano System",
    "price": 150,
    "durationDays": 14,
    "coverImage": "🛡️",
    "tags": ["conexoes", "medio", "pratica", "socializacao", "cla", "vinculos"],
    "primaryAssetId": "conexoes",
    "campaignTier": "medio",
    "campaignType": "pratica",
    "campaignTheme": "socializacao",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura de Base",
        "description": "Entenda o peso do ambiente social no seu padrao.",
        "actions": [
          {
            "name": "Semana 1: Voce e a media dos 5 / Semana 2: Como nutrir vinculos sem forcar",
            "description": "Leia a aula da semana na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 2,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "",
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG"],
            "scheduledStartTime": 480
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Mapa e Acao",
        "description": "Veja quem sustenta ou drena sua energia social e aja em cima disso.",
        "actions": [
          {
            "name": "Mapa de vinculos e acao intencional",
            "description": "Semana 1: liste seus 10 contatos mais frequentes. Semana 2: 1 acao intencional por dia em direcao a quem energiza.",
            "icon": "🗺️",
            "duration": 15,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "",
            "preFlight": ["Lista dos contatos frequentes", "Uma acao concreta por dia"],
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1080
          },
          {
            "name": "Qualidade do vinculo do dia",
            "description": "Registre se houve 1 troca de valor real hoje e qual foi.",
            "icon": "📝",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "",
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
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d09',
  'Financas com Intencao',
  'Organizar o dinheiro como quem constroi patrimonio, nao como quem apaga incendio.',
  'Soberano System',
  20,
  200,
  false,
  '📈',
  14,
  array['financas', 'medio', 'manutencao', 'estrategia', 'patrimonio', 'direcao'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d09",
    "title": "Financas com Intencao",
    "description": "Organizar o dinheiro como quem constroi patrimonio, nao como quem apaga incendio.",
    "author": "Soberano System",
    "price": 200,
    "durationDays": 14,
    "coverImage": "📈",
    "tags": ["financas", "medio", "manutencao", "estrategia", "patrimonio", "direcao"],
    "primaryAssetId": "financas",
    "campaignTier": "medio",
    "campaignType": "manutencao",
    "campaignTheme": "estrategia",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura de Base",
        "description": "Saia da logica de apagar incendio e entre em construcao intencional.",
        "actions": [
          {
            "name": "Semana 1: A diferenca entre controlar e construir / Semana 2: O primeiro passo do patrimonio",
            "description": "Leia a aula da semana na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 2,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "",
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG"],
            "scheduledStartTime": 480
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Mapa e Decisao",
        "description": "Mapeie seu dinheiro e registre as escolhas do ciclo.",
        "actions": [
          {
            "name": "Construcao do mapa financeiro",
            "description": "Semana 1: mapear entradas e saidas. Semana 2: definir 1 meta com valor e prazo e criar a arena correspondente.",
            "icon": "🧭",
            "duration": 20,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "",
            "preFlight": ["Entradas", "Saidas fixas", "Saidas variaveis"],
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" },
            "scheduledDays": ["SEG", "QUA", "SEX"],
            "scheduledStartTime": 1140
          },
          {
            "name": "Decisao financeira do dia",
            "description": "Registre 1 decisao financeira do dia e se ela foi intencional ou automatica.",
            "icon": "📝",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "",
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
  '9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d10',
  'Expressao Criativa',
  'Desenvolver uma linguagem propria com arte, escrita ou forma como ferramenta de identidade.',
  'Soberano System',
  10,
  100,
  false,
  '🎨',
  14,
  array['consciencia', 'medio', 'pratica', 'expressao', 'criatividade', 'identidade'],
  $json$
  {
    "id": "9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d10",
    "title": "Expressao Criativa",
    "description": "Desenvolver uma linguagem propria com arte, escrita ou forma como ferramenta de identidade.",
    "author": "Soberano System",
    "price": 100,
    "durationDays": 14,
    "coverImage": "🎨",
    "tags": ["consciencia", "medio", "pratica", "expressao", "criatividade", "identidade"],
    "primaryAssetId": "consciencia",
    "campaignTier": "medio",
    "campaignType": "pratica",
    "campaignTheme": "expressao",
    "levels": [
      {
        "level": 1,
        "title": "Fase 1: Leitura de Base",
        "description": "Tire a criatividade do pedestal e jogue ela para a pratica.",
        "actions": [
          {
            "name": "Semana 1: Expressao nao e talento - e pratica / Semana 2: Encontrar sua voz",
            "description": "Leia a aula da semana na aba Anotacao e marque quando terminar.",
            "icon": "📘",
            "duration": 15,
            "repetitions": 2,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "",
            "context": { "energyLevel": "medium", "timeOfDay": "morning" },
            "scheduledDays": ["SEG"],
            "scheduledStartTime": 540
          }
        ]
      },
      {
        "level": 2,
        "title": "Fase 2: Pratica e Reflexao",
        "description": "Produza um pouco por dia e observe o rastro da sua propria voz.",
        "actions": [
          {
            "name": "Sessao diaria de 20 minutos",
            "description": "Escolha o meio no inicio do ciclo e pratique 20 minutos por dia sem objetivo de resultado.",
            "icon": "🎨",
            "duration": 20,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 2,
            "briefing": "",
            "preFlight": ["Meio escolhido: escrita, desenho, musica ou fotografia"],
            "context": { "energyLevel": "medium", "timeOfDay": "afternoon" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1020
          },
          {
            "name": "O que saiu hoje",
            "description": "Registre em 1 linha o que foi criado ou tentado, sem julgar a qualidade.",
            "icon": "📝",
            "duration": 5,
            "repetitions": 1,
            "actionType": "Acao Recorrente",
            "difficulty": 1,
            "briefing": "",
            "context": { "energyLevel": "low", "timeOfDay": "night" },
            "scheduledDays": ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"],
            "scheduledStartTime": 1260
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
