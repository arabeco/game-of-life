export const LIFE_AREA_IDS = ['proposito', 'relacoes', 'trabalho', 'lazer', 'saude'] as const;

export type LifeAreaId = (typeof LIFE_AREA_IDS)[number];

export type LifeAreaDefinition = {
  id: LifeAreaId;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  description: string;
  levelDescriptions: readonly string[];
  widget: {
    id: string;
    label: string;
    options: readonly string[];
  };
};

export const MASTERY_AREA_MAX_LEVEL = 10;
export const MASTERY_RAW_TOTAL_MAX_LEVEL = 50;
export const MASTERY_TOTAL_MAX_LEVEL = 100;
export const MASTERY_INDEX_MULTIPLIER = 2;

export const toMasteryIndex = (rawTotal: number): number =>
  Math.min(MASTERY_TOTAL_MAX_LEVEL, Math.max(0, Math.round(rawTotal * MASTERY_INDEX_MULTIPLIER)));

// Cada nivel de area vale 2 pontos no Indice Glyph, que vai de 0 a 100.
// Area sem nivel conta como 1: o piso vale para as duas funcoes abaixo.
// Toda tela que mostra o indice usa uma destas - ninguem recalcula na mao.
const sumAreaLevels = (levels: readonly (number | null | undefined)[]): number =>
  levels.reduce<number>((sum, level) => sum + Math.max(1, Number(level || 1)), 0);

export const getMasteryIndexFromLevels = (levels: readonly (number | null | undefined)[]): number =>
  toMasteryIndex(sumAreaLevels(levels));

/**
 * O numero de nivel que o usuario VE.
 *
 * `profile.level` guarda a soma crua dos niveis das cinco areas — 36, no caso de
 * quem tem todas em 7 ou 8. O Indice Glyph, que e o numero do cabecalho, e essa
 * soma vezes dois: 72. As duas coisas conviviam, e cada tela escolhia uma: o
 * cabecalho mostrava 72 e a placa do legado mostrava 36 para a mesma pessoa, no
 * mesmo instante.
 *
 * Toda tela que mostra "Nivel" passa por aqui. Quem precisa do numero cru para
 * conta interna continua lendo profile.level direto.
 */
export const getDisplayLevel = (rawLevel: number | null | undefined): number =>
  toMasteryIndex(Math.max(1, Number(rawLevel || 1)));

export const getMasteryIndexFromAssets = (
  assets: readonly { id: string; level?: number | null }[],
): number =>
  getMasteryIndexFromLevels(
    assets
      .filter((asset) => LIFE_AREA_IDS.includes(asset.id as LifeAreaId))
      .map((asset) => asset.level),
  );

export const LEGACY_LIFE_AREA_IDS = [
  'consciencia',
  'espiritualidade',
  'espaco-mental',
  'espaco_mental',
  'espacoMental',
  'projetos',
  'conexoes',
  'conexao',
  'financas',
  'hobbies',
  'fisico',
  'corpo',
] as const;

export const RETIRED_LIFE_AREA_IDS = [
  'consciencia',
  'espiritualidade',
  'espaco-mental',
  'espaco_mental',
  'espacoMental',
  'projetos',
  'conexoes',
  'conexao',
  'financas',
  'hobbies',
  'fisico',
  'corpo',
] as const;

