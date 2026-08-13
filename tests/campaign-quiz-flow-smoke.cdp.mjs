import { withBrowser } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  createTempUser,
} from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const checkpoints = [];

const normalizeForMatch = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

async function stabilizeRuntime(page, attempts = 4) {
  for (let index = 0; index < attempts; index += 1) {
    await page.dismissBlockingRuntimeOverlays(5000);
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
}

async function dismissSplashIfPresent(page) {
  await page.evaluate(`(() => {
    const nodes = Array.from(document.querySelectorAll('div, section, article'))
      .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);

    const splashLabel = nodes.find((node) => {
      const text = (node.innerText || node.textContent || '').toLowerCase();
      return text.includes('sincronizando...');
    });

    if (!(splashLabel instanceof HTMLElement)) return false;

    const splashRoot = splashLabel.closest('.fixed, [style*="position: fixed"]');
    if (splashRoot instanceof HTMLElement) {
      splashRoot.remove();
      return true;
    }

    return false;
  })()`);
}

async function exitRestScreenIfPresent(page) {
  const present = await page.evaluate(`(() => document.querySelector('.restscreen-unlock-trigger') instanceof HTMLElement)()`);
  if (!present) return;

  const engaged = await page.evaluate(`(() => {
    const target = document.querySelector('.restscreen-unlock-trigger');
    if (!(target instanceof HTMLElement)) return false;
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    return true;
  })()`);

  if (!engaged) {
    throw new Error(`Could not start RestScreen unlock hold.\n\n${await page.bodyText()}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 1200));
  await page.evaluate(`(() => {
    const target = document.querySelector('.restscreen-unlock-trigger');
    if (!(target instanceof HTMLElement)) return false;
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    return true;
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function dismissScreenTipIfPresent(page) {
  await page.evaluate(`(() => {
    const labels = ['ENTENDI', 'DESLIGAR DICAS'];
    const buttons = Array.from(document.querySelectorAll('button'))
      .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
    const target = buttons.find((node) => {
      const text = (node.innerText || node.textContent || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase().trim();
      return labels.includes(text);
    });
    if (target instanceof HTMLElement) {
      target.click();
      return true;
    }
    return false;
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function navigateToCampaignStore(page) {
  await page.evaluate(`(() => {
    window.dispatchEvent(new CustomEvent('navigate-to-store', { detail: { tab: 'codexes' } }));
    return true;
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 600));
  await page.evaluate(`(() => {
    window.dispatchEvent(new CustomEvent('mundo-tab-request', { detail: { tab: 'loja', storeTab: 'codexes' } }));
    window.dispatchEvent(new CustomEvent('store-view-request', { detail: { tab: 'codexes' } }));
    return true;
  })()`);
  await dismissScreenTipIfPresent(page);
  await page.waitFor(
    'campaign quiz entry button',
    `(() => {
      const body = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
      return body.includes('FAZER QUIZ GRATIS') || body.includes('FAZER QUIZ') || body.includes('QUIZ GRATIS') || body.includes('QUIZ');
    })()`,
    30000,
  );
}

async function openQuiz(page) {
  const clicked = await page.evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
      .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
    const target = buttons.find((node) => {
      const text = (node.innerText || node.textContent || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
      return text.includes('FAZER QUIZ GRATIS') || text.includes('FAZER QUIZ') || text.trim() === 'QUIZ GRATIS' || text.trim() === 'QUIZ';
    });
    if (!(target instanceof HTMLElement)) return false;
    target.click();
    return true;
  })()`);
  if (!clicked) {
    throw new Error(`Could not click campaign quiz entry.\n\n${await page.bodyText()}`);
  }
  await page.waitFor(
    'campaign quiz shell',
    `(() => document.querySelector('.campaign-quiz-shell') instanceof HTMLElement)()`,
    15000,
  );
}

async function closeQuiz(page) {
  const closed = await page.evaluate(`(() => {
    const target = document.querySelector('.campaign-quiz-overlay');
    if (!(target instanceof HTMLElement)) return false;
    target.click();
    return true;
  })()`);
  if (!closed) {
    throw new Error(`Could not close campaign quiz overlay.\n\n${await page.bodyText()}`);
  }
  await page.waitFor(
    'campaign quiz closed',
    `(() => !(document.querySelector('.campaign-quiz-shell') instanceof HTMLElement))()`,
    15000,
  );
}

async function clickQuizOption(page, title) {
  const clicked = await page.evaluate(`(() => {
    const needle = ${JSON.stringify(normalizeForMatch(title))};
    const buttons = Array.from(document.querySelectorAll('.campaign-quiz-option'))
      .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);

    const target = buttons.find((node) => {
      const text = (node.innerText || node.textContent || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
      return text.includes(needle);
    });

    if (!(target instanceof HTMLElement)) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  })()`);

  if (!clicked) {
    throw new Error(`Could not select quiz option: ${title}\n\n${await page.bodyText()}`);
  }

  await page.waitFor(
    `quiz option active ${title}`,
    `(() => {
      const needle = ${JSON.stringify(normalizeForMatch(title))};
      const active = Array.from(document.querySelectorAll('.campaign-quiz-option.is-active'))
        .find((node) => node instanceof HTMLElement && node.offsetParent !== null);
      if (!(active instanceof HTMLElement)) return false;
      const text = (active.innerText || active.textContent || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
      return text.includes(needle);
    })()`,
    8000,
  );
}

async function continueQuiz(page) {
  await page.clickText('Continuar');
}

async function answerQuiz(page, answers) {
  for (const answer of answers) {
    await clickQuizOption(page, answer);
    await continueQuiz(page);
  }
}

async function readResultTitle(page) {
  const title = await page.evaluate(`(() => {
    const target = document.querySelector('.campaign-quiz-result-name');
    return target instanceof HTMLElement ? (target.innerText || target.textContent || '').trim() : '';
  })()`);
  return String(title || '').trim();
}

async function openArenasTab(page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.clickSelector('#nav-arenas');
    try {
      await page.waitFor(
        'arenas nav active',
        `(() => document.querySelector('#nav-arenas')?.classList.contains('auth-nav-active') === true)()`,
        5000,
      );
      await page.waitForSelector('#campaigns-button-top', 10000);
      return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  throw new Error(`Could not open Arenas tab.\n\n${await page.bodyText()}`);
}

try {
  const user = await createTempUser({
    label: 'campaign-quiz',
    isPremium: true,
    appMode: 'GAME',
    gold: 2000,
  });

  const quizAnswers = [
    'Em quem eu estou me tornando',
    'Como eu construo quem quero ser',
    'Entender antes de agir',
    '21 dias ou mais',
    'Em movimento',
    'Nao sei por onde comecar de verdade',
    'Ter construido algo que vai durar alem do ciclo',
  ];

  let freeResultTitle = '';
  let fullResultTitle = '';

  await withBrowser({ baseUrl, debugPort: 9265 }, async (page) => {
    await page.login(user.email, user.password);
    checkpoints.push('user-login');

    await stabilizeRuntime(page);
    await dismissSplashIfPresent(page);
    await exitRestScreenIfPresent(page);
    await dismissScreenTipIfPresent(page);

    await navigateToCampaignStore(page);
    checkpoints.push('campaign-store-opened');

    await openQuiz(page);
    await page.waitFor(
      'free quiz mode',
      `(() => {
        const body = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
        return body.includes('PRIMEIRO QUIZ GRATUITO') || body.includes('FILTRO INICIAL: GRATUITAS');
      })()`,
      10000,
    );
    checkpoints.push('free-quiz-opened');

    await answerQuiz(page, quizAnswers);
    freeResultTitle = await readResultTitle(page);
    if (!freeResultTitle) {
      throw new Error(`Could not read free quiz result title.\n\n${await page.bodyText()}`);
    }
    checkpoints.push('free-result-generated');

    await page.waitFor(
      'free campaign added to library',
      `(() => {
        const body = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
        return body.includes('CAMPANHA ADICIONADA A SUA BIBLIOTECA');
      })()`,
      25000,
    );
    checkpoints.push('free-campaign-added-to-library');

    await closeQuiz(page);
    await openQuiz(page);
    await page.waitFor(
      'full quiz mode after free completion',
      `(() => {
        const body = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
        return (body.includes('RECOMENDACAO COMPLETA') || body.includes('CATALOGO COMPLETO')) && body.includes('PERGUNTA 1 DE 7');
      })()`,
      10000,
    );
    checkpoints.push('full-quiz-reopened-from-memory');

    await answerQuiz(page, quizAnswers);
    fullResultTitle = await readResultTitle(page);
    if (!fullResultTitle) {
      throw new Error(`Could not read full quiz result title.\n\n${await page.bodyText()}`);
    }
    checkpoints.push('full-result-generated');

    await page.clickText('Instalar Campanha');
    await page.waitFor(
      'quiz closed after full install',
      `(() => !(document.querySelector('.campaign-quiz-shell') instanceof HTMLElement))()`,
      30000,
    );
    checkpoints.push('full-campaign-installed');

    await openArenasTab(page);
    await page.clickSelector('#campaigns-button-top');
    await page.waitFor(
      'campaigns menu open',
      `(() => {
        const body = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
        return body.includes('CAMPANHAS') && body.includes('GUARDADAS') && (body.includes('PARA INICIAR') || body.includes('TODAS EM USO'));
      })()`,
      20000,
    );
    checkpoints.push('campaigns-menu-opened');

    await page.waitFor(
      'free campaign visible in library',
      `(() => {
        const body = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
        return body.includes(${JSON.stringify(normalizeForMatch(freeResultTitle))});
      })()`,
      15000,
    );
    checkpoints.push('free-campaign-visible-in-library');

    await page.waitFor(
      'full campaign visible in campaigns menu',
      `(() => {
        const body = (document.body?.innerText || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
        return body.includes(${JSON.stringify(normalizeForMatch(fullResultTitle))});
      })()`,
      15000,
    );
    checkpoints.push('full-campaign-visible-in-menu');
  });

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    result: {
      freeResultTitle,
      fullResultTitle,
    },
    fixture: {
      email: user.email,
      password: user.password,
    },
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    checkpoints,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
