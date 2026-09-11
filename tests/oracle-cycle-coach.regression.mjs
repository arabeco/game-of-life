import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOracleCycleCoachBrief, oracleCoachFamily } from '../utils/oracleCoach.ts';

const baseContext = {
  hasArenas: true,
  totalArenas: 2,
  hasCycle: true,
  cycleName: 'Ciclo curto',
  cycleDayNumber: 3,
  cycleTotalDays: 7,
  cycleDaysRemaining: 4,
  cycleCompletionPercent: 40,
  expectedCycleCompletionPercent: 43,
  cyclePace: 'no_ritmo',
  cycleTotalActions: 10,
  cycleCompletedActions: 4,
  cyclePendingActions: 6,
  priorityActionName: 'treinar',
  focusArenaSignal: {
    arenaId: 'arena-health',
    arenaName: 'Saude',
  },
};

const firstArena = buildOracleCycleCoachBrief({
  ...baseContext,
  hasArenas: false,
  totalArenas: 0,
  hasCycle: false,
});
assert.equal(firstArena.id, 'coach:first-arena');
assert.equal(firstArena.quickActions[0]?.kind, 'open_arenas');

const noCycle = buildOracleCycleCoachBrief({
  ...baseContext,
  hasCycle: false,
});
assert.equal(noCycle.id, 'coach:start-cycle');
assert.deepEqual(noCycle.quickActions.map((action) => action.kind), ['open_cycle', 'open_arenas']);

const behind = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleCompletionPercent: 20,
  expectedCycleCompletionPercent: 60,
  cyclePace: 'critico',
});
assert.match(behind.content, /20%/);
assert.match(behind.content, /Saude/);
assert.equal(behind.quickActions[0]?.kind, 'open_arena');
assert.equal(behind.quickActions[0]?.arenaId, 'arena-health');
assert.equal(behind.quickActions[1]?.kind, 'open_planner');

const lastDay = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleDaysRemaining: 0,
  cyclePace: 'atrasado',
  cyclePendingActions: 3,
});
assert.match(lastDay.content, /[uú]ltimo dia/);
assert.deepEqual(lastDay.quickActions.map((action) => action.kind), ['open_planner', 'open_cycle']);

const completed = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleCompletionPercent: 100,
  cycleCompletedActions: 10,
  cyclePendingActions: 0,
});
// O texto antigo MANDAVA fechar ("Feche este ciclo"). Ciclo vencido fecha
// sozinho hoje, entao este caso e de quem terminou tudo ANTES do prazo — e ai
// fechar e escolha, nao instrucao. A frase passa a dizer os dias que sobram e a
// oferecer as duas portas.
assert.doesNotMatch(completed.content, /Feche este ciclo/i, 'nao manda fechar o que fecha sozinho');
assert.match(completed.content, /ainda faltam 4 dias/, 'diz quanto tempo sobra');
assert.match(completed.content, /ou deixar rodando/, 'a segunda porta existe');
assert.equal(completed.quickActions[0]?.kind, 'open_cycle');

const onPace = buildOracleCycleCoachBrief(baseContext);
assert.doesNotMatch(onPace.content, /Que tal treinar hoje/, 'não apresenta prioridade geral como tarefa de hoje sem evidência');
assert.equal(onPace.quickActions[0]?.kind, 'open_planner');

// ---------------------------------------------------------------- O DESCANSO
//
// Os catorze casos sempre tiveram peso, mas peso CONSTANTE faz do primeiro lugar
// um cargo vitalicio: quem esta atrasado le `coach:behind` hoje, amanha e depois,
// e as outras onze leituras — escritas e revisadas — nunca sao lidas por
// ninguem. Estes tres casos travam o conserto.
const atrasadoHoje = {
  ...baseContext,
  cycleCompletionPercent: 20,
  expectedCycleCompletionPercent: 60,
  cyclePace: 'critico',
};

// 1. Sem memoria, nada muda — e por isso todas as asserçoes acima continuam
//    valendo. A funcao segue pura: nao le relogio nem armazenamento.
const semMemoria = buildOracleCycleCoachBrief(atrasadoHoje);
assert.equal(oracleCoachFamily(semMemoria.id), 'coach:behind', 'sem memoria vence o peso, como sempre');

