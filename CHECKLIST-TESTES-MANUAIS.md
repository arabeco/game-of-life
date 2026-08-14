# Checklist de testes manuais do Glyph

Use este documento para todo teste em aparelho real. Marque cada item somente depois de observar o resultado esperado. Registre ao lado o aparelho, a versao do app, a conta usada e qualquer erro encontrado.

## Preparacao

- [ ] Instalar a versao mais recente do AAB em pelo menos um celular Android real.
- [ ] Separar duas contas de teste para os fluxos sociais.
- [ ] Anotar o saldo inicial de ouro, EXP, baus e nivel das duas contas.
- [ ] Confirmar que a internet esta ativa e que o app aponta para o Supabase correto.

## 1. Entrada e onboarding

- [ ] Criar uma conta nova e concluir termos, perfil e entrada inicial.
- [ ] Confirmar que o app abre em `Ativos`.
- [ ] Seguir o onboarding sem precisar procurar botoes fora do caminho indicado.
- [ ] Criar a primeira arena e uma acao durante o fluxo.
- [ ] Escolher uma das missoes iniciais ou escolher nenhuma.
- [ ] Concluir o onboarding e confirmar que ele termina na Rest Screen.
- [ ] Fechar e abrir o app; o onboarding completo nao deve aparecer novamente.
- [ ] Abrir `Configuracoes > Tutoriais` e confirmar que os tutoriais continuam acessiveis.

Resultado esperado: em poucos minutos a pessoa possui arena, acao e um proximo passo claro, sem telas mortas ou repeticao do tutorial.

## 2. Ativos e arenas

- [ ] Confirmar que aparecem exatamente cinco Ativos.
- [ ] Conferir os cartoes em celulares estreitos, largos, baixos e altos.
- [ ] Confirmar que titulo, medalhao, quadrados, emojis e barra nao se sobrepoem.
- [ ] Criar arenas em cada Ativo e conferir contagem, emojis e total de acoes.
- [ ] Criar mais de tres arenas no mesmo Ativo e confirmar que os emojis quebram em linhas sem aumentar o cartao.
- [ ] Abrir cada Ativo e conferir fundo, nivel, arenas e progresso.
- [ ] Editar, arquivar e excluir uma arena comum e conferir a atualizacao das contagens.

Resultado esperado: os cinco cartoes permanecem proporcionais em qualquer tela e refletem os dados reais.

## 3. Acoes e Planner

- [ ] Criar acao com repeticoes e criar acao livre.
- [ ] Agendar, mover, devolver para a lista e remarcar uma acao.
- [ ] Alternar entre grade de horarios e lista simples sem perder ordem ou horario salvo.
- [ ] Usar a visualizacao diaria e semanal nos dois modos.
- [ ] Completar uma acao agendada e uma acao sem horario.
- [ ] Desfazer e concluir novamente; EXP e contadores devem recalcular sem duplicar.
- [ ] Mover uma acao incompleta para um dia anterior e conclui-la.
- [ ] Confirmar que somente a acao ja julgada fica travada, nunca o dia inteiro.

Resultado esperado: nenhuma combinacao duplica EXP, devolve acao concluida para a baia ou mostra a mensagem antiga de dia julgado.

## 4. Ciclos e resumo diario

- [ ] Iniciar ciclo curto e conferir datas, metas, tempo e progresso.
- [ ] Alterar metas ainda nao julgadas durante o ciclo.
- [ ] Abrir o painel diario e conferir o resumo de ontem antes dos dados de hoje.
- [ ] Confirmar a virada do dia as 4h sem travar a edicao das acoes abertas.
- [ ] Fechar um ciclo com desempenho baixo, medio e completo.
- [ ] Conferir nota, EXP e ouro segundo carga, dias ativos e desempenho real.
- [ ] Escolher `Novo ciclo`, `Zerar metas` e `Sair` em testes separados.
- [ ] Excluir um ciclo recente e um ciclo antigo; os outros ciclos nao podem alterar seu estado.
- [ ] Confirmar que excluir uma arena atual nao altera o registro de um ciclo ja fechado.