// Ordem visual: do mais etereo no topo ao mais denso na base.
export const LIFE_AREAS: readonly LifeAreaDefinition[] = [
  {
    id: 'proposito',
    name: 'PROPÓSITO & ESPIRITUALIDADE',
    shortName: 'PROPÓSITO',
    icon: '✨',
    color: '#3f70a4',
    description: 'Sentido, valores, presença, fé e direção interior.',
    levelDescriptions: [
      'Sinto pouca direção e quase não paro para refletir sobre o que dá sentido à minha vida.',
      'Percebo que preciso de um norte, mas ainda vivo principalmente no automático.',
      'Começo a reconhecer meus valores e a explorar práticas de reflexão ou espiritualidade.',
      'Tenho momentos de presença e alguma direção, embora ainda sejam irregulares.',
      'Meu propósito está mais claro e já influencia parte das minhas escolhas.',
      'Mantenho práticas que fortalecem presença, valores e sentido na maior parte das semanas.',
      'Minhas ações diárias costumam refletir meu norte interior.',
      'Vivo com significado e consigo atravessar dúvidas sem perder completamente a direção.',
      'Propósito e espiritualidade estão integrados às minhas escolhas e à minha contribuição.',
      'Minha vida expressa com clareza, presença e maturidade aquilo em que acredito.',
    ],
    widget: {
      id: 'widget_proposito',
      label: 'Norte interior',
      options: ['Não definido', 'Criar', 'Servir', 'Ensinar', 'Curar', 'Proteger', 'Transformar', 'Explorar', 'Conectar', 'Outro'],
    },
  },
  {
    id: 'relacoes',
    name: 'RELAÇÕES',
    shortName: 'RELAÇÕES',
    icon: '🤝',
    color: '#3f8069',
    description: 'Família, amizades, amor, comunidade e convivência.',
    levelDescriptions: [
      'Sinto-me isolado ou preso em relações que me fazem mal.',
      'Tenho contatos, mas pouca intimidade, apoio ou segurança emocional.',
      'Começo a perceber padrões e a buscar relações mais honestas.',
      'Pratico escuta, presença e limites, ainda com bastante oscilação.',
      'Cultivo algumas relações verdadeiras e consigo pedir ou oferecer apoio.',
      'Minhas relações importantes recebem atenção e comunicação frequentes.',
      'Tenho vínculos saudáveis, limites claros e espaço para vulnerabilidade.',
      'Minha rede de relações é fonte consistente de crescimento, afeto e pertencimento.',
      'Fortaleço comunidades e ajudo outras pessoas a se conectarem de forma autêntica.',
      'Minhas relações são maduras, recíprocas e profundamente integradas à vida que construo.',
    ],
    widget: {
      id: 'widget_relacoes',
      label: 'Foco relacional',
      options: ['Não definido', 'Família', 'Relacionamento', 'Amizades', 'Comunidade', 'Parcerias', 'Solitude', 'Outro'],
    },
  },
  {
    id: 'trabalho',
    name: 'TRABALHO & ESTUDOS',
    shortName: 'TRABALHO',
    icon: '💼',
    color: '#b28a35',
    description: 'Ofício, estudo, projetos, dinheiro e construção de futuro.',
    levelDescriptions: [
      'Estou sem direção, paralisado ou em crise com trabalho, estudos e dinheiro.',
      'Faço apenas o urgente e tenho pouca clareza sobre o futuro que estou construindo.',
      'Começo a organizar prioridades, aprender e cuidar melhor da vida financeira.',
      'Consigo executar tarefas e pequenos projetos, mas ainda perco ritmo com facilidade.',
      'Tenho uma direção profissional ou acadêmica e avanço com alguma consistência.',
      'Trabalho, estudo, projetos e finanças estão organizados o bastante para sustentar progresso.',
      'Entrego com qualidade, desenvolvo habilidades e tomo decisões de longo prazo.',
      'Meu trabalho gera valor, meus estudos têm direção e minha base financeira é estável.',
      'Construo projetos relevantes com domínio, autonomia e impacto crescente.',
      'Trabalho, conhecimento e recursos formam uma obra coerente, sustentável e significativa.',
    ],
    widget: {
      id: 'widget_trabalho',
      label: 'Foco atual',
      options: ['Não definido', 'Estudo', 'Carreira', 'Negócio', 'Projeto', 'Finanças', 'Transição', 'Outro'],
    },
  },
  {
    id: 'lazer',
    name: 'LAZER & BEM-ESTAR',
    shortName: 'LAZER',
    icon: '🎨',
    color: '#b9684b',
    description: 'Descanso, prazer, hobbies, criatividade e espaço mental.',
    levelDescriptions: [
      'Minha rotina deixa pouco espaço para descanso, prazer ou recuperação mental.',
      'Descanso de modo passivo, mas raramente termino realmente renovado.',
      'Experimento formas de lazer e bem-estar, ainda sem regularidade.',
      'Já protejo alguns momentos de descanso, hobby ou silêncio durante a semana.',
      'Tenho atividades que me dão prazer e ajudam a recuperar minha energia.',
      'Lazer, descanso e cuidado mental fazem parte da minha rotina com frequência.',
      'Consigo alternar esforço e recuperação sem culpa e com boa consciência do meu ritmo.',
      'Meus interesses alimentam criatividade, leveza, presença e conexão com outras pessoas.',
      'Cultivo um ritmo de vida rico, sustentável e genuinamente prazeroso.',
      'Bem-estar, descanso e criação estão plenamente integrados à forma como vivo.',
    ],
    widget: {
      id: 'widget_lazer',
      label: 'Forma de recarregar',
      options: ['Não definido', 'Arte', 'Música', 'Leitura', 'Games', 'Cinema', 'Natureza', 'Viagem', 'Culinária', 'Outro'],
    },
  },
  {
    id: 'saude',
    name: 'SAÚDE',
    shortName: 'SAÚDE',
    icon: '💪',
    color: '#a6424f',
    description: 'Movimento, alimentação, sono, energia e cuidado físico.',
    levelDescriptions: [
      'Minha saúde está muito negligenciada e meu corpo cobra atenção imediata.',
      'Tenho hábitos que drenam energia e quase nenhuma rotina de cuidado.',
      'Tento melhorar movimento, sono ou alimentação, mas ainda sou bastante inconsistente.',
      'Começo a criar uma base de cuidados físicos que consigo repetir.',
      'Tenho energia razoável e uma rotina funcional de movimento, sono e alimentação.',
      'Minha saúde sustenta bem minha vida e recebe atenção na maior parte das semanas.',
      'Conheço os sinais do meu corpo e ajusto meus hábitos com maturidade.',
      'Tenho força, disposição e recuperação para enfrentar desafios físicos relevantes.',
      'Minha saúde é sólida, equilibrada e inspira confiança no longo prazo.',
      'Corpo, energia e cuidado formam uma base excepcional, sustentável e integrada.',
    ],
    widget: {
      id: 'widget_saude',
      label: 'Momento físico',
      options: ['Não definido', 'Em recuperação', 'Retomando', 'Ativo', 'Em forma', 'Atlético', 'Outro'],
    },
  },
] as const;

