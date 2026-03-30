import { Arena, Campaign, RelationshipLinkType, UserCodex } from '../types';

export type ContentVisualFamily = 'normal' | 'season' | 'store' | 'shared';

export type ContentVisualPalette = {
  family: ContentVisualFamily;
  accent: string;
  border: string;
  glow: string;
  cardBackground: string;
  listBackground: string;
  stackBackground: string;
  footerBackground: string;
  chipBackground: string;
  chipBorder: string;
  chipText: string;
};

const normalizeToken = (value?: string | null) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const isSharedCodex = (codex?: Partial<UserCodex> | null) =>
  Boolean(codex?.mentor_relationship_link_id)
  || codex?.source_type === 'gift_in_app'
  || codex?.source_type === 'gift_link';

const isStoreCodex = (codex?: Partial<UserCodex> | null) =>
  codex?.source_type === 'catalog' || Boolean(codex?.catalog_id);

const isSeasonArenaLike = (arena?: Pick<Arena, 'name'> | null) => {
  const normalizedName = normalizeToken(arena?.name);
  return normalizedName.includes('quests - season')
    || normalizedName.includes('quest temporada')
    || normalizedName.includes('season quest');
};

const isSeasonCampaignLike = (
  campaign?: Pick<Campaign, 'title'> | null,
  arenas: Array<Pick<Arena, 'name'> | null | undefined> = [],
) => {
  if (arenas.some((arena) => isSeasonArenaLike(arena || null))) {
    return true;
  }

  const normalizedTitle = normalizeToken(campaign?.title);
  return normalizedTitle.includes('quest temporada') || normalizedTitle.includes('season');
};

