import { supabase } from "./src/lib/supabaseClient.js";

const STORAGE_KEY = "game_of_life.module1_dna";
const PLANNER_KEY = "game_of_life.planner";
const ARENAS_KEY = "game_of_life.arenas";
const LOGIN_KEY = "game_of_life.last_login";
const HIATO_KEY = "game_of_life.hiato_active";
const GLITCH_KEY = "game_of_life.glitch_until";
const MODE_KEY = "game_of_life.mastery_mode";
const V2_RESET_KEY = "game_of_life.v2_reset";
const PROFILE_KEY = "game_of_life.profile";

const SEPHIROT = [
  { id: "conexao", label: "Conexao", row: 1, col: 2 },
  { id: "mente", label: "Espaco Mental", row: 2, col: 1 },
  { id: "espiritualidade", label: "Espiritualidade", row: 2, col: 3 },
  { id: "verdade", label: "Verdade", row: 3, col: 1 },
  { id: "inspiracao", label: "Inspiracao", row: 3, col: 3 },
  { id: "amor", label: "Amor", row: 4, col: 2 },
  { id: "trabalho", label: "Trabalho", row: 5, col: 1 },
  { id: "abundancia", label: "Abundancia", row: 5, col: 3 },
  { id: "autenticidade", label: "Autenticidade", row: 6, col: 2 },
  { id: "fisico", label: "Forca Fisica", row: 7, col: 2 },
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
    "Ódio constante",
    "Reclamação automática",
    "Vitimismo",
    "Indiferença",
    "Agradecimento Social: Digo 'obrigado' por educação, mas não sinto a emoção real.",
    "Otimismo básico",
    "Antifrágil",
    "Flow intermitente",
    "Bênção constante",
    "Unidade Absoluta",
  ],
  espiritualidade: [
    "Desconexão total",
    "Ceticismo agressivo",
    "Curiosidade superficial",
    "Ritualista vazio",
    "Buscador",
    "Intuitivo",
    "Praticante constante",
    "Místico",
    "Iluminado",
    "Avatar",
  ],
  mente: [
    "Colapso",
    "Reatividade",
    "Ruído constante",
    "Observador iniciante",
    "Foco básico",
    "Concentração",
    "Shadow Worker",
    "Arquiteto Mental",
    "Serenidade",
    "No-Mind",
  ],
  verdade: [
    "Mentiroso compulsivo",
    "Máscara social",
    "Confusão de identidade",
    "Sincero parcial",
    "Autoconsciente",
    "Integridade",
    "Transparência",
    "Autenticidade Radical",
    "Profeta",
    "A Verdade",
  ],
  inspiracao: [
    "Inércia",
    "Sonhador passivo",
    "Iniciador",
    "Executor básico",
    "Criativo",
    "Realizador",
    "Mentor",
    "Visionário",
    "Mestre",
    "Demiurgo",
  ],
  amor: [
    "Ódio social",
    "Egoísmo",
    "Dependência",
    "Cordialidade",
    "Empático",
    "Companheiro",
    "Doador",
    "Magnetismo",
    "Amor Incondicional",
    "Amor Ágape",
  ],
  abundancia: [
    "Miséria",
    "Sobrevivência",
    "Insegurança",
    "Estabilidade",
    "Poupador Iniciante",
    "Investidor",
    "Confortável",
    "Riqueza",
    "Filantropo",
    "Soberano",
  ],
  trabalho: [
    "Inutilidade",
    "Procrastinador",
    "Operacional",
    "Esforçado",
    "Profissional",
    "Especialista",
    "Gestor",
    "Autoridade",
    "Ícone",
    "A Lenda",
  ],
  autenticidade: [
    "Anedonia",
    "Copiador",
    "Amador",
    "Entusiasta",
    "Expressivo",
    "Talentoso",
    "Virtuoso",
    "Original",
    "Inspirador",
    "Criança Divina",
  ],
  fisico: [
    "Colapso",
    "Frágil",
    "Iniciante",
    "Ativo",
    "Saudável",
    "Acrobata",
    "Atleta Amador",
    "Guerreiro",
    "Espécime",
    "Imortal",
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
    { id: "conexao.crenca1", label: "Crenca 1", type: "rect" },
    { id: "conexao.crenca2", label: "Crenca 2", type: "rect" },
    { id: "conexao.crenca3", label: "Crenca 3", type: "rect" },
    { id: "conexao.lema", label: "Lema de Vida", type: "rect-wide" },
  ],
  espiritualidade: [
    { id: "espiritualidade.sistema", label: "Sistema", type: "rect" },
    { id: "espiritualidade.entidade1", label: "Entidade Lider", type: "square" },
    { id: "espiritualidade.entidade2", label: "Entidade Protetora", type: "square" },
  ],
  mente: [
    { id: "mente.filosofia", label: "Filosofia", type: "rect" },
    { id: "mente.flow", label: "Freq. Flow", type: "square" },
    { id: "mente.meditacao", label: "Meditacao", type: "square" },
  ],
  verdade: [
    { id: "verdade.mtp", label: "MTP", type: "rect" },
    { id: "verdade.mbti", label: "MBTI", type: "square" },
    { id: "verdade.signo", label: "Signo", type: "square" },
    { id: "verdade.trait1", label: "Trait 1", type: "rect-small" },
    { id: "verdade.trait2", label: "Trait 2", type: "rect-small" },
    { id: "verdade.trait3", label: "Trait 3", type: "rect-small" },
    { id: "verdade.foto1", label: "Foto 1", type: "square" },
    { id: "verdade.foto2", label: "Foto 2", type: "square" },
    { id: "verdade.foto3", label: "Foto 3", type: "square" },
  ],
  inspiracao: [
    {
      id: "inspiracao.proj1",
      label: "Projeto 1",
      type: "square",
      fields: [
        { key: "nome", label: "Nome" },
        { key: "progresso", label: "%" },
      ],
    },
    {
      id: "inspiracao.proj2",
      label: "Projeto 2",
      type: "square",
      fields: [
        { key: "nome", label: "Nome" },
        { key: "progresso", label: "%" },
      ],
    },
    {
      id: "inspiracao.proj3",
      label: "Projeto 3",
      type: "square",
      fields: [
        { key: "nome", label: "Nome" },
        { key: "progresso", label: "%" },
      ],
    },
  ],
  amor: [
    {
      id: "amor.intimo",
      label: "Circulo Intimo",
      type: "square",
      fields: [
        { key: "nome", label: "Nome" },
        { key: "foto", label: "Foto" },
      ],
    },
    {
      id: "amor.guerra",
      label: "Irmaos de Guerra",
      type: "square",
      fields: [
        { key: "nome", label: "Nome" },
        { key: "foto", label: "Foto" },
      ],
    },
  ],
  abundancia: [
    { id: "abundancia.renda", label: "Renda", type: "rect" },
    { id: "abundancia.gasto", label: "Gasto", type: "rect" },
    { id: "abundancia.liquidez", label: "Liquidez", type: "rect" },
    { id: "abundancia.ativo1", label: "Ativo 1", type: "square" },
    { id: "abundancia.ativo2", label: "Ativo 2", type: "square" },
    { id: "abundancia.ativo3", label: "Ativo 3", type: "square" },
  ],
  trabalho: [
    { id: "trabalho.pec", label: "PEC", type: "rect" },
    { id: "trabalho.unip", label: "UNIP", type: "rect" },
    { id: "trabalho.personal", label: "Personal", type: "rect" },
  ],
  autenticidade: [
    {
      id: "autenticidade.hobby1",
      label: "Hobby 1",
      type: "square",
      fields: [
        { key: "hobby", label: "Hobby" },
        { key: "rank", label: "Rank" },
      ],
    },
    {
      id: "autenticidade.hobby2",
      label: "Hobby 2",
      type: "square",
      fields: [
        { key: "hobby", label: "Hobby" },
        { key: "rank", label: "Rank" },
      ],
    },
    {
      id: "autenticidade.hobby3",
      label: "Hobby 3",
      type: "square",
      fields: [
        { key: "hobby", label: "Hobby" },
        { key: "rank", label: "Rank" },
      ],
    },
  ],
  fisico: [
    { id: "fisico.peso", label: "Peso", type: "rect" },
    { id: "fisico.altura", label: "Altura", type: "rect" },
    { id: "fisico.gordura", label: "%G", type: "rect" },
    { id: "fisico.flexao", label: "Flexao", type: "square" },
    { id: "fisico.barra", label: "Barra", type: "square" },
    { id: "fisico.corrida", label: "Corrida", type: "square" },
  ],
};

