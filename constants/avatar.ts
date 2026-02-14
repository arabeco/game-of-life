import { SovereignConfig } from '../types';

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
    { id: 'none', name: 'Nenhum', url: '' },
    { id: 'anime', name: 'Anime', url: `${AVATAR_BASE_URL}/hair-bangsmale.png` },
    { id: 'mullet', name: 'Mullet', url: `${AVATAR_BASE_URL}/hair-mullet (2).png` },
    { id: 'parted', name: 'Dividido', url: `${AVATAR_BASE_URL}/hair-bangs.png` },
    { id: 'blunt_bangs', name: 'Franja Reta', url: `${AVATAR_BASE_URL}/hair-bangs.png` },
    { id: 'short_dreads', name: 'Dread Curto', url: `${AVATAR_BASE_URL}/hair-dreads.png` },
    { id: 'princess', name: 'Princesa', url: `${AVATAR_BASE_URL}/hair-princess.png` },
    { id: 'ponytail', name: 'Rabo de Cavalo', url: `${AVATAR_BASE_URL}/hair-ponytail.png` },
  ],
  outfits: [
    { id: 'none', name: 'Nenhuma', url: '' },
    { id: 'soccer', name: 'Futebol', url: `${AVATAR_BASE_URL}/clothe-soccerkit1.png` },
    { id: 'jeans_hoodie', name: 'Jeans e Moletom', url: `${AVATAR_BASE_URL}/clothe-jeanshoodie.png` },
    { id: 'social', name: 'Social', url: `${AVATAR_BASE_URL}/clothe-executive.png` },
    { id: 'cyberpunk', name: 'Cyberpunk', url: `${AVATAR_BASE_URL}/clothe-cyber.png` },
    { id: 'school', name: 'Escolar', url: `${AVATAR_BASE_URL}/clothe-japan.png` },
    { id: 'lab_coat', name: 'Jaleco', url: `${AVATAR_BASE_URL}/clothe-lab.png` },
    { id: 'gym', name: 'Academia', url: `${AVATAR_BASE_URL}/clothe-gymfem.png` },
    { id: 'silver_armor', name: 'Armadura de Prata', url: `${AVATAR_BASE_URL}/clothe-silverarmor.png` },
    { id: 'gold_armor', name: 'Armadura de Ouro', url: `${AVATAR_BASE_URL}/clothe-goldarmor.png` },
  ],
  head_under_items: [
    { id: 'none', name: 'Nenhum', url: '' },
    { id: 'glasses', name: 'Óculos de Grau', url: `${AVATAR_BASE_URL}/acces-glass1.png` },
    { id: 'aviators', name: 'Óculos Aviador', url: `${AVATAR_BASE_URL}/acce-glassaviator.png` },
    { id: 'mask', name: 'Máscara', url: `${AVATAR_BASE_URL}/acce-mask.png` },
    { id: 'eyepatch', name: 'Tapa-olho', url: `${AVATAR_BASE_URL}/image-removebg-preview (27).png` },
  ],
  helmets: [
    { id: 'none', name: 'Nenhum', url: '' },
    { id: 'gold_helm', name: 'Elmo de Ouro', url: `${AVATAR_BASE_URL}/head-goldhelm.png` },
    { id: 'silver_helm', name: 'Elmo de Prata', url: `${AVATAR_BASE_URL}/head-silverhelm.png` },
  ],
  head_over_items: [
    { id: 'none', name: 'Nenhum', url: '' },
    { id: 'wizard_hat', name: 'Chapéu de Mago', url: `${AVATAR_BASE_URL}/head-hatwizard.png` },
    { id: 'cap', name: 'Boné', url: `${AVATAR_BASE_URL}/head-cap.png` },
    { id: 'crown', name: 'Coroa', url: `${AVATAR_BASE_URL}/head-goldcrown.png` },
  ],
  artifacts: [
    { id: 'none', name: 'Nenhum', url: '' },
    { id: 'silver_bow', name: 'Arco de Prata', url: `${AVATAR_BASE_URL}/item-silverbow.png` },
    { id: 'silver_staff', name: 'Cajado de Prata', url: `${AVATAR_BASE_URL}/item-silverscepter.png` },
    { id: 'magic_book', name: 'Livro de Magia', url: `${AVATAR_BASE_URL}/item-bookofmagic.png` },
    { id: 'katana', name: 'Katana', url: `${AVATAR_BASE_URL}/item-swordkatana.png` },
    { id: 'iron_shield', name: 'Escudo de Ferro', url: `${AVATAR_BASE_URL}/item-silvershield.png` },
  ],
};
