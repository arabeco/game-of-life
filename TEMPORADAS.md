# Temporadas do GLYPH

Como o sistema de temporadas funciona, o que cada peça depende, e o que precisa
estar pronto antes de cada virada.

Atualizado em 20/08/2026.

---

## Calendário

Treze temporadas encadeadas, cada uma de ~3 meses, presas a solstício e
equinócio. Definidas em [`constants/seasonContent.ts`](constants/seasonContent.ts).

```
Temporada 0 - Genesis   2025-12-21 → 2026-09-22   ← ATIVA
Aurora I                2026-09-22 → 2026-12-21
Zenite I                2026-12-21 → 2027-03-20
Eclipse I               2027-03-20 → 2027-06-21
Egide I                 2027-06-21 → 2027-09-23
Aurora II               2027-09-23 → 2027-12-21
Zenite II               2027-12-21 → 2028-03-19
Eclipse II              2028-03-19 → 2028-06-20
Egide II                2028-06-20 → 2028-09-22
Aurora III              2028-09-22 → 2028-12-21
Zenite III              2028-12-21 → 2029-03-20
Eclipse III             2029-03-20 → 2029-06-21
Egide III               2029-06-21 → 2029-09-22
```

A cadeia é contígua: o fim de uma é o começo da seguinte, sem furo nem
sobreposição. `ACTIVE_SEASON_ID` aponta para `season-genesis-0`; a resolução em
tempo de execução é por data, em `resolveRuntimeActiveSeason`.

---

## Ver o catálogo

Folha de contato com todos os itens, em abas por categoria e com a aba
Míticos separada por temporada e slot:

<https://claude.ai/code/artifact/5b198da3-a14f-43bc-b9df-270dccd654ca>

Slot vazio aparece tracejado, então dá para ver de relance o que cada coleção
ainda pede.

---

## A coleção de cada temporada

Cinco slots, definidos em `ItemSeasonSlot`:

```
skin · border · banner · ui_skin · insignia
```

Cada item da coleção precisa de:

| campo | valor |
|---|---|
| `tier` | **6** |
| `rarity` | **`mythic`** |
| `isSeasonExclusive` | `true` |
| `seasonKey` | a chave da temporada, ex. `genesis_legacy` |
| `seasonSlot` | um dos cinco acima |

`seasonKey` **não é derivável do id** — `season-genesis-0` usa `genesis_legacy`.
Por isso a `SeasonConfig` declara `seasonKey` explicitamente.

### Estado atual

| slot | Genesis (`genesis_legacy`) | Aurora I (`aurora_1_2026`) |
|---|---|---|
| skin | `item_skin_5_002` Vestido Real | `item_skin_aurora_1_2026` |
| border | `item_border_t5_genesis` | — removido, sem arte |
| banner | `item_banner_t5_genesis` | — removido, sem arte |
| ui_skin | `GENESIS` | — nunca existiu |
| insignia | `insignia_season_genesis` | `insignia_season_aurora_1` |

**O catálogo não tem seed.** `sql/items_catalog_seed.sql` foi apagado: estava 5
meses atrasado, sem `mythic` e sem tier 6, e tinha `on conflict do update` — se
alguém o rodasse, rebaixaria a coleção inteira e quebraria o baú Mítico em
silêncio. A fonte de verdade do catálogo é
[`constants/items.ts`](constants/items.ts); as migrações constroem o banco.

Genesis fecha 5/5 no código. Falta a arte das insígnias dos dois lados e a
linha do Genesis no banco — migração
`20260820120000_genesis_season_insignia.sql`.

O mapa `SEASON_COLLECTIONS.genesis_legacy` apontava para `item_border_genesis_01`
e `item_banner_origin_01` — o par **Origin**, que não é Genesis — e ainda tinha
`skin: null`. Corrigido para os itens realmente marcados `genesis_legacy`.

---

## Mítico: raridade e tier próprios

O tier 6 existe para que a separação seja **estrutural**, não por filtro:

- nenhum outro baú sorteia tier 6
- nenhum item de temporada vive fora dele
- a Forja recusa qualquer `isSeasonExclusive`, então mítico não se forja
- reciclagem vale 3.000 fragmentos (`ECONOMY.recycle_values.tier_6`)

