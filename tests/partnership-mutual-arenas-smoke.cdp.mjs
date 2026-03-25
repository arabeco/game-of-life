import { withBrowser } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  createFriendship,
  createTempUser,
  getActiveRelationshipLink,
  getLinkedRelationshipArenas,
  setWallet,
  waitForDb,
} from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const checkpoints = [];

const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

async function openPartnershipDetail(page, otherNickname) {
  await page.clickSelector('#nav-mundo');
  await page.waitForSelector('#links-button', 15000);
  await page.clickSelector('#links-button');
  await page.waitForSelector('#relationship-hub-tab-parceria', 15000);
  await page.clickSelector('#relationship-hub-tab-parceria');
  await page.waitFor(
    'partnership relationship card',
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

async function createArenaFromPartnership(page, arenaName) {
  await page.waitFor(
    'partnership show arena button',
    `(() => Array.from(document.querySelectorAll('button')).some((node) => {
      const text = (node.innerText || node.textContent || '').toLowerCase();
      return text.includes('mostrar arena');
    }))()`,
    20000,
  );
  await page.clickText('Mostrar arena');
  await page.waitForSelector('#relationship-linked-arena-name-input', 15000);
  await page.setInputValue('#relationship-linked-arena-name-input', arenaName);
  await page.setInputValue('#relationship-linked-arena-description-input', 'Arena exibida dentro da parceria.');
  await page.clickSelector('#relationship-linked-arena-submit-button');
  await new Promise((resolve) => setTimeout(resolve, 2200));
}

try {
  const leader = await createTempUser({ label: 'partnership-mutual-a', isPremium: false, appMode: 'GAME', gold: 150 });
  const friend = await createTempUser({ label: 'partnership-mutual-b', isPremium: false, appMode: 'GAME', gold: 150 });
  await createFriendship(leader, friend);

  const inviteResult = await leader.client.rpc('create_relationship_link_invite', {
    p_recipient_id: friend.userId,
    p_link_type: 'parceria',
  });
  if (inviteResult.error) {
    throw new Error(`Failed to create partnership invite for mutual arenas smoke: ${inviteResult.error.message}`);
  }

  const inviteId = inviteResult.data?.invite?.id || inviteResult.data?.inviteId || inviteResult.data?.invite_id;
  if (!inviteId) {
    throw new Error('Failed to resolve partnership invite id for mutual arenas smoke.');
  }

  const acceptResult = await friend.client.rpc('respond_relationship_link_invite', {
    p_invite_id: inviteId,
    p_action: 'accept',
  });
  if (acceptResult.error) {
    throw new Error(`Failed to accept partnership invite for mutual arenas smoke: ${acceptResult.error.message}`);
  }

  const activeLink = await waitForDb(
    'active partnership link for mutual arenas smoke',
    () => getActiveRelationshipLink(leader.client, {
      mentorId: leader.userId,
      pupilId: friend.userId,
      linkType: 'parceria',
    }),
  );

  await setWallet(leader.client, { userId: leader.userId, gold: 150 });
  await setWallet(friend.client, { userId: friend.userId, gold: 150 });

  const leaderArenaName = `Arena A ${Date.now()}`;
  const friendArenaName = `Arena B ${Date.now() + 1}`;

  await withBrowser({ baseUrl, debugPort: 9243 }, async (page) => {
    await page.login(leader.email, leader.password);
    checkpoints.push('leader-login');

    await page.dismissBlockingRuntimeOverlays();
    await openPartnershipDetail(page, friend.nickname);
    checkpoints.push('leader-opened-partnership-detail');

    await page.waitFor(
      'partnership mutual sections',
      `(() => {
        const body = (document.body?.innerText || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase();
        return body.includes('SEU LADO') && body.includes('LADO DO ALIADO');
      })()`,
      20000,
    );

    await createArenaFromPartnership(page, leaderArenaName);
    checkpoints.push('leader-shared-arena-created');
  });

  const leaderLinkedArena = await waitForDb(
    'leader partnership linked arena persistence',
    async () => {
      const rows = await getLinkedRelationshipArenas(leader.client, { relationshipLinkId: activeLink.id });
      return rows.find((row) => row.created_by_user_id === leader.userId && row.metadata?.name === leaderArenaName) || null;
    },
    { timeoutMs: 30000 },
  );

  await withBrowser({ baseUrl, debugPort: 9244 }, async (page) => {
    await page.login(friend.email, friend.password);
    checkpoints.push('friend-login');

    await page.dismissBlockingRuntimeOverlays();
    await openPartnershipDetail(page, leader.nickname);
    checkpoints.push('friend-opened-partnership-detail');

    await page.waitFor(
      'leader arena visible to friend',
      `(() => {
        const body = (document.body?.innerText || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase();
        return body.includes(${JSON.stringify(normalize(leaderArenaName))});
      })()`,
      20000,
    );
    await page.clickText(leaderArenaName);
    await page.waitFor(
      'friend opens leader arena as readonly',
      `(() => {
        const body = (document.body?.innerText || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase();
        return body.includes(${JSON.stringify(normalize(leaderArenaName))}) && body.includes('SOMENTE LEITURA');
      })()`,
      20000,
    );
    checkpoints.push('friend-readonly-opened-leader-arena');

    await page.clickText('OK');
    await new Promise((resolve) => setTimeout(resolve, 800));
    await createArenaFromPartnership(page, friendArenaName);
    checkpoints.push('friend-shared-arena-created');
  });

  const friendLinkedArena = await waitForDb(
    'friend partnership linked arena persistence',
    async () => {
      const rows = await getLinkedRelationshipArenas(leader.client, { relationshipLinkId: activeLink.id });
      return rows.find((row) => row.created_by_user_id === friend.userId && row.metadata?.name === friendArenaName) || null;
    },
    { timeoutMs: 30000 },
  );

  await withBrowser({ baseUrl, debugPort: 9245 }, async (page) => {
    await page.login(leader.email, leader.password);
    checkpoints.push('leader-relogin');

    await page.dismissBlockingRuntimeOverlays();
    await openPartnershipDetail(page, friend.nickname);
    await page.waitFor(
      'friend arena visible to leader',
      `(() => {
        const body = (document.body?.innerText || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase();
        return body.includes(${JSON.stringify(normalize(friendArenaName))});
      })()`,
      20000,
    );
    await page.clickText(friendArenaName);
    await page.waitFor(
      'leader opens friend arena as readonly',
      `(() => {
        const body = (document.body?.innerText || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase();
        return body.includes(${JSON.stringify(normalize(friendArenaName))}) && body.includes('SOMENTE LEITURA');
      })()`,
      20000,
    );
    checkpoints.push('leader-readonly-opened-friend-arena');
  });

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      leaderEmail: leader.email,
      friendEmail: friend.email,
      relationshipLinkId: activeLink.id,
      leaderArenaBridgeId: leaderLinkedArena.id,
      friendArenaBridgeId: friendLinkedArena.id,
      leaderArenaName,
      friendArenaName,
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
