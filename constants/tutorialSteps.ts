export type View = 'assets' | 'arenas' | 'planner' | 'social' | 'settings';

export interface TutorialStep {
    title: string;
    text: string;
    view: View;
    targetId?: string; // ID do elemento para highlight
}

export const TUTORIAL_STEPS: TutorialStep[] = [
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
