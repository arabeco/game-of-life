import assert from 'node:assert/strict';
import { montarPadroes } from '../supabase/functions/_shared/oraculo-ia-padroes.ts';

/**
 * OS PADROES QUE O ORACULO COM IA LE (02/11/2026).
 *
 * O resumo tem de trazer as contas prontas: o ciclo por arena, o horario e o
 * dia da semana em que a pessoa cumpre, onde cada arena costuma ficar e o que
 * tem hoje. Acao Livre nao entra nas contas.
 */
const arenas = [{ id: 'a1', name: 'Idiomas' }, { id: 'a2', name: 'Corpo' }];
const acoes = [
  { id: 'x1', arena_id: 'a1', name: 'Duolingo', action_type: 'Ação Recorrente' },
  { id: 'x2', arena_id: 'a2', name: 'Caminhar', action_type: 'Ação Recorrente' },
  { id: 'x3', arena_id: 'a2', name: 'Alongar', action_type: 'Livre' },
];
const tarefas = [];
// Ciclo fechado de 01/10 a 07/10: Idiomas sempre as 22h, quase nada feito;
// Corpo sempre as 7h, tudo feito. Uma Livre por dia, que nao pode contar.
for (let d = 1; d <= 7; d += 1) {
  const date = `2026-10-0${d}`;
  tarefas.push({ action_id: 'x1', date, start_time: 22 * 60, completed: d === 1 });
  tarefas.push({ action_id: 'x2', date, start_time: 7 * 60, completed: true });
  tarefas.push({ action_id: 'x3', date, start_time: 8 * 60, completed: true });
}
// Hoje.
tarefas.push({ action_id: 'x2', date: '2026-10-20', start_time: 7 * 60, completed: true });
tarefas.push({ action_id: 'x1', date: '2026-10-20', start_time: 22 * 60, completed: false });

const texto = montarPadroes({
  hoje: '2026-10-20',
  ciclos: [
    { name: 'Ciclo de outubro', start_date: '2026-10-01', end_date: '2026-10-07', report_data: { ok: true } },
    { name: 'Ciclo novo', start_date: '2026-10-15', end_date: '2026-10-28', report_data: null },
  ],
  acoes,
  arenas,
  tarefas,
});

assert.match(texto, /Ciclo de outubro \(7 dias\): (Idiomas 7 → 1 \(14%\) · Corpo 7 → 7 \(100%\)|Corpo 7 → 7 \(100%\) · Idiomas 7 → 1 \(14%\))/, 'ciclo fechado por arena, sem a Livre');
assert.match(texto, /ciclo atual \(dia 6 de 14\)/, 'o dia do ciclo aberto');
assert.match(texto, /de manhã \(4h às 12h\) 100%/, 'manha cumpre tudo');
assert.match(texto, /depois das 21h 14%/, 'depois das 21h quase nada');
assert.match(texto, /Idiomas: 100% agendadas depois das 21h/, 'onde a arena costuma ficar');
assert.match(texto, /hoje: Caminhar \(07:00, feita\) · Duolingo \(22:00, pendente\)/, 'o planner de hoje');
assert.doesNotMatch(texto, /Alongar/, 'acao Livre nao entra');

// Sem ciclo nenhum: os ultimos 28 dias.
const semCiclo = montarPadroes({ hoje: '2026-10-08', ciclos: [], acoes, arenas, tarefas });
assert.match(semCiclo, /sem ciclo aberto\. últimos 28 dias/);

console.log('Padroes do Oraculo com IA: ciclo por arena, horario, dia da semana e hoje.');
