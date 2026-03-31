import {
  createFriendship,
  createTempUser,
  getActiveRelationshipLink,
  setWallet,
  waitForDb,
} from './_smoke.supabase.mjs';

const checkpoints = [];

const mentorTemplate = {
  levels: [
    {
      id: `level-${Date.now()}`,
      name: 'Fase 1',
      description: 'Primeira fase de mentoria',
      arenas: [],
      actions: [],
    },
  ],
};

try {
  const mentor = await createTempUser({ label: 'mentor-codex-limit-mentor', isPremium: true, appMode: 'GAME', gold: 1000 });
  const pupil = await createTempUser({ label: 'mentor-codex-limit-pupil', isPremium: false, appMode: 'GAME', gold: 50 });
  await createFriendship(mentor, pupil);
  checkpoints.push('users-created');

  const inviteResult = await mentor.client.rpc('create_relationship_link_invite', {
    p_recipient_id: pupil.userId,
    p_link_type: 'mentoria',
  });
  const inviteId = inviteResult.data?.invite?.id || inviteResult.data?.inviteId || inviteResult.data?.invite_id;
  if (inviteResult.error || !inviteId) {
    throw new Error(`Failed to create mentorship invite: ${inviteResult.error?.message || 'invite missing'}`);
  }
  checkpoints.push('mentorship-invite-created');

  const acceptResult = await pupil.client.rpc('respond_relationship_link_invite', {
    p_invite_id: inviteId,
    p_action: 'accept',
  });
  if (acceptResult.error) {
    throw new Error(`Failed to accept mentorship invite: ${acceptResult.error.message}`);
  }
  checkpoints.push('mentorship-link-accepted');

  const relationshipLink = await waitForDb(
    'active mentorship link for mentor codex limit',
    () => getActiveRelationshipLink(mentor.client, {
      mentorId: mentor.userId,
      pupilId: pupil.userId,
      linkType: 'mentoria',
    }),
  );

  await setWallet(mentor.client, { userId: mentor.userId, gold: 1000 });

  for (let index = 1; index <= 2; index += 1) {
    const result = await mentor.client.rpc('forge_mentor_codex_for_pupil', {
      p_recipient_id: pupil.userId,
      p_name: `Codex mentor ${index}`,
      p_description: `Forja ${index}`,
      p_template: mentorTemplate,
      p_relationship_link_id: relationshipLink.id,
    });

    if (result.error) {
      throw new Error(`Expected forged mentor codex ${index} to succeed, got ${result.error.message}`);
    }
  }
  checkpoints.push('two-mentor-codexes-forged');

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      mentorEmail: mentor.email,
      mentorPassword: mentor.password,
      pupilEmail: pupil.email,
      pupilPassword: pupil.password,
      relationshipLinkId: relationshipLink.id,
    },
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    checkpoints,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
