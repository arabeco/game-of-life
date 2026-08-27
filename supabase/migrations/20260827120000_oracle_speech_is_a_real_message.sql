begin;

-- A fala do Oraculo passa a existir depois que some da tela.
--
-- Sao TRES coisas diferentes, e ate aqui so uma delas era real:
--
--   1. CARD DE INFOS  — nasce no cron, grava em oracle_messages, vai para push,
--                       aparece no chat com hora. Completo.
--   2. FALAS          — abertura do dia, saudacao, dica.
--   3. REACOES        — a palavra curta quando voce fecha alguma coisa.
--
-- As duas ultimas usavam o mesmo cano: emitOracleSpeech disparava um evento de
-- janela, o balao aparecia cinco segundos no topo e EVAPORAVA. Nao ficava
-- gravado, nao ia para push, nao tinha hora. Quem estava com o celular no bolso
-- simplesmente nao recebeu — e o combinado era que desligar o aviso tirasse a
-- fala do celular, nao que a apagasse da existencia.
--
-- Agora a fala e uma linha em oracle_messages como qualquer outra. Isso liga
-- sozinho as duas coisas que faltavam, sem cron novo e sem webhook novo:
--   - o trigger on_oracle_message_enqueue_push_webhook ja dispara em todo insert;
--   - o chat ja le a tabela, entao a fala aparece no historico com data e hora.
--
-- Vai por RPC e nao por insert direto do cliente de proposito: assim ninguem
-- forja fala na conta de outra pessoa, e o limite diario mora do lado de ca.

do $$
begin
  if to_regclass('public.oracle_messages') is null then
    raise exception 'ORACLE_SPEECH_MISSING: public.oracle_messages';
  end if;
  if to_regclass('public.oracle_preferences') is null then
    raise exception 'ORACLE_SPEECH_MISSING: public.oracle_preferences';
  end if;
end;
$$;

-- delivery_type 'chat' e nao 'feed' de proposito: getOracleFeedQuotaStatus conta
-- so o que e 'feed', entao uma fala nunca rouba a vaga do card de infos, que e
-- pago e tem cota propria.

create or replace function public.record_oracle_speech(
  p_message text,
  p_title text default null,
  p_kind text default 'abertura',
  p_tone text default 'info',
  p_quick_actions jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $fn$
declare
  v_uid uuid := auth.uid();
  v_presence integer := 0;
  v_mode text := 'neutro';
  v_today_count integer := 0;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if coalesce(trim(p_message), '') = '' then
    raise exception 'ORACLE_SPEECH_EMPTY';
  end if;

  if coalesce(p_kind, '') not in ('abertura', 'reacao') then
    raise exception 'ORACLE_SPEECH_KIND_INVALID';
  end if;

  select coalesce(presence_level, 0), coalesce(active_mode, 'neutro')
  into v_presence, v_mode
  from public.oracle_preferences
  where user_id = v_uid;

  -- Silencioso nao fala, entao tambem nao grava. Sem isto o historico encheria
  -- de falas que o usuario pediu para nao existir.
  if coalesce(v_presence, 0) <= 0 then
    return jsonb_build_object('success', true, 'skipped', 'silencioso');
  end if;

  -- Teto de seguranca, nao regra de produto. Quem decide a frequencia e a
  -- politica de presenca no cliente; isto existe para que um laco com defeito
  -- nao consiga escrever mil linhas e mil pushes numa tarde.
  select count(*)
  into v_today_count
  from public.oracle_messages
  where user_id = v_uid
    and delivery_type = 'chat'
    and created_at >= date_trunc('day', now());

  if v_today_count >= 12 then
    return jsonb_build_object('success', true, 'skipped', 'teto_diario');
  end if;

  v_id := extensions.gen_random_uuid();

  insert into public.oracle_messages (
    id, user_id, category, content, mode, delivery_type, context_snapshot, read, created_at
  ) values (
    v_id,
    v_uid,
    'foco',
    trim(p_message),
    v_mode,
    'chat',
    jsonb_build_object(
      'triggerType', 'app_open',
      'presentation', 'ambient_pulse',
      'generatedFor', 'chat',
      'purpose', 'oracle_speech',
      'speechKind', p_kind,
      'tone', coalesce(nullif(trim(coalesce(p_tone, '')), ''), 'info'),
      'title', nullif(trim(coalesce(p_title, '')), ''),
      'quickActions', coalesce(p_quick_actions, '[]'::jsonb),
      'summary', case when p_kind = 'reacao' then 'Reacao do Oraculo' else 'Fala do Oraculo' end
    ),
    false,
    now()
  );

  return jsonb_build_object('success', true, 'id', v_id);
end;
$fn$;

revoke all on function public.record_oracle_speech(text, text, text, text, jsonb) from public;
grant execute on function public.record_oracle_speech(text, text, text, text, jsonb) to authenticated;

commit;
