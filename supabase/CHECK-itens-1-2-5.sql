-- CHECAGEM — só lê, não altera nada.
--
-- Os itens 1, 2 e 5 do checklist, conferidos na SUA conta, sem precisar testar
-- nada à mão. O id abaixo é o único lugar a mudar.
--
-- O que dá e o que não dá:
--
--   1  DÁ, e melhor que testar. A regra do pagamento em dobro é aritmética, e a
--      aritmética ficou gravada em todo ciclo que você já fechou. Cada linha
--      abaixo é um ciclo do seu histórico, com a conta refeita.
--   2  DÁ PELA METADE. O saldo da rodada dá para ver; se ele foi para o perfil
--      indevidamente, não — isso aconteceu no app e não deixou registro de onde
--      veio.
--   5  DÁ, e pega justamente o defeito antigo: se arrastar ainda salvasse, você
--      veria dezenas de marcações no mesmo minuto.
--
-- A fórmula do item 1 é a mesma que o app usa para fechar o ciclo:
--
--     exp_gained = soma dos dias julgados + banked_exp_bonus + bônus premium
--
-- O defeito somava a base recalculada por cima disso, então ciclo fechado com o
-- app antigo aparece perto do DOBRO. Ciclo fechado a partir da 1.0.81 tem de
-- bater. Ver os dois lados aqui é a prova mais forte que existe: o mesmo banco,
-- antes e depois.

with alvo as (
  select 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid as uid
),
fechados as (
  select
    c.id,
    c.name,
    c.start_date,
    c.end_date,
    coalesce(c.banked_exp_bonus, 0) as banked,
    -- O relatorio grava em snake_case, e o campo vive na raiz ou dentro de
    -- `metrics` dependendo da versao que fechou o ciclo. Os dois sao olhados.
    coalesce(
      nullif(c.report_data ->> 'exp_gained', '')::numeric,
      nullif(c.report_data -> 'metrics' ->> 'exp_gained', '')::numeric,
      0
    ) as exp_relatorio,
    coalesce(
      nullif(c.report_data ->> 'premium_bonus_pts', '')::numeric,
      nullif(c.report_data -> 'metrics' ->> 'premium_bonus_pts', '')::numeric,
      0
    ) as bonus_premium
  from public.cycles c, alvo
  where c.user_id = alvo.uid
    and c.report_data is not null
),
com_dias as (
  select
    f.*,
    coalesce((
      select sum(dc.exp_deposited)
      from public.daily_commitments dc, alvo
      where dc.user_id = alvo.uid
        and dc.stage = 'judgment'
        and dc.date >= f.start_date
        and dc.date <= f.end_date
    ), 0) as soma_dos_dias
  from fechados f
)

-- ── ITEM 1 ───────────────────────────────────────────────────────────────────

select
  format('1. ciclo "%s" (%s)', left(coalesce(name, 'sem nome'), 24), end_date) as item,
  case
    when exp_relatorio = 0 then 'SEM EXP NO RELATORIO — ciclo vazio ou formato antigo'
    when abs(exp_relatorio - (soma_dos_dias + banked + bonus_premium)) <= 1 then 'OK — bate'
    when exp_relatorio >= (soma_dos_dias + banked + bonus_premium) * 1.7 then 'DOBRO — fechado com o app antigo'
    else 'DIFERENTE — vale olhar'
  end as situacao,
  format('relatorio %s · esperado %s (dias %s + banked %s + premium %s)',
         exp_relatorio, soma_dos_dias + banked + bonus_premium,
         soma_dos_dias, banked, bonus_premium) as detalhe
from com_dias

union all

-- ── ITEM 2 ───────────────────────────────────────────────────────────────────
-- Dias julgados que nao caem dentro de nenhum ciclo: e exatamente a EXP que a
-- rodada livre tem de estar guardando para pagar no "Concluir rodada".

select
  '2. dias fora de ciclo (a rodada)',
  case when coalesce((
         select count(*) from public.daily_commitments dc, alvo
         where dc.user_id = alvo.uid and dc.stage = 'judgment'
           and coalesce(dc.exp_deposited, 0) > 0
           and not exists (
             select 1 from public.cycles c
             where c.user_id = dc.user_id
               and dc.date >= c.start_date and dc.date <= c.end_date)
       ), 0) > 0
       then 'HA SALDO NA RODADA — o Concluir rodada tem o que pagar'
       else 'NADA FORA DE CICLO — ou voce sempre jogou com ciclo, ou nao ha o que conferir' end,
  coalesce((
    select format('%s dias, %s de EXP, do %s ao %s',
             count(*), sum(coalesce(dc.exp_deposited, 0)), min(dc.date), max(dc.date))
    from public.daily_commitments dc, alvo
    where dc.user_id = alvo.uid and dc.stage = 'judgment'
      and coalesce(dc.exp_deposited, 0) > 0
      and not exists (
        select 1 from public.cycles c
        where c.user_id = dc.user_id
          and dc.date >= c.start_date and dc.date <= c.end_date)
  ), '—')

union all

-- ── ITEM 5 ───────────────────────────────────────────────────────────────────
-- O defeito era salvar a CADA movimento do slider. Se ele voltasse, apareceriam
-- dezenas de linhas no mesmo minuto: um arrasto sozinho geraria mais marcacoes
-- do que uma semana inteira de uso honesto.

select
  '5. humor: arrastar nao salva',
  case
    when coalesce((select count(*) from public.mood_entries m, alvo where m.user_id = alvo.uid), 0) = 0
      then 'NENHUMA MARCACAO — nao da para concluir nada ainda'
    when coalesce((
      select max(n) from (
        select count(*) as n from public.mood_entries m, alvo
        where m.user_id = alvo.uid
        group by date_trunc('minute', m.recorded_at)
      ) t), 0) > 5
      then 'SUSPEITO — muitas marcacoes no mesmo minuto, parece arrasto salvando'
    else 'OK — nenhuma rajada; o registro e um ato deliberado'
  end,
  coalesce((
    select format('%s marcacoes · pico de %s no mesmo minuto · ultima em %s · %s bastam para o grafico',
             count(*),
             (select max(n) from (
                select count(*) as n from public.mood_entries m2, alvo a2
                where m2.user_id = a2.uid
                group by date_trunc('minute', m2.recorded_at)) t),
             to_char(max(m.recorded_at) at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI'),
             case when count(*) >= 2 then 'as 2 que ja existem' else 'faltam ' || (2 - count(*))::text end)
    from public.mood_entries m, alvo where m.user_id = alvo.uid
  ), 'nenhuma marcacao ainda')

order by 1;
