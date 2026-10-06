-- Smoke check somente leitura da migration relationship_lifecycle_v3.
-- Nao cria convite, nao cobra ouro, nao troca arena e nao executa o cron.
BEGIN TRANSACTION READ ONLY;
SET LOCAL TIME ZONE 'UTC';

WITH expected(name, ok, detail) AS (
  VALUES
    ('tabela_visibilidade', to_regclass('public.relationship_link_visibility') is not null,
      'relationship_link_visibility existe'),
    ('coluna_renovacao', exists (select 1 from information_schema.columns where table_schema='public' and table_name='relationship_link_invites' and column_name='renewal_link_id'),
      'relationship_link_invites.renewal_link_id existe'),
    ('coluna_snapshot_acoes', exists (select 1 from information_schema.columns where table_schema='public' and table_name='relationship_link_invites' and column_name='actions_snapshot'),
      'relationship_link_invites.actions_snapshot existe'),
    ('preco_mentoria', public.relationship_link_price('mentoria', 1) = 75,
      'mentoria = 75'),
    ('preco_parceria', public.relationship_link_price('parceria', 1) = 50,
      'parceria = 50'),
    ('preco_competicao', public.relationship_link_price('competicao', 1) = 50,
      'competicao = 50'),
    ('funcao_selecao', to_regprocedure('public.select_relationship_arenas(uuid,uuid[])') is not null,
      'seleção atômica existe'),
    ('funcao_proposta', to_regprocedure('public.propose_relationship_v3(uuid,text,uuid,integer,uuid,uuid)') is not null,
      'proposta/reserva existe'),
    ('funcao_copia', to_regprocedure('public.manage_duel_copy(uuid,text)') is not null,
      'copiar/excluir cópia existe'),
    ('funcao_expiracao', to_regprocedure('public.expire_relationships_v3()') is not null,
      'expiração existe'),
    ('cron_job', exists (select 1 from cron.job where jobid = 6 and command ilike '%expire_relationships_v3%'),
      'job 6 chama expire_relationships_v3'),
    ('cron_ativo', exists (select 1 from cron.job where jobid = 6 and active),
      'job 6 está ativo'),
    ('sem_funcao_completion_antiga', to_regprocedure('public.mark_relationship_arena_completed(uuid)') is not null,
      'função de compatibilidade de conclusão existe')
)
SELECT name, ok, detail FROM expected ORDER BY name;

-- Resumo do seu vínculo atual: deve continuar existindo, sem alterar nada.
SELECT
  l.id,
  l.link_type,
  l.ended_at,
  l.expires_at,
  CASE
    WHEN l.ended_at IS NOT NULL THEN 'encerrado'
    WHEN l.expires_at IS NOT NULL AND l.expires_at <= now() THEN 'expirado'
    ELSE 'ativo'
  END AS estado,
  count(rla.id)::integer AS arenas_compartilhadas
FROM public.relationship_links l
LEFT JOIN public.relationship_link_arenas rla ON rla.relationship_link_id = l.id
WHERE l.mentor_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid
   OR l.pupil_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid
GROUP BY l.id
ORDER BY l.created_at DESC;

COMMIT;
