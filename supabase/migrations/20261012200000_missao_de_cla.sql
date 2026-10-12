-- MISSAO DE CLA (12/10/2026).
-- Desenho: docs/superpowers/specs/2026-10-12-missao-de-cla-design.md
--
-- A missao da temporada do tipo cla volta com botao Entrar. Quem entra ganha
-- uma arena com a acao da missao; o total do grupo e a contagem, NA HORA, das
-- tarefas dessa acao que cada participante concluiu enquanto estava dentro
-- (pelo momento da conclusao). Nao existe contador que alguem incrementa,
-- entao desmarcar baixa e nao sobra estado velho.
--
-- "Se depositou, ja era" (Afonso): quem sai do cla ou abandona a missao deixa
-- no grupo o que fez, e nao leva nada para o cla novo. A participacao fica
-- guardada com a data em que acabou.
--
-- So ganha quem esta dentro, uma vez, com a meta batida. O bau e Raro, nunca
-- de temporada (a colecao da temporada e contada em 3 baus).
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
revoke all on public.clan_quests from anon, authenticated;
grant select on public.clan_quests to authenticated;

insert into public.clan_quests (id, season_id, goal, ends_on, reward_chest)
values ('clan-genesis-socializar', 'season-genesis-0', 20, date '2026-12-31', 'Raro')
on conflict (id) do update
  set season_id = excluded.season_id, goal = excluded.goal,
      ends_on = excluded.ends_on, reward_chest = excluded.reward_chest;

-- Uma linha por PERIODO dentro da missao: entrou, ficou, saiu. O que foi feito
-- naquele periodo fica naquele cla; voltar abre um periodo novo, e o que se
-- fez fora nao entra. `encerrada_em` vazio = participacao ativa (no maximo uma
-- por pessoa por missao).
create table if not exists public.clan_quest_participants (
  id uuid primary key default gen_random_uuid(),
  quest_id text not null references public.clan_quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  clan_id uuid not null,
  action_id text not null,
  joined_at timestamptz not null default now(),
  encerrada_em timestamptz
);
create index if not exists clan_quest_participants_por_cla on public.clan_quest_participants (quest_id, clan_id);
create unique index if not exists clan_quest_participants_uma_ativa
  on public.clan_quest_participants (quest_id, user_id) where encerrada_em is null;
alter table public.clan_quest_participants enable row level security;
revoke all on public.clan_quest_participants from anon, authenticated;

-- Saiu do cla: a participacao naquele cla acaba ali (o deposito fica).
create or replace function public._encerrar_participacao_ao_sair_do_cla()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.clan_quest_participants
  set encerrada_em = now()
  where user_id = old.user_id and clan_id = old.clan_id and encerrada_em is null;
  return old;
end;
$$;
revoke all on function public._encerrar_participacao_ao_sair_do_cla() from public, anon, authenticated;
drop trigger if exists encerrar_participacao_ao_sair_do_cla on public.clan_members;
create trigger encerrar_participacao_ao_sair_do_cla after delete on public.clan_members
for each row execute function public._encerrar_participacao_ao_sair_do_cla();

