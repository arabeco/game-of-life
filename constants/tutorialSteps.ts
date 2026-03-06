import { TutorialStep } from '../types';

export const TUTORIAL_STEPS: TutorialStep[] = [
    {
        category: 'INTRO',
        title: "BEM-VINDO AO GLYPH",
        text: "Eu sou o Oráculo. Sou sua interface direta com este sistema de soberania.\n\nSua jornada para transformar sua existência em uma obra de arte começa aqui. Vou guiá-lo pelas 4 estações fundamentais do GLYPH.",
        view: 'assets',
        targetId: 'header-oracle'
    },
    // CARD 1: O ALICERCE
    {
        category: 'ALICERCE',
        title: "01. ARENAS (METAR)",
        text: "A divisão visual e estratégica das 10 áreas da sua vida. Cada Arena é um domínio que exige seu foco.",
        view: 'arenas',
        targetId: 'arenas-container'
    },
    {
        category: 'ALICERCE',
        title: "02. AÇÕES (DOSSIER)",
        text: "A criação de tarefas isoladas e específicas para o dia. É aqui que os planos se tornam execução.",
        view: 'arenas',
        showArenaId: 'first',
        targetId: 'add-action-button'
    },
    {
        category: 'ALICERCE',
        title: "03. PLANNER (BAY AREA)",
        text: "O mapa tático para organizar a semana e alocar ações. Arraste suas missões para o campo de batalha.",
        view: 'planner',
        targetId: 'planner-container'
    },
    {
        category: 'ALICERCE',
        title: "04. CICLOS (HISTÓRICO)",
        text: "A definição de prazos (ex: mês de Março) para bater metas. O registro da sua evolução no tempo.",
        view: 'planner',
        targetId: 'report-button'
    },
    {
        category: 'ALICERCE',
        title: "05. RELATÓRIOS",
        text: "O fechamento emocional e a análise de performance do ciclo. Entenda sua produtividade ao fim de cada jornada.",
        view: 'planner',
        showReports: true,
        targetId: 'end-cycle-button'
    },
    {
        category: 'ALICERCE',
        title: "06. PAINEL DIÁRIO",
        text: "A sua tela de combate matinal; o que precisa ser feito hoje. Alinhe seu espírito antes de começar.",
        view: 'planner',
        showReports: false,
        targetId: 'sitrep-button'
    },
    {
        category: 'ALICERCE',
        title: "07. TELA DE DESCANSO",
        text: "Ambiente visual para pausar, recarregar a energia mental e evitar burnout. A recuperação é essencial.",
        view: 'assets',
        targetId: 'lock-icon-button'
    },
    {
        category: 'ALICERCE',
        title: "08. DEEP FOCUS",
        text: "Cronômetro imersivo para sessões de trabalho profundo sem distrações. Mergulhe no que realmente importa.",
        view: 'assets',
        showRestScreen: true,
        targetId: 'deep-work-button'
    },
    // CARD 2: A IDENTIDADE (REQUER MODO GAME)
    {
        category: 'IDENTIDADE',
        title: "09. PATENTES",
        text: "[ REQUER MODO GAME ATIVADO ]\n\nSeu título de nobreza que evolui de Vagante a Soberano conforme sua disciplina.",
        view: 'settings',
        tab: 'Geral',
        targetId: 'profile-section'
    },
    {
        category: 'IDENTIDADE',
        title: "10. MAESTRIA",
        text: "[ REQUER MODO GAME ATIVADO ]\n\nA árvore de evolução (Sephirot) que sobe de nível baseada nos seus 10 Ativos.",
        view: 'assets',
        targetId: 'assets-grid'
    },
    {
        category: 'IDENTIDADE',
        title: "11. QUIZ DE MAESTRIA",
        text: "[ REQUER MODO GAME ATIVADO ]\n\nTeste de calibragem para definir a maturidade inicial do seu personagem.",
        view: 'settings',
        tab: 'Geral',
        targetId: 'mastery-sliders-button'
    },
    {
        category: 'IDENTIDADE',
        title: "12. PERFIL SOBERANO",
        text: "[ REQUER MODO GAME ATIVADO ]\n\nSua vitrine pública customizada com seus stats e widgets.",
        view: 'assets',
        showProfile: true,
        targetId: 'shareable-profile'
    },
    {
        category: 'IDENTIDADE',
        title: "13. ARSENAL",
        text: "[ REQUER MODO GAME ATIVADO ]\n\nO inventário onde você gerencia suas skins, anéis, artefatos e avatares 3D.",
        view: 'social',
        tab: 'arsenal',
        targetId: 'nav-arsenal'
    },
    {
        category: 'IDENTIDADE',
        title: "14. LOJA E FORJA",
        text: "[ REQUER MODO GAME ATIVADO ]\n\nA economia do jogo para gastar Ouro, Pepitas e Barras em recompensas.",
        view: 'social',
        tab: 'loja',
        targetId: 'nav-loja'
    },
    {
        category: 'IDENTIDADE',
        title: "15. PREFERÊNCIAS",
        text: "[ REQUER MODO GAME ATIVADO ]\n\nControle fino da experiência (animações RPG, sons e nível de gamificação).",
        view: 'settings',
        tab: 'Preferências',
        showOracleSettings: true,
        targetId: 'oracle-settings-modal-content'
    },
    // CARD 3: O MUNDO (REQUER MODO GAME)
    {
        category: 'MUNDO',
        title: "16. ALIADOS",
        text: "[ REQUER MODO GAME ATIVADO ]\n\nSistema de amizades para adicionar e acompanhar outros Soberanos.",
        view: 'social',
        tab: 'social',
        targetId: 'allies-search'
    },
    {
        category: 'MUNDO',
        title: "17. CLÃS",
        text: "[ REQUER MODO GAME ATIVADO ]\n\nTribos de usuários cooperando (ou competindo) para manter a Ordem da Aldeia.",
        view: 'social',
        tab: 'social',
        targetId: 'clans-section'
    },
    {
        category: 'MUNDO',
        title: "18. QUESTS DE TEMPORADA",
        text: "[ REQUER MODO GAME ATIVADO ]\n\nMissões épicas globais com prazo de validade (Ex: Temporada Gênesis).",
        view: 'social',
        tab: 'temporada',
        targetId: 'season-quests'
    },
    {
        category: 'MUNDO',
        title: "19. ORÁCULO (CHAT)",
        text: "[ REQUER MODO GAME ATIVADO ]\n\nA inteligência artificial conselheira para tirar dúvidas e guiar o jogador.",
        view: 'assets',
        targetId: 'header-oracle'
    },
    // CARD 4: O ARQUITETO
    {
        category: 'ARQUITETO',
        title: "20. ERAS",
        text: "O agrupamento de múltiplos ciclos para planejamento de vida a longo prazo (anos). Recursos de escala.",
        view: 'planner',
        showReports: true,
        targetId: 'planner-container'
    },
    {
        category: 'ARQUITETO',
        title: "21. VÍNCULOS",
        text: "Sistema de mentoria, parceria \"Gymbro\" e disputas diretas (1x1) de experiência.",
        view: 'settings',
        tab: 'Premium',
        targetId: 'links-button'
    },
    {
        category: 'ARQUITETO',
        title: "22. CODEX",
        text: "O marketplace para comprar ou vender rotinas e metodologias prontas de outras pessoas.",
        view: 'settings',
        tab: 'Premium',
        targetId: 'codex-button'
    },
    {
        category: 'ARQUITETO',
        title: "23. ASSISTENTE IA (AVANÇADO)",
        text: "A configuração tática onde a IA cruza os dados da sua vida e prevê padrões.",
        view: 'settings',
        tab: 'Premium',
        targetId: 'assistant-button'
    },
    {
        category: 'ARQUITETO',
        title: "24. CAMPANHAS",
        text: "Gestão de projetos massivos que exigem múltiplas ações e envolvem várias Arenas.",
        view: 'settings',
        tab: 'Premium',
        targetId: 'campaigns-button'
    },
    {
        category: 'ARQUITETO',
        title: "25. CLÃ MODO OFFICE",
        text: "Ferramenta estilo Trello/Kanban para o dono do Clã delegar tarefas para membros.",
        view: 'social',
        tab: 'social',
        targetId: 'clans-section'
    },
    {
        category: 'ARQUITETO',
        title: "TUTORIAL CONCLUÍDO",
        text: "Sua jornada de iniciação termina aqui, Soberano.\n\nSe precisar ver estes ensinamentos novamente, acesse as Preferências no menu de Configurações.",
        view: 'assets',
        targetId: 'header-oracle'
    }
];
