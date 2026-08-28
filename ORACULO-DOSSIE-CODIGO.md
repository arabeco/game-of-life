# Oráculo — dossiê do código

Respostas às 10 perguntas, extraídas do código. Onde eu não sei, digo que não sei.

Arquivos: `utils/oracleOperationalContext.ts` (o contexto),
`utils/oracleCoach.ts` (a escolha da fala),
`constants/oraclePresencePolicy.ts` (as presenças),
`contexts/GameContext.tsx` (o streak),
`supabase/functions/oracle/index.ts` (o cron),
`supabase/functions/web-push/index.ts` (o push).

O contexto é calculado **duas vezes, com o mesmo algoritmo**: no aparelho
(`oracleOperationalContext.ts`) e no servidor (`oracle/index.ts`). São arquivos
irmãos, quase linha a linha.

---

## 1. Os 16 campos por arena

`OracleArenaSignal`:

| Campo | Tipo | O que é |
|---|---|---|
| `arenaId` `arenaName` | string | identidade |
| `actionCount` | number | ações da arena |
| `measurableActionCount` | number | ações que não são do tipo `Livre` |
| `progressPercent` | number \| null | `completedActions / plannedActions` |
| `expectedProgressPercent` | number \| null | quanto **deveria** estar, pelo dia do ciclo |
| `progressDelta` | number \| null | real − esperado |
| `pace` | 5 estados | ver item 2 |
| `completedActions` | number | feitas no ciclo |
| `plannedActions` | number | soma dos pesos (`getActionCycleWeight`) |
| `pendingActions` | number | planejadas − feitas |
| `pendingActionsToday` | number | pendentes **de hoje** |
| `hasMeasurableProgress` | boolean | `plannedActions > 0` |
| `lastProofDate` | string \| null | data da última conclusão |
| `daysSinceProof` | number \| null | dias desde então |
| `suggestedAdjustment` | 5 valores | ver item 4 |
| `reason` | string | frase gerada por `buildArenaSignalReason` |

Calculado para **todas** as arenas relevantes, ordenado, e **cortado em 6**.

---

## 2. Os 5 estados de `pace` e como saem

Puramente `delta = progressPercent − expectedProgressPercent`:

| Estado | Condição |
|---|---|
| `sem_medida` | qualquer um dos dois é `null` (arena sem ação mensurável) |
| `adiantado` | `delta >= 10` |
| `no_ritmo` | `delta >= -10` |
| `atrasado` | `delta >= -25` |
| `critico` | abaixo disso |

**É instantâneo e sem histerese.** Uma arena oscilando em torno de −10 troca
entre `no_ritmo` e `atrasado` de um dia para o outro sem que nada real tenha
mudado.

---

## 3. Como as 6 são ranqueadas

`compareArenaSignals` — uma nota única, ordem decrescente:

```
nota = adjustmentScore × 1000
     + paceScore       × 100
     + pendingActionsToday × 10
     + pendingActions
     + max(0, −progressDelta)
```

| `suggestedAdjustment` | peso | | `pace` | peso |
|---|---|---|---|---|
| `reduzir_meta` | 5 | | `critico` | 5 |
| `pausar_arena` | 4 | | `atrasado` | 4 |
| `proteger_uma_acao` | 3 | | `sem_medida` | 3 |
| `criar_meta_minima` | 2 | | `no_ritmo` | 2 |
| `manter_ritmo` | 1 | | `adiantado` | 1 |

**Vence quem está pior.** O ranking é ordenado por gravidade — o multiplicador
de 1000 faz o `suggestedAdjustment` dominar tudo.

Isto confirma a sua suspeita e é pior do que parece: **é estruturalmente
impossível a arena que está indo bem ganhar a voz.** `adiantado` + `manter_ritmo`
dá a menor nota possível. Uma virada — arena que estava parada e voltou a andar —
**cai no ranking justamente por ter melhorado**.

E `focusArenaSignal = arenaSignals[0]` — só a primeira sobrevive.

---

## 4. Os diagnósticos por arena que já existem

`suggestedAdjustment`, em cascata (primeiro que casar):

| Valor | Condição |
|---|---|
| `criar_meta_minima` | `plannedActions === 0` |
| `pausar_arena` | `daysSinceProof >= 7` **e** `completedActions === 0` |
| `reduzir_meta` | `pace` é `critico` ou `atrasado` |
| `proteger_uma_acao` | tem pendente hoje |
| `manter_ritmo` | resto |

