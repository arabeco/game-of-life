import assert from 'node:assert/strict';
import { avisoDaConquista, expDasConquistasGuardadas, marcasDeGuardada, resumoDasGuardadas } from '../utils/avisoEssencial.ts';
import { REGRAS_DE_DESBLOQUEIO, expDaRegra } from '../constants/desbloqueiosPorRegra.ts';

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
// A secreta fica calada no Essencial: entra o EXP, sem aviso (27/10/2026).
assert.equal(avisoDaConquista({ type: 'QUEST_COMPLETED', data: { secreta: true, title: 'Ritual', reward: { exp: 1000, items: ['x'] } } }), null);
// ...e o cartao de patente explica o EXP que entrou calado (so as guardadas).
const [a, b] = REGRAS_DE_DESBLOQUEIO;
assert.equal(expDasConquistasGuardadas([`guardada:${a.id}`, `segredo-exp:${a.id}`, `guardada:${b.id}`, 'outra-flag', 'guardada:nao-existe']), expDaRegra(a) + expDaRegra(b));
assert.equal(expDasConquistasGuardadas(undefined), 0);
assert.equal(avisoDaConquista({ type: 'COMPETITION_COMPLETED', data: { title: 'Desafio vencido' } }), 'Desafio vencido');
assert.equal(avisoDaConquista({ type: 'QUALQUER', data: {} }), 'Concluído.');
// As missoes iniciais rodam para todo mundo; no Essencial nao se chamam missao.
assert.equal(avisoDaConquista({ type: 'QUEST_COMPLETED', data: { sobrancelha: 'Missão inicial', title: 'Criar a primeira arena', reward: { exp: 100 } } }), 'Primeiro passo: Criar a primeira arena · +100 EXP');
// Ao voltar para o Imersivo: um aviso so com tudo o que entrou calado.
assert.deepEqual(marcasDeGuardada(`segredo:${a.id}+${b.id}`), [`guardada:${a.id}`, `guardada:${b.id}`]);
assert.equal(resumoDasGuardadas(['outra-flag']), null);
const itens = a.itens.length + b.itens.length;
assert.equal(
    resumoDasGuardadas([`guardada:${a.id}`, `guardada:${b.id}`, 'x']),
    `Enquanto você esteve no Essencial: 2 conquistas secretas, +${(expDaRegra(a) + expDaRegra(b)).toLocaleString('pt-BR')} EXP${itens ? ` e ${itens} ${itens === 1 ? 'item' : 'itens'} no Arsenal` : ''}. Estão em Missões, em Segredos.`,
);
console.log('Aviso do Essencial: cada conquista vira uma linha curta.');
