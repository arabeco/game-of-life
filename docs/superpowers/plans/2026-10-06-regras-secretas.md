# As 20 regras secretas — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ligar as 10 regras secretas declaradas e acrescentar 10 novas: medir, entregar o prêmio pelo modal de recompensa normal ("Conquista secreta"), mostrar Missões → Segredos, e tirar as peças de regra da loja e do baú.

**Architecture:** As regras moram só em `constants/desbloqueiosPorRegra.ts` e são avaliadas por uma função pura em TypeScript (`utils/medidorDeSegredos.ts`). O banco só entrega os números, por uma função de leitura (`minhas_marcas_secretas()`). Um hook no app chama a função, avalia, entrega pelo caminho de sempre e põe um modal só na fila que já existe.

**Tech Stack:** React + TypeScript, Supabase (Postgres, RPC), testes `node tests/*.regression.mjs` com esbuild, `npm run sql:checa` (PGlite).

Desenho: `docs/superpowers/specs/2026-10-06-regras-secretas-design.md`.

---

## Mapa dos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `constants/items.ts` | `isRuleExclusive`; as 20 peças de regra; as 15 novas sem arte |
| `constants/goldCatalog.ts` | as 18 peças de regra saem da loja |
| `constants/desbloqueiosPorRegra.ts` | as 20 regras, com `id` e os tipos de condição novos |
| `utils/medidorDeSegredos.ts` (novo) | fatos + regras → regras cumpridas; montagem do modal |
| `hooks/useConquistasSecretas.ts` (novo) | chama o banco, avalia, entrega, enfileira |
| `components/SegredosSection.tsx` (novo) | Missões → Segredos · N de 20 |
| `components/AchievementModal.tsx` | título "Conquista secreta" no modal de missão |
| `components/AuthenticatedApp.tsx` | monta o hook, pausado durante o relatório |
| `views/SeasonView.tsx` | monta a seção Segredos |
| `contexts/GameContext.tsx` + `types.ts` | `arenasFechadasPorArea` no relatório do ciclo |
| `tools/generate-items-sql.mjs` | peça de regra vira `is_rank_exclusive` no banco |
| `scripts/sql-andaime.sql` | tipos de produção e as tabelas que a função lê |
| `supabase/migrations/20261006180000_regras_secretas.sql` (novo) | itens no banco + a função de leitura |
| `supabase/CHECK-marcas-secretas.sql` (novo) | os números da conta principal |
| `tests/regras-de-desbloqueio.regression.mjs` | 20 regras, exclusividade, par com mesma raridade |
| `tests/medidor-de-segredos.regression.mjs` (novo) | avaliação, arte, modal, SQL e fecho do ciclo |
| `tests/item-art.regression.mjs` | a lista de pendentes de arte ganha as 15 novas |

---

### Task 1: As peças de regra saem da loja e do baú

**Files:**
- Modify: `constants/items.ts` (interface `ItemDef`, `isGoldStorePurchasableItem`, `isChestEligibleItem`, bloco de bordas e banners)
- Modify: `constants/goldCatalog.ts` (`ACTIVE_GOLD_ITEM_PRICE_BY_ID`, `ACTIVE_GOLD_STORE_ITEMS`)
- Test: `tests/regras-de-desbloqueio.regression.mjs`

- [ ] **Step 1: Acrescentar o teste que falha** — no fim de `tests/regras-de-desbloqueio.regression.mjs`, antes do `console.log` final:

```js
// --- 6. peca de regra so sai pela regra ------------------------------------
//
// Se custa 10 de ouro, a regra secreta nao vale nada. Toda peca de regra e
// marcada como exclusiva, fica fora do bau e fora da lista da loja, e o par
// borda + banner tem a mesma raridade.
{
    const { ACTIVE_GOLD_STORE_ITEM_IDS } = await empacota('constants/goldCatalog.ts', 'regras-loja.mjs');
    const naLoja = new Set(ACTIVE_GOLD_STORE_ITEM_IDS);
    for (const regra of REGRAS_DE_DESBLOQUEIO) {
        const defs = regra.itens.map((id) => ITEMS_DB.find((i) => i.id === id));
        for (const [indice, def] of defs.entries()) {
            const id = regra.itens[indice];
            assert.ok(def, `${regra.nome}: ${id} nao existe no catalogo`);
            assert.equal(def.isRuleExclusive, true, `${id} nao esta marcado como exclusivo de regra`);
            assert.ok(!def.costGold, `${id} ainda tem preco em ouro`);
            assert.ok(!naLoja.has(id), `${id} continua na lista da loja`);
            assert.equal(isChestEligibleItem(def), false, `${id} ainda cai de bau`);
        }
        const raridades = new Set(defs.map((d) => d.rarity));
        assert.equal(raridades.size, 1, `${regra.nome}: o par tem raridades diferentes (${[...raridades].join(', ')})`);
    }
}
```

E no topo, onde o teste já empacota `constants/items.ts`, passar a ler também `isChestEligibleItem` (acrescentar ao destructuring existente).

- [ ] **Step 2: Rodar e ver falhar**

Run: `node tests/regras-de-desbloqueio.regression.mjs`
Expected: FAIL com `item_border_1_002 nao esta marcado como exclusivo de regra`

- [ ] **Step 3: `isRuleExclusive` no catálogo** — em `constants/items.ts`:

Na interface `ItemDef`, depois de `isReportExclusive`:

```ts
    isRuleExclusive?: boolean; // Items granted ONLY by a secret rule (constants/desbloqueiosPorRegra) - blocked from chests and store
```

Em `isGoldStorePurchasableItem`, depois de `&& !item.isReportExclusive`:

```ts
        && !item.isRuleExclusive
```

Em `isChestEligibleItem`, depois de `&& !item.isGmExclusive`:

```ts
        && !item.isRuleExclusive
```

- [ ] **Step 4: As 20 peças** — no bloco `// --- BORDAS ---` e `// --- BANNERS ---`, cada peça de regra perde `costGold` (e `isRankExclusive`, no Veterano e na Lenda Viva) e ganha `isRuleExclusive: true`. Três mudam de raridade e vão para a seção do tier novo:

```ts
    // Disciplinado: era T1 comum
    { id: 'item_border_1_002', name: 'Disciplinado', category: 'border', tier: 2, rarity: 'uncommon', icon: '📘', imageUrl: `${INTERFACE_BASE_URL}/borda_disciplinado.png`, isRuleExclusive: true },
    { id: 'item_banner_disciplinado', name: 'Disciplinado', category: 'banner', tier: 2, rarity: 'uncommon', icon: '📘', imageUrl: `${INTERFACE_BASE_URL}/banner_disciplinado.png`, isRuleExclusive: true },
    // Oraculo: era T4 epico
    { id: 'item_border_t4_oraculo', name: 'Oráculo', category: 'border', tier: 3, rarity: 'rare', icon: '👁️', imageUrl: `${INTERFACE_BASE_URL}/borda_t4_oraculo.png`, isRuleExclusive: true },
    { id: 'item_banner_t4_oraculo', name: 'Oráculo', category: 'banner', tier: 3, rarity: 'rare', icon: '👁️', imageUrl: `${INTERFACE_BASE_URL}/banner_t4_oraculo.png`, isRuleExclusive: true },
    // Transcendente: a borda era T3 rara, o banner ja era T4 epico
    { id: 'item_border_t3_transcendente', name: 'Transcendente', category: 'border', tier: 4, rarity: 'epic', icon: '✨', imageUrl: `${INTERFACE_BASE_URL}/borda_t3_transcendente.png`, isRuleExclusive: true },
```

As outras quinze ficam com tier e raridade de hoje — `item_border_2_001`, `item_border_t2_veterano`, `item_border_3_001`, `item_border_t3_mistico`, `item_border_4_001`, `item_border_t4_celestial`, `item_border_t4_guardia`, `item_banner_popular`, `item_banner_t2_veterano`, `item_banner_imparavel`, `item_banner_t3_mistico`, `item_banner_lendaviva`, `item_banner_t4_celestial`, `item_banner_t4_guardia`, `item_banner_t4_transcendente` — trocando o fim da linha, por exemplo:

```ts
    { id: 'item_border_2_001', name: 'Popular', category: 'border', tier: 2, rarity: 'uncommon', icon: '🌟', imageUrl: `${INTERFACE_BASE_URL}/borda_popular.png`, isRuleExclusive: true },
```

No topo do bloco de bordas, o comentário:

```ts
    // --- BORDAS ---
    // Peca com isRuleExclusive sai SO pela regra secreta de
    // constants/desbloqueiosPorRegra.ts: fora do bau e da loja. A raridade e a
    // dificuldade da regra, e o par borda + banner tem sempre a mesma.
```

