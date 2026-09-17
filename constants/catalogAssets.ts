export const CATALOG_ASSET_ROOT = '/assets/catalog';
export const CATALOG_AVATAR_ROOT = `${CATALOG_ASSET_ROOT}/avatars`;
export const CATALOG_GLYPH_ROOT = `${CATALOG_AVATAR_ROOT}/glyphs`;
export const CATALOG_INTERFACE_ROOT = `${CATALOG_ASSET_ROOT}/interface`;

/**
 * Os videos de celebracao, empacotados com o app.
 *
 * Vinham do bucket, montados com `${VITE_SUPABASE_URL}/storage/v1/...` em tres
 * componentes diferentes. Sao conteudo fixo — o mesmo arquivo para todo mundo —
 * e o endpoint publico serve tudo com `max-age=3600`, que nao da para alongar
 * pelo metadata do objeto. Uma hora de cache para um video que nunca muda
 * significa rebaixar 2 MB por subida de nivel, indefinidamente.
 *
 * O caminho monta aqui, e nao em cada componente, porque a URL montada com a
 * variavel de ambiente nao contem "supabase.co" — e foi assim que estes tres
 * escaparam do tests/egress-estatico.regression.mjs na primeira versao dele.
 */
export const videoAsset = (nome: string): string => `/videos/${nome}`;

/**
 * A arte do bau fechado, pelo tipo.
 *
 * O tipo tem oito valores — Comum, Incomum, Raro, Epico, Lendario, Season,
 * Ciclo e Skin Comum — e a arte tem cinco. O agrupamento veio do
 * ChestOpeningModal, que agrupava os mesmos oito tipos em cinco videos. Aquele
 * componente foi removido — nao era importado por ninguem, entao os cinco mp4
 * nunca rodaram — mas o agrupamento continua sendo o certo: Raro e Ciclo sao a
 * mesma coisa para quem olha, e Skin Comum e uma variante de Comum.
 *
 * Cuidado com a ordem das checagens: 'Skin Comum' contem "comum" e 'Incomum'
 * tambem, entao os dois casos especificos vem antes.
 */
const ARTE_DO_BAU: Array<[RegExp, string]> = [
    [/skin/, 'bau_comum.webp'],
    [/incomum/, 'bau_incomum.webp'],
    [/lendario|legendary/, 'bau_lendario.webp'],
    [/epico/, 'bau_epico.webp'],
    [/season/, 'bau_mitico.webp'],
    [/raro|radiante|ciclo/, 'bau_raro.webp'],
];

export const getChestArtUrl = (tipo?: string | null): string => {
    const normalizado = String(tipo || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const achado = ARTE_DO_BAU.find(([padrao]) => padrao.test(normalizado));
    return `${CATALOG_INTERFACE_ROOT}/${achado ? achado[1] : 'bau_comum.webp'}`;
};

const LEGACY_CATALOG_ROOT = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/';
const ROOT_THEME_FILES = new Set([
  'basic.png',
  'gold.png',
  'frost.png',
  'ember.png',
  'cyber.jpg',
  'aurora.png',
  // O orbe da temporada Aurora I. Nao substitui aurora.png: aquele e o tema
  // pago "Aurora Boreal", este e a quinta peca da colecao.
  'aurora_i.png',
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
