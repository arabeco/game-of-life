-- O DIARIO, E POR QUE ELE E PAGINADO.
--
-- A pergunta que definiu o desenho nao foi "como guardar texto" — foi "como
-- nao pagar egress por texto que ninguem pediu para ler".
--
-- Um diario que carrega tudo ao abrir o app faz todo mundo baixar meses de
-- escrita a cada abertura, inclusive quem nunca abre o diario. E nao e teorico:
-- o app ja hidrata muita coisa na abertura, e bastaria alguem juntar as
-- entradas nessa fila.
--
-- A PAGINA E A UNIDADE DE TUDO: de leitura, de gravacao e de cobranca.
--
--   abrir uma pagina  = ler UMA linha
--   salvar            = gravar UMA linha, a que mudou
--   o indice          = ler numero, data e os primeiros 60 caracteres
--
-- Com 99 paginas cheias, o indice inteiro cabe em poucos kilobytes, e nenhuma
-- leitura traz conteudo que a pessoa nao abriu.
--
-- E O CONTEUDO E TEXTO LIVRE, de proposito.
--
-- Nada de campo por data, nada de uma linha por dia. A pessoa escreve como
-- quiser — uma pagina por dia, ou um ano inteiro numa pagina so com as datas
-- separando. O app no maximo oferece inserir a data de hoje no topo quando ela
-- comeca a escrever. Diario com formulario deixa de ser diario.
--
-- NADA AQUI ZERA. Nao ha rotina, gatilho ou fecho de ciclo que toque nesta
-- tabela. So a pessoa escreve, e so a pessoa apaga.

begin;

create table if not exists public.journal_pages (
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 99 e o teto que o app oferece. Cabe em dois digitos na tela e e mais do
  -- que qualquer pessoa preenche; o limite existe para o custo ter um teto
  -- conhecido, e nao para apertar ninguem.
  page_number smallint not null check (page_number between 1 and 99),
  -- Dez mil caracteres sao umas quatro paginas de texto corrido. O limite
  -- protege o egress de um paste acidental de megabytes, nao a escrita.
  content text not null default '' check (char_length(content) <= 10000),
  updated_at timestamptz not null default now(),
  primary key (user_id, page_number)
);

alter table public.journal_pages enable row level security;

revoke all on table public.journal_pages from anon;
grant select, insert, update, delete on table public.journal_pages to authenticated;

-- O diario e de quem escreveu, e de mais ninguem. Sem excecao de amigo, de
-- lider de grupo ou de admin: as outras tabelas tem politicas de leitura
-- cruzada e esta nao pode ter nenhuma.
drop policy if exists "O diario e de quem escreveu" on public.journal_pages;
create policy "O diario e de quem escreveu"
on public.journal_pages
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

commit;
