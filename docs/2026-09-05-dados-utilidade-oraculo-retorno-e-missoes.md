# O que o Oráculo pode saber — e por que alguém voltaria ao Glyph

Data: 05/09/2026. Projeto: `C:\Users\Afonso\Downloads\GOL1.006`.

**Levantamento de produto e código local, para revisão. Não é implementação nem autorização de coleta adicional.** Complementa o [plano de implementação](./2026-09-05-plano-oraculo-missoes-presenca-e-progresso.md). Preservar EXP, nota do ciclo e trabalho em andamento.

## 1. A função que justificaria o Oráculo

O Oráculo deveria diminuir três esforços: entender a própria situação, escolher um próximo passo e perceber o que mudou. Se apenas ler a barra, repetir “parabéns” ou cobrar presença, acrescenta ruído a algo que a interface já informa.

Proposta de promessa ao usuário:

> “Eu ajudo você a enxergar suas arenas, escolher um desafio que caiba no seu momento e perceber seu percurso.”

Ele pode produzir utilidade em cinco perguntas:

1. Onde estou nas coisas que escolhi fazer?
2. Qual passo faz sentido agora, entre as opções que eu mesmo cadastrei?
3. O plano parece compatível com meu histórico registrado?
4. O que mudou desde o período anterior?
5. Que missão eu gostaria de tentar, sabendo o que ela exige e oferece?

Sem dados suficientes, oferecer escolha é mais útil que fingir conhecer a pessoa. Sem novidade, ficar quieto pode ser a decisão correta.

## 2. Como ler este inventário

- **E — existente:** campo, fluxo ou cálculo localizado no código. Campo opcional não significa preenchido, correto ou implantado.
- **D — derivável:** pode ser calculado a partir dos dados disponíveis, com as limitações indicadas. Não significa cálculo já implementado.
- **N — novo:** demanda preferência, evento ou modelo adicional; só construir se pagar uma necessidade concreta.

Escopo: todas as famílias relevantes localizadas para orientação, missão, retorno e recompensa. Não é um dicionário exaustivo de cada coluna do banco ou uma inspeção dos dados pessoais de usuários. Não foram consultadas contas de produção. Contagens e fontes precisam ser revalidadas quando o schema mudar.

## 3. Inventário: plano, ações, arenas e tempo

| Dados | Estado e fonte | Utilidade possível | Limite de interpretação |
|---|---|---|---|
| Arena, área, nome, descrição, tags e prioridade | E: `types.ts:164` | Ordenar sugestões pelo objetivo escolhido; contextualizar missão | Nome não autoriza inferir condição de saúde, religião ou situação financeira. |
| Arquivamento, campanha, dependências, bloqueio e progresso | E: tipos + `utils/arenaPacts.ts:117` | Não sugerir tarefa indisponível; reconhecer avanço que abriu caminho | Nem todos os flags do tipo são colunas; usar cálculo canônico de campanha. |
| Tipo de ação: Marco, Compromisso, Recorrente ou Livre | E: `types.ts:117` | Escolher feedback e modalidade de missão adequados | Livre não deve virar meta compulsória. |
| Duração, dificuldade e repetições planejadas | E: `types.ts:126` | Mostrar restante; sugerir ação curta já cadastrada | Duração é declarada/configurada, não prova de esforço medido. |
| Dias e horário configurados para recorrência | E, opcional: `types.ts:130` | Respeitar planejamento espaçado; propor volume com prazo em vez de diário | Falta de configuração não comprova disponibilidade. |
| Contexto de energia, período do dia, quadrante e antecedência de lembrete | E, opcional: `types.ts:146` | Filtrar sugestões compatíveis com preferência declarada | Não afirmar energia atual com base numa etiqueta da ação. |
| Briefing, checklist preparatório e material da ação | E, opcional: `types.ts:139` | Próximo passo pode ser abrir instrução/material necessário | Conferir acesso ao conteúdo; não tratar texto livre como instrução do sistema. |
| Tarefa: data, início, duração, conclusão e ordem | E: `types.ts:584` | Resumo diário, próximos compromissos, distribuição no planner | Horário programado não é horário comprovado de execução. |
| `completedAt` e `createdAt` da tarefa | E, opcionais: `types.ts:591` | Potencial de distinguir registro e data atribuída à atividade | Auditar todos os escritores e migrações; não chamar latência de registro de medida confiável ainda. |
| Metas concluídas e restantes da arena | E: `progressUtils`, `ArenaCard.tsx:392` | `5/7` visível, toast e sugestão de conclusão | Unidades misturadas não podem ser somadas num “5/7” inventado. |
| Ciclo: datas, duração, arenas e configuração | E: `types.ts:974` | Prazo, fase e próximo planejamento | Duração variável exige comparações normalizadas. |
| Rodada sem ciclo e marcador de reinício | E: `GameContext.tsx:9205` | Missões e progresso no modo sem ciclo | Não forçar criação de ciclo para tornar o Oráculo útil. |
| Dia operacional e tarefas do compromisso diário | E: `types.ts:993`, `utils/operationalDay.js` | Interpretar madrugada e recontagem corretamente | Não criar outra “semana” de recompensa; usar as unidades já existentes. |
| Anotação operacional livre | E, opcional: `DailyCommitment.operationalScratch` | Oferecer acesso à nota quando o usuário consultar o dia | Não necessária à primeira versão; não enviar conteúdo livre ao push. |

