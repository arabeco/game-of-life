# Exclusão, widget e push — fechamento de 16/10/2026

## Exclusão: publicada e comprovada com conta descartável

- Site `https://glyph.life/exclusao.html` publicado pelo commit `eb79645` do repositório `arabeco/glyph-landing`. Somente `exclusao.html` e `exclusao.js` entraram no commit. Ambos foram conferidos por HTTP 200 e correspondem ao checkout local.
- Retornos `https://glyph.life/exclusao.html` e `https://www.glyph.life/exclusao.html` adicionados à configuração do Auth, preservando os anteriores. Template Magic Link confirmado com `ConfirmationURL`.
- Teste **real no site publicado**, com usuário criado exclusivamente para esta validação: login com senha, confirmação de exclusão, resposta de sucesso, protocolo **102**, `completed`, sem limpeza pendente.
- Consultas administrativas após a exclusão confirmaram ausência do perfil, usuário Auth, arenas, ações, tarefas, campanha e arquivo no Storage pertencentes à conta descartável.
- Evidência: `output/functions-audit-2026-10-15/disposable-live-test.json`; teste reproduzível e com limpeza restrita ao próprio UUID: `tests/account-deletion-widget.live.cjs`.
- Nenhuma conta preexistente foi usada. O e-mail sintético `@gol.local` é recusado pelo handler Resend antes da chamada ao provedor; `deletionEmailStatus: failed` neste teste é esperado. **Não comprova entrega de e-mail nem recebimento do link mágico.** O teste da limpeza pendente é simulado; a exclusão real terminou sem falha de Storage.
- Backend: `account-delete` v31, `account-delete-retry` v1; cron de 15 minutos ativo. O limite de dez tentativas e a necessidade de intervenção após esgotá-las continuam documentados em `2026-10-15-exclusao-integrada.md`.

## Widget: bloqueios publicados e testados no servidor

- `widget-action` v4 verifica dono/arena, arquivamento, estado da campanha, bloqueio explícito e pré-requisitos antes de gravar uma conclusão.
- A regra de progresso foi extraída sem alteração inicial para `supabase/functions/_shared/campaignProgress.js`. O app importa a mesma implementação através de `utils/progressUtilsEngine.js`.
- Importadas usam todo o histórico; campanhas pessoais usam o ciclo aberto mais recente. Leituras de ações e tarefas são paginadas. Falha de leitura bloqueia a gravação.
- Teste real com a conta descartável: arena arquivada recusada; pré-requisito incompleto recusado sem criar tarefa; pré-requisito concluído liberou a ação; campanha arquivada recusada.
- Esses testes validam a função remota, não o gesto ou layout do widget no aparelho Android.

## Push: retentativa curta e conservadora publicada

- `web-push` v37: no máximo três tentativas, somente em respostas explícitas HTTP 500/503. Espera crescente com jitter e respeito a `Retry-After`; se a espera pedida exceder cinco segundos, deixa registrado o erro em vez de repetir cedo demais.
- FCM agora preserva o código HTTP no erro, permitindo classificação e desativação corretas.
- Sucesso não é repetido. Timeout/erro de rede sem resposta não é repetido, pois pode já ter sido entregue. 429, token expirado e falhas de autenticação não entram nesta retomada curta.
- Não reenvia o histórico de erros nem reabre reservas `sent`/`pending`. Uma fila durável para quotas/indisponibilidade longa ainda é trabalho separado.
- Os testes usam envio e relógio simulados; **nenhuma notificação real foi disparada para teste**. Referência para resposta temporária e espera: https://firebase.google.com/docs/cloud-messaging/error-codes

## Validação local

- `tests/account-deletion.regression.mjs`, `tests/widget-arena-access.regression.mjs`, `tests/campaign-lifecycle.regression.mjs` e `tests/push-retry.regression.mjs`: passaram.
- `tests/arena-progress-presentation.regression.mjs`: passou após separar repetições realizadas de progresso elegível. O card pode mostrar `8/7`; exceder uma ação não compensa outra incompleta nem libera fase indevidamente. Essa apresentação é código local do app, não um novo AAB.
- `npx tsc --noEmit --pretty false`: passou.
- Build Vite verificado nesta rodada; avisos já existentes de imports estáticos/dinâmicos e chunk vazio.

Continua pendente o segredo verdadeiro de assinatura do webhook Mercado Pago. Não foi inventado, alterado nem testada compra/cobrança.
