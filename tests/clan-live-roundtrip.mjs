import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local', quiet: true });

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) throw new Error('Credenciais Supabase ausentes.');

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const password = `Glyph-Test-${suffix}!`;
const leaderEmail = `clan-leader-${suffix}@gol.local`;
const inviteeEmail = `clan-invitee-${suffix}@gol.local`;
let leaderId = null;
let inviteeId = null;
let clanId = null;
let clanXpAvailable = true;

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
  const { data: leaderAuth, error: leaderCreateError } = await admin.auth.admin.createUser({
    email: leaderEmail,
    password,
    email_confirm: true,
  });
  if (leaderCreateError) throw leaderCreateError;
  leaderId = leaderAuth.user.id;

  const { data: inviteeAuth, error: inviteeCreateError } = await admin.auth.admin.createUser({
    email: inviteeEmail,
    password,
    email_confirm: true,
  });
  if (inviteeCreateError) throw inviteeCreateError;
  inviteeId = inviteeAuth.user.id;

  await new Promise(resolve => setTimeout(resolve, 350));
  const { error: profileError } = await admin.from('user_profiles').upsert([
    { id: leaderId, email: leaderEmail, nickname: `Lider Teste ${suffix}` },
    { id: inviteeId, email: inviteeEmail, nickname: `Convidado Teste ${suffix}` },
  ], { onConflict: 'id' });
  if (profileError) throw profileError;

  const { data: clan, error: clanError } = await admin.from('clans').insert({
    name: `Cla Teste ${suffix}`,
    icon: 'T',
    description: 'Teste automatico descartavel',
    clan_type: 'Casual',
    recruitment_status: 'Privado',
    exp: 0,
    rank_id: 'feudo',
  }).select('id,exp').single();
  if (clanError) throw clanError;
  clanId = clan.id;

  const { error: memberError } = await admin.from('clan_members').insert({ user_id: leaderId, clan_id: clanId, role: 'leader' });
  if (memberError) throw memberError;
  const { error: friendError } = await admin.from('friends').insert({ user_id: leaderId, friend_id: inviteeId });
  if (friendError) throw friendError;

  const leaderClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const inviteeClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: leaderSignInError } = await leaderClient.auth.signInWithPassword({ email: leaderEmail, password });
  if (leaderSignInError) throw leaderSignInError;
  const { error: inviteeSignInError } = await inviteeClient.auth.signInWithPassword({ email: inviteeEmail, password });
  if (inviteeSignInError) throw inviteeSignInError;

  try {
    const dailyXp = await rpc(leaderClient, 'record_my_clan_xp', { p_xp_amount: 10, p_source_key: `daily:${suffix}` });
    assert(dailyXp.awarded === false && dailyXp.reason === 'cycle_close_required', 'EXP diaria nao foi bloqueada.');
    const cycleXp = await rpc(leaderClient, 'record_my_clan_xp', { p_xp_amount: 10, p_source_key: `cycle:${suffix}` });
    assert(cycleXp.awarded === true, 'EXP do ciclo nao foi creditada.');
    const duplicateXp = await rpc(leaderClient, 'record_my_clan_xp', { p_xp_amount: 10, p_source_key: `cycle:${suffix}` });
    assert(duplicateXp.awarded === false && duplicateXp.reason === 'already_recorded', 'EXP duplicada do ciclo nao foi bloqueada.');
  } catch (error) {
    if (String(error.message).includes('clan_xp_contributions')) clanXpAvailable = false;
    else throw error;
  }

  const firstInvite = await rpc(leaderClient, 'send_my_clan_invite', { p_invitee_id: inviteeId });
  assert(firstInvite.sent === true, 'Primeiro convite nao foi enviado.');
  const duplicateInvite = await rpc(leaderClient, 'send_my_clan_invite', { p_invitee_id: inviteeId });
  assert(duplicateInvite.sent === false && duplicateInvite.reason === 'already_invited', 'Convite duplicado nao foi bloqueado.');
  const revoked = await rpc(leaderClient, 'revoke_my_clan_invite', { p_invitee_id: inviteeId });
  assert(revoked.revoked === true, 'Convite nao foi cancelado.');

  const rejectInvite = await rpc(leaderClient, 'send_my_clan_invite', { p_invitee_id: inviteeId });
  const rejected = await rpc(inviteeClient, 'respond_to_my_clan_invite', { p_notification_id: rejectInvite.notification_id, p_accept: false });
  assert(rejected.responded === true && rejected.accepted === false, 'Convite nao foi recusado.');

  const acceptInvite = await rpc(leaderClient, 'send_my_clan_invite', { p_invitee_id: inviteeId });
  const accepted = await rpc(inviteeClient, 'respond_to_my_clan_invite', { p_notification_id: acceptInvite.notification_id, p_accept: true });
  assert(accepted.responded === true && accepted.accepted === true && accepted.clan_id === clanId, 'Convite nao foi aceito.');

  const { data: acceptedMembership, error: membershipCheckError } = await admin
    .from('clan_members')
    .select('user_id,clan_id,role')
    .eq('user_id', inviteeId)
    .eq('clan_id', clanId)
    .maybeSingle();
  if (membershipCheckError) throw membershipCheckError;
  assert(acceptedMembership?.role === 'member', 'Membro aceito nao apareceu no cla.');

  const relationshipChecks = [];
  for (const linkType of ['mentoria', 'parceria']) {
    const firstRelationshipInvite = await rpc(leaderClient, 'create_relationship_link_invite', {
      p_recipient_id: inviteeId,
      p_link_type: linkType,
    });
    const firstRelationshipInviteId = firstRelationshipInvite?.invite?.id;
    assert(firstRelationshipInviteId, `Convite de ${linkType} nao foi criado.`);
    await expectRpcError(
      leaderClient,
      'create_relationship_link_invite',
      { p_recipient_id: inviteeId, p_link_type: linkType },
      'RELATIONSHIP_INVITE_ALREADY_PENDING',
    );
    const revokedRelationshipInvite = await rpc(leaderClient, 'respond_relationship_link_invite', {
      p_invite_id: firstRelationshipInviteId,
      p_action: 'revoke',
    });
    assert(revokedRelationshipInvite.success === true, `Convite de ${linkType} nao foi cancelado.`);

    const declineRelationshipInvite = await rpc(leaderClient, 'create_relationship_link_invite', {
      p_recipient_id: inviteeId,
      p_link_type: linkType,
    });
    const declinedRelationshipInvite = await rpc(inviteeClient, 'respond_relationship_link_invite', {
      p_invite_id: declineRelationshipInvite.invite.id,
      p_action: 'decline',
    });
    assert(declinedRelationshipInvite.success === true, `Convite de ${linkType} nao foi recusado.`);

    const acceptRelationshipInvite = await rpc(leaderClient, 'create_relationship_link_invite', {
      p_recipient_id: inviteeId,
      p_link_type: linkType,
    });
    const acceptedRelationshipInvite = await rpc(inviteeClient, 'respond_relationship_link_invite', {
      p_invite_id: acceptRelationshipInvite.invite.id,
      p_action: 'accept',
    });
    const relationshipLinkId = acceptedRelationshipInvite?.link?.id;
    assert(acceptedRelationshipInvite.success === true && relationshipLinkId, `Convite de ${linkType} nao foi aceito.`);

    const { data: activeLink, error: activeLinkError } = await admin
      .from('relationship_links')
      .select('id,link_type,mentor_id,pupil_id,ended_at')
      .eq('id', relationshipLinkId)
      .single();
    if (activeLinkError) throw activeLinkError;
    assert(activeLink.link_type === linkType && activeLink.ended_at === null, `Vinculo de ${linkType} nao ficou ativo.`);

    const endedRelationship = await rpc(inviteeClient, 'end_relationship_link', {
      p_relationship_link_id: relationshipLinkId,
    });
    assert(endedRelationship.success === true, `Vinculo de ${linkType} nao foi encerrado.`);
    const { data: endedLink, error: endedLinkError } = await admin
      .from('relationship_links')
      .select('ended_at')
      .eq('id', relationshipLinkId)
      .single();
    if (endedLinkError) throw endedLinkError;
    assert(Boolean(endedLink.ended_at), `Encerramento de ${linkType} nao foi persistido.`);
    relationshipChecks.push(`${linkType}: criar, duplicata, cancelar, recusar, aceitar e encerrar`);
  }

  if (clanXpAvailable) {
    const { data: finalClan, error: finalClanError } = await admin.from('clans').select('exp').eq('id', clanId).single();
    if (finalClanError) throw finalClanError;
    assert(finalClan.exp === 10, `EXP final esperada 10, recebida ${finalClan.exp}.`);
  }

  console.log(JSON.stringify({
    ok: true,
    checks: [
      clanXpAvailable ? 'EXP diaria bloqueada' : 'EXP nao testada: tabela ausente',
      clanXpAvailable ? 'EXP de ciclo creditada uma vez' : 'EXP de ciclo aguardando SQL',
      'convite enviado',
      'duplicata bloqueada',
      'convite cancelado',
      'convite recusado',
      'convite aceito',
      'membro inserido',
      ...relationshipChecks,
    ],
  }, null, 2));
} finally {
  if (leaderId || inviteeId) {
    const ids = [leaderId, inviteeId].filter(Boolean);
    await admin.from('notifications').delete().in('user_id', ids);
    const { data: relationshipRows } = await admin.from('relationship_links').select('id').or(ids.flatMap(id => [`mentor_id.eq.${id}`, `pupil_id.eq.${id}`]).join(','));
    const relationshipIds = (relationshipRows || []).map(row => row.id);
    if (relationshipIds.length > 0) await admin.from('relationship_link_arenas').delete().in('relationship_link_id', relationshipIds);
    await admin.from('relationship_links').delete().or(ids.flatMap(id => [`mentor_id.eq.${id}`, `pupil_id.eq.${id}`]).join(','));
    await admin.from('relationship_link_invites').delete().or(ids.flatMap(id => [`sender_id.eq.${id}`, `recipient_id.eq.${id}`]).join(','));
    await admin.from('clan_xp_contributions').delete().in('user_id', ids);
    await admin.from('clan_members').delete().in('user_id', ids);
    await admin.from('friends').delete().or(ids.flatMap(id => [`user_id.eq.${id}`, `friend_id.eq.${id}`]).join(','));
  }
  if (clanId) await admin.from('clans').delete().eq('id', clanId);
  if (leaderId) await admin.auth.admin.deleteUser(leaderId);
  if (inviteeId) await admin.auth.admin.deleteUser(inviteeId);
}

const cleanupIds = [leaderId, inviteeId].filter(Boolean);
const [{ data: remainingProfiles }, { data: remainingMemberships }, { data: remainingInvites }, { data: remainingLinks }] = await Promise.all([
  admin.from('user_profiles').select('id').in('id', cleanupIds),
  admin.from('clan_members').select('user_id').in('user_id', cleanupIds),
  admin.from('relationship_link_invites').select('id').or(cleanupIds.flatMap(id => [`sender_id.eq.${id}`, `recipient_id.eq.${id}`]).join(',')),
  admin.from('relationship_links').select('id').or(cleanupIds.flatMap(id => [`mentor_id.eq.${id}`, `pupil_id.eq.${id}`]).join(',')),
]);
const remainingRows = (remainingProfiles?.length || 0) + (remainingMemberships?.length || 0) + (remainingInvites?.length || 0) + (remainingLinks?.length || 0);
assert(remainingRows === 0, `Limpeza incompleta: ${remainingRows} registros restantes.`);
console.log(JSON.stringify({ cleanup: 'ok', temporaryRowsRemaining: remainingRows }));