## 4. Inventário: percurso, identidade, missões e relação com o app

| Dados | Estado e fonte | Utilidade possível | Limite de interpretação |
|---|---|---|---|
| Relatórios: realizado/planejado, horas, metas, arenas, dias ativos e destaques | E: `types.ts:794` | Explicar trajetória e reconhecer feitos além do check isolado | Comparar escopos e versões compatíveis. |
| Fair score, componentes e confiança histórica | E: `types.ts:700`, `utils/fairScoreUtils.js` | Explicar resultado já calculado sem alterar nota | Nota não é valor pessoal nem diagnóstico de disciplina. |
| Comparação com ciclos anteriores | E: `utils/cycleComparison.ts:175` | Dar contexto: “como este ciclo se compara ao meu histórico?” | O mínimo atual é 2 ciclos anteriores; não generalizar confiança estatística. |
| Atlas e snapshot de identidade no fechamento | E: `types.ts:637`, `:847` | Recordar feitos e mostrar o perfil associado àquele período | Preservar snapshot; não reescrever passado a partir do estado atual. |
| Última data registrada, retomada e dias distintos | E: contexto e tarefas | Reconhecer continuidade e retorno | Ausência de registro não comprova inatividade. |
| Sequência global e recorde legados | E: `types.ts:611` | Compatibilidade e memória histórica | Não usar como obrigação para quem não aceitou missão de sequência. |
| Missão individual: arena, tipo, dificuldade, meta e início | E: `types.ts:558`, `utils/arenaPacts.ts` | Acompanhamento de uma promessa voluntária | Prazo e histórico completo de instâncias ainda precisam de evolução. |
| Missões aceitas/concluídas de sistema/temporada | E: `types.ts:553` | Evitar proposta repetida e mostrar recompensas devidas | Não confundir regra da temporada com modalidade individual. |
| EXP, patente, inventário, itens equipados, ouro, fragmentos e baús | E: `types.ts:524`, `:546` | Tornar conquista visível e oferecer personalização | Preservar economia; não usar proximidade de prêmio para pressionar compra. |
| Campanhas e sua progressão | E: `types.ts:206`, `ArenasView.tsx` | Revelar próximo passo desbloqueado e dar sentido à conclusão | Não abrir automaticamente outra frente ou aceitar missão. |
| Preferência de presença, tom, temas e avisos | E: `OracleSettingsModal.tsx`, `oraclePresencePolicy.ts` | Personalizar como e quando falar | Preferência deve ser aplicada em todos os emissores. |
| Histórico de mensagens e leitura | E: `oracle_messages`, `GameContext.tsx:1549` | Evitar repetir assunto e permitir consulta posterior | “Lida” não prova compreensão, satisfação ou influência na ação. |
| Memória curta de assuntos/frases | E: `utils/oracleSpeechMemory.ts:34`, `oracleReaction.ts` | Continuidade de conversa e menos repetição | LocalStorage não é memória sincronizada entre aparelhos. |
| Última abertura registrada para o coach | E: `AuthenticatedApp.tsx:836` | Saber que houve retorno ao app naquele dispositivo | Não equivale a série completa de sessões ou tempo de uso. |
| Inicialização e erro de app | E: `AppRuntimeMetricsService.ts:11` | Separar falha técnica de possível abandono | Só `shell_ready`/`boot_error` nesse serviço; não é funil de retenção completo. |
| Onboarding e propósito declarado | E, opcional: `types.ts:485`, `:555` | Introdução compatível com intenção declarada | Faixa etária não precisa orientar premiação ou pressão de retorno. |
| Humor atual e histórico de registros | E: `types.ts:547`; migração `20260831120000_mood_becomes_a_timeline.sql:16` | Se solicitado, mostrar evolução dos próprios registros | Opcional e sensível. Não inferir doença nem que uma ação causou mudança de humor. |
| Relações autorizadas, arena compartilhada, convites e resultados | E: `oracleNotificationPolicy.ts`, contextos de relações | Avisar acontecimentos que exigem resposta e contextualizar colaboração | Só dados acessíveis pelas permissões; missões de clã desativadas não devem ser anunciadas como ativas. |
| Inscrição de push, preferências e dispatches | E: migração `20260330170000_add_web_push_delivery.sql` | Distinguir elegibilidade, tentativa e erro de envio | Aceite do provedor não comprova leitura no aparelho. |