Antes disso, itens de temporada eram `epic` e dependiam do filtro
`is_season_exclusive` — que vazava: o baú rolava tier 5, nenhum item de
temporada era tier 5, e o sorteio caía numa rede de segurança que entregava
lendário comum. O baú de temporada era, quatro em cada dez vezes, um baú
lendário com outro nome.

---

## O baú Mítico

Chega por **missão de temporada** e por mais nada. Ciclo não entrega baú de
temporada — o teto do ciclo é o Lendário.

```
missão de temporada  →  1 baú Mítico
baú Mítico           →  100% tier 6, filtrado pela temporada ativa
```

A temporada ativa é passada pelo cliente como `p_season_key` na RPC
`open_chest`, porque quem resolve a temporada por data é o cliente.

**As duas últimas redes de segurança do sorteio ignoram o baú de temporada.**
Elas existem para nenhum baú ficar sem prêmio, mas no Mítico faziam o oposto do
combinado. Se a coleção da temporada acabar ou estiver vazia, o baú **falha e
avisa** em vez de entregar item de fora.

Consequência prática: uma temporada sem itens tier 6 no banco tem baú quebrado.

---

## O modal de virada

| peça | onde |
|---|---|
| portão | [`AuthenticatedApp.tsx`](components/AuthenticatedApp.tsx) — `GlobalSeasonTransitionGate` |
| detecção | [`utils/seasonPresentation.ts`](utils/seasonPresentation.ts) — `resolveRuntimeSeasonTransition` |
| modal | [`components/SeasonDetailModal.tsx`](components/SeasonDetailModal.tsx) — `SeasonTransitionModal` |

Campos que ele lê, e que precisam existir nos dois lados da virada:

```
fromSeason.name · fromSeason.celebrationTitle · fromSeason.celebrationSummary
toSeason.name   · toSeason.description        · toSeason.launchTitle
toSeason.launchSummary
```

Regras de exibição:

- só para quem **já existia antes** da temporada nova (`didProfileExistBeforeSeason`)
- marca visto em duas camadas: flag no perfil e `localStorage`
- não dispara no Genesis, porque ele é o primeiro da lista e não tem anterior

---

## Antes de 22/09/2026 — a virada para Aurora I

O modal está pronto: todos os campos existem nos dois lados. O que falta é a
coleção.

**1. Arte.** Aurora precisa de borda, banner e UI. Os três foram removidos ou
nunca existiram, todos por falta de PNG. Sem arte, a coleção não passa de 2 de 5.

**2. Banco.** A skin da Aurora não existe na tabela `items`, e a insígnia está
em tier 4. Depois que a arte existir e o app estiver atualizado:

```sql
update public.items
set tier = 6, rarity = 'mythic'
where season_key = 'aurora_1_2026';
```

**3. Divergência de desenho.** O `launchRewardItemIds` da Aurora entrega a
insígnia na abertura da temporada. No desenho combinado, a insígnia vem do Selo
— a missão-mestra que pede as 3 jornadas concluídas.

As quests da Aurora e a missão-mestra `sm_aurora_meta_1` já existem e estão
corretas.

---

## Missões e recompensas

As três missões do Genesis (`sm_1` O Peregrino, `sm_2` O Sabio, `sm_3` O Monge)
pagam **baú Mítico** mais o EXP que já davam, via `reward_exp`. A descrição
delas prometia baú desde sempre e entregava só EXP — foi corrigido.

A missão-mestra de cada temporada (`quests_claimed`) entrega o kit direto, sem
sorteio. É o prêmio de quem fecha tudo.

---

## Insígnias

Cinco tipos, com regras diferentes de acumulação:

| tipo | quantas | acumula |
|---|---|---|
| patente | 10, uma por patente | não |
| ciclo | uma, a cada fechamento | **sim** |
| missão | uma, a cada conclusão | **sim** |
| nível | uma, a cada subida | **sim** |
| temporada | uma por temporada | não |

### Como o acúmulo funciona

Três camadas, todas já no lugar:

| camada | onde |
|---|---|
| banco aceita cópias | migração `allow_stackable_honor_inventory` derruba o único `(user_id, item_id)` |
| entrega não converte | `isStackableHonorItem` em [`GameContext.tsx`](contexts/GameContext.tsx) faz a cópia pular a troca por fragmento |
| tela soma | [`Inventory.tsx`](components/Store/Inventory.tsx) agrupa por id e mostra `x3` |

