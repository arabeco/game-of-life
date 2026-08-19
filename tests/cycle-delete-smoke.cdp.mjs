import { randomUUID } from 'node:crypto';
import {
  DEFAULT_SMOKE_URL,
  createTempUser,
  waitForDb,
} from './_smoke.supabase.mjs';
import { withBrowser, sleep } from './_smoke.browser.mjs';

const BASE_URL = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const DEBUG_PORT = 9232;

async function getSession(client) {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) {
    throw new Error(`session fetch failed: ${error?.message || 'missing session'}`);
  }
  return data.session;
}

async function seedSession(page, session) {
  const serialized = Buffer.from(JSON.stringify(session), 'utf8').toString('base64');
  await page.cdp('Page.navigate', { url: BASE_URL });
  await page.waitFor(
    'smoke base url',
    `(() => location.href.startsWith(${JSON.stringify(BASE_URL)}))()`,
    20000,
  );
  await page.evaluate(`(() => {
    localStorage.setItem('gol-supabase-auth', atob(${JSON.stringify(serialized)}));
    return true;
  })()`);
  await page.reload();
}

function buildHistoricalReportPayload({ cycleId, cycleName, startDate, endDate }) {
  return {
    id: cycleId,
    cycle_id: cycleId,
    start_date: startDate,
    end_date: endDate,
    performance_score: 78,
    cycle_name: cycleName,
    metrics: {
      actions_completed: 1,
      total_planned_actions: 1,
      arenas_involved: 1,
      goals_met: 1,
      planned_metas: 1,
      sealed_metas: 1,
      total_hours: 1,
      quests_completed: 0,
      consistency_days: 1,
      exp_gained: 10,
      max_streak: 1,
      best_day: endDate,
      best_day_count: 1,
      days_without_completion: 0,
      execution_rate_pct: 100,
      time_elapsed_pct: 100,
      pace_delta_pct: 0,
      top3_actions: [{ name: 'Deep Work Smoke', count: 1 }],
      weekly_atlas: [],
      score_model_version: 'smoke',
      fairness: {
        sealedMetas: 1,
        plannedMetas: 1,
      },
      score_breakdown: {
        progressPts: 30,
        milestonePts: 10,
        questPts: 0,
        consistencyPts: 10,
        volumePts: 5,
        expBoostBonusPts: 0,
        premiumBonusPts: 0,
      },
    },
    highlight: {
      most_focused_arena: 'Arena Smoke',
      most_focused_arena_id: 'arena-smoke',
      most_repeated_action: 'Deep Work Smoke',
      most_repeated_action_count: 1,
    },
    asset_progress: [],
  };
}

async function clickDeleteButtonForCycle(page, cycleName) {
  const ok = await page.evaluate(`(() => {
    const needle = ${JSON.stringify(cycleName)}.toLowerCase();
    const buttons = Array.from(document.querySelectorAll('button[title="Excluir ciclo"]'));
    const target = buttons.find((button) => {
      const container = button.closest('div');
      const text = (container?.innerText || button.parentElement?.innerText || '').toLowerCase();
      return text.includes(needle);
    }) || buttons[0];
    if (!(target instanceof HTMLElement)) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  })()`);
  if (!ok) {
    throw new Error(`Could not click delete button for cycle ${cycleName}\n\n${await page.bodyText()}`);
  }
}

async function dismissKnownOverlays(page, attempts = 6) {
  for (let index = 0; index < attempts; index += 1) {
    const dismissed = await page.evaluate(`(() => {
      const labels = ['FECHAR', 'OK', 'VER NOVA TEMPORADA', 'CONTINUAR'];
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
        .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);

      for (const label of labels) {
        const target = [...buttons].reverse().find((node) => {
          const text = (node.innerText || node.textContent || '').toUpperCase().trim();
          return text.includes(label);
        });
        if (target instanceof HTMLElement) {
          target.scrollIntoView({ block: 'center', inline: 'center' });
          target.click();
          return true;
        }
      }

      return false;
    })()`);

    if (!dismissed) return;
    await sleep(700);
  }
}

async function openReportsOverlay(page) {
  await page.evaluate(`(() => {
    const event = new KeyboardEvent('keydown', {
      key: 'R',
      altKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
    document.dispatchEvent(event);
    return true;
  })()`);
}

const checkpoints = [];
let fixture = null;