-- O cla de alguem (o primeiro em que entrou, como o app le).
create or replace function public._cla_de(p_user uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select clan_id from public.clan_members where user_id = p_user order by joined_at asc nulls last limit 1
$$;
revoke all on function public._cla_de(uuid) from public, anon, authenticated;

-- Quanto cada pessoa depositou neste cla: em cada periodo dela, as tarefas da
-- acao concluidas entre a entrada e o fim do periodo (ou da missao).
create or replace function public._contagem_da_missao_de_cla(p_quest_id text, p_clan uuid)
returns table (user_id uuid, feito integer, ativo boolean)
language sql stable security definer set search_path = public as $$
  select p.user_id,
    sum((select count(*)::integer
       from public.scheduled_tasks t
      where t.user_id = p.user_id
        and t.action_id::text = p.action_id
        and coalesce(t.completed, false) = true
        and t.date::date <= q.ends_on
        and coalesce(t.completed_at, t.date::date::timestamp at time zone 'America/Sao_Paulo') >= p.joined_at
        and (p.encerrada_em is null
             or coalesce(t.completed_at, t.date::date::timestamp at time zone 'America/Sao_Paulo') < p.encerrada_em)))::integer,
    bool_or(p.encerrada_em is null)
  from public.clan_quest_participants p
  join public.clan_quests q on q.id = p.quest_id
  where p.quest_id = p_quest_id and p.clan_id = p_clan
  group by p.user_id
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
  v_minha_acao text;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_quest from public.clan_quests where id = p_quest_id;
  if not found then return null; end if;
  v_vencida := (now() at time zone 'America/Sao_Paulo')::date > v_quest.ends_on;
  v_clan := public._cla_de(v_user);
  if v_clan is null then
    return jsonb_build_object('quest_id', v_quest.id, 'goal', v_quest.goal, 'ends_on', v_quest.ends_on,
      'expired', v_vencida, 'total', 0, 'joined', false, 'claimed', false, 'has_clan', false,
      'my_action_id', null, 'members', '[]'::jsonb);
  end if;
  -- A acao da minha participacao NESTE cla (ativa ou abandonada, para entrar de
  -- novo na mesma arena). E por ela, e nunca pelo nome, que o app acha a arena
  -- da missao: uma acao pessoal chamada "Socializar" continua pessoal.
  select action_id into v_minha_acao from public.clan_quest_participants
  where quest_id = p_quest_id and user_id = v_user and clan_id = v_clan
  order by joined_at desc limit 1;
  select coalesce(sum(c.feito), 0)::integer,
         coalesce(jsonb_agg(jsonb_build_object('user_id', c.user_id, 'nickname', coalesce(up.nickname, 'Membro'),
                                               'done', c.feito, 'active', c.ativo)
                  order by c.ativo desc, c.feito desc, up.nickname), '[]'::jsonb)
    into v_total, v_membros
  from public._contagem_da_missao_de_cla(p_quest_id, v_clan) c
  left join public.user_profiles up on up.id = c.user_id;
  return jsonb_build_object(
    'quest_id', v_quest.id, 'goal', v_quest.goal, 'ends_on', v_quest.ends_on,
    'expired', v_vencida, 'total', v_total,
    'joined', exists (select 1 from public.clan_quest_participants p
                      where p.quest_id = p_quest_id and p.user_id = v_user and p.clan_id = v_clan
                        and p.encerrada_em is null),
    'claimed', public._starter_reward_has_purchase_marker(v_user, 'clan_quest', p_quest_id),
    'has_clan', true,
    'my_action_id', v_minha_acao,
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
  -- Participacao ativa em outro cla (nao deveria haver) acaba aqui: o deposito fica la.
  update public.clan_quest_participants set encerrada_em = now()
  where quest_id = p_quest_id and user_id = v_user and clan_id <> v_clan and encerrada_em is null;
  -- Ja dentro neste cla: so atualiza a acao (entrar de novo nao abre outro periodo).
  update public.clan_quest_participants set action_id = p_action_id
  where quest_id = p_quest_id and user_id = v_user and clan_id = v_clan and encerrada_em is null;
  if not found then
    insert into public.clan_quest_participants (quest_id, user_id, clan_id, action_id)
    values (p_quest_id, v_user, v_clan, p_action_id);
  end if;
  return public.status_da_missao_de_cla(p_quest_id);
end;
$$;

-- Abandonar: a participacao acaba, o deposito fica no grupo, e o bau sai do alcance.
create or replace function public.sair_da_missao_de_cla(p_quest_id text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  update public.clan_quest_participants set encerrada_em = now()
  where quest_id = p_quest_id and user_id = v_user and encerrada_em is null;
  return public.status_da_missao_de_cla(p_quest_id);
end;
$$;

create or replace function public.receber_premio_da_missao_de_cla(p_quest_id text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
  v_clan uuid;
  v_quest public.clan_quests%rowtype;
  v_part public.clan_quest_participants%rowtype;
  v_total integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_quest from public.clan_quests where id = p_quest_id;
  if not found then raise exception 'MISSAO_DESCONHECIDA'; end if;
  v_clan := public._cla_de(v_user);
  select * into v_part from public.clan_quest_participants
  where quest_id = p_quest_id and user_id = v_user and clan_id = v_clan and encerrada_em is null;
  if not found then
    if exists (select 1 from public.clan_quest_participants
               where quest_id = p_quest_id and user_id = v_user and clan_id is distinct from v_clan) then
      raise exception 'SAIU_DO_CLA';
    end if;
    raise exception 'NAO_ENTROU';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':clan_quest:' || p_quest_id, 0));
  if public._starter_reward_has_purchase_marker(v_user, 'clan_quest', p_quest_id) then
    return jsonb_build_object('success', true, 'already_claimed', true, 'chest_type', v_quest.reward_chest);
  end if;
  select coalesce(sum(feito), 0)::integer into v_total from public._contagem_da_missao_de_cla(p_quest_id, v_clan);
  if v_total < v_quest.goal then raise exception 'META_NAO_BATIDA'; end if;
  perform public.grant_chest(v_user, v_quest.reward_chest);
  perform public._starter_reward_mark_purchase(v_user, 'clan_quest', p_quest_id, false);
  return jsonb_build_object('success', true, 'already_claimed', false, 'chest_type', v_quest.reward_chest);
end;
$$;

-- O humor dos membros, so para o proprio cla. Nao entra no cartao publico.
-- `registrado` diz se a pessoa ja registrou humor alguma vez: o 50 do cadastro
-- nao e humor de ninguem, e o app mostra "sem dados".
drop function if exists public.humor_do_meu_cla();
create function public.humor_do_meu_cla()
returns table (user_id uuid, mood integer, registrado boolean)
language sql stable security definer set search_path = public, auth as $$
  select m.user_id, up.mood::integer,
         exists (select 1 from public.mood_entries e where e.user_id = m.user_id)
  from public.clan_members m
  join public.user_profiles up on up.id = m.user_id
  where m.clan_id = public._cla_de(auth.uid())
$$;

revoke all on function public.status_da_missao_de_cla(text) from public, anon;
revoke all on function public.entrar_na_missao_de_cla(text, text) from public, anon;
revoke all on function public.receber_premio_da_missao_de_cla(text) from public, anon;
revoke all on function public.sair_da_missao_de_cla(text) from public, anon;
revoke all on function public.humor_do_meu_cla() from public, anon;
grant execute on function public.status_da_missao_de_cla(text) to authenticated;
grant execute on function public.entrar_na_missao_de_cla(text, text) to authenticated;
grant execute on function public.receber_premio_da_missao_de_cla(text) to authenticated;
grant execute on function public.sair_da_missao_de_cla(text) to authenticated;
grant execute on function public.humor_do_meu_cla() to authenticated;

commit;
notify pgrst, 'reload schema';