const getSlotOptions = () => {
  const options = [];
  Object.entries(PROTOCOL_SLOTS).forEach(([assetId, slots]) => {
    slots.forEach((slot) => {
      options.push({
        id: `${assetId}.${slot.id}`,
        label: `${LABEL_BY_ID.get(assetId) ?? assetId} - ${slot.label}`,
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
  localStorage.clear();
  localStorage.setItem(V2_RESET_KEY, "true");
};

const loadProfile = () => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveProfile = (profile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme || "gold";
  const profile = loadProfile();
  saveProfile({ ...profile, theme: theme || "gold" });
};

const uploadToSupabase = async (file, path) => {
  if (!supabase || !file) return null;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
  });
  if (error) return null;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data?.publicUrl || null;
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
  if (!supabase) return;
  const userId = profile.userId?.replace("@", "").trim();
  const nickname = profile.nickname?.trim();
  if (!userId || !nickname) return;
  const email = `${userId}@gameoflife.local`;
  const passwordKey = "game_of_life.supabase_pass";
  let password = localStorage.getItem(passwordKey);
  if (!password) {
    password = crypto.randomUUID();
    localStorage.setItem(passwordKey, password);
  }
  let auth = await supabase.auth.signInWithPassword({ email, password });
  if (auth.error) {
    auth = await supabase.auth.signUp({ email, password });
  }
  const user = auth.data?.user;
  if (!user) return;
  await supabase.from("profiles").upsert({
    id: user.id,
    nickname,
    user_id: profile.userId,
    banner: profile.banner || "",
    avatar_url: profile.avatar || "",
  });
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

const loadDNA = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.assets)) return null;
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
  const assets = getAssets();
  const hudLevel = document.getElementById("hud-level");
  if (hudLevel) {
    const total = assets.reduce((sum, asset) => sum + Number(asset.level || 0), 0);
    hudLevel.textContent = `Nivel ${Math.round(total)}`;
  }

  assets.forEach((asset) => {
    const sphere = document.createElement("button");
    sphere.className = "sephirot";
    sphere.type = "button";
    sphere.style.gridRow = String(asset.row);
    sphere.style.gridColumn = String(asset.col);
    sphere.dataset.assetId = asset.id;
    if (asset.level === 0) sphere.classList.add("is-empty");
    if (isStandby) sphere.classList.add("is-empty");

    const label = document.createElement("div");
    label.className = "sephirot-label";
    label.textContent = asset.label;

    const level = document.createElement("div");
    level.className = "sephirot-level";
    const roundedLevel = Math.round(asset.level);
    level.textContent = String(roundedLevel);
    const intensity = Math.min(1, Math.max(0.2, roundedLevel / 10));
    sphere.style.background = `rgba(255, 255, 255, ${0.05 + intensity * 0.2})`;
    sphere.style.borderColor = `rgba(255, 255, 255, ${0.12 + intensity * 0.3})`;

    sphere.appendChild(label);
    sphere.appendChild(level);
    sphere.addEventListener("click", () => openTreeEditor(asset.id));
    treeGrid.appendChild(sphere);
  });
};

const loadPlanner = () => {
  try {
    const raw = localStorage.getItem(PLANNER_KEY);
    if (!raw) return { pills: [], logistics: {}, bronzeActions: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.pills)) {
      return { pills: [], logistics: {}, bronzeActions: [] };
    }
    return {
      pills: parsed.pills,
      logistics: parsed.logistics ?? {},
      bronzeActions: Array.isArray(parsed.bronzeActions) ? parsed.bronzeActions : [],
    };
  } catch {
    return { pills: [], logistics: {}, bronzeActions: [] };
  }
};

const savePlanner = (planner) => {
  localStorage.setItem(PLANNER_KEY, JSON.stringify(planner));
};

const buildBronzeElement = (action) => {
  const bronze = document.createElement("div");
  bronze.className = "bronze-item";
  bronze.dataset.id = action.id;
  bronze.draggable = action.status === "backlog";
  if (action.serious) bronze.classList.add("serious");
  if (action.locked) bronze.classList.add("locked");
  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", action.icon || "circle");
  bronze.appendChild(icon);
  bronze.addEventListener("dragstart", (event) => {
    if (!bronze.draggable) return;
    event.dataTransfer?.setData("text/plain", `bronze:${action.id}`);
  });
  return bronze;
};

const renderWeekView = () => {
  const weekGrid = document.getElementById("week-grid");
  if (!weekGrid) return;
  const planner = loadPlanner();
  weekGrid.innerHTML = "";
  WEEKDAYS.forEach((day) => {
    const column = document.createElement("div");
    column.className = "week-column";
    const label = document.createElement("div");
    label.className = "week-day";
    label.textContent = day.label;
    column.appendChild(label);
    planner.bronzeActions
      .filter((action) => (action.weekdays || []).includes(day.key))
      .forEach((action) => {
        const item = document.createElement("div");
        item.className = "week-item";
        const icon = document.createElement("i");
        icon.setAttribute("data-lucide", action.icon || "circle");
        const title = document.createElement("span");
        const duration = action.durationMinutes ? `${action.durationMinutes}m` : "";
        title.textContent = `${action.title || "Acao"} ${duration}`.trim();
        item.appendChild(icon);
        item.appendChild(title);
        column.appendChild(item);
      });
    weekGrid.appendChild(column);
  });
  if (window.lucide) window.lucide.createIcons();
};

const buildBronzeBlock = (action) => {
  const block = document.createElement("div");
  block.className = "bronze-block";
  block.dataset.id = action.id;
  if (action.status === "done") block.classList.add("done");
  if (!action.locked && action.status === "scheduled") {
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
    if (action.status === "done") return;
    block.classList.add("is-pressing");
    const timer = setTimeout(() => {
      const planner = loadPlanner();
      const updated = planner.bronzeActions.map((item) => {
        if (item.id !== action.id) return item;
        return { ...item, status: "done" };
      });
      savePlanner({ ...planner, bronzeActions: updated });
      updateArenaCountsForBronze(action.arenaId, 1);
      renderPlanner();
      renderArenas();
    }, 3000);
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
  const arenaPills = pills.filter((pill) => pill.arenaId === arenaId);
  const total = arenaPills.length;
  const done = arenaPills.filter((pill) => pill.status === "done").length;
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
    return { ...arena, completedCount: next, completion };
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
      return { ...arena, completedCount: next, completion };
    });
    dna.arenas = merged;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dna));
  } catch {
    return;
  }
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
    const card = document.createElement("div");
    card.className = "arena-card";
    const title = document.createElement("div");
    title.className = "arena-title";
    title.textContent = arena.title || "Arena";
    const progress = document.createElement("div");
    progress.className = "arena-progress";
    if (arena.targetCount) {
      progress.textContent = `${Number(arena.completedCount || 0)}/${arena.targetCount}`;
    } else {
      progress.textContent = `${Math.round(Number(arena.completion || 0))}%`;
    }
    const assetLabel = document.createElement("div");
    assetLabel.className = "arena-progress";
    assetLabel.textContent = LABEL_BY_ID.get(arena.assetId) ?? "Ativo";
    const addBronze = document.createElement("button");
    addBronze.className = "silver-button";
    addBronze.type = "button";
    addBronze.textContent = "Adicionar Bronze";
    addBronze.addEventListener("click", (event) => {
      event.stopPropagation();
      openBronzeModal(arena.id);
    });
    card.addEventListener("click", (event) => {
      if (event.target === addBronze) return;
      openArenaDossier(arena.id);
    });
    card.appendChild(title);
    card.appendChild(progress);
    card.appendChild(assetLabel);
    card.appendChild(addBronze);
    arenaList.appendChild(card);
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

  timeline.innerHTML = "";
  const bronzeLayer = document.createElement("div");
  bronzeLayer.style.position = "absolute";
  bronzeLayer.style.inset = "0";
  bronzeLayer.style.pointerEvents = "none";
  for (let hour = 6; hour <= 22; hour += 1) {
    const slot = document.createElement("div");
    slot.className = "time-slot";
    slot.dataset.hour = String(hour);

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
          const locked = action.serious ? true : action.locked;
          if (action.locked && action.status === "scheduled") return action;
          return {
            ...action,
            status: "scheduled",
            scheduledHour: hour,
            scheduledMinute: 0,
            locked,
          };
        });
        savePlanner({ ...planner, bronzeActions: updated });
        renderPlanner();
        return;
      }
      return;
    });

    timeline.appendChild(slot);
  }

  const timelineTopPadding = 16;
  planner.bronzeActions
    .filter((action) => action.status === "scheduled" || action.status === "done")
    .forEach((action) => {
      const startHour = Number(action.scheduledHour || 6);
      const startMinute = Number(action.scheduledMinute || 0);
      const duration = Number(action.durationMinutes || 30);
      const block = buildBronzeBlock(action);
      const top = timelineTopPadding + (startHour - 6) * 60 + startMinute;
      block.style.top = `${top}px`;
      block.style.height = `${Math.max(30, duration)}px`;
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
    }, 3000);
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

