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
// Hold para completar: sempre 3 segundos (nunca 5s). Usado em bay, grid e pills.
// Pré-carregar skins do Supabase Storage
const preloadSkins = () => {
  console.log(" Iniciando pré-carregamento das skins do Supabase...");
  
  const supabaseUrl = supabaseConfig?.url;
  
  if (supabaseUrl) {
    const skinMapping = {
      gold: `${supabaseUrl}/storage/v1/object/public/huds/gold.jpg`,
      frost: `${supabaseUrl}/storage/v1/object/public/huds/frost.jpg`, 
      neon: `${supabaseUrl}/storage/v1/object/public/huds/neon.jpg`,
      ember: `${supabaseUrl}/storage/v1/object/public/huds/ember.jpg`,
      aurora: `${supabaseUrl}/storage/v1/object/public/huds/aurora.jpg`,
      cyber: `${supabaseUrl}/storage/v1/object/public/huds/neon.jpg`
    };
    
    Object.values(skinMapping).forEach(url => {
      console.log(` Pré-carregando: ${url}`);
      const img = new Image();
      img.onload = () => console.log(` Carregado: ${url}`);
      img.onerror = () => console.log(` Erro ao carregar: ${url}`);
      img.src = url;
    });
  } else {
    console.log(" Supabase não configurado, usando fallback gradients");
  }
};

// Pré-carregar imediatamente
preloadSkins();

const HOLD_DURATION_MS = 3000;
const HOLD_MS_CAPPED = Math.min(3000, HOLD_DURATION_MS);

const SEPHIROT = [
  { id: "consciencia", label: "CONSCIÊNCIA", row: 1, col: 2 },
  { id: "espaco-mental", label: "ESPAÇO MENTAL", row: 2, col: 1 },
  { id: "espiritualidade", label: "ESPIRITUALIDADE", row: 2, col: 3 },
  { id: "proposito", label: "PROPÓSITO", row: 3, col: 1 },
  { id: "projetos", label: "PROJETOS", row: 3, col: 3 },
  { id: "conexoes", label: "CONEXÕES", row: 4, col: 2 },
  { id: "trabalho", label: "TRABALHO/ESTUDOS", row: 5, col: 1 },
  { id: "financas", label: "FINANÇAS", row: 5, col: 3 },
  { id: "hobbies", label: "HOBBIES", row: 6, col: 2 },
  { id: "fisico", label: "FÍSICO", row: 7, col: 2 },
];

const LABEL_BY_ID = new Map(SEPHIROT.map((asset) => [asset.id, asset.label]));
const ICON_BY_ID = {
  consciencia: "crown",
  "espaco-mental": "brain",
  espiritualidade: "sparkles",
  proposito: "target",
  projetos: "briefcase",
  conexoes: "heart",
  financas: "wallet",
  trabalho: "book-open",
  hobbies: "gamepad-2",
  fisico: "dumbbell",
};
const BRONZE_ICONS = ["dumbbell", "book", "code", "dollar-sign", "flame", "leaf", "coffee", "music"];
const ARENA_ICONS = [
  "star", "shield", "gem", "target", "trophy", "crown", "flag", "sparkles",
  "zap", "swords", "briefcase", "dumbbell", "book", "code", "dollar-sign",
  "flame", "leaf", "coffee", "music", "brain", "users", "wallet", "gamepad-2"
];
const ALLIANCE_MOCK = ["@vitali", "@nyx", "@atlas", "@onyx"];
const SLOT_ICON_BY_ID = {
  "financas.ativo1": "car",
  "financas.ativo2": "building-2",
  "financas.ativo3": "briefcase",
  "trabalho.pec": "badge-check",
  "trabalho.unip": "graduation-cap",
  "trabalho.personal": "dumbbell",
};
const MASTERY_PHRASES = {
  consciencia: [
    "Nível 1: Sinto-me totalmente desconectado; a vida é um caos sem propósito.",
    "Nível 2: Raramente percebo beleza ou ordem; sinto-me isolado.",
    "Nível 3: Às vezes sinto uma breve gratidão, mas o ceticismo domina.",
    "Nível 4: Começo a praticar gratidão, mas ainda me sinto vítima das circunstâncias.",
    "Nível 5: Pratico a gratidão diariamente e percebo as primeiras sincronicidades.",
    "Nível 6: Sinto uma conexão frequente com a natureza e com o fluxo da vida.",
    "Nível 7: Confio no processo da vida; a gratidão é um estado quase constante.",
    "Nível 8: Percebo a interconexão entre todos os eventos e pessoas.",
    "Nível 9: Vivo em harmonia com as leis universais; paz profunda e duradoura.",
    "Nível 10: Estado de presença absoluta; sinto a Unidade com o Todo em cada respiração.",
  ],
  espiritualidade: [
    "Nível 1: Sem qualquer prática ou crença; vazio espiritual absoluto.",
    "Nível 2: Curiosidade vaga, mas sem disciplina ou rituais.",
    "Nível 3: Pratico rituais esporádicos quando estou em crise.",
    "Nível 4: Tenho um altar ou espaço, mas raramente o utilizo com foco.",
    "Nível 5: Rituais semanais estabelecidos; sinto o despertar da intuição.",
    "Nível 6: Prática diária constante; sinto proteção e orientação espiritual.",
    "Nível 7: Meus rituais são minha âncora; diálogo fluido com o sagrado.",
    "Nível 8: Intuição aguçada; recebo orientações claras através de rituais.",
    "Nível 9: Vida consagrada; cada ação é um ato de conexão espiritual.",
    "Nível 10: Mestria espiritual; canalização direta e comunhão ininterrupta.",
  ],
  "espaco-mental": [
    "Nível 1: Mente barulhenta, ansiosa e impossível de controlar.",
    "Nível 2: Pensamentos negativos dominam; sono perturbado pelo estresse.",
    "Nível 3: Tento meditar, mas me distraio em segundos; foco muito baixo.",
    "Nível 4: Consigo momentos breves de silêncio, mas a ansiedade retorna rápido.",
    "Nível 5: Meditação diária de 10 min; começo a observar os pensamentos.",
    "Nível 6: Capacidade de manter o foco por períodos longos; mente clara.",
    "Nível 7: Domínio sobre as reações emocionais; paz mental resiliente.",
    "Nível 8: Estado de Flow acessado à vontade; alta clareza cognitiva.",
    "Nível 9: Silêncio interior profundo; a mente é uma ferramenta perfeitamente afiada.",
    "Nível 10: Equanimidade absoluta; consciência pura acima de qualquer turbulência.",
  ],
  proposito: [
    "Nível 1: Sem direção ou propósito; sinto-me perdido na vida.",
    "Nível 2: Busco sentido, mas não encontro clareza sobre meu caminho.",
    "Nível 3: Tenho valores, mas minhas ações não os refletem.",
    "Nível 4: Começo a alinhar minhas decisões com meus valores.",
    "Nível 5: Tenho uma missão clara e tomo ações alinhadas.",
    "Nível 6: Minha vida tem direção; sinto-me realizado e focado.",
    "Nível 7: Sou um guia para outros; meu propósito inspira.",
    "Nível 8: Vivo em total alinhamento com minha essência.",
    "Nível 9: Sou um catalisador de transformação; meu propósito impacta.",
    "Nível 10: Alinhamento supremo; minha identidade é um reflexo do meu destino.",
  ],
  projetos: [
    "Nível 1: Sem sonhos ou projetos; a vida é uma repetição monótona.",
    "Nível 2: Tenho ideias, mas nunca começo nada por medo do fracasso.",
    "Nível 3: Começo projetos, mas desisto na primeira dificuldade.",
    "Nível 4: Trabalho em projetos, mas sem consistência ou visão clara.",
    "Nível 5: Um projeto ativo e consistente; criatividade fluindo semanalmente.",
    "Nível 6: Criatividade estratégica; executo ideias com eficiência.",
    "Nível 7: Projetos geram impacto real; sinto-me inspirado diariamente.",
    "Nível 8: Magnetismo criativo; ideias e recursos convergem para mim.",
    "Nível 9: Legado em construção; meus projetos expressam minha essência.",
    "Nível 10: Gênio criativo; canalização ininterrupta de inovação e beleza.",
  ],
  conexoes: [
    "Nível 1: Isolamento total; sinto-me sozinho e incompreendido.",
    "Nível 2: Relações superficiais; dificuldade em confiar nos outros.",
    "Nível 3: Tenho amigos, mas raramente me abro verdadeiramente.",
    "Nível 4: Tento me abrir, mas ainda carrego muitas mágoas do passado.",
    "Nível 5: Relacionamentos saudáveis; prática ativa de perdão e escuta.",
    "Nível 6: Círculo íntimo de alta confiança; sinto-me valorizado.",
    "Nível 7: Capacidade de amar incondicionalmente sem perder os limites.",
    "Nível 8: Mentor e apoio para outros; relações baseadas em crescimento.",
    "Nível 9: Irradio compaixão; presença que cura e acolhe.",
    "Nível 10: União profunda; mestre em criar e nutrir vínculos sagrados.",
  ],
  abundancia: [
    "Nível 1: Escassez total; dívidas fora de controle e medo do amanhã.",
    "Nível 2: Vivo para pagar contas; o dinheiro é fonte de estresse.",
    "Nível 3: Ganho o suficiente para sobreviver, mas não tenho reservas.",
    "Nível 4: Dificuldade em gerir o que ganho; mentalidade de escassez.",
    "Nível 5: Orçamento controlado; investimentos iniciados.",
    "Nível 6: Fluxo de caixa positivo; clareza total sobre ativos.",
    "Nível 7: Independência financeira crescendo; o dinheiro trabalha para mim.",
    "Nível 8: Abundância gerada por propósito; recursos sobram para sonhos.",
    "Nível 9: Liberdade total; riqueza flui de múltiplas fontes estáveis.",
    "Nível 10: Consciência de prosperidade infinita; mestre da manifestação.",
  ],
  trabalho: [
    "Nível 1: Odeio minha rotina; sinto-me escravizado pelas tarefas.",
    "Nível 2: Trabalho apenas pelo dinheiro; produtividade baixa.",
    "Nível 3: Busco melhorar, mas sinto-me perdido profissionalmente.",
    "Nível 4: Executo minhas tarefas, mas sem brilho ou excelência.",
    "Nível 5: Profissional competente; estudo e evoluo constantemente.",
    "Nível 6: Excelência reconhecida; entrego valor real ao mundo.",
    "Nível 7: Trabalho alinhado ao propósito; satisfação no esforço.",
    "Nível 8: Autoridade na minha área; mestre em gestão de tempo.",
    "Nível 9: Liderança inspiradora; meu trabalho é minha arte.",
    "Nível 10: Maestria profissional; impacto global através da vocação.",
  ],
  hobbies: [
    "Nível 1: Sem hobbies; tempo gasto em distrações vazias.",
    "Nível 2: Sinto tédio; esqueci o que me dava prazer.",
    "Nível 3: Tenho um hobby, mas sinto culpa ao dedicar tempo.",
    "Nível 4: Pratico hobbies raramente; falta de autenticidade.",
    "Nível 5: Tempo semanal sagrado para hobbies; renovação de energia.",
    "Nível 6: Desenvolvo habilidades únicas por puro prazer.",
    "Nível 7: Minha personalidade brilha através dos meus interesses.",
    "Nível 8: Mestre em um hobby; criatividade e diversão integradas.",
    "Nível 9: Estilo de vida autêntico; sou fiel a mim mesmo sempre.",
    "Nível 10: Expressão pura do Ser; minha existência é uma arte única.",
  ],
  fisico: [
    "Nível 1: Sedentarismo total; corpo fraco ou sem energia.",
    "Nível 2: Alimentação péssima; cansaço crônico e sono ruim.",
    "Nível 3: Tento treinar, mas desisto em duas semanas.",
    "Nível 4: Treino esporádico; desconforto com a própria forma.",
    "Nível 5: Treino 3x por semana; consciência alimentar iniciada.",
    "Nível 6: Corpo atlético e funcional; energia estável.",
    "Nível 7: Alta performance física; disciplina inabalável.",
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
  consciencia: "consciencia",
  espiritualidade: "espiritualidade",
  "espaco-mental": "espaco-mental",
  proposito: "proposito",
  projetos: "projetos",
  conexoes: "conexoes",
  financas: "financas",
  trabalho: "trabalho",
  hobbies: "hobbies",
  fisico: "fisico",
};
const PROTOCOL_SLOTS = {
  consciencia: [
    { id: "consciencia.lema", label: "Lema de Vida", type: "rect-wide" },
    { id: "consciencia.crenca1", label: "Crenca Principal 1", type: "rect-wide" },
    { id: "consciencia.crenca2", label: "Crenca Principal 2", type: "rect-wide" },
    { id: "consciencia.crenca3", label: "Crenca Principal 3", type: "rect-wide" },
  ],
  espiritualidade: [
    { id: "espiritualidade.sistema", label: "Sistema", type: "rect" },
    { id: "espiritualidade.entidade1", label: "Entidade Lider", type: "square-2" },
    { id: "espiritualidade.entidade2", label: "Entidade Protetora", type: "square-2" },
  ],
  "espaco-mental": [
    { id: "espaco-mental.filosofia", label: "Filosofia Operacional", type: "rect-wide" },
  ],
  proposito: [
    { id: "proposito.mtp", label: "Missao de Vida", type: "rect-wide-tall" },
    { id: "proposito.trait1", label: "Trait 1", type: "rect-small" },
    { id: "proposito.trait2", label: "Trait 2", type: "rect-small" },
    { id: "proposito.trait3", label: "Trait 3", type: "rect-small" },
    {
      id: "proposito.nascimento",
      label: "Nascimento",
      type: "rect-small",
      fields: [
        { key: "dia", label: "Dia", slider: { min: 1, max: 31, step: 1, unit: "" } },
        { key: "mes", label: "Mes", slider: { min: 1, max: 12, step: 1, unit: "" } },
      ],
    },
    { id: "proposito.signo", label: "Signo", type: "rect-small" },
    { id: "proposito.mbti", label: "MBTI", type: "rect-small" },
    { id: "proposito.foto1", label: "Foto 1", type: "square-2" },
    { id: "proposito.foto2", label: "Foto 2", type: "square-2" },
    { id: "proposito.foto3", label: "Foto 3", type: "square-2" },
  ],
  projetos: [
    {
      id: "projetos.proj1",
      label: "Projeto 1",
      type: "square-2",
      fields: [
        { key: "nome", label: "Nome" },
        { key: "logo", label: "Logo" },
        { key: "progresso", label: "Progresso" },
      ],
    },
    {
      id: "projetos.proj2",
      label: "Projeto 2",
      type: "square-2",
      fields: [
        { key: "nome", label: "Nome" },
        { key: "logo", label: "Logo" },
        { key: "progresso", label: "Progresso" },
      ],
    },
    {
      id: "projetos.proj3",
      label: "Projeto 3",
      type: "square-2",
      fields: [
        { key: "nome", label: "Nome" },
        { key: "logo", label: "Logo" },
        { key: "progresso", label: "Progresso" },
      ],
    },
  ],
  conexoes: [
    {
      id: "conexoes.conexao1",
      label: "Conexao 1",
      type: "square",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "nome", label: "Nome (Topo)" },
        { key: "nota", label: "Nota (Baixo)" },
      ],
    },
    {
      id: "conexoes.conexao2",
      label: "Conexao 2",
      type: "square",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "nome", label: "Nome (Topo)" },
        { key: "nota", label: "Nota (Baixo)" },
      ],
    },
    {
      id: "conexoes.conexao3",
      label: "Conexao 3",
      type: "square",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "nome", label: "Nome (Topo)" },
        { key: "nota", label: "Nota (Baixo)" },
      ],
    },
    {
      id: "conexoes.conexao4",
      label: "Conexao 4",
      type: "square",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "nome", label: "Nome (Topo)" },
        { key: "nota", label: "Nota (Baixo)" },
      ],
    },
    {
      id: "conexoes.conexao5",
      label: "Conexao 5",
      type: "square",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "nome", label: "Nome (Topo)" },
        { key: "nota", label: "Nota (Baixo)" },
      ],
    },
    {
      id: "conexoes.conexao6",
      label: "Conexao 6",
      type: "square",
      fields: [
        { key: "foto", label: "Foto" },
        { key: "nome", label: "Nome (Topo)" },
        { key: "nota", label: "Nota (Baixo)" },
      ],
    },
  ],
  financas: [
    { id: "financas.renda", label: "Renda Mensal", type: "rect-wide", fields: [{ key: "valor", label: "Renda", slider: { min: 0, max: 50000, step: 100, unit: "R$" } }] },
    { id: "financas.gasto", label: "Gasto Mensal", type: "rect-wide", fields: [{ key: "valor", label: "Gasto", slider: { min: 0, max: 50000, step: 100, unit: "R$" } }] },
    { id: "financas.liquidez", label: "Liquidez", type: "rect-wide", fields: [{ key: "valor", label: "Liquidez", slider: { min: 0, max: 200000, step: 100, unit: "R$" } }] },
    { id: "financas.ativo1", label: "Ativo 1", type: "square-2" },
    { id: "financas.ativo2", label: "Ativo 2", type: "square-2" },
    { id: "financas.ativo3", label: "Ativo 3", type: "square-2" },
  ],
  trabalho: [
    { id: "trabalho.pec", label: "Classe 1", type: "rect" },
    { id: "trabalho.unip", label: "Classe 2", type: "rect" },
    { id: "trabalho.personal", label: "Classe 3", type: "rect" },
    { id: "trabalho.cursos", label: "Cursos", type: "rect-wide" },
    { id: "trabalho.historico", label: "Historico", type: "rect-wide" },
  ],
  hobbies: [
    {
      id: "hobbies.hobby1",
      label: "Hobby 1",
      type: "square-2",
      fields: [
        { key: "hobby", label: "Hobby" },
        { key: "logo", label: "Logo" },
        { key: "rank", label: "Rank" },
      ],
    },
    {
      id: "hobbies.hobby2",
      label: "Hobby 2",
      type: "square-2",
      fields: [
        { key: "hobby", label: "Hobby" },
        { key: "logo", label: "Logo" },
        { key: "rank", label: "Rank" },
      ],
    },
    {
      id: "hobbies.hobby3",
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
  if (assetId !== "consciencia") {
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
  
  // Se já é um número, retornar diretamente
  if (typeof raw === 'number') {
    return Number.isNaN(raw) ? 30 : raw;
  }
  
  // Se é string, fazer o parsing
  if (typeof raw === 'string') {
    const value = raw.toLowerCase().replace(/\s/g, "");
    const hourMatch = value.match(/(\d+)\s*h/);
    const minMatch = value.match(/(\d+)\s*m/);
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minMatch ? Number(minMatch[1]) : 0;
    if (hours || minutes) return hours * 60 + minutes;
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber)) return asNumber;
  }
  
  // Fallback: tentar converter para número
  const asNumber = Number(raw);
  if (!Number.isNaN(asNumber)) return asNumber;
  
  return 30;
};

const REPORTS_KEY = "gameoflife_reports_v1";

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

const saveReportToHistory = (report) => {
  try {
    console.log("[Reports] Salvando relatório:", report);
    const reports = loadReports();
    const reportId = `report_${Date.now()}`;
    
    // Garantir que as datas são objetos Date
    const startDate = report.startDate instanceof Date ? report.startDate : new Date(report.startDate);
    const endDate = report.endDate instanceof Date ? report.endDate : new Date(report.endDate);
    
    const reportData = {
      id: reportId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      score: report.score || 0,
      totalPlanned: report.totalPlanned || 0,
      totalDone: report.totalDone || 0,
      totalHours: report.totalHours || 0,
      stats: report.stats || [],
      createdAt: new Date().toISOString(),
    };
    
    reports.push(reportData);
    // Manter apenas os últimos 50 relatórios
    if (reports.length > 50) {
      reports.shift();
    }
    
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    console.log("[Reports] Relatório salvo com sucesso:", reportId);
    console.log("[Reports] Total de relatórios salvos:", reports.length);
    
    // Verificar se foi salvo corretamente
    const saved = loadReports();
    console.log("[Reports] Verificação - relatórios no localStorage:", saved.length);
  } catch (error) {
    console.error("[Reports] Erro ao salvar relatório:", error);
    console.error("[Reports] Stack trace:", error.stack);
  }
};

