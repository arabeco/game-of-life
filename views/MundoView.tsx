import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useTutorial } from '../contexts/TutorialContext';
import { GlassCard } from '../components/GlassCard';
import { CreateClanModal } from '../components/CreateClanModal';
import { Clan, UserProfile } from '../types';
import { ClanDetailModal } from '../components/ClanDetailModal';
import { SocialCard } from '../components/SocialCard';
import { PlusIcon, CheckIcon, XIcon, TrophyIcon, ShoppingBagIcon, CalendarIcon, UsersIcon, ArchiveBoxIcon } from '../components/Icons';
import { ClanSearchResultCard } from '../components/ClanSearchResultCard';
import { SEASONS, ACTIVE_SEASON_ID } from '../constants/GameContent';
import { HallOfFameView } from './HallOfFameView';
import { StoreView } from './StoreView';
import { ArsenalView } from './ArsenalView';
import { SeasonView } from './SeasonView';
import { UserAvatar } from '../components/UserAvatar';
import { ProfileView } from './ProfileView';
import './mundo-ui.css';

const JoinClanBox: React.FC<{ onCreate: () => void }> = ({ onCreate }) => {
    return (
        <GlassCard variant="neutral" className="text-center p-6 space-y-4" id="clans-section">
            <h2 className="text-xl font-bold">Você não está em um clã</h2>
            <p className="text-sm text-gray-400">Junte-se a um clã para participar de missões ou funde o seu próprio para começar uma nova dinastia.</p>
            <button onClick={onCreate} className="w-full py-2 rounded-xl luxe-skin-button">Fundar Clã</button>
        </GlassCard>
    );
};

const ClanInfoBox: React.FC<{ onClick: () => void }> = ({ onClick }) => {
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
        <GlassCard variant="gold" className="p-4 space-y-2 text-center transition-all" id="clan-sanctuary">
            <button onClick={onClick} className="w-full text-left space-y-2">
                <div className="flex items-center justify-center space-x-2">
                    <span className="text-3xl">{clan.icon}</span>
                    <div>
                        <p className="text-sm uppercase tracking-wider">{clan.name}</p>
                        <h2 className="text-2xl font-black" style={{ color: 'var(--skin-accent-color)' }}>{currentRank?.name || 'N/A'}</h2>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] font-bold">
                        <span>{progressInRank.toLocaleString('pt-BR')} EXP</span>
                        <span>{nextRank ? `${(expToNextRank - progressInRank).toLocaleString('pt-BR')} para ${nextRank.name}` : 'Nível Máximo'}</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2 mt-1">
                        <div
                            className="bg-[var(--skin-accent-color)] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>
            </button>
        </GlassCard>
    );
};

