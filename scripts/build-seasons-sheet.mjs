import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

/**
 * AS TEMPORADAS — a folha do que cada uma carrega.
 *
 * Treze temporadas na linha do tempo e onze delas vazias. Isso nao aparece em
 * lugar nenhum do app: a tela mostra a temporada corrente, e o vazio das outras
 * so se descobre lendo `constants/seasonContent.ts` inteiro.
 *
 * E o vazio nao e cosmetico. A colecao alimenta o bau Mitico, que sorteia
 * DENTRO das pecas da temporada ativa — uma temporada com duas pecas entrega
 * duplicata a partir do terceiro bau. Foi assim que a Aurora I passou
 * despercebida.
 *
 * REGRA DE HONESTIDADE: a folha le o codigo e o disco. Peca que nao existe
 * aparece como buraco, nao como espaco em branco.
 */

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const saida = path.join(raiz, 'docs', 'as-temporadas.html');

const empacota = async (entrada, nome) => {
    const destino = path.join(raiz, 'node_modules', '.cache', nome);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(raiz, entrada)],
        bundle: true, platform: 'node', format: 'esm', outfile: destino, logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const { SEASONS, PECAS_POR_TEMPORADA, MISSOES_POR_TEMPORADA, GM_SEASON_MISSIONS } =
    await empacota('constants/seasonContent.ts', 'temporadas-seasons.mjs');
const { ITEMS_DB } = await empacota('constants/items.ts', 'temporadas-items.mjs');
const { getRarityVisual } = await empacota('constants/rarityVisuals.ts', 'temporadas-rarity.mjs');