const loadReports = () => {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error("[Reports] Erro ao carregar relatórios:", error);
    return [];
  }
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
  console.log(`🎨 Mudando tema para: ${theme}`);
  document.documentElement.dataset.theme = theme || "gold";
  const profile = loadProfile();
  saveProfile({ ...profile, theme: theme || "gold" });
  
  // Re-renderizar sephirots para aplicar nova skin
  renderTree();
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

// Função de debug para listar todos os buckets e arquivos
const debugListAllStorage = async () => {
  if (!isSupabaseEnabled()) {
    console.log("[Debug] Supabase não habilitado");
    return;
  }
  console.log("[Debug] === LISTANDO TODOS OS BUCKETS E ARQUIVOS ===");
  
  // Lista de buckets comuns para tentar
  const commonBuckets = ["banners", "borders", "avatars", "app-assets", "assets", "images", "skins"];
  
  for (const bucketName of commonBuckets) {
    try {
      const { data, error } = await supabase.storage.from(bucketName).list("", {
        limit: 100,
      });
      
      if (error) {
        if (error.message?.includes("not found") || error.message?.includes("Bucket")) {
          console.log(`[Debug] Bucket "${bucketName}" não existe`);
        } else {
          console.log(`[Debug] Erro ao acessar bucket "${bucketName}":`, error.message);
        }
        continue;
      }
      
      if (data && data.length > 0) {
        console.log(`[Debug] ✅ Bucket "${bucketName}" encontrado com ${data.length} itens:`);
        data.forEach((item, idx) => {
          console.log(`  [${idx + 1}] ${item.name} (${item.id || 'sem id'}) - ${item.metadata?.size || 'tamanho desconhecido'} bytes`);
        });
        
        // Tentar listar subpastas também
        const folders = data.filter(item => !item.name.includes('.'));
        if (folders.length > 0) {
          console.log(`[Debug] Encontradas ${folders.length} possíveis pastas em "${bucketName}"`);
          for (const folder of folders.slice(0, 5)) {
            const subResult = await supabase.storage.from(bucketName).list(folder.name, { limit: 50 });
            if (subResult.data && subResult.data.length > 0) {
              console.log(`[Debug]   Pasta "${folder.name}" tem ${subResult.data.length} arquivos:`);
              subResult.data.forEach(file => {
                console.log(`    - ${file.name}`);
              });
            }
          }
        }
      } else {
        console.log(`[Debug] Bucket "${bucketName}" existe mas está vazio`);
        // Tentar descobrir arquivos via URLs diretas
        if (bucketName === "banners" || bucketName === "borders") {
          console.log(`[Debug] Tentando descobrir arquivos em "${bucketName}" via URLs diretas...`);
          const testNames = [];
          for (let i = 1; i <= 5; i++) {
            testNames.push(
              `${bucketName === "banners" ? "banner" : "border"}${i}.png`,
              `${bucketName === "banners" ? "banner" : "border"}${i}.jpg`,
              `${bucketName === "banners" ? "banner" : "border"}-${i}.png`,
              `${bucketName === "banners" ? "banner" : "border"}-${i}.jpg`,
              `${i}.png`,
              `${i}.jpg`
            );
          }
          const found = [];
          for (const fileName of testNames) {
            const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
            const publicUrl = urlData?.publicUrl || "";
            try {
              const img = new Image();
              await new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error("Not found"));
                img.src = publicUrl;
                setTimeout(() => reject(new Error("Timeout")), 1000);
              });
              found.push(fileName);
              console.log(`[Debug] ✅ Arquivo encontrado via URL direta: ${fileName}`);
            } catch (e) {
              // Não encontrado
            }
          }
          if (found.length > 0) {
            console.log(`[Debug] ✅ Total de ${found.length} arquivos encontrados via URLs diretas em "${bucketName}"`);
          } else {
            console.log(`[Debug] ⚠️ Nenhum arquivo encontrado via URLs diretas em "${bucketName}"`);
          }
        }
      }
    } catch (err) {
      console.log(`[Debug] Erro ao verificar bucket "${bucketName}":`, err.message);
    }
  }
  console.log("[Debug] === FIM DA LISTAGEM ===");
};

// Buscar URLs de banners e bordas do Supabase storage
const getBannersFromStorage = async () => {
  if (!isSupabaseEnabled()) {
    console.log("[Banners] Supabase não habilitado");
    return [];
  }
  try {
    console.log("[Banners] Buscando banners do storage...");
    
    const bucketName = "banners";
    let allFiles = [];
    
    try {
      // Tentar listar arquivos (pode falhar se não houver policies)
      const { data, error } = await supabase.storage.from(bucketName).list("", {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      });
      
      if (error) {
        console.warn(`[Banners] Não foi possível listar arquivos:`, error.message);
        console.log(`[Banners] Tentando URLs diretas com nomes comuns...`);
        
        // Se não conseguir listar, tentar URLs diretas com nomes comuns
        // Tentar vários padrões de nomes possíveis
        const commonNames = [];
        
        // Padrões numéricos
        for (let i = 1; i <= 10; i++) {
          commonNames.push(
            `banner${i}.png`, `banner${i}.jpg`, `banner${i}.jpeg`, `banner${i}.webp`,
            `banner-${i}.png`, `banner-${i}.jpg`, `banner-${i}.jpeg`, `banner-${i}.webp`,
            `banner_${i}.png`, `banner_${i}.jpg`, `banner_${i}.jpeg`, `banner_${i}.webp`,
            `${i}.png`, `${i}.jpg`, `${i}.jpeg`, `${i}.webp`,
            `Banner${i}.png`, `Banner${i}.jpg`, `Banner-${i}.png`, `Banner-${i}.jpg`
          );
        }
        
        // Padrões com títulos (baseado no que você mencionou que tem título)
        const titles = ["ouro", "prata", "bronze", "diamante", "platina", "gold", "silver"];
        titles.forEach(title => {
          commonNames.push(
            `banner-${title}.png`, `banner-${title}.jpg`, `banner_${title}.png`, `banner_${title}.jpg`,
            `${title}.png`, `${title}.jpg`, `${title}-banner.png`, `${title}-banner.jpg`
          );
        });
        
        console.log(`[Banners] Testando ${commonNames.length} possíveis nomes de arquivo...`);
        
        const results = [];
        let tested = 0;
        
        // Testar em lotes para não travar
        for (const fileName of commonNames) {
          tested++;
          if (tested % 10 === 0) {
            console.log(`[Banners] Testados ${tested}/${commonNames.length}...`);
          }
          
          const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
          const publicUrl = urlData?.publicUrl || "";
          
          // Tentar carregar a imagem para verificar se existe (com timeout curto)
          try {
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error("Not found"));
              img.src = publicUrl;
              setTimeout(() => reject(new Error("Timeout")), 1500);
            });
            console.log(`[Banners] ✅ Arquivo encontrado: ${fileName}`);
            const cleanName = fileName.replace(/\.(png|jpg|jpeg|webp)$/i, "").replace(/banner[-_]?/gi, "").trim();
            const title = cleanName || fileName.replace(/\.[^/.]+$/, "");
            results.push({
              id: `banner-${fileName.replace(/\.[^/.]+$/, "")}`,
              title: title.charAt(0).toUpperCase() + title.slice(1) || `Banner ${fileName}`,
              imageUrl: publicUrl,
              unlocked: true,
            });
          } catch (e) {
            // Arquivo não existe, continuar
          }
        }
        
        if (results.length > 0) {
          console.log(`[Banners] ✅ ${results.length} banners encontrados via URLs diretas`);
          return results;
        }
        
        console.warn(`[Banners] Nenhum banner encontrado.`);
        console.warn(`[Banners] DICA: Crie uma policy SELECT pública para o bucket "banners" ou informe os nomes exatos dos arquivos.`);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.warn(`[Banners] Bucket "${bucketName}" está vazio, tentando URLs diretas...`);
        // Continuar para tentar URLs diretas mesmo quando o bucket está vazio
      } else {
        // Se encontrou arquivos, processar normalmente
        console.log(`[Banners] Encontrados ${data.length} itens no bucket "${bucketName}":`);
        data.forEach((item, idx) => {
          console.log(`  [${idx + 1}] ${item.name} (${item.id || 'sem id'})`);
        });
        
        // Separar arquivos e pastas
        const files = data.filter(item => item.name.includes('.'));
        const folders = data.filter(item => !item.name.includes('.'));
        
        console.log(`[Banners] Arquivos: ${files.length}, Pastas: ${folders.length}`);
        
        // Processar arquivos na raiz
        const imageFiles = files.filter((file) => {
          const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
          return isImage && !file.name.startsWith(".");
        });
        
        allFiles.push(...imageFiles.map(f => ({ ...f, path: f.name })));
        
        // Processar arquivos nas pastas
        for (const folder of folders.slice(0, 10)) {
          const folderResult = await supabase.storage.from(bucketName).list(folder.name, { limit: 100 });
          if (folderResult.data && folderResult.data.length > 0) {
            const folderImages = folderResult.data.filter((file) => {
              const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
              return isImage && !file.name.startsWith(".");
            });
            allFiles.push(...folderImages.map(f => ({ ...f, path: `${folder.name}/${f.name}` })));
          }
        }
        
        console.log(`[Banners] ✅ Total de ${allFiles.length} imagens encontradas`);
        
        if (allFiles.length > 0) {
          const result = allFiles.map((file) => {
            const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(file.path);
            const publicUrl = urlData?.publicUrl || "";
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            const title = fileName.replace(/banner|Banner/gi, "").trim() || fileName;
            
            return {
              id: `banner-${file.id || file.name.replace(/\.[^/.]+$/, "")}`,
              title: title.charAt(0).toUpperCase() + title.slice(1) || `Banner ${file.name}`,
              imageUrl: publicUrl,
              unlocked: true,
            };
          });
          
          console.log(`[Banners] ✅ Retornando ${result.length} banners`);
          return result;
        }
      }
      
      // Se chegou aqui e o bucket está vazio, tentar fallback de URLs diretas
      console.log(`[Banners] Tentando URLs diretas com nomes comuns...`);
      
      // Tentar vários padrões de nomes possíveis
      const commonNames = [];
      
      // Padrões numéricos
      for (let i = 1; i <= 10; i++) {
        commonNames.push(
          `banner${i}.png`, `banner${i}.jpg`, `banner${i}.jpeg`, `banner${i}.webp`,
          `banner-${i}.png`, `banner-${i}.jpg`, `banner-${i}.jpeg`, `banner-${i}.webp`,
          `banner_${i}.png`, `banner_${i}.jpg`, `banner_${i}.jpeg`, `banner_${i}.webp`,
          `${i}.png`, `${i}.jpg`, `${i}.jpeg`, `${i}.webp`,
          `Banner${i}.png`, `Banner${i}.jpg`, `Banner-${i}.png`, `Banner-${i}.jpg`
        );
      }
      
      // Padrões com títulos
      const titles = ["ouro", "prata", "bronze", "diamante", "platina", "gold", "silver"];
      titles.forEach(title => {
        commonNames.push(
          `banner-${title}.png`, `banner-${title}.jpg`, `banner_${title}.png`, `banner_${title}.jpg`,
          `${title}.png`, `${title}.jpg`, `${title}-banner.png`, `${title}-banner.jpg`
        );
      });
      
      console.log(`[Banners] Testando ${commonNames.length} possíveis nomes de arquivo...`);
      
      const results = [];
      let tested = 0;
      
      // Testar em lotes para não travar
      for (const fileName of commonNames) {
        tested++;
        if (tested % 10 === 0) {
          console.log(`[Banners] Testados ${tested}/${commonNames.length}...`);
        }
        
        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        const publicUrl = urlData?.publicUrl || "";
        
        // Tentar carregar a imagem para verificar se existe (com timeout curto)
        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Not found"));
            img.src = publicUrl;
            setTimeout(() => reject(new Error("Timeout")), 1500);
          });
          console.log(`[Banners] ✅ Arquivo encontrado: ${fileName}`);
          const cleanName = fileName.replace(/\.(png|jpg|jpeg|webp)$/i, "").replace(/banner[-_]?/gi, "").trim();
          const title = cleanName || fileName.replace(/\.[^/.]+$/, "");
          results.push({
            id: `banner-${fileName.replace(/\.[^/.]+$/, "")}`,
            title: title.charAt(0).toUpperCase() + title.slice(1) || `Banner ${fileName}`,
            imageUrl: publicUrl,
            unlocked: true,
          });
        } catch (e) {
          // Arquivo não existe, continuar
        }
      }
      
      if (results.length > 0) {
        console.log(`[Banners] ✅ ${results.length} banners encontrados via URLs diretas`);
        return results;
      }
      
      console.warn(`[Banners] Nenhum banner encontrado.`);
      console.warn(`[Banners] DICA: Verifique se os arquivos estão no bucket "banners" ou informe os nomes exatos dos arquivos.`);
      return [];
      
    } catch (err) {
      console.error(`[Banners] Erro ao buscar no bucket "${bucketName}":`, err);
      console.error(`[Banners] Stack:`, err.stack);
      return [];
    }
  } catch (error) {
    console.error("[Banners] Erro geral:", error);
    logSupabaseError("storage.list.banners", error);
    return [];
  }
};

