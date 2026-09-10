import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { buildOracleOperationalContext } from '../utils/oracleOperationalContext.ts';
import { buildOracleCycleCoachBrief, oracleCoachFamily } from '../utils/oracleCoach.ts';
import { buildOracleDayBrief } from '../utils/oracleDayBrief.ts';

// Fixtures fictícias e determinísticas. Nenhum acesso ao banco ou conta real.
const now = new Date(2026, 8, 10, 18);
const date = day => `2026-09-${String(day).padStart(2, '0')}`;
function profile(id, name, description, lanes, hasCycle = true) {
  const arenas = lanes.map((lane, i) => ({ id: `${id}-arena-${i}`, name: lane.name, actionIds: [`${id}-action-${i}`], isArchived: false }));
  const actions = lanes.map((lane, i) => ({ id: `${id}-action-${i}`, name: lane.action || lane.name, arenaId: arenas[i].id, actionType: 'Habito', repetitions: lane.goal }));
  const tasks = lanes.flatMap((lane, i) => [
    ...lane.done.map((day, n) => ({ id: `${id}-${i}-done-${n}`, actionId: actions[i].id, date: date(day), startTime: 600 + n % 8 * 60, completed: true })),
    ...(lane.pending || []).map((day, n) => ({ id: `${id}-${i}-pending-${n}`, actionId: actions[i].id, date: date(day), startTime: 1140, completed: false })),
  ]);
  const total = lanes.reduce((sum, lane) => sum + lane.goal, 0);
  const done = lanes.reduce((sum, lane) => sum + Math.min(lane.goal, lane.done.length), 0);
  return { id, name, description, tasks, input: {
    now, assets: arenas.length ? [{ id: `${id}-asset`, name: 'Áreas acompanhadas', level: 1, arenas }] : [], actions, tasks,
    activeCycle: hasCycle ? { id: `${id}-cycle`, name: `Ciclo de ${name}`, startDate: date(1), endDate: date(14), arenaIds: arenas.map(a => a.id) } : null,
    cycleProgress: hasCycle && total ? Math.round(done / total * 100) : null,
    activeMode: 'neutro', username: name, level: 5,
  } };
}
const heavyDays = Array.from({ length: 16 }, (_, i) => i < 14 ? i % 9 + 1 : 10);
const profiles = [
  profile('new', 'Começando agora', 'Conta nova, sem Arenas, sem tarefas e sem ciclo.', [], false),
  profile('training', 'Só acompanha treino', 'Uma Arena, meta de 6 treinos em 14 dias, 4 realizados. Hoje é descanso planejado: não há treino marcado.', [{ name: 'Treino', action: 'Treinar', goal: 6, done: [1, 3, 5, 8] }]),
  profile('heavy', 'Uso intenso e equilibrado', 'Cinco Arenas, 80 de 100 execuções. Hoje concluiu 10 atividades e tem 2 pendentes.', ['Treino', 'Estudo', 'Trabalho', 'Leitura', 'Casa'].map((name, i) => ({ name, goal: 20, done: heavyDays, pending: i < 2 ? [10] : [] }))),
  profile('overload', 'Planejou mais do que executa', 'Quatro Arenas, meta de 140 execuções em 14 dias, 10 realizadas. Hoje há 8 pendências; o melhor dia teve 2 conclusões.', ['Treino', 'Estudo', 'Trabalho', 'Leitura'].map((name, i) => ({ name, goal: 35, done: i < 2 ? [1, 3, 5] : [2, 4], pending: [10, 10] }))),
  // O exemplo do item 10 da revisao, virado em fixture: comecou fazendo muito de
  // uma vez, depois passou a fazer menos por dia sem zerar nenhum. Volume e
  // constancia andando em direcoes opostas — o unico perfil que exercita os dois
  // assuntos de observacao, que sem ele seriam codigo sem prova.
  profile('rhythm', 'Mudou o padrão no meio do ciclo', 'Uma Arena, meta de 20. Fez 10 num único dia no começo e, nos últimos 5 dias, uma por dia sem falhar.', [{ name: 'Estudo', action: 'Estudar', goal: 20, done: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 6, 7, 8, 9, 10] }]),
  profile('return', 'Retomou hoje', 'Uma Arena, meta de 12 execuções. Fez 3 no início, passou 6 dias sem registrar e voltou hoje com uma conclusão.', [{ name: 'Treino', action: 'Treinar', goal: 12, done: [1, 2, 3, 10] }]),
];
const ACHADOS = process.env.ACHADOS || '(preencher apos rodar)';
const results = profiles.map(p => {
  const context = buildOracleOperationalContext(p.input);
  const day = buildOracleDayBrief(p.tasks, now);
  const seen = {};
  const readings = Array.from({ length: 5 }, () => {
    // O auditor e o item 17 da revisao: alem da resposta, o raciocinio que levou
    // a ela. Estado, modificadores, assunto escolhido e por que ele venceu.
    let audit = null;
    const reading = buildOracleCycleCoachBrief(context, { hoje: date(10), vistos: { ...seen } }, a => { audit = a; });
    reading.audit = audit;
    seen[oracleCoachFamily(reading.id)] = date(10);
    assert.ok(reading.content && reading.quickActions.length, 'Cada consulta deve responder e oferecer navegação.');
    for (const action of reading.quickActions) if (action.kind === 'open_arena') assert.ok(context.arenaNames.length && p.input.assets[0].arenas.some(a => a.id === action.arenaId));
    return reading;
  });
  return { id: p.id, name: p.name, description: p.description, metrics: { arenas: context.totalArenas, completed: context.cycleCompletedActions, planned: context.cycleTotalActions, progress: context.cycleCompletionPercent, expected: context.expectedCycleCompletionPercent, pace: context.cyclePace, pendingToday: context.pendingActionsToday, trend: context.focusArenaSignal?.trend }, day, readings };
});
/**
 * OS INVARIANTES — o item 14 da revisao.
 *
 * A simulacao deixa de ser so um relatorio e passa a ser regressao: cada perfil
 * carrega o que NAO pode acontecer com ele, e rodar o script falha se voltar a
 * acontecer. Sao as cinco armadilhas que a versao anterior caiu.
 */