- [ ] **Step 5: A loja** — em `constants/goldCatalog.ts`, apagar de `ACTIVE_GOLD_ITEM_PRICE_BY_ID` e de `ACTIVE_GOLD_STORE_ITEMS` as linhas destes 18 ids: `item_border_1_002`, `item_banner_disciplinado`, `item_border_2_001`, `item_banner_popular`, `item_banner_t2_veterano`, `item_border_3_001`, `item_banner_imparavel`, `item_border_t3_mistico`, `item_banner_t3_mistico`, `item_border_t3_transcendente`, `item_border_t4_celestial`, `item_banner_lendaviva`, `item_banner_t4_celestial`, `item_border_t4_guardia`, `item_banner_t4_guardia`, `item_border_t4_oraculo`, `item_banner_t4_oraculo`, `item_banner_t4_transcendente`. Antes de `ACTIVE_GOLD_STORE_ITEMS`:

```ts
// Borda e banner nao estao aqui de proposito: desde 06/10/2026 cada um sai so
// pela regra secreta de constants/desbloqueiosPorRegra.ts.
```

- [ ] **Step 6: Rodar o teste e os vizinhos**

Run: `node tests/regras-de-desbloqueio.regression.mjs && node tests/item-art.regression.mjs && npx tsc --noEmit -p .`
Expected: os dois PASS e o tsc sem saída.

- [ ] **Step 7: Commit**

```bash
git add constants/items.ts constants/goldCatalog.ts tests/regras-de-desbloqueio.regression.mjs
git commit -m "feat: borda e banner de regra saem da loja e do bau"
```

---

### Task 2: As 20 regras, com id e os tipos novos

**Files:**
- Modify: `constants/desbloqueiosPorRegra.ts`
- Modify: `constants/items.ts` (as 15 peças novas)
- Modify: `tests/item-art.regression.mjs` (lista de pendentes)
- Test: `tests/regras-de-desbloqueio.regression.mjs`

- [ ] **Step 1: Teste que falha** — em `tests/regras-de-desbloqueio.regression.mjs`, antes do `console.log` final:

```js
// --- 7. as vinte, cada uma com id proprio ----------------------------------
//
// O id e o que fica gravado em `segredo:<id>` no perfil. Trocar o id de uma
// regra ja descoberta faria ela voltar a ser descoberta.
{
    assert.equal(REGRAS_DE_DESBLOQUEIO.length, 20, 'sao vinte regras');
    const ids = REGRAS_DE_DESBLOQUEIO.map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length, 'duas regras com o mesmo id');
    for (const id of ids) assert.match(id, /^[a-z]+(-[a-z]+)*$/, `id fora do formato: ${id}`);
    const skins = REGRAS_DE_DESBLOQUEIO.filter((r) => r.itens.length === 1).map((r) => r.nome).sort();
    assert.deepEqual(skins, ['Ancião', 'Campeão', 'Escriba', 'Imperador', 'Maratona'], 'mudou quem da skin');
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node tests/regras-de-desbloqueio.regression.mjs`
Expected: FAIL com `sao vinte regras`

- [ ] **Step 3: Os tipos de condição novos** — em `CondicaoDeDesbloqueio`, depois de `acoes_concluidas`:

```ts
    /** N paginas do diario com pelo menos 100 caracteres. */
    | { tipo: 'paginas_do_diario'; quantas: number }
    /** Um dia com N acoes concluidas. */
    | { tipo: 'dia_com_acoes'; quantas: number }
    /** N ciclos fechados na vida toda. */
    | { tipo: 'ciclos_fechados'; quantos: number }
    /** N competicoes vencidas. */
    | { tipo: 'competicoes_vencidas'; quantas: number }
    /** Humor registrado em N dias diferentes. */
    | { tipo: 'dias_de_humor'; dias: number }
    /** N acoes marcadas entre 04:00 e 06:59 dentro de 7 dias seguidos. */
    | { tipo: 'acoes_antes_das_sete_numa_semana'; quantas: number }
    /** N dias seguidos com acao concluida nas cinco areas. */
    | { tipo: 'dias_seguidos_com_as_cinco_areas'; dias: number }
    /** Um ciclo que selou esta nota, ou acima. */
    | { tipo: 'ciclo_com_nota'; nota: 'A' | 'S' | 'SS' | 'SSS' };
```

E em `RegraDeDesbloqueio`, antes de `nome`:

```ts
    /** O que fica gravado como `segredo:<id>` no perfil. Nunca muda. */
    id: string;
```

`missoes_individuais` ganha no comentário: *"Sem contar a missao inicial do onboarding (pacto `primeira`)."*

- [ ] **Step 4: As vinte** — cada regra existente ganha `id` (`'disciplinado'`, `'popular'`, `'veterano'`, `'imparavel'`, `'mistico'`, `'transcendente'`, `'celestial'`, `'guardia'`, `'oraculo'`, `'lenda-viva'`), e entram as dez novas no fim da lista:

```ts
    {
        id: 'escriba',
        nome: 'Escriba',
        itens: ['item_skin_1_012'],
        condicao: { tipo: 'paginas_do_diario', quantas: 10 },
        frase: 'Dez páginas escritas no seu diário.',
    },
    {
        id: 'maratona',
        nome: 'Maratona',
        itens: ['item_skin_2_010'],
        condicao: { tipo: 'dia_com_acoes', quantas: 12 },
        frase: 'Doze ações num dia só.',
    },
    {
        id: 'anciao',
        nome: 'Ancião',
        itens: ['item_skin_3_009'],
        condicao: { tipo: 'ciclos_fechados', quantos: 12 },
        frase: 'Doze ciclos fechados.',
    },
    {
        id: 'campeao',
        nome: 'Campeão',
        itens: ['item_skin_4_005'],
        condicao: { tipo: 'competicoes_vencidas', quantas: 3 },
        frase: 'Três competições vencidas.',
    },
    {
        id: 'imperador',
        nome: 'Imperador',
        itens: ['item_skin_5_003'],
        condicao: { tipo: 'acoes_concluidas', quantas: 5000 },
        frase: 'Cinco mil ações concluídas.',
    },
    {
        id: 'sereno',
        nome: 'Sereno',
        itens: ['item_border_t2_sereno', 'item_banner_t2_sereno'],
        condicao: { tipo: 'dias_de_humor', dias: 30 },
        frase: 'Trinta dias olhando para como você está.',
    },
    {
        id: 'alvorada',
        nome: 'Alvorada',
        itens: ['item_border_t3_alvorada', 'item_banner_t3_alvorada'],
        condicao: { tipo: 'acoes_antes_das_sete_numa_semana', quantas: 10 },
        frase: 'Dez ações antes das sete, numa semana só.',
    },
    {
        id: 'prisma',
        nome: 'Prisma',
        itens: ['item_border_t3_prisma', 'item_banner_t3_prisma'],
        condicao: { tipo: 'dias_seguidos_com_as_cinco_areas', dias: 14 },
        frase: 'Catorze dias seguidos tocando as cinco áreas.',
    },
    {
        id: 'profeta',
        nome: 'Profeta',
        itens: ['item_border_t4_profeta', 'item_banner_t4_profeta'],
        condicao: { tipo: 'missoes_individuais', quantas: 5 },
        frase: 'Cinco missões do Oráculo, cumpridas.',
    },
    {
        id: 'pedra-da-lua',
        nome: 'Pedra da Lua',
        itens: ['item_border_t5_pedra_da_lua', 'item_banner_t5_pedra_da_lua'],
        condicao: { tipo: 'ciclo_com_nota', nota: 'SSS' },
        frase: 'Um ciclo SSS. Poucos chegam aqui.',
    },
```

O comentário de abertura do arquivo passa de "AS DEZ REGRAS" para "AS VINTE REGRAS", dizendo que as dez de 06/10 dão skin ou par novo, e que "o medidor e a outra metade, e ainda nao existe" vira um apontamento para `utils/medidorDeSegredos.ts`.

- [ ] **Step 5: As 15 peças novas** — em `constants/items.ts`, logo antes de `// --- GLIFOS ---`:

