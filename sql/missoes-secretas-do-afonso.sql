-- Quais missoes secretas a conta descobriu, quanto EXP cada uma pagou (pela
-- raridade de 27/10/2026) e o EXP total de agora. As marcas nao guardam data:
-- "segredo:<id>" e a descoberta, "segredo-exp:<id>" e o EXP ja pago.
with perfil as (
  select to_jsonb(p) as p
  from public.user_profiles p
  where p.id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
),
marcas as (
  select m as marca
  from perfil, jsonb_array_elements_text(coalesce(p->'completed_season_missions', '[]'::jsonb)) m
  where m like 'segredo%'
),
valor (id, nome, exp) as (values
  ('escriba', 'Escriba', 300),
  ('disciplinado', 'Primeiro Selo', 500), ('popular', 'Enturmado', 500), ('veterano', 'Estações', 500),
  ('maratona', 'Maratona', 500), ('sereno', 'Sereno', 500), ('cronista', 'Cronista', 500),
  ('imparavel', 'Constante', 1000), ('mistico', 'Místico', 1000), ('alvorada', 'Alvorada', 1000),
  ('prisma', 'Prisma', 1000), ('anciao', 'Ancião', 1000), ('oraculo', 'Oráculo', 1000),
  ('popular-de-verdade', 'Popular', 1000), ('veterano-de-um-ano', 'Veterano', 1000),
  ('inabalavel', 'Inabalável', 1000), ('ritual', 'Ritual', 1000), ('trofeus', 'Troféus', 1000),
  ('celestial', 'Celestial', 3000), ('guardia', 'Guardiã', 3000), ('campeao', 'Campeão', 3000),
  ('transcendente', 'Transcendente', 3000), ('profeta', 'Profeta', 3000), ('lenda-viva', 'Lenda Viva', 3000),
  ('disciplinado-cem-dias', 'Disciplinado', 3000), ('imparavel-cem-dias', 'Imparável', 3000),
  ('mil-e-um', 'Mil e Um', 3000), ('liturgia', 'Liturgia', 3000), ('galeria', 'Galeria', 3000),
  ('imperador', 'Imperador', 6000), ('pedra-da-lua', 'Pedra da Lua', 6000),
  ('era', 'Era', 6000), ('fornalha', 'Fornalha', 6000)
)
select v.nome, v.exp,
       exists (select 1 from marcas where marca = 'segredo-exp:' || v.id) as exp_pago
from valor v
where exists (select 1 from marcas where marca = 'segredo:' || v.id)
union all
select '— EXP total da conta agora', ((select p->'nobility'->>'exp' from perfil))::numeric::int, null
order by 2 desc;
