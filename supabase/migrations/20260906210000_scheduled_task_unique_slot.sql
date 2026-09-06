-- A MESMA ACAO NAO PODE OCUPAR O MESMO MINUTO DUAS VEZES.
--
-- POR QUE AGORA:
--
-- A virada de ciclo passou a REAGENDAR as acoes recorrentes. Antes ela nao
-- precisava: o agendamento gravava 365 dias de uma vez, entao o ciclo seguinte
-- ja chegava com tarefas e a virada funcionava por acidente, como efeito
-- colateral do desperdicio. Agora que a geracao para no fim do ciclo, existe uma
-- rotina que recomeca — e rotina que recomeca pode recomecar duas vezes.
--
-- O cliente sozinho nao consegue garantir isso. Ele confere duplicata contra o
-- que tem em maos, e depois do teto de leitura de 35 dias ele nao enxerga o fim
-- de um ciclo longo. Conferir contra o que nao se ve e o mesmo que nao conferir.
-- Quem tem a visao inteira e o banco, entao a garantia mora aqui.
--
-- POR QUE PARCIAL, e isto e o ponto:
--
-- start_time = -1 significa "sem horario": a tarefa esta no pool, esperando.
-- Devolver duas tarefas da mesma acao ao pool no mesmo dia e COMPORTAMENTO
-- LEGITIMO (returnTaskToPool grava -1), e a conferencia no banco encontrou
-- exatamente um caso assim, real, na conta principal. Um indice total mataria o
-- pool para proteger a agenda — trocaria um problema que nao existe por um que
-- existiria todo dia.
--
-- O predicado `start_time >= 0` e o mesmo `hasScheduledTime` do cliente
-- (utils/taskDomain.js, linha 99). Uma regua so, dos dois lados.
--
-- ESTA MIGRACAO NAO APAGA NADA. A unica duplicata do banco esta em -1, fora do
-- alcance do indice. Se ela falhar, sao duplicatas COM horario que apareceram
-- depois desta conferencia — nesse caso o erro traz a linha, e a limpeza e uma
-- decisao a ser tomada olhando os dados, nao aqui dentro.
--
-- Aplicar inteiro no SQL Editor do projeto correto.
begin;

create unique index if not exists scheduled_tasks_agenda_unica_idx
  on public.scheduled_tasks (user_id, action_id, date, start_time)
  where start_time >= 0;

commit;
