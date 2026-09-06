# Sequência e resgate diário

**Status: nada decidido.** Reescrito em 05/09/2026.

Este arquivo substitui a versão de 02/09, que prescrevia uma mecânica inteira —
fragmento escalando com a sequência, congelamento como item, marcos definidos.
Nada daquilo foi combinado, e manter o texto antigo fazia parecer que sim. O que
sobrou aqui é só o que é **verdade no código** e as **bifurcações abertas**.

---

## O que o código faz hoje

Verificado, não suposto.

| peça | onde | estado |
|---|---|---|
| `daily_proof_streak` | `user_profiles`, jsonb | current, best, última prova, total |
| o que faz a sequência avançar | `GameContext.tsx` · `advanceDailyProofStreak` | **uma tarefa concluída** ligada a uma ação real, no dia operacional |
| o que a faz voltar atrás | mesmo bloco | desmarcar a última tarefa do dia; o Oráculo avisa que "ficou em risco" |
| onde isso roda | **no cliente** | quem não abre o app não avança nem quebra |
| marcos 7/14/30/60/100 | `utils/oracleCandidates.ts` | detectados, **só geram fala** |
| o que a sequência paga | — | **nada**, fora `system-five-day-proof-streak` |
| fecho do dia | `checkDailyRollover` → `closeDailyCommitment` | roda com `{ silent: true }` |
| dias atrasados | `repairOpenCommitments` | fecha **todos**, até 21, um a um, também em silêncio |
| aba **ontem** / **hoje** | `RestScreen.tsx` | viva; ontem responde "como foi", hoje "o que tem" |

Duas consequências que mudam a discussão inteira:

1. **Hoje o Glyph já tem o custo da sequência e nenhum benefício.** Ela cobra, avisa
   que está em risco, quebra — e não paga nada.
2. **Os dias que você não viu já foram pagos.** `silent` suprime o toast e o efeito
   sensorial, não o depósito. Então qualquer regra do tipo "só o último dia paga"
   seria uma **regressão**, não uma proteção.

---

## O que morreu, e não volta

- **`DailyCompletionPromptModal`** — enterrado em 05/09/2026, com
  `utils/dailyCompletionPrompt.ts`, o evento, o estado pendente e a ponte para o
  sitrep. Era o resto de um widget de planejamento por dia que saiu do painel
  diário porque **planejar cada dia misturando a baia inteira com a baia do dia
  confundia**. O widget saiu; o encanamento ficou, disparando só em reconciliação.
  `tests/reward-modal-priority.regression.mjs` guarda a cova.
- **`kind: 'task'`** — ramo órfão do mesmo widget. Continua morto de propósito.

---

## As bifurcações abertas

### 1. O que conta como dia mantido

Hoje: uma ação concluída. Barato de farmar (arrastar do pool e segurar), mas
**falsificar suja o próprio registro** — a conclusão entra no relatório, na nota do
ciclo, no progresso da arena. Quem farma degrada o instrumento que usa para se
enxergar. Uma sequência de "abrir o app" não teria esse canal: seria grátis,
invisível e sem consequência.

O contra-argumento de "abrir o app", que é o que pesa: **ela quebra por ausência,
não por escolha.** Perder 60 dias por causa de um voo é a pior perda possível —
máxima dor, zero significado. Sequência por ação quebra por algo que a pessoa pode
assumir.

**O problema do domingo.** Um dia sem nada planejado quebra a sequência por ação, e
foi para isso que o plano velho inventou congelamento. Uma saída que não cria
objeto nenhum: `daily_commitments` já guarda `taskIds`, então o app já distingue
**dia vazio** de **dia falhado**.

| domingo | segunda | segunda |
|---|---|---|
| 0 planejadas, 0 feitas | 5 planejadas, 0 feitas | 5 planejadas, 2 feitas |
| não prometeu, não falhou | prometeu e sumiu | *(em aberto)* |

A sequência passaria a contar **dias que foram como você declarou**, e o planner
vazio já é a declaração de descanso — sem botão, item, consumível ou compra. O
congelamento some como objeto, não como função.

**O buraco, e ele não tem solução elegante:** quem abandona o app tem 30 dias
vazios e mantém 30 de sequência. Precisa de teto em **dias vazios consecutivos**, e
onde esse número cai é decisão, não conclusão.

Uma restrição que vale registrar: **não pode ser "fim de semana não conta"**. O
descanso de muita gente é quarta. A regra do planner vazio é cega para o dia da
semana, e é por isso que ela serve.

### 2. O que a sequência paga

O plano velho pagava 2 a 10 fragmentos/dia, escalando com a sequência. Isso não é a
sequência do Duolingo — lá o dia a dia não paga moeda, o número é o prêmio, e quem
paga são os marcos. Escalar o pagamento **põe preço na perda**: perder 30 dias deixa
de custar um número e passa a custar 8💎/dia, o que amplifica exatamente a aversão à
perda que briga com a voz do app.

A alternativa a comparar: **segurar ≠ ganhar**. Dia vazio segura o número e não paga;
dia com ação paga fragmento **fixo**; a escalada mora só nos marcos. Farmar planner
vazio daria número grande e zero moeda — e número que não compra nada não dói quando
quebra.

### 3. O caminho de entrada

Não há bagunça para unificar: **hoje o app não anuncia fecho de dia nenhum.** A
questão é escolher a primeira voz, e mantê-la única.

Proposta em discussão — **uma campainha e uma casa**: o modal abre sozinho uma vez,
na primeira abertura do dia, só se houver dia julgado ainda não visto; depois disso
mora na aba **ontem**, com o mesmo conteúdo, para sempre.

Falta decidir **o que a campainha marca como visto**: `collected_at` faz dela recibo
de coleta; `seen_at` faz dela só aviso. Muda o rótulo do botão e muda se existe
pagamento no fim.

---

## O que já está resolvido e não precisa ser rediscutido

- **O modal é recibo, não pagamento.** `closeDailyCommitment` já credita a EXP no
  fecho, com `stage: 'judgment'`, e dia julgado é final. Pagar de novo no modal seria
  repetir o defeito do `cycleBaseExp`.
- **Recompensa não depende de a tela abrir.** O precedente já é do app: o baú vai
  fechado para o Arsenal. Por isso não existe "dia acumulado esperando ser coletado"
  para farmar.
- **O cliente não serve.** Qualquer versão que pague precisa de `pg_cron` na virada
  do dia operacional (04:00 SP = 07:00 UTC) e concessão por RPC. Preço que vem do
  cliente é preço que o cliente escolhe.
- **Não se compra proteção de sequência com dinheiro.** Transformaria a sequência em
  cobrança, e o app passou a existir sendo o contrário disso.

---

## Fontes

- [Trophy — apps que usam streaks](https://trophy.so/blog/streaks-feature-gamification-examples)
- [Deconstructor of Fun — a mecânica de streak da Duolingo](https://duolingo.deconstructoroffun.com/mechanics/streaks)
- [Lenny's Podcast — Jackson Shuttleworth, time de retenção da Duolingo](https://www.getrecall.ai/summary/lennys-podcast/behind-the-product-duolingo-streaks-or-jackson-shuttleworth-group-pm-retention-team)
- [Duolingo Blog — friend streak](https://blog.duolingo.com/friend-streak/)
- [Duolingo Blog — animação dos marcos de sequência](https://blog.duolingo.com/streak-milestone-design-animation/)
