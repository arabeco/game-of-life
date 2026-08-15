import React, { useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { FeedEventCard } from '../components/FeedEventCard';
import { FeedEvent, FeedEventType } from '../types';

type FeedFilter = 'Reino' | 'Grupo' | 'Aliados';

const sectionLabelByType: Partial<Record<FeedEventType, string>> = {
    MILESTONE_COMPLETED: 'Marcos',
    CYCLE_COMPLETED: 'Marcos',
    PLAYER_RANK_UP: 'Ascensoes',
    CLAN_RANK_UP: 'Ascensoes',
    ARENA_COMPLETED: 'Avancos',
    LEVEL_UP: 'Avancos',
    QUEST_COMPLETED: 'Avancos',
    REPORT_COMPLETED: 'Relatos',
};

const formatFeedDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
    });
};

export const HallOfFameView: React.FC = () => {
    const { feed, userProfile, friends } = useGame();
    const [filter, setFilter] = useState<FeedFilter>('Reino');

    const friendIds = useMemo(() => new Set(friends.map((friend) => friend.id)), [friends]);

    const filteredFeed = useMemo(() => {
        return [...feed]
            .filter((event: FeedEvent) => {
                if (filter === 'Reino') return true;
                if (filter === 'Aliados') {
                    return friendIds.has(event.userId) || event.userId === userProfile.id;
                }
                if (filter === 'Grupo') {
                    const isSameClan = Boolean(
                        userProfile.clan &&
                            (event.authorClanName === userProfile.clan.name ||
                                friends.some((friend) => friend.id === event.userId && friend.clanName === userProfile.clan?.name))
                    );
                    return isSameClan || event.userId === userProfile.id;
                }
                return true;
            })
            .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
    }, [feed, filter, friendIds, friends, userProfile.clan, userProfile.id]);

    const groupedFeed = useMemo(() => {
        const groups = new Map<string, FeedEvent[]>();
        filteredFeed.forEach((event) => {
            const bucket = `${formatFeedDate(event.timestamp)} · ${sectionLabelByType[event.type] || 'Movimento'}`;
            const existing = groups.get(bucket);
            if (existing) {
                existing.push(event);
            } else {
                groups.set(bucket, [event]);
            }
        });
        return Array.from(groups.entries());
    }, [filteredFeed]);

    return (
        <div className="space-y-4">
            <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Sinais do reino</h2>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-right">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">Eventos</p>
                        <p className="text-lg font-semibold text-white">{filteredFeed.length}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center rounded-2xl bg-black/20 p-1">
                {(['Reino', 'Grupo', 'Aliados'] as FeedFilter[]).map((entry) => (
                    <button
                        key={entry}
                        onClick={() => setFilter(entry)}
                        className={`w-full rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                            filter === entry ? 'bg-white/10 text-white shadow-[0_10px_25px_rgba(0,0,0,0.18)]' : 'text-gray-400 hover:bg-white/5'
                        }`}
                    >
                        {entry}
                    </button>
                ))}
            </div>

            <div className="space-y-5">
                {groupedFeed.length > 0 ? (
                    groupedFeed.map(([bucket, events]) => (
                        <section key={bucket} className="space-y-3">
                            <div className="flex items-center gap-3 px-1">
                                <div className="h-px flex-1 bg-white/10" />
                                <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">{bucket}</p>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>
                            <div className="space-y-3">
                                {events.map((event) => (
                                    <FeedEventCard key={event.id} event={event} />
                                ))}
                            </div>
                        </section>
                    ))
                ) : (
                    <div className="rounded-[26px] border border-dashed border-white/12 bg-black/15 px-6 py-12 text-center">
                        <p className="text-sm font-medium text-white/75">Nada apareceu neste recorte ainda.</p>
                        <p className="mt-2 text-sm text-white/45">Quando o reino voltar a se mover, os sinais surgem aqui.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