// 2. Dito hoje, o assunto sai da fila e o proximo mais relevante assume.
const jaLeuHoje = buildOracleCycleCoachBrief(atrasadoHoje, {
  hoje: '2026-09-09',
  vistos: { 'coach:behind': '2026-09-09' },
});
assert.notEqual(oracleCoachFamily(jaLeuHoje.id), 'coach:behind', 'o mesmo assunto nao volta no mesmo dia');
assert.ok(jaLeuHoje.content, 'e o que assume tem texto de verdade');

// 3. Passado o descanso, ele volta — e um dia, porque cada dia atrasado E um
//    fato novo; o que o descanso impede e o monopolio, nao o assunto.
const ontem = buildOracleCycleCoachBrief(atrasadoHoje, {
  hoje: '2026-09-09',
  vistos: { 'coach:behind': '2026-09-08' },
});
assert.equal(oracleCoachFamily(ontem.id), 'coach:behind', 'passado o descanso, o peso manda de novo');

// 4. E com TODOS os assuntos descansando o botao nao emudece: melhor repetir do
//    que nao responder a um toque que a pessoa acabou de dar.
const tudoDescansando = buildOracleCycleCoachBrief(atrasadoHoje, {
  hoje: '2026-09-09',
  vistos: Object.fromEntries(
    ['coach:behind', 'coach:deriva', 'coach:arena-natimorta', 'coach:concentracao', 'coach:quanto-falta',
     'coach:conta-nao-fecha', 'coach:unmeasured', 'coach:start-cycle', 'coach:ahead']
      .map((familia) => [familia, '2026-09-09']),
  ),
});
assert.ok(tudoDescansando.content, 'com tudo descansando, ainda ha resposta');

