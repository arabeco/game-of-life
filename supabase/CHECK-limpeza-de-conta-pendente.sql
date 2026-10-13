-- LIMPEZA DE CONTA QUE PAROU NO MEIO (13/10/2026). So leitura.
--
-- Quando alguem exclui a conta, a funcao account-delete apaga o login e os dados.
-- Se algum ARQUIVO da pessoa (foto de perfil, imagens) falhar ao ser apagado, o
-- pedido fica com status 'cleanup_pending' e nada tenta de novo sozinho. A conta
-- ja sumiu; o que sobra sao arquivos orfaos no Storage.
--
-- Rodar de vez em quando. Vazio = tudo limpo. Se vier linha, a coluna
-- arquivos_pendentes diz o que ficou; mande para o Claude apagar com voce.

select
  id                                                    as pedido,
  requested_at                                          as pedido_em,
  status,
  metadata ->> 'storage_listing_pending'                as listagem_pendente,
  jsonb_array_length(coalesce(metadata -> 'storage_pending_files', '[]'::jsonb)) as qtd_arquivos_pendentes,
  metadata -> 'storage_pending_files'                   as arquivos_pendentes
from public.account_deletion_requests
where status = 'cleanup_pending'
order by requested_at desc;