Resultado esperado: cada ciclo fechado e imutavel, e nenhum comando restaura metas de um ciclo anterior por engano.

## 5. Missoes e recompensas

- [ ] Escolher uma missao inicial e confirmar o pequeno aviso de missao aceita.
- [ ] Confirmar que apenas a missao escolhida aparece junto das missoes automaticas da temporada.
- [ ] Completar os requisitos de arena, sequencia e quantidade de acoes.
- [ ] Confirmar que a missao conclui e entrega a recompensa automaticamente, sem botao `Resgatar`.
- [ ] Conferir que insignias de missao e ciclo acumulam corretamente no inventario.
- [ ] Abrir o bau recebido e confirmar som, item, inventario e ausencia de duplicidade.
- [ ] Forcar mais de uma conquista no mesmo momento e conferir a fila: missao, nivel e demais modais nunca se sobrepoem.

Resultado esperado: toda recompensa aparece uma vez, entra na conta e respeita a fila visual.

## 6. Oraculo

- [ ] Tocar no icone superior e abrir o Oraculo sem precisar repetir o toque.
- [ ] Enviar mensagem, receber resposta e pedir um card de conteudo.
- [ ] Confirmar o limite diario dos cards premium.
- [ ] Abrir o Planner em dias e situacoes diferentes e observar se as falas sao ocasionais, curtas e ligadas ao progresso real.
- [ ] Conferir os tres niveis de presenca: minimo, equilibrado e completo.
- [ ] Confirmar que fala do Oraculo usa balao fino; erros serios do sistema usam aviso do sistema.
- [ ] Abrir a aba do Oraculo sobre a Rest Screen.

Resultado esperado: o Oraculo ajuda sem falar em toda entrada, sem criar tarefas pela pessoa e sem bloquear outros controles.

## 7. Mentoria

- [ ] Conta A convida a conta B para mentoria e B aceita.
- [ ] O orientado escolhe a propria arena depois do aceite.
- [ ] O mentor visualiza o progresso e conversa, mas nao cria, edita ou apaga acoes do orientado.
- [ ] O orientado troca a arena acompanhada e mantem seus dados.
- [ ] Qualquer lado encerra a mentoria sem excluir a arena original.

Resultado esperado: mentoria e acompanhamento continuo, sem prazo e sem controle do mentor sobre as tarefas.

## 8. Parceria

- [ ] Conta A convida a conta B e B aceita.
- [ ] Cada conta escolhe sua propria arena.
- [ ] As duas pessoas enxergam os dois progressos com donos claramente identificados.
- [ ] Cada pessoa edita ou troca apenas a propria arena.
- [ ] Alterar metas nao encerra a parceria nem modifica a arena do outro.
- [ ] Encerrar a parceria preserva as arenas e o progresso de cada conta.

Resultado esperado: parceria nao possui prazo nem vencedor; ela permanece flexivel e pode ser encerrada a qualquer momento.

## 9. Desafio

- [ ] Conta A escolhe uma arena, uma pessoa e qualquer prazo entre 1 e 30 dias.
- [ ] Confirmar que enviar o convite nao cobra ouro.
- [ ] Conferir na conta B o nome da arena, prazo, execucoes e recompensa antes de aceitar.
- [ ] Aceitar e confirmar que 50 de ouro saem apenas da conta A nesse momento.
- [ ] Confirmar que o prazo comeca no aceite e que surgem duas copias identicas e seladas.
- [ ] Tentar editar as metas depois do aceite; a alteracao deve ser bloqueada.
- [ ] Completar primeiro com uma conta e conferir vencedor, EXP, bau e modal pequeno de resultado.
- [ ] Em outro teste, deixar o prazo terminar e conferir a maior porcentagem ou empate.
- [ ] Confirmar que conclusoes feitas depois do prazo nao entram no resultado.
- [ ] Tentar dois aceites simultaneos e confirmar que apenas um desafio fica ativo.
- [ ] Alterar a arena original antes do aceite; o convite antigo deve pedir reenvio.
- [ ] Conferir que as copias encerradas ficam arquivadas e que o historico permanece visivel.

