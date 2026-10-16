const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
if (!root) throw new Error('Informe a pasta da landing.');
const edit = (name, fn) => {
  const file = path.join(root, name);
  const before = fs.readFileSync(file, 'utf8');
  const after = fn(before);
  if (before !== after) fs.writeFileSync(file, after);
};
const placeholders = html => html.replace(/<a\b([^>]*?)href="https:\/\/app\.glyph\.life\/"([^>]*)>[\s\S]*?<\/a>/g, (_, before, after) => {
  const cls = `${before} ${after}`.match(/class="([^"]*)"/);
  return `<span class="${cls ? cls[1] + ' ' : ''}access-soon" aria-disabled="true">Entrar na web · Em breve</span>`;
});
for (const name of fs.readdirSync(root).filter(n => n.endsWith('.html'))) edit(name, placeholders);
for (const name of ['fix_nav.js', 'rebuild_index.js']) if (fs.existsSync(path.join(root, name))) edit(name, placeholders);
edit('index.html', s => s.replace('id="btn-hero-download"', 'id="btn-hero-download" disabled aria-describedby="public-access-note"')
  .replace('Já tenho acesso · abrir app', 'Android · Em breve')
  .replace('Ainda não tem acesso?', '<span id="public-access-note">O acesso público está chegando.</span>'));
edit('script.js', s => s.replace("const APP_URL = 'https://app.glyph.life/';", '// Acessos públicos aguardam o lançamento; mantenha a lista de interesse ativa.')
  .replace("    const btnDownload = document.getElementById('btn-hero-download');", '')
  .replace(/    if \(btnDownload\) \{[\s\S]*?\r?\n    \}/, ''));
edit('refresh.css', s => s.includes('/* Public launch placeholders */') ? s : s + '\n/* Public launch placeholders */\n.access-soon { cursor: default; color: #aaa8a1; font-size: .78rem; line-height: 1.4; }\n.hero-cta:disabled { cursor: default; opacity: .75; transform: none; box-shadow: none; }\n');
edit('news-data.json', s => {
  const data = JSON.parse(s);
  for (const p of data.articles) {
    if (p.href === 'https://app.glyph.life/') { p.href = null; p.cta = 'Acesso público · Em breve'; }
    if (p.slug === 'convide-um-amigo') {
      p.summary = 'Seu primeiro amigo já rende 10 fragmentos. Acompanhe os próximos prêmios na barrinha de convites.';
      p.body[1] = 'Enquanto o download público não é liberado, compartilhe seu código com quem já tem acesso aos testes. O amigo cria a conta e digita seu código em Ajustes → Resgatar código nos primeiros sete dias após o cadastro.';
      p.body[3] = 'Os prêmios se acumulam: 1 amigo libera 10 fragmentos; 5 amigos, um baú Comum; 10 amigos, um baú Incomum. Cada marco pode ser recebido uma única vez.';
    }
  }
  return JSON.stringify(data, null, 2) + '\n';
});
edit('scripts/generate-news.cjs', s => s.replace('Link público da Play Store: a definir.', 'O acesso público será liberado no lançamento.'));
require('node:child_process').execFileSync(process.execPath, [path.join(root, 'scripts/generate-news.cjs'), root], {stdio: 'inherit'});
console.log('Placeholders públicos e post de convites atualizados.');
