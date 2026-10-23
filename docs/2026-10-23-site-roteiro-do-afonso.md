# Roteiro do site — do Afonso (23/10/2026)

Escopo do site novo, ditado pelo Afonso. **As frases entre aspas são dele e não devem ser trocadas.** Quem for implementar organiza e monta; não reescreve o roteiro.

Até o Afonso aprovar, tudo é feito numa **cópia** do site (como o Codex fazia com as prévias), nunca no `glyph-landing` publicado.

---

## O que já está decidido

- **Fica do site atual:** o topo com o símbolo e "Gerencie sua vida como um império", o visual (preto e dourado), as abas e os ícones.
- **A barra de abas de baixo tem 5 passos**, na ordem do app: Ativos, Arenas, Planner, Mundo, Config. No computador, as mesmas abas ficam no topo.
- **Tom:** mostrar o app, não vender. Nada de "tela de venda".
- **Palavras proibidas no site:** "frentes", "prioridade" (para explicar arena), "calendário" (para explicar o planner).
- **Sem os números ao vivo** (pessoas no Mundo, EXP acumulada etc.) por enquanto: ainda não têm apelo.

---

## A barra de baixo: 5 passos

### 1. Ativos — "Divida sua vida em 5 áreas"

- **Mostrar:** as 5 áreas, com nível e arenas de exemplo (mockadas).
- **1b. Por dentro de um ativo:** mostrar uma ou outra área aberta, como na tela do app: as arenas daquele ativo e alguma informação dele.

### 2. Arenas — "Crie suas arenas"

- **Mostrar:** em vez do print da tela com as arenas no grid, **as arenas soltas, empilhadas lado a lado**. Só o item arena, como peça, fora do grid.
- **2b. Talvez:** "cadastre ações dentro das arenas".

### 3. Planner — "Complete as ações"

- **Mostrar:** completar as ações.
- **Depois:** "acumule experiência", talvez com o **Painel Diário**.

### 4. Mundo — "Compartilhe seu mundo"

- **Hall da fama**
- **Grupo.** O app já chama de "Grupo" (sobrou um "clã" solto no app, que dá para padronizar). O site ainda fala "clã": trocar para "Grupo".
- **Vínculos**
- **Loja**

### 5. Config — "Configure seu personagem"

- **Mostrar:** o **print do pentágono**, não o de montar, com a opção **AVALIAR**. Ao clicar, a pessoa vai para a **página separada** de fazer a avaliação (ver abaixo).
- **Patentes.**

---

## Fora da barra de baixo

### Home

- **Cards de novidades** (news), como os de hoje.
- **Cards de comentários de usuários.** Arrumar a integração com o Supabase. Hoje o site já lê a tabela `testimonials_feedback` (só os com `is_approved = true`, os 6 mais novos) e já tem o formulário de opinião. Conferido em 23/10: a tabela tem 1 registro. Falta ver por que quase nada aparece: aprovação, poucos envios ou o próprio formulário.

### Avaliar (página separada)

- O simulador de Maestria, que hoje é a aba "Maestria", vira uma **página própria**. Chega-se a ela pelo botão AVALIAR do pentágono, em Config.

### Premium

- Uma página com os planos.

### Exclusão, Privacidade e Termos

- Continuam existindo, mas **escondidas**: link dentro das outras páginas ou no rodapé, não no menu.

---

## Em aberto (para o Afonso decidir)

1. **"Opinião" e "Waitlist"**, que hoje estão no menu de cima: somem, viram parte da Home ou vão para o rodapé?
2. **Nome da aba 5:** no celular o site diz "Config" e no computador "Progresso". O roteiro usa Config, como o app. Unificar?
3. **2b (ações dentro das arenas)** e **o Painel Diário no Planner** entram ou ficam de fora?
4. **Prints novos com uma conta viva** (o Afonso tira no celular). Servem para o site e para a Play.

## O que precisa existir para montar

- Arenas de exemplo (mockadas) com nomes e áreas reais, para Ativos e Arenas.
- A tela de dentro de um ativo (1b).
- O item arena solto (2), no estilo do app.
- Print do Painel Diário (3).
- Prints de Hall da fama, Grupo, Vínculos e Loja (4).
- Print do pentágono com o botão AVALIAR, e as insígnias das 10 patentes (5); as insígnias já existem no catálogo.