Resultado esperado: desafio sempre possui prazo escolhido, comeca no aceite, nao pode ser manipulado e recompensa somente uma vez.

## 10. Cla e social

- [ ] Criar ou entrar em um cla, convidar membro e aceitar pela outra conta.
- [ ] Confirmar fotos, lista de membros, nivel, fundo e permissoes.
- [ ] Fechar um ciclo e conferir que somente entao a EXP correspondente contribui para o cla.
- [ ] Excluir ou remover um membro comum sem afetar o cla.
- [ ] Excluir a conta do lider e confirmar transferencia segura da lideranca.
- [ ] Testar amizade, aceitar, excluir, mensagens diretas e bloqueio.

Resultado esperado: recursos escondidos continuam escondidos e as funcoes visiveis nao deixam cla ou relacoes em estado invalido.

## 11. Relatorios e Legado

- [ ] Fechar ciclo junto com subida de nivel e missao; cada cena deve esperar a anterior.
- [ ] Conferir slideshow, duracao, vibracao, audio e transicoes.
- [ ] Abrir um ciclo curto e outro acima de sete dias no Legado.
- [ ] Conferir mapa de dias, horarios, arenas e acoes contra o que realmente foi feito.
- [ ] Alterar nickname, foto, nivel, cla e arenas atuais; ciclos antigos devem manter suas fotografias historicas.
- [ ] Excluir um ciclo e confirmar que somente ele desaparece do Legado.
- [ ] Conferir placa atual e placas historicas sem textos cortados ou dados inventados.

Resultado esperado: o Legado funciona como memoria fiel, nao como leitura do estado atual da conta.

## 12. Widget e notificacoes

- [ ] Adicionar o widget e conferir as acoes disponiveis sem abrir o app.
- [ ] Concluir uma acao pelo widget e confirmar horario, EXP e sincronizacao ao abrir o app.
- [ ] Testar lembrete de acao, sequencia, ciclo e mensagens sociais.
- [ ] Tocar em cada notificacao e confirmar que ela abre o destino correto.
- [ ] Conferir icone, texto, duplicidade e nivel de presenca do Oraculo.

Resultado esperado: widget e notificacoes reduzem friccao sem pressionar ou gerar avisos repetidos.

## 13. Conta, seguranca e monetizacao

- [ ] Recuperar senha e confirmar que somente o email necessario e enviado.
- [ ] Excluir uma conta pelo app e confirmar remocao de perfil, autenticacao, relacoes e arquivos pessoais.
- [ ] Tentar entrar novamente com a conta excluida e confirmar o comportamento esperado de nova conta.
- [ ] No teste fechado, comprar ouro e confirmar cobranca, entrega unica e persistencia.
- [ ] Cancelar, repetir e restaurar compra sem duplicar moedas.
- [ ] Comprar Premium e restaurar em reinstalacao ou segundo aparelho.

Resultado esperado: nenhuma compra e considerada pronta apenas porque cobrou; entrega, persistencia e restauracao precisam passar.

## 14. Medicao final

- [ ] Anotar PostgREST Egress, Cached Egress, Storage, banco e usuarios ativos antes do teste.
- [ ] Repetir a leitura no mesmo horario depois de cada dia de teste.
- [ ] Registrar quais telas e fluxos foram usados naquele dia.
- [ ] Conferir erros do Supabase, Edge Functions e Play Console.
- [ ] Registrar aparelho, versao, conta, passos, resultado esperado, resultado observado e captura de cada falha.

## Criterio de aprovacao

O Glyph somente esta pronto para ampliar usuarios quando o fluxo principal, exclusao de conta e monetizacao passarem em aparelho real; e quando todo recurso social visivel passar entre duas contas sem perda, duplicidade ou bloqueio incorreto.
