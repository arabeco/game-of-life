import { createAnonClient, createTempUser, DEFAULT_SMOKE_URL } from './_smoke.supabase.mjs';
import { sleep, withBrowser } from './_smoke.browser.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;

function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function bodyIncludesExpression(text) {
  const needle = normalizeText(text);
  return `(() => {
    const body = (document.body?.innerText || '')
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .toUpperCase();
    return body.includes(${JSON.stringify(needle)});
  })()`;
}

function onboardingTitleExpression(text) {
  const needle = normalizeText(text);
  return `(() => {
    const title = document.querySelector('#first-use-onboarding-title');
    const value = (title?.textContent || '')
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .toUpperCase()
      .trim();
    return value === ${JSON.stringify(needle)};
  })()`;
}

async function waitForBodyText(page, description, text, timeoutMs = 12000) {
  await page.waitFor(description, bodyIncludesExpression(text), timeoutMs);
}

async function advanceOverlay(page, currentStepText) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const clicked = await page.evaluate(`(() => {
      const button = document.querySelector('#first-use-onboarding-next');
      if (!(button instanceof HTMLElement)) return false;
      button.click();
      return true;
    })()`);
    if (!clicked) {
      await page.clickText('Próximo');
    }
    await sleep(320);
    const stillSameStep = await page.evaluate(onboardingTitleExpression(currentStepText));
    if (!stillSameStep) {
      return;
    }
  }

  throw new Error(`Overlay did not advance from step: ${currentStepText}`);
}


async function updateProfile(client, userId, patch) {
  const { error } = await client
    .from('user_profiles')
    .update(patch)
    .eq('id', userId);

  if (error) {
    throw new Error(`profile update failed: ${error.message}`);
  }
}

