/**
 * A MESA — onde os 150 itens se dividem entre as portas, de olho.
 *
 * O catalogo (`build-catalog-sheet.mjs`) responde "o que existe". A escada
 * (`build-ladder-sheet.mjs`) responde "quanto cada bau alcanca". Nenhum dos
 * dois responde a pergunta que trava a decisao: ONDE CADA ITEM MORA, e qual
 * casa esta vazia.
 *
 * Aqui isso vira uma matriz: cada LINHA e uma categoria, cada COLUNA e uma
 * porta. Celula vazia num degrau de patente acende — e a conta de "temos que
 * dar lugar para todos os itens" deixa de ser conversa e passa a ser um mapa
 * com buracos visiveis.
 *
 * A pagina arrasta. Mover um card de uma celula para outra muda a porta do
 * item, e o botao de exportar devolve o bloco `RANK_REWARDS` pronto para colar.
 *
 * O QUE ELA NAO FAZ: escrever no arquivo. A licao do alinhador de avatar vale
 * aqui inteira — ferramenta que so guarda no localStorage nunca chega no app.
 * Por isso a pagina NASCE semeada com o que esta no arquivo de verdade, o
 * rascunho do localStorage e so rascunho, e ha um botao para joga-lo fora.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const raiz = path.resolve(
    path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
    '..',
);
const saida = path.join(raiz, 'tools', 'a-mesa.html');

const empacota = async (entrada, nome) => {
    const destino = path.join(raiz, 'node_modules', '.cache', nome);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(raiz, entrada)],
        bundle: true, platform: 'node', format: 'esm', outfile: destino, logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const { ITEMS_DB, isChestEligibleItem } = await empacota('constants/items.ts', 'mesa-items.mjs');
const { RANK_REWARDS, NOBILITY_RANKS } = await empacota('constants/nobility.ts', 'mesa-nobility.mjs');

/** Os ids de um array literal do plpgsql, pelo nome da variavel. */
const sql = fs.readFileSync(path.join(raiz, 'sql', 'new_player_bootstrap_rewards.sql'), 'utf8');
const listaDoSql = (nome) => {
    const bloco = sql.match(new RegExp(`${nome} text\\[\\] := array\\[([^\\]]*)\\]`));
    return bloco ? bloco[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean) : [];
};
const noStarter = new Set(listaDoSql('v_starter_items'));

// ---------------------------------------------------------------- as colunas

/** Os dez degraus, na ordem da escada. */
const PATENTES = NOBILITY_RANKS.map((r, i) => ({ id: r.id, nome: r.name, ordem: i + 1 }));

/**
 * As portas que nao sao patente. `orfao` e a coluna que ninguem quer ocupada:
 * item que existe no catalogo e nao tem como ser obtido.
 */
const OUTRAS = [
    { id: 'inicial', nome: 'Pacote inicial' },
    { id: 'bau', nome: 'Só baú' },
    { id: 'loja', nome: 'Loja (ouro)' },
    { id: 'temporada', nome: 'Temporada' },
    { id: 'missao', nome: 'Missão' },
    { id: 'staff', nome: 'Staff' },
    { id: 'livre', nome: 'Livre p/ todos' },
    { id: 'orfao', nome: 'Sem porta' },
    { id: 'aposentado', nome: 'Aposentado' },
];

/** As linhas, na ordem em que fazem sentido conversar sobre elas. */
const CATEGORIAS = [
    { id: 'skin', nome: 'Roupa' },
    { id: 'hair', nome: 'Cabelo' },
    { id: 'aura', nome: 'Aura' },
    { id: 'border', nome: 'Borda' },
    { id: 'banner', nome: 'Banner' },
    { id: 'insignia', nome: 'Insígnia' },
    { id: 'ui_skin', nome: 'Skin de UI' },
    { id: 'artifact', nome: 'Artefato' },
    { id: 'plate', nome: 'Tábua / wallpaper' },
    { id: 'glyph', nome: 'Glifo' },
    { id: 'orb', nome: 'Orbe' },
    { id: 'garden', nome: 'Jardim' },
];
/** `insignias` no plural e a mesma linha de `insignia`; o DB tem as duas grafias. */
const linhaDe = (categoria) => (categoria === 'insignias' ? 'insignia' : categoria);

