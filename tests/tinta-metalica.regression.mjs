import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/* ==========================================================================
 * O NUMERO DO RELATORIO VIRAVA UM TIJOLO DOURADO.
 *
 * Em 22/09/2026 chegou uma tela dos seis quadros com TODO numero substituido
 * por um retangulo de gradiente: 100, 66/66, 55h, +3359, a letra do Veredito.
 * O recorte pela letra tinha se perdido na rasterizacao daquela maquina, e o
 * que sobrou foi o tijolo do fundo inteiro.
 *
 * O PRIMEIRO CONSERTO ESTAVA ERRADO, e vale ficar escrito.
 *
 * Culpei a dupla `filter: drop-shadow` + `background-clip: text` no mesmo
 * elemento e troquei o filtro por `text-shadow`. Mas a placa de ciclo usa essa
 * mesma dupla desde sempre e nunca quebrou em maquina nenhuma — e o remedio
 * tinha efeito colateral visivel: `text-shadow` desenha ANTES do gradiente
 * pintar por cima, entao nas bordas suavizadas do glifo a sombra atravessa e
 * acinzenta o ouro. Sumiu o tijolo e entrou um numero cinza.
 *
 * A REGRA QUE FICOU: a tinta metalica do app E a da placa de ciclo.
 *
 * Nao "parecida com": a mesma declaracao de `.metal-report-card__score` — mesmo
 * angulo, mesmas paradas, mesmo desfoque de 1px, mesma cor solida de reserva
 * embaixo do fill transparente. A placa e a peca que atravessou o app inteiro
 * sendo legivel; quem precisa de ouro pede a ela em vez de inventar o seu.
 *
 * Era esse o estrago maior: eram QUATRO copias do mesmo bloco de cinco linhas,
 * cada uma com o seu angulo e a sua sombra, e por isso qualquer conserto tinha
 * de ser feito quatro vezes.
 * ========================================================================== */

const listar = (dir) => readdirSync(dir).flatMap((nome) => {
  const caminho = join(dir, nome);
  if (statSync(caminho).isDirectory()) return listar(caminho);
  return /\.tsx?$/.test(nome) ? [caminho] : [];
});

const raiz = new URL('../components', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const arquivos = listar(raiz);

// ---------------------------------------------------------------------------
// A TINTA TEM UM DONO SO.
//
// Eram quatro copias do mesmo bloco — a placa, o codex das campanhas, a loja e a
// placa do legado. Cada uma com o seu drop-shadow proprio, e por isso o conserto
// teve de ser feito quatro vezes. Quem precisar da tinta agora pede.
// ---------------------------------------------------------------------------

const cartao = readFileSync(join(raiz, 'MetalReportCard.tsx'), 'utf8');
assert.match(cartao, /export const tintaMetalicaCom/, 'a tinta precisa ser exportavel a partir de um gradiente qualquer');
assert.match(cartao, /export const gradienteMetalico/, 'o gradiente da placa precisa ser pedivel por quem quiser ouro');

// O CONTRATO COM A PLACA, LADO A LADO.
//
// Se a folha de estilo da placa mudar e o helper nao, volta a haver dois ouros
// no app com uma linha de diferenca — que foi exatamente como isto comecou.
const folhaDaPlaca = readFileSync(join(raiz, 'metal-report-card.css'), 'utf8');
const regraDoScore = folhaDaPlaca.slice(
  folhaDaPlaca.indexOf('.metal-report-card__score,'),
  folhaDaPlaca.indexOf('.metal-report-card__score {'),
);
for (const pedaco of ['118deg', '18%', '#fffaf0 48%', '78%', 'drop-shadow(0 1px 1px rgba(0, 0, 0, .8))']) {
  assert.ok(
    regraDoScore.includes(pedaco),
    `a placa mudou e o helper nao: "${pedaco}" sumiu de .metal-report-card__score`,
  );
  assert.ok(
    cartao.includes(pedaco),
    `o helper deixou de ser igual a placa: "${pedaco}" nao esta no MetalReportCard`,
  );
}

const declaracoes = arquivos.filter((caminho) => (
  /WebkitTextFillColor:\s*'transparent'/.test(readFileSync(caminho, 'utf8'))
));
assert.deepEqual(
  declaracoes.map((caminho) => caminho.split(/[\\/]/).pop()),
  ['MetalReportCard.tsx'],
  'a tinta metalica voltou a ser declarada fora do MetalReportCard: '
  + `${declaracoes.join(', ')}`,
);

/* ==========================================================================
 * O PE DOS ALGARISMOS SUMIA.
 *
 * Depois de o ouro voltar, "+3359" chegou com a base dos treses e do nove
 * cortada reta. Nao era fonte nem recorte: era a CAIXA.
 *
 * A tinta e um gradiente recortado pela letra, e gradiente e FUNDO. Fundo so
 * pinta dentro da caixa do elemento. O numero vinha com `leading-[0.86]`, e ele
 * e filho de um flex — o que o torna bloco e faz a caixa valer a entrelinha
 * inteira. Medido na tela: caixa de 56px para uma letra de 66px, nove pixels de
 * falta. O que sobrava para fora nao ganhava gradiente nenhum, e como o
 * preenchimento do texto e transparente, aquilo simplesmente nao existia.
 *
 * Entrelinha menor que 1 e recurso legitimo de tipografia em qualquer outro
 * lugar. Em cima da tinta, e um corte.
 * ========================================================================== */

const QUEBRA = String.fromCharCode(10);

for (const caminho of arquivos) {
  const fonte = readFileSync(caminho, 'utf8');
  if (!/tintaMetalica|\.\.\.tinta/.test(fonte)) continue;

  const linhas = fonte.split(QUEBRA).map((linha) => linha.trimEnd());
  linhas.forEach((linha, indice) => {
    if (!/\.\.\.tinta/.test(linha)) return;
    // O className costuma estar na linha de cima; a janela cobre o elemento.
    const janela = linhas.slice(Math.max(0, indice - 3), indice + 2).join(' ');
    const apertada = janela.match(/leading-\[(0?\.\d+)\]/);
    assert.ok(
      !apertada,
      `${caminho}:${indice + 1}: entrelinha ${apertada && apertada[1]} num elemento com a tinta metalica. `
      + 'O gradiente so pinta dentro da caixa, entao a parte da letra que sobra para fora some. Use 1 ou mais.',
    );
    // `leading-none` — entrelinha exatamente 1 — passa, e e o PISO.
    //
    // A caixa fica do tamanho do corpo da fonte, e o que escapa dela e so a
    // ultraestrutura do desenho da letra: a cauda de um "g", o rabo de um "ç". A
    // placa do legado tem quatro elementos assim, tres deles com `tabular-nums`,
    // onde nao ha descendente nenhum para cortar. Nao ha estrago medido ali, e
    // subir a entrelinha de uma placa inteira sem ver o resultado trocaria um
    // risco por outro. O que este teste impede e o buraco de verdade: 0.86 tirou
    // nove pixels de uma letra de sessenta e seis.
  });
}

console.log('[tinta-metalica] ok');