const getDNA = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveDNA = (dna) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dna));
};

const seedDNAIfMissing = () => {
  const existing = getDNA();
  if (existing && Array.isArray(existing.assets)) return existing;
  const seeded = {
    assets: SEPHIROT.map((asset) => ({
      id: asset.id,
      label: asset.label,
      level: 0,
      slots: [],
    })),
    hobbies: [],
    lastUpdatedAt: new Date(0).toISOString(),
  };
  saveDNA(seeded);
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
  const slots = PROTOCOL_SLOTS[assetId] || [];
  asset.profileSlots = asset.profileSlots || {};
  slots.forEach((slot, index) => {
    const slotEl = document.createElement("div");
    slotEl.className = `profile-slot profile-slot--${slot.type} slot-animate`;
    slotEl.style.animationDelay = `${index * 40}ms`;
    slotEl.dataset.slotId = slot.id;
    const label = document.createElement("div");
    label.className = `slot-label${slot.type.startsWith("square") ? " bottom" : ""}`;
    label.textContent = slot.label;
    slotEl.appendChild(label);

    const iconName = SLOT_ICON_BY_ID[slot.id];
    if (iconName) {
      const icon = document.createElement("i");
      icon.className = "slot-icon";
      icon.setAttribute("data-lucide", iconName);
      slotEl.appendChild(icon);
    }

    const isPhotoSlot =
      slot.type === "square" &&
      (slot.label.toLowerCase().includes("foto") ||
        (slot.fields || []).some((field) => field.key === "foto"));
    if (isPhotoSlot) {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.className = "hidden-file";
      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          asset.profileSlots[slot.id] = {
            ...(asset.profileSlots[slot.id] || {}),
            image: reader.result,
          };
          slotEl.style.backgroundImage = `url(${reader.result})`;
          slotEl.style.backgroundSize = "cover";
          slotEl.style.backgroundPosition = "center";
          dna.lastUpdatedAt = new Date().toISOString();
          saveDNA(dna);
        };
        reader.readAsDataURL(file);
      });
      slotEl.appendChild(fileInput);
      const existingImage = asset.profileSlots[slot.id]?.image;
      if (existingImage) {
        slotEl.style.backgroundImage = `url(${existingImage})`;
        slotEl.style.backgroundSize = "cover";
        slotEl.style.backgroundPosition = "center";
      }
      slotEl.addEventListener("click", () => {
        fileInput.click();
      });
    }

    const fields = slot.fields || [{ key: "value", label: slot.label }];
    fields.forEach((field) => {
      const input = document.createElement("input");
      input.className = "profile-input";
      input.placeholder = field.label;
      input.value = asset.profileSlots[slot.id]?.[field.key] || "";
      input.addEventListener("change", () => {
        asset.profileSlots[slot.id] = {
          ...(asset.profileSlots[slot.id] || {}),
          [field.key]: input.value,
        };
        dna.lastUpdatedAt = new Date().toISOString();
        saveDNA(dna);
        renderSocial();
      });
      slotEl.appendChild(input);
    });


    slotEl.addEventListener("click", () => {
      if (isPhotoSlot) {
        const file = slotEl.querySelector("input[type='file']");
        if (file) file.click();
        return;
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
  if (!modal || !title || !levelText) return;
  title.textContent = `Editar ${LABEL_BY_ID.get(asset.id) ?? asset.label}`;
  const levelValue = Math.round(Number(asset.level || 0));
  levelText.textContent = `Nivel ${levelValue}`;
  if (phraseText) {
    const phraseKey = ASSET_TO_PHRASE[asset.id];
    const phrases = phraseKey ? MASTERY_PHRASES[phraseKey] : [];
    phraseText.textContent = phrases[Math.max(0, Math.min(9, levelValue - 1))] || "";
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
        const row = document.createElement("div");
        row.className = "linked-arena";
        const name = document.createElement("span");
        name.textContent = arena.title || "Arena";
        const pct = document.createElement("span");
        if (arena.targetCount) {
          pct.textContent = `${Number(arena.completedCount || 0)}/${arena.targetCount}`;
        } else {
          pct.textContent = `${Math.round(Number(arena.completion || 0))}%`;
        }
        const actionButton = document.createElement("button");
        actionButton.type = "button";
        actionButton.textContent = "Gerar Acao";
        actionButton.addEventListener("click", (event) => {
          event.stopPropagation();
          createPlannerActionFromArena(arena);
        });
        row.addEventListener("click", () => {
          openArenaDossier(arena.id);
        });
        row.appendChild(name);
        row.appendChild(pct);
        row.appendChild(actionButton);
        linkedArenasList.appendChild(row);
      });
    }
  }
  modal.classList.add("is-open");
};

