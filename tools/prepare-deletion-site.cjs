const fs = require('fs');
const root = 'C:/Users/Afonso/Desktop/glyph-landing';
const out = 'output/account-deletion-site';
fs.mkdirSync(out, {recursive:true});
const config = fs.readFileSync(root+'/script.js','utf8');
const url = config.match(/const SUPABASE_URL\s*=\s*'([^']+)'/)[1];
const anon = config.match(/const SUPABASE_ANON\s*=\s*'([^']+)'/)[1];
let html = fs.readFileSync(root+'/exclusao.html','utf8');
const start = html.indexOf('        <div class="deletion-card">');
const end = html.indexOf('        <div class="legal-divider"></div>',start);
html = html.slice(0,start)+`
        <div class="deletion-card">
          <h3>Excluir minha conta pelo site</h3>
          <p>Entre na sua conta para confirmar sua identidade. Entrar ou abrir o link de e-mail não apaga nada: você confirma a exclusão na próxima etapa.</p>
          <form id="deletion-login" class="deletion-form">
            <label for="del-email">E-mail da conta</label>
            <input id="del-email" type="email" autocomplete="email" required>
            <label for="del-password">Senha do Glyph</label>
            <input id="del-password" type="password" autocomplete="current-password">
            <button class="cta-btn cta-btn--gold" type="submit">Entrar com senha</button>
            <button class="cta-btn" type="button" id="deletion-email-link">Receber acesso por e-mail</button>
            <p>Usou Google ou esqueceu a senha? Receba um link no e-mail da sua conta.</p>
          </form>
          <form id="deletion-form" class="deletion-form" hidden>
            <p id="deletion-identity"></p>
            <p>Seu perfil, login e dados pessoais do app serão removidos. Esta ação é definitiva.</p>
            <label for="del-reason">Motivo (opcional)</label>
            <textarea id="del-reason" maxlength="1000"></textarea>
            <label class="deletion-checkbox"><input id="del-confirm" type="checkbox" required> Confirmo que quero excluir definitivamente esta conta.</label>
            <button class="cta-btn cta-btn--gold" type="submit">Excluir minha conta</button>
            <button class="cta-btn" type="button" id="deletion-logout">Sair sem excluir</button>
          </form>
          <p id="deletion-message" role="status" aria-live="polite"></p>
          <p>Sem acesso ao e-mail? Fale com <a href="mailto:glyph.life.app@gmail.com">glyph.life.app@gmail.com</a> para verificar sua identidade com o suporte.</p>
        </div>
`+html.slice(end);
html = html.replace('Se você consegue entrar na sua conta, a solicitação de exclusão deve ser feita dentro do aplicativo, em <strong>Configurações > Deletar Conta</strong>. Esse é o caminho principal porque permite validar a identidade da conta com mais segurança.', 'No app, use <strong>Configurações > Deletar Conta</strong>. Você também pode excluir diretamente nesta página, após entrar na sua conta.');
html = html.replace('Esta página existe para orientar o usuário e oferecer um caminho alternativo de contato quando ele não consegue acessar o app. O caminho principal de exclusão continua sendo dentro do próprio aplicativo.', 'A exclusão usa o mesmo processo no app e no site. Se a limpeza de arquivos falhar, o pedido fica registrado para nova tentativa. Guarde o número do pedido mostrado ao confirmar.');
html = html.replace(/    <script>\s*document.getElementById\('deletion-form'\)[\s\S]*?<\/script>/, '    <script src="exclusao.js"></script>');
html = html.replace('</head>', '<style>[hidden]{display:none!important}.deletion-form input[type=password]{width:100%;padding:12px;background:#101014;color:#fff;border:1px solid #555;border-radius:6px}.deletion-form button:disabled{opacity:.5;cursor:wait}</style></head>');
fs.writeFileSync(out+'/exclusao.html',html);
const script = fs.readFileSync('tools/deletion-site-client.js','utf8').replace('__PUBLIC_URL__',JSON.stringify(url)).replace('__PUBLIC_ANON__',JSON.stringify(anon));
fs.writeFileSync(out+'/exclusao.js',script);
