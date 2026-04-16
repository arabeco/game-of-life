create table if not exists public.reward_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  description text null,
  is_active boolean not null default true,
  starts_at timestamptz null,
  ends_at timestamptz null,
  max_redemptions integer null,
  per_user_limit integer not null default 1,
  reward_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reward_codes_code_ci_idx
  on public.reward_codes ((lower(code)));

create table if not exists public.reward_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.reward_codes(id) on delete cascade,
  user_id uuid not null,
  code text not null,
  reward_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reward_code_redemptions_code_id_idx
  on public.reward_code_redemptions (code_id, created_at desc);

create index if not exists reward_code_redemptions_user_id_idx
  on public.reward_code_redemptions (user_id, created_at desc);

alter table if exists public.reward_codes enable row level security;
alter table if exists public.reward_code_redemptions enable row level security;

revoke all on table public.reward_codes from public;
revoke all on table public.reward_codes from anon;
revoke all on table public.reward_codes from authenticated;

revoke all on table public.reward_code_redemptions from public;
revoke all on table public.reward_code_redemptions from anon;
revoke all on table public.reward_code_redemptions from authenticated;

drop policy if exists "reward_codes_no_direct_access" on public.reward_codes;
create policy "reward_codes_no_direct_access"
on public.reward_codes
for all
using (false)
with check (false);

drop policy if exists "reward_code_redemptions_read_own" on public.reward_code_redemptions;
create policy "reward_code_redemptions_read_own"
on public.reward_code_redemptions
for select
using (auth.uid() = user_id);

drop policy if exists "reward_code_redemptions_no_direct_write" on public.reward_code_redemptions;
create policy "reward_code_redemptions_no_direct_write"
on public.reward_code_redemptions
for all
using (false)
with check (false);