const coachSource = readFileSync(new URL('../utils/oracleCoach.ts', import.meta.url), 'utf8');
assert.doesNotMatch(coachSource, /supabase|fetch\(|invoke\(|hasPremiumAccess/i);
// A memoria mora no cliente, nao aqui. Se o coach passar a ler armazenamento
// direto, ele deixa de ser testavel sem navegador — e este teste morre junto.
assert.doesNotMatch(coachSource, /localStorage|sessionStorage/, 'o coach nao le armazenamento');

const chatSource = readFileSync(new URL('../components/OracleChat.tsx', import.meta.url), 'utf8');
// Aceita o segundo argumento: o que a regra protege e a leitura sair do contexto
// LOCAL, nao a aridade da chamada.
assert.match(chatSource, /buildOracleCycleCoachBrief\(\s*operationalContext\b/);
assert.match(chatSource, /registrarLeituraDoCoach\(/, 'o que foi lido fica registrado, senao o descanso nunca comeca');
assert.match(chatSource, /case 'open_arena'/);
assert.match(chatSource, /showArenaId: arenaId/);

console.log('Oracle cycle coach regression: local diagnosis and safe navigation are covered.');

// ===================================================================
// AS LEITURAS NOVAS
//
// Elas so podem existir porque a cascata virou fila: antes o primeiro `if` que
// casasse vencia, e "atrasado"/"adiantado" pegavam quase todo mundo — qualquer
// caso colocado depois deles nunca seria considerado.
// ===================================================================

const sinal = (id, nome, feitas, pendentes) => ({
  arenaId: id, arenaName: nome,
  completedActions: feitas, pendingActions: pendentes,
  plannedActions: feitas + pendentes,
});

// --- a conta nao fecha: capacidade contra exigencia ------------------------
const contaNaoFecha = buildOracleCycleCoachBrief({
  ...baseContext,
  cyclePendingActions: 34,
  cycleDaysRemaining: 6,
  bestDailyCompletions: 3,
});
assert.match(contaNaoFecha.content, /Faltam 34 ações e 6 dias/, 'diz o que falta e o tempo');
assert.match(contaNaoFecha.content, /seu melhor dia até agora foram 3/, 'compara com a capacidade real');
assert.match(contaNaoFecha.content, /não tira EXP já conquistada/, 'a saida e editar o plano, nao correr atras');

// Ela NAO aparece quando a conta fecha: 6 em 4 dias com melhor dia de 3 cabe.
const contaFecha = buildOracleCycleCoachBrief({ ...baseContext, bestDailyCompletions: 3 });
assert.doesNotMatch(contaFecha.content, /Isso pede/, 'nao alarma quando a conta fecha');

// --- arena que nunca comecou ----------------------------------------------
const natimorta = buildOracleCycleCoachBrief({
  ...baseContext,
  cyclePace: 'no_ritmo',
  arenaSignals: [sinal('a', 'Academia', 8, 2), sinal('b', 'Leitura', 0, 5), sinal('c', 'Estudo', 3, 1)],
});
assert.match(natimorta.content, /Leitura ainda não recebeu nenhum registro/, 'nomeia a que nunca andou');
assert.match(natimorta.content, /Você desenhou este ciclo/, 'o sujeito e o ciclo, nao a pessoa');

// Todas paradas nao e "arena natimorta", e ciclo que nao comecou — outro caso.
const nenhumaComecou = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleCompletedActions: 0,
  arenaSignals: [sinal('a', 'Academia', 0, 4), sinal('b', 'Leitura', 0, 5)],
});
assert.doesNotMatch(nenhumaComecou.content, /não receberam nenhum registro/, 'ciclo inteiro parado nao vira acusacao de arena');

// --- concentracao: revela, nao julga --------------------------------------
const concentrado = buildOracleCycleCoachBrief({
  ...baseContext,
  cyclePace: 'no_ritmo',
  arenaSignals: [sinal('a', 'Academia', 7, 1), sinal('b', 'Leitura', 2, 1), sinal('c', 'Estudo', 1, 1)],
});
assert.match(concentrado.content, /de cada 10 registros foram em Academia/, 'revela a concentracao');
assert.doesNotMatch(concentrado.content, /equilibr|deveria|tente/i, 'nao julga: a frase termina no fato');

// --- a projecao de dias no adiantado --------------------------------------
const adiantado = buildOracleCycleCoachBrief({
  ...baseContext,
  cyclePace: 'adiantado',
  cycleDayNumber: 4,
  cycleCompletedActions: 8,
  cyclePendingActions: 2,
  cycleDaysRemaining: 6,
});
assert.match(adiantado.content, /fecha \d+ dias? antes do prazo/, 'a projecao diz quantos dias sobram');

// --- a ordem: a mais especifica ganha da mais generica ---------------------
const atrasadoEComConta = buildOracleCycleCoachBrief({
  ...baseContext,
  cyclePace: 'atrasado',
  cyclePendingActions: 34,
  cycleDaysRemaining: 6,
  bestDailyCompletions: 3,
});
assert.match(atrasadoEComConta.content, /Isso pede/, 'a conta que nao fecha ganha do "esta atrasado" generico');

// A DERIVA — o aviso que mora na faixa onde o app ainda diz "voce esta no ritmo".
//
// 'atrasado' comeca em delta -10, e ate la o pace continua 'no_ritmo'. Sem este
// caso, quem escorregou 8 pontos ouvia "esta acompanhando o ritmo do ciclo" — a
// mesma frase de quem esta em dia.
const derivando = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleCompletionPercent: 40,
  expectedCycleCompletionPercent: 48,
  pendingActionsToday: 1,
});
assert.match(derivando.content, /começou a escorregar/, 'escorregar dentro do ritmo ja merece um toque');
assert.match(derivando.content, /Saude/, 'e o toque diz QUAL frente ficou para tras');

// Tres pontos de diferenca e ruido de arredondamento, nao deriva. Avisar aqui
// seria o defeito da sequencia de novo: cobrar por qualquer oscilacao.
const oscilando = buildOracleCycleCoachBrief({ ...baseContext });
assert.doesNotMatch(oscilando.content, /começou a escorregar/, 'oscilacao pequena nao vira aviso');

