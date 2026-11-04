-- A FILA DO DIA DOS CARDS (04/11/2026, com o Afonso): a rotina le as entregas de
-- todo mundo por data a cada 10 minutos. Com o indice, essa leitura nao varre a
-- tabela quando ela crescer. Pode ser rodado de novo sem estrago.
create index if not exists oracle_messages_created_at_idx on public.oracle_messages (created_at);
