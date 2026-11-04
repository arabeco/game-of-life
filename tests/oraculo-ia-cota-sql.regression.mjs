// A cota do Oraculo com IA num Postgres local de verdade (PGlite), contas sinteticas.
// Desde 04/11/2026 a cota e de MENSAGENS: 3, 15 e 45 por dia, sem janela.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
await db.exec(`
create role authenticated; create role anon; create role service_role;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
create table auth.users(id uuid primary key);
create table user_profiles(id uuid primary key, role text, is_premium boolean default false, premium_expires_at timestamptz, subscription_tier text);
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003'),('00000000-0000-0000-0000-000000000004');
insert into user_profiles values
 ('00000000-0000-0000-0000-000000000001', null, false, null, null),
 ('00000000-0000-0000-0000-000000000002', null, true, now() + interval '10 days', 'premium'),
 ('00000000-0000-0000-0000-000000000003', null, true, now() + interval '10 days', 'platinum'),
 ('00000000-0000-0000-0000-000000000004', null, true, now() - interval '1 day', 'platinum');
`);
const migracao = (nome) => readFileSync(new URL(`../supabase/migrations/${nome}`, import.meta.url), 'utf8');
await db.exec(migracao('20261102120000_oraculo_ia.sql'));
await db.exec(migracao('20261102130000_oraculo_ia_conversas.sql'));
await db.exec(migracao('20261104120000_oraculo_ia_mensagens.sql'));

const [GRATIS, PREMIUM, PLATINUM, VENCIDO] = [1, 2, 3, 4].map((n) => `00000000-0000-0000-0000-00000000000${n}`);
const reservar = async (id) => (await db.query('select public.oraculo_ia_reservar($1) as r', [id])).rows[0].r;
const devolver = (id) => db.query('select public.oraculo_ia_devolver($1)', [id]);
const limite = async (id) => (await db.query('select public.oraculo_ia_limite($1) as l', [id])).rows[0].l;
const restantes = async (id) => {
  await db.exec(`select set_config('request.uid', '${id}', false)`);
  return (await db.query('select public.oraculo_ia_restantes() as r')).rows[0].r;
};

assert.equal(await limite(GRATIS), 3, 'gratis: 3 mensagens por dia');
assert.equal(await limite(PREMIUM), 15, 'Premium: 15 mensagens');
assert.equal(await limite(PLATINUM), 45, 'Platinum: 45 mensagens');
assert.equal(await limite(VENCIDO), 3, 'plano vencido volta a ser gratis');

// O gratis: 3 mensagens, e para.
assert.equal((await restantes(GRATIS)).mensagens, 3, 'comeca o dia com 3');
let r = await reservar(GRATIS);
assert.deepEqual([r.ok, r.usadas, r.limite, r.mensagens], [true, 1, 3, 2]);
r = await reservar(GRATIS);
assert.equal(r.mensagens, 1, 'o numero que o app mostra depois da resposta');
assert.equal((await restantes(GRATIS)).mensagens, 1);

// A IA falhou: devolve a mensagem.
await devolver(GRATIS);
assert.equal((await restantes(GRATIS)).mensagens, 2, 'mensagem nao entregue volta');
await reservar(GRATIS);
r = await reservar(GRATIS);
assert.deepEqual([r.ok, r.mensagens], [true, 0], 'a terceira ainda passa, e e a ultima');
r = await reservar(GRATIS);
assert.deepEqual([r.ok, r.usadas, r.limite, r.mensagens], [false, 3, 3, 0], 'a quarta nao');
assert.equal((await restantes(GRATIS)).mensagens, 0);

// Nao ha janela: ficar parado nao perde nada.
assert.equal((await db.query("select to_regclass('public.oraculo_ia_conversa') as t")).rows[0].t, null, 'a conversa nao existe mais');
for (let i = 0; i < 15; i += 1) assert.equal((await reservar(PREMIUM)).ok, true);
assert.equal((await reservar(PREMIUM)).ok, false, 'Premium para na 15');

console.log('Oraculo com IA: 3, 15 e 45 mensagens por dia, so conta o que foi entregue.');
