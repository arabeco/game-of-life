# Handoff — verificação dos modais e do perfil

Data: 2026-09-04

## Pedido para a próxima IA

Não redesenhar a família visual. Verificar a implementação já feita, usando a placa B/monólito como padrão, e corrigir apenas falhas comprovadas de fluxo, responsividade ou dados reais.

## Fluxos e saídas esperadas

| Origem | Gatilho real | Saída esperada | Onde conferir |
|---|---|---|---|
| Arena concluída | `completeArena` no domínio de tarefas | modal compacto, somente dados; OK, compartilhar e preferência de celebrações | `contexts/gameDomains/taskDomain.ts`, `components/AchievementModal.tsx` |
| Missão, jornada, desafio, pacto | `grantMissionReward` | placa B com valores e itens realmente concedidos | `contexts/GameContext.tsx`, `components/AchievementModal.tsx` |
| Subida de patente | observador global de patente | vídeo opcional e depois placa B; uma concessão por item | `contexts/GameContext.tsx`, `constants/nobility.ts` |
| Baú aberto | seleção do baú no inventário | melhor item em destaque; extras abaixo, sem repetir o destaque | `components/Store/Inventory.tsx`, `components/ItemDetailModal.tsx` |
| Selo de temporada | missão final com `seloDaTemporada` | fundo vertical real, insígnia grande, demais itens abaixo e botão OK | `contexts/GameContext.tsx`, `components/AchievementModal.tsx` |
| Código resgatado | retorno do RPC de código | `CÓDIGO RESGATADO`, nome do código e itens reais | `views/SettingsView.tsx`, `utils/redeemRewardPresentation.ts` |
| VANGUARDA25 legado | flags persistidas antigas | mesmo RewardPack, via adaptador de payload antigo | `components/VanguardWelcomeModal.tsx`, `components/AuthenticatedApp.tsx` |
| Ciclo fechado | payload do relatório | baú uma vez, com arte, além de EXP/ouro/insígnia | `views/ReportsView.tsx`, `utils/chestRewardPresentation.ts` |
| Presente recebido | notificação não lida | item recebido na placa B e notificação marcada ao fechar | `components/AuthenticatedApp.tsx` |
| Premium/Platinum ativado | `premiumRewardPending` + payload persistido | baús e cosméticos como itens; créditos como entregas; capacidade, Oráculo, personalização e descontos em faixas | `contexts/GameContext.tsx`, `components/RewardPackBody.tsx`, `components/AuthenticatedApp.tsx` |
| Beta 14/14 | `betaRewardPending` | placa B com payload persistido | `components/AuthenticatedApp.tsx` |
| Virada de temporada | gate global/aba Temporada | despedida, nova temporada e três quests clicáveis | `components/SeasonDetailModal.tsx`, `components/AuthenticatedApp.tsx` |

## Modais removidos, compartilhados e preservados

- `MissionCompletionModal.tsx`: removido; era uma segunda implementação morta do mesmo fechamento de missão.
- `ChestOpeningModal.tsx`: removido; não tinha importador. O fluxo válido está no detalhe do item no Inventário.
- `AchievementModal` e `RewardPackModal`: ambos devem ficar. Compartilham `RewardPackBody`, mas o primeiro acrescenta vídeo, compartilhamento e preferência de celebração.
- `VanguardWelcomeModal`: deve ficar temporariamente como adaptador de perfis antigos. Ele não desenha uma família visual diferente.
- `RewardVideoPreviewModal`: QA por `?video_preview=1`, não é gatilho de recompensa do jogador.
- `SeasonTransitionModal`: editorial, não concede itens e não deve ser fundido ao RewardPack.

## Perfil aplicado

