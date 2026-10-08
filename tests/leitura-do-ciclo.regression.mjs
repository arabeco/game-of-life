import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FOLGA_EM_DIAS,
  FRASES_DA_LEITURA,
  estadoDoCiclo,
  medirCicloPrometido,
  montarLeituraDoCiclo,
  ritmoEsperado,
} from '../supabase/functions/_shared/oracle-cycle-reading.ts';
import { buildCycleCommitment } from '../utils/cycleCommitment.ts';
import { fatosDaLeitura, lerMeuDiaECiclo } from '../utils/leituraDoCiclo.ts';
import { ORACLE_SPEECH_LIBRARY, pickOracleSpeech } from '../constants/oracleSpeechLibrary.ts';

/* ==========================================================================
 * A LEITURA DO CICLO — UM MOTOR, DUAS PORTAS.
 *
 * O push da manha e o botao "Ler meu dia e ciclo" saem do mesmo arquivo. Em
 * 08/10/2026 o push mandava cortar e abandonar, com um percentual que dividia
 * pelo agendado, enquanto a tela dividia pelo prometido e o chat somava os
 * relatorios diarios: tres numeros para o mesmo ciclo.
 * ========================================================================== */

const fixo = () => 0;
const ler = (fatos) => montarLeituraDoCiclo(fatos, { sortear: fixo });
const ciclo = (extra) => ({ dia: 6, totalDias: 14, feitas: 0, prometidas: 100, prazoAcabou: false, ...extra });
const semDia = { agendadas: 0, feitas: 0 };

// 1. Os estados do ciclo, com a folga.
assert.equal(FOLGA_EM_DIAS, 2);
assert.equal(Math.round(ritmoEsperado(6, 14)), 21, 'no dia 6 a conta e o dia 4: 3/14');
assert.equal(ritmoEsperado(2, 14), 0, 'a folga nunca fica negativa');
assert.equal(estadoDoCiclo(null), 'sem_ciclo');
assert.equal(estadoDoCiclo(ciclo({ dia: 1 })), 'ciclo_comeca');
assert.equal(estadoDoCiclo(ciclo({ feitas: 25 })), 'ciclo_indo_bem', '25% no dia 6 esta acima dos 21% com folga');
assert.equal(estadoDoCiclo(ciclo({ feitas: 15 })), 'ciclo_abaixo');
assert.equal(estadoDoCiclo(ciclo({ dia: 3, feitas: 0 })), 'ciclo_abaixo', 'zero feito nao vira elogio');
assert.equal(estadoDoCiclo(ciclo({ prometidas: 0 })), 'ciclo_sem_meta');
assert.equal(estadoDoCiclo(ciclo({ prazoAcabou: true, feitas: 90 })), 'ciclo_prazo_acabou');

// 2. O texto: ciclo primeiro, dia depois, e o dia some quando nao ha planner.
assert.equal(
  ler({ hoje: { agendadas: 5, feitas: 0 }, ciclo: ciclo({ feitas: 45 }) }).texto,
  'Seu ciclo está indo bem: 45%, dia 6 de 14. Hoje tem 5 ações no seu planner.',
);
assert.equal(
  ler({ hoje: { agendadas: 5, feitas: 2 }, ciclo: ciclo({ feitas: 10 }) }).texto,
  'Dia 6 de 14 do seu ciclo, 10% feito. Hoje: 2 de 5 feitas.',
);
assert.equal(ler({ hoje: { agendadas: 4, feitas: 4 }, ciclo: null }).texto, 'Planner de hoje completo: 4 de 4.');
assert.equal(ler({ hoje: { agendadas: 1, feitas: 0 }, ciclo: null }).texto, 'Hoje tem 1 ação no seu planner.', 'singular sem erro');
assert.equal(ler({ hoje: semDia, ciclo: ciclo({ dia: 1 }) }).texto, 'Dia 1 de 14: seu ciclo começa hoje.');
assert.equal(ler({ hoje: semDia, ciclo: null }).texto, null, 'sem dia e sem ciclo o push fica quieto');
assert.equal(
  montarLeituraDoCiclo({ hoje: semDia, ciclo: null }, { nuncaVazia: true }).texto,
  FRASES_DA_LEITURA.nada_para_ler[0],
  'quem apertou o botao recebe resposta',
);