const arte = (url) => String(url || '').replace(/^\/assets\//, '../public/assets/');
const naPasta = (url) => Boolean(url) && fs.existsSync(path.join(raiz, 'public', String(url).replace(/^\//, '')));

const ROTULO_DA_PECA = {
    skin: 'Skin', border: 'Borda', banner: 'Banner', insignia: 'Insígnia', ui_skin: 'Tema',
};

/** As pecas de cada temporada, por slot. Aposentadas nao contam. */
const colecaoDe = (chave) => {
    const mapa = {};
    if (!chave) return mapa;
    for (const item of ITEMS_DB) {
        if (item.seasonKey !== chave || item.isLegacyRetired) continue;
        mapa[item.seasonSlot || '?'] = item;
    }
    return mapa;
};

const selos = (GM_SEASON_MISSIONS || []).filter((missao) => missao.goal_type === 'quests_claimed');
const seloDa = (seasonId) => selos.find((missao) => missao.season_id === seasonId) || null;

const hoje = new Date().toISOString().slice(0, 10);
const estadoDaTemporada = (season) => {
    if (season.endDate < hoje) return { texto: 'encerrada', cor: '#6E747C' };
    if (season.startDate <= hoje) return { texto: 'ativa agora', cor: '#22C55E' };
    return { texto: 'futura', cor: '#8b929c' };
};

const commit = (() => {
    try { return execSync('git rev-parse --short HEAD', { cwd: raiz }).toString().trim(); }
    catch { return 'sem git'; }
})();
const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const esc = (valor) => String(valor).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const todas = Object.values(SEASONS).sort((a, b) => a.startDate.localeCompare(b.startDate));

const cartaoDaTemporada = (season) => {
    const colecao = colecaoDe(season.seasonKey);
    const estado = estadoDaTemporada(season);
    const selo = seloDa(season.id);
    const quests = season.quests || [];
    const fundo = season.backgroundUrl;
    const fundoReal = naPasta(fundo) && /background/.test(String(fundo));
    const cor = season.cores?.primaria || '#8b929c';

    const pecas = PECAS_POR_TEMPORADA.map((slot) => {
        const item = colecao[slot];
        if (!item) {
            return `<div class="peca vazia"><span class="slot">${esc(ROTULO_DA_PECA[slot] || slot)}</span><span class="buraco">falta</span></div>`;
        }
        const raridade = getRarityVisual(item.rarity);
        const temArte = naPasta(item.imageUrl);
        return `<div class="peca" title="${esc(item.id)}">
          <div class="arte" style="--c:${raridade.hex}">
            ${temArte ? `<img src="${esc(arte(item.imageUrl))}" alt="" loading="lazy">` : `<span class="emoji">${esc(item.icon || '?')}</span>`}
          </div>
          <span class="slot">${esc(ROTULO_DA_PECA[slot] || slot)}</span>
          <span class="nome">${esc(item.name)}</span>
          ${temArte ? '' : '<span class="buraco">sem PNG</span>'}
        </div>`;
    }).join('');

    const noBau = PECAS_POR_TEMPORADA
        .filter((slot) => ['skin', 'border', 'banner'].includes(slot) && colecao[slot]).length;

    return `<article class="temporada" style="--cor:${cor}">
      <header>
        ${fundoReal ? `<img class="fundo" src="${esc(arte(fundo))}" alt="" loading="lazy">` : ''}
        <div class="cabeca">
          <div>
            <h2>${esc(season.name)}</h2>
            <span class="datas">${esc(season.startDate)} → ${esc(season.endDate)}</span>
          </div>
          <span class="estado" style="--c:${estado.cor}">${esc(estado.texto)}</span>
        </div>
      </header>

      <div class="pecas">${pecas}</div>

      <div class="rodape">
        <span class="dado ${Object.keys(colecao).length === PECAS_POR_TEMPORADA.length ? 'ok' : 'falta'}">
          ${Object.keys(colecao).length}/${PECAS_POR_TEMPORADA.length} peças
        </span>
        <span class="dado ${quests.length === MISSOES_POR_TEMPORADA ? 'ok' : 'falta'}">
          ${quests.length}/${MISSOES_POR_TEMPORADA} jornadas
        </span>
        <span class="dado ${selo ? 'ok' : 'falta'}">${selo ? 'selo pronto' : 'sem selo'}</span>
        <span class="dado ${noBau >= 3 ? 'ok' : 'falta'}">baú alcança ${noBau}</span>
        ${fundoReal ? '<span class="dado ok">fundo vertical</span>' : '<span class="dado falta">sem fundo</span>'}
      </div>

      ${noBau < 3 ? `<p class="alerta">Com ${noBau} peça(s) sorteável(is), o baú Mítico desta temporada
      entrega duplicata a partir do ${noBau + 1}º. São três baús por temporada.</p>` : ''}
    </article>`;
};

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>As Temporadas — Glyph</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; padding:28px 24px 80px; background:#0e1013; color:#e7e9ec;
         font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif; }
  .wrap { max-width:1100px; margin:0 auto; }
  h1 { font-size:26px; margin:0 0 6px; letter-spacing:-.01em; }
  p.lead { color:#969ca6; max-width:72ch; margin:0 0 14px; }
  .carimbo { display:flex; gap:8px; flex-wrap:wrap; margin:14px 0 22px; }
  .carimbo span { font:11px/1 ui-monospace,monospace; letter-spacing:.06em; color:#8b929c;
                  border:1px solid #2a2e35; border-radius:5px; padding:6px 9px; background:#14171b; }
  .regra { margin:0 0 24px; padding:14px 16px; border-left:2px solid #d8b44c; background:#14171b; color:#969ca6; }
  .regra strong { color:#e7e9ec; }
  .linha { display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); gap:18px; }
  .temporada { border:1px solid #23262c; border-radius:12px; overflow:hidden; background:#111417; }
  .temporada header { position:relative; min-height:96px; display:flex; align-items:flex-end;
                      border-bottom:1px solid #23262c; overflow:hidden; }
  .temporada .fundo { position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
                      object-position:center 30%; opacity:.5; }
  .cabeca { position:relative; width:100%; display:flex; justify-content:space-between;
            align-items:flex-end; gap:10px; padding:14px 14px 12px;
            background:linear-gradient(transparent, rgba(10,12,15,.9)); }
  .temporada h2 { margin:0; font-size:17px; letter-spacing:.02em; color:var(--cor); }
  .datas { font:10px ui-monospace,monospace; letter-spacing:.08em; color:#8b929c; }
  .estado { font:9px ui-monospace,monospace; letter-spacing:.12em; text-transform:uppercase;
            color:var(--c); border:1px solid color-mix(in srgb, var(--c) 45%, transparent);
            border-radius:999px; padding:3px 8px; white-space:nowrap; }
  .pecas { display:grid; grid-template-columns:repeat(5,1fr); gap:7px; padding:14px; }
  .peca { text-align:center; min-width:0; }
  .peca .arte { aspect-ratio:1; display:grid; place-items:center; overflow:hidden; border-radius:8px;
                border:1px solid color-mix(in srgb, var(--c) 45%, transparent);
                background:radial-gradient(circle at 35% 28%, color-mix(in srgb, var(--c) 20%, transparent), #0a0c0f 85%); }
  .peca .arte img { width:100%; height:100%; object-fit:contain; padding:6px; }
  .peca .emoji { font-size:22px; }
  .peca.vazia { display:flex; flex-direction:column; justify-content:center; align-items:center;
                gap:4px; border:1px dashed #33383f; border-radius:8px; padding:10px 4px; }
  .slot { display:block; margin-top:5px; font:8px ui-monospace,monospace; letter-spacing:.1em;
          text-transform:uppercase; color:#6e747c; }
  .nome { display:block; font-size:9.5px; line-height:1.2; color:#c9cdd3; overflow:hidden;
          text-overflow:ellipsis; white-space:nowrap; }
  .buraco { display:block; font:8px ui-monospace,monospace; letter-spacing:.08em;
            text-transform:uppercase; color:#e9a268; }
  .rodape { display:flex; flex-wrap:wrap; gap:6px; padding:0 14px 14px; }
  .dado { font:9px ui-monospace,monospace; letter-spacing:.08em; text-transform:uppercase;
          border:1px solid #2a2e35; border-radius:4px; padding:3px 7px; color:#8b929c; }
  .dado.ok { color:#7fd8a4; border-color:#2f6b46; }
  .dado.falta { color:#e9a268; border-color:#5a3a1e; }
  .alerta { margin:0 14px 14px; padding:9px 11px; border-left:2px solid #e9a268; background:#1a1512;
            color:#c9a184; font-size:12px; }
  footer { margin-top:52px; padding-top:16px; border-top:1px solid #23262c; color:#6e747c; font-size:12.5px; }
</style></head><body><div class="wrap">

<h1>As Temporadas</h1>
<p class="lead">O que cada temporada carrega, e o que falta. O vazio aqui não é cosmético: a coleção
alimenta o baú Mítico, que sorteia <strong>dentro das peças da temporada ativa</strong>.</p>

<div class="carimbo">
  <span>gerada ${esc(agora)}</span>
  <span>commit ${esc(commit)}</span>
  <span>fonte: constants/seasonContent.ts</span>
</div>

<div class="regra">
  <strong>A regra da coleção.</strong> Toda temporada tem ${MISSOES_POR_TEMPORADA} jornadas e
  ${PECAS_POR_TEMPORADA.length} peças. As jornadas pagam um Baú Mítico cada, que sorteia entre
  <strong>skin, borda e banner</strong>. O selo entrega as outras duas:
  <strong>insígnia e tema de interface</strong>. O baú te veste; o fecho te marca.
  <br><br>
  A conta fecha sem sorte — três baús, três peças, e o servidor sorteia primeiro o que a pessoa não
  tem. Uma temporada com menos de três peças sorteáveis quebra essa conta.
</div>

<div class="linha">${todas.map(cartaoDaTemporada).join('')}</div>

<footer>
  Gerada por <code>scripts/build-seasons-sheet.mjs</code> · <code>npm run folhas</code>.
  Não edite este arquivo à mão: a próxima geração apaga.
</footer>
</div></body></html>`;

fs.writeFileSync(saida, html, 'utf8');
const completas = todas.filter((s) => Object.keys(colecaoDe(s.seasonKey)).length === PECAS_POR_TEMPORADA.length).length;
console.log(`as-temporadas: ${path.relative(raiz, saida)} (${(html.length / 1024).toFixed(0)} KB)`);
console.log(`  ${todas.length} temporadas · ${completas} com a coleção completa · ${selos.length} selos escritos`);