- Foto e moldura maiores. A moldura equipada agora é renderizada como `<img>` real sobre a foto; o exemplo usa a Borda Celestial.
- O selo de nível ao lado da foto foi removido por duplicar o `90` da bola inferior.
- Arestas em metal envelhecido derivado da skin UI, sem amarelo puro.
- Ritmo vertical recomposto: nome, clã, banner, abas e conteúdo têm separação própria; o modal não força mais uma altura excessiva no desktop.
- Banner Celestial menor, com margem lateral e separado das subabas.
- Subabas e pentágono ficam numa placa interna menor, com borda metálica discreta.
- Pentágono com três linhas de referência, metal dessaturado e medalhão central mostrando somente o número, sem `Índice` nem `de 100`.
- Ativos no canto inferior esquerdo e Jardim no inferior direito, ambos 64 px e sem texto visível.
- A bola de Ativos renderiza diretamente a arte da skin UI equipada (`basic.png`, `gold.png`, `frost.png`, `ember.png`, `aurora.png`, `void.png`, `genesis.png` ou a arte Cyber) com o nível por cima.
- Insígnias reais do inventário, menores, sem quadradinho e fora da placa do pentágono. `×N` aparece sobre o canto inferior direito da peça.
- Entre as insígnias de patente, só a atual aparece. A faixa limita a quatro e mostra `+N` quando necessário.
- O perfil não tem rolagem interna. O invólucro usa no máximo 700 px ou a altura disponível da tela.
- Implementação: `views/ProfileView.tsx`.
- Gráfico: `components/AssetPentagon.tsx`.
- Prova: `docs/drafts/profile-card-soberano-v2.html` e `docs/drafts/profile-card-soberano-v2.png`.

## Pesquisa de referência — Duolingo

Estas referências são **inspiração de UX**, não prova do comportamento do GOL. O que foi aproveitado delas:

