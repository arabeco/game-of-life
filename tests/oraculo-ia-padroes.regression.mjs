import assert from 'node:assert/strict';
import { montarPadroes } from '../supabase/functions/_shared/oraculo-ia-padroes.ts';

/**
 * OS PADROES QUE O ORACULO COM IA LE (02/11/2026).
 *
 * O resumo tem de trazer as contas prontas: o ciclo por arena, o horario e o
 * dia da semana em que a pessoa cumpre, onde cada arena costuma ficar e o que
 * tem hoje. Acao Livre nao entra nas contas.
 */
const arenas = [{ id: 'a1', name: 'Idiomas', asset_id: 'trabalho' }, { id: 'a2', name: 'Corpo', asset_id: 'saude' }];
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
  agora: 'terça, 20/10, 19:40',
  ciclos: [
    // O relatorio grava o planejado e o feito por area (snake_case no banco).
    { name: 'Ciclo de outubro', start_date: '2026-10-01', end_date: '2026-10-07', report_data: {
      grade: 'B',
      metrics: { execution_rate_pct: 57, max_streak: 7, habitos_consolidados: [{ nome: 'Caminhar', icone: '🚶', dias: 7 }] },
      highlight: { most_repeated_action: 'Caminhar', most_repeated_action_count: 7 },
      asset_progress: [
        { asset: 'TRABALHO & ESTUDOS', total_planned: 7, total_completed: 1 },
        { asset: 'SAÚDE', total_planned: 7, total_completed: 7 },
      ],
    } },
    { name: 'Ciclo novo', start_date: '2026-10-19', end_date: '2026-11-15', report_data: null },
  ],
  acoes,
  arenas,
  tarefas,
  niveis: [{ asset_id: 'saude', level: 7 }, { asset_id: 'relacoes', level: 3 }],
});

assert.match(texto, /agora: terça, 20\/10, 19:40/, 'a hora de agora');
assert.match(texto, /arenas: Idiomas \(Trabalho e estudos\) · Corpo \(Saúde\)/, 'a area de cada arena');
assert.match(texto, /maestria por área \(0 a 10, a pessoa se avalia\): Saúde 7 · Relações 3/, 'a maestria');
assert.match(texto, /áreas sem nenhuma arena: Propósito, Relações, Lazer e bem-estar/, 'as areas sem arena');
assert.match(texto, /Ciclo de outubro \(7 dias\): Trabalho e estudos 7 → 1 \(14%\) · Saúde 7 → 7 \(100%\) · nota B · execução 57% · maior sequência 7 dias · ação mais repetida Caminhar \(7x\) · hábitos consolidados: Caminhar/, 'ciclo fechado pelo relatorio, com o nome da area padronizado e os destaques');
assert.match(texto, /ciclo atual: dia 2 de 28 \(faltam 27 dias, contando hoje\)\. É começo de ciclo: o que conta agora é pegar ritmo/, 'comeco de ciclo fala em pegar ritmo');
assert.match(texto, /o que ela planejou no ciclo, por arena e ação \(com o ritmo de cada uma\): (Idiomas: Duolingo 1x \(1 por semana\) · Corpo: Caminhar 1x \(1 por semana\)|Corpo: Caminhar 1x \(1 por semana\) · Idiomas: Duolingo 1x \(1 por semana\))/, 'no comeco, so o prometido e o ritmo de cada acao, sem o feito');
assert.doesNotMatch(texto, /média de/, 'sem media geral de acoes por dia');
const ritmos = montarPadroes({ hoje: '2026-10-20', ciclos: [{ name: 'C', start_date: '2026-10-19', end_date: '2026-11-15', report_data: null }], acoes: [{ id: 'x1', arena_id: 'a1', name: 'Meditar', action_type: 'Ação Recorrente', repetitions: 28 }, { id: 'x2', arena_id: 'a2', name: 'Treino', action_type: 'Ação Recorrente', repetitions: 12 }], arenas, tarefas: [] });
assert.match(ritmos, /Meditar 28x \(todo dia\)/, '28 em 28 dias e todo dia');
assert.match(ritmos, /Treino 12x \(3 por semana\)/, '12 em 28 dias e 3 por semana');
// Do 4o dia em diante, sem o aviso de comeco.
const maisAdiante = montarPadroes({ hoje: '2026-10-25', ciclos: [{ name: 'Ciclo novo', start_date: '2026-10-19', end_date: '2026-11-15', report_data: null }], acoes, arenas, tarefas });
assert.match(maisAdiante, /ciclo atual: dia 7 de 28 \(faltam 22 dias, contando hoje\)\.\n/, 'sem aviso de comeco depois do 3o dia');
assert.match(maisAdiante, /Corpo: Caminhar 1 de 1 \(1 por semana\)/, 'depois do 3o dia, o feito de prometido');
assert.match(texto, /de manhã \(4h às 12h\) 100%/, 'manha cumpre tudo');
assert.match(texto, /depois das 21h 14%/, 'depois das 21h quase nada');
assert.match(texto, /Idiomas fica depois das 21h/, 'onde a arena costuma ficar, sem porcentagem');
assert.match(texto, /agendado no planner para hoje \(só o que ela marcou com horário; pode haver ação planejada sem horário\): Caminhar \(07:00, feita\) · Duolingo \(22:00, pendente\)/, 'o planner de hoje, avisando que e so o agendado');
assert.doesNotMatch(texto, /Alongar/, 'acao Livre nao entra');

// Sem ciclo nenhum: os ultimos 28 dias.
const semCiclo = montarPadroes({ hoje: '2026-10-08', ciclos: [], acoes, arenas, tarefas });
assert.match(semCiclo, /sem ciclo aberto\. últimos 28 dias/);

console.log('Padroes do Oraculo com IA: ciclo por arena, horario, dia da semana e hoje.');
