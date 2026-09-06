import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

/**
 * A ESCADA — a folha da economia.
 *
 * Ela existe porque nenhum lugar do app mostra a escada inteira, e escada so se
 * ve inteira. Tudo que a gente achou de errado em 03/09/2026 passou por `tsc`,
 * passou nos testes e sobreviveu semanas:
 *
 *   - o bau Lendario pagava ZERO fragmento bonus, menos que o Incomum, desde
 *     que foi separado do Season em 18/08;
 *   - o bau "Ciclo" sorteava PIOR que o Raro vestindo a arte e a cor do Raro;
 *   - o Comum e o Incomum entregavam praticamente a mesma coisa (tier medio
 *     1,27 contra 1,35), e o maior buraco da escada ficava entre o Incomum e o
 *     Raro, que e exatamente onde o Incomum deveria estar;
 *   - o bau Mitico da Aurora I alcanca DUAS pecas.
 *
 * Nenhum desses e bug de codigo. Sao buracos de escada.
 *
 * REGRA DE HONESTIDADE: nenhum numero e escrito aqui. Tudo e lido do codigo, da
 * migracao mais nova que redefine `open_chest`, e do ITEMS_DB. Onde o dado mora
 * no SERVIDOR e nao no repositorio, a folha diz isso e traz o SQL de conferir.
 * Foi lendo uma migracao do MEIO da pilha que eu dei numero errado uma vez.
 */

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const saida = path.join(raiz, 'docs', 'a-escada.html');

const empacota = async (entrada, nome) => {
    const destino = path.join(raiz, 'node_modules', '.cache', nome);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(raiz, entrada)],
        bundle: true, platform: 'node', format: 'esm', outfile: destino, logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const { ITEMS_DB } = await empacota('constants/items.ts', 'escada-items.mjs');
const { NOBILITY_RANKS, RANK_REWARDS } = await empacota('constants/nobility.ts', 'escada-nobility.mjs');
const { SYSTEM_CHALLENGES } = await empacota('constants/systemChallenges.ts', 'escada-challenges.mjs');
const { RARITY_VISUALS } = await empacota('constants/rarityVisuals.ts', 'escada-rarity.mjs');
const { SEASONS, PECAS_POR_TEMPORADA } = await empacota('constants/seasonContent.ts', 'escada-seasons.mjs');
const { getChestArtUrl } = await empacota('constants/catalogAssets.ts', 'escada-assets.mjs');

// ---------------------------------------------------------------- o servidor

/**
 * A migracao mais NOVA que redefine open_chest. Nunca uma do meio da pilha:
 * nove arquivos ja redefiniram essa funcao, e ler o errado foi como eu dei a
 * curva do bau Mitico desatualizada uma vez.
 */
const migracaoDoBau = () => {
    const pasta = path.join(raiz, 'supabase', 'migrations');
    const arquivos = fs.readdirSync(pasta)
        .filter((nome) => nome.endsWith('.sql'))
        .filter((nome) => /function public\.open_chest/.test(fs.readFileSync(path.join(pasta, nome), 'utf8')))
        .sort();
    const nome = arquivos[arquivos.length - 1];
    return { nome, texto: fs.readFileSync(path.join(pasta, nome), 'utf8') };
};

const sql = migracaoDoBau();