// 3. Frase lida ha pouco espera a vez, quando ha outra.
{
  const original = FRASES_DA_LEITURA.dia_planejado;
  FRASES_DA_LEITURA.dia_planejado = ['Hoje tem {agendadas_acoes}.', 'O planner tem {agendadas_acoes} hoje.'];
  const fatos = { hoje: { agendadas: 3, feitas: 0 }, ciclo: null };
  assert.equal(
    montarLeituraDoCiclo(fatos, { sortear: fixo, recentes: ['Hoje tem 3 ações.'] }).texto,
    'O planner tem 3 ações hoje.',
  );
  FRASES_DA_LEITURA.dia_planejado = original;
}

// 4. Nenhuma frase da leitura da bronca.
const BRONCA = /\bcort|abandon|deix[ae] o resto|deixa ir|tir[ae]r? do ciclo|atr[aá]s\b|atrasad|n[aã]o d[aá] pra salvar/i;
for (const [estado, frases] of Object.entries(FRASES_DA_LEITURA)) {
  for (const frase of frases) assert.doesNotMatch(frase, BRONCA, `${estado}: "${frase}"`);
}

// 5. A regua do servidor e a regua da tela dao o mesmo numero.
{
  const arenas = [
    { id: 'a1', name: 'Treino', isArchived: false },
    { id: 'a2', name: 'Velha', isArchived: true },
    { id: 'a3', name: 'Quests - Season 3', isArchived: false },
  ];
  const actions = [
    { id: 'x1', arenaId: 'a1', repetitions: 3, actionType: 'Habito' },
    { id: 'x2', arenaId: 'a1', repetitions: 2, actionType: 'Livre' },
    { id: 'x3', arenaId: 'a2', repetitions: 5, actionType: 'Habito' },
    { id: 'x4', arenaId: 'a3', repetitions: 20, actionType: 'Habito' },
    { id: 'x5', arenaId: 'a1', repetitions: 4, actionType: 'Habito', sourceQuestId: 'q1' },
    { id: 'x6', arenaId: 'a1', repetitions: 0, actionType: 'Habito' },
  ];
  const tasks = [
    ...['t1', 't2', 't3', 't4'].map((id, i) => ({ id, actionId: 'x1', date: `2026-10-0${i + 2}`, completed: true })),
    { id: 't1', actionId: 'x1', date: '2026-10-02', completed: true },
    { id: 't5', actionId: 'x1', date: '2026-09-30', completed: true },
    { id: 't6', actionId: 'x6', date: '2026-10-03', completed: true },
    { id: 't7', actionId: 'x6', date: '2026-10-04', completed: false },
    { id: 't8', actionId: 'x2', date: '2026-10-03', completed: true },
    { id: 't9', actionId: 'x4', date: '2026-10-03', completed: true },
  ];
  const tela = buildCycleCommitment({ actions, arenas, tasks, startDate: '2026-10-01', endDate: '2026-10-14' });
  const servidor = medirCicloPrometido({
    acoes: actions.map((a) => ({ id: a.id, arena_id: a.arenaId, repetitions: a.repetitions, action_type: a.actionType, source_quest_id: a.sourceQuestId ?? null })),
    arenas: arenas.map((a) => ({ id: a.id, name: a.name, is_archived: a.isArchived })),
    tarefas: tasks.map((t) => ({ id: t.id, action_id: t.actionId, date: t.date, completed: t.completed })),
    inicio: '2026-10-01',
    fim: '2026-10-14',
  });
  assert.deepEqual(servidor, { feitas: tela.completedCount, prometidas: tela.plannedCount });
  assert.deepEqual(servidor, { feitas: 4, prometidas: 4 }, 'x1 (3, teto) + x6 (1): Livre, arquivada e missao ficam fora');
}

