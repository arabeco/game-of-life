import { Asset, Skin, Mood } from './types';

// Default empty value for image slots
const emptyImage = { imageUrl: '', caption: '' };

export const SKINS_DATA: Skin[] = [
  { id: 'GOLD', name: 'GOLD', color: '#d4af37' },
  { id: 'CYBER', name: 'CYBER', color: '#00d9ff' },
  { id: 'FROST', name: 'FROST', color: '#92d4f3' },
  { id: 'EMBER', name: 'EMBER', color: '#ff6a00' },
  { id: 'AURORA', name: 'AURORA', color: '#5effa5' },
  { id: 'VOID', name: 'VOID', color: '#a95eff' },
];

export const BORDERS_DATA: Skin[] = [
  { id: 'DISCIPLINADO', name: 'Disciplinado', color: '#c0c0c0', imageUrl: 'https://i.imgur.com/dQxDD1A.png' },
  { id: 'GELIDA', name: 'Gélida', color: '#a3c2d1', imageUrl: 'https://i.imgur.com/h9yV7lP.png' },
];

export const BANNERS_DATA = [
    { id: 'grao_mestre', name: 'Grão Mestre', url: 'https://i.imgur.com/8d23RLG.png' },
    { id: 'disciplinado', name: 'Disciplinado', url: 'https://i.imgur.com/L7d2nZ1.png' },
    { id: 'disciplinado_guerreiro', name: 'Disciplinado (Guerreiro)', url: 'https://i.imgur.com/vnYNisP.png' },
    { id: 'soberano', name: 'Soberano', url: 'https://i.imgur.com/Y38s2ms.png' },
];

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
    "Nível 1: Estou perdido em pensamentos, raramente presente.",
    "Nível 2: Ocasionalmente, percebo a beleza ao meu redor.",
    "Nível 3: Às vezes sinto uma breve gratidão, mas o ceticismo domina.",
    "Nível 4: Começo a praticar a atenção plena, mas me distraio facilmente.",
    "Nível 5: A gratidão se torna um hábito diário, mesmo que forçado.",
    "Nível 6: Sinto uma conexão mais profunda com o momento presente.",
    "Nível 7: A paz interior surge com mais frequência em meu dia a dia.",
    "Nível 8: Vejo a interconexão de todas as coisas com clareza.",
    "Nível 9: A consciência plena é meu estado natural, não um esforço.",
    "Nível 10: Vivo em um estado de fluxo, uno com o momento presente."
  ],
  espiritualidade: [
    "Nível 1: Nego qualquer dimensão além do material.",
    "Nível 2: Questiono a existência de algo maior, mas com ceticismo.",
    "Nível 3: Exploro diferentes filosofias, mas sem compromisso.",
    "Nível 4: Adoto uma prática espiritual, mas de forma irregular.",
    "Nível 5: Minha prática se torna consistente e significativa.",
    "Nível 6: Sinto uma presença ou energia superior em minha vida.",
    "Nível 7: A fé (ou confiança no universo) guia minhas decisões.",
    "Nível 8: Experimento momentos de transcendência e unidade.",
    "Nível 9: Minha vida é uma expressão da minha verdade espiritual.",
    "Nível 10: Sinto-me em comunhão constante com o divino/universo."
  ],
  'espaco-mental': [
    "Nível 1: Minha mente é um caos de pensamentos negativos e reativos.",
    "Nível 2: Reconheço meus padrões de pensamento, mas não consigo mudá-los.",
    "Nível 3: Começo a desafiar crenças limitantes com algum sucesso.",
    "Nível 4: Pratico técnicas para acalmar a mente, como meditação.",
    "Nível 5: Consigo observar meus pensamentos sem me identificar com eles.",
    "Nível 6: Escolho conscientemente minhas reações em vez de ser reativo.",
    "Nível 7: Minha mente se torna uma ferramenta a meu serviço, não meu mestre.",
    "Nível 8: Cultivo clareza e foco com facilidade.",
    "Nível 9: A paz mental é meu estado padrão, mesmo em meio ao caos.",
    "Nível 10: Minha mente é um santuário de criatividade e sabedoria."
  ],
  projetos: [
    "Nível 1: Tenho ideias, mas nunca começo nada.",
    "Nível 2: Começo projetos, mas desisto na primeira dificuldade.",
    "Nível 3: Consigo completar pequenos projetos com muito esforço.",
    "Nível 4: Aprendo a planejar e organizar minhas ideias de forma eficaz.",
    "Nível 5: Executo projetos de médio prazo com consistência.",
    "Nível 6: A criatividade flui e encontro soluções inovadoras.",
    "Nível 7: Colaboro efetivamente com outros para realizar grandes visões.",
    "Nível 8: Meus projetos impactam positivamente minha vida e a dos outros.",
    "Nível 9: Sou uma fonte de inspiração e realização criativa.",
    "Nível 10: Manifesto minhas visões no mundo com maestria e propósito."
  ],
  proposito: [
    "Nível 1: Sinto-me perdido, sem direção ou sentido na vida.",
    "Nível 2: Busco um propósito, mas sinto que nada me preenche.",
    "Nível 3: Identifico meus valores, mas não sei como aplicá-los.",
    "Nível 4: Experimento diferentes caminhos em busca de alinhamento.",
    "Nível 5: Defino uma missão de vida que ressoa com minha verdade.",
    "Nível 6: Minhas ações diárias começam a refletir minha missão.",
    "Nível 7: Meu trabalho e vida pessoal estão alinhados com meu propósito.",
    "Nível 8: Sinto uma profunda sensação de significado e contribuição.",
    "Nível 9: Inspiro outros a encontrarem e viverem seus propósitos.",
    "Nível 10: Minha vida é a personificação do meu propósito."
  ],
  conexoes: [
    "Nível 1: Sinto-me isolado e desconectado dos outros.",
    "Nível 2: Tenho relacionamentos superficiais e baseados em necessidade.",
    "Nível 3: Começo a praticar a escuta ativa e a empatia.",
    "Nível 4: Estabeleço limites saudáveis em meus relacionamentos.",
    "Nível 5: Cultivo amizades genuínas e de apoio mútuo.",
    "Nível 6: Sou capaz de expressar amor e vulnerabilidade de forma autêntica.",
    "Nível 7: Meus relacionamentos são fontes de crescimento e alegria.",
    "Nível 8: Crio uma comunidade forte e unida ao meu redor.",
    "Nível 9: Minhas conexões transcendem o ego e se baseiam na alma.",
    "Nível 10: Sou um catalisador de amor e união no mundo."
  ],
  financas: [
    "Nível 1: Estou constantemente endividado e ansioso com dinheiro.",
    "Nível 2: Consigo pagar as contas, mas vivo de salário em salário.",
    "Nível 3: Crio um orçamento e começo a controlar meus gastos.",
    "Nível 4: Construo uma reserva de emergência e quito dívidas ruins.",
    "Nível 5: Começo a investir para o futuro de forma consistente.",
    "Nível 6: Minha renda passiva começa a crescer.",
    "Nível 7: Tenho clareza sobre meus objetivos e plano financeiro.",
    "Nível 8: O dinheiro se torna uma ferramenta para liberdade e impacto.",
    "Nível 9: Alcanço a independência financeira.",
    "Nível 10: Uso minha riqueza para criar um legado e ajudar os outros."
  ],
  trabalho: [
    "Nível 1: Detesto meu trabalho e sinto-me estagnado.",
    "Nível 2: Faço o mínimo necessário para manter o emprego.",
    "Nível 3: Busco desenvolver novas habilidades, mas sem foco.",
    "Nível 4: Encontro um trabalho que se alinha melhor com meus interesses.",
    "Nível 5: Torno-me proficiente e valorizado em minha área.",
    "Nível 6: Encontro prazer e desafio no meu trabalho diário.",
    "Nível 7: Sou reconhecido como um especialista ou líder.",
    "Nível 8: Meu trabalho contribui para algo maior que eu.",
    "Nível 9: Inovo e crio valor de forma excepcional em minha carreira.",
    "Nível 10: Meu trabalho é uma expressão de minha maestria e paixão."
  ],
  hobbies: [
    "Nível 1: Não tenho tempo ou energia para hobbies.",
    "Nível 2: Meus hobbies são passivos, como assistir TV.",
    "Nível 3: Experimento novas atividades, mas nada me prende.",
    "Nível 4: Encontro um hobby que me desafia e me dá prazer.",
    "Nível 5: Dedico tempo regularmente para minhas paixões.",
    "Nível 6: Atinjo um nível de habilidade que me orgulha.",
    "Nível 7: Meus hobbies são uma fonte de relaxamento e criatividade.",
    "Nível 8: Conecto-me com outras pessoas através dos meus interesses.",
    "Nível 9: Meus hobbies se tornam uma parte essencial da minha identidade.",
    "Nível 10: Alcanço um estado de fluxo e maestria em minhas paixões."
  ],
  fisico: [
    "Nível 1: Negligencio completamente minha saúde física.",
    "Nível 2: Tenho hábitos prejudiciais (má alimentação, sedentarismo).",
    "Nível 3: Tento me exercitar e comer melhor, mas sou inconsistente.",
    "Nível 4: Adoto uma rotina de exercícios e alimentação mais saudável.",
    "Nível 5: Meu corpo se torna mais forte, flexível e com mais energia.",
    "Nível 6: O bem-estar físico se torna um pilar da minha vida.",
    "Nível 7: Escuto meu corpo e atendo às suas necessidades com sabedoria.",
    "Nível 8: Supero meus limites e atinjo metas físicas desafiadoras.",
    "Nível 9: Meu corpo é um templo de vitalidade e alto desempenho.",
    "Nível 10: Irradio saúde e inspiro outros a cuidarem de si mesmos."
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