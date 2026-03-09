import { Season, SeasonMission, SeasonQuest } from '../types';

export interface SeasonConfig {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  theme: string;
  description?: string;
  backgroundUrl?: string;
  quests: SeasonQuest[];
}

// Arquivo de conteudo editavel de Season.
// Mantem em um lugar so:
// - season ativa do loop principal
// - seasons do painel GM
// - missoes e quests de season

export const ACTIVE_SEASON_ID = 'season-genesis-0';

export const SEASONS: Record<string, SeasonConfig> = {
  'season-genesis-0': {
    id: 'season-genesis-0',
    name: 'Gênesis',
    description: 'O início de uma nova era. Desperte seu potencial.',
    backgroundUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
    startDate: '2025-12-21',
    endDate: '2026-03-20',
    theme: 'genesis',
    quests: [
      {
        id: 'quest-wanderer',
        title: 'O Andarilho',
        description: 'Caminhe 20km no total para fortalecer suas pernas e espírito. (Recompensa: 1 Baú Comum)',
        type: 'individual',
        category: 'physical',
        actionTemplate: { name: 'Caminhada (1km)', description: 'Caminhar 1km em ritmo constante.', duration: 15, icon: '🚶‍♂️', repetitions: 20 },
        requirements: { totalReps: 20 },
        rewards: { xp: 2250, gold: 0 },
      },
      {
        id: 'quest-scholar',
        title: 'O Erudito',
        description: 'Leia um livro inteiro ou dedique tempo consistente à leitura. (Recompensa: 1 Baú Comum)',
        type: 'individual',
        category: 'intellectual',
        actionTemplate: { name: 'Leitura Focada', description: 'Ler um livro com atenção plena.', duration: 30, icon: '📚', repetitions: 15, isMilestone: true },
        requirements: { milestone: true },
        rewards: { xp: 1800, gold: 0 },
      },
      {
        id: 'quest-warrior',
        title: 'O Guerreiro',
        description: 'Complete 50 flexões (total acumulado) para fortalecer seu corpo. (Recompensa: 1 Baú Comum)',
        type: 'individual',
        category: 'physical',
        actionTemplate: { name: 'Flexões (x10)', description: 'Fazer 10 flexões com boa forma.', duration: 5, icon: '💪', repetitions: 5 },
        requirements: { totalReps: 5 },
        rewards: { xp: 1125, gold: 0 },
      },
      {
        id: 'quest-tutorial-1',
        title: 'Estação 1: Alicerce',
        description: 'Complete o primeiro nível do tutorial para entender as bases do seu reino. (Recompensa: 500 XP)',
        type: 'individual',
        category: 'intellectual',
        actionTemplate: { name: 'Tutorial Alicerce', description: 'Visualizar as bases do sistema.', duration: 5, icon: '🧱', repetitions: 1, isMilestone: true },
        requirements: { milestone: true },
        rewards: { xp: 500, gold: 0 },
        tutorialLevel: 1,
      },
      {
        id: 'quest-tutorial-2',
        title: 'Estação 2: Identidade',
        description: 'Complete o segundo nível do tutorial e defina quem você é neste mundo. (Recompensa: 500 XP)',
        type: 'individual',
        category: 'intellectual',
        actionTemplate: { name: 'Tutorial Identidade', description: 'Explorar sua identidade soberana.', duration: 5, icon: '👤', repetitions: 1, isMilestone: true },
        requirements: { milestone: true },
        rewards: { xp: 500, gold: 0 },
        tutorialLevel: 2,
      },
      {
        id: 'quest-tutorial-3',
        title: 'Estação 3: O Mundo',
        description: 'Complete o terceiro nível do tutorial e conheça as fronteiras do seu domínio. (Recompensa: 500 XP)',
        type: 'individual',
        category: 'intellectual',
        actionTemplate: { name: 'Tutorial Mundo', description: 'Navegar pelos domínios externos.', duration: 5, icon: '🌍', repetitions: 1, isMilestone: true },
        requirements: { milestone: true },
        rewards: { xp: 500, gold: 0 },
        tutorialLevel: 3,
      },
      {
        id: 'quest-tutorial-4',
        title: 'Estação 4: O Arquiteto',
        description: 'Complete o quarto nível do tutorial e torne-se o mestre do seu destino. (Recompensa: 500 XP)',
        type: 'individual',
        category: 'intellectual',
        actionTemplate: { name: 'Tutorial Arquiteto', description: 'Dominar as ferramentas de criação.', duration: 5, icon: '🛠️', repetitions: 1, isMilestone: true },
        requirements: { milestone: true },
        rewards: { xp: 500, gold: 0 },
        tutorialLevel: 4,
      },
      {
        id: 'quest-clan-unity',
        title: 'Unidade do Clã',
        description: 'O Clã deve acumular 50 horas de atividades conjuntas. (Recompensa: 1 Baú Comum)',
        type: 'clan',
        category: 'social',
        actionTemplate: { name: 'Socializar (1h)', description: 'Uma hora de presença e vínculo.', duration: 60, icon: '🤝', repetitions: 50 },
        requirements: { clanGoal: 50 },
        rewards: { xp: 4500, gold: 0 },
        clanConfig: { collectiveGoal: 50 },
      },
    ],
  },
};

