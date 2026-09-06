# Glyph: plano de Oráculo, missões individuais, presença e progresso

Data: 05/09/2026. Projeto: `C:\Users\Afonso\Downloads\GOL1.006`.

**Status: plano para discussão e revisão por outra IA. Nenhuma implementação de produto foi feita nesta etapa.**

Este documento reúne a conversa com Afonso, evidências do código local e uma proposta de implementação. Recomendações novas estão identificadas como propostas; não devem ser tratadas como escolhas já aprovadas. As funções implantadas no Supabase, o cron e a entrega real no aparelho não foram verificados nesta análise.

## 1. O que estamos tentando construir

O Glyph organiza a vida em arenas, ações e ciclos. A pessoa registra o que fez para enxergar suas frentes juntas, acompanhar metas e reconhecer seu progresso. Perfil, missões e recompensas ajudam a tornar esse acompanhamento desejável.

A experiência desejada tem três momentos claros:

1. **Antes de agir:** abrir o quadro ajuda a entender onde estou e escolher o próximo passo.
2. **Depois de agir:** registrar torna o avanço visível imediatamente.
3. **Ao voltar:** o Oráculo reconhece contexto, ajuda a continuar ou ajustar e acompanha apenas os desafios aceitos.

Um registro vazio não comprova descanso nem abandono. O app sabe o que foi registrado; não sabe tudo o que aconteceu na vida. Sua linguagem deve respeitar essa diferença.

Hipótese de produto: clareza do quadro e desafios escolhidos podem sustentar retorno sem exigir atividade diária de todos. Isso precisa ser avaliado com uso real, não apresentado como crescimento garantido.

## 2. Decisões e limites vindos da conversa

| Situação | Direção |
|---|---|
| Alinhamento explícito | Dias consecutivos só são exigidos quando essa for a modalidade de missão aceita. |
| Direção acolhida | A sequência deixa de ser obrigação global e passa a caber na missão individual pedida ao Oráculo. |
| Alinhamento explícito | Separar card informativo, orientação de ciclo/missão, reações e notificações. |
| Alinhamento explícito | Mostrar progresso ao registrar por toast e no card da arena com texto como `5/7` acima da barra. |
| Limite explícito | Não alterar cálculo, escala, depósito ou reconciliação de EXP. Não redesenhar a nota do ciclo. |
| Ainda em discussão | Valores e tipos de recompensa das novas modalidades, prazos, regras de repetição e registro tardio. |
| Pedido desta etapa | Produzir um plano forte e revisável em Markdown, para outra IA dar sugestões. |

O usuário disse: “não quero mexer na exp só nas streak e recompensas”. Interpretação conservadora deste plano: preservar também os bônus de EXP existentes; propor mudanças em recompensas de missão separadamente. Não aproveitar a palavra “recompensas” para rebalancear toda a economia.

### Ideias que não devem reaparecer como decisão

- Sequência obrigatória por dia, por semana ou por ciclo para todos.
- Sequência de ciclos cumpridos por arena: foi sugestão anterior da IA, superada pela conversa sobre missões; não foi aprovada.
- Moeda diária crescente com streak ou congelamento comprável.
- Modal diário de coleta obrigatória para receber EXP já devida.
- Ressuscitar `DailyCompletionPromptModal` e seu encanamento removido.
- Reescrever EXP, fair score, patentes, temporadas ou o trabalho atual dos modais de recompensa.

## 3. O que existe de verdade e deve ser reaproveitado

Referências abaixo usam linhas observadas nesta análise; localizar novamente por símbolo se o checkout mudar.

