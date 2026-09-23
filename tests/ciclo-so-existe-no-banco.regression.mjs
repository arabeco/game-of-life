import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const contexto = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');

/* ==========================================================================
 * UM CICLO QUE NAO CHEGOU AO BANCO NAO EXISTE.
 *
 * Em 21/09/2026 um ciclo de sete dias foi criado, funcionou na tela por tres
 * dias, e nunca esteve no Supabase. O `startCycle` mexia no estado local,
 * devolvia o ciclo como se tivesse dado certo, e so entao disparava o insert
 * sem esperar — com o erro indo para um `console.error` que ninguem le num
 * celular.
 *
 * O que tornou isso invisivel por tres dias: o ciclo ativo nao tem copia local
 * (`useState<Cycle | null>(() => null)`), entao ele so vive na memoria do
 * React. No Android o app fica vivo em segundo plano por dias, e a tela seguiu
 * mostrando um ciclo que so existia ali. No primeiro fechamento de verdade, a
 * hidratacao foi ao banco, nao achou nada, e a pessoa acordou sem ciclo, sem
 * relatorio e sem os dias.
 *
 * Este teste guarda a unica regra que impede isso: o banco vem primeiro.
 * ========================================================================== */

const startCycle = contexto.slice(
  contexto.indexOf('const startCycle ='),
  contexto.indexOf('const updateCycle ='),
);

assert.ok(startCycle.length > 0, 'nao achei o startCycle no GameContext');

// ---------------------------------------------------------------------------
// 1. ESPERAR O BANCO, E NAO SO MANDAR.
// ---------------------------------------------------------------------------

assert.match(
  startCycle,
  /const startCycle = async /,
  'o startCycle precisa ser async — sem isso nao ha como esperar o insert',
);

assert.match(
  startCycle,
  /await\s+supabase[\s\S]{0,200}?\.insert\(/,
  'o insert do ciclo tem de ser esperado; sem await, a falha chega tarde demais para importar',
);

// O `.then()` solto e exatamente a forma do bug: dispara, nao espera, e engole
// o erro num console que ninguem le.
assert.ok(
  !/\.insert\([\s\S]{0,400}?\)\s*\.then\(/.test(startCycle),
  'o insert do ciclo voltou a ser disparado com .then() sem espera',
);

// ---------------------------------------------------------------------------
// 2. EXIGIR A LINHA DE VOLTA.
// ---------------------------------------------------------------------------

// Sem `select().single()`, um insert recusado pela RLS pode voltar sem erro e
// sem linha — e "sem erro" seria lido como sucesso.
assert.match(
  startCycle,
  /\.insert\([\s\S]{0,400}?\)[\s\S]{0,80}?\.select\(/,
  'o insert precisa pedir a linha de volta para provar que ela existe',
);

// ---------------------------------------------------------------------------
// 3. ESTADO LOCAL SO DEPOIS DA CONFIRMACAO.
// ---------------------------------------------------------------------------

const posicaoDoInsert = startCycle.indexOf('.insert(');
const posicaoDoEstado = startCycle.indexOf('setActiveCycle(newCycle)');

assert.ok(posicaoDoEstado > posicaoDoInsert,
  'setActiveCycle(newCycle) voltou a acontecer antes do insert — a tela nao pode prometer um ciclo que o banco ainda nao aceitou');

// Fechar a rodada paga EXP e move a marca d'agua do progresso livre. Feito
// antes do insert, uma gravacao falha deixava a pessoa sem a rodada E sem o
// ciclo: perdia os dois lados da troca.
const posicaoDaRodada = startCycle.indexOf("concludeFreeRound('ciclo')");
assert.ok(posicaoDaRodada > posicaoDoInsert,
  'concludeFreeRound voltou a rodar antes do insert — nao se fecha a rodada por um ciclo que pode nao nascer');

// ---------------------------------------------------------------------------
// 4. A FALHA TEM DE APARECER PARA QUEM ESTA OLHANDO.
// ---------------------------------------------------------------------------

assert.match(
  startCycle,
  /showToast\([^)]*,\s*'error'\)/,
  'a falha de criacao do ciclo precisa virar aviso na tela, e nao so console.error',
);

// ---------------------------------------------------------------------------
// 5. QUEM CHAMA TEM DE ESPERAR.
// ---------------------------------------------------------------------------

assert.match(
  contexto,
  /const createdCycle = await startCycle\(/,
  'o startNewCycle precisa esperar o startCycle, senao reagenda tarefas para um ciclo que pode nao existir',
);

assert.match(
  contexto,
  /startCycle: \(name: string, endDate: string, startDate\?: string\) => Promise<Cycle \| null>;/,
  'o contrato do contexto precisa dizer que startCycle e assincrono',
);

console.log('[ok] ciclo so existe depois que o banco confirma');
