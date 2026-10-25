-- Uma ocorrência pode ganhar contexto próprio no Planner sem renomear a ação-base.
alter table public.scheduled_tasks
  add column if not exists instance_note text;

alter table public.scheduled_tasks
  drop constraint if exists scheduled_tasks_instance_note_length;

alter table public.scheduled_tasks
  add constraint scheduled_tasks_instance_note_length
  check (instance_note is null or char_length(instance_note) <= 140);
