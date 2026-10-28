import assert from 'node:assert/strict';
import { avisoDaConquista } from '../utils/avisoEssencial.ts';

/**
 * EXPERIENCIA ESSENCIAL (27/10/2026): o modal de recompensa vira um aviso curto.
 * O aviso diz o que aconteceu e o EXP, sem bau, item nem ouro de festa.
 */
assert.equal(avisoDaConquista({ type: 'QUEST_COMPLETED', data: { title: 'Manter academia', reward: { exp: 300, gold: 5 } } }), 'Missão concluída: Manter academia · +300 EXP');
assert.equal(avisoDaConquista({ type: 'ARENA_COMPLETED', data: { name: 'Projeto', metaFinal: 'Lançar' } }), 'Meta concluída: Projeto');
assert.equal(avisoDaConquista({ type: 'ARENA_COMPLETED', data: { name: 'Casa' } }), 'Arena concluída: Casa');
assert.equal(avisoDaConquista({ type: 'PLAYER_RANK_UP', data: { id: 'cavaleiro', name: 'Cavaleiro' } }), 'Nova patente: 3 de 10');
assert.equal(avisoDaConquista({ type: 'REPORT_COMPLETED', data: {} }), 'Ciclo fechado. O relatório está pronto.');
assert.equal(avisoDaConquista({ type: 'MILESTONE_COMPLETED', data: { name: 'Primeira entrega' } }), 'Marco concluído: Primeira entrega');
assert.equal(avisoDaConquista({ type: 'QUEST_COMPLETED', data: { secreta: true, title: 'Ritual', reward: { exp: 1000, items: ['x'] } } }), 'Conquista: Ritual · +1.000 EXP');
assert.equal(avisoDaConquista({ type: 'COMPETITION_COMPLETED', data: { title: 'Desafio vencido' } }), 'Desafio vencido');
assert.equal(avisoDaConquista({ type: 'QUALQUER', data: {} }), 'Concluído.');
console.log('Aviso do Essencial: cada conquista vira uma linha curta.');
