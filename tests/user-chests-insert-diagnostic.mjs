import { createTempUser } from './_smoke.supabase.mjs';

try {
  const user = await createTempUser({ label: 'user-chests-insert', isPremium: false, appMode: 'GAME', gold: 0 });

  const insert = await user.client.from('user_chests').insert({
    user_id: user.userId,
    chest_type: 'Comum',
    is_opened: false,
    earned_at: new Date().toISOString(),
  });

  console.log(JSON.stringify({
    success: !insert.error,
    email: user.email,
    userId: user.userId,
    error: insert.error ? {
      message: insert.error.message,
      code: insert.error.code,
      details: insert.error.details,
      hint: insert.error.hint,
    } : null,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
