// Narrow migration runner. Reads credentials locally; never prints them.
import fs from 'node:fs';
const readEnv = path => Object.fromEntries(fs.readFileSync(path, 'utf8').split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => {
    const i = line.indexOf('=');
    return [line.slice(0, i), line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
}));
const env = readEnv('.env.local');
const ref = fs.readFileSync('supabase/.temp/project-ref', 'utf8').trim();
if (!env.VITE_SUPABASE_URL.includes(`${ref}.supabase.co`)) throw new Error('Linked database differs from app database');
const mode = process.argv[2];
const migration = fs.readFileSync('supabase/migrations/20261017190000_arena_color_tones.sql', 'utf8');
let query;
if (mode === 'test') {
    query = migration.replace(/commit;\s*$/, '') + `
    do $test$
    declare
      uid uuid;
      a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
      initial integer; actual integer; target integer;
    begin
      select id into uid from auth.users order by created_at limit 1;
      if uid is null then raise exception 'No owner available for rollback test'; end if;
      select coalesce(max(next_sequence),0) into initial from public.arena_tone_counters where user_id=uid and asset_id='trabalho';
      insert into public.arenas(id,user_id,asset_id,name) values(a,uid,'trabalho','Tone test A'),(b,uid,'trabalho','Tone test B');
      select color_tone_sequence into actual from public.arenas where id=a;
      if actual <> initial then raise exception 'First allocation failed'; end if;
      select color_tone_sequence into actual from public.arenas where id=b;
      if actual <> initial+1 then raise exception 'Consecutive allocation failed'; end if;
      update public.arenas set name='Tone test renamed', "order"=90, is_archived=true, color_tone_sequence=9000 where id=a;
      insert into public.arenas(id,user_id,asset_id,name) values(a,uid,'trabalho','Tone test upsert')
        on conflict(id) do update set name=excluded.name;
      select color_tone_sequence into actual from public.arenas where id=a;
      if actual <> initial then raise exception 'Edit/upsert changed tone'; end if;
      select next_sequence into actual from public.arena_tone_counters where user_id=uid and asset_id='trabalho';
      if actual <> initial+2 then raise exception 'Upsert consumed slot'; end if;
      delete from public.arenas where id=b;
      insert into public.arenas(id,user_id,asset_id,name) values(c,uid,'trabalho','Tone test C');
      select color_tone_sequence into actual from public.arenas where id=c;
      if actual <> initial+2 then raise exception 'Delete rewound sequence'; end if;
      select coalesce(max(next_sequence),0) into target from public.arena_tone_counters where user_id=uid and asset_id='proposito';
      insert into public.arenas(id,user_id,asset_id,name) values(a,uid,'proposito','Tone test move')
        on conflict(id) do update set asset_id=excluded.asset_id;
      select color_tone_sequence into actual from public.arenas where id=a;
      if actual <> target then raise exception 'Move allocation failed'; end if;
      select next_sequence into actual from public.arena_tone_counters where user_id=uid and asset_id='proposito';
      if actual <> target+1 then raise exception 'Move allocated twice'; end if;
      if exists(select 1 from public.arenas where user_id is not null and public.arena_tone_area(asset_id,name) is not null and color_tone_sequence is null) then raise exception 'Legacy arena missing tone'; end if;
    end $test$;
    rollback;
    select 'passed; all test writes rolled back' as result;`;
} else if (mode === 'apply') {
    query = migration;
} else if (mode === 'verify') {
    query = `select count(*) as total_arenas,
      count(*) filter(where public.arena_tone_area(asset_id,name) is not null and user_id is not null) as eligible,
      count(*) filter(where public.arena_tone_area(asset_id,name) is not null and user_id is not null and color_tone_sequence is null) as missing_tones,
      (select count(*) from public.arena_tone_counters) as counters,
      (select count(*) from pg_trigger where tgname='assign_arena_color_tone' and not tgisinternal) as triggers
      from public.arenas;`;
} else throw new Error('Use test, apply or verify');
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
});
const body = await response.text();
if (!response.ok) throw new Error(`Database request ${response.status}: ${body}`);
console.log(mode, body);
