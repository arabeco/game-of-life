import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cicloVenceu, OPERATIONAL_DAY_CUTOFF_HOUR } from '../utils/operationalDay.js';

/**
 * O PRAZO FECHA O CICLO. NAO O BOTAO.
 *
 * Ate 05/10/2026 nada no app olhava a data de fim de um ciclo. Fechar era so o
 * botao ENCERRAR CICLO ATUAL, dentro da trilha de relatorios, atras de um modal
 * de confirmacao — e enquanto ninguem o apertasse, o ciclo seguia aberto
 * recebendo tarefas novas por tempo indeterminado.
 *
 * Isso nao e um incomodo de navegacao: dissolve o prazo. Quem nao fecha continua
 * somando acoes no mesmo ciclo e melhora a propria nota depois do fim. Relatado
 * assim:
 *
 *   "se ele fecha domingo eu tenho que colocar tudo ate as 4 da manha do domingo
 *    pra segunda q ele fecha sozinho, senao vc so faz mais acoes"
 *
 * Um prazo que a pessoa escolhe quando aplicar nao e prazo.
 */

// ========================================== 1. o corte e o dia OPERACIONAL
//
// Quem vira a noite de domingo trabalhando ainda esta no domingo. Usar a data de
// parede tiraria essas horas de quem trabalha de madrugada — e seria a terceira
// definicao de "hoje" no app.
assert.equal(OPERATIONAL_DAY_CUTOFF_HOUR, 4,
    'o corte do dia mudou; o prazo do ciclo anda junto com ele');

const fim = '2026-10-04'; // um domingo
assert.equal(cicloVenceu(fim, new Date('2026-10-03T12:00:00')), false,
    'sabado ao meio-dia o ciclo de domingo ainda nem chegou ao fim');
assert.equal(cicloVenceu(fim, new Date('2026-10-04T23:00:00')), false,
    'domingo as 23h ainda e domingo');
assert.equal(cicloVenceu(fim, new Date('2026-10-05T03:59:00')), false,
    'segunda as 03:59 ainda e o domingo operacional — a hora extra e de quem vira a noite');
assert.equal(cicloVenceu(fim, new Date('2026-10-05T04:00:00')), true,
    'as 04:00 de segunda o domingo acabou e o ciclo tem de fechar');
assert.equal(cicloVenceu(fim, new Date('2026-10-09T10:00:00')), true,
    'dias depois continua vencido');
console.log('ok - o prazo acaba as 04:00 do dia seguinte, nao a meia-noite');

// --------------------------------------------- sem data, sem vencimento
assert.equal(cicloVenceu(null), false, 'ciclo sem data nao vence');
assert.equal(cicloVenceu(''), false, 'data vazia nao vence');
assert.equal(cicloVenceu('2026-10-04T00:00:00Z', new Date('2026-10-04T12:00:00')), false,
    'data com hora junto precisa ser lida pelos dez primeiros caracteres');
console.log('ok - sem data nao ha prazo, e data com hora nao quebra a conta');

// ====================================== 2. a regra tem um dono so
//
// Comparar `endDate` com a data de parede em qualquer tela daria um dia a menos
// para quem trabalha de madrugada. Quem precisa saber, pergunta a cicloVenceu.
const app = readFileSync(new URL('../components/AuthenticatedApp.tsx', import.meta.url), 'utf8');
assert.match(app, /cicloVenceu\(activeCycle\.endDate\)/,
    'a deteccao do ciclo vencido saiu do AuthenticatedApp');
console.log('ok - quem decide o vencimento e cicloVenceu');

// ============================= 3. nao fecha com os dados pela metade
//
// Selar antes das tarefas carregarem gravaria um relatorio que nao conta o que a
// pessoa fez — e o fecho e irreversivel.
assert.match(
    app,
    /if \(!isProfileLoaded \|\| !activeCycle\?\.endDate \|\| tasks\.length === 0\) return;/,
    'o fecho automatico perdeu a guarda de dados carregados',
);
assert.match(app, /fechouCicloVencidoRef\.current = true;/,
    'sem a trava o fecho automatico pode disparar duas vezes');
console.log('ok - so fecha com perfil e tarefas em maos, e uma vez so');

// ================== 4. automatico e manual selam pelo MESMO caminho
//
// Dois caminhos para selar um ciclo seria o comeco de dois resultados.
const relatorios = readFileSync(new URL('../views/ReportsView.tsx', import.meta.url), 'utf8');
const efeito = relatorios.slice(
    relatorios.indexOf('const jaFechouPorPrazoRef'),
    relatorios.indexOf('const jaFechouPorPrazoRef') + 420,
);
assert.ok(efeito.length > 100, 'o fecho por prazo sumiu da ReportsView');
assert.match(efeito, /confirmEndCycle\(\);/,
    'o fecho automatico deixou de passar pelo mesmo confirmEndCycle do botao');
assert.match(efeito, /view !== 'hub'/,
    'sem conferir a view o efeito redispara quando confirmEndCycle troca de tela');
console.log('ok - o prazo entra pelo mesmo fecho que o botao');

// ============ 5. a fala de abertura cala sozinha quando o relatorio abre
//
// Nao precisa de regra nova: o gate da fala ja recusa falar por cima do
// relatorio. Se alguem tirar `isReportsVisible` de la, o Oraculo volta a dar bom
// dia por cima do fechamento do ciclo.
assert.match(
    app,
    /if \(filaNaFrenteRef\.current \|\| isReportsVisible \|\| isProfileVisible\) return;/,
    'a fala de abertura voltou a poder falar por cima do relatorio',
);
console.log('ok - o Oraculo nao da bom dia por cima do fecho do ciclo');

// ================ 6. fechar depois do prazo nao estica o ciclo ate o fecho
//
// O fechamento usava HOJE como ultimo dia. Com o prazo fechando o ciclo sozinho
// na manha seguinte, hoje ja e depois do fim: o ciclo de domingo ganhava a
// segunda, e cada dia extra virava dia zerado (SSS impossivel em ciclo fechado
// pelo prazo), duracao a mais (27 dias contavam 28 e ganhavam o teto do SS),
// atlas a mais, e um `end_date` gravado no dia do fecho.
const contexto = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const fecho = contexto.slice(contexto.indexOf('const endCycle = async'), contexto.indexOf('const endCycle = async') + 2600);
assert.ok(fecho.length > 1000, 'o fechamento do ciclo mudou de lugar');
assert.doesNotMatch(fecho, /const endDate = getLocalDateString\(\);/,
    'o fechamento voltou a usar hoje como fim — fechar pelo prazo estica o ciclo ate o dia do fecho');
assert.match(fecho, /const endDate = fimDoPrazo && hojeNoFecho > fimDoPrazo \? fimDoPrazo : hojeNoFecho;/,
    'o fim do ciclo deixou de ser o prazo quando o fecho acontece depois dele');
console.log('ok - fechado depois do prazo, o ciclo acaba no prazo; antes dele, acaba hoje');

console.log('Prazo fecha o ciclo: as 04:00 do dia seguinte, sozinho, uma vez.');
