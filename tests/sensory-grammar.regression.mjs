import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SENSORY_GRAMMAR,
  SENSORY_WEIGHT_INTENT,
  getSensoryWeight,
} from '../constants/sensoryGrammar.ts';

/**
 * A gramatica do toque.
 *
 * As dez pistas escolhiam a propria vibracao no lugar onde eram tratadas, e
 * colidiam: acao concluida e dia de sequencia identicos; arena concluida e
 * painel diario identicos; e um CICLO INTEIRO fechando vibrava igual a fechar o
 * painel diario.
 *
 * O corpo aprende por diferenca, e e o corpo que gera antecipacao. Duas metades
 * da mesma regra: a mesma coisa sempre vibra igual, coisas diferentes nunca
 * vibram igual.
 */

const cueTypes = readFileSync(new URL('../utils/sensoryCue.ts', import.meta.url), 'utf8');
const cues = [...cueTypes.matchAll(/\|\s*'([a-z_]+)'/g)].map((match) => match[1]);
assert.ok(cues.length >= 10, 'as pistas devem ser legiveis do arquivo de tipos');

// Toda pista tem peso. Uma pista sem peso cai no default e volta a colidir em
// silencio, que e exatamente como as colisoes anteriores nasceram.
for (const cue of cues) {
  assert.ok(SENSORY_GRAMMAR[cue], `${cue} precisa declarar um peso na gramatica`);
}

// Todo peso diz o que quer dizer no pulso.
for (const [peso, intencao] of Object.entries(SENSORY_WEIGHT_INTENT)) {
  assert.ok(intencao.length >= 20, `${peso} precisa dizer o que significa`);
}
for (const peso of Object.values(SENSORY_GRAMMAR)) {
  assert.ok(SENSORY_WEIGHT_INTENT[peso], `${peso} usado sem intencao declarada`);
}

// --- as colisoes que motivaram tudo isto ------------------------------------

assert.notEqual(
  getSensoryWeight('task_complete'), getSensoryWeight('daily_streak'),
  'marcar uma acao e fechar um dia de sequencia nao podem chegar iguais',
);
assert.notEqual(
  getSensoryWeight('arena_complete'), getSensoryWeight('campaign_complete'),
  'fechar uma arena e fechar uma campanha nao podem chegar iguais',
);
assert.notEqual(
  getSensoryWeight('cycle_complete'), getSensoryWeight('daily_panel_closed'),
  'fechar um ciclo inteiro vibrava igual a fechar o painel diario',
);

// A acao concluida acontece dezenas de vezes por dia: tem de ser o mais leve.
assert.equal(getSensoryWeight('task_complete'), 'toque');

// O marco de sequencia e o unico com peso proprio — raro por definicao, e por
// isso reconhecivel na segunda vez que a pessoa sentir.
const raros = Object.entries(SENSORY_GRAMMAR).filter(([, peso]) => peso === 'marco_raro');
assert.deepEqual(raros.map(([cue]) => cue), ['streak_milestone'], 'marco_raro e exclusivo da sequencia');

// --- o consumidor nao pode voltar a escolher sozinho ------------------------
// A tabela so resolve enquanto for a unica dona da decisao.

const app = readFileSync(new URL('../components/AuthenticatedApp.tsx', import.meta.url), 'utf8');
const inicio = app.indexOf('const handleAppSensoryCue');
const fim = app.indexOf('window.addEventListener(APP_SENSORY_CUE_EVENT', inicio);
assert.ok(inicio > 0 && fim > inicio, 'o tratador de pistas deve ser identificavel');
const tratador = app.slice(inicio, fim);

assert.match(tratador, /getSensoryWeight\(detail\.cue\)/, 'o peso sai da tabela');
assert.doesNotMatch(
  tratador, /case '(task_complete|arena_complete|cycle_complete)'/,
  'escolha por pista, uma a uma, foi o que produziu as colisoes',
);

// E o marco de sequencia precisa ter quem o dispare, senao o peso raro e um
// vocabulario que ninguem fala.
const gameContext = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
assert.match(gameContext, /emitAppSensoryCue\(marcoDeSequencia \? 'streak_milestone'/);
assert.match(gameContext, /\[7, 14, 30, 60, 100\]/, 'a lista de marcos e a mesma do banco de falas');

console.log('Sensory grammar: tres pesos, cada pista com o seu, e nada colidindo.');
