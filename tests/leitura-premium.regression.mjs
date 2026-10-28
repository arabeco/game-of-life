import assert from 'node:assert/strict';
import { leituraPremiumDoDia, sugestaoParaOProximoCiclo } from '../utils/leituraPremium.ts';

/**
 * A LEITURA PREMIUM (28/10/2026, com o Afonso).
 *
 * No painel do dia, uma aba so do Premium com o que o painel comum nao diz: o
 * ritmo do ciclo contra o seu historico, para onde o ciclo vai, o seu horario
 * e o seu dia mais fortes, a arena que subiu, a que caiu, a esquecida e a
 * presenca. Cada item so aparece quando ha dado para sustentar.
 */

// Um mes inventado: terca forte, manha forte, Saude subindo, Trabalho caindo.
const hoje = '2026-10-28'; // quarta
const feitos = [];
const dia = (offset) => {
  const d = new Date(`${hoje}T12:00:00`);
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
};
for (let i = 0; i < 28; i++) {
  const data = dia(i);
  const semana = new Date(`${data}T12:00:00`).getDay();
  const quantas = semana === 2 ? 4 : semana === 0 ? 0 : 1;
  for (let k = 0; k < quantas; k++) feitos.push({ data, hora: 7 + k, arenaId: 'leitura', arenaNome: 'Leitura' });
}
for (let i = 0; i < 7; i++) feitos.push({ data: dia(i), hora: 18, arenaId: 'saude', arenaNome: 'Saúde' }, { data: dia(i), hora: 19, arenaId: 'saude', arenaNome: 'Saúde' });
for (let i = 7; i < 14; i++) feitos.push({ data: dia(i), hora: 10, arenaId: 'trabalho', arenaNome: 'Trabalho' });
feitos.push({ data: dia(2), hora: 10, arenaId: 'trabalho', arenaNome: 'Trabalho' });

const leitura = leituraPremiumDoDia({
  feitos,
  hoje,
  arenas: [{ id: 'leitura', nome: 'Leitura' }, { id: 'saude', nome: 'Saúde' }, { id: 'trabalho', nome: 'Trabalho' }, { id: 'casa', nome: 'Casa' }],
  ciclo: { feitas: 40, planejadas: 70, diasPassados: 10, diasTotais: 14, execucaoAtual: 82, medianaHistorica: 74, ciclosFechados: 3 },
});
const item = (id) => leitura.find((entrada) => entrada.id === id);

assert.match(item('ciclo').valor, /82%/);
assert.match(item('ciclo').detalhe, /74%/);
assert.equal(item('projecao').valor, '80%', '40 em 10 dias -> 56 em 14, de 70 planejadas');
assert.match(item('horario').valor, /Manhã/);
assert.match(item('semana').valor, /Terça/);
assert.match(item('alta').valor, /Saúde/);
assert.match(item('queda').valor, /Trabalho/);
assert.match(item('esquecida').valor, /Casa/);
assert.match(item('presenca').valor, /de 7/);

// A arena em queda nao aparece de novo como esquecida.
const semTrabalhoNaSemana = leituraPremiumDoDia({
  feitos: feitos.filter((f) => !(f.arenaId === 'trabalho' && f.data === dia(2))),
  hoje,
  arenas: [{ id: 'trabalho', nome: 'Trabalho' }, { id: 'casa', nome: 'Casa' }],
  ciclo: null,
});
assert.equal(semTrabalhoNaSemana.find((e) => e.id === 'queda').valor, 'Trabalho');
assert.equal(semTrabalhoNaSemana.find((e) => e.id === 'esquecida').valor, 'Casa');

// Sem dado, sem item: nada de frase vazia.
const vazia = leituraPremiumDoDia({ feitos: [], hoje, arenas: [], ciclo: null });
assert.deepEqual(vazia.map((entrada) => entrada.id), ['presenca']);

// A sugestao para o proximo ciclo.
assert.match(sugestaoParaOProximoCiclo({ executionRatePct: 97, totalDays: 7, daysWithoutCompletion: 0 }).valor, /\+10%/);
assert.match(sugestaoParaOProximoCiclo({ executionRatePct: 50, totalDays: 7, daysWithoutCompletion: 1 }).valor, /menos/i);
assert.match(sugestaoParaOProximoCiclo({ executionRatePct: 80, totalDays: 10, daysWithoutCompletion: 4 }).valor, /leves/i);
assert.match(sugestaoParaOProximoCiclo({ executionRatePct: 80, totalDays: 10, daysWithoutCompletion: 1 }).valor, /Mesma/);
console.log('Leitura Premium: cada item sai do dado, e sem dado nao aparece.');
