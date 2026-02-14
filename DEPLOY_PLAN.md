# Plano de Deploy (Amanhã)

## 1) Preparação do ambiente
- Confirmar variáveis de ambiente de produção (Supabase URL e ANON KEY).
- Rodar o projeto localmente com o .env de produção.
- Verificar build e typecheck sem erros:
  - npm run build
  - npx tsc -p tsconfig.json --noEmit
- Anotar warning de chunk > 500kB (ok para beta).

## 2) Banco de dados (Supabase)
- Garantir que as tabelas existam:
  - codexes
  - relationship_links
  - relationship_link_invites
  - link_notifications_log
  - feedback_reports
- Revisar RLS:
  - Insert/Select somente do próprio user_id
  - Links filtrados por mentor_id ou pupil_id
- Testar login e leitura simples do user_profile.

## 3) Smoke Test local (mínimo viável)
- Login/logout e persistência de sessão.
- Criar Arena e Ação, atualizar e recarregar a página.
- Marcar/desmarcar tarefa e validar XP.
- SITREP: abrir, fechar o dia e conferir trava/XP.
- Codex Builder: entrar, criar arena, exportar JSON, sair e checar que arena falsa não aparece no modo real.
- Vínculos: enviar convite, aceitar e salvar slider de satisfação.

## 4) Build de produção
- Rodar:
  - npm run build
- Confirmar criação do dist/.

## 5) Deploy (duas rotas seguras)

### Opção A — Vercel
- Importar repositório no Vercel.
- Configurar variáveis de ambiente.
- Build Command: npm run build
- Output Directory: dist
- Deploy e testar a URL.

### Opção B — Netlify
- Importar repositório no Netlify.
- Build Command: npm run build
- Publish Directory: dist
- Configurar variáveis de ambiente.
- Deploy e testar a URL.

## 6) Pós-deploy (validação final)
- Repetir o Smoke Test no link público.
- Verificar erros no console do navegador.
- Confirmar ausência de 400/401 no Supabase.

## 7) Rollback
- Usar o deploy anterior (Vercel/Netlify).
