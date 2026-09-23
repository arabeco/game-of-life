import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const trava = readFileSync(
  new URL('../supabase/migrations/20260923190000_o_saldo_nao_se_escreve_a_mao.sql', import.meta.url),
  'utf8',
);
const portaDeTras = readFileSync(
  new URL('../supabase/migrations/20260923180000_perfil_fecha_a_porta_de_tras.sql', import.meta.url),
  'utf8',
);
const contexto = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');

/* ==========================================================================
 * O SALDO NAO PODE SER ESCRITO POR QUEM O GASTA.
 *
 * `authenticated` tinha UPDATE na tabela inteira de user_profiles. A RLS limita
 * a LINHA — cada um so mexe na propria — mas nao limita a COLUNA. Dentro da
 * propria linha estava `wallet`, `gold`, `is_premium` e `role`.
 *
 * Enquanto isso valesse, tudo o que se fizesse na loja era decoracao: nao
 * adianta o servidor decidir o preco se da para escrever o saldo direto.
 * ========================================================================== */

// ---------------------------------------------------------------------------
// 1. AS NOVE QUE NAO PODEM.
// ---------------------------------------------------------------------------

const BLOQUEADAS = [
  'wallet', 'gold', 'fragments',
  'is_premium', 'premium_expires_at', 'subscription_tier',
  'role', 'created_at', 'updated_at',
];

// A migracao concede coluna a coluna. Uma bloqueada aparecer na lista de
// concessao e exatamente o erro que isto existe para pegar.
const listaConcedida = trava.slice(trava.indexOf('grant update ('), trava.indexOf(') on table'));

for (const coluna of BLOQUEADAS) {
  assert.ok(
    !new RegExp(`(^|[\s,(])${coluna}\s*(,|$)`, 'm').test(listaConcedida),
    `${coluna} voltou para a lista de colunas gravaveis pelo cliente`,
  );
}

// ---------------------------------------------------------------------------
// 2. RECORTAR COLUNA EXIGE DERRUBAR O PRIVILEGIO DE TABELA ANTES.
// ---------------------------------------------------------------------------

// `revoke update (coluna)` nao tira nada enquanto o UPDATE da tabela inteira
// estiver de pe. Sem esta linha, a concessao abaixo nao muda coisa alguma e a
// migracao passa a mentir em silencio.
assert.match(
  trava,
  /revoke update on table public\.user_profiles from authenticated;/,
  'sem derrubar o UPDATE de tabela, o recorte por coluna nao vale nada',
);

assert.ok(
  trava.indexOf('revoke update on table') < trava.indexOf('grant update ('),
  'o revoke tem de vir antes do grant, senao ele apaga a concessao recem-feita',
);

// ---------------------------------------------------------------------------
// 3. O SALDO SAO DUAS COLUNAS, E VALE A MAIOR.
// ---------------------------------------------------------------------------

/*
 * Esta e a razao de `gold` estar na lista junto de `wallet`. Se algum dia o
 * app parar de usar o maximo entre as duas, a lista muda — e quem mexer nisto
 * precisa ser avisado aqui, e nao descobrir por um saldo inventado.
 */
assert.match(
  contexto,
  /const resolvedGoldSources = \[walletGold, columnGold\]/,
  'o saldo deixou de sair de wallet + coluna gold; reavalie quais colunas trancar',
);
assert.match(
  contexto,
  /gold: resolvedGoldSources\.length > 0 \? Math\.max\(\.\.\.resolvedGoldSources\)/,
  'o saldo deixou de ser o MAIOR entre as duas fontes; reavalie a lista de colunas',
);

// ---------------------------------------------------------------------------
// 4. A CHAVE PUBLICA NAO ESCREVE PERFIL.
// ---------------------------------------------------------------------------

assert.match(
  portaDeTras,
  /revoke all on table public\.user_profiles from anon;/,
  'anon voltou a ter privilegio de escrita em user_profiles',
);

// TRUNCATE nao passa por RLS: ele apaga a tabela toda sem consultar politica.
assert.match(
  portaDeTras,
  /revoke truncate, trigger, references on table public\.user_profiles from authenticated;/,
  'truncate/trigger/references voltaram para o authenticated',
);

console.log('[ok] o perfil nao se escreve a mao');
