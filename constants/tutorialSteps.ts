import { TutorialStep, View } from '../types';

export const TUTORIAL_STEPS_GAME: TutorialStep[] = [
    {
        title: "BEM-VINDO, SOBERANO",
        text: "Eu sou o Oráculo. Vou guiá-lo pelo Life OS.\n\nEste sistema foi projetado para transformar sua vida em um jogo de estratégia. Siga minhas instruções.",
        view: 'assets',
        targetId: 'header-oracle' 
    },
    {
        title: "SEUS ATIVOS",
        text: "Estas esferas representam as áreas da sua vida. Elas evoluem conforme você progride.\n\nClique em qualquer Ativo para gerenciar seus atributos e equipar melhorias.",
        view: 'assets',
        targetId: 'assets-grid'
    },
    {
        title: "ARENAS DE BATALHA",
        text: "Aqui você define suas Metas e Missões.\n\nCada Arena é um campo de batalha onde você planeja conquistas e organiza seus objetivos estratégicos.",
        view: 'arenas',
        targetId: 'arenas-container'
    },
    {
        title: "PLANNER TÁTICO",
        text: "O centro de comando da sua rotina. Arraste missões das Arenas para o seu dia.\n\nUse a Pasta para Checklists rápidos e a Lâmpada para o Painel Diário.",
        view: 'planner',
        targetId: 'planner-container'
    },
    {
        title: "CONEXÃO SOCIAL",
        text: "Nenhum Soberano reina sozinho. Encontre aliados, junte-se a Clãs poderosos e compartilhe suas vitórias no Santuário.",
        view: 'social',
        targetId: 'social-container'
    },
    {
        title: "CONFIGURAÇÕES",
        text: "Personalize sua experiência, gerencie sua assinatura e ajuste seu perfil.\n\nSua jornada rumo à soberania começa agora. Boa sorte.",
        view: 'settings',
        targetId: 'settings-container'
    }
];

export const TUTORIAL_STEPS_BASIC: TutorialStep[] = [
    {
        title: "BEM-VINDO AO BÁSICO",
        text: "Este é o seu centro de comando. O Life OS foi simplificado para focar em produtividade e organização pessoal.",
        view: 'assets',
        targetId: 'header-oracle' 
    },
    {
        title: "DEPARTAMENTOS E KPIs",
        text: "As esferas agora representam Departamentos. Acompanhe indicadores de performance e evolução de competências profissionais.",
        view: 'assets',
        targetId: 'assets-grid'
    },
    {
        title: "CENTRO DE PROJETOS",
        text: "Aqui você organiza seus Projetos e Entregas.\n\nDefina cronogramas, prioridades e acompanhe o status de cada iniciativa estratégica da sua equipe.",
        view: 'arenas',
        targetId: 'arenas-container'
    },
    {
        title: "AGENDA EXECUTIVA",
        text: "Planeje seu dia com foco em entregas. Gerencie sua pauta, checklists de reuniões e gere relatórios de produtividade (Painel Diário).",
        view: 'planner',
        targetId: 'planner-container'
    },
    {
        title: "REDE PROFISSIONAL",
        text: "Colabore com sua equipe, gerencie membros do seu Clã (Squad) e acompanhe o progresso coletivo em missões compartilhadas.",
        view: 'social',
        targetId: 'social-container'
    },
    {
        title: "PAINEL DE CONTROLE",
        text: "Ajuste as preferências do sistema, gerencie acessos e personalize seu ambiente de trabalho digital.",
        view: 'settings',
        targetId: 'settings-container'
    }
];

export const TUTORIAL_LEVEL_1: TutorialStep[] = [
    {
        title: "01. ARENAS (METAR)",
        text: "Aqui você organiza as grandes áreas da sua vida. Cada Arena é um domínio que exige sua atenção e maestria.",
        view: 'arenas',
        targetId: 'arenas-container'
    },
    {
        title: "02. AÇÕES",
        text: "Dentro de cada Arena, você gerencia suas Ações. Elas são os passos concretos e repetíveis que constroem sua evolução diária. Clique no '+' para adicionar novas missões.",
        view: 'arenas',
        showArenaId: 'first',
        targetId: 'add-action-button'
    },
    {
        title: "03. PLANNER",
        text: "Seu campo de batalha diário. Arraste as Ações da Bay Area (barra superior) para os horários do seu dia para agendar seu sucesso.",
        view: 'planner',
        targetId: 'planner-container'
    },
    {
        title: "04. CICLOS",
        text: "O tempo é seu recurso mais precioso. Use o ícone de relógio para acessar o histórico e gerenciar seus ciclos mensais.",
        view: 'planner',
        targetId: 'report-button'
    },
    {
        title: "05. RELATÓRIOS",
        text: "Ao fim de cada ciclo, revisamos seus feitos. Clique aqui para encerrar seu ciclo atual e gerar seu relatório de performance.",
        view: 'planner',
        showReports: true,
        targetId: 'end-cycle-button'
    },
    {
        title: "06. PAINEL DIÁRIO",
        text: "Seu alinhamento matinal. O PAINEL DIÁRIO garante que você comece o dia com integridade e foco total.",
        view: 'planner',
        showReports: false,
        targetId: 'sitrep-button'
    },
    {
        title: "07. PATENTES",
        text: "Sua progressão de Vagante a Soberano. Veja seu XP atual e o que falta para a próxima patente de Nobreza.",
        view: 'settings',
        tab: 'Geral',
        targetId: 'profile-section'
    }
];

