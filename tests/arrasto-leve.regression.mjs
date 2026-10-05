import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * O ARRASTO DO PLANNER: PEGAR LOGO, SEGURAR SEPARADO, E MOVER SEM PESO.
 *
 * Relatado em 05/10/2026, em tres partes:
 *
 *   "enquanto o Oraculo ta falando nao da pra arrastar"
 *   "pra comecar a arrastar ta demorando muito o hold"
 *   "ele ficar no seu dedo pra voce ver que ja selecionou — sem confundir com
 *    o hold de conclusao"
 *
 * Conferido em tools/o-arrasto.html, que monta o gesto de verdade e mede cada
 * decisao em ms. Ali, com a thread travada como o Oraculo a trava, o arrasto
 * so sobrevive com a regra do tempo real — desligada a regra, ele morre em
 * silencio.
 */

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const gesto = ler('hooks/useLongPress.ts');
const planner = ler('hooks/usePlannerDragHold.ts');
const plannerView = ler('views/PlannerView.tsx');
const css = ler('index.css');
const app = ler('components/AuthenticatedApp.tsx');

// ============================================ 1. pegar e segurar sao dois tempos
assert.match(planner, /export const PLANNER_PEGAR_MS = 240;/, 'o tempo de pegar mudou sem combinar');
assert.match(planner, /export const PLANNER_SEGURAR_MS = 640;/, 'o tempo de segurar mudou sem combinar');
assert.match(planner, /armDelay: onDrag \? PLANNER_PEGAR_MS : undefined,/,
    'o pegar deixou de existir para quem arrasta');
assert.match(planner, /delay: PLANNER_SEGURAR_MS,/, 'a conclusao voltou a comecar no mesmo tempo do pegar');
// A peca desce antes de encher: subir e encher nunca aparecem juntos.
assert.match(planner, /onLongPress: onHoldStart\s*\?\s*\(\) => \{[\s\S]{0,260}setErguido\(false\);\s*onHoldStart\(\);/,
    'a peca deixou de descer antes de comecar a encher — os dois gestos voltam a se confundir');
console.log('ok - pegar aos 240ms; concluir so com o dedo parado ate 640ms');

// Concluir segurando: 2,0s no planner e 1,3s na baia, no total. Pedido em
// 05/10/2026, medido na bancada: 2016ms e 1322ms.
assert.match(planner, /export const PLANNER_ENCHER_MS = 1360;/, 'o enchimento do planner mudou — o total deixa de ser 2,0s');
assert.match(planner, /export const BAIA_ENCHER_MS = 660;/, 'o enchimento da baia mudou — o total deixa de ser 1,3s');
assert.match(planner, /export const DESMARCAR_ENCHER_MS = 3000;/, 'desmarcar ficou curto — desfazer nao pode ser por dedo distraido');

// O timer e a barra leem o MESMO numero. A barra durava 3s enquanto a tarefa
// concluia em 1,8s e a acao da baia em 1s: mostrava 60% e 33% e pulava.
const pecasDoPlanner = ['views/PlannerView.tsx', 'components/WeeklyPlannerGrid.tsx'];
for (const arquivo of pecasDoPlanner) {
    const fonte = ler(arquivo);
    assert.doesNotMatch(fonte, /task\.completed \? ?3000 : 1800/, `${arquivo}: o tempo de concluir voltou a ser numero solto`);
    assert.match(fonte, /\}, task\.completed \? DESMARCAR_ENCHER_MS : PLANNER_ENCHER_MS\);/,
        `${arquivo}: o timer de concluir saiu das constantes do gesto`);
    const barras = (fonte.match(/animate-\[fill_3s_linear_forwards\]/g) || []).length;
    const sincronizadas = (fonte.match(/animationDuration: `\$\{task\.completed \? DESMARCAR_ENCHER_MS : PLANNER_ENCHER_MS\}ms`/g) || []).length;
    assert.equal(sincronizadas, barras,
        `${arquivo}: ha barra de enchimento sem a duracao do timer — ela volta a pular antes do fim`);
}
for (const arquivo of ['components/PoolAction.tsx', 'components/MilestonePoolAction.tsx']) {
    const fonte = ler(arquivo);
    assert.match(fonte, /\}, BAIA_ENCHER_MS\);/, `${arquivo}: o timer de concluir da baia virou numero solto`);
    assert.match(fonte, /animationDuration: `\$\{BAIA_ENCHER_MS\}ms`/,
        `${arquivo}: a barra da baia saiu do tempo do timer`);
}
console.log('ok - concluir segurando: 2,0s no planner, 1,3s na baia, e a barra chega ao fim junto');

// No hook, o segurar so vale para quem ja foi pego e continuou parado.
assert.match(gesto, /const podeSegurar = armDelay !== undefined\s*\?\s*state\.current === 'armed'\s*:\s*state\.current === 'pending';/,
    'com o pegar ligado, o segurar voltou a valer sem a peca ter sido pega');
// Pegou e devolveu sem mexer: nao e toque.
assert.match(gesto, /\} else if \(state\.current === 'armed'\) \{[\s\S]{0,120}onArmCancel\?\.\(\);/,
    'soltar uma peca pega voltou a contar como toque e abrir a tarefa');