const closeTreeEditor = () => {
  const modal = document.getElementById("tree-edit-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.dataset.assetId = "";
};

const openArenaModal = () => {
  const modal = document.getElementById("arena-modal");
  const select = document.getElementById("arena-asset");
  const title = document.getElementById("arena-title");
  const description = document.getElementById("arena-description");
  const target = document.getElementById("arena-target");
  if (!modal || !select || !title || !target || !description) return;
  select.innerHTML = "";
  SEPHIROT.forEach((asset) => {
    const option = document.createElement("option");
    option.value = asset.id;
    option.textContent = asset.label;
    select.appendChild(option);
  });
  title.value = "";
  description.value = "";
  target.value = "";
  modal.classList.add("is-open");
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
  if (!modal || !title || !progress || !macro || !bronzeList) return;
  const arenas = loadArenas();
  const arena = arenas.find((item) => item.id === arenaId);
  if (!arena) return;
  title.textContent = arena.title || "Arena";
  if (arena.targetCount) {
    progress.textContent = `${Number(arena.completedCount || 0)}/${arena.targetCount}`;
  } else {
    progress.textContent = `${Math.round(Number(arena.completion || 0))}%`;
  }
  macro.textContent = arena.description || "Sem descricao.";
  if (targetLabel) {
    targetLabel.textContent = arena.targetCount
      ? `Meta Atual: ${Number(arena.completedCount || 0)}/${arena.targetCount}`
      : "Meta Atual: livre";
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
      item.className = "bronze-item";
      if (action.serious) item.classList.add("serious");
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", action.icon || "circle");
      item.appendChild(icon);
      bronzeList.appendChild(item);
    });
  }
  if (window.lucide) window.lucide.createIcons();
  modal.dataset.arenaId = arenaId;
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
};

