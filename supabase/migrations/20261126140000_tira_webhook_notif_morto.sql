-- TIRA O WEBHOOK "notif", QUE NUNCA MANDOU E-MAIL (26/11/2026).
--
-- O gatilho chamava a funcao resend a cada linha nova em notifications,
-- com a chave service_role antiga (JWT de 07/02) gravada no proprio gatilho.
-- Desde 22/11 a funcao responde 401: o Supabase passou a injetar as chaves
-- novas em SUPABASE_SERVICE_ROLE_KEY, e a comparacao nao bate mais.
--
-- Mas mesmo com a chave certa ele nao mandaria nada: o webhook manda o
-- envelope {type: 'INSERT', record: ...}, e a resend so aceita
-- type 'account_deleted' ou 'delivery_test' (responderia 400).
-- O e-mail de conta excluida sai por outro caminho, que segue de pe:
-- _shared/accountDeletion.ts chama functions.invoke('resend') com a mesma
-- chave do ambiente que a resend confere (aceito em 16/10; as 12 falhas de
-- 23/10 eram contas de teste @example.com, que o Resend recusa).
--
-- Tirar o gatilho: uma chamada inutil a menos por notificacao e a chave
-- antiga fora da definicao do banco.
--
-- Pode ser rodado de novo sem estrago.

drop trigger if exists notif on public.notifications;

-- CONFERENCIA (so le): tem de voltar zero linhas.
select t.tgname, c.relname
from pg_trigger t join pg_class c on c.oid = t.tgrelid
where not t.tgisinternal and encode(t.tgargs, 'escape') like '%functions/v1/resend%';
