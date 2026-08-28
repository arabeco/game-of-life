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
const systemChallenges = readFileSync(new URL('../constants/systemChallenges.ts', import.meta.url), 'utf8');

// The streak challenge went from seven days to five in 1.0.57/1.0.58. The claim
// threshold and the progress bar have to read the same number as its id.
assert.match(gameContext, /system-five-day-proof-streak[\s\S]*?dailyProofStreak\)\.current >= 5/);
assert.match(seasonView, /system-five-day-proof-streak[\s\S]*?currentProofStreak \/ 5/);
// Clamped so the label cannot read "7/5 dias" once the streak passes the goal.
assert.match(seasonView, /`\$\{Math\.min\(currentProofStreak, 5\)\}\/5 dias`/);
assert.match(achievementModal, /Bônus de sequência/);
// Esta assercao pinava o texto 'SETE DIAS REAIS!' — e por isso nao viu o defeito
// que ela existia para pegar. O desafio caiu de sete para cinco dias, o nome
// mudou em systemChallenges e o AchievementModal continuou comparando com o
// literal 'Sete Dias em Movimento'. A comparacao virou sempre falsa: quem
// fechava a sequencia recebia o "Desafio concluido" generico, e a celebracao
// escrita para o momento nunca aparecia para ninguem.
//
// Agora o modal deriva o nome do proprio desafio, entao o que o teste protege e
// que ele NAO volte a escrever nome de missao a mao.
assert.match(achievementModal, /PROOF_STREAK_CHALLENGE_TITLES/, 'o modal reconhece a missao pelos dados dela');
assert.doesNotMatch(achievementModal, /'(Sete|Cinco) Dias em Movimento'/, 'nome de missao escrito a mao volta a apodrecer em silencio');
assert.match(achievementModal, /cinco dias seguidos/, 'a celebracao diz o numero certo de dias');
assert.match(systemChallenges, /PROOF_STREAK_CHALLENGE_TITLES/, 'os nomes saem dos dados, nao de uma copia');

console.log('Daily insights regression: praise, historical reading, and five-day streak reward are wired.');
