import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deriveOracleHostOperationalState } from '../supabase/functions/_shared/oracle-host-voice.ts';

const le = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

/* ==========================================================================
 * "SEU CICLO JA ERA, SALVE O QUE PUDER" — NO DIA 1.
 *
 * Foi o card que chegou em 21/09/2026, no primeiro dia de um ciclo, e o texto
 * saiu certo para o estado errado: o estado `em_risco` fala em cortar o que da e
 * deixar o resto ir, e no dia 1 nao ha nada perdido — ha um plano inteiro pela
 * frente.
 *
 * Tres coisas produziam esse estado, e as tres liam o PLANO como se fosse
 * fracasso:
 *
 *   a) `pendingTodayTasks.length >= 5` virava risco alto. Quem planejou cinco
 *      acoes para hoje tem cinco pendentes as nove da manha. Ter um dia cheio
 *      pela frente era diagnosticado como ciclo perdido.
 *   b) `!activeCycle` virava risco alto. Quem joga so por rodada, sem ciclo
 *      aberto, recebia aviso sobre o ciclo que nao tem.
 *   c) `dia / total` cobrava o dia corrente como se ja tivesse acabado. No dia 1
 *      de sete isso exigia 14% antes de a pessoa ter tido um dia.
 *
 * O (c) ja tinha sido corrigido em utils/oracleOperationalContext.ts, e a copia
 * do edge function ficou para tras — sao duas contas do mesmo numero em dois
 * runtimes. Este teste guarda as tres, e guarda tambem que as duas contas nao
 * voltem a discordar.
 * ========================================================================== */

const base = {
  currentTime: '2026-09-21T12:00:00Z',
  activeMode: 'neutro',
  hasCycle: true,
  cycleRisk: 'baixo',
  cyclePace: null,
  staleArenas: [],
  pendingActionsToday: 0,
  overdueActions: 0,
  pendingChests: 0,
  dailyProofStreakCurrent: 0,
  dailyProofLastClosedDate: null,
  needsFirstArena: false,
  needsFirstAction: false,
  needsFirstTask: false,
};

const estado = (extra) => deriveOracleHostOperationalState(
  { ...base, ...extra },
  { operationalDate: '2026-09-21' },
);

// ---------------------------------------------------------------------------
// 1. NO COMECO DO CICLO, NADA DECLARA O CICLO PERDIDO.
//
// Mesmo com os dois gatilhos ligados ao mesmo tempo. O pior diagnostico honesto
// nos primeiros dias e "atrasado": da para recuperar.
// ---------------------------------------------------------------------------

for (const total of [7, 14, 28]) {
  assert.notEqual(
    estado({ cycleDayNumber: 1, cycleTotalDays: total, cycleRisk: 'alto' }),
    'em_risco',
    `Ciclo de ${total} dias: no dia 1 nao ha o que salvar.`,
  );
  assert.notEqual(
    estado({ cycleDayNumber: 1, cycleTotalDays: total, cyclePace: 'critico' }),
    'em_risco',
    `Ciclo de ${total} dias: ritmo critico no dia 1 e ruido, nao diagnostico.`,
  );
  assert.notEqual(
    estado({ cycleDayNumber: 1, cycleTotalDays: total, cycleRisk: 'alto', cyclePace: 'critico' }),
    'em_risco',
    `Ciclo de ${total} dias: os dois juntos no dia 1 continuam sendo cedo demais.`,
  );
}

// O piso de tres dias protege ate o ciclo curtissimo, onde um quarto do caminho
// cairia no primeiro dia.
assert.notEqual(
  estado({ cycleDayNumber: 2, cycleTotalDays: 3, cycleRisk: 'alto' }),
  'em_risco',
  'Ciclo de 3 dias: um quarto do caminho e o dia 1, entao vale o piso.',
);

// ---------------------------------------------------------------------------
// 2. QUANDO HA VENCIDAS, O ESTADO E "ATRASADO" — NAO SILENCIO.
//
// Bloquear em_risco nao pode virar esconder problema: quem tem acao vencida
// precisa ouvir sobre a acao vencida.
// ---------------------------------------------------------------------------