export const GM_SEASONS: Season[] = [
  {
    id: 'season_0',
    name: 'Season 0 - Aquário',
    start_date: '2024-01-01',
    end_date: '2026-02-18',
    background_png_url: 'https://i.imgur.com/6c2z3uH.jpeg',
    lore_text: 'Um tempo de purificação...',
    is_active: true,
  },
];

export const GM_SEASON_MISSIONS: SeasonMission[] = [
  { id: 'sm_1', season_id: 'season_0', title: 'O Peregrino', description: 'Correr um total de 50km. (Recompensa: 1 Baú Comum)', goal_type: 'km_run', goal_value: 50, reward_type: 'exp', reward_value: 2250 },
  { id: 'sm_2', season_id: 'season_0', title: 'O Sábio', description: 'Ler 1 livro completo. (Recompensa: 1 Baú Comum)', goal_type: 'books_read', goal_value: 1, reward_type: 'exp', reward_value: 1125 },
  { id: 'sm_3', season_id: 'season_0', title: 'O Monge', description: 'Meditar por 20 dias. (Recompensa: 1 Baú Comum)', goal_type: 'meditation_days', goal_value: 20, reward_type: 'exp', reward_value: 1800 },
];

export const GM_SEASON_QUESTS: SeasonQuest[] = [
  {
    id: 'sq_1',
    title: 'O Andarilho',
    description: 'Andar 20 km no total. (Recompensa: 1 Baú Comum)',
    type: 'individual',
    category: 'physical',
    actionTemplate: {
      name: 'Andar 1km',
      description: 'Execução unitária da Quest do Andarilho.',
      icon: '🚶‍♂️',
      duration: 15,
      repetitions: 20,
    },
    requirements: { totalReps: 20 },
    rewards: { xp: 2250, gold: 0 },
  },
  {
    id: 'sq_2',
    title: 'O Leitor',
    description: 'Ler 1 livro inteiro. (Recompensa: 1 Baú Comum)',
    type: 'individual',
    category: 'intellectual',
    actionTemplate: {
      name: 'Ler (30 min)',
      description: 'Sessão de leitura focada.',
      icon: '📚',
      duration: 30,
      repetitions: 10,
    },
    requirements: { totalReps: 10 },
    rewards: { xp: 1800, gold: 0 },
  },
  {
    id: 'sq_3',
    title: 'O Forte',
    description: 'Não perder um dia de academia. (Recompensa: 1 Baú Comum)',
    type: 'individual',
    category: 'physical',
    actionTemplate: {
      name: 'Academia (Marco)',
      description: 'Registrar o marco do dia sem falhar.',
      icon: '🏋️‍♂️',
      duration: 60,
      repetitions: 1,
      isMilestone: true,
    },
    requirements: { milestone: true },
    rewards: { xp: 1125, gold: 0 },
  },
  {
    id: 'sq_clan_1',
    title: 'Socializar 50 horas',
    description: 'Somar 50 horas em equipe. (Recompensa: 1 Baú Comum)',
    type: 'clan',
    category: 'social',
    actionTemplate: {
      name: 'Socializar (1h)',
      description: 'Uma hora de presença e vínculo.',
      icon: '🤝',
      duration: 60,
      repetitions: 50,
    },
    requirements: { clanGoal: 50 },
    rewards: { xp: 4500, gold: 0 },
    clanConfig: { collectiveGoal: 50 },
  },
];