## 5. O contexto que o Oráculo já recebe é mais rico que as falas

`utils/oracleOperationalContext.ts:490` já retorna: existência/nome/datas do ciclo, dia atual, dias restantes, progresso real/esperado/delta, ritmo, contagens de ações, arenas, sinais por arena, pendências de hoje, atrasos, demanda diária planejada, melhor volume diário registrado, dias ativos, prioridades e próximo movimento.

`OracleArenaSignal` (`types.ts:1450`) já representa progresso, pendências, última entrega, tempo sem registro, sugestões de ajuste e tendência opcional. O servidor não necessariamente calcula tudo que o cliente calcula.

**Oportunidade principal:** transformar esses dados em poucas decisões úteis, em vez de expandir quantidade de falas. Um card genérico sobre disciplina aproveita menos o app que “esta missão cabe na arena que você já escolheu”, desde que a conclusão seja justificável.

## 6. Novos cálculos possíveis e requisitos de confiança

Todas as linhas abaixo são propostas D, salvo quando explicitamente já existentes.

| Sinal | Cálculo ou regra | Utilidade | Cuidado |
|---|---|---|---|
| Passos restantes para meta | Meta aceita menos conclusões elegíveis | Próximo passo e antecipação de conclusão | Usar cálculo existente quando disponível; cap só na apresentação, não apagar excedentes históricos. |
| Carga planejada por dia elegível | Trabalho restante / dias planejados restantes | Mostrar se a distribuição merece revisão | Não dividir cegamente por dias corridos quando há agenda espaçada. |
| Capacidade registrada típica | Mediana de períodos comparáveis | Oferecer missão plausível | Histórico incompleto pode subestimar capacidade; apresentar como referência, não limite. |
| Conclusão estimada | Faixa pelo ritmo recente e escopo restante | Tornar prazo compreensível | Não emitir data exata com pouco dado; desligar previsão com amostra insuficiente. |
| Concentração em arena | Fração de registros por arena | Mostrar foco escolhido e permitir revisar prioridades | Não tratar distribuição igual entre áreas como ideal universal. |
| Compromissos sobrepostos | Interseção de intervalos programados | Alertar conflito verificável | Slot negativo/pool não é compromisso com horário. |
| Próxima ação viável | Prioridade + disponibilidade no plano + duração cadastrada | Reduzir paralisia de escolha | Não presumir disponibilidade real porque o planner está vazio. |
| Retomada relevante | Registro após intervalo sem registros na mesma arena | Reconhecer mudança concreta | Não premiar criar pausas para farmar retomada repetidamente. |
| Mudança comparável entre ciclos | Mesma métrica, escopo e duração explicitados | Mostrar evolução que o usuário não percebeu | Não comparar 7 dias com 30 por totais crus. |
| Adequação de missão | Elegibilidade + regras aceitas + histórico disponível | Oferecer 2–3 opções explicáveis | Sempre deixar escolha; não atribuir “perfil psicológico”. |
| Duplicação de comentário | Mesmo evento/assunto sem mudança material | Menos ruído | Frase diferente sobre o mesmo fato ainda é repetição. |
| Latência de registro | Instante de registro menos data/horário atribuído | Entender quem registra em lote e testar reconciliação | N/condicional: semântica de timestamps precisa ser validada primeiro. |

### Dados adicionais que podem valer a pena

