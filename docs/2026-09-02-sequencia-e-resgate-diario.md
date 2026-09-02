# Sequência, resgate diário e congelamento

Plano de mecânica. Nada aqui está implementado — é para ser criticado antes de virar código.

Escrito em 02/09/2026, depois de a pesquisa sobre a Duolingo e a leitura do código
mostrarem que metade disto já existe e ninguém vê.

---

## O que já existe hoje

Verificado no código, não suposto.

| peça | onde | estado |
|---|---|---|
| `daily_proof_streak` | `user_profiles`, jsonb | current, best, última entrega, total |
| marcos 7/14/30/60/100 | `utils/oracleCandidates.ts` | **detectados, mas só geram fala** |
| `system-five-day-proof-streak` | `constants/systemChallenges.ts` | única missão que paga por sequência |
| fecho automático do dia | `checkDailyRollover` → `closeDailyCommitment` | roda a cada 60s com o app aberto |
| aba "ontem" no painel diário | `RestScreen` | mostra contagem por arena |
| `RewardPackModal` | `components/RewardPackModal.tsx` | **o modal compartilhado** — presente, premium, beta, baú e relatório de ciclo |
| `DailyCompletionPromptModal` | 100 linhas, próprio | mostra score e EXP do dia — **já existe e já dispara** |
| `emitDailyCompletionPrompt` | `utils/dailyCompletionPrompt.ts` | evento vivo, mas só no caminho de reconciliação |
| `kind: 'task'` | mesmo arquivo | **ramo morto** — ninguém dispara |
| congelamento | — | **não existe** |

### Correção: eu propus construir o que já está pronto

A primeira versão deste plano falava em "criar o modal de resgate". Não precisa.
O `RewardPackModal` já existe, já é o padrão de ciclo, missão e patente, e o
payload dele já carrega `gold`, `chestType`, `itemIds`, `metricCards` e
`rewardHighlights`.

E o prompt do dia anterior também existe: `DailyCompletionPromptModal` mostra o
percentual do dia e a EXP depositada, e `emitDailyCompletionPrompt` ainda dispara
— só que **apenas quando dias pendentes são reconciliados**, nunca na virada
normal do dia. É por isso que ele parece desativado: o gatilho estreitou.

O `kind: 'task'` ficou órfão quando o fechamento manual saiu do painel diário — e
**deve continuar morto**. Ele servia para realizar ações pelo painel, separando
ações "daquele dia", o que criava uma segunda lista concorrendo com a baía real.
Foi removido de propósito. Ressuscitar o gatilho junto com o resto seria trazer
de volta a confusão que motivou a remoção.

**Então o que falta é bem menor do que este plano dizia:**

1. disparar o prompt na **primeira abertura do dia**, para o dia anterior julgado
   e ainda não coletado — hoje ele só aparece em reconciliação;
2. `fragments` no `RewardModalPayload` — ele tem `gold`, não tem fragmento;
3. o pagamento em si (RPC + `collected_at`);
4. decidir se o resumo diário passa a usar o `RewardPackModal` — o padrão dos
   outros — ou mantém o modal próprio de 100 linhas. **Recomendo unificar no
   `RewardPackModal`**: hoje há dois desenhos de recompensa no mesmo app, e o do
   dia a dia é justamente o menos caprichado, sendo o mais visto.

---

## A decisão que muda tudo: o modal é recibo, não pagamento

`closeDailyCommitment` já credita a EXP no fecho — ela vai para `cycleExpBonus` ou
`roundExpBonus` conforme haja ciclo, e grava `exp_deposited` com `stage: 'judgment'`
em `daily_commitments`. Dia julgado é **final**: `repairOpenCommitments` pula
`stage === 'judgment'`, então não há janela de edição.

**Dar EXP de novo no modal seria pagar duas vezes** — literalmente o defeito do
`cycleBaseExp` que custou meia sessão para achar. Então:

- a EXP **aparece** no modal, com o destino dela (ciclo ou rodada);
- o que o modal **paga** é fragmento.

Isso não é um consolo. É a correção de algo que hoje é invisível: ninguém vê a EXP
indo para a rodada ou para o ciclo, e essa é justamente a informação que faz a
pessoa entender o próprio jogo. O recibo dá corpo ao que já acontece em silêncio.

---

## A mecânica

### A anatomia do modal, que ja resolve o desenho

`RewardPackModal` tem duas secoes, e elas ja separam exatamente o que precisamos:

| parte | como aparece | serve para |
|---|---|---|
| `metricCards` | quadradinhos, grid de 1/2/3 colunas — label pequeno dourado, valor em negrito, `detail` opcional | **o recibo** |
| `rewardHighlights` | linhas largas com icone de presente e tom de cor, sob o titulo **"Entregue agora"** | **o pagamento** |
| `itemIds` | grade de itens | bau nos marcos |

O modal **ja codifica a diferenca** entre "isto aconteceu" e "isto esta sendo
entregue agora" — o titulo da segunda secao e literalmente "Entregue agora". Nao
ha nada a inventar.

