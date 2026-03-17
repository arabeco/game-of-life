
-- FIX MENTORSHIP PREMIUM TRIGGER
-- Currently, it checks if the RECIPIENT is premium, but it should check if the SENDER (Mentor) is premium.

create or replace function public.enforce_premium_mentoria_invites()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- Only care about mentorship type
  if coalesce(new.link_type, '') <> 'mentoria' then
    return new;
  end if;

  -- The Mentor is the one initiating (sender_id)
  if new.sender_id is null then
    raise exception 'SENDER_ID_REQUIRED';
  end if;

  -- Check if the SENDER has premium/mentor access
  if not public._codex_user_has_mentor_access(new.sender_id) then
    raise exception 'MENTOR_PREMIUM_REQUIRED';
  end if;

  return new;
end;
$$;
