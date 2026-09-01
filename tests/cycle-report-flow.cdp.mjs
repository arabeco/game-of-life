import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
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
  // O Edge passou a abrir a tela "estamos sincronizando seus dados de navegacao"
  // dentro do perfil temporario, herdando a conta Microsoft da maquina. Ela cobre
  // a pagina e o teste falha esperando um botao do app que existe e esta atras do
  // aviso — falha de ambiente lida como falha de produto.
  '--disable-sync',
  '--disable-features=msImplicitSignin,msEdgeIdentityWebSignIn',
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
// The app swallows failures into a generic toast, so without the console the report
// step just reads as "timeout" with no cause. Keep the last errors around.
const consoleErrors = [];
const describeArg = (arg) => {
  if (!arg) return '';
  if (typeof arg.value !== 'undefined') return String(arg.value);
  return arg.description || arg.className || arg.type || '';
};
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data.toString());
  if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params?.type)) {
    consoleErrors.push(`[${message.params.type}] ${(message.params.args || []).map(describeArg).join(' ')}`.trim());
    if (consoleErrors.length > 40) consoleErrors.shift();
  }
  if (message.method === 'Runtime.exceptionThrown') {
    const detail = message.params?.exceptionDetails;
    consoleErrors.push(`[exception] ${detail?.exception?.description || detail?.text || 'unknown'}`);
    if (consoleErrors.length > 40) consoleErrors.shift();
  }
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

async function semearUmDiaPagoNoCiclo() {
  // Sem isto o teste fechava um ciclo VAZIO.
  //
  // Ele criava a conta, abria o ciclo e fechava sem nunca ter concluido nada —
  // apesar de o rotulo da suite dizer "conclui tarefas". Um ciclo que nao pagou
  // nada fecha certo em qualquer versao, inclusive na que pagava em dobro, porque
  // o dobro de zero e zero. A tela passava, a conta nunca era feita.
  //
  // O defeito somava `cycleBaseExp` — a base RECALCULADA a partir das tarefas
  // concluidas do ciclo — por cima do que ja vinha somado dos dias julgados. Para
  // que a diferenca exista e preciso das duas coisas ao mesmo tempo: uma tarefa
  // concluida dentro da janela e um dia julgado com EXP. Uma so nao denuncia nada.
  const { data: cycle, error: cycleError } = await user.client
    .from('cycles')
    .select('id, start_date, end_date, arena_ids')
    .eq('user_id', user.userId)
    .is('report_data', null)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cycleError) throw new Error(`Could not read the open cycle: ${cycleError.message}`);
  if (!cycle) throw new Error('No open cycle to seed.');

  const arenaId = randomUUID();
  const actionId = randomUUID();

  const arena = await user.client.from('arenas').insert({
    id: arenaId,
    user_id: user.userId,
    asset_id: 'proposito',
    name: `Arena do teste ${Date.now()}`,
    is_archived: false,
  });
  if (arena.error) throw new Error(`arena seed failed: ${arena.error.message}`);

  const action = await user.client.from('actions').insert({
    id: actionId,
    user_id: user.userId,
    arena_id: arenaId,
    name: 'Acao do teste',
  });
  if (action.error) throw new Error(`action seed failed: ${action.error.message}`);

  // Ciclo com escopo de arenas so pontua tarefas das SUAS arenas. Um ciclo sem
  // escopo conta a janela inteira. Cobrir os dois casos e uma linha.
  if (Array.isArray(cycle.arena_ids) && cycle.arena_ids.length > 0) {
    const escopo = await user.client
      .from('cycles')
      .update({ arena_ids: [...cycle.arena_ids, arenaId] })
      .eq('id', cycle.id);
    if (escopo.error) throw new Error(`cycle scope update failed: ${escopo.error.message}`);
  }

  const task = await user.client.from('scheduled_tasks').insert({
    id: randomUUID(),
    user_id: user.userId,
    action_id: actionId,
    date: cycle.start_date,
    start_time: 540,
    duration: 60,
    completed: true,
  });
  if (task.error) throw new Error(`task seed failed: ${task.error.message}`);

  // Numero proposital e feio: se aparecer numa mensagem de falha, ele se identifica.
  const EXP_DO_DIA = 37;
  const commitment = await user.client
    .from('daily_commitments')
    .upsert(
      { user_id: user.userId, date: cycle.start_date, stage: 'judgment', exp_deposited: EXP_DO_DIA },
      { onConflict: 'user_id,date' },
    );
  if (commitment.error) throw new Error(`daily commitment seed failed: ${commitment.error.message}`);

  // O app ja esta carregado e nao sabe de nada disto. `cycleExpBonus` so e
  // reidratado de daily_commitments na abertura, entao sem recarregar o fecho
  // usaria o estado velho — e o teste mediria a semente errada.
  await cdp('Page.reload', { ignoreCache: true });
  // Esperar a casca subir nao basta em dois sentidos: o app volta do
  // recarregamento em "SINCRONIZANDO...", e volta na tela inicial, nao no
  // planner. Entao espera-se a navegacao existir, vai-se ao planner, e so ali se
  // espera pelo botao que sera de fato clicado.
  await waitFor(
    'shell after seeding',
    `(() => document.querySelector('#nav-planner') instanceof HTMLElement)()`,
    60000,
  );
  await clickSelector('#nav-planner');
  await waitFor(
    'planner ready after seeding',
    `(() => document.querySelector('#report-button') instanceof HTMLElement)()`,
    30000,
  );

  return EXP_DO_DIA;
}

