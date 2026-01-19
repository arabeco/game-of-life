type EditOrigin = "tab4" | "oracle" | "system" | "other";

type MetricValue = string | number | boolean | null;

interface MetricDefinition {
  id: string;
  label: string;
  value: MetricValue;
}

interface AssetSlot {
  id: string;
  label: string;
  metrics: MetricDefinition[];
}

interface SephirotAsset {
  id: string;
  label: string;
  level: number;
  slots: AssetSlot[];
}

interface HobbyDefinition {
  id: string;
  name: string;
  honorMetricLabel: string;
  honorValue: MetricValue;
}

interface DNAState {
  assets: SephirotAsset[];
  hobbies: HobbyDefinition[];
  lastUpdatedAt: string;
}

const STORAGE_KEY = "game_of_life.module1_dna";

const SEPHIROT_IDS = [
  "kether",
  "chokmah",
  "binah",
  "chesed",
  "geburah",
  "tiphareth",
  "netzach",
  "hod",
  "yesod",
  "malkuth",
];

const SEPHIROT_LABELS: Record<string, string> = {
  kether: "Kether",
  chokmah: "Chokmah",
  binah: "Binah",
  chesed: "Chesed",
  geburah: "Geburah",
  tiphareth: "Tiphareth",
  netzach: "Netzach",
  hod: "Hod",
  yesod: "Yesod",
  malkuth: "Malkuth",
};

const createEmptyAssets = (): SephirotAsset[] =>
  SEPHIROT_IDS.map((id) => ({
    id,
    label: SEPHIROT_LABELS[id] ?? id,
    level: 0.0,
    slots: [],
  }));

const getDefaultState = (): DNAState => ({
  assets: createEmptyAssets(),
  hobbies: [],
  lastUpdatedAt: new Date(0).toISOString(),
});

const nowIso = () => new Date().toISOString();

const safeParse = (raw: string | null): DNAState | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DNAState;
    if (!parsed || !Array.isArray(parsed.assets)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const loadState = (): DNAState => {
  if (typeof localStorage === "undefined") {
    return getDefaultState();
  }
  const stored = safeParse(localStorage.getItem(STORAGE_KEY));
  if (!stored) return getDefaultState();

  const defaults = getDefaultState();
  const mergedAssets = defaults.assets.map((defaultAsset) => {
    const existing = stored.assets.find((asset) => asset.id === defaultAsset.id);
    if (!existing) return defaultAsset;
    return {
      ...defaultAsset,
      ...existing,
      slots: existing.slots ?? [],
      level: typeof existing.level === "number" ? existing.level : 0.0,
    };
  });

  return {
    ...defaults,
    ...stored,
    assets: mergedAssets,
    hobbies: Array.isArray(stored.hobbies) ? stored.hobbies : [],
  };
};

const persistState = (state: DNAState) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

type Listener = (state: DNAState) => void;

class DNAStore {
  private state: DNAState;
  private listeners = new Set<Listener>();

  constructor(initialState: DNAState) {
    this.state = initialState;
  }

  getState() {
    return this.state;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private setState(next: DNAState) {
    this.state = next;
    persistState(this.state);
    this.emit();
  }

  updateAssetLevel(assetId: string, level: number, origin: EditOrigin) {
    if (origin !== "tab4" && origin !== "oracle") {
      throw new Error("Asset level can only be edited in Tab 4 or Oracle.");
    }
    const clamped = Math.max(0, Math.min(10, level));
    const assets = this.state.assets.map((asset) =>
      asset.id === assetId ? { ...asset, level: clamped } : asset
    );
    this.setState({ ...this.state, assets, lastUpdatedAt: nowIso() });
  }

  addSlot(assetId: string, slot: AssetSlot, origin: EditOrigin) {
    if (origin !== "tab4") {
      throw new Error("Slots can only be created in Tab 4.");
    }
    const assets = this.state.assets.map((asset) => {
      if (asset.id !== assetId) return asset;
      return { ...asset, slots: [...asset.slots, slot] };
    });
    this.setState({ ...this.state, assets, lastUpdatedAt: nowIso() });
  }

  updateSlotLabel(assetId: string, slotId: string, label: string, origin: EditOrigin) {
    if (origin !== "tab4") {
      throw new Error("Slot labels can only be edited in Tab 4.");
    }
    const assets = this.state.assets.map((asset) => {
      if (asset.id !== assetId) return asset;
      const slots = asset.slots.map((slot) =>
        slot.id === slotId ? { ...slot, label } : slot
      );
      return { ...asset, slots };
    });
    this.setState({ ...this.state, assets, lastUpdatedAt: nowIso() });
  }

  updateMetricLabel(
    assetId: string,
    slotId: string,
    metricId: string,
    label: string,
    origin: EditOrigin
  ) {
    if (origin !== "tab4") {
      throw new Error("Metric labels can only be edited in Tab 4.");
    }
    const assets = this.state.assets.map((asset) => {
      if (asset.id !== assetId) return asset;
      const slots = asset.slots.map((slot) => {
        if (slot.id !== slotId) return slot;
        const metrics = slot.metrics.map((metric) =>
          metric.id === metricId ? { ...metric, label } : metric
        );
        return { ...slot, metrics };
      });
      return { ...asset, slots };
    });
    this.setState({ ...this.state, assets, lastUpdatedAt: nowIso() });
  }

  updateMetricValue(
    assetId: string,
    slotId: string,
    metricId: string,
    value: MetricValue
  ) {
    const assets = this.state.assets.map((asset) => {
      if (asset.id !== assetId) return asset;
      const slots = asset.slots.map((slot) => {
        if (slot.id !== slotId) return slot;
        const metrics = slot.metrics.map((metric) =>
          metric.id === metricId ? { ...metric, value } : metric
        );
        return { ...slot, metrics };
      });
      return { ...asset, slots };
    });
    this.setState({ ...this.state, assets, lastUpdatedAt: nowIso() });
  }

  addHobby(hobby: HobbyDefinition, origin: EditOrigin) {
    if (origin !== "tab4") {
      throw new Error("Hobbies can only be created in Tab 4.");
    }
    this.setState({
      ...this.state,
      hobbies: [...this.state.hobbies, hobby],
      lastUpdatedAt: nowIso(),
    });
  }

  updateHobbyHonorMetricLabel(hobbyId: string, label: string, origin: EditOrigin) {
    if (origin !== "tab4") {
      throw new Error("Honor metric label can only be edited in Tab 4.");
    }
    const hobbies = this.state.hobbies.map((hobby) =>
      hobby.id === hobbyId ? { ...hobby, honorMetricLabel: label } : hobby
    );
    this.setState({ ...this.state, hobbies, lastUpdatedAt: nowIso() });
  }

  updateHobbyHonorValue(hobbyId: string, value: MetricValue) {
    const hobbies = this.state.hobbies.map((hobby) =>
      hobby.id === hobbyId ? { ...hobby, honorValue: value } : hobby
    );
    this.setState({ ...this.state, hobbies, lastUpdatedAt: nowIso() });
  }

  resetAll(origin: EditOrigin) {
    if (origin !== "tab4") {
      throw new Error("Reset can only be executed in Tab 4.");
    }
    this.setState({ ...getDefaultState(), lastUpdatedAt: nowIso() });
  }
}

const dnaStore = new DNAStore(loadState());

export {
  dnaStore,
  DNAStore,
  AssetSlot,
  MetricDefinition,
  SephirotAsset,
  HobbyDefinition,
  DNAState,
  EditOrigin,
  MetricValue,
};
