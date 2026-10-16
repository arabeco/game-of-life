# Exclusão integrada — 15/10/2026

## Estado real

Atualização de 16/10: SQL, funções e site publicados; retornos de autenticação configurados. Teste REAL com conta descartável pelo site confirmou remoção de perfil, Auth, arenas, ações, tarefas, campanha e arquivo. Protocolo 102 completed. Nenhuma conta preexistente foi apagada; entrega de e-mail não foi testada. Ver docs/2026-10-16-fechamento-exclusao-widget-push.md.

- App e site chamam `account-delete`, que obtém o usuário do token validado pelo Auth; ignora qualquer ID fornecido pelo cliente.
- Site local: `C:/Users/Afonso/Desktop/glyph-landing/exclusao.html` e `exclusao.js`. Login com senha ou link de acesso por e-mail, sem criar conta. O login não exclui: há uma confirmação explícita posterior.
- Pedido persistido, com protocolo e exclusão serializada por usuário. A lista dos arquivos é persistida antes de removê-los.
- Usa o RPC existente `delete_account_data_for_user`, verifica ausência em `user_profiles`, apaga o usuário Auth e verifica sua ausência antes de informar sucesso.
- Falha em arquivos: `cleanup_pending`. Falha de dados/Auth: `failed`, sem `completed_at`. A rotina retoma pedidos verificados e antigos `cleanup_pending` com `auth_deleted=true`.
- Worker a cada 15 minutos, cinco pedidos por execução, lease de 10 minutos, até dez tentativas automáticas. Pendências esgotadas permanecem para intervenção; não são marcadas como concluídas.
- E-mail de aviso é independente da exclusão. Falha no envio fica registrada; não prova entrega e não impede a remoção. Não há nova fila de reenvio de e-mail nesta alteração.
- Registros mínimos de auditoria da exclusão continuam no banco. Endereço de e-mail e motivo são removidos do metadado ao concluir a limpeza. Não promete apagar registros sujeitos a retenção.

## Procedimento de ativação (concluído em 16/10)

1. **CONCLUÍDO no banco:** executar **supabase/migrations/20261015180000_account_deletion_retry.sql** no projeto `klmsdcncmhtgnlcejzdi`. É um SQL novo, diferente do SQL das campanhas já executado.
2. **CONCLUÍDO:** as duas funções foram publicadas depois da migração, com os comandos abaixo:

   ```powershell
   npx supabase functions deploy account-delete --project-ref klmsdcncmhtgnlcejzdi --no-verify-jwt
   npx supabase functions deploy account-delete-retry --project-ref klmsdcncmhtgnlcejzdi --no-verify-jwt
   ```

   A primeira valida o JWT com `auth.getUser`; a segunda exige segredo interno. Não ficam sem autenticação. O worker reutiliza `WEB_PUSH_WEBHOOK_SECRET` e a configuração interna `web_push_project_url` / `web_push_webhook_secret`, já usada pelo Oráculo. Confirmar que existem e correspondem, sem expor seus valores.
3. **CONCLUÍDO:** Supabase Auth → URL Configuration: permitir `https://glyph.life/exclusao.html` e `https://www.glyph.life/exclusao.html`. Confirmar que o template Magic Link usa `{{ .ConfirmationURL }}`. Não modificar o template de recuperação de senha. Referência: https://supabase.com/docs/reference/javascript/auth-signinwithotp
4. **CONCLUÍDO, commit eb79645:** publicar os dois arquivos do site pelo processo existente do `glyph-landing`.
5. **VALIDADO, protocolo 102:** criar uma conta descartável própria para teste, inserir perfil/arena/ação/tarefa/arquivo, confirmar a exclusão e consultar ausência de perfil/Auth/arquivo, preservando o protocolo. Não usar conta real de usuário para validar.

## Verificações feitas

- `node tests/account-deletion.regression.mjs`: remoção/verificação de perfil e Auth, manifesto persistido, falhas em dados/perfil/Auth/Storage/listagem, retomada e isolamento de e-mail. Backend simulado.
- `node tests/account-deletion-auth.regression.mjs`: rejeição de tokens ausentes/falsos, identidade derivada do token, duplicação ocupada e segredo do worker. Auth simulado.
- `node tests/account-deletion-site.browser.mjs`: Edge, 390px, senha/link sem exclusão automática, confirmação obrigatória, protocolo de falha e sucesso com limpeza pendente. Auth/backend simulados, sem envio real.
- `npx tsc --noEmit --pretty false`: passou no app. Esse comando não inclui Edge Functions; as funções foram compiladas nos testes acima, não verificadas no runtime remoto.

## Monitoramento após ativação

```sql
select id, status, requested_at, retry_count, retry_after, lease_until,
       metadata->>'auth_deleted' as auth_deleted,
       metadata->>'last_error' as last_error
from public.account_deletion_requests
where status <> 'completed'
order by requested_at;

select jobname, schedule, active from cron.job
where jobname='glyph-account-deletion-retry';
```

Dez falhas consecutivas exigem investigação pelo suporte. O SQL de consulta não executa limpeza.
