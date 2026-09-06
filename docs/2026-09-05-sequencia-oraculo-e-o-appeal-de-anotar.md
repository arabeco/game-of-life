# Sequência, Oráculo e o appeal de anotar

Discussão de 05/09/2026, entre o Afonso e a IA. **Nada foi decidido.** Este
arquivo existe para que a próxima IA não recomece do zero nem proponha o que já
foi descartado — e para que ela responda a prova no fim.

Documento irmão: [`2026-09-02-sequencia-e-resgate-diario.md`](./2026-09-02-sequencia-e-resgate-diario.md),
que guarda o estado do código e as bifurcações. Este aqui guarda **o porquê**.

---

## 1. A pergunta que engoliu todas as outras

> *"Ai caímos numa discussão MUITO IMPORTANTE: o motivo da pessoa querer usar o
> app?! Anotar que foi no trabalho?! Dar check num item?"* — Afonso

Essa é a frustração central, e ela não é sobre sequência. É sobre o **custo do
registro**. Anotar é um preço pago **agora**; o valor chega **depois**. Todo app
de registro vive ou morre nessa defasagem, e o Glyph ainda não tem uma resposta
escrita para ela.

Nenhuma decisão sobre sequência, resgate diário ou fala do Oráculo deve ser
tomada antes desta pergunta ter resposta, porque **todas elas são tentativas de
pagar essa defasagem** — e pagar mal.

### Os três pontos de valor, segundo o dono do produto

1. **Ver todas as suas arenas juntas, quase fisicamente.**
2. **Acompanhar metas e dados.**
3. **Se achar** — dopamina, perfil, quests.

A leitura que a discussão produziu, e que precisa ser confirmada ou derrubada:

- **1 e 2 são o valor.** É o que a pessoa vem buscar.
- **3 é o motor.** Existe para que 1 e 2 aconteçam. Não é o produto.

E daí sai a coisa mais importante do documento:

> **O que 1 e 2 precisam da pessoa não é dia cheio. É registro verdadeiro.**
>
> Um quadro que mente não vale nada. Um dado com buraco não vale nada. Mas um
> quadro que diz *"essa semana treinei três vezes e descansei quatro"* vale tudo
> — é exatamente a informação que a pessoa entrou para ver.
>
> **Dia vazio honesto não estraga o valor. Dia mentido estraga.**

### O argumento contra pagar por ação concluída

> Uma sequência que paga por ação concluída **compra poluição do único ativo que
> o app vende**. É a camada 3 corrompendo as camadas 1 e 2.

Não é risco teórico. O caminho barato de farmar não é inventar ação: é **arrastar
uma ação que já existe para o planner e segurar para completar** — três segundos.
E essa conclusão falsa entra no relatório, na nota do ciclo e no progresso da
arena. O farm não vaza para a economia; vaza para o **produto**.

---

## 2. Por que o Duolingo para de servir de modelo aqui

A pesquisa está em [`2026-09-04-handoff-verificacao-modais-e-perfil.md`](./2026-09-04-handoff-verificacao-modais-e-perfil.md)
(insígnia como coleção, consistência sem caixa forçada, celebração proporcional ao
marco). Aquelas três continuam válidas — são sobre **hierarquia visual**.

O que **não** transfere é a unidade diária:

| | Duolingo | Glyph |
|---|---|---|
| Quem fabrica o dia mínimo | o próprio app: uma lição de 1 minuto | a pessoa: a ação vem da vida dela |
| Onde a prova acontece | dentro do produto, verificável | fora do produto, **inverificável** |
| Não abrir o app é | falha, por definição | possivelmente a coisa certa |
| Diário é correto? | **sim** — 5 min/dia é a pedagogia certa para idioma | **às vezes não** |

O caso que prova: **uma arena só, de treino, 3x por semana.** Quem descansa 4 dias
tem um programa *correto*. Uma sequência diária pune periodização certa. Copiar a
unidade diária importa uma afirmação sobre a vida da pessoa que o app não tem
autoridade para fazer.

E "por semana" tem custo escondido: **o app não tem semana.** As unidades são *dia
operacional*, *rodada* (aberta, fechada na mão) e *ciclo* (duração escolhida). Uma
sequência semanal seria a quarta unidade e a primeira semana que o app já teve.

---

## 3. O estado real da sequência no código

A descoberta que mais deve pesar em qualquer decisão:

> **A sequência é invisível, não paga quase nada, e a única vez que ela aparece é
> quando o Oráculo avisa que você vai perdê-la.**
>
> Culpa pura, sem prêmio e sem tela.

### Onde ela vive

