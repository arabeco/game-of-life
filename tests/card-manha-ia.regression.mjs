import assert from 'node:assert/strict';
import { candidatosDoCard, escolherCandidato, promptDoCard, validarCard } from '../supabase/functions/_shared/card-manha-ia.ts';

/**
 * O CARD DA MANHA COM IA (17/11/2026, com o Afonso).
 *
 * O codigo escolhe o assunto e calcula o fato; a IA so escreve. As regras que
 * o Afonso pediu depois do ensaio:
 *   - falha e feito contra PROMETIDO, so no ciclo atual, contando o que nunca
 *     foi para o planner;
 *   - 14 de 16 nao e falha: so abaixo de 80% e com 3 ou mais de diferenca;
 *   - acao nova conta a partir de quando entrou (Correr 3km virou Correr 4km);
 *   - so julga depois de 3 esperadas;
 *   - o tom e o da pessoa; calmo nunca recebe "proximo degrau";
 *   - o tipo de ontem nao volta, e o mesmo assunto so depois de 3 dias;
 *   - joinha pesa a favor, polegar para baixo pesa contra.
 */
const hoje = '2026-11-15';
const ciclo = { name: 'Novembro', start_date: '2026-11-01', end_date: '2026-11-28', report_data: null };
const arenas = [
  { id: 'saude', name: 'Academia', asset_id: 'saude' },
  { id: 'prop', name: 'Projetos', asset_id: 'proposito' },
];
// 28 dias de ciclo: 4 por semana = 16 no ciclo; todo dia = 28.
const acoes = [
  { id: 'treino', arena_id: 'saude', name: 'ABCDE', action_type: 'Ação Recorrente', repetitions: 16 },
  { id: 'cafe', arena_id: 'saude', name: 'Café da Manhã', action_type: 'Ação Recorrente', repetitions: 28 },
  { id: 'progredir', arena_id: 'prop', name: 'Progredir', action_type: 'Ação Recorrente', repetitions: 20 },
  // Nova: entrou no dia 12, 1 por semana. So 0 ou 1 esperada: nao pode virar assunto.
  { id: 'correr4', arena_id: 'saude', name: 'Correr 4km', action_type: 'Ação Recorrente', repetitions: 4, created_at: '2026-11-12T10:00:00Z' },
  { id: 'livre', arena_id: 'saude', name: 'Alongar', action_type: 'Livre', repetitions: 1 },
];
const dia = (n) => `2026-11-${String(n).padStart(2, '0')}`;
const tarefas = [];
for (let d = 1; d <= 14; d += 1) {
  tarefas.push({ action_id: 'cafe', date: dia(d), start_time: 450, completed: true });
  // Treino: 7 esperados ate ontem (16/28 x 14 = 8), feitos 7 -> nao e falha.
  if (d % 2 === 0) tarefas.push({ action_id: 'treino', date: dia(d), start_time: 630, completed: true });
}
// Progredir: 10 esperados ate ontem (20/28 x 14), feitos 3, e nunca foi agendado nos outros dias.
[2, 5, 9].forEach((d) => tarefas.push({ action_id: 'progredir', date: dia(d), start_time: null, completed: true }));
// Um ciclo antigo, cheio de falhas da Correr 3km, que nao pode contar agora.
const antigo = { name: 'Outubro', start_date: '2026-10-01', end_date: '2026-10-28', report_data: { grade: 'SS', metrics: { max_streak: 28 } } };

const entrada = { hoje, ciclos: [ciclo, antigo], acoes, arenas, tarefas, niveis: [{ asset_id: 'saude', level: 7 }, { asset_id: 'proposito', level: 6 }], perfilDasAreas: { saude: 'Em forma' } };
const candidatos = candidatosDoCard(entrada);
const porTipo = (tipo) => candidatos.filter((c) => c.tipo === tipo);

// A esquecida e o Progredir, pelo prometido; o treino (7 de 8) nao entra.
const esquecida = porTipo('esquecida')[0];
assert.ok(esquecida, 'tem acao esquecida');
assert.equal(esquecida.assunto, 'acao:progredir');
assert.match(esquecida.fato, /Progredir/);
assert.match(esquecida.fato, /3/);
assert.ok(!candidatos.some((c) => c.assunto === 'acao:treino' && c.tipo === 'esquecida'), '14 de 16 nao e falha');
assert.ok(!candidatos.some((c) => c.assunto === 'acao:correr4'), 'acao nova sem 3 esperadas nao vira assunto');

