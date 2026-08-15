# Smoke test manual do Glyph

Este e o roteiro curto para validar uma versao antes do teste fechado ou da producao. Em cada item, execute todos os passos descritos e marque somente quando o resultado observado for igual ao esperado. Registre aparelho, versao, conta e captura ao encontrar uma falha.

## Preparacao

- [ ] **01. Ambiente e contas:** instalar o AAB mais recente em um Android real, confirmar versao, internet e Supabase correto e separar duas contas sociais e uma nova; anotar ouro, EXP, nivel, baus, cla e Premium para detectar qualquer duplicidade.

## Entrada e onboarding

- [ ] **02. Cadastro completo:** criar uma conta, aceitar termos, definir perfil e entrar; nenhuma tela deve travar, repetir ou levar a um caminho sem saida.
- [ ] **03. Primeiro progresso:** seguir o onboarding, criar a primeira arena e uma acao e escolher uma missao inicial ou nenhuma; a pessoa deve terminar com algo real para executar.
- [ ] **04. Conclusao e persistencia:** terminar na Rest Screen, fechar e reabrir o app; o onboarding nao deve voltar e os tutoriais devem continuar disponiveis em `Configuracoes > Tutoriais`.

## Ativos e arenas

- [ ] **05. Cinco Ativos:** abrir a tela inicial e confirmar exatamente cinco Ativos, na ordem e cores corretas, com nivel geral na base 100 e contagens reais.
- [ ] **06. Cartoes responsivos:** conferir os cinco cartoes em celular estreito, largo, baixo e alto; medalha, titulo, quadrados, emojis e barra devem caber sem corte, contato ou sobreposicao.
- [ ] **07. Detalhe e manutencao:** abrir cada Ativo, criar, editar, arquivar e excluir arena; fundo, nivel, contagens e progresso devem atualizar, e nomes longos devem usar duas linhas sem corte.

## Acoes e Planner

- [ ] **08. Criacao de acoes:** criar uma acao com repeticoes e uma acao livre, editar nome, duracao e arena; os dados devem persistir depois de fechar o modal e reabrir o app.
- [ ] **09. Grade e lista simples:** agendar, mover, devolver para a lista e reordenar acoes, alternando entre grade e lista nas visoes diaria e semanal; horario e ordem nao podem ser perdidos.
- [ ] **10. Concluir e desfazer:** concluir uma acao agendada e uma sem horario, desfazer, mudar o dia e concluir novamente; EXP, progresso e contadores devem recalcular sem duplicar.
- [ ] **11. Passado e julgamento:** criar, mover, editar e concluir acao incompleta em dia anterior; somente uma acao que ja entregou EXP e foi julgada pode ficar travada, nunca o dia inteiro.

## Ciclos e painel diario

- [ ] **12. Inicio do ciclo:** criar ciclo de duracao curta, selecionar metas e conferir datas, carga, tempo e progresso; somente arenas escolhidas devem participar dos calculos.
- [ ] **13. Ajuste honesto:** durante o ciclo, mudar repeticoes ou metas ainda nao julgadas; o app deve recalcular o objetivo sem retirar EXP ja consolidada nem bloquear outras acoes.
- [ ] **14. Resumo e virada do dia:** abrir o painel diario, conferir ontem e hoje e validar a virada das 4h; streak e resumo devem mudar de dia sem fechar ou julgar todas as acoes anteriores.
- [ ] **15. Fechamento e opcoes:** fechar ciclo e testar separadamente `Novo ciclo`, `Zerar metas` e `Sair`; relatorio, metas e proximo estado devem corresponder exatamente a opcao escolhida.
- [ ] **16. Exclusao e memoria:** excluir ciclo recente e antigo e depois editar ou excluir arena atual; outros ciclos e registros historicos nao podem recuperar metas antigas nem mudar seus dados.

## Missoes e recompensas

- [ ] **17. Entrada em missao:** escolher uma unica missao opcional, ou nenhuma, e conferir o pequeno aviso de aceite; apenas a escolhida deve aparecer junto das missoes automaticas da temporada.
- [ ] **18. Conclusao automatica:** cumprir missao de arena, sequencia ou quantidade de acoes; o modal deve aparecer na hora e a recompensa deve entrar sem botao `Resgatar`.
- [ ] **19. Baus, insignias e fila:** abrir o bau recebido, conferir item e inventario e provocar missao, nivel e ciclo juntos; recompensas devem ocorrer uma vez, insignias acumulaveis devem somar e os modais devem respeitar a fila.

