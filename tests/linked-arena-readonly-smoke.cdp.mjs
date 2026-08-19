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
const normalizeForMatch = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

try {
  const mentor = await createTempUser({ label: 'linked-readonly-mentor', isPremium: true, gold: 500 });
  const pupil = await createTempUser({ label: 'linked-readonly-pupil', isPremium: false, gold: 50 });
  await createFriendship(mentor, pupil);

  const inviteResult = await mentor.client.rpc('create_relationship_link_invite', {
    p_recipient_id: pupil.userId,
    p_link_type: 'mentoria',
  });
  if (inviteResult.error) {
    throw new Error(`Failed to create mentorship invite for readonly smoke: ${inviteResult.error.message}`);
  }

  const inviteId = inviteResult.data?.invite?.id || inviteResult.data?.inviteId || inviteResult.data?.invite_id;
  if (!inviteId) {
    throw new Error('Failed to resolve mentorship invite id for readonly smoke.');
  }

  const acceptResult = await pupil.client.rpc('respond_relationship_link_invite', {
    p_invite_id: inviteId,
    p_action: 'accept',
  });
  if (acceptResult.error) {
    throw new Error(`Failed to accept mentorship invite for readonly smoke: ${acceptResult.error.message}`);
  }

  const activeLink = await waitForDb(
    'active mentorship link for readonly smoke',
    () => getActiveRelationshipLink(mentor.client, {
      mentorId: mentor.userId,
      pupilId: pupil.userId,
      linkType: 'mentoria',
    }),
  );

  await setWallet(mentor.client, { userId: mentor.userId, gold: 500 });
  const linkedArenaName = `Arena Leitura ${Date.now()}`;
  const linkedArenaCreate = await mentor.client.rpc('create_linked_relationship_arena', {
    p_relationship_link_id: activeLink.id,
    p_asset_id: 'consciencia',
    p_name: linkedArenaName,
    p_description: 'Arena de leitura para validar o lado do pupilo.',
    p_icon: '👁️',
  });
  if (linkedArenaCreate.error) {
    throw new Error(`Failed to create linked arena for readonly smoke: ${linkedArenaCreate.error.message}`);
  }

  const linkedArenaRow = await waitForDb(
    'relationship linked arena for readonly smoke',
    async () => {
      const rows = await getLinkedRelationshipArenas(mentor.client, { relationshipLinkId: activeLink.id });
      return rows.find((row) => row.metadata?.name === linkedArenaName || row.arena_id) || null;
    },
  );

  await withBrowser({ baseUrl, debugPort: 9242 }, async (page) => {
    await page.login(pupil.email, pupil.password);
    checkpoints.push('pupil-login');

    await page.dismissBlockingRuntimeOverlays();
    await page.clickSelector('#nav-mundo');
    await page.waitForSelector('#links-button', 15000);
    await page.clickSelector('#links-button');
    await page.waitForSelector('#relationship-hub-tab-mentoria', 15000);
    await page.clickSelector('#relationship-hub-tab-mentoria');
    await page.waitFor(
      'pupil mentorship relationship card',
      `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some((node) => {
          const text = (node.textContent || '').toLowerCase();
          return text.includes(${JSON.stringify(mentor.nickname.toLowerCase())});
        });
      })()`,
      20000,
    );
    await page.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find((node) => {
        const text = (node.textContent || '').toLowerCase();
        return text.includes(${JSON.stringify(mentor.nickname.toLowerCase())});
      });
      if (!(target instanceof HTMLElement)) return false;
      target.click();
      return true;
    })()`);
    checkpoints.push('pupil-opened-mentorship-detail');

    await page.waitFor(
      'linked arena card visible to pupil',
      `(() => {
        const body = (document.body?.innerText || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase();
        return body.includes(${JSON.stringify(normalizeForMatch(linkedArenaName))});
      })()`,
      20000,
    );
    await page.clickText(linkedArenaName);
    await page.waitFor(
      'readonly linked arena modal',
      `(() => {
        const body = (document.body?.innerText || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase();
        return body.includes(${JSON.stringify(normalizeForMatch(linkedArenaName))}) && body.includes('SOMENTE LEITURA');
      })()`,
      20000,
    );
    checkpoints.push('pupil-opened-linked-arena');

    await page.clickSelector('#add-action-button');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await page.waitFor(
      'readonly guard preserved',
      `(() => {
        const body = (document.body?.innerText || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase();
        const actionEditorOpen = document.querySelector('#onboarding-action-name-input') instanceof HTMLInputElement;
        return body.includes('SOMENTE LEITURA') && !actionEditorOpen;
      })()`,
      10000,
    );
    checkpoints.push('pupil-readonly-guard-triggered');
  });

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      mentorEmail: mentor.email,
      pupilEmail: pupil.email,
      relationshipLinkId: activeLink.id,
      linkedArenaBridgeId: linkedArenaRow.id,
      linkedArenaName,
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
