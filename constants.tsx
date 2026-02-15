import { Asset, Skin, Mood, ChestType, UnlockCategory, Season, SeasonMission, SeasonQuest } from './types';

export const MAX_CLAN_MEMBERS = 10;

export const GM_CONFIG = {
  seasons: [
    { id: 'season_0', name: 'Season 0 - Aquário', start_date: '2024-01-01', end_date: '2026-02-18', background_png_url: 'https://i.imgur.com/6c2z3uH.jpeg', lore_text: 'Um tempo de purificação e novos começos, onde a fluidez da água nos ensina a adaptar e superar.', is_active: true }
  ] as Season[],
  seasonMissions: [
    { id: 'sm_1', season_id: 'season_0', title: 'O Peregrino', description: 'Correr um total de 50km.', goal_type: 'km_run', goal_value: 50, reward_type: 'exp', reward_value: 1000 },
    { id: 'sm_2', season_id: 'season_0', title: 'O Sábio', description: 'Ler 1 livro completo.', goal_type: 'books_read', goal_value: 1, reward_type: 'exp', reward_value: 500 },
    { id: 'sm_3', season_id: 'season_0', title: 'O Monge', description: 'Meditar por 20 dias.', goal_type: 'meditation_days', goal_value: 20, reward_type: 'item_id', reward_value: 'head_over_items:crown' },
  ] as SeasonMission[],
  seasonQuests: [
    { id: 'sq_1', season_id: 'season_0', scope: 'season', title: 'Quest da Season', description: 'Complete 30 ações durante a season.', goal_type: 'actions_completed', goal_value: 30 },
    { id: 'sq_2', season_id: 'season_0', scope: 'clan', title: 'Quest do Clã', description: 'Complete ações em equipe no clã.', goal_type: 'actions_completed', goal_value: 30 },
  ] as SeasonQuest[],
  chestDrops: {
    itemDropChanceByChest: {
      Comum: 0.005,
      Raro: 0.01,
      Épico: 0.02,
      Lendário: 0.03,
    } as Record<ChestType, number>,
    skinDropChanceByChest: {
      Comum: 0.005,
      Raro: 0.02,
      Épico: 0.05,
      Lendário: 0.1,
    } as Record<ChestType, number>,
    itemPool: {
      categories: [
        'bodyStyles',
        'hairStyles',
        'outfits',
        'head_under_items',
        'helmets',
        'head_over_items',
        'artifacts',
      ] as UnlockCategory[],
      excludeIds: ['none'],
    },
  },
  cosmetics: {
    skins: [
      { id: 'GOLD', name: 'GOLD', color: '#d4af37' },
      { id: 'CYBER', name: 'CYBER', color: '#00d9ff' },
      { id: 'FROST', name: 'FROST', color: '#92d4f3' },
      { id: 'EMBER', name: 'EMBER', color: '#ff6a00' },
      { id: 'AURORA', name: 'AURORA', color: '#5effa5' },
      { id: 'VOID', name: 'VOID', color: '#a95eff' },
    ] as Skin[],
    borders: [
      { id: 'DISCIPLINADO', name: 'Pupilo', color: '#c0c0c0', imageUrl: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/borada_disciplinado.png' },
      { id: 'GRAO_MESTRE', name: 'Grão Mestre', color: '#b3b3b3', imageUrl: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/borda_gm.png' },
      { id: 'IMPARAVEL', name: 'Imparável', color: '#d4af37', imageUrl: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/borda_imparavel.png' },
      { id: 'LENDA_VIVA', name: 'Lenda Viva', color: '#8fd0ff', imageUrl: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/borda_lendaviva.png' },
      { id: 'POPULAR', name: 'Popular', color: '#ff8fd4', imageUrl: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/borda_popular.png' },
    ] as Skin[],
    banners: [
      { id: 'grao_mestre', name: 'Grão Mestre', url: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/banner_gm.png' },
      { id: 'disciplinado', name: 'Disciplinado', url: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/banner_disciplinado.png' },
      { id: 'imparavel', name: 'Imparável', url: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/banner_imparavel.png' },
      { id: 'lendaviva', name: 'Lenda Viva', url: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/banner_lendaviva.png' },
      { id: 'popular', name: 'Popular', url: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/banner_poopular.png' },
    ],
  },
  goldenInvites: {
    codePrefix: 'ouro',
    seedCount: 5,
    seedCodes: ['ouro2026-001', 'ouro2026-002', 'ouro2026-003', 'ouro2026-004', 'ouro2026-005'],
  },
};

// Default empty value for image slots
const emptyImage = { imageUrl: '', caption: '' };

export const SKINS_DATA: Skin[] = GM_CONFIG.cosmetics.skins;

export const BORDERS_DATA: Skin[] = GM_CONFIG.cosmetics.borders;

export const BANNERS_DATA = GM_CONFIG.cosmetics.banners;

export const SKIN_UNLOCKS_BY_RANK: Record<string, string[]> = {
  vagante: ['FROST'],
  escudeiro: ['CYBER'],
  cavaleiro: ['EMBER'],
  lorde: ['AURORA'],
};

export const SKIN_SEASON_UNLOCKS: Record<string, string[]> = {
  GOLD: ['sm_3'],
};

export const SKIN_CHEST_POOL = ['VOID'];

export const SANCTUARY_BACKGROUND_OPTIONS = [
  { id: 'garden', name: 'Jardim', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/garden.jpg' },
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
    "Às vezes sinto uma breve gratidão, mas o ceticismo domina.",
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


export const ASSETS_DATA: Asset[] = [
  {
    id: 'consciencia', name: 'CONSCIÊNCIA', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.consciencia.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: [], slots: [
      { id: 'consciencia.lema', label: 'LEMA', type: 1, inputType: 'textarea', value: 'Valor 1' },
      { id: 'consciencia.crenca1', label: 'CRENÇA 1', type: 1, inputType: 'textarea', value: 'Valor 2' },
      { id: 'consciencia.crenca2', label: 'CRENÇA 2', type: 1, inputType: 'textarea', value: 'Valor 3' },
      { id: 'consciencia.crenca3', label: 'CRENÇA 3', type: 1, inputType: 'textarea', value: 'Valor 4' },
    ]
  },
  {
    id: 'espiritualidade', name: 'ESPIRITUALIDADE', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.espiritualidade.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: [], slots: [
      { id: 'espiritualidade.sistema', label: 'Sistema Espiritual', type: 1, inputType: 'wheelpick', options: ['Cristianismo', 'Islamismo', 'Budismo', 'Hinduísmo', 'Judaísmo', 'Taoísmo', 'Gnosticismo', 'Espiritualismo', 'Agnosticismo', 'Ateísmo'], value: 'Agnosticismo' },
      { id: 'espiritualidade.santuario1', label: 'Santuário 1', type: 2, inputType: 'image', value: emptyImage },
      { id: 'espiritualidade.santuario2', label: 'Santuário 2', type: 2, inputType: 'image', value: emptyImage },
      { id: 'espiritualidade.santuario3', label: 'Santuário 3', type: 2, inputType: 'image', value: emptyImage },
    ]
  },
  {
    id: 'espaco-mental', name: 'ESPAÇO MENTAL', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS['espaco-mental'].reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: [], slots: [
      { id: 'espaco-mental.filosofia', label: 'Filosofia de Vida', type: 1, inputType: 'wheelpick', options: ['Estoicismo', 'Epicurismo', 'Existencialismo', 'Niilismo', 'Humanismo', 'Pragmatismo', 'Idealismo', 'Materialismo', 'Fenomenologia', 'Estruturalismo'], value: 'Estoicismo' },
    ]
  },
  {
    id: 'projetos', name: 'PROJETOS', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.projetos.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: [], slots: [
      { id: 'projetos.projeto1', label: 'Projeto 1', type: 2, inputType: 'image', value: emptyImage },
      { id: 'projetos.projeto2', label: 'Projeto 2', type: 2, inputType: 'image', value: emptyImage },
      { id: 'projetos.projeto3', label: 'Projeto 3', type: 2, inputType: 'image', value: emptyImage },
      { id: 'projetos.inspiracao1', label: 'Inspiração 1', type: 2, inputType: 'image', value: emptyImage },
      { id: 'projetos.inspiracao2', label: 'Inspiração 2', type: 2, inputType: 'image', value: emptyImage },
      { id: 'projetos.inspiracao3', label: 'Inspiração 3', type: 2, inputType: 'image', value: emptyImage },
    ]
  },
  {
    id: 'proposito', name: 'PROPÓSITO', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.proposito.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: [
        { id: 'arena_proposito_1', assetId: 'proposito', name: 'Carreira com Significado', description: 'Alinhar trabalho com valores pessoais.', icon: '👑', actionIds: ['act1'] }
    ], slots: [
      { id: 'proposito.missao', label: 'Missão de Vida', type: 1, inputType: 'textarea', value: 'Minha missão...' },
      { id: 'proposito.personalidade1', label: 'MBTI', type: 3, inputType: 'wheelpick', options: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'], value: 'INTJ' },
      { id: 'proposito.personalidade2', label: 'Signo', type: 3, inputType: 'wheelpick', options: ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'], value: 'Áries' },
      { id: 'proposito.virtude1', label: 'Virtude 1', type: 3, inputType: 'wheelpick', options: ['Coragem', 'Honestidade', 'Compaixão', 'Sabedoria', 'Justiça', 'Temperança'], value: 'Coragem' },
      { id: 'proposito.virtude2', label: 'Virtude 2', type: 3, inputType: 'wheelpick', options: ['Coragem', 'Honestidade', 'Compaixão', 'Sabedoria', 'Justiça', 'Temperança'], value: 'Sabedoria' },
      { id: 'proposito.virtude3', label: 'Virtude 3', type: 3, inputType: 'wheelpick', options: ['Coragem', 'Honestidade', 'Compaixão', 'Sabedoria', 'Justiça', 'Temperança'], value: 'Justiça' },
    ]
  },
  {
    id: 'conexoes', name: 'CONEXÕES', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.conexoes.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: [], slots: [
      { id: 'conexoes.pessoa1', label: 'Pessoa 1', type: 2, inputType: 'image', value: emptyImage },
      { id: 'conexoes.pessoa2', label: 'Pessoa 2', type: 2, inputType: 'image', value: emptyImage },
      { id: 'conexoes.pessoa3', label: 'Pessoa 3', type: 2, inputType: 'image', value: emptyImage },
      { id: 'conexoes.pessoa4', label: 'Pessoa 4', type: 2, inputType: 'image', value: emptyImage },
      { id: 'conexoes.pessoa5', label: 'Pessoa 5', type: 2, inputType: 'image', value: emptyImage },
      { id: 'conexoes.pessoa6', label: 'Pessoa 6', type: 2, inputType: 'image', value: emptyImage },
    ]
  },
  {
    id: 'financas', name: 'FINANÇAS', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.financas.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: [
        { id: 'arena_financas_1', assetId: 'financas', name: 'Liberdade Financeira', description: 'Atingir independência financeira.', icon: '🎯', tags: ['$'], actionIds: ['act2'] },
        { id: 'arena_financas_2', assetId: 'financas', name: 'Investimentos', description: 'Construir portfólio de ativos.', icon: '📈', tags: ['$'], actionIds: ['act3'] }
    ], slots: [
      { id: 'financas.renda', label: 'Renda Mensal', type: 3, inputType: 'wheelpick', options: ['R$ 0-2.000', 'R$ 2.000-5.000', 'R$ 5.000-10.000', 'R$ 10.000+'], value: 'R$ 0-2.000' },
      { id: 'financas.gasto', label: 'Gasto Mensal', type: 3, inputType: 'wheelpick', options: ['R$ 0-2.000', 'R$ 2.000-5.000', 'R$ 5.000-10.000', 'R$ 10.000+'], value: 'R$ 0-2.000' },
      { id: 'financas.patrimonio', label: 'Patrimônio', type: 1, inputType: 'wheelpick', options: ['R$ 0-10.000', 'R$ 10.000-25.000', 'R$ 25.000-100.000', 'R$ 100.000-500.000', 'R$ 500k-1M', 'R$ 1M+'], value: 'R$ 0-10.000' },
      { id: 'financas.ativo1', label: 'Ativo 1', type: 2, inputType: 'image', value: emptyImage },
      { id: 'financas.ativo2', label: 'Ativo 2', type: 2, inputType: 'image', value: emptyImage },
      { id: 'financas.ativo3', label: 'Ativo 3', type: 2, inputType: 'image', value: emptyImage },
    ]
  },
  {
    id: 'trabalho', name: 'TRABALHO/ESTUDOS', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.trabalho.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: [], slots: [
      { id: 'trabalho.classe1_1', label: 'Classe 1', type: 3, inputType: 'wheelpick', options: ['Médico', 'Engenheiro', 'Advogado', 'Programador', 'Designer', 'Criador de Conteúdo', 'Atleta', 'Empreendedor'], value: 'Programador' },
      { id: 'trabalho.especialidade1_2', label: 'Expertise 1', type: 3, inputType: 'wheelpick', options: ['Aprendiz', 'Iniciado', 'Praticante', 'Veterano', 'Mestre', 'Lenda'], value: 'Aprendiz' },
      { id: 'trabalho.classe2_1', label: 'Classe 2', type: 3, inputType: 'wheelpick', options: ['Médico', 'Engenheiro', 'Advogado', 'Programador', 'Designer', 'Criador de Conteúdo', 'Atleta', 'Empreendedor'], value: 'Designer' },
      { id: 'trabalho.especialidade2_2', label: 'Expertise 2', type: 3, inputType: 'wheelpick', options: ['Aprendiz', 'Iniciado', 'Praticante', 'Veterano', 'Mestre', 'Lenda'], value: 'Aprendiz' },
      { id: 'trabalho.experiencia1', label: 'Experiência 1', type: 2, inputType: 'image', value: emptyImage },
      { id: 'trabalho.experiencia2', label: 'Experiência 2', type: 2, inputType: 'image', value: emptyImage },
      { id: 'trabalho.experiencia3', label: 'Experiência 3', type: 2, inputType: 'image', value: emptyImage },
    ]
  },
  {
    id: 'hobbies', name: 'HOBBIES', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.hobbies.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: [], slots: [
      { id: 'hobbies.hobby1', label: 'Hobby 1', type: 2, inputType: 'image', value: emptyImage },
      { id: 'hobbies.hobby2', label: 'Hobby 2', type: 2, inputType: 'image', value: emptyImage },
      { id: 'hobbies.hobby3', label: 'Hobby 3', type: 2, inputType: 'image', value: emptyImage },
      { id: 'hobbies.destaque1', label: 'Destaque 1', type: 2, inputType: 'image', value: emptyImage },
      { id: 'hobbies.destaque2', label: 'Destaque 2', type: 2, inputType: 'image', value: emptyImage },
      { id: 'hobbies.destaque3', label: 'Destaque 3', type: 2, inputType: 'image', value: emptyImage },
    ]
  },
  {
    id: 'fisico', name: 'FÍSICO', level: 0, levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.fisico.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}), arenas: [
        { id: 'arena_fisico_1', assetId: 'fisico', name: 'Maratona', description: 'Completar uma maratona de 42km.', icon: '🎯', tags: ['FIRE'], actionIds: ['act4'] }
    ], slots: [
      { id: 'fisico.basico1', label: 'Idade', type: 3, inputType: 'slider', range: { min: 15, max: 99 }, value: 25 },
      { id: 'fisico.basico2', label: 'Gênero', type: 3, inputType: 'wheelpick', options: ['Masculino', 'Feminino', 'Não-binário', 'Outro'], value: 'Masculino' },
      { id: 'fisico.medida1', label: 'Peso (kg)', type: 3, inputType: 'slider', range: { min: 30, max: 200 }, value: 70 },
      { id: 'fisico.medida2', label: 'Altura (cm)', type: 3, inputType: 'slider', range: { min: 140, max: 220 }, value: 175 },
      { id: 'fisico.medida3', label: 'Atributo', type: 3, inputType: 'wheelpick', options: ['Força', 'Agilidade', 'Inteligência', 'Resistência', 'Carisma', 'Sorte'], value: 'Força' },
      { id: 'fisico.forma', label: 'Forma Física', type: 1, inputType: 'textarea', value: 'Descrição da forma física...' },
      { id: 'fisico.habito1', label: 'Atividade', type: 3, inputType: 'text', value: 'Musculação' },
      { id: 'fisico.habito2', label: 'Dieta', type: 3, inputType: 'text', value: 'Balanceada' },
    ]
  },
  {
    id: 'geral',
    name: 'GERAL',
    level: 0,
    levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS.geral.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}),
    arenas: [
        { id: 'arena_outros', assetId: 'geral', name: 'Outros', description: 'Arena para ações gerais não categorizadas.', icon: '🗂️', actionIds: [] }
    ],
    slots: []
  },
];