```ts
    // --- PREMIOS DAS REGRAS SECRETAS DE 06/10/2026 ---
    // Arte encomendada em docs/2026-10-06-handoff-arte-das-regras-secretas.md.
    // Nascem SEM imageUrl de proposito: peca sem PNG fica escondida do catalogo
    // (isItemPendingArt), e a regra que a entrega so liga quando o premio
    // inteiro aparece. Quando a arte chegar, o imageUrl entra aqui e a regra
    // destrava para quem ja tinha cumprido.
    { id: 'item_skin_1_012', name: 'Escriba', category: 'skin', tier: 1, rarity: 'common', icon: '📜', isRuleExclusive: true },
    { id: 'item_skin_2_010', name: 'Maratona', category: 'skin', tier: 2, rarity: 'uncommon', icon: '🏅', isRuleExclusive: true },
    { id: 'item_skin_3_009', name: 'Ancião', category: 'skin', tier: 3, rarity: 'rare', icon: '📿', isRuleExclusive: true },
    { id: 'item_skin_4_005', name: 'Campeão', category: 'skin', tier: 4, rarity: 'epic', icon: '🏆', isRuleExclusive: true },
    { id: 'item_skin_5_003', name: 'Imperador', category: 'skin', tier: 5, rarity: 'legendary', icon: '🦅', isRuleExclusive: true },
    { id: 'item_border_t2_sereno', name: 'Sereno', category: 'border', tier: 2, rarity: 'uncommon', icon: '🌊', isRuleExclusive: true },
    { id: 'item_banner_t2_sereno', name: 'Sereno', category: 'banner', tier: 2, rarity: 'uncommon', icon: '🌊', isRuleExclusive: true },
    { id: 'item_border_t3_alvorada', name: 'Alvorada', category: 'border', tier: 3, rarity: 'rare', icon: '🌅', isRuleExclusive: true },
    { id: 'item_banner_t3_alvorada', name: 'Alvorada', category: 'banner', tier: 3, rarity: 'rare', icon: '🌅', isRuleExclusive: true },
    { id: 'item_border_t3_prisma', name: 'Prisma', category: 'border', tier: 3, rarity: 'rare', icon: '🔷', isRuleExclusive: true },
    { id: 'item_banner_t3_prisma', name: 'Prisma', category: 'banner', tier: 3, rarity: 'rare', icon: '🔷', isRuleExclusive: true },
    { id: 'item_border_t4_profeta', name: 'Profeta', category: 'border', tier: 4, rarity: 'epic', icon: '🧿', isRuleExclusive: true },
    { id: 'item_banner_t4_profeta', name: 'Profeta', category: 'banner', tier: 4, rarity: 'epic', icon: '🧿', isRuleExclusive: true },
    { id: 'item_border_t5_pedra_da_lua', name: 'Pedra da Lua', category: 'border', tier: 5, rarity: 'legendary', icon: '🌙', isRuleExclusive: true },
    { id: 'item_banner_t5_pedra_da_lua', name: 'Pedra da Lua', category: 'banner', tier: 5, rarity: 'legendary', icon: '🌙', isRuleExclusive: true },
```

Antes, confirmar que nenhum id colide: `grep -c "item_skin_1_012\|item_skin_2_010\|item_skin_3_009\|item_skin_4_005\|item_skin_5_003" constants/items.ts` deve dar 0.

- [ ] **Step 6: A lista de pendentes de arte** — em `tests/item-art.regression.mjs`, a lista `conhecidos` passa a ser:

```js
    const conhecidos = [
        'item_banner_t2_sereno',
        'item_banner_t3_alvorada',
        'item_banner_t3_prisma',
        'item_banner_t4_profeta',
        'item_banner_t5_pedra_da_lua',
        'item_border_4_002',        // Borda Soberano, epico
        'item_border_t2_sereno',
        'item_border_t3_alvorada',
        'item_border_t3_prisma',
        'item_border_t4_profeta',
        'item_border_t5_pedra_da_lua',
        'item_skin_1_012',
        'item_skin_2_010',
        'item_skin_3_009',
        'item_skin_4_005',
        'item_skin_5_003',
    ];
```

com o comentário acima dela dizendo que os quinze de regra secreta estão encomendados em `docs/2026-10-06-handoff-arte-das-regras-secretas.md`, e a Borda Soberano em `docs/2026-10-06-handoff-fundos-de-patente-e-borda-soberano.md`.

- [ ] **Step 7: Rodar**

Run: `node tests/regras-de-desbloqueio.regression.mjs && node tests/item-art.regression.mjs && npx tsc --noEmit -p .`
Expected: PASS, PASS, tsc sem saída.

- [ ] **Step 8: Commit**

```bash
git add constants/desbloqueiosPorRegra.ts constants/items.ts tests/regras-de-desbloqueio.regression.mjs tests/item-art.regression.mjs
git commit -m "feat: as vinte regras secretas, e os quinze premios novos esperando arte"
```

---

### Task 3: O medidor — fatos + regras → o que destravou

**Files:**
- Create: `utils/medidorDeSegredos.ts`
- Create: `tests/medidor-de-segredos.regression.mjs`

- [ ] **Step 1: O teste** — `tests/medidor-de-segredos.regression.mjs`:

```js
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * O MEDIDOR DAS REGRAS SECRETAS.
 *
 * As regras moram em constants/desbloqueiosPorRegra.ts e so ali. O banco entrega
 * os numeros (minhas_marcas_secretas) e este medidor decide. Se a decisao
 * morasse tambem no SQL, seriam duas copias da mesma regra — e a historia deste
 * app e feita de duas copias que discordam.
 */
const raiz = fileURLToPath(new URL('..', import.meta.url));
const pacote = await build({
    entryPoints: [join(raiz, 'utils/medidorDeSegredos.ts')],
    bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent',
});
const pasta = mkdtempSync(join(tmpdir(), 'glyph-medidor-'));
const arquivo = join(pasta, 'medidor.mjs');
writeFileSync(arquivo, pacote.outputFiles[0].text);
const { condicaoCumprida, novasConquistas, lerDescobertas, montarModalDeSegredos, MARCA_DE_SEGREDO } =
    await import(pathToFileURL(arquivo).href);
const { REGRAS_DE_DESBLOQUEIO } = await import(pathToFileURL(arquivo).href);

const ciclo = (extra = {}) => ({ fim: '2026-09-20', dias: 7, nota: 'A', feitas: 66, planejadas: 66, arenasFechadasPorArea: null, ...extra });
const vazio = {
    acoesConcluidas: 0, maiorSequencia: 0, maiorDia: 0, diasSeguidosComCincoAreas: 0,
    maiorSemanaAntesDasSete: 0, paginasDoDiario: 0, diasDeHumor: 0, amizades: 0,
    competicoesVencidas: 0, missoesDoOraculo: 0, mentoriasAteOFim: 0, ciclos: [],
};
const regra = (id) => REGRAS_DE_DESBLOQUEIO.find((r) => r.id === id);
const cumpre = (id, fatos) => condicaoCumprida(regra(id).condicao, { ...vazio, ...fatos });

// ------------------------------------------------ 1. cada limiar, na beira
assert.equal(cumpre('disciplinado', { ciclos: [ciclo()] }), true, 'ciclo 100% nota A');
assert.equal(cumpre('disciplinado', { ciclos: [ciclo({ nota: 'B' })] }), false, '100% com nota B nao basta');
assert.equal(cumpre('disciplinado', { ciclos: [ciclo({ feitas: 65 })] }), false, '65 de 66 nao e sem falha');
assert.equal(cumpre('disciplinado', { ciclos: [ciclo({ planejadas: 0, feitas: 0 })] }), false, 'ciclo vazio nao conta');
assert.equal(cumpre('veterano', { ciclos: [ciclo({ fim: '2026-05-10' }), ciclo({ fim: '2026-09-20' }), ciclo({ fim: '2026-10-04' })] }), true);
assert.equal(cumpre('veterano', { ciclos: [ciclo({ fim: '2026-09-13' }), ciclo({ fim: '2026-09-20' })] }), false);
assert.equal(cumpre('imparavel', { maiorSequencia: 30 }), true);
assert.equal(cumpre('imparavel', { maiorSequencia: 29 }), false);
assert.equal(cumpre('mistico', { ciclos: [ciclo({ arenasFechadasPorArea: { proposito: 2 } })] }), true);
assert.equal(cumpre('mistico', { ciclos: [ciclo({ arenasFechadasPorArea: { proposito: 1, saude: 3 } })] }), false);
assert.equal(cumpre('celestial', { ciclos: [ciclo({ arenasFechadasPorArea: { proposito: 1, relacoes: 1, trabalho: 1, lazer: 1, saude: 1 } })] }), true);
assert.equal(cumpre('celestial', { ciclos: [ciclo({ arenasFechadasPorArea: { proposito: 1, relacoes: 1, trabalho: 1, lazer: 1 } })] }), false);
assert.equal(cumpre('transcendente', { ciclos: [ciclo({ planejadas: 100, feitas: 90 })] }), true);
assert.equal(cumpre('transcendente', { ciclos: [ciclo({ planejadas: 99, feitas: 99 })] }), false);
assert.equal(cumpre('oraculo', { missoesDoOraculo: 2 }), true);
assert.equal(cumpre('profeta', { missoesDoOraculo: 4 }), false);
assert.equal(cumpre('profeta', { missoesDoOraculo: 5 }), true);
assert.equal(cumpre('lenda-viva', { acoesConcluidas: 1000 }), true);
assert.equal(cumpre('imperador', { acoesConcluidas: 4999 }), false);
assert.equal(cumpre('imperador', { acoesConcluidas: 5000 }), true);
assert.equal(cumpre('escriba', { paginasDoDiario: 10 }), true);
assert.equal(cumpre('maratona', { maiorDia: 11 }), false);
assert.equal(cumpre('maratona', { maiorDia: 12 }), true);
assert.equal(cumpre('anciao', { ciclos: Array.from({ length: 12 }, () => ciclo()) }), true);
assert.equal(cumpre('anciao', { ciclos: Array.from({ length: 11 }, () => ciclo()) }), false);
assert.equal(cumpre('campeao', { competicoesVencidas: 3 }), true);
assert.equal(cumpre('sereno', { diasDeHumor: 30 }), true);
assert.equal(cumpre('alvorada', { maiorSemanaAntesDasSete: 10 }), true);
assert.equal(cumpre('alvorada', { maiorSemanaAntesDasSete: 9 }), false);
assert.equal(cumpre('prisma', { diasSeguidosComCincoAreas: 14 }), true);
assert.equal(cumpre('prisma', { diasSeguidosComCincoAreas: 13 }), false);
assert.equal(cumpre('pedra-da-lua', { ciclos: [ciclo({ nota: 'SS' })] }), false);
assert.equal(cumpre('pedra-da-lua', { ciclos: [ciclo({ nota: 'SSS' })] }), true);
assert.equal(cumpre('popular', { amizades: 5 }), true);
assert.equal(cumpre('guardia', { mentoriasAteOFim: 2 }), true);
console.log('ok - as vinte regras, cada limiar na beira');

// ---------------------------- 2. sem arte nao dispara; descoberta nao repete
{
    const fatos = { ...vazio, acoesConcluidas: 6000, ciclos: [ciclo()] };
    const semArte = (id) => !id.startsWith('item_skin_5_003');
    const novas = novasConquistas({ fatos, regras: REGRAS_DE_DESBLOQUEIO, descobertas: new Set(), arteVisivel: semArte });
    const ids = novas.map((r) => r.id);
    assert.ok(ids.includes('lenda-viva') && ids.includes('disciplinado'), 'as que tem arte destravam');
    assert.ok(!ids.includes('imperador'), 'regra sem arte nao pode disparar');

    const depois = novasConquistas({ fatos, regras: REGRAS_DE_DESBLOQUEIO, descobertas: new Set(ids), arteVisivel: () => true });
    assert.deepEqual(depois.map((r) => r.id), ['imperador'], 'a arte chegou: so a que faltava destrava');
    console.log('ok - regra sem arte espera; descoberta nao repete');
}

// ------------------------------------------ 3. as marcas no perfil
{
    const marcas = ['free_progress_reset_at:2026-09-01', `${MARCA_DE_SEGREDO}disciplinado`, `${MARCA_DE_SEGREDO}veterano`];
    assert.deepEqual([...lerDescobertas(marcas)].sort(), ['disciplinado', 'veterano']);
    assert.equal(lerDescobertas(undefined).size, 0);
    console.log('ok - so as marcas segredo: viram descoberta');
}

// --------------------------- 4. varias de uma vez viram um modal so
{
    const uma = montarModalDeSegredos([regra('disciplinado')]);
    assert.equal(uma.secreta, true);
    assert.equal(uma.title, 'Disciplinado');
    assert.equal(uma.frase, regra('disciplinado').frase);
    assert.deepEqual(uma.reward.items, regra('disciplinado').itens);

    const duas = montarModalDeSegredos([regra('disciplinado'), regra('veterano')]);
    assert.equal(duas.title, 'Disciplinado · Veterano');
    assert.match(duas.frase, /2 segredos/);
    assert.equal(duas.reward.items.length, 4);
    assert.equal(duas.id, 'segredo:disciplinado+veterano', 'o id e o que a fila usa para nao repetir');
    console.log('ok - um modal so, com todos os premios');
}

console.log('Medidor de segredos: as regras decidem aqui, o banco so conta.');
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node tests/medidor-de-segredos.regression.mjs`
Expected: FAIL — o esbuild não acha `utils/medidorDeSegredos.ts`.

