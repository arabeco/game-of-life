# As 20 regras secretas — desenho

Decidido com o Afonso em 06/10/2026. As 10 regras de borda e banner existiam só
como declaração em `constants/desbloqueiosPorRegra.ts`: nada media, nada
entregava. Este desenho liga as 10 e acrescenta 10 novas.

## O que a pessoa vê

- Cumpriu uma regra: abre o **modal de recompensa normal**, com o título
  **"Conquista secreta"**, o nome da regra, a frase e o prêmio. Nenhum enfeite
  além do que o modal já mostra. Se várias destravam juntas, vem **um modal só**
  com todos os prêmios.
- O modal entra na **fila que já existe** (`setAchievementUnlocked`): não
  aparece por cima de patente, missão ou baú. E espera o relatório de ciclo
  fechar — o fecho do ciclo já empilha relatório, baú e às vezes patente.
- **Missões → Segredos · N de 20**: as descobertas com nome, frase e prêmio; as
  que faltam como **???**, sem dica.
- **Conta o passado.** Quem já cumpriu ganha na primeira conferência.
- As peças de regra **saem da loja e do baú**. Quem já tem continua tendo.

## As 20

Raridade é a dificuldade da regra; borda e banner do mesmo par têm sempre a
mesma. Mítico fica para temporada.

| Regra | Condição | Prêmio | Raridade |
|---|---|---|---|
| Disciplinado | um ciclo 100% com nota A ou mais | borda + banner | incomum (era comum) |
| Popular | 5 amizades | borda + banner | incomum |
| Veterano | ciclos fechados em 3 meses diferentes | borda + banner | incomum |
| Imparável | 30 dias seguidos com ação concluída | borda + banner | raro |
| Místico | 2 arenas de Propósito fechadas no mesmo ciclo | borda + banner | raro |
| Oráculo | 2 missões individuais do Oráculo, **sem contar a inicial** | borda + banner | raro (era épico) |
| Transcendente | um ciclo com 100+ ações planejadas e 90%+ feitas | borda + banner | épico (a borda era rara) |
| Celestial | uma arena fechada em cada uma das 5 áreas, no mesmo ciclo | borda + banner | épico |
| Guardiã | 2 mentorias levadas até o fim, como mentor | borda + banner | épico |
| Lenda Viva | 1.000 ações concluídas | borda + banner | épico |
| **Escriba** | 10 páginas do diário escritas | **skin** | comum |
| **Maratona** | um dia com 12 ações concluídas | **skin** | incomum |
| **Ancião** | 12 ciclos fechados | **skin** | raro |
| **Campeão** | vencer 3 competições | **skin** | épico |
| **Imperador** | 5.000 ações concluídas | **skin** | lendário |
| **Sereno** | humor registrado em 30 dias diferentes | borda + banner | incomum |
| **Alvorada** | 10 ações antes das 7h dentro de 7 dias seguidos | borda + banner | raro |
| **Prisma** | 14 dias seguidos com ação concluída nas 5 áreas | borda + banner | raro |
| **Profeta** | 5 missões individuais do Oráculo, sem contar a inicial | borda + banner | épico |
| **Pedra da Lua** | um ciclo SSS | borda + banner | lendário |

As 10 novas pedem arte: 5 skins e 5 pares de borda e banner — o handoff está em
`docs/2026-10-06-handoff-arte-das-regras-secretas.md`.

### O que cada condição quer dizer, exatamente

- **Página escrita**: página do diário com pelo menos 100 caracteres.
- **Ação antes das 7h**: tarefa concluída cujo horário marcado vai de 04:00 a
  06:59 — o que fica antes das 04:00 ainda é a madrugada do dia anterior.
- **Missão individual do Oráculo**: pacto de arena reclamado. A inicial é o
  pacto de tipo `primeira`.
- **Mentoria até o fim**: como mentor, chegou ao prazo sem ninguém sair antes.
- **Arena fechada no ciclo** (Místico, Celestial): todas as ações da arena
  cumpridas dentro do ciclo. O banco não guardava isso; o fecho do ciclo passa a
  anotar `arenas_fechadas_por_area` no relatório. Por isso essas duas só contam
  dali para frente.
- **Nota do ciclo**: a que o ciclo selou no relatório (`grade`). Ciclo fechado
  nunca é recalculado.

## Como funciona

**Uma verdade só para as regras.** Elas moram em
`constants/desbloqueiosPorRegra.ts` e são avaliadas em TypeScript. O servidor
não repete nenhuma regra: ele só entrega **os números**.

1. **`minhas_marcas_secretas()`** — função de leitura no banco (security
   invoker: o RLS de cada tabela já limita às linhas da própria pessoa). Devolve
   um JSON com os fatos: ações concluídas, maior sequência, maior dia, maior
   sequência com as 5 áreas, maior janela de 7 dias com ações antes das 7h,
   páginas, dias de humor, amizades, competições vencidas, missões do Oráculo
   (sem a inicial), mentorias até o fim, e o resumo de cada ciclo fechado (fim,
   duração, nota, feitas, planejadas, arenas fechadas por área).
2. **`utils/medidorDeSegredos.ts`** — função pura: fatos + regras → quais regras
   estão cumpridas. É ela que o teste exercita.
3. **A conferência** roda ao abrir o app e quando um ciclo fecha. Para cada regra
   cumprida que ainda não foi descoberta **e cuja arte já existe**:
   - entrega o prêmio pelo caminho de sempre (`grantUserUnlock` +
     `grantInventoryItem`, como a patente);
   - anota `segredo:<id>` em `completedSeasonMissions`, o mesmo saco de marcas
     que o app já usa para `free_progress_reset_at:`;
   - junta tudo num modal só e põe na fila.
4. **Regra sem arte fica desligada.** Peça sem PNG já fica escondida do catálogo
   (`isItemPendingArt`); a regra só dispara quando todo o prêmio dela está
   visível. Como tudo conta o passado, quem cumpriu antes ganha quando a arte
   chegar. Nenhum placeholder aparece para jogador.

## Loja, baú e catálogo

- `ItemDef.isRuleExclusive`: tira do baú (`isChestEligibleItem`) e da loja
  (`isGoldStorePurchasableItem`). As 18 peças que estavam à venda saem de
  `ACTIVE_GOLD_STORE_ITEMS` e perdem `costGold`.
- No servidor, `open_chest` e `buy_store_item` já recusam `is_rank_exclusive`
  (conferido no banco em 06/10). O gerador `tools/generate-items-sql.mjs` passa a
  gravar `is_rank_exclusive = true` para peça de regra, e o SQL deste trabalho
  aplica isso às 20 que já existem.
- As 15 peças novas entram no catálogo **sem `imageUrl`** — escondidas até a
  arte chegar — e em `public.items` com `is_live_in_game = false`.

## SQL (o Afonso roda)

Um arquivo, compilado com `npm run sql:checa`:

1. as 20 peças existentes: `is_rank_exclusive = true`, `gold_price = null`, e o
   tier e a raridade das que mudaram;
2. as 15 peças novas em `public.items`;
3. a função `minhas_marcas_secretas()`.

E um check final, só de leitura, que mostra os fatos da conta principal.

## Testes

- `tests/regras-de-desbloqueio`: 20 regras, ids únicos, toda peça de regra
  marcada como exclusiva e fora da loja e do baú, o par com a mesma raridade.
- `tests/medidor-de-segredos` (novo): limiares, Disciplinado exigindo A, regra
  sem arte nunca dispara, conta o passado, várias de uma vez viram um modal só.
- A função SQL roda num PGlite com dados de mentira antes de ir para o Afonso.
