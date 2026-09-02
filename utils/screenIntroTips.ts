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
export const SCREEN_INTRO_TIPS_DISABLED_FLAG = '__flag_screen_intro_tips_disabled_v1';
export const getScreenIntroTipSeenFlag = (tipId: ScreenIntroTipId) => `__flag_screen_intro_tip_seen_v1:${tipId}`;

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
    title: 'Olha o mapa antes de correr.',
    summary: 'Aqui eu vejo quais areas estão fortes, cansadas ou pedindo atencao.',
    items: ['abre o ativo mais fraco e escolhe um movimento pequeno.'],
  },
  arenas: {
    id: 'arenas',
    label: 'Arenas',
    title: 'Uma frente por vez.',
    summary: 'Arena e onde uma parte da vida deixa de ser ideia e vira coisa jogavel.',
    items: ['crie uma arena simples. O nome perfeito pode esperar.'],
  },
  arena_modal: {
    id: 'arena_modal',
    label: 'Nova arena',
    title: 'Comece pequeno.',
    summary: 'Não precisa nascer perfeito. Nomeie a frente e escolha o ativo que mais combina.',
    items: ['preencha o nome e salve; a estrutura vem depois.'],
  },
  planner: {
    id: 'planner',
    label: 'Planner',
    title: 'Agora o dia fica concreto.',
    summary: 'Puxa uma ação, conclui o que cabe e deixa o ciclo sentir que você apareceu.',
    items: ['complete uma ação real. Uma ja muda o estado do dia.'],
  },
  action_modal: {
    id: 'action_modal',
    label: 'Nova ação',
    title: 'A ação e o menor passo.',
    summary: 'Escreva algo que você realmente consegue fazer. Curto, claro e executavel.',
    items: ['coloque título e tempo aproximado; o resto pode ficar para depois.'],
  },
  rest: {
    id: 'rest',
    label: 'Descanso',
    title: 'Respira. Eu leio o agora.',
    summary: 'Essa tela reduz o ruido e mostra o que importa sem te jogar em mil botoes.',
    items: ['se o dia ja teve uma conclusao, fecha com calma. Se não teve, pega uma ação pequena.'],
  },
  social: {
    id: 'social',
    label: 'Mundo',
    title: 'Aqui mora o mundo fora da sua tela.',
    summary: 'Pessoas, mensagens, loja e camadas compartilhadas ficam aqui sem invadir o seu dia.',
    items: ['resolve o que chamou você e volta para a próxima ação.'],
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
    summary: 'Convites e solicitacoes ficam separados para não virar bagunca no chat.',
    items: ['responda o que estiver pendente ou siga sem peso se estiver vazio.'],
  },
  social_messages: {
    id: 'social_messages',
    label: 'Mensagens',
    title: 'Conversa humana fica aqui.',
    summary: 'Eu aviso quando precisa, mas não misturo DM com leitura do sistema.',
    items: ['abre quem importa agora; o resto pode esperar.'],
  },
  social_clan: {
    id: 'social_clan',
    label: 'Cla',
    title: 'A base do grupo.',
    summary: 'Use esta area para acompanhar conversa, presenca e combinados do clã.',
    items: ['leia o chat e veja se existe algo esperando sua resposta.'],
  },
  hall: {
    id: 'hall',
    label: 'Hall',
    title: 'Sua vitrine de legado.',
    summary: 'Aqui aparecem conquistas, reputacao e sinais publicos do que você construiu.',
    items: ['olhe como seu perfil aparece para fora.'],
  },
  store: {
    id: 'store',
    label: 'Loja',
    title: 'Compra sem virar labirinto.',
    summary: 'Campanhas, itens e ouro ficam aqui. Entra pelo que você quer usar de verdade.',
    items: ['uma aba por vez. Campanha muda estrutura; item muda presenca.'],
  },
  store_codexes: {
    id: 'store_codexes',
    label: 'Codexes',
    title: 'Campanhas prontas para instalar.',
    summary: 'Codexes adicionam estrutura nova quando você quer seguir um caminho guiado.',
    items: ['abra uma campanha e veja se ela combina com sua fase atual.'],
  },
  store_items: {
    id: 'store_items',
    label: 'Itens',
    title: 'Identidade e presenca.',
    summary: 'Itens mudam como sua conta aparece: visual, perfil, jardim e estilo.',
    items: ['compre so o que você quer ver no seu perfil ou inventario.'],
  },
  store_gold: {
    id: 'store_gold',
    label: 'Ouro',
    title: 'Recarga e suporte ao app.',
    summary: 'Ouro serve para comprar expansoes e itens sem depender de grind pesado.',
    items: ['confira os packs apenas se você realmente precisar de saldo.'],
  },
  season: {
    id: 'season',
    label: 'Temporada',
    title: 'O que esta valendo agora.',
    summary: 'A temporada mostra missões, recompensas e desafios vivos deste periodo.',
    items: ['pegue uma missão pequena e leve para suas arenas ou planner.'],
  },
  arsenal: {
    id: 'arsenal',
    label: 'Arsenal',
    title: 'Seu inventario mora aqui.',
    summary: 'Tudo que você ganhou, comprou ou equipou aparece nesta area.',
    items: ['abra artefatos ou cosmeticos e equipe o que combina com você.'],
  },
  settings: {
    id: 'settings',
    label: 'Config',
    title: 'Ajuste o app ao seu jeito.',
    summary: 'Aqui ficam conta, privacidade, som, Oráculo, tutoriais e preferencia de uso.',
    items: ['mude uma preferencia por vez; não precisa configurar tudo agora.'],
  },
  settings_general: {
    id: 'settings_general',
    label: 'Geral',
    title: 'O basico da conta.',
    summary: 'Use esta aba para revisar estado da conta e atalhos principais.',
    items: ['confira se esta tudo certo antes de mexer nas opções finas.'],
  },
  settings_preferences: {
    id: 'settings_preferences',
    label: 'Preferencias',
    title: 'Me regula do seu jeito.',
    summary: 'Aqui você ajusta visual, som, vibracao, dicas e o quanto eu apareco.',
    items: ['desliga o que cansa e deixa ligado o que te traz de volta.'],
  },
  settings_premium: {
    id: 'settings_premium',
    label: 'Premium',
    title: 'Extras ficam aqui.',
    summary: 'Esta aba mostra beneficios pagos sem misturar isso com o seu fluxo diário.',
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
    title: 'Esse e o seu sinal público.',
    summary: 'Perfil junta identidade, nível e o que você decidiu mostrar para fora.',
    items: ['confere visual e privacidade antes de deixar alguem ver.'],
  },
  reports: {
    id: 'reports',
    label: 'Relatorios',
    title: 'Aqui o ciclo vira memória.',
    summary: 'Relatório não e bronca: e o registro do que você viveu e fechou.',
    items: ['se estiver vazio, fecha um ciclo quando tiver material real.'],
  },
};

