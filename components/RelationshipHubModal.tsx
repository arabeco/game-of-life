import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import {
    RelationshipCapacitySummary,
    RelationshipInviteAction,
    RelationshipLink,
    RelationshipLinkInvite,
    RelationshipLinkType,
    LinkedRelationshipArena,
    Arena,
    Action,
    ScheduledTask,
    UserProfile,
} from '../types';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { ArenaDetailModal } from './ArenaDetailModal';
import { ArenaCard } from './ArenaCard';
import { EmojiGlyph } from './EmojiGlyph';
import {
    CrownIcon,
    UsersIcon,
    TrophyIcon,
    SparklesIcon,
    XIcon,
    SendIcon,
    ChevronRightIcon,
} from './Icons';
import { supabase } from '../supabaseClient';
import { suggestEmojiForLabel } from '../utils/suggestEmojiForLabel';

const CodexModal = lazy(() =>
    import('./CodexModal').then((module) => ({ default: module.CodexModal }))
);

type RelationshipHubTab = 'mentoria' | 'parceria' | 'competicao';

type RelationshipProfileLite = {
    id: string;
    nickname: string;
    avatarUrl: string;
    level: number;
    isPremium?: boolean;
    isOnline?: boolean;
    role?: UserProfile['role'];
};

type InviteConfirmState = {
    linkType: RelationshipLinkType;
    friendId: string;
    friend: RelationshipProfileLite;
};

type RelationshipArenaDetailState = {
    arena: Arena;
    actions: Action[];
    tasks: ScheduledTask[];
    readOnly: boolean;
};

const HUB_TABS: Array<{
    id: RelationshipHubTab;
    label: string;
    icon: React.ReactNode;
}> = [
    { id: 'mentoria', label: 'Mentoria', icon: <CrownIcon className="w-4 h-4" /> },
    { id: 'parceria', label: 'Parceria', icon: <UsersIcon className="w-4 h-4" /> },
    { id: 'competicao', label: 'Competicao', icon: <TrophyIcon className="w-4 h-4" /> },
];
const COIN_GLYPH = '\u{1FA99}';

const LINK_LABELS: Record<RelationshipLinkType, { singular: string; action: string; cost: number; accent: string }> = {
    mentoria: {
        singular: 'Mentoria',
        action: 'Criar mentoria',
        cost: 100,
        accent: 'text-[var(--skin-accent-color)]',
    },
    parceria: {
        singular: 'Parceria',
        action: 'Nova parceria',
        cost: 50,
        accent: 'text-cyan-300',
    },
    competicao: {
        singular: 'Competicao',
        action: 'Nova competicao',
        cost: 50,
        accent: 'text-rose-300',
    },
};
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

const MiniStatCard: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone = 'text-white' }) => (
    <div className="rounded-[18px] border border-white/10 bg-black/24 px-3 py-3">
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">{label}</div>
        <div className={`mt-1 text-sm font-black ${tone}`}>{value}</div>
    </div>
);

const CompactPill: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone = 'text-white/82' }) => (
    <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/64">
        <span className="text-white/42">{label}</span>{' '}
        <span className={tone}>{value}</span>
    </div>
);

const LinkedArenaMiniCard: React.FC<{
    arena: LinkedRelationshipArena;
    assetName?: string;
    onClick: () => void;
}> = ({ arena, assetName, onClick }) => (
    <button
        onClick={onClick}
        className="w-[10.2rem] shrink-0 rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(42,48,64,0.92),rgba(9,11,16,0.96))] p-2.5 text-left shadow-[0_12px_24px_rgba(0,0,0,0.22)] transition-all hover:bg-[linear-gradient(180deg,rgba(52,59,78,0.94),rgba(9,11,16,0.98))]"
    >
        <div className="flex items-start gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.85rem] border border-white/10 bg-black/28 text-white">
                <EmojiGlyph symbol={arena.arena?.icon || arena.metadata?.icon || '🏛️'} size="action" className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-[11px] font-black uppercase leading-tight text-white">
                    {arena.arena?.name || 'Arena compartilhada'}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    {assetName || 'Ativo'}
                </div>
            </div>
        </div>
        <div className="mt-2 line-clamp-2 min-h-[2rem] text-[10px] leading-snug text-white/56">
            {arena.arena?.description || 'Toque para abrir a arena e ver os detalhes.'}
        </div>
    </button>
);

