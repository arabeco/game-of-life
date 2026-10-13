import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TAGS_DO_DIARIO, cabecalhoDaEntrada, lerEntradas, humoresDaPagina } from '../utils/diario.ts';

/**
 * O DIARIO COM TAG E COR (12/10/2026, pedido do Afonso).
 *
 * Na aba Humor: a bolinha na cor do humor ao lado do campo, e embaixo as tags
 * Insight, Ideia, Reflexao, Desabafo e Lembrete (nenhuma marcada = sem tag).
 * A tag vai no cabecalho da entrada, como o humor ja ia — sem coluna nova:
 *     12/10/2026 · Coragem · Ideia
 * Em Paginas: a pagina vira leitura, uma entrada por cartao, com cor e tag.
 */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

assert.deepEqual(TAGS_DO_DIARIO, ['Insight', 'Ideia', 'Reflexão', 'Desabafo', 'Lembrete']);
assert.equal(cabecalhoDaEntrada('12/10/2026', 'Coragem', 'Ideia'), '12/10/2026 · Coragem · Ideia');
assert.equal(cabecalhoDaEntrada('12/10/2026', 'Coragem', null), '12/10/2026 · Coragem');
console.log('ok - a tag vai no cabecalho, depois do humor');

const pagina = [
  'Texto solto do comeco, sem cabecalho.',
  '',
  '--------------',
  '11/10/2026 · Medo',
  'Entrada antiga, sem tag.',
  '',
  '--------------',
  '12/10/2026 · Coragem · Ideia',
  'Fazer o diario com cor.',
  'Segunda linha.',
  '',
  '--------------',
  '12/10/2026',
  'Data de hoje, sem humor.',
  '',
  '--------------',
  '13/10/2026 · Lembrete',
  'So a tag, sem humor.',
  '',
].join('\n');
const entradas = lerEntradas(pagina);
assert.deepEqual(entradas.map((e) => [e.data, e.humor, e.tag]), [
  [null, null, null],
  ['11/10/2026', 'Medo', null],
  ['12/10/2026', 'Coragem', 'Ideia'],
  ['12/10/2026', null, null],
  ['13/10/2026', null, 'Lembrete'],
]);
assert.equal(entradas[2].texto, 'Fazer o diario com cor.\nSegunda linha.');
assert.equal(entradas[0].texto, 'Texto solto do comeco, sem cabecalho.');
assert.deepEqual(lerEntradas(''), []);
assert.deepEqual(humoresDaPagina(pagina), ['Medo', 'Coragem'], 'a lista de paginas mostra as bolinhas dos humores da pagina');
console.log('ok - a pagina vira entradas com data, humor, tag e texto');

const humor = ler('components/MoodModal.tsx');
assert.match(humor, /TAGS_DO_DIARIO\.map/, 'sem os botoes de tag na aba Humor');
assert.match(humor, /cabecalhoDaEntrada\(/, 'registrar nao grava a tag no cabecalho');
assert.match(humor, /aria-label=\{`Humor: \$\{currentMoodInfo\.label\}`\}/, 'sem a bolinha do humor ao lado do campo');
const aba = ler('components/JournalTab.tsx');
assert.match(aba, /lerEntradas\(/, 'a pagina nao virou leitura por entradas');
assert.match(aba, />\s*Editar\s*</, 'sem o botao de editar o texto cru');
console.log('Diario: cor, tag e paginas como leitura.');