| Peça atual | Evidência local | Consequência para o plano |
|---|---|---|
| Presença 0/2/3: Silencioso, Equilibrado, Presente | `constants/oraclePresencePolicy.ts:61` | Já existe tabela central; completar sua adoção em vez de inventar níveis. |
| Abertura por contexto e seleção entre 14 assuntos | `utils/oracleCandidates.ts:40`, `components/AuthenticatedApp.tsx:823` | Integrar missão aceita ao seletor atual. |
| Reações de rotina e de marco | `contexts/gameDomains/taskDomain.ts:139` | Rotina é passageira; marco pode ficar no histórico. |
| Banco com quatro tons | `constants/oracleSpeechLibrary.ts:39` | Preservar tons; tom não deve decidir canal de entrega. |
| Missão individual já ligada a arena existente | `components/OracleChat.tsx:845`, `utils/arenaPacts.ts:20` | Evoluir `ArenaPact`, sem criar uma segunda família concorrente. |
| Constância existente significa dias diferentes, não consecutivos | `utils/arenaPacts.ts:197`, `utils/arenaPacts.ts:357` | Não converter missões antigas silenciosamente em streak. |
| Conclusão e retomada já existem | `utils/arenaPacts.ts:338` | Manter e avaliar ajustes pontuais. |
| Persistência atual tem arena, tipo, dificuldade, meta e data de aceite | `utils/arenaPacts.ts:385` | Ainda não representa prazo, versão da regra e ciclo de vida completo. |
| Progresso e saldo da meta já calculados | `components/ArenaCard.tsx:392`, `contexts/gameDomains/taskDomain.ts:481` | Expor informação existente no ponto certo. |
| EXP retrospectiva tem reconciliação | `contexts/GameContext.tsx:4832`, `contexts/gameDomains/taskDomain.ts:809` | Preservar. Missão pode usar datas realizadas sem exigir abertura no dia. |
| Sequência global só avança para o dia operacional atual | `contexts/GameContext.tsx:12282` | Não reutilizar essa restrição para as missões novas. |
| Nota do ciclo usa fair score | `contexts/GameContext.tsx:9622`, `utils/fairScoreUtils.js:207` | Fora do escopo. |

### Recompensas atuais das missões de arena

Em `utils/arenaPacts.ts`, `ARENA_PACT_REWARDS`: leve = 2 ouro + 100 EXP; média = 5 ouro + 300 EXP; alta = 10 ouro + 500 EXP + baú Raro. Constância usa metas de 3/5/7 dias diferentes. São valores existentes, não recomendação de pagamento para novas modalidades.

`system-five-day-proof-streak` e `system-twenty-actions` oferecem 300 EXP + 2 ouro cada; a descrição omite a EXP. A concessão de missão também trata insígnias (`constants/systemChallenges.ts:39`, `contexts/GameContext.tsx:12175`). Mesma recompensa não comprova redundância; o problema da sequência global é impor um ritmo não escolhido.

## 4. Contrato proposto das quatro partes do Oráculo

**Proposta de destino**, não afirmação de que todos os caminhos já obedecem.

| Parte | Propósito | Silencioso | Equilibrado | Presente | Push |
|---|---|---|---|---|---|
| 1. Card automático | Conteúdo breve que vale ler por si só | Não gerar | Até 1/dia, habilitado | Até 1/dia, habilitado | Sim, se autorizado |
| Card solicitado | Conteúdo solicitado pelo usuário | Conforme acesso ao recurso | Igual | Igual | Nunca |
| 2. Orientação | Ciclo, falta de ciclo, ajustes e missão aceita | Só quando consultado | Até 1 abertura/dia no Planner | Até 1 por abertura/sessão, se houver novidade | Não |
| 3. Reação de rotina | Comentar a ação que acabou de acontecer | Não | Não | Sim, selecionada | Não |
| Reação de marco | Arena/campanha/missão concluída ou retomada relevante | Sem comentário espontâneo | Sim | Sim | Não |
| 4. Aviso acionável | Prazo escolhido, convite, resultado, recompensa disponível | Conforme permissões do aviso | Igual | Igual | Conforme tipo e permissão |

Silencioso não remove confirmação de tarefa, progresso, recompensa ou resposta a uma solicitação. Remove comentário espontâneo. “Presente” não significa falar obrigatoriamente sempre que um estado muda.

### Separação entre presença, tom e entrega

- **Presença:** quais comentários espontâneos são permitidos.
- **Tom:** como a mesma informação é escrita.
- **Card automático:** recurso com interruptor próprio; respeita presença e acesso atual.
- **Avisos no aparelho:** habilita o canal externo; desligar não apaga o histórico interno.
- **Avisos da missão:** preferência explícita associada ao compromisso aceito; recomendação ainda a definir na interface.
- **Mensagens e convites:** controles de comunicação, independentes do comentário do Oráculo.

