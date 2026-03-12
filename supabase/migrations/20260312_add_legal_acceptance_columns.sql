alter table public.user_profiles
    add column if not exists terms_version text,
    add column if not exists terms_accepted_at timestamptz,
    add column if not exists terms_accept_source text,
    add column if not exists privacy_version text,
    add column if not exists privacy_accepted_at timestamptz,
    add column if not exists privacy_accept_source text;

comment on column public.user_profiles.terms_version is 'Version string of the terms summary or terms document accepted by the user.';
comment on column public.user_profiles.terms_accepted_at is 'Timestamp of the first recorded terms acceptance stored by the app.';
comment on column public.user_profiles.terms_accept_source is 'Source that recorded the terms acceptance, such as first_login_overlay or settings_terms_overlay.';
comment on column public.user_profiles.privacy_version is 'Version string of the privacy summary or privacy document accepted by the user.';
comment on column public.user_profiles.privacy_accepted_at is 'Timestamp of the first recorded privacy acceptance stored by the app.';
comment on column public.user_profiles.privacy_accept_source is 'Source that recorded the privacy acceptance, such as first_login_overlay or settings_terms_overlay.';
