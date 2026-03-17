import { useEffect, useState } from 'react';
import type { Action, Arena, Asset, Clan, SeasonQuest } from '../../types';
import { normalizeDomainLabel } from '../../utils/taskDomain.js';

type ToastTone = 'success' | 'error' | 'info';
type SupabaseLike = {
    from: (table: string) => any;
    channel: (name: string) => any;
    removeChannel: (channel: any) => any;
    rpc: (fn: string, params: Record<string, any>) => any;
};

interface UseQuestSharedDomainParams {
    seasonQuests: SeasonQuest[];
    sessionUserId?: string;
    supabase: SupabaseLike;
    getSupabaseUserId: () => string | null | undefined;
    clan: Clan | null;
    assets: Asset[];
    getArenas: () => Arena[];
    getActionsForArena: (arenaId: string) => Action[];
    addArena: (assetId: string, arenaData: Omit<Arena, 'id' | 'assetId' | 'actionIds'>, skipDb?: boolean) => Promise<Arena>;
    updateArena: (arenaId: string, arenaData: Partial<Pick<Arena, 'assetId' | 'name' | 'description' | 'icon' | 'folderId' | 'isArchived' | 'priority'>>) => void;
    showToast: (message: string, tone: ToastTone) => void;
}

export interface QuestSharedDomainApi {
    getClanQuestForActionName: (actionName?: string) => SeasonQuest | null;
    getClanQuestsForArena: (arena: Arena, arenaActions: Action[]) => SeasonQuest[];
    getClanQuestForAction: (action: Action | undefined) => SeasonQuest | null;
    getSharedActionPoolProgress: (arenaId: string, actionId: string) => number;
    getOrCreateOfficeArena: () => Promise<Arena | null>;
    cleanupEmptyOfficeArena: (arenaId: string) => void;
    setArenaAsShared: (arenaId: string, isShared: boolean) => void;
    updateCustomClanMissionProgress: (missionId: string, increment: number) => Promise<void>;
}

export const useQuestSharedDomain = ({
    seasonQuests,
    sessionUserId,
    supabase,
    getSupabaseUserId,
    clan,
    assets,
    getArenas,
    getActionsForArena,
    addArena,
    updateArena,
    showToast,
}: UseQuestSharedDomainParams): QuestSharedDomainApi => {
    const normalizeQuestLabel = (value?: string) => normalizeDomainLabel(value);

    const getClanQuestForActionName = (actionName?: string): SeasonQuest | null => {
        if (!actionName) return null;
        const normalized = normalizeQuestLabel(actionName);
        const direct = seasonQuests.find(quest => quest.type === 'clan' && normalizeQuestLabel(quest.actionTemplate?.name) === normalized);
        if (direct) return direct;

        const byTitle = seasonQuests.find(quest => quest.type === 'clan' && normalizeQuestLabel(quest.title) === normalized);
        if (byTitle) return byTitle;

        return null;
    };

    const getClanQuestsForArena = (arena: Arena, arenaActions: Action[]) => {
        const map = new Map<string, SeasonQuest>();
        const byArenaName = seasonQuests.find(quest => quest.type === 'clan' && normalizeQuestLabel(quest.title) === normalizeQuestLabel(arena.name));
        if (byArenaName) {
            map.set(byArenaName.id, byArenaName);
        }

        arenaActions.forEach(action => {
            const quest = getClanQuestForActionName(action.name);
            if (quest) {
                map.set(quest.id, quest);
            }
        });

        return Array.from(map.values());
    };

    const getClanQuestForAction = (action: Action | undefined) => {
        if (!action) return null;
        return getClanQuestForActionName(action.name);
    };

    const [sharedActionCompletions, setSharedActionCompletions] = useState<Record<string, Record<string, number>>>(() => ({}));

    useEffect(() => {
        const userId = getSupabaseUserId();
        if (!userId) return;

        const hydrateSharedCompletions = () => {
            supabase.from('shared_action_completions')
                .select('*')
                .then(({ data }: { data?: any[] }) => {
                    if (!data) return;

                    const next: Record<string, Record<string, number>> = {};
                    data.forEach(comp => {
                        if (!next[comp.arena_id]) next[comp.arena_id] = {};
                        next[comp.arena_id][comp.action_id] = (next[comp.arena_id][comp.action_id] || 0) + 1;
                    });
                    setSharedActionCompletions(next);
                });
        };

        hydrateSharedCompletions();

        const channel = supabase.channel('shared_completions_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_action_completions' }, () => {
                hydrateSharedCompletions();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionUserId, supabase]);

    const getSharedActionPoolProgress = (arenaId: string, actionId: string) => {
        return sharedActionCompletions[arenaId]?.[actionId] || 0;
    };

    const getOrCreateOfficeArena = async (): Promise<Arena | null> => {
        if (clan?.clanType !== 'Office') return null;

        const officeArenaPrefix = 'Clan Office';
        const officeArenaName = `${officeArenaPrefix} - ${clan.name}`;
        const existing = getArenas().find(arena => !arena.isArchived && arena.name.startsWith(officeArenaPrefix) && arena.name.includes(clan.name));
        if (existing) return existing;

        const targetAssetId = assets[0]?.id || 'outros';
        const newArena = await addArena(targetAssetId, {
            name: officeArenaName,
            description: `Arena automatica do cla ${clan.name} (Office Mode)`,
            icon: 'O',
        } as any);
        showToast('Arena Office criada automaticamente!', 'success');
        return newArena;
    };

    const cleanupEmptyOfficeArena = (arenaId: string) => {
        if (clan?.clanType !== 'Office') return;

        const arena = getArenas().find(item => item.id === arenaId);
        if (!arena || !arena.name.startsWith('Clan Office')) return;

        const remaining = getActionsForArena(arenaId);
        if (remaining.length === 0) {
            updateArena(arenaId, { isArchived: true });
            showToast('Arena Office arquivada (sem acoes).', 'info');
        }
    };

    const setArenaAsShared = (arenaId: string, isShared: boolean) => {
        updateArena(arenaId, { description: isShared ? '[SHARED]' : '' } as any);
        if (isShared) {
            showToast('Arena marcada como compartilhada para o cla!', 'success');
        }
    };

    const updateCustomClanMissionProgress = async (missionId: string, increment: number) => {
        const { data, error } = await supabase.rpc('update_clan_mission_progress', {
            p_mission_id: missionId,
            p_increment: increment,
        });

        if (error) {
            console.error('Error updating clan mission progress:', error);
            return;
        }

        console.log('Clan mission progress updated:', data);
    };

    return {
        getClanQuestForActionName,
        getClanQuestsForArena,
        getClanQuestForAction,
        getSharedActionPoolProgress,
        getOrCreateOfficeArena,
        cleanupEmptyOfficeArena,
        setArenaAsShared,
        updateCustomClanMissionProgress,
    };
};
