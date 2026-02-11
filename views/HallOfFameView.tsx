import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { FeedEventCard } from '../components/FeedEventCard';
import { FeedEvent } from '../types';

type FeedFilter = 'Reino' | 'Clã' | 'Aliados';

export const HallOfFameView: React.FC = () => {
    const { feed, userProfile, friends } = useGame();
    const [filter, setFilter] = useState<FeedFilter>('Reino');

    const friendIds = new Set(friends.map(f => f.id));

    const filteredFeed = feed.filter((event: FeedEvent) => {
        if (filter === 'Reino') return true;
        if (filter === 'Aliados') {
            return friendIds.has(event.userId) || event.userId === userProfile.id;
        }
        if (filter === 'Clã') {
            // This needs clan member data. For now, assume friends are clanmates.
            return friendIds.has(event.userId) || event.userId === userProfile.id;
        }
        return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-center bg-black/20 p-1 rounded-2xl">
                {(['Reino', 'Clã', 'Aliados'] as FeedFilter[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`w-full px-2 py-2 text-xs font-semibold rounded-xl transition-colors ${
                            filter === f ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>
            <div className="space-y-3">
                {filteredFeed.length > 0 ? (
                    filteredFeed.map(event => <FeedEventCard key={event.id} event={event} />)
                ) : (
                    <div className="text-center text-gray-500 py-10">
                        <p>Nenhuma atividade no feed de {filter}.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
