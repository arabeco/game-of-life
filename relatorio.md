============================================================
           GLYPH: MASTER SYSTEM STATE (20/05/2026)
============================================================
STATUS: [ ] ALPHA  |  [X] BETA FECHADO ACEITO  |  [ ] LIVE
FASE:   [X] FUNDACAO (T1) | [ ] CERCO | [ ] ASCENSAO
------------------------------------------------------------

## 1. FASE ATUAL: FECHAMENTO DA VERSAO FINAL
- O closed test foi aceito pela Google Play.
- A prioridade agora e fechar `1.0.36 / 36` com o menor numero possivel de pontos cegos.
- Regra desta fase: corrigir P0/P1 e polish visivel que afeta confianca. Nada de reimaginar sistema inteiro.

## 2. O QUE MUDOU NESTE CORTE
[x] Confirmacao de exclusao de ciclo foi elevada para a camada superior de modal.
[x] Miniaturas compactas de arena receberam fundo mais solido, brilho e saturacao.
[x] Planner ganhou placar discreto de EXP diaria.
[x] Placar diferencia `EXP hoje` de `EXP depositada`.
[x] Contador anima quando o valor muda; o haptic continua vindo do evento real de completar acao.
[x] Prompt do Oraculo ficou mais vivo, especifico e menos robotico.
[x] `status.md` foi atualizado para refletir closed test aceito e versao 36.

## 3. COMO A EXP ESTA COMPUTANDO
- Completar uma acao marca a tarefa como concluida e dispara feedback sensorial.
- A EXP nao vai direto para a nobreza nesse momento.
- Antes do fechamento do Painel Diario, o Planner mostra uma estimativa de EXP do dia.
- Ao gerar o score final do Painel Diario, o app grava `daily_commitments.exp_deposited` e soma no estoque do ciclo.
- Se dias anteriores do ciclo ficaram sem julgamento, o app reconcilia automaticamente esses dias quando hidrata o ciclo e encontra tarefas historicas.
- No fim do ciclo, o estoque do ciclo entra no relatorio e vira ganho final, com boosts aplicaveis.

## 4. RISCOS ABERTOS
[!] `Push duplicado`: navegador + app podem receber para o mesmo usuario se ambos estiverem inscritos.
[!] `Clan`: precisa smoke final de criar/entrar/pedir/aprovar e checar missao compartilhada.
[!] `Premium`: precisa smoke de paywall, estado premium e promessa de billing/recompensa.
[!] `Campanhas`: precisa smoke de instalar campanha, criar arenas/acoes e concluir pelo fluxo real.
[!] `Oraculo`: voz melhorada no prompt, mas qualidade final depende de testar mensagens reais.

## 5. SMOKE FINAL RECOMENDADO
[ ] Abrir localhost e confirmar que o modal de excluir ciclo fica na frente.
[ ] Criar/adicionar varias arenas e confirmar que as miniaturas nao parecem apagadas.
[ ] Completar uma acao no Planner e ver o placar de EXP subir.
[ ] Abrir/fechar Painel Diario e confirmar que o placar troca para `EXP depositada`.
[ ] Fazer smoke de Clan.
[ ] Fazer smoke de Premium.
[ ] Fazer smoke de Campanhas.
[ ] Verificar uma notificacao real no app e outra no navegador para decidir politica por dispositivo.
[ ] Rodar build antes de qualquer sync Android.

## 6. DECISAO
O produto nao esta "pequeno"; ele esta grande o suficiente para dar medo. A resposta tecnica e reduzir a reta final a um smoke curto, repetivel e honesto: ciclo, planner, EXP, historico, campanha, clan, premium e push.
