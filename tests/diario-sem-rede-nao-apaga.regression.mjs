import assert from 'node:assert/strict';
import { build } from 'esbuild';

/**
 * O DIARIO NAO APAGA PAGINA QUANDO A REDE FALHA (18/10/2026, teste do Luigi).
 *
 * Ler a pagina e falhar devolvia "pagina vazia". Com a internet oscilando —
 * a leitura cai, a gravacao passa —, anexarEntrada gravava a pagina so com a
 * entrada nova, e todo o texto antigo dela sumia. O mesmo valia para abrir uma
 * pagina no editor sem rede: abria em branco, e salvar depois apagava o resto.
 *
 * Regra: sem conseguir ler, nao se grava. Falha de leitura e falha, nao vazio.
 */
const fake = `
const estado = globalThis.__journalTestState = { falhaLista: false, falhaLeitura: false, gravacoes: [] };
const resposta = (falhou, data) => falhou ? { data: null, error: { message: 'Failed to fetch' } } : { data, error: null };
const consulta = () => {
  const q = {
    select: (colunas) => { q.colunas = colunas; return q; },
    eq: () => q, order: () => q,
    then: (ok, ko) => Promise.resolve(resposta(estado.falhaLista, [{ page_number: 1, updated_at: '', content: 'texto antigo' }])).then(ok, ko),
    maybeSingle: () => Promise.resolve(resposta(estado.falhaLeitura, { content: 'texto antigo' })),
    upsert: (linha) => { estado.gravacoes.push(linha); return Promise.resolve({ error: null }); },
  };
  return q;
};
export const supabase = { from: consulta };
`;
const saida = await build({
  entryPoints: ['services/JournalService.ts'], bundle: true, write: false, platform: 'node', format: 'esm',
  plugins: [{ name: 'falso', setup(b) {
    b.onResolve({ filter: /supabaseClient$/ }, () => ({ path: 'supabase-falso', namespace: 'falso' }));
    b.onResolve({ filter: /eventosDeSegredos$/ }, () => ({ path: 'segredos-falso', namespace: 'falso' }));
    b.onLoad({ filter: /supabase-falso/, namespace: 'falso' }, () => ({ contents: fake, loader: 'js' }));
    b.onLoad({ filter: /segredos-falso/, namespace: 'falso' }, () => ({ contents: 'export const avisarSegredoConfirmado = () => {};', loader: 'js' }));
  } }],
});
const mod = await import('data:text/javascript;base64,' + Buffer.from(saida.outputFiles[0].text).toString('base64'));

const tentar = async ({ falhaLista, falhaLeitura }) => {
  const e = globalThis.__journalTestState;
  e.falhaLista = falhaLista; e.falhaLeitura = falhaLeitura; e.gravacoes.length = 0;
  const gravou = await mod.anexarEntrada('u1', '18/10/2026', 'entrada nova', 'ultima');
  return { gravou, gravacoes: [...e.gravacoes] };
};

let r = await tentar({ falhaLista: true, falhaLeitura: false });
assert.equal(r.gravou, false, 'sem conseguir listar as paginas, a entrada foi dada como gravada');
assert.equal(r.gravacoes.length, 0, 'sem conseguir listar as paginas, gravou por cima de uma pagina');

r = await tentar({ falhaLista: false, falhaLeitura: true });
assert.equal(r.gravou, false, 'sem conseguir ler a pagina, a entrada foi dada como gravada');
assert.equal(r.gravacoes.length, 0, 'sem conseguir ler a pagina, gravou por cima dela e apagou o texto antigo');

r = await tentar({ falhaLista: false, falhaLeitura: false });
assert.equal(r.gravou, true, 'com rede, a entrada nao foi gravada');
assert.match(r.gravacoes[0].content, /texto antigo[\s\S]*entrada nova/, 'com rede, a entrada nova nao foi somada ao texto antigo');

assert.equal(await mod.lerPaginaOuFalha('u1', 1).then(() => 'ok', () => 'falhou'), 'ok');
globalThis.__journalTestState.falhaLeitura = true;
assert.equal(await mod.lerPaginaOuFalha('u1', 1), null, 'o editor precisa saber que a leitura falhou, para nao abrir a pagina em branco');

console.log('Diario: sem rede nao se grava por cima; o texto antigo da pagina nunca some.');

// O EDITOR DE PAGINAS. "Voltar" salvava e saia sem esperar: sem rede, o texto
// escrito ia embora com a tela. E abrir sem rede abria a pagina em branco.
import { readFileSync } from 'node:fs';
const tela = readFileSync(new URL('../components/JournalTab.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
assert.match(tela, /await lerPaginaOuFalha\(/, 'o editor abre a pagina com a leitura que nao sabe distinguir falha de vazio');
assert.match(tela, /const salvou = await salvar\(\);\s*if \(!salvou\) return;/, '"Voltar" e "Pronto" saem sem esperar a gravacao, e o texto some sem rede');
assert.match(tela, /Sem internet/, 'falha de rede no editor nao avisa a pessoa');
console.log('Diario: o editor nao abre em branco nem perde o texto ao voltar sem rede.');

// O HUMOR. A bolinha mudava antes de gravar: sem rede, "ia" e depois voltava.
const humor = readFileSync(new URL('../components/MoodModal.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const registrar = humor.slice(humor.indexOf('const handleRegistrar'), humor.indexOf('React.useEffect', humor.indexOf('const handleRegistrar')));
assert.ok(registrar.indexOf('anexarEntrada(') > 0 && registrar.indexOf('anexarEntrada(') < registrar.indexOf('updateMood('),
  'o humor muda na tela antes de o diario gravar, e sem rede ele volta sozinho');
console.log('Humor: so muda depois que a entrada foi gravada.');
