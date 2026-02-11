
import React, { useState, useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from '../components/GlassCard';
import { CreateClanModal } from '../components/CreateClanModal';
import { Clan, UserProfile } from '../types';
import { ClanDetailModal } from '../components/ClanDetailModal';
import { SocialCard } from '../components/SocialCard';
import { PlusIcon, ChevronDownIcon } from '../components/Icons';
import { ClanSearchResultCard } from '../components/ClanSearchResultCard';

const JoinClanBox: React.FC<{onCreate: () => void}> = ({ onCreate }) => {
    return (
        <GlassCard variant="neutral" className="text-center p-6 space-y-4">
            <h2 className="text-xl font-bold">Você não está em um clã</h2>
            <p className="text-sm text-gray-400">Junte-se a um clã para participar de missões ou funde o seu próprio para começar uma nova dinastia.</p>
            <div className="flex space-x-2">
                <button className="w-full py-2 rounded-xl luxe-button-secondary disabled:opacity-50" disabled>Procurar Clã</button>
                <button onClick={onCreate} className="w-full py-2 rounded-xl luxe-button-primary">Fundar Clã</button>
            </div>
        </GlassCard>
    );
};

const ClanInfoBox: React.FC<{onClick: () => void}> = ({ onClick }) => {
    const { clan, clanRanks } = useGame();
    
    if (!clan) return null;

    const currentRank = clanRanks.find(r => r.id === clan.rankId);
    const nextRankIndex = clanRanks.findIndex(r => r.id === clan.rankId) + 1;
    const nextRank = clanRanks[nextRankIndex];
    const expForCurrentRank = currentRank?.expRequired || 0;
    const expForNextRank = nextRank?.expRequired || expForCurrentRank;
    const progressInRank = clan.exp - expForCurrentRank;
    const expToNextRank = expForNextRank - expForCurrentRank;
    const progressPercentage = expToNextRank > 0 ? (progressInRank / expToNextRank) * 100 : 100;

    return (
        <GlassCard variant="gold" className="p-4 space-y-2 text-center transition-all">
            <button onClick={onClick} className="w-full text-left space-y-2">
                <div className="flex items-center justify-center space-x-2">
                    <span className="text-3xl">{clan.icon}</span>
                    <div>
                        <p className="text-sm uppercase tracking-wider">{clan.name}</p>
                        <h2 className="text-2xl font-black" style={{ color: 'var(--gold)' }}>{currentRank?.name || 'N/A'}</h2>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] font-bold">
                        <span>{progressInRank.toLocaleString('pt-BR')} EXP</span>
                        <span>{nextRank ? `${(expToNextRank - progressInRank).toLocaleString('pt-BR')} para ${nextRank.name}` : 'Nível Máximo'}</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2 mt-1">
                        <div
                            className="bg-[var(--gold)] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>
            </button>
        </GlassCard>
    );
};

const SocialSearch: React.FC<{ onSearchResults: (results: { friends: UserProfile[], clans: Clan[] }) => void }> = ({ onSearchResults }) => {
    const { addFriend, searchClans, friends } = useGame();
    const [query, setQuery] = useState('');

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);

        if (newQuery.trim() === '') {
            onSearchResults({ friends: [], clans: [] });
            return;
        }

        const foundClans = await searchClans(newQuery);
        const foundFriends = friends.filter(f => f.nickname.toLowerCase().includes(newQuery.toLowerCase()));

        onSearchResults({ friends: foundFriends, clans: foundClans });
    };

    const handleAdd = () => {
        if (query.trim()) {
            addFriend(query.trim());
            setQuery('');
            onSearchResults({ friends: [], clans: [] });
        }
    };

    return (
        <div className="flex space-x-2">
            <input 
                type="text" 
                placeholder="Buscar Aliados ou Clãs..." 
                value={query}
                onChange={handleSearch}
                className="w-full px-4 py-3 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--gold)] transition-colors placeholder-gray-500 text-sm"
            />
            <button onClick={handleAdd} className="p-3 rounded-xl bg-black/30 border border-[var(--glass-border)] hover:border-[var(--gold)] transition-colors">
                <PlusIcon className="w-5 h-5"/>
            </button>
        </div>
    );
};

export const SocialView: React.FC = () => {
    const { clan, friends, joinClan } = useGame();
    const [modal, setModal] = useState<'create' | 'sanctuary' | null>(null);
    const [searchResults, setSearchResults] = useState<{ friends: UserProfile[], clans: Clan[] }>({ friends: [], clans: [] });

    const handleJoinClan = async (clanToJoin: Clan) => {
        await joinClan(clanToJoin);
        setSearchResults({ friends: [], clans: [] }); // Clear search results after joining
    }

    if (!clan) {
        return (
            <div className="p-4 space-y-4">
                <JoinClanBox onCreate={() => setModal('create')} />
                <div className="space-y-4">
                    <h3 className="text-center font-bold uppercase tracking-wider text-sm text-gray-400">Explorar</h3>
                    <SocialSearch onSearchResults={setSearchResults} />
                    {searchResults.clans.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500">CLÃS ENCONTRADOS</h4>
                            {searchResults.clans.map(c => <ClanSearchResultCard key={c.id} clan={c} onJoin={() => handleJoinClan(c)} />)}
                        </div>
                    )}
                </div>
                {modal === 'create' && <CreateClanModal onClose={() => setModal(null)} />}
            </div>
        );
    }

    const showSearchResults = searchResults.friends.length > 0 || searchResults.clans.length > 0;

    return (
        <>
            <div className="p-4 space-y-6">
                <ClanInfoBox onClick={() => setModal('sanctuary')} />
                
                <div className="space-y-4">
                    <h3 className="text-center font-bold uppercase tracking-wider text-sm text-gray-400">Aliados e Clãs</h3>
                    <SocialSearch onSearchResults={setSearchResults} />
                    
                    {showSearchResults ? (
                         <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                            {searchResults.clans.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-gray-500">CLÃS ENCONTRADOS</h4>
                                    {searchResults.clans.map(c => <ClanSearchResultCard key={c.id} clan={c} onJoin={() => {}} />)}
                                </div>
                            )}
                            {searchResults.friends.length > 0 && (
                                 <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-gray-500">ALIADOS ENCONTRADOS</h4>
                                    {searchResults.friends.map(friend => <SocialCard key={friend.id} profile={friend} />)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                            {friends.map(friend => (
                                <SocialCard key={friend.id} profile={friend} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {modal === 'create' && <CreateClanModal onClose={() => setModal(null)} />}
            {modal === 'sanctuary' && <ClanDetailModal clanName={clan.name} onClose={() => setModal(null)} />}
        </>
    );
};
