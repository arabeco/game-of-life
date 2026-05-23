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
    title: 'Este e seu mapa geral.',
    summary: 'Aqui voce ve quais areas da vida estao fortes, fracas ou pedindo cuidado.',
    items: ['olhe o ativo mais baixo e abra ele se quiser decidir o proximo movimento.'],
  },
  arenas: {
    id: 'arenas',
    label: 'Arenas',
    title: 'Aqui as frentes viram jogo.',
    summary: 'Arenas sao projetos, metas ou partes da vida que precisam de acao real.',
    items: ['crie uma arena simples; depois voce melhora o nome e os detalhes.'],
  },
  arena_modal: {
    id: 'arena_modal',
    label: 'Nova arena',
    title: 'Comece pequeno.',
    summary: 'Nao precisa nascer perfeito. Nomeie a frente e escolha o ativo que mais combina.',
    items: ['preencha o nome e salve; a estrutura vem depois.'],
  },
  planner: {
    id: 'planner',
    label: 'Planner',
    title: 'Este e o seu hoje.',
    summary: 'Aqui voce puxa acoes para o dia, completa o que fez e sente o ciclo andar.',
    items: ['pegue uma acao do estoque ou complete algo que ja esta na grade.'],
  },
  action_modal: {
    id: 'action_modal',
    label: 'Nova acao',
    title: 'A acao e o menor passo.',
    summary: 'Escreva algo que voce realmente consegue fazer. Curto, claro e executavel.',
    items: ['coloque titulo e tempo aproximado; o resto pode ficar para depois.'],
  },
  rest: {
    id: 'rest',
    label: 'Descanso',
    title: 'Respira. Aqui e leitura do agora.',
    summary: 'Essa tela tira o ruido e mostra o estado do dia sem te jogar em mil botoes.',
    items: ['use o painel diario quando quiser revisar ou fechar o dia com calma.'],
  },
  social: {
    id: 'social',
    label: 'Mundo',
    title: 'Aqui mora o lado social.',
    summary: 'Pessoas, mensagens, loja e camadas compartilhadas ficam aqui, longe do fluxo do dia.',
    items: ['entre na aba que voce procura: pessoas, mensagens, loja ou campanhas.'],
  },
  social_people: {
    id: 'social_people',
    label: 'Pessoas',
    title: 'Encontre quem joga perto.',
    summary: 'Use esta area para buscar pessoas, ver vinculos e cuidar da sua rede.',
    items: ['procure alguem ou revise quem ja esta no seu circulo.'],
  },
  social_requests: {
    id: 'social_requests',
    label: 'Pedidos',
    title: 'Tudo que espera resposta.',
    summary: 'Convites e solicitacoes ficam separados para nao virar bagunca no chat.',
    items: ['responda o que estiver pendente ou siga sem peso se estiver vazio.'],
  },
  social_messages: {
    id: 'social_messages',
    label: 'Mensagens',
    title: 'DMs ficam aqui.',
    summary: 'Conversas diretas moram no Mundo. O Oraculo avisa, mas nao mistura os papeis.',
    items: ['abra uma conversa ou volte depois se nao houver nada urgente.'],
  },
  social_clan: {
    id: 'social_clan',
    label: 'Cla',
    title: 'A base do grupo.',
    summary: 'Use esta area para acompanhar conversa, presenca e combinados do cla.',
    items: ['leia o chat e veja se existe algo esperando sua resposta.'],
  },
  hall: {
    id: 'hall',
    label: 'Hall',
    title: 'Sua vitrine de legado.',
    summary: 'Aqui aparecem conquistas, reputacao e sinais publicos do que voce construiu.',
    items: ['olhe como seu perfil aparece para fora.'],
  },
  store: {
    id: 'store',
    label: 'Loja',
    title: 'Expansoes sem pressa.',
    summary: 'A loja libera campanhas, itens e ouro. Nada aqui precisa atrapalhar seu dia.',
    items: ['explore uma aba por vez; campanha muda estrutura, item muda presenca.'],
  },
  store_codexes: {
    id: 'store_codexes',
    label: 'Codexes',
    title: 'Campanhas prontas para instalar.',
    summary: 'Codexes adicionam estrutura nova quando voce quer seguir um caminho guiado.',
    items: ['abra uma campanha e veja se ela combina com sua fase atual.'],
  },
  store_items: {
    id: 'store_items',
    label: 'Itens',
    title: 'Identidade e presenca.',
    summary: 'Itens mudam como sua conta aparece: visual, perfil, jardim e estilo.',
    items: ['compre so o que voce quer ver no seu perfil ou inventario.'],
  },
  store_forge: {
    id: 'store_forge',
    label: 'Forja',
    title: 'Fragmentos viram coisa util.',
    summary: 'Aqui voce recicla sobras e transforma fragmentos em itens ou liberacoes.',
    items: ['use quando tiver fragmentos parados.'],
  },
  store_gold: {
    id: 'store_gold',
    label: 'Ouro',
    title: 'Recarga e suporte ao app.',
    summary: 'Ouro serve para comprar expansoes e itens sem depender de grind pesado.',
    items: ['confira os packs apenas se voce realmente precisar de saldo.'],
  },
  season: {
    id: 'season',
    label: 'Temporada',
    title: 'O que esta valendo agora.',
    summary: 'A temporada mostra missoes, recompensas e desafios vivos deste periodo.',
    items: ['pegue uma missao pequena e leve para suas arenas ou planner.'],
  },
  arsenal: {
    id: 'arsenal',
    label: 'Arsenal',
    title: 'Seu inventario mora aqui.',
    summary: 'Tudo que voce ganhou, comprou ou equipou aparece nesta area.',
    items: ['abra artefatos ou cosmeticos e equipe o que combina com voce.'],
  },
  settings: {
    id: 'settings',
    label: 'Config',
    title: 'Ajuste o app ao seu jeito.',
    summary: 'Aqui ficam conta, privacidade, som, Oraculo, tutoriais e preferencia de uso.',
    items: ['mude uma preferencia por vez; nao precisa configurar tudo agora.'],
  },
  settings_general: {
    id: 'settings_general',
    label: 'Geral',
    title: 'O basico da conta.',
    summary: 'Use esta aba para revisar estado da conta e atalhos principais.',
    items: ['confira se esta tudo certo antes de mexer nas opcoes finas.'],
  },
  settings_preferences: {
    id: 'settings_preferences',
    label: 'Preferencias',
    title: 'Deixe o app menos barulhento.',
    summary: 'Aqui voce regula visual, som, vibracao, dicas e comportamento do Oraculo.',
    items: ['desligue o que incomoda e mantenha o que te ajuda a voltar.'],
  },
  settings_premium: {
    id: 'settings_premium',
    label: 'Premium',
    title: 'Extras ficam aqui.',
    summary: 'Esta aba mostra beneficios pagos sem misturar isso com o seu fluxo diario.',
    items: ['compare com calma; o core do app continua funcionando fora daqui.'],
  },
  settings_season: {
    id: 'settings_season',
    label: 'Temporada',
    title: 'Ajustes da fase atual.',
    summary: 'Use quando quiser entender ou revisar o que esta ligado a temporada.',
    items: ['veja o status da fase antes de trocar alguma coisa.'],
  },
  profile: {
    id: 'profile',
    label: 'Perfil',
    title: 'E assim que voce aparece.',
    summary: 'Perfil junta identidade, nivel, sinais publicos e partes visiveis da sua conta.',
    items: ['revise nome, visual e privacidade antes de mostrar para alguem.'],
  },
  reports: {
    id: 'reports',
    label: 'Relatorios',
    title: 'Aqui o ciclo vira memoria.',
    summary: 'Relatorios guardam fases fechadas, leituras e progresso que ja aconteceu.',
    items: ['se estiver vazio, comece ou encerre um ciclo para acender esta area.'],
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
