import { Season, SeasonMission, SeasonQuest } from '../types';

const ROOT_IMAGES_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images';
const EMPTY_SEASON_QUESTS: SeasonQuest[] = [];

export interface SeasonRewardWindow {
  title: string;
  summary: string;
  rewardLabels: string[];
  rewardItemIds: string[];
  eligibilityDeadline: string;
  eligibilityRule: string;
}

export interface SeasonArchiveLogEntry {
  seasonId: string;
  label: string;
  status: 'legacy' | 'active' | 'upcoming';
  summary: string;
  rewardWindow?: SeasonRewardWindow;
}

export interface SeasonLaunchHighlights {
  title: string;
  summary: string;
  itemLabels: string[];
  itemIds: string[];
}

export interface EraCheckpoint {
  id: string;
  label: string;
  date: string;
  note?: string;
}

export interface EraCalendarYear {
  year: number;
  label: string;
  checkpoints: EraCheckpoint[];
}

export interface SeasonConfig {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  theme: string;
  description?: string;
  backgroundUrl?: string;
  quests: SeasonQuest[];
  rewardWindow?: SeasonRewardWindow;
  archiveLog?: SeasonArchiveLogEntry;
  celebrationTitle?: string;
  celebrationSummary?: string;
  launchTitle?: string;
  launchSummary?: string;
  launchHighlights?: SeasonLaunchHighlights;
  launchRewardItemIds?: string[];
  launchRewardToast?: string;
}

export const ACTIVE_SEASON_ID = 'season-genesis-0';

export const GENESIS_FOUNDER_REWARD_WINDOW: SeasonRewardWindow = {
  title: 'Marca de fundador',
  summary: 'Quem entrou durante a abertura da Season 0 carregou a marca da Primeira Era e garantiu os cosmeticos de Genesis.',
  rewardLabels: ['Skin O Criador', 'Borda Genesis'],
  rewardItemIds: ['item_skin_season_001', 'item_border_genesis_01'],
  eligibilityDeadline: '2026-03-20',
  eligibilityRule: 'Disponivel apenas para contas que entrarem dentro da janela da Season 0 - Genesis.',
};

export const AURORA_I_LAUNCH_HIGHLIGHTS: SeasonLaunchHighlights = {
  title: 'Assinatura visual de Aurora I',
  summary: 'Aurora I estreia com sua propria identidade visual. A nova borda e o novo banner registram a abertura da Primeira Era.',
  itemLabels: ['Borda Aurora I', 'Banner Aurora I'],
  itemIds: ['item_border_aurora_1_2026', 'item_banner_aurora_1_2026'],
};

export const ERA_CALENDAR: EraCalendarYear[] = [
  {
    year: 2026,
    label: 'A Primeira Era',
    checkpoints: [
      { id: '2026-aurora-1', label: 'Aurora I', date: '2026-03-20' },
      { id: '2026-zenite-1', label: 'Zenite I', date: '2026-06-21' },
      {
        id: '2026-eclipse-1',
        label: 'Eclipse I',
        date: '2026-09-22',
        note: 'Ocorre as 21h05 no fuso brasileiro.',
      },
      { id: '2026-egide-1', label: 'Egide I', date: '2026-12-21' },
    ],
  },
  {
    year: 2027,
    label: 'A Segunda Era',
    checkpoints: [
      { id: '2027-aurora-2', label: 'Aurora II', date: '2027-03-20' },
      { id: '2027-zenite-2', label: 'Zenite II', date: '2027-06-21' },
      { id: '2027-eclipse-2', label: 'Eclipse II', date: '2027-09-23' },
      {
        id: '2027-egide-2',
        label: 'Egide II',
        date: '2027-12-21',
        note: 'O apice acontece as 23h41 no Brasil; em Greenwich ja sera dia 22.',
      },
    ],
  },
  {
    year: 2028,
    label: 'A Terceira Era',
    checkpoints: [
      { id: '2028-aurora-3', label: 'Aurora III', date: '2028-03-19' },
      { id: '2028-zenite-3', label: 'Zenite III', date: '2028-06-20' },
      { id: '2028-eclipse-3', label: 'Eclipse III', date: '2028-09-22' },
      { id: '2028-egide-3', label: 'Egide III', date: '2028-12-21' },
    ],
  },
];

