import { FRASES_DOS_DEGRAUS, NOMES_DOS_DEGRAUS } from '../supabase/functions/_shared/maestria-degraus.ts';

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

/**
 * A AREA CONTA DE 1 A 10, e e so isso que ela conta.
 *
 * Houve uma versao em que cada degrau valia dois na tela, para as cinco pontas
 * do pentagono somarem os 100 do Indice sem ninguem multiplicar nada. A conta
 * fechava e o numero soava falso: "estou no nivel 20 em Saude" e inflacao — o
 * degrau que a pessoa escolhe continua sendo um entre dez, e dobrar so na
 * exibicao inventava um numero que nao existe em lugar nenhum do modelo.
 *
 * O pentagono passa a somar 50 com o centro dizendo 100, e tudo bem: sao duas
 * grandezas, o nivel de UMA area e o indice do CONJUNTO. O Indice continua sendo
 * a soma dobrada, em MASTERY_INDEX_MULTIPLIER — aquele dois fica.
 */
export const PONTOS_POR_DEGRAU = 1;

/**
 * O NIVEL DE UMA AREA, do jeito que a pessoa ve.
 *
 * Hoje devolve o proprio degrau, e continua valendo a pena existir: e o ponto
 * unico por onde toda tela de area passa. Foi a falta dele que deixou o orbe do
 * ativo, a ficha, o pentagono e a previa do perfil mostrando numeros diferentes
 * para o mesmo nivel — e foi ele que permitiu trocar a escala inteira mexendo
 * em uma linha, quando o 0 a 20 se mostrou inflado.
 */
export const getAreaDisplayLevel = (level: number | null | undefined): number =>
  Math.max(0, Math.round(Number(level || 0))) * PONTOS_POR_DEGRAU;

/**
 * O NOME DE CADA DEGRAU.
 *
 * A ficha da area mostrava a frase do nivel sem mostrar o nivel: um paragrafo
 * solto, sem numero e sem titulo, que a pessoa nao sabia de onde tinha vindo.
 * A frase descreve o estado; o nome DA nome a ele — e e o nome que cabe num
 * cartao, numa conversa e num print.
 *
 * A escada e a mesma para as cinco areas de proposito: "nivel 7" precisa
 * significar a mesma coisa em Saude e em Trabalho, senao o pentagono compara
 * coisas diferentes. Os nomes acompanham as frases de constants/lifeAreas:
 * os primeiros degraus sao ausencia, os do meio sao repeticao, os ultimos sao
 * integracao.
 *
 * O ZERO E O ABANDONO, e nao um "1 mais fraco". O degrau 1 ja descrevia alguem
 * em crise — mas alguem que ENCARA a crise. O zero e de quem parou de encarar:
 * nao pergunta, nao tenta, nao olha. E a distincao que faz a escada comecar do
 * chao de verdade, e e o que permite o Indice ter piso em 50 redondo.
 */
export const MASTERY_LEVEL_NAMES = NOMES_DOS_DEGRAUS;

export const getMasteryLevelName = (level: number | null | undefined): string => {
  // O nome esta na posicao do proprio degrau: o zero e o primeiro da lista.
  const index = Math.min(MASTERY_AREA_MAX_LEVEL, Math.max(0, Math.round(Number(level || 0))));
  return MASTERY_LEVEL_NAMES[index] || MASTERY_LEVEL_NAMES[0];
};
export const MASTERY_RAW_TOTAL_MAX_LEVEL = 50;
export const MASTERY_TOTAL_MAX_LEVEL = 100;

/**
 * O NIVEL E O DOBRO DA MAESTRIA, E AS DUAS APARECEM JUNTAS.
 *
 * Esta versao ja existiu e foi trocada por `50 + soma`, porque o pentagono
 * somava 50 enquanto o numero do meio dizia 100 — duas escalas no mesmo
 * desenho, sem nada na tela dizendo que eram duas. Dali saiu o cabecalho
 * mostrando 72 e a placa do legado mostrando 36 para a mesma pessoa.
 *
 * O dobro volta com o conserto junto: o pentagono passa a escrever os DOIS, o
 * nivel em cima e a maestria `x/50` embaixo. O que quebrou da primeira vez nao
 * foi a multiplicacao — foi ela ser invisivel. Declarada, 46 e 23 deixam de
 * parecer contradicao e viram o que sao: duas medidas do mesmo esforco.
 *
 * E nao ha mais piso. O nivel comeca em 0 e vai a 100, e os 100 sao inteiros
 * conquistados.
 */
export const MASTERY_INDEX_MULTIPLIER = 2;

/**
 * Zero, e mantido por nome.
 *
 * O anel interno do pentagono nasceu quando o Indice comecava em 50: ele
 * desenhava o piso que ninguem precisava conquistar. Sem piso o anel e zero, e
 * a constante fica para que o desenho continue dizendo de onde tira esse valor
 * em vez de carregar um zero solto no meio da conta.
 */
export const MASTERY_INDEX_BASE = 0;

export const toMasteryIndex = (rawTotal: number): number =>
  Math.min(
    MASTERY_TOTAL_MAX_LEVEL,
    Math.max(0, Math.round(rawTotal * MASTERY_INDEX_MULTIPLIER)),
  );

// Cada degrau de area vale DOIS pontos no Indice, que vai de 0 a 100.
// Area sem nivel conta como 0 - o abandono e um degrau de verdade, nao ausencia
// de dado. Toda tela que mostra o indice usa uma destas: ninguem recalcula.
const sumAreaLevels = (levels: readonly (number | null | undefined)[]): number =>
  levels.reduce<number>((sum, level) => sum + Math.max(0, Number(level || 0)), 0);

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
  toMasteryIndex(Math.max(0, Number(rawLevel || 0)));

/**
 * O nivel de OUTRA pessoa, como texto (27/10/2026, com o Afonso): quem nunca
 * avaliou a maestria nao esta no nivel 0 — nao tem nivel. Aparece um traco, e
 * a bolinha do avatar nem aparece.
 */
export const temNivel = (rawLevel: number | null | undefined): boolean => Number(rawLevel) > 0;
export const nivelOuTraco = (rawLevel: number | null | undefined): number | string =>
  temNivel(rawLevel) ? getDisplayLevel(rawLevel) : '—';

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
    levelDescriptions: FRASES_DOS_DEGRAUS.proposito,
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
    levelDescriptions: FRASES_DOS_DEGRAUS.relacoes,
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
    levelDescriptions: FRASES_DOS_DEGRAUS.trabalho,
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
    levelDescriptions: FRASES_DOS_DEGRAUS.lazer,
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
    levelDescriptions: FRASES_DOS_DEGRAUS.saude,
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
    bucket.push(Math.min(MASTERY_AREA_MAX_LEVEL, Math.max(0, Math.round(level))));
    buckets.set(normalizedId, bucket);
  });

  return Object.fromEntries(
    Array.from(buckets.entries()).map(([id, levels]) => [
      id,
      Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length),
    ]),
  ) as Partial<Record<LifeAreaId, number>>;
};
