import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { speechVisualTone, readingVisualTone, resolveOracleVisualTone, ORACLE_PUSH_COLORS } from '../supabase/functions/_shared/oracle-visual-tone.ts';

/* A REGUA DE CORES DO ORACULO (09/10/2026): branco informa, azul orienta, verde
 * e avanco em andamento, dourado e conquista completa, vermelho fica reservado. */

const arena = (id, completed, target) => ({ id, name: id, completed, target });
const facts = { cycle: null, completed: 3, arenas: [arena('a', 3, 5)] };

// A leitura e geral: neutra mesmo com conquista de passagem ou prazo encerrado.
assert.equal(readingVisualTone(facts), 'neutral');
assert.equal(readingVisualTone({ ...facts, arenas: [arena('a', 5, 5)] }), 'neutral', 'arena completa na leitura geral nao vira dourado');
assert.equal(readingVisualTone({ ...facts, cycle: { percent: 100, daysLeft: 2, ended: false } }), 'neutral');
assert.equal(readingVisualTone({ ...facts, cycle: { percent: 30, daysLeft: 0, ended: true } }), 'neutral', 'prazo encerrado e informacao');
assert.equal(readingVisualTone({ ...facts, cycle: { percent: 0, daysLeft: 7, ended: false, startsToday: true } }), 'guide', 'o primeiro dia orienta');

// Abertura: retorno e comeco orientam; o resto informa.
for (const [subject, tone] of [['return', 'guide'], ['open', 'guide'], ['done', 'neutral'], ['planned', 'neutral'], ['stock', 'neutral']]) {
  assert.equal(speechVisualTone('opening', subject), tone, `abertura ${subject}`);
}
// Reacao: avanco parcial e verde, meta no alvo e dourado, retorno e azul.
for (const subject of ['action', 'arena', 'mission']) {
  assert.equal(speechVisualTone('reaction', subject), 'success', `${subject} parcial`);
  assert.equal(speechVisualTone('reaction', subject, true), 'achievement', `${subject} concluida`);
}
assert.equal(speechVisualTone('reaction', 'return'), 'guide');

// O tom gravado: Sabedoria e neutra; tom desconhecido ou ausente, tambem.
assert.equal(resolveOracleVisualTone({ purpose: 'premium_content_card', visualTone: 'success' }), 'neutral');
assert.equal(resolveOracleVisualTone({ visualTone: 'danger', mode: 'coach' }), 'neutral', 'o vermelho nunca sai sozinho');
assert.equal(resolveOracleVisualTone({ visualTone: 'achievement' }), 'achievement');
assert.equal(resolveOracleVisualTone({ visualTone: 'guide' }), 'guide');
assert.equal(resolveOracleVisualTone(), 'neutral');

// A cor do push: hexadecimal, e o neutro nao e branco (some no tema claro do Android).
for (const color of Object.values(ORACLE_PUSH_COLORS)) assert.match(color, /^#[0-9a-f]{6}$/i);
assert.ok(!/^#(f|e)/i.test(ORACLE_PUSH_COLORS.neutral), 'neutro do push nao pode ser branco');
assert.deepEqual(Object.keys(ORACLE_PUSH_COLORS).sort(), ['achievement', 'guide', 'neutral', 'success']);

// A marca: o simbolo ganha a cor, sem a bolinha do centro.
const marca = readFileSync(new URL('../components/OracleSpeakerMark.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(marca, /GameLogoIcon|sizes\.dot/, 'o logo com a bolinha saiu da marca');
assert.match(marca, /fill="currentColor"/, 'o losango e pintado na cor do tom');
assert.match(marca, /achievement: \{\s*core: '#f3d48a'/, 'conquista e dourado');
assert.match(marca, /neutral: \{\s*core: '#eef1f6'/, 'neutro e branco');

console.log('oracle-visual-tone: regua branco, azul, verde e dourado; vermelho reservado');
