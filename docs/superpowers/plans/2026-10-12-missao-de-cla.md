# Missão de clã — plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas (`- [ ]`) para acompanhar.

**Objetivo:** a missão de clã da temporada volta, com botão Entrar, uma arena por participante, progresso do grupo contado no servidor e baú Raro para quem entrou. Junto vêm a barrinha de humor dos membros e o acerto da arena compartilhada que mostra % e oscila.

**Arquitetura:** o servidor guarda quem entrou e conta, na hora, as tarefas concluídas da ação de cada participante. Não existe contador incrementado. O cliente cria a arena e a ação como já faz com as missões da temporada, registra a entrada por RPC e lê o status ao abrir a tela e quando as tarefas da missão mudam. A missão vencida sem meta é recolhida pela varredura de jornadas que já existe.

**Tecnologia:** React + TypeScript + Vite, Supabase (Postgres/PLpgSQL, RPC), testes `.regression.mjs` em Node 24 (importa `.ts` direto) e PGlite para SQL.

**Desenho:** `docs/superpowers/specs/2026-10-12-missao-de-cla-design.md`

## Regras gerais

- Prêmio: `Raro`, entregue pelo servidor (`grant_chest`). Nunca baú `Season`.
- Missão de teste: id `clan-genesis-socializar`, temporada `season-genesis-0`, meta 20, vence em `2026-12-31` (a temporada acaba em `2027-01-01`).
- Só ganha quem entrou. Quem saiu do clã para de contar e não recebe.
- Vencida sem meta: a arena é **arquivada**, nunca apagada.
- `clanMissions` continua `false` (prioridade do líder e Clan Office). A chave nova é `clanSeasonQuests: true`.
- O progresso aparece em **X/Y**, nunca em %.
- O humor só é visto por quem é do mesmo clã e não entra no cartão público.
- O Afonso roda o SQL. Antes de entregar: `npm run sql:checa -- <arquivo>`. Nunca usar a service role do `.env.local`.
- Nunca rodar `npm run test:launch`, porque ele cria contas em produção.
- Commits só com os próprios trechos. O Codex pode ter mudanças soltas em `GameContext.tsx`: conferir `git diff` antes de commitar.
- Texto de tela em português, voz ativa, sem jargão de sistema.

## Riscos que nenhum teste de tarefa cobre

1. **Duplo toque em Entrar** cria duas arenas: o botão trava enquanto a entrada está em voo, e `entrarNaMissaoDoCla` sai cedo se a ação da missão já existe (teste na Tarefa 3).
2. **Sem clã:** o cartão da missão não aparece, e a Temporada diz "Entre num clã para participar" em vez de criar a arena (teste na Tarefa 3).
3. **RPC recusada depois de criar a arena** (vencida, sem clã): a ação criada é desfeita, para não sobrar arena órfã (teste na Tarefa 3).
4. **Status chega antes do clã carregar:** sem clã ainda, o status vem com `has_clan: false` e o cartão espera; nada é arquivado por engano. Só `vencida && !metaBatida` arquiva (teste na Tarefa 2).
5. **Membro sem humor registrado:** sem barrinha. `mood` nulo não vira barra vazia fingindo 0 (teste na Tarefa 4).

---

### Tarefa 1: O banco — missões, participantes, contagem, prêmio e humor

**Arquivos:**
- Criar: `supabase/migrations/20261012200000_missao_de_cla.sql`
- Criar: `tests/missao-de-cla-sql.regression.mjs`
- Modificar: `package.json` (script `test:missao-de-cla-sql`)

**Interfaces:**
- Produz (RPC, `authenticated`):
  - `entrar_na_missao_de_cla(p_quest_id text, p_action_id text) returns jsonb`, que devolve o mesmo JSON do status;
  - `status_da_missao_de_cla(p_quest_id text) returns jsonb`, com `{quest_id, goal, ends_on, expired, total, joined, claimed, has_clan, members:[{user_id, nickname, done}]}`;
  - `receber_premio_da_missao_de_cla(p_quest_id text) returns jsonb`, com `{success, already_claimed, chest_type}`;
  - `humor_do_meu_cla() returns table(user_id uuid, mood integer)`.
- Erros (texto da exceção): `AUTH_REQUIRED`, `MISSAO_DESCONHECIDA`, `MISSAO_VENCIDA`, `SEM_CLA`, `ACAO_INVALIDA`, `NAO_ENTROU`, `SAIU_DO_CLA`, `META_NAO_BATIDA`.

- [ ] **Passo 1: escrever o teste que falha** — `tests/missao-de-cla-sql.regression.mjs`

```js
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
```

- [ ] **Passo 2: rodar e ver falhar**

Rodar: `node tests/missao-de-cla-sql.regression.mjs`
Esperado: FALHA ao ler `20261012200000_missao_de_cla.sql` (arquivo não existe).

- [ ] **Passo 3: escrever a migração** — `supabase/migrations/20261012200000_missao_de_cla.sql`

