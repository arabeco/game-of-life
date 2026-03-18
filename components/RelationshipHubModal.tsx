import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import {
    RelationshipCapacityEntry,
    RelationshipCapacitySummary,
    RelationshipInviteAction,
    RelationshipLink,
    RelationshipLinkInvite,
    RelationshipLinkType,
    RelationshipCapacitySlotType,
    LinkedRelationshipArena,
    UserProfile,
} from '../types';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import {
    CrownIcon,
    UsersIcon,
    TrophyIcon,
    FolderStarIcon,
    ShoppingBagIcon,
    SparklesIcon,
    XIcon,
    LinkIcon,
    SendIcon,
    ChevronRightIcon,
    CheckIcon,
    PlusIcon,
} from './Icons';
import { supabase } from '../supabaseClient';
import { hasPremiumAccess } from '../utils/premiumAccess';
import { suggestEmojiForLabel } from '../utils/suggestEmojiForLabel';

const CodexModal = lazy(() =>
    import('./CodexModal').then((module) => ({ default: module.CodexModal }))
);

type RelationshipHubTab = 'mentoria' | 'parceria' | 'competicao' | 'arenas';

type RelationshipProfileLite = {
    id: string;
    nickname: string;
    avatarUrl: string;
    level: number;
    isPremium?: boolean;
    isOnline?: boolean;
    role?: UserProfile['role'];
};

const HUB_TABS: Array<{
    id: RelationshipHubTab;
    label: string;
    icon: React.ReactNode;
}> = [
    { id: 'mentoria', label: 'Mentoria', icon: <CrownIcon className="w-4 h-4" /> },
    { id: 'parceria', label: 'Parceria', icon: <UsersIcon className="w-4 h-4" /> },
    { id: 'competicao', label: 'Competicao', icon: <TrophyIcon className="w-4 h-4" /> },
    { id: 'arenas', label: 'Arenas vinculadas', icon: <FolderStarIcon className="w-4 h-4" /> },
];

const LINK_LABELS: Record<RelationshipLinkType, { singular: string; action: string; cost: number; slotType?: RelationshipCapacitySlotType; accent: string }> = {
    mentoria: {
        singular: 'Mentoria',
        action: 'Criar mentoria',
        cost: 50,
        slotType: 'mentor',
        accent: 'text-[var(--skin-accent-color)]',
    },
    parceria: {
        singular: 'Parceria',
        action: 'Nova parceria',
        cost: 25,
        slotType: 'partnership',
        accent: 'text-cyan-300',
    },
    competicao: {
        singular: 'Competicao',
        action: 'Nova competicao',
        cost: 25,
        slotType: 'competition',
        accent: 'text-rose-300',
    },
};

const STORE_EVENT_NAME = 'navigate-to-store';

const toProfileLite = (profile: Partial<UserProfile> & { id: string }): RelationshipProfileLite => ({
    id: profile.id,
    nickname: profile.nickname || profile.username || 'Aliado',
    avatarUrl: profile.avatarUrl || '',
    level: Number(profile.level || 1),
    isPremium: Boolean(profile.isPremium),
    isOnline: Boolean(profile.isOnline),
    role: profile.role || 'user',
});

const mapDbProfileToLite = (row: any): RelationshipProfileLite => ({
    id: row.id,
    nickname: row.nickname || row.username || 'Aliado',
    avatarUrl: row.avatar_url || row.avatarUrl || '',
    level: Number(row.level || 1),
    isPremium: Boolean(row.is_premium ?? row.isPremium),
    isOnline: Boolean(row.is_online ?? row.isOnline),
    role: row.role === 'admin' || row.role === 'gm' ? row.role : 'user',
});

const formatDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const relationshipCounter = (entry?: RelationshipCapacityEntry | null) =>
    entry ? `${entry.used}/${entry.limit}` : '--';

const openRelationshipStore = () => {
    window.dispatchEvent(
        new CustomEvent(STORE_EVENT_NAME, {
            detail: {
                tab: 'store',
                section: 'social-capacity',
            },
        })
    );
};

const AvatarPill: React.FC<{ profile?: RelationshipProfileLite | null; fallback?: string }> = ({ profile, fallback = '?' }) => (
    <div className="w-11 h-11 rounded-full border border-white/12 bg-black/35 overflow-hidden flex items-center justify-center shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
        {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.nickname} className="w-full h-full object-cover" />
        ) : (
            <span className="text-xs font-black text-white/70">{fallback}</span>
        )}
    </div>
);

const EmptyState: React.FC<{ title: string; text: string }> = ({ title, text }) => (
    <div className="rounded-[22px] border border-dashed border-white/12 bg-black/18 px-4 py-6 text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-white/40">{title}</div>
        <p className="mt-2 text-sm text-white/58 leading-relaxed">{text}</p>
    </div>
);

