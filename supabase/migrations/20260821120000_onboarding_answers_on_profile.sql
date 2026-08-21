-- Duas das tres respostas do primeiro uso. A terceira, a presenca do Oraculo,
-- NAO mora aqui: ela ja vive em oracle_preferences.presence_level, que o portao
-- de fala e o modal de ajustes leem. Guardar tambem no perfil criaria duas
-- verdades sobre a mesma coisa.
--
-- Nulo por padrao: quem ja existe nunca respondeu, e a ausencia tem que ser
-- distinguivel de uma resposta.

alter table public.user_profiles
  add column if not exists onboarding_age_range text,
  add column if not exists onboarding_purpose text;

-- oracle_presence foi criada por engano numa versao anterior desta migracao.
alter table public.user_profiles drop column if exists oracle_presence;

-- Vocabulario fechado, para um valor errado falhar na escrita e nao na leitura.
do $$
begin
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
