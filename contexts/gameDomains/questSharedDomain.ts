import { useEffect, useState } from 'react';
import type { Action, Arena, Asset, Clan, SeasonQuest } from '../../types';
import { normalizeDomainLabel } from '../../utils/taskDomain.js';
import { PRODUCT_FEATURES } from '../../constants/featureFlags';

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
    /** acao -> missao de cla, vindo da participacao no servidor (o unico elo). */
    acaoParaMissaoDoCla?: Record<string, string>;
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
    acaoParaMissaoDoCla = {},
}: UseQuestSharedDomainParams): QuestSharedDomainApi => {
    const normalizeQuestLabel = (value?: string) => normalizeDomainLabel(value);

    const getClanQuestForActionName = (actionName?: string): SeasonQuest | null => {
        // So o legado (prioridade do lider). A missao de cla DA TEMPORADA e achada
        // pela acao da participacao, nunca pelo nome: uma "Socializar" pessoal
        // continua pessoal (revisao final de 12/10/2026).
        if (!PRODUCT_FEATURES.clanMissions) return null;
        if (!actionName) return null;
        const normalized = normalizeQuestLabel(actionName);
        const direct = seasonQuests.find(quest => quest.type === 'clan' && normalizeQuestLabel(quest.actionTemplate?.name) === normalized);
        if (direct) return direct;

        const byTitle = seasonQuests.find(quest => quest.type === 'clan' && normalizeQuestLabel(quest.title) === normalized);
        if (byTitle) return byTitle;

        return null;
    };

    const missaoDaParticipacao = (action: Action) => {
        const questId = acaoParaMissaoDoCla[action.id];
        return questId ? seasonQuests.find(quest => quest.id === questId) || null : null;
    };

    const getClanQuestsForArena = (arena: Arena, arenaActions: Action[]) => {
        const map = new Map<string, SeasonQuest>();
        arenaActions.forEach(action => {
            const quest = acaoParaMissaoDoCla[action.id] ? missaoDaParticipacao(action) : null;
            if (quest) map.set(quest.id, quest);
        });
        if (!PRODUCT_FEATURES.clanMissions) return Array.from(map.values());

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
        return missaoDaParticipacao(action) || getClanQuestForActionName(action.name);
    };

    const [sharedActionCompletions, setSharedActionCompletions] = useState<Record<string, Record<string, number>>>(() => ({}));

    useEffect(() => {
        const userId = getSupabaseUserId();
        if (!userId) return;

        const hydrateSharedCompletions = () => {
            supabase.from('shared_action_completions')
                .select('arena_id,action_id')
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
        if (!PRODUCT_FEATURES.clanSharedActions) return null;
        if (clan?.clanType !== 'Office') return null;

        const officeArenaPrefix = 'Clan Office';
        const officeArenaName = `${officeArenaPrefix} - ${clan.name}`;
        const existing = getArenas().find(arena => !arena.isArchived && arena.name.startsWith(officeArenaPrefix) && arena.name.includes(clan.name));
        if (existing) return existing;

        const targetAssetId = assets[0]?.id || 'outros';
        const newArena = await addArena(targetAssetId, {
            name: officeArenaName,
            description: `Arena automatica do clã ${clan.name} (Office Mode)`,
            icon: 'O',
        } as any);
        showToast('Arena Office criada automaticamente!', 'success');
        return newArena;
    };

    const cleanupEmptyOfficeArena = (arenaId: string) => {
        if (!PRODUCT_FEATURES.clanSharedActions) return;
        if (clan?.clanType !== 'Office') return;

        const arena = getArenas().find(item => item.id === arenaId);
        if (!arena || !arena.name.startsWith('Clan Office')) return;

        const remaining = getActionsForArena(arenaId);
        if (remaining.length === 0) {
            updateArena(arenaId, { isArchived: true });
            showToast('Arena Office arquivada (sem ações).', 'info');
        }
    };

    const setArenaAsShared = (arenaId: string, isShared: boolean) => {
        if (!PRODUCT_FEATURES.clanSharedActions) return;
        updateArena(arenaId, { description: isShared ? '[SHARED]' : '' } as any);
        if (isShared) {
            showToast('Arena marcada como compartilhada para o clã!', 'success');
        }
    };

    const updateCustomClanMissionProgress = async (missionId: string, increment: number) => {
        if (!PRODUCT_FEATURES.clanMissions) return;
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
