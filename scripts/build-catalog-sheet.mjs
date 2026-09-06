import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

/**
 * O CATALOGO — a folha do que existe para ganhar.
 *
 * O `ITEMS_DB` tem mais de cem itens e sete jeitos de um item ficar
 * inalcancavel: exclusivo de patente, de ouro, de temporada, de quest, de
 * relatorio, aposentado, ou simplesmente sem PNG — e este ultimo SOME do
 * catalogo sem avisar ninguem. Nenhuma tela do jogo mostra isso junto, entao
 * "por que esse item nunca aparece?" so se responde lendo codigo.
 *
 * Aqui a resposta e uma linha na tabela.
 *
 * REGRA DE HONESTIDADE: nada e escrito a mao. As marcas saem das flags do
 * proprio item, e a arte e o arquivo de verdade — se o PNG nao existir no
 * disco, a folha mostra o quadrado vazio, que e o que a pessoa veria.
 */

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const saida = path.join(raiz, 'docs', 'o-catalogo.html');

const empacota = async (entrada, nome) => {
    const destino = path.join(raiz, 'node_modules', '.cache', nome);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(raiz, entrada)],
        bundle: true, platform: 'node', format: 'esm', outfile: destino, logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const { ITEMS_DB, ITEM_IDS_PENDING_ART, isItemCatalogVisible } =
    await empacota('constants/items.ts', 'catalogo-items.mjs');
const { getRarityVisual, getChestDisplayName, getChestVisual } =
    await empacota('constants/rarityVisuals.ts', 'catalogo-rarity.mjs');
const { getChestArtUrl } = await empacota('constants/catalogAssets.ts', 'catalogo-assets.mjs');
const { ACTIVE_GOLD_STORE_ITEM_IDS } = await empacota('constants/goldCatalog.ts', 'catalogo-loja.mjs');

/**
 * O caminho da arte para uma pagina que abre por DOIS CLIQUES. O app serve tudo
 * da raiz ('/assets/...'), e em file:// isso vira C:/assets/... — a folha
 * viraria uma tabela de quadrados vazios.
 */
