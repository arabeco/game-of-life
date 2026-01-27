import { supabase, supabaseConfig } from "./src/lib/supabaseClient.js";

window.__APP_LOADED__ = true;

const STORAGE_KEY = "game_of_life.module1_dna";
const PLANNER_KEY = "game_of_life.planner";
const ARENAS_KEY = "game_of_life.arenas";
const LOGIN_KEY = "game_of_life.last_login";
const HIATO_KEY = "game_of_life.hiato_active";
const GLITCH_KEY = "game_of_life.glitch_until";
const MODE_KEY = "game_of_life.mastery_mode";
const V2_RESET_KEY = "game_of_life.v2_reset";
const PROFILE_KEY = "game_of_life.profile";
const MISSIONS_KEY = "game_of_life.missions";
const HOLD_DURATION_MS = 4000;
const DISABLE_LOCAL_STORAGE = true;

const safeLocalGet = (key) => {
  if (DISABLE_LOCAL_STORAGE) return null;
  return localStorage.getItem(key);
};

const safeLocalSet = (key, value) => {
  if (DISABLE_LOCAL_STORAGE) return;
  localStorage.setItem(key, value);
};

const safeLocalRemove = (key) => {
  if (DISABLE_LOCAL_STORAGE) return;
  localStorage.removeItem(key);
};

const SEPHIROT = [
  { id: "conexao", label: "CONSCI├èNCIA", row: 1, col: 2 },
  { id: "mente", label: "ESPA├çO MENTAL", row: 2, col: 1 },
  { id: "espiritualidade", label: "ESPIRITUALIDADE", row: 2, col: 3 },
  { id: "verdade", label: "PROP├ôSITO", row: 3, col: 1 },
  { id: "inspiracao", label: "PROJETOS", row: 3, col: 3 },
  { id: "amor", label: "CONEX├òES", row: 4, col: 2 },
  { id: "trabalho", label: "TRABALHO/ESTUDOS", row: 5, col: 1 },
  { id: "financas", label: "FINAN├çAS", row: 5, col: 3 },
  { id: "autenticidade", label: "HOBBIES", row: 6, col: 2 },
  { id: "fisico", label: "F├ìSICO", row: 7, col: 2 },
];

const LABEL_BY_ID = new Map(SEPHIROT.map((asset) => [asset.id, asset.label]));
const ICON_BY_ID = {
  fisico: "dumbbell",
  mente: "brain",
  espiritualidade: "sparkles",
  verdade: "target",
  inspiracao: "briefcase",
  amor: "users",
  financas: "wallet",
  trabalho: "book-open",
  autenticidade: "gamepad-2",
  conexao: "crown",
};
const BRONZE_ICONS = ["dumbbell", "book", "code", "dollar-sign", "flame", "leaf", "coffee", "music"];
const ARENA_ICONS = [
  "star",
  "shield",
  "gem",
  "target",
  "trophy",
  "crown",
  "flag",
  "sparkles",
  "zap",
  "swords",
  "briefcase",
  ...BRONZE_ICONS,
];
const ALLIANCE_MOCK = ["@vitali", "@nyx", "@atlas", "@onyx"];
const SLOT_ICON_BY_ID = {
  "financas.ativo1": "car",
  "financas.ativo2": "building-2",
  "financas.ativo3": "briefcase",
  "trabalho.personal": "dumbbell",
};
const MASTERY_PHRASES = {
  conexao: [
    "N├¡vel 1: Sinto-me totalmente desconectado; a vida ├® um caos sem prop├│sito.",
    "N├¡vel 2: Raramente percebo beleza ou ordem; sinto-me isolado.",
    "N├¡vel 3: ├Çs vezes sinto uma breve gratid├úo, mas o ceticismo domina.",
    "N├¡vel 4: Come├ºo a praticar gratid├úo, mas ainda me sinto v├¡tima das circunst├óncias.",
    "N├¡vel 5: Pratico a gratid├úo diariamente e percebo as primeiras sincronicidades.",
    "N├¡vel 6: Sinto uma conex├úo frequente com a natureza e com o fluxo da vida.",
    "N├¡vel 7: Confio no processo da vida; a gratid├úo ├® um estado quase constante.",
    "N├¡vel 8: Percebo a interconex├úo entre todos os eventos e pessoas.",
    "N├¡vel 9: Vivo em harmonia com as leis universais; paz profunda e duradoura.",
    "N├¡vel 10: Estado de presen├ºa absoluta; sinto a Unidade com o Todo em cada respira├º├úo.",
  ],
  espiritualidade: [
    "N├¡vel 1: Sem qualquer pr├ítica ou cren├ºa; vazio espiritual absoluto.",
    "N├¡vel 2: Curiosidade vaga, mas sem disciplina ou rituais.",
    "N├¡vel 3: Pratico rituais espor├ídicos quando estou em crise.",
    "N├¡vel 4: Tenho um altar ou espa├ºo, mas raramente o utilizo com foco.",
    "N├¡vel 5: Rituais semanais estabelecidos; sinto o despertar da intui├º├úo.",
    "N├¡vel 6: Pr├ítica di├íria constante; sinto prote├º├úo e orienta├º├úo espiritual.",
    "N├¡vel 7: Meus rituais s├úo minha ├óncora; di├ílogo fluido com o sagrado.",
    "N├¡vel 8: Intui├º├úo agu├ºada; recebo orienta├º├Áes claras atrav├®s de rituais.",
    "N├¡vel 9: Vida consagrada; cada a├º├úo ├® um ato de conex├úo espiritual.",
    "N├¡vel 10: Mestria espiritual; canaliza├º├úo direta e comunh├úo ininterrupta.",
  ],
  mente: [
    "N├¡vel 1: Mente barulhenta, ansiosa e imposs├¡vel de controlar.",
    "N├¡vel 2: Pensamentos negativos dominam; sono perturbado pelo estresse.",
    "N├¡vel 3: Tento meditar, mas me distraio em segundos; foco muito baixo.",
    "N├¡vel 4: Consigo momentos breves de sil├¬ncio, mas a ansiedade retorna r├ípido.",
    "N├¡vel 5: Medita├º├úo di├íria de 10 min; come├ºo a observar os pensamentos.",
    "N├¡vel 6: Capacidade de manter o foco por per├¡odos longos; mente clara.",
    "N├¡vel 7: Dom├¡nio sobre as rea├º├Áes emocionais; paz mental resiliente.",
    "N├¡vel 8: Estado de Flow acessado ├á vontade; alta clareza cognitiva.",
    "N├¡vel 9: Sil├¬ncio interior profundo; a mente ├® uma ferramenta perfeitamente afiada.",
    "N├¡vel 10: Equanimidade absoluta; consci├¬ncia pura acima de qualquer turbul├¬ncia.",
  ],
  verdade: [
    "N├¡vel 1: N├úo sei quem sou; vivo baseado nas expectativas dos outros.",
    "N├¡vel 2: Evito olhar para minhas sombras; minto para mim mesmo com frequ├¬ncia.",
    "N├¡vel 3: Sinto que algo est├í errado, mas tenho medo de olhar para dentro.",
    "N├¡vel 4: Come├ºo a identificar meus padr├Áes, mas ainda me autossaboto.",
    "N├¡vel 5: Honestidade constante sobre minhas falhas; busca ativa por verdade.",
    "N├¡vel 6: Clareza sobre meu MTP (Prop├│sito Transformativo Massivo).",
    "N├¡vel 7: Integridade total entre pensamento, palavra e a├º├úo.",
    "N├¡vel 8: Conhecimento profundo da pr├│pria psique e arqu├®tipos.",
    "N├¡vel 9: Sabedoria pessoal cristalizada; vivo minha verdade sem medo.",
    "N├¡vel 10: Alinhamento supremo; minha identidade ├® um reflexo do meu destino.",
  ],
  inspiracao: [
    "N├¡vel 1: Sem sonhos ou projetos; a vida ├® uma repeti├º├úo mon├│tona.",
    "N├¡vel 2: Tenho ideias, mas nunca come├ºo nada por medo do fracasso.",
    "N├¡vel 3: Come├ºo projetos, mas desisto na primeira dificuldade.",
    "N├¡vel 4: Trabalho em projetos, mas sem consist├¬ncia ou vis├úo clara.",
    "N├¡vel 5: Um projeto ativo e consistente; criatividade fluindo semanalmente.",
    "N├¡vel 6: Criatividade estrat├®gica; executo ideias com efici├¬ncia.",
    "N├¡vel 7: Projetos geram impacto real; sinto-me inspirado diariamente.",
    "N├¡vel 8: Magnetismo criativo; ideias e recursos convergem para mim.",
    "N├¡vel 9: Legado em constru├º├úo; meus projetos expressam minha ess├¬ncia.",
    "N├¡vel 10: G├¬nio criativo; canaliza├º├úo ininterrupta de inova├º├úo e beleza.",
  ],
  amor: [
    "N├¡vel 1: Relacionamentos t├│xicos ou isolamento total com rancor.",
    "N├¡vel 2: Dificuldade em confiar; sinto-me carente ou defensivo.",
    "N├¡vel 3: Rela├º├Áes superficiais; medo de vulnerabilidade.",
    "N├¡vel 4: Tento me abrir, mas ainda carrego muitas m├ígoas do passado.",
    "N├¡vel 5: Relacionamentos saud├íveis; pr├ítica ativa de perd├úo e escuta.",
    "N├¡vel 6: C├¡rculo ├¡ntimo de alta confian├ºa; sinto-me valorizado.",
    "N├¡vel 7: Capacidade de amar incondicionalmente sem perder os limites.",
    "N├¡vel 8: Mentor e apoio para outros; rela├º├Áes baseadas em crescimento.",
    "N├¡vel 9: Irradio compaix├úo; presen├ºa que cura e acolhe.",
    "N├¡vel 10: Uni├úo profunda; mestre em criar e nutrir v├¡nculos sagrados.",
  ],
  financas: [
    "N├¡vel 1: Escassez total; d├¡vidas fora de controle e medo do amanh├ú.",
    "N├¡vel 2: Vivo para pagar contas; o dinheiro ├® fonte de estresse.",
    "N├¡vel 3: Ganho o suficiente para sobreviver, mas n├úo tenho reservas.",
    "N├¡vel 4: Dificuldade em gerir o que ganho; mentalidade de escassez.",
    "N├¡vel 5: Or├ºamento controlado; investimentos iniciados.",
    "N├¡vel 6: Fluxo de caixa positivo; clareza total sobre ativos.",
    "N├¡vel 7: Independ├¬ncia financeira crescendo; o dinheiro trabalha para mim.",
    "N├¡vel 8: Abund├óncia gerada por prop├│sito; recursos sobram para sonhos.",
    "N├¡vel 9: Liberdade total; riqueza flui de m├║ltiplas fontes est├íveis.",
    "N├¡vel 10: Consci├¬ncia de prosperidade infinita; mestre da manifesta├º├úo.",
  ],
  trabalho: [
    "N├¡vel 1: Odeio minha rotina; sinto-me escravizado pelas tarefas.",
    "N├¡vel 2: Trabalho apenas pelo dinheiro; produtividade baixa.",
    "N├¡vel 3: Busco melhorar, mas sinto-me perdido profissionalmente.",
    "N├¡vel 4: Executo minhas tarefas, mas sem brilho ou excel├¬ncia.",
    "N├¡vel 5: Profissional competente; estudo e evoluo constantemente.",
    "N├¡vel 6: Excel├¬ncia reconhecida; entrego valor real ao mundo.",
    "N├¡vel 7: Trabalho alinhado ao prop├│sito; satisfa├º├úo no esfor├ºo.",
    "N├¡vel 8: Autoridade na minha ├írea; mestre em gest├úo de tempo.",
    "N├¡vel 9: Lideran├ºa inspiradora; meu trabalho ├® minha arte.",
    "N├¡vel 10: Maestria profissional; impacto global atrav├®s da voca├º├úo.",
  ],
  autenticidade: [
    "N├¡vel 1: Sem hobbies; tempo gasto em distra├º├Áes vazias.",
    "N├¡vel 2: Sinto t├®dio; esqueci o que me dava prazer.",
    "N├¡vel 3: Tenho um hobby, mas sinto culpa ao dedicar tempo.",
    "N├¡vel 4: Pratico hobbies raramente; falta de autenticidade.",
    "N├¡vel 5: Tempo semanal sagrado para hobbies; renova├º├úo de energia.",
    "N├¡vel 6: Desenvolvo habilidades ├║nicas por puro prazer.",
    "N├¡vel 7: Minha personalidade brilha atrav├®s dos meus interesses.",
    "N├¡vel 8: Mestre em um hobby; criatividade e divers├úo integradas.",
    "N├¡vel 9: Estilo de vida aut├¬ntico; sou fiel a mim mesmo sempre.",
    "N├¡vel 10: Express├úo pura do Ser; minha exist├¬ncia ├® uma arte ├║nica.",
  ],
  fisico: [
    "N├¡vel 1: Sedentarismo total; corpo fraco ou sem energia.",
    "N├¡vel 2: Alimenta├º├úo p├®ssima; cansa├ºo cr├┤nico e sono ruim.",
    "N├¡vel 3: Tento treinar, mas desisto em duas semanas.",
    "N├¡vel 4: Treino espor├ídico; desconforto com a pr├│pria forma.",
    "N├¡vel 5: Treino 3x por semana; consci├¬ncia alimentar iniciada.",
    "N├¡vel 6: Corpo atl├®tico e funcional; energia est├ível.",
    "N├¡vel 7: Alta performance f├¡sica; disciplina inabal├ível.",
    "N├¡vel 8: Conex├úo mente-m├║sculo profunda; vitalidade radiante.",
    "N├¡vel 9: Templo f├¡sico otimizado; sa├║de m├íxima.",
    "N├¡vel 10: Express├úo m├íxima da biologia; vitalidade inesgot├ível.",
  ],
};

const stripMasteryLevelPrefix = (text) => {
  if (!text) return "";
  // Remove "N├¡vel X: " / "Nivel X - " etc.
  return String(text).replace(/^\s*n[├¡i]vel\s*\d+\s*[:\-ÔÇôÔÇö]\s*/i, "");
};
const ASSET_TO_PHRASE = {
  conexao: "conexao",
  espiritualidade: "espiritualidade",
  mente: "mente",
  verdade: "verdade",
  inspiracao: "inspiracao",
  amor: "amor",
  financas: "financas",
  trabalho: "trabalho",
  autenticidade: "autenticidade",
  fisico: "fisico",
};
const PROTOCOL_SLOTS = {
  conexao: [
    { id: "conexao.lema", label: "Lema de Vida", type: "rect-wide" },
    { id: "conexao.crenca1", label: "Cren├ºa 1", type: "rect-wide" },
    { id: "conexao.crenca2", label: "Cren├ºa 2", type: "rect-wide" },
    { id: "conexao.crenca3", label: "Cren├ºa 3", type: "rect-wide" },
  ],
  espiritualidade: [
    { id: "espiritualidade.sistema", label: "Sistema", type: "rect-wide" },
    {
      id: "espiritualidade.entidade1",
      label: "Entidade L├¡der",
      type: "square-2",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "titulo", label: "Titulo" },
      ],
    },
    {
      id: "espiritualidade.entidade2",
      label: "Entidade Protetora",
      type: "square-2",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "titulo", label: "Titulo" },
      ],
    },
    {
      id: "espiritualidade.entidade3",
      label: "Entidade Guardi├ú",
      type: "square-2",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "titulo", label: "Titulo" },
      ],
    },
  ],
  mente: [
    { id: "mente.filosofia", label: "Filosofia Operacional", type: "rect-wide" },
    {
      id: "mente.imagem",
      label: "Imagem",
      type: "square-2",
      fields: [{ key: "image", label: "Imagem" }, { key: "titulo", label: "Titulo" }],
    },
  ],
  verdade: [
    { id: "verdade.mtp", label: "Miss├úo de Vida", type: "rect-wide" },
    { id: "verdade.trait1", label: "Trait 1", type: "rect" },
    { id: "verdade.trait2", label: "Trait 2", type: "rect" },
    { id: "verdade.signo", label: "Signo", type: "rect" },
    { id: "verdade.mbti", label: "MBTI", type: "rect" },
  ],
  inspiracao: [
    {
      id: "inspiracao.proj1",
      label: "Projeto 1",
      type: "square-2",
      fields: [
        { key: "image", label: "Imagem" },
        { key: "titulo", label: "Titulo" },
      ],
    },
    {
      id: "inspiracao.proj2",
      label: "Projeto 2",
      type: "square-2",
      fields: [
        { key: "image", label: "Imagem" },
        { key: "titulo", label: "Titulo" },
      ],
    },
    {
      id: "inspiracao.proj3",
      label: "Projeto 3",
      type: "square-2",
      fields: [
        { key: "image", label: "Imagem" },
        { key: "titulo", label: "Titulo" },
      ],
    },
    {
      id: "inspiracao.insp1",
      label: "Inspira├º├úo 1",
      type: "square-2",
      fields: [
        { key: "image", label: "Imagem" },
        { key: "titulo", label: "Titulo" },
      ],
    },
    {
      id: "inspiracao.insp2",
      label: "Inspira├º├úo 2",
      type: "square-2",
      fields: [
        { key: "image", label: "Imagem" },
        { key: "titulo", label: "Titulo" },
      ],
    },
    {
      id: "inspiracao.insp3",
      label: "Inspira├º├úo 3",
      type: "square-2",
      fields: [
        { key: "image", label: "Imagem" },
        { key: "titulo", label: "Titulo" },
      ],
    },
  ],
  amor: [
    {
      id: "amor.conexao1",
      label: "Conex├úo 1",
      type: "square-2",
      fields: [
        { key: "image", label: "Imagem" },
        { key: "titulo", label: "Titulo" },
      ],
    },
    {
      id: "amor.conexao2",
      label: "Conex├úo 2",
      type: "square-2",
      fields: [
        { key: "image", label: "Imagem" },
        { key: "titulo", label: "Titulo" },
      ],
    },
    {
      id: "amor.conexao3",
      label: "Conex├úo 3",
      type: "square-2",
      fields: [
        { key: "image", label: "Imagem" },
        { key: "titulo", label: "Titulo" },
      ],
    },
    {
      id: "amor.conexao4",
      label: "Conex├úo 4",
      type: "square-2",
      fields: [
        { key: "image", label: "Imagem" },
        { key: "titulo", label: "Titulo" },
      ],
    },
    {
      id: "amor.conexao5",
      label: "Conex├úo 5",
      type: "square-2",
      fields: [
        { key: "image", label: "Imagem" },
        { key: "titulo", label: "Titulo" },
      ],
    },
    {
      id: "amor.conexao6",
      label: "Conex├úo 6",
      type: "square-2",
      fields: [
        { key: "image", label: "Imagem" },
        { key: "titulo", label: "Titulo" },
      ],
    },
  ],
  financas: [
    { id: "financas.renda", label: "Renda Mensal", type: "rect", fields: [{ key: "valor", label: "Renda", slider: { min: 0, max: 50000, step: 100, unit: "R$" } }] },
    { id: "financas.gasto", label: "Gasto Mensal", type: "rect", fields: [{ key: "valor", label: "Gasto", slider: { min: 0, max: 50000, step: 100, unit: "R$" } }] },
    { id: "financas.patrimonio", label: "Patrim├┤nio L├¡quido", type: "rect-wide", fields: [{ key: "valor", label: "Patrim├┤nio", slider: { min: 0, max: 500000, step: 100, unit: "R$" } }] },
    { id: "financas.ativo1", label: "Ativo 1", type: "square-2", fields: [{ key: "image", label: "Imagem" }, { key: "titulo", label: "Titulo" }] },
    { id: "financas.ativo2", label: "Ativo 2", type: "square-2", fields: [{ key: "image", label: "Imagem" }, { key: "titulo", label: "Titulo" }] },
    { id: "financas.ativo3", label: "Ativo 3", type: "square-2", fields: [{ key: "image", label: "Imagem" }, { key: "titulo", label: "Titulo" }] },
  ],
  trabalho: [
    { id: "trabalho.pec", label: "Classe 1", type: "rect" },
    { id: "trabalho.pec_nivel", label: "Profici├¬ncia", type: "rect" },
    { id: "trabalho.unip", label: "Classe 2", type: "rect" },
    { id: "trabalho.unip_nivel", label: "Profici├¬ncia", type: "rect" },
    {
      id: "trabalho.experi1",
      label: "Experi├¬ncia 1",
      type: "square-2",
      fields: [{ key: "image", label: "Imagem" }, { key: "titulo", label: "Titulo" }],
    },
    {
      id: "trabalho.experi2",
      label: "Experi├¬ncia 2",
      type: "square-2",
      fields: [{ key: "image", label: "Imagem" }, { key: "titulo", label: "Titulo" }],
    },
    {
      id: "trabalho.experi3",
      label: "Experi├¬ncia 3",
      type: "square-2",
      fields: [{ key: "image", label: "Imagem" }, { key: "titulo", label: "Titulo" }],
    },
  ],
  autenticidade: [
    {
      id: "autenticidade.hobby1",
      label: "Hobby 1",
      type: "square-2",
      fields: [{ key: "image", label: "Imagem" }, { key: "titulo", label: "Titulo" }],
    },
    {
      id: "autenticidade.hobby2",
      label: "Hobby 2",
      type: "square-2",
      fields: [{ key: "image", label: "Imagem" }, { key: "titulo", label: "Titulo" }],
    },
    {
      id: "autenticidade.hobby3",
      label: "Hobby 3",
      type: "square-2",
      fields: [{ key: "image", label: "Imagem" }, { key: "titulo", label: "Titulo" }],
    },
    {
      id: "autenticidade.hobby4",
      label: "Hobby 4",
      type: "square-2",
      fields: [{ key: "image", label: "Imagem" }, { key: "titulo", label: "Titulo" }],
    },
    {
      id: "autenticidade.hobby5",
      label: "Hobby 5",
      type: "square-2",
      fields: [{ key: "image", label: "Imagem" }, { key: "titulo", label: "Titulo" }],
    },
    {
      id: "autenticidade.hobby6",
      label: "Hobby 6",
      type: "square-2",
      fields: [{ key: "image", label: "Imagem" }, { key: "titulo", label: "Titulo" }],
    },
  ],
  fisico: [
    { id: "fisico.idade", label: "Idade", type: "rect", fields: [{ key: "value", label: "Idade", slider: { min: 1, max: 100, step: 1 } }] },
    { id: "fisico.genero", label: "G├¬nero", type: "rect" },
    { id: "fisico.peso", label: "Peso", type: "rect", fields: [{ key: "value", label: "Peso", slider: { min: 30, max: 200, step: 1, unit: "kg" } }] },
    { id: "fisico.altura", label: "Altura", type: "rect", fields: [{ key: "value", label: "Altura", slider: { min: 140, max: 220, step: 1, unit: "cm" } }] },
    { id: "fisico.forma", label: "Forma F├¡sica", type: "rect-wide" },
  ],
};

const LAYOUT_MESTRE = {
  conexao: [
    { t: "tipo1", k: "lema", l: "Lema de Vida" },
    { t: "title", l: "CREN├çAS" },
    { t: "tipo3", k: "c1" },
    { t: "tipo3", k: "c2" },
    { t: "tipo3", k: "c3" },
  ],
  espiritualidade: [
    { t: "custom", s: "grid-column: 2/6", k: "sis", l: "Sistema" },
    { t: "title", l: "SANTU├üRIO" },
    { t: "tipo2", k: "e1" },
    { t: "tipo2", k: "e2" },
    { t: "tipo2", k: "e3", s: "grid-column: span 6" },
  ],
  mente: [
    { t: "tipo1", k: "filo", l: "Filosofia" },
    { t: "custom", s: "grid-column: 3/5", k: "img", l: "Imagem" },
  ],
  verdade: [
    { t: "tipo1", k: "mtp", l: "MTP" },
    { t: "tipo2", k: "tr1" },
    { t: "tipo2", k: "tr2" },
    { t: "tipo2", k: "tr3" },
    { t: "tipo2", k: "tr4" },
  ],
  inspiracao: [
    { t: "title", l: "PROJETOS" },
    { t: "tipo3", k: "p1" },
    { t: "tipo3", k: "p2" },
    { t: "tipo3", k: "p3" },
    { t: "title", l: "INSPIRA├ç├òES" },
    { t: "tipo3", k: "i1" },
    { t: "tipo3", k: "i2" },
    { t: "tipo3", k: "i3" },
  ],
  amor: [
    { t: "title", l: "FAM├ìLIA" },
    { t: "tipo3", k: "f1" },
    { t: "tipo3", k: "f2" },
    { t: "tipo3", k: "f3" },
    { t: "title", l: "AMIGOS" },
    { t: "tipo3", k: "am1" },
    { t: "tipo3", k: "am2" },
    { t: "tipo3", k: "am3" },
  ],
  financas: [
    { t: "tipo2", k: "ren", l: "Renda Mensal" },
    { t: "tipo2", k: "gasto", l: "Gasto Mensal" },
    { t: "tipo2", k: "pat", l: "Patrim├┤nio" },
    { t: "title", l: "ATIVOS" },
    { t: "tipo3", k: "a1" },
    { t: "tipo3", k: "a2" },
    { t: "tipo3", k: "a3" },
  ],
  trabalho: [
    { t: "tipo1", k: "cl1", c: "prof-base" },
    { t: "tipo1", k: "cl2", c: "prof-base" },
    { t: "title", l: "EXPERI├èNCIAS" },
    { t: "tipo3", k: "ex1" },
    { t: "tipo3", k: "ex2" },
    { t: "tipo3", k: "ex3" },
  ],
  autenticidade: [
    { t: "title", l: "HOBBIES" },
    { t: "tipo3", k: "h1" },
    { t: "tipo3", k: "h2" },
    { t: "tipo3", k: "h3" },
    { t: "tipo3", k: "h4" },
    { t: "tipo3", k: "h5" },
    { t: "tipo3", k: "h6" },
  ],
  fisico: [
    { t: "tipo3", k: "d1" },
    { t: "tipo3", k: "d2" },
    { t: "tipo3", k: "d3" },
    { t: "tipo3", k: "d4" },
    { t: "tipo1", k: "for", l: "Forma F├¡sica" },
  ],
};

const LAYOUT_KEY_TO_SLOT_ID = {
  conexao: { lema: "conexao.lema", c1: "conexao.crenca1", c2: "conexao.crenca2", c3: "conexao.crenca3" },
  espiritualidade: { sis: "espiritualidade.sistema", e1: "espiritualidade.entidade1", e2: "espiritualidade.entidade2", e3: "espiritualidade.entidade3" },
  mente: { filo: "mente.filosofia", img: "mente.imagem" },
  verdade: { mtp: "verdade.mtp", tr1: "verdade.trait1", tr2: "verdade.trait2", tr3: "verdade.signo", tr4: "verdade.mbti" },
  inspiracao: { p1: "inspiracao.proj1", p2: "inspiracao.proj2", p3: "inspiracao.proj3", i1: "inspiracao.insp1", i2: "inspiracao.insp2", i3: "inspiracao.insp3" },
  amor: { f1: "amor.conexao1", f2: "amor.conexao2", f3: "amor.conexao3", am1: "amor.conexao4", am2: "amor.conexao5", am3: "amor.conexao6" },
  financas: { ren: "financas.renda", gasto: "financas.gasto", pat: "financas.patrimonio", a1: "financas.ativo1", a2: "financas.ativo2", a3: "financas.ativo3" },
  trabalho: { cl1: "trabalho.pec", cl2: "trabalho.unip", ex1: "trabalho.experi1", ex2: "trabalho.experi2", ex3: "trabalho.experi3" },
  autenticidade: { h1: "autenticidade.hobby1", h2: "autenticidade.hobby2", h3: "autenticidade.hobby3", h4: "autenticidade.hobby4", h5: "autenticidade.hobby5", h6: "autenticidade.hobby6" },
  fisico: { d1: "fisico.idade", d2: "fisico.genero", d3: "fisico.peso", d4: "fisico.altura", for: "fisico.forma" },
};

const SLOT_LAYOUTS_URL = "./slot_layouts.json";
const LAYOUT_TYPE_CLASS_MAP = {
  tipo1: "rect-wide",
  tipo2: "rect",
  tipo3: "square-2",
};
const LAYOUT_TYPE_SPAN_MAP = {
  tipo1: 6,
  tipo2: 3,
  tipo3: 2,
};
const LAYOUT_TYPE_ROWSPAN_MAP = {
  tipo1: 1,
  tipo2: 1,
  tipo3: 3,
};
let slotLayoutsCache = null;
let slotLayoutsPromise = null;
let slotLayoutsLastRefresh = 0;

const normalizeAssetId = (assetId) => (assetId === "abundancia" ? "financas" : assetId);
const ASSET_ALIAS_MAP = {
  financas: ["financas", "abundancia"],
  abundancia: ["abundancia", "financas"],
};

const resolveAssetFromDNA = (dna, assetId) => {
  const aliases = ASSET_ALIAS_MAP[assetId] || [assetId];
  for (const id of aliases) {
    const asset = getAssetFromDNA(dna, id);
    if (asset) return asset;
  }
  return null;
};

const normalizeSlotIdAlias = (slotId) => {
  if (!slotId) return slotId;
  if (slotId.startsWith("abundancia.")) return slotId.replace(/^abundancia\./, "financas.");
  return slotId;
};

const migrateFinancasAsset = (dna) => {
  if (!dna || !Array.isArray(dna.assets)) return { dna, changed: false };
  const assets = dna.assets;
  const financeIndex = assets.findIndex((asset) => asset.id === "financas");
  const abundIndex = assets.findIndex((asset) => asset.id === "abundancia");
  if (abundIndex === -1 && financeIndex === -1) return { dna, changed: false };
  const source = abundIndex >= 0 ? assets[abundIndex] : assets[financeIndex];
  const target = financeIndex >= 0 ? assets[financeIndex] : { ...source, id: "financas" };
  const isSlotEmpty = (value) => {
    if (!value || typeof value !== "object") return true;
    return Object.values(value).every(
      (entry) => entry === null || entry === undefined || String(entry).trim() === "",
    );
  };

  if (!target.profileSlots || typeof target.profileSlots !== "object") {
    target.profileSlots = {};
  }
  if (!source.profileSlots || typeof source.profileSlots !== "object") {
    source.profileSlots = {};
  }
  const combinedProfileSlots = {};
  const addProfileSlot = (key, value) => {
    const normalizedKey = normalizeSlotIdAlias(key);
    if (
      combinedProfileSlots[normalizedKey] === undefined ||
      isSlotEmpty(combinedProfileSlots[normalizedKey])
    ) {
      combinedProfileSlots[normalizedKey] = value;
    }
  };
  Object.entries(target.profileSlots).forEach(([key, value]) => addProfileSlot(key, value));
  Object.entries(source.profileSlots).forEach(([key, value]) => addProfileSlot(key, value));
  target.profileSlots = combinedProfileSlots;

  const mergeSlotList = (list) =>
    Array.isArray(list)
      ? list.map((slot) => ({
          ...slot,
          id: normalizeSlotIdAlias(slot.id),
        }))
      : [];

  target.additionalSlots = mergeSlotList(target.additionalSlots || source.additionalSlots);
  target.extraSlots = mergeSlotList(target.extraSlots || source.extraSlots);
  target.level = Math.max(Number(target.level || 0), Number(source.level || 0));

  if (financeIndex === -1) {
    assets.push(target);
  } else {
    assets[financeIndex] = target;
  }
  if (abundIndex >= 0) {
    assets.splice(abundIndex, 1);
  }
  return { dna: { ...dna, assets }, changed: true };
};

const normalizeLayoutType = (type) => {
  if (!type) return null;
  const raw = String(type).trim().toLowerCase().replace(/\s+/g, "");
  if (["1", "t1", "tipo1", "type1"].includes(raw)) return "tipo1";
  if (["2", "t2", "tipo2", "type2"].includes(raw)) return "tipo2";
  if (["3", "t3", "tipo3", "type3"].includes(raw)) return "tipo3";
  return raw;
};

const loadSlotLayouts = (options = {}) => {
  const force = Boolean(options.force);
  if (force) {
    slotLayoutsCache = null;
    slotLayoutsPromise = null;
  }
  if (slotLayoutsCache) return Promise.resolve(slotLayoutsCache);
  if (slotLayoutsPromise) return slotLayoutsPromise;
  const cacheBust = force ? `?t=${Date.now()}` : "";
  slotLayoutsPromise = fetch(`${SLOT_LAYOUTS_URL}${cacheBust}`, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      slotLayoutsCache = data;
      slotLayoutsPromise = null;
      return slotLayoutsCache;
    })
    .catch((err) => {
      console.warn("[layout] Falha ao carregar slot_layouts.json", err);
      slotLayoutsPromise = null;
      return null;
    });
  return slotLayoutsPromise;
};

const getSlotLayoutForAsset = (assetId) =>
  slotLayoutsCache?.assets?.[normalizeAssetId(assetId)] || null;

const applySlotLayout = (assetId, slots) => {
  const layout = getSlotLayoutForAsset(assetId);
  if (!Array.isArray(layout) || layout.length === 0) return slots;
  const slotById = new Map(slots.map((slot) => [slot.id, slot]));
  const used = new Set();
  const arranged = [];
  layout.forEach((entry, index) => {
    const slotId = entry?.slotId ? String(entry.slotId) : null;
    const layoutType = normalizeLayoutType(entry?.type);
    const typeClass = layoutType ? LAYOUT_TYPE_CLASS_MAP[layoutType] : null;
    const baseSlot = slotId
      ? cloneSlotDef(slotById.get(slotId) || { id: slotId })
      : { id: `${assetId}.custom_${index + 1}` };
    if (entry?.title) baseSlot.label = String(entry.title);
    if (typeClass) baseSlot.type = typeClass;
    baseSlot.layoutRow = Number(entry?.row) || null;
    baseSlot.layoutCol = Number(entry?.col) || null;
    baseSlot.layoutType = layoutType || null;
    baseSlot.layoutOrder = index;
    arranged.push(baseSlot);
    if (slotId) used.add(slotId);
  });
  slots.forEach((slot) => {
    if (!used.has(slot.id)) arranged.push(slot);
  });
  return arranged;
};

const OPTIONAL_SLOTS_BY_ASSET = {
  espiritualidade: [
    { id: "espiritualidade.entidade3", label: "Entidade Extra", type: "rect-wide" },
  ],
};

const EXTRA_SLOT_TEMPLATES = {
  autenticidade: { baseId: "autenticidade.hobby", label: "Hobby", sampleId: "autenticidade.hobby1" },
  amor: { baseId: "amor.conexao", label: "Conexao", sampleId: "amor.conexao1" },
};

const cloneSlotDef = (slot) => JSON.parse(JSON.stringify(slot));

const getOptionalSlotsForAsset = (assetId) => OPTIONAL_SLOTS_BY_ASSET[assetId] || [];

const normalizeAdditionalSlots = (asset) => {
  if (!asset) return [];
  if (!Array.isArray(asset.additionalSlots)) {
    asset.additionalSlots = [];
  }
  return asset.additionalSlots;
};

const normalizeExtraSlots = (asset) => {
  if (!asset) return [];
  if (!Array.isArray(asset.extraSlots)) {
    asset.extraSlots = [];
  }
  return asset.extraSlots;
};

const hasSlotData = (data) => {
  if (!data || typeof data !== "object") return false;
  return Object.values(data).some((value) => value !== null && value !== undefined && String(value).trim() !== "");
};

const getLayoutItems = (assetId) => {
  const normalizedAssetId = normalizeAssetId(assetId);
  const layout = LAYOUT_MESTRE[normalizedAssetId];
  if (!Array.isArray(layout) || layout.length === 0) return [];
  const keyMap = LAYOUT_KEY_TO_SLOT_ID[normalizedAssetId] || {};
  const items = [];
  for (const entry of layout) {
    const t = entry?.t;
    if (t === "title") {
      items.push({ type: "title", label: entry.l || "" });
      continue;
    }
    const k = entry?.k;
    if (!k) continue;
    const slotId = keyMap[k];
    if (!slotId) continue;
    let slot = getSlotTemplateById(normalizedAssetId, slotId);
    if (!slot) slot = { id: slotId, label: entry.l || k, type: "rect" };
    else slot = cloneSlotDef(slot);
    if (entry.l) slot.label = String(entry.l);
    const layoutType = t === "custom" ? "custom" : t;
    items.push({
      type: "slot",
      key: k,
      layoutType,
      customStyle: entry?.s || null,
      extraClass: entry?.c || null,
      slot,
    });
  }
  return items;
};

const getDossierSlots = (assetId, asset = null) => {
  const normalizedAssetId = normalizeAssetId(assetId);
  const items = getLayoutItems(assetId);
  const slots = [];
  for (const it of items) {
    if (it.type === "slot" && it.slot) slots.push(it.slot);
  }
  return slots;
};

