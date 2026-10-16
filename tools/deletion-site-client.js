/* Public anon key only. Authorization is verified again by account-delete. */
(async () => {
  const message = document.getElementById('deletion-message');
  const login = document.getElementById('deletion-login');
  const form = document.getElementById('deletion-form');
  let busy = false;
  let finished = false;
  const say = text => { message.textContent = text; };
  if (!window.supabase) { say('Não foi possível carregar o acesso. Recarregue a página.'); return; }
  const db = window.supabase.createClient(__PUBLIC_URL__, __PUBLIC_ANON__, {
    auth: { storageKey: 'glyph-account-deletion', storage: window.sessionStorage, detectSessionInUrl: true },
  });
  const showUser = user => {
    login.hidden = Boolean(user) || finished;
    form.hidden = !user || finished;
    document.getElementById('del-confirm').checked = false;
    document.getElementById('deletion-identity').textContent = user ? `Conta: ${user.email}` : '';
  };
  const run = async fn => {
    if (busy) return;
    busy = true;
    document.querySelectorAll('.deletion-card button').forEach(b => { b.disabled = true; });
    try { await fn(); } catch { say('Não foi possível conectar. Tente novamente.'); }
    finally {
      busy = false;
      document.querySelectorAll('.deletion-card button').forEach(b => { b.disabled = false; });
    }
  };
  login.addEventListener('submit', e => {
    e.preventDefault();
    void run(async () => {
      const { data, error } = await db.auth.signInWithPassword({email: document.getElementById('del-email').value.trim(), password:document.getElementById('del-password').value});
      document.getElementById('del-password').value = '';
      if (error) { say('Não foi possível entrar. Confira os dados ou receba acesso por e-mail.'); return; }
      showUser(data.user); say('Confira a conta e confirme a exclusão abaixo.');
    });
  });
  document.getElementById('deletion-email-link').addEventListener('click', () => {
    const email = document.getElementById('del-email');
    if (!email.reportValidity()) return;
    void run(async () => {
      const { error } = await db.auth.signInWithOtp({email:email.value.trim(),options:{shouldCreateUser:false,emailRedirectTo:location.origin+'/exclusao.html'}});
      say(error ? 'Não foi possível enviar o acesso. Confira o e-mail e aguarde antes de tentar novamente.' : 'Confira seu e-mail e abra o link para continuar. A exclusão ainda não foi solicitada.');
    });
  });
  document.getElementById('deletion-logout').addEventListener('click', () => void run(async () => {
    await db.auth.signOut({scope:'local'}); showUser(null); say('Você saiu. Nenhuma exclusão foi solicitada.');
  }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!document.getElementById('del-confirm').checked) return;
    void run(async () => {
      say('Processando exclusão…');
      const { data, error } = await db.functions.invoke('account-delete', {body:{source:'website',reason:document.getElementById('del-reason').value}});
      let result = data;
      if (error?.context) { try { result = await error.context.json(); } catch {} }
      const protocol = result?.requestId ? ` Pedido nº ${result.requestId}.` : '';
      if (error || !result?.success) { say((result?.error || 'Não foi possível confirmar a exclusão. Tente novamente.')+protocol); return; }
      finished = true; showUser(null);
      say('Sua conta foi excluída.'+protocol+(result.cleanupPending ? ' A limpeza de alguns arquivos continua em segundo plano.' : ''));
      await db.auth.signOut({scope:'local'});
    });
  });
  db.auth.onAuthStateChange((_event, session) => { showUser(session?.user || null); });
  const { data, error } = await db.auth.getUser();
  showUser(error ? null : data.user);
  if (location.hash.includes('error')) say('O link expirou ou não é válido. Solicite um novo acesso.');
  history.replaceState(null, '', location.pathname);
})();
