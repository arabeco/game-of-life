import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useCodexBuilder } from '../contexts/CodexBuilderContext';
import { GlassCard } from './GlassCard';
import { XIcon } from './Icons';
import { ActionType } from '../types';

type ViewMode = 'export' | 'import';

type CodexTemplate = {
  schemaVersion: 1;
  metadata: {
    name: string;
    author?: string;
    price?: number;
    description?: string;
  };
  arenas: Array<{
    name: string;
    description?: string;
    icon?: string;
    tags?: string[];
  }>;
  actions: Array<{
    arenaName: string;
    name: string;
    description?: string;
    icon?: string;
    duration?: number;
    repetitions?: number;
    difficulty?: number;
    actionType?: Exclude<ActionType, 'Marco'>;
  }>;
  milestones: Array<{
    arenaName: string;
    name: string;
    description?: string;
    icon?: string;
    duration?: number;
    difficulty?: number;
  }>;
};

type JsonParseResult = { ok: true; value: unknown } | { ok: false; error: string };

const tryParseJson = (text: string): JsonParseResult => {
  try {
    return { ok: true as const, value: JSON.parse(text) };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || 'JSON inválido' };
  }
};

const toPrettyJson = (value: unknown) => JSON.stringify(value, null, 2);

const encodeUtf8Base64Url = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const decodeUtf8Base64Url = (base64Url: string) => {
  const padded = base64Url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

const validateCodexTemplate = (value: unknown): { ok: true; template: CodexTemplate } | { ok: false; error: string } => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'Codex precisa ser um objeto JSON.' };
  const obj = value as Record<string, unknown>;
  if (obj.schemaVersion !== 1) return { ok: false, error: 'schemaVersion inválido (esperado: 1).' };

  const metadata = obj.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return { ok: false, error: 'metadata inválido.' };
  const meta = metadata as Record<string, unknown>;
  const name = typeof meta.name === 'string' ? meta.name.trim() : '';
  if (!name) return { ok: false, error: 'metadata.name é obrigatório.' };

  const arenas = obj.arenas;
  if (!Array.isArray(arenas) || arenas.length === 0) return { ok: false, error: 'arenas precisa ser um array não vazio.' };
  for (const a of arenas) {
    if (!a || typeof a !== 'object' || Array.isArray(a)) return { ok: false, error: 'arena inválida.' };
    const ar = a as Record<string, unknown>;
    if (typeof ar.name !== 'string' || !ar.name.trim()) return { ok: false, error: 'arena.name é obrigatório.' };
  }

  const actions = Array.isArray(obj.actions) ? obj.actions : [];
  for (const a of actions) {
    if (!a || typeof a !== 'object' || Array.isArray(a)) return { ok: false, error: 'action inválida.' };
    const act = a as Record<string, unknown>;
    if (typeof act.arenaName !== 'string' || !act.arenaName.trim()) return { ok: false, error: 'action.arenaName é obrigatório.' };
    if (typeof act.name !== 'string' || !act.name.trim()) return { ok: false, error: 'action.name é obrigatório.' };
  }

  const milestones = Array.isArray(obj.milestones) ? obj.milestones : [];
  for (const m of milestones) {
    if (!m || typeof m !== 'object' || Array.isArray(m)) return { ok: false, error: 'milestone inválido.' };
    const ms = m as Record<string, unknown>;
    if (typeof ms.arenaName !== 'string' || !ms.arenaName.trim()) return { ok: false, error: 'milestone.arenaName é obrigatório.' };
    if (typeof ms.name !== 'string' || !ms.name.trim()) return { ok: false, error: 'milestone.name é obrigatório.' };
  }

  return { ok: true, template: obj as CodexTemplate };
};

const uniqueName = (desired: string, taken: Set<string>) => {
  const base = desired.trim() || 'Sem nome';
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  for (let i = 2; i < 2000; i++) {
    const attempt = `${base} (${i})`;
    if (!taken.has(attempt)) {
      taken.add(attempt);
      return attempt;
    }
  }
  const fallback = `${base} (${crypto.randomUUID().slice(0, 6)})`;
  taken.add(fallback);
  return fallback;
};