const getSlotTemplateById = (assetId, slotId) => {
  const base = PROTOCOL_SLOTS[assetId] || [];
  const optional = getOptionalSlotsForAsset(assetId);
  return (
    base.find((slot) => slot.id === slotId) ||
    optional.find((slot) => slot.id === slotId) ||
    null
  );
};

const buildExtraSlot = (assetId, asset) => {
  const template = EXTRA_SLOT_TEMPLATES[assetId];
  if (!template) return null;
  const baseSlot = getSlotTemplateById(assetId, template.sampleId);
  if (!baseSlot) return null;
  const baseId = template.baseId;
  const regex = new RegExp(`^${baseId}(\\d+)$`);
  const allIds = [
    ...(PROTOCOL_SLOTS[assetId] || []).map((slot) => slot.id),
    ...normalizeExtraSlots(asset).map((slot) => slot.id),
  ];
  let maxIndex = 0;
  allIds.forEach((id) => {
    const match = id.match(regex);
    if (match) {
      maxIndex = Math.max(maxIndex, Number(match[1]));
    }
  });
  const nextIndex = maxIndex + 1;
  const newSlot = cloneSlotDef(baseSlot);
  newSlot.id = `${baseId}${nextIndex}`;
  newSlot.label = `${template.label} ${nextIndex}`;
  return newSlot;
};

const getAddableSlotOptions = (assetId, asset) => {
  const options = [];
  const optional = getOptionalSlotsForAsset(assetId);
  const currentIds = new Set(getDossierSlots(assetId, asset).map((slot) => slot.id));
  optional.forEach((slot) => {
    if (!currentIds.has(slot.id)) {
      options.push({ kind: "optional", label: slot.label, slot });
    }
  });
  const template = EXTRA_SLOT_TEMPLATES[assetId];
  if (template) {
    options.push({ kind: "dynamic", label: `Adicionar ${template.label}` });
  }
  return options;
};

const getSlotOptions = () => {
  const options = [];
  const dna = seedDNAIfMissing();
  const assetsById = new Map(dna.assets.map((asset) => [asset.id, asset]));
  Object.keys(PROTOCOL_SLOTS).forEach((assetId) => {
    const asset = assetsById.get(assetId) || null;
    getDossierSlots(assetId, asset).forEach((slot) => {
      const slotId = slot.id.startsWith(`${assetId}.`) ? slot.id : `${assetId}.${slot.id}`;
      options.push({
        id: slotId,
        label: `${LABEL_BY_ID.get(assetId) ?? assetId} ┬À ${slot.label}`,
      });
    });
  });
  return options;
};
const WEEKDAYS = [
  { label: "SEG", key: "S" },
  { label: "TER", key: "T" },
  { label: "QUA", key: "Q" },
  { label: "QUI", key: "Q2" },
  { label: "SEX", key: "S2" },
  { label: "SAB", key: "S3" },
  { label: "DOM", key: "D" },
];
const WEEKDAY_KEY_BY_INDEX = ["D", "S", "T", "Q", "Q2", "S2", "S3"];

const getPlannerDateFromOffset = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + Number(offset || 0));
  return date;
};

const getWeekdayKeyForDate = (date) => WEEKDAY_KEY_BY_INDEX[date.getDay()];

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekStartDate = (date) => {
  const base = new Date(date);
  const day = base.getDay();
  const diff = (day + 6) % 7;
  base.setDate(base.getDate() - diff);
  base.setHours(0, 0, 0, 0);
  return base;
};

const getWeekDateKeyByIndex = (weekStart, index) => {
  const target = new Date(weekStart);
  target.setDate(weekStart.getDate() + index);
  return formatDateKey(target);
};

const getPlannedCountForWeek = (action, weekStart) => {
  const keys = new Set(WEEKDAYS.map((_, idx) => getWeekDateKeyByIndex(weekStart, idx)));
  const plannedSlots = Array.isArray(action.plannedSlots) ? action.plannedSlots : [];
  if (plannedSlots.length) {
    return plannedSlots.filter((slot) => keys.has(slot.dateKey)).length;
  }
  const planned = Array.isArray(action.plannedHistory) ? action.plannedHistory : [];
  return planned.filter((key) => keys.has(key)).length;
};

const getActionWeeklyTarget = (action) => {
  if (action.atemporal) return 1;
  if (typeof action.weeklyTarget === "number" && action.weeklyTarget > 0) return action.weeklyTarget;
  return Array.isArray(action.weekdays) && action.weekdays.length > 0 ? action.weekdays.length : 1;
};

const formatShortDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
};

const getHistoryWeekStart = (date) => {
  const start = getWeekStartDate(date);
  start.setHours(0, 1, 0, 0);
  return start;
};

const getWeekEndDate = (weekStart) => {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const getWeekNumber = (date) => {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  return Math.ceil(((temp - yearStart) / 86400000 + 1) / 7);
};

const countActionCompletionsInRange = (action, startDate, endDate) => {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const history = Array.isArray(action.completedHistory) ? action.completedHistory : [];
  let count = history.filter((stamp) => {
    const time = new Date(stamp).getTime();
    return Number.isFinite(time) && time >= startMs && time <= endMs;
  }).length;
  if (action.completedAt) {
    const completedMs = new Date(action.completedAt).getTime();
    if (Number.isFinite(completedMs) && completedMs >= startMs && completedMs <= endMs) {
      const alreadyCounted = history.some(
        (stamp) => new Date(stamp).getTime() === completedMs,
      );
      if (!alreadyCounted) count += 1;
    }
  }
  return count;
};

const countPlannedInRange = (action, startDate, endDate) => {
  const startKey = formatDateKey(startDate);
  const endKey = formatDateKey(endDate);
  const keys = new Set();
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  while (formatDateKey(cursor) <= endKey) {
    keys.add(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  const plannedSlots = Array.isArray(action.plannedSlots) ? action.plannedSlots : [];
  if (plannedSlots.length) {
    return plannedSlots.filter((slot) => keys.has(slot.dateKey)).length;
  }
  const planned = Array.isArray(action.plannedHistory) ? action.plannedHistory : [];
  return planned.filter((key) => keys.has(key)).length;
};

const buildHistorySummaryForRange = (planner, arenas, startDate, endDate) => {
  const actions = Array.isArray(planner?.bronzeActions) ? planner.bronzeActions : [];
  const arenasById = new Map((arenas || []).map((arena) => [arena.id, arena]));
  const stats = new Map();
  let totalPlanned = 0;
  let totalDone = 0;

  actions.forEach((action) => {
    const plannedCount = countPlannedInRange(action, startDate, endDate);
    const weeklyTarget = getActionWeeklyTarget(action);
    const planned = plannedCount > 0 ? plannedCount : weeklyTarget;
    const done = Math.min(planned, countActionCompletionsInRange(action, startDate, endDate));
    if (planned <= 0 && done <= 0) return;

    const arena = arenasById.get(action.arenaId);
    const assetId = arena?.assetId || "geral";
    const current = stats.get(assetId) || { assetId, planned: 0, done: 0 };
    current.planned += planned;
    current.done += done;
    stats.set(assetId, current);
    totalPlanned += planned;
    totalDone += done;
  });

  const score = totalPlanned > 0 ? Math.round((totalDone / totalPlanned) * 100) : 0;
  return {
    stats: Array.from(stats.values()),
    totalPlanned,
    totalDone,
    score,
  };
};

const buildHistoryWeeks = (planner, arenas, maxWeeks = 12) => {
  const actions = Array.isArray(planner?.bronzeActions) ? planner.bronzeActions : [];
  const currentWeekStart = getHistoryWeekStart(new Date());
  let earliestWeek = new Date(currentWeekStart);

  actions.forEach((action) => {
    const history = Array.isArray(action.completedHistory) ? action.completedHistory : [];
    const plannedSlots = Array.isArray(action.plannedSlots) ? action.plannedSlots : [];
    const plannedHistory = Array.isArray(action.plannedHistory) ? action.plannedHistory : [];
    const candidates = [
      ...history.map((stamp) => new Date(stamp)),
      ...plannedSlots.map((slot) => new Date(slot.dateKey)),
      ...plannedHistory.map((key) => new Date(key)),
      action.createdDate ? new Date(action.createdDate) : null,
    ].filter((date) => date && !Number.isNaN(date.getTime()));
    candidates.forEach((date) => {
      const weekStart = getHistoryWeekStart(date);
      if (weekStart < earliestWeek) earliestWeek = weekStart;
    });
  });

  const weekStarts = [];
  for (let cursor = new Date(earliestWeek); cursor <= currentWeekStart; cursor.setDate(cursor.getDate() + 7)) {
    weekStarts.push(new Date(cursor));
  }
  const trimmed = weekStarts.length > maxWeeks ? weekStarts.slice(-maxWeeks) : weekStarts;

  return trimmed
    .map((weekStart) => {
      const weekEnd = getWeekEndDate(weekStart);
      const summary = buildHistorySummaryForRange(planner, arenas, weekStart, weekEnd);
      const label = `Semana ${String(getWeekNumber(weekStart)).padStart(2, "0")} - ${formatShortDate(
        weekStart,
      )} a ${formatShortDate(weekEnd)}`;

      return {
        key: formatDateKey(weekStart),
        weekStart,
        weekEnd,
        label,
        score: summary.score,
        totalPlanned: summary.totalPlanned,
        totalDone: summary.totalDone,
        stats: summary.stats,
      };
    })
    .reverse();
};

const getActionRemainingForWeek = (action, referenceDate = new Date()) => {
  const weeklyTarget = getActionWeeklyTarget(action);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const completedCount = getActionRecentCompletions(action, weekAgo);
  const weekStart = getWeekStartDate(referenceDate);
  const plannedCount = getPlannedCountForWeek(action, weekStart);
  return Math.max(0, weeklyTarget - completedCount - plannedCount);
};

const applyRolloverActions = () => {
  const planner = loadPlanner();
  if (!planner || !Array.isArray(planner.bronzeActions)) return;
  const todayKey = formatDateKey(new Date());
  let changed = false;
  const updated = planner.bronzeActions.map((action) => {
    if (!action?.isPostponable || action.status === "done") return action;
    let nextPlanned = Array.isArray(action.plannedSlots) ? action.plannedSlots : [];
    const nextScheduled =
      typeof action.scheduledDayOffset === "number" && action.scheduledDayOffset < 0
        ? 0
        : action.scheduledDayOffset;
    if (nextScheduled !== action.scheduledDayOffset) changed = true;
    if (nextPlanned.length) {
      nextPlanned = nextPlanned.map((slot) => {
        if (slot?.dateKey && slot.dateKey < todayKey) {
          changed = true;
          return { ...slot, dateKey: todayKey };
        }
        return slot;
      });
      const unique = [];
      const seen = new Set();
      nextPlanned.forEach((slot) => {
        if (!slot?.dateKey) return;
        const key = `${slot.dateKey}:${slot.hour ?? ""}`;
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(slot);
      });
      nextPlanned = unique;
    }
    return nextScheduled !== action.scheduledDayOffset || nextPlanned !== action.plannedSlots
      ? { ...action, plannedSlots: nextPlanned, scheduledDayOffset: nextScheduled }
      : action;
  });
  if (changed) {
    savePlanner({ ...planner, bronzeActions: updated });
  }
};

const getActionRecentCompletions = (action, sinceMs) => {
  const history = Array.isArray(action.completedHistory) ? action.completedHistory : [];
  return history.filter((stamp) => {
    const time = new Date(stamp).getTime();
    return Number.isFinite(time) && time >= sinceMs;
  }).length;
};

const isActionDoneOnDate = (action, date) => {
  const dayKey = formatDateKey(date);
  const history = Array.isArray(action.completedHistory) ? action.completedHistory : [];
  return history.some((stamp) => formatDateKey(new Date(stamp)) === dayKey);
};

const parseDurationToMinutes = (raw) => {
  if (!raw) return 30;
  const value = raw.toLowerCase().replace(/\s/g, "");
  const hourMatch = value.match(/(\d+)\s*h/);
  const minMatch = value.match(/(\d+)\s*m/);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minMatch ? Number(minMatch[1]) : 0;
  if (hours || minutes) return hours * 60 + minutes;
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) return asNumber;
  return 30;
};

const ensureV2Reset = () => {
  const resetDone = safeLocalGet(V2_RESET_KEY) === "true";
  if (resetDone) return;
  const keysToClear = [
    STORAGE_KEY,
    PLANNER_KEY,
    PROFILE_KEY,
    ARENAS_KEY,
    HIATO_KEY,
    LOGIN_KEY,
    GLITCH_KEY,
    MISSIONS_KEY,
    MODE_KEY,
  ];
  keysToClear.forEach((key) => safeLocalRemove(key));
  safeLocalSet(V2_RESET_KEY, "true");
};

let cachedProfile = null;
let currentUserId = null;
let cachedDNA = null;
let cachedPlanner = null;
let cachedNpcProfiles = null;
let npcFetchInFlight = null;
let externalProfile = null;

const shouldPersistLocalData = () => !DISABLE_LOCAL_STORAGE && (!isSupabaseEnabled() || guestMode || !currentUserId);

const getDefaultPlayerData = () => ({
  version: 1,
  assets: {},
  arenas: [],
  planner: {},
  profile: {},
  config: {},
});

const normalizePlayerData = (profile) => {
  const raw = profile?.playerData && typeof profile.playerData === "object" ? profile.playerData : {};
  return {
    ...getDefaultPlayerData(),
    ...raw,
    assets: { ...(raw.assets || {}) },
    planner: { ...(raw.planner || {}) },
    profile: { ...(raw.profile || {}) },
    config: { ...(raw.config || {}) },
  };
};

const migratePlayerData = () => {
  const profile = loadProfile();
  const normalized = normalizePlayerData(profile);
  let changed = false;

  if (!normalized.assets?.dna) {
    const dna = loadDNA();
    if (dna && Array.isArray(dna.assets)) {
      normalized.assets = {
        ...(normalized.assets || {}),
        dna,
        levels: computeAssetLevelsFromDNA(dna),
        lastUpdatedAt: dna.lastUpdatedAt || new Date().toISOString(),
      };
      changed = true;
    }
  }

  if (!normalized.planner?.state) {
    const planner = loadPlanner();
    if (planner && Array.isArray(planner.pills)) {
      normalized.planner = {
        ...(normalized.planner || {}),
        state: planner,
        lastUpdatedAt: new Date().toISOString(),
      };
      changed = true;
    }
  }

  if (!Array.isArray(normalized.arenas) || normalized.arenas.length === 0) {
    const arenas = loadArenas();
    if (arenas.length) {
      normalized.arenas = arenas;
      changed = true;
    }
  }

  normalized.profile = {
    ...(normalized.profile || {}),
    nickname: profile.nickname ?? normalized.profile?.nickname,
    avatar: profile.avatar ?? normalized.profile?.avatar,
    banner: profile.banner ?? normalized.profile?.banner,
    widgetsVisible: profile.widgetsVisible ?? normalized.profile?.widgetsVisible,
    profileCardTheme: profile.profileCardTheme ?? normalized.profile?.profileCardTheme,
    profileBorderTheme: profile.profileBorderTheme ?? normalized.profile?.profileBorderTheme,
    profileBorderImage: profile.profileBorderImage ?? normalized.profile?.profileBorderImage,
    moodLevel: profile.moodLevel ?? normalized.profile?.moodLevel,
    moodColor: profile.moodColor ?? normalized.profile?.moodColor,
  };

  if (!normalized.config?.masteryMode) {
    normalized.config = {
      ...(normalized.config || {}),
      masteryMode: safeLocalGet(MODE_KEY) || "sovereign",
    };
    changed = true;
  }

  if (changed) {
    saveProfile({ ...profile, playerData: normalized });
  }
};

const loadProfile = () => {
  if (cachedProfile) return cachedProfile;
  if (!shouldPersistLocalData()) {
    cachedProfile = {};
    return cachedProfile;
  }
  try {
    const raw = safeLocalGet(PROFILE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    cachedProfile = parsed || {};
    return cachedProfile;
  } catch {
    cachedProfile = {};
    return cachedProfile;
  }
};

const setProfileCache = (profile, persistLocal = shouldPersistLocalData()) => {
  cachedProfile = profile || {};
  if (persistLocal) {
    safeLocalSet(PROFILE_KEY, JSON.stringify(cachedProfile));
  }
};

const queueSupabaseProfileUpdate = (() => {
  let timer = null;
  let pending = {};
  return (partialPayload = {}) => {
    if (!isSupabaseEnabled() || guestMode || !currentUserId) return;
    pending = { ...pending, ...partialPayload };
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const user = await getSupabaseUser();
        if (!user) return;
        const profile = loadProfile();
        const normalized = normalizePlayerData(profile);
        const selectedGoldAssets = Array.isArray(profile.selectedGoldAssets)
          ? profile.selectedGoldAssets
          : Array.isArray(profile.widgets)
            ? profile.widgets
            : [];
        const payload = {
          id: user.id,
          user_id: user.id,
          login_email: user.email || "",
          nickname: profile.nickname || "",
          handle: formatHandle(profile.userId || profile.nickname || ""),
          lema: profile.banner || "",
          avatar_url: profile.avatar || "",
          total_level: Number(profile.total_level || 0),
          level_geral: Number(profile.total_level || 0),
          selected_gold_assets: selectedGoldAssets,
          asset_levels: profile.assetLevels || {},
          player_data: normalized,
          ...pending,
        };
        pending = {};
        await upsertProfileRow(payload);
      } catch (error) {
        logSupabaseError("profiles.upsert (queue)", error);
      }
    }, 400);
  };
})();

const saveProfile = (profile, options = {}) => {
  const nextProfile = profile || {};
  const basePlayerData = normalizePlayerData(nextProfile);
  const nextPlayerData = {
    ...basePlayerData,
    moodLevel: nextProfile.moodLevel ?? nextProfile.playerData?.moodLevel,
    moodColor: nextProfile.moodColor ?? nextProfile.playerData?.moodColor,
    profileCardTheme: nextProfile.profileCardTheme ?? nextProfile.playerData?.profileCardTheme,
    profileBorderTheme: nextProfile.profileBorderTheme ?? nextProfile.playerData?.profileBorderTheme,
    profileBorderImage: nextProfile.profileBorderImage ?? nextProfile.playerData?.profileBorderImage,
    banner: nextProfile.banner ?? nextProfile.playerData?.banner,
    profile: {
      ...(basePlayerData.profile || {}),
      nickname: nextProfile.nickname ?? basePlayerData.profile?.nickname,
      avatar: nextProfile.avatar ?? basePlayerData.profile?.avatar,
      banner: nextProfile.banner ?? basePlayerData.profile?.banner,
      widgetsVisible: nextProfile.widgetsVisible ?? basePlayerData.profile?.widgetsVisible,
      profileCardTheme: nextProfile.profileCardTheme ?? basePlayerData.profile?.profileCardTheme,
      profileBorderTheme: nextProfile.profileBorderTheme ?? basePlayerData.profile?.profileBorderTheme,
      profileBorderImage: nextProfile.profileBorderImage ?? basePlayerData.profile?.profileBorderImage,
      moodLevel: nextProfile.moodLevel ?? basePlayerData.profile?.moodLevel,
      moodColor: nextProfile.moodColor ?? basePlayerData.profile?.moodColor,
    },
  };
  nextProfile.playerData = nextPlayerData;
  const persistLocal = options.persistLocal ?? shouldPersistLocalData();
  setProfileCache(nextProfile, persistLocal);
  queueSupabaseProfileUpdate();
  updateHudIdentity(nextProfile);
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme || "gold";
  const profile = loadProfile();
  saveProfile({ ...profile, theme: theme || "gold" });
};

let lastSupabaseError = null;
const logSupabaseError = (context, error) => {
  if (!error) return;
  lastSupabaseError = { context, message: error.message || String(error) };
  console.error(`[supabase] ${context}`, error);
};

const isSupabaseEnabled = () => Boolean(supabaseConfig?.enabled && supabase);

