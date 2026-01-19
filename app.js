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

const nowClock = () => new Date().toLocaleTimeString("pt-BR", { hour12: false });

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
    level.textContent = String(Math.round(asset.level));

    sphere.appendChild(label);
    sphere.appendChild(level);
    sphere.addEventListener("click", () => openTreeEditor(asset.id));
    treeGrid.appendChild(sphere);
  });
};

const loadPlanner = () => {
  try {
    const raw = localStorage.getItem(PLANNER_KEY);
    if (!raw) return { pills: [], logistics: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.pills)) return { pills: [], logistics: {} };
    return { pills: parsed.pills, logistics: parsed.logistics ?? {} };
  } catch {
    return { pills: [], logistics: {} };
  }
};

const savePlanner = (planner) => {
  localStorage.setItem(PLANNER_KEY, JSON.stringify(planner));
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
    progress.textContent = `${Math.round(Number(arena.completion || 0))}%`;
    card.appendChild(title);
    card.appendChild(progress);
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
  if (!timeline || !backlogList) return;

  const planner = loadPlanner();
  const arenas = loadArenas();
  const getArenaTitle = (arenaId) =>
    arenas.find((arena) => arena.id === arenaId)?.title ?? "Arena";

  timeline.innerHTML = "";
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
      const pillId = event.dataTransfer?.getData("text/plain");
      if (!pillId) return;
      const updated = planner.pills.map((pill) => {
        if (pill.id !== pillId) return pill;
        return { ...pill, status: "scheduled", scheduledHour: hour };
      });
      const nextPlanner = { ...planner, pills: updated };
      savePlanner(nextPlanner);
      renderPlanner();
    });

    timeline.appendChild(slot);
  }

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
  const levelInput = document.getElementById("tree-edit-level");
  if (!modal || !title || !levelInput) return;
  title.textContent = `Editar ${LABEL_BY_ID.get(asset.id) ?? asset.label}`;
  levelInput.value = String(Math.round(Number(asset.level || 0)));
  modal.dataset.assetId = asset.id;
  renderTreeEditorSlots(dna, asset.id);
  modal.classList.add("is-open");
};

const closeTreeEditor = () => {
  const modal = document.getElementById("tree-edit-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.dataset.assetId = "";
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
      addMetricBtn.textContent = "+";
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
    addMetricRow.textContent = "Add Metrica";
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
};

const initConfig = () => {
  const dna = seedDNAIfMissing();
  buildOracleForm(dna);
  buildSovereignControls(dna);
  const select = document.getElementById("sovereign-asset-select");
  if (select) {
    renderSlotEditor(dna, select.value || dna.assets[0]?.id);
    select.addEventListener("change", () => {
      renderSlotEditor(dna, select.value);
    });
  }

  const slotAddBtn = document.getElementById("slot-add-btn");
  const slotName = document.getElementById("slot-name");
  if (slotAddBtn && slotName && select) {
    slotAddBtn.addEventListener("click", () => {
      const name = slotName.value.trim();
      if (!name) return;
      const asset = dna.assets.find((item) => item.id === select.value);
      if (!asset) return;
      asset.slots = asset.slots || [];
      asset.slots.push({ id: crypto.randomUUID(), label: name, metrics: [] });
      slotName.value = "";
      dna.lastUpdatedAt = new Date().toISOString();
      saveDNA(dna);
      renderSlotEditor(dna, select.value);
    });
  }

  const modeInputs = document.querySelectorAll("input[name='mastery-mode']");
  const oraclePanel = document.getElementById("oracle-panel");
  const sovereignPanel = document.getElementById("sovereign-panel");
  const setMode = (mode) => {
    localStorage.setItem(MODE_KEY, mode);
    if (oraclePanel && sovereignPanel) {
      oraclePanel.classList.toggle("is-hidden", mode !== "oracle");
      sovereignPanel.classList.toggle("is-hidden", mode !== "sovereign");
    }
    modeInputs.forEach((input) => {
      input.checked = input.value === mode;
    });
  };

  const storedMode = localStorage.getItem(MODE_KEY) || "sovereign";
  setMode(storedMode);

  modeInputs.forEach((input) => {
    input.addEventListener("change", () => setMode(input.value));
  });

  const oracleApply = document.getElementById("oracle-apply");
  if (oracleApply) {
    oracleApply.addEventListener("click", () => {
      const inputs = document.querySelectorAll("#oracle-form input");
      inputs.forEach((input) => {
        const id = input.dataset.assetId;
        const asset = dna.assets.find((item) => item.id === id);
        if (asset) asset.level = Math.max(0, Math.min(10, Number(input.value || 0) / 10));
      });
      dna.lastUpdatedAt = new Date().toISOString();
      saveDNA(dna);
      renderTree();
    });
  }
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
};

const initClock = () => {
  const clock = document.getElementById("hud-clock");
  if (!clock) return;
  const tick = () => {
    clock.textContent = nowClock();
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
  const hiatoAck = document.getElementById("hiato-ack");
  if (hiatoAck) {
    hiatoAck.addEventListener("click", () => {
      clearHiato();
    });
  }
  const arenaAdd = document.getElementById("arena-add");
  if (arenaAdd) {
    arenaAdd.addEventListener("click", () => {
      const title = prompt("Nome da Arena");
      if (!title) return;
      const arenas = loadArenas();
      arenas.push({
        id: crypto.randomUUID(),
        title: title.trim(),
        completion: 0,
      });
      saveArenas(arenas);
      renderArenas();
    });
  }
  const treeSave = document.getElementById("tree-edit-save");
  const treeCancel = document.getElementById("tree-edit-cancel");
  const treeSlotAdd = document.getElementById("tree-slot-add");
  const treeSlotName = document.getElementById("tree-slot-name");
  if (treeSave) {
    treeSave.addEventListener("click", () => {
      const modal = document.getElementById("tree-edit-modal");
      const levelInput = document.getElementById("tree-edit-level");
      if (!modal || !levelInput) return;
      const assetId = modal.dataset.assetId;
      if (!assetId) return;
      const dna = seedDNAIfMissing();
      const asset = getAssetFromDNA(dna, assetId);
      if (!asset) return;
      const raw = Number(levelInput.value || 0);
      asset.level = Math.max(0, Math.min(10, Math.round(raw)));
      dna.lastUpdatedAt = new Date().toISOString();
      saveDNA(dna);
      renderTree();
      closeTreeEditor();
    });
  }
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
