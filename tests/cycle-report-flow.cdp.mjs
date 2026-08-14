import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createTempUser, DEFAULT_SMOKE_URL } from './_smoke.supabase.mjs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const DEBUG_PORT = 9224;
const userDataDir = mkdtempSync(path.join(tmpdir(), 'glyph-cycle-smoke-'));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        const page = targets.find((target) => target.type === 'page');
        if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch {}
    await sleep(350);
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
    const groups = [
      Array.from(document.querySelectorAll('button, [role=\"button\"]')),
      Array.from(document.querySelectorAll('div, span')),
    ];
    let target = null;
    for (const group of groups) {
      const match = group.find((node) => {
        const content = (node.innerText || node.textContent || '').toLowerCase();
        return node instanceof HTMLElement && node.offsetParent !== null && content.includes(needle);
      });
      if (match instanceof HTMLElement) {
        target = match.closest('button, [role=\"button\"], div, span');
        break;
      }
    }
    if (!(target instanceof HTMLElement)) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  })()`);
  if (!ok) throw new Error(`Could not click text: ${text}\n\n${await bodyText()}`);
}

async function clickSelector(selector) {
  const ok = await evaluate(`(() => {
    const target = document.querySelector(${JSON.stringify(selector)});
    if (!(target instanceof HTMLElement)) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  })()`);
  if (!ok) throw new Error(`Could not click selector: ${selector}\n\n${await bodyText()}`);
}

async function setField(placeholder, value) {
  const ok = await evaluate(`(() => {
    const needle = ${JSON.stringify(placeholder)}.toLowerCase();
    const fields = Array.from(document.querySelectorAll('input, textarea'));
    const target = fields.find((node) => ((node.getAttribute('placeholder') || '').toLowerCase() === needle))
      || fields.find((node) => ((node.getAttribute('placeholder') || '').toLowerCase().includes(needle)));
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
  if (!ok) throw new Error(`Could not set field: ${placeholder}\n\n${await bodyText()}`);
}

async function setDateField(value) {
  const ok = await evaluate(`(() => {
    const target = document.querySelector('input[type="date"]');
    if (!(target instanceof HTMLInputElement)) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!setter) return false;
    target.focus();
    setter.call(target, ${JSON.stringify(value)});
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error(`Could not set date field\n\n${await bodyText()}`);
}

async function clickTermsPrimary() {
  const ok = await evaluate(`(() => {
    const candidates = Array.from(document.querySelectorAll('div')).filter((node) => {
      const style = node.getAttribute('style') || '';
      return node instanceof HTMLElement && node.offsetParent !== null && style.includes('touch-action');
    });
    const target = candidates[candidates.length - 1];
    if (!(target instanceof HTMLElement)) return false;
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error(`Could not click terms primary control.\n\n${await bodyText()}`);
}

async function holdTermsPrimary(ms = 1000) {
  const down = await evaluate(`(() => {
    const candidates = Array.from(document.querySelectorAll('div')).filter((node) => {
      const style = node.getAttribute('style') || '';
      return node instanceof HTMLElement && node.offsetParent !== null && style.includes('touch-action');
    });
    const target = candidates[candidates.length - 1];
    if (!(target instanceof HTMLElement)) return false;
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    return true;
  })()`);
  if (!down) throw new Error(`Could not start terms hold.\n\n${await bodyText()}`);
  await sleep(ms);
  await evaluate(`(() => {
    const candidates = Array.from(document.querySelectorAll('div')).filter((node) => {
      const style = node.getAttribute('style') || '';
      return node instanceof HTMLElement && node.offsetParent !== null && style.includes('touch-action');
    });
    const target = candidates[candidates.length - 1];
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

async function advanceToRewardSlide(maxSteps = 8) {
  for (let index = 0; index < maxSteps; index += 1) {
    const alreadyAtReward = await evaluate(`(() => document.querySelector('#report-new-cycle-button') instanceof HTMLElement)()`);
    if (alreadyAtReward) return;

    const ok = await evaluate(`(() => {
      const content = document.querySelector('#report-summary-card-capture');
      const footer = content?.nextElementSibling;
      if (!(footer instanceof HTMLElement)) return false;
      const buttons = Array.from(footer.querySelectorAll('button')).filter((node) => {
        return node instanceof HTMLButtonElement && !node.disabled && node.offsetParent !== null;
      });
      const target = buttons[buttons.length - 1];
      if (!(target instanceof HTMLButtonElement)) return false;
      target.click();
      return true;
    })()`);
    if (!ok) throw new Error(`Could not advance report slide ${index + 1}

${await bodyText()}`);
    await sleep(350);
  }

  throw new Error(`Reward slide was not reached within ${maxSteps} steps.

${await bodyText()}`);
}

async function clickButtonByTextViaMouse(text) {
  const rect = await evaluate(`(() => {
    const needle = ${JSON.stringify(text)}.toLowerCase();
    const target = Array.from(document.querySelectorAll('button')).find((node) => {
      const content = (node.innerText || node.textContent || '').toLowerCase();
      return node instanceof HTMLButtonElement && !node.disabled && node.offsetParent !== null && content.includes(needle);
    });
    if (!(target instanceof HTMLButtonElement)) return null;
    const box = target.getBoundingClientRect();
    return {
      x: box.left + (box.width / 2),
      y: box.top + (box.height / 2),
    };
  })()`);
  if (!rect || typeof rect.x !== 'number' || typeof rect.y !== 'number') {
    throw new Error(`Could not locate button for mouse click: ${text}\n\n${await bodyText()}`);
  }
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x, y: rect.y, button: 'left', buttons: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', buttons: 1, clickCount: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', buttons: 0, clickCount: 1 });
}
async function clickReportPrimaryAction() {
  const ok = await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('button')).filter((node) => {
      const text = (node.innerText || node.textContent || '').toLowerCase();
      return node instanceof HTMLButtonElement && !node.disabled && node.offsetParent !== null && text.includes('novo ciclo');
    });
    const target = buttons[0];
    if (!(target instanceof HTMLButtonElement)) return false;
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error(`Could not click report primary action\n\n${await bodyText()}`);
}

const cycleName = `Smoke Cycle ${Date.now()}`;
const today = new Date().toISOString().slice(0, 10);
const checkpoints = [];
let user = null;

try {
  user = await createTempUser({
    label: 'cycle-report',
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
    `(() => document.querySelector('#nav-planner') instanceof HTMLElement && document.querySelector('#nav-settings') instanceof HTMLElement)()`,
    40000,
  );
  checkpoints.push('shell-authenticated');

  await sleep(1500);
  try { await pressEscape(); } catch {}
  try { await clickByText('Pular'); } catch {}
  for (const label of ['ENTENDI', 'FECHAR', 'OK']) {
    try {
      await clickByText(label);
      await sleep(350);
    } catch {}
  }
  await evaluate(`(() => {
    window.dispatchEvent(new CustomEvent('tutorialRestScreen', { detail: { open: false } }));
    return true;
  })()`);
  await sleep(1000);

  await clickSelector('#nav-planner');
  await waitFor('planner view', `(() => document.querySelector('#report-button') instanceof HTMLElement)()`, 15000);
  checkpoints.push('planner-open');

  await clickSelector('#report-button');
  await waitFor('reports view', `(() => document.body && (document.querySelector('#start-new-cycle-button') instanceof HTMLElement || document.querySelector('#end-cycle-button') instanceof HTMLElement))()`, 15000);
  checkpoints.push('reports-open');

  const hasActiveCycle = await evaluate(`(() => document.querySelector('#end-cycle-button') instanceof HTMLElement)()`);
  if (!hasActiveCycle) {
    await clickSelector('#start-new-cycle-button');
    await waitFor(
      'start cycle setup',
      `(() => document.querySelector('#new-cycle-name-input') instanceof HTMLInputElement && document.querySelector('#new-cycle-submit-button') instanceof HTMLElement)()`,
      15000,
    );
    await setField('Nome do Novo Ciclo', cycleName);
    await clickSelector('#new-cycle-submit-button');
    await waitFor(
      'start cycle confirmation',
      `(() => Array.from(document.querySelectorAll('button')).some((node) => (node.innerText || '').includes('CONFIRMAR')))()`,
      10000,
    );
    await clickByText('CONFIRMAR');
    await waitFor(
      'active cycle planner state',
      `(() => document.querySelector('#report-button') instanceof HTMLElement)()`,
      15000,
    );
    checkpoints.push('cycle-started');

    await waitFor('report button after cycle start', `(() => document.querySelector('#report-button') instanceof HTMLElement)()`, 15000);
    await clickSelector('#report-button');
    await waitFor('reports view with active cycle', `(() => document.querySelector('#end-cycle-button') instanceof HTMLElement)()`, 15000);
    checkpoints.push('reports-reopened');
  } else {
    checkpoints.push('cycle-already-active');
  }

  await clickSelector('#end-cycle-button');
  await waitFor('end cycle confirmation', `(() => Array.from(document.querySelectorAll('button')).some((node) => (node.innerText || '').includes('CONFIRMAR')))()`, 10000);
  await clickByText('CONFIRMAR');
  checkpoints.push('cycle-end-confirmed');

  await waitFor('report results', `(() => document.querySelector('#report-summary-card-capture') instanceof HTMLElement)()`, 20000);
  checkpoints.push('report-results-open');

  await advanceToRewardSlide();
  await waitFor('new cycle action', `(() => document.body && document.body.innerText.toLowerCase().includes('novo ciclo'))()`, 10000);
  checkpoints.push('report-reward-slide');

  await clickSelector('#report-new-cycle-button');
  await waitFor('new cycle setup view', `(() => { const text = (document.body?.innerText || '').toLowerCase(); return text.includes('novo ciclo') && text.includes('iniciar novo ciclo'); })()` , 15000);
  checkpoints.push('new-cycle-setup-open');

  console.log(JSON.stringify({ success: true, email: user?.email || null, cycleName, checkpoints }, null, 2));
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












