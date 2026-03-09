# GM Help

Guia curto para mexer no conteudo do Glyph sem reabrir a duplicacao antiga do `GMboard`.

## Onde editar

- Itens: [C:\Users\Afonso\Downloads\GOL1.006\constants\items.ts](C:\Users\Afonso\Downloads\GOL1.006\constants\items.ts)
- Seasons, quests e missoes: [C:\Users\Afonso\Downloads\GOL1.006\constants\seasonContent.ts](C:\Users\Afonso\Downloads\GOL1.006\constants\seasonContent.ts)
- Montagem do sistema: [C:\Users\Afonso\Downloads\GOL1.006\constants\GMboard.ts](C:\Users\Afonso\Downloads\GOL1.006\constants\GMboard.ts)

Regra:
- `items.ts` = catalogo editavel
- `seasonContent.ts` = conteudo editavel de season
- `GMboard.ts` = so consome e monta

Nao edite o conteudo bruto de season dentro do `GMboard`.

## Como adicionar item

### Builders disponiveis em `items.ts`

- `avatarItem(...)`
- `glyphCatalogItem(...)`
- `interfaceCatalogItem(...)`
- `themeCatalogItem(...)`
- `catalogItem(...)`

### Helpers de URL

- `avatarAsset('ARQUIVO.png')`
- `glyphAsset('ARQUIVO.png')`
- `interfaceAsset('pasta/arquivo.png')`
- `rootImageAsset('arquivo.jpg')`

### Regra simples

- Se o item usa PNG/JPG:
  - passe `asset: 'NOME_DO_ARQUIVO.png'`
- Se a categoria exige imagem e voce nao passar `asset`:
  - o item entra automaticamente como pendencia de arte
- `ui_skin` pode ficar so com emoji
- `hair` usa pipeline proprio, nao esse catalogo

### Categorias que exigem PNG

- `skin`
- `artifact`
- `aura`
- `border`
- `banner`
- `glyph`
- `orb`
- `plate`

### Categorias que nao entram como pendencia automatica

- `ui_skin`
- `hair`
- `insignia`
- `insignias`
- `chest`

### Exemplo 1: skin com PNG

```ts
avatarItem('skin', {
  id: 'item_skin_x_001',
  name: 'Meu Visual',
  tier: 3,
  rarity: 'rare',
  icon: '🧥',
  asset: 'SKIN_X_MEU_VISUAL.png',
});
```

### Exemplo 2: borda sem PNG ainda

```ts
catalogItem('border', {
  id: 'item_border_x_001',
  name: 'Minha Borda',
  tier: 2,
  rarity: 'uncommon',
  icon: '🛡️',
});
```

Resultado:
- aparece no codigo
- fica fora do catalogo vivo
- entra automatico na lista de pendencia de PNG

### Exemplo 3: tema

```ts
catalogItem('ui_skin', {
  id: 'SOLAR',
  name: 'Tema: Solar',
  tier: 4,
  rarity: 'epic',
  icon: '☀️',
});
```

Se tiver fundo real:

```ts
themeCatalogItem({
  id: 'SOLAR',
  name: 'Tema: Solar',
  tier: 4,
  rarity: 'epic',
  icon: '☀️',
  asset: 'solar.jpg',
});
```

## Como adicionar season

Edite [C:\Users\Afonso\Downloads\GOL1.006\constants\seasonContent.ts](C:\Users\Afonso\Downloads\GOL1.006\constants\seasonContent.ts)

### Blocos principais

- `ACTIVE_SEASON_ID`
- `SEASONS`
- `GM_SEASONS`
- `GM_SEASON_MISSIONS`
- `GM_SEASON_QUESTS`

### O que cada um faz

- `SEASONS`
  - season usada no loop principal
  - quests do sistema
- `GM_SEASONS`
  - seasons do painel GM/admin
- `GM_SEASON_MISSIONS`
  - missoes da season do GM
- `GM_SEASON_QUESTS`
  - quests da season no painel GM

### Regra pratica

Se for trocar a season viva do jogo:
1. crie a nova entrada em `SEASONS`
2. mude `ACTIVE_SEASON_ID`
3. alinhe `GM_SEASONS`, `GM_SEASON_MISSIONS` e `GM_SEASON_QUESTS` se quiser refletir isso no painel GM

## Pipeline especial de cabelo

Nao entra por `items.ts`.

Arquivos:
- [C:\Users\Afonso\Downloads\GOL1.006\constants\skins.ts](C:\Users\Afonso\Downloads\GOL1.006\constants\skins.ts)
- [C:\Users\Afonso\Downloads\GOL1.006\components\CanvasAvatar.tsx](C:\Users\Afonso\Downloads\GOL1.006\components\CanvasAvatar.tsx)

Regra:
- cabelo usa arquivo tipo `.png.png`
- fica na pasta `avatars/hair`

## Como saber o que ainda falta

Em `items.ts`:
- `ITEM_IDS_PENDING_ART`
- `getPendingArtItems()`

Esses pontos agora seguem a regra real:
- so entra como pendencia quem precisa de PNG e ainda nao tem `imageUrl`
- `theme` e `hair` nao entram nisso

## Checklist rapido antes de fechar

Se mexeu em item ou season:

```powershell
npm run type-check
npm run test
npm run build
```

## Erros comuns

### 1. Colocar item no lugar errado

- item = `items.ts`
- season = `seasonContent.ts`

### 2. Criar item com PNG e esquecer `asset`

Se esquecer, ele vai ficar escondido como pendencia de arte.

### 3. Editar `GMboard.ts` para mudar conteudo

Evite isso.
Ele deve continuar sendo so camada de montagem.

### 4. Tema sem PNG achando que esta quebrado

`ui_skin` pode continuar so com emoji.
Isso e valido.
