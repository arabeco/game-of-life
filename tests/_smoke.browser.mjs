import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDebugger(debugPort, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      if (response.ok) {
        const targets = await response.json();
        const page = targets.find((target) => target.type === 'page');
        if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch {}
    await sleep(250);
  }
  throw new Error(`Debugger endpoint did not come up on port ${debugPort}.`);
}

class SmokeBrowserPage {
  constructor(ws) {
    this.ws = ws;
    this.messageId = 0;
    this.pending = new Map();

    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data.toString());
      if (!message.id) return;
      const entry = this.pending.get(message.id);
      if (!entry) return;
      this.pending.delete(message.id);
      if (message.error) {
        entry.reject(new Error(message.error.message));
      } else {
        entry.resolve(message.result);
      }
    });
  }

  async init() {
    await this.cdp('Page.enable');
    await this.cdp('Runtime.enable');
    await this.cdp('DOM.enable');
  }

  cdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.cdp('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
    }
    return result.result?.value;
  }

  async bodyText() {
    return String(await this.evaluate('document.body ? document.body.innerText : ""'));
  }

  async waitFor(description, expression, timeoutMs = 25000, intervalMs = 250) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      try {
        const ok = await this.evaluate(expression);
        if (ok) return;
      } catch {}
      await sleep(intervalMs);
    }
    throw new Error(`Timeout waiting for ${description}.\n\n${await this.bodyText()}`);
  }

  async waitForSelector(selector, timeoutMs = 25000) {
    await this.waitFor(`selector ${selector}`, `(() => document.querySelector(${JSON.stringify(selector)}) instanceof HTMLElement)()`, timeoutMs);
  }

  async clickSelector(selector) {
    const ok = await this.evaluate(`(() => {
      const target = document.querySelector(${JSON.stringify(selector)});
      if (!(target instanceof HTMLElement)) return false;
      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.click();
      return true;
    })()`);
    if (!ok) throw new Error(`Could not click selector: ${selector}\n\n${await this.bodyText()}`);
  }

  async clickText(text) {
    const ok = await this.evaluate(`(() => {
      const needle = ${JSON.stringify(text)}.toLowerCase();
      const groups = [
        Array.from(document.querySelectorAll('button, [role="button"]')),
        Array.from(document.querySelectorAll('div, span, p, h1, h2, h3, h4')),
      ];
      let target = null;
      for (const group of groups) {
        const match = group.find((node) => {
          const content = (node.innerText || node.textContent || '').toLowerCase();
          return node instanceof HTMLElement && node.offsetParent !== null && content.includes(needle);
        });
        if (match instanceof HTMLElement) {
          target = match.closest('button, [role="button"], div, span, p, h1, h2, h3, h4');
          break;
        }
      }
      if (!(target instanceof HTMLElement)) return false;
      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.click();
      return true;
    })()`);
    if (!ok) throw new Error(`Could not click text: ${text}\n\n${await this.bodyText()}`);
  }

  async setInputValue(selector, value) {
    const ok = await this.evaluate(`(() => {
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
    if (!ok) throw new Error(`Could not set input: ${selector}\n\n${await this.bodyText()}`);
  }

  async reload() {
    await this.cdp('Page.reload', { ignoreCache: true });
  }

  async login(email, password) {
    const loginReady = await this.evaluate(`(() => document.querySelector('#login-email-input') instanceof HTMLInputElement)()`);
    if (!loginReady) {
      await this.waitFor(
        'email login entry button',
        `(() => Array.from(document.querySelectorAll('button')).some((node) => (node.innerText || '').includes('ENTRAR COM E-MAIL')))()`,
        30000,
      );
      await this.evaluate(`(() => {
        const target = Array.from(document.querySelectorAll('button')).find((node) => (node.innerText || '').includes('ENTRAR COM E-MAIL'));
        if (!(target instanceof HTMLElement)) return false;
        target.click();
        return true;
      })()`);
    }
    await this.waitForSelector('#login-email-input', 30000);
    await this.setInputValue('#login-email-input', email);
    await this.setInputValue('#login-password-input', password);
    await this.clickSelector('#login-submit-button');
    await this.waitFor(
      'authenticated shell',
      `(() => document.querySelector('#nav-mundo') instanceof HTMLElement && document.querySelector('#nav-settings') instanceof HTMLElement)()`,
      40000,
    );
  }
}

export async function withBrowser({ baseUrl, debugPort }, callback) {
  const userDataDir = mkdtempSync(path.join(tmpdir(), `glyph-smoke-${debugPort}-`));
  const browser = spawn(
    EDGE_PATH,
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      baseUrl,
    ],
    { stdio: 'ignore' },
  );

  const cleanup = () => {
    try { browser.kill('SIGKILL'); } catch {}
    try { rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  };

  let ws;
  try {
    const wsUrl = await waitForDebugger(debugPort);
    ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });

    const page = new SmokeBrowserPage(ws);
    await page.init();
    return await callback(page);
  } finally {
    try { ws?.close(); } catch {}
    cleanup();
  }
}
