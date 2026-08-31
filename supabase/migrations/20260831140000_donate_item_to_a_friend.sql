begin;

-- Doar item passa a existir.
--
-- O botao "Doar" no modal do item era `alert("Você doou X! (Simulação)")` com um
-- comentario dizendo "Logic to donate would go here". Ele estava publicado,
-- parecia real e nunca moveu nada — o item continuava no inventario de quem
-- "doou" e nunca chegava a ninguem.
--
-- SO ENTRE AMIGOS, e essa e a decisao de produto que molda o resto. Doar para
-- qualquer apelido abre a porta mais barata de engenharia social que existe num
-- jogo: "me manda o item que eu te devolvo". Exigir amizade nao impede um golpe
-- entre conhecidos, mas tira o golpe de desconhecido — que e a forma que escala.
--
-- E irreversivel de proposito. Nao ha "desfazer doacao": um presente que pode
-- ser retomado nao e um presente, e a possibilidade de retomar seria a proxima
-- alavanca de chantagem.

do $$
begin
  if to_regclass('public.user_inventory') is null then
    raise exception 'DONATE_MISSING: public.user_inventory';
  end if;
  if to_regclass('public.friends') is null then
    raise exception 'DONATE_MISSING: public.friends';
  end if;
  if to_regclass('public.notifications') is null then
    raise exception 'DONATE_MISSING: public.notifications';
  end if;
end;
$$;

create or replace function public.donate_item_to_friend(
  p_instance_id uuid,
  p_recipient_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $fn$
declare
  v_uid uuid := auth.uid();
  v_item_id text;
  v_is_equipped boolean;
  v_sender_name text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_recipient_id = v_uid then
    raise exception 'DONATE_TO_SELF';
  end if;

  -- A amizade e conferida nos DOIS sentidos porque a tabela guarda o vinculo de
  -- um lado so dependendo de quem aceitou.
  if not exists (
    select 1 from public.friends f
    where (f.user_id = v_uid and f.friend_id = p_recipient_id)
       or (f.user_id = p_recipient_id and f.friend_id = v_uid)
  ) then
    raise exception 'NOT_FRIENDS';
  end if;

  -- `for update` e a linha inteira travada: sem isso, dois toques rapidos no
  -- mesmo item poderiam doa-lo duas vezes, para duas pessoas.
  select item_id, coalesce(is_equipped, false)
  into v_item_id, v_is_equipped
  from public.user_inventory
  where id = p_instance_id and user_id = v_uid
  for update;

  if v_item_id is null then
    raise exception 'ITEM_NOT_OWNED';
  end if;

  -- Item equipado nao sai. Ele sumiria de cima da pessoa sem aviso, e o motivo
  -- de a doacao ter falhado seria invisivel na tela dela.
  if v_is_equipped then
    raise exception 'ITEM_EQUIPPED';
  end if;

  -- MOVE a instancia em vez de apagar e recriar: o item continua sendo o mesmo,
  -- com a mesma data de aquisicao e a mesma historia.
  update public.user_inventory
  set user_id = p_recipient_id,
      is_equipped = false
  where id = p_instance_id;

  select coalesce(nickname, username, 'Alguém') into v_sender_name
  from public.user_profiles where id = v_uid;

  -- As colunas sao `content` e `metadata` — a primeira versao usou title/body/data
  -- e teria quebrado no insert. Copiado do codex_gift, que e a notificacao de
  -- presente que ja existe e funciona.
  insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
  values (
    extensions.gen_random_uuid(),
    p_recipient_id,
    'item_gift',
    format('@%s doou um item para voce.', v_sender_name),
    false,
    now(),
    jsonb_build_object(
      'itemId', v_item_id,
      'instanceId', p_instance_id,
      'senderId', v_uid,
      'senderName', v_sender_name
    )
  );

  return jsonb_build_object(
    'success', true,
    'item_id', v_item_id,
    'recipient_id', p_recipient_id
  );
end;
$fn$;

revoke all on function public.donate_item_to_friend(uuid, uuid) from public;
grant execute on function public.donate_item_to_friend(uuid, uuid) to authenticated;

commit;
