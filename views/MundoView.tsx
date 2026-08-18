import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useTutorial } from '../contexts/TutorialContext';
import { GlassCard } from '../components/GlassCard';
import { CreateClanModal } from '../components/CreateClanModal';
import { Clan, RelationshipLink, RelationshipLinkInvite, RelationshipLinkType, UserProfile } from '../types';
import { ClanOverviewModal } from '../components/ClanOverviewModal';
import { SocialCard } from '../components/SocialCard';
import { PlusIcon, CheckIcon, XIcon, TrophyIcon, ShoppingBagIcon, CalendarIcon, UsersIcon, ArchiveBoxIcon, LinkIcon } from '../components/Icons';
import { SEASONS, ACTIVE_SEASON_ID } from '../constants/GameContent';
import { HallOfFameView } from './HallOfFameView';
import { StoreView } from './StoreView';
import { ArsenalView } from './ArsenalView';
import { SeasonView } from './SeasonView';
import { UserAvatar } from '../components/UserAvatar';
import { ProfileView } from './ProfileView';
import { ConnectionsModal } from '../components/ConnectionsModal';
import { DirectMessages } from '../components/DirectMessages';
import { SCREEN_INTRO_TIP_CONTEXT_EVENT, type ScreenIntroTipId } from '../utils/screenIntroTips';
import './mundo-ui.css';
import { ClanEmblem } from '../components/ClanEmblem';

// Must cover every RelationshipLinkType. 'competicao' was missing, so the lookup
// returned undefined and calling .toLowerCase() on it threw during render, blanking
// the whole screen — that is what a pending challenge invite did.
// 'Desafio' is the name the live UI uses for competicao.
const RELATION_LABELS: Record<RelationshipLinkType, string> = {
    mentoria: 'Mentoria',
    parceria: 'Parceria',
    competicao: 'Desafio',
};

const relationLabel = (type: RelationshipLinkType | string | undefined) =>
    RELATION_LABELS[type as RelationshipLinkType] || 'Vinculo';

const relationBadgeClass = (type: RelationshipLinkType | string | undefined) => {
    if (type === 'mentoria') return 'border-[var(--skin-accent-color)]/26 bg-[var(--skin-accent-color)]/12 text-[var(--skin-accent-color)]';
    if (type === 'competicao') return 'border-rose-400/24 bg-rose-400/12 text-rose-200';
    return 'border-cyan-400/24 bg-cyan-400/12 text-cyan-200';
};

