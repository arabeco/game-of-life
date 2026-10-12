import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * CONVIDE UM AMIGO (10/10/2026), como o Afonso decidiu:
 *   - o codigo de cada um fica no modal de cupom, com copiar e enviar;
 *   - o amigo digita no MESMO campo de cupom e ganha 10 de ouro, e os dois viram amigos;
 *   - quem convidou conta o amigo assim que o código é vinculado;
 *   - bolinha no 1 (baú Comum), no 5 (bau Raro) e no 10 (25 de ouro) — "50 e muito, 100 e absurdo";
 *   - travas: so conta nova (7 dias), nao vale o proprio codigo, um convite por conta.
 */

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const migracao = ler('supabase/migrations/20261010150000_convite_de_amigo.sql');
const convites = ler('utils/convites.ts');
const contexto = ler('contexts/GameContext.tsx');
const ajustes = ler('views/SettingsView.tsx');
const bloco = ler('components/ConviteDeAmigo.tsx');

// ============================== 1. o servidor: travas e premios
const usar = migracao.slice(migracao.indexOf('function public.usar_codigo_de_convite'), migracao.indexOf('function public.meus_convites'));
assert.match(usar, /'OWN_CODE'/, 'o proprio codigo voltou a valer');
assert.match(usar, /'INVITE_ALREADY_USED'/, 'uma conta voltou a poder usar mais de um convite');
assert.match(usar, /v_criada_em < now\(\) - interval '7 days'/, 'convite deixou de ser so para conta nova');
assert.match(usar, /_starter_reward_credit_gold\(\s*v_user_id, 10,/, 'o amigo deixou de ganhar 10 de ouro');
assert.match(usar, /insert into public\.friends \(user_id, friend_id\)[\s\S]*insert into public\.friends \(user_id, friend_id\)/,
  'o convite deixou de criar a amizade nos dois sentidos');
const atual = ler('supabase/migrations/20261011120000_convites_imediatos.sql');
assert.doesNotMatch(atual, /public\.dias_no_app/, 'convite conta sem esperar dias');
const receber = atual.slice(atual.indexOf('function public.receber_premio_de_convite'));
assert.match(receber, /p_marco not in \(1, 5, 10\)/);
assert.match(receber, /grant_chest\(v_user_id, 'Comum'\)/);
assert.match(receber, /grant_chest\(v_user_id, 'Raro'\)/);
assert.match(receber, /_starter_reward_credit_gold\(\s*v_user_id, 25,/, 'a bolinha do 10 deixou de ser 25 de ouro');
assert.match(receber, /_starter_reward_has_purchase_marker\(v_user_id, 'invite_milestone', p_marco::text\)/,
  'a bolinha pode ser recebida duas vezes');
assert.match(migracao, /lower\(rc\.code\) = lower\(v_codigo\)/, 'um codigo de convite pode coincidir com um cupom');
for (const tabela of ['convites', 'convites_usados']) {
  assert.match(migracao, new RegExp(`revoke insert, update, delete on public\\.${tabela} from anon, authenticated`),
    `a tabela ${tabela} voltou a aceitar escrita direta do cliente`);
}
console.log('ok - o servidor trava conta velha, o proprio codigo e o segundo convite, e paga bau Raro no 5 e 25 de ouro no 10');

// ============================== 2. o campo de cupom serve aos dois
assert.match(ajustes, /if \(result\.error === 'CODE_NOT_FOUND'\) \{\s*const convite = await usarCodigoDeConvite\(code\);/,
  'o campo de cupom deixou de tentar o convite quando o cupom nao existe');
assert.match(ajustes, /throw new Error\(mensagemDoErroDeCodigo\(result\.error\)\);/,
  'o modal voltou a mostrar o erro cru do servidor');
assert.match(ajustes, /<ConviteDeAmigo onReward=\{onReward\} \/>\s*<\/GlassCard>/, 'o bloco do convite saiu de baixo do campo de cupom');
assert.match(convites, /case 'CODE_NOT_FOUND': return 'Código não encontrado\.';/);
assert.match(convites, /case 'ACCOUNT_TOO_OLD':/);
console.log('ok - o cupom que nao existe vira tentativa de convite, e o erro aparece em portugues');

// ============================== 3. o bloco: codigo, enviar, barrinha
assert.match(convites, /export const MARCOS_DE_CONVITE = \[1, 5, 10\] as const;/);
assert.match(convites, /play\.google\.com\/store\/apps\/details\?id=life\.glyph\.app&referrer=/,
  'o link do convite deixou de levar o codigo para a Play Store');
assert.match(convites, /Meu código de convite: \$\{codigo\}/, 'a mensagem deixou de trazer o codigo escrito');
assert.match(bloco, /Copiar/);
assert.match(bloco, /compartilharConvite\(convites\.codigo\)/);
assert.match(bloco, /if \(!convites\) return null;/, 'sem a migracao, o bloco tem de sumir em vez de quebrar');
assert.match(contexto, /supabase\.rpc\('receber_premio_de_convite', \{ p_marco: marco \}\)/);
console.log('ok - o bloco mostra o codigo com copiar e enviar, e a barrinha com as três bolinhas');

console.log('Convite de amigo: um campo so, travas no servidor, bau Raro no 5 e 25 de ouro no 10.');
