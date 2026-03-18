import { withBrowser } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  createFriendship,
  createTempUser,
  getActiveRelationshipLink,
  getLinkedRelationshipArenas,
  getUserProfile,
  setWallet,
  waitForDb,
} from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const checkpoints = [];

try {
  const mentor = await createTempUser({ label: 'linked-arena-mentor', isPremium: true, appMode: 'GAME', gold: 300 });
  const pupil = await createTempUser({ label: 'linked-arena-pupil', isPremium: false, appMode: 'GAME', gold: 50 });
  await createFriendship(mentor, pupil);

  const inviteResult = await mentor.client.rpc('create_relationship_link_invite', {
    p_recipient_id: pupil.userId,
    p_link_type: 'mentoria',
  });
  if (inviteResult.error || !inviteResult.data?.invite_id) {
    throw new Error(`Failed to create mentorship invite for linked arena smoke: ${inviteResult.error?.message || 'invite missing'}`);
  }

  const acceptResult = await pupil.client.rpc('respond_relationship_link_invite', {
    p_invite_id: inviteResult.data.invite_id,
    p_action: 'accept',
  });
  if (acceptResult.error) {
    throw new Error(`Failed to accept mentorship invite for linked arena smoke: ${acceptResult.error.message}`);
  }

  const activeLink = await waitForDb(
    'active mentorship link for linked arena smoke',
    () => getActiveRelationshipLink(mentor.client, {
      mentorId: mentor.userId,
      pupilId: pupil.userId,
      linkType: 'mentoria',
    }),
  );

  await setWallet(mentor.client, { userId: mentor.userId, gold: 500 });
  const linkedArenaName = `Arena Vinculada ${Date.now()}`;

  await withBrowser({ baseUrl, debugPort: 9241 }, async (page) => {
    await page.login(mentor.email, mentor.password);
    checkpoints.push('mentor-login');

    await page.clickSelector('#nav-settings');
    await page.waitForSelector('#settings-tab-premium', 20000);
    await page.clickSelector('#settings-tab-premium');
    await page.waitForSelector('#links-button', 15000);
    await page.clickSelector('#links-button');
    await page.waitForSelector('#relationship-hub-tab-mentoria', 15000);
    await page.clickSelector('#relationship-hub-tab-mentoria');
    await page.waitFor(
      'linked arena mentor action',
      `(() => Array.from(document.querySelectorAll('button')).some((node) => (node.innerText || '').toLowerCase().includes('arena vinculada')))()`,
      20000,
    );
    await page.clickText('Arena vinculada');
    await page.waitForSelector('#relationship-linked-arena-name-input', 15000);
    await page.setInputValue('#relationship-linked-arena-name-input', linkedArenaName);
    await page.setInputValue('#relationship-linked-arena-description-input', 'Arena compartilhada criada pelo smoke.');
    await page.clickSelector('#relationship-linked-arena-submit-button');
    await new Promise((resolve) => setTimeout(resolve, 2200));
    checkpoints.push('linked-arena-created');
  });

  const linkedArenaRow = await waitForDb(
    'relationship_link_arenas persistence',
    async () => {
      const rows = await getLinkedRelationshipArenas(mentor.client, { relationshipLinkId: activeLink.id });
      return rows.find((row) => row.metadata?.name === linkedArenaName || row.arena_id) || null;
    },
  );

  const mentorProfile = await getUserProfile(mentor.client, mentor.userId);
  if (Number(mentorProfile.wallet?.gold || 0) !== 440) {
    throw new Error(`Expected mentor gold to be 440 after linked arena creation, got ${Number(mentorProfile.wallet?.gold || 0)}.`);
  }

  checkpoints.push('linked-arena-persisted');
  checkpoints.push('linked-arena-gold-debited');

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      mentorEmail: mentor.email,
      pupilEmail: pupil.email,
      relationshipLinkId: activeLink.id,
      linkedArenaId: linkedArenaRow.id,
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