Mais os agregados do contexto:

- `stalledArenaCount` — `pausar_arena` ou `pace critico` ou `daysSinceProof >= 7`
- `overloadedArenaCount` — quantas estão em `reduzir_meta`
- `staleArenas[]` — nomes

**Correção importante ao que eu disse antes:** `reduzir_meta` **não detecta
estrutura inflada**. Ele dispara quando a arena está atrasada, seja porque a meta
é grande demais **ou** porque a pessoa não fez. É um sintoma, não a causa. A
distinção que faltava — "40 ações/dia é impossível para qualquer um" — **não
existe em lugar nenhum**. `plannedActions` está lá, mas ninguém compara com um
teto de plausibilidade.

Eu tinha dito que a M1 estava meio construída. Está menos do que eu afirmei: o
número existe, a conclusão não.

---

## 5. Que histórico existe hoje

**Persistido, no perfil (`dailyProofStreak`):**
`current` · `best` · `totalClosedDays` · `totalProofDays` · `lastClosedDate` ·
`lastClosedAt` · `lastProofDate` · `lastProofAt` · `lastProofActionId` ·
`lastProofArenaId` · `lastProofCycleId` · `lastScore` · `lastExpDeposited` ·
`lastCompletedTasksCount` · `lastTotalTasksCount`

**Derivado das tasks:** cada task tem data operacional, então `lastProofDate` e
`daysSinceProof` por arena saem de varrer as tasks.

**Não existe:** nenhum registro de estado anterior. Nada guarda o `pace` de
ontem, nem o `progressPercent` de ontem, nem quando um `suggestedAdjustment`
mudou. Não há tabela de histórico de arena.

**A nuance que importa:** as tasks têm data, então o `progressPercent` de
**qualquer dia passado é calculável**. O histórico não está perdido — ele nunca
foi computado para nenhuma data além de hoje. Isso é bem mais barato do que
começar a gravar snapshots: é rodar o mesmo cálculo com outra data de corte.

---

## 6. Como o streak funciona, exatamente

`advanceDailyProofStreak`. Chave = **data operacional** (não meia-noite do
relógio).

**Nasce/avança** quando uma task é concluída e é a primeira do dia:

```
mesma data que a última      → current = max(1, current)   (não sobe 2× no dia)
última prova foi ONTEM       → current + 1
qualquer outro caso          → current = 1                 (reinicia)
```

`best = max(best, current)`. `totalClosedDays` e `totalProofDays` sobem só em
data nova.

**Quebra:** não há job que quebre. **É lazy** — o streak só é reavaliado quando a
pessoa conclui algo. Se ela sumir 10 dias, `current` continua marcando o valor
antigo no perfil até ela voltar e concluir uma ação, e só aí vira 1.

**Consequência direta para a sua ideia:** "streak em risco às 22:30" **não é
detectável hoje sem um gatilho novo**, porque nada roda quando a pessoa *não*
faz nada. O dado para calcular está lá (`lastProofDate` + hoje), mas ninguém
pergunta.

**Recuperação:** não existe. Não há "streak freeze" nem repescagem.

**Existe um rollback:** se a pessoa **desmarca** a última task do dia,
`rollbackDailyProofStreakDate` desfaz a data — e aí **já existe uma fala de
streak em risco**, com duas variações fixas, *fora* do banco de tons:

> "A sequencia ficou em risco. Completa uma acao real hoje e ela volta a
> respirar."

É a única fala de streak que existe no app inteiro, e ela dispara pelo motivo
mais raro possível (desmarcar), não pelo mais comum (não fazer nada).

---

## 7. O texto exato das três presenças

De `ORACLE_PRESENCE_RULES`, mostrado literalmente na tela:

**Silencioso** (`0`)
> Só o essencial. Ele fala quando você chama, e a missão que você pedir segue normal.

**Equilibrado** (`2`)
> Um card e uma fala por dia, e ele celebra quando você fecha algo grande.

**Presente** (`3`)
> Fala toda vez que você abre e acompanha o seu dia de perto.

Sobre o seu ponto do pacto: repare que **o texto do Silencioso não promete
silêncio absoluto** — promete "só o essencial". Isso ajuda a sua proposta de
separar *comentário* de *alerta*, mas não a autoriza sozinho: ninguém lendo isso
entende que vai receber push.