export const LIFE_AREA_BY_ID = Object.fromEntries(
  LIFE_AREAS.map((area) => [area.id, area]),
) as Record<LifeAreaId, LifeAreaDefinition>;

export const isLifeAreaId = (value: string): value is LifeAreaId =>
  LIFE_AREA_IDS.includes(value as LifeAreaId);

export const normalizeLifeAreaId = (value: string | null | undefined): LifeAreaId | 'geral' => {
  const rawId = String(value || '').trim();
  const id = rawId === 'espacoMental' ? 'espaco-mental' : rawId.toLowerCase();
  if (id === 'geral') return 'geral';
  if (isLifeAreaId(id)) return id;
  if (['consciencia', 'espiritualidade', 'espaco-mental', 'espaco_mental'].includes(id)) return 'proposito';
  if (['conexoes', 'conexao'].includes(id)) return 'relacoes';
  if (['projetos', 'financas'].includes(id)) return 'trabalho';
  if (['hobbies', 'bem-estar', 'bem_estar'].includes(id)) return 'lazer';
  if (['fisico', 'corpo'].includes(id)) return 'saude';
  return 'geral';
};

export const normalizeLifeAreaRecord = <T>(
  value?: Partial<Record<string, T>> | null,
): Partial<Record<LifeAreaId | 'geral', T>> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const result: Partial<Record<LifeAreaId | 'geral', T>> = {};

  // Canonical keys win when a profile contains both old and new data.
  [...LIFE_AREA_IDS, 'geral' as const].forEach((id) => {
    if (Object.prototype.hasOwnProperty.call(value, id)) {
      result[id] = value[id] as T;
    }
  });

  Object.entries(value).forEach(([id, entryValue]) => {
    const normalizedId = normalizeLifeAreaId(id);
    if (!Object.prototype.hasOwnProperty.call(result, normalizedId)) {
      result[normalizedId] = entryValue as T;
    }
  });

  return result;
};

export const normalizeLifeAreaIdList = (value: unknown): LifeAreaId[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(
    value
      .map((id) => normalizeLifeAreaId(String(id)))
      .filter((id): id is LifeAreaId => id !== 'geral'),
  ));
};

type PersistedAssetLevel = {
  asset_id?: string | null;
  assetId?: string | null;
  level?: unknown;
};

export const collapseLifeAreaLevels = (
  rows: readonly PersistedAssetLevel[] | null | undefined,
): Partial<Record<LifeAreaId, number>> => {
  const buckets = new Map<LifeAreaId, number[]>();

  (rows || []).forEach((row) => {
    const normalizedId = normalizeLifeAreaId(row.asset_id ?? row.assetId);
    if (normalizedId === 'geral') return;
    const level = Number(row.level);
    if (!Number.isFinite(level)) return;
    const bucket = buckets.get(normalizedId) || [];
    bucket.push(Math.min(MASTERY_AREA_MAX_LEVEL, Math.max(1, Math.round(level))));
    buckets.set(normalizedId, bucket);
  });

  return Object.fromEntries(
    Array.from(buckets.entries()).map(([id, levels]) => [
      id,
      Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length),
    ]),
  ) as Partial<Record<LifeAreaId, number>>;
};
