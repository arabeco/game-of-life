/**
 * AS AURAS — a unica categoria que nao dava para ver.
 *
 * A aura nao e PNG: sao seis cores por aura em `utils/auraVisuals.ts`, pintadas
 * no canvas do avatar. Por isso ela nao aparece no catalogo, que so sabe mostrar
 * arquivo — e por isso ficou oito meses parecendo uma categoria vazia.
 *
 * Esta folha le a MESMA tabela e pinta com `getAuraBackground`, o gemeo em CSS
 * do que o canvas desenha. Nao e a mesma pintura pixel a pixel; e a mesma
 * receita de cor.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const raiz = path.resolve(
    path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
    '..',
);
const saida = path.join(raiz, 'tools', 'as-auras.html');

const empacota = async (entrada, nome) => {
    const destino = path.join(raiz, 'node_modules', '.cache', nome);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(raiz, entrada)],
        bundle: true, platform: 'node', format: 'esm', outfile: destino, logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const { getAuraBackground } = await empacota('utils/auraVisuals.ts', 'auras-visuais.mjs');
const { ITEMS_DB } = await empacota('constants/items.ts', 'auras-items.mjs');
const { RANK_REWARDS, NOBILITY_RANKS } = await empacota('constants/nobility.ts', 'auras-nobility.mjs');

const degrauDe = new Map();
NOBILITY_RANKS.forEach((r, i) => {
    (RANK_REWARDS[r.id] || []).forEach((p) => degrauDe.set(p.itemId, `${i + 1} ${r.name}`));
});

const RAR = {
    common: ['comum', '#9aa3ad'], uncommon: ['incomum', '#63b36b'], rare: ['raro', '#5b8fd6'],
    epic: ['épico', '#a86fd6'], legendary: ['lendário', '#d8a23c'], mythic: ['mítico', '#d9566b'],
};
const ORDEM = Object.keys(RAR);

const auras = ITEMS_DB
    .filter((i) => i.category === 'aura')
    .sort((a, b) => ORDEM.indexOf(a.rarity) - ORDEM.indexOf(b.rarity));

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
let commit = 'sem git';
try { commit = execSync('git rev-parse --short HEAD', { cwd: raiz }).toString().trim(); } catch { /* fora do git */ }

const cartao = (nome, id, raridade, porta) => {
    const [rotulo, cor] = RAR[raridade] || RAR.common;
    return `<figure class="peca" style="--c:${cor}">
  <div class="poco" style="background:${getAuraBackground(id)}"><div class="corpo"></div></div>
  <figcaption>
    <span class="nome">${esc(nome)}</span>
    <span class="rar">${rotulo}</span>
    <span class="porta">${esc(porta)}</span>
  </figcaption>
</figure>`;
};

/** A que existe no codigo de cor e nao tem item nenhum apontando para ela. */
const orfa = cartao('Fênix Dourada', 'item_aura_exclusive_001', 'legendary', 'não existe como item');

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>As Auras — Glyph</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; padding:28px 24px 80px; background:#0e1013; color:#e7e9ec;
         font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif; }
  .wrap { max-width:1100px; margin:0 auto; }
  h1 { font-size:26px; margin:0 0 6px; letter-spacing:-.01em; }
  h2 { font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:#8b929c;
       margin:34px 0 10px; border-bottom:1px solid #23262c; padding-bottom:7px; }
  p.lead { color:#969ca6; max-width:72ch; margin:0 0 14px; }
  .carimbo { display:flex; gap:8px; flex-wrap:wrap; margin:14px 0 6px; }
  .carimbo span { font:11px/1 ui-monospace,monospace; letter-spacing:.06em; color:#8b929c;
                  border:1px solid #2a2e35; border-radius:5px; padding:6px 9px; background:#14171b; }
  .grade { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:14px; }
  .peca { margin:0; }
  .poco { position:relative; aspect-ratio:3/4; border-radius:10px; overflow:hidden;
          border:1px solid color-mix(in srgb, var(--c) 45%, transparent); background-color:#07080a; }
  /* Um vulto no lugar do avatar: a aura so se le quando ha um corpo dentro dela. */
  .corpo { position:absolute; left:50%; bottom:12%; width:26%; height:58%;
           transform:translateX(-50%); border-radius:44% 44% 30% 30%;
           background:linear-gradient(#1b1f26, #0d1014); box-shadow:0 0 22px rgba(0,0,0,.55); }
  figcaption { margin-top:7px; }
  .nome { display:block; font-size:12.5px; color:#e7e9ec; }
  .rar { display:block; font:9px ui-monospace,monospace; letter-spacing:.1em;
         text-transform:uppercase; color:var(--c); margin-top:2px; }
  .porta { display:block; font:10px ui-monospace,monospace; color:#6e747c; margin-top:3px; }
  .nota { margin-top:14px; padding:11px 13px; border-left:2px solid #d8b44c; background:#14171b;
          color:#969ca6; font-size:13.5px; }
  .nota strong { color:#e7e9ec; }
  footer { margin-top:52px; padding-top:16px; border-top:1px solid #23262c; color:#6e747c; font-size:12.5px; }
</style></head><body><div class="wrap">

<h1>As Auras</h1>
<p class="lead">A única categoria que não dava para ver. A aura não é arquivo: são seis cores por
aura em <code>utils/auraVisuals.ts</code>, pintadas no canvas do avatar. O catálogo só sabe mostrar
arquivo, então ela sempre apareceu como emoji — e a categoria passou por vazia sem estar.</p>

<div class="carimbo">
  <span>gerada ${esc(agora)}</span>
  <span>commit ${esc(commit)}</span>
  <span>fonte: utils/auraVisuals.ts</span>
</div>

<h2>As ${auras.length} que existem</h2>
<div class="grade">${auras.map((a) => cartao(a.name, a.id, a.rarity, degrauDe.get(a.id) || 'sem degrau')).join('')}</div>

<h2>A que está no código e não é item</h2>
<div class="grade">${orfa}</div>
<div class="nota"><strong>A Fênix Dourada tem as seis cores escritas e nenhum item aponta para
ela.</strong> É o mesmo caso do <code>SKIN_T2_MILITAR.png</code>: trabalho pronto, fora do jogo.</div>

<div class="nota"><strong>Isto é o gêmeo em CSS, não a pintura do canvas.</strong> A receita de cor é
a mesma tabela; o desenho de verdade sai do <code>drawAuraCanvasEffect</code>, com o avatar dentro.
O vulto escuro aqui está no lugar do corpo, porque aura sem corpo não se lê.</div>

<footer>
  Gerada por <code>scripts/build-auras-sheet.mjs</code> · <code>npm run folhas</code>.
  Não edite este arquivo à mão: a próxima geração apaga.
</footer>
</div></body></html>`;

fs.writeFileSync(saida, html, 'utf8');
console.log(`as-auras: ${path.relative(raiz, saida)} (${(html.length / 1024).toFixed(0)} KB)`);
console.log(`  ${auras.length} auras · 1 no código sem item`);