1. **Missão aceita versionada**, prazo, escopo e recompensa: necessários à promessa de novas modalidades.
2. **“Não sugerir isso por enquanto”** por assunto/arena: proposta opcional, mais útil que coletar mais dados pessoais.
3. **“Essa sugestão ajudou?”** ocasional e dispensável: pode avaliar utilidade sem presumir que clique é satisfação.
4. **Evento de orientação mostrada e destino acionado**, sem texto pessoal: para descobrir se o Oráculo ajuda a navegar.
5. **Eventos de missão oferecida/aceita/concluída/abandonada**, com regra e versão: para avaliar adequação e falhas.
6. **Instante confiável de registro/correção**, se os timestamps atuais forem insuficientes: importante para resolver registro tardio, não para fiscalizar a vida.

Não coletar tudo preventivamente. Cada novo campo deve ter finalidade, consumidor, prazo de retenção e comportamento quando ausente. Processar agregados localmente quando isso atender ao caso; conferir regras de acesso antes de mover contexto ao servidor.

### O que não temos motivo para buscar nesta iniciativa

GPS, contatos do telefone, microfone, sensores corporais, histórico de outros apps, leitura de mensagens externas, navegação e dados financeiros externos. Nada disso é necessário para as propostas prioritárias. O Oráculo não precisa vigiar para orientar.

## 7. Dez utilidades concretas, com prioridade

| Prioridade | Utilidade | Exemplo proposto | Canal | Dependência |
|---|---|---|---|---|
| P0 | Confirmar progresso | “Treino 5/7. Faltam 2.” | Toast/card de arena | Cálculo existente |
| P0 | Acompanhar compromisso escolhido | “Sua missão está em 4/6, até sexta.” | Oráculo + botão da missão | Instância com prazo |
| P0 | Evitar comentário contraditório | Não cobrar treino numa missão de volume por ter descansado | Todos | Política comum |
| P1 | Propor desafio que caiba | “Quer concluir esta arena ou distribuir seis ações nos próximos dias?” | Pedir missão | Elegibilidade e escolha |
| P1 | Apontar conflito real | “Esses dois compromissos se sobrepõem.” | Planner/orientação | Intervalos válidos |
| P1 | Ajudar a encerrar | “As metas deste ciclo estão concluídas. Quer ver o resultado?” | Orientação | Estado canônico |
| P1 | Reconhecer retomada | “Leitura voltou a ter registros.” | Reação de marco | Histórico por arena |
| P1 | Dar contexto ao resultado | “Você cumpriu uma parcela maior do plano que nos ciclos comparáveis.” | Relatório/orientação | Comparação válida |
| P2 | Facilitar próximo ciclo | Mostrar arenas e metas anteriores como ponto de partida editável | Planejamento | Reutilizar fluxo existente, sem criar/aceitar sozinho |
| P2 | Recordar conquista | “Esta arena foi concluída com 12 entregas em 8 dias.” | Histórico/perfil | Snapshot de feito |

O Oráculo deve permitir ação útil junto da fala quando cabível: abrir arena, ver missão, consultar planner, rever ciclo. Não oferecer botão cuja operação ainda não existe. Preferir navegação existente antes de adicionar edição conversacional.

## 8. Retorno: o que faria a pessoa querer abrir amanhã

### Retorno por orientação

A pessoa sabe que o quadro vai mostrar onde está. Não é preciso gerar novidade artificial de madrugada: objetivo/restante/compromissos escolhidos já podem ter valor. A tela inicial não deve obrigar leitura de card nem resgate antes de acessar o planner.

### Retorno por antecipação

A missão aceita mostra uma conclusão próxima e uma recompensa conhecida. `5/7` tem mais valor quando os sete representam algo que a pessoa quer. A antecipação vem do objetivo visível, não de aumentar a perda de faltar.

### Retorno por identidade

Um feito passa a fazer parte do perfil/histórico. Proposta: preservar seu contexto — arena, entregas e período — usando snapshots já existentes. O usuário pode se reconhecer no que construiu e personalizar com itens conquistados.

### Retorno por curiosidade

Card informativo pode oferecer algo breve e interessante. Manter utilidade independente de completar tarefas. Evitar usar o card para introduzir cobrança global de sequência que foi retirada do coach. Não esconder orientação essencial atrás do card Premium.

### Retorno por compromisso voluntário

Quem aceitou dias seguidos pode querer manter a missão. Quem escolheu quantidade com prazo quer acompanhar o volume. Quem não aceitou missão continua tendo produto útil.

