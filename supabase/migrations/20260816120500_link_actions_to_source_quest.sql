-- Quests were matched to their arena action purely by string name:
--   action.name === quest.actionTemplate.name || action.name === quest.title
-- Renaming the action silently detached the quest, resetting its progress to
-- zero and dropping it out of the "accepted" list. This adds the stable link.
--
-- There is no server-side quest catalogue to backfill from: seasonQuests is
-- derived in the client from constants, so existing rows are filled in by the
-- app on load, using the same name match as a one-time migration step. The
-- column is nullable for exactly that reason.

begin;

alter table public.actions
  add column if not exists source_quest_id text;

comment on column public.actions.source_quest_id is
  'Season quest / system challenge this action was created for. Null for actions the user made themselves.';

create index if not exists actions_user_source_quest_idx
  on public.actions (user_id, source_quest_id)
  where source_quest_id is not null;

commit;
