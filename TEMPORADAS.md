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
| insignia | — falta criar | `insignia_season_aurora_1` |

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

**Pendência conhecida:** a entrega usa `grantInventoryItem`, e o inventário
guarda um registro por item. Ganhar a mesma insígnia de ciclo duas vezes hoje
vira duplicata e converte em fragmento — não acumula. Acumular exige contador,
não segunda cópia.
