# Auditoria das funções publicadas — 15/10/2026

Consulta remota autenticada pela sessão existente da CLI. Cópias pré-alteração em `output/functions-audit-2026-10-15/supabase/functions`, relatório sem credenciais em `report.json`. Comparação de entrada com o checkout: sete funções iguais, `account-delete` diferente pelas alterações locais desta rodada. Isso não é garantia de igualdade de todos os módulos compartilhados.

## Achado corrigido em produção

`get_internal_runtime_config(text)` permitia leitura anônima do segredo dos webhooks. A consulta com chave pública retornou HTTP 200. O valor não foi exibido nem persistido no relatório. Aplicada a migração `20261015200000_restrict_internal_webhook_config.sql`, restringindo essa função e `enqueue_oracle_automatic_feed_webhook()` ao backend. O cron continua executando como antes.

O segredo `WEB_PUSH_WEBHOOK_SECRET` foi rotacionado, com novo valor aleatório sincronizado entre Edge Secrets e `internal_runtime_config`. A leitura anônima passou a HTTP 401. Uma chamada com o segredo novo e SEM destinatário retornou HTTP 400 de payload inválido, comprovando que passou pela autenticação, sem enviar push.

A atualização de secrets incrementou as versões das funções; não significa mudança no código de todas elas.

## Funções

| Função | Versão após revisão | Papel / observações |
| --- | --- | --- |
| web-push | 36 | Web Push e FCM Android. VAPID e credenciais FCM separadas presentes; JSON único de conta de serviço é alternativa, não requisito faltante. Registro exige usuário; disparos internos exigem segredo. |
| oracle | 49 | Feed automático; agendador ativo a cada dez minutos. Rota antiga de chat responde 410 por desenho atual. |
| oracle-command | 5 | Converte texto em rascunho local de comando; não chama IA, não grava no banco. Não faz autenticação no handler; não confundir com executor autorizado de ações. |
| resend | 19 | E-mail de exclusão, somente backend. Usa remetente padrão quando RESEND_FROM_EMAIL não está configurado. Nenhum e-mail foi enviado nesta auditoria. |
| account-delete | 31 | Nova versão publicada nesta rodada; pipeline compartilhado com retomada, protocolo e verificação de perfil/Auth. |
| account-delete-retry | 1 | Novo worker publicado; SQL e colunas confirmados no banco, cron ativo a cada 15 minutos. |
| google-play-purchase | 4 | Validação das compras na Google e crédito pelo backend. Credenciais de conta de serviço separadas presentes; as variáveis OAuth/JSON ausentes são rotas alternativas. Não foi feita compra/reembolso. |
| mercadopago | 36 | Token configurado, valida usuário e consulta pagamento na API oficial. **MERCADO_PAGO_WEBHOOK_SECRET ausente**: a verificação de assinatura é ignorada nessa configuração. URL de webhook usa fallback definido no código. Falta obter o segredo real do painel Mercado Pago e configurá-lo; não inventar um valor. |
| widget-action | 3 | Confirma ação do usuário. No código publicado não consulta arquivo da arena nem pré-requisitos de campanha antes de escrever tarefa. Precisa alinhar ao domínio do app; revisão estática, sem tentativa de burlar em conta real. |

## Push: evidência e limites

- 27 inscrições consultadas: 2 ativas, ambas sem `last_error`; 25 desativadas.
- 19 inscrições têm histórico de sucesso; último sucesso registrado em **15/10 às 14h40 de Brasília**.
- Notificações comuns: 42 `sent`, 8 `error`.
- Mensagens do Oráculo: 230 `sent`, 6 `error`.
- Os erros nas inscrições consultadas estão entre inscrições desativadas; há tokens substituídos/expirados. Esses contadores são históricos, não taxa atual nem prova de visualização no aparelho.
- Reservas duplicadas em `reservePushDispatch` / `reserveOraclePushDispatch` são ignoradas mesmo se o registro anterior ficou `error` ou `pending`. Não há retomada nesse trecho; falhas transitórias merecem uma política de retry com idempotência. Não implementada nesta auditoria.
- Testes sem autenticação retornaram 401 nas rotas de registro/disparo de push, exclusão, Resend, widget e Google Play. Os testes não enviaram mensagens nem executaram compras/exclusões.

## Exclusão e próximos passos

O SQL `20261015180000_account_deletion_retry.sql` foi confirmado aplicado, e as duas funções foram publicadas. Permanecem: ativação/publicação do site, configuração do retorno de autenticação e teste completo com conta descartável. Não apagar contas reais para comprovar o fluxo. Histórico observado: 88 pedidos `completed`, 2 `started`, 3 `failed`; esse status histórico isolado não prova ausência dos dados correspondentes.

Não foram removidos secrets antigos, alterados pagamentos, enviados pushes/e-mails ou excluídas contas nesta auditoria.
