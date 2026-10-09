# Auditoria de onboarding, tutorial e dicas — 08/10/2026

## Atualização após autorização das correções

O diagnóstico abaixo registra o estado anterior. Em 08/10 foram implementados:
- Primeiro uso sem criação de ciclo, seguido de explicações práticas de segurar para concluir, segurar e arrastar para agendar, e segurar novamente para desfazer. O ciclo fica como orientação opcional para depois.
- Retomada por usuário no dispositivo, reutilizando arena e ação já salvas. Formulários não salvos reabrem na entrada da criação.
- Teclas de campos de texto não avançam o guia. Pular não conclui uma seção; terminar as quatro marca o guia geral como assistido.
- Alvos atualizados para Campanhas, Histórico e Maestria; o passo Arsenal descreve o inventário atual.
- Dicas liberadas após o onboarding, suspensas durante os guias e com prioridade de subtelas e modais. Fechar/Entendi registra aquela dica; “Não quero ver dicas” desliga as restantes.
- Criação de ciclo aguarda confirmação e bloqueia envio duplicado enquanto salva.

Validação: TypeScript, regressões de onboarding/Oráculo/ciclo e build web Vite passaram. O teste `tests/onboarding-first-use.browser.mjs` percorreu os componentes reais do guia em contexto local simulado: nomes com espaços, reinício após salvar arena/ação, entrada sem ciclo, Pular e conclusão das quatro seções. Captura em `output/onboarding-qa/planner-first.png`, viewport 390 × 844. Isso não valida Android nem transações reais no Supabase. Não foi gerado AAB ou feita publicação.

---

Escopo: código atual de GOL1.006. Nenhuma alteração de fluxo ou de conta. Foram rastreados os componentes montados, navegação, persistência, alvos e textos. Não é validação visual em Android nem execução completa com uma conta nova.

## Experiência de primeiro uso

Após carregar o perfil e aceitar os termos, o onboarding abre se onboardingCompletedAt e onboardingDismissedAt estiverem vazios. A regra não verifica a idade da conta nem reinicia por versão. Uma conta antiga sem essas marcas também é elegível.

São 14 etapas no catálogo:
1. Propósito: organizar, hábitos, objetivo ou retomar.
2. Abrir criação de arena.
3. Escolher área da vida.
4. Nomear arena.
5. Salvar arena.
6. Abrir criação de ação.
7. Nomear ação.
8. Definir repetições, quando aplicável.
9. Salvar ação.
10. Abrir novo ciclo.
11. Conferir prazo (padrão de sete dias, limitado pelo término da temporada quando próximo).
12. Iniciar ciclo.
13. Escolher missões opcionais.
14. Encerrar, com indicação de tutoriais e ajustes do Oráculo.

O conteúdo muda parcialmente conforme o propósito. Cria entidades reais. Pular grava a dispensa e não desfaz o que foi criado. O passo atual e o ID da arena criada ficam no estado do componente: não há retomada persistida após reiniciar o app. A permissão de notificações pode ser solicitada após a saída, se ainda estiver pendente.

## Tutorial reaberto em Config > Preferências > Tutoriais

Quatro seções disponíveis para todos:
- Primeiros passos: arenas e campanhas (2 passos).
- Dia a dia: planner, ciclo e resumo diário (3 passos).
- Progresso: patentes, maestria e perfil (3 passos).
- Mundo e extras: grupos, vínculos, Oráculo, biblioteca, moedas, ajustes e encerramento (7 passos).

Há ainda uma introdução no catálogo, fora dos intervalos desses quatro botões. O componente ativo é OracleTutorialOverlay; TutorialOverlay.tsx existe, mas não encontrei montagem no fluxo atual.

É um passeio narrado: o overlay intercepta cliques para avançar. Não ensina execução prática como o onboarding. Os quatro botões dizem “Reabrir”, inclusive para seções nunca vistas, e ficam depois de toda a lista de dicas por tela.

## Achados confirmados no código

### Prioridade alta

1. **Espaço e Enter podem avançar enquanto se escreve.** FirstUseOnboardingOverlay.tsx:560 registra keydown global, chama preventDefault e handleNext sem excluir input/textarea/contenteditable. Nas etapas arena-name e action-name, um espaço em um nome composto pode disparar avanço. Evidência de código; comportamento com teclado virtual requer validação em dispositivo.
2. **Criação do ciclo sinalizada antes da confirmação.** NewCycleSetupView.tsx:100 chama startNewCycle assíncrono sem await e emite cycleCreated imediatamente. O onboarding avança para missões mesmo se a criação ainda estiver pendente ou for recusada. GameContext.tsx:10927 confirma a operação assíncrona.
3. **Não há retomada segura do primeiro uso.** Estado de etapa/arena é local; ao reiniciar sem concluir ou dispensar, o fluxo começa pelo propósito, mesmo com entidades já criadas. Pode induzir duplicação.
4. **Pular vira concluído.** OracleTutorialOverlay.tsx:156 e :238 chamam endTutorial(true) em Escape/Pular. TutorialContext.tsx:69 grava conclusão do nível, como se tivesse sido assistido.

