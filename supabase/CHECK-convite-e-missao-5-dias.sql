-- Qual versao do convite e da missao dos dias esta no banco? So leitura.
select
  (select bool_or(prosrc like '%Incomum%') from pg_proc where proname = 'receber_premio_de_convite') as convite_barato,
  (select bool_or(prosrc like '%count(*) >= 5%') from pg_proc where proname = 'claim_glyph_progress_gold') as missao_5_dias,
  exists (select 1 from pg_trigger where tgname = 'avisar_amigo_completou_5_dias') as sobrou_versao_anterior;
