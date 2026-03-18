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
  if (inviteResult.error || !inviteResult.data?.invite_id) {
    throw new Error(`Failed to create mentorship invite: ${inviteResult.error?.message || 'invite missing'}`);
  }
  checkpoints.push('mentorship-invite-created');

  const acceptResult = await pupil.client.rpc('respond_relationship_link_invite', {
    p_invite_id: inviteResult.data.invite_id,
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

  const thirdForge = await mentor.client.rpc('forge_mentor_codex_for_pupil', {
    p_recipient_id: pupil.userId,
    p_name: 'Codex mentor 3',
    p_description: 'Forja 3',
    p_template: mentorTemplate,
    p_relationship_link_id: relationshipLink.id,
  });

  if (!thirdForge.error || !String(thirdForge.error.message || '').includes('MENTOR_FORGED_CODEX_LIMIT_REACHED')) {
    throw new Error(`Expected third forged mentor codex to fail with MENTOR_FORGED_CODEX_LIMIT_REACHED, got ${thirdForge.error?.message || 'success'}.`);
  }
  checkpoints.push('third-mentor-codex-blocked');

  console.log(JSON.stringify({
    success: true,
    checkpoints,
    fixture: {
      mentorEmail: mentor.email,
      pupilEmail: pupil.email,
      relationshipLinkId: relationshipLink.id,
      thirdError: thirdForge.error.message,
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
