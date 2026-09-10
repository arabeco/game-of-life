-- O RETRATO DA MAESTRIA — para a avaliacao poder se comparar com ela mesma.
--
-- `asset_levels` grava com `on conflict (user_id, asset_id) do update`, entao ele
-- guarda so o valor ATUAL: cada avaliacao apaga a anterior. Existe o
-- `lastLevelUpdate`, que diz QUANDO foi a ultima — mas nao o que ela dizia.
--
-- Sem isso, a tela que fecha o quiz so consegue dizer "e assim que voce se ve
-- hoje". Com isso ela passa a dizer "ha tres meses voce se via em 58; hoje, 72"
-- — que e o unico fato que o app tem sobre essa pessoa e que ela nao consegue
-- ver em lugar nenhum.
--
-- E vale nos dois sentidos: se caiu, tambem e verdade, e tambem merece ser visto
-- sem julgamento. Espelho que so mostra melhora e propaganda.
--
-- Uma linha por avaliacao. Nao ha update: retrato que muda depois deixa de ser
-- retrato.
--
-- Aplicar inteiro no SQL Editor do projeto correto.
begin;

create table if not exists public.mastery_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  taken_at timestamptz not null default now(),
  -- { "saude": 7, "trabalho": 6, ... } — o degrau de 1 a 10, como fica gravado.
  -- A escala de 0 a 20 que a pessoa ve e exibicao, e se converte na leitura.
  levels jsonb not null,
  -- O Indice Glyph do momento (0 a 100). Guardado junto para a comparacao nao
  -- depender de recalcular com regras que podem mudar depois.
  mastery_index integer not null,
  constraint mastery_snapshot_levels_object check (jsonb_typeof(levels) = 'object')
);

-- A consulta e sempre "os ultimos desta pessoa, do mais novo para o mais velho".
create index if not exists mastery_snapshots_user_recent_idx
  on public.mastery_snapshots (user_id, taken_at desc);

alter table public.mastery_snapshots enable row level security;

revoke all on public.mastery_snapshots from anon, authenticated;
grant select, insert on public.mastery_snapshots to authenticated;

drop policy if exists mastery_snapshots_owner_read on public.mastery_snapshots;
create policy mastery_snapshots_owner_read on public.mastery_snapshots
  for select to authenticated using (user_id = auth.uid());

-- Insert direto, sem funcao: nao ha nada a validar contra fraude aqui. O numero
-- ja e auto-declarado por natureza — a pessoa escolhe o proprio nivel no quiz.
-- Mentir no retrato e mentir para si mesma, que e o unico publico dele.
drop policy if exists mastery_snapshots_owner_write on public.mastery_snapshots;
create policy mastery_snapshots_owner_write on public.mastery_snapshots
  for insert to authenticated with check (user_id = auth.uid());

commit;
