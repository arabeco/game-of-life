-- AS FICHAS DE VINCULO (28/10/2026, com o Afonso).
--
-- Antes eram duas cobrancas: o convite debitava ouro (50 ou 75; renovar 25 ou
-- 40) e cada vinculo vivo ocupava uma VAGA (Premium 2, Platinum 5, ou vaga
-- comprada por 50 ouro, para sempre). Agora e uma so: a FICHA.
--
-- - 1 ficha abre ou renova um vinculo por 30 dias (competicao: um duelo).
--   Quem convida paga; recusado, revogado ou vencido, a ficha volta.
-- - O plano da fichas por mes: Premium 2, Platinum 5. NAO acumulam: o mes
--   seguinte comeca do zero (assim ninguem junta e cancela).
-- - Ficha avulsa: 50 ouro, guardada ate usar (foi paga).
-- - Acaba o limite de vagas: vinculo vivo nao ocupa mais nada.
--
-- A tela le o mesmo resumo de antes (relationship_slot): base = fichas do
-- plano no mes, used = usadas do plano, purchased = compradas guardadas.
-- Convite antigo pago em ouro continua sendo reembolsado em ouro.
-- Pode ser rodado de novo sem estrago.

begin;

alter table public.user_profiles add column if not exists fichas_de_vinculo integer not null default 0;
alter table public.relationship_link_invites add column if not exists paga_com text;
alter table public.relationship_link_invites drop constraint if exists relationship_link_invites_paga_com_check;
alter table public.relationship_link_invites add constraint relationship_link_invites_paga_com_check check (paga_com is null or paga_com in ('plano','ficha'));

-- As vagas compradas viram fichas guardadas (quem pagou nao perde).
update public.user_profiles
set fichas_de_vinculo = fichas_de_vinculo + greatest(0, coalesce(relationship_slots_purchased, 0)),
    relationship_slots_purchased = 0
where coalesce(relationship_slots_purchased, 0) > 0;

create or replace function public.relationship_fichas_do_plano(p_user_id uuid)
returns integer language sql stable security definer set search_path=public as $$
  select case
    when lower(coalesce(role,'')) in ('admin','gm','admin_gm') then 5
    when coalesce(is_premium,false) and (premium_expires_at is null or premium_expires_at>now())
      and lower(coalesce(subscription_tier,'premium'))='platinum' then 5
    when coalesce(is_premium,false) and (premium_expires_at is null or premium_expires_at>now()) then 2
    else 0 end
  from public.user_profiles where id=p_user_id;
$$;