// ------------------------------------------------------- onde cada item mora

/** Quem e premio de patente hoje, e com que nome o degrau o anuncia. */
const porPatente = new Map();
for (const [rank, premios] of Object.entries(RANK_REWARDS || {})) {
    (premios || []).forEach((p) => {
        if (p.itemId) porPatente.set(p.itemId, { rank, nome: p.name, unlock: p.category });
    });
}

/**
 * A porta PRINCIPAL de um item, por precedencia.
 *
 * Um item pode entrar por varias portas ao mesmo tempo — 42 estao em loja E em
 * bau. Numa matriz isso nao cabe: um card, uma celula. Entao a porta principal
 * e a mais alta (a que da mais status a peca), e as outras viram pontinhos no
 * card. Arrastar muda a principal, que e a unica que a escada le.
 */
const portaDe = (item) => {
    if (item.isLegacyRetired) return 'aposentado';
    if (porPatente.has(item.id)) return porPatente.get(item.id).rank;
    if (noStarter.has(item.id)) return 'inicial';
    if (item.isGmExclusive) return 'staff';
    if (item.isQuestExclusive) return 'missao';
    if (item.isSeasonExclusive || item.seasonKey) return 'temporada';
    if (item.costGold) return 'loja';
    if (typeof isChestEligibleItem === 'function' && isChestEligibleItem(item)) return 'bau';
    // Cabelo virou aparencia: o SovereignCustomizer libera a categoria inteira.
    if (item.category === 'hair') return 'livre';
    return 'orfao';
};

const itens = ITEMS_DB
    .filter((i) => i.category !== 'chest')
    .map((i) => ({
        id: i.id,
        nome: i.name || i.id,
        linha: linhaDe(i.category),
        raridade: i.rarity || 'common',
        arte: i.imageUrl || '',
        icone: i.icon || '',
        porta: portaDe(i),
        nomeNaEscada: porPatente.get(i.id)?.nome || '',
        ouro: i.costGold || 0,
        bau: typeof isChestEligibleItem === 'function' ? Boolean(isChestEligibleItem(i)) : false,
    }))
    .filter((i) => CATEGORIAS.some((c) => c.id === i.linha));

/** A traducao de categoria de item para a categoria que o RANK_REWARDS usa. */
const UNLOCK = {
    skin: 'skins', hair: 'hairStyles', aura: 'auras', border: 'borders', banner: 'banners',
    insignia: 'insignias', ui_skin: 'ui_skins', artifact: 'artifacts', plate: 'plates',
    glyph: 'glyphs', orb: 'orbs', garden: 'ornament',
};

// ------------------------------------------------------------------ a pagina

const RARIDADES = {
    common: '#9aa3ad', uncommon: '#63b36b', rare: '#5b8fd6',
    epic: '#a86fd6', legendary: '#d8a23c', mythic: '#d9566b',
};

const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
let commit = 'sem git';
try { commit = execSync('git rev-parse --short HEAD', { cwd: raiz }).toString().trim(); } catch { /* fora do git */ }

const DADOS = JSON.stringify({
    selo: `${commit} · ${agora}`,
    itens, patentes: PATENTES, outras: OUTRAS, categorias: CATEGORIAS, unlock: UNLOCK,
});

