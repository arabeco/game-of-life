# Catálogo de campanhas do Glyph

Exportado do banco (`public.codex_catalog`) em 27/10/2026. São 31 campanhas, com todo o conteúdo.
O JSON exato, para reimportar, está ao lado: `catalogo-2026-10-27.json`.

## Como ler e editar (para a IA)

Cada campanha é uma seção `##` com o **id** (não mude: é a chave no banco). Dentro dela:

- **Ficha**: os campos da linha do catálogo e do `template`.
- **Fases** (`levels`): cada fase tem título, descrição e ações.
- **Ações**: um bloco por ação com os campos abaixo. A **aula** (`briefing`) vem num bloco de texto; `[[page]]` separa as páginas que a pessoa passa no app.

Campos de uma ação e os valores que o app aceita:

| Campo | O que é | Valores |
|---|---|---|
| `name` | Nome da ação na tela | texto curto |
| `icon` | Emoji da ação | 1 emoji |
| `actionType` | Tipo | `Acao Recorrente` (se repete) ou `Compromisso` (uma vez, com data) |
| `repetitions` | Quantas vezes conta no ciclo | número |
| `duration` | Minutos por vez (vira EXP: ~1 por minuto) | mínimo 15, em passos de 15 (15, 30, 45, 60…) |
| `difficulty` | Dificuldade | 1 a 5 |
| `description` | Instrução curta que aparece na ação | 1–2 frases |
| `briefing` | A aula, na aba Anotação | texto longo, páginas separadas por `[[page]]` |
| `preFlight` | Checklist antes de começar | lista curta |
| `context.timeOfDay` | Melhor horário | `morning`, `afternoon`, `evening`, `night` |
| `context.energyLevel` | Energia que pede | `low`, `medium`, `high` |
| `scheduledDays` | Dias sugeridos | `SEG TER QUA QUI SEX SAB DOM` |
| `scheduledStartTime` | Hora sugerida | minutos desde 00:00 (420 = 07:00) |
| `dias` | **Novo (27/10):** em que dia(s) da fase a ação acontece, contando do 1. Ao iniciar, a pessoa escolhe "agendar tudo" e a data; cada ação cai no planner nos dias dela. Use no lugar de `scheduledDays`. | lista, ex.: `[1, 3, 5]` |

Campos da ficha: `price_gold` (preço em ouro, é o que o app cobra), `price_brl` (referência em reais), `price_fragments`, `duration_days`, `tags`, `campaignTier` (`basico`/`medio`/`avancado`), `campaignType` (`aprendizado`/`pratica`/`manutencao`), `campaignTheme`, `primaryAssetId` (área antiga do app).

Regras de escrita do Glyph: português do Brasil, frases diretas, sem prometer resultado milagroso, sem exemplos pessoais do dono do app.

Regras de montagem:

- **Cada aula é uma ação própria**, com nome e texto diferentes (`actionType: Compromisso`, `repetitions: 1`). Nunca uma ação só que se repete com "Semana 1 / Semana 2" no nome: cada leitura aparece no planner como uma ação distinta.
- A aula fica no `briefing` e aparece na aba **Anotação** da ação. No planner, a ação com aula ganha um ícone de texto; com checklist, um ícone de lista; com mídia, um de imagem.
- Se a `description` mandar ler algo, o `briefing` não pode ficar vazio.
- A campanha comprada ocupa **uma vaga** no limite de arenas, quantas fases tiver (cada fase vira uma arena). A fase seguinte abre quando a anterior termina.
- Toda ação deve ter `dias`, para cair sozinha no planner (inclusive marcos e aulas).
- Mídia (imagem) é escolhida pelo dono do app e vai dentro do pacote do app; não use links externos.

## Problemas encontrados na varredura

- **11 ações mandam ler uma aula que não existe** (o `briefing` está vazio). Estão marcadas com ⚠️ abaixo.
  - Criatividade em Sprint (50 ouro): "Criatividade nao e inspiracao - e pressao"
  - Detox Digital (50 ouro): "O que o scroll faz com o seu cerebro"
  - Presenca Real (50 ouro): "A diferenca entre estar junto e estar presente"
  - Voz e Presenca (50 ouro): "Por que algumas pessoas sao ouvidas e outras nao"
  - Expressao Criativa (100 ouro): "Semana 1: Expressao nao e talento - e pratica / Semana 2: Encontrar sua voz"
  - Construcao de Cla (150 ouro): "Semana 1: Voce e a media dos 5 / Semana 2: Como nutrir vinculos sem forcar"
  - Despertar de Ferro (200 ouro): "Semana 1: Por que progressao bate intensidade / Semana 2: Recuperacao e treino"
  - Financas com Intencao (200 ouro): "Semana 1: A diferenca entre controlar e construir / Semana 2: O primeiro passo do patrimonio"
  - Lideranca sem Cargo (350 ouro): "Leitura estrutural da lideranca"
  - Corpo de Elite (400 ouro): "Leitura estrutural do corpo funcional"
  - Foco Blindado (500 ouro): "Leitura estrutural do foco"
- **Logistica de Vanguarda**: `price_brl` = 350.0 (provável erro; o ouro é 350).
- **Reset Dopaminergico**: `price_brl` = 350.0 (provável erro; o ouro é 350).
- Algumas ações têm `actionType` com acento quebrado (`A��o Recorrente`); o certo é `Acao Recorrente`.

## Resumo

| Campanha | Ouro | Dias | Fases | Ações | Palavras de aula | id |
|---|---|---|---|---|---|---|
| Bussola Nutricional (Basico) | 0 | 7 | 2 | 2 | 245 | `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b08` |
| Diario de Bordo (Journaling) | 0 | 7 | 2 | 2 | 258 | `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b07` |
| Foco Basico (Anti-Distracao) | 0 | 7 | 2 | 3 | 129 | `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b01` |
| Fundamentos da Calistenia | 0 | 7 | 2 | 3 | 82 | `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b05` |
| HIIT Express (Queima Rapida) | 0 | 14 | 2 | 3 | 105 | `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b04` |
| Manha Energetica | 0 | 7 | 2 | 3 | 86 | `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b02` |
| Manutencao da Base (Casa) | 0 | 7 | 2 | 2 | 67 | `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b03` |
| Motor de Produtividade | 0 | 7 | 2 | 2 | 76 | `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b06` |
| Radar Financeiro | 0 | 7 | 2 | 2 | 22 | `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b09` |
| Sincronia de Rede | 0 | 7 | 2 | 2 | 54 | `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b10` |
| Controle de Impulsos | 50 | 7 | 2 | 2 | 491 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c04` |
| Corpo em Movimento | 50 | 7 | 2 | 2 | 89 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c03` |
| Criatividade em Sprint ⚠️ | 50 | 7 | 2 | 2 | 50 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c10` |
| Detox Digital ⚠️ | 50 | 7 | 2 | 2 | 54 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c06` |
| Estoicismo Aplicado | 50 | 7 | 2 | 2 | 1642 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c08` |
| Leitura Ativa | 50 | 7 | 2 | 2 | 505 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c02` |
| Mobilidade e Flexibilidade | 50 | 7 | 2 | 2 | 92 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c09` |
| Presenca Real ⚠️ | 50 | 7 | 2 | 2 | 57 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c05` |
| Sono de Elite | 50 | 7 | 2 | 2 | 409 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c01` |
| Voz e Presenca ⚠️ | 50 | 7 | 2 | 2 | 52 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c07` |
| Expressao Criativa ⚠️ | 100 | 14 | 2 | 3 | 56 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d10` |
| Construcao de Cla ⚠️ | 150 | 14 | 2 | 3 | 92 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d08` |
| Despertar de Ferro ⚠️ | 200 | 14 | 2 | 3 | 52 | `7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a01` |
| Financas com Intencao ⚠️ | 200 | 14 | 2 | 3 | 0 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d09` |
| Maestria Financeira | 300 | 21 | 3 | 4 | 1363 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e05` |
| Lideranca sem Cargo ⚠️ | 350 | 21 | 3 | 4 | 0 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e04` |
| Logistica de Vanguarda | 350 | 7 | 2 | 2 | 10 | `7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a04` |
| Reset Dopaminergico | 350 | 14 | 2 | 2 | 23 | `7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a02` |
| Construção de Identidade | 400 | 21 | 3 | 4 | 1183 | `7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a05` |
| Corpo de Elite ⚠️ | 400 | 21 | 3 | 4 | 89 | `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e03` |
| Foco Blindado ⚠️ | 500 | 21 | 3 | 4 | 0 | `7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a03` |

---

## 🥗 Bussola Nutricional (Basico)

- id: `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b08`
- descrição: Entenda sua base alimentar sem culpa e comece a observar o que entra no sistema.
- price_gold: 0 | price_brl: 0.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-24
- campaignTier: None | campaignType: aprendizado | campaignTheme: nutricao | primaryAssetId: fisico
- tags: fisico, aprendizado, nutricao, alimentacao, clareza

### Fase 1: Microaula de Nutricao Basica

_Primeiro aprenda o conceito. Depois observe sua realidade._

#### Ação 1.1: 📘 Taxa Metabólica Basal

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 1
- context: afternoon / medium
- description: Leia a aula na aba Anotação e marque ao terminar.
- briefing:

```text
A taxa metabólica basal (TMB) é a quantidade de calorias que seu corpo precisa para funcionar em repouso absoluto — respirar, bombear sangue, manter a temperatura, sustentar os órgãos. É o seu gasto mínimo de energia, antes de qualquer movimento ou atividade.

A maioria das pessoas nunca parou para calcular isso e por isso vive no escuro nutricional. Come por hábito, por ansiedade ou por impulso — sem saber se está acima, abaixo ou na faixa certa do que o corpo precisa. Sem essa referência, qualquer mudança alimentar é tentativa e erro no escuro.

O erro mais comum é achar que comer menos é sempre melhor. Muita gente corta calorias abaixo da própria TMB sem saber, e o corpo responde com fadiga, queda de rendimento e dificuldade para perder gordura de verdade. Comer menos do que o corpo precisa para sobreviver é diferente de comer menos do que você gasta.

A regra simples é: descubra sua TMB, multiplique pelo seu nível de atividade e você tem seu gasto diário real. A partir daí, você decide com consciência — não com achismo.

Agora faça a próxima ação para fixar isso na prática: registre tudo que você comeu hoje e compare com sua TMB estimada.
```

### Fase 2: Observacao guiada

_Aplique a microaula olhando para um dia real de alimentacao._

#### Ação 2.1: 📋 Mapear tudo que comeu em um dia

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 1
- context: night / low
- description: Anote um dia inteiro de alimentacao sem julgar, editar ou tentar parecer melhor.
- preFlight:
  - Bloco de notas
  - Fotos das refeicoes se ajudar
- briefing:

```text
Aplicacao: registre horario, o que comeu, quanto comeu e como estava se sentindo. Se conseguir, note tambem o contexto: estava com pressa, cansado, ansioso, com fome real ou so no automatico? O objetivo nao e montar dieta. E descobrir padroes. Clareza vem antes de disciplina.
```

---

## 📓 Diario de Bordo (Journaling)

- id: `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b07`
- descrição: Aprenda o minimo do journaling e transforme o dia em material de clareza.
- price_gold: 0 | price_brl: 0.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-24
- campaignTier: None | campaignType: aprendizado | campaignTheme: psicologia | primaryAssetId: consciencia
- tags: consciencia, aprendizado, psicologia, journaling, clareza

### Fase 1: Microaula de Journaling

_Primeiro entenda o mecanismo. Depois use a escrita como ferramenta._

#### Ação 1.1: 📘 Journaling Básico

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 1
- context: afternoon / medium
- description: Leia a aula na aba Anotação e marque ao terminar.
- briefing:

```text
Journaling é o hábito de registrar pensamentos, decisões e percepções por escrito, de forma regular. Não é um diário sentimental nem uma tarefa escolar — é uma ferramenta de processamento mental. Quando você escreve o que está na cabeça, você para de carregar aquilo em loop e começa a enxergar com mais clareza.

O erro mais comum é achar que precisa escrever certo, bonito ou muito. A maioria das pessoas trava antes de começar porque espera inspiração ou o momento perfeito. O journaling que funciona é o feio, o curto, o honesto — 3 linhas escritas todo dia valem mais do que 3 páginas escritas uma vez por mês.

A regra simples é: escreva pelo menos 1 parágrafo sobre o seu dia, sem filtro e sem reler na hora. Pode ser o que aconteceu, o que você sentiu, o que te incomodou ou o que você decidiu. O objetivo não é produzir um texto — é deixar o pensamento sair da cabeça e ganhar forma.

