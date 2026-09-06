# O repertório do Oráculo — o que ele sabe, o que ele fala, o que sai e o que entra

Levantamento de 05/09/2026, verificado no código. **Não é lista de frases** — é o
mapa do que existe, para caber na cabeça de uma pessoa antes de alguém escrever
frase nova.

Quem for escrever as falas: leia isto primeiro, escreva depois. O documento diz
**quais assuntos existem**, quais morrem e **quais vagas abrem**. As frases vêm
por último, e multiplicam por tom.

---

## 1. A causa da bagunça: são TRÊS sistemas de fala, não um

Esse é o achado principal. O Oráculo não tem um repertório — tem três, em três
arquivos, com três lógicas de escolha, e **eles falam dos mesmos assuntos**.

| sistema | onde | quantos | como escolhe | tem variação de tom? |
|---|---|---|---|---|
| **Candidatos de abertura** | `utils/oracleCandidates.ts` (cliente) | 14 tipos | árbitro por peso, escolhe **1**, e o silêncio é resposta válida | não |
| **Estados operacionais** | `supabase/functions/_shared/oracle-host-voice.ts` + `oracle-lines.ts` (servidor) | 14 estados | cascata de `if`, primeiro que casa vence | **não** — 3 frases fixas por estado |
| **Reações a evento** | `constants/oracleSpeechLibrary.ts` (cliente) | 12 eventos | pelo evento que acabou de acontecer | **sim** — 4 tons cada |

Mais o **card automático**, que é gerado por IA e é a única peça que não tem
repertório fixo.

**40 assuntos em três lugares.** E a duplicação é literal:

| assunto | candidato (cliente) | estado (servidor) | reação (evento) |
|---|---|---|---|
| arena parada | `arena_parada`, `arena_atrasada` | `arena_esquecida` | — |
| escopo grande demais | `meta_inflada` | `escopo_pesado` | — |
| ciclo atrasado | `ciclo_atrasado` | `atrasado` | — |
| voltar depois de sumir | `arena_retomada` | `retomando` | `first_after_pause` |
| sem ciclo | `sem_ciclo` | `sem_direcao` | — |
| **sequência** | `streak_marco`, `streak_em_risco` | `streak_mantida`, `streak_quebrada` | `streak_saved` |

Seis assuntos escritos duas ou três vezes, com textos diferentes, decididos por
regras diferentes. **É por isso que ninguém consegue segurar o Oráculo na
cabeça** — e é por isso que ele fica ruim rápido: melhorar um lugar não melhora
os outros, e a pessoa pode ouvir a mesma coisa em duas vozes no mesmo dia.

---

## 2. O que ele sabe hoje

Não é dicionário de banco. É o que dá para **dizer** com o que já está calculado
e na memória do app — sem coletar nada novo, sem ida ao servidor.

### Sobre o ciclo
`hasCycle` · nome · datas · `cycleDayNumber` · `cycleTotalDays` ·
`cycleDaysRemaining` · `cycleCompletionPercent` · **`expectedCycleCompletionPercent`**
· **`cycleCompletionDelta`** · `cyclePace` (adiantado/no ritmo/atrasado/crítico) ·
`cycleTotalActions` · `cycleCompletedActions` · `cyclePendingActions`

> Permite: comparar **real contra esperado**, projetar sobra ou falta de dias,
> dizer se o ciclo está grande demais para o tempo que sobrou.

### Sobre cada arena (`OracleArenaSignal`)
`progressPercent` · `expectedProgressPercent` · **`progressDelta`** · `pace` ·
`completedActions` · `plannedActions` · `pendingActions` · `pendingActionsToday` ·
`hasMeasurableProgress` · `lastProofDate` · **`daysSinceProof`** ·
**`suggestedAdjustment`** (`reduzir_meta` / `pausar_arena` / `criar_meta_minima` /
`proteger_uma_acao` / `manter_ritmo`)

> Permite: comparar arena contra arena, apontar a que ficou para trás, dizer
> quanto falta e em quantos dias, e **propor o ajuste — que o app já calculou e
> nunca disse em voz alta.**

### Sobre o ritmo real
`bestDailyCompletions` (melhor dia registrado) · `daysWithCompletions` ·
`plannedDailyDemand` (= total de ações ÷ dias do ciclo) · `stalledArenaCount` ·
`overloadedArenaCount` · `staleArenas` · `overdueActions`

> Permite: **capacidade contra exigência** — "faltam 34 ações e 6 dias; isso pede
> 6 por dia; seu melhor dia foram 3". Nada disso depende de agenda.

### Sobre o histórico
Relatórios de ciclos anteriores · comparação entre ciclos (mínimo 2 anteriores) ·
fair score e seus componentes · snapshot de identidade no fechamento

> Permite: "este ciclo está melhor que os seus anteriores", com número.

