import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/* ==========================================================================
 * O NUMERO VIRAVA UM TIJOLO DOURADO.
 *
 * Em 22/09/2026 chegou uma tela dos seis quadros do relatorio com TODO numero
 * substituido por um retangulo de gradiente: 100, 66/66, 55h, +3359, a letra do
 * Veredito. E legiveis, no meio deles, exatamente os valores que levam `tom`
 * (7/7, +12%) — que sao os unicos que NAO passam pela tinta metalica.
 *
 * A tinta e `background-clip: text` com o fill transparente, mais um
 * `filter: drop-shadow(...)` NO MESMO ELEMENTO. Essa dupla e fragil: o filtro
 * joga o elemento numa superficie de composicao propria, e em algumas maquinas o
 * recorte pelo texto se perde na rasterizacao. Quando se perde, o que sobra nao
 * e texto feio — e o retangulo inteiro do gradiente, com o texto invisivel por
 * baixo. Nao reproduz em toda maquina, porque depende de GPU e de driver, e o
 * app nao escolhe nenhum dos dois.
 *
 * A sombra passou a ser `text-shadow`, que desenha a partir da forma da letra e
 * nao cria superficie nenhuma.
 *
 * Este teste guarda as duas coisas: que a combinacao nao volte, e que a tinta
 * tenha um dono so — eram QUATRO copias do mesmo bloco de cinco linhas, e por
 * isso o conserto precisou ser feito quatro vezes.
 * ========================================================================== */

const listar = (dir) => readdirSync(dir).flatMap((nome) => {
  const caminho = join(dir, nome);
  if (statSync(caminho).isDirectory()) return listar(caminho);
  return /\.tsx?$/.test(nome) ? [caminho] : [];
});

const raiz = new URL('../components', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const arquivos = listar(raiz);

// Os comentarios saem ANTES da busca. O proprio texto que explica a armadilha
// cita "drop-shadow" ao lado de "background-clip: text" — sem tirar a prosa, a
// unica coisa que este teste acusaria seria a nota que ensina a evita-la.
const semComentarios = (fonte) => fonte
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

for (const caminho of arquivos) {
  const fonte = semComentarios(readFileSync(caminho, 'utf8'));

  // A busca e por OBJETO DE ESTILO, e nao por arquivo: um componente pode ter um
  // recorte por texto numa ponta e um drop-shadow em outra, sem se encostarem.
  const blocos = fonte.split(/\n\s*\n/);
  for (const bloco of blocos) {
    if (!/background-?clip['"\s:]+.{0,4}text/i.test(bloco)) continue;
    assert.ok(
      !/filter:\s*['"`]?\s*drop-shadow/i.test(bloco),
      `${caminho}: drop-shadow no mesmo estilo de um background-clip:text. `
      + 'Essa dupla apaga o texto e deixa o retangulo do gradiente em algumas maquinas. Use text-shadow.',
    );
  }
}

// ---------------------------------------------------------------------------
// A TINTA TEM UM DONO SO.
//
// Eram quatro copias do mesmo bloco — a placa, o codex das campanhas, a loja e a
// placa do legado. Cada uma com o seu drop-shadow proprio, e por isso o conserto
// teve de ser feito quatro vezes. Quem precisar da tinta agora pede.
// ---------------------------------------------------------------------------

const cartao = readFileSync(join(raiz, 'MetalReportCard.tsx'), 'utf8');
assert.match(cartao, /export const tintaMetalicaCom/, 'a tinta precisa ser exportavel a partir de um gradiente qualquer');
assert.match(cartao, /textShadow: SOMBRA_DA_TINTA_METALICA/, 'a sombra da tinta e uma so, e e text-shadow');

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
