import { withBrowser } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  setupFriendFixture,
  getLatestRelationshipInvite,
  getUserProfile,
  setWallet,
  waitForDb,
} from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const checkpoints = [];

try {
  const fixture = await setupFriendFixture({ label: 'competition-link' });
  const { leader, friend } = fixture;
  await setWallet(leader.client, { userId: leader.userId, gold: 250 });

  await withBrowser({ baseUrl, debugPort: 9235 }, async (page) => {
    await page.login(leader.email, leader.password);
    checkpoints.push('leader-login');

    await page.clickSelector('#nav-settings');
    await page.waitForSelector('#settings-tab-premium', 20000);
    await page.clickSelector('#settings-tab-premium');
    await page.waitForSelector('#links-button', 15000);
    await page.waitFor(
      'premium links button enabled',
      `(() => {
        const button = document.querySelector('#links-button');
        return button instanceof HTMLButtonElement && !button.disabled;
      })()`,
      25000,
    );
    await page.clickSelector('#links-button');
    await page.waitForSelector('#relationship-hub-tab-competicao', 15000);
    await page.clickSelector('#relationship-hub-tab-competicao');
    await page.waitFor(
      'competition cta',
      `(() => Array.from(document.querySelectorAll('button')).some((node) => (node.innerText || '').toLowerCase().includes('nova competicao')))()`,
      20000,
    );
    await page.clickText('Nova competicao');
    await page.waitForSelector('#relationship-friend-search-input', 15000);
    await page.setInputValue('#relationship-friend-search-input', friend.nickname);
    await page.waitForSelector(`#relationship-friend-${friend.userId}`, 15000);
    await page.clickSelector(`#relationship-friend-${friend.userId}`);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    checkpoints.push('competition-invite-created-from-ui');
  });

  const invite = await waitForDb(
    'competition invite persistence',
    () => getLatestRelationshipInvite(leader.client, {
      senderId: leader.userId,
      recipientId: friend.userId,
      linkType: 'competicao',
    }),
  ).catch(() => null);
  if (!invite) {
    throw new Error('Competition invite row was not created in relationship_link_invites.');
  }

  const leaderProfile = await getUserProfile(leader.client, leader.userId);
  if (Number(leaderProfile.wallet?.gold || 0) !== 225) {
    throw new Error(`Expected leader gold to be 225 after competition invite, got ${Number(leaderProfile.wallet?.gold || 0)}.`);
  }

  if (invite.arena_id) {
    throw new Error('Competition invite should no longer require a linked arena at creation time.');
  }

  checkpoints.push('competition-invite-persisted');
  checkpoints.push('competition-gold-debited');

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      leaderEmail: leader.email,
      friendEmail: friend.email,
      inviteId: invite.id,
      remainingGold: leaderProfile.wallet?.gold || 0,
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