const getBordersFromStorage = async () => {
  if (!isSupabaseEnabled()) {
    console.log("[Borders] Supabase não habilitado");
    return [];
  }
  try {
    console.log("[Borders] Buscando bordas do storage...");
    
    const bucketName = "borders";
    let allFiles = [];
    
    try {
      // Tentar listar arquivos (pode falhar se não houver policies)
      const { data, error } = await supabase.storage.from(bucketName).list("", {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      });
      
      if (error) {
        console.warn(`[Borders] Não foi possível listar arquivos:`, error.message);
      }
      
      if (error || !data || data.length === 0) {
        if (!error && (!data || data.length === 0)) {
          console.warn(`[Borders] Bucket "${bucketName}" está vazio`);
        }
        console.log(`[Borders] Tentando URLs diretas com nomes comuns...`);
        
        // Tentar URLs diretas com nomes comuns
        const commonNames = [];
        
        // Padrões numéricos
        for (let i = 1; i <= 10; i++) {
          commonNames.push(
            `border${i}.png`, `border${i}.jpg`, `border${i}.jpeg`, `border${i}.webp`,
            `border-${i}.png`, `border-${i}.jpg`, `border-${i}.jpeg`, `border-${i}.webp`,
            `border_${i}.png`, `border_${i}.jpg`, `border_${i}.jpeg`, `border_${i}.webp`,
            `borda${i}.png`, `borda${i}.jpg`, `borda-${i}.png`, `borda-${i}.jpg`,
            `slot${i}.png`, `slot${i}.jpg`, `slot-${i}.png`, `slot-${i}.jpg`,
            `${i}.png`, `${i}.jpg`, `${i}.jpeg`, `${i}.webp`,
            `Border${i}.png`, `Border${i}.jpg`, `Borda${i}.png`, `Borda${i}.jpg`
          );
        }
        
        // Padrões com títulos
        const titles = ["ouro", "prata", "bronze", "diamante", "platina", "gold", "silver", "slot"];
        titles.forEach(title => {
          commonNames.push(
            `border-${title}.png`, `border-${title}.jpg`, `border_${title}.png`, `border_${title}.jpg`,
            `borda-${title}.png`, `borda-${title}.jpg`, `borda_${title}.png`, `borda_${title}.jpg`,
            `${title}.png`, `${title}.jpg`, `${title}-border.png`, `${title}-border.jpg`,
            `${title}-borda.png`, `${title}-borda.jpg`
          );
        });
        
        console.log(`[Borders] Testando ${commonNames.length} possíveis nomes de arquivo...`);
        
        const results = [];
        let tested = 0;
        
        // Testar em lotes para não travar
        for (const fileName of commonNames) {
          tested++;
          if (tested % 10 === 0) {
            console.log(`[Borders] Testados ${tested}/${commonNames.length}...`);
          }
          
          const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
          const publicUrl = urlData?.publicUrl || "";
          
          // Tentar carregar a imagem para verificar se existe (com timeout curto)
          try {
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error("Not found"));
              img.src = publicUrl;
              setTimeout(() => reject(new Error("Timeout")), 1500);
            });
            console.log(`[Borders] ✅ Arquivo encontrado: ${fileName}`);
            const cleanName = fileName.replace(/\.(png|jpg|jpeg|webp)$/i, "").replace(/border[-_]?|borda[-_]?|slot[-_]?/gi, "").trim();
            const title = cleanName || fileName.replace(/\.[^/.]+$/, "");
            results.push({
              id: `border-${fileName.replace(/\.[^/.]+$/, "")}`,
              title: title.charAt(0).toUpperCase() + title.slice(1) || `Borda ${fileName}`,
              imageUrl: publicUrl,
              unlocked: true,
            });
          } catch (e) {
            // Arquivo não existe, continuar
          }
        }
        
        if (results.length > 0) {
          console.log(`[Borders] ✅ ${results.length} bordas encontradas via URLs diretas`);
          return results;
        }
        
        console.warn(`[Borders] Nenhuma borda encontrada.`);
        console.warn(`[Borders] DICA: Verifique se os arquivos estão no bucket "borders" ou informe os nomes exatos dos arquivos.`);
        return [];
      } else {
        // Se encontrou arquivos, processar normalmente
        console.log(`[Borders] Encontrados ${data.length} itens no bucket "${bucketName}":`);
        data.forEach((item, idx) => {
          console.log(`  [${idx + 1}] ${item.name} (${item.id || 'sem id'})`);
        });
        
        // Separar arquivos e pastas
        const files = data.filter(item => item.name.includes('.'));
        const folders = data.filter(item => !item.name.includes('.'));
        
        console.log(`[Borders] Arquivos: ${files.length}, Pastas: ${folders.length}`);
        
        // Processar arquivos na raiz
        const imageFiles = files.filter((file) => {
          const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
          return isImage && !file.name.startsWith(".");
        });
        
        allFiles.push(...imageFiles.map(f => ({ ...f, path: f.name })));
        
        // Processar arquivos nas pastas
        for (const folder of folders.slice(0, 10)) {
          const folderResult = await supabase.storage.from(bucketName).list(folder.name, { limit: 100 });
          if (folderResult.data && folderResult.data.length > 0) {
            const folderImages = folderResult.data.filter((file) => {
              const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
              return isImage && !file.name.startsWith(".");
            });
            allFiles.push(...folderImages.map(f => ({ ...f, path: `${folder.name}/${f.name}` })));
          }
        }
        
        console.log(`[Borders] ✅ Total de ${allFiles.length} imagens encontradas`);
        
        if (allFiles.length > 0) {
          const result = allFiles.map((file) => {
            const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(file.path);
            const publicUrl = urlData?.publicUrl || "";
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            const title = fileName.replace(/border|Border|borda|Borda/gi, "").trim() || fileName;
            
            return {
              id: `border-${file.id || file.name.replace(/\.[^/.]+$/, "")}`,
              title: title.charAt(0).toUpperCase() + title.slice(1) || `Borda ${file.name}`,
              imageUrl: publicUrl,
              unlocked: true,
            };
          });
          
          console.log(`[Borders] ✅ Retornando ${result.length} bordas`);
          return result;
        }
      }
      
      // Se chegou aqui e o bucket está vazio, tentar fallback de URLs diretas
      console.log(`[Borders] Tentando URLs diretas com nomes comuns...`);
      
      // Tentar vários padrões de nomes possíveis
      const commonNames = [];
      
      // Padrões numéricos
      for (let i = 1; i <= 10; i++) {
        commonNames.push(
          `border${i}.png`, `border${i}.jpg`, `border${i}.jpeg`, `border${i}.webp`,
          `border-${i}.png`, `border-${i}.jpg`, `border-${i}.jpeg`, `border-${i}.webp`,
          `border_${i}.png`, `border_${i}.jpg`, `border_${i}.jpeg`, `border_${i}.webp`,
          `borda${i}.png`, `borda${i}.jpg`, `borda-${i}.png`, `borda-${i}.jpg`,
          `slot${i}.png`, `slot${i}.jpg`, `slot-${i}.png`, `slot-${i}.jpg`,
          `${i}.png`, `${i}.jpg`, `${i}.jpeg`, `${i}.webp`,
          `Border${i}.png`, `Border${i}.jpg`, `Borda${i}.png`, `Borda${i}.jpg`
        );
      }
      
      // Padrões com títulos
      const titles = ["ouro", "prata", "bronze", "diamante", "platina", "gold", "silver", "slot"];
      titles.forEach(title => {
        commonNames.push(
          `border-${title}.png`, `border-${title}.jpg`, `border_${title}.png`, `border_${title}.jpg`,
          `borda-${title}.png`, `borda-${title}.jpg`, `borda_${title}.png`, `borda_${title}.jpg`,
          `${title}.png`, `${title}.jpg`, `${title}-border.png`, `${title}-border.jpg`,
          `${title}-borda.png`, `${title}-borda.jpg`
        );
      });
      
      console.log(`[Borders] Testando ${commonNames.length} possíveis nomes de arquivo...`);
      
      const results = [];
      let tested = 0;
      
      // Testar em lotes para não travar
      for (const fileName of commonNames) {
        tested++;
        if (tested % 10 === 0) {
          console.log(`[Borders] Testados ${tested}/${commonNames.length}...`);
        }
        
        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        const publicUrl = urlData?.publicUrl || "";
        
        // Tentar carregar a imagem para verificar se existe (com timeout curto)
        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Not found"));
            img.src = publicUrl;
            setTimeout(() => reject(new Error("Timeout")), 1500);
          });
          console.log(`[Borders] ✅ Arquivo encontrado: ${fileName}`);
          const cleanName = fileName.replace(/\.(png|jpg|jpeg|webp)$/i, "").replace(/border[-_]?|borda[-_]?|slot[-_]?/gi, "").trim();
          const title = cleanName || fileName.replace(/\.[^/.]+$/, "");
          results.push({
            id: `border-${fileName.replace(/\.[^/.]+$/, "")}`,
            title: title.charAt(0).toUpperCase() + title.slice(1) || `Borda ${fileName}`,
            imageUrl: publicUrl,
            unlocked: true,
          });
        } catch (e) {
          // Arquivo não existe, continuar
        }
      }
      
      if (results.length > 0) {
        console.log(`[Borders] ✅ ${results.length} bordas encontradas via URLs diretas`);
        return results;
      }
      
      console.warn(`[Borders] Nenhuma borda encontrada.`);
      console.warn(`[Borders] DICA: Verifique se os arquivos estão no bucket "borders" ou informe os nomes exatos dos arquivos.`);
      return [];
      
    } catch (err) {
      console.error(`[Borders] Erro ao buscar no bucket "${bucketName}":`, err);
      console.error(`[Borders] Stack:`, err.stack);
      return [];
    }
  } catch (error) {
    console.error("[Borders] Erro geral:", error);
    logSupabaseError("storage.list.borders", error);
    return [];
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

    // Aplicar skin JPG do Supabase Storage
    const skinTheme = profile.theme || "gold";
    const supabaseUrl = supabaseConfig?.url;
    
    if (supabaseUrl) {
      const skinMapping = {
        gold: `${supabaseUrl}/storage/v1/object/public/huds/gold.jpg`,
        frost: `${supabaseUrl}/storage/v1/object/public/huds/frost.jpg`, 
        neon: `${supabaseUrl}/storage/v1/object/public/huds/neon.jpg`,
        ember: `${supabaseUrl}/storage/v1/object/public/huds/ember.jpg`,
        aurora: `${supabaseUrl}/storage/v1/object/public/huds/aurora.jpg`,
        cyber: `${supabaseUrl}/storage/v1/object/public/huds/neon.jpg`
      };
      const skinUrl = skinMapping[skinTheme] || skinMapping.gold;
      
      // Aplicar skin JPG do Supabase
      console.log(`🎨 Aplicando skin do Supabase: ${skinUrl}`);
      sphere.style.setProperty("background-image", `url(${skinUrl})`, "important");
      sphere.style.setProperty("background-size", "150% 150%", "important");
      sphere.style.setProperty("background-position", "center", "important");
      sphere.style.setProperty("background-repeat", "no-repeat", "important");
      sphere.style.setProperty("background-color", "transparent", "important");
    } else {
      // Fallback para CSS gradients se não tiver Supabase
      const skinGradients = {
        gold: "linear-gradient(135deg, #FFD700, #FFA500, #FF8C00)",
        frost: "linear-gradient(135deg, #00CED1, #4682B4, #1E90FF)", 
        neon: "linear-gradient(135deg, #FF00FF, #00FFFF, #FF00AA)",
        ember: "linear-gradient(135deg, #FF4500, #FF6347, #DC143C)",
        aurora: "linear-gradient(135deg, #00FF7F, #00CED1, #9370DB)",
        cyber: "linear-gradient(135deg, #FF00FF, #00FFFF, #FF00AA)"
      };
      const skinGradient = skinGradients[skinTheme] || skinGradients.gold;
      
      console.log(`🎨 Aplicando skin gradient (fallback): ${skinTheme}`);
      sphere.style.setProperty("background-image", skinGradient, "important");
      sphere.style.setProperty("background-size", "200% 200%", "important");
      sphere.style.setProperty("background-position", "center", "important");
      sphere.style.setProperty("background-repeat", "no-repeat", "important");
      sphere.style.setProperty("background-color", "transparent", "important");
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

const buildDefaultPlanner = () => ({ bronzeActions: [] });

const loadPlanner = () => {
  if (cachedPlanner) return cachedPlanner;
  if (!shouldPersistLocalData()) return buildDefaultPlanner();
  try {
    const raw = localStorage.getItem(PLANNER_KEY);
    if (!raw) return buildDefaultPlanner();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.bronzeActions)) {
      return buildDefaultPlanner();
    }
    cachedPlanner = {
      bronzeActions: parsed.bronzeActions || [],
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

// Resetar todas as ações bronze de "done" para "backlog" (voltar para o planner)
const resetBronzeActions = () => {
  const planner = loadPlanner();
  let countReset = 0;
  const updated = planner.bronzeActions.map((action) => {
    // Resetar apenas ações que estão "done" ou têm completedAt/completedHistory
    if (action.status === "done" || action.completedAt || (Array.isArray(action.completedHistory) && action.completedHistory.length > 0)) {
      countReset++;
      // Atualizar contadores antes de resetar
      if (action.status === "done" && action.arenaId) {
        updateArenaCountsForBronze(action.arenaId, -1);
      }
      return {
        ...action,
        status: "backlog",
        scheduledHour: undefined,
        scheduledMinute: undefined,
        scheduledDayOffset: undefined,
        completedAt: undefined,
        completedHistory: [],
      };
    }
    return action;
  });
  
  if (countReset > 0) {
    savePlanner({ ...planner, bronzeActions: updated });
    // Atualizar progresso global de todas as arenas afetadas
    const affectedArenas = new Set(updated.filter(a => a.status === "backlog" && a.arenaId).map(a => a.arenaId));
    affectedArenas.forEach(arenaId => {
      updateGlobalArenaProgress(arenaId, updated);
    });
    renderPlanner();
    renderArenas();
    checkMissionProgress();
    console.log(`[Planner] Resetadas ${countReset} ações bronze para backlog`);
  }
  return countReset;
};

// Expor função globalmente para uso no console
if (typeof window !== 'undefined') {
  window.resetBronzeActions = resetBronzeActions;
}

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
let plannerWeekOffset = 0;
let plannerScrollPosition = 0; // Posição do scroll sincronizada entre dia e semana
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
  const plannerLayout = document.querySelector(".planner-layout");
  const isWeekView = plannerLayout?.classList.contains("week-view");
  if (isWeekView) {
    // Sincronizar semana com o dia atual
    const dayDate = getPlannerDateFromOffset(plannerDayOffset);
    const weekStartOfDay = getWeekStartDate(dayDate);
    const todayWeekStart = getWeekStartDate(new Date());
    const diffDays = Math.floor((weekStartOfDay.getTime() - todayWeekStart.getTime()) / (1000 * 60 * 60 * 24));
    plannerWeekOffset = Math.floor(diffDays / 7);
    renderWeekView();
  } else {
    renderPlanner();
  }
};

const setPlannerWeekOffset = (nextOffset) => {
  plannerWeekOffset = nextOffset;
  updateDayLabel();
  renderWeekView();
};

// Alias para compatibilidade
const renderWeekGrid = () => renderWeekView();

const buildBronzeElement = (action) => {
  // Usar a buildBronzeBlock completa que tem drag e hold perfeitos
  // Permitir drag para ações scheduled (grid) E backlog (bay area)
  const block = buildBronzeBlock(action, {});
  
  // Para ações backlog, permitir drag também
  if (action.status === "backlog") {
    block.draggable = true;
    block.style.cursor = "grab";
    // Adicionar dragstart se não tiver
    if (!block.hasAttribute("data-drag-setup")) {
      block.addEventListener("dragstart", (event) => {
        event.dataTransfer?.setData("text/plain", `bronze:${action.id}`);
      });
      block.setAttribute("data-drag-setup", "true");
    }
  }
  
  // Para ações scheduled, garantir que tenham drag
  if (action.status === "scheduled") {
    block.draggable = true;
    block.style.cursor = "grab";
    // Adicionar dragstart se não tiver
    if (!block.hasAttribute("data-drag-setup")) {
      block.addEventListener("dragstart", (event) => {
        event.dataTransfer?.setData("text/plain", `bronze:${action.id}`);
      });
      block.setAttribute("data-drag-setup", "true");
    }
  }
  
  return block;
};

const renderWeekView = () => {
  const weekGrid = document.getElementById("week-grid");
  if (!weekGrid) return;
  const planner = loadPlanner();
  // Usar plannerWeekOffset para calcular a semana correta
  const today = new Date();
  const baseWeekStart = getWeekStartDate(today);
  const weekStart = new Date(baseWeekStart);
  weekStart.setDate(baseWeekStart.getDate() + (plannerWeekOffset || 0) * 7);
  const dayStartHour = 4;
  const dayEndHour = 28;
  const isNarrow = window.innerWidth <= 520;
  const pixelsPerMinute = isNarrow ? 0.6 : 1;
  const slotHeight = Math.round(60 * pixelsPerMinute);
  const timelineTopPadding = 16;
  const hourCount = dayEndHour - dayStartHour + 1;
  
  // Limpar todos os bronze blocks antes de limpar o HTML para garantir limpeza de timers
  const existingBlocks = weekGrid.querySelectorAll(".bronze-block");
  existingBlocks.forEach((block) => {
    const completeTimer = block.dataset.completeTimer;
    const dragTimer = block.dataset.dragTimer;
    if (completeTimer) clearTimeout(Number(completeTimer));
    if (dragTimer) clearTimeout(Number(dragTimer));
    // Remover listeners se existirem
    if (block._handleDragStart) block.removeEventListener("dragstart", block._handleDragStart);
    if (block._onPointerDown) block.removeEventListener("pointerdown", block._onPointerDown);
    if (block._endPress) {
      block.removeEventListener("pointerup", block._endPress);
      block.removeEventListener("pointerleave", block._endPress);
      block.removeEventListener("pointercancel", block._endPress);
    }
  });
  
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
  // Altura do conteúdo: todos os horários (4h–28h) para poder rolar até o fim
  const calculatedHeight = timelineTopPadding * 2 + hourCount * slotHeight;
  const viewportHeight = window.innerHeight;
  const fixedElementsHeight = 200; // header + bronze list + bottom nav + safe-area
  const availableHeight = Math.max(viewportHeight - fixedElementsHeight, 400);
  const finalBodyHeight = Math.max(calculatedHeight, availableHeight);
  body.style.height = `${finalBodyHeight}px`;
  body.style.minHeight = `${calculatedHeight}px`;
  
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
    timeLabel.style.fontFamily = '"JetBrains Mono", "Consolas", "Courier New", monospace';
    const displayHour = hour > 24 ? hour - 24 : hour;
    timeLabel.textContent = `${String(displayHour).padStart(2, "0")}:00`;
    row.appendChild(timeLabel);
    body.appendChild(row);
  }
  
  WEEKDAYS.forEach((day, dayIndex) => {
    const dayCol = document.createElement("div");
    dayCol.className = "week-day-col";
    dayCol.style.position = "absolute";
    dayCol.style.left = `calc(48px + ${dayIndex} * (100% - 48px) / 7)`;
    dayCol.style.width = `calc((100% - 48px) / 7)`;
    dayCol.style.top = `${timelineTopPadding}px`;
    dayCol.style.borderLeft = dayIndex > 0 ? "1px solid rgba(255, 255, 255, 0.08)" : "none";
    
    // Usar requestAnimationFrame para garantir altura real após renderização
    requestAnimationFrame(() => {
      const actualBodyHeight = body.offsetHeight || body.clientHeight || finalBodyHeight;
      const dayColHeight = actualBodyHeight - timelineTopPadding;
      dayCol.style.height = `${dayColHeight}px`;
      dayCol.style.minHeight = `${dayColHeight}px`;
      dayCol.style.bottom = '0'; // Garantir que vai até o final
    });
    
    // Altura inicial baseada no cálculo
    const dayColHeight = finalBodyHeight - timelineTopPadding;
    dayCol.style.height = `${dayColHeight}px`;
    dayCol.style.minHeight = `${dayColHeight}px`;
    
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
    
    // Prevenir duplicação: garantir que ações não apareçam duas vezes
    const actionsInDayCol = new Set([...scheduledActions, ...recurringActions].map(a => a.id));
    
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
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      // Não permitir que o dayCol roube o drag dos bronze blocks
      event.stopPropagation();
    });
    dayCol.addEventListener("drop", (event) => {
      event.preventDefault();
      // Não permitir que o dayCol roube o drag dos bronze blocks
      event.stopPropagation();
      console.log('🎯 Drop no dayCol (renderWeekView)');
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
      renderWeekView();
      checkMissionProgress();
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
  // Uma ação é recurring se tem weekdays definido (independente de ter dayDate)
  const hasWeekdays = Array.isArray(action.weekdays) && action.weekdays.length > 0;
  const isRecurring = Boolean(options.isRecurring && hasWeekdays);
  // Determinar estado visual baseado no status real da ação
  const isDoneForDay = isRecurring ? isActionDoneOnDate(action, dayDate) : action.status === "done";
  if (isDoneForDay) block.classList.add("done");
  
  // SEMPRE permitir drag - não importa o status
  block.draggable = true;
  block.style.cursor = "grab";
  
  console.log('🔧 Bronze block criado:', action.id, action.title);
  console.log('🔧 Block draggable:', block.draggable);
  console.log('🔧 Block cursor:', block.style.cursor);
  
  // Adicionar dragstart diretamente sem condições
  block.addEventListener("dragstart", (event) => {
    console.log('🚀 Drag start no bronze block:', action.id);
    console.log('🚀 Event target:', event.target);
    console.log('🚀 Current target:', event.currentTarget);
    console.log('🚀 Block draggable:', block.draggable);
    console.log('🚀 Event dataTransfer:', !!event.dataTransfer);
    
    // Forçar draggable se necessário
    if (!block.draggable) {
      block.draggable = true;
      console.log('🚀 Forçando draggable = true');
    }
    
    isDragging = true;
    // Cancelar hold timer se existir
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
      block.classList.remove("is-pressing");
    }
    
    // Tentar setData mesmo se dataTransfer for null
    try {
      event.dataTransfer?.setData("text/plain", `bronze:${action.id}`);
      console.log('🚀 DataTransfer setData funcionou');
    } catch (error) {
      console.log('🚀 Erro no setData:', error);
    }
    
    // Forçar o drag para não ser roubado
    event.stopPropagation();
    // NÃO usar preventDefault() aqui - isso bloqueia o drag!
  });
  
  // Adicionar dragend para garantir que o drag termine
  block.addEventListener("dragend", (event) => {
    console.log('🏁 Drag end no bronze block:', action.id);
    isDragging = false;
    event.stopPropagation();
  });
  
  const icon = document.createElement("i");
  icon.className = "bronze-icon";
  icon.setAttribute("data-lucide", action.icon || "circle");
  const title = document.createElement("div");
  title.className = "bronze-title";
  title.textContent = action.title || "Acao";
  const checkmark = document.createElement("span");
  checkmark.className = "bronze-checkmark";
  checkmark.innerHTML = '<i data-lucide="check"></i>';

  let isDragging = false;
  let dragStartTime = 0;
  let holdTimer = null;

  const startPress = () => {
    console.log('👆 Hold start no bronze block:', action.id);
    block.classList.add("is-pressing");
    holdTimer = setTimeout(() => {
      console.log('⏰ Hold completado no bronze block:', action.id);
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
  };

  const endPress = () => {
    console.log('👆 Hold end no bronze block:', action.id);
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
    block.classList.remove("is-pressing");
  };

  // Adicionar eventos de HOLD com verificação para não interferir com drag
  block.addEventListener("mousedown", (event) => {
    if (isDragging) return;
    dragStartTime = Date.now();
    startPress();
  });
  
  block.addEventListener("touchstart", (event) => {
    if (isDragging) return;
    dragStartTime = Date.now();
    startPress();
  });
  
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
  console.log('🆕 Criando ação para arena:', arena.id, arena.title);
  const planner = loadPlanner();
  console.log('🆕 Planner antes:', planner.bronzeActions.length, 'ações');
  // Criar bronze action (sistema unificado)
  const action = {
    id: crypto.randomUUID(),
    title: arena.title || "Acao",
    status: "backlog",
    arenaId: arena.id,
    createdDate: new Date().toISOString(),
  };
  console.log('🆕 Nova ação criada:', action);
  planner.bronzeActions.push(action);
  console.log('🆕 Planner depois:', planner.bronzeActions.length, 'ações');
  savePlanner(planner);
  console.log('🆕 Planner salvo, chamando renderPlanner()');
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

const updateGlobalArenaProgress = (arenaId, bronzeActions) => {
  if (!arenaId) return;
  const allActions = bronzeActions.filter((action) => action.arenaId === arenaId);
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
  if (!compact) card.appendChild(assetLabel);
  card.appendChild(description);
  if (bronzeActions.length) card.appendChild(actionsRow);
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
  console.log('[DEBUG] Renderizando arenas:', arenas.length, arenas);
  arenaList.innerHTML = "";
  if (arenas.length === 0) {
    const empty = document.createElement("div");
    empty.className = "arena-empty";
    empty.textContent = "Sem metas ainda.";
    arenaList.appendChild(empty);
    return;
  }
  arenas.forEach((arena) => {
    console.log('[DEBUG] Criando card para arena:', arena.title, arena);
    const card = buildArenaCard(arena);
    arenaList.appendChild(card);
  });
  if (window.lucide) window.lucide.createIcons();
};

const dateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());


const cleanupPlannerHistory = () => {
  const planner = loadPlanner();
  const today = dateOnly(new Date());
  const filtered = planner.bronzeActions.filter((action) => {
    if (action.status === "done") return true;
    const actionDate = action.scheduledDate ? dateOnly(new Date(action.scheduledDate)) : dateOnly(new Date());
    return actionDate >= today;
  });
  if (filtered.length !== planner.bronzeActions.length) {
    savePlanner({ ...planner, bronzeActions: filtered });
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
  const dayStartHour = 4;
  const dayEndHour = 28;
  const isNarrow = window.innerWidth <= 520;
  const pixelsPerMinute = isNarrow ? 0.6 : 1;

  // Limpar todos os bronze blocks antes de limpar o HTML para garantir limpeza de timers
  const existingBlocks = timeline.querySelectorAll(".bronze-block");
  existingBlocks.forEach((block) => {
    const completeTimer = block.dataset.completeTimer;
    const dragTimer = block.dataset.dragTimer;
    if (completeTimer) clearTimeout(Number(completeTimer));
    if (dragTimer) clearTimeout(Number(dragTimer));
    // Remover listeners se existirem
    if (block._handleDragStart) block.removeEventListener("dragstart", block._handleDragStart);
    if (block._onPointerDown) block.removeEventListener("pointerdown", block._onPointerDown);
    if (block._endPress) {
      block.removeEventListener("pointerup", block._endPress);
      block.removeEventListener("pointerleave", block._endPress);
      block.removeEventListener("pointercancel", block._endPress);
    }
  });

  timeline.innerHTML = "";
  
  // Criar header igual ao da semana (mas com uma coluna só)
  const header = document.createElement("div");
  header.className = "day-timeline-header";
  header.style.display = "grid";
  header.style.gridTemplateColumns = "48px 1fr";
  header.style.gap = "0";
  header.style.marginBottom = "0";
  header.style.paddingBottom = "8px";
  header.style.borderBottom = "1px solid rgba(255, 255, 255, 0.08)";
  header.style.alignItems = "center";
  
  const timeSpacer = document.createElement("div");
  timeSpacer.className = "day-time-spacer";
  header.appendChild(timeSpacer);
  
  const dayLabel = document.createElement("div");
  dayLabel.className = "day-label";
  dayLabel.style.fontSize = "10px";
  dayLabel.style.color = "#bdbdbd";
  dayLabel.style.textTransform = "uppercase";
  dayLabel.style.letterSpacing = "1px";
  dayLabel.style.textAlign = "center";
  dayLabel.style.padding = "4px";
  const dayName = WEEKDAYS.find(d => d.key === dayKey)?.label || dayKey;
  dayLabel.textContent = dayName;
  const todayKey = formatDateKey(new Date());
  const dayDateKey = formatDateKey(dayDate);
  if (dayDateKey === todayKey) dayLabel.classList.add("is-today");
  header.appendChild(dayLabel);
  timeline.appendChild(header);
  
  // Criar container para linhas de timeline (similar à semana)
  const timelineBody = document.createElement("div");
  timelineBody.className = "timeline-body";
  timelineBody.style.position = "relative";
  timelineBody.style.marginTop = "8px";
  
  const hourCount = dayEndHour - dayStartHour + 1;
  const slotHeight = Math.round(60 * pixelsPerMinute);
  const timelineTopPadding = 16;
  
  // Altura total: header (40px) + body com todos os horários
  // Garantir que o grid ocupe toda a altura disponível da tela
  const plannerLayout = document.querySelector(".planner-layout");
  const viewportHeight = window.innerHeight;
  const fixedElementsHeight = 120; // header + margins
  const availableHeight = viewportHeight - fixedElementsHeight;
  const minHeight = Math.max(availableHeight, viewportHeight * 0.8); // Mínimo 80% da viewport
  
  const calculatedBodyHeight = timelineTopPadding * 2 + hourCount * slotHeight;
  const calculatedHeight = 40 + calculatedBodyHeight;
  const finalHeight = Math.max(calculatedHeight, minHeight);
  const bodyMinHeight = finalHeight - 40;
  const finalBodyHeight = Math.max(calculatedBodyHeight, bodyMinHeight);
  
  // Conteúdo com altura total para poder rolar até o último horário
  timeline.style.height = `${finalHeight}px`;
  timeline.style.maxHeight = `${availableHeight}px`;
  timelineBody.style.minHeight = `${bodyMinHeight}px`;
  timelineBody.style.height = `${finalBodyHeight}px`;
  
  timeline.style.overflowY = "auto";
  timeline.style.overflowX = "hidden";
  
  // Criar linhas de timeline (igual à semana)
  for (let hour = dayStartHour; hour <= dayEndHour; hour += 1) {
    const row = document.createElement("div");
    row.className = "time-slot";
    row.dataset.hour = String(hour);
    row.style.position = "absolute";
    row.style.top = `${timelineTopPadding + (hour - dayStartHour) * slotHeight}px`;
    row.style.left = "0";
    row.style.right = "0";
    row.style.height = "1px";
    row.style.borderTop = "1px solid rgba(255, 255, 255, 0.06)";
    row.style.pointerEvents = "none";

    const label = document.createElement("div");
    label.className = "time-label";
    label.style.position = "absolute";
    label.style.left = "8px";
    label.style.top = "-10px";
    label.style.fontSize = "10px";
    label.style.color = "#bdbdbd";
    label.style.fontFamily = '"JetBrains Mono", "Consolas", "Courier New", monospace';
    const displayHour = hour > 24 ? hour - 24 : hour;
    label.textContent = `${String(displayHour).padStart(2, "0")}:00`;
    row.appendChild(label);
    timelineBody.appendChild(row);
  }
  
  // Criar área de drop para o dia (similar à coluna da semana, mas esticada)
  const dayCol = document.createElement("div");
  dayCol.className = "day-col";
  dayCol.style.position = "absolute";
  dayCol.style.left = "48px";
  dayCol.style.right = "0";
  dayCol.style.top = `${timelineTopPadding}px`;
  dayCol.style.pointerEvents = "auto";
  
  // Usar requestAnimationFrame para garantir altura real após renderização
  requestAnimationFrame(() => {
    const actualBodyHeight = timelineBody.offsetHeight || timelineBody.clientHeight || finalBodyHeight;
    const dayColHeight = actualBodyHeight - timelineTopPadding;
    dayCol.style.height = `${dayColHeight}px`;
    dayCol.style.minHeight = `${dayColHeight}px`;
    dayCol.style.bottom = '0'; // Garantir que vai até o final
  });
  
  // Altura inicial baseada no cálculo
  const dayColHeight = finalBodyHeight - timelineTopPadding;
  dayCol.style.height = `${dayColHeight}px`;
  dayCol.style.minHeight = `${dayColHeight}px`;
  
  dayCol.addEventListener("dragover", (event) => {
    event.preventDefault();
    // Não permitir que o dayCol roube o drag dos bronze blocks
    event.stopPropagation();
  });
  
  dayCol.addEventListener("drop", (event) => {
    event.preventDefault();
    // Não permitir que o dayCol roube o drag dos bronze blocks
    event.stopPropagation();
    console.log('🎯 Drop no dayCol (renderDayView)');
    const payload = event.dataTransfer?.getData("text/plain");
    if (!payload || !payload.startsWith("bronze:")) return;
    const actionId = payload.replace("bronze:", "");
    const rect = dayCol.getBoundingClientRect();
    const y = event.clientY - rect.top - timelineTopPadding;
    const hour = Math.max(dayStartHour, Math.min(dayEndHour, Math.floor(y / slotHeight) + dayStartHour));
    const updated = planner.bronzeActions.map((action) => {
      if (action.id !== actionId) return action;
      // Manter status se já estiver scheduled ou done, caso contrário marcar como scheduled
      const newStatus = action.status === "done" || action.status === "scheduled" ? action.status : "scheduled";
      return {
        ...action,
        status: newStatus,
        scheduledHour: hour,
        scheduledMinute: 0,
        scheduledDayOffset: plannerDayOffset,
      };
    });
    // Garantir que todas ações são preservadas
    const allActionsPreserved = updated.length === planner.bronzeActions.length;
    if (!allActionsPreserved) {
      console.warn('[Planner] Ações perdidas ao arrastar', {
        antes: planner.bronzeActions.length,
        depois: updated.length
      });
    }
    savePlanner({ ...planner, bronzeActions: updated });
    renderPlanner();
    checkMissionProgress();
  });
  
  timelineBody.appendChild(dayCol);
  timeline.appendChild(timelineBody);

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
  
  // Prevenir duplicação: garantir que ações não apareçam duas vezes
  const actionsInGrid = new Set([...scheduledActions, ...recurringActions].map(a => a.id));
  console.log('🔍 Ações scheduled:', scheduledActions.map(a => ({ id: a.id, title: a.title, status: a.status })));
  console.log('🔍 Ações recurring:', recurringActions.map(a => ({ id: a.id, title: a.title, weekdays: a.weekdays })));
  console.log('🔍 Actions in grid (IDs):', Array.from(actionsInGrid));
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
  
  timeline.appendChild(timelineBody);

  bronzeList.innerHTML = "";
  // Mostrar TODAS ações que não estão no grid do dia atual
  // Isso inclui ações backlog e ações de outras arenas que não estão scheduled/done para hoje
  const bronzeBacklog = planner.bronzeActions.filter((action) => {
    console.log('🔍 Verificando ação:', action.id, action.title, 'status:', action.status);
    // Não mostrar ações que já estão no grid
    if (actionsInGrid.has(action.id)) {
      console.log('🔍 Ação está no grid, não mostrar no backlog:', action.id);
      return false;
    }
    // Mostrar todas outras ações (backlog, scheduled para outros dias, etc.)
    console.log('🔍 Ação NÃO está no grid, mostrar no backlog:', action.id);
    return true;
  });
  console.log('🔍 Total de ações no planner:', planner.bronzeActions.length);
  console.log('🔍 Ações no backlog:', bronzeBacklog.length);
  console.log('🔍 Ações no grid:', actionsInGrid.size);
  console.log('🔍 Status das ações no backlog:', bronzeBacklog.map(a => ({ id: a.id, title: a.title, status: a.status })));
  
  if (bronzeBacklog.length === 0) {
    const empty = document.createElement("div");
    empty.className = "backlog-empty";
    empty.textContent = "Sem acoes de bronze.";
    bronzeList.appendChild(empty);
  } else {
    bronzeBacklog.forEach((action) => {
      console.log('🔍 Criando bronze para:', action.id, action.title);
      console.log('🔍 Status da ação:', action.status);
      const bronzeEl = buildBronzeElement(action);
      bronzeList.appendChild(bronzeEl);
      console.log('🔍 Bronze adicionado ao DOM');
    });
  }
  
  // Reutilizar plannerLayout já declarado acima
  const isWeekView = plannerLayout?.classList.contains("week-view");
  if (isWeekView) {
    renderWeekView();
  }
  const arenaIds = Array.from(
    new Set(planner.bronzeActions.map((action) => action.arenaId).filter(Boolean)),
  );
  arenaIds.forEach((arenaId) => updateGlobalArenaProgress(arenaId, planner.bronzeActions));
};



// REMOVIDO - Agora usa buildBronzeBlock para tudo
// const buildPillElement = (pill, arenaTitle) => {
//   const block = buildBronzeBlock(pill, {});
//   const meta = document.createElement("div");
//   meta.className = "pill-meta";
//   meta.textContent = pill.arenaId ? `Arena: ${arenaTitle}` : "Sem arena";
//   block.appendChild(meta);
//   return block;
// };

// REMOVIDO - Sistema pills unificado em bronzeActions

let navInitialized = false;

const setActiveScreen = (target) => {
  if (!target) return;
  try {
    // Fechar todos os modais abertos
    document.querySelectorAll(".is-open, [class*='modal'], [class*='panel']").forEach((element) => {
      if (element.classList.contains("is-open")) {
        element.classList.remove("is-open");
      }
    });
    
    // Trocar tela
    document.querySelectorAll(".screen").forEach((screen) => {
      const isActive = screen.dataset.screen === target;
      screen.classList.toggle("is-active", isActive);
    });
    document.querySelectorAll(".nav-item").forEach((button) => {
      const isActive = button.dataset.target === target;
      button.classList.toggle("is-active", isActive);
    });
    
    // Scrollar para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const activeScreen = document.querySelector(`.screen[data-screen="${target}"]`);
    if (activeScreen) {
      activeScreen.scrollTop = 0;
    }
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

// Comando de emergência para reset de DNA (usar no console)
window.resetDNAMigration = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(V2_RESET_KEY);
  cachedDNA = null;
  console.log("[DNA] Reset completo! Recarregue a página.");
  location.reload();
};

const migrateAssetIds = (dna) => {
  const idMapping = {
    "conexao": "consciencia",
    "mente": "espaco-mental",
    "verdade": "proposito",
    "inspiracao": "projetos",
    "amor": "conexoes",
    "abundancia": "financas",
    "autenticidade": "hobbies"
  };
  
  let migrated = false;
  dna.assets.forEach((asset) => {
    if (idMapping[asset.id]) {
      asset.id = idMapping[asset.id];
      migrated = true;
    }
  });
  
  // Migrar profileSlots também
  if (dna.profileSlots) {
    const newProfileSlots = {};
    Object.entries(dna.profileSlots).forEach(([oldSlotId, slotData]) => {
      let newSlotId = oldSlotId;
      Object.entries(idMapping).forEach(([oldId, newId]) => {
        if (oldSlotId.startsWith(oldId + ".")) {
          newSlotId = oldSlotId.replace(oldId + ".", newId + ".");
          migrated = true;
        }
      });
      newProfileSlots[newSlotId] = slotData;
    });
    if (migrated) {
      dna.profileSlots = newProfileSlots;
    }
  }
  
  return migrated;
};

const seedDNAIfMissing = () => {
  const existing = getDNA();
  if (existing && Array.isArray(existing.assets)) {
    // Migrar IDs antigos para novos
    const migrated = migrateAssetIds(existing);
    if (migrated) {
      saveDNA(existing, { skipSync: true });
      console.log("[DNA] IDs migrados com sucesso!");
    }
    return existing;
  }
  const seeded = buildDefaultDNA();
  saveDNA(seeded, { skipSync: true });
  return seeded;
};

// Forçar migração completa de todos os dados antigos
const forceCompleteMigration = () => {
  console.log("[MIGRATION] Iniciando migração completa...");
  
  // Migrar DNA
  const dna = getDNA();
  if (dna && Array.isArray(dna.assets)) {
    const migrated = migrateAssetIds(dna);
    if (migrated) {
      saveDNA(dna, { skipSync: true });
      console.log("[MIGRATION] DNA migrado!");
    }
  }
  
  // Migrar Planner
  const planner = loadPlanner();
  if (planner && Array.isArray(planner.bronzeActions)) {
    const idMapping = {
      "conexao": "consciencia",
      "mente": "espaco-mental",
      "verdade": "proposito",
      "inspiracao": "projetos",
      "amor": "conexoes",
      "abundancia": "financas",
      "autenticidade": "hobbies"
    };
    
    let plannerMigrated = false;
    planner.bronzeActions.forEach((action) => {
      if (action.arenaId && idMapping[action.arenaId]) {
        action.arenaId = idMapping[action.arenaId];
        plannerMigrated = true;
      }
    });
    
    if (plannerMigrated) {
      savePlanner(planner);
      console.log("[MIGRATION] Planner migrado!");
    }
  }
  
  // Migrar Arenas
  const arenas = loadArenas();
  if (arenas && Array.isArray(arenas)) {
    const idMapping = {
      "conexao": "consciencia",
      "mente": "espaco-mental",
      "verdade": "proposito",
      "inspiracao": "projetos",
      "amor": "conexoes",
      "abundancia": "financas",
      "autenticidade": "hobbies"
    };
    
    let arenasMigrated = false;
    arenas.forEach((arena) => {
      if (arena.assetId && idMapping[arena.assetId]) {
        arena.assetId = idMapping[arena.assetId];
        arenasMigrated = true;
      }
    });
    
    if (arenasMigrated) {
      saveArenas(arenas);
      console.log("[MIGRATION] Arenas migradas!");
    }
  }
  
  console.log("[MIGRATION] Migração completa finalizada!");
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
  
  // Limpar lista
  list.innerHTML = "";
  
  // Usar o grid do CSS - não sobrescrever
  const gridContainer = document.createElement("div");
  gridContainer.className = "slot-list";
  // Não aplicar style inline para não sobrescrever o CSS
  
  // Configuração simples
  const slotConfigs = {
    'consciencia': ['Lema', 'Crença 1', 'Crença 2', 'Crença 3'],
    'mente': ['Filosofia', 'Lógica', 'Criatividade', 'Intuição'],
    'espiritualidade': ['Sistema', 'Entidade 1', 'Entidade 2', 'Entidade 3'],
    'proposito': ['Missão', 'MBTI', 'Signo', 'Trait 1', 'Trait 2', 'Trait 3'],
    'projetos': ['Projeto 1', 'Projeto 2', 'Projeto 3', 'Inspiração 1', 'Inspiração 2', 'Inspiração 3'],
    'conexoes': ['Conexão 1', 'Conexão 2', 'Conexão 3', 'Conexão 4', 'Conexão 5', 'Conexão 6'],
    'trabalho': ['Classe 1', 'Classe 2', 'Proficiências', 'Experiências'],
    'hobbies': ['Hobby 1', 'Hobby 2', 'Hobby 3', 'Hobby 4', 'Hobby 5', 'Hobby 6'],
    'abundancia': ['Renda', 'Gasto', 'Patrimônio', 'Ativo 1', 'Ativo 2', 'Ativo 3'],
    'fisico': ['Idade', 'Gênero', 'Peso', 'Altura', 'Forma Física']
  };
  
  const configs = slotConfigs[assetId] || [];
  
  // Criar slots usando o grid do CSS
  configs.forEach((label, index) => {
    const slotEl = document.createElement('div');
    slotEl.className = 'profile-slot';
    slotEl.style.cssText = 'border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 6px; background: rgba(16, 16, 16, 0.6); padding: 4px; display: flex; flex-direction: column; justify-content: center; align-items: center;';
    
    const labelEl = document.createElement('div');
    labelEl.style.cssText = 'font-size: 9px; color: #999; margin-bottom: 2px; text-transform: uppercase; text-align: center;';
    labelEl.textContent = label;
    
    const valueEl = document.createElement('div');
    valueEl.style.cssText = 'font-size: 11px; color: #f7f7f7; text-align: center;';
    valueEl.textContent = 'Valor ' + (index + 1);
    
    slotEl.appendChild(labelEl);
    slotEl.appendChild(valueEl);
    gridContainer.appendChild(slotEl);
  });
  
  list.appendChild(gridContainer);
};

// FUNÇÕES AUXILIARES DO SLIDER (TEMPORARIAMENTE COMENTADAS)
/*
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
if (sliderClose) {
  sliderClose.addEventListener("click", () => {
    if (sliderModal) sliderModal.classList.remove("is-open");
  });
}
*/;

// CÓDIGO ANTIGO COMENTADO - SERÁ REIMPLEMENTADO DEPOIS
/*
CÓDIGO DE RENDERIZAÇÃO DE SLOTS TEMPORARIAMENTE DESABILITADO
SERÁ REIMPLEMENTADO COM PADRÕES CSS UNIFICADOS

const getDossierSlots = (assetId) => {
  const base = PROTOCOL_SLOTS[assetId] || [];
  const lemaId = `${assetId}.lema`;
  const lemaSlot = base.find((slot) => slot.id === lemaId);
  const withoutLema = base.filter((slot) => slot.id !== lemaId);
  if (assetId !== "consciencia") {
    return withoutLema;
  }
  return lemaSlot
    ? [lemaSlot, ...withoutLema]
    : [{ id: lemaId, label: "Lema", type: "rect-wide" }, ...withoutLema];
};

const getSlotOptions = () => {
  const options = [];
  Object.entries(PROTOCOL_SLOTS).forEach(([assetId, slots]) => {
    slots.forEach((slot) => {
      options.push({
        assetId,
        slotId: slot.id,
        label: slot.label,
        type: slot.type,
        fields: slot.fields,
      });
    });
  });
  return options;
};
*/

// SEGUNDA OCORRÊNCIA DUPLICADA REMOVIDA
// FUNÇÕES AUXILIARES DO SLIDER JÁ EXISTEM MAIS ACIMA

// Resto do código antigo comentado...
/*
CÓDIGO DE RENDERIZAÇÃO COMPLETO DE SLOTS SERÁ REIMPLEMENTADO
*/

// CÓDIGO QUEBRADO REMOVIDO
// select.value = asset.profileSlots[slot.id]?.[field.key] || "";
// select.addEventListener("click", stopSlotPropagation);
// select.addEventListener("pointerdown", stopSlotPropagation);
// select.addEventListener("change", () => applyFieldUpdate(field, select.value));
// slotEl.appendChild(select);
// return;

// MAIS CÓDIGO QUEBRADO REMOVIDO
/*
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
    if (sliderOnSave) sliderOnSave(Number(sliderInput.value || 0));
    if (sliderModal) sliderModal.classList.remove("is-open");
  });
}
input.addEventListener("change", () => applyFieldUpdate(field, input.value));
slotEl.appendChild(input);
*/

// MAIS CÓDIGO QUEBRADO REMOVIDO
/*
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
  value: Number(asset.profileSlots[slot.id]?.[field.key] || 0),
  unit: field.slider.unit,
  onSave: (value) => applyFieldUpdate(field, value),
});
*/

// MAIS CÓDIGO QUEBRADO REMOVIDO
/*
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
    // Calcular signo baseado em dia/mês
    const signos = [
      { nome: "Áries", inicio: [3, 21], fim: [4, 19] },
      { nome: "Touro", inicio: [4, 20], fim: [5, 20] },
      { nome: "Gêmeos", inicio: [5, 21], fim: [6, 20] },
      { nome: "Câncer", inicio: [6, 21], fim: [7, 22] },
      { nome: "Leão", inicio: [7, 23], fim: [8, 22] },
      { nome: "Virgem", inicio: [8, 23], fim: [9, 22] },
      { nome: "Libra", inicio: [9, 23], fim: [10, 22] },
      { nome: "Escorpião", inicio: [10, 23], fim: [11, 21] },
      { nome: "Sagitário", inicio: [11, 22], fim: [12, 21] },
      { nome: "Capricórnio", inicio: [12, 22], fim: [1, 19] },
      { nome: "Aquário", inicio: [1, 20], fim: [2, 18] },
      { nome: "Peixes", inicio: [2, 19], fim: [3, 20] },
    ];
    let signoEncontrado = "Peixes";
    for (const signo of signos) {
      const [inicioMes, inicioDia] = signo.inicio;
      const [fimMes, fimDia] = signo.fim;
      if (
        (mes === inicioMes && dia >= inicioDia) ||
        (mes === fimMes && dia <= fimDia) ||
        (inicioMes > fimMes && (mes > inicioMes || mes < fimMes))
      ) {
        signoEncontrado = signo.nome;
        break;
      }
    }
    applyFieldUpdate(
      { key: "signo", label: "Signo" },
      signoEncontrado,
    );
  }
},
});
*/

// MAIS CÓDIGO QUEBRADO REMOVIDO
/*
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
*/

// MAIS CÓDIGO QUEBRADO REMOVIDO
/*
input.addEventListener("change", () => applyFieldUpdate(field, input.value));
slotEl.appendChild(input);
});
*/

// MAIS CÓDIGO QUEBRADO REMOVIDO
/*
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
  if (focusable) {
    focusable.focus();
    focusable.select();
  }
});
*/

// MAIS CÓDIGO QUEBRADO REMOVIDO
/*
if (!slotEl.closest("#tree-edit-modal.is-editing")) {
  ensureTreeEditMode();
}
const focusable = slotEl.querySelector("input.profile-input");
if (focusable) focusable.focus();
});

list.appendChild(slotEl);
});
};
*/

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
    console.log('[DEBUG] Arenas do ativo', asset.id, ':', arenas);
    linkedArenasList.innerHTML = "";
    if (arenas.length === 0) {
      const empty = document.createElement("div");
      empty.className = "arena-empty";
      empty.textContent = "Sem arenas vinculadas.";
      linkedArenasList.appendChild(empty);
    } else {
      arenas.forEach((arena) => {
        const card = buildArenaCard(arena, { compact: true, showAdd: false });
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
      if (lemaValue && asset.id === "consciencia") {
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

const openArenaModal = (preselectedAssetId = null) => {
  const modal = document.getElementById("arena-modal");
  const select = document.getElementById("arena-asset");
  const title = document.getElementById("arena-title");
  const description = document.getElementById("arena-description");
  const addBronze = document.getElementById("arena-add-bronze");
  const logo = document.getElementById("arena-modal-logo");
  const assetLabel = document.getElementById("arena-modal-asset");
  const iconGrid = document.getElementById("arena-modal-icon-grid");
  if (!modal || !select || !title || !description) return;
  
  modal.dataset.icon = "";
  modal.classList.remove("is-icon-editing");
  if (iconGrid) iconGrid.style.display = "none";
  
  select.innerHTML = "";
  SEPHIROT.forEach((asset) => {
    const option = document.createElement("option");
    option.value = asset.id;
    option.textContent = asset.label;
    if (preselectedAssetId && asset.id === preselectedAssetId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  title.value = "";
  description.value = "";
  if (addBronze) addBronze.checked = false;
  
  const updateLogoAndAsset = () => {
    const selectedAssetId = select.value;
    const asset = SEPHIROT.find((a) => a.id === selectedAssetId);
    const customIcon = modal.dataset.icon;
    if (asset && logo) {
      const iconName = customIcon || ICON_BY_ID[selectedAssetId] || "circle";
      logo.innerHTML = `<i data-lucide="${iconName}"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }
    if (asset && assetLabel) {
      assetLabel.textContent = asset.label || "Selecione o Ativo";
    }
  };
  
  const buildIconGrid = () => {
    if (!iconGrid) return;
    iconGrid.innerHTML = "";
    ARENA_ICONS.forEach((iconName) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "icon-option";
      option.dataset.icon = iconName;
      option.innerHTML = `<i data-lucide="${iconName}"></i>`;
      option.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        modal.dataset.icon = iconName;
        updateLogoAndAsset();
        iconGrid.querySelectorAll(".icon-option").forEach((el) => el.classList.remove("is-selected"));
        option.classList.add("is-selected");
        modal.classList.remove("is-icon-editing");
        iconGrid.style.display = "none";
        if (window.lucide) window.lucide.createIcons();
      });
      iconGrid.appendChild(option);
    });
    if (window.lucide) window.lucide.createIcons();
  };
  
  if (logo) {
    logo.onclick = (e) => {
      e.stopPropagation();
      const isEditing = modal.classList.contains("is-icon-editing");
      modal.classList.toggle("is-icon-editing", !isEditing);
      if (!isEditing) {
        buildIconGrid();
        iconGrid.style.display = "grid";
      } else {
        iconGrid.style.display = "none";
      }
    };
  }
  
  // Remover listener anterior se existir
  select.removeEventListener("change", updateLogoAndAsset);
  select.addEventListener("change", updateLogoAndAsset);
  
  if (preselectedAssetId) {
    updateLogoAndAsset();
  } else if (assetLabel) {
    assetLabel.textContent = "Selecione o Ativo";
    if (logo) {
      logo.innerHTML = `<i data-lucide="circle"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }
  
  modal.classList.add("is-open");
};

const openArenaModalForAsset = (assetId) => {
  openArenaModal(assetId);
};

const closeArenaModal = () => {
  const modal = document.getElementById("arena-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
};

const openArenaDossier = (arenaId) => {
  console.log('[DEBUG] Abrindo arena dossier para arena:', arenaId);
  const modal = document.getElementById("arena-dossier");
  console.log('[DEBUG] Modal arena-dossier encontrado:', !!modal);
  const title = document.getElementById("arena-dossier-title");
  const progress = document.getElementById("arena-dossier-progress");
  const macro = document.getElementById("arena-dossier-macro");
  const bronzeList = document.getElementById("arena-dossier-bronze");
  const progressFill = document.getElementById("arena-dossier-fill");
  const logo = document.getElementById("arena-dossier-logo");
  const asset = document.getElementById("arena-dossier-asset");
  const addBronzeBtn = document.getElementById("arena-dossier-add-bronze");
  const titleInput = document.getElementById("arena-dossier-title-input");
  const descriptionInput = document.getElementById("arena-dossier-description-input");
  const assetSelect = document.getElementById("arena-dossier-asset-select");
  const iconGrid = document.getElementById("arena-dossier-icon-grid");
  
  if (!modal || !title || !progress || !macro || !bronzeList) {
    console.log('[DEBUG] Elementos faltando no modal');
    return;
  }
  
  console.log('[DEBUG] Todos os elementos encontrados, abrindo modal...');
  modal.classList.add("is-open");
  
  // Sair do modo de edição se estiver
  modal.classList.remove("is-editing", "is-icon-editing");
  if (titleInput) titleInput.style.display = "none";
  if (title) title.style.display = "block";
  if (descriptionInput) descriptionInput.style.display = "none";
  if (macro) macro.style.display = "block";
  if (assetSelect) assetSelect.style.display = "none";
  if (asset) asset.style.display = "block";
  if (iconGrid) iconGrid.style.display = "none";
  
  const arenas = loadArenas();
  console.log('[DEBUG] Arenas carregadas:', arenas.length);
  const arena = arenas.find((item) => item.id === arenaId);
  console.log('[DEBUG] Arena encontrada:', !!arena, arena);
  if (!arena) {
    console.log('[DEBUG] Arena não encontrada, criando nova');
    return;
  }
  
  title.textContent = arena.title || "Arena";
  const completionValue = Number(arena.completion || 0);
  if (arena.targetCount) {
    progress.textContent = `${Number(arena.completedCount || 0)}/${arena.targetCount}`;
  } else {
    progress.textContent = `${Math.round(completionValue)}%`;
  }
  macro.textContent = arena.description || "Sem descrição.";
  if (asset) {
    asset.textContent = LABEL_BY_ID.get(arena.assetId) ?? "Ativo";
  }
  if (logo) {
    const iconName = arena.icon || ICON_BY_ID[arena.assetId] || "circle";
    logo.innerHTML = `<i data-lucide="${iconName}"></i>`;
    modal.dataset.icon = arena.icon || "";
    
    // Tornar logo clicável para selecionar ícone
    logo.style.cursor = "pointer";
    logo.addEventListener("click", (event) => {
      event.stopPropagation();
      
      // Só mostrar grade se estiver em modo edição
      if (!modal.classList.contains("is-editing")) return;
      
      console.log('[DEBUG] Logo clicado, mostrando grade de ícones');
      
      // Toggle da grade de ícones
      if (iconGrid) {
        const isVisible = iconGrid.style.display === "grid";
        iconGrid.style.display = isVisible ? "none" : "grid";
        
        if (!isVisible && iconGrid.innerHTML === "") {
          // Preencher grade se estiver vazia
          const availableIcons = BRONZE_ICONS || ['circle', 'star', 'heart', 'shield', 'sword', 'crown'];
          availableIcons.forEach(iconName => {
            const option = document.createElement("button");
            option.type = "button";
            option.className = "icon-option";
            if (iconName === (modal.dataset.icon || "circle")) option.classList.add("is-selected");
            option.dataset.icon = iconName;
            const icon = document.createElement("i");
            icon.setAttribute("data-lucide", iconName);
            option.appendChild(icon);
            option.addEventListener("click", () => {
              iconGrid.querySelectorAll(".icon-option").forEach(el => el.classList.remove("is-selected"));
              option.classList.add("is-selected");
              modal.dataset.icon = iconName;
              // Atualizar logo
              logo.innerHTML = `<i data-lucide="${iconName}"></i>`;
              if (window.lucide) window.lucide.createIcons();
            });
            iconGrid.appendChild(option);
          });
          
          if (window.lucide) window.lucide.createIcons();
        }
      }
    });
    
    if (window.lucide) window.lucide.createIcons();
  }
  
  console.log('[DEBUG] Modal configurado, renderizando ações...');
  // Resetar botões de edição
  const editBtn = document.getElementById("arena-dossier-edit-meta");
  
  // Adicionar evento de clique no botão editar
  if (editBtn) {
    editBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      console.log('[DEBUG] Botão editar clicado, entrando em modo edição');
      
      // Adicionar classe de edição ao modal
      modal.classList.add("is-editing");
      
      // Mostrar inputs e esconder displays
      if (titleInput) {
        titleInput.value = arena.title || "";
        titleInput.style.display = "block";
      }
      if (title) title.style.display = "none";
      
      if (descriptionInput) {
        descriptionInput.value = arena.description || "";
        descriptionInput.style.display = "block";
      }
      if (macro) macro.style.display = "none";
      
      // Mostrar select de ativo e esconder display
      if (assetSelect) {
        assetSelect.style.display = "block";
        // Preencher com opções de ativos
        assetSelect.innerHTML = "";
        SEPHIROT.forEach(asset => {
          const option = document.createElement("option");
          option.value = asset.id;
          option.textContent = asset.label;
          if (asset.id === arena.assetId) option.selected = true;
          assetSelect.appendChild(option);
        });
      }
      if (asset) asset.style.display = "none";
      
      // Mostrar grade de ícones
      if (iconGrid) {
        iconGrid.style.display = "none"; // Escondido por padrão
        iconGrid.innerHTML = "";
        // Usar BRONZE_ICONS em vez de ICONS
        const availableIcons = BRONZE_ICONS || ['circle', 'star', 'heart', 'shield', 'sword', 'crown'];
        availableIcons.forEach(iconName => {
          const option = document.createElement("button");
          option.type = "button";
          option.className = "icon-option";
          if (iconName === (modal.dataset.icon || "circle")) option.classList.add("is-selected");
          option.dataset.icon = iconName;
          const icon = document.createElement("i");
          icon.setAttribute("data-lucide", iconName);
          option.appendChild(icon);
          option.addEventListener("click", () => {
            iconGrid.querySelectorAll(".icon-option").forEach(el => el.classList.remove("is-selected"));
            option.classList.add("is-selected");
            modal.dataset.icon = iconName;
            // Atualizar logo
            logo.innerHTML = `<i data-lucide="${iconName}"></i>`;
            if (window.lucide) window.lucide.createIcons();
          });
          iconGrid.appendChild(option);
        });
      }
      
      // Mudar botões
      if (editBtn) editBtn.style.display = "none";
      
      if (window.lucide) window.lucide.createIcons();
      console.log('[DEBUG] Modo edição ativado');
    });
  }
  
  if (editBtn) editBtn.style.display = "flex";
  if (progressFill) {
    progressFill.style.width = `${Math.min(100, Math.max(0, completionValue))}%`;
  }
  bronzeList.innerHTML = "";
  const planner = loadPlanner();
  const actions = planner.bronzeActions.filter((action) => action.arenaId === arenaId);
  console.log('[DEBUG] Ações encontradas para arena:', actions.length);
  if (actions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "arena-empty";
    empty.textContent = "Sem acoes de bronze.";
    bronzeList.appendChild(empty);
  } else {
    // Criar layout horizontal para ações bronze
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "arena-actions-container";
    actionsContainer.style.cssText = `
      display: flex !important;
      flex-wrap: nowrap !important;
      gap: 4px !important;
      align-items: center !important;
      justify-content: flex-start !important;
      padding: 4px !important;
      min-height: 60px !important;
      max-height: 60px !important;
      overflow-x: auto !important;
      overflow-y: hidden !important;
      width: 100% !important;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
      grid-template-columns: none !important;
      grid-template-rows: none !important;
      grid: none !important;
    `;
    
    // Esconder scrollbar no WebKit (Chrome, Safari, Edge)
    const style = document.createElement('style');
    style.textContent = `
      .arena-actions-container::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
    `;
    document.head.appendChild(style);
    
    actions.forEach((action) => {
      // Criar quadrado simples sem editar/deletar
      const actionSquare = document.createElement("div");
      actionSquare.className = "arena-action-square";
      actionSquare.style.cssText = `
        width: 50px;
        height: 50px;
        min-width: 50px;
        min-height: 50px;
        border-radius: 8px;
        background: rgba(24, 18, 14, 0.9);
        border: 1px solid rgba(182, 128, 74, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        flex-shrink: 0;
      `;
      
      // Adicionar ícone
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", action.icon || "circle");
      icon.style.cssText = `
        width: 20px;
        height: 20px;
        color: #e5c7a3;
      `;
      actionSquare.appendChild(icon);
      
      // Hover effect
      actionSquare.addEventListener("mouseenter", () => {
        actionSquare.style.background = "rgba(182, 128, 74, 0.3)";
        actionSquare.style.borderColor = "rgba(182, 128, 74, 0.8)";
      });
      
      actionSquare.addEventListener("mouseleave", () => {
        actionSquare.style.background = "rgba(24, 18, 14, 0.9)";
        actionSquare.style.borderColor = "rgba(182, 128, 74, 0.6)";
      });
      
      // Click para abrir modal da ação
      actionSquare.addEventListener("click", () => {
        openBronzeModal(action.arenaId, action.id);
      });
      
      actionsContainer.appendChild(actionSquare);
    });
    
    // Adicionar botão + ao final
    const addSquare = document.createElement("div");
    addSquare.className = "arena-action-square arena-add-square";
    addSquare.style.cssText = `
      width: 50px;
      height: 50px;
      min-width: 50px;
      min-height: 50px;
      border-radius: 8px;
      background: rgba(212, 175, 55, 0.2);
      border: 2px dashed rgba(212, 175, 55, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    `;
    
    const plusIcon = document.createElement("i");
    plusIcon.setAttribute("data-lucide", "plus");
    plusIcon.style.cssText = `
      width: 20px;
      height: 20px;
      color: #f7e7b3;
    `;
    addSquare.appendChild(plusIcon);
    
    addSquare.addEventListener("click", () => {
      openBronzeModal(arenaId);
    });
    
    actionsContainer.appendChild(addSquare);
    bronzeList.appendChild(actionsContainer);
  }
  
  if (window.lucide) window.lucide.createIcons();
  console.log('[DEBUG] Modal arena dossier aberto com sucesso');
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

  // Remover is-default de todos os avatares primeiro
  if (socialAvatar) {
    socialAvatar.classList.remove("is-default");
    socialAvatar.style.pointerEvents = "auto";
    socialAvatar.style.cursor = "pointer";
  }

  if (hudAvatar) {
    hudAvatar.classList.remove("is-default");
    hudAvatar.style.pointerEvents = "auto";
    hudAvatar.style.cursor = "pointer";
  }

  // Avatar social
  if (socialAvatar && profile.avatar) {
    socialAvatar.style.backgroundImage = `url(${profile.avatar})`;
    socialAvatar.style.backgroundSize = "cover";
    socialAvatar.style.backgroundPosition = "center";
    socialAvatar.classList.add("has-avatar");
    socialAvatar.classList.remove("is-default");
  } else if (socialAvatar) {
    socialAvatar.classList.remove("has-avatar");
    socialAvatar.classList.remove("is-default");
  }

  // Avatar do HUD
  if (hudAvatar && profile.avatar) {
    hudAvatar.style.backgroundImage = `url(${profile.avatar})`;
    hudAvatar.style.backgroundSize = "cover";
    hudAvatar.style.backgroundPosition = "center";
    hudAvatar.style.backgroundColor = "transparent";
    hudAvatar.classList.add("has-avatar");
    hudAvatar.classList.remove("is-default");
  } else if (hudAvatar) {
    hudAvatar.classList.remove("has-avatar");
    hudAvatar.classList.remove("is-default");
    hudAvatar.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
  }
  
  // Aplicar borda ao avatar do HUD
  if (hudAvatar && profile.profileBorderImage) {
    const wrapper = document.createElement("div");
    wrapper.className = "avatar-border-wrapper";
    wrapper.style.position = "relative";
    wrapper.style.width = "54px";
    wrapper.style.height = "54px";
    wrapper.style.borderRadius = "50%";
    wrapper.style.padding = "4px";
    wrapper.style.backgroundImage = `url(${profile.profileBorderImage})`;
    wrapper.style.backgroundSize = "cover";
    wrapper.style.backgroundPosition = "center";
    
    const avatarClone = hudAvatar.cloneNode(true);
    avatarClone.style.border = "none";
    avatarClone.style.width = "46px";
    avatarClone.style.height = "46px";
    wrapper.appendChild(avatarClone);
    hudAvatar.replaceWith(wrapper);
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

const getConscienciaLema = () => {
  const dna = seedDNAIfMissing();
  const asset = getAssetFromDNA(dna, "consciencia");
  const slot = asset?.profileSlots?.["consciencia.lema"];
  return slot?.value;
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
  const m4 = Boolean(getConscienciaLema());
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
        Arraste sua Acao para um horario futuro, depois segure 3s para concluir.
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
      <div class="drawer-title">Defina seu Lema no Ativo Consciência</div>
      <div class="init-actions">
        <button class="gold-button" id="init-open-consciencia">Abrir Consciência</button>
        <button class="silver-button" id="init-pass-through">Liberar interacao</button>
      </div>
    `;
    const button = document.getElementById("init-open-consciencia");
    button?.addEventListener("click", () => {
      openTreeEditor("consciencia");
    });
    const passThrough = document.getElementById("init-pass-through");
    passThrough?.addEventListener("click", () => {
      overlay.classList.add("is-pass-through");
      openTreeEditor("consciencia");
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

  // Bay area: aceitar drop de ações do grid para voltar ao backlog (desistir da ação)
  const bronzeList = document.getElementById("bronze-list");
  if (bronzeList) {
    bronzeList.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });
    bronzeList.addEventListener("drop", (e) => {
      e.preventDefault();
      console.log('🎯 Drop no bronzeList (bay area)');
      const payload = e.dataTransfer?.getData("text/plain");
      if (!payload || !payload.startsWith("bronze:")) return;
      const actionId = payload.replace("bronze:", "");
      const planner = loadPlanner();
      const updated = planner.bronzeActions.map((a) => {
        if (a.id !== actionId) return a;
        // Voltar para backlog: scheduled/done -> backlog
        // Permitir voltar para backlog se estiver scheduled OU done (desistir da ação)
        const isDone = a.status === "done";
        const hasHistory = Array.isArray(a.completedHistory) && a.completedHistory.length > 0;
        const wasDone = isDone || hasHistory;
        
        // Decrementar contador se estava done
        if (wasDone && a.arenaId) {
          try { 
            updateArenaCountsForBronze(a.arenaId, -1); 
          } catch (_) {}
        }
        
        return {
          ...a,
          status: "backlog",
          scheduledHour: undefined,
          scheduledMinute: undefined,
          scheduledDayOffset: undefined,
          completedAt: undefined,
          completedHistory: [],
        };
      });
      savePlanner({ ...planner, bronzeActions: updated });
      updateGlobalArenaProgress(
        planner.bronzeActions.find((x) => x.id === actionId)?.arenaId,
        updated,
      );
      renderPlanner();
      checkMissionProgress();
    });
  }

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
  if (dayPrev) {
    dayPrev.addEventListener("click", () => {
      playMetalClick();
      const plannerLayout = document.querySelector(".planner-layout");
      const isWeekView = plannerLayout?.classList.contains("week-view");
      if (isWeekView) {
        setPlannerWeekOffset(plannerWeekOffset - 1);
      } else {
        setPlannerDayOffset(plannerDayOffset - 1);
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }
  if (dayNext) {
    dayNext.addEventListener("click", () => {
      playMetalClick();
      const plannerLayout = document.querySelector(".planner-layout");
      const isWeekView = plannerLayout?.classList.contains("week-view");
      if (isWeekView) {
        setPlannerWeekOffset(plannerWeekOffset + 1);
      } else {
        setPlannerDayOffset(plannerDayOffset + 1);
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }
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
    // Salvar posição do scroll antes de mudar
    if (mode === "week" && timeline) {
      plannerScrollPosition = timeline.scrollTop || 0;
    } else if (mode === "day" && weekGrid) {
      plannerScrollPosition = weekGrid.scrollTop || 0;
    }
    
    if (viewDay && viewWeek) {
      viewDay.classList.toggle("is-active", mode === "day");
      viewWeek.classList.toggle("is-active", mode === "week");
    }
    if (plannerLayout) plannerLayout.classList.toggle("week-view", mode === "week");
    if (timeline) timeline.classList.toggle("is-hidden", mode !== "day");
    // Bronze backlog sempre visível (dia e semana)
    if (bronzeBacklog) bronzeBacklog.classList.remove("is-hidden");
    if (weekGrid) {
      weekGrid.classList.toggle("is-hidden", mode !== "week");
    }
    
    // Sincronizar offsets ao mudar de view
    if (mode === "week") {
      // Ao mudar para semana, calcular semana baseada no dia atual
      const dayDate = getPlannerDateFromOffset(plannerDayOffset);
      const weekStartOfDay = getWeekStartDate(dayDate);
      const todayWeekStart = getWeekStartDate(new Date());
      const diffDays = Math.floor((weekStartOfDay.getTime() - todayWeekStart.getTime()) / (1000 * 60 * 60 * 24));
      plannerWeekOffset = Math.floor(diffDays / 7);
      renderWeekView();
      // Restaurar posição do scroll após renderizar
      setTimeout(() => {
        if (weekGrid) {
          weekGrid.scrollTop = plannerScrollPosition;
        }
      }, 0);
    } else {
      // Ao mudar para dia, garantir que o dia está sincronizado
      renderPlanner();
      // Restaurar posição do scroll após renderizar
      setTimeout(() => {
        if (timeline) {
          timeline.scrollTop = plannerScrollPosition;
        }
      }, 0);
    }
    updateDayLabel();
  };
  // Atualizar posição do scroll quando o usuário rolar manualmente
  if (timeline) {
    timeline.addEventListener("scroll", () => {
      plannerScrollPosition = timeline.scrollTop || 0;
    });
  }
  if (weekGrid) {
    weekGrid.addEventListener("scroll", () => {
      plannerScrollPosition = weekGrid.scrollTop || 0;
    });
  }
  
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
  const scanContainer = document.getElementById("scan-container");
  
  // Carregar histórico ao inicializar
  renderHistoryList();

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
      setTimeout(async () => {
        try {
          console.log("[Scan] Chamando startScanAnimation com:", { startDate, endDate });
          await startScanAnimation(startDate, endDate);
        } catch (error) {
          console.error("[Scan] Erro ao iniciar animação:", error);
          console.error("[Scan] Stack trace:", error.stack);
          alert("Erro ao gerar relatório: " + error.message);
        }
      }, 200);
    });
  }

  // Removido seletor de período - sempre mostrar todos os relatórios salvos

  const scanCloseBtn = document.getElementById("scan-close-btn");
  if (scanCloseBtn) {
    scanCloseBtn.addEventListener("click", () => {
      playMetalClick();
      const scanContainer = document.getElementById("scan-container");
      if (scanContainer) {
        // Limpar intervalo de verificação
        const intervalId = scanContainer.dataset.keepVisibleInterval;
        if (intervalId) {
          clearInterval(parseInt(intervalId));
          delete scanContainer.dataset.keepVisibleInterval;
        }
        // Remover flag e fechar
        scanContainer.dataset.scanActive = "false";
        scanContainer.classList.add("is-hidden");
        const scanCards = scanContainer.querySelector("#scan-cards");
        if (scanCards) scanCards.innerHTML = "";
        const scanAnimation = scanContainer.querySelector("#scan-animation");
        if (scanAnimation) {
          scanAnimation.classList.remove("is-scanning");
          scanAnimation.style.display = "none";
        }
      }
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
      label: "Conexões",
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
  
  // Forçar migração completa de dados antigos
  forceCompleteMigration();
  
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
  initSocialSearch();
  renderSocialFriends();
  renderSocialClan();
  
  // Fechar modal de perfil externo
  const externalProfileClose = document.getElementById("external-profile-close");
  const externalProfileModal = document.getElementById("external-profile-modal");
  if (externalProfileClose && externalProfileModal) {
    externalProfileClose.addEventListener("click", () => {
      externalProfileModal.classList.remove("is-open");
    });
  }
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
      const modal = document.getElementById("arena-modal");
      const titleInput = document.getElementById("arena-title");
      const assetSelect = document.getElementById("arena-asset");
      const addBronze = document.getElementById("arena-add-bronze");
      const descriptionInput = document.getElementById("arena-description");
      if (!titleInput || !assetSelect || !descriptionInput) return;
      const title = titleInput.value.trim();
      if (!title) return;
      const description = descriptionInput.value.trim();
      const customIcon = modal?.dataset.icon || "";
      const arenas = loadArenas();
      const newArena = {
        id: crypto.randomUUID(),
        title,
        completion: 0,
        assetId: assetSelect.value,
        targetCount: null,
        completedCount: 0,
        description,
        icon: customIcon || undefined,
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
      console.log('💾 Botão salvar bronze clicado');
      const modal = document.getElementById("bronze-modal");
      const titleInput = document.getElementById("bronze-title");
      const durationInput = document.getElementById("bronze-duration");
      const seriousToggle = document.getElementById("bronze-serious");
      const atemporalToggle = document.getElementById("bronze-atemporal");
      if (!modal || !durationInput || !seriousToggle || !titleInput) {
        console.log('❌ Elementos não encontrados');
        return;
      }
      const arenaId = modal.dataset.arenaId;
      if (!arenaId) {
        console.log('❌ Arena ID não encontrado');
        return;
      }
      const title = titleInput.value.trim();
      if (!title) {
        console.log('❌ Título vazio');
        return;
      }
      console.log('💾 Dados da ação:', { title, arenaId });
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
      console.log('💾 Planner antes:', planner.bronzeActions.length, 'ações');
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
        console.log('💾 Nova ação adicionada ao planner');
      }
      console.log('💾 Planner depois:', planner.bronzeActions.length, 'ações');
      console.log('💾 Salvando planner...');
      savePlanner(planner);
      console.log('💾 Planner salvo, chamando renderPlanner()');
      renderPlanner();
      console.log('💾 renderPlanner() concluído');
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
  const arenaDossierOk = document.getElementById("arena-dossier-ok");
  
  if (arenaDossierEditMeta && arenaDossier) {
    arenaDossierEditMeta.addEventListener("click", () => {
      const arenaId = arenaDossier.dataset.arenaId;
      if (!arenaId) return;
      const isEditing = arenaDossier.classList.contains("is-editing");
      
      if (!isEditing) {
        // Entrar no modo de edição
        arenaDossier.classList.add("is-editing");
        if (arenaDossierEditMeta) arenaDossierEditMeta.style.display = "none";
        if (arenaDossierOk) arenaDossierOk.style.display = "flex";
        
        const arenas = loadArenas();
        const arena = arenas.find((item) => item.id === arenaId);
        if (!arena) return;
        
        const titleInput = document.getElementById("arena-dossier-title-input");
        const titleDisplay = document.getElementById("arena-dossier-title");
        const descriptionInput = document.getElementById("arena-dossier-description-input");
        const descriptionDisplay = document.getElementById("arena-dossier-macro");
        const assetSelect = document.getElementById("arena-dossier-asset-select");
        const assetDisplay = document.getElementById("arena-dossier-asset");
        const logo = document.getElementById("arena-dossier-logo");
        const iconGrid = document.getElementById("arena-dossier-icon-grid");
        
        if (titleInput && titleDisplay) {
          titleInput.value = arena.title || "";
          titleInput.style.display = "block";
          titleDisplay.style.display = "none";
        }
        
        if (descriptionInput && descriptionDisplay) {
          descriptionInput.value = arena.description || "";
          descriptionInput.style.display = "block";
          descriptionDisplay.style.display = "none";
        }
        
        if (assetSelect && assetDisplay) {
          assetSelect.innerHTML = "";
          SEPHIROT.forEach((asset) => {
            const option = document.createElement("option");
            option.value = asset.id;
            option.textContent = asset.label;
            if (arena.assetId === asset.id) option.selected = true;
            assetSelect.appendChild(option);
          });
          assetSelect.style.display = "block";
          assetDisplay.style.display = "none";
          
          // Remover listener anterior se existir e adicionar novo
          const handleAssetChange = () => {
            const selectedAsset = SEPHIROT.find((a) => a.id === assetSelect.value);
            if (selectedAsset && logo && !arenaDossier.dataset.icon) {
              const iconName = ICON_BY_ID[selectedAsset.id] || "circle";
              logo.innerHTML = `<i data-lucide="${iconName}"></i>`;
              if (window.lucide) window.lucide.createIcons();
            }
          };
          
          assetSelect.removeEventListener("change", handleAssetChange);
          assetSelect.addEventListener("change", handleAssetChange);
        }
        
        if (logo) {
          logo.classList.add("arena-dossier-logo-editable");
          logo.style.cursor = "pointer";
          logo.onclick = (e) => {
            e.stopPropagation();
            const isIconEditing = arenaDossier.classList.contains("is-icon-editing");
            arenaDossier.classList.toggle("is-icon-editing", !isIconEditing);
            if (!isIconEditing && iconGrid) {
              iconGrid.innerHTML = "";
              ARENA_ICONS.forEach((iconName) => {
                const option = document.createElement("button");
                option.type = "button";
                option.className = "icon-option";
                option.dataset.icon = iconName;
                option.innerHTML = `<i data-lucide="${iconName}"></i>`;
                option.addEventListener("click", (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  arenaDossier.dataset.icon = iconName;
                  logo.innerHTML = `<i data-lucide="${iconName}"></i>`;
                  if (window.lucide) window.lucide.createIcons();
                  iconGrid.querySelectorAll(".icon-option").forEach((el) => el.classList.remove("is-selected"));
                  option.classList.add("is-selected");
                  arenaDossier.classList.remove("is-icon-editing");
                  iconGrid.style.display = "none";
                  if (window.lucide) window.lucide.createIcons();
                });
                iconGrid.appendChild(option);
              });
              if (window.lucide) window.lucide.createIcons();
              iconGrid.style.display = "grid";
            } else if (iconGrid) {
              iconGrid.style.display = "none";
            }
          };
        }
        
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
  
  if (arenaDossierOk && arenaDossier) {
    arenaDossierOk.addEventListener("click", () => {
      const arenaId = arenaDossier.dataset.arenaId;
      if (!arenaId) return;
      
      // Salvar e sair do modo de edição
      const titleInput = document.getElementById("arena-dossier-title-input");
      const titleDisplay = document.getElementById("arena-dossier-title");
      const descriptionInput = document.getElementById("arena-dossier-description-input");
      const descriptionDisplay = document.getElementById("arena-dossier-macro");
      const assetSelect = document.getElementById("arena-dossier-asset-select");
      const assetDisplay = document.getElementById("arena-dossier-asset");
      const logo = document.getElementById("arena-dossier-logo");
      const iconGrid = document.getElementById("arena-dossier-icon-grid");
      
      const arenas = loadArenas();
      const updatedArenas = arenas.map((item) => {
        if (item.id !== arenaId) return item;
        const title = titleInput?.value.trim() || item.title;
        const description = descriptionInput?.value.trim() || item.description;
        const assetId = assetSelect?.value || item.assetId;
        const customIcon = arenaDossier.dataset.icon || item.icon;
        
        return {
          ...item,
          title,
          description,
          assetId,
          icon: customIcon || undefined,
        };
      });
      
      saveArenas(updatedArenas);
      renderArenas();
      openArenaDossier(arenaId);
      
      if (arenaDossierEditMeta) arenaDossierEditMeta.style.display = "flex";
      if (arenaDossierOk) arenaDossierOk.style.display = "none";
    });
  }
  const avatar = document.getElementById("hud-avatar");
  const profileModal = document.getElementById("profile-modal");
  const profileClose = document.getElementById("profile-close");
  const profileIdentity = document.getElementById("profile-identity");
  const profileThemeButtons = document.querySelectorAll(".profile-theme-btn");
  const profileNameDisplay = document.getElementById("profile-name-display");
  const widgetGrid = document.getElementById("widget-grid");
  const profileLevel = document.getElementById("profile-level");
  const profileEdit = document.getElementById("profile-edit");
  const profileSave = document.getElementById("profile-save");
  const profileSync = document.getElementById("profile-sync");
  const profileAvatarFile = document.getElementById("profile-avatar-file");
  // Forçar remoção do is-default em todos os avatares no carregamento
  const forceRemoveIsDefault = () => {
    // Avatar do perfil
    const profileAvatar = document.querySelector(".profile-avatar");
    if (profileAvatar) {
      profileAvatar.classList.remove("is-default");
      profileAvatar.style.pointerEvents = "auto";
      profileAvatar.style.cursor = "pointer";
    }
    
    // Avatar do HUD
    const hudAvatar = document.getElementById("hud-avatar");
    if (hudAvatar) {
      hudAvatar.classList.remove("is-default");
      hudAvatar.style.pointerEvents = "auto";
      hudAvatar.style.cursor = "pointer";
    }
    
    // Avatar social
    const socialAvatar = document.querySelector(".social-avatar");
    if (socialAvatar) {
      socialAvatar.classList.remove("is-default");
      socialAvatar.style.pointerEvents = "auto";
      socialAvatar.style.cursor = "pointer";
    }
  };
  
  // Executar imediatamente e também após um delay
  forceRemoveIsDefault();
  setTimeout(forceRemoveIsDefault, 100);
  setTimeout(forceRemoveIsDefault, 1000);
  
  // Forçar atualização do cabeçalho após carregar
  setTimeout(() => {
    renderSocial();
  }, 500);
  
  // Forçar atualização do cabeçalho novamente
  setTimeout(() => {
    renderSocial();
  }, 1500);
  
  // Forçar atualização do cabeçalho mais uma vez
  setTimeout(() => {
    renderSocial();
  }, 3000);
  
  // Forçar atualização do cabeçalho mais uma vez
  setTimeout(() => {
    renderSocial();
  }, 5000);
  
  // Forçar atualização do cabeçalho mais uma vez
  setTimeout(() => {
    renderSocial();
  }, 7000);
  
  // Forçar atualização do cabeçalho mais uma vez
  setTimeout(() => {
    renderSocial();
  }, 10000);
  
  // Forçar atualização do cabeçalho mais uma vez
  setTimeout(() => {
    renderSocial();
  }, 15000);
  
  // Forçar atualização do cabeçalho mais uma vez
  setTimeout(() => {
    renderSocial();
  }, 20000);
  
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
      // Círculo do avatar e borda atual (sem loading-diamond)
      const profileAvatar = profileModal.querySelector(".profile-avatar");
      const borderRing = document.getElementById("profile-avatar-border");
      if (profileAvatar) {
        if (profile.avatar) {
          profileAvatar.style.backgroundImage = `url(${profile.avatar})`;
          profileAvatar.classList.add("has-avatar");
        } else {
          profileAvatar.style.backgroundImage = "";
          profileAvatar.classList.remove("has-avatar");
        }
        // Remover is-default que bloqueia cliques
        profileAvatar.classList.remove("is-default");
      }
      if (borderRing) {
        if (profile.profileBorderImage) {
          borderRing.style.backgroundImage = `url(${profile.profileBorderImage})`;
          borderRing.style.border = "none";
        } else {
          borderRing.style.backgroundImage = "";
          borderRing.style.border = "6px solid rgba(212, 175, 55, 0.75)";
        }
      }
      // Aplicar banner na área visual abaixo do nickname
      const bannerVisual = document.getElementById("profile-banner-visual");
      if (bannerVisual) {
        // Remover imagem anterior se existir
        const existingImg = bannerVisual.querySelector("img");
        if (existingImg) {
          existingImg.remove();
        }
        
        if (profile.banner) {
          const isImageBanner = profile.banner.startsWith("http") || profile.banner.startsWith("data:");
          if (isImageBanner) {
            // Criar tag img para mostrar a imagem completa sem cortar
            const img = document.createElement("img");
            img.src = profile.banner;
            img.style.width = "100%";
            img.style.maxWidth = "400px";
            img.style.height = "auto";
            img.style.display = "block";
            img.style.borderRadius = "0";
            img.style.objectFit = "contain";
            bannerVisual.appendChild(img);
            bannerVisual.style.backgroundImage = "";
          } else {
            bannerVisual.style.backgroundImage = "";
          }
        } else {
          bannerVisual.style.backgroundImage = "";
        }
        // Sempre mostrar o banner visual (mesmo sem imagem)
        bannerVisual.style.display = "flex";
      }
      
      // Avatar e borda já aplicados acima no círculo e no anel
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
      
      // Atualizar banner visual
      const bannerVisual = document.getElementById("profile-banner-visual");
      if (bannerVisual) {
        // Remover imagem anterior se existir
        const existingImg = bannerVisual.querySelector("img");
        if (existingImg) {
          existingImg.remove();
        }
        
        const isImageBanner = updated.banner?.startsWith("http") || updated.banner?.startsWith("data:");
        if (isImageBanner && updated.banner) {
          // Criar tag img para mostrar a imagem completa sem cortar
          const img = document.createElement("img");
          img.src = updated.banner;
          img.style.width = "100%";
          img.style.maxWidth = "400px";
          img.style.height = "auto";
          img.style.display = "block";
          img.style.borderRadius = "0";
          img.style.objectFit = "contain";
          bannerVisual.appendChild(img);
          bannerVisual.style.backgroundImage = "";
        } else {
          bannerVisual.style.backgroundImage = "";
        }
        bannerVisual.style.display = "flex";
      }
      
      if (profileSync) {
        profileSync.classList.remove("is-ok", "is-error");
        profileSync.textContent = isSupabaseEnabled() ? "Sincronizando..." : "Supabase nao configurado";
      }
      const okProfile = await ensureSupabaseProfile(updated);
      const okTotals = await syncProfileTotals(updated);
      
      // Forçar atualização completa do cabeçalho após salvar
      setTimeout(() => {
        renderSocial();
      }, 100);
      
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
    // Centro = editar avatar; bordas = editar borda
    let avatarClickHandler = (e) => {
      if (!profileCard || !profileCard.classList.contains("is-editing")) return;
      
      const clickedAvatar = e.target.closest(".profile-avatar");
      const borderRing = e.target.closest("#profile-avatar-border, .profile-avatar-border-ring");
      
      // Calcular distância do centro
      if (clickedAvatar) {
        const rect = clickedAvatar.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const clickX = e.clientX;
        const clickY = e.clientY;
        const distance = Math.sqrt(Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2));
        const radius = rect.width / 2;
        
        // Se clicou no centro (70% do raio) → editar avatar
        if (distance < radius * 0.7) {
          e.stopPropagation();
          e.preventDefault();
          profileAvatarFile.click();
          return;
        }
        
        // Se clicou nos cantos (30% externa) → editar borda
        if (distance >= radius * 0.7) {
          e.stopPropagation();
          e.preventDefault();
          const borderModal = document.getElementById("border-modal");
          if (borderModal) {
            debugListAllStorage();
            renderBorders();
            borderModal.classList.add("is-open");
          }
          return;
        }
      }
      
      // Se clicou especificamente na borda → editar borda
      if (borderRing) {
        e.stopPropagation();
        e.preventDefault();
        const borderModal = document.getElementById("border-modal");
        if (borderModal) {
          debugListAllStorage();
          renderBorders();
          borderModal.classList.add("is-open");
        }
        return;
      }
    };
    
    profileModal?.addEventListener("click", avatarClickHandler);
    profileAvatarFile.addEventListener("change", () => {
      const file = profileAvatarFile.files?.[0];
      if (!file) return;
      uploadToSupabase(file, `avatars/${crypto.randomUUID()}`).then((url) => {
        if (url) {
          const profile = loadProfile();
          const updated = { ...profile, avatar: url };
          saveProfile(updated);
          const profileAvatar = profileModal?.querySelector(".profile-avatar");
          if (profileAvatar) {
            profileAvatar.style.backgroundImage = `url(${url})`;
            profileAvatar.classList.add("has-avatar");
            // Remover is-default que bloqueia cliques
            profileAvatar.classList.remove("is-default");
          }
          // Atualizar avatar do cabeçalho imediatamente
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
          if (profileAvatar) {
            profileAvatar.style.backgroundImage = `url(${reader.result})`;
            profileAvatar.classList.add("has-avatar");
            // Remover is-default que bloqueia cliques
            profileAvatar.classList.remove("is-default");
          }
          renderSocial();
          renderSocial(); // Adicionando atualização do cabeçalho também no fallback
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
  const renderBanners = async () => {
    if (!bannerGrid) return;
    const profile = loadProfile();
    bannerGrid.innerHTML = '<div class="config-placeholder">Carregando banners...</div>';
    
    // Buscar banners do storage
    const storageBanners = await getBannersFromStorage();
    
    const rewards = [
      {
        id: "baseline",
        title: "SEM BANNER",
        requirement: "Disponível",
        unlocked: true,
        imageUrl: null,
      },
      ...storageBanners,
    ];
    
    bannerGrid.innerHTML = "";
    rewards.forEach((reward) => {
      const card = document.createElement("div");
      card.className = `banner-card${reward.unlocked ? " is-unlocked" : ""}`;
      
      // Preview da imagem do banner
      if (reward.imageUrl) {
        const preview = document.createElement("div");
        preview.className = "banner-preview";
        // Usar tag img para não ter box atrás
        const img = document.createElement("img");
        img.src = reward.imageUrl;
        img.style.width = "100%";
        img.style.height = "30px";
        img.style.objectFit = "cover";
        img.style.display = "block";
        img.style.borderRadius = "0";
        preview.appendChild(img);
        preview.style.backgroundImage = "";
        preview.style.width = "100%";
        preview.style.height = "30px";
        preview.style.borderRadius = "0";
        preview.style.marginBottom = "8px";
        preview.style.border = "none";
        preview.style.background = "transparent";
        preview.style.boxShadow = "none";
        card.appendChild(preview);
      }
      
      const title = document.createElement("div");
      title.className = "banner-title";
      title.textContent = reward.title;
      const btn = document.createElement("button");
      btn.className = "gold-button";
      btn.type = "button";
      btn.textContent = reward.unlocked ? "Aplicar" : "Bloqueado";
      btn.disabled = !reward.unlocked;
      btn.addEventListener("click", () => {
        const bannerUrl = reward.id === "baseline" ? "" : (reward.imageUrl || reward.title);
        const updated = { ...loadProfile(), banner: bannerUrl };
        saveProfile(updated);
        ensureSupabaseProfile(updated);
        syncProfileTotals(updated);
        renderSocial();
        const bannerVisual = document.getElementById("profile-banner-visual");
        const bannerText = updated.banner || "";
        const isImageBanner = bannerText.startsWith("http") || bannerText.startsWith("data:");
        // Aplicar banner na área visual abaixo do nickname
        if (bannerVisual) {
          // Remover imagem anterior se existir
          const existingImg = bannerVisual.querySelector("img");
          if (existingImg) {
            existingImg.remove();
          }
          
          if (isImageBanner) {
            // Criar tag img para mostrar a imagem completa sem cortar
            const img = document.createElement("img");
            img.src = bannerText;
            img.style.width = "100%";
            img.style.maxWidth = "400px";
            img.style.height = "auto";
            img.style.display = "block";
            img.style.borderRadius = "0";
            img.style.objectFit = "contain";
            bannerVisual.appendChild(img);
            bannerVisual.style.backgroundImage = "";
          } else {
            bannerVisual.style.backgroundImage = "";
          }
          // Sempre mostrar o banner visual (mesmo sem imagem)
          bannerVisual.style.display = "flex";
        }
        const bannerModal = document.getElementById("banner-modal");
        if (bannerModal) bannerModal.classList.remove("is-open");
      });
      card.appendChild(title);
      card.appendChild(btn);
      bannerGrid.appendChild(card);
    });
    updateChecklistBadge();
  };
  renderBanners();
  if (bannerClose && bannerModal) {
    bannerClose.addEventListener("click", () => bannerModal.classList.remove("is-open"));
  }

  // Modal de bordas
  const borderModal = document.getElementById("border-modal");
  const borderClose = document.getElementById("border-close");
  const borderGrid = document.getElementById("border-grid");
  const borderOpen = document.getElementById("config-borders-open");

  const renderBorders = async () => {
    if (!borderGrid) return;
    const profile = loadProfile();
    borderGrid.innerHTML = '<div class="config-placeholder">Carregando bordas...</div>';
    
    // Buscar bordas do storage
    const storageBorders = await getBordersFromStorage();
    
    const rewards = [
      {
        id: "baseline",
        title: "SEM BORDA",
        requirement: "Disponível",
        unlocked: true,
        imageUrl: null,
      },
      ...storageBorders,
    ];
    
    borderGrid.innerHTML = "";
    rewards.forEach((reward) => {
      const card = document.createElement("div");
      card.className = `border-card${reward.unlocked ? " is-unlocked" : ""}`;
      
      // Preview da imagem da borda (apenas versão grande)
      const previewContainer = document.createElement("div");
      previewContainer.className = "border-preview-container";
      previewContainer.style.display = "flex";
      previewContainer.style.alignItems = "center";
      previewContainer.style.justifyContent = "center";
      previewContainer.style.width = "100%";
      previewContainer.style.height = "120px";
      previewContainer.style.marginBottom = "8px";
      previewContainer.style.position = "relative";
      
      if (reward.imageUrl) {
        // Mostrar apenas a borda grande
        const borderImg = document.createElement("img");
        borderImg.src = reward.imageUrl;
        borderImg.style.width = "100px";
        borderImg.style.height = "100px";
        borderImg.style.objectFit = "cover";
        borderImg.style.borderRadius = "50%";
        borderImg.style.border = "2px solid rgba(212, 175, 55, 0.3)";
        previewContainer.appendChild(borderImg);
      } else {
        // Mostrar "SEM BORDA"
        const noBorder = document.createElement("div");
        noBorder.style.width = "80px";
        noBorder.style.height = "80px";
        noBorder.style.borderRadius = "50%";
        noBorder.style.border = "2px solid rgba(212, 175, 55, 0.5)";
        noBorder.style.background = "linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(255, 255, 255, 0.1))";
        previewContainer.appendChild(noBorder);
      }
      card.appendChild(previewContainer);
      
      const title = document.createElement("div");
      title.className = "banner-title";
      title.textContent = reward.title;
      const btn = document.createElement("button");
      btn.className = "gold-button";
      btn.type = "button";
      btn.textContent = reward.unlocked ? "Aplicar" : "Bloqueado";
      btn.disabled = !reward.unlocked;
      btn.addEventListener("click", () => {
        const borderUrl = reward.id === "baseline" ? "" : (reward.imageUrl || "");
        const updated = { ...loadProfile(), profileBorderImage: borderUrl };
        saveProfile(updated);
        ensureSupabaseProfile(updated);
        syncProfileTotals(updated);
        renderSocial();
        
        // Forçar atualização completa do cabeçalho após mudar borda
        setTimeout(() => {
          renderSocial();
        }, 100);
        const profileModal = document.getElementById("profile-modal");
        const profileAvatar = profileModal?.querySelector(".profile-avatar");
        const borderRingEl = document.getElementById("profile-avatar-border");
        if (profileAvatar) {
          const currentAvatarUrl = updated.avatar || loadProfile().avatar;
          if (currentAvatarUrl) {
            profileAvatar.style.backgroundImage = `url(${currentAvatarUrl})`;
            profileAvatar.classList.add("has-avatar");
          } else {
            profileAvatar.style.backgroundImage = "";
            profileAvatar.classList.remove("has-avatar");
          }
          // Remover is-default que bloqueia cliques
          profileAvatar.classList.remove("is-default");
        }
        if (borderRingEl) {
          if (borderUrl) {
            borderRingEl.style.backgroundImage = `url(${borderUrl})`;
            borderRingEl.style.border = "none";
          } else {
            borderRingEl.style.backgroundImage = "";
            borderRingEl.style.border = "6px solid rgba(212, 175, 55, 0.75)";
          }
        }
        const borderModal = document.getElementById("border-modal");
        if (borderModal) borderModal.classList.remove("is-open");
      });
      card.appendChild(title);
      card.appendChild(btn);
      borderGrid.appendChild(card);
    });
    updateChecklistBadge();
  };
  
  renderBorders();
  
  // Adicionar cliques no banner visual e borda quando estiver editando
  const bannerVisual = document.getElementById("profile-banner-visual");
  
  if (bannerVisual && bannerModal) {
    bannerVisual.addEventListener("click", () => {
      if (profileCard && profileCard.classList.contains("is-editing")) {
        debugListAllStorage();
        renderBanners();
        bannerModal.classList.add("is-open");
      }
    });
    // Adicionar cursor pointer quando estiver editando
    const updateBannerCursor = () => {
      if (profileCard && profileCard.classList.contains("is-editing")) {
        bannerVisual.style.cursor = "pointer";
        bannerVisual.style.opacity = "0.9";
      } else {
        bannerVisual.style.cursor = "default";
        bannerVisual.style.opacity = "1";
      }
    };
    // Observar mudanças no estado de edição
    if (profileCard) {
      const observer = new MutationObserver(updateBannerCursor);
      observer.observe(profileCard, { attributes: true, attributeFilter: ["class"] });
      updateBannerCursor();
    }
  }
  
  const updateAvatarCursor = () => {
    const profileAvatar = profileModal?.querySelector(".profile-avatar");
    const borderRing = document.getElementById("profile-avatar-border");
    const editing = profileCard && profileCard.classList.contains("is-editing");
    if (profileAvatar) {
      profileAvatar.style.cursor = editing ? "pointer" : "default";
      profileAvatar.style.opacity = editing ? "0.95" : "1";
    }
    if (borderRing) {
      borderRing.style.cursor = editing ? "pointer" : "default";
      borderRing.style.opacity = editing ? "0.95" : "1";
    }
  };
  
  if (profileCard) {
    const observer = new MutationObserver(updateAvatarCursor);
    observer.observe(profileCard, { attributes: true, attributeFilter: ["class"] });
    updateAvatarCursor();
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
        if (lemaValue && assetId === "consciencia") {
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
  console.log("[buildHistorySummaryForRange] === INÍCIO ===");
  console.log("[buildHistorySummaryForRange] Parâmetros:", {
    hasPlanner: !!planner,
    hasArenas: !!arenas,
    startDate,
    endDate,
    plannerType: typeof planner,
    arenasType: typeof arenas
  });
  
  const actions = Array.isArray(planner?.bronzeActions) ? planner.bronzeActions : [];
  console.log("[buildHistorySummaryForRange] Ações encontradas:", actions.length);
  
  const arenasById = new Map((arenas || []).map((arena) => [arena.id, arena]));
  console.log("[buildHistorySummaryForRange] Arenas mapeadas:", arenasById.size);
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
  
  const result = {
    stats: Array.from(stats.values()),
    totalPlanned,
    totalDone,
    totalHours: Math.round(totalHours * 10) / 10,
    score,
  };
  
  console.log("[buildHistorySummaryForRange] Resultado:", result);
  console.log("[buildHistorySummaryForRange] === FIM ===");
  
  return result;
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

const renderHistoryList = () => {
  const listEl = document.getElementById("history-list");
  if (!listEl) return;

  listEl.innerHTML = '<div class="config-placeholder">Carregando histórico...</div>';

  // Carregar relatórios salvos
  const savedReports = loadReports();
  
  // Ordenar por data de criação (mais recentes primeiro)
  savedReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (savedReports.length === 0) {
    listEl.innerHTML = '<div class="config-placeholder">Sem relatórios ainda. Crie um novo relatório!</div>';
    return;
  }

  listEl.innerHTML = "";
  savedReports.forEach((report) => {
    const startDate = new Date(report.startDate);
    const endDate = new Date(report.endDate);
    const periodLabel = `${formatShortDate(startDate)} a ${formatShortDate(endDate)}`;
    
    const card = document.createElement("div");
    card.className = "history-summary-card";
    card.dataset.reportId = report.id;
    card.style.cursor = "pointer";

    const header = document.createElement("div");
    header.className = "history-summary-header";

    const label = document.createElement("div");
    label.className = "history-summary-label";
    label.textContent = periodLabel;

    const score = document.createElement("div");
    score.className = "history-summary-score";
    score.textContent = `${report.score}%`;

    header.appendChild(label);
    header.appendChild(score);

    const progress = document.createElement("div");
    progress.className = "history-summary-progress";
    const fill = document.createElement("div");
    fill.className = "history-summary-progress-fill";
    fill.style.width = `${Math.max(0, Math.min(100, report.score))}%`;
    progress.appendChild(fill);

    const meta = document.createElement("div");
    meta.className = "history-summary-meta";
    meta.textContent = `${report.totalDone}/${report.totalPlanned} ações • ${report.totalHours}h`;

    card.appendChild(header);
    card.appendChild(progress);
    card.appendChild(meta);
    
    // Adicionar evento de clique para abrir o relatório
    card.addEventListener("click", () => {
      playMetalClick();
      const reportData = {
        startDate: startDate,
        endDate: endDate,
        score: report.score,
        totalPlanned: report.totalPlanned,
        totalDone: report.totalDone,
        totalHours: report.totalHours,
        stats: report.stats || [],
      };
      startScanAnimation(startDate, endDate, reportData);
    });

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
  const days = Math.ceil((report.endDate.getTime() - report.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const rating = report.score || 0;
  const startDateStr = formatShortDate(report.startDate);
  const endDateStr = formatShortDate(report.endDate);
  container.innerHTML = `
    <div class="scan-card-header">
      <i data-lucide="star"></i>
      <span>Parabéns!</span>
    </div>
    <div class="scan-card-body">
      <div class="scan-rating-number">${rating}</div>
      <div class="scan-rating-label">Rating de Performance</div>
      <div class="scan-rating-meta">Tempo analisado: ${days} dias (${startDateStr} a ${endDateStr})</div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
};

const renderScanCardMetrics = (report, container) => {
  container.innerHTML = `
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

  container.innerHTML = `
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

  container.innerHTML = `
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
  if (window.lucide) window.lucide.createIcons();
};

const renderScanCardSummary = (report, container) => {
  const profile = loadProfile();
  container.id = "scan-summary-card";
  const periodLabel = `${formatShortDate(report.startDate)} a ${formatShortDate(report.endDate)}`;
  container.innerHTML = `
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
      <button class="scan-summary-share gold-button" id="scan-summary-share">
        <i data-lucide="share-2"></i>
        <span>Compartilhar Card</span>
      </button>
      <button class="scan-summary-download silver-button" id="scan-summary-download">
        <i data-lucide="download"></i>
        <span>Baixar Relatório</span>
      </button>
      <button class="scan-summary-ok gold-button" id="scan-summary-ok">
        <i data-lucide="check"></i>
        <span>OK</span>
      </button>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();

  const shareBtn = document.getElementById("scan-summary-share");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const target = document.getElementById("scan-summary-card");
      if (!target) return;
      if (navigator.share && window.html2canvas) {
        try {
          const canvas = await window.html2canvas(target, {
            backgroundColor: "#0f1115",
            scale: 2,
          });
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
          await navigator.share({
            title: `Relatório de Progresso - ${periodLabel}`,
            text: `Meu rating: ${report.score}`,
            files: [new File([blob], `relatorio-${formatDateKey(report.startDate)}.png`, { type: "image/png" })],
          });
        } catch (error) {
          console.error("Erro ao compartilhar:", error);
          // Fallback para download
          const downloadBtn = document.getElementById("scan-summary-download");
          if (downloadBtn) downloadBtn.click();
        }
      } else {
        // Fallback para download se share não disponível
        const downloadBtn = document.getElementById("scan-summary-download");
        if (downloadBtn) downloadBtn.click();
      }
    });
  }
  
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
  
  const okBtn = document.getElementById("scan-summary-ok");
  if (okBtn) {
    okBtn.addEventListener("click", () => {
      playMetalClick();
      const scanContainer = document.getElementById("scan-container");
      if (scanContainer) {
        // Limpar intervalo de verificação
        const intervalId = scanContainer.dataset.keepVisibleInterval;
        if (intervalId) {
          clearInterval(parseInt(intervalId));
          delete scanContainer.dataset.keepVisibleInterval;
        }
        // Remover flag e fechar
        scanContainer.dataset.scanActive = "false";
        scanContainer.classList.add("is-hidden");
        const scanCards = scanContainer.querySelector("#scan-cards");
        if (scanCards) scanCards.innerHTML = "";
      }
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

const startScanAnimation = async (startDate, endDate, precomputedReport = null) => {
  console.log("[Scan] === INÍCIO DA FUNÇÃO startScanAnimation ===");
  console.log("[Scan] Parâmetros recebidos:", { startDate, endDate, precomputedReport });
  
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
    scanAnimation.style.display = "none";
    scanAnimation.classList.remove("is-scanning");
    
    // Adicionar flag para prevenir fechamento automático
    scanContainer.dataset.scanActive = "true";
    
    // Mostrar container
    scanContainer.classList.remove("is-hidden");
    console.log("[Scan] Container exibido");
    
    // Scroll para o topo
    scanContainer.scrollTop = 0;

    // Pequeno delay para garantir que o DOM atualizou
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Gerar ou usar relatório pré-computado
    let report;
    try {
      if (precomputedReport) {
        report = precomputedReport;
        console.log("[Scan] Usando relatório pré-computado", report);
      } else {
        console.log("[Scan] === INICIANDO GERAÇÃO DE RELATÓRIO ===");
        console.log("[Scan] Datas:", { startDate, endDate });
        
        // Verificar perfil
        const profile = loadProfile();
        console.log("[Scan] Perfil carregado:", {
          hasProfile: !!profile,
          hasNickname: !!profile?.nickname,
          hasUserId: !!profile?.userId,
          profileKeys: profile ? Object.keys(profile) : []
        });
        
        // Carregar planner e arenas
        console.log("[Scan] Carregando planner...");
        const planner = loadPlanner();
        console.log("[Scan] Planner carregado:", {
          hasPlanner: !!planner,
          hasBronzeActions: !!planner?.bronzeActions,
          bronzeActionsCount: planner?.bronzeActions?.length || 0,
          plannerKeys: planner ? Object.keys(planner) : []
        });
        
        console.log("[Scan] Carregando arenas...");
        const arenas = loadArenas();
        console.log("[Scan] Arenas carregadas:", {
          hasArenas: !!arenas,
          arenasCount: Array.isArray(arenas) ? arenas.length : 0,
          arenas: Array.isArray(arenas) ? arenas.map(a => ({ id: a.id, title: a.title })) : []
        });
        
        console.log("[Scan] Construindo resumo do histórico...");
        const summary = buildHistorySummaryForRange(planner, arenas, startDate, endDate);
        console.log("[Scan] Resumo construído:", {
          score: summary.score,
          totalPlanned: summary.totalPlanned,
          totalDone: summary.totalDone,
          totalHours: summary.totalHours,
          statsCount: summary.stats?.length || 0,
          stats: summary.stats
        });
        
        report = {
          startDate,
          endDate,
          stats: summary.stats || [],
          totalPlanned: summary.totalPlanned || 0,
          totalDone: summary.totalDone || 0,
          totalHours: summary.totalHours || 0,
          score: summary.score || 0,
        };
        console.log("[Scan] Relatório final gerado:", report);
      }
      
      // Validar se o relatório tem dados básicos
      if (!report) {
        throw new Error("Relatório inválido: dados não gerados corretamente");
      }
      
      // Garantir que todas as propriedades existem
      if (typeof report.score === 'undefined') {
        report.score = 0;
      }
      if (!report.stats) {
        report.stats = [];
      }
      if (typeof report.totalPlanned === 'undefined') {
        report.totalPlanned = 0;
      }
      if (typeof report.totalDone === 'undefined') {
        report.totalDone = 0;
      }
      if (typeof report.totalHours === 'undefined') {
        report.totalHours = 0;
      }
      
      console.log("[Scan] Relatório validado:", {
        score: report.score,
        totalPlanned: report.totalPlanned,
        totalDone: report.totalDone,
        totalHours: report.totalHours,
        statsCount: report.stats.length
      });
    } catch (error) {
      console.error("[Scan] Erro ao gerar relatório:", error);
      console.error("[Scan] Stack trace:", error.stack);
      alert("Erro ao gerar relatório: " + error.message + "\n\nVerifique o console para mais detalhes.");
      scanContainer.classList.add("is-hidden");
      return;
    }

    // Animação removida - mostrar cards diretamente
    console.log("[Scan] Renderizando cards diretamente");
    
    // Garantir que animação está escondida
    scanAnimation.style.display = "none";
    scanAnimation.classList.remove("is-scanning");
    
    // Garantir que container está visível - SIMPLES: apenas remover is-hidden
    if (scanContainer) {
      scanContainer.classList.remove("is-hidden");
    }

    // Renderizar todos os cards como slides
    scanCards.innerHTML = "";
    const slideCards = [];
    
    // Função auxiliar para renderizar card com tratamento de erro
    const renderCardSafely = (cardIndex, cardName, renderFunction) => {
      try {
        console.log(`[Scan] Renderizando card ${cardIndex}: ${cardName}`);
        const card = document.createElement("div");
        card.className = `scan-card scan-card-${cardName} scan-slide`;
        card.dataset.slideIndex = String(cardIndex);
        renderFunction(report, card);
        slideCards.push(card);
        console.log(`[Scan] Card ${cardIndex} renderizado com sucesso`);
      } catch (error) {
        console.error(`[Scan] Erro ao renderizar card ${cardIndex} (${cardName}):`, error);
        // Criar card de erro ao invés de quebrar tudo
        const errorCard = document.createElement("div");
        errorCard.className = `scan-card scan-slide`;
        errorCard.dataset.slideIndex = String(cardIndex);
        errorCard.innerHTML = `
          <div class="scan-card-content">
            <h3>Erro ao carregar ${cardName}</h3>
            <p>${error.message}</p>
          </div>
        `;
        slideCards.push(errorCard);
      }
    };
    
    // Renderizar cada card com tratamento de erro individual
    renderCardSafely(0, "rating", renderScanCardRating);
    renderCardSafely(1, "metrics", renderScanCardMetrics);
    renderCardSafely(2, "highlight", renderScanCardHighlight);
    renderCardSafely(3, "radar", renderScanCardRadar);
    renderCardSafely(4, "summary", renderScanCardSummary);
    
    // Adicionar todos os cards ao container (inicialmente ocultos, exceto o primeiro)
    slideCards.forEach((card, index) => {
      if (index !== 0) {
        card.classList.add("is-hidden");
      }
      scanCards.appendChild(card);
    });
    
    // Inicializar navegação de slides
    let currentSlideIndex = 0;
    const totalSlides = slideCards.length;
    
    const updateSlideDisplay = () => {
      slideCards.forEach((card, index) => {
        if (index === currentSlideIndex) {
          // Card ativo: visível
          card.classList.remove("is-hidden");
          card.style.display = "block";
          card.style.opacity = "1";
          card.style.visibility = "visible";
        } else {
          // Cards inativos: ocultos
          card.classList.add("is-hidden");
          card.style.display = "none";
          card.style.opacity = "0";
          card.style.visibility = "hidden";
        }
      });
      
      // Atualizar indicador
      const indicator = document.getElementById("scan-slide-indicator");
      if (indicator) {
        indicator.innerHTML = slideCards.map((_, i) => 
          `<span class="scan-indicator-dot ${i === currentSlideIndex ? 'is-active' : ''}"></span>`
        ).join("");
      }
      
      // Atualizar botões de navegação
      const prevBtn = document.getElementById("scan-nav-prev");
      const nextBtn = document.getElementById("scan-nav-next");
      if (prevBtn) prevBtn.classList.toggle("is-disabled", currentSlideIndex === 0);
      if (nextBtn) nextBtn.classList.toggle("is-disabled", currentSlideIndex === totalSlides - 1);
      
      if (window.lucide) window.lucide.createIcons();
    };
    
    // Event listeners para navegação
    const prevBtn = document.getElementById("scan-nav-prev");
    const nextBtn = document.getElementById("scan-nav-next");
    
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentSlideIndex > 0) {
          playMetalClick();
          currentSlideIndex--;
          updateSlideDisplay();
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (currentSlideIndex < totalSlides - 1) {
          playMetalClick();
          currentSlideIndex++;
          updateSlideDisplay();
        }
      });
    }
    
    // Mostrar primeiro slide
    updateSlideDisplay();
    
    // Garantir que container está visível após renderizar cards
    if (scanContainer) {
      // Limpar intervalo anterior se existir
      const existingInterval = scanContainer.dataset.keepVisibleInterval;
      if (existingInterval) {
        clearInterval(parseInt(existingInterval));
      }
      
      scanContainer.dataset.scanActive = "true";
      scanContainer.classList.remove("is-hidden");
      
      // Adicionar verificação periódica para garantir que permanece visível
      const keepVisibleInterval = setInterval(() => {
        if (scanContainer.dataset.scanActive === "true" && 
            scanContainer.classList.contains("is-hidden")) {
          console.warn("[Scan] Container foi escondido, reexibindo...");
          scanContainer.classList.remove("is-hidden");
        }
      }, 100);
      
      // Armazenar intervalo no container para limpar depois
      scanContainer.dataset.keepVisibleInterval = String(keepVisibleInterval);
    }
    
    // Salvar relatório para histórico (apenas se não foi pré-computado)
    if (!precomputedReport) {
      console.log("[Scan] Salvando relatório no histórico...");
      saveReportToHistory(report);
      // Atualizar lista de histórico se estiver na tela
      const historyList = document.getElementById("history-list");
      if (historyList && document.querySelector(".screen-history.is-active")) {
        renderHistoryList();
      }
    }
    
    console.log("[Scan] Todos os cards renderizados como slides");
  } catch (error) {
    console.error("[Scan] Erro geral na animação:", error);
    console.error("[Scan] Stack trace completo:", error.stack);
    alert("Erro ao gerar relatório: " + error.message + "\n\nVerifique o console para mais detalhes.");
    const scanContainer = document.getElementById("scan-container");
    if (scanContainer) {
      scanContainer.classList.add("is-hidden");
    }
  }
};

const openPlannerReports = () => {
  setActiveScreen("history");
  renderHistoryList();
};

// Sistema Social - Busca e Cards
const buildSocialCard = (profile, options = {}) => {
  const card = document.createElement("div");
  card.className = "social-card";
  if (options.isNpc) card.classList.add("social-card--npc");
  
  const avatar = document.createElement("div");
  avatar.className = "social-card-avatar";
  if (profile.avatar_url) {
    avatar.style.backgroundImage = `url(${profile.avatar_url})`;
    avatar.style.backgroundSize = "cover";
    avatar.style.backgroundPosition = "center";
  }
  
  const border = document.createElement("div");
  border.className = "social-card-border";
  
  const content = document.createElement("div");
  content.className = "social-card-content";
  
  const nick = document.createElement("div");
  nick.className = "social-card-nick";
  nick.textContent = profile.nickname || profile.full_name || "-";
  
  const level = document.createElement("div");
  level.className = "social-card-level";
  level.textContent = `Nível ${profile.level_geral || profile.total_level || 0}`;
  
  const banner = document.createElement("div");
  banner.className = "social-card-banner";
  if (profile.cover_url) {
    banner.style.backgroundImage = `url(${profile.cover_url})`;
    banner.style.backgroundSize = "cover";
    banner.style.backgroundPosition = "center";
  }
  
  const clan = document.createElement("div");
  clan.className = "social-card-clan";
  const playerData = profile.player_data || {};
  clan.textContent = playerData.clan || playerData.guild || "-";
  
  const status = document.createElement("div");
  status.className = "social-card-status";
  status.textContent = "Online"; // TODO: Implementar status real
  
  card.appendChild(avatar);
  card.appendChild(border);
  card.appendChild(content);
  content.appendChild(nick);
  content.appendChild(level);
  card.appendChild(banner);
  card.appendChild(clan);
  card.appendChild(status);
  
  card.addEventListener("click", () => {
    openSocialProfile(profile, options);
  });
  
  return card;
};

const openSocialProfile = (profile, options = {}) => {
  const modal = document.getElementById("external-profile-modal");
  const avatar = document.getElementById("external-profile-avatar");
  const level = document.getElementById("external-profile-level");
  const nick = document.getElementById("external-profile-nick");
  const banner = document.getElementById("external-profile-banner");
  const widgets = document.getElementById("external-profile-widgets");
  const editBtn = document.getElementById("external-profile-edit");
  
  if (!modal || !avatar || !level || !nick) return;
  
  // Verificar se é o próprio perfil
  const currentProfile = loadProfile();
  const isOwnProfile = !options.isNpc && (profile.id === currentProfile.userId || profile.nickname === currentProfile.nickname);
  
  // Avatar
  if (profile.avatar_url) {
    avatar.style.backgroundImage = `url(${profile.avatar_url})`;
    avatar.style.backgroundSize = "cover";
    avatar.style.backgroundPosition = "center";
  } else {
    avatar.style.backgroundImage = "";
    avatar.innerHTML = '<div class="loading-diamond"><div class="loading-core"></div></div>';
  }
  
  // Nível
  const levelValue = profile.level_geral || profile.total_level || 0;
  level.textContent = levelValue;
  
  // Nick
  nick.textContent = profile.nickname || profile.full_name || "-";
  
  // Banner
  if (profile.cover_url) {
    banner.style.backgroundImage = `url(${profile.cover_url})`;
    banner.style.backgroundSize = "cover";
    banner.style.backgroundPosition = "center";
  } else {
    banner.style.backgroundImage = "";
    banner.textContent = "";
  }
  
  // Widgets
  widgets.innerHTML = "";
  const playerData = profile.player_data || {};
  const widgetsData = playerData.widgets || [];
  const widgetsVisible = playerData.widgetsVisible || [];
  
  if (widgetsData.length === 0) {
    widgets.innerHTML = "<div class='external-profile-empty'>Nenhum widget configurado</div>";
  } else {
    // TODO: Renderizar widgets do perfil
    widgets.innerHTML = "<div class='external-profile-empty'>Widgets em desenvolvimento</div>";
  }
  
  // Botão editar (apenas para próprio perfil)
  if (editBtn) {
    if (isOwnProfile) {
      editBtn.style.display = "block";
      editBtn.addEventListener("click", () => {
        modal.classList.remove("is-open");
        const profileModal = document.getElementById("profile-modal");
        if (profileModal) profileModal.classList.add("is-open");
      });
    } else {
      editBtn.style.display = "none";
    }
  }
  
  modal.classList.add("is-open");
  if (window.lucide) window.lucide.createIcons();
};

const initSocialSearch = () => {
  const input = document.getElementById("social-search-input");
  const button = document.getElementById("social-search-btn");
  const results = document.getElementById("social-results");
  if (!input || !button || !results) return;
  
  const doSearch = async () => {
    const term = input.value.trim();
    results.innerHTML = "";
    if (!term) return;
    
    if (!isSupabaseEnabled()) {
      results.innerHTML = "<div class='social-empty'>Supabase não habilitado</div>";
      return;
    }
    
    try {
      // Buscar em profiles e npc_profiles
      // Buscar por nickname ou ID específico (ex: NJR_10)
      const searchQueries = [
        supabase
          .from("profiles")
          .select("id,nickname,full_name,status_title,avatar_url,cover_url,player_data,level_geral,total_level")
          .or(`nickname.ilike.%${term}%,id.eq.${term},user_id.ilike.%${term}%`)
          .limit(10),
      ];
      
      // Para NPCs, buscar tanto por ilike quanto por igualdade exata
      const npcQueries = [
        supabase
          .from("npc_profiles")
          .select("npc_id,nickname,full_name,status_title,avatar_url,cover_url,player_data,level_geral")
          .ilike("nickname", `%${term}%`)
          .limit(10),
      ];
      
      // Se o termo parece ser um ID exato (ex: NJR_10), buscar também por igualdade
      if (term.toUpperCase() === term && term.includes("_")) {
        npcQueries.push(
          supabase
            .from("npc_profiles")
            .select("npc_id,nickname,full_name,status_title,avatar_url,cover_url,player_data,level_geral")
            .eq("nickname", term)
            .limit(10)
        );
      }
      
      const [profilesRes, ...npcResArray] = await Promise.all([...searchQueries, ...npcQueries]);
      
      const profilesData = Array.isArray(profilesRes.data) ? profilesRes.data : [];
      
      // Combinar todos os resultados de NPCs e remover duplicatas
      const allNpcData = [];
      npcResArray.forEach((npcRes) => {
        if (Array.isArray(npcRes.data)) {
          npcRes.data.forEach((row) => {
            if (!allNpcData.find((item) => item.npc_id === row.npc_id)) {
              allNpcData.push({ ...row, is_npc: true });
            }
          });
        }
      });
      
      const allResults = [...profilesData, ...allNpcData];
      
      if (allResults.length === 0) {
        results.innerHTML = "<div class='social-empty'>Nenhum perfil encontrado</div>";
        return;
      }
      
      allResults.forEach((profile) => {
        const card = buildSocialCard(profile, { isNpc: profile.is_npc });
        results.appendChild(card);
      });
    } catch (error) {
      console.error("Erro na busca:", error);
      results.innerHTML = "<div class='social-empty'>Erro ao buscar perfis</div>";
    }
  };
  
  button.addEventListener("click", doSearch);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") doSearch();
  });
};

const renderSocialFriends = async () => {
  const container = document.getElementById("social-friends-list");
  if (!container) return;
  container.innerHTML = "";
  
  // TODO: Buscar amigos do perfil atual
  const profile = loadProfile();
  const friends = profile.friends || [];
  
  if (friends.length === 0) {
    container.innerHTML = "<div class='social-empty'>Nenhum amigo ainda</div>";
    return;
  }
  
  // TODO: Buscar dados dos amigos no Supabase
};

const renderSocialClan = async () => {
  const container = document.getElementById("social-clan-list");
  if (!container) return;
  container.innerHTML = "";
  
  // TODO: Buscar membros do clã
  const profile = loadProfile();
  const clan = profile.player_data?.clan;
  
  if (!clan) {
    container.innerHTML = "<div class='social-empty'>Você não está em um clã</div>";
    return;
  }
  
  // TODO: Buscar membros do clã no Supabase
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startAppWithSplash);
} else {
  startAppWithSplash();
}