| peça | arquivo · linha | o que faz |
|---|---|---|
| tipo `DailyProofStreak` | `types.ts:611` | current, best, totalProofDays, lastProof* |
| campo no perfil | `types.ts:536` · `user_profiles.daily_proof_streak` (jsonb) | persistência |
| `normalizeDailyProofStreak` | `contexts/GameContext.tsx:291` | saneamento |
| `advanceDailyProofStreak` | `contexts/GameContext.tsx:318` | **a regra**: mesmo dia mantém, dia anterior +1, senão volta a 1 |
| `rollbackDailyProofStreakDate` | `contexts/GameContext.tsx:368` | desfaz quando a última tarefa do dia é desmarcada |
| o gatilho | `contexts/GameContext.tsx:12284-12323` | **uma tarefa concluída** ligada a uma ação real, no dia operacional |
| roda onde | **no cliente** | quem não abre o app não avança nem quebra |

### O que ela paga

| peça | arquivo · linha | valor |
|---|---|---|
| `system-five-day-proof-streak` | `constants/systemChallenges.ts:39` | **300 EXP + 2 de ouro**, uma vez, aos 5 dias |
| checagem do desafio | `contexts/GameContext.tsx:12558` | `streak.current >= 5` |
| marcos 7/14/30/60/100 | `utils/oracleCandidates.ts:421` | **nada** — só fala |

A `description` do próprio desafio anuncia só "2 de ouro" e **omite os 300 EXP** — o
texto do código mente sobre o próprio prêmio. Vale varrer as outras.

E o `system-twenty-actions` (`constants/systemChallenges.ts:58`) paga **exatamente o
mesmo** sem exigir dias consecutivos: já existe um desafio que faz o mesmo trabalho
sem punir descanso.

**E existe uma sequência que já perdoa descanso:** `utils/arenaPacts.ts:196`, o pacto
de constância — *"Conclua ao menos uma ação em N dias diferentes. Não precisam ser
seguidos."* Ele é voluntário, conta dias distintos (`arenaPacts.ts:358`) e paga
2/5/10 de ouro + 100/300/500 EXP (`arenaPacts.ts:64`). O app já tem a versão boa da
mecânica; a global é a versão ruim da mesma coisa.

### Onde ela aparece na tela

Praticamente em lugar nenhum. Não há tela que mostre "você tem N dias".

| peça | arquivo · linha |
|---|---|
| contexto do Oráculo | `components/AuthenticatedApp.tsx:857, 871, 899` |
| contexto do chat | `components/OracleChat.tsx:288` |
| **a única opção visível ao usuário** | `components/OracleSettingsModal.tsx:465` — *"Avisar antes de perder a sequência"* |
| aba **ontem** / **hoje** | `components/RestScreen.tsx:212` — existe, mas **não mostra a sequência** |

`ChecklistModal` e `LegacyCycleCard` usam a palavra "sequência" para outras coisas
(sequências manuais de checklist, métrica de ciclo). **Não confundir.**

### A fala do Oráculo — onde a culpa é emitida

| peça | arquivo · linha | nota |
|---|---|---|
| candidatos `streak_marco` e `streak_em_risco` | `utils/oracleCandidates.ts:41-58, 99-107` | os dois eixos |
| `STREAK_MARCOS = [7, 14, 30, 60, 100]` | `utils/oracleCandidates.ts:421` | detectados, sem consequência |
| `STREAK_MINIMO_PARA_AVISO = 3` | `utils/oracleCandidates.ts:404` | piso: perder um streak de 2 não dói |
| aviso de risco na conclusão | `contexts/GameContext.tsx:12297` | *"A sequência ficou em risco…"* |
| `emitOracleSpeech` | `utils/oracleSpeech.ts:38` | o canal |
| política de presença | `constants/oraclePresencePolicy.ts` | níveis 0–N: quanto o Oráculo fala |

Vale ler o comentário em `utils/oracleCandidates.ts:107`, porque ele já justifica
a prioridade da fala de risco: *a sequência é a única coisa no app que morre
sozinha se ninguém disser nada.* Esse raciocínio é bom **e** é exatamente o que
transforma a sequência num mecanismo de perda.

### O ciclo do dia, que já funciona

| peça | arquivo · linha | nota |
|---|---|---|
| fecho do dia | `closeDailyCommitment` · `contexts/GameContext.tsx:7953` | roda com `{ silent: true }` |
| virada normal | `checkDailyRollover` → `contexts/GameContext.tsx:8225` | **também silencioso** |
| dias atrasados | `repairOpenCommitments` · `contexts/GameContext.tsx:8136` | fecha **todos**, até 21, um a um |
| depósito de EXP | `contexts/GameContext.tsx:8018-8031` | dia **deposita**; quem **paga** é o fecho da rodada ou do ciclo |

