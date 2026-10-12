import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

/**
 * MISSAO DE CLA NO BANCO (12/10/2026). Desenho:
 * docs/superpowers/specs/2026-10-12-missao-de-cla-design.md
 *
 * O total sai das tarefas concluidas de quem entrou, contadas pelo MOMENTO da
 * conclusao (completed_at) dentro da participacao; desmarcar baixa. So recebe
 * quem esta dentro, uma vez, com a meta batida. Outro cla nao enxerga.
 *
 * "Se depositou, ja era" (Afonso, 12/10): quem sai do cla (ou abandona a
 * missao) deixa o que fez no grupo; nada vai junto para o cla novo.
 */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8');
const db = await PGlite.create();
await db.exec(ler('scripts/sql-andaime.sql'));
// auth.uid() como o do Supabase: le o sub das claims da sessao.
await db.exec(`create or replace function auth.uid() returns uuid language sql stable as $f$
  select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid $f$;`);
// Dubles dos marcadores e do bau (moram em migracoes antigas).
await db.exec(`
  create table if not exists public._marcas (u uuid, t text, r text);
  create table if not exists public._baus (u uuid, tipo text);
  create or replace function public._starter_reward_has_purchase_marker(p_u uuid, p_t text, p_r text)
    returns boolean language sql stable as $$ select exists(select 1 from public._marcas where u = p_u and t = p_t and r = p_r) $$;
  create or replace function public._starter_reward_mark_purchase(p_u uuid, p_t text, p_r text, p_x boolean)
    returns void language sql as $$ insert into public._marcas values (p_u, p_t, p_r) $$;
  create or replace function public.grant_chest(p_u uuid, p_tipo text)
    returns void language sql as $$ insert into public._baus values (p_u, p_tipo) $$;
`);
await db.exec(ler('supabase/migrations/20261012200000_missao_de_cla.sql'));

const A = '00000000-0000-0000-0000-00000000000a', B = '00000000-0000-0000-0000-00000000000b';
const C = '00000000-0000-0000-0000-00000000000c', D = '00000000-0000-0000-0000-00000000000d';
const E = '00000000-0000-0000-0000-00000000000e';
const X = '00000000-0000-0000-0000-0000000000f1', Y = '00000000-0000-0000-0000-0000000000f2';
const acao = (u) => u.replace(/0000000000(.)$/, '00000000ac$1');
const Q = 'clan-genesis-socializar';
await db.exec(`
  insert into auth.users (id) values ('${A}'), ('${B}'), ('${C}'), ('${D}'), ('${E}');
  insert into public.user_profiles (id, nickname, mood) values ('${A}', 'Ana', 80), ('${B}', 'Beto', 50), ('${C}', 'Caio', 30), ('${D}', 'Duda', 55), ('${E}', 'Eva', 60);
  insert into public.mood_entries (user_id, value) values ('${A}', 80), ('${D}', 55), ('${C}', 30);
  insert into public.clan_members (user_id, clan_id) values ('${A}', '${X}'), ('${B}', '${X}'), ('${D}', '${X}'), ('${E}', '${X}'), ('${C}', '${Y}');
  insert into public.actions (id, user_id, name) values ('${acao(A)}', '${A}', 'Socializar'), ('${acao(B)}', '${B}', 'Socializar'), ('${acao(C)}', '${C}', 'Socializar'), ('${acao(E)}', '${E}', 'Socializar');
  update public.clan_quests set goal = 3 where id = '${Q}';
`);
const como = async (u, sql) => {
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ sub: u, role: 'authenticated' })]);
  return db.query(sql);
};
const rpc = async (u, sql) => (await como(u, sql)).rows[0];
const falha = async (u, sql, codigo) => {
  await assert.rejects(como(u, sql), (e) => String(e.message).includes(codigo), `devia recusar com ${codigo}`);
};
const status = async (u) => (await rpc(u, `select public.status_da_missao_de_cla('${Q}') as s`)).s;
const hoje = (await db.query(`select (now() at time zone 'America/Sao_Paulo')::date::text as d`)).rows[0].d;
// Concluida AGORA: o que conta e o momento da conclusao.
const tarefa = (id, u, feita) => `insert into public.scheduled_tasks (id, user_id, action_id, date, completed, completed_at) values ('${id}', '${u}', '${acao(u)}', '${hoje}', ${feita}, ${feita ? 'clock_timestamp()' : 'null'})`;