/** As curvas de tier, lidas do `case v_chest_type` da funcao. */
const curvasDoSql = () => {
    const bloco = sql.texto.match(/case v_chest_type\n([\s\S]*?)\n      end case;/);
    if (!bloco) return {};
    const curvas = {};
    const ramos = bloco[1].split(/when '/).slice(1);
    for (const ramo of ramos) {
        const tipo = ramo.slice(0, ramo.indexOf("'"));
        const faixas = [...ramo.matchAll(/v_rand < (\d+) then v_dropped_tier := (\d)/g)]
            .map((m) => ({ ate: Number(m[1]), tier: Number(m[2]) }));
        const resto = ramo.match(/else v_dropped_tier := (\d); end if/);
        // Lendario e Mitico nao tem faixa de random: atribuem o tier direto.
        // Sem este caso os dois sumiam da folha — justamente os dois do topo.
        const direto = ramo.match(/then\s*\n\s*v_dropped_tier := (\d);/);
        const distribuicao = {};
        let anterior = 0;
        for (const faixa of faixas) {
            distribuicao[faixa.tier] = (distribuicao[faixa.tier] || 0) + (faixa.ate - anterior);
            anterior = faixa.ate;
        }
        if (resto) distribuicao[Number(resto[1])] = (distribuicao[Number(resto[1])] || 0) + (100 - anterior);
        if (faixas.length === 0 && direto) distribuicao[Number(direto[1])] = 100;
        if (Object.keys(distribuicao).length) curvas[tipo] = distribuicao;
    }
    return curvas;
};

const fragmentosDoSql = () => {
    const bloco = sql.texto.match(/v_bonus_fragments := case v_chest_type([\s\S]*?)end;/);
    if (!bloco) return {};
    const mapa = {};
    for (const m of bloco[1].matchAll(/when '([a-z]+)' then floor\(random\(\) \* \((\d+) - (\d+) \+ 1\) \+ (\d+)\)/g)) {
        mapa[m[1]] = { min: Number(m[4]), max: Number(m[2]) };
    }
    return mapa;
};

const pityDoSql = () => {
    const mapa = {};
    for (const m of sql.texto.matchAll(/v_chest_type = '([a-z]+)' and v_pity_counter >= (\d+) then (\d)/g)) {
        mapa[m[1]] = { aberturas: Number(m[2]), tier: Number(m[3]) };
    }
    return mapa;
};

const curvas = curvasDoSql();
const fragmentos = fragmentosDoSql();
const pity = pityDoSql();
const temaForaDoBau = /not in \('ui_skin', 'insignia'\)/.test(sql.texto);

// ------------------------------------------------------------- a escada do ciclo

/** Os limiares do fecho de ciclo, lidos do proprio ReportsView. */
const escadaDoCiclo = () => {
    const fonte = fs.readFileSync(path.join(raiz, 'views', 'ReportsView.tsx'), 'utf8');
    const linhas = [...fonte.matchAll(
        /awardedExp >= (\d+)(?: && score >= (\d+))?(?: && durationDays >= (\d+))? \) chestType = '([^']+)'/g,
    )];
    const cru = [...fonte.matchAll(/awardedExp >= (\d+)[^;]*?chestType = '([^']+)'/g)]
        .map((m) => ({ exp: Number(m[1]), bau: m[2] }));
    const nota = [...fonte.matchAll(/awardedExp >= \d+ && score >= (\d+)/g)].map((m) => Number(m[1]));
    const promocao = fonte.match(/roll < (0\.\d+)/);
    const minimoDias = fonte.match(/durationDays < (\d+)\) \{\s*\n\s*chestType = null/);
    return {
        degraus: cru,
        notas: nota,
        promocao: promocao ? Number(promocao[1]) * 100 : null,
        minimoDias: minimoDias ? Number(minimoDias[1]) : null,
        linhas: linhas.length,
    };
};

const ciclo = escadaDoCiclo();

// ------------------------------------------------------------------- os pools

/**
 * Quantos itens cada tier oferece de verdade, com as MESMAS exclusoes que a
 * funcao do servidor aplica. Sem isso a folha diria "31 itens no tier 4" e o
 * bau alcancaria 30.
 */