- [ ] **Step 3: O medidor** — `utils/medidorDeSegredos.ts`:

```ts
import { REGRAS_DE_DESBLOQUEIO, type CondicaoDeDesbloqueio, type RegraDeDesbloqueio } from '../constants/desbloqueiosPorRegra';
import { LIFE_AREAS } from '../constants/lifeAreas';
import { resolveItemDef } from '../constants/items';

export { REGRAS_DE_DESBLOQUEIO };

/**
 * O MEDIDOR DAS REGRAS SECRETAS.
 *
 * Recebe os numeros que o banco conta (minhas_marcas_secretas) e decide quais
 * regras foram cumpridas. A decisao mora so aqui, em cima da declaracao de
 * constants/desbloqueiosPorRegra.ts: o SQL nao repete nenhuma regra.
 */

export const MARCA_DE_SEGREDO = 'segredo:';

export interface CicloFechadoResumo {
    fim: string;
    dias: number;
    nota: string | null;
    feitas: number | null;
    planejadas: number | null;
    arenasFechadasPorArea: Record<string, number> | null;
}

export interface FatosDeSegredo {
    acoesConcluidas: number;
    maiorSequencia: number;
    maiorDia: number;
    diasSeguidosComCincoAreas: number;
    maiorSemanaAntesDasSete: number;
    paginasDoDiario: number;
    diasDeHumor: number;
    amizades: number;
    competicoesVencidas: number;
    missoesDoOraculo: number;
    mentoriasAteOFim: number;
    ciclos: CicloFechadoResumo[];
}

const ORDEM_DAS_NOTAS = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
const notaAlcanca = (nota: string | null, minima: string) => {
    const posicao = ORDEM_DAS_NOTAS.indexOf(String(nota || ''));
    return posicao >= 0 && posicao >= ORDEM_DAS_NOTAS.indexOf(minima);
};

/** As cinco areas da vida, sem a "geral", que nao e area. */
const AREAS = LIFE_AREAS.map((area) => area.id).filter((id) => id !== 'geral');

const fechadasNaArea = (ciclo: CicloFechadoResumo, area: string) => Number(ciclo.arenasFechadasPorArea?.[area] || 0);

export const condicaoCumprida = (condicao: CondicaoDeDesbloqueio, fatos: FatosDeSegredo): boolean => {
    const ciclos = fatos.ciclos || [];
    switch (condicao.tipo) {
        case 'ciclo_sem_falha':
            return ciclos.some((c) => Number(c.planejadas) > 0 && Number(c.feitas) >= Number(c.planejadas) && notaAlcanca(c.nota, condicao.notaMinima));
        case 'amizades':
            return fatos.amizades >= condicao.quantas;
        case 'ciclos_em_meses_distintos':
            return new Set(ciclos.map((c) => String(c.fim).slice(0, 7))).size >= condicao.quantos;
        case 'sequencia_de_dias':
            return fatos.maiorSequencia >= condicao.dias;
        case 'arenas_da_area_no_ciclo':
            return ciclos.some((c) => fechadasNaArea(c, condicao.area) >= condicao.quantas);
        case 'arena_em_cada_area_no_ciclo':
            return ciclos.some((c) => AREAS.every((area) => fechadasNaArea(c, area) >= 1));
        case 'ciclo_com_volume':
            return ciclos.some((c) => Number(c.planejadas) >= condicao.acoes && Number(c.feitas) * 100 >= Number(c.planejadas) * condicao.conclusaoMinima);
        case 'mentorias_concluidas':
            return fatos.mentoriasAteOFim >= condicao.quantas;
        case 'missoes_individuais':
            return fatos.missoesDoOraculo >= condicao.quantas;
        case 'acoes_concluidas':
            return fatos.acoesConcluidas >= condicao.quantas;
        case 'paginas_do_diario':
            return fatos.paginasDoDiario >= condicao.quantas;
        case 'dia_com_acoes':
            return fatos.maiorDia >= condicao.quantas;
        case 'ciclos_fechados':
            return ciclos.length >= condicao.quantos;
        case 'competicoes_vencidas':
            return fatos.competicoesVencidas >= condicao.quantas;
        case 'dias_de_humor':
            return fatos.diasDeHumor >= condicao.dias;
        case 'acoes_antes_das_sete_numa_semana':
            return fatos.maiorSemanaAntesDasSete >= condicao.quantas;
        case 'dias_seguidos_com_as_cinco_areas':
            return fatos.diasSeguidosComCincoAreas >= condicao.dias;
        case 'ciclo_com_nota':
            return ciclos.some((c) => notaAlcanca(c.nota, condicao.nota));
        default:
            return false;
    }
};

/** As regras ja descobertas, lidas das marcas `segredo:<id>` do perfil. */
export const lerDescobertas = (marcas?: string[] | null): Set<string> => new Set(
    (marcas || [])
        .filter((marca) => typeof marca === 'string' && marca.startsWith(MARCA_DE_SEGREDO))
        .map((marca) => marca.slice(MARCA_DE_SEGREDO.length)),
);

/**
 * O que destravou agora: cumprida, ainda nao descoberta, e com o premio inteiro
 * visivel. Regra cujo premio ainda nao tem arte fica de fora — e, como as
 * condicoes contam o passado, destrava sozinha quando a arte chegar.
 */
export const novasConquistas = ({ fatos, regras, descobertas, arteVisivel }: {
    fatos: FatosDeSegredo;
    regras: RegraDeDesbloqueio[];
    descobertas: Set<string>;
    arteVisivel: (itemId: string) => boolean;
}): RegraDeDesbloqueio[] => regras.filter((regra) => (
    !descobertas.has(regra.id)
    && regra.itens.every(arteVisivel)
    && condicaoCumprida(regra.condicao, fatos)
));

const CATEGORIA_DE_DESBLOQUEIO: Record<string, string> = { border: 'borders', banner: 'banners', skin: 'skins' };

/**
 * Um modal so, mesmo quando varias destravam juntas. O fecho do ciclo ja
 * empilha relatorio, bau e as vezes patente; segredo nao entra nessa pilha um
 * por um.
 */
export const montarModalDeSegredos = (regras: RegraDeDesbloqueio[]) => {
    const itens = regras.flatMap((regra) => regra.itens);
    return {
        id: MARCA_DE_SEGREDO + regras.map((regra) => regra.id).join('+'),
        secreta: true,
        title: regras.map((regra) => regra.nome).join(' · '),
        frase: regras.length === 1
            ? regras[0].frase
            : `${regras.length} segredos descobertos. Eles estão em Missões, em Segredos.`,
        icon: '\u{1F513}',
        reward: {
            exp: 0,
            items: itens,
            rewardDetails: itens.map((itemId) => {
                const def = resolveItemDef(itemId);
                return { category: CATEGORIA_DE_DESBLOQUEIO[def?.category || ''] || 'borders', itemId, name: def?.name || itemId };
            }),
        },
    };
};
```

