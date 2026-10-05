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
//                       tintaMetalicaDo vencia: o brilho nunca pintou.
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

// ============================ 4. o branco ao arrastar: o atalho `background`
//
// O retangulo branco por cima do numero aparecia ao ARRASTAR o nivel, e foi
// atribuido primeiro ao `filter` e ao WebView do Android. Errado: reproduzia no
// navegador de mesa, nas duas variantes, e a bancada pegou pelo estilo inline
// depois da troca de faixa — sem `background-clip` nenhum —, com 194 avisos do
// proprio React no console: "Updating background when a conflicting property
// is set (backgroundClip)".
//
// O atalho `background` redefine todas as subpropriedades de fundo, inclusive
// o clip. Num re-render o React so reescreve o que MUDOU: trocou a faixa, ele
// reaplica `background` e nao reaplica o `backgroundClip`, que continuou
// 'text'. O gradiente passa a pintar a caixa inteira; na prata, quase branco.
//
// O helper e compartilhado por cinco telas, e todas tinham o mesmo bug latente.
const metalReport = readFileSync(new URL('../components/MetalReportCard.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const helper = metalReport.slice(
    metalReport.indexOf('export const tintaMetalicaCom'),
    metalReport.indexOf('export const gradienteMetalico'),
);
assert.ok(helper.length > 100, 'o helper da tinta de metal mudou de forma');
assert.match(helper, /backgroundImage: gradiente,/,
    'a tinta de metal deixou de usar backgroundImage');
assert.doesNotMatch(helper, /^\s*background: /m,
    'o atalho `background` voltou ao helper — ele zera o background-clip a cada troca de faixa, e o numero vira um bloco branco');
console.log('ok - a tinta usa backgroundImage, e trocar de faixa nao apaga o recorte');

// E o anel NAO voltou: a peca de luxo pedida era a dos degraus da roda, nao um
// aro no centro do pentagono.
const mastery = readFileSync(new URL('../views/MasteryView.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(pentagono, /'anel'/, 'o modo anel voltou ao pentagono');
assert.doesNotMatch(badge, /mastery-badge--anel/, 'o CSS do anel voltou');
assert.match(mastery, /centralStyle="plain"/, 'a tela de avaliacao deixou de pedir o numero sem peca');
console.log('ok - o centro do pentagono e so o numero');

// ================================ 5. a escada dos selos se ve rolando
//
// O selo de cada degrau tinha o mesmo aro do 0 ao 10 — 1,5px a 46% —, e so o
// tom mudava, pouco. O 7 e o 5 eram o mesmo hexagono escuro. Pedido em
// 05/10/2026: "vai dando mais cor e ficando mais chique".
const selo = css.slice(css.indexOf('.mastery-wheel-selo {'), css.indexOf('.mastery-wheel-frase {'));
assert.ok(selo.length > 300, 'o selo da roda mudou de forma');

// A nobreza sobe o aro: espessura e presenca.
assert.match(selo, /--aro: calc\(1px \+ var\(--nobreza, 1\) \* 2px\);/,
    'o aro do selo parou de engrossar com o degrau');
assert.match(selo, /opacity: calc\(0\.38 \+ var\(--nobreza, 1\) \* 0\.62\);/,
    'o aro parou de ganhar presenca com o degrau');
// E o numero puxa para a liga conforme sobe.
assert.match(selo, /color: color-mix\(in srgb, var\(--liga\) calc\(14% \+ var\(--nobreza, 1\) \* 30%\)/,
    'o numero do selo parou de ganhar cor com o degrau');
console.log('ok - aro, cor e numero sobem juntos com a nobreza');

// O hexagono mora nos pseudo-elementos. Com o clip-path no proprio selo, o
// brilho do degrau em foco era cortado no contorno e nunca pintava.
const seloBase = selo.slice(0, selo.indexOf('.mastery-wheel-selo::before'));
assert.doesNotMatch(seloBase, /clip-path/,
    'o recorte voltou ao selo — ele corta o brilho do degrau em foco');
assert.match(selo, /\.mastery-wheel-selo::before,\s*\.mastery-wheel-selo::after \{[\s\S]{0,140}clip-path: polygon/,
    'o hexagono saiu dos pseudo-elementos');
assert.match(css, /\.mastery-wheel-item\.is-focado \.mastery-wheel-selo \{[\s\S]{0,200}filter: drop-shadow/,
    'o degrau em foco perdeu o brilho');
console.log('ok - o brilho do degrau em foco existe, porque o selo nao e mais recortado');

// O miolo continua escuro: com a liga preenchendo o selo o numero nao passava
// de 3,45 de contraste. A cor do miolo nunca passa de 22% da liga.
assert.match(selo, /color-mix\(in srgb, var\(--liga\) calc\(6% \+ var\(--nobreza, 1\) \* 16%\), #0b0b0d\)/,
    'o miolo do selo deixou de ser escuro — o numero perde contraste no meio da escada');
console.log('ok - o miolo continua escuro, e o numero legivel em toda a escada');

// ================== 6. o botao de comecar mora ANTES da avaliacao, no Perfil
//
// O card de Maestria no Perfil tinha uma pilula "EDITAR NIVEL" com cara de
// botao e a frase "toque aqui para ajustar seu nivel por area". Pedido em
// 05/10/2026: "algo como Calibrar ou Avaliar, no nosso estilo" — e logo
// corrigido: "o botao era ANTES de entrar, nao depois que ja entra na
// avaliacao". Uma primeira tentativa poe o botao dentro da tela de avaliacao, e
// teria deixado dois "Avaliar" seguidos.
const perfil = readFileSync(new URL('../views/SettingsView.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const cardDaMaestria = perfil.slice(
    perfil.indexOf('id="mastery-sliders-button"'),
    perfil.indexOf('</button>', perfil.indexOf('id="mastery-sliders-button"')),
);
assert.ok(cardDaMaestria.length > 400, 'o card de maestria do Perfil mudou de forma');
assert.match(cardDaMaestria, /className="luxe-skin-button luxe-bico[^"]*">\s*Avaliar\s*<\/span>/,
    'o botao Avaliar sumiu do card de maestria, ou perdeu o bico');
assert.doesNotMatch(cardDaMaestria, /Editar nível/, 'a pilula "Editar nivel" voltou ao card');
assert.doesNotMatch(cardDaMaestria, /Toque aqui para ajustar/,
    'a frase "toque aqui" voltou, dizendo o que o botao ja diz');
// O card inteiro ja e um <button>: um segundo <button> dentro dele e HTML
// invalido. O Avaliar tem a pele de botao, mas e <span>.
// Comentarios saem antes da busca: o proprio comentario do card explica que ele
// "nao e um <button>", e esse texto nao e marcacao.
const cardSemComentarios = cardDaMaestria.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
assert.doesNotMatch(cardSemComentarios.slice(cardSemComentarios.indexOf('className=')), /<button[\s>]/,
    'nasceu um botao dentro do botao do card');
console.log('ok - o Avaliar mora no card do Perfil, antes de entrar');

// E a tela de avaliacao NAO ganhou um segundo Avaliar.
const telaMaestria = readFileSync(new URL('../views/MasteryView.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(telaMaestria, /mastery-quiz-avaliar/,
    'a tela de avaliacao ganhou um segundo botao Avaliar — o primeiro ja esta no Perfil');
console.log('ok - dentro da avaliacao nao ha um segundo Avaliar');

console.log('A roda da maestria: a frase cabe, o encaixe espera, o numero tem um dono so, e a escada se ve.');