export const SCREEN_INTRO_TIP_LIST = Object.values(SCREEN_INTRO_TIPS);

export const hasScreenIntroTip = (tipId: string): tipId is ScreenIntroTipId =>
  Object.prototype.hasOwnProperty.call(SCREEN_INTRO_TIPS, tipId);

export const areScreenIntroTipsEnabled = (userId?: string | null, profileFlags: string[] = []): boolean => {
  if (profileFlags.includes(SCREEN_INTRO_TIPS_DISABLED_FLAG)) return false;
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(getEnabledStorageKey(userId)) !== '0';
};

export const setScreenIntroTipsEnabled = (userId: string | null | undefined, enabled: boolean) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getEnabledStorageKey(userId), enabled ? '1' : '0');
};

export const hasSeenScreenIntroTip = (userId: string | null | undefined, tipId: ScreenIntroTipId, profileFlags: string[] = []): boolean => {
  if (profileFlags.includes(getScreenIntroTipSeenFlag(tipId))) return true;
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(getSeenStorageKey(userId, tipId)) === 'seen';
};

export const markScreenIntroTipSeen = (userId: string | null | undefined, tipId: ScreenIntroTipId) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getSeenStorageKey(userId, tipId), 'seen');
};

/**
 * A dica que combina com o que esta na tela.
 *
 * A dica era fixa por tela e mostrada uma vez, sem olhar o estado. O resultado
 * era conselho que nao servia para quem estava lendo: a tela de Arenas dizia
 * "crie uma arena simples" para quem chegava com seis; o Planner dizia "puxa uma
 * ação" para quem nao tinha ciclo aberto, e ali o Planner esta vazio — a pessoa
 * lia a dica, olhava a tela e nao via nada do que foi descrito.
 *
 * Nao muda a regra: continua uma vez por tela, continua respeitando o
 * interruptor, continua a mesma tela vista. Muda o QUE ela diz, que passa a
 * depender do que existe. Dica que descreve outra tela ensina que a dica nao
 * vale a pena ler.
 *
 * So as telas em que o estado realmente muda o conselho tem variante. Nas
 * outras, uma dica so continua sendo a resposta certa.
 */
export interface ScreenIntroTipState {
  arenasCount: number;
  hasActiveCycle: boolean;
  hasClosedCycle: boolean;
}

const SCREEN_INTRO_TIP_VARIANTS: Partial<Record<ScreenIntroTipId, (state: ScreenIntroTipState) => Partial<ScreenIntroTipDef> | null>> = {
  arenas: (state) => (state.arenasCount === 0 ? null : {
    title: 'Uma frente por vez.',
    summary: `Você ja tem ${state.arenasCount} ${state.arenasCount === 1 ? 'arena' : 'arenas'}. Aqui elas viram o que você joga hoje.`,
    items: ['escolha uma para hoje. As outras não vao a lugar nenhum.'],
  }),
  planner: (state) => (state.hasActiveCycle ? null : {
    title: 'Ainda sem ciclo.',
    summary: 'Dá para executar sem ciclo: as ações valem e a experiência entra igual. O ciclo é quando você quer assumir uma meta com prazo.',
    items: ['vá concluindo e ajustando as repetições. O ciclo pode vir depois.'],
  }),
  reports: (state) => (state.hasClosedCycle ? null : {
    title: 'Ainda não ha o que comparar.',
    summary: 'O histórico nasce quando o primeiro ciclo fecha. Ate la esta tela fica quase vazia.',
    items: ['volte aqui depois de fechar um ciclo.'],
  }),
};

/** A dica base, com a variante aplicada por cima quando o estado pede outra. */
export const resolveScreenIntroTip = (
  tipId: ScreenIntroTipId,
  state: ScreenIntroTipState,
): ScreenIntroTipDef => {
  const base = SCREEN_INTRO_TIPS[tipId];
  const variante = SCREEN_INTRO_TIP_VARIANTS[tipId]?.(state) || null;
  return variante ? { ...base, ...variante } : base;
};