Não reaproveitar a permissão antiga “avisar antes de perder a sequência” como autorização genérica para novos pushes de missão. O propósito mudou.

### Histórico proposto

Card, orientação contextual e marco relevante permanecem no histórico. Rotina passageira não o preenche. Confirmação de tarefa não vira uma segunda mensagem. Não criar novas abas; usar os espaços existentes, com rótulos discretos quando necessários.

## 5. Contradições atuais que precisam ser resolvidas primeiro

| Achado | Evidência | Ação proposta |
|---|---|---|
| Push remoto aceita card no Equilibrado, alternativa local exige Presente | `web-push/index.ts:830`; `GameContext.tsx:710` | Mesma decisão de elegibilidade nos dois caminhos. |
| Modo antigo calmo/reflexivo ainda pode bloquear card no push | `web-push/index.ts:117` e `:838` | Tirar modo antigo da decisão de entrega, preservando compatibilidade de leitura. |
| Comentários dizem que toda fala vai ao push, mas implementação bloqueia fala e reação | `utils/oracleSpeech.ts:26`; `web-push/index.ts:791` | Corrigir documentação e testes; não “consertar” enviando push de reações. |
| Elogio ao vivo usa rota sem peso/kind adequado | `GameContext.tsx:12397` | Passar pela mesma classificação de reações; evitar consumo da cota de abertura. |
| Dois comentários podem nascer da mesma conclusão | taskDomain + registerDailyProofAction | Selecionar a reação mais relevante antes de emitir. |
| RPC limita gravação a 12 mensagens por dia civil | `20260827120000_oracle_speech_is_a_real_message.sql:85` | Tratar retorno skipped, documentar limite e decidir alinhamento com dia operacional. Não prometer histórico irrestrito. |
| Código do card ainda consulta `ia_enabled` e `notifications_enabled` | `supabase/functions/oracle/index.ts:977` | Auditar semântica real e controles antes de remover campos; separar geração de entrega. |
| Banco automático contém “Faz o julgamento e leva a EXP” | `_shared/oracle-lines.ts`, estado `pronto_para_fechar` | Revisar contra o fluxo diário silencioso atual. |
| UI diz “Mensagens e convites”, mas filtro observado de DM verifica direct_message | `OracleSettingsModal.tsx:474`; `web-push/index.ts:1356` | Confirmar se o controle afeta convites; alinhar comportamento ou rótulo. |

O servidor filtra push por `deliveryType=feed`, recusa pedidos manuais e aplica controles próprios de alerta. Abertura/reação gravadas como `chat` não recebem push. Tipos de notificação elegíveis não comprovam a existência do produtor: verificar criação, agendamento e entrega de cada aviso.

## 6. Missão individual: proposta de experiência

### Fluxo principal

1. A pessoa toca **Pedir missão** no Oráculo.
2. Vê poucas sugestões ligadas às arenas que já possui, com motivo curto e possibilidade de escolher outra modalidade.
3. Escolhe arena, modalidade e meta/prazo dentro dos limites oferecidos.
4. Revisa objetivo, o que conta, prazo e recompensa completa.
5. Aceita. Só esse aceite ativa o desafio e suas condições.
6. O botão passa a acompanhar a missão: `4/6 ações · até sexta`.
7. Ao cumprir, recebe uma confirmação e a recompensa pelo fluxo existente. Uma única concessão.

**Proposta:** manter uma missão individual ativa por vez na primeira versão, como a interface atual indica. Não impedir uso sem ciclo. A missão precisa de escopo próprio quando não houver ciclo.

### Modalidades

