import { LevelUnlocks, SovereignConfig, ItemRarity } from '../types';

// A paleta de cores para tons de pele
export const SKIN_TONES = [
  '#FBE5D5', '#F3C7AC', '#E2A984', '#C68642', '#8D5524', '#613817',
] as const;

// A paleta de cores para cabelos
export const HAIR_COLORS = [
  '#2C1608', '#583317', '#A76936', '#B8860B', '#F8DE7E', '#FFFFFF', '#6F6F6F', '#E54339', '#2E6A8A', '#7D2E8A',
] as const;

const AVATAR_BASE_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars';

export const BODY_STYLES = [
  { id: 'male_base', name: 'Masculino Padrão', url: `${AVATAR_BASE_URL}/body-male.png` },
  { id: 'female_base', name: 'Feminino Padrão', url: `${AVATAR_BASE_URL}/body-fem.png` },
];

export const FACE_FEATURES_URL = `${AVATAR_BASE_URL}/face-eyemouth.png`;

export const DEFAULT_SOVEREIGN_CONFIG: SovereignConfig = {
    body: 'male_base',
    skinTone: '#E2A984',
    hairStyle: 'none',
    hairColor: '#2C1608',
    outfit: 'none',
    head_under: 'none', // mascara, oculos, tapa-olho
    helmet: 'none', // elmos
    head_over: 'none', // coroa, boné, chapéu
    artifact: 'none'
};

