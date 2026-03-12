import { withBrowser } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  setupFriendFixture,
  getLatestCompetitionInvite,
  findArenaByName,
  waitForDb,
} from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const checkpoints = [];

try {
  const fixture = await setupFriendFixture({ label: 'competition-link' });
  const { leader, friend } = fixture;
  const challengeName = `Desafio Smoke ${Date.now()}`;

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
    await page.waitForSelector('#links-tab-desafios', 15000);
    await page.clickSelector('#links-tab-desafios');
    await page.waitForSelector('#links-new-challenge-button', 15000);
    await page.clickSelector('#links-new-challenge-button');
    await page.waitForSelector('#challenge-search-input', 15000);
    await page.setInputValue('#challenge-search-input', friend.nickname);
    await page.waitForSelector(`#challenge-friend-${friend.userId}`, 15000);
    await page.clickSelector(`#challenge-friend-${friend.userId}`);
    await page.waitForSelector('#new-arena-name-input', 15000);
    await page.setInputValue('#new-arena-name-input', challengeName);
    await page.setInputValue('#new-arena-description-input', 'Desafio PVP gerado pelo smoke do Codex.');
    await page.clickSelector('#new-arena-submit-button');
    await new Promise((resolve) => setTimeout(resolve, 2500));
    checkpoints.push('competition-invite-created-from-ui');
  });

  const createdArena = await waitForDb(
    `competition arena "${challengeName}" creation`,
    () => findArenaByName(leader.client, { userId: leader.userId, name: challengeName }),
  );

  const invite = await waitForDb(
    `competition invite "${challengeName}" persistence`,
    () => getLatestCompetitionInvite(leader.client, {
      senderId: leader.userId,
      recipientId: friend.userId,
      arenaName: challengeName,
    }),
  ).catch(() => null);
  if (!invite) {
    throw new Error('Competition invite row was not created in relationship_link_invites.');
  }

  checkpoints.push('competition-invite-persisted');

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      leaderEmail: leader.email,
      friendEmail: friend.email,
      inviteId: invite.id,
      arenaId: createdArena.id,
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
