import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TAGS_DO_DIARIO, cabecalhoDaEntrada, lerEntradas, humoresDaPagina, periodoDaPagina } from '../utils/diario.ts';

/**
 * O DIARIO COM TAG E COR (12/10/2026, pedido do Afonso).
 *
 * Na aba Humor: a bolinha na cor do humor ao lado do campo, e embaixo as tags
 * Ideia, Reflexao, Gratidao, Conquista e Lembrete (nenhuma marcada = sem tag).
 * A tag vai no cabecalho da entrada, como o humor ja ia — sem coluna nova:
 *     12/10/2026 · Coragem · Ideia
 * Em Paginas: a pagina vira leitura, uma entrada por cartao, com cor e tag.
 */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

assert.deepEqual(TAGS_DO_DIARIO, ['Ideia', 'Reflexão', 'Gratidão', 'Conquista', 'Lembrete']);
assert.equal(cabecalhoDaEntrada('12/10/2026', 'Coragem', 'Ideia'), '12/10/2026 · Coragem · Ideia');
assert.equal(cabecalhoDaEntrada('12/10/2026', 'Coragem', null), '12/10/2026 · Coragem');
assert.equal(cabecalhoDaEntrada('12/10/2026', null, 'Ideia'), '12/10/2026 · Ideia', 'entrada sem humor (bolinha desligada)');
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

// A lista mostra o PERIODO da pagina (primeira e ultima data), nao uma data so.
assert.equal(periodoDaPagina(pagina), '11/10 – 13/10/2026');
assert.equal(periodoDaPagina('12/10/2026 · Medo\noi'), '12/10/2026', 'um dia so: a data sozinha');
assert.equal(periodoDaPagina('30/12/2025\na\n\n--------------\n02/01/2026\nb'), '30/12/2025 – 02/01/2026', 'virada de ano: as duas datas inteiras');
assert.equal(periodoDaPagina('texto sem data'), null);
console.log('ok - periodo da pagina');

const humor = ler('components/MoodModal.tsx');
assert.match(humor, /TAGS_DO_DIARIO\.map/, 'sem os botoes de tag na aba Humor');
assert.match(humor, /cabecalhoDaEntrada\(/, 'registrar nao grava a tag no cabecalho');
assert.match(humor, /onClick=\{\(\) => setSemHumor\(/, 'tocar na bolinha nao tira o humor');
assert.match(humor, /semHumor \? null : currentMoodInfo\.label/, 'sem humor, o cabecalho ainda levava a emocao');
assert.match(humor, /if \(!semHumor\) \{\s*updateMood/, 'sem humor, registrar ainda marcava o humor');
const aba = ler('components/JournalTab.tsx');
assert.match(aba, /lerEntradas\(/, 'a pagina nao virou leitura por entradas');
assert.match(aba, />\s*Editar\s*</, 'sem o botao de editar o texto cru');
assert.match(aba, /ICONE_DA_TAG/, 'o cartao da entrada mostra o simbolo da tag, nao a bolinha');
assert.match(aba, /pagina\.periodo/, 'a lista mostra o periodo da pagina');
console.log('Diario: cor, tag e paginas como leitura.');

// ============================== ESCOLHER A PAGINA (12/10/2026)
// Escrever pode ir para outra pagina: o seletor comeca em "Ultima pagina".
import { paginaDeDestino } from '../utils/diario.ts';
assert.equal(paginaDeDestino([], 'ultima'), 1, 'sem pagina nenhuma, a primeira');
assert.equal(paginaDeDestino([1, 2, 5], 'ultima'), 5);
assert.equal(paginaDeDestino([1, 2, 5], 2), 2, 'pagina escolhida');
assert.equal(paginaDeDestino([1, 2, 5], 'nova'), 6, 'pagina nova: depois da ultima, sem tapar buraco');
assert.equal(paginaDeDestino([], 'nova'), 1);
assert.equal(paginaDeDestino([1, 2], 0), 2, 'pagina invalida cai na ultima');
assert.equal(paginaDeDestino([1, 2], 120), 2, 'pagina acima do teto cai na ultima');
assert.match(ler('components/MoodModal.tsx'), /const gravou = await anexarEntrada\([\s\S]{0,400}if \(!gravou\)/, 'falha ao gravar apagava o texto');
assert.equal(paginaDeDestino(Array.from({ length: 99 }, (_, i) => i + 1), 'nova'), null, 'sem espaco para pagina nova');
const humor2 = ler('components/MoodModal.tsx');
assert.match(humor2, /aria-label="Página onde escrever"/, 'sem o seletor de pagina');
assert.match(humor2, />\s*Escrever\s*</, 'a aba Humor virou Escrever');
assert.match(ler('services/JournalService.ts'), /export const anexarEntrada = async \([\s\S]{0,200}destino/, 'anexarEntrada nao recebe a pagina escolhida');
console.log('ok - escolher a pagina onde escrever');