const familias = r => r.readings.map(leitura => oracleCoachFamily(leitura.id));
const textos = r => r.readings.map(leitura => leitura.content).join(' | ');
const por = id => results.find(r => r.id === id);

{
  const r = por('new');
  assert.ok(familias(r).every(f => f === 'coach:first-arena'), 'sem dados: nao inventar diagnostico nem variedade artificial');
}
{
  const r = por('training');
  assert.ok(!familias(r).includes('coach:deriva'), 'frequencia semanal nao e divida diaria: nada de deriva sem acao marcada hoje');
  assert.doesNotMatch(textos(r), /ação hoje devolve o rumo/, 'nao mandar treinar num dia sem treino marcado');
}
{
  const r = por('heavy');
  assert.equal(familias(r)[0], 'coach:ahead', 'ciclo forte abre reconhecendo o conjunto, nao uma pendencia local');
  assert.ok(!familias(r).includes('coach:behind'), 'nao falar de atraso num ciclo acima do esperado');
}
{
  const r = por('overload');
  assert.equal(familias(r)[0], 'coach:conta-nao-fecha', 'a inviabilidade matematica domina enquanto for verdade');
  assert.ok(!familias(r).includes('coach:on-pace'), 'nunca afirmar ritmo adequado com 10 de 140 feitas');
  assert.doesNotMatch(textos(r), /acompanhando o ritmo/, 'nem por outra frase');
}
{
  const r = por('rhythm');
  const f = familias(r);
  assert.ok(f.includes('coach:volume-x-constancia'), 'volume e constancia em direcoes opostas precisa ser dito');
  assert.ok(f.includes('coach:dia-concentrado'), 'metade do ciclo num unico dia precisa ser dito');
  // So as DUAS leituras de observacao precisam ser puro fato. As outras tres
  // consultas do perfil sao assuntos normais e podem, sim, sugerir acao.
  const observacoes = r.readings
    .filter(leitura => ['coach:volume-x-constancia', 'coach:dia-concentrado'].includes(oracleCoachFamily(leitura.id)))
    .map(leitura => leitura.content).join(' | ');
  assert.doesNotMatch(observacoes, /precisa|deveria|tente|escolha|reduza/i, 'observacao sobre o padrao termina no fato, sem conselho');
}
{
  const r = por('return');
  assert.equal(familias(r)[0], 'coach:retomada', 'reconhecer a retomada antes de cobrar compensacao');
  assert.ok(!familias(r).includes('coach:on-pace'), 'retomada nao vira elogio de ritmo');
}

const report = ['# Oráculo — simulação de cinco perfis', '', 'Data simulada: 10/09/2026 às 18h. Ciclos de 01 a 14/09. Dados fictícios passam pelo construtor real de contexto e pelas leituras reais do app, sem rede. Os percentuais de entrada são calculados pelas metas e conclusões destes cenários simples; não simulam toda a pontuação do produto.', '', 'Cada perfil pede a análise do ciclo cinco vezes, sem mudança nos dados. Entre consultas, a memória de assuntos é atualizada como no painel. Isso permite observar repetição e contradições. Não é validação visual, de notificações ou com usuários reais.', ''];
report.push('## Achados da simulação', '', ACHADOS, '');
for (const r of results) {
  report.push(`## ${r.name}`, '', r.description, '', `Dados calculados: ${JSON.stringify(r.metrics)}.`, '', '**Ler meu dia**', '', `> ${r.day.content}`, '', '**Analisar meu ciclo — respostas reais**', '');
  r.readings.forEach((reading, i) => {
    const a = reading.audit;
    report.push(`${i + 1}. ${reading.content}`, `   - Botões: ${reading.quickActions.map(b => b.label).join(' · ')}.`, `   - Regra: \`${reading.id}\`.`);
    if (a) report.push(
      `   - Estado Mestre: \`${a.estado}\` — ${a.motivo}.`,
      `   - Modificadores: ${a.modificadores.length ? a.modificadores.join('; ') : 'nenhum'}.`,
      `   - Proibidos neste estado: ${a.proibidos.length ? a.proibidos.join(', ') : 'nenhum'}.`,
      `   - Assunto: \`${a.assunto}\` (peso ${a.pesoBase}${a.bonus ? ` ${a.bonus > 0 ? '+' : ''}${a.bonus} de bônus` : ''} = ${a.pesoFinal}).`,
      `   - Venceu porque: ${a.porQueVenceu}.`,
    );
    report.push('');
  });
}
writeFileSync(new URL('../docs/SIMULACAO-ORACULO-PERFIS.md', import.meta.url), report.join('\n'));
writeFileSync(new URL('../docs/SIMULACAO-ORACULO-PERFIS.json', import.meta.url), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
