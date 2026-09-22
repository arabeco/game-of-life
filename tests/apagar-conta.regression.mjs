import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fonte = readFileSync(
  new URL('../supabase/functions/account-delete/index.ts', import.meta.url),
  'utf8',
);

/* ==========================================================================
 * APAGAR A CONTA E A UNICA COISA QUE NAO PODE FALHAR.
 *
 * E exigencia da Play, e quem pede costuma estar irritado ou com pressa. O
 * pedido e registrado antes de tudo, entao a pessoa le "pedido registrado" e vai
 * embora — se a exclusao morrer depois disso, ela acha que sumiu e nao sumiu.
 *
 * Em 22/09/2026 havia QUATRO coisas que podiam derrubar a exclusao sem serem a
 * exclusao:
 *
 *   - soltar a reserva de convite ouro, de um recurso desligado ha meses
 *   - registrar o bloqueio de reentrada, que e politica
 *   - listar os arquivos do storage
 *   - apagar os arquivos do storage
 *
 * As duas ultimas rodam ANTES da exclusao de verdade. Um bucket fora do ar, uma
 * permissao trocada ou uma queda de rede no meio e a conta continuava de pe.
 *
 * Arquivo que sobra e menor que conta que nao apaga. Os quatro passam a avisar e
 * seguir; o que resta e varredura para depois.
 *
 * Este teste guarda quem PODE abortar. So quatro coisas podem, e as quatro sao a
 * exclusao em si.
 * ========================================================================== */

// Comentarios fora: a nota que explica a regra cita os passos que ela proibe.
const codigo = fonte
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

// ---------------------------------------------------------------------------
// 1. SO A EXCLUSAO ABORTA A EXCLUSAO.
// ---------------------------------------------------------------------------

const PODEM_ABORTAR = [
  // O registro do pedido: sem ele nao ha rastro de que a pessoa pediu, e a
  // exclusao viraria um apagamento sem prova.
  'Failed to log deletion request',
  // As duas que SAO a exclusao.
  'Failed to delete account data',
  'Failed to delete account data.',
  'Failed to delete auth user',
];

const abortos = [...codigo.matchAll(/throw new Error\(([\s\S]*?)\);/g)]
  .map((achado) => achado[1].replace(/\s+/g, ' ').trim());

for (const aborto of abortos) {
  assert.ok(
    PODEM_ABORTAR.some((permitido) => aborto.includes(permitido)),
    'passo que nao e a exclusao pode derrubar a exclusao: ' + aborto
      + ' — arquivo que sobra e menor que conta que nao apaga. Avise e siga.',
  );
}

assert.equal(abortos.length, 4, `esperado 4 abortos, achei ${abortos.length}: ${abortos.join(' | ')}`);

// ---------------------------------------------------------------------------
// 2. OS PASSOS SECUNDARIOS CONTINUAM EXISTINDO — avisando.
//
// Nao vale "consertar" apagando a limpeza: o arquivo tem de ser removido quando
// der. O que mudou foi o que acontece quando NAO da.
// ---------------------------------------------------------------------------

for (const [passo, marca] of [
  ['soltura do convite ouro', 'release_golden_invite_claim_for_user'],
  ['bloqueio de reentrada', 'register_deleted_account_block'],
  ['varredura do storage', 'list_account_storage_objects'],
  ['remocao dos arquivos', '.storage.from(bucket).remove('],
]) {
  assert.ok(codigo.includes(marca), `${passo} sumiu — ele deve continuar rodando, so nao pode abortar`);
}

const avisos = (codigo.match(/console\.warn\(/g) || []).length;
assert.ok(avisos >= 5, `os passos secundarios precisam avisar quando falham; achei ${avisos} console.warn`);

// ---------------------------------------------------------------------------
// 3. A ORDEM: o pedido e registrado antes, a conta morre depois.
//
// Registrar depois deixaria a exclusao sem rastro se o processo caisse no meio.
// ---------------------------------------------------------------------------

const ondeRegistra = codigo.indexOf('Failed to log deletion request');
const ondeApagaDados = codigo.indexOf('delete_account_data_for_user');
const ondeApagaAuth = codigo.indexOf('deleteUserError');

assert.ok(ondeRegistra > 0 && ondeApagaDados > ondeRegistra, 'o pedido se registra antes de apagar os dados');
assert.ok(ondeApagaAuth > ondeApagaDados, 'o usuario de autenticacao sai por ultimo');

// ---------------------------------------------------------------------------
// 4. O app tem como chamar isso.
// ---------------------------------------------------------------------------

const servico = readFileSync(new URL('../services/SupabaseService.ts', import.meta.url), 'utf8');
assert.match(
  servico,
  /functions\.invoke\('account-delete'/,
  'o app precisa continuar tendo por onde pedir a exclusao',
);

console.log('[apagar-conta] ok — so a exclusao aborta a exclusao');
