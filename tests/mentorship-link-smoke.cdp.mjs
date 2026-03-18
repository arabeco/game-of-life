import { withBrowser } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  createFriendship,
  createTempUser,
  getActiveRelationshipLink,
  getUserProfile,
  setWallet,
  waitForDb,
} from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const checkpoints = [];

try {
  const mentor = await createTempUser({ label: 'mentorship-premium', isPremium: true, appMode: 'GAME', gold: 200 });
  const pupil = await createTempUser({ label: 'mentorship-free', isPremium: false, appMode: 'GAME', gold: 50 });
  await createFriendship(mentor, pupil);

  await withBrowser({ baseUrl, debugPort: 9238 }, async (page) => {
    await page.login(pupil.email, pupil.password);
    checkpoints.push('free-pupil-login');

    await page.clickSelector('#nav-settings');
    await page.waitForSelector('#settings-tab-premium', 20000);
    await page.clickSelector('#settings-tab-premium');
    await page.waitForSelector('#links-button', 15000);
    await page.clickSelector('#links-button');
    await page.waitForSelector('#relationship-hub-tab-mentoria', 15000);
    await page.clickSelector('#relationship-hub-tab-mentoria');
    await page.waitFor(
      'mentor invite disabled button',
      `(() => Array.from(document.querySelectorAll('button')).some((node) => (node.innerText || '').toLowerCase().includes('convidar pupilo')))()`,
      20000,
    );
    await page.waitFor(
      'free pupil cannot create mentor invite',
      `(() => {
        const button = Array.from(document.querySelectorAll('button')).find((node) => (node.innerText || '').toLowerCase().includes('convidar pupilo'));
        return button instanceof HTMLButtonElement && button.disabled;
      })()`,
      15000,
    );
    checkpoints.push('free-mentor-cta-locked');
  });

  await withBrowser({ baseUrl, debugPort: 9239 }, async (page) => {
    await page.login(mentor.email, mentor.password);
    checkpoints.push('premium-mentor-login');

    await page.clickSelector('#nav-settings');
    await page.waitForSelector('#settings-tab-premium', 20000);
    await page.clickSelector('#settings-tab-premium');
    await page.waitForSelector('#links-button', 15000);
    await page.clickSelector('#links-button');
    await page.waitForSelector('#relationship-hub-tab-mentoria', 15000);
    await page.clickSelector('#relationship-hub-tab-mentoria');
    await page.waitFor(
      'mentor cta',
      `(() => Array.from(document.querySelectorAll('button')).some((node) => (node.innerText || '').toLowerCase().includes('convidar pupilo')))()`,
      20000,
    );
    await page.clickText('Convidar pupilo');
    await page.waitForSelector('#relationship-friend-search-input', 15000);
    await page.setInputValue('#relationship-friend-search-input', pupil.nickname);
    await page.waitForSelector(`#relationship-friend-${pupil.userId}`, 15000);
    await page.clickSelector(`#relationship-friend-${pupil.userId}`);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    checkpoints.push('mentorship-invite-created');
  });

  await withBrowser({ baseUrl, debugPort: 9240 }, async (page) => {
    await page.login(pupil.email, pupil.password);
    checkpoints.push('pupil-login-to-accept');

    await page.clickSelector('#nav-settings');
    await page.waitForSelector('#settings-tab-premium', 20000);
    await page.clickSelector('#settings-tab-premium');
    await page.waitForSelector('#links-button', 15000);
    await page.clickSelector('#links-button');
    await page.waitForSelector('#relationship-hub-tab-mentoria', 15000);
    await page.clickSelector('#relationship-hub-tab-mentoria');
    await page.clickText('Aceitar');
    await new Promise((resolve) => setTimeout(resolve, 1800));
    checkpoints.push('mentorship-invite-accepted');
  });

  const activeLink = await waitForDb(
    'active mentorship link',
    () => getActiveRelationshipLink(mentor.client, {
      mentorId: mentor.userId,
      pupilId: pupil.userId,
      linkType: 'mentoria',
    }),
  );

  const mentorProfile = await getUserProfile(mentor.client, mentor.userId);
  if (Number(mentorProfile.wallet?.gold || 0) !== 150) {
    throw new Error(`Expected premium mentor gold to be 150 after invite acceptance, got ${Number(mentorProfile.wallet?.gold || 0)}.`);
  }

  checkpoints.push('mentorship-link-persisted');
  checkpoints.push('mentorship-gold-debited');

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      mentorEmail: mentor.email,
      pupilEmail: pupil.email,
      relationshipLinkId: activeLink.id,
      mentorGold: mentorProfile.wallet?.gold || 0,
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