const CSS = `
  :root { color-scheme: dark;
    --common:${RARIDADES.common}; --uncommon:${RARIDADES.uncommon}; --rare:${RARIDADES.rare};
    --epic:${RARIDADES.epic}; --legendary:${RARIDADES.legendary}; --mythic:${RARIDADES.mythic}; }
  * { box-sizing: border-box; }
  body { margin:0; padding:24px 20px 90px; background:#0e1013; color:#e7e9ec;
         font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif; }
  .wrap { max-width:1360px; margin:0 auto; }
  h1 { font-size:26px; margin:0 0 6px; letter-spacing:-.01em; }
  h2 { font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:#8b929c;
       margin:30px 0 10px; border-bottom:1px solid #23262c; padding-bottom:7px;
       display:flex; align-items:baseline; gap:10px; }
  h2 .contagem { font:11px ui-monospace,monospace; letter-spacing:.06em; color:#6e747c; text-transform:none; }
  p.lead { color:#969ca6; max-width:74ch; margin:0 0 14px; }
  .carimbo { display:flex; gap:8px; flex-wrap:wrap; margin:14px 0 6px; align-items:center; }
  .carimbo span { font:11px/1 ui-monospace,monospace; letter-spacing:.06em; color:#8b929c;
                  border:1px solid #2a2e35; border-radius:5px; padding:6px 9px; background:#14171b; }
  button { font:11px ui-monospace,monospace; letter-spacing:.08em; text-transform:uppercase;
           color:#d8d9dc; background:#1b1f25; border:1px solid #2f343c; border-radius:6px;
           padding:7px 12px; cursor:pointer; }
  button:hover { background:#232830; border-color:#3c434d; }
  button.forte { color:#0e1013; background:#d8b44c; border-color:#d8b44c; font-weight:700; }

  .mesa { width:100%; border-collapse:separate; border-spacing:3px; table-layout:fixed; }
  .mesa th { font:9px ui-monospace,monospace; letter-spacing:.09em; text-transform:uppercase;
             color:#8b929c; font-weight:400; padding:0 0 6px; vertical-align:bottom; text-align:center; }
  .mesa th .n { display:block; font-size:9px; color:#4e545c; margin-top:2px; }
  .mesa th.canto, .mesa td.rotulo { width:132px; text-align:left; }
  .mesa td.rotulo { font-size:11.5px; color:#c8ccd2; padding-right:6px; vertical-align:middle; }
  .mesa td.rotulo b { display:block; font-weight:500; }
  .mesa td.rotulo span { font:9px ui-monospace,monospace; color:#585e66; letter-spacing:.06em; }

  .cela { min-height:44px; border:1px solid #1d2026; border-radius:7px; background:#121419;
          padding:3px; display:flex; flex-wrap:wrap; gap:3px; align-content:flex-start; }
  .cela.alvo { border-color:#d8b44c; background:#1a1710; }
  /* A casa vazia e o assunto da pagina: tem que gritar mais que a cheia. */
  .cela.vazia { border:1px dashed #6b5320; background:repeating-linear-gradient(
                  -45deg, #17130b, #17130b 5px, #131009 5px, #131009 10px); }
  .cela.vazia::after { content:"—"; margin:auto; color:#6b5320; font:12px ui-monospace,monospace; }
  .cela.grande { max-height:156px; overflow-y:auto; }

  .card { width:34px; height:34px; border-radius:6px; border:1px solid var(--c); cursor:grab;
          background:radial-gradient(circle at 35% 28%, color-mix(in srgb, var(--c) 22%, transparent),
                     color-mix(in srgb, var(--c) 7%, transparent) 55%, #0a0c0f 88%);
          display:grid; place-items:center; overflow:hidden; position:relative; flex:none; }
  .card img { width:100%; height:100%; object-fit:contain; padding:2px; pointer-events:none; }
  .card .emoji { font-size:15px; pointer-events:none; }
  .card:active { cursor:grabbing; }
  .card.arrastando { opacity:.35; }
  .card .pontos { position:absolute; right:1px; bottom:1px; display:flex; gap:1px; }
  .card .pontos i { width:3px; height:3px; border-radius:50%; background:#8b929c; }
  .card .pontos i.ouro { background:#d8b44c; }
  .card.mexido { outline:1px solid #d8b44c; outline-offset:1px; }

  .placar { display:flex; gap:10px; flex-wrap:wrap; margin:18px 0 4px; }
  .placar div { flex:1; min-width:140px; border:1px solid #23262c; border-radius:8px;
                padding:11px 13px; background:#14171b; }
  .placar b { display:block; font-size:23px; line-height:1; }
  .placar span { display:block; font:10px ui-monospace,monospace; letter-spacing:.12em;
                 text-transform:uppercase; color:#6e747c; margin-top:6px; }
  .falta { color:#e9a268; }
  .nota { margin-top:12px; padding:11px 13px; border-left:2px solid #d8b44c; background:#14171b;
          color:#969ca6; font-size:13.5px; }
  .nota strong { color:#e7e9ec; }
  #saida { width:100%; height:300px; margin-top:12px; background:#0a0c0f; color:#c8ccd2;
           border:1px solid #2a2e35; border-radius:8px; padding:12px;
           font:11.5px/1.5 ui-monospace,monospace; resize:vertical; display:none; }
  #dica { position:fixed; left:0; bottom:0; right:0; padding:9px 16px; background:#14171b;
          border-top:1px solid #2a2e35; font:11.5px ui-monospace,monospace; color:#8b929c;
          display:flex; gap:14px; align-items:center; }
  #dica b { color:#e7e9ec; font-weight:500; }
  footer { margin-top:44px; padding-top:16px; border-top:1px solid #23262c; color:#6e747c; font-size:12.5px; }
`;

