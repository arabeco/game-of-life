# Oráculo — fase 4: o dia das cinco pessoas

Estudo de comportamento e plano de melhoria. Escrito com o código na mão: a
parte "como está" é levantamento, não memória.

**Escopo:** só o Oráculo e a interação com o usuário — falas, presença, tom,
háptico, animação, toggles. Nada de vínculos, arenas ou economia.

---

# Parte 1 — O que existe hoje, exatamente

## 1.1 As três presenças

`constants/oraclePresencePolicy.ts` é a única fonte. Três níveis (o valor `1`
não existe, é buraco histórico):

| | Silencioso `0` | Equilibrado `2` | Presente `3` |
|---|---|---|---|
| Card do dia | não | sim | sim |
| Fala de abertura | nunca | 1×/dia | toda abertura |
| Reações | nenhuma | só marcos | todas |

**Marco** = fechar arena, campanha ou marco. **Rotina** = volume de ações,
avanço de meta. A separação existe porque marco é raro e rotina é quase diária.

## 1.2 Os quatro tons

`ORACLE_TONE_LABELS`. Neutro é grátis; os outros três são Premium.

- **Neutro** — equilibrado e direto, sem assinatura
- **Coach** — solta dica, aponta o próximo movimento
- **Reflexivo** — devolve pergunta em vez de elogio
- **Calmo** — sereno, tira peso em vez de cobrar

## 1.3 Os três canos de fala

Isto é o mais importante e o menos óbvio: **são três coisas diferentes**, e cada
uma nasce em lugar diferente.

**1. Card de infos** — nasce no `pg_cron` (a cada 10 min), grava em
`oracle_messages` com `delivery_type: 'feed'`, é o **único que vira push**,
aparece no chat. **1 por dia automático**, e a cota manual é o número de temas
que a pessoa tem ligado.

**2. Falas** (`kind: 'abertura'`) — abertura do app. Escolhida no aparelho por
`buildPlannerCoachSpeech`, gravada via RPC `record_oracle_speech`. Zero egress.

**3. Reações** (`kind: 'reacao'`) — a palavra curta quando você fecha algo.
`pickOracleSpeech(evento, tom, vars)`. Zero egress.

## 1.4 Os bancos escritos

**Aberturas — `COACH_LINES`:** 10 estados × 4 tons × 2 linhas = **80**.

Os 10 estados que ele sabe reconhecer:

`ausente` · `sem_ciclo` · `ciclo_longo` · `sem_entrega` · `arena_atrasada` ·
`arena_parada` · `ciclo_atrasado` · `prioridade` · `ja_entregou` ·
`estrutura_enxuta`

**Reações — `ORACLE_SPEECH_LIBRARY`:** 10 eventos × 4 tons × 3 linhas = **120**.

`campaign_completed` · `arena_completed` · `daily_reps_high/mid/low` ·
`cycle_goal_met/last_one/first/progress` · `milestone_completed`

Mais `ORACLE_GREETINGS` (por período do dia × tom) e `ORACLE_SUGGESTIONS`.

## 1.5 Háptico e animação

`AppSensoryCue` tem **10 pistas**: `task_complete`, `daily_streak`,
`daily_panel_closed`, `arena_complete`, `campaign_complete`, `cycle_seal_start`,
`report_chapter`, `report_verdict`, `report_reward`, `cycle_complete`.

Toggles em Ajustes › Interface & Som: `animationsEnabled`, `hapticsEnabled`,
`soundsEnabled`. Mais `quietHoursStart/End` nas preferências do Oráculo.

---

# Parte 2 — As cinco pessoas

Não são personas de marketing. São cinco jeitos de usar que o app **já
permite**, e cada um expõe um buraco diferente.

---

## Pessoa 1 — "Já sei o que fazer" (alta performance, Silencioso)

**Quem é:** usa o app como registro. Tem 4 arenas, cumpre quase tudo, abre 3–4
vezes por dia por 20 segundos cada. Oráculo no Silencioso não por raiva — por
não precisar.

### O dia dela, hoje

| | |
|---|---|
| 06:40 | Abre. **Nada.** Marca 3 ações. Fecha. |
| 12:10 | Abre. Marca 2. Fecha. |
| 19:30 | Abre. Fecha uma arena — **toast seco, sem balão** (correto). |
| 22:00 | Abre o painel diário. Lê os números. Fecha. |

