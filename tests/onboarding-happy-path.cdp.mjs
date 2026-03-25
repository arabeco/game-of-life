import { createTempUser, DEFAULT_SMOKE_URL } from './_smoke.supabase.mjs';
import { sleep, withBrowser } from './_smoke.browser.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const PROFILE_FLAG_TERMS_PENDING = '__flag_terms_pending_v1';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
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
    .select('onboarding_completed_at,onboarding_dismissed_at,completed_season_missions')
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
}

async function clickTermsPrimary(page) {
  const ok = await page.evaluate(`(() => {
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

  if (!ok) {
    throw new Error(`Could not click terms primary control.\n\n${await page.bodyText()}`);
  }
}

async function holdTermsPrimary(page, ms = 1000) {
  const down = await page.evaluate(`(() => {
    const candidates = Array.from(document.querySelectorAll('div')).filter((node) => {
      const style = node.getAttribute('style') || '';
      return node instanceof HTMLElement && node.offsetParent !== null && style.includes('touch-action');
    });
    const target = candidates[candidates.length - 1];
    if (!(target instanceof HTMLElement)) return false;
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    return true;
  })()`);

  if (!down) {
    throw new Error(`Could not start terms hold.\n\n${await page.bodyText()}`);
  }

  await sleep(ms);

  await page.evaluate(`(() => {
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

async function advanceTermsToClause(page, targetClause) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const onTarget = await page.evaluate(`(() => {
      const body = document.body?.innerText || '';
      return body.includes(${JSON.stringify(`CLÁUSULA ${targetClause} / 5`)});
    })()`);
    if (onTarget) return;
    await clickTermsPrimary(page);
    await sleep(280);
  }

  throw new Error(`Could not advance terms to clause ${targetClause}.\n\n${await page.bodyText()}`);
}

async function waitForOnboardingTitle(page, title, timeoutMs = 15000) {
  await page.waitFor(`onboarding step ${title}`, onboardingTitleExpression(title), timeoutMs);
}

async function getOnboardingTitle(page) {
  return normalizeText(await page.evaluate(`(() => document.querySelector('#first-use-onboarding-title')?.textContent || '')()`));
}

async function waitForOneOfOnboardingTitles(page, titles, timeoutMs = 15000) {
  const normalizedTitles = titles.map((title) => normalizeText(title));
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const currentTitle = await getOnboardingTitle(page);
    if (normalizedTitles.includes(currentTitle)) {
      return currentTitle;
    }
    await sleep(250);
  }

  throw new Error(`Timeout waiting for one of onboarding steps: ${titles.join(', ')}.\n\n${await page.bodyText()}`);
}

async function advanceOverlay(page, currentStepTitle) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.clickSelector('#first-use-onboarding-next');
    await sleep(320);
    const stillSameStep = await page.evaluate(onboardingTitleExpression(currentStepTitle));
    if (!stillSameStep) {
      return;
    }
  }

  throw new Error(`Overlay did not advance from step: ${currentStepTitle}\n\n${await page.bodyText()}`);
}

async function ensureArenaModalOpen(page) {
  await page.waitFor(
    'arena entry or modal',
    `(() => {
      return document.querySelector('#new-arena-name-input') instanceof HTMLInputElement
        || document.querySelector('#new-action-button') instanceof HTMLElement
        || document.querySelector('#first-use-onboarding-title') instanceof HTMLElement;
    })()`,
    20000,
  );

  const hasArenaInput = await page.evaluate(`(() => document.querySelector('#new-arena-name-input') instanceof HTMLInputElement)()`);
  if (hasArenaInput) return;

  const currentTitle = await getOnboardingTitle(page);
  if (['ATIVO PAI', 'NOME DA ARENA', 'META DA ARENA', 'CRIAR ARENA'].includes(currentTitle)) {
    await page.waitFor(
      'arena modal fields',
      `(() => {
        return document.querySelector('#new-arena-asset-button') instanceof HTMLElement
          || document.querySelector('#new-arena-name-input') instanceof HTMLInputElement
          || document.querySelector('#new-arena-submit-button') instanceof HTMLElement;
      })()`,
      12000,
    );
    return;
  }

  const onArenaEntry = await page.evaluate(onboardingTitleExpression('Crie sua primeira arena'));
  if (onArenaEntry) {
    await advanceOverlay(page, 'Crie sua primeira arena');
    await sleep(450);
  } else {
    await page.clickSelector('#new-action-button');
    await sleep(450);
  }

  await page.waitForSelector('#new-arena-name-input', 20000);
}