const arte = (url) => String(url || '').replace(/^\/assets\//, '../public/assets/');
const naPasta = (url) => Boolean(url) && fs.existsSync(path.join(raiz, 'public', String(url).replace(/^\//, '')));

const CATEGORIAS = [
    ['skin', 'Skins'], ['hair', 'Cabelos'], ['insignia', 'Insígnias'], ['border', 'Bordas'],
    ['banner', 'Banners'], ['ui_skin', 'Temas de interface'], ['artifact', 'Artefatos'],
    ['glyph', 'Glifos'], ['orb', 'Orbes'], ['plate', 'Placas'], ['aura', 'Auras'],
];

const naLoja = new Set(ACTIVE_GOLD_STORE_ITEM_IDS || []);
const escondidos = new Set(ITEM_IDS_PENDING_ART || []);

/** As marcas que tornam um item inalcancavel, ou alcancavel so por um caminho. */
const marcasDoItem = (item) => {
    const marcas = [];
    if (item.isSeasonExclusive) marcas.push(['temporada', '#7B61FF']);
    if (item.isRankExclusive) marcas.push(['patente', '#F59E0B']);
    if (item.isGoldExclusive) marcas.push(['ouro', '#D8B44C']);
    if (item.isQuestExclusive) marcas.push(['quest', '#14B8A6']);
    if (item.isReportExclusive) marcas.push(['relatório', '#B87333']);
    if (item.isPremiumOnly) marcas.push(['premium', '#A855F7']);
    if (item.isChestExclusive) marcas.push(['baú', '#3B82F6']);
    if (item.isLegacyRetired) marcas.push(['aposentado', '#6E747C']);
    if (naLoja.has(item.id)) marcas.push(['loja', '#22C55E']);
    return marcas;
};

const total = ITEMS_DB.length;
const comArte = ITEMS_DB.filter((item) => naPasta(item.imageUrl)).length;
const prometemArteQuebrada = ITEMS_DB.filter((item) => item.imageUrl && !naPasta(item.imageUrl));
const invisiveis = ITEMS_DB.filter((item) => !isItemCatalogVisible(item));

const commit = (() => {
    try { return execSync('git rev-parse --short HEAD', { cwd: raiz }).toString().trim(); }
    catch { return 'sem git'; }
})();
const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const esc = (valor) => String(valor).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const celulaDoItem = (item) => {
    const raridade = getRarityVisual(item.rarity);
    const temArte = naPasta(item.imageUrl);
    const oculto = escondidos.has(item.id) || !isItemCatalogVisible(item);
    const marcas = marcasDoItem(item)
        .map(([texto, cor]) => `<span class="marca" style="--c:${cor}">${esc(texto)}</span>`).join('');
    return `<figure class="peca ${oculto ? 'oculta' : ''}" title="${esc(item.id)}">
      <div class="arte" style="--c:${raridade.hex}">
        ${temArte
          ? `<img src="${esc(arte(item.imageUrl))}" alt="" loading="lazy">`
          : `<span class="emoji">${esc(item.icon || '?')}</span>`}
        ${oculto ? '<span class="selo-oculto">oculto</span>' : ''}
      </div>
      <figcaption>
        <span class="nome">${esc(item.name)}</span>
        <span class="rar" style="color:${raridade.hex}">${esc(raridade.label)}</span>
        ${marcas}
      </figcaption>
    </figure>`;
};

const secoes = CATEGORIAS.map(([categoria, rotulo]) => {
    const itens = ITEMS_DB.filter((item) => item.category === categoria);
    if (!itens.length) return '';
    const semArte = itens.filter((item) => !naPasta(item.imageUrl)).length;
    return `<h2>${esc(rotulo)}
      <span class="contagem">${itens.length}${semArte ? ` · <b class="falta">${semArte} sem arte</b>` : ' · completa'}</span>
    </h2>
    <div class="grade">${itens.map(celulaDoItem).join('')}</div>`;
}).join('');

const TIPOS_DE_BAU = ['Comum', 'Incomum', 'Raro', 'Ciclo', 'Épico', 'Season', 'Lendário', 'Skin Comum'];
const baus = TIPOS_DE_BAU.map((tipo) => {
    const visual = getChestVisual(tipo);
    return `<figure class="peca">
      <div class="arte" style="--c:${visual.hex}">
        <img src="${esc(arte(getChestArtUrl(tipo)))}" alt="" loading="lazy">
      </div>
      <figcaption>
        <span class="nome">${esc(getChestDisplayName(tipo))}</span>
        <span class="rar" style="color:${visual.hex}">${esc(visual.label)}</span>
        <span class="marca" style="--c:#6E747C">${esc(tipo)}</span>
      </figcaption>
    </figure>`;
}).join('');

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>O Catálogo — Glyph</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; padding:28px 24px 80px; background:#0e1013; color:#e7e9ec;
         font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif; }
  .wrap { max-width:1100px; margin:0 auto; }
  h1 { font-size:26px; margin:0 0 6px; letter-spacing:-.01em; }
  h2 { font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:#8b929c;
       margin:34px 0 10px; border-bottom:1px solid #23262c; padding-bottom:7px;
       display:flex; align-items:baseline; gap:10px; }
  h2 .contagem { font:11px ui-monospace,monospace; letter-spacing:.06em; color:#6e747c; text-transform:none; }
  p.lead { color:#969ca6; max-width:72ch; margin:0 0 14px; }
  .carimbo { display:flex; gap:8px; flex-wrap:wrap; margin:14px 0 6px; }
  .carimbo span { font:11px/1 ui-monospace,monospace; letter-spacing:.06em; color:#8b929c;
                  border:1px solid #2a2e35; border-radius:5px; padding:6px 9px; background:#14171b; }
  .placar { display:flex; gap:10px; flex-wrap:wrap; margin:18px 0 4px; }
  .placar div { flex:1; min-width:150px; border:1px solid #23262c; border-radius:8px;
                padding:12px 14px; background:#14171b; }
  .placar b { display:block; font-size:24px; line-height:1; }
  .placar span { display:block; font:10px ui-monospace,monospace; letter-spacing:.12em;
                 text-transform:uppercase; color:#6e747c; margin-top:6px; }
  .grade { display:grid; grid-template-columns:repeat(auto-fill,minmax(104px,1fr)); gap:10px; }
  .peca { margin:0; }
  .peca .arte { position:relative; aspect-ratio:1; display:grid; place-items:center; overflow:hidden;
                border:1px solid color-mix(in srgb, var(--c) 45%, transparent); border-radius:10px;
                background:radial-gradient(circle at 35% 28%, color-mix(in srgb, var(--c) 20%, transparent),
                           color-mix(in srgb, var(--c) 6%, transparent) 55%, #0a0c0f 85%); }
  .peca .arte img { width:100%; height:100%; object-fit:contain; padding:8px; }
  .peca .emoji { font-size:30px; filter:grayscale(.2); }
  .peca.oculta .arte { opacity:.42; }
  .selo-oculto { position:absolute; bottom:4px; left:4px; font:8px ui-monospace,monospace;
                 letter-spacing:.1em; text-transform:uppercase; color:#e9a268;
                 background:rgba(0,0,0,.72); padding:2px 5px; border-radius:3px; }
  figcaption { margin-top:6px; }
  .nome { display:block; font-size:11px; line-height:1.25; color:#e7e9ec; }
  .rar { display:block; font:9px ui-monospace,monospace; letter-spacing:.1em;
         text-transform:uppercase; margin-top:2px; }
  .marca { display:inline-block; margin:3px 3px 0 0; font:8px ui-monospace,monospace;
           letter-spacing:.08em; text-transform:uppercase; color:var(--c);
           border:1px solid color-mix(in srgb, var(--c) 40%, transparent); border-radius:3px; padding:1px 4px; }
  .falta { color:#e9a268; }
  .nota { margin-top:12px; padding:11px 13px; border-left:2px solid #d8b44c; background:#14171b;
          color:#969ca6; font-size:13.5px; }
  .nota strong { color:#e7e9ec; }
  footer { margin-top:52px; padding-top:16px; border-top:1px solid #23262c; color:#6e747c; font-size:12.5px; }
</style></head><body><div class="wrap">

<h1>O Catálogo</h1>
<p class="lead">Tudo que existe para ganhar, com a arte de verdade e as marcas que dizem por qual
caminho cada peça chega. Um item pode ser inalcançável de sete maneiras — e uma delas, ficar sem
PNG, o esconde do catálogo <strong>sem avisar ninguém</strong>. Aqui isso aparece.</p>

<div class="carimbo">
  <span>gerada ${esc(agora)}</span>
  <span>commit ${esc(commit)}</span>
  <span>fonte: constants/items.ts</span>
</div>

<div class="placar">
  <div><b>${total}</b><span>itens no catálogo</span></div>
  <div><b>${comArte}</b><span>com arte no disco</span></div>
  <div><b class="${total - comArte ? 'falta' : ''}">${total - comArte}</b><span>ainda com emoji</span></div>
  <div><b class="${invisiveis.length ? 'falta' : ''}">${invisiveis.length}</b><span>escondidos do catálogo</span></div>
</div>

${prometemArteQuebrada.length ? `<div class="nota"><strong>${prometemArteQuebrada.length} item(ns) apontam para arte que não existe no disco.</strong>
Isso é pior que emoji: o emoji parece escolha, o quadrado vazio parece defeito.
${prometemArteQuebrada.map((item) => esc(item.id)).join(', ')}</div>` : ''}

<div class="nota"><strong>Item escondido não dá erro.</strong> Categoria que exige PNG some do
catálogo quando o item não tem <code>imageUrl</code> — sem log, sem aviso, sem tela. Para quem joga,
o item simplesmente deixa de existir. Os marcados <em>oculto</em> aqui estão nessa situação.</div>

<h2>Os baús <span class="contagem">8 tipos · 6 artes</span></h2>
<div class="grade">${baus}</div>
<div class="nota"><strong>Oito tipos, seis desenhos.</strong> Comum e Skin Comum dividem a arte;
Raro e Ciclo também. O tipo gravado na conta é o que está na etiqueta cinza — o nome de cima é o
que a pessoa lê.</div>

${secoes}

<footer>
  Gerada por <code>scripts/build-catalog-sheet.mjs</code> · <code>npm run folhas</code>.
  Não edite este arquivo à mão: a próxima geração apaga.
</footer>
</div></body></html>`;

fs.writeFileSync(saida, html, 'utf8');
console.log(`o-catalogo: ${path.relative(raiz, saida)} (${(html.length / 1024).toFixed(0)} KB)`);
console.log(`  ${total} itens · ${comArte} com arte · ${invisiveis.length} escondidos · ${prometemArteQuebrada.length} com caminho quebrado`);