**Tempo total no app: ~90 segundos.**

### O que está certo

O Silencioso **é honesto**. Não empurra nada, e a missão pedida ainda funciona.
E desde o conserto do toast, ela recebe o **recibo** de fechar arena sem o
elogio. Isso é raro em app: a maioria trata "desligar" como "quebrar".

### O buraco

**Ela nunca descobre o Oráculo.** Se um dia quiser, não há nada que sugira que
ele existe e é bom. O Silencioso é um beco sem saída — entrou, acabou.

E mais grave: **o app não aprende nada com ela.** Ela é a usuária mais
disciplinada da base e o app trata igual a quem abandonou.

---

## Pessoa 2 — "Já sei o que fazer, mas estou mal" (baixa performance, Silencioso)

**Quem é:** mesma configuração da Pessoa 1. Mas está numa fase ruim — 3 semanas
sem fechar nada, ciclo aberto há 40 dias, arenas paradas.

### O dia dela, hoje

| | |
|---|---|
| Terça | Abre. **Nada.** Vê 7 ações não feitas. Fecha em 4 segundos. |
| Quinta | Abre. **Nada.** Mesma tela. Fecha. |
| Domingo | Não abre. |
| +11 dias | Desinstala. |

### O buraco — e é o pior do app

**O Silencioso está calado exatamente quando o silêncio machuca.**

O `COACH_LINES` tem `ausente`, `arena_parada`, `ciclo_atrasado`,
`sem_entrega` — **quatro estados escritos especificamente para ela**, com 8
linhas por estado. **Ela nunca vai ver nenhuma**, porque `openingLine: 'nunca'`.

Ela escolheu "não me encha o saco" numa terça em que estava bem. A escolha valeu
para sempre, inclusive para o dia em que ela precisava de uma frase.

E a tela que ela vê é uma **lista de dívidas**. 7 ações não feitas, sem contexto,
sem hierarquia. O app cobra sem ajudar.

---

## Pessoa 3 — "Quero dica, não babá" (Equilibrado, tom Coach)

**Quem é:** o meio. Quer um empurrão, não um bichinho. Abre 2× por dia.

### O dia dela, hoje

| | |
|---|---|
| 07:15 | Abre. **Fala de abertura** (1×/dia). Card do dia se o cron já passou. |
| 07:16 | Marca 2 ações. Sem reação (rotina é só do Presente). |
| 18:40 | Abre. **Nada** — a fala do dia já saiu de manhã. |
| 18:55 | Fecha uma arena. **Reação** (marco passa no Equilibrado). |

### O que está certo

É o nível mais bem calibrado dos três. Uma fala por dia é sustentável.

### Os buracos

**1. A fala de abertura é sempre de manhã.** Quem abre 07:15 gasta a cota do dia
no pior momento — antes de ter feito qualquer coisa, quando não há o que
comentar. A fala mais útil seria às 18:40, com o dia no meio.

**2. Ela não sabe que a fala tem cota.** Abre à noite, nada acontece, e não há
sinal de "já falei hoje". Parece que quebrou.

**3. O tom Coach promete o que o gatilho não entrega.** "Aponta o próximo
movimento" — mas o estado é escolhido por regra fixa. Se ela está em
`prioridade`, ouve linha de prioridade **todo dia**, com 2 variações. Em uma
semana ela viu as duas 3 vezes cada.

---

## Pessoa 4 — "Duolingo" (Presente, tom Coach, streak 23)

**Quem é:** quer o bichinho. Streak é o que segura. Abre 5–8 vezes por dia.

### O dia dela, hoje

| | |
|---|---|
| 06:50 | Abre. **Fala de abertura.** |
| 07:30 | Abre de novo. **Nada** — `openingSpokenThisSessionRef` bloqueia. |
| 09:00 | Marca ação. Háptico `task_complete`. **Sem fala.** |
| 12:00 | Volta do background → conta como abertura nova → **fala**. |
| 15:00 | Marca a 5ª ação. **Reação `daily_reps_mid`.** |
| 21:40 | Fecha arena. **Reação `arena_completed`.** |

### O que está certo

