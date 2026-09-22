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

console.log('[tinta-metalica] ok');