`gold` e `chestType` existem no tipo mas NAO sao desenhados: quem chama traduz
para `rewardHighlights`. O precedente pronto e `utils/chestRewardPresentation.ts`,
que monta o payload do bau. O resgate diario e um `buildDailySummaryPayload` ao
lado dele, no mesmo formato.

O tom `cyan` dos highlights e a mesma cor que os fragmentos ja tem na barra da
loja. Coincidencia util: o pagamento sai na cor da moeda.

### Onde o resgate aparece

O painel diario ja tem **ontem** e **hoje**.

- **ontem** ganha um botao **"Ver recompensas"**, que abre o modal — e abre
  tambem depois de ja ter coletado. Coletado, o modal mostra os mesmos
  quadradinhos e a secao de entrega diz que ja foi resgatado; o botao vira
  "Fechar". `collected_at` e o que distingue os dois estados.
- **hoje** mostra a sequencia, mas **discreta**. Numero grande e a estetica de
  cobranca, e o app nao e isso.
- na primeira abertura do dia, se houver dia julgado nao coletado, o modal abre
  sozinho uma vez. Depois disso, so pelo botao.

### O que o modal mostra e paga

```
  RESUMO DE ONTEM · terça, 01/09

  ✓ 4 ações concluídas          Saúde 2 · Estudos 1 · Casa 1
  ✓ 37 EXP                      entrou no seu ciclo          ← recibo
  ✓ sequência: 6 dias

  ─────────────────────────────
  RESGATAR                      +4 💎                        ← pagamento
```

Sem ciclo, a terceira linha diz **"entrou na sua rodada"** — e essa é a primeira
vez que alguém vai entender que rodada existe.

### A escala, medida contra a economia atual

Quebrar item comum rende **10 💎**. Baú comum custa **24 💎**.

```
base 2 💎   +1 a cada 5 dias de sequência   ·   teto 10 💎/dia
```

| sequência | por dia | por semana | contexto |
|---|---|---|---|
| 1–4 | 2 💎 | 14 💎 | mais da metade de um baú comum |
| 5–9 | 3 💎 | 21 💎 | quase um baú |
| 30 | 8 💎 | 56 💎 | dois baús |
| 40+ | 10 💎 (teto) | 70 💎 | o teto existe para isto parar de crescer |

Cresce o suficiente para a sequência importar, devagar o suficiente para não virar
torneira. **Ouro fica fora do resgate diário** — é dinheiro real, tem pacote pago, e
distribuí-lo por hábito mexe na economia de um jeito que fragmento não mexe.

### Marcos

Nos marcos que o árbitro **já detecta** — 7, 14, 30, 60, 100 — o resgate do dia vem
com um baú, e não com fragmento avulso:

| marco | baú | mais |
|---|---|---|
| 7 | Comum | 1 congelamento |
| 14 | Incomum | 1 congelamento |
| 30 | Raro | insígnia |
| 60 | Épico | |
| 100 | Lendário | insígnia |

O árbitro já sabe quando isso acontece e já fala. Falta a fala ter consequência.

---

## Anti-farm

Quatro regras. A terceira é a que realmente segura.

1. **Um resgate por dia operacional**, nunca por ação. O dia é a unidade.

2. **`collected_at` em `daily_commitments`.** Sem ela, reabrir o modal paga de novo —
   e reabrir modal é grátis. Esta coluna é a trava de idempotência, não um detalhe
   de auditoria.

3. **O fragmento é concedido por RPC no servidor**, que lê o registro do próprio dia
   e a sequência do perfil. O cliente **nunca** manda o valor. É a mesma regra do
   baú, e pelo mesmo motivo: preço que vem do cliente é preço que o cliente escolhe.

4. **Teto diário.** Criar cinco ações de mentira não paga mais que concluir uma real.
   O teto é o que torna o farm sem graça — mais barato que qualquer verificação de
   "ação legítima", que seria impossível de definir sem julgar a vida de alguém.

### Se pulou dias

`repairOpenCommitments` fecha os dias atrasados **um a um**, cada um com seu próprio
`exp_deposited` — confirmado no código. Então o dado por dia é fiel.

Mesmo assim, **só o último dia paga fragmento**. Os anteriores aparecem contados no
resumo, e um toast avisa que a EXP e os itens daqueles dias já foram creditados.

O motivo é simples: se sumir três dias rendesse três resgates, sumir seria mais
lucrativo que aparecer. E a sequência já quebrou nesses dias de qualquer forma — o
resgate acumulado premiaria exatamente o comportamento que a mecânica quer evitar.

---

## Congelamento

É a peça que impede a sequência de virar ameaça, e sem ela o resto é perigoso: se
30 dias valem muito mais que 3, perder passa a doer proporcionalmente.

