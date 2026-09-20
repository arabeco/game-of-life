-- O VANGUARDA25 existe mesmo? Roda isto e me manda as tres tabelas.
--
-- Por que esta pergunta existe: o repositorio semeia o codigo VANGUARDA10, e o
-- patch `sql/vanguarda25_beta_program_patch.sql` faz
--
--     update public.reward_codes ... where upper(code) = 'VANGUARDA25'
--
-- Se o VANGUARDA25 nunca foi inserido, esse update rodou sem erro nenhum e
-- atualizou ZERO linhas. Update que nao acha nada nao reclama.
--
-- Isto aqui nao muda nada. So le.

-- 1. Os codigos que existem, e o que cada um promete.
select
  code,
  title,
  is_active,
  starts_at,
  ends_at,
  case
    when ends_at is not null and ends_at < now() then 'VENCIDO'
    when starts_at > now() then 'ainda nao comecou'
    when not is_active then 'desligado'
    else 'valendo'
  end as situacao,
  max_redemptions,
  per_user_limit,
  reward_payload ->> 'gold' as ouro,
  reward_payload ->> 'fragments' as fragmentos,
  reward_payload ->> 'premium_days' as dias_premium,
  reward_payload ->> 'chest_type' as bau,
  reward_payload ->> 'beta_program_key' as programa_beta,
  reward_payload ->> 'beta_program_days' as dias_do_programa
from public.reward_codes
order by code;

-- 2. Quem ja resgatou o que.
select
  code,
  count(*) as resgates,
  count(distinct user_id) as pessoas,
  min(created_at) as primeiro,
  max(created_at) as ultimo
from public.reward_code_redemptions
group by code
order by resgates desc;

-- 3. O modal de boas-vindas da Vanguarda: quem esta com ele pendente.
select
  count(*) filter (where vanguard_welcome_pending) as com_modal_pendente,
  count(*) filter (where vanguard_welcome_shown_at is not null) as ja_viram,
  count(*) filter (where vanguard_welcome_payload is not null
                     and vanguard_welcome_payload <> '{}'::jsonb) as com_pacote_gravado
from public.user_profiles;