const RelationshipArenaBoardCard: React.FC<{
    arena: LinkedRelationshipArena;
    assetName?: string;
    onClick: () => void;
}> = ({ arena, assetName, onClick }) => {
    const previewArena = arena.arena || {
        id: arena.arenaId,
        assetId: 'geral',
        name: 'Arena compartilhada',
        icon: arena.metadata?.icon || '🏛️',
        description: '',
        actionIds: [],
        isArchived: false,
    };

    return (
        <div className="w-[9.15rem] shrink-0 rounded-[18px] border border-white/12 bg-black/18 p-2 shadow-[0_10px_20px_rgba(0,0,0,0.18)] transition-all hover:border-[var(--skin-accent-color)]/24 hover:bg-black/24">
            <button onClick={onClick} className="block w-full text-left">
                <ArenaCard
                    arena={previewArena}
                    actions={arena.actions || []}
                    tasks={arena.tasks || []}
                    onClick={() => undefined}
                    variant="overview"
                    assetName={assetName}
                />
            </button>
            <div className="mt-2 flex items-center justify-between gap-2 px-1">
                <span className="truncate rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/44">
                    {assetName || 'Ativo'}
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/34">
                    Abrir
                </span>
            </div>
        </div>
    );
};

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
                        <span>{COIN_GLYPH} {invite.costGold || label.cost}</span>
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
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/44">Entrada</div>
                        <p className="mt-1 text-sm text-white/58">
                            {linkType === 'mentoria'
                                ? `A mentoria basica cobra ${COIN_GLYPH} ${LINK_LABELS.mentoria.cost} no envio. O refund acontece se a pessoa recusar, se voce revogar ou se expirar.`
                                : `O custo so sai quando voce confirmar o envio: ${COIN_GLYPH} ${LINK_LABELS[linkType].cost}.`}
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

