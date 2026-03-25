import { randomUUID } from 'node:crypto';
import { withBrowser } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  createFriendship,
  createTempUser,
  findArenaByName,
  getActiveRelationshipLink,
  getUserProfile,
  waitForDb,
} from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const checkpoints = [];

const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

function getChestCount(profile, type) {
  const entry = Array.isArray(profile?.chests) ? profile.chests.find((item) => item?.type === type) : null;
  return Number(entry?.count || 0);
}

async function openCompetitionDetail(page, otherNickname) {
  await page.clickSelector('#nav-mundo');
  await page.waitForSelector('#links-button', 15000);
  await page.clickSelector('#links-button');
  await page.waitForSelector('#relationship-hub-tab-competicao', 15000);
  await page.clickSelector('#relationship-hub-tab-competicao');
  await page.waitFor(
    'competition relationship card',
    `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some((node) => {
        const text = (node.textContent || '').toLowerCase();
        return text.includes(${JSON.stringify(otherNickname.toLowerCase())});
      });
    })()`,
    20000,
  );
  await page.evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find((node) => {
      const text = (node.textContent || '').toLowerCase();
      return text.includes(${JSON.stringify(otherNickname.toLowerCase())});
    });
    if (!(target instanceof HTMLElement)) return false;
    target.click();
    return true;
  })()`);
}

async function createSourceArenaViaUi(page, arenaName) {
  await page.clickSelector('#nav-arenas');
  await page.waitForSelector('#new-action-button', 15000);
  await page.clickSelector('#new-action-button');
  await page.waitForSelector('#new-arena-name-input', 15000);
  await page.setInputValue('#new-arena-name-input', arenaName);
  await page.setInputValue('#new-arena-description-input', 'Arena base para validar a corrida espelhada.');
  await page.clickSelector('#new-arena-submit-button');
  await page.waitFor(
    'arena detail modal after creation',
    `(() => document.querySelector('#add-action-button') instanceof HTMLElement)()`,
    20000,
  );

  const actionNames = ['Etapa 1'];
  for (const actionName of actionNames) {
    await page.clickSelector('#add-action-button');
    await page.waitForSelector('#onboarding-action-name-input', 15000);
    await page.setInputValue('#onboarding-action-name-input', actionName);
    await page.clickSelector('#onboarding-action-save-button');
    await page.waitFor(
      `action ${actionName} visible`,
      `(() => {
        const body = (document.body?.innerText || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase();
        return body.includes(${JSON.stringify(normalize(actionName))});
      })()`,
      20000,
    );
  }

  await page.evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find((node) => {
      const text = (node.innerText || node.textContent || '').toLowerCase();
      return text.includes('ok');
    });
    if (!(target instanceof HTMLElement)) return false;
    target.click();
    return true;
  })()`);

  await page.waitFor(
    'arena visible in board',
    `(() => {
      const body = (document.body?.innerText || '')
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .toUpperCase();
      return body.includes(${JSON.stringify(normalize(arenaName))});
    })()`,
    20000,
  );
}

async function getCompetitionChallenge(client, relationshipLinkId) {
  const result = await client
    .from('relationship_competition_challenges')
    .select('*')
    .eq('relationship_link_id', relationshipLinkId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new Error(`competition challenge lookup failed: ${result.error.message}`);
  }

  return result.data || null;
}

async function getActionsForArena(client, arenaId) {
  const result = await client
    .from('actions')
    .select('*')
    .eq('arena_id', arenaId)
    .order('name', { ascending: true });

  if (result.error) {
    throw new Error(`arena actions lookup failed: ${result.error.message}`);
  }

  return result.data || [];
}

async function insertCompletedTasksForArena(client, { userId, arenaId }) {
  const actions = await getActionsForArena(client, arenaId);
  if (!actions.length) {
    throw new Error(`No actions found for mirrored arena ${arenaId}.`);
  }

  const date = new Date().toISOString().slice(0, 10);
  const payload = actions.map((action, index) => ({
    id: randomUUID(),
    user_id: userId,
    action_id: action.id,
    date,
    start_time: 540 + index * 30,
    duration: Number(action.duration || 15),
    completed: true,
  }));

  const insert = await client.from('scheduled_tasks').insert(payload);
  if (insert.error) {
    throw new Error(`completed task insert failed: ${insert.error.message}`);
  }
}

async function getCompetitionNotifications(client, userId) {
  const result = await client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'competition_result')
    .order('created_at', { ascending: false })
    .limit(10);

  if (result.error) {
    throw new Error(`competition notification lookup failed: ${result.error.message}`);
  }

  return result.data || [];
}

