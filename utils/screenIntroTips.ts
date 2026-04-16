export type ScreenIntroTipId =
  | 'assets'
  | 'arenas'
  | 'arena_modal'
  | 'planner'
  | 'action_modal'
  | 'rest'
  | 'social'
  | 'social_people'
  | 'social_requests'
  | 'social_messages'
  | 'social_clan'
  | 'hall'
  | 'store'
  | 'store_codexes'
  | 'store_items'
  | 'store_forge'
  | 'store_gold'
  | 'season'
  | 'arsenal'
  | 'settings'
  | 'settings_general'
  | 'settings_preferences'
  | 'settings_premium'
  | 'settings_season'
  | 'profile'
  | 'reports';

export type ScreenIntroTipDef = {
  id: ScreenIntroTipId;
  label: string;
  title: string;
  summary: string;
  items: string[];
};

export const SCREEN_INTRO_TIPS_SETTINGS_CHANGED_EVENT = 'glyph:screen-intro-tips-settings-changed';
export const SCREEN_INTRO_TIP_CONTEXT_EVENT = 'glyph:screen-intro-tip-context';

const SCREEN_INTRO_TIPS_ENABLED_PREFIX = 'glyph:screen-intro-tips:enabled';
const SCREEN_INTRO_TIPS_SEEN_PREFIX = 'glyph:screen-intro-tips:seen';

const sanitizeUserId = (userId?: string | null) => {
  const trimmed = String(userId || '').trim();
  return trimmed || 'anon';
};

const getEnabledStorageKey = (userId?: string | null) =>
  `${SCREEN_INTRO_TIPS_ENABLED_PREFIX}:${sanitizeUserId(userId)}`;

const getSeenStorageKey = (userId: string | null | undefined, tipId: ScreenIntroTipId) =>
  `${SCREEN_INTRO_TIPS_SEEN_PREFIX}:${sanitizeUserId(userId)}:${tipId}`;