## Oraculo

- [ ] **20. Abertura e conversa:** tocar no Oraculo superior e na Rest Screen, enviar mensagem e pedir card premium; todos os botoes devem responder no primeiro toque e o limite diario deve ser respeitado.
- [ ] **21. Presenca inteligente:** testar os tres niveis de presenca durante progresso, atraso e retorno ao app; falas devem ser ocasionais, curtas e relevantes, usando balao fino, enquanto erros serios usam aviso do sistema.

## Mentoria

- [ ] **22. Convite e escolha:** conta A convida B, B aceita e o orientado seleciona a propria arena; ambos devem identificar claramente mentor, orientado e arena acompanhada.
- [ ] **23. Permissoes e encerramento:** mentor observa e conversa, mas nao cria, edita nem apaga acoes; o orientado pode trocar arena e qualquer lado pode encerrar sem excluir o progresso original.

## Parceria

- [ ] **24. Convite e dois lados:** A convida B, B aceita e cada pessoa escolhe sua arena; as duas devem ver os progressos e donos corretos sem hierarquia ou vencedor.
- [ ] **25. Flexibilidade:** cada pessoa edita ou troca apenas a propria arena e depois encerra a parceria; nao existe prazo obrigatorio, e arenas e historico devem permanecer nas contas.

## Desafio

- [ ] **26. Convite configuravel:** A escolhe pessoa, arena e qualquer prazo de 1 a 30 dias; B deve ver arena, execucoes, prazo e premio, e nenhum ouro pode sair antes do aceite.
- [ ] **27. Aceite e selamento:** B aceita, 50 de ouro saem somente de A e o cronometro comeca; devem surgir duas copias identicas, e metas, acoes e repeticoes ficam bloqueadas para edicao.
- [ ] **28. Resultado seguro:** testar conclusao antecipada, fim por prazo, maior porcentagem e empate; acoes tardias nao contam, vencedor recebe EXP e bau uma vez, copias sao arquivadas e dois aceites simultaneos nao criam desafios duplicados.

## Cla e social

- [ ] **29. Cla e contribuicao:** criar ou entrar em cla, convidar e remover membro, trocar fundo e fechar ciclo; EXP do membro so pode contribuir quando o ciclo for fechado.
- [ ] **30. Lideranca e contatos:** excluir a conta do lider e confirmar transferencia segura; depois testar amizade, foto, mensagem, bloqueio e exclusao sem deixar cla ou relacao quebrada.

## Relatorio e Legado

- [ ] **31. Fila de fechamento:** fechar um ciclo junto com missao e subida de nivel; relatorio, recompensa, nivel e Legado devem aparecer em sequencia, com audio, vibracao e transicoes sem roubar a cena um do outro.
- [ ] **32. Historico fiel:** abrir ciclo curto e acima de sete dias, comparar mapa de dias, horarios, arenas e acoes e depois alterar perfil, cla e arenas atuais; cada ciclo deve preservar a fotografia da epoca e apenas o ciclo excluido pode desaparecer.

## Widget e notificacoes

- [ ] **33. Execucao externa e notificacoes:** adicionar widget, listar acoes e concluir uma sem abrir o app; ao entrar, horario, EXP e progresso devem estar sincronizados. Ativar notificacoes, colocar o app em segundo plano e usar `GM > Fabrica de Eventos > Sistema + Push (15s)`; deve chegar uma unica notificacao remota. Ao tocar, ela deve abrir o destino correto. Repetir no navegador autorizado e confirmar que Android e navegador recebem seus proprios avisos sem duplicidade no mesmo aparelho.

## Conta e monetizacao

- [ ] **34. Recuperacao e exclusao:** recuperar senha e excluir uma conta pelo app; autenticacao, perfil, relacoes e arquivos pessoais devem desaparecer, inclusive quando a conta era lider de cla.
- [ ] **35. Ouro e Premium:** no teste fechado, comprar ouro, reabrir, repetir tentativa, cancelar e restaurar; cobranca deve aparecer na Play, saldo entra uma vez e Premium volta apos reinstalacao ou segundo aparelho.

## Medicao e liberacao

- [ ] **36. Medicao e decisao final:** anotar PostgREST Egress, Cached Egress, Storage, banco, usuarios ativos e erros antes e depois do teste, relacionar consumo com telas usadas e somente aprovar quando fluxo principal, exclusao, monetizacao e recursos sociais passarem sem perda, duplicidade ou bloqueio incorreto.