async function verificarPagamentoDoCiclo() {
  const { data: cycle, error: cycleError } = await user.client
    .from('cycles')
    .select('id, name, start_date, end_date, banked_exp_bonus, report_data')
    .eq('user_id', user.userId)
    .not('report_data', 'is', null)
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cycleError) throw new Error(`Could not read the closed cycle: ${cycleError.message}`);
  if (!cycle) throw new Error('No closed cycle found after confirming the end of the cycle.');

  // O relatorio grava em snake_case, na raiz ou dentro de `metrics` dependendo da
  // versao que fechou o ciclo. Os dois lugares sao olhados.
  const doRelatorio = (campo) => {
    const raiz = cycle.report_data?.[campo];
    const emMetrics = cycle.report_data?.metrics?.[campo];
    return Number(raiz ?? emMetrics ?? 0);
  };

  const { data: dias, error: diasError } = await user.client
    .from('daily_commitments')
    .select('exp_deposited')
    .eq('user_id', user.userId)
    .eq('stage', 'judgment')
    .gte('date', cycle.start_date)
    .lte('date', cycle.end_date);

  if (diasError) throw new Error(`Could not read the judged days: ${diasError.message}`);

  const somaDosDias = (dias || []).reduce((soma, dia) => soma + Number(dia.exp_deposited || 0), 0);
  const banked = Number(cycle.banked_exp_bonus || 0);
  const bonusPremium = doRelatorio('premium_bonus_pts');
  const esperado = somaDosDias + banked + bonusPremium;
  const obtido = doRelatorio('exp_gained');

  // Quando a conta nao bate, o proximo passo e sempre "e o que o relatorio gravou,
  // entao?". As chaves de EXP vao junto para a mensagem em vez de virar outra
  // rodada de investigacao.
  const chavesDeExp = Object.entries({ ...(cycle.report_data || {}), ...(cycle.report_data?.metrics || {}) })
    .filter(([chave]) => /exp|bonus|pts/i.test(chave))
    .map(([chave, valor]) => `${chave}=${JSON.stringify(valor)}`)
    .join(' ');
  const conta = `relatorio ${obtido} · esperado ${esperado} (dias ${somaDosDias} + banked ${banked} + premium ${bonusPremium}) · gravado: ${chavesDeExp || '(nenhuma chave de exp)'}`;

  // Um ciclo sem EXP nenhuma passaria em qualquer regra de igualdade, inclusive na
  // errada. Entao a ausencia de EXP e falha: significa que o percurso nao chegou a
  // pagar nada e nao ha o que medir.
  if (esperado <= 0) {
    throw new Error(`The cycle closed without any EXP, so the payment rule was never exercised. ${conta}`);
  }

  if (Math.abs(obtido - esperado) > 1) {
    const dobro = obtido >= esperado * 1.7 ? ' Parece o pagamento em dobro de volta.' : '';
    throw new Error(`Cycle close paid the wrong EXP.${dobro} ${conta}`);
  }
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

  const expSemeada = await semearUmDiaPagoNoCiclo();
  checkpoints.push('cycle-day-seeded');

  // A primeira versao disto era instavel: em 1 de cada 5 execucoes o ciclo fechava
  // pagando 0, porque `cycleExpBonus` e reidratado de forma assincrona depois do
  // recarregamento e o teste chegava no botao antes.
  //
  // A espera certa nao e um tempo, e a PROMESSA. O planner monta "+37 ao fechar"
  // exatamente quando esse estado existe, entao a presenca dela e prova de que a
  // hidratacao terminou. Isso amarra as duas pontas que importam: a tela prometeu
  // um numero, e o relatorio tem de pagar aquele numero.
  //
  // A leitura e por `textContent`, nao `innerText`, e por um motivo que vale
  // registrar: hoje o cracha esta no DOM e NAO esta visivel. `innerText` nao o
  // enxerga. Usar `textContent` mede o que este teste quer medir — o estado
  // existe — sem depender de um defeito de layout que e outro assunto.
  await waitFor(
    'planner promises the banked exp',
    `(() => (document.body?.textContent || '').includes('+${expSemeada} ao fechar'))()`,
    30000,
  );
  checkpoints.push('cycle-exp-promised');

  // A primeira versao disto era instavel: as vezes o ciclo fechava pagando 0
  // porque `cycleExpBonus` e reidratado de forma assincrona depois do
  // recarregamento, e o teste chegava no botao antes.
  //
  // A espera certa nao e um tempo, e a PROMESSA. O planner mostra "+37 ao fechar"
  // exatamente quando esse estado existe. Esperar por ela deixa o teste
  // deterministico e, de quebra, amarra as duas pontas que importam: a tela
  // prometeu um numero, e o relatorio tem de pagar aquele numero.

  // O recarregamento devolveu o app a tela inicial; e preciso voltar aos relatorios.
  await clickSelector('#report-button');
  await waitFor('reports view after seeding', `(() => document.querySelector('#end-cycle-button') instanceof HTMLElement)()`, 15000);

  await clickSelector('#end-cycle-button');
  await waitFor('end cycle confirmation', `(() => Array.from(document.querySelectorAll('button')).some((node) => (node.innerText || '').includes('CONFIRMAR')))()`, 10000);
  await clickByText('CONFIRMAR');
  checkpoints.push('cycle-end-confirmed');

  await waitFor('report results', `(() => document.querySelector('#report-summary-card-capture') instanceof HTMLElement)()`, 20000);
  checkpoints.push('report-results-open');

  await advanceToRewardSlide();
  await waitFor('new cycle action', `(() => document.body && document.body.innerText.toLowerCase().includes('novo ciclo'))()`, 10000);
  checkpoints.push('report-reward-slide');

  // O fecho do ciclo passa a ser MEDIDO, nao so percorrido.
  //
  // Ate aqui este teste clicava em fechar ciclo, via o relatorio abrir e dava por
  // bom. O pagamento em dobro atravessaria isso sem tocar em nada: a tela e a
  // mesma, so o numero e que estava errado. Era o item 1 do checklist, e era o
  // unico que precisava de um humano com uma calculadora.
  //
  // A regra e a mesma linha que fecha o ciclo no app:
  //     exp_gained = soma dos dias julgados + banked_exp_bonus + bonus premium
  // O defeito somava a base recalculada por cima, e o relatorio vinha perto do
  // dobro. Conferir contra o banco e mais forte que ler o numero da tela: nao ha
  // formatacao no meio, e o que fica gravado e o que a conta da pessoa vai usar.
  await verificarPagamentoDoCiclo();
  checkpoints.push('cycle-exp-verified');

  await clickSelector('#report-new-cycle-button');
  await waitFor('new cycle setup view', `(() => { const text = (document.body?.innerText || '').toLowerCase(); return text.includes('novo ciclo') && text.includes('iniciar novo ciclo'); })()` , 15000);
  checkpoints.push('new-cycle-setup-open');

  console.log(JSON.stringify({ success: true, email: user?.email || null, cycleName, checkpoints }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    checkpoints,
    error: error instanceof Error ? error.message : String(error),
    consoleErrors: consoleErrors.slice(-15),
    bodyText: await bodyText(),
  }, null, 2));
  process.exitCode = 1;
} finally {
  try { ws.close(); } catch {}
  cleanup();
}