O Presente **finalmente funciona** — falava só no Planner, 1×/dia, e ainda
passava por um sorteio de 55% que queimava o dia quando perdia.

### Os buracos

**1. Fala por abertura é a métrica errada.** Ela abre 8 vezes; o app tenta falar
8 vezes e é barrado por um teto de 12/dia. A conversa é **regida por quantas
vezes ela abre**, não pelo que ela fez. Abrir 8 vezes sem fazer nada gera 8
falas; fazer 6 ações numa sessão gera 1.

**2. O streak não tem voz.** `daily_streak` existe como háptico. **Nenhuma das
200 linhas menciona o número do streak.** O que mais segura ela é a única coisa
que o Oráculo não comenta.

**3. Nada acontece na véspera de perder.** 23 dias, 22:30, zero ações. É o
momento mais importante do mês e o app está mudo. Duolingo manda push às 21h; o
Glyph nem tem o gatilho.

**4. As reações não escalam.** Fechar a 1ª arena e a 40ª disparam do mesmo
banco de 3 linhas. Nada marca "isto foi diferente".

---

## Pessoa 5 — "Duolingo frágil" (Presente, tom Calmo, streak 2)

**Quem é:** entrou faz 5 dias. Configurou 6 arenas com 30 repetições cada, o que
dá 40 ações por dia. Não vai cumprir.

### O dia dela, hoje

| | |
|---|---|
| Dia 1 | Onboarding, cria tudo. Empolgada. |
| Dia 2 | 40 ações na tela. Faz 6. **Reação `daily_reps_low`.** |
| Dia 3 | Faz 4. Reação `daily_reps_low` **de novo**. |
| Dia 4 | Abre, vê 40 ações, 3 feitas. Fecha. |
| Dia 6 | Não abre mais. |

### O buraco — o mais fácil de consertar de todos

**O erro dela é estrutural e o Oráculo comenta o comportamento.**

O problema não é que ela fez 4 ações. É que ela **configurou 40**. Nenhuma pessoa
faz 40 ações por dia. O app deixou ela montar isso e depois passou três dias
dizendo variações de "você fez pouco".

É exatamente o que você escreveu na mensagem: *"execute as ações ou edite o
número de repetições delas se tiverem altos"*. **O app sabe o número.** Ele
simplesmente nunca olha para ele.

`estrutura_enxuta` existe no `COACH_LINES` — mas é o oposto: fala de quem tem
estrutura de menos. **Não existe `estrutura_inflada`.**

---

# Parte 3 — Os padrões

Cinco dias, cinco pessoas. Quatro problemas atravessam todos.

### A. O Oráculo comenta comportamento, nunca estrutura

Ele diz "você fez pouco". Nunca diz "você pediu demais de si mesmo". A Pessoa 5
morre disso, e as Pessoas 2 e 3 sofrem menos porque a estrutura delas já está OK.

**Todo dado necessário já está no app.** Repetições, número de arenas, duração do
ciclo. É leitura, não modelo.

### B. A conversa é regida por abertura, não por evento

Abrir o app não é conquista. Falar por abertura significa: quem abre muito ouve
muito, quem faz muito ouve pouco. Está invertido.

### C. Não há memória entre dias

Cada fala nasce do estado de agora. Ele nunca diz "terceiro dia seguido" ou
"você não fechava nada desde terça". **Sem memória não existe amizade** — é o
que separa um amigo de um cartaz.

E é o que dá barato de verdade: reconhecimento de percurso, não elogio de evento.

### D. O silêncio é absoluto e permanente

Silencioso não tem exceção. Nem para "sumiu há 3 semanas", nem para "vai perder
o streak de 23 dias hoje". A pessoa desligou o comentário, não o alarme de
incêndio.

---

# Parte 4 — As melhorias

Ordenadas por (impacto ÷ esforço). Todas com **zero egress**: bancos escritos,
escolha no aparelho.

---

## M1. `estrutura_inflada` — o Oráculo olha o que você montou

**Para:** Pessoa 5 (salva), Pessoa 3 (ajuda).

Novo estado em `COACH_LINES`, com **prioridade alta** — antes de qualquer fala
sobre volume. Dispara quando a soma de repetições diárias passa um teto
plausível (~12 ações/dia) **ou** quando 3+ dias seguidos fecham abaixo de 30%
com estrutura acima do teto.