export const TUTORIAL_LEVEL_2: TutorialStep[] = [
    {
        title: "08. MAESTRIA",
        text: "Sua Árvore de Maestria. Cada Ativo aqui representa uma área da sua vida. Você pode ajustar os níveis conforme sua evolução real.",
        view: 'assets',
        targetId: 'assets-grid'
    },
    {
        title: "09. QUIZ DE MAESTRIA",
        text: "Não sabe seu nível? Use o Quiz de Soberania para avaliar sua maturidade em cada Ativo e calibrar o sistema à sua realidade.",
        view: 'settings',
        tab: 'Geral',
        targetId: 'mastery-sliders-button'
    },
    {
        title: "10. PERFIL SOBERANO",
        text: "Este é o seu Dossiê. Aqui você configura sua identidade visual, escolhe seus melhores Widgets e exibe suas conquistas para o mundo.",
        view: 'assets',
        showProfile: true,
        targetId: 'shareable-profile'
    },
    {
        title: "11. ARSENAL (INVENTÁRIO)",
        text: "Gerencie suas Skins e itens conquistados. Sua aparência reflete sua jornada e suas conquistas.",
        view: 'social',
        tab: 'arsenal',
        targetId: 'nav-arsenal'
    },
    {
        title: "12. LOJA",
        text: "A economia do sistema. Use Ouro e Pepitas para adquirir melhorias, skins e acelerar sua evolução.",
        view: 'social',
        tab: 'loja',
        targetId: 'nav-loja'
    },
    {
        title: "13. PREFERÊNCIAS",
        text: "Controle total. Ajuste sons, notificações e a intensidade do Oráculo nestes botões rápidos de On/Off.",
        view: 'settings',
        tab: 'Preferências',
        showOracleSettings: true,
        targetId: 'oracle-settings-modal-content'
    }
];

export const TUTORIAL_LEVEL_3: TutorialStep[] = [
    {
        title: "14. TELA DE DESCANSO",
        text: "O refúgio do Soberano. Use o cadeado no cabeçalho para acessar a tela de descanso e gerenciar sua energia.",
        view: 'assets',
        targetId: 'lock-icon-button'
    },
    {
        title: "15. DEEP FOCUS",
        text: "Foco Total. Ative o Deep Work na tela de descanso para eliminar distrações e mergulhar no trabalho profundo.",
        view: 'assets',
        showRestScreen: true,
        targetId: 'deep-work-button'
    },
    {
        title: "16. ALIADOS",
        text: "Nenhum Soberano reina sozinho. Busque conexões com outros usuários e fortaleça seu círculo social.",
        view: 'social',
        tab: 'social',
        targetId: 'allies-search'
    },
    {
        title: "17. CLÃS",
        text: "Junte-se a tribos ou funde a sua própria. A força coletiva permite enfrentar desafios impossíveis para um só.",
        view: 'social',
        tab: 'social',
        targetId: 'clans-section'
    },
    {
        title: "18. TEMPORADA",
        text: "Eventos épicos que unem todos os Soberanos. Participe das temporadas para ganhar recompensas exclusivas.",
        view: 'social',
        tab: 'temporada',
        targetId: 'season-quests'
    },
    {
        title: "19. ORÁCULO (CHAT)",
        text: "Eu estou aqui para ajudar. Use o ícone de brilho no topo para tirar dúvidas e receber conselhos.",
        view: 'assets',
        targetId: 'header-oracle'
    }
];

export const TUTORIAL_LEVEL_4: TutorialStep[] = [
    {
        title: "20. ERAS",
        text: "Sua história em larga escala. Aqui você visualiza o histórico de todos os seus ciclos e como eles se agrupam em Eras de evolução.",
        view: 'planner',
        showReports: true,
        targetId: 'planner-container'
    },
    {
        title: "21. VÍNCULOS",
        text: "Conecte-se a outros Soberanos. Estabeleça relações de mentoria ou parceria estratégica para acelerar seu crescimento.",
        view: 'settings',
        tab: 'Premium',
        targetId: 'links-button'
    },
    {
        title: "22. CODEX",
        text: "Sua biblioteca de sistemas. Acesse métodos prontos ou gerencie suas próprias metodologias de soberania.",
        view: 'settings',
        tab: 'Premium',
        targetId: 'codex-button'
    },
    {
        title: "23. ASSISTENTE",
        text: "O suporte do Oráculo. Configure como a IA interage com você e acesse o chat direto para orientações táticas.",
        view: 'settings',
        tab: 'Premium',
        targetId: 'assistant-button'
    },
    {
        title: "24. CAMPANHAS",
        text: "Gestão de grandes objetivos. Organize arenas e ações sob um único propósito épico.",
        view: 'settings',
        tab: 'Premium',
        targetId: 'campaigns-button'
    },
    {
        title: "25. CLÃ MODO OFFICE",
        text: "No modo Premium, você pode fundar um Clã Modo Office. Delegue ações profissionais para membros e gerencie sua equipe com a eficiência de um Soberano.",
        view: 'social',
        tab: 'social',
        targetId: 'clans-section'
    }
];

export const TUTORIAL_STEPS_25: TutorialStep[] = [
    ...TUTORIAL_LEVEL_1,
    ...TUTORIAL_LEVEL_2,
    ...TUTORIAL_LEVEL_3,
    ...TUTORIAL_LEVEL_4
];

// Para compatibilidade, manter TUTORIAL_STEPS exportado
export const TUTORIAL_STEPS = TUTORIAL_STEPS_25;