- [ ] **Step 4: Rodar**

Run: `node tests/medidor-de-segredos.regression.mjs && npx tsc --noEmit -p .`
Expected: as quatro linhas `ok -` e o tsc sem saída.

- [ ] **Step 5: Commit**

```bash
git add utils/medidorDeSegredos.ts tests/medidor-de-segredos.regression.mjs
git commit -m "feat: o medidor das regras secretas — o banco conta, o medidor decide"
```

---

### Task 4: O fecho do ciclo anota as arenas fechadas por área

**Files:**
- Modify: `types.ts` (`Report.metrics`)
- Modify: `contexts/GameContext.tsx` (`endCycle`, antes de `const newReport`)
- Test: `tests/medidor-de-segredos.regression.mjs`

- [ ] **Step 1: Teste** — no fim do teste do medidor, antes do `console.log` final:

```js
// ---------------- 5. o fecho do ciclo anota as arenas fechadas por area
{
    const { readFileSync } = await import('node:fs');
    const contexto = readFileSync(join(raiz, 'contexts/GameContext.tsx'), 'utf8').replace(/\r\n/g, '\n');
    const fecho = contexto.slice(contexto.indexOf('const endCycle = async'));
    const relatorio = fecho.slice(fecho.indexOf('const newReport: Report'), fecho.indexOf('const newReport: Report') + 2400);
    assert.match(relatorio, /arenasFechadasPorArea,/, 'o relatorio do ciclo nao leva as arenas fechadas por area');
    assert.match(fecho.slice(0, fecho.indexOf('const newReport: Report')), /progresso\.totalCompleted >= progresso\.totalPlanned/,
        'arena fechada e todas as acoes cumpridas, pela mesma conta que a arena mostra');
    console.log('ok - o Mistico e o Celestial passam a ter o que ler');
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node tests/medidor-de-segredos.regression.mjs`
Expected: FAIL com `o relatorio do ciclo nao leva as arenas fechadas por area`

- [ ] **Step 3: O tipo** — em `types.ts`, dentro de `Report.metrics`, depois de `weeklyAtlas?`:

```ts
    /** Arenas com todas as acoes cumpridas no ciclo, por area. Le-se nas
     *  regras secretas Mistico e Celestial. Ciclos antigos nao tem. */
    arenasFechadasPorArea?: Record<string, number>;
```

- [ ] **Step 4: A conta** — em `contexts/GameContext.tsx`, imediatamente antes de `const newReport: Report = {`:

```ts
        /*
         * ARENAS FECHADAS, POR AREA.
         *
         * O Mistico e o Celestial perguntam quantas arenas de cada area a pessoa
         * FECHOU no ciclo — todas as acoes cumpridas, e nao so criadas. O banco
         * nao guardava isso; agora o relatorio guarda, no fecho, com a mesma
         * conta de progresso que a propria arena mostra.
         */
        const arenasFechadasPorArea: Record<string, number> = {};
        for (const asset of currentAssets) {
            if (asset.id === 'geral') continue;
            const arenasDoCiclo = cycle?.arenaIds?.length
                ? asset.arenas.filter(arena => cycle.arenaIds.includes(arena.id))
                : asset.arenas;
            for (const arena of arenasDoCiclo) {
                const acoesDaArena = currentActions.filter(action => action.arenaId === arena.id);
                const idsDasAcoes = new Set(acoesDaArena.map(action => action.id));
                const progresso = calculateArenaProgress({
                    arena,
                    actions: acoesDaArena,
                    tasks: cycleTasks.filter(task => idsDasAcoes.has(task.actionId)),
                });
                if (progresso.totalPlanned > 0 && progresso.totalCompleted >= progresso.totalPlanned) {
                    arenasFechadasPorArea[asset.id] = (arenasFechadasPorArea[asset.id] || 0) + 1;
                }
            }
        }
```

E em `metrics: { ... }`, depois de `weeklyAtlas,`:

```ts
                arenasFechadasPorArea,
```

- [ ] **Step 5: Rodar**

Run: `node tests/medidor-de-segredos.regression.mjs && npx tsc --noEmit -p . && node tests/prazo-fecha-o-ciclo.regression.mjs`
Expected: PASS nos dois testes; tsc sem saída.

- [ ] **Step 6: Commit**

```bash
git add types.ts contexts/GameContext.tsx tests/medidor-de-segredos.regression.mjs
git commit -m "feat: o relatorio do ciclo anota as arenas fechadas por area"
```

---

### Task 5: O banco — itens e a função de leitura

**Files:**
- Modify: `scripts/sql-andaime.sql` (tipos de produção; `journal_pages`, `mood_entries`, `relationship_competition_challenges`)
- Create: `supabase/migrations/20261006180000_regras_secretas.sql`
- Create: `supabase/CHECK-marcas-secretas.sql`
- Modify: `tools/generate-items-sql.mjs`
- Test: `tests/medidor-de-segredos.regression.mjs`

- [ ] **Step 1: Teste do texto do SQL** — no teste do medidor, antes do `console.log` final:

```js
// ------------------------- 6. o SQL so conta; quem decide e o medidor
{
    const { readFileSync } = await import('node:fs');
    const sql = readFileSync(join(raiz, 'supabase/migrations/20261006180000_regras_secretas.sql'), 'utf8');
    assert.match(sql, /product_id not like '%:primeira:%'/, 'a missao inicial do onboarding nao conta');
    assert.match(sql, /function public\.minhas_marcas_secretas\(\)[\s\S]*security definer[\s\S]*auth\.uid\(\)/,
        'a funcao publica le so a conta de quem chama');
    assert.match(sql, /revoke all on function public\._marcas_secretas\(uuid\) from public, anon, authenticated/,
        'a funcao por id nao pode ficar aberta: leria a conta de outra pessoa');
    for (const chave of ['acoesConcluidas', 'maiorSequencia', 'maiorDia', 'diasSeguidosComCincoAreas', 'maiorSemanaAntesDasSete',
        'paginasDoDiario', 'diasDeHumor', 'amizades', 'competicoesVencidas', 'missoesDoOraculo', 'mentoriasAteOFim', 'ciclos']) {
        assert.match(sql, new RegExp(`'${chave}'`), `o SQL nao entrega ${chave}, que o medidor le`);
    }
    console.log('ok - o SQL entrega cada numero que o medidor le, e so da propria conta');
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node tests/medidor-de-segredos.regression.mjs`
Expected: FAIL — o arquivo da migração não existe.

- [ ] **Step 3: O andaime nos tipos de produção** — em `scripts/sql-andaime.sql`: `public.arenas` vira `(id uuid primary key, user_id uuid, asset_id text, name text, is_archived boolean)`; `public.scheduled_tasks.id` vira `text`; o comentário dos tipos ganha *"conferido no information_schema de produção em 06/10/2026 (supabase/CHECK-regras-secretas.sql)"*; e no fim:

```sql
-- O que minhas_marcas_secretas() le alem do que ja estava aqui.
create table if not exists public.journal_pages (
  user_id uuid,
  page_number smallint,
  content text not null default '',
  updated_at timestamptz default now()
);
create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  value integer,
  recorded_at timestamptz default now()
);
create table if not exists public.relationship_competition_challenges (
  id uuid primary key default gen_random_uuid(),
  winner_user_id uuid
);
```

Depois: `npm run sql:checa -- supabase/migrations/20261006120000_relationship_lifecycle_v3.sql` e `npm run sql:checa -- supabase/migrations/20261002140000_public_landing_stats_v2.sql` — os dois `[ok]`, para provar que os tipos novos não quebraram o que já compilava.

- [ ] **Step 4: A migração** — `supabase/migrations/20261006180000_regras_secretas.sql`:

```sql
-- AS REGRAS SECRETAS: SO POR REGRA, E OS NUMEROS PARA MEDIR.
--
-- As regras moram em constants/desbloqueiosPorRegra.ts e sao decididas no app
-- (utils/medidorDeSegredos.ts). Este arquivo nao repete nenhuma: ele tira as
-- pecas de regra da loja e do bau, cadastra os quinze premios novos e entrega os
-- NUMEROS que o medidor le.

begin;

-- 1. As 20 pecas de regra saem da loja e do bau. open_chest e buy_store_item ja
--    recusam is_rank_exclusive (conferido no banco em 06/10/2026); no servidor,
--    a coluna passa a querer dizer "vem por caminho proprio", patente ou regra.
update public.items
set is_rank_exclusive = true, gold_price = null
where id in (
  'item_border_1_002', 'item_banner_disciplinado',
  'item_border_2_001', 'item_banner_popular',
  'item_border_t2_veterano', 'item_banner_t2_veterano',
  'item_border_3_001', 'item_banner_imparavel',
  'item_border_t3_mistico', 'item_banner_t3_mistico',
  'item_border_t3_transcendente', 'item_banner_t4_transcendente',
  'item_border_t4_celestial', 'item_banner_t4_celestial',
  'item_border_t4_guardia', 'item_banner_t4_guardia',
  'item_border_t4_oraculo', 'item_banner_t4_oraculo',
  'item_border_4_001', 'item_banner_lendaviva'
);

-- A raridade e a dificuldade da regra, e o par tem a mesma.
update public.items set tier = 2, rarity = 'uncommon' where id in ('item_border_1_002', 'item_banner_disciplinado');
update public.items set tier = 3, rarity = 'rare' where id in ('item_border_t4_oraculo', 'item_banner_t4_oraculo');
update public.items set tier = 4, rarity = 'epic' where id = 'item_border_t3_transcendente';

-- 2. Os quinze premios novos, sem arte ainda: fora do jogo ate o PNG chegar.
insert into public.items (id, name, category, tier, rarity, gold_price, is_rank_exclusive, is_live_in_game)
values
  ('item_skin_1_012', 'Escriba', 'skin', 1, 'common', null, true, false),
  ('item_skin_2_010', 'Maratona', 'skin', 2, 'uncommon', null, true, false),
  ('item_skin_3_009', 'Ancião', 'skin', 3, 'rare', null, true, false),
  ('item_skin_4_005', 'Campeão', 'skin', 4, 'epic', null, true, false),
  ('item_skin_5_003', 'Imperador', 'skin', 5, 'legendary', null, true, false),
  ('item_border_t2_sereno', 'Sereno', 'border', 2, 'uncommon', null, true, false),
  ('item_banner_t2_sereno', 'Sereno', 'banner', 2, 'uncommon', null, true, false),
  ('item_border_t3_alvorada', 'Alvorada', 'border', 3, 'rare', null, true, false),
  ('item_banner_t3_alvorada', 'Alvorada', 'banner', 3, 'rare', null, true, false),
  ('item_border_t3_prisma', 'Prisma', 'border', 3, 'rare', null, true, false),
  ('item_banner_t3_prisma', 'Prisma', 'banner', 3, 'rare', null, true, false),
  ('item_border_t4_profeta', 'Profeta', 'border', 4, 'epic', null, true, false),
  ('item_banner_t4_profeta', 'Profeta', 'banner', 4, 'epic', null, true, false),
  ('item_border_t5_pedra_da_lua', 'Pedra da Lua', 'border', 5, 'legendary', null, true, false),
  ('item_banner_t5_pedra_da_lua', 'Pedra da Lua', 'banner', 5, 'legendary', null, true, false)
on conflict (id) do nothing;

-- 3. Os numeros. Por id, so para o dono do banco (o check usa); a versao
--    publica le a conta de quem chama.
create or replace function public._marcas_secretas(p_user uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  with
  concluidas as (
    select st.date, st.start_time, st.action_id
    from public.scheduled_tasks st
    where st.user_id = p_user
      and coalesce(st.completed, false)
      and st.date ~ '^\d{4}-\d{2}-\d{2}'
  ),
  por_dia as (
    select left(date, 10)::date as dia, count(*) as quantas
    from concluidas
    group by 1
  ),
  sequencias as (
    select count(*) as tamanho
    from (select dia, dia - (row_number() over (order by dia))::int as grupo from por_dia) ilhas
    group by grupo
  ),
  areas_por_dia as (
    select left(c.date, 10)::date as dia, count(distinct ar.asset_id) as areas
    from concluidas c
    join public.actions a on a.id::text = c.action_id
    join public.arenas ar on ar.id = a.arena_id
    where ar.asset_id in ('proposito', 'relacoes', 'trabalho', 'lazer', 'saude')
    group by 1
  ),
  sequencias_cinco as (
    select count(*) as tamanho
    from (
      select dia, dia - (row_number() over (order by dia))::int as grupo
      from areas_por_dia
      where areas = 5
    ) ilhas
    group by grupo
  ),
  -- 04:00 a 06:59: antes das quatro ainda e a madrugada do dia anterior.
  cedo_por_dia as (
    select left(date, 10)::date as dia, count(*) as quantas
    from concluidas
    where start_time >= 240 and start_time < 420
    group by 1
  ),
  semanas_cedo as (
    select (
      select coalesce(sum(c2.quantas), 0)
      from cedo_por_dia c2
      where c2.dia between c1.dia and c1.dia + 6
    ) as quantas
    from cedo_por_dia c1
  ),
  ciclos as (
    select c.end_date, (c.end_date - c.start_date + 1) as dias, c.report_data
    from public.cycles c
    where c.user_id = p_user and c.report_data is not null
  )
  select jsonb_build_object(
    'acoesConcluidas', (select count(*) from concluidas),
    'maiorSequencia', coalesce((select max(tamanho) from sequencias), 0),
    'maiorDia', coalesce((select max(quantas) from por_dia), 0),
    'diasSeguidosComCincoAreas', coalesce((select max(tamanho) from sequencias_cinco), 0),
    'maiorSemanaAntesDasSete', coalesce((select max(quantas) from semanas_cedo), 0),
    'paginasDoDiario', (
      select count(*) from public.journal_pages j
      where j.user_id = p_user and char_length(btrim(j.content)) >= 100
    ),
    'diasDeHumor', (
      select count(distinct (m.recorded_at at time zone 'America/Sao_Paulo')::date)
      from public.mood_entries m
      where m.user_id = p_user
    ),
    'amizades', (select count(*) from public.friends f where f.user_id = p_user),
    'competicoesVencidas', (
      select count(*) from public.relationship_competition_challenges ch
      where ch.winner_user_id = p_user
    ),
    -- Pacto reclamado; o de tipo `primeira` e a missao inicial do onboarding.
    'missoesDoOraculo', (
      select count(*) from public.user_purchases up
      where up.user_id = p_user
        and up.product_type = 'arena_pact'
        and up.product_id not like '%:primeira:%'
    ),
    -- Como mentor, chegou ao prazo sem ninguem sair antes.
    'mentoriasAteOFim', (
      select count(*) from public.relationship_links l
      where l.link_type = 'mentoria'
        and l.mentor_id = p_user
        and l.expires_at <= now()
        and (l.ended_at is null or l.ended_at >= l.expires_at)
    ),
    'ciclos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'fim', end_date,
        'dias', dias,
        'nota', report_data->>'grade',
        'feitas', nullif(coalesce(report_data->'metrics'->>'actions_completed', report_data->'metrics'->>'actionsCompleted'), '')::numeric,
        'planejadas', nullif(coalesce(report_data->'metrics'->>'total_planned_actions', report_data->'metrics'->>'totalPlannedActions'), '')::numeric,
        'arenasFechadasPorArea', report_data->'metrics'->'arenas_fechadas_por_area'
      ) order by end_date)
      from ciclos
    ), '[]'::jsonb)
  );
$$;

create or replace function public.minhas_marcas_secretas()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public._marcas_secretas(auth.uid());
$$;

revoke all on function public._marcas_secretas(uuid) from public, anon, authenticated;
revoke all on function public.minhas_marcas_secretas() from public, anon;
grant execute on function public.minhas_marcas_secretas() to authenticated;

commit;
```

- [ ] **Step 5: O check** — `supabase/CHECK-marcas-secretas.sql`:

```sql
-- OS NUMEROS DAS REGRAS SECRETAS DA CONTA PRINCIPAL. So leitura.
-- Rode depois da migracao 20261006180000_regras_secretas.sql.
select jsonb_pretty(public._marcas_secretas('e76e2b7f-a771-4738-a10a-30a993ecafeb')) as marcas;
```

- [ ] **Step 6: O gerador** — em `tools/generate-items-sql.mjs`, em `normalizeItem`:

```js
    // Peca sem arte nasce fora do jogo; peca de regra nao entra em bau nem loja,
    // e no servidor quem diz isso e is_rank_exclusive.
    is_live_in_game: !raw.isLegacyRetired && !String(raw.id).startsWith('item_garden_') && !(raw.isRuleExclusive && !raw.image_url),
    is_rank_exclusive: Boolean(raw.isRankExclusive || raw.isRuleExclusive),
```