export const SCREEN_INTRO_TIPS: Record<ScreenIntroTipId, ScreenIntroTipDef> = {
  assets: {
    id: 'assets',
    label: 'Ativos',
    title: 'Panorama dos seus territórios',
    summary: 'Aqui você enxerga a leitura macro da sua vida no app antes de entrar no detalhe operacional.',
    items: [
      'força atual por área da vida',
      'atalhos visuais para identidade e progresso',
      'visão rápida do estado geral do sistema',
    ],
  },
  arenas: {
    id: 'arenas',
    label: 'Arenas',
    title: 'Frentes reais da sua vida',
    summary: 'Arenas organizam metas e frentes em territórios legíveis. É aqui que a estrutura nasce.',
    items: [
      'criar e ordenar arenas',
      'abrir ações dentro de cada frente',
      'conectar campanhas e contexto operacional',
    ],
  },
  arena_modal: {
    id: 'arena_modal',
    label: 'Criar Arena',
    title: 'Comece por uma frente real',
    summary: 'Uma arena não precisa nascer perfeita. Ela só precisa nomear um território importante da sua vida para o sistema começar a organizar o jogo ao redor disso.',
    items: [
      'crie uma frente simples e concreta',
      'ligue essa arena a um ativo pai quando fizer sentido',
      'depois você pode colocar ações, campanhas e ritmo dentro dela',
    ],
  },
  planner: {
    id: 'planner',
    label: 'Planner',
    title: 'Onde o plano vira grade viva',
    summary: 'O Planner segura o dia e a semana. Aqui intenção, horário, carga e execução se encontram.',
    items: [
      'grade diária e semanal',
      'pool de ações prontas para uso',
      'ritmo do ciclo e fluxo do agora',
    ],
  },
  action_modal: {
    id: 'action_modal',
    label: 'Criar Ação',
    title: 'A ação é a unidade do jogo',
    summary: 'Ação é o que você realmente faz. Comece com um nome claro e um tempo plausível; o resto pode amadurecer depois.',
    items: [
      'transforme intenção em algo executável',
      'se quiser, já deixe horário, repetição ou contexto',
      'quando fizer sentido, o modo ação e o planner empurram isso para a prática',
    ],
  },
  rest: {
    id: 'rest',
    label: 'Descanso',
    title: 'Leitura do agora sem ruído',
    summary: 'A tela de descanso puxa o painel diário e te deixa ver o estado do dia com menos pressão.',
    items: [
      'sitrep e leitura do momento',
      'resumo do dia sem navegar em tudo',
      'entrada mais calma para agir ou só revisar',
    ],
  },
  social: {
    id: 'social',
    label: 'Mundo',
    title: 'Camada compartilhada do sistema',
    summary: 'Mundo agora é a casa das relações, biblioteca, loja e camadas sociais do app.',
    items: [
      'pessoas, mensagens e grupo',
      'campanhas, arsenal e loja',
      'operações sociais sem misturar com o Oráculo',
    ],
  },
  social_people: {
    id: 'social_people',
    label: 'Pessoas',
    title: 'Relações e vínculos',
    summary: 'Aqui ficam amizades, parcerias, mentoria e a malha social mais estável do sistema.',
    items: [
      'buscar pessoas e grupos',
      'abrir vínculos ativos',
      'ver quem já está no seu círculo',
    ],
  },
  social_requests: {
    id: 'social_requests',
    label: 'Solicitações',
    title: 'Caixa de entrada social',
    summary: 'Essa área reúne pedidos que ainda precisam de resposta, sem confundir com conversa viva.',
    items: [
      'amizades recebidas e enviadas',
      'convites de vínculo',
      'pedidos de grupo e respostas pendentes',
    ],
  },
  social_messages: {
    id: 'social_messages',
    label: 'Mensagens',
    title: 'DMs vivem aqui',
    summary: 'As mensagens diretas saíram do Oráculo e agora moram na camada social certa.',
    items: [
      'histórico de conversas 1 a 1',
      'abertura por aviso vindo do Oráculo',
      'caixa social separada da voz do sistema',
    ],
  },
  social_clan: {
    id: 'social_clan',
    label: 'Clã',
    title: 'Grupo e coordenação coletiva',
    summary: 'Essa é a casa do chat de grupo e da coordenação compartilhada com o seu clã.',
    items: [
      'chat do grupo',
      'coordenação de presença e chamados',
      'ponte para operação coletiva sem poluir o Oráculo',
    ],
  },
  hall: {
    id: 'hall',
    label: 'Hall',
    title: 'Vitrine do legado',
    summary: 'O Hall é a camada de vitrine, reputação e leitura pública do que foi conquistado.',
    items: [
      'hall da fama e marcos visíveis',
      'camada de status e legado',
      'leitura aspiracional do progresso',
    ],
  },
  store: {
    id: 'store',
    label: 'Loja',
    title: 'Expansões e economia do app',
    summary: 'A loja concentra os caminhos de expansão do sistema, separados por propósito.',
    items: [
      'campanhas e codexes',
      'itens e personalização',
      'fragmentos, ouro e progressão leve',
    ],
  },
  store_codexes: {
    id: 'store_codexes',
    label: 'Codexes',
    title: 'Biblioteca de campanhas',
    summary: 'Aqui entram campanhas prontas para instalar e ampliar suas frentes com estrutura.',
    items: [
      'codexes de campanha',
      'biblioteca comprada ou liberada',
      'instalação quando fizer sentido no seu momento',
    ],
  },
  store_items: {
    id: 'store_items',
    label: 'Itens',
    title: 'Personalização e identidade',
    summary: 'Itens trabalham mais a estética, presença e leitura visual da sua conta no sistema.',
    items: [
      'skins, bordas, banners e glifos',
      'itens de presença e identidade',
      'camada leve, sem mexer no core operacional',
    ],
  },
  store_forge: {
    id: 'store_forge',
    label: 'Forja',
    title: 'Fragmentos viram valor aqui',
    summary: 'A Forja é a área de fragmentos: reciclar, forjar itens e liberar campanhas leves sem virar grind tóxico.',
    items: [
      'reciclar itens em fragmentos',
      'forjar seleção curada por tipo',
      'campanhas casuais por fragmentos',
    ],
  },
  store_gold: {
    id: 'store_gold',
    label: 'Ouro',
    title: 'Compra de ouro e suporte',
    summary: 'Essa aba concentra packs e compras que destravam expansão econômica direta do app.',
    items: [
      'packs de ouro',
      'atalhos de compra do sistema',
      'entrada para premium e expansões econômicas',
    ],
  },
  season: {
    id: 'season',
    label: 'Temporada',
    title: 'Camada sazonal do sistema',
    summary: 'A temporada organiza missões, recompensas e o compasso vivo do período atual.',
    items: [
      'missões e quests da temporada',
      'recompensas especiais e leitura de fase',
      'contexto do momento atual do app',
    ],
  },
  arsenal: {
    id: 'arsenal',
    label: 'Arsenal',
    title: 'Seu inventário operacional e visual',
    summary: 'No Arsenal você revisa o que já foi ganho e equipa o que faz sentido usar.',
    items: [
      'inventário e equipamentos',
      'itens ativos no perfil',
      'ponte entre ganho e uso real',
    ],
  },
  settings: {
    id: 'settings',
    label: 'Config',
    title: 'Ajustes finos da experiência',
    summary: 'Configurações guardam tom, privacidade, preferências e releituras guiadas do app.',
    items: [
      'modo de uso e preferências',
      'oráculo, alertas e privacidade',
      'tutorial, suporte e ajustes finos',
    ],
  },
  settings_general: {
    id: 'settings_general',
    label: 'Geral',
    title: 'Base do seu uso',
    summary: 'A aba Geral concentra status da conta, acessos rápidos e leitura ampla da experiência.',
    items: [
      'estado da conta e atalhos principais',
      'entrada para partes centrais da configuração',
      'visão geral antes do ajuste fino',
    ],
  },
  settings_preferences: {
    id: 'settings_preferences',
    label: 'Preferências',
    title: 'Tom, UI e comportamento do sistema',
    summary: 'É aqui que você muda como o app fala, aparece e te acompanha no dia a dia.',
    items: [
      'preferências de interface',
      'modos e comportamento do app',
      'controles de tutorial e dicas iniciais',
    ],
  },
  settings_premium: {
    id: 'settings_premium',
    label: 'Premium',
    title: 'Expansão e benefícios',
    summary: 'Essa aba mostra o que muda quando a pessoa quer mais profundidade, memória e amplitude no sistema.',
    items: [
      'benefícios do premium',
      'camadas extras de profundidade',
      'leitura de upgrade sem poluir o fluxo principal',
    ],
  },
  settings_season: {
    id: 'settings_season',
    label: 'Temporada',
    title: 'Ajustes e leitura sazonal',
    summary: 'Aqui entram os detalhes de temporada e o contexto narrativo das fases do app.',
    items: [
      'estado atual da temporada',
      'ajustes ligados ao período vivo',
      'ponte entre configuração e campanha sazonal',
    ],
  },
  profile: {
    id: 'profile',
    label: 'Perfil',
    title: 'Sua identidade pública no sistema',
    summary: 'O perfil reúne aparência, presença, reputação e leitura condensada da sua conta.',
    items: [
      'identidade visual e presença',
      'nível, sinais e reputação',
      'camada pública do seu soberano',
    ],
  },
  reports: {
    id: 'reports',
    label: 'Relatórios',
    title: 'Histórico, ciclos e legado',
    summary: 'Relatórios são a casa do legado. É aqui que ciclos fechados viram leitura, memória e presença; e quando estiver tudo zerado, abrir um novo ciclo é o que acende essa página.',
    items: [
      'encerrar ciclo e revisar resultado',
      'abrir um novo ciclo para devolver ritmo ao sistema',
      'histórico de fases anteriores',
      'legado e análise de evolução',
    ],
  },
};

export const SCREEN_INTRO_TIP_LIST = Object.values(SCREEN_INTRO_TIPS);

export const hasScreenIntroTip = (tipId: string): tipId is ScreenIntroTipId =>
  Object.prototype.hasOwnProperty.call(SCREEN_INTRO_TIPS, tipId);

export const areScreenIntroTipsEnabled = (userId?: string | null): boolean => {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(getEnabledStorageKey(userId)) !== '0';
};

export const setScreenIntroTipsEnabled = (userId: string | null | undefined, enabled: boolean) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getEnabledStorageKey(userId), enabled ? '1' : '0');
};

export const hasSeenScreenIntroTip = (userId: string | null | undefined, tipId: ScreenIntroTipId): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(getSeenStorageKey(userId, tipId)) === 'seen';
};

export const markScreenIntroTipSeen = (userId: string | null | undefined, tipId: ScreenIntroTipId) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getSeenStorageKey(userId, tipId), 'seen');
};