/**
 * O roteiro da pagina, fora do template do HTML de proposito.
 *
 * Tudo aqui dentro e string crua: um `${...}` escrito por engano no meio do
 * roteiro seria interpolado pelo Node na geracao, e o erro so apareceria no
 * navegador, longe da linha que o causou.
 */
const ROTEIRO = String.raw`
const CHAVE = 'glyph:a-mesa:rascunho';

/**
 * O rascunho guarda SO o que mudou — {id: porta} — e nunca a mesa inteira.
 *
 * Guardar a mesa inteira foi o erro do alinhador de avatar: a pagina abria com
 * a foto velha do localStorage e o arquivo de verdade ficava invisivel. Assim,
 * item que ninguem tocou sempre vem do arquivo, mesmo depois de uma geracao
 * nova mudar o catalogo por baixo.
 */
let mexidos = {};
try { mexidos = JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch (e) { mexidos = {}; }

const porta = (item) => mexidos[item.id] || item.porta;
const naEscada = (p) => DADOS.patentes.some((x) => x.id === p);
const guarda = () => { try { localStorage.setItem(CHAVE, JSON.stringify(mexidos)); } catch (e) {} };
const conta = (p) => DADOS.itens.filter((i) => porta(i) === p).length;
const escapa = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

document.getElementById('selo').textContent = DADOS.selo;

const cardHTML = (item) => {
  const dentro = item.arte
    ? '<img src="' + escapa(item.arte) + '" alt="" loading="lazy">'
    : '<span class="emoji">' + escapa(item.icone || '·') + '</span>';
  const pontos = (item.ouro ? '<i class="ouro"></i>' : '') + (item.bau ? '<i></i>' : '');
  return '<div class="card' + (mexidos[item.id] ? ' mexido' : '') + '" draggable="true" data-id="' +
    escapa(item.id) + '" style="--c:var(--' + item.raridade + ')" title="' +
    escapa(item.nome) + ' · ' + item.raridade + '">' + dentro +
    (pontos ? '<span class="pontos">' + pontos + '</span>' : '') + '</div>';
};

function monta(cabecalho, corpo, colunas) {
  const cab = document.getElementById(cabecalho);
  const tb = document.getElementById(corpo);
  cab.innerHTML = '<th class="canto">categoria</th>' + colunas.map((c) =>
    '<th>' + (c.ordem ? c.ordem + ' ' : '') + escapa(c.nome) +
    '<span class="n" id="n-' + cabecalho + '-' + c.id + '"></span></th>').join('');
  tb.innerHTML = DADOS.categorias.map((cat) =>
    '<tr><td class="rotulo"><b>' + escapa(cat.nome) + '</b><span id="r-' + corpo + '-' + cat.id + '"></span></td>' +
    colunas.map((c) => '<td><div class="cela' + (naEscada(c.id) ? '' : ' grande') +
      '" data-linha="' + cat.id + '" data-porta="' + c.id + '"></div></td>').join('') + '</tr>').join('');
}

function pinta() {
  document.querySelectorAll('.cela').forEach((cela) => {
    const lista = DADOS.itens.filter((i) => i.linha === cela.dataset.linha && porta(i) === cela.dataset.porta);
    cela.innerHTML = lista.map(cardHTML).join('');
    // So acende buraco na escada: celula vazia em "Staff" ou "Missao" e normal.
    cela.classList.toggle('vazia', naEscada(cela.dataset.porta) && lista.length === 0);
  });

  DADOS.patentes.forEach((p) => {
    const e = document.getElementById('n-cabEscada-' + p.id);
    if (e) e.textContent = conta(p.id);
  });
  DADOS.outras.forEach((o) => {
    const e = document.getElementById('n-cabOutras-' + o.id);
    if (e) e.textContent = conta(o.id);
  });
  DADOS.categorias.forEach((c) => {
    const daLinha = DADOS.itens.filter((i) => i.linha === c.id);
    const degraus = new Set(daLinha.filter((i) => naEscada(porta(i))).map((i) => porta(i)));
    const alvo = document.getElementById('r-corpoEscada-' + c.id);
    if (alvo) alvo.textContent = degraus.size + ' de 10 degraus';
    const outro = document.getElementById('r-corpoOutras-' + c.id);
    if (outro) outro.textContent = daLinha.length + ' itens';
  });

  document.getElementById('pTotal').textContent = DADOS.itens.length;
  document.getElementById('pEscada').textContent = DADOS.itens.filter((i) => naEscada(porta(i))).length;
  document.getElementById('pVazias').textContent = document.querySelectorAll('.cela.vazia').length;
  document.getElementById('pOrfaos').textContent = conta('orfao');
  document.getElementById('pMexidos').textContent = Object.keys(mexidos).length;
  liga();
}

let pegando = null;
const mostraFoco = (id) => {
  const item = DADOS.itens.find((i) => i.id === id);
  document.getElementById('foco').textContent = item ? item.nome + ' · ' + item.id : '';
};

function liga() {
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('dragstart', (e) => {
      pegando = card.dataset.id;
      card.classList.add('arrastando');
      e.dataTransfer.effectAllowed = 'move';
      mostraFoco(pegando);
    });
    card.addEventListener('dragend', () => { card.classList.remove('arrastando'); pegando = null; });
    card.addEventListener('mouseenter', () => mostraFoco(card.dataset.id));
  });
  document.querySelectorAll('.cela').forEach((cela) => {
    cela.addEventListener('dragover', (e) => {
      const item = DADOS.itens.find((i) => i.id === pegando);
      // A categoria e do item, nao da porta: arrastar uma Roupa para a linha de
      // Aura nao mudaria nada no jogo, so mentiria na tela.
      if (!item || item.linha !== cela.dataset.linha) return;
      e.preventDefault();
      cela.classList.add('alvo');
    });
    cela.addEventListener('dragleave', () => cela.classList.remove('alvo'));
    cela.addEventListener('drop', (e) => {
      e.preventDefault();
      cela.classList.remove('alvo');
      const item = DADOS.itens.find((i) => i.id === pegando);
      if (!item || item.linha !== cela.dataset.linha) return;
      if (cela.dataset.porta === item.porta) delete mexidos[item.id];
      else mexidos[item.id] = cela.dataset.porta;
      guarda();
      pinta();
    });
  });
}

document.getElementById('btRecarregar').addEventListener('click', () => {
  const n = Object.keys(mexidos).length;
  if (!n || confirm('Joga fora ' + n + ' mudanca(s) e volta para o que esta no arquivo?')) {
    mexidos = {};
    guarda();
    pinta();
  }
});

document.getElementById('btExportar').addEventListener('click', () => {
  const linhas = DADOS.patentes.map((p) => {
    const corpo = DADOS.itens.filter((i) => porta(i) === p.id).map((i) =>
      "        { category: '" + (DADOS.unlock[i.linha] || i.linha) + "', itemId: '" + i.id +
      "', name: '" + String(i.nomeNaEscada || i.nome).replace(/'/g, "\\'") + "' },").join('\n');
    return '    ' + p.id + ': [\n' + corpo + (corpo ? '\n' : '') + '    ],';
  }).join('\n');
  const cabecalho = '// Exportado por tools/a-mesa.html sobre ' + DADOS.selo + '.\n' +
    '// ' + Object.keys(mexidos).length + ' item(ns) mudaram de porta em relacao ao arquivo.\n';
  const saida = document.getElementById('saida');
  saida.style.display = 'block';
  saida.value = cabecalho +
    'export const RANK_REWARDS: Record<string, { category: UnlockCategory; itemId: string; name: string }[]> = {\n' +
    linhas + '\n};\n';
  saida.scrollIntoView({ behavior: 'smooth', block: 'center' });
  saida.select();
});

monta('cabEscada', 'corpoEscada', DADOS.patentes);
monta('cabOutras', 'corpoOutras', DADOS.outras);
pinta();
`;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>A Mesa — Glyph</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style></head><body><div class="wrap">