-- As fichas do plano gastas neste mes (horario de Brasilia). Convite
-- reembolsado volta a ficha: o reembolso apaga o paga_com.
create or replace function public.relationship_fichas_do_plano_usadas(p_user_id uuid)
returns integer language sql stable security definer set search_path=public as $$
  select count(*)::integer from public.relationship_link_invites
  where sender_id=p_user_id and paga_com='plano'
    and created_at >= (date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo');
$$;

-- Gasta 1 ficha de quem convida: a do plano primeiro, depois a comprada.
create or replace function public._relationship_gastar_ficha(p_user_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare v_compradas integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('fichas-de-vinculo:'||p_user_id::text,0));
  if public.relationship_fichas_do_plano_usadas(p_user_id) < coalesce(public.relationship_fichas_do_plano(p_user_id),0) then
    return 'plano';
  end if;
  update public.user_profiles set fichas_de_vinculo=fichas_de_vinculo-1
    where id=p_user_id and fichas_de_vinculo>0 returning fichas_de_vinculo into v_compradas;
  if not found then raise exception 'FICHA_DE_VINCULO_NECESSARIA'; end if;
  return 'ficha';
end;
$$;

create or replace function public.propose_relationship_v3(
  p_recipient_id uuid, p_link_type text, p_arena_id uuid default null,
  p_duration_days integer default 7, p_renewal_link_id uuid default null,
  p_pupil_id uuid default null
) returns jsonb language plpgsql security definer set search_path = public, auth, extensions as $$
declare u uuid:=auth.uid(); l public.relationship_links%rowtype; i public.relationship_link_invites%rowtype;
  a public.arenas%rowtype; price integer; balance integer; snap jsonb; acts jsonb; pupil uuid; paga text;
begin
  if u is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_recipient_id is null or p_recipient_id=u then raise exception 'INVALID_RECIPIENT'; end if;
  if p_link_type not in ('parceria','mentoria','competicao') then raise exception 'RELATIONSHIP_LINK_TYPE_INVALID'; end if;
  perform pg_advisory_xact_lock(hashtextextended(concat_ws(':',p_link_type,least(u::text,p_recipient_id::text),greatest(u::text,p_recipient_id::text)),0));
  if exists(select 1 from public.relationship_link_invites where status='pending' and link_type=p_link_type
    and ((sender_id=u and recipient_id=p_recipient_id) or (recipient_id=u and sender_id=p_recipient_id)))
    then raise exception 'RELATIONSHIP_INVITE_ALREADY_PENDING'; end if;
  pupil:=coalesce(p_pupil_id,p_recipient_id);
  if pupil not in (u,p_recipient_id) then raise exception 'INVALID_RECIPIENT'; end if;
  if p_renewal_link_id is not null then
    select * into l from public.relationship_links where id=p_renewal_link_id and link_type=p_link_type
      and u in (mentor_id,pupil_id) and p_recipient_id in (mentor_id,pupil_id) for update;
    if not found or l.link_type='competicao' then raise exception 'RELATIONSHIP_LINK_NOT_FOUND'; end if;
    if public.relationship_link_is_live(l) then raise exception 'RELATIONSHIP_STILL_ACTIVE'; end if;
    pupil:=l.pupil_id;
    price:=0;
    select coalesce(jsonb_agg(jsonb_build_object('arenaId',s.arena_id,'name',ar.name,'ownerId',ar.user_id)), '[]')
      into acts from public.relationship_link_arenas s join public.arenas ar on ar.id=s.arena_id
      where s.relationship_link_id=l.id and not coalesce(ar.is_archived,false);
    snap:=jsonb_build_object('name','Renovação','selection',acts);
  else
    if p_link_type<>'competicao' and exists(select 1 from public.relationship_links
      where link_type=p_link_type and ended_at is null
        and u in (mentor_id,pupil_id) and p_recipient_id in (mentor_id,pupil_id)) then
      raise exception 'RELATIONSHIP_LINK_ALREADY_ACTIVE';
    end if;
    price:=0;
    if p_link_type='competicao' then
      if p_duration_days not between 1 and 30 then raise exception 'COMPETITION_DURATION_INVALID'; end if;
      if exists(select 1 from public.relationship_competition_challenges where sealed_at is null
        and u in (challenger_user_id,opponent_user_id) and p_recipient_id in (challenger_user_id,opponent_user_id)) then
        raise exception 'COMPETITION_CHALLENGE_ALREADY_ACTIVE'; end if;
      select * into a from public.arenas where id=p_arena_id and user_id=u and not coalesce(is_archived,false) for update;
      if not found or public._competition_snapshot_arena_exists(a.id) then raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED'; end if;
      select jsonb_agg(to_jsonb(ac) order by ac.id) into acts from public.actions ac
        where ac.arena_id=a.id and coalesce(ac.action_type,'')<>'Livre';
      if coalesce(jsonb_array_length(acts),0)=0 then raise exception 'COMPETITION_SOURCE_ARENA_EMPTY'; end if;
      snap:=to_jsonb(a)||jsonb_build_object('durationDays',p_duration_days,'actionCount',jsonb_array_length(acts),
        'plannedTotal',(select sum(greatest(1,coalesce((x->>'repetitions')::int,1))) from jsonb_array_elements(acts) x));
    end if;
  end if;
  -- A FICHA (28/10/2026): abrir ou renovar custa 1 ficha de quem convida, nao ouro.
  paga:=public._relationship_gastar_ficha(u);
  select coalesce((wallet->>'gold')::integer,0) into balance from public.user_profiles where id=u;
  insert into public.relationship_link_invites(sender_id,recipient_id,link_type,arena_id,arena_snapshot,actions_snapshot,
    status,cost_gold,expires_at,arena_slots,renewal_link_id,pupil_user_id,paga_com)
  values(u,p_recipient_id,p_link_type,p_arena_id,snap,case when p_link_type='competicao' then acts end,
    'pending',price,now()+interval '7 days',1,p_renewal_link_id,pupil,paga) returning * into i;
  insert into public.notifications(id,user_id,type,content,read,metadata)
  values(extensions.gen_random_uuid(),p_recipient_id,case when p_link_type='mentoria' then 'mentor_invite' when p_link_type='parceria' then 'partnership_invite' else 'arena_access' end,
    case when p_renewal_link_id is not null then 'Proposta de renovação de vínculo.' else 'Novo convite de '||p_link_type||'.' end,false,
    jsonb_build_object('inviteId',i.id,'linkType',p_link_type,'linkId',p_renewal_link_id));
  return jsonb_build_object('success',true,'new_gold',balance,'invite',to_jsonb(i));
end;
$$;

create or replace function public.propose_client_paid_mentorship(p_recipient_id uuid,p_pupil_id uuid,p_renewal_link_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public,auth,extensions as $$
declare v_uid uuid:=auth.uid(); v_link public.relationship_links%rowtype; v_invite public.relationship_link_invites%rowtype; v_pupil uuid; v_snapshot jsonb; v_paga text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_recipient_id is null or p_recipient_id=v_uid or p_pupil_id not in(v_uid,p_recipient_id) then raise exception 'INVALID_RECIPIENT'; end if;
  perform pg_advisory_xact_lock(hashtextextended(concat_ws(':','mentoria',least(v_uid::text,p_recipient_id::text),greatest(v_uid::text,p_recipient_id::text)),0));
  if exists(select 1 from public.relationship_link_invites where status='pending' and link_type='mentoria' and ((sender_id=v_uid and recipient_id=p_recipient_id) or(recipient_id=v_uid and sender_id=p_recipient_id))) then raise exception 'RELATIONSHIP_INVITE_ALREADY_PENDING'; end if;
  v_pupil:=p_pupil_id;
  if p_renewal_link_id is not null then
    select * into v_link from public.relationship_links where id=p_renewal_link_id and link_type='mentoria' and v_uid in(mentor_id,pupil_id) and p_recipient_id in(mentor_id,pupil_id) for update;
    if not found or public.relationship_link_is_live(v_link) then raise exception 'RELATIONSHIP_LINK_NOT_FOUND'; end if;
    v_pupil:=v_link.pupil_id;
    select jsonb_build_object('name','Renovação','selection',coalesce(jsonb_agg(jsonb_build_object('arenaId',s.arena_id,'name',a.name,'ownerId',a.user_id)),'[]'::jsonb)) into v_snapshot from public.relationship_link_arenas s join public.arenas a on a.id=s.arena_id where s.relationship_link_id=v_link.id and not coalesce(a.is_archived,false);
  end if;
  v_paga:=public._relationship_gastar_ficha(v_uid);
  insert into public.relationship_link_invites(sender_id,recipient_id,link_type,status,cost_gold,expires_at,arena_slots,renewal_link_id,pupil_user_id,arena_snapshot,paga_com)
  values(v_uid,p_recipient_id,'mentoria','pending',0,now()+interval '7 days',1,p_renewal_link_id,v_pupil,v_snapshot,v_paga) returning * into v_invite;
  insert into public.notifications(id,user_id,type,content,read,metadata) values(extensions.gen_random_uuid(),p_recipient_id,'mentor_invite','Novo convite de mentoria.',false,jsonb_build_object('inviteId',v_invite.id,'linkType','mentoria','slotOwner','mentor'));
  return jsonb_build_object('success',true,'invite',to_jsonb(v_invite));
end;
$$;

-- O reembolso devolve a ficha (ou o ouro, no convite antigo).
create or replace function public._relationship_refund_pending_invite(p_invite_id uuid, p_reason text)
returns integer language plpgsql security definer set search_path=public,auth as $$
declare v_invite public.relationship_link_invites%rowtype; v_new_gold integer:=0;
begin
  select * into v_invite from public.relationship_link_invites where id=p_invite_id for update;
  if not found then raise exception 'RELATIONSHIP_INVITE_NOT_FOUND'; end if;
  if v_invite.status<>'pending' or v_invite.refunded_at is not null then return 0; end if;

  if v_invite.paga_com='ficha' then
    update public.user_profiles set fichas_de_vinculo=fichas_de_vinculo+1 where id=v_invite.sender_id;
    update public.relationship_link_invites set refunded_at=now(), paga_com=null where id=p_invite_id;
    return 0;
  end if;
  if v_invite.paga_com='plano' then
    update public.relationship_link_invites set refunded_at=now(), paga_com=null where id=p_invite_id;
    return 0;
  end if;

  if coalesce(v_invite.cost_gold,0)<=0 then
    update public.relationship_link_invites set refunded_at=now() where id=p_invite_id;
    return 0;
  end if;
  v_new_gold:=public._relationship_credit_gold(v_invite.sender_id,v_invite.cost_gold,'relationship_invite_refund',
    format('Refund do convite de %s', coalesce(v_invite.link_type,'vinculo')),
    jsonb_build_object('invite_id',v_invite.id,'link_type',v_invite.link_type,'reason',coalesce(p_reason,'unknown')));
  update public.relationship_link_invites set refunded_at=now() where id=p_invite_id;
  return v_new_gold;
end;
$$;

-- Acaba o limite de vagas.
drop trigger if exists relationship_slot_limit on public.relationship_links;

-- O resumo que a tela le: as fichas no lugar das vagas.
create or replace function public._relationship_build_capacity_summary(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_plano integer; v_usadas integer; v_compradas integer;
begin
  select coalesce(fichas_de_vinculo,0) into v_compradas from public.user_profiles where id=p_user_id;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  v_plano:=coalesce(public.relationship_fichas_do_plano(p_user_id),0);
  v_usadas:=least(v_plano, public.relationship_fichas_do_plano_usadas(p_user_id));
  return public._relationship_linked_arena_capacity(p_user_id) || jsonb_build_object('relationship_slot',jsonb_build_object(
    'used',v_usadas,'limit',v_plano+v_compradas,'base',v_plano,'purchased',v_compradas,'costGold',50,'requiresPremium',false,'unlimited',false));
end;
$$;

-- Comprar: 'relationship_slot' agora compra uma FICHA (50 ouro).
create or replace function public.buy_relationship_capacity_slot(p_slot_type text)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_gold integer; v_compradas integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_slot_type='relationship_slot' then
    update public.user_profiles set wallet=jsonb_set(coalesce(wallet,'{}'::jsonb),'{gold}',to_jsonb(coalesce((wallet->>'gold')::integer,0)-50)),
      fichas_de_vinculo=coalesce(fichas_de_vinculo,0)+1
      where id=v_user and coalesce((wallet->>'gold')::integer,0)>=50
      returning coalesce((wallet->>'gold')::integer,0),fichas_de_vinculo into v_gold,v_compradas;
  elsif p_slot_type='linked_arena' then
    update public.user_profiles set wallet=jsonb_set(coalesce(wallet,'{}'::jsonb),'{gold}',to_jsonb(coalesce((wallet->>'gold')::integer,0)-50)),
      linked_arena_slots_purchased=coalesce(linked_arena_slots_purchased,0)+1
      where id=v_user and coalesce((wallet->>'gold')::integer,0)>=50
      returning coalesce((wallet->>'gold')::integer,0),linked_arena_slots_purchased into v_gold,v_compradas;
  else raise exception 'este espaco nao se compra'; end if;
  if not found then raise exception 'Insufficient gold'; end if;
  return jsonb_build_object('success',true,'charged',50,'new_gold',v_gold,'purchased',v_compradas,'summary',public._relationship_build_capacity_summary(v_user));
end;
$$;

revoke all on function public.relationship_fichas_do_plano(uuid) from public, anon;
revoke all on function public.relationship_fichas_do_plano_usadas(uuid) from public, anon;
revoke all on function public._relationship_gastar_ficha(uuid) from public, anon, authenticated;
revoke all on function public._relationship_refund_pending_invite(uuid, text) from public, anon, authenticated;
revoke all on function public.buy_relationship_capacity_slot(text) from public, anon;
grant execute on function public.buy_relationship_capacity_slot(text) to authenticated;
grant execute on function public.propose_client_paid_mentorship(uuid,uuid,uuid) to authenticated;

commit;
