# E-mails essenciais — 12/10/2026

## Escopo aprovado

Recuperação de senha para quem criou senha no Glyph; confirmação de exclusão também para contas Google/Apple. Novidades não foi ativado. A conta pessoal de Afonso usa Google, portanto nenhum e-mail de recuperação foi enviado a ela.

## Código preparado

- Login explica o uso de senha própria e o botão Google, remove espaços do e-mail, impede clique durante envio e usa resposta neutra (não confirma existência da conta).
- Supabase Auth continua responsável por recuperação; SMTP remoto já está ativado com Resend/465, conferido no painel. Não alteramos credencial, plano ou limite. Entrega real e percurso do link ainda pendentes em uma conta de teste com senha.
- Função resend agora aceita somente POST autenticado com a chave de servidor, apenas account_deleted. Não permite campanhas, assunto livre ou envio pelo navegador.
- Reutiliza notification_email_dispatches com status/provider_email_id/updated_at; reservas antigas ficam legacy_unknown. Não cria tabela nova nem concede acesso a usuários.
- Até três tentativas por chamada com mesmo corpo e Idempotency-Key, timeout de 8 segundos por tentativa. Accepted significa aceito pelo provedor, não entregue na caixa postal. Repetição aceita não reenvia; após 23 horas exige conciliação, pois a garantia do Resend é de 24 horas. Sem agendador de reenvios nesta etapa.
- Exclusão não depende do envio. Falha de Storage gera cleanup_pending com arquivos conhecidos registrados e texto honesto; ainda falta trabalhador de limpeza e acompanhamento de interrupções entre etapas. Não considerar fluxo completo encerrado.
- Serviço do app só aceita success=true como confirmação; não afirma que nenhum dado foi removido em uma falha de resposta.

## Aplicação

1. Afonso executa supabase/migrations/20261012180000_email_dispatch_state.sql inteiro (três colunas na tabela existente).
2. Após confirmação, publicar resend e account-delete. Ordem: resend, depois account-delete. Sem publicação automática antes do SQL.
3. Alterações de interface exigem distribuição posterior ao AAB 110. Conferir mudanças simultâneas do Claude antes de novo pacote.
4. Testar recuperação com conta própria de e-mail/senha e exclusão com conta descartável explicitamente autorizada. Não enviar confirmação falsa de exclusão nem apagar conta real para testar.

## Evidência

Tests: tests/deletion-email.regression.mjs executa handler com rede/banco simulados e migração em PGlite; cobre autorização, falha de persistência, resposta perdida, repetição, retentativa, janela vencida, escape HTML e RLS/grants. tests/apagar-conta.regression.mjs passou. Isso não prova implantação ou entrega real.

Referência de idempotência: https://resend.com/changelog/idempotency-keys (24 horas, mesmo corpo e chave).

## Implantação confirmada

Afonso executou o SQL e retornou as três colunas esperadas. Publicadas no projeto klmsdcncmhtgnlcejzdi: resend versão 18 e account-delete versão 29, ambas ACTIVE. Checagem real com chave pública e corpo vazio retornou 401/unauthorized em resend e 401/Unauthorized request em account-delete. Nenhum destinatário ou usuário foi fornecido; não houve envio nem exclusão. Mudanças da interface ainda dependem de distribuição posterior ao AAB 110. Fluxo completo de pedido do site e limpeza pendente continuam abertos.
