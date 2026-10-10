-- O VANGUARDA25 SEM O PROGRAMA DE 14 DIAS, E COM 25 DE OURO (10/10/2026).
--
-- O programa de check-in era para a turma do teste fechado. Saem as quatro
-- chaves beta_program_*: sem elas o resgate nao abre programa nenhum, e o
-- bonus do fim deixa de existir junto.
--
-- O ouro cai de 50 para 25 em todo lugar onde o pacote diz o numero: na
-- chave `gold` (o que entra de verdade) e, se houver, no modal de boas-vindas
-- (`vanguard_payload.gold` e o destaque "Ouro"). Destaque que fale do programa
-- sai do modal.
--
-- Roda uma vez. O `returning` mostra o pacote como ficou: me manda.

with novo as (
  select
    id,
    (reward_payload
      - 'beta_program_key' - 'beta_program_label'
      - 'beta_program_days' - 'beta_program_reward_gold')
    || jsonb_build_object('gold', 25) as p
  from public.reward_codes
  where code = 'VANGUARDA25'
)
update public.reward_codes rc
set
  reward_payload = case
    when jsonb_typeof(novo.p -> 'vanguard_payload') = 'object' then
      jsonb_set(
        novo.p,
        '{vanguard_payload}',
        ((novo.p -> 'vanguard_payload') - 'rewardHighlights')
        || jsonb_build_object('gold', 25)
        || case
          when jsonb_typeof(novo.p -> 'vanguard_payload' -> 'rewardHighlights') = 'array' then
            jsonb_build_object('rewardHighlights', coalesce((
              select jsonb_agg(
                case when h ->> 'label' = 'Ouro' then h || jsonb_build_object('value', '+25') else h end
              )
              from jsonb_array_elements(novo.p -> 'vanguard_payload' -> 'rewardHighlights') as h
              where coalesce(h ->> 'label', '') || ' ' || coalesce(h ->> 'detail', '')
                !~* '(programa|beta|check-?in|dias seguidos|14 dias|cadeia)'
            ), '[]'::jsonb))
          else '{}'::jsonb
        end
      )
    else novo.p
  end,
  updated_at = now()
from novo
where rc.id = novo.id
returning rc.code, jsonb_pretty(rc.reward_payload) as pacote;
