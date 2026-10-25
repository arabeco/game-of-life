-- O CONTADOR DO CODIGO DE LANCAMENTO (25/10/2026).
--
-- O site mostra "faltam X de 100" para o PRIMEIRALUZ100. As tabelas de codigos
-- sao fechadas para o visitante, e devem continuar assim: esta funcao devolve so
-- os numeros, e so de codigo LIGADO. Codigo guardado no cofre (Candeia, Zero Day
-- etc.) nao responde, para o site nao entregar codigo antes da hora. Quem
-- resgatou nunca sai daqui.
--
-- De quebra, o premio do PRIMEIRALUZ100 vira 1 bau Raro (era Incomum). Ouro
-- nao: ouro e dinheiro. O codigo continua desligado ate o dia do lancamento.

update public.reward_codes
set reward_payload = jsonb_build_object('chest_type', 'Raro', 'chest_count', 1),
    updated_at = now()
where code = 'PRIMEIRALUZ100';

create or replace function public.vagas_do_codigo(p_code text)
returns table (codigo text, vagas integer, usadas integer, restantes integer, termina_em timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select
    rc.code,
    rc.max_redemptions,
    (select count(*)::integer from public.reward_code_redemptions r where r.code_id = rc.id),
    greatest(0, rc.max_redemptions - (select count(*)::integer from public.reward_code_redemptions r where r.code_id = rc.id)),
    rc.ends_at
  from public.reward_codes rc
  where lower(rc.code) = lower(trim(p_code))
    and rc.is_active
    and rc.max_redemptions is not null
    and (rc.starts_at is null or rc.starts_at <= now());
$$;

revoke all on function public.vagas_do_codigo(text) from public;
grant execute on function public.vagas_do_codigo(text) to anon, authenticated;

-- Conferencia: o premio novo, e a funcao respondendo vazio enquanto o codigo
-- estiver desligado (o normal antes do lancamento).
select code, is_active, max_redemptions, reward_payload
from public.reward_codes
where code = 'PRIMEIRALUZ100';

select * from public.vagas_do_codigo('PRIMEIRALUZ100');
