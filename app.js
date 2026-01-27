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
const HOLD_DURATION_MS = 2500;

const SEPHIROT = [
  { id: "conexao", label: "CONSCIÊNCIA", row: 1, col: 2 },
  { id: "mente", label: "ESPAÇO MENTAL", row: 2, col: 1 },
  { id: "espiritualidade", label: "ESPIRITUALIDADE", row: 2, col: 3 },
  { id: "verdade", label: "PROPÓSITO", row: 3, col: 1 },
  { id: "inspiracao", label: "PROJETOS", row: 3, col: 3 },
  { id: "amor", label: "CONEXÕES", row: 4, col: 2 },
  { id: "trabalho", label: "TRABALHO/ESTUDOS", row: 5, col: 1 },
  { id: "abundancia", label: "FINANÇAS", row: 5, col: 3 },
  { id: "autenticidade", label: "HOBBIES", row: 6, col: 2 },
  { id: "fisico", label: "FÍSICO", row: 7, col: 2 },
];

const LABEL_BY_ID = new Map(SEPHIROT.map((asset) => [asset.id, asset.label]));
const ICON_BY_ID = {
  fisico: "dumbbell",
  mente: "brain",
  espiritualidade: "sparkles",
  verdade: "target",
  inspiracao: "briefcase",
  amor: "users",
  abundancia: "wallet",
  trabalho: "book-open",
  autenticidade: "gamepad-2",
  conexao: "crown",
};
const BRONZE_ICONS = ["dumbbell", "book", "code", "dollar-sign", "flame", "leaf", "coffee", "music"];
const ALLIANCE_MOCK = ["@vitali", "@nyx", "@atlas", "@onyx"];
const SLOT_ICON_BY_ID = {
  "abundancia.ativo1": "car",
  "abundancia.ativo2": "building-2",
  "abundancia.ativo3": "briefcase",
  "trabalho.pec": "badge-check",
  "trabalho.unip": "graduation-cap",
  "trabalho.personal": "dumbbell",
};
const MASTERY_PHRASES = {
  conexao: [
    "Nível 1: Sinto-me totalmente desconectado; a vida é um caos sem propósito.",
    "Nível 2: Raramente percebo beleza ou ordem; sinto-me isolado.",
    "Nível 3: Às vezes sinto uma breve gratidão, mas o ceticismo domina.",
    "Nível 4: Começo a praticar gratidão, mas ainda me sinto v├¡tima das circunst├óncias.",
    "Nível 5: Pratico a gratidão diariamente e percebo as primeiras sincronicidades.",
    "Nível 6: Sinto uma conexão frequente com a natureza e com o fluxo da vida.",
    "Nível 7: Confio no processo da vida; a gratidão é um estado quase constante.",
    "Nível 8: Percebo a interconexão entre todos os eventos e pessoas.",
    "Nível 9: Vivo em harmonia com as leis universais; paz profunda e duradoura.",
    "Nível 10: Estado de presença absoluta; sinto a Unidade com o Todo em cada respiração.",
  ],
  espiritualidade: [
    "Nível 1: Sem qualquer pr├ítica ou crença; vazio espiritual absoluto.",
    "Nível 2: Curiosidade vaga, mas sem disciplina ou rituais.",
    "Nível 3: Pratico rituais espor├ídicos quando estou em crise.",
    "Nível 4: Tenho um altar ou espaço, mas raramente o utilizo com foco.",
    "Nível 5: Rituais semanais estabelecidos; sinto o despertar da intuição.",
    "Nível 6: Pr├ítica di├íria constante; sinto proteção e orientação espiritual.",
    "Nível 7: Meus rituais são minha ├óncora; di├ílogo fluido com o sagrado.",
    "Nível 8: Intuição aguçada; recebo orientaçõeses claras através de rituais.",
    "Nível 9: Vida consagrada; cada ação é um ato de conexão espiritual.",
    "Nível 10: Mestria espiritual; canalização direta e comunhão ininterrupta.",
  ],
  mente: [
    "Nível 1: Mente barulhenta, ansiosa e imposs├¡vel de controlar.",
    "Nível 2: Pensamentos negativos dominam; sono perturbado pelo estresse.",
    "Nível 3: Tento meditar, mas me distraio em segundos; foco muito baixo.",
    "Nível 4: Consigo momentos breves de silèncio, mas a ansiedade retorna r├ípido.",
    "Nível 5: Meditação di├íria de 10 min; começo a observar os pensamentos.",
    "Nível 6: Capacidade de manter o foco por per├¡odos longos; mente clara.",
    "Nível 7: Dom├¡nio sobre as reaçõeses emocionais; paz mental resiliente.",
    "Nível 8: Estado de Flow acessado ├á vontade; alta clareza cognitiva.",
    "Nível 9: Silèncio interior profundo; a mente é uma ferramenta perfeitamente afiada.",
    "Nível 10: Equanimidade absoluta; consciència pura acima de qualquer turbulència.",
  ],
  verdade: [
    "Nível 1: Não sei quem sou; vivo baseado nas expectativas dos outros.",
    "Nível 2: Evito olhar para minhas sombras; minto para mim mesmo com frequència.",
    "Nível 3: Sinto que algo est├í errado, mas tenho medo de olhar para dentro.",
    "Nível 4: Começo a identificar meus padrõeses, mas ainda me autossaboto.",
    "Nível 5: Honestidade constante sobre minhas falhas; busca ativa por verdade.",
    "Nível 6: Clareza sobre meu MTP (Propósito Transformativo Massivo).",
    "Nível 7: Integridade total entre pensamento, palavra e ação.",
    "Nível 8: Conhecimento profundo da própria psique e arquétipos.",
    "Nível 9: Sabedoria pessoal cristalizada; vivo minha verdade sem medo.",
    "Nível 10: Alinhamento supremo; minha identidade é um reflexo do meu destino.",
  ],
  inspiracao: [
    "Nível 1: Sem sonhos ou projetos; a vida é uma repetição monótona.",
    "Nível 2: Tenho ideias, mas nunca começo nada por medo do fracasso.",
    "Nível 3: Começo projetos, mas desisto na primeira dificuldade.",
    "Nível 4: Trabalho em projetos, mas sem consistència ou visão clara.",
    "Nível 5: Um projeto ativo e consistente; criatividade fluindo semanalmente.",
    "Nível 6: Criatividade estratégica; executo ideias com eficiència.",
    "Nível 7: Projetos geram impacto real; sinto-me inspirado diariamente.",
    "Nível 8: Magnetismo criativo; ideias e recursos convergem para mim.",
    "Nível 9: Legado em construção; meus projetos expressam minha essència.",
    "Nível 10: Gènio criativo; canalização ininterrupta de inovação e beleza.",
  ],
  amor: [
    "Nível 1: Relacionamentos tóxicos ou isolamento total com rancor.",
    "Nível 2: Dificuldade em confiar; sinto-me carente ou defensivo.",
    "Nível 3: Relaçõeses superficiais; medo de vulnerabilidade.",
    "Nível 4: Tento me abrir, mas ainda carrego muitas m├ígoas do passado.",
    "Nível 5: Relacionamentos saud├íveis; pr├ítica ativa de perdão e escuta.",
    "Nível 6: C├¡rculo ├¡ntimo de alta confiança; sinto-me valorizado.",
    "Nível 7: Capacidade de amar incondicionalmente sem perder os limites.",
    "Nível 8: Mentor e apoio para outros; relaçõeses baseadas em crescimento.",
    "Nível 9: Irradio compaixão; presença que cura e acolhe.",
    "Nível 10: União profunda; mestre em criar e nutrir v├¡nculos sagrados.",
  ],
  abundancia: [
    "Nível 1: Escassez total; d├¡vidas fora de controle e medo do amanhão.",
    "Nível 2: Vivo para pagar contas; o dinheiro é fonte de estresse.",
    "Nível 3: Ganho o suficiente para sobreviver, mas não tenho reservas.",
    "Nível 4: Dificuldade em gerir o que ganho; mentalidade de escassez.",
    "Nível 5: Orçamento controlado; investimentos iniciados.",
    "Nível 6: Fluxo de caixa positivo; clareza total sobre ativos.",
    "Nível 7: Independència financeira crescendo; o dinheiro trabalha para mim.",
    "Nível 8: Abund├óncia gerada por propósito; recursos sobram para sonhos.",
    "Nível 9: Liberdade total; riqueza flui de múltiplas fontes est├íveis.",
    "Nível 10: Consciència de prosperidade infinita; mestre da manifestação.",
  ],
  trabalho: [
    "Nível 1: Odeio minha rotina; sinto-me escravizado pelas tarefas.",
    "Nível 2: Trabalho apenas pelo dinheiro; produtividade baixa.",
    "Nível 3: Busco melhorar, mas sinto-me perdido profissionalmente.",
    "Nível 4: Executo minhas tarefas, mas sem brilho ou excelència.",
    "Nível 5: Profissional competente; estudo e evoluo constantemente.",
    "Nível 6: Excelència reconhecida; entrego valor real ao mundo.",
    "Nível 7: Trabalho alinhado ao propósito; satisfação no esforço.",
    "Nível 8: Autoridade na minha ├írea; mestre em gestão de tempo.",
    "Nível 9: Liderança inspiradora; meu trabalho é minha arte.",
    "Nível 10: Maestria profissional; impacto global através da vocação.",
  ],
  autenticidade: [
    "Nível 1: Sem hobbies; tempo gasto em distraçõeses vazias.",
    "Nível 2: Sinto tédio; esqueci o que me dava prazer.",
    "Nível 3: Tenho um hobby, mas sinto culpa ao dedicar tempo.",
    "Nível 4: Pratico hobbies raramente; falta de autenticidade.",
    "Nível 5: Tempo semanal sagrado para hobbies; renovação de energia.",
    "Nível 6: Desenvolvo habilidades únicas por puro prazer.",
    "Nível 7: Minha personalidade brilha através dos meus interesses.",
    "Nível 8: Mestre em um hobby; criatividade e diversão integradas.",
    "Nível 9: Estilo de vida autèntico; sou fiel a mim mesmo sempre.",
    "Nível 10: Expressão pura do Ser; minha existència é uma arte única.",
  ],
  fisico: [
    "Nível 1: Sedentarismo total; corpo fraco ou sem energia.",
    "Nível 2: Alimentação péssima; cansaço cr├┤nico e sono ruim.",
    "Nível 3: Tento treinar, mas desisto em duas semanas.",
    "Nível 4: Treino espor├ídico; desconforto com a própria forma.",
    "Nível 5: Treino 3x por semana; consciència alimentar iniciada.",
    "Nível 6: Corpo atlético e funcional; energia est├ível.",
    "Nível 7: Alta performance f├¡sica; disciplina inabal├ível.",
    "Nível 8: Conexão mente-músculo profunda; vitalidade radiante.",
    "Nível 9: Templo f├¡sico otimizado; saúde m├íxima.",
    "Nível 10: Expressão m├íxima da biologia; vitalidade inesgot├ível.",
  ],
};
const ASSET_TO_PHRASE = {
  conexao: "conexao",
  espiritualidade: "espiritualidade",
  mente: "mente",
  verdade: "verdade",
  inspiracao: "inspiracao",
  amor: "amor",
  abundancia: "abundancia",
  trabalho: "trabalho",
  autenticidade: "autenticidade",
  fisico: "fisico",
};
const PROTOCOL_SLOTS = {
  conexao: [
    { id: "conexao.lema", label: "Lema de Vida", type: "rect-wide" },
    { id: "conexao.crenca1", label: "Crenca Principal 1", type: "rect-wide" },
    { id: "conexao.crenca2", label: "Crenca Principal 2", type: "rect-wide" },
    { id: "conexao.crenca3", label: "Crenca Principal 3", type: "rect-wide" },
  ],
  espiritualidade: [
    { id: "espiritualidade.sistema", label: "Sistema", type: "rect" },
    { id: "espiritualidade.entidade1", label: "Entidade Lider", type: "square-2" },
    { id: "espiritualidade.entidade2", label: "Entidade Protetora", type: "square-2" },
  ],
  mente: [
    { id: "mente.filosofia", label: "Filosofia Operacional", type: "rect-wide" },
  ],
  verdade: [
    { id: "verdade.mtp", label: "Missao de Vida", type: "rect-wide-tall" },
    { id: "verdade.trait1", label: "Trait 1", type: "rect-small" },
    { id: "verdade.trait2", label: "Trait 2", type: "rect-small" },
    { id: "verdade.trait3", label: "Trait 3", type: "rect-small" },
    {
      id: "verdade.nascimento",
      label: "Nascimento",
      type: "rect-small",
      fields: [
        { key: "dia", label: "Dia", slider: { min: 1, max: 31, step: 1, unit: "" } },
        { key: "mes", label: "Mes", slider: { min: 1, max: 12, step: 1, unit: "" } },
      ],
    },
    { id: "verdade.signo", label: "Signo", type: "rect-small" },
    { id: "verdade.mbti", label: "MBTI", type: "rect-small" },
    { id: "verdade.foto1", label: "Foto 1", type: "square-2" },
    { id: "verdade.foto2", label: "Foto 2", type: "square-2" },
    { id: "verdade.foto3", label: "Foto 3", type: "square-2" },
  ],
  inspiracao: [
    {
      id: "inspiracao.proj1",
      label: "Projeto 1",
      type: "square-2",
      fields: [
        { key: "nome", label: "Nome" },
        { key: "logo", label: "Logo" },
        { key: "progresso", label: "Progresso" },
      ],
    },
    {
      id: "inspiracao.proj2",
      label: "Projeto 2",
      type: "square-2",
      fields: [
        { key: "nome", label: "Nome" },
        { key: "logo", label: "Logo" },
        { key: "progresso", label: "Progresso" },
      ],
    },
    {
      id: "inspiracao.proj3",
      label: "Projeto 3",
      type: "square-2",
      fields: [
        { key: "nome", label: "Nome" },
        { key: "logo", label: "Logo" },
        { key: "progresso", label: "Progresso" },
      ],
    },
  ],
  amor: [
    {
      id: "amor.conexao1",
      label: "Conexao 1",
      type: "square",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "nome", label: "Nome (Topo)" },
        { key: "nota", label: "Nota (Baixo)" },
      ],
    },
    {
      id: "amor.conexao2",
      label: "Conexao 2",
      type: "square",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "nome", label: "Nome (Topo)" },
        { key: "nota", label: "Nota (Baixo)" },
      ],
    },
    {
      id: "amor.conexao3",
      label: "Conexao 3",
      type: "square",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "nome", label: "Nome (Topo)" },
        { key: "nota", label: "Nota (Baixo)" },
      ],
    },
    {
      id: "amor.conexao4",
      label: "Conexao 4",
      type: "square",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "nome", label: "Nome (Topo)" },
        { key: "nota", label: "Nota (Baixo)" },
      ],
    },
    {
      id: "amor.conexao5",
      label: "Conexao 5",
      type: "square",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "nome", label: "Nome (Topo)" },
        { key: "nota", label: "Nota (Baixo)" },
      ],
    },
    {
      id: "amor.conexao6",
      label: "Conexao 6",
      type: "square",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "nome", label: "Nome (Topo)" },
        { key: "nota", label: "Nota (Baixo)" },
      ],
    },
  ],
  abundancia: [
    { id: "abundancia.renda", label: "Renda Mensal", type: "rect-wide", fields: [{ key: "valor", label: "Renda", slider: { min: 0, max: 50000, step: 100, unit: "R$" } }] },
    { id: "abundancia.gasto", label: "Gasto Mensal", type: "rect-wide", fields: [{ key: "valor", label: "Gasto", slider: { min: 0, max: 50000, step: 100, unit: "R$" } }] },
    { id: "abundancia.liquidez", label: "Liquidez", type: "rect-wide", fields: [{ key: "valor", label: "Liquidez", slider: { min: 0, max: 200000, step: 100, unit: "R$" } }] },
    { id: "abundancia.ativo1", label: "Ativo 1", type: "square-2" },
    { id: "abundancia.ativo2", label: "Ativo 2", type: "square-2" },
    { id: "abundancia.ativo3", label: "Ativo 3", type: "square-2" },
  ],
  trabalho: [
    { id: "trabalho.pec", label: "Classe 1", type: "rect" },
    { id: "trabalho.unip", label: "Classe 2", type: "rect" },
    { id: "trabalho.personal", label: "Classe 3", type: "rect" },
    { id: "trabalho.cursos", label: "Cursos", type: "rect-wide" },
    { id: "trabalho.historico", label: "Historico", type: "rect-wide" },
  ],
  autenticidade: [
    {
      id: "autenticidade.hobby1",
      label: "Hobby 1",
      type: "square-2",
      fields: [
        { key: "hobby", label: "Hobby" },
        { key: "logo", label: "Logo" },
        { key: "rank", label: "Rank" },
      ],
    },
    {
      id: "autenticidade.hobby2",
      label: "Hobby 2",
      type: "square-2",
      fields: [
        { key: "hobby", label: "Hobby" },
        { key: "logo", label: "Logo" },
        { key: "rank", label: "Rank" },
      ],
    },
    {
      id: "autenticidade.hobby3",
      label: "Hobby 3",
      type: "square-2",
      fields: [
        { key: "hobby", label: "Hobby" },
        { key: "logo", label: "Logo" },
        { key: "rank", label: "Rank" },
      ],
    },
  ],
  fisico: [
    { id: "fisico.peso", label: "Peso", type: "rect-small", fields: [{ key: "kg", label: "Peso", slider: { min: 40, max: 200, step: 1, unit: "kg" } }] },
    { id: "fisico.altura", label: "Altura", type: "rect-small", fields: [{ key: "cm", label: "Altura", slider: { min: 140, max: 220, step: 1, unit: "cm" } }] },
    { id: "fisico.gordura", label: "%G", type: "rect-small", fields: [{ key: "percent", label: "%G", slider: { min: 5, max: 40, step: 1, unit: "%" } }] },
    { id: "fisico.flexao", label: "Flexao", type: "rect-tall", fields: [{ key: "reps", label: "Reps", slider: { min: 0, max: 200, step: 1, unit: "x" } }] },
    { id: "fisico.barra", label: "Barra", type: "rect-tall", fields: [{ key: "reps", label: "Reps", slider: { min: 0, max: 50, step: 1, unit: "x" } }] },
    { id: "fisico.corrida1", label: "Corrida 1km", type: "rect-tall", fields: [{ key: "min", label: "Min", slider: { min: 3, max: 20, step: 1, unit: "min" } }] },
    { id: "fisico.corrida5", label: "Corrida 5km", type: "rect-tall", fields: [{ key: "min", label: "Min", slider: { min: 12, max: 60, step: 1, unit: "min" } }] },
  ],
};

