import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildPlannerCoachSpeech,
  shouldShowPlannerCoach,
} from '../utils/oracleCoach.ts';
import { ORACLE_PRESENCE, ORACLE_PRESENCE_RULES } from '../constants/oraclePresencePolicy.ts';

const baseContext = {
  arenasCount: 2,
  actionsCount: 5,
  cycleLengthDays: 7,
  cycleProgress: 45,
  daysSinceLastPlannerOpen: 0,
  daysSinceLastProof: 0,
  hasActiveCycle: true,
  cyclePace: 'no_ritmo',
  focusArenaName: null,
  focusArenaPace: null,
  focusArenaAdjustment: null,
  priorityActionName: null,
  completedActionNameToday: null,
};

// A frequencia da fala mora na TABELA de presenca, nao numa funcao paralela.
// getOracleCoachDailyLimit respondia a mesma pergunta que openingLine, num
// arquivo que nao conhecia o outro — e o teto dela vencia, entao a tabela dizia
// "fala toda vez que abre" e o Oraculo calava na terceira.
assert.equal(ORACLE_PRESENCE_RULES[ORACLE_PRESENCE.SILENCIOSO].openingLine, 'nunca');
assert.equal(ORACLE_PRESENCE_RULES[ORACLE_PRESENCE.EQUILIBRADO].openingLine, 'diaria');
assert.equal(ORACLE_PRESENCE_RULES[ORACLE_PRESENCE.PRESENTE].openingLine, 'sempre');

const coachSource = readFileSync(new URL('../utils/oracleCoach.ts', import.meta.url), 'utf8');
assert.doesNotMatch(
  coachSource,
  /export const getOracleCoachDailyLimit/,
  'nao pode voltar a existir uma segunda regra de frequencia',
);
assert.equal(shouldShowPlannerCoach(0, () => 0), false);
assert.equal(shouldShowPlannerCoach(2, () => 0.24), true);
assert.equal(shouldShowPlannerCoach(2, () => 0.25), false);

const actionSpeech = buildPlannerCoachSpeech({
  ...baseContext,
  priorityActionName: 'treinar',
}, () => 0);
// A frase exata mudou quando a abertura ganhou tom, e cobrar o texto literal
// prendia a redacao. O que importa e a acao real da pessoa aparecer na fala.
assert.match(actionSpeech, /treinar/);

const returningSpeech = buildPlannerCoachSpeech({
  ...baseContext,
  daysSinceLastPlannerOpen: 4,
}, () => 0);
// Mesma razao: o numero real e o que importa, nao a redacao ao redor dele.
assert.match(returningSpeech, /4 dias/);

const source = readFileSync(new URL('../utils/oracleCoach.ts', import.meta.url), 'utf8');
// Sem comentarios: o que esta proibido e o coach CONSULTAR premium, nao a palavra
// aparecer numa explicacao. O tom e comprado no Premium, e dizer isso num
// comentario e justamente o que impede alguem de reintroduzir o portao aqui.
const sourceCode = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
assert.doesNotMatch(sourceCode, /premium|dailyFocusCardEnabled|enabledCategories|hasPremiumAccess/i);

const contextSource = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const cardStart = contextSource.indexOf('const requestOracleContentCard');
const cardEnd = contextSource.indexOf('// --- Notifications Implementation ---', cardStart);
const cardPath = contextSource.slice(cardStart, cardEnd);
assert.ok(cardStart >= 0 && cardEnd > cardStart, 'caminho de card premium deve ser identificavel');
assert.match(cardPath, /hasPremiumAccess/);
assert.match(cardPath, /purpose: 'premium_content_card'/);
assert.doesNotMatch(cardPath, /dailyFocusCardEnabled|notificationsEnabled|presenceLevel/);

// O card automatico saia de um prompt de IA (buildAutomaticContentCardPrompt).
// A IA foi removida: o texto agora vem escrito, entao a checagem passou a olhar
// a funcao que monta e grava o card. A regra segue a mesma: o caminho do card
// premium nao pode carregar sinal do coach.
const edgeSource = readFileSync(new URL('../supabase/functions/oracle/index.ts', import.meta.url), 'utf8');
const cardStart2 = edgeSource.indexOf('const createAutomaticOracleMessage');
const cardEnd2 = edgeSource.indexOf('const handleAutomaticOracleCron', cardStart2);
const automaticCard = edgeSource.slice(cardStart2, cardEnd2);
assert.ok(cardStart2 >= 0 && cardEnd2 > cardStart2, 'caminho do card automatico deve ser identificavel');
assert.match(automaticCard, /purpose: "premium_content_card"/);
assert.doesNotMatch(automaticCard, /focusArenaSignal|priorityActionName|nextMove/);


// --- a abertura fala nas quatro vozes -----------------------------------
// Ela e a fala MAIS VISTA do app — dispara a cada abertura no nivel Presente — e
// tinha o MENOR estoque: 20 frases sem variacao de tom nenhuma. As reacoes ja
// falavam em quatro vozes; a abertura, que aparece muito mais, falava numa so.
// O tom e o que o Premium compra, entao ter reacao com tom e abertura sem tom
// fazia o Oraculo trocar de personalidade conforme o assunto.
const { countCoachLines, COACH_LINE_STATES } = await import('../utils/oracleCoach.ts');
assert.equal(COACH_LINE_STATES.length, 10, 'dez situacoes de abertura');
assert.ok(countCoachLines() >= 80, `abertura precisa de estoque; tem ${countCoachLines()}`);

const ausente = { ...baseContext, daysSinceLastPlannerOpen: 5 };
const vozes = ['neutro', 'coach', 'reflexivo', 'calmo']
  .map((tom) => buildPlannerCoachSpeech(ausente, () => 0, tom));
assert.equal(new Set(vozes).size, 4, 'cada tom precisa dizer algo diferente');
for (const voz of vozes) assert.match(voz, /5/, 'o numero real da pessoa entra na frase');

// Tom desconhecido cai no neutro: errar para o gratuito nunca entrega de graca a
// voz que o Premium compra, e nunca deixa o Oraculo mudo.
assert.equal(
  buildPlannerCoachSpeech(ausente, () => 0, 'inexistente'),
  buildPlannerCoachSpeech(ausente, () => 0, 'neutro'),
);

// --- e as reacoes ganharam uma terceira por voz --------------------------
const speechLib = readFileSync(new URL('../constants/oracleSpeechLibrary.ts', import.meta.url), 'utf8');
const reacoes = speechLib.slice(
  speechLib.indexOf('export const ORACLE_SPEECH_LIBRARY'),
  speechLib.indexOf('export const fillOracleSpeech'),
);
const totalReacoes = (reacoes.match(/^ {12}'/gm) || []).length;
assert.ok(totalReacoes >= 120, `reacoes: 10 eventos x 4 tons x 3; tem ${totalReacoes}`);

// Custo de rede das duas: zero. Sao bancos escritos, escolhidos no aparelho.
const coachSrc = readFileSync(new URL('../utils/oracleCoach.ts', import.meta.url), 'utf8');
assert.doesNotMatch(coachSrc, /fetch\(|supabase|invoke\(/, 'a abertura nao pode ir a rede');

console.log('Oracle coach separation regression: coach is local and independent from premium content.');