const poolPorTier = (paraBauDeTemporada) => {
    const pool = {};
    for (const item of ITEMS_DB) {
        const vivo = item.isLegacyRetired !== true;
        const deTemporada = item.isSeasonExclusive === true;
        if (paraBauDeTemporada !== deTemporada) continue;
        if (!vivo) continue;
        if (!paraBauDeTemporada) {
            if (['insignia', 'insignias'].includes(item.category)) continue;
            if (item.category === 'hair') continue;
            if (item.isRankExclusive) continue;
            if (item.isPremiumOnly) continue;
            if (item.isGoldExclusive) continue;
        } else if (temaForaDoBau && ['ui_skin', 'insignia'].includes(item.seasonSlot || '')) {
            continue;
        }
        pool[item.tier] = (pool[item.tier] || 0) + 1;
    }
    return pool;
};

const poolNormal = poolPorTier(false);
const poolTemporada = poolPorTier(true);

const NOME_DO_BAU = {
    comum: 'Comum', incomum: 'Incomum', radiante: 'Raro', ciclo: 'Ciclo (legado)',
    epico: 'Épico', lendario: 'Lendário', season: 'Mítico',
};

const tierMedio = (curva) =>
    Object.entries(curva).reduce((soma, [tier, pct]) => soma + Number(tier) * pct / 100, 0);

const alcance = (tipo, curva) => {
    const pool = tipo === 'season' ? poolTemporada : poolNormal;
    return Object.keys(curva).reduce((soma, tier) => soma + (pool[tier] || 0), 0);
};

/**
 * O alcance do bau Mitico NAO e a soma de todas as temporadas.
 *
 * A funcao filtra por `season_key` da temporada corrente, entao quem esta na
 * Genesis alcanca so as pecas da Genesis. Somar tudo daria um numero
 * tranquilizador e falso — foi assim que a Aurora I, com duas pecas, passou
 * despercebida.
 */
const alcanceMiticoPorTemporada = () => {
    const porChave = {};
    for (const item of ITEMS_DB) {
        if (!item.isSeasonExclusive || item.isLegacyRetired || !item.seasonKey) continue;
        if (temaForaDoBau && ['ui_skin', 'insignia'].includes(item.seasonSlot || '')) continue;
        porChave[item.seasonKey] = (porChave[item.seasonKey] || 0) + 1;
    }
    const nomes = {};
    for (const season of Object.values(SEASONS)) {
        if (season.seasonKey) nomes[season.seasonKey] = season.name;
    }
    return Object.entries(porChave).map(([chave, quantas]) => ({
        nome: nomes[chave] || chave, quantas,
    })).sort((a, b) => b.quantas - a.quantas);
};

const miticoPorTemporada = alcanceMiticoPorTemporada();

// ----------------------------------------------------------------- temporadas

const pecasPorTemporada = () => {
    const mapa = {};
    for (const item of ITEMS_DB) {
        if (!item.seasonKey || item.isLegacyRetired) continue;
        mapa[item.seasonKey] = mapa[item.seasonKey] || {};
        mapa[item.seasonKey][item.seasonSlot || '?'] = item.name;
    }
    return mapa;
};

const colecoes = pecasPorTemporada();

// --------------------------------------------------------------------- carimbo

const commit = (() => {
    try { return execSync('git rev-parse --short HEAD', { cwd: raiz }).toString().trim(); }
    catch { return 'sem git'; }
})();

const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

// ----------------------------------------------------------------------- HTML

/**
 * O caminho da arte para uma pagina que abre por DOIS CLIQUES.
 *
 * O app serve tudo a partir da raiz ('/assets/...'), e num arquivo aberto por
 * file:// isso vira C:/assets/... — a imagem quebra e a folha vira uma tabela
 * de quadrados vazios. A folha mora em docs/, entao o caminho relativo sobe um
 * nivel e entra em public/.
 */
const arte = (url) => String(url || '').replace(/^\/assets\//, '../public/assets/');

const esc = (valor) => String(valor).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const barraDaCurva = (curva) => {
    const cores = { 1: '#9CA3AF', 2: '#22C55E', 3: '#3B82F6', 4: '#A855F7', 5: '#F59E0B', 6: '#7B61FF' };
    return Object.entries(curva)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([tier, pct]) => `<span class="fatia" style="width:${pct}%;background:${cores[tier]}" title="tier ${tier}: ${pct}%">${pct >= 12 ? pct + '%' : ''}</span>`)
        .join('');
};

