import assert from 'node:assert/strict';
import { getActionExpMultiplier, getTaskBaseExp } from '../utils/coreLoopUtils.js';

// EXP = MINUTOS (28/10/2026, com o Afonso). Facil e media valem o tempo; so a
// dificil multiplica (x1,10), e a tela avisa na hora de escolher.
assert.equal(getActionExpMultiplier({ difficulty: 1 }), 1);
assert.equal(getActionExpMultiplier({ difficulty: 2 }), 1);
assert.equal(getActionExpMultiplier({}), 1, 'sem dificuldade e media');
assert.equal(getActionExpMultiplier({ difficulty: 3 }), 1.1);
assert.equal(getTaskBaseExp({ duration: 30 }, { difficulty: 2 }), 30);
assert.equal(getTaskBaseExp({ duration: 30 }, { difficulty: 3 }), 33);
// LAZER SAIU (28/10/2026). Eram dois nomes para "nao da EXP": a dificuldade
// Lazer e a acao Livre. So a Livre ficou; quem estava em Lazer vale como Leve.
assert.equal(getActionExpMultiplier({ difficulty: 0 }), 1, 'lazer antigo vale como leve');
assert.equal(getTaskBaseExp({ duration: 40 }, { difficulty: 0 }), 40);
console.log('EXP por dificuldade: minutos, e so a dificil multiplica.');
