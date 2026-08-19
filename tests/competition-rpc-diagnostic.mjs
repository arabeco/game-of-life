import { randomUUID } from 'node:crypto';
import {
  createFriendship,
  createTempUser,
  getActiveRelationshipLink,
  getUserProfile,
  waitForDb,
} from './_smoke.supabase.mjs';

async function insertSourceArenaWithAction(client, { userId, arenaName }) {
  const arenaId = randomUUID();
  const actionId = randomUUID();

  const arenaInsert = await client.from('arenas').insert({
    id: arenaId,
    user_id: userId,
    asset_id: 'consciencia',
    name: arenaName,
    description: 'Arena base para diagnostico do RPC de competicao.',
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
    name: 'Etapa diagnostico',
    description: 'Acao unica para diagnosticar a corrida.',
    icon: '⚔️',
    duration: 15,
    repetitions: 1,
    action_type: 'Compromisso',
    difficulty: 2,
  });

  if (actionInsert.error) {
    throw new Error(`source action insert failed: ${actionInsert.error.message}`);
  }

  return { arenaId, actionId };
}

try {
  const leader = await createTempUser({ label: 'competition-rpc-leader', isPremium: false, gold: 150 });
  const friend = await createTempUser({ label: 'competition-rpc-friend', isPremium: false, gold: 50 });
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
    'active competition link for rpc diagnostic',
    () => getActiveRelationshipLink(leader.client, {
      mentorId: leader.userId,
      pupilId: friend.userId,
      linkType: 'competicao',
    }),
  );

  const source = await insertSourceArenaWithAction(leader.client, {
    userId: leader.userId,
    arenaName: `RPC Corrida ${Date.now()}`,
  });

  const rpc = await leader.client.rpc('create_competition_challenge', {
    p_relationship_link_id: activeLink.id,
    p_source_arena_id: source.arenaId,
  });

  const leaderProfile = await getUserProfile(leader.client, leader.userId);

  console.log(JSON.stringify({
    success: !rpc.error,
    emails: {
      leader: leader.email,
      friend: friend.email,
    },
    relationshipLinkId: activeLink.id,
    sourceArenaId: source.arenaId,
    rpcData: rpc.data || null,
    rpcError: rpc.error ? {
      message: rpc.error.message,
      code: rpc.error.code,
      details: rpc.error.details,
      hint: rpc.error.hint,
    } : null,
    leaderGold: leaderProfile.wallet?.gold || 0,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
