import React, { createContext, useContext, useMemo, useState } from 'react';
import { ASSETS_DATA } from '../constants';
import type { Action, Arena, Asset } from '../types';
import type { GameContextType } from './GameContext';

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
    actionType?: Exclude<Action['actionType'], 'Marco'>;
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

const deepCopyAssets = (): Asset[] => JSON.parse(JSON.stringify(ASSETS_DATA)) as Asset[];

const createArena = (assetId: string, arenaData: Pick<Arena, 'name' | 'description' | 'icon'>): Arena => ({
  id: crypto.randomUUID(),
  assetId,
  name: arenaData.name,
  description: arenaData.description ?? '',
  icon: arenaData.icon,
  actionIds: [],
  isArchived: false,
});

const createActionId = () => `action_${crypto.randomUUID().slice(0, 8)}`;

type CodexBuilderContextType = {
  isBuilderMode: boolean;
  draftName: string;
  setDraftName: (value: string) => void;
  enterBuilderMode: (initialName?: string) => void;
  exitBuilderMode: () => void;
  packDraftToJson: () => string;
  gameOverrides: Pick<
    GameContextType,
    | 'assets'
    | 'actions'
    | 'tasks'
    | 'taskPool'
    | 'getArenas'
    | 'getActionsForArena'
    | 'getAssetForAction'
    | 'addArena'
    | 'updateArena'
    | 'deleteArena'
    | 'addAction'
    | 'updateAction'
    | 'deleteAction'
    | 'scheduleTask'
    | 'scheduleMultipleTasks'
    | 'scheduleAndCompleteNow'
    | 'scheduleAndCompleteMilestoneNow'
  >;
};

const CodexBuilderContext = createContext<CodexBuilderContextType | undefined>(undefined);

