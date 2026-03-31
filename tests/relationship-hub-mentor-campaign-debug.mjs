import { randomUUID } from 'node:crypto';
import { withBrowser } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  createFriendship,
  createTempUser,
  getActiveRelationshipLink,
  waitForDb,
} from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const checkpoints = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function stabilizeRuntime(page, attempts = 4) {
  for (let index = 0; index < attempts; index += 1) {
    await page.dismissBlockingRuntimeOverlays(5000);
    await sleep(900);
  }
}

async function dismissSplashIfPresent(page) {
  await page.evaluate(`(() => {
    const nodes = Array.from(document.querySelectorAll('div, section, article'))
      .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);

    const splashLabel = nodes.find((node) => {
      const text = (node.innerText || node.textContent || '').toLowerCase();
      return text.includes('sincronizando...');
    });

    if (!(splashLabel instanceof HTMLElement)) return false;

    const splashRoot = splashLabel.closest('.fixed, [style*="position: fixed"]');
    if (splashRoot instanceof HTMLElement) {
      splashRoot.remove();
      return true;
    }

    return false;
  })()`);
}

async function exitRestScreenIfPresent(page) {
  const present = await page.evaluate(`(() => document.querySelector('.restscreen-unlock-trigger') instanceof HTMLElement)()`);
  if (!present) return;

  const engaged = await page.evaluate(`(() => {
    const target = document.querySelector('.restscreen-unlock-trigger');
    if (!(target instanceof HTMLElement)) return false;
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    return true;
  })()`);

  if (!engaged) {
    throw new Error(`Could not start RestScreen unlock hold.\n\n${await page.bodyText()}`);
  }

  await sleep(1200);
  await page.evaluate(`(() => {
    const target = document.querySelector('.restscreen-unlock-trigger');
    if (!(target instanceof HTMLElement)) return false;
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    return true;
  })()`);
  await sleep(1000);
}

async function openRelationshipHub(page) {
  const mundoClicked = await page.evaluate(`(() => {
    const targets = Array.from(document.querySelectorAll('#nav-mundo'))
      .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
    const target = targets[0];
    if (!(target instanceof HTMLElement)) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  })()`);
  if (!mundoClicked) {
    throw new Error(`Could not click visible Mundo nav.\n\n${await page.bodyText()}`);
  }
  await sleep(900);
  await page.waitForSelector('#links-button', 15000);
  const clicked = await page.evaluate(`(() => {
    const targets = Array.from(document.querySelectorAll('#links-button'))
      .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
    const target = targets[0];
    if (!(target instanceof HTMLElement)) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  })()`);
  if (!clicked) {
    throw new Error(`Could not click visible links button.\n\n${await page.bodyText()}`);
  }
  await page.waitFor(
    'relationship hub title',
    `(() => {
      const nodes = Array.from(document.querySelectorAll('div, span, h1, h2, h3, h4, p, button'))
        .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
      return nodes.some((node) => ((node.innerText || node.textContent || '')
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .toUpperCase()
        .includes('CENTRAL DE VINCULOS')));
    })()`,
    20000,
  );
  await sleep(1000);
}

async function clickButtonContainingText(page, text) {
  const ok = await page.evaluate(`(() => {
    const needle = ${JSON.stringify(text)}.toLowerCase();
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
      .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
    const target = buttons.find((node) => {
      const content = (node.innerText || node.textContent || '').toLowerCase();
      return content.includes(needle);
    });
    if (!(target instanceof HTMLElement)) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  })()`);

  if (!ok) {
    throw new Error(`Could not click button containing text "${text}".\n\n${await page.bodyText()}`);
  }
}

async function clickElementByTitle(page, title) {
  const ok = await page.evaluate(`(() => {
    const targets = Array.from(document.querySelectorAll(${JSON.stringify(`[title="${title}"]`)}))
      .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
    const target = targets[0];
    if (!(target instanceof HTMLElement)) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  })()`);

  if (!ok) {
    throw new Error(`Could not click element with title "${title}".\n\n${await page.bodyText()}`);
  }
}