const SocialSearch: React.FC<{
    friends: UserProfile[];
    onSearchResults: (results: { players: UserProfile[], clans: Clan[] }) => void;
    onQueryChange: (query: string) => void;
}> = ({ friends, onSearchResults, onQueryChange }) => {
    const { searchClans, searchPlayers, sendFriendRequest } = useGame();
    const [query, setQuery] = useState('');

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        onQueryChange(newQuery);

        if (newQuery.trim() === '') {
            onSearchResults({ players: [], clans: [] });
            return;
        }

        const normalizedQuery = newQuery.trim().toLowerCase();
        
        // Local filtering for quick response
        const localFilteredFriends = friends.filter((friend) => {
            const nickname = String(friend.nickname || '').toLowerCase();
            const profileEmail = String(friend.email || '').toLowerCase();
            return nickname.includes(normalizedQuery) || profileEmail.includes(normalizedQuery);
        });

        // Global player search
        const globalPlayers = await searchPlayers(newQuery);
        
        // Merge results: exact friends already in list, plus new players found
        const mergedPlayers = [...localFilteredFriends];
        globalPlayers.forEach(p => {
            if (!mergedPlayers.some(existing => existing.id === p.id)) {
                mergedPlayers.push(p);
            }
        });

        const foundClans = await searchClans(newQuery);
        onSearchResults({ players: mergedPlayers, clans: foundClans });
    };

    const handleAdd = async () => {
        if (!query.trim()) return;
        const matches = await searchPlayers(query.trim());
        const exact = matches.find(player => player.nickname.toLowerCase() === query.trim().toLowerCase()) || matches[0];
        if (exact) await sendFriendRequest(exact.id);
        setQuery('');
        onQueryChange('');
        onSearchResults({ players: [], clans: [] });
    };

    return (
        <div className="mundo-inline-search" id="allies-search">
            <div className="relative flex-1">
                <input
                    type="text"
                    value={query}
                    onChange={handleSearch}
                    placeholder="Buscar Soberano ou Clã..."
                    className="w-full p-3 pl-10 bg-black/20 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[var(--skin-accent-color)] transition-colors"
                />
                <PlusIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
                onClick={handleAdd}
                disabled={!query.trim()}
                className="p-3 bg-[var(--skin-accent-color)] text-white rounded-xl shadow-lg shadow-[var(--skin-accent-color)]/20 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
            >
                <PlusIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

// --- Tabs ---

const SocialTab: React.FC = () => {
    const { clan, friends, friendRequestsIncoming, friendRequestsOutgoing, sendFriendRequest, acceptFriendRequest, declineFriendRequest, cancelFriendRequest, joinClan } = useGame();
    const [modal, setModal] = useState<'create' | 'sanctuary' | null>(null);
    const [activeTab, setActiveTab] = useState<'aliados' | 'solicitacoes'>('aliados');
    const [searchResults, setSearchResults] = useState<{ players: UserProfile[], clans: Clan[] }>({ players: [], clans: [] });
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        setShowSearchResults(searchQuery.trim().length > 0);
    }, [searchQuery]);

    // Simple profile builder for fallback
    const buildFallbackProfile = (id: string): UserProfile => ({
        id, nickname: 'Usuário', username: 'usuario', level: 1, avatarUrl: '', border: 'default', backgroundUrl: '', isOnline: false, visibleWidgets: [], skin: 'default', nobility: { exp: 0, rankId: 'vagante' }, mood: 50, wallet: { gold: 0, fragments: 0 }, inventory: [], role: 'user'
    });

    return (
        <div className="mundo-section-stack">
            {clan ? (
                <>
                    <ClanInfoBox onClick={() => setModal('sanctuary')} />
                    {modal === 'sanctuary' && <ClanDetailModal onClose={() => setModal(null)} />}
                </>
            ) : (
                <JoinClanBox onCreate={() => setModal('create')} />
            )}

            <div className="space-y-4">
                <h3 className="text-center font-bold uppercase tracking-wider text-sm text-gray-400">Aliados e Clãs</h3>
                <SocialSearch friends={friends} onSearchResults={setSearchResults} onQueryChange={setSearchQuery} />

                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('aliados')}
                        className={`w-full py-2 rounded-xl text-xs font-bold ${activeTab === 'aliados' ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                    >
                        Aliados
                    </button>
                    <button
                        onClick={() => setActiveTab('solicitacoes')}
                        className={`w-full py-2 rounded-xl text-xs font-bold ${activeTab === 'solicitacoes' ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                    >
                        Solicitações {friendRequestsIncoming.length > 0 ? `(${friendRequestsIncoming.length})` : ''}
                    </button>
                </div>

                {showSearchResults ? (
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {searchResults.clans.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-500">CLÃS ENCONTRADOS</h4>
                                {searchResults.clans.map(c => <ClanSearchResultCard key={c.id} clan={c} onJoin={() => joinClan(c)} />)}
                            </div>
                        )}
                        {searchResults.players.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-500">ALIADOS ENCONTRADOS</h4>
                                {searchResults.players.map(player => {
                                    const isFriend = friends.some(friend => friend.id === player.id);
                                    const isOutgoing = friendRequestsOutgoing.some(request => request.recipientId === player.id);
                                    const incomingRequest = friendRequestsIncoming.find(request => request.senderId === player.id);
                                    const isIncoming = !!incomingRequest;
                                    
                                    const isDisabled = isFriend || isOutgoing; 
                                    const label = isFriend ? 'Aliado' : isOutgoing ? 'Enviado' : isIncoming ? 'Aceitar' : 'Adicionar';

                                    return (
                                        <SocialCard
                                            key={player.id}
                                            profile={player}
                                            onClick={() => setSelectedProfile(player)}
                                            actions={
                                                <button
                                                    onClick={() => isIncoming ? acceptFriendRequest(incomingRequest.id) : sendFriendRequest(player.id)}
                                                    disabled={isDisabled}
                                                    className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                                                        isIncoming 
                                                            ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20' 
                                                            : 'bg-white/20 text-white hover:bg-white/30 disabled:bg-white/5 disabled:text-gray-500 disabled:cursor-not-allowed'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            }
                                        />
                                    );
                                })}
                            </div>
                        )}
                        {searchResults.players.length === 0 && searchResults.clans.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-gray-500">
                                Nenhum aliado ou clã encontrado para esse filtro.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {activeTab === 'aliados' && friends.map(friend => (
                            <SocialCard key={friend.id} profile={friend} onClick={() => setSelectedProfile(friend)} />
                        ))}
                        {activeTab === 'solicitacoes' && (
                            <div className="space-y-4">
                                {friendRequestsIncoming.length === 0 && friendRequestsOutgoing.length === 0 && (
                                    <div className="text-center text-xs text-gray-500 py-4">Nenhuma solicitação pendente.</div>
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
                                                    onClick={() => setSelectedProfile(senderProfile)}
                                                    actions={
                                                        <div className="flex gap-2">
                                                            <button onClick={() => acceptFriendRequest(request.id)} className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"><CheckIcon className="w-4 h-4" /></button>
                                                            <button onClick={() => declineFriendRequest(request.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><XIcon className="w-4 h-4" /></button>
                                                        </div>
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
                                                    subtitle="Aguardando resposta"
                                                    onClick={() => setSelectedProfile(recipientProfile)}
                                                    actions={
                                                        <button onClick={() => cancelFriendRequest(request.id)} className="px-3 py-2 text-[10px] font-bold rounded-xl bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-colors">Cancelar</button>
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
            {modal === 'create' && <CreateClanModal onClose={() => setModal(null)} />}
            {selectedProfile && <ProfileView profile={selectedProfile} onClose={() => setSelectedProfile(null)} />}
        </div>
    );
};

// --- Main View ---

const MundoView: React.FC = () => {
    const { appMode, clan } = useGame();
    const { didForceGameMode } = useTutorial();
    const [activeTab, setActiveTab] = useState<'social' | 'hall' | 'loja' | 'temporada' | 'arsenal'>('social');
    const isBasicMode = appMode === 'BASIC' && !didForceGameMode;

    const tabs = useMemo(() => {
        const allTabs = [
            { id: 'social', label: 'Social', icon: <UsersIcon className="w-5 h-5" />, tutorialId: 'nav-social' },
            { id: 'loja', label: 'Loja', icon: <ShoppingBagIcon className="w-5 h-5" />, tutorialId: 'nav-loja' },
            { id: 'arsenal', label: 'Arsenal', icon: <ArchiveBoxIcon className="w-5 h-5" />, tutorialId: 'nav-arsenal' },
            { id: 'hall', label: 'Hall da Fama', icon: <TrophyIcon className="w-5 h-5" />, tutorialId: 'nav-hall' },
            { id: 'temporada', label: 'Temporada', icon: <CalendarIcon className="w-5 h-5" />, tutorialId: 'season-quests' },
        ] as const;

        if (isBasicMode) {
            return allTabs.filter(t => t.id === 'social' || t.id === 'temporada' || t.id === 'loja');
        }
        return allTabs;
    }, [isBasicMode]);

    useEffect(() => {
        const handleTabChange = (e: any) => {
            const tab = e.detail?.tab;
            if (tab && tabs.some(t => t.id === tab)) {
                setActiveTab(tab as any);
            }
        };
        window.addEventListener('tutorialTabChange', handleTabChange);
        return () => window.removeEventListener('tutorialTabChange', handleTabChange);
    }, [tabs]);

    useEffect(() => {
        const handleMundoTabRequest = (event: Event) => {
            const detail = (event as CustomEvent<{ tab?: 'social' | 'hall' | 'loja' | 'temporada' | 'arsenal'; storeTab?: string; section?: string | null }>).detail || {};
            if (!detail.tab || !tabs.some(tab => tab.id === detail.tab)) return;

            setActiveTab(detail.tab);

            if (detail.tab === 'loja') {
                window.setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('store-view-request', {
                        detail: {
                            tab: detail.storeTab || 'store',
                            section: detail.section || null,
                        },
                    }));
                }, 80);
            }
        };

        window.addEventListener('mundo-tab-request', handleMundoTabRequest);
        return () => window.removeEventListener('mundo-tab-request', handleMundoTabRequest);
    }, [tabs]);

    return (
        <div id="social-container" className="flex flex-col h-full">
            {/* Tab Navigation */}
            <div className="flex justify-between px-4 py-2 z-40">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        id={tab.tutorialId}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${activeTab === tab.id ? 'text-[var(--skin-accent-color)]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-[var(--skin-accent-color)]/10 ring-1 ring-[var(--skin-accent-color)]/30' : 'bg-transparent'}`}>
                            {tab.icon}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'social' && <SocialTab />}
                {activeTab === 'hall' && <HallOfFameView />}
                {activeTab === 'loja' && <StoreView />}
                {activeTab === 'temporada' && <SeasonView />}
                {activeTab === 'arsenal' && <ArsenalView />}
            </div>
        </div>
    );
};

export default MundoView;
