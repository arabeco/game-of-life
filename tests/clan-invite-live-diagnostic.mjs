import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local', quiet: true });

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error('VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.');
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: profiles, error: profilesError } = await supabase
  .from('user_profiles')
  .select('id,nickname,email')
  .or('nickname.ilike.%lu%,nickname.ilike.%mister x%,nickname.ilike.%misterx%')
  .order('nickname');

if (profilesError) throw profilesError;

const { data: authPage, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (authError) throw authError;
const authLuigiIds = (authPage?.users || [])
  .filter(user => String(user.email || '').toLowerCase().includes('luigi'))
  .map(user => user.id);

if (authLuigiIds.length > 0) {
  const missingIds = authLuigiIds.filter(id => !(profiles || []).some(profile => profile.id === id));
  if (missingIds.length > 0) {
    const { data: authProfiles, error: authProfilesError } = await supabase
      .from('user_profiles')
      .select('id,nickname,email')
      .in('id', missingIds);
    if (authProfilesError) throw authProfilesError;
    profiles.push(...(authProfiles || []));
  }
}

const ids = [...new Set((profiles || []).map(profile => profile.id))];
const [{ data: memberships, error: membershipsError }, { data: friendships, error: friendshipsError }, { data: invites, error: invitesError }] = await Promise.all([
  ids.length
    ? supabase.from('clan_members').select('user_id,clan_id,role,clans(name)').in('user_id', ids)
    : Promise.resolve({ data: [], error: null }),
  ids.length
    ? supabase.from('friends').select('user_id,friend_id').or(ids.flatMap(id => [`user_id.eq.${id}`, `friend_id.eq.${id}`]).join(','))
    : Promise.resolve({ data: [], error: null }),
  ids.length
    ? supabase.from('notifications').select('id,user_id,type,created_at,metadata').eq('type', 'clan_invite').in('user_id', ids)
    : Promise.resolve({ data: [], error: null }),
]);

if (membershipsError) throw membershipsError;
if (friendshipsError) throw friendshipsError;
if (invitesError) throw invitesError;

const safeProfiles = (profiles || []).map(profile => ({
  id: profile.id,
  nickname: profile.nickname,
  emailDomain: String(profile.email || '').split('@')[1] || null,
  membership: (memberships || []).find(row => row.user_id === profile.id) || null,
}));

const targetIds = new Set(ids);
const mutualFriendships = (friendships || []).filter(row => targetIds.has(row.user_id) && targetIds.has(row.friend_id));
const pendingInvites = (invites || []).filter(row => row.metadata?.inviteNotification === true).map(row => ({
  id: row.id,
  inviteeId: row.user_id,
  clanId: row.metadata?.clanId || null,
  inviterId: row.metadata?.inviterId || null,
  createdAt: row.created_at,
}));

const { error: inviteRpcError } = await supabase.rpc('get_my_pending_clan_invitee_ids');

const misterX = (profiles || []).find(profile => String(profile.nickname || '').toLowerCase().replace(/\s+/g, '') === 'misterx');
let misterFriends = [];
if (misterX) {
  const { data: friendRows, error: friendRowsError } = await supabase
    .from('friends')
    .select('user_id,friend_id')
    .or(`user_id.eq.${misterX.id},friend_id.eq.${misterX.id}`);
  if (friendRowsError) throw friendRowsError;
  const peerIds = [...new Set((friendRows || []).map(row => row.user_id === misterX.id ? row.friend_id : row.user_id))];
  if (peerIds.length > 0) {
    const [{ data: peerProfiles, error: peerProfilesError }, { data: peerMemberships, error: peerMembershipsError }] = await Promise.all([
      supabase.from('user_profiles').select('id,nickname').in('id', peerIds),
      supabase.from('clan_members').select('user_id,clan_id,role,clans(name)').in('user_id', peerIds),
    ]);
    if (peerProfilesError) throw peerProfilesError;
    if (peerMembershipsError) throw peerMembershipsError;
    misterFriends = (peerProfiles || []).map(profile => ({
      id: profile.id,
      nickname: profile.nickname,
      membership: (peerMemberships || []).find(row => row.user_id === profile.id) || null,
    }));
  }
}

console.log(JSON.stringify({
  profiles: safeProfiles,
  mutualFriendships,
  pendingInvites,
  misterFriends,
  inviteMigrationAvailable: !inviteRpcError,
  inviteMigrationError: inviteRpcError?.code || null,
}, null, 2));
