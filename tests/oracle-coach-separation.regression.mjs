import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildPlannerCoachSpeech,
  getOracleCoachDailyLimit,
  shouldShowPlannerCoach,
} from '../utils/oracleCoach.ts';

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

assert.equal(getOracleCoachDailyLimit(0), 0);
assert.equal(getOracleCoachDailyLimit(2), 1);
assert.equal(getOracleCoachDailyLimit(3), 2);
assert.equal(shouldShowPlannerCoach(0, () => 0), false);
assert.equal(shouldShowPlannerCoach(2, () => 0.24), true);
assert.equal(shouldShowPlannerCoach(2, () => 0.25), false);

const actionSpeech = buildPlannerCoachSpeech({
  ...baseContext,
  priorityActionName: 'treinar',
}, () => 0);
assert.match(actionSpeech, /Que tal treinar hoje/);

const returningSpeech = buildPlannerCoachSpeech({
  ...baseContext,
  daysSinceLastPlannerOpen: 4,
}, () => 0);
assert.match(returningSpeech, /ultimos 4 dias/);

const source = readFileSync(new URL('../utils/oracleCoach.ts', import.meta.url), 'utf8');
assert.doesNotMatch(source, /premium|dailyFocusCardEnabled|enabledCategories|hasPremiumAccess/i);

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

console.log('Oracle coach separation regression: coach is local and independent from premium content.');
