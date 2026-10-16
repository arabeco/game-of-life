import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * REPETICOES COM - E + (16/10/2026, pedido do Afonso).
 *
 * No criar/editar acao, mudar as repeticoes de 5 para 6 pedia arrastar o
 * slider ate o ponto exato ou apagar e digitar o numero. Agora ha um - e um +
 * ao lado do numero, que andam de um em um e param no minimo e no maximo.
 */
const modal = readFileSync(new URL('../components/ActionModal.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const css = readFileSync(new URL('../components/action-layout.css', import.meta.url), 'utf8');

const repeticoes = modal.slice(modal.indexOf('label="Repetições"') - 300, modal.indexOf('label="Repetições"') + 600);
assert.match(repeticoes, /\bcomBotoes\b/, 'o campo de repeticoes nao pediu os botoes - e +');

const campo = modal.slice(modal.indexOf('const StyledRangeInput'), modal.indexOf('const DayToggle'));
assert.match(campo, /aria-label=\{`Menos \$\{/, 'falta o botao de menos');
assert.match(campo, /aria-label=\{`Mais \$\{/, 'falta o botao de mais');
assert.match(campo, /Math\.max\(min, value - step\)/, 'o menos nao para no minimo');
assert.match(campo, /Math\.min\(max, value \+ step\)/, 'o mais nao para no maximo');
assert.match(campo, /disabled=\{value <= min\}/, 'o menos nao trava no minimo');
assert.match(campo, /disabled=\{value >= max\}/, 'o mais nao trava no maximo');
assert.match(css, /\.action-step\b/, 'os botoes - e + estao sem estilo');
console.log('Acao: repeticoes com - e +, de um em um, travando no minimo e no maximo.');