export const CodexModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { userProfile, assets, getArenas, getActionsForArena, addArena, addAction } = useGame();
  const { enterBuilderMode } = useCodexBuilder();
  const isPremium = userProfile.role === 'admin';

  const [mode, setMode] = useState<ViewMode>('export');
  const [status, setStatus] = useState<string | null>(null);

  const allArenas = useMemo(() => getArenas().filter(a => !a.isArchived), [getArenas]);
  const defaultArenaId = allArenas[0]?.id || '';
  const [exportArenaId, setExportArenaId] = useState<string>(defaultArenaId);

  const exportArena = useMemo(() => allArenas.find(a => a.id === exportArenaId) || null, [allArenas, exportArenaId]);
  const exportArenaActions = useMemo(() => (exportArena ? getActionsForArena(exportArena.id) : []), [exportArena, getActionsForArena]);

  const [metaName, setMetaName] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');
  const [metaPrice, setMetaPrice] = useState<string>('0');
  const [metaDescription, setMetaDescription] = useState('');
  const [exportJson, setExportJson] = useState('');

  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const defaultAssetId = useMemo(() => assets.find(a => a.id === 'geral')?.id || assets[0]?.id || '', [assets]);
  const [installAssetId, setInstallAssetId] = useState(defaultAssetId);

  const requirePremium = () => {
    if (isPremium) return true;
    setStatus('Disponível no Premium.');
    window.setTimeout(() => setStatus(null), 1400);
    return false;
  };

  useEffect(() => {
    const selected = exportArena;
    if (!selected) return;
    setMetaName(prev => (prev.trim() ? prev : selected.name));
    setMetaAuthor(prev => (prev.trim() ? prev : userProfile.nickname));
    setMetaDescription(prev => (prev.trim() ? prev : selected.description));
  }, [exportArena, userProfile.nickname]);

  useEffect(() => {
    if (!exportArena) {
      setExportJson('');
      return;
    }
    const regular = exportArenaActions.filter(a => a.actionType !== 'Marco');
    const milestones = exportArenaActions.filter(a => a.actionType === 'Marco');

    const template: CodexTemplate = {
      schemaVersion: 1,
      metadata: {
        name: (metaName.trim() || exportArena.name).trim(),
        author: metaAuthor.trim() || undefined,
        price: Number.isFinite(Number(metaPrice)) ? Number(metaPrice) : 0,
        description: metaDescription.trim() || undefined,
      },
      arenas: [
        {
          name: exportArena.name,
          description: exportArena.description || undefined,
          icon: exportArena.icon || undefined,
          tags: exportArena.tags && exportArena.tags.length > 0 ? exportArena.tags : undefined,
        },
      ],
      actions: regular.map(a => ({
        arenaName: exportArena.name,
        name: a.name,
        description: a.description || undefined,
        icon: a.icon || undefined,
        duration: a.duration,
        repetitions: a.repetitions,
        difficulty: a.difficulty,
        actionType: a.actionType === 'Compromisso' ? 'Compromisso' : 'Ação Recorrente',
      })),
      milestones: milestones.map(a => ({
        arenaName: exportArena.name,
        name: a.name,
        description: a.description || undefined,
        icon: a.icon || undefined,
        duration: a.duration,
        difficulty: a.difficulty,
      })),
    };

    setExportJson(toPrettyJson(template));
  }, [exportArena, exportArenaActions, metaAuthor, metaDescription, metaName, metaPrice]);

  useEffect(() => {
    if (mode !== 'import') return;
    const params = new URLSearchParams(window.location.search);
    const param = params.get('codex');
    if (!param) return;
    try {
      const decoded = decodeUtf8Base64Url(param);
      const parsed = tryParseJson(decoded);
      if (parsed.ok === true) {
        setImportText(toPrettyJson(parsed.value));
        setImportError(null);
      }
    } catch {
      setImportError('Link de Codex inválido.');
    }
  }, [mode]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copiado.');
      window.setTimeout(() => setStatus(null), 1200);
    } catch {
      setStatus('Falha ao copiar.');
      window.setTimeout(() => setStatus(null), 1200);
    }
  };

  const handleCopyJson = () => {
    if (!requirePremium()) return;
    if (!exportJson.trim()) return;
    copyToClipboard(exportJson);
  };

  const handleCopyLink = () => {
    if (!requirePremium()) return;
    if (!exportJson.trim()) return;
    const b64 = encodeUtf8Base64Url(exportJson);
    const url = `${window.location.origin}${window.location.pathname}?codex=${encodeURIComponent(b64)}`;
    copyToClipboard(url);
  };

  const handleDownload = () => {
    if (!requirePremium()) return;
    if (!exportJson.trim()) return;
    const safe = (metaName.trim() || exportArena?.name || 'codex')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safe || 'codex'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const normalizeImportInput = (raw: string): { ok: true; jsonText: string } | { ok: false; error: string } => {
    const trimmed = raw.trim();
    if (!trimmed) return { ok: false, error: 'Cole um JSON ou um link.' };
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return { ok: true, jsonText: trimmed };

    try {
      const url = new URL(trimmed);
      const param = url.searchParams.get('codex');
      if (param) {
        const decoded = decodeUtf8Base64Url(param);
        return { ok: true, jsonText: decoded };
      }
    } catch {
    }

    try {
      const decoded = decodeUtf8Base64Url(trimmed);
      return { ok: true, jsonText: decoded };
    } catch {
      return { ok: false, error: 'Entrada inválida. Cole o JSON ou um link gerado no Exportar.' };
    }
  };

  const handleInstall = () => {
    if (!requirePremium()) return;
    setImportError(null);
    setStatus(null);

    const normalized = normalizeImportInput(importText);
    if (normalized.ok === false) {
      setImportError(normalized.error);
      return;
    }

    const parsed = tryParseJson(normalized.jsonText);
    if (parsed.ok === false) {
      setImportError(parsed.error);
      return;
    }

    const validated = validateCodexTemplate(parsed.value);
    if (validated.ok === false) {
      setImportError(validated.error);
      return;
    }

    const assetId = assets.some(a => a.id === installAssetId) ? installAssetId : (assets[0]?.id || '');
    if (!assetId) {
      setImportError('Nenhum Asset disponível para instalar.');
      return;
    }

    const template = validated.template;
    const taken = new Set<string>(getArenas().map(a => a.name));
    const arenaNameToId = new Map<string, string>();

    for (const arena of template.arenas) {
      const createdName = uniqueName(arena.name, taken);
      const created = addArena(assetId, {
        name: createdName,
        icon: arena.icon || '🗂️',
        description: arena.description || template.metadata.description || 'Arena instalada via Codex',
      });
      arenaNameToId.set(arena.name, created.id);
    }

    const firstArenaId = arenaNameToId.values().next().value as string | undefined;
    if (!firstArenaId) {
      setImportError('Falha ao criar arenas.');
      return;
    }

    let createdActions = 0;
    let createdMilestones = 0;

    for (const action of template.actions) {
      const targetArenaId = arenaNameToId.get(action.arenaName) || firstArenaId;
      const actionType: Exclude<ActionType, 'Marco'> = action.actionType === 'Compromisso' ? 'Compromisso' : 'Ação Recorrente';
      addAction({
        arenaId: targetArenaId,
        name: action.name,
        description: action.description || undefined,
        icon: action.icon || '📝',
        duration: typeof action.duration === 'number' && action.duration > 0 ? Math.round(action.duration) : 60,
        repetitions: typeof action.repetitions === 'number' && action.repetitions > 0 ? Math.round(action.repetitions) : 1,
        actionType,
        difficulty: typeof action.difficulty === 'number' ? action.difficulty : undefined,
      });
      createdActions++;
    }

    for (const milestone of template.milestones) {
      const targetArenaId = arenaNameToId.get(milestone.arenaName) || firstArenaId;
      addAction({
        arenaId: targetArenaId,
        name: milestone.name,
        description: milestone.description || undefined,
        icon: milestone.icon || '🎯',
        duration: typeof milestone.duration === 'number' && milestone.duration > 0 ? Math.round(milestone.duration) : 15,
        repetitions: 1,
        actionType: 'Marco',
        difficulty: typeof milestone.difficulty === 'number' ? milestone.difficulty : undefined,
      });
      createdMilestones++;
    }

    setStatus(`Instalado: ${template.arenas.length} arena(s), ${createdActions} ação(ões), ${createdMilestones} marco(s).`);
    window.setTimeout(() => setStatus(null), 2500);
    setImportText('');
  };

  const headerLabel = mode === 'export' ? 'EXPORTAR CODEX' : 'IMPORTAR CODEX';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className={`text-xs font-bold uppercase tracking-wider ${isPremium ? 'text-[var(--gold)]' : 'text-gray-400'}`}>{headerLabel}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
        </div>

        {!isPremium && (
          <div className="text-center text-xs text-gray-400 bg-black/20 border border-white/10 rounded-xl p-2">
            Codex é Premium.
          </div>
        )}

        <div className="flex space-x-2">
          <button onClick={() => setMode('export')} className={`w-full py-2 rounded-xl font-bold text-xs tracking-widest border border-white/10 ${mode === 'export' ? 'bg-black/30 text-[var(--gold)]' : 'bg-black/10 text-gray-300 hover:bg-black/20'}`}>EXPORTAR</button>
          <button onClick={() => setMode('import')} className={`w-full py-2 rounded-xl font-bold text-xs tracking-widest border border-white/10 ${mode === 'import' ? 'bg-black/30 text-[var(--gold)]' : 'bg-black/10 text-gray-300 hover:bg-black/20'}`}>IMPORTAR</button>
        </div>

        {mode === 'export' && (
          <div className="space-y-3">
            <button
              onClick={() => {
                if (!requirePremium()) return;
                enterBuilderMode(metaName.trim() || undefined);
                onClose();
              }}
              disabled={!isPremium}
              className="w-full py-3 rounded-xl luxe-gold-button disabled:opacity-50"
            >
              CRIAR NOVO CODEX (MODO ARQUITETO)
            </button>
            {allArenas.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-6">Nenhuma arena para exportar.</div>
            ) : (
              <>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-bold text-gray-400">Arena</label>
                    <select value={exportArenaId} onChange={e => setExportArenaId(e.target.value)} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--gold)]">
                      {allArenas.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400">Nome do Codex</label>
                    <input value={metaName} onChange={e => setMetaName(e.target.value)} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--gold)]" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-400">Autor</label>
                      <input value={metaAuthor} onChange={e => setMetaAuthor(e.target.value)} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--gold)]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400">Preço</label>
                      <input value={metaPrice} onChange={e => setMetaPrice(e.target.value)} inputMode="numeric" className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--gold)]" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400">Descrição</label>
                    <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={3} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--gold)]" />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400">JSON do Template</label>
                    <textarea value={exportJson} readOnly rows={10} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--gold)] font-mono text-xs" />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button onClick={handleCopyJson} disabled={!isPremium} className="w-full py-3 rounded-xl luxe-button-secondary disabled:opacity-50">COPIAR JSON</button>
                  <button onClick={handleCopyLink} disabled={!isPremium} className="w-full py-3 rounded-xl luxe-button-secondary disabled:opacity-50">COPIAR LINK</button>
                </div>

                <button onClick={handleDownload} disabled={!isPremium} className="w-full py-3 rounded-xl luxe-button-primary disabled:opacity-50">BAIXAR .JSON</button>
              </>
            )}
          </div>
        )}

        {mode === 'import' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-400">Cole o JSON ou Link</label>
              <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={12} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--gold)] font-mono text-xs" />
              {importError && <div className="text-xs text-red-400 mt-1">{importError}</div>}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400">Instalar em</label>
              <select value={installAssetId} onChange={e => setInstallAssetId(e.target.value)} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--gold)]">
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <button onClick={handleInstall} disabled={!isPremium} className="w-full py-3 rounded-xl luxe-gold-button disabled:opacity-50">INSTALAR TEMPLATE</button>
          </div>
        )}

        {status && (
          <div className="text-center text-[10px] text-gray-500">
            {status}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