export const SEASONS: Record<string, SeasonConfig> = {
  'season-genesis-0': {
    id: 'season-genesis-0',
    name: 'Season 0 - Genesis',
    description: 'A primeira abertura do GLYPH. Quem entrou a tempo carregou a marca da Primeira Era.',
    backgroundUrl: `${ROOT_IMAGES_URL}/season_genesis.jpg`,
    startDate: '2025-12-21',
    endDate: '2026-03-20',
    theme: 'genesis',
    rewardWindow: GENESIS_FOUNDER_REWARD_WINDOW,
    archiveLog: {
      seasonId: 'season-genesis-0',
      label: 'Season 0 - Genesis',
      status: 'legacy',
      summary: 'Primeiro marco vivo do GLYPH. Abriu a Primeira Era e reservou a marca de fundador para quem entrou dentro da janela.',
      rewardWindow: GENESIS_FOUNDER_REWARD_WINDOW,
    },
    celebrationTitle: 'Season 0 encerrada',
    celebrationSummary: 'Genesis fechou como marco fundador do GLYPH. Obrigado por atravessar a primeira abertura.',
    launchTitle: 'Primeira Era iniciada',
    launchSummary: 'A trilha oficial das Seasons comeca agora. Novas quests e cosmeticos vao nascer sobre essa base.',
    quests: [
      {
        id: 'quest-wanderer',
        title: 'O Andarilho',
        description: 'Caminhe 20km no total para fortalecer pernas e espirito. (Recompensa: 1 Bau Comum)',
        type: 'individual',
        category: 'physical',
        season_id: 'season-genesis-0',
        actionTemplate: { name: 'Caminhada (1km)', description: 'Caminhar 1km em ritmo constante.', duration: 15, icon: '🚶', repetitions: 20 },
        requirements: { totalReps: 20 },
        rewards: { xp: 2250, gold: 0 },
      },
      {
        id: 'quest-scholar',
        title: 'O Erudito',
        description: 'Leia um livro inteiro ou dedique tempo consistente a leitura. (Recompensa: 1 Bau Comum)',
        type: 'individual',
        category: 'intellectual',
        season_id: 'season-genesis-0',
        actionTemplate: { name: 'Leitura Focada', description: 'Ler um livro com atencao plena.', duration: 30, icon: '📚', repetitions: 15, isMilestone: true },
        requirements: { milestone: true },
        rewards: { xp: 1800, gold: 0 },
      },
      {
        id: 'quest-warrior',
        title: 'O Guerreiro',
        description: 'Complete 50 flexoes no acumulado para fortalecer o corpo. (Recompensa: 1 Bau Comum)',
        type: 'individual',
        category: 'physical',
        season_id: 'season-genesis-0',
        actionTemplate: { name: 'Flexoes (x10)', description: 'Fazer 10 flexoes com boa forma.', duration: 5, icon: '💪', repetitions: 5 },
        requirements: { totalReps: 5 },
        rewards: { xp: 1125, gold: 0 },
      },
    ],
  },
  'season-aurora-1-2026': {
    id: 'season-aurora-1-2026',
    name: 'Aurora I',
    description: 'Primeiro corte oficial da Primeira Era. Abertura de quests, recompensas e novos simbolos da linha principal.',
    backgroundUrl: `${ROOT_IMAGES_URL}/aurora.png`,
    startDate: '2026-03-20',
    endDate: '2026-06-21',
    theme: 'aurora',
    celebrationTitle: 'Aurora I concluida',
    celebrationSummary: 'A primeira Season oficial da Primeira Era fecha sua trilha de abertura.',
    launchTitle: 'Aurora I',
    launchSummary: 'A nova Season entra em campo com cosmeticos, quests e recompensas proprias.',
    launchHighlights: AURORA_I_LAUNCH_HIGHLIGHTS,
    launchRewardItemIds: ['insignia_season_aurora_1'],
    launchRewardToast: 'Insignia Aurora I integrada ao inventario.',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-zenite-1-2026': {
    id: 'season-zenite-1-2026',
    name: 'Zenite I',
    description: 'Expansao de meio de ano da Primeira Era. Pressao, clareza e conquista no centro do mapa.',
    backgroundUrl: `${ROOT_IMAGES_URL}/gold.png`,
    startDate: '2026-06-21',
    endDate: '2026-09-22',
    theme: 'zenite',
    celebrationTitle: 'Zenite I concluida',
    celebrationSummary: 'O pico da Primeira Era foi encerrado com a leitura do que subiu e do que resistiu.',
    launchTitle: 'Zenite I',
    launchSummary: 'A nova Season entra com sua propria identidade, quests e pool de recompensas.',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-eclipse-1-2026': {
    id: 'season-eclipse-1-2026',
    name: 'Eclipse I',
    description: 'A travessia mais densa da Primeira Era. Leitura fria, sombra e reposicionamento.',
    backgroundUrl: `${ROOT_IMAGES_URL}/void.png`,
    startDate: '2026-09-22',
    endDate: '2026-12-21',
    theme: 'eclipse',
    celebrationTitle: 'Eclipse I concluida',
    celebrationSummary: 'A travessia de sombra da Primeira Era terminou. O sistema sobreviveu ao estreitamento.',
    launchTitle: 'Eclipse I',
    launchSummary: 'A nova Season abre um periodo de contraste, disciplina e consolidacao.',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-egide-1-2026': {
    id: 'season-egide-1-2026',
    name: 'Egide I',
    description: 'Fechamento defensivo da Primeira Era. Estrutura, blindagem e passagem para a proxima camada.',
    backgroundUrl: `${ROOT_IMAGES_URL}/frost.png`,
    startDate: '2026-12-21',
    endDate: '2027-03-20',
    theme: 'egide',
    celebrationTitle: 'Egide I concluida',
    celebrationSummary: 'O fechamento da Primeira Era foi concluido. O GLYPH entra maduro na Segunda Era.',
    launchTitle: 'Egide I',
    launchSummary: 'A nova Season sela o fechamento anual com trilha propria de recompensas.',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-aurora-2-2027': {
    id: 'season-aurora-2-2027',
    name: 'Aurora II',
    description: 'A Segunda Era amanhece com uma nova camada de jogo, ritmo e recompensas.',
    backgroundUrl: `${ROOT_IMAGES_URL}/aurora.png`,
    startDate: '2027-03-20',
    endDate: '2027-06-21',
    theme: 'aurora',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-zenite-2-2027': {
    id: 'season-zenite-2-2027',
    name: 'Zenite II',
    description: 'Pressao central da Segunda Era. Ritmo alto, leituras mais duras e recompensa mais rara.',
    backgroundUrl: `${ROOT_IMAGES_URL}/gold.png`,
    startDate: '2027-06-21',
    endDate: '2027-09-23',
    theme: 'zenite',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-eclipse-2-2027': {
    id: 'season-eclipse-2-2027',
    name: 'Eclipse II',
    description: 'A fase de sombra da Segunda Era. Ajuste de rota, corte e refinamento.',
    backgroundUrl: `${ROOT_IMAGES_URL}/void.png`,
    startDate: '2027-09-23',
    endDate: '2027-12-21',
    theme: 'eclipse',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-egide-2-2027': {
    id: 'season-egide-2-2027',
    name: 'Egide II',
    description: 'Fechamento blindado da Segunda Era. Consolidacao, defesa e passagem.',
    backgroundUrl: `${ROOT_IMAGES_URL}/frost.png`,
    startDate: '2027-12-21',
    endDate: '2028-03-19',
    theme: 'egide',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-aurora-3-2028': {
    id: 'season-aurora-3-2028',
    name: 'Aurora III',
    description: 'A Terceira Era amanhece com um novo patamar de identidade do sistema.',
    backgroundUrl: `${ROOT_IMAGES_URL}/aurora.png`,
    startDate: '2028-03-19',
    endDate: '2028-06-20',
    theme: 'aurora',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-zenite-3-2028': {
    id: 'season-zenite-3-2028',
    name: 'Zenite III',
    description: 'O centro da Terceira Era pede dominio fino, consistencia e alta entrega.',
    backgroundUrl: `${ROOT_IMAGES_URL}/gold.png`,
    startDate: '2028-06-20',
    endDate: '2028-09-22',
    theme: 'zenite',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-eclipse-3-2028': {
    id: 'season-eclipse-3-2028',
    name: 'Eclipse III',
    description: 'A sombra da Terceira Era cobra profundidade, corte e lucidez.',
    backgroundUrl: `${ROOT_IMAGES_URL}/void.png`,
    startDate: '2028-09-22',
    endDate: '2028-12-21',
    theme: 'eclipse',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-egide-3-2028': {
    id: 'season-egide-3-2028',
    name: 'Egide III',
    description: 'O fechamento da Terceira Era protege o que foi conquistado e prepara a proxima camada.',
    backgroundUrl: `${ROOT_IMAGES_URL}/frost.png`,
    startDate: '2028-12-21',
    endDate: '2029-03-20',
    theme: 'egide',
    quests: EMPTY_SEASON_QUESTS,
  },
};

