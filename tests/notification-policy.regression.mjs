import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const clientPolicy = readFileSync(new URL('../constants/oracleNotificationPolicy.ts', import.meta.url), 'utf8');
const serverPolicy = readFileSync(new URL('../supabase/functions/web-push/index.ts', import.meta.url), 'utf8');

assert.match(clientPolicy, /const PUSH_PRIORITIES[^=]*= \['critical', 'actionable'\]/);
assert.match(serverPolicy, /const NOTIFICATION_PUSH_PRIORITIES[^=]*= \["critical", "actionable"\]/);
assert.doesNotMatch(clientPolicy, /PROFILE_VISIBILITY/);
assert.doesNotMatch(clientPolicy, /PROFILE_PUSH/);
assert.doesNotMatch(serverPolicy, /const PROFILE_PUSH/);

assert.match(clientPolicy, /const ORACLE_CHAT_NOTIFICATION_TYPES: NotificationType\[\] = \[\]/);
assert.match(clientPolicy, /void oracleMode;/);
assert.match(serverPolicy, /void activeMode;/);

for (const requiredType of ['direct_message', 'friend_request', 'clan_invite', 'partnership_invite']) {
  assert.match(clientPolicy, new RegExp(`${requiredType}: \\{[\\s\\S]*?priority: '(critical|actionable)'`));
  assert.match(serverPolicy, new RegExp(`${requiredType}: \\{ priority: \"(critical|actionable)\"`));
}

console.log('Notification policy regression: client and backend contracts agree.');
