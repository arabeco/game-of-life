-- A IMPRESSAO DIGITAL DO RELATORIO (12/10/2026) — passo 1 do egress de abertura.
--
-- Os relatorios dos ciclos fechados eram 40% do que o app baixava ao abrir (131
-- de 325 KB na conta do Afonso), quase tudo no atlas semanal, e cresciam a cada
-- ciclo fechado. Agora o celular guarda uma copia e, ao abrir, pede so a
-- impressao digital de cada relatorio; baixa de novo apenas o que mudou.
--
-- `report_hash` e uma coluna calculada: em SQL se le como coluna (c.report_hash),
-- e a API devolve quando pedida (select=id,report_hash). Nao guarda nada e nao
-- aparece no select *, entao nenhum codigo que salva ciclo pode manda-la de
-- volta. Sem gatilho, sem preencher linhas antigas, nada escrito na tabela.
--
-- Se o relatorio mudar por qualquer caminho (recalculo da nota, SQL na mao), a
-- impressao muda junto e o app baixa a versao nova.
--
-- Pode ser rodado de novo sem estrago.

create or replace function public.report_hash(c public.cycles)
returns text
language sql
stable
as $$
  select md5(c.report_data::text)
$$;

revoke all on function public.report_hash(public.cycles) from public, anon;
grant execute on function public.report_hash(public.cycles) to authenticated;

notify pgrst, 'reload schema';