const getDossierSlots = (assetId) => {
  const base = PROTOCOL_SLOTS[assetId] || [];
  const lemaId = `${assetId}.lema`;
  const lemaSlot = base.find((slot) => slot.id === lemaId);
  const withoutLema = base.filter((slot) => slot.id !== lemaId);
  if (assetId !== "conexao") {
    return withoutLema;
  }
  return lemaSlot
    ? [lemaSlot, ...withoutLema]
    : [{ id: lemaId, label: "Lema", type: "rect-wide" }, ...withoutLema];
};

const getSlotOptions = () => {
  const options = [];
  Object.entries(PROTOCOL_SLOTS).forEach(([assetId, slots]) => {
    getDossierSlots(assetId).forEach((slot) => {
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
  const planned = Array.isArray(action.plannedHistory) ? action.plannedHistory : [];
  const keys = new Set(WEEKDAYS.map((_, idx) => getWeekDateKeyByIndex(weekStart, idx)));
  return planned.filter((key) => keys.has(key)).length;
};

const getActionWeeklyTarget = (action) => {
  if (action.atemporal) return 1;
  if (typeof action.weeklyTarget === "number" && action.weeklyTarget > 0) return action.weeklyTarget;
  return Array.isArray(action.weekdays) && action.weekdays.length > 0 ? action.weekdays.length : 1;
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
  const resetDone = localStorage.getItem(V2_RESET_KEY) === "true";
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
  keysToClear.forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(V2_RESET_KEY, "true");
};

let cachedProfile = null;
let currentUserId = null;
let cachedDNA = null;
let cachedPlanner = null;

const shouldPersistLocalData = () => !isSupabaseEnabled() || guestMode || !currentUserId;

const loadProfile = () => {
  if (cachedProfile) return cachedProfile;
  if (!shouldPersistLocalData()) {
    cachedProfile = {};
    return cachedProfile;
  }
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
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
    localStorage.setItem(PROFILE_KEY, JSON.stringify(cachedProfile));
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
        const payload = {
          id: user.id,
          user_id: user.id,
          nickname: profile.nickname || "",
          handle: formatHandle(profile.userId || profile.nickname || ""),
          lema: profile.banner || "",
          avatar_url: profile.avatar || "",
          total_level: Number(profile.total_level || 0),
          level_geral: Number(profile.total_level || 0),
          asset_levels: profile.assetLevels || {},
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
  const persistLocal = options.persistLocal ?? shouldPersistLocalData();
  setProfileCache(nextProfile, persistLocal);
  queueSupabaseProfileUpdate();
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

const formatHandle = (value) => {
  if (!value) return "";
  return value.startsWith("@") ? value : `@${value}`;
};

const fetchSupabaseProfileRow = async (userId) => {
  if (!isSupabaseEnabled() || !userId) return null;
  try {
    let { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error && /column .*id/i.test(error.message || "")) {
      const fallback = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }
    // maybeSingle retorna null quando não encontra, não é erro
    if (error && error.code !== "PGRST116") {
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
  // selected_gold_assets não existe mais no schema, usar dados locais
  const selectedGoldAssets = profile.selectedGoldAssets || profile.widgets || [];
  const updated = {
    ...profile,
    nickname: identity,
    userId: identity,
    banner: row.lema ?? profile.banner,
    avatar: row.avatar_url ?? profile.avatar,
    total_level: level,
    level_geral: level,
    selectedGoldAssets,
    widgets: Array.isArray(selectedGoldAssets) ? selectedGoldAssets : profile.widgets,
  };
  if (Array.isArray(selectedGoldAssets)) {
    updated.widgetsVisible = selectedGoldAssets.map(() => true);
  }
  const persistLocal = shouldPersistLocalData();
  if (row.dna_state && Array.isArray(row.dna_state.assets)) {
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
  if (row.planner_state && typeof row.planner_state === "object") {
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
      .maybeSingle();
    // maybeSingle retorna null quando não encontra, não é erro
    if (error && error.code !== "PGRST116") {
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
    let { data, error } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (error) {
      if (/column .*id/i.test(error.message || "")) {
        useUserIdOnly = true;
        const fallback = await supabase
          .from("profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        data = fallback.data;
        error = fallback.error;
      }
      // maybeSingle retorna null quando não encontra, não é erro
      if (error && error.code !== "PGRST116") logSupabaseError("profiles.select", error);
    }
    if (!data) {
      const profile = loadProfile();
      const fallbackName =
        profile.nickname ||
        profile.userId ||
        (user.email ? user.email.split("@")[0] : "") ||
        "";
      const payload = {
        id: user.id,
        user_id: user.id,
        nickname: fallbackName,
        handle: formatHandle(fallbackName),
        lema: profile.banner || "",
        avatar_url: profile.avatar || "",
        total_level: Number(profile.total_level || 0),
        level_geral: Number(profile.total_level || 0),
        asset_levels: profile.assetLevels || {},
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
  };

  setAuthMode("login");
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
      const email = emailInput?.value?.trim();
      const password = passInput?.value || "";
      if (!email || !password) {
        if (errorEl) errorEl.textContent = "Preencha e-mail e senha.";
        return;
      }
      try {
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
      if (!email || !password) {
        if (errorEl) errorEl.textContent = "Preencha e-mail e senha.";
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
          ensureLocalIdentity(email);
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
      localStorage.setItem("game_of_life.guest", "true");
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
      let password = localStorage.getItem(passwordKey);
      if (!password) {
        password = crypto.randomUUID();
        localStorage.setItem(passwordKey, password);
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
    const dna = loadDNA();
    const planner = loadPlanner();
    const payload = {
      id: user.id,
      user_id: user.id,
      nickname: nickname || profile.userId || "",
      handle: formatHandle(profile.userId || nickname || ""),
      lema: profile.banner || "",
      avatar_url: profile.avatar || "",
      total_level: Number(profile.total_level || 0),
      level_geral: Number(profile.total_level || 0),
      asset_levels: profile.assetLevels || {},
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
    const raw = localStorage.getItem(MISSIONS_KEY);
    if (!raw) return defaultMissionState();
    const parsed = JSON.parse(raw);
    return { ...defaultMissionState(), ...(parsed || {}) };
  } catch {
    return defaultMissionState();
  }
};

const saveMissionStateLocal = (state) => {
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(state));
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
    const payload = {
      id: user.id,
      user_id: user.id,
      nickname: profile.nickname || "",
      handle: formatHandle(profile.userId || profile.nickname || ""),
      lema: profile.banner || "",
      avatar_url: profile.avatar || "",
      total_level: Number(profile.total_level || 0),
      level_geral: Number(profile.total_level || 0),
      asset_levels: profile.assetLevels || {},
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
      .maybeSingle();
    // maybeSingle retorna null quando não encontra, não é erro
    if (error && error.code !== "PGRST116") {
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.assets)) return null;
    cachedDNA = parsed;
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
  const isStandby = localStorage.getItem(HIATO_KEY) === "true";
  treeGrid.innerHTML = "";
  treeGrid.onclick = (event) => {
    const target = event.target.closest(".sephirot");
    if (target?.dataset?.assetId) {
      openTreeEditor(target.dataset.assetId);
    }
  };
  const assets = getAssets();
  const vitalityStats = buildVitalityStats();
  const hudLevel = document.getElementById("hud-level");
  const hudNick = document.getElementById("hud-nick");
  const hudLevelText = document.getElementById("hud-level-text");
  if (hudLevel) {
    const total = assets.reduce((sum, asset) => sum + Number(asset.level || 0), 0);
    hudLevel.textContent = String(Math.round(total));
    if (hudLevelText) hudLevelText.textContent = String(Math.round(total));
  }
  const profile = loadProfile();
  if (hudNick) hudNick.textContent = profile.nickname || profile.userId || "-";

  assets.forEach((asset) => {
    const sphere = document.createElement("button");
    sphere.className = "sephirot";
    sphere.type = "button";
    sphere.style.gridRow = String(asset.row);
    sphere.style.gridColumn = String(asset.col);
    sphere.dataset.assetId = asset.id;
    if (asset.level === 0) sphere.classList.add("is-empty");
    if (isStandby) sphere.classList.add("is-empty");
    const vitality = vitalityStats.get(asset.id);
    if (vitality) {
      const className = getVitalityClass(vitality);
      if (className) sphere.classList.add(className);
    }

    const label = document.createElement("div");
    label.className = "sephirot-label";
    label.textContent = asset.label;

    const level = document.createElement("div");
    level.className = "sephirot-level";
    const roundedLevel = Math.round(asset.level);
    level.textContent = String(roundedLevel);
    const intensity = Math.min(1, Math.max(0.2, roundedLevel / 10));
    sphere.style.setProperty("--vitality-bg", `rgba(255, 255, 255, ${0.05 + intensity * 0.2})`);
    sphere.style.setProperty(
      "--vitality-border",
      `rgba(255, 255, 255, ${0.12 + intensity * 0.3})`,
    );

    sphere.appendChild(label);
    sphere.appendChild(level);
    sphere.addEventListener("click", () => openTreeEditor(asset.id));
    treeGrid.appendChild(sphere);
  });
};

const buildDefaultPlanner = () => ({ pills: [], logistics: {}, bronzeActions: [] });

const loadPlanner = () => {
  if (cachedPlanner) return cachedPlanner;
  if (!shouldPersistLocalData()) return buildDefaultPlanner();
  try {
    const raw = localStorage.getItem(PLANNER_KEY);
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
    localStorage.setItem(PLANNER_KEY, JSON.stringify(cachedPlanner));
  }
};

const savePlanner = (planner, options = {}) => {
  const persistLocal = options.persistLocal ?? shouldPersistLocalData();
  setPlannerCache(planner, persistLocal);
  if (!options.skipSync) {
    queueSupabaseProfileUpdate({ planner_state: planner });
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

const updateDayLabel = () => {
  const label = document.getElementById("day-label");
  if (!label) return;
  if (plannerDayOffset === 0) {
    label.textContent = "Hoje";
  } else if (plannerDayOffset > 0) {
    label.textContent = `+${plannerDayOffset}d`;
  } else {
    label.textContent = `${plannerDayOffset}d`;
  }
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
  bronze.draggable = action.status === "backlog";
  if (action.serious) bronze.classList.add("serious");
  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", action.icon || "circle");
  bronze.appendChild(icon);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyTarget = getActionWeeklyTarget(action);
  const completedCount = getActionRecentCompletions(action, weekAgo);
  const weekStart = getWeekStartDate(new Date());
  const plannedCount = getPlannedCountForWeek(action, weekStart);
  const remaining = Math.max(0, weeklyTarget - completedCount - plannedCount);
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
  const dayStartHour = 6;
  const dayEndHour = 24;
  const isNarrow = window.innerWidth <= 520;
  const pixelsPerMinute = isNarrow ? 0.6 : 1;
  const slotHeight = Math.round(60 * pixelsPerMinute);
  const timelineTopPadding = 16;
  const hourCount = dayEndHour - dayStartHour + 1;
  
  weekGrid.innerHTML = "";
  weekGrid.className = "week-grid week-timeline";
  
  const header = document.createElement("div");
  header.className = "week-timeline-header";
  const timeSpacer = document.createElement("div");
  timeSpacer.className = "week-time-spacer";
  header.appendChild(timeSpacer);
  WEEKDAYS.forEach((day, index) => {
    const label = document.createElement("div");
    label.className = "week-day-label";
    label.textContent = day.label;
    const dateKey = getWeekDateKeyByIndex(weekStart, index);
    const todayKey = formatDateKey(new Date());
    if (dateKey === todayKey) label.classList.add("is-today");
    header.appendChild(label);
  });
  weekGrid.appendChild(header);
  
  const body = document.createElement("div");
  body.className = "week-timeline-body";
  body.style.position = "relative";
  body.style.height = `${timelineTopPadding * 2 + hourCount * slotHeight}px`;
  
  for (let hour = dayStartHour; hour <= dayEndHour; hour += 1) {
    const row = document.createElement("div");
    row.className = "week-timeline-row";
    row.style.position = "absolute";
    row.style.top = `${timelineTopPadding + (hour - dayStartHour) * slotHeight}px`;
    row.style.left = "0";
    row.style.right = "0";
    row.style.height = "1px";
    row.style.borderTop = "1px solid rgba(255, 255, 255, 0.06)";
    row.style.pointerEvents = "none";
    
    const timeLabel = document.createElement("div");
    timeLabel.className = "week-time-label";
    timeLabel.style.position = "absolute";
    timeLabel.style.left = "8px";
    timeLabel.style.top = "-10px";
    timeLabel.style.fontSize = "10px";
    timeLabel.style.color = "#bdbdbd";
    timeLabel.textContent = `${String(hour).padStart(2, "0")}:00`;
    row.appendChild(timeLabel);
    body.appendChild(row);
  }
  
  WEEKDAYS.forEach((day, dayIndex) => {
    const dayCol = document.createElement("div");
    dayCol.className = "week-day-col";
    dayCol.style.position = "absolute";
    dayCol.style.left = `${(dayIndex * (100 / 7))}%`;
    dayCol.style.width = `${100 / 7}%`;
    dayCol.style.top = `${timelineTopPadding}px`;
    dayCol.style.height = `${hourCount * slotHeight}px`;
    dayCol.style.borderLeft = dayIndex > 0 ? "1px solid rgba(255, 255, 255, 0.08)" : "none";
    
    const dayKey = day.key;
    const dateKey = getWeekDateKeyByIndex(weekStart, dayIndex);
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + dayIndex);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(weekStart);
    targetDate.setDate(targetDate.getDate() + dayIndex);
    targetDate.setHours(0, 0, 0, 0);
    const dayOffset = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const scheduledActions = planner.bronzeActions.filter(
      (action) =>
        (action.status === "scheduled" || action.status === "done") &&
        Number(action.scheduledDayOffset || 0) === dayOffset,
    );
    const scheduledIds = new Set(scheduledActions.map((action) => action.id));
    const recurringActions = planner.bronzeActions.filter(
      (action) =>
        !scheduledIds.has(action.id) &&
        Array.isArray(action.weekdays) &&
        action.weekdays.includes(dayKey),
    );
    
    [...scheduledActions, ...recurringActions].forEach((action) => {
      const startHour = Math.min(
        dayEndHour,
        Math.max(dayStartHour, Number(action.scheduledHour || dayStartHour)),
      );
      const startMinute = Number(action.scheduledMinute || 0);
      const duration = Number(action.durationMinutes || 30);
      const block = buildBronzeBlock(action, {
        dayDate,
        isRecurring: recurringActions.includes(action),
      });
      const top = (startHour - dayStartHour) * slotHeight + startMinute * pixelsPerMinute;
      block.style.position = "absolute";
      block.style.top = `${top}px`;
      block.style.left = "4px";
      block.style.right = "4px";
      block.style.height = `${Math.max(20, duration * pixelsPerMinute)}px`;
      block.style.pointerEvents = "auto";
      dayCol.appendChild(block);
    });
    
    dayCol.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    dayCol.addEventListener("drop", (event) => {
      event.preventDefault();
      const payload = event.dataTransfer?.getData("text/plain");
      if (!payload || !payload.startsWith("bronze:")) return;
      const actionId = payload.replace("bronze:", "");
      const rect = dayCol.getBoundingClientRect();
      const y = event.clientY - rect.top - timelineTopPadding;
      const hour = Math.max(dayStartHour, Math.min(dayEndHour, Math.floor(y / slotHeight) + dayStartHour));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(weekStart);
      targetDate.setDate(targetDate.getDate() + dayIndex);
      targetDate.setHours(0, 0, 0, 0);
      const dayOffset = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const updated = planner.bronzeActions.map((action) => {
        if (action.id !== actionId) return action;
        return {
          ...action,
          status: "scheduled",
          scheduledHour: hour,
          scheduledMinute: 0,
          scheduledDayOffset: dayOffset,
        };
      });
      savePlanner({ ...planner, bronzeActions: updated });
      renderPlanner();
    });
    
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
  if (action.status === "scheduled" || action.status === "done") {
    block.draggable = true;
    block.addEventListener("dragstart", (event) => {
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
    }, HOLD_DURATION_MS);
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

const loadArenas = () => {
  try {
    const raw = localStorage.getItem(ARENAS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveArenas = (arenas) => {
  localStorage.setItem(ARENAS_KEY, JSON.stringify(arenas));
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
  if (!updated.find((arena) => arena.id === arenaId)) {
    updated.push({ id: arenaId, title: "Arena", completion });
  }
  saveArenas(updated);

  try {
    const dnaRaw = localStorage.getItem(STORAGE_KEY);
    if (!dnaRaw) return;
    const dna = JSON.parse(dnaRaw);
    const existing = Array.isArray(dna.arenas) ? dna.arenas : [];
    const merged = existing.map((arena) =>
      arena.id === arenaId ? { ...arena, completion } : arena
    );
    if (!merged.find((arena) => arena.id === arenaId)) {
      merged.push({ id: arenaId, title: "Arena", completion });
    }
    dna.arenas = merged;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dna));
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
    const dnaRaw = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dna));
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
    const visibleActions = bronzeActions.slice(0, maxSlots);
    visibleActions.forEach((action) => {
      const slot = document.createElement("div");
      slot.className = "arena-bronze-slot";
      if (action.status === "done") slot.classList.add("arena-bronze-slot--done");
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", action.icon || "circle");
      slot.appendChild(icon);
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
  progressBar.className = "arena-progress-bar";
  const progressFill = document.createElement("div");
  progressFill.className = "arena-progress-fill";
  progressFill.style.width = `${Math.min(100, Math.max(0, completionValue))}%`;
  progressBar.appendChild(progressFill);
  
  const assetLabel = document.createElement("div");
  assetLabel.className = "arena-progress";
  assetLabel.textContent = LABEL_BY_ID.get(arena.assetId) ?? "Ativo";
  
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
    add.textContent = "+ Bronze";
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
  
  if (window.lucide) {
    setTimeout(() => window.lucide.createIcons(), 0);
  }
  
  return card;
};

const renderArenas = () => {
  const arenaList = document.getElementById("arena-list");
  if (!arenaList) return;
  const arenas = loadArenas();
  arenaList.innerHTML = "";
  if (arenas.length === 0) {
    const empty = document.createElement("div");
    empty.className = "arena-empty";
    empty.textContent = "Sem metas ainda.";
    arenaList.appendChild(empty);
    return;
  }
  arenas.forEach((arena) => {
    arenaList.appendChild(buildArenaCard(arena));
  });
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
  localStorage.setItem(HIATO_KEY, "true");
  cleanupPlannerHistory();
  const modal = document.getElementById("hiato-modal");
  if (modal) modal.classList.add("is-open");
  document.body.classList.add("standby");
};

const clearHiato = () => {
  localStorage.setItem(HIATO_KEY, "false");
  document.body.classList.remove("standby");
  const modal = document.getElementById("hiato-modal");
  if (modal) modal.classList.remove("is-open");
};

const applyHiatoIfNeeded = () => {
  const lastLogin = localStorage.getItem(LOGIN_KEY);
  if (shouldTriggerHiato(lastLogin)) {
    triggerHiato();
  } else {
    const active = localStorage.getItem(HIATO_KEY) === "true";
    if (active) {
      document.body.classList.add("standby");
      const modal = document.getElementById("hiato-modal");
      if (modal) modal.classList.add("is-open");
    }
  }
  localStorage.setItem(LOGIN_KEY, new Date().toISOString());
};

const evaluateGlitch = () => {
  const now = Date.now();
  const storedUntil = Number(localStorage.getItem(GLITCH_KEY) || 0);
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
    localStorage.setItem(GLITCH_KEY, String(until));
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
  const dayStartHour = 6;
  const dayEndHour = 24;
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
  if (isNarrow) {
    timeline.style.height = `${timelineTopPadding * 2 + hourCount * slotHeight}px`;
    timeline.style.overflowY = "hidden";
  } else {
    timeline.style.height = "";
    timeline.style.overflowY = "auto";
  }
  for (let hour = dayStartHour; hour <= dayEndHour; hour += 1) {
    const slot = document.createElement("div");
    slot.className = "time-slot";
    slot.dataset.hour = String(hour);
    slot.style.height = `${slotHeight}px`;
    slot.style.minHeight = `${slotHeight}px`;

    const label = document.createElement("div");
    label.className = "time-label";
    label.textContent = `${String(hour).padStart(2, "0")}:00`;
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
        const updated = planner.bronzeActions.map((action) => {
          if (action.id !== actionId) return action;
          return {
            ...action,
            status: "scheduled",
            scheduledHour: hour,
            scheduledMinute: 0,
            scheduledDayOffset: plannerDayOffset,
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

  const scheduledActions = planner.bronzeActions.filter(
    (action) =>
      (action.status === "scheduled" || action.status === "done") &&
      Number(action.scheduledDayOffset || 0) === plannerDayOffset,
  );
  const scheduledIds = new Set(scheduledActions.map((action) => action.id));
  const recurringActions = planner.bronzeActions.filter(
    (action) =>
      !scheduledIds.has(action.id) &&
      Array.isArray(action.weekdays) &&
      action.weekdays.includes(dayKey),
  );
  [...scheduledActions, ...recurringActions].forEach((action) => {
    const startHour = Math.min(
      dayEndHour,
      Math.max(dayStartHour, Number(action.scheduledHour || dayStartHour)),
    );
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
  const bronzeBacklog = planner.bronzeActions.filter((action) => action.status === "backlog");
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

let navInitialized = false;

const setActiveScreen = (target) => {
  if (!target) return;
  try {
    document.querySelectorAll(".screen").forEach((screen) => {
      const isActive = screen.dataset.screen === target;
      screen.classList.toggle("is-active", isActive);
    });
    document.querySelectorAll(".nav-item").forEach((button) => {
      const isActive = button.dataset.target === target;
      button.classList.toggle("is-active", isActive);
    });
  } catch (error) {
    console.error("[setActiveScreen] Erro:", error);
  }
};

const initNav = () => {
  if (navInitialized) return;
  
  // Aguardar DOM estar pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNav);
    return;
  }
  
  navInitialized = true;
  
  const navButtons = document.querySelectorAll(".nav-item");
  if (navButtons.length === 0) {
    console.warn("[initNav] Nenhum botão de navegação encontrado, tentando novamente...");
    setTimeout(initNav, 100);
    return;
  }
  
  // Remover listeners antigos se houver
  navButtons.forEach((button) => {
    const newButton = button.cloneNode(true);
    button.parentNode?.replaceChild(newButton, button);
  });
  
  const freshButtons = document.querySelectorAll(".nav-item");
  freshButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = button.dataset.target;
      if (!target) {
        console.warn("[initNav] Botão sem data-target:", button);
        return;
      }
      if (button.classList.contains("is-active")) {
        return;
      }
      try {
        if (typeof playMetalClick === "function") {
          playMetalClick();
        }
        setActiveScreen(target);
      } catch (error) {
        console.error("[initNav] Erro ao trocar tela:", error);
      }
    });
  });
  
  const initialButton = document.querySelector(".nav-item.is-active");
  const initialScreen = initialButton?.dataset.target || "tree";
  setActiveScreen(initialScreen);
};

const getDNA = () => loadDNA();

const setDNACache = (dna, persistLocal = shouldPersistLocalData()) => {
  cachedDNA = dna || buildDefaultDNA();
  if (persistLocal) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedDNA));
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
  const updatedProfile = { ...profile, assetLevels, total_level: total, level_geral: total };
  setProfileCache(updatedProfile, persistLocal);
  queueSupabaseProfileUpdate({
    dna_state: dna,
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

const renderTreeEditorSlots = (dna, assetId) => {
  const list = document.getElementById("tree-slot-list");
  if (!list) return;
  const asset = getAssetFromDNA(dna, assetId);
  list.innerHTML = "";
  if (!asset) return;
  const ensureTreeEditMode = () => {
    const modal = document.getElementById("tree-edit-modal");
    if (!modal) return false;
    if (!modal.classList.contains("is-editing")) {
      modal.classList.add("is-editing");
    }
    return true;
  };
  const slots = getDossierSlots(assetId);
  asset.profileSlots = asset.profileSlots || {};
  const getSlotDisplayText = (slot) => {
    const data = asset.profileSlots?.[slot.id] || {};
    const fields = slot.fields || [{ key: "value" }];
    const key = fields[0]?.key || "value";
    return data[key] || "";
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
  slots.forEach((slot, index) => {
    const slotEl = document.createElement("div");
    slotEl.className = `profile-slot profile-slot--${slot.type} slot-animate`;
    slotEl.style.animationDelay = `${index * 40}ms`;
    slotEl.dataset.slotId = slot.id;
    const label = document.createElement("div");
    label.className = "slot-label";
    label.textContent = slot.label;
    slotEl.appendChild(label);

    const valueEl = document.createElement("div");
    valueEl.className = "slot-value";
    valueEl.textContent = getSlotDisplayText(slot) || "ÔÇö";
    slotEl.appendChild(valueEl);
    const fields = slot.fields || [{ key: "value", label: slot.label }];
    const isPhotoSlot =
      slot.type.startsWith("square") &&
      (slot.label.toLowerCase().includes("foto") ||
        slot.label.toLowerCase().includes("logo") ||
        (slot.fields || []).some((field) => ["foto", "logo"].includes(field.key)));

    if (isPhotoSlot) {
      const textFields = fields.filter((f) => !["foto", "logo"].includes(f.key));
      const topKey = textFields[0]?.key;
      const bottomKey = textFields[1]?.key;
      if (topKey) {
        const topValue = asset.profileSlots?.[slot.id]?.[topKey];
        label.textContent = topValue ? String(topValue) : slot.label;
      }
      if (bottomKey) {
        const bottomValue = asset.profileSlots?.[slot.id]?.[bottomKey];
        const subtitleEl = document.createElement("div");
        subtitleEl.className = "slot-subtitle";
        subtitleEl.textContent = bottomValue ? String(bottomValue) : "";
        slotEl.appendChild(subtitleEl);
      }
    } else {
      const secondaryField = fields.find(
        (field, index) => index > 0 && !["foto", "logo"].includes(field.key),
      );
      if (secondaryField) {
        const secondaryValue = asset.profileSlots?.[slot.id]?.[secondaryField.key];
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
      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          asset.profileSlots[slot.id] = {
            ...(asset.profileSlots[slot.id] || {}),
            image: reader.result,
          };
          valueEl.classList.add("has-image");
          const img = ensureImageEl();
          img.src = String(reader.result || "");
          valueEl.textContent = "";
          dna.lastUpdatedAt = new Date().toISOString();
          saveDNA(dna);
        };
        reader.readAsDataURL(file);
      });
      slotEl.appendChild(fileInput);
      const existingImage = asset.profileSlots[slot.id]?.image;
      if (existingImage) {
        valueEl.classList.add("has-image");
        const img = ensureImageEl();
        img.src = String(existingImage || "");
        valueEl.textContent = "";
      }
      slotEl.addEventListener("click", (event) => {
        if (!event.target.closest(".slot-value")) return;
        if (!slotEl.closest("#tree-edit-modal.is-editing")) return;
        fileInput.click();
      });
    }

    const subtitle = slotEl.querySelector(".slot-subtitle");
    const optionsBySlot = {
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
    };

    const applyFieldUpdate = (field, value) => {
      asset.profileSlots[slot.id] = {
        ...(asset.profileSlots[slot.id] || {}),
        [field.key]: value,
      };
      valueEl.textContent = getSlotDisplayText(slot) || "ÔÇö";
      const secondary = secondaryField?.key;
      if (subtitle) {
        subtitle.textContent =
          secondary && asset.profileSlots?.[slot.id]?.[secondary]
            ? String(asset.profileSlots[slot.id][secondary])
            : "";
      }
      dna.lastUpdatedAt = new Date().toISOString();
      saveDNA(dna);
      renderSocial();
      if (slot.id.endsWith(".lema")) {
        const profile = loadProfile();
        saveProfile({
          ...profile,
          lemaUpdatedAt: new Date().toISOString(),
          lemaUpdatedAssetId: asset.id,
        });
      }
      checkMissionProgress();
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
      if (["foto", "logo"].includes(field.key)) return;
      const slotOptions = optionsBySlot[slot.id];
      if (slotOptions && field.key === "value") {
        const select = document.createElement("select");
        select.className = "profile-input";
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
        select.value = asset.profileSlots[slot.id]?.[field.key] || "";
        select.addEventListener("click", stopSlotPropagation);
        select.addEventListener("pointerdown", stopSlotPropagation);
        select.addEventListener("change", () => applyFieldUpdate(field, select.value));
        slotEl.appendChild(select);
        return;
      }
      const input = document.createElement("input");
      input.className = "profile-input";
      input.placeholder = field.label;
      input.value = asset.profileSlots[slot.id]?.[field.key] || "";
      input.addEventListener("click", stopSlotPropagation);
      input.addEventListener("pointerdown", stopSlotPropagation);
      if (field.slider) {
        input.readOnly = true;
        input.addEventListener("click", () => {
          if (!slotEl.closest("#tree-edit-modal.is-editing")) {
            if (!ensureTreeEditMode()) return;
          }
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
                const dia = Number(
                  asset.profileSlots?.["verdade.nascimento"]?.dia || 0,
                );
                const mes = Number(
                  asset.profileSlots?.["verdade.nascimento"]?.mes || 0,
                );
                const signo = getZodiacSign(dia, mes);
                if (signo) {
                  asset.profileSlots["verdade.signo"] = {
                    ...(asset.profileSlots["verdade.signo"] || {}),
                    value: signo,
                  };
                }
              }
              renderTreeEditorSlots(dna, assetId);
            },
          });
        });
      }
      input.addEventListener("input", () => applyFieldUpdate(field, input.value));
      input.addEventListener("change", () => applyFieldUpdate(field, input.value));
      slotEl.appendChild(input);
    });


    slotEl.addEventListener("click", (event) => {
      if (isPhotoSlot) {
        if (!event.target.closest(".slot-value")) return;
        if (!slotEl.closest("#tree-edit-modal.is-editing")) return;
        const file = slotEl.querySelector("input[type='file']");
        if (file) file.click();
        return;
      }
      if (!slotEl.closest("#tree-edit-modal.is-editing")) {
        ensureTreeEditMode();
      }
      const focusable = slotEl.querySelector("input.profile-input");
      if (focusable) focusable.focus();
    });

    list.appendChild(slotEl);
  });
};

const openTreeEditor = (assetId) => {
  const dna = seedDNAIfMissing();
  const asset = getAssetFromDNA(dna, assetId);
  if (!asset) return;
  const modal = document.getElementById("tree-edit-modal");
  const title = document.getElementById("tree-edit-title");
  const levelText = document.getElementById("tree-edit-level-text");
  const phraseText = document.getElementById("tree-edit-phrase");
  const icon = document.getElementById("tree-edit-icon");
  const linkedArenasList = document.getElementById("linked-arenas-list");
  const addArenaBtn = document.getElementById("tree-edit-add-arena");
  const backBtn = document.getElementById("tree-edit-back");
  const okBtn = document.getElementById("tree-edit-ok");
  const editBtn = document.getElementById("tree-edit-edit");
  if (!modal || !title || !levelText) return;
  modal.dataset.assetId = asset.id;
  title.textContent = `${LABEL_BY_ID.get(asset.id) ?? asset.label}`;
  const levelValue = Math.round(Number(asset.level || 0));
  levelText.textContent = String(levelValue);
  if (phraseText) {
    const phraseKey = ASSET_TO_PHRASE[asset.id];
    const phrases = phraseKey ? MASTERY_PHRASES[phraseKey] : [];
    phraseText.textContent = phrases[Math.max(0, Math.min(9, levelValue - 1))] || "";
    let badge = phraseText.querySelector(".oracle-level-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "oracle-level-badge";
      phraseText.prepend(badge);
    }
    badge.textContent = String(levelValue);
  }
  if (icon) {
    icon.setAttribute("data-lucide", ICON_BY_ID[asset.id] ?? "circle");
    if (window.lucide) window.lucide.createIcons();
  }
  modal.dataset.assetId = asset.id;
  renderTreeEditorSlots(dna, asset.id);
  if (linkedArenasList) {
    const arenas = loadArenas().filter((arena) => arena.assetId === asset.id);
    linkedArenasList.innerHTML = "";
    if (arenas.length === 0) {
      const empty = document.createElement("div");
      empty.className = "arena-empty";
      empty.textContent = "Sem arenas vinculadas.";
      linkedArenasList.appendChild(empty);
    } else {
      arenas.forEach((arena) => {
        const card = buildArenaCard(arena, { compact: true, showAdd: true });
        linkedArenasList.appendChild(card);
      });
    }
  }
  if (addArenaBtn) {
    addArenaBtn.onclick = () => {
      playMetalClick();
      openArenaModalForAsset(asset.id);
    };
  }
  if (backBtn) {
    backBtn.onclick = () => {
      playMetalClick();
      closeTreeEditor();
    };
  }
  if (okBtn) {
    okBtn.onclick = () => {
      playMetalClick();
      modal.classList.remove("is-editing");
      const lemaSlot = `${asset.id}.lema`;
      const lemaValue = asset?.profileSlots?.[lemaSlot]?.value;
      if (lemaValue && asset.id === "conexao") {
        const profile = loadProfile();
        const updated = { ...profile, banner: lemaValue };
        saveProfile(updated);
        ensureSupabaseProfile(updated);
        syncProfileTotals(updated);
      }
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
};

const openArenaModal = () => {
  const modal = document.getElementById("arena-modal");
  const select = document.getElementById("arena-asset");
  const title = document.getElementById("arena-title");
  const description = document.getElementById("arena-description");
  const addBronze = document.getElementById("arena-add-bronze");
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
  const progress = document.getElementById("arena-dossier-progress");
  const macro = document.getElementById("arena-dossier-macro");
  const bronzeList = document.getElementById("arena-dossier-bronze");
  const targetLabel = document.getElementById("arena-dossier-target");
  const progressFill = document.getElementById("arena-dossier-fill");
  if (!modal || !title || !progress || !macro || !bronzeList) return;
  const arenas = loadArenas();
  const arena = arenas.find((item) => item.id === arenaId);
  if (!arena) return;
  title.textContent = arena.title || "Arena";
  const completionValue = Number(arena.completion || 0);
  if (arena.targetCount) {
    progress.textContent = `${Number(arena.completedCount || 0)}/${arena.targetCount}`;
  } else {
    progress.textContent = `${Math.round(completionValue)}%`;
  }
  macro.textContent = arena.description || "Sem descricao.";
  if (targetLabel) {
    targetLabel.textContent = arena.targetCount
      ? `Meta Atual: ${Number(arena.completedCount || 0)}/${arena.targetCount}`
      : "Meta Atual: livre";
  }
  if (progressFill) {
    progressFill.style.width = `${Math.min(100, Math.max(0, completionValue))}%`;
  }
  bronzeList.innerHTML = "";
  const planner = loadPlanner();
  const actions = planner.bronzeActions.filter((action) => action.arenaId === arenaId);
  if (actions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "arena-empty";
    empty.textContent = "Sem acoes de bronze.";
    bronzeList.appendChild(empty);
  } else {
    actions.forEach((action) => {
      const item = document.createElement("div");
      item.className = "bronze-item bronze-item-edit";
      if (action.serious) item.classList.add("serious");
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", action.icon || "circle");
      const input = document.createElement("input");
      input.className = "bronze-edit-input";
      input.value = action.title || "Acao";
      input.addEventListener("click", (event) => event.stopPropagation());
      input.addEventListener("change", () => {
        const plannerState = loadPlanner();
        const updated = plannerState.bronzeActions.map((itemAction) =>
          itemAction.id === action.id ? { ...itemAction, title: input.value.trim() } : itemAction,
        );
        savePlanner({ ...plannerState, bronzeActions: updated });
        renderPlanner();
      });
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "bronze-delete";
      deleteBtn.type = "button";
      deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
      deleteBtn.addEventListener("click", () => {
        const plannerState = loadPlanner();
        const updated = plannerState.bronzeActions.filter((itemAction) => itemAction.id !== action.id);
        savePlanner({ ...plannerState, bronzeActions: updated });
        openArenaDossier(arenaId);
        renderPlanner();
      });
      let touchStartX = 0;
      item.addEventListener("touchstart", (event) => {
        const touch = event.touches[0];
        if (!touch) return;
        touchStartX = touch.clientX;
      });
      item.addEventListener("touchend", (event) => {
        const touch = event.changedTouches[0];
        if (!touch) return;
        const deltaX = touch.clientX - touchStartX;
        if (deltaX < -60) {
          deleteBtn.click();
        }
      });
      item.addEventListener("click", () => openBronzeModal(arenaId, action.id));
      item.appendChild(icon);
      item.appendChild(input);
      item.appendChild(deleteBtn);
      bronzeList.appendChild(item);
    });
  }
  const quickAdd = document.createElement("button");
  quickAdd.type = "button";
  quickAdd.className = "bronze-add-inline";
  quickAdd.innerHTML = '<i data-lucide="plus"></i>';
  quickAdd.addEventListener("click", () => {
    openBronzeModal(arenaId);
  });
  bronzeList.appendChild(quickAdd);
  if (window.lucide) window.lucide.createIcons();
  modal.dataset.arenaId = arenaId;
  modal.classList.add("is-open");
};

const renderSocial = () => {
  const levelEl = document.getElementById("social-level");
  const nickEl = document.getElementById("social-nick");
  const idEl = document.getElementById("social-id");
  const socialAvatar = document.querySelector(".social-avatar");
  const hudAvatar = document.getElementById("hud-avatar");
  const hudNick = document.getElementById("hud-nick");
  const hudLevelText = document.getElementById("hud-level-text");
  if (!levelEl) return;
  const dna = seedDNAIfMissing();
  const total = dna.assets.reduce((sum, asset) => sum + Number(asset.level || 0), 0);
  levelEl.textContent = String(Math.round(total));

  const profile = loadProfile();
  if (nickEl) nickEl.textContent = profile.nickname || "-";
  if (idEl) idEl.textContent = profile.userId || "-";
  if (hudNick) hudNick.textContent = profile.nickname || profile.userId || "-";
  if (hudLevelText) hudLevelText.textContent = `Nivel ${Math.round(total)}`;
  if (profile.theme) applyTheme(profile.theme);
  if (profile.borderColor) {
    document.documentElement.style.setProperty("--accent-energy", profile.borderColor);
  }
  if (socialAvatar && profile.avatar) {
    socialAvatar.style.backgroundImage = `url(${profile.avatar})`;
    socialAvatar.style.backgroundSize = "cover";
    socialAvatar.style.backgroundPosition = "center";
  }
  if (hudAvatar && profile.avatar) {
    hudAvatar.style.backgroundImage = `url(${profile.avatar})`;
    hudAvatar.style.backgroundSize = "cover";
    hudAvatar.style.backgroundPosition = "center";
  }
};

const renderProfileWidgetDisplay = (profile, dna) => {
  const container = document.getElementById("widget-display");
  if (!container) return;
  container.innerHTML = "";
  const widgets = Array.isArray(profile.widgets) ? profile.widgets : [];
  const visible = Array.isArray(profile.widgetsVisible) ? profile.widgetsVisible : [];
  if (!widgets.length) return;

  const resolveSlotRef = (widgetId) => {
    if (!widgetId) return null;
    const parts = widgetId.split(".");
    if (parts.length < 2) return null;
    const assetId = parts[0];
    let slotId = widgetId;
    if (parts[1] === assetId) {
      slotId = parts.slice(1).join(".");
    }
    if (!slotId.startsWith(`${assetId}.`)) {
      slotId = `${assetId}.${parts.slice(1).join(".")}`;
    }
    return { assetId, slotId };
  };

  const getSlotLabel = (assetId, slotId) => {
    const slots = getDossierSlots(assetId);
    const slot = slots.find((item) => item.id === slotId);
    return slot?.label || slotId.split(".").slice(1).join(" ") || "Slot";
  };

  const getSlotType = (assetId, slotId) => {
    const slots = getDossierSlots(assetId);
    const slot = slots.find((item) => item.id === slotId);
    return slot?.type || "rect";
  };

  const getSlotValue = (asset, slotId) => {
    const data = asset.profileSlots?.[slotId] || {};
    const slots = getDossierSlots(asset.id);
    const slot = slots.find((item) => item.id === slotId);
    const fields = slot?.fields || [{ key: "value" }];
    const key = fields[0]?.key || "value";
    return data[key] || "";
  };

  widgets.forEach((widgetId, index) => {
    if (visible[index] === false) return;
    const ref = resolveSlotRef(widgetId);
    if (!ref) return;
    const asset = getAssetFromDNA(dna, ref.assetId);
    if (!asset) return;
    const value = getSlotValue(asset, ref.slotId);
    const label = getSlotLabel(ref.assetId, ref.slotId);
    const type = getSlotType(ref.assetId, ref.slotId);
    const image = asset.profileSlots?.[ref.slotId]?.image;
    const card = document.createElement("div");
    card.className = `widget-card${image ? " has-image" : ""}${
      type === "rect-wide" ? " is-wide" : ""
    }`;
    if (image) card.style.backgroundImage = `url(${image})`;
    const labelEl = document.createElement("div");
    labelEl.className = "widget-label";
    labelEl.textContent = label;
    const valueEl = document.createElement("div");
    valueEl.className = "widget-value";
    valueEl.textContent = value || "Sem dado";
    card.appendChild(labelEl);
    card.appendChild(valueEl);
    container.appendChild(card);
  });
};

const openBronzeModal = (arenaId, actionId) => {
  const modal = document.getElementById("bronze-modal");
  const iconGrid = document.getElementById("bronze-icon-grid");
  const durationInput = document.getElementById("bronze-duration");
  const durationValue = document.getElementById("bronze-duration-value");
  const seriousToggle = document.getElementById("bronze-serious");
  const atemporalToggle = document.getElementById("bronze-atemporal");
  const titleInput = document.getElementById("bronze-title");
  if (!modal || !iconGrid || !durationInput || !seriousToggle || !titleInput) return;
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
  titleInput.value = existing?.title || "";
  const durationMinutes = existing?.durationMinutes || 60;
  durationInput.min = "0";
  durationInput.max = "360";
  durationInput.step = "15";
  durationInput.value = String(durationMinutes);
  if (durationValue) durationValue.textContent = formatDuration(durationMinutes);
  seriousToggle.checked = !!existing?.serious;
  if (atemporalToggle) atemporalToggle.checked = !!existing?.atemporal;
  const card = modal.querySelector(".bronze-card-elite");
  if (card) card.classList.remove("serious-on");
  modal.querySelectorAll(".weekday-grid input[type='checkbox']").forEach((input) => {
    input.checked = Array.isArray(existing?.weekdays) ? existing.weekdays.includes(input.value) : false;
  });
  iconGrid.innerHTML = "";
  BRONZE_ICONS.forEach((iconName) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "icon-option";
    if (iconName === (existing?.icon || BRONZE_ICONS[0])) option.classList.add("is-selected");
    option.dataset.icon = iconName;
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", iconName);
    option.appendChild(icon);
    option.addEventListener("click", () => {
      iconGrid.querySelectorAll(".icon-option").forEach((el) => {
        el.classList.remove("is-selected");
      });
      option.classList.add("is-selected");
      modal.dataset.icon = iconName;
      if (window.lucide) window.lucide.createIcons();
    });
    iconGrid.appendChild(option);
  });
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
      button.textContent = phrase;
      button.addEventListener("click", () => {
        const dna = seedDNAIfMissing();
        const asset = getAssetFromDNA(dna, assetId);
        if (asset) {
          asset.level = levelIndex + 1;
          dna.lastUpdatedAt = new Date().toISOString();
          saveDNA(dna);
          renderTree();
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
          phraseEl.textContent = phrase;
          phraseEl.style.display = "block";
          phraseInput.style.display = "none";
          phraseInput.value = phrase;
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
    localStorage.setItem(MODE_KEY, mode);
    modeInputs.forEach((input) => {
      input.checked = input.value === mode;
    });
    renderMastery(mode);
  };

  const storedMode = localStorage.getItem(MODE_KEY) || "sovereign";
  setMode(storedMode);

  modeInputs.forEach((input) => {
    input.addEventListener("change", () => setMode(input.value));
  });
};

const initPlanner = () => {
  renderPlanner();
  updateDayLabel();
  const notesToggle = document.getElementById("notes-toggle");
  const plannerReportsBtn = document.getElementById("planner-reports-btn");
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
    if (plannerLayout) plannerLayout.classList.toggle("week-view", mode === "week");
    if (timeline) timeline.classList.toggle("is-hidden", mode !== "day");
    if (bronzeBacklog) bronzeBacklog.classList.toggle("is-hidden", mode !== "day");
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

  // Botão de Relatórios
  if (plannerReportsBtn) {
    plannerReportsBtn.addEventListener("click", () => {
      playMetalClick();
      openPlannerReports();
    });
  }

  // Fechar modal de histórico
  const historyClose = document.getElementById("planner-history-close");
  const historyModal = document.getElementById("planner-history-modal");
  if (historyClose && historyModal) {
    historyClose.addEventListener("click", () => {
      historyModal.classList.remove("is-open");
    });
  }

  const historyDetailClose = document.getElementById("planner-history-detail-close");
  const historyDetailModal = document.getElementById("planner-history-detail-modal");
  if (historyDetailClose && historyDetailModal) {
    historyDetailClose.addEventListener("click", () => {
      historyDetailModal.classList.remove("is-open");
    });
  }

  // Inicializar tela de histórico
  const historyBackBtn = document.getElementById("history-back-btn");
  const historyNewReportBtn = document.getElementById("history-new-report-btn");
  const periodSelector = document.getElementById("history-period-selector");
  const scanContainer = document.getElementById("scan-container");

  if (historyBackBtn) {
    historyBackBtn.addEventListener("click", () => {
      playMetalClick();
      setActiveScreen("planner");
      if (scanContainer) {
        scanContainer.classList.add("is-hidden");
        scanContainer.querySelector("#scan-cards").innerHTML = "";
      }
    });
  }

  if (historyNewReportBtn) {
    historyNewReportBtn.addEventListener("click", () => {
      playMetalClick();
      openReportDateModal();
    });
  }

  // Modal de seleção de datas
  const reportDateModal = document.getElementById("report-date-modal");
  const reportDateClose = document.getElementById("report-date-close");
  const reportDateConfirm = document.getElementById("report-date-confirm");
  const reportDateStart = document.getElementById("report-date-start");
  const reportDateEnd = document.getElementById("report-date-end");

  if (reportDateClose) {
    reportDateClose.addEventListener("click", () => {
      playMetalClick();
      if (reportDateModal) reportDateModal.classList.remove("is-open");
    });
  }

  if (reportDateConfirm && reportDateStart && reportDateEnd) {
    reportDateConfirm.addEventListener("click", () => {
      const startValue = reportDateStart.value;
      const endValue = reportDateEnd.value;
      
      if (!startValue || !endValue) {
        alert("Por favor, selecione ambas as datas.");
        return;
      }

      const startDate = new Date(startValue);
      const endDate = new Date(endValue);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      if (startDate > endDate) {
        alert("A data de início deve ser anterior à data de fim.");
        return;
      }

      playMetalClick();
      if (reportDateModal) {
        reportDateModal.classList.remove("is-open");
      }
      
      // Pequeno delay para garantir que o modal fechou e DOM atualizou
      setTimeout(() => {
        try {
          startScanAnimation(startDate, endDate).catch((error) => {
            console.error("[Scan] Erro ao iniciar animação:", error);
            alert("Erro ao gerar relatório: " + error.message);
          });
        } catch (error) {
          console.error("[Scan] Erro ao chamar startScanAnimation:", error);
          alert("Erro ao gerar relatório: " + error.message);
        }
      }, 200);
    });
  }

  if (periodSelector) {
    periodSelector.querySelectorAll(".period-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        playMetalClick();
        periodSelector.querySelectorAll(".period-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const periodType = btn.dataset.period;
        renderHistoryList(periodType);
      });
    });
  }

  const scanCloseBtn = document.getElementById("scan-close-btn");
  if (scanCloseBtn) {
    scanCloseBtn.addEventListener("click", () => {
      playMetalClick();
      if (scanContainer) {
        scanContainer.classList.add("is-hidden");
        const scanCards = scanContainer.querySelector("#scan-cards");
        if (scanCards) scanCards.innerHTML = "";
      }
      if (window.lucide) window.lucide.createIcons();
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
  const resolveMood = (value) =>
    moods.find((mood) => value >= mood.min && value < mood.max) || moods[moods.length - 1];
  const updateMoodTrack = (value, mood) => {
    const clamped = Math.max(0, Math.min(100, value));
    range.style.background = `linear-gradient(90deg, ${mood.trackStart} 0%, ${mood.trackEnd} ${clamped}%, rgba(255, 255, 255, 0.12) ${clamped}%, rgba(255, 255, 255, 0.12) 100%)`;
  };
  const applyMood = (value) => {
    const mood = resolveMood(value);
    label.textContent = mood.label;
    const profile = loadProfile();
    saveProfile({ ...profile, moodLevel: value, moodColor: mood.color });
    updateMoodTrack(value, mood);
    updateIntegrityBar();
  };
  bar.addEventListener("click", () => {
    const profile = loadProfile();
    const current = Number(profile.moodLevel);
    range.value = Number.isNaN(current) ? 50 : current;
    applyMood(Number(range.value));
    modal.classList.add("is-open");
  });
  range.addEventListener("input", () => applyMood(Number(range.value)));
  if (close) close.addEventListener("click", () => modal.classList.remove("is-open"));
};

let appInitialized = false;
let offlineFallback = false;
let guestMode = localStorage.getItem("game_of_life.guest") === "true";

const initApp = () => {
  if (appInitialized) return;
  appInitialized = true;
  ensureV2Reset();
  const initialProfile = loadProfile();
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
  if (arenaAdd) {
    arenaAdd.addEventListener("click", () => {
      openArenaModal();
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
      if (!titleInput || !assetSelect || !descriptionInput) return;
      const title = titleInput.value.trim();
      if (!title) return;
      const description = descriptionInput.value.trim();
      const arenas = loadArenas();
      const newArena = {
        id: crypto.randomUUID(),
        title,
        completion: 0,
        assetId: assetSelect.value,
        targetCount: null,
        completedCount: 0,
        description,
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
      const weeklyTarget = atemporal ? null : weekdays.length;
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
                weekdays,
                atemporal,
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
          weekdays,
          atemporal,
          weeklyTarget,
          serious: !!seriousToggle.checked,
          status: "backlog",
          locked: false,
          createdDate: new Date().toISOString(),
        });
      }
      savePlanner(planner);
      renderPlanner();
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
  if (arenaDossierEditMeta && arenaDossier) {
    arenaDossierEditMeta.addEventListener("click", () => {
      const arenaId = arenaDossier.dataset.arenaId;
      if (!arenaId) return;
      const arenas = loadArenas();
      const arena = arenas.find((item) => item.id === arenaId);
      if (!arena) return;
      const current = typeof arena.targetCount === "number" ? String(arena.targetCount) : "";
      const nextRaw = window.prompt("Defina a Meta (numero). Deixe vazio para meta livre:", current);
      if (nextRaw === null) return;
      const trimmed = String(nextRaw).trim();
      const updatedArenas = arenas.map((item) => {
        if (item.id !== arenaId) return item;
        if (!trimmed) {
          const { targetCount, completedCount, ...rest } = item;
          return { ...rest };
        }
        const nextTarget = Math.max(0, Math.round(Number(trimmed || 0)));
        const currentCompleted = Number(item.completedCount || 0);
        const safeCompleted = Math.max(0, Math.min(nextTarget, currentCompleted));
        const completion = nextTarget ? Math.round((safeCompleted / nextTarget) * 100) : Number(item.completion || 0);
        return {
          ...item,
          targetCount: nextTarget,
          completedCount: safeCompleted,
          completion,
        };
      });
      saveArenas(updatedArenas);
      renderArenas();
      openArenaDossier(arenaId);
    });
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
      if (profileBannerDisplay) {
        const bannerText = profile.banner || "";
        const isImageBanner = bannerText.startsWith("http") || bannerText.startsWith("data:");
        profileBannerDisplay.textContent = isImageBanner ? "Banner Ativo" : bannerText || "Sem banner";
      }
      if (profile.avatar) {
        const profileAvatar = profileModal.querySelector(".profile-avatar");
        if (profileAvatar) profileAvatar.style.backgroundImage = `url(${profile.avatar})`;
      }
      if (profile.banner) {
        const bannerWrap = profileModal.querySelector(".profile-banner");
        if (bannerWrap) bannerWrap.style.backgroundImage = `url(${profile.banner})`;
        if (profileStrip) profileStrip.style.backgroundImage = `url(${profile.banner})`;
      }
      if (profileStrip && !profile.banner) {
        profileStrip.style.backgroundImage = "";
      }
      if (profileModal) {
        profileModal.dataset.card = profile.profileCardTheme || "gold";
      }
      if (profileCard) profileCard.classList.remove("is-editing");
      if (widgetGrid) {
        widgetGrid.innerHTML = "";
        const options = getSlotOptions();
        if (!Array.isArray(profile.widgets) || profile.widgets.length === 0) {
          const defaults = options.slice(0, 5).map((opt) => opt.id);
          profile = { ...profile, widgets: defaults, widgetsVisible: defaults.map(() => true) };
          saveProfile(profile);
        }
        const selected = Array.isArray(profile.widgets) ? profile.widgets : [];
        const visible = Array.isArray(profile.widgetsVisible) ? profile.widgetsVisible : [];
        for (let i = 0; i < 5; i += 1) {
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
            const updated = Array.isArray(loadProfile().widgets)
              ? [...loadProfile().widgets]
              : [];
            updated[i] = select.value;
            const nextProfile = loadProfile();
            const nextVisible = Array.isArray(nextProfile.widgetsVisible)
              ? [...nextProfile.widgetsVisible]
              : [];
            if (typeof nextVisible[i] !== "boolean") nextVisible[i] = true;
            const selectedGoldAssets = updated.filter(Boolean);
            saveProfile({
              ...nextProfile,
              widgets: selectedGoldAssets,
              widgetsVisible: nextVisible,
              selectedGoldAssets,
            });
            renderSocial();
            renderProfileWidgetDisplay(loadProfile(), seedDNAIfMissing());
          });
          const wrapper = document.createElement("div");
          wrapper.className = "widget-item";
          wrapper.appendChild(select);
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.className = "widget-toggle";
          const isOn = visible[i] !== false;
          toggle.textContent = isOn ? "Mostrar" : "Oculto";
          toggle.addEventListener("click", () => {
            const nextProfile = loadProfile();
            const nextVisible = Array.isArray(nextProfile.widgetsVisible)
              ? [...nextProfile.widgetsVisible]
              : [];
            nextVisible[i] = !isOn;
            saveProfile({ ...nextProfile, widgetsVisible: nextVisible });
            renderProfileWidgetDisplay(loadProfile(), seedDNAIfMissing());
            toggle.textContent = nextVisible[i] ? "Mostrar" : "Oculto";
          });
          wrapper.appendChild(toggle);
          widgetGrid.appendChild(wrapper);
        }
      }
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
      if (profileCard) profileCard.classList.remove("is-editing");
      profileModal.classList.add("is-open");
      if (profileIdentity) profileIdentity.focus();
    });
  }
  if (profileClose && profileModal) {
    profileClose.addEventListener("click", () => {
      profileModal.classList.remove("is-open");
    });
  }
  if (profileEdit) {
    profileEdit.addEventListener("click", () => {
      if (!profileCard) return;
      profileCard.classList.toggle("is-editing");
      if (profileCard.classList.contains("is-editing") && profileIdentity) {
        profileIdentity.focus();
      }
    });
  }

  if (profileSave) {
    profileSave.addEventListener("click", async () => {
      const current = loadProfile();
      const identity = profileIdentity?.value?.trim() || current.nickname || current.userId || "";
      const banner = current.banner || "";
      const cardTheme = profileModal?.dataset.card || current.profileCardTheme || "gold";
      const selectedGoldAssets = Array.isArray(current.widgets) ? current.widgets : [];
      const updated = {
        ...current,
        nickname: identity,
        userId: identity,
        banner,
        profileCardTheme: cardTheme,
        selectedGoldAssets,
      };
      saveProfile(updated);
      renderSocial();
      if (profileNameDisplay) profileNameDisplay.textContent = updated.nickname || updated.userId || "-";
      if (profileBannerDisplay) {
        const isImageBanner = updated.banner?.startsWith("http") || updated.banner?.startsWith("data:");
        profileBannerDisplay.textContent = isImageBanner ? "Banner Ativo" : updated.banner || "Sem banner";
      }
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
      if (profileCard) profileCard.classList.remove("is-editing");
      if (profileModal) profileModal.classList.remove("is-open");
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

  // Banner agora é escolhido pela lista (banner-modal).

  if (profileThemeButtons.length && profileModal) {
    profileThemeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const theme = btn.dataset.card || "gold";
        profileModal.dataset.card = theme;
        const profile = loadProfile();
        saveProfile({ ...profile, profileCardTheme: theme });
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

  // Banner agora é escolhido pela lista (banner-modal).
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
    const profile = loadProfile();
    const rewards = [
      {
        id: "direito",
        title: "PROFICIENCIA EM DIREITO",
        requirement: "Advogado por 5+ anos",
        unlocked: true,
      },
      {
        id: "baseline",
        title: "SEM BANNER",
        requirement: "Disponivel",
        unlocked: true,
      },
    ];
    bannerGrid.innerHTML = "";
    rewards.forEach((reward) => {
      const card = document.createElement("div");
      card.className = `banner-card${reward.unlocked ? " is-unlocked" : ""}`;
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
        const nextTitle = reward.id === "baseline" ? "" : reward.title;
        const updated = { ...loadProfile(), banner: nextTitle };
        saveProfile(updated);
        ensureSupabaseProfile(updated);
        syncProfileTotals(updated);
        renderSocial();
        const profileModal = document.getElementById("profile-modal");
        const bannerWrap = profileModal?.querySelector(".profile-banner");
        const profileStrip = document.getElementById("profile-strip");
        const bannerDisplay = document.getElementById("profile-banner-display");
        const bannerText = updated.banner || "";
        const isImageBanner = bannerText.startsWith("http") || bannerText.startsWith("data:");
        if (bannerDisplay) bannerDisplay.textContent = isImageBanner ? "Banner Ativo" : bannerText || "Sem banner";
        if (bannerWrap) bannerWrap.style.backgroundImage = isImageBanner ? `url(${bannerText})` : "";
        if (profileStrip) profileStrip.style.backgroundImage = isImageBanner ? `url(${bannerText})` : "";
        if (bannerModal) bannerModal.classList.remove("is-open");
      });
      card.appendChild(title);
      card.appendChild(req);
      card.appendChild(btn);
      bannerGrid.appendChild(card);
    });
    updateChecklistBadge();
  };
  renderBanners();
  if (bannerOpen && bannerModal) {
    bannerOpen.addEventListener("click", () => {
      renderBanners();
      bannerModal.classList.add("is-open");
    });
  }
  if (bannerClose && bannerModal) {
    bannerClose.addEventListener("click", () => bannerModal.classList.remove("is-open"));
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
      localStorage.removeItem("game_of_life.guest");
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
        const asset = getAssetFromDNA(dna, assetId);
        const lemaSlot = `${assetId}.lema`;
        const lemaValue = asset?.profileSlots?.[lemaSlot]?.value;
        if (lemaValue && assetId === "conexao") {
          const profile = loadProfile();
          const updated = { ...profile, banner: lemaValue };
          saveProfile(updated);
          ensureSupabaseProfile(updated);
          syncProfileTotals(updated);
        }
      }
      closeTreeEditor();
    });
  }
  if (treeEditEdit) {
    treeEditEdit.addEventListener("click", () => {
      const modal = document.getElementById("tree-edit-modal");
      if (!modal) return;
      modal.classList.toggle("is-editing");
      if (modal.classList.contains("is-editing")) {
        const list = document.getElementById("tree-slot-list");
        const first = list?.querySelector("input.profile-input");
        if (first) first.focus();
      }
    });
  }
  let storageUpdateTimer = null;
  let isHandlingStorage = false;
  window.addEventListener("storage", () => {
    if (isHandlingStorage) return;
    if (storageUpdateTimer) clearTimeout(storageUpdateTimer);
    isHandlingStorage = true;
    storageUpdateTimer = setTimeout(() => {
      try {
        renderTree();
        renderPlanner();
        renderArenas();
        renderSocial();
        applyGlitch();
      } finally {
        isHandlingStorage = false;
        storageUpdateTimer = null;
      }
    }, 100);
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

// ============================================
// HISTÓRICO E RELATÓRIOS (SCAN)
// ============================================

const formatShortDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
};

const getWeekEndDate = (weekStart) => {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const getHistoryWeekStart = (date) => {
  const start = getWeekStartDate(date);
  start.setHours(0, 1, 0, 0);
  return start;
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
  let totalHours = 0;

  actions.forEach((action) => {
    const plannedCount = countPlannedInRange(action, startDate, endDate);
    const weeklyTarget = getActionWeeklyTarget(action);
    const planned = plannedCount > 0 ? plannedCount : weeklyTarget;
    const done = Math.min(planned, countActionCompletionsInRange(action, startDate, endDate));
    if (planned <= 0 && done <= 0) return;

    const duration = parseDurationToMinutes(action.durationMinutes || 30);
    const hours = (done * duration) / 60;
    totalHours += hours;

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
    totalHours: Math.round(totalHours * 10) / 10,
    score,
  };
};

const buildHistoryPeriods = (periodType, planner, arenas) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const periods = [];
  let startDate, endDate, label;

  for (let i = 0; i < 12; i++) {
    switch (periodType) {
      case "week": {
        const weekStart = getHistoryWeekStart(today);
        weekStart.setDate(weekStart.getDate() - i * 7);
        startDate = new Date(weekStart);
        endDate = getWeekEndDate(weekStart);
        const weekNum = Math.floor((today - weekStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
        label = `Semana ${String(weekNum).padStart(2, "0")} - ${formatShortDate(startDate)} a ${formatShortDate(endDate)}`;
        break;
      }
      case "month": {
        startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        label = `${monthNames[startDate.getMonth()]}/${startDate.getFullYear()}`;
        break;
      }
      case "quarter": {
        const quarter = Math.floor(today.getMonth() / 3);
        const targetQuarter = quarter - i;
        const year = today.getFullYear() + Math.floor((targetQuarter) / 4);
        const q = ((targetQuarter % 4) + 4) % 4;
        startDate = new Date(year, q * 3, 1);
        endDate = new Date(year, (q + 1) * 3, 0, 23, 59, 59, 999);
        label = `T${q + 1} ${year}`;
        break;
      }
      case "semester": {
        const semester = Math.floor(today.getMonth() / 6);
        const targetSemester = semester - i;
        const year = today.getFullYear() + Math.floor((targetSemester) / 2);
        const s = ((targetSemester % 2) + 2) % 2;
        startDate = new Date(year, s * 6, 1);
        endDate = new Date(year, (s + 1) * 6, 0, 23, 59, 59, 999);
        label = `${s === 0 ? "1º" : "2º"} Semestre ${year}`;
        break;
      }
      case "year": {
        startDate = new Date(today.getFullYear() - i, 0, 1);
        endDate = new Date(today.getFullYear() - i, 11, 31, 23, 59, 59, 999);
        label = String(startDate.getFullYear());
        break;
      }
      default:
        return periods;
    }

    const summary = buildHistorySummaryForRange(planner, arenas, startDate, endDate);
    periods.push({
      key: `${periodType}-${i}`,
      periodType,
      startDate,
      endDate,
      label,
      ...summary,
    });
  }

  return periods;
};

const renderHistoryList = (periodType) => {
  const listEl = document.getElementById("history-list");
  if (!listEl) return;

  listEl.innerHTML = '<div class="config-placeholder">Carregando histórico...</div>';

  const planner = loadPlanner();
  const arenas = loadArenas();
  const periods = buildHistoryPeriods(periodType, planner, arenas);

  if (periods.length === 0) {
    listEl.innerHTML = '<div class="config-placeholder">Sem histórico ainda.</div>';
    return;
  }

  listEl.innerHTML = "";
  periods.forEach((period) => {
    const card = document.createElement("div");
    card.className = "history-summary-card";
    card.dataset.periodKey = period.key;

    const header = document.createElement("div");
    header.className = "history-summary-header";

    const label = document.createElement("div");
    label.className = "history-summary-label";
    label.textContent = period.label;

    const score = document.createElement("div");
    score.className = "history-summary-score";
    score.textContent = `${period.score}%`;

    header.appendChild(label);
    header.appendChild(score);

    const progress = document.createElement("div");
    progress.className = "history-summary-progress";
    const fill = document.createElement("div");
    fill.className = "history-summary-progress-fill";
    fill.style.width = `${Math.max(0, Math.min(100, period.score))}%`;
    progress.appendChild(fill);

    const meta = document.createElement("div");
    meta.className = "history-summary-meta";
    meta.textContent = `${period.totalDone}/${period.totalPlanned} ações • ${period.totalHours}h`;

    card.appendChild(header);
    card.appendChild(progress);
    card.appendChild(meta);

    listEl.appendChild(card);
  });
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
    <svg viewBox="0 0 ${size} ${size}" aria-label="Gráfico de teia">
      ${ringPolygons}
      ${axes}
      <polygon points="${dataPoints}" fill="rgba(250, 204, 21, 0.25)" stroke="rgba(250, 204, 21, 0.85)" stroke-width="1.5" />
      <circle cx="${center}" cy="${center}" r="2" fill="rgba(250, 204, 21, 0.9)" />
    </svg>
  `;
};

const renderScanCardRating = (report, container) => {
  const card = document.createElement("div");
  card.className = "scan-card scan-card-rating";
  const days = Math.ceil((report.endDate.getTime() - report.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const rating = report.score;
  card.innerHTML = `
    <div class="scan-card-header">
      <i data-lucide="star"></i>
      <span>Rating</span>
    </div>
    <div class="scan-card-body">
      <div class="scan-rating-number">${rating}</div>
      <div class="scan-rating-label">Performance</div>
      <div class="scan-rating-meta">Período analisado: ${days} dias</div>
    </div>
  `;
  container.appendChild(card);
  if (window.lucide) window.lucide.createIcons();
};

const renderScanCardMetrics = (report, container) => {
  const card = document.createElement("div");
  card.className = "scan-card scan-card-metrics";
  card.innerHTML = `
    <div class="scan-card-header">
      <i data-lucide="bar-chart-3"></i>
      <span>Métricas</span>
    </div>
    <div class="scan-card-body">
      <div class="scan-metric">
        <div class="scan-metric-label">Ações Cumpridas</div>
        <div class="scan-metric-value">${report.totalDone}</div>
      </div>
      <div class="scan-metric">
        <div class="scan-metric-label">Metas Batidas</div>
        <div class="scan-metric-value">${report.totalPlanned}</div>
      </div>
      <div class="scan-metric">
        <div class="scan-metric-label">Horas Totais</div>
        <div class="scan-metric-value">${report.totalHours}h</div>
      </div>
    </div>
  `;
  container.appendChild(card);
  if (window.lucide) window.lucide.createIcons();
};

const renderScanCardHighlight = (report, container) => {
  const arenas = loadArenas();
  const arenasById = new Map(arenas.map((a) => [a.id, a]));
  const actions = loadPlanner().bronzeActions || [];
  const actionCounts = new Map();
  const arenaCounts = new Map();

  actions.forEach((action) => {
    const done = countActionCompletionsInRange(action, report.startDate, report.endDate);
    if (done > 0) {
      actionCounts.set(action.id, (actionCounts.get(action.id) || 0) + done);
      arenaCounts.set(action.arenaId, (arenaCounts.get(action.arenaId) || 0) + done);
    }
  });

  let topAction = null;
  let topArena = null;
  let maxActionCount = 0;
  let maxArenaCount = 0;

  actionCounts.forEach((count, actionId) => {
    if (count > maxActionCount) {
      maxActionCount = count;
      topAction = actions.find((a) => a.id === actionId);
    }
  });

  arenaCounts.forEach((count, arenaId) => {
    if (count > maxArenaCount) {
      maxArenaCount = count;
      topArena = arenasById.get(arenaId);
    }
  });

  const card = document.createElement("div");
  card.className = "scan-card scan-card-highlight";
  card.innerHTML = `
    <div class="scan-card-header">
      <i data-lucide="award"></i>
      <span>Destaque</span>
    </div>
    <div class="scan-card-body">
      <div class="scan-highlight-item">
        <div class="scan-highlight-label">Arena Mais Focada</div>
        <div class="scan-highlight-value">${topArena?.title || "N/A"}</div>
      </div>
      <div class="scan-highlight-item">
        <div class="scan-highlight-label">Ação Mais Repetida</div>
        <div class="scan-highlight-value">${topAction?.title || "N/A"}</div>
      </div>
    </div>
  `;
  container.appendChild(card);
  if (window.lucide) window.lucide.createIcons();
};

const renderScanCardRadar = (report, container) => {
  const dna = seedDNAIfMissing();
  const assets = dna.assets;
  const statsById = new Map(report.stats.map((stat) => [stat.assetId, stat]));

  const values = assets.map((asset) => {
    const stat = statsById.get(asset.id);
    if (!stat || stat.planned <= 0) return 0;
    return Math.round((stat.done / stat.planned) * 100) / 100;
  });

  const card = document.createElement("div");
  card.className = "scan-card scan-card-radar";
  card.innerHTML = `
    <div class="scan-card-header">
      <i data-lucide="radar"></i>
      <span>Mapa de Teia</span>
    </div>
    <div class="scan-card-body">
      <div class="scan-radar-container">
        ${buildRadarSvg(values, [])}
        <div class="scan-radar-icons">
          ${assets.map((asset, index) => {
            const stat = statsById.get(asset.id);
            const percent = stat && stat.planned > 0 ? Math.round((stat.done / stat.planned) * 100) : 0;
            const angle = -90 + (360 / assets.length) * index;
            const rad = (angle * Math.PI) / 180;
            const x = 50 + 48 * Math.cos(rad);
            const y = 50 + 48 * Math.sin(rad);
            const iconName = ICON_BY_ID[asset.id] || "circle";
            return `
              <div class="scan-radar-icon" style="left: ${x}%; top: ${y}%;">
                <i data-lucide="${iconName}"></i>
                <div class="scan-radar-value">${percent}%</div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
      <div class="scan-radar-legend">
        ${assets.map((asset) => {
          const stat = statsById.get(asset.id);
          const percent = stat && stat.planned > 0 ? Math.round((stat.done / stat.planned) * 100) : 0;
          return `<div>${LABEL_BY_ID.get(asset.id) || asset.id}: ${percent}%</div>`;
        }).join("")}
      </div>
    </div>
  `;
  container.appendChild(card);
  if (window.lucide) window.lucide.createIcons();
};

const renderScanCardSummary = (report, container) => {
  const profile = loadProfile();
  const card = document.createElement("div");
  card.className = "scan-card scan-card-summary";
  card.id = "scan-summary-card";
  const periodLabel = `${formatShortDate(report.startDate)} a ${formatShortDate(report.endDate)}`;
  card.innerHTML = `
    <div class="scan-card-header">
      <i data-lucide="file-text"></i>
      <span>Resumo Final</span>
    </div>
    <div class="scan-card-body">
      <div class="scan-summary-identity">
        <div class="scan-summary-avatar" style="${profile?.avatar ? `background-image: url(${profile.avatar})` : ""}"></div>
        <div class="scan-summary-name">${profile?.nickname || profile?.full_name || "Jogador"}</div>
        <div class="scan-summary-level">Nível ${profile?.level || 0}</div>
      </div>
      <div class="scan-summary-rating">
        <div class="scan-summary-rating-number">${report.score}</div>
        <div class="scan-summary-rating-label">Rating</div>
      </div>
      <div class="scan-summary-radar-mini">
        ${buildRadarSvg(
          report.stats.map((stat) => {
            const total = report.stats.reduce((sum, s) => sum + s.planned, 0);
            return total > 0 ? stat.planned / total : 0;
          }),
          []
        )}
      </div>
      <div class="scan-summary-period">${periodLabel}</div>
      <button class="scan-summary-download gold-button" id="scan-summary-download">
        <i data-lucide="download"></i>
        <span>Baixar Relatório</span>
      </button>
    </div>
  `;
  container.appendChild(card);
  if (window.lucide) window.lucide.createIcons();

  const downloadBtn = document.getElementById("scan-summary-download");
  if (downloadBtn && window.html2canvas) {
    downloadBtn.addEventListener("click", async () => {
      const target = document.getElementById("scan-summary-card");
      if (!target) return;
      const canvas = await window.html2canvas(target, {
        backgroundColor: "#0f1115",
        scale: 2,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `relatorio-${formatDateKey(report.startDate)}-${formatDateKey(report.endDate)}.png`;
      link.click();
    });
  }
};

const openReportDateModal = () => {
  const modal = document.getElementById("report-date-modal");
  const startInput = document.getElementById("report-date-start");
  const endInput = document.getElementById("report-date-end");
  if (!modal || !startInput || !endInput) return;

  // Definir datas padrão: última semana
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  startInput.value = formatDateForInput(weekAgo);
  endInput.value = formatDateForInput(today);
  endInput.max = formatDateForInput(today); // Não permitir datas futuras
  startInput.max = formatDateForInput(today);

  modal.classList.add("is-open");
  if (window.lucide) window.lucide.createIcons();
};

const startScanAnimation = async (startDate, endDate) => {
  try {
    console.log("[Scan] Iniciando animação de scan", { startDate, endDate });
    
    const scanContainer = document.getElementById("scan-container");
    const scanAnimation = document.getElementById("scan-animation");
    const scanCards = document.getElementById("scan-cards");
    
    if (!scanContainer) {
      console.error("[Scan] scan-container não encontrado");
      alert("Erro: Container de scan não encontrado");
      return;
    }
    if (!scanAnimation) {
      console.error("[Scan] scan-animation não encontrado");
      alert("Erro: Elemento de animação não encontrado");
      return;
    }
    if (!scanCards) {
      console.error("[Scan] scan-cards não encontrado");
      alert("Erro: Container de cards não encontrado");
      return;
    }

    // Limpar cards anteriores e mostrar container
    scanCards.innerHTML = "";
    scanAnimation.classList.remove("is-scanning"); // Garantir que não está em estado anterior
    
    // Forçar display do container
    scanContainer.style.display = "flex";
    scanContainer.classList.remove("is-hidden");
    console.log("[Scan] Container exibido");
    
    // Scroll para o topo
    scanContainer.scrollTop = 0;

    // Pequeno delay para garantir que o DOM atualizou
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Gerar relatório
    let report;
    try {
      const planner = loadPlanner();
      const arenas = loadArenas();
      report = {
        startDate,
        endDate,
        ...buildHistorySummaryForRange(planner, arenas, startDate, endDate),
      };
      console.log("[Scan] Relatório gerado", report);
    } catch (error) {
      console.error("[Scan] Erro ao gerar relatório:", error);
      alert("Erro ao gerar relatório: " + error.message);
      scanContainer.classList.add("is-hidden");
      return;
    }

    // Mostrar animação de scan
    console.log("[Scan] Iniciando animação visual");
    
    // Garantir que a animação está visível
    scanAnimation.style.display = "flex";
    scanAnimation.classList.add("is-scanning");
    
    // Forçar reflow para garantir que a animação inicia
    void scanAnimation.offsetHeight;
    
    // Aguardar animação
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Remover animação
    scanAnimation.classList.remove("is-scanning");
    console.log("[Scan] Animação concluída, renderizando cards");

    // Renderizar cards sequencialmente (slides)
    const cards = [
      { render: () => renderScanCardRating(report, scanCards), delay: 800 },
      { render: () => renderScanCardMetrics(report, scanCards), delay: 800 },
      { render: () => renderScanCardHighlight(report, scanCards), delay: 800 },
      { render: () => renderScanCardRadar(report, scanCards), delay: 1000 },
      { render: () => renderScanCardSummary(report, scanCards), delay: 800 },
    ];

    for (let i = 0; i < cards.length; i++) {
      try {
        console.log(`[Scan] Renderizando card ${i + 1}/${cards.length}`);
        cards[i].render();
        if (window.lucide) window.lucide.createIcons();
        
        // Scroll suave para o novo card
        await new Promise((resolve) => setTimeout(resolve, 100));
        const lastCard = scanCards.lastElementChild;
        if (lastCard) {
          lastCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        
        await new Promise((resolve) => setTimeout(resolve, cards[i].delay));
      } catch (error) {
        console.error(`[Scan] Erro ao renderizar card ${i + 1}:`, error);
      }
    }
    
    console.log("[Scan] Todos os cards renderizados");
  } catch (error) {
    console.error("[Scan] Erro geral na animação:", error);
    alert("Erro ao gerar relatório: " + error.message);
    const scanContainer = document.getElementById("scan-container");
    if (scanContainer) {
      scanContainer.classList.add("is-hidden");
    }
  }
};

const openPlannerReports = () => {
  setActiveScreen("history");
  const periodSelector = document.getElementById("history-period-selector");
  const activePeriod = periodSelector?.querySelector(".period-btn.is-active")?.dataset.period || "week";
  renderHistoryList(activePeriod);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startAppWithSplash);
} else {
  startAppWithSplash();
}