const linhasDosBaus = Object.entries(curvas).map(([tipo, curva]) => {
    const frag = fragmentos[tipo];
    const p = pity[tipo];
    return `<tr>
      <td><img class="mini" src="${esc(arte(getChestArtUrl(NOME_DO_BAU[tipo] || tipo)))}" alt=""> <strong>${esc(NOME_DO_BAU[tipo] || tipo)}</strong></td>
      <td class="barra">${barraDaCurva(curva)}</td>
      <td class="n">${tierMedio(curva).toFixed(2)}</td>
      <td class="n">${frag ? `${frag.min}–${frag.max}` : '<span class="zero">0</span>'}</td>
      <td class="n">${p ? `${p.aberturas} → t${p.tier}` : '—'}</td>
      <td class="n">${tipo === 'season'
        ? miticoPorTemporada.map((t) => `<span class="${t.quantas <= 2 ? 'falta' : 'ok'}">${t.quantas}</span> ${esc(t.nome)}`).join('<br>')
        : alcance(tipo, curva)}</td>
    </tr>`;
}).join('');

const linhasDasPatentes = NOBILITY_RANKS.map((rank, indice) => {
    const anterior = indice > 0 ? NOBILITY_RANKS[indice - 1].expTotalRequired : 0;
    const degrau = rank.expTotalRequired - anterior;
    const premios = (RANK_REWARDS[rank.id] || []).length;
    return `<tr>
      <td class="n">${indice + 1}</td>
      <td><strong>${esc(rank.name)}</strong></td>
      <td class="n">${rank.expTotalRequired.toLocaleString('pt-BR')}</td>
      <td class="n">${degrau ? '+' + degrau.toLocaleString('pt-BR') : '—'}</td>
      <td class="n">${Math.round(rank.expTotalRequired / 60).toLocaleString('pt-BR')} h</td>
      <td class="n">${premios || '—'}</td>
    </tr>`;
}).join('');

const linhasDosDesafios = SYSTEM_CHALLENGES.map((desafio) => `<tr>
    <td><strong>${esc(desafio.title)}</strong></td>
    <td class="n">${desafio.rewards?.xp ? '+' + desafio.rewards.xp : '—'}</td>
    <td>${desafio.rewardChest ? esc(desafio.rewardChest) : '—'}</td>
    <td class="fonte">${esc(desafio.id)}</td>
  </tr>`).join('');

const linhasDoCiclo = ciclo.degraus.map((degrau, i) => `<tr>
    <td class="n">${degrau.exp.toLocaleString('pt-BR')}</td>
    <td class="n">${ciclo.notas[i] !== undefined ? ciclo.notas[i] : '—'}</td>
    <td><strong>${esc(degrau.bau)}</strong></td>
  </tr>`).join('');

