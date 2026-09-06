# Briefing de implementação — o pacto e o progresso visível

Para a IA que vai implementar. Leia inteiro antes de abrir um arquivo.

Este documento **substitui** o plano de 5 fases como ordem de trabalho. O plano
([`2026-09-05-plano-oraculo-missoes-presenca-e-progresso.md`](./2026-09-05-plano-oraculo-missoes-presenca-e-progresso.md))
continua valendo como **inventário e catálogo de riscos** — a seção 5 dele, das
contradições, é excelente e verificada. O que muda é o tamanho e a ordem.

---

## 1. A ideia, em um parágrafo

O Glyph tinha uma sequência diária **imposta a todo mundo**: registre uma ação
todo dia ou perca o número. Isso pune quem treina 3x por semana, quem descansa
domingo e quem registra em lote — e o app não tem autoridade para exigir ritmo
diário, porque a ação acontece fora dele.

**A sequência passa a pertencer ao compromisso que a pessoa aceitou, não ao app.**
Quem quer ritmo diário aceita um compromisso de dias seguidos e é cobrado disso.
Quem não aceitou nada não é cobrado de nada, e continua tendo produto: o quadro,
as metas e os dados. Se não houver compromisso ativo, a pessoa pode criar um.

---

## 2. O nome: chama-se **pacto**. Não invente outro.

O Afonso hesitou entre "desafio", "missão" e "missão individual". As três palavras
**já estão ocupadas** no app:

| palavra | o que já significa hoje | evidência |
|---|---|---|
| **Desafio** | duelo contra um rival — *"DESAFIO VENCIDO … você venceu X contra @fulano"* | `components/AchievementModal.tsx:52-61` |
| **Desafio** | também os `SYSTEM_CHALLENGES` (Cinco dias em movimento, Conclua 20 ações) | `constants/systemChallenges.ts` |
| **Missão** | missões e quests de temporada; e *"Sair da Missão"* em arena especial | `components/ArenaDetailModal.tsx:254, 339` |
| **Pacto** | **exatamente isto**: compromisso voluntário, de uma arena, aceito pela pessoa | `utils/arenaPacts.ts`, `components/ArenaPactBalloon.tsx` |

Chamar o novo de "desafio" faria quem termina um compromisso solo ver a mesma
palavra que quem ganha um duelo. **Pacto já existe, já está na UI, já significa
isto, e combina com a voz do app** — é uma promessa que a pessoa faz a si mesma,
não uma tarefa que o app manda. Use pacto em código e em tela.

---

## 3. Situe-se: o sistema já existe. Não construa outro.

Isto é o erro mais caro que você pode cometer aqui. **Não crie tabela nova, não
crie `AcceptedMission`, não crie uma segunda família de compromissos.**

### O que já está pronto em `utils/arenaPacts.ts`

| peça | linha | o que é |
|---|---|---|
| `ArenaPactKind` | `:20` | `'constancia' \| 'conclusao' \| 'retomada'` |
| `ArenaPactDifficulty` | `:21` | `'leve' \| 'media' \| 'alta'` |
| `ArenaPact` | `:29` | id, kind, difficulty, arena, título, descrição, `goal`, `reward`, `startedOn` |
| `ARENA_PACT_REWARDS` | `:64` | leve 2🪙+100xp · média 5🪙+300xp · alta 10🪙+500xp+baú Raro |
| `CONSTANCIA_DAYS` | `:71` | 3 / 5 / 7 **dias diferentes** |
| `buildPactCandidatesForArena` | `:317` | monta as opções oferecíveis |
| `measurePactProgress` | `:329` | mede o progresso — e em `:358` conta **dias distintos**, com o comentário *"Cinco ações num dia só continuam sendo um dia"* |
| `ArenaPactState` / `ArenaPactWrite` | `:370` / `:385` | persistência |
| `rebuildActivePact` | `:421` | reconstrói o pacto ativo a partir do perfil |

**A persistência são cinco colunas no perfil**, não uma tabela: `arenaPactArenaId`,
`arenaPactKind`, `arenaPactDifficulty`, `arenaPactGoal`, `arenaPactStartedOn`. Um
pacto ativo por vez. Aceite pelo Oráculo em `components/OracleChat.tsx:845`.

E o mais importante: **o pacto de constância já é a sequência que perdoa
descanso.** O texto dele, em `utils/arenaPacts.ts:196`, diz literalmente:

> *"Conclua ao menos uma ação de {arena} em N dias diferentes. **Não precisam ser
> seguidos.**"*

