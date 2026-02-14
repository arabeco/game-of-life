# Plano de Deploy (Amanhã)

Estamos muito perto. O que já está feito é sólido, e o que falta é direto. Vamos acelerar com calma, executar o básico, e fechar o deploy com confiança.

## Plano rápido (executar e marcar)
- [x] Validar envs e build local
- [ ] Checar Supabase (tabelas + RLS + login simples)
- [ ] Rodar smoke test mínimo
- [ ] Build de produção e deploy
- [ ] Validar pós-deploy e confirmar logs limpos

## 1) Preparação do ambiente
- [ ] Confirmar variáveis de ambiente de produção (Supabase URL e ANON KEY).
- [ ] Rodar o projeto localmente com o .env de produção.
- [x] Verificar build e typecheck sem erros:
  - npm run build
  - npx tsc -p tsconfig.json --noEmit
- [x] Anotar warning de chunk > 500kB (ok para beta).

## 2) Banco de dados (Supabase)
- [ ] Garantir que as tabelas existam:
  - [x] codexes
  - [x] relationship_links
  - [x] relationship_link_invites
  - [x] link_notifications_log
  - [ ] feedback_reports (não encontrado no schema cache)
- [ ] Revisar RLS:
  - Insert/Select somente do próprio user_id
  - Links filtrados por mentor_id ou pupil_id
- [ ] Testar login e leitura simples do user_profile.

## 3) Smoke Test local (mínimo viável)
- [x] Login/logout e persistência de sessão.
- [x] Criar Arena e Ação, atualizar e recarregar a página.
- [x] Marcar/desmarcar tarefa e validar XP.
- [ ] SITREP: abrir, fechar o dia e conferir trava/XP.
- [x] Editar slot de ativo, nível de maestria, avatar e borda.
- [ ] Criar clã privado, aceitar solicitações, validar membros e social persistente.
- [ ] Codex Builder: entrar, criar arena, exportar JSON, sair e checar que arena falsa não aparece no modo real.
- [ ] Vínculos: enviar convite, aceitar e salvar slider de satisfação.
- [ ] Feedback Beta: enviar relatório e confirmar gravação no Supabase.

## 4) Build de produção
- [x] Rodar:
  - npm run build
- [x] Confirmar criação do dist/.

## 5) Deploy (duas rotas seguras)

### Opção A — Vercel
- [ ] Importar repositório no Vercel.
- [ ] Configurar variáveis de ambiente.
- [ ] Build Command: npm run build
- [ ] Output Directory: dist
- [ ] Deploy e testar a URL.

### Opção B — Netlify
- [ ] Importar repositório no Netlify.
- [ ] Build Command: npm run build
- [ ] Publish Directory: dist
- [ ] Configurar variáveis de ambiente.
- [ ] Deploy e testar a URL.

## 6) Pós-deploy (validação final)
- [ ] Repetir o Smoke Test no link público.
- [ ] Verificar erros no console do navegador.
- [ ] Confirmar ausência de 400/401 no Supabase.

## 7) Rollback
- [ ] Usar o deploy anterior (Vercel/Netlify).