const linhasDasTemporadas = Object.values(SEASONS).map((season) => {
    const chave = season.seasonKey;
    const colecao = chave ? (colecoes[chave] || {}) : {};
    const celulas = PECAS_POR_TEMPORADA.map((slot) => colecao[slot]
        ? `<td class="ok" title="${esc(colecao[slot])}">✓</td>`
        : '<td class="falta">—</td>').join('');
    const quantas = Object.keys(colecao).length;
    return `<tr>
      <td><strong>${esc(season.name)}</strong><br><span class="fonte">${esc(season.startDate)}</span></td>
      ${celulas}
      <td class="n ${quantas === 5 ? 'ok' : 'falta'}">${quantas}/5</td>
      <td class="n">${(season.quests || []).length}</td>
    </tr>`;
}).join('');

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>A Escada — Glyph</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; padding:28px 24px 80px; background:#0e1013; color:#e7e9ec;
         font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif; }
  .wrap { max-width:1100px; margin:0 auto; }
  h1 { font-size:26px; margin:0 0 6px; letter-spacing:-.01em; }
  h2 { font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:#8b929c;
       margin:38px 0 4px; border-bottom:1px solid #23262c; padding-bottom:7px; }
  p.lead { color:#969ca6; max-width:70ch; margin:0 0 14px; }
  .carimbo { display:flex; gap:8px; flex-wrap:wrap; margin:14px 0 6px; }
  .carimbo span { font:11px/1 ui-monospace,monospace; letter-spacing:.06em; color:#8b929c;
                  border:1px solid #2a2e35; border-radius:5px; padding:6px 9px; background:#14171b; }
  .rolar { overflow-x:auto; margin-top:10px; }
  table { border-collapse:collapse; width:100%; font-size:13.5px; min-width:600px; }
  th,td { text-align:left; padding:8px 12px 8px 0; border-bottom:1px solid #23262c; vertical-align:middle; }
  th { font:10px/1 ui-monospace,monospace; letter-spacing:.12em; text-transform:uppercase; color:#7c828c; }
  td.n { font-variant-numeric:tabular-nums; white-space:nowrap; }
  td.fonte, .fonte { font:11px ui-monospace,monospace; color:#6e747c; }
  .mini { width:26px; height:26px; object-fit:contain; vertical-align:-8px; }
  .barra { min-width:180px; }
  .barra .fatia { display:inline-block; height:15px; font:9px/15px ui-monospace,monospace;
                  color:#07090b; text-align:center; font-weight:700; }
  .zero { color:#e9a268; font-weight:700; }
  .ok { color:#7fd8a4; } .falta { color:#e9a268; }
  .nota { margin-top:12px; padding:11px 13px; border-left:2px solid #d8b44c; background:#14171b;
          color:#969ca6; font-size:13.5px; }
  .nota strong { color:#e7e9ec; }
  pre { background:#14171b; border:1px solid #23262c; padding:12px 14px; overflow-x:auto;
        font:12px/1.5 ui-monospace,monospace; color:#c9cdd3; }
  footer { margin-top:52px; padding-top:16px; border-top:1px solid #23262c; color:#6e747c; font-size:12.5px; }
</style></head><body><div class="wrap">

<h1>A Escada</h1>
<p class="lead">O que o Glyph paga e o que ele cobra, numa tela só. Nenhum número aqui foi
escrito à mão: todos são lidos do código, do <code>ITEMS_DB</code> e da migração mais nova que
redefine <code>open_chest</code>. Onde o dado mora no servidor, a folha diz e traz o SQL de conferir.</p>

<div class="carimbo">
  <span>gerada ${esc(agora)}</span>
  <span>commit ${esc(commit)}</span>
  <span>sql: ${esc(sql.nome)}</span>
</div>

<h2>Os baús</h2>
<p class="lead">A barra é a curva de tiers. <strong>Alcance</strong> é quantos itens o baú
realmente pode entregar — a curva cruzada com o catálogo, respeitando as mesmas exclusões que o
servidor aplica. É a coluna que ninguém tinha.</p>
<div class="rolar"><table>
  <thead><tr><th>Baú</th><th>Curva de tiers</th><th>Tier médio</th><th>Fragmentos</th><th>Pity</th><th>Alcance</th></tr></thead>
  <tbody>${linhasDosBaus}</tbody>
</table></div>
<div class="nota"><strong>Como ler a coluna Alcance.</strong> Um baú com alcance baixo esgota em
poucas aberturas: o servidor sorteia primeiro o que você não tem, então depois disso vira
fragmento. É assim que se enxerga escassez antes de alguém reclamar.</div>
<div class="nota"><strong>O Mítico é por temporada, não somado.</strong> A função filtra pela
temporada corrente — quem está na Gênesis alcança só as peças da Gênesis. Somar as temporadas daria
um número tranquilizador e falso, e foi assim que a Aurora I, com duas peças, passou despercebida.
Uma temporada com menos de três peças significa duplicata garantida antes do terceiro baú.</div>

<h2>As patentes</h2>
<p class="lead">A régua do jogo é ~1 EXP por minuto executado, então a coluna de horas é o custo
real de cada degrau.</p>
<div class="rolar"><table>
  <thead><tr><th>#</th><th>Patente</th><th>EXP total</th><th>Degrau</th><th>Horas</th><th>Itens</th></tr></thead>
  <tbody>${linhasDasPatentes}</tbody>
</table></div>

<h2>O que paga o quê</h2>
<div class="rolar"><table>
  <thead><tr><th>Desafio de sistema</th><th>EXP</th><th>Baú</th><th>id</th></tr></thead>
  <tbody>${linhasDosDesafios}</tbody>
</table></div>

<h2>A escada do ciclo</h2>
<p class="lead">Lida de <code>views/ReportsView.tsx</code>. O tipo <em>Incomum</em> não aparece
aqui: ele existe no jogo, mas fica fora da escada do ciclo.</p>
<div class="rolar"><table>
  <thead><tr><th>EXP concedida</th><th>Nota mínima</th><th>Baú</th></tr></thead>
  <tbody>${linhasDoCiclo}</tbody>
</table></div>
<div class="nota">Mais <strong>${ciclo.promocao ?? '?'}%</strong> de chance de subir um degrau, e
nenhum baú para ciclo com menos de <strong>${ciclo.minimoDias ?? '?'} dias</strong>.</div>

<h2>As temporadas</h2>
<p class="lead">Cinco peças por temporada, sempre. O baú Mítico sorteia <strong>skin, borda e
banner</strong>; o selo entrega <strong>insígnia e tema</strong>. Coleção incompleta estreita o
baú: com duas peças, o terceiro baú da temporada é duplicata garantida.</p>
<div class="rolar"><table>
  <thead><tr><th>Temporada</th>${PECAS_POR_TEMPORADA.map((s) => `<th>${esc(s)}</th>`).join('')}<th>Peças</th><th>Quests</th></tr></thead>
  <tbody>${linhasDasTemporadas}</tbody>
</table></div>

<h2>Conferir no servidor</h2>
<p class="lead">Esta folha lê o <strong>repositório</strong>. A função que sorteia de verdade mora
no Supabase, e migração no repositório não é migração aplicada. Rode isto para comparar:</p>
<pre>select
  case when pg_get_functiondef(oid) like '%not in (''ui_skin'', ''insignia'')%'
       then 'OK - tema e insignia fora do sorteio' else 'DIVERGE do que esta folha mostra' end as filtro,
  case when pg_get_functiondef(oid) like '%when ''lendario'' then floor%'
       then 'OK - lendario paga fragmento' else 'DIVERGE' end as fragmentos,
  md5(pg_get_functiondef(oid)) as impressao
from pg_proc where proname = 'open_chest';</pre>
<div class="nota"><strong>A impressão digital serve para detectar mudança, não para comparar com o
repositório.</strong> O Postgres reescreve a função no formato dele, sem comentários — o md5 do
servidor nunca vai bater com o do arquivo. Para comparar conteúdo, é sempre <code>like</code>.</div>

<footer>
  Gerada por <code>scripts/build-ladder-sheet.mjs</code> · <code>npm run folhas</code>.
  Não edite este arquivo à mão: a próxima geração apaga.
</footer>
</div></body></html>`;

fs.writeFileSync(saida, html, 'utf8');
console.log(`a-escada: ${path.relative(raiz, saida)} (${(html.length / 1024).toFixed(0)} KB)`);
console.log(`  sql lido: ${sql.nome}`);
console.log(`  baus: ${Object.keys(curvas).length} · patentes: ${NOBILITY_RANKS.length} · temporadas: ${Object.keys(SEASONS).length}`);