### Sobre a conversa
Memória curta de assuntos já ditos (`localStorage`, **não sincroniza entre
aparelhos**) · histórico de mensagens · preferência de presença e tom

> Permite: não repetir. É a única defesa que existe contra virar papel de parede.

### O que ele NÃO sabe, e não deve fingir que sabe
O que aconteceu fora do app. **Registro vazio não prova descanso nem abandono.**
Horário programado não é horário de execução. E o `completedAt` diz quando a
pessoa **registrou**, não quando fez.

### A regra que separa leitura de bajulação
> **Se você não consegue nomear o número que gerou a frase, a frase não sai.**

---

## 3. O repertório de hoje, com veredito

### Candidatos de abertura — cliente

| tipo | assunto | veredito |
|---|---|---|
| `streak_marco` | marcos 7/14/30/60/100 | **SAI** — a sequência global foi removida |
| `streak_em_risco` | "você vai perder a sequência" | **SAI** — é a cobrança que motivou tudo isto |
| `meta_inflada` | escopo maior que o ritmo | fica — **funde** com `escopo_pesado` |
| `ausente` | sem registro há dias | fica, **mas reescrever**: falar de registro, não diagnosticar esforço |
| `arena_retomada` | voltou a registrar | fica — **funde** com `retomando` e `first_after_pause` |
| `sem_ciclo` | jogando sem ciclo | fica — **funde** com `sem_direcao`; nunca dizer que sem ciclo nada funciona |
| `ciclo_longo` | ciclo > 7 dias com < 35% | fica |
| `sem_entrega` | nada entregue | fica, com a mesma reescrita de `ausente` |
| `arena_atrasada` | arena abaixo do esperado | fica — **funde** com `arena_parada` e `arena_esquecida` |
| `arena_parada` | arena sem registro | **funde** na de cima |
| `ciclo_atrasado` | ciclo abaixo do esperado | fica — **funde** com `atrasado` |
| `prioridade` | o que fazer agora | fica |
| `ja_entregou` | já entregou hoje | fica |
| `estrutura_enxuta` | poucas arenas/ações | fica |

**14 → 9**, sendo 2 mortes e 5 fusões.

### Estados operacionais — servidor

Os 14: `sem_direcao`, `disperso`, `atrasado`, `em_ritmo`, `em_risco`, `retomando`,
`proximo_compromisso`, `pronto_para_fechar`, `arena_esquecida`, `escopo_pesado`,
`oportunidade_util`, `streak_mantida`, `streak_quebrada`, `primeira_acao_do_dia`.

| veredito | quais |
|---|---|
| **SAI** | `streak_mantida`, `streak_quebrada` |
| **QUEBRADO — corrigir já** | `pronto_para_fechar`. A frase é *"O dia está pronto pra fechar. Faz o julgamento e leva a EXP."* **Isso não existe mais**: o dia fecha sozinho, em silêncio, e a EXP já foi depositada. O Oráculo manda apertar um botão que não está na tela. |
| **funde com o candidato equivalente** | `sem_direcao`, `atrasado`, `retomando`, `arena_esquecida`, `escopo_pesado` |
| fica | `disperso`, `em_ritmo`, `em_risco`, `proximo_compromisso`, `oportunidade_util`, `primeira_acao_do_dia` |

E uma inconsistência de fábrica: **estes 14 não têm variação de tom.** São três
frases fixas cada um, enquanto as reações têm quatro tons. O mesmo app escreve
consciente de tom num lugar e cego no outro.

### Reações a evento — cliente

`campaign_completed` · `arena_completed` · `daily_reps_high/mid/low` ·
`cycle_goal_met` · `cycle_goal_last_one` · `cycle_goal_first` ·
`cycle_goal_progress` · `milestone_completed` · `first_after_pause` ·
`streak_saved`

| veredito | quais |
|---|---|
| **SAI** | `streak_saved` |
| fica | todo o resto — este é o sistema mais bem feito dos três, com 4 tons por evento |

---

## 4. As vagas que abrem

Descritas por **função**, não por frase. Quem escrever as falas preenche.

### A. O fim — a maior lacuna do app

Não existe **nenhum** assunto para "acabou". O app sabe falar de atraso, ausência,
escopo e arena parada, e emudece exatamente no momento de maior intenção: a pessoa
fechou tudo e está aberta a fazer de novo.

| vaga | dispara quando | dado | saída |
|---|---|---|---|
| `ciclo_completo` | todas as arenas fechadas e ainda há dias | `arenaSignals` + `cycleDaysRemaining` | nomear **Relatórios → Encerrar Ciclo**, e dizer que deixar rodando também vale |
| `rodada_madura` | sem ciclo, volume de conclusões acumulado | `daysWithCompletions` + ausência de ciclo | convidar a planejar um ciclo **com contagem** — a rodada acumula EXP e **não gera relatório nenhum** |
| `entre_ciclos` | ciclo encerrado, nenhum novo | histórico | o próximo pode nascer do mesmo desenho, com os ajustes que ela já sabe |
| `ultima_arena_fechou` | a última do ciclo fecha | `arenaSignals` | entregar o próximo assunto com tamanho: *"Leitura: 11 repetições em 4 dias"* |

