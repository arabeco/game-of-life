import { withBrowser } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  getLatestRelationshipInvite,
  getUserProfile,
  setWallet,
  setupFriendFixture,
  waitForDb,
} from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const checkpoints = [];

try {
  const fixture = await setupFriendFixture({ label: 'partnership-link' });
  const { leader, friend } = fixture;
  await setWallet(leader.client, { userId: leader.userId, gold: 200 });

  await withBrowser({ baseUrl, debugPort: 9236 }, async (page) => {
    await page.login(leader.email, leader.password);
    checkpoints.push('leader-login');

    await page.dismissBlockingRuntimeOverlays();
    await page.clickSelector('#nav-mundo');
    await page.waitForSelector('#links-button', 15000);
    await page.clickSelector('#links-button');
    await page.waitForSelector('#relationship-hub-tab-parceria', 15000);
    await page.clickSelector('#relationship-hub-tab-parceria');
    await page.waitFor(
      'partnership create button',
      `(() => {
        const button = document.querySelector('#relationship-hub-primary-create-button');
        return button instanceof HTMLButtonElement && !button.disabled;
      })()`,
      20000,
    );
    await page.clickSelector('#relationship-hub-primary-create-button');
    await page.waitForSelector('#relationship-friend-search-input', 15000);
    await page.setInputValue('#relationship-friend-search-input', friend.nickname);
    await page.waitForSelector(`#relationship-friend-${friend.userId}`, 15000);
    await page.clickSelector(`#relationship-friend-${friend.userId}`);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    checkpoints.push('partnership-invite-created');
  });

  const pendingInvite = await waitForDb(
    'partnership invite persistence',
    () => getLatestRelationshipInvite(leader.client, {
      senderId: leader.userId,
      recipientId: friend.userId,
      linkType: 'parceria',
    }),
  );

  const debitedProfile = await getUserProfile(leader.client, leader.userId);
  if (Number(debitedProfile.wallet?.gold || 0) !== 150) {
    throw new Error(`Expected leader gold to be 150 after partnership invite, got ${Number(debitedProfile.wallet?.gold || 0)}.`);
  }
  checkpoints.push('partnership-gold-debited');

  await withBrowser({ baseUrl, debugPort: 9237 }, async (page) => {
    await page.login(friend.email, friend.password);
    checkpoints.push('friend-login');

    await page.dismissBlockingRuntimeOverlays();
    await page.clickSelector('#nav-mundo');
    await page.waitForSelector('#links-button', 15000);
    await page.clickSelector('#links-button');
    await page.waitForSelector('#relationship-hub-tab-parceria', 15000);
    await page.clickSelector('#relationship-hub-tab-parceria');
    await page.waitFor(
      'incoming partnership invite',
      `(() => {
        const body = (document.body?.innerText || '').toLowerCase();
        const hasSender = body.includes(${JSON.stringify(friend.nickname.toLowerCase())})
          || body.includes(${JSON.stringify(leader.nickname.toLowerCase())});
        const hasDecline = Array.from(document.querySelectorAll('button')).some((node) => {
          const text = (node.innerText || node.textContent || '').trim().toLowerCase();
          return text === 'recusar';
        });
        return hasSender && hasDecline;
      })()`,
      20000,
    );
    await page.clickText('Recusar');
    await new Promise((resolve) => setTimeout(resolve, 1800));
    checkpoints.push('partnership-invite-declined');
  });

  const declinedInvite = await waitForDb(
    'partnership invite declined state',
    async () => {
      const invite = await getLatestRelationshipInvite(leader.client, {
        senderId: leader.userId,
        recipientId: friend.userId,
        linkType: 'parceria',
      });
      return invite?.status === 'declined' ? invite : null;
    },
  );

  const refundedProfile = await getUserProfile(leader.client, leader.userId);
  if (Number(refundedProfile.wallet?.gold || 0) !== 200) {
    throw new Error(`Expected leader gold refund back to 200, got ${Number(refundedProfile.wallet?.gold || 0)}.`);
  }
  checkpoints.push('partnership-gold-refunded');

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      leaderEmail: leader.email,
      friendEmail: friend.email,
      inviteId: declinedInvite.id,
      refundedGold: refundedProfile.wallet?.gold || 0,
      pendingInviteId: pendingInvite.id,
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