Voluntário, por arena, dias distintos, já pago. O app já tem a versão boa da
mecânica. A sequência global é a versão ruim da mesma coisa.

### A régua de EXP, que tem dono

Leia o comentário em `utils/arenaPacts.ts:53-62` antes de encostar em recompensa.
Os valores 100/300/500 são **deliberadamente iguais** aos de
`constants/systemChallenges.ts`. A tabela nasceu 300/750/1500 e foi corrigida
porque criava *"duas réguas diferentes para a mesma moeda"*. Não desfaça isso.

### Onde a sequência global vive (o que sai)

| peça | arquivo · linha |
|---|---|
| `advanceDailyProofStreak` — exige datas consecutivas, **nunca consulta descanso planejado** | `contexts/GameContext.tsx:318`, regra em `:337` |
| `rollbackDailyProofStreakDate` | `contexts/GameContext.tsx:368` |
| o gatilho, que **descarta registro retrospectivo** | `contexts/GameContext.tsx:12280-12282` |
| a fala *"A sequência ficou em risco"* | `contexts/GameContext.tsx:12297` |
| candidatos `streak_marco` / `streak_em_risco` | `utils/oracleCandidates.ts:41-58, 99-107` |
| `STREAK_MARCOS` e `STREAK_MINIMO_PARA_AVISO` | `utils/oracleCandidates.ts:421`, `:404` |
| `system-five-day-proof-streak` — **300 EXP + 2 ouro** | `constants/systemChallenges.ts:39` |
| validação do desafio | `contexts/GameContext.tsx:12558` |
| opção *"Avisar antes de perder a sequência"* | `components/OracleSettingsModal.tsx:465` |
| o tipo e o campo | `types.ts:611`, `types.ts:536` |

### O progresso, que já é calculado e não é mostrado

| peça | arquivo · linha |
|---|---|
| saldo restante da meta (`remaining`) | `contexts/gameDomains/taskDomain.ts:481` |
| progresso da arena e a barra | `components/ArenaCard.tsx:392` |
| efeito sensorial e fala na conclusão | `contexts/gameDomains/taskDomain.ts:820-826` |

### Coisas que enganam

- **A EXP retroativa já é reconciliada** — `reconcileJudgedDayTaskMutation`
  (`contexts/GameContext.tsx:4832`), ligada em `contexts/gameDomains/taskDomain.ts:214`.
  Quem registra atrasado **recebe** a EXP. A sequência é que não reconhece. Não
  "conserte" a EXP: ela já está certa.
- **Dia fechado é silencioso em todos os caminhos** — `closeDailyCommitment`
  (`:7953`), virada normal (`:8225`) e dias atrasados (`:8136`) rodam com
  `{ silent: true }`. `silent` esconde o toast, **não** o depósito.
- **`ChecklistModal` e `LegacyCycleCard` usam a palavra "sequência"** para outra
  coisa (sequências manuais de checklist, métrica de ciclo). Não confunda.
- **A `description` do desafio de cinco dias mente**: anuncia *"Recompensa: 2 de
  ouro"* e o objeto paga `{ xp: 300 }` + 2 ouro. Provavelmente não é a única.

---

## 4. Regras duras

**Não faça:**

1. Não crie tabela nova, `AcceptedMission`, nem uma segunda família de
   compromissos. Evolua `ArenaPact`.
2. Não toque em cálculo, escala, depósito ou reconciliação de **EXP**. Não
   redesenhe a nota do ciclo (`utils/fairScoreUtils.js`).
3. Não mexa nos modais de recompensa — `RewardPackBody`, `RewardPackModal`,
   `AchievementModal`, `constants/rewardPlateStyles.ts`. Estão prontos e são de
   outra frente.
4. Não ressuscite `DailyCompletionPromptModal`, `utils/dailyCompletionPrompt.ts`,
   o evento `glyph:daily-panel-opened` nem `kind: 'task'`. Foram enterrados em
   05/09 e `tests/reward-modal-priority.regression.mjs` guarda a cova.
5. Não crie moeda diária, congelamento comprável, modal de coleta obrigatória,
   nem "semana" — o app tem **dia operacional, rodada e ciclo**, e só.
6. Não tire recompensa já ganha de ninguém.
7. Não faça `git commit`, `git push` nem gere AAB. O Afonso decide isso.
8. Não rode SQL. Entregue o bloco pronto para ele colar.

**Faça:**

- Localize por **símbolo**, não por número de linha: este checkout tem muita coisa
  em andamento e as linhas andam.
