-- O COFRE DE CUPONS (10/10/2026).
--
-- Cinco codigos criados DESLIGADOS, para o Afonso rever e soltar aos poucos
-- (story, pista, meta do Insta). O numero no fim e o de vagas, como no
-- VANGUARDA25. Nada aqui vale enquanto `is_active` for false.
--
-- ZERODAY0 e o do Genesis secreto: o premio ainda nao foi decidido, entao ele
-- nasce sem premio e com 7 vagas. Antes de ligar, trocar o reward_payload.
--
-- Para SOLTAR um, quando chegar a hora (exemplo de 24h):
--   update public.reward_codes
--   set is_active = true, starts_at = now(), ends_at = now() + interval '24 hours', updated_at = now()
--   where code = 'FAGULHA30';

insert into public.reward_codes (code, title, description, is_active, max_redemptions, per_user_limit, reward_payload)
select v.code, v.title, v.description, false, v.vagas, 1, v.payload
from (values
  ('PRIMEIRALUZ100', 'Primeira Luz', 'Dia do lançamento.', 100,
    jsonb_build_object('chest_type', 'Incomum', 'chest_count', 1)),
  ('CANDEIA50', 'Candeia', 'Story com uma pista; a resposta é o código.', 50,
    jsonb_build_object('chest_type', 'Incomum', 'chest_count', 1)),
  ('FAGULHA30', 'Fagulha', 'Aparece num story de 24h.', 30,
    jsonb_build_object('gold', 10)),
  ('VIGILIA20', 'Vigília', 'Postado à noite, vale até de manhã.', 20,
    jsonb_build_object('fragments', 10)),
  ('ZERODAY0', 'Zero Day', 'Genesis secreto. Prêmio a decidir antes de ligar.', 7,
    '{}'::jsonb)
) as v(code, title, description, vagas, payload)
where not exists (
  select 1 from public.reward_codes rc where lower(rc.code) = lower(v.code)
);

-- O cofre como ficou.
select code, title, is_active, max_redemptions as vagas, reward_payload
from public.reward_codes
where code in ('PRIMEIRALUZ100', 'CANDEIA50', 'FAGULHA30', 'VIGILIA20', 'ZERODAY0')
order by max_redemptions desc;