const withTimeout = (promise, ms, label) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout ${label} (${ms}ms)`));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

const setAuthLocked = (locked) => {
  document.body.classList.toggle("auth-locked", locked);
  const screen = document.getElementById("auth-screen");
  if (screen) screen.classList.toggle("is-open", locked);
  if (locked) showMissionsLoading(false);
};

const getIdentityFromEmail = (email) => {
  if (!email) return "";
  return email.split("@")[0].trim();
};

const ensureLocalIdentity = (email) => {
  const identity = getIdentityFromEmail(email);
  if (!identity) return;
  const profile = loadProfile();
  if (profile.nickname || profile.userId) return;
  const updated = { ...profile, nickname: identity, userId: identity };
  saveProfile(updated);
  renderSocial();
};

const resolveLoginEmail = async (identifier, errorEl) => {
  const value = String(identifier || "").trim();
  if (!value) return "";
  if (value.includes("@")) return value;
  if (!isSupabaseEnabled()) return "";
  try {
    const rpc = await supabase.rpc("resolve_login_email", { p_nickname: value });
    if (!rpc.error && rpc.data) {
      return typeof rpc.data === "string" ? rpc.data : String(rpc.data?.email || rpc.data?.login_email || "");
    }
    if (rpc.error) {
      logSupabaseError("rpc.resolve_login_email", rpc.error);
    }
  } catch (error) {
    logSupabaseError("rpc.resolve_login_email", error);
  }
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("login_email,email,nickname,userId")
      .or(`nickname.eq.${value},userId.eq.${value}`)
      .limit(1)
      .maybeSingle();
    if (error) {
      logSupabaseError("profiles.lookup.nickname", error);
      if (errorEl) {
        errorEl.textContent = "Nao foi possivel usar nickname agora. Use e-mail.";
      }
      return "";
    }
    const loginEmail = data?.login_email || data?.email;
    if (!loginEmail) {
      if (errorEl) {
        errorEl.textContent = "Nickname sem e-mail vinculado. Use e-mail.";
      }
      return "";
    }
    return String(loginEmail);
  } catch (error) {
    logSupabaseError("profiles.lookup.nickname", error);
    if (errorEl) {
      errorEl.textContent = "Falha ao buscar nickname. Use e-mail.";
    }
    return "";
  }
};

const formatHandle = (value) => {
  if (!value) return "";
  return value.startsWith("@") ? value : `@${value}`;
};

const fetchSupabaseProfileRow = async (userId) => {
  if (!isSupabaseEnabled() || !userId) return null;
  try {
    let { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error && /column .*id/i.test(error.message || "")) {
      const fallback = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      data = fallback.data;
      error = fallback.error;
    }
    if (error) {
      logSupabaseError("profiles.select", error);
      return null;
    }
    return data || null;
  } catch (error) {
    logSupabaseError("fetchSupabaseProfileRow", error);
    return null;
  }
};

const applySupabaseProfileToLocal = (row) => {
  if (!row) return;
  const profile = loadProfile();
  const identity = row.nickname || row.handle?.replace("@", "") || profile.nickname || profile.userId || "";
  const level =
    typeof row.level_geral === "number"
      ? row.level_geral
      : typeof row.total_level === "number"
        ? row.total_level
        : profile.total_level;
  const selectedGoldAssets = Array.isArray(row.selected_gold_assets)
    ? row.selected_gold_assets
    : profile.selectedGoldAssets;
  const playerData = row.player_data && typeof row.player_data === "object" ? row.player_data : profile.playerData;
  const normalized = normalizePlayerData({ playerData });
  const updated = {
    ...profile,
    nickname: identity,
    userId: identity,
    banner: normalized.profile?.banner ?? playerData?.banner ?? row.lema ?? profile.banner,
    avatar: row.avatar_url ?? profile.avatar,
    total_level: level,
    level_geral: level,
    selectedGoldAssets,
    widgets: Array.isArray(selectedGoldAssets) ? selectedGoldAssets : profile.widgets,
    profileCardTheme: normalized.profile?.profileCardTheme ?? playerData?.profileCardTheme ?? profile.profileCardTheme,
    profileBorderTheme: normalized.profile?.profileBorderTheme ?? playerData?.profileBorderTheme ?? profile.profileBorderTheme,
    profileBorderImage: normalized.profile?.profileBorderImage ?? playerData?.profileBorderImage ?? profile.profileBorderImage,
    playerData: normalized,
  };
  if (Array.isArray(selectedGoldAssets)) {
    updated.widgetsVisible = selectedGoldAssets.map(() => true);
  }
  const persistLocal = shouldPersistLocalData();
  if (normalized.assets?.dna && Array.isArray(normalized.assets.dna.assets)) {
    setDNACache(normalized.assets.dna, persistLocal);
  } else if (row.dna_state && Array.isArray(row.dna_state.assets)) {
    setDNACache(row.dna_state, persistLocal);
  } else if (row.asset_levels && typeof row.asset_levels === "object") {
    const dna = buildDefaultDNA();
    dna.assets.forEach((asset) => {
      if (row.asset_levels[asset.id] !== undefined) {
        asset.level = Number(row.asset_levels[asset.id] || 0);
      }
    });
    dna.lastUpdatedAt = new Date().toISOString();
    setDNACache(dna, persistLocal);
  }
  if (normalized.planner?.state && typeof normalized.planner.state === "object") {
    setPlannerCache(normalized.planner.state, persistLocal);
  } else if (row.planner_state && typeof row.planner_state === "object") {
    setPlannerCache(row.planner_state, persistLocal);
  } else {
    setPlannerCache(buildDefaultPlanner(), persistLocal);
  }
  setProfileCache(updated, persistLocal);
  renderTree();
  renderSocial();
};

const upsertProfileRow = async (payload) => {
  if (!isSupabaseEnabled()) return false;
  try {
    const preferUserId = !("id" in payload);
    let { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: preferUserId ? "user_id" : "id" });
    if (error && /column .*id/i.test(error.message || "")) {
      const retryPayload = { ...payload };
      delete retryPayload.id;
      const retry = await supabase.from("profiles").upsert(retryPayload, { onConflict: "user_id" });
      error = retry.error;
    }
    if (error) {
      logSupabaseError("profiles.upsert", error);
      return false;
    }
    return true;
  } catch (error) {
    logSupabaseError("upsertProfileRow", error);
    return false;
  }
};

const ensureUserMissionsRow = async (userId) => {
  if (!isSupabaseEnabled() || !userId) return;
  try {
    const { data, error } = await supabase
      .from("user_missions")
      .select("user_id")
      .eq("user_id", userId)
      .single();
    if (error) {
      logSupabaseError("user_missions.select", error);
    }
    if (!data) {
      const payload = { user_id: userId, ...defaultMissionState() };
      const { error: upsertError } = await supabase.from("user_missions").upsert(payload);
      if (upsertError) logSupabaseError("user_missions.upsert (init)", upsertError);
    }
  } catch (error) {
    logSupabaseError("ensureUserMissionsRow", error);
  }
};

const ensureProfilesRow = async (user) => {
  if (!isSupabaseEnabled() || !user?.id) return;
  let useUserIdOnly = false;
  try {
    let { data, error } = await supabase.from("profiles").select("id").eq("id", user.id).single();
    if (error) {
      if (/column .*id/i.test(error.message || "")) {
        useUserIdOnly = true;
        const fallback = await supabase
          .from("profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .single();
        data = fallback.data;
        error = fallback.error;
      }
      if (error) logSupabaseError("profiles.select", error);
    }
    if (!data) {
      const profile = loadProfile();
      const fallbackName =
        profile.nickname ||
        profile.userId ||
        (user.email ? user.email.split("@")[0] : "") ||
        "";
      const selectedGoldAssets = Array.isArray(profile.selectedGoldAssets)
        ? profile.selectedGoldAssets
        : Array.isArray(profile.widgets)
          ? profile.widgets
          : [];
      const normalized = normalizePlayerData(profile);
      const payload = {
        id: user.id,
        user_id: user.id,
        login_email: user.email || "",
        nickname: fallbackName,
        handle: formatHandle(fallbackName),
        lema: profile.banner || "",
        avatar_url: profile.avatar || "",
        total_level: Number(profile.total_level || 0),
        level_geral: Number(profile.total_level || 0),
        selected_gold_assets: selectedGoldAssets,
        asset_levels: profile.assetLevels || {},
        player_data: normalized,
      };
      if (useUserIdOnly) delete payload.id;
      await upsertProfileRow(payload);
    }
  } catch (error) {
    logSupabaseError("ensureProfilesRow", error);
  }
};

const hydrateSupabaseState = async (user) => {
  if (!user?.id) return;
  await ensureProfilesRow(user);
  const row = await fetchSupabaseProfileRow(user.id);
  if (row) {
    applySupabaseProfileToLocal(row);
    return;
  }
  const dna = buildDefaultDNA();
  const planner = buildDefaultPlanner();
  setDNACache(dna, shouldPersistLocalData());
  setPlannerCache(planner, shouldPersistLocalData());
  queueSupabaseProfileUpdate({ dna_state: dna, planner_state: planner });
};

const bootstrapSupabaseSession = async (user) => {
  if (!user) return;
  currentUserId = user.id;
  guestMode = false;
  ensureLocalIdentity(user.email);
  await hydrateSupabaseState(user);
  setAuthLocked(false);
  initApp();
  ensureUserMissionsRow(user.id);
};

const initAuth = () => {
  window.__AUTH_READY__ = true;
  const googleBtn = document.getElementById("login-google");
  const emailInput = document.getElementById("login-email");
  const nicknameInput = document.getElementById("signup-nickname");
  const passInput = document.getElementById("login-password");
  const emailBtn = document.getElementById("login-email-btn");
  const signupBtn = document.getElementById("login-signup-btn");
  const guestBtn = document.getElementById("login-guest-btn");
  const errorEl = document.getElementById("login-error");
  const warnEl = document.getElementById("login-warning");
  const authTabs = document.querySelectorAll(".auth-tab");
  const authViews = document.querySelectorAll("[data-auth-view]");
  setAuthLocked(true);

  if (guestMode) {
    if (warnEl) warnEl.textContent = "Dados salvos apenas localmente. Clique em Convidado para continuar.";
  }

  const setAuthMode = (mode) => {
    authTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.auth === mode);
    });
    authViews.forEach((view) => {
      view.classList.toggle("is-hidden", view.dataset.authView !== mode);
    });
    if (passInput) {
      passInput.placeholder = mode === "signup" ? "m├¡n. 8 caracteres" : "";
    }
  };

  setAuthMode("login");
  if (window.lucide) window.lucide.createIcons();
  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => setAuthMode(tab.dataset.auth || "login"));
  });

  const requireSupabase = () => {
    if (isSupabaseEnabled()) return true;
    if (warnEl) {
      warnEl.textContent = "Supabase indisponivel. Use Convidado.";
    }
    if (errorEl) {
      errorEl.textContent = "Supabase nao configurado.";
    }
    return false;
  };

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      if (!requireSupabase()) return;
      if (errorEl) errorEl.textContent = "";
      try {
        const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
        if (error) logSupabaseError("auth.signInWithOAuth", error);
      } catch (error) {
        logSupabaseError("auth.signInWithOAuth", error);
      }
    });
  }

  if (emailBtn) {
    emailBtn.addEventListener("click", async () => {
      if (!requireSupabase()) return;
      if (errorEl) errorEl.textContent = "";
      const identifier = emailInput?.value?.trim();
      const password = passInput?.value || "";
      if (!identifier || !password) {
        if (errorEl) errorEl.textContent = "Preencha e-mail/nickname e senha.";
        return;
      }
      try {
        const email = await resolveLoginEmail(identifier, errorEl);
        if (!email) return;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          logSupabaseError("auth.signInWithPassword", error);
          if (errorEl) errorEl.textContent = "Falha no login.";
        }
      } catch (error) {
        logSupabaseError("auth.signInWithPassword", error);
        if (errorEl) errorEl.textContent = "Falha no login.";
      }
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
      if (!requireSupabase()) return;
      if (errorEl) errorEl.textContent = "";
      const email = emailInput?.value?.trim();
      const password = passInput?.value || "";
      const nickname = nicknameInput?.value?.trim() || "";
      if (!email || !password || !nickname) {
        if (errorEl) errorEl.textContent = "Preencha e-mail, nickname e senha.";
        return;
      }
      if (password.length < 8) {
        if (errorEl) errorEl.textContent = "Senha deve ter no m├¡nimo 8 caracteres.";
        return;
      }
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          logSupabaseError("auth.signUp", error);
          if (errorEl) errorEl.textContent = "Falha no cadastro.";
          return;
        }
        const user = data?.user;
        if (user) {
          const profile = loadProfile();
          const updated = { ...profile, nickname, userId: nickname };
          setProfileCache(updated);
          ensureLocalIdentity(email);
          await upsertProfileRow({
            id: user.id,
            user_id: user.id,
            login_email: user.email || "",
            nickname,
            handle: formatHandle(nickname),
          });
          await ensureProfilesRow(user);
          await ensureUserMissionsRow(user.id);
          setAuthLocked(false);
          initApp();
        }
      } catch (error) {
        logSupabaseError("auth.signUp", error);
        if (errorEl) errorEl.textContent = "Falha no cadastro.";
      }
    });
  }

  if (guestBtn) {
    guestBtn.addEventListener("click", () => {
      guestMode = true;
      currentUserId = null;
      cachedProfile = null;
      cachedDNA = null;
      cachedPlanner = null;
      safeLocalSet("game_of_life.guest", "true");
      setAuthLocked(false);
      initApp();
      if (warnEl) warnEl.textContent = "Dados salvos apenas localmente.";
    });
  }

  if (!isSupabaseEnabled()) {
    if (warnEl) warnEl.textContent = "Supabase indisponivel.";
    return;
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      console.info("[supabase] session user", session.user.id);
      bootstrapSupabaseSession(session.user);
    } else {
      currentUserId = null;
      if (!offlineFallback && !guestMode) setAuthLocked(true);
    }
  });

  withTimeout(supabase.auth.getSession(), 3000, "auth.getSession")
    .then((session) => {
      if (session?.data?.session?.user) {
        console.info("[supabase] session user", session.data.session.user.id);
        bootstrapSupabaseSession(session.data.session.user);
      } else {
        currentUserId = null;
        setAuthLocked(true);
      }
    })
    .catch((error) => {
      logSupabaseError("auth.getSession.timeout", error);
      offlineFallback = false;
      setAuthLocked(true);
      if (warnEl) warnEl.textContent = "Sessao nao encontrada. Use Convidado.";
    });
};

const uploadToSupabase = async (file, path) => {
  if (!isSupabaseEnabled() || !file) return null;
  try {
    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
    });
    if (error) {
      logSupabaseError("storage.upload", error);
      return null;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (error) {
    logSupabaseError("storage.upload", error);
    return null;
  }
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });

const loadImageFromDataUrl = (dataUrl) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = dataUrl;
  });

const resizeImageFileToDataUrl = async (
  file,
  { maxSize = 960, quality = 0.82, type } = {},
) => {
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImageFromDataUrl(dataUrl);
    const largestSide = Math.max(img.width, img.height) || 1;
    const scale = Math.min(1, maxSize / largestSide);
    const targetWidth = Math.max(1, Math.round(img.width * scale));
    const targetHeight = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    const outputType = type || (file.type === "image/png" ? "image/png" : "image/jpeg");
    return outputType === "image/png"
      ? canvas.toDataURL(outputType)
      : canvas.toDataURL(outputType, quality);
  } catch {
    return readFileAsDataUrl(file);
  }
};

const playMetalClick = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    return;
  }
};

const playMysticOpen = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const shimmer = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = "sine";
    shimmer.type = "triangle";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.6);
    shimmer.frequency.setValueAtTime(420, now);
    shimmer.frequency.exponentialRampToValueAtTime(980, now + 0.6);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    osc.connect(gain);
    shimmer.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    shimmer.start();
    osc.stop(now + 1.0);
    shimmer.stop(now + 1.0);
  } catch {
    return;
  }
};

const ensureSupabaseProfile = async (profile) => {
  if (!isSupabaseEnabled()) return;
  try {
    const nickname = profile.nickname?.trim();
    const session = await supabase.auth.getSession();
    let user = session.data?.session?.user;
    if (session.error) logSupabaseError("auth.getSession", session.error);
    if (!user) {
      const localId = profile.userId?.replace("@", "").trim();
      if (!localId || !nickname) return;
      const email = `${localId}@gameoflife.local`;
      const passwordKey = "game_of_life.supabase_pass";
      let password = safeLocalGet(passwordKey);
      if (!password) {
        password = crypto.randomUUID();
        safeLocalSet(passwordKey, password);
      }
      let auth = await supabase.auth.signInWithPassword({ email, password });
      if (auth.error) {
        logSupabaseError("auth.signInWithPassword", auth.error);
        auth = await supabase.auth.signUp({ email, password });
        if (auth.error) logSupabaseError("auth.signUp", auth.error);
      }
      user = auth.data?.user;
    }
    if (!user) return;
    const selectedGoldAssets = Array.isArray(profile.selectedGoldAssets)
      ? profile.selectedGoldAssets
      : Array.isArray(profile.widgets)
        ? profile.widgets
        : [];
    const dna = loadDNA();
    const planner = loadPlanner();
    const normalized = normalizePlayerData(profile);
    const payload = {
      id: user.id,
      user_id: user.id,
      login_email: user.email || "",
      nickname: nickname || profile.userId || "",
      handle: formatHandle(profile.userId || nickname || ""),
      lema: profile.banner || "",
      avatar_url: profile.avatar || "",
      total_level: Number(profile.total_level || 0),
      level_geral: Number(profile.total_level || 0),
      selected_gold_assets: selectedGoldAssets,
      asset_levels: profile.assetLevels || {},
      player_data: normalized,
      dna_state: dna || undefined,
      planner_state: planner || undefined,
    };
    const ok = await upsertProfileRow(payload);
    return ok;
  } catch (error) {
    logSupabaseError("ensureSupabaseProfile", error);
  }
  return false;
};

const getSupabaseUser = async () => {
  if (!isSupabaseEnabled()) {
    console.error("[supabase] configuracao ausente ou invalida");
    return null;
  }
  try {
    const session = await supabase.auth.getSession();
    if (session.error) logSupabaseError("auth.getSession", session.error);
    if (session.data?.session?.user) return session.data.session.user;
    const profile = loadProfile();
    await ensureSupabaseProfile(profile);
    const nextSession = await supabase.auth.getSession();
    if (nextSession.error) logSupabaseError("auth.getSession (retry)", nextSession.error);
    return nextSession.data?.session?.user || null;
  } catch (error) {
    logSupabaseError("getSupabaseUser", error);
    return null;
  }
};

const defaultMissionState = () => ({
  m1: false,
  m2: false,
  m3: false,
  m4: false,
  m5: false,
  initiation_finished: false,
});

const loadMissionStateLocal = () => {
  try {
    const raw = safeLocalGet(MISSIONS_KEY);
    if (!raw) return defaultMissionState();
    const parsed = JSON.parse(raw);
    return { ...defaultMissionState(), ...(parsed || {}) };
  } catch {
    return defaultMissionState();
  }
};

const saveMissionStateLocal = (state) => {
  safeLocalSet(MISSIONS_KEY, JSON.stringify(state));
};

const syncMissionState = async (state) => {
  if (!isSupabaseEnabled()) return;
  try {
    const user = await getSupabaseUser();
    if (!user) return;
    const { error } = await supabase.from("user_missions").upsert({
      user_id: user.id,
      ...state,
    });
    if (error) logSupabaseError("user_missions.upsert", error);
  } catch (error) {
    logSupabaseError("syncMissionState", error);
  }
};

const syncProfileTotals = async (nextProfile = {}) => {
  if (!isSupabaseEnabled()) return false;
  try {
    const user = await getSupabaseUser();
    if (!user) return false;
    const profile = { ...loadProfile(), ...nextProfile };
    const selectedGoldAssets = Array.isArray(profile.selectedGoldAssets)
      ? profile.selectedGoldAssets
      : Array.isArray(profile.widgets)
        ? profile.widgets
        : [];
    const payload = {
      id: user.id,
      user_id: user.id,
      login_email: user.email || "",
      nickname: profile.nickname || "",
      handle: formatHandle(profile.userId || profile.nickname || ""),
      lema: profile.banner || "",
      avatar_url: profile.avatar || "",
      total_level: Number(profile.total_level || 0),
      level_geral: Number(profile.total_level || 0),
      selected_gold_assets: selectedGoldAssets,
      asset_levels: profile.assetLevels || {},
      player_data: normalized,
    };
    return await upsertProfileRow(payload);
  } catch (error) {
    logSupabaseError("syncProfileTotals", error);
    return false;
  }
};

const fetchMissionState = async () => {
  if (!isSupabaseEnabled()) return loadMissionStateLocal();
  try {
    const user = await getSupabaseUser();
    if (!user) return loadMissionStateLocal();
    const { data, error } = await supabase
      .from("user_missions")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (error) {
      logSupabaseError("user_missions.select", error);
      return loadMissionStateLocal();
    }
    if (!data) return loadMissionStateLocal();
    const { m1, m2, m3, m4, m5, initiation_finished } = data;
    return { m1, m2, m3, m4, m5, initiation_finished };
  } catch (error) {
    logSupabaseError("fetchMissionState", error);
    return loadMissionStateLocal();
  }
};

const nowClock = () =>
  new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const formatHudDate = () => {
  const date = new Date();
  const weekdays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  return `${weekdays[date.getDay()]}, ${String(date.getDate()).padStart(2, "0")} ${
    months[date.getMonth()]
  }`;
};

const buildDefaultDNA = () => ({
  assets: SEPHIROT.map((asset) => ({
    id: asset.id,
    label: asset.label,
    level: 0,
    slots: [],
  })),
  hobbies: [],
  lastUpdatedAt: new Date(0).toISOString(),
});

const loadDNA = () => {
  if (cachedDNA) return cachedDNA;
  if (!shouldPersistLocalData()) return null;
  try {
    const profile = loadProfile();
    const normalized = normalizePlayerData(profile);
    if (normalized.assets?.dna && Array.isArray(normalized.assets.dna.assets)) {
      const result = migrateFinancasAsset(normalized.assets.dna);
      cachedDNA = result.dna;
      if (result.changed) {
        saveDNA(cachedDNA, { skipSync: true });
      }
      return cachedDNA;
    }
    const raw = safeLocalGet(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.assets)) return null;
    const result = migrateFinancasAsset(parsed);
    cachedDNA = result.dna;
    if (result.changed) {
      saveDNA(cachedDNA, { skipSync: true });
    }
    return parsed;
  } catch {
    return null;
  }
};

const getAssets = () => {
  const stored = seedDNAIfMissing();
  const byId = new Map(stored.assets.map((asset) => [asset.id, asset]));
  return SEPHIROT.map((asset) => ({
    ...asset,
    level: typeof byId.get(asset.id)?.level === "number" ? byId.get(asset.id).level : 0,
  }));
};

const renderTree = () => {
  const treeGrid = document.getElementById("tree-grid");
  if (!treeGrid) return;
  const isStandby = safeLocalGet(HIATO_KEY) === "true";
  treeGrid.innerHTML = "";
  const openTreeEditorWithFx = (assetId, node) => {
    if (!assetId || !node) return;
    if (node.dataset.opening === "true") return;
    node.dataset.opening = "true";
    node.classList.add("is-opening");
    playMysticOpen();
    setTimeout(() => {
      node.classList.remove("is-opening");
      node.dataset.opening = "false";
      openTreeEditor(assetId);
    }, 1000);
  };
  treeGrid.onclick = (event) => {
    const target = event.target.closest(".sephirot");
    if (target?.dataset?.assetId) {
      openTreeEditorWithFx(target.dataset.assetId, target);
    }
  };
  const assets = getAssets();
  const vitalityStats = buildVitalityStats();
  updateHudIdentity();

  assets.forEach((asset) => {
    const sphere = document.createElement("button");
    sphere.className = "sephirot";
    sphere.type = "button";
    sphere.style.gridRow = String(asset.row);
    sphere.style.gridColumn = String(asset.col);
    sphere.dataset.assetId = asset.id;
    if (asset.col !== 2) sphere.classList.add("sephirot-side");
    if (asset.level === 0) sphere.classList.add("is-empty");
    if (isStandby) sphere.classList.add("is-empty");
    const vitality = vitalityStats.get(asset.id);
    if (vitality) {
      const className = getVitalityClass(vitality);
      if (className) sphere.classList.add(className);
    }

    const label = document.createElement("div");
    label.className = "sephirot-label";
    if (asset.id === "trabalho") {
      label.innerHTML = "TRABALHO<br/>ESTUDOS";
    } else {
      label.textContent = asset.label;
    }

    const level = document.createElement("div");
    level.className = "sephirot-level";
    const roundedLevel = Math.round(asset.level);
    level.textContent = String(roundedLevel);
    const intensity = Math.min(1, Math.max(0.2, roundedLevel / 10));
    const glowTier = Math.min(5, Math.max(0, Math.floor(roundedLevel / 2)));
    sphere.dataset.glow = String(glowTier);
    sphere.style.setProperty("--vitality-bg", `rgba(255, 255, 255, ${0.05 + intensity * 0.2})`);
    sphere.style.setProperty(
      "--vitality-border",
      `rgba(255, 255, 255, ${0.12 + intensity * 0.3})`,
    );

    sphere.appendChild(label);
    sphere.appendChild(level);
    treeGrid.appendChild(sphere);
  });
  requestAnimationFrame(() => {
    treeGrid.querySelectorAll(".sephirot").forEach((node) => {
      node.classList.remove("glow-burst");
      void node.offsetHeight;
      node.classList.add("glow-burst");
    });
  });
};

const buildDefaultPlanner = () => ({ pills: [], logistics: {}, bronzeActions: [] });

const loadPlanner = () => {
  if (cachedPlanner) return cachedPlanner;
  const profile = loadProfile();
  const normalized = normalizePlayerData(profile);
  if (normalized.planner?.state && typeof normalized.planner.state === "object") {
    cachedPlanner = normalized.planner.state;
    return cachedPlanner;
  }
  if (!shouldPersistLocalData()) return buildDefaultPlanner();
  try {
    const raw = safeLocalGet(PLANNER_KEY);
    if (!raw) return buildDefaultPlanner();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.pills)) {
      return buildDefaultPlanner();
    }
    cachedPlanner = {
      pills: parsed.pills,
      logistics: parsed.logistics ?? {},
      bronzeActions: Array.isArray(parsed.bronzeActions) ? parsed.bronzeActions : [],
    };
    return cachedPlanner;
  } catch {
    return buildDefaultPlanner();
  }
};

const setPlannerCache = (planner, persistLocal = shouldPersistLocalData()) => {
  cachedPlanner = planner || buildDefaultPlanner();
  if (persistLocal) {
    safeLocalSet(PLANNER_KEY, JSON.stringify(cachedPlanner));
  }
};

const savePlanner = (planner, options = {}) => {
  const persistLocal = options.persistLocal ?? shouldPersistLocalData();
  setPlannerCache(planner, persistLocal);
  if (!options.skipSync) {
    const profile = loadProfile();
    const normalized = normalizePlayerData(profile);
    const nextPlayerData = {
      ...normalized,
      planner: {
        ...(normalized.planner || {}),
        state: planner,
        lastUpdatedAt: new Date().toISOString(),
      },
    };
    setProfileCache({ ...profile, playerData: nextPlayerData }, persistLocal);
    queueSupabaseProfileUpdate({ player_data: nextPlayerData, planner_state: planner });
  }
};

const DEFAULT_CHECKLIST_ITEMS = ["Agua", "Alimentacao", "Sono", "Limpeza"];

const loadChecklistItems = () => {
  const planner = loadPlanner();
  const current = planner.logistics?.items;
  if (Array.isArray(current) && current.length) return current;
  const seeded = DEFAULT_CHECKLIST_ITEMS.map((label) => ({
    id: crypto.randomUUID(),
    label,
    done: false,
  }));
  planner.logistics = { ...(planner.logistics || {}), items: seeded };
  savePlanner(planner);
  return seeded;
};

const updateChecklistBadge = () => {
  const notesToggle = document.getElementById("notes-toggle");
  if (!notesToggle) return;
  const items = loadChecklistItems();
  const allDone = items.length > 0 && items.every((item) => item.done);
  notesToggle.classList.toggle("is-complete", allDone);
};

const saveChecklistItems = (items) => {
  const planner = loadPlanner();
  planner.logistics = { ...(planner.logistics || {}), items };
  savePlanner(planner);
};

const getZodiacSign = (day, month) => {
  if (!day || !month) return "";
  const signs = [
    { name: "Capricornio", start: [12, 22], end: [1, 19] },
    { name: "Aquario", start: [1, 20], end: [2, 18] },
    { name: "Peixes", start: [2, 19], end: [3, 20] },
    { name: "Aries", start: [3, 21], end: [4, 19] },
    { name: "Touro", start: [4, 20], end: [5, 20] },
    { name: "Gemeos", start: [5, 21], end: [6, 20] },
    { name: "Cancer", start: [6, 21], end: [7, 22] },
    { name: "Leao", start: [7, 23], end: [8, 22] },
    { name: "Virgem", start: [8, 23], end: [9, 22] },
    { name: "Libra", start: [9, 23], end: [10, 22] },
    { name: "Escorpiao", start: [10, 23], end: [11, 21] },
    { name: "Sagitario", start: [11, 22], end: [12, 21] },
  ];
  const isAfter = (m, d, refM, refD) => m > refM || (m === refM && d >= refD);
  const isBefore = (m, d, refM, refD) => m < refM || (m === refM && d <= refD);
  for (const sign of signs) {
    const [sm, sd] = sign.start;
    const [em, ed] = sign.end;
    if (sm > em) {
      if (isAfter(month, day, sm, sd) || isBefore(month, day, em, ed)) {
        return sign.name;
      }
    } else if (isAfter(month, day, sm, sd) && isBefore(month, day, em, ed)) {
      return sign.name;
    }
  }
  return "";
};

let plannerDayOffset = 0;
let missionState = defaultMissionState();
let bypassInitiation = false;
let vitalityLogs = [];

const showMissionsLoading = (isLoading) => {
  const loading = document.getElementById("missions-loading");
  if (!loading) return;
  loading.classList.toggle("is-hidden", !isLoading);
  loading.classList.toggle("is-open", isLoading);
};

const applyOracleStatus = () => {
  document.documentElement.dataset.status = "oracle";
  const profile = loadProfile();
  saveProfile({ ...profile, status: "oracle" });
  syncProfileTotals({ status: "oracle" });
};

const computeTotalLevel = () => {
  const dna = seedDNAIfMissing();
  return dna.assets.reduce((sum, asset) => sum + Number(asset.level || 0), 0);
};

const updateIntegrityBar = () => {
  const fill = document.getElementById("integrity-fill");
  if (!fill) return;
  const profile = loadProfile();
  const moodLevel = Number(profile.moodLevel);
  if (!Number.isNaN(moodLevel)) {
    fill.style.width = `${Math.max(0, Math.min(100, moodLevel))}%`;
    if (profile.moodColor) fill.style.background = profile.moodColor;
    return;
  }
  const planner = loadPlanner();
  const now = Date.now();
  const todayKey = getWeekdayKeyForDate(new Date());
  const doneRecent = planner.bronzeActions.filter((action) => {
    if (action.status !== "done" || !action.completedAt) return false;
    return now - new Date(action.completedAt).getTime() < 24 * 60 * 60 * 1000;
  }).length;
  const scheduledToday = planner.bronzeActions.filter(
    (action) =>
      Number(action.scheduledDayOffset || 0) === 0 ||
      (Array.isArray(action.weekdays) && action.weekdays.includes(todayKey)),
  ).length;
  const total = Math.max(1, scheduledToday);
  const ratio = Math.min(1, doneRecent / total);
  fill.style.width = `${Math.round(ratio * 100)}%`;
  fill.style.boxShadow =
    ratio > 0 ? "0 0 8px rgba(46, 204, 113, 0.6)" : "0 0 0 rgba(0,0,0,0)";
};

const updateHudIdentity = (profileOverride) => {
  const hudAvatar = document.getElementById("hud-avatar");
  const hudNick = document.getElementById("hud-nick");
  const hudLevel = document.getElementById("hud-level");
  const hudLevelText = document.getElementById("hud-level-text");
  const profile = profileOverride || loadProfile();
  const total = computeTotalLevel();
  if (hudNick) hudNick.textContent = profile.nickname || profile.userId || "-";
  if (hudLevel) hudLevel.textContent = String(Math.round(total));
  if (hudLevelText) hudLevelText.textContent = `Nivel ${Math.round(total)}`;
  if (hudAvatar) {
    if (profile.avatar) {
      hudAvatar.style.backgroundImage = `url(${profile.avatar})`;
      hudAvatar.style.backgroundSize = "cover";
      hudAvatar.style.backgroundPosition = "center";
    } else {
      hudAvatar.style.backgroundImage = "";
    }
  }
};

const MOODS = [
  {
    label: "Vergonha",
    min: 0,
    max: 5,
    color: "linear-gradient(90deg, #6b1e1e, #8b2b2b)",
    trackStart: "#6b1e1e",
    trackEnd: "#8b2b2b",
  },
  {
    label: "Culpa",
    min: 5,
    max: 10,
    color: "linear-gradient(90deg, #8b3b1e, #a24a22)",
    trackStart: "#8b3b1e",
    trackEnd: "#a24a22",
  },
  {
    label: "Apatia",
    min: 10,
    max: 15,
    color: "linear-gradient(90deg, #b35a1e, #c46a22)",
    trackStart: "#b35a1e",
    trackEnd: "#c46a22",
  },
  {
    label: "Tristeza",
    min: 15,
    max: 20,
    color: "linear-gradient(90deg, #d47a1e, #e28b2a)",
    trackStart: "#d47a1e",
    trackEnd: "#e28b2a",
  },
  {
    label: "Medo",
    min: 20,
    max: 25,
    color: "linear-gradient(90deg, #e2a43a, #f0b84a)",
    trackStart: "#e2a43a",
    trackEnd: "#f0b84a",
  },
  {
    label: "Desejo",
    min: 25,
    max: 30,
    color: "linear-gradient(90deg, #e6c14a, #f0d35a)",
    trackStart: "#e6c14a",
    trackEnd: "#f0d35a",
  },
  {
    label: "Raiva",
    min: 30,
    max: 35,
    color: "linear-gradient(90deg, #d48a2a, #e49c3a)",
    trackStart: "#d48a2a",
    trackEnd: "#e49c3a",
  },
  {
    label: "Orgulho",
    min: 35,
    max: 45,
    color: "linear-gradient(90deg, #c6b83a, #d8cf4a)",
    trackStart: "#c6b83a",
    trackEnd: "#d8cf4a",
  },
  {
    label: "Coragem",
    min: 45,
    max: 55,
    color: "linear-gradient(90deg, #8fcf3a, #a6e34a)",
    trackStart: "#8fcf3a",
    trackEnd: "#a6e34a",
  },
  {
    label: "Neutralidade",
    min: 55,
    max: 60,
    color: "linear-gradient(90deg, #4fbf6a, #62d07a)",
    trackStart: "#4fbf6a",
    trackEnd: "#62d07a",
  },
  {
    label: "Disposicao",
    min: 60,
    max: 65,
    color: "linear-gradient(90deg, #3dbf8a, #50d09c)",
    trackStart: "#3dbf8a",
    trackEnd: "#50d09c",
  },
  {
    label: "Aceitacao",
    min: 65,
    max: 70,
    color: "linear-gradient(90deg, #2bb3b3, #3ac6c6)",
    trackStart: "#2bb3b3",
    trackEnd: "#3ac6c6",
  },
  {
    label: "Razao",
    min: 70,
    max: 75,
    color: "linear-gradient(90deg, #2a7bd4, #3a93e6)",
    trackStart: "#2a7bd4",
    trackEnd: "#3a93e6",
  },
  {
    label: "Amor",
    min: 75,
    max: 85,
    color: "linear-gradient(90deg, #3c5bff, #5a79ff)",
    trackStart: "#3c5bff",
    trackEnd: "#5a79ff",
  },
  {
    label: "Alegria",
    min: 85,
    max: 90,
    color: "linear-gradient(90deg, #6a3dff, #8a5bff)",
    trackStart: "#6a3dff",
    trackEnd: "#8a5bff",
  },
  {
    label: "Paz",
    min: 90,
    max: 95,
    color: "linear-gradient(90deg, #7a2fd1, #943de0)",
    trackStart: "#7a2fd1",
    trackEnd: "#943de0",
  },
  {
    label: "Iluminacao",
    min: 95,
    max: 101,
    color: "linear-gradient(90deg, #b227b5, #d06ad8)",
    trackStart: "#b227b5",
    trackEnd: "#d06ad8",
  },
];

const getMoodMeta = (value) => {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  return MOODS.find((mood) => clamped >= mood.min && clamped < mood.max) || MOODS[MOODS.length - 1];
};

const updateProfileMoodDisplay = (source) => {
  const fill = document.getElementById("profile-mood-fill");
  const strip = document.getElementById("profile-strip");
  const label = document.getElementById("profile-mood-label");
  const valueEl = document.getElementById("profile-mood-value");
  if (!fill && !strip) return;
  const moodLevel = Number(source?.moodLevel ?? source?.player_data?.moodLevel ?? 0);
  const clamped = Math.max(0, Math.min(100, Number.isNaN(moodLevel) ? 0 : moodLevel));
  const mood = getMoodMeta(clamped);
  if (label) label.textContent = mood.label;
  if (valueEl) valueEl.textContent = `${Math.round(clamped)}%`;
  const moodColor = source?.moodColor || source?.player_data?.moodColor || mood.color;
  if (fill) {
    fill.style.width = `${clamped}%`;
    if (moodColor) fill.style.background = moodColor;
  }
  if (strip && moodColor) {
    strip.style.background = moodColor;
    strip.style.backgroundImage = "";
  }
};

let treeEditDraft = null;

const initTreeEditDraft = (asset) => {
  if (!asset) return;
  treeEditDraft = {
    assetId: asset.id,
    profileSlots: JSON.parse(JSON.stringify(asset.profileSlots || {})),
    additionalSlots: JSON.parse(JSON.stringify(asset.additionalSlots || [])),
    extraSlots: JSON.parse(JSON.stringify(asset.extraSlots || [])),
    slotLayoutOverrides: JSON.parse(JSON.stringify(asset.slotLayoutOverrides || {})),
  };
};

const discardTreeEditDraft = () => {
  treeEditDraft = null;
};

const applyTreeEditDraft = (dna, assetId) => {
  if (!dna || !assetId || !treeEditDraft || treeEditDraft.assetId !== assetId) return null;
  const asset = getAssetFromDNA(dna, assetId);
  if (!asset) return null;
  asset.profileSlots = treeEditDraft.profileSlots || {};
  asset.additionalSlots = treeEditDraft.additionalSlots || [];
  asset.extraSlots = treeEditDraft.extraSlots || [];
  asset.slotLayoutOverrides = treeEditDraft.slotLayoutOverrides || {};
  dna.lastUpdatedAt = new Date().toISOString();
  saveDNA(dna);
  treeEditDraft = null;
  return asset;
};

const getTreeEditAssetView = (asset) => {
  if (!asset) return asset;
  if (treeEditDraft?.assetId !== asset.id) return asset;
  return {
    ...asset,
    profileSlots: treeEditDraft.profileSlots || {},
    additionalSlots: treeEditDraft.additionalSlots || [],
    extraSlots: treeEditDraft.extraSlots || [],
    slotLayoutOverrides: treeEditDraft.slotLayoutOverrides || {},
  };
};

const refreshTreeEditAddSlotButton = (dna, asset) => {
  const modal = document.getElementById("tree-edit-modal");
  const addSlotBtn = document.getElementById("tree-edit-add-slot");
  if (!modal || !addSlotBtn || !asset) return;
  const isEditing = modal.classList.contains("is-editing");
  const assetView = getTreeEditAssetView(asset);
  const options = getAddableSlotOptions(asset.id, assetView);
  addSlotBtn.style.display = isEditing && options.length ? "" : "none";
  addSlotBtn.onclick = () => {
    playMetalClick();
    if (!modal.classList.contains("is-editing")) return;
    if (!treeEditDraft || treeEditDraft.assetId !== asset.id) return;
    const currentView = getTreeEditAssetView(asset);
    const currentOptions = getAddableSlotOptions(asset.id, currentView);
    if (!currentOptions.length) return;
    const pickOption = (list) => {
      if (list.length === 1) return list[0];
      const message = list.map((opt, idx) => `${idx + 1}. ${opt.label}`).join("\n");
      const input = window.prompt(`Adicionar slot:\n${message}`);
      const selected = Number(input);
      if (!Number.isInteger(selected) || selected < 1 || selected > list.length) return null;
      return list[selected - 1];
    };
    const chosen = pickOption(currentOptions);
    if (!chosen) return;
    if (chosen.kind === "optional") {
      const additional = normalizeAdditionalSlots(treeEditDraft);
      if (!additional.includes(chosen.slot.id)) {
        additional.push(chosen.slot.id);
      }
    } else if (chosen.kind === "dynamic") {
      const extra = normalizeExtraSlots(treeEditDraft);
      const newSlot = buildExtraSlot(asset.id, currentView);
      if (newSlot) extra.push(newSlot);
    }
    renderTreeEditorSlots(dna, asset.id);
    refreshTreeEditAddSlotButton(dna, asset);
  };
};

const fetchVitalityLogs = async () => {
  if (!isSupabaseEnabled()) return [];
  try {
    const user = await getSupabaseUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("action_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      logSupabaseError("action_logs.select", error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logSupabaseError("fetchVitalityLogs", error);
    return [];
  }
};

const parseLogTime = (log) => {
  const raw = log.created_at || log.createdAt || log.timestamp || log.date;
  const parsed = raw ? new Date(raw).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
};

const buildVitalityStats = () => {
  const planner = loadPlanner();
  const arenas = loadArenas();
  const profile = loadProfile();
  const now = Date.now();
  const todayKey = getWeekdayKeyForDate(new Date());
  const stats = new Map(
    SEPHIROT.map((asset) => [
      asset.id,
      { hasPendingToday: false, hasDone24h: false, hasFlames: false, lastActivityAt: 0 },
    ]),
  );
  const arenasById = new Map(arenas.map((arena) => [arena.id, arena]));

  planner.bronzeActions.forEach((action) => {
    const arena = arenasById.get(action.arenaId);
    if (!arena) return;
    const assetId = arena.assetId;
    const stat = stats.get(assetId);
    if (!stat) return;
    const scheduledToday =
      Number(action.scheduledDayOffset || 0) === 0 ||
      (Array.isArray(action.weekdays) && action.weekdays.includes(todayKey));
    if (scheduledToday && action.status !== "done") stat.hasPendingToday = true;
    const completedAt = action.completedAt ? new Date(action.completedAt).getTime() : 0;
    if (completedAt && now - completedAt < 24 * 60 * 60 * 1000) {
      stat.hasDone24h = true;
    }
    const createdAt = action.createdDate ? new Date(action.createdDate).getTime() : 0;
    stat.lastActivityAt = Math.max(stat.lastActivityAt, completedAt, createdAt);
  });

  arenas.forEach((arena) => {
    const stat = stats.get(arena.assetId);
    if (!stat) return;
    const completedAt = arena.completedAt ? new Date(arena.completedAt).getTime() : 0;
    if (completedAt && now - completedAt < 48 * 60 * 60 * 1000) {
      stat.hasFlames = true;
    }
    stat.lastActivityAt = Math.max(stat.lastActivityAt, completedAt);
  });

  if (profile.lemaUpdatedAt) {
    const lemaUpdated = new Date(profile.lemaUpdatedAt).getTime();
    if (now - lemaUpdated < 48 * 60 * 60 * 1000) {
      const targetId = profile.lemaUpdatedAssetId;
      if (targetId && stats.has(targetId)) {
        stats.get(targetId).hasFlames = true;
        stats.get(targetId).lastActivityAt = Math.max(stats.get(targetId).lastActivityAt, lemaUpdated);
      }
    }
  }

  if (vitalityLogs.length > 0) {
    vitalityLogs.forEach((log) => {
      const assetId = log.asset_id || log.assetId;
      const stat = stats.get(assetId);
      if (!stat) return;
      const time = parseLogTime(log);
      if (!time) return;
      stat.lastActivityAt = Math.max(stat.lastActivityAt, time);
      const type = (log.type || log.action_type || log.kind || "").toString().toLowerCase();
      if (type.includes("pending")) stat.hasPendingToday = true;
      if (type.includes("done") && now - time < 24 * 60 * 60 * 1000) stat.hasDone24h = true;
      if (type.includes("silver") || type.includes("gold")) {
        if (now - time < 48 * 60 * 60 * 1000) stat.hasFlames = true;
      }
    });
  }

  return stats;
};

const getVitalityClass = (stat) => {
  const now = Date.now();
  if (stat.hasFlames) return "vitality-flames";
  if (stat.hasDone24h) return "vitality-energized";
  if (stat.hasPendingToday) return "vitality-vibrant";
  if (!stat.lastActivityAt || now - stat.lastActivityAt > 72 * 60 * 60 * 1000) {
    return "vitality-fossil";
  }
  return "";
};

const updateMissionState = async (nextState) => {
  missionState = { ...missionState, ...nextState };
  saveMissionStateLocal(missionState);
  await syncMissionState(missionState);
  renderInitiationOverlay();
};

const formatPlannerDayLabel = (offset) => {
  const date = getPlannerDateFromOffset(offset);
  const weekdays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  return `${weekdays[date.getDay()]}, ${String(date.getDate()).padStart(2, "0")}/${months[date.getMonth()]}`;
};

const updateDayLabel = () => {
  const label = document.getElementById("day-label");
  if (!label) return;
  label.textContent = formatPlannerDayLabel(plannerDayOffset);
  label.classList.toggle("is-today", plannerDayOffset === 0);
};

const setPlannerDayOffset = (nextOffset) => {
  plannerDayOffset = Math.max(-7, Math.min(7, nextOffset));
  updateDayLabel();
  renderPlanner();
};

const buildBronzeElement = (action) => {
  const bronze = document.createElement("div");
  bronze.className = "bronze-item";
  bronze.dataset.id = action.id;
  const remaining = getActionRemainingForWeek(action);
  bronze.draggable = remaining > 0;
  if (action.serious) bronze.classList.add("serious");
  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", action.icon || "circle");
  bronze.appendChild(icon);
  const weeklyTarget = getActionWeeklyTarget(action);
  bronze.addEventListener("click", () => {
    openBronzeModal(action.arenaId, action.id);
  });
  bronze.addEventListener("dragstart", (event) => {
    if (!bronze.draggable) return;
    event.dataTransfer?.setData("text/plain", `bronze:${action.id}`);
  });
  if (!action.atemporal && weeklyTarget > 1) {
    const badge = document.createElement("div");
    badge.className = "bronze-count";
    badge.textContent = `x${remaining}`;
    bronze.appendChild(badge);
  }
  return bronze;
};

const renderWeekView = () => {
  const weekGrid = document.getElementById("week-grid");
  if (!weekGrid) return;
  const planner = loadPlanner();
  const weekStart = getWeekStartDate(new Date());
  const todayKey = formatDateKey(new Date());
  const isNarrow = window.innerWidth <= 520;
  const pixelsPerMinute = isNarrow ? 0.6 : 1;
  const slotHeight = Math.round(60 * pixelsPerMinute);
  const dayStartHour = 4;
  const dayEndHour = 28;
  const slotMap = new Map();

  const pushAction = (dateKey, hour, action, dayDate) => {
    const slotKey = `${dateKey}:${hour}`;
    if (!slotMap.has(slotKey)) slotMap.set(slotKey, []);
    slotMap.get(slotKey).push({ action, dayDate });
  };

  planner.bronzeActions.forEach((action) => {
    const plannedSlots = Array.isArray(action.plannedSlots) ? action.plannedSlots : [];
    plannedSlots.forEach((slot) => {
      if (!slot?.dateKey) return;
      const slotDate = new Date(slot.dateKey);
      const weekKey = formatDateKey(slotDate);
      const weekStartKey = formatDateKey(weekStart);
      const weekEndKey = formatDateKey(getWeekEndDate(weekStart));
      if (weekKey < weekStartKey || weekKey > weekEndKey) return;
      const hour = Number(slot.hour ?? action.scheduledHour ?? dayStartHour);
      pushAction(weekKey, hour, action, slotDate);
    });

    if (action.scheduledDayOffset !== undefined && action.scheduledDayOffset !== null) {
      const dayDate = getPlannerDateFromOffset(action.scheduledDayOffset);
      const dateKey = formatDateKey(dayDate);
      const weekStartKey = formatDateKey(weekStart);
      const weekEndKey = formatDateKey(getWeekEndDate(weekStart));
      if (dateKey >= weekStartKey && dateKey <= weekEndKey) {
        const hour = Number(action.scheduledHour ?? dayStartHour);
        pushAction(dateKey, hour, action, dayDate);
      }
    }

    if (Array.isArray(action.weekdays) && action.weekdays.length) {
      WEEKDAYS.forEach((day, index) => {
        if (!action.weekdays.includes(day.key)) return;
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + index);
        const dateKey = formatDateKey(dayDate);
        const hour = Number(action.scheduledHour ?? dayStartHour);
        pushAction(dateKey, hour, action, dayDate);
      });
    }
  });

  weekGrid.innerHTML = "";
  weekGrid.classList.remove("week-mini", "week-hours");
  weekGrid.classList.add("week-timeline");

  const header = document.createElement("div");
  header.className = "week-timeline-header";
  WEEKDAYS.forEach((day, index) => {
    const label = document.createElement("div");
    label.className = "week-day-label";
    label.textContent = day.label;
    const dateKey = getWeekDateKeyByIndex(weekStart, index);
    if (dateKey === todayKey) label.classList.add("is-today");
    header.appendChild(label);
  });
  weekGrid.appendChild(header);

  const body = document.createElement("div");
  body.className = "week-timeline-body";

  WEEKDAYS.forEach((_, index) => {
    const dayCol = document.createElement("div");
    dayCol.className = "week-day-col";
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + index);
    const dateKey = formatDateKey(dayDate);
    for (let hour = dayStartHour; hour <= dayEndHour; hour += 1) {
      const slot = document.createElement("div");
      slot.className = "time-slot";
      slot.style.height = `${slotHeight}px`;
      slot.style.minHeight = `${slotHeight}px`;
      if (index === 0) {
        const label = document.createElement("div");
        label.className = "time-label";
        label.textContent = `${String(hour % 24).padStart(2, "0")}:00`;
        slot.appendChild(label);
      }
      const slotKey = `${dateKey}:${hour}`;
      const items = slotMap.get(slotKey) || [];
      items.forEach(({ action, dayDate: actionDay }) => {
        const block = buildBronzeBlock(action, {
          dayDate: actionDay,
          isRecurring: Array.isArray(action.weekdays) && action.weekdays.includes(getWeekdayKeyForDate(actionDay)),
        });
        block.classList.add("week-block");
        slot.appendChild(block);
      });
      dayCol.appendChild(slot);
    }
    body.appendChild(dayCol);
  });
  weekGrid.appendChild(body);
  if (window.lucide) window.lucide.createIcons();
};

const buildBronzeBlock = (action, options = {}) => {
  const block = document.createElement("div");
  block.className = "bronze-block";
  block.dataset.id = action.id;
  const dayDate = options.dayDate;
  const isRecurring = Boolean(options.isRecurring && dayDate);
  const isDoneForDay = isRecurring ? isActionDoneOnDate(action, dayDate) : action.status === "done";
  if (isDoneForDay) block.classList.add("done");
  if (!isDoneForDay) block.classList.add("is-pending");
  if (action.status === "scheduled" || action.status === "done") {
    block.draggable = true;
    block.addEventListener("dragstart", (event) => {
      const timer = block.dataset.timer;
      if (timer) clearTimeout(Number(timer));
      block.classList.remove("is-pressing");
      block.dataset.timer = "";
      event.dataTransfer?.setData("text/plain", `bronze:${action.id}`);
    });
  }
  const icon = document.createElement("i");
  icon.className = "bronze-icon";
  icon.setAttribute("data-lucide", action.icon || "circle");
  const title = document.createElement("div");
  title.className = "bronze-title";
  title.textContent = action.title || "Acao";
  const checkmark = document.createElement("span");
  checkmark.className = "bronze-checkmark";
  checkmark.innerHTML = '<i data-lucide="check"></i>';

  const holdMs = typeof options.holdMs === "number" ? options.holdMs : HOLD_DURATION_MS;
  const startPress = () => {
    block.classList.add("is-pressing");
    const timer = setTimeout(() => {
      const planner = loadPlanner();
      const updated = planner.bronzeActions.map((item) => {
        if (item.id !== action.id) return item;
        const history = Array.isArray(item.completedHistory) ? item.completedHistory : [];
        if (isRecurring && dayDate) {
          const dayKey = formatDateKey(dayDate);
          const hasDay = history.some((stamp) => formatDateKey(new Date(stamp)) === dayKey);
          const nextHistory = hasDay
            ? history.filter((stamp) => formatDateKey(new Date(stamp)) !== dayKey)
            : [...history, new Date().toISOString()];
          const nextCompletedAt = nextHistory.length
            ? nextHistory[nextHistory.length - 1]
            : undefined;
          return {
            ...item,
            completedAt: nextCompletedAt,
            completedHistory: nextHistory,
          };
        }
        if (item.status === "done") {
          return { ...item, status: "scheduled", completedAt: undefined };
        }
        const completedAt = new Date().toISOString();
        return {
          ...item,
          status: "done",
          completedAt,
          completedHistory: [...history, completedAt],
        };
      });
      savePlanner({ ...planner, bronzeActions: updated });
      if (!isRecurring) {
        if (action.status === "done") {
          updateArenaCountsForBronze(action.arenaId, -1);
        } else {
          updateArenaCountsForBronze(action.arenaId, 1);
        }
      }
      updateGlobalArenaProgress(action.arenaId, updated);
      renderPlanner();
      renderArenas();
      checkMissionProgress();
    }, holdMs);
    block.dataset.timer = String(timer);
  };

  const endPress = () => {
    const timer = block.dataset.timer;
    if (timer) clearTimeout(Number(timer));
    block.classList.remove("is-pressing");
    block.dataset.timer = "";
  };

  block.addEventListener("mousedown", startPress);
  block.addEventListener("touchstart", startPress);
  block.addEventListener("mouseup", endPress);
  block.addEventListener("mouseleave", endPress);
  block.addEventListener("touchend", endPress);
  block.addEventListener("touchcancel", endPress);
  block.appendChild(icon);
  block.appendChild(title);
  block.appendChild(checkmark);
  if (!action.atemporal) {
    const weeklyTarget = getActionWeeklyTarget(action);
    if (weeklyTarget > 1) {
      const remaining = getActionRemainingForWeek(action, dayDate || new Date());
      const badge = document.createElement("div");
      badge.className = "bronze-count bronze-count--block";
      badge.textContent = `x${remaining}`;
      block.classList.add("has-multi");
      block.appendChild(badge);
    }
  }
  return block;
};

const createPlannerActionFromArena = (arena) => {
  const planner = loadPlanner();
  const action = {
    id: crypto.randomUUID(),
    title: arena.title || "Acao",
    status: "backlog",
    arenaId: arena.id,
    createdDate: new Date().toISOString(),
  };
  planner.pills.push(action);
  savePlanner(planner);
  renderPlanner();
};

const isPlaceholderArenaTitle = (title) => {
  const normalized = String(title || "").trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === "arena") return true;
  return /^(arena\s*)?(teste|exemplo|demo|sample)\b/.test(normalized);
};

const isValidArenaRecord = (arena, validAssets) => {
  if (!arena) return false;
  if (arena.isPlaceholder || arena.isDemo || arena.isSeed) return false;
  if (typeof arena.id !== "string" || !arena.id.trim()) return false;
  if (typeof arena.assetId !== "string" || !validAssets.has(arena.assetId)) return false;
  if (typeof arena.title !== "string" || !arena.title.trim()) return false;
  if (isPlaceholderArenaTitle(arena.title)) return false;
  return true;
};

const loadArenas = () => {
  const profile = loadProfile();
  const normalized = normalizePlayerData(profile);
  const stored = Array.isArray(normalized.arenas) ? normalized.arenas : profile.playerData?.arenas;
  if (Array.isArray(stored) && stored.length) {
    const validAssets = new Set(SEPHIROT.map((asset) => asset.id));
    return stored.filter((arena) => isValidArenaRecord(arena, validAssets));
  }
  if (!shouldPersistLocalData()) {
    return [];
  }
  try {
    const raw = safeLocalGet(ARENAS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    const validAssets = new Set(SEPHIROT.map((asset) => asset.id));
    return list.filter((arena) => isValidArenaRecord(arena, validAssets));
  } catch {
    return [];
  }
};

const saveArenas = (arenas) => {
  const persistLocal = shouldPersistLocalData();
  const profile = loadProfile();
  const normalized = normalizePlayerData(profile);
  const nextData = { ...normalized, arenas };
  setProfileCache({ ...profile, playerData: nextData }, persistLocal);
  queueSupabaseProfileUpdate({ player_data: nextData });
  if (persistLocal) {
    safeLocalSet(ARENAS_KEY, JSON.stringify(arenas));
  }
};

const updateGlobalArenaProgress = (arenaId, pills) => {
  if (!arenaId) return;
  const planner = loadPlanner();
  const allActions = planner.bronzeActions.filter((action) => action.arenaId === arenaId);
  const weightFor = (action) => {
    if (action.atemporal) return 1;
    if (typeof action.weeklyTarget === "number" && action.weeklyTarget > 0) return action.weeklyTarget;
    return Array.isArray(action.weekdays) && action.weekdays.length > 0 ? action.weekdays.length : 1;
  };
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const doneFor = (action) => {
    if (action.atemporal) return action.status === "done" ? 1 : 0;
    const history = Array.isArray(action.completedHistory) ? action.completedHistory : [];
    const recent = history.filter((stamp) => {
      const time = new Date(stamp).getTime();
      return Number.isFinite(time) && time >= weekAgo;
    }).length;
    if (recent > 0) return Math.min(recent, weightFor(action));
    return action.status === "done" ? 1 : 0;
  };
  const total = allActions.reduce((sum, action) => sum + weightFor(action), 0);
  const done = allActions.reduce((sum, action) => sum + doneFor(action), 0);
  const completion = total === 0 ? 0 : Math.round((done / total) * 100);

  const arenas = loadArenas();
  const updated = arenas.map((arena) =>
    arena.id === arenaId ? { ...arena, completion } : arena
  );
  saveArenas(updated);

  try {
    const dnaRaw = safeLocalGet(STORAGE_KEY);
    if (!dnaRaw) return;
    const dna = JSON.parse(dnaRaw);
    const existing = Array.isArray(dna.arenas) ? dna.arenas : [];
    const merged = existing.map((arena) =>
      arena.id === arenaId ? { ...arena, completion } : arena
    );
    dna.arenas = merged;
    safeLocalSet(STORAGE_KEY, JSON.stringify(dna));
  } catch {
    return;
  }
};

const updateArenaCountsForBronze = (arenaId, delta) => {
  const arenas = loadArenas();
  const updated = arenas.map((arena) => {
    if (arena.id !== arenaId) return arena;
    if (!arena.targetCount) return arena;
    const current = Number(arena.completedCount || 0);
    const next = Math.max(0, Math.min(arena.targetCount, current + delta));
    const completion = arena.targetCount
      ? Math.round((next / arena.targetCount) * 100)
      : arena.completion;
    const completedAt = completion >= 100 ? new Date().toISOString() : arena.completedAt;
    return { ...arena, completedCount: next, completion, completedAt };
  });
  saveArenas(updated);

  try {
    const dnaRaw = safeLocalGet(STORAGE_KEY);
    if (!dnaRaw) return;
    const dna = JSON.parse(dnaRaw);
    const existing = Array.isArray(dna.arenas) ? dna.arenas : [];
    const merged = existing.map((arena) => {
      if (arena.id !== arenaId) return arena;
      if (!arena.targetCount) return arena;
      const current = Number(arena.completedCount || 0);
      const next = Math.max(0, Math.min(arena.targetCount, current + delta));
      const completion = arena.targetCount
        ? Math.round((next / arena.targetCount) * 100)
        : arena.completion;
      const completedAt = completion >= 100 ? new Date().toISOString() : arena.completedAt;
      return { ...arena, completedCount: next, completion, completedAt };
    });
    dna.arenas = merged;
    safeLocalSet(STORAGE_KEY, JSON.stringify(dna));
  } catch {
    return;
  }
};

const setArenaQuickDone = (arenaId, isDone) => {
  const arenas = loadArenas();
  const updated = arenas.map((arena) => {
    if (arena.id !== arenaId) return arena;
    const completion = arena.targetCount ? arena.completion : isDone ? 100 : 0;
    const completedAt = isDone ? new Date().toISOString() : undefined;
    return { ...arena, quickDone: isDone, completion, completedAt };
  });
  saveArenas(updated);
  try {
    const dnaRaw = safeLocalGet(STORAGE_KEY);
    if (!dnaRaw) return;
    const dna = JSON.parse(dnaRaw);
    const existing = Array.isArray(dna.arenas) ? dna.arenas : [];
    const merged = existing.map((arena) =>
      arena.id === arenaId
        ? { ...arena, quickDone: isDone, completion: isDone ? 100 : 0 }
        : arena,
    );
    dna.arenas = merged;
    safeLocalSet(STORAGE_KEY, JSON.stringify(dna));
  } catch {
    return;
  }
};

const buildArenaCard = (arena, { compact = false, showAdd = false } = {}) => {
  const card = document.createElement("div");
  const completionValue = Number(arena.completion || 0);
  card.className = `arena-card scan-card${completionValue >= 100 ? " is-complete" : ""}`;
  if (compact) card.classList.add("arena-card--mini");
  const iconSquare = document.createElement("div");
  iconSquare.className = "arena-icon-square";
  const iconName = arena.icon || ICON_BY_ID[arena.assetId] || "circle";
  iconSquare.innerHTML = `<i data-lucide="${iconName}"></i>`;
  const title = document.createElement("div");
  title.className = "arena-title";
  title.textContent = arena.title || "Arena";
  const progress = document.createElement("div");
  progress.className = "arena-progress";
  if (arena.targetCount) {
    progress.textContent = `${Number(arena.completedCount || 0)}/${arena.targetCount}`;
  } else {
    progress.textContent = `${Math.round(completionValue)}%`;
  }
  const description = document.createElement("div");
  description.className = "arena-description";
  description.textContent = arena.description || "Sem descricao";
  const meta = document.createElement("div");
  meta.className = "arena-meta";
  if (arena.targetCount) {
    meta.textContent = `Meta: ${arena.targetCount}`;
  } else {
    meta.textContent = `Meta: ${Math.round(completionValue)}%`;
  }
  const actionsRow = document.createElement("div");
  actionsRow.className = "arena-bronze-row arena-bronze-row--card";
  const planner = loadPlanner();
  const bronzeActions = planner.bronzeActions.filter((action) => action.arenaId === arena.id);
  if (bronzeActions.length) {
    const maxSlots = compact ? 4 : 6;
    const visibleActions = compact ? bronzeActions.slice(0, maxSlots) : bronzeActions;
    visibleActions.forEach((action) => {
      const slot = document.createElement("div");
      slot.className = "arena-bronze-slot";
      if (action.status === "done") slot.classList.add("arena-bronze-slot--done");
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", action.icon || "circle");
      slot.appendChild(icon);
      const weeklyTarget = getActionWeeklyTarget(action);
      if (!action.atemporal && weeklyTarget > 1) {
        const remaining = getActionRemainingForWeek(action);
        slot.dataset.count = String(remaining);
      }
      actionsRow.appendChild(slot);
    });
    if (compact && bronzeActions.length > maxSlots) {
      const extra = document.createElement("div");
      extra.className = "arena-bronze-slot arena-bronze-slot--add";
      extra.textContent = `+${bronzeActions.length - maxSlots}`;
      actionsRow.appendChild(extra);
    }
  }
  const progressBar = document.createElement("div");
  progressBar.className = "arena-progress-bar arena-progress-gold arena-progress-bar--thin";
  const progressFill = document.createElement("div");
  progressFill.className = "arena-progress-fill";
  progressFill.style.width = `${Math.min(100, Math.max(0, completionValue))}%`;
  progressBar.appendChild(progressFill);
  const assetLabel = document.createElement("div");
  assetLabel.className = "arena-asset";
  const assetName = LABEL_BY_ID.get(arena.assetId) ?? "Ativo";
  assetLabel.textContent = `Arena: ${assetName}`;
  card.addEventListener("click", () => {
    openArenaDossier(arena.id);
  });
  if (!compact) {
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      const payload = event.dataTransfer?.getData("text/plain");
      if (!payload || !payload.startsWith("bronze:")) return;
      const actionId = payload.replace("bronze:", "");
      const planner = loadPlanner();
      const updated = planner.bronzeActions.map((action) => {
        if (action.id !== actionId) return action;
        return {
          ...action,
          status: "backlog",
          scheduledHour: undefined,
          scheduledMinute: undefined,
          scheduledDayOffset: undefined,
        };
      });
      savePlanner({ ...planner, bronzeActions: updated });
      renderPlanner();
    });
  }
  if (showAdd) {
    const add = document.createElement("button");
    add.type = "button";
    add.className = "arena-mini-add";
    add.textContent = "+";
    add.setAttribute("aria-label", "Adicionar acao de bronze");
    add.addEventListener("click", (event) => {
      event.stopPropagation();
      openBronzeModal(arena.id);
    });
    card.appendChild(add);
  }
  card.appendChild(iconSquare);
  card.appendChild(title);
  card.appendChild(assetLabel);
  card.appendChild(description);
  if (bronzeActions.length) card.appendChild(actionsRow);
  card.appendChild(meta);
  card.appendChild(progressBar);
  card.appendChild(progress);
  return card;
};

const buildArenaAddCard = () => {
  const card = document.createElement("div");
  card.className = "arena-card scan-card arena-card--add";
  const title = document.createElement("div");
  title.className = "arena-title";
  title.textContent = "";
  const description = document.createElement("div");
  description.className = "arena-description";
  description.textContent = "";
  const actionsLabel = document.createElement("div");
  actionsLabel.className = "arena-meta";
  actionsLabel.textContent = "";
  const actionsRow = document.createElement("div");
  actionsRow.className = "arena-bronze-row";
  for (let i = 0; i < 3; i += 1) {
    const slot = document.createElement("div");
    slot.className = "arena-bronze-slot";
    actionsRow.appendChild(slot);
  }
  const addSlot = document.createElement("div");
  addSlot.className = "arena-bronze-slot arena-bronze-slot--add";
  addSlot.textContent = "+";
  actionsRow.appendChild(addSlot);
  const progressBar = document.createElement("div");
  progressBar.className = "arena-progress-bar arena-progress-gold arena-progress-bar--thin";
  const progressFill = document.createElement("div");
  progressFill.className = "arena-progress-fill";
  progressFill.style.width = "0%";
  progressBar.appendChild(progressFill);
  card.appendChild(title);
  card.appendChild(description);
  card.appendChild(actionsLabel);
  card.appendChild(actionsRow);
  card.appendChild(progressBar);
  card.addEventListener("click", () => {
    openArenaModal();
  });
  return card;
};

const buildArenaAddMiniCard = (assetId) => {
  const card = document.createElement("div");
  card.className = "arena-card scan-card arena-card--add arena-card--add-mini";
  card.textContent = "+";
  card.addEventListener("click", (event) => {
    event.stopPropagation();
    openArenaModalForAsset(assetId);
  });
  return card;
};

const renderArenas = () => {
  const arenaList = document.getElementById("arena-list");
  if (!arenaList) return;
  const arenas = loadArenas();
  arenaList.innerHTML = "";
  if (arenas.length === 0) return;
  arenas.forEach((arena) => {
    arenaList.appendChild(buildArenaCard(arena));
  });
  if (window.lucide) window.lucide.createIcons();
};

const dateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getPillDate = (pill) => {
  if (pill.scheduledDate) return dateOnly(new Date(pill.scheduledDate));
  if (pill.createdDate) return dateOnly(new Date(pill.createdDate));
  return dateOnly(new Date());
};

const cleanupPlannerHistory = () => {
  const planner = loadPlanner();
  const today = dateOnly(new Date());
  const filtered = planner.pills.filter((pill) => {
    if (pill.status === "done") return true;
    const pillDate = getPillDate(pill);
    return pillDate >= today;
  });
  if (filtered.length !== planner.pills.length) {
    savePlanner({ ...planner, pills: filtered });
  }
};

const shouldTriggerHiato = (lastLogin) => {
  if (!lastLogin) return false;
  const last = new Date(lastLogin);
  const diff = Date.now() - last.getTime();
  return diff > 3 * 24 * 60 * 60 * 1000;
};

const triggerHiato = () => {
  safeLocalSet(HIATO_KEY, "true");
  cleanupPlannerHistory();
  const modal = document.getElementById("hiato-modal");
  if (modal) modal.classList.add("is-open");
  document.body.classList.add("standby");
};

const clearHiato = () => {
  safeLocalSet(HIATO_KEY, "false");
  document.body.classList.remove("standby");
  const modal = document.getElementById("hiato-modal");
  if (modal) modal.classList.remove("is-open");
};

const applyHiatoIfNeeded = () => {
  const lastLogin = safeLocalGet(LOGIN_KEY);
  if (shouldTriggerHiato(lastLogin)) {
    triggerHiato();
  } else {
    const active = safeLocalGet(HIATO_KEY) === "true";
    if (active) {
      document.body.classList.add("standby");
      const modal = document.getElementById("hiato-modal");
      if (modal) modal.classList.add("is-open");
    }
  }
  safeLocalSet(LOGIN_KEY, new Date().toISOString());
};

const evaluateGlitch = () => {
  const now = Date.now();
  const storedUntil = Number(safeLocalGet(GLITCH_KEY) || 0);
  if (storedUntil > now) return storedUntil;

  const arenas = loadArenas();
  const overdue = arenas.some((arena) => {
    if (!arena.hardcore) return false;
    if (!arena.dueDate) return false;
    const completion = Number(arena.completion || 0);
    return new Date(arena.dueDate).getTime() < now && completion < 100;
  });

  if (overdue) {
    const until = now + 48 * 60 * 60 * 1000;
    safeLocalSet(GLITCH_KEY, String(until));
    return until;
  }
  return 0;
};

const applyGlitch = () => {
  const avatar = document.getElementById("hud-avatar");
  if (!avatar) return;
  const glitchUntil = evaluateGlitch();
  if (glitchUntil > Date.now()) {
    avatar.classList.add("glitch");
  } else {
    avatar.classList.remove("glitch");
  }
};

const renderPlanner = () => {
  const timeline = document.getElementById("timeline");
  const bronzeList = document.getElementById("bronze-list");
  if (!timeline || !bronzeList) return;

  const planner = loadPlanner();
  const dayDate = getPlannerDateFromOffset(plannerDayOffset);
  const dayKey = getWeekdayKeyForDate(dayDate);
  const dayStartHour = 4;
  const dayEndHour = 28;
  const isNarrow = window.innerWidth <= 520;
  const pixelsPerMinute = isNarrow ? 0.6 : 1;

  timeline.innerHTML = "";
  const bronzeLayer = document.createElement("div");
  bronzeLayer.style.position = "absolute";
  bronzeLayer.style.inset = "0";
  bronzeLayer.style.pointerEvents = "none";
  const hourCount = dayEndHour - dayStartHour + 1;
  const slotHeight = Math.round(60 * pixelsPerMinute);
  const timelineTopPadding = 16;
  timeline.style.height = "";
  timeline.style.overflowY = "auto";
  for (let hour = dayStartHour; hour <= dayEndHour; hour += 1) {
    const slot = document.createElement("div");
    slot.className = "time-slot";
    slot.dataset.hour = String(hour);
    slot.style.height = `${slotHeight}px`;
    slot.style.minHeight = `${slotHeight}px`;

    const label = document.createElement("div");
    label.className = "time-label";
    const displayHour = hour % 24;
    label.textContent = `${String(displayHour).padStart(2, "0")}:00`;
    slot.appendChild(label);

    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      const payload = event.dataTransfer?.getData("text/plain");
      if (!payload) return;
      if (payload.startsWith("bronze:")) {
        const actionId = payload.replace("bronze:", "");
        const dateKey = formatDateKey(dayDate);
        const actionRef = planner.bronzeActions.find((action) => action.id === actionId);
        if (!actionRef) return;
        const canPlace =
          actionRef.status === "scheduled" ||
          actionRef.status === "done" ||
          getActionRemainingForWeek(actionRef, dayDate) > 0;
        if (!canPlace) return;
        const updated = planner.bronzeActions.map((action) => {
          if (action.id !== actionId) return action;
          const plannedSlots = Array.isArray(action.plannedSlots) ? action.plannedSlots : [];
          const filteredSlots = plannedSlots.filter((slot) => slot?.dateKey !== dateKey);
          const nextSlots = [...filteredSlots, { dateKey, hour }];
          return {
            ...action,
            status: "scheduled",
            scheduledHour: hour,
            scheduledMinute: 0,
            scheduledDayOffset: plannerDayOffset,
            plannedSlots: nextSlots,
          };
        });
        savePlanner({ ...planner, bronzeActions: updated });
        renderPlanner();
        checkMissionProgress();
        return;
      }
      return;
    });

    timeline.appendChild(slot);
  }

  const visibleStartHour = 6;
  if (!Number.isNaN(slotHeight)) {
    timeline.scrollTop = Math.max(0, (visibleStartHour - dayStartHour) * slotHeight);
  }

  const scheduledActions = planner.bronzeActions.filter((action) => {
    const matchesDay = Number(action.scheduledDayOffset || 0) === plannerDayOffset;
    const hasPlannedSlots = Array.isArray(action.plannedSlots)
      ? action.plannedSlots.some((slot) => slot.dateKey === formatDateKey(dayDate))
      : false;
    return (action.status === "scheduled" || action.status === "done") && (matchesDay || hasPlannedSlots);
  });
  const scheduledIds = new Set(scheduledActions.map((action) => action.id));
  const recurringActions = planner.bronzeActions.filter(
    (action) =>
      !scheduledIds.has(action.id) &&
      Array.isArray(action.weekdays) &&
      action.weekdays.includes(dayKey),
  );
  [...scheduledActions, ...recurringActions].forEach((action) => {
    const slot = Array.isArray(action.plannedSlots)
      ? action.plannedSlots.find((s) => s.dateKey === formatDateKey(dayDate))
      : null;
    const scheduledHour = slot?.hour ?? action.scheduledHour ?? dayStartHour;
    const startHour = Math.min(dayEndHour, Math.max(dayStartHour, Number(scheduledHour)));
    const startMinute = Number(action.scheduledMinute || 0);
    const duration = Number(action.durationMinutes || 30);
    const block = buildBronzeBlock(action, {
      dayDate,
      isRecurring: recurringActions.includes(action),
    });
    const top =
      timelineTopPadding + (startHour - dayStartHour) * 60 * pixelsPerMinute + startMinute * pixelsPerMinute;
    block.style.top = `${top}px`;
    block.style.height = `${Math.max(20, duration * pixelsPerMinute)}px`;
    block.style.pointerEvents = "auto";
    bronzeLayer.appendChild(block);
  });
  timeline.appendChild(bronzeLayer);

  bronzeList.innerHTML = "";
  const bronzeBacklog = planner.bronzeActions.filter(
    (action) => action.status === "backlog" || getActionRemainingForWeek(action, dayDate) > 0,
  );
  if (bronzeBacklog.length === 0) {
    const empty = document.createElement("div");
    empty.className = "backlog-empty";
    empty.textContent = "Sem acoes de bronze.";
    bronzeList.appendChild(empty);
  } else {
    bronzeBacklog.forEach((action) => {
      bronzeList.appendChild(buildBronzeElement(action));
    });
  }

  if (window.lucide) window.lucide.createIcons();
  renderWeekView();
  const arenaIds = Array.from(
    new Set(planner.bronzeActions.map((action) => action.arenaId).filter(Boolean)),
  );
  arenaIds.forEach((arenaId) => updateGlobalArenaProgress(arenaId, planner.bronzeActions));
};

const buildPillElement = (pill, arenaTitle) => {
  const pillEl = document.createElement("div");
  pillEl.className = "pill";
  pillEl.dataset.id = pill.id;
  pillEl.draggable = pill.status === "backlog";

  if (pill.status === "done") {
    pillEl.classList.add("is-complete");
  }

  const title = document.createElement("div");
  title.className = "pill-title";
  title.textContent = pill.title ?? "Acao";

  const meta = document.createElement("div");
  meta.className = "pill-meta";
  meta.textContent = pill.arenaId ? `Arena: ${arenaTitle}` : "Sem arena";

  pillEl.appendChild(title);
  pillEl.appendChild(meta);

  pillEl.addEventListener("dragstart", (event) => {
    if (!pillEl.draggable) return;
    event.dataTransfer?.setData("text/plain", pill.id);
  });

  attachLongPress(pillEl, pill);

  return pillEl;
};

const attachLongPress = (pillEl, pill) => {
  if (pill.status !== "scheduled") return;
  let timer = null;
  let released = false;

  const startPress = () => {
    if (pill.status === "done") return;
    released = false;
    pillEl.classList.add("is-pressing");
    timer = setTimeout(() => {
      if (released) return;
      pillEl.classList.remove("is-pressing");
      markPillComplete(pill.id);
    }, HOLD_DURATION_MS);
  };

  const endPress = () => {
    released = true;
    pillEl.classList.remove("is-pressing");
    if (timer) clearTimeout(timer);
    timer = null;
  };

  pillEl.addEventListener("mousedown", startPress);
  pillEl.addEventListener("touchstart", startPress);
  pillEl.addEventListener("mouseup", endPress);
  pillEl.addEventListener("mouseleave", endPress);
  pillEl.addEventListener("touchend", endPress);
  pillEl.addEventListener("touchcancel", endPress);
};

const markPillComplete = (pillId) => {
  const planner = loadPlanner();
  const updated = planner.pills.map((pill) => {
    if (pill.id !== pillId) return pill;
    return { ...pill, status: "done", completedAt: new Date().toISOString() };
  });
  const nextPlanner = { ...planner, pills: updated };
  savePlanner(nextPlanner);

  const completed = updated.find((pill) => pill.id === pillId);
  if (completed?.arenaId) {
    updateGlobalArenaProgress(completed.arenaId, updated);
  }

  renderPlanner();
};

const setActiveScreen = (target) => {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === target);
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.target === target);
  });
  updateHudIdentity();
};

const initNav = () => {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.target;
      if (!target) return;
      setActiveScreen(target);
    });
  });
};

const getDNA = () => loadDNA();

const setDNACache = (dna, persistLocal = shouldPersistLocalData()) => {
  cachedDNA = dna || buildDefaultDNA();
  if (persistLocal) {
    safeLocalSet(STORAGE_KEY, JSON.stringify(cachedDNA));
  }
};

const computeAssetLevelsFromDNA = (dna) =>
  (dna?.assets || []).reduce((acc, asset) => {
    acc[asset.id] = Number(asset.level || 0);
    return acc;
  }, {});

const computeTotalLevelFromDNA = (dna) =>
  (dna?.assets || []).reduce((sum, asset) => sum + Number(asset.level || 0), 0);

const saveDNA = (dna, options = {}) => {
  const persistLocal = options.persistLocal ?? shouldPersistLocalData();
  setDNACache(dna, persistLocal);
  if (options.skipSync) return;
  const assetLevels = computeAssetLevelsFromDNA(dna);
  const total = computeTotalLevelFromDNA(dna);
  const profile = loadProfile();
  const normalized = normalizePlayerData(profile);
  const nextPlayerData = {
    ...normalized,
    assets: {
      ...(normalized.assets || {}),
      dna,
      levels: assetLevels,
      lastUpdatedAt: new Date().toISOString(),
    },
  };
  const updatedProfile = {
    ...profile,
    assetLevels,
    total_level: total,
    level_geral: total,
    playerData: nextPlayerData,
  };
  setProfileCache(updatedProfile, persistLocal);
  queueSupabaseProfileUpdate({
    player_data: nextPlayerData,
    asset_levels: assetLevels,
    total_level: total,
    level_geral: total,
  });
};

const seedDNAIfMissing = () => {
  const existing = getDNA();
  if (existing && Array.isArray(existing.assets)) return existing;
  const seeded = buildDefaultDNA();
  saveDNA(seeded, { skipSync: true });
  return seeded;
};

const getAssetFromDNA = (dna, assetId) => dna.assets.find((asset) => asset.id === assetId);

const ensureStatusFields = (dna, assetId) => {
  const asset = getAssetFromDNA(dna, assetId);
  if (!asset) return [];
  const defaults = STATUS_FIELDS[assetId] || [];
  if (!asset.statusFields) {
    asset.statusFields = defaults.map((label) => ({
      id: crypto.randomUUID(),
      label,
      value: "",
    }));
    return asset.statusFields;
  }
  const existingLabels = new Set(asset.statusFields.map((field) => field.label));
  defaults.forEach((label) => {
    if (!existingLabels.has(label)) {
      asset.statusFields.push({ id: crypto.randomUUID(), label, value: "" });
    }
  });
  return asset.statusFields;
};

const renderStatusFields = (dna, assetId) => {
  const list = document.getElementById("tree-status-list");
  if (!list) return;
  list.innerHTML = "";
  const fields = ensureStatusFields(dna, assetId);
  if (fields.length === 0) {
    const empty = document.createElement("div");
    empty.className = "arena-empty";
    empty.textContent = "Sem status tecnico.";
    list.appendChild(empty);
    return;
  }
  fields.forEach((field) => {
    const row = document.createElement("div");
    row.className = "status-row";
    const label = document.createElement("label");
    label.textContent = field.label;
    const input = document.createElement("input");
    input.type = "text";
    input.value = field.value ?? "";
    input.addEventListener("change", () => {
      field.value = input.value;
      dna.lastUpdatedAt = new Date().toISOString();
      saveDNA(dna);
    });
    row.appendChild(label);
    row.appendChild(input);
    list.appendChild(row);
  });
};

const applyAutoSlotDistribution = (list, slotItems) => {
  if (!list || !Array.isArray(slotItems) || slotItems.length === 0) return;
  const maxCols = 6;
  list.style.setProperty("display", "grid", "important");
  list.style.setProperty("grid-auto-flow", "row", "important");
  list.style.setProperty("grid-template-columns", `repeat(${maxCols}, minmax(0, 1fr))`, "important");
  list.style.setProperty("grid-auto-rows", "auto", "important");
  list.style.setProperty("gap", "8px", "important");
  list.style.setProperty("justify-items", "center", "important");
  list.style.setProperty("justify-content", "center", "important");
  list.style.setProperty("align-content", "start", "important");
  list.style.setProperty("width", "min(420px, 92%)", "important");
  list.style.setProperty("max-width", "420px", "important");
  list.style.setProperty("margin", "0 auto", "important");
  list.style.setProperty("padding", "2px", "important");
  const rows = [];
  let rowItems = [];
  let rowSpan = 0;
  const pushRow = () => {
    if (!rowItems.length) return;
    rows.push(rowItems);
    rowItems = [];
    rowSpan = 0;
  };
  slotItems.forEach((item) => {
    const span = Math.min(maxCols, item.span || 3);
    if (rowSpan + span > maxCols) pushRow();
    rowItems.push({ ...item, span });
    rowSpan += span;
  });
  pushRow();
  rows.forEach((items) => {
    const totalSpan = items.reduce((sum, item) => sum + item.span, 0);
    const offset = Math.max(0, Math.floor((maxCols - totalSpan) / 2));
    let col = 1 + offset;
    items.forEach((item) => {
      item.el.style.setProperty("grid-column", `${col} / span ${item.span}`, "important");
      col += item.span;
    });
  });
};

const renderTreeEditorSlots = (dna, assetId) => {
  const list = document.getElementById("tree-slot-list");
  if (!list) return;
  const migration = migrateFinancasAsset(dna);
  if (migration.changed) {
    saveDNA(migration.dna, { skipSync: true });
  }
  dna = migration.dna;
  const normalizedAssetId = normalizeAssetId(assetId);
  let asset = resolveAssetFromDNA(dna, assetId) || resolveAssetFromDNA(dna, normalizedAssetId);
  list.innerHTML = "";
  if (!asset) {
    asset = {
      id: normalizedAssetId,
      profileSlots: {},
      additionalSlots: [],
      extraSlots: [],
    };
  }
  if (normalizedAssetId === "financas") {
    loadSlotLayouts({ force: true });
  }
  const modal = document.getElementById("tree-edit-modal");
  const isEditing = Boolean(modal?.classList.contains("is-editing"));
  const editor = list.parentElement;
  if (editor) {
    const dup = editor.querySelector(".projects-duplicate");
    const ph = editor.querySelector(".projects-title--placeholder");
    if (dup) dup.remove();
    if (ph) ph.remove();
  }
  const layoutItems = getLayoutItems(normalizedAssetId);
  const draft =
    isEditing && treeEditDraft?.assetId === assetId
      ? treeEditDraft
      : null;
  const assetView = draft
    ? {
        ...asset,
        profileSlots: draft.profileSlots || {},
        additionalSlots: draft.additionalSlots || [],
        extraSlots: draft.extraSlots || [],
        slotLayoutOverrides: draft.slotLayoutOverrides || {},
      }
    : asset;
  const ensureTreeEditMode = () => {
    return Boolean(modal?.classList.contains("is-editing"));
  };
  if (list) {
    list.style.setProperty("display", "grid", "important");
    list.style.setProperty("grid-template-columns", "repeat(6, minmax(0, 1fr))", "important");
    list.style.setProperty("grid-auto-rows", "auto", "important");
    list.style.setProperty("grid-auto-flow", "row", "important");
    list.style.setProperty("gap", "8px", "important");
    list.style.setProperty("justify-items", "stretch", "important");
    list.style.setProperty("align-content", "start", "important");
    list.style.setProperty("width", "min(420px, 92%)", "important");
    list.style.setProperty("max-width", "420px", "important");
    list.style.setProperty("margin", "0 auto", "important");
    list.style.setProperty("padding", "8px 0", "important");
  }
  if (draft) {
    draft.profileSlots = draft.profileSlots || {};
  } else {
    asset.profileSlots = asset.profileSlots || {};
  }
  const slotStore = draft ? draft.profileSlots : asset.profileSlots;
  const resolveAliasSlotId = (slotId) => {
    if (slotId.startsWith("abundancia.")) return slotId.replace(/^abundancia\./, "financas.");
    if (slotId.startsWith("financas.")) return slotId.replace(/^financas\./, "abundancia.");
    return null;
  };
  const getSlotStoreData = (slotId) => {
    if (slotStore?.[slotId]) return slotStore[slotId];
    const aliasId = resolveAliasSlotId(slotId);
    if (aliasId && slotStore?.[aliasId]) return slotStore[aliasId];
    return slotStore?.[slotId] || {};
  };
  const formatSlotValue = (slot, value) => {
    if (!value) return "";
    const fields = slot.fields || [{ key: "value" }];
    const unit = fields[0]?.slider?.unit;
    const text = String(value);
    if (unit && !text.includes(unit)) return `${text} ${unit}`;
    return text;
  };
  const getSlotDisplayText = (slot) => {
    const data = getSlotStoreData(slot.id);
    const fields = slot.fields || [{ key: "value" }];
    const key = fields[0]?.key || "value";
    return formatSlotValue(slot, data[key] || "");
  };
  const sliderModal = document.getElementById("slider-modal");
  const sliderTitle = document.getElementById("slider-title");
  const sliderValue = document.getElementById("slider-value");
  const sliderInput = document.getElementById("slider-input");
  const sliderSave = document.getElementById("slider-save");
  const sliderClose = document.getElementById("slider-close");
  let sliderOnSave = null;
  const openSlider = (config) => {
    if (!sliderModal || !sliderInput || !sliderValue) return;
    sliderInput.min = String(config.min ?? 0);
    sliderInput.max = String(config.max ?? 100);
    sliderInput.step = String(config.step ?? 1);
    sliderInput.value = String(config.value ?? 0);
    sliderValue.textContent = `${config.value ?? 0}${config.unit || ""}`;
    if (sliderTitle) sliderTitle.textContent = config.label || "Ajustar";
    sliderOnSave = config.onSave;
    sliderModal.classList.add("is-open");
  };
  if (sliderInput) {
    sliderInput.addEventListener("input", () => {
      const unit = sliderInput.dataset.unit || "";
      sliderValue.textContent = `${sliderInput.value}${unit}`;
    });
  }
  if (sliderSave) {
    sliderSave.addEventListener("click", () => {
      if (sliderOnSave) sliderOnSave(Number(sliderInput.value || 0));
      if (sliderModal) sliderModal.classList.remove("is-open");
    });
  }
  if (sliderClose && sliderModal) {
    sliderClose.addEventListener("click", () => sliderModal.classList.remove("is-open"));
  }
  const projectSlotClones = [];
  const getLayoutTypeFromSlot = (slot) => {
    if (slot.layoutType) return slot.layoutType;
    const raw = String(slot.type || "").toLowerCase();
    if (raw.includes("rect-wide")) return "tipo1";
    if (raw === "rect") return "tipo2";
    if (raw.startsWith("square")) return "tipo3";
    return null;
  };
  let slotIndex = 0;
  layoutItems.forEach((item) => {
    if (item.type === "title") {
      const titleEl = document.createElement("div");
      titleEl.className = "grid-section-title";
      titleEl.textContent = item.label || "";
      list.appendChild(titleEl);
      return;
    }
    if (item.type !== "slot" || !item.slot) return;
    const slot = item.slot;
    const layoutType = item.layoutType || getLayoutTypeFromSlot(slot) || "tipo2";
    const slotEl = document.createElement("div");
    slotEl.className = `profile-slot profile-slot--${slot.type} slot-animate`;
    slotEl.style.animationDelay = `${slotIndex * 40}ms`;
    slotEl.dataset.slotId = slot.id;
    if (item.customStyle) {
      slotEl.style.cssText = (slotEl.style.cssText || "") + "; " + item.customStyle;
    } else if (layoutType === "tipo1") {
      slotEl.classList.add("slot-tipo1");
    } else if (layoutType === "tipo2") {
      slotEl.classList.add("slot-tipo2");
    } else if (layoutType === "tipo3") {
      slotEl.classList.add("slot-tipo3");
    }
    if (item.extraClass) slotEl.classList.add(item.extraClass);
    slotIndex += 1;
    const label = document.createElement("div");
    label.className = "slot-label";
    label.textContent = slot.label;
    slotEl.appendChild(label);

    const valueEl = document.createElement("div");
    valueEl.className = "slot-value";
    valueEl.textContent = getSlotDisplayText(slot) || "ÔÇö";
    if (assetId === "espiritualidade" && slot.id === "espiritualidade.sistema") {
      valueEl.style.setProperty("width", "100%", "important");
      valueEl.style.setProperty("justify-self", "center", "important");
    }
    slotEl.appendChild(valueEl);
    const fields = slot.fields || [{ key: "value", label: slot.label }];
    const photoKeys = ["foto", "logo", "image", "image_url"];
    const type4SlotIds = new Set([]);
    const type2SlotIds = new Set([
      "trabalho.pec",
      "trabalho.pec_nivel",
      "trabalho.unip",
      "trabalho.unip_nivel",
    ]);
    const type5SlotIds = new Set([]);
    const explicitPhotoSlots = new Set([
      "trabalho.experi1",
      "trabalho.experi2",
      "trabalho.experi3",
      "autenticidade.hobby1",
      "autenticidade.hobby2",
      "autenticidade.hobby3",
      "autenticidade.hobby4",
      "autenticidade.hobby5",
      "autenticidade.hobby6",
      "inspiracao.proj1",
      "inspiracao.proj2",
      "inspiracao.proj3",
    ]);
    const forcedType3Slots = new Set([
      "amor.conexao1",
      "amor.conexao2",
      "amor.conexao3",
      "amor.conexao4",
      "amor.conexao5",
      "amor.conexao6",
      "inspiracao.insp1",
      "inspiracao.insp2",
      "inspiracao.insp3",
      "autenticidade.hobby1",
      "autenticidade.hobby2",
      "autenticidade.hobby3",
      "autenticidade.hobby4",
      "autenticidade.hobby5",
      "autenticidade.hobby6",
      "inspiracao.proj1",
      "inspiracao.proj2",
      "inspiracao.proj3",
      "financas.ativo1",
      "financas.ativo2",
      "financas.ativo3",
      "trabalho.experi1",
      "trabalho.experi2",
      "trabalho.experi3",
      "mente.imagem",
    ]);
    const resolvedLayoutType = forcedType3Slots.has(slot.id)
      ? "tipo3"
      : getLayoutTypeFromSlot(slot);
    const isPhotoSlot =
      forcedType3Slots.has(slot.id) ||
      explicitPhotoSlots.has(slot.id) ||
      (slot.fields || []).some((field) => photoKeys.includes(field.key)) ||
      slot.label.toLowerCase().includes("foto") ||
      slot.label.toLowerCase().includes("logo");

    let photoMeta = null;
    let captionElRef = null;
    let secondaryField = null;
    if (isPhotoSlot) {
      const textFields = fields.filter((f) => !photoKeys.includes(f.key));
      const topKey = textFields[0]?.key;
      const bottomKey = textFields[1]?.key;
      const usePortrait = type4SlotIds.has(slot.id);
      slotEl.classList.add(usePortrait ? "slot-type-4" : "slot-type-3");
      const showTopLabel =
        Boolean(topKey && (usePortrait || textFields.length > 1)) &&
        assetId !== "amor" &&
        assetId !== "autenticidade" &&
        assetId !== "inspiracao" &&
        assetId !== "espiritualidade";
      if (showTopLabel) {
        const topValue = topKey ? getSlotStoreData(slot.id)?.[topKey] : "";
        const topLabelEl = document.createElement("div");
        topLabelEl.className = "slot-top-label";
        topLabelEl.textContent = topValue ? String(topValue) : "";
        slotEl.insertBefore(topLabelEl, valueEl);
      }
      const captionKey = bottomKey || topKey;
    if (captionKey) {
      const bottomValue = getSlotStoreData(slot.id)?.[captionKey];
      const captionEl = document.createElement("div");
      captionEl.className = "slot-caption";
      if (bottomValue) {
        captionEl.textContent = String(bottomValue);
      } else if (assetId === "trabalho" && slot.id.startsWith("trabalho.experi")) {
        captionEl.textContent = slot.label || "";
      } else {
        captionEl.textContent = "";
      }
      slotEl.appendChild(captionEl);
      captionElRef = captionEl;
    }
      photoMeta = { topKey, captionKey };
    } else {
      if (resolvedLayoutType === "tipo2") {
        slotEl.classList.add("slot-type-2");
      } else {
        slotEl.classList.add("slot-type-1");
      }
      secondaryField = fields.find(
        (field, index) => index > 0 && !photoKeys.includes(field.key),
      );
      if (secondaryField) {
        const secondaryValue = getSlotStoreData(slot.id)?.[secondaryField.key];
        const subtitleEl = document.createElement("div");
        subtitleEl.className = "slot-subtitle";
        subtitleEl.textContent = secondaryValue ? String(secondaryValue) : "";
        slotEl.appendChild(subtitleEl);
      }
    }

    const iconName = SLOT_ICON_BY_ID[slot.id];
    if (iconName) {
      const icon = document.createElement("i");
      icon.className = "slot-icon";
      icon.setAttribute("data-lucide", iconName);
      slotEl.appendChild(icon);
    }

    if (isPhotoSlot) {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.className = "hidden-file";
      const ensureImageEl = () => {
        let img = valueEl.querySelector("img");
        if (!img) {
          img = document.createElement("img");
          img.className = "slot-image";
          img.alt = slot.label || "Imagem do slot";
          valueEl.appendChild(img);
        }
        return img;
      };
      fileInput.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        if (!draft) return;
        slotEl.classList.add("is-uploading");
        try {
          const isProjeto = assetId === "inspiracao";
          const dataUrl = isProjeto
            ? await resizeImageFileToDataUrl(file, { maxSize: 1080, quality: 0.8 })
            : await readFileAsDataUrl(file);
          slotStore[slot.id] = {
            ...(slotStore[slot.id] || {}),
            image: dataUrl,
          };
          valueEl.classList.add("has-image");
          const img = ensureImageEl();
          img.src = String(dataUrl || "");
          valueEl.textContent = "";
        } finally {
          slotEl.classList.remove("is-uploading");
          fileInput.value = "";
        }
      });
      slotEl.appendChild(fileInput);
      const existingImage = getSlotStoreData(slot.id)?.image;
      if (existingImage) {
        valueEl.classList.add("has-image");
        const img = ensureImageEl();
        img.src = String(existingImage || "");
        valueEl.textContent = "";
      }
      slotEl.addEventListener("click", (event) => {
        if (event.target.closest("input, textarea, select, button")) return;
        if (!ensureTreeEditMode()) return;
        fileInput.click();
      });
    }

    const subtitle = slotEl.querySelector(".slot-subtitle");
    const optionsBySlot = {
      "verdade.trait1": [
        "Coragem",
        "Disciplina",
        "Foco",
        "Resiliencia",
        "Integridade",
        "Empatia",
        "Gratidao",
        "Humildade",
        "Justica",
        "Generosidade",
        "Autocontrole",
        "Sabedoria",
        "Criatividade",
        "Lideranca",
        "Ousadia",
        "Paciencia",
        "Lealdade",
        "Honestidade",
        "Compaixao",
        "Determinacao",
      ],
      "verdade.trait2": [
        "Coragem",
        "Disciplina",
        "Foco",
        "Resiliencia",
        "Integridade",
        "Empatia",
        "Gratidao",
        "Humildade",
        "Justica",
        "Generosidade",
        "Autocontrole",
        "Sabedoria",
        "Criatividade",
        "Lideranca",
        "Ousadia",
        "Paciencia",
        "Lealdade",
        "Honestidade",
        "Compaixao",
        "Determinacao",
      ],
      "verdade.trait3": [
        "Coragem",
        "Disciplina",
        "Foco",
        "Resiliencia",
        "Integridade",
        "Empatia",
        "Gratidao",
        "Humildade",
        "Justica",
        "Generosidade",
        "Autocontrole",
        "Sabedoria",
        "Criatividade",
        "Lideranca",
        "Ousadia",
        "Paciencia",
        "Lealdade",
        "Honestidade",
        "Compaixao",
        "Determinacao",
      ],
      "verdade.mbti": [
        "INTJ",
        "INTP",
        "ENTJ",
        "ENTP",
        "INFJ",
        "INFP",
        "ENFJ",
        "ENFP",
        "ISTJ",
        "ISFJ",
        "ESTJ",
        "ESFJ",
        "ISTP",
        "ISFP",
        "ESTP",
        "ESFP",
      ],
      "verdade.signo": [
        "Aries",
        "Touro",
        "Gemeos",
        "Cancer",
        "Leao",
        "Virgem",
        "Libra",
        "Escorpiao",
        "Sagitario",
        "Capricornio",
        "Aquario",
        "Peixes",
      ],
      "fisico.forma": [
        "Muito Fraca",
        "Fraca",
        "Regular",
        "Boa",
        "Excelente",
      ],
      "trabalho.pec_nivel": [
        "Iniciante",
        "Basico",
        "Intermediario",
        "Avancado",
        "Profissional",
        "Expert",
        "Mestre",
      ],
      "trabalho.unip_nivel": [
        "Iniciante",
        "Basico",
        "Intermediario",
        "Avancado",
        "Profissional",
        "Expert",
        "Mestre",
      ],
      "fisico.genero": ["Masculino", "Feminino", "Transsexual", "Outro"],
      "conexao.crenca1": [
        "Cristianismo",
        "Islamismo",
        "Juda├¡smo",
        "Budismo",
        "Hindu├¡smo",
        "Espiritismo",
        "Umbanda",
        "Candombl├®",
        "Gnosticismo",
        "Ate├¡smo",
        "Agnosticismo",
      ],
      "conexao.crenca2": [
        "Cristianismo",
        "Islamismo",
        "Juda├¡smo",
        "Budismo",
        "Hindu├¡smo",
        "Espiritismo",
        "Umbanda",
        "Candombl├®",
        "Gnosticismo",
        "Ate├¡smo",
        "Agnosticismo",
      ],
      "conexao.crenca3": [
        "Cristianismo",
        "Islamismo",
        "Juda├¡smo",
        "Budismo",
        "Hindu├¡smo",
        "Espiritismo",
        "Umbanda",
        "Candombl├®",
        "Gnosticismo",
        "Ate├¡smo",
        "Agnosticismo",
      ],
    };

    const applyFieldUpdate = (field, value) => {
      if (!draft) return;
      slotStore[slot.id] = {
        ...(slotStore[slot.id] || {}),
        [field.key]: value,
      };
      const isInlineValue =
        valueEl.classList.contains("slot-value--inline") &&
        valueEl.querySelector(".profile-input--inline");
      if (!isInlineValue) {
        valueEl.textContent = getSlotDisplayText(slot) || "ÔÇö";
      }
      const secondary = secondaryField?.key;
      if (subtitle) {
        subtitle.textContent =
          secondary && getSlotStoreData(slot.id)?.[secondary]
            ? String(getSlotStoreData(slot.id)[secondary])
            : "";
      }
      if (photoMeta) {
        const topLabelEl = slotEl.querySelector(".slot-top-label");
        const captionEl = slotEl.querySelector(".slot-caption");
        if (topLabelEl && photoMeta.topKey) {
          topLabelEl.textContent = getSlotStoreData(slot.id)?.[photoMeta.topKey] || "";
        }
        if (captionEl && photoMeta.captionKey) {
          captionEl.textContent = getSlotStoreData(slot.id)?.[photoMeta.captionKey] || "";
        }
      }
    };

    const stopSlotPropagation = (event) => {
      event.stopPropagation();
    };

    slotEl.addEventListener("pointerdown", (event) => {
      if (event.target.closest("input, textarea, select")) {
        event.stopPropagation();
      }
    });

    fields.forEach((field) => {
      if (["foto", "logo", "image", "image_url"].includes(field.key)) return;
      const isTrabalhoInline =
        assetId === "trabalho" &&
        field.key === "value" &&
        [
          "trabalho.pec",
          "trabalho.unip",
          "trabalho.pec_nivel",
          "trabalho.unip_nivel",
        ].includes(slot.id);
      const isConexaoInline =
        assetId === "conexao" &&
        field.key === "value" &&
        slot.id === "conexao.lema";
      const slotOptions = optionsBySlot[slot.id];
      if (slotOptions && field.key === "value") {
        const select = document.createElement("select");
        select.className = "profile-input";
        select.disabled = !isEditing;
        const empty = document.createElement("option");
        empty.value = "";
        empty.textContent = field.label || "Selecionar";
        select.appendChild(empty);
        slotOptions.forEach((opt) => {
          const option = document.createElement("option");
          option.value = opt;
          option.textContent = opt;
          select.appendChild(option);
        });
        select.value = getSlotStoreData(slot.id)?.[field.key] || "";
        select.addEventListener("click", stopSlotPropagation);
        select.addEventListener("pointerdown", stopSlotPropagation);
        select.addEventListener("change", () => applyFieldUpdate(field, select.value));
        if (isEditing && (isTrabalhoInline || isConexaoInline)) {
          valueEl.textContent = "";
          select.classList.add("profile-input--inline");
          valueEl.classList.add("slot-value--inline");
          valueEl.appendChild(select);
        } else {
          slotEl.appendChild(select);
        }
        return;
      }
      const input = document.createElement("input");
      input.className = "profile-input";
      input.placeholder = field.label;
      input.value = getSlotStoreData(slot.id)?.[field.key] || "";
      input.disabled = !isEditing;
      input.addEventListener("click", stopSlotPropagation);
      input.addEventListener("pointerdown", stopSlotPropagation);
      if (field.slider) {
        input.readOnly = true;
        input.addEventListener("click", () => {
          if (!ensureTreeEditMode()) return;
          if (!sliderInput) return;
          sliderInput.dataset.unit = field.slider.unit || "";
          openSlider({
            label: field.label,
            min: field.slider.min,
            max: field.slider.max,
            step: field.slider.step,
            unit: field.slider.unit || "",
            value: Number(input.value || field.slider.min || 0),
            onSave: (nextValue) => {
              input.value = String(nextValue);
              applyFieldUpdate(field, String(nextValue));
              if (slot.id === "verdade.nascimento") {
                const dia = Number(slotStore?.["verdade.nascimento"]?.dia || 0);
                const mes = Number(slotStore?.["verdade.nascimento"]?.mes || 0);
                const signo = getZodiacSign(dia, mes);
                if (signo) {
                  if (!draft) return;
                  slotStore["verdade.signo"] = {
                    ...(slotStore["verdade.signo"] || {}),
                    value: signo,
                  };
                  renderTreeEditorSlots(dna, assetId);
                  return;
                }
              }
              renderTreeEditorSlots(dna, assetId);
            },
          });
        });
      }
      input.addEventListener("input", () => applyFieldUpdate(field, input.value));
      input.addEventListener("change", () => applyFieldUpdate(field, input.value));
      const isCaptionInline = field.key === "titulo" && Boolean(captionElRef);

      if (isEditing && (isTrabalhoInline || isConexaoInline)) {
        valueEl.textContent = "";
        input.classList.add("profile-input--inline");
        valueEl.classList.add("slot-value--inline");
        valueEl.appendChild(input);
      } else if (isCaptionInline) {
        captionElRef.textContent = "";
        input.classList.add("profile-input--caption");
        captionElRef.appendChild(input);
      } else {
        slotEl.appendChild(input);
      }
    });


    slotEl.addEventListener("click", (event) => {
      if (isPhotoSlot) {
        if (!event.target.closest(".slot-value")) return;
        if (!ensureTreeEditMode()) return;
        const file = slotEl.querySelector("input[type='file']");
        if (file) file.click();
        return;
      }
      if (!ensureTreeEditMode()) return;
      const focusable = slotEl.querySelector("input.profile-input");
      if (focusable) focusable.focus();
    });

    list.appendChild(slotEl);
    if (assetId === "inspiracao" && editor) {
      const clone = slotEl.cloneNode(true);
      clone.querySelectorAll("input, select, button").forEach((el) => el.remove());
      projectSlotClones.push(clone);
    }
  });

  if (list) {
    list
      .querySelectorAll(".grid-section-title, .slot-section-title, .slot-row-title, .projects-title")
      .forEach((title) => {
        title.style.setProperty("grid-column", "1 / -1", "important");
      });
  }
  const slotsRendered = slotIndex;
  if (normalizedAssetId === "financas" && slotsRendered === 0) {
    const fallbackSlots = (PROTOCOL_SLOTS.financas || []).map(cloneSlotDef);
    list.innerHTML = "";
    fallbackSlots.forEach((slot) => {
      const slotEl = document.createElement("div");
      slotEl.className = `profile-slot profile-slot--${slot.type}`;
      slotEl.dataset.slotId = slot.id;
      const labelEl = document.createElement("div");
      labelEl.className = "slot-label";
      labelEl.textContent = slot.label || "";
      const valueEl = document.createElement("div");
      valueEl.className = "slot-value";
      if (String(slot.type || "").startsWith("square")) {
        slotEl.classList.add("slot-type-3");
        const captionEl = document.createElement("div");
        captionEl.className = "slot-caption";
        slotEl.appendChild(labelEl);
        slotEl.appendChild(valueEl);
        slotEl.appendChild(captionEl);
      } else {
        slotEl.classList.add("slot-type-1");
        slotEl.appendChild(labelEl);
        slotEl.appendChild(valueEl);
      }
      list.appendChild(slotEl);
    });
  }
  if (assetId === "inspiracao" && editor) {
    const duplicateWrap = document.createElement("div");
    duplicateWrap.className = "projects-duplicate";
    const duplicateTitle = document.createElement("div");
    duplicateTitle.className = "projects-title projects-title--duplicate";
    duplicateTitle.textContent = "Projetos";
    const duplicateList = document.createElement("div");
    duplicateList.className = "slot-list slot-list-duplicate";
    projectSlotClones.forEach((clone) => duplicateList.appendChild(clone));
    duplicateWrap.appendChild(duplicateTitle);
    duplicateWrap.appendChild(duplicateList);
    editor.appendChild(duplicateWrap);
    const placeholderTitle = document.createElement("div");
    placeholderTitle.className = "projects-title projects-title--placeholder";
    placeholderTitle.textContent = "Projetos";
    editor.appendChild(placeholderTitle);
  }
};

const openTreeEditor = (assetId) => {
  const dna = seedDNAIfMissing();
  const migration = migrateFinancasAsset(dna);
  if (migration.changed) {
    saveDNA(migration.dna, { skipSync: true });
  }
  const nextDna = migration.dna;
  const normalizedAssetId = normalizeAssetId(assetId);
  let asset = resolveAssetFromDNA(nextDna, assetId) || resolveAssetFromDNA(nextDna, normalizedAssetId);
  const activeAssetId = normalizeAssetId(asset?.id || normalizedAssetId);
  if (!asset) {
    asset = {
      id: activeAssetId,
      label: LABEL_BY_ID.get(activeAssetId) || activeAssetId,
      level: 0,
      profileSlots: {},
      additionalSlots: [],
      extraSlots: [],
    };
  }
  const modal = document.getElementById("tree-edit-modal");
  const title = document.getElementById("tree-edit-title");
  const levelText = document.getElementById("tree-edit-level-text");
  const phraseText = document.getElementById("tree-edit-phrase");
  const icon = document.getElementById("tree-edit-icon");
  const linkedArenasList = document.getElementById("linked-arenas-list");
  const addArenaBtn = document.getElementById("tree-edit-add-arena");
  const backBtn = document.getElementById("tree-edit-back");
  if (!modal || !title || !levelText) return;
  discardTreeEditDraft();
  modal.dataset.assetId = activeAssetId;
  title.textContent = `${LABEL_BY_ID.get(activeAssetId) ?? asset.label}`;
  const levelValue = Math.round(Number(asset.level || 0));
  levelText.textContent = String(levelValue);
  if (phraseText) {
    const phraseKey = ASSET_TO_PHRASE[activeAssetId] || ASSET_TO_PHRASE[asset.id];
    const phrases = phraseKey ? MASTERY_PHRASES[phraseKey] : [];
    phraseText.textContent = stripMasteryLevelPrefix(
      phrases[Math.max(0, Math.min(9, levelValue - 1))] || "",
    );
  }
  if (icon) {
    icon.setAttribute("data-lucide", ICON_BY_ID[activeAssetId] ?? ICON_BY_ID[asset.id] ?? "circle");
    if (window.lucide) window.lucide.createIcons();
  }
  renderTreeEditorSlots(nextDna, activeAssetId);
  refreshTreeEditAddSlotButton(nextDna, asset);
  if (linkedArenasList) {
    const aliases = ASSET_ALIAS_MAP[activeAssetId] || [activeAssetId];
    const arenas = loadArenas().filter((arena) => aliases.includes(arena.assetId));
    linkedArenasList.innerHTML = "";
    if (arenas.length) {
      arenas.forEach((arena) => {
        const card = buildArenaCard(arena, { compact: true, showAdd: true });
        linkedArenasList.appendChild(card);
      });
    }
    linkedArenasList.appendChild(buildArenaAddMiniCard(activeAssetId));
    if (window.lucide) window.lucide.createIcons();
  }
  if (addArenaBtn) {
    addArenaBtn.onclick = () => {
      playMetalClick();
      openArenaModalForAsset(activeAssetId);
    };
  }
  if (backBtn) {
    backBtn.onclick = () => {
      playMetalClick();
      closeTreeEditor();
    };
  }
  modal.classList.remove("is-editing");
  modal.classList.add("is-open");
};

const closeTreeEditor = () => {
  const modal = document.getElementById("tree-edit-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.classList.remove("is-editing");
  modal.dataset.assetId = "";
  discardTreeEditDraft();
};

const setArenaIconDisplay = (displayEl, iconName) => {
  if (!displayEl) return;
  displayEl.innerHTML = "";
  if (!iconName) {
    displayEl.classList.add("is-empty");
    displayEl.textContent = "+";
    return;
  }
  displayEl.classList.remove("is-empty");
  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", iconName);
  displayEl.appendChild(icon);
};

const setBronzeIconDisplay = (displayEl, iconName) => {
  if (!displayEl) return;
  displayEl.innerHTML = "";
  if (!iconName) {
    displayEl.classList.add("is-empty");
    displayEl.textContent = "+";
    return;
  }
  displayEl.classList.remove("is-empty");
  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", iconName);
  displayEl.appendChild(icon);
};

const renderArenaIconPicker = (modal, displayEl, gridEl, selectedIcon) => {
  if (!modal || !displayEl || !gridEl) return;
  modal.dataset.icon = selectedIcon || "";
  setArenaIconDisplay(displayEl, selectedIcon);
  const buildOptions = () => {
    if (gridEl.children.length) return;
    gridEl.innerHTML = "";
    ARENA_ICONS.forEach((iconName) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "icon-option";
      if (iconName === selectedIcon) option.classList.add("is-selected");
      option.dataset.icon = iconName;
      option.innerHTML = `<i data-lucide="${iconName}"></i>`;
      option.addEventListener("click", (event) => {
        event.preventDefault();
        modal.dataset.icon = iconName;
        setArenaIconDisplay(displayEl, iconName);
        gridEl.querySelectorAll(".icon-option").forEach((el) => el.classList.remove("is-selected"));
        option.classList.add("is-selected");
        modal.classList.remove("is-icon-editing");
        gridEl.innerHTML = "";
        if (window.lucide) window.lucide.createIcons();
      });
      gridEl.appendChild(option);
    });
  };
  if (modal.classList.contains("is-icon-editing")) {
    buildOptions();
  } else {
    gridEl.innerHTML = "";
  }
  displayEl.onclick = () => {
    if (!modal.classList.contains("is-editing") && modal.id !== "arena-modal") return;
    const next = !modal.classList.contains("is-icon-editing");
    modal.classList.toggle("is-icon-editing", next);
    if (next) {
      buildOptions();
    } else {
      gridEl.innerHTML = "";
    }
  };
  if (window.lucide) window.lucide.createIcons();
};

const renderBronzeIconPicker = (modal, displayEl, gridEl, selectedIcon) => {
  if (!modal || !displayEl || !gridEl) return;
  modal.dataset.icon = selectedIcon || "";
  setBronzeIconDisplay(displayEl, selectedIcon);
  const buildOptions = () => {
    if (gridEl.children.length) return;
    gridEl.innerHTML = "";
    BRONZE_ICONS.forEach((iconName) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "icon-option";
      if (iconName === selectedIcon) option.classList.add("is-selected");
      option.dataset.icon = iconName;
      option.innerHTML = `<i data-lucide="${iconName}"></i>`;
      option.addEventListener("click", (event) => {
        event.preventDefault();
        modal.dataset.icon = iconName;
        setBronzeIconDisplay(displayEl, iconName);
        gridEl.querySelectorAll(".icon-option").forEach((el) => el.classList.remove("is-selected"));
        option.classList.add("is-selected");
        modal.classList.remove("is-icon-editing");
        gridEl.innerHTML = "";
        if (window.lucide) window.lucide.createIcons();
      });
      gridEl.appendChild(option);
    });
  };
  if (modal.classList.contains("is-icon-editing")) {
    buildOptions();
  } else {
    gridEl.innerHTML = "";
  }
  displayEl.onclick = () => {
    const next = !modal.classList.contains("is-icon-editing");
    modal.classList.toggle("is-icon-editing", next);
    if (next) {
      buildOptions();
    } else {
      gridEl.innerHTML = "";
    }
  };
  if (window.lucide) window.lucide.createIcons();
};

const openArenaModal = () => {
  const modal = document.getElementById("arena-modal");
  const select = document.getElementById("arena-asset");
  const title = document.getElementById("arena-title");
  const description = document.getElementById("arena-description");
  const addBronze = document.getElementById("arena-add-bronze");
  const iconDisplay = document.getElementById("arena-icon-display");
  const iconGrid = document.getElementById("arena-icon-grid");
  if (!modal || !select || !title || !description) return;
  select.innerHTML = "";
  SEPHIROT.forEach((asset) => {
    const option = document.createElement("option");
    option.value = asset.id;
    option.textContent = asset.label;
    select.appendChild(option);
  });
  title.value = "";
  description.value = "";
  if (addBronze) addBronze.checked = false;
  modal.dataset.icon = "";
  if (iconDisplay && iconGrid) {
    renderArenaIconPicker(modal, iconDisplay, iconGrid, "");
  }
  modal.classList.add("is-open");
};

const openArenaModalForAsset = (assetId) => {
  openArenaModal();
  const select = document.getElementById("arena-asset");
  if (select && assetId) {
    select.value = String(assetId);
  }
};

const closeArenaModal = () => {
  const modal = document.getElementById("arena-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
};

const openArenaDossier = (arenaId) => {
  const modal = document.getElementById("arena-dossier");
  const title = document.getElementById("arena-dossier-title");
  const titleInput = document.getElementById("arena-dossier-title-input");
  const progress = document.getElementById("arena-dossier-progress");
  const macro = document.getElementById("arena-dossier-macro");
  const description = document.getElementById("arena-dossier-description");
  const descriptionInput = document.getElementById("arena-dossier-description-input");
  const assetSelect = document.getElementById("arena-dossier-asset");
  const iconDisplay = document.getElementById("arena-dossier-icon");
  const iconGrid = document.getElementById("arena-dossier-icon-grid");
  const bronzeList = document.getElementById("arena-dossier-bronze");
  const targetLabel = document.getElementById("arena-dossier-target");
  const progressFill = document.getElementById("arena-dossier-fill");
  const addActionBtn = document.getElementById("arena-dossier-add-action");
  if (!modal || !title || !progress || !bronzeList) return;
  const arenas = loadArenas();
  const arena = arenas.find((item) => item.id === arenaId);
  if (!arena) return;
  modal.classList.remove("is-editing", "is-icon-editing");
  title.textContent = arena.title || "Arena";
  const completionValue = Number(arena.completion || 0);
  if (arena.targetCount) {
    progress.textContent = `${Number(arena.completedCount || 0)}/${arena.targetCount}`;
  } else {
    progress.textContent = `${Math.round(completionValue)}%`;
  }
  if (macro) macro.textContent = arena.description || "Sem descricao.";
  if (description) description.textContent = arena.description || "Sem descricao.";
  if (targetLabel) {
    targetLabel.textContent = arena.targetCount
      ? `Meta Atual: ${Number(arena.completedCount || 0)}/${arena.targetCount}`
      : "Meta Atual: livre";
  }
  if (progressFill) {
    progressFill.style.width = `${Math.min(100, Math.max(0, completionValue))}%`;
  }
  if (titleInput) titleInput.value = arena.title || "";
  if (descriptionInput) descriptionInput.value = arena.description || "";
  if (assetSelect) {
    assetSelect.innerHTML = "";
    SEPHIROT.forEach((assetItem) => {
      const option = document.createElement("option");
      option.value = assetItem.id;
      option.textContent = assetItem.label;
      assetSelect.appendChild(option);
    });
    assetSelect.value = arena.assetId || "";
  }
  if (iconDisplay && iconGrid) {
    renderArenaIconPicker(modal, iconDisplay, iconGrid, arena.icon || ICON_BY_ID[arena.assetId] || "");
  }
  if (!modal.classList.contains("is-editing")) {
    modal.classList.remove("is-icon-editing");
    if (iconGrid) iconGrid.innerHTML = "";
  }
  bronzeList.innerHTML = "";
  if (addActionBtn) {
    addActionBtn.onclick = () => openBronzeModal(arenaId);
  }
  const actionsRow = document.createElement("div");
  actionsRow.className = "arena-bronze-row arena-bronze-row--dossier";
  const planner = loadPlanner();
  const actionsPreview = planner.bronzeActions.filter((action) => action.arenaId === arenaId);
  if (actionsPreview.length) {
    actionsPreview.forEach((action) => {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "arena-bronze-slot";
      if (action.status === "done") slot.classList.add("arena-bronze-slot--done");
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", action.icon || "circle");
      slot.appendChild(icon);
      const weeklyTarget = getActionWeeklyTarget(action);
      if (!action.atemporal && weeklyTarget > 1) {
        const remaining = getActionRemainingForWeek(action);
        slot.dataset.count = String(remaining);
      }
      slot.addEventListener("click", () => openBronzeModal(arenaId, action.id));
      actionsRow.appendChild(slot);
    });
  }
  const addSlot = document.createElement("button");
  addSlot.type = "button";
  addSlot.className = "arena-bronze-slot arena-bronze-slot--add";
  addSlot.textContent = "+";
  addSlot.addEventListener("click", (event) => {
    event.stopPropagation();
    openBronzeModal(arenaId);
  });
  actionsRow.appendChild(addSlot);
  bronzeList.appendChild(actionsRow);
  if (window.lucide) window.lucide.createIcons();
  modal.dataset.arenaId = arenaId;
  modal.classList.remove("is-editing", "is-icon-editing");
  modal.classList.add("is-open");
};

const renderSocial = () => {
  const levelEl = document.getElementById("social-level");
  const nickEl = document.getElementById("social-nick");
  const idEl = document.getElementById("social-id");
  const socialAvatar = document.querySelector(".social-avatar");
  if (!levelEl) return;
  const dna = seedDNAIfMissing();
  const total = dna.assets.reduce((sum, asset) => sum + Number(asset.level || 0), 0);
  levelEl.textContent = String(Math.round(total));

  const profile = loadProfile();
  updateHudIdentity(profile);
  if (nickEl) nickEl.textContent = profile.nickname || "-";
  if (idEl) idEl.textContent = profile.userId || "-";
  if (profile.theme) applyTheme(profile.theme);
  if (profile.borderColor) {
    document.documentElement.style.setProperty("--accent-energy", profile.borderColor);
  }
  if (socialAvatar && profile.avatar) {
    socialAvatar.style.backgroundImage = `url(${profile.avatar})`;
    socialAvatar.style.backgroundSize = "cover";
    socialAvatar.style.backgroundPosition = "center";
  }
  renderNpcAllies();
  renderFollowedNpcs();
  renderFriends();
};

const getFriendList = () => {
  const profile = loadProfile();
  const friends = profile.playerData?.friends;
  return Array.isArray(friends) ? friends : [];
};

const saveFriendList = (friends) => {
  const profile = loadProfile();
  const nextData = { ...(profile.playerData || {}), friends };
  setProfileCache({ ...profile, playerData: nextData });
  queueSupabaseProfileUpdate({ player_data: nextData });
};

const getFollowedList = () => {
  const profile = loadProfile();
  const followed = profile.playerData?.followed;
  return Array.isArray(followed) ? followed : [];
};

const saveFollowedList = (followed) => {
  const profile = loadProfile();
  const nextData = { ...(profile.playerData || {}), followed };
  setProfileCache({ ...profile, playerData: nextData });
  queueSupabaseProfileUpdate({ player_data: nextData });
};

const getFollowedKey = (item) => {
  if (!item) return "";
  if (item.npc_id) return `npc:${item.npc_id}`;
  return `nick:${item.nickname || ""}`.toLowerCase();
};

const renderFriends = () => {
  const list = document.getElementById("friends-list");
  if (!list) return;
  list.innerHTML = "";
  const friends = getFriendList();
  if (!friends.length) return;
  friends.forEach((friend) => {
    const card = buildSocialSummaryCard(friend, {
      onClick: () => openExternalProfile(friend, { isNpc: friend.is_npc }),
      showAdd: false,
    });
    list.appendChild(card);
  });
};

const renderFollowedList = () => {
  const list = document.getElementById("npc-followed-list");
  if (!list) return;
  list.innerHTML = "";
  const followed = getFollowedList();
  if (!followed.length) {
    const empty = document.createElement("div");
    empty.className = "arena-empty";
    empty.textContent = "Sem seguidos ainda.";
    list.appendChild(empty);
    return;
  }
  followed.forEach((entry) => {
    const card = buildSocialSummaryCard(entry, {
      onClick: () => openExternalProfile(entry, { isNpc: entry.is_npc }),
      showAdd: false,
      showFollow: false,
    });
    list.appendChild(card);
  });
};

const buildSocialSummaryCard = (
  item,
  { onClick, showAdd = false, showFollow = false } = {},
) => {
  const row = document.createElement("div");
  row.className = "social-result";
  if (onClick) row.addEventListener("click", onClick);
  const avatar = document.createElement("div");
  avatar.className = "social-result-avatar";
  if (item.avatar_url) {
    avatar.style.backgroundImage = `url(${item.avatar_url})`;
  }
  const aura =
    item?.player_data?.auraColor ||
    item?.player_data?.borderColor ||
    item?.player_data?.energyColor ||
    "";
  if (aura) avatar.style.setProperty("--aura-color", aura);
  avatar.classList.add("has-frame");
  const meta = document.createElement("div");
  meta.className = "social-result-meta-wrap";
  const name = document.createElement("div");
  name.className = "social-result-name";
  name.textContent = item.nickname || "-";
  const banner = document.createElement("div");
  banner.className = "social-result-banner";
  const bannerText =
    item?.player_data?.banner || item?.banner || item?.player_data?.lema || "";
  const isImageBanner = isImageReference(bannerText);
  banner.textContent = isImageBanner ? "Banner Ativo" : bannerText || "Sem banner";
  applyBannerClasses(banner, bannerText);
  const mood = document.createElement("div");
  mood.className = "social-mood";
  const moodFill = document.createElement("div");
  moodFill.className = "social-mood-fill";
  const moodValue = Number(item?.player_data?.moodLevel || item?.moodLevel || 0);
  const clampedMood = Math.max(0, Math.min(100, Number.isNaN(moodValue) ? 0 : moodValue));
  moodFill.style.width = `${clampedMood}%`;
  const moodColor = item?.player_data?.moodColor || "";
  if (moodColor) moodFill.style.background = moodColor;
  mood.appendChild(moodFill);
  const clan = document.createElement("div");
  clan.className = "social-clan";
  const clanName = item?.player_data?.clan || item?.clan_name || "";
  clan.textContent = clanName ? `Cl├ú ${clanName}` : "Cl├ú -";
  meta.appendChild(name);
  meta.appendChild(banner);
  meta.appendChild(mood);
  meta.appendChild(clan);
  const level = document.createElement("div");
  level.className = "social-result-level";
  const levelValue =
    Number(
      item?.player_data?.identity?.global_level ||
        item?.player_data?.global_level ||
        item?.level_geral ||
        item?.total_level ||
        0,
    ) || 0;
  level.textContent = String(Math.round(levelValue));
  avatar.appendChild(level);
  row.appendChild(avatar);
  row.appendChild(meta);
  if (showAdd) {
    const add = document.createElement("button");
    add.className = "silver-button";
    add.type = "button";
    const friends = getFriendList();
    const already = friends.some((friend) => friend.nickname === item.nickname);
    add.textContent = already ? "Adicionado" : "Adicionar";
    if (already) add.disabled = true;
    add.addEventListener("click", (event) => {
      event.stopPropagation();
      const current = getFriendList();
      if (current.find((f) => f.nickname === item.nickname)) return;
      saveFriendList([...current, item]);
      renderFriends();
    });
    row.appendChild(add);
  }
  if (showFollow) {
    const follow = document.createElement("button");
    follow.className = "silver-button";
    follow.type = "button";
    const followed = getFollowedList();
    const key = getFollowedKey(item);
    const already = followed.some((entry) => getFollowedKey(entry) === key);
    follow.textContent = already ? "Seguindo" : "Seguir";
    if (already) follow.disabled = true;
    follow.addEventListener("click", (event) => {
      event.stopPropagation();
      const current = getFollowedList();
      if (current.some((entry) => getFollowedKey(entry) === key)) return;
      saveFollowedList([...current, { ...item, is_npc: item.is_npc }]);
      renderFollowedList();
    });
    row.appendChild(follow);
  }
  return row;
};

const initSocialSearch = () => {
  const input = document.getElementById("social-search-input");
  const button = document.getElementById("social-search-btn");
  const results = document.getElementById("social-results");
  if (!input || !button || !results) return;

  const renderResults = (items) => {
    results.innerHTML = "";
    if (!items.length) return;
    items.forEach((item) => {
      const row = buildSocialSummaryCard(item, {
        onClick: () => openExternalProfile(item, { isNpc: item.is_npc }),
        showAdd: true,
        showFollow: true,
      });
      results.appendChild(row);
    });
  };

  const doSearch = async () => {
    const term = input.value.trim();
    results.innerHTML = "";
    if (!term) return;
    if (!isSupabaseEnabled()) return;
    try {
      const [profilesRes, npcRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "nickname,full_name,status_title,archetype_name,archetype_tags,avatar_url,cover_url,player_data,selected_gold_assets,level_geral,total_level"
          )
          .ilike("nickname", `%${term}%`)
          .limit(10),
        supabase
          .from("npc_profiles")
          .select(
            "npc_id,nickname,full_name,status_title,archetype_name,archetype_tags,avatar_url,cover_url,player_data,level_geral"
          )
          .ilike("nickname", `%${term}%`)
          .limit(10),
      ]);
      if (profilesRes.error) {
        logSupabaseError("profiles.search.friends", profilesRes.error);
      }
      if (npcRes.error) {
        logSupabaseError("npc_profiles.search", npcRes.error);
      }
      const profilesData = Array.isArray(profilesRes.data) ? profilesRes.data : [];
      const npcData = Array.isArray(npcRes.data)
        ? npcRes.data.map((row) => ({ ...row, is_npc: true }))
        : [];
      renderResults([...profilesData, ...npcData]);
    } catch (error) {
      logSupabaseError("profiles.search.friends", error);
    }
  };

  button.addEventListener("click", doSearch);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") doSearch();
  });
};

const fetchNpcProfiles = async () => {
  if (!isSupabaseEnabled()) return [];
  if (cachedNpcProfiles) return cachedNpcProfiles;
  if (npcFetchInFlight) return npcFetchInFlight;
  npcFetchInFlight = (async () => {
    try {
      const { data, error } = await supabase
        .from("npc_profiles")
        .select(
          "npc_id,nickname,full_name,status_title,archetype_name,archetype_tags,avatar_url,cover_url,player_data,level_geral"
        )
        .order("nickname", { ascending: true });
      if (error) {
        logSupabaseError("npc_profiles.select", error);
        cachedNpcProfiles = [];
        return cachedNpcProfiles;
      }
      cachedNpcProfiles = Array.isArray(data) ? data : [];
      return cachedNpcProfiles;
    } catch (error) {
      logSupabaseError("profiles.select.npc", error);
      cachedNpcProfiles = [];
      return cachedNpcProfiles;
    } finally {
      npcFetchInFlight = null;
    }
  })();
  return npcFetchInFlight;
};

const openNpcProfile = (npc) => {
  openExternalProfile(npc, { isNpc: true });
};

const openExternalProfile = (row, options = {}) => {
  const profileModal = document.getElementById("profile-modal");
  if (!profileModal) return;
  externalProfile = row || null;
  const profileCard = profileModal.querySelector(".profile-card");
  const profileNameDisplay = document.getElementById("profile-name-display");
  const profileLevel = document.getElementById("profile-level");
  const profileIdentity = document.getElementById("profile-identity");
  const profileBannerDisplay = document.getElementById("profile-banner-display");
  const profileStrip = document.getElementById("profile-strip");
  const widgetGrid = document.getElementById("widget-grid");
  const widgetDisplay = document.getElementById("widget-display");
  const level =
    Number(
      row?.player_data?.identity?.global_level ||
        row?.player_data?.global_level ||
        row?.level_geral ||
        row?.total_level ||
        0,
    ) || 0;
  if (profileCard) {
    profileCard.classList.remove("is-npc");
    profileCard.classList.add(options.isNpc ? "is-npc" : "is-external");
  }
  if (profileModal) {
    const cardTheme =
      row?.player_data?.profileCardTheme || row?.player_data?.cardTheme || "gold";
    const borderTheme =
      row?.player_data?.profileBorderTheme || row?.player_data?.borderTheme || cardTheme;
    profileModal.dataset.card = cardTheme;
    profileModal.dataset.border = borderTheme;
  }
  if (profileCard) {
    const borderImage = row?.player_data?.profileBorderImage || "";
    applyProfileBorderVisuals(borderImage, profileCard);
  }
  if (profileNameDisplay) profileNameDisplay.textContent = row?.nickname || "-";
  if (profileLevel) profileLevel.textContent = String(Math.round(level));
  if (profileIdentity) {
    profileIdentity.value = row?.nickname || "";
    profileIdentity.readOnly = true;
  }
  const bannerText =
    row?.player_data?.banner ||
    row?.banner ||
    row?.player_data?.lema ||
    row?.status_title ||
    "GM";
  const bannerWrap = profileModal.querySelector(".profile-banner");
  applyProfileBannerVisuals(bannerText, profileBannerDisplay, bannerWrap, profileStrip, row?.cover_url);
  updateProfileMoodDisplay(row);
  const profileAvatar = profileModal.querySelector(".profile-avatar");
  if (profileAvatar) {
    if (row?.avatar_url) {
      profileAvatar.style.backgroundImage = `url(${row.avatar_url})`;
      profileAvatar.classList.remove("is-default");
    } else {
      profileAvatar.style.backgroundImage = "";
      profileAvatar.classList.add("is-default");
    }
  }
  if (profileCard) {
    const aura = row?.player_data?.auraColor || row?.player_data?.borderColor;
    if (aura) {
      profileCard.style.setProperty("--accent-energy", aura);
    }
  }
  if (widgetGrid) widgetGrid.innerHTML = "";
  if (widgetDisplay) widgetDisplay.innerHTML = "";
  const externalWidgets =
    row?.selected_gold_assets ||
    row?.player_data?.selected_gold_assets ||
    row?.player_data?.widgets ||
    [];
  if (externalWidgets.length) {
    renderProfileWidgetDisplay(
      { widgets: externalWidgets, widgetsVisible: externalWidgets.map(() => true) },
      seedDNAIfMissing(),
    );
  }
  profileModal.classList.add("is-open");
};

function getBannerClassFromText(raw = "") {
  const value = String(raw || "").toLowerCase();
  if (value.includes("gm")) return "banner-gm";
  if (value.includes("aurora")) return "banner-aurora";
  if (value.includes("solar") || value.includes("crest")) return "banner-solar";
  if (value.includes("frost") || value.includes("gelo")) return "banner-frost";
  if (value.includes("ember") || value.includes("fogo")) return "banner-ember";
  if (value.includes("void")) return "banner-void";
  if (value.includes("cyber")) return "banner-cyber";
  if (value.includes("noir")) return "banner-noir";
  if (value.includes("direito")) return "banner-solar";
  return "banner-gold";
}

function applyBannerClasses(el, raw) {
  if (!el) return;
  el.classList.remove(
    "banner-gm",
    "banner-aurora",
    "banner-solar",
    "banner-noir",
    "banner-gold",
    "banner-frost",
    "banner-ember",
    "banner-void",
    "banner-cyber",
  );
  el.classList.add("banner-flag", getBannerClassFromText(raw));
}

const PROFILE_BANNER_LIBRARY = [
  { id: "banner-01", title: "Banner 01", imageUrl: "assets/banners/banner-01.png", unlocked: true },
  { id: "banner-02", title: "Banner 02", imageUrl: "assets/banners/banner-02.png", unlocked: true },
  { id: "banner-03", title: "Banner 03", imageUrl: "assets/banners/banner-03.png", unlocked: true },
  { id: "banner-04", title: "Banner 04", imageUrl: "assets/banners/banner-04.png", unlocked: true },
  { id: "banner-05", title: "Banner 05", imageUrl: "assets/banners/banner-05.png", unlocked: true },
];

const PROFILE_BORDER_LIBRARY = [
  { id: "border-01", title: "Borda 01", imageUrl: "assets/borders/border-01.png", unlocked: true },
  { id: "border-02", title: "Borda 02", imageUrl: "assets/borders/border-02.png", unlocked: true },
  { id: "border-03", title: "Borda 03", imageUrl: "assets/borders/border-03.png", unlocked: true },
  { id: "border-04", title: "Borda 04", imageUrl: "assets/borders/border-04.png", unlocked: true },
  { id: "border-05", title: "Borda 05", imageUrl: "assets/borders/border-05.png", unlocked: true },
];

const isImageReference = (value) => {
  const text = String(value || "");
  return text.startsWith("http") || text.startsWith("data:") || text.includes("/");
};

const applyProfileBorderVisuals = (borderImage, profileCard) => {
  if (!profileCard) return;
  if (borderImage) {
    profileCard.classList.add("has-border-image");
    profileCard.style.setProperty("--profile-card-border", `url("${borderImage}")`);
    return;
  }
  profileCard.classList.remove("has-border-image");
  profileCard.style.removeProperty("--profile-card-border");
};

const applyProfileBannerVisuals = (bannerText, bannerDisplay, bannerWrap, strip, fallbackCover) => {
  const text = String(bannerText || "");
  const isImageBanner = isImageReference(text);
  const displayText = text || "GM";
  if (bannerDisplay) {
    bannerDisplay.textContent = isImageBanner ? "Banner Ativo" : displayText;
    applyBannerClasses(bannerDisplay, displayText);
  }
  if (bannerWrap) {
    bannerWrap.style.backgroundImage = isImageBanner ? `url(${text})` : "";
  }
  if (strip) {
    strip.style.backgroundImage = "";
  }
};

function formatRelativeTime(raw) {
  if (!raw) return "";
  const time = new Date(raw).getTime();
  if (!Number.isFinite(time)) return "";
  const diff = Date.now() - time;
  if (diff < 60 * 1000) return "agora";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h`;
  return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d`;
}

const renderNpcAllies = async () => {
  const list = document.getElementById("npc-list");
  if (!list) return;
  list.innerHTML = "";
  const npcs = await fetchNpcProfiles();
  if (!npcs.length) return;
  npcs.forEach((npc) => {
    const card = buildSocialSummaryCard(npc, {
      onClick: () => openNpcProfile(npc),
      showAdd: false,
    });
    list.appendChild(card);
  });
};

const renderFollowedNpcs = () => {
  renderFollowedList();
};

let profileWidgetDraft = null;

const initProfileWidgetDraft = (profile) => {
  const widgets = Array.isArray(profile.widgets) ? [...profile.widgets] : [];
  const widgetsVisible = Array.isArray(profile.widgetsVisible)
    ? [...profile.widgetsVisible]
    : widgets.map(() => true);
  profileWidgetDraft = { widgets, widgetsVisible };
  return profileWidgetDraft;
};

const discardProfileWidgetDraft = () => {
  profileWidgetDraft = null;
};

const renderProfileWidgetEditor = (profile) => {
  const widgetGrid = document.getElementById("widget-grid");
  if (!widgetGrid) return;
  widgetGrid.innerHTML = "";
  const options = getSlotOptions();
  const draft = profileWidgetDraft || initProfileWidgetDraft(profile);
  const selected = Array.isArray(draft.widgets) ? draft.widgets : [];
  const visible = Array.isArray(draft.widgetsVisible) ? draft.widgetsVisible : [];
  const totalSlots = 5;
  for (let i = 0; i < totalSlots; i += 1) {
    const select = document.createElement("select");
    select.className = "profile-input";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Selecionar Slot";
    select.appendChild(empty);
    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.id;
      option.textContent = opt.label;
      select.appendChild(option);
    });
    select.value = selected[i] || "";
    select.addEventListener("change", () => {
      const draftState = profileWidgetDraft || initProfileWidgetDraft(profile);
      draftState.widgets[i] = select.value;
    });
    const wrapper = document.createElement("div");
    wrapper.className = "widget-item";
    const slotLabel = document.createElement("div");
    slotLabel.className = "widget-slot-label";
    slotLabel.textContent = `Widget ${i + 1}`;
    wrapper.appendChild(slotLabel);
    wrapper.appendChild(select);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "widget-toggle";
    const isOn = visible[i] !== false;
    toggle.textContent = isOn ? "Mostrar" : "Oculto";
    toggle.addEventListener("click", () => {
      const draftState = profileWidgetDraft || initProfileWidgetDraft(profile);
      const nextVisible = Array.isArray(draftState.widgetsVisible)
        ? draftState.widgetsVisible
        : [];
      const nextValue = !(nextVisible[i] !== false);
      nextVisible[i] = nextValue;
      draftState.widgetsVisible = nextVisible;
      toggle.textContent = nextValue ? "Mostrar" : "Oculto";
    });
    wrapper.appendChild(toggle);
    widgetGrid.appendChild(wrapper);
  }
};

const renderProfileWidgetDisplay = (profile, dna) => {
  const container = document.getElementById("widget-display");
  if (!container) return;
  container.innerHTML = "";
  const widgets = Array.isArray(profile.widgets) ? profile.widgets : [];
  const visible = Array.isArray(profile.widgetsVisible) ? profile.widgetsVisible : [];
  const normalizeWidgetAssetId = (id) => (id === "abundancia" ? "financas" : id);
  const normalizeWidgetSlotId = (slotId) => slotId.replace(/^abundancia\./, "financas.");
  const denormalizeWidgetSlotId = (slotId) => slotId.replace(/^financas\./, "abundancia.");
  const arenas = loadArenas();
  const arenasByAsset = new Map();
  arenas.forEach((arena) => {
    if (!arena.assetId) return;
    if (!arenasByAsset.has(arena.assetId)) arenasByAsset.set(arena.assetId, []);
    arenasByAsset.get(arena.assetId).push(arena);
  });
  if (!widgets.length) {
    const empty = document.createElement("div");
    empty.className = "widget-empty";
    empty.textContent = "Sem widgets. Clique em editar para adicionar.";
    container.appendChild(empty);
    return;
  }

  const resolveSlotRef = (widgetId) => {
    if (!widgetId) return null;
    const parts = widgetId.split(".");
    if (parts.length < 2) return null;
    let assetId = parts[0];
    if (assetId === "abundancia") {
      assetId = "financas";
    }
    let slotId = widgetId;
    if (parts[1] === assetId) {
      slotId = parts.slice(1).join(".");
    }
    if (!slotId.startsWith(`${assetId}.`)) {
      const suffix = parts.slice(1).join(".");
      slotId = `${assetId}.${suffix}`;
    }
    if (slotId.startsWith("abundancia.")) {
      slotId = slotId.replace(/^abundancia\./, "financas.");
    }
    return { assetId, slotId };
  };

  const getSlotLabel = (asset, slotId) => {
    const normalizedAssetId = normalizeWidgetAssetId(asset?.id || "");
    const normalizedSlotId = normalizeWidgetSlotId(slotId);
    const slots = getDossierSlots(normalizedAssetId, asset);
    const slot = slots.find((item) => item.id === normalizedSlotId);
    return slot?.label || slotId.split(".").slice(1).join(" ") || "Slot";
  };

  const getSlotType = (asset, slotId) => {
    const normalizedAssetId = normalizeWidgetAssetId(asset?.id || "");
    const normalizedSlotId = normalizeWidgetSlotId(slotId);
    const slots = getDossierSlots(normalizedAssetId, asset);
    const slot = slots.find((item) => item.id === normalizedSlotId);
    return slot?.type || "rect";
  };

  const resolveWidgetBaseType = (slotType) => {
    if (["square", "square-2", "square-large"].includes(slotType)) return "square";
    return "rect";
  };

  const getSlotValue = (asset, slotId) => {
    const normalizedAssetId = normalizeWidgetAssetId(asset?.id || "");
    const normalizedSlotId = normalizeWidgetSlotId(slotId);
    const data =
      asset.profileSlots?.[normalizedSlotId] ||
      asset.profileSlots?.[denormalizeWidgetSlotId(normalizedSlotId)] ||
      asset.profileSlots?.[slotId] ||
      {};
    const slots = getDossierSlots(normalizedAssetId, asset);
    const slot = slots.find((item) => item.id === normalizedSlotId);
    const fields = slot?.fields || [{ key: "value" }];
    const key = fields[0]?.key || "value";
    return data[key] || "";
  };

  const widgetItems = [];
  widgets.forEach((widgetId, index) => {
    if (visible[index] === false) return;
    const ref = resolveSlotRef(widgetId);
    if (!ref) return;
    const asset =
      getAssetFromDNA(dna, ref.assetId) ||
      (ref.assetId === "financas" ? getAssetFromDNA(dna, "abundancia") : null);
    if (!asset) return;
    const normalizedAssetId = normalizeWidgetAssetId(asset.id);
    const normalizedSlotId = normalizeWidgetSlotId(ref.slotId);
    const slots = getDossierSlots(normalizedAssetId, asset);
    const slot = slots.find((item) => item.id === normalizedSlotId);
    const label = getSlotLabel(asset, ref.slotId);
    const type = getSlotType(asset, ref.slotId);
    const slotEl = document.createElement("div");
    slotEl.className = `profile-slot profile-slot--${type}`;
    slotEl.dataset.assetId = ref.assetId;
    slotEl.dataset.slotId = ref.slotId;
    slotEl.dataset.widgetIndex = String(index);
    slotEl.draggable = true;
    slotEl.classList.add("is-draggable");
    slotEl.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", String(index));
      slotEl.classList.add("is-dragging");
    });
    slotEl.addEventListener("dragend", () => {
      slotEl.classList.remove("is-dragging");
    });
    slotEl.style.setProperty("display", "grid", "important");
    slotEl.style.setProperty("gap", "6px", "important");
    const labelEl = document.createElement("div");
    labelEl.className = "slot-label";
    labelEl.textContent = label;
    labelEl.style.setProperty("width", "100%", "important");
    labelEl.style.setProperty("text-align", "center", "important");
    const valueEl = document.createElement("div");
    valueEl.className = "slot-value";
    valueEl.style.setProperty("width", "100%", "important");
    const fields = slot?.fields || [{ key: "value" }];
    const photoKeys = ["foto", "logo", "image", "image_url"];
    const forcedType3Slots = new Set([
      "amor.conexao1",
      "amor.conexao2",
      "amor.conexao3",
      "amor.conexao4",
      "amor.conexao5",
      "amor.conexao6",
      "inspiracao.insp1",
      "inspiracao.insp2",
      "inspiracao.insp3",
      "inspiracao.proj1",
      "inspiracao.proj2",
      "inspiracao.proj3",
      "autenticidade.hobby1",
      "autenticidade.hobby2",
      "autenticidade.hobby3",
      "autenticidade.hobby4",
      "autenticidade.hobby5",
      "autenticidade.hobby6",
      "financas.ativo1",
      "financas.ativo2",
      "financas.ativo3",
      "trabalho.experi1",
      "trabalho.experi2",
      "trabalho.experi3",
      "mente.imagem",
    ]);
    const isPhotoSlot =
      forcedType3Slots.has(ref.slotId) || fields.some((field) => photoKeys.includes(field.key));
    if (isPhotoSlot) {
      slotEl.classList.add("slot-type-3");
      slotEl.style.setProperty("grid-template-rows", "minmax(18px,auto) 1fr minmax(24px,auto)", "important");
      const textFields = fields.filter((field) => !photoKeys.includes(field.key));
      const captionKey = textFields[0]?.key;
      const slotData = asset.profileSlots?.[ref.slotId] || {};
      const image = slotData.image || "";
      slotEl.appendChild(labelEl);
      if (image) {
        valueEl.classList.add("has-image");
        const img = document.createElement("img");
        img.className = "slot-image";
        img.alt = label || "Imagem do slot";
        img.src = String(image);
        valueEl.appendChild(img);
      } else {
        valueEl.textContent = "ÔÇö";
      }
      valueEl.style.setProperty("aspect-ratio", "1 / 1", "important");
      valueEl.style.setProperty("height", "auto", "important");
      valueEl.style.setProperty("padding", "0", "important");
      slotEl.appendChild(valueEl);
      const captionEl = document.createElement("div");
      captionEl.className = "slot-caption";
      captionEl.textContent = captionKey && slotData[captionKey] ? String(slotData[captionKey]) : "";
      captionEl.style.setProperty("width", "100%", "important");
      captionEl.style.setProperty("position", "static", "important");
      captionEl.style.setProperty("display", "flex", "important");
      captionEl.style.setProperty("align-items", "center", "important");
      captionEl.style.setProperty("justify-content", "center", "important");
      captionEl.style.setProperty("min-height", "28px", "important");
      captionEl.style.setProperty("padding", "6px 8px", "important");
      captionEl.style.setProperty("border", "1px solid rgba(212, 175, 55, 0.35)", "important");
      captionEl.style.setProperty("border-radius", "10px", "important");
      captionEl.style.setProperty("background", "rgba(12, 12, 12, 0.82)", "important");
      slotEl.appendChild(captionEl);
    } else {
      if (type === "rect") {
        slotEl.classList.add("slot-type-2");
      } else {
        slotEl.classList.add("slot-type-1");
      }
      const value = getSlotValue(asset, ref.slotId);
      valueEl.textContent = value || "Sem dado";
      slotEl.appendChild(labelEl);
      slotEl.appendChild(valueEl);
    }
    if (ref.assetId === "financas" && ref.slotId.startsWith("financas.ativo")) {
      const miniRow = document.createElement("div");
      miniRow.className = "widget-arenas-row";
      const arenasForAsset = arenasByAsset.get(ref.assetId) || [];
      arenasForAsset.forEach((arena) => {
        const mini = buildArenaCard(arena, { compact: true });
        mini.classList.add("widget-arena-card");
        mini.addEventListener("click", (event) => {
          event.stopPropagation();
        });
        miniRow.appendChild(mini);
      });
      const addMini = buildArenaAddMiniCard(ref.assetId);
      addMini.classList.add("widget-arena-card");
      addMini.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      miniRow.appendChild(addMini);
      slotEl.appendChild(miniRow);
    }
    widgetItems.push({ card: slotEl, baseType: resolveWidgetBaseType(type) });
  });
  if (!widgetItems.length) {
    const empty = document.createElement("div");
    empty.className = "widget-empty";
    empty.textContent = "Sem widgets visiveis. Clique em editar para ajustar.";
    container.appendChild(empty);
    return;
  }

  const totalVisible = widgetItems.length;
  widgetItems.forEach((item) => container.appendChild(item.card));
  const cols = totalVisible <= 3 ? totalVisible : totalVisible <= 6 ? 3 : 4;
  container.style.gridTemplateColumns = `repeat(${cols}, minmax(140px, 1fr))`;
  container.style.justifyItems = "center";
  container.style.justifyContent = "center";
  container.style.gap = "12px";
  if (!container.dataset.dragBound) {
    container.dataset.dragBound = "true";
    container.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    container.addEventListener("drop", (event) => {
      event.preventDefault();
      const fromIndex = Number(event.dataTransfer?.getData("text/plain"));
      const target = event.target.closest(".profile-slot");
      const toIndex = Number(target?.dataset.widgetIndex);
      if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex === toIndex) return;
      const nextWidgets = [...widgets];
      const nextVisible = [...visible];
      const [moved] = nextWidgets.splice(fromIndex, 1);
      const [movedVis] = nextVisible.splice(fromIndex, 1);
      nextWidgets.splice(toIndex, 0, moved);
      nextVisible.splice(toIndex, 0, movedVis);
      const currentProfile = loadProfile();
      saveProfile({
        ...currentProfile,
        widgets: nextWidgets,
        widgetsVisible: nextVisible,
        selectedGoldAssets: nextWidgets,
      });
      renderProfileWidgetDisplay({ ...currentProfile, widgets: nextWidgets, widgetsVisible: nextVisible }, dna);
    });
  }
};

const openBronzeModal = (arenaId, actionId) => {
  const modal = document.getElementById("bronze-modal");
  const iconGrid = document.getElementById("bronze-icon-grid");
  const iconDisplay = document.getElementById("bronze-icon-display");
  const durationInput = document.getElementById("bronze-duration");
  const durationValue = document.getElementById("bronze-duration-value");
  const seriousToggle = document.getElementById("bronze-serious");
  const atemporalToggle = document.getElementById("bronze-atemporal");
  const weeklyCountInput = document.getElementById("bronze-weekly-count");
  const postponableToggle = document.getElementById("bronze-postponable");
  const titleInput = document.getElementById("bronze-title");
  if (!modal || !iconGrid || !durationInput || !seriousToggle || !titleInput) return;
  const setSliderLabelPosition = (inputEl, labelEl) => {
    if (!inputEl || !labelEl) return;
    const min = Number(inputEl.min || 0);
    const max = Number(inputEl.max || 100);
    const value = Number(inputEl.value || 0);
    const percent = max > min ? (value - min) / (max - min) : 0;
    labelEl.style.left = `calc(${(percent * 100).toFixed(2)}% + 0px)`;
  };
  const formatDuration = (minutes) => {
    const total = Math.max(0, Math.round(Number(minutes) || 0));
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    if (hours && mins) return `${hours}h ${mins}m`;
    if (hours) return `${hours}h`;
    return `${mins}m`;
  };
  const planner = loadPlanner();
  const existing = actionId
    ? planner.bronzeActions.find((action) => action.id === actionId)
    : null;
  modal.dataset.arenaId = arenaId;
  modal.dataset.actionId = existing ? existing.id : "";
  modal.dataset.icon = existing?.icon || BRONZE_ICONS[0];
  modal.classList.remove("is-icon-editing");
  titleInput.value = existing?.title || "";
  const durationMinutes = existing?.durationMinutes || 60;
  durationInput.min = "0";
  durationInput.max = "360";
  durationInput.step = "15";
  durationInput.value = String(durationMinutes);
  if (durationValue) durationValue.textContent = formatDuration(durationMinutes);
  const durationPicker = durationInput.closest(".time-picker");
  if (durationPicker) durationPicker.classList.add("has-value");
  if (durationValue) setSliderLabelPosition(durationInput, durationValue);
  seriousToggle.checked = !!existing?.serious;
  if (atemporalToggle) atemporalToggle.checked = !!existing?.atemporal;
  if (postponableToggle) postponableToggle.checked = !!existing?.isPostponable;
  if (weeklyCountInput) {
    const hasWeekdays = Array.isArray(existing?.weekdays) && existing.weekdays.length > 0;
    weeklyCountInput.value =
      !existing?.atemporal && !hasWeekdays && existing?.weeklyTarget
        ? String(existing.weeklyTarget)
        : "0";
  }
  const card = modal.querySelector(".bronze-card-elite");
  if (card) card.classList.remove("serious-on");
  modal.querySelectorAll(".weekday-grid input[type='checkbox']").forEach((input) => {
    input.checked = Array.isArray(existing?.weekdays) ? existing.weekdays.includes(input.value) : false;
  });
  const weekdayInputs = Array.from(modal.querySelectorAll(".weekday-grid input[type='checkbox']"));
  const weeklyCountValue = document.getElementById("bronze-weekly-count-value");
  const updateWeeklyCountLabel = () => {
    if (!weeklyCountValue || !weeklyCountInput) return;
    weeklyCountValue.textContent = `${weeklyCountInput.value || 0}x`;
    setSliderLabelPosition(weeklyCountInput, weeklyCountValue);
    const weeklyPicker = weeklyCountInput.closest(".time-picker");
    if (weeklyPicker) {
      weeklyPicker.classList.toggle("has-value", Number(weeklyCountInput.value || 0) > 0);
    }
  };
  const syncFrequencyControls = () => {
    const isAtemporal = !!atemporalToggle?.checked;
    const weeklyValue = Number(weeklyCountInput?.value || 0);
    const hasWeekdays = weekdayInputs.some((input) => input.checked);
    if (isAtemporal) {
      if (weeklyCountInput) weeklyCountInput.value = "0";
      weekdayInputs.forEach((input) => {
        input.checked = false;
      });
    } else if (hasWeekdays && weeklyValue > 0) {
      if (weeklyCountInput) weeklyCountInput.value = "0";
    } else if (!hasWeekdays && weeklyValue > 0) {
      weekdayInputs.forEach((input) => {
        input.checked = false;
      });
    }
    const nextHasWeekdays = weekdayInputs.some((input) => input.checked);
    const nextWeekly = Number(weeklyCountInput?.value || 0);
    if (weeklyCountInput) weeklyCountInput.disabled = isAtemporal || nextHasWeekdays;
    weekdayInputs.forEach((input) => {
      input.disabled = isAtemporal || nextWeekly > 0;
    });
    updateWeeklyCountLabel();
  };
  if (weeklyCountInput) {
    weeklyCountInput.oninput = () => {
      syncFrequencyControls();
    };
  }
  weekdayInputs.forEach((input) => {
    input.onchange = () => {
      syncFrequencyControls();
    };
  });
  if (atemporalToggle) {
    atemporalToggle.onchange = () => {
      syncFrequencyControls();
    };
  }
  updateWeeklyCountLabel();
  syncFrequencyControls();
  if (iconDisplay && iconGrid) {
    renderBronzeIconPicker(modal, iconDisplay, iconGrid, existing?.icon || BRONZE_ICONS[0]);
  }
  if (window.lucide) window.lucide.createIcons();
  modal.classList.add("is-open");
};

const closeBronzeModal = () => {
  const modal = document.getElementById("bronze-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.dataset.arenaId = "";
  modal.dataset.actionId = "";
};

const buildOracleForm = (dna) => {
  const container = document.getElementById("oracle-form");
  if (!container) return;
  container.innerHTML = "";
  dna.assets.forEach((asset) => {
    const row = document.createElement("div");
    row.className = "oracle-row";
    const label = document.createElement("label");
    label.textContent = LABEL_BY_ID.get(asset.id) ?? asset.label;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "100";
    input.step = "1";
    input.value = String(Math.round(Number(asset.level || 0) * 10));
    input.dataset.assetId = asset.id;
    row.appendChild(label);
    row.appendChild(input);
    container.appendChild(row);
  });
};

const buildSovereignControls = (dna) => {
  const select = document.getElementById("sovereign-asset-select");
  const sliders = document.getElementById("sovereign-sliders");
  if (!select || !sliders) return;
  select.innerHTML = "";
  dna.assets.forEach((asset) => {
    const option = document.createElement("option");
    option.value = asset.id;
    option.textContent = LABEL_BY_ID.get(asset.id) ?? asset.label;
    select.appendChild(option);
  });

  const renderSliders = () => {
    sliders.innerHTML = "";
    dna.assets.forEach((asset) => {
      const row = document.createElement("div");
      row.className = "sovereign-row";
      const label = document.createElement("label");
      label.textContent = LABEL_BY_ID.get(asset.id) ?? asset.label;
      const input = document.createElement("input");
      input.type = "range";
      input.min = "0";
      input.max = "10";
      input.step = "1";
      input.value = String(Math.round(Number(asset.level || 0)));
      input.addEventListener("input", () => {
        asset.level = Number(input.value);
        dna.lastUpdatedAt = new Date().toISOString();
        saveDNA(dna);
        renderTree();
      });
      row.appendChild(label);
      row.appendChild(input);
      sliders.appendChild(row);
    });
  };
  renderSliders();
};

const renderSlotEditor = (dna, assetId) => {
  const list = document.getElementById("slot-list");
  if (!list) return;
  const asset = dna.assets.find((item) => item.id === assetId);
  list.innerHTML = "";
  if (!asset) return;
  asset.slots.forEach((slot) => {
    const slotEl = document.createElement("div");
    slotEl.className = "slot-item";
    const slotInput = document.createElement("input");
    slotInput.value = slot.label;
    slotInput.addEventListener("change", () => {
      slot.label = slotInput.value;
      dna.lastUpdatedAt = new Date().toISOString();
      saveDNA(dna);
    });
    slotEl.appendChild(slotInput);

    const metrics = slot.metrics || [];
    metrics.forEach((metric) => {
      const metricRow = document.createElement("div");
      metricRow.className = "metric-row";
      const labelInput = document.createElement("input");
      labelInput.value = metric.label ?? "";
      labelInput.addEventListener("change", () => {
        metric.label = labelInput.value;
        dna.lastUpdatedAt = new Date().toISOString();
        saveDNA(dna);
      });
      const valueInput = document.createElement("input");
      valueInput.value = metric.value ?? "";
      valueInput.addEventListener("change", () => {
        metric.value = valueInput.value;
        dna.lastUpdatedAt = new Date().toISOString();
        saveDNA(dna);
      });
      const addMetricBtn = document.createElement("button");
      addMetricBtn.className = "primary-button";
      addMetricBtn.setAttribute("aria-label", "Adicionar Metrica");
      const addMetricIcon = document.createElement("i");
      addMetricIcon.setAttribute("data-lucide", "plus");
      addMetricBtn.appendChild(addMetricIcon);
      addMetricBtn.addEventListener("click", () => {
        slot.metrics = slot.metrics || [];
        slot.metrics.push({ id: crypto.randomUUID(), label: "Metrica", value: "" });
        dna.lastUpdatedAt = new Date().toISOString();
        saveDNA(dna);
        renderSlotEditor(dna, assetId);
      });
      metricRow.appendChild(labelInput);
      metricRow.appendChild(valueInput);
      metricRow.appendChild(addMetricBtn);
      slotEl.appendChild(metricRow);
    });

    const addMetricRow = document.createElement("button");
    addMetricRow.className = "primary-button";
    addMetricRow.setAttribute("aria-label", "Adicionar Metrica");
    const addMetricRowIcon = document.createElement("i");
    addMetricRowIcon.setAttribute("data-lucide", "plus");
    addMetricRow.appendChild(addMetricRowIcon);
    addMetricRow.addEventListener("click", () => {
      slot.metrics = slot.metrics || [];
      slot.metrics.push({ id: crypto.randomUUID(), label: "Metrica", value: "" });
      dna.lastUpdatedAt = new Date().toISOString();
      saveDNA(dna);
      renderSlotEditor(dna, assetId);
    });
    slotEl.appendChild(addMetricRow);
    list.appendChild(slotEl);
  });
  if (window.lucide) window.lucide.createIcons();
};

const createArenaFromInit = (title) => {
  const arenas = loadArenas();
  const nextArena = {
    id: crypto.randomUUID(),
    title: title || "Arena Inicial",
    description: "",
    assetId: "trabalho",
    completion: 0,
    createdAt: new Date().toISOString(),
  };
  arenas.push(nextArena);
  saveArenas(arenas);
  renderArenas();
  return nextArena;
};

const createBronzeFromInit = (title, icon) => {
  const planner = loadPlanner();
  const action = {
    id: crypto.randomUUID(),
    title: title || "Acao Inicial",
    icon: icon || "flame",
    durationMinutes: 30,
    status: "backlog",
    createdDate: new Date().toISOString(),
  };
  planner.bronzeActions.push(action);
  savePlanner(planner);
  renderPlanner();
  return action;
};

const getConexaoLema = () => {
  const dna = seedDNAIfMissing();
  const asset = getAssetFromDNA(dna, "conexao");
  const slot = asset?.profileSlots?.["conexao.lema"];
  return (slot?.value || "").trim();
};

const reconcileMissionState = (nextState) => {
  const updates = {};
  let changed = false;
  Object.entries(nextState).forEach(([key, value]) => {
    if (missionState[key] !== value) {
      updates[key] = value;
      changed = true;
    }
  });
  if (changed) updateMissionState(updates);
};

const checkMissionProgress = () => {
  const arenas = loadArenas();
  const planner = loadPlanner();
  const m1 = arenas.length > 0;
  const m2 = planner.bronzeActions.length > 0;
  const m3 = planner.bronzeActions.some(
    (action) =>
      action.status === "done" && Number(action.scheduledDayOffset || 0) !== 0,
  );
  const m4 = Boolean(getConexaoLema());
  const m5 = missionState.m5;
  reconcileMissionState({
    m1,
    m2,
    m3,
    m4,
    m5,
    initiation_finished: m1 && m2 && m3 && m4 && m5,
  });
};

const renderInitiationOverlay = () => {
  const overlay = document.getElementById("init-overlay");
  const body = document.getElementById("init-body");
  const title = document.getElementById("init-title");
  if (!overlay || !body || !title) return;

  if (bypassInitiation || missionState.initiation_finished) {
    overlay.classList.add("is-hidden");
    return;
  }

  overlay.classList.remove("is-hidden");
  overlay.classList.remove("is-pass-through");
  const step = !missionState.m1
    ? "m1"
    : !missionState.m2
      ? "m2"
      : !missionState.m3
        ? "m3"
        : !missionState.m4
          ? "m4"
          : "m5";

  if (step === "m1") {
    title.textContent = "M1 - Arenas";
    body.innerHTML = `
      <div class="drawer-title">O que voce costuma fazer?</div>
      <div class="init-actions">
        <input class="init-input" id="init-arena-title" placeholder="Ex: Estudo, Trabalho, Treino" />
        <button class="gold-button" id="init-arena-create">Criar primeira Arena</button>
      </div>
    `;
    const button = document.getElementById("init-arena-create");
    button?.addEventListener("click", () => {
      const input = document.getElementById("init-arena-title");
      const value = input?.value?.trim();
      createArenaFromInit(value);
      updateMissionState({ m1: true });
      checkMissionProgress();
    });
    return;
  }

  if (step === "m2") {
    title.textContent = "M2 - Bronze";
    body.innerHTML = `
      <div class="drawer-title">Crie sua primeira Acao</div>
      <div class="init-actions">
        <input class="init-input" id="init-bronze-title" placeholder="Ex: 20min leitura" />
        <div class="bronze-icon-grid" id="init-bronze-icons"></div>
        <button class="gold-button" id="init-bronze-create">Salvar Acao</button>
      </div>
    `;
    const iconGrid = document.getElementById("init-bronze-icons");
    let selectedIcon = "flame";
    if (iconGrid) {
      BRONZE_ICONS.forEach((iconName) => {
        const btn = document.createElement("button");
        btn.className = "bronze-icon";
        if (iconName === selectedIcon) btn.classList.add("is-active");
        btn.innerHTML = `<i data-lucide="${iconName}"></i>`;
        btn.addEventListener("click", () => {
          selectedIcon = iconName;
          iconGrid.querySelectorAll(".bronze-icon").forEach((el) => el.classList.remove("is-active"));
          btn.classList.add("is-active");
        });
        iconGrid.appendChild(btn);
      });
      if (window.lucide) window.lucide.createIcons();
    }
    const button = document.getElementById("init-bronze-create");
    button?.addEventListener("click", () => {
      const input = document.getElementById("init-bronze-title");
      const value = input?.value?.trim();
      createBronzeFromInit(value, selectedIcon);
      updateMissionState({ m2: true });
      checkMissionProgress();
    });
    return;
  }

  if (step === "m3") {
    title.textContent = "M3 - Planner";
    body.innerHTML = `
      <div class="drawer-title">Arraste para o Planner</div>
      <div class="modal-body">
        Arraste sua Acao para um horario futuro, depois segure 5s para concluir.
      </div>
      <div class="init-actions">
        <button class="gold-button" id="init-open-planner">Abrir Planner</button>
        <button class="silver-button" id="init-pass-through">Liberar interacao</button>
      </div>
    `;
    const button = document.getElementById("init-open-planner");
    button?.addEventListener("click", () => {
      setActiveScreen("planner");
    });
    const passThrough = document.getElementById("init-pass-through");
    passThrough?.addEventListener("click", () => {
      overlay.classList.add("is-pass-through");
      setActiveScreen("planner");
    });
    return;
  }

  if (step === "m4") {
    title.textContent = "M4 - Lema";
    body.innerHTML = `
      <div class="drawer-title">Defina seu Lema no Ativo Conexao</div>
      <div class="init-actions">
        <button class="gold-button" id="init-open-conexao">Abrir Conexao</button>
        <button class="silver-button" id="init-pass-through">Liberar interacao</button>
      </div>
    `;
    const button = document.getElementById("init-open-conexao");
    button?.addEventListener("click", () => {
      openTreeEditor("conexao");
    });
    const passThrough = document.getElementById("init-pass-through");
    passThrough?.addEventListener("click", () => {
      overlay.classList.add("is-pass-through");
      openTreeEditor("conexao");
    });
    return;
  }

  title.textContent = "M5 - Oraculo";
  body.innerHTML = `
    <div class="drawer-title">Validacao dos Ativos</div>
    <div class="init-actions">
      <button class="gold-button" id="init-start-oracle">Iniciar Oraculo</button>
    </div>
  `;
  const button = document.getElementById("init-start-oracle");
  button?.addEventListener("click", () => {
    startOracleFlow();
  });
};

const startOracleFlow = () => {
  const modal = document.getElementById("oracle-modal");
  const question = document.getElementById("oracle-question");
  const levels = document.getElementById("oracle-levels");
  if (!modal || !question || !levels) return;
  let index = 0;
  const assets = SEPHIROT.map((asset) => asset.id);

  const renderStep = () => {
    const assetId = assets[index];
    const phraseKey = ASSET_TO_PHRASE[assetId];
    const phrases = phraseKey ? MASTERY_PHRASES[phraseKey] : [];
    const label = LABEL_BY_ID.get(assetId) || assetId;
    question.textContent = `Nivel de ${label}`;
    levels.innerHTML = "";
    phrases.forEach((phrase, levelIndex) => {
      const button = document.createElement("button");
      button.className = "level-btn";
      button.textContent = stripMasteryLevelPrefix(phrase);
      button.addEventListener("click", () => {
        const dna = seedDNAIfMissing();
        const asset = getAssetFromDNA(dna, assetId);
        if (asset) {
          asset.level = levelIndex + 1;
          dna.lastUpdatedAt = new Date().toISOString();
          saveDNA(dna);
          renderTree();
          renderArenas();
          const arenaDossier = document.getElementById("arena-dossier");
          const arenaId = arenaDossier?.dataset?.arenaId;
          if (arenaDossier?.classList.contains("is-open") && arenaId) {
            openArenaDossier(arenaId);
          }
        }
        const total = computeTotalLevel();
        const profile = loadProfile();
        saveProfile({ ...profile, total_level: total });
        syncProfileTotals({ total_level: total });
        index += 1;
        if (index >= assets.length) {
          modal.classList.remove("is-open");
          updateMissionState({ m5: true, initiation_finished: true });
          const finishedProfile = loadProfile();
          saveProfile({ ...finishedProfile, total_level: total, status: "oracle" });
          applyOracleStatus();
          checkMissionProgress();
          return;
        }
        renderStep();
      });
      levels.appendChild(button);
    });
  };

  renderStep();
  modal.classList.add("is-open");
};

const loadHistorySource = async () => {
  let profile = loadProfile();
  let planner = loadPlanner();
  let arenas = loadArenas();

  if (!isSupabaseEnabled()) {
    return { profile, planner, arenas };
  }

  try {
    const user = await getSupabaseUser();
    if (!user) return { profile, planner, arenas };
    const { data, error } = await supabase
      .from("profiles")
      .select("planner_state, player_data, avatar_url, nickname, full_name, level_geral")
      .eq("id", user.id)
      .single();
    if (error) {
      logSupabaseError("history.loadProfile", error);
      return { profile, planner, arenas };
    }
    if (data?.planner_state) planner = data.planner_state;
    const arenaData = data?.player_data?.arenas;
    if (Array.isArray(arenaData)) arenas = arenaData;
    profile = {
      ...profile,
      avatar: data?.avatar_url ?? profile.avatar,
      nickname: data?.nickname ?? profile.nickname,
      full_name: data?.full_name ?? profile.full_name,
      level: data?.level_geral ?? profile.level,
    };
  } catch (error) {
    logSupabaseError("history.loadProfile", error);
  }

  return { profile, planner, arenas };
};

const renderHistoryReport = (week, profile, reportWrap) => {
  if (!week || !reportWrap) return;
  reportWrap.innerHTML = "";

  const card = document.createElement("div");
  card.className = "history-report-card";
  card.id = "history-report-card";

  const header = document.createElement("div");
  header.className = "history-report-header";

  const identity = document.createElement("div");
  identity.className = "history-report-identity";

  const avatar = document.createElement("div");
  avatar.className = "history-report-avatar";
  if (profile?.avatar) {
    avatar.style.backgroundImage = `url(${profile.avatar})`;
  }

  const nameWrap = document.createElement("div");
  nameWrap.className = "history-report-name";
  const name = document.createElement("strong");
  name.textContent = profile?.nickname || profile?.full_name || "Jogador";
  const level = document.createElement("span");
  level.textContent = profile?.level ? `Nivel ${profile.level}` : "Nivel atual";
  nameWrap.appendChild(name);
  nameWrap.appendChild(level);
  identity.appendChild(avatar);
  identity.appendChild(nameWrap);

  const period = document.createElement("div");
  period.className = "history-report-period";
  period.textContent = week.label;

  header.appendChild(identity);
  header.appendChild(period);

  const grid = document.createElement("div");
  grid.className = "history-report-grid";

  if (week.stats.length === 0) {
    const empty = document.createElement("div");
    empty.className = "config-placeholder";
    empty.textContent = "Sem dados suficientes nesta semana.";
    grid.appendChild(empty);
  } else {
    week.stats
      .sort((a, b) => b.planned - a.planned)
      .forEach((stat) => {
        const row = document.createElement("div");
        row.className = "history-asset-row";

        const label = document.createElement("span");
        label.textContent = LABEL_BY_ID.get(stat.assetId) || stat.assetId;

        const track = document.createElement("div");
        track.className = "history-progress-track";
        const bar = document.createElement("div");
        bar.className = "history-progress-bar";
        const percent = stat.planned > 0 ? Math.round((stat.done / stat.planned) * 100) : 0;
        bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
        track.appendChild(bar);

        const percentLabel = document.createElement("div");
        percentLabel.className = "history-asset-percent";
        percentLabel.textContent = `${percent}%`;

        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(percentLabel);
        grid.appendChild(row);
      });
  }

  const footer = document.createElement("div");
  footer.className = "history-report-footer";

  const score = document.createElement("div");
  score.className = "history-report-score";
  score.textContent = `${week.score}%`;

  const actions = document.createElement("div");
  actions.className = "history-report-actions";
  const downloadBtn = document.createElement("button");
  downloadBtn.type = "button";
  downloadBtn.className = "gold-button";
  downloadBtn.textContent = "Baixar Relatorio";
  downloadBtn.addEventListener("click", async () => {
    const captureTarget = document.getElementById("history-report-card");
    if (!captureTarget || !window.html2canvas) {
      console.error("[history] html2canvas indisponivel");
      return;
    }
    const canvas = await window.html2canvas(captureTarget, {
      backgroundColor: "#0f1115",
      scale: 2,
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `relatorio-semanal-${week.key}.png`;
    link.click();
  });
  actions.appendChild(downloadBtn);

  footer.appendChild(score);
  footer.appendChild(actions);

  card.appendChild(header);
  card.appendChild(grid);
  card.appendChild(footer);
  reportWrap.appendChild(card);
};

const renderHistoryView = async () => {
  const listEl = document.getElementById("history-week-list");
  const modal = document.getElementById("planner-history-modal");
  const modalDetailEl = document.getElementById("planner-history-modal-detail");
  if (!listEl) return;

  listEl.innerHTML = '<div class="config-placeholder">Carregando historico...</div>';

  const { planner, arenas } = await loadHistorySource();
  const weeks = buildHistoryWeeks(planner, arenas);

  if (weeks.length === 0) {
    listEl.innerHTML = '<div class="config-placeholder">Sem historico ainda.</div>';
    return;
  }

  listEl.innerHTML = "";
  weeks.forEach((week) => {
    const block = document.createElement("div");
    block.className = "history-week-block";
    block.dataset.weekKey = week.key;

    const label = document.createElement("div");
    label.textContent = week.label;
    const score = document.createElement("div");
    score.className = "history-score";
    score.textContent = `${week.score}%`;
    const range = document.createElement("div");
    range.className = "history-range";
    range.textContent = `${formatShortDate(week.weekStart)} - ${formatShortDate(week.weekEnd)}`;
    const progress = document.createElement("div");
    progress.className = "history-progress";
    const fill = document.createElement("div");
    fill.className = "history-progress-fill";
    fill.style.width = `${Math.max(0, Math.min(100, week.score))}%`;
    progress.appendChild(fill);

    block.appendChild(label);
    block.appendChild(score);
    block.appendChild(range);
    block.appendChild(progress);

    block.addEventListener("click", () => {
      if (modalDetailEl) renderPlannerHistoryDetail(week, modalDetailEl);
      if (modal) modal.classList.add("is-open");
    });

    listEl.appendChild(block);
  });
  if (window.lucide) window.lucide.createIcons();
};

const getWeeklyReports = (profile) => {
  const normalized = normalizePlayerData(profile);
  const reports = normalized.planner?.weeklyReports;
  return Array.isArray(reports) ? reports : [];
};

const saveWeeklyReports = (reports) => {
  const profile = loadProfile();
  const normalized = normalizePlayerData(profile);
  const nextData = {
    ...normalized,
    planner: {
      ...(normalized.planner || {}),
      weeklyReports: reports,
    },
  };
  saveProfile({ ...profile, playerData: nextData });
  ensureSupabaseProfile({ ...profile, playerData: nextData });
};

const buildRadarSvg = (values, labels) => {
  const size = 200;
  const center = size / 2;
  const radius = 80;
  const step = (Math.PI * 2) / values.length;
  const rings = [0.25, 0.5, 0.75, 1];

  const pointFor = (value, index) => {
    const angle = -Math.PI / 2 + step * index;
    const r = radius * Math.max(0, Math.min(1, value));
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const ringPolygons = rings
    .map((ring) => {
      const points = values
        .map((_, index) => pointFor(ring, index))
        .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
        .join(" ");
      return `<polygon points="${points}" fill="none" stroke="rgba(250, 204, 21, 0.15)" stroke-width="1" />`;
    })
    .join("");

  const axes = values
    .map((_, index) => {
      const end = pointFor(1, index);
      return `<line x1="${center}" y1="${center}" x2="${end.x.toFixed(1)}" y2="${end.y.toFixed(1)}" stroke="rgba(250, 204, 21, 0.2)" stroke-width="1" />`;
    })
    .join("");

  const dataPoints = values
    .map((value, index) => pointFor(value, index))
    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");

  return `
    <svg viewBox="0 0 ${size} ${size}" aria-label="Grafico de teia">
      ${ringPolygons}
      ${axes}
      <polygon points="${dataPoints}" fill="rgba(250, 204, 21, 0.25)" stroke="rgba(250, 204, 21, 0.85)" stroke-width="1.5" />
      <circle cx="${center}" cy="${center}" r="2" fill="rgba(250, 204, 21, 0.9)" />
    </svg>
  `;
};

const renderPlannerHistoryDetail = (report, detailEl) => {
  if (!detailEl || !report) return;
  detailEl.innerHTML = "";
  const dna = seedDNAIfMissing();
  const assets = dna.assets;
  const statsById = new Map(report.stats.map((stat) => [stat.assetId, stat]));

  const values = assets.map((asset) => {
    const stat = statsById.get(asset.id);
    if (!stat || stat.planned <= 0) return 0;
    return Math.round((stat.done / stat.planned) * 100) / 100;
  });

  const labels = assets.map((asset) => LABEL_BY_ID.get(asset.id) || asset.label || asset.id);
  const radar = document.createElement("div");
  radar.className = "planner-history-radar";
  radar.innerHTML = buildRadarSvg(values, labels);

  const radarIcons = document.createElement("div");
  radarIcons.className = "planner-history-radar-icons";
  const center = 50;
  const radius = 48;
  const step = 360 / assets.length;
  assets.forEach((asset, index) => {
    const angle = -90 + step * index;
    const rad = (angle * Math.PI) / 180;
    const x = center + radius * Math.cos(rad);
    const y = center + radius * Math.sin(rad);
    const iconWrap = document.createElement("div");
    iconWrap.className = "planner-history-radar-icon";
    iconWrap.style.left = `${x}%`;
    iconWrap.style.top = `${y}%`;
    const iconName = ICON_BY_ID[asset.id] || "circle";
    iconWrap.innerHTML = `<i data-lucide="${iconName}"></i>`;
    const stat = statsById.get(asset.id);
    const percent = stat && stat.planned > 0 ? Math.round((stat.done / stat.planned) * 100) : 0;
    const value = document.createElement("div");
    value.className = "planner-history-radar-value";
    value.textContent = `${percent}%`;
    iconWrap.appendChild(value);
    radarIcons.appendChild(iconWrap);
  });
  radar.appendChild(radarIcons);

  const legend = document.createElement("div");
  legend.className = "planner-history-legend";
  assets.forEach((asset, index) => {
    const stat = statsById.get(asset.id);
    const percent = stat && stat.planned > 0 ? Math.round((stat.done / stat.planned) * 100) : 0;
    const label = document.createElement("div");
    label.textContent = `${LABEL_BY_ID.get(asset.id) || asset.label || asset.id}: ${percent}%`;
    legend.appendChild(label);
  });

  detailEl.appendChild(radar);
  const summary = document.createElement("div");
  summary.className = "planner-history-summary";
  const totalPercent = report.totalPlanned > 0 ? Math.round((report.totalDone / report.totalPlanned) * 100) : 0;
  const summaryText = document.createElement("div");
  summaryText.className = "planner-history-summary-text";
  summaryText.textContent = `Metas concluidas ${report.totalDone}/${report.totalPlanned} (${totalPercent}%)`;
  const summaryBar = document.createElement("div");
  summaryBar.className = "planner-history-summary-bar";
  const summaryFill = document.createElement("div");
  summaryFill.className = "planner-history-summary-fill";
  summaryFill.style.width = `${Math.max(0, Math.min(100, totalPercent))}%`;
  summaryBar.appendChild(summaryFill);
  summary.appendChild(summaryText);
  summary.appendChild(summaryBar);
  detailEl.appendChild(summary);
  detailEl.appendChild(legend);
  if (window.lucide) window.lucide.createIcons();
};


const renderPlannerHistory = async () => {
  const listEl = document.getElementById("planner-history-list");
  const modalDetailEl = document.getElementById("planner-history-modal-detail");
  const modal = document.getElementById("planner-history-modal");
  if (!listEl) return;

  const { planner, arenas } = await loadHistorySource();
  const weeks = buildHistoryWeeks(planner, arenas, 10);

  listEl.innerHTML = "";
  if (weeks.length === 0) {
    listEl.innerHTML = '<div class="planner-placeholder">Sem historico ainda.</div>';
    return;
  }

  weeks.forEach((week) => {
    const card = document.createElement("div");
    card.className = "planner-history-card";
    const label = document.createElement("div");
    label.textContent = week.label;
    const score = document.createElement("div");
    score.className = "history-score";
    score.textContent = `${week.score}%`;
    card.appendChild(label);
    card.appendChild(score);
    card.addEventListener("click", () => {
      if (modalDetailEl) renderPlannerHistoryDetail(week, modalDetailEl);
      if (modal) modal.classList.add("is-open");
    });
    listEl.appendChild(card);
  });
};

// Planner historico removido; historico fica apenas na aba de configuracoes.

const initConfig = () => {
  const dna = seedDNAIfMissing();
  const configTabs = Array.from(document.querySelectorAll(".config-item"));
  const configSections = Array.from(document.querySelectorAll(".config-section"));
  const activateConfig = (section) => {
    configTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.section === section);
    });
    configSections.forEach((panel) => {
      panel.classList.toggle("is-hidden", panel.dataset.section !== section);
    });
  };
  if (configTabs.length > 0) {
    configTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        if (!tab.dataset.section) return;
        activateConfig(tab.dataset.section);
      });
    });
    const defaultSection = configTabs.find((tab) => tab.classList.contains("is-active"))?.dataset
      .section;
    activateConfig(defaultSection || "perfil");
  }
  const renderMastery = (mode) => {
    const container = document.getElementById("mastery-list");
    if (!container) return;
    container.innerHTML = "";
    dna.assets.forEach((asset) => {
      const phraseKey = ASSET_TO_PHRASE[asset.id];
      const phrases = phraseKey ? MASTERY_PHRASES[phraseKey] : [];
      const row = document.createElement("div");
      row.className = "mastery-row";
      const header = document.createElement("div");
      header.className = "mastery-header";
      const label = document.createElement("span");
      label.textContent = LABEL_BY_ID.get(asset.id) ?? asset.label;
      const value = document.createElement("span");
      value.textContent = String(Math.round(Number(asset.level || 1)));
      header.appendChild(label);
      header.appendChild(value);

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "1";
      slider.max = "10";
      slider.step = "1";
      slider.value = String(Math.max(1, Math.round(Number(asset.level || 1))));
      slider.className = "mastery-slider";

      const phraseEl = document.createElement("div");
      phraseEl.className = "mastery-phrase";

      const phraseInput = document.createElement("textarea");
      phraseInput.className = "mastery-textarea";
      phraseInput.placeholder = "Escreva sua frase soberana...";
      phraseInput.value = asset.customText || "";

      const editorWrap = document.createElement("div");
      editorWrap.className = "mastery-editor";
      const okBtn = document.createElement("button");
      okBtn.type = "button";
      okBtn.className = "icon-button mastery-save-ok";
      okBtn.setAttribute("aria-label", "Salvar frase");
      okBtn.innerHTML = '<i data-lucide="check"></i>';
      okBtn.addEventListener("click", () => {
        if (mode === "oracle") return;
        asset.customText = phraseInput.value;
        dna.lastUpdatedAt = new Date().toISOString();
        saveDNA(dna);
        editorWrap.classList.remove("is-dirty");
        phraseInput.blur();
      });
      phraseInput.addEventListener("input", () => {
        if (mode === "oracle") return;
        editorWrap.classList.add("is-dirty");
      });

      const updateView = () => {
        value.textContent = String(Math.round(Number(slider.value)));
        if (mode === "oracle") {
          const index = Math.max(0, Math.min(9, Number(slider.value) - 1));
          const phrase = phrases[index] || "";
          phraseEl.textContent = stripMasteryLevelPrefix(phrase);
          phraseEl.style.display = "block";
          phraseInput.style.display = "none";
          phraseInput.value = stripMasteryLevelPrefix(phrase);
          phraseInput.readOnly = true;
          editorWrap.style.display = "none";
          editorWrap.classList.remove("is-dirty");
        } else {
          phraseInput.readOnly = false;
          phraseEl.style.display = "none";
          phraseInput.style.display = "block";
          editorWrap.style.display = "block";
        }
      };

      const scheduleSupabaseSync = (() => {
        let timer = null;
        return (value) => {
          const nextLevel = Number(value);
          const profile = loadProfile();
          const assetLevels = { ...(profile.assetLevels || {}) };
          assetLevels[asset.id] = nextLevel;
          saveProfile({ ...profile, assetLevels });
          if (!isSupabaseEnabled()) return;
          if (timer) clearTimeout(timer);
          timer = setTimeout(async () => {
            try {
              const user = await getSupabaseUser();
              if (!user) return;
              const { error } = await supabase.from("profiles").upsert({
                id: user.id,
                asset_levels: assetLevels,
              });
              if (error) logSupabaseError("profiles.upsert (asset_levels)", error);
            } catch (error) {
              logSupabaseError("profiles.upsert (asset_levels)", error);
            }
          }, 400);
        };
      })();

      slider.addEventListener("input", () => {
        asset.level = Number(slider.value);
        dna.lastUpdatedAt = new Date().toISOString();
        saveDNA(dna);
        renderTree();
        updateView();
        scheduleSupabaseSync(slider.value);
      });

      updateView();
      row.appendChild(header);
      row.appendChild(slider);
      row.appendChild(phraseEl);
      editorWrap.appendChild(phraseInput);
      editorWrap.appendChild(okBtn);
      row.appendChild(editorWrap);
      container.appendChild(row);
    });
    if (window.lucide) window.lucide.createIcons();
  };

  const modeInputs = document.querySelectorAll("input[name='mastery-mode']");
  const setMode = (mode) => {
    safeLocalSet(MODE_KEY, mode);
    const profile = loadProfile();
    const normalized = normalizePlayerData(profile);
    const nextData = {
      ...normalized,
      config: {
        ...(normalized.config || {}),
        masteryMode: mode,
      },
    };
    saveProfile({ ...profile, playerData: nextData });
    modeInputs.forEach((input) => {
      input.checked = input.value === mode;
    });
    renderMastery(mode);
  };

  const profile = loadProfile();
  const normalized = normalizePlayerData(profile);
  const storedMode = normalized.config?.masteryMode || safeLocalGet(MODE_KEY) || "sovereign";
  setMode(storedMode);

  modeInputs.forEach((input) => {
    input.addEventListener("change", () => setMode(input.value));
  });
};

const initPlanner = () => {
  applyRolloverActions();
  renderPlanner();
  updateDayLabel();
  const notesToggle = document.getElementById("notes-toggle");
  const historyPanel = document.getElementById("planner-history-panel");
  const historyModal = document.getElementById("planner-history-modal");
  const historyModalClose = document.getElementById("planner-history-close");
  const checklistModal = document.getElementById("checklist-modal");
  const checklistClose = document.getElementById("checklist-close");
  const checklistAdd = document.getElementById("checklist-add");
  const checklistOk = document.getElementById("checklist-ok");
  const checklistList = document.getElementById("checklist-list");
  const renderChecklistModal = (focusId) => {
    if (!checklistList) return;
    const items = loadChecklistItems();
    checklistList.innerHTML = "";
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = `checklist-item${item.done ? " is-done" : ""}`;
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(item.done);
      checkbox.addEventListener("change", () => {
        const updated = loadChecklistItems().map((entry) =>
          entry.id === item.id ? { ...entry, done: checkbox.checked } : entry,
        );
        saveChecklistItems(updated);
        renderChecklistModal(item.id);
        updateChecklistBadge();
      });
      const input = document.createElement("input");
      input.className = "checklist-input";
      input.value = item.label || "";
      input.addEventListener("change", () => {
        const updated = loadChecklistItems().map((entry) =>
          entry.id === item.id ? { ...entry, label: input.value.trim() } : entry,
        );
        saveChecklistItems(updated);
        updateChecklistBadge();
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") input.blur();
      });
      const actions = document.createElement("div");
      actions.className = "checklist-actions";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "checklist-icon";
      editBtn.innerHTML = '<i data-lucide="pencil"></i>';
      editBtn.addEventListener("click", () => input.focus());
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "checklist-icon";
      deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
      deleteBtn.addEventListener("click", () => {
        const updated = loadChecklistItems().filter((entry) => entry.id !== item.id);
        saveChecklistItems(updated);
        renderChecklistModal();
      });
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      row.appendChild(checkbox);
      row.appendChild(input);
      row.appendChild(actions);
      checklistList.appendChild(row);
      if (focusId && focusId === item.id) {
        setTimeout(() => input.focus(), 0);
      }
    });
    if (window.lucide) window.lucide.createIcons();
  };

  if (historyModalClose && historyModal) {
    historyModalClose.addEventListener("click", () => historyModal.classList.remove("is-open"));
  }

  const plannerHistoryOpen = document.getElementById("planner-history-open");
  if (plannerHistoryOpen && historyPanel) {
    plannerHistoryOpen.addEventListener("click", () => {
      const historyTimeline = document.getElementById("timeline");
      const historyWeekGrid = document.getElementById("week-grid");
      const historyBacklog = document.querySelector(".bronze-backlog");
      const willShow = historyPanel.classList.contains("is-hidden");
      historyPanel.classList.toggle("is-hidden", !willShow);
      if (willShow) {
        renderPlannerHistory();
        if (historyTimeline) historyTimeline.classList.add("is-hidden");
        if (historyWeekGrid) historyWeekGrid.classList.add("is-hidden");
        if (historyBacklog) historyBacklog.classList.add("is-hidden");
      } else {
        if (historyBacklog) historyBacklog.classList.remove("is-hidden");
        if (historyTimeline) historyTimeline.classList.toggle("is-hidden", !document.getElementById("view-day")?.classList.contains("is-active"));
        if (historyWeekGrid) historyWeekGrid.classList.toggle("is-hidden", !document.getElementById("view-week")?.classList.contains("is-active"));
      }
    });
  }

  if (notesToggle && checklistModal) {
    notesToggle.addEventListener("click", () => {
      renderChecklistModal();
      checklistModal.classList.add("is-open");
    });
  }
  if (checklistClose && checklistModal) {
    checklistClose.addEventListener("click", () => checklistModal.classList.remove("is-open"));
  }
  if (checklistModal) {
    checklistModal.addEventListener("click", (event) => {
      if (event.target === checklistModal) checklistModal.classList.remove("is-open");
    });
  }
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target !== modal) return;
      if (modal.id === "tree-edit-modal") {
        closeTreeEditor();
        return;
      }
      if (modal.id === "arena-modal") {
        closeArenaModal();
        return;
      }
      if (modal.id === "bronze-modal") {
        closeBronzeModal();
        return;
      }
      modal.classList.remove("is-open");
      modal.classList.remove("is-editing", "is-icon-editing");
    });
  });
  if (checklistAdd) {
    checklistAdd.addEventListener("click", () => {
      const items = loadChecklistItems();
      const id = crypto.randomUUID();
      const updated = [...items, { id, label: "Nova tarefa", done: false }];
      saveChecklistItems(updated);
      renderChecklistModal(id);
    });
  }
  if (checklistOk && checklistModal) {
    checklistOk.addEventListener("click", () => checklistModal.classList.remove("is-open"));
  }
  const dayPrev = document.getElementById("day-prev");
  const dayNext = document.getElementById("day-next");
  if (dayPrev) dayPrev.addEventListener("click", () => setPlannerDayOffset(plannerDayOffset - 1));
  if (dayNext) dayNext.addEventListener("click", () => setPlannerDayOffset(plannerDayOffset + 1));
  const plannerLayout = document.querySelector(".planner-layout");
  let touchStartX = 0;
  let touchStartY = 0;
  if (plannerLayout) {
    plannerLayout.addEventListener("touchstart", (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    });
    plannerLayout.addEventListener("touchend", (event) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      if (deltaX < 0) {
        setPlannerDayOffset(plannerDayOffset + 1);
      } else {
        setPlannerDayOffset(plannerDayOffset - 1);
      }
    });
  }
  const viewDay = document.getElementById("view-day");
  const viewWeek = document.getElementById("view-week");
  const timeline = document.getElementById("timeline");
  const bronzeBacklog = document.querySelector(".bronze-backlog");
  const weekGrid = document.getElementById("week-grid");
  const setView = (mode) => {
    if (viewDay && viewWeek) {
      viewDay.classList.toggle("is-active", mode === "day");
      viewWeek.classList.toggle("is-active", mode === "week");
    }
    if (historyPanel) historyPanel.classList.add("is-hidden");
    if (plannerLayout) plannerLayout.classList.remove("week-view");
    if (timeline) timeline.classList.toggle("is-hidden", mode !== "day");
    if (bronzeBacklog) bronzeBacklog.classList.remove("is-hidden");
    if (weekGrid) weekGrid.classList.toggle("is-hidden", mode !== "week");
  };
  if (viewDay) viewDay.addEventListener("click", () => setView("day"));
  if (viewWeek) viewWeek.addEventListener("click", () => setView("week"));
  setView("day");

  if (bronzeBacklog) {
    bronzeBacklog.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    bronzeBacklog.addEventListener("drop", (event) => {
      event.preventDefault();
      const payload = event.dataTransfer?.getData("text/plain");
      if (!payload || !payload.startsWith("bronze:")) return;
      const actionId = payload.replace("bronze:", "");
      const planner = loadPlanner();
      const updated = planner.bronzeActions.map((action) => {
        if (action.id !== actionId) return action;
        if (action.status === "done") updateArenaCountsForBronze(action.arenaId, -1);
        return {
          ...action,
          status: "backlog",
          scheduledHour: undefined,
          scheduledMinute: undefined,
          scheduledDayOffset: undefined,
          completedAt: undefined,
          locked: false,
        };
      });
      savePlanner({ ...planner, bronzeActions: updated });
      renderPlanner();
      checkMissionProgress();
    });
  }
};

const initClock = () => {
  const clock = document.getElementById("hud-clock");
  const dateLabel = document.getElementById("hud-date");
  if (!clock) return;
  const tick = () => {
    clock.textContent = nowClock();
    if (dateLabel) dateLabel.textContent = formatHudDate();
  };
  tick();
  setInterval(tick, 1000);
};

const initMoodBar = () => {
  const bar = document.querySelector(".integrity-bar");
  const modal = document.getElementById("mood-modal");
  const close = document.getElementById("mood-close");
  const save = document.getElementById("mood-save");
  const range = document.getElementById("mood-range");
  const label = document.getElementById("mood-label");
  if (!bar || !modal || !range || !label) return;
  const moods = [
    {
      label: "Vergonha",
      min: 0,
      max: 5,
      color: "linear-gradient(90deg, #6b1e1e, #8b2b2b)",
      trackStart: "#6b1e1e",
      trackEnd: "#8b2b2b",
    },
    {
      label: "Culpa",
      min: 5,
      max: 10,
      color: "linear-gradient(90deg, #8b3b1e, #a24a22)",
      trackStart: "#8b3b1e",
      trackEnd: "#a24a22",
    },
    {
      label: "Apatia",
      min: 10,
      max: 15,
      color: "linear-gradient(90deg, #b35a1e, #c46a22)",
      trackStart: "#b35a1e",
      trackEnd: "#c46a22",
    },
    {
      label: "Tristeza",
      min: 15,
      max: 20,
      color: "linear-gradient(90deg, #d47a1e, #e28b2a)",
      trackStart: "#d47a1e",
      trackEnd: "#e28b2a",
    },
    {
      label: "Medo",
      min: 20,
      max: 25,
      color: "linear-gradient(90deg, #e2a43a, #f0b84a)",
      trackStart: "#e2a43a",
      trackEnd: "#f0b84a",
    },
    {
      label: "Desejo",
      min: 25,
      max: 30,
      color: "linear-gradient(90deg, #e6c14a, #f0d35a)",
      trackStart: "#e6c14a",
      trackEnd: "#f0d35a",
    },
    {
      label: "Raiva",
      min: 30,
      max: 35,
      color: "linear-gradient(90deg, #d48a2a, #e49c3a)",
      trackStart: "#d48a2a",
      trackEnd: "#e49c3a",
    },
    {
      label: "Orgulho",
      min: 35,
      max: 45,
      color: "linear-gradient(90deg, #c6b83a, #d8cf4a)",
      trackStart: "#c6b83a",
      trackEnd: "#d8cf4a",
    },
    {
      label: "Coragem",
      min: 45,
      max: 55,
      color: "linear-gradient(90deg, #8fcf3a, #a6e34a)",
      trackStart: "#8fcf3a",
      trackEnd: "#a6e34a",
    },
    {
      label: "Neutralidade",
      min: 55,
      max: 60,
      color: "linear-gradient(90deg, #4fbf6a, #62d07a)",
      trackStart: "#4fbf6a",
      trackEnd: "#62d07a",
    },
    {
      label: "Disposicao",
      min: 60,
      max: 65,
      color: "linear-gradient(90deg, #3dbf8a, #50d09c)",
      trackStart: "#3dbf8a",
      trackEnd: "#50d09c",
    },
    {
      label: "Aceitacao",
      min: 65,
      max: 70,
      color: "linear-gradient(90deg, #2bb3b3, #3ac6c6)",
      trackStart: "#2bb3b3",
      trackEnd: "#3ac6c6",
    },
    {
      label: "Razao",
      min: 70,
      max: 75,
      color: "linear-gradient(90deg, #2a7bd4, #3a93e6)",
      trackStart: "#2a7bd4",
      trackEnd: "#3a93e6",
    },
    {
      label: "Amor",
      min: 75,
      max: 85,
      color: "linear-gradient(90deg, #3c5bff, #5a79ff)",
      trackStart: "#3c5bff",
      trackEnd: "#5a79ff",
    },
    {
      label: "Alegria",
      min: 85,
      max: 90,
      color: "linear-gradient(90deg, #6a3dff, #8a5bff)",
      trackStart: "#6a3dff",
      trackEnd: "#8a5bff",
    },
    {
      label: "Paz",
      min: 90,
      max: 95,
      color: "linear-gradient(90deg, #7a2fd1, #943de0)",
      trackStart: "#7a2fd1",
      trackEnd: "#943de0",
    },
    {
      label: "Iluminacao",
      min: 95,
      max: 101,
      color: "linear-gradient(90deg, #b227b5, #d06ad8)",
      trackStart: "#b227b5",
      trackEnd: "#d06ad8",
    },
  ];
  const resolveMood = (value) => getMoodMeta(value);
  const updateMoodTrack = (value, mood) => {
    const clamped = Math.max(0, Math.min(100, value));
    range.style.background = `linear-gradient(90deg, ${mood.trackStart} 0%, ${mood.trackEnd} ${clamped}%, rgba(255, 255, 255, 0.12) ${clamped}%, rgba(255, 255, 255, 0.12) 100%)`;
  };
  const applyMoodPreview = (value) => {
    const mood = resolveMood(value);
    label.textContent = mood.label;
    updateProfileMoodDisplay({ moodLevel: value, moodColor: mood.color });
    updateMoodTrack(value, mood);
    updateIntegrityBar();
  };
  const applyMoodCommit = (value) => {
    const mood = resolveMood(value);
    const profile = loadProfile();
    const updated = { ...profile, moodLevel: value, moodColor: mood.color };
    saveProfile(updated);
    updateProfileMoodDisplay(updated);
    updateMoodTrack(value, mood);
    updateIntegrityBar();
  };
  let pendingValue = null;
  bar.addEventListener("click", () => {
    const profile = loadProfile();
    const current = Number(profile.moodLevel);
    const nextValue = Number.isNaN(current) ? 50 : current;
    pendingValue = nextValue;
    range.value = nextValue;
    applyMoodPreview(nextValue);
    modal.classList.add("is-open");
  });
  range.addEventListener("input", () => {
    const nextValue = Number(range.value);
    pendingValue = nextValue;
    applyMoodPreview(nextValue);
  });
  if (save) {
    save.addEventListener("click", () => {
      const nextValue = Number.isFinite(pendingValue) ? pendingValue : Number(range.value || 0);
      applyMoodCommit(nextValue);
      modal.classList.remove("is-open");
      pendingValue = null;
    });
  }
  if (close) {
    close.addEventListener("click", () => {
      const profile = loadProfile();
      const current = Number(profile.moodLevel);
      const nextValue = Number.isNaN(current) ? 50 : current;
      range.value = nextValue;
      applyMoodPreview(nextValue);
      modal.classList.remove("is-open");
      pendingValue = null;
    });
  }
};

let appInitialized = false;
let offlineFallback = false;
let guestMode = !DISABLE_LOCAL_STORAGE && safeLocalGet("game_of_life.guest") === "true";

const initApp = () => {
  if (appInitialized) return;
  appInitialized = true;
  ensureV2Reset();
  const initialProfile = loadProfile();
  migratePlayerData();
  applyTheme(initialProfile.theme || "gold");
  if (initialProfile.status === "oracle") {
    applyOracleStatus();
  } else {
    document.documentElement.dataset.status = "sovereign";
  }
  applyHiatoIfNeeded();
  initClock();
  initMoodBar();
  initNav();
  renderTree();
  initPlanner();
  initConfig();
  renderArenas();
  renderSocial();
  initSocialSearch();
  applyGlitch();
  if (!isSupabaseEnabled()) {
    showMissionsLoading(false);
    missionState = loadMissionStateLocal();
    renderInitiationOverlay();
    checkMissionProgress();
  } else {
    showMissionsLoading(true);
    withTimeout(fetchMissionState(), 3000, "user_missions")
      .then((state) => {
        missionState = { ...defaultMissionState(), ...(state || {}) };
        saveMissionStateLocal(missionState);
        renderInitiationOverlay();
        checkMissionProgress();
      })
      .catch((error) => {
        logSupabaseError("fetchMissionState.timeout", error);
        bypassInitiation = true;
        missionState = loadMissionStateLocal();
        renderInitiationOverlay();
      })
      .finally(() => {
        showMissionsLoading(false);
      });
    withTimeout(fetchVitalityLogs(), 3000, "action_logs")
      .then((logs) => {
        vitalityLogs = logs;
        renderTree();
      })
      .catch((error) => {
        logSupabaseError("fetchVitalityLogs.timeout", error);
      });
  }
  if (window.lucide) window.lucide.createIcons();
  const hiatoAck = document.getElementById("hiato-ack");
  if (hiatoAck) {
    hiatoAck.addEventListener("click", () => {
      clearHiato();
    });
  }
  const arenaAdd = document.getElementById("arena-add");
  const arenaDossierOk = document.getElementById("arena-dossier-ok");
  const arenaDossierOkModal = document.getElementById("arena-dossier");
  if (arenaAdd) {
    arenaAdd.addEventListener("click", () => {
      openArenaModal();
    });
  }
  if (arenaDossierOk && arenaDossierOkModal) {
    arenaDossierOk.addEventListener("click", () => {
      if (arenaDossierOkModal.classList.contains("is-editing")) {
        const arenaId = arenaDossierOkModal.dataset.arenaId;
        if (!arenaId) return;
        const titleInput = document.getElementById("arena-dossier-title-input");
        const descriptionInput = document.getElementById("arena-dossier-description-input");
        const assetSelect = document.getElementById("arena-dossier-asset");
        if (!titleInput || !descriptionInput || !assetSelect) return;
        const nextTitle = titleInput.value.trim();
        if (!nextTitle) return;
        const nextDescription = descriptionInput.value.trim();
        const nextAssetId = assetSelect.value;
        const nextIcon =
          arenaDossierOkModal.dataset.icon || ICON_BY_ID[nextAssetId] || "circle";
        const arenas = loadArenas();
        const updated = arenas.map((arena) =>
          arena.id === arenaId
            ? {
                ...arena,
                title: nextTitle,
                description: nextDescription,
                assetId: nextAssetId,
                icon: nextIcon,
              }
            : arena,
        );
        saveArenas(updated);
        renderArenas();
        openArenaDossier(arenaId);
        arenaDossierOkModal.classList.remove("is-editing", "is-icon-editing");
        return;
      }
      arenaDossierOkModal.classList.remove("is-open");
    });
  }
  const arenaList = document.getElementById("arena-list");
  if (arenaList) {
    arenaList.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    arenaList.addEventListener("drop", (event) => {
      event.preventDefault();
      const payload = event.dataTransfer?.getData("text/plain");
      if (!payload || !payload.startsWith("bronze:")) return;
      const actionId = payload.replace("bronze:", "");
      const planner = loadPlanner();
      const updated = planner.bronzeActions.map((action) => {
        if (action.id !== actionId) return action;
        return {
          ...action,
          status: "backlog",
          scheduledHour: undefined,
          scheduledMinute: undefined,
          scheduledDayOffset: undefined,
        };
      });
      savePlanner({ ...planner, bronzeActions: updated });
      renderPlanner();
    });
  }
  const arenaSave = document.getElementById("arena-save");
  const arenaCancel = document.getElementById("arena-cancel");
  if (arenaCancel) {
    arenaCancel.addEventListener("click", closeArenaModal);
  }
  if (arenaSave) {
    arenaSave.addEventListener("click", () => {
      const titleInput = document.getElementById("arena-title");
      const assetSelect = document.getElementById("arena-asset");
      const addBronze = document.getElementById("arena-add-bronze");
      const descriptionInput = document.getElementById("arena-description");
      const modal = document.getElementById("arena-modal");
      if (!titleInput || !assetSelect || !descriptionInput || !modal) return;
      const title = titleInput.value.trim();
      if (!title) return;
      const description = descriptionInput.value.trim();
      const icon = modal.dataset.icon || ICON_BY_ID[assetSelect.value] || "";
      const arenas = loadArenas();
      const newArena = {
        id: crypto.randomUUID(),
        title,
        completion: 0,
        assetId: assetSelect.value,
        targetCount: null,
        completedCount: 0,
        description,
        icon,
      };
      arenas.push(newArena);
      saveArenas(arenas);
      renderArenas();
      closeArenaModal();
      checkMissionProgress();
      if (addBronze?.checked) {
        openBronzeModal(newArena.id);
      }
    });
  }

  const bronzeSave = document.getElementById("bronze-save");
  const bronzeCancel = document.getElementById("bronze-cancel");
  if (bronzeCancel) {
    bronzeCancel.addEventListener("click", closeBronzeModal);
  }
  if (bronzeSave) {
    bronzeSave.addEventListener("click", () => {
      const modal = document.getElementById("bronze-modal");
      const titleInput = document.getElementById("bronze-title");
      const durationInput = document.getElementById("bronze-duration");
      const seriousToggle = document.getElementById("bronze-serious");
      const atemporalToggle = document.getElementById("bronze-atemporal");
      const weeklyCountInput = document.getElementById("bronze-weekly-count");
      const postponableToggle = document.getElementById("bronze-postponable");
      if (!modal || !durationInput || !seriousToggle || !titleInput) return;
      const arenaId = modal.dataset.arenaId;
      if (!arenaId) return;
      const title = titleInput.value.trim();
      if (!title) return;
      const durationMinutes = Number(durationInput.value || 60);
      const duration = `${durationMinutes}min`;
      const selectedIcon = modal.dataset.icon || BRONZE_ICONS[0];
      const weekdays = Array.from(
        modal.querySelectorAll(".weekday-grid input[type='checkbox']")
      )
        .filter((input) => input.checked)
        .map((input) => input.value);
      const atemporal = !!atemporalToggle?.checked;
      const isPostponable = !!postponableToggle?.checked;
      const rawWeeklyCount = weeklyCountInput ? Number(weeklyCountInput.value) : 0;
      const countValue = Number.isFinite(rawWeeklyCount) && rawWeeklyCount > 0 ? rawWeeklyCount : 0;
      const weeklyTarget = atemporal ? null : countValue > 0 ? countValue : weekdays.length;
      const finalWeekdays = atemporal || countValue > 0 ? [] : weekdays;
      const planner = loadPlanner();
      const editingId = modal.dataset.actionId;
      if (editingId) {
        planner.bronzeActions = planner.bronzeActions.map((action) =>
          action.id === editingId
            ? {
                ...action,
                title,
                icon: selectedIcon,
                duration,
                durationMinutes,
                weekdays: finalWeekdays,
                atemporal,
                isPostponable,
                weeklyTarget,
                serious: !!seriousToggle.checked,
              }
            : action,
        );
      } else {
        planner.bronzeActions.push({
          id: crypto.randomUUID(),
          arenaId,
          title,
          icon: selectedIcon,
          duration,
          durationMinutes,
          weekdays: finalWeekdays,
          atemporal,
          isPostponable,
          weeklyTarget,
          serious: !!seriousToggle.checked,
          status: "backlog",
          locked: false,
          createdDate: new Date().toISOString(),
        });
      }
      savePlanner(planner);
      renderPlanner();
      renderArenas();
      const arenaDossier = document.getElementById("arena-dossier");
      if (arenaDossier?.classList.contains("is-open")) {
        openArenaDossier(arenaId);
      }
      closeBronzeModal();
      checkMissionProgress();
    });
  }

  const bronzeDuration = document.getElementById("bronze-duration");
  const bronzeDurationValue = document.getElementById("bronze-duration-value");
  if (bronzeDuration && bronzeDurationValue) {
    const formatDuration = (minutes) => {
      const total = Math.max(0, Math.round(Number(minutes) || 0));
      const hours = Math.floor(total / 60);
      const mins = total % 60;
      if (hours && mins) return `${hours}h ${mins}m`;
      if (hours) return `${hours}h`;
      return `${mins}m`;
    };
    bronzeDuration.addEventListener("input", () => {
      bronzeDurationValue.textContent = formatDuration(bronzeDuration.value);
      const picker = bronzeDuration.closest(".time-picker");
      if (picker) picker.classList.add("has-value");
      const min = Number(bronzeDuration.min || 0);
      const max = Number(bronzeDuration.max || 100);
      const value = Number(bronzeDuration.value || 0);
      const percent = max > min ? (value - min) / (max - min) : 0;
      bronzeDurationValue.style.left = `calc(${(percent * 100).toFixed(2)}% + 0px)`;
    });
  }
  const bronzeWeeklyCount = document.getElementById("bronze-weekly-count");
  const bronzeWeeklyCountValue = document.getElementById("bronze-weekly-count-value");
  if (bronzeWeeklyCount && bronzeWeeklyCountValue) {
    bronzeWeeklyCount.addEventListener("input", () => {
      bronzeWeeklyCountValue.textContent = `${bronzeWeeklyCount.value}x`;
      const picker = bronzeWeeklyCount.closest(".time-picker");
      if (picker) {
        picker.classList.toggle("has-value", Number(bronzeWeeklyCount.value || 0) > 0);
      }
      const min = Number(bronzeWeeklyCount.min || 0);
      const max = Number(bronzeWeeklyCount.max || 100);
      const value = Number(bronzeWeeklyCount.value || 0);
      const percent = max > min ? (value - min) / (max - min) : 0;
      bronzeWeeklyCountValue.style.left = `calc(${(percent * 100).toFixed(2)}% + 0px)`;
    });
  }
  const bronzeSerious = document.getElementById("bronze-serious");
  const bronzeModal = document.getElementById("bronze-modal");
  if (bronzeSerious && bronzeModal) {
    bronzeSerious.addEventListener("change", () => {
      const card = bronzeModal.querySelector(".bronze-card-elite");
      if (!card) return;
      card.classList.toggle("serious-on", bronzeSerious.checked);
    });
  }

  const arenaDossierClose = document.getElementById("arena-dossier-back");
  const arenaDossier = document.getElementById("arena-dossier");
  if (arenaDossierClose && arenaDossier) {
    arenaDossierClose.addEventListener("click", () => {
      playMetalClick();
      arenaDossier.classList.remove("is-open");
    });
  }
  const arenaDossierEditMeta = document.getElementById("arena-dossier-edit-meta");
  const arenaDossierEditBtn = document.getElementById("arena-dossier-edit");
  const toggleArenaDossierEdit = () => {
    const arenaId = arenaDossier?.dataset.arenaId;
    if (!arenaId || !arenaDossier) return;
    const nextEditing = !arenaDossier.classList.contains("is-editing");
    if (nextEditing) {
      openArenaDossier(arenaId);
    }
    arenaDossier.classList.toggle("is-editing", nextEditing);
    if (!nextEditing) arenaDossier.classList.remove("is-icon-editing");
  };
  if (arenaDossierEditMeta && arenaDossier) {
    arenaDossierEditMeta.addEventListener("click", toggleArenaDossierEdit);
  }
  if (arenaDossierEditBtn && arenaDossier) {
    arenaDossierEditBtn.addEventListener("click", toggleArenaDossierEdit);
  }
  const avatar = document.getElementById("hud-avatar");
  const profileModal = document.getElementById("profile-modal");
  const profileClose = document.getElementById("profile-close");
  const profileIdentity = document.getElementById("profile-identity");
  const profileThemeButtons = document.querySelectorAll(".profile-theme-btn");
  const profileNameDisplay = document.getElementById("profile-name-display");
  const profileBannerDisplay = document.getElementById("profile-banner-display");
  const profileStrip = document.getElementById("profile-strip");
  const widgetGrid = document.getElementById("widget-grid");
  const profileLevel = document.getElementById("profile-level");
  const profileEdit = document.getElementById("profile-edit");
  const profileSave = document.getElementById("profile-save");
  const profileSync = document.getElementById("profile-sync");
  const profileAvatarFile = document.getElementById("profile-avatar-file");
  const profileAddFriend = document.getElementById("profile-add-friend");
  const hudEdit = document.getElementById("hud-edit");
  const profileCard = profileModal?.querySelector(".profile-card");
  if (avatar && profileModal) {
    avatar.addEventListener("click", () => {
      let profile = loadProfile();
      const dna = seedDNAIfMissing();
      const total = dna.assets.reduce((sum, asset) => sum + Number(asset.level || 0), 0);
      if (profileLevel) profileLevel.textContent = String(Math.round(total));
      if (profileIdentity) {
        profileIdentity.value = profile.userId || profile.nickname || "";
      }
      if (profileNameDisplay) {
        profileNameDisplay.textContent = profile.nickname || profile.userId || "-";
      }
      const bannerWrap = profileModal.querySelector(".profile-banner");
      applyProfileBannerVisuals(profile.banner || "GM", profileBannerDisplay, bannerWrap, profileStrip);
      updateProfileMoodDisplay(profile);
      if (profile.avatar) {
        const profileAvatar = profileModal.querySelector(".profile-avatar");
        if (profileAvatar) profileAvatar.style.backgroundImage = `url(${profile.avatar})`;
      }
      if (profileCard) profileCard.classList.remove("is-npc");
      if (profileCard) profileCard.classList.remove("is-external");
      if (profileIdentity) profileIdentity.readOnly = false;
      if (profileModal) {
        const cardTheme = profile.profileCardTheme || "gold";
        const borderTheme = profile.profileBorderTheme || cardTheme;
        profileModal.dataset.card = cardTheme;
        profileModal.dataset.border = borderTheme;
      }
      if (profileCard) {
        const borderImage = profile.profileBorderImage || profile.playerData?.profileBorderImage || "";
        applyProfileBorderVisuals(borderImage, profileCard);
      }
      if (profileCard) profileCard.classList.remove("is-editing");
      discardProfileWidgetDraft();
      if (widgetGrid) renderProfileWidgetEditor(profile);
      renderProfileWidgetDisplay(profile, seedDNAIfMissing());
      profileModal.classList.add("is-open");
    });
  }
  if (hudEdit && profileModal) {
    hudEdit.addEventListener("click", () => {
      const profile = loadProfile();
      const dna = seedDNAIfMissing();
      const total = dna.assets.reduce((sum, asset) => sum + Number(asset.level || 0), 0);
      if (profileLevel) profileLevel.textContent = String(Math.round(total));
      renderProfileWidgetDisplay(profile, dna);
      updateProfileMoodDisplay(profile);
      if (profileCard) {
        const borderImage = profile.profileBorderImage || profile.playerData?.profileBorderImage || "";
        applyProfileBorderVisuals(borderImage, profileCard);
      }
      if (profileCard) profileCard.classList.remove("is-editing");
      profileModal.classList.add("is-open");
      if (profileIdentity) profileIdentity.focus();
    });
  }
  if (profileClose && profileModal) {
    profileClose.addEventListener("click", () => {
      profileModal.classList.remove("is-open");
      discardProfileWidgetDraft();
      if (profileCard) profileCard.classList.remove("is-npc");
      if (profileCard) profileCard.classList.remove("is-external");
      if (profileIdentity) profileIdentity.readOnly = false;
    });
  }
  if (profileEdit) {
    profileEdit.addEventListener("click", () => {
      if (!profileCard) return;
      profileCard.classList.toggle("is-editing");
      if (profileCard.classList.contains("is-editing")) {
        initProfileWidgetDraft(loadProfile());
        renderProfileWidgetEditor(loadProfile());
        if (profileIdentity) profileIdentity.focus();
      } else {
        discardProfileWidgetDraft();
        renderProfileWidgetDisplay(loadProfile(), seedDNAIfMissing());
      }
    });
  }

  if (profileSave) {
    profileSave.addEventListener("click", async () => {
      const current = loadProfile();
      const identity = profileIdentity?.value?.trim() || current.nickname || current.userId || "";
      const banner = current.banner || "";
      const cardTheme = profileModal?.dataset.card || current.profileCardTheme || "gold";
      let selectedGoldAssets = Array.isArray(current.widgets) ? current.widgets : [];
      let widgetsVisible = Array.isArray(current.widgetsVisible) ? current.widgetsVisible : [];
      if (profileWidgetDraft) {
        const draftWidgets = Array.isArray(profileWidgetDraft.widgets)
          ? profileWidgetDraft.widgets
          : [];
        const draftVisible = Array.isArray(profileWidgetDraft.widgetsVisible)
          ? profileWidgetDraft.widgetsVisible
          : [];
        const nextWidgets = [];
        const nextVisible = [];
        draftWidgets.forEach((slotId, index) => {
          if (!slotId) return;
          nextWidgets.push(slotId);
          nextVisible.push(draftVisible[index] !== false);
        });
        selectedGoldAssets = nextWidgets;
        widgetsVisible = nextVisible;
      }
      const updated = {
        ...current,
        nickname: identity,
        userId: identity,
        banner,
        profileCardTheme: cardTheme,
        widgets: selectedGoldAssets,
        widgetsVisible,
        selectedGoldAssets,
      };
      saveProfile(updated);
      renderSocial();
      if (profileNameDisplay) profileNameDisplay.textContent = updated.nickname || updated.userId || "-";
      const bannerWrap = profileModal?.querySelector(".profile-banner");
      applyProfileBannerVisuals(updated.banner || "", profileBannerDisplay, bannerWrap, profileStrip);
      if (profileSync) {
        profileSync.classList.remove("is-ok", "is-error");
        profileSync.textContent = isSupabaseEnabled() ? "Sincronizando..." : "Supabase nao configurado";
      }
      const okProfile = await ensureSupabaseProfile(updated);
      const okTotals = await syncProfileTotals(updated);
      if (profileSync) {
        if (okProfile && okTotals) {
          profileSync.classList.add("is-ok");
          profileSync.textContent = "Salvo no Supabase";
        } else {
          profileSync.classList.add("is-error");
          const detail = lastSupabaseError?.message || "Falha no Supabase";
          profileSync.textContent = detail.length > 48 ? `${detail.slice(0, 48)}...` : detail;
        }
      }
      discardProfileWidgetDraft();
      if (profileCard) profileCard.classList.remove("is-editing");
      if (profileModal) profileModal.classList.remove("is-open");
    });
  }

  if (profileAddFriend) {
    profileAddFriend.addEventListener("click", () => {
      if (!externalProfile) return;
      const current = getFriendList();
      if (current.find((f) => f.nickname === externalProfile.nickname)) return;
      saveFriendList([...current, externalProfile]);
      renderFriends();
    });
  }

  if (profileAvatarFile) {
    const avatarBox = profileModal?.querySelector(".profile-avatar");
    if (avatarBox) {
      avatarBox.addEventListener("click", () => {
        if (!profileModal?.classList.contains("is-editing")) return;
        profileAvatarFile.click();
      });
    }
    profileAvatarFile.addEventListener("change", () => {
      const file = profileAvatarFile.files?.[0];
      if (!file) return;
      uploadToSupabase(file, `avatars/${crypto.randomUUID()}`).then((url) => {
        if (url) {
          const profile = loadProfile();
          const updated = { ...profile, avatar: url };
          saveProfile(updated);
          const profileAvatar = profileModal?.querySelector(".profile-avatar");
          if (profileAvatar) profileAvatar.style.backgroundImage = `url(${url})`;
          renderSocial();
          syncProfileTotals(updated);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const profile = loadProfile();
          const updated = { ...profile, avatar: reader.result };
          saveProfile(updated);
          const profileAvatar = profileModal?.querySelector(".profile-avatar");
          if (profileAvatar) profileAvatar.style.backgroundImage = `url(${reader.result})`;
          renderSocial();
        };
        reader.readAsDataURL(file);
      });
    });
  }

  // Banner agora ├® escolhido pela lista (banner-modal).

  if (profileThemeButtons.length && profileModal) {
    profileThemeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const theme = btn.dataset.card || "gold";
        const profile = loadProfile();
        const borderTheme = profile.profileBorderTheme || theme;
        profileModal.dataset.card = theme;
        profileModal.dataset.border = borderTheme;
        saveProfile({ ...profile, profileCardTheme: theme, profileBorderTheme: borderTheme });
      });
    });
  }

  if (profileIdentity) {
    profileIdentity.addEventListener("change", () => {
      const value = profileIdentity.value.trim();
      const profile = loadProfile();
      const updated = { ...profile, nickname: value, userId: value };
      saveProfile(updated);
      ensureSupabaseProfile(updated);
      renderSocial();
    });
  }

  // Banner agora ├® escolhido pela lista (banner-modal).
  const allianceSearch = document.getElementById("alliance-search");
  if (allianceSearch) {
    allianceSearch.addEventListener("input", () => {
      renderSocial();
    });
  }

  const configIdentity = document.getElementById("config-identity");
  const configSaveProfile = document.getElementById("config-save-profile");
  const configLogout = document.getElementById("config-logout");
  const bannerModal = document.getElementById("banner-modal");
  const bannerClose = document.getElementById("banner-close");
  const bannerGrid = document.getElementById("banner-grid");
  const bannerOpen = document.getElementById("config-banners-open");
  const borderModal = document.getElementById("border-modal");
  const borderClose = document.getElementById("border-close");
  const profileBanner = document.querySelector(".profile-banner");
  const profileBannerEdit = document.getElementById("profile-banner-edit");
  const profileBorderEdit = document.getElementById("profile-border-edit");
  const configProfile = loadProfile();
  if (configIdentity) {
    configIdentity.value = configProfile.userId || configProfile.nickname || "";
    configIdentity.addEventListener("input", () => {
      const value = configIdentity.value.trim();
      const profile = loadProfile();
      saveProfile({ ...profile, nickname: value, userId: value });
    });
    configIdentity.addEventListener("change", () => {
      const value = configIdentity.value.trim();
      const profile = loadProfile();
      const updated = { ...profile, nickname: value, userId: value };
      saveProfile(updated);
      ensureSupabaseProfile(updated);
      renderSocial();
    });
  }
  const renderBanners = () => {
    if (!bannerGrid) return;
    const rewards = PROFILE_BANNER_LIBRARY.map((item) => ({
      ...item,
      requirement: "Disponivel",
    }));
    bannerGrid.innerHTML = "";
    rewards.forEach((reward) => {
      const card = document.createElement("div");
      card.className = `banner-card${reward.unlocked ? " is-unlocked" : ""}`;
      const preview = document.createElement("div");
      preview.className = "banner-preview";
      if (reward.imageUrl) {
        preview.style.backgroundImage = `url(${reward.imageUrl})`;
      } else {
        applyBannerClasses(preview, reward.title);
      }
      const title = document.createElement("div");
      title.className = "banner-title";
      title.textContent = reward.title;
      applyBannerClasses(title, reward.title);
      const req = document.createElement("div");
      req.className = "banner-requirement";
      req.textContent = reward.requirement;
      const btn = document.createElement("button");
      btn.className = "gold-button";
      btn.type = "button";
      btn.textContent = reward.unlocked ? "Aplicar" : "Bloqueado";
      btn.disabled = !reward.unlocked;
      btn.addEventListener("click", () => {
        const nextBanner = reward.imageUrl || reward.title;
        const updated = { ...loadProfile(), banner: nextBanner };
        saveProfile(updated);
        ensureSupabaseProfile(updated);
        syncProfileTotals(updated);
        renderSocial();
        const profileModal = document.getElementById("profile-modal");
        const bannerWrap = profileModal?.querySelector(".profile-banner");
        const profileStrip = document.getElementById("profile-strip");
        const bannerDisplay = document.getElementById("profile-banner-display");
        const bannerText = updated.banner || "";
        const isImageBanner = isImageReference(bannerText);
        if (bannerDisplay) bannerDisplay.textContent = isImageBanner ? "Banner Ativo" : bannerText || "GM";
        if (bannerWrap) bannerWrap.style.backgroundImage = isImageBanner ? `url(${bannerText})` : "";
        if (profileStrip) profileStrip.style.backgroundImage = "";
        if (bannerModal) bannerModal.classList.remove("is-open");
        if (profileModal) profileModal.classList.add("is-open");
        if (profileCard) profileCard.classList.add("is-editing");
      });
      card.appendChild(preview);
      card.appendChild(title);
      card.appendChild(req);
      card.appendChild(btn);
      bannerGrid.appendChild(card);
    });
    updateChecklistBadge();
  };
  const renderBorders = () => {
    const borderGrid = document.getElementById("border-grid");
    if (!borderGrid) return;
    const rewards = PROFILE_BORDER_LIBRARY.map((item) => ({
      ...item,
      requirement: "Disponivel",
    }));
    borderGrid.innerHTML = "";
    rewards.forEach((reward) => {
      const card = document.createElement("div");
      card.className = `border-card${reward.unlocked ? " is-unlocked" : ""}`;
      const preview = document.createElement("div");
      preview.className = "border-preview";
      if (reward.imageUrl) {
        preview.style.backgroundImage = `url(${reward.imageUrl})`;
      }
      const title = document.createElement("div");
      title.className = "banner-title";
      title.textContent = reward.title;
      const req = document.createElement("div");
      req.className = "banner-requirement";
      req.textContent = reward.requirement;
      const btn = document.createElement("button");
      btn.className = "gold-button";
      btn.type = "button";
      btn.textContent = reward.unlocked ? "Aplicar" : "Bloqueado";
      btn.disabled = !reward.unlocked;
      btn.addEventListener("click", () => {
        const nextBorder = reward.imageUrl || "";
        const current = loadProfile();
        const updated = {
          ...current,
          profileBorderImage: nextBorder,
          profileBorderTheme: current.profileBorderTheme || current.profileCardTheme || "gold",
        };
        saveProfile(updated);
        ensureSupabaseProfile(updated);
        syncProfileTotals(updated);
        renderSocial();
        applyProfileBorderVisuals(updated.profileBorderImage || "", profileCard);
        if (borderModal) borderModal.classList.remove("is-open");
        if (profileModal) profileModal.classList.add("is-open");
        if (profileCard) profileCard.classList.add("is-editing");
      });
      card.appendChild(preview);
      card.appendChild(title);
      card.appendChild(req);
      card.appendChild(btn);
      borderGrid.appendChild(card);
    });
  };
  renderBanners();
  renderBorders();
  if (bannerOpen && bannerModal) {
    bannerOpen.addEventListener("click", () => {
      renderBanners();
      bannerModal.classList.add("is-open");
    });
  }
  if (profileBannerEdit && bannerModal) {
    profileBannerEdit.addEventListener("click", () => {
      if (!profileCard?.classList.contains("is-editing")) return;
      renderBanners();
      bannerModal.classList.add("is-open");
    });
  }
  if (profileBanner && bannerModal) {
    profileBanner.addEventListener("click", () => {
      if (!profileCard?.classList.contains("is-editing")) return;
      renderBanners();
      bannerModal.classList.add("is-open");
    });
  }
  if (bannerClose && bannerModal) {
    bannerClose.addEventListener("click", () => bannerModal.classList.remove("is-open"));
  }
  if (profileBorderEdit && borderModal) {
    profileBorderEdit.addEventListener("click", () => {
      if (!profileCard?.classList.contains("is-editing")) return;
      renderBorders();
      borderModal.classList.add("is-open");
    });
  }
  if (borderClose && borderModal) {
    borderClose.addEventListener("click", () => borderModal.classList.remove("is-open"));
  }
  if (configSaveProfile) {
    configSaveProfile.addEventListener("click", async () => {
      configSaveProfile.classList.remove("is-saved");
      const profile = loadProfile();
      await ensureSupabaseProfile(profile);
      const ok = await syncProfileTotals(profile);
      if (ok) {
        configSaveProfile.classList.add("is-saved");
        setTimeout(() => configSaveProfile.classList.remove("is-saved"), 1200);
      }
    });
  }
  if (configLogout) {
    configLogout.addEventListener("click", async () => {
      guestMode = false;
      currentUserId = null;
      cachedProfile = null;
      cachedDNA = null;
      cachedPlanner = null;
      safeLocalRemove("game_of_life.guest");
      if (isSupabaseEnabled()) {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) logSupabaseError("auth.signOut", error);
        } catch (error) {
          logSupabaseError("auth.signOut", error);
        }
      }
      setAuthLocked(true);
    });
  }

  const themeButtons = document.querySelectorAll(".theme-btn");
  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.dataset.theme || "gold";
      applyTheme(theme);
      renderSocial();
    });
  });

  const configAvatarUpload = document.getElementById("config-avatar-upload");
  const configBannerUpload = document.getElementById("config-banner-upload");
  const configAvatarFile = document.getElementById("config-avatar-file");
  const configBannerFile = document.getElementById("config-banner-file");
  if (configAvatarUpload && configAvatarFile) {
    configAvatarUpload.addEventListener("click", () => configAvatarFile.click());
  }
  if (configBannerUpload && configBannerFile) {
    configBannerUpload.addEventListener("click", () => configBannerFile.click());
  }

  if (configAvatarFile) {
    configAvatarFile.addEventListener("change", async () => {
      const file = configAvatarFile.files?.[0];
      if (!file) return;
      let url = await uploadToSupabase(file, `avatars/${crypto.randomUUID()}`);
      if (!url) {
        const reader = new FileReader();
        reader.onload = () => {
          const profile = loadProfile();
          const updated = { ...profile, avatar: reader.result };
          saveProfile(updated);
          renderSocial();
        };
        reader.readAsDataURL(file);
        return;
      }
      const profile = loadProfile();
      saveProfile({ ...profile, avatar: url });
      renderSocial();
    });
  }

  if (configBannerFile) {
    configBannerFile.addEventListener("change", async () => {
      const file = configBannerFile.files?.[0];
      if (!file) return;
      let url = await uploadToSupabase(file, `banners/${crypto.randomUUID()}`);
      if (!url) {
        const reader = new FileReader();
        reader.onload = () => {
          const profile = loadProfile();
          const updated = { ...profile, banner: reader.result };
          saveProfile(updated);
          renderSocial();
        };
        reader.readAsDataURL(file);
        return;
      }
      const profile = loadProfile();
      saveProfile({ ...profile, banner: url });
      renderSocial();
    });
  }
  const treeCancel = document.getElementById("tree-edit-back");
  const treeEditOk = document.getElementById("tree-edit-ok");
  const treeEditEdit = document.getElementById("tree-edit-edit");
  if (treeCancel) {
    treeCancel.addEventListener("click", () => {
      playMetalClick();
      closeTreeEditor();
    });
  }
  if (treeEditOk) {
    treeEditOk.addEventListener("click", () => {
      playMetalClick();
      const modal = document.getElementById("tree-edit-modal");
      if (modal) modal.classList.remove("is-editing");
      const assetId = modal?.dataset.assetId;
      if (assetId) {
        const dna = seedDNAIfMissing();
        const savedAsset = applyTreeEditDraft(dna, assetId) || getAssetFromDNA(dna, assetId);
        if (savedAsset) {
          const lemaSlot = `${assetId}.lema`;
          const lemaValue = savedAsset?.profileSlots?.[lemaSlot]?.value;
          if (lemaValue) {
            const profile = loadProfile();
            saveProfile({
              ...profile,
              lemaUpdatedAt: new Date().toISOString(),
              lemaUpdatedAssetId: assetId,
            });
          }
          if (lemaValue && assetId === "conexao") {
            const profile = loadProfile();
            const updated = { ...profile, banner: lemaValue };
            saveProfile(updated);
            ensureSupabaseProfile(updated);
            syncProfileTotals(updated);
          }
        }
        renderTree();
        renderSocial();
        checkMissionProgress();
      }
      closeTreeEditor();
    });
  }
  if (treeEditEdit) {
    treeEditEdit.addEventListener("click", () => {
      const modal = document.getElementById("tree-edit-modal");
      if (!modal) return;
      const assetId = modal.dataset.assetId;
      if (!assetId) return;
      const dna = seedDNAIfMissing();
      const asset = getAssetFromDNA(dna, assetId);
      if (!asset) return;
      if (modal.classList.contains("is-editing")) {
        modal.classList.remove("is-editing");
        discardTreeEditDraft();
        renderTreeEditorSlots(dna, assetId);
        refreshTreeEditAddSlotButton(dna, asset);
        return;
      }
      initTreeEditDraft(asset);
      modal.classList.add("is-editing");
      renderTreeEditorSlots(dna, assetId);
      refreshTreeEditAddSlotButton(dna, asset);
      const list = document.getElementById("tree-slot-list");
      const first = list?.querySelector("input.profile-input");
      if (first) first.focus();
    });
  }
  window.addEventListener("storage", () => {
    renderTree();
    renderPlanner();
    renderArenas();
    renderSocial();
    applyGlitch();
  });
};

const startAppWithSplash = () => {
  const loading = document.getElementById("loading-screen");
  const buildMeta = document.querySelector('meta[name="gol-build"]')?.getAttribute("content") || "dev";
  const buildStamp = document.getElementById("build-stamp");
  if (buildStamp) buildStamp.textContent = `build ${buildMeta}`;
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    if (loading) loading.remove();
    initAuth();
  };
  if (!loading) {
    start();
    return;
  }
  setTimeout(() => {
    loading.classList.add("fade-out");
  }, 3000);
  loading.addEventListener("transitionend", () => {
    start();
  });
  setTimeout(() => {
    start();
  }, 3600);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startAppWithSplash);
} else {
  startAppWithSplash();
}
