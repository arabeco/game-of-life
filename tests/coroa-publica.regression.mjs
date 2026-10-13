import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

/**
 * A COROA DE QUEM ASSINA, VISTA PELOS OUTROS (13/10/2026).
 *
 * O cartao publico de cada jogador nao diz se ele assina, entao a coroa so
 * aparecia no proprio perfil. coroas_de(ids) devolve QUAIS daqueles ids tem
 * assinatura ativa — so isso: nem plano, nem data de vencimento.
 */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const db = await PGlite.create();
await db.exec(ler('scripts/sql-andaime.sql'));
await db.exec(`create or replace function auth.uid() returns uuid language sql stable as $f$
  select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid $f$;`);
const A = '00000000-0000-0000-0000-00000000000a', B = '00000000-0000-0000-0000-00000000000b';
const C = '00000000-0000-0000-0000-00000000000c', D = '00000000-0000-0000-0000-00000000000d';
await db.exec(`insert into public.user_profiles (id, nickname, is_premium, premium_expires_at, subscription_tier, role) values
  ('${A}', 'Assina', true, now() + interval '10 days', 'platinum', 'player'),
  ('${B}', 'Venceu', true, now() - interval '1 day', 'premium', 'player'),
  ('${C}', 'Gratis', false, null, null, 'player'),
  ('${D}', 'Staff', false, null, null, 'gm')`);
await db.exec(ler('supabase/migrations/20261013100000_coroa_publica.sql'));
await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ sub: C })]);
const { rows } = await db.query(`select public.coroas_de(array['${A}','${B}','${C}','${D}']::uuid[]) as ids`);
assert.deepEqual(rows[0].ids, [A], 'so quem tem assinatura ATIVA tem coroa (staff nao conta)');
await db.query(`select set_config('request.jwt.claims', '', false)`);
await assert.rejects(db.query(`select public.coroas_de(array['${A}']::uuid[])`), /AUTH_REQUIRED/);
console.log('ok - coroas_de devolve so quem assina, e so para quem esta logado');

const card = ler('components/SocialCard.tsx');
assert.match(card, /coroa\?: boolean/, 'o mini card nao recebe a coroa');
assert.match(card, /CrownIcon/, 'o mini card nao desenha a coroa');
assert.match(card, /useCoroa\(/, 'o mini card nao pergunta ao servidor quem tem coroa');
assert.match(ler('views/ProfileView.tsx'), /coroaDoOutro/, 'o perfil dos outros nao mostra a coroa');
assert.match(ler('utils/coroas.ts'), /rpc\('coroas_de'/);
console.log('Coroa: aparece no mini card de quem assina.');