```sql
-- MISSAO DE CLA (12/10/2026).
-- Desenho: docs/superpowers/specs/2026-10-12-missao-de-cla-design.md
--
-- A missao da temporada do tipo cla volta com botao Entrar. Quem entra ganha
-- uma arena com a acao da missao; o total do grupo e a contagem, NA HORA, das
-- tarefas concluidas dessa acao de cada participante. Nao existe contador que
-- alguem incrementa, entao desmarcar baixa e nao sobra estado velho.
-- So ganha quem entrou, uma vez, com a meta batida e ainda no cla. O bau e
-- Raro, nunca de temporada (a colecao da temporada e contada em 3 baus).
-- Tambem: o humor dos membros, visivel so para o proprio cla.
--
-- Pode ser rodado de novo sem estrago.

begin;

create table if not exists public.clan_quests (
  id text primary key,
  season_id text not null,
  goal integer not null check (goal > 0),
  ends_on date not null,
  reward_chest text not null
);
alter table public.clan_quests enable row level security;
drop policy if exists "Missoes de cla visiveis" on public.clan_quests;
create policy "Missoes de cla visiveis" on public.clan_quests for select to authenticated using (true);
revoke insert, update, delete on public.clan_quests from anon, authenticated;

insert into public.clan_quests (id, season_id, goal, ends_on, reward_chest)
values ('clan-genesis-socializar', 'season-genesis-0', 20, date '2026-12-31', 'Raro')
on conflict (id) do update
  set season_id = excluded.season_id, goal = excluded.goal,
      ends_on = excluded.ends_on, reward_chest = excluded.reward_chest;

create table if not exists public.clan_quest_participants (
  quest_id text not null references public.clan_quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  clan_id uuid not null,
  action_id text not null,
  joined_at timestamptz not null default now(),
  primary key (quest_id, user_id)
);
create index if not exists clan_quest_participants_por_cla on public.clan_quest_participants (quest_id, clan_id);
alter table public.clan_quest_participants enable row level security;
revoke all on public.clan_quest_participants from anon, authenticated;

-- O cla de alguem (o primeiro em que entrou, como o app le).
create or replace function public._cla_de(p_user uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select clan_id from public.clan_members where user_id = p_user order by joined_at asc nulls last limit 1
$$;
revoke all on function public._cla_de(uuid) from public, anon, authenticated;

-- Quanto cada participante ainda no cla fez: tarefas concluidas da acao dele,
-- da data em que entrou ate o fim da missao.
create or replace function public._contagem_da_missao_de_cla(p_quest_id text, p_clan uuid)
returns table (user_id uuid, feito integer)
language sql stable security definer set search_path = public as $$
  select p.user_id,
    (select count(*)::integer
       from public.scheduled_tasks t
      where t.user_id = p.user_id
        and t.action_id::text = p.action_id
        and coalesce(t.completed, false) = true
        and t.date::date between (p.joined_at at time zone 'America/Sao_Paulo')::date and q.ends_on)
  from public.clan_quest_participants p
  join public.clan_quests q on q.id = p.quest_id
  join public.clan_members m on m.user_id = p.user_id and m.clan_id = p.clan_id
  where p.quest_id = p_quest_id and p.clan_id = p_clan
$$;
revoke all on function public._contagem_da_missao_de_cla(text, uuid) from public, anon, authenticated;

create or replace function public.status_da_missao_de_cla(p_quest_id text)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
  v_clan uuid;
  v_quest public.clan_quests%rowtype;
  v_total integer;
  v_membros jsonb;
  v_vencida boolean;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_quest from public.clan_quests where id = p_quest_id;
  if not found then return null; end if;
  v_vencida := (now() at time zone 'America/Sao_Paulo')::date > v_quest.ends_on;
  v_clan := public._cla_de(v_user);
  if v_clan is null then
    return jsonb_build_object('quest_id', v_quest.id, 'goal', v_quest.goal, 'ends_on', v_quest.ends_on,
      'expired', v_vencida, 'total', 0, 'joined', false, 'claimed', false, 'has_clan', false, 'members', '[]'::jsonb);
  end if;
  select coalesce(sum(c.feito), 0)::integer,
         coalesce(jsonb_agg(jsonb_build_object('user_id', c.user_id, 'nickname', coalesce(up.nickname, 'Membro'), 'done', c.feito)
                  order by c.feito desc, up.nickname), '[]'::jsonb)
    into v_total, v_membros
  from public._contagem_da_missao_de_cla(p_quest_id, v_clan) c
  left join public.user_profiles up on up.id = c.user_id;
  return jsonb_build_object(
    'quest_id', v_quest.id, 'goal', v_quest.goal, 'ends_on', v_quest.ends_on,
    'expired', v_vencida, 'total', v_total,
    'joined', exists (select 1 from public.clan_quest_participants p
                      where p.quest_id = p_quest_id and p.user_id = v_user and p.clan_id = v_clan),
    'claimed', public._starter_reward_has_purchase_marker(v_user, 'clan_quest', p_quest_id),
    'has_clan', true,
    'members', v_membros);
end;
$$;

create or replace function public.entrar_na_missao_de_cla(p_quest_id text, p_action_id text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
  v_clan uuid;
  v_quest public.clan_quests%rowtype;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_quest from public.clan_quests where id = p_quest_id;
  if not found then raise exception 'MISSAO_DESCONHECIDA'; end if;
  if (now() at time zone 'America/Sao_Paulo')::date > v_quest.ends_on then raise exception 'MISSAO_VENCIDA'; end if;
  v_clan := public._cla_de(v_user);
  if v_clan is null then raise exception 'SEM_CLA'; end if;
  if not exists (select 1 from public.actions a where a.id::text = p_action_id and a.user_id = v_user) then
    raise exception 'ACAO_INVALIDA';
  end if;
  insert into public.clan_quest_participants (quest_id, user_id, clan_id, action_id)
  values (p_quest_id, v_user, v_clan, p_action_id)
  on conflict (quest_id, user_id) do update set clan_id = excluded.clan_id, action_id = excluded.action_id;
  return public.status_da_missao_de_cla(p_quest_id);
end;
$$;

create or replace function public.receber_premio_da_missao_de_cla(p_quest_id text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
  v_quest public.clan_quests%rowtype;
  v_part public.clan_quest_participants%rowtype;
  v_total integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_quest from public.clan_quests where id = p_quest_id;
  if not found then raise exception 'MISSAO_DESCONHECIDA'; end if;
  select * into v_part from public.clan_quest_participants where quest_id = p_quest_id and user_id = v_user;
  if not found then raise exception 'NAO_ENTROU'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':clan_quest:' || p_quest_id, 0));
  if public._starter_reward_has_purchase_marker(v_user, 'clan_quest', p_quest_id) then
    return jsonb_build_object('success', true, 'already_claimed', true, 'chest_type', v_quest.reward_chest);
  end if;
  if public._cla_de(v_user) is distinct from v_part.clan_id then raise exception 'SAIU_DO_CLA'; end if;
  select coalesce(sum(feito), 0)::integer into v_total from public._contagem_da_missao_de_cla(p_quest_id, v_part.clan_id);
  if v_total < v_quest.goal then raise exception 'META_NAO_BATIDA'; end if;
  perform public.grant_chest(v_user, v_quest.reward_chest);
  perform public._starter_reward_mark_purchase(v_user, 'clan_quest', p_quest_id, false);
  return jsonb_build_object('success', true, 'already_claimed', false, 'chest_type', v_quest.reward_chest);
end;
$$;

-- O humor dos membros, so para o proprio cla. Nao entra no cartao publico.
create or replace function public.humor_do_meu_cla()
returns table (user_id uuid, mood integer)
language sql stable security definer set search_path = public, auth as $$
  select m.user_id, up.mood::integer
  from public.clan_members m
  join public.user_profiles up on up.id = m.user_id
  where m.clan_id = public._cla_de(auth.uid()) and up.mood is not null
$$;

revoke all on function public.status_da_missao_de_cla(text) from public, anon;
revoke all on function public.entrar_na_missao_de_cla(text, text) from public, anon;
revoke all on function public.receber_premio_da_missao_de_cla(text) from public, anon;
revoke all on function public.humor_do_meu_cla() from public, anon;
grant execute on function public.status_da_missao_de_cla(text) to authenticated;
grant execute on function public.entrar_na_missao_de_cla(text, text) to authenticated;
grant execute on function public.receber_premio_da_missao_de_cla(text) to authenticated;
grant execute on function public.humor_do_meu_cla() to authenticated;

commit;
notify pgrst, 'reload schema';
```

- [ ] **Passo 4: rodar e ver passar**

Rodar: `node tests/missao-de-cla-sql.regression.mjs` e `npm run sql:checa -- supabase/migrations/20261012200000_missao_de_cla.sql`
Esperado: as 6 linhas `ok -` e `[ok]`. Se o andaime não tiver `clan_members.joined_at` ou `user_profiles.mood`, o teste quebra no insert: acrescentar a coluna em `scripts/sql-andaime.sql`, nunca no teste.

- [ ] **Passo 5: registrar e commitar**

`package.json`: `"test:missao-de-cla-sql": "node tests/missao-de-cla-sql.regression.mjs",` ao lado de `test:ciclos-fechados`.

```bash
git add supabase/migrations/20261012200000_missao_de_cla.sql tests/missao-de-cla-sql.regression.mjs package.json scripts/sql-andaime.sql
git commit -m "feat: missao de cla no banco — entrar, contar o marcado, bau Raro para quem entrou, humor do cla"
```

---

### Tarefa 2: Leitura do status e a missão nos dados da temporada

**Arquivos:**
- Criar: `utils/missaoDoCla.ts`
- Criar: `tests/missao-de-cla.regression.mjs`
- Modificar: `constants/featureFlags.ts`, `constants/seasonContent.ts` (quests da `season-genesis-0`)

**Interfaces:**
- Produz (`utils/missaoDoCla.ts`):
  - `interface MembroDaMissao { userId: string; nickname: string; feito: number }`
  - `interface StatusDaMissao { questId: string; meta: number; total: number; venceEm: string; vencida: boolean; entrei: boolean; recebi: boolean; temCla: boolean; membros: MembroDaMissao[] }`
  - `lerStatusDaMissao(data: unknown): StatusDaMissao | null`
  - `rotuloDaMissao(s: StatusDaMissao): string`, que devolve `"7/20"`, com o total no máximo igual à meta
  - `metaBatida(s): boolean`, `podeReceber(s): boolean`, `deveRecolher(s): boolean` (vencida e sem meta)
  - `mensagemDoErroDaMissao(erro?: string | null): string`
  - `assinaturaDaMissao(tasks: {actionId: string; completed?: boolean}[], actionIds: Set<string>): string`
  - `QUEST_DE_CLA_DE_TESTE = 'clan-genesis-socializar'`
- Produz: `PRODUCT_FEATURES.clanSeasonQuests = true`.