async function fetchProfile(client, userId) {
  const { data, error } = await client
    .from('user_profiles')
    .select('onboarding_completed_at,onboarding_dismissed_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error(`profile fetch failed: ${error?.message || 'missing profile'}`);
  }

  return data;
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

async function clickOracleSend(page) {
  const ok = await page.evaluate(`(() => {
    const input = Array.from(document.querySelectorAll('input'))
      .find((node) => node instanceof HTMLInputElement && (node.placeholder || '').includes('Consulte o Oráculo'));
    if (!(input instanceof HTMLInputElement)) return false;
    const wrapper = input.parentElement;
    const button = wrapper ? wrapper.querySelector('button') : null;
    if (!(button instanceof HTMLElement)) return false;
    button.click();
    return true;
  })()`);

  if (!ok) {
    throw new Error('Could not click Oracle send button.');
  }
}

async function waitForOracleResponse(page, promptText) {
  await page.waitFor(
    'oracle response',
    `(() => {
      const body = document.body ? document.body.innerText : '';
      if (!body.includes(${JSON.stringify(promptText)})) return false;
      if (body.includes('Consultando os astros...')) return false;
      return true;
    })()`,
    45000,
  );

  const body = await page.bodyText();
  const fallbackMarkers = [
    'O Oraculo esta em silencio momentaneo',
    'Sessao expirada no Oraculo',
    'Oraculo bloqueado para esta origem',
    'Oraculo indisponivel',
  ];

  const fallback = fallbackMarkers.find((marker) => body.includes(marker));
  if (fallback) {
    throw new Error(`Oracle returned fallback message: ${fallback}`);
  }
}

async function runOnboardingScenario() {
  const checkpoints = [];
  const user = await createTempUser({ label: 'onboarding-smoke', isPremium: true, appMode: 'GAME' });
  const session = await getSession(user.client);

  await withBrowser({ baseUrl, debugPort: 9331 }, async (page) => {
    await seedSession(page, session);
    checkpoints.push('login-ok');

    await page.waitFor(
      'onboarding overlay',
      `(() => {
        const body = (document.body?.innerText || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase();
        return body.includes('ONBOARDING') && body.includes('PRIMEIRO CICLO');
      })()`,
      40000,
    );
    checkpoints.push('overlay-open');

    await page.waitForSelector('#start-new-cycle-button', 20000);
    await page.clickSelector('#start-new-cycle-button');
    await page.waitForSelector('#new-cycle-name-input', 20000);
    await page.setInputValue('#new-cycle-name-input', 'Ciclo Smoke');
    await sleep(300);
    await advanceOverlay(page, 'Nomeie a fase');
    checkpoints.push('cycle-name');

    await waitForBodyText(page, 'cycle-date-step', 'Escolha a data final', 12000);
    await advanceOverlay(page, 'Escolha a data final');
    await waitForBodyText(page, 'cycle-save-step', 'Inicie o ciclo', 12000);
    await page.clickSelector('#new-cycle-submit-button');
    await page.clickText('CONFIRMAR');
    checkpoints.push('cycle-created');

    await waitForBodyText(page, 'arena-entry', 'Crie sua primeira arena', 20000);
    await page.waitForSelector('#new-action-button', 20000);
    await page.clickSelector('#new-action-button');
    await page.waitForSelector('#new-arena-name-input', 20000);
    await waitForBodyText(page, 'arena-asset-step', 'Ativo pai', 12000);
    await advanceOverlay(page, 'Ativo pai');
    await page.setInputValue('#new-arena-name-input', 'Arena Smoke');
    await sleep(250);
    await advanceOverlay(page, 'Nome da arena');
    await waitForBodyText(page, 'arena-description-step', 'Meta da arena', 12000);
    await advanceOverlay(page, 'Meta da arena');
    await waitForBodyText(page, 'arena-save-step', 'Criar arena', 12000);
    await page.clickSelector('#new-arena-submit-button');
    checkpoints.push('arena-created');

    await waitForBodyText(page, 'action-entry', 'Primeira ação', 20000);
    await page.waitForSelector('#add-action-button', 20000);
    await page.clickSelector('#add-action-button');
    await page.waitForSelector('#onboarding-action-name-input', 20000);
    await page.setInputValue('#onboarding-action-name-input', 'Acao Smoke');
    await sleep(250);
    await advanceOverlay(page, 'Título da ação');
    await waitForBodyText(page, 'action-type-step', 'Tipo da ação', 12000);
    await advanceOverlay(page, 'Tipo da ação');
    await waitForBodyText(page, 'action-repetitions-step', 'Repetições', 12000);
    await advanceOverlay(page, 'Repetições');
    await waitForBodyText(page, 'action-duration-step', 'Duração base', 12000);
    await advanceOverlay(page, 'Duração base');
    await waitForBodyText(page, 'action-save-step', 'Salvar ação', 12000);
    await page.clickSelector('#onboarding-action-save-button');
    checkpoints.push('action-created');

    await waitForBodyText(page, 'planner-step', 'pronta para uso', 20000);
    await advanceOverlay(page, 'Planner');
    await waitForBodyText(page, 'rest-entry-step', 'Tela de descanso', 12000);
    await page.clickSelector('#lock-icon-button');
    await page.waitForSelector('#sitrep-embedded-card', 20000);
    await waitForBodyText(page, 'sitrep-step', 'fluxo diário', 12000);
    await advanceOverlay(page, 'Painel Diário');
    await waitForBodyText(page, 'finish-step', 'Configurações > Tutoriais', 12000);
    await page.clickText('Concluir');
    checkpoints.push('onboarding-finished');

    await page.waitFor(
      'rest screen after onboarding',
      `(() => {
        const hasOnboardingBadge = Array.from(document.querySelectorAll('div, span, p, h3, button'))
          .some((node) => (node.textContent || '').trim() === 'ONBOARDING');
        return !hasOnboardingBadge && !!document.querySelector('#sitrep-embedded-card');
      })()`,
      25000,
    );
  });

  const profile = await fetchProfile(user.client, user.userId);
  if (!profile.onboarding_completed_at) {
    throw new Error('Onboarding did not persist onboarding_completed_at.');
  }

  return { user, checkpoints };
}

async function runOracleScenario() {
  const checkpoints = [];
  const user = await createTempUser({ label: 'oracle-smoke', isPremium: true, appMode: 'GAME' });
  const completedAt = new Date().toISOString();

  await updateProfile(user.client, user.userId, {
    onboarding_version: 'operational-v1',
    onboarding_started_at: completedAt,
    onboarding_completed_at: completedAt,
  });
  const session = await getSession(user.client);

  const promptText = 'Me de um conselho curto para hoje.';

  await withBrowser({ baseUrl, debugPort: 9332 }, async (page) => {
    await seedSession(page, session);
    checkpoints.push('login-ok');

    await page.clickSelector('#header-oracle');
    await page.waitFor('oracle input', `(() => Array.from(document.querySelectorAll('input')).some((node) => node instanceof HTMLInputElement && (node.placeholder || '').includes('Consulte o Oráculo')))()`, 25000);
    checkpoints.push('oracle-open');

    await page.evaluate(`(() => {
      const input = Array.from(document.querySelectorAll('input'))
        .find((node) => node instanceof HTMLInputElement && (node.placeholder || '').includes('Consulte o Oráculo'));
      if (!(input instanceof HTMLInputElement)) return false;
      const proto = HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (!setter) return false;
      input.focus();
      setter.call(input, ${JSON.stringify(promptText)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);

    await clickOracleSend(page);
    await waitForOracleResponse(page, promptText);
    checkpoints.push('oracle-response');
  });

  return { user, checkpoints };
}

async function runDeleteScenario() {
  const checkpoints = [];
  const user = await createTempUser({ label: 'delete-smoke', isPremium: true, appMode: 'GAME' });
  const completedAt = new Date().toISOString();

  await updateProfile(user.client, user.userId, {
    onboarding_version: 'operational-v1',
    onboarding_started_at: completedAt,
    onboarding_completed_at: completedAt,
  });
  const session = await getSession(user.client);

  await withBrowser({ baseUrl, debugPort: 9333 }, async (page) => {
    await seedSession(page, session);
    checkpoints.push('login-ok');

    await page.clickSelector('#nav-settings');
    await page.waitFor('settings view', `(() => document.querySelector('#settings-container') instanceof HTMLElement && document.body.innerText.includes('Deletar Conta'))()`, 25000);
    checkpoints.push('settings-open');

    await page.evaluate(`(() => {
      window.prompt = () => 'DELETAR';
      return true;
    })()`);

    await page.clickText('Deletar Conta');
    await page.waitFor('delete confirmation modal', `(() => document.body && document.body.innerText.includes('Tem certeza? Esta ação é irreversível.'))()`, 15000);
    await page.clickText('CONFIRMAR');
    checkpoints.push('delete-confirmed');

    await page.waitFor(
      'login screen after deletion',
      `(() => document.querySelector('#login-email-input') instanceof HTMLElement && document.querySelector('#login-submit-button') instanceof HTMLElement)()`,
      45000,
    );
  });

  const verifier = createAnonClient();
  const signIn = await verifier.auth.signInWithPassword({ email: user.email, password: user.password });
  if (!signIn.error) {
    throw new Error('Deleted account still allows sign-in.');
  }

  return { user, checkpoints, signInError: signIn.error.message };
}

async function main() {
  const scenarios = [
    ['onboarding', runOnboardingScenario],
    ['oracle', runOracleScenario],
    ['deletion', runDeleteScenario],
  ];

  const summary = {
    ok: true,
    baseUrl,
    results: {},
  };

  for (const [label, runner] of scenarios) {
    try {
      const result = await runner();
      summary.results[label] = {
        ok: true,
        email: result.user.email,
        checkpoints: result.checkpoints,
        ...(result.signInError ? { signInError: result.signInError } : {}),
      };
    } catch (error) {
      summary.ok = false;
      summary.results[label] = {
        ok: false,
        error: error?.message || String(error),
        stack: error?.stack || null,
      };
    }
  }

  console.log(JSON.stringify(summary, null, 2));

  if (!summary.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('SMOKE_FAILED');
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
