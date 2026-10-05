import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * A RODA DA MAESTRIA: A FRASE CABE, O ENCAIXE NAO BRIGA, O NUMERO NAO SOME.
 *
 * Tres defeitos relatados em 05/10/2026, na mesma tela, com a mesma raiz: duas
 * declaracoes disputando a mesma propriedade, em lugares diferentes.
 */

const css = readFileSync(new URL('../views/mastery-quiz.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const roda = readFileSync(new URL('../components/MasteryWheel.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const badge = readFileSync(new URL('../components/mastery-badge.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const pentagono = readFileSync(new URL('../components/AssetPentagon.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ============================================= 1. a frase do degrau cabe
//
// O item da roda tinha tres colunas — selo, frase, e um espelho VAZIO de 46px
// cuja unica funcao era centrar a frase no visor. Medido em tools/a-roda.html,
// num palco de 332px (o que a roda recebe num telefone de 393px): a frase
// ficava com 180px, e em 180px o clamp de 3 linhas cortava 24 das 55 frases do
// app. Quase metade — e a pessoa escolhia um degrau sem poder ler o que diz.
//
// Sem o espelho a coluna vai a 238px e nenhuma corta, com 22px de folga na
// altura do item.
const item = css.slice(css.indexOf('.mastery-wheel-item {'), css.indexOf('.mastery-wheel-selo'));
assert.ok(item.length > 200, 'o item da roda mudou de forma');
assert.match(item, /grid-template-columns: 46px minmax\(0, 1fr\);/,
    'a coluna vazia voltou ao item da roda, e com ela 24 frases cortadas');
assert.doesNotMatch(item, /46px minmax\(0, 1fr\) 46px/,
    'o espelho vazio do selo voltou');
console.log('ok - a frase do degrau tem a coluna inteira');

// A altura do item NAO pode ter mudado junto: e ela que ancora o snap, no CSS e
// no JS ao mesmo tempo. Se as duas se separarem, o encaixe cai entre itens.
assert.match(roda, /const ALTURA = 84;/, 'a altura do item mudou no JS');
assert.match(item, /height: var\(--altura-item\);/, 'o item deixou de ler a altura do JS');
assert.match(roda, /'--altura-item' as string\]: `\$\{ALTURA\}px`/,
    'o JS parou de publicar a altura que o CSS le — as duas reguas se separaram');
console.log('ok - a altura do item continua vindo de um lugar so');

// =============================== 2. o encaixe espera a rolagem acabar
//
// `assentar` vivia num timer de 140ms rearmado a cada evento de scroll, o que o
// punha para correr CONTRA o snap nativo em vez de cobri-lo: numa rolagem ainda
// desacelerando ele acordava no meio do caminho e puxava de volta para o item
// mais proximo, ignorando o impulso que o navegador ia completar.
assert.match(roda, /'onscrollend' in window/,
    'a roda voltou a nao usar scrollend — o encaixe corre contra o snap nativo');
assert.match(roda, /trilho\.addEventListener\('scrollend', aoTerminar\)/,
    'o encaixe deixou de ser chamado no fim real da rolagem');
assert.doesNotMatch(roda, /setTimeout\(assentar, 140\)/,
    'o timer curto voltou: 140ms nao cobrem a desaceleracao de um arrasto');
// O snap nativo continua sendo o principal; o assentar e a rede para o WebView.
assert.match(css, /scroll-snap-type: y mandatory;/,
    'o snap nativo saiu do trilho e sobrou so a rede em JS');
console.log('ok - o encaixe so age quando a rolagem terminou de verdade');

// =========================== 3. o numero do meio: sombra atras, metal na frente
//
// Tres tentativas, todas medidas na bancada (tools/o-numero-do-meio.html):
//
//   filter na letra   — a sombra fica atras e o metal claro, MAS era a mesma
//                       propriedade do brilho da faixa, e o inline de
//                       tintaMetalicaDo vencia: o brilho nunca pintou. E
//                       filter + background-clip:text e o par que o WebView
//                       perde ao repintar, mostrando um bloco branco.
//   text-shadow na    — desfeito no mesmo dia. Com o texto transparente, a
//   letra               camada do texto fica ACIMA do fundo recortado, e a
//                       sombra mora nela: o preto foi pintado POR CIMA do
//                       metal. O bronze virou quase preto — "agora o numero ta
//                       ilegivel".
//   duas camadas      — uma copia transparente atras carrega so as sombras; o
//                       metal vem por cima, sem sombra e sem filtro.
assert.match(pentagono, /const \{ filter: _contornoDoHelper, \.\.\.tintaDoNumero \} = tintaMetalicaDo\(metal\);/,
    'o filtro inline voltou a acompanhar a tinta e a matar o brilho da faixa');

// A ordem do DOM e a ordem de pintura: a sombra precisa vir ANTES do metal,
// senao ela e pintada por cima e o numero escurece de novo.
assert.match(
    pentagono,
    /<span className="mastery-badge-numero-pilha">\s*(?:\{\/\*[\s\S]*?\*\/\}\s*)?<span className="mastery-badge-numero-sombra" aria-hidden="true">\{masteryIndex\}<\/span>\s*<span className="mastery-badge-numero" style=\{tintaDoNumero\}>\{masteryIndex\}<\/span>/,
    'a sombra deixou de vir antes do metal na pilha — ela seria pintada por cima e o numero escureceria',
);

// O metal nao carrega sombra nem filtro: so a tinta.
const regraDoMetal = badge.slice(
    badge.indexOf('.mastery-badge-numero,\n.mastery-badge-numero-sombra {'),
    // O comentario quebra linha logo depois do `/*`, entao a ancora e o
    // titulo dele sozinho — com a barra junto ela nao existe, e o recorte
    // engoliria a camada de sombra.
    badge.indexOf('O NUMERO SAO DUAS CAMADAS'),
);
assert.ok(regraDoMetal.length > 200 && !regraDoMetal.includes('.mastery-badge-numero-sombra {' + '\n  color'),
    'a regra compartilhada do numero mudou de forma');
assert.doesNotMatch(regraDoMetal, /^\s*(filter|text-shadow):/m,
    'voltou sombra ou filtro na letra de metal — text-shadow a escurece, filter perde o recorte');
console.log('ok - a letra de metal so tem a tinta');

// A camada de tras: transparente, com contorno e brilho na mesma lista.
const sombra = badge.slice(
    badge.indexOf('.mastery-badge-numero-sombra {\n  color: transparent;'),
    badge.indexOf('/* OS 100'),
);
assert.ok(sombra.length > 100, 'a camada de sombra sumiu');
assert.match(sombra, /color: transparent;/, 'a camada de sombra deixou de ser transparente');
assert.match(sombra, /0 0 2px rgba\(0, 0, 0, \.62\)[\s\S]{0,80}--badge-brilho/,
    'contorno e brilho se separaram na camada de sombra');
assert.match(badge, /\.mastery-badge-numero-pilha > \* \{\s*grid-area: 1 \/ 1;/,
    'as duas camadas deixaram de dividir a mesma celula — o contorno desalinha do metal');
console.log('ok - contorno e brilho moram numa copia atras do metal');

// O respiro dos 100 anima a camada de tras e carrega o contorno nos dois quadros.
assert.match(badge, /\.mastery-badge--coroado \.mastery-badge-numero-sombra \{\s*animation: mastery-badge-respira/,
    'o respiro dos 100 saiu da camada de sombra');
const respiro = badge.slice(badge.indexOf('@keyframes mastery-badge-respira'));
assert.ok(
    (respiro.slice(0, 500).match(/0 0 2px rgba\(0, 0, 0, \.62\)/g) || []).length === 2,
    'o respiro dos 100 perdeu o contorno num dos quadros',
);
console.log('ok - o respiro dos 100 nao apaga o contorno');

// =================================================== 4. o anel no pentagono
//
// Sem peca nenhuma o numero disputava contraste com a propria teia. O anel
// volta como CONTORNO: aro com o metal e a espessura da faixa, veu so atras do
// glifo, e segundo aro a partir do 50. Os valores ja estavam nos tiers — borda
// e anelDuplo seguiam vivos nas pontas.
assert.match(pentagono, /centralStyle = 'anel',/, 'o anel deixou de ser o padrao do pentagono');
assert.match(pentagono, /'--badge-borda': String\(tier\.borda\)/,
    'o anel parou de ler a espessura da faixa');
const mastery = readFileSync(new URL('../views/MasteryView.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
assert.doesNotMatch(mastery, /centralStyle="plain"/,
    'a tela de avaliacao voltou ao numero sem anel');
const anel = badge.slice(badge.indexOf('.mastery-badge--anel {'), badge.indexOf('.mastery-badge--anel-duplo {'));
assert.match(anel, /border: calc\(var\(--badge-borda, 1\) \* 1px\) solid/, 'o aro perdeu a espessura da faixa');
assert.match(anel, /radial-gradient\(closest-side/, 'o veu atras do glifo sumiu');
assert.doesNotMatch(anel, /background: (rgba|#)[^;]*;/,
    'o miolo do anel virou cor solida — ele voltaria a tapar o cruzamento das linhas');
console.log('ok - o anel contorna o numero sem tapar a teia');

console.log('A roda da maestria: a frase cabe, o encaixe espera, e o numero tem um dono so.');
