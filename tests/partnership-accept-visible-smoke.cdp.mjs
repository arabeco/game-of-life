// Reproduces the reported bug: after account B accepts a partnership invite, the
// partnership "does not go to the actives, it just disappears".
//
// The invite is seeded through the RPC because that half is known to work — three
// active links already exist in the database. What is under test is the part a user
// actually performs: accepting from the live Connections screen and then seeing the
// partnership listed.
//
// Targets ConnectionsModal, the screen that is really mounted. The older social
// smoke tests drive RelationshipHubModal, which nothing mounts any more, so they
// never exercised this path.

import { withBrowser } from './_smoke.browser.mjs';
import { DEFAULT_SMOKE_URL, createFriendship, createTempUser } from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const checkpoints = [];

const openConnections = async (page, tab) => {
  await page.clickSelector('#nav-mundo');
  await page.waitForSelector('#links-button', 15000);
  await page.clickSelector('#links-button');
  await page.waitForSelector(`#connections-tab-${tab}`, 15000);
  await page.clickSelector(`#connections-tab-${tab}`);
};

let inviter;
let joiner;

try {
  inviter = await createTempUser({ label: 'partnership-accept-a', isPremium: false, appMode: 'GAME', gold: 150 });
  joiner = await createTempUser({ label: 'partnership-accept-b', isPremium: false, appMode: 'GAME', gold: 150 });
  await createFriendship(inviter, joiner);
  checkpoints.push('accounts-seeded');

  const inviteResult = await inviter.client.rpc('create_relationship_link_invite', {
    p_recipient_id: joiner.userId,
    p_link_type: 'parceria',
  });
  if (inviteResult.error) {
    throw new Error(`Failed to create partnership invite: ${inviteResult.error.message}`);
  }

  const inviteId = inviteResult.data?.invite?.id || inviteResult.data?.inviteId || inviteResult.data?.invite_id;
  if (!inviteId) {
    throw new Error('Could not resolve the partnership invite id.');
  }
  checkpoints.push('invite-created');

  await withBrowser({ baseUrl, debugPort: 9251 }, async (page) => {
    await page.login(joiner.email, joiner.password);
    checkpoints.push('joiner-login');

    await page.dismissBlockingRuntimeOverlays();
    await openConnections(page, 'parceria');
    checkpoints.push('connections-parceria-open');

    await page.waitForSelector(`#connections-invite-accept-${inviteId}`, 20000);
    checkpoints.push('invite-visible');

    await page.clickSelector(`#connections-invite-accept-${inviteId}`);
    checkpoints.push('invite-accepted');

    // The bug: the invite row goes away and nothing takes its place. The active
    // list must render with at least one entry, and the empty state must be gone.
    await page.waitFor(
      'accepted partnership listed as active',
      `(() => {
        const list = document.querySelector('#connections-active-list');
        if (!list) return false;
        if (document.querySelector('#connections-active-empty')) return false;
        return Number(list.getAttribute('data-active-count') || 0) > 0;
      })()`,
      25000,
    );
    checkpoints.push('partnership-listed-active');

    await page.waitFor(
      'partnership card carries the parceria type',
      `Boolean(document.querySelector('[data-connection-link][data-link-type="parceria"]'))`,
      15000,
    );
    checkpoints.push('partnership-card-typed');
  });

  console.log(JSON.stringify({ success: true, checkpoints }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    checkpoints,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