Com o tempo, o journaling vira um espelho. Você começa a perceber padrões: o que drena sua energia, o que te motiva, onde você age diferente do que pensa. Esse nível de autoconhecimento não aparece só pensando — ele aparece quando você escreve e relê.

Agora faça a próxima ação para fixar isso na prática.
```

### Fase 2: Aplicacao guiada

_Agora use a ferramenta em um formato curto e simples._

#### Ação 2.1: ✍️ Escrever 1 paragrafo sobre o dia atual

- actionType: Acao Recorrente | repetitions: 1 | duration: 10 min | difficulty: 1
- context: night / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1260 (21:00)
- description: Registre o que marcou o dia, o que pesou e o que quer carregar para amanha.
- preFlight:
  - Caderno ou app de notas
  - Um lugar minimamente silencioso
- briefing:

```text
Aplicacao: use um formato de tres linhas. 1) Hoje aconteceu... 2) Isso me fez sentir... 3) Amanha eu quero... Nao corrija, nao floreie e nao tente parecer profundo. O objetivo aqui e treinar honestidade e observacao. Quanto mais simples e verdadeiro, melhor.
```

---

## 🎯 Foco Basico (Anti-Distracao)

- id: `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b01`
- descrição: Instale uma semana de blindagem contra ruido e recupere janelas reais de foco.
- price_gold: 0 | price_brl: 0.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-24
- campaignTier: None | campaignType: pratica | campaignTheme: produtividade | primaryAssetId: espaco-mental
- tags: espaco-mental, pratica, produtividade, foco, anti-distracao

### Fase 1: Blindagem do Ambiente

_Remova o atrito digital antes de pedir profundidade da mente._

#### Ação 1.1: 🧱 Instalar bloqueador de sites

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 1
- context: morning / medium
- description: Escolha um bloqueador simples e monte uma lista minima de sites que roubam seu foco.
- preFlight:
  - Celular por perto
  - Notebook aberto
  - Lista dos sites mais usados
- briefing:

```text
Foco nao nasce no heroismo. Ele nasce quando o ruido perde acesso facil a voce.
```

### Fase 2: Blocos de Profundidade

_Testes curtos e longos para ensinar o sistema a sustentar concentracao._

#### Ação 2.1: 📵 Bloco de foco sem interrupção

- actionType: Acao Recorrente | repetitions: 1 | duration: 30 min | difficulty: 2
- context: afternoon / medium | scheduledDays: SEG TER QUA QUI SEX | scheduledStartTime: 840 (14:00)
- description: Afaste o celular e complete uma meia hora de concentracao sem notificacoes.
- preFlight:
  - Modo aviao
  - Cronometro
  - Uma tarefa definida
- briefing:

```text
Distração não é falta de força de vontade. É o ambiente vencendo você. Cada notificação, cada aba aberta, cada mensagem não lida é uma demanda competindo pela sua atenção — e o cérebro não consegue ignorar isso. O bloco de foco não é sobre se forçar mais. É sobre criar as condições para que o foco aconteça naturalmente.
```

#### Ação 2.2: ⏳ Bloco de 60 min focado

- actionType: Acao Recorrente | repetitions: 1 | duration: 60 min | difficulty: 3
- context: morning / high | scheduledDays: SEG QUA SEX | scheduledStartTime: 540 (09:00)
- description: Escolha uma unica tarefa relevante e sustente sessenta minutos inteiros de foco.
- preFlight:
  - Janela de tempo livre
  - Meta unica
  - Agua por perto
- briefing:

```text
Distração não é falta de força de vontade. É o ambiente vencendo você. Cada notificação, cada aba aberta, cada mensagem não lida é uma demanda competindo pela sua atenção — e o cérebro não consegue ignorar isso. O bloco de foco não é sobre se forçar mais. É sobre criar as condições para que o foco aconteça naturalmente.
```

---

## 🤸 Fundamentos da Calistenia

- id: `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b05`
- descrição: Mapeie sua base corporal e execute um primeiro treino tecnico de calistenia.
- price_gold: 0 | price_brl: 0.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-24
- campaignTier: None | campaignType: pratica | campaignTheme: exercicio | primaryAssetId: fisico
- tags: fisico, pratica, exercicio, calistenia, base

### Fase 1: Diagnostico corporal

_Veja sua base real antes de tentar forcar volume._

#### Ação 1.1: 💪 Teste de flexoes maximas

- actionType: Compromisso | repetitions: 1 | duration: 10 min | difficulty: 2
- context: morning / medium
- description: Conte quantas repeticoes limpas voce consegue fazer sem roubar tecnica.
- briefing:

```text
O ponto de partida importa mais do que parecer forte no primeiro dia.
```

#### Ação 1.2: 🦵 Teste de agachamentos

- actionType: Compromisso | repetitions: 1 | duration: 10 min | difficulty: 2
- context: morning / medium
- description: Faça uma serie limpa e observe estabilidade, ritmo e respiracao.
- briefing:

```text
Seu corpo da sinais claros quando a base ainda precisa de ajuste.
```

### Fase 2: Circuito de entrada

_Monte um treino simples para ensinar forma, ritmo e constancia._

#### Ação 2.1: 🏋️ Trio fundamental do dia

- actionType: Compromisso | repetitions: 1 | duration: 20 min | difficulty: 3
- context: afternoon / high
- description: Complete um circuito com flexoes inclinadas, agachamentos e prancha.
- preFlight:
  - Espaco livre
  - Cronometro
  - Apoio estavel para inclinacao
- briefing:

```text
Flexão, agachamento e prancha não são exercícios básicos porque são fáceis. São básicos porque são completos. Eles treinam empurrar, dobrar e estabilizar — os três padrões de movimento que o corpo humano usa em quase tudo. Dominar a forma nesses três exercícios antes de avançar para qualquer outra coisa é o que separa progressão real de lesão acumulada.
```

---

## 🔥 HIIT Express (Queima Rapida)

- id: `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b04`
- descrição: Tres treinos curtos e intensos para elevar pulso, calor e disposicao em duas semanas.
- price_gold: 0 | price_brl: 0.0 | price_fragments: 34
- duration_days: 14 | autor: Soberano System | criada: 2026-03-24
- campaignTier: None | campaignType: pratica | campaignTheme: exercicio | primaryAssetId: fisico
- tags: fisico, pratica, exercicio, hiit, energia

### Fase 1: Aquecimento e gatilho

_Prepare o corpo para intensidade sem entrar frio demais._

#### Ação 1.1: ⚡ Aquecimento de 5 minutos

- actionType: Compromisso | repetitions: 1 | duration: 5 min | difficulty: 1
- context: morning / medium
- description: Mobilidade, corrida parada e respiracao mais ativa para subir o corpo.
- preFlight:
  - Espaco livre
  - Agua por perto
- briefing:

```text
Aquecimento curto evita que o treino nasca travado e reduz risco de lesao.
```

### Fase 2: Tres disparos

_Treinos curtos, alternados e sem enrolacao._

#### Ação 2.1: 🏃 Treino HIIT 1

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 3
- context: morning / high
- description: 15 minutos alternando explosao e descanso curto.
- briefing:

```text
Intensidade curta supera duração longa quando o objetivo é ativar o metabolismo e manter a consistência. 20 minutos de esforço real produzem mais resposta fisiológica do que 1 hora de ritmo confortável. O protocolo é fixo para eliminar a decisão — você não pensa no que fazer, só faz.
```

#### Ação 2.2: 🔥 Treino HIIT 2 ou 3

- actionType: Acao Recorrente | repetitions: 2 | duration: 15 min | difficulty: 4
- context: morning / high | scheduledDays: SEG QUA SEX | scheduledStartTime: 420 (07:00)
- description: Repita mais dois disparos em dias alternados na mesma janela da semana.
- preFlight:
  - Timer pronto
  - Roupa leve
  - Descanso de um dia entre treinos
- briefing:

```text
O corpo se adapta rápido. O que foi desafiador na semana 1 se torna confortável na semana 2 — e confortável não gera evolução. Adicionar 1 rodada em 2 exercícios não parece muito. É o suficiente para manter o estímulo acima do limiar de adaptação.
```

---

## 🌅 Manha Energetica

- id: `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b02`
- descrição: Ajuste a partida do dia para acordar com mais energia, hidratacao e luz.
- price_gold: 0 | price_brl: 0.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-24
- campaignTier: None | campaignType: pratica | campaignTheme: bem_estar | primaryAssetId: fisico
- tags: fisico, pratica, bem-estar, manha, energia

### Fase 1: Partida Limpa

_Ative o corpo assim que o dia comecar._

#### Ação 1.1: ⏰ Acordar no primeiro alarme

- actionType: Acao Recorrente | repetitions: 1 | duration: 2 min | difficulty: 3
- context: morning / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 420 (07:00)
- description: Levante no primeiro toque sem negociar com a cama.
- briefing:

```text
A primeira decisao do dia define o tom das proximas.
```

#### Ação 1.2: 💧 Hidratação antes de qualquer coisa

- actionType: Acao Recorrente | repetitions: 1 | duration: 5 min | difficulty: 1
- context: morning / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 425 (07:05)
- description: Hidrate o corpo antes de cafe, tela ou conversa.
- preFlight:
  - Garrafa cheia
  - Agua ao lado da cama ou pia livre
- briefing:

```text
Você passa 6 a 8 horas sem água enquanto dorme. O corpo acorda em déficit hídrico leve — e esse déficit afeta concentração, humor e disposição antes mesmo de você perceber. Um copo de água antes do café, antes do celular, antes de qualquer coisa, é a intervenção mais simples e mais ignorada para começar o dia com o sistema funcionando.
```

### Fase 2: Ritmo Solar

_Use luz e ar livre para acordar de verdade._

#### Ação 2.1: ☀️ 5 min de luz solar ou ar livre

- actionType: Acao Recorrente | repetitions: 1 | duration: 5 min | difficulty: 1
- context: morning / medium | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 435 (07:15)
- description: Leve o corpo para a varanda, rua ou janela aberta e deixe a manha entrar.
- briefing:

```text
Luz cedo ajuda a regular energia, humor e a hora certa de sentir sono a noite.
```

---

## 🧹 Manutencao da Base (Casa)

- id: `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b03`
- descrição: Arrume o minimo vital da casa para reduzir ruido mental e atrito diario.
- price_gold: 0 | price_brl: 0.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-24
- campaignTier: None | campaignType: manutencao | campaignTheme: autocuidado | primaryAssetId: espaco-mental
- tags: espaco-mental, manutencao, autocuidado, casa, ordem

### Fase 1: Acordar sem caos

_Deixe o quarto entregar a primeira sensacao de ordem do dia._

#### Ação 1.1: 🛏️ Arrumar a cama ao levantar

- actionType: Acao Recorrente | repetitions: 1 | duration: 5 min | difficulty: 1
- context: morning / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 430 (07:10)
- description: Estique, alinhe e feche a cama antes de sair do quarto.
- briefing:

```text
A cama pronta vira um sinal silencioso de que o dia ja comecou em ordem.
```

### Fase 2: Mesa sem ruido

_Limpe o centro de operacao para facilitar foco e execucao._

#### Ação 2.1: 🧼 Reset de 10 minutos

- actionType: Acao Recorrente | repetitions: 1 | duration: 10 min | difficulty: 2
- context: morning / medium | scheduledDays: SEG TER QUA QUI SEX | scheduledStartTime: 500 (08:20)
- description: Remova copos, cabos soltos, lixo visual e coisas que nao pertencem ao campo.
- preFlight:
  - Saco de lixo ou pano
  - Um destino para os objetos soltos
- briefing:

```text
Ambiente desorganizado não é só estético. É carga cognitiva constante — cada objeto fora do lugar é um pensamento aberto que o cérebro processa em segundo plano sem você perceber. 10 minutos de organização por dia não limpam a casa. Eles mantêm o ambiente abaixo do limiar de caos que drena energia mental.
```

---

## 🛠️ Motor de Produtividade

- id: `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b06`
- descrição: Configure o dia para proteger prioridade, entrega e ritmo de trabalho.
- price_gold: 0 | price_brl: 0.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-24
- campaignTier: None | campaignType: pratica | campaignTheme: produtividade | primaryAssetId: trabalho
- tags: trabalho, pratica, produtividade, execucao, prioridade

### Fase 1: Vespera util

_Prepare o terreno no dia anterior para reduzir dispersao no dia seguinte._

#### Ação 1.1: 📝 Lista de 3 - não mais

- actionType: Acao Recorrente | repetitions: 1 | duration: 10 min | difficulty: 1
- context: night / low | scheduledDays: DOM SEG TER QUA QUI | scheduledStartTime: 1260 (21:00)
- description: Na noite anterior, escreva as tres entregas que mais importam.
- briefing:

```text
Lista longa é ilusão de produtividade. Com 15 itens, o cérebro não prioriza — ele escolhe o mais fácil e chama de trabalho. 3 tarefas forçam a decisão real: o que importa hoje? O que, se feito, faz o dia valer a pena independente do resto? Essa pergunta é mais difícil do que parece — e é exatamente por isso que funciona.
```

### Fase 2: Golpe principal

_Proteja a tarefa numero um antes que o resto tome o dia._

#### Ação 2.1: 🚀 Executar a tarefa #1 antes do meio-dia

- actionType: Acao Recorrente | repetitions: 1 | duration: 60 min | difficulty: 3
- context: morning / high | scheduledDays: SEG TER QUA QUI SEX | scheduledStartTime: 540 (09:00)
- description: Pegue a primeira prioridade e avance nela antes de abrir o resto do ruido.
- preFlight:
  - Tarefa #1 definida
  - Agenda limpa no inicio da manha
- briefing:

```text
A energia boa do inicio do dia precisa ir para a frente, nao para o periferico.
```

---

## 📊 Radar Financeiro

- id: `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b09`
- descrição: Ganhe visibilidade rapida do dinheiro que entra, sai e vaza.
- price_gold: 0 | price_brl: 0.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-24
- campaignTier: None | campaignType: manutencao | campaignTheme: estrategia | primaryAssetId: financas
- tags: financas, manutencao, estrategia, dinheiro, clareza

### Fase 1: Ver o fluxo

_Tire o dinheiro do escuro nem que seja por um unico dia._

#### Ação 1.1: 🧾 Anotar todos os gastos de um unico dia

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 1
- context: evening / medium
- description: Registre tudo que saiu, do cafe ao aplicativo, sem tentar filtrar nada.
- preFlight:
  - App de notas ou planilha
  - Extrato ou historico do dia
- briefing:

```text
O primeiro ganho financeiro e perceber padroes que estavam invisiveis.
```

### Fase 2: Cortar o vazamento

_Uma decisao pequena ja muda a sensacao de controle._

#### Ação 2.1: 💳 Cancelar 1 assinatura inutil ou definir limite no cartao

- actionType: Compromisso | repetitions: 1 | duration: 20 min | difficulty: 2
- context: afternoon / medium
- description: Escolha uma unica trava concreta para parar ou conter um vazamento.
- briefing:

```text
Controle financeiro cresce quando uma decisao sai da ideia e vira regra.
```

---

## 🤝 Sincronia de Rede

- id: `8f31c3d8-7a9a-4d4e-9b36-4f79a5f42b10`
- descrição: Reative a rede e tire uma conexao do limbo com intencao.
- price_gold: 0 | price_brl: 0.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-24
- campaignTier: None | campaignType: pratica | campaignTheme: socializacao | primaryAssetId: conexoes
- tags: conexoes, pratica, socializacao, network, presenca

### Fase 1: Reabrir o canal

_Volte a existir no radar de alguem com uma mensagem real._

#### Ação 1.1: 💬 Contato intencional do dia

- actionType: Compromisso | repetitions: 1 | duration: 10 min | difficulty: 2
- context: afternoon / medium
- description: Envie uma mensagem curta, humana e sem pedir nada em troca.
- briefing:

```text
A maioria das redes se mantém por acaso — uma mensagem aqui, um like ali. Relacionamentos de valor precisam de atenção intencional. Não frequência, não quantidade. Intenção. Uma pergunta genuína vale mais do que dez "oi sumido" porque ela sinaliza presença real, não obrigação social.
```

### Fase 2: Tornar real

_Converta a conversa em interacao marcada._

#### Ação 2.1: 📞 Marcar uma interacao real ou call

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 2
- context: evening / medium
- description: Convide para um cafe, videochamada, treino ou qualquer encontro curto e concreto.
- preFlight:
  - Uma proposta simples
  - Dois horarios possiveis
- briefing:

```text
Relacao fortalece quando sai da intencao solta e ganha data.
```

---

## 💸 Controle de Impulsos

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c04`
- descrição: Gestao de gastos e decisoes no automatico para enxergar o padrao antes de cortar.
- price_gold: 50 | price_brl: 5.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-25
- campaignTier: basico | campaignType: aprendizado | campaignTheme: estrategia | primaryAssetId: financas
- tags: financas, basico, aprendizado, estrategia, gastos, impulso

