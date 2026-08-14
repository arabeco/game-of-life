import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildHistoricalDailyInsight,
  buildLiveDailyPraise,
} from '../utils/dailyInsights.ts';

const firstProof = buildLiveDailyPraise({
  actionName: 'Treino',
  arenaName: 'Academia',
  completedCount: 1,
  plannedCount: 3,
  distinctArenaCount: 1,
  streakCurrent: 1,
  isFirstProofToday: true,
}, () => 0);
assert.match(firstProof || '', /Primeiro registro do dia/);

const continuedStreak = buildLiveDailyPraise({
  actionName: 'Leitura',
  arenaName: 'Estudos',
  completedCount: 1,
  plannedCount: 2,
  distinctArenaCount: 1,
  streakCurrent: 4,
  isFirstProofToday: true,
}, () => 1);
assert.match(continuedStreak || '', /4 dias em movimento/);

const balancedDay = buildLiveDailyPraise({
  actionName: 'Mensagem',
  arenaName: 'Relações',
  completedCount: 3,
  plannedCount: 5,
  distinctArenaCount: 3,
  streakCurrent: 2,
  isFirstProofToday: false,
}, () => 1);
assert.match(balancedDay || '', /equilíbrio|distribuição/);

const quietMoment = buildLiveDailyPraise({
  actionName: 'Rotina',
  completedCount: 4,
  plannedCount: 8,
  distinctArenaCount: 1,
  streakCurrent: 2,
  isFirstProofToday: false,
}, () => 0);
assert.equal(quietMoment, null, 'The Oracle must not comment after every completion.');

assert.match(buildHistoricalDailyInsight({
  completedCount: 3,
  plannedCount: 3,
  distinctArenaCount: 2,
  arenaNames: ['Saúde', 'Relações'],
}), /dia completo e bem distribuído/);

assert.match(buildHistoricalDailyInsight({
  completedCount: 0,
  plannedCount: 4,
  distinctArenaCount: 0,
  arenaNames: [],
}), /carga daquele dia realmente cabia/);

const gameContext = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const seasonView = readFileSync(new URL('../views/SeasonView.tsx', import.meta.url), 'utf8');
const achievementModal = readFileSync(new URL('../components/AchievementModal.tsx', import.meta.url), 'utf8');

assert.match(gameContext, /system-seven-day-proof-streak[\s\S]*?dailyProofStreak\)\.current >= 7/);
assert.match(seasonView, /system-seven-day-proof-streak[\s\S]*?currentProofStreak \/ 7/);
assert.match(seasonView, /`\$\{currentProofStreak\}\/7 dias`/);
assert.match(achievementModal, /Bônus de sequência/);
assert.match(achievementModal, /SETE DIAS REAIS!/);

console.log('Daily insights regression: praise, historical reading, and seven-day reward are wired.');
