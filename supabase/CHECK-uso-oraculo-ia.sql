-- Uso do Oraculo com IA desde o lancamento. So leitura.

-- 1) Por dia: quantas pessoas usaram, quantas mensagens, e quantas bateram o limite.
select u.dia,
       count(*) as pessoas,
       sum(u.usadas) as mensagens,
       count(*) filter (where u.usadas >= public.oraculo_ia_limite(u.user_id)) as bateram_o_limite
from oraculo_ia_uso u
where u.usadas > 0
group by u.dia
order by u.dia desc;

-- 2) Por plano, nos ultimos 7 dias: gratis x Premium x Platinum/staff.
select case public.oraculo_ia_limite(u.user_id) when 3 then 'gratis' when 15 then 'premium' else 'platinum/staff' end as plano,
       count(distinct u.user_id) as pessoas,
       sum(u.usadas) as mensagens,
       round(avg(u.usadas), 1) as media_por_dia_usado
from oraculo_ia_uso u
where u.usadas > 0 and u.dia >= public.oraculo_ia_dia() - 6
group by 1
order by 1;
