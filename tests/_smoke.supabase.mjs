import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, '.env.local');

function readLocalEnv() {
  const raw = fs.readFileSync(envPath, 'utf8');
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.trim().startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

const env = readLocalEnv();
export const SUPABASE_URL = env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
export const DEFAULT_SMOKE_URL = process.env.SMOKE_URL || 'http://127.0.0.1:3003/';
export const PROFILE_FLAG_TERMS_ACCEPTED = '__flag_terms_accepted_v1';
export const PROFILE_FLAG_TUTORIAL_COMPLETED = '__flag_tutorial_completed_v1';

export function createAnonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function buildProfilePayload({ userId, email, nickname, isPremium = true, appMode = 'GAME' }) {
  return {
    id: userId,
    email,
    nickname,
    avatar_url: `https://picsum.photos/seed/${userId}/100/100`,
    border: 'default',
    level: 1,
    background_url: `https://picsum.photos/seed/bg-${userId}/400/150`,
    banner_url: null,
    is_online: true,
    visible_widgets: ['consciencia.lema'],
    skin: 'BASIC',
    unlocked_skins: { BASIC: true },
    unlocked_items: {
      bodyStyles: {},
      hairStyles: {},
      outfits: {},
      head_under_items: {},
      helmets: {},
      head_over_items: {},
      artifacts: {},
      codexes: {},
      skins: {},
      borders: {},
      banners: {},
      glyphs: {},
      auras: {},
      orbs: {},
      plates: {},
      ornament: {},
      insignias: {},
      ui_skins: { BASIC: true },
    },
    completed_season_missions: [PROFILE_FLAG_TERMS_ACCEPTED, PROFILE_FLAG_TUTORIAL_COMPLETED],
    nobility: { exp: 0, rankId: 'vagante' },
    mood: 50,
    chests: [],
    role: 'user',
    is_premium: isPremium,
    app_mode: appMode,
    theme_preference: 'dark',
    arenas_view_mode: 'cards',
    wallet: { gold: 0, fragments: 0 },
  };
}

export async function createTempUser({ label, isPremium = true, appMode = 'GAME' }) {
  const client = createAnonClient();
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const nickname = `${label}-${suffix.slice(-6)}`;
  const email = `codex-${label}-${suffix}@example.com`;
  const password = 'SmokeTest1!';

  const signUp = await client.auth.signUp({ email, password });
  if (signUp.error) {
    throw new Error(`signUp failed for ${label}: ${signUp.error.message}`);
  }

  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error || !signIn.data.user) {
    throw new Error(`signIn failed for ${label}: ${signIn.error?.message || 'user missing'}`);
  }

  const profile = buildProfilePayload({
    userId: signIn.data.user.id,
    email,
    nickname,
    isPremium,
    appMode,
  });

  const profileUpsert = await client
    .from('user_profiles')
    .upsert(profile)
    .select('id,nickname,is_premium,app_mode')
    .single();

  if (profileUpsert.error) {
    throw new Error(`profile upsert failed for ${label}: ${profileUpsert.error.message}`);
  }

  return {
    client,
    email,
    password,
    userId: signIn.data.user.id,
    nickname,
  };
}

export async function createFriendship(sender, recipient) {
  const request = await sender.client
    .from('friend_requests')
    .insert({
      sender_id: sender.userId,
      recipient_id: recipient.userId,
      status: 'pending',
    })
    .select('id')
    .single();

  if (request.error || !request.data) {
    throw new Error(`friend request failed: ${request.error?.message || 'request missing'}`);
  }

  const acceptUpdate = await recipient.client
    .from('friend_requests')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', request.data.id);

  if (acceptUpdate.error) {
    throw new Error(`friend request accept failed: ${acceptUpdate.error.message}`);
  }

  const friendRows = await recipient.client.from('friends').insert([
    { user_id: sender.userId, friend_id: recipient.userId },
    { user_id: recipient.userId, friend_id: sender.userId },
  ]);

  if (friendRows.error) {
    throw new Error(`friend rows insert failed: ${friendRows.error.message}`);
  }

  return request.data.id;
}

export async function createClan(leader, { name = `Smoke Clan ${Date.now()}` } = {}) {
  const clanInsert = await leader.client
    .from('clans')
    .insert({
      name,
      icon: '🏰',
      description: 'Fixture de smoke do Codex',
      clan_type: 'Casual',
      recruitment_status: 'Aberto',
      exp: 0,
      rank_id: 'feudo',
    })
    .select('*')
    .single();

  if (clanInsert.error || !clanInsert.data) {
    throw new Error(`clan insert failed: ${clanInsert.error?.message || 'clan missing'}`);
  }

  const memberInsert = await leader.client
    .from('clan_members')
    .insert({ user_id: leader.userId, clan_id: clanInsert.data.id, role: 'leader' });

  if (memberInsert.error) {
    throw new Error(`leader clan membership failed: ${memberInsert.error.message}`);
  }

  return clanInsert.data;
}

