import assert from 'node:assert/strict';

/**
 * A REACAO NAO ATRAPALHA O PROXIMO GESTO (03/11/2026, com o Afonso).
 *
 * Concluir e ja emendar outra acao: o primeiro toque falhava. O balao ja deixa
 * o dedo passar; o que pesava era fecha-lo no inicio do toque. Agora ele nao
 * fecha com o toque (some sozinho), e a reacao ainda guardada e descartada se
 * outro gesto comeca antes dela sair. Sem espera maior: 650ms depois de soltar.
 */
const alvo = new EventTarget();
globalThis.window = alvo;
globalThis.CustomEvent = class extends Event { constructor(tipo, init) { super(tipo); this.detail = init?.detail; } };
const { emitOracleSpeech, maoEntrouNaTela, maoSaiuDaTela, ORACLE_SPEECH_EVENT } = await import('../utils/oracleSpeech.ts');
const falas = [];
alvo.addEventListener(ORACLE_SPEECH_EVENT, (e) => falas.push(e.detail.message));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

maoEntrouNaTela();
emitOracleSpeech({ kind: 'reacao', message: 'meta cumprida' });
maoSaiuDaTela();
await espera(300);
assert.deepEqual(falas, [], 'com a mao recem-saida, a reacao espera');
await espera(500);
assert.deepEqual(falas, ['meta cumprida'], '650ms depois de soltar, ela aparece');

falas.length = 0;
maoEntrouNaTela();
emitOracleSpeech({ kind: 'reacao', message: 'metade' });
maoSaiuDaTela();
await espera(300);
maoEntrouNaTela();
maoSaiuDaTela();
await espera(900);
assert.deepEqual(falas, [], 'gesto novo antes de ela sair descarta a reacao guardada');
console.log('Oraculo: reacao sai 650ms depois de soltar; gesto novo descarta a guardada; o balao nao fecha com o toque.');
