-- BAU COM LIMITE, CODIGO SO COM LOGIN E MAIS DUAS PORTAS (26/11/2026).
--
-- Checagem de prontidao, segunda rodada.
--
-- 1. grant_my_chest: quem decide que a pessoa ganhou bau e o app (missao
--    concluida, fim de ciclo), entao a funcao aceita qualquer chamada da
--    propria conta. Sem limite, uma pessoa logada chamava em loop
--    grant_my_chest('Lendário'), abria (150 a 350 fragmentos cada) e comprava
--    qualquer campanha com fragmentos (elite = 42). Era campanha paga de graca.
--
--    Uso real em 4 meses: 18 baus no total, no maximo 3 por pessoa num dia,
--    1 Lendario. O limite fica bem acima disso e bem abaixo do abuso:
--      - 4 baus por conta nas ultimas 24 horas;
--      - dos raros (Épico, Lendário, Season), 1 por dia e 2 por semana.
--    Passou do limite: a funcao recusa (o app ja trata erro aqui: nao mostra
--    o bau e segue). Uma trava por conta evita duas chamadas ao mesmo tempo.
--
-- 2. redeem_reward_code e consume_golden_invite recebem p_user_id e so
--    conferem quem chama quando ha login. Sem login (chave publica), qualquer
--    um gastava um codigo promocional ou um Bilhete Dourado em nome de outra
--    conta (os ids aparecem em clan_members, que e publica) e esgotava o
--    codigo. O app so chama as duas com a pessoa logada.
--
-- Pode ser rodado de novo sem estrago.

create or replace function public.grant_my_chest(p_chest_type text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_ultimas_24h integer;
  v_raros_24h integer;
  v_raros_7d integer;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- A lista e a de `ChestType` em types.ts. Tipo fora dela virava linha que o
  -- app nao sabe desenhar.
  if p_chest_type is null or p_chest_type not in
    ('Comum', 'Incomum', 'Raro', 'Épico', 'Lendário', 'Season', 'Ciclo', 'Skin Comum') then
    raise exception 'invalid_chest_type: %', p_chest_type;
  end if;

  -- Duas chamadas ao mesmo tempo nao passam juntas pelo limite.
  perform pg_advisory_xact_lock(hashtextextended('grant_my_chest:' || v_user_id::text, 0));

  select count(*),
         count(*) filter (where chest_type in ('Épico', 'Lendário', 'Season'))
    into v_ultimas_24h, v_raros_24h
  from public.user_chests
  where user_id = v_user_id and earned_at > now() - interval '24 hours';

  if v_ultimas_24h >= 4 then
    raise exception 'CHEST_DAILY_LIMIT';
  end if;

  if p_chest_type in ('Épico', 'Lendário', 'Season') then
    select count(*) into v_raros_7d
    from public.user_chests
    where user_id = v_user_id
      and chest_type in ('Épico', 'Lendário', 'Season')
      and earned_at > now() - interval '7 days';
    if v_raros_24h >= 1 or v_raros_7d >= 2 then
      raise exception 'CHEST_RARE_LIMIT';
    end if;
  end if;

  insert into public.user_chests (user_id, chest_type) values (v_user_id, p_chest_type);
end;
$function$;

revoke all on function public.grant_my_chest(text) from public, anon;
grant execute on function public.grant_my_chest(text) to authenticated, service_role;

do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('redeem_reward_code', 'consume_golden_invite')
  loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;

-- 3. enqueue_oracle_automatic_feed_webhook_for_user: qualquer um, sem login,
--    fazia o banco chamar a funcao oracle com o segredo interno, para qualquer
--    conta e quantas vezes quisesse. Ninguem a usa (o cron chama a versao sem
--    usuario; nem app, nem gatilho, nem outra funcao). Fica so com o servidor.
do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'enqueue_oracle_automatic_feed_webhook_for_user'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- 4. increment_clan_mission_progress: qualquer conta logada somava qualquer
--    numero (ate negativo) na missao de qualquer cla. O app (missoes de cla,
--    hoje desligadas) so manda +1 ou -1, e so do proprio cla.
create or replace function public.increment_clan_mission_progress(p_clan_id uuid, p_mission_id text, p_increment integer)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_increment is null or p_increment not in (-1, 1) then
    raise exception 'INVALID_INCREMENT';
  end if;
  if not exists (
    select 1 from public.clan_members m where m.clan_id = p_clan_id and m.user_id = auth.uid()
  ) then
    raise exception 'NOT_A_CLAN_MEMBER';
  end if;

  insert into public.clan_mission_progress (clan_id, mission_id, current_value, target_value)
  values (p_clan_id, p_mission_id, greatest(p_increment, 0), 50)
  on conflict (clan_id, mission_id)
  do update set
    current_value = greatest(clan_mission_progress.current_value + p_increment, 0),
    last_updated = now();
end;
$function$;

revoke all on function public.increment_clan_mission_progress(uuid, text, integer) from public, anon;
grant execute on function public.increment_clan_mission_progress(uuid, text, integer) to authenticated, service_role;

notify pgrst, 'reload schema';

-- CONFERENCIA (so le): anon false em todas; logado true menos no Oraculo.
select p.proname as funcao,
       has_function_privilege('anon', p.oid, 'execute') as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as logado,
       pg_get_functiondef(p.oid) ~ 'CHEST_RARE_LIMIT|NOT_A_CLAN_MEMBER' as com_trava_nova
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('grant_my_chest', 'redeem_reward_code', 'consume_golden_invite',
  'enqueue_oracle_automatic_feed_webhook_for_user', 'increment_clan_mission_progress')
order by 1;