### Retorno por consequência social

Convite, presente ou resultado autorizado pode justificar abrir o app. Não fabricar comparação competitiva entre amigos nem expor registros privados para produzir engajamento.

## 9. Uso prazeroso e “dopamínico”: desenho de experiência, não promessa biológica

Aqui “dopamínico” significa gratificante, antecipável e agradável. Não medimos dopamina e não há evidência nesta análise para afirmar efeito neuroquímico.

### Um circuito completo

**Escolher algo meu → agir fora do app → registrar com pouco esforço → ver avanço → reconhecer resultado → escolher se quero continuar.**

O ponto fraco a resolver primeiro é o retorno imediato do registro. Mais efeitos sem informação podem cansar; informação seca sem sensação de conclusão pode parecer burocrática. Os dois podem coexistir sem encher a tela.

| Componente | Proposta | O que evitar |
|---|---|---|
| Confirmação imediata | Barra/contador responde e toast confirma | Modal a cada tarefa, confirmação antes de salvar sem reversão em erro |
| Progresso próximo | Restante legível e meta escolhida | Meta aumentando automaticamente quando quase termina |
| Celebração proporcional | Tarefa pequena breve; arena/missão relevante recebe destaque | Tudo ter a mesma explosão e perder significado |
| Recompensa conhecida | Lista completa antes de aceitar | Texto omitir EXP/itens ou prometer baú diferente do concedido |
| Surpresa do baú | Preservar abertura e coleção existentes | Criar novo sorteio pago ou escalar economia nesta mudança |
| Autoria | Escolher desafio, arena e ritmo | Oráculo aceitar compromisso por conta própria |
| Identidade | Perfil e memória do feito | Apagar conquistas anteriores ao perder missão |
| Variação de fala | Texto revisado adequado ao mesmo fato | Variar frases para esconder cobrança repetida |
| Recomeço | Voltar com clareza do estado atual | Dívida de dias, reparação comprável ou punição retroativa |
| Descanso | Permitir ritmo espaçado | Premiar só calendário cheio e chamar isso de saúde |

Não aumentar recompensa por número de checks antes de verificar equilíbrio: a mesma atividade pode ser dividida em vários registros. Esse incentivo deve ser avaliado em missões de quantidade. A limitação por instância e escopo contém repetição econômica, mas não verifica a verdade da atividade externa.

## 10. Missões que exploram os dados sem inventar outro produto

### Primeira entrega proposta

- **Consecutiva voluntária:** uma ação elegível em cada um de três dias; regra de registro tardio e começo declarada.
- **Volume com prazo:** seis ações elegíveis em quatorze dias; descansos livres.
- **Conclusão de arena:** concluir escopo aceito; edição posterior não diminui silenciosamente a obrigação.
- Preservar **dias distintos** e **retomada** já existentes para usuários atuais.

### Ideias posteriores, para revisão — não escopo aprovado

| Ideia | Dado necessário | Valor | Risco/custo |
|---|---|---|---|
| Escolha de “finalizar” ou “distribuir” | Restante + agenda da arena | Ajuda a escolher modalidade sem jargão | Não criar mais tipos se os existentes cobrem. |
| Missão de um Marco relevante | Ação Marco escolhida | Valoriza entrega única que não cabe em contagem diária | Prêmio precisa considerar regra e escopo, não nome impressionante. |
| Missão entre duas arenas escolhidas | Escopo explícito de duas arenas | Atende quem quer distribuir atenção | Não impor equilíbrio universal; segunda versão após arena única. |
| Repetir desafio anterior com novo período | Histórico de instância e tarefas utilizadas | Oferece continuidade familiar | Não reutilizar entregas nem inflar ouro ilimitadamente. |
| Retomar sem prazo obrigatório | Arena escolhida + última entrega | Reduz esforço de voltar | Evitar ciclo de abandonar para farmar retomada. |
| Plano inicial inspirado no ciclo anterior | Snapshot de ciclo e ação do usuário | Facilita planejamento | Não usar como missão econômica de “criar e apagar ciclos”. |

Para cada missão, responder antes de implementar: o que conta, quando começa/termina, como lida com madrugada/atraso/correção, o que ganha, se pode repetir e o que ocorre se desistir. A versão mais curta da UI deve continuar permitindo ler essas condições.

## 11. Três jornadas para testar a utilidade

