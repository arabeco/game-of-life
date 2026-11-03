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
assert.match(texto, /Relações 3, Despertar: "[^"]+" → próximo, 4 Base/, 'a maestria');
assert.match(texto, /Saúde 7, Domínio/);
assert.match(texto, /áreas sem nenhuma arena: Propósito, Relações, Lazer e bem-estar/, 'as areas sem arena');
assert.match(texto, /Ciclo de outubro \(7 dias\): Trabalho e estudos 7 → 1 \(14%\) · Saúde 7 → 7 \(100%\) · nota B · execução 57% · maior sequência 7 dias · ação mais repetida Caminhar \(7x\) · hábitos consolidados: Caminhar/, 'ciclo fechado pelo relatorio, com o nome da area padronizado e os destaques');
assert.match(texto, /ciclo atual: dia 2 de 28 \(faltam 27 dias, contando hoje\)\. É começo de ciclo: o que conta agora é pegar ritmo/, 'comeco de ciclo fala em pegar ritmo');
assert.match(texto, /o que foi planejado no ciclo, por arena e ação \(com o ritmo de cada uma\): .*Duolingo 1x \(1 por semana, costuma ficar depois das 21h\)/, 'no comeco, o planejado com o ritmo e o horario de cada acao, sem o feito');
assert.match(texto, /Caminhar 1x \(1 por semana, costuma ficar de manhã \(4h às 12h\)\)/, 'cada acao com o horario em que costuma ficar');
assert.doesNotMatch(texto, /média de/, 'sem media geral de acoes por dia');
const ritmos = montarPadroes({ hoje: '2026-10-20', ciclos: [{ name: 'C', start_date: '2026-10-19', end_date: '2026-11-15', report_data: null }], acoes: [{ id: 'x1', arena_id: 'a1', name: 'Meditar', action_type: 'Ação Recorrente', repetitions: 28 }, { id: 'x2', arena_id: 'a2', name: 'Treino', action_type: 'Ação Recorrente', repetitions: 12 }], arenas, tarefas: [] });
assert.match(ritmos, /Meditar 28x \(todo dia\)/, '28 em 28 dias e todo dia');
assert.match(ritmos, /Treino 12x \(3 por semana\)/, '12 em 28 dias e 3 por semana');
// Do 4o dia em diante, sem o aviso de comeco.
const maisAdiante = montarPadroes({ hoje: '2026-10-25', ciclos: [{ name: 'Ciclo novo', start_date: '2026-10-19', end_date: '2026-11-15', report_data: null }], acoes, arenas, tarefas });
assert.match(maisAdiante, /ciclo atual: dia 7 de 28 \(faltam 22 dias, contando hoje\)\.\n/, 'sem aviso de comeco depois do 3o dia');
assert.match(maisAdiante, /Corpo: Caminhar 1 de 1 \(1 por semana, costuma ficar de manhã \(4h às 12h\)\)/, 'depois do 3o dia, o feito de planejado');
assert.match(texto, /de manhã \(4h às 12h\) 100%/, 'manha cumpre tudo');
assert.match(texto, /depois das 21h 14%/, 'depois das 21h quase nada');
assert.match(texto, /Idiomas fica depois das 21h/, 'onde a arena costuma ficar, sem porcentagem');
assert.match(texto, /agendado no planner para hoje \(só o que foi marcado com horário; pode haver ação planejada sem horário\): Caminhar \(07:00, feita\) · Duolingo \(22:00, pendente\)/, 'o planner de hoje, avisando que e so o agendado');
assert.doesNotMatch(texto, /Alongar/, 'acao Livre nao entra');

// Sem ciclo nenhum: os ultimos 28 dias.
const semCiclo = montarPadroes({ hoje: '2026-10-08', ciclos: [], acoes, arenas, tarefas });
assert.match(semCiclo, /sem ciclo aberto \(está na rodada livre\)\. últimos 28 dias/);

console.log('Padroes do Oraculo com IA: ciclo por arena, horario, dia da semana e hoje.');

// Empate aparece como empate (03/11/2026): tres faixas em 100% nao viram "a tarde".
{
  const empate = [];
  for (let d = 1; d <= 9; d += 1) {
    const date = `2026-09-0${d}`;
    empate.push({ action_id: 'x1', date, start_time: 8 * 60, completed: true });
    empate.push({ action_id: 'x2', date, start_time: 15 * 60, completed: true });
    empate.push({ action_id: 'x1', date, start_time: 22 * 60, completed: d % 2 === 0 });
  }
  const t = montarPadroes({ hoje: '2026-09-10', ciclos: [], acoes, arenas, tarefas: empate });
  assert.match(t, /horário em que mais cumpre: de manhã \(4h às 12h\) e à tarde \(12h às 18h\) \(100%\)/, 'empate no topo lista as duas faixas');
}
console.log('Padroes: empate aparece como empate.');