| Modalidade | Exemplo de texto | O que conta | Estado da ideia |
|---|---|---|---|
| Dias consecutivos | “Uma ação de Leitura por 3 dias seguidos” | Datas operacionais consecutivas com ao menos uma conclusão elegível | Direção discutida com o usuário |
| Quantidade com prazo | “6 ações de Treino em 14 dias” | Conclusões elegíveis na janela; descanso não quebra nada | Direção discutida com o usuário |
| Concluir arena | “Concluir as metas restantes de Estudo” | Escopo da arena definido no aceite | Já existe; evolução discutida |
| Dias diferentes | “Registrar em 5 dias, sem precisar ser seguido” | Datas distintas | Já existe; preservar missões aceitas |
| Retomada | “Fazer uma ação de uma arena que você quer retomar” | Primeira conclusão elegível após aceite | Já existe; manter como opção, sem diagnosticar abandono |

Não colocar as cinco modalidades obrigatoriamente na primeira tela. Proposta: três sugestões relevantes e um acesso “Escolher desafio”. A modalidade de sequência não deve vir selecionada por padrão.

### Sugestão com explicação

Exemplos propostos, não textos existentes:

- “Você definiu treinos espaçados. Uma missão de 6 ações em 14 dias deixa os descansos livres.” Usar apenas se o espaçamento realmente estiver no planejamento.
- “Faltam duas metas nesta arena. Quer transformá-las em uma missão?”
- “Quer experimentar três dias seguidos de leitura? Essa modalidade exige uma ação em cada dia.”

O Oráculo sugere a partir de dados observáveis; não aceita por conta própria, não muda a meta e não cria nova arena para justificar uma missão.

## 7. Regras propostas que precisam ficar explícitas antes de programar

### Tempo e registro tardio

- Usar o dia operacional existente, com virada às 4h, em cliente, servidor e testes.
- Guardar data da atividade e instante do registro separadamente; não usar abertura do app como prova de atividade.
- Proposta: tarefas realizadas dentro da janela podem contar mesmo registradas depois, conforme prazo de fechamento definido para a missão. Não inventar uma janela de tolerância em código sem decidir o texto do produto.
- “Sem registro hoje” não significa automaticamente “falhou hoje”. Para sequência, distinguir falta de registro, quebra confirmada e encerramento final.
- Decidir no aceite quando começa: hoje ou próximo dia operacional. Aceitar às 23h não deve esconder uma obrigação de completar antes das 4h.
- Definir se o prazo pertence ao fuso da missão no aceite e manter essa interpretação em viagens; aproveitar a semântica atual sem mudar retroativamente o histórico.
- Proposta: uma atividade realizada antes do aceite não financia uma missão recém-aceita. Se só há data e não horário confiável, documentar a limitação do primeiro dia; não alegar prova que o modelo não armazena.

### Escopo, edição e encerramento

- Definir se conta qualquer ação da arena ou apenas ações selecionadas. Não usar “ações reais” como regra técnica vaga.
- Preservar o comportamento de ações Livre no sistema de EXP. Decidir sua elegibilidade de missão separadamente.
- Para conclusão, guardar referência do ciclo/rodada e metas aceitas. Excluir uma ação ou reduzir repetições não pode concluir automaticamente uma missão pelo desaparecimento do denominador.
- Se arena for arquivada, excluída ou bloqueada: explicar o impedimento e oferecer encerramento sem recompensa; não bloquear a organização normal do usuário.
- Definir o destino de missão quando o ciclo termina. Proposta: conservar escopo original e não misturar tarefas do ciclo novo; não cancelar silenciosamente.
- Proposta: abandonar missão não retira EXP ou progresso já conquistado. Não aplicar punição global, perda de patente ou mensagem moralizante.
- Desmarcar antes da recompensa recalcula o progresso. Depois da recompensa, preservar registro de concessão e impedir novo pagamento; não criar estorno de EXP nesta iniciativa.
- Não alterar missão já aceita para encaixar uma nova regra. Recompensa, modalidade e condições têm versão fixada no aceite.

### Recompensas

- Exibir todos os componentes reais na proposta e na conclusão, usando a mesma definição de dados.
- Manter recompensas já prometidas a missões existentes.
- Proposta inicial: preservar tabela existente onde a equivalência é demonstrável. Novas combinações de volume/prazo exigem tabela revisada antes de habilitar pagamento.
- Não multiplicar ouro pela sequência global nem deixar o usuário escolher livremente meta trivial com prêmio alto.
- Repetição de missão precisa de limite definido: nova instância não pode pagar pelas mesmas tarefas já usadas em outra instância desse mesmo sistema. Isso não deve impedir a coexistência intencional com missões de temporada.
- Ouro e baú precisam de concessão idempotente no servidor. Validar dados declarados no banco evita duplicação; não prova atividade física externa.
- Nova ideia opcional: no futuro, reconhecimento visual por variedade de missões cumpridas, sem prazo ou perda. Não incluir na primeira entrega nem criar outra economia.