// 1. entrar
await falha(A, `select public.entrar_na_missao_de_cla('${Q}', '${acao(C)}')`, 'ACAO_INVALIDA');
let s = (await rpc(A, `select public.entrar_na_missao_de_cla('${Q}', '${acao(A)}') as s`)).s;
assert.equal(s.joined, true); assert.equal(s.total, 0); assert.equal(s.goal, 3);
assert.equal(s.my_action_id, acao(A), 'o status nao diz qual e a minha acao da missao');
await rpc(A, `select public.entrar_na_missao_de_cla('${Q}', '${acao(A)}') as s`); // idempotente
assert.equal((await db.query(`select count(*)::int n from public.clan_quest_participants`)).rows[0].n, 1);
console.log('ok - entrar grava uma vez, so com acao propria, e o status diz qual e a minha acao');

// 2. contar: so quem entrou, so o que concluiu depois de entrar, e desmarcar baixa
await db.exec(`${tarefa('t0', B, true)}`); // Beto concluiu ANTES de entrar
await db.exec(`${tarefa('t1', A, true)}; ${tarefa('t2', A, true)};`);
s = await status(A);
assert.equal(s.total, 2, 'tarefa de quem nao entrou contou');
await rpc(B, `select public.entrar_na_missao_de_cla('${Q}', '${acao(B)}')`);
assert.equal((await status(A)).total, 2, 'o que Beto concluiu antes de entrar foi depositado');
await db.exec(`${tarefa('t3', B, true)}`);
s = await status(A);
assert.equal(s.total, 3);
assert.deepEqual(s.members.map((m) => [m.nickname, m.done, m.active]), [['Ana', 2, true], ['Beto', 1, true]]);
await db.exec(`update public.scheduled_tasks set completed = false where id = 't2'`);
assert.equal((await status(A)).total, 2, 'desmarcar nao baixou o total');
await db.exec(`update public.scheduled_tasks set completed = true, completed_at = clock_timestamp() where id = 't2'`);
console.log('ok - conta so o que quem entrou concluiu depois de entrar, e desmarcar baixa');

// 3. outro cla nao enxerga
s = await status(C);
assert.equal(s.total, 0); assert.deepEqual(s.members, []); assert.equal(s.joined, false);
console.log('ok - outro cla nao ve a lista nem o total');

// 4. receber
await falha(D, `select public.receber_premio_da_missao_de_cla('${Q}')`, 'NAO_ENTROU');
let r = (await rpc(A, `select public.receber_premio_da_missao_de_cla('${Q}') as r`)).r;
assert.equal(r.already_claimed, false); assert.equal(r.chest_type, 'Raro');
r = (await rpc(A, `select public.receber_premio_da_missao_de_cla('${Q}') as r`)).r;
assert.equal(r.already_claimed, true);
assert.equal((await db.query(`select count(*)::int n from public._baus where u = '${A}'`)).rows[0].n, 1, 'pagou duas vezes');
assert.equal((await status(A)).claimed, true);
console.log('ok - so quem entrou recebe, uma vez, com a meta batida');