- [ ] **Step 7: Compilar e provar com dados**

Run: `npm run sql:checa -- supabase/migrations/20261006180000_regras_secretas.sql && npm run sql:checa -- supabase/CHECK-marcas-secretas.sql && node tests/medidor-de-segredos.regression.mjs`
Expected: `[ok]` nos dois arquivos e o teste PASS.

E uma prova de uso num PGlite (no scratchpad, fora do repositório): andaime + migração + dados de mentira (doze dias seguidos de tarefas, um buraco, tarefas às 05:00, uma página de diário de 120 caracteres, dois humores no mesmo dia, um pacto `primeira` e um `volume`, uma mentoria vencida) → `select public._marcas_secretas('<id>')` tem de dar `maiorSequencia 12`, `paginasDoDiario 1`, `diasDeHumor 1`, `missoesDoOraculo 1`.

- [ ] **Step 8: Commit**

```bash
git add scripts/sql-andaime.sql supabase/migrations/20261006180000_regras_secretas.sql supabase/CHECK-marcas-secretas.sql tools/generate-items-sql.mjs tests/medidor-de-segredos.regression.mjs
git commit -m "feat: o banco conta as marcas secretas e tira as pecas de regra da loja"
```

---

### Task 6: O título "Conquista secreta"

**Files:**
- Modify: `components/AchievementModal.tsx` (`getAchievementDetails`, caso `QUEST_COMPLETED`)
- Test: `tests/medidor-de-segredos.regression.mjs`

- [ ] **Step 1: Teste** — no teste do medidor, antes do `console.log` final:

```js
// --------------- 7. o modal e o de recompensa normal, so com o titulo
{
    const { readFileSync } = await import('node:fs');
    const modal = readFileSync(join(raiz, 'components/AchievementModal.tsx'), 'utf8');
    const missao = modal.slice(modal.indexOf("case 'QUEST_COMPLETED': {"), modal.indexOf("case 'REPORT_COMPLETED':"));
    assert.match(missao, /data\.secreta/, 'o modal de missao nao reconhece a conquista secreta');
    assert.match(missao, /'Conquista secreta'/, 'o titulo da conquista secreta sumiu');
    console.log('ok - conquista secreta e o modal de recompensa de sempre, com outro titulo');
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node tests/medidor-de-segredos.regression.mjs`
Expected: FAIL com `o modal de missao nao reconhece a conquista secreta`

- [ ] **Step 3: O título** — em `components/AchievementModal.tsx`, o caso `QUEST_COMPLETED` passa a:

```ts
        case 'QUEST_COMPLETED': {
            // A conquista secreta usa este mesmo modal de recompensa: so o
            // titulo e a frase mudam. Decidido assim em 06/10/2026 — nada de
            // enfeite proprio.
            if (data.secreta) {
                return {
                    title: 'Conquista secreta',
                    subtitle: data.title,
                    icon: data.icon || '\u{1F513}',
                    message: data.frase,
                };
            }
            return {
                title: 'Missão concluída!',
                subtitle: data.title,
                icon: data.icon || '\u{1F3AF}',
                message: 'A recompensa desta missão já entrou.',
            };
        }
```

- [ ] **Step 4: Rodar**

Run: `node tests/medidor-de-segredos.regression.mjs && npx tsc --noEmit -p .`
Expected: PASS; tsc sem saída.

- [ ] **Step 5: Commit**

```bash
git add components/AchievementModal.tsx tests/medidor-de-segredos.regression.mjs
git commit -m "feat: o modal de recompensa diz Conquista secreta"
```

---

### Task 7: A conferência — chamar, avaliar, entregar, enfileirar

**Files:**
- Create: `hooks/useConquistasSecretas.ts`
- Modify: `components/AuthenticatedApp.tsx`
- Test: `tests/medidor-de-segredos.regression.mjs`

- [ ] **Step 1: Teste** — no teste do medidor, antes do `console.log` final:

```js
// ------------------------------- 8. a entrega, pelo caminho de sempre
{
    const { readFileSync } = await import('node:fs');
    const hook = readFileSync(join(raiz, 'hooks/useConquistasSecretas.ts'), 'utf8');
    assert.match(hook, /rpc\('minhas_marcas_secretas'\)/, 'a conferencia nao pergunta os numeros ao banco');
    assert.match(hook, /novasConquistas\(/, 'a conferencia decide fora do medidor');
    assert.match(hook, /grantInventoryItem\(/, 'o premio deixou de sair pelo caminho de sempre');
    assert.match(hook, /completedSeasonMissions:/, 'a descoberta nao fica gravada no perfil');
    assert.match(hook, /setAchievementUnlocked\(\{ type: 'QUEST_COMPLETED'/, 'o modal nao entra na fila que ja existe');
    const app = readFileSync(join(raiz, 'components/AuthenticatedApp.tsx'), 'utf8');
    assert.match(app, /useConquistasSecretas\(\{ pausado: isReportsVisible \}\)/,
        'a conquista secreta nao espera o relatorio do ciclo fechar');
    console.log('ok - a conferencia pergunta, decide no medidor, entrega e espera o relatorio');
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node tests/medidor-de-segredos.regression.mjs`
Expected: FAIL — `hooks/useConquistasSecretas.ts` não existe.

- [ ] **Step 3: O hook** — `hooks/useConquistasSecretas.ts`:

```ts
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../supabaseClient';
import { REGRAS_DE_DESBLOQUEIO } from '../constants/desbloqueiosPorRegra';
import { isItemCatalogVisible, resolveItemDef } from '../constants/items';
import type { UserUnlocks } from '../types';
import {
    MARCA_DE_SEGREDO,
    lerDescobertas,
    montarModalDeSegredos,
    novasConquistas,
    type FatosDeSegredo,
} from '../utils/medidorDeSegredos';

const CATEGORIA_DE_DESBLOQUEIO: Record<string, keyof UserUnlocks> = {
    border: 'borders',
    banner: 'banners',
    skin: 'skins',
};

/**
 * A CONFERENCIA DAS REGRAS SECRETAS.
 *
 * Roda quando o perfil carrega e quando um ciclo fecha. Pergunta os numeros ao
 * banco, deixa o medidor decidir, entrega o premio pelo caminho de sempre e poe
 * UM modal na fila que ja existe.
 *
 * `pausado` segura o modal enquanto o relatorio do ciclo esta aberto: o fecho ja
 * empilha relatorio, bau e as vezes patente, e o segredo entra depois.
 */
export const useConquistasSecretas = ({ pausado }: { pausado: boolean }) => {
    const {
        userProfile, reports, inventory, isProfileLoaded,
        grantInventoryItem, updateUserProfile, setAchievementUnlocked,
    } = useGame();
    const perfilRef = useRef(userProfile);
    perfilRef.current = userProfile;
    const inventarioRef = useRef(inventory);
    inventarioRef.current = inventory;
    const conferindoRef = useRef(false);
    const [modalPendente, setModalPendente] = useState<ReturnType<typeof montarModalDeSegredos> | null>(null);

    useEffect(() => {
        if (!isProfileLoaded || !userProfile.id || userProfile.id === 'placeholder_user') return;
        if (conferindoRef.current) return;
        conferindoRef.current = true;

        void (async () => {
            try {
                const { data, error } = await supabase.rpc('minhas_marcas_secretas');
                // Sem a funcao no banco (migracao ainda nao rodada), fica quieto.
                if (error || !data) return;

                const novas = novasConquistas({
                    fatos: data as FatosDeSegredo,
                    regras: REGRAS_DE_DESBLOQUEIO,
                    descobertas: lerDescobertas(perfilRef.current.completedSeasonMissions),
                    arteVisivel: (itemId) => isItemCatalogVisible(itemId),
                });
                if (novas.length === 0) return;

                // O inventario e o dono de verdade; quem ja tinha a peca (comprou
                // antes, ou e staff) nao recebe duplicata convertida em fragmento.
                for (const regra of novas) {
                    for (const itemId of regra.itens) {
                        if (!inventarioRef.current.some((item) => item.id === itemId)) {
                            await grantInventoryItem(itemId, true);
                        }
                    }
                }

                // Desbloqueio e marca numa escrita so, montadas do perfil vivo:
                // updateUserProfile faz merge de primeiro nivel, e duas escritas
                // seguidas a partir do mesmo closure apagariam uma a outra.
                const perfil = perfilRef.current;
                const desbloqueios: Partial<UserUnlocks> = { ...(perfil.unlockedItems || {}) };
                for (const regra of novas) {
                    for (const itemId of regra.itens) {
                        const categoria = CATEGORIA_DE_DESBLOQUEIO[resolveItemDef(itemId)?.category || ''];
                        if (!categoria) continue;
                        desbloqueios[categoria] = { ...(desbloqueios[categoria] || {}), [itemId]: true };
                    }
                }
                const marcas = perfil.completedSeasonMissions || [];
                const novasMarcas = novas
                    .map((regra) => MARCA_DE_SEGREDO + regra.id)
                    .filter((marca) => !marcas.includes(marca));
                updateUserProfile({
                    unlockedItems: desbloqueios as UserUnlocks,
                    completedSeasonMissions: [...marcas, ...novasMarcas],
                });

                setModalPendente(montarModalDeSegredos(novas));
            } finally {
                conferindoRef.current = false;
            }
        })();
    }, [isProfileLoaded, userProfile.id, reports.length]);

    useEffect(() => {
        if (pausado || !modalPendente) return;
        setAchievementUnlocked({ type: 'QUEST_COMPLETED', data: modalPendente });
        setModalPendente(null);
    }, [pausado, modalPendente, setAchievementUnlocked]);
};
```

