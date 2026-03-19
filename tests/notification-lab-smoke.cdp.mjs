import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { createTempUser, DEFAULT_SMOKE_URL, SUPABASE_URL, waitForDb } from './_smoke.supabase.mjs';
import { sleep, withBrowser } from './_smoke.browser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, '.env.local');
const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;

function readLocalEnv() {
  const raw = fs.readFileSync(envPath, 'utf8');
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.trim().startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, '')];
      }),
  );
}

const env = readLocalEnv();
const service = createClient(SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

function bodyIncludesExpression(text) {
  return `(() => {
    const body = document.body ? document.body.innerText : '';
    return body.includes(${JSON.stringify(text)});
  })()`;
}

async function waitForBodyText(page, description, text, timeoutMs = 20000) {
  await page.waitFor(description, bodyIncludesExpression(text), timeoutMs);
}

async function promoteToGm(userId) {
  const { error } = await service
    .from('user_profiles')
    .update({ role: 'gm', is_premium: true })
    .eq('id', userId);

  if (error) {
    throw new Error(`gm promote failed: ${error.message}`);
  }
}

async function waitForGmProfile(userId) {
  return waitForDb(
    'gm profile role',
    async () => {
      const result = await service
        .from('user_profiles')
        .select('id,role,is_premium')
        .eq('id', userId)
        .maybeSingle();

      if (result.error) {
        throw new Error(`gm role lookup failed: ${result.error.message}`);
      }

      const role = String(result.data?.role || '').toLowerCase();
      return role === 'gm' && result.data?.is_premium === true ? result.data : null;
    },
    { timeoutMs: 15000, intervalMs: 500 },
  );
}

async function fetchLatestNotification(client, { userId, type, contentFragment }) {
  const result = await client
    .from('notifications')
    .select('id,type,content,created_at,read')
    .eq('user_id', userId)
    .eq('type', type)
    .ilike('content', `%${contentFragment}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new Error(`notification lookup failed: ${result.error.message}`);
  }

  return result.data || null;
}

async function closeOracleOverlay(page) {
  const ok = await page.evaluate(`(() => {
    const nodes = Array.from(document.querySelectorAll('div'));
    const backdrop = nodes.find((node) => {
      if (!(node instanceof HTMLElement)) return false;
      const cls = String(node.className || '');
      return cls.includes('absolute inset-0') && cls.includes('bg-black/40') && cls.includes('pointer-events-auto');
    });
    if (!(backdrop instanceof HTMLElement)) return false;
    backdrop.click();
    return true;
  })()`);

  if (!ok) {
    throw new Error('Could not close Oracle overlay.');
  }

  await sleep(250);
}

async function getSession(client) {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) {
    throw new Error(`session fetch failed: ${error?.message || 'missing session'}`);
  }
  return data.session;
}

async function seedSession(page, session) {
  const serialized = Buffer.from(JSON.stringify(session), 'utf8').toString('base64');
  await page.cdp('Page.navigate', { url: baseUrl });
  await page.waitFor(
    'smoke base url',
    `(() => location.href.startsWith(${JSON.stringify(baseUrl)}))()`,
    20000,
  );
  const ok = await page.evaluate(`(() => {
    localStorage.setItem('gol-supabase-auth', atob(${JSON.stringify(serialized)}));
    return true;
  })()`);

  if (!ok) {
    throw new Error('Failed to seed browser session.');
  }

  await page.reload();
  await page.waitFor(
    'authenticated shell',
    `(() => document.querySelector('#nav-mundo') instanceof HTMLElement && document.querySelector('#nav-settings') instanceof HTMLElement)()`,
    40000,
  );
}

async function seedGmProfileCache(page, userId) {
  const ok = await page.evaluate(`(() => {
    const key = ${JSON.stringify(`gol_user_profile_v2_${'__USER__'}`)}.replace('__USER__', ${JSON.stringify(userId)});
    const currentRaw = localStorage.getItem(key);
    let current = {};
    try {
      current = currentRaw ? JSON.parse(currentRaw) : {};
    } catch {}
    localStorage.setItem(key, JSON.stringify({
      ...current,
      id: ${JSON.stringify(userId)},
      role: 'gm',
      isPremium: true,
    }));
    return true;
  })()`);

  if (!ok) {
    throw new Error('Could not seed GM profile cache.');
  }
}

async function runScenario() {
  const checkpoints = [];
  const user = await createTempUser({ label: 'notif-lab', isPremium: true, appMode: 'GAME' });
  await promoteToGm(user.userId);
  await waitForGmProfile(user.userId);
  const session = await getSession(user.client);

  await withBrowser({ baseUrl, debugPort: 9341 }, async (page) => {
    await seedSession(page, session);
    await seedGmProfileCache(page, user.userId);
    await page.reload();
    await page.waitFor(
      'authenticated shell after gm cache seed',
      `(() => document.querySelector('#nav-mundo') instanceof HTMLElement && document.querySelector('#nav-settings') instanceof HTMLElement)()`,
      40000,
    );
    checkpoints.push('login-ok');

    await page.clickSelector('#nav-settings');
    await waitForBodyText(page, 'gm panel', 'Fabrica de Eventos', 30000);
    checkpoints.push('gm-panel-open');

    await page.clickText('Sistema Agora');
    await waitForBodyText(page, 'system notification modal', 'TESTE GM: Aviso de sistema entregue em Avisos.', 15000);
    const systemNotification = await waitForDb(
      'system notification insert',
      () => fetchLatestNotification(user.client, {
        userId: user.userId,
        type: 'system',
        contentFragment: 'TESTE GM: Aviso de sistema entregue em Avisos.',
      }),
      { timeoutMs: 15000, intervalMs: 500 },
    );
    checkpoints.push(`system-ok:${systemNotification.id}`);
    await closeOracleOverlay(page);

    await page.clickText('Card do Oraculo');
    await waitForBodyText(page, 'oracle card modal', 'TESTE GM: Card do Oraculo entregue em Avisos.', 15000);
    const oracleCard = await waitForDb(
      'oracle card insert',
      () => fetchLatestNotification(user.client, {
        userId: user.userId,
        type: 'oracle_prompt',
        contentFragment: 'TESTE GM: Card do Oraculo entregue em Avisos.',
      }),
      { timeoutMs: 15000, intervalMs: 500 },
    );
    checkpoints.push(`oracle-card-ok:${oracleCard.id}`);
    await closeOracleOverlay(page);

    await page.clickText('Sistema + Push (15s)');
    await waitForBodyText(page, 'push countdown', 'Agendado (', 5000);
    const delayedSystemNotification = await waitForDb(
      'delayed system notification insert',
      () => fetchLatestNotification(user.client, {
        userId: user.userId,
        type: 'system',
        contentFragment: 'TESTE GM: Notificacao de sistema agendada para 15 segundos.',
      }),
      { timeoutMs: 25000, intervalMs: 1000 },
    );
    checkpoints.push(`system-push-ok:${delayedSystemNotification.id}`);

    await waitForBodyText(page, 'delayed system modal', 'TESTE GM: Notificacao de sistema agendada para 15 segundos.', 25000);
    checkpoints.push('ui-opened-delayed-notification');
  });

  return {
    ok: true,
    userId: user.userId,
    checkpoints,
  };
}

try {
  const result = await runScenario();
  console.log(`SMOKE_NOTIFICATION_LAB_OK user=${result.userId}`);
  result.checkpoints.forEach((checkpoint) => console.log(`CHECKPOINT ${checkpoint}`));
  process.exit(0);
} catch (error) {
  console.error('SMOKE_NOTIFICATION_LAB_FAILED');
  console.error(error);
  process.exit(1);
}
