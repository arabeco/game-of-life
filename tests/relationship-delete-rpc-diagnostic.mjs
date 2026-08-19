import { randomUUID } from 'node:crypto';
import {
  createFriendship,
  createTempUser,
  getActiveRelationshipLink,
  waitForDb,
} from './_smoke.supabase.mjs';

async function seedMentorshipFixture() {
  const mentor = await createTempUser({ label: 'relationship-delete-rpc-mentor', isPremium: true, gold: 800 });
  const pupil = await createTempUser({ label: 'relationship-delete-rpc-pupil', isPremium: false, gold: 50 });
  await createFriendship(mentor, pupil);

  const invite = await mentor.client.rpc('create_relationship_link_invite', {
    p_recipient_id: pupil.userId,
    p_link_type: 'mentoria',
  });
  if (invite.error) throw new Error(`invite failed: ${invite.error.message}`);
  const inviteId = invite.data?.invite?.id || invite.data?.inviteId || invite.data?.invite_id;
  if (!inviteId) throw new Error('invite id missing');

  const accept = await pupil.client.rpc('respond_relationship_link_invite', {
    p_invite_id: inviteId,
    p_action: 'accept',
  });
  if (accept.error) throw new Error(`accept failed: ${accept.error.message}`);

  const activeLink = await waitForDb(
    'active mentorship link for relationship delete diagnostic',
    () => getActiveRelationshipLink(mentor.client, {
      mentorId: mentor.userId,
      pupilId: pupil.userId,
      linkType: 'mentoria',
    }),
  );

  return { mentor, pupil, activeLink };
}

async function createLinkedArena(client, relationshipLinkId, name) {
  const created = await client.rpc('create_linked_relationship_arena', {
    p_relationship_link_id: relationshipLinkId,
    p_asset_id: 'consciencia',
    p_name: name,
    p_description: `Fixture ${name}`,
    p_icon: '🏛️',
  });
  if (created.error) throw new Error(`create linked arena failed: ${created.error.message}`);
  const arenaId = created.data?.arena?.id || created.data?.arenaId || created.data?.arena_id;
  if (!arenaId) throw new Error('linked arena id missing');

  const actionInsert = await client.from('actions').insert({
    id: randomUUID(),
    user_id: client.auth.getUser ? undefined : undefined,
  });
  void actionInsert;

  return arenaId;
}

async function createMentorCodex(client, recipientId, relationshipLinkId, name) {
  const forged = await client.rpc('forge_mentor_codex_for_pupil', {
    p_recipient_id: recipientId,
    p_name: name,
    p_description: `Fixture ${name}`,
    p_template: {
      title: name,
      description: `Fixture ${name}`,
      primaryAssetId: 'consciencia',
      levels: [
        {
          level: 1,
          title: 'Asawer',
          description: 'Fase unica',
          actions: [
            {
              name: 'Leitura guiada',
              icon: '📘',
              duration: 15,
              repetitions: 1,
              actionType: 'Ação Recorrente',
              difficulty: 1,
            },
          ],
        },
      ],
    },
    p_relationship_link_id: relationshipLinkId,
  });
  if (forged.error) throw new Error(`forge mentor codex failed: ${forged.error.message}`);
  const codexId = forged.data?.codex_id || forged.data?.codexId;
  if (!codexId) throw new Error('forged codex id missing');
  return codexId;
}

try {
  const { mentor, pupil, activeLink } = await seedMentorshipFixture();

  const mentorArenaA = await mentor.client.rpc('create_linked_relationship_arena', {
    p_relationship_link_id: activeLink.id,
    p_asset_id: 'consciencia',
    p_name: `Arena mentor delete ${Date.now()}`,
    p_description: 'arena mentor',
    p_icon: '🏛️',
  });
  if (mentorArenaA.error) throw new Error(`mentor arena A failed: ${mentorArenaA.error.message}`);
  const arenaIdA = mentorArenaA.data?.arena?.id || mentorArenaA.data?.arenaId || mentorArenaA.data?.arena_id;

  const mentorArenaB = await mentor.client.rpc('create_linked_relationship_arena', {
    p_relationship_link_id: activeLink.id,
    p_asset_id: 'consciencia',
    p_name: `Arena pupil delete ${Date.now()}`,
    p_description: 'arena pupil',
    p_icon: '🏛️',
  });
  if (mentorArenaB.error) throw new Error(`mentor arena B failed: ${mentorArenaB.error.message}`);
  const arenaIdB = mentorArenaB.data?.arena?.id || mentorArenaB.data?.arenaId || mentorArenaB.data?.arena_id;

  const codexIdA = await createMentorCodex(mentor.client, pupil.userId, activeLink.id, `Codex mentor delete ${Date.now()}`);
  const codexIdB = await createMentorCodex(mentor.client, pupil.userId, activeLink.id, `Codex pupil delete ${Date.now()}`);

  const mentorArenaDelete = await mentor.client.rpc('delete_linked_relationship_arena', { p_arena_id: arenaIdA });
  const pupilArenaDelete = await pupil.client.rpc('delete_linked_relationship_arena', { p_arena_id: arenaIdB });
  const mentorCodexDelete = await mentor.client.rpc('delete_relationship_mentor_codex', { p_codex_id: codexIdA });
  const pupilCodexDelete = await pupil.client.rpc('delete_relationship_mentor_codex', { p_codex_id: codexIdB });

  console.log(JSON.stringify({
    success: true,
    fixture: {
      mentorEmail: mentor.email,
      pupilEmail: pupil.email,
      relationshipLinkId: activeLink.id,
    },
    results: {
      mentorArenaDelete: mentorArenaDelete.error ? { ok: false, message: mentorArenaDelete.error.message } : mentorArenaDelete.data,
      pupilArenaDelete: pupilArenaDelete.error ? { ok: false, message: pupilArenaDelete.error.message } : pupilArenaDelete.data,
      mentorCodexDelete: mentorCodexDelete.error ? { ok: false, message: mentorCodexDelete.error.message } : mentorCodexDelete.data,
      pupilCodexDelete: pupilCodexDelete.error ? { ok: false, message: pupilCodexDelete.error.message } : pupilCodexDelete.data,
    },
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
