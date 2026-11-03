// A cota do Oraculo com IA num Postgres local de verdade (PGlite), contas sinteticas.
// Desde 02/11/2026 a cota e de CONVERSAS: primeira pergunta + 2 seguimentos.
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

const [GRATIS, PREMIUM, PLATINUM, VENCIDO] = [1, 2, 3, 4].map((n) => `00000000-0000-0000-0000-00000000000${n}`);
const reservar = async (id) => (await db.query('select public.oraculo_ia_reservar($1) as r', [id])).rows[0].r;
const devolver = (id, nova) => db.query('select public.oraculo_ia_devolver($1, $2)', [id, nova]);
const limite = async (id) => (await db.query('select public.oraculo_ia_limite($1) as l', [id])).rows[0].l;
const restantes = async (id) => {
  await db.exec(`select set_config('request.uid', '${id}', false)`);
  return (await db.query('select public.oraculo_ia_restantes() as r')).rows[0].r;
};

assert.equal(await limite(GRATIS), 1, 'gratis: 1 conversa por dia');
assert.equal(await limite(PREMIUM), 5, 'Premium: 5 conversas');
assert.equal(await limite(PLATINUM), 15, 'Platinum: 15 conversas');
assert.equal(await limite(VENCIDO), 1, 'plano vencido volta a ser gratis');

// O gratis: 1 conversa = 3 mensagens, e para.
assert.equal((await restantes(GRATIS)).mensagens, 3, 'gratis comeca o dia com 3 mensagens');
let r = await reservar(GRATIS);
assert.deepEqual([r.ok, r.conversa_nova, r.na_conversa], [true, true, 2], 'primeira pergunta abre a conversa');
r = await reservar(GRATIS);
assert.deepEqual([r.ok, r.conversa_nova, r.na_conversa], [true, false, 1], 'seguimento continua a conversa');
assert.equal((await restantes(GRATIS)).mensagens, 1, 'sobra 1 mensagem');

// A IA falhou no seguimento: devolve so a mensagem.
await devolver(GRATIS, false);
assert.equal((await restantes(GRATIS)).mensagens, 2, 'mensagem nao entregue volta');
assert.equal((await reservar(GRATIS)).ok, true);
assert.equal((await reservar(GRATIS)).ok, true, 'terceira mensagem da conversa');
r = await reservar(GRATIS);
assert.deepEqual([r.ok, r.usadas, r.limite], [false, 1, 1], 'quarta mensagem: acabou a conversa do dia');
assert.equal((await restantes(GRATIS)).mensagens, 0);

// Conversa parada ha mais de 20 minutos fecha: a proxima abre outra.
for (let i = 0; i < 3; i += 1) await reservar(PREMIUM);
await db.exec(`update public.oraculo_ia_conversa set ultima_em = now() - interval '25 minutes' where user_id = '${PREMIUM}'`);
r = await reservar(PREMIUM);
assert.deepEqual([r.ok, r.conversa_nova, r.usadas], [true, true, 2], 'depois de 20 minutos, conversa nova');
assert.equal((await restantes(PREMIUM)).mensagens, 2 + 3 * 3, 'Premium: 2 na aberta + 3 conversas de 3');

// A IA falhou na primeira mensagem: devolve a conversa inteira.
await devolver(PREMIUM, true);
assert.equal((await restantes(PREMIUM)).usadas, 1, 'conversa que nao entregou nada nao conta');

console.log('Oraculo com IA: conversas de 3 mensagens, 1/5/15 por dia, so conta o que foi entregue.');