create or replace function public.redeem_reward_code(p_code text, p_user_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_code text := upper(trim(coalesce(p_code, '')));
  v_reward public.reward_codes%rowtype;
  v_profile public.user_profiles%rowtype;
  v_now timestamptz := now();
  v_total_redemptions integer := 0;
  v_user_redemptions integer := 0;
  v_payload jsonb := '{}'::jsonb;
  v_gold integer := 0;
  v_fragments integer := 0;
  v_premium_days integer := 0;
  v_chest_type text := null;
  v_chest_count integer := 0;
  v_legacy_scene_credits integer := 0;
  v_campaign_quiz_free_credits integer := 0;
  v_campaign_quiz_medium_credits integer := 0;
  v_current_gold integer := 0;
  v_current_fragments integer := 0;
  v_next_gold integer := 0;
  v_next_fragments integer := 0;
  v_current_premium_expires_at timestamptz := null;
  v_next_premium_expires_at timestamptz := null;
  v_reward_summary text := '';
  v_snapshot jsonb := '{}'::jsonb;
  v_index integer := 0;
begin
  if v_uid is null then
    return jsonb_build_object(
      'success', false,
      'code', v_code,
      'error', 'AUTH_REQUIRED'
    );
  end if;

  if auth.uid() is not null and auth.uid() <> v_uid then
    return jsonb_build_object(
      'success', false,
      'code', v_code,
      'error', 'USER_MISMATCH'
    );
  end if;

  if v_code = '' then
    return jsonb_build_object(
      'success', false,
      'code', '',
      'error', 'EMPTY_CODE'
    );
  end if;

  select *
  into v_reward
  from public.reward_codes
  where lower(code) = lower(v_code)
  limit 1;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', v_code,
      'error', 'CODE_NOT_FOUND'
    );
  end if;

  if not coalesce(v_reward.is_active, false) then
    return jsonb_build_object(
      'success', false,
      'code', v_reward.code,
      'error', 'CODE_INACTIVE'
    );
  end if;

  if v_reward.starts_at is not null and v_reward.starts_at > v_now then
    return jsonb_build_object(
      'success', false,
      'code', v_reward.code,
      'error', 'CODE_NOT_STARTED'
    );
  end if;

  if v_reward.ends_at is not null and v_reward.ends_at < v_now then
    return jsonb_build_object(
      'success', false,
      'code', v_reward.code,
      'error', 'CODE_EXPIRED'
    );
  end if;

  select count(*)::integer
  into v_total_redemptions
  from public.reward_code_redemptions
  where code_id = v_reward.id;

  if v_reward.max_redemptions is not null and v_total_redemptions >= v_reward.max_redemptions then
    return jsonb_build_object(
      'success', false,
      'code', v_reward.code,
      'error', 'CODE_LIMIT_REACHED'
    );
  end if;

  select count(*)::integer
  into v_user_redemptions
  from public.reward_code_redemptions
  where code_id = v_reward.id
    and user_id = v_uid;

  if v_user_redemptions >= greatest(1, coalesce(v_reward.per_user_limit, 1)) then
    return jsonb_build_object(
      'success', false,
      'code', v_reward.code,
      'error', 'CODE_ALREADY_REDEEMED'
    );
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = v_uid
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', v_reward.code,
      'error', 'PROFILE_NOT_FOUND'
    );
  end if;

  v_payload := coalesce(v_reward.reward_payload, '{}'::jsonb);
  v_gold := greatest(0, coalesce((v_payload ->> 'gold')::integer, 0));
  v_fragments := greatest(0, coalesce((v_payload ->> 'fragments')::integer, 0));
  v_premium_days := greatest(0, coalesce((v_payload ->> 'premium_days')::integer, 0));
  v_chest_type := nullif(trim(coalesce(v_payload ->> 'chest_type', '')), '');
  v_chest_count := greatest(0, coalesce((v_payload ->> 'chest_count')::integer, 0));
  v_legacy_scene_credits := greatest(0, coalesce((v_payload ->> 'legacy_scene_credits')::integer, 0));
  v_campaign_quiz_free_credits := greatest(0, coalesce((v_payload ->> 'campaign_quiz_free_credits')::integer, 0));
  v_campaign_quiz_medium_credits := greatest(0, coalesce((v_payload ->> 'campaign_quiz_medium_credits')::integer, 0));

  v_current_gold := coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'gold')::integer, v_profile.gold, 0);
  v_current_fragments := coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'fragments')::integer, v_profile.fragments, 0);
  v_next_gold := v_current_gold + v_gold;
  v_next_fragments := v_current_fragments + v_fragments;

  v_current_premium_expires_at := v_profile.premium_expires_at;
  if v_premium_days > 0 then
    v_next_premium_expires_at := greatest(coalesce(v_current_premium_expires_at, v_now), v_now) + make_interval(days => v_premium_days);
  else
    v_next_premium_expires_at := v_current_premium_expires_at;
  end if;

  update public.user_profiles
  set
    gold = v_next_gold,
    fragments = v_next_fragments,
    wallet = jsonb_build_object(
      'gold', v_next_gold,
      'fragments', v_next_fragments
    ),
    is_premium = case
      when v_premium_days > 0 then true
      else coalesce(is_premium, false)
    end,
    subscription_tier = case
      when v_premium_days > 0 then 'premium'
      else subscription_tier
    end,
    premium_expires_at = v_next_premium_expires_at,
    legacy_projection_scene_credits = coalesce(legacy_projection_scene_credits, 0) + v_legacy_scene_credits,
    campaign_quiz_free_credits = coalesce(campaign_quiz_free_credits, 0) + v_campaign_quiz_free_credits,
    campaign_quiz_medium_credits = coalesce(campaign_quiz_medium_credits, 0) + v_campaign_quiz_medium_credits,
    updated_at = now()
  where id = v_uid;

  if v_chest_type is not null and v_chest_count > 0 then
    for v_index in 1..v_chest_count loop
      perform public.grant_chest(v_uid, v_chest_type);
    end loop;
  end if;

  v_snapshot := jsonb_build_object(
    'gold', v_gold,
    'fragments', v_fragments,
    'premium_days', v_premium_days,
    'chest_type', v_chest_type,
    'chest_count', v_chest_count,
    'legacy_scene_credits', v_legacy_scene_credits,
    'campaign_quiz_free_credits', v_campaign_quiz_free_credits,
    'campaign_quiz_medium_credits', v_campaign_quiz_medium_credits
  );

  insert into public.reward_code_redemptions (
    code_id,
    user_id,
    code,
    reward_snapshot
  ) values (
    v_reward.id,
    v_uid,
    v_reward.code,
    v_snapshot
  );

  v_reward_summary := coalesce(v_payload ->> 'summary', '');
  if v_reward_summary = '' then
    v_reward_summary := concat_ws(
      ' · ',
      case when v_gold > 0 then '+' || v_gold::text || ' ouro' else null end,
      case when v_fragments > 0 then '+' || v_fragments::text || ' fragmentos' else null end,
      case when v_premium_days > 0 then '+' || v_premium_days::text || ' dias premium' else null end,
      case when v_chest_type is not null and v_chest_count > 0 then '+' || v_chest_count::text || ' bau ' || v_chest_type else null end,
      case when v_legacy_scene_credits > 0 then '+' || v_legacy_scene_credits::text || ' cena de legado' else null end
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'code', v_reward.code,
    'title', v_reward.title,
    'description', v_reward.description,
    'reward_summary', v_reward_summary,
    'wallet', jsonb_build_object(
      'gold', v_next_gold,
      'fragments', v_next_fragments
    ),
    'premium_days_granted', v_premium_days,
    'chest_type', v_chest_type,
    'chest_count', v_chest_count,
    'legacy_scene_credits_granted', v_legacy_scene_credits,
    'campaign_quiz_free_credits_granted', v_campaign_quiz_free_credits,
    'campaign_quiz_medium_credits_granted', v_campaign_quiz_medium_credits
  );
end;
$$;

revoke all on function public.redeem_reward_code(text, uuid) from public;
grant execute on function public.redeem_reward_code(text, uuid) to authenticated;

insert into public.reward_codes (
  code,
  title,
  description,
  is_active,
  starts_at,
  ends_at,
  max_redemptions,
  per_user_limit,
  reward_payload
)
values (
  'VANGUARDA10',
  'Vanguarda 10',
  'Codigo inicial da Vanguarda. Fica ativo apenas nos primeiros 10 dias desta campanha.',
  true,
  now(),
  now() + interval '10 days',
  null,
  1,
  jsonb_build_object(
    'gold', 50,
    'fragments', 50,
    'premium_days', 10,
    'chest_type', 'Raro',
    'chest_count', 1,
    'summary', 'VANGUARDA10 resgatado: +50 ouro, +50 fragmentos, 10 dias premium e 1 bau raro.'
  )
)
on conflict ((lower(code)))
do update set
  title = excluded.title,
  description = excluded.description,
  is_active = excluded.is_active,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  max_redemptions = excluded.max_redemptions,
  per_user_limit = excluded.per_user_limit,
  reward_payload = excluded.reward_payload,
  updated_at = now();