### Fase 1: Leitura de Base

_Veja o gasto invisivel antes de tentar controlar tudo._

#### Ação 1.1: 📘 O gasto que voce nao ve

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 1
- context: afternoon / medium
- description: Leia a aula na aba Anotacao e marque quando terminar.
- briefing:

```text
Gastos impulsivos raramente parecem impulsos no momento.
[[page]]
A compra por impulso tem uma narrativa. "Estava em promoção." "Eu mereço." "Vou usar muito." "Era só R$30." Cada uma dessas frases é real no momento em que é pensada — o problema é que elas são produzidas pelo mesmo sistema que está tomando a decisão, então parecem racionais quando não são. O impulso não se apresenta como impulso. Ele se apresenta como bom senso.
[[page]]
Por baixo de quase todo gasto impulsivo existe um gatilho emocional.

Tédio, ansiedade, frustração, celebração, insegurança — emoções geram desconforto, e o consumo oferece alívio rápido. A compra ativa o sistema de recompensa do cérebro de forma imediata e previsível. O problema é que esse alívio dura minutos, e o gasto dura meses no extrato. Com o tempo, o padrão se automatiza: emoção desconfortável -> compra -> alívio temporário -> culpa -> nova emoção desconfortável. O ciclo se fecha e recomeça.
[[page]]
O gasto invisível não é o maior. É o mais frequente.

Assinaturas esquecidas, compras pequenas que não parecem contar, conveniências que viram hábito — esses gastos nunca são o problema isoladamente. O problema é que eles não são percebidos como decisões. Eles acontecem no piloto automático, fora do campo de consciência onde qualquer avaliação real poderia ocorrer. Você não decide gastar. Você simplesmente gasta.
[[page]]
O primeiro passo não é cortar. É ver.

Não existe controle real sobre o que não é percebido. Antes de qualquer planilha, antes de qualquer meta de economia, é preciso tornar o invisível visível — registrar o que acontece, quando acontece e o que estava sendo sentido antes de acontecer. Esse registro não é punição. É o único jeito de trabalhar com dados reais em vez de suposições sobre o próprio comportamento financeiro.
```

### Fase 2: Diagnostico do Impulso

_Observe a vontade de gastar sem tentar corrigir antes da hora._

#### Ação 2.1: 📝 Registro do impulso do dia

- actionType: Acao Recorrente | repetitions: 1 | duration: 10 min | difficulty: 1
- context: night / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1260 (21:00)
- description: Anote 1 gasto ou vontade de gastar e classifique: impulso ou intencao.
- preFlight:
  - Bloco de notas
  - Honestidade sem culpa
- briefing:

```text
Registrar não é julgar. É observar.
[[page]]
Durante 7 dias, toda vez que você gastar dinheiro — ou sentir vontade de gastar e não gastar — anote. O valor, o que foi, e em uma linha: o que você estava sentindo antes. Não precisa ser preciso. "Estava entediado." "Tinha acabado de ter uma reunião ruim." "Estava feliz e queria comemorar." Qualquer coisa que captura o estado emocional anterior ao gasto.
[[page]]
A classificação vem depois, não antes.

Ao registrar, não tente decidir na hora se foi impulso ou intenção. Só anote. A classificação acontece no final do dia, quando você olha para os registros com distância emocional. Impulso é o gasto que você não teria feito se tivesse esperado 24 horas. Intenção é o gasto que você teria feito de qualquer forma. Essa distinção, feita com calma, é mais honesta do que qualquer julgamento feito no momento da compra.
[[page]]
Ao final de 7 dias, o padrão aparece sozinho.

Você não precisa analisar. Só precisa olhar. Em que situações você gasta sem pensar? Que tipo de gasto se repete? Que valor médio tem o impulso típico? Essas perguntas não têm resposta certa — têm a sua resposta, que é a única que importa para mudar o comportamento.
```

---

## 🚶 Corpo em Movimento

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c03`
- descrição: Anti-sedentarismo para quem trabalha sentado, com movimento que cabe no dia real.
- price_gold: 50 | price_brl: 5.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-25
- campaignTier: basico | campaignType: pratica | campaignTheme: exercicio | primaryAssetId: fisico
- tags: fisico, basico, pratica, exercicio, movimento, sedentarismo

### Fase 1: Quebra de Inercia

_Tire o corpo do modo cadeira ao longo do dia._

#### Ação 1.1: ⏰ Alerta de movimento

- actionType: Acao Recorrente | repetitions: 4 | duration: 5 min | difficulty: 1
- context: afternoon / medium | scheduledDays: SEG TER QUA QUI SEX | scheduledStartTime: 600 (10:00)
- description: A cada 90 minutos sentado: levante e faca 10 agachamentos ou 2 minutos de caminhada.
- preFlight:
  - Alarme ou lembrete
  - Espaco minimo para levantar
- briefing:

```text
O corpo humano não foi projetado para ficar parado por horas. Cada 90 minutos sentado sem movimento comprime discos, reduz circulação e aumenta tensão muscular de forma acumulativa. O alerta não é sobre fitness — é sobre manutenção básica de um sistema que precisa se mover para funcionar bem.
```

### Fase 2: Fechamento do Corpo

_Solte as travas do dia antes de dormir._

#### Ação 2.1: 🧘 Sequência de 5 minutos antes de dormir

- actionType: Acao Recorrente | repetitions: 1 | duration: 5 min | difficulty: 1
- context: night / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1290 (21:30)
- description: Antes de dormir, execute 3 alongamentos fixos do protocolo.
- preFlight:
  - Espaco no chao
  - Roupa confortavel
- briefing:

```text
O dia comprime o corpo. Postura curvada, tensão acumulada, articulações travadas. 5 minutos de mobilidade antes de dormir não são alongamento opcional — são a manutenção que permite que o corpo recupere durante o sono em vez de gastar energia processando tensão.
```

---

## ⚡ Criatividade em Sprint

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c10`
- descrição: Desbloqueio criativo com metodo para sair do branco e entrar em movimento em minutos.
- price_gold: 50 | price_brl: 5.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-25
- campaignTier: basico | campaignType: pratica | campaignTheme: produtividade | primaryAssetId: consciencia
- tags: consciencia, basico, pratica, produtividade, criatividade, sprint

### Fase 1: Leitura de Base

_Quebre o mito da inspiracao perfeita._

#### Ação 1.1: 📘 Criatividade nao e inspiracao - e pressao ⚠️ aula vazia

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 1
- context: afternoon / medium
- description: Leia a aula na aba Anotacao e marque quando terminar.
- briefing: (vazio)

### Fase 2: Sprint Criativo

_Produza sem filtrar por uma janela curta e real._

#### Ação 2.1: ✍️ Sprint de 15 minutos

- actionType: Acao Recorrente | repetitions: 1 | duration: 15 min | difficulty: 2
- context: morning / medium | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 600 (10:00)
- description: Escolha 1 problema criativo aberto e produza por 15 minutos sem filtrar.
- preFlight:
  - Problema criativo aberto
  - Cronometro em 15 minutos
- briefing:

```text
Criatividade sem prazo vira procrastinação com boa desculpa. O prazo curto não mata a criatividade — ele mata o perfeccionismo que impede de começar. 15 minutos com temporizador ativo produzem mais material bruto do que 2 horas de "quando eu estiver inspirado". O que sair não precisa ser bom. Precisa existir.
```

---

## 📵 Detox Digital

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c06`
- descrição: Reducao de tela e ruido mental sem drama e sem cortar tudo de vez.
- price_gold: 50 | price_brl: 5.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-25
- campaignTier: basico | campaignType: manutencao | campaignTheme: psicologia | primaryAssetId: espaco-mental
- tags: espaco-mental, basico, manutencao, psicologia, tela, scroll

### Fase 1: Leitura de Base

_Entenda o custo real do scroll infinito._

#### Ação 1.1: 📘 O que o scroll faz com o seu cerebro ⚠️ aula vazia

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 1
- context: afternoon / medium
- description: Leia a aula na aba Anotacao e marque quando terminar.
- briefing: (vazio)

### Fase 2: Janela Sem Tela

_Recupere um intervalo limpo no seu dia._

#### Ação 2.1: 🧘 Janela livre de tela

- actionType: Acao Recorrente | repetitions: 1 | duration: 30 min | difficulty: 1
- context: morning / medium | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 480 (08:00)
- description: Defina 1 periodo do dia sem tela por pelo menos 30 minutos.
- preFlight:
  - Horario escolhido
  - Celular longe
- briefing:

```text
A tela não precisa estar na sua frente para ocupar sua cabeça. O hábito de checar cria um estado de alerta constante — mesmo sem notificação, o cérebro antecipa. Uma janela diária sem tela não é descanso passivo. É a interrupção do ciclo de antecipação que mantém o sistema nervoso em estado de vigília permanente.
```

---

## 🏛️ Estoicismo Aplicado

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c08`
- descrição: Filosofia pratica no cotidiano com 1 principio por dia, sem floreio.
- price_gold: 50 | price_brl: 5.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-25
- campaignTier: basico | campaignType: aprendizado | campaignTheme: psicologia | primaryAssetId: consciencia
- tags: consciencia, basico, aprendizado, psicologia, estoicismo, principios

