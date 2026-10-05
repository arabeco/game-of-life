import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * A RODA DA MAESTRIA: A FRASE CABE, O ENCAIXE NAO BRIGA, O NUMERO NAO SOME.
 *
 * Tres defeitos relatados em 05/10/2026, na mesma tela, com a mesma raiz: duas
 * declaracoes disputando a mesma propriedade, em lugares diferentes.
 */

const css = readFileSync(new URL('../views/mastery-quiz.css', import.meta.url), 'utf8');
const roda = readFileSync(new URL('../components/MasteryWheel.tsx', import.meta.url), 'utf8');
const badge = readFileSync(new URL('../components/mastery-badge.css', import.meta.url), 'utf8');
const pentagono = readFileSync(new URL('../components/AssetPentagon.tsx', import.meta.url), 'utf8');

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

// ====================== 3. o numero do meio tem UM dono para o brilho
//
// O contorno chegava em `filter`, inline, por `tintaMetalicaDo`. O brilho da
// faixa estava em `filter` no CSS. Inline vence: medido na bancada, com
// `--badge-brilho: 0.2` o filtro aplicado era so o par de sombras pretas — a
// escada de brilho que justificou os cortes em 25/50/75/90/100 nunca pintou.
//
// E `filter` nesta letra custa caro: ela e pintada por `background-clip: text`,
// e o filtro a joga numa superficie de composicao propria, onde o WebView do
// Android perde o recorte ao repintar e mostra o gradiente como um bloco quase
// branco. Era o retangulo branco por cima do numero.
assert.match(pentagono, /const \{ filter: _contornoDoHelper, \.\.\.tintaDoNumero \} = tintaMetalicaDo\(metal\);/,
    'o filtro inline voltou a acompanhar a tinta e a matar o brilho da faixa');

const numero = badge.slice(badge.indexOf('.mastery-badge-numero {'), badge.indexOf('/* OS 100'));
assert.ok(numero.length > 200, 'a regra do numero mudou de forma');
assert.doesNotMatch(numero, /^\s*filter:/m,
    'voltou um filter no numero — com background-clip:text ele perde o recorte no repaint');
assert.match(numero, /text-shadow:/, 'o contorno e o brilho sairam do numero');
assert.match(numero, /var\(--badge-brilho, 0\)/,
    'o brilho da faixa sumiu da sombra do numero');
// O contorno precisa estar na MESMA lista: text-shadow nao acumula entre regras.
assert.match(numero, /0 0 2px rgba\(0, 0, 0, \.62\)[\s\S]{0,80}--badge-brilho/,
    'contorno e brilho se separaram; a ultima declaracao apagaria a outra');
console.log('ok - contorno e brilho do numero vivem numa lista so');

// O respiro dos 100 substitui a lista inteira enquanto roda, entao tem de
// carregar o contorno junto — senao a letra perde a borda a cada quadro.
const respiro = badge.slice(badge.indexOf('@keyframes mastery-badge-respira'));
assert.doesNotMatch(respiro.slice(0, 400), /filter: drop-shadow/,
    'o respiro dos 100 voltou para filter');
assert.ok(
    (respiro.slice(0, 500).match(/0 0 2px rgba\(0, 0, 0, \.62\)/g) || []).length === 2,
    'o respiro dos 100 perdeu o contorno num dos quadros',
);
console.log('ok - o respiro dos 100 nao apaga o contorno');

console.log('A roda da maestria: a frase cabe, o encaixe espera, e o numero tem um dono so.');
