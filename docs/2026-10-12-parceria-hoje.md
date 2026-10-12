# Parceria hoje (12/10/2026)

Levantamento pedido pelo Afonso junto da missão de clã: o que a parceria mostra, quando vence e a tag no ArenasView. Cada resposta traz de onde saiu.

## O que a arena da parceria mostra no ArenasView

- **O número é o seu, em X/Y.** Depois do acerto de 12/10 (commit `9e914f3`), cartão e lista fazem uma conta só e nunca trocam para o número do par (`components/ArenaCard.tsx`, `views/ArenasView.tsx`, `forceSharedPool: isExplicitSharedArena(arena) ? undefined : false`). Antes, durante uns segundos depois de abrir, o cartão mostrava o pool do par (em %) até o tipo de vínculo chegar. Era o "carregando estado antigo e brigando".
- **Quanto o par fez** aparece no cartão de Vínculos (Conexões), não na arena. Essa escolha está escrita no comentário do mapa de progresso em `views/ArenasView.tsx` (perto de `arenaProgressById`).
- As arenas **do outro** que estão ligadas a você aparecem como prévia, com as tarefas dele (`views/ArenasView.tsx:358`, `sharedLinkedArenas` sem dono local).

## Quando vence

- **O convite** vence em 7 dias sem resposta (`supabase/migrations/20261006120000_relationship_lifecycle_v3.sql:119`).
- **A parceria** dura **30 dias** a partir do aceite; competição dura o que foi combinado (1 a 30 dias) (`…lifecycle_v3.sql:245`). Renovar dá mais 30 dias (`…:234`).
- **Vencida, ela congela, não some** (`constants/relationshipLinks.ts:15-28`). Na tela de Conexões o cartão continua com "Expirada em dd/mm" e oferece renovar; ativa, mostra "Até dd/mm" (`components/ConnectionsModal.tsx:529-539`).

## A tag no ArenasView

- **A tag "Parceria"** (selo azul com pessoas) aparece no cartão e na lista das arenas ligadas (`components/ArenaStatusTags.tsx`, passada por `relationshipLinkTypeByArenaId` em `views/ArenasView.tsx:292`).
- **Ela continua depois que a parceria vence.** O ArenasView carrega os vínculos com `ended_at is null` (`views/ArenasView.tsx:429-434`), e isso inclui os vencidos, que só têm `expires_at` no passado. Então a arena de uma parceria congelada segue com o selo "Parceria", sem nada dizendo que venceu.

## O que ainda parece estranho (para o Afonso decidir)

1. **Selo de parceria vencida.** Tirar o selo quando vence, ou trocar por um selo apagado de "vencida"? Hoje ele fica igual ao de uma parceria viva.
2. **Os dias que faltam não aparecem em lugar nenhum.** `getRelationshipDaysLeft` existe (`constants/relationshipLinks.ts:37`) para "o selo discreto no canto do card", mas nenhuma tela o usa. Só a tela de Conexões mostra a data ("Até dd/mm").

Nada disso foi mudado. São escolhas de produto, e não defeitos com uma resposta certa.