### Fase 1: Principio do Dia

_Receba 1 principio por dia e leve isso para a vida real._

#### Ação 1.1: 📘 Principio do dia

- actionType: Acao Recorrente | repetitions: 1 | duration: 10 min | difficulty: 1
- context: morning / medium | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 420 (07:00)
- description: Leia o principio do dia na aba Anotacao e marque quando terminar.
- briefing:

```text
D1 — O Controle
[[page]]
Existe uma linha que divide tudo na sua vida em dois lados.

De um lado: o que depende de você. Seus pensamentos, suas escolhas, suas respostas, seus esforços. Do outro lado: tudo o mais. O que as pessoas pensam de você, o resultado das suas decisões, o clima, o trânsito, a economia, o comportamento dos outros. Os estoicos chamavam essa divisão de dicotomia do controle — e consideravam a confusão entre os dois lados a principal fonte de sofrimento humano.
[[page]]
O problema não é que coisas ruins acontecem. É que gastamos energia tentando controlar o que não controlamos.

Você se preocupa com a opinião do seu chefe sobre uma apresentação que já foi entregue. Você rumina sobre uma conversa que já aconteceu. Você anseia por um resultado que depende de dez variáveis fora do seu alcance. Toda essa energia gasta no lado errado da linha não muda nada no mundo externo — só drena o que você tinha disponível para o que realmente depende de você.
[[page]]
Identificar o lado da linha onde cada coisa está não é resignação. É precisão.

Quando você para e pergunta "isso depende de mim?" antes de gastar energia em qualquer coisa, duas coisas acontecem. O que está fora do seu controle perde o poder de te paralisar — porque você conscientemente escolhe não investir ali. E o que está dentro do seu controle recebe atenção total — porque é o único lugar onde seu esforço produz resultado real.
[[page]]
A prática não elimina o desconforto. Ela redireciona onde você coloca o peso.
[[page]]
D2 — A Adversidade
[[page]]
Os estoicos não acreditavam em evitar dificuldade. Acreditavam em usá-la.

Para Marco Aurélio, Sêneca e Epicteto — três homens que viveram sob perseguição, exílio e escravidão — a adversidade não era o oposto do crescimento. Era o instrumento dele. O obstáculo não estava no caminho. O obstáculo era o caminho. Essa inversão não é otimismo forçado. É uma conclusão prática sobre como o caráter humano se desenvolve.
[[page]]
Ninguém se torna resiliente em condições confortáveis.

Tolerância à frustração, capacidade de continuar sob pressão, clareza de valores quando tudo está difícil — essas qualidades não aparecem porque você as deseja. Aparecem porque foram testadas e você escolheu continuar. A adversidade é o único ambiente onde esse teste pode acontecer. Evitá-la sistematicamente não é prudência — é a garantia de que você nunca vai descobrir do que é capaz.
[[page]]
A pergunta estoica diante de qualquer dificuldade é sempre a mesma: o que isso me permite praticar?

Paciência. Criatividade. Humildade. Persistência. Cada obstáculo específico convoca uma virtude específica — e a virtude só se desenvolve quando é convocada de verdade, não em simulação. A adversidade é o único teste que conta.
[[page]]
Isso não significa que dificuldade não dói. Significa que a dor pode ter direção.
[[page]]
D3 — O Tempo
[[page]]
Você age como se tivesse tempo sobrando. Os estoicos agiam como se não tivessem.

Sêneca escreveu que o problema não é termos pouco tempo — é desperdiçarmos muito do que temos. A vida é longa o suficiente para quase tudo que importa, se usada com intenção. O que a encurta não é o calendário. É a atenção dividida, o adiamento crônico e a ilusão de que o momento certo está sempre à frente.
[[page]]
A morte não é o tema estoico favorito por morbidez. É por clareza.

A prática do memento mori — lembrar que você vai morrer — não foi criada para deprimir. Foi criada para calibrar. Quando você tem consciência real da finitude, as decisões sobre onde colocar atenção e energia mudam. O que você estava tolerando por preguiça se torna inaceitável. O que você estava adiando por medo se torna urgente. A perspectiva da morte não paralisa — ela prioriza.
[[page]]
Viver bem não é viver muito. É viver com presença no que está acontecendo agora.

O passado não existe mais. O futuro ainda não existe. O único lugar onde qualquer coisa real pode acontecer é o momento presente — e é exatamente o lugar onde a maioria das pessoas menos está. Pensar no passado, antecipar o futuro, planejar, ruminar, imaginar — tudo isso tem seu lugar. Mas quando ocupa o espaço do presente de forma crônica, a vida passa sem ser vivida.
[[page]]
D4 — A Virtude
[[page]]
Para os estoicos, virtude não era um conceito moral abstrato. Era uma habilidade prática.

Coragem, justiça, temperança e sabedoria — as quatro virtudes cardinais do estoicismo — não eram qualidades que você tinha ou não tinha. Eram capacidades que se desenvolviam com prática deliberada, da mesma forma que um músculo se desenvolve com treino. Você não era corajoso ou covarde por natureza. Você praticava coragem ou evitava situações que a exigiam.
[[page]]
A virtude era o único bem real porque era o único bem que não podia ser tirado de você.

Riqueza, reputação, saúde, relacionamentos — tudo isso pode ser perdido por circunstâncias fora do seu controle. Sua forma de responder ao que acontece com você nunca pode ser tirada sem a sua permissão. É por isso que Epicteto, que foi escravo, escrevia sobre liberdade com mais autoridade do que a maioria dos homens livres. Ele entendia que a liberdade real não estava nas correntes — estava em como ele escolhia responder a elas.
[[page]]
Praticar virtude não é ser perfeito. É fazer a escolha certa uma vez a mais do que você teria feito ontem.
[[page]]
D5 — O Julgamento
[[page]]
Você não reage às coisas. Você reage à sua interpretação das coisas.

Epicteto dizia que os homens não são perturbados pelos eventos, mas pelas opiniões que formam sobre os eventos. Um engarrafamento não é estressante — a ideia de que seu tempo está sendo desperdiçado é que produz o stress. Uma crítica não é dolorosa — a interpretação de que ela ameaça sua imagem é que dói. O evento é neutro. O julgamento é seu.
[[page]]
Isso tem uma implicação prática enorme: você pode mudar como se sente sem mudar o que acontece.

Não por negação — os estoicos eram realistas, não ingênuos. Mas por revisão do julgamento. Antes de reagir a qualquer coisa, existe um espaço — pequeno, mas real — entre o estímulo e a resposta. Nesse espaço está a sua liberdade. A prática estoica é expandir esse espaço: perceber o julgamento antes de agir a partir dele.
[[page]]
A pergunta que expande esse espaço é simples: isso é tão grave quanto parece agora?

Na maioria das vezes, a resposta honesta é não.
[[page]]
D6 — A Comunidade
[[page]]
Os estoicos acreditavam que o ser humano não existe isolado. Existe em relação.

Marco Aurélio escrevia repetidamente sobre a interdependência humana — a ideia de que cada pessoa é parte de um sistema maior, e que agir bem dentro desse sistema não é altruísmo. É a função natural de quem entende onde está. Você foi formado por outros. Você será lembrado pelo que fez pelos outros. Ignorar isso não é independência — é uma forma de desorientação.
[[page]]
Mas comunidade estoica não é conformidade. É responsabilidade.

Fazer parte de um grupo, de uma família, de uma sociedade, não significa abrir mão dos próprios valores para agradar. Significa contribuir com o que você tem de melhor para o sistema do qual faz parte — e manter seus princípios mesmo quando o grupo pressiona na direção oposta. O estoico não segue a multidão. Mas também não vive para se distinguir dela. Vive para servir ao que é genuinamente bom.
[[page]]
A pergunta estoica sobre qualquer relação é: o que eu devo a essa pessoa como ser humano? Não como resultado, não como troca — como dever.
[[page]]
D7 — O Caráter
[[page]]
Caráter não é o que você mostra quando está sendo observado. É o que você faz quando não está.

Os estoicos tinham pouco interesse em reputação e muito interesse em caráter — porque entendiam que reputação é o que os outros pensam de você, e caráter é o que você realmente é. A distância entre os dois é a medida da sua integridade. Construir reputação sem caráter é construir sobre areia — funciona enquanto as circunstâncias colaboram, e desmorona quando param de colaborar.
[[page]]
Caráter se revela sob pressão, não sob conforto.

É fácil ser generoso quando está sobrando. É fácil ser paciente quando nada está testando sua paciência. É fácil manter princípios quando mantê-los não custa nada. O estoicismo não tinha interesse nessa versão de virtude — ela não conta porque não foi testada. O que conta é como você age quando está cansado, quando está com raiva, quando ninguém está olhando e quando a escolha certa é a mais difícil.
[[page]]
Ao final desse ciclo de 7 dias, a pergunta não é o que você aprendeu sobre estoicismo. É o que você fez diferente por causa disso.
```

### Fase 2: Auditoria do Dia

_Aplique o principio em 1 situacao concreta do seu dia._

#### Ação 2.1: 📝 Auditoria do dia pelo principio

- actionType: Acao Recorrente | repetitions: 1 | duration: 10 min | difficulty: 2
- context: night / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1260 (21:00)
- description: Escreva 3 linhas: o que aconteceu, como o principio se aplicaria e o que voce fara diferente.
- preFlight:
  - 1 situacao real do dia
  - 3 linhas honestas
- briefing:

```text
O princípio lido hoje não é teoria. É uma lente.
[[page]]
Ao final do dia, você vai olhar para o que aconteceu através dessa lente específica — não para todos os seus problemas, não para sua vida inteira. Para um momento. Uma situação. Uma decisão. Algo do dia de hoje que o princípio ilumina de uma forma que você não teria visto sem ele.
[[page]]
O formato é fixo e leva menos de 5 minutos.

Três perguntas, três respostas curtas. O que aconteceu — descreva o momento sem julgamento, só os fatos. Como o princípio do dia se aplica a esse momento — não o que você deveria ter feito, o que o princípio diria sobre o que aconteceu. E o que você faria diferente com essa perspectiva — uma ação concreta, não uma intenção vaga.
[[page]]
A honestidade aqui vale mais do que a resposta certa.

Você não está sendo avaliado. Está construindo um registro real do que acontece quando você tenta aplicar uma ideia filosófica à vida real — e isso inclui os dias em que não conseguiu, os dias em que o princípio não ajudou e os dias em que você agiu exatamente contra o que acabou de ler. Esses registros são os mais valiosos.
```

---

## 📚 Leitura Ativa

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c02`
- descrição: Habito de leitura com retencao real para absorver de verdade o que voce le.
- price_gold: 50 | price_brl: 5.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-25
- campaignTier: basico | campaignType: aprendizado | campaignTheme: produtividade | primaryAssetId: consciencia
- tags: consciencia, basico, aprendizado, produtividade, leitura, retencao

### Fase 1: Leitura de Base

_Entenda por que tanta leitura evapora rapido._

#### Ação 1.1: 📘 Por que voce esquece o que le

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 1
- context: afternoon / medium
- description: Leia a aula na aba Anotacao e marque quando terminar.
- briefing:

```text
O problema não é memória. É método.
[[page]]
A maioria das pessoas lê de forma passiva — os olhos percorrem as linhas, as palavras fazem sentido no momento, e duas semanas depois sobra só uma impressão vaga do que o livro era "sobre". Isso não é falha de inteligência. É o resultado de um processo de leitura que nunca foi projetado para reter, só para avançar.
[[page]]
O cérebro retém o que reconstrói, não o que absorve.

Quando você lê sem interagir com o texto — sem parar, sem questionar, sem conectar com o que já sabe — o conteúdo passa pelo processamento de curto prazo e não chega à memória de longo prazo. É o mesmo mecanismo que faz você esquecer o nome de alguém segundos depois de ser apresentado: a informação entrou, mas não teve âncora suficiente para fixar.
[[page]]
Sublinhar não resolve. Na maioria das vezes, piora.

