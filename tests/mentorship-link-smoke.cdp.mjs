import { withBrowser } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  createFriendship,
  createTempUser,
  getActiveRelationshipLink,
  getLatestRelationshipInvite,
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

    await page.dismissBlockingRuntimeOverlays();
    await page.clickSelector('#nav-mundo');
    await page.waitForSelector('#links-button', 15000);
    await page.clickSelector('#links-button');
    await page.waitForSelector('#relationship-hub-tab-mentoria', 15000);
    await page.clickSelector('#relationship-hub-tab-mentoria');
    await page.waitFor(
      'mentor invite disabled button',
      `(() => document.querySelector('#relationship-hub-primary-create-button') instanceof HTMLButtonElement)()`,
      20000,
    );
    await page.waitFor(
      'free pupil cannot create mentor invite',
      `(() => {
        const button = document.querySelector('#relationship-hub-primary-create-button');
        return button instanceof HTMLButtonElement && button.disabled;
      })()`,
      15000,
    );
    checkpoints.push('free-mentor-cta-locked');
  });

  await withBrowser({ baseUrl, debugPort: 9239 }, async (page) => {
    await page.login(mentor.email, mentor.password);
    checkpoints.push('premium-mentor-login');

    await page.dismissBlockingRuntimeOverlays();
    await page.clickSelector('#nav-mundo');
    await page.waitForSelector('#links-button', 15000);
    await page.clickSelector('#links-button');
    await page.waitForSelector('#relationship-hub-tab-mentoria', 15000);
    await page.clickSelector('#relationship-hub-tab-mentoria');
    await page.waitFor(
      'mentor cta',
      `(() => {
        const button = document.querySelector('#relationship-hub-primary-create-button');
        return button instanceof HTMLButtonElement && !button.disabled;
      })()`,
      20000,
    );
    await page.clickSelector('#relationship-hub-primary-create-button');
    await page.waitForSelector('#relationship-friend-search-input', 15000);
    await page.setInputValue('#relationship-friend-search-input', pupil.nickname);
    await page.waitForSelector(`#relationship-friend-${pupil.userId}`, 15000);
    await page.clickSelector(`#relationship-friend-${pupil.userId}`);
    await page.waitFor(
      'mentorship confirmation modal',
      `(() => (document.body?.innerText || '').toLowerCase().includes('confirmar mentoria'))()`,
      15000,
    );
    await page.clickText('Enviar por');
    await new Promise((resolve) => setTimeout(resolve, 1800));
    checkpoints.push('mentorship-invite-created');
  });

  const mentorshipInvite = await waitForDb(
    'mentorship invite persistence',
    () => getLatestRelationshipInvite(mentor.client, {
      senderId: mentor.userId,
      recipientId: pupil.userId,
      linkType: 'mentoria',
    }),
  ).catch(() => null);
  if (!mentorshipInvite) {
    throw new Error('Mentorship invite row was not created in relationship_link_invites.');
  }
  checkpoints.push('mentorship-invite-persisted');

  await withBrowser({ baseUrl, debugPort: 9240 }, async (page) => {
    await page.login(pupil.email, pupil.password);
    checkpoints.push('pupil-login-to-accept');

    await page.dismissBlockingRuntimeOverlays();
    await page.clickSelector('#nav-mundo');
    await page.waitForSelector('#links-button', 15000);
    await page.clickSelector('#links-button');
    await page.waitForSelector('#relationship-hub-tab-mentoria', 15000);
    await page.clickSelector('#relationship-hub-tab-mentoria');
    await page.waitFor(
      'accept mentorship invite button',
      `(() => Array.from(document.querySelectorAll('button')).some((node) => (node.innerText || node.textContent || '').toLowerCase().includes('aceitar')))()`,
      20000,
    );
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
  if (Number(mentorProfile.wallet?.gold || 0) !== 100) {
    throw new Error(`Expected premium mentor gold to be 100 after invite acceptance, got ${Number(mentorProfile.wallet?.gold || 0)}.`);
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
