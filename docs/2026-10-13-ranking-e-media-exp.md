# Tags Top e média pessoal de EXP — 13/10/2026

## Implementado localmente

- Painel Diário: texto junto da EXP com porcentagem acima/abaixo da média pessoal, ou “Na sua média de EXP”. Hoje recebe “parcial”.
- Relatório do ciclo: média de EXP/dia em relação aos ciclos anteriores no slide Conquistas e na placa final compartilhável. A comparação é liberada para todos; o comparativo Platinum já existente permanece intacto.
- Tags oficiais: Top 1%, Top 5% ou Top 10%, somente a melhor faixa atingida. Maestria na visão própria e no cartão capturado; clã no cabeçalho; ciclo em Conquistas e na placa compartilhável.
- Afonso escolheu **EXP total** para a tag do ciclo. O percentual contra a própria média usa EXP/dia: são perguntas diferentes.
- Tags são posições atuais, não conquistas permanentes. Atualizam ao montar a tela, mudar o valor local, voltar à aba/app e a cada cinco minutos enquanto a tela estiver visível. Sem conexão realtime nem lista de terceiros no cliente. Imagem já compartilhada permanece como foi capturada.
- O hook descarta respostas de consultas antigas/troca de conta e valores que não correspondem ao dado local. Ausência da RPC, falha, média zero ou base insuficiente ocultam o indicador, sem inventar posição.

## Regras verificáveis

| Indicador | Base |
|---|---|
| Média diária | Até 30 dias anteriores ao dia escolhido, desde a criação da conta. Mínimo 7 dias. Dias sem ação valem zero. Exclui o dia comparado. |
| EXP diária | Mesma regra do cálculo central: duração positiva da tarefa ou duração da ação, multiplicador de dificuldade, Livre sem EXP. Virada operacional às 4h. |
| Média de ciclo | EXP depositada nos ciclos anteriores fechados / dias corridos entre o começo do primeiro ciclo válido e a véspera do ciclo comparado. Inclui dias sem atividade e intervalos entre ciclos. Mínimo 2 ciclos anteriores e 7 dias; período comparado excluído. |
| Top ciclo | EXP **total** do ciclo; um ciclo por jogador, mesma duração, fechado nos últimos 90 dias. Usa o ciclo comparado para a própria conta e o mais recente elegível dos demais. Relatórios mais antigos conservam a média pessoal, mas não recebem tag atual. |
| Top Maestria | Índice atual, `user_profiles.level * 2`, limitado a 0–100, conforme índice existente. |
| Top clã | EXP acumulada do clã. Só entram clãs com ao menos um membro elegível; não há recompensa por posição. |

População mínima para as tags: 100 jogadores/clãs elegíveis, preservando o cuidado existente com percentis em bases pequenas. Empates ocupam a última posição do grupo; 100 pessoas empatadas não recebem todas Top 1%. Filtros reutilizam o comparativo diário: papel user, exclusão de padrões de teste e daily_comparison_exclusions. Contas GM não recebem essas tags. Médias pessoais continuam disponíveis para a própria conta independentemente do filtro de ranking.

O histórico é o que está persistido: ações apagadas não reaparecem na média diária, e relatórios de ciclos apagados não entram na média de ciclos. Comparação pessoal de ciclos usa a EXP histórica depositada, que pode conter regras de bônus de versões anteriores. Não é uma reconstrução de ganhos sob uma regra econômica única.

## SQL a aplicar

`supabase/migrations/20261013200000_progress_recognition.sql`

Cria `get_progress_recognition` e um extrator interno do relatório. Somente authenticated chama a RPC pública; identidade vem de auth.uid(), não de um parâmetro de usuário. Relatório alheio é recusado, clã é resolvido pela participação. Retorno contém apenas agregado e dados próprios. Não cria tabelas, prêmios, cron, lista nominal ou leitura pública de perfis.

**Execução confirmada por Afonso em 13/10/2026 (“rodei”).** Sem consulta remota adicional nesta confirmação. Reabrir/recarregar o app para repetir a consulta caso a RPC estivesse ausente na sessão anterior. Resta distribuir o código novo; o AAB 111 já existente não contém esta rodada.

## Ajuste necessário de paridade

Painel Diário e resumo do Planner estavam deixando o snapshot aplicar o bônus padrão de 10%, apesar de os planos atuais terem bônus zero. Ambos passam a fornecer `getCycleXpBonusRate(userProfile)` explicitamente. Não altera economia nem concessão: alinha a exibição com a regra vigente e com a base da comparação.

## Validação

- Regressão com PostgreSQL local PGlite: migração aplicada duas vezes; permissões, identidade, mínimos, empates, mudança/desaparecimento de tag, ciclo de duração diferente, média sem período atual, dias vazios e virada às 4h.
- Teste React/Edge com RPC simulada: Top 1 → Top 5 → sem tag, retorno tardio após troca de conta, ausência da migração; fixture visual móvel de 390px sem overflow, com componentes reais e texturas locais. Captura: `output/progress-recognition/mobile.png`.
- TypeScript, build web e core-loop conferidos nesta rodada (resultado final registrado na prancheta).
- Nenhuma prova de SQL remoto, app Android instalado, concessão de prêmio ou compartilhamento real. Sem push/commit/AAB nesta rodada.
