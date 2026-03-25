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

const normalizeForMatch = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

async function stabilizeRuntime(page, attempts = 4) {
  for (let index = 0; index < attempts; index += 1) {
    await page.dismissBlockingRuntimeOverlays(5000);
    await new Promise((resolve) => setTimeout(resolve, 900));
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

  await new Promise((resolve) => setTimeout(resolve, 1200));
  await page.evaluate(`(() => {
    const target = document.querySelector('.restscreen-unlock-trigger');
    if (!(target instanceof HTMLElement)) return false;
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    return true;
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function clickArenaCard(page, arenaName) {
  const clicked = await page.evaluate(`(() => {
    const needle = ${JSON.stringify(arenaName)}.toLowerCase();
    const cards = Array.from(document.querySelectorAll('.arena-plate')).filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
    const target = cards.find((node) => {
      const text = (node.innerText || node.textContent || '').toLowerCase();
      return text.includes(needle);
    });
    if (!(target instanceof HTMLElement)) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    target.click();
    return true;
  })()`);

  if (!clicked) {
    throw new Error(`Could not click arena card: ${arenaName}\n\n${await page.bodyText()}`);
  }
}

async function waitForVisibleArenaLabel(page, arenaName, timeoutMs = 60000) {
  await page.waitFor(
    `visible arena label ${arenaName}`,
    `(() => {
      const needle = ${JSON.stringify(arenaName)}.toLowerCase();
      const nodes = Array.from(document.querySelectorAll('button, [role="button"], div, span, h1, h2, h3, p'))
        .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
      return nodes.some((node) => {
        const text = (node.innerText || node.textContent || '').toLowerCase();
        return text.includes(needle);
      });
    })()`,
    timeoutMs,
  );
}

async function openArenasTab(page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.clickSelector('#nav-arenas');
    try {
      await page.waitFor(
        'arenas nav active',
        `(() => document.querySelector('#nav-arenas')?.classList.contains('auth-nav-active') === true)()`,
        5000,
      );
      await page.waitFor(
        'visible arenas shell',
        `(() => {
          const target = document.querySelector('#campaigns-section');
          return target instanceof HTMLElement && target.offsetParent !== null;
        })()`,
        5000,
      );
      return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  throw new Error(`Could not open Arenas tab.\n\n${await page.bodyText()}`);
}

try {
  const mentor = await createTempUser({ label: 'mentorship-arenas-mentor', isPremium: true, appMode: 'GAME', gold: 500 });
  const pupil = await createTempUser({ label: 'mentorship-arenas-pupil', isPremium: false, appMode: 'GAME', gold: 50 });
  await createFriendship(mentor, pupil);

  const arenaName = `Arena Diretiva ${Date.now()}`;
  const actionName = `Acao Diretiva ${Date.now()}`;

  const inviteResult = await mentor.client.rpc('create_relationship_link_invite', {
    p_recipient_id: pupil.userId,
    p_link_type: 'mentoria',
  });
  if (inviteResult.error) {
    throw new Error(`Failed to create mentorship invite for arenas smoke: ${inviteResult.error.message}`);
  }

  const inviteId = inviteResult.data?.invite?.id || inviteResult.data?.inviteId || inviteResult.data?.invite_id;
  if (!inviteId) {
    throw new Error('Failed to resolve mentorship invite id for arenas smoke.');
  }

  const acceptResult = await pupil.client.rpc('respond_relationship_link_invite', {
    p_invite_id: inviteId,
    p_action: 'accept',
  });
  if (acceptResult.error) {
    throw new Error(`Failed to accept mentorship invite for arenas smoke: ${acceptResult.error.message}`);
  }

  const activeLink = await waitForDb(
    'active mentorship link for arenas smoke',
    () => getActiveRelationshipLink(mentor.client, {
      mentorId: mentor.userId,
      pupilId: pupil.userId,
      linkType: 'mentoria',
    }),
  );

  const linkedArenaCreate = await mentor.client.rpc('create_linked_relationship_arena', {
    p_relationship_link_id: activeLink.id,
    p_asset_id: 'consciencia',
    p_name: arenaName,
    p_description: 'Arena guiada para validar a aba Arenas.',
    p_icon: '📘',
  });
  if (linkedArenaCreate.error) {
    throw new Error(`Failed to create linked mentorship arena for arenas smoke: ${linkedArenaCreate.error.message}`);
  }

  const arenaId = linkedArenaCreate.data?.arena?.id || linkedArenaCreate.data?.arenaId || linkedArenaCreate.data?.arena_id;
  if (!arenaId) {
    throw new Error('Failed to resolve linked mentorship arena id for arenas smoke.');
  }

  const actionInsert = await mentor.client.from('actions').insert({
    id: randomUUID(),
    user_id: mentor.userId,
    arena_id: arenaId,
    name: actionName,
    description: 'Acao base para a arena guiada aparecer na aba Arenas.',
    icon: '📝',
    duration: 30,
    repetitions: 1,
    action_type: 'Ação Recorrente',
    difficulty: 2,
    briefing: 'Smoke de visibilidade da aba Arenas.',
    assets: [],
    pre_flight: [],
    context: {
      schedule: {
        days: ['QUA'],
        startTime: 600,
      },
    },
  });

  if (actionInsert.error) {
    throw new Error(`Failed to seed mentorship action for arenas smoke: ${actionInsert.error.message}`);
  }

  await withBrowser({ baseUrl, debugPort: 9253 }, async (page) => {
    await page.login(pupil.email, pupil.password);
    checkpoints.push('pupil-login');

    await stabilizeRuntime(page);
    await dismissSplashIfPresent(page);
    await exitRestScreenIfPresent(page);

    await openArenasTab(page);
    await dismissSplashIfPresent(page);
    checkpoints.push('pupil-opened-arenas-tab');
    await waitForVisibleArenaLabel(page, arenaName, 60000);
    checkpoints.push('pupil-saw-mentorship-arena-in-arenas');

    await clickArenaCard(page, arenaName);
    await page.waitFor(
      'guided arena detail opened from Arenas tab',
      `(() => {
        const body = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
        return body.includes('PLANO GUIADO') && body.includes(${JSON.stringify(normalizeForMatch(actionName))});
      })()`,
      20000,
    );
    checkpoints.push('pupil-opened-mentorship-arena-from-arenas');
  });

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      mentorEmail: mentor.email,
      pupilEmail: pupil.email,
      relationshipLinkId: activeLink.id,
      arenaId,
      arenaName,
      actionName,
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
