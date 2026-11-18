import assert from 'node:assert/strict';
import { avisoDoOraculo, textoDasRestantes } from '../utils/oraculoIaAvisos.ts';
import { readFileSync } from 'node:fs';

/**
 * OS AVISOS DO ORACULO COM IA, NA VOZ DELE (03/11/2026, com o Afonso).
 *
 * Sem internet, erro e mensagens esgotadas viram uma fala do Oraculo no chat,
 * nao um aviso solto. So o esgotado do gratis leva o botao do Premium.
 */
const semInternet = avisoDoOraculo('SEM_INTERNET', { gratis: true });
assert.match(semInternet.texto, /internet/i);
assert.match(semInternet.texto, /não contou|não gastou/i, 'deixa claro que nao gastou');
assert.equal(semInternet.premium, false);

const falhou = avisoDoOraculo('FALHOU', { gratis: false });
assert.match(falhou.texto, /de novo/i);
assert.equal(falhou.premium, false);

// Esgotado (15/11/2026, com o Afonso): uma linha so, a hora em que volta, e o botao.
const acabouGratis = avisoDoOraculo('LIMITE', { gratis: true, limite: 1 });
assert.equal(acabouGratis.texto, 'Suas mensagens acabaram. Voltam às 4h.');
assert.equal(acabouGratis.premium, true, 'gratis esgotado mostra o botao Premium');

const acabouPago = avisoDoOraculo('LIMITE', { gratis: false, limite: 15 });
assert.equal(acabouPago.texto, 'Suas mensagens acabaram. Voltam às 4h.');
assert.equal(acabouPago.premium, false, 'quem ja paga nao recebe propaganda');
for (const tom of ['neutro', 'coach', 'reflexivo', 'calmo']) {
  assert.equal(avisoDoOraculo('LIMITE', { gratis: true, tom }).texto, acabouGratis.texto, 'esgotado e igual em todo tom');
}

console.log('Avisos do Oraculo com IA: sem internet, erro e esgotado, na voz dele.');

// Um texto por tom (03/11/2026): o mesmo aviso muda de voz, sem chamar a IA.
{
  const tons = ['neutro', 'coach', 'reflexivo', 'calmo'];
  const textos = tons.map((tom) => avisoDoOraculo('FALHOU', { gratis: false, tom }).texto);
  assert.equal(new Set(textos).size, 4, 'os quatro tons tem textos diferentes');
  assert.equal(avisoDoOraculo('FALHOU', { gratis: false, tom: 'qualquer' }).texto, avisoDoOraculo('FALHOU', { gratis: false, tom: 'neutro' }).texto, 'tom desconhecido vira neutro');
}
console.log('Avisos: um texto por tom.');

// As restantes perto da caixa; o numero de Conversar e o de nao lidas (04/11/2026).
assert.equal(textoDasRestantes(45), '45 mensagens restantes hoje');
assert.equal(textoDasRestantes(1), '1 mensagem restante hoje');
{
  const feed = readFileSync(new URL('../components/OracleFeed.tsx', import.meta.url), 'utf8');
  assert.match(feed, /<AttentionBadge count=\{unreadChat\}/, 'o numero de cima e o de nao lidas');
  assert.doesNotMatch(feed, /restam|mensagensRestantes/, 'as restantes nao ficam em cima');
  assert.match(readFileSync(new URL('../components/PerguntaAoOraculo.tsx', import.meta.url), 'utf8'), /textoDasRestantes\(mensagensRestantes\(cota\)!\)/);
}

// Os tres pontinhos: da pergunta ate a resposta, e na leitura do dia.
{
  const caixa = readFileSync(new URL('../components/PerguntaAoOraculo.tsx', import.meta.url), 'utf8');
  const chat = readFileSync(new URL('../components/OracleChat.tsx', import.meta.url), 'utf8');
  assert.ok(caixa.indexOf('onDigitando(true)') < caixa.indexOf('perguntarAoOraculo(pergunta, tom)'), 'liga antes de perguntar');
  assert.ok(caixa.indexOf('onDigitando(false)') > caixa.indexOf('perguntarAoOraculo(pergunta, tom)'), 'desliga depois da resposta');
  assert.match(chat, /onDigitando=\{setIaDigitando\}/);
  assert.match(chat, /const oraculoDigitando = iaDigitando \|\| lendoMeuDia/);
  assert.match(chat, /aria-label="Oráculo digitando"/);
}
console.log('Avisos: contador e tres pontinhos.');

// A caixa esgotada: a mesma linha e o botao Premium, que abre os planos.
{
  const caixa = readFileSync(new URL('../components/PerguntaAoOraculo.tsx', import.meta.url), 'utf8');
  assert.match(caixa, /avisoDoOraculo\('LIMITE'/, 'a caixa usa o mesmo texto do chat');
  assert.match(caixa, />\s*Premium\s*</, 'o botao se chama Premium');
  const chat = readFileSync(new URL('../components/OracleChat.tsx', import.meta.url), 'utf8');
  assert.match(chat, /label: 'Premium', kind: 'open_premium'/);
}
