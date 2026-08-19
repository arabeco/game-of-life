import { createTempUser } from './_smoke.supabase.mjs';

async function main() {
  const user = await createTempUser({
    label: 'grant-chest-rpc',
    isPremium: false,
    gold: 0,
    fragments: 0,
  });

  const rpc = await user.client.rpc('grant_chest', {
    p_user_id: user.userId,
    p_chest_type: 'Comum',
  });

  const profile = await user.client
    .from('user_profiles')
    .select('id,chests')
    .eq('id', user.userId)
    .maybeSingle();

  const chestRows = await user.client
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
    rpcData: rpc.data ?? null,
    profileError: profile.error ? {
      message: profile.error.message,
      code: profile.error.code,
    } : null,
    profile: profile.data ?? null,
    chestRowsError: chestRows.error ? {
      message: chestRows.error.message,
      code: chestRows.error.code,
    } : null,
    chestRowsCount: Array.isArray(chestRows.data) ? chestRows.data.length : null,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(1);
});
