const STORAGE_KEY = "game_of_life.module1_dna";
const PLANNER_KEY = "game_of_life.planner";
const ARENAS_KEY = "game_of_life.arenas";
const LOGIN_KEY = "game_of_life.last_login";
const HIATO_KEY = "game_of_life.hiato_active";
const GLITCH_KEY = "game_of_life.glitch_until";
const MODE_KEY = "game_of_life.mastery_mode";

const SEPHIROT = [
  { id: "kether", label: "Gratidao", row: 1, col: 2 },
  { id: "binah", label: "Mente", row: 2, col: 1 },
  { id: "chokmah", label: "Espiritualidade", row: 2, col: 3 },
  { id: "geburah", label: "Proposito", row: 3, col: 1 },
  { id: "chesed", label: "Projetos", row: 3, col: 3 },
  { id: "tiphareth", label: "Conexoes", row: 4, col: 2 },
  { id: "hod", label: "Trabalho/Estudos", row: 5, col: 1 },
  { id: "netzach", label: "Financas", row: 5, col: 3 },
  { id: "yesod", label: "Hobbies", row: 6, col: 2 },
  { id: "malkuth", label: "Fisico", row: 7, col: 2 },
];

const LABEL_BY_ID = new Map(SEPHIROT.map((asset) => [asset.id, asset.label]));
const STATUS_FIELDS = {
  malkuth: ["Peso", "Altura", "%G"],
  hod: ["Slot 1 (PEC)", "Slot 2 (UNIP)", "Slot 3 (Personal)"],
};
const ICON_BY_ID = {
  malkuth: "dumbbell",
  binah: "brain",
  chokmah: "sparkles",
  geburah: "target",
  chesed: "briefcase",
  tiphareth: "users",
  netzach: "wallet",
  hod: "book-open",
  yesod: "gamepad-2",
  kether: "crown",
};
const BRONZE_ICONS = ["dumbbell", "book", "code", "dollar-sign", "flame", "leaf", "coffee", "music"];
const MASTERY_PHRASES = {
  gratidao: [
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
  financas: [
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
  kether: "gratidao",
  chokmah: "espiritualidade",
  binah: "mente",
  geburah: "verdade",
  chesed: "inspiracao",
  tiphareth: "amor",
  netzach: "financas",
  hod: "trabalho",
  yesod: "autenticidade",
  malkuth: "fisico",
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
  const check = document.createElement("button");
  check.type = "button";
  check.className = "bronze-check";
  check.innerHTML = '<i data-lucide="check"></i>';
  check.addEventListener("click", () => {
    const planner = loadPlanner();
    const updated = planner.bronzeActions.map((item) => {
      if (item.id !== action.id) return item;
      const nextStatus = item.status === "done" ? "scheduled" : "done";
      return { ...item, status: nextStatus };
    });
    const nextAction = updated.find((item) => item.id === action.id);
    if (nextAction?.arenaId) {
      updateArenaCountsForBronze(nextAction.arenaId, nextAction.status === "done" ? 1 : -1);
    }
    savePlanner({ ...planner, bronzeActions: updated });
    renderPlanner();
    renderArenas();
  });
  block.appendChild(icon);
  block.appendChild(title);
  block.appendChild(check);
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
    addBronze.addEventListener("click", () => openBronzeModal(arena.id));
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
  const backlogList = document.getElementById("backlog-list");
  const bronzeList = document.getElementById("bronze-list");
  if (!timeline || !backlogList || !bronzeList) return;

  const planner = loadPlanner();
  const arenas = loadArenas();
  const getArenaTitle = (arenaId) =>
    arenas.find((arena) => arena.id === arenaId)?.title ?? "Arena";

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

    const pillsForHour = planner.pills.filter(
      (pill) => pill.status === "scheduled" && pill.scheduledHour === hour
    );

    pillsForHour.forEach((pill) => {
      slot.appendChild(buildPillElement(pill, getArenaTitle(pill.arenaId)));
    });

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
      const pillId = payload;
      const updated = planner.pills.map((pill) => {
        if (pill.id !== pillId) return pill;
        return { ...pill, status: "scheduled", scheduledHour: hour };
      });
      savePlanner({ ...planner, pills: updated });
      renderPlanner();
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

  backlogList.innerHTML = "";
  const backlogPills = planner.pills.filter((pill) => pill.status === "backlog");
  if (backlogPills.length === 0) {
    const empty = document.createElement("div");
    empty.className = "backlog-empty";
    empty.textContent = "Nenhuma acao pendente.";
    backlogList.appendChild(empty);
  } else {
    backlogPills.forEach((pill) => {
      backlogList.appendChild(buildPillElement(pill, getArenaTitle(pill.arenaId)));
    });
  }

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
  asset.slots = asset.slots || [];
  asset.slots.forEach((slot) => {
    const slotEl = document.createElement("div");
    slotEl.className = "slot-item";
    const slotInput = document.createElement("input");
    slotInput.value = slot.label || "";
    slotInput.addEventListener("change", () => {
      slot.label = slotInput.value;
      dna.lastUpdatedAt = new Date().toISOString();
      saveDNA(dna);
    });
    slotEl.appendChild(slotInput);
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
  renderStatusFields(dna, asset.id);
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
        actionButton.addEventListener("click", () => {
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
  const target = document.getElementById("arena-target");
  if (!modal || !select || !title || !target) return;
  select.innerHTML = "";
  SEPHIROT.forEach((asset) => {
    const option = document.createElement("option");
    option.value = asset.id;
    option.textContent = asset.label;
    select.appendChild(option);
  });
  title.value = "";
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
  macro.textContent = arena.targetCount
    ? `Meta: ${arena.targetCount} acoes`
    : "Meta: livre";
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
      const row = document.createElement("div");
      row.className = "linked-arena";
      const name = document.createElement("span");
      name.textContent = action.title || "Acao";
      const meta = document.createElement("span");
      meta.textContent = action.duration || "";
      row.appendChild(name);
      row.appendChild(meta);
      bronzeList.appendChild(row);
    });
  }
  if (window.lucide) window.lucide.createIcons();
  modal.classList.add("is-open");
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
  const backlog = document.querySelector(".backlog-drawer");
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
    if (backlog) backlog.classList.toggle("is-hidden", mode !== "day");
    if (bronzeBacklog) bronzeBacklog.classList.toggle("is-hidden", mode !== "day");
    if (weekGrid) weekGrid.classList.toggle("is-hidden", mode !== "week");
  };
  if (viewDay) viewDay.addEventListener("click", () => setView("day"));
  if (viewWeek) viewWeek.addEventListener("click", () => setView("week"));
  setView("day");
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
  applyHiatoIfNeeded();
  initClock();
  initNav();
  renderTree();
  initPlanner();
  initConfig();
  renderArenas();
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
      if (!titleInput || !assetSelect || !targetInput) return;
      const title = titleInput.value.trim();
      if (!title) return;
      const targetCount = Number(targetInput.value || 0) || null;
      const arenas = loadArenas();
      arenas.push({
        id: crypto.randomUUID(),
        title,
        completion: 0,
        assetId: assetSelect.value,
        targetCount,
        completedCount: 0,
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
      const title = titleInput.value.trim() || "Acao";
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

  const arenaDossierClose = document.getElementById("arena-dossier-close");
  const arenaDossier = document.getElementById("arena-dossier");
  if (arenaDossierClose && arenaDossier) {
    arenaDossierClose.addEventListener("click", () => {
      arenaDossier.classList.remove("is-open");
    });
  }
  const avatar = document.getElementById("hud-avatar");
  const profileModal = document.getElementById("profile-modal");
  const profileClose = document.getElementById("profile-close");
  const profileLastLogin = document.getElementById("profile-last-login");
  if (avatar && profileModal) {
    avatar.addEventListener("click", () => {
      const lastLogin = localStorage.getItem(LOGIN_KEY);
      if (profileLastLogin) {
        profileLastLogin.textContent = lastLogin ? new Date(lastLogin).toLocaleString("pt-BR") : "-";
      }
      profileModal.classList.add("is-open");
    });
  }
  if (profileClose && profileModal) {
    profileClose.addEventListener("click", () => {
      profileModal.classList.remove("is-open");
    });
  }
  const treeCancel = document.getElementById("tree-edit-cancel");
  const treeSlotAdd = document.getElementById("tree-slot-add");
  const treeSlotName = document.getElementById("tree-slot-name");
  if (treeCancel) {
    treeCancel.addEventListener("click", () => {
      closeTreeEditor();
    });
  }
  if (treeSlotAdd && treeSlotName) {
    treeSlotAdd.addEventListener("click", () => {
      const name = treeSlotName.value.trim();
      if (!name) return;
      const modal = document.getElementById("tree-edit-modal");
      if (!modal) return;
      const assetId = modal.dataset.assetId;
      if (!assetId) return;
      const dna = seedDNAIfMissing();
      const asset = getAssetFromDNA(dna, assetId);
      if (!asset) return;
      asset.slots = asset.slots || [];
      asset.slots.push({ id: crypto.randomUUID(), label: name, metrics: [] });
      treeSlotName.value = "";
      dna.lastUpdatedAt = new Date().toISOString();
      saveDNA(dna);
      renderTreeEditorSlots(dna, assetId);
    });
  }
  window.addEventListener("storage", () => {
    renderTree();
    renderPlanner();
    renderArenas();
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
