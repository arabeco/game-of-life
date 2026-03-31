import { LevelUnlocks, SovereignConfig, ItemRarity, UnlockCategory, Asset, Skin, Mood, ChestType, Slot } from '../types';
import { ITEMS_DB, getCatalogItemsByCategory, getCatalogItems, isItemCatalogVisible, isRankRewardItem } from './items';
import { ACTIVE_SEASON_ID, GM_SEASONS, GM_SEASON_MISSIONS, GM_SEASON_QUESTS, SEASONS } from './seasonContent';

// ==========================================
// CONFIGURAÇÃO DO JOGO (GM BOARD)
// ==========================================

export const MAX_CLAN_MEMBERS = 10;

// --- COSMÉTICOS (SOVEREIGN ASSETS) ---
// Atualizado com o link do Supabase fornecido
const AVATAR_BASE_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars';

export const SKIN_TONES = ['#FBE5D5', '#F3C7AC', '#E2A984', '#C68642', '#8D5524', '#613817'] as const;

export const HAIR_COLORS = [
    { id: '1', label: 'Tipo 1', hex: '#2C1608' },
    { id: '2', label: 'Tipo 2', hex: '#000000' },
    { id: '3', label: 'Tipo 3', hex: '#E6BE8A' },
    { id: '4', label: 'Tipo 4', hex: '#8D4004' },
    { id: '5', label: 'Tipo 5', hex: '#FFFFFF' },
    { id: '6', label: 'Tipo 6', hex: '#FFC0CB' },
];

export const BODY_STYLES = [
  { id: 'body_masc_1', name: 'Masculino 1', url: `${AVATAR_BASE_URL}/body_masc_1.png` },
  { id: 'body_masc_2', name: 'Masculino 2', url: `${AVATAR_BASE_URL}/body_masc_2.png` },
  { id: 'body_masc_3', name: 'Masculino 3', url: `${AVATAR_BASE_URL}/body_masc_3.png` },
  { id: 'body_fem_1', name: 'Feminino 1', url: `${AVATAR_BASE_URL}/body_fem_1.png` },
  { id: 'body_fem_2', name: 'Feminino 2', url: `${AVATAR_BASE_URL}/body_fem_2.png` },
  { id: 'body_fem_3', name: 'Feminino 3', url: `${AVATAR_BASE_URL}/body_fem_3.png` },
];

export const FACE_FEATURES_URL = ``;

