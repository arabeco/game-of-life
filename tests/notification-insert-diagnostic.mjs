import { createFriendship, createTempUser } from './_smoke.supabase.mjs';

async function main() {
  const sender = await createTempUser({
    label: 'notification-insert-sender',
    isPremium: false,
    appMode: 'GAME',
    gold: 0,
    fragments: 0,
  });
  const recipient = await createTempUser({
    label: 'notification-insert-recipient',
    isPremium: false,
    appMode: 'GAME',
    gold: 0,
    fragments: 0,
  });

  await createFriendship(sender, recipient);

  const insert = await sender.client.from('notifications').insert({
    user_id: recipient.userId,
    type: 'competition_result',
    content: 'Diagnostico de notificacao de competicao.',
    metadata: {
      challengeId: 'diagnostic',
      winnerUserId: sender.userId,
      rewardChestType: 'Comum',
      linkType: 'competicao',
    },
    read: false,
    created_at: new Date().toISOString(),
  });

  console.log(JSON.stringify({
    success: !insert.error,
    error: insert.error ? {
      message: insert.error.message,
      code: insert.error.code,
      details: insert.error.details,
      hint: insert.error.hint,
    } : null,
    sender: sender.email,
    recipient: recipient.email,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(1);
});