A regra é escrita **pelo lado que não acumula** — patente e temporada. Todo o
resto de honra empilha por padrão. Assim uma insígnia nova de ciclo ou missão já
nasce acumulando, em vez de virar fragmento porque esqueceram de somar o prefixo
dela na lista.

### Baú Épico e Lendário estavam entregando tier 1

Desde a migração de 16/04/2026 os dois ramos acentuados do `case` que normaliza
o tipo do baú estão com **UTF-8 codificado duas vezes**: o arquivo guarda a
forma corrompida no lugar de `épico` e `lendário`.

O cliente manda `'Épico'` — é o valor do `ChestType` em `types.ts`. Em SQL,
`lower('Épico')` dá `épico`, que nunca iguala a forma corrompida. O ramo cai no `else`, e
`v_chest_type` vira `épico` — que também não bate em nenhum ramo do `case` de
tier. Resultado:

| efeito | Épico e Lendário |
|---|---|
| tier sorteado | **1**, o `else` do case |
| fragmentos de bônus | **0**, mesmo motivo |
| pity | não conta, o tipo não está na lista |

Os dois baús mais caros do jogo entregavam item de tier 1 e nenhum fragmento.

Corrigido junto de `20260820130000`, e agora **sem literal acentuado**:
`like '%pico'` e `like 'lend%rio'` não dependem de encoding. O arquivo é ASCII
puro, então não tem como apodrecer de novo.

Toda migração de baú de 20260416 em diante carrega o defeito. A de 20260309 está
correta.

### O pool do baú ignorava metade das exclusões

O sorteio só recusava `is_gold_exclusive` e `is_season_exclusive`. De **122
itens** no pool de baú comum, **42 não deviam estar lá**:

| quantos | motivo | efeito |
|---|---|---|
| 31 | `is_rank_exclusive` | recompensa de patente entregue sem a patente |
| 9 | `category = 'hair'` | o inventário esconde cabelo, o item some |
| 2 | `is_legacy_retired` | item aposentado voltando a circular |
| 0 | `is_premium_only` | zerado hoje, filtrado para não voltar |

Um quarto de tudo que um baú entregava era recompensa de patente. O cabelo era
pior que inútil: entrava em `user_inventory`, aparecia no modal e sumia da tela
do inventário, que filtra a categoria na linha 106 de `Inventory.tsx`.

Fechado em `20260820140000_chest_pool_respects_every_exclusion.sql`. O baú
Mítico fica fora da regra — mantém tier 6 mais `season_key`, porque item de
temporada pode carregar flag de legado sem deixar de ser o prêmio combinado.

### Insígnia não cai de baú comum

O sorteio nunca filtrou por categoria: escolhe um tier e pega qualquer item vivo
daquele tier. Insígnias têm tier como qualquer outro item, então um baú Raro
podia devolver a insígnia de ciclo e um Épico a de patente. O cliente já recusava
isso em `isChestEligibleItem`, mas quem decide o drop é a RPC — o cliente só
desenha o resultado.

O acúmulo piorou o estrago: antes a cópia repetida virava fragmento e o
vazamento passava por dano leve; agora ela empilha, e o baú seria uma segunda
via de coisa que era pra ser merecida.

Corrigido em `20260820130000_honor_insignias_are_earned_not_dropped.sql`, nas
quatro consultas do pool. O baú **Mítico é a exceção** — é justamente por ele
que a insígnia da temporada chega.

`is_quest_exclusive` e `is_report_exclusive` **não existem na tabela `items`** —
só no catálogo do cliente. Filtrar por categoria é o que dá para fazer no banco.

### A insígnia de subida

`insignia_levelup_rara` — "Ouro: Patente Rara" — é de **subida de patente**, não
tem relação com o nível de maestria dos ativos. Ela existia no catálogo e
**ninguém a entregava**: nenhum código fora de `items.ts` citava o id.

Agora sai junto da insígnia única daquela patente, nos dois caminhos que já
detectam a subida. São duas por subida, com papéis diferentes: a da patente é
uma de cada, esta acumula.

Segue marcada `isRankExclusive` — a flag é lida por `isChestEligibleItem` e é o
que a mantém fora do sorteio dos baús. Ela se ganha subindo, não abrindo.
