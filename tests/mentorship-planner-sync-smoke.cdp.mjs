import { randomUUID } from 'node:crypto';
import { withBrowser } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  createFriendship,
  createTempUser,
  getActiveRelationshipLink,
  getUserProfile,
  waitForDb,
} from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const checkpoints = [];

const normalizeForMatch = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const DAY_ORDER = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

function getSaoPauloDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getSaoPauloDayToken(date = new Date()) {
  const weekday = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
  }).format(date);
  return weekday
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase();
}

function getOperationalSaoPauloDate(date = new Date()) {
  return new Date(date.getTime() - (4 * 60 * 60 * 1000));
}

function nextDayToken(dayToken) {
  const index = DAY_ORDER.indexOf(dayToken);
  return DAY_ORDER[(index + 1) % DAY_ORDER.length];
}

async function getArenaActions(client, arenaId) {
  const result = await client
    .from('actions')
    .select('*')
    .eq('arena_id', arenaId)
    .order('created_at', { ascending: true });

  if (result.error) {
    throw new Error(`arena actions lookup failed: ${result.error.message}`);
  }

  return result.data || [];
}

async function getPendingTasksForAction(client, { userId, actionId }) {
  const result = await client
    .from('scheduled_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('action_id', actionId)
    .eq('completed', false)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (result.error) {
    throw new Error(`scheduled tasks lookup failed: ${result.error.message}`);
  }

  return result.data || [];
}

async function clickActionEditButton(page) {
  const clicked = await page.evaluate(`(() => {
    const okButton = document.querySelector('#onboarding-action-save-button');
    if (!(okButton instanceof HTMLElement)) return false;
    const header = okButton.closest('div.flex-none');
    if (!(header instanceof HTMLElement)) return false;
    const buttons = Array.from(header.querySelectorAll('button')).filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
    const target = buttons.find((node) => node !== okButton);
    if (!(target instanceof HTMLElement)) return false;
    target.click();
    return true;
  })()`);

  if (!clicked) {
    throw new Error(`Could not enter action edit mode.\n\n${await page.bodyText()}`);
  }
}

async function clickDayToggle(page, dayToken) {
  const clicked = await page.evaluate(`(() => {
    const target = Array.from(document.querySelectorAll('button')).find((node) => {
      if (!(node instanceof HTMLElement) || node.offsetParent === null) return false;
      return (node.innerText || node.textContent || '').trim().toUpperCase() === ${JSON.stringify(dayToken)};
    });
    if (!(target instanceof HTMLElement)) return false;
    target.click();
    return true;
  })()`);

  if (!clicked) {
    throw new Error(`Could not toggle day ${dayToken}.\n\n${await page.bodyText()}`);
  }
}

async function clickVisibleText(page, text, description) {
  const clicked = await page.evaluate(`(() => {
    const needle = ${JSON.stringify(text)}.toLowerCase();
    const candidates = Array.from(document.querySelectorAll('button, div, span'));
    const target = candidates.find((node) => {
      if (!(node instanceof HTMLElement) || node.offsetParent === null) return false;
      return (node.innerText || node.textContent || '').toLowerCase().includes(needle);
    });
    if (!(target instanceof HTMLElement)) return false;
    target.click();
    return true;
  })()`);

  if (!clicked) {
    throw new Error(`Could not click ${description}: ${text}\n\n${await page.bodyText()}`);
  }
}

async function clickBoardButtonByText(page, text, description) {
  const clicked = await page.evaluate(`(() => {
    const needle = ${JSON.stringify(text)}.toLowerCase();
    const buttons = Array.from(document.querySelectorAll('button')).filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
    const target = buttons.find((node) => {
      const content = (node.innerText || node.textContent || '').toLowerCase();
      return content.includes(needle);
    });
    if (!(target instanceof HTMLElement)) return false;
    target.click();
    return true;
  })()`);

  if (!clicked) {
    throw new Error(`Could not click ${description}: ${text}\n\n${await page.bodyText()}`);
  }
}

async function selectActionTime(page, currentLabel, nextLabel) {
  const opened = await page.evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('button')).filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
    const target = buttons.find((node) => (node.innerText || node.textContent || '').trim() === ${JSON.stringify(currentLabel)});
    if (!(target instanceof HTMLElement)) return false;
    target.click();
    return true;
  })()`);

  if (!opened) {
    throw new Error(`Could not open action time picker: ${currentLabel}\n\n${await page.bodyText()}`);
  }

  await page.waitFor(
    'wheel picker option visible',
    `(() => Array.from(document.querySelectorAll('div')).some((node) => {
      if (!(node instanceof HTMLElement) || node.offsetParent === null) return false;
      return (node.innerText || node.textContent || '').trim() === ${JSON.stringify(nextLabel)};
    }))()`,
    10000,
  );

  const selected = await page.evaluate(`(() => {
    const target = Array.from(document.querySelectorAll('div')).find((node) => {
      if (!(node instanceof HTMLElement) || node.offsetParent === null) return false;
      return (node.innerText || node.textContent || '').trim() === ${JSON.stringify(nextLabel)};
    });
    if (!(target instanceof HTMLElement)) return false;
    target.click();
    return true;
  })()`);

  if (!selected) {
    throw new Error(`Could not select action time: ${nextLabel}\n\n${await page.bodyText()}`);
  }
}

async function stabilizeRuntime(page, attempts = 4) {
  for (let index = 0; index < attempts; index += 1) {
    await page.dismissBlockingRuntimeOverlays(5000);
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
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

  await new Promise((resolve) => setTimeout(resolve, 1100));
}

async function advancePlannerDay(page, steps = 1) {
  for (let index = 0; index < steps; index += 1) {
    const clicked = await page.evaluate(`(() => {
      const hud = document.querySelector('#cycle-hud');
      if (!(hud instanceof HTMLElement)) return false;
      const buttons = Array.from(hud.querySelectorAll('button')).filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
      const target = buttons[buttons.length - 1];
      if (!(target instanceof HTMLElement)) return false;
      target.click();
      return true;
    })()`);
    if (!clicked) {
      throw new Error(`Could not advance planner day.\n\n${await page.bodyText()}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
}