export async function addClanMember(member, clanId) {
  const join = await member.client
    .from('clan_members')
    .insert({ user_id: member.userId, clan_id: clanId, role: 'member' });

  if (join.error) {
    throw new Error(`member clan join failed: ${join.error.message}`);
  }
}

export async function getActiveClanSeasonMission(client) {
  const activeSeason = await client.from('seasons').select('id,name').eq('is_active', true).single();
  if (activeSeason.error || !activeSeason.data) {
    throw new Error(`active season fetch failed: ${activeSeason.error?.message || 'season missing'}`);
  }

  const missions = await client
    .from('season_missions')
    .select('*')
    .eq('season_id', activeSeason.data.id)
    .eq('type', 'clan');

  if (missions.error || !missions.data?.length) {
    throw new Error(`clan season mission fetch failed: ${missions.error?.message || 'mission missing'}`);
  }

  return missions.data.find((mission) => mission.title === 'Unidade do Clã') || missions.data[0];
}

export async function getClanMissionProgress(client, { clanId, missionId }) {
  const result = await client
    .from('clan_mission_progress')
    .select('*')
    .eq('clan_id', clanId)
    .eq('mission_id', missionId)
    .maybeSingle();

  if (result.error) {
    throw new Error(`clan mission progress fetch failed: ${result.error.message}`);
  }

  return result.data || null;
}

export async function setClanMissionProgress(client, { clanId, missionId, targetValue, currentValue }) {
  const upsert = await client.from('clan_mission_progress').upsert(
    {
      clan_id: clanId,
      mission_id: missionId,
      target_value: targetValue,
      current_value: currentValue,
    },
    { onConflict: 'clan_id,mission_id' },
  );

  if (upsert.error) {
    throw new Error(`clan mission progress upsert failed: ${upsert.error.message}`);
  }
}

export async function getClanMissionParticipant(client, { clanId, missionId, userId }) {
  const result = await client
    .from('clan_mission_participants')
    .select('*')
    .eq('clan_id', clanId)
    .eq('mission_id', missionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (result.error) {
    throw new Error(`clan mission participant fetch failed: ${result.error.message}`);
  }

  return result.data || null;
}

export async function findArenaByName(client, { userId, name }) {
  const result = await client
    .from('arenas')
    .select('*')
    .eq('user_id', userId)
    .eq('name', name)
    .maybeSingle();

  if (result.error) {
    throw new Error(`arena lookup failed: ${result.error.message}`);
  }

  return result.data || null;
}

export async function findActionByName(client, { userId, name }) {
  const result = await client
    .from('actions')
    .select('*')
    .eq('user_id', userId)
    .eq('name', name)
    .maybeSingle();

  if (result.error) {
    throw new Error(`action lookup failed: ${result.error.message}`);
  }

  return result.data || null;
}

export async function insertCompletedTask(client, { userId, actionId, date, duration = 60, startTime = 540 }) {
  const insert = await client.from('scheduled_tasks').insert({
    id: randomUUID(),
    user_id: userId,
    action_id: actionId,
    date,
    start_time: startTime,
    duration,
    completed: true,
  });

  if (insert.error) {
    throw new Error(`completed task insert failed: ${insert.error.message}`);
  }
}

export async function getUserProfile(client, userId) {
  const result = await client
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (result.error || !result.data) {
    throw new Error(`user profile fetch failed: ${result.error?.message || 'profile missing'}`);
  }

  return result.data;
}

export async function getLatestCompetitionInvite(client, { senderId, recipientId, arenaName }) {
  const result = await client
    .from('relationship_link_invites')
    .select('*')
    .eq('sender_id', senderId)
    .eq('recipient_id', recipientId)
    .eq('link_type', 'competicao')
    .order('created_at', { ascending: false })
    .limit(5);

  if (result.error) {
    throw new Error(`competition invite lookup failed: ${result.error.message}`);
  }

  return (result.data || []).find((invite) => invite.arena_snapshot?.name === arenaName) || null;
}

export async function waitForDb(description, loader, { timeoutMs = 15000, intervalMs = 500 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await loader();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

export async function setupClanFixture({ label = 'clan-smoke' } = {}) {
  const leader = await createTempUser({ label: `${label}-leader`, isPremium: true, appMode: 'GAME' });
  const member = await createTempUser({ label: `${label}-member`, isPremium: true, appMode: 'GAME' });
  await createFriendship(leader, member);
  const clan = await createClan(leader, { name: `Smoke Clan ${label} ${Date.now()}` });
  await addClanMember(member, clan.id);
  const mission = await getActiveClanSeasonMission(leader.client);

  return { leader, member, clan, mission };
}

export async function setupFriendFixture({ label = 'friends-smoke' } = {}) {
  const leader = await createTempUser({ label: `${label}-leader`, isPremium: true, appMode: 'GAME' });
  const friend = await createTempUser({ label: `${label}-friend`, isPremium: true, appMode: 'GAME' });
  await createFriendship(leader, friend);
  return { leader, friend };
}
