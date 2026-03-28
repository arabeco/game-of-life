import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { XIcon, EyeIcon, PlusIcon, ChevronRightIcon, CheckIcon, Trash2Icon } from './Icons';
import { Action, ActionType, Arena, Campaign } from '../types';
import { ArenaCard } from './ArenaCard';
import { IconPickerModal } from './IconPickerModal';
import { SelectionModal } from './SelectionModal';
import { CampaignsCodex } from './CampaignsCodex';
import { buildCodexTemplateFromDraft, type CodexCampaignPreview } from '../utils/codexPreview';
import { suggestEmojiForLabel } from '../utils/suggestEmojiForLabel';
import { EmojiGlyph } from './EmojiGlyph';
import { supabase } from '../supabaseClient';
import { getGoldMechanicPrice } from '../constants/goldCatalog';

type CodexDraft = {
  id: string;
  name: string;
  description: string;
  arenas: Arena[];
  actions: Action[];
  updatedAt: string;
};

const CODEX_DRAFT_SCHEMA_VERSION = 'draft-v1';
const MENTOR_CAMPAIGN_FORGE_GOLD_COST = getGoldMechanicPrice('mentor_codex_forge', 100);

const difficultyLabels = ['MUITO FÁCIL', 'FÁCIL', 'NORMAL', 'DIFÍCIL', 'EXTREMO'];
const actionTypeOptions: ActionType[] = ['Ação Recorrente', 'Compromisso', 'Marco'];

const StyledRangeInput: React.FC<{label: string, value: number, min: number, max: number, step: number, unit: string, onChange: (val: number) => void}> =
({label, value, min, max, step, unit, onChange}) => (
  <div className="p-2 bg-black/20 rounded-xl space-y-1">
    <div className="flex justify-between items-center">
      <label className="text-xs font-semibold text-gray-400 uppercase">{label}</label>
      <span className="text-sm font-bold">{value} {unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-[var(--skin-accent-color)]"
    />
  </div>
);

const encodeUtf8Base64Url = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const loadDrafts = (storageKey: string): CodexDraft[] => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load drafts', error);
    return [];
  }
};

