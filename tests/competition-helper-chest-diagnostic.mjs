import { createTempUser } from './_smoke.supabase.mjs';

async function main() {
  const user = await createTempUser({
    label: 'competition-helper-chest',
    isPremium: false,
    gold: 0,
    fragments: 0,
  });

  const rpc = await user.client.rpc('_competition_grant_chest', {
    p_user_id: user.userId,
    p_chest_type: 'Comum',
  });

  const chests = await user.client
    .from('user_chests')
    .select('user_id,chest_type,is_opened')
    .eq('user_id', user.userId);

  console.log(JSON.stringify({
    success: !rpc.error,
    rpcError: rpc.error ? {
      message: rpc.error.message,
      code: rpc.error.code,
      details: rpc.error.details,
      hint: rpc.error.hint,
    } : null,
    chestRowsCount: Array.isArray(chests.data) ? chests.data.length : null,
    chestRowsError: chests.error ? {
      message: chests.error.message,
      code: chests.error.code,
    } : null,
    userId: user.userId,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(1);
});