const openBronzeModal = (arenaId) => {
  const modal = document.getElementById("bronze-modal");
  const iconGrid = document.getElementById("bronze-icon-grid");
  const durationInput = document.getElementById("bronze-duration");
  const durationValue = document.getElementById("bronze-duration-value");
  const seriousToggle = document.getElementById("bronze-serious");
  const titleInput = document.getElementById("bronze-title");
  if (!modal || !iconGrid || !durationInput || !seriousToggle || !titleInput) return;
  modal.dataset.arenaId = arenaId;
  modal.dataset.icon = BRONZE_ICONS[0];
  titleInput.value = "";
  durationInput.value = "60";
  if (durationValue) durationValue.textContent = "60 min";
  seriousToggle.checked = false;
  const card = modal.querySelector(".bronze-card-elite");
  if (card) card.classList.remove("serious-on");
  modal.querySelectorAll(".weekday-grid input[type='checkbox']").forEach((input) => {
    input.checked = false;
  });
  iconGrid.innerHTML = "";
  BRONZE_ICONS.forEach((iconName) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "icon-option";
    if (iconName === BRONZE_ICONS[0]) option.classList.add("is-selected");
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

const initConfig = () => {
  const dna = seedDNAIfMissing();
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

      const phrase = document.createElement("div");
      phrase.className = "mastery-phrase";
      const idx = Math.max(0, Math.min(9, Number(slider.value) - 1));
      phrase.textContent = phrases[idx] || "";

      const textarea = document.createElement("textarea");
      textarea.className = "mastery-textarea";
      textarea.placeholder = "Escreva seu texto soberano...";
      textarea.value = asset.customText || "";

      const updateView = () => {
        value.textContent = String(Math.round(Number(slider.value)));
        if (mode === "oracle") {
          const index = Math.max(0, Math.min(9, Number(slider.value) - 1));
          phrase.textContent = phrases[index] || "";
          if (!row.contains(phrase)) row.appendChild(phrase);
          if (row.contains(textarea)) row.removeChild(textarea);
        } else {
          if (!row.contains(textarea)) row.appendChild(textarea);
          if (row.contains(phrase)) row.removeChild(phrase);
        }
      };

      slider.addEventListener("input", () => {
        asset.level = Number(slider.value);
        dna.lastUpdatedAt = new Date().toISOString();
        saveDNA(dna);
        renderTree();
        updateView();
      });

      textarea.addEventListener("change", () => {
        asset.customText = textarea.value;
        dna.lastUpdatedAt = new Date().toISOString();
        saveDNA(dna);
      });

      row.appendChild(header);
      row.appendChild(slider);
      row.appendChild(mode === "oracle" ? phrase : textarea);
      container.appendChild(row);
    });
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
  const notesToggle = document.getElementById("notes-toggle");
  const notesContent = document.getElementById("notes-content");
  if (notesToggle && notesContent) {
    notesToggle.addEventListener("click", () => {
      notesContent.classList.toggle("is-collapsed");
    });
  }
  const viewDay = document.getElementById("view-day");
  const viewWeek = document.getElementById("view-week");
  const timeline = document.getElementById("timeline");
  const bronzeBacklog = document.querySelector(".bronze-backlog");
  const weekGrid = document.getElementById("week-grid");
  const plannerLayout = document.querySelector(".planner-layout");
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
        return {
          ...action,
          status: "backlog",
          scheduledHour: undefined,
          scheduledMinute: undefined,
          locked: false,
        };
      });
      savePlanner({ ...planner, bronzeActions: updated });
      renderPlanner();
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

