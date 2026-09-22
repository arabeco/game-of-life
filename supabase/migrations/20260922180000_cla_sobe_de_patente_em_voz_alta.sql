-- O CLA SUBIA DE PATENTE EM SILENCIO.
--
-- A funcao de XP recalculava `rank_id` por faixa a cada fecho de ciclo e
-- terminava ali. Um cla passava de Feudo para Bastiao — dez mil de experiencia
-- somados por varias pessoas ao longo de semanas — e ninguem ficava sabendo.
-- Sem aviso, sem modal, sem nada. Quem contribuiu nao via o resultado de ter
-- contribuido, que e a unica coisa que faz alguem contribuir de novo.
--
-- E o silencio era pior num grupo do que sozinho: quando a patente PESSOAL sobe
-- ha modal e insignia. A do cla, que depende de todo mundo, nao tinha nem toast.
--
-- Agora a subida avisa TODOS OS MEMBROS e paga cada um. Nao ha insignia nova:
-- as dezesseis existentes ja tem dono, e criar sete significaria sete desenhos
-- novos em cima dos vinte e cinco que ja esperam arte. O premio visivel e o
-- plano de fundo do cla, que muda com a patente e todo mundo ve ao abrir.
--
-- A escada de premio segue a das faixas: o salto de Dinastia para Imperio custa
-- um milhao e meio de experiencia, entao ele nao pode pagar o mesmo que o de
-- Feudo para Bastiao, que custa dez mil.

begin;

create or replace function public._cla_premio_da_patente(p_rank_id text)
returns jsonb
language sql
immutable
as $$
  select case p_rank_id
    when 'bastiao'    then jsonb_build_object('fragmentos', 20,  'bau', 'Comum')
    when 'provincia'  then jsonb_build_object('fragmentos', 40,  'bau', 'Incomum')
    when 'principado' then jsonb_build_object('fragmentos', 60,  'bau', 'Incomum')
    when 'reino'      then jsonb_build_object('fragmentos', 100, 'bau', 'Raro')
    when 'dinastia'   then jsonb_build_object('fragmentos', 150, 'bau', 'Épico')
    when 'imperio'    then jsonb_build_object('fragmentos', 250, 'bau', 'Lendário')
    -- Feudo e onde todo cla nasce. Nao se premia por existir.
    else null
  end;
$$;

/**
 * Anuncia a subida e paga os membros.
 *
 * Idempotente por `clan_rank_up_dispatches`: a funcao de XP roda a cada fecho de
 * ciclo de cada pessoa, entao sem a trava o mesmo Bastiao pagaria uma vez por
 * membro que fechasse ciclo naquele dia. A chave e o cla mais a patente — uma
 * patente se alcanca uma vez.
 */
create table if not exists public.clan_rank_up_dispatches (
  clan_id uuid not null references public.clans(id) on delete cascade,
  rank_id text not null,
  reached_at timestamptz not null default now(),
  primary key (clan_id, rank_id)
);

alter table public.clan_rank_up_dispatches enable row level security;

create or replace function public.anunciar_patente_do_cla(p_clan_id uuid, p_rank_id text)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_premio jsonb;
  v_clan_name text;
  v_membro record;
  v_avisados integer := 0;
begin
  v_premio := public._cla_premio_da_patente(p_rank_id);
  if v_premio is null then
    return 0;
  end if;

  -- A trava. Se a patente ja foi anunciada, nao ha o que fazer.
  insert into public.clan_rank_up_dispatches (clan_id, rank_id)
  values (p_clan_id, p_rank_id)
  on conflict (clan_id, rank_id) do nothing;

  if not found then
    return 0;
  end if;

  select name into v_clan_name from public.clans where id = p_clan_id;

  for v_membro in
    select user_id from public.clan_members where clan_id = p_clan_id
  loop
    -- Fragmentos na carteira, pelo mesmo caminho que o resto do app usa.
    update public.user_profiles
    set fragments = coalesce(fragments, 0) + (v_premio ->> 'fragmentos')::integer,
        wallet = jsonb_set(
          coalesce(wallet, '{}'::jsonb),
          '{fragments}',
          to_jsonb(coalesce((coalesce(wallet, '{}'::jsonb) ->> 'fragments')::integer, fragments, 0)
                   + (v_premio ->> 'fragmentos')::integer)
        ),
        updated_at = now()
    where id = v_membro.user_id;

    -- `_competition_grant_chest` e o caminho seguro: ela tenta `grant_chest`,
    -- cai para o insert direto se a funcao nao existir, e — o que importa aqui —
    -- recalcula o resumo de baus no perfil. Chamar `grant_chest` cru deixaria o
    -- bau no banco sem aparecer na tela.
    perform public._competition_grant_chest(v_membro.user_id, v_premio ->> 'bau');

    insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
    values (
      extensions.gen_random_uuid(),
      v_membro.user_id,
      'clan_rank_up',
      format('%s subiu para %s.', coalesce(v_clan_name, 'Seu grupo'), initcap(p_rank_id)),
      false,
      now(),
      jsonb_build_object(
        'clanId', p_clan_id,
        'clanName', v_clan_name,
        'rankId', p_rank_id,
        'fragments', (v_premio ->> 'fragmentos')::integer,
        'chestType', v_premio ->> 'bau'
      )
    );

    v_avisados := v_avisados + 1;
  end loop;

  return v_avisados;
end;
$$;

revoke all on function public.anunciar_patente_do_cla(uuid, text) from public;

/**
 * O GATILHO FICA NA TABELA, E NAO NA FUNCAO DE XP.
 *
 * A funcao do fecho de ciclo e quem soma experiencia hoje, mas nao e a unica
 * coisa que pode mexer em `rank_id`: um acerto pelo painel, uma correcao a mao
 * no SQL, uma funcao futura. Preso a ela, o anuncio so sairia pelo caminho que
 * existe hoje, e o dia em que alguem subir uma patente por outro caminho o
 * silencio volta sem ninguem notar.
 *
 * Na tabela, a regra e a mesma para todos os caminhos: mudou a patente, anuncia.
 */
create or replace function public._cla_anuncia_mudanca_de_patente()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.rank_id is distinct from old.rank_id then
    perform public.anunciar_patente_do_cla(new.id, new.rank_id);
  end if;
  return new;
end;
$$;

drop trigger if exists cla_anuncia_mudanca_de_patente on public.clans;
create trigger cla_anuncia_mudanca_de_patente
after update of rank_id on public.clans
for each row
execute function public._cla_anuncia_mudanca_de_patente();

/*
 * As patentes ja alcancadas entram na trava sem pagar nada.
 *
 * Sem isto, o primeiro fecho de ciclo depois desta migracao dispararia o anuncio
 * da patente ATUAL de todo cla que ja subiu — gente recebendo bau por uma
 * conquista de meses atras, e o Imperio pagando duzentos e cinquenta fragmentos
 * a cada membro por nada ter acontecido.
 */
insert into public.clan_rank_up_dispatches (clan_id, rank_id)
select id, rank_id
from public.clans
where rank_id is not null
on conflict (clan_id, rank_id) do nothing;

commit;