Consequência: **os dias que a pessoa não viu já foram pagos.** `silent` suprime o
toast e o efeito sensorial, não o depósito. Qualquer regra do tipo "só o último dia
paga" seria regressão, não proteção.

### O que já foi enterrado — não ressuscitar

- **`DailyCompletionPromptModal`** + `utils/dailyCompletionPrompt.ts` + o evento +
  o estado pendente + a ponte para o sitrep + o dispatch `glyph:daily-panel-opened`
  + a chave `glyph:daily-summary-seen` no localStorage. Removidos em 05/09/2026.
  Era o resto de um **widget de planejamento por dia** que saiu do painel diário
  porque planejar o dia misturando a baia inteira com a baia do dia confundia. O
  widget saiu; o encanamento ficou disparando só em reconciliação.
  `tests/reward-modal-priority.regression.mjs` guarda a cova com três
  `assert.doesNotMatch`.
- **`kind: 'task'`** — ramo órfão do mesmo widget.
- **Fragmento escalando com a sequência** e **congelamento comprável** — propostos
  no plano de 02/09 e nunca aprovados. Escalar o pagamento põe preço na perda, o
  que amplifica a aversão que briga com a voz do app.

---

## 4. As saídas que sobraram vivas

Nenhuma decidida.

### A. A régua conta continuidade do registro, não volume de trabalho

`daily_commitments` já guarda `taskIds`, então o app já distingue **dia vazio** de
**dia falhado**:

| domingo | segunda | segunda |
|---|---|---|
| 0 planejadas, 0 feitas | 5 planejadas, 0 feitas | 5 planejadas, 2 feitas |
| não prometeu, não falhou | prometeu e sumiu | *(em aberto)* |

O planner vazio já é a declaração de descanso — sem botão, item ou compra. O
congelamento some como objeto e continua existindo como função.

**Buraco conhecido:** quem abandona tem 30 dias vazios e mantém 30 de sequência.
Precisa de teto em dias vazios consecutivos, e esse número é escolha, não
derivação. E **não pode ser "fim de semana não conta"** — tem gente que descansa
quarta.

### B. Segurar ≠ ganhar

Dia vazio segura o número e não paga. Dia com ação paga fragmento **fixo**. A
escalada mora só nos marcos que o Oráculo já detecta.

### C. Uma campainha e uma casa

Hoje o app **não anuncia fecho de dia nenhum**, então não há bagunça para unificar
— é escolher a primeira voz. Proposta: o modal abre sozinho uma vez, na primeira
abertura do dia, se houver dia julgado ainda não visto; depois mora na aba
**ontem** para sempre. Falta decidir se a campainha marca `collected_at` (recibo de
coleta) ou `seen_at` (só aviso).

### D. Não construir

A hipótese que ficou em pé no fim da conversa, e que **precisa ser derrubada com
argumento, não ignorada**:

> Uma sequência que perdoa descanso honesto é um motor de dopamina fraco. A do
> Duolingo funciona *porque* é dura. Se 1 e 2 são o valor, o que traz a pessoa de
> volta é **o quadro valer a pena ser olhado** — isso é atração, não empurrão. E a
> camada 3 já tem quests, perfil, patente, baú, temporada e insígnia.
>
> A sequência pode ser a quarta alavanca de culpa num app cuja tese é não ter
> culpa. Talvez o dinheiro esteja em fazer o quadro ficar bom, não em criar uma
> razão nova para abrir o app.

---

## 5. Prova para a próxima IA

Cinco perguntas, **2 pontos cada, 10 no total**. A nota não é por concordar comigo
— é por **quanto a resposta ajudou ou trouxe algo útil à tona**.

**Rubrica por questão:**

| pontos | critério |
|---:|---|
| 0 | repetiu o documento, respondeu no vazio, ou inventou código que não existe |
| 1 | resposta correta e ancorada em arquivo/linha reais, mas sem trazer nada novo |
| 2 | trouxe à tona algo que o documento não sabia — um caminho no código, um caso de uso quebrado, uma consequência não vista — **e** provou onde |

**Regras:** citar `arquivo:linha` sempre que afirmar algo sobre o código; dizer "não
achei" em vez de supor; e quando discordar, discordar com evidência.

---

### Q1 — O appeal de anotar

O app pede que a pessoa registre. Registrar custa **agora**; o valor chega
**depois**. Percorra o código e responda: **o que existe hoje que faz o ato de
registrar valer a pena no instante em que se registra**, e não vinte minutos
depois? Cite os caminhos. Se a resposta for "nada", diga isso e proponha **a menor
coisa possível** que mudaria isso — sem mecânica nova, usando o que já existe.