try {
  const leader = await createTempUser({ label: 'competition-race-leader', isPremium: false, appMode: 'GAME', gold: 150 });
  const friend = await createTempUser({ label: 'competition-race-friend', isPremium: false, appMode: 'GAME', gold: 50 });
  await createFriendship(leader, friend);

  const inviteResult = await leader.client.rpc('create_relationship_link_invite', {
    p_recipient_id: friend.userId,
    p_link_type: 'competicao',
  });
  if (inviteResult.error) {
    throw new Error(`Failed to create competition invite: ${inviteResult.error.message}`);
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
    throw new Error(`Failed to accept competition invite: ${acceptResult.error.message}`);
  }

  const activeLink = await waitForDb(
    'active competition link',
    () => getActiveRelationshipLink(leader.client, {
      mentorId: leader.userId,
      pupilId: friend.userId,
      linkType: 'competicao',
    }),
  );

  const leaderProfileBefore = await getUserProfile(leader.client, leader.userId);
  const friendProfileBefore = await getUserProfile(friend.client, friend.userId);
  const sourceArenaName = `Corrida ${Date.now()}`;

  await withBrowser({ baseUrl, debugPort: 9246 }, async (page) => {
    await page.login(leader.email, leader.password);
    checkpoints.push('leader-login');

    await page.dismissBlockingRuntimeOverlays();
    await createSourceArenaViaUi(page, sourceArenaName);
    checkpoints.push('source-arena-created');

    const sourceArena = await waitForDb(
      'source arena persisted after ui creation',
      () => findArenaByName(leader.client, { userId: leader.userId, name: sourceArenaName }),
      { timeoutMs: 20000 },
    );

    await page.dismissBlockingRuntimeOverlays();
    await openCompetitionDetail(page, friend.nickname);
    checkpoints.push('leader-opened-competition-detail');

    await page.clickText('Lancar desafio');
    await page.waitForSelector(`#relationship-competition-source-${sourceArena.id}`, 20000);
    await page.clickSelector(`#relationship-competition-source-${sourceArena.id}`);
    await page.clickSelector('#relationship-competition-submit-button');
    checkpoints.push('leader-launched-challenge');
  });

  const challenge = await waitForDb(
    'competition challenge persistence',
    () => getCompetitionChallenge(leader.client, activeLink.id),
    { timeoutMs: 30000 },
  );

  if (!challenge) {
    throw new Error('Competition challenge row was not created.');
  }

  checkpoints.push('challenge-persisted');

  await insertCompletedTasksForArena(leader.client, {
    userId: leader.userId,
    arenaId: challenge.challenger_arena_id,
  });

  const leaderResolve = await leader.client.rpc('resolve_competition_challenge_outcome', {
    p_arena_id: challenge.challenger_arena_id,
  });
  if (leaderResolve.error) {
    throw new Error(`Leader resolve failed: ${leaderResolve.error.message}`);
  }
  if (leaderResolve.data?.status !== 'winner') {
    throw new Error(`Expected leader to win first, got status ${leaderResolve.data?.status || 'unknown'}.`);
  }

  checkpoints.push('leader-won-race');

  const finalizedChallenge = await waitForDb(
    'competition challenge finalization',
    async () => {
      const row = await getCompetitionChallenge(leader.client, activeLink.id);
      return row?.winner_user_id ? row : null;
    },
    { timeoutMs: 30000 },
  );

  const leaderProfileAfter = await getUserProfile(leader.client, leader.userId);
  const rewardChestType = finalizedChallenge.reward_chest_type || leaderResolve.data?.reward_chest_type || 'Incomum';
  const leaderChestBefore = getChestCount(leaderProfileBefore, rewardChestType);
  const leaderChestAfter = getChestCount(leaderProfileAfter, rewardChestType);
  if (leaderChestAfter <= leaderChestBefore) {
    throw new Error(`Expected leader chest count to increase for ${rewardChestType}.`);
  }

  checkpoints.push('leader-received-chest');

  const loserNotification = await waitForDb(
    'competition loser notification',
    async () => {
      const rows = await getCompetitionNotifications(friend.client, friend.userId);
      return rows.find((row) => String(row.metadata?.challengeId || '') === finalizedChallenge.id) || null;
    },
    { timeoutMs: 30000 },
  );

  checkpoints.push('loser-notified');

  await insertCompletedTasksForArena(friend.client, {
    userId: friend.userId,
    arenaId: challenge.opponent_arena_id,
  });

  const friendResolve = await friend.client.rpc('resolve_competition_challenge_outcome', {
    p_arena_id: challenge.opponent_arena_id,
  });
  if (friendResolve.error) {
    throw new Error(`Friend resolve failed: ${friendResolve.error.message}`);
  }
  if (friendResolve.data?.status !== 'already_lost') {
    throw new Error(`Expected friend to lose late, got status ${friendResolve.data?.status || 'unknown'}.`);
  }

  const friendProfileAfter = await getUserProfile(friend.client, friend.userId);
  const friendChestAfter = getChestCount(friendProfileAfter, rewardChestType);
  const friendChestBefore = getChestCount(friendProfileBefore, rewardChestType);
  if (friendChestAfter !== friendChestBefore) {
    throw new Error('Loser should not receive a chest after finishing late.');
  }

  checkpoints.push('late-finish-no-chest');

  await withBrowser({ baseUrl, debugPort: 9247 }, async (page) => {
    await page.login(friend.email, friend.password);
    checkpoints.push('friend-login');

    await page.dismissBlockingRuntimeOverlays();
    await openCompetitionDetail(page, leader.nickname);
    await page.waitFor(
      'friend sees finished competition state',
      `(() => {
        const body = (document.body?.innerText || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase();
        return body.includes('TERMINOU PRIMEIRO') || body.includes('NAO GANHA BAU');
      })()`,
      20000,
    );
    checkpoints.push('friend-saw-finished-state');
  });

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      leaderEmail: leader.email,
      friendEmail: friend.email,
      relationshipLinkId: activeLink.id,
      sourceArenaName,
      challengeId: finalizedChallenge.id,
      rewardChestType,
      loserNotificationId: loserNotification.id,
    },
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    checkpoints,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