try {
  const mentor = await createTempUser({ label: 'mentorship-planner-mentor', isPremium: true, appMode: 'GAME', gold: 500 });
  const pupil = await createTempUser({ label: 'mentorship-planner-pupil', isPremium: false, appMode: 'GAME', gold: 50 });
  await createFriendship(mentor, pupil);

  const todayToken = getSaoPauloDayToken();
  const originalDay = nextDayToken(todayToken);
  const originalTimeLabel = '09:00';
  const updatedTimeLabel = '11:15';
  const updatedTimeMinutes = 11 * 60 + 15;
  const todayDate = getSaoPauloDateString();
  const operationalDate = getSaoPauloDateString(getOperationalSaoPauloDate());
  const arenaName = `Plano Guiado ${Date.now()}`;
  const originalActionName = `Acao Guiada ${Date.now()}`;
  const updatedActionName = `${originalActionName} Adaptada`;

  const inviteResult = await mentor.client.rpc('create_relationship_link_invite', {
    p_recipient_id: pupil.userId,
    p_link_type: 'mentoria',
  });
  if (inviteResult.error) {
    throw new Error(`Failed to create mentorship invite for planner smoke: ${inviteResult.error.message}`);
  }

  const inviteId = inviteResult.data?.invite?.id || inviteResult.data?.inviteId || inviteResult.data?.invite_id;
  if (!inviteId) {
    throw new Error('Failed to resolve mentorship invite id for planner smoke.');
  }

  const acceptResult = await pupil.client.rpc('respond_relationship_link_invite', {
    p_invite_id: inviteId,
    p_action: 'accept',
  });
  if (acceptResult.error) {
    throw new Error(`Failed to accept mentorship invite for planner smoke: ${acceptResult.error.message}`);
  }

  const activeLink = await waitForDb(
    'active mentorship link for planner smoke',
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
    p_description: 'Plano guiado do smoke integrado ao planner.',
    p_icon: '📘',
  });
  if (linkedArenaCreate.error) {
    throw new Error(`Failed to create linked mentorship arena for planner smoke: ${linkedArenaCreate.error.message}`);
  }

  const arenaId = linkedArenaCreate.data?.arena?.id || linkedArenaCreate.data?.arenaId || linkedArenaCreate.data?.arena_id;
  if (!arenaId) {
    throw new Error('Failed to resolve linked mentorship arena id for planner smoke.');
  }

  const actionInsert = await mentor.client.from('actions').insert({
    id: randomUUID(),
    user_id: mentor.userId,
    arena_id: arenaId,
    name: originalActionName,
    description: 'Base do mentor para validar adaptação do pupilo.',
    icon: '📝',
    duration: 45,
    repetitions: 1,
    action_type: 'Ação Recorrente',
    difficulty: 2,
    briefing: 'Smoke de mentoria integrada ao planner.',
    assets: [],
    pre_flight: [],
    context: {
      schedule: {
        days: [originalDay],
        startTime: 540,
      },
    },
  }).select('id').single();

  if (actionInsert.error || !actionInsert.data?.id) {
    throw new Error(`Failed to seed mentorship base action: ${actionInsert.error?.message || 'action missing'}`);
  }

  const actionId = actionInsert.data.id;

  await withBrowser({ baseUrl, debugPort: 9251 }, async (page) => {
    await page.login(pupil.email, pupil.password);
    checkpoints.push('pupil-login');

    await stabilizeRuntime(page);
    await exitRestScreenIfPresent(page);
    await page.clickSelector('#nav-mundo');
    await page.waitForSelector('#links-button', 15000);
    await page.clickSelector('#links-button');
    await page.waitForSelector('#relationship-hub-tab-mentoria', 15000);
    await page.clickSelector('#relationship-hub-tab-mentoria');
    await page.waitFor(
      'mentorship link card visible for pupil',
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
    await clickBoardButtonByText(page, arenaName, 'mentorship arena board');
    await page.waitFor(
      'mentorship arena detail open',
      `(() => {
        const body = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
        return body.includes(${JSON.stringify(normalizeForMatch(originalActionName))}) && body.includes('PLANO GUIADO');
      })()`,
      20000,
    );
    checkpoints.push('pupil-opened-mentorship-arena');

    await page.clickText(originalActionName);
    await page.waitFor(
      'mentorship action modal open',
      `(() => {
        const body = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
        return body.includes(${JSON.stringify(normalizeForMatch(originalActionName))}) && body.includes('ACAO');
      })()`,
      20000,
    );

    await clickActionEditButton(page);
    await page.waitFor(
      'action editor open for pupil',
      `(() => document.querySelector('#onboarding-action-name-input') instanceof HTMLInputElement)()`,
      15000,
    );
    checkpoints.push('pupil-entered-action-edit');

    await page.setInputValue('#onboarding-action-name-input', updatedActionName);
    await clickDayToggle(page, todayToken);
    await clickDayToggle(page, originalDay);
    await selectActionTime(page, originalTimeLabel, updatedTimeLabel);
    await page.clickSelector('#onboarding-action-save-button');
    await new Promise((resolve) => setTimeout(resolve, 2500));
    checkpoints.push('pupil-saved-mentorship-adaptation');

    await page.clickSelector('#nav-planner');
    await page.waitForSelector('#planner-container', 15000);
    if (operationalDate !== todayDate) {
      await advancePlannerDay(page, 1);
    }
    await page.waitFor(
      'planner reflects adapted mentorship action',
      `(() => {
        const body = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
        return body.includes(${JSON.stringify(normalizeForMatch(updatedActionName))});
      })()`,
      20000,
    );
    checkpoints.push('pupil-saw-adapted-action-in-planner');
  });

  const updatedAction = await waitForDb(
    'updated mentorship action row',
    async () => {
      const rows = await getArenaActions(mentor.client, arenaId);
      return rows.find((row) => row.id === actionId && row.name === updatedActionName) || null;
    },
  );

  const schedule = updatedAction?.context?.schedule || {};
  const updatedDays = Array.isArray(schedule.days) ? schedule.days : [];
  if (updatedDays.length !== 1 || updatedDays[0] !== todayToken) {
    throw new Error(`Expected updated mentorship action day to be ${todayToken}, got ${JSON.stringify(updatedDays)}.`);
  }
  if (Number(schedule.startTime) !== updatedTimeMinutes) {
    throw new Error(`Expected updated mentorship action start time to be ${updatedTimeMinutes}, got ${String(schedule.startTime)}.`);
  }
  checkpoints.push('mentorship-action-row-updated');

  const pupilTasks = await waitForDb(
    'pupil scheduled tasks after mentorship adaptation',
    async () => {
      const rows = await getPendingTasksForAction(pupil.client, { userId: pupil.userId, actionId });
      return rows.find((row) => Number(row.start_time) === updatedTimeMinutes && row.date === todayDate) || null;
    },
    { timeoutMs: 20000, intervalMs: 800 },
  );

  if (!pupilTasks) {
    throw new Error('Expected pupil pending task for adapted mentorship action, but none was found.');
  }
  checkpoints.push('pupil-task-rescheduled');

  await withBrowser({ baseUrl, debugPort: 9252 }, async (page) => {
    await page.login(mentor.email, mentor.password);
    checkpoints.push('mentor-login');

    await stabilizeRuntime(page);
    await exitRestScreenIfPresent(page);
    await page.clickSelector('#nav-mundo');
    await page.waitForSelector('#links-button', 15000);
    await page.clickSelector('#links-button');
    await page.waitForSelector('#relationship-hub-tab-mentoria', 15000);
    await page.clickSelector('#relationship-hub-tab-mentoria');
    await page.waitFor(
      'mentor sees mentorship link card',
      `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some((node) => {
          const text = (node.textContent || '').toLowerCase();
          return text.includes(${JSON.stringify(pupil.nickname.toLowerCase())}) && text.includes('seu pupilo');
        });
      })()`,
      20000,
    );
    await page.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find((node) => {
        const text = (node.textContent || '').toLowerCase();
        return text.includes(${JSON.stringify(pupil.nickname.toLowerCase())}) && text.includes('seu pupilo');
      });
      if (!(target instanceof HTMLElement)) return false;
      target.click();
      return true;
    })()`);
    await clickBoardButtonByText(page, arenaName, 'mentor mentorship arena board');
    await page.waitFor(
      'mentor sees adapted action name',
      `(() => {
        const body = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
        return body.includes(${JSON.stringify(normalizeForMatch(updatedActionName))});
      })()`,
      20000,
    );
    await page.clickText(updatedActionName);
    await clickActionEditButton(page);
    await page.waitFor(
      'mentor action editor open',
      `(() => document.querySelector('#onboarding-action-name-input') instanceof HTMLInputElement)()`,
      15000,
    );
    await page.waitFor(
      'mentor action modal shows adapted time',
      `(() => {
        const body = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
        return body.includes(${JSON.stringify(normalizeForMatch(updatedActionName))}) && body.includes(${JSON.stringify(updatedTimeLabel)});
      })()`,
      20000,
    );
    checkpoints.push('mentor-saw-adapted-mentorship-plan');
  });

  const mentorProfile = await getUserProfile(mentor.client, mentor.userId);
  const pupilProfile = await getUserProfile(pupil.client, pupil.userId);

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      mentorEmail: mentor.email,
      pupilEmail: pupil.email,
      relationshipLinkId: activeLink.id,
      arenaId,
      actionId,
      arenaName,
      actionNameBefore: originalActionName,
      actionNameAfter: updatedActionName,
      adaptedDay: todayToken,
      adaptedTime: updatedTimeLabel,
      mentorGold: mentorProfile.wallet?.gold || 0,
      pupilGold: pupilProfile.wallet?.gold || 0,
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