- [ ] **Passo 1: escrever o teste que falha** — `tests/missao-de-cla.regression.mjs` (as seções 1 e 2; a seção 3 entra na Tarefa 3)

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lerStatusDaMissao, rotuloDaMissao, metaBatida, podeReceber, deveRecolher, mensagemDoErroDaMissao, assinaturaDaMissao } from '../utils/missaoDoCla.ts';

/** MISSAO DE CLA NO APP (12/10/2026). Desenho: docs/superpowers/specs/2026-10-12-missao-de-cla-design.md */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ============================== 1. ler o status
const bruto = { quest_id: 'clan-genesis-socializar', goal: 20, total: 23, ends_on: '2026-12-31', expired: false, joined: true, claimed: false, has_clan: true,
  members: [{ user_id: 'a', nickname: 'Ana', done: 15 }, { user_id: 'b', nickname: 'Beto', done: 8 }] };
const s = lerStatusDaMissao(bruto);
assert.equal(rotuloDaMissao(s), '20/20', 'o rotulo passou da meta');
assert.equal(metaBatida(s), true);
assert.equal(podeReceber(s), true);
assert.equal(podeReceber({ ...s, recebi: true }), false);
assert.equal(podeReceber({ ...s, entrei: false }), false, 'quem nao entrou nao recebe');
assert.deepEqual(s.membros.map((m) => m.feito), [15, 8]);
assert.equal(lerStatusDaMissao(null), null);
assert.equal(lerStatusDaMissao({ goal: 20 }), null, 'sem quest_id nao e status');
console.log('ok - o status vira X/Y, e so quem entrou pode receber');

// ============================== 2. recolher so a vencida sem meta (risco 4)
assert.equal(deveRecolher({ ...s, vencida: true, total: 5 }), true);
assert.equal(deveRecolher({ ...s, vencida: true, total: 20 }), false, 'concluida fica no ArenasView');
assert.equal(deveRecolher({ ...s, vencida: false, total: 0 }), false);
assert.equal(deveRecolher({ ...s, temCla: false, vencida: false, total: 0 }), false, 'sem cla ainda nao recolhe nada');
assert.equal(mensagemDoErroDaMissao('MISSAO_VENCIDA'), 'Esta missão já venceu.');
assert.equal(mensagemDoErroDaMissao('SEM_CLA'), 'Entre num clã para participar da missão.');
const tarefas = [{ actionId: 'x', completed: true }, { actionId: 'x', completed: false }, { actionId: 'y', completed: true }];
assert.equal(assinaturaDaMissao(tarefas, new Set(['x'])), 'x:1');
assert.notEqual(assinaturaDaMissao([{ actionId: 'x', completed: true }, { actionId: 'x', completed: true }], new Set(['x'])), 'x:1', 'marcar mais uma nao mudou a assinatura');
console.log('ok - so a vencida sem meta se recolhe, e a assinatura muda quando a missao muda');

// ============================== 3. os dados da temporada e a chave
const temporada = ler('constants/seasonContent.ts');
const flags = ler('constants/featureFlags.ts');
assert.match(flags, /clanSeasonQuests: true/);
assert.match(flags, /clanMissions: false/, 'a prioridade do lider voltou a ligar');
const genesis = temporada.slice(temporada.indexOf("'season-genesis-0': {"), temporada.indexOf("'season-zenite-1-2026'"));
const missao = genesis.slice(genesis.indexOf("id: 'clan-genesis-socializar'"));
assert.ok(missao.length > 0, 'a missao de teste saiu da Genesis');
assert.match(missao, /type: 'clan'/);
assert.match(missao, /goal_value: 20/);
assert.match(missao, /reward_value: 'Raro'/);
assert.match(missao.slice(0, missao.indexOf('reward_value') + 30), /reward_value: 'Raro'/, 'missao de cla nao paga bau de temporada');
const sql = ler('supabase/migrations/20261012200000_missao_de_cla.sql');
assert.match(sql, /'clan-genesis-socializar', 'season-genesis-0', 20, date '2026-12-31', 'Raro'/, 'a meta ou o fim do app nao bate com o servidor');
console.log('ok - a missao de teste esta na Genesis, igual ao servidor, com bau Raro');
```

- [ ] **Passo 2: rodar e ver falhar**

Rodar: `node tests/missao-de-cla.regression.mjs`
Esperado: FALHA com "Cannot find module ... utils/missaoDoCla.ts".

- [ ] **Passo 3: escrever `utils/missaoDoCla.ts`**

```ts
/**
 * A MISSAO DE CLA NO APP (12/10/2026).
 * Desenho: docs/superpowers/specs/2026-10-12-missao-de-cla-design.md
 *
 * O servidor conta; aqui so se le o que ele disse e se decide o que mostrar.
 */

export const QUEST_DE_CLA_DE_TESTE = 'clan-genesis-socializar';

export interface MembroDaMissao { userId: string; nickname: string; feito: number }
export interface StatusDaMissao {
    questId: string;
    meta: number;
    total: number;
    venceEm: string;
    vencida: boolean;
    entrei: boolean;
    recebi: boolean;
    temCla: boolean;
    membros: MembroDaMissao[];
}

export const lerStatusDaMissao = (data: unknown): StatusDaMissao | null => {
    const bruto = (data && typeof data === 'object' ? data : null) as Record<string, unknown> | null;
    if (!bruto || typeof bruto.quest_id !== 'string' || !bruto.quest_id) return null;
    const membros = Array.isArray(bruto.members) ? bruto.members : [];
    return {
        questId: bruto.quest_id,
        meta: Math.max(1, Number(bruto.goal) || 1),
        total: Math.max(0, Number(bruto.total) || 0),
        venceEm: String(bruto.ends_on || ''),
        vencida: Boolean(bruto.expired),
        entrei: Boolean(bruto.joined),
        recebi: Boolean(bruto.claimed),
        temCla: Boolean(bruto.has_clan),
        membros: membros.map((m: any) => ({
            userId: String(m?.user_id || ''),
            nickname: String(m?.nickname || 'Membro'),
            feito: Math.max(0, Number(m?.done) || 0),
        })),
    };
};

export const rotuloDaMissao = (s: StatusDaMissao) => `${Math.min(s.total, s.meta)}/${s.meta}`;
export const metaBatida = (s: StatusDaMissao) => s.total >= s.meta;
export const podeReceber = (s: StatusDaMissao) => s.entrei && !s.recebi && metaBatida(s);
/** Vencida sem a meta: a arena se arquiva. Concluida fica. */
export const deveRecolher = (s: StatusDaMissao) => s.vencida && !metaBatida(s);

export const mensagemDoErroDaMissao = (erro?: string | null): string => {
    const texto = String(erro || '');
    if (texto.includes('MISSAO_VENCIDA')) return 'Esta missão já venceu.';
    if (texto.includes('SEM_CLA')) return 'Entre num clã para participar da missão.';
    if (texto.includes('NAO_ENTROU')) return 'Só recebe quem entrou na missão.';
    if (texto.includes('SAIU_DO_CLA')) return 'Você saiu do clã desta missão.';
    if (texto.includes('META_NAO_BATIDA')) return 'O grupo ainda não bateu a meta.';
    return 'Não consegui falar com o servidor agora. Tente de novo.';
};

/** Muda sempre que uma tarefa da missao e marcada ou desmarcada. */
export const assinaturaDaMissao = (
    tasks: { actionId: string; completed?: boolean }[],
    actionIds: Set<string>,
) => [...actionIds].sort().map((id) => `${id}:${tasks.filter((t) => t.actionId === id && t.completed).length}`).join('|');
```

- [ ] **Passo 4: a chave e a missão de teste**

`constants/featureFlags.ts`, logo abaixo de `clanChat: false,`:

```ts
  // A missao de cla DA TEMPORADA (botao Entrar, arena por participante, conta
  // no servidor). `clanMissions` segue desligado: era a prioridade do lider e o
  // Clan Office — "muito joguinho". Desenho de 12/10/2026.
  clanSeasonQuests: true,
