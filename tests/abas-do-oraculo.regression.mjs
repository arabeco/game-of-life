import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { secaoDaMensagem, secoesComNaoLidas } from '../utils/oracleSecoes.ts';

/* A BOLINHA DE NAO LIDO NAS SUB-ABAS DO ORACULO (09/10/2026).
 *
 * Abrir o Oraculo marcava tudo como lido, em todas as abas, de uma vez. Agora
 * cada sub-aba marca so o que e dela, e as outras ficam com a bolinha ate a
 * pessoa passar por elas. A regra de "qual aba" e uma so para o filtro e para a
 * bolinha. */

const msg = (extra) => ({ deliveryType: 'feed', category: 'frases_inspiradoras', read: false, contextSnapshot: {}, ...extra });

assert.equal(secaoDaMensagem(msg({ contextSnapshot: { purpose: 'premium_content_card' } })), 'wisdom');
assert.equal(secaoDaMensagem(msg({ category: 'analise_padroes', contextSnapshot: { purpose: 'cycle_insight' } })), 'guidance');
assert.equal(secaoDaMensagem(msg({ contextSnapshot: { purpose: 'individual_mission' } })), 'mission');
assert.equal(secaoDaMensagem(msg({ deliveryType: 'chat', contextSnapshot: { purpose: 'oracle_speech' } })), 'guidance', 'fala do Oraculo e de Dia e ciclo');
assert.equal(secaoDaMensagem(msg({ contextSnapshot: null })), 'wisdom', 'card antigo sem proposito segue a regra antiga');
assert.equal(secaoDaMensagem(msg({ category: 'analise_padroes', contextSnapshot: null })), 'guidance');

assert.deepEqual(
  [...secoesComNaoLidas([
    msg({ contextSnapshot: { purpose: 'premium_content_card' } }),
    msg({ read: true, contextSnapshot: { purpose: 'individual_mission' } }),
    msg({ category: 'analise_padroes', contextSnapshot: { purpose: 'cycle_insight' } }),
  ])].sort(),
  ['guidance', 'wisdom'],
  'mensagem ja lida nao acende a aba',
);

const chat = readFileSync(new URL('../components/OracleChat.tsx', import.meta.url), 'utf8');
assert.match(chat, /secaoDaMensagem\(message\) === section/, 'so a aba aberta marca como lido');
assert.match(chat, /section !== id && secoesNaoLidas\.has\(id\)/, 'a bolinha aparece nas outras abas');

const feed = readFileSync(new URL('../components/OracleFeed.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(feed, /markOracleMessageAsRead\(messageId\)/, 'abrir o Oraculo nao marca tudo como lido');

console.log('abas-do-oraculo: ok');