<h1>A Mesa</h1>
<p class="lead">Cada linha é uma categoria, cada coluna é uma porta. Onde a escada tem casa vazia a
célula acende — é um degrau que não entrega nada daquela categoria. Arraste um card para mudar a
porta do item; o botão de exportar devolve o bloco pronto para colar em
<code>constants/nobility.ts</code>.</p>

<div class="carimbo">
  <span>semeada de items.ts + nobility.ts</span>
  <span id="selo"></span>
  <button id="btExportar" class="forte">Exportar o bloco</button>
  <button id="btRecarregar">Recarregar do arquivo</button>
</div>

<div class="placar">
  <div><b id="pTotal">—</b><span>itens na mesa</span></div>
  <div><b id="pEscada">—</b><span>na escada de patente</span></div>
  <div><b id="pVazias" class="falta">—</b><span>casas vazias na escada</span></div>
  <div><b id="pOrfaos" class="falta">—</b><span>sem porta nenhuma</span></div>
  <div><b id="pMexidos">—</b><span>movidos neste rascunho</span></div>
</div>

<h2>A escada <span class="contagem">10 degraus × 12 categorias</span></h2>
<table class="mesa"><thead><tr id="cabEscada"></tr></thead><tbody id="corpoEscada"></tbody></table>

<h2>Fora da escada <span class="contagem">as outras portas</span></h2>
<table class="mesa"><thead><tr id="cabOutras"></tr></thead><tbody id="corpoOutras"></tbody></table>

