# Widgets GLYPH - Direcao Futura

Atualizado em: 2026-04-04

Objetivo: registrar uma direcao realista para widgets de tela inicial no GLYPH sem fantasiar que isso sai "de graca" do app web.

---

## 1. Veredito curto

Nao foi erro fazer o GLYPH em web.

Mas widgets sao uma superficie nativa separada.

Entao:

- a UI atual do app nao vira widget automaticamente
- a logica util pode ser reaproveitada
- a entrega precisa de uma camada nova de snapshot + leitura nativa

---

## 2. O que ja existe e ajuda muito

### Card de ciclo

O GLYPH ja calcula coisas boas para um widget de ciclo:

- progresso do ciclo
- score atual
- grau
- dias decorridos
- dias totais

Base atual:

- `components/MiniCycleHUD.tsx`
- `utils/coreLoopUtils.js`

### Painel diario / SITREP

O GLYPH ja tem uma boa fotografia do dia:

- stage do dia: `planning`, `battle`, `judgment`
- tarefas travadas
- feitas vs total
- arena foco do dia
- score do dia
- checklist

Base atual:

- `components/SitrepContent.tsx`
- `contexts/GameContext.tsx`
- `utils/coreLoopUtils.js`

### Estado central

Ja existe uma fonte central forte:

- `tasks`
- `activeCycle`
- `dailyCommitment`
- `checklistItems`
- `sequenceItems`

Isso ajuda porque o widget nao vai inventar dado. Ele so precisa ler um resumo pronto.

---

## 3. O problema real

Hoje boa parte da matematica ainda mora perto da tela React.

Exemplos:

- `MiniCycleHUD.tsx` calcula score e progresso dentro do componente
- `SitrepContent.tsx` calcula partes do retrato diario dentro do componente

Para widget, isso precisa virar funcoes puras e portaveis.

Widget nao quer JSX.
Widget quer dado pronto.

---

## 4. O que seria a arquitetura certa

### Etapa 1 - Extrair builders puros

Criar funcoes como:

- `buildCycleWidgetSnapshot(...)`
- `buildDailyWidgetSnapshot(...)`

Essas funcoes devem receber apenas dados puros:

- `tasks`
- `actions`
- `arenas`
- `activeCycle`
- `dailyCommitment`
- `checklistItems`

E devolver um objeto simples.

### Etapa 2 - Persistir snapshot

Sempre que algo importante mudar, o app salva um resumo pronto.

Exemplos de gatilho:

- mudou `tasks`
- mudou `activeCycle`
- mudou `dailyCommitment`
- mudou `checklistItems`

O snapshot precisa ir para um armazenamento compartilhado entre:

- app
- widget

### Etapa 3 - Widget nativo ler o snapshot

O widget nao recalcula tudo.
Ele le o snapshot.

### Etapa 4 - Deep link

Toque no widget abre o app na tela certa.

Exemplos:

- widget de ciclo -> abre ciclo / relatorios
- widget do dia -> abre planner ou SITREP

---

## 5. V1 realista

### Widget 1 - Ciclo

Conteudo:

- nome do ciclo
- progresso %
- grau
- score
- dias restantes

Interacao:

- toque unico abre o app

Motivo:

- e o mais limpo
- depende menos de interacao
- reaproveita bem a logica existente

### Widget 2 - Hoje

Conteudo:

- stage do dia
- feitas / total
- arena foco
- score do dia, se existir

Interacao:

- toque unico abre o SITREP ou Planner

Motivo:

- e util
- mas mais sensivel a atualizacao

---

## 6. O que eu NAO recomendo para v1

- planner arrastavel no widget
- estoque completo do planner
- completar muitas acoes direto do widget
- drag and drop no widget
- replicar o SITREP inteiro no widget

Isso vira projeto nativo pesado cedo demais.

---

## 7. Dificuldades reais

### Android

- widget exige camada nativa
- atualizacao depende de limites do sistema
- layout do widget e separado do app web

### iOS

- ainda mais restrito
- timelines e refresh sao mais controlados
- interacao e mais limitada

### Produto

- widget pode ficar desatualizado se o app nao sincronizar bem
- precisamos definir o que e "fonte oficial" do resumo exibido

---

## 8. Ordem inteligente

1. Publicar app mobile funcional
2. Estabilizar Capacitor / shell Android
3. Resolver push e billing
4. Extrair `widget snapshots`
5. Fazer widget Android v1
6. Depois pensar em iOS

---

## 9. Conclusao honesta

Widgets sao possiveis no GLYPH.

Nao exigem jogar fora o app.
Mas exigem:

- separar logica da tela
- criar snapshot
- criar camada nativa de leitura

O card de ciclo e o melhor primeiro alvo.
O painel diario vem logo depois.
O planner completo como widget nao deve ser objetivo inicial.