## 8. Como as falas deveriam acompanhar a missão e o ciclo

### Orientação de abertura

Adicionar candidatos de missão ao seletor existente, com dados e motivo verificáveis:

| Situação | Exemplo proposto | Limite |
|---|---|---|
| Missão aceita perto de concluir | “Faltam duas ações para a missão de Treino.” | Não repetir o mesmo estado em toda abertura. |
| Prazo aceito próximo | “Sua missão termina amanhã; faltam duas ações.” | Somente prazo real, com saída útil; sem ordem para compensar. |
| Sequência aceita sem registro | “A missão de três dias está em 2/3. O registro de hoje ainda está aberto.” | Nunca aplicar a quem escolheu outra modalidade. |
| Sem ciclo | “Quer organizar suas arenas em um próximo ciclo?” | Convite ocasional; jogar sem ciclo continua legítimo. |
| Ciclo pesado | “A meta de Estudo está acima do ritmo registrado. Quer rever?” | Não alterar a nota; sugerir leitura/ajuste. |
| Retomada | “Você voltou a registrar em Leitura.” | Reconhecer o fato, sem afirmar o que ocorreu fora do app. |

Proposta de prioridade: acontecimentos de missão aceita com prazo, conclusão e retomada relevantes, ajuste útil de ciclo, próxima ação e convite para planejar. Usar o árbitro existente e calibrar em cenários; não codificar uma cascata rígida sem considerar repetição e relevância.

Revisar os 14 candidatos atuais. `sem_ciclo` não deve afirmar que “sem ciclo nada funciona”. `ausente`, `sem_entrega` e `arena_parada` precisam falar de registro, sem diagnosticar falta de esforço.

### Reação no instante da ação

Proposta: um único evento de conclusão produz a confirmação visual e, quando permitida, no máximo uma reação do Oráculo. Escolher o acontecimento mais específico: missão/campanha/arena concluída, Marco, retomada, avanço de meta ou rotina. Se missão e arena terminarem juntas, uma fala pode reconhecer ambas; a fila de recompensas preserva cada prêmio devido.

Rotina no Presente não exige comentário em todo check. Guardar memória de texto e evitar repetir o mesmo assunto sem mudança. Não suprimir a confirmação de que o registro foi salvo.

## 9. Progresso visível: uma informação em dois momentos

### Ao registrar

Proposta: toast curto `Treino: 5/7 · faltam 2`. Atualização visual pode ser imediata; confirmação final deve respeitar persistência. Em erro, restaurar estado e informar falha, como o fluxo atual já tenta fazer.

O toast é informação do produto e independe de presença. Oráculo pode comentar no Presente, sem ler a mesma frase em voz de personagem.

### Ao abrir Arenas

Acima da barra: `5/7 sessões` ou outra unidade que o modelo realmente mede. A barra atual permanece.

- Arena homogênea: mostrar unidade real e denominador correspondente.
- Arena com tipos/unidades diferentes: usar resumo coerente, como metas concluídas, ou manter percentual. Não somar minutos com repetições.
- Exemplo “180/300 minutos” é apenas válido se o progresso daquela arena já for medido assim; não introduzir nova fórmula para sustentar o layout.
- Respeitar arena Livre, Marco, campanha bloqueada e escopo de ciclo/rodada.
- Não mostrar “dois dias parado” como diagnóstico automático.
- Sem cor como único indicador; conferir contraste, truncamento, fontes grandes e leitor de tela.

Critério: a pessoa entende o avanço sem abrir modal e sem depender de ouvir o Oráculo.

## 10. Implementação técnica proposta

### Política comum

