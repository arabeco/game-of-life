# Convites imediatos — 11/10/2026

Regra aprovada: conta vinculada ao convite já conta, sem sete dias de uso. Marcos acumuláveis, uma vez cada: 1 = baú Comum; 5 = baú Raro; 10 = 25 de ouro. O convidado mantém 10 de ouro. A trava de conta nova (código aceito nos primeiros sete dias após cadastro), um único convite por conta e bloqueio do próprio código foram preservados. Essa janela não é espera para liberar prêmio.

Aplicar `supabase/migrations/20261011120000_convites_imediatos.sql` após a migração original de convites. Não foi aplicada remotamente nesta rodada. Contas já vinculadas passam a contar, mantendo os marcos já recebidos. `completaram` é mantido no JSON para compatibilidade, agora com a mesma contagem de `entraram`.

Novo vínculo grava aviso no sino, inclusive se o dono estiver offline, com total e prêmios pendentes e botão Abrir Ajustes. Resgate continua em Ajustes > Resgatar código. A barrinha atualiza ao abrir, voltar ao app e a cada 30 segundos enquanto visível. Bolinhas 1/5/10 iluminadas indicam prêmios disponíveis, com instrução explícita de resgate.

Ao tocar a bolinha, o servidor concede uma vez. Após confirmação, o modal de cupom fecha e o RewardPackModal existente apresenta baú guardado no Arsenal ou ouro recebido. Repetição já resgatada não dispara nova celebração. Não abre o baú automaticamente.

A leitura nativa do Install Referrer já existe no checkout atual; a informação anterior de que estava pendente era desatualizada. Regressão local passou; não representa teste de instalação via Play Store.

Validação: migração executada em PGlite, sem tabela de dias de uso; progressão 1/5/10, resgate duplicado, próprio código e segundo uso bloqueados, dez notificações para dez vínculos. TypeScript e regressões existentes de convite e referrer passaram. Não houve build Android, publicação ou alteração do site nesta rodada.
