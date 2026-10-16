# Validação de mensageria — 16/10/2026

- Usuário autorizou teste somente na conta Mister X e em misterxhermit@gmail.com.
- Push: registro Android ativo localizado por e-mail no Auth. Envio pela função web-push, ID fixo glyph-authorized-test-20261016-misterx-01: HTTP 200, sent=1, failed=0. Pendente confirmação visual no aparelho.
- Mercado Pago: segredo presente; sem assinatura retornou Invalid signature. Pendente simulação assinada pelo painel. HTTP 200 sozinho não prova assinatura válida, pois o handler também responde 200 ao recusá-la.
- Auth SMTP: smtp.resend.com:465, remetente contato@glyph.life. Senha é mascarada na leitura de configuração; não houve envio pela API com ela.
- Resend: publicado delivery_test neutro, sob a mesma autenticação administrativa e idempotência da função. Testes locais passaram. Chamada remota com service_role retornou 401 unauthorized antes do provedor. Nenhum e-mail enviado. Ainda não determinada a causa da divergência da credencial; não afirmar que o fluxo interno de exclusão falha só com esse teste.
- Tentativa de adicionar autenticação alternativa compartilhada exclusivamente para teste foi rejeitada pela revisão automática por ampliar a superfície de autenticação. Alterações dessa alternativa retiradas do código local; não publicadas. Autenticação original mantida.
- Retomar diagnóstico da autenticação original do Resend e teste de recebimento. Não há prova de entrega por Resend, link mágico ou SMTP real nesta rodada.

## Continuação no painel

- Resend já autenticado: domínio glyph.life Verified; chave existente supabase-connect, sem revelar/criar/rotacionar credencial.
- Teste oficial da Edge Function com apikey existente e delivery_test para o endereço autorizado retornou 401 {error: unauthorized}. Mesmo bloqueio anterior ao provedor; não prova falha da chave RESEND_API_KEY nem da entrega SMTP.
- Autenticação original preservada. Próximo passo é reconciliar a credencial administrativa usada pelo chamador com a configuração real da função, sem introduzir um segundo segredo de acesso.
- Mercado Pago: usuário executou simulação oficial payment.updated com data.id=0 e recebeu 200. Log mostra tentativa de buscar pagamento 0 e status400 na API. Isso confirma passagem pela validação da assinatura nessa simulação, não uma cobrança/entrega de produto real.

### Confirmação pelo fluxo interno de exclusão — protocolo 103

- Usuário autorizou criar/excluir somente misterxhermit+glyph-teste@gmail.com. Criada conta nova com marcador exclusivo; nenhuma conta existente reutilizada.
- account-delete autenticado pela própria conta: HTTP 200, success=true, cleanupPending=false, deletionEmailStatus=accepted.
- Auth e user_profiles ausentes após a operação; protocolo completed e status de e-mail accepted persistido.
- Registro public.notification_email_dispatches v2:account-deleted:103: accepted, provider_email_id=01a14692-243f-7064-9ed8-130a461a00bf.
- A hipótese de falha do fluxo interno por causa do 401 do teste externo não se confirmou. Nenhuma mudança na autenticação ou credenciais foi necessária.
- Falta confirmação humana de recebimento; accepted prova aceitação pelo provedor, não chegada à caixa. Recuperação de senha/SMTP permanece uma verificação separada. Teste backend, sem UI Android nesta rodada.
- Evidência: output/deletion-email/live-report.json.