A fala **não elogia nem cobra**: oferece o botão de editar repetições.

> **Coach:** "São 40 ações por dia aí. Ninguém faz 40. Corta pela metade e você
> passa a fechar o dia."
>
> **Calmo:** "Você montou um dia grande demais. Não é você que está devendo — é
> o número. Dá para baixar agora."

Com `quickAction` levando direto ao editor de repetições.

**Esforço:** 4 linhas × 4 tons = 16 linhas + um cálculo que já existe.
**Impacto:** é a diferença entre a Pessoa 5 ficar ou sumir no dia 6.

---

## M2. A fala segue o evento, não a abertura

**Para:** Pessoas 3 e 4.

Hoje: abriu → talvez fale. Proposta: **fala quando algo mudou desde a última
fala.** Fechou ações, fechou arena, virou o dia, entrou num estado novo.

Abrir 8 vezes sem fazer nada = **1 fala** (a primeira). Fazer 6 ações numa
sessão = fala, porque mudou.

Consequência boa para a Pessoa 3: a fala diária dela deixa de ser gasta às 07:15
no vazio e passa a sair quando há o que dizer.

**Esforço:** trocar `openingSpokenThisSessionRef` por uma assinatura de estado.
Sem banco novo.
**Impacto:** conserta a inversão da Parte 3-B.

---

## M3. O streak ganha voz — e véspera

**Para:** Pessoa 4 (é o vício dela), Pessoa 5 (constrói o dela).

Três coisas:

1. **Variáveis de streak nas falas.** `{streak}` disponível no `fillCoachLine`.
   "Décimo terceiro dia" vale mais que "bom trabalho".
2. **Estado `streak_em_risco`.** Depois de um horário, com streak ≥ 3 e zero
   ações hoje. É o único gatilho novo que **merece push** — e é o momento mais
   valioso do dia inteiro.
3. **Marcos de streak.** 7, 14, 30, 60, 100 têm linha própria. Diferente do dia
   comum, senão o número não significa nada.

> **Neutro:** "23 dias. Faltam duas horas e nenhuma ação hoje."
>
> **Calmo:** "Seu 23 está de pé até meia-noite. Uma ação segura ele."

**Esforço:** 1 estado + 5 marcos, × 4 tons. ~24 linhas.
**Impacto:** é o loop do Duolingo, e o app já tem o dado.

---

## M4. Memória curta

**Para:** todos. É o que faz parecer amigo.

Guardar as últimas ~5 falas (estado + dia) e usar para:

- **Não repetir.** Mesmo estado 2 dias seguidos → variação diferente,
  obrigatoriamente. Hoje são 2 por estado/tom, então **subir para 4** (M4b).
- **Reconhecer sequência.** 3º dia seguido no mesmo estado muda o texto:
  "terceiro dia com a arena parada" em vez da mesma frase de novo.
- **Reconhecer virada.** Saiu de `arena_parada` para `ja_entregou` → linha de
  virada. É o momento mais dopamínico que existe e hoje passa em branco.

> "Três dias parado, e hoje você fechou duas. Isso é virada."

**Esforço:** M4 é lógica + `localStorage`. M4b são +160 linhas de escrita.
**Impacto:** é a diferença entre cartaz e amigo (Parte 3-C).

---

## M5. Silencioso ganha duas exceções — e só duas

**Para:** Pessoa 2 (pode salvar), Pessoa 1 (dá saída).

O Silencioso continua sem card, sem abertura, sem reação. **Duas exceções:**

1. **Volta depois de sumir** (7+ dias). Uma frase, sem cobrança, sem culpa.
2. **Streak em risco**, se ela tiver um streak ativo ≥ 7.

As duas com um **"não me avise disso"** na própria fala. Se ela recusar, nunca
mais.

> "Faz duas semanas. Sem cobrança — quer retomar de onde parou ou começar
> limpo?" · *[Retomar] [Começar limpo] [Não me avise disso]*

E para a Pessoa 1, uma linha só, **uma vez na vida**, depois de 30 dias de uso
consistente no Silencioso: que o Oráculo existe e como é. Recusou, acabou.

