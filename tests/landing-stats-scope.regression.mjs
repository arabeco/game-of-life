import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const db = new PGlite();
try {
  await db.exec(`
    create role anon; create role authenticated;
    create table public.user_profiles(id int primary key, role text, level int, nobility jsonb);
    create table public.arenas(user_id int);
    create table public.scheduled_tasks(user_id int, completed boolean);
    insert into user_profiles values
      (1,'gm',39,'{"exp":26002}'), (2,'gm',37,'{"exp":625}'),
      (3,'user',5,'{"exp":150}'), (4,'user',5,'{"exp":75}'), (5,'user',5,'{}'),
      (6,'other',50,'{"exp":999999}');
    insert into arenas select 1 from generate_series(1,32);
    insert into arenas select 3 from generate_series(1,6);
    insert into arenas values(6),(999);
    insert into scheduled_tasks select 1,true from generate_series(1,332);
    insert into scheduled_tasks select 3,true from generate_series(1,4);
    insert into scheduled_tasks values(1,false),(3,null),(6,true),(999,true);
  `);
  const migration = readFileSync(new URL('../supabase/migrations/20261012160000_landing_stats_include_gm.sql', import.meta.url),'utf8');
  await db.exec(migration);
  await db.exec(migration);
  await db.exec('set role anon');
  const {rows} = await db.query('select public.get_landing_stats_v2() as totals');
  assert.deepEqual(rows[0].totals, {
    pessoas_no_mundo:5, arenas_criadas:38, acoes_completadas:336,
    maestria_total:182, niveis_somados:91, experiencia_acumulada:26852,
  });
  await assert.rejects(() => db.query('select * from public.user_profiles'), /permission denied/);
  await db.exec('reset role; update public.user_profiles set level=37 where id=1;');
  assert.equal((await db.query('select public.get_landing_stats_v2() as totals')).rows[0].totals.maestria_total,178);
  await db.exec('update public.user_profiles set level=500 where id=1; update public.user_profiles set level=-5 where id=2;');
  assert.equal((await db.query('select public.get_landing_stats_v2() as totals')).rows[0].totals.maestria_total,130);
  console.log('PASS: user + gm, sem tarefas incompletas/órfãs, escala preservada, agregado público sem acesso aos perfis, migração repetível.');
} finally { await db.close(); }