const isUuid = (value?: string | null) => !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const CodexModal: React.FC<{
  onClose: () => void;
  recipientId?: string;
  recipientName?: string;
  relationshipLinkId?: string | null;
  onDelivered?: () => void;
}> = ({ onClose, recipientId, recipientName, relationshipLinkId = null, onDelivered }) => {
  const { assets, addArena, addAction, scheduleMultipleTasks, createMentorCodexForRecipient } = useGame();
  const isMentorDraftMode = Boolean(recipientId);
  const draftStorageKey = isMentorDraftMode
    ? `mentorCodexDrafts:${relationshipLinkId || recipientId}`
    : 'codexDrafts';
  const [codexes, setCodexes] = useState<CodexDraft[]>([]);
  const [activeCodexId, setActiveCodexId] = useState<string | null>(null);
  const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null);
  const [isCreatingArena, setIsCreatingArena] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconTarget, setIconTarget] = useState<'arena' | 'action' | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isActionTypePickerOpen, setIsActionTypePickerOpen] = useState(false);
  const [isArenaPickerOpen, setIsArenaPickerOpen] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [actionDraft, setActionDraft] = useState<Partial<Action>>({});
  const [campaignPreview, setCampaignPreview] = useState<CodexCampaignPreview | null>(null);
  const [hasHydratedDrafts, setHasHydratedDrafts] = useState(false);
  const [arenaDraft, setArenaDraft] = useState({ name: '', description: '', icon: '\u{1F3DB}\uFE0F', assetId: '' });
  const [isArenaIconAuto, setIsArenaIconAuto] = useState(true);
  const [isActionIconAuto, setIsActionIconAuto] = useState(true);

  const [actionTab, setActionTab] = useState<'basic' | 'advanced'>('basic');
  const [advancedSubTab, setAdvancedSubTab] = useState<'media' | 'notes' | 'checklist' | 'context'>('media');

  useEffect(() => {
    if (!isCreatingArena || !isArenaIconAuto) return;

    setArenaDraft((prev) => {
      const nextIcon = suggestEmojiForLabel(prev.name, 'arena', {
        assetId: prev.assetId,
        fallback: '\u{1F3DB}\uFE0F',
      });

      return prev.icon === nextIcon ? prev : { ...prev, icon: nextIcon };
    });
  }, [arenaDraft.name, arenaDraft.assetId, isArenaIconAuto, isCreatingArena]);

  useEffect(() => {
    if (!isActionModalOpen || !isActionIconAuto) return;

    setActionDraft((prev) => {
      const nextIcon = suggestEmojiForLabel(prev.name, 'action', {
        actionType: typeof prev.actionType === 'string' ? prev.actionType : undefined,
        fallback: '\u{1F4DD}',
      });

      return prev.icon === nextIcon ? prev : { ...prev, icon: nextIcon };
    });
  }, [actionDraft.name, actionDraft.actionType, isActionIconAuto, isActionModalOpen]);

  useEffect(() => {
    let isMounted = true;

    const hydrateDrafts = async () => {
      const localDrafts = loadDrafts(draftStorageKey);

      if (isMentorDraftMode) {
        if (isMounted) {
          setCodexes(localDrafts);
          setHasHydratedDrafts(true);
        }
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;

        if (!userId || !isUuid(userId)) {
          if (isMounted) {
            setCodexes(localDrafts);
            setHasHydratedDrafts(true);
          }
          return;
        }

        const { data, error } = await supabase
          .from('codex')
          .select('id, name, description, template, updated_at')
          .eq('owner_id', userId)
          .eq('schema_version', CODEX_DRAFT_SCHEMA_VERSION)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const remoteDrafts: CodexDraft[] = (data || []).flatMap((row: any) => {
          const template = typeof row.template === 'string' ? JSON.parse(row.template) : row.template;
          if (!template || template.draftVersion !== 1) return [];

          return [{
            id: row.id,
            name: row.name || 'Nova Campanha',
            description: row.description || '',
            arenas: Array.isArray(template.arenas) ? template.arenas : [],
            actions: Array.isArray(template.actions) ? template.actions : [],
            updatedAt: row.updated_at || new Date().toISOString(),
          }];
        });

        const mergedDrafts = [...remoteDrafts];
        localDrafts.forEach((localDraft) => {
          if (!mergedDrafts.some((remoteDraft) => remoteDraft.id === localDraft.id)) {
            mergedDrafts.push(localDraft);
          }
        });

        if (isMounted) {
          setCodexes(mergedDrafts);
          setHasHydratedDrafts(true);
        }
      } catch (error) {
        console.error('Failed to hydrate drafts', error);
        if (isMounted) {
          setCodexes(localDrafts);
          setHasHydratedDrafts(true);
        }
      }
    };

    hydrateDrafts();

    return () => {
      isMounted = false;
    };
  }, [draftStorageKey, isMentorDraftMode]);

  useEffect(() => {
    if (!hasHydratedDrafts) return;
    localStorage.setItem(draftStorageKey, JSON.stringify(codexes));
  }, [codexes, draftStorageKey, hasHydratedDrafts]);

  useEffect(() => {
    if (!hasHydratedDrafts || isMentorDraftMode) return;

    const syncDrafts = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId || !isUuid(userId) || codexes.length === 0) return;

      const payload = codexes.map((draft) => ({
        id: draft.id,
        owner_id: userId,
        name: draft.name || 'Nova Campanha',
        description: draft.description || '',
        author: null,
        price: null,
        template: {
          draftVersion: 1,
          arenas: draft.arenas,
          actions: draft.actions,
        },
        schema_version: CODEX_DRAFT_SCHEMA_VERSION,
        is_public: false,
        source_type: 'created',
        created_by_user_id: userId,
        origin_codex_id: null,
        updated_at: draft.updatedAt,
      }));

      const { error } = await supabase.from('codex').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.error('Failed to sync codex drafts', error);
        if (error.message?.includes('SLOT_LIMIT_REACHED')) {
          setStatus('Se isso apareceu, o banco ainda esta com a regra antiga da forja.');
        }
      }
    };

    const timeoutId = window.setTimeout(syncDrafts, 500);
    return () => window.clearTimeout(timeoutId);
  }, [codexes, hasHydratedDrafts, isMentorDraftMode]);

  const activeCodex = codexes.find(c => c.id === activeCodexId) || null;
  const visibleArenas = useMemo(() => {
    if (!activeCodex) return [];
    return activeCodex.arenas.filter(a => showArchived || !a.isArchived);
  }, [activeCodex, showArchived]);

  const actionsForArena = (arenaId: string) => activeCodex?.actions.filter(a => a.arenaId === arenaId) || [];
  const buildDraftPreview = (draft: CodexDraft): CodexCampaignPreview => {
    const orderedArenas = draft.arenas.filter(arena => showArchived || !arena.isArchived);
    const arenaIds = orderedArenas.map(arena => arena.id);
    const arenaConfig: NonNullable<Campaign['arenaConfig']> = {};

    orderedArenas.forEach((arena, index) => {
      const previousArenaId = orderedArenas[index - 1]?.id;
      arenaConfig[arena.id] = {
        isLocked: index > 0,
        isHidden: false,
        prerequisiteArenaIds: previousArenaId ? [previousArenaId] : [],
      };
    });

    return {
      campaign: {
        id: `__codex_draft_preview_${draft.id}__`,
        userId: 'codex-draft',
            title: draft.name || 'Nova Campanha',
        description: draft.description || '',
        status: 'active',
        createdAt: draft.updatedAt || new Date().toISOString(),
        arenaIds,
        arenaConfig,
        type: 'sequential',
        priority: 'media',
        order: -1,
        priorityOrder: -1,
      },
      arenas: orderedArenas,
      actions: draft.actions.filter(action => arenaIds.includes(action.arenaId)),
    };
  };

  const updateCodex = (id: string, updater: (draft: CodexDraft) => CodexDraft) => {
    setCodexes(prev => prev.map(c => (c.id === id ? { ...updater(c), updatedAt: new Date().toISOString() } : c)));
  };

  const createCodex = () => {
    const newCodex: CodexDraft = {
      id: crypto.randomUUID(),
      name: 'Nova Campanha',
      description: '',
      arenas: [],
      actions: [],
      updatedAt: new Date().toISOString(),
    };
    setCodexes(prev => [newCodex, ...prev]);
    setActiveCodexId(newCodex.id);
  };

  const openCodex = (id: string) => {
    setActiveCodexId(id);
    setSelectedArenaId(null);
  };

  const closeCodex = () => {
    setActiveCodexId(null);
    setSelectedArenaId(null);
    setIsCreatingArena(false);
    setIsActionModalOpen(false);
    setEditingActionId(null);
  };

  const buildTemplateJson = (draft: CodexDraft) => {
    const arenaIdToName = new Map(draft.arenas.map(a => [a.id, a.name] as const));
    const arenas = draft.arenas.map(a => ({
      name: a.name,
      description: a.description || undefined,
      icon: a.icon || undefined,
      tags: a.tags && a.tags.length > 0 ? a.tags : undefined,
    }));
    const actions = draft.actions
      .filter(a => a.actionType !== 'Marco')
      .map(a => ({
        arenaName: arenaIdToName.get(a.arenaId) || 'Sem Arena',
        name: a.name,
        description: a.description || undefined,
        icon: a.icon || undefined,
        duration: a.duration,
        repetitions: a.repetitions,
        difficulty: a.difficulty,
        actionType: a.actionType === 'Compromisso' ? 'Compromisso' : 'Ação Recorrente',
        briefing: a.briefing,
        assets: a.assets,
        preFlight: a.preFlight,
        context: a.context
      }));
    const milestones = draft.actions
      .filter(a => a.actionType === 'Marco')
      .map(a => ({
        arenaName: arenaIdToName.get(a.arenaId) || 'Sem Arena',
        name: a.name,
        description: a.description || undefined,
        icon: a.icon || undefined,
        duration: a.duration,
        difficulty: a.difficulty,
        briefing: a.briefing,
        assets: a.assets,
        preFlight: a.preFlight,
        context: a.context
      }));
    return JSON.stringify({
      schemaVersion: 1,
      metadata: { name: draft.name.trim() || 'Campanha', description: draft.description || undefined },
      arenas,
      actions,
      milestones,
    }, null, 2);
  };

  const handleCopyJson = async () => {
    if (!activeCodex) return;
    const json = buildTemplateJson(activeCodex);
    await navigator.clipboard.writeText(json);
    setStatus('Código copiado.');
    window.setTimeout(() => setStatus(null), 1200);
  };

  const handleCopyLink = async () => {
    if (!activeCodex) return;
    const json = buildTemplateJson(activeCodex);
    const encoded = encodeUtf8Base64Url(json);
    const link = `${window.location.origin}${window.location.pathname}?codex=${encoded}`;
    await navigator.clipboard.writeText(link);
    setStatus('Link copiado.');
    window.setTimeout(() => setStatus(null), 1200);
  };

  const openNewArena = () => {
    const firstAsset = assets.find(a => a.id !== 'geral')?.id || assets[0]?.id || '';
    setArenaDraft({
      name: '',
      description: '',
      icon: suggestEmojiForLabel('', 'arena', { assetId: firstAsset, fallback: '\u{1F3DB}\uFE0F' }),
      assetId: firstAsset,
    });
    setIsArenaIconAuto(true);
    setIsCreatingArena(true);
  };

  const saveArena = () => {
    if (!activeCodex || !arenaDraft.name.trim() || !arenaDraft.assetId) return;
    const newArena: Arena = {
      id: crypto.randomUUID(),
      assetId: arenaDraft.assetId,
      name: arenaDraft.name.trim(),
      description: arenaDraft.description.trim(),
      icon: arenaDraft.icon || suggestEmojiForLabel(arenaDraft.name, 'arena', {
        assetId: arenaDraft.assetId,
        fallback: '\u{1F3DB}\uFE0F',
      }),
      actionIds: [],
      isArchived: false,
    };
    updateCodex(activeCodex.id, draft => ({
      ...draft,
      arenas: [newArena, ...draft.arenas],
      updatedAt: new Date().toISOString(),
    }));
    setIsCreatingArena(false);
    setSelectedArenaId(newArena.id);
  };

  const openActionModal = (arenaId: string, action?: Action) => {
    setEditingActionId(action?.id || null);
    setActionDraft(action || {
      arenaId,
      icon: suggestEmojiForLabel('', 'action', { fallback: '\u{1F4DD}' }),
      duration: 60,
      repetitions: 1,
      actionType: 'Ação Recorrente',
      difficulty: 3,
    });
    setIsActionIconAuto(!action);
    setIsActionModalOpen(true);
    setActionTab('basic');
  };

  const saveAction = () => {
    if (!activeCodex || !actionDraft.arenaId || !actionDraft.name?.trim()) return;
    const actionId = editingActionId || crypto.randomUUID();
    const actionType = (actionDraft.actionType || 'Ação Recorrente') as ActionType;
    const repetitions = actionType === 'Ação Recorrente' ? Math.max(1, actionDraft.repetitions || 1) : 1;
    const newAction: Action = {
      id: actionId,
      arenaId: actionDraft.arenaId,
      name: actionDraft.name.trim(),
      description: actionDraft.description?.trim() || undefined,
      icon: actionDraft.icon || suggestEmojiForLabel(actionDraft.name, 'action', {
        actionType,
        fallback: '\u{1F4DD}',
      }),
      duration: actionDraft.duration || 60,
      repetitions,
      actionType,
      difficulty: typeof actionDraft.difficulty === 'number' ? actionDraft.difficulty : 2,
      briefing: actionDraft.briefing,
      assets: actionDraft.assets,
      preFlight: actionDraft.preFlight,
      context: actionDraft.context
    };
    updateCodex(activeCodex.id, draft => {
      const without = draft.actions.filter(a => a.id !== actionId);
      const nextActions = [newAction, ...without];
      const nextArenas = draft.arenas.map(a => a.id === newAction.arenaId ? { ...a, actionIds: Array.from(new Set([...(a.actionIds || []), newAction.id])) } : a);
      return { ...draft, actions: nextActions, arenas: nextArenas, updatedAt: new Date().toISOString() };
    });
    setIsActionModalOpen(false);
    setEditingActionId(null);
  };

  const handleDeleteCodex = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta campanha?')) {
        setCodexes(prev => prev.filter(c => c.id !== id));
        if (!isMentorDraftMode) {
          supabase
            .from('codex')
            .delete()
            .eq('id', id)
            .eq('schema_version', CODEX_DRAFT_SCHEMA_VERSION)
            .then(({ error }) => {
              if (error) console.error('Failed to delete codex draft', error);
            });
        }
    }
  };

  const handleApplyCodex = async () => {
    if (!activeCodex) return;
    if (!confirm('Deseja instalar todas as arenas e ações desta campanha no seu jogo?')) return;

    const arenaIdMap: Record<string, string> = {};

    try {
        // Create arenas first
        for (const arena of activeCodex.arenas) {
            // Tenta encontrar o asset correspondente ou usa 'geral' como fallback
            const targetAssetId = assets.find(a => a.id === arena.assetId)?.id || 'geral';
            
            const newArena = await addArena(targetAssetId, {
                name: arena.name,
                description: arena.description,
                icon: arena.icon
            });
            arenaIdMap[arena.id] = newArena.id;
        }

        // Create actions
        const actionPromises = activeCodex.actions.map(async (action) => {
            const realArenaId = arenaIdMap[action.arenaId];
            if (realArenaId) {
                 const newAction = await addAction({
                    arenaId: realArenaId,
                    name: action.name,
                    description: action.description,
                    icon: action.icon,
                    duration: action.duration,
                    repetitions: action.repetitions,
                    actionType: action.actionType,
                    difficulty: action.difficulty,
                    scheduledDays: action.scheduledDays,
                    scheduledStartTime: action.scheduledStartTime,
                    briefing: action.briefing,
                    assets: action.assets,
                    preFlight: action.preFlight,
                    context: action.context,
                    originCodexId: activeCodex.id
                });

                if (newAction.actionType === 'Ação Recorrente' && newAction.scheduledDays && newAction.scheduledDays.length > 0 && newAction.scheduledStartTime !== undefined) {
                    await scheduleMultipleTasks(newAction.id, newAction.scheduledDays, newAction.scheduledStartTime);
                }
            }
        });

        await Promise.all(actionPromises);
        setStatus('Campanha instalada com sucesso!');
        setTimeout(() => setStatus(null), 2000);
        onClose();
    } catch (error) {
        console.error("Error applying campaign:", error);
        setStatus('Erro ao instalar campanha.');
    }
  };

  const handleDeliverCodex = async () => {
    if (!activeCodex || !recipientId) return;

    const template = buildCodexTemplateFromDraft(activeCodex);
    if (template.levels.length === 0) {
      setStatus('Crie ao menos uma arena antes de enviar.');
      return;
    }

    const success = await createMentorCodexForRecipient(
      recipientId,
      {
        name: activeCodex.name,
        description: activeCodex.description,
        template,
      },
      relationshipLinkId
    );

    if (!success) return;

    localStorage.removeItem(draftStorageKey);
    setCodexes([]);
    setStatus(`Campanha enviada para ${recipientName || 'o pupilo'}.`);
    window.setTimeout(() => setStatus(null), 1800);
    onDelivered?.();
    onClose();
  };

  const selectedArena = activeCodex?.arenas.find(a => a.id === selectedArenaId) || null;
  const selectedArenaActions = selectedArena ? actionsForArena(selectedArena.id) : [];
  const actionArena = activeCodex?.arenas.find(a => a.id === actionDraft.arenaId) || null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[220] flex items-center justify-center animate-fade-in" onClick={onClose}>
        <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center">
            <div className="text-xs font-bold uppercase tracking-wider accent-text">CAMPANHAS</div>
            <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
          </div>

          {!activeCodex ? (
            <>
              <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {codexes.map(codex => (
                  <button key={codex.id} onClick={() => openCodex(codex.id)} className="relative bg-black/30 border border-white/10 rounded-2xl p-3 text-left hover:border-[var(--skin-accent-color)] transition-colors group">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">{codex.name}</div>
                    <div className="text-[11px] text-gray-500 line-clamp-2 mt-1">{codex.description || 'Sem descrição'}</div>
                    <div className="text-[10px] text-gray-400 mt-2">{codex.arenas.length} arenas • {codex.actions.length} ações</div>
                    <div onClick={(e) => handleDeleteCodex(codex.id, e)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-red-900/50 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2Icon className="w-3 h-3" />
                    </div>
                  </button>
                ))}
                <button onClick={createCodex} className="bg-black/30 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center text-center hover:border-[var(--skin-accent-color)] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mb-2">
                    <PlusIcon className="w-5 h-5 accent-text" />
                  </div>
                  <div className="text-xs font-bold tracking-widest accent-text">NOVA CAMPANHA</div>
                </button>
              </div>
            </>
          ) : (
            <div className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Campanha</div>
                <button onClick={closeCodex} className="text-[10px] font-bold text-gray-400 hover:text-white">Voltar</button>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400">Título</label>
                <input
                  value={activeCodex.name}
                  onChange={e => updateCodex(activeCodex.id, draft => ({ ...draft, name: e.target.value, updatedAt: new Date().toISOString() }))}
                  className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400">Descrição</label>
                <textarea
                  rows={2}
                  value={activeCodex.description}
                  onChange={e => updateCodex(activeCodex.id, draft => ({ ...draft, description: e.target.value, updatedAt: new Date().toISOString() }))}
                  className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]"
                />
              </div>

              <div className="bg-black border border-white/10 rounded-2xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Arenas</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowArchived(s => !s)} className={`p-2 rounded-full transition-colors ${showArchived ? 'bg-white/20 text-white' : 'text-gray-500'}`}>
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button onClick={openNewArena} className="px-3 py-2 rounded-xl luxe-skin-button text-xs">Adicionar arena</button>
                  </div>
                </div>

                {visibleArenas.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-4">Nenhuma arena nesta campanha.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {visibleArenas.map(arena => (
                      <ArenaCard
                        key={arena.id}
                        arena={arena}
                        actions={actionsForArena(arena.id)}
                        onClick={() => setSelectedArenaId(arena.id)}
                        variant="dossier"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={() => activeCodex && setCampaignPreview(buildDraftPreview(activeCodex))} className="w-full py-2 rounded-xl luxe-button-secondary col-span-2 font-bold tracking-wider">VER CAMPANHA</button>
                {recipientId ? (
                  <button onClick={handleDeliverCodex} className="w-full py-2 rounded-xl luxe-skin-button col-span-2 font-bold tracking-wider">
                    FORJAR PARA {recipientName?.toUpperCase() || 'PUPILO'} · {MENTOR_CAMPAIGN_FORGE_GOLD_COST} OURO
                  </button>
                ) : (
                  <button onClick={handleApplyCodex} className="w-full py-2 rounded-xl luxe-skin-button col-span-2 font-bold tracking-wider">INSTALAR NO JOGO</button>
                )}
                <button onClick={handleCopyJson} className="w-full py-2 rounded-xl luxe-button-secondary text-xs">COPIAR MODELO</button>
                <button onClick={handleCopyLink} className="w-full py-2 rounded-xl luxe-button-secondary text-xs">COPIAR LINK</button>
              </div>
              {status && <div className="text-center text-[10px] text-gray-500">{status}</div>}
            </div>
          )}
        </GlassCard>
      </div>

      {isCreatingArena && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[230] flex items-center justify-center animate-fade-in" onClick={() => setIsCreatingArena(false)}>
          <GlassCard variant="silver" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <h2 className="text-lg font-bold uppercase tracking-wider">Nova Arena</h2>
            </div>
            <div className="space-y-2">
              <select value={arenaDraft.assetId} onChange={e => setArenaDraft(prev => ({ ...prev, assetId: e.target.value }))} className="w-full h-12 px-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]">
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.id === 'geral' ? 'OUTROS / SIDEQUEST' : asset.name}</option>
                ))}
              </select>
              <input type="text" placeholder="Nome da Arena" value={arenaDraft.name} onChange={e => setArenaDraft(prev => ({ ...prev, name: e.target.value }))} className="w-full h-12 px-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
              <textarea placeholder="Descrição da Meta..." value={arenaDraft.description} onChange={e => setArenaDraft(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full p-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
              <button onClick={() => { setIconTarget('arena'); setIsIconPickerOpen(true); }} className="w-full py-2 rounded-xl bg-black/30 border border-white/20 flex items-center justify-center text-2xl"><EmojiGlyph symbol={arenaDraft.icon || '\u{1F3DB}\uFE0F'} size="picker" className="text-white" /></button>
              <div className="text-center text-[10px] text-gray-500">Emoji sugerido automaticamente pelo nome da arena. Toque para trocar se quiser.</div>
            </div>
            <div className="flex space-x-2 pt-2">
              <button onClick={() => setIsCreatingArena(false)} className="w-full py-2 rounded-xl luxe-button-secondary">CANCELAR</button>
              <button onClick={saveArena} className="w-full py-2 rounded-xl luxe-skin-button">CRIAR ARENA</button>
            </div>
          </GlassCard>
        </div>
      )}

      {selectedArena && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[231] flex items-center justify-center animate-fade-in" onClick={() => setSelectedArenaId(null)}>
          <div className="dossier-bg border border-[color:var(--accent-silver-soft)] w-full max-w-sm m-4 space-y-3 rounded-2xl p-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">{selectedArena.name}</div>
              <button onClick={() => setSelectedArenaId(null)} className="px-4 py-2 text-sm font-bold rounded-xl luxe-skin-button">OK</button>
            </div>
            <div className="flex flex-col items-center text-center space-y-1">
              <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center">
                <EmojiGlyph symbol={selectedArena.icon || '\u{1F3DB}\uFE0F'} size="arena" className="text-white scale-[1.8]" />
              </div>
              <p className="text-sm text-gray-500">{selectedArena.description || 'Sem descrição.'}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Ações</div>
              <button onClick={() => openActionModal(selectedArena.id)} className="px-3 py-2 rounded-xl luxe-skin-button text-xs">Nova ação</button>
            </div>
            {selectedArenaActions.length === 0 ? (
              <div className="text-center text-xs text-gray-500">Nenhuma ação ainda.</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {selectedArenaActions.map(action => (
                  <button key={action.id} onClick={() => openActionModal(selectedArena.id, action)} className="bg-black/30 border border-white/10 rounded-xl p-2 text-left">
                    <div className="text-2xl"><EmojiGlyph symbol={action.icon || '\u{1F4DD}'} size="picker" className="text-white" /></div>
                    <div className="text-xs font-bold text-white mt-1 truncate">{action.name}</div>
                    <div className="text-[10px] text-gray-500">{action.actionType}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isActionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[232] flex items-center justify-center animate-fade-in" onClick={() => setIsActionModalOpen(false)}>
          <GlassCard variant="accent" className="w-full max-w-sm m-4 rounded-2xl flex flex-col max-h-[90vh] p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3 border-b border-white/10 bg-black/20">
              <div className="flex space-x-4">
                  <button onClick={() => setActionTab('basic')} className={`text-xs font-bold uppercase tracking-wider transition-colors ${actionTab === 'basic' ? 'text-[var(--skin-accent-color)] border-b-2 border-[var(--skin-accent-color)]' : 'text-gray-400 hover:text-white'}`}>Básico</button>
                  <button onClick={() => setActionTab('advanced')} className={`text-xs font-bold uppercase tracking-wider transition-colors ${actionTab === 'advanced' ? 'text-[var(--skin-accent-color)] border-b-2 border-[var(--skin-accent-color)]' : 'text-gray-400 hover:text-white'}`}>Avançado</button>
              </div>
              <button onClick={() => setIsActionModalOpen(false)} className="px-4 py-2 text-sm font-bold rounded-xl luxe-skin-button">OK</button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {actionTab === 'basic' ? (
                <>
                  <button onClick={() => { setIconTarget('action'); setIsIconPickerOpen(true); }} className="w-24 h-24 bg-[#2a211c]/50 border border-[var(--skin-accent-color)] rounded-xl hover:bg-[#2a211c] transition-colors flex items-center justify-center self-center mx-auto mb-4">
                    <span className="text-5xl">{actionDraft.icon || '📝'}</span>
                  </button>
                  <div className="text-center text-[10px] text-gray-500 -mt-2 mb-2">Emoji sugerido automaticamente pelo nome da ação. Toque para trocar se quiser.</div>
                  <input type="text" placeholder="Nome da Ação" value={actionDraft.name || ''} onChange={e => setActionDraft(prev => ({ ...prev, name: e.target.value }))} className="w-full text-center bg-transparent text-xl font-bold text-white focus:outline-none border-b border-dashed border-white/20 py-1 mb-2" />
                  <textarea placeholder="Descrição (opcional)" value={actionDraft.description || ''} onChange={e => setActionDraft(prev => ({ ...prev, description: e.target.value }))} rows={2} className="w-full bg-black/20 rounded-xl px-3 py-2 text-sm text-white/90 focus:outline-none border border-white/10 focus:border-[var(--skin-accent-color)]/50" />
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-bold text-gray-400">Arena</label>
                      <button
                        onClick={() => setIsArenaPickerOpen(true)}
                        className="w-full p-3 mt-1 bg-black/20 rounded-xl flex justify-between items-center text-left"
                      >
                        <span>{actionArena ? `${actionArena.icon} ${actionArena.name}` : 'Selecionar Arena'}</span>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400">Tipo de Ação</label>
                      <button
                        onClick={() => setIsActionTypePickerOpen(true)}
                        className="w-full p-3 mt-1 bg-black/20 rounded-xl flex justify-between items-center text-left"
                      >
                        <span>{actionDraft.actionType || 'Ação Recorrente'}</span>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <StyledRangeInput label="Duração" value={actionDraft.duration ?? 60} min={15} max={240} step={15} unit="min" onChange={val => setActionDraft(prev => ({ ...prev, duration: val }))} />
                      {actionDraft.actionType === 'Ação Recorrente' && (
                        <StyledRangeInput label="Repetições" value={actionDraft.repetitions ?? 1} min={1} max={50} step={1} unit="x" onChange={val => setActionDraft(prev => ({ ...prev, repetitions: val }))} />
                      )}
                      <StyledRangeInput label="Dificuldade" value={actionDraft.difficulty ?? 3} min={1} max={5} step={1} unit={difficultyLabels[(actionDraft.difficulty ?? 3) - 1]} onChange={val => setActionDraft(prev => ({ ...prev, difficulty: val }))} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-around bg-black/20 rounded-xl p-1">
                      {(['media', 'notes', 'checklist', 'context'] as const).map(tab => (
                          <button 
                              key={tab}
                              onClick={() => setAdvancedSubTab(tab)}
                              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${advancedSubTab === tab ? 'bg-white/10 text-[var(--skin-accent-color)] shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                          >
                              {tab === 'media' && 'Mídia'}
                              {tab === 'notes' && 'Notas'}
                              {tab === 'checklist' && 'Check'}
                              {tab === 'context' && 'Ctx'}
                          </button>
                      ))}
                  </div>

                  {advancedSubTab === 'media' && (
                      <div className="space-y-3">
                          <div className="text-xs text-gray-400 uppercase font-bold">Anexos (Imagens/Vídeos)</div>
                          {(actionDraft.assets || []).map((asset, idx) => (
                              <div key={idx} className="flex gap-2 items-center bg-black/20 p-2 rounded-lg">
                                  <div className="flex-1 overflow-hidden">
                                      <div className="text-xs font-bold truncate text-white">{asset.title || 'Sem título'}</div>
                                      <div className="text-[10px] text-gray-500 truncate">{asset.url}</div>
                                  </div>
                                  <button onClick={() => {
                                      const newAssets = [...(actionDraft.assets || [])];
                                      newAssets.splice(idx, 1);
                                      setActionDraft(prev => ({ ...prev, assets: newAssets }));
                                  }} className="p-1 text-red-400 hover:bg-red-900/20 rounded"><Trash2Icon className="w-4 h-4" /></button>
                              </div>
                          ))}
                          <button onClick={() => {
                              const url = prompt("URL da imagem/vídeo:");
                              if (url) {
                                  const title = prompt("Título (opcional):") || 'Mídia';
                                  const type = url.match(/\.(mp4|webm)$/i) ? 'video' : 'image';
                                  setActionDraft(prev => ({ ...prev, assets: [...(prev.assets || []), { type, url, title } as any] }));
                              }
                          }} className="w-full py-2 border border-dashed border-white/20 rounded-xl text-xs text-gray-400 hover:text-[var(--skin-accent-color)] hover:border-[var(--skin-accent-color)] transition-colors flex items-center justify-center gap-2">
                              <PlusIcon className="w-4 h-4" /> Adicionar Mídia
                          </button>
                      </div>
                  )}

                  {advancedSubTab === 'notes' && (
                      <div className="space-y-3">
                          <div className="text-xs text-gray-400 uppercase font-bold">Briefing / Notas Técnicas</div>
                          <textarea 
                              value={actionDraft.briefing || ''}
                              onChange={e => setActionDraft(prev => ({ ...prev, briefing: e.target.value }))}
                            className="w-full h-40 bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-[var(--skin-accent-color)]"
                              placeholder="Instruções detalhadas, observações técnicas ou briefing da missão..."
                          />
                      </div>
                  )}

                  {advancedSubTab === 'checklist' && (
                      <div className="space-y-3">
                          <div className="text-xs text-gray-400 uppercase font-bold">Checklist Pré-Voo</div>
                          {(actionDraft.preFlight || []).map((item, idx) => (
                              <div key={idx} className="flex gap-2 items-center bg-black/20 p-2 rounded-lg">
                                  <div className="w-4 h-4 border border-white/30 rounded flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white/50 rounded-sm" />
                                  </div>
                                  <input 
                                      value={item}
                                      onChange={e => {
                                          const newChecklist = [...(actionDraft.preFlight || [])];
                                          newChecklist[idx] = e.target.value;
                                          setActionDraft(prev => ({ ...prev, preFlight: newChecklist }));
                                      }}
                                      className="flex-1 bg-transparent text-sm focus:outline-none"
                                      placeholder="Item do checklist..."
                                  />
                                  <button onClick={() => {
                                      const newChecklist = [...(actionDraft.preFlight || [])];
                                      newChecklist.splice(idx, 1);
                                      setActionDraft(prev => ({ ...prev, preFlight: newChecklist }));
                                  }} className="p-1 text-red-400 hover:bg-red-900/20 rounded"><Trash2Icon className="w-4 h-4" /></button>
                              </div>
                          ))}
                          <button onClick={() => {
                              setActionDraft(prev => ({ ...prev, preFlight: [...(prev.preFlight || []), ''] }));
                          }} className="w-full py-2 border border-dashed border-white/20 rounded-xl text-xs text-gray-400 hover:text-[var(--skin-accent-color)] hover:border-[var(--skin-accent-color)] transition-colors flex items-center justify-center gap-2">
                              <PlusIcon className="w-4 h-4" /> Adicionar Item
                          </button>
                      </div>
                  )}

                  {advancedSubTab === 'context' && (
                      <div className="space-y-4">
                          <div className="text-xs text-gray-400 uppercase font-bold">Contexto da Ação</div>
                          
                          <div className="space-y-2">
                              <label className="text-xs font-semibold text-gray-500">Nível de Energia Requerido</label>
                              <div className="grid grid-cols-3 gap-2">
                                  {['low', 'medium', 'high'].map(level => (
                                      <button
                                          key={level}
                                          onClick={() => setActionDraft(prev => ({ ...prev, context: { ...prev.context, energyLevel: level as any } }))}
                                          className={`py-2 rounded-lg text-xs font-bold uppercase border ${actionDraft.context?.energyLevel === level ? 'bg-[var(--skin-accent-color)] text-black border-[var(--skin-accent-color)]' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}`}
                                      >
                                          {level === 'low' ? 'Baixo' : level === 'medium' ? 'Médio' : 'Alto'}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-xs font-semibold text-gray-500">Período Ideal</label>
                              <div className="grid grid-cols-2 gap-2">
                                  {['morning', 'afternoon', 'evening', 'night'].map(time => (
                                      <button
                                          key={time}
                                          onClick={() => setActionDraft(prev => ({ ...prev, context: { ...prev.context, timeOfDay: time as any } }))}
                                          className={`py-2 rounded-lg text-xs font-bold uppercase border ${actionDraft.context?.timeOfDay === time ? 'bg-[var(--skin-accent-color)] text-black border-[var(--skin-accent-color)]' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}`}
                                      >
                                          {time === 'morning' ? 'Manhã' : time === 'afternoon' ? 'Tarde' : time === 'evening' ? 'Noite' : 'Madrugada'}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-2 p-3 bg-black/20 border-t border-white/10 mt-auto">
              <button onClick={() => setIsActionModalOpen(false)} className="w-full py-2 rounded-xl luxe-button-secondary">CANCELAR</button>
              <button onClick={saveAction} className="w-full py-2 rounded-xl luxe-skin-button">SALVAR AÇÃO</button>
            </div>
          </GlassCard>
        </div>
      )}

      {isIconPickerOpen && (
        <IconPickerModal
          onSelect={icon => {
            if (iconTarget === 'arena') {
              setIsArenaIconAuto(false);
              setArenaDraft(prev => ({ ...prev, icon }));
            }
            if (iconTarget === 'action') {
              setIsActionIconAuto(false);
              setActionDraft(prev => ({ ...prev, icon }));
            }
            setIsIconPickerOpen(false);
            setIconTarget(null);
          }}
          onClose={() => { setIsIconPickerOpen(false); setIconTarget(null); }}
        />
      )}
      {isActionTypePickerOpen && (
        <SelectionModal<ActionType>
          title="Tipo de Ação"
          options={actionTypeOptions}
          currentValue={actionDraft.actionType || 'Ação Recorrente'}
          onSelect={value => setActionDraft(prev => ({ ...prev, actionType: value }))}
          onClose={() => setIsActionTypePickerOpen(false)}
        />
      )}
      {isArenaPickerOpen && activeCodex && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[233] flex items-center justify-center animate-fade-in" onClick={() => setIsArenaPickerOpen(false)}>
          <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold uppercase tracking-wider text-center">Selecionar Arena</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {activeCodex.arenas.map(arena => (
                <button
                  key={arena.id}
                  onClick={() => {
                    setActionDraft(prev => ({ ...prev, arenaId: arena.id }));
                    setIsArenaPickerOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left flex justify-between items-center transition-colors ${actionDraft.arenaId === arena.id ? 'bg-white/20' : 'bg-black/20 hover:bg-white/10'}`}
                >
                  <span>{arena.icon} {arena.name}</span>
                  {actionDraft.arenaId === arena.id && <CheckIcon className="w-5 h-5 text-[var(--skin-accent-color)]" />}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
      {campaignPreview && (
        <CampaignsCodex
          onClose={() => setCampaignPreview(null)}
          initialCampaignId={campaignPreview.campaign.id}
          previewCampaign={campaignPreview.campaign}
          previewArenas={campaignPreview.arenas}
          previewActions={campaignPreview.actions}
        />
      )}
    </Portal>
  );
};

