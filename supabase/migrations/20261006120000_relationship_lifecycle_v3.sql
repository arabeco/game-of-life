-- Apply before publishing the matching client. Existing links/results are preserved.
begin;

alter table public.relationship_link_invites
  add column if not exists renewal_link_id uuid references public.relationship_links(id),
  add column if not exists pupil_user_id uuid references auth.users(id),
  add column if not exists actions_snapshot jsonb;
alter table public.relationship_links add column if not exists expiry_notified_at timestamptz;
create table if not exists public.relationship_link_visibility (
  relationship_link_id uuid references public.relationship_links(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (relationship_link_id, user_id)
);
alter table public.relationship_link_visibility enable row level security;
create policy own_relationship_visibility on public.relationship_link_visibility
  for select to authenticated using (user_id = auth.uid());
grant select on public.relationship_link_visibility to authenticated;

create or replace function public.relationship_link_price(p_link_type text, p_arena_slots integer default 1)
returns integer language sql immutable as $$
  select case p_link_type when 'mentoria' then 75 when 'parceria' then 50 when 'competicao' then 50 else null end;
$$;

create or replace function public.relationship_link_is_live(p_link public.relationship_links)
returns boolean language sql stable as $$
  select p_link.ended_at is null and (p_link.expires_at is null or p_link.expires_at > now());
$$;

-- A single operation validates the whole selection before changing anything.
create or replace function public.select_relationship_arenas(p_link_id uuid, p_arena_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare l public.relationship_links%rowtype; u uuid := auth.uid(); ids uuid[];
begin
  select * into l from public.relationship_links where id=p_link_id and u in (mentor_id,pupil_id) for update;
  if not found or u is null then raise exception 'RELATIONSHIP_LINK_NOT_FOUND'; end if;
  if not public.relationship_link_is_live(l) then raise exception 'RELATIONSHIP_LINK_EXPIRED'; end if;
  if l.link_type='competicao' or (l.link_type='mentoria' and l.pupil_id<>u) then raise exception 'RELATIONSHIP_PERMISSION_DENIED'; end if;
  select coalesce(array_agg(distinct id), '{}') into ids from unnest(coalesce(p_arena_ids,'{}')) id;
  if l.link_type='parceria' and cardinality(ids)>1 then raise exception 'RELATIONSHIP_ARENA_SLOTS_FULL'; end if;
  if exists(select 1 from unnest(ids) chosen(id) where not exists (
    select 1 from public.arenas a where a.id=chosen.id and a.user_id=u and not coalesce(a.is_archived,false)
      and not public._competition_snapshot_arena_exists(a.id)
  )) then raise exception 'RELATIONSHIP_OWN_ARENA_REQUIRED'; end if;
  delete from public.relationship_link_arenas where relationship_link_id=l.id and created_by_user_id=u and not(arena_id=any(ids));
  insert into public.relationship_link_arenas(relationship_link_id,arena_id,created_by_user_id,metadata)
  select l.id,a.id,u,jsonb_build_object('link_type',l.link_type,'owner_user_id',u,'name',a.name,'icon',a.icon,'asset_id',a.asset_id)
  from public.arenas a where a.id=any(ids) and not exists (
    select 1 from public.relationship_link_arenas s where s.relationship_link_id=l.id and s.arena_id=a.id
  );
  return jsonb_build_object('success',true,'price_gold',0);
end;
$$;

create or replace function public.share_relationship_arena(p_relationship_link_id uuid,p_arena_id uuid)
returns jsonb language sql security definer set search_path = public, auth as $$
  select public.select_relationship_arenas(p_relationship_link_id,array[p_arena_id]);
$$;
create or replace function public.select_my_mentorship_arena(p_relationship_link_id uuid,p_arena_id uuid)
returns jsonb language sql security definer set search_path = public, auth as $$
  select public.select_relationship_arenas(p_relationship_link_id,array[p_arena_id]);
$$;

-- Gold removed from available balance is a reservation until acceptance.
-- The existing idempotent refund ledger releases it on decline/revoke/expiry.
create or replace function public.propose_relationship_v3(
  p_recipient_id uuid, p_link_type text, p_arena_id uuid default null,
  p_duration_days integer default 7, p_renewal_link_id uuid default null,
  p_pupil_id uuid default null
) returns jsonb language plpgsql security definer set search_path = public, auth, extensions as $$
declare u uuid:=auth.uid(); l public.relationship_links%rowtype; i public.relationship_link_invites%rowtype;
  a public.arenas%rowtype; price integer; balance integer; snap jsonb; acts jsonb; pupil uuid;
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
    price:=case l.link_type when 'mentoria' then 40 else 25 end;
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
    price:=public.relationship_link_price(p_link_type);
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
  balance:=public._codex_debit_gold(u,price,'relationship_invite','Reserva de vínculo',jsonb_build_object('link_type',p_link_type,'renewal_link_id',p_renewal_link_id));
  insert into public.relationship_link_invites(sender_id,recipient_id,link_type,arena_id,arena_snapshot,actions_snapshot,
    status,cost_gold,expires_at,arena_slots,renewal_link_id,pupil_user_id)
  values(u,p_recipient_id,p_link_type,p_arena_id,snap,case when p_link_type='competicao' then acts end,
    'pending',price,now()+interval '7 days',1,p_renewal_link_id,pupil) returning * into i;
  insert into public.notifications(id,user_id,type,content,read,metadata)
  values(extensions.gen_random_uuid(),p_recipient_id,case when p_link_type='mentoria' then 'mentor_invite' when p_link_type='parceria' then 'partnership_invite' else 'arena_access' end,
    case when p_renewal_link_id is not null then 'Proposta de renovação de vínculo.' else 'Novo convite de '||p_link_type||'.' end,false,
    jsonb_build_object('inviteId',i.id,'linkType',p_link_type,'linkId',p_renewal_link_id));
  return jsonb_build_object('success',true,'new_gold',balance,'invite',to_jsonb(i));
end;
$$;

create or replace function public.create_relationship_link_invite(p_recipient_id uuid,p_link_type text)
returns jsonb language sql security definer set search_path=public,auth as $$
 select public.propose_relationship_v3(p_recipient_id,p_link_type);
$$;
create or replace function public.create_competition_invite(p_recipient_id uuid,p_source_arena_id uuid,p_duration_days integer default 7)
returns jsonb language sql security definer set search_path=public,auth as $$
 select public.propose_relationship_v3(p_recipient_id,'competicao',p_source_arena_id,p_duration_days);
$$;
create or replace function public.renew_relationship_link(p_relationship_link_id uuid)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare l public.relationship_links%rowtype;
begin
 select * into l from public.relationship_links where id=p_relationship_link_id and auth.uid() in (mentor_id,pupil_id);
 if not found then raise exception 'RELATIONSHIP_LINK_NOT_FOUND'; end if;
 return public.propose_relationship_v3(case when auth.uid()=l.mentor_id then l.pupil_id else l.mentor_id end,l.link_type,null,7,l.id);
end;
$$;

create or replace function public.hide_relationship_link(p_link_id uuid)
returns void language plpgsql security definer set search_path=public,auth as $$
declare l public.relationship_links%rowtype;
begin
 select * into l from public.relationship_links where id=p_link_id and auth.uid() in (mentor_id,pupil_id) for update;
 if not found then raise exception 'RELATIONSHIP_LINK_NOT_FOUND'; end if;
 if public.relationship_link_is_live(l) then raise exception 'RELATIONSHIP_STILL_ACTIVE'; end if;
 insert into public.relationship_link_visibility values(l.id,auth.uid(),now()) on conflict do nothing;
end;
$$;

-- No permanent completion stamps for live observation.
create or replace function public.mark_relationship_arena_completed(p_arena_id uuid)
returns jsonb language sql security definer set search_path=public,auth as $$
 select jsonb_build_object('success',true,'notified',false);
$$;

-- Every action is capped independently; excess repetitions never pay another action's debt.
create or replace function public._competition_compute_arena_progress_at(p_arena_id uuid,p_cutoff timestamptz default null)
returns jsonb language sql security definer set search_path=public,auth as $$
 with counts as (
   select a.id,greatest(1,coalesce(a.repetitions,1)) target,
     (select count(*) from public.scheduled_tasks t where t.action_id=a.id::text and t.completed
       and (p_cutoff is null or t.completed_at<=p_cutoff)) done
   from public.actions a where a.arena_id=p_arena_id and coalesce(a.action_type,'')<>'Livre'
 ) select jsonb_build_object('total_planned',coalesce(sum(target),0),
   'total_completed',coalesce(sum(least(target,done)),0),'action_count',count(*),
   'is_cleared',count(*)>0 and bool_and(done>=target)) from counts;
$$;

-- Additional functions follow in this transaction.
create or replace function public._install_duel_v3(i public.relationship_link_invites,l public.relationship_links)
returns jsonb language plpgsql security definer set search_path=public,auth,extensions as $$
declare a1 uuid:=extensions.gen_random_uuid(); a2 uuid:=extensions.gen_random_uuid(); c public.relationship_competition_challenges%rowtype;
  owner_id uuid; dst_arena uuid; snap jsonb:=i.arena_snapshot; acts jsonb:=i.actions_snapshot;
begin
  if acts is null then
    -- Invitations sent by an older client retain their original acceptance validation.
    return public._create_competition_snapshot_from_invite(l.id,i.arena_id,i.sender_id,i.recipient_id,
      coalesce((snap->>'durationDays')::int,7));
  end if;
  for owner_id,dst_arena in select i.sender_id,a1 union all select i.recipient_id,a2 loop
    insert into public.arenas(id,user_id,asset_id,name,description,icon,is_archived)
    values(dst_arena,owner_id,snap->>'asset_id',snap->>'name',coalesce(snap->>'description',''),coalesce(snap->>'icon','🏆'),false);
    insert into public.actions(id,user_id,arena_id,name,description,icon,duration,repetitions,action_type,difficulty,briefing,assets,pre_flight,context,origin_codex_id)
    select extensions.gen_random_uuid(),owner_id,dst_arena,a.name,a.description,a.icon,a.duration,a.repetitions,a.action_type,a.difficulty,a.briefing,a.assets,a.pre_flight,a.context,a.origin_codex_id
    from jsonb_populate_recordset(null::public.actions,acts) a;
  end loop;
  insert into public.relationship_competition_challenges(relationship_link_id,source_arena_id,challenger_user_id,opponent_user_id,
    challenger_arena_id,opponent_arena_id,duration_days,starts_at,deadline_at,metadata)
  values(l.id,i.arena_id,i.sender_id,i.recipient_id,a1,a2,(snap->>'durationDays')::int,now(),
    now()+make_interval(days=>(snap->>'durationDays')::int),jsonb_build_object('source_name',snap->>'name','lock_mode','snapshot',
      'reward_eligible',true,'actions_snapshot',acts,'arena_snapshot',snap,'rules_version',3)) returning * into c;
  insert into public.relationship_link_arenas(relationship_link_id,arena_id,created_by_user_id,metadata)
  values(l.id,a1,i.sender_id,jsonb_build_object('link_type','competicao','challenge_id',c.id,'owner_user_id',i.sender_id)),
    (l.id,a2,i.recipient_id,jsonb_build_object('link_type','competicao','challenge_id',c.id,'owner_user_id',i.recipient_id));
  return jsonb_build_object('challenge',to_jsonb(c));
end;
$$;

create or replace function public.respond_relationship_link_invite(p_invite_id uuid,p_action text)
returns jsonb language plpgsql security definer set search_path=public,auth,extensions as $$
declare u uuid:=auth.uid(); i public.relationship_link_invites%rowtype; l public.relationship_links%rowtype;
 balance integer; duel jsonb; pupil uuid;
begin
 if u is null then raise exception 'AUTH_REQUIRED'; end if;
 -- Same ordering as proposal creation: pair lock before invitation/link rows.
 select * into i from public.relationship_link_invites where id=p_invite_id;
 if not found or u not in(i.sender_id,i.recipient_id) then raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(concat_ws(':',i.link_type,least(i.sender_id::text,i.recipient_id::text),greatest(i.sender_id::text,i.recipient_id::text)),0));
 select * into i from public.relationship_link_invites where id=p_invite_id for update;
 if i.status<>'pending' then raise exception 'RELATIONSHIP_INVITE_NOT_PENDING'; end if;
 if p_action in ('decline','revoke') then
   if (p_action='decline' and u<>i.recipient_id) or(p_action='revoke' and u<>i.sender_id) then raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED'; end if;
   balance:=public._relationship_refund_pending_invite(i.id,p_action);
   update public.relationship_link_invites set status=case p_action when 'decline' then 'declined' else 'revoked' end,responded_at=now() where id=i.id;
   return jsonb_build_object('success',true,'new_gold',case when u=i.sender_id then balance else null end);
 end if;
 if p_action<>'accept' or u<>i.recipient_id then raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED'; end if;
 if i.expires_at<=now() then raise exception 'RELATIONSHIP_INVITE_EXPIRED'; end if;
 if i.renewal_link_id is not null then
   select * into l from public.relationship_links where id=i.renewal_link_id for update;
   if not found or public.relationship_link_is_live(l) then raise exception 'RELATIONSHIP_STILL_ACTIVE'; end if;
   -- The selection reviewed in the invitation is the exact selection reopened.
   delete from public.relationship_link_arenas s where s.relationship_link_id=l.id and not exists(
     select 1 from public.arenas a,jsonb_array_elements(coalesce(i.arena_snapshot->'selection','[]')) x
     where a.id=s.arena_id and a.id::text=x->>'arenaId' and not coalesce(a.is_archived,false)
       and a.user_id=s.created_by_user_id);
   update public.relationship_links set ended_at=null,expires_at=now()+interval '30 days',renewed_at=now(),
     renewal_count=coalesce(renewal_count,0)+1,expiry_notified_at=null where id=l.id returning * into l;
   delete from public.relationship_link_visibility where relationship_link_id=l.id;
 else
   if i.link_type<>'competicao' and exists(select 1 from public.relationship_links where link_type=i.link_type and ended_at is null
     and i.sender_id in(mentor_id,pupil_id) and i.recipient_id in(mentor_id,pupil_id)) then raise exception 'RELATIONSHIP_LINK_ALREADY_ACTIVE'; end if;
   if i.link_type='competicao' and exists(select 1 from public.relationship_competition_challenges where sealed_at is null
     and i.sender_id in(challenger_user_id,opponent_user_id) and i.recipient_id in(challenger_user_id,opponent_user_id)) then raise exception 'COMPETITION_CHALLENGE_ALREADY_ACTIVE'; end if;
   pupil:=coalesce(i.pupil_user_id,i.recipient_id);
   insert into public.relationship_links(mentor_id,pupil_id,link_type,satisfaction_level,arena_slots,expires_at)
   values(case when pupil=i.sender_id then i.recipient_id else i.sender_id end,pupil,i.link_type,50,1,
     now()+make_interval(days=>case when i.link_type='competicao' then coalesce((i.arena_snapshot->>'durationDays')::int,7) else 30 end)) returning * into l;
   if i.link_type='competicao' then duel:=public._install_duel_v3(i,l); end if;
 end if;
 update public.relationship_link_invites set status='accepted',responded_at=now() where id=i.id;
 return jsonb_build_object('success',true,'link',to_jsonb(l),'competition',duel);
end;
$$;

create or replace function public._competition_finalize_challenge(p_challenge_id uuid,p_reason text default 'deadline')
returns jsonb language plpgsql security definer set search_path=public,auth,extensions as $$
declare c public.relationship_competition_challenges%rowtype; p1 jsonb; p2 jsonb; done1 boolean; done2 boolean;
 winner uuid; winner_arena uuid; chest varchar(30); xp integer:=0; uid uuid; newly boolean:=false; previous_admin text;
begin
 select * into c from public.relationship_competition_challenges where id=p_challenge_id for update;
 if not found then return jsonb_build_object('success',false); end if;
 if c.sealed_at is not null then return jsonb_build_object('success',true,'challenge',to_jsonb(c)); end if;
 p1:=public._competition_compute_arena_progress_at(c.challenger_arena_id,c.deadline_at);
 p2:=public._competition_compute_arena_progress_at(c.opponent_arena_id,c.deadline_at);
 done1:=coalesce((p1->>'is_cleared')::boolean,false); done2:=coalesce((p2->>'is_cleared')::boolean,false);
 if done1 then c.challenger_completed_at:=coalesce(c.challenger_completed_at,now()); end if;
 if done2 then c.opponent_completed_at:=coalesce(c.opponent_completed_at,now()); end if;
 if c.completed_at is null and (done1 or done2 or now()>=c.deadline_at or p_reason='forfeit') then
   newly:=true;
   if p_reason='forfeit' then
     winner:=case when auth.uid()=c.challenger_user_id then c.opponent_user_id else c.challenger_user_id end;
   elsif done1 or done2 then
     if done1 and (not done2 or c.challenger_completed_at<c.opponent_completed_at) then winner:=c.challenger_user_id;
     elsif done2 and (not done1 or c.opponent_completed_at<c.challenger_completed_at) then winner:=c.opponent_user_id; end if;
   elsif (p1->>'total_completed')::bigint*(p2->>'total_planned')::bigint > (p2->>'total_completed')::bigint*(p1->>'total_planned')::bigint then winner:=c.challenger_user_id;
   elsif (p2->>'total_completed')::bigint*(p1->>'total_planned')::bigint > (p1->>'total_completed')::bigint*(p2->>'total_planned')::bigint then winner:=c.opponent_user_id; end if;
   if winner is not null then
     winner_arena:=case when winner=c.challenger_user_id then c.challenger_arena_id else c.opponent_arena_id end;
     if coalesce((c.metadata->>'reward_eligible')::boolean,true) then
       chest:=case when (p1->>'total_planned')::int>=6 or (p1->>'action_count')::int>=4 then 'Incomum' else 'Comum' end;
       xp:=public._competition_calculate_bonus_xp((p1->>'total_planned')::int,(p1->>'action_count')::int);
       perform public._competition_grant_chest(winner,chest);
       perform public._competition_grant_bonus_xp(winner,xp);
     end if;
   end if;
   update public.relationship_competition_challenges set completed_at=now(),winner_user_id=winner,winner_arena_id=winner_arena,
     result_kind=case when winner is null then 'draw' else 'winner' end,reward_chest_type=chest,winner_bonus_xp=xp,
     reward_granted_at=case when chest is not null then now() end,
     metadata=metadata||jsonb_build_object('final_reason',p_reason,'challenger_completed',p1->'total_completed','challenger_target',p1->'total_planned',
       'opponent_completed',p2->'total_completed','opponent_target',p2->'total_planned') where id=c.id returning * into c;
   for uid in select c.challenger_user_id union all select c.opponent_user_id loop
     insert into public.notifications(id,user_id,type,content,read,metadata) values(extensions.gen_random_uuid(),uid,'competition_result',
       case when winner is null then 'Empate no desafio.' when uid=winner then 'Você venceu o desafio!' else 'Seu rival venceu o desafio.' end,false,
       jsonb_build_object('challengeId',c.id,'linkId',c.relationship_link_id,'linkType','competicao','resultKind',c.result_kind,'winnerUserId',winner,
         'challengeName',coalesce(c.metadata->>'source_name','Desafio'),'rewardChestType',case when uid=winner then chest end,
         'winnerBonusXp',case when uid=winner then xp else 0 end,'selfCompleted',case when uid=c.challenger_user_id then p1->'total_completed' else p2->'total_completed' end,
         'selfTarget',case when uid=c.challenger_user_id then p1->'total_planned' else p2->'total_planned' end,
         'rivalCompleted',case when uid=c.challenger_user_id then p2->'total_completed' else p1->'total_completed' end,
         'rivalTarget',case when uid=c.challenger_user_id then p2->'total_planned' else p1->'total_planned' end));
   end loop;
 end if;
 update public.relationship_competition_challenges set
   challenger_completed_at=case when done1 then coalesce(challenger_completed_at,now()) else challenger_completed_at end,
   opponent_completed_at=case when done2 then coalesce(opponent_completed_at,now()) else opponent_completed_at end,
   sealed_at=case when (done1 and done2) or now()>=deadline_at or p_reason='forfeit' then now() else null end
 where id=c.id returning * into c;
 previous_admin:=current_setting('app.relationship_competition_admin',true);
 perform set_config('app.relationship_competition_admin','1',true);
 update public.arenas set is_archived=true where (id=c.challenger_arena_id and (done1 or c.sealed_at is not null))
   or(id=c.opponent_arena_id and (done2 or c.sealed_at is not null));
 perform set_config('app.relationship_competition_admin',coalesce(previous_admin,''),true);
 return jsonb_build_object('success',true,'status','resolved','finalized_now',newly,'challenge',to_jsonb(c),
   'winner_user_id',c.winner_user_id,'challenger_progress',p1,'opponent_progress',p2);
end;
$$;

create or replace function public.resolve_competition_challenge_outcome(p_arena_id uuid)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare c public.relationship_competition_challenges%rowtype;
begin
 select * into c from public.relationship_competition_challenges
 where p_arena_id in(challenger_arena_id,opponent_arena_id) and auth.uid() in(challenger_user_id,opponent_user_id);
 if not found then raise exception 'COMPETITION_CHALLENGE_NOT_FOUND'; end if;
 return public._competition_finalize_challenge(c.id,'completion');
end;
$$;
create or replace function public.cancel_competition_challenge(p_challenge_id uuid)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare c public.relationship_competition_challenges%rowtype;
begin
 select * into c from public.relationship_competition_challenges where id=p_challenge_id and auth.uid() in(challenger_user_id,opponent_user_id) for update;
 if not found or c.completed_at is not null then raise exception 'COMPETITION_ALREADY_DECIDED'; end if;
 return public._competition_finalize_challenge(c.id,case when now()>=c.deadline_at then 'deadline' else 'forfeit' end);
end;
$$;

-- Serializes task completion with result calculation. A winner's tasks cannot be undone.
create or replace function public.guard_duel_task_v3() returns trigger
language plpgsql security definer set search_path=public,auth as $$
declare c public.relationship_competition_challenges%rowtype; aid uuid; task_action text;
begin
 task_action:=case when tg_op='DELETE' then old.action_id else new.action_id end;
 select arena_id into aid from public.actions where id::text=task_action;
 select * into c from public.relationship_competition_challenges where aid in(challenger_arena_id,opponent_arena_id) for update;
 if found and (c.sealed_at is not null or now()>=c.deadline_at
   or(aid=c.challenger_arena_id and c.challenger_completed_at is not null)
   or(aid=c.opponent_arena_id and c.opponent_completed_at is not null)) then
   if current_setting('app.relationship_competition_admin',true) is distinct from '1' then raise exception 'COMPETITION_ARENA_CLOSED'; end if;
 end if;
 if tg_op='UPDATE' and old.action_id is distinct from new.action_id and exists(select 1 from public.actions a
   join public.relationship_competition_challenges x on a.arena_id in(x.challenger_arena_id,x.opponent_arena_id) where a.id::text=old.action_id) then
   raise exception 'COMPETITION_SNAPSHOT_LOCKED'; end if;
 if tg_op='DELETE' then return old; end if;
 if c.id is not null and new.completed then new.completed_at:=case when tg_op='UPDATE' and old.completed then old.completed_at else clock_timestamp() end; end if;
 return new;
end;
$$;
drop trigger if exists zz_guard_duel_task_v3 on public.scheduled_tasks;
create trigger zz_guard_duel_task_v3 before insert or update or delete on public.scheduled_tasks for each row execute function public.guard_duel_task_v3();

create or replace function public.finalize_due_competition_challenges()
returns integer language plpgsql security definer set search_path=public,auth as $$
declare r record; n integer:=0;
begin
 for r in select id from public.relationship_competition_challenges where sealed_at is null and deadline_at<=now() order by deadline_at limit 100 loop
   perform public._competition_finalize_challenge(r.id,'deadline'); n:=n+1;
 end loop;
 return n;
end;
$$;

create or replace function public.resolve_duel_task_v3() returns trigger
language plpgsql security definer set search_path=public,auth as $$
declare cid uuid;
begin
 if new.completed and (tg_op='INSERT' or not coalesce(old.completed,false)) then
   select c.id into cid from public.actions a join public.relationship_competition_challenges c
     on a.arena_id in(c.challenger_arena_id,c.opponent_arena_id) where a.id::text=new.action_id;
   if cid is not null then perform public._competition_finalize_challenge(cid,'completion'); end if;
 end if;
 return new;
end;
$$;
create trigger resolve_duel_task_v3 after insert or update of completed on public.scheduled_tasks for each row execute function public.resolve_duel_task_v3();

-- Preserve results when a participant deletes their archived copy.
alter table public.relationship_competition_challenges
  drop constraint if exists relationship_competition_challenges_challenger_arena_id_fkey,
  drop constraint if exists relationship_competition_challenges_opponent_arena_id_fkey,
  alter column challenger_arena_id drop not null,
  alter column opponent_arena_id drop not null;
alter table public.relationship_competition_challenges
  add constraint relationship_competition_challenges_challenger_arena_id_fkey foreign key(challenger_arena_id) references public.arenas(id) on delete set null,
  add constraint relationship_competition_challenges_opponent_arena_id_fkey foreign key(opponent_arena_id) references public.arenas(id) on delete set null;

create or replace function public.manage_duel_copy(p_challenge_id uuid,p_action text)
returns jsonb language plpgsql security definer set search_path=public,auth,extensions as $$
declare c public.relationship_competition_challenges%rowtype; a public.arenas%rowtype; aid uuid; new_id uuid:=extensions.gen_random_uuid(); prev text;
begin
 select * into c from public.relationship_competition_challenges where id=p_challenge_id and auth.uid() in(challenger_user_id,opponent_user_id) for update;
 if not found or c.sealed_at is null then raise exception 'COMPETITION_NOT_CLOSED'; end if;
 aid:=case when auth.uid()=c.challenger_user_id then c.challenger_arena_id else c.opponent_arena_id end;
 select * into a from public.arenas where id=aid and user_id=auth.uid();
 if not found then raise exception 'ARENA_NOT_FOUND'; end if;
 if p_action='copy' then
   insert into public.arenas(id,user_id,asset_id,name,description,icon,is_archived) values(new_id,auth.uid(),a.asset_id,a.name,a.description,a.icon,false);
   insert into public.actions(id,user_id,arena_id,name,description,icon,duration,repetitions,action_type,difficulty,briefing,assets,pre_flight,context,origin_codex_id)
   select extensions.gen_random_uuid(),auth.uid(),new_id,name,description,icon,duration,repetitions,action_type,difficulty,briefing,assets,pre_flight,context,origin_codex_id
   from public.actions where arena_id=aid;
   return jsonb_build_object('success',true,'arena_id',new_id);
 elsif p_action='delete' then
   prev:=current_setting('app.relationship_competition_admin',true);
   perform set_config('app.relationship_competition_admin','1',true);
   delete from public.scheduled_tasks where action_id in(select id::text from public.actions where arena_id=aid);
   delete from public.arenas where id=aid;
   perform set_config('app.relationship_competition_admin',coalesce(prev,''),true);
   return jsonb_build_object('success',true);
 end if;
 raise exception 'INVALID_ACTION';
end;
$$;

create or replace function public.expire_relationships_v3()
returns integer language plpgsql security definer set search_path=public,auth,extensions as $$
declare l public.relationship_links%rowtype; i record; u uuid; n integer:=0;
begin
 for i in select id from public.relationship_link_invites where status='pending' and expires_at<=now() for update skip locked loop
   perform public._relationship_refund_pending_invite(i.id,'expired');
   update public.relationship_link_invites set status='revoked',responded_at=now() where id=i.id;
 end loop;
 for l in select * from public.relationship_links where link_type in('parceria','mentoria') and ended_at is null
   and expires_at<=now() and expiry_notified_at is null for update skip locked loop
   for u in select l.mentor_id union all select l.pupil_id loop
     insert into public.notifications(id,user_id,type,content,read,metadata) values(extensions.gen_random_uuid(),u,'arena_access',
       case l.link_type when 'parceria' then 'Sua parceria expirou. Você pode renovar quando quiser.' else 'Sua mentoria expirou. Você pode renovar quando quiser.' end,
       false,jsonb_build_object('linkId',l.id,'linkType',l.link_type,'relationshipExpired',true));
   end loop;
   update public.relationship_links set expiry_notified_at=now() where id=l.id; n:=n+1;
 end loop;
 perform public.finalize_due_competition_challenges();
 return n;
end;
$$;

-- Reading another person's arenas is authorized only while observation is live.
create or replace function public.can_read_relationship_arena(p_arena_id uuid)
returns boolean language sql stable security definer set search_path=public,auth as $$
 select exists(select 1 from public.relationship_link_arenas s join public.relationship_links l on l.id=s.relationship_link_id
   where s.arena_id=p_arena_id and auth.uid() in(l.mentor_id,l.pupil_id)
     and (l.link_type='competicao' or public.relationship_link_is_live(l)));
$$;
alter policy "Relationship participants can read linked arenas" on public.arenas using(auth.uid()=user_id or public.can_read_relationship_arena(id));
alter policy "Relationship participants can read linked actions" on public.actions using(auth.uid()=user_id or public.can_read_relationship_arena(arena_id));
alter policy "Relationship participants can read linked scheduled tasks" on public.scheduled_tasks using(auth.uid()=user_id or exists(
 select 1 from public.actions a where a.id::text=action_id and public.can_read_relationship_arena(a.arena_id)));
alter policy "Competition participants can read challenges" on public.relationship_competition_challenges using(auth.uid() in(challenger_user_id,opponent_user_id));
alter policy "Participants can read linked relationship arenas" on public.relationship_link_arenas using(exists(
 select 1 from public.relationship_links l where l.id=relationship_link_id and auth.uid() in(l.mentor_id,l.pupil_id)));

-- Only the presentation scope is returned, never the other person's whole profile.
create or replace function public.relationship_arena_scopes()
returns jsonb language sql stable security definer set search_path=public,auth as $$
 select coalesce(jsonb_agg(jsonb_build_object('arena_id',a.id,'cycle',cy.doc,'reset_at',r.reset_at)),'[]')
 from public.arenas a
 left join lateral(select jsonb_build_object('startDate',c.start_date,'endDate',c.end_date) doc
   from public.cycles c where c.user_id=a.user_id and c.report_data is null order by c.created_at desc limit 1) cy on true
 left join lateral(select max(substring(flag from 24)) reset_at from public.user_profiles p,
   jsonb_array_elements_text(coalesce(to_jsonb(p)->'completed_season_missions','[]')) flag
   where p.id=a.user_id and flag like 'free_progress_reset_at:%') r on true
 where public.can_read_relationship_arena(a.id);
$$;

-- All monetary/state transitions go through authenticated, transactional RPCs.
revoke insert,update,delete on public.relationship_links,public.relationship_link_invites,public.relationship_link_arenas,
  public.relationship_competition_challenges,public.relationship_link_visibility from authenticated,anon;
do $$ declare f record; begin
 for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (
   p.proname in('select_relationship_arenas','propose_relationship_v3','hide_relationship_link','manage_duel_copy','relationship_arena_scopes',
     'share_relationship_arena','select_my_mentorship_arena','create_relationship_link_invite','create_competition_invite',
     'respond_relationship_link_invite','renew_relationship_link','resolve_competition_challenge_outcome','cancel_competition_challenge',
     'can_read_relationship_arena')
   or p.proname like '\_competition\_%' escape '\' or p.proname like '\_relationship\_%' escape '\'
   or p.proname in('_install_duel_v3','expire_relationships_v3','finalize_due_competition_challenges',
     'offer_mentorship_arena','respond_mentorship_offer','propose_competition_challenge','respond_competition_challenge','create_competition_challenge','buy_relationship_capacity_slot')) loop
   execute format('revoke all on function %s from public,anon,authenticated',f.sig);
 end loop;
 for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in(
   'select_relationship_arenas','propose_relationship_v3','hide_relationship_link','manage_duel_copy','relationship_arena_scopes',
   'share_relationship_arena','select_my_mentorship_arena','create_relationship_link_invite','create_competition_invite',
   'respond_relationship_link_invite','renew_relationship_link','resolve_competition_challenge_outcome','cancel_competition_challenge','can_read_relationship_arena') loop
   execute format('grant execute on function %s to authenticated',f.sig);
 end loop;
end $$;

-- pg_cron must be installed: a missing scheduler is a failed deployment, not silent success.
select cron.schedule('glyph-relationships-v3','* * * * *','select public.expire_relationships_v3();');
commit;
