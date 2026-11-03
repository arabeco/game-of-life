import assert from 'node:assert/strict';

/**
 * A REACAO ESPERA A PESSOA PARAR (03/11/2026, com o Afonso).
 *
 * Concluir e ja emendar outra acao: o balao da reacao entrava no ar 650ms
 * depois de soltar, bem quando o dedo descia na proxima tarefa, e o primeiro
 * toque nao ia. Agora a reacao so aparece depois de 1,6s sem mao na tela; se
 * outro gesto comeca antes, ela e descartada. A abertura continua com 650ms.
 */
const alvo = new EventTarget();
globalThis.window = alvo;
globalThis.CustomEvent = class extends Event { constructor(tipo, init) { super(tipo); this.detail = init?.detail; } };
const { emitOracleSpeech, maoEntrouNaTela, maoSaiuDaTela, ORACLE_SPEECH_EVENT } = await import('../utils/oracleSpeech.ts');
const falas = [];
alvo.addEventListener(ORACLE_SPEECH_EVENT, (e) => falas.push(e.detail.message));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Concluiu segurando: a reacao nasce com a mao na tela.
maoEntrouNaTela();
emitOracleSpeech({ kind: 'reacao', message: 'meta cumprida' });
maoSaiuDaTela();
await espera(900);
assert.deepEqual(falas, [], 'aos 900ms a reacao ainda espera');
await espera(900);
assert.deepEqual(falas, ['meta cumprida'], 'depois de 1,6s parada, ela aparece');

// Emendou outra acao antes: a reacao some, sem balao no meio do gesto.
falas.length = 0;
maoEntrouNaTela();
emitOracleSpeech({ kind: 'reacao', message: 'metade' });
maoSaiuDaTela();
await espera(700);
maoEntrouNaTela();
maoSaiuDaTela();
await espera(1900);
assert.deepEqual(falas, [], 'gesto novo descarta a reacao guardada');

// A abertura nao mudou.
falas.length = 0;
maoEntrouNaTela();
emitOracleSpeech({ kind: 'abertura', message: 'bom dia' });
maoSaiuDaTela();
await espera(800);
assert.deepEqual(falas, ['bom dia']);
console.log('Oraculo: reacao espera 1,6s sem mao na tela; gesto novo descarta; abertura igual.');