- **Insígnias como coleção permanente:** no redesenho de conquistas, o Duolingo reuniu prêmios e marcos no perfil como troféus numa estante, com níveis de dificuldade e espaço para feitos comuns, raros e recordes pessoais. Aplicação no GOL: insígnias ficam visíveis como coleção de prestígio no perfil, sem quadradinhos competindo com a arte; `×N` aparece apenas nas famílias acumuláveis. Fonte: [How to Earn Achievement Badges on Duolingo](https://blog.duolingo.com/achievement-badges/).
- **Consistência sem transformar tudo na mesma caixa:** ao revisar as abas centrais, o Duolingo encontrou títulos, tipografia e espaçamentos inconsistentes; depois padronizou tamanhos e posições e passou a usar espaço vazio com intenção, em vez de forçar contêineres ao redor de tudo. Também registrou que consistência precisa respeitar a função de cada tela. Aplicação no GOL: a placa B é a família comum, mas Arena, item de baú e virada de temporada preservam hierarquias próprias; banner, identidade, abas e dados não devem ficar colados. Fonte: [Core tabs redesign](https://blog.duolingo.com/core-tabs-redesign/).
- **Celebração proporcional ao marco:** o estudo da sequência do Duolingo trata dias realmente importantes como marcos que precisam parecer especiais, usando uma imagem universal e uma animação mais poderosa. Aplicação no GOL: rotina recebe confirmação discreta; marco recebe placa; marco raro pode receber vídeo e cerimônia mais forte. Não gastar a animação máxima em toda ação. Fonte: [Animating the Duolingo Streak](https://blog.duolingo.com/streak-milestone-design-animation/).

Conclusão aplicada ao sistema: **coleção no perfil, estrutura visual compartilhada, identidade preservada por origem e intensidade proporcional ao valor do acontecimento**. O objetivo não é copiar a estética do Duolingo, e sim aproveitar a disciplina de hierarquia e feedback.

## Oráculo — controles e comportamento já implementados

Não juntar estes controles. Eles resolvem problemas diferentes:

| Controle | Decide | Não decide | Implementação principal |
|---|---|---|---|
| Presença do Oráculo | o que e com que frequência ele fala | animação, som, vibração ou permissão de push | `constants/oraclePresencePolicy.ts`, `components/AuthenticatedApp.tsx` |
| Avisos/push | onde a mensagem chega, inclusive fora do app | se o Oráculo existe ou o que ele comenta | `types.ts`, `components/AuthenticatedApp.tsx` |
| Telas de celebração | se abre a placa em tela cheia | concessão da recompensa | `components/AchievementModal.tsx` |
| Animações | vídeo inicial, confete e movimento sensorial | existência do modal ou da recompensa | `components/AchievementModal.tsx`, `components/AuthenticatedApp.tsx` |
| Sons e vibração | feedback sensorial correspondente | presença e frequência do Oráculo | `views/SettingsView.tsx` |

### Níveis de presença

| Nível salvo | Nome | Card diário | Fala de abertura | Reações |
|---:|---|---|---|---|
| `0` | Silencioso | não | nunca; responde quando chamado | nenhuma reação automática |
| `2` | Equilibrado | sim | uma por dia | somente marcos grandes |
| `3` | Presente | sim | toda abertura do app | marcos e rotina |

O valor `1` é uma lacuna histórica; os valores persistidos são `0`, `2` e `3`. O código normaliza valores antigos para o nível válido mais próximo.

### Regras de celebração e vídeo

- Se `celebrationScreensEnabled` estiver desligado, a tela cheia é pulada, mas a recompensa continua concedida e o jogador recebe toast. A opção **não mostrar novamente** altera exatamente essa preferência.
- Se `animationsEnabled` estiver desligado, patente, quest e relatório entram diretamente no conteúdo da placa, sem a etapa de vídeo.
- Com vídeo habilitado, tocar na animação executa **Pular animação** e revela a placa; o jogador não precisa esperar o clipe terminar.
- `?video_preview=1` abre uma prévia exclusiva de QA. Não é uma origem real de recompensa e não deve ser ligada ao jogador.
- Compartilhamento continua manual. Nenhum feito deve publicar automaticamente no feed.
- A gramática sensorial já diferencia `toque`, `fechamento`, `marco` e `marco_raro`. Campanha, relatório e ciclo usam peso de marco; sequência importante usa marco raro. Essa escala é a ponte correta entre a pesquisa acima e o produto.
- Conclusão de Arena dá toast de confirmação independentemente do comentário do Oráculo. O toast confirma o que aconteceu; o Oráculo interpreta o feito conforme o nível de presença.

### Smoke obrigatório do Oráculo

1. Testar Silencioso, Equilibrado e Presente em abertura, rotina e marco.
2. Desligar telas de celebração e confirmar: sem placa, com toast e com recompensa intacta.
3. Manter celebrações ligadas, desligar animações e confirmar entrada direta na placa.
4. Testar o botão de pular vídeo no primeiro toque.
5. Confirmar que negar push não silencia o Oráculo dentro do app.
6. Conferir som e vibração em aparelho real; build e navegador não comprovam sensação tátil.

## Artes criadas e ligadas

### Valores de 16 px

Em `public/assets/icons/`: `exp.png`, `ouro.png`, `fragmento.png`, `acoes.png`, `sequencia.png` e `meta.png`. O alvo final é vermelho/branco e o check foi reduzido. A interface usa `components/ValorIcon.tsx` para apresentar esses PNGs coloridos.

### Baús

Em `public/assets/catalog/interface/`: `bau_comum.png`, `bau_incomum.png`, `bau_raro.png`, `bau_epico.png`, `bau_lendario.png` e `bau_mitico.png`. As cores e nomes são centralizados por `constants/rarityVisuals.ts`; o baú recebido usa a própria arte e não deve aparecer duas vezes na mesma tela.

### Insígnias

Em `public/assets/catalog/interface/`: dez insígnias de patente (`insignia_rank_1_vagante.png` até `insignia_rank_10_soberano.png`), `insignia_ciclo_bronze.png`, `insignia_missao_prata.png`, `insignia_quest_temporada.png`, `insignia_season_genesis.png` e `recompensa_geral.png`.

Ordem de patente validada no catálogo: Vagante, Escudeiro, Cavaleiro, Lorde, Barão, Conde, Duque, Príncipe, Rei e Soberano. A insígnia acumulável de subida é separada da peça exclusiva de cada patente.

### Temporadas

- Fundos verticais prontos: `public/assets/catalog/season-genesis-background.png` e `public/assets/catalog/season-aurora-i-background.png`.
- Genesis possui borda, banner, tema UI e insígnia registrados.
- Aurora I possui fundo vertical, skin Guardião Aurora e arte `aurora.png` da skin UI.
- Verdade atual: borda, banner e PNG da insígnia Aurora I ainda não existem no catálogo final; os slots de borda/banner continuam `null` e a definição da insígnia não tem `imageUrl`. Não inventar que estão prontos.

## Arquivos centrais desta rodada

- `components/RewardPackBody.tsx`: miolo compartilhado da placa B e faixas de benefícios.
- `components/RewardPackModal.tsx`: casca de entregas diretas.
- `components/AchievementModal.tsx`: feitos com vídeo opcional, compartilhamento e preferência.
- `components/ItemDetailModal.tsx` e `components/Store/Inventory.tsx`: abertura de baú no detalhe grande.
- `components/SeasonDetailModal.tsx`: transição editorial entre temporadas.
- `components/VanguardWelcomeModal.tsx`: adaptador legado.
- `components/ValorIcon.tsx`: ícones pequenos de valores.
- `contexts/GameContext.tsx`: ritual único de missão, patente e payload Premium/Platinum.
- `contexts/gameDomains/taskDomain.ts`: gatilho de Arena concluída.
- `views/ProfileView.tsx` e `components/AssetPentagon.tsx`: perfil final.
- `views/ReportsView.tsx`: recompensa do fechamento de ciclo.
- `views/SettingsView.tsx`: resgate de código.
- `constants/catalogAssets.ts`, `constants/items.ts`, `constants/nobility.ts`, `constants/rarityVisuals.ts`, `constants/rewardEmblems.ts`, `constants/rewardPlateStyles.ts` e `constants/seasonContent.ts`: catálogo e regras visuais.
- `types.ts`: contrato de payload, inclusive vantagens estruturadas.

## Provas automáticas executadas

- `npm run type-check`: PASS.
- `node tests/reward-routing.regression.mjs`: PASS.
- `node tests/mission-reward-unification.regression.mjs`: PASS.
- `node tests/reward-modal.regression.mjs`: PASS.
- `node tests/item-art.regression.mjs`: PASS.
- `npm test` (`core-loop`): PASS, 29 cenários.
- `npm run test:ui-hygiene`: PASS.
- `npm run test:avatar-offsets`: PASS.
- `npm run build`: PASS, 2084 módulos transformados.
- `git diff --check`: sem erro; apenas avisos do Git sobre futura conversão LF/CRLF.

## Limite honesto da prova

Ainda falta um smoke autenticado, clicando uma vez em cada origem com dados reais, e a conferência em aparelho estreito. Build e regressões comprovam composição e contratos locais; não comprovam a aparência final em todos os perfis nem dados remotos já persistidos.

Não houve commit, push, deploy, migração remota nem instalação Android nesta rodada. O worktree já continha muitas alterações paralelas; não assumir que todo arquivo modificado listado pelo Git pertence exclusivamente a este trabalho.

## Checklist de aceitação para a próxima IA

1. Não criar outro modal de recompensa.
2. Não conceder item durante a renderização do modal; o modal apenas apresenta o que o fluxo já concedeu.
3. Confirmar que fechar limpa exatamente o estado pendente da origem.
4. Confirmar que tela de celebração desligada vira toast sem perder recompensa.
5. Confirmar que nenhum destaque aparece de novo na lista de extras do baú.
6. Testar o perfil com zero, uma, quatro e mais de quatro famílias de insígnias.
7. Testar Premium com e sem cosmético novo, e Platinum com dois baús.
8. Abrir o perfil real com skins UI Gold, Aurora e Genesis para confirmar arte e contraste da bola inferior.
9. Testar uma borda equipada, uma borda só por cor e um perfil sem borda.
10. Confirmar que Widgets e Resumo também cabem sem scroll interno; em modo de edição, verificar se listas longas não são cortadas.
