# Mapa final — modais de recompensa e estudo do perfil

Data: 2026-09-04

## Onde cada modal foi ligado

| Acontecimento | Origem real | Apresentação | Componente final |
|---|---|---|---|
| Arena concluída | `contexts/gameDomains/taskDomain.ts` | Placa B menor, dados da arena, OK, compartilhar e preferência | `components/AchievementModal.tsx` + `RewardPackBody` |
| Missão, jornada, desafio ou pacto | `grantMissionReward` em `contexts/GameContext.tsx` | Placa B com EXP, ouro, baú e itens | `components/AchievementModal.tsx` + `RewardPackBody` |
| Subida de patente | observador único de patente em `contexts/GameContext.tsx` | vídeo de patente e placa B com todos os cosméticos | `components/AchievementModal.tsx` + `RewardPackBody` |
| Baú aberto | `components/Store/Inventory.tsx` | abertura curta; melhor item em zoom; extras abaixo | `components/ItemDetailModal.tsx` em `focusMode` |
| Selo da temporada | `claimSeasonMission` -> `grantMissionReward` | fundo vertical, insígnia-herói e Tema UI abaixo | `components/AchievementModal.tsx` + `RewardPackBody` |
| Código comum | `views/SettingsView.tsx` | placa B construída do retorno real do RPC | `components/RewardPackModal.tsx` + `RewardPackBody` |
| Código VANGUARDA25 | flag histórica do backend em `AuthenticatedApp` | mesma placa B, payload adaptado | `components/VanguardWelcomeModal.tsx` -> `RewardPackModal` |
| Fechamento de ciclo | `views/ReportsView.tsx` | placa B; baú aparece uma vez com a própria arte | `components/RewardPackModal.tsx` + `RewardPackBody` |
| Presente, Premium e beta | `components/AuthenticatedApp.tsx` | mesma placa B; no Premium, baús/cosméticos são itens e capacidades/modos/descontos são faixas | `components/RewardPackModal.tsx` + `RewardPackBody` |
| Passagem de temporada | gate global e tela de Temporada | despedida + abertura + três jornadas clicáveis | `SeasonTransitionModal`, em `components/SeasonDetailModal.tsx` |

## O que estava repetido

1. `MissionCompletionModal.tsx` era uma segunda tela completa para a mesma missão e não tinha nenhuma chamada. Foi removido.
2. `ChestOpeningModal.tsx` já estava morto e sem importadores. A exclusão foi mantida; abertura de baú vive no Inventário.
3. `claimSeasonMission` concedia item, baú e patente manualmente, enquanto `grantMissionReward` fazia o mesmo para as outras três origens. Agora também usa o ritual único.
4. A patente era detectada dentro do ritual de missão e novamente pelo observador global. Isso podia duplicar modal e recompensas. Só o observador global ficou responsável.
5. A própria insígnia de patente era concedida antes e novamente dentro de `RANK_REWARDS`, que já contém essa insígnia. Agora cada item da tabela é entregue uma vez.
6. O fechamento de ciclo mostrava o baú em uma métrica e outra vez no bloco recebido. Agora ele aparece apenas no bloco visual, com PNG.
7. O toast “Itens de legado integrados” repetia tudo que o modal de patente já mostrava. Foi retirado; com celebrações desligadas, o `AchievementModal` continua fornecendo o aviso leve.

## O que parece repetido, mas deve ficar

- `AchievementModal` e `RewardPackModal` compartilham o mesmo `RewardPackBody`, mas as cascas são diferentes de propósito: o primeiro precisa de vídeo, compartilhamento e preferência; o segundo é entrega direta.
- `VanguardWelcomeModal` não desenha outro modal. Ele apenas traduz o payload legado de VANGUARDA25 para o `RewardPackModal`. Pode ser renomeado ou absorvido depois de uma migração de banco, mas removê-lo agora quebraria perfis com `vanguard_welcome_pending`.
- `RewardVideoPreviewModal` é ferramenta de QA acessível por `?video_preview=1`; não é uma recompensa concorrente para jogadores.
- `SeasonTransitionModal` não entrega recompensa. É uma passagem editorial de temporada e por isso não deve virar `RewardPackModal`.

## Perfil escolhido e aplicado

1. Foto, borda e selo de nível foram elevados e ganharam mais presença.
2. O amarelo puro da skin GOLD não é mais usado diretamente nas arestas: o perfil o mistura com bronze envelhecido para produzir um metal mais sóbrio. A mistura continua reagindo à skin UI equipada.
3. Ativos e Jardim ficam no rodapé, um em cada canto, com o mesmo tamanho e sem texto visível. `title` e `aria-label` preservam descoberta e acessibilidade.
4. As insígnias ficam soltas e discretas logo abaixo do conteúdo da aba — abaixo do gráfico na Maestria — sem competir com as bolas do rodapé. O contador acumulável aparece sobre o canto inferior direito da própria peça.
5. O perfil usa o inventário real; mantém apenas a insígnia da patente atual e prioriza patente, temporada e acumuláveis. Mostra quatro peças e `+N` quando houver mais.

A prova interativa e a captura atual estão em `docs/drafts/profile-card-soberano-v2.html` e `docs/drafts/profile-card-soberano-v2.png`.

## Comparação usada

O Duolingo passou a reunir recompensas no perfil “como troféus em uma prateleira”, acrescentou recordes pessoais e facilitou compartilhar conquistas. Na reformulação mais recente das abas, também relata que reduziu contêineres forçados, tornou títulos consistentes e usou espaço livre para diminuir ruído. A adaptação para o GLYPH é manter as peças como objetos de prestígio, mas aplicar a mesma clareza: coleção visível, hierarquia curta e compartilhamento fácil.

- https://blog.duolingo.com/achievement-badges/
- https://blog.duolingo.com/core-tabs-redesign/
- https://blog.duolingo.com/streak-milestone-design-animation/
