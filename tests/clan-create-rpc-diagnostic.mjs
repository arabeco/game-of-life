import {
  createTempUser,
  getUserProfile,
} from './_smoke.supabase.mjs';

async function getClanMembership(client, userId) {
  const result = await client
    .from('clan_members')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (result.error) {
    throw new Error(`clan membership lookup failed: ${result.error.message}`);
  }

  return result.data || null;
}

try {
  const user = await createTempUser({ label: 'clan-rpc', isPremium: true, gold: 100 });
  const clanName = `RPC Grupo ${Date.now()}`;
  const response = await user.client.rpc('create_clan_with_gold', {
    p_name: clanName,
    p_icon: '🏛️',
    p_description: 'Diagnostico direto do RPC.',
    p_clan_type: 'Casual',
    p_recruitment_status: 'Aberto',
  });

  const profile = await getUserProfile(user.client, user.userId);
  const membership = await getClanMembership(user.client, user.userId);

  console.log(JSON.stringify({
    success: !response.error,
    email: user.email,
    clanName,
    rpcData: response.data || null,
    rpcError: response.error ? {
      message: response.error.message,
      code: response.error.code,
      details: response.error.details,
      hint: response.error.hint,
    } : null,
    remainingGold: profile.wallet?.gold || 0,
    membership,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
