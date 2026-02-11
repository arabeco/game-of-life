import { SovereignConfig } from '../types';

// A paleta de cores para tons de pele
export const SKIN_TONES = [
  '#FBE5D5', '#F3C7AC', '#E2A984', '#C68642', '#8D5524', '#613817',
] as const;

// A paleta de cores para cabelos
export const HAIR_COLORS = [
  '#2C1608', '#583317', '#A76936', '#B8860B', '#F8DE7E', '#FFFFFF', '#6F6F6F', '#E54339', '#2E6A8A', '#7D2E8A',
] as const;

export const BODY_STYLES = [
  { id: 'male_base', name: 'Masculino Padrão', url: 'https://i.imgur.com/cNiQUKd.png' },
  { id: 'female_base', name: 'Feminino Padrão', url: 'https://i.imgur.com/aY9BAgw.png' },
];

export const FACE_FEATURES_URL = 'https://i.imgur.com/A9lJxoj.png';

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
    { id: 'anime', name: 'Anime', url: 'https://i.imgur.com/51xM0T4.png' },
    { id: 'mullet', name: 'Mullet', url: 'https://i.imgur.com/4Vqe6tu.png' },
    { id: 'parted', name: 'Dividido', url: 'https://i.imgur.com/6ToIjOx.png' },
    { id: 'blunt_bangs', name: 'Franja Reta', url: 'https://i.imgur.com/JJumvXd.png' },
    { id: 'short_dreads', name: 'Dread Curto', url: 'https://i.imgur.com/dQEhTbY.png' },
    { id: 'princess', name: 'Princesa', url: 'https://i.imgur.com/EBylhDI.png' },
    { id: 'ponytail', name: 'Rabo de Cavalo', url: 'https://i.imgur.com/TEuthwb.png' },
  ],
  outfits: [
    { id: 'none', name: 'Nenhuma', url: '' },
    { id: 'soccer', name: 'Futebol', url: 'https://i.imgur.com/v5NjNC4.png' },
    { id: 'jeans_hoodie', name: 'Jeans e Moletom', url: 'https://i.imgur.com/xzA0bJt.png' },
    { id: 'social', name: 'Social', url: 'https://i.imgur.com/1m2ZVQJ.png' },
    { id: 'cyberpunk', name: 'Cyberpunk', url: 'https://i.imgur.com/zO694tM.png' },
    { id: 'school', name: 'Escolar', url: 'https://i.imgur.com/GY4OD6o.png' },
    { id: 'lab_coat', name: 'Jaleco', url: 'https://i.imgur.com/RxJMGKV.png' },
    { id: 'gym', name: 'Academia', url: 'https://i.imgur.com/uS17JNa.png' },
    { id: 'silver_armor', name: 'Armadura de Prata', url: 'https://i.imgur.com/vZ6TXNs.png' },
    { id: 'gold_armor', name: 'Armadura de Ouro', url: 'https://i.imgur.com/C4kkXpW.png' },
  ],
  head_under_items: [
    { id: 'none', name: 'Nenhum', url: '' },
    { id: 'glasses', name: 'Óculos de Grau', url: 'https://i.imgur.com/p1suqIQ.png' },
    { id: 'aviators', name: 'Óculos Aviador', url: 'https://i.imgur.com/ufSj41S.png' },
    { id: 'mask', name: 'Máscara', url: 'https://i.imgur.com/uv2GZAh.png' },
    { id: 'eyepatch', name: 'Tapa-olho', url: 'https://i.imgur.com/1GvGgHw.png' },
  ],
  helmets: [
    { id: 'none', name: 'Nenhum', url: '' },
    { id: 'gold_helm', name: 'Elmo de Ouro', url: 'https://i.imgur.com/XLuAHd0.png' },
    { id: 'silver_helm', name: 'Elmo de Prata', url: 'https://i.imgur.com/bPTcUdQ.png' },
  ],
  head_over_items: [
    { id: 'none', name: 'Nenhum', url: '' },
    { id: 'wizard_hat', name: 'Chapéu de Mago', url: 'https://i.imgur.com/ujyLkvD.png' },
    { id: 'cap', name: 'Boné', url: 'https://i.imgur.com/oi3myXC.png' },
    { id: 'crown', name: 'Coroa', url: 'https://i.imgur.com/jxpVxUU.png' },
  ],
  artifacts: [
    { id: 'none', name: 'Nenhum', url: '' },
    { id: 'silver_bow', name: 'Arco de Prata', url: 'https://i.imgur.com/ZXedYOG.png' },
    { id: 'silver_staff', name: 'Cajado de Prata', url: 'https://i.imgur.com/uLsePKo.png' },
    { id: 'magic_book', name: 'Livro de Magia', url: 'https://i.imgur.com/FmEwDqi.png' },
    { id: 'katana', name: 'Katana', url: 'https://i.imgur.com/KTrURRP.png' },
    { id: 'iron_shield', name: 'Escudo de Ferro', url: 'https://i.imgur.com/ZmjKYki.png' },
  ],
};