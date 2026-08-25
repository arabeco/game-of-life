import { Season, SeasonMission, SeasonQuest } from '../types';

import { CATALOG_ASSET_ROOT } from './catalogAssets';

const ROOT_IMAGES_URL = CATALOG_ASSET_ROOT;
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
  /** Chave que amarra os itens da colecao a esta temporada (items.seasonKey).
   *  Nao e derivavel do id: 'season-genesis-0' usa 'genesis_legacy'. */
  seasonKey?: string;
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
  summary: 'Quem entrou durante a abertura da Temporada 0 carregou a marca da Primeira Era e garantiu os cosmeticos de Genesis.',
  rewardLabels: ['Skin O Criador', 'Borda Genesis'],
  rewardItemIds: ['item_skin_season_001', 'item_border_genesis_01'],
  eligibilityDeadline: '2026-03-20',
  eligibilityRule: 'Disponivel apenas para contas que entrarem dentro da janela da Temporada 0 - Genesis.',
};

export const AURORA_I_LAUNCH_HIGHLIGHTS: SeasonLaunchHighlights = {
  title: 'Assinatura visual de Aurora I',
  summary: 'Aurora I estreia com sua propria identidade visual. A nova borda, o novo banner e Guardiao Aurora registram a abertura da Primeira Era.',
  itemLabels: ['Guardiao Aurora', 'Borda Aurora I', 'Banner Aurora I'],
  itemIds: ['item_skin_aurora_1_2026'],
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
    seasonKey: 'genesis_legacy',
    name: 'Temporada 0 - Genesis',
    description: 'A primeira abertura do GLYPH. Quem entrou a tempo carregou a marca da Primeira Era.',
    backgroundUrl: `${ROOT_IMAGES_URL}/genesis.png`,
    startDate: '2025-12-21',
    endDate: '2026-09-22',
    theme: 'genesis',
    rewardWindow: GENESIS_FOUNDER_REWARD_WINDOW,
    archiveLog: {
      seasonId: 'season-genesis-0',
      label: 'Temporada 0 - Genesis',
      status: 'legacy',
      summary: 'Primeiro marco vivo do GLYPH. Abriu a Primeira Era e reservou a marca de fundador para quem entrou dentro da janela.',
      rewardWindow: GENESIS_FOUNDER_REWARD_WINDOW,
    },
    celebrationTitle: 'Temporada 0 encerrada',
    celebrationSummary: 'Genesis fechou como marco fundador do GLYPH. Obrigado por atravessar a primeira abertura.',
    launchTitle: 'Primeira Era iniciada',
    launchSummary: 'A trilha oficial das Temporadas comeca agora. Novas jornadas e cosmeticos vao nascer sobre essa base.',
    /**
     * As tres jornadas da Genesis, mais o selo que exige as tres.
     *
     * Duas correcoes de uma vez. A descricao prometia "1 Bau Comum" e o codigo
     * nao entregava bau nenhum: faltava `reward_type`, e sem ele claimSeasonQuest
     * nao tem o que creditar. E o XP estava fora da escala do jogo — XP e
     * minutos de acao, entao 2250 equivalia a 37 horas de bonus por cima de um
     * esforco de 5. Agora e 100 / 300 / 500, e o bau e o mitico da Temporada.
     */
    quests: [
      {
        id: 'quest-wanderer',
        title: 'O Andarilho',
        description: 'Caminhe 20km no total para fortalecer pernas e espirito. (Recompensa: 1 Bau Mitico)',
        type: 'individual',
        category: 'physical',
        season_id: 'season-genesis-0',
        actionTemplate: { name: 'Caminhada (1km)', description: 'Caminhar 1km em ritmo constante.', duration: 15, icon: '🚶', repetitions: 20 },
        requirements: { totalReps: 20 },
        rewards: { xp: 500, gold: 0 },
        reward_type: 'chest',
        reward_value: 'Season',
      },
      {
        id: 'quest-scholar',
        title: 'O Erudito',
        description: 'Leia um livro inteiro ou dedique tempo consistente a leitura. (Recompensa: 1 Bau Mitico)',
        type: 'individual',
        category: 'intellectual',
        season_id: 'season-genesis-0',
        actionTemplate: { name: 'Leitura Focada', description: 'Ler um livro com atenção plena.', duration: 30, icon: '📚', repetitions: 15, isMilestone: true },
        requirements: { milestone: true },
        rewards: { xp: 500, gold: 0 },
        reward_type: 'chest',
        reward_value: 'Season',
      },
      {
        id: 'quest-warrior',
        // Eram 50 flexoes: 5 series de 5 min, 25 minutos no total contra as 7h30
        // do Erudito pelo mesmo bau. Agora sao 200, o que poe a jornada na mesma
        // ordem de grandeza das outras duas sem virar exagero.
        title: 'O Guerreiro',
        description: 'Complete 200 flexoes no acumulado para fortalecer o corpo. (Recompensa: 1 Bau Mitico)',
        type: 'individual',
        category: 'physical',
        season_id: 'season-genesis-0',
        actionTemplate: { name: 'Flexões (x10)', description: 'Fazer 10 flexões com boa forma.', duration: 5, icon: '💪', repetitions: 20 },
        requirements: { totalReps: 20 },
        rewards: { xp: 300, gold: 0 },
        reward_type: 'chest',
        reward_value: 'Season',
      },
    ],
  },
  'season-aurora-1-2026': {
    id: 'season-aurora-1-2026',
    seasonKey: 'aurora_1_2026',
    name: 'Aurora I',
    description: 'Primeiro corte oficial da Primeira Era. Abertura de jornadas, recompensas e novos simbolos da linha principal.',
    backgroundUrl: `${ROOT_IMAGES_URL}/aurora.png`,
    startDate: '2026-09-22',
    endDate: '2026-12-21',
    theme: 'aurora',
    celebrationTitle: 'Aurora I concluida',
    celebrationSummary: 'A primeira Temporada oficial da Primeira Era fecha sua trilha de abertura.',
    launchTitle: 'Aurora I',
    launchSummary: 'A nova Temporada entra em campo com cosmeticos, jornadas e recompensas proprias.',
    launchHighlights: AURORA_I_LAUNCH_HIGHLIGHTS,
    launchRewardItemIds: ['insignia_season_aurora_1'],
    launchRewardToast: 'Insignia Aurora I integrada ao inventario.',
    quests: [
      {
        id: 'aurora-quest-caminhante',
        title: 'O Caminhante da Aurora',
        description: 'Complete 12 travessias de 2 km para firmar o corpo no amanhecer da Primeira Era. Recompensa: 1 Baú Mítico.',
        type: 'individual',
        category: 'physical',
        season_id: 'season-aurora-1-2026',
        actionTemplate: {
          name: 'Travessia Aurora (2km)',
          description: 'Percorrer 2 km com constancia, respiracao firme e presenca.',
          duration: 18,
          icon: '🌄',
          repetitions: 12,
          difficulty: 2,
        },
        requirements: { totalReps: 12 },
        rewards: { xp: 2400, gold: 0 },
        goal_type: 'actions_completed',
        goal_value: 12,
        progressLabel: 'travessias',
        reward_type: 'chest',
        reward_value: 'Season',
      },
      {
        id: 'aurora-quest-leitor',
        title: 'O Leitor do Amanhecer',
        description: 'Feche 12 sessões de leitura focada para abrir clareza mental no ciclo da Aurora. Recompensa: 1 Baú Mítico.',
        type: 'individual',
        category: 'intellectual',
        season_id: 'season-aurora-1-2026',
        actionTemplate: {
          name: 'Leitura do Amanhecer',
          description: 'Ler com foco total por 30 minutos e registrar a sessao.',
          duration: 30,
          icon: '📚',
          repetitions: 12,
          difficulty: 2,
        },
        requirements: { totalReps: 12 },
        rewards: { xp: 2250, gold: 0 },
        goal_type: 'actions_completed',
        goal_value: 12,
        progressLabel: 'sessoes',
        reward_type: 'chest',
        reward_value: 'Season',
      },
      {
        id: 'aurora-quest-monge',
        title: 'O Monge da Bruma',
        description: 'Feche 15 práticas de meditação para atravessar a Aurora com presença e silêncio. Recompensa: 1 Baú Mítico.',
        type: 'individual',
        category: 'spiritual',
        season_id: 'season-aurora-1-2026',
        actionTemplate: {
          name: 'Meditacao da Bruma',
          description: 'Sessao curta de meditacao para estabilizar mente e respiracao.',
          duration: 12,
          icon: '🧘',
          repetitions: 15,
          isMilestone: true,
          difficulty: 1,
        },
        requirements: { totalReps: 15, milestone: true },
        rewards: { xp: 2100, gold: 0 },
        goal_type: 'actions_completed',
        goal_value: 15,
        progressLabel: 'praticas',
        reward_type: 'chest',
        reward_value: 'Season',
      },
      {
        id: 'aurora-quest-cla-vigilia',
        title: 'A Vigilia da Aurora',
        description: 'Como grupo, completem 30 rondas da Aurora para manter a temporada desperta. Recompensa: 1 Bau Season por participante.',
        type: 'clan',
        category: 'social',
        season_id: 'season-aurora-1-2026',
        actionTemplate: {
          name: 'Ronda da Aurora',
          description: 'Ronda coletiva do grupo para manter a Aurora desperta.',
          duration: 20,
          icon: '🌆',
          repetitions: 30,
          difficulty: 2,
        },
        requirements: { clanGoal: 30 },
        rewards: { xp: 2600, gold: 0 },
        clanConfig: { collectiveGoal: 30 },
        goal_type: 'actions_completed',
        goal_value: 30,
        progressLabel: 'rondas',
        reward_type: 'chest',
        reward_value: 'Season',
        maxParticipants: 20,
      },
    ],
  },
  'season-zenite-1-2026': {
    id: 'season-zenite-1-2026',
    name: 'Zenite I',
    description: 'Expansao de meio de ano da Primeira Era. Pressao, clareza e conquista no centro do mapa.',
    backgroundUrl: `${ROOT_IMAGES_URL}/gold.png`,
    startDate: '2026-12-21',
    endDate: '2027-03-20',
    theme: 'zenite',
    celebrationTitle: 'Zenite I concluida',
    celebrationSummary: 'O pico da Primeira Era foi encerrado com a leitura do que subiu e do que resistiu.',
    launchTitle: 'Zenite I',
    launchSummary: 'A nova Temporada entra com sua propria identidade, jornadas e pool de recompensas.',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-eclipse-1-2026': {
    id: 'season-eclipse-1-2026',
    name: 'Eclipse I',
    description: 'A travessia mais densa da Primeira Era. Leitura fria, sombra e reposicionamento.',
    backgroundUrl: `${ROOT_IMAGES_URL}/void.png`,
    startDate: '2027-03-20',
    endDate: '2027-06-21',
    theme: 'eclipse',
    celebrationTitle: 'Eclipse I concluida',
    celebrationSummary: 'A travessia de sombra da Primeira Era terminou. O sistema sobreviveu ao estreitamento.',
    launchTitle: 'Eclipse I',
    launchSummary: 'A nova Temporada abre um periodo de contraste, disciplina e consolidacao.',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-egide-1-2026': {
    id: 'season-egide-1-2026',
    name: 'Egide I',
    description: 'Fechamento defensivo da Primeira Era. Estrutura, blindagem e passagem para a proxima camada.',
    backgroundUrl: `${ROOT_IMAGES_URL}/frost.png`,
    startDate: '2027-06-21',
    endDate: '2027-09-23',
    theme: 'egide',
    celebrationTitle: 'Egide I concluida',
    celebrationSummary: 'O fechamento da Primeira Era foi concluido. O GLYPH entra maduro na Segunda Era.',
    launchTitle: 'Egide I',
    launchSummary: 'A nova Temporada sela o fechamento anual com trilha propria de recompensas.',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-aurora-2-2027': {
    id: 'season-aurora-2-2027',
    name: 'Aurora II',
    description: 'A Segunda Era amanhece com uma nova camada de jogo, ritmo e recompensas.',
    backgroundUrl: `${ROOT_IMAGES_URL}/aurora.png`,
    startDate: '2027-09-23',
    endDate: '2027-12-21',
    theme: 'aurora',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-zenite-2-2027': {
    id: 'season-zenite-2-2027',
    name: 'Zenite II',
    description: 'Pressao central da Segunda Era. Ritmo alto, leituras mais duras e recompensa mais rara.',
    backgroundUrl: `${ROOT_IMAGES_URL}/gold.png`,
    startDate: '2027-12-21',
    endDate: '2028-03-19',
    theme: 'zenite',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-eclipse-2-2027': {
    id: 'season-eclipse-2-2027',
    name: 'Eclipse II',
    description: 'A fase de sombra da Segunda Era. Ajuste de rota, corte e refinamento.',
    backgroundUrl: `${ROOT_IMAGES_URL}/void.png`,
    startDate: '2028-03-19',
    endDate: '2028-06-20',
    theme: 'eclipse',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-egide-2-2027': {
    id: 'season-egide-2-2027',
    name: 'Egide II',
    description: 'Fechamento blindado da Segunda Era. Consolidacao, defesa e passagem.',
    backgroundUrl: `${ROOT_IMAGES_URL}/frost.png`,
    startDate: '2028-06-20',
    endDate: '2028-09-22',
    theme: 'egide',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-aurora-3-2028': {
    id: 'season-aurora-3-2028',
    name: 'Aurora III',
    description: 'A Terceira Era amanhece com um novo patamar de identidade do sistema.',
    backgroundUrl: `${ROOT_IMAGES_URL}/aurora.png`,
    startDate: '2028-09-22',
    endDate: '2028-12-21',
    theme: 'aurora',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-zenite-3-2028': {
    id: 'season-zenite-3-2028',
    name: 'Zenite III',
    description: 'O centro da Terceira Era pede dominio fino, consistencia e alta entrega.',
    backgroundUrl: `${ROOT_IMAGES_URL}/gold.png`,
    startDate: '2028-12-21',
    endDate: '2029-03-20',
    theme: 'zenite',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-eclipse-3-2028': {
    id: 'season-eclipse-3-2028',
    name: 'Eclipse III',
    description: 'A sombra da Terceira Era cobra profundidade, corte e lucidez.',
    backgroundUrl: `${ROOT_IMAGES_URL}/void.png`,
    startDate: '2029-03-20',
    endDate: '2029-06-21',
    theme: 'eclipse',
    quests: EMPTY_SEASON_QUESTS,
  },
  'season-egide-3-2028': {
    id: 'season-egide-3-2028',
    name: 'Egide III',
    description: 'O fechamento da Terceira Era protege o que foi conquistado e prepara a proxima camada.',
    backgroundUrl: `${ROOT_IMAGES_URL}/frost.png`,
    startDate: '2029-06-21',
    endDate: '2029-09-22',
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
  /**
   * A quarta missao da Genesis: nao se cumpre sozinha, fecha as outras tres.
   *
   * Substitui O Peregrino, O Sabio e O Monge, que viviam aqui com goal_type
   * km_run / books_read / meditation_days — tipos que nenhuma parte do app
   * calcula. Ficavam visiveis em 0% para sempre, prometendo bau. O que a pessoa
   * de fato joga sao as tres jornadas de SEASONS['season-genesis-0'].quests,
   * e este selo aponta para elas por id.
   */
  {
    id: 'sm_genesis_meta_1',
    season_id: 'season-genesis-0',
    title: 'Selo da Genesis',
    description: 'Conclua as 3 jornadas da Temporada Zero para selar a Primeira Era. Recompensa: Insignia Genesis.',
    goal_type: 'quests_claimed',
    goal_value: 3,
    reward_type: 'item_id',
    reward_value: 'insignia_season_genesis',
    reward_item_ids: ['insignia_season_genesis'],
    sourceQuestIds: ['quest-wanderer', 'quest-scholar', 'quest-warrior'],
    reward_exp: 500,
    type: 'individual',
    icon: '🌌',
  },
  {
    id: 'sm_aurora_meta_1',
    season_id: 'season-aurora-1-2026',
    title: 'Selo de Aurora I',
    description: 'Conclua as 3 jornadas da Aurora I para selar a abertura oficial da Primeira Era. Recompensa: Guardiao Aurora, Borda Aurora I, Banner Aurora I e Insignia Aurora I.',
    goal_type: 'quests_claimed',
    goal_value: 3,
    reward_type: 'item_id',
    reward_value: 'item_skin_aurora_1_2026',
    reward_item_ids: ['item_skin_aurora_1_2026', 'insignia_season_aurora_1'],
    sourceQuestIds: ['aurora-quest-caminhante', 'aurora-quest-leitor', 'aurora-quest-monge'],
    type: 'individual',
    icon: '🌆',
  },
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

