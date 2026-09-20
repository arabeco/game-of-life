/**
 * O CATALOGO DO CODIGO E O CATALOGO DO BANCO SAO DOIS, E NINGUEM OS COSTURA.
 *
 * O app le `constants/items.ts`. O sorteio do bau roda dentro do Postgres e le
 * `public.items`. Nao ha script, gatilho ou migracao que leve um ao outro — o
 * `sql/items_catalog_seed.sql` foi escrito uma vez e nunca mais.
 *
 * O preco disso apareceu em 20/09/2026: as oito auras viraram premio de patente
 * no codigo, com `isRankExclusive: true`, e o banco continuou respondendo
 * `aura | 0 marcados | 9 sorteaveis`. A escada prometia e o bau dava de graca,
 * ao mesmo tempo, e nada acusava.
 *
 * Este script gera o bloco de SQL que fecha essa distancia. Ele:
 *
 *   1. sincroniza o que o CODIGO manda — nome, categoria, tier, raridade, arte,
 *      preco e as flags de porta;
 *   2. aposenta com `is_live_in_game = false` quem saiu do codigo, em vez de
 *      apagar, para quem ja tem o item continuar tendo;
 *   3. termina com um `select` que mostra como ficou.
 *
 * O QUE ELE NAO TOCA: `recycle_value`, `craft_cost` e `description`. Esses tres
 * vivem so no banco, o codigo nao os conhece, e escrever null por cima seria
 * apagar economia que ninguem pediu para apagar.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const raiz = path.resolve(
    path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
    '..',
);
const saida = path.join(raiz, 'sql', 'generated', 'sincroniza-itens.sql');

const empacota = async (entrada, nome) => {
    const destino = path.join(raiz, 'node_modules', '.cache', nome);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(raiz, entrada)],
        bundle: true, platform: 'node', format: 'esm', outfile: destino, logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const { ITEMS_DB } = await empacota('constants/items.ts', 'sync-items.mjs');

/** Uma string para o SQL, ou `null`. Aspas simples dobram. */
const txt = (v) => (v === undefined || v === null || v === '' ? 'null' : `'${String(v).split("'").join("''")}'`);
const num = (v) => (v === undefined || v === null ? 'null' : String(Number(v)));
const bool = (v) => (v === true ? 'true' : 'false');

const itens = ITEMS_DB.filter((i) => i.category !== 'chest');

const linha = (i) => [
    txt(i.id), txt(i.name), txt(i.category), num(i.tier), txt(i.rarity),
    txt(i.imageUrl), num(i.costGold),
    bool(i.isRankExclusive), bool(i.isGoldExclusive), bool(i.isSeasonExclusive),
    bool(i.isPremiumOnly), bool(i.isChestExclusive), bool(i.isLegacyRetired),
    txt(i.seasonKey), txt(i.seasonSlot),
].join(', ');

/**
 * Staff, quest e relatorio nao existem como coluna no banco.
 *
 * O `isChestEligibleItem` do app recusa os tres; o WHERE do `open_chest` nunca
 * ouviu falar deles. Por isso O Criador, a Borda de Grande Mestre e o Banner de
 * Grao Mestre podem cair de bau no servidor mesmo o app jurando que nao.
 *
 * Sem coluna nova, a unica chave que o WHERE ja consulta e `is_live_in_game`.
 * Este bloco sai separado e comentado: desligar um item o tira do sorteio E de
 * qualquer outra entrega, e isso e decisao, nao conserto.
 */
const foraDoBancoPorFlag = itens.filter((i) => i.isGmExclusive || i.isQuestExclusive || i.isReportExclusive);

const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
let commit = 'sem git';
try { commit = execSync('git rev-parse --short HEAD', { cwd: raiz }).toString().trim(); } catch { /* fora do git */ }