const CapacityRibbon: React.FC<{
    entry?: RelationshipCapacityEntry | null;
    title: string;
    subtitle: string;
    cost: number;
    requirement: string;
    onBuySlot?: (() => void) | null;
    canBuySlot?: boolean;
    buyLabel?: string;
    onOpenStore: () => void;
    ctaLabel: string;
    onPrimary: () => void;
    primaryDisabled?: boolean;
}> = ({
    entry,
    title,
    subtitle,
    cost,
    requirement,
    onBuySlot,
    canBuySlot = true,
    buyLabel = 'Comprar +1 slot',
    onOpenStore,
    ctaLabel,
    onPrimary,
    primaryDisabled = false,
}) => (
    <GlassCard
        variant="neutral"
        className="relative overflow-hidden rounded-[28px] border border-[rgba(226,233,241,0.24)] bg-[linear-gradient(160deg,rgba(215,220,229,0.92)_0%,rgba(111,119,133,0.78)_18%,rgba(32,38,49,0.92)_46%,rgba(10,12,18,0.98)_100%)] p-5 shadow-[0_26px_70px_rgba(0,0,0,0.34)]"
    >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-14%,rgba(255,255,255,0.72),rgba(255,255,255,0.16)_26%,transparent_58%)] pointer-events-none" />
        <div className="relative z-10 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/24 px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em] text-white/58">
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Central de vinculos</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-[0.14em] text-white">{title}</h2>
                        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/60">{subtitle}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:min-w-[15rem]">
                    <div className="rounded-2xl border border-white/10 bg-black/24 px-3 py-2 text-center">
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/42">Custo</div>
                        <div className="mt-1 text-sm font-black text-[var(--skin-accent-color)]">{cost} gold</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/24 px-3 py-2 text-center">
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/42">Slots</div>
                        <div className="mt-1 text-sm font-black text-white">{relationshipCounter(entry)}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/18 bg-emerald-500/8 px-3 py-2 text-center">
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200/52">Gratis</div>
                        <div className="mt-1 text-sm font-black text-emerald-200">{entry?.base ?? 0}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/24 px-3 py-2 text-center">
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/42">Premium</div>
                        <div className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/78">
                            {entry?.requiresPremium ? 'Obrigatorio' : 'Opcional'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2 rounded-[22px] border border-white/10 bg-black/24 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">Requisito</div>
                    <p className="text-sm text-white/64">{requirement}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {onBuySlot && (
                        <button
                            onClick={onBuySlot}
                            disabled={!canBuySlot}
                            className="rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/84 transition-all hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {buyLabel}
                        </button>
                    )}
                    <button
                        onClick={onOpenStore}
                        className="rounded-xl border border-[var(--skin-accent-color)]/22 bg-[var(--skin-accent-color)]/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--skin-accent-color)] transition-all hover:bg-[var(--skin-accent-color)]/16"
                    >
                        Ver loja
                    </button>
                    <button
                        onClick={onPrimary}
                        disabled={primaryDisabled}
                        className="luxe-skin-button rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {ctaLabel}
                    </button>
                </div>
            </div>
        </div>
    </GlassCard>
);

