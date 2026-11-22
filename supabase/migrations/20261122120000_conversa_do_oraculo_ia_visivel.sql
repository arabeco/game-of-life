-- A CONVERSA COM O ORACULO FICA NO CHAT (22/11/2026, com o Afonso).
--
-- Cada pergunta e resposta ja era gravada em oraculo_ia_mensagens, mas o app
-- nao conseguia ler: a tabela tinha RLS sem nenhuma politica de leitura. A
-- conversa vivia so na tela e sumia ao sair da aba, ate a resposta que tinha
-- acabado de chegar.
--
-- Aqui: a pessoa le as proprias mensagens (so as dela, so leitura; quem grava
-- continua sendo a funcao, com a chave de servico), e cada resposta guarda o
-- tom em que foi escrita, para o chat mostrar.

alter table public.oraculo_ia_mensagens add column if not exists tom text;

drop policy if exists "oraculo_ia_mensagens_le_as_suas" on public.oraculo_ia_mensagens;
create policy "oraculo_ia_mensagens_le_as_suas"
  on public.oraculo_ia_mensagens
  for select
  to authenticated
  using (user_id = auth.uid());

grant select on public.oraculo_ia_mensagens to authenticated;
