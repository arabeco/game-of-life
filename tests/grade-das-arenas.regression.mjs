import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * A GRADE DAS ARENAS DIVIDE A TELA (21/10/2026, Afonso).
 *
 * As miniaturas ficaram em colunas de largura fixa (repeat(3, 6.85rem)): em
 * celular estreito as tres nao cabiam e cortavam um pedaco na esquerda e na
 * direita, com margens diferentes das de antes. A grade volta a dividir a
 * largura em 3 (e 4/5 em tela maior), como era quando dava certinho.
 */
const tela = readFileSync(new URL('../views/ArenasView.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(tela, /grid-cols-\[repeat\(3,\s*[\d.]+rem\)\]/, 'a grade das arenas voltou a ter colunas de largura fixa');
assert.match(tela, /className="grid grid-cols-3 gap-2\.5 px-2 pt-1"/, 'a grade de ate 9 arenas nao divide mais a largura em 3');
assert.match(tela, /grid grid-cols-3 items-start gap-2\.5 md:grid-cols-4 xl:grid-cols-5 animate-in/, 'a grade aberta perdeu as 4/5 colunas de tela maior');
console.log('Grade das arenas: 3 por linha dividindo a tela, sem corte nas bordas.');
