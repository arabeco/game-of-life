# Relatório de Auditoria Visionária: Protocolo GLYPH (Nível Arquiteto)

**Data:** 2026-02-16
**Status:** CONFIDENCIAL
**Autor:** Arquiteto Fullstack Visionário (QI 145)

## Diagnósticos Cirúrgicos: Onde a Soberania Falha

A análise profunda do ecossistema GLYPH revelou uma base sólida, porém fragmentada. O sistema opera como uma coleção de ferramentas competentes, mas falha em entregar a experiência de um organismo vivo e onipresente que a "Soberania" exige.

### 1. A Ilusão da Conectividade (Assets/Sephirot)
**Diagnóstico:** O sistema de Assets (Sephirots) é atualmente um mapa estático. As linhas conectando as esferas são meramente decorativas (`TreeLinesSVG`).
**Falha de Lógica:** Uma Árvore da Vida deve *pulsar*. A energia (XP, foco, tempo) gasta em "Malkuth" (Físico) deveria fluir visivelmente para "Yesod" (Fundação/Hábitos) e "Hod" (Intelecto).
**Sintoma de UX:** O usuário sente que está apenas categorizando tarefas, não cultivando um jardim espiritual. A falta de feedback visual dinâmico torna a "evolução" abstrata demais.

### 2. Atrito Cognitivo no Planejamento (Planner/Grid)
**Diagnóstico:** O "Bay Area" (Task Pool) é um purgatório de intenções. A necessidade de arrastar manualmente cada tarefa, todos os dias, gera uma carga cognitiva desnecessária ("Fadiga de Decisão").
**Falha de Lógica:** Um sistema soberano deve antecipar a vontade do regente. Se eu treino todo dia às 7h, por que preciso arrastar o ícone "Treino" para as 7h todo dia?
**Sintoma de UX:** O ato de planejar torna-se um trabalho, quando deveria ser um ritual de comando. O sistema é reativo, não proativo.

### 3. O Silêncio do Progresso (SITREP/Reports)
**Diagnóstico:** Os relatórios são autópsias. O feedback sobre o ciclo só chega quando ele termina ou quando o usuário clica ativamente em "Relatórios".
**Falha de Lógica:** Em um cockpit de caça ou HUD de jogo AAA, a informação vital (combustível, munição, integridade) está sempre na visão periférica.
**Sintoma de UX:** O usuário navega "às cegas" durante o dia, sem saber se está ganhando ou perdendo o dia até que seja tarde demais para corrigir o curso. Falta um "SITREP Tático" em tempo real.

### 4. Fragmentação de Contexto (Arenas/Builder)
**Diagnóstico:** O "Modo Arquiteto" e a criação de Arenas estão segregados. O usuário sai do fluxo de "viver" para "construir".
**Falha de Lógica:** A construção do império deve ser orgânica. Criar uma nova Arena deveria ser tão fluido quanto criar uma nova tarefa. A distinção rígida cria barreiras mentais.
**Sintoma de UX:** Resistência em refinar o sistema. O usuário prefere usar uma estrutura imperfeita a ter que parar tudo para entrar no "modo de edição".

### 5. Recompensas Desconectadas (Gamification)
**Diagnóstico:** O sistema de XP e Baús é funcional, mas emocionalmente frio. Ganhar um "Baú Lendário" é apenas um pop-up.
**Falha de Lógica:** A recompensa deve ter peso. O "loot" deve impactar o sistema. O que eu faço com o "Ouro" ou "XP"? Se for apenas um número crescendo, a dopamina seca rápido.
**Sintoma de UX:** Tédio a longo prazo. A gamificação precisa de *consequência*. (Ex: XP alto desbloqueia temas visuais, ou "poderes" de automação no Grid).

---

## Implementações Inéditas: A Revolução do Ecossistema

Para transformar o GLYPH de utilitário em extensão biônica da vontade do usuário, proponho três implementações imediatas e letais.

### 1. Rede Neural Sefirótica (The Living Sephirot) - [IMPLEMENTADO]
**Conceito:** Transformar a `AssetsView` em um painel vivo com "Névoa Volumétrica" (Honor of Kings Style).
**Execução:**
- **Tecnologia:** Shader GLSL personalizado (WebGL) rodando em um canvas invisível.
- **Técnica:** Fractal Brownian Motion (FBM) com Domain Warping para criar filamentos de plasma.
- **Otimização:** Micro-renderer dedicado (sem Three.js) para performance máxima.
- **Melhorias (v3 - Calibragem Fina):**
    - [x] **Advection Flow Real (Shader):** Implementação de fluxo de advecção real no fragment shader.
        - [x] **Eliminação de Pulsação:** Remoção da lógica senoidal (wave) que causava efeito "liga/desliga".
        - [x] **Fluxo Contínuo:** A fumaça agora flui ininterruptamente do centro para fora, guiada por vetores de fluxo curvos.
        - [x] **Correção de Estática:** Ajuste de precisão (highp float) e offset temporal para evitar congelamento da animação em valores altos de tempo.
        - [x] **Restauracão do Vento:** Reintegração do vetor `globalWind` para adicionar deriva vertical suave ao fluxo radial.
    - [x] **Hybrid Electric/Smoke:** Implementação de lógica híbrida onde níveis baixos emitem raios elétricos finos e níveis altos emitem corpo de fumaça denso.
- **Integração:** Conectado ao `GameContext` para ler níveis das Sephirots e cor da Skin do usuário.

