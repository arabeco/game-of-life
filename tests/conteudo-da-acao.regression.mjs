import assert from 'node:assert/strict';
import { conteudoDaAcao, temConteudo } from '../utils/conteudoDaAcao.ts';

/**
 * O ICONE DE CONTEUDO NO PLANNER (27/10/2026).
 *
 * A acao ganha icone so quando tem algo dentro: aula (briefing), checklist ou
 * midia. Texto em branco, item de checklist vazio e midia sem url nao contam.
 */
assert.deepEqual(conteudoDaAcao({}), { texto: false, checklist: false, midia: false });
assert.equal(temConteudo(conteudoDaAcao(null)), false, 'acao sem nada nao ganha icone');
assert.deepEqual(conteudoDaAcao({ briefing: '   \n ' }), { texto: false, checklist: false, midia: false }, 'aula em branco nao conta');
assert.equal(conteudoDaAcao({ briefing: 'O sono nao e uniforme.' }).texto, true);
assert.equal(conteudoDaAcao({ preFlight: ['', '  '] }).checklist, false, 'checklist so com itens vazios nao conta');
assert.equal(conteudoDaAcao({ preFlight: ['Agua por perto'] }).checklist, true);
assert.equal(conteudoDaAcao({ assets: [{ type: 'image', url: '', title: 'x' }] }).midia, false, 'midia sem url nao conta');
assert.equal(conteudoDaAcao({ assets: [{ type: 'image', url: '/assets/campanhas/sono.webp', title: 'Sono' }] }).midia, true);
assert.equal(temConteudo(conteudoDaAcao({ preFlight: ['Celular longe'] })), true);
console.log('Conteudo da acao: aula, checklist e midia contam so quando existem de verdade.');
