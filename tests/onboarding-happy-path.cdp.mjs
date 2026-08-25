import { createTempUser, DEFAULT_SMOKE_URL, findActionByName, findArenaByName } from './_smoke.supabase.mjs';
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
  if (['ESCOLHA A AREA', 'DE UM NOME CLARO', 'CRIE A ARENA', 'ATIVO PAI', 'NOME DA ARENA', 'META DA ARENA', 'CRIAR ARENA'].includes(currentTitle)) {
    try {
      await page.waitFor(
        'arena modal fields',
        `(() => {
          return document.querySelector('#new-arena-asset-button') instanceof HTMLElement
            || document.querySelector('#new-arena-name-input') instanceof HTMLInputElement
            || document.querySelector('#new-arena-submit-button') instanceof HTMLElement;
        })()`,
        12000,
      );
    } catch (error) {
      throw new Error([
        error instanceof Error ? error.message : String(error),
        JSON.stringify({ console: page.getConsoleMessages(), exceptions: page.getExceptions() }, null, 2),
      ].join('\n\n'));
    }
    return;
  }

  const onArenaEntry = await page.evaluate(`(() => {
    const title = (document.querySelector('#first-use-onboarding-title')?.textContent || '')
      .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase().trim();
    return title === 'SUA PRIMEIRA ARENA' || title === 'CRIE SUA PRIMEIRA ARENA';
  })()`);
  if (onArenaEntry) {
    await advanceOverlay(page, 'Sua primeira arena');
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
  if (['SUA PRIMEIRA ARENA', 'ESCOLHA A AREA', 'DE UM NOME CLARO', 'CRIE A ARENA', 'CRIE SUA PRIMEIRA ARENA', 'ATIVO PAI', 'NOME DA ARENA', 'META DA ARENA', 'CRIAR ARENA'].includes(currentTitle)) {
    await page.waitFor(
      'transition from arena flow to action flow',
      `(() => {
        const title = (document.querySelector('#first-use-onboarding-title')?.textContent || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toUpperCase()
          .trim();
        return title === 'PRIMEIRA ACAO'
          || title === 'O QUE VOCE VAI FAZER?'
          || title === 'TITULO DA ACAO'
          || title === 'TIPO DA ACAO'
          || document.querySelector('#add-action-button') instanceof HTMLElement
          || document.querySelector('#onboarding-action-name-input') instanceof HTMLInputElement;
      })()`,
      18000,
    );
    return ensureActionModalOpen(page);
  }

  if (['O QUE VOCE VAI FAZER?', 'ESCOLHA UMA META LEVE', 'SALVE SUA ACAO', 'TITULO DA ACAO', 'TIPO DA ACAO', 'REPETICOES', 'DURACAO BASE', 'SALVAR ACAO'].includes(currentTitle)) {
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

    await waitForOnboardingTitle(page, 'Qual sua faixa etaria?', 25000);
    checkpoints.push('onboarding-open');

    // As tres perguntas de primeiro uso. Cada uma avanca ao escolher, sem botao
    // Proximo, entao o clique na opcao e a unica saida do passo.
    await page.clickSelector('#onboarding-age-25_34');
    await waitForOnboardingTitle(page, 'Pra que voce quer usar o app?', 12000);
    checkpoints.push('age-answered');

    await page.clickSelector('#onboarding-purpose-organizar');
    await waitForOnboardingTitle(page, 'Quanta presenca voce quer do Oraculo?', 12000);
    checkpoints.push('purpose-answered');

    await page.clickSelector('#onboarding-oracle-2');
    checkpoints.push('oracle-presence-answered');

    await waitForOnboardingTitle(page, 'Sua primeira arena', 12000);
    await advanceOverlay(page, 'Sua primeira arena');
    try {
      await page.waitForSelector('#new-arena-name-input', 20000);
    } catch (error) {
      throw new Error([
        error instanceof Error ? error.message : String(error),
        await page.bodyText(),
        JSON.stringify({ console: page.getConsoleMessages(), exceptions: page.getExceptions() }, null, 2),
      ].join('\n\n'));
    }
    await waitForOnboardingTitle(page, 'Escolha a area', 12000);
    checkpoints.push('arena-modal-open');

    await advanceOverlay(page, 'Escolha a area');

    await waitForOnboardingTitle(page, 'De um nome claro', 12000);
    await page.setInputValue('#new-arena-name-input', 'Arena Smoke Feliz');
    await sleep(260);
    await advanceOverlay(page, 'De um nome claro');

    await waitForOnboardingTitle(page, 'Crie a arena', 12000);
    await page.clickSelector('#new-arena-submit-button');
    checkpoints.push('arena-created');

    await ensureActionModalOpen(page);
    await waitForOnboardingTitle(page, 'O que voce vai fazer?', 12000);
    checkpoints.push('action-modal-open');

    await page.setInputValue('#onboarding-action-name-input', 'Ação Smoke Feliz');
    await sleep(260);
    await advanceOverlay(page, 'O que voce vai fazer?');

    const actionGoalStep = await waitForOneOfOnboardingTitles(page, ['Escolha uma meta leve', 'Salve sua acao'], 12000);
    if (actionGoalStep === 'ESCOLHA UMA META LEVE') {
      await advanceOverlay(page, 'Escolha uma meta leve');
    }

    await waitForOnboardingTitle(page, 'Salve sua acao', 12000);
    await page.clickSelector('#onboarding-action-save-button');
    checkpoints.push('action-save-clicked');

    // Clicking save is not the same as having an action. handleSave refuses on a few
    // validations and only reports them through a toast the overlay can cover, which
    // matches the report that the tutorial's arena shows up but its action does not.
    await sleep(1200);
    const savedAction = await findActionByName(user.client, { userId: user.userId, name: 'Ação Smoke Feliz' });
    if (!savedAction) {
      throw new Error(`Onboarding action was not persisted after saving.\n\n${await page.bodyText()}`);
    }
    checkpoints.push('action-created');

    await waitForOnboardingTitle(page, 'Comece um ciclo curto', 20000);
    await advanceOverlay(page, 'Comece um ciclo curto');
    await page.waitForSelector('#new-cycle-name-input', 20000);
    await waitForOnboardingTitle(page, 'Confira o prazo', 12000);
    await advanceOverlay(page, 'Confira o prazo');
    await waitForOnboardingTitle(page, 'Inicie o ciclo', 12000);
    await page.clickSelector('#new-cycle-submit-button');
    await page.clickText('CONFIRMAR');
    checkpoints.push('cycle-created');

    // 1.0.58 added an optional mission step between the cycle and the finish. Taking
    // none is a valid answer, so the happy path just moves past it.
    await waitForOnboardingTitle(page, 'Quer uma missao para comecar?', 20000);
    await advanceOverlay(page, 'Quer uma missao para comecar?');
    checkpoints.push('mission-step-skipped');

    await waitForOnboardingTitle(page, 'Tudo pronto', 20000);
    await advanceOverlay(page, 'Tudo pronto');
    checkpoints.push('onboarding-finished');

    await page.waitFor(
      'overlay dismissed',
      `(() => {
        return !(document.querySelector('#first-use-onboarding-title') instanceof HTMLElement)
          && document.querySelector('#nav-assets') instanceof HTMLElement;
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