async function ensureActionModalOpen(page) {
  await page.waitFor(
    'action entry or modal',
    `(() => {
      return document.querySelector('#onboarding-action-name-input') instanceof HTMLInputElement
        || document.querySelector('#add-action-button') instanceof HTMLElement
        || document.querySelector('#first-use-onboarding-title') instanceof HTMLElement;
    })()`,
    20000,
  );

  const hasActionInput = await page.evaluate(`(() => document.querySelector('#onboarding-action-name-input') instanceof HTMLInputElement)()`);
  if (hasActionInput) return;

  const currentTitle = await getOnboardingTitle(page);
  if (['CRIE SUA PRIMEIRA ARENA', 'ATIVO PAI', 'NOME DA ARENA', 'META DA ARENA', 'CRIAR ARENA'].includes(currentTitle)) {
    await page.waitFor(
      'transition from arena flow to action flow',
      `(() => {
        const title = (document.querySelector('#first-use-onboarding-title')?.textContent || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase()
          .trim();
        return title === 'PRIMEIRA ACAO'
          || title === 'TITULO DA ACAO'
          || title === 'TIPO DA ACAO'
          || document.querySelector('#add-action-button') instanceof HTMLElement
          || document.querySelector('#onboarding-action-name-input') instanceof HTMLInputElement;
      })()`,
      18000,
    );
    return ensureActionModalOpen(page);
  }

  if (['TITULO DA ACAO', 'TIPO DA ACAO', 'REPETICOES', 'DURACAO BASE', 'SALVAR ACAO'].includes(currentTitle)) {
    await page.waitFor(
      'action modal fields',
      `(() => {
        return document.querySelector('#onboarding-action-name-input') instanceof HTMLInputElement
          || document.querySelector('#onboarding-action-type-button') instanceof HTMLElement
          || document.querySelector('#onboarding-action-save-button') instanceof HTMLElement;
      })()`,
      12000,
    );
    return;
  }

  const onActionEntry = await page.evaluate(onboardingTitleExpression('Primeira acao'));
  if (onActionEntry) {
    await advanceOverlay(page, 'Primeira acao');
    await sleep(450);
  } else {
    await page.clickSelector('#add-action-button');
    await sleep(450);
  }

  await page.waitForSelector('#onboarding-action-name-input', 20000);
}