<div class="nota"><strong>Isto não escreve no arquivo.</strong> A mesa nasce semeada com o que está
em <code>items.ts</code> e <code>nobility.ts</code> hoje; o que você arrasta fica num rascunho do
navegador e só chega no app quando o bloco exportado for colado. <em>Recarregar do arquivo</em> joga
o rascunho fora.</div>

<textarea id="saida" spellcheck="false" readonly></textarea>

<footer>
  Gerada por <code>scripts/build-mesa.mjs</code> · <code>npm run mesa</code>.
  Não edite este arquivo à mão: a próxima geração apaga.
</footer>
</div>

<div id="dica">
  <b>Arraste</b> um card de uma célula para outra
  · <b>ponto dourado</b> também está na loja
  · <b>ponto cinza</b> também cai de baú
  <span id="foco" style="margin-left:auto;color:#c8ccd2"></span>
</div>

<script>const DADOS = ${DADOS};</script>
<script>${ROTEIRO}</script>
</body></html>`;

fs.writeFileSync(saida, html, 'utf8');
const naEscada = itens.filter((i) => PATENTES.some((p) => p.id === i.porta)).length;
const orfaos = itens.filter((i) => i.porta === 'orfao').length;
console.log(`a-mesa: ${path.relative(raiz, saida)} (${(html.length / 1024).toFixed(0)} KB)`);
console.log(`  ${itens.length} itens · ${naEscada} na escada · ${orfaos} sem porta`);