export const SOVEREIGN_ASSETS = {
  bodyStyles: BODY_STYLES,
  skinTones: SKIN_TONES,
  hairColors: HAIR_COLORS,
  hairStyles: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    ...ITEMS_DB.filter(i => i.category === 'hair').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
  outfits: [
    { id: 'none', name: 'Nenhuma', url: '', rarity: 'common' as ItemRarity },
    ...getCatalogItemsByCategory('skin').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
  artifacts: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    ...getCatalogItemsByCategory('artifact').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
  glyphs: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    ...getCatalogItemsByCategory('glyph').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
  plates: [
    { id: 'none', name: 'Nenhuma', url: '', rarity: 'common' as ItemRarity },
    ...getCatalogItemsByCategory('plate').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
  auras: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    ...getCatalogItemsByCategory('aura').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
  orbs: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    ...getCatalogItemsByCategory('orb').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
};

export const DEFAULT_SOVEREIGN_CONFIG: SovereignConfig = {
    body: 'body_masc_1', skinTone: '#FBE5D5', hairStyle: 'none', hairColor: '#2C1608',
    outfit: 'none', artifact: 'none',
    glyph: 'none', aura: 'none', orb: 'none',
    sovereignPlate: 'none', artifactPlate: 'none', glyphPlate: 'none'
};

export const getItemCategory = (itemId: string): UnlockCategory | null => {
  if (SOVEREIGN_ASSETS.bodyStyles.some(i => i.id === itemId)) return 'bodyStyles';
  if (SOVEREIGN_ASSETS.hairStyles.some(i => i.id === itemId)) return 'hairStyles';
  if (SOVEREIGN_ASSETS.outfits.some(i => i.id === itemId)) return 'outfits';
  if (SOVEREIGN_ASSETS.artifacts.some(i => i.id === itemId)) return 'artifacts';
  if (SOVEREIGN_ASSETS.glyphs.some(i => i.id === itemId)) return 'glyphs';
  if (SOVEREIGN_ASSETS.plates.some(i => i.id === itemId)) return 'plates';
  if (SOVEREIGN_ASSETS.auras.some(i => i.id === itemId)) return 'auras';
  if (SOVEREIGN_ASSETS.orbs.some(i => i.id === itemId)) return 'orbs';
  return null;
};

const buildUnlockMap = (items: { id: string }[]) => items.reduce((acc, item) => ({ ...acc, [item.id]: 1 }), {} as Record<string, number>);

export const buildDefaultLevelUnlocks = (): LevelUnlocks => ({
  bodyStyles: buildUnlockMap(SOVEREIGN_ASSETS.bodyStyles),
  hairStyles: buildUnlockMap(SOVEREIGN_ASSETS.hairStyles),
  outfits: buildUnlockMap(SOVEREIGN_ASSETS.outfits),
  artifacts: buildUnlockMap(SOVEREIGN_ASSETS.artifacts),
  glyphs: buildUnlockMap(SOVEREIGN_ASSETS.glyphs),
  codexes: {},
  skins: {},
  borders: {},
  banners: {},
  auras: buildUnlockMap(SOVEREIGN_ASSETS.auras),
  orbs: buildUnlockMap(SOVEREIGN_ASSETS.orbs),
  plates: buildUnlockMap(SOVEREIGN_ASSETS.plates),
  ornament: {},
  insignias: {},
  ui_skins: {},
});

// --- GM CONFIG & MASTERY ---

export const GM_CONFIG = {
  seasons: GM_SEASONS,
  seasonMissions: GM_SEASON_MISSIONS,
  seasonQuests: GM_SEASON_QUESTS,
  chestDrops: {
    itemDropChanceByChest: { Comum: 0.005, Raro: 0.01, Épico: 0.02, Lendário: 0.03 } as Partial<Record<ChestType, number>>,
    skinDropChanceByChest: { Comum: 0.005, Raro: 0.02, Épico: 0.05, Lendário: 0.1 } as Partial<Record<ChestType, number>>,
    itemPool: { categories: ['bodyStyles', 'outfits', 'artifacts', 'glyphs', 'auras', 'orbs'] as UnlockCategory[], excludeIds: ['none'] },
  },
  cosmetics: {
    skins: [
      ...getCatalogItemsByCategory('ui_skin').map(i => {
          let color = '#ffffff';
          if (i.id === 'BASIC') color = '#ffffff';
          if (i.id === 'GOLD') color = '#FFD700';
          if (i.id === 'FROST') color = '#00FFFF';
          if (i.id === 'EMBER') color = '#FF4500';
          if (i.id === 'CYBER') color = '#00FF00';
          if (i.id === 'AURORA') color = '#9400D3';
          if (i.id === 'VOID') color = '#4B0082';
          return { id: i.id, name: i.name, color, rarity: i.rarity };
      }),
    ] as Skin[],
    borders: [
      ...getCatalogItemsByCategory('border').map(i => ({ id: i.id, name: i.name, color: '#ffffff', imageUrl: i.imageUrl || '', rarity: i.rarity })),
    ] as Skin[],
    banners: [
      ...getCatalogItemsByCategory('banner').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
    ],
  },
  unlocks: {
    itemUnlockBasis: 'nobility' as 'level' | 'nobility',
  },
  goldenInvites: { 
    codePrefix: 'ouro', 
    seedCount: 5, 
    seedCodes: [], 
    multiUseCodes: [] 
  },
};

export const SKINS_DATA: Skin[] = GM_CONFIG.cosmetics.skins;
export const BORDERS_DATA: Skin[] = GM_CONFIG.cosmetics.borders;
export const BANNERS_DATA = GM_CONFIG.cosmetics.banners;

export const SKIN_UNLOCKS_BY_RANK: Record<string, string[]> = { vagante: ['FROST'], escudeiro: ['CYBER'], cavaleiro: ['EMBER'], lorde: ['AURORA'] };
export const BORDER_UNLOCKS_BY_RANK: Record<string, string[]> = { 
    escudeiro: getCatalogItems(item => item.category === 'border' && item.tier === 1 && isRankRewardItem(item)).map(i => i.id),
    cavaleiro: getCatalogItems(item => item.category === 'border' && item.tier === 2 && isRankRewardItem(item)).map(i => i.id),
    lorde: getCatalogItems(item => item.category === 'border' && item.tier === 3 && isRankRewardItem(item)).map(i => i.id),
    barao: getCatalogItems(item => item.category === 'border' && item.tier === 4 && isRankRewardItem(item)).map(i => i.id),
    soberano: getCatalogItems(item => item.category === 'border' && item.tier === 5 && isRankRewardItem(item)).map(i => i.id)
};
export const BANNER_UNLOCKS_BY_RANK: Record<string, string[]> = { 
    escudeiro: getCatalogItems(item => item.category === 'banner' && item.tier === 1 && isRankRewardItem(item)).map(i => i.id),
    cavaleiro: getCatalogItems(item => item.category === 'banner' && item.tier === 2 && isRankRewardItem(item)).map(i => i.id),
    lorde: getCatalogItems(item => item.category === 'banner' && item.tier === 3 && isRankRewardItem(item)).map(i => i.id),
    barao: getCatalogItems(item => item.category === 'banner' && item.tier === 4 && isRankRewardItem(item)).map(i => i.id),
    soberano: getCatalogItems(item => item.category === 'banner' && item.tier === 5 && isRankRewardItem(item)).map(i => i.id)
};
export const SKIN_SEASON_UNLOCKS: Record<string, string[]> = { GOLD: ['sm_3'] };
export const SKIN_CHEST_POOL = ['VOID'].filter(id => isItemCatalogVisible(id));

export const SANCTUARY_BACKGROUND_OPTIONS = [
  { id: 'garden', name: 'Jardim', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/land1.jpg' },
  { id: 'garden-aurora', name: 'Jardim Aurora', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/gardenaurora.jpg' },
  { id: 'garden-cyber', name: 'Jardim Cyber', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/gardencyber.jpg' },
  { id: 'garden-ember', name: 'Jardim Ember', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/gardenember.jpg' },
  { id: 'garden-frost', name: 'Jardim Frost', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/gardenfrost.jpg' },
];
export const DEFAULT_SANCTUARY_BACKGROUND = SANCTUARY_BACKGROUND_OPTIONS[0].value;

export const MOODS_DATA: Mood[] = [
    { label: "Vergonha", min: 0, max: 5, color: "linear-gradient(90deg, #6b1e1e, #8b2b2b)", trackStart: "#6b1e1e", trackEnd: "#8b2b2b" },
    { label: "Culpa", min: 5, max: 10, color: "linear-gradient(90deg, #8b3b1e, #a24a22)", trackStart: "#8b3b1e", trackEnd: "#a24a22" },
    { label: "Apatia", min: 10, max: 15, color: "linear-gradient(90deg, #b35a1e, #c46a22)", trackStart: "#b35a1e", trackEnd: "#c46a22" },
    { label: "Tristeza", min: 15, max: 20, color: "linear-gradient(90deg, #d47a1e, #e28b2a)", trackStart: "#d47a1e", trackEnd: "#e28b2a" },
    { label: "Medo", min: 20, max: 25, color: "linear-gradient(90deg, #e2a43a, #f0b84a)", trackStart: "#e2a43a", trackEnd: "#f0b84a" },
    { label: "Desejo", min: 25, max: 30, color: "linear-gradient(90deg, #e6c14a, #f0d35a)", trackStart: "#e6c14a", trackEnd: "#f0d35a" },
    { label: "Raiva", min: 30, max: 35, color: "linear-gradient(90deg, #d48a2a, #e49c3a)", trackStart: "#d48a2a", trackEnd: "#e49c3a" },
    { label: "Orgulho", min: 35, max: 45, color: "linear-gradient(90deg, #c6b83a, #d8cf4a)", trackStart: "#c6b83a", trackEnd: "#d8cf4a" },
    { label: "Coragem", min: 45, max: 55, color: "linear-gradient(90deg, #8fcf3a, #a6e34a)", trackStart: "#8fcf3a", trackEnd: "#a6e34a" },
    { label: "Neutralidade", min: 55, max: 60, color: "linear-gradient(90deg, #4fbf6a, #62d07a)", trackStart: "#4fbf6a", trackEnd: "#62d07a" },
    { label: "Disposição", min: 60, max: 65, color: "linear-gradient(90deg, #3dbf8a, #50d09c)", trackStart: "#3dbf8a", trackEnd: "#50d09c" },
    { label: "Aceitação", min: 65, max: 70, color: "linear-gradient(90deg, #2bb3b3, #3ac6c6)", trackStart: "#2bb3b3", trackEnd: "#3ac6c6" },
    { label: "Razão", min: 70, max: 75, color: "linear-gradient(90deg, #2a7bd4, #3a93e6)", trackStart: "#2a7bd4", trackEnd: "#3a93e6" },
    { label: "Amor", min: 75, max: 85, color: "linear-gradient(90deg, #3c5bff, #5a79ff)", trackStart: "#3c5bff", trackEnd: "#5a79ff" },
    { label: "Alegria", min: 85, max: 90, color: "linear-gradient(90deg, #6a3dff, #8a5bff)", trackStart: "#6a3dff", trackEnd: "#8a5bff" },
    { label: "Paz", min: 90, max: 95, color: "linear-gradient(90deg, #7a2fd1, #943de0)", trackStart: "#7a2fd1", trackEnd: "#943de0" },
    { label: "Iluminação", min: 95, max: 101, color: "linear-gradient(90deg, #b227b5, #d06ad8)", trackStart: "#b227b5", trackEnd: "#d06ad8" },
];

export const MASTERY_LEVEL_DESCRIPTIONS: Record<string, string[]> = {
  consciencia: [
    "Estou perdido em pensamentos, raramente presente.",
    "Ocasionalmente, percebo a beleza ao meu redor.",
    "ìs vezes sinto uma breve gratidão, mas o ceticismo domina.",
    "Começo a praticar a atenção plena, mas me distraio facilmente.",
    "A gratidão se torna um hábito diário, mesmo que forçado.",
    "Sinto uma conexão mais profunda com o momento presente.",
    "A paz interior surge com mais frequência em meu dia a dia.",
    "Vejo a interconexão de todas as coisas com clareza.",
    "A consciência plena é meu estado natural, não um esforço.",
    "Vivo em um estado de fluxo, uno com o momento presente."
  ],
  espiritualidade: [
    "Nego qualquer dimensão além do material.",
    "Questiono a existência de algo maior, mas com ceticismo.",
    "Exploro diferentes filosofias, mas sem compromisso.",
    "Adoto uma prática espiritual, mas de forma irregular.",
    "Minha prática se torna consistente e significativa.",
    "Sinto uma presença ou energia superior em minha vida.",
    "A fé (ou confiança no universo) guia minhas decisões.",
    "Experimento momentos de transcendência e unidade.",
    "Minha vida é uma expressão da minha verdade espiritual.",
    "Sinto-me em comunhão constante com o divino/universo."
  ],
  'espaco-mental': [
    "Minha mente é um caos de pensamentos negativos e reativos.",
    "Reconheço meus padrões de pensamento, mas não consigo mudá-los.",
    "Começo a desafiar crenças limitantes com algum sucesso.",
    "Pratico técnicas para acalmar a mente, como meditação.",
    "Consigo observar meus pensamentos sem me identificar com eles.",
    "Escolho conscientemente minhas reações em vez de ser reativo.",
    "Minha mente se torna uma ferramenta a meu serviço, não meu mestre.",
    "Cultivo clareza e foco com facilidade.",
    "A paz mental é meu estado padrão, mesmo em meio ao caos.",
    "Minha mente é um santuário de criatividade e sabedoria."
  ],
  projetos: [
    "Tenho ideias, mas nunca começo nada.",
    "Começo projetos, mas desisto na primeira dificuldade.",
    "Consigo completar pequenos projetos com muito esforço.",
    "Aprendo a planejar e organizar minhas ideias de forma eficaz.",
    "Executo projetos de médio prazo com consistência.",
    "A criatividade flui e encontro soluções inovadoras.",
    "Colaboro efetivamente com outros para realizar grandes visões.",
    "Meus projetos impactam positivamente minha vida e a dos outros.",
    "Sou uma fonte de inspiração e realização criativa.",
    "Manifesto minhas visões no mundo com maestria e propósito."
  ],
  proposito: [
    "Sinto-me perdido, sem direção ou sentido na vida.",
    "Busco um propósito, mas sinto que nada me preenche.",
    "Identifico meus valores, mas não sei como aplicá-los.",
    "Experimento diferentes caminhos em busca de alinhamento.",
    "Defino uma missão de vida que ressoa com minha verdade.",
    "Minhas ações diárias começam a refletir minha missão.",
    "Meu trabalho e vida pessoal estão alinhados com meu propósito.",
    "Sinto uma profunda sensação de significado e contribuição.",
    "Inspiro outros a encontrarem e viverem seus propósitos.",
    "Minha vida é a personificação do meu propósito."
  ],
  conexoes: [
    "Sinto-me isolado e desconectado dos outros.",
    "Tenho relacionamentos superficiais e baseados em necessidade.",
    "Começo a praticar a escuta ativa e a empatia.",
    "Estabeleço limites saudáveis em meus relacionamentos.",
    "Cultivo amizades genuínas e de apoio mútuo.",
    "Sou capaz de expressar amor e vulnerabilidade de forma autêntica.",
    "Meus relacionamentos são fontes de crescimento e alegria.",
    "Crio uma comunidade forte e unida ao meu redor.",
    "Minhas conexões transcendem o ego e se baseiam na alma.",
    "Sou um catalisador de amor e união no mundo."
  ],
  financas: [
    "Estou constantemente endividado e ansioso com dinheiro.",
    "Consigo pagar as contas, mas vivo de salário em salário.",
    "Crio um orçamento e começo a controlar meus gastos.",
    "Construo uma reserva de emergência e quito dívidas ruins.",
    "Começo a investir para o futuro de forma consistente.",
    "Minha renda passiva começa a crescer.",
    "Tenho clareza sobre meus objetivos e plano financeiro.",
    "O dinheiro se torna uma ferramenta para liberdade e impacto.",
    "Alcanço a independência financeira.",
    "Uso minha riqueza para criar um legado e ajudar os outros."
  ],
  trabalho: [
    "Detesto meu trabalho e sinto-me estagnado.",
    "Faço o mínimo necessário para manter o emprego.",
    "Busco desenvolver novas habilidades, mas sem foco.",
    "Encontro um trabalho que se alinha melhor com meus interesses.",
    "Torno-me proficiente e valorizado em minha área.",
    "Encontro prazer e desafio no meu trabalho diário.",
    "Sou reconhecido como um especialista ou líder.",
    "Meu trabalho contribui para algo maior que eu.",
    "Inovo e crio valor de forma excepcional em minha carreira.",
    "Meu trabalho é uma expressão de minha maestria e paixão."
  ],
  hobbies: [
    "Não tenho tempo ou energia para hobbies.",
    "Meus hobbies são passivos, como assistir TV.",
    "Experimento novas atividades, mas nada me prende.",
    "Encontro um hobby que me desafia e me dá prazer.",
    "Dedico tempo regularmente para minhas paixões.",
    "Atinjo um nível de habilidade que me orgulha.",
    "Meus hobbies são uma fonte de relaxamento e criatividade.",
    "Conecto-me com outras pessoas através dos meus interesses.",
    "Meus hobbies se tornam uma parte essencial da minha identidade.",
    "Alcanço um estado de fluxo e maestria em minhas paixões."
  ],
  fisico: [
    "Negligencio completamente minha saúde física.",
    "Tenho hábitos prejudiciais (má alimentação, sedentarismo).",
    "Tento me exercitar e comer melhor, mas sou inconsistente.",
    "Adoto uma rotina de exercícios e alimentação mais saudável.",
    "Meu corpo se torna mais forte, flexível e com mais energia.",
    "O bem-estar físico se torna um pilar da minha vida.",
    "Escuto meu corpo e atendo às suas necessidades com sabedoria.",
    "Supero meus limites e atinjo metas físicas desafiadoras.",
    "Meu corpo é um templo de vitalidade e alto desempenho.",
    "Irradio saúde e inspiro outros a cuidarem de si mesmos."
  ],
  geral: [],
};

MASTERY_LEVEL_DESCRIPTIONS.consciencia[2] = 'Às vezes sinto uma breve gratidão, mas o ceticismo domina.';

const createPrimaryAssetSlot = (slot: Slot): Slot[] => [slot];

const PRIMARY_ASSET_SLOTS: Record<string, Slot[]> = {
  consciencia: createPrimaryAssetSlot({
    id: 'widget_consciencia',
    label: 'Filosofia',
    type: 1,
    inputType: 'wheelpick',
    options: ['Nao definido', 'Estoicismo', 'Pragmatismo', 'Minimalismo', 'Disciplina', 'Equilibrio', 'Autoconhecimento', 'Fe', 'Carpe diem', 'Servico', 'Outro'],
    value: 'Nao definido',
  }),
  espiritualidade: createPrimaryAssetSlot({
    id: 'widget_espiritualidade',
    label: 'Crenca principal',
    type: 1,
    inputType: 'wheelpick',
    options: ['Nao definido', 'Catolicismo', 'Protestantismo', 'Espiritismo', 'Umbanda / Candomble', 'Budismo', 'Gnosticismo', 'Ateismo / agnosticismo', 'Outro'],
    value: 'Nao definido',
  }),
  'espaco-mental': createPrimaryAssetSlot({
    id: 'widget_espaco_mental',
    label: 'Maior virtude',
    type: 1,
    inputType: 'wheelpick',
    options: ['Nao definido', 'Coragem', 'Justica', 'Prudencia', 'Temperanca', 'Disciplina', 'Honestidade', 'Lealdade', 'Sabedoria', 'Compaixao', 'Humildade', 'Resiliencia', 'Paciencia', 'Generosidade', 'Foco', 'Fe'],
    value: 'Nao definido',
  }),
  projetos: createPrimaryAssetSlot({
    id: 'widget_projetos',
    label: 'Forma de criacao',
    type: 1,
    inputType: 'wheelpick',
    options: ['Nao definido', 'Escrita', 'Musica', 'Video', 'Arte visual', 'Fotografia', 'Programacao', 'Negocio', 'Outro'],
    value: 'Nao definido',
  }),
  proposito: createPrimaryAssetSlot({
    id: 'widget_proposito',
    label: 'Missao',
    type: 1,
    inputType: 'wheelpick',
    options: ['Nao definido', 'Inspirar', 'Criar', 'Servir', 'Liderar', 'Ensinar', 'Curar', 'Proteger', 'Construir', 'Transformar', 'Explorar', 'Conectar', 'Outro'],
    value: 'Nao definido',
  }),
  conexoes: createPrimaryAssetSlot({
    id: 'widget_conexoes',
    label: 'Foco relacional',
    type: 1,
    inputType: 'wheelpick',
    options: ['Nao definido', 'Familia', 'Par romantico', 'Amizades', 'Mentores', 'Comunidade', 'Network', 'Solitude', 'Outro'],
    value: 'Nao definido',
  }),
  financas: createPrimaryAssetSlot({
    id: 'widget_financas',
    label: 'Momento financeiro',
    type: 1,
    inputType: 'wheelpick',
    options: ['Nao definido', 'Endividado', 'Saindo do negativo', 'Me mantenho', 'Estavel', 'Investindo', 'Prosperando'],
    value: 'Nao definido',
  }),
  trabalho: createPrimaryAssetSlot({
    id: 'widget_trabalho',
    label: 'Oficio principal',
    type: 1,
    inputType: 'wheelpick',
    options: [
      'Nao definido',
      'Estudante',
      'Empreendedor',
      'Desenvolvedor',
      'Designer',
      'Marketing',
      'Vendas / comercial',
      'Professor',
      'Advogado',
      'Medico',
      'Psicologo',
      'Enfermeiro',
      'Engenheiro',
      'Arquiteto',
      'Administrador / gestor',
      'Financeiro / contabil',
      'RH / recrutamento',
      'Atendimento / suporte',
      'Operacoes / logistica',
      'Produtor de conteudo',
      'Consultor',
      'Servidor publico',
      'Outro',
    ],
    value: 'Nao definido',
  }),
  hobbies: createPrimaryAssetSlot({
    id: 'widget_hobbies',
    label: 'Atividade favorita',
    type: 1,
    inputType: 'wheelpick',
    options: ['Nao definido', 'Esportes', 'Futebol', 'Tenis', 'Poker', 'Games', 'Musica', 'Leitura', 'Cinema', 'Academia', 'Corrida', 'Culinaria', 'Viagem', 'Outro'],
    value: 'Nao definido',
  }),
  fisico: createPrimaryAssetSlot({
    id: 'widget_fisico',
    label: 'Forma fisica',
    type: 1,
    inputType: 'wheelpick',
    options: ['Nao definido', 'Em reabilitacao', 'Sedentario', 'Retomando', 'Ativo', 'Em forma', 'Atletico'],
    value: 'Nao definido',
  }),
  geral: [],
};

const RAW_ASSETS_DATA: Omit<Asset, 'slots'>[] = [
  {
    id: 'consciencia', name: 'CONSCIÊNCIA', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.consciencia.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: []
  },
  {
    id: 'espiritualidade', name: 'ESPIRITUALIDADE', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.espiritualidade.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: []
  },
  {
    id: 'espaco-mental', name: 'ESPAÇO MENTAL', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS['espaco-mental'].reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: []
  },
  {
    id: 'projetos', name: 'PROJETOS', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.projetos.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: []
  },
  {
    id: 'proposito', name: 'PROPÓSITO', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.proposito.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: []
  },
  {
    id: 'conexoes', name: 'CONEXÕES', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.conexoes.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: []
  },
  {
    id: 'financas', name: 'FINANÇAS', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.financas.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: []
  },
  {
    id: 'trabalho', name: 'TRABALHO/ESTUDOS', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.trabalho.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: []
  },
  {
    id: 'hobbies', name: 'HOBBIES', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.hobbies.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: []
  },
  {
    id: 'fisico', name: 'FÍSICO', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.fisico.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: []
  },
  {
    id: 'geral',
    name: 'GERAL',
    level: 0,
    levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.geral.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}),
    arenas: [
        { id: 'arena_outros', assetId: 'geral', name: 'Outros', description: 'Arena para ações gerais não categorizadas.', icon: '🗂️', actionIds: [] }
    ]
  },
];

export const ASSETS_DATA: Asset[] = RAW_ASSETS_DATA.map((asset) => ({
  ...asset,
  slots: PRIMARY_ASSET_SLOTS[asset.id] ?? [],
}));