const CONTENT_VISUAL_PALETTES: Record<ContentVisualFamily, ContentVisualPalette> = {
  normal: {
    family: 'normal',
    accent: '#d7e0ed',
    border: 'rgba(221, 230, 242, 0.24)',
    glow: 'rgba(174, 184, 198, 0.18)',
    cardBackground: 'radial-gradient(circle at top, rgba(255,255,255,0.24), transparent 34%), linear-gradient(160deg, rgba(231,237,246,0.96) 0%, rgba(186,196,210,0.93) 26%, rgba(82,88,101,0.95) 58%, rgba(16,18,23,0.99) 100%)',
    listBackground: 'linear-gradient(180deg, rgba(223,231,242,0.14), rgba(14,16,20,0.42) 100%)',
    stackBackground: 'linear-gradient(180deg, rgba(215,223,236,0.24), rgba(14,16,19,0.22) 60%, rgba(9,10,13,0.18) 100%)',
    footerBackground: 'linear-gradient(180deg, rgba(26,29,35,0.82), rgba(9,11,14,0.94) 100%)',
    chipBackground: 'rgba(225, 233, 245, 0.12)',
    chipBorder: 'rgba(225, 233, 245, 0.14)',
    chipText: '#edf2fb',
  },
  season: {
    family: 'season',
    accent: '#b476ff',
    border: 'rgba(186, 123, 255, 0.28)',
    glow: 'rgba(142, 74, 255, 0.22)',
    cardBackground: 'radial-gradient(circle at top, rgba(223,196,255,0.18), transparent 36%), linear-gradient(160deg, rgba(88,56,136,0.96) 0%, rgba(73,40,117,0.93) 24%, rgba(43,22,72,0.96) 58%, rgba(13,8,24,0.99) 100%)',
    listBackground: 'linear-gradient(180deg, rgba(165,120,255,0.16), rgba(16,10,28,0.44) 100%)',
    stackBackground: 'linear-gradient(180deg, rgba(154,92,255,0.26), rgba(37,20,72,0.22) 58%, rgba(13,10,22,0.18) 100%)',
    footerBackground: 'linear-gradient(180deg, rgba(42,20,74,0.82), rgba(12,8,20,0.94) 100%)',
    chipBackground: 'rgba(181, 120, 255, 0.14)',
    chipBorder: 'rgba(181, 120, 255, 0.2)',
    chipText: '#ecd9ff',
  },
  store: {
    family: 'store',
    accent: '#f1c15f',
    border: 'rgba(241, 193, 95, 0.28)',
    glow: 'rgba(217, 146, 42, 0.22)',
    cardBackground: 'radial-gradient(circle at top, rgba(255,233,184,0.18), transparent 34%), linear-gradient(160deg, rgba(108,77,28,0.96) 0%, rgba(88,58,20,0.93) 24%, rgba(59,36,14,0.96) 58%, rgba(16,11,8,0.99) 100%)',
    listBackground: 'linear-gradient(180deg, rgba(236,182,77,0.14), rgba(20,14,8,0.44) 100%)',
    stackBackground: 'linear-gradient(180deg, rgba(241,193,95,0.22), rgba(75,48,16,0.22) 58%, rgba(16,11,8,0.18) 100%)',
    footerBackground: 'linear-gradient(180deg, rgba(62,40,17,0.82), rgba(16,11,8,0.94) 100%)',
    chipBackground: 'rgba(241, 193, 95, 0.14)',
    chipBorder: 'rgba(241, 193, 95, 0.2)',
    chipText: '#fff1cf',
  },
  shared: {
    family: 'shared',
    accent: '#67d9d3',
    border: 'rgba(103, 217, 211, 0.28)',
    glow: 'rgba(63, 194, 186, 0.22)',
    cardBackground: 'radial-gradient(circle at top, rgba(201,255,250,0.16), transparent 36%), linear-gradient(160deg, rgba(55,102,110,0.96) 0%, rgba(36,81,91,0.94) 26%, rgba(18,47,56,0.96) 58%, rgba(8,14,18,0.99) 100%)',
    listBackground: 'linear-gradient(180deg, rgba(103,217,211,0.15), rgba(8,17,20,0.44) 100%)',
    stackBackground: 'linear-gradient(180deg, rgba(103,217,211,0.22), rgba(24,65,70,0.22) 58%, rgba(8,14,18,0.18) 100%)',
    footerBackground: 'linear-gradient(180deg, rgba(18,53,58,0.82), rgba(8,14,18,0.94) 100%)',
    chipBackground: 'rgba(103, 217, 211, 0.14)',
    chipBorder: 'rgba(103, 217, 211, 0.2)',
    chipText: '#d7fffb',
  },
};

export const getContentVisualPalette = (family: ContentVisualFamily): ContentVisualPalette =>
  CONTENT_VISUAL_PALETTES[family];

export const resolveArenaVisualFamily = ({
  arena,
  relationshipLinkType = null,
  sourceCodex = null,
}: {
  arena?: Pick<Arena, 'name'> | null;
  relationshipLinkType?: RelationshipLinkType | null;
  sourceCodex?: Partial<UserCodex> | null;
}): ContentVisualFamily => {
  if (relationshipLinkType) return 'shared';
  if (isSharedCodex(sourceCodex)) return 'shared';
  if (isSeasonArenaLike(arena || null)) return 'season';
  if (isStoreCodex(sourceCodex)) return 'store';
  return 'normal';
};

export const resolveCampaignVisualFamily = ({
  campaign = null,
  arenas = [],
  relationshipLinkType = null,
  sourceCodex = null,
}: {
  campaign?: Pick<Campaign, 'title'> | null;
  arenas?: Array<Pick<Arena, 'name'> | null | undefined>;
  relationshipLinkType?: RelationshipLinkType | null;
  sourceCodex?: Partial<UserCodex> | null;
}): ContentVisualFamily => {
  if (relationshipLinkType) return 'shared';
  if (isSharedCodex(sourceCodex)) return 'shared';
  if (isSeasonCampaignLike(campaign, arenas)) return 'season';
  if (isStoreCodex(sourceCodex)) return 'store';
  return 'normal';
};