### Coerência e navegação

5. **Primeira execução não é ensinada.** O onboarding termina em Ativos após criar estruturas; não inclui levar a ação ao planner, executar, concluir e desfazer. O ciclo é apresentado como etapa do caminho, embora o produto permita uso sem ciclo. Não há uma escolha específica de continuar sem ciclo; há a dispensa geral.
6. **Alvos desatualizados.** Campanhas aponta para campaigns-section, sem elemento correspondente; o topo usa campaigns-section-top. Ciclo aponta para cycle-hud, que hoje contém a navegação de datas do planner. Maestria abre uma subview por evento que substitui a seção onde fica mastery-sliders-button; a âncora pode desaparecer. A fallback de SettingsView ainda usa currentStep === 11, mas Maestria agora é índice 7.
7. **Biblioteca aponta para inventário.** O passo “12. BIBLIOTECA” abre social/arsenal, enquanto a própria descrição de Arsenal e o componente atual tratam de inventário. Precisa alinhar conteúdo e destino.
8. **Conclusão geral desconectada das seções.** Os botões abrem activeLevel 1–4 e a conclusão grava tutorial_level_N_completed. O status geral em Ajustes lê PROFILE_FLAG_TUTORIAL_COMPLETED, gravado pelo caminho sem nível. Completar as quatro seções por esses botões não promove esse status.
9. **Promessa de editar propósito sem porta visível.** A pergunta diz que dá para mudar depois, mas não encontrei controle de edição de onboardingPurpose nas telas. O valor é gravado apenas ao concluir.

### Dicas de primeira visita

10. **Suprimidas na sessão inteira do onboarding.** AuthenticatedApp.tsx:2324 inclui onboardingShownInSession na supressão; essa marca permanece true após concluir ou pular. A mensagem final promete apresentação na primeira visita, mas a pessoa pode explorar as telas nessa sessão sem recebê-la.
11. **Tutorial separado não suspende as dicas.** O seletor de dicas não consulta isTutorialActive. Em uma sessão posterior, os dois sistemas podem ficar ativos; o tutorial tem camada mais alta e pode encobrir a dica. Confirmar sobreposição visual no navegador.
12. **Religar não reapresenta o que já foi visto.** É uma regra explícita: visto é persistido no armazenamento local por usuário e nas flags do perfil. Só X/Entendi/desligar marca a dica como vista; sair da tela sem fechar permite reaparecimento. Não existe botão de rever uma dica específica nem reset/replay seguro do onboarding.
13. **Contexto de subtela pode se perder ao fechar uma dica.** AuthenticatedApp.tsx:534 limpa screenIntroContextId a cada mudança de completedSeasonMissions; fechar a dica atualiza justamente essas flags. O contexto pode voltar à aba geral enquanto a subtela segue aberta, sem mudança que redispare seu evento.
14. **Cobertura declarada maior que as abas acessíveis.** Há 25 definições, inclusive settings_season, mas o listener de navegação de Ajustes aceita Geral, Preferências e Premium. A lista é catálogo, não prova de que todas as dicas são alcançáveis no produto atual.

## Catálogo completo das explicações

O texto abaixo vem diretamente das definições atuais. As dicas de Arenas, Planner e Relatórios têm variantes conforme arenas existentes, ciclo ativo e ciclos fechados.