const JoinClanBox: React.FC<{ onCreate: () => void }> = ({ onCreate }) => {
    return (
        <GlassCard variant="neutral" className="text-center p-6 space-y-4" id="clans-section">
            <h2 className="text-xl font-bold">Você não está em um grupo</h2>
            <p className="text-sm text-gray-400">Entre em um grupo para coordenar tarefas em conjunto ou crie o seu para operar em equipe.</p>
            <button onClick={onCreate} className="w-full py-2 rounded-xl luxe-skin-button">Criar Grupo</button>
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
    const searchRequestIdRef = useRef(0);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        const trimmedQuery = newQuery.trim();
        const requestId = searchRequestIdRef.current + 1;
        searchRequestIdRef.current = requestId;
        setQuery(newQuery);
        onQueryChange(newQuery);

        if (trimmedQuery.length < 2) {
            onSearchResults({ players: [], clans: [] });
            return;
        }

        const normalizedQuery = trimmedQuery.toLocaleLowerCase('pt-BR');
        
        // Local filtering for quick response
        const localFilteredFriends = friends.filter((friend) => {
            const nickname = String(friend.nickname || '').toLocaleLowerCase('pt-BR');
            const username = String(friend.username || '').toLocaleLowerCase('pt-BR');
            return nickname.includes(normalizedQuery) || username.includes(normalizedQuery);
        });

        const [globalPlayers, foundClans] = await Promise.all([
            searchPlayers(trimmedQuery),
            searchClans(trimmedQuery),
        ]);

        if (requestId !== searchRequestIdRef.current) return;
        
        // Merge results: exact friends already in list, plus new players found
        const mergedPlayers = [...localFilteredFriends];
        globalPlayers.forEach(p => {
            if (!mergedPlayers.some(existing => existing.id === p.id)) {
                mergedPlayers.push(p);
            }
        });

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
                    placeholder="Buscar Soberano ou Grupo..."
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

const RequestSection: React.FC<{
    title: string;
    count: number;
    tone?: 'neutral' | 'gold' | 'violet' | 'emerald';
    children: React.ReactNode;
}> = ({ title, count, tone = 'neutral', children }) => {
    const toneClass =
        tone === 'gold'
            ? 'border-[var(--skin-accent-color)]/18 bg-[linear-gradient(180deg,rgba(255,208,0,0.08)_0%,rgba(0,0,0,0.18)_100%)]'
            : tone === 'violet'
                ? 'border-fuchsia-400/16 bg-[linear-gradient(180deg,rgba(168,85,247,0.10)_0%,rgba(0,0,0,0.18)_100%)]'
                : tone === 'emerald'
                    ? 'border-emerald-400/16 bg-[linear-gradient(180deg,rgba(16,185,129,0.09)_0%,rgba(0,0,0,0.18)_100%)]'
                    : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(0,0,0,0.18)_100%)]';

    return (
        <div className={`rounded-[26px] border p-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] ${toneClass}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--ui-card-text-soft)]">{title}</div>
                <div className="rounded-full border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--ui-card-text)]">
                    {count}
                </div>
            </div>
            <div className="space-y-2">{children}</div>
        </div>
    );
};

// --- Tabs ---

type SocialSection = 'people' | 'messages' | 'clan';

const SocialTab: React.FC<{ initialSection?: SocialSection; initialParticipantId?: string | null; requestsRevision?: number }> = ({
    initialSection = 'people',
    initialParticipantId = null,
    requestsRevision = 0,
}) => {
    const {
        clan,
        clanRanks,
        clanJoinRequestsIncoming,
        clanJoinRequestsOutgoing,
        friends,
        userProfile,
        friendRequestsIncoming,
        friendRequestsOutgoing,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        cancelFriendRequest,
        joinClan,
        approveClanJoinRequest,
        rejectClanJoinRequest,
        cancelClanJoinRequest,
        notifications,
        respondToClanInvite,
        fetchRelationshipHubData,
        getUserPublicData,
        respondToRelationshipInvite,
    } = useGame();
    const [modal, setModal] = useState<'create' | null>(null);
    const [activeSection, setActiveSection] = useState<SocialSection>(initialSection);
    const [activeTab, setActiveTab] = useState<'aliados' | 'solicitacoes'>('aliados');
    const [searchResults, setSearchResults] = useState<{ players: UserProfile[], clans: Clan[] }>({ players: [], clans: [] });
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
    const [relationshipInvites, setRelationshipInvites] = useState<RelationshipLinkInvite[]>([]);
    const [relationshipLinks, setRelationshipLinks] = useState<RelationshipLink[]>([]);
    const [relationshipProfiles, setRelationshipProfiles] = useState<Record<string, UserProfile>>({});
    const [isRelationshipHubOpen, setRelationshipHubOpen] = useState(false);
    const [joiningClanId, setJoiningClanId] = useState<string | null>(null);

    useEffect(() => {
        setActiveSection(initialSection);
    }, [initialSection]);

    useEffect(() => {
        if (requestsRevision > 0) setActiveTab('solicitacoes');
    }, [requestsRevision]);

    useEffect(() => {
        const tipId: ScreenIntroTipId =
            activeTab === 'solicitacoes'
                ? 'social_requests'
                : activeSection === 'messages'
                    ? 'social_messages'
                    : activeSection === 'clan'
                        ? 'social_clan'
                        : 'social_people';

        window.dispatchEvent(new CustomEvent(SCREEN_INTRO_TIP_CONTEXT_EVENT, {
            detail: { tipId },
        }));
    }, [activeSection, activeTab]);

    const incomingClanInvites = notifications.filter(notification => (
        notification.type === 'clan_invite'
        && notification.metadata?.inviteNotification === true
        && notification.metadata?.joinRequest !== true
    ));

    const requestCount = friendRequestsIncoming.length
        + friendRequestsOutgoing.length
        + relationshipInvites.length
        + clanJoinRequestsIncoming.length
        + clanJoinRequestsOutgoing.length
        + incomingClanInvites.length;

    const activeRelationshipsForProfile = (profileId: string) =>
        relationshipLinks.filter(link => (
            link.linkType !== 'competicao'
            && (link.mentorId === profileId || link.pupilId === profileId)
        ));

    const relationshipBadgesForProfile = (profileId: string) => {
        const activeTypes = Array.from(new Set(activeRelationshipsForProfile(profileId).map(link => link.linkType))) as Array<'mentoria' | 'parceria'>;

        return activeTypes.map(type => (
            <span
                key={`${profileId}-${type}`}
                className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${relationBadgeClass(type)}`}
            >
                {relationLabel(type)}
            </span>
        ));
    };

    const relationshipSubtitleForProfile = (profileId: string) => {
        const activeTypes = Array.from(new Set(activeRelationshipsForProfile(profileId).map(link => relationLabel(link.linkType))));
        return activeTypes.length > 0 ? activeTypes.join(' • ') : undefined;
    };

    const resolveRelationshipProfile = (profileId: string) =>
        friends.find(friend => friend.id === profileId) ||
        relationshipProfiles[profileId] ||
        buildFallbackProfile(profileId);

    const buildClanRequestProfile = (request: NonNullable<typeof clanJoinRequestsOutgoing[number]>): UserProfile => ({
        ...buildFallbackProfile(`clan-request-${request.id}`),
        nickname: request.clanProfile?.name || 'Grupo',
        backgroundUrl: request.clanProfile?.backgroundUrl || '',
        clanName: 'Pedido em aberto',
        clanIcon: request.clanProfile?.icon || '🛡️',
    });

    const relationshipIncoming = relationshipInvites.filter(invite => invite.recipientId === userProfile.id);
    const relationshipOutgoing = relationshipInvites.filter(invite => invite.senderId === userProfile.id);
    const incomingRequestCount = friendRequestsIncoming.length + relationshipIncoming.length + clanJoinRequestsIncoming.length + incomingClanInvites.length;
    const outgoingRequestCount = friendRequestsOutgoing.length + relationshipOutgoing.length + clanJoinRequestsOutgoing.length;

    const handleJoinClan = async (targetClan: Clan) => {
        if (joiningClanId) return;
        setJoiningClanId(targetClan.id);
        try {
            await joinClan(targetClan);
        } finally {
            setJoiningClanId(current => current === targetClan.id ? null : current);
        }
    };

    const renderRequestsPanel = () => {
        if (requestCount === 0) {
            return (
                <div className="rounded-[26px] border border-dashed border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-4 py-8 text-center">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--ui-card-text-soft)]">Solicitacoes</div>
                    <div className="mt-2 text-sm font-semibold text-[color:var(--ui-card-text)]">Nenhuma solicitacao pendente.</div>
                    <div className="mt-1 text-xs text-[color:var(--ui-card-text-soft)]">Amizades, vinculos e pedidos de grupo vao aparecer aqui.</div>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-[22px] border border-[var(--skin-accent-color)]/16 bg-[linear-gradient(180deg,rgba(255,208,0,0.08)_0%,rgba(0,0,0,0.18)_100%)] px-3 py-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--ui-card-text-soft)]">Para voce</div>
                        <div className="mt-1 text-2xl font-black text-[color:var(--ui-card-text)]">{incomingRequestCount}</div>
                        <div className="text-[11px] text-[color:var(--ui-card-text-soft)]">amizades, vinculos e grupos</div>
                    </div>
                    <div className="rounded-[22px] border border-[var(--ui-core-surface-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(0,0,0,0.18)_100%)] px-3 py-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--ui-card-text-soft)]">Em aberto</div>
                        <div className="mt-1 text-2xl font-black text-[color:var(--ui-card-text)]">{outgoingRequestCount}</div>
                        <div className="text-[11px] text-[color:var(--ui-card-text-soft)]">aguardando resposta</div>
                    </div>
                </div>

                {incomingRequestCount > 0 && (
                    <RequestSection title="Para voce" count={incomingRequestCount} tone="gold">
                        {friendRequestsIncoming.map(request => {
                            const senderProfile = request.senderProfile || buildFallbackProfile(request.senderId);
                            return (
                                <SocialCard
                                    key={request.id}
                                    profile={senderProfile}
                                    subtitle="Amizade recebida"
                                    badges={relationshipBadgesForProfile(senderProfile.id)}
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

                        {clanJoinRequestsIncoming.map(request => {
                            const requesterProfile = request.requesterProfile || buildFallbackProfile(request.userId);
                            return (
                                <SocialCard
                                    key={request.id}
                                    profile={requesterProfile}
                                    subtitle={`Pedido para ${clan?.name || 'seu grupo'}`}
                                    badges={
                                        clan?.name ? (
                                            <span className="rounded-full border border-amber-400/24 bg-amber-400/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-amber-200">
                                                <ClanEmblem value={clan.icon} className="mr-1 h-4 w-4" /> Grupo
                                            </span>
                                        ) : undefined
                                    }
                                    onClick={() => setSelectedProfile(requesterProfile)}
                                    actions={
                                        <div className="flex gap-2">
                                            <button onClick={() => approveClanJoinRequest(request)} className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"><CheckIcon className="w-4 h-4" /></button>
                                            <button onClick={() => rejectClanJoinRequest(request)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><XIcon className="w-4 h-4" /></button>
                                        </div>
                                    }
                                />
                            );
                        })}

                        {incomingClanInvites.map(invite => {
                            const senderId = String(invite.metadata?.senderId || invite.metadata?.inviterId || '');
                            const senderProfile = friends.find(friend => friend.id === senderId) || {
                                ...buildFallbackProfile(senderId || `clan-invite-${invite.id}`),
                                nickname: String(invite.metadata?.senderNickname || 'Lider do grupo'),
                            };
                            return (
                                <SocialCard
                                    key={invite.id}
                                    profile={senderProfile}
                                    subtitle={`Convite para ${String(invite.metadata?.clanName || 'um grupo')}`}
                                    badges={
                                        <span className="rounded-full border border-amber-400/24 bg-amber-400/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-amber-200">
                                            Grupo
                                        </span>
                                    }
                                    actions={
                                        <div className="flex gap-2">
                                            <button onClick={() => void respondToClanInvite(invite.id, true)} className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30" title="Aceitar convite"><CheckIcon className="w-4 h-4" /></button>
                                            <button onClick={() => void respondToClanInvite(invite.id, false)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30" title="Recusar convite"><XIcon className="w-4 h-4" /></button>
                                        </div>
                                    }
                                />
                            );
                        })}

                        {relationshipIncoming.map(invite => {
                            const senderProfile = resolveRelationshipProfile(invite.senderId);
                            return (
                                <SocialCard
                                    key={invite.id}
                                    profile={senderProfile}
                                    subtitle={`Convite de ${relationLabel(invite.linkType).toLowerCase()}`}
                                    badges={
                                        <>
                                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${relationBadgeClass(invite.linkType)}`}>
                                                {relationLabel(invite.linkType)}
                                            </span>
                                            {relationshipBadgesForProfile(senderProfile.id)}
                                        </>
                                    }
                                    onClick={() => setSelectedProfile(senderProfile)}
                                    actions={
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    await respondToRelationshipInvite(invite.id, 'accept');
                                                    await refreshRelationshipState();
                                                }}
                                                className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                            >
                                                <CheckIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    await respondToRelationshipInvite(invite.id, 'decline');
                                                    await refreshRelationshipState();
                                                }}
                                                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    }
                                />
                            );
                        })}
                    </RequestSection>
                )}

                {outgoingRequestCount > 0 && (
                    <RequestSection title="Em aberto" count={outgoingRequestCount} tone="violet">
                        {friendRequestsOutgoing.map(request => {
                            const recipientProfile = request.recipientProfile || buildFallbackProfile(request.recipientId);
                            return (
                                <SocialCard
                                    key={request.id}
                                    profile={recipientProfile}
                                    subtitle="Convite de amizade"
                                    badges={relationshipBadgesForProfile(recipientProfile.id)}
                                    onClick={() => setSelectedProfile(recipientProfile)}
                                    actions={
                                        <button onClick={() => cancelFriendRequest(request.id)} className="px-3 py-2 text-[10px] font-bold rounded-xl bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-colors">Cancelar</button>
                                    }
                                />
                            );
                        })}

                        {clanJoinRequestsOutgoing.map(request => {
                            const clanProfile = buildClanRequestProfile(request);
                            return (
                                <SocialCard
                                    key={request.id}
                                    profile={clanProfile}
                                    subtitle="Pedido de entrada enviado"
                                    badges={
                                        <span className="rounded-full border border-amber-400/24 bg-amber-400/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-amber-200">
                                            <ClanEmblem value={request.clanProfile?.icon} className="mr-1 h-4 w-4" /> Grupo
                                        </span>
                                    }
                                    actions={
                                        <button onClick={() => cancelClanJoinRequest(request.id)} className="px-3 py-2 text-[10px] font-bold rounded-xl bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-colors">Cancelar</button>
                                    }
                                />
                            );
                        })}

                        {relationshipOutgoing.map(invite => {
                            const recipientProfile = resolveRelationshipProfile(invite.recipientId);
                            return (
                                <SocialCard
                                    key={invite.id}
                                    profile={recipientProfile}
                                    subtitle={`${relationLabel(invite.linkType)} aguardando aceite`}
                                    badges={
                                        <>
                                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${relationBadgeClass(invite.linkType)}`}>
                                                {relationLabel(invite.linkType)}
                                            </span>
                                            {relationshipBadgesForProfile(recipientProfile.id)}
                                        </>
                                    }
                                    onClick={() => setSelectedProfile(recipientProfile)}
                                    actions={
                                        <button
                                            onClick={async () => {
                                                await respondToRelationshipInvite(invite.id, 'revoke');
                                                await refreshRelationshipState();
                                            }}
                                            className="px-3 py-2 text-[10px] font-bold rounded-xl bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    }
                                />
                            );
                        })}
                    </RequestSection>
                )}
            </div>
        );
    };

    useEffect(() => {
        setShowSearchResults(searchQuery.trim().length > 0);
    }, [searchQuery]);

    const refreshRelationshipState = async () => {
        try {
            const hub = await fetchRelationshipHubData();
            const invites = hub.invites || [];
            const links = hub.links || [];

            setRelationshipInvites(invites);
            setRelationshipLinks(links);

            const knownProfiles = new Set(friends.map(friend => friend.id));
            const relatedUserIds = new Set<string>();

            invites.forEach(invite => {
                relatedUserIds.add(invite.senderId);
                relatedUserIds.add(invite.recipientId);
            });

            links.forEach(link => {
                relatedUserIds.add(link.mentorId);
                relatedUserIds.add(link.pupilId);
            });

            const missingIds = [...relatedUserIds].filter(id => id && !knownProfiles.has(id));
            if (missingIds.length === 0) return;

            const profilePairs = await Promise.all(
                missingIds.map(async id => {
                    try {
                        const data = await getUserPublicData(id);
                        return data.profile ? [id, data.profile] as const : null;
                    } catch (error) {
                        console.warn('Failed to load social relationship profile', id, error);
                        return null;
                    }
                })
            );

            setRelationshipProfiles(prev => {
                const next = { ...prev };
                profilePairs.forEach(pair => {
                    if (pair) next[pair[0]] = pair[1];
                });
                return next;
            });
        } catch (error) {
            console.error('Failed to load relationship state for social tab', error);
        }
    };

    useEffect(() => {
        void refreshRelationshipState();
    }, [friends]);

    useEffect(() => {
        const handleRelationshipRefresh = () => {
            void refreshRelationshipState();
        };

        window.addEventListener('glyph:relationships-updated', handleRelationshipRefresh);
        return () => window.removeEventListener('glyph:relationships-updated', handleRelationshipRefresh);
    }, [friends, userProfile.id]);

    // Simple profile builder for fallback
    const buildFallbackProfile = (id: string): UserProfile => ({
        id, nickname: 'Usuário', username: 'usuario', level: 1, avatarUrl: '', border: 'default', backgroundUrl: '', isOnline: false, visibleWidgets: [], assetArtById: {}, assetWidgetValues: {}, skin: 'default', nobility: { exp: 0, rankId: 'vagante' }, mood: 50, wallet: { gold: 0, fragments: 0 }, inventory: [], role: 'user'
    });

    return (
        <div className="mundo-section-stack">
            <div className="mundo-social-subnav rounded-2xl bg-black/20 p-1 shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
                <div className="grid grid-cols-3 gap-1">
                    {[
                        { id: 'people', label: 'Pessoas', subtitle: `${requestCount} pendencias` },
                        { id: 'messages', label: 'Mensagens', subtitle: `${friends.length} contatos` },
                        { id: 'clan', label: 'Clã', subtitle: clan ? clan.name : 'Sem grupo' },
                    ].map((section) => (
                        <button
                            key={section.id}
                            type="button"
                            onClick={() => setActiveSection(section.id as SocialSection)}
                            className={`w-full rounded-xl border px-2 py-2 text-center transition-colors ${
                                activeSection === section.id
                                    ? 'border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/14 text-[var(--ui-text-accent)] shadow-[0_0_14px_var(--sephirot-glow-color-soft)]'
                                    : 'border-transparent text-gray-400 hover:bg-white/5'
                            }`}
                        >
                            <div className="text-[10px] font-semibold">{section.label}</div>
                            <div className="mt-0.5 truncate text-[9px] uppercase tracking-[0.12em] text-white/42">{section.subtitle}</div>
                        </button>
                    ))}
                </div>
            </div>

            {activeSection === 'messages' && (
                <div className="min-h-[24rem] max-h-[calc(100dvh-16rem)] overflow-hidden rounded-[30px] border border-white/8 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                    <DirectMessages initialParticipantId={initialParticipantId} />
                </div>
            )}

            {activeSection === 'clan' && (
                <div className="flex justify-center">
                    {clan ? (
                        <ClanOverviewModal embedded onClose={() => undefined} />
                    ) : (
                        <JoinClanBox onCreate={() => setModal('create')} />
                    )}
                </div>
            )}

            {activeSection === 'people' && (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Aliados e Grupos</h3>
                    <button
                        id="links-button"
                        onClick={() => setRelationshipHubOpen(true)}
                        className="luxe-skin-button relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <LinkIcon className="h-3.5 w-3.5" />
                        <span>Conexões</span>
                        <span className="rounded-full border border-black/15 bg-black/18 px-1.5 py-0.5 text-[9px] font-black text-[var(--ui-text-on-accent)] shadow-[0_1px_0_rgba(255,255,255,0.18)]">
                            {relationshipLinks.length + relationshipInvites.length}
                        </span>
                    </button>
                </div>
                <SocialSearch friends={friends} onSearchResults={setSearchResults} onQueryChange={setSearchQuery} />

                <div className="flex items-center justify-center gap-1 rounded-2xl bg-black/20 p-1">
                    <button
                        onClick={() => setActiveTab('aliados')}
                        className={`w-full rounded-xl px-2 py-2 text-xs font-semibold transition-colors ${activeTab === 'aliados' ? 'border border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/14 text-[var(--ui-text-accent)] shadow-[0_0_14px_var(--sephirot-glow-color-soft)]' : 'border border-transparent text-gray-400 hover:bg-white/5'}`}
                    >
                        Aliados
                    </button>
                    <button
                        onClick={() => setActiveTab('solicitacoes')}
                        className={`w-full rounded-xl px-2 py-2 text-xs font-semibold transition-colors ${activeTab === 'solicitacoes' ? 'border border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/14 text-[var(--ui-text-accent)] shadow-[0_0_14px_var(--sephirot-glow-color-soft)]' : 'border border-transparent text-gray-400 hover:bg-white/5'}`}
                    >
                        Solicitações {requestCount > 0 ? `(${requestCount})` : ''}
                    </button>
                </div>

                {showSearchResults ? (
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {searchResults.clans.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-500">GRUPOS ENCONTRADOS</h4>
                                {searchResults.clans.map(c => {
                                    const rank = clanRanks.find(r => r.id === c.rankId);
                                    const isMemberOfThisClan = clan?.id === c.id;
                                    const isMemberOfAnyClan = !!clan;
                                    const isJoiningThisClan = joiningClanId === c.id;
                                    const hasPendingRequest = clanJoinRequestsOutgoing.some(request => request.clanId === c.id && request.status === 'pending');
                                    const pendingRequest = clanJoinRequestsOutgoing.find(request => request.clanId === c.id && request.status === 'pending');
                                    const isPrivate = c.recruitmentStatus === 'Privado';

                                    let buttonText = 'Entrar';
                                    let isDisabled = false;
                                    if (isMemberOfThisClan) {
                                        buttonText = 'Membro';
                                        isDisabled = true;
                                    } else if (isMemberOfAnyClan) {
                                        buttonText = 'Em um grupo';
                                        isDisabled = true;
                                    } else if (hasPendingRequest) {
                                        buttonText = 'Solicitado';
                                        isDisabled = true;
                                    } else if (isJoiningThisClan) {
                                        buttonText = 'Entrando...';
                                        isDisabled = true;
                                    } else if (isPrivate) {
                                        buttonText = 'Solicitar';
                                    }

                                    if (joiningClanId && !isJoiningThisClan) {
                                        isDisabled = true;
                                    }

                                    return (
                                        <GlassCard key={c.id} variant="neutral" className="p-3">
                                            <div className="flex items-center space-x-4">
                                                <ClanEmblem value={c.icon} className="h-12 w-12 shrink-0 text-4xl" />
                                                <div className="flex-grow">
                                                    <h4 className="font-bold text-white">{c.name}</h4>
                                                    <p className="text-xs text-gray-400">{rank?.name || 'N/A'} · {c.clanType} · Entrada {c.recruitmentStatus}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {hasPendingRequest && !isMemberOfAnyClan && pendingRequest && (
                                                        <button
                                                            onClick={() => cancelClanJoinRequest(pendingRequest.id)}
                                                            className="px-3 py-2 text-[10px] font-bold uppercase rounded-lg bg-black/20 border border-white/10 text-gray-300 hover:bg-red-500/20 hover:border-red-500/30 hover:text-white transition-colors"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => { void handleJoinClan(c); }}
                                                        disabled={isDisabled}
                                                        className="px-4 py-2 bg-white/10 text-sm font-bold rounded-lg hover:bg-white/20 disabled:bg-black/20 disabled:text-gray-500 disabled:cursor-not-allowed"
                                                    >
                                                        {buttonText}
                                                    </button>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    );
                                })}
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
                                            subtitle={relationshipSubtitleForProfile(player.id)}
                                            badges={relationshipBadgesForProfile(player.id)}
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
                                Nenhum aliado ou grupo encontrado para esse filtro.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {activeTab === 'aliados' && friends.map(friend => (
                            <SocialCard
                                key={friend.id}
                                profile={friend}
                                subtitle={relationshipSubtitleForProfile(friend.id)}
                                badges={relationshipBadgesForProfile(friend.id)}
                                onClick={() => setSelectedProfile(friend)}
                            />
                        ))}
                        {activeTab === 'solicitacoes' && renderRequestsPanel()}
                        {false && (
                            <div className="space-y-4">
                                {friendRequestsIncoming.length === 0 && friendRequestsOutgoing.length === 0 && relationshipIncoming.length === 0 && relationshipOutgoing.length === 0 && (
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
                                                    badges={relationshipBadgesForProfile(senderProfile.id)}
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
                                {relationshipIncoming.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-bold text-gray-500">VINCULOS RECEBIDOS</div>
                                        {relationshipIncoming.map(invite => {
                                            const senderProfile = resolveRelationshipProfile(invite.senderId);
                                            return (
                                                <SocialCard
                                                    key={invite.id}
                                                    profile={senderProfile}
                                                    subtitle={`Convite de ${relationLabel(invite.linkType).toLowerCase()}`}
                                                    badges={relationshipBadgesForProfile(senderProfile.id)}
                                                    onClick={() => setSelectedProfile(senderProfile)}
                                                    actions={
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={async () => {
                                                                    await respondToRelationshipInvite(invite.id, 'accept');
                                                                    await refreshRelationshipState();
                                                                }}
                                                                className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                            >
                                                                <CheckIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    await respondToRelationshipInvite(invite.id, 'decline');
                                                                    await refreshRelationshipState();
                                                                }}
                                                                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                                            >
                                                                <XIcon className="w-4 h-4" />
                                                            </button>
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
                                                    badges={relationshipBadgesForProfile(recipientProfile.id)}
                                                    onClick={() => setSelectedProfile(recipientProfile)}
                                                    actions={
                                                        <button onClick={() => cancelFriendRequest(request.id)} className="px-3 py-2 text-[10px] font-bold rounded-xl bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-colors">Cancelar</button>
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                                {relationshipOutgoing.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-bold text-gray-500">VINCULOS ENVIADOS</div>
                                        {relationshipOutgoing.map(invite => {
                                            const recipientProfile = resolveRelationshipProfile(invite.recipientId);
                                            return (
                                                <SocialCard
                                                    key={invite.id}
                                                    profile={recipientProfile}
                                                    subtitle={`Aguardando ${relationLabel(invite.linkType).toLowerCase()}`}
                                                    badges={relationshipBadgesForProfile(recipientProfile.id)}
                                                    onClick={() => setSelectedProfile(recipientProfile)}
                                                    actions={
                                                        <button
                                                            onClick={async () => {
                                                                await respondToRelationshipInvite(invite.id, 'revoke');
                                                                await refreshRelationshipState();
                                                            }}
                                                            className="px-3 py-2 text-[10px] font-bold rounded-xl bg-black/30 border border-white/10 text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-colors"
                                                        >
                                                            Cancelar
                                                        </button>
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
            )}
            {modal === 'create' && <CreateClanModal onClose={() => setModal(null)} />}
            {selectedProfile && <ProfileView profile={selectedProfile} onClose={() => setSelectedProfile(null)} />}
            {isRelationshipHubOpen && <ConnectionsModal onClose={() => setRelationshipHubOpen(false)} />}
        </div>
    );
};

// --- Main View ---

const MundoView: React.FC = () => {
    const { appMode } = useGame();
    const { didForceGameMode } = useTutorial();
    const [activeTab, setActiveTab] = useState<'social' | 'hall' | 'loja' | 'temporada' | 'arsenal'>('social');
    const [socialSection, setSocialSection] = useState<SocialSection>('people');
    const [socialParticipantId, setSocialParticipantId] = useState<string | null>(null);
    const [socialRequestsRevision, setSocialRequestsRevision] = useState(0);
    const isBasicMode = appMode === 'BASIC' && !didForceGameMode;

    const tabs = useMemo(() => {
        const allTabs = [
            { id: 'social', label: 'Social', icon: <UsersIcon className="w-5 h-5" />, tutorialId: 'nav-social' },
            { id: 'loja', label: 'Loja', icon: <ShoppingBagIcon className="w-5 h-5" />, tutorialId: 'nav-loja' },
            { id: 'arsenal', label: 'Arsenal', icon: <ArchiveBoxIcon className="w-5 h-5" />, tutorialId: 'nav-arsenal' },
            { id: 'hall', label: 'Feitos', icon: <TrophyIcon className="w-5 h-5" />, tutorialId: 'nav-hall' },
            { id: 'temporada', label: 'Temporada', icon: <CalendarIcon className="w-5 h-5" />, tutorialId: 'season-quests' },
        ] as const;

        if (isBasicMode) {
            return allTabs.filter(t => t.id === 'social' || t.id === 'loja');
        }
        return allTabs;
    }, [isBasicMode]);

    useEffect(() => {
        if (!tabs.some((tab) => tab.id === activeTab)) {
            setActiveTab('social');
        }
    }, [activeTab, tabs]);

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
        const tipId: ScreenIntroTipId =
            activeTab === 'hall'
                ? 'hall'
                : activeTab === 'temporada'
                    ? 'season'
                    : activeTab === 'arsenal'
                        ? 'arsenal'
                        : activeTab === 'social'
                            ? 'social'
                            : 'store';

        window.dispatchEvent(new CustomEvent(SCREEN_INTRO_TIP_CONTEXT_EVENT, {
            detail: { tipId },
        }));
    }, [activeTab]);

    useEffect(() => {
        const handleMundoTabRequest = (event: Event) => {
            const detail = (event as CustomEvent<{
                tab?: 'social' | 'hall' | 'loja' | 'temporada' | 'arsenal';
                storeTab?: string;
                section?: string | null;
                socialSection?: SocialSection;
                participantId?: string | null;
                openRequests?: boolean;
            }>).detail || {};
            if (!detail.tab || !tabs.some(tab => tab.id === detail.tab)) return;

            setActiveTab(detail.tab);
            if (detail.tab === 'social') {
                setSocialSection(detail.socialSection || 'people');
                setSocialParticipantId(detail.participantId || null);
                if (detail.openRequests) setSocialRequestsRevision(current => current + 1);
            }

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
        <div id="social-container" className="mundo-view-root flex flex-col h-full">
            {/* Tab Navigation */}
            <div className="mundo-tab-strip flex justify-between px-4 py-2 z-40">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        id={tab.tutorialId}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`mundo-top-tab flex flex-col items-center gap-1 min-w-[64px] transition-colors ${activeTab === tab.id ? 'mundo-top-tab-active text-[var(--skin-accent-color)]' : 'mundo-top-tab-inactive text-gray-500 hover:text-gray-300'}`}
                    >
                        <div className={`mundo-top-tab-icon p-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-[var(--skin-accent-color)]/10 ring-1 ring-[var(--skin-accent-color)]/30' : 'bg-transparent'}`}>
                            {tab.icon}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="mundo-content-shell flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'social' && <SocialTab initialSection={socialSection} initialParticipantId={socialParticipantId} requestsRevision={socialRequestsRevision} />}
                {activeTab === 'hall' && <HallOfFameView />}
                {activeTab === 'loja' && <StoreView />}
                {activeTab === 'temporada' && <SeasonView />}
                {activeTab === 'arsenal' && <ArsenalView />}
            </div>
        </div>
    );
};

export default MundoView;
