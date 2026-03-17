import { ACTIVE_SEASON_ID, ERA_CALENDAR, SEASON_ARCHIVE_LOG, SEASON_ORDER, SEASONS, type SeasonConfig } from '../constants/seasonContent';
import { Season } from '../types';

const ROOT_IMAGES_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images';
const GENESIS_SEASON_IDS = new Set(['season-genesis-0', 'season_0']);

export const GENESIS_SEASON_IMAGE_URL = `${ROOT_IMAGES_URL}/season_genesis.jpg`;

type SeasonLike = Pick<Season, 'id' | 'name' | 'background_png_url' | 'lore_text'> | null | undefined;

const normalizeSeasonLabel = (value: string | null | undefined): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const isGenesisLabel = (value: string | null | undefined): boolean => normalizeSeasonLabel(value).includes('genesis');

export const isGenesisSeason = (season: SeasonLike): boolean => {
  const config = season?.id ? SEASONS[season.id] : undefined;

  if (season?.id && GENESIS_SEASON_IDS.has(season.id)) {
    return true;
  }

  return isGenesisLabel(season?.name) || isGenesisLabel(config?.name) || isGenesisLabel(config?.theme);
};

export const getSeasonConfigById = (seasonId?: string | null): SeasonConfig | null => {
  if (!seasonId) return null;
  return SEASONS[seasonId] || null;
};

export const getNextSeasonConfig = (seasonId?: string | null): SeasonConfig | null => {
  if (!seasonId) return null;

  const currentIndex = SEASON_ORDER.findIndex((id) => id === seasonId);
  if (currentIndex < 0) return null;

  const nextSeasonId = SEASON_ORDER[currentIndex + 1];
  if (!nextSeasonId) return null;

  return SEASONS[nextSeasonId] || null;
};

export const resolveSeasonBackgroundUrl = (season: SeasonLike): string => {
  if (isGenesisSeason(season)) {
    return GENESIS_SEASON_IMAGE_URL;
  }

  const directBackground = season?.background_png_url?.trim();
  if (directBackground) return directBackground;

  const config = season?.id ? SEASONS[season.id] : undefined;
  return (config?.backgroundUrl || '').trim();
};

export const resolveSeasonLoreText = (season: SeasonLike): string => {
  const directLore = season?.lore_text?.trim();
  if (directLore) return directLore;

  const config = season?.id ? SEASONS[season.id] : undefined;
  return (config?.description || '').trim();
};

export const resolveSeasonArchiveLogEntry = (season: SeasonLike) => {
  if (!season?.id) return null;

  const fromConfig = SEASONS[season.id]?.archiveLog;
  if (fromConfig) return fromConfig;

  return SEASON_ARCHIVE_LOG.find((entry) => entry.seasonId === season.id) || null;
};

export const getEraCalendarYears = () => ERA_CALENDAR;

export const getSeasonLaunchRewardFlag = (seasonId: string): string => `__flag_season_launch_reward_${seasonId}`;

export const getSeasonLaunchToastStorageKey = (seasonId: string): string => `glyph:season-launch-toast:${seasonId}`;

export const buildSeasonFromConfig = (season: SeasonConfig, isActive = false): Season => ({
  id: season.id,
  name: season.name,
  start_date: season.startDate,
  end_date: season.endDate,
  background_png_url: season.backgroundUrl || '',
  lore_text: season.description || '',
  is_active: isActive,
});

export const resolveRuntimeActiveSeason = (seasons: Season[]): Season | null => {
  const activeSeason = seasons.find((season) => season.is_active);
  if (activeSeason) return activeSeason;

  const fallbackSeason = SEASONS[ACTIVE_SEASON_ID];
  if (!fallbackSeason) return null;

  return buildSeasonFromConfig(fallbackSeason, true);
};
