-- Uma vaga serve para qualquer vinculo ativo. Premium recebe 2, Platinum 5.
begin;

alter table public.user_profiles add column if not exists relationship_slots_purchased integer not null default 0;
alter table public.relationship_links add column if not exists slot_owner_id uuid references public.user_profiles(id);
update public.relationship_links set slot_owner_id = mentor_id where slot_owner_id is null;
alter table public.relationship_links alter column slot_owner_id set not null;

create or replace function public.relationship_slot_allowance(p_user_id uuid)
returns integer language sql stable security definer set search_path=public as $$
  select case
    when lower(coalesce(role,'')) in ('admin','gm','admin_gm') then 5
    when coalesce(is_premium,false) and (premium_expires_at is null or premium_expires_at>now())
      and lower(coalesce(subscription_tier,'premium'))='platinum' then 5
    when coalesce(is_premium,false) and (premium_expires_at is null or premium_expires_at>now()) then 2
    else 0 end + greatest(0,coalesce(relationship_slots_purchased,0))
  from public.user_profiles where id=p_user_id;
$$;

-- Preserva o resumo de arenas vinculadas; a nova entrada e adicionada abaixo.
create or replace function public._relationship_linked_arena_capacity(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_arenas integer:=0; v_links integer:=0; v_purchased integer:=0;
begin
  select count(*) into v_links from public.relationship_links l where l.ended_at is null and (l.mentor_id=p_user_id or l.pupil_id=p_user_id);
  select count(*) into v_arenas from public.relationship_link_arenas r join public.relationship_links l on l.id=r.relationship_link_id
    where l.ended_at is null and r.completed_at is null and (l.mentor_id=p_user_id or l.pupil_id=p_user_id);
  select coalesce(linked_arena_slots_purchased,0) into v_purchased from public.user_profiles where id=p_user_id;
  return jsonb_build_object(
    'partnership',jsonb_build_object('used',0,'limit',0,'base',0,'purchased',0,'costGold',0,'requiresPremium',false,'unlimited',true),
    'competition',jsonb_build_object('used',0,'limit',0,'base',0,'purchased',0,'costGold',0,'requiresPremium',false,'unlimited',true),
    'mentor',jsonb_build_object('used',0,'limit',0,'base',0,'purchased',0,'costGold',0,'requiresPremium',false,'unlimited',true),
    'pupil_mentor',jsonb_build_object('used',0,'limit',0,'base',0,'purchased',0,'costGold',0,'requiresPremium',false,'unlimited',true),
    'linked_arena',jsonb_build_object('used',v_arenas,'limit',v_links+v_purchased,'base',v_links,'purchased',v_purchased,'costGold',50,'requiresPremium',false,'unlimited',false));
end;
$$;

create or replace function public._relationship_build_capacity_summary(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_used integer:=0; v_limit integer; v_base integer; v_purchased integer;
begin
  select case
    when lower(coalesce(role,'')) in ('admin','gm','admin_gm') then 5
    when coalesce(is_premium,false) and (premium_expires_at is null or premium_expires_at>now()) and lower(coalesce(subscription_tier,'premium'))='platinum' then 5
    when coalesce(is_premium,false) and (premium_expires_at is null or premium_expires_at>now()) then 2
    else 0 end, greatest(0,coalesce(relationship_slots_purchased,0))
  into v_base,v_purchased from public.user_profiles where id=p_user_id;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  v_limit:=v_base+v_purchased;
  select count(*) into v_used from public.relationship_links l where l.slot_owner_id=p_user_id and public.relationship_link_is_live(l);
  return public._relationship_linked_arena_capacity(p_user_id) || jsonb_build_object('relationship_slot',jsonb_build_object(
    'used',v_used,'limit',v_limit,'base',v_base,'purchased',v_purchased,'costGold',50,'requiresPremium',false,'unlimited',false));
end;
$$;

create or replace function public.enforce_relationship_slot_limit()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_used integer; v_limit integer;
begin
  new.slot_owner_id:=coalesce(new.slot_owner_id,new.mentor_id);
  if not public.relationship_link_is_live(new) then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('relationship-slot:'||new.slot_owner_id::text,0));
  select count(*) into v_used from public.relationship_links l where l.slot_owner_id=new.slot_owner_id and l.id is distinct from new.id and public.relationship_link_is_live(l);
  v_limit:=public.relationship_slot_allowance(new.slot_owner_id);
  if v_used>=v_limit then raise exception 'RELATIONSHIP_SLOT_LIMIT_REACHED'; end if;
  return new;
end;
$$;
drop trigger if exists relationship_slot_limit on public.relationship_links;
create trigger relationship_slot_limit before insert or update of ended_at,expires_at,slot_owner_id on public.relationship_links for each row execute function public.enforce_relationship_slot_limit();

create or replace function public.buy_relationship_capacity_slot(p_slot_type text)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_gold integer; v_purchased integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_slot_type='relationship_slot' then
    update public.user_profiles set wallet=jsonb_set(coalesce(wallet,'{}'::jsonb),'{gold}',to_jsonb(coalesce((wallet->>'gold')::integer,0)-50)),relationship_slots_purchased=coalesce(relationship_slots_purchased,0)+1
      where id=v_user and coalesce((wallet->>'gold')::integer,0)>=50 returning coalesce((wallet->>'gold')::integer,0),relationship_slots_purchased into v_gold,v_purchased;
  elsif p_slot_type='linked_arena' then
    update public.user_profiles set wallet=jsonb_set(coalesce(wallet,'{}'::jsonb),'{gold}',to_jsonb(coalesce((wallet->>'gold')::integer,0)-50)),linked_arena_slots_purchased=coalesce(linked_arena_slots_purchased,0)+1
      where id=v_user and coalesce((wallet->>'gold')::integer,0)>=50 returning coalesce((wallet->>'gold')::integer,0),linked_arena_slots_purchased into v_gold,v_purchased;
  else raise exception 'este espaco nao se compra'; end if;
  if not found then raise exception 'Insufficient gold'; end if;
  return jsonb_build_object('success',true,'charged',50,'new_gold',v_gold,'purchased',v_purchased,'summary',public._relationship_build_capacity_summary(v_user));
end;
$$;

-- A vaga do mentor e o custo da mentoria. O orientado nao e cobrado para aceitar.
create or replace function public.propose_client_paid_mentorship(p_recipient_id uuid,p_pupil_id uuid,p_renewal_link_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public,auth,extensions as $$
declare v_uid uuid:=auth.uid(); v_link public.relationship_links%rowtype; v_invite public.relationship_link_invites%rowtype; v_pupil uuid; v_snapshot jsonb;
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
  insert into public.relationship_link_invites(sender_id,recipient_id,link_type,status,cost_gold,expires_at,arena_slots,renewal_link_id,pupil_user_id,arena_snapshot)
  values(v_uid,p_recipient_id,'mentoria','pending',0,now()+interval '7 days',1,p_renewal_link_id,v_pupil,v_snapshot) returning * into v_invite;
  insert into public.notifications(id,user_id,type,content,read,metadata) values(extensions.gen_random_uuid(),p_recipient_id,'mentor_invite','Novo convite de mentoria.',false,jsonb_build_object('inviteId',v_invite.id,'linkType','mentoria','slotOwner','mentor'));
  return jsonb_build_object('success',true,'invite',to_jsonb(v_invite));
end;
$$;
create or replace function public.respond_client_paid_mentorship_invite(p_invite_id uuid,p_action text)
returns jsonb language sql security definer set search_path=public,auth as $$ select public.respond_relationship_link_invite(p_invite_id,p_action); $$;
create or replace function public.renew_client_paid_mentorship(p_relationship_link_id uuid)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare v_link public.relationship_links%rowtype;
begin select * into v_link from public.relationship_links where id=p_relationship_link_id and auth.uid() in(mentor_id,pupil_id);
 if not found or v_link.link_type<>'mentoria' then raise exception 'RELATIONSHIP_LINK_NOT_FOUND'; end if;
 return public.propose_client_paid_mentorship(case when auth.uid()=v_link.mentor_id then v_link.pupil_id else v_link.mentor_id end,v_link.pupil_id,v_link.id); end;
$$;

revoke all on function public.relationship_slot_allowance(uuid) from public,anon;
revoke all on function public.buy_relationship_capacity_slot(text) from public,anon;
grant execute on function public.buy_relationship_capacity_slot(text) to authenticated;
grant execute on function public.propose_client_paid_mentorship(uuid,uuid,uuid) to authenticated;
grant execute on function public.respond_client_paid_mentorship_invite(uuid,text) to authenticated;
grant execute on function public.renew_client_paid_mentorship(uuid) to authenticated;
commit;
