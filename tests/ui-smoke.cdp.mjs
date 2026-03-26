import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createTempUser, DEFAULT_SMOKE_URL } from './_smoke.supabase.mjs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const DEBUG_PORT = 9222;
const userDataDir = mkdtempSync(path.join(tmpdir(), 'glyph-smoke-'));

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const browser = spawn(EDGE_PATH, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  BASE_URL,
], { stdio: 'ignore' });

const cleanup = () => {
  try { browser.kill('SIGKILL'); } catch {}
  try { rmSync(userDataDir, { recursive: true, force: true }); } catch {}
};

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(1); });
process.on('SIGTERM', () => { cleanup(); process.exit(1); });

async function waitForDebugger() {
  const started = Date.now();
  while (Date.now() - started < 15000) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        const page = targets.find(t => t.type === 'page');
        if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch {}
    await sleep(250);
  }
  throw new Error('Debugger endpoint did not come up.');
}

const wsUrl = await waitForDebugger();
const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let messageId = 0;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data.toString());
  if (!message.id) return;
  const entry = pending.get(message.id);
  if (!entry) return;
  pending.delete(message.id);
  if (message.error) {
    entry.reject(new Error(message.error.message));
  } else {
    entry.resolve(message.result);
  }
});

const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++messageId;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('DOM.enable');

async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  }
  return result.result?.value;
}

async function getSession(client) {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) {
    throw new Error(`session fetch failed: ${error?.message || 'missing session'}`);
  }
  return data.session;
}

async function seedSession(session) {
  const serialized = Buffer.from(JSON.stringify(session), 'utf8').toString('base64');
  await cdp('Page.navigate', { url: BASE_URL });
  await waitFor(
    'smoke base url',
    `(() => location.href.startsWith(${JSON.stringify(BASE_URL)}))()`,
    20000,
  );
  const ok = await evaluate(`(() => {
    localStorage.setItem('gol-supabase-auth', atob(${JSON.stringify(serialized)}));
    return true;
  })()`);

  if (!ok) {
    throw new Error('Failed to seed browser session.');
  }

  await cdp('Page.reload', { ignoreCache: true });
}

async function bodyText() {
  return String(await evaluate('document.body ? document.body.innerText : ""'));
}

async function waitFor(description, expression, timeoutMs = 20000, intervalMs = 250) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const ok = await evaluate(expression);
      if (ok) return;
    } catch {}
    await sleep(intervalMs);
  }
  throw new Error(`Timeout waiting for ${description}.\n\n${await bodyText()}`);
}

async function clickByText(text) {
  const ok = await evaluate(`(() => {
    const needle = ${JSON.stringify(text)}.toLowerCase();
    const selectors = ['button', '[role="button"]', 'div', 'span'];
    const candidates = Array.from(document.querySelectorAll(selectors.join(',')));
    const match = candidates.find(node => {
      const content = (node.innerText || node.textContent || '').toLowerCase();
      return node instanceof HTMLElement && node.offsetParent !== null && content.includes(needle);
    });
    const target = match && match.closest('button, [role="button"], div, span');
    if (!(target instanceof HTMLElement)) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  })()`);
  if (!ok) {
    throw new Error(`Could not click text: ${text}\n\n${await bodyText()}`);
  }
}

async function clickSelector(selector) {
  const ok = await evaluate(`(() => {
    const target = document.querySelector(${JSON.stringify(selector)});
    if (!(target instanceof HTMLElement)) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  })()`);
  if (!ok) {
    throw new Error(`Could not click selector: ${selector}\n\n${await bodyText()}`);
  }
}

