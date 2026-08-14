import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildToggledTaskSnapshot } from '../utils/taskMutationUtils.js';

const planner = readFileSync(new URL('../views/PlannerView.tsx', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../views/SettingsView.tsx', import.meta.url), 'utf8');
const taskDomain = readFileSync(new URL('../contexts/gameDomains/taskDomain.ts', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20260813193000_add_planner_simple_list_order.sql', import.meta.url), 'utf8');

assert.match(planner, /userProfile\.plannerViewMode === 'list'/);
assert.match(planner, /PlannerSimpleList/);
assert.match(planner, /PlannerSimpleWeek/);
assert.match(planner, /data-testid="planner-simple-week"/);
assert.match(planner, /viewMode === 'week'/);
assert.match(planner, /setTaskExecutionOrder\(id, \(index \+ 1\) \* 100\)/);
assert.doesNotMatch(planner, /planner_execution_queue_v1/);
assert.doesNotMatch(planner, /planner-mode-selector/);
assert.doesNotMatch(planner, /label: 'Execucao'/);

assert.match(settings, /planner-view-mode-toggle/);
assert.match(settings, /role="switch"/);
assert.match(settings, /plannerViewMode=\{userProfile\.plannerViewMode \|\| 'schedule'\}/);

const executionOrderFunction = taskDomain.slice(
  taskDomain.indexOf('const setTaskExecutionOrder'),
  taskDomain.indexOf('const rescheduleTask'),
);
assert.match(executionOrderFunction, /execution_order/);
assert.doesNotMatch(executionOrderFunction, /start_time|startTime/);
assert.match(taskDomain, /executionOrder: null/);

assert.match(migration, /add column if not exists execution_order integer/);
assert.match(migration, /add column if not exists planner_view_mode text not null default 'schedule'/);
assert.match(migration, /check \(planner_view_mode in \('schedule', 'list'\)\)/);

const completedWithoutSchedule = buildToggledTaskSnapshot({
  id: 'task-1',
  actionId: 'action-1',
  date: '2026-08-13',
  startTime: -1,
  duration: 30,
  completed: false,
  executionOrder: 100,
}, 30, 18 * 60);
assert.equal(completedWithoutSchedule.completed, true);
assert.equal(completedWithoutSchedule.startTime, 17 * 60 + 30);
assert.equal(completedWithoutSchedule.executionOrder, 100);

const reopened = buildToggledTaskSnapshot(completedWithoutSchedule, 30, 19 * 60);
assert.equal(reopened.completed, false);
assert.equal(reopened.startTime, 17 * 60 + 30);
assert.equal(reopened.executionOrder, 100);

console.log('Planner simple list regression: order is persistent and independent from schedule.');
