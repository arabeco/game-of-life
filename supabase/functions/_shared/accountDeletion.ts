// Both the authenticated request and the scheduled retry use this same pipeline.
// The request row is server-created only; never accept a user id from the browser.
export async function processAccountDeletion(db: any, request: any) {
  const id = request.id;
  const userId = request.user_id;
  let metadata = { ...request.metadata };
  const save = async (status: string, complete = false) => {
    const { error } = await db.from('account_deletion_requests').update({
      status, metadata, completed_at: complete ? new Date().toISOString() : null,
      retry_after: complete ? null : new Date(Date.now() + 15 * 60_000).toISOString(),
      lease_until: null,
    }).eq('id', id);
    if (error) throw new Error(`Could not persist deletion state: ${error.message}`);
  };
  try {
    if (!metadata.auth_deleted) {
      if (metadata.block_reentry && metadata.user_email) {
        const { error, data } = await db.rpc('register_deleted_account_block', {
          p_email: metadata.user_email, p_user_id: userId,
          p_provider: metadata.user_provider || null, p_reason: metadata.reason || 'user_requested_account_deletion',
          p_metadata: { source: 'account-delete', request_id: id },
        });
        if (error || data?.success === false) console.warn('Reentry block could not be registered');
      } else {
        await db.rpc('release_golden_invite_claim_for_user', { p_user_id: userId });
      }
    }

    const { data: objects, error: listError } = await db.rpc('list_account_storage_objects', { p_user_id: userId });
    const files = new Map<string, { bucket: string; name: string }>();
    for (const file of metadata.storage_pending_files || []) files.set(JSON.stringify([file.bucket, file.name]), file);
    for (const object of objects || []) {
      const file = { bucket: object.bucket_id, name: object.object_name };
      files.set(JSON.stringify([file.bucket, file.name]), file);
    }
    metadata.storage_listing_pending = Boolean(listError);
    metadata.storage_pending_files = [...files.values()];
    // Persist the manifest BEFORE any destructive operation. A crash must be resumable.
    const { error: manifestError } = await db.from('account_deletion_requests').update({ metadata }).eq('id', id);
    if (manifestError) throw new Error('Could not persist storage manifest');
    const pending = [];
    const buckets = new Map<string, string[]>();
    for (const { bucket, name } of files.values()) buckets.set(bucket, [...(buckets.get(bucket) || []), name]);
    for (const [bucket, names] of buckets) {
      for (let i = 0; i < names.length; i += 100) {
        const batch = names.slice(i, i + 100);
        const { error } = await db.storage.from(bucket).remove(batch);
        if (error) pending.push(...batch.map(name => ({ bucket, name })));
        else metadata.storage_removed_count = (metadata.storage_removed_count || 0) + batch.length;
      }
    }
    metadata.storage_pending_files = pending;

    if (!metadata.auth_deleted) {
      const { data, error } = await db.rpc('delete_account_data_for_user', { p_user_id: userId });
      if (error || data?.success !== true) throw new Error(error?.message || data?.error || 'Data deletion failed');
      metadata.clan_outcome = data.clan_outcome ?? null;
      const profile = await db.from('user_profiles').select('id').eq('id', userId).maybeSingle();
      if (profile.error || profile.data) throw new Error('Profile deletion could not be verified');
      const deleted = await db.auth.admin.deleteUser(userId);
      if (deleted.error && deleted.error.code !== 'user_not_found' && deleted.error.status !== 404) throw deleted.error;
      const check = await db.auth.admin.getUserById(userId);
      if (check.data?.user || (check.error && check.error.code !== 'user_not_found' && check.error.status !== 404)) {
        throw new Error('Auth deletion could not be verified');
      }
      metadata.auth_deleted = true;
    }
    const cleanupPending = Boolean(metadata.storage_listing_pending || pending.length);
    // Record the irreversible result before making the optional email call.
    await save(cleanupPending ? 'cleanup_pending' : 'completed', !cleanupPending);
    if (metadata.user_email && metadata.deletion_email_status !== 'accepted') {
      try {
        const { data, error } = await db.functions.invoke('resend', { body: {
          type: 'account_deleted',
          content: cleanupPending
            ? 'Sua conta do Glyph foi excluída. A limpeza de alguns arquivos continua automaticamente.'
            : 'Sua conta do Glyph foi excluída. Registros mínimos sujeitos a retenção seguem a Política de Privacidade.',
          metadata: { sendEmail: true, accountDeleted: true, email: metadata.user_email, dispatchKey: `account-deleted:${id}` },
        } });
        metadata.deletion_email_status = !error && data?.accepted === true ? 'accepted' : 'failed';
      } catch { metadata.deletion_email_status = 'failed'; }
    }
    if (!cleanupPending) {
      delete metadata.user_email;
      delete metadata.user_provider;
      delete metadata.reason;
    }
    await save(cleanupPending ? 'cleanup_pending' : 'completed', !cleanupPending);
    return { success: true, requestId: id, cleanupPending, clanOutcome: metadata.clan_outcome, deletionEmailStatus: metadata.deletion_email_status };
  } catch (error) {
    metadata.last_error = error instanceof Error ? error.message : String(error);
    await save(metadata.auth_deleted ? 'cleanup_pending' : 'failed');
    return { success: false, requestId: id, error: 'Não foi possível concluir agora. O pedido foi registrado e será retomado automaticamente.' };
  }
}