async function setField(placeholder, value) {
  const ok = await evaluate(`(() => {
    const needle = ${JSON.stringify(placeholder)}.toLowerCase();
    const target = Array.from(document.querySelectorAll('input, textarea')).find(node => {
      const ph = (node.getAttribute('placeholder') || '').toLowerCase();
      return ph.includes(needle);
    });
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return false;
    const proto = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (!setter) return false;
    target.focus();
    setter.call(target, ${JSON.stringify(value)});
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!ok) {
    throw new Error(`Could not set field: ${placeholder}\n\n${await bodyText()}`);
  }
}

async function setFieldBySelector(selector, value) {
  const ok = await evaluate(`(() => {
    const target = document.querySelector(${JSON.stringify(selector)});
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return false;
    const proto = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (!setter) return false;
    target.focus();
    setter.call(target, ${JSON.stringify(value)});
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!ok) {
    throw new Error(`Could not set field selector: ${selector}\n\n${await bodyText()}`);
  }
}

async function clickTermsPrimary() {
  const ok = await evaluate(`(() => {
    const candidates = Array.from(document.querySelectorAll('div')).filter(node => {
      const style = node.getAttribute('style') || '';
      const text = node.innerText || '';
      return style.includes('touch-action') && (text.includes('ACEITAR') || text.includes('PR') || text.includes('AVAN'));
    });
    const target = candidates.find(node => node instanceof HTMLElement && node.offsetParent !== null);
    if (!(target instanceof HTMLElement)) return false;
    target.click();
    return true;
  })()`);
  if (!ok) {
    throw new Error(`Could not click terms primary control.\n\n${await bodyText()}`);
  }
}

async function holdTermsPrimary(ms = 1000) {
  const down = await evaluate(`(() => {
    const candidates = Array.from(document.querySelectorAll('div')).filter(node => {
      const style = node.getAttribute('style') || '';
      const text = node.innerText || '';
      return style.includes('touch-action') && text.includes('ACEITAR');
    });
    const target = candidates.find(node => node instanceof HTMLElement && node.offsetParent !== null);
    if (!(target instanceof HTMLElement)) return false;
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    return true;
  })()`);
  if (!down) {
    throw new Error(`Could not start terms hold.\n\n${await bodyText()}`);
  }
  await sleep(ms);
  await evaluate(`(() => {
    const candidates = Array.from(document.querySelectorAll('div')).filter(node => {
      const style = node.getAttribute('style') || '';
      const text = node.innerText || '';
      return style.includes('touch-action') && text.includes('ACEITAR');
    });
    const target = candidates.find(node => node instanceof HTMLElement && node.offsetParent !== null);
    if (!(target instanceof HTMLElement)) return false;
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  })()`);
}

async function pressEscape() {
  await evaluate(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return true;
  })()`);
}

const arenaName = `Smoke Arena ${Date.now()}`;
const actionName = `Smoke Action ${Date.now()}`;
const checkpoints = [];
let user = null;

try {
  user = await createTempUser({
    label: 'ui-shell',
    isPremium: false,
    appMode: 'BASIC',
    gold: 0,
    fragments: 0,
  });
  const session = await getSession(user.client);
  await seedSession(session);
  checkpoints.push('session-seeded');

  await waitFor(
    'authenticated shell',
    `(() => document.querySelector('#nav-arenas') instanceof HTMLElement && document.querySelector('#nav-settings') instanceof HTMLElement)()`,
    40000,
  );
  checkpoints.push('shell-authenticated');

  await sleep(1500);
  try { await pressEscape(); } catch {}
  try { await clickByText('Pular'); } catch {}
  await sleep(1000);

  await clickSelector('#nav-arenas');
  await waitFor('arenas nav', `(() => document.querySelector('#new-action-button') instanceof HTMLElement)()`, 15000);
  checkpoints.push('arenas-open');

  await clickSelector('#new-action-button');
  await waitFor('new arena modal', `(() => Array.from(document.querySelectorAll('input')).some(node => (node.getAttribute('placeholder') || '').includes('Nome da Arena')))()`, 10000);
  await setField('Nome da Arena', arenaName);
  await setFieldBySelector('#new-arena-description-input', 'Smoke test arena');
  await clickSelector('#new-arena-submit-button');
  await waitFor('arena detail modal', `(() => document.querySelector('#add-action-button') instanceof HTMLElement)()`, 15000);
  checkpoints.push('arena-created');

  await clickSelector('#add-action-button');
  await waitFor('action modal', `(() => document.querySelector('#onboarding-action-name-input') instanceof HTMLInputElement)()`, 10000);
  await setFieldBySelector('#onboarding-action-name-input', actionName);
  await clickSelector('#onboarding-action-save-button');
  await waitFor('action visible', `(() => document.body && document.body.innerText.includes(${JSON.stringify(actionName)}))()`, 15000);
  checkpoints.push('action-created');

  await clickSelector('#nav-planner');
  await waitFor('planner view', `(() => document.querySelector('#sitrep-button') instanceof HTMLElement)()`, 15000);
  checkpoints.push('planner-open');

  await clickSelector('#sitrep-button');
  await waitFor('sitrep modal', `(() => document.body && (document.body.innerText.includes('Planejamento') || document.body.innerText.includes('PAINEL DI')))()`, 10000);
  checkpoints.push('sitrep-open');

  console.log(JSON.stringify({ success: true, email: user?.email || null, arenaName, actionName, checkpoints }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    checkpoints,
    error: error instanceof Error ? error.message : String(error),
    bodyText: await bodyText(),
  }, null, 2));
  process.exitCode = 1;
} finally {
  try { ws.close(); } catch {}
  cleanup();
}
