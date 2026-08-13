# GLYPH: PLANO DE SIMPLICIDADE, RETENCAO E VIRALIDADE

**Status:** direcao ativa de produto
**Objetivo:** levar o Glyph a um nivel de clareza e leveza comparavel ao Duolingo, sem copiar sua identidade.
**Regra central:** cada mudanca deve reduzir esforco mental, fortalecer o ciclo principal ou aumentar retorno e compartilhamento.

## 1. Estrela norte

O ciclo principal do Glyph deve ser entendido sem explicacao:

`abrir -> receber um toque util -> cumprir uma acao -> sentir progresso -> voltar amanha`

Depois de uma conquista, surge o ciclo social:

`concluir -> celebrar -> compartilhar ou convidar`

Tudo no produto deve servir a um desses dois ciclos. O que nao servir fica escondido, congelado ou removido da experiencia principal.

## 2. Principios obrigatorios

1. Uma tela deve deixar clara sua acao principal em poucos segundos.
2. O Oraculo aconselha; os botoes do aplicativo executam.
3. Arena, Acao e Ciclo continuam sendo os objetos centrais.
4. Sistemas sociais reutilizam Arenas e Acoes; nao criam outra estrutura paralela.
5. Profundidade e personalizacao sao opcionais; nunca bloqueiam o uso basico.
6. Avisos graves usam notificacao do sistema. Motivacao usa fala do Oraculo.
7. Nenhuma funcao cara roda continuamente sem resultado visivel e mensuravel.
8. Nenhuma grande reescrita. Cada extracao ou corte precisa ser pequeno, testavel e reversivel.

## 3. Estado protegido atual

Estes pontos ja foram resolvidos ou protegidos e nao devem regredir:

- [x] Cinco Ativos substituem as dez areas antigas.
- [x] Artes fixas do Arsenal e Soberano ficam locais no aplicativo.
- [x] Cron automatico caro do Oraculo esta pausado.
- [x] Lembretes de acao rodam a cada cinco minutos, nao a cada minuto.
- [x] Santuarios, missoes de cla, acoes compartilhadas de cla e jardim pessoal estao escondidos por sinalizadores.
- [x] Mentoria, parceria e competicao reutilizam Arenas.
- [x] Build, teste de tipos e testes de politica do Oraculo/notificacoes existem.

Enquanto estiverem escondidos, os sistemas antigos de cla nao devem ser reativados parcialmente.

## 4. Frente 1: Oraculo simples e util

### 4.1. Separar treinador de conteudo premium

O Oraculo tem duas funcoes diferentes e elas nao podem compartilhar os mesmos bloqueios.

**Treinador operacional**

- observa ciclo, tempo, Arenas e acoes;
- faz uma sugestao curta e especifica;
- nao cria Arena, Acao ou Ciclo pelo usuario;
- oferece um botao que leva ao lugar certo do aplicativo;
- pode funcionar sem assinatura premium.

Exemplos:

- `Que tal treinar hoje?`
- `Saude esta atrasada no ciclo. Quer rever a meta?`
- `Voce treinou 4 vezes. Faltam 3 para concluir esta Arena.`

**Cards de conteudo premium**

- mantem os cinco temas assinaveis;
- permite um pedido de cada tema por dia, ate cinco no total;
- um card automatico do tema consome o pedido daquele tema no dia;
- nao interfere nas falas operacionais do treinador.

### 4.2. Preferencias compreensiveis

Manter apenas controles que representam decisoes reais:

- `Silencioso`: responde quando chamado.
- `Equilibrado`: no maximo um toque relevante por dia.
- `Presente`: ate dois toques relevantes por dia.
- jeito de falar: `Neutro`, `Acolhedor` ou `Direto`;
- push no aparelho: ligado ou desligado;
- temas premium assinados, em uma area separada.

Remover da experiencia qualquer combinacao de controles que deixe o Oraculo silencioso sem explicar o motivo.

### 4.3. Disparo barato e contextual

- Nao religar o cron amplo atual.
- Avaliar falas ao abrir o Planner depois de um intervalo relevante.
- Avaliar falas depois de concluir uma acao ou atingir um marco.
- Usar primeiro regras locais e frases curtas; chamar inteligencia remota apenas quando houver valor adicional.
- Antes de carregar o estado completo no servidor, confirmar elegibilidade, horario e limite.

### Gate da Frente 1

- [x] Treinador funciona sem depender dos temas premium.
- [x] Card premium funciona sem alterar o comportamento do treinador.
- [ ] Entrar repetidamente nao produz fala toda vez.
- [ ] Cada fala leva a uma decisao ou celebra uma conquista.
- [ ] O usuario entende por que o Oraculo esta silencioso.
- [ ] Custos e quantidade de chamadas sao mensuraveis.

## 5. Frente 2: notificacoes previsiveis

Separar toda comunicacao em tres familias:

1. **Sistema:** pagamento, seguranca, erro, convite e resultado importante.
2. **Treinador:** sugestoes breves dentro do aplicativo.
3. **Social:** mensagens, parceria, mentoria e competicao.

Regras:

- toast fica reservado para retorno serio e imediato do sistema;
- fala motivacional aparece no balao do Oraculo;
- push serve para algo util quando o aplicativo esta fechado;
- conversa ao vivo pode usar tempo real;
- notificacoes comuns atualizam ao abrir ou voltar ao aplicativo e depois de uma acao relacionada;
- nao ativar todas as tabelas no tempo real apenas para compensar atualizacoes mal definidas.

### Gate da Frente 2

- [ ] Nenhuma fala motivacional aparece como toast.
- [ ] Convites e resultados aparecem sem exigir reiniciar o aplicativo.
- [ ] Push duplicado entre navegador e Android e evitado ou explicado.
- [ ] Contadores e listas mostram o mesmo numero.
- [ ] Cada tipo de notificacao tem uma unica superficie principal.

## 6. Frente 3: abertura leve e dados pequenos

### 6.1. Perfil publico minimo

Criar uma consulta segura para busca, cla e relacoes contendo somente os campos publicos necessarios, por exemplo:

`id, nickname, avatar, level, title, border, clan e presenca`

Nao baixar inventario, carteira, preferencias, jardim ou dados privados de outras pessoas.

### 6.2. Carregamento inicial minimo

Na abertura, carregar apenas:

- perfil atual;
- ciclo atual;
- Arenas e Acoes atuais;
- tarefas do periodo proximo;
- contadores essenciais.

Carregar sob demanda:

- relatorios antigos;
- inventario completo;
- campanhas e biblioteca;
- relacoes sociais detalhadas;
- historico de ciclos;
- dados de cla fora da tela de cla.

### 6.3. Consultas explicitas

- substituir `select('*')` primeiro nos caminhos mais usados;
- paginar relatorios e historicos;
- aplicar intervalo inicial e final nas tarefas agendadas;
- manter imagens imutaveis no pacote ou hospedagem estatica;
- medir trafego real por abertura, sessao comum, Arsenal e relatorios.

### Gate da Frente 3

- [ ] Busca e cla usam somente perfil publico.
- [ ] Abrir o aplicativo nao baixa relatorios antigos completos.
- [ ] Nenhuma consulta frequente baixa colunas sem uso.
- [ ] Trafego de uma sessao comum foi medido em aparelho real.
- [ ] O aplicativo continua utilizavel em conexao lenta.

## 7. Frente 4: ciclo diario claro

O produto deve reduzir culpa e facilitar retomada.

- Mostrar uma proxima acao clara, nao uma parede de pendencias.
- Permitir ajustar metas do ciclo quando a estimativa ficou irreal.
- Permitir registrar no passado enquanto a acao ainda nao foi julgada pelo fechamento do ciclo.
- Travar somente a acao que ja teve resultado consolidado.
- Ao abrir o Planner, poder mostrar um resumo curto do dia anterior antes do dia atual.
- Streak representa dias em que houve execucao, sem punir de forma teatral uma ausencia.
- Reentrada depois de alguns dias deve sugerir ajuste, nao vergonha.

### Gate da Frente 4

- [ ] Acao nao julgada pode ser corrigida no passado.
- [ ] Acao julgada nao duplica EXP.
- [ ] Cancelar, completar novamente ou mudar de dia mantem a conta correta.
- [ ] Inicio, fechamento, reinicio e exclusao de ciclo produzem estados previsiveis.
- [ ] O resumo diario ajuda o ciclo sem virar outro sistema de planejamento.

## 8. Frente 5: social leve e encontravel

### 8.1. Relacoes

- Um destino claro para mentoria, parceria e competicao.
- Convitar pela lista de pessoas, com foto, nome e contexto.
- Arena vinculada aparece junto das Arenas normais com um marcador discreto.
- Mentor acompanha; pupilo executa.
- Parceria compartilha progresso.
- Competicao compara resultado sem criar tarefas paralelas.

### 8.2. Cla

Manter no produto atual apenas:

- identidade visual e plano de fundo;
- lista de membros;
- nivel do cla;
- contribuicao de EXP confirmada somente ao fechar o ciclo;
- convite, aceite, saida e exclusao confiaveis.

Continuam escondidos:

- santuarios;
- jardim;
- missoes prontas;
- acoes compartilhadas de cla;
- motores de decaimento e progresso paralelo.

### 8.3. Campanhas

- Campanha reutiliza Arenas e Acoes.
- Instalar uma campanha deve ser compreensivel antes da confirmacao.
- Compartilhar campanha deve gerar uma entrada simples para a outra pessoa.
- Evitar outra biblioteca, outra moeda ou outro fluxo quando os objetos atuais resolvem.

### Gate da Frente 5

- [ ] Uma pessoa encontra Relacoes sem procurar em tres lugares.
- [ ] Convite, aceite, remocao e exclusao foram testados ponta a ponta.
- [ ] Mentor nao cria tarefas diretamente para o pupilo.
- [ ] EXP de cla entra uma unica vez ao fechar o ciclo.
- [ ] Funcionalidades escondidas nao fazem consultas nem iniciam temporizadores.

