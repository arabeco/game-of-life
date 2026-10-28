-- OS PRECOS DAS CAMPANHAS (28/10/2026, com o Afonso).
--
-- A vitrine mostra so as 15 campanhas escolhidas (CAMPANHAS_NA_VITRINE, no
-- app). Duas sao gratis, de amostra; as basicas ficam baratas e as outras
-- sobem em degraus, para nao ficar tudo na mesma faixa. As antigas continuam
-- no banco com o preco que tinham (quem instalou nao perde); so saem da vitrine.
--
-- price_brl acompanha o ouro (1 ouro = R$ 0,10). Conserta tambem os dois que
-- estavam em R$ 350 por engano.
--
-- Leitura Ativa vira Mente sem Armadilhas e Construcao de Cla vira Circulo
-- Forte quando o conteudo novo entrar (outra migracao); aqui so o preco.
-- Pode ser rodado de novo sem estrago.

begin;

update public.codex_catalog as c
set price_gold = v.ouro,
    price_brl = round(v.ouro / 10.0, 2)
from (values
  -- gratis, de amostra
  ('9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c05'::uuid,   0),  -- Presenca Real
  ('9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c02'::uuid,   0),  -- Leitura Ativa (Mente sem Armadilhas)
  -- basicas
  ('9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c06'::uuid,  40),  -- Detox Digital
  ('9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c04'::uuid,  60),  -- Controle de Impulsos
  ('9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c01'::uuid,  80),  -- Sono de Elite
  -- medias
  ('9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d10'::uuid, 110),  -- Expressao Criativa
  ('9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d08'::uuid, 140),  -- Construcao de Cla (Circulo Forte)
  ('9f31c3d8-7a9a-4d4e-9b36-4f79a5f42c08'::uuid, 160),  -- Estoicismo Aplicado
  ('7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a01'::uuid, 190),  -- Despertar de Ferro
  ('9f31c3d8-7a9a-4d4e-9b36-4f79a5f42d09'::uuid, 220),  -- Financas com Intencao
  -- elite
  ('9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e05'::uuid, 320),  -- Maestria Financeira
  ('9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e04'::uuid, 380),  -- Lideranca sem Cargo
  ('7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a05'::uuid, 440),  -- Construcao de Identidade
  ('9f31c3d8-7a9a-4d4e-9b36-4f79a5f42e03'::uuid, 480),  -- Corpo de Elite
  ('7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a03'::uuid, 550)   -- Foco Blindado
) as v(id, ouro)
where c.id = v.id;

-- Os dois R$ 350 por engano (fora da vitrine, mas o preco tem de bater).
update public.codex_catalog set price_brl = round(price_gold / 10.0, 2)
where id in ('7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a04', '7f31c3d8-7a9a-4d4e-9b36-4f79a5f42a02');

commit;