Criar ou consolidar função pura de elegibilidade de fala/aviso, com categoria, peso, origem automática/manual, presença e preferências. Retornar decisão e motivo. Compartilhar módulo compatível com os runtimes atuais ou usar contratos de teste equivalentes quando importação direta não for viável.

Não reconstruir o sistema inteiro de eventos. Aproveitar `oraclePresencePolicy`, `oracleCandidates`, `oracleSpeech`, `oracleReaction` e a infraestrutura de push. Usar um identificador de evento para impedir duplicação entre reconciliação, abertura, reload e múltiplos dispositivos.

### Missão persistida

Proposta de evolução, sujeita a revisão do schema real:

```ts
type MissionRule =
  | { kind: 'distinct_days'; targetDays: number }
  | { kind: 'consecutive_days'; targetDays: number }
  | { kind: 'actions_in_window'; targetActions: number }
  | { kind: 'complete_arena'; acceptedScopeId: string }
  | { kind: 'resume_arena'; targetActions: 1 };

// Esboço conceitual; não é código pronto para colar.
type AcceptedMission = {
  id: string;
  ruleVersion: number;
  arenaId: string;
  rule: MissionRule;
  acceptedAt: string;
  startsOn: string;
  endsOn: string | null;
  scope: { cycleId?: string; roundStartedAt?: string };
  rewardSnapshot: unknown; // usar o tipo de recompensa já existente
  status: 'active' | 'completed' | 'claimed' | 'expired' | 'abandoned';
};
```

Avaliar tabela própria para instâncias e concessões, com RLS por usuário e unicidade de missão ativa, porque os campos atuais no perfil não guardam todas as condições. Não criar tabela por conveniência sem verificar reutilização de estruturas existentes. Guardar metadados mínimos para reproduzir cálculo e razão de encerramento.

Aceite e concessão devem ser transacionais no servidor. O cliente mostra progresso imediato usando as mesmas regras; o servidor confirma recompensa com tarefas elegíveis e escopo congelado. Evitar confiar em `current` enviado pelo cliente.

### Retirada da sequência global

Auditar por símbolo e por texto, incluindo:

- `DailyProofStreak`, `advanceDailyProofStreak`, rollback e `registerDailyProofAction`.
- `system-five-day-proof-streak` e sua validação em `claim_glyph_progress_gold`.
- `streak_marco`, `streak_em_risco`, `streak_saved`.
- `buildLiveDailyPraise` e estados `streak_mantida`/`streak_quebrada` do servidor.
- `maybeSendStreakAlert`, cron e `important_alerts_enabled`.
- Configurações, chat, contexto, notificações locais e testes.
- Efeitos `daily_streak` e `streak_milestone`, que também comunicam a mecânica mesmo sem texto.

Preservar histórico necessário para reconhecer retomada. Não apagar imediatamente o JSON antigo; parar de usá-lo como obrigação ativa. Depois de desligar produtores/consumidores, avaliar limpeza compatível. Recompensas antigas já ganhas não são retiradas. Definir tratamento do desafio global já aceito antes de removê-lo do catálogo; honrar a regra antiga para essa coorte ou oferecer saída explícita sem perda.

Clientes antigos ainda podem emitir ou tentar resgatar sequência. Planejar compatibilidade e versionamento no servidor; esconder a opção no cliente novo não encerra o comportamento das versões já instaladas.

## 11. Fases de entrega e critério de saída

### Fase 0 — congelar o entendimento e conferir ambiente

- Confirmar projeto, branch, `git status` e instruções locais. Este checkout tem muitas alterações em andamento; não limpar, sobrescrever ou reverter trabalho alheio.
- Ler os documentos irmãos e localizar símbolos atuais.
- Inventariar emissores, filtros, armazenamento, produtores de avisos, cron, tokens e dispatches. Conferir implantação real somente no ambiente autorizado.
- Fechar decisões listadas na seção 14 antes das etapas dependentes.

Saída: matriz atual versus desejada, com divergências e ausência de evidência registradas.

### Fase 1 — unificar presença, histórico e push

- Corrigir diferença remoto/local e influência dos modos antigos.
- Fazer elogios ao vivo passar pelo classificador correto e evitar emissão duplicada.
- Alinhar rótulos das configurações e comentários com comportamento real.
- Preservar avisos essenciais independentes de presença.