// Quando o buraco existe de verdade, quem fala e o 'behind'. A deriva e o aviso
// ANTES; depois dele, repetir "ainda da tempo" seria mentira amena.
const jaAtrasado = buildOracleCycleCoachBrief({
  ...baseContext,
  cyclePace: 'atrasado',
  cycleCompletionPercent: 20,
  expectedCycleCompletionPercent: 60,
});
assert.doesNotMatch(jaAtrasado.content, /começou a escorregar/, 'com buraco aberto quem fala e o atrasado');

// E no fim do ciclo o aviso se cala: apontar deriva quando nao ha tempo de
// corrigir e so cobranca.
const quaseAcabando = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleCompletionPercent: 40,
  expectedCycleCompletionPercent: 48,
  cycleDaysRemaining: 1,
});
assert.doesNotMatch(quaseAcabando.content, /começou a escorregar/, 'sem tempo de corrigir, o aviso se cala');

console.log('Ler meu dia: conta que nao fecha, arena natimorta, concentracao e projecao, na ordem certa.');
// META DE FREQUENCIA NAO E DIVIDA DIARIA.
//
// A deriva termina em "uma acao hoje devolve o rumo", e isso exige que exista
// acao HOJE. O teste era contra as pendencias do CICLO, entao seis treinos em
// catorze dias com 67% feito contra 71% de tempo virava ordem de treinar num dia
// sem treino marcado. O app nao pode inventar urgencia que a agenda nao registra.
const semAcaoHoje = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleCompletionPercent: 40,
  expectedCycleCompletionPercent: 48,
  pendingActionsToday: 0,
});
assert.doesNotMatch(semAcaoHoje.content, /começou a escorregar/, 'sem acao marcada hoje, nao ha rumo a devolver hoje');

console.log('Deriva: avisa dentro do ritmo, cala na oscilacao, no buraco e no fim do ciclo.');
console.log('Frequencia: sem acao marcada hoje, a deriva se cala.');
console.log('Descanso: o assunto sai da fila depois de dito, volta no prazo, e nunca emudece o botao.');

// Retomada: o texto segue o ritmo real e o botão segue a Arena mencionada.
const treinoRetomado = { ...sinal('treino', 'Treino', 5, 1), trend: 'retomando', trendPauseDays: 6 };
const focoEstudo = sinal('estudo', 'Estudo', 2, 3);
for (const [pace, progress, phrase] of [
  ['adiantado', 85, /à frente do ritmo/],
  ['no_ritmo', 71, /dentro do ritmo/],
  ['atrasado', 50, /abaixo do planejado/],
  ['critico', 20, /abaixo do planejado/],
]) {
  const reading = buildOracleCycleCoachBrief({ ...baseContext, cyclePace: pace, cycleCompletionPercent: progress,
    expectedCycleCompletionPercent: 71, arenaSignals: [focoEstudo, treinoRetomado], focusArenaSignal: focoEstudo });
  assert.match(reading.id, /^coach:retomada:/);
  assert.match(reading.content, phrase);
  if (pace === 'adiantado' || pace === 'no_ritmo') assert.doesNotMatch(reading.content, /abaixo|compensar/);
  assert.equal(reading.quickActions[0].arenaId, 'treino');
  assert.equal(reading.quickActions[0].label, 'Abrir Treino');
}
const voltaSemCiclo = buildOracleCycleCoachBrief({ ...baseContext, hasCycle: false, cyclePace: null,
  cycleTotalActions: 0, cycleCompletedActions: 0, cyclePendingActions: 0, arenaSignals: [treinoRetomado] });
assert.match(voltaSemCiclo.id, /^coach:retomada:/);
assert.doesNotMatch(voltaSemCiclo.content, /ciclo|planejado|previsto/i);
const descansoHoje = buildOracleCycleCoachBrief({ ...baseContext, pendingActionsToday: 0 });
assert.match(descansoHoje.content, /Hoje não há atividades pendentes/);
assert.doesNotMatch(descansoHoje.content, /Que tal|Escolha uma ação/);
const tarefaHoje = buildOracleCycleCoachBrief({ ...baseContext, pendingActionsToday: 1 });
assert.match(tarefaHoje.content, /Há uma atividade planejada para hoje/);
console.log('Refino: retomada respeita ritmo e Arena; dia sem pendência não recebe tarefa extra.');
