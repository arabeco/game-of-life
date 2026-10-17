# Jardim: cesta, tamanhos, guia — e fragmentos no Painel Diário

Pedido do Afonso em 17/10/2026, conversado com o Claude. Para o Codex fazer **junto**, numa rodada só, porque as três partes mexem na mesma economia de fragmentos e o guia precisa mostrar a cesta.

**Primeiro proponha, com números; implemente só depois do ok do Afonso.**

---

## 0. Como está hoje (conferido no código em 17/10)

**Jardim** (roda num iframe: `components/Garden3DModal.tsx` abre `garden3d/index.html`; a raiz é `views/zen3d/SandExperiment.tsx`, build `build:zen3d:embedded`, entradas em `zen3d-test/`).

- Tamanho: `views/zen3d/gardenTerrain.ts` → `GardenTerrain.size = 'standard' | 'spacious'` (Amplo = escala 1,25, +56% de área). Troca livre em `GardenLayoutPanel.tsx` ("Formato e tamanho"). `DEFAULT_TERRAIN` já é `spacious`.
- Limites: `validateGardenSnapshot` (`gardenAccount.tsx`) aceita até 64 objetos e 8 artefatos; `MAX_OBJECTS` em `model.ts` é 96 — divergente, conferir.
- Bases (`gardenTemplates.ts`): open grátis; path 45, pond 110, river 260 de ouro. Kits: starter grátis, luxury 210, genesis 480 (`constants/goldCatalog.ts`).
- Ajuda atual: um `<aside className="zen3d-help">` só de texto em `SandExperiment.tsx` ("Sem tarefa. Sem pressa.").
- Abertura: salvar/carregar por `load_garden_3d` e migrations `20260909*`.

**Fragmentos** (`constants/economy.ts`):

- Entram quase só por baú (`chest_bonus_fragments`: ciclo 10–30, raro 30–80, épico 80–200…), por quebrar repetido (`recycle_values`: 10 a 1000 conforme o patamar) e por convite (10).
- Saem pela forja (`craft_costs`: patamar 2 = 120, 3 = 400, 4 = 1200, 5 = 4000; sorteio = 60%) e pelos baús da loja (`BAUS_A_VENDA` em `ItemsStore.tsx`).
- Itens de jardim podem ser forjados (`isForgeEligibleItem`). O Pátio dourado (patamar 4) sai por 1200 fragmentos.

**O problema, nas palavras do Afonso:** fragmento está muito difícil de ganhar; só fechando ciclo desmotiva, mesmo com a cesta.

---

## 1. Cesta na entrada do jardim

- Fica **na entrada, fora da areia**. Acumula conforme as **ações concluídas** e abre quando a pessoa entra no jardim.
- **Nada nasce dentro do jardim.** Quem decora é a pessoa; nenhum objeto aparece sozinho na composição.
- Conteúdo: **o lado "sorte" da economia** (ver a parte 4): chance de baú, bônus pela patente, de vez em quando um punhado de fragmentos. O grosso dos fragmentos diários vem do Painel Diário, para a cesta não duplicar a mesma recompensa.
- **Sem castigo:** não perde nada se não entrar; acumula com teto (sugestão: 7 dias).
- **Não dá EXP nem vantagem no jogo.** O app não tem pay-to-win e isto não pode virar farm.
- Aviso discreto quando há algo na cesta (ex.: bolinha no ícone do jardim no perfil).

## 2. Tamanhos em progressão ("jardim conquistado")

- O "Amplo" vira **~9 tamanhos** que vão se conquistando.
- Proponha o que faz subir (ciclos fechados, patente, a cesta…) e se as vagas de peças crescem junto.
- **Ninguém perde o que já tem:** quem usa o Amplo hoje continua com pelo menos ele. Nenhuma coordenada de objeto é migrada (ver o comentário em `terrainDimensions`).
- Visitantes (vagalumes, pássaros, carpa no lago) **só como efeito visual**, sem coleta.
- Céu e luz continuam mudando **só com o horário**.

## 3. Guia do jardim (primeira vez)

Troca o `zen3d-help` de texto por um guia com imagens.

- **Quando:** sozinho na primeira vez que a pessoa abre o **próprio** jardim. Visitando o de outra pessoa (`readOnly`), não aparece. O botão de ajuda atual reabre o guia.
- **Formato:** modal com print em cima, título, duas linhas de texto; bolinhas de página, ← →, "Pular", e "Começar" na última. Mesmo visual dos modais do app.
- **Páginas (6):**
  1. **Sem tarefa, sem pressa** — o que é o jardim.
  2. **Desenhar na areia** — garfos, cores, Alisar, Desfazer.
  3. **Peças** — pôr, mover, girar.
  4. **Olhar e passear** — dois dedos para girar e aproximar; Entrar para caminhar.
  5. **A cesta** — entre e colha o que suas ações renderam.
  6. **Personalizar e salvar** — formato, tamanhos, modelos, céu; bases e kits com **ouro na loja** ou **forjados com fragmentos** pelo inventário; Salvar.
- **Prints reais** do jardim (o `zen3d-test` abre sem login), cortados e comprimidos (~40 KB cada, WEBP), em `public/garden3d/guia/`. Mostre ao Afonso antes de integrar.
- **Já viu:** guardado no aparelho (localStorage dentro do iframe, com try/catch). Numere o guia por versão: se uma página nova entrar no futuro, quem já viu vê só a página nova, uma vez, como "Novidade no jardim".

## 4. Fragmentos no Painel Diário (proposta do Claude, direção pedida pelo Afonso)

- O **Painel Diário** passa a render fragmentos todo dia, pelo que a pessoa fez **comparado com a própria média** (o Painel já mostra a EXP do dia em % da média). Assim vale igual para quem está começando e para quem já é forte: ninguém é premiado por ter mais tempo livre, e sim por cumprir o próprio ritmo.
- Uma entrega por dia, sem precisar abrir nada a mais: aparece no Painel como "+N fragmentos hoje".
- **Sem castigo** por dia sem uso.
- Divisão de papéis: **Painel = fragmento constante** (a base da economia); **cesta = sorte e extras** (baú, bônus de patente).

**Meta sugerida para calibrar (traga a conta antes de implementar):**

- Uso regular → forjar um item de **patamar 3 (400) em ~1 mês** e um de **patamar 4 (1200) em ~3 meses**.
- Isso dá algo como **10 a 15 fragmentos por dia** somando Painel + cesta, além do que já vem dos baús.
- Mostre quanto um jogador ganha hoje por semana (baús, repetidos, convites, missões) e como fica com a proposta.
- Confira se os baús à venda por fragmento não ficam baratos demais com a renda nova.

---

## Regras do projeto

- O Afonso roda o SQL: entregue o bloco para colar e compile antes com `npm run sql:checa`. Nunca use a service-role do `.env.local`.
- Não gere AAB nem suba versão. Não rode `npm run test:launch` (cria conta em produção).
- Teste de regressão para as regras: cesta e teto, progressão sem perda, guia uma vez por versão e nunca na visita, fragmento diário relativo à média.
- Ao terminar, atualize "Recados da outra IA" no `docs/PRANCHETA.md`. Item na prancheta: "Jardim: cesta, tamanhos, guia — e fragmentos no Painel Diário".
