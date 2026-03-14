import { SEASONS } from '../constants/seasonContent';
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
