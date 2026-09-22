/**
 * A BANCADA DO QUE CHEGOU AGORA.
 *
 * Depois de uma leva de arte, o trabalho que sobra e conferir encaixe peca por
 * peca — e a pasta tem setenta arquivos, dos quais cinco sao novos. Abrir tudo
 * para achar os cinco e como procurar no escuro, e pior: da para reconferir a
 * mesma peca tres vezes sem perceber.
 *
 * Esta pagina responde uma pergunta so: O QUE MUDOU DESDE O ULTIMO COMMIT.
 *
 * Ela nao tem lista escrita a mao. A lista sai do `git status`, entao ela nunca
 * fica velha: commitou, a peca sai da bancada sozinha. Gerar de novo e o jeito
 * de atualizar.
 *
 *   node scripts/build-arte-nova.mjs
 *   → tools/arte-nova.html
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(
    path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
    '..',
);

const git = (args) => execFileSync('git', args, { cwd: raiz, encoding: 'utf8' });

// `--porcelain` para a saida nao depender de idioma nem de cor. Os dois
// primeiros caracteres sao o estado; o resto e o caminho.
const mudadas = git(['status', '--porcelain', '--', 'public/assets/catalog/avatars'])
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha) => ({
        estado: linha.slice(0, 2).trim(),
        caminho: linha.slice(2).trim().replace(/^"|"$/g, ''),
    }))
    .filter((item) => item.caminho.endsWith('.png'));

const roupas = mudadas.filter((i) => /\/SKIN_[^/]+\.png$/.test(i.caminho));
const cabelos = mudadas.filter((i) => i.caminho.includes('/hair/'));

const web = (caminho) => '/' + caminho.replace(/^public\//, '');
const nome = (caminho) => path.basename(caminho, '.png');

const CORPOS = [
    { rotulo: 'masculino', url: '/assets/catalog/avatars/body_masc_1.png' },
    { rotulo: 'feminino', url: '/assets/catalog/avatars/body_fem_1.png' },
];

const pecaHtml = (item) => {
    const id = nome(item.caminho);
    const novo = item.estado === '??';
    return `
      <article class="peca" data-id="${id}">
        <header>
          <label class="conferida">
            <input type="checkbox" data-id="${id}">
            <span>${id}</span>
          </label>
          <span class="etiqueta ${novo ? 'nova' : 'trocada'}">${novo ? 'nova' : 'substituida'}</span>
        </header>
        <div class="corpos${item.caminho.includes('/hair/') ? ' so-cabeca' : ''}">
          ${CORPOS.map((corpo) => `
            <figure>
              <div class="palco">
                <img class="corpo" src="${corpo.url}" alt="">
                <img class="peca-arte" src="${web(item.caminho)}" alt="">
              </div>
              <figcaption>${corpo.rotulo}</figcaption>
            </figure>`).join('')}
          <figure>
            <div class="palco xadrez">
              <img class="peca-arte" src="${web(item.caminho)}" alt="">
            </div>
            <figcaption>sozinha</figcaption>
          </figure>
        </div>
      </article>`;
};

const secao = (titulo, itens) => itens.length === 0 ? '' : `
    <section>
      <h2>${titulo} <small>${itens.length}</small></h2>
      <div class="grade">${itens.map(pecaHtml).join('')}</div>
    </section>`;

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Arte nova — o que chegou desde o ultimo commit</title>
<style>
  :root { color-scheme: dark; --borda: rgba(255,255,255,.1); }
  body { margin: 0; padding: 24px; background: #0b0d10; color: #e8e8ea;
         font: 14px/1.5 system-ui, -apple-system, Segoe UI, sans-serif; }
  h1 { font-size: 18px; letter-spacing: .14em; text-transform: uppercase; margin: 0 0 4px; }
  .sub { color: #8b8f96; margin: 0 0 24px; }
  h2 { font-size: 12px; letter-spacing: .18em; text-transform: uppercase;
       color: #b9bec6; margin: 28px 0 12px; }
  h2 small { color: #6f757d; font-weight: 400; }
  .grade { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); }
  .peca { border: 1px solid var(--borda); border-radius: 14px; background: #101318; padding: 12px; }
  .peca.ok { opacity: .38; }
  .peca header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
  .conferida { display: flex; align-items: center; gap: 8px; cursor: pointer; min-width: 0; }
  .conferida span { font-size: 11px; font-family: ui-monospace, monospace; color: #cfd4da;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .etiqueta { font-size: 9px; letter-spacing: .12em; text-transform: uppercase;
              border-radius: 999px; padding: 3px 8px; white-space: nowrap; }
  .etiqueta.nova { background: rgba(120,200,120,.14); color: #92d692; }
  .etiqueta.trocada { background: rgba(212,175,55,.14); color: #d4af37; }
  .corpos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .palco { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; background: #0b0d10; }
  .palco img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
  /* CABELO PRECISA DE ZOOM NA CABECA.
     Sobre o corpo inteiro ele vira oito pixels e nao da para julgar nada: a
     peca ocupa a franja de cima de um quadrado de 500. Aqui o palco mostra so
     o terco superior, que e onde ela mora. */
  .so-cabeca .palco img { transform: scale(2.8); transform-origin: 50% 14%; }

  .xadrez { background-image:
      linear-gradient(45deg, #1a1d22 25%, transparent 25%),
      linear-gradient(-45deg, #1a1d22 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #1a1d22 75%),
      linear-gradient(-45deg, transparent 75%, #1a1d22 75%);
    background-size: 14px 14px;
    background-position: 0 0, 0 7px, 7px -7px, -7px 0; }
  figcaption { font-size: 9px; letter-spacing: .1em; text-transform: uppercase;
               color: #6f757d; text-align: center; margin-top: 4px; }
  .aviso { color: #8b8f96; border-left: 2px solid rgba(212,175,55,.4); padding-left: 10px; margin: 0 0 24px; }
  .vazio { border: 1px dashed var(--borda); border-radius: 14px; padding: 28px; text-align: center; color: #6f757d; }
</style>
</head>
<body>
  <h1>Arte nova</h1>
  <p class="sub">
    O que mudou em <code>public/assets/catalog/avatars</code> desde o ultimo commit.
    Gerado em ${new Date().toLocaleString('pt-BR')}.
    <strong>Commitou, some daqui</strong> — rode <code>node scripts/build-arte-nova.mjs</code> de novo.
  </p>
  <p class="aviso">
    Aqui a peca e sobreposta CRUA, sem os ajustes de
    <code>constants/avatarOffsets.ts</code>. Serve para ver se a forma esta certa
    e se o recorte esta limpo — <strong>nao</strong> para julgar o encaixe final.
    Para o encaixe, <a href="/avatar-align.html">avatar-align</a>.
  </p>

  ${roupas.length + cabelos.length === 0
    ? '<div class="vazio">Nada mudou desde o ultimo commit.</div>'
    : secao('Roupas', roupas) + secao('Cabelos', cabelos)}

<script>
  /* A marca de "ja conferi" mora no navegador, e de proposito.
     Ela e um rascunho de sessao de trabalho, nao um dado do app: some quando a
     peca e commitada, porque a peca some da lista. */
  var CHAVE = 'glyph:arte-nova:conferidas';
  var conferidas = {};
  try { conferidas = JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch (e) {}

  document.querySelectorAll('input[type=checkbox]').forEach(function (caixa) {
    var id = caixa.dataset.id;
    caixa.checked = !!conferidas[id];
    caixa.closest('.peca').classList.toggle('ok', caixa.checked);
    caixa.addEventListener('change', function () {
      conferidas[id] = caixa.checked;
      caixa.closest('.peca').classList.toggle('ok', caixa.checked);
      try { localStorage.setItem(CHAVE, JSON.stringify(conferidas)); } catch (e) {}
    });
  });
</script>
<script src="/bancada-nav.js"></script>
</body>
</html>
`;

const destino = path.join(raiz, 'tools', 'arte-nova.html');
fs.writeFileSync(destino, html, 'utf8');
console.log(`arte-nova: ${roupas.length} roupas e ${cabelos.length} cabelos em tools/arte-nova.html`);
