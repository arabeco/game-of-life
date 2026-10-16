import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Desde 16/10/2026 a exclusao mora em _shared/accountDeletion.ts, usada pelo
// pedido (account-delete) e pela retomada automatica (account-delete-retry). A
// funcao do pedido so registra e chama.
const ler = (caminho) => readFileSync(new URL(caminho, import.meta.url), 'utf8');
const entrada = ler('../supabase/functions/account-delete/index.ts');
const fonte = ler('../supabase/functions/_shared/accountDeletion.ts');

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
 * Este teste guarda quem PODE abortar. So a exclusao em si e o registro de onde
 * ela parou (16/10: o pedido que falha fica guardado e e retomado sozinho, e
 * para isso o estado precisa estar salvo).
 * ========================================================================== */

// Comentarios fora: a nota que explica a regra cita os passos que ela proibe.
const semComentario = (texto) => texto
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const codigo = semComentario(fonte);
const codigoDaEntrada = semComentario(entrada);

// ---------------------------------------------------------------------------
// 1. SO A EXCLUSAO ABORTA A EXCLUSAO.
// ---------------------------------------------------------------------------

const PODEM_ABORTAR = [
  // O estado salvo: sem ele a retomada nao sabe de onde continuar.
  'Could not persist deletion state',
  'Could not persist storage manifest',
  // A exclusao em si, e a prova de que ela aconteceu.
  'Data deletion failed',
  'Profile deletion could not be verified',
  'Auth deletion could not be verified',
];

const abortos = [...codigo.matchAll(/throw new Error\(([\s\S]*?)\);/g)]
  .map((achado) => achado[1].replace(/\s+/g, ' ').trim());

for (const aborto of abortos) {
  assert.ok(
    PODEM_ABORTAR.some((permitido) => aborto.includes(permitido)),
    'passo que nao e a exclusao pode derrubar a exclusao: ' + aborto,
  );
}
assert.equal(abortos.length, PODEM_ABORTAR.length, `esperado ${PODEM_ABORTAR.length} abortos, achei ${abortos.length}: ${abortos.join(' | ')}`);

// ---------------------------------------------------------------------------
// 2. OS PASSOS SECUNDARIOS CONTINUAM EXISTINDO — e nao derrubam nada.
//
// Nao vale "consertar" apagando a limpeza: o arquivo tem de ser removido quando
// der. O que mudou foi o que acontece quando NAO da.
// ---------------------------------------------------------------------------

for (const [passo, marca] of [
  ['soltura do convite ouro', 'release_golden_invite_claim_for_user'],
  ['bloqueio de reentrada', 'register_deleted_account_block'],
  ['varredura do storage', 'list_account_storage_objects'],
  ['remocao dos arquivos', '.storage.from(bucket).remove('],
  ['e-mail de conta excluida', "functions.invoke('resend'"],
]) {
  assert.ok(codigo.includes(marca), `${passo} sumiu — ele deve continuar rodando, so nao pode abortar`);
}
assert.match(codigo, /Reentry block could not be registered/, 'o bloqueio de reentrada que falha precisa avisar e seguir');
assert.match(codigo, /if \(error\) pending\.push/, 'arquivo que nao sai vai para a lista de pendentes, sem derrubar a exclusao');
assert.match(codigo, /catch \{ metadata\.deletion_email_status = 'failed'; \}/, 'e-mail que falha nao pode derrubar a exclusao ja feita');

// ---------------------------------------------------------------------------
// 3. A ORDEM: o pedido e registrado antes, a conta morre depois.
//
// Registrar depois deixaria a exclusao sem rastro se o processo caisse no meio.
// ---------------------------------------------------------------------------

assert.ok(
  codigoDaEntrada.indexOf('begin_account_deletion') > 0
    && codigoDaEntrada.indexOf('processAccountDeletion(') > codigoDaEntrada.indexOf('begin_account_deletion'),
  'o pedido se registra antes de comecar a apagar',
);
const ondeGuardaLista = codigo.indexOf('Could not persist storage manifest');
const ondeRemove = codigo.indexOf('.storage.from(bucket).remove(');
const ondeApagaDados = codigo.indexOf('delete_account_data_for_user');
const ondeApagaAuth = codigo.indexOf('auth.admin.deleteUser');
const ondeAvisa = codigo.indexOf("functions.invoke('resend'");
assert.ok(ondeGuardaLista > 0 && ondeRemove > ondeGuardaLista, 'a lista de arquivos e salva antes de apagar qualquer um');
assert.ok(ondeApagaDados > 0 && ondeApagaAuth > ondeApagaDados, 'o usuario de autenticacao sai por ultimo');
assert.ok(ondeAvisa > ondeApagaAuth, 'o e-mail so sai depois que a conta foi apagada');

// ---------------------------------------------------------------------------
// 4. O app tem como chamar isso.
// ---------------------------------------------------------------------------

const servico = ler('../services/SupabaseService.ts');
assert.match(
  servico,
  /functions\.invoke\('account-delete'/,
  'o app precisa continuar tendo por onde pedir a exclusao',
);

console.log('[apagar-conta] ok — so a exclusao aborta a exclusao');
