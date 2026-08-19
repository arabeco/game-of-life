import { withBrowser } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  createTempUser,
  getUserProfile,
  waitForDb,
} from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const checkpoints = [];

async function getClanByName(client, name) {
  const result = await client
    .from('clans')
    .select('*')
    .eq('name', name)
    .maybeSingle();

  if (result.error) {
    throw new Error(`clan lookup failed: ${result.error.message}`);
  }

  return result.data || null;
}

async function getClanMembership(client, userId) {
  const result = await client
    .from('clan_members')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (result.error) {
    throw new Error(`clan membership lookup failed: ${result.error.message}`);
  }

  return result.data || null;
}

try {
  const richUser = await createTempUser({ label: 'clan-create-rich', isPremium: true, gold: 100 });
  const poorUser = await createTempUser({ label: 'clan-create-poor', isPremium: false, gold: 40 });
  const clanName = `Smoke Grupo ${Date.now()}`;

  await withBrowser({ baseUrl, debugPort: 9244 }, async (page) => {
    await page.login(poorUser.email, poorUser.password);
    checkpoints.push('poor-user-login');

    await page.clickSelector('#nav-mundo');
    await page.waitFor('create group entry', `(() => Array.from(document.querySelectorAll('button')).some((node) => (node.innerText || '').toLowerCase().includes('criar grupo')))()`, 20000);
    await page.clickText('Criar Grupo');
    await page.waitForSelector('#create-clan-name-input', 15000);
    await page.setInputValue('#create-clan-name-input', `Sem Saldo ${Date.now()}`);
    await page.waitFor(
      'group submit button with coin microcopy',
      `(() => {
        const button = document.querySelector('#create-clan-submit-button');
        if (!(button instanceof HTMLElement)) return false;
        const text = (button.innerText || button.textContent || '').toLowerCase();
        return text.includes('100') && !text.includes('ouro');
      })()`,
      15000,
    );
    await page.clickSelector('#create-clan-submit-button');
    await page.waitFor(
      'gold shortage prompt for clan creation',
      `(() => {
        const body = document.body?.innerText || '';
        return body.includes('Saldo insuficiente') && body.toLowerCase().includes('recarga');
      })()`,
      15000,
    );
    checkpoints.push('poor-user-shortage-prompted');
    await page.clickText('DEPOIS');
  });

  await withBrowser({ baseUrl, debugPort: 9245 }, async (page) => {
    await page.login(richUser.email, richUser.password);
    checkpoints.push('rich-user-login');

    await page.clickSelector('#nav-mundo');
    await page.waitFor('create group entry', `(() => Array.from(document.querySelectorAll('button')).some((node) => (node.innerText || '').toLowerCase().includes('criar grupo')))()`, 20000);
    await page.clickText('Criar Grupo');
    await page.waitForSelector('#create-clan-name-input', 15000);
    await page.setInputValue('#create-clan-name-input', clanName);
    await page.setInputValue('#create-clan-description-input', 'Grupo de smoke criado pela UI para validar confirmacao e debito.');
    await page.waitFor(
      'group submit button with icon and numeric cost',
      `(() => {
        const button = document.querySelector('#create-clan-submit-button');
        if (!(button instanceof HTMLElement)) return false;
        const text = (button.innerText || button.textContent || '').toLowerCase();
        return text.includes('criar') && text.includes('100') && !text.includes('ouro');
      })()`,
      15000,
    );
    checkpoints.push('group-cost-button-verified');
    await page.clickSelector('#create-clan-submit-button');
    await page.waitFor(
      'group debit confirmation modal',
      `(() => {
        const body = document.body?.innerText || '';
        return body.toLowerCase().includes('confirmar criacao')
          && body.toLowerCase().includes('debitar 100 ouro');
      })()`,
      15000,
    );
    checkpoints.push('group-confirmation-modal-open');
    await page.waitFor(
      'confirmation submit button',
      `(() => Array.from(document.querySelectorAll('button')).some((node) => (node.innerText || node.textContent || '').toLowerCase().includes('criar · 100')))()`,
      10000,
    );
    await page.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find((node) => (node.innerText || node.textContent || '').toLowerCase().includes('criar · 100'));
      if (!(target instanceof HTMLElement)) return false;
      target.click();
      return true;
    })()`);
    await page.waitForSelector('#clan-sanctuary', 20000);
    await page.waitFor(
      'new clan visible in sanctuary',
      `(() => {
        const body = (document.body?.innerText || '').toLowerCase();
        return body.includes(${JSON.stringify(clanName.toLowerCase())});
      })()`,
      15000,
    );
    checkpoints.push('group-created-from-ui');
  });

  const createdClan = await waitForDb(
    'clan row persistence',
    () => getClanByName(richUser.client, clanName),
  );

  const membership = await waitForDb(
    'clan membership persistence',
    () => getClanMembership(richUser.client, richUser.userId),
  );

  const richProfile = await getUserProfile(richUser.client, richUser.userId);
  if (Number(richProfile.wallet?.gold || 0) !== 0) {
    throw new Error(`Expected rich user gold to be 0 after group creation, got ${Number(richProfile.wallet?.gold || 0)}.`);
  }

  checkpoints.push('group-persisted');
  checkpoints.push('group-gold-debited');

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      richEmail: richUser.email,
      poorEmail: poorUser.email,
      clanId: createdClan.id,
      membershipRole: membership.role,
      remainingGold: richProfile.wallet?.gold || 0,
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
