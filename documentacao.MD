# ✦ GLYPH: Hermetic Sovereignty OS

**Identidade:** interface hermética em dark mode, metal dourado/prateado, ritual e peso visual.  
**Conceito:** não é lista de tarefas; é um painel de soberania pessoal onde ações viram ritos e projetos viram arenas.

## 1. Visão Geral do Produto

GLYPH é um sistema de execução diária com gamificação e ritual. O núcleo combina planejamento em grid, execução com feedback tátil/visual, fechamento diário via SITREP e evolução do Soberano por áreas de vida.

## 2. Estrutura do Domínio

O domínio é composto por Assets (áreas macro), Arenas (contextos/projetos), Ações (unidades executáveis), Tarefas Agendadas (instâncias temporais), Ciclos e Relatórios (recortes de performance), Perfil/Soberano e camada social (Clãs e Aliados). Esse conjunto sustenta o fluxo de planejar, executar, avaliar e evoluir.

## 3. Áreas do App (Telas Principais)

- **Login/Onboarding:** autenticação por email/senha, cadastro com convite dourado e integração Supabase.
- **Ativos:** árvore tipo Sephirot com níveis e dossiês por área de vida.
- **Arenas:** criação/gestão de arenas e ações, com ícones, descrições e arquivamento.
- **Planner:** visão diária/semanal com grid, agenda e execução de tarefas.
- **Relatórios:** ciclos, resultados, comparação e recompensas.
- **Social:** clãs, aliados e solicitações.
- **Configurações:** Geral, Arsenal, Maestria, Missões e Hall da Fama.
- **Perfil:** identidade do Soberano, widgets e personalização visual.

## 4. Funcionalidades por Área

- **Ativos:** dossier com slots editáveis, níveis com descrições, arenas por área e visão em árvore conectada.
- **Arenas:** ações com tipos (Ação Recorrente, Compromisso, Marco), duração, repetições, dificuldade e ícones; criação rápida e edição contextual.
- **Planner:** drag & drop, replanejamento, ações recorrentes no pool, marcos, long press para concluir e feedback visual; checklist e oráculo de input rápido.
- **SITREP Diário:** travar metas do dia, acompanhar progresso em batalha diária e gerar score final com EXP.
- **Relatórios e Ciclos:** criação de ciclos, HUD de progresso, métricas, comparador de ciclos e recompensas por desempenho.
- **Social e Clãs:** busca de aliados, convites, solicitações; clã com santuário, membros, missões e progressão.
- **Perfil/Soberano:** avatar, bordas, banners, humor, widgets, inventário e skins.
- **Arsenal e Maestria:** baús, desbloqueios cosméticos e progressão de nobreza.
- **Missões e Temporadas:** missões sazonais, quests e recompensas associadas.
- **Conquistas:** feedback de eventos (marcos, promoções e vitórias).

## 5. Premium: Codex & Vínculos

- **Codex Builder:** modo arquiteto em sandbox para criar templates de arenas/ações e exportar JSON.
- **Vínculos:** mentoria por arena com convites, cards de pupilos/mentores e feedback de satisfação.

## 6. Infraestrutura e Arquitetura

- **Frontend:** React + TypeScript com estado central em GameContext e módulos por área.
- **Dados:** Supabase para autenticação e persistência; fallback local/mock quando necessário.
- **Camadas:** contexts para jogo, tutorial e codex builder; components para UI ritualizada e modais.

## 7. Fluxo Central do Usuário

Criar arenas e ações → planejar no grid → executar com feedback → fechar o dia no SITREP → revisar ciclos e ajustar a estratégia.

## 8. Direção de Experiência

O produto prioriza peso visual, clareza e ritual. Cada ação deve parecer decisiva, o progresso precisa ser legível e a rotina diária deve ter início, meio e fim com sentido.

## 9. Roadmap (ideias futuras)

O Oráculo deve permitir entrada por texto/voz com interpretação automática. A Transferência de Codex permitirá mentores distribuírem templates via link/QR para onboarding instantâneo.

## 10. Estrutura Societária (interna)

Usar **codinomes como identificadores internos**.

