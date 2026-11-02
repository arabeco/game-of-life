// A cota do Oraculo com IA num Postgres local de verdade (PGlite), contas sinteticas.
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
await db.exec(readFileSync(new URL('../supabase/migrations/20261102120000_oraculo_ia.sql', import.meta.url), 'utf8'));

const [GRATIS, PREMIUM, PLATINUM, VENCIDO] = [1, 2, 3, 4].map((n) => `00000000-0000-0000-0000-00000000000${n}`);
const reservar = async (id) => (await db.query('select public.oraculo_ia_reservar($1) as r', [id])).rows[0].r;
const limite = async (id) => (await db.query('select public.oraculo_ia_limite($1) as l', [id])).rows[0].l;

assert.equal(await limite(GRATIS), 1, 'gratis: 1 por dia');
assert.equal(await limite(PREMIUM), 5, 'Premium: 5 por dia');
assert.equal(await limite(PLATINUM), 15, 'Platinum: 15 por dia');
assert.equal(await limite(VENCIDO), 1, 'plano vencido volta a ser gratis');

// O gratis faz 1 e para.
assert.deepEqual(await reservar(GRATIS), { ok: true, usadas: 1, limite: 1 });
assert.deepEqual(await reservar(GRATIS), { ok: false, usadas: 1, limite: 1 });

// Falhou a IA: devolve, e a pessoa pode perguntar de novo.
await db.query('select public.oraculo_ia_devolver($1)', [GRATIS]);
assert.equal((await reservar(GRATIS)).ok, true, 'pergunta que a IA nao entregou nao conta');

// O Premium faz 5 e para no sexto.
for (let i = 1; i <= 5; i += 1) assert.equal((await reservar(PREMIUM)).usadas, i);
assert.equal((await reservar(PREMIUM)).ok, false, 'Premium para no sexto');

// O app le o que sobrou da propria conta.
await db.exec(`select set_config('request.uid', '${PREMIUM}', false)`);
assert.deepEqual((await db.query('select public.oraculo_ia_restantes() as r')).rows[0].r, { usadas: 5, limite: 5 });

console.log('Oraculo com IA: cota 1/5/15 por dia, so conta o que foi entregue.');
