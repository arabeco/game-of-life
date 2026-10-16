# Conquistas secretas no evento certo

Pedido: Imparável apareceu horas depois, ao reabrir o app. O hook anterior só conferia quando o perfil carregava ou mudava a quantidade de relatórios. Não havia gatilho na conclusão da ação.

## Implementado localmente

- `utils/eventosDeSegredos.ts` associa todas as condições aos eventos ação, diário, humor, amizade, vínculo, missão e ciclo. Recuperação avalia todas as ainda não descobertas.
- Conclusões do Planner, estoque, horário escolhido e marcos emitem somente depois da escrita confirmada. Desmarcar e falhar ao gravar não emitem. Diário emite após salvar uma página com pelo menos 100 caracteres; humor após insert confirmado.
- Amizades acompanham a lista confirmada; vínculos e competições usam os avisos já existentes e notificações de resultado. Missão individual dispara depois do resgate confirmado pelo servidor. Ciclos acompanham os relatórios, adicionados após confirmação do fechamento.
- Mentorias têm um timer para o próximo vencimento, consultando apenas `expires_at` da mentoria própria aberta. Ao vencer, confere e agenda o próximo prazo. Sem polling contínuo.
- Uma fila serial agrupa eventos próximos e conserva eventos que chegam durante uma consulta. Regras já descobertas não são reavaliadas. A entrega usa o caminho de inventário existente; confere itens já presentes no banco antes de conceder, inclusive se a hidratação local ainda não terminou, e não marca descoberta quando a entrega de um item falha.
- Os modais aguardam o relatório e seguem para a fila de celebrações existente. Troca de conta cancela consultas/timers pendentes e não apresenta modais da conta anterior.
- Abertura e `visibilitychange` para visível mantêm a recuperação. Não há fila offline nova: falhas são recuperadas no próximo evento pertinente ou retomada.

O RPC `minhas_marcas_secretas` existente ainda devolve o agregado completo; o filtro de regras é por evento no cliente. Não foi criada migração, alterada a condição de 30 dias ou instalada nova função no servidor. A entrega continua pelo mecanismo atual, não por uma nova transação de resgate; os testes de não repetição cobrem a sessão local, não concorrência de dois aparelhos.

## Verificação

- TypeScript e build web principal passaram.
- Regressões medidor-de-segredos, regras-de-desbloqueio, journal-egress e core-loop passaram.
- `tests/segredos-por-evento.browser.mjs` usa React real e banco simulado: 29→30 dias durante uma consulta, entrega sem reabrir, modal aguardando relatório, eventos repetidos, evento de outra conta ignorado, escopos diário/humor/amizade/missão/competição/ciclo e prazo de mentoria.
- O mesmo teste executa as funções reais de persistência de ações e diário com respostas simuladas de sucesso/falha, cobrindo toggle, undo, estoque, horário escolhido, marco e limite de 100 caracteres.

Não alterou conta real nem concedeu prêmio real. **Não está no AAB 111 já gerado**: exige próximo build/distribuição. Sem novo AAB, commit ou push nesta rodada.
