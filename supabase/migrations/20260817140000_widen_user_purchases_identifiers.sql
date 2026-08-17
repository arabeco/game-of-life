-- Fecha o ciclo voltava com "Nao foi possivel analisar o ciclo. Tente novamente."
-- A causa: claim_cycle_completion_gold chama _starter_reward_mark_purchase, que
-- insere em user_purchases com product_type = 'cycle_completion_reward' (23 chars)
-- e product_id = <uuid do ciclo> (36 chars). A coluna estava como varchar(20), então
-- o insert falhava com 22001 e o erro subia até virar o toast genérico do relatório.
--
-- 'progress_reward' (15) e 'invite_ouro_reward' (18) cabiam, e por isso só o
-- fechamento de ciclo quebrava — os outros prêmios seguiam funcionando.
--
-- A migration 20260527193000 tentou criar product_type como text, mas usou
-- "add column if not exists", que não altera o tipo de uma coluna que já existe.
-- Aqui o tipo é corrigido de fato.
--
-- Alargar varchar(n) -> text é seguro: nenhum dado existente é perdido ou truncado.

begin;

alter table public.user_purchases
  alter column product_type type text;

alter table public.user_purchases
  alter column product_id type text;

commit;