export const SEASON_ORDER = [
  'season-genesis-0',
  'season-aurora-1-2026',
  'season-zenite-1-2026',
  'season-eclipse-1-2026',
  'season-egide-1-2026',
  'season-aurora-2-2027',
  'season-zenite-2-2027',
  'season-eclipse-2-2027',
  'season-egide-2-2027',
  'season-aurora-3-2028',
  'season-zenite-3-2028',
  'season-eclipse-3-2028',
  'season-egide-3-2028',
] as const;

export const SEASON_ARCHIVE_LOG: SeasonArchiveLogEntry[] = Object.values(SEASONS)
  .map((season) => season.archiveLog)
  .filter((entry): entry is SeasonArchiveLogEntry => Boolean(entry));

export const GM_SEASONS: Season[] = Object.values(SEASONS).map((season) => ({
  id: season.id,
  name: season.name,
  start_date: season.startDate,
  end_date: season.endDate,
  background_png_url: season.backgroundUrl || '',
  lore_text: season.description || '',
  is_active: season.id === ACTIVE_SEASON_ID,
}));

export const GM_SEASON_MISSIONS: SeasonMission[] = [
  { id: 'sm_1', season_id: 'season-genesis-0', title: 'O Peregrino', description: 'Correr um total de 50km. (Recompensa: 1 Bau Comum)', goal_type: 'km_run', goal_value: 50, reward_type: 'exp', reward_value: 2250 },
  { id: 'sm_2', season_id: 'season-genesis-0', title: 'O Sabio', description: 'Ler 1 livro completo. (Recompensa: 1 Bau Comum)', goal_type: 'books_read', goal_value: 1, reward_type: 'exp', reward_value: 1125 },
  { id: 'sm_3', season_id: 'season-genesis-0', title: 'O Monge', description: 'Meditar por 20 dias. (Recompensa: 1 Bau Comum)', goal_type: 'meditation_days', goal_value: 20, reward_type: 'exp', reward_value: 1800 },
];