Sublinhar dá a sensação de estar aprendendo sem o trabalho real de aprender. Você marca a frase porque ela parece importante — mas o cérebro não processou por que ela é importante, nem como ela se conecta ao resto. Releituras de trechos sublinhados produzem a ilusão de familiaridade, que o cérebro confunde com compreensão. Não é a mesma coisa.
[[page]]
A técnica que funciona é a da reconstrução.

Ao final de cada sessão de leitura — não do livro inteiro, da sessão — feche o livro e escreva com suas próprias palavras a ideia principal que ficou. Uma ideia. Não um resumo, não bullet points, não transcrição. A ideia que o seu cérebro escolheu reter quando você não podia mais olhar para o texto. Esse processo de reconstrução é o que move a informação do processamento passivo para a memória ativa — e é o que faz a diferença entre ler e aprender.
```

### Fase 2: Retencao em Campo

_Leia menos no automatico e retenha mais no fim da sessao._

#### Ação 2.1: 📝 Sessao de 20 minutos com metodo

- actionType: Acao Recorrente | repetitions: 1 | duration: 20 min | difficulty: 2
- context: night / medium | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1260 (21:00)
- description: Leia 20 minutos e registre com suas palavras 1 ideia que ficou.
- preFlight:
  - Livro atual
  - Caneta ou notas
  - Ambiente sem notificacao
- briefing:

```text
20 minutos é suficiente quando o processo é certo.
[[page]]
A maioria das pessoas acredita que precisa de longos blocos de tempo para ler de forma produtiva. Não precisa. 20 minutos de leitura ativa produzem mais retenção do que 2 horas de leitura passiva — porque o que determina o aprendizado não é o tempo gasto, é o que o cérebro faz com o conteúdo durante e depois da leitura.
[[page]]
O protocolo é simples e não negocia.

Leia por 20 minutos sem interrupção — sem celular, sem notificação, sem pausas para checar qualquer coisa. Quando o tempo acabar, feche o livro ou vire a tela. Não vale "só mais um parágrafo". O encerramento deliberado é parte do método — ele sinaliza ao cérebro que chegou a hora de consolidar o que foi lido.
[[page]]
Então escreva. Com suas palavras. Sem olhar para o texto.

Uma ideia. Pode ser uma frase, pode ser um parágrafo. O critério não é tamanho — é que seja genuinamente sua reconstrução do que ficou, não uma transcrição do que você lembra ter lido. Se você não consegue escrever nada sem olhar para o texto, isso é um dado importante: significa que a leitura foi passiva. Sem julgamento — só observação. Na próxima sessão, leia menos e processe mais.
```

---

## 🤸 Mobilidade e Flexibilidade

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c09`
- descrição: Corpo funcional alem da academia com movimento que previne e recupera.
- price_gold: 50 | price_brl: 5.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-25
- campaignTier: basico | campaignType: pratica | campaignTheme: exercicio | primaryAssetId: fisico
- tags: fisico, basico, pratica, exercicio, mobilidade, flexibilidade

### Fase 1: Mobilidade Matinal

_Acorde o corpo com um protocolo simples e funcional._

#### Ação 1.1: 🧘 Sequência de mobilidade de 10 minutos

- actionType: Acao Recorrente | repetitions: 1 | duration: 10 min | difficulty: 1
- context: morning / medium | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 420 (07:00)
- description: 10 minutos ao acordar com rotacao de quadril, abertura de ombros e mobilizacao de coluna.
- preFlight:
  - Espaco minimo
  - Chao livre
- briefing:

```text
Mobilidade não é o mesmo que flexibilidade. Flexibilidade é o quanto um músculo alonga passivamente. Mobilidade é o quanto uma articulação se move com controle. É a mobilidade que protege de lesão e mantém o corpo funcional ao longo dos anos — não a capacidade de fazer o spagat.
```

### Fase 2: Ponto de Tensao

_Ataque a regiao do corpo que mais acumulou rigidez no dia._

#### Ação 2.1: 🎯 Ponto de tensao do dia

- actionType: Acao Recorrente | repetitions: 1 | duration: 10 min | difficulty: 1
- context: night / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1260 (21:00)
- description: Identifique onde o corpo travou hoje e faca o alongamento especifico indicado para essa regiao.
- preFlight:
  - Perceber a tensao principal do corpo
- briefing:

```text
Tensão muscular é o registro físico do dia. Onde você carregou peso, onde ficou parado, onde segurou o stress — tudo aparece no corpo. Identificar e liberar o ponto de tensão diário não é spa. É manutenção do sistema que você usa para fazer tudo.
```

---

## 🤝 Presenca Real

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c05`
- descrição: Qualidade nos vinculos proximos para estar de verdade quando esta com alguem.
- price_gold: 50 | price_brl: 5.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-25
- campaignTier: basico | campaignType: pratica | campaignTheme: socializacao | primaryAssetId: conexoes
- tags: conexoes, basico, pratica, socializacao, presenca, relacoes

### Fase 1: Leitura de Base

_Diferencie presenca fisica de presenca real._

#### Ação 1.1: 📘 A diferenca entre estar junto e estar presente ⚠️ aula vazia

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 1
- context: afternoon / medium
- description: Leia a aula na aba Anotacao e marque quando terminar.
- briefing: (vazio)

### Fase 2: Presenca Intencional

_Leve a atencao inteira para 1 encontro real por dia._

#### Ação 2.1: 🫱 Janela de presenca intencional

- actionType: Acao Recorrente | repetitions: 1 | duration: 15 min | difficulty: 1
- context: evening / medium | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1140 (19:00)
- description: Escolha 1 interacao do dia e mantenha o celular virado para baixo ou fora do bolso.
- preFlight:
  - Uma interacao real
  - Celular longe da mao
- briefing:

```text
Estar no mesmo espaço que alguém e estar presente com alguém são coisas completamente diferentes. O celular não precisa estar na mão para dividir a atenção — ele só precisa estar visível. Escolher 1 interação por dia para estar de verdade não é romantismo. É uma decisão sobre o que você valoriza o suficiente para dar atenção real.
```

---

## 🌙 Sono de Elite

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c01`
- descrição: Protocolo de recuperacao noturna para dormir melhor sem mudar sua rotina toda.
- price_gold: 50 | price_brl: 5.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-25
- campaignTier: basico | campaignType: aprendizado | campaignTheme: bem_estar | primaryAssetId: fisico
- tags: fisico, basico, aprendizado, bem-estar, sono, recuperacao

### Fase 1: Leitura de Base

_Entenda o que destrava ou sabota sua recuperacao noturna._

#### Ação 1.1: 📘 Por que voce acorda cansado

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 1
- context: evening / medium
- description: Leia a aula na aba Anotacao e marque quando terminar.
- briefing:

```text
O sono não é um estado uniforme. Enquanto você dorme, o corpo passa por ciclos de aproximadamente 90 minutos, alternando entre sono leve, sono profundo e sono REM. O problema não é só a quantidade de horas — é onde dentro desse ciclo o alarme te acorda. Ser arrancado do sono profundo produz aquela sensação de peso e desorientação que dura horas, independente de ter dormido 7 ou 9 horas. Você não acorda cansado porque dormiu pouco. Muitas vezes acorda cansado porque acordou na hora errada.
[[page]]
O segundo fator é o cortisol. Esse hormônio, que deveria subir naturalmente ao amanhecer para te preparar para o dia, tem seu ritmo sabotado por luz artificial, telas à noite e horários irregulares de sono. Quando o cortisol não sobe no momento certo, o corpo não completa a transição do sono para o estado de alerta — e você passa as primeiras horas do dia lutando contra a biologia em vez de trabalhar com ela.
[[page]]
O terceiro fator, e o mais ignorado, é a temperatura. O corpo precisa reduzir sua temperatura central para entrar em sono profundo. Quarto quente, coberta pesada demais, banho quente imediatamente antes de dormir — tudo isso atrasa a entrada no sono profundo e reduz o tempo total de recuperação real, mesmo que você passe 8 horas na cama.
[[page]]
Você não precisa de suplemento, de app de monitoramento ou de rotina perfeita para dormir melhor. Precisa entender o que está sabotando o que já deveria acontecer naturalmente — e remover esses obstáculos um por um.
```

### Fase 2: Aplicacao Noturna

_Desacelere o sistema antes de dormir._

#### Ação 2.1: 📝 Protocolo de desaceleracao

- actionType: Acao Recorrente | repetitions: 1 | duration: 30 min | difficulty: 1
- context: night / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1320 (22:00)
- description: 30 minutos antes de dormir: tela desligada, luz baixa e 1 anotacao do dia.
- preFlight:
  - Luz baixa
  - Celular fora da mao
  - Caderno ou notas
- briefing:

```text
Seu sistema nervoso não tem um botão de desligar. Ele precisa de uma rampa de descida — um conjunto de sinais ambientais e comportamentais que avisem ao corpo que o dia acabou e que é seguro soltar a guarda. Sem essa rampa, você deita, fecha os olhos e a cabeça continua em modo de execução.
[[page]]
O protocolo é simples: 30 minutos antes de dormir, tela desligada ou em modo noturno com brilho mínimo. Luz do ambiente reduzida — trocar o teto por um abajur ou deixar só a luz do corredor já faz diferença mensurável. Uma anotação rápida do que ficou aberto no dia — não para resolver, mas para retirar da memória ativa e colocar em algum lugar físico. E temperatura do quarto mais baixa do que você acha que precisa. Esses quatro elementos, juntos, constroem a rampa de descida que o corpo precisa para entrar em sono profundo mais rápido e permanecer mais tempo nele.
```

---

## 🎙️ Voz e Presenca

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c07`
- descrição: Comunicacao e expressao pessoal para falar com clareza e ser ouvido de verdade.
- price_gold: 50 | price_brl: 5.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-25
- campaignTier: basico | campaignType: pratica | campaignTheme: socializacao | primaryAssetId: conexoes
- tags: conexoes, basico, pratica, socializacao, comunicacao, clareza

### Fase 1: Leitura de Base

_Veja o que faz alguem ser ouvido de verdade._

#### Ação 1.1: 📘 Por que algumas pessoas sao ouvidas e outras nao ⚠️ aula vazia

- actionType: Compromisso | repetitions: 1 | duration: 15 min | difficulty: 1
- context: afternoon / medium
- description: Leia a aula na aba Anotacao e marque quando terminar.
- briefing: (vazio)

### Fase 2: Sintese em Campo

_Treine clareza antes de abrir a boca._

#### Ação 2.1: ✍️ Síntese de 2 frases

- actionType: Acao Recorrente | repetitions: 1 | duration: 10 min | difficulty: 2
- context: morning / medium | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 540 (09:00)
- description: Escolha 1 ideia que voce precisa comunicar hoje e escreva em 2 frases antes de falar.
- preFlight:
  - Tema que voce vai comunicar
  - 2 frases escritas antes
- briefing:

```text
Clareza não é talento de comunicação. É trabalho de pensamento feito antes de falar. Quem fala muito sem dizer nada geralmente ainda está descobrindo o que quer dizer enquanto fala. Escrever em 2 frases antes de comunicar não é limitação — é o processo de separar o que importa do que é ruído.
```

---

## 🎨 Expressao Criativa

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d10`
- descrição: Desenvolver uma linguagem propria com arte, escrita ou forma como ferramenta de identidade.
- price_gold: 100 | price_brl: 10.0 | price_fragments: 34
- duration_days: 14 | autor: Soberano System | criada: 2026-03-25
- campaignTier: medio | campaignType: pratica | campaignTheme: expressao | primaryAssetId: consciencia
- tags: consciencia, medio, pratica, expressao, criatividade, identidade

### Fase 1: Leitura de Base

_Tire a criatividade do pedestal e jogue ela para a pratica._

#### Ação 1.1: 📘 Semana 1: Expressao nao e talento - e pratica / Semana 2: Encontrar sua voz ⚠️ aula vazia

- actionType: Acao Recorrente | repetitions: 2 | duration: 15 min | difficulty: 1
- context: morning / medium | scheduledDays: SEG | scheduledStartTime: 540 (09:00)
- description: Leia a aula da semana na aba Anotacao e marque quando terminar.
- briefing: (vazio)

### Fase 2: Pratica e Reflexao

_Produza um pouco por dia e observe o rastro da sua propria voz._

#### Ação 2.1: 🎨 Sessao diaria de 20 minutos

- actionType: Acao Recorrente | repetitions: 1 | duration: 20 min | difficulty: 2
- context: afternoon / medium | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1020 (17:00)
- description: Escolha o meio no inicio do ciclo e pratique 20 minutos por dia sem objetivo de resultado.
- preFlight:
  - Meio escolhido: escrita, desenho, musica ou fotografia
- briefing:

```text
Adultos param de criar porque passam a julgar antes de produzir. A régua de qualidade aparece antes do rascunho, e o rascunho nunca sai. 20 minutos por dia no seu meio escolhido com a única regra de não parar antes do tempo — isso não é aula de arte. É retreinamento do hábito de criar sem permissão.
```