**A trava de implementação, e ela é séria.** `advanceDailyProofStreak` roda no
CLIENTE, na conclusão da ação. Se a pessoa não abre o app, nada acontece — nem para
quebrar a sequência, nem para congelá-la. Um congelamento implementado no cliente
**nunca seria aplicado a tempo**, que é exatamente o cenário para o qual ele existe:
quem perdeu um dia, por definição, não está no app.

Ele tem que ser consumido por `pg_cron` na virada do dia operacional (04:00 SP =
07:00 UTC). A infra existe — o cron do Oráculo voltou a rodar hoje.

Regras:

- guarda no máximo **2**;
- vem dos marcos 7 e 14, e **2 para quem começa** (foi um dos maiores ganhos de
  retenção medidos pela Duolingo);
- é consumido em silêncio, e a pessoa descobre no resumo do dia seguinte:
  *"Você não entregou ontem. Um congelamento manteve sua sequência de 12 dias."*

Não se compra com ouro. Comprar proteção com dinheiro real transforma a sequência
em cobrança, e o app passou a sessão inteira sendo o contrário disso.

---

## Migração

```sql
alter table public.daily_commitments
  add column if not exists collected_at timestamptz null,
  add column if not exists fragments_granted integer not null default 0;

alter table public.user_profiles
  add column if not exists streak_freezes integer not null default 0;
```

E uma RPC `collect_daily_summary(p_date date)` que:

1. exige `auth.uid()`;
2. trava a linha do dia com `for update`;
3. recusa se `collected_at` não for nulo, se `stage <> 'judgment'`, ou se a data não
   for o último dia julgado;
4. calcula o valor **no servidor** a partir de `daily_proof_streak.current`;
5. credita em `user_profiles.wallet->fragments` — jsonb, como o baú, e **não** a
   coluna escalar `fragments`, que é legado e o app não lê (descoberto hoje, ao
   consertar o quebrar item);
6. grava `collected_at` e `fragments_granted` na mesma transação.

---

## Pontos de código

| arquivo | o que muda |
|---|---|
| `components/RestScreen.tsx` | painel abre em "ontem" na primeira vez do dia, se houver dia julgado não coletado |
| `contexts/GameContext.tsx` | `collectDailySummary()`, espelhando `buyChestWithFragments` |
| `contexts/GameContext.tsx:4788` | `emitDailyCompletionPrompt` passa a disparar também na virada, não só na reconciliação |
| `types.ts:326` | `fragments?: number` no `RewardModalPayload` |
| `DailyCompletionPromptModal` | unificar no `RewardPackModal`, ou assumir que são dois desenhos |
| `utils/oracleCandidates.ts` | marcos passam a emitir evento de recompensa, não só fala |
| `pg_cron` | consumo de congelamento na virada do dia |

---

## Ordem

1. **`collected_at` + RPC + modal com o recibo.** Sozinho já entrega valor: torna
   visível a EXP e o destino dela, que hoje ninguém vê.
2. **Fragmento escalando com a sequência.** Precisa da leitura confiável do
   `current` — e ela ficou confiável hoje, quando o `streak_em_risco` passou a
   exigir entrega ontem.
3. **Congelamento**, com o cron. É o que torna o passo 2 seguro.
4. **Marcos com baú e insígnia.** O árbitro já detecta.

---

## O que fica fora, e por quê

**Ligas e ranking.** Brigariam de frente com a voz do app — *"pausar também é uma
escolha legítima"*, *"não há dívida acumulando aqui"*.

**Sequência com amigo.** É a de maior viralidade medida (+22% de conclusão diária na
Duolingo) e o Glyph já tem amigos, mensagem e notificação. Mas é a maior construção
das quatro, e depende de a sequência individual já valer alguma coisa. Fica para
depois, não fica descartada.

**Ouro no resgate diário.** Dito acima.

---

## O risco que vale dizer em voz alta

Sequência é aversão à perda. O Glyph passou esta sessão inteira construindo o
contrário: o painel que esperou sem cobrar, a arena que pode ficar parada sem culpa,
o ciclo atrasado que ainda termina.

Pendurar prêmio na sequência puxa na direção oposta, e não adianta fingir que não.
O congelamento é o que reconcilia os dois — ele transforma a sequência de ameaça em
algo com perdão embutido. **Por isso ele não é opcional nem posterior: sem ele, esta
mecânica torna o app mais pesado, não mais vivo.**

---

## Fontes

- [Trophy — apps que usam streaks](https://trophy.so/blog/streaks-feature-gamification-examples)
- [Deconstructor of Fun — a mecânica de streak da Duolingo](https://duolingo.deconstructoroffun.com/mechanics/streaks)
- [Lenny's Podcast — Jackson Shuttleworth, time de retenção da Duolingo](https://www.getrecall.ai/summary/lennys-podcast/behind-the-product-duolingo-streaks-or-jackson-shuttleworth-group-pm-retention-team)
- [Duolingo Blog — friend streak](https://blog.duolingo.com/friend-streak/)
- [Startup Spells — print e viralização](https://startupspells.com/p/duolingo-screenshot-tracking-viral-strategy)
