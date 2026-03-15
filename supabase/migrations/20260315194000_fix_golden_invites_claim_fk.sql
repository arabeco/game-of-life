-- Golden invite claims must bind to auth.users during the hold-state flow.
-- The Bilhete Dourado is validated before public.user_profiles exists.

update public.golden_invites gi
set claimed_by_user_id = null
where claimed_by_user_id is not null
  and not exists (
    select 1
    from auth.users au
    where au.id = gi.claimed_by_user_id
  );

alter table public.golden_invites
drop constraint if exists golden_invites_claimed_by_user_id_fkey;

alter table public.golden_invites
add constraint golden_invites_claimed_by_user_id_fkey
foreign key (claimed_by_user_id)
references auth.users(id)
on delete set null;