try {
  fixture = await createTempUser({
    label: 'cycle-delete',
    isPremium: true,
    gold: 0,
    fragments: 0,
  });

  const userId = fixture.userId;
  const client = fixture.client;
  const cycleId = randomUUID();
  const arenaId = randomUUID();
  const actionId = randomUUID();
  const taskId = randomUUID();
  const sitrepId = randomUUID();
  const cycleName = `Smoke Delete Cycle ${Date.now()}`;
  const startDate = '2026-04-01';
  const endDate = '2026-04-07';

  const arenaInsert = await client.from('arenas').insert({
    id: arenaId,
    user_id: userId,
    asset_id: 'mente',
    name: 'Arena Smoke',
    description: 'Arena para smoke de exclusao de ciclo',
    icon: 'A',
    is_archived: false,
  });
  if (arenaInsert.error) throw new Error(`arena insert failed: ${arenaInsert.error.message}`);

  const actionInsert = await client.from('actions').insert({
    id: actionId,
    user_id: userId,
    arena_id: arenaId,
    name: 'Deep Work Smoke',
    description: 'Acao do smoke',
    icon: 'D',
    duration: 60,
    repetitions: 1,
    action_type: 'Compromisso',
    context: {},
  });
  if (actionInsert.error) throw new Error(`action insert failed: ${actionInsert.error.message}`);

  const taskInsert = await client.from('scheduled_tasks').insert({
    id: taskId,
    user_id: userId,
    action_id: actionId,
    date: '2026-04-03',
    start_time: 540,
    duration: 60,
    completed: true,
  });
  if (taskInsert.error) throw new Error(`task insert failed: ${taskInsert.error.message}`);

  const cycleInsert = await client.from('cycles').insert({
    id: cycleId,
    user_id: userId,
    name: cycleName,
    start_date: startDate,
    end_date: endDate,
    arena_ids: [arenaId],
    report_data: buildHistoricalReportPayload({ cycleId, cycleName, startDate, endDate }),
    performance_score: 78,
  });
  if (cycleInsert.error) throw new Error(`cycle insert failed: ${cycleInsert.error.message}`);

  const sitrepInsert = await client.from('sitrep_reports').insert({
    id: sitrepId,
    user_id: userId,
    date: '2026-04-03',
    score: 100,
    completed_tasks_count: 1,
    total_tasks_count: 1,
    task_ids: [taskId],
    bonus_xp: 0,
    cycle_id: cycleId,
  });
  if (sitrepInsert.error) throw new Error(`sitrep insert failed: ${sitrepInsert.error.message}`);
  checkpoints.push('fixture-seeded');

  await withBrowser({ baseUrl: BASE_URL, debugPort: DEBUG_PORT }, async (page) => {
    const session = await getSession(client);
    await seedSession(page, session);
    checkpoints.push('session-seeded');

    await page.waitFor(
      'authenticated shell',
      `(() => document.querySelector('#nav-planner') instanceof HTMLElement && document.querySelector('#nav-settings') instanceof HTMLElement)()`,
      40000,
    );
    await dismissKnownOverlays(page);
    await page.dismissBlockingRuntimeOverlays();
    checkpoints.push('shell-authenticated');

    await openReportsOverlay(page);
    await dismissKnownOverlays(page);
    await page.waitFor(
      'reports overlay visible',
      `(() => {
        const text = (document.body?.innerText || '').toUpperCase();
        return text.includes('INICIAR NOVO CICLO') || text.includes('ENCERRAR CICLO ATUAL') || text.includes('RESULTADOS');
      })()`,
      20000,
    );
    checkpoints.push('reports-open');

    await page.waitFor(
      'historical cycle visible',
      `(() => (document.body?.innerText || '').includes(${JSON.stringify(cycleName)}))()`,
      20000,
    );
    checkpoints.push('cycle-visible');

    await clickDeleteButtonForCycle(page, cycleName);
    await page.waitFor(
      'delete confirmation',
      `(() => Array.from(document.querySelectorAll('button')).some((node) => (node.innerText || '').includes('EXCLUIR CICLO')))()`,
      10000,
    );
    checkpoints.push('confirm-open');

    await page.clickText('EXCLUIR CICLO');
    await page.waitFor(
      'cycle removed from reports',
      `(() => !(document.body?.innerText || '').includes(${JSON.stringify(cycleName)}))()`,
      20000,
    );
    checkpoints.push('cycle-removed-ui');
  });

  await waitForDb(
    'cycle deletion cascade',
    async () => {
      const [cycleResult, taskResult, sitrepResult] = await Promise.all([
        client.from('cycles').select('id').eq('id', cycleId).maybeSingle(),
        client.from('scheduled_tasks').select('id').eq('id', taskId).maybeSingle(),
        client.from('sitrep_reports').select('id').eq('id', sitrepId).maybeSingle(),
      ]);

      if (cycleResult.error) throw new Error(`cycle lookup failed: ${cycleResult.error.message}`);
      if (taskResult.error) throw new Error(`task lookup failed: ${taskResult.error.message}`);
      if (sitrepResult.error) throw new Error(`sitrep lookup failed: ${sitrepResult.error.message}`);

      return !cycleResult.data && !taskResult.data && !sitrepResult.data;
    },
    { timeoutMs: 15000, intervalMs: 500 },
  );
  checkpoints.push('db-clean');

  console.log(JSON.stringify({
    success: true,
    cycleName,
    checkpoints,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    checkpoints,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
} finally {
  if (fixture?.client && fixture?.userId) {
    try {
      await fixture.client.from('sitrep_reports').delete().eq('user_id', fixture.userId);
      await fixture.client.from('scheduled_tasks').delete().eq('user_id', fixture.userId);
      await fixture.client.from('actions').delete().eq('user_id', fixture.userId);
      await fixture.client.from('arenas').delete().eq('user_id', fixture.userId);
      await fixture.client.from('cycles').delete().eq('user_id', fixture.userId);
    } catch {}
  }
  await sleep(100);
}