export const CodexBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBuilderMode, setBuilderMode] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftArenas, setDraftArenas] = useState<Arena[]>([]);
  const [draftActions, setDraftActions] = useState<Action[]>([]);

  const draftAssets = useMemo(() => {
    const base = deepCopyAssets();
    const arenasByAsset = new Map<string, Arena[]>();

    for (const arena of draftArenas) {
      const list = arenasByAsset.get(arena.assetId) ?? [];
      list.push(arena);
      arenasByAsset.set(arena.assetId, list);
    }

    return base.map(asset => ({
      ...asset,
      arenas: arenasByAsset.get(asset.id) ?? [],
    }));
  }, [draftArenas]);

  const enterBuilderMode = (initialName?: string) => {
    setDraftArenas([]);
    setDraftActions([]);
    setDraftName(initialName?.trim() ? initialName.trim() : 'Novo Codex');
    setBuilderMode(true);
  };

  const exitBuilderMode = () => {
    setBuilderMode(false);
    setDraftArenas([]);
    setDraftActions([]);
    setDraftName('');
  };

  const packDraftToJson = () => {
    const arenas = draftArenas.map(a => ({
      name: a.name,
      description: a.description || undefined,
      icon: a.icon || undefined,
      tags: a.tags && a.tags.length > 0 ? a.tags : undefined,
    }));

    const arenaIdToName = new Map(draftArenas.map(a => [a.id, a.name] as const));

    const actions = draftActions
      .filter(a => a.actionType !== 'Marco')
      .map(a => ({
        arenaName: arenaIdToName.get(a.arenaId) ?? 'Sem Arena',
        name: a.name,
        description: a.description || undefined,
        icon: a.icon || undefined,
        duration: a.duration,
        repetitions: a.repetitions,
        difficulty: a.difficulty,
        actionType: a.actionType === 'Compromisso' ? 'Compromisso' : 'Ação Recorrente',
      }));

    const milestones = draftActions
      .filter(a => a.actionType === 'Marco')
      .map(a => ({
        arenaName: arenaIdToName.get(a.arenaId) ?? 'Sem Arena',
        name: a.name,
        description: a.description || undefined,
        icon: a.icon || undefined,
        duration: a.duration,
        difficulty: a.difficulty,
      }));

    const template: CodexTemplate = {
      schemaVersion: 1,
      metadata: {
        name: draftName.trim() || 'Codex',
      },
      arenas,
      actions,
      milestones,
    };

    return JSON.stringify(template, null, 2);
  };

  const addArena: GameContextType['addArena'] = async (assetId, arenaData) => {
    // In Builder Mode, we create a temporary arena object
    // We mock the properties that would usually come from DB or be auto-generated
    const extendedArenaData = arenaData as Omit<Arena, 'id' | 'assetId' | 'actionIds'>;
    const newArena: Arena = {
        id: crypto.randomUUID(),
        assetId: assetId,
        name: extendedArenaData.name,
        description: extendedArenaData.description || '',
        icon: extendedArenaData.icon || '⚔️',
        actionIds: [],
        folderId: extendedArenaData.folderId,
        originCodexId: extendedArenaData.originCodexId,
        codexLevel: extendedArenaData.codexLevel,
        isArchived: false,
        priority: 'media',
        order: draftArenas.length, // Append to end
        priorityOrder: 0
    };
    
    setDraftArenas(prev => [...prev, newArena]);
    return newArena;
  };

  const updateArena: GameContextType['updateArena'] = async (arenaId, arenaData) => {
     setDraftArenas(prev => prev.map(a => a.id === arenaId ? { ...a, ...arenaData } : a));
  };

  const deleteArena: GameContextType['deleteArena'] = async (arenaId) => {
    setDraftArenas(prev => prev.filter(a => a.id !== arenaId));
    // Also remove actions associated with this arena
    setDraftActions(prev => prev.filter(a => a.arenaId !== arenaId));
  };

  const addAction: GameContextType['addAction'] = async (actionData: any) => {
    const newAction: Action = {
      id: crypto.randomUUID(),
      arenaId: actionData.arenaId,
      name: actionData.name,
      description: actionData.description,
      icon: actionData.icon,
      duration: actionData.duration || 15,
      repetitions: actionData.repetitions || 1,
      actionType: actionData.actionType || 'Ação Recorrente',
      difficulty: actionData.difficulty || 1,
      scheduledDays: actionData.scheduledDays,
      scheduledStartTime: actionData.scheduledStartTime,
      originCodexId: actionData.originCodexId
    };

    setDraftActions(prev => [...prev, newAction]);
    return newAction;
  };

  const updateAction: GameContextType['updateAction'] = async (actionId, actionData) => {
    setDraftActions(prev => prev.map(a => a.id === actionId ? { ...a, ...actionData } : a));
  };

  const deleteAction: GameContextType['deleteAction'] = async (actionId) => {
    setDraftActions(prev => prev.filter(a => a.id !== actionId));
  };

  const getArenas: GameContextType['getArenas'] = () => draftArenas;
  const getActionsForArena: GameContextType['getActionsForArena'] = (arenaId) => draftActions.filter(a => a.arenaId === arenaId);
  const getAssetForAction: GameContextType['getAssetForAction'] = (actionId) => {
    const action = draftActions.find(a => a.id === actionId);
    if (!action) return undefined;
    const arena = draftArenas.find(a => a.id === action.arenaId);
    if (!arena) return undefined;
    return draftAssets.find(a => a.id === arena.assetId);
  };

  const gameOverrides: CodexBuilderContextType['gameOverrides'] = {
    assets: draftAssets,
    actions: draftActions,
    tasks: [],
    taskPool: [],
    getArenas,
    getActionsForArena,
    getAssetForAction,
    addArena,
    updateArena,
    deleteArena,
    addAction,
    updateAction,
    deleteAction,
    scheduleTask: () => Promise.resolve(undefined),
    scheduleMultipleTasks: () => Promise.resolve(undefined),
    scheduleAndCompleteNow: () => undefined,
    scheduleAndCompleteMilestoneNow: () => undefined,
  };

  return (
    <CodexBuilderContext.Provider value={{ isBuilderMode, draftName, setDraftName, enterBuilderMode, exitBuilderMode, packDraftToJson, gameOverrides }}>
      {children}
    </CodexBuilderContext.Provider>
  );
};

export const useCodexBuilder = () => {
  const context = useContext(CodexBuilderContext);
  if (!context) {
      // Return a dummy context if used outside provider, to allow graceful degradation in GameContext
      return {
          isBuilderMode: false,
          draftName: '',
          setDraftName: () => {},
          enterBuilderMode: () => {},
          exitBuilderMode: () => {},
          packDraftToJson: () => '',
          gameOverrides: {} as any
      };
  }
  return context;
};