### Pessoa que treina espaçado

Abre e vê `Treino 5/7`. Pede missão e escolhe quantidade com prazo. Registra a sexta sessão: recebe estado atualizado; Presente pode comentar, Equilibrado fica quieto até marco. No descanso, nenhuma cobrança de dia seguido. Perto do prazo aceito, aviso só se autorizado e ainda pertinente.

### Pessoa que faz muito e registra depois

Volta ao app e encontra o estado sem sermão. Registra nas datas corretas; missão reconta conforme regra declarada. O Oráculo não chama o dia de registro de “dia em que você fez tudo”. EXP mantém reconciliação atual. O produto ajuda a recuperar a visão da vida sem exigir falsificar a data para preservar prêmio.

### Pessoa que gosta de rotina diária

Escolhe missão consecutiva com início explícito. Acompanha `2/3 dias` e sabe a recompensa. Aviso de prazo segue escolha de notificação. Ao cumprir, encerra o desafio; não nasce automaticamente outra obrigação no dia seguinte. Pode pedir uma nova missão ou continuar usando o quadro.

## 12. Como medir utilidade sem premiar só abertura

Separar quatro resultados:

1. **Compreensão:** consegue explicar onde está e qual é a regra da missão?
2. **Utilidade:** a orientação levou a consultar/ajustar algo relevante? Clique é pista, não comprovação.
3. **Prazer:** percebeu avanço e quis ver/conservar a conquista? Pergunta qualitativa curta pode ajudar.
4. **Retorno sustentável:** voltou por motivo útil, com pouco atrito para registrar, sem precisar aumentar pressão ou moeda?

### Eventos mínimos propostos, se os existentes forem insuficientes

`oracle_guidance_shown`, `oracle_guidance_action`, `mission_offer_shown`, `mission_accepted`, `mission_completed`, `mission_abandoned`, `mission_reward_claimed`, `notification_delivery_attempt`, `notification_opened` somente quando tecnicamente comprovável.

Guardar tipo/versão, categoria, regra, presença e identificador pseudônimo quando necessário. Não guardar texto da arena, nota pessoal ou humor no evento de analytics por padrão. Deduplicar e definir retenção antes de ativar. Não confundir push enviado com push recebido ou aberto.

### Comparações úteis

- Quem usa ciclos versus quem não usa; quem escolhe sequência versus volume; quem registra diariamente versus em lote, apenas se essa classificação tiver dados confiáveis.
- Tempo/esforço até entender o próximo passo, clareza do contador, taxa de erros/reconciliações, silenciamento e abandono de missão.
- Missões concluídas com uso repetido de tarefas ou metas reduzidas: falha de regra a investigar, não atributo moral do usuário.
- Não declarar vitória só por mais conclusões, mais sessões ou mais moedas gastas.

## 13. Critério para qualquer nova fala

Uma fala proposta precisa passar por estas perguntas:

1. Que dado a sustenta e qual sua qualidade?
2. O que a pessoa ganha ao ouvi-la agora?
3. Ela acrescenta algo ao que já está visível?
4. Tem ação útil ou é um reconhecimento que vale por si só?
5. A presença e as permissões permitem este canal?
6. Já foi dita sem mudança relevante?
7. Continua correta para descanso, turno noturno e registro tardio?
8. Se a pessoa não agir, o texto continua respeitoso e verdadeiro?

Se não passar, melhorar o quadro ou ficar em silêncio é preferível a escrever outra variante de cobrança.

## 14. Prioridade recomendada para esta oportunidade

**Primeiro:** política coerente de presença/push e progresso visível. **Depois:** missão individual versionada com modalidades aceitas e acompanhamento contextual. **Depois:** comparação histórica útil e preparação do próximo ciclo. Humor, perfil comportamental sofisticado e novas missões compostas ficam fora da primeira entrega.

O diferencial possível não é “um app que sabe tudo sobre você”. É um app que usa bem o que você escolheu registrar e devolve orientação, prazer de progresso e memória do que construiu.

## Pedido adicional à IA revisora

Confronte este levantamento com o checkout. Classifique dados ausentes, opcionais, redundantes ou com semântica frágil. Escolha as cinco utilidades com maior valor e menor construção nova, e proponha exemplos de falas com gatilho e silêncio definidos. Aponte onde estamos confundindo vida, registro e uso do app. Não expanda coleta ou economia sem justificar a necessidade.
