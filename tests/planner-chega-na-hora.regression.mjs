import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * O PLANNER CHEGA NA HORA CERTA — ELE NAO ROLA ATE ELA.
 *
 * Relatado em 05/10/2026: "o planner quando abro parece que fica tremendo pros
 * lados, como se quisesse se acomodar".
 *
 * Abrir a aba eram dois movimentos sobrepostos: o palco deslizando 22px de lado
 * por 260ms (a transicao das abas) e, 200ms depois de montar, o planner
 * descendo do topo do dia ate a hora atual em rolagem suave. O desenho chegava
 * e ainda se ajeitava.
 *
 * E havia um segundo defeito no mesmo efeito: `currentTime` nas dependencias.
 * Ele atualiza de minuto em minuto, e o planner rolava sozinho de volta para
 * "agora" a cada minuto — quem subia para ver a manha era puxado de volta.
 *
 * A regra ja existia no app, escrita na roda da maestria: a primeira posicao e
 * instantanea; o movimento e resposta a um gesto, e so entao merece ser visto.
 */

const fonte = readFileSync(new URL('../views/PlannerView.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const efeito = fonte.slice(
    fonte.indexOf('const jaChegouNaHoraRef'),
    fonte.indexOf('}, [currentDate, isSimpleList, scrollPlannerToIndicator, viewMode, zoomLevel]);') + 90,
);
assert.ok(efeito.length > 400, 'o posicionamento do planner na hora atual sumiu');

// ===================================== 1. a abertura nao anima nada
assert.match(efeito, /useLayoutEffect\(\(\) => \{/,
    'o posicionamento voltou para useEffect — ele roda depois da pintura, e a pessoa ve o topo antes do pulo');
assert.match(efeito, /if \(primeiraVez\) \{\s*scrollPlannerToIndicator\(indicador, false\);\s*return;/,
    'a primeira posicao deixou de ser instantanea — o planner volta a rolar sozinho ao abrir');
console.log('ok - ao abrir, o planner ja aparece na hora de agora, sem rolar');

// ============================== 2. o relogio nao arrasta a tela
assert.match(efeito, /\}, \[currentDate, isSimpleList, scrollPlannerToIndicator, viewMode, zoomLevel\]\);/,
    'as dependencias do posicionamento mudaram');
assert.doesNotMatch(
    efeito.slice(efeito.lastIndexOf('}, [')),
    /currentTime/,
    'currentTime voltou as dependencias — o planner volta a puxar a pessoa para agora a cada minuto',
);
// So existe UM efeito de rolar-ate-agora: eram dois copiados, um por modo.
assert.equal((fonte.match(/scrollPlannerToIndicator\((daily|weekly)TimeIndicatorRef\.current/g) || []).length, 0,
    'voltou um segundo efeito de rolar ate a hora, fora do posicionamento unico');
console.log('ok - a linha da hora anda, mas a tela so se move quando a pessoa muda algo');

// ================================ 3. mudancas da pessoa rolam suave e nao empilham
assert.match(efeito, /const timer = window\.setTimeout\(\(\) => scrollPlannerToIndicator\(indicador, true\), 200\);\s*return \(\) => window\.clearTimeout\(timer\);/,
    'a rolagem depois de trocar data ou zoom deixou de ser cancelada — trocas seguidas empilham rolagens');
console.log('ok - trocar data, modo ou zoom rola suave, e trocas seguidas nao se empilham');

// ================================== 4. quem pediu menos movimento nao recebe
const rolar = fonte.slice(fonte.indexOf('const scrollPlannerToIndicator'), fonte.indexOf('const jaChegouNaHoraRef'));
assert.match(rolar, /prefers-reduced-motion: reduce/,
    'a rolagem do planner deixou de respeitar quem pediu menos movimento');
console.log('ok - quem pediu menos movimento recebe o pulo, sem animacao');

console.log('Planner chega na hora: posicionado ao abrir, e so se move quando a pessoa pede.');