#### Ação 2.2: 📝 O que saiu hoje

- actionType: Acao Recorrente | repetitions: 1 | duration: 5 min | difficulty: 1
- context: night / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1260 (21:00)
- description: Registre em 1 linha o que foi criado ou tentado, sem julgar a qualidade.
- briefing: (vazio)

---

## 🛡️ Construcao de Cla

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d08`
- descrição: Criar ou fortalecer seu circulo de alto nivel, porque quem esta ao seu redor define seu teto.
- price_gold: 150 | price_brl: 15.0 | price_fragments: 34
- duration_days: 14 | autor: Soberano System | criada: 2026-03-25
- campaignTier: medio | campaignType: pratica | campaignTheme: socializacao | primaryAssetId: conexoes
- tags: conexoes, medio, pratica, socializacao, cla, vinculos

### Fase 1: Leitura de Base

_Entenda o peso do ambiente social no seu padrao._

#### Ação 1.1: 📘 Semana 1: Voce e a media dos 5 / Semana 2: Como nutrir vinculos sem forcar ⚠️ aula vazia

- actionType: Acao Recorrente | repetitions: 2 | duration: 15 min | difficulty: 1
- context: morning / medium | scheduledDays: SEG | scheduledStartTime: 480 (08:00)
- description: Leia a aula da semana na aba Anotacao e marque quando terminar.
- briefing: (vazio)

### Fase 2: Mapa e Acao

_Veja quem sustenta ou drena sua energia social e aja em cima disso._

#### Ação 2.1: 🗺️ Mapa de vinculos e acao intencional

- actionType: Acao Recorrente | repetitions: 1 | duration: 15 min | difficulty: 2
- context: afternoon / medium | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1080 (18:00)
- description: Semana 1: liste seus 10 contatos mais frequentes. Semana 2: 1 acao intencional por dia em direcao a quem energiza.
- preFlight:
  - Lista dos contatos frequentes
  - Uma acao concreta por dia
- briefing:

```text
Você não escolhe conscientemente quem está ao seu redor — na maioria das vezes isso acontece por conveniência, proximidade ou acaso. O mapa de vínculos não é sobre cortar pessoas. É sobre enxergar com clareza quem está realmente no seu campo de influência e o que cada relação produz em você.

Relacionamentos de alto valor não se constroem com grandes gestos — se constroem com contato consistente e genuíno. Uma mensagem real, um reconhecimento, uma indicação sem interesse imediato. Feito todos os dias durante 14 dias, isso não é networking. É construção de clã.
```

#### Ação 2.2: 📝 Qualidade do vinculo do dia

- actionType: Acao Recorrente | repetitions: 1 | duration: 5 min | difficulty: 1
- context: night / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1260 (21:00)
- description: Registre se houve 1 troca de valor real hoje e qual foi.
- briefing: (vazio)

---

## 🏋️ Despertar de Ferro

- id: `7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a01`
- descrição: Treino estruturado com progressao real para acumular forca semana a semana.
- price_gold: 200 | price_brl: 20.0 | price_fragments: 34
- duration_days: 14 | autor: Soberano System | criada: 2026-03-16
- campaignTier: medio | campaignType: pratica | campaignTheme: exercicio | primaryAssetId: fisico
- tags: fisico, medio, pratica, exercicio, forca, progressao

### Fase 1: Fundamento da Progressao

_Entenda por que progresso sustentado vence intensidade solta._

#### Ação 1.1: 📘 Semana 1: Por que progressao bate intensidade / Semana 2: Recuperacao e treino ⚠️ aula vazia

- actionType: Acao Recorrente | repetitions: 2 | duration: 15 min | difficulty: 1
- context: morning / medium | scheduledDays: SEG | scheduledStartTime: 420 (07:00)
- description: Leia a aula da semana na aba Anotacao e marque quando terminar.
- briefing: (vazio)

### Fase 2: Treino e Registro

_Aplique o protocolo e acompanhe o que seu corpo esta construindo._

#### Ação 2.1: 🏋️ Treino do dia - serie progressiva

- actionType: Acao Recorrente | repetitions: 1 | duration: 35 min | difficulty: 3
- context: morning / high | scheduledDays: SEG TER QUA QUI SEX | scheduledStartTime: 420 (07:00)
- description: Protocolo de 4 exercicios compostos. Semana 1 com volume base. Semana 2 com +1 serie por exercicio.
- preFlight:
  - Espaco livre
  - Carga ou peso corporal
  - Agua por perto
- briefing:

```text
Força não é sobre se machucar. É sobre aplicar estímulo suficiente para que o corpo entenda que precisa se adaptar — e depois descansar para que essa adaptação aconteça. O protocolo progressivo faz esse cálculo por você: semana 1 estabelece a base, semana 2 aumenta o estímulo. Sem improvisação, sem ego, sem lesão.
```

#### Ação 2.2: 📝 Log de carga e sensacao

- actionType: Acao Recorrente | repetitions: 1 | duration: 5 min | difficulty: 1
- context: night / low | scheduledDays: SEG TER QUA QUI SEX | scheduledStartTime: 1260 (21:00)
- description: Anote o que foi feito, a carga usada e como o corpo respondeu no dia.
- preFlight:
  - Bloco de notas ou campo rapido
- briefing: (vazio)

---

## 📈 Financas com Intencao

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d09`
- descrição: Organizar o dinheiro como quem constroi patrimonio, nao como quem apaga incendio.
- price_gold: 200 | price_brl: 20.0 | price_fragments: 34
- duration_days: 14 | autor: Soberano System | criada: 2026-03-25
- campaignTier: medio | campaignType: manutencao | campaignTheme: estrategia | primaryAssetId: financas
- tags: financas, medio, manutencao, estrategia, patrimonio, direcao

### Fase 1: Leitura de Base

_Saia da logica de apagar incendio e entre em construcao intencional._

#### Ação 1.1: 📘 Semana 1: A diferenca entre controlar e construir / Semana 2: O primeiro passo do patrimonio ⚠️ aula vazia

- actionType: Acao Recorrente | repetitions: 2 | duration: 15 min | difficulty: 1
- context: morning / medium | scheduledDays: SEG | scheduledStartTime: 480 (08:00)
- description: Leia a aula da semana na aba Anotacao e marque quando terminar.
- briefing: (vazio)

### Fase 2: Mapa e Decisao

_Mapeie seu dinheiro e registre as escolhas do ciclo._

#### Ação 2.1: 🧭 Construcao do mapa financeiro

- actionType: Acao Recorrente | repetitions: 1 | duration: 20 min | difficulty: 2
- context: afternoon / medium | scheduledDays: SEG QUA SEX | scheduledStartTime: 1140 (19:00)
- description: Semana 1: mapear entradas e saidas. Semana 2: definir 1 meta com valor e prazo e criar a arena correspondente.
- preFlight:
  - Entradas
  - Saidas fixas
  - Saidas variaveis
- briefing: (vazio)

#### Ação 2.2: 📝 Decisao financeira do dia

- actionType: Acao Recorrente | repetitions: 1 | duration: 5 min | difficulty: 1
- context: night / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1260 (21:00)
- description: Registre 1 decisao financeira do dia e se ela foi intencional ou automatica.
- briefing: (vazio)

---

## 🏦 Maestria Financeira

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e05`
- descrição: Construcao de patrimonio com intencao para sair do controle e entrar no crescimento real.
- price_gold: 300 | price_brl: 30.0 | price_fragments: 42
- duration_days: 21 | autor: Soberano System | criada: 2026-03-25
- campaignTier: avancado | campaignType: aprendizado | campaignTheme: estrategia | primaryAssetId: financas
- tags: financas, avancado, aprendizado, estrategia, patrimonio, crescimento

### Fase 1: Leitura do Construtor

_Troque a mentalidade do consumidor pela do construtor de patrimonio._

#### Ação 1.1: 📘 Leitura estrutural do patrimonio

- actionType: Acao Recorrente | repetitions: 3 | duration: 15 min | difficulty: 2
- context: morning / medium | scheduledDays: SEG | scheduledStartTime: 480 (08:00)
- description: Leia o texto da semana na aba Anotacao e marque quando terminar.
- briefing:

```text
Semana 1 — A mentalidade do construtor vs a do consumidor
[[page]]
A diferença entre quem acumula patrimônio e quem não acumula raramente é renda.

É mentalidade. Duas pessoas com o mesmo salário, na mesma cidade, com as mesmas despesas fixas — uma constrói patrimônio ao longo dos anos e a outra não. A diferença não está na planilha. Está na forma como cada uma interpreta o papel do dinheiro na própria vida. Uma vê dinheiro como recurso para consumir. A outra vê como ferramenta para construir.
[[page]]
O consumidor otimiza para o presente. O construtor otimiza para o sistema.

O consumidor pensa em como o dinheiro vai melhorar sua vida agora — o jantar, a viagem, o produto, o conforto imediato. O construtor pensa em como o dinheiro pode trabalhar para gerar mais dinheiro — como cada real alocado hoje muda as opções disponíveis daqui a 5, 10, 20 anos. Nenhum dos dois é errado em abstrato. O problema é quando a mentalidade do consumidor opera de forma exclusiva e inconsciente, sem nenhum espaço para a lógica do construtor.
[[page]]
Sua relação psicológica com dinheiro foi formada antes que você tivesse escolha.

O que seus pais diziam sobre dinheiro. Se havia escassez ou abundância na infância. As primeiras experiências de ganhar, perder ou não ter. Tudo isso criou crenças que operam em segundo plano toda vez que você toma uma decisão financeira — e que frequentemente contradizem o que você racionalmente sabe que deveria fazer. Entender de onde vêm essas crenças não resolve tudo, mas torna visível o que estava operando no escuro.
[[page]]
Este Codex não começa com planilha. Começa com a pergunta: qual é a sua história com dinheiro?
[[page]]
Semana 2 — Os instrumentos básicos de crescimento
[[page]]
Três conceitos mudam tudo quando realmente entram na prática: reserva, alocação e juros compostos.

A reserva de emergência não é investimento. É proteção. Sem ela, qualquer imprevisto — carro, saúde, demissão — se transforma em dívida. E dívida é o oposto de construção de patrimônio: ela toma dinheiro do futuro para pagar o presente. A reserva existe para que imprevistos sejam inconvenientes, não catástrofes. O tamanho ideal é entre 3 e 6 meses das suas despesas fixas mensais, em algo líquido e seguro.
[[page]]
Alocação é a decisão de para onde o dinheiro vai antes de ter a chance de ir para outro lugar.

O erro mais comum é gastar o que sobra e guardar o que sobrar depois. Não sobra. O modelo que funciona é o inverso: ao receber, separa primeiro o que vai para reserva ou investimento — mesmo que seja pouco — e vive com o que resta. Essa inversão simples muda o comportamento financeiro mais do que qualquer corte de gasto, porque remove a decisão do momento em que o dinheiro está disponível e a tentação é maior.
[[page]]
Juros compostos são a única força no universo financeiro que trabalha para você enquanto você dorme.

R$200 por mês investidos a uma taxa de 10% ao ano durante 20 anos se transformam em aproximadamente R$150.000. O mesmo valor guardado embaixo do colchão se transforma em R$48.000. A diferença de R$102.000 não veio de trabalho extra — veio do tempo e da consistência. O segredo dos juros compostos não é o rendimento. É começar cedo e não interromper.
[[page]]
O instrumento mais poderoso não é o melhor investimento. É a consistência no mais simples.
[[page]]
Semana 3 — Patrimônio como projeto de vida
[[page]]
Dinheiro é uma ferramenta. A pergunta mais importante não é quanto você tem — é para que você está construindo.

Pessoas que acumulam patrimônio sem propósito claro frequentemente chegam a um ponto de saturação onde mais dinheiro não produz mais satisfação — porque nunca foi definido o suficiente. Pessoas que constroem com propósito claro sabem quando chegaram, sabem o que fazer com o que construíram e sentem o progresso ao longo do caminho, não só no destino.
[[page]]
Liberdade financeira não é riqueza. É escolha.

O objetivo real do patrimônio não é um número no extrato. É a capacidade de dizer não ao que não quer e sim ao que quer — sem que a decisão seja determinada pelo dinheiro. Pode ser trabalhar menos. Pode ser mudar de carreira sem medo. Pode ser suportar um período de transição sem entrar em pânico. O patrimônio compra opções. E opções são o que liberdade real significa na prática.
[[page]]
A meta financeira que funciona é a que está conectada a algo concreto e pessoal.