- `npx tsc --noEmit` limpo, e rode as suítes: `test:arena-pacts`,
  `test:oracle-reaction`, `test:oracle-arbiter`, `test:core-loop`,
  `test:mission-reward`, `node tests/reward-modal-priority.regression.mjs`.
- Diga "não achei" em vez de supor. Cite `arquivo:símbolo` para cada afirmação.

---

## 5. A ordem do trabalho

Faça **um passo por vez** e pare para mostrar. Não junte.

### Passo 1 — o bug do card (independente, pequeno, verificado)

A elegibilidade do card automático tem **duas respostas no mesmo app**:

- `supabase/functions/web-push/index.ts:830` → `presenceLevel <= 0` reprova → **Equilibrado passa**
- `contexts/GameContext.tsx:710` → `presenceLevel < 3` reprova → **Equilibrado é bloqueado**

Quem está no Equilibrado recebe o card por push e nunca pelo caminho local. O
comentário no web-push já descreve o conserto: um lado foi arrumado e o cliente
ficou para trás. Faça a mesma decisão valer nos dois.

### Passo 2 — o progresso visível

Nenhuma mecânica nova; é expor o que já é calculado.

- **No card da arena**, acima da barra: `5/7 sessões`. Use a unidade que aquela
  arena realmente mede. **Não some minutos com repetições**, e não invente
  denominador para sustentar o layout — arena de unidades mistas mostra metas
  concluídas ou continua no percentual.
- **Ao registrar**, um toast curto: `Treino: 5/7 · faltam 2`. É informação do
  produto, **independe da presença do Oráculo**, e não substitui a confirmação de
  que salvou. Se falhar o salvamento, restaure o estado e diga.

Critério de saída: a pessoa entende o avanço sem abrir modal e sem depender do
Oráculo.

### Passo 3 — desligar a cobrança global

Da lista da seção 3: saem os candidatos `streak_marco` e `streak_em_risco`, a fala
de risco, o desafio de cinco dias do catálogo e a opção nas configurações.

- **Fica o dado** `daily_proof_streak`. Serve para reconhecer retomada, e retomada
  é reconhecimento, não cobrança.
- **Quem já aceitou** o desafio de cinco dias: honre a regra antiga para essa
  coorte ou ofereça saída sem perda. Nunca retire prêmio ganho.
- **Clientes antigos instalados** ainda podem emitir. Trate no servidor; esconder
  no cliente novo não encerra o comportamento.
- Depois de tudo desligado, aponte o que sobrou órfão — este app já sofreu com
  encanamento que sobreviveu à tela que o usava.

Critério de saída: ninguém sem pacto de dias seguidos aceito recebe cobrança de
dias seguidos.

### Passo 4 — a modalidade que faltava

**Só depois dos três anteriores estarem de pé.**

Falta uma modalidade: **volume com prazo** — *"6 ações de Treino em 14 dias"*, em
que descanso não quebra nada. É o caso do turno irregular e do treino espaçado.

O menor caminho: um `kind` novo em `ArenaPactKind`, um ramo em
`measurePactProgress`, e **um campo de prazo** (`arenaPactEndsOn`) ao lado dos
cinco que já existem. Recompensa pela tabela atual, sem inventar faixa nova.

**A modalidade de dias consecutivos fica para depois, ou não entra.** É exatamente
a mecânica que estamos removendo; opt-in a torna defensável, mas ninguém pediu,
ela é a única que pode machucar, e não deve ser padrão em tela nenhuma.

---

## 6. O que devolver

Um relatório curto por passo, com:

- o que mudou, por arquivo e símbolo;
- a saída real de `tsc` e das suítes, colada, não resumida;
- o SQL pronto para o Afonso colar, se houver;
- o que você **não** fez e por quê;
- e qualquer coisa que o briefing afirma e que você descobriu ser falsa — este
  documento já errou uma vez (disse que o desafio pagava só 2 de ouro) e foi
  corrigido por leitura de código. Corrija de novo se for o caso.

---

## Contexto

- [Discussão: sequência, Oráculo e o appeal de anotar](./2026-09-05-sequencia-oraculo-e-o-appeal-de-anotar.md) — o porquê, os três pontos de valor, a prova respondida
- [Plano de Oráculo, missões, presença e progresso](./2026-09-05-plano-oraculo-missoes-presenca-e-progresso.md) — inventário e riscos; **a seção 5 é obrigatória**
- [Dados e utilidade do Oráculo](./2026-09-05-dados-utilidade-oraculo-retorno-e-missoes.md) — o que dá para saber e o que não se deve buscar
- [Sequência e resgate diário](./2026-09-02-sequencia-e-resgate-diario.md) — estado do código e bifurcações abertas
