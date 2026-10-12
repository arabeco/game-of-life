import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import ts from 'typescript';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const db = new PGlite();
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table store_prices(id text primary key, kind text, gold_price int, duration_hours int, multiplier numeric);
    insert into store_prices values ('premium_30d','premium',200,null,null),('platinum_30d','premium',500,null,null);
    create table user_profiles (
      id uuid primary key, is_premium boolean default false, premium_expires_at timestamptz,
      subscription_tier text, premium_reward_pending boolean, premium_reward_shown_at timestamptz,
      premium_reward_payload jsonb, legacy_projection_scene_credits int default 0,
      campaign_quiz_free_credits int default 0, campaign_quiz_medium_credits int default 0,
      wallet jsonb default '{"gold":1000}', role text default 'user',
      chests jsonb default '{"Raro": 3}'
    );
    create table user_purchases (
      user_id uuid, payment_id text unique, gold_amount int, amount_paid numeric,
      status text, metadata jsonb
    );
    create function grant_chest(uuid, text) returns void language plpgsql as $$
      begin raise exception 'Membership must not grant a chest'; end;
    $$;
  `);
  await db.exec(read('supabase/migrations/20261011010000_membership_delivery_parity.sql'));
  for (const [i, tier] of ['premium', 'platinum'].entries()) {
    const id = `00000000-0000-0000-0000-00000000000${i + 1}`;
    await db.query('insert into user_profiles(id) values ($1)', [id]);
    const pay = key => db.query('select process_approved_membership_payment($1,$2,$3,20) as result', [id, key, tier]);
    const profile = async () => (await db.query('select * from user_profiles where id=$1', [id])).rows[0];
    assert.equal((await pay(`${tier}-1`)).rows[0].result.success, true);
    const first = await profile();
    assert.equal(first.is_premium, true);
    assert.equal(first.subscription_tier, tier);
    assert.deepEqual(first.chests, { Raro: 3 });
    assert.doesNotMatch(JSON.stringify(first.premium_reward_payload), /baú|chest|temporada/i);
    assert.equal(first.campaign_quiz_free_credits, 0);
    assert.equal(first.campaign_quiz_medium_credits, tier === 'platinum' ? 1 : 0);
    assert.equal(first.legacy_projection_scene_credits, 0);
    assert.equal((await pay(`${tier}-1`)).rows[0].result.success, false);
    assert.deepEqual(await profile(), first, 'Payment replay must not duplicate rewards');
    await pay(`${tier}-2`);
    const renewed = await profile();
    assert.deepEqual(renewed.chests, first.chests);
    assert.equal(new Date(renewed.premium_expires_at) - new Date(first.premium_expires_at), 30 * 86400000);
    assert.equal(renewed.campaign_quiz_free_credits, first.campaign_quiz_free_credits * 2);
    assert.equal(renewed.campaign_quiz_medium_credits, first.campaign_quiz_medium_credits * 2);
  }
  const rights = (await db.query(`select
    has_function_privilege('authenticated', 'process_approved_membership_payment(uuid,text,text,numeric,jsonb)', 'execute') as client,
    has_function_privilege('service_role', 'process_approved_membership_payment(uuid,text,text,numeric,jsonb)', 'execute') as backend`)).rows[0];
  assert.deepEqual(rights, { client: false, backend: true });

  // Install the actual privilege guard: gold purchase must work with it enabled.
  const guardSource = read('supabase/migrations/20260914210000_guard_profile_privilege_escalation.sql');
  await db.exec(guardSource.slice(guardSource.indexOf('create or replace function public.quem_chama_role'), guardSource.indexOf('create or replace function public.guard_user_profile_insert_grants')));
  const goldUser = '00000000-0000-0000-0000-000000000009';
  await db.query('insert into user_profiles(id) values ($1)', [goldUser]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claim.role','authenticated',false)", [goldUser]);
  const goldPay = (id, product='premium_30d') => db.query('select buy_membership_with_gold($1,$2) as result', [product,id]);
  const req1='10000000-0000-0000-0000-000000000001';
  const firstGold=(await goldPay(req1)).rows[0].result;
  assert.equal(firstGold.charged,200);
  assert.equal(firstGold.membership.isPremium,true);
  assert.equal(firstGold.membership.subscriptionTier,'premium');
  assert.equal(firstGold.new_gold,800);
  const duplicateGold=(await goldPay(req1)).rows[0].result;
  assert.equal(duplicateGold.new_gold,800);
  assert.equal(duplicateGold.already_processed,true);
  assert.equal(duplicateGold.membership.premiumExpiresAt, firstGold.membership.premiumExpiresAt);
  assert.equal((await db.query("select current_setting('request.jwt.claim.role') as role")).rows[0].role,'authenticated');
  await db.query("update user_profiles set is_premium=false, subscription_tier='platinum' where id=$1", [goldUser]);
  assert.equal((await db.query('select subscription_tier from user_profiles where id=$1',[goldUser])).rows[0].subscription_tier,'premium');
  // A failure after charging must roll the entire transaction back.
  await db.exec(`create function reject_activation() returns trigger language plpgsql as $$ begin raise exception 'SIMULATED_DELIVERY_FAILURE'; end $$;
    create trigger reject_activation before insert on user_purchases for each row execute function reject_activation();`);
  await assert.rejects(goldPay('10000000-0000-0000-0000-000000000002'), /SIMULATED_DELIVERY_FAILURE/);
  assert.equal((await db.query('select wallet from user_profiles where id=$1',[goldUser])).rows[0].wallet.gold,800);
  assert.equal((await db.query("select current_setting('request.jwt.claim.role') as role")).rows[0].role,'authenticated');
  await db.exec('drop trigger reject_activation on user_purchases');
  // Server-owned renewal discount, regardless of any client price argument.
  await db.exec("select set_config('request.jwt.claim.role','service_role',false)");
  await db.query("update user_profiles set premium_expires_at=now()+interval '2 days' where id=$1",[goldUser]);
  await db.exec("select set_config('request.jwt.claim.role','authenticated',false)");
  const renewal=(await goldPay('10000000-0000-0000-0000-000000000003')).rows[0].result;
  assert.equal(renewal.charged,180);
  assert.equal(renewal.new_gold,620);
  const legacy=(await db.query("select buy_store_item('platinum_30d',1,'premium') as result")).rows[0].result;
  assert.equal(legacy.charged,500);
  assert.equal(legacy.membership.subscriptionTier,'platinum');
  assert.equal(legacy.membership.campaignQuizMediumCredits,1);
  assert.equal(legacy.new_gold,120);
  await assert.rejects(goldPay('10000000-0000-0000-0000-000000000004'), /ACTIVE_PLATINUM_REQUIRES_PLATINUM_RENEWAL/);
  await assert.rejects(goldPay('10000000-0000-0000-0000-000000000005','platinum_30d'), /Insufficient gold/);
} finally { await db.close(); }

const context = read('contexts/GameContext.tsx');
assert.ok(context.includes("supabase.rpc('buy_membership_with_gold'"));
assert.doesNotMatch(context, /unlockPremiumPack|unlockPlatinumPack/);
const storage = new Map();
const localStorage = {
  getItem: key => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
const loadAttempts = () => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(read('utils/membershipPurchase.ts'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, crypto: webcrypto, localStorage });
  return exports;
};
const attempts = loadAttempts();
const firstAttempt = attempts.beginMembershipPurchase('alice', 'premium_30d');
assert.equal(loadAttempts().beginMembershipPurchase('alice', 'premium_30d'), firstAttempt, 'Reload must reuse the payment attempt');
assert.notEqual(attempts.beginMembershipPurchase('bob', 'premium_30d'), firstAttempt);
attempts.finishMembershipPurchase('alice', 'premium_30d');
assert.notEqual(loadAttempts().beginMembershipPurchase('alice', 'premium_30d'), firstAttempt, 'A confirmed purchase must allow a new renewal');
console.log('PASS: current paid memberships and atomic gold renewals, no chests, no duplicate debit, protected profile');
