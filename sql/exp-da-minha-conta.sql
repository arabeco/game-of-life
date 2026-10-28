-- DE ONDE VEIO A EXP DA CONTA (28/10/2026). So leitura: nao muda nada.
-- Uma linha por fonte. "Total no perfil" e o que a patente le; as outras
-- linhas explicam de onde ele veio. Missao, pacto e secreta pagam direto no
-- perfil (nao passam pelo ciclo). Ciclo ABERTO ainda nao foi pago: a EXP dele
-- so entra no total quando o ciclo fecha.
with eu as (select 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid as id),
segredos(regra, exp) as (values
    ('disciplinado', 500),
    ('popular', 500),
    ('veterano', 500),
    ('imparavel', 1000),
    ('mistico', 1000),
    ('transcendente', 3000),
    ('celestial', 3000),
    ('guardia', 3000),
    ('oraculo', 1000),
    ('lenda-viva', 3000),
    ('escriba', 300),
    ('maratona', 500),
    ('anciao', 1000),
    ('campeao', 3000),
    ('imperador', 6000),
    ('sereno', 500),
    ('alvorada', 1000),
    ('prisma', 1000),
    ('profeta', 3000),
    ('pedra-da-lua', 6000),
    ('popular-de-verdade', 1000),
    ('veterano-de-um-ano', 1000),
    ('disciplinado-cem-dias', 3000),
    ('imparavel-cem-dias', 3000),
    ('cronista', 500),
    ('inabalavel', 1000),
    ('ritual', 1000),
    ('trofeus', 1000),
    ('mil-e-um', 3000),
    ('liturgia', 3000),
    ('galeria', 3000),
    ('era', 6000),
    ('fornalha', 6000)
),
missoes(missao, exp) as (values
    ('quest-wanderer', 500),
    ('quest-scholar', 500),
    ('quest-warrior', 300),
    ('clan-genesis-socializar', 0),
    ('zenite-quest-cume', 2400),
    ('zenite-quest-ritmo', 2250),
    ('zenite-quest-claridade', 2100),
    ('eclipse-quest-vigilia', 2400),
    ('eclipse-quest-travessia', 2250),
    ('eclipse-quest-silencio', 2100),
    ('egide-quest-base', 2400),
    ('egide-quest-mapa', 2250),
    ('egide-quest-vigilia', 2100),
    ('aurora-quest-caminhante', 2400),
    ('aurora-quest-leitor', 2250),
    ('aurora-quest-monge', 2100),
    ('zenite-ii-quest-forja', 2500),
    ('zenite-ii-quest-pulso', 2400),
    ('zenite-ii-quest-vista', 2200),
    ('sm_genesis_meta_1', 500),
    ('sq_1', 2250),
    ('sq_2', 1800),
    ('sq_3', 1125),
    ('system-first-arena-gold', 300),
    ('tutorial-quest', 25),
    ('system-first-cycle', 25),
    ('system-first-campaign', 25),
    ('system-first-cycle-report', 25),
    ('system-first-arena-created', 25),
    ('system-first-action-done', 25),
    ('system-first-planned-day', 25),
    ('system-first-equipped-item', 25),
    ('system-first-individual-mission', 25),
    ('system-first-clan', 25)
),
ciclos as (
  select c.id, c.start_date, c.end_date, c.report_data,
         coalesce((c.report_data->>'exp_gained')::numeric, (c.report_data->'metrics'->>'exp_gained')::numeric,
                  (c.report_data->>'expGained')::numeric, (c.report_data->'metrics'->>'expGained')::numeric, 0) as exp_pago,
         coalesce(c.banked_exp_bonus, 0) as guardado
  from public.cycles c, eu where c.user_id = eu.id
),
dias as (
  select d.date, coalesce(d.exp_deposited, 0) as exp
  from public.daily_commitments d, eu
  where d.user_id = eu.id and coalesce(d.exp_deposited, 0) > 0
),
marcas as (
  select jsonb_array_elements_text(coalesce(to_jsonb(p)->'completed_season_missions', '[]'::jsonb)) as marca
  from public.user_profiles p, eu where p.id = eu.id
)
select 1 as ordem, 'Total no perfil (o que a patente le)' as fonte, null::bigint as quantas,
       (select (nobility->>'exp')::numeric from public.user_profiles p, eu where p.id = eu.id) as exp,
       (select nobility->>'rankId' from public.user_profiles p, eu where p.id = eu.id) as detalhe
union all
select 2, 'Ciclos fechados (pago no fecho)', count(*), sum(exp_pago),
       string_agg(start_date::date::text || ': ' || exp_pago::text, ' | ' order by start_date)
from ciclos where report_data is not null
union all
select 3, 'Ciclo aberto: dias ja julgados (ainda nao pago)', count(*), sum(d.exp), null
from dias d where exists (select 1 from ciclos c where c.report_data is null and d.date between c.start_date::date and c.end_date::date)
union all
select 4, 'Ciclo aberto: missoes guardadas (ainda nao pago)', count(*), sum(guardado), null
from ciclos where report_data is null
union all
select 5, 'Dias julgados fora de ciclo (rodada)', count(*), sum(d.exp), null
from dias d where not exists (select 1 from ciclos c where d.date between c.start_date::date and c.end_date::date)
union all
select 6, 'Conquistas secretas (pago direto)', count(*), sum(s.exp), string_agg(s.regra, ', ' order by s.exp desc)
from marcas m join segredos s on m.marca = 'segredo-exp:' || s.regra
union all
select 7, 'Missoes de temporada e do sistema (pago direto)', count(*), sum(mi.exp), string_agg(mi.missao || ' ' || mi.exp, ', ' order by mi.exp desc)
from marcas m join missoes mi on m.marca = mi.missao
union all
select 8, 'Pactos de arena (100/300/500, pago direto)', count(*), null, null
from marcas m where m.marca like 'pact%' or m.marca like 'arena-pact%'
union all
select 9, 'Outras marcas (sem valor conhecido)', count(*), null, string_agg(m.marca, ', ')
from marcas m
where left(m.marca, 2) <> '__' and m.marca not like 'segredo%' and m.marca not like 'guardada:%'
  and not exists (select 1 from missoes mi where mi.missao = m.marca)
  and m.marca not like 'pact%' and m.marca not like 'arena-pact%'
union all
select 10, 'Duelos vencidos (pago direto)', count(*), sum(coalesce(r.winner_bonus_xp, 0)), null
from public.relationship_competition_challenges r, eu
where r.winner_user_id = eu.id and r.reward_granted_at is not null
union all
select 11, 'Dias julgados SEM deposito anotado (pagos antes do registro existir)', count(*), null,
       min(d.date)::text || ' a ' || max(d.date)::text
from public.daily_commitments d, eu
where d.user_id = eu.id and coalesce(d.exp_deposited, 0) = 0
  and not exists (select 1 from ciclos c where c.report_data is null and d.date between c.start_date::date and c.end_date::date)
order by ordem;