Não "quero ter dinheiro" — isso é intenção vaga. "Quero ter reserva suficiente para ficar 6 meses sem renda se precisar mudar de emprego" é uma meta. "Quero investir R$500 por mês até ter R$100.000 para dar entrada em um imóvel em 8 anos" é uma meta. Específica, com valor, com prazo e com significado pessoal claro. Esse tipo de meta resiste aos meses ruins porque tem uma razão concreta por trás.
[[page]]
Ao final deste ciclo você vai ter um sistema, uma meta e um primeiro movimento real. Isso já é mais do que a maioria das pessoas tem.
```

### Fase 2: Sistema e Lente

_Mapeie o sistema financeiro real e avalie o comportamento pela meta._

#### Ação 2.1: 🏦 Construcao do sistema financeiro pessoal

- actionType: Acao Recorrente | repetitions: 1 | duration: 20 min | difficulty: 3
- context: afternoon / medium | scheduledDays: SEG QUA SEX | scheduledStartTime: 1140 (19:00)
- description: S1: mapear patrimonio atual. S2: meta de 12 meses. S3: criar arena de financas no Glyph.
- preFlight:
  - Ativos
  - Dividas
  - Fluxo mensal real
- briefing:

```text
Semana 1 — Mapeamento do território real.

Antes de qualquer decisão, você precisa saber onde está. Liste tudo: entradas mensais reais, despesas fixas, despesas variáveis médias e dívidas ativas com juros e parcelas. Não o que você acha que gasta — o que o extrato mostra. Esse mapeamento vai revelar pelo menos uma surpresa. Sempre revela. O objetivo não é se sentir mal com o que encontrar. É trabalhar com dados reais em vez de suposições.
[[page]]
Semana 2 — Definição da meta de 12 meses.

Com o mapa em mãos, defina 1 meta financeira concreta para os próximos 12 meses. Ela precisa ter valor específico, prazo definido e significado pessoal claro — não pode ser vaga. Depois, defina a estratégia: quanto vai separar por mês, onde vai guardar ou investir e o que vai ajustar nos gastos para viabilizar. Crie a Arena de Finanças no Glyph com as ações mensais derivadas dessa meta.
[[page]]
Semana 3 — Sistema de alocação.

Implemente o modelo de alocação antes do gasto: defina qual percentual ou valor fixo vai para reserva ou investimento assim que o dinheiro entrar. Automatize se possível — transferência programada, débito automático. O que é automático não depende de força de vontade. E força de vontade é o recurso mais escasso que existe quando o salário cai na conta.
```

#### Ação 2.2: 📝 Decisao financeira do dia pela lente do construtor

- actionType: Acao Recorrente | repetitions: 1 | duration: 5 min | difficulty: 2
- context: night / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1260 (21:00)
- description: Registre se a decisao financeira do dia estava alinhada com a meta de 12 meses.
- briefing:

```text
Uma pergunta ao final de cada dia.
[[page]]
Houve alguma decisão financeira hoje — grande ou pequena? Se sim: estava alinhada com a meta de 12 meses que você definiu? Sim, parcialmente ou não. Uma linha sobre o que foi a decisão e como ela se encaixa ou não no sistema que você está construindo.
[[page]]
O registro diário não é para criar culpa. É para criar consciência.

A maioria das decisões financeiras ruins não são tomadas por falta de conhecimento. São tomadas no automático, sem perceber que uma decisão está sendo tomada. O registro força a percepção — e percepção é o primeiro passo para qualquer mudança real de comportamento. Ao final de 21 dias o padrão entre intenção e comportamento real aparece com clareza que nenhuma autoavaliação subjetiva consegue produzir.
```

### Fase 3: Primeiro Movimento Real

_Execute um marco financeiro concreto que inaugure seu novo padrao._

#### Ação 3.1: 🏁 Primeiro movimento real

- actionType: Compromisso | repetitions: 1 | duration: 20 min | difficulty: 4
- context: afternoon / medium
- description: Abra conta de investimento, faca o primeiro aporte ou quite 1 divida pequena pela primeira vez.
- preFlight:
  - Movimento escolhido
  - Valor ou acao definida
  - Registro do marco preparado
- briefing:

```text
Esta semana você vai executar 1 ação financeira concreta e nova.
[[page]]
Abrir uma conta de investimento que ainda não abriu. Fazer o primeiro aporte — qualquer valor. Cancelar uma assinatura que existe no débito automático há meses sem uso real. Quitar uma dívida pequena que ficou parada. Fazer uma transferência programada automática para reserva. O que for — desde que seja a primeira vez que você faz essa ação específica.
[[page]]
Pequeno e real vale mais do que grande e imaginário.

R$50 investidos hoje valem mais do que R$5.000 planejados para o mês que vem. O primeiro movimento quebra a inércia — e inércia financeira é o maior obstáculo para a maioria das pessoas, não falta de conhecimento ou de dinheiro. Depois do primeiro movimento, o segundo é sempre mais fácil.
[[page]]
Registre no Legado como Marco financeiro.

O que foi a ação. Quanto envolveu. O que significa para você. Não pelo tamanho — pela decisão consciente que representa. Esse é o registro do momento em que você parou de planejar e começou a construir.
```

---

## 🧭 Lideranca sem Cargo

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e04`
- descrição: Influencia, decisao e responsabilidade para liderar antes de ter o titulo.
- price_gold: 350 | price_brl: 35.0 | price_fragments: 42
- duration_days: 21 | autor: Soberano System | criada: 2026-03-25
- campaignTier: avancado | campaignType: aprendizado | campaignTheme: estrategia | primaryAssetId: trabalho
- tags: trabalho, avancado, aprendizado, estrategia, lideranca, influencia

### Fase 1: Leitura de Lideranca

_Entenda como lideres reais se movem antes de receber autoridade formal._

#### Ação 1.1: 📘 Leitura estrutural da lideranca ⚠️ aula vazia

- actionType: Acao Recorrente | repetitions: 3 | duration: 15 min | difficulty: 2
- context: morning / medium | scheduledDays: SEG | scheduledStartTime: 480 (08:00)
- description: Leia o texto da semana na aba Anotacao e marque quando terminar.
- briefing: (vazio)

### Fase 2: Pratica e Reflexo

_Exerga onde faltou lideranca, aja e meca o que sua iniciativa moveu._

#### Ação 2.1: 🧭 Pratica de lideranca do dia

- actionType: Acao Recorrente | repetitions: 1 | duration: 15 min | difficulty: 3
- context: afternoon / medium | scheduledDays: SEG TER QUA QUI SEX | scheduledStartTime: 1020 (17:00)
- description: S1: onde voce poderia ter liderado. S2: 1 acao intencional de influencia. S3: 1 decisao dificil pendente.
- preFlight:
  - Situacao real
  - Disposicao para assumir responsabilidade
- briefing: (vazio)

#### Ação 2.2: 📝 Quem voce moveu hoje

- actionType: Acao Recorrente | repetitions: 1 | duration: 5 min | difficulty: 2
- context: night / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1260 (21:00)
- description: Registre se alguma pessoa, projeto ou situacao avancou por sua iniciativa.
- briefing: (vazio)

### Fase 3: Iniciativa Propria

_Proponha e execute algo real sem ter sido solicitado._

#### Ação 3.1: 🏁 Projeto de iniciativa propria

- actionType: Compromisso | repetitions: 1 | duration: 30 min | difficulty: 5
- context: afternoon / high
- description: Proponha e execute 1 iniciativa pequena, mas real, no trabalho ou comunidade.
- preFlight:
  - Iniciativa definida
  - Primeiro passo claro
  - Responsavel assumido por voce
- briefing: (vazio)

---

## 🛡️ Logistica de Vanguarda

- id: `7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a04`
- descrição: Reduzir a carga cognitiva atraves da ordem externa impecavel.
- price_gold: 350 | price_brl: 350.0 | price_fragments: 22
- duration_days: 7 | autor: Soberano System | criada: 2026-03-16
- campaignTier: None | campaignType: None | campaignTheme: None | primaryAssetId: None
- tags: ordem, logistica, ambiente, planejamento

### Fase 1: Limpeza de Deck

_Organize o campo imediato para reduzir friccao operacional._

#### Ação 1.1: 🧹 Limpeza de Deck

- actionType: Ação Recorrente | repetitions: 1 | duration: 15 min | difficulty: 2
- context: morning / low | scheduledDays: SEG TER QUA QUI SEX | scheduledStartTime: 480 (08:00)
- description: Organizacao fisica do campo de trabalho imediato.
- preFlight:
  - Lixo removido
  - Cabos alinhados
  - Superficie limpa
- briefing:

```text
Mesa limpa, mente limpa.
```

### Fase 2: Planejamento de Batalha

_Mapeie compromissos e entre na semana com direcao clara._

#### Ação 2.1: 🗺️ Planejamento de Batalha (Domingo)

- actionType: Ação Recorrente | repetitions: 1 | duration: 30 min | difficulty: 4
- context: evening / medium | scheduledDays: DOM | scheduledStartTime: 1080 (18:00)
- description: Mapear compromissos e definir as 3 campanhas prioritarias.
- preFlight:
  - Agenda aberta
  - 3 prioridades definidas
  - Blocos livres revisados
- briefing:

```text
Venca a semana antes dela comecar.
```

---

## ⚗️ Reset Dopaminergico

- id: `7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a02`
- descrição: Eliminar o brain fog e estabilizar a energia via biohacking alimentar.
- price_gold: 350 | price_brl: 350.0 | price_fragments: 34
- duration_days: 14 | autor: Soberano System | criada: 2026-03-16
- campaignTier: None | campaignType: None | campaignTheme: None | primaryAssetId: None
- tags: clareza, nutricao, jejum, biohacking

### Fase 1: Alquimia Matinal

_Abra o dia com um ritual biologico de clareza e ativacao._

#### Ação 1.1: 🍋 Alquimia Matinal (Shot)

- actionType: Ação Recorrente | repetitions: 1 | duration: 3 min | difficulty: 1
- context: morning / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 390 (06:30)
- description: Limao, curcuma, gengibre e pimenta preta.
- preFlight:
  - Limao
  - Curcuma
  - Gengibre
  - Pimenta preta
- briefing:

```text
Sua primeira medicina do dia. Ative o corpo antes do ruido entrar.
```

### Fase 2: Jejum de Soberano

_Use o silencio digestivo para recuperar foco, estabilidade e energia limpa._

#### Ação 2.1: ⏳ Jejum de Soberano (16h)

- actionType: Ação Recorrente | repetitions: 1 | duration: 16 min | difficulty: 5
- context: night / medium
- description: Protocolo de hidratacao e sais durante a janela de jejum.
- preFlight:
  - Agua
  - Sais
  - Janela alimentar definida
- briefing:

```text
O silencio digestivo gera clareza mental e reduz o arrasto dopaminergico.
```

---

## 👑 Construção de Identidade

- id: `7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a05`
- descrição: Identidade e propósito para definir quem você está se tornando e construir compromisso real com isso.
- price_gold: 400 | price_brl: 40.0 | price_fragments: 42
- duration_days: 21 | autor: Soberano System | criada: 2026-03-16
- campaignTier: avancado | campaignType: aprendizado | campaignTheme: estrategia | primaryAssetId: proposito
- tags: proposito, avancado, aprendizado, estrategia, identidade, soberania

### Fase 1: Leitura Estrutural

_Desmonte identidades herdadas e comece a construir a sua._

#### Ação 1.1: 📘 Leitura estrutural do pacto

- actionType: Acao Recorrente | repetitions: 3 | duration: 15 min | difficulty: 2
- context: morning / medium | scheduledDays: SEG | scheduledStartTime: 480 (08:00)
- description: Leia o texto da semana na aba Anotacao e marque quando terminar.
- briefing:

```text
Semana 1 — A maioria vive o roteiro de outro
[[page]]
Você não escolheu a maioria das coisas que acredita.

Seus valores foram herdados da família, da escola, da religião, da cultura onde cresceu. Suas metas foram moldadas pelo que as pessoas ao seu redor consideravam sucesso. Sua ideia de quem você deveria ser foi construída por comparação — com irmãos, colegas, figuras públicas, personagens de ficção. Tudo isso aconteceu antes que você tivesse ferramentas para questionar qualquer coisa.
[[page]]
Isso não é culpa de ninguém. É o processo padrão de socialização humana.

O problema não é ter sido influenciado — isso é inevitável. O problema é nunca ter parado para auditar o que foi instalado. Muitas pessoas chegam aos 30, 40, 50 anos perseguindo objetivos que nunca escolheram conscientemente, evitando coisas que nunca decidiram evitar, e vivendo de acordo com uma versão de sucesso que pertence a outra pessoa.
[[page]]
A sensação de vazio que vem com conquistas externas geralmente tem essa origem.

Você bate a meta. Consegue o cargo. Compra o apartamento. E a satisfação dura menos do que esperava — porque a meta não era sua de verdade. Era a meta que fazia sentido para o roteiro que você estava seguindo sem perceber. Não é ingratidão. É desalinhamento entre o que você construiu e quem você realmente é.
[[page]]
Este Codex começa com uma pergunta simples e desconfortável: o que você quer de verdade, se ninguém estiver olhando?
[[page]]
Semana 2 — Construindo a identidade deliberada
[[page]]
Identidade não é algo que você descobre. É algo que você decide e constrói.

A ideia de que existe um "eu verdadeiro" esperando para ser encontrado é romântica mas imprecisa. O que existe é um conjunto de valores, comportamentos e padrões que você escolhe ou herda — e que, com o tempo, se tornam quem você é. A diferença entre uma identidade herdada e uma identidade deliberada é simples: uma aconteceu com você, a outra foi construída por você.
[[page]]
Valores reais se revelam nas decisões difíceis, não nas declarações fáceis.

Todo mundo diz que valoriza família, saúde e honestidade. Mas o que você faz quando esses valores entram em conflito com conveniência, dinheiro ou aprovação social? É nesse momento que os valores reais aparecem — não os que você declara, os que você age. Mapear essa distância entre o que você diz valorizar e o que seus comportamentos revelam que você valoriza é o trabalho central desta semana.
[[page]]
Construir identidade deliberada não é criar uma persona. É eliminar o que não é você.

O processo é mais de remoção do que de adição. Você não precisa inventar quem quer ser do zero — precisa identificar o que foi instalado sem escolha e decidir conscientemente o que fica e o que vai. O que sobra depois dessa auditoria é mais próximo do que você realmente é do que qualquer coisa que você tentaria construir partindo do zero.
[[page]]
Ao final desta semana você terá 3 princípios. Não regras, não metas — princípios. As ideias que guiam suas decisões quando não há manual de instrução.
[[page]]
Semana 3 — O compromisso com quem você decidiu ser
[[page]]
Saber quem você quer ser e agir como essa pessoa são dois processos completamente diferentes.

A maioria das pessoas tem clareza suficiente sobre seus valores quando pensa com calma. O problema é que a vida não acontece com calma. Acontece com pressão, cansaço, tentação e circunstâncias que não pedem licença. É nesses momentos que a identidade ou se ancora ou se dissolve — e a diferença entre as duas é o quanto o compromisso foi tornado explícito e concreto antes da pressão aparecer.
[[page]]
Um compromisso vago não resiste a uma situação específica.

"Quero ser mais disciplinado" não te ajuda quando são 23h e você está cansado e a decisão difícil está na sua frente. "Meu princípio é: quando estou cansado é quando mais preciso confiar no sistema" — isso ajuda. A especificidade do compromisso é o que determina se ele funciona sob pressão ou só em condições ideais.
[[page]]
O manifesto pessoal que você vai escrever esta semana não é para mostrar para ninguém.

É um documento interno. Uma declaração de quem você decidiu ser, escrita por você, para você, no momento em que tinha clareza suficiente para fazê-lo — para ser lida nos momentos em que a clareza vai embora. Não precisa ser longo. Precisa ser honesto e específico o suficiente para ser útil quando você mais precisar dele.
[[page]]
Identidade construída sem compromisso explícito é intenção. Com compromisso, é arquitetura.
```

### Fase 2: Construir e Alinhar

_Escreva principios, manifesto e veja se o dia honrou isso._

#### Ação 2.1: ✍️ Construcao do manifesto pessoal

- actionType: Acao Recorrente | repetitions: 1 | duration: 20 min | difficulty: 4
- context: morning / high | scheduledDays: SEG QUA SEX | scheduledStartTime: 420 (07:00)
- description: S1: valores reais vs herdados. S2: 3 principios. S3: redigir o Pacto.
- preFlight:
  - Silencio
  - Caderno aberto
  - Coragem para cortar o que nao e seu
- briefing:

```text
Semana 1 — Auditoria de valores.

Liste 10 valores que você diria que são seus. Depois, para cada um, responda honestamente: esse valor foi escolhido ou herdado? Você age de acordo com ele quando custa algo? Se a resposta for não para as duas perguntas, ele provavelmente não é um valor real — é uma aspiração. Separe os dois. O que sobrar na coluna dos valores reais é o material com que você vai trabalhar.
[[page]]
Semana 2 — Os 3 princípios.

A partir dos valores reais identificados na semana 1, escreva 3 princípios que guiam suas decisões. Princípio não é valor — é valor em ação. "Honestidade" é um valor. "Quando tenho que escolher entre ser honesto e ser aprovado, escolho ser honesto" é um princípio. Cada um dos seus 3 princípios deve ser específico o suficiente para ser útil em uma situação real.
[[page]]
Semana 3 — O manifesto.

Com os princípios escritos, redija o manifesto. Formato livre — pode ser um parágrafo, pode ser uma lista, pode ser uma carta para você mesmo. O critério é um só: ao ler, você reconhece a pessoa descrita ali como quem você quer ser — não como quem você acha que deveria ser aos olhos dos outros. Ao final, esse documento entra no Legado do ciclo.
```

#### Ação 2.2: 📝 Alinhamento do dia

- actionType: Acao Recorrente | repetitions: 1 | duration: 5 min | difficulty: 2
- context: night / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1260 (21:00)
- description: Registre se as decisoes de hoje estavam alinhadas com quem voce declarou ser.
- briefing:

```text
Uma pergunta. Todo dia. Menos de 1 minuto.
[[page]]
As decisões que você tomou hoje estavam alinhadas com os princípios que você escreveu? Sim, parcialmente ou não. Se parcialmente ou não — uma linha sobre o que desalinhou. Não para se punir. Para ver o padrão.
[[page]]
O registro diário de alinhamento é o que transforma o manifesto de documento em bússola.

Sem esse registro, o manifesto vira mais um texto bonito que você escreveu e esqueceu. Com ele, você tem 21 dias de dados reais sobre a distância entre quem você declarou ser e como você age sob as condições reais da sua vida. Esse gap é o trabalho. Não é fracasso — é o mapa.
```

### Fase 3: Decisao pelo Pacto

_Teste seu pacto numa escolha dificil e registre isso como marco._

#### Ação 3.1: 🏁 Decisao pelo pacto

- actionType: Compromisso | repetitions: 1 | duration: 20 min | difficulty: 5
- context: afternoon / high
- description: Tome 1 decisao dificil da semana usando exclusivamente os principios escritos no ciclo.
- preFlight:
  - 1 decisao dificil real
  - Principios escritos na mao
- briefing:

```text
Esta semana você vai tomar 1 decisão difícil usando exclusivamente os princípios escritos.
[[page]]
Não a decisão mais conveniente. Não a mais popular. A decisão que seus princípios apontam — mesmo que seja desconfortável, mesmo que ninguém entenda, mesmo que você prefira não ter que tomá-la. Pode ser no trabalho, nas relações, nas finanças, no tempo. O tamanho não importa. O que importa é que seja real e que seja difícil.
[[page]]
Registre a decisão e o raciocínio.

O que era a situação. Qual princípio se aplicava. O que você decidiu. E como foi. Esse registro entra no Legado como Marco de identidade — não porque foi perfeito, mas porque foi consciente.
```

---

## 💪 Corpo de Elite

- id: `9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e03`
- descrição: Protocolo completo de composicao corporal com forca, mobilidade e recuperacao integrados.
- price_gold: 400 | price_brl: 40.0 | price_fragments: 42
- duration_days: 21 | autor: Soberano System | criada: 2026-03-25
- campaignTier: avancado | campaignType: pratica | campaignTheme: exercicio | primaryAssetId: fisico
- tags: fisico, avancado, pratica, exercicio, composicao, recuperacao

### Fase 1: Leitura dos Pilares

_Aprenda o sistema que integra treino, mobilidade e recuperacao._

#### Ação 1.1: 📘 Leitura estrutural do corpo funcional ⚠️ aula vazia

- actionType: Acao Recorrente | repetitions: 3 | duration: 15 min | difficulty: 2
- context: morning / medium | scheduledDays: SEG | scheduledStartTime: 420 (07:00)
- description: Leia o texto da semana na aba Anotacao e marque quando terminar.
- briefing: (vazio)

### Fase 2: Protocolo e Triangulo

_Treine o sistema e acompanhe os tres sinais do dia._

#### Ação 2.1: 💪 Treino do dia - protocolo integrado

- actionType: Acao Recorrente | repetitions: 1 | duration: 40 min | difficulty: 4
- context: morning / high | scheduledDays: SEG TER QUA QUI SEX SAB | scheduledStartTime: 420 (07:00)
- description: Cada dia traz treino de forca, mobilidade ou recuperacao ativa com progressao por semana.
- preFlight:
  - Agua
  - Espaco livre
  - Disposicao para seguir o protocolo do dia
- briefing:

```text
Um corpo funcional não é construído só com treino de força. Força sem mobilidade cria rigidez. Treino sem recuperação cria desgaste. O protocolo integra os três — dias de força, dias de mobilidade e dias de recuperação ativa — porque é a combinação que produz resultado sustentável, não o volume isolado.
```

#### Ação 2.2: 📝 Triangulo do dia

- actionType: Acao Recorrente | repetitions: 1 | duration: 5 min | difficulty: 2
- context: night / low | scheduledDays: SEG TER QUA QUI SEX SAB DOM | scheduledStartTime: 1260 (21:00)
- description: Registre treino feito, qualidade do sono e alimentacao intencional.
- briefing:

```text
Treino, sono e alimentação são um sistema. Otimizar um e ignorar os outros dois limita o resultado dos três. O triângulo diário não é burocracia — é o dado mínimo necessário para entender qual pilar está puxando o sistema para baixo.
```

### Fase 3: Benchmark Pessoal

_Meca sua evolucao real e transforme isso em dado de legado._

#### Ação 3.1: 🏁 Benchmark pessoal

- actionType: Compromisso | repetitions: 1 | duration: 20 min | difficulty: 4
- context: morning / high
- description: Teste flexoes, prancha e 1 exercicio escolhido no inicio e no fim do ciclo.
- preFlight:
  - Cronometro
  - Espaco livre
  - Medicao anotada
- briefing: (vazio)

---

## 🧠 Foco Blindado

- id: `7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a03`
- descrição: Deep Work de alto nivel para construir a capacidade de trabalho concentrado por longos periodos.
- price_gold: 500 | price_brl: 50.0 | price_fragments: 42
- duration_days: 21 | autor: Soberano System | criada: 2026-03-16
- campaignTier: avancado | campaignType: pratica | campaignTheme: produtividade | primaryAssetId: espaco-mental
- tags: espaco-mental, avancado, pratica, produtividade, deep-work, foco

### Fase 1: Fundamento do Foco

_Entenda por que o foco profundo virou recurso raro._

#### Ação 1.1: 📘 Leitura estrutural do foco ⚠️ aula vazia

- actionType: Acao Recorrente | repetitions: 3 | duration: 15 min | difficulty: 2
- context: morning / medium | scheduledDays: SEG | scheduledStartTime: 420 (07:00)
- description: Leia o texto da semana na aba Anotacao e marque quando terminar.
- briefing: (vazio)

### Fase 2: Sessao e Auditoria

_Treine foco progressivo e registre o que tenta invadir sua sessao._

#### Ação 2.1: 🎯 Sessao de Deep Focus no app

- actionType: Acao Recorrente | repetitions: 1 | duration: 90 min | difficulty: 4
- context: morning / high | scheduledDays: SEG TER QUA QUI SEX | scheduledStartTime: 540 (09:00)
- description: S1: 45 min. S2: 60 min. S3: 90 min com revisao de qualidade ao final.
- preFlight:
  - 1 tarefa declarada
  - Ambiente configurado
  - Celular fora do alcance
- briefing: (vazio)

#### Ação 2.2: 📝 Auditoria de interferencia

- actionType: Acao Recorrente | repetitions: 1 | duration: 5 min | difficulty: 2
- context: night / low | scheduledDays: SEG TER QUA QUI SEX | scheduledStartTime: 1260 (21:00)
- description: Registre em 1 linha o que interrompeu ou tentou interromper sua sessao.
- briefing: (vazio)

### Fase 3: Marco de Profundidade

_Conquiste um dia inteiro de trabalho profundo e registre isso como marco._

#### Ação 3.1: 🏁 Dia de trabalho profundo completo

- actionType: Compromisso | repetitions: 1 | duration: 240 min | difficulty: 5
- context: morning / high
- description: Dedique 1 dia do ciclo a 1 unico projeto sem reunioes, mensagens ou redes.
- preFlight:
  - Projeto unico definido
  - Agenda protegida
  - Mensagens silenciadas
- briefing: (vazio)

