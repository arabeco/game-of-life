import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

/**
 * MISSAO DE CLA NO BANCO (12/10/2026). Desenho:
 * docs/superpowers/specs/2026-10-12-missao-de-cla-design.md
 * O total sai das tarefas marcadas de quem entrou; desmarcar baixa; so recebe
 * quem entrou, uma vez, com a meta batida; outro cla nao enxerga.
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
const X = '00000000-0000-0000-0000-0000000000f1', Y = '00000000-0000-0000-0000-0000000000f2';
const acao = (u) => u.replace(/0000000000(.)$/, '00000000ac$1');
const Q = 'clan-genesis-socializar';
await db.exec(`
  insert into auth.users (id) values ('${A}'), ('${B}'), ('${C}'), ('${D}');
  insert into public.user_profiles (id, nickname, mood) values ('${A}', 'Ana', 80), ('${B}', 'Beto', null), ('${C}', 'Caio', 30), ('${D}', 'Duda', 55);
  insert into public.clan_members (user_id, clan_id) values ('${A}', '${X}'), ('${B}', '${X}'), ('${D}', '${X}'), ('${C}', '${Y}');
  insert into public.actions (id, user_id, name) values ('${acao(A)}', '${A}', 'Socializar'), ('${acao(B)}', '${B}', 'Socializar'), ('${acao(C)}', '${C}', 'Socializar');
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
const hoje = (await db.query(`select (now() at time zone 'America/Sao_Paulo')::date::text as d`)).rows[0].d;
const tarefa = (id, u, feita) => `insert into public.scheduled_tasks (id, user_id, action_id, date, completed) values ('${id}', '${u}', '${acao(u)}', '${hoje}', ${feita})`;

// 1. entrar
await falha(A, `select public.entrar_na_missao_de_cla('${Q}', '${acao(C)}')`, 'ACAO_INVALIDA');
let s = (await rpc(A, `select public.entrar_na_missao_de_cla('${Q}', '${acao(A)}') as s`)).s;
assert.equal(s.joined, true); assert.equal(s.total, 0); assert.equal(s.goal, 3);
await rpc(A, `select public.entrar_na_missao_de_cla('${Q}', '${acao(A)}') as s`); // idempotente
assert.equal((await db.query(`select count(*)::int n from public.clan_quest_participants`)).rows[0].n, 1);
console.log('ok - entrar grava uma vez, so com acao propria');

// 2. contar: so quem entrou, e desmarcar baixa
await db.exec(`${tarefa('t1', A, true)}; ${tarefa('t2', A, true)}; ${tarefa('t3', B, true)};`);
s = (await rpc(A, `select public.status_da_missao_de_cla('${Q}') as s`)).s;
assert.equal(s.total, 2, 'tarefa de quem nao entrou contou');
await rpc(B, `select public.entrar_na_missao_de_cla('${Q}', '${acao(B)}')`);
s = (await rpc(A, `select public.status_da_missao_de_cla('${Q}') as s`)).s;
assert.equal(s.total, 3);
assert.deepEqual(s.members.map((m) => [m.nickname, m.done]), [['Ana', 2], ['Beto', 1]]);
await db.exec(`update public.scheduled_tasks set completed = false where id = 't2'`);
s = (await rpc(A, `select public.status_da_missao_de_cla('${Q}') as s`)).s;
assert.equal(s.total, 2, 'desmarcar nao baixou o total');
await db.exec(`update public.scheduled_tasks set completed = true where id = 't2'`);
console.log('ok - o total e o que esta marcado agora, de quem entrou');

// 3. outro cla nao enxerga
s = (await rpc(C, `select public.status_da_missao_de_cla('${Q}') as s`)).s;
assert.equal(s.total, 0); assert.deepEqual(s.members, []); assert.equal(s.joined, false);
console.log('ok - outro cla nao ve a lista nem o total');

// 4. receber
await falha(D, `select public.receber_premio_da_missao_de_cla('${Q}')`, 'NAO_ENTROU');
let r = (await rpc(A, `select public.receber_premio_da_missao_de_cla('${Q}') as r`)).r;
assert.equal(r.already_claimed, false); assert.equal(r.chest_type, 'Raro');
r = (await rpc(A, `select public.receber_premio_da_missao_de_cla('${Q}') as r`)).r;
assert.equal(r.already_claimed, true);
assert.equal((await db.query(`select count(*)::int n from public._baus where u = '${A}'`)).rows[0].n, 1, 'pagou duas vezes');
s = (await rpc(A, `select public.status_da_missao_de_cla('${Q}') as s`)).s;
assert.equal(s.claimed, true);
await db.exec(`delete from public.clan_members where user_id = '${B}'`);
await falha(B, `select public.receber_premio_da_missao_de_cla('${Q}')`, 'SAIU_DO_CLA');
s = (await rpc(A, `select public.status_da_missao_de_cla('${Q}') as s`)).s;
assert.equal(s.total, 2, 'quem saiu do cla continuou contando');
await db.exec(`insert into public.clan_members (user_id, clan_id) values ('${B}', '${X}')`);
await db.exec(`update public.clan_quests set goal = 50 where id = '${Q}'`);
await falha(B, `select public.receber_premio_da_missao_de_cla('${Q}')`, 'META_NAO_BATIDA');
console.log('ok - so quem entrou recebe, uma vez, com a meta batida e ainda no cla');

// 5. vencida nao aceita entrada
await db.exec(`update public.clan_quests set ends_on = current_date - 2 where id = '${Q}'`);
await falha(D, `select public.entrar_na_missao_de_cla('${Q}', '${acao(A)}')`, 'MISSAO_VENCIDA');
s = (await rpc(A, `select public.status_da_missao_de_cla('${Q}') as s`)).s;
assert.equal(s.expired, true);
console.log('ok - vencida nao aceita entrada e o status diz vencida');

// 6. humor so do proprio cla, sem nulos
const humor = (await como(A, `select user_id::text, mood from public.humor_do_meu_cla() order by mood`)).rows;
assert.deepEqual(humor.map((h) => h.mood), [55, 80], 'humor vazou de outro cla ou trouxe nulo');
console.log('ok - humor so do proprio cla, e quem nao registrou nao aparece');

// 7. ninguem escreve direto nas tabelas
const sql = ler('supabase/migrations/20261012200000_missao_de_cla.sql');
assert.match(sql, /revoke all on public\.clan_quest_participants from anon, authenticated/);
assert.match(sql, /'clan-genesis-socializar', 'season-genesis-0', 20, date '2026-12-31', 'Raro'/);
assert.doesNotMatch(sql, /'Season'/, 'missao de cla nao paga bau de temporada');
console.log('Missao de cla no banco: conta o marcado, paga quem entrou, isola o cla.');
