type Dependencies = {
  serviceKey: string;
  apiKey: string;
  from: string;
  admin: any;
  fetcher?: typeof fetch;
  now?: () => number;
};
const response = (status: number, value: unknown) => new Response(JSON.stringify(value), {
  status, headers: { 'Content-Type': 'application/json' },
});
const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

// API exclusivamente de backend. Recuperação de senha continua no Supabase Auth.
export const createDeletionEmailHandler = ({ serviceKey, apiKey, from, admin,
  fetcher = fetch, now = Date.now }: Dependencies) => async (req: Request) => {
  if (req.method !== 'POST') return response(405, { error: 'method_not_allowed' });
  if (!serviceKey || req.headers.get('authorization') !== `Bearer ${serviceKey}`) {
    return response(401, { error: 'unauthorized' });
  }
  if (!admin || !apiKey) return response(503, { error: 'email_unavailable' });
  try {
    const payload = await req.json();
    const metadata = payload?.metadata;
    const isTest = payload?.type === 'delivery_test';
    if ((!isTest && (payload?.type !== 'account_deleted' || metadata?.accountDeleted !== true)) || metadata?.sendEmail !== true) {
      return response(400, { error: 'unsupported_email' });
    }
    const key = metadata.dispatchKey;
    const email = typeof metadata.email === 'string' ? metadata.email.trim() : '';
    const validKey = isTest ? /^delivery-test:[a-zA-Z0-9-]{8,80}$/ : /^account-deleted:\d+$/;
    if (typeof key !== 'string' || !validKey.test(key) || key.length > 200 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.toLowerCase().endsWith('@gol.local')) {
      return response(400, { error: 'invalid_dispatch' });
    }
    const content = isTest
      ? 'Este é um teste solicitado por você para conferir a entrega de e-mails do Glyph. Nenhuma conta foi excluída ou alterada. Confirme o recebimento no chat.'
      : typeof payload.content === 'string' ? payload.content.trim() : '';
    if (!content || content.length > 3000) return response(400, { error: 'invalid_content' });

    // O sufixo separa reservas antigas, feitas antes de se saber o resultado.
    const dispatchKey = `v2:${key}`;
    const table = () => admin.from('notification_email_dispatches');
    const { error: insertError } = await table().insert({
      dispatch_key: dispatchKey, notification_type: isTest ? 'delivery_test' : 'account_deleted', status: 'pending',
    });
    if (insertError && insertError.code !== '23505') return response(503, { error: 'dispatch_storage_unavailable' });
    const { data: row, error: readError } = await table().select('status,created_at,provider_email_id')
      .eq('dispatch_key', dispatchKey).single();
    if (readError || !row) return response(503, { error: 'dispatch_storage_unavailable' });
    if (row.status === 'accepted') return response(200, {
      accepted: true, alreadyAccepted: true, id: row.provider_email_id,
    });
    const age = now() - Date.parse(row.created_at);
    // Resend guarda idempotência por 24h. Não reenviar após essa janela sem conciliar.
    if (!Number.isFinite(age) || age < -60000 || age > 23 * 3600000) {
      return response(409, { error: 'dispatch_needs_review' });
    }
    const heading = isTest ? 'Teste de entrega' : 'Conta excluída';
    const body = JSON.stringify({ from, to: email, subject: `Glyph — ${heading}`,
      text: content,
      html: `<div style="font-family:sans-serif;color:#222;padding:24px"><h2>${heading}</h2><p>${escape(content).replaceAll('\n', '<br>')}</p><p>Glyph</p></div>`,
    });
    let acceptedId = '';
    // Retentativas limitadas, mesmo corpo/chave; não consome novos envios em duplicidade.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await fetcher('https://api.resend.com/emails', {
          method: 'POST', headers: { Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json', 'Idempotency-Key': dispatchKey },
          body, signal: AbortSignal.timeout(8000),
        });
        const data = await result.json().catch(() => ({}));
        if (result.ok && typeof data.id === 'string' && data.id) { acceptedId = data.id; break; }
        if (result.status < 500 && result.status !== 429 &&
          !(result.status === 409 && data.name === 'concurrent_idempotent_requests')) break;
      } catch { /* Resposta perdida: a mesma chave protege a nova tentativa. */ }
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
    }
    if (!acceptedId) {
      // Não sobrescrever accepted se outra tentativa concorrente já confirmou.
      await table().update({ status: 'failed', updated_at: new Date(now()).toISOString() })
        .eq('dispatch_key', dispatchKey).neq('status', 'accepted');
      return response(502, { error: 'email_not_confirmed', retryableWithinHours: 23 });
    }
    const { error: saveError } = await table().update({ status: 'accepted',
      provider_email_id: acceptedId, updated_at: new Date(now()).toISOString(),
    }).eq('dispatch_key', dispatchKey);
    if (saveError) console.warn('Email accepted; dispatch persistence needs retry.');
    return response(200, { accepted: true, id: acceptedId, trackingPending: Boolean(saveError) });
  } catch {
    return response(500, { error: 'email_processing_failed' });
  }
};
