-- O SALDO DEIXA DE SER GRAVAVEL POR QUEM O GASTA.
--
-- `authenticated` tinha UPDATE na TABELA INTEIRA de user_profiles. A RLS limita
-- a linha — cada um so mexe na propria — mas nao limita a COLUNA. Dentro da
-- propria linha estava tudo: `wallet`, `gold`, `is_premium`, `role`.
--
-- Isso tornava decoracao tudo o que foi feito hoje na loja. Nao adianta o
-- servidor decidir o preco se a pessoa pode escrever o saldo direto, sem passar
-- pela loja nenhuma vez.
--
-- O SALDO SAO DUAS COLUNAS, E VALE A MAIOR.
--
-- `resolveProfileWallet` faz `Math.max(wallet.gold, gold)`. Trancar so o
-- `wallet` nao adiantaria: bastava escrever na coluna `gold` que o aplicativo
-- passaria a usar aquele valor. As duas fecham juntas, e `fragments` junto pelo
-- mesmo motivo.
--
-- `role` NAO E SO A PROPRIA CONTA. A politica de
-- 20260319130500_fix_notifications_self_insert_policy deixa quem tem `role` em
-- ('sovereign','gm','admin','admin_gm') inserir notificacao na caixa de OUTRAS
-- pessoas. Quem se promovesse a admin ganhava um canal para o feed alheio.
--
-- COMO SE FAZ, E POR QUE ASSIM.
--
-- Um privilegio de tabela nao se recorta por coluna: `revoke update (coluna)`
-- nao tira nada enquanto o UPDATE da tabela inteira estiver de pe. Entao o
-- caminho e derrubar o privilegio de tabela e reconceder coluna a coluna.
--
-- A lista abaixo e o INVERSO da lista de bloqueio: sao as 85 colunas que
-- continuam liberadas, e nao as 9 que fecham. Escrever assim e o que faz uma
-- coluna nova nascer FECHADA em vez de nascer aberta por esquecimento.
--
-- O QUE ISTO NAO FECHA, E DE PROPOSITO: `nobility` (o EXP), `chests`, os
-- creditos comprados e os campos de boost continuam graváveis, porque o
-- aplicativo os escreve hoje. Fechar cada um depende de existir caminho de
-- servidor para o que ele legitimamente muda, e isso e o passo seguinte.
--
-- Conferido antes: nenhuma das 9 colunas e escrita por UPDATE do cliente. O
-- `buildClosedBetaProfilePayload` as escreve, mas so no nascimento do perfil, e
-- INSERT e privilegio separado.

begin;

revoke update on table public.user_profiles from authenticated;

grant update (
  id,
  email,
  nickname,
  sovereign,
  avatar_url,
  border,
  level,
  background_url,
  banner_url,
  is_online,
  visible_widgets,
  skin,
  last_level_update,
  nobility,
  mood,
  chests,
  completed_season_missions,
  unlocked_items,
  unlocked_skins,
  app_mode,
  theme_preference,
  arenas_view_mode,
  terms_version,
  terms_accepted_at,
  terms_accept_source,
  privacy_version,
  privacy_accepted_at,
  privacy_accept_source,
  onboarding_version,
  onboarding_started_at,
  onboarding_completed_at,
  onboarding_dismissed_at,
  codex_creation_slots_purchased,
  starter_rewards_pending,
  vanguard_welcome_pending,
  vanguard_welcome_payload,
  vanguard_welcome_shown_at,
  assets_visibility,
  mastery_visibility,
  partnership_slots_purchased,
  competition_slots_purchased,
  mentor_slots_purchased,
  linked_arena_slots_purchased,
  premium_reward_pending,
  premium_reward_payload,
  premium_reward_shown_at,
  exp_boost_multiplier,
  exp_boost_expires_at,
  exp_boost_product_id,
  feats_visibility,
  asset_art_by_id,
  asset_widget_values,
  sequence_items,
  legacy_projection_scene_credits,
  campaign_quiz_medium_credits,
  campaign_quiz_free_credits,
  onboarding_push_prompted_at,
  beta_program_code,
  beta_program_label,
  beta_program_started_at,
  beta_program_ends_at,
  beta_program_last_check_in_date,
  beta_program_check_in_count,
  beta_program_days_target,
  beta_reward_pending,
  beta_reward_shown_at,
  beta_reward_payload,
  username,
  title,
  checklist_items,
  garden_visibility,
  garden_state,
  daily_proof_streak,
  planner_view_mode,
  accepted_system_challenges,
  onboarding_age_range,
  onboarding_purpose,
  arena_pact_arena_id,
  arena_pact_kind,
  arena_pact_difficulty,
  arena_pact_goal,
  arena_pact_started_on,
  arena_pact_ends_on,
  legacy_five_day_eligible,
  legacy_plaque_color
) on table public.user_profiles to authenticated;

commit;