const sql = `-- Sincroniza public.items com constants/items.ts
--
-- Gerado por scripts/build-items-sync.mjs em ${agora}, commit ${commit}.
-- ${itens.length} itens. Nao edite a mao: a proxima geracao apaga.
--
-- O codigo manda em: nome, categoria, tier, raridade, arte, preco e as flags de
-- porta. O banco continua mandando em recycle_value, craft_cost e description —
-- o codigo nao conhece esses tres, e escrever null por cima seria apagar.
--
-- Roda inteiro. E uma transacao: ou passa tudo, ou nada muda.

begin;

update public.items as alvo
set
  name = codigo.name,
  category = codigo.category,
  tier = codigo.tier,
  rarity = codigo.rarity,
  image_url = codigo.image_url,
  gold_price = codigo.gold_price,
  is_rank_exclusive = codigo.is_rank_exclusive,
  is_gold_exclusive = codigo.is_gold_exclusive,
  is_season_exclusive = codigo.is_season_exclusive,
  is_premium_only = codigo.is_premium_only,
  is_chest_exclusive = codigo.is_chest_exclusive,
  is_legacy_retired = codigo.is_legacy_retired,
  season_key = codigo.season_key,
  season_slot = codigo.season_slot
from (values
${itens.map((i) => `  (${linha(i)})`).join(',\n')}
) as codigo (
  id, name, category, tier, rarity, image_url, gold_price,
  is_rank_exclusive, is_gold_exclusive, is_season_exclusive,
  is_premium_only, is_chest_exclusive, is_legacy_retired,
  season_key, season_slot
)
where alvo.id = codigo.id;

-- Quem saiu do codigo e aposentado, nao apagado: quem ja tem continua tendo, e
-- o sorteio para de alcancar. (O glifo e o orbe sairam em 20/09; sao 17.)
--
-- O coalesce no WHERE nao e enfeite: sem ele o update tocaria tambem em quem ja
-- estava desligado, e o RETURNING abaixo misturaria o que ESTA desligado com o
-- que ACABOU de ser desligado. Foi assim que a primeira versao deste arquivo
-- fez parecer que tinha apagado a borda e o banner da Aurora II, que ja estavam
-- fora porque a temporada ativa e a Genesis.
with aposentados as (
  update public.items
  set is_live_in_game = false
  where coalesce(is_live_in_game, true) = true
    and id <> all (array[
${itens.map((i) => `      ${txt(i.id)}`).join(',\n')}
    ]::text[])
  returning id, name, category, tier
)
select id, name, category, tier, 'DESLIGADO AGORA' as o_que_mudou
from aposentados
order by category, tier, id;

commit;

-- --------------------------------------------------------------------------
-- COMO FICOU. Roda junto e me manda.
-- --------------------------------------------------------------------------

-- 1. Quantos itens cada tier oferece ao sorteio, com o filtro do servidor.
select
  tier,
  count(*) as sorteaveis
from public.items
where coalesce(is_live_in_game, true) = true
  and category not in ('insignia', 'insignias')
  and category <> 'hair'
  and is_rank_exclusive is not true
  and is_premium_only is not true
  and is_legacy_retired is not true
  and (is_gold_exclusive = false or is_gold_exclusive is null)
  and (is_season_exclusive = false or is_season_exclusive is null)
group by tier
order by tier;

-- 2. Por categoria: quantos sao de patente e quantos sobram no sorteio.
select
  category,
  count(*) filter (where is_rank_exclusive is true) as de_patente,
  count(*) filter (where is_rank_exclusive is not true) as sorteaveis
from public.items
where coalesce(is_live_in_game, true) = true
group by category
order by category;

-- 3. O CODIGO TEM ITEM QUE O BANCO NAO TEM?
--
-- Isto aqui e um UPDATE: ele conserta linha que existe e nao cria linha nova. A
-- aura Eclipse nasceu no codigo em 20/09 e nao tem linha no banco — enquanto
-- nao tiver, o app a mostra e o servidor nao a conhece. O insert dela precisa
-- de recycle_value e craft_cost, que so o banco sabe, entao fica para a mao.
select codigo.id as so_no_codigo
from (values
${itens.map((i) => `  (${txt(i.id)})`).join(',\n')}
) as codigo (id)
where not exists (select 1 from public.items i where i.id = codigo.id);

-- 4. TUDO o que esta desligado hoje — nao so o que este bloco desligou.
--
-- Aqui entram tres coisas diferentes, e vale saber qual e qual:
--   - o que saiu do codigo agora (glifo, orbe, e o que o RETURNING acima listou)
--   - o que esta fora porque a temporada nao e a da vez (Aurora II)
--   - o que so existe no banco e nunca chegou ao codigo
select
  id, name, category, tier,
  case
    when id like 'item_glyph_%' or id like 'item_orb_%' then 'saiu do codigo'
    when id like '%aurora_1_2026%' or id like '%genesis%' then 'temporada fora da vez'
    else 'so existe no banco'
  end as por_que
from public.items
where coalesce(is_live_in_game, true) = false
order by por_que, category, tier, id;

-- --------------------------------------------------------------------------
-- OPCIONAL, E E DECISAO SUA. Nao roda junto.
--
-- Staff, quest e relatorio nao tem coluna no banco, entao o WHERE do open_chest
-- nao sabe recusa-los. Sao ${foraDoBancoPorFlag.length} itens:
--
${foraDoBancoPorFlag.map((i) => `--   t${i.tier} ${i.category} · ${i.name}`).join('\n')}
--
-- Os de tier 5 sao os que doem: o bau Lendario sorteia so no tier 5.
-- Desligar tira do sorteio E de qualquer outra entrega — inclusive de ser dado
-- a mao. Por isso fica comentado.
--
-- update public.items
-- set is_live_in_game = false
-- where id in (${foraDoBancoPorFlag.map((i) => txt(i.id)).join(', ')});
`;

fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, sql, 'utf8');
console.log(`sincroniza-itens: ${path.relative(raiz, saida)} (${(sql.length / 1024).toFixed(0)} KB)`);
console.log(`  ${itens.length} itens · ${itens.filter((i) => i.isRankExclusive).length} de patente · ${foraDoBancoPorFlag.length} sem coluna no banco`);
