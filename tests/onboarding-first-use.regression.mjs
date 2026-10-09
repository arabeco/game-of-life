import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveOnboardingResume, loadOnboardingProgress, saveOnboardingProgress, clearOnboardingProgress } from '../utils/onboardingProgress.ts';
import { completedTutorialFlags } from '../utils/tutorialCompletion.ts';
import { hasSeenScreenIntroTip, markScreenIntroTipSeen, areScreenIntroTipsEnabled, setScreenIntroTipsEnabled } from '../utils/screenIntroTips.ts';

const storage = new Map();
globalThis.localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) };
globalThis.window = { localStorage };
const arena = { id: 'arena-1' }, action = { id: 'action-1', arenaId: arena.id };
const progress = { stepId: 'action-save', arenaId: arena.id, actionId: null, purpose: 'organizar', missionIds: [] };
saveOnboardingProgress('alice', progress);
assert.deepEqual(loadOnboardingProgress('alice'), progress);
assert.equal(loadOnboardingProgress('bob'), null, 'progress must be scoped to the account');
assert.equal(resolveOnboardingResume(progress, [arena], []).stepId, 'action-entry', 'reopen an unfinished form');
assert.equal(resolveOnboardingResume(progress, [arena], [action]).stepId, 'planner-hold', 'saved action must not be duplicated after interrupted save');
assert.equal(resolveOnboardingResume({...progress, stepId:'arena-save'}, [arena], []).stepId, 'action-entry');
assert.equal(resolveOnboardingResume({...progress, stepId:'planner-undo'}, [], []).stepId, 'arena-entry', 'deleted entities cannot leave a missing target');
assert.equal(resolveOnboardingResume({...progress, stepId:'missions'}, [arena], [action]).stepId, 'missions');
assert.equal(resolveOnboardingResume(null, [], []).stepId, 'purpose');
clearOnboardingProgress('alice');
assert.equal(loadOnboardingProgress('alice'), null);

let flags = ['unrelated'];
for (const id of [2,4,1,3]) {
  const result = completedTutorialFlags(flags, id, [1,2,3,4], 'done');
  flags = result.flags;
  assert.equal(result.allCompleted, id === 3);
}
assert.ok(flags.includes('done') && flags.includes('unrelated'));
assert.deepEqual(completedTutorialFlags(flags, 3, [1,2,3,4], 'done').flags, flags);
markScreenIntroTipSeen('alice', 'planner');
assert.equal(hasSeenScreenIntroTip('alice', 'planner'), true);
assert.equal(hasSeenScreenIntroTip('alice', 'arenas'), false);
assert.equal(hasSeenScreenIntroTip('bob', 'planner'), false);
setScreenIntroTipsEnabled('alice', false);
assert.equal(areScreenIntroTipsEnabled('alice'), false);
assert.equal(areScreenIntroTipsEnabled('bob'), true);
setScreenIntroTipsEnabled('alice', true);
assert.equal(hasSeenScreenIntroTip('alice', 'planner'), true, 'relighting does not erase acknowledged tips');

const read = p => readFileSync(new URL('../'+p, import.meta.url), 'utf8');
const onboarding = read('components/FirstUseOnboardingOverlay.tsx');
assert.doesNotMatch(onboarding, /id: 'cycle-(entry|date|save)'/);
assert.match(onboarding, /toque e segure/);
assert.match(onboarding, /arraste até o horário/);
assert.match(onboarding, /shouldIgnoreGuideKeyboard\(event\)/);
const app = read('components/AuthenticatedApp.tsx');
assert.doesNotMatch(app.slice(app.indexOf('suppressScreenIntroTips={')), /onboardingShownInSession \|\|/);
assert.match(app, /suppressScreenIntroTips \|\| isTutorialActive/);
assert.match(read('components/OracleTutorialOverlay.tsx'), /onClick=\{\(\) => endTutorial\(false\)\}/);
const cycle = read('views/NewCycleSetupView.tsx');
assert.match(cycle, /const createdCycle = await startNewCycle/);
assert.ok(cycle.indexOf('if (!createdCycle) return;') < cycle.indexOf('new CustomEvent(FIRST_USE_ONBOARDING_EVENTS.cycleCreated)'));
console.log('PASS onboarding: resume, entity reuse, account isolation, four-section completion, tips and cycle confirmation.');