const InviteCard: React.FC<{
    invite: RelationshipLinkInvite;
    profile?: RelationshipProfileLite | null;
    mode: 'incoming' | 'outgoing';
    onAccept?: (() => void) | null;
    onDecline?: (() => void) | null;
    onRevoke?: (() => void) | null;
    busy?: boolean;
}> = ({ invite, profile, mode, onAccept, onDecline, onRevoke, busy = false }) => {
    const label = LINK_LABELS[invite.linkType];
    return (
        <div className="rounded-[24px] border border-white/12 bg-black/20 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
            <div className="flex items-start gap-3">
                <AvatarPill profile={profile} fallback={mode === 'incoming' ? 'IN' : 'OUT'} />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-black text-white">{profile?.nickname || 'Aliado'}</div>
                        <span className="rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/56">
                            {mode === 'incoming' ? 'Recebido' : 'Enviado'}
                        </span>
                        <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${label.accent} border-current/20 bg-current/10`}>
                            {label.singular}
                        </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-white/58">
                        {mode === 'incoming'
                            ? `${profile?.nickname || 'Esse aliado'} quer iniciar ${label.singular.toLowerCase()} com voce.`
                            : 'Convite pendente aguardando resposta.'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">
                        <span>{invite.costGold || label.cost} gold</span>
                        {formatDate(invite.createdAt) && <span>{formatDate(invite.createdAt)}</span>}
                    </div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {mode === 'incoming' ? (
                    <>
                        <button
                            onClick={onDecline || undefined}
                            disabled={busy}
                            className="luxe-button-secondary rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] disabled:opacity-50"
                        >
                            Recusar
                        </button>
                        <button
                            onClick={onAccept || undefined}
                            disabled={busy}
                            className="luxe-skin-button rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] disabled:opacity-50"
                        >
                            Aceitar
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onRevoke || undefined}
                        disabled={busy}
                        className="rounded-xl border border-amber-300/18 bg-amber-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-amber-200 transition-all hover:bg-amber-400/14 disabled:opacity-50"
                    >
                        Revogar + refund
                    </button>
                )}
            </div>
        </div>
    );
};

const LinkCard: React.FC<{
    title: string;
    subtitle: string;
    accentClassName?: string;
    footer?: React.ReactNode;
    badge?: string | null;
}> = ({ title, subtitle, accentClassName = 'text-white', footer, badge }) => (
    <div className="rounded-[24px] border border-white/12 bg-black/20 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between gap-3">
            <div>
                <div className={`text-sm font-black ${accentClassName}`}>{title}</div>
                <p className="mt-1 text-sm leading-relaxed text-white/58">{subtitle}</p>
            </div>
            {badge && (
                <span className="rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/56">
                    {badge}
                </span>
            )}
        </div>
        {footer ? <div className="mt-4 flex flex-wrap gap-2">{footer}</div> : null}
    </div>
);

const RelationshipInvitePicker: React.FC<{
    title: string;
    linkType: RelationshipLinkType;
    friends: UserProfile[];
    onClose: () => void;
    onSelect: (friendId: string) => Promise<void>;
}> = ({ title, linkType, friends, onClose, onSelect }) => {
    const [search, setSearch] = useState('');
    const [busyFriendId, setBusyFriendId] = useState<string | null>(null);

    const filteredFriends = useMemo(() => {
        const normalized = search.trim().toLowerCase();
        if (!normalized) return friends;
        return friends.filter(friend => friend.nickname?.toLowerCase().includes(normalized));
    }, [friends, search]);

    return (
        <Portal>
            <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/78 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
                <GlassCard
                    variant="neutral"
                    className="w-full max-w-md rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(206,214,224,0.94)_0%,rgba(114,123,137,0.82)_18%,rgba(27,32,43,0.92)_52%,rgba(8,10,15,0.98)_100%)] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.38)]"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/42">Convite</div>
                            <h3 className="mt-1 text-base font-black uppercase tracking-[0.14em] text-white">{title}</h3>
                        </div>
                        <button onClick={onClose} className="rounded-full border border-white/12 bg-black/20 p-2 text-white/70 hover:text-white">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-4 rounded-[20px] border border-white/10 bg-black/24 px-3 py-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/44">Regra</div>
                        <p className="mt-1 text-sm text-white/58">
                            {linkType === 'mentoria'
                                ? 'Mentoria custa 50 gold e so o mentor precisa ter Premium.'
                                : linkType === 'parceria'
                                    ? 'Parceria custa 25 gold ao clicar e usa slot ativo.'
                                    : 'Competicao custa 25 gold ao clicar e usa slot ativo.'}
                        </p>
                    </div>

                    <div className="mt-4">
                        <input
                            id="relationship-friend-search-input"
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar aliado..."
                            className="w-full rounded-2xl border border-white/10 bg-black/28 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/28 focus:border-[var(--skin-accent-color)]/46"
                        />
                    </div>

                    <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                        {filteredFriends.length === 0 ? (
                            <EmptyState title="Sem aliados" text="Nenhum aliado encontrado para esse filtro." />
                        ) : (
                            filteredFriends.map((friend) => {
                                const disabled = busyFriendId === friend.id;
                                return (
                                    <button
                                        id={`relationship-friend-${friend.id}`}
                                        key={friend.id}
                                        onClick={async () => {
                                            setBusyFriendId(friend.id);
                                            try {
                                                await onSelect(friend.id);
                                            } finally {
                                                setBusyFriendId(null);
                                            }
                                        }}
                                        disabled={disabled}
                                        className="w-full rounded-[22px] border border-white/10 bg-black/22 p-3 text-left transition-all hover:border-[var(--skin-accent-color)]/28 hover:bg-black/28 disabled:opacity-60"
                                    >
                                        <div className="flex items-center gap-3">
                                            <AvatarPill profile={toProfileLite(friend)} fallback="?" />
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-black text-white">{friend.nickname}</div>
                                                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/42">
                                                    Nivel {friend.level || 1}
                                                </div>
                                            </div>
                                            <div className="rounded-full border border-[var(--skin-accent-color)]/20 bg-[var(--skin-accent-color)]/10 p-2 text-[var(--skin-accent-color)]">
                                                <SendIcon className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};

export const RelationshipHubModal: React.FC<{
    onClose: () => void;
    initialTab?: RelationshipHubTab;
}> = ({ onClose, initialTab = 'mentoria' }) => {
    const {
        assets,
        buyRelationshipCapacitySlot,
        createLinkedRelationshipArena,
        createRelationshipInvite,
        duplicateUserCodexToRecipient,
        fetchRelationshipHubData,
        friends,
        getRelationshipCapacitySummary,
        respondToRelationshipInvite,
        showToast,
        userCodexes,
        userProfile,
    } = useGame();

    const [activeTab, setActiveTab] = useState<RelationshipHubTab>(initialTab);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<RelationshipCapacitySummary | null>(null);
    const [invites, setInvites] = useState<RelationshipLinkInvite[]>([]);
    const [links, setLinks] = useState<RelationshipLink[]>([]);
    const [linkedArenas, setLinkedArenas] = useState<LinkedRelationshipArena[]>([]);
    const [profilesById, setProfilesById] = useState<Record<string, RelationshipProfileLite>>({});
    const [invitePickerType, setInvitePickerType] = useState<RelationshipLinkType | null>(null);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [selectedPupilLink, setSelectedPupilLink] = useState<RelationshipLink | null>(null);
    const [isMentorCreatorOpen, setIsMentorCreatorOpen] = useState(false);
    const [selectedMentorLinkForArena, setSelectedMentorLinkForArena] = useState<RelationshipLink | null>(null);
    const [linkedArenaDraft, setLinkedArenaDraft] = useState({
        assetId: assets[0]?.id || 'geral',
        name: '',
        description: '',
        icon: '\u{1F3DB}\uFE0F',
    });

    const isPremium = hasPremiumAccess(userProfile);
    const sessionUid = userProfile.id;

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        setLinkedArenaDraft((prev) => {
            if (prev.assetId) return prev;
            return { ...prev, assetId: assets[0]?.id || 'geral' };
        });
    }, [assets]);

    useEffect(() => {
        if (!selectedMentorLinkForArena) return;
        setLinkedArenaDraft((prev) => {
            const nextIcon = suggestEmojiForLabel(prev.name, 'arena', {
                assetId: prev.assetId,
                fallback: '\u{1F3DB}\uFE0F',
            });
            return prev.icon === nextIcon ? prev : { ...prev, icon: nextIcon };
        });
    }, [linkedArenaDraft.name, linkedArenaDraft.assetId, selectedMentorLinkForArena]);

    const hydrateProfiles = async (hubInvites: RelationshipLinkInvite[], hubLinks: RelationshipLink[]) => {
        const nextProfiles: Record<string, RelationshipProfileLite> = {
            [userProfile.id]: toProfileLite(userProfile),
        };

        for (const friend of friends) {
            nextProfiles[friend.id] = toProfileLite(friend);
        }

        const idsToFetch = [...new Set([
            ...hubInvites.flatMap(invite => [invite.senderId, invite.recipientId]),
            ...hubLinks.flatMap(link => [link.mentorId, link.pupilId]),
        ])].filter((id) => id && !nextProfiles[id]);

        if (idsToFetch.length > 0) {
            const { data, error: profileError } = await supabase
                .from('user_profiles')
                .select('id,nickname,avatar_url,level,is_premium,is_online,role')
                .in('id', idsToFetch);

            if (profileError) {
                console.error('Error hydrating relationship profiles:', profileError);
            } else {
                for (const row of data || []) {
                    nextProfiles[row.id] = mapDbProfileToLite(row);
                }
            }
        }

        setProfilesById(nextProfiles);
    };

    const refreshHub = async () => {
        setLoading(true);
        setError(null);
        try {
            const hub = await fetchRelationshipHubData();
            setInvites(hub.invites || []);
            setLinks(hub.links || []);
            setLinkedArenas(hub.linkedArenas || []);
            setSummary(hub.summary || (await getRelationshipCapacitySummary()));
            await hydrateProfiles(hub.invites || [], hub.links || []);
        } catch (hubError: any) {
            console.error('Relationship hub load failed:', hubError);
            setError(hubError?.message || 'Nao foi possivel carregar a Central de Vinculos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refreshHub();
    }, []);

    const profileFor = (id: string) => profilesById[id] || null;
    const otherParticipant = (link: RelationshipLink) => {
        const targetId = link.mentorId === sessionUid ? link.pupilId : link.mentorId;
        return profileFor(targetId);
    };

    const mentorLinks = useMemo(
        () => links.filter((link) => link.linkType === 'mentoria' && link.mentorId === sessionUid),
        [links, sessionUid]
    );
    const pupilLinks = useMemo(
        () => links.filter((link) => link.linkType === 'mentoria' && link.pupilId === sessionUid),
        [links, sessionUid]
    );
    const partnershipLinks = useMemo(() => links.filter((link) => link.linkType === 'parceria'), [links]);
    const competitionLinks = useMemo(() => links.filter((link) => link.linkType === 'competicao'), [links]);
    const authoredCodexes = useMemo(
        () => userCodexes.filter((codex: any) => !codex.catalog_id && Array.isArray(codex.template?.levels) && codex.template.levels.length > 0),
        [userCodexes]
    );
    const linkedArenaCountByLinkId = useMemo(() => {
        const counts = new Map<string, number>();
        for (const linkedArena of linkedArenas) {
            counts.set(linkedArena.relationshipLinkId, (counts.get(linkedArena.relationshipLinkId) || 0) + 1);
        }
        return counts;
    }, [linkedArenas]);

    const filteredInvites = useMemo(() => {
        if (activeTab === 'arenas') return [];
        const linkType = activeTab as RelationshipLinkType;
        return invites.filter((invite) => invite.linkType === linkType);
    }, [activeTab, invites]);

    const incomingInvites = filteredInvites.filter((invite) => invite.recipientId === sessionUid);
    const outgoingInvites = filteredInvites.filter((invite) => invite.senderId === sessionUid);

    const openStoreAndClose = () => {
        openRelationshipStore();
        onClose();
    };

    const handleInviteAction = async (inviteId: string, action: RelationshipInviteAction) => {
        setBusyKey(`${action}:${inviteId}`);
        try {
            const success = await respondToRelationshipInvite(inviteId, action);
            if (success) await refreshHub();
        } finally {
            setBusyKey(null);
        }
    };

    const handleBuySlot = async (slotType: RelationshipCapacitySlotType) => {
        setBusyKey(`buy:${slotType}`);
        try {
            const success = await buyRelationshipCapacitySlot(slotType);
            if (success) await refreshHub();
        } finally {
            setBusyKey(null);
        }
    };

    const handleSendInvite = async (friendId: string) => {
        if (!invitePickerType) return;
        const success = await createRelationshipInvite(friendId, invitePickerType);
        if (success) {
            setInvitePickerType(null);
            await refreshHub();
        }
    };

    const handleCreateLinkedArena = async () => {
        if (!selectedMentorLinkForArena) return;
        if (!linkedArenaDraft.name.trim()) {
            showToast('Diga o nome da arena vinculada.', 'warning');
            return;
        }

        setBusyKey(`linked-arena:${selectedMentorLinkForArena.id}`);
        try {
            const created = await createLinkedRelationshipArena(selectedMentorLinkForArena.id, {
                assetId: linkedArenaDraft.assetId,
                name: linkedArenaDraft.name.trim(),
                description: linkedArenaDraft.description.trim(),
                icon: linkedArenaDraft.icon,
            });

            if (created) {
                setSelectedMentorLinkForArena(null);
                setLinkedArenaDraft({
                    assetId: assets[0]?.id || 'geral',
                    name: '',
                    description: '',
                    icon: '\u{1F3DB}\uFE0F',
                });
                await refreshHub();
            }
        } finally {
            setBusyKey(null);
        }
    };

    const renderMentoria = () => {
        const mentorEntry = summary?.mentor;
        const pupilEntry = summary?.pupil_mentor;

        return (
            <div className="space-y-4">
                <CapacityRibbon
                    entry={mentorEntry}
                    title="Mentoria"
                    subtitle="Separada da arena: o vinculo nasce primeiro, e as arenas compartilhadas entram depois."
                    cost={50}
                    requirement="So o mentor precisa ter Premium. Pupilo pode ser free."
                    onBuySlot={() => handleBuySlot('mentor')}
                    canBuySlot={isPremium}
                    buyLabel="Comprar +1 slot de mentoria"
                    onOpenStore={openStoreAndClose}
                    ctaLabel="Convidar pupilo"
                    onPrimary={() => setInvitePickerType('mentoria')}
                    primaryDisabled={!isPremium || loading}
                />

                {!isPremium && (
                    <div className="rounded-[22px] border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100/86">
                        Mentoria como mentor comeca no Premium. O pupilo continua podendo aceitar sem Premium.
                    </div>
                )}

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    <div className="space-y-4">
                        <GlassCard className="rounded-[26px] border border-white/10 bg-black/24 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Convites de mentoria</div>
                                    <div className="mt-1 text-sm text-white/60">Entrada, saida e refund automatico ao recusar ou revogar.</div>
                                </div>
                                <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                                    Pupilo {relationshipCounter(pupilEntry)}
                                </div>
                            </div>
                            <div className="mt-4 space-y-3">
                                {incomingInvites.map((invite) => (
                                    <InviteCard
                                        key={invite.id}
                                        invite={invite}
                                        profile={profileFor(invite.senderId)}
                                        mode="incoming"
                                        busy={busyKey === `accept:${invite.id}` || busyKey === `decline:${invite.id}`}
                                        onAccept={() => handleInviteAction(invite.id, 'accept')}
                                        onDecline={() => handleInviteAction(invite.id, 'decline')}
                                    />
                                ))}
                                {outgoingInvites.map((invite) => (
                                    <InviteCard
                                        key={invite.id}
                                        invite={invite}
                                        profile={profileFor(invite.recipientId)}
                                        mode="outgoing"
                                        busy={busyKey === `revoke:${invite.id}`}
                                        onRevoke={() => handleInviteAction(invite.id, 'revoke')}
                                    />
                                ))}
                                {incomingInvites.length === 0 && outgoingInvites.length === 0 && (
                                    <EmptyState title="Sem convites" text="Nenhum convite de mentoria pendente no momento." />
                                )}
                            </div>
                        </GlassCard>

                        <GlassCard className="rounded-[26px] border border-white/10 bg-black/24 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Meus pupilos</div>
                                    <div className="mt-1 text-sm text-white/60">Compartilhe Codex e arenas vinculadas a partir do vinculo ativo.</div>
                                </div>
                                <div className="rounded-full border border-[var(--skin-accent-color)]/18 bg-[var(--skin-accent-color)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--skin-accent-color)]">
                                    {relationshipCounter(mentorEntry)}
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {mentorLinks.length === 0 ? (
                                    <EmptyState title="Sem pupilos" text="Quando a mentoria for aceita, os pupilos aparecem aqui." />
                                ) : (
                                    mentorLinks.map((link) => {
                                        const pupil = profileFor(link.pupilId);
                                        const linkedArenaCount = linkedArenaCountByLinkId.get(link.id) || 0;
                                        return (
                                            <div key={link.id} className="rounded-[24px] border border-white/12 bg-black/20 p-4">
                                                <div className="flex items-start gap-3">
                                                    <AvatarPill profile={pupil} fallback="P" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <div className="truncate text-sm font-black text-white">{pupil?.nickname || 'Pupilo'}</div>
                                                            <span className="rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/56">
                                                                {linkedArenaCount} arena(s)
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-sm text-white/58">
                                                            Mentoria ativa desde {formatDate(link.createdAt) || 'agora'}.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => setSelectedPupilLink(link)}
                                                        className="rounded-xl border border-white/12 bg-white/8 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/84 transition-all hover:bg-white/12"
                                                    >
                                                        Abrir Codex
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMentorLinkForArena(link);
                                                            setActiveTab('arenas');
                                                        }}
                                                        className="rounded-xl border border-[var(--skin-accent-color)]/22 bg-[var(--skin-accent-color)]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--skin-accent-color)] transition-all hover:bg-[var(--skin-accent-color)]/16"
                                                    >
                                                        Arena vinculada
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </GlassCard>
                    </div>

                    <div className="space-y-4">
                        <GlassCard className="rounded-[26px] border border-white/10 bg-black/24 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Meu mentor</div>
                            <div className="mt-4 space-y-3">
                                {pupilLinks.length === 0 ? (
                                    <EmptyState title="Sem mentor" text="Voce ainda nao aceitou nenhuma mentoria ativa." />
                                ) : (
                                    pupilLinks.map((link) => {
                                        const mentor = profileFor(link.mentorId);
                                        return (
                                            <LinkCard
                                                key={link.id}
                                                title={mentor?.nickname || 'Mentor'}
                                                subtitle="Esse vinculo te da acesso ao acompanhamento do mentor e a arenas compartilhadas."
                                                accentClassName="text-[var(--skin-accent-color)]"
                                                badge="Mentor"
                                            />
                                        );
                                    })
                                )}
                            </div>
                        </GlassCard>

                        <GlassCard className="rounded-[26px] border border-white/10 bg-black/24 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Resumo de capacidade</div>
                            <div className="mt-4 space-y-3">
                                <div className="rounded-[20px] border border-white/10 bg-black/18 px-4 py-3">
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Mentor</div>
                                    <div className="mt-1 text-base font-black text-white">{relationshipCounter(mentorEntry)}</div>
                                </div>
                                <div className="rounded-[20px] border border-white/10 bg-black/18 px-4 py-3">
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Pupilo</div>
                                    <div className="mt-1 text-base font-black text-white">{relationshipCounter(pupilEntry)}</div>
                                </div>
                                <button
                                    onClick={openStoreAndClose}
                                    className="w-full rounded-xl border border-[var(--skin-accent-color)]/22 bg-[var(--skin-accent-color)]/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--skin-accent-color)] transition-all hover:bg-[var(--skin-accent-color)]/16"
                                >
                                    Loja de capacidade social
                                </button>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        );
    };

    const renderRelationshipFeed = (linkType: RelationshipLinkType, activeLinks: RelationshipLink[]) => {
        const entry =
            linkType === 'parceria'
                ? summary?.partnership
                : linkType === 'competicao'
                    ? summary?.competition
                    : summary?.mentor;
        const label = LINK_LABELS[linkType];
        const title = linkType === 'parceria' ? 'Parceria' : 'Competicao';
        const requirement =
            linkType === 'parceria'
                ? 'Gratuito ate o limite base. Slots extras sao permanentes na loja.'
                : 'Convites PVP usam gold na emissao e refund automatico se nao fechar.';

        return (
            <div className="space-y-4">
                <CapacityRibbon
                    entry={entry}
                    title={title}
                    subtitle={
                        linkType === 'parceria'
                            ? 'Aliancas ativas, sem depender de arena. O vinculo agora e um recurso proprio.'
                            : 'Competicoes ativas e convites PVP sem exigir criar arena no mesmo clique.'
                    }
                    cost={label.cost}
                    requirement={requirement}
                    onBuySlot={() => label.slotType && handleBuySlot(label.slotType)}
                    onOpenStore={openStoreAndClose}
                    ctaLabel={label.action}
                    onPrimary={() => setInvitePickerType(linkType)}
                    primaryDisabled={loading}
                />

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <GlassCard className="rounded-[26px] border border-white/10 bg-black/24 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Convites pendentes</div>
                        <div className="mt-4 space-y-3">
                            {incomingInvites.map((invite) => (
                                <InviteCard
                                    key={invite.id}
                                    invite={invite}
                                    profile={profileFor(invite.senderId)}
                                    mode="incoming"
                                    busy={busyKey === `accept:${invite.id}` || busyKey === `decline:${invite.id}`}
                                    onAccept={() => handleInviteAction(invite.id, 'accept')}
                                    onDecline={() => handleInviteAction(invite.id, 'decline')}
                                />
                            ))}
                            {outgoingInvites.map((invite) => (
                                <InviteCard
                                    key={invite.id}
                                    invite={invite}
                                    profile={profileFor(invite.recipientId)}
                                    mode="outgoing"
                                    busy={busyKey === `revoke:${invite.id}`}
                                    onRevoke={() => handleInviteAction(invite.id, 'revoke')}
                                />
                            ))}
                            {incomingInvites.length === 0 && outgoingInvites.length === 0 && (
                                <EmptyState title="Sem convites" text={`Nenhum convite de ${title.toLowerCase()} pendente.`} />
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="rounded-[26px] border border-white/10 bg-black/24 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Vinculos ativos</div>
                        <div className="mt-4 space-y-3">
                            {activeLinks.length === 0 ? (
                                <EmptyState title="Sem vinculos" text={`Nenhuma ${title.toLowerCase()} ativa ainda.`} />
                            ) : (
                                activeLinks.map((link) => {
                                    const profile = otherParticipant(link);
                                    return (
                                        <LinkCard
                                            key={link.id}
                                            title={profile?.nickname || title}
                                            subtitle={`Vinculo ativo desde ${formatDate(link.createdAt) || 'agora'}.`}
                                            accentClassName={label.accent}
                                            badge={title}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        );
    };

    const renderLinkedArenas = () => {
        const linkedArenaEntry = summary?.linked_arena;
        const mentorTargets = mentorLinks;
        const grouped = mentorTargets.map((link) => ({
            link,
            arenas: linkedArenas.filter((linkedArena) => linkedArena.relationshipLinkId === link.id),
        }));

        return (
            <div className="space-y-4">
                <CapacityRibbon
                    entry={linkedArenaEntry}
                    title="Arenas vinculadas"
                    subtitle="A arena compartilhada agora e um anexo da mentoria, nao o proprio vinculo."
                    cost={60}
                    requirement="Disponivel apenas dentro de uma mentoria ativa em que voce seja o mentor."
                    onBuySlot={() => handleBuySlot('linked_arena')}
                    onOpenStore={openStoreAndClose}
                    ctaLabel="Nova arena vinculada"
                    onPrimary={() => {
                        if (mentorTargets.length === 0) {
                            showToast('Ative uma mentoria como mentor para criar arena vinculada.', 'warning');
                            return;
                        }
                        setSelectedMentorLinkForArena(mentorTargets[0]);
                    }}
                    primaryDisabled={loading}
                />

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <GlassCard className="rounded-[26px] border border-white/10 bg-black/24 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Mentorias com arena compartilhada</div>
                        <div className="mt-4 space-y-3">
                            {grouped.length === 0 ? (
                                <EmptyState title="Sem mentoria" text="Crie uma mentoria ativa para liberar a primeira arena vinculada." />
                            ) : (
                                grouped.map(({ link, arenas }) => {
                                    const pupil = profileFor(link.pupilId);
                                    return (
                                        <div key={link.id} className="rounded-[24px] border border-white/12 bg-black/20 p-4">
                                            <div className="flex items-start gap-3">
                                                <AvatarPill profile={pupil} fallback="P" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-black text-white">{pupil?.nickname || 'Pupilo'}</div>
                                                    <p className="mt-1 text-sm text-white/58">
                                                        {arenas.length === 0
                                                            ? 'Nenhuma arena vinculada criada ainda.'
                                                            : `${arenas.length} arena(s) vinculada(s) ativa(s).`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedMentorLinkForArena(link);
                                                        setLinkedArenaDraft((prev) => ({ ...prev, assetId: assets[0]?.id || prev.assetId || 'geral' }));
                                                    }}
                                                    className="luxe-skin-button rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
                                                >
                                                    Criar por 60 gold
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="rounded-[26px] border border-white/10 bg-black/24 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Arenas ja vinculadas</div>
                        <div className="mt-4 space-y-3">
                            {linkedArenas.length === 0 ? (
                                <EmptyState title="Sem arenas" text="As arenas compartilhadas vao aparecer aqui depois da criacao." />
                            ) : (
                                linkedArenas.map((linkedArena) => {
                                    const arena = linkedArena.arena;
                                    const sourceLink = links.find((link) => link.id === linkedArena.relationshipLinkId) || null;
                                    const pupil = sourceLink ? profileFor(sourceLink.pupilId) : null;
                                    return (
                                        <div key={linkedArena.id} className="rounded-[24px] border border-white/12 bg-black/20 p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--skin-accent-color)]/18 bg-[var(--skin-accent-color)]/10 text-xl">
                                                    {arena?.icon || linkedArena.metadata?.icon || '\u{1F3DB}\uFE0F'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-black text-white">{arena?.name || 'Arena vinculada'}</div>
                                                    <p className="mt-1 text-sm text-white/58">
                                                        {pupil ? `Compartilhada com ${pupil.nickname}.` : 'Arena vinculada a uma mentoria ativa.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        );
    };

    return (
        <>
            <Portal>
                <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/82 backdrop-blur-sm p-3 animate-fade-in" onClick={onClose}>
                    <GlassCard
                        variant="neutral"
                        className="w-full max-w-[72rem] max-h-[92vh] overflow-hidden rounded-[32px] border border-[rgba(229,234,242,0.24)] bg-[linear-gradient(160deg,rgba(218,223,232,0.96)_0%,rgba(116,125,139,0.84)_18%,rgba(30,36,47,0.94)_52%,rgba(9,11,16,0.985)_100%)] shadow-[0_34px_110px_rgba(0,0,0,0.44)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="relative h-full">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.75),rgba(255,255,255,0.14)_25%,transparent_60%)] pointer-events-none" />
                            <div className="relative z-10 flex h-full max-h-[92vh] flex-col">
                                <div className="border-b border-white/10 px-4 py-4 md:px-6">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/24 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/46">
                                                <SparklesIcon className="w-3.5 h-3.5" />
                                                <span>Central de vinculos</span>
                                            </div>
                                            <h1 className="mt-2 text-lg font-black uppercase tracking-[0.16em] text-white md:text-xl">
                                                Mentoria, parceria e competicao
                                            </h1>
                                            <p className="mt-1 text-sm text-white/58">
                                                Gold paga a acao. Slots deixam claro o que e gratis, Premium e loja.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="rounded-[20px] border border-white/10 bg-black/24 px-4 py-3 text-right">
                                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Saldo</div>
                                                <div className="mt-1 text-base font-black text-[var(--skin-accent-color)]">
                                                    {Number(userProfile.wallet?.gold || 0).toLocaleString('pt-BR')} gold
                                                </div>
                                            </div>
                                            <button
                                                onClick={openStoreAndClose}
                                                className="rounded-2xl border border-[var(--skin-accent-color)]/22 bg-[var(--skin-accent-color)]/10 p-3 text-[var(--skin-accent-color)] transition-all hover:bg-[var(--skin-accent-color)]/16"
                                                title="Abrir loja"
                                            >
                                                <ShoppingBagIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={onClose}
                                                className="rounded-2xl border border-white/12 bg-black/22 p-3 text-white/72 transition-all hover:text-white"
                                                title="Fechar"
                                            >
                                                <XIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                                        {HUB_TABS.map((tab) => (
                                            <button
                                                key={tab.id}
                                                id={`relationship-hub-tab-${tab.id}`}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                                                    activeTab === tab.id
                                                        ? 'border-[var(--skin-accent-color)]/30 bg-[var(--skin-accent-color)]/14 text-[var(--skin-accent-color)]'
                                                        : 'border-white/10 bg-black/18 text-white/58 hover:bg-black/26 hover:text-white'
                                                }`}
                                            >
                                                {tab.icon}
                                                <span>{tab.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                                    {error && (
                                        <div className="mb-4 rounded-[22px] border border-red-400/18 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
                                            {error}
                                        </div>
                                    )}

                                    {loading ? (
                                        <div className="space-y-4">
                                            <div className="h-44 rounded-[28px] border border-white/10 bg-black/16 animate-pulse" />
                                            <div className="grid gap-4 xl:grid-cols-2">
                                                <div className="h-64 rounded-[26px] border border-white/10 bg-black/16 animate-pulse" />
                                                <div className="h-64 rounded-[26px] border border-white/10 bg-black/16 animate-pulse" />
                                            </div>
                                        </div>
                                    ) : activeTab === 'mentoria' ? (
                                        renderMentoria()
                                    ) : activeTab === 'parceria' ? (
                                        renderRelationshipFeed('parceria', partnershipLinks)
                                    ) : activeTab === 'competicao' ? (
                                        renderRelationshipFeed('competicao', competitionLinks)
                                    ) : (
                                        renderLinkedArenas()
                                    )}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </Portal>

            {invitePickerType && (
                <RelationshipInvitePicker
                    title={LINK_LABELS[invitePickerType].action}
                    linkType={invitePickerType}
                    friends={friends}
                    onClose={() => setInvitePickerType(null)}
                    onSelect={handleSendInvite}
                />
            )}

            {selectedPupilLink && (
                <Portal>
                    <div className="fixed inset-0 z-[181] flex items-center justify-center bg-black/78 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedPupilLink(null)}>
                        <GlassCard
                            variant="neutral"
                            className="w-full max-w-md rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(208,214,224,0.94)_0%,rgba(114,123,138,0.82)_20%,rgba(28,34,45,0.92)_56%,rgba(8,10,14,0.98)_100%)] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.38)]"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/42">Mentoria ativa</div>
                                    <h3 className="mt-1 text-base font-black uppercase tracking-[0.14em] text-white">
                                        Codex para {profileFor(selectedPupilLink.pupilId)?.nickname || 'pupilo'}
                                    </h3>
                                </div>
                                <button onClick={() => setSelectedPupilLink(null)} className="rounded-full border border-white/12 bg-black/20 p-2 text-white/70 hover:text-white">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-4 rounded-[20px] border border-white/10 bg-black/22 px-4 py-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Forja nova</div>
                                <p className="mt-1 text-sm text-white/58">Criar um Codex personalizado custa 300 gold e respeita o limite de 2 ativos por mentor.</p>
                                <button
                                    onClick={() => setIsMentorCreatorOpen(true)}
                                    className="mt-3 luxe-skin-button rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
                                >
                                    Forjar novo Codex
                                </button>
                            </div>

                            <div className="mt-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Autoral pronto para entregar</div>
                                <div className="mt-3 space-y-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                                    {authoredCodexes.length === 0 ? (
                                        <EmptyState title="Sem manuscrito" text="Finalize um Codex autoral para entregar ao pupilo." />
                                    ) : (
                                        authoredCodexes.map((codex: any) => (
                                            <div key={codex.id} className="rounded-[20px] border border-white/10 bg-black/22 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-black text-white">{codex.name}</div>
                                                        <div className="mt-1 text-[11px] text-white/50">
                                                            {Array.isArray(codex.template?.levels) ? codex.template.levels.length : 0} fase(s)
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            setBusyKey(`duplicate:${codex.id}`);
                                                            try {
                                                                const success = await duplicateUserCodexToRecipient(
                                                                    codex.id,
                                                                    selectedPupilLink.pupilId,
                                                                    selectedPupilLink.id
                                                                );
                                                                if (success) setSelectedPupilLink(null);
                                                            } finally {
                                                                setBusyKey(null);
                                                            }
                                                        }}
                                                        disabled={busyKey === `duplicate:${codex.id}`}
                                                        className="rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/84 transition-all hover:bg-white/12 disabled:opacity-50"
                                                    >
                                                        Entregar
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </Portal>
            )}

            {selectedPupilLink && isMentorCreatorOpen && (
                <Suspense fallback={<div className="fixed inset-0 z-[182] bg-black/40 backdrop-blur-sm" />}>
                    <CodexModal
                        onClose={() => setIsMentorCreatorOpen(false)}
                        recipientId={selectedPupilLink.pupilId}
                        recipientName={profileFor(selectedPupilLink.pupilId)?.nickname || 'Pupilo'}
                        relationshipLinkId={selectedPupilLink.id}
                        onDelivered={() => {
                            setIsMentorCreatorOpen(false);
                            setSelectedPupilLink(null);
                        }}
                    />
                </Suspense>
            )}

            {selectedMentorLinkForArena && (
                <Portal>
                    <div className="fixed inset-0 z-[181] flex items-center justify-center bg-black/78 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedMentorLinkForArena(null)}>
                        <GlassCard
                            variant="neutral"
                            className="w-full max-w-md rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(208,214,224,0.94)_0%,rgba(114,123,138,0.82)_20%,rgba(28,34,45,0.92)_56%,rgba(8,10,14,0.98)_100%)] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.38)]"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/42">Arena vinculada</div>
                                    <h3 className="mt-1 text-base font-black uppercase tracking-[0.14em] text-white">
                                        Compartilhar com {profileFor(selectedMentorLinkForArena.pupilId)?.nickname || 'pupilo'}
                                    </h3>
                                </div>
                                <button onClick={() => setSelectedMentorLinkForArena(null)} className="rounded-full border border-white/12 bg-black/20 p-2 text-white/70 hover:text-white">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-4 space-y-3">
                                <button
                                    id="relationship-linked-arena-asset-button"
                                    onClick={() => {
                                        const currentIndex = Math.max(0, assets.findIndex((asset) => asset.id === linkedArenaDraft.assetId));
                                        const nextAsset = assets[(currentIndex + 1) % Math.max(assets.length, 1)];
                                        if (nextAsset) {
                                            setLinkedArenaDraft((prev) => ({ ...prev, assetId: nextAsset.id }));
                                        }
                                    }}
                                    className="w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-left transition-all hover:bg-black/30"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Ativo pai</div>
                                            <div className="mt-1 text-sm font-semibold text-white">
                                                {assets.find((asset) => asset.id === linkedArenaDraft.assetId)?.name || 'Selecionar ativo'}
                                            </div>
                                        </div>
                                        <ChevronRightIcon className="w-4 h-4 text-white/46" />
                                    </div>
                                </button>

                                <input
                                    id="relationship-linked-arena-name-input"
                                    type="text"
                                    placeholder="Nome da arena vinculada"
                                    value={linkedArenaDraft.name}
                                    onChange={(event) => setLinkedArenaDraft((prev) => ({ ...prev, name: event.target.value }))}
                                    className="w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-[var(--skin-accent-color)]/46"
                                />
                                <textarea
                                    id="relationship-linked-arena-description-input"
                                    placeholder="Descricao"
                                    value={linkedArenaDraft.description}
                                    onChange={(event) => setLinkedArenaDraft((prev) => ({ ...prev, description: event.target.value }))}
                                    rows={3}
                                    className="w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-[var(--skin-accent-color)]/46"
                                />

                                <div className="rounded-[20px] border border-[var(--skin-accent-color)]/18 bg-[var(--skin-accent-color)]/10 px-4 py-3">
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--skin-accent-color)]">Custo</div>
                                    <p className="mt-1 text-sm text-white/66">Criacao unica por 60 gold. Sem reembolso depois da forja.</p>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => setSelectedMentorLinkForArena(null)}
                                        className="luxe-button-secondary w-full rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        id="relationship-linked-arena-submit-button"
                                        onClick={handleCreateLinkedArena}
                                        disabled={busyKey === `linked-arena:${selectedMentorLinkForArena.id}`}
                                        className="luxe-skin-button w-full rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] disabled:opacity-50"
                                    >
                                        Criar por 60 gold
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </Portal>
            )}
        </>
    );
};
