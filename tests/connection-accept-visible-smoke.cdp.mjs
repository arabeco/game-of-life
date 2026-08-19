// Accepting a connection invite has to leave something on screen.
//
// Reported for both flows: the partnership "does not go to the actives, it just
// disappears", and the challenge "disappears from the active challenges tab after
// being accepted". Both turned out to be the same race in ConnectionsModal — two
// refreshes fired on accept with nothing ordering them, so the one that started
// before the link existed could resolve last and overwrite the list.
//
// The invite is seeded through the RPC because that half works. What is under test is
// the part a user performs: accepting from the live Connections screen and then seeing
// the connection listed. Targets ConnectionsModal, the screen that is actually
// mounted — the older social smoke tests drive RelationshipHubModal, which nothing
// mounts any more, which is why neither report was ever caught.

import { withBrowser } from './_smoke.browser.mjs';
import { DEFAULT_SMOKE_URL, createFriendship, createTempUser } from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;

// Only parceria is seeded here. A challenge invite goes through a different RPC —
// create_competition_invite, which requires a source arena — so it cannot be seeded in
// two lines like this one. Seeding it through create_relationship_link_invite instead
// produces an invite the accept path refuses with COMPETITION_SOURCE_ARENA_REQUIRED,
// which is a broken fixture rather than a finding about the app.
// Covering the challenge accept needs the arena flow that competition-race-smoke
// already drives through the UI.
const LINK_TYPES = [
  { linkType: 'parceria', label: 'partnership', debugPort: 9251 },
];

const openConnections = async (page, tab) => {
  await page.clickSelector('#nav-mundo');
  await page.waitForSelector('#links-button', 15000);
  await page.clickSelector('#links-button');
  await page.waitForSelector(`#connections-tab-${tab}`, 15000);
  await page.clickSelector(`#connections-tab-${tab}`);
};

const runCase = async ({ linkType, label, debugPort }, checkpoints) => {
  const inviter = await createTempUser({ label: `${label}-accept-a`, isPremium: false, gold: 150 });
  const joiner = await createTempUser({ label: `${label}-accept-b`, isPremium: false, gold: 150 });
  await createFriendship(inviter, joiner);
  checkpoints.push(`${label}:accounts-seeded`);

  const inviteResult = await inviter.client.rpc('create_relationship_link_invite', {
    p_recipient_id: joiner.userId,
    p_link_type: linkType,
  });
  if (inviteResult.error) {
    throw new Error(`Failed to create ${label} invite: ${inviteResult.error.message}`);
  }

  const inviteId = inviteResult.data?.invite?.id || inviteResult.data?.inviteId || inviteResult.data?.invite_id;
  if (!inviteId) {
    throw new Error(`Could not resolve the ${label} invite id.`);
  }
  checkpoints.push(`${label}:invite-created`);

  await withBrowser({ baseUrl, debugPort }, async (page) => {
    await page.login(joiner.email, joiner.password);
    await page.dismissBlockingRuntimeOverlays();
    await openConnections(page, linkType);
    checkpoints.push(`${label}:connections-open`);

    await page.waitForSelector(`#connections-invite-accept-${inviteId}`, 20000);
    checkpoints.push(`${label}:invite-visible`);

    await page.clickSelector(`#connections-invite-accept-${inviteId}`);
    checkpoints.push(`${label}:invite-accepted`);

    // The bug: the invite row goes away and nothing takes its place.
    await page.waitFor(
      `accepted ${label} listed as active`,
      `(() => {
        const list = document.querySelector('#connections-active-list');
        if (!list) return false;
        if (document.querySelector('#connections-active-empty')) return false;
        return Number(list.getAttribute('data-active-count') || 0) > 0;
      })()`,
      25000,
    );
    checkpoints.push(`${label}:listed-active`);

    await page.waitFor(
      `${label} card carries its type`,
      `Boolean(document.querySelector('[data-connection-link][data-link-type="${linkType}"]'))`,
      15000,
    );
    checkpoints.push(`${label}:card-typed`);
  });
};

const checkpoints = [];

try {
  for (const testCase of LINK_TYPES) {
    await runCase(testCase, checkpoints);
  }
  console.log(JSON.stringify({ success: true, checkpoints }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    checkpoints,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