export const GM_SEASON_QUESTS: SeasonQuest[] = [
  {
    id: 'sq_1',
    title: 'O Andarilho',
    description: 'Andar 20 km no total. (Recompensa: 1 Bau Comum)',
    type: 'individual',
    category: 'physical',
    season_id: 'season-genesis-0',
    actionTemplate: {
      name: 'Andar 1km',
      description: 'Execucao unitaria da quest do Andarilho.',
      icon: '🚶',
      duration: 15,
      repetitions: 20,
    },
    requirements: { totalReps: 20 },
    rewards: { xp: 2250, gold: 0 },
  },
  {
    id: 'sq_2',
    title: 'O Leitor',
    description: 'Ler 1 livro inteiro. (Recompensa: 1 Bau Comum)',
    type: 'individual',
    category: 'intellectual',
    season_id: 'season-genesis-0',
    actionTemplate: {
      name: 'Ler (30 min)',
      description: 'Sessao de leitura focada.',
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
    description: 'Nao perder um dia de academia. (Recompensa: 1 Bau Comum)',
    type: 'individual',
    category: 'physical',
    season_id: 'season-genesis-0',
    actionTemplate: {
      name: 'Academia (Marco)',
      description: 'Registrar o marco do dia sem falhar.',
      icon: '🏋️',
      duration: 60,
      repetitions: 1,
      isMilestone: true,
    },
    requirements: { milestone: true },
    rewards: { xp: 1125, gold: 0 },
  },
];
