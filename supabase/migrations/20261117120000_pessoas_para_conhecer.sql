-- Aplicação manual. Perfil público = feitos/arenas visíveis para todos.
begin;
alter table public.user_profiles add column if not exists social_discoverable boolean;
alter table public.user_profiles add column if not exists garden_interactions_enabled boolean not null default true;
grant update(social_discoverable,garden_interactions_enabled) on public.user_profiles to authenticated;
-- NULL acompanha a visibilidade inicial; uma escolha explícita sempre prevalece.
update public.user_profiles set social_discoverable=(coalesce(feats_visibility,'friends')='all') where social_discoverable is null;

create table if not exists public.social_presence (
 user_id uuid primary key references auth.users(id) on delete cascade,
 seen_at timestamptz not null default now()
);
alter table public.social_presence enable row level security;
revoke all on public.social_presence from public,anon,authenticated;
create index if not exists social_presence_recent on public.social_presence(seen_at desc);
create or replace function public.registrar_presenca_social() returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 insert into public.social_presence(user_id) values(auth.uid())
 on conflict(user_id) do update set seen_at=now() where social_presence.seen_at<now()-interval '15 minutes';
end $$;

-- Função interna compartilhada pelo seletor e pela ordenação do Reino.
create or replace function public._pontos_descoberta()
returns table(id uuid,nickname text,avatar text,borda text,patente text,motivo text,pontos integer)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 return query
 with edges as (
  select user_id a,friend_id b from public.friends union select friend_id,user_id from public.friends
 ), candidates as (
  select p.*,s.seen_at from public.user_profiles p join public.social_presence s on s.user_id=p.id
  where p.id<>auth.uid() and coalesce(p.social_discoverable,p.feats_visibility='all',false)
   and s.seen_at>now()-interval '7 days'
   and not exists(select 1 from edges e where e.a=auth.uid() and e.b=p.id)
   and not exists(select 1 from public.friend_requests r where
    ((r.sender_id=auth.uid() and r.recipient_id=p.id) or (r.recipient_id=auth.uid() and r.sender_id=p.id))
    and (r.status='pending' or (r.status='declined' and r.responded_at>now()-interval '30 days')))
 ), signals as (
  select p.id,p.nickname,p.avatar_url,p.border,p.nobility->>'rankId' rank_id,
   least(9,3*(select count(*)::int from public.social_feed_likes l join public.social_feed_events f on f.id=l.event_id
    where l.user_id=p.id and f.user_id=auth.uid() and l.created_at>now()-interval '14 days')) likes,
   least(12,4*(select count(*)::int from edges e join edges m on m.b=e.b where e.a=p.id and m.a=auth.uid())) mutual,
   case when p.feats_visibility='all' and exists(select 1 from public.arenas a join public.arenas mine on mine.asset_id=a.asset_id
    where a.user_id=p.id and mine.user_id=auth.uid() and not coalesce(a.is_archived,false) and not coalesce(mine.is_archived,false)
    and exists(select 1 from regexp_split_to_table(lower(a.name),'[^[:alnum:]]+') word
     where length(word)>=3 and word not in ('com','para','dos','das','uma')
      and word=any(regexp_split_to_array(lower(mine.name),'[^[:alnum:]]+')))) then 5 else 0 end arena,
   case when abs(array_position(array['vagante','escudeiro','cavaleiro','lorde','barao','conde','duque','principe','rei','soberano'],p.nobility->>'rankId')
    -array_position(array['vagante','escudeiro','cavaleiro','lorde','barao','conde','duque','principe','rei','soberano'],(select me.nobility->>'rankId' from public.user_profiles me where me.id=auth.uid())))<=1 then 2 else 0 end rank_points,
   case when (p.seen_at at time zone 'America/Sao_Paulo')::date=(now() at time zone 'America/Sao_Paulo')::date then 2 else 0 end active
  from candidates p
 )
 select s.id,s.nickname,s.avatar_url,s.border,s.rank_id,
  case when s.mutual>0 and s.mutual>=greatest(s.likes,s.arena,s.rank_points,s.active) then 'Vocês têm amigos em comum'
   when s.likes>0 and s.likes>=greatest(s.arena,s.rank_points,s.active) then 'Curtiu '||(s.likes/3)::text||' feitos seus'
   when s.arena>0 then 'Tem uma arena parecida com a sua'
   when s.rank_points>0 then 'Está numa patente próxima da sua'
   when s.active>0 then 'Esteve por aqui hoje' else 'Esteve por aqui esta semana' end,
  s.likes+s.mutual+s.arena+s.rank_points+s.active from signals s;
end $$;

create or replace function public.pessoas_para_conhecer(p_limite integer default 5)
returns table(id uuid,nickname text,avatar text,borda text,patente text,motivo text)
language plpgsql security definer set search_path='' as $$
begin
 return query select p.id,p.nickname,p.avatar,p.borda,p.patente,p.motivo from public._pontos_descoberta() p
 order by p.pontos desc,random() limit greatest(3,least(coalesce(p_limite,5),5));
end $$;

create or replace function public.pontuacao_do_reino(p_ids uuid[])
returns table(id uuid,pontos integer)
language plpgsql stable security definer set search_path='' as $$
begin
 if coalesce(cardinality(p_ids),0)>200 then raise exception 'LIMIT_EXCEEDED'; end if;
 return query select p.id,p.pontos from public._pontos_descoberta() p where p.id=any(p_ids);
end $$;
revoke all on function public._pontos_descoberta() from public,anon,authenticated;
revoke all on function public.registrar_presenca_social(),public.pessoas_para_conhecer(integer),public.pontuacao_do_reino(uuid[]) from public,anon;
grant execute on function public.registrar_presenca_social(),public.pessoas_para_conhecer(integer),public.pontuacao_do_reino(uuid[]) to authenticated;
commit;
