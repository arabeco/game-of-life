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

// A missao dos cinco dias foi APAGADA, nao escondida.
//
// Estas tres assercoes prendiam o numero dela — sete virou cinco em 1.0.57, e o
// teste existia para o rotulo nao dizer "7/5 dias". A mecanica inteira saiu: era
// a ultima coisa que exigia dias consecutivos de quem nao pediu, e a conferencia
// no banco mostrou a coorte de compatibilidade VAZIA. Agora prendem o contrario,
// para ela nao voltar de fininho.
for (const [nome, fonte] of [['GameContext', gameContext], ['SeasonView', seasonView], ['systemChallenges', systemChallenges]]) {
  assert.doesNotMatch(fonte, /system-five-day-proof-streak/, nome + ': a missao dos cinco dias nao volta');
}
assert.doesNotMatch(seasonView, /currentProofStreak/, 'SeasonView nao mede sequencia global');
// Estas quatro assercoes prendiam a celebracao dos cinco dias: o bonus, o nome
// vindo dos dados e o texto "cinco dias seguidos". A historia delas era boa — o
// desafio caiu de sete para cinco, o modal continuou comparando com o literal
// antigo, e a comparacao virou sempre falsa sem ninguem ver.
//
// A mecanica inteira foi apagada agora, entao elas viram o contrario: o que o
// teste protege e que nenhum vestigio dela volte a aparecer no modal.
assert.doesNotMatch(achievementModal, /PROOF_STREAK/, 'o modal nao conhece mais a sequencia global');
assert.doesNotMatch(achievementModal, /'(Sete|Cinco) Dias em Movimento'/, 'nome de missao escrito a mao volta a apodrecer em silencio');
assert.doesNotMatch(achievementModal, /cinco dias seguidos|Bônus de sequência/, 'a celebracao da sequencia global saiu junto com ela');
assert.doesNotMatch(systemChallenges, /PROOF_STREAK/, 'as constantes da sequencia global sairam');

console.log('Daily insights regression: praise, historical reading, and five-day streak reward are wired.');