### Q2 — Uma sequência que só fala para punir

Hoje a sequência é invisível na UI, paga 2 de ouro uma única vez
(`constants/systemChallenges.ts:39`) e sua única manifestação é o Oráculo avisando
que ela vai morrer (`utils/oracleCandidates.ts:99-107`,
`contexts/GameContext.tsx:12297`). Diante disso, o conserto honesto é **torná-la
visível**, **fazê-la pagar** ou **apagá-la**? Escolha **uma** e defenda com o
código, incluindo o que teria de sair.

### Q3 — Três pessoas, trinta dias: quem ganha, quem perde, e é justo?

Monte **três pessoas** que difiram nos **dois** eixos ao mesmo tempo:

- **ritmo de vida** — quando e com que regularidade elas de fato fazem as coisas
  (ex.: quem trabalha em turno e treina 3x/semana; quem faz muito de segunda a
  sexta e some no fim de semana; quem faz pouco mas todo dia);
- **adesão ao app** — com que frequência elas *abrem e registram*, que é outra
  coisa: tem quem faça muito e anote pouco, e quem faça pouco e anote tudo.

As três precisam ser plausíveis e realmente diferentes nos dois eixos. Pelo menos
uma tem de **fazer mais e registrar menos** que outra.

Rode **30 dias** para cada uma, com o código de hoje, e responda:

1. **O que cada uma recebe.** EXP e para onde ela vai (rodada ou ciclo), ouro,
   fragmentos, baú, avanço de patente, quests de temporada, sequência, e o que o
   Oráculo fala em cada momento. Cite `arquivo:linha` de onde cada valor sai.
2. **Quem ganha e quem perde**, com os números lado a lado numa tabela.
3. **É justo?** E, principalmente: **o app está premiando a vida da pessoa ou o
   hábito de usar o app?** Se as duas coisas divergirem em alguma das três, é aí
   que está a resposta — mostre o ponto exato do código onde a divergência nasce.

Se você concluir que uma das três é punida por um comportamento **correto** (uma
periodização de treino, um domingo de folga, um turno que vira a noite), diga isso
com todas as letras e aponte a linha responsável.

### Q4 — A camada 3 corrompe as camadas 1 e 2?

A tese: pagar por conclusão auto-relatada compra poluição do relatório, da nota do
ciclo e do progresso da arena — o próprio ativo que o app vende. **Encontre no
código todos os lugares onde uma recompensa é paga por algo que a pessoa declara
sozinha**, e diga, um por um, se o incentivo é real ou se algo já o contém. Se a
tese estiver errada, mostre o que a contém.

### Q5 — Se não for a sequência, o que é?

Assumindo que 1 e 2 são o valor e que eles funcionam por **atração**, não por
empurrão: qual **uma única mudança** faria o quadro mais valer a pena ser aberto
amanhã de manhã? Sem mecânica nova, sem objeto novo, usando o que já está no
código. Justifique por que essa e não outra, e diga o que ela custa.

---

### Gabarito — a preencher

| # | pontos | o que a resposta trouxe |
|---:|---:|---|
| Q1 | **2** | Achou que `remaining` **já é calculado** em `taskDomain.ts:481` e não é mostrado onde se registra. Não é falta de mecânica: é informação existente escondida. |
| Q2 | **2** | Corrigiu o erro dos 300 EXP com prova. Escolheu apagar, com o argumento certo — `GameContext.tsx:337` nunca consulta se havia descanso planejado — e propôs preservar o histórico para reconhecer retomada. |
| Q3 | **2** | Simulou de verdade. Ana faz 4,8× mais que Clara e termina com 20% menos EXP; a causa está em `GameContext.tsx:12282`. Complemento da revisão: a EXP retroativa **é** reconciliada (`GameContext.tsx:4832`), a sequência não — a assimetria é inconsistência, não decisão. |
| Q4 | **2** | Mapeou seis caminhos e achou contenções que a revisão não conhecia (ações Livre fora da pontuação, teto de ouro do ciclo). Recusou a conclusão fácil: o código mostra oportunidade de distorção, não prova mentira. A tese original estava forte demais. |
| Q5 | **1** | Correto e ancorado, mas é a mesma resposta da Q1. Q1 é o instante do registro (serve o **delta**); Q5 é abrir o app amanhã sem ter feito nada (serve o **estado**). Uma mudança pode servir os dois momentos, mas isso precisa ser desenhado, não assumido. |
| **total** | **9/10** | |
