export const CATALOG_ASSET_ROOT = '/assets/catalog';
export const CATALOG_AVATAR_ROOT = `${CATALOG_ASSET_ROOT}/avatars`;
export const CATALOG_GLYPH_ROOT = `${CATALOG_AVATAR_ROOT}/glyphs`;
export const CATALOG_INTERFACE_ROOT = `${CATALOG_ASSET_ROOT}/interface`;

const LEGACY_CATALOG_ROOT = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/';
const ROOT_THEME_FILES = new Set([
  'basic.png',
  'gold.png',
  'frost.png',
  'ember.png',
  'cyber.jpg',
  'aurora.png',
  'void.png',
  'genesis.png',
]);

const isFixedCatalogPath = (relativePath: string): boolean => (
  relativePath.startsWith('interface/')
  || relativePath.startsWith('avatars/glyphs/')
  || relativePath.startsWith('avatars/hair/CABELO_')
  || relativePath.startsWith('avatars/body_')
  || relativePath.startsWith('avatars/SKIN_')
  || relativePath.startsWith('avatars/ARTEFATO_')
  || relativePath.startsWith('avatars/artefato_')
  || relativePath.startsWith('avatars/JARDIM_')
  || ROOT_THEME_FILES.has(relativePath)
);

export const resolveCatalogAssetUrl = (value?: string | null): string => {
  const normalized = value?.trim() || '';
  if (!normalized.startsWith(LEGACY_CATALOG_ROOT)) return normalized;

  const relativePath = decodeURIComponent(normalized.slice(LEGACY_CATALOG_ROOT.length));
  return isFixedCatalogPath(relativePath)
    ? `${CATALOG_ASSET_ROOT}/${relativePath}`
    : normalized;
};