---

## 8. O que pode virar push, e o que o cron enxerga

**Push:** `shouldPushOracleMessage` recusa tudo que não seja
`deliveryType === 'feed'`. Ou seja: **só o card de infos**. Falas e reações são
`'chat'` e nunca tocam o celular. Também recusa mensagem já lida.

O cano: `after insert` em `oracle_messages` → webhook → `web-push`.
**Qualquer linha nova com `delivery_type: 'feed'` vira push automaticamente.**

**O cron** (`*/10 * * * *`) roda `oracle/index.ts`, que monta **o mesmo contexto
completo** — as 6 arenas, os agregados, o streak. Ele enxerga tudo que o app
enxerga.

**A assimetria que isto revela:** o servidor calcula o contexto inteiro a cada
10 minutos e só o usa para escolher **um card por dia**. Um gatilho de "streak em
risco às 21h" não precisaria de infra nova — precisaria de uma condição a mais
num job que **já roda e já tem os dados na mão**.

---

## 9. O Oráculo sabe que uma arena mudou de estado?

**Não. Só recebe o estado atual.**

Não há persistência de estado anterior (item 5), e o `pace` é recalculado do
zero a cada leitura. `parada → retomando` é invisível — e, pelo ranking do item
3, mesmo que fosse visível a arena que melhorou **desceria** na lista.

Isto é o que falta, e é uma coisa só.

---

## 10. O fluxo completo de uma fala de abertura

```
1. DADOS      tasks + actions + arenas + ciclo + perfil
                ↓
2. CONTEXTO   buildOracleOperationalContext
              → sinais por arena → sort por gravidade → slice(0, 6)
              → focusArenaSignal = [0]
              → agregados (stalled, overloaded, streak, ciclo)
                ↓
3. ESTADO     buildPlannerCoachSpeech — cascata fixa, PRIMEIRO que casar vence:

              ausente            daysSinceLastPlannerOpen >= 3
              sem_ciclo          sem ciclo e tem arena
              ciclo_longo        ciclo > 7 dias e progresso < 35%
              sem_entrega        daysSinceLastProof >= 3
              arena_atrasada     focusArena.pace atrasado|critico
              arena_parada       focusArena.adjustment = pausar_arena
              ciclo_atrasado     cyclePace atrasado|critico
              prioridade         tem ação prioritária
              ja_entregou        concluiu algo hoje
              estrutura_enxuta   1 arena e <= 3 ações
              (nenhum)           → null, não fala
                ↓
4. TOM        resolveOracleSpeechTone(preferências) — desconhecido vira neutro
                ↓
5. LINHA      pickCoachLine(estado, tom) — sorteia entre as 2
              fillCoachLine: variável faltando INVALIDA a linha
                ↓
6. BLOQUEIOS  presença (nunca | 1×dia | toda abertura)
              ref de sessão (1× por foreground)
              carimbo do dia (só depois de falar)
              teto do servidor: 12/dia
              presença 0: nem grava
```

### O que este fluxo mostra

**A cascata é fixa e sem desempate.** O primeiro `if` que casar vence, para
sempre. Alguém em `prioridade` ouve `prioridade` **todo dia**, com 2 variações,
enquanto `ja_entregou` e `estrutura_enxuta` — que estão embaixo — quase nunca
disparam.

**Não há nota de relevância em lugar nenhum.** A ordem da cascata *é* a
prioridade, e ela foi escrita à mão, uma vez.

**Só 4 dos 14 campos lidos vêm da camada de arena**, e todos da mesma arena.

**Nenhum campo de streak entra nesta cascata.** Os 15 campos do item 5 não são
consultados por nenhum dos 10 `if`.

---

## Resumo do que eu erraria se não tivesse aberto o código

1. `reduzir_meta` **não** é detecção de estrutura inflada. É sintoma de atraso.
   A causa nunca é distinguida.
2. O ranking é **por gravidade**, então quem melhorou desce — a virada é
   invisível duas vezes, não uma.
3. O streak é **lazy**: nada roda quando a pessoa não faz nada, então "em risco"
   não é detectável sem gatilho novo.
4. Já existe **uma** fala de streak, presa ao caso mais raro (desmarcar task) e
   fora do sistema de tons.
5. O histórico **não precisa ser gravado** — as tasks têm data, então o passado
   é recalculável. É mais barato do que snapshots.
