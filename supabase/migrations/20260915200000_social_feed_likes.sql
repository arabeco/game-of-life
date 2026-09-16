-- ============================================================
-- LIKES NO FEED. Uma linha por pessoa e por feito.
--
-- A alternativa era uma coluna `likes int` no proprio evento, com
-- `likes = likes + 1`. Ela parece mais barata e nao e:
--
--   - Sem saber QUEM curtiu, nao da para impedir a segunda curtida da mesma
--     pessoa. O botao vira "segurar apertado".
--   - Nao da para descurtir, porque nao ha o que remover.
--   - Se o numero corromper, nao ha como reconstruir.
--
-- A chave primaria composta (event_id, user_id) resolve os tres de uma vez, e e
-- o BANCO quem recusa a curtida repetida — nao logica no cliente, que sempre
-- tem uma corrida escondida entre o clique e a resposta.
--
-- QUEM CURTIU NAO APARECE, e isso e escolha de produto, nao limitacao. O numero
-- diz "alguem viu e achou bom", e basta. A lista diria "fulano viu e beltrano
-- nao", e transformaria o Hall num lugar de cobrar presenca. O dado fica aqui
-- porque a unicidade precisa dele; a tela mostra so a contagem.
-- ============================================================
create table if not exists public.social_feed_likes (
  event_id uuid not null references public.social_feed_events(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- Contar as curtidas de um feito e a leitura mais comum da tela.
create index if not exists social_feed_likes_event_idx
  on public.social_feed_likes (event_id);

alter table public.social_feed_likes enable row level security;

-- LEITURA: quem enxerga o feito enxerga a contagem dele. A visibilidade e
-- herdada do evento, nao redefinida aqui — duas regras de visibilidade para a
-- mesma coisa acabam divergindo.
drop policy if exists "Likes visible with their event" on public.social_feed_likes;
create policy "Likes visible with their event"
on public.social_feed_likes
for select
using (exists (select 1 from public.social_feed_events e where e.id = event_id));

-- CURTIR: so em nome proprio.
drop policy if exists "Users like as themselves" on public.social_feed_likes;
create policy "Users like as themselves"
on public.social_feed_likes
for insert
with check (auth.uid() = user_id);

-- DESCURTIR: so a propria curtida. Ninguem retira a de outro.
drop policy if exists "Users remove own like" on public.social_feed_likes;
create policy "Users remove own like"
on public.social_feed_likes
for delete
using (auth.uid() = user_id);

grant select, insert, delete on public.social_feed_likes to authenticated;


-- ============================================================
-- ALTERNAR A CURTIDA EM UMA IDA SO.
--
-- Curtir e descurtir sao o mesmo gesto: clicar de novo tira. Fazer isso em duas
-- chamadas (ler se existe, depois gravar) abre uma corrida — dois toques rapidos
-- leem "nao curtido" e o segundo insert falha na chave primaria.
--
-- Aqui a decisao e do banco, dentro de uma transacao: se apagou, era curtida e
-- virou descurtida; se nao apagou, insere. Devolve o estado final e a contagem,
-- que e tudo que a tela precisa para se desenhar sem perguntar de novo.
-- ============================================================
create or replace function public.toggle_feed_like(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_removidas integer := 0;
  v_curtido boolean;
begin
  if v_user is null then return null; end if;
  if not exists (select 1 from public.social_feed_events e where e.id = p_event_id) then
    return null;
  end if;

  delete from public.social_feed_likes
  where event_id = p_event_id and user_id = v_user;
  get diagnostics v_removidas = row_count;

  if v_removidas = 0 then
    insert into public.social_feed_likes (event_id, user_id)
    values (p_event_id, v_user)
    on conflict do nothing;
    v_curtido := true;
  else
    v_curtido := false;
  end if;

  return jsonb_build_object(
    'eventId', p_event_id,
    'liked', v_curtido,
    'likes', (select count(*) from public.social_feed_likes l where l.event_id = p_event_id)
  );
end;
$$;

revoke all on function public.toggle_feed_like(uuid) from public, anon;
grant execute on function public.toggle_feed_like(uuid) to authenticated;
