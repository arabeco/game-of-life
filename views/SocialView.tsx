
import React, { useState, useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from '../components/GlassCard';
import { CreateClanModal } from '../components/CreateClanModal';
import { Clan, UserProfile } from '../types';
import { ClanDetailModal } from '../components/ClanDetailModal';
import { SocialCard } from '../components/SocialCard';
import { PlusIcon, CheckIcon, XIcon } from '../components/Icons';
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

const SocialSearch: React.FC<{ onSearchResults: (results: { players: UserProfile[], clans: Clan[] }) => void }> = ({ onSearchResults }) => {
    const { searchClans, searchPlayers, sendFriendRequest } = useGame();
    const [query, setQuery] = useState('');

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);

        if (newQuery.trim() === '') {
            onSearchResults({ players: [], clans: [] });
            return;
        }

        const [foundClans, foundPlayers] = await Promise.all([
            searchClans(newQuery),
            searchPlayers(newQuery),
        ]);

        onSearchResults({ players: foundPlayers, clans: foundClans });
    };

    const handleAdd = async () => {
        if (!query.trim()) return;
        const matches = await searchPlayers(query.trim());
        const exact = matches.find(player => player.nickname.toLowerCase() === query.trim().toLowerCase()) || matches[0];
        if (exact) await sendFriendRequest(exact.id);
        setQuery('');
        onSearchResults({ players: [], clans: [] });
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
    const { clan, friends, friendRequestsIncoming, friendRequestsOutgoing, joinClan, sendFriendRequest, acceptFriendRequest, declineFriendRequest } = useGame();
    const [modal, setModal] = useState<'create' | 'sanctuary' | null>(null);
    const [searchResults, setSearchResults] = useState<{ players: UserProfile[], clans: Clan[] }>({ players: [], clans: [] });
    const [activeTab, setActiveTab] = useState<'aliados' | 'solicitacoes'>('aliados');

    const buildFallbackProfile = (id: string): UserProfile => ({
        id,
        nickname: 'Soberano',
        level: 1,
        avatarUrl: '',
        border: 'default',
        backgroundUrl: '',
        isOnline: false,
        visibleWidgets: [],
        skin: 'default',
        nobility: { exp: 0, rankId: 'vagante' },
        mood: 50,
        role: 'user',
    });

    const handleJoinClan = async (clanToJoin: Clan) => {
        await joinClan(clanToJoin);
        setSearchResults({ players: [], clans: [] });
    }

    const showSearchResults = searchResults.players.length > 0 || searchResults.clans.length > 0;

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
                    {searchResults.players.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500">ALIADOS ENCONTRADOS</h4>
                            {searchResults.players.map(player => {
                                const isFriend = friends.some(friend => friend.id === player.id);
                                const isOutgoing = friendRequestsOutgoing.some(request => request.recipientId === player.id);
                                const isIncoming = friendRequestsIncoming.some(request => request.senderId === player.id);
                                const isDisabled = isFriend || isOutgoing || isIncoming;
                                const label = isFriend ? 'Aliado' : isOutgoing ? 'Enviado' : isIncoming ? 'Convite' : 'Adicionar';

                                return (
                                    <SocialCard
                                        key={player.id}
                                        profile={player}
                                        actions={
                                            <button
                                                onClick={() => sendFriendRequest(player.id)}
                                                disabled={isDisabled}
                                                className="px-3 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 disabled:bg-black/20 disabled:text-gray-500 disabled:cursor-not-allowed"
                                            >
                                                {label}
                                            </button>
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('aliados')}
                            className={`w-full py-2 rounded-xl text-xs font-bold ${activeTab === 'aliados' ? 'luxe-button-primary' : 'luxe-button-secondary'}`}
                        >
                            Aliados
                        </button>
                        <button
                            onClick={() => setActiveTab('solicitacoes')}
                            className={`w-full py-2 rounded-xl text-xs font-bold ${activeTab === 'solicitacoes' ? 'luxe-button-primary' : 'luxe-button-secondary'}`}
                        >
                            Solicitações {friendRequestsIncoming.length > 0 ? `(${friendRequestsIncoming.length})` : ''}
                        </button>
                    </div>
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                        {activeTab === 'aliados' && friends.map(friend => (
                            <SocialCard key={friend.id} profile={friend} />
                        ))}
                        {activeTab === 'solicitacoes' && (
                            <div className="space-y-4">
                                {friendRequestsIncoming.length === 0 && friendRequestsOutgoing.length === 0 && (
                                    <div className="text-center text-xs text-gray-500">Nenhuma solicitação pendente.</div>
                                )}
                                {friendRequestsIncoming.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-bold text-gray-500">RECEBIDAS</div>
                                        {friendRequestsIncoming.map(request => {
                                            const senderProfile = request.senderProfile || buildFallbackProfile(request.senderId);
                                            return (
                                                <SocialCard
                                                    key={request.id}
                                                    profile={senderProfile}
                                                    subtitle="Convite de amizade"
                                                    actions={
                                                        <>
                                                            <button
                                                                onClick={() => declineFriendRequest(request.id)}
                                                                className="p-2 rounded-xl bg-black/40 border border-white/10 hover:border-red-400/60 text-red-300"
                                                            >
                                                                <XIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => acceptFriendRequest(request.id)}
                                                                className="p-2 rounded-xl bg-black/40 border border-white/10 hover:border-green-400/60 text-green-300"
                                                            >
                                                                <CheckIcon className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                                {friendRequestsOutgoing.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-bold text-gray-500">ENVIADAS</div>
                                        {friendRequestsOutgoing.map(request => {
                                            const recipientProfile = request.recipientProfile || buildFallbackProfile(request.recipientId);
                                            return (
                                                <SocialCard
                                                    key={request.id}
                                                    profile={recipientProfile}
                                                    subtitle="Solicitação enviada"
                                                    actions={
                                                        <span className="px-3 py-2 text-[10px] font-bold rounded-xl bg-black/30 border border-white/10 text-gray-400">Enviado</span>
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {modal === 'create' && <CreateClanModal onClose={() => setModal(null)} />}
            </div>
        );
    }

    return (
        <>
            <div className="p-4 space-y-6">
                <ClanInfoBox onClick={() => setModal('sanctuary')} />
                
                <div className="space-y-4">
                    <h3 className="text-center font-bold uppercase tracking-wider text-sm text-gray-400">Aliados e Clãs</h3>
                    <SocialSearch onSearchResults={setSearchResults} />

                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('aliados')}
                            className={`w-full py-2 rounded-xl text-xs font-bold ${activeTab === 'aliados' ? 'luxe-button-primary' : 'luxe-button-secondary'}`}
                        >
                            Aliados
                        </button>
                        <button
                            onClick={() => setActiveTab('solicitacoes')}
                            className={`w-full py-2 rounded-xl text-xs font-bold ${activeTab === 'solicitacoes' ? 'luxe-button-primary' : 'luxe-button-secondary'}`}
                        >
                            Solicitações {friendRequestsIncoming.length > 0 ? `(${friendRequestsIncoming.length})` : ''}
                        </button>
                    </div>
                    
                    {showSearchResults ? (
                         <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                            {searchResults.clans.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-gray-500">CLÃS ENCONTRADOS</h4>
                                    {searchResults.clans.map(c => <ClanSearchResultCard key={c.id} clan={c} onJoin={() => {}} />)}
                                </div>
                            )}
                            {searchResults.players.length > 0 && (
                                 <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-gray-500">ALIADOS ENCONTRADOS</h4>
                                    {searchResults.players.map(player => {
                                        const isFriend = friends.some(friend => friend.id === player.id);
                                        const isOutgoing = friendRequestsOutgoing.some(request => request.recipientId === player.id);
                                        const isIncoming = friendRequestsIncoming.some(request => request.senderId === player.id);
                                        const isDisabled = isFriend || isOutgoing || isIncoming;
                                        const label = isFriend ? 'Aliado' : isOutgoing ? 'Enviado' : isIncoming ? 'Convite' : 'Adicionar';

                                        return (
                                            <SocialCard
                                                key={player.id}
                                                profile={player}
                                                actions={
                                                    <button
                                                        onClick={() => sendFriendRequest(player.id)}
                                                        disabled={isDisabled}
                                                        className="px-3 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 disabled:bg-black/20 disabled:text-gray-500 disabled:cursor-not-allowed"
                                                    >
                                                        {label}
                                                    </button>
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                            {activeTab === 'aliados' && friends.map(friend => (
                                <SocialCard key={friend.id} profile={friend} />
                            ))}
                            {activeTab === 'solicitacoes' && (
                                <div className="space-y-4">
                                    {friendRequestsIncoming.length === 0 && friendRequestsOutgoing.length === 0 && (
                                        <div className="text-center text-xs text-gray-500">Nenhuma solicitação pendente.</div>
                                    )}
                                    {friendRequestsIncoming.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-bold text-gray-500">RECEBIDAS</div>
                                            {friendRequestsIncoming.map(request => {
                                                const senderProfile = request.senderProfile || buildFallbackProfile(request.senderId);
                                                return (
                                                    <SocialCard
                                                        key={request.id}
                                                        profile={senderProfile}
                                                        subtitle="Convite de amizade"
                                                        actions={
                                                            <>
                                                                <button
                                                                    onClick={() => declineFriendRequest(request.id)}
                                                                    className="p-2 rounded-xl bg-black/40 border border-white/10 hover:border-red-400/60 text-red-300"
                                                                >
                                                                    <XIcon className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => acceptFriendRequest(request.id)}
                                                                    className="p-2 rounded-xl bg-black/40 border border-white/10 hover:border-green-400/60 text-green-300"
                                                                >
                                                                    <CheckIcon className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        }
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                    {friendRequestsOutgoing.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-bold text-gray-500">ENVIADAS</div>
                                            {friendRequestsOutgoing.map(request => {
                                                const recipientProfile = request.recipientProfile || buildFallbackProfile(request.recipientId);
                                                return (
                                                    <SocialCard
                                                        key={request.id}
                                                        profile={recipientProfile}
                                                        subtitle="Solicitação enviada"
                                                        actions={
                                                            <span className="px-3 py-2 text-[10px] font-bold rounded-xl bg-black/30 border border-white/10 text-gray-400">Enviado</span>
                                                        }
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {modal === 'create' && <CreateClanModal onClose={() => setModal(null)} />}
            {modal === 'sanctuary' && <ClanDetailModal clanName={clan.name} onClose={() => setModal(null)} />}
        </>
    );
};
