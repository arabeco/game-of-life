import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/* AS FAIXAS DE QUEST EM MUNDO > TEMPORADA.
 *
 * Em 09/10/2026 eram cartoes altos, de tres linhas, cada familia pintando o
 * cartao inteiro com uma cor e algumas com arte de fundo: pareciam quatro tipos
 * diferentes. Agora sao faixas finas, todas do mesmo tamanho; a familia fica so
 * na barrinha da esquerda e na linha de progresso, e imagem, descricao e
 * recompensa moram no modal que abre ao tocar. */

const fonte = readFileSync(new URL('../views/SeasonView.tsx', import.meta.url), 'utf8');
const inicio = fonte.indexOf('const SeasonQuestCard');
const faixa = fonte.slice(inicio, fonte.indexOf('export const SeasonView', inicio));
assert.ok(inicio > 0, 'SeasonQuestCard existe');

assert.match(faixa, /<button\s+type="button"/, 'a faixa e um botao');
assert.match(faixa, /\bh-10\b/, 'altura de faixa, uma linha so');
assert.doesNotMatch(faixa, /bg-cover|backgroundImage|<img/, 'a arte mora no modal, nao na faixa');
assert.doesNotMatch(faixa, /linear-gradient\(105deg/, 'a familia nao pinta mais a faixa inteira');
assert.match(faixa, /QUEST_FAMILY_COLOR\[family\]/, 'a familia continua na barrinha');

// Os modais que a faixa abre continuam com a arte.
const modais = readFileSync(new URL('../components/SeasonDetailModal.tsx', import.meta.url), 'utf8');
assert.match(modais, /artUrl=\{quest\.artUrl\}/);
assert.match(modais, /artUrl=\{mission\.artUrl\}/);

console.log('faixas-de-quest: ok');