### B. Capacidade contra exigência

| vaga | dispara quando | dado |
|---|---|---|
| `conta_nao_fecha` | `cyclePendingActions ÷ cycleDaysRemaining` > `bestDailyCompletions` | os três já existem |

A frase mais forte que o app poderia dizer hoje, e ela não depende de agenda
nenhuma: *"Faltam 34 ações e 6 dias. Isso pede quase 6 por dia. Seu melhor dia até
agora foram 3."*

### C. Concentração

| vaga | dispara quando | dado |
|---|---|---|
| `foco_concentrado` | uma arena domina os registros recentes | `completedActions` por arena |

Não julga, não sugere, **só revela**: *"Você tem 5 arenas. 7 de cada 10 registros
dos últimos 14 dias foram em Academia."* Quem está feliz segue; quem não sabia,
toma um susto útil.

### D. Arena que nunca começou

| vaga | dispara quando | dado |
|---|---|---|
| `arena_natimorta` | arena no ciclo sem **nenhum** registro desde o dia 1 | `completedActions === 0` |

Diferente de `arena_parada`: aquela andou e parou; esta nunca andou. O sujeito é o
ciclo, não a pessoa: *"Você desenhou este ciclo com 5 arenas. Duas nunca receberam
um registro."*

### E. Pacto aceito

Quando o pacto ganhar prazo, abrem: perto de concluir · prazo chegando · concluído
· abandonado. **Só para quem aceitou** — nunca para quem não pediu nada.

---

## 5. A aritmética, e o aviso

Depois da limpeza: **9 candidatos + 6 estados + 11 reações + ~10 vagas novas ≈ 36
assuntos.** Multiplicando pelos 4 tons (neutro, coach, reflexivo, calmo) e por 3
variantes cada, dá ~430 frases.

**Não escreva 430 frases.** Duas coisas antes:

1. **Fundir primeiro.** As seis duplicações da seção 1 têm que virar um assunto só,
   num lugar só. Escrever tom para `arena_parada` e `arena_esquecida` separados é
   pagar duas vezes por uma frase.
2. **Tom depois de assunto.** Assunto errado em quatro tons continua errado em
   quatro tons.

E a defesa contra virar papel de parede não é ter mais frase: é **falar de novo só
quando o número mudou**, não quando o dia mudou. A memória de assunto existe, mas
mora em `localStorage` e não sincroniza entre aparelhos — isso precisa subir para o
servidor antes de o repertório crescer, ou a variedade vira ilusão.

---

## 6. As cinco regras de estilo

Tiradas das frases que o dono do produto escreveu à mão, e do que o código já
acerta em `arena_esquecida` e `escopo_pesado`.

1. **Duas medidas do mesmo tipo, uma contra a outra.** Agora vs. antes. Real vs.
   esperado. Capacidade vs. plano. Arena vs. arena. Medida sozinha é placar, não
   fala.
2. **A consequência é nomeada.** *"...pra concluir a arena a tempo"*. Número sem
   destino não move ninguém.
3. **A saída é uma edição do plano, não mais esforço.** *"Reduzir meta agora não
   tira EXP já conquistada."* O conserto é o plano, não a pessoa.
4. **O sujeito é a arena, o ciclo ou a ação — nunca "você" como culpado.** *"A
   arena Meditações ficou pra trás"*, não *"você abandonou Meditações"*.
5. **Duas portas sempre que houver convite.** *"Deixar parada é uma escolha
   válida, desde que seja escolha."*

E uma regra de navegação: **o Oráculo não leva, ele diz onde.** Nomeia a tela só
quando o destino é outro lugar (Relatórios, histórico). Quando a edição acontece
onde a pessoa já está, não nomeia nada — vira instrução de manual.

---

## 7. Fora do repertório, mas na mesma frente

**O ciclo já encerra sozinho e o relatório já abre sozinho.** Existe um efeito que
detecta `hoje > endDate`, chama `endCycle`, concede as recompensas, guarda o
resultado e dispara `glyph-cycle-auto-finished`; o `AuthenticatedApp` escuta e abre
Relatórios.

**O que falta é o push.** E ele não sai como está: o fecho roda **no cliente**, então
se a pessoa não abrir o app, o ciclo não expira e não há o que notificar. Precisa de
detecção no servidor (`pg_cron` achando ciclos vencidos) — **a mesma infraestrutura
que o prazo do pacto vai precisar.** Vale construir uma vez, para os dois.

Detalhe que morde: a marca de "já vi este fecho" fica em `localStorage`. Quem viu
no celular e abre no outro aparelho encontra o ciclo limpo, sem ver nada.