console.log('ok - soltar a peca pega devolve, e nao abre nada');

// =========================== 2. o pegar vale pelo tempo real, nao pelo timer
assert.match(
    gesto,
    /state\.current === 'pending'\s*&& armDelay !== undefined\s*&& performance\.now\(\) - downAt\.current >= armDelay/,
    'o pegar voltou a depender so do timer — com a thread ocupada pelo Oraculo, o arrasto morre em silencio',
);
assert.match(gesto, /downAt\.current = performance\.now\(\);/, 'o instante do toque deixou de ser anotado');
console.log('ok - se o tempo de pegar ja passou, a peca esta pega, tenha o timer chegado ou nao');

// ============================== 3. as cinco pecas usam o mesmo gesto
for (const arquivo of [
    'views/PlannerView.tsx',
    'components/WeeklyPlannerGrid.tsx',
    'components/PoolAction.tsx',
    'components/MilestonePoolAction.tsx',
]) {
    const fonte = ler(arquivo);
    assert.doesNotMatch(fonte, /useLongPress\(/,
        `${arquivo}: voltou a montar o proprio hold, com relogio proprio`);
    assert.match(fonte, /usePlannerDragHold\(\{/, `${arquivo}: saiu do gesto comum do planner`);
    assert.match(fonte, /erguido \? ' planner-erguido' : ''/, `${arquivo}: a peca pega deixou de subir`);
}
assert.equal((plannerView.match(/usePlannerDragHold\(\{/g) || []).length, 2,
    'o PlannerView tem duas pecas arrastaveis — a tarefa do dia e o cartao');
console.log('ok - as cinco pecas arrastaveis pegam e seguram do mesmo jeito');

// ================================= 4. a peca pega aparece no dedo
const erguido = css.slice(css.indexOf('.planner-erguido {'), css.indexOf('/* O fantasma que segue o dedo'));
assert.ok(erguido.length > 100, 'o estilo da peca pega sumiu');
assert.match(erguido, /scale: 1\.06;/, 'a peca pega deixou de crescer');
assert.match(erguido, /drop-shadow\(0 0 14px rgba\(240, 217, 166, 0\.55\)\)/,
    'o halo da peca pega enfraqueceu — debaixo do polegar, so a borda aparece');
// Sem camada: os `active:scale-*` do Tailwind moram em @layer utilities, e um
// deles encolheria a peca justamente enquanto o dedo aperta.
const antesDoErguido = css.slice(0, css.indexOf('.planner-erguido {'));
assert.doesNotMatch(antesDoErguido.slice(antesDoErguido.lastIndexOf('}') - 400), /@layer [a-z]+ \{\s*$/,
    'a peca pega entrou numa @layer e passa a perder para o active:scale do Tailwind');
console.log('ok - a peca pega sobe, cresce e brilha, e nada do Tailwind a encolhe');

// ======================= 5. mover o dedo nao redesenha o planner a cada pixel
assert.doesNotMatch(plannerView, /setDragState\(prev => \(\{ \.\.\.prev, currentPosition: pos \}\)\);/,
    'o fantasma voltou a andar pelo estado — cada pixel redesenha o planner inteiro');
assert.match(plannerView, /ghostRef\.current\.style\.transform =\s*`translate3d\(/,
    'o fantasma deixou de andar por transform direto no elemento');
assert.match(plannerView, /setDailyDropIndicator\(prev => \(\s*prev && prev\.top === marcaDoDia\.top && prev\.height === marcaDoDia\.height \? prev : marcaDoDia/,
    'o indicador do dia voltou a redesenhar a cada pixel, e nao a cada slot');
assert.match(plannerView, /prev && prev\.dayIndex === dayIndex && prev\.top === indicator\.top && prev\.height === indicator\.height/,
    'o indicador da semana voltou a redesenhar a cada pixel');
assert.match(plannerView, /pos = lastPointerPosRef\.current \?\? dragState\.currentPosition;/,
    'soltar voltou a ler a posicao do estado, que agora so guarda onde o arrasto comecou');
console.log('ok - o fantasma anda pelo compositor, e o planner so redesenha quando o slot muda');

// ================================ 6. o balao do Oraculo nao pesa no dedo
const balao = app.slice(app.indexOf('const OracleSpeechOverlay'), app.indexOf('type AppBroadcastRow'));
assert.ok(balao.length > 400, 'o balao do Oraculo mudou de lugar');
// So as classes contam: o comentario que explica por que o desfoque saiu cita
// o nome dele, e isso nao e desfoque nenhum.
const balaoSemComentarios = balao.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
assert.doesNotMatch(balaoSemComentarios, /backdrop-blur/,
    'o balao voltou a desfocar o fundo — refeito a cada letra, disputa a thread com o arrasto');
assert.match(balao, /pointer-events-none fixed inset-x-0/,
    'o balao voltou a poder capturar o toque de quem esta arrastando');
console.log('ok - o balao do Oraculo nao desfoca nem captura o toque');

console.log('Arrasto leve: pega logo, segura separado, e move sem redesenhar o mundo.');