Saída: mesma entrada produz mesma elegibilidade nos runtimes; manual/abertura/reação nunca geram push.

### Fase 2 — tornar o registro útil à vista

- Texto de progresso no card e toast de delta/estado.
- Reutilizar cálculo atual, sem criar novo score.
- Conferir telas pequenas e falha de salvamento.

Saída: visual claro em todos os níveis de presença; nenhuma alteração de EXP ou nota.

### Fase 3 — evoluir missões individuais

- Modelo versionado, migração aditiva, regras puras, aceite e concessão seguros.
- Fluxo de escolha com modalidades novas; preservar constância antiga.
- Integrar sugestão/acompanhamento ao espaço atual do Oráculo.
- Exibir recompensa completa a partir dos dados reais.

Saída: cada modalidade cumpre sua promessa; não paga duas vezes e não muda o compromisso aceito.

### Fase 4 — encerrar a obrigação global e revisar voz

- Migrar/encerrar coorte antiga conforme decisão explícita.
- Desativar alerta global e comentários equivalentes em todos os canais.
- Integrar candidatos de missão aceita e notificações de prazo autorizadas.
- Revisar bancos de texto sobre ausência, descanso, ciclo e recompensas.

Saída: nenhuma pessoa sem missão consecutiva aceita recebe cobrança de dias seguidos.

### Fase 5 — validar em ambiente implantado e aparelho

- Aplicar migrações e publicar funções apenas dentro da autorização de entrega.
- Testar app aberto, fechado, segundo plano e reabertura; push ligado/desligado, offline e mais de um dispositivo.
- Reportar separadamente prova local, banco, função publicada e entrega no aparelho.

Saída: dados e entrega confirmados com identificadores de teste e sem depender de gameplay repetitivo.

## 12. Cenários de aceitação obrigatórios

| Cenário | Resultado esperado |
|---|---|
| Treino 3x/semana, missão de 6 ações em 14 dias | Descansos não quebram nem disparam alerta de sequência. |
| Missão de 3 dias consecutivos aceita | Só essa missão mede consecutividade; várias ações no mesmo dia contam um dia. |
| Registro às 01h | Pertence ao dia operacional correto, igual no servidor e cliente. |
| Registro retrospectivo verdadeiro | Reavalia missão pela regra explícita de prazo; EXP mantém seu comportamento atual. |
| Sem ciclo e sem missão | Pode usar arenas; recebe no máximo convite contextual conforme presença, sem obrigação diária. |
| Presença Silencioso + convites autorizados | Sem comentários; convite continua elegível para aviso. |
| Card pedido à mão | Aparece no app, sem push. |
| Card automático no Equilibrado | Mesmo resultado de elegibilidade em aviso local e remoto. |
| Uma ação termina arena e missão | Um comentário coerente; todos os prêmios devidos, sem duplicação. |
| Desmarcar, recarregar e remarcar | Progresso recalcula; prêmio já concedido não se repete. |
| Aceitar missão no fim do dia | Início e prazo explícitos, sem regra escondida. |
| Editar/excluir meta ou trocar de ciclo | Não concluir por exclusão do denominador nem contar tarefas de outro escopo. |
| Duas requisições de resgate simultâneas | Uma concessão econômica. |
| Dois dispositivos/reconciliação offline | Sem duplicar missão, reação persistida ou recompensa. |
| Usuário antigo com missão de dias distintos | Continua sem exigência de consecutividade. |
| Cliente antigo emitindo streak global | Compatibilidade definida; não reativa cobrança para usuário migrado. |
| Prazo de missão passou, entrega já realizada | Aplicar política de registro tardio; não confundir coleta atrasada com objetivo não cumprido. |

Testes existentes úteis: `npm run test:oracle-presence-policy`, `test:oracle-reaction`, `test:oracle-arbiter`, `test:arena-pacts`, `test:daily-reading`, `test:core-loop`, `test:mission-reward`, `test:exp-ledger` e `npm run type-check`. Selecionar por fase e verificar scripts atuais. Acrescentar testes de decisão e concorrência reais, não asserts que só repetem a implementação.