assert.equal(
  estado({ cycleDayNumber: 1, cycleTotalDays: 7, cycleRisk: 'alto', overdueActions: 4 }),
  'atrasado',
  'Cedo no ciclo com vencidas: o recado e o atraso, e ele da para recuperar.',
);

// ---------------------------------------------------------------------------
// 3. MAIS PARA A FRENTE, A REGRA AINDA MORDE.
//
// O conserto e sobre CEDO DEMAIS, e nao sobre nunca avisar. Um ciclo de verdade
// em apuros continua sendo chamado de ciclo em apuros.
// ---------------------------------------------------------------------------

assert.equal(
  estado({ cycleDayNumber: 5, cycleTotalDays: 7, cycleRisk: 'alto' }),
  'em_risco',
  'Dia 5 de 7 com risco alto: aqui o corte e honesto.',
);
assert.equal(
  estado({ cycleDayNumber: 20, cycleTotalDays: 28, cyclePace: 'critico' }),
  'em_risco',
  'Dia 20 de 28 em ritmo critico: aqui o corte e honesto.',
);

// Sem a medida do ciclo a duvida passa: o risco veio de numeros reais, e calar
// esconderia um problema de verdade so porque falta um campo.
assert.equal(
  estado({ cycleDayNumber: null, cycleTotalDays: null, cycleRisk: 'alto' }),
  'em_risco',
  'Sem saber o tamanho do ciclo, o aviso passa.',
);

// ---------------------------------------------------------------------------
// 4. SEM CICLO NAO HA CICLO A PERDER.
// ---------------------------------------------------------------------------

assert.notEqual(
  estado({ hasCycle: false, cycleRisk: 'alto', cyclePace: 'critico' }),
  'em_risco',
  'Quem joga so por rodada nao recebe aviso sobre um ciclo que nao abriu.',
);

// ---------------------------------------------------------------------------
// 5. AS DUAS CONTAS DE RISCO NAO LEEM MAIS O PLANO DE HOJE.
// ---------------------------------------------------------------------------

const edge = le('supabase/functions/oracle/index.ts');
const app = le('utils/oracleOperationalContext.ts');

const trechoDeRisco = (fonte, marcador) => {
  const inicio = fonte.indexOf(marcador);
  assert.ok(inicio >= 0, `Nao achei a conta de risco em ${marcador}`);
  return fonte.slice(inicio, inicio + 700);
};

for (const [nome, trecho] of [
  ['edge function', trechoDeRisco(edge, 'let cycleRisk: OracleContext["cycleRisk"] = "baixo"')],
  ['app', trechoDeRisco(app, "let cycleRisk: OracleContext['cycleRisk'] = 'baixo'")],
]) {
  assert.doesNotMatch(
    trecho,
    /pendingTodayTasks\.length >= \d/,
    `${nome}: pendencia de hoje e o dia que ainda vai acontecer, nao risco.`,
  );
  assert.doesNotMatch(
    trecho,
    /!activeCycle \|\|/,
    `${nome}: sem ciclo nao existe risco de ciclo.`,
  );
}

// ---------------------------------------------------------------------------
// 6. AS DUAS CONTAS DE EXPECTATIVA CONCORDAM.
//
// O dia corrente nao entra no que ja era para estar pronto. Era aqui que as
// copias tinham divergido.
// ---------------------------------------------------------------------------

const formula = /\(\(cycleDayNumber - 1\) \/ cycleTotalDays\) \* 100/;
assert.match(edge, formula, 'O edge function tem de cobrar so os dias fechados.');
assert.match(app, formula, 'O app tem de cobrar so os dias fechados.');
assert.doesNotMatch(
  edge,
  /\(cycleDayNumber \/ cycleTotalDays\) \* 100/,
  'A conta antiga cobrava o dia de hoje antes de ele acontecer.',
);
assert.doesNotMatch(
  app,
  /\(cycleDayNumber \/ cycleTotalDays\) \* 100/,
  'A conta antiga cobrava o dia de hoje antes de ele acontecer.',
);

console.log('[ciclo-recem-nascido] ok');