// Area em 100% em todo ciclo vira gancho para o coach (03/11/2026).
{
  const relatorio = (saude, trabalho) => ({ asset_progress: [
    { asset: 'SAÚDE', total_planned: 10, total_completed: saude },
    { asset: 'TRABALHO & ESTUDOS', total_planned: 10, total_completed: trabalho },
  ] });
  const t = montarPadroes({ hoje: '2026-10-20', ciclos: [
    { name: 'A', start_date: '2026-09-01', end_date: '2026-09-07', report_data: relatorio(10, 6) },
    { name: 'B', start_date: '2026-09-08', end_date: '2026-09-14', report_data: relatorio(10, 10) },
  ], acoes, arenas, tarefas: [] });
  assert.match(t, /áreas em 100% em todos os 2 ciclos fechados: Saúde — ou a pessoa já domina, ou a meta ficou folgada/);
  assert.doesNotMatch(t, /fechados: Saúde e Trabalho/, 'Trabalho caiu num ciclo: nao entra');
}
console.log('Padroes: meta folgada vira gancho.');

// Conta nova (03/11/2026): 2 dias de uso nao viram "ultimos 28 dias" nem "0,4h por semana".
{
  const nova = montarPadroes({ hoje: '2026-11-03', usaDesde: '2026-11-02T10:00:00Z', ciclos: [], acoes: [{ id: 'x1', arena_id: 'a1', name: 'Duolingo', action_type: 'Ação Recorrente', repetitions: 5 }], arenas, tarefas: [
    { action_id: 'x1', date: '2026-11-02', start_time: 22 * 60, completed: true, duration: 15 },
  ] });
  assert.match(nova, /conta nova: usa o Glyph há 2 dias\. Ainda não há padrão/);
  assert.match(nova, /desde que começou \(2 dias\), agendadas → feitas: Idiomas 1 → 1/);
  assert.match(nova, /planejado nas ações \(repetições, sem prazo enquanto não há ciclo\): Duolingo 5x/);
  assert.doesNotMatch(nova, /por semana \(média/, 'menos de uma semana: sem horas por semana');
  assert.doesNotMatch(nova, /próximos 7 dias/, 'semana sem nada agendado: nao aparece');
  assert.doesNotMatch(nova, /\bela\b/, 'sem genero nos dados');
}
console.log('Padroes: conta nova.');

// A ESCADA DA MAESTRIA NOS DADOS (03/11/2026, com o Afonso): o degrau de cada area
// com nome e frase, o proximo degrau, e o Nivel de 0 a 100 (soma das cinco x 2).
{
  const m = montarPadroes({ hoje: '2026-11-03', ciclos: [], acoes: [], arenas: [], tarefas: [], niveis: [
    { asset_id: 'proposito', level: 7 }, { asset_id: 'relacoes', level: 7 }, { asset_id: 'trabalho', level: 7 }, { asset_id: 'lazer', level: 9 }, { asset_id: 'saude', level: 7 },
  ] });
  assert.match(m, /Nível 74 de 100/);
  assert.match(m, /Saúde 7, Domínio: "Tenho um corpo resistente[^"]*" → próximo, 8 Solidez: "Minha força, condicionamento e mobilidade/);
  assert.match(m, /Lazer e bem-estar 9, Referência/);
  const topo = montarPadroes({ hoje: '2026-11-03', ciclos: [], acoes: [], arenas: [], tarefas: [], niveis: [{ asset_id: 'saude', level: 10 }] });
  assert.match(topo, /Saúde 10, Obra: "[^"]+" → topo da escada/);
  assert.match(topo, /sem avaliação \(contam 0 no Nível\): /, 'area sem nivel aparece');
  assert.match(topo, /Nível 20 de 100/);
  const linhas = m.split('\n');
  assert.ok(linhas.findIndex((l) => l.includes('Lazer e bem-estar 9')) > linhas.findIndex((l) => l.includes('Saúde 7')), 'da area mais baixa para a mais alta');
}
console.log('Padroes: escada da maestria.');
{
  const m = montarPadroes({ hoje: '2026-11-03', ciclos: [], acoes: [], arenas: [], tarefas: [], niveis: [
    { asset_id: 'proposito', level: 7 }, { asset_id: 'relacoes', level: 7 }, { asset_id: 'trabalho', level: 7 }, { asset_id: 'lazer', level: 9 }, { asset_id: 'saude', level: 7 },
  ] });
  assert.match(m, /degraus: 7 em Propósito, Relações, Trabalho e estudos e Saúde; 9 em Lazer e bem-estar\. Mais baixo: 4 áreas empatadas no 7 \(/);
}
console.log('Padroes: resumo dos degraus.');
