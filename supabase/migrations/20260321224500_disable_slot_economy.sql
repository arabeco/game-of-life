update public.user_profiles
set
  codex_creation_slots_purchased = 0,
  partnership_slots_purchased = 0,
  competition_slots_purchased = 0,
  mentor_slots_purchased = 0,
  linked_arena_slots_purchased = 0,
  updated_at = now()
where coalesce(codex_creation_slots_purchased, 0) <> 0
   or coalesce(partnership_slots_purchased, 0) <> 0
   or coalesce(competition_slots_purchased, 0) <> 0
   or coalesce(mentor_slots_purchased, 0) <> 0
   or coalesce(linked_arena_slots_purchased, 0) <> 0;

create or replace function public.buy_codex_creation_slot()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  raise exception 'CAMPAIGN_CREATION_SLOTS_DISABLED';
end;
$$;

revoke all on function public.buy_codex_creation_slot() from public;
grant execute on function public.buy_codex_creation_slot() to authenticated;

create or replace function public.buy_relationship_capacity_slot(
  p_slot_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  raise exception 'RELATIONSHIP_CAPACITY_DISABLED';
end;
$$;

revoke all on function public.buy_relationship_capacity_slot(text) from public;
grant execute on function public.buy_relationship_capacity_slot(text) to authenticated;