- [ ] **Step 4: Montar** — em `components/AuthenticatedApp.tsx`, importar `import { useConquistasSecretas } from '../hooks/useConquistasSecretas';` e, logo depois de `const [isReportsVisible, setReportsVisible] = useState(false);`:

```ts
    // As regras secretas: confere ao carregar e a cada ciclo fechado, e segura
    // o modal enquanto o relatorio esta aberto.
    useConquistasSecretas({ pausado: isReportsVisible });
```

- [ ] **Step 5: Rodar**

Run: `node tests/medidor-de-segredos.regression.mjs && npx tsc --noEmit -p .`
Expected: PASS; tsc sem saída.

- [ ] **Step 6: Commit**

```bash
git add hooks/useConquistasSecretas.ts components/AuthenticatedApp.tsx tests/medidor-de-segredos.regression.mjs
git commit -m "feat: a conferencia das regras secretas entrega e espera o relatorio"
```

---

### Task 8: Missões → Segredos

**Files:**
- Create: `components/SegredosSection.tsx`
- Modify: `views/SeasonView.tsx` (depois do bloco `{!activeSeason && (...)}`)
- Test: `tests/medidor-de-segredos.regression.mjs`

- [ ] **Step 1: Teste** — no teste do medidor, antes do `console.log` final:

```js
// ------------------------------------------- 9. Segredos, com os ???
{
    const { readFileSync } = await import('node:fs');
    const secao = readFileSync(join(raiz, 'components/SegredosSection.tsx'), 'utf8');
    assert.match(secao, /lerDescobertas\(/, 'Segredos le as descobertas de outro lugar');
    assert.match(secao, /'\?\?\?'/, 'a regra nao descoberta precisa aparecer como ???');
    assert.doesNotMatch(secao, /regra\.condicao/, 'Segredos nao pode dar dica da condicao');
    const temporada = readFileSync(join(raiz, 'views/SeasonView.tsx'), 'utf8');
    const semTemporada = temporada.indexOf('{!activeSeason && (');
    assert.ok(temporada.indexOf('<SegredosSection />') > semTemporada,
        'Segredos tem de aparecer com ou sem temporada ativa');
    console.log('ok - Segredos mostra o que achou e esconde o resto como ???');
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node tests/medidor-de-segredos.regression.mjs`
Expected: FAIL — `components/SegredosSection.tsx` não existe.

- [ ] **Step 3: A seção** — `components/SegredosSection.tsx`:

```tsx
import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { REGRAS_DE_DESBLOQUEIO } from '../constants/desbloqueiosPorRegra';
import { resolveItemDef } from '../constants/items';
import { lerDescobertas } from '../utils/medidorDeSegredos';
import { ItemArt } from './ItemArt';
import { ChevronDownIcon } from './Icons';

/**
 * MISSOES → SEGREDOS.
 *
 * O que a pessoa achou, com a frase e o premio; o que falta, como ???. Sem dica
 * nenhuma: saber que existe mais, e nao saber como, e o que faz a regra secreta
 * ser secreta. Vale para a vida toda, por isso nao mora na lista da temporada.
 */
export const SegredosSection: React.FC = () => {
    const { userProfile } = useGame();
    const [aberto, setAberto] = useState(false);
    const descobertas = lerDescobertas(userProfile.completedSeasonMissions);
    const achadas = REGRAS_DE_DESBLOQUEIO.filter((regra) => descobertas.has(regra.id)).length;

    return (
        <div>
            <button
                type="button"
                onClick={() => setAberto((valor) => !valor)}
                aria-expanded={aberto}
                className="flex w-full items-baseline gap-2 px-1 py-1 text-left"
            >
                <span className="text-sm" aria-hidden="true">{'\u{1F512}'}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/62">Segredos</span>
                <span className="text-[9px] font-bold text-white/28">{achadas} de {REGRAS_DE_DESBLOQUEIO.length}</span>
                <ChevronDownIcon
                    className={`ml-auto h-3.5 w-3.5 shrink-0 translate-y-0.5 text-white/38 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
                />
            </button>
            {aberto && (
                <div className="mt-2 space-y-1">
                    {REGRAS_DE_DESBLOQUEIO.map((regra) => {
                        if (!descobertas.has(regra.id)) {
                            return (
                                <div key={regra.id} className="flex items-center gap-2.5 rounded-lg border border-white/6 bg-black/20 px-2.5 py-2">
                                    <span className="text-sm opacity-40" aria-hidden="true">{'\u{1F512}'}</span>
                                    <p className="text-[11px] font-bold tracking-[0.2em] text-white/28">{'???'}</p>
                                </div>
                            );
                        }
                        return (
                            <div key={regra.id} className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
                                <span className="text-sm" aria-hidden="true">{'\u{1F513}'}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[11px] font-bold text-white/82">{regra.nome}</p>
                                    <p className="truncate text-[9px] text-white/48">{regra.frase}</p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    {regra.itens.map((itemId) => {
                                        const def = resolveItemDef(itemId);
                                        return (
                                            <ItemArt
                                                key={itemId}
                                                itemId={itemId}
                                                src={def?.imageUrl}
                                                alt={def?.name || itemId}
                                                icon={def?.icon}
                                                category={def?.category}
                                                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/30"
                                                imgClassName="h-full w-full object-contain"
                                                iconClassName="text-base"
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
```

- [ ] **Step 4: Montar** — em `views/SeasonView.tsx`, importar `import { SegredosSection } from '../components/SegredosSection';` e, logo depois do bloco que fecha em `{!activeSeason && ( ... )}`:

```tsx
            {/* Segredos vale para a vida toda: aparece com ou sem temporada. */}
            <SegredosSection />
```

- [ ] **Step 5: Rodar e ver na tela**

Run: `node tests/medidor-de-segredos.regression.mjs && npx tsc --noEmit -p .`
Expected: PASS; tsc sem saída.

E uma bancada (`tools/os-segredos.tsx` + `.html`, com GameContext de mentira com duas marcas `segredo:`) para conferir a seção aberta e fechada e o modal "Conquista secreta" com um e com dois segredos, em viewport de celular.

- [ ] **Step 6: Commit**

```bash
git add components/SegredosSection.tsx views/SeasonView.tsx tests/medidor-de-segredos.regression.mjs tools/os-segredos.tsx tools/os-segredos.html tools/bancada-nav.js
git commit -m "feat: Missoes ganha Segredos, com os ??? das que faltam"
```

---

### Task 9: Registrar, rodar tudo, entregar o SQL

**Files:**
- Modify: `tests/launch-readiness.mjs`, `package.json`

- [ ] **Step 1: Registrar** — `package.json`, depois de `test:luz-e-placa-do-soberano`:

```json
    "test:medidor-de-segredos": "node tests/medidor-de-segredos.regression.mjs",
```

`tests/launch-readiness.mjs`, primeira entrada de `core`:

```js
    {
      id: 'medidor-de-segredos',
      label: 'Medidor de segredos regression',
      command: [nodeBin, [path.join(repoRoot, 'tests', 'medidor-de-segredos.regression.mjs')]],
      kind: 'logic',
      interactions: [
        'as vinte regras, cada limiar na beira',
        'regra sem arte espera, e destrava quando a arte chega',
        'varias de uma vez viram um modal so, depois do relatorio',
      ],
    },
```

- [ ] **Step 2: Rodar tudo**

Run: `npx tsc --noEmit -p . && node tests/regras-de-desbloqueio.regression.mjs && node tests/medidor-de-segredos.regression.mjs && node tests/item-art.regression.mjs && node tests/luz-e-placa-do-soberano.regression.mjs && node tests/reward-modal.regression.mjs && node tests/starter-e-patentes.regression.mjs && node tests/challenge-reward-flow.regression.mjs`
Expected: tudo PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/launch-readiness.mjs package.json
git commit -m "test: o medidor de segredos entra na bateria de lancamento"
```

- [ ] **Step 4: Entregar ao Afonso** — o arquivo `supabase/migrations/20261006180000_regras_secretas.sql` para colar no SQL Editor, e depois o `supabase/CHECK-marcas-secretas.sql`, com o que esperar: na conta principal, Disciplinado e Veterano destravam no primeiro carregamento do app depois da migração.
