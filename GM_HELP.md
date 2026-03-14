# GM Help

Manual operacional do catalogo de itens do Glyph.

## O que este arquivo governa

Use este arquivo para responder rapido estas perguntas:

- Onde o catalogo real de itens vive?
- Onde eu mexo sem baguncar o sistema?
- O que precisa ser atualizado quando um item muda?
- Como verificar no banco se um item foi entregue?

## Fonte de verdade

- Catalogo vivo: `constants/items.ts`
- Montagem e consumo: `constants/GMboard.ts`
- Catalogo amplo e economia: `LOJA.MD`
- Manual operacional rapido: `GM_HELP.md`

Regra canonica:
- `items.ts` = fonte de verdade do item
- `GMboard.ts` = so consome e organiza
- `LOJA.MD` = documenta o catalogo visivel e a economia
- `GM_HELP.md` = procedimento operacional e manutencao

Nao edite item bruto dentro do `GMboard.ts`.

## Protocolo de manutencao do catalogo

Toda vez que um item for criado, removido, renomeado ou mudar de regra:

1. atualizar `constants/items.ts`
2. atualizar `GM_HELP.md` com a mudanca operacional
3. atualizar `LOJA.MD` se a mudanca afetar catalogo visivel, economia, bau, craft ou drop
4. se a mudanca depender de banco, salvar o SQL em `sql/` e anotar aqui
5. rodar `npm run build`

Regra pratica:
- mudou so arte, nome, tier, rarity, asset, categoria ou id -> atualizar `items.ts` e `GM_HELP.md`
- mudou loja, drop, bau, craft, recompensa, economia ou visibilidade -> atualizar tambem `LOJA.MD`
- mudou entrega via banco, reward pack, GM inventory ou migracao -> criar SQL em `sql/` e referenciar aqui

## Onde editar cada coisa

### Item comum do catalogo

Edite `constants/items.ts`.

Builders mais usados:
- `avatarItem(...)`
- `glyphCatalogItem(...)`
- `interfaceCatalogItem(...)`
- `themeCatalogItem(...)`
- `catalogItem(...)`

### Season, quests e missoes

Edite `constants/seasonContent.ts`.

### Montagem do sistema

Use `constants/GMboard.ts` apenas quando precisar mudar montagem, agrupamento ou consumo do catalogo.

## Regras do catalogo

### Categorias que normalmente exigem asset

- `skin`
- `artifact`
- `aura`
- `border`
- `banner`
- `glyph`
- `orb`
- `plate`

### Categorias com pipeline especial

- `hair` nao entra por `items.ts`; usa `constants/skins.ts` e `components/CanvasAvatar.tsx`
- `ui_skin` pode existir sem asset final
- `chest` nao usa a mesma logica de pendencia de arte

### Helpers de asset

- `avatarPngAsset('arquivo')`
- `avatarAsset('ARQUIVO.png')`
- `glyphAsset('ARQUIVO.png')`
- `interfaceAsset('pasta/arquivo.png')`
- `rootImageAsset('arquivo.jpg')`

## Checklist antes de fechar mudanca em item

- id unico e coerente
- categoria correta
- tier correto
- rarity correta
- asset correto, se aplicavel
- impacto em unlock/inventory/reward entendido
- `GM_HELP.md` atualizado
- `LOJA.MD` atualizado, se necessario
- `npm run build` ok

## SQLs uteis de verificacao

### Ver se um item esta no inventario do GM

```sql
select
  up.id,
  up.nickname,
  up.role,
  ui.item_id
from public.user_profiles up
left join public.user_inventory ui
  on ui.user_id = up.id
 and ui.item_id = 'ITEM_ID_AQUI'
where lower(coalesce(up.role, 'user')) in ('gm', 'admin', 'admin_gm')
order by up.role, up.nickname;
```

### Ver se o item foi desbloqueado no profile

```sql
select
  up.nickname,
  up.role,
  coalesce((up.unlocked_items -> 'artifacts' ->> 'ITEM_ID_AQUI')::boolean, false) as unlocked
from public.user_profiles up
where lower(coalesce(up.role, 'user')) in ('gm', 'admin', 'admin_gm')
order by up.role, up.nickname;
```

A chave `artifacts` muda conforme a categoria. Exemplos:
- `artifacts`
- `orbs`
- `plates`
- `borders`
- `banners`
- `glyphs`
- `hairStyles`
- `ui_skins`

## Mudancas recentes que precisam continuar documentadas

### 2026-03-13 - Item novo

- `item_artifact_4_004` = `Manta`
- arquivo: `artefato_t4_manta.png`
- catalogo: `constants/items.ts`
- GM pode receber via SQL manual, se necessario

### 2026-03-13 - Itens vanguarda

- `item_border_vanguarda_01`
- `item_banner_vanguarda_01`
- assets esperados:
  - `borders/borda_vanguarda.png`
  - `banners/banner_vanguarda.png`

### 2026-03-13 - Season / Genesis alinhados

- item_skin_season_001 continua como item de Season
- item_border_genesis_01 agora e item de Season/Quest
- item_banner_origin_01 agora e item de Season/Quest
- item_border_t5_genesis e item_banner_t5_genesis continuam na trilha lendaria comum, fora da pool Season

### 2026-03-13 - Bootstrap de rewards de player novo

Arquivos:
- `sql/new_player_bootstrap_rewards.sql`
- `supabase/migrations/20260313_add_new_player_bootstrap_rewards.sql`

Regra viva:
- usuario normal -> starter base + 1 bau `Comum`
- usuario `ouro-*` -> starter base + 1 bau `Incomum` + 50 gold + pack vanguarda

Pack vanguarda:
- `item_border_vanguarda_01`
- `item_banner_vanguarda_01`
- 3 artefatos aleatorios
- 1 orbe aleatorio
- 1 plate aleatoria
- `dreads`
- `mullet_topete`

Nada auto-equipa.

## Regra final

Se eu mudar item e nao atualizar `GM_HELP.md`, o manual ficou desatualizado.
Entao a manutencao canonica do catalogo sempre fecha em 3 lugares:

1. `constants/items.ts`
2. `GM_HELP.md`
3. `LOJA.MD` quando a mudanca afetar catalogo visivel ou economia



## 2026-03-13 - Loja low-ticket ativa

Itens liberados para venda por ouro baixo na loja:
- item_skin_1_003 -> 5 ouro
- item_skin_2_003 -> 9 ouro
- item_orb_2_003 -> 12 ouro
- item_skin_3_001 -> 15 ouro
- item_banner_imparavel -> 18 ouro
- item_skin_3_002 -> 22 ouro
- item_skin_3_003 -> 26 ouro
- item_orb_3_001 -> 29 ouro
- item_banner_t3_mistico -> 32 ouro
- item_banner_lendaviva -> 40 ouro
- item_banner_t4_oraculo -> 48 ouro
- item_skin_4_001 -> 50 ouro

Regras:
- Fonte da verdade continua em constants/items.ts via costGold.
- A vitrine da loja le apenas itens explicitamente curados na GoldStore.
- Nao ha SQL novo para esses itens; a compra envia item_id + costGold para a RPC buy_store_item.
