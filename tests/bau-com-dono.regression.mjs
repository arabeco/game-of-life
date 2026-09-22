import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migracao = readFileSync(
  new URL('../supabase/migrations/20260922230000_o_bau_vai_para_quem_pediu.sql', import.meta.url),
  'utf8',
);
const app = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const tipos = readFileSync(new URL('../types.ts', import.meta.url), 'utf8');

// Comentarios fora: o cabecalho da migracao CITA a funcao velha inteira, com o
// `p_user_id` e tudo. Sem isso o teste acusa o texto que explica o conserto.
const sql = migracao.replace(/^\s*--.*$/gm, '');

/* ==========================================================================
 * O BAU VAI PARA QUEM PEDIU.
 *
 * `grant_chest(p_user_id uuid, p_chest_type text)` recebia o DESTINO como
 * parametro, nao olhava quem chamava, nao validava o tipo, era SECURITY
 * DEFINER sem search_path e tinha EXECUTE liberado para PUBLIC e anon.
 *
 * Qualquer pessoa na internet, sem conta, inseria bau lendario em qualquer id.
 * Bastava a URL do projeto — que vive no bundle do cliente.
 *
 * Este teste guarda a separacao entre as duas portas: a do app, que so sabe a
 * propria conta, e a do servidor, que aceita um id e nao e alcancavel de fora.
 * ========================================================================== */

// ---------------------------------------------------------------------------
// 1. A PORTA DO APP NAO ACEITA DESTINO.
// ---------------------------------------------------------------------------

const assinaturaMinha = sql.match(/create or replace function public\.grant_my_chest\(([^)]*)\)/);
assert.ok(assinaturaMinha, 'grant_my_chest sumiu da migracao');
assert.ok(
  !assinaturaMinha[1].includes('uuid'),
  `grant_my_chest voltou a receber um id (${assinaturaMinha[1]}) — o destino tem de sair de auth.uid()`,
);

const corpoMinha = sql.slice(sql.indexOf('function public.grant_my_chest'), sql.indexOf('revoke all on function public.grant_my_chest'));
assert.match(corpoMinha, /v_user_id uuid := auth\.uid\(\)/, 'o destino tem de vir de auth.uid()');
assert.match(corpoMinha, /if v_user_id is null then\s*raise exception 'AUTH_REQUIRED'/, 'sem sessao nao ha bau');
assert.match(corpoMinha, /values \(v_user_id, p_chest_type\)/, 'o insert tem de usar o dono da sessao');

// ---------------------------------------------------------------------------
// 2. A PORTA QUE ACEITA DESTINO SAI DO ALCANCE DE QUEM NAO E O SERVIDOR.
//
// Ela nao morre: `_competition_grant_chest` paga bau para outras pessoas — o
// anuncio de patente do cla paga todos os membros. SECURITY DEFINER roda como o
// dono, que mantem o EXECUTE, entao as chamadas internas seguem funcionando.
// ---------------------------------------------------------------------------

assert.match(
  sql,
  /revoke all on function public\.grant_chest\(uuid, text\) from public, anon, authenticated/,
  'grant_chest precisa perder PUBLIC, anon E authenticated — era isso que deixava a torneira aberta',
);
assert.match(
  sql,
  /grant execute on function public\.grant_my_chest\(text\) to authenticated/,
  'a porta do app precisa continuar aberta para quem tem sessao',
);
assert.match(sql, /revoke all on function public\.grant_my_chest\(text\) from public, anon/, 'a porta do app nao serve anonimo');

// ---------------------------------------------------------------------------
// 3. AS DUAS VALIDAM O TIPO, E A LISTA E A MESMA DO APP.
//
// Tipo invalido virava linha em user_chests que o app nao sabe desenhar, e o
// erro so aparecia depois, na tela do inventario, longe da causa.
// ---------------------------------------------------------------------------

const doTipo = tipos.match(/export type ChestType = ([^;]+);/);
assert.ok(doTipo, 'ChestType sumiu de types.ts');
const tiposDoApp = [...doTipo[1].matchAll(/'((?:[^'\\]|\\u[0-9A-Fa-f]{4})+)'/g)]
  .map(([, valor]) => valor.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))));
assert.ok(tiposDoApp.length >= 5, `esperava a lista de ChestType, achei ${JSON.stringify(tiposDoApp)}`);

const listasNoSql = [...sql.matchAll(/not in\s*\(([^)]*)\)/g)].map(([, lista]) =>
  [...lista.matchAll(/'([^']+)'/g)].map(([, valor]) => valor),
);
assert.equal(listasNoSql.length, 2, `as duas funcoes precisam validar o tipo; achei ${listasNoSql.length} listas`);

for (const lista of listasNoSql) {
  assert.deepEqual(
    [...lista].sort(),
    [...tiposDoApp].sort(),
    `a lista de baus do banco nao bate com ChestType de types.ts:\n  banco: ${lista.join(', ')}\n  app:   ${tiposDoApp.join(', ')}`,
  );
}

// ---------------------------------------------------------------------------
// 4. SECURITY DEFINER COM search_path.
//
// Sem ele, a funcao roda como o dono mas resolve `user_chests` pelo caminho de
// quem chama.
// ---------------------------------------------------------------------------

const definidas = [...sql.matchAll(/create or replace function public\.(grant_my_chest|grant_chest)[\s\S]{0,400}?as \$\$/g)];
assert.equal(definidas.length, 2, 'as duas funcoes precisam ser definidas aqui');
for (const [trecho, nome] of definidas) {
  assert.match(trecho, /security definer/, `${nome}: perdeu o security definer`);
  assert.match(trecho, /set search_path = public/, `${nome}: SECURITY DEFINER sem search_path fixo`);
}

// ---------------------------------------------------------------------------
// 5. O APP USA A PORTA CERTA.
// ---------------------------------------------------------------------------

assert.match(app, /supabase\.rpc\('grant_my_chest', \{/, 'o app precisa chamar grant_my_chest');
assert.ok(
  !/supabase\.rpc\('grant_chest'/.test(app),
  'o app voltou a chamar grant_chest com um id — essa porta e so do servidor agora',
);

console.log('[bau-com-dono] ok — o bau vai para quem pediu, e so para ele');
