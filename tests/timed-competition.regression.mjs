import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(
    new URL('../supabase/migrations/20260814170000_add_timed_competition_results.sql', import.meta.url),
    'utf8',
);
const gameContext = await readFile(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const connectionsModal = await readFile(new URL('../components/ConnectionsModal.tsx', import.meta.url), 'utf8');
const achievementModal = await readFile(new URL('../components/AchievementModal.tsx', import.meta.url), 'utf8');

assert.match(migration, /p_duration_days integer/);
assert.match(migration, /p_duration_days, 0\) not between 1 and 30/);
assert.match(migration, /p_duration_days, now\(\),\s*now\(\) \+ make_interval\(days => p_duration_days\)/);

const inviteInsert = migration.match(/insert into public\.relationship_link_invites[\s\S]*?returning \* into v_invite;/)?.[0] ?? '';
assert.match(inviteInsert, /'pending', 0, null/);
assert.doesNotMatch(inviteInsert, /_codex_debit_gold/);

const acceptFunction = migration.match(/create or replace function public\.respond_relationship_link_invite[\s\S]*?create or replace function public\.resolve_competition_challenge_outcome/)?.[0] ?? '';
assert.match(acceptFunction, /_codex_debit_gold\([\s\S]*?50, 'competition_challenge'/);
assert.match(acceptFunction, /COMPETITION_CHALLENGE_ALREADY_ACTIVE/);
assert.match(acceptFunction, /COMPETITION_SOURCE_CHANGED/);
assert.match(acceptFunction, /COMPETITION_REWARD_COOLDOWN/);

assert.match(migration, /completed_at <= p_cutoff/);
assert.match(migration, /result_kind = 'draw'/);
assert.match(migration, /_competition_grant_bonus_xp/);
assert.match(migration, /finalize_due_competition_challenges/);
assert.match(migration, /revoke execute on function public\.create_competition_challenge\(uuid, uuid\) from authenticated/);

assert.match(gameContext, /createCompetitionInvite: \(recipientId: string, sourceArenaId: string, durationDays: number\)/);
assert.match(gameContext, /COMPETITION_COMPLETED/);
assert.match(connectionsModal, /min=\{1\}/);
assert.match(connectionsModal, /max=\{30\}/);
assert.match(connectionsModal, /quando o convite for aceito/);
assert.match(achievementModal, /case 'COMPETITION_COMPLETED'/);

console.log('Timed competition regression checks passed.');
