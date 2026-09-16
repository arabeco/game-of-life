import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const context = fs.readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const taskDomain = fs.readFileSync(new URL('../contexts/gameDomains/taskDomain.ts', import.meta.url), 'utf8');
assert.doesNotMatch(taskDomain, /addFeedEvent/, 'Gameplay must not have access to publication');
assert.doesNotMatch(context, /addFeedEvent\(\{/, 'GameContext must not auto-publish achievements');

// Exercise the actual publisher with a synthetic database, never the live feed.
const start = context.indexOf('    const feedPublicationsInFlight =');
const end = context.indexOf('    const openChest =', start);
assert.ok(start > 0 && end > start);
const javascript = ts.transpileModule(context.slice(start, end), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
function setup({ visibility = 'friends', userId = 'qa-id', save = async () => ({data: {id: 'saved-id'}, error: null}) } = {}) {
    const state = { calls: 0, feed: [], toasts: [] };
    const supabase = { from: () => ({ insert: () => {
        state.calls++;
        return { select: () => ({ single: save }) };
    } }) };
    const factory = new Function('useRef', 'userProfile', 'getSupabaseUserId', 'isUuid', 'showToast', 'supabase', 'mapFeedEventFromDbRow', 'setFeed', 'console', javascript + '\nreturn addFeedEvent;');
    state.publish = factory(value => ({current:value}), {featsVisibility:visibility}, () => userId, Boolean,
        (...args) => state.toasts.push(args), supabase, row => row,
        update => {state.feed = update(state.feed);}, {error: () => {}});
    return state;
}
const event = {type: 'REPORT_COMPLETED', content: {title: 'QA day'}};
for (const options of [{visibility:'nobody'}, {userId:null}]) {
    const state = setup(options);
    assert.equal(await state.publish(event), false);
    assert.equal(state.calls, 0);
    assert.equal(state.feed.length, 0);
}
for (const save of [async () => ({error: new Error('offline')}), async () => {throw Error('network');}, async () => ({data:null,error:null})]) {
    const state = setup({save});
    assert.equal(await state.publish(event), false);
    assert.equal(state.feed.length, 0, 'No local phantom post on failure');
    assert.equal(state.toasts.at(-1)[1], 'error');
}
let finish;
const pending = setup({save: () => new Promise(resolve => {finish = resolve;})});
const first = pending.publish(event);
assert.equal(await pending.publish(event), false, 'Concurrent click must not submit again');
assert.equal(pending.calls, 1);
assert.equal(pending.feed.length, 0, 'Wait for database confirmation');
finish({data:{id:'confirmed'},error:null});
assert.equal(await first, true);
assert.deepEqual(pending.feed, [{id:'confirmed'}]);
for (const file of ['components/DailyPanelContent.tsx', 'components/AchievementModal.tsx', 'views/ReportsView.tsx']) {
    const source = fs.readFileSync(new URL('../'+file, import.meta.url), 'utf8');
    assert.match(source, /const published = await addFeedEvent/);
    assert.match(source, /if \(published\)/, 'Success must depend on confirmation: '+file);
}
console.log('PASS manual-only feed: privacy, auth, failed/absent confirmation, network rejection, concurrent click and confirmed publication. Synthetic backend only.');
