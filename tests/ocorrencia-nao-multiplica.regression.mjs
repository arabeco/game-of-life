import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escolherOcorrenciaParaConcluir, ocorrenciaPendenteParaRegistrar, slotJaPassou } from '../utils/ocorrenciaDaAcao.ts';

const taskDomain = readFileSync(new URL('../contexts/gameDomains/taskDomain.ts', import.meta.url), 'utf8');
const planner = readFileSync(new URL('../views/PlannerView.tsx', import.meta.url), 'utf8');

/* ==========================================================================
 * "VISITA DADA" (15/11/2026, conta do Afonso).
 *
 * Sexta: a Conexao planejada recebeu a anotacao. A noite ele arrastou o chip
 * para as 18:00 e concluiu: o app CRIOU OUTRA Conexao e deixou a planejada
 * pendente. Domingo a varredura de D+2 devolveu a pendente para a bandeja COM
 * a anotacao, e o proximo arrasto da bandeja a trouxe para domingo.
 *
 * Tres regras saem disso:
 *   1. voltar para a bandeja apaga a anotacao (ela era daquele dia);
 *   2. registrar no passado reaproveita a pendente do dia, nao cria outra;
 *   3. segurar o chip conclui a do dia antes da que esta na espera.
 * ========================================================================== */

const t = (id, startTime, extra = {}) => ({ id, actionId: 'conexao', completed: false, startTime, dataOperacional: '2026-11-13', ...extra });

// ---------------------------------------------------------------------------
// 1. A ANOTACAO NAO VIAJA PARA A BANDEJA.
// ---------------------------------------------------------------------------
const devolver = taskDomain.slice(taskDomain.indexOf('const returnTaskToPool'), taskDomain.indexOf('const getTasksForDate'));
assert.match(devolver, /instanceNote: null/, 'returnTaskToPool precisa apagar a anotacao da ocorrencia');

// ---------------------------------------------------------------------------
// 2. REGISTRAR NO PASSADO REAPROVEITA A PENDENTE DO DIA.
// ---------------------------------------------------------------------------
const agora = new Date(2026, 10, 13, 20, 17); // sexta, 20:17
assert.equal(slotJaPassou('2026-11-13', 18 * 60, agora), true, '18:00 de sexta, visto as 20:17, ja passou');
assert.equal(slotJaPassou('2026-11-13', 21 * 60, agora), false, '21:00 ainda nao chegou: e planejamento');
assert.equal(slotJaPassou('2026-11-12', 23 * 60, agora), true, 'ontem ja passou');

const sexta = [t('planejada', 16 * 60), t('concluida', 9 * 60, { completed: true }), t('de-outra-acao', 17 * 60, { actionId: 'agua' })];
assert.equal(
  ocorrenciaPendenteParaRegistrar(sexta, { actionId: 'conexao', dataOperacional: '2026-11-13', inicio: 18 * 60 }),
  'planejada',
  'o caso da sexta: a Conexao das 16:00 pendente e a que vai para as 18:00',
);
assert.equal(
  ocorrenciaPendenteParaRegistrar(sexta, { actionId: 'conexao', dataOperacional: '2026-11-14', inicio: 18 * 60 }),
  null,
  'outro dia nao reaproveita nada: a pendente de sexta nao e de sabado',
);
assert.equal(
  ocorrenciaPendenteParaRegistrar([t('travada', 16 * 60, { bloqueada: true })], { actionId: 'conexao', dataOperacional: '2026-11-13', inicio: 18 * 60 }),
  null,
  'ocorrencia de ciclo julgado nao se move',
);
// Duas pendentes no dia: vai a mais perto do horario solto; a sem horario fica por ultimo.
assert.equal(
  ocorrenciaPendenteParaRegistrar([t('sem-horario', -1), t('manha', 9 * 60), t('tarde', 17 * 60)], { actionId: 'conexao', dataOperacional: '2026-11-13', inicio: 18 * 60 }),
  'tarde',
);
assert.equal(
  ocorrenciaPendenteParaRegistrar([t('sem-horario', -1)], { actionId: 'conexao', dataOperacional: '2026-11-13', inicio: 18 * 60 }),
  'sem-horario',
);

// Fiado no Planner: as tres quedas de acao nova passam pela regra.
const quedas = planner.match(/registrarOuAgendar\(/g) || [];
assert.ok(quedas.length >= 3, `o planner precisa usar registrarOuAgendar nas tres quedas (achei ${quedas.length})`);

// ---------------------------------------------------------------------------
// 3. SEGURAR O CHIP CONCLUI A DO DIA ANTES DA QUE ESTA NA ESPERA.
// ---------------------------------------------------------------------------
const hoje = [t('do-dia', 16 * 60), t('na-espera', -1, { dataOperacional: '2026-11-10' })];
assert.equal(escolherOcorrenciaParaConcluir(hoje, { actionId: 'conexao', hojeOperacional: '2026-11-13', daEspera: 'na-espera' }), 'do-dia');
assert.equal(escolherOcorrenciaParaConcluir(hoje, { actionId: 'conexao', hojeOperacional: '2026-11-14', daEspera: 'na-espera' }), 'na-espera');
assert.equal(escolherOcorrenciaParaConcluir(hoje, { actionId: 'conexao', hojeOperacional: '2026-11-14' }), null);
const concluirAgora = taskDomain.slice(taskDomain.indexOf('const scheduleAndCompleteNow'), taskDomain.indexOf('const scheduleAndCompleteNow') + 1400);
assert.match(concluirAgora, /escolherOcorrenciaParaConcluir\(/, 'scheduleAndCompleteNow precisa escolher a do dia primeiro');

console.log('ocorrencia-nao-multiplica: ok');