## 9. Frente 6: viralidade com dignidade

Viralidade deve nascer de resultado real, nao de spam.

Momentos apropriados para compartilhar:

- Arena concluida;
- ciclo fechado;
- nivel conquistado;
- sequencia pessoal relevante;
- resultado de parceria ou competicao;
- campanha criada ou concluida.

Cada compartilhamento deve:

- mostrar uma imagem bonita e legivel;
- explicar a conquista sem exigir que o receptor conheca o Glyph;
- conter um convite opcional e direto;
- levar ao ponto exato do aplicativo, quando houver link profundo;
- nunca publicar automaticamente.

### Gate da Frente 6

- [ ] Existe um modelo visual consistente para conquistas.
- [ ] Compartilhar exige no maximo dois toques depois da conquista.
- [ ] O receptor entende o resultado fora do aplicativo.
- [ ] Links de convite abrem o destino correto.
- [ ] Taxas de criacao, abertura e aceite podem ser medidas.

## 10. Frente 7: manutencao sem grande reescrita

O `GameContext` deve diminuir por extracoes pequenas, nunca por uma troca total.

Ordem sugerida:

1. consultas de perfil publico;
2. notificacoes;
3. Oraculo;
4. relacoes;
5. codigo desativado de cla e santuario.

Para cada extracao:

- definir entradas e saidas;
- preservar a interface usada pelas telas;
- adicionar teste de regressao antes da mudanca;
- mover um dominio por vez;
- rodar build, tipos e testes relacionados;
- nao misturar refatoracao com mudanca de regra de negocio.

### Gate da Frente 7

- [ ] Cada dominio tem contrato e teste proprio.
- [ ] Nenhuma tela precisa conhecer detalhes de tabela do Supabase.
- [ ] Codigo desativado nao permanece executando em segundo plano.
- [ ] Alteracoes futuras exigem tocar em menos arquivos centrais.

## 11. Ordem executavel

### Etapa A: valor percebido

1. Separar treinador e cards premium do Oraculo.
2. Simplificar preferencias do Oraculo.
3. Consolidar superficies de notificacao.

### Etapa B: custo e velocidade

4. Criar perfil publico minimo.
5. Emagrecer carregamento inicial.
6. Paginar relatorios e historicos.
7. Medir uma sessao comum em aparelho real.

### Etapa C: confianca no ciclo

8. Cobrir combinacoes de EXP, datas e fechamento de ciclo.
9. Validar estados sem ciclo, novo ciclo, manter metas e zerar metas.
10. Refinar resumo diario e retorno depois de ausencia.

### Etapa D: social e viralidade

11. Unificar entrada de Relacoes.
12. Fechar convites e comportamento de mentoria/parceria/competicao.
13. Validar contribuicao do cla no fechamento do ciclo.
14. Criar compartilhamento simples depois de conquistas.

### Etapa E: manutencao

15. Extrair dominios do `GameContext` um por vez.
16. Arquivar codigo desativado sem apagar tabelas ou progresso.
17. Remover assinaturas, consultas e temporizadores mortos.

## 12. Criterio de lancamento desta direcao

Esta etapa termina quando uma pessoa nova consegue:

1. entrar;
2. entender suas cinco areas;
3. criar uma Arena e uma Acao;
4. cumprir algo;
5. entender o progresso do ciclo;
6. receber um toque util, sem excesso;
7. voltar no dia seguinte;
8. compartilhar uma conquista ou chamar uma pessoa;

sem precisar aprender cla, santuario, economia, campanhas ou configuracoes avancadas.

## 13. Regra contra perda de contexto

Antes de iniciar qualquer item deste plano:

1. marcar apenas um item como em andamento;
2. registrar os arquivos e tabelas envolvidos;
3. escrever como o comportamento funciona antes da alteracao;
4. definir o teste que prova a conclusao;
5. concluir e marcar o item antes de abrir outro;
6. atualizar `status.md` somente quando o estado real mudar.

## 14. Registro de andamento

### 13/08/2026 - Frente 1, separacao inicial

- [x] Politica do treinador extraida para `utils/oracleCoach.ts`.
- [x] Treinador do Planner permanece local, contextual e disponivel sem Premium.
- [x] Pedido remoto renomeado para `requestOracleContentCard`.
- [x] Pedido remoto aceita somente os cinco temas de conteudo Premium.
- [x] Preferencias de presenca e notificacao nao bloqueiam pedidos manuais de card.
- [x] Geracao automatica remota identificada como `premium_content_card`.
- [x] Ramos operacionais antigos removidos do gerador de cards.
- [x] Regressao `oracle-coach-separation.regression.mjs` criada e aprovada.
- [x] Testes do Oraculo, notificacoes, tipos e build aprovados.
- [x] Publicar a nova versao da Edge Function `oracle` no Supabase.
- [ ] Validar em sessao autenticada: fala do treinador gratuita e pedido de card Premium.

Documentos relacionados:

- [Estado atual](status.md)
- [Direcao de produto](DIRECAO_PRODUTO_60_90D.md)
- [Prontidao de lancamento](LAUNCH_READINESS.md)
