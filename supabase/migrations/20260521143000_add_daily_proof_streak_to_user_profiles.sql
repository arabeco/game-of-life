alter table public.user_profiles
add column if not exists daily_proof_streak jsonb not null default '{
  "current": 0,
  "best": 0,
  "totalClosedDays": 0,
  "lastClosedDate": null,
  "lastClosedAt": null,
  "lastScore": null,
  "lastExpDeposited": null,
  "lastCompletedTasksCount": null,
  "lastTotalTasksCount": null
}'::jsonb;

update public.user_profiles
set daily_proof_streak = coalesce(daily_proof_streak, '{
  "current": 0,
  "best": 0,
  "totalClosedDays": 0,
  "lastClosedDate": null,
  "lastClosedAt": null,
  "lastScore": null,
  "lastExpDeposited": null,
  "lastCompletedTasksCount": null,
  "lastTotalTasksCount": null
}'::jsonb);
