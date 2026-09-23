-- O APP NAO SABIA EM QUE DIAS VOCE FEZ.
--
-- O checklist vive em `user_profiles.checklist_items`, que guarda UM dia:
-- `{ date, items }`, sobrescrito toda noite. A sequencia vive em
-- `sequence_items`, que guarda o contador corrente e a ultima marcacao.
--
-- Nenhum dos dois guarda HISTORIA. Entao "17 de 30 dias voce tomou sol" nao
-- era uma consulta dificil: era impossivel, porque o dado nunca existiu.
--
-- E o relatorio de ciclo sente essa falta mais que qualquer tela. Ele conta o
-- que aconteceu dentro do ciclo, e o habito — que e a coisa que a pessoa esta
-- de fato tentando mudar — nao aparecia nele de jeito nenhum.
--
-- UMA LINHA POR HABITO POR DIA. Nada mais.
--
-- Com cinco habitos diarios sao mil e oitocentas linhas por ano por pessoa, o
-- que e nada. E a leitura e por JANELA: o fecho de ciclo pergunta pelos dias
-- daquele ciclo, e so. Nao entra na hidratacao de abertura do app, pela mesma
-- razao que o diario nao entra — dado que so cresce nao pode ser carregado por
-- quem nao pediu para ler.
--
-- O QUE ISTO NAO FAZ: recuperar o passado. Comeca a contar do dia em que
-- entrar, e o primeiro relatorio depois disso vem parcial. Nao ha como
-- inventar os dias que ninguem anotou.

begin;

create table if not exists public.habit_marks (
  user_id uuid not null references auth.users(id) on delete cascade,
  -- A data OPERACIONAL, que e a que o resto do app usa: quem vira a noite
  -- continua no dia anterior ate as quatro. Gravar a data de calendario faria
  -- a marcacao das duas da manha cair no dia seguinte e furar a sequencia de
  -- quem estava acordado.
  marked_on date not null,
  kind text not null check (kind in ('checklist', 'sequencia')),
  item_id text not null check (char_length(item_id) between 1 and 120),
  -- O titulo viaja junto de proposito. O item pode ser renomeado ou apagado, e
  -- o relatorio de um ciclo passado tem de continuar dizendo o nome que a
  -- pessoa usava NAQUELE ciclo. Guardar so o id faria a historia mudar quando
  -- o presente muda.
  title text not null default '',
  primary key (user_id, marked_on, kind, item_id)
);

create index if not exists habit_marks_janela_idx
  on public.habit_marks (user_id, marked_on);

alter table public.habit_marks enable row level security;

revoke all on table public.habit_marks from anon;
grant select, insert, delete on table public.habit_marks to authenticated;

-- Sem update de proposito: a marca existe ou nao existe. Desmarcar e apagar a
-- linha, e isso mantem o historico honesto — nao ha estado intermediario para
-- alguem interpretar errado depois.
drop policy if exists "A marca e de quem fez" on public.habit_marks;
create policy "A marca e de quem fez"
on public.habit_marks
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

commit;
