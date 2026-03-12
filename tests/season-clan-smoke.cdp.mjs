import { withBrowser } from './_smoke.browser.mjs';
import {
  DEFAULT_SMOKE_URL,
  setupClanFixture,
  getClanMissionProgress,
  getClanMissionParticipant,
  findArenaByName,
  findActionByName,
  setClanMissionProgress,
  insertCompletedTask,
  getUserProfile,
  waitForDb,
} from './_smoke.supabase.mjs';

const baseUrl = process.env.SMOKE_URL || DEFAULT_SMOKE_URL;
const checkpoints = [];

try {
  const fixture = await setupClanFixture({ label: 'season-clan' });
  const { leader, member, clan, mission } = fixture;
  const debugPortLeader = 9230;
  const debugPortMember = 9231;

  await withBrowser({ baseUrl, debugPort: debugPortLeader }, async (page) => {
    await page.login(leader.email, leader.password);
    checkpoints.push('leader-login');

    await page.clickSelector('#nav-mundo');
    await page.waitForSelector('#clan-sanctuary', 20000);
    await page.clickSelector('#clan-sanctuary button');
    await page.waitForSelector('#clan-tab-quests', 15000);
    await page.clickSelector('#clan-tab-quests');
    await page.waitForSelector(`#clan-season-quest-card-${mission.id}`, 15000);
    await page.clickSelector(`#clan-season-quest-card-${mission.id}`);
    await page.waitForSelector(`#clan-quest-activate-${mission.id}`, 15000);
    await page.clickSelector(`#clan-quest-activate-${mission.id}`);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    checkpoints.push('leader-activated-clan-quest');
  });

  const activatedProgress = await waitForDb(
    'clan mission activation persistence',
    () => getClanMissionProgress(leader.client, { clanId: clan.id, missionId: mission.id }),
  );

  checkpoints.push('activation-persisted');

  await withBrowser({ baseUrl, debugPort: debugPortMember }, async (page) => {
    await page.login(member.email, member.password);
    checkpoints.push('member-login');

    await page.clickSelector('#nav-mundo');
    await page.waitForSelector('#clan-sanctuary', 20000);
    await page.clickSelector('#clan-sanctuary button');
    await page.waitForSelector('#clan-tab-quests', 15000);
    await page.clickSelector('#clan-tab-quests');
    await page.waitForSelector(`#clan-season-quest-card-${mission.id}`, 15000);
    await page.clickSelector(`#clan-season-quest-card-${mission.id}`);
    await page.waitForSelector(`#clan-quest-join-${mission.id}`, 15000);
    await page.clickSelector(`#clan-quest-join-${mission.id}`);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    checkpoints.push('member-joined-clan-quest');
  });

  const participant = await waitForDb(
    'clan mission participant persistence',
    () => getClanMissionParticipant(member.client, {
      clanId: clan.id,
      missionId: mission.id,
      userId: member.userId,
    }),
  );

  const missionArena = await waitForDb(
    `mission arena "${mission.title}" creation`,
    () => findArenaByName(member.client, { userId: member.userId, name: mission.title }),
  );

  const missionAction = await waitForDb(
    `mission action "${mission.action_name}" creation`,
    () => findActionByName(member.client, { userId: member.userId, name: mission.action_name }),
  );

  checkpoints.push('member-action-and-arena-created');

  await setClanMissionProgress(leader.client, {
    clanId: clan.id,
    missionId: mission.id,
    targetValue: activatedProgress.target_value,
    currentValue: activatedProgress.target_value,
  });

  await insertCompletedTask(member.client, {
    userId: member.userId,
    actionId: missionAction.id,
    date: new Date().toISOString().slice(0, 10),
    duration: missionAction.duration || 60,
    startTime: 540,
  });

  checkpoints.push('mission-progress-primed');

  await withBrowser({ baseUrl, debugPort: debugPortMember + 1 }, async (page) => {
    await page.login(member.email, member.password);
    checkpoints.push('member-relogin-for-claim');

    await page.clickSelector('#nav-mundo');
    await page.waitForSelector('#clan-sanctuary', 20000);
    await page.clickSelector('#clan-sanctuary button');
    await page.waitForSelector('#clan-tab-quests', 15000);
    await page.clickSelector('#clan-tab-quests');
    await page.waitForSelector(`#clan-season-quest-card-${mission.id}`, 15000);
    await page.clickSelector(`#clan-season-quest-card-${mission.id}`);
    await page.waitForSelector(`#clan-quest-claim-${mission.id}`, 15000);
    await page.clickSelector(`#clan-quest-claim-${mission.id}`);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    checkpoints.push('member-claimed-clan-quest');
  });

  const memberProfile = await getUserProfile(member.client, member.userId);
  if (!Array.isArray(memberProfile.completed_season_missions) || !memberProfile.completed_season_missions.includes(mission.id)) {
    throw new Error('Claim did not persist the completed season mission flag for the member.');
  }

  checkpoints.push('claim-persisted');

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      clanId: clan.id,
      missionId: mission.id,
      leaderEmail: leader.email,
      memberEmail: member.email,
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
