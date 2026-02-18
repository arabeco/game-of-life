import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { XIcon, EyeIcon, PlusIcon, ChevronRightIcon, CheckIcon, Trash2Icon } from './Icons';
import { Action, ActionType, Arena } from '../types';
import { ArenaCard } from './ArenaCard';
import { IconPickerModal } from './IconPickerModal';
import { SelectionModal } from './SelectionModal';

type CodexDraft = {
  id: string;
  name: string;
  description: string;
  arenas: Arena[];
  actions: Action[];
  updatedAt: string;
};

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
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-[var(--bronze)]"
    />
  </div>
);

const encodeUtf8Base64Url = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const loadDrafts = (): CodexDraft[] => {
  return [];
};

export const CodexModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { assets, addArena, addAction, scheduleMultipleTasks } = useGame();
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
  const [arenaDraft, setArenaDraft] = useState({ name: '', description: '', icon: '🏆', assetId: '' });

  // Persistence removed for Online Only mode
  // useEffect(() => {
  //   localStorage.setItem('codexDrafts', JSON.stringify(codexes));
  // }, [codexes]);

  const activeCodex = codexes.find(c => c.id === activeCodexId) || null;
  const visibleArenas = useMemo(() => {
    if (!activeCodex) return [];
    return activeCodex.arenas.filter(a => showArchived || !a.isArchived);
  }, [activeCodex, showArchived]);

  const actionsForArena = (arenaId: string) => activeCodex?.actions.filter(a => a.arenaId === arenaId) || [];

  const updateCodex = (id: string, updater: (draft: CodexDraft) => CodexDraft) => {
    setCodexes(prev => prev.map(c => (c.id === id ? updater(c) : c)));
  };

  const createCodex = () => {
    const newCodex: CodexDraft = {
      id: crypto.randomUUID(),
      name: 'Novo Codex',
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
      metadata: { name: draft.name.trim() || 'Codex', description: draft.description || undefined },
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
    setArenaDraft({ name: '', description: '', icon: '🏆', assetId: firstAsset });
    setIsCreatingArena(true);
  };

  const saveArena = () => {
    if (!activeCodex || !arenaDraft.name.trim() || !arenaDraft.assetId) return;
    const newArena: Arena = {
      id: crypto.randomUUID(),
      assetId: arenaDraft.assetId,
      name: arenaDraft.name.trim(),
      description: arenaDraft.description.trim(),
      icon: arenaDraft.icon || '🏆',
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
    setActionDraft(action || { arenaId, icon: '📝', duration: 60, repetitions: 1, actionType: 'Ação Recorrente', difficulty: 3 });
    setIsActionModalOpen(true);
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
      icon: actionDraft.icon || '📝',
      duration: actionDraft.duration || 60,
      repetitions,
      actionType,
      difficulty: actionDraft.difficulty || 3,
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
    if (confirm('Tem certeza que deseja excluir este Codex?')) {
        setCodexes(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleApplyCodex = () => {
    if (!activeCodex) return;
    if (!confirm('Deseja importar todas as arenas e ações deste Codex para o seu jogo?')) return;

    const arenaIdMap: Record<string, string> = {};

    activeCodex.arenas.forEach(arena => {
        // Tenta encontrar o asset correspondente ou usa 'geral' como fallback
        const targetAssetId = assets.find(a => a.id === arena.assetId)?.id || 'geral';
        
        const newArena = addArena(targetAssetId, {
            name: arena.name,
            description: arena.description,
            icon: arena.icon
        });
        arenaIdMap[arena.id] = newArena.id;
    });

    activeCodex.actions.forEach(action => {
        const realArenaId = arenaIdMap[action.arenaId];
        if (realArenaId) {
             const newAction = addAction({
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
                scheduleMultipleTasks(newAction.id, newAction.scheduledDays, newAction.scheduledStartTime);
            }
        }
    });

    alert('Codex importado com sucesso!');
    onClose();
  };

  const selectedArena = activeCodex?.arenas.find(a => a.id === selectedArenaId) || null;
  const selectedArenaActions = selectedArena ? actionsForArena(selectedArena.id) : [];
  const actionArena = activeCodex?.arenas.find(a => a.id === actionDraft.arenaId) || null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
        <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">CODEXES</div>
            <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
          </div>

          {!activeCodex ? (
            <>
              <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {codexes.map(codex => (
                  <button key={codex.id} onClick={() => openCodex(codex.id)} className="relative bg-black/30 border border-white/10 rounded-2xl p-3 text-left hover:border-[var(--gold)] transition-colors group">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">{codex.name}</div>
                    <div className="text-[11px] text-gray-500 line-clamp-2 mt-1">{codex.description || 'Sem descrição'}</div>
                    <div className="text-[10px] text-gray-400 mt-2">{codex.arenas.length} arenas • {codex.actions.length} ações</div>
                    <div onClick={(e) => handleDeleteCodex(codex.id, e)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-red-900/50 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2Icon className="w-3 h-3" />
                    </div>
                  </button>
                ))}
                <button onClick={createCodex} className="bg-black/30 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center text-center hover:border-[var(--gold)] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mb-2">
                    <PlusIcon className="w-5 h-5 text-[var(--gold)]" />
                  </div>
                  <div className="text-xs font-bold tracking-widest text-[var(--gold)]">NOVO CODEX</div>
                </button>
              </div>
            </>
          ) : (
            <div className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Codex</div>
                <button onClick={closeCodex} className="text-[10px] font-bold text-gray-400 hover:text-white">Voltar</button>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400">Título</label>
                <input
                  value={activeCodex.name}
                  onChange={e => updateCodex(activeCodex.id, draft => ({ ...draft, name: e.target.value, updatedAt: new Date().toISOString() }))}
                  className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--gold)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400">Descrição</label>
                <textarea
                  rows={2}
                  value={activeCodex.description}
                  onChange={e => updateCodex(activeCodex.id, draft => ({ ...draft, description: e.target.value, updatedAt: new Date().toISOString() }))}
                  className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--gold)]"
                />
              </div>

              <div className="bg-black border border-white/10 rounded-2xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Arenas</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowArchived(s => !s)} className={`p-2 rounded-full transition-colors ${showArchived ? 'bg-white/20 text-white' : 'text-gray-500'}`}>
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button onClick={openNewArena} className="px-3 py-2 rounded-xl luxe-gold-button text-xs">Adicionar arena</button>
                  </div>
                </div>

                {visibleArenas.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-4">Nenhuma arena no codex.</div>
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
                <button onClick={handleApplyCodex} className="w-full py-2 rounded-xl luxe-button-primary col-span-2 font-bold tracking-wider">IMPORTAR PARA O JOGO</button>
                <button onClick={handleCopyJson} className="w-full py-2 rounded-xl luxe-button-secondary text-xs">COPIAR CÓDIGO</button>
                <button onClick={handleCopyLink} className="w-full py-2 rounded-xl luxe-button-secondary text-xs">COPIAR LINK</button>
              </div>
              {status && <div className="text-center text-[10px] text-gray-500">{status}</div>}
            </div>
          )}
        </GlassCard>
      </div>

      {isCreatingArena && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center animate-fade-in" onClick={() => setIsCreatingArena(false)}>
          <GlassCard variant="silver" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <h2 className="text-lg font-bold uppercase tracking-wider">Nova Arena</h2>
            </div>
            <div className="space-y-2">
              <select value={arenaDraft.assetId} onChange={e => setArenaDraft(prev => ({ ...prev, assetId: e.target.value }))} className="w-full h-12 px-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--gold)]">
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.id === 'geral' ? 'OUTROS / SIDEQUEST' : asset.name}</option>
                ))}
              </select>
              <input type="text" placeholder="Nome da Arena" value={arenaDraft.name} onChange={e => setArenaDraft(prev => ({ ...prev, name: e.target.value }))} className="w-full h-12 px-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--gold)]" />
              <textarea placeholder="Descrição da Meta..." value={arenaDraft.description} onChange={e => setArenaDraft(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full p-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--gold)]" />
              <button onClick={() => { setIconTarget('arena'); setIsIconPickerOpen(true); }} className="w-full py-2 rounded-xl bg-black/30 border border-white/20 flex items-center justify-center text-2xl">{arenaDraft.icon}</button>
            </div>
            <div className="flex space-x-2 pt-2">
              <button onClick={() => setIsCreatingArena(false)} className="w-full py-2 rounded-xl luxe-button-secondary">CANCELAR</button>
              <button onClick={saveArena} className="w-full py-2 rounded-xl luxe-button-primary">CRIAR ARENA</button>
            </div>
          </GlassCard>
        </div>
      )}

      {selectedArena && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center animate-fade-in" onClick={() => setSelectedArenaId(null)}>
          <div className="dossier-bg border border-[color:var(--accent-silver-soft)] w-full max-w-sm m-4 space-y-3 rounded-2xl p-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">{selectedArena.name}</div>
              <button onClick={() => setSelectedArenaId(null)} className="px-4 py-2 text-sm font-bold rounded-xl luxe-gold-button">OK</button>
            </div>
            <div className="flex flex-col items-center text-center space-y-1">
              <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center">
                <span className="text-5xl">{selectedArena.icon}</span>
              </div>
              <p className="text-sm text-gray-500">{selectedArena.description || 'Sem descrição.'}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Ações</div>
              <button onClick={() => openActionModal(selectedArena.id)} className="px-3 py-2 rounded-xl luxe-gold-button text-xs">Nova ação</button>
            </div>
            {selectedArenaActions.length === 0 ? (
              <div className="text-center text-xs text-gray-500">Nenhuma ação ainda.</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {selectedArenaActions.map(action => (
                  <button key={action.id} onClick={() => openActionModal(selectedArena.id, action)} className="bg-black/30 border border-white/10 rounded-xl p-2 text-left">
                    <div className="text-2xl">{action.icon}</div>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={() => setIsActionModalOpen(false)}>
          <GlassCard variant="bronze" className="w-full max-w-sm m-4 rounded-2xl flex flex-col max-h-[90vh] p-3 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Nova Ação</div>
              <button onClick={() => setIsActionModalOpen(false)} className="px-4 py-2 text-sm font-bold rounded-xl luxe-gold-button">OK</button>
            </div>
            <button onClick={() => { setIconTarget('action'); setIsIconPickerOpen(true); }} className="w-24 h-24 bg-[#2a211c]/50 border border-[var(--accent-bronze)] rounded-xl hover:bg-[#2a211c] transition-colors flex items-center justify-center self-center">
              <span className="text-5xl">{actionDraft.icon || '📝'}</span>
            </button>
            <input type="text" placeholder="Nome da Ação" value={actionDraft.name || ''} onChange={e => setActionDraft(prev => ({ ...prev, name: e.target.value }))} className="w-full text-center bg-transparent text-xl font-bold text-white focus:outline-none border-b border-dashed border-white/20 py-1" />
            <textarea placeholder="Descrição (opcional)" value={actionDraft.description || ''} onChange={e => setActionDraft(prev => ({ ...prev, description: e.target.value }))} rows={2} className="w-full bg-black/20 rounded-xl px-3 py-2 text-sm text-white/90 focus:outline-none border border-white/10 focus:border-[var(--accent-bronze)]/50" />
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
            <div className="flex space-x-2 pt-2">
              <button onClick={() => setIsActionModalOpen(false)} className="w-full py-2 rounded-xl luxe-button-secondary">CANCELAR</button>
              <button onClick={saveAction} className="w-full py-2 rounded-xl luxe-button-primary">SALVAR AÇÃO</button>
            </div>
          </GlassCard>
        </div>
      )}

      {isIconPickerOpen && (
        <IconPickerModal
          onSelect={icon => {
            if (iconTarget === 'arena') setArenaDraft(prev => ({ ...prev, icon }));
            if (iconTarget === 'action') setActionDraft(prev => ({ ...prev, icon }));
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={() => setIsArenaPickerOpen(false)}>
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
                  {actionDraft.arenaId === arena.id && <CheckIcon className="w-5 h-5 text-[var(--gold)]" />}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
};
