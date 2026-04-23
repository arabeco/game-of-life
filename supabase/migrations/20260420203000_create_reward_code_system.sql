create table if not exists public.reward_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text,
  description text,
  reward_summary text,
  is_active boolean not null default true,
  is_repeatable boolean not null default false,
  max_redemptions integer,
  max_redemptions_per_user integer default 1,
  starts_at timestamptz,
  expires_at timestamptz,
  grants jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reward_codes_code_upper check (code = upper(code)),
  constraint reward_codes_max_redemptions_check check (max_redemptions is null or max_redemptions > 0),
  constraint reward_codes_max_redemptions_per_user_check check (max_redemptions_per_user is null or max_redemptions_per_user > 0)
);

create table if not exists public.reward_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_code_id uuid not null references public.reward_codes(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  code_snapshot text not null,
  granted_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reward_code_redemptions_reward_code_idx
  on public.reward_code_redemptions (reward_code_id, created_at desc);

create index if not exists reward_code_redemptions_user_idx
  on public.reward_code_redemptions (user_id, reward_code_id, created_at desc);

alter table public.reward_codes enable row level security;
alter table public.reward_code_redemptions enable row level security;

revoke all on table public.reward_codes from public;
revoke all on table public.reward_codes from anon;
revoke all on table public.reward_codes from authenticated;

revoke all on table public.reward_code_redemptions from public;
revoke all on table public.reward_code_redemptions from anon;
revoke all on table public.reward_code_redemptions from authenticated;

create or replace function public.redeem_reward_code(p_code text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_code public.reward_codes%rowtype;
  v_profile public.user_profiles%rowtype;
  v_now timestamptz := now();
  v_total_redemptions integer := 0;
  v_user_redemptions integer := 0;
  v_gold integer := 0;
  v_fragments integer := 0;
  v_chest_type text := null;
  v_chest_count integer := 0;
  v_item_ids text[] := array[]::text[];
  v_item_id text;
  v_premium_days integer := 0;
  v_membership_tier text := null;
  v_legacy_scene_credits integer := 0;
  v_campaign_quiz_free_credits integer := 0;
  v_campaign_quiz_medium_credits integer := 0;
  v_set_vanguard_welcome boolean := false;
  v_vanguard_payload jsonb := '{}'::jsonb;
  v_granted_payload jsonb := '{}'::jsonb;
  v_wallet jsonb := '{}'::jsonb;
  v_current_gold integer := 0;
  v_current_fragments integer := 0;
  v_next_premium_expires_at timestamptz := null;
begin
  if p_user_id is null then
    return jsonb_build_object(
      'success', false,
      'code', coalesce(upper(trim(p_code)), ''),
      'error', 'EMPTY_USER'
    );
  end if;

  if coalesce(trim(p_code), '') = '' then
    return jsonb_build_object(
      'success', false,
      'code', '',
      'error', 'EMPTY_CODE'
    );
  end if;

  select *
  into v_code
  from public.reward_codes
  where code = upper(trim(p_code))
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', upper(trim(p_code)),
      'error', 'CODE_NOT_FOUND'
    );
  end if;

  if coalesce(v_code.is_active, false) = false then
    return jsonb_build_object(
      'success', false,
      'code', v_code.code,
      'error', 'CODE_INACTIVE'
    );
  end if;

  if v_code.starts_at is not null and v_now < v_code.starts_at then
    return jsonb_build_object(
      'success', false,
      'code', v_code.code,
      'error', 'CODE_NOT_STARTED'
    );
  end if;

  if v_code.expires_at is not null and v_now > v_code.expires_at then
    return jsonb_build_object(
      'success', false,
      'code', v_code.code,
      'error', 'CODE_EXPIRED'
    );
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', v_code.code,
      'error', 'PROFILE_NOT_FOUND'
    );
  end if;

  select count(*)::integer
  into v_total_redemptions
  from public.reward_code_redemptions
  where reward_code_id = v_code.id;

  if v_code.max_redemptions is not null and v_total_redemptions >= v_code.max_redemptions then
    return jsonb_build_object(
      'success', false,
      'code', v_code.code,
      'error', 'CODE_LIMIT_REACHED'
    );
  end if;

  select count(*)::integer
  into v_user_redemptions
  from public.reward_code_redemptions
  where reward_code_id = v_code.id
    and user_id = p_user_id;

  if coalesce(v_code.is_repeatable, false) = false and v_user_redemptions > 0 then
    return jsonb_build_object(
      'success', false,
      'code', v_code.code,
      'error', 'CODE_ALREADY_REDEEMED_BY_USER'
    );
  end if;

  if v_code.max_redemptions_per_user is not null
     and v_user_redemptions >= v_code.max_redemptions_per_user then
    return jsonb_build_object(
      'success', false,
      'code', v_code.code,
      'error', 'CODE_USER_LIMIT_REACHED'
    );
  end if;

  v_gold := greatest(coalesce((v_code.grants ->> 'gold')::integer, 0), 0);
  v_fragments := greatest(coalesce((v_code.grants ->> 'fragments')::integer, 0), 0);
  v_chest_type := nullif(coalesce(v_code.grants ->> 'chest_type', ''), '');
  v_chest_count := greatest(coalesce((v_code.grants ->> 'chest_count')::integer, 0), case when v_chest_type is not null then 1 else 0 end);
  v_premium_days := greatest(coalesce((v_code.grants ->> 'premium_days')::integer, 0), 0);
  v_membership_tier := nullif(coalesce(v_code.grants ->> 'membership_tier', ''), '');
  v_legacy_scene_credits := greatest(coalesce((v_code.grants ->> 'legacy_scene_credits_granted')::integer, 0), 0);
  v_campaign_quiz_free_credits := greatest(coalesce((v_code.grants ->> 'campaign_quiz_free_credits_granted')::integer, 0), 0);
  v_campaign_quiz_medium_credits := greatest(coalesce((v_code.grants ->> 'campaign_quiz_medium_credits_granted')::integer, 0), 0);
  v_set_vanguard_welcome := coalesce((v_code.grants ->> 'set_vanguard_welcome')::boolean, false);

  select coalesce(array_agg(value), array[]::text[])
  into v_item_ids
  from jsonb_array_elements_text(coalesce(v_code.grants -> 'item_ids', '[]'::jsonb)) as value;

  if v_gold > 0 or v_fragments > 0 then
    v_wallet := coalesce(v_profile.wallet, '{}'::jsonb);
    v_current_gold := coalesce((v_wallet ->> 'gold')::integer, 0);
    v_current_fragments := coalesce((v_wallet ->> 'fragments')::integer, 0);

    update public.user_profiles
    set wallet = jsonb_build_object(
      'gold', v_current_gold + v_gold,
      'fragments', v_current_fragments + v_fragments
    )
    where id = p_user_id;
  end if;

  if v_chest_type is not null and v_chest_count > 0 then
    for v_current_gold in 1..v_chest_count loop
      perform public.grant_chest(p_user_id, v_chest_type);
    end loop;
  end if;

  if array_length(v_item_ids, 1) is not null then
    foreach v_item_id in array v_item_ids loop
      perform public._starter_reward_grant_inventory_item_once(p_user_id, v_item_id);
    end loop;
  end if;

  if v_legacy_scene_credits > 0 or v_campaign_quiz_free_credits > 0 or v_campaign_quiz_medium_credits > 0 then
    update public.user_profiles
    set
      legacy_projection_scene_credits = coalesce(legacy_projection_scene_credits, 0) + v_legacy_scene_credits,
      campaign_quiz_free_credits = coalesce(campaign_quiz_free_credits, 0) + v_campaign_quiz_free_credits,
      campaign_quiz_medium_credits = coalesce(campaign_quiz_medium_credits, 0) + v_campaign_quiz_medium_credits
    where id = p_user_id;
  end if;

  if v_premium_days > 0 then
    v_next_premium_expires_at := greatest(coalesce(v_profile.premium_expires_at, v_now), v_now) + make_interval(days => v_premium_days);

    update public.user_profiles
    set
      is_premium = true,
      premium_expires_at = v_next_premium_expires_at,
      subscription_tier = coalesce(nullif(v_membership_tier, ''), subscription_tier, 'premium')
    where id = p_user_id;
  end if;

  if v_set_vanguard_welcome then
    v_vanguard_payload :=
      coalesce(v_code.grants -> 'vanguard_payload', '{}'::jsonb)
      || jsonb_build_object(
        'inviteCode', v_code.code,
        'gold', v_gold,
        'chestType', v_chest_type,
        'itemIds', to_jsonb(v_item_ids)
      );

    update public.user_profiles
    set
      vanguard_welcome_pending = true,
      vanguard_welcome_payload = v_vanguard_payload
    where id = p_user_id;
  end if;

  v_granted_payload := jsonb_build_object(
    'gold', v_gold,
    'fragments', v_fragments,
    'chest_type', v_chest_type,
    'chest_count', v_chest_count,
    'item_ids', to_jsonb(v_item_ids),
    'premium_days_granted', v_premium_days,
    'legacy_scene_credits_granted', v_legacy_scene_credits,
    'campaign_quiz_free_credits_granted', v_campaign_quiz_free_credits,
    'campaign_quiz_medium_credits_granted', v_campaign_quiz_medium_credits,
    'vanguard_welcome_pending', v_set_vanguard_welcome
  );

  insert into public.reward_code_redemptions (
    reward_code_id,
    user_id,
    code_snapshot,
    granted_payload
  ) values (
    v_code.id,
    p_user_id,
    v_code.code,
    v_granted_payload
  );

  return jsonb_build_object(
    'success', true,
    'code', v_code.code,
    'title', coalesce(v_code.title, 'Codigo resgatado'),
    'description', coalesce(v_code.description, 'Seu codigo foi aplicado com sucesso.'),
    'reward_summary', coalesce(v_code.reward_summary, 'Recompensas liberadas com sucesso.'),
    'wallet', jsonb_build_object(
      'gold', coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'gold')::integer, 0) + v_gold,
      'fragments', coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'fragments')::integer, 0) + v_fragments
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
  reward_summary,
  is_active,
  is_repeatable,
  max_redemptions,
  max_redemptions_per_user,
  grants
) values (
  'VANGUARDA25',
  'Pacote da Vanguarda',
  'Pacote de ativacao para os primeiros testers convidados.',
  'Pacote da Vanguarda liberado com sucesso.',
  true,
  false,
  25,
  1,
  jsonb_build_object(
    'gold', 50,
    'chest_type', 'Incomum',
    'chest_count', 1,
    'item_ids', jsonb_build_array(
      'item_border_vanguarda_01',
      'item_banner_vanguarda_01',
      'dreads',
      'mullet_topete'
    ),
    'set_vanguard_welcome', true,
    'vanguard_payload', jsonb_build_object(
      'eyebrow', 'Codigo de ativacao',
      'title', 'Bem-vindo a Vanguarda',
      'summary', 'Seu codigo de teste foi validado e o pacote da Vanguarda ja foi integrado ao seu perfil.',
      'buttonLabel', 'Entrar na Vanguarda',
      'itemSectionTitle', 'Itens da Vanguarda',
      'emptyMessage', 'Seu pacote da Vanguarda ja foi entregue ao Arsenal.',
      'rewardHighlightsTitle', 'Entregue agora',
      'rewardHighlights', jsonb_build_array(
        jsonb_build_object('label', 'Ouro', 'value', '+50', 'detail', 'Reserva inicial da Vanguarda.', 'tone', 'gold'),
        jsonb_build_object('label', 'Bau', 'value', 'Incomum', 'detail', 'Entrega inicial do codigo de ativacao.', 'tone', 'cyan'),
        jsonb_build_object('label', 'Arsenal', 'value', 'Kit Vanguarda', 'detail', 'Borda, banner e itens de vitrine ja foram adicionados.', 'tone', 'emerald')
      )
    )
  )
)
on conflict (code) do update
set
  title = excluded.title,
  description = excluded.description,
  reward_summary = excluded.reward_summary,
  is_active = excluded.is_active,
  is_repeatable = excluded.is_repeatable,
  max_redemptions = excluded.max_redemptions,
  max_redemptions_per_user = excluded.max_redemptions_per_user,
  grants = excluded.grants,
  updated_at = now();