```

`constants/seasonContent.ts`, no array `quests` da `'season-genesis-0'`, depois do objeto de `id: 'quest-warrior'`:

```ts
      {
        id: 'clan-genesis-socializar',
        title: 'Socializar',
        description: 'Como grupo, completem 20 encontros, conversas ou chamadas com alguém que importa. Quem entrou ganha 1 Baú Raro.',
        type: 'clan',
        category: 'social',
        season_id: 'season-genesis-0',
        actionTemplate: {
          name: 'Socializar',
          description: 'Um encontro, uma conversa ou uma chamada com alguém que importa.',
          duration: 30,
          icon: '🤝',
          repetitions: 20,
          difficulty: 1,
        },
        requirements: { clanGoal: 20 },
        // Sem XP: o premio e o bau Raro e a insignia de quest. A meta e o fim
        // moram tambem no servidor (clan_quests); um teste garante que batem.
        rewards: { xp: 0, gold: 0 },
        clanConfig: { collectiveGoal: 20 },
        goal_type: 'actions_completed',
        goal_value: 20,
        progressLabel: 'encontros',
        reward_type: 'chest',
        // Nunca 'Season': a colecao da temporada e contada em 3 baus para 3 pecas.
        reward_value: 'Raro',
      },
```

- [ ] **Passo 5: rodar e ver passar; `tsc`**

Rodar: `node tests/missao-de-cla.regression.mjs` e `npx tsc --noEmit -p .`
Esperado: 3 linhas `ok -`, `tsc` limpo. Se `tsc` reclamar do `'Raro'` em `reward_value`, olhar o tipo em `types.ts` (`SeasonQuest.reward_value`) e usar o mesmo literal de `ChestType`.

- [ ] **Passo 6: commit**

```bash
git add utils/missaoDoCla.ts tests/missao-de-cla.regression.mjs constants/featureFlags.ts constants/seasonContent.ts package.json
git commit -m "feat: missao de cla — leitura do status, chave da temporada e Socializar na Genesis"
```
(`package.json`: `"test:missao-de-cla": "node tests/missao-de-cla.regression.mjs",`.)

---

### Tarefa 3: O contexto — entrar, status, receber, recolher, humor

**Arquivos:**
- Modificar: `contexts/GameContext.tsx` (tipo do contexto ~linha 930–1000; `getClanQuestProgress` ~11099; `acceptSeasonQuest` ~12474; `grantMissionReward` ~12591; o objeto do provider ~13360)
- Modificar: `contexts/gameDomains/questSharedDomain.ts:55`
- Modificar: `views/SeasonView.tsx:181`
- Modificar: `tests/missao-de-cla.regression.mjs` (seção 4), `tests/challenge-reward-flow.regression.mjs:85`

**Interfaces:**
- Consome: Tarefa 2 (`lerStatusDaMissao`, `deveRecolher`, `assinaturaDaMissao`, `mensagemDoErroDaMissao`, `StatusDaMissao`); RPCs da Tarefa 1.
- Produz no `useGame()`:
  - `missoesDoCla: Record<string, StatusDaMissao>`
  - `missoesDeClaAtivas: SeasonQuest[]`
  - `atualizarMissaoDoCla(questId: string): Promise<StatusDaMissao | null>`
  - `entrarNaMissaoDoCla(questId: string): Promise<boolean>`
  - `receberPremioDaMissaoDoCla(questId: string): Promise<boolean>`
  - `humorDoCla: Record<string, number>`
- `grantMissionReward` ganha `chestJaEntregue?: ChestType | null`: o baú que o servidor já entregou, que entra só na exibição.

- [ ] **Passo 1: estender o teste (seção 4) e ver falhar**

Acrescentar ao fim de `tests/missao-de-cla.regression.mjs`:

```js
// ============================== 4. o contexto (riscos 1, 2 e 3)
const contexto = ler('contexts/GameContext.tsx');
const entrar = contexto.slice(contexto.indexOf('const entrarNaMissaoDoCla = useCallback('), contexto.indexOf('const acceptSeasonQuest = async'));
assert.match(entrar, /if \(!clan\) \{[\s\S]*?mensagemDoErroDaMissao\('SEM_CLA'\)/, 'sem cla, entrar tinha de avisar em vez de criar arena');
assert.match(entrar, /findSeasonQuestArenaAndAction\(quest\)\.action/, 'entrar de novo criaria outra arena');
assert.match(entrar, /entrandoNaMissaoRef\.current\.has\(questId\)/, 'duplo toque cria duas arenas');
assert.match(entrar, /supabase\.rpc\('entrar_na_missao_de_cla'/);
assert.match(entrar, /if \(resposta\.error\) \{[\s\S]*?deleteAction\(acao\.id\)/, 'recusa do servidor deixava arena orfa');
assert.match(contexto, /supabase\.rpc\('receber_premio_da_missao_de_cla'/);
assert.match(contexto, /chestJaEntregue: resposta\.already_claimed \? null : \(resposta\.chest_type \|\| 'Raro'\)/, 'o bau do servidor nao aparece no modal');
const resgate = contexto.slice(contexto.indexOf('const claimSeasonQuest = async'), contexto.indexOf('const claimSeasonQuest = async') + 600);
assert.match(resgate, /if \(quest\.type === 'clan'\) \{\s*await receberPremioDaMissaoDoCla\(questId\);/, 'o resgate generico pagaria a missao de cla pelo cliente');
assert.doesNotMatch(contexto, /A tarefa do grupo soma sozinha/, 'a nota de 22/09 (cla nao se pega) continua barrando');
assert.match(contexto, /deveRecolher\(status\)[\s\S]{0,200}recolherArenaDaJornada/, 'vencida sem meta nao se recolhe');
assert.match(ler('views/SeasonView.tsx'), /PRODUCT_FEATURES\.clanSeasonQuests \|\| quest\.type !== 'clan'/);
assert.match(ler('contexts/gameDomains/questSharedDomain.ts'), /!PRODUCT_FEATURES\.clanMissions && !PRODUCT_FEATURES\.clanSeasonQuests/);
console.log('ok - entrar trava duplo toque, exige cla, desfaz na recusa; receber mostra o bau do servidor');
```

Rodar: `node tests/missao-de-cla.regression.mjs`. Esperado: FALHA em "sem cla, entrar...".

- [ ] **Passo 2: as chaves em SeasonView e questSharedDomain**

`views/SeasonView.tsx:181`: trocar `(PRODUCT_FEATURES.clanMissions || quest.type !== 'clan')` por `(PRODUCT_FEATURES.clanSeasonQuests || quest.type !== 'clan')` e o comentário acima por:

```ts
    // A missao de cla DA TEMPORADA voltou (12/10/2026): tem botao Entrar e
    // arena propria. A prioridade do lider (`clanMissions`) segue desligada.
```

`contexts/gameDomains/questSharedDomain.ts:55`: `if (!PRODUCT_FEATURES.clanMissions) return null;` passa a ser `if (!PRODUCT_FEATURES.clanMissions && !PRODUCT_FEATURES.clanSeasonQuests) return null;`.

`tests/challenge-reward-flow.regression.mjs:85`: a asserção que espera `PRODUCT_FEATURES.clanMissions ... quest.type !== 'clan'` no `GameContext` passa a aceitar a chave nova. Ler o trecho real com `grep -n "quest.type !== 'clan'" contexts/GameContext.tsx` e ajustar a regex para o que estiver lá. Se o filtro do contexto ainda usar `clanMissions`, trocá-lo por `clanSeasonQuests` com o mesmo comentário do SeasonView.

- [ ] **Passo 3: estado, status e humor no contexto**

Imports, junto dos de `../utils/...`:

```ts
import { assinaturaDaMissao, deveRecolher, lerStatusDaMissao, mensagemDoErroDaMissao, type StatusDaMissao } from '../utils/missaoDoCla';
```

Logo depois de `const getClanQuestProgress = useCallback(...)` (~11099), trocar a função por:

```ts
    const getClanQuestProgress = useCallback((questId: string) => {
        // A missao de cla da temporada conta no servidor (status_da_missao_de_cla).
        if (PRODUCT_FEATURES.clanSeasonQuests && missoesDoCla[questId]) return missoesDoCla[questId].total;
        if (!clan) return 0;
        return clanQuestProgress[clan.id]?.[questId] || 0;
    }, [clan?.id, clanQuestProgress, missoesDoCla]);
```

e declarar, ANTES dela (junto dos outros `useState` do clã, ~3478):

```ts
    /** Status da missao de cla da temporada, como o servidor contou. */
    const [missoesDoCla, setMissoesDoCla] = useState<Record<string, StatusDaMissao>>({});
    const [humorDoCla, setHumorDoCla] = useState<Record<string, number>>({});
    const entrandoNaMissaoRef = useRef<Set<string>>(new Set());
```

Depois de `findSeasonQuestArenaAndAction` e `recolherArenaDaJornada` (~12440), acrescentar:

```ts
    const missoesDeClaAtivas = useMemo(() => (
        PRODUCT_FEATURES.clanSeasonQuests
            ? seasonQuests.filter((quest) => quest.type === 'clan' && (!quest.season_id || quest.season_id === activeRuntimeSeasonId))
            : []
    ), [seasonQuests, activeRuntimeSeasonId]);

    const atualizarMissaoDoCla = useCallback(async (questId: string) => {
        const { data, error } = await supabase.rpc('status_da_missao_de_cla', { p_quest_id: questId });
        if (error) return null;
        const status = lerStatusDaMissao(data);
        if (status) setMissoesDoCla((prev) => ({ ...prev, [questId]: status }));
        return status;
    }, []);

    // Ao entrar no clã (ou trocar), o status de cada missão e o humor do grupo.
    useEffect(() => {
        if (!clan?.id || !missoesDeClaAtivas.length) return;
        missoesDeClaAtivas.forEach((quest) => { void atualizarMissaoDoCla(quest.id); });
        void supabase.rpc('humor_do_meu_cla').then(({ data, error }) => {
            if (error || !Array.isArray(data)) return;
            setHumorDoCla(Object.fromEntries(data.map((linha: any) => [String(linha.user_id), Number(linha.mood)])));
        });
    }, [clan?.id, missoesDeClaAtivas, atualizarMissaoDoCla]);

    // Marcou ou desmarcou uma tarefa da missão: o grupo recontado, juntando toques.
    // `sourceQuestId` nao vai para o banco (addAction nao manda source_quest_id):
    // depois de recarregar, a acao e achada pelo nome, como nas outras jornadas.
    const acoesDaMissaoDoCla = useMemo(() => new Set(
        missoesDeClaAtivas
            .map((quest) => findSeasonQuestArenaAndAction(quest).action?.id)
            .filter((id): id is string => Boolean(id)),
    ), [findSeasonQuestArenaAndAction, missoesDeClaAtivas]);
    const assinaturaDaMissaoDoCla = useMemo(() => assinaturaDaMissao(tasks, acoesDaMissaoDoCla), [tasks, acoesDaMissaoDoCla]);
    useEffect(() => {
        if (!acoesDaMissaoDoCla.size) return;
        const espera = window.setTimeout(() => {
            missoesDeClaAtivas.forEach((quest) => { void atualizarMissaoDoCla(quest.id); });
        }, 800);
        return () => window.clearTimeout(espera);
    }, [assinaturaDaMissaoDoCla]); // eslint-disable-line react-hooks/exhaustive-deps

    // Vencida sem meta: a arena se recolhe (arquiva, não apaga).
    useEffect(() => {
        Object.values(missoesDoCla).forEach((status) => {
            const quest = missoesDeClaAtivas.find((candidate) => candidate.id === status.questId);
            if (quest && deveRecolher(status)) void recolherArenaDaJornada(quest, 'encerrada');
        });
    }, [missoesDoCla, missoesDeClaAtivas, recolherArenaDaJornada]);
```

- [ ] **Passo 4: entrar e receber**

Em `acceptSeasonQuest`, apagar o bloco do comentário "MISSAO DE CLA NAO SE PEGA..." até o `return;` do `if (quest.type === 'clan')` e pôr no lugar:

```ts
        // MISSAO DE CLA SE PEGA DE NOVO (12/10/2026) — revoga a nota de 22/09.
        // Ela ganha arena porque e a arena que leva a missao para o planner de
        // quem entrou; o total do grupo e contado no servidor.
        // Desenho: docs/superpowers/specs/2026-10-12-missao-de-cla-design.md
        if (quest.type === 'clan') {
            await entrarNaMissaoDoCla(quest.id);
            return;
        }
```

Antes de `acceptSeasonQuest`, acrescentar:

```ts
    const entrarNaMissaoDoCla = useCallback(async (questId: string): Promise<boolean> => {
        const quest = findSeasonQuestById(questId);
        if (!quest || quest.type !== 'clan') return false;
        if (!clan) {
            showToast(mensagemDoErroDaMissao('SEM_CLA'), 'info');
            return false;
        }
        if (entrandoNaMissaoRef.current.has(questId)) return false;
        entrandoNaMissaoRef.current.add(questId);
        try {
            let acao = findSeasonQuestArenaAndAction(quest).action;
            if (!acao) {
                let { arena } = findSeasonQuestArenaAndAction(quest);
                if (!arena) {
                    arena = await addArena(assets[0]?.id || 'geral', {
                        name: quest.title,
                        description: quest.description || 'Missão de clã',
                        icon: quest.actionTemplate.icon || '\u{1F91D}',
                        priority: 'alta',
                    });
                }
                if (arena?.isArchived) updateArena(arena.id, { isArchived: false });
                acao = await addAction({
                    arenaId: arena.id,
                    sourceQuestId: quest.id,
                    name: quest.actionTemplate.name,
                    description: quest.actionTemplate.description,
                    icon: quest.actionTemplate.icon || '\u{1F91D}',
                    duration: quest.actionTemplate.duration,
                    repetitions: quest.actionTemplate.repetitions || quest.goal_value || 1,
                    actionType: 'Ação Recorrente',
                    difficulty: 3,
                });
            }
            const resposta = await supabase.rpc('entrar_na_missao_de_cla', { p_quest_id: quest.id, p_action_id: acao.id });
            if (resposta.error) {
                await deleteAction(acao.id);
                showToast(mensagemDoErroDaMissao(resposta.error.message), 'error');
                return false;
            }
            const status = lerStatusDaMissao(resposta.data);
            if (status) setMissoesDoCla((prev) => ({ ...prev, [quest.id]: status }));
            showToast(`Você entrou em "${quest.title}". A arena está no seu ArenasView.`, 'success');
            return true;
        } finally {
            entrandoNaMissaoRef.current.delete(questId);
        }
    }, [addAction, addArena, assets, clan, deleteAction, findSeasonQuestArenaAndAction, findSeasonQuestById, showToast, updateArena]);

```

> `entrarNaMissaoDoCla` fica logo ANTES de `acceptSeasonQuest`, que a chama. Tudo de que ela depende (`findSeasonQuestById`, `addArena`, `addAction`, `deleteAction`, `updateArena`) é declarado antes desse ponto.

Logo DEPOIS de `grantMissionReward` (que termina antes de `claimSeasonQuest`, ~12879), acrescentar:

```ts
    // Funcao comum, e nao useCallback: grantMissionReward e recriada a cada
    // render e le o perfil do proprio closure; memorizar aqui a deixaria velha.
    const receberPremioDaMissaoDoCla = async (questId: string): Promise<boolean> => {
        const quest = findSeasonQuestById(questId);
        if (!quest) return false;
        const { data, error } = await supabase.rpc('receber_premio_da_missao_de_cla', { p_quest_id: questId });
        if (error) {
            showToast(mensagemDoErroDaMissao(error.message), 'error');
            return false;
        }
        const resposta = (data || {}) as { already_claimed?: boolean; chest_type?: ChestType | null };
        const userId = getSupabaseUserId();
        if (userId) {
            const baus = await fetchChestsFromDB(userId);
            if (baus) setUserProfile((prev) => ({ ...prev, chests: baus }));
        }
        await grantMissionReward({
            completionId: quest.id,
            title: quest.title,
            icon: quest.actionTemplate?.icon,
            xp: 0,
            chestJaEntregue: resposta.already_claimed ? null : (resposta.chest_type || 'Raro'),
            origem: 'quest_temporada',
            feito: quest.description,
            sobrancelha: 'MISSÃO DE CLÃ',
        });
        void atualizarMissaoDoCla(questId);
        return true;
    };
```

No começo de `claimSeasonQuest`, logo depois de `if (!quest) return;`, desviar a missão de clã. O resgate genérico pagaria o baú pelo cliente (`grant_my_chest`), sem o servidor conferir a meta:

```ts
        // Missao de cla e paga pelo SERVIDOR, que confere meta e participacao.
        if (quest.type === 'clan') {
            await receberPremioDaMissaoDoCla(questId);
            return;
        }
```

Em `grantMissionReward`: no tipo do parâmetro, depois de `chest?: ChestType | null;`, acrescentar:

```ts
        /** Bau que o SERVIDOR ja entregou (missao de cla). Entra so na exibicao. */
        chestJaEntregue?: ChestType | null;
```

e trocar `const chestForModal = chestGranted ? grant.chest : null;` por:

```ts
        const chestForModal = grant.chestJaEntregue || (chestGranted ? grant.chest : null);
```

No tipo do contexto (perto de `toggleTaskCompletion: (taskId: string) => Promise<void>;`, ~964), acrescentar:

```ts
    missoesDoCla: Record<string, StatusDaMissao>;
    missoesDeClaAtivas: SeasonQuest[];
    atualizarMissaoDoCla: (questId: string) => Promise<StatusDaMissao | null>;
    entrarNaMissaoDoCla: (questId: string) => Promise<boolean>;
    receberPremioDaMissaoDoCla: (questId: string) => Promise<boolean>;
    humorDoCla: Record<string, number>;
```

e no objeto do provider (perto de `toggleTaskCompletion,`, ~13367):

```ts
        missoesDoCla,
        missoesDeClaAtivas,
        atualizarMissaoDoCla,
        entrarNaMissaoDoCla,
        receberPremioDaMissaoDoCla,
        humorDoCla,
```

- [ ] **Passo 5: rodar e ver passar**

Rodar: `node tests/missao-de-cla.regression.mjs`, `node tests/challenge-reward-flow.regression.mjs`, `npx tsc --noEmit -p .`
Esperado: 4 linhas `ok -`; `challenge-reward-flow` passa; `tsc` limpo.

- [ ] **Passo 6: commit (só os próprios trechos)**

```bash
git diff contexts/GameContext.tsx   # conferir que só há trechos desta tarefa
git add contexts/GameContext.tsx contexts/gameDomains/questSharedDomain.ts views/SeasonView.tsx tests/missao-de-cla.regression.mjs tests/challenge-reward-flow.regression.mjs
git commit -m "feat: missao de cla no contexto — entrar com arena, status do servidor, receber o bau Raro, recolher a vencida"
```

---

### Tarefa 4: A tela do clã — cartão da missão e barrinha de humor

**Arquivos:**
- Criar: `components/MissaoDoClaCard.tsx`
- Criar: `components/BarrinhaDeHumor.tsx`
- Modificar: `components/ClanOverviewModal.tsx` (lista "Pessoas do grupo", ~linha 280–312)
- Modificar: `tests/missao-de-cla.regression.mjs` (seção 5)

**Interfaces:**
- Consome: `missoesDeClaAtivas`, `missoesDoCla`, `entrarNaMissaoDoCla`, `receberPremioDaMissaoDoCla`, `humorDoCla` (Tarefa 3); `rotuloDaMissao`, `podeReceber`, `metaBatida` (Tarefa 2); `MOODS_DATA` de `../constants`.
- Produz: `<MissaoDoClaCard />` sem props; `<BarrinhaDeHumor mood={number | undefined} />`, que renderiza `null` sem humor.

- [ ] **Passo 1: estender o teste (seção 5) e ver falhar**

```js
// ============================== 5. a tela do cla (risco 5)
const cartao = ler('components/MissaoDoClaCard.tsx');
const barrinha = ler('components/BarrinhaDeHumor.tsx');
const visao = ler('components/ClanOverviewModal.tsx');
assert.match(cartao, /rotuloDaMissao\(status\)/, 'o cartao tem de mostrar X/Y');
assert.match(cartao, /disabled=\{ocupado\}/, 'o botao nao trava em voo');
assert.match(cartao, /podeReceber\(status\)/);
assert.match(barrinha, /if \(typeof mood !== 'number' \|\| !Number\.isFinite\(mood\)\) return null;/, 'sem humor tinha de sumir');
assert.match(visao, /<MissaoDoClaCard \/>/);
assert.match(visao, /<BarrinhaDeHumor mood=\{humorDoCla\[member\.id\]\} \/>/);
console.log('ok - a tela do cla mostra a missao em X/Y e o humor de cada um, que some sem registro');
```

Rodar: `node tests/missao-de-cla.regression.mjs`. Esperado: FALHA com "ENOENT ... MissaoDoClaCard.tsx".

- [ ] **Passo 2: `components/BarrinhaDeHumor.tsx`**

```tsx
import React from 'react';
import { MOODS_DATA } from '../constants';

/** O humor de um membro, embaixo do nome. So aparece para o proprio cla. */
export const BarrinhaDeHumor: React.FC<{ mood?: number }> = ({ mood }) => {
    if (typeof mood !== 'number' || !Number.isFinite(mood)) return null;
    const valor = Math.max(0, Math.min(100, mood));
    const faixa = MOODS_DATA.find((m) => valor >= m.min && valor < m.max) || MOODS_DATA[MOODS_DATA.length - 1];
    return (
        <div className="mt-1 flex items-center gap-2" title={`Humor: ${faixa.label}`}>
            <div
                role="meter"
                aria-label="Humor"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(valor)}
                aria-valuetext={faixa.label}
                className="h-1 w-20 overflow-hidden rounded-full bg-white/10"
            >
                <div className="h-full rounded-full" style={{ width: `${valor}%`, background: `linear-gradient(90deg, ${faixa.trackStart}, ${faixa.trackEnd})` }} />
            </div>
            <span className="text-[9px] uppercase tracking-[0.12em] text-white/40">{faixa.label}</span>
        </div>
    );
};
```

- [ ] **Passo 3: `components/MissaoDoClaCard.tsx`**

```tsx
import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { metaBatida, podeReceber, rotuloDaMissao } from '../utils/missaoDoCla';

/**
 * A MISSAO DO CLA, NA TELA DO CLA (12/10/2026).
 * Mesma cara das missoes da temporada; barra do grupo em X/Y; quem entrou e
 * quanto cada um fez; botao Entrar no estilo do botao de missao do Oraculo.
 */
export const MissaoDoClaCard: React.FC = () => {
    const { missoesDeClaAtivas, missoesDoCla, entrarNaMissaoDoCla, receberPremioDaMissaoDoCla } = useGame();
    const [ocupado, setOcupado] = useState(false);
    const quest = missoesDeClaAtivas[0];
    const status = quest ? missoesDoCla[quest.id] : undefined;
    if (!quest || !status || !status.temCla) return null;
    if (status.vencida && !metaBatida(status)) return null;

    const percentual = Math.min(100, (status.total / status.meta) * 100);
    const agir = async (fazer: () => Promise<boolean>) => {
        if (ocupado) return;
        setOcupado(true);
        try { await fazer(); } finally { setOcupado(false); }
    };

    return (
        <section className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-4" aria-labelledby="missao-do-cla-titulo">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--skin-accent-color)]">Missão do clã</p>
            <h3 id="missao-do-cla-titulo" className="mt-1 text-base font-bold text-white">{quest.title}</h3>
            <p className="mt-1 text-xs text-white/60">{quest.description}</p>
            <div className="mt-3">
                <div className="mb-1.5 flex justify-between text-[11px] text-white/65">
                    <span>Grupo</span>
                    <strong className="tabular-nums text-[var(--skin-accent-color)]">{rotuloDaMissao(status)}</strong>
                </div>
                <div role="progressbar" aria-label="Progresso do grupo" aria-valuemin={0} aria-valuemax={status.meta} aria-valuenow={Math.min(status.total, status.meta)} className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[var(--skin-accent-color)] transition-all" style={{ width: `${percentual}%` }} />
                </div>
            </div>
            {status.membros.length > 0 && (
                <ul className="mt-3 space-y-1">
                    {status.membros.map((membro) => (
                        <li key={membro.userId} className="flex justify-between text-[11px] text-white/70">
                            <span className="truncate">{membro.nickname}</span>
                            <span className="tabular-nums text-white/50">{membro.feito}</span>
                        </li>
                    ))}
                </ul>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                <span className="text-[11px] text-white/55">Prêmio: 1 baú Raro para quem entrou</span>
                {!status.entrei && !status.vencida && (
                    <button type="button" disabled={ocupado} onClick={() => void agir(() => entrarNaMissaoDoCla(quest.id))} className="luxe-skin-button min-h-11 px-4 text-xs font-bold disabled:opacity-50">Entrar</button>
                )}
                {podeReceber(status) && (
                    <button type="button" disabled={ocupado} onClick={() => void agir(() => receberPremioDaMissaoDoCla(quest.id))} className="luxe-skin-button min-h-11 px-4 text-xs font-bold disabled:opacity-50">Receber</button>
                )}
                {status.entrei && !podeReceber(status) && (
                    <span className="text-[11px] font-bold text-white/60">{status.recebi ? 'Recebido' : 'Você está dentro'}</span>
                )}
            </div>
        </section>
    );
};
```

- [ ] **Passo 4: encaixar no `ClanOverviewModal`**

Imports no topo:

```tsx
import { MissaoDoClaCard } from './MissaoDoClaCard';
import { BarrinhaDeHumor } from './BarrinhaDeHumor';
```

Pegar `humorDoCla` do `useGame()` no mesmo destructuring que já traz `clanRanks`. Logo ANTES do bloco cujo cabeçalho é `Pessoas do grupo` (o `div` que contém `<span ...>Pessoas do grupo</span>`), inserir `<MissaoDoClaCard />`. Dentro do `sortedMembers.map`, logo depois do `div` do nome (o que contém `{member.nickname}` e a coroa), inserir:

```tsx
                                                    <BarrinhaDeHumor mood={humorDoCla[member.id]} />
```

- [ ] **Passo 5: rodar, `tsc`, ver no navegador**

Rodar: `node tests/missao-de-cla.regression.mjs` e `npx tsc --noEmit -p .`
Esperado: 5 linhas `ok -`, `tsc` limpo. A verificação visual da tela do clã depende de uma conta logada com clã, que não temos no preview. Diga isso ao Afonso em vez de fingir conferência.

- [ ] **Passo 6: commit**

```bash
git add components/MissaoDoClaCard.tsx components/BarrinhaDeHumor.tsx components/ClanOverviewModal.tsx tests/missao-de-cla.regression.mjs
git commit -m "feat: tela do cla com a missao (X/Y, Entrar, Receber) e a barrinha de humor de cada membro"
```

---

### Tarefa 5: ArenasView — a arena da missão em X/Y, a tag de clã e o fim do "brigando"

**Arquivos:**
- Modificar: `utils/arenaProgressPresentation.ts`
- Modificar: `utils/progressUtilsEngine.js:7` e `utils/progressUtilsEngine.d.ts` (exportar `isExplicitSharedArena`)
- Modificar: `components/ArenaStatusTags.tsx`
- Modificar: `components/ArenaCard.tsx` (~linhas 360–405 e 418–425)
- Modificar: `views/ArenasView.tsx` (mapa `arenaProgressById`, ~1270–1310)
- Criar: `tests/arena-compartilhada.regression.mjs`

**Interfaces:**
- Produz: `ArenaStatusTags` aceita `hasClanMission?: boolean`; `describeArenaProgress` conta "X/Y" em arena de missão de clã.

**A causa do "brigando".** O cartão faz a própria conta, e a lista entrega outra pronta (`progressPercent`). As duas dependem do tipo de vínculo, que chega depois (assíncrono). Enquanto ele não chega, `forceSharedPool` fica `undefined`, e o motor liga sozinho o pool do par assim que o par completa qualquer coisa. Quando o tipo chega, vira `false` e o número troca. Além disso, como o percentual que vem de fora difere do calculado, o rótulo cai para `%` (a guarda `Math.abs(displayedPercent - progress.progressPercent) < 0.01`). A correção é **uma conta só**, sem detecção automática de pool fora das arenas explicitamente coletivas.

- [ ] **Passo 1: escrever o teste que falha** — `tests/arena-compartilhada.regression.mjs`

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describeArenaProgress } from '../utils/arenaProgressPresentation.ts';

/** ARENA COMPARTILHADA SEM % E SEM OSCILAR (12/10/2026). */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const acoes = [{ id: 'a', actionType: 'Ação Recorrente' }];

// 1. missao de cla conta X/Y
const cla = describeArenaProgress(acoes, { progressPercent: 35, totalCompleted: 7, totalPlanned: 20, hasMeasurableProgress: true, isClanQuestArena: true, isSeasonQuestArena: false, isSharedPool: false, completedActionIds: [], isCleared: false });
assert.equal(cla.label, '7/20', 'a arena da missao de cla voltou a mostrar %');
console.log('ok - a arena da missao de cla mostra 7/20');

// 2. o cartao faz uma conta so
const cartao = ler('components/ArenaCard.tsx');
assert.match(cartao, /const progress = calculatedProgress\.progressPercent;/, 'o cartao voltou a misturar o numero de fora com o proprio');
assert.match(cartao, /forceSharedPool: isExplicitSharedArena\(arena\) \? undefined : false/, 'o pool do par voltou a ligar sozinho');
assert.match(cartao, /hasClanMission=\{isClanQuestArena\}/);
const lista = ler('views/ArenasView.tsx');
assert.match(lista, /forceSharedPool: isExplicitSharedArena\(arena\) \? undefined : false/);
assert.match(ler('components/ArenaStatusTags.tsx'), /hasClanMission[\s\S]*?seal\('Missão de clã'/);
console.log('ok - o cartao e a lista fazem a mesma conta, sem o pool do par ligar sozinho');
```

Rodar: `node tests/arena-compartilhada.regression.mjs`. Esperado: FALHA em "voltou a mostrar %".

- [ ] **Passo 2: `describeArenaProgress` conta a missão de clã**

Em `utils/arenaProgressPresentation.ts`, dentro de `describeArenaProgress`, antes de `const measured = ...`:

```ts
    // Missao de cla: o total e a meta do GRUPO ja sao contagens inteiras.
    if (progress.isClanQuestArena && Number.isInteger(progress.totalCompleted) && Number.isInteger(progress.totalPlanned) && progress.totalPlanned > 0) {
        const feito = Math.min(progress.totalCompleted, progress.totalPlanned);
        return {
            label: `${feito}/${progress.totalPlanned}`,
            accessibleLabel: `${feito}/${progress.totalPlanned} do grupo`,
            remaining: Math.max(0, progress.totalPlanned - progress.totalCompleted),
        };
    }
```

- [ ] **Passo 3: a tag de clã**

Em `components/ArenaStatusTags.tsx`: na interface, `hasClanMission?: boolean;`; nos parâmetros, `hasClanMission = false,`; no import, `ShieldIcon` se existir em `./Icons` (conferir com `grep -n "export const ShieldIcon" components/Icons.tsx`), senão `UsersIcon`. No array `tags`, depois da missão de temporada:

```tsx
        hasClanMission
            ? seal('Missão de clã', 'border-amber-300/45 bg-amber-600/28 text-amber-100', <UsersIcon className={icon} />)
            : null,
```

(Troque `UsersIcon` por `ShieldIcon` se ele existir.)

- [ ] **Passo 4: uma conta só no cartão e na lista**

`components/ArenaCard.tsx`:
- Exportar o helper: em `utils/progressUtilsEngine.js:7`, `const isExplicitSharedArena = (arena) =>` passa a `export const isExplicitSharedArena = (arena) =>`, e em `utils/progressUtilsEngine.d.ts` acrescentar `export function isExplicitSharedArena(arena: { name: string; description?: string }): boolean;`. Importar do mesmo módulo de onde o cartão já importa `calculateArenaProgress`.
- No `calculateArenaProgress` do `calculatedProgress`: trocar `forceSharedPool: linkType ? false : undefined,` por `forceSharedPool: isExplicitSharedArena(arena) ? undefined : false,` e mudar o comentário acima para dizer que o pool só vale para arena explicitamente coletiva.
- Trocar:

```ts
    const progress = typeof progressPercent === 'number'
        ? progressPercent
        : calculatedProgress.progressPercent;
```

por:

```ts
    // UMA CONTA SO. O numero pronto que vinha da lista era feito com outra
    // regra de pool e chegava em outro instante: a arena mostrava um, depois o
    // outro, e o rotulo caia para % porque os dois nao batiam.
    const progress = calculatedProgress.progressPercent;
```

- Em `renderArenaStatusTags` e `hasArenaStatusTags`: passar `hasClanMission={isClanQuestArena}` e incluir `isClanQuestArena` no `Boolean(...)`.

`views/ArenasView.tsx`, no `arenaProgressById`: trocar `forceSharedPool: relationshipLinkTypeByArenaId.has(arena.id) ? false : undefined,` por `forceSharedPool: isExplicitSharedArena(arena) ? undefined : false,` (com o mesmo import) e tirar `relationshipLinkTypeByArenaId` das dependências do `useMemo` se não for mais usado ali. Manter a prop `progressPercent` (outros usos podem ler o mapa), mas ela não decide mais o que o cartão mostra.

- [ ] **Passo 5: rodar tudo e ver passar**

Rodar: `node tests/arena-compartilhada.regression.mjs`, `npx tsc --noEmit -p .` e a suíte (`for f in tests/*.regression.mjs; do node "$f" >/dev/null 2>&1 || echo "FALHOU $f"; done`).
Esperado: 2 linhas `ok -`, `tsc` limpo. Na suíte só podem falhar os já conhecidos (`luz-e-placa-do-soberano`, `reward-routing`). Se algum teste antigo esperar `progressPercent` decidindo a exibição, ajustar a asserção à regra nova com comentário.

- [ ] **Passo 6: commit**

```bash
git add utils/arenaProgressPresentation.ts components/ArenaStatusTags.tsx components/ArenaCard.tsx views/ArenasView.tsx tests/arena-compartilhada.regression.mjs package.json
git commit -m "fix: arena compartilhada com uma conta so (sem % e sem oscilar); missao de cla em X/Y com tag"
```
(`package.json`: `"test:arena-compartilhada": "node tests/arena-compartilhada.regression.mjs",`.)

---

### Tarefa 6: Parceria hoje — o que mostra, quando vence, a tag

**Arquivos:**
- Ler: `components/ConnectionsModal.tsx`, `views/ArenasView.tsx` (linhas 280–600, `sharedLinkedArenas` e `buildSharedArenaDetailState`), `types.ts` (`RelationshipLink.expiresAt`, `arenaSlots`), migrações com `expires_at` em `relationship_links` (`grep -ln "expires_at" supabase/migrations/*relationship*`)
- Criar: `docs/2026-10-12-parceria-hoje.md`
- Modificar: somente se algo estiver quebrado, com teste junto em `tests/arena-compartilhada.regression.mjs`

- [ ] **Passo 1: levantar e escrever** em `docs/2026-10-12-parceria-hoje.md`, com uma linha por pergunta e o `arquivo:linha` de onde saiu cada resposta:
  - o que a arena da parceria mostra no ArenasView (número, tag, de quem é o progresso);
  - quando a parceria vence (`expiresAt`), o que acontece ao vencer ("congela") e onde a pessoa vê o prazo;
  - se a tag "Parceria" aparece no cartão e na lista, para os dois lados;
  - o que, depois da Tarefa 5, ainda parece estranho.
- [ ] **Passo 2: corrigir o que estiver quebrado.** Para cada coisa quebrada: uma asserção nova que falha em `tests/arena-compartilhada.regression.mjs`, a correção mínima e a asserção passando. Se nada estiver quebrado, só o documento.
- [ ] **Passo 3: commit**

```bash
git add docs/2026-10-12-parceria-hoje.md tests/arena-compartilhada.regression.mjs
git commit -m "docs: parceria hoje — o que mostra, quando vence e a tag no ArenasView"
```

---

### Tarefa 7: Entrega — SQL para o Afonso, pranchetas, check

**Arquivos:**
- Criar: `supabase/CHECK-missao-de-cla.sql`
- Modificar: prancheta (artefato) e `docs/PRANCHETA.md`

- [ ] **Passo 1: o check** — `supabase/CHECK-missao-de-cla.sql` (só leitura; tudo `true`)

```sql
-- CONFERE A MISSAO DE CLA (12/10/2026). Rode depois de 20261012200000_missao_de_cla.sql.
select
  to_regclass('public.clan_quests') is not null as tabela_de_missoes,
  to_regclass('public.clan_quest_participants') is not null as tabela_de_participantes,
  exists (select 1 from public.clan_quests where id = 'clan-genesis-socializar' and goal = 20 and reward_chest = 'Raro') as socializar_na_genesis,
  coalesce(has_function_privilege('authenticated', to_regprocedure('public.entrar_na_missao_de_cla(text,text)'), 'execute'), false) as app_entra,
  coalesce(has_function_privilege('authenticated', to_regprocedure('public.status_da_missao_de_cla(text)'), 'execute'), false) as app_le,
  coalesce(has_function_privilege('authenticated', to_regprocedure('public.receber_premio_da_missao_de_cla(text)'), 'execute'), false) as app_recebe,
  coalesce(has_function_privilege('authenticated', to_regprocedure('public.humor_do_meu_cla()'), 'execute'), false) as app_ve_humor,
  not coalesce(has_function_privilege('anon', to_regprocedure('public.humor_do_meu_cla()'), 'execute'), false) as visitante_nao_ve_humor,
  not has_table_privilege('authenticated', 'public.clan_quest_participants', 'insert') as ninguem_escreve_direto;
```

Rodar: `npm run sql:checa -- supabase/CHECK-missao-de-cla.sql` (se o andaime não tiver as tabelas novas, compilar o check com a migração aplicada num script de rascunho, como nos checks anteriores).

- [ ] **Passo 2: pranchetas.** Item `ap-cla`: nota com o que foi feito, os commits e "falta rodar 20261012200000_missao_de_cla.sql + CHECK-missao-de-cla.sql; entra no AAB 111". Item `ap-aab-111`: acrescentar "missão de clã, barrinha de humor, arena compartilhada sem %". Regravar `docs/PRANCHETA.md` com `node scripts/prancheta-para-md.mjs <pasta>/itens`, depois do `ArtifactData list` com `out_dir`.
- [ ] **Passo 3: suíte final.** `npx tsc --noEmit -p .` e a suíte inteira, mostrando ao Afonso quantos passaram e quais falharam (só podem falhar os 2 já conhecidos).
- [ ] **Passo 4: commit**

```bash
git add supabase/CHECK-missao-de-cla.sql docs/PRANCHETA.md
git commit -m "chore: check da missao de cla e pranchetas"
```