const init = () => {
  ensureV2Reset();
  const initialProfile = loadProfile();
  applyTheme(initialProfile.theme || "gold");
  applyHiatoIfNeeded();
  initClock();
  initNav();
  renderTree();
  initPlanner();
  initConfig();
  renderArenas();
  renderSocial();
  applyGlitch();
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
  const arenaSave = document.getElementById("arena-save");
  const arenaCancel = document.getElementById("arena-cancel");
  if (arenaCancel) {
    arenaCancel.addEventListener("click", closeArenaModal);
  }
  if (arenaSave) {
    arenaSave.addEventListener("click", () => {
      const titleInput = document.getElementById("arena-title");
      const assetSelect = document.getElementById("arena-asset");
      const targetInput = document.getElementById("arena-target");
      const descriptionInput = document.getElementById("arena-description");
      if (!titleInput || !assetSelect || !targetInput || !descriptionInput) return;
      const title = titleInput.value.trim();
      if (!title) return;
      const targetCount = Number(targetInput.value || 0) || null;
      const description = descriptionInput.value.trim();
      const arenas = loadArenas();
      arenas.push({
        id: crypto.randomUUID(),
        title,
        completion: 0,
        assetId: assetSelect.value,
        targetCount,
        completedCount: 0,
        description,
      });
      saveArenas(arenas);
      renderArenas();
      closeArenaModal();
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
      const planner = loadPlanner();
      planner.bronzeActions.push({
        id: crypto.randomUUID(),
        arenaId,
        title,
        icon: selectedIcon,
        duration,
        durationMinutes,
        weekdays,
        serious: !!seriousToggle.checked,
        status: "backlog",
        locked: false,
        createdDate: new Date().toISOString(),
      });
      savePlanner(planner);
      renderPlanner();
      closeBronzeModal();
    });
  }

  const bronzeDuration = document.getElementById("bronze-duration");
  const bronzeDurationValue = document.getElementById("bronze-duration-value");
  if (bronzeDuration && bronzeDurationValue) {
    bronzeDuration.addEventListener("input", () => {
      bronzeDurationValue.textContent = `${bronzeDuration.value} min`;
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
  const arenaDossierAdd = document.getElementById("arena-dossier-add");
  if (arenaDossierAdd && arenaDossier) {
    arenaDossierAdd.addEventListener("click", () => {
      const id = arenaDossier.dataset.arenaId;
      if (!id) return;
      openBronzeModal(id);
    });
  }
  const avatar = document.getElementById("hud-avatar");
  const profileModal = document.getElementById("profile-modal");
  const profileClose = document.getElementById("profile-close");
  const profileNickname = document.getElementById("profile-nickname");
  const profileId = document.getElementById("profile-id");
  const profileBanner = document.getElementById("profile-banner");
  const widgetGrid = document.getElementById("widget-grid");
  const profileEdit = document.getElementById("profile-edit");
  const profileAvatarFile = document.getElementById("profile-avatar-file");
  const profileBannerFile = document.getElementById("profile-banner-file");
  const hudEdit = document.getElementById("hud-edit");
  if (avatar && profileModal) {
    avatar.addEventListener("click", () => {
      const profile = loadProfile();
      if (profileNickname) profileNickname.value = profile.nickname || "";
      if (profileId) profileId.value = profile.userId || "";
      if (profileBanner) profileBanner.value = profile.banner || "";
      if (profile.avatar) {
        const profileAvatar = profileModal.querySelector(".profile-avatar");
        if (profileAvatar) profileAvatar.style.backgroundImage = `url(${profile.avatar})`;
      }
      if (profile.banner) {
        const bannerWrap = profileModal.querySelector(".profile-banner");
        if (bannerWrap) bannerWrap.style.backgroundImage = `url(${profile.banner})`;
      }
      if (widgetGrid) {
        widgetGrid.innerHTML = "";
        const options = getSlotOptions();
        const selected = Array.isArray(profile.widgets) ? profile.widgets : [];
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
            saveProfile({ ...loadProfile(), widgets: updated.filter(Boolean) });
            renderSocial();
          });
          const wrapper = document.createElement("div");
          wrapper.className = "widget-item";
          wrapper.appendChild(select);
          widgetGrid.appendChild(wrapper);
        }
      }
      profileModal.classList.add("is-open");
    });
  }
  if (hudEdit && profileModal) {
    hudEdit.addEventListener("click", () => {
      profileModal.classList.add("is-open");
      if (profileNickname) profileNickname.focus();
    });
  }
  if (profileClose && profileModal) {
    profileClose.addEventListener("click", () => {
      profileModal.classList.remove("is-open");
    });
  }
  if (profileEdit) {
    profileEdit.addEventListener("click", () => {
      if (profileBannerFile) profileBannerFile.click();
    });
  }

  if (profileAvatarFile) {
    const avatarBox = profileModal?.querySelector(".profile-avatar");
    if (avatarBox) {
      avatarBox.addEventListener("click", () => profileAvatarFile.click());
    }
    profileAvatarFile.addEventListener("change", () => {
      const file = profileAvatarFile.files?.[0];
      if (!file) return;
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
  }

  if (profileBannerFile) {
    profileBannerFile.addEventListener("change", () => {
      const file = profileBannerFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const profile = loadProfile();
        const updated = { ...profile, banner: reader.result };
        saveProfile(updated);
        const bannerWrap = profileModal?.querySelector(".profile-banner");
        if (bannerWrap) bannerWrap.style.backgroundImage = `url(${reader.result})`;
        renderSocial();
      };
      reader.readAsDataURL(file);
    });
  }

  if (profileNickname) {
    profileNickname.addEventListener("change", () => {
      const profile = loadProfile();
      const updated = { ...profile, nickname: profileNickname.value.trim() };
      saveProfile(updated);
      ensureSupabaseProfile(updated);
      renderSocial();
    });
  }

  if (profileId) {
    profileId.addEventListener("change", () => {
      const profile = loadProfile();
      const updated = { ...profile, userId: profileId.value.trim() };
      saveProfile(updated);
      ensureSupabaseProfile(updated);
      renderSocial();
    });
  }

  if (profileBanner) {
    profileBanner.addEventListener("change", () => {
      const profile = loadProfile();
      const updated = { ...profile, banner: profileBanner.value.trim() };
      saveProfile(updated);
      ensureSupabaseProfile(updated);
      renderSocial();
    });
  }
  const allianceSearch = document.getElementById("alliance-search");
  if (allianceSearch) {
    allianceSearch.addEventListener("input", () => {
      renderSocial();
    });
  }

  const configNickname = document.getElementById("config-nickname");
  const configId = document.getElementById("config-id");
  const initialProfile = loadProfile();
  if (configNickname) configNickname.value = initialProfile.nickname || "";
  if (configId) configId.value = initialProfile.userId || "";
  if (configNickname) {
    configNickname.addEventListener("change", () => {
      const profile = loadProfile();
      const updated = { ...profile, nickname: configNickname.value.trim() };
      saveProfile(updated);
      ensureSupabaseProfile(updated);
      renderSocial();
    });
  }
  if (configId) {
    configId.addEventListener("change", () => {
      const profile = loadProfile();
      const updated = { ...profile, userId: configId.value.trim() };
      saveProfile(updated);
      ensureSupabaseProfile(updated);
      renderSocial();
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
  if (treeCancel) {
    treeCancel.addEventListener("click", () => {
      playMetalClick();
      closeTreeEditor();
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

document.addEventListener("DOMContentLoaded", init);

window.addEventListener("load", () => {
  const loading = document.getElementById("loading-screen");
  if (!loading) return;
  setTimeout(() => {
    loading.classList.add("fade-out");
    const handle = () => {
      loading.removeEventListener("transitionend", handle);
      loading.remove();
    };
    loading.addEventListener("transitionend", handle);
  }, 2500);
});