// 6. O app junta os fatos com a mesma regua, e o botao fala o mesmo que o push.
{
  const now = new Date(2026, 9, 6, 10);
  const assets = [{ id: 's', arenas: [{ id: 'a1', name: 'Treino', isArchived: false }] }];
  const actions = [{ id: 'x1', arenaId: 'a1', repetitions: 10, actionType: 'Habito' }];
  const tasks = [
    { id: 'd1', actionId: 'x1', date: '2026-10-01', startTime: 600, completed: true },
    { id: 'd2', actionId: 'x1', date: '2026-10-02', startTime: 600, completed: true },
    { id: 'd3', actionId: 'x1', date: '2026-10-06', startTime: 600, completed: true },
    { id: 'd4', actionId: 'x1', date: '2026-10-06', startTime: 900, completed: false },
  ];
  const activeCycle = { id: 'c', name: 'SET', startDate: '2026-10-01', endDate: '2026-10-14', arenaIds: [] };
  const fatos = fatosDaLeitura({ tasks, actions, assets, activeCycle, now });
  assert.deepEqual(fatos, {
    hoje: { agendadas: 2, feitas: 1 },
    ciclo: { dia: 6, totalDias: 14, feitas: 3, prometidas: 10, prazoAcabou: false },
  });
  const brief = lerMeuDiaECiclo({ tasks, actions, assets, activeCycle, now });
  assert.ok(brief.content.startsWith('Seu ciclo está indo bem: 30%, dia 6 de 14.'), brief.content);
  assert.deepEqual(brief.quickActions.map((a) => a.kind), ['open_planner', 'open_cycle']);
  assert.equal(
    fatosDaLeitura({ tasks, actions, assets, activeCycle: { ...activeCycle, startDate: '2026-10-09' }, now }).ciclo,
    null,
    'ciclo que ainda nao comecou nao e lido',
  );
}

// 7. As duas portas estao ligadas no motor.
const servidor = readFileSync(new URL('../supabase/functions/oracle/index.ts', import.meta.url), 'utf8');
assert.match(servidor, /montarLeituraDoCiclo\(/, 'o push sai do motor');
assert.match(servidor, /medirCicloPrometido\(/, 'o push usa a regua da tela');
assert.doesNotMatch(servidor, /buildContextualOracleLine/, 'as 39 frases antigas nao voltam');
assert.match(servidor, /"id, arena_id, name, repetitions, action_type, source_quest_id"/, 'a regua precisa saber o que e missao');
const semLeitura = servidor.slice(servidor.indexOf('if (!text) {'), servidor.indexOf('const messageId'));
assert.match(semLeitura, /resolveAutomaticOracleCategory/, 'sem leitura, a Sabedoria ainda sai');

const chat = readFileSync(new URL('../components/OracleChat.tsx', import.meta.url), 'utf8');
assert.match(chat, /lerMeuDiaECiclo\(/, 'o botao sai do motor');
assert.doesNotMatch(chat, /Analisar meu ciclo|buildOracleDayBrief/, 'um botao so');

// 8. A reacao ao concluir diz o que falta hoje e onde o ciclo esta.
{
  const original = ORACLE_SPEECH_LIBRARY.daily_reps_low.neutro;
  ORACLE_SPEECH_LIBRARY.daily_reps_low.neutro = ['{count} hoje, {resto_do_dia}. Ciclo em {pct_ciclo}%.'];
  assert.equal(
    pickOracleSpeech('daily_reps_low', 'neutro', { count: 3, resto_do_dia: 'faltam 2 para hoje', pct_ciclo: 46 }),
    '3 hoje, faltam 2 para hoje. Ciclo em 46%.',
  );
  assert.equal(
    pickOracleSpeech('daily_reps_low', 'neutro', { count: 3, resto_do_dia: 'nada pendente hoje' }),
    '',
    'sem ciclo a frase com {pct_ciclo} nao sai com a chave crua',
  );
  ORACLE_SPEECH_LIBRARY.daily_reps_low.neutro = original;
  const dominio = readFileSync(new URL('../contexts/gameDomains/taskDomain.ts', import.meta.url), 'utf8');
  assert.match(dominio, /resto_do_dia:/, 'a reacao recebe o que falta hoje');
  assert.match(dominio, /vars\.pct_ciclo = Math\.round\(promessa\.progressPercent\)/, 'e o ciclo pela regua da tela');
}

console.log('leitura-do-ciclo: ok');