Cargo | Codinome | Equity
---|---|---
CEO | FORJA | — (fundador)
Co-founder | PROTOCOLO | 7%
Legal / Tributário | TESOURO | 5%
Marketing / Ideias | SINAL | 5%
Assistente | MANUTENCAO | 3%

- Cada cargo possui **salário separado do equity** (mensal), definido internamente.
O PACTO DE SOBERANIA: IMPÉRIO GLYPH
Um Império não nasce da sorte; ele é arrancado do caos através da execução implacável. O Glyph é a fundação de um legado e este conselho é o que sustenta o TRONO. A FORJA materializa a visão em código, pois sem ferramentas o Reino fica desarmado. O TESOURO blinda o ouro e os pactos, senão o Reino é saqueado pela própria desordem. O DOMÍNIO convoca as massas e subjuga o mercado, pois um Reino silencioso é um Reino morto. O SENTINELA guarda as muralhas e serve de coringa em cada brecha, garantindo que nada pare enquanto os generais avançam. O compromisso é o dízimo de sangue pela glória. Quem não aguenta o peso da pedra, não merece o brilho da coroa.

EQUITY E RECOMPENSA
Fatia: 5% iniciais (Potencial de 7% por lealdade extrema)
Vesting: 5 anos (20% ao ano)
Fase 1: Salário R$ 0 (Construção)
Fase 2: Ajuda de Custo (Tração)
Fase 3: C-Level Full (Escala)

FORJA (Tech Lead)
Perfil: Raciocínio lógico, disciplina de código e visão sistêmica.
🔴 Updates e novas funções (Difícil)
🔴 Ideação técnica e funcionalidades (Difícil)
🔴 Debug e contenção de erros (Difícil)
🟡 Arquitetura e fluxo de UX (Médio)

TESOURO (Legal/Financeiro)
Perfil: Organização obsessiva, frieza e atenção jurídica.
🔴 Contratos, termos e blindagem (Difícil)
🔴 Engenharia de capital p/ Investidores (Difícil)
🟡 Logística de checkout e taxas (Médio)
🟢 Saúde fiscal e burocracia (Fácil)

DOMÍNIO (Marketing/Mídia)
Perfil: Criatividade agressiva e resiliência ao algoritmo.
🔴 Produção de 7 vídeos virais/semana (Difícil)
🔴 Conquista de súditos e conversão (Difícil)
🟡 Mineração de tendências e mentores (Médio)
🟢 Branding e imagem imperial (Fácil)

SENTINELA (Operação/Suporte)
Perfil: Agilidade, prontidão e espírito de serviço.
🔴 Triagem de bugs e ameaças (Difícil)
🟡 Alimentação de dados dos Codexes (Médio)
🟡 Teste rigoroso de cada link/asset (Médio)
🟢 Suporte direto e agenda dos sócios (Fácil)

MARCOS DE CONQUISTA

MARCO 1: A PROVA DE FOGO (Meses 1-4)
Meta: 1.000 usuários ativos e LTV 3x maior que o CAC.
Objetivo: Provar ao mercado que o Império é uma máquina de lucro e não apenas um código. É aqui que saímos do Salário 0 para a Ajuda de Custo.

MARCO 2: A EXPANSÃO TERRITORIAL (Meses 6-10)
Meta: 5 Mentores externos na loja e crescimento de 20% MoM.
Objetivo: Atrair o primeiro aporte do "Ricão" (Investimento Seed). A meta é um Valuation que transforme seus 5% em patrimônio real.

[ TRONO (80%) ] 
    (O Criador / Fullstack)
               |
               V
      [ PROTOCOLO (5%) ] <--- (O Arquiteto / Segundo em Comando)
   (Tradução de Visão em Ordem)
               |
  _____________|__________________________
 |             |                          |
[ TESOURO ] [ DOMÍNIO ]              [ SENTINELA ]
  (5%)        (5%)                       (5%)
(O Escudo)  (O Clamor)                (O Alicerce)
 |             |                          |
 \_____________|__________________________/
               |
               V
      [ PRODUTO: APP GLYPH ]
    (Ecossistema de 10 Áreas)
               |
 ______________|_______________
|                              |
[ CODEXES ] <----------- [ MENTORES ]
(Ativos de Vida)       (Parceiros de Valor)