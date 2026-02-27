export type View = 'assets' | 'arenas' | 'planner' | 'social' | 'settings';

export interface TutorialStep {
    title: string;
    text: string;
    view: View;
    targetId?: string; // ID do elemento para highlight
}

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
        text: "O centro de comando da sua rotina. Arraste missões das Arenas para o seu dia.\n\nUse a Pasta para Checklists rápidos e a Lâmpada para o relatório SITREP diário.",
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

export const TUTORIAL_STEPS_OFFICE: TutorialStep[] = [
    {
        title: "BEM-VINDO AO OFFICE",
        text: "Este é o seu centro de comando profissional. O Life OS foi adaptado para focar em produtividade e gestão de projetos corporativos.",
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
        text: "Planeje seu dia com foco em entregas. Gerencie sua pauta, checklists de reuniões e gere relatórios de produtividade (SITREP).",
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

// Para compatibilidade, manter TUTORIAL_STEPS exportado
export const TUTORIAL_STEPS = TUTORIAL_STEPS_GAME;
