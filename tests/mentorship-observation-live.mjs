import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local', quiet: true });

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) throw new Error('Credenciais Supabase ausentes.');

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const password = `Glyph-Mentoria-${suffix}!`;
const mentorEmail = `mentor-${suffix}@gol.local`;
const pupilEmail = `orientado-${suffix}@gol.local`;
let mentorId = null;
let pupilId = null;
let linkId = null;
const arenaIds = [];

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const rpc = async (client, name, params) => {
  const { data, error } = await client.rpc(name, params);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data;
};

const expectRpcError = async (client, name, params, expectedMessage) => {
  const { error } = await client.rpc(name, params);
  assert(error && String(error.message).includes(expectedMessage), `${name} deveria falhar com ${expectedMessage}.`);
};

try {
  const { data: mentorAuth, error: mentorCreateError } = await admin.auth.admin.createUser({ email: mentorEmail, password, email_confirm: true });
  if (mentorCreateError) throw mentorCreateError;
  mentorId = mentorAuth.user.id;

  const { data: pupilAuth, error: pupilCreateError } = await admin.auth.admin.createUser({ email: pupilEmail, password, email_confirm: true });
  if (pupilCreateError) throw pupilCreateError;
  pupilId = pupilAuth.user.id;

  await new Promise(resolve => setTimeout(resolve, 300));
  const { error: profileError } = await admin.from('user_profiles').upsert([
    { id: mentorId, email: mentorEmail, nickname: `Mentor Teste ${suffix}`, wallet: { gold: 100, fragments: 0 }, gold: 100 },
    { id: pupilId, email: pupilEmail, nickname: `Orientado Teste ${suffix}`, wallet: { gold: 100, fragments: 0 }, gold: 100 },
  ], { onConflict: 'id' });
  if (profileError) throw profileError;

  const { data: arenas, error: arenasError } = await admin.from('arenas').insert([
    { user_id: pupilId, asset_id: 'saude', name: `Treino ${suffix}`, description: 'Arena temporaria', icon: 'T', is_archived: false },
    { user_id: pupilId, asset_id: 'trabalho-estudos', name: `Estudo ${suffix}`, description: 'Arena temporaria', icon: 'E', is_archived: false },
  ]).select('id,name');
  if (arenasError) throw arenasError;
  arenaIds.push(...arenas.map(arena => arena.id));

  const mentor = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const pupil = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: mentorLoginError } = await mentor.auth.signInWithPassword({ email: mentorEmail, password });
  if (mentorLoginError) throw mentorLoginError;
  const { error: pupilLoginError } = await pupil.auth.signInWithPassword({ email: pupilEmail, password });
  if (pupilLoginError) throw pupilLoginError;

  const invite = await rpc(mentor, 'create_relationship_link_invite', { p_recipient_id: pupilId, p_link_type: 'mentoria' });
  const accepted = await rpc(pupil, 'respond_relationship_link_invite', { p_invite_id: invite.invite.id, p_action: 'accept' });
  linkId = accepted?.link?.id;
  assert(linkId, 'A mentoria nao ficou ativa.');

  await expectRpcError(mentor, 'create_linked_relationship_arena', {
    p_relationship_link_id: linkId,
    p_asset_id: 'saude',
    p_name: 'Arena indevida',
    p_description: '',
    p_icon: 'X',
  }, 'MENTORSHIP_ARENA_CREATION_DISABLED');

  await expectRpcError(mentor, 'select_my_mentorship_arena', {
    p_relationship_link_id: linkId,
    p_arena_id: arenaIds[0],
  }, 'MENTORSHIP_PUPIL_REQUIRED');

  const firstSelection = await rpc(pupil, 'select_my_mentorship_arena', {
    p_relationship_link_id: linkId,
    p_arena_id: arenaIds[0],
  });
  assert(firstSelection.success && firstSelection.changed && firstSelection.new_gold === 50, 'Primeira arena nao debitou exatamente 50 de ouro.');

  const { data: mentorUpdateRows, error: mentorUpdateError } = await mentor
    .from('arenas')
    .update({ name: 'ALTERACAO PROIBIDA' })
    .eq('id', arenaIds[0])
    .select('id');
  assert(mentorUpdateError || !mentorUpdateRows?.length, 'Mentor conseguiu editar a arena do orientado.');

  const { error: mentorActionError } = await mentor.from('actions').insert({
    user_id: pupilId,
    arena_id: arenaIds[0],
    name: 'Acao proibida',
    icon: 'X',
    action_type: 'Livre',
    repetitions: 0,
  });
  assert(Boolean(mentorActionError), 'Mentor conseguiu criar uma acao para o orientado.');

  const secondSelection = await rpc(pupil, 'select_my_mentorship_arena', {
    p_relationship_link_id: linkId,
    p_arena_id: arenaIds[1],
  });
  assert(secondSelection.success && secondSelection.changed, 'Troca da arena acompanhada falhou.');

  const { data: pupilWallet, error: walletError } = await admin.from('user_profiles').select('wallet').eq('id', pupilId).single();
  if (walletError) throw walletError;
  assert(Number(pupilWallet.wallet?.gold) === 50, 'Trocar de arena cobrou ouro novamente.');

  await expectRpcError(mentor, 'delete_linked_relationship_arena', { p_arena_id: arenaIds[1] }, 'MENTORSHIP_PUPIL_REQUIRED');
  const unshared = await rpc(pupil, 'delete_linked_relationship_arena', { p_arena_id: arenaIds[1] });
  assert(unshared.success && unshared.arena_preserved, 'Retirada nao confirmou preservacao da arena.');

  const { data: preservedArena, error: preservedError } = await admin.from('arenas').select('id,name').eq('id', arenaIds[1]).single();
  if (preservedError) throw preservedError;
  assert(preservedArena.id === arenaIds[1], 'A arena foi apagada ao sair da mentoria.');

  const { count: remainingShares, error: shareError } = await admin.from('relationship_link_arenas').select('id', { count: 'exact', head: true }).eq('relationship_link_id', linkId);
  if (shareError) throw shareError;
  assert(remainingShares === 0, 'A arena continuou compartilhada depois da retirada.');

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'convite e aceite',
      'criacao antiga bloqueada',
      'mentor nao escolhe arena',
      'orientado escolhe arena propria por 50 ouro',
      'mentor nao edita arena',
      'mentor nao cria acao',
      'troca de arena sem nova cobranca',
      'mentor nao retira arena',
      'orientado retira compartilhamento',
      'arena e progresso preservados',
    ],
  }, null, 2));
} finally {
  if (linkId) await admin.from('relationship_link_arenas').delete().eq('relationship_link_id', linkId);
  if (mentorId || pupilId) {
    const ids = [mentorId, pupilId].filter(Boolean);
    await admin.from('notifications').delete().in('user_id', ids);
    await admin.from('relationship_links').delete().or(ids.flatMap(id => [`mentor_id.eq.${id}`, `pupil_id.eq.${id}`]).join(','));
    await admin.from('relationship_link_invites').delete().or(ids.flatMap(id => [`sender_id.eq.${id}`, `recipient_id.eq.${id}`]).join(','));
    await admin.from('friends').delete().or(ids.flatMap(id => [`user_id.eq.${id}`, `friend_id.eq.${id}`]).join(','));
  }
  if (arenaIds.length > 0) await admin.from('arenas').delete().in('id', arenaIds);
  if (mentorId) await admin.auth.admin.deleteUser(mentorId);
  if (pupilId) await admin.auth.admin.deleteUser(pupilId);
}

const cleanupIds = [mentorId, pupilId].filter(Boolean);
const [{ data: profiles }, { data: arenas }] = await Promise.all([
  admin.from('user_profiles').select('id').in('id', cleanupIds),
  admin.from('arenas').select('id').in('id', arenaIds),
]);
assert((profiles?.length || 0) + (arenas?.length || 0) === 0, 'A limpeza dos dados temporarios ficou incompleta.');
console.log(JSON.stringify({ cleanup: 'ok', temporaryRowsRemaining: 0 }));
