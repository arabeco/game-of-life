
// constants/GameContent.ts

export interface QuestActionTemplate {
  name: string;
  description: string;
  duration: number; // minutos
  icon: string;
  // Se for repetitiva
  repetitions?: number; 
  // Se for milestone
  isMilestone?: boolean;
}

export interface SeasonQuest {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'clan';
  category: 'physical' | 'intellectual' | 'social' | 'creative';
  
  // O que acontece quando o jogador aceita a quest
  actionTemplate: QuestActionTemplate;
  
  // Requisitos para completar
  requirements: {
    totalReps?: number; // Ex: 20x
    milestone?: boolean; // Ex: Ler 1 livro inteiro
    clanGoal?: number; // Meta coletiva do clã
  };

  rewards: {
    xp: number;
    gold?: number;
    items?: string[]; // IDs dos itens
  };

  // Configuração específica de Clã
  clanConfig?: {
    minParticipants?: number;
    maxParticipants?: number;
    collectiveGoal?: number; // Ex: 50 horas totais
    rewardPerParticipant?: number;
  };
}

export interface SeasonConfig {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  theme: string; // Ex: 'cyberpunk', 'fantasy'
  quests: SeasonQuest[];
}

// ==========================================
// CONFIGURAÇÃO DO JOGO - EDITE AQUI
// ==========================================

export const ACTIVE_SEASON_ID = 'season-genesis-0';

export const SEASONS: Record<string, SeasonConfig> = {
  'season-genesis-0': {
    id: 'season-genesis-0',
    name: 'Gênesis',
    startDate: '2025-12-21',
    endDate: '2026-03-20',
    theme: 'genesis',
    quests: [
      {
        id: 'quest-wanderer',
        title: 'O Andarilho',
        description: 'Caminhe 20km no total para fortalecer suas pernas e espírito.',
        type: 'individual',
        category: 'physical',
        actionTemplate: {
          name: 'Caminhada (1km)',
          description: 'Caminhar 1km em ritmo constante.',
          duration: 15,
          icon: '🥾',
          repetitions: 20
        },
        requirements: {
          totalReps: 20
        },
        rewards: {
          xp: 1000,
          gold: 50
        }
      },
      {
        id: 'quest-scholar',
        title: 'O Erudito',
        description: 'Leia um livro inteiro ou dedique tempo consistente à leitura.',
        type: 'individual',
        category: 'intellectual',
        actionTemplate: {
          name: 'Leitura Focada',
          description: 'Ler um livro com atenção plena.',
          duration: 30,
          icon: '📖',
          repetitions: 15,
          isMilestone: true
        },
        requirements: {
          milestone: true
        },
        rewards: {
          xp: 800,
          gold: 30
        }
      },
      {
        id: 'quest-warrior',
        title: 'O Guerreiro',
        description: 'Complete 50 flexões (total acumulado) para fortalecer seu corpo.',
        type: 'individual',
        category: 'physical',
        actionTemplate: {
          name: 'Flexões (x10)',
          description: 'Fazer 10 flexões com boa forma.',
          duration: 5,
          icon: '⚔️',
          repetitions: 5
        },
        requirements: {
          totalReps: 5
        },
        rewards: {
          xp: 500,
          gold: 20
        }
      },
      {
        id: 'quest-clan-unity',
        title: 'Unidade do Clã',
        description: 'O Clã deve acumular 50 horas de atividades conjuntas.',
        type: 'clan',
        category: 'social',
        actionTemplate: {
          name: 'Atividade de Clã',
          description: 'Participar de eventos ou ajudar membros.',
          duration: 60,
          icon: '🛡️',
          repetitions: 1
        },
        requirements: {
          clanGoal: 50
        },
        rewards: {
          xp: 2000,
          gold: 100
        },
        clanConfig: {
          collectiveGoal: 50
        }
      }
    ]
  }
};