async function waitForText(page, text, timeoutMs = 20000) {
  await page.waitFor(
    `text ${text}`,
    `(() => (document.body?.innerText || '').toLowerCase().includes(${JSON.stringify(text.toLowerCase())}))()`,
    timeoutMs,
  );
}

async function waitForTextToDisappear(page, text, timeoutMs = 20000) {
  await page.waitFor(
    `text to disappear ${text}`,
    `(() => !(document.body?.innerText || '').toLowerCase().includes(${JSON.stringify(text.toLowerCase())}))()`,
    timeoutMs,
  );
}

async function allowNativeConfirm(page) {
  await page.evaluate(`(() => {
    window.confirm = () => true;
    return true;
  })()`);
}

try {
  const mentor = await createTempUser({ label: 'relationship-hub-mentor', isPremium: true, appMode: 'GAME', gold: 600 });
  const pupil = await createTempUser({ label: 'relationship-hub-pupil', isPremium: false, appMode: 'GAME', gold: 50 });
  await createFriendship(mentor, pupil);
  checkpoints.push('users-created');

  const inviteResult = await mentor.client.rpc('create_relationship_link_invite', {
    p_recipient_id: pupil.userId,
    p_link_type: 'mentoria',
  });
  if (inviteResult.error) {
    throw new Error(`Failed to create mentorship invite: ${inviteResult.error.message}`);
  }

  const inviteId = inviteResult.data?.invite?.id || inviteResult.data?.inviteId || inviteResult.data?.invite_id;
  if (!inviteId) {
    throw new Error('Failed to resolve mentorship invite id.');
  }

  const acceptResult = await pupil.client.rpc('respond_relationship_link_invite', {
    p_invite_id: inviteId,
    p_action: 'accept',
  });
  if (acceptResult.error) {
    throw new Error(`Failed to accept mentorship invite: ${acceptResult.error.message}`);
  }
  checkpoints.push('mentorship-accepted');

  const activeLink = await waitForDb(
    'active mentorship link for relationship hub debug',
    () => getActiveRelationshipLink(mentor.client, {
      mentorId: mentor.userId,
      pupilId: pupil.userId,
      linkType: 'mentoria',
    }),
  );

  const arenaName = `Arena Hub ${Date.now()}`;
  const linkedArenaCreate = await mentor.client.rpc('create_linked_relationship_arena', {
    p_relationship_link_id: activeLink.id,
    p_asset_id: 'consciencia',
    p_name: arenaName,
    p_description: 'Arena fixture da central de vinculos.',
    p_icon: '🏛️',
  });
  if (linkedArenaCreate.error) {
    throw new Error(`Failed to create linked mentorship arena: ${linkedArenaCreate.error.message}`);
  }

  const arenaId = linkedArenaCreate.data?.arena?.id || linkedArenaCreate.data?.arenaId || linkedArenaCreate.data?.arena_id;
  if (!arenaId) {
    throw new Error('Failed to resolve linked arena id.');
  }

  const actionInsert = await mentor.client.from('actions').insert({
    id: randomUUID(),
    user_id: mentor.userId,
    arena_id: arenaId,
    name: 'Acao hub',
    description: 'Acao fixture da arena vinculada.',
    icon: '📝',
    duration: 20,
    repetitions: 1,
    action_type: 'Ação Recorrente',
    difficulty: 1,
  });
  if (actionInsert.error) {
    throw new Error(`Failed to create linked arena action: ${actionInsert.error.message}`);
  }

  const campaignName = `Campanha Hub ${Date.now()}`;
  const forgeResult = await mentor.client.rpc('forge_mentor_codex_for_pupil', {
    p_recipient_id: pupil.userId,
    p_name: campaignName,
    p_description: 'Campanha fixture da central de vinculos.',
    p_template: {
      title: campaignName,
      description: 'Campanha fixture da central de vinculos.',
      primaryAssetId: 'consciencia',
      levels: [
        {
          level: 1,
          title: 'Asawer',
          description: 'Primeira fase',
          actions: [
            {
              name: 'Leitura guiada',
              description: 'Acao da campanha fixture.',
              icon: '📘',
              duration: 15,
              repetitions: 1,
              actionType: 'Ação Recorrente',
              difficulty: 1,
            },
          ],
        },
      ],
    },
    p_relationship_link_id: activeLink.id,
  });
  if (forgeResult.error) {
    throw new Error(`Failed to forge mentorship campaign: ${forgeResult.error.message}`);
  }
  const campaignCodexId = forgeResult.data?.codex_id || forgeResult.data?.codexId;
  if (!campaignCodexId) {
    throw new Error('Failed to resolve forged mentorship campaign id.');
  }
  checkpoints.push('arena-and-campaign-seeded');

  await withBrowser({ baseUrl, debugPort: 9261 }, async (page) => {
    await page.login(pupil.email, pupil.password);
    checkpoints.push('pupil-login');
    await stabilizeRuntime(page);
    await dismissSplashIfPresent(page);
    await exitRestScreenIfPresent(page);
    await openRelationshipHub(page);
    await waitForText(page, 'Conteúdo do vínculo', 20000);
    await waitForText(page, campaignName, 30000);
    await waitForText(page, arenaName, 30000);
    checkpoints.push('pupil-saw-content');

    await clickButtonContainingText(page, campaignName);
    await waitForText(page, 'Loja', 15000);
    checkpoints.push('pupil-opened-campaign');

    await clickButtonContainingText(page, 'OK');
    await sleep(1000);

    await clickButtonContainingText(page, arenaName);
    await waitForText(page, 'MENTORIA', 15000);
    checkpoints.push('pupil-opened-arena');
  });

  await withBrowser({ baseUrl, debugPort: 9262 }, async (page) => {
    await page.login(mentor.email, mentor.password);
    checkpoints.push('mentor-login');
    await stabilizeRuntime(page);
    await dismissSplashIfPresent(page);
    await exitRestScreenIfPresent(page);
    await openRelationshipHub(page);
    await waitForText(page, 'Conteúdo do vínculo', 20000);
    await waitForText(page, campaignName, 30000);
    await waitForText(page, arenaName, 30000);
    checkpoints.push('mentor-saw-content');

    await allowNativeConfirm(page);

    await clickButtonContainingText(page, arenaName);
    await waitForText(page, 'MENTORIA', 15000);
    await clickElementByTitle(page, 'Abandonar Missao');
    await sleep(2500);
    const arenaLookup = await mentor.client.from('arenas').select('id').eq('id', arenaId).maybeSingle();
    if (arenaLookup.error) {
      throw new Error(`Arena delete lookup failed: ${arenaLookup.error.message}`);
    }
    if (arenaLookup.data?.id) {
      throw new Error('Arena delete click did not remove the arena in the backend.');
    }
    checkpoints.push('mentor-deleted-arena');

    await clickButtonContainingText(page, campaignName);
    await waitForText(page, 'Loja', 15000);
    await clickElementByTitle(page, 'Remover campanha deste vínculo');
    await sleep(2500);
    const codexLookup = await pupil.client.from('codex').select('id').eq('id', campaignCodexId).maybeSingle();
    if (codexLookup.error) {
      throw new Error(`Campaign delete lookup failed: ${codexLookup.error.message}`);
    }
    if (codexLookup.data?.id) {
      throw new Error('Campaign delete click did not remove the campaign in the backend.');
    }
    checkpoints.push('mentor-deleted-campaign');
  });

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      mentorEmail: mentor.email,
      mentorPassword: mentor.password,
      pupilEmail: pupil.email,
      pupilPassword: pupil.password,
      relationshipLinkId: activeLink.id,
      arenaName,
      campaignName,
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