## 13. Como saber se a mudança ajudou

Proposta de avaliação, aproveitando métricas existentes antes de criar coleta nova:

- A pessoa entende a meta/restante do card sem abrir detalhes?
- Aceita missões e sabe explicar o que conta e o que ganha?
- O retorno ao quadro acontece mesmo sem nova recompensa?
- Usuários com descanso planejado encontram modalidade adequada?
- Diminuiu a incidência de comentários repetidos, silenciamento do Oráculo e notificações sem utilidade?
- Aumentaram correções ou durações absurdas após introduzir uma recompensa? Investigar como sinal, não acusação de fraude.

Não tomar mais checks ou mais aberturas como sucesso isolado: isso pode significar mais burocracia. Comparar também esforço para registrar, clareza e adequação do desafio. Registrar apenas eventos necessários, sem enviar nomes de arenas e conteúdo pessoal para analytics por padrão.

## 14. Decisões abertas para Afonso e a próxima IA

| Decisão | Recomendação inicial deste plano |
|---|---|
| Uma missão ativa ou várias? | Uma, preservando simplicidade atual. |
| Sequência começa hoje ou amanhã? | Escolha explícita no aceite, com data final visível. |
| Quanto registro tardio aceitar? | Separar realização de registro; definir janela antes de implementar expiração definitiva. |
| Missão de sequência quebrada reinicia dentro do prazo? | Preferir regra simples, declarada no aceite; não escolher silenciosamente na implementação. |
| Valores das novas modalidades? | Preservar economia existente; revisar somente novas equivalências com exemplos de esforço e repetição. |
| Aviso de prazo de missão? | Opt-in explícito; frequência limitada e sem push se já concluída. |
| Desafio global antigo em andamento? | Honrar compromisso antigo por coorte ou oferecer encerramento claro; nunca retirar prêmio ganho. |
| Arena mudou depois do aceite? | Escopo versionado e saída explícita; não premiar apagar requisitos. |
| Repetição ilimitada? | Não lançar sem regra de reutilização de tarefas e frequência de recompensa. |

## 15. Pedido de revisão para outra IA

Leia este documento e o código atual. O objetivo não é concordar com a proposta, é encontrar o que está errado, caro, desnecessário ou faltando.

1. Separe decisões do usuário de sugestões deste plano. Não transforme sugestão em requisito aprovado.
2. Procure recursos já existentes que evitem construção nova, especialmente missão individual e infraestrutura de notificações.
3. Verifique cada afirmação sobre o código por arquivo/símbolo; aponte drift de linhas ou alterações recentes.
4. Ataque os casos difíceis: registro tardio, virada às 4h, mudança de ciclo, alterações de metas, cliente antigo, resgate simultâneo e compromisso já aceito.
5. Proponha uma versão menor caso alguma fase esteja grande demais. Diga exatamente o que deixa de atender e por quê.
6. Avalie se a missão de dias consecutivos é clara sem induzir preenchimento falso; não parta da hipótese de que recompensa comprova fraude.
7. Dê exemplos concretos de telas/falas úteis para alguém que treina espaçado, alguém que registra atrasado e alguém que gosta de desafios diários.
8. Responda com: manter, mudar, remover, dúvidas de produto e sequência mínima de implementação. Inclua evidência para críticas técnicas.

**Não implementar, alterar EXP/fair score, editar modais em andamento ou publicar funções apenas por receber este documento para revisão.**

## Documentos de contexto

- [Inventário de dados, utilidade real do Oráculo, retorno e missões](./2026-09-05-dados-utilidade-oraculo-retorno-e-missoes.md) — extensão solicitada pelo usuário; ler junto deste plano.
- [Discussão: sequência, Oráculo e motivo de registrar](./2026-09-05-sequencia-oraculo-e-o-appeal-de-anotar.md).
- [Estado anterior da discussão de sequência e resgate diário](./2026-09-02-sequencia-e-resgate-diario.md).

Os documentos anteriores registram hipóteses e bifurcações de outras etapas. Em caso de conflito, a conversa atual e os limites explícitos do usuário prevalecem. Este plano registra uma direção de produto e trabalho proposto, não uma versão já entregue.