async function main() {
  const checkpoints = [];
  const user = await createTempUser({
    label: 'onboarding-happy',
    isPremium: false,
    appMode: 'BASIC',
    gold: 0,
    fragments: 0,
  });

  await updateProfile(user.client, user.userId, {
    completed_season_missions: [PROFILE_FLAG_TERMS_PENDING],
    onboarding_version: null,
    onboarding_started_at: null,
    onboarding_completed_at: null,
    onboarding_dismissed_at: null,
    starter_rewards_pending: false,
    vanguard_welcome_pending: false,
    vanguard_welcome_payload: {},
    premium_reward_pending: false,
    premium_reward_payload: {},
    is_premium: false,
    app_mode: 'BASIC',
  });

  const session = await getSession(user.client);

  await withBrowser({ baseUrl, debugPort: 9341 }, async (page) => {
    await seedSession(page, session);

    await page.waitFor(
      'terms overlay',
      `(() => {
        const body = (document.body?.innerText || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase();
        return body.includes('O DESPERTAR DO SOBERANO') && body.includes('CLAUSULA 1 / 5');
      })()`,
      40000,
    );
    checkpoints.push('terms-open');

    await advanceTermsToClause(page, 2);
    await advanceTermsToClause(page, 3);
    await advanceTermsToClause(page, 4);
    await advanceTermsToClause(page, 5);
    await holdTermsPrimary(page, 950);
    checkpoints.push('terms-accepted');

    await waitForOnboardingTitle(page, 'Primeiro ciclo', 25000);
    checkpoints.push('onboarding-open');

    await advanceOverlay(page, 'Primeiro ciclo');
    await page.waitForSelector('#new-cycle-name-input', 20000);
    await waitForOnboardingTitle(page, 'Nomeie a fase', 12000);
    checkpoints.push('cycle-step');

    await page.setInputValue('#new-cycle-name-input', 'Ciclo Smoke Feliz');
    await sleep(260);
    await advanceOverlay(page, 'Nomeie a fase');

    await waitForOnboardingTitle(page, 'Escolha a data final', 12000);
    await advanceOverlay(page, 'Escolha a data final');

    await waitForOnboardingTitle(page, 'Inicie o ciclo', 12000);
    await page.clickSelector('#new-cycle-submit-button');
    await page.clickText('CONFIRMAR');
    checkpoints.push('cycle-created');

    await ensureArenaModalOpen(page);
    await waitForOnboardingTitle(page, 'Ativo pai', 12000);
    checkpoints.push('arena-modal-open');

    await advanceOverlay(page, 'Ativo pai');

    await waitForOnboardingTitle(page, 'Nome da arena', 12000);
    await page.setInputValue('#new-arena-name-input', 'Arena Smoke Feliz');
    await sleep(260);
    await advanceOverlay(page, 'Nome da arena');

    await waitForOnboardingTitle(page, 'Meta da arena', 12000);
    await advanceOverlay(page, 'Meta da arena');

    await waitForOnboardingTitle(page, 'Criar arena', 12000);
    await page.clickSelector('#new-arena-submit-button');
    checkpoints.push('arena-created');

    await ensureActionModalOpen(page);
    await waitForOnboardingTitle(page, 'Titulo da acao', 12000);
    checkpoints.push('action-modal-open');

    await page.setInputValue('#onboarding-action-name-input', 'Ação Smoke Feliz');
    await sleep(260);
    await advanceOverlay(page, 'Titulo da acao');

    await waitForOnboardingTitle(page, 'Tipo da acao', 12000);
    await advanceOverlay(page, 'Tipo da acao');

    await waitForOnboardingTitle(page, 'Repeticoes', 12000);
    await advanceOverlay(page, 'Repeticoes');

    await waitForOnboardingTitle(page, 'Duracao base', 12000);
    await advanceOverlay(page, 'Duracao base');

    await waitForOnboardingTitle(page, 'Salvar acao', 12000);
    await page.clickSelector('#onboarding-action-save-button');
    checkpoints.push('action-created');

    let currentStep = await waitForOneOfOnboardingTitles(page, ['Planner', 'Tela de descanso', 'Painel Diario', 'Base pronta'], 20000);
    if (currentStep === 'PLANNER') {
      await advanceOverlay(page, 'Planner');
      currentStep = await waitForOneOfOnboardingTitles(page, ['Tela de descanso', 'Painel Diario', 'Base pronta'], 12000);
    }

    if (currentStep === 'TELA DE DESCANSO') {
      await advanceOverlay(page, 'Tela de descanso');
      currentStep = await waitForOneOfOnboardingTitles(page, ['Painel Diario', 'Base pronta'], 12000);
    }

    if (currentStep === 'PAINEL DIARIO') {
      await advanceOverlay(page, 'Painel Diario');
      currentStep = await waitForOneOfOnboardingTitles(page, ['Base pronta'], 12000);
    }

    if (currentStep !== 'BASE PRONTA') {
      throw new Error(`Unexpected final onboarding step: ${currentStep}\n\n${await page.bodyText()}`);
    }

    await advanceOverlay(page, 'Base pronta');
    checkpoints.push('onboarding-finished');

    await page.waitFor(
      'overlay dismissed',
      `(() => {
        return !(document.querySelector('#first-use-onboarding-title') instanceof HTMLElement)
          && (document.querySelector('#sitrep-embedded-card') instanceof HTMLElement
            || document.querySelector('#nav-planner') instanceof HTMLElement);
      })()`,
      25000,
    );
  });

  const profile = await fetchProfile(user.client, user.userId);
  if (!profile.onboarding_completed_at) {
    throw new Error('Onboarding did not persist onboarding_completed_at.');
  }

  const summary = {
    ok: true,
    email: user.email,
    password: user.password,
    checkpoints,
    onboardingCompletedAt: profile.onboarding_completed_at,
    completedSeasonMissions: profile.completed_season_missions,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error('[onboarding-happy-path] failure');
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
