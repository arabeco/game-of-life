-- As tres respostas do primeiro uso. Ficam no perfil porque nao sao decoracao
-- do onboarding: oracle_presence governa quanto o Oraculo fala depois, e as
-- outras duas dizem para quem o app esta falando.
--
-- Tudo nulo por padrao: quem ja existe nunca respondeu, e a ausencia tem que
-- ser distinguivel de uma resposta.

alter table public.user_profiles
  add column if not exists onboarding_age_range text,
  add column if not exists onboarding_purpose text,
  add column if not exists oracle_presence text;

-- Vocabulario fechado, para um valor errado falhar na escrita e nao na leitura.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_oracle_presence_check') then
    alter table public.user_profiles
      add constraint user_profiles_oracle_presence_check
      check (oracle_presence is null or oracle_presence in ('discreta', 'equilibrada', 'presente'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_profiles_onboarding_purpose_check') then
    alter table public.user_profiles
      add constraint user_profiles_onboarding_purpose_check
      check (onboarding_purpose is null or onboarding_purpose in ('organizar', 'habitos', 'objetivo', 'retomar'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_profiles_onboarding_age_range_check') then
    alter table public.user_profiles
      add constraint user_profiles_onboarding_age_range_check
      check (onboarding_age_range is null or onboarding_age_range in ('ate_17', '18_24', '25_34', '35_49', '50_mais'));
  end if;
end $$;
