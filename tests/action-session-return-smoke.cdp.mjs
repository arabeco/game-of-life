import { randomUUID } from 'node:crypto';
import { withBrowser, sleep } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  createTempUser,
  waitForDb,
} from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;

function getSaoPauloDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

async function insertActionFixture(user) {
  const arenaId = randomUUID();
  const actionId = randomUUID();
  const taskId = randomUUID();
  const today = getSaoPauloDateString();

  const arenaInsert = await user.client.from('arenas').insert({
    id: arenaId,
    user_id: user.userId,
    asset_id: 'projetos',
    name: `Smoke Aula ${Date.now()}`,
    description: 'Arena de smoke para retorno da sessao da acao.',
    icon: '📚',
    is_archived: false,
  });

  if (arenaInsert.error) {
    throw new Error(`arena insert failed: ${arenaInsert.error.message}`);
  }

  const actionInsert = await user.client.from('actions').insert({
    id: actionId,
    user_id: user.userId,
    arena_id: arenaId,
    name: 'Leitura guiada smoke',
    description: 'Ação para validar o retorno do foco para a própria ação.',
    icon: '📘',
    duration: 15,
    repetitions: 1,
    action_type: 'Compromisso',
    difficulty: 2,
    briefing: 'Página 1 da leitura.\n\n[[page]]\n\nPágina 2 da leitura.',
  });

  if (actionInsert.error) {
    throw new Error(`action insert failed: ${actionInsert.error.message}`);
  }

  const taskInsert = await user.client.from('scheduled_tasks').insert({
    id: taskId,
    user_id: user.userId,
    action_id: actionId,
    date: today,
    start_time: 18 * 60,
    duration: 15,
    completed: false,
  });

  if (taskInsert.error) {
    throw new Error(`scheduled task insert failed: ${taskInsert.error.message}`);
  }

  return {
    arenaId,
    actionId,
    taskId,
    actionName: 'Leitura guiada smoke',
    actionIcon: '📘',
    actionType: 'Compromisso',
  };
}

async function openActionModal(page, { actionId, taskId }) {
  await page.evaluate(`(() => {
    window.dispatchEvent(new CustomEvent('planner:open-action-modal', {
      detail: {
        actionId: ${JSON.stringify(actionId)},
        taskId: ${JSON.stringify(taskId)},
      },
    }));
    return true;
  })()`);
}

async function clickVisibleButton(page, label) {
  const clicked = await page.evaluate(`(() => {
    const needle = ${JSON.stringify(label)}.toLowerCase();
    const buttons = Array.from(document.querySelectorAll('button')).filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
    const target = buttons.find((node) => (node.innerText || node.textContent || '').toLowerCase().includes(needle));
    if (!(target instanceof HTMLElement)) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  })()`);

  if (!clicked) {
    throw new Error(`Could not click button: ${label}\n\n${await page.bodyText()}`);
  }
}

async function closeReadingOverlay(page) {
  const closed = await page.evaluate(`(() => {
    const target = document.querySelector('button[aria-label="Fechar leitura"]');
    if (!(target instanceof HTMLElement)) return false;
    target.click();
    return true;
  })()`);

  if (!closed) {
    throw new Error(`Could not close reading overlay.\n\n${await page.bodyText()}`);
  }
}

async function holdCompleteButton(page) {
  const engaged = await page.evaluate(`(() => {
    const target = Array.from(document.querySelectorAll('button')).find((node) => {
      if (!(node instanceof HTMLElement) || node.offsetParent === null) return false;
      return (node.innerText || node.textContent || '').toLowerCase().includes('segure para concluir');
    });
    if (!(target instanceof HTMLElement)) return false;
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    return true;
  })()`);

  if (!engaged) {
    throw new Error(`Could not start hold on complete button.\n\n${await page.bodyText()}`);
  }

  await sleep(1200);

  await page.evaluate(`(() => {
    const target = Array.from(document.querySelectorAll('button')).find((node) => {
      if (!(node instanceof HTMLElement)) return false;
      return (node.innerText || node.textContent || '').toLowerCase().includes('segure para concluir');
    });
    if (!(target instanceof HTMLElement)) return false;
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    return true;
  })()`);
}

try {
  const user = await createTempUser({
    label: 'action-session',
    isPremium: true,
    appMode: 'GAME',
    gold: 500,
  });

  const fixture = await insertActionFixture(user);
  const checkpoints = [];

  await withBrowser({ baseUrl, debugPort: 9351 }, async (page) => {
    await page.login(user.email, user.password);
    checkpoints.push('login');

    await page.dismissBlockingRuntimeOverlays(6000);
    await page.clickSelector('#nav-planner');
    await page.waitForSelector('#planner-container', 15000);
    checkpoints.push('planner');

    await page.waitFor(
      'action visible on planner',
      `(() => (document.body?.innerText || '').toLowerCase().includes('leitura guiada smoke'))()`,
      15000,
    );
    await sleep(700);
    await openActionModal(page, fixture);

    await page.waitFor(
      'action modal CTA shell',
      `(() => {
        const text = (document.body?.innerText || '');
        return text.includes('Começar agora') && text.includes('Segure para concluir');
      })()`,
      15000,
    );
    checkpoints.push('action-cta');

    await clickVisibleButton(page, 'Conteúdo');
    await clickVisibleButton(page, 'ANOTAÇÃO');
    await page.waitFor(
      'reading CTA',
      `(() => (document.body?.innerText || '').toLowerCase().includes('iniciar leitura'))()`,
      10000,
    );
    checkpoints.push('reading-cta');

    await clickVisibleButton(page, 'Iniciar leitura');
    await page.waitFor(
      'reading overlay open',
      `(() => {
        const text = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
        return text.includes('leitura guiada') && text.includes('pagina 1/2');
      })()`,
      10000,
    );
    checkpoints.push('reading-open');

    await closeReadingOverlay(page);
    await page.waitFor(
      'returned from reading overlay',
      `(() => {
        const text = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
        return text.includes('comecar agora') && text.includes('segure para concluir') && !text.includes('pagina 1/2');
      })()`,
      10000,
    );
    checkpoints.push('reading-return');

    await clickVisibleButton(page, 'Essencial');
    await holdCompleteButton(page);
    await waitForDb(
      'scheduled task completion after action hold',
      async () => {
        const result = await user.client
          .from('scheduled_tasks')
          .select('completed')
          .eq('id', fixture.taskId)
          .maybeSingle();

        if (result.error) {
          throw new Error(`scheduled task completion lookup failed: ${result.error.message}`);
        }

        return result.data?.completed ? result.data : null;
      },
      { timeoutMs: 20000, intervalMs: 500 },
    );
    checkpoints.push('completed');
  });

  console.log('ACTION_MODAL_SMOKE_PASS', JSON.stringify({
    baseUrl,
    checkpoints,
    taskId: fixture.taskId,
  }));
} catch (error) {
  console.error('ACTION_MODAL_SMOKE_FAIL');
  console.error(error);
  process.exitCode = 1;
}
