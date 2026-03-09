# Plano Ciclos

## Direcao

Nao criar um sistema paralelo. O valor vem de renderizar a historia do ciclo a partir dos dados que o app ja tem.

O objetivo e mostrar nao so o score final, mas a cara real do periodo:

- densidade da semana
- distribuicao das arenas
- ritmo de execucao
- semanas fortes e semanas mortas
- memoria visual do periodo

## Principio Tecnico

Nao usar screenshot do planner como base principal.

Usar os mesmos dados do planner semanal para renderizar uma visao propria:

- tarefas agendadas
- tarefas concluidas
- arenas associadas
- score e metricas do ciclo
- periodo real escolhido no ciclo

Isso deixa o sistema:

- mais leve
- mais estavel
- exportavel
- reutilizavel em ciclo, era e legado

## Conceito

### 1. Atlas do Ciclo

Entrar no resultado do ciclo como uma leitura visual do periodo inteiro.

Cada semana do ciclo aparece como uma miniatura condensada, inspirada no planner semanal:

- etiquetinhas coloridas por arena
- distribuicao por dia
- densidade do periodo
- foco dominante da semana

Leitura esperada:

- "essa foi a semana mais forte"
- "aqui o ciclo morreu"
- "aqui houve concentracao em uma arena"
- "aqui houve dispersao"

### 2. Era Atlas

Agrupar varios ciclos dentro da mesma Era.

A Era deixa de ser so uma barrinha e vira um bloco historico com:

- nome da era
- intervalo de datas
- score medio
- horas totais
- arena dominante
- top acoes
- atlas resumido dos ciclos

### 3. Legacy Zoom

No Legado, a navegacao ideal e por camadas:

1. zoom out: Eras
2. zoom medio: Ciclos
3. zoom in: Semanas

O efeito desejado e sentir que o jogador esta abrindo um arquivo historico da propria vida.

## Valor de Produto

Isso serve para os dois lados do app.

### Lado game

- reforca progressao
- transforma ciclo em memoria visual
- fortalece era e legado
- aumenta vontade de compartilhar

### Lado basico

- mostra padrao real de execucao
- facilita retrospectiva semanal e mensal
- evidencia caos, constancia e foco
- vira ferramenta de leitura pessoal, nao so decoracao

## O que nao fazer

- nao criar outro planner
- nao fazer print literal do DOM do planner
- nao depender de layout atual para export
- nao inflar o relatorio com estatistica demais

## Ordem de Implementacao

### Fase 1. Limpeza e Base

- fechar o fluxo `Resultados -> Novo Ciclo`
- estabilizar `ReportsView`
- manter `planner <-> sitrep <-> ciclo` blindado
- criar seletores puros para leitura semanal do ciclo

### Fase 2. Atlas do Ciclo

- render de mini-semanas no resultado do ciclo
- resumo por semana: score, horas, arena foco
- usar o periodo real do ciclo, nao janela fixa

### Fase 3. Era Atlas

- agrupar ciclos por `era_boundaries`
- mostrar resumo da Era + miniaturas dos ciclos
- consolidar narrativa visual da fase

### Fase 4. Legacy Zoom

- navegacao Era -> Ciclo -> Semana
- reaproveitar os mesmos componentes de atlas
- integrar com `Exportar Legado Completo`

## Requisitos de UX

- leitura imediata
- sem poluicao
- manter o app leve
- funcionar bem em mobile
- visual forte, mas baseado em dados reais

## Definicao de Pronto da Fase 1

- `Novo Ciclo` abre sem falha apos o relatorio
- `type-check` passa
- `build` passa
- smoke do fluxo `encerrar ciclo -> relatorio -> resultados -> novo ciclo` passa
