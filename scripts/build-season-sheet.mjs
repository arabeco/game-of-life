import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

/**
 * Gera docs/temporadas.html: a folha das treze temporadas, autocontida.
 *
 * Autocontida e o ponto. tools/season-editor.html so abre com o dev server
 * rodando, porque busca os PNGs em /assets — serve para editar, nao para
 * mostrar. Esta folha embute cada imagem no proprio arquivo, entao abre com
 * duplo clique e pode ser lida por quem tem a pasta e nao roda o projeto.
 *
 * Uso: node scripts/build-season-sheet.mjs
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const empacota = async (entrada, saida) => {
    const destino = path.join(root, 'node_modules', '.cache', saida);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(root, entrada)],
        bundle: true, platform: 'node', format: 'esm',
        outfile: destino, logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const { SEASONS, SEASON_ORDER, ACTIVE_SEASON_ID } =
    await empacota('constants/seasonContent.ts', 'season-sheet-content.mjs');
const { ITEMS_DB } = await empacota('constants/items.ts', 'season-sheet-items.mjs');
const { getRarityVisual } = await empacota('constants/rarityVisuals.ts', 'season-sheet-rarity.mjs');

const embutidas = new Map();
const embutir = (url) => {
    if (!url) return null;
    if (embutidas.has(url)) return embutidas.get(url);
    const arquivo = path.join(root, 'public', url.replace(/^\//, ''));
    if (!fs.existsSync(arquivo)) { embutidas.set(url, null); return null; }
    const tipo = arquivo.endsWith('.jpg') ? 'jpeg' : 'png';
    const dado = `data:image/${tipo};base64,${fs.readFileSync(arquivo).toString('base64')}`;
    embutidas.set(url, dado);
    return dado;
};

// As viradas caem em solsticio e equinocio. Nao e coincidencia do calendario:
// as datas em seasonContent sao exatamente essas, e nomear o evento diz mais
// sobre o ritmo das temporadas do que repetir a data.
const EVENTO = (iso) => {
    const [, mes, dia] = iso.split('-').map(Number);
    if (mes === 12 && dia >= 19) return 'solstício de dezembro';
    if (mes === 3 && dia >= 18) return 'equinócio de março';
    if (mes === 6 && dia >= 19) return 'solstício de junho';
    if (mes === 9 && dia >= 21) return 'equinócio de setembro';
    return null;
};

const CORES = {
    genesis: ['#b07ce8', '#41215f'],
    aurora: ['#5fd9c4', '#1a5951'],
    zenite: ['#efbc4b', '#69490c'],
    eclipse: ['#8f63f0', '#2d1b54'],
    egide: ['#7cc3e8', '#1f485c'],
};

const CATEGORIAS = [
    ['skin', 'Skin'], ['border', 'Borda'], ['banner', 'Banner'],
    ['ui_skin', 'Tema UI'], ['insignia', 'Insígnia'],
];

const escapar = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

const dataCurta = (iso) => {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
};

let faltando = 0;
let existindo = 0;

const secoes = SEASON_ORDER.map((id) => {
    const s = SEASONS[id];
    if (!s) return `<section class="temporada ausente"><h2>${escapar(id)}</h2><p>não existe em SEASONS</p></section>`;

    const [primaria, secundaria] = CORES[s.theme] || ['#d8b44c', '#8a6a12'];
    const itens = s.seasonKey ? ITEMS_DB.filter((i) => i.seasonKey === s.seasonKey) : [];
    const fundo = embutir(s.backgroundUrl);
    const ativa = id === ACTIVE_SEASON_ID;
    const vazia = !s.seasonKey;

    const slots = CATEGORIAS.map(([cat, rotulo]) => {
        const item = itens.find((i) => i.category === cat);
        if (!item) {
            faltando += 1;
            return `<figure class="peca falta">
            <div class="molde"><span>falta</span></div>
            <figcaption><b>${rotulo}</b></figcaption>
          </figure>`;
        }
        existindo += 1;
        const arte = embutir(item.imageUrl);
        const visual = getRarityVisual(item.rarity);
        const miolo = arte
            ? `<img src="${arte}" alt="${escapar(item.name)}">`
            : `<span class="emoji">${escapar(item.icon || '?')}</span>`;
        return `<figure class="peca">
            <div class="molde" style="--peca:${visual.hex}">${miolo}</div>
            <figcaption>
              <b>${rotulo}</b>
              <span class="nome">${escapar(item.name)}</span>
              <span class="rar" style="color:${visual.hex}">${escapar(visual.label)}</span>
            </figcaption>
          </figure>`;
    }).join('\n');

    const eventoInicio = EVENTO(s.startDate);

    return `<section class="temporada${ativa ? ' ativa' : ''}${vazia ? ' vazia' : ''}"
         style="--primaria:${primaria}; --secundaria:${secundaria}">
      <div class="marco">
        <span class="ponto"></span>
        <span class="quando">${dataCurta(s.startDate)}</span>
        ${eventoInicio ? `<span class="evento">${eventoInicio}</span>` : ''}
      </div>
      <div class="painel">
        <header class="cabeca">
          <h2>${escapar(s.name)}</h2>
          ${ativa ? '<span class="tag viva">em curso</span>' : ''}
          ${vazia ? '<span class="tag oca">sem chave · sem jornada · sem item</span>' : ''}
          <code>${escapar(id)}</code>
        </header>
        <div class="conteudo">
          <div class="capa">
            ${fundo ? `<img src="${fundo}" alt="">` : '<div class="semfundo"></div>'}
            <div class="veu"></div>
            <span class="rotulo">${escapar(s.launchTitle || s.name)}</span>
          </div>
          <div class="ficha">
            <dl>
              <dt>janela</dt><dd>${dataCurta(s.startDate)} — ${dataCurta(s.endDate)}</dd>
              <dt>chave</dt><dd>${s.seasonKey ? `<code>${escapar(s.seasonKey)}</code>` : '<i>nenhuma</i>'}</dd>
              <dt>jornadas</dt><dd>${s.quests?.length || 0}</dd>
              <dt>fundo</dt><dd><code>${escapar((s.backgroundUrl || '—').split('/').pop())}</code></dd>
            </dl>
            ${s.description ? `<p class="descricao">${escapar(s.description)}</p>` : ''}
            ${s.launchSummary ? `<p class="fala"><b>abre</b> ${escapar(s.launchSummary)}</p>` : ''}
            ${s.celebrationSummary ? `<p class="fala"><b>fecha</b> ${escapar(s.celebrationSummary)}</p>` : ''}
          </div>
        </div>
        <div class="colecao">${slots}</div>
      </div>
    </section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>As Treze Temporadas</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Archivo:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
  :root {
    --tinta: #0c0e13;
    --papel: #141822;
    --sulco: #1e2330;
    --linha: #2a3040;
    --texto: #e7eaf2;
    --meio: #9aa2b6;
    --fraco: #666f85;
    --alerta: #e08c6a;
    --display: 'Fraunces', Georgia, 'Times New Roman', serif;
    --corpo: 'Archivo', system-ui, sans-serif;
    --mono: 'JetBrains Mono', ui-monospace, Consolas, monospace;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0 0 80px;
    background: var(--tinta); color: var(--texto);
    font-family: var(--corpo); font-size: 15px; line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .folha { max-width: 1080px; margin: 0 auto; padding: 0 28px; }

  .abertura { padding: 72px 0 40px; border-bottom: 1px solid var(--linha); }
  .sobrenome {
    font-family: var(--mono); font-size: 11px; letter-spacing: .28em;
    text-transform: uppercase; color: var(--fraco); margin: 0 0 18px;
  }
  h1 {
    font-family: var(--display); font-weight: 800; font-size: clamp(38px, 7vw, 68px);
    font-variation-settings: 'opsz' 144; line-height: .98; letter-spacing: -.02em;
    margin: 0 0 20px; text-wrap: balance;
  }
  .chamada { font-size: 17px; color: var(--meio); max-width: 62ch; margin: 0; }
  .chamada strong { color: var(--texto); font-weight: 600; }

  .placar { display: flex; gap: 34px; margin-top: 34px; flex-wrap: wrap; }
  .placar div { display: flex; flex-direction: column; }
  .placar b {
    font-family: var(--display); font-variation-settings: 'opsz' 144;
    font-size: 34px; font-weight: 800; line-height: 1;
  }
  .placar span {
    font-family: var(--mono); font-size: 10.5px; letter-spacing: .16em;
    text-transform: uppercase; color: var(--fraco); margin-top: 7px;
  }

  /* A coluna da esquerda e a linha do tempo: as viradas caem em solsticio e
     equinocio, entao a sequencia carrega informacao e merece ser desenhada. */
  .temporada { display: grid; grid-template-columns: 132px 1fr; gap: 20px; padding-top: 34px; }
  .marco { position: relative; padding-top: 6px; text-align: right; }
  .marco::after {
    content: ''; position: absolute; right: -10px; top: 16px; bottom: -48px;
    width: 1px; background: linear-gradient(var(--primaria), transparent 78%);
    opacity: .4;
  }
  .temporada:last-of-type .marco::after { display: none; }
  .ponto {
    position: absolute; right: -14px; top: 10px; width: 9px; height: 9px;
    border-radius: 50%; background: var(--primaria);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--primaria) 20%, transparent);
  }
  .quando { display: block; font-family: var(--mono); font-size: 12px; color: var(--meio); }
  .evento { display: block; font-size: 11px; color: var(--fraco); margin-top: 2px; }

  .painel {
    border: 1px solid var(--linha); border-radius: 3px; background: var(--papel);
    border-left: 3px solid var(--primaria); padding: 18px 20px 20px; min-width: 0;
  }
  .vazia .painel { background: transparent; border-style: dashed; }
  .ativa .painel { box-shadow: 0 0 0 1px color-mix(in srgb, var(--primaria) 26%, transparent); }

  .cabeca { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
  .cabeca h2 {
    font-family: var(--display); font-variation-settings: 'opsz' 120;
    font-size: 25px; font-weight: 600; margin: 0; color: var(--primaria);
    letter-spacing: -.01em;
  }
  .cabeca code { margin-left: auto; }
  code { font-family: var(--mono); font-size: 11.5px; color: var(--fraco); }
  .tag {
    font-family: var(--mono); font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase;
    padding: 3px 9px; border-radius: 2px; border: 1px solid currentColor;
  }
  .tag.viva { color: var(--primaria); }
  .tag.oca { color: var(--alerta); }

  .conteudo { display: flex; gap: 18px; flex-wrap: wrap; align-items: flex-start; }
  .capa {
    position: relative; width: 250px; height: 140px; flex: none;
    border-radius: 2px; overflow: hidden; background: #0a0c10;
  }
  .capa img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .semfundo { width: 100%; height: 100%; background: linear-gradient(140deg, #14171f, #0a0c10); }
  .veu {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 28%, color-mix(in srgb, var(--secundaria) 55%, transparent) 78%, rgba(6,7,10,.95) 100%);
  }
  .capa .rotulo {
    position: absolute; left: 12px; right: 12px; bottom: 10px;
    font-family: var(--display); font-variation-settings: 'opsz' 100;
    font-size: 17px; font-weight: 600; color: var(--primaria);
    text-shadow: 0 2px 10px rgba(0,0,0,.9);
  }

  .ficha { flex: 1; min-width: 260px; }
  dl { display: grid; grid-template-columns: 78px 1fr; gap: 3px 12px; margin: 0 0 12px; }
  dt {
    font-family: var(--mono); font-size: 10px; letter-spacing: .14em;
    text-transform: uppercase; color: var(--fraco); padding-top: 3px;
  }
  dd { margin: 0; font-size: 13.5px; color: var(--meio); font-variant-numeric: tabular-nums; }
  dd i { color: var(--alerta); font-style: normal; }
  .descricao { font-size: 13.5px; color: var(--meio); margin: 0 0 8px; max-width: 62ch; }
  .fala { font-size: 12.5px; color: var(--fraco); margin: 0 0 5px; max-width: 62ch; }
  .fala b {
    font-family: var(--mono); font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase;
    color: var(--primaria); margin-right: 7px;
  }

  .colecao { display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
  .peca { margin: 0; width: 104px; }
  .molde {
    width: 104px; height: 104px; border-radius: 2px; overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--peca, var(--linha)) 45%, transparent);
    background:
      linear-gradient(160deg, color-mix(in srgb, var(--peca, transparent) 16%, transparent), rgba(0,0,0,.35));
    display: flex; align-items: center; justify-content: center; padding: 8px;
  }
  .molde img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .molde .emoji { font-size: 34px; }
  .falta .molde { border-style: dashed; border-color: var(--sulco); background: none; }
  .falta .molde span {
    font-family: var(--mono); font-size: 9.5px; letter-spacing: .14em;
    text-transform: uppercase; color: var(--sulco);
  }
  .peca figcaption { display: flex; flex-direction: column; gap: 1px; margin-top: 6px; }
  .peca b {
    font-family: var(--mono); font-size: 9.5px; letter-spacing: .13em;
    text-transform: uppercase; color: var(--fraco); font-weight: 600;
  }
  .peca .nome {
    font-size: 12px; color: var(--texto);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .peca .rar { font-family: var(--mono); font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase; }

  .temporada.ausente { display: block; color: var(--alerta); padding-top: 34px; }

  footer {
    margin-top: 56px; padding-top: 22px; border-top: 1px solid var(--linha);
    font-size: 12.5px; color: var(--fraco);
  }
  footer code { color: var(--meio); }

  @media (max-width: 720px) {
    .temporada { grid-template-columns: 1fr; }
    .marco { text-align: left; padding-left: 14px; }
    .marco::after { left: 0; right: auto; }
    .ponto { left: -4px; right: auto; }
    .capa { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
</style>
</head>
<body>
<div class="folha">
  <header class="abertura">
    <p class="sobrenome">Glyph · catálogo de temporadas</p>
    <h1>As Treze Temporadas</h1>
    <p class="chamada">
      Tudo que cada temporada carrega, e o que ainda não existe. As viradas caem em
      <strong>solstício e equinócio</strong> — a Primeira Era corre em quatro ciclos por ano:
      Aurora, Zênite, Eclipse, Égide. Gerado de <code>constants/seasonContent.ts</code>.
    </p>
    <div class="placar">
      <div><b>13</b><span>temporadas</span></div>
      <div><b>${existindo}</b><span>peças prontas</span></div>
      <div><b>${faltando}</b><span>peças faltando</span></div>
      <div><b>${SEASON_ORDER.filter((id) => SEASONS[id] && !SEASONS[id].seasonKey).length}</b><span>temporadas vazias</span></div>
    </div>
  </header>

  ${secoes}

  <footer>
    Cada temporada leva cinco peças: skin, borda, banner, tema de interface e insígnia.
    Molde tracejado é o que falta desenhar. As cores vêm do campo <code>theme</code>
    de cada temporada. Regerar: <code>node scripts/build-season-sheet.mjs</code>
  </footer>
</div>
</body>
</html>`;

const saida = path.join(root, 'docs', 'temporadas.html');
fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, html, 'utf8');
console.log(`docs/temporadas.html — ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);
console.log(`${existindo} peças prontas, ${faltando} faltando`);
