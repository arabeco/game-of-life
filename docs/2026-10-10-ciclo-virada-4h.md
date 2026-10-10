# Ciclo: virada às 4h

Decisão do usuário: quem usa o app após meia-noite continua no mesmo dia até 03h59. Às 04h começa o próximo dia operacional.

- Carregamento, criação, edição, ativação, encerramento e seleção de ciclos após exclusão usam a data operacional.
- Ciclo marcado para segunda permanece futuro até segunda às 04h; entra no Dia 1 nesse horário. O último dia permanece disponível até 03h59 da manhã seguinte.
- O relógio React atualiza a data às 04h e ao voltar à tela, sem depender de uma conclusão de tarefa ou de uma chamada ao banco. Atualiza também os resumos e dispara a publicação do snapshot Android.
- A barra de tempo inclui o dia atual (commit anterior 993064d). Dias encerrados permanecem separados. O Oráculo continua informando progresso de ações; seu servidor já usa virada às 04h em America/Sao_Paulo.
- As datas escolhidas no calendário continuam sendo datas, não instantes deslocados. Só a definição de hoje e a elegibilidade do ciclo mudaram.

Validação: TypeScript; regressões de dia do ciclo, motor/leitura do Oráculo e widget diário; teste local em navegador com relógio simulado atravessando 03h59→04h com o hook React montado.

Sem deploy ou teste Android. Com o processo do app suspenso/fechado, este relógio JavaScript não executa; o snapshot é atualizado quando o app retoma. Não foi criado agendamento nativo em segundo plano. O app usa o fuso do aparelho; o servidor do Oráculo mantém o fuso America/Sao_Paulo existente.
