import { randomUUID } from 'node:crypto';
import {
  createFriendship,
  createTempUser,
  getActiveRelationshipLink,
  getUserProfile,
  waitForDb,
} from './_smoke.supabase.mjs';

function getChestCount(profile, type) {
  const entry = Array.isArray(profile?.chests) ? profile.chests.find((item) => item?.type === type) : null;
  return Number(entry?.count || 0);
}

async function insertSourceArenaWithAction(client, { userId, arenaName }) {
  const arenaId = randomUUID();
  const actionId = randomUUID();

  const arenaInsert = await client.from('arenas').insert({
    id: arenaId,
    user_id: userId,
    asset_id: 'consciencia',
    name: arenaName,
    description: 'Arena base para diagnostico do resultado da competicao.',
    icon: '🏁',
    is_archived: false,
  });

  if (arenaInsert.error) {
    throw new Error(`source arena insert failed: ${arenaInsert.error.message}`);
  }

  const actionInsert = await client.from('actions').insert({
    id: actionId,
    user_id: userId,
    arena_id: arenaId,
    name: 'Etapa unica',
    description: 'Acao unica para fechar a corrida.',
    icon: '⚔️',
    duration: 15,
    repetitions: 1,
    action_type: 'Compromisso',
    difficulty: 2,
  });

  if (actionInsert.error) {
    throw new Error(`source action insert failed: ${actionInsert.error.message}`);
  }

  return { arenaId };
}

async function getActionsForArena(client, arenaId) {
  const result = await client.from('actions').select('*').eq('arena_id', arenaId);
  if (result.error) {
    throw new Error(`arena actions lookup failed: ${result.error.message}`);
  }
  return result.data || [];
}

async function completeArena(client, { userId, arenaId }) {
  const actions = await getActionsForArena(client, arenaId);
  if (!actions.length) {
    throw new Error(`No actions found for mirrored arena ${arenaId}.`);
  }

  const payload = actions.map((action, index) => ({
    id: randomUUID(),
    user_id: userId,
    action_id: action.id,
    date: new Date().toISOString().slice(0, 10),
    start_time: 540 + index * 15,
    duration: Number(action.duration || 15),
    completed: true,
  }));

  const insert = await client.from('scheduled_tasks').insert(payload);
  if (insert.error) {
    throw new Error(`completed tasks insert failed: ${insert.error.message}`);
  }
}

async function getCompetitionNotification(client, { userId, challengeId }) {
  const result = await client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'competition_result')
    .order('created_at', { ascending: false });

  if (result.error) {
    throw new Error(`competition notification lookup failed: ${result.error.message}`);
  }

  return (result.data || []).find((row) => String(row.metadata?.challengeId || '') === challengeId) || null;
}

try {
  const leader = await createTempUser({ label: 'competition-outcome-leader', isPremium: false, gold: 150 });
  const friend = await createTempUser({ label: 'competition-outcome-friend', isPremium: false, gold: 50 });
  await createFriendship(leader, friend);

  const inviteResult = await leader.client.rpc('create_relationship_link_invite', {
    p_recipient_id: friend.userId,
    p_link_type: 'competicao',
  });
  if (inviteResult.error) {
    throw new Error(`competition invite failed: ${inviteResult.error.message}`);
  }

  const inviteId = inviteResult.data?.invite?.id || inviteResult.data?.inviteId || inviteResult.data?.invite_id;
  if (!inviteId) {
    throw new Error('Failed to resolve competition invite id.');
  }

  const acceptResult = await friend.client.rpc('respond_relationship_link_invite', {
    p_invite_id: inviteId,
    p_action: 'accept',
  });
  if (acceptResult.error) {
    throw new Error(`competition accept failed: ${acceptResult.error.message}`);
  }

  const activeLink = await waitForDb(
    'active competition link for outcome diagnostic',
    () => getActiveRelationshipLink(leader.client, {
      mentorId: leader.userId,
      pupilId: friend.userId,
      linkType: 'competicao',
    }),
  );

  const source = await insertSourceArenaWithAction(leader.client, {
    userId: leader.userId,
    arenaName: `Resultado Corrida ${Date.now()}`,
  });

  const leaderProfileBefore = await getUserProfile(leader.client, leader.userId);
  const friendProfileBefore = await getUserProfile(friend.client, friend.userId);

  const createResult = await leader.client.rpc('create_competition_challenge', {
    p_relationship_link_id: activeLink.id,
    p_source_arena_id: source.arenaId,
  });
  if (createResult.error) {
    throw new Error(`create competition challenge failed: ${createResult.error.message}`);
  }

  const challenge = createResult.data?.challenge;
  if (!challenge?.id) {
    throw new Error('Competition challenge RPC did not return challenge data.');
  }

  await completeArena(leader.client, {
    userId: leader.userId,
    arenaId: challenge.challenger_arena_id,
  });

  const winnerResult = await leader.client.rpc('resolve_competition_challenge_outcome', {
    p_arena_id: challenge.challenger_arena_id,
  });
  if (winnerResult.error) {
    throw new Error(`winner resolution failed: ${JSON.stringify({
      message: winnerResult.error.message,
      code: winnerResult.error.code,
      details: winnerResult.error.details,
      hint: winnerResult.error.hint,
    })}`);
  }
  if (winnerResult.data?.status !== 'winner') {
    throw new Error(`Expected winner status, got ${winnerResult.data?.status || 'unknown'}.`);
  }

  const rewardChestType = winnerResult.data?.reward_chest_type || 'Comum';
  const leaderProfileAfter = await getUserProfile(leader.client, leader.userId);
  const leaderBefore = getChestCount(leaderProfileBefore, rewardChestType);
  const leaderAfter = getChestCount(leaderProfileAfter, rewardChestType);
  if (leaderAfter <= leaderBefore) {
    throw new Error(`Winner did not receive chest ${rewardChestType}.`);
  }

  const loserNotification = await waitForDb(
    'loser notification for competition outcome',
    () => getCompetitionNotification(friend.client, { userId: friend.userId, challengeId: challenge.id }),
  );

  await completeArena(friend.client, {
    userId: friend.userId,
    arenaId: challenge.opponent_arena_id,
  });

  const loserResult = await friend.client.rpc('resolve_competition_challenge_outcome', {
    p_arena_id: challenge.opponent_arena_id,
  });
  if (loserResult.error) {
    throw new Error(`loser late resolution failed: ${JSON.stringify({
      message: loserResult.error.message,
      code: loserResult.error.code,
      details: loserResult.error.details,
      hint: loserResult.error.hint,
    })}`);
  }
  if (loserResult.data?.status !== 'already_lost') {
    throw new Error(`Expected already_lost status, got ${loserResult.data?.status || 'unknown'}.`);
  }

  const friendProfileAfter = await getUserProfile(friend.client, friend.userId);
  const friendBefore = getChestCount(friendProfileBefore, rewardChestType);
  const friendAfter = getChestCount(friendProfileAfter, rewardChestType);
  if (friendAfter !== friendBefore) {
    throw new Error('Loser received a chest after finishing late.');
  }

  console.log(JSON.stringify({
    success: true,
    leaderEmail: leader.email,
    friendEmail: friend.email,
    relationshipLinkId: activeLink.id,
    challengeId: challenge.id,
    rewardChestType,
    winnerStatus: winnerResult.data?.status,
    loserStatus: loserResult.data?.status,
    loserNotification: {
      id: loserNotification.id,
      content: loserNotification.content,
    },
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
