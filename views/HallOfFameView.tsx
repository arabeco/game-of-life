import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { FeedEventCard } from '../components/FeedEventCard';
import { FeedEvent } from '../types';

type FeedFilter = 'Reino' | 'Grupo' | 'Aliados';

export const HallOfFameView: React.FC = () => {
    const { feed, userProfile, friends } = useGame();
    const [filter, setFilter] = useState<FeedFilter>('Reino');

    const friendIds = new Set(friends.map((friend) => friend.id));

    const filteredFeed = feed
        .filter((event: FeedEvent) => {
            if (filter === 'Reino') return true;
            if (filter === 'Aliados') {
                return friendIds.has(event.userId) || event.userId === userProfile.id;
            }
            if (filter === 'Grupo') {
                return friendIds.has(event.userId) || event.userId === userProfile.id;
            }
            return true;
        })
        .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-center rounded-2xl bg-black/20 p-1">
                {(['Reino', 'Grupo', 'Aliados'] as FeedFilter[]).map((entry) => (
                    <button
                        key={entry}
                        onClick={() => setFilter(entry)}
                        className={`w-full rounded-xl px-2 py-2 text-xs font-semibold transition-colors ${
                            filter === entry ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'
                        }`}
                    >
                        {entry}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filteredFeed.length > 0 ? (
                    filteredFeed.map((event) => <FeedEventCard key={event.id} event={event} />)
                ) : (
                    <div className="py-10 text-center text-gray-500">
                        <p>Nenhuma atividade no feed de {filter}.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