// A ancora prende o Progredir no Cafe da Manha, que nao falha neste ciclo.
const ancora = porTipo('ancora')[0];
assert.ok(ancora, 'tem ancora');
assert.match(ancora.fato, /Café da Manhã/);

// O ciclo no meio, com ritmo caindo, vira assunto; o degrau existe.
assert.ok(porTipo('ciclo').length === 1, 'ciclo vira candidato');
assert.ok(porTipo('degrau').length === 1, 'degrau vira candidato');
assert.ok(!candidatos.some((c) => /Correr 3km|Outubro/.test(c.fato) && c.tipo !== 'conquista'), 'ciclo antigo nao entra nas falhas');

// Calmo nunca recebe o proximo degrau.
for (let i = 0; i < 5; i += 1) {
  const escolhido = escolherCandidato(candidatos.filter((c) => c.tipo === 'degrau' || c.tipo === 'conquista'), { tom: 'calmo', hoje, historico: [] });
  assert.notEqual(escolhido?.tipo, 'degrau');
}

// O tipo de ontem nao volta; o assunto de 2 dias atras tambem nao.
const semHistorico = escolherCandidato(candidatos, { tom: 'coach', hoje, historico: [] });
assert.ok(semHistorico);
const comOntem = escolherCandidato(candidatos, { tom: 'coach', hoje, historico: [{ data: '2026-11-14', tipo: semHistorico.tipo, assunto: 'x', texto: '' }] });
assert.notEqual(comOntem.tipo, semHistorico.tipo, 'tipo de ontem nao repete');
const assuntoRecente = escolherCandidato(candidatos, { tom: 'coach', hoje, historico: [{ data: '2026-11-13', tipo: 'conquista', assunto: 'acao:progredir', texto: '' }] });
assert.notEqual(assuntoRecente.assunto, 'acao:progredir', 'assunto de 2 dias atras nao repete');
const assuntoVelho = escolherCandidato(candidatos, { tom: 'coach', hoje, historico: [{ data: '2026-11-10', tipo: 'conquista', assunto: 'acao:progredir', texto: '' }] });
assert.equal(assuntoVelho.assunto, semHistorico.assunto, 'depois de 3 dias o assunto pode voltar');

// Polegar para baixo empurra o tipo para tras.
const naoGosta = Array.from({ length: 4 }, (_, i) => ({ data: `2026-11-0${i + 1}`, tipo: semHistorico.tipo, assunto: `y${i}`, texto: '', nota: -1 }));
assert.notEqual(escolherCandidato(candidatos, { tom: 'coach', hoje, historico: naoGosta }).tipo, semHistorico.tipo);

// O prompt leva o tom da pessoa, o fato e a frase de ontem; nada de horario sugerido.
const prompt = promptDoCard(esquecida, 'reflexivo', [{ data: '2026-11-14', tipo: 'ciclo', assunto: 'ciclo:ritmo', texto: 'Vale pensar onde ela cabe melhor.' }]);
assert.match(prompt, /reflexivo/);
assert.match(prompt, /Progredir/);
assert.match(prompt, /Vale pensar onde ela cabe melhor\./);
assert.match(prompt, /horário/);

// A conferencia do que volta: JSON, tamanho e sem imperativo.
assert.deepEqual(validarCard('{"titulo":"Progredir pede espaço","texto":"Foram 3 de 10 esperadas até ontem. Vale rever onde Progredir cabe no seu dia."}'),
  { ok: true, titulo: 'Progredir pede espaço', texto: 'Foram 3 de 10 esperadas até ontem. Vale rever onde Progredir cabe no seu dia.' });
assert.equal(validarCard('```json\n{"titulo":"Ok","texto":"Foram 3 de 10 esperadas até ontem, e isso pede um lugar no dia."}\n```').ok, true);
assert.equal(validarCard('{"titulo":"Encaixe o Progredir","texto":"Foram 3 de 10 esperadas até ontem, e isso pede um lugar no dia."}').ok, false);
assert.equal(validarCard(`{"titulo":"Longo","texto":"${'a'.repeat(200)}"}`).ok, false);
assert.equal(validarCard('isso nao e json').ok, false);
assert.equal(validarCard('{"titulo":"Progredir pede espaço","texto":"Foram 3 de 10 esperadas. Talvez valha rever onde ela entra na semana."}').ok, false, 'pronome no lugar do nome');

// Sem ciclo aberto: nada de falha nem de ritmo, so o que nao depende dele.
const semCiclo = candidatosDoCard({ ...entrada, ciclos: [antigo] });
assert.ok(!semCiclo.some((c) => ['esquecida', 'ancora', 'ciclo'].includes(c.tipo)));

console.log('card-manha-ia: ok');