const RelationshipInviteConfirmModal: React.FC<{
    state: InviteConfirmState;
    summary: RelationshipCapacitySummary | null;
    busy?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ state, summary: _summary, busy = false, onClose, onConfirm }) => {
    const label = LINK_LABELS[state.linkType];
    const isMentoria = state.linkType === 'mentoria';

    return (
        <Portal>
            <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/82 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
                <GlassCard
                    variant="neutral"
                    className="w-full max-w-md rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(208,214,224,0.94)_0%,rgba(114,123,138,0.82)_20%,rgba(28,34,45,0.92)_56%,rgba(8,10,14,0.98)_100%)] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.38)]"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/42">Confirmacao</div>
                            <h3 className="mt-1 text-base font-black uppercase tracking-[0.14em] text-white">
                                {isMentoria ? 'Confirmar mentoria' : `Confirmar ${label.singular.toLowerCase()}`}
                            </h3>
                        </div>
                        <button onClick={onClose} className="rounded-full border border-white/12 bg-black/20 p-2 text-white/70 hover:text-white">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-4 rounded-[22px] border border-white/10 bg-black/24 p-4">
                        <div className="flex items-center gap-3">
                            <AvatarPill profile={state.friend} fallback="?" />
                            <div className="min-w-0">
                                <div className="truncate text-sm font-black text-white">{state.friend.nickname}</div>
                                <p className="mt-1 text-[12px] leading-relaxed text-white/56">
                                    {isMentoria
                                        ? 'Esse convite abre a mentoria basica com essa pessoa.'
                                        : `Voce vai enviar um convite de ${label.singular.toLowerCase()} para essa pessoa.`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`mt-4 grid gap-2 ${isMentoria ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        <MiniStatCard label="Custo agora" value={`${COIN_GLYPH} ${label.cost}`} tone="text-[var(--skin-accent-color)]" />
                        {isMentoria && <MiniStatCard label="Modo" value="basica" tone="text-white" />}
                        <MiniStatCard label="Refund" value="se recusar" tone="text-emerald-300" />
                    </div>

                    <div className="mt-4 rounded-[18px] border border-emerald-300/16 bg-emerald-400/10 px-4 py-3 text-[12px] leading-relaxed text-emerald-100/84">
                        O ouro e cobrado no envio. Se a pessoa recusar, se voce revogar ou o convite expirar, o valor volta automaticamente.
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={onClose}
                            disabled={busy}
                            className="luxe-button-secondary w-full rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={busy}
                            className="luxe-skin-button w-full rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] disabled:opacity-50"
                        >
                            {busy ? 'Enviando...' : `Enviar por ${COIN_GLYPH} ${label.cost}`}
                        </button>
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
        createLinkedRelationshipArena,
        createRelationshipInvite,
        duplicateUserCodexToRecipient,
        fetchRelationshipHubData,
        friends,
        getRelationshipCapacitySummary,
        installCodex,
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
    const [inviteConfirmState, setInviteConfirmState] = useState<InviteConfirmState | null>(null);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [selectedDetailLink, setSelectedDetailLink] = useState<RelationshipLink | null>(null);
    const [selectedPupilLink, setSelectedPupilLink] = useState<RelationshipLink | null>(null);
    const [isMentorCreatorOpen, setIsMentorCreatorOpen] = useState(false);
    const [selectedMentorLinkForArena, setSelectedMentorLinkForArena] = useState<RelationshipLink | null>(null);
    const [selectedArenaDetail, setSelectedArenaDetail] = useState<RelationshipArenaDetailState | null>(null);
    const [linkedArenaDraft, setLinkedArenaDraft] = useState({
        assetId: assets[0]?.id || 'geral',
        name: '',
        description: '',
        icon: '\u{1F3DB}\uFE0F',
    });

    const sessionUid = userProfile.id;

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        setSelectedDetailLink(null);
    }, [activeTab]);

    useEffect(() => {
        setLinkedArenaDraft((prev) => {
            if (prev.assetId) return prev;
            return { ...prev, assetId: assets[0]?.id || 'geral' };
        });
    }, [assets]);

    useEffect(() => {
        if (!selectedMentorLinkForArena) return;
        setLinkedArenaDraft((prev) => {
            const normalized = prev.name || prev.description
                ? prev
                : {
                    ...prev,
                    assetId: prev.assetId || assets.find((asset) => asset.id !== 'geral')?.id || assets[0]?.id || 'geral',
                    name: '',
                    description: '',
                };
            const nextIcon = suggestEmojiForLabel(prev.name, 'arena', {
                assetId: normalized.assetId,
                fallback: '\u{1F3DB}\uFE0F',
            });
            return {
                ...normalized,
                icon: nextIcon,
            };
        });
    }, [assets, linkedArenaDraft.assetId, linkedArenaDraft.description, linkedArenaDraft.name, selectedMentorLinkForArena]);

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
    const linkedArenasByLinkId = useMemo(() => {
        const grouped = new Map<string, LinkedRelationshipArena[]>();
        for (const linkedArena of linkedArenas) {
            const current = grouped.get(linkedArena.relationshipLinkId) || [];
            current.push(linkedArena);
            grouped.set(linkedArena.relationshipLinkId, current);
        }
        return grouped;
    }, [linkedArenas]);
    const receivedCodexesByLinkId = useMemo(() => {
        const grouped = new Map<string, any[]>();
        for (const codex of userCodexes) {
            if (!codex.mentor_relationship_link_id) continue;
            const current = grouped.get(codex.mentor_relationship_link_id) || [];
            current.push(codex);
            grouped.set(codex.mentor_relationship_link_id, current);
        }
        return grouped;
    }, [userCodexes]);
    const installedOriginCodexIds = useMemo(() => {
        const ids = new Set<string>();
        assets.forEach((asset) => {
            asset.arenas.forEach((arena) => {
                if (arena.originCodexId) {
                    ids.add(arena.originCodexId);
                }
            });
        });
        return ids;
    }, [assets]);

    const filteredInvites = useMemo(() => {
        const linkType = activeTab as RelationshipLinkType;
        return invites.filter((invite) => invite.linkType === linkType);
    }, [activeTab, invites]);

    const incomingInvites = filteredInvites.filter((invite) => invite.recipientId === sessionUid);
    const outgoingInvites = filteredInvites.filter((invite) => invite.senderId === sessionUid);

    const handleInviteAction = async (inviteId: string, action: RelationshipInviteAction) => {
        setBusyKey(`${action}:${inviteId}`);
        try {
            const success = await respondToRelationshipInvite(inviteId, action);
            if (success) await refreshHub();
        } finally {
            setBusyKey(null);
        }
    };

    const handleSendInvite = async (friendId: string) => {
        if (!invitePickerType) return;
        if (invitePickerType === 'mentoria') {
            const friendProfile = friends.find((friend) => friend.id === friendId);
            if (friendProfile) {
                setInviteConfirmState({
                    linkType: invitePickerType,
                    friendId,
                    friend: toProfileLite(friendProfile),
                });
                return;
            }
        }
        const success = await createRelationshipInvite(friendId, invitePickerType);
        if (success) {
            setInvitePickerType(null);
            await refreshHub();
        }
    };

    const handleConfirmInviteSend = async () => {
        if (!inviteConfirmState) return;
        setBusyKey(`confirm:${inviteConfirmState.linkType}:${inviteConfirmState.friendId}`);
        try {
            const success = await createRelationshipInvite(inviteConfirmState.friendId, inviteConfirmState.linkType);
            if (success) {
                setInviteConfirmState(null);
                setInvitePickerType(null);
                await refreshHub();
            }
        } finally {
            setBusyKey(null);
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

    const currentTabLinks =
        activeTab === 'mentoria'
            ? [...mentorLinks, ...pupilLinks]
            : activeTab === 'parceria'
                ? partnershipLinks
                : competitionLinks;

    const getRelationshipRoleCopy = (link: RelationshipLink) => {
        if (link.linkType === 'mentoria') {
            return link.mentorId === sessionUid
                ? {
                    badge: 'Seu pupilo',
                    subtitle: 'Relacao de mentoria ativa. Voce pode abrir arenas e campanhas para essa pessoa.',
                }
                : {
                    badge: 'Seu mentor',
                    subtitle: 'Relacao de mentoria ativa. Voce recebe acompanhamento, arenas e campanhas dessa pessoa.',
                };
        }

        if (link.linkType === 'parceria') {
            return {
                badge: 'Parceiro',
                subtitle: 'Alianca ativa. A relacao segura o canal social e as arenas ligadas a ela.',
            };
        }

        return {
            badge: 'Rival',
            subtitle: 'Competicao ativa. A relacao organiza o duelo e os espacos ligados a ele.',
        };
    };

    const getLinkedArenasForLink = (link: RelationshipLink) => linkedArenasByLinkId.get(link.id) || [];

    const getArenaChipsForLink = (link: RelationshipLink) => {
        const explicitArenas = getLinkedArenasForLink(link);
        if (explicitArenas.length > 0) return explicitArenas;

        if (link.arenaSnapshot) {
            return [
                {
                    id: `legacy-${link.id}`,
                    relationshipLinkId: link.id,
                    arenaId: link.arenaId || '',
                    createdAt: link.createdAt,
                    metadata: null,
                    arena: {
                        id: link.arenaId || '',
                        assetId: 'geral',
                        name: link.arenaSnapshot.name,
                        icon: link.arenaSnapshot.icon || '\u{1F3DB}\uFE0F',
                        description: '',
                        actionIds: [],
                        isArchived: false,
                    },
                } as LinkedRelationshipArena,
            ];
        }

        return [];
    };

    const ownedArenaIds = useMemo(() => {
        const ids = new Set<string>();
        assets.forEach((asset) => asset.arenas.forEach((arena) => ids.add(arena.id)));
        return ids;
    }, [assets]);

    const assetNameForArena = (linkedArena?: LinkedRelationshipArena | null) => {
        const assetId = linkedArena?.arena?.assetId;
        if (assetId) {
            const byId = assets.find((asset) => asset.id === assetId);
            if (byId) return byId.name;
        }

        const arenaId = linkedArena?.arena?.id || linkedArena?.arenaId;
        if (!arenaId) return null;
        for (const asset of assets) {
            if (asset.arenas.some((arena) => arena.id === arenaId)) {
                return asset.name;
            }
        }
        return null;
    };

    const renderTabBoard = () => {
        const tabLabel = activeTab === 'mentoria' ? 'Mentoria' : activeTab === 'parceria' ? 'Parceria' : 'Competicao';
        const activeCount = String(currentTabLinks.length).padStart(2, '0');
        return (
            <GlassCard className="rounded-[24px] border border-[rgba(226,233,241,0.16)] bg-[linear-gradient(160deg,rgba(208,214,223,0.12)_0%,rgba(26,31,42,0.90)_34%,rgba(8,10,15,0.98)_100%)] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.24)]">
                <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/24 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.20em] text-white/46">
                        {activeTab === 'mentoria' ? <CrownIcon className="w-3 h-3" /> : activeTab === 'parceria' ? <UsersIcon className="w-3 h-3" /> : <TrophyIcon className="w-3 h-3" />}
                        <span>{tabLabel}</span>
                    </div>
                    <div className={`text-[24px] font-black leading-none ${activeTab === 'mentoria' ? 'text-white/14' : activeTab === 'parceria' ? 'text-cyan-200/16' : 'text-rose-200/16'}`}>
                        {activeCount}
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <CompactPill label="entrada" value={activeTab === 'mentoria' ? `${COIN_GLYPH} 100` : `${COIN_GLYPH} 50`} tone="text-white" />
                    {activeTab === 'mentoria' && <CompactPill label="nova arena" value={`${COIN_GLYPH} 50`} tone="text-[var(--skin-accent-color)]" />}
                    <CompactPill label="ativas" value={activeCount} tone="text-white" />
                </div>
            </GlassCard>
        );
    };

    const renderRelationshipCards = () =>
        currentTabLinks.length === 0 ? (
            <EmptyState title="Sem relacoes" text="Nenhum vinculo ativo nesta aba ainda." />
        ) : (
            <div className="space-y-3">
                {currentTabLinks.map((link) => {
                    const profile = otherParticipant(link);
                    const role = getRelationshipRoleCopy(link);
                    const arenasForLink = getArenaChipsForLink(link);
                    return (
                        <button
                            key={link.id}
                            onClick={() => setSelectedDetailLink(link)}
                            className="w-full rounded-[20px] border border-white/12 bg-black/20 p-3 text-left shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition-all hover:bg-black/26"
                        >
                            <div className="flex items-start gap-3">
                                <AvatarPill profile={profile} fallback="?" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="truncate text-sm font-black text-white">{profile?.nickname || 'Aliado'}</div>
                                        <ChevronRightIcon className="w-4 h-4 shrink-0 text-white/38" />
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <span className="rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/56">
                                            {role.badge}
                                        </span>
                                        <span className="rounded-full border border-emerald-300/18 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-200">
                                            {arenasForLink.length} arena{arenasForLink.length === 1 ? '' : 's'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        );

    const renderInviteSection = () => (
        <GlassCard className="rounded-[22px] border border-white/10 bg-black/22 p-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Convites pendentes</div>
                    <div className="mt-1 text-[12px] text-white/56">O valor volta se recusar, revogar ou expirar.</div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                    {filteredInvites.length}
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
                {filteredInvites.length === 0 && (
                    <EmptyState title="Sem convites" text="Nenhum convite pendente nessa aba no momento." />
                )}
            </div>
        </GlassCard>
    );

    const renderLinkDetail = (link: RelationshipLink) => {
        const profile = otherParticipant(link);
        const arenasForLink = getArenaChipsForLink(link);
        const isMentorSide = link.linkType === 'mentoria' && link.mentorId === sessionUid;
        const mentorProfile = profileFor(link.mentorId) || (link.mentorId === sessionUid ? toProfileLite(userProfile) : null);
        const pupilProfile = profileFor(link.pupilId) || (link.pupilId === sessionUid ? toProfileLite(userProfile) : null);

        if (link.linkType === 'mentoria') {
            const receivedCodexes = receivedCodexesByLinkId.get(link.id) || [];
            return (
                <div className="space-y-4">
                    <GlassCard className="rounded-[22px] border border-[rgba(226,233,241,0.16)] bg-[linear-gradient(160deg,rgba(208,214,223,0.12)_0%,rgba(26,31,42,0.90)_34%,rgba(8,10,15,0.98)_100%)] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.24)]">
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <button
                                    onClick={() => setSelectedDetailLink(null)}
                                    className="rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/76 transition-all hover:bg-white/12"
                                >
                                    Voltar
                                </button>
                                <span className="rounded-full border border-[var(--skin-accent-color)]/20 bg-[var(--skin-accent-color)]/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[var(--skin-accent-color)]">
                                    Mentoria ativa
                                </span>
                            </div>

                            <div className="grid gap-2 md:grid-cols-2">
                                <div className="rounded-[18px] border border-white/10 bg-black/22 p-3">
                                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">Mentor</div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <AvatarPill profile={mentorProfile} fallback="M" />
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-black text-white">{mentorProfile?.nickname || 'Mentor'}</div>
                                            <div className="text-[11px] text-white/50">{isMentorSide ? 'Voce conduz esta mentoria.' : 'Guia principal desse vinculo.'}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-[18px] border border-white/10 bg-black/22 p-3">
                                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">Pupilo</div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <AvatarPill profile={pupilProfile} fallback="P" />
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-black text-white">{pupilProfile?.nickname || 'Pupilo'}</div>
                                            <div className="text-[11px] text-white/50">{isMentorSide ? 'Recebe suas arenas e campanhas.' : 'Recebe o progresso dessa mentoria.'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <CompactPill label="entrada" value={`${COIN_GLYPH} 100`} tone="text-emerald-200" />
                                <CompactPill label="nova arena" value={`${COIN_GLYPH} 50`} tone="text-[var(--skin-accent-color)]" />
                                <CompactPill label="arenas" value={String(arenasForLink.length)} tone="text-white" />
                                <CompactPill label="papel" value={isMentorSide ? 'mentor' : 'pupilo'} tone="text-white" />
                                <CompactPill label="desde" value={formatDate(link.createdAt) || 'agora'} tone="text-white" />
                            </div>
                        </div>
                    </GlassCard>

                    <div className="grid gap-3 md:grid-cols-2">
                    <GlassCard className="rounded-[22px] border border-white/10 bg-black/22 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Arenas</div>
                                        <div className="mt-1 text-[11px] text-white/50">Miniaturas reais da arena compartilhada.</div>
                                    </div>
                                    {isMentorSide && (
                                        <button
                                    onClick={() => setSelectedMentorLinkForArena(link)}
                                    className="luxe-skin-button rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
                                >
                                    + arena
                                </button>
                            )}
                        </div>

                        <div className="mt-4">
                            {arenasForLink.length === 0 ? (
                                <EmptyState title="Sem arenas" text={isMentorSide ? 'Abra a primeira arena compartilhada dessa mentoria.' : 'Seu mentor ainda nao abriu uma arena compartilhada aqui.'} />
                            ) : (
                                <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
                                    {arenasForLink.map((linkedArena) => (
                                        <RelationshipArenaBoardCard
                                            key={linkedArena.id}
                                            arena={linkedArena}
                                            assetName={assetNameForArena(linkedArena)}
                                            onClick={() => linkedArena.arena && setSelectedArenaDetail({
                                                arena: linkedArena.arena,
                                                actions: linkedArena.actions || [],
                                                tasks: linkedArena.tasks || [],
                                                readOnly: !ownedArenaIds.has(linkedArena.arena.id),
                                            })}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="rounded-[22px] border border-white/10 bg-black/22 p-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Campanhas</div>
                                        <div className="mt-1 text-[11px] text-white/50">{isMentorSide ? 'Pronta ou exclusiva.' : 'Campanhas recebidas dessa mentoria.'}</div>
                            </div>
                            {isMentorSide ? (
                                <button
                                    onClick={() => setSelectedPupilLink(link)}
                                    className="rounded-full border border-cyan-300/18 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200 transition-all hover:bg-cyan-400/16"
                                >
                                    Abrir
                                </button>
                            ) : (
                                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/58">
                                    {receivedCodexes.length} recebida{receivedCodexes.length === 1 ? '' : 's'}
                                </span>
                            )}
                        </div>

                        {isMentorSide ? (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <div className="rounded-[18px] border border-white/12 bg-black/20 px-3 py-2.5">
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Prontas</div>
                                    <div className="mt-1 text-[12px] text-white/58">Entregue algo autoral que ja esteja finalizado.</div>
                                </div>

                                <div className="rounded-[18px] border border-white/12 bg-black/20 px-3 py-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Exclusiva</div>
                                        <span className="rounded-full border border-cyan-300/18 bg-cyan-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200">
                                            {COIN_GLYPH} 100
                                        </span>
                                    </div>
                                    <div className="mt-1 text-[12px] text-white/58">Forja uma campanha nova so para essa mentoria.</div>
                                </div>
                            </div>
                        ) : receivedCodexes.length === 0 ? (
                            <div className="mt-3">
                                <EmptyState title="Sem campanhas" text="Seu mentor ainda nao enviou campanha para esta mentoria." />
                            </div>
                        ) : (
                            <div className="mt-3 space-y-2">
                                {receivedCodexes.map((codex: any) => {
                                    const installed = installedOriginCodexIds.has(codex.id);
                                    return (
                                        <div key={codex.id} className="rounded-[18px] border border-white/10 bg-black/22 px-3 py-2.5">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-black text-white">{codex.name}</div>
                                                    <div className="mt-1 text-[11px] text-white/50">
                                                        {Array.isArray(codex.template?.levels) ? codex.template.levels.length : 0} fase(s)
                                                    </div>
                                                </div>
                                                {installed ? (
                                                    <span className="shrink-0 rounded-full border border-emerald-300/18 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">
                                                        Instalada
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={async () => {
                                                            setBusyKey(`install:${codex.id}`);
                                                            try {
                                                                await installCodex(codex.id);
                                                            } finally {
                                                                setBusyKey(null);
                                                            }
                                                        }}
                                                        disabled={busyKey === `install:${codex.id}`}
                                                        className="shrink-0 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/84 transition-all hover:bg-white/12 disabled:opacity-50"
                                                    >
                                                        {busyKey === `install:${codex.id}` ? 'Instalando' : 'Instalar'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </GlassCard>
                    </div>
                </div>
            );
        }

        const isPartnership = link.linkType === 'parceria';
        return (
            <div className="space-y-4">
                <GlassCard className="rounded-[22px] border border-[rgba(226,233,241,0.16)] bg-[linear-gradient(160deg,rgba(208,214,223,0.12)_0%,rgba(26,31,42,0.90)_34%,rgba(8,10,15,0.98)_100%)] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.24)]">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <button
                                onClick={() => setSelectedDetailLink(null)}
                                className="rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/76 transition-all hover:bg-white/12"
                            >
                                Voltar
                            </button>
                            <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${LINK_LABELS[link.linkType].accent} border-current/20 bg-current/10`}>
                                {LINK_LABELS[link.linkType].singular} ativa
                            </span>
                        </div>

                        <div className="flex items-start gap-4">
                            <AvatarPill profile={profile} fallback="?" />
                            <div className="min-w-0 flex-1">
                                <div className="text-base font-black text-white">{profile?.nickname || 'Aliado'}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <CompactPill label="arenas" value={String(arenasForLink.length)} tone={isPartnership ? 'text-cyan-300' : 'text-rose-300'} />
                                    <CompactPill label="desde" value={formatDate(link.createdAt) || 'agora'} tone="text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="rounded-[22px] border border-white/10 bg-black/22 p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">
                        {isPartnership ? 'Arenas observadas' : 'Arenas do confronto'}
                    </div>
                    <div className="mt-3">
                        {arenasForLink.length === 0 ? (
                            <EmptyState title="Sem arenas" text={isPartnership ? 'Essa parceria ainda nao tem arena ligada a ela.' : 'Essa competicao ainda nao tem arena ligada a ela.'} />
                        ) : (
                            <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
                                {arenasForLink.map((linkedArena) => (
                                    <RelationshipArenaBoardCard
                                        key={linkedArena.id}
                                        arena={linkedArena}
                                        assetName={assetNameForArena(linkedArena)}
                                        onClick={() => linkedArena.arena && setSelectedArenaDetail({
                                            arena: linkedArena.arena,
                                            actions: linkedArena.actions || [],
                                            tasks: linkedArena.tasks || [],
                                            readOnly: !ownedArenaIds.has(linkedArena.arena.id),
                                        })}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="rounded-[22px] border border-white/10 bg-black/22 p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Estado atual</div>
                    <div className="mt-3 grid gap-3">
                        <div className="rounded-[18px] border border-white/12 bg-black/20 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">O que esta valendo hoje</div>
                            <p className="mt-2 text-[12px] leading-relaxed text-white/56">
                                {isPartnership
                                    ? 'Essa relacao organiza o vinculo entre voces, os convites e as arenas ligadas a esse par. A profundidade mecanica ainda e mais leve do que a mentoria.'
                                    : 'Essa relacao organiza o duelo, os convites PVP e as arenas ligadas ao confronto. A profundidade mecanica ainda e mais leve do que a mentoria.'}
                            </p>
                        </div>
                        <div className="rounded-[18px] border border-white/12 bg-black/20 p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Leitura simples</div>
                            <p className="mt-2 text-[12px] leading-relaxed text-white/56">
                                {isPartnership
                                    ? 'Parceria e um canal social e operacional. Hoje ela existe como relacao, custo, aceite e espaco ligado.'
                                    : 'Competicao e um canal de rivalidade e observacao. Hoje ela existe como relacao, custo, aceite e espaco ligado.'}
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>
        );
    };

    return (
        <>
            <Portal>
                <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/82 backdrop-blur-sm p-3 animate-fade-in" onClick={onClose}>
                    <GlassCard
                        variant="neutral"
                        className="w-full max-w-[44rem] max-h-[92vh] overflow-hidden rounded-[28px] border border-[rgba(229,234,242,0.24)] bg-[linear-gradient(160deg,rgba(218,223,232,0.96)_0%,rgba(116,125,139,0.84)_18%,rgba(30,36,47,0.94)_52%,rgba(9,11,16,0.985)_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.42)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="relative h-full">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.75),rgba(255,255,255,0.14)_25%,transparent_60%)] pointer-events-none" />
                            <div className="relative z-10 flex h-full max-h-[92vh] flex-col">
                                <div className="border-b border-white/10 px-4 py-3 md:px-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/24 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/46">
                                                <SparklesIcon className="w-3.5 h-3.5" />
                                                <span>Central de vinculos</span>
                                            </div>
                                        </div>

                                        <div className="hidden">
                                            <div className="rounded-[16px] border border-white/10 bg-black/24 px-3 py-2 text-right">
                                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Saldo</div>
                                                <div className="mt-1 text-sm font-black text-[var(--skin-accent-color)]">
                                                    🪙 {Number(userProfile.wallet?.gold || 0).toLocaleString('pt-BR')}
                                                </div>
                                            </div>
                                            <button
                                                onClick={onClose}
                                                className="rounded-2xl border border-white/12 bg-black/22 p-2.5 text-white/72 transition-all hover:text-white"
                                                title="Fechar"
                                            >
                                                <XIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="rounded-2xl border border-white/12 bg-black/22 p-2.5 text-white/72 transition-all hover:text-white"
                                            title="Fechar"
                                        >
                                            <XIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                        {HUB_TABS.map((tab) => (
                                            <button
                                                key={tab.id}
                                                id={`relationship-hub-tab-${tab.id}`}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`inline-flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
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

                                <div className="flex-1 overflow-y-auto p-3 md:p-4 custom-scrollbar">
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
                                    ) : selectedDetailLink ? (
                                        renderLinkDetail(selectedDetailLink)
                                    ) : (
                                        <div className="space-y-4">
                                            {renderTabBoard()}
                                            {renderRelationshipCards()}
                                        </div>
                                    )}
                                </div>

                                {!selectedDetailLink && (
                                    <div className="pointer-events-none absolute bottom-4 right-4 z-20">
                                        <button
                                            id="relationship-hub-primary-create-button"
                                            onClick={() => {
                                                if (loading) return;
                                                setInvitePickerType(activeTab as RelationshipLinkType);
                                            }}
                                            disabled={loading}
                                            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-[18px] shadow-[0_18px_40px_rgba(0,0,0,0.28)] luxe-skin-button disabled:cursor-not-allowed disabled:opacity-50"
                                            title={activeTab === 'mentoria' ? 'Nova mentoria' : activeTab === 'parceria' ? 'Nova parceria' : 'Nova competicao'}
                                        >
                                            <span className="text-xl leading-none">+</span>
                                        </button>
                                    </div>
                                )}
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

            {inviteConfirmState && (
                <RelationshipInviteConfirmModal
                    state={inviteConfirmState}
                    summary={summary}
                    busy={busyKey === `confirm:${inviteConfirmState.linkType}:${inviteConfirmState.friendId}`}
                    onClose={() => setInviteConfirmState(null)}
                    onConfirm={handleConfirmInviteSend}
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
                                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/42">Mentoria</div>
                                    <h3 className="mt-1 text-base font-black uppercase tracking-[0.14em] text-white">
                                        Campanhas
                                    </h3>
                                </div>
                                <button onClick={() => setSelectedPupilLink(null)} className="rounded-full border border-white/12 bg-black/20 p-2 text-white/70 hover:text-white">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                <div className="rounded-[18px] border border-white/10 bg-black/22 p-3">
                                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">Mentor</div>
                                    <div className="mt-2 text-sm font-black text-white">{profileFor(selectedPupilLink.mentorId)?.nickname || 'Voce'}</div>
                                </div>
                                <div className="rounded-[18px] border border-white/10 bg-black/22 p-3">
                                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">Pupilo</div>
                                    <div className="mt-2 text-sm font-black text-white">{profileFor(selectedPupilLink.pupilId)?.nickname || 'Pupilo'}</div>
                                </div>
                            </div>

                            <div className="mt-4 rounded-[20px] border border-white/10 bg-black/22 px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Campanha exclusiva</div>
                                        <p className="mt-1 text-sm text-white/58">Cria algo novo so para {profileFor(selectedPupilLink.pupilId)?.nickname || 'o pupilo'}.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsMentorCreatorOpen(true)}
                                        className="shrink-0 luxe-skin-button rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
                                    >
                                        Nova · {COIN_GLYPH} 100
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Entregar campanha pronta</div>
                                <div className="mt-3 space-y-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                                    {authoredCodexes.length === 0 ? (
                                        <EmptyState title="Sem campanha" text="Finalize uma campanha autoral para entregar aqui." />
                                    ) : (
                                        authoredCodexes.map((codex: any) => (
                                            <div key={codex.id} className="rounded-[18px] border border-white/10 bg-black/22 px-3 py-2.5">
                                                <div className="flex items-center justify-between gap-3">
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
                                                                if (success) {
                                                                    await refreshHub();
                                                                    setSelectedPupilLink(null);
                                                                }
                                                            } finally {
                                                                setBusyKey(null);
                                                            }
                                                        }}
                                                        disabled={busyKey === `duplicate:${codex.id}`}
                                                        className="shrink-0 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/84 transition-all hover:bg-white/12 disabled:opacity-50"
                                                    >
                                                        Enviar
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
                            void refreshHub();
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
                                <div className="rounded-2xl border border-white/10 bg-black/24 px-4 py-3">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/38">
                                        Ativo pai
                                    </label>
                                    <select
                                        id="relationship-linked-arena-asset-button"
                                        value={linkedArenaDraft.assetId}
                                        onChange={(event) => setLinkedArenaDraft((prev) => ({ ...prev, assetId: event.target.value }))}
                                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/32 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-[var(--skin-accent-color)]/46"
                                    >
                                        {assets.map((asset) => (
                                            <option key={asset.id} value={asset.id}>
                                                {asset.id === 'geral' ? 'OUTROS / SIDEQUEST' : asset.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

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

                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => setSelectedMentorLinkForArena(null)}
                                        className="luxe-button-secondary w-full rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
                                    >
                                        Cancelar
                                    </button>
                                    <div className="flex w-full items-center justify-end gap-2">
                                        <span className="rounded-full border border-[var(--skin-accent-color)]/18 bg-[var(--skin-accent-color)]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--skin-accent-color)]">
                                            {COIN_GLYPH} 50
                                        </span>
                                        <button
                                            id="relationship-linked-arena-submit-button"
                                            onClick={handleCreateLinkedArena}
                                            disabled={busyKey === `linked-arena:${selectedMentorLinkForArena.id}`}
                                            className="luxe-skin-button rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] disabled:opacity-50"
                                        >
                                            Criar arena
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </Portal>
            )}

            {selectedArenaDetail && (
                <ArenaDetailModal
                    arena={selectedArenaDetail.arena}
                    actionsOverride={selectedArenaDetail.actions}
                    tasksOverride={selectedArenaDetail.tasks}
                    readOnly={selectedArenaDetail.readOnly}
                    onClose={() => setSelectedArenaDetail(null)}
                />
            )}
        </>
    );
};