### 2. Protocolo Fantasma (Shadow Scheduler)
**Conceito:** Eliminar a fadiga de agendamento com "Sugestões Fantasmas" (Desbloqueável no Rank "Cavaleiro").
**Execução:**
- O Grid não começa vazio. Ele exibe "fantasmas" (cards com 30% de opacidade) das tarefas mais prováveis para aquele horário, baseado no histórico das últimas 4 semanas.
- **Interação:** Um toque simples no fantasma "materializa" a tarefa (confirma).
- **Diferencial:** Em vez de *criar* do zero, o usuário apenas *confirma* ou *rejeita* a rotina sugerida. Reduz o atrito de planejamento em 80%.
- **Impacto:** O sistema parece ler a mente do usuário. "Soberania" é ter o sistema trabalhando *para* você.
- **Gamification:** Este poder é desbloqueado apenas para usuários que demonstram consistência (XP/Rank elevado), tornando a evolução no sistema funcionalmente recompensadora.

### 3. HUD Tático de Combate (Real-time SITREP)
**Conceito:** Overlay persistente de métricas vitais.
**Execução:**
- Uma barra flutuante ou widget minimalista no topo do Planner (como um HUD de RPG).
- Exibe: XP do Ciclo atual (barra de progresso), "Streak" de dias perfeitos, e status da missão da Season ativa.
- **Diferencial:** Feedback imediato. Ao completar uma tarefa, a barra de XP sobe e brilha na hora, com efeitos de partículas.
- **Impacto:** Gamificação instantânea. O usuário sente o progresso a cada ação, viciando no loop de feedback positivo.

---

## Resposta do Soberano & Próximos Passos (Update 2026-02-16)

Com base no feedback direto do Usuário (Soberano), as seguintes diretrizes foram estabelecidas para refinar o plano de dominação.

### 1. Agendamento Automático Inteligente (Planner)
**Feedback:** "Se já tem horário e dias na ação (ex: Seg e Qua), deve ir direto pro Grid."
**Ação:**
- Investigar lógica atual de criação de tarefas. O sistema deve verificar, ao criar/editar uma ação, se ela possui recorrência (`days`) e horário (`time`) definidos.
- Se sim, o sistema deve automaticamente instanciar essa tarefa no Grid para os próximos dias correspondentes, eliminando a necessidade de arrastar do Bay Area.
- **Status:** Pendente de Investigação e Implementação.

### 2. SITREP Visual (Lâmpada de Status)
**Feedback:** "Icone de lampadinha colorido ao inves de só o contorno?"
**Ação:**
- Substituir indicadores numéricos ou contornos simples por um ícone de status semântico (Lâmpada) no cabeçalho.
- **Cores:**
    - 🟢 Verde/Acesa: Streak mantido, dia ganho.
    - 🟡 Amarelo/Piscando: Tarefas críticas pendentes, risco de quebra de streak.
    - 🔴 Vermelho/Apagada: Streak perdido ou inatividade crítica.

### 3. Integração de Codex e Arenas
**Feedback:** "Codex cria arena imaginária... quero integrar codex pronto com arenas minhas."
**Problema:** O fluxo atual de "Criar Codex" gera uma estrutura isolada. O usuário quer aplicar um Codex (conjunto de conhecimentos/hábitos) a uma Arena já existente (ex: aplicar o Codex "Estóico" na Arena "Mente").
**Ação:**
- Refatorar o fluxo de criação de Codex para permitir "Vincular a Arena Existente".
- Adicionar botão de **Excluir Codex** no fluxo de criação (atualmente inexistente).

### 4. Distinção XP vs Maestria
**Feedback:** "XP é para Nobreza, Nível é da Árvore de Maestria."
**Clarificação:**
- **XP (Nobreza):** Mede a consistência, streak e disciplina diária. É o "combustível" do império. Recompensas: Visual, Status, Desbloqueio de Funcionalidades (Shadow Scheduler).
- **Nível (Maestria):** Mede o conhecimento e profundidade em uma área, baseado nos questionários/árvore. É a "evolução" do personagem.
**Ideia:** O XP diário alimenta a *velocidade* com que você pode subir na Árvore de Maestria (ex: XP alto dá bônus de aprendizado?).

### 5. Avatar Customization 2.0
**Feedback:** "Melhorar modo de fazer bonecos... carregar pngs e sobrepor?"
**Ideias:**
- **Atualmente:** Sobreposição de PNGs (funcional mas limitado).
- **Futuro (Canvas Composition):** Usar um sistema de camadas em Canvas onde cada parte do corpo é um asset vetorial ou raster de alta qualidade que pode ter sua cor (hue-rotate) alterada dinamicamente.
- **Estilo RPG Maker:** Criar um "Character Creator" onde o usuário seleciona Base, Cabelo, Olhos, Roupa, Acessórios e o sistema compõe o avatar final e salva como um único asset otimizado.

---

## Próximos Passos (Plano de Ação Imediata - Revisado)

1.  **Refinamento Visual Final (Concluído):** Opacidade do Plasma reduzida para "efeito discreto".
2.  **Investigação Planner:** Verificar por que tarefas recorrentes não estão indo para o grid automaticamente.
3.  **Investigação Codex:** Localizar a falha na exclusão e integração de arenas.
4.  **Implementação SITREP:** Adicionar a "Lâmpada de Status" no cabeçalho.

*Fim do Relatório Atualizado.*