**Isto é o item mais delicado do documento.** Pode virar exatamente a enchação
de saco que ela desligou. Por isso: duas exceções, opt-out na própria fala,
nunca mais.

**Se você achar que fere o pacto, corta o M5 inteiro** — os outros quatro não
dependem dele.

---

## M6. Háptico com gramática

**Para:** todos. É o barato físico.

Hoje 10 pistas disparam com peso parecido. Proposta: **três pesos**, e a
diferença tem que ser sentida no pulso.

| Peso | Quando | Sensação |
|---|---|---|
| **Toque** | ação marcada | leve, seco, quase nada |
| **Fecho** | arena, meta do dia | duplo curto |
| **Marco** | campanha, ciclo, marco de streak | longo com cauda |

Regra: **a mesma coisa sempre vibra igual, coisas diferentes nunca vibram
igual.** Hoje fechar ação e fechar arena são parecidas demais — o corpo não
aprende a diferença, e é justamente o corpo que gera antecipação.

E **um háptico exclusivo do marco de streak**, que só existe em 7/14/30/60/100.
Raro por definição, e por isso reconhecível.

**Esforço:** re-mapear os 10 cues. Sem banco novo.

---

## M7. Toggles honestos

Hoje: `animationsEnabled`, `hapticsEnabled`, `soundsEnabled` — três interruptores
ligados/desligados. Falta o meio: quem quer háptico de marco mas não de cada
ação não tem opção; desliga tudo.

Proposta mínima: háptico com **três posições** — Tudo · Só marcos · Nada.
Espelha a presença do Oráculo, que já tem exatamente essa forma. Duas coisas
com a mesma forma são uma coisa a menos para aprender.

---

# Parte 5 — Ordem

| # | Melhoria | Esforço | Quem salva |
|---|---|---|---|
| 1 | **M1** estrutura inflada | baixo | Pessoa 5 |
| 2 | **M3** streak com voz e véspera | baixo | Pessoa 4 |
| 3 | **M2** fala por evento | médio | Pessoas 3 e 4 |
| 4 | **M6** gramática do háptico | baixo | todos |
| 5 | **M4** memória curta | médio | todos |
| 6 | **M4b** 4 variações por estado | alto (escrita) | todos |
| 7 | **M7** háptico em três posições | baixo | Pessoas 1 e 3 |
| 8 | **M5** exceções do Silencioso | médio | Pessoa 2 |

**M1 e M3 primeiro** porque são os dois de maior retorno por linha escrita, e
não dependem de nada.

**M5 por último** de propósito — é o único que pode piorar o app se estiver
errado, e quero ele depois de você ter visto os outros funcionando.

---

# Parte 6 — O que eu NÃO faria

Registrado para não voltar como boa ideia daqui a um mês.

**Notificação diária de engajamento.** "Sentimos sua falta!" é o que faz
desinstalar. O push só se justifica quando há algo em risco de verdade — e por
isso o M3 tem exatamente um gatilho de push.

**Personagem com nome, rosto e humor.** Duolingo aguenta porque é idioma e o
público é outro. Aqui a pessoa registra o que ela quer virar. Um mascote fazendo
piada quando ela falhou três dias é humilhante, não divertido.

**Elogio inflacionado.** "Incrível! Fantástico!" em ação comum destrói o valor do
elogio de marco. O banco atual acerta nisso e não pode regredir.

**Chamar modelo para gerar fala.** O custo cresce com cadastros, não com receita.
As 200 linhas escritas com memória e variação passam de "aleatório" — e são
grátis para sempre.

---

# Anexo — O inventário de hoje

| | |
|---|---|
| Presenças | 3 (`0`, `2`, `3`) |
| Tons | 4 (1 grátis, 3 Premium) |
| Estados de abertura | 10 |
| Linhas de abertura | 80 (10 × 4 × 2) |
| Eventos de reação | 10 |
| Linhas de reação | 120 (10 × 4 × 3) |
| Pistas hápticas | 10 |
| Toggles | 3 (animação, háptico, som) + horário de silêncio |
| Card automático | 1/dia |
| Cota de cards | = temas ligados (mín. 1, máx. 5) |
| Teto de segurança | 12 falas/dia (servidor) |
| Egress por fala | **zero** |