// Definições de assets
export const SOVEREIGN_ASSETS = {
  bodyStyles: BODY_STYLES,
  skinTones: SKIN_TONES,
  hairColors: HAIR_COLORS,
  hairStyles: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    { id: 'anime', name: 'Anime', url: `${AVATAR_BASE_URL}/hair-bangsmale.png`, rarity: 'uncommon' as ItemRarity },
    { id: 'mullet', name: 'Mullet', url: `${AVATAR_BASE_URL}/hair-mullet (2).png`, rarity: 'rare' as ItemRarity },
    { id: 'parted', name: 'Dividido', url: `${AVATAR_BASE_URL}/hair-bangs.png`, rarity: 'common' as ItemRarity },
    { id: 'blunt_bangs', name: 'Franja Reta', url: `${AVATAR_BASE_URL}/hair-bangs.png`, rarity: 'common' as ItemRarity },
    { id: 'short_dreads', name: 'Dread Curto', url: `${AVATAR_BASE_URL}/hair-dreads.png`, rarity: 'common' as ItemRarity },
    { id: 'princess', name: 'Princesa', url: `${AVATAR_BASE_URL}/hair-princess.png`, rarity: 'epic' as ItemRarity },
    { id: 'ponytail', name: 'Rabo de Cavalo', url: `${AVATAR_BASE_URL}/hair-ponytail.png`, rarity: 'common' as ItemRarity },
  ],
  outfits: [
    { id: 'none', name: 'Nenhuma', url: '', rarity: 'common' as ItemRarity },
    { id: 'soccer', name: 'Futebol', url: `${AVATAR_BASE_URL}/clothe-soccerkit1.png`, rarity: 'uncommon' as ItemRarity },
    { id: 'jeans_hoodie', name: 'Jeans e Moletom', url: `${AVATAR_BASE_URL}/clothe-jeanshoodie.png`, rarity: 'common' as ItemRarity },
    { id: 'social', name: 'Social', url: `${AVATAR_BASE_URL}/clothe-executive.png`, rarity: 'uncommon' as ItemRarity },
    { id: 'cyberpunk', name: 'Cyberpunk', url: `${AVATAR_BASE_URL}/clothe-cyber.png`, rarity: 'epic' as ItemRarity },
    { id: 'school', name: 'Escolar', url: `${AVATAR_BASE_URL}/clothe-japan.png`, rarity: 'common' as ItemRarity },
    { id: 'lab_coat', name: 'Jaleco', url: `${AVATAR_BASE_URL}/clothe-lab.png`, rarity: 'rare' as ItemRarity },
    { id: 'gym', name: 'Academia', url: `${AVATAR_BASE_URL}/clothe-gymfem.png`, rarity: 'uncommon' as ItemRarity },
    { id: 'silver_armor', name: 'Armadura de Prata', url: `${AVATAR_BASE_URL}/clothe-silverarmor.png`, rarity: 'rare' as ItemRarity },
    { id: 'gold_armor', name: 'Armadura de Ouro', url: `${AVATAR_BASE_URL}/clothe-goldarmor.png`, rarity: 'epic' as ItemRarity },
  ],
  head_under_items: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    { id: 'glasses', name: 'Óculos de Grau', url: `${AVATAR_BASE_URL}/acces-glass1.png`, rarity: 'common' as ItemRarity },
    { id: 'aviators', name: 'Óculos Aviador', url: `${AVATAR_BASE_URL}/acce-glassaviator.png`, rarity: 'uncommon' as ItemRarity },
    { id: 'mask', name: 'Máscara', url: `${AVATAR_BASE_URL}/acce-mask.png`, rarity: 'rare' as ItemRarity },
    { id: 'eyepatch', name: 'Tapa-olho', url: `${AVATAR_BASE_URL}/image-removebg-preview (27).png`, rarity: 'rare' as ItemRarity },
  ],
  helmets: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    { id: 'gold_helm', name: 'Elmo de Ouro', url: `${AVATAR_BASE_URL}/head-goldhelm.png`, rarity: 'epic' as ItemRarity },
    { id: 'silver_helm', name: 'Elmo de Prata', url: `${AVATAR_BASE_URL}/head-silverhelm.png`, rarity: 'rare' as ItemRarity },
  ],
  head_over_items: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    { id: 'wizard_hat', name: 'Chapéu de Mago', url: `${AVATAR_BASE_URL}/head-hatwizard.png`, rarity: 'epic' as ItemRarity },
    { id: 'cap', name: 'Boné', url: `${AVATAR_BASE_URL}/head-cap.png`, rarity: 'common' as ItemRarity },
    { id: 'crown', name: 'Coroa', url: `${AVATAR_BASE_URL}/head-goldcrown.png`, rarity: 'legendary' as ItemRarity },
  ],
  artifacts: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    { id: 'silver_bow', name: 'Arco de Prata', url: `${AVATAR_BASE_URL}/item-silverbow.png`, rarity: 'rare' as ItemRarity },
    { id: 'silver_staff', name: 'Cajado de Prata', url: `${AVATAR_BASE_URL}/item-silverscepter.png`, rarity: 'rare' as ItemRarity },
    { id: 'magic_book', name: 'Livro de Magia', url: `${AVATAR_BASE_URL}/item-bookofmagic.png`, rarity: 'epic' as ItemRarity },
    { id: 'katana', name: 'Katana', url: `${AVATAR_BASE_URL}/item-swordkatana.png`, rarity: 'rare' as ItemRarity },
    { id: 'iron_shield', name: 'Escudo de Ferro', url: `${AVATAR_BASE_URL}/item-silvershield.png`, rarity: 'uncommon' as ItemRarity },
  ],
};

const buildUnlockMap = (items: { id: string }[]) => items.reduce((acc, item) => ({ ...acc, [item.id]: 1 }), {} as Record<string, number>);

export const buildDefaultLevelUnlocks = (): LevelUnlocks => ({
  bodyStyles: buildUnlockMap(SOVEREIGN_ASSETS.bodyStyles),
  hairStyles: buildUnlockMap(SOVEREIGN_ASSETS.hairStyles),
  outfits: buildUnlockMap(SOVEREIGN_ASSETS.outfits),
  head_under_items: buildUnlockMap(SOVEREIGN_ASSETS.head_under_items),
  helmets: buildUnlockMap(SOVEREIGN_ASSETS.helmets),
  head_over_items: buildUnlockMap(SOVEREIGN_ASSETS.head_over_items),
  artifacts: buildUnlockMap(SOVEREIGN_ASSETS.artifacts),
});
