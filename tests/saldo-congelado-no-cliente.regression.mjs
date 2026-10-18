import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

/**
 * O SALDO SE CONGELA EM VEZ DE RECUSAR (18/10/2026, teste do Luigi).
 *
 * O AAB 112 cria o perfil com um upsert que manda ouro, fragmentos, carteira,
 * baus e premium. Sem UPDATE nessas colunas, o Postgres recusava a linha
 * inteira e a conta nova ficava sem perfil. A migration devolve o UPDATE e
 * congela o valor quando quem escreve e o app — o saldo continua so do servidor.
 */
const db = new PGlite();
await db.exec(`create role authenticated; create role anon;
create table public.user_profiles (id int primary key, nickname text, gold int, fragments int, wallet jsonb, chests jsonb, is_premium boolean);
revoke all on public.user_profiles from authenticated;
grant select, insert on public.user_profiles to authenticated;
grant update (nickname) on public.user_profiles to authenticated;
create function public.dar_ouro(p int) returns void language plpgsql security definer as $$
  begin update public.user_profiles set gold = coalesce(gold, 0) + p where id = 1; end $$;
grant execute on function public.dar_ouro(int) to authenticated;`);
await db.exec(readFileSync(new URL('../supabase/migrations/20261018100000_saldo_congelado_no_cliente.sql', import.meta.url), 'utf8'));
await db.exec('set role authenticated;');

const perfil = async () => (await db.query('select nickname, gold, fragments, is_premium from public.user_profiles where id = 1')).rows[0];

await db.query(`insert into public.user_profiles (id, nickname, gold, fragments, wallet, chests, is_premium)
  values (1, 'luigi', 0, 0, '{}', '[]', false)
  on conflict (id) do update set nickname = excluded.nickname, gold = excluded.gold, fragments = excluded.fragments,
    wallet = excluded.wallet, chests = excluded.chests, is_premium = excluded.is_premium`);
assert.equal((await perfil()).nickname, 'luigi', 'o upsert do 112 nao criou o perfil da conta nova');

await db.query(`update public.user_profiles set gold = 99999, fragments = 99999, is_premium = true, nickname = 'luigi2' where id = 1`);
assert.deepEqual(await perfil(), { nickname: 'luigi2', gold: 0, fragments: 0, is_premium: false }, 'o app conseguiu escrever o proprio saldo ou premium');

await db.query('select public.dar_ouro(10)');
assert.equal((await perfil()).gold, 10, 'a recompensa pelo servidor (RPC security definer) foi congelada junto');

console.log('Saldo: a conta nova ganha perfil, o app nao escreve saldo, e o servidor continua pagando.');