// 5. "se depositou, ja era": quem sai do cla deixa o que fez, e nao leva nada
await db.exec(`delete from public.clan_members where user_id = '${B}'`);
s = await status(A);
assert.equal(s.total, 3, 'o que Beto depositou saiu junto com ele');
assert.deepEqual(s.members.find((m) => m.nickname === 'Beto'), { user_id: B, nickname: 'Beto', done: 1, active: false });
await falha(B, `select public.receber_premio_da_missao_de_cla('${Q}')`, 'SAIU_DO_CLA');
await db.exec(`${tarefa('t4', B, true)}`); // ja fora do cla
assert.equal((await status(A)).total, 3, 'o que Beto fez depois de sair contou para o cla antigo');
// Eva leva a mesma acao para outro cla: no novo comeca do zero
await rpc(E, `select public.entrar_na_missao_de_cla('${Q}', '${acao(E)}')`);
await db.exec(`${tarefa('t5', E, true)}; ${tarefa('t6', E, true)};`);
assert.equal((await status(A)).total, 5);
await db.exec(`delete from public.clan_members where user_id = '${E}'; insert into public.clan_members (user_id, clan_id) values ('${E}', '${Y}');`);
await rpc(E, `select public.entrar_na_missao_de_cla('${Q}', '${acao(E)}')`);
assert.equal((await status(E)).total, 0, 'Eva levou para o cla novo o que fez no antigo');
assert.equal((await status(A)).total, 5, 'o cla antigo perdeu o que Eva depositou');
await db.exec(`${tarefa('t7', E, true)}`);
assert.equal((await status(E)).total, 1);
assert.equal((await status(A)).total, 5);
console.log('ok - quem sai deixa o deposito no cla antigo e comeca do zero no novo');

// 6. abandonar a missao: o deposito fica, e nao recebe
await db.exec(`insert into public.clan_members (user_id, clan_id) values ('${B}', '${X}')`);
await falha(B, `select public.receber_premio_da_missao_de_cla('${Q}')`, 'NAO_ENTROU');
await rpc(B, `select public.entrar_na_missao_de_cla('${Q}', '${acao(B)}')`);
s = await status(B);
assert.equal(s.joined, true, 'voltar ao cla e entrar de novo nao reativou');
await rpc(B, `select public.sair_da_missao_de_cla('${Q}')`);
s = await status(B);
assert.equal(s.joined, false);
assert.equal(s.my_action_id, acao(B), 'a acao da participacao some e entrar de novo criaria outra arena');
assert.equal(s.members.find((m) => m.nickname === 'Beto').active, false);
assert.equal(s.total, 5, 'abandonar tirou o deposito do grupo');
await falha(B, `select public.receber_premio_da_missao_de_cla('${Q}')`, 'NAO_ENTROU');
await db.exec(`update public.clan_quests set goal = 50 where id = '${Q}'`);
await rpc(B, `select public.entrar_na_missao_de_cla('${Q}', '${acao(B)}')`);
await falha(B, `select public.receber_premio_da_missao_de_cla('${Q}')`, 'META_NAO_BATIDA');
console.log('ok - abandonar deixa o deposito e tira o direito ao bau; entrar de novo reativa');

// 7. vencida nao aceita entrada
await db.exec(`update public.clan_quests set ends_on = current_date - 2 where id = '${Q}'`);
await falha(D, `select public.entrar_na_missao_de_cla('${Q}', '${acao(A)}')`, 'MISSAO_VENCIDA');
assert.equal((await status(A)).expired, true);
console.log('ok - vencida nao aceita entrada e o status diz vencida');

// 8. humor so do proprio cla; quem nunca registrou vem sem dados
const humor = (await como(A, `select user_id::text, mood, registrado from public.humor_do_meu_cla() order by user_id`)).rows;
assert.deepEqual(humor.map((h) => [h.user_id, h.registrado ? h.mood : null]), [[A, 80], [B, null], [D, 55]],
  'humor vazou de outro cla, ou o padrao 50 apareceu como humor de quem nunca registrou');
console.log('ok - humor so do proprio cla; quem nunca registrou vem sem dados');

// 9. ninguem escreve direto nas tabelas
const sql = ler('supabase/migrations/20261012200000_missao_de_cla.sql');
assert.match(sql, /revoke all on public\.clan_quest_participants from anon, authenticated/);
assert.match(sql, /revoke all on public\.clan_quests from anon, authenticated;\s*grant select on public\.clan_quests to authenticated;/, 'a tabela de missoes ficou com mais permissao que leitura');
assert.match(sql, /'clan-genesis-socializar', 'season-genesis-0', 20, date '2026-12-31', 'Raro'/);
assert.doesNotMatch(sql, /'Season'/, 'missao de cla nao paga bau de temporada');
console.log('Missao de cla no banco: conta o concluido, paga quem esta dentro, o deposito fica no cla.');
