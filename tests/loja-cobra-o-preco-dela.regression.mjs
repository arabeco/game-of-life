import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migracao = readFileSync(
  new URL('../supabase/migrations/20260923160000_a_loja_cobra_o_preco_dela.sql', import.meta.url),
  'utf8',
);
const contexto = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const premium = readFileSync(new URL('../utils/premiumAccess.ts', import.meta.url), 'utf8');

/* ==========================================================================
 * O PRECO NAO PODE VIR DE QUEM PAGA.
 *
 * `buy_store_item(p_item_id, p_cost_gold, p_type)` cobrava o valor que o
 * aplicativo enviasse. Quem chamasse a RPC direto escolhia quanto pagar — e
 * com custo negativo a verificacao `saldo < custo` passava e a subtracao
 * virava soma, o que fazia a funcao imprimir ouro.
 *
 * O argumento continua na assinatura porque a versao publicada ainda o envia,
 * e mudar a assinatura quebraria o app instalado. Mas ele e ignorado: o preco
 * sai de `public.items` (itens) ou de `public.store_prices` (codex, boost,
 * premium).
 *
 * O unico desconto legitimo — 10% para renovar assinatura a tres dias ou menos
 * do fim — passou a ser CONFERIDO no servidor em vez de aceito do cliente.
 * ========================================================================== */

const corpoDaFuncao = migracao.slice(
  migracao.indexOf('create or replace function public.buy_store_item'),
);

assert.ok(corpoDaFuncao.length > 0, 'nao achei a funcao na migracao');

// Os comentarios explicam o bug citando a forma dele. O que vale e o codigo.
const codigo = corpoDaFuncao
  .split('\n')
  .filter((linha) => !linha.trim().startsWith('--'))
  .join('\n');

// ---------------------------------------------------------------------------
// 1. O ARGUMENTO DO CLIENTE NAO DECIDE NADA.
// ---------------------------------------------------------------------------

assert.ok(
  !/p_cost_gold/.test(codigo.replace(/create or replace function[^\n]*\n/, '')),
  'p_cost_gold voltou a ser usado no corpo da funcao — ele so pode existir na assinatura',
);

// ---------------------------------------------------------------------------
// 2. O PRECO SAI DO SERVIDOR, NOS DOIS CAMINHOS.
// ---------------------------------------------------------------------------

assert.match(codigo, /from public\.items/, 'o preco de item tem de sair de public.items');
assert.match(codigo, /from public\.store_prices/, 'o preco de codex/boost/premium tem de sair de store_prices');

// Item que existe no catalogo mas nao se compra: bau, patente, pacote premium,
// aposentado e desligado.
for (const flag of ['is_live_in_game', 'is_chest_exclusive', 'is_rank_exclusive', 'is_premium_only', 'is_legacy_retired']) {
  assert.ok(codigo.includes(flag), `a consulta de item precisa checar ${flag}`);
}

// ---------------------------------------------------------------------------
// 3. O DESCONTO E CONFERIDO, NAO ACEITO.
// ---------------------------------------------------------------------------

// Sem a checagem de validade, "renovacao" viraria 10% para qualquer um.
assert.match(codigo, /v_expira > now\(\)/, 'o desconto exige assinatura ainda ativa');
assert.match(codigo, /<= 3/, 'o desconto exige estar a tres dias ou menos do fim');
assert.match(codigo, /round\(v_base \* 0\.9\)/, 'o desconto e 10%, a mesma conta do cliente');

// A conta do cliente e a fonte: se ela mudar, esta linha tem de mudar junto.
assert.match(
  premium,
  /Math\.max\(0, Math\.round\(basePrice \* \(1 - discountPercent\)\)\)/,
  'a conta do desconto no cliente mudou — a da funcao precisa acompanhar',
);

// ---------------------------------------------------------------------------
// 4. O DEBITO CONTINUA ATOMICO.
// ---------------------------------------------------------------------------

// Ler o saldo e grava-lo depois deixava duas chamadas simultaneas passarem as
// duas pela conferencia e gastarem o mesmo ouro.
assert.match(
  codigo,
  /update public\.user_profiles[\s\S]{0,600}?and coalesce\(\(wallet->>'gold'\)::integer, 0\) >= v_preco/,
  'a conferencia de saldo tem de estar na mesma instrucao do debito',
);

// ---------------------------------------------------------------------------
// 5. A TELA MOSTRA O QUE FOI COBRADO, E NAO O PROPRIO PALPITE.
// ---------------------------------------------------------------------------

assert.match(
  contexto,
  /const cobrado = Number\(\(data as any\)\?\.charged \?\? cost\)/,
  'o app precisa ler o valor cobrado que o servidor devolveu',
);

assert.ok(
  !/const newGold = \(userProfile\.wallet\?\.gold \|\| 0\) - cost;/.test(contexto),
  'o app voltou a descontar o preco que ele mesmo calculou',
);

console.log('[ok] a loja cobra o preco dela');