| Tela | Título | Explicação | Próximo passo sugerido |
|---|---|---|---|
| Ativos (assets) | Olha o mapa antes de correr. | Aqui eu vejo quais areas estão fortes, cansadas ou pedindo atenção. | abre o ativo mais fraco e escolhe um movimento pequeno. |
| Arenas (arenas) | Uma frente por vez. | Arena e onde uma parte da vida deixa de ser ideia e vira coisa jogavel. | crie uma arena simples. O nome perfeito pode esperar. |
| Nova arena (arena_modal) | Comece pequeno. | Não precisa nascer perfeito. Nomeie a frente e escolha o ativo que mais combina. | preencha o nome e salve; a estrutura vem depois. |
| Planner (planner) | Agora o dia fica concreto. | Puxa uma ação, conclui o que cabe e deixa o ciclo sentir que você apareceu. | complete uma ação real. Uma já muda o estado do dia. |
| Nova ação (action_modal) | A ação e o menor passo. | Escreva algo que você realmente consegue fazer. Curto, claro e executável. | coloque título e tempo aproximado; o resto pode ficar para depois. |
| Descanso (rest) | Respira. Eu leio o agora. | Essa tela reduz o ruido e mostra o que importa sem te jogar em mil botões. | se o dia já teve uma conclusão, fecha com calma. Se não teve, pega uma ação pequena. |
| Mundo (social) | Aqui mora o mundo fora da sua tela. | Pessoas, mensagens, loja e camadas compartilhadas ficam aqui sem invadir o seu dia. | resolve o que chamou você e volta para a próxima ação. |
| Pessoas (social_people) | Encontre quem joga perto. | Use esta area para buscar pessoas, ver vínculos e cuidar da sua rede. | procure alguém ou revise quem já esta no seu círculo. |
| Pedidos (social_requests) | Tudo que espera resposta. | Convites e solicitações ficam separados para não virar bagunca no chat. | responda o que estiver pendente ou siga sem peso se estiver vazio. |
| Mensagens (social_messages) | Conversa humana fica aqui. | Eu aviso quando precisa, mas não misturo DM com leitura do sistema. | abre quem importa agora; o resto pode esperar. |
| Cla (social_clan) | A base do grupo. | Use esta area para acompanhar conversa, presença e combinados do clã. | leia o chat e veja se existe algo esperando sua resposta. |
| Feitos (hall) | Sua vitrine de legado. | Em Feitos, você acompanha as conquistas compartilhadas por você e pelos outros jogadores. | use Compartilhar em Feitos no resultado de uma conquista para publicá-la aqui. |
| Loja (store) | Compra sem virar labirinto. | Campanhas, itens e ouro ficam aqui. Entra pelo que você quer usar de verdade. | uma aba por vez. Campanha muda estrutura; item muda presença. |
| Codexes (store_codexes) | Campanhas prontas para instalar. | Codexes adicionam estrutura nova quando você quer seguir um caminho guiado. | abra uma campanha e veja se ela combina com sua fase atual. |
| Itens (store_items) | Identidade e presença. | Itens mudam como sua conta aparece: visual, perfil, jardim e estilo. | compre so o que você quer ver no seu perfil ou inventário. |
| Ouro (store_gold) | Recarga e suporte ao app. | Ouro serve para comprar expansoes e itens sem depender de grind pesado. | confira os packs apenas se você realmente precisar de saldo. |
| Temporada (season) | O que esta valendo agora. | A temporada mostra missões, recompensas e desafios vivos deste período. | pegue uma missão pequena e leve para suas arenas ou planner. |
| Arsenal (arsenal) | Seu inventário mora aqui. | Tudo que você ganhou, comprou ou equipou aparece nesta area. | abra artefatos ou cosméticos e equipe o que combina com você. |
| Config (settings) | Ajuste o app ao seu jeito. | Aqui ficam conta, privacidade, som, Oráculo, tutoriais e preferência de uso. | mude uma preferência por vez; não precisa configurar tudo agora. |
| Geral (settings_general) | O básico da conta. | Use esta aba para revisar estado da conta e atalhos principais. | confira se esta tudo certo antes de mexer nas opções finas. |
| Preferencias (settings_preferences) | Me regula do seu jeito. | Aqui você ajusta visual, som, vibração, dicas e o quanto eu apareco. | desliga o que cansa e deixa ligado o que te traz de volta. |
| Premium (settings_premium) | Extras ficam aqui. | Esta aba mostra beneficios pagos sem misturar isso com o seu fluxo diário. | compare com calma; o core do app continua funcionando fora daqui. |
| Temporada (settings_season) | Ajustes da fase atual. | Use quando quiser entender ou revisar o que esta ligado a temporada. | veja o status da fase antes de trocar alguma coisa. |
| Perfil (profile) | Esse e o seu sinal público. | Perfil junta identidade, nível e o que você decidiu mostrar para fora. | confere visual e privacidade antes de deixar alguém ver. |
| Relatorios (reports) | Aqui o ciclo vira memória. | Relatório não e bronca: e o registro do que você viveu e fechou. | se estiver vazio, fecha um ciclo quando tiver material real. |

## Recomendação de sequência

1. Corrigir teclado, confirmação de criação, retomada e semântica de Pular.
2. Atualizar alvos, destinos e conclusão dos quatro guias.
3. Terminar o onboarding com a primeira execução real no planner e uma escolha explícita sobre ciclo.
4. Coordenar as dicas com onboarding/tutorial e preservar o contexto correto da tela.
5. Adicionar uma prévia isolada de primeira visita para revisar tudo com conta antiga, sem apagar flags nem criar entidades na conta principal.
6. Revalidar os textos com foco em “para que serve, o que posso fazer e qual botão usar”. Algumas frases atuais explicam a atmosfera do app melhor que seu funcionamento.

## Verificação realizada

Passaram os testes locais existentes oracle-reaction.regression.mjs, launch-blockers.regression.mjs e oracle-presence-policy.regression.mjs. Cobrem regras auxiliares; não comprovam que o onboarding inteiro funciona. O smoke onboarding-happy-path.cdp.mjs cria usuário e dados em Supabase; foi inspecionado, não executado nesta auditoria. Não alterei a conta principal ou os fluxos do app.
