import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { processAccountDeletion } from '../_shared/accountDeletion.ts';

serve(async req => {
  const secret = Deno.env.get('WEB_PUSH_WEBHOOK_SECRET');
  if (req.method !== 'POST' || !secret || req.headers.get('x-account-cleanup-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.rpc('claim_account_deletion_retries');
  if (error) return new Response('Could not claim pending requests', { status: 500 });
  const results = [];
  for (const request of data || []) {
    try { results.push(await processAccountDeletion(db, request)); }
    catch { console.error('Could not persist deletion retry state', request.id); }
  }
  return Response.json({ processed: results.length, completed: results.filter(r => r.success && !r.cleanupPending).length });
});
