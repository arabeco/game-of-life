import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import {
    RelationshipCapacitySummary,
    RelationshipInviteAction,
    RelationshipLink,
    RelationshipLinkInvite,
    RelationshipLinkType,
    LinkedRelationshipArena,
    RelationshipCompetitionChallenge,
    Arena,
    Action,
    ScheduledTask,
    UserProfile,
    UserCodex,
} from '../types';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { ArenaDetailModal } from './ArenaDetailModal';
import { ArenaCard } from './ArenaCard';
import { EmojiGlyph } from './EmojiGlyph';
import { CampaignArenaStack } from './CampaignArenaStack';
import { CampaignsCodex } from './CampaignsCodex';
import {
    CrownIcon,
    UsersIcon,
    TrophyIcon,
    SparklesIcon,
    XIcon,
    SendIcon,
} from './Icons';
import { supabase } from '../supabaseClient';
import { suggestEmojiForLabel } from '../utils/suggestEmojiForLabel';
import { buildCodexCampaignPreview, type CodexCampaignPreview } from '../utils/codexPreview';
import { getGoldMechanicPrice } from '../constants/goldCatalog';
import { getContentVisualPalette } from '../utils/contentCardVisuals';

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
    actions?: Action[];
    tasks?: ScheduledTask[];
    readOnly: boolean;
    relationshipLinkId?: string;
    relationshipLinkType?: RelationshipLinkType | null;
    collaborationRole?: 'mentor' | 'pupil' | null;
    allowLinkedMentorshipEdit?: boolean;
    collaborativeOwnerUserId?: string | null;
};

type RelationshipCampaignModalState = {
    codex: UserCodex;
    preview: CodexCampaignPreview;
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
const MENTORIA_INVITE_GOLD_COST = getGoldMechanicPrice('relationship_invite_mentoria', 100);
const PARCERIA_INVITE_GOLD_COST = getGoldMechanicPrice('relationship_invite_parceria', 50);
const COMPETICAO_INVITE_GOLD_COST = getGoldMechanicPrice('relationship_invite_competicao', 50);
const MENTOR_LINKED_ARENA_GOLD_COST = getGoldMechanicPrice('mentor_linked_arena', 50);
const PARTNERSHIP_LINKED_ARENA_GOLD_COST = getGoldMechanicPrice('partnership_linked_arena', 50);
const COMPETITION_DUEL_GOLD_COST = getGoldMechanicPrice('competition_challenge', 50);
const MENTOR_CAMPAIGN_FORGE_GOLD_COST = getGoldMechanicPrice('mentor_codex_forge', 100);

const LINK_LABELS: Record<RelationshipLinkType, { singular: string; action: string; cost: number; accent: string }> = {
    mentoria: {
        singular: 'Mentoria',
        action: 'Criar mentoria',
        cost: MENTORIA_INVITE_GOLD_COST,
        accent: 'text-[var(--skin-accent-color)]',
    },
    parceria: {
        singular: 'Parceria',
        action: 'Nova parceria',
        cost: PARCERIA_INVITE_GOLD_COST,
        accent: 'text-cyan-300',
    },
    competicao: {
        singular: 'Competicao',
        action: 'Nova competicao',
        cost: COMPETICAO_INVITE_GOLD_COST,
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

const normalizeRelationshipCodexRow = (row: any): UserCodex => {
    let template = row?.template;
    if (typeof template === 'string') {
        try {
            template = JSON.parse(template);
        } catch (error) {
            console.error('Failed to parse relationship codex template', error);
        }
    }

    return {
        ...row,
        template,
        raw_template: template,
        source_type: row?.source_type ?? 'gift_in_app',
        origin_codex_id: row?.origin_codex_id ?? null,
        created_by_user_id: row?.created_by_user_id ?? null,
        mentor_relationship_link_id: row?.mentor_relationship_link_id ?? null,
    } as UserCodex;
};

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
    <div className="rounded-[18px] border border-dashed border-white/12 bg-black/18 px-4 py-3 text-center">
        <div className="text-[12px] font-semibold text-white/62">
            <span className="font-black uppercase tracking-[0.18em] text-white/42">{title}</span>
            <span className="text-white/54"> · {text}</span>
        </div>
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
        className="w-[9.4rem] shrink-0 rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(42,48,64,0.92),rgba(9,11,16,0.96))] p-2.5 text-left shadow-[0_12px_24px_rgba(0,0,0,0.22)] transition-all hover:bg-[linear-gradient(180deg,rgba(52,59,78,0.94),rgba(9,11,16,0.98))]"
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
        assetId: String(arena.metadata?.asset_id || 'geral'),
        name: String(arena.metadata?.name || 'Arena vinculada'),
        icon: arena.metadata?.icon || '🏛️',
        description: String(arena.metadata?.description || ''),
        actionIds: [],
        isArchived: false,
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className="relative w-[7.35rem] shrink-0 text-left transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/24"
        >
            <ArenaCard
                arena={previewArena}
                actions={arena.actions || []}
                tasks={arena.tasks || []}
                relationshipBadgeType={arena.linkType ?? null}
                onClick={() => {}}
                variant="overview"
                assetName={assetName}
            />
        </button>
    );
};

const MentorshipCampaignBoardCard: React.FC<{
    title: string;
    subtitle: string;
    preview?: CodexCampaignPreview | null;
    badge?: React.ReactNode;
    action?: React.ReactNode;
    onClick: () => void;
    className?: string;
}> = ({ title, subtitle, preview, badge, action, onClick, className = 'w-[13.6rem] shrink-0' }) => {
    const visualPalette = getContentVisualPalette('shared');

    return (
        <div className={className}>
            <button
                type="button"
                onClick={onClick}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onClick();
                    }
                }}
                className="block w-full cursor-pointer rounded-[18px] text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/24"
            >
                <div
                    className="relative rounded-[18px] border p-2.5"
                    style={{
                        borderColor: visualPalette.border,
                        background: visualPalette.listBackground,
                        boxShadow: `0 12px 26px ${visualPalette.glow}`,
                    }}
                >
                    {action ? <div className="absolute right-2 top-2 z-20">{action}</div> : null}
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: visualPalette.chipText }}>
                                Campanha
                            </div>
                            <div className="mt-1 truncate text-sm font-black text-white">{title}</div>
                            <div className="mt-1 line-clamp-2 min-h-[2rem] text-[11px] leading-snug text-white/52">{subtitle}</div>
                        </div>
                        {badge}
                    </div>

                    {preview ? (
                        <div
                            className="pointer-events-none mt-3 overflow-hidden rounded-[16px] border px-2 py-2"
                            style={{
                                borderColor: visualPalette.chipBorder,
                                background: visualPalette.stackBackground,
                            }}
                        >
                            <CampaignArenaStack arenas={preview.arenas} actions={preview.actions} size="sm" />
                        </div>
                    ) : (
                        <div className="mt-3 rounded-[16px] border border-dashed border-white/10 bg-black/16 px-3 py-5 text-[10px] font-black uppercase tracking-[0.16em] text-white/36">
                            Toque para abrir
                        </div>
                    )}
                </div>
            </button>
        </div>
    );
};

const RelationshipSectionCard: React.FC<{
    eyebrow: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}> = ({ eyebrow, title, description, action, children }) => (
    <GlassCard className="relationship-hub-section rounded-[22px] border border-white/10 bg-black/22 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">{eyebrow}</div>
                <div className="mt-1 text-sm font-black text-white">{title}</div>
                {description && (
                    <div className="mt-1 text-[11px] text-white/48">
                        {description}
                    </div>
                )}
            </div>
            {action && <div className="shrink-0 self-start">{action}</div>}
        </div>
        <div className="mt-4">
            {children}
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
                    <p className="mt-1 text-[12px] text-white/58">
                        {mode === 'incoming'
                            ? `${profile?.nickname || 'Esse aliado'} quer ${label.singular.toLowerCase()} com voce.`
                            : 'Convite enviado e aguardando resposta.'}
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
                        Revogar + reembolso
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
            <div className="ui-modal-backdrop z-[180]" onClick={onClose}>
                <GlassCard
                    variant="neutral"
                    className="relationship-hub-sheet ui-modal-panel w-full max-w-md p-4"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="ui-modal-eyebrow text-white/52">Convite</div>
                            <h3 className="ui-modal-title mt-1 text-left text-white">{title}</h3>
                        </div>
                        <button onClick={onClose} className="rounded-full border border-white/12 bg-black/20 p-2 text-white/70 hover:text-white">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-4 rounded-[20px] border border-white/10 bg-black/24 px-3 py-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/44">Entrada</div>
                        <p className="mt-1 text-sm text-white/58">
                            {linkType === 'mentoria'
                                ? `A mentoria basica cobra ${COIN_GLYPH} ${LINK_LABELS.mentoria.cost} no envio. O reembolso acontece se a pessoa recusar, se voce revogar ou se expirar.`
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
                            <EmptyState title="Sem aliados" text="Nada encontrado nesse filtro." />
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
            <div className="ui-modal-backdrop z-[190]" onClick={onClose}>
                <GlassCard
                    variant="neutral"
                    className="relationship-hub-sheet ui-modal-panel w-full max-w-md p-4"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="ui-modal-eyebrow text-white/52">Confirmação</div>
                            <h3 className="ui-modal-title mt-1 text-left text-white">
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
                                <p className="mt-1 text-[12px] text-white/56">
                                    {isMentoria
                                        ? 'Isso abre a mentoria basica com essa pessoa.'
                                        : `Voce vai enviar ${label.singular.toLowerCase()} para essa pessoa.`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`mt-4 grid gap-2 ${isMentoria ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        <MiniStatCard label="Custo agora" value={`${COIN_GLYPH} ${label.cost}`} tone="text-[var(--skin-accent-color)]" />
                        {isMentoria && <MiniStatCard label="Modo" value="basica" tone="text-white" />}
                        <MiniStatCard label="Reembolso" value="se recusar" tone="text-emerald-300" />
                    </div>

                    <div className="mt-4 rounded-[18px] border border-emerald-300/16 bg-emerald-400/10 px-4 py-3 text-[12px] text-emerald-100/84">
                        O custo volta se a pessoa recusar, voce revogar ou o convite expirar.
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={onClose}
                            disabled={busy}
                            className="ui-modal-button luxe-button-secondary disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={busy}
                            className="ui-modal-button luxe-skin-button disabled:opacity-50"
                        >
                            {busy ? 'Enviando...' : `Enviar por ${COIN_GLYPH} ${label.cost}`}
                        </button>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};

const RelationshipEndConfirmModal: React.FC<{
    link: RelationshipLink;
    profile?: RelationshipProfileLite | null;
    busy?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ link, profile, busy = false, onClose, onConfirm }) => {
    const label = LINK_LABELS[link.linkType];
    const otherName = profile?.nickname || 'essa pessoa';

    return (
        <Portal>
            <div className="ui-modal-backdrop z-[192]" onClick={onClose}>
                <GlassCard
                    variant="neutral"
                    className="relationship-hub-sheet ui-modal-panel w-full max-w-md border-red-300/14 p-4"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="ui-modal-eyebrow text-red-200/72">Confirmação</div>
                            <h3 className="ui-modal-title mt-1 text-left text-white">
                                Encerrar {label.singular.toLowerCase()}
                            </h3>
                        </div>
                        <button onClick={onClose} className="rounded-full border border-white/12 bg-black/20 p-2 text-white/70 hover:text-white">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-4 rounded-[22px] border border-red-300/14 bg-red-500/8 p-4">
                        <div className="flex items-center gap-3">
                            <AvatarPill profile={profile} fallback="?" />
                            <div className="min-w-0">
                                <div className="truncate text-sm font-black text-white">{otherName}</div>
                                <p className="mt-1 text-[12px] text-white/62">
                                    Isso encerra a {label.singular.toLowerCase()} e corta o acesso compartilhado.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-[18px] border border-amber-300/16 bg-amber-400/10 px-4 py-3 text-[12px] text-amber-100/84">
                        Depois, so criando outro vinculo.
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={onClose}
                            disabled={busy}
                            className="ui-modal-button luxe-button-secondary disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={busy}
                            className="ui-modal-button w-full border border-red-300/18 bg-red-500/14 text-red-100 transition-all hover:bg-red-500/18 disabled:opacity-50"
                        >
                            {busy ? 'Encerrando...' : 'Encerrar vínculo'}
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
        createCompetitionChallenge,
        createLinkedRelationshipArena,
        createRelationshipInvite,
        duplicateUserCodexToRecipient,
        endRelationshipLink,
        fetchRelationshipHubData,
        friends,
        getRelationshipCapacitySummary,
        installCodex,
        respondToRelationshipInvite,
        shareRelationshipArena,
        showToast,
        userCodexes,
        userProfile,
    } = useGame();

    const [activeTab, setActiveTab] = useState<RelationshipHubTab>(initialTab);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<RelationshipCapacitySummary | null>(null);
    const [invites, setInvites] = useState<RelationshipLinkInvite[]>([]);
    const [links, setLinks] = useState<RelationshipLink[]>([]);
    const [linkedArenas, setLinkedArenas] = useState<LinkedRelationshipArena[]>([]);
    const [competitionChallenges, setCompetitionChallenges] = useState<RelationshipCompetitionChallenge[]>([]);
    const [profilesById, setProfilesById] = useState<Record<string, RelationshipProfileLite>>({});
    const [invitePickerType, setInvitePickerType] = useState<RelationshipLinkType | null>(null);
    const [inviteConfirmState, setInviteConfirmState] = useState<InviteConfirmState | null>(null);
    const [endLinkConfirmState, setEndLinkConfirmState] = useState<RelationshipLink | null>(null);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [selectedDetailLink, setSelectedDetailLink] = useState<RelationshipLink | null>(null);
    const [selectedPupilLink, setSelectedPupilLink] = useState<RelationshipLink | null>(null);
    const [isMentorCreatorOpen, setIsMentorCreatorOpen] = useState(false);
    const [selectedMentorLinkForArena, setSelectedMentorLinkForArena] = useState<RelationshipLink | null>(null);
    const [selectedCompetitionLinkForChallenge, setSelectedCompetitionLinkForChallenge] = useState<RelationshipLink | null>(null);
    const [selectedCompetitionSourceArenaId, setSelectedCompetitionSourceArenaId] = useState<string | null>(null);
    const [selectedPartnershipArenaId, setSelectedPartnershipArenaId] = useState<string | null>(null);
    const [selectedArenaDetail, setSelectedArenaDetail] = useState<RelationshipArenaDetailState | null>(null);
    const [selectedRelationshipCampaign, setSelectedRelationshipCampaign] = useState<RelationshipCampaignModalState | null>(null);
    const [mentorSentCodexesByLinkId, setMentorSentCodexesByLinkId] = useState<Record<string, UserCodex[]>>({});
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
        setSelectedCompetitionLinkForChallenge(null);
        setSelectedCompetitionSourceArenaId(null);
        setSelectedPartnershipArenaId(null);
    }, [activeTab]);

    useEffect(() => {
        setLinkedArenaDraft((prev) => {
            if (prev.assetId) return prev;
            return { ...prev, assetId: assets[0]?.id || 'geral' };
        });
    }, [assets]);

    useEffect(() => {
        if (!selectedMentorLinkForArena) return;
        if (selectedMentorLinkForArena.linkType === 'parceria') return;
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

    useEffect(() => {
        if (!selectedMentorLinkForArena || selectedMentorLinkForArena.linkType !== 'parceria') {
            setSelectedPartnershipArenaId(null);
        }
    }, [selectedMentorLinkForArena]);

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

    const refreshHub = async (options?: { initial?: boolean }) => {
        const useBlockingLoader = Boolean(options?.initial || !hasLoadedOnce);
        if (useBlockingLoader) {
            setLoading(true);
        } else {
            setIsRefreshing(true);
        }
        setError(null);
        try {
            const hub = await fetchRelationshipHubData();
            setInvites(hub.invites || []);
            setLinks(hub.links || []);
            setLinkedArenas(hub.linkedArenas || []);
            setCompetitionChallenges(hub.competitionChallenges || []);
            setSummary(hub.summary || null);
            setLoading(false);
            setIsRefreshing(false);
            setHasLoadedOnce(true);

            const mentorLinkIds = (hub.links || [])
                .filter((link) => link.linkType === 'mentoria' && link.mentorId === sessionUid)
                .map((link) => link.id);

            let nextMentorSentCodexesByLinkId: Record<string, UserCodex[]> = {};
            if (mentorLinkIds.length > 0) {
                const { data: mentorCodexRows, error: mentorCodexError } = await supabase
                    .from('codex')
                    .select('id,owner_id,name,description,template,schema_version,is_public,created_at,updated_at,catalog_id,source_type,origin_codex_id,created_by_user_id,mentor_relationship_link_id,author,price')
                    .in('mentor_relationship_link_id', mentorLinkIds)
                    .eq('created_by_user_id', sessionUid)
                    .eq('source_type', 'gift_in_app')
                    .order('created_at', { ascending: false });

                if (mentorCodexError) {
                    console.error('Relationship mentor codex load failed:', mentorCodexError);
                } else {
                    nextMentorSentCodexesByLinkId = (mentorCodexRows || [])
                        .map(normalizeRelationshipCodexRow)
                        .reduce((acc, codex) => {
                            const linkId = codex.mentor_relationship_link_id;
                            if (!linkId) return acc;
                            const current = acc[linkId] || [];
                            current.push(codex);
                            acc[linkId] = current;
                            return acc;
                        }, {} as Record<string, UserCodex[]>);
                }
            }

            if (!hub.summary) {
                const freshSummary = await getRelationshipCapacitySummary();
                setSummary(freshSummary || null);
            }
            setMentorSentCodexesByLinkId(nextMentorSentCodexesByLinkId);
            void hydrateProfiles(hub.invites || [], hub.links || []);
        } catch (hubError: any) {
            console.error('Relationship hub load failed:', hubError);
            setError(hubError?.message || 'Nao foi possivel carregar a Central de Vinculos.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
            setHasLoadedOnce(true);
        }
    };

    useEffect(() => {
        void refreshHub({ initial: true });
    }, []);

    useEffect(() => {
        const handleRelationshipRefresh = () => {
            void refreshHub();
        };

        window.addEventListener('glyph:relationships-updated', handleRelationshipRefresh);
        return () => window.removeEventListener('glyph:relationships-updated', handleRelationshipRefresh);
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
    const competitionChallengesByLinkId = useMemo(() => {
        const grouped = new Map<string, RelationshipCompetitionChallenge[]>();
        for (const challenge of competitionChallenges) {
            const current = grouped.get(challenge.relationshipLinkId) || [];
            current.push(challenge);
            grouped.set(challenge.relationshipLinkId, current);
        }
        return grouped;
    }, [competitionChallenges]);
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
    const receivedCodexPreviewById = useMemo(() => {
        const previews = new Map<string, CodexCampaignPreview>();
        const codexPools = [
            ...userCodexes,
            ...Object.values(mentorSentCodexesByLinkId).flat(),
        ];
        for (const codex of codexPools) {
            if (!codex?.mentor_relationship_link_id) continue;
            if (!Array.isArray(codex.template?.levels) || codex.template.levels.length === 0) continue;
            if (previews.has(codex.id)) continue;

            const baseTitle = codex.template?.title || codex.name || 'Campanha recebida';
            previews.set(
                codex.id,
                buildCodexCampaignPreview(
                    codex.id,
                    {
                        ...codex.template,
                        title: baseTitle,
                        description: codex.template?.description || codex.description || '',
                    },
                    `__relationship_codex_preview_${codex.id}__`
                )
            );
        }
        return previews;
    }, [mentorSentCodexesByLinkId, userCodexes]);
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
    const linkedArenaIds = useMemo(
        () => new Set(linkedArenas.map((linkedArena) => linkedArena.arenaId).filter(Boolean)),
        [linkedArenas]
    );
    const availablePartnershipSourceArenas = useMemo(
        () =>
            assets
                .flatMap((asset) =>
                    asset.arenas
                        .filter((arena) => !arena.isArchived && !linkedArenaIds.has(arena.id))
                        .map((arena) => ({
                            arena,
                            assetName: asset.name,
                            actionCount: arena.actionIds.length,
                        }))
                )
                .sort((left, right) => left.arena.name.localeCompare(right.arena.name, 'pt-BR')),
        [assets, linkedArenaIds]
    );
    const availableCompetitionSourceArenas = useMemo(
        () =>
            assets
                .flatMap((asset) =>
                    asset.arenas
                        .filter((arena) => !arena.isArchived && arena.actionIds.length > 0 && !linkedArenaIds.has(arena.id))
                        .map((arena) => ({
                            arena,
                            assetName: asset.name,
                            actionCount: arena.actionIds.length,
                        }))
                )
                .sort((left, right) => left.arena.name.localeCompare(right.arena.name, 'pt-BR')),
        [assets, linkedArenaIds]
    );

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

    const handleConfirmEndLink = async () => {
        if (!endLinkConfirmState) return;
        setBusyKey(`end-link:${endLinkConfirmState.id}`);
        try {
            const success = await endRelationshipLink(endLinkConfirmState.id);
            if (success) {
                setEndLinkConfirmState(null);
                setSelectedDetailLink(null);
                setSelectedPupilLink(null);
                setSelectedMentorLinkForArena(null);
                await refreshHub();
            }
        } finally {
            setBusyKey(null);
        }
    };

    const handleCreateLinkedArena = async () => {
        if (!selectedMentorLinkForArena) return;

        setBusyKey(`linked-arena:${selectedMentorLinkForArena.id}`);
        try {
            if (selectedMentorLinkForArena.linkType === 'parceria') {
                if (!selectedPartnershipArenaId) {
                    showToast('Escolha uma arena sua para expor nessa parceria.', 'warning');
                    return;
                }

                const shared = await shareRelationshipArena(selectedMentorLinkForArena.id, selectedPartnershipArenaId);
                if (shared) {
                    setSelectedMentorLinkForArena(null);
                    setSelectedPartnershipArenaId(null);
                    await refreshHub();
                }
                return;
            }

            if (!linkedArenaDraft.name.trim()) {
                showToast('Diga o nome da arena vinculada.', 'warning');
                return;
            }

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

    const getCompetitionChallengesForLink = (linkId: string) => competitionChallengesByLinkId.get(linkId) || [];

    const handleCreateCompetitionChallenge = async () => {
        if (!selectedCompetitionLinkForChallenge || !selectedCompetitionSourceArenaId) {
            showToast('Escolha uma arena sua para espelhar nesse duelo.', 'warning');
            return;
        }

        setBusyKey(`competition-challenge:${selectedCompetitionLinkForChallenge.id}`);
        try {
            const created = await createCompetitionChallenge(
                selectedCompetitionLinkForChallenge.id,
                selectedCompetitionSourceArenaId,
            );

            if (created) {
                setSelectedCompetitionLinkForChallenge(null);
                setSelectedCompetitionSourceArenaId(null);
                await refreshHub();
            }
        } finally {
            setBusyKey(null);
        }
    };

    const handleDeleteMentorshipCodex = async (codex: UserCodex) => {
        const confirmed = window.confirm(`Remover a campanha "${codex.name}" deste vinculo?`);
        if (!confirmed) return;

        setBusyKey(`delete-codex:${codex.id}`);
        try {
            const { data, error } = await supabase.rpc('delete_relationship_mentor_codex', {
                p_codex_id: codex.id,
            });

            if (error) throw error;
            if ((data as any)?.success === false) {
                throw new Error(String((data as any)?.error || 'DELETE_RELATIONSHIP_MENTOR_CODEX_FAILED'));
            }

            if (selectedRelationshipCampaign?.codex.id === codex.id) {
                setSelectedRelationshipCampaign(null);
            }
            await refreshHub();
            window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            showToast('Campanha removida da mentoria.', 'success');
        } catch (error: any) {
            console.error('Error deleting mentorship codex from relationship hub:', error);
            const message = String(error?.message || '');
            showToast(
                message.includes('delete_relationship_mentor_codex')
                    ? 'Essa base ainda nao recebeu o SQL novo para remover campanhas da mentoria.'
                    : 'Nao foi possivel remover essa campanha agora.',
                'error'
            );
        } finally {
            setBusyKey(null);
        }
    };

    const handleDeleteMentorshipArena = async (linkedArena: LinkedRelationshipArena) => {
        const arenaName = linkedArena.arena?.name || String(linkedArena.metadata?.name || 'Arena vinculada');
        const confirmed = window.confirm(`Remover a arena "${arenaName}" deste vinculo?`);
        if (!confirmed) return;

        const arenaId = linkedArena.arena?.id || linkedArena.arenaId;
        if (!arenaId) {
            showToast('Nao foi possivel localizar essa arena agora.', 'error');
            return;
        }

        setBusyKey(`delete-arena:${arenaId}`);
        try {
            const { data, error } = await supabase.rpc('delete_linked_relationship_arena', {
                p_arena_id: arenaId,
            });

            if (error) throw error;
            if ((data as any)?.success === false) {
                throw new Error(String((data as any)?.error || 'DELETE_LINKED_RELATIONSHIP_ARENA_FAILED'));
            }

            if (selectedArenaDetail?.arena.id === arenaId) {
                setSelectedArenaDetail(null);
            }

            await refreshHub();
            window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            showToast('Arena removida da mentoria.', 'success');
        } catch (error: any) {
            console.error('Error deleting mentorship arena from relationship hub:', error);
            const message = String(error?.message || '');
            showToast(
                message.includes('delete_linked_relationship_arena')
                    ? 'Essa base ainda nao recebeu o SQL novo para remover arenas da mentoria.'
                    : 'Nao foi possivel remover essa arena agora.',
                'error'
            );
        } finally {
            setBusyKey(null);
        }
    };

    const getCompetitionArenasForChallenge = (link: RelationshipLink, challenge: RelationshipCompetitionChallenge) => {
        const arenasForLink = getLinkedArenasForLink(link);
        return arenasForLink.filter((linkedArena) => {
            const challengeId = String(linkedArena.metadata?.challenge_id || '');
            return challengeId === challenge.id
                || linkedArena.arenaId === challenge.challengerArenaId
                || linkedArena.arenaId === challenge.opponentArenaId;
        });
    };

    const getCompetitionChallengeStateCopy = (challenge: RelationshipCompetitionChallenge) => {
        const isWinner = Boolean(challenge.winnerUserId && challenge.winnerUserId === sessionUid);
        const isSealed = Boolean(challenge.sealedAt);
        const challengerDone = Boolean(challenge.challengerCompletedAt);
        const opponentDone = Boolean(challenge.opponentCompletedAt);
        const selfDone = challenge.challengerUserId === sessionUid ? challengerDone : opponentDone;
        const rivalDone = challenge.challengerUserId === sessionUid ? opponentDone : challengerDone;

        if (!challenge.winnerUserId) {
            return {
                badge: 'Corrida ativa',
                tone: 'text-rose-200',
                summary: 'Snapshot selado. Quem fechar primeiro leva o bonus do duelo.',
                selfDone,
                rivalDone,
                isSealed,
            };
        }

        if (isSealed) {
            return {
                badge: isWinner ? 'Vitoria selada' : 'Historico selado',
                tone: isWinner ? 'text-amber-200' : 'text-white',
                summary: isWinner
                    ? 'Voce venceu este duelo. Ele foi movido para o historico.'
                    : 'O duelo foi selado no historico.',
                selfDone,
                rivalDone,
                isSealed,
            };
        }

        if (isWinner) {
            return {
                badge: 'Aguardando rival',
                tone: 'text-amber-200',
                summary: 'Voce venceu. O rival ainda pode fechar a arena dele sem o bonus extra.',
                selfDone,
                rivalDone,
                isSealed,
            };
        }

        return {
            badge: selfDone ? 'Concluido sem bonus' : 'Rival venceu',
            tone: 'text-white',
            summary: selfDone
                ? 'Voce concluiu depois. O bonus de vencedor ja foi entregue.'
                : 'Seu rival venceu primeiro. Voce ainda pode fechar sua arena sem o bonus.',
            selfDone,
            rivalDone,
            isSealed,
        };
    };

    const currentTabLinks =
        activeTab === 'mentoria'
            ? [...mentorLinks, ...pupilLinks]
            : activeTab === 'parceria'
                ? partnershipLinks
                : competitionLinks;

    useEffect(() => {
        if (!selectedDetailLink) return;
        const refreshed = currentTabLinks.find((link) => link.id === selectedDetailLink.id) || null;
        if (!refreshed) {
            setSelectedDetailLink(null);
            return;
        }
        if (refreshed !== selectedDetailLink) {
            setSelectedDetailLink(refreshed);
        }
    }, [currentTabLinks, selectedDetailLink]);

    const resolvedSelectedDetailLink = selectedDetailLink
        ? currentTabLinks.find((link) => link.id === selectedDetailLink.id) || null
        : null;

    useEffect(() => {
        if (currentTabLinks.length === 0) {
            if (selectedDetailLink) {
                setSelectedDetailLink(null);
            }
            return;
        }

        if (!resolvedSelectedDetailLink) {
            setSelectedDetailLink(currentTabLinks[0]);
        }
    }, [currentTabLinks, resolvedSelectedDetailLink, selectedDetailLink]);

    const getRelationshipRoleCopy = (link: RelationshipLink) => {
        if (link.linkType === 'mentoria') {
            return link.mentorId === sessionUid
                ? {
                    badge: 'Pupilo',
                    subtitle: 'Voce conduz esta mentoria.',
                }
                : {
                    badge: 'Mentor',
                    subtitle: 'Esse vinculo e guiado pelo mentor.',
                };
        }

        if (link.linkType === 'parceria') {
            return {
                badge: 'Parceiro',
                subtitle: 'Parceria ativa.',
            };
        }

        return {
            badge: 'Rival',
            subtitle: 'Competicao ativa.',
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

    const getRelationshipSelectLabel = (link: RelationshipLink) => {
        const profile = otherParticipant(link);
        const arenasTotal = getArenaChipsForLink(link).length;
        const campaignsTotal = link.linkType === 'mentoria'
            ? (link.mentorId === sessionUid
                ? (mentorSentCodexesByLinkId[link.id] || []).length
                : (receivedCodexesByLinkId.get(link.id) || []).length)
            : 0;

        const baseName = profile?.nickname || LINK_LABELS[link.linkType].singular;
        if (link.linkType === 'mentoria') {
            return `${baseName} · ${arenasTotal} arena${arenasTotal === 1 ? '' : 's'} · ${campaignsTotal} campanha${campaignsTotal === 1 ? '' : 's'}`;
        }
        return `${baseName} · ${arenasTotal} arena${arenasTotal === 1 ? '' : 's'}`;
    };

    const renderRelationshipSelector = () => (
        <div className="rounded-[20px] border border-white/10 bg-black/18 px-3 py-3">
            <div className="flex items-center gap-2">
                <select
                    value={resolvedSelectedDetailLink?.id || ''}
                    onChange={(event) => {
                        const nextLink = currentTabLinks.find((link) => link.id === event.target.value) || null;
                        setSelectedDetailLink(nextLink);
                    }}
                    className="w-full rounded-[16px] border border-white/10 bg-black/22 px-3 py-3 text-sm font-black text-white outline-none focus:border-[var(--skin-accent-color)]/46"
                >
                    {currentTabLinks.length === 0 ? (
                        <option value="">Sem vínculos nesta aba</option>
                    ) : (
                        currentTabLinks.map((link) => (
                            <option key={link.id} value={link.id}>
                                {getRelationshipSelectLabel(link)}
                            </option>
                        ))
                    )}
                </select>
                <button
                    onClick={() => setInvitePickerType(activeTab as RelationshipLinkType)}
                    className="luxe-skin-button inline-flex h-[3rem] shrink-0 items-center justify-center gap-2 rounded-[16px] px-3"
                    title={LINK_LABELS[activeTab].action}
                >
                    <span className="text-lg leading-none">+</span>
                    <span className="rounded-full border border-black/10 bg-black/12 px-2 py-1 text-[9px] font-black leading-none">
                        {COIN_GLYPH} {LINK_LABELS[activeTab].cost}
                    </span>
                </button>
            </div>
        </div>
    );

    const ownedArenaIds = useMemo(() => {
        const ids = new Set<string>();
        assets.forEach((asset) => asset.arenas.forEach((arena) => ids.add(arena.id)));
        return ids;
    }, [assets]);

    const isArenaOwnedBySession = (linkedArena: LinkedRelationshipArena) => {
        const effectiveArenaId = linkedArena.arena?.id || linkedArena.arenaId || '';
        if (linkedArena.createdByUserId) {
            return linkedArena.createdByUserId === sessionUid;
        }
        return effectiveArenaId ? ownedArenaIds.has(effectiveArenaId) : false;
    };

    const assetNameForArena = (linkedArena?: LinkedRelationshipArena | null) => {
        const assetId = linkedArena?.arena?.assetId || String(linkedArena?.metadata?.asset_id || '');
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
        return 'Ativo vinculado';
    };
    const getArenaPreviewForLink = (linkedArena: LinkedRelationshipArena): Arena => (
        linkedArena.arena || {
            id: linkedArena.arenaId || `linked-preview-${linkedArena.id}`,
            assetId: String(linkedArena.metadata?.asset_id || 'geral'),
            name: String(linkedArena.metadata?.name || 'Arena vinculada'),
            description: String(linkedArena.metadata?.description || ''),
            icon: String(linkedArena.metadata?.icon || '\u{1F3DB}\uFE0F'),
            actionIds: [],
            isArchived: false,
        }
    );

    const getLiveOwnedArena = (arenaId: string) =>
        assets.flatMap((asset) => asset.arenas).find((arena) => arena.id === arenaId) || null;

    const buildArenaDetailState = (linkedArena: LinkedRelationshipArena): RelationshipArenaDetailState => {
        const previewArena = getArenaPreviewForLink(linkedArena);
        const liveOwnedArena = ownedArenaIds.has(previewArena.id) ? getLiveOwnedArena(previewArena.id) : null;
        const relationshipLink = links.find((link) => link.id === linkedArena.relationshipLinkId) || null;
        const effectiveLinkType = relationshipLink?.linkType || linkedArena.linkType || null;
        const mentorId = relationshipLink?.mentorId || linkedArena.mentorId || null;
        const pupilId = relationshipLink?.pupilId || linkedArena.pupilId || String(linkedArena.metadata?.owner_user_id || '') || null;
        const collaborationRole = effectiveLinkType === 'mentoria'
            ? (mentorId === sessionUid ? 'mentor' : pupilId === sessionUid ? 'pupil' : null)
            : null;
        const canMentorshipCollaborate = Boolean(
            effectiveLinkType === 'mentoria'
            && (collaborationRole === 'pupil' || collaborationRole === 'mentor')
        );
        const shouldForceHubMentorshipMode = Boolean(
            effectiveLinkType === 'mentoria'
            && collaborationRole === 'mentor'
        );
        const shouldForceCompetitionPreview = effectiveLinkType === 'competicao';
        const collaborativeOwnerUserId = effectiveLinkType === 'mentoria'
            ? pupilId
            : null;

        if (liveOwnedArena && !shouldForceHubMentorshipMode && !shouldForceCompetitionPreview) {
            return {
                arena: liveOwnedArena,
                actions: linkedArena.actions || [],
                tasks: linkedArena.tasks || [],
                readOnly: false,
                relationshipLinkId: linkedArena.relationshipLinkId,
                relationshipLinkType: effectiveLinkType,
                collaborationRole,
                allowLinkedMentorshipEdit: false,
                collaborativeOwnerUserId,
            };
        }

        return {
            arena: previewArena,
            actions: linkedArena.actions || [],
            tasks: linkedArena.tasks || [],
            readOnly: effectiveLinkType === 'competicao' ? true : !canMentorshipCollaborate,
            relationshipLinkId: linkedArena.relationshipLinkId,
            relationshipLinkType: effectiveLinkType,
            collaborationRole,
            allowLinkedMentorshipEdit: canMentorshipCollaborate,
            collaborativeOwnerUserId,
        };
    };

    const openLinkedArena = (linkedArena: LinkedRelationshipArena) => {
        setSelectedArenaDetail(buildArenaDetailState(linkedArena));
    };

    useEffect(() => {
        if (!selectedArenaDetail?.relationshipLinkId) return;

        const currentArenaId = selectedArenaDetail.arena.id;
        const matchingArena = linkedArenas.find((linkedArena) => {
            if (linkedArena.relationshipLinkId !== selectedArenaDetail.relationshipLinkId) return false;
            const linkedArenaId = linkedArena.arena?.id || linkedArena.arenaId;
            return linkedArenaId === currentArenaId;
        });

        if (!matchingArena) return;
        setSelectedArenaDetail(buildArenaDetailState(matchingArena));
    }, [linkedArenas, selectedArenaDetail?.arena.id, selectedArenaDetail?.relationshipLinkId]);

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
                    <CompactPill label="ativas" value={activeCount} tone="text-white" />
                </div>
            </GlassCard>
        );
    };

    const renderRelationshipCards = () => (
        <RelationshipSectionCard
            eyebrow="Seletor"
            title={activeTab === 'mentoria' ? 'Escolha uma mentoria' : activeTab === 'parceria' ? 'Escolha uma parceria' : 'Escolha uma competicao'}
            description={activeTab === 'mentoria'
                ? 'Toque em um vinculo para ver so as arenas e campanhas daquela mentoria logo abaixo.'
                : 'Toque em um vinculo para ver so o conteudo daquele vinculo logo abaixo.'}
        >
            {currentTabLinks.length === 0 ? (
                <EmptyState title="Sem vinculos" text="Nada ativo nesta aba." />
            ) : (
                <div className="space-y-3">
                    {[
                        ...currentTabLinks.filter((link) => resolvedSelectedDetailLink?.id === link.id),
                        ...currentTabLinks.filter((link) => resolvedSelectedDetailLink?.id !== link.id),
                    ].map((link) => {
                        const profile = otherParticipant(link);
                        const role = getRelationshipRoleCopy(link);
                        const arenasForLink = getArenaChipsForLink(link);
                        const isSelected = resolvedSelectedDetailLink?.id === link.id;
                        return (
                            <button
                                key={link.id}
                                onClick={() => setSelectedDetailLink(isSelected ? null : link)}
                                className={`w-full rounded-[20px] border p-3 text-left shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition-all ${
                                    isSelected
                                        ? 'border-[var(--skin-accent-color)]/34 bg-[var(--skin-accent-color)]/12'
                                        : 'border-white/12 bg-black/20 hover:bg-black/26'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <AvatarPill profile={profile} fallback="?" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="truncate text-sm font-black text-white">{profile?.nickname || 'Aliado'}</div>
                                            {isSelected ? (
                                                <span className="rounded-full border border-[var(--skin-accent-color)]/20 bg-[var(--skin-accent-color)]/12 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[var(--skin-accent-color)]">
                                                    Selecionado
                                                </span>
                                            ) : (
                                                <ChevronRightIcon className="w-4 h-4 shrink-0 text-white/38" />
                                            )}
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
            )}
        </RelationshipSectionCard>
    );

    const renderInviteSection = () => {
        if (filteredInvites.length === 0) return null;

        return (
            <RelationshipSectionCard
                eyebrow="Convites"
                title="Pendentes dessa aba"
                action={
                    <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                        {filteredInvites.length}
                    </div>
                }
            >
                <div className="space-y-3">
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
                </div>
            </RelationshipSectionCard>
        );
    };

    const renderLinkDetail = (link: RelationshipLink) => {
        const profile = otherParticipant(link);
        const arenasForLink = getArenaChipsForLink(link);
        const isMentorSide = link.linkType === 'mentoria' && link.mentorId === sessionUid;
        const mentorProfile = profileFor(link.mentorId) || (link.mentorId === sessionUid ? toProfileLite(userProfile) : null);
        const pupilProfile = profileFor(link.pupilId) || (link.pupilId === sessionUid ? toProfileLite(userProfile) : null);

        if (link.linkType === 'mentoria') {
            const relationshipCodexes = isMentorSide
                ? mentorSentCodexesByLinkId[link.id] || []
                : receivedCodexesByLinkId.get(link.id) || [];
            const hasMentorshipContent = arenasForLink.length > 0 || relationshipCodexes.length > 0;
            return (
                <div className={`space-y-3 ${isMentorSide ? 'pb-24' : ''}`}>
                    <RelationshipSectionCard
                        eyebrow="Mentoria"
                        title={isMentorSide ? (pupilProfile?.nickname || 'Pupilo') : (mentorProfile?.nickname || 'Mentor')}
                        action={
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/58">
                                    {arenasForLink.length} arena{arenasForLink.length === 1 ? '' : 's'}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/58">
                                    {relationshipCodexes.length} campanha{relationshipCodexes.length === 1 ? '' : 's'}
                                </span>
                                <button
                                    onClick={() => setEndLinkConfirmState(link)}
                                    disabled={busyKey === `end-link:${link.id}`}
                                    className="rounded-full border border-red-300/18 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-100/88 transition-all hover:bg-red-500/14 disabled:opacity-50"
                                >
                                    Encerrar
                                </button>
                            </div>
                        }
                    >
                        {!hasMentorshipContent ? (
                            <EmptyState
                                title="Sem conteudo"
                                text={isMentorSide
                                    ? 'Abra uma arena ou entregue uma campanha para este pupilo.'
                                    : 'Nenhuma arena ou campanha desta mentoria apareceu ainda.'}
                            />
                        ) : (
                            <div className="space-y-4">
                                {arenasForLink.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/56">
                                                Arenas
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/38">
                                                {arenasForLink.length} no vinculo
                                            </span>
                                        </div>
                                        <div
                                            className="overflow-x-auto overflow-y-hidden overscroll-x-contain hide-scrollbar pb-1.5"
                                            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pinch-zoom', overscrollBehaviorX: 'contain' }}
                                        >
                                            <div className="grid min-w-max grid-flow-col grid-rows-1 auto-cols-[7.35rem] gap-2.5 px-0.5 pt-0.5">
                                                {arenasForLink.map((linkedArena) => (
                                                    <RelationshipArenaBoardCard
                                                        key={linkedArena.id}
                                                        arena={linkedArena}
                                                        assetName={assetNameForArena(linkedArena)}
                                                        onClick={() => openLinkedArena(linkedArena)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {relationshipCodexes.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/56">
                                                Campanhas
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/38">
                                                {relationshipCodexes.length} entregue{relationshipCodexes.length === 1 ? '' : 's'}
                                            </span>
                                        </div>
                                        <div
                                            className="overflow-x-auto overflow-y-hidden overscroll-x-contain hide-scrollbar pb-1.5"
                                            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pinch-zoom', overscrollBehaviorX: 'contain' }}
                                        >
                                            <div className="grid min-w-max grid-flow-col grid-rows-1 auto-cols-[13.6rem] gap-2.5 px-0.5 pt-0.5">
                                            {relationshipCodexes.map((codex: UserCodex) => {
                                                const installed = !isMentorSide && installedOriginCodexIds.has(codex.id);
                                                const preview = receivedCodexPreviewById.get(codex.id) || (
                                                    Array.isArray(codex.template?.levels) && codex.template.levels.length > 0
                                                        ? buildCodexCampaignPreview(
                                                            codex.id,
                                                            {
                                                                ...codex.template,
                                                                title: codex.template?.title || codex.name || 'Campanha recebida',
                                                                description: codex.template?.description || codex.description || '',
                                                            },
                                                            `__relationship_codex_preview_${codex.id}__`
                                                        )
                                                        : null
                                                );
                                                return (
                                                    <MentorshipCampaignBoardCard
                                                        key={codex.id}
                                                        title={codex.name}
                                                        subtitle={isMentorSide ? 'Entregue por voce neste vinculo.' : 'Toque para abrir e instalar no app.'}
                                                        preview={preview}
                                                        onClick={() => {
                                                            if (preview) {
                                                                setSelectedRelationshipCampaign({ codex, preview });
                                                                return;
                                                            }
                                                            showToast('Nao foi possivel abrir essa campanha agora.', 'warning');
                                                        }}
                                                        badge={
                                                            installed ? (
                                                                <span className="rounded-full border border-emerald-300/18 bg-emerald-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-200">
                                                                    No app
                                                                </span>
                                                            ) : isMentorSide ? (
                                                                <span className="rounded-full border border-cyan-300/18 bg-cyan-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200">
                                                                    Entregue
                                                                </span>
                                                            ) : (
                                                                <span className="rounded-full border border-white/12 bg-white/8 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/76">
                                                                    Na biblioteca
                                                                </span>
                                                            )
                                                        }
                                                        className="w-[13.6rem] shrink-0"
                                                    />
                                                );
                                            })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </RelationshipSectionCard>

                    {isMentorSide && (
                        <div className="sticky bottom-3 z-10 flex justify-end pointer-events-none">
                            <div className="pointer-events-auto flex flex-col gap-2">
                                <button
                                    onClick={() => setSelectedMentorLinkForArena(link)}
                                    className="luxe-skin-button inline-flex items-center justify-between gap-3 rounded-[18px] px-4 py-3 text-left shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-[0.16em]">Nova arena</span>
                                    <span className="rounded-full border border-black/10 bg-black/12 px-2 py-1 text-[10px] font-black leading-none">
                                        {COIN_GLYPH} {MENTOR_LINKED_ARENA_GOLD_COST}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setSelectedPupilLink(link)}
                                    className="inline-flex items-center justify-between gap-3 rounded-[18px] border border-cyan-300/18 bg-cyan-400/12 px-4 py-3 text-left text-cyan-100 shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition-all hover:bg-cyan-400/16"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-[0.16em]">Nova campanha</span>
                                    <span className="rounded-full border border-cyan-200/18 bg-cyan-950/22 px-2 py-1 text-[10px] font-black leading-none text-cyan-100">
                                        {COIN_GLYPH} {MENTOR_CAMPAIGN_FORGE_GOLD_COST}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        const isPartnership = link.linkType === 'parceria';
        const ownArenasForLink = arenasForLink.filter((linkedArena) => isArenaOwnedBySession(linkedArena));
        const partnerArenasForLink = arenasForLink.filter((linkedArena) => !isArenaOwnedBySession(linkedArena));

        if (isPartnership) {
            return (
                <div className="space-y-3 pb-20">
                    <RelationshipSectionCard
                        eyebrow="Parceria"
                        title={profile?.nickname || 'Parceiro'}
                        action={
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border border-cyan-300/18 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
                                    {ownArenasForLink.length} sua{ownArenasForLink.length === 1 ? '' : 's'}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                                    {partnerArenasForLink.length} dele
                                </span>
                                <button
                                    onClick={() => setEndLinkConfirmState(link)}
                                    disabled={busyKey === `end-link:${link.id}`}
                                    className="rounded-full border border-red-300/18 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-100/88 transition-all hover:bg-red-500/14 disabled:opacity-50"
                                >
                                    Encerrar
                                </button>
                            </div>
                        }
                    >
                        {ownArenasForLink.length === 0 ? (
                            <EmptyState title="Sem arena sua" text="Exponha uma arena sua." />
                        ) : (
                            <div
                                className="flex min-w-max gap-2 overflow-x-auto pb-1.5 pr-1 custom-scrollbar"
                                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pinch-zoom', overscrollBehaviorX: 'contain' }}
                            >
                                {ownArenasForLink.map((linkedArena) => (
                                    <RelationshipArenaBoardCard
                                        key={linkedArena.id}
                                        arena={linkedArena}
                                        assetName={assetNameForArena(linkedArena)}
                                        onClick={() => openLinkedArena(linkedArena)}
                                    />
                                ))}
                            </div>
                        )}
                    </RelationshipSectionCard>

                    <RelationshipSectionCard
                        eyebrow="Lado do aliado"
                        title={`${profile?.nickname || 'Parceiro'}`}
                        action={
                            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                                {partnerArenasForLink.length} arena{partnerArenasForLink.length === 1 ? '' : 's'}
                            </span>
                        }
                    >
                        {partnerArenasForLink.length === 0 ? (
                            <EmptyState title="Sem arena do aliado" text="O parceiro ainda nao expôs nenhuma arena." />
                        ) : (
                            <div
                                className="flex min-w-max gap-2 overflow-x-auto pb-1.5 pr-1 custom-scrollbar"
                                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pinch-zoom', overscrollBehaviorX: 'contain' }}
                            >
                                {partnerArenasForLink.map((linkedArena) => (
                                    <RelationshipArenaBoardCard
                                        key={linkedArena.id}
                                        arena={linkedArena}
                                        assetName={assetNameForArena(linkedArena)}
                                        onClick={() => openLinkedArena(linkedArena)}
                                    />
                                ))}
                            </div>
                        )}
                    </RelationshipSectionCard>

                    <div className="sticky bottom-0 z-10 flex justify-end pointer-events-none">
                        <div className="pointer-events-auto flex flex-col gap-2">
                            <button
                                onClick={() => {
                                    setSelectedMentorLinkForArena(link);
                                    setSelectedPartnershipArenaId(null);
                                }}
                                className="luxe-skin-button inline-flex items-center justify-between gap-3 rounded-[18px] px-4 py-3 text-left shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.16em]">Expor arena</span>
                                <span className="rounded-full border border-black/10 bg-black/12 px-2 py-1 text-[10px] font-black leading-none">
                                    {COIN_GLYPH} {PARTNERSHIP_LINKED_ARENA_GOLD_COST}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        const competitionChallengesForLink = getCompetitionChallengesForLink(link.id);
        const openCompetitionChallenges = competitionChallengesForLink.filter((challenge) => !challenge.sealedAt);
        const sealedCompetitionChallenges = competitionChallengesForLink.filter((challenge) => Boolean(challenge.sealedAt));
        const competitionCanLaunch = openCompetitionChallenges.length < 3;

        return (
            <div className="space-y-3 pb-20">
                <RelationshipSectionCard
                    eyebrow="Competicao"
                    title={profile?.nickname || 'Rival'}
                    action={
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-rose-300/18 bg-rose-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-200">
                                {openCompetitionChallenges.length}/3 abertos
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                                {sealedCompetitionChallenges.length} selados
                            </span>
                            <button
                                onClick={() => setEndLinkConfirmState(link)}
                                disabled={busyKey === `end-link:${link.id}`}
                                className="rounded-full border border-red-300/18 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-100/88 transition-all hover:bg-red-500/14 disabled:opacity-50"
                            >
                                Encerrar
                            </button>
                        </div>
                    }
                >
                    {!competitionCanLaunch && (
                        <div className="mb-3 rounded-[16px] border border-rose-300/14 bg-rose-500/10 px-4 py-3 text-[12px] text-white/60">
                            Este vinculo ja tem 3 duelos abertos. Feche ou sele um deles antes de forjar outro.
                        </div>
                    )}
                    {openCompetitionChallenges.length === 0 ? (
                        <EmptyState title="Sem duelo aberto" text="Forje uma arena sua para abrir a corrida." />
                    ) : (
                        <div className="space-y-3">
                            {openCompetitionChallenges.map((challenge) => {
                                const challengeArenas = getCompetitionArenasForChallenge(link, challenge);
                                const ownCompetitionArena = challengeArenas.find((linkedArena) => isArenaOwnedBySession(linkedArena)) || null;
                                const rivalCompetitionArena = challengeArenas.find((linkedArena) => !isArenaOwnedBySession(linkedArena)) || null;
                                const winnerProfile = challenge.winnerUserId
                                    ? (challenge.winnerUserId === sessionUid ? toProfileLite(userProfile) : profileFor(challenge.winnerUserId))
                                    : null;
                                const challengeName = String(challenge.metadata?.source_name || ownCompetitionArena?.arena?.name || rivalCompetitionArena?.arena?.name || 'Duelo espelhado');
                                const actionCount = Number(challenge.metadata?.action_count || 0);
                                const plannedTotal = Number(challenge.metadata?.planned_total || 0);
                                const stateCopy = getCompetitionChallengeStateCopy(challenge);

                                return (
                                    <GlassCard key={challenge.id} className="rounded-[20px] border border-white/12 bg-black/18 p-3 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-black uppercase tracking-[0.12em] text-white">{challengeName}</div>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <CompactPill label="estado" value={stateCopy.badge} tone={stateCopy.tone} />
                                                        {actionCount > 0 && <CompactPill label="acoes" value={String(actionCount)} tone="text-white" />}
                                                        {plannedTotal > 0 && <CompactPill label="meta" value={String(plannedTotal)} tone="text-white" />}
                                                        {winnerProfile && <CompactPill label="vencedor" value={winnerProfile.nickname} tone="text-amber-200" />}
                                                    </div>
                                                </div>
                                                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                                                    {formatDate(challenge.createdAt) || 'agora'}
                                                </span>
                                            </div>

                                            <div className="rounded-[16px] border border-white/10 bg-black/20 px-3 py-3 text-[12px] text-white/62">
                                                {stateCopy.summary}
                                                {challenge.rewardChestType && (
                                                    <span className="block mt-1 text-white/48">
                                                        Bau {challenge.rewardChestType}{challenge.winnerBonusXp ? ` + ${challenge.winnerBonusXp} EXP de duelo` : ''}.
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div className="rounded-[16px] border border-white/10 bg-black/16 p-2.5">
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Seu lado</div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                                                            {stateCopy.selfDone ? 'concluida' : ownCompetitionArena ? 'pronta' : 'sem arena'}
                                                        </span>
                                                    </div>
                                                    {ownCompetitionArena ? (
                                                        <RelationshipArenaBoardCard
                                                            arena={ownCompetitionArena}
                                                            assetName={assetNameForArena(ownCompetitionArena)}
                                                            onClick={() => openLinkedArena(ownCompetitionArena)}
                                                            className="w-full"
                                                        />
                                                    ) : (
                                                        <EmptyState title="Sem arena sua" text="Esse snapshot ainda nao apareceu no seu lado." />
                                                    )}
                                                </div>

                                                <div className="rounded-[16px] border border-white/10 bg-black/16 p-2.5">
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Rival</div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-200">
                                                            {stateCopy.rivalDone ? 'concluida' : rivalCompetitionArena ? 'pronta' : 'aguardando'}
                                                        </span>
                                                    </div>
                                                    {rivalCompetitionArena ? (
                                                        <RelationshipArenaBoardCard
                                                            arena={rivalCompetitionArena}
                                                            assetName={assetNameForArena(rivalCompetitionArena)}
                                                            onClick={() => openLinkedArena(rivalCompetitionArena)}
                                                            className="w-full"
                                                        />
                                                    ) : (
                                                        <EmptyState title="Sem arena rival" text="Ela aparece quando o snapshot termina de propagar." />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                );
                            })}
                        </div>
                    )}
                </RelationshipSectionCard>

                <RelationshipSectionCard
                    eyebrow="Historico"
                    title="Duelos selados"
                    action={
                        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                            {sealedCompetitionChallenges.length} selo{sealedCompetitionChallenges.length === 1 ? '' : 's'}
                        </span>
                    }
                >
                    {sealedCompetitionChallenges.length === 0 ? (
                        <EmptyState title="Sem historico" text="Quando os dois fecharem o mesmo duelo, ele sobe para este arquivo." />
                    ) : (
                        <div className="space-y-3">
                            {sealedCompetitionChallenges.map((challenge) => {
                                const challengeArenas = getCompetitionArenasForChallenge(link, challenge);
                                const ownCompetitionArena = challengeArenas.find((linkedArena) => isArenaOwnedBySession(linkedArena)) || null;
                                const rivalCompetitionArena = challengeArenas.find((linkedArena) => !isArenaOwnedBySession(linkedArena)) || null;
                                const winnerProfile = challenge.winnerUserId
                                    ? (challenge.winnerUserId === sessionUid ? toProfileLite(userProfile) : profileFor(challenge.winnerUserId))
                                    : null;
                                const challengeName = String(challenge.metadata?.source_name || ownCompetitionArena?.arena?.name || rivalCompetitionArena?.arena?.name || 'Duelo espelhado');

                                return (
                                    <div key={challenge.id} className="rounded-[18px] border border-white/10 bg-black/18 px-4 py-3">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-white">{challengeName}</div>
                                                <div className="mt-1 text-[11px] text-white/54">
                                                    {winnerProfile
                                                        ? `Vencedor: ${winnerProfile.nickname}${challenge.rewardChestType ? ` • Bau ${challenge.rewardChestType}` : ''}${challenge.winnerBonusXp ? ` • +${challenge.winnerBonusXp} EXP` : ''}`
                                                        : 'Duelo arquivado.'}
                                                </div>
                                            </div>
                                            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                                                {formatDate(challenge.sealedAt || challenge.completedAt || challenge.createdAt) || 'agora'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    </RelationshipSectionCard>

                {competitionCanLaunch && (
                    <div className="sticky bottom-0 z-10 flex justify-end pointer-events-none">
                        <div className="pointer-events-auto flex flex-col gap-2">
                            <button
                                onClick={() => {
                                    setSelectedCompetitionLinkForChallenge(link);
                                    setSelectedCompetitionSourceArenaId(null);
                                }}
                                className="luxe-skin-button inline-flex items-center justify-between gap-3 rounded-[18px] px-4 py-3 text-left shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.16em]">
                                    {competitionChallengesForLink.length > 0 ? 'Forjar novo duelo' : 'Forjar primeiro duelo'}
                                </span>
                                <span className="rounded-full border border-black/10 bg-black/12 px-2 py-1 text-[10px] font-black leading-none">
                                    {COIN_GLYPH} {COMPETITION_DUEL_GOLD_COST}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Portal>
                <div className="ui-modal-backdrop z-[140]" onClick={onClose}>
                    <GlassCard
                        variant="neutral"
                        className="relationship-hub-modal relationship-hub-sheet ui-modal-panel w-full max-w-[34rem] lg:max-w-[36rem] max-h-[92vh] overflow-hidden"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="relative h-full">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.75),rgba(255,255,255,0.14)_25%,transparent_60%)] pointer-events-none" />
                            <div className="relative z-10 flex h-full max-h-[92vh] flex-col">
                                <div className="border-b border-white/10 px-4 py-2 md:px-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/24 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/46">
                                                <SparklesIcon className="w-3.5 h-3.5" />
                                                <span>Central de vínculos</span>
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

                                    <div className="mt-1.5 grid grid-cols-3 gap-2">
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

                                <div className="flex-1 overflow-y-auto p-2.5 md:p-3 custom-scrollbar">
                                    {isRefreshing && !loading && (
                                        <div className="mb-3 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/46">
                                            Atualizando central...
                                        </div>
                                    )}
                                    {error && (
                                        <div className="mb-4 rounded-[22px] border border-red-400/18 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
                                            {error}
                                        </div>
                                    )}

                                    {loading ? (
                                        <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-5 text-center">
                                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/38">
                                                Central de vínculos
                                            </div>
                                            <div className="mt-2 text-sm font-semibold text-white/82">
                                                Carregando vínculos...
                                            </div>
                                            <div className="mt-2 text-[11px] text-white/42">
                                                Abrindo mentorias, arenas e campanhas sem travar o modal.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {renderRelationshipSelector()}
                                            {renderInviteSection()}
                                            {resolvedSelectedDetailLink ? renderLinkDetail(resolvedSelectedDetailLink) : (
                                                <div className="rounded-[18px] border border-dashed border-white/10 bg-black/14 px-4 py-4 text-[11px] font-semibold text-white/42">
                                                    Nenhum vinculo ativo nesta aba.
                                                </div>
                                            )}
                                        </div>
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

            {inviteConfirmState && (
                <RelationshipInviteConfirmModal
                    state={inviteConfirmState}
                    summary={summary}
                    busy={busyKey === `confirm:${inviteConfirmState.linkType}:${inviteConfirmState.friendId}`}
                    onClose={() => setInviteConfirmState(null)}
                    onConfirm={handleConfirmInviteSend}
                />
            )}

            {endLinkConfirmState && (
                <RelationshipEndConfirmModal
                    link={endLinkConfirmState}
                    profile={otherParticipant(endLinkConfirmState)}
                    busy={busyKey === `end-link:${endLinkConfirmState.id}`}
                    onClose={() => setEndLinkConfirmState(null)}
                    onConfirm={handleConfirmEndLink}
                />
            )}

            {selectedPupilLink && (
                <Portal>
                    <div className="ui-modal-backdrop z-[181]" onClick={() => setSelectedPupilLink(null)}>
                        <GlassCard
                            variant="neutral"
                            className="relationship-hub-sheet ui-modal-panel w-full max-w-md p-4"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="ui-modal-eyebrow text-white/52">Mentoria</div>
                                    <h3 className="ui-modal-title mt-1 text-left text-white">
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
                                        <p className="mt-1 text-sm text-white/58">Cria algo novo para {profileFor(selectedPupilLink.pupilId)?.nickname || 'o pupilo'}.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsMentorCreatorOpen(true)}
                                        className="shrink-0 luxe-skin-button rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
                                    >
                                        Nova · {COIN_GLYPH} {MENTOR_CAMPAIGN_FORGE_GOLD_COST}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Escolher das minhas campanhas</div>
                                <div className="mt-3 space-y-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                                    {authoredCodexes.length === 0 ? (
                                        <EmptyState title="Sem campanha" text="Finalize uma campanha autoral para poder enviar." />
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

            {selectedCompetitionLinkForChallenge && (
                <Portal>
                    <div className="fixed inset-0 z-[181] flex items-center justify-center bg-black/78 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedCompetitionLinkForChallenge(null)}>
                        <GlassCard
                            variant="neutral"
                            className="relationship-hub-sheet w-full max-w-md rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(208,214,224,0.94)_0%,rgba(114,123,138,0.82)_20%,rgba(28,34,45,0.92)_56%,rgba(8,10,14,0.98)_100%)] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.38)]"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/42">Competicao</div>
                                    <h3 className="mt-1 text-base font-black uppercase tracking-[0.14em] text-white">
                                        Forjar duelo contra {otherParticipant(selectedCompetitionLinkForChallenge)?.nickname || 'seu rival'}
                                    </h3>
                                </div>
                                <button onClick={() => setSelectedCompetitionLinkForChallenge(null)} className="rounded-full border border-white/12 bg-black/20 p-2 text-white/70 hover:text-white">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-4 rounded-[20px] border border-rose-300/14 bg-rose-500/8 px-4 py-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-200">Duelo espelhado</div>
                                <p className="mt-1 text-sm text-white/62">
                                    Escolha uma arena autoral sua. O sistema sela um snapshot para cada lado e cobra {COIN_GLYPH} {COMPETITION_DUEL_GOLD_COST}.
                                </p>
                            </div>

                            <div className="mt-4 space-y-2 max-h-[44vh] overflow-y-auto pr-1 custom-scrollbar">
                                {availableCompetitionSourceArenas.length === 0 ? (
                                    <EmptyState title="Sem arena elegivel" text="Crie uma arena com acoes." />
                                ) : (
                                    availableCompetitionSourceArenas.map(({ arena, assetName, actionCount }) => {
                                        const active = selectedCompetitionSourceArenaId === arena.id;
                                        return (
                                            <button
                                                key={arena.id}
                                                id={`relationship-competition-source-${arena.id}`}
                                                onClick={() => setSelectedCompetitionSourceArenaId(arena.id)}
                                                className={`w-full rounded-[18px] border px-3 py-3 text-left transition-all ${active ? 'border-rose-300/40 bg-rose-500/14' : 'border-white/10 bg-black/22 hover:bg-black/28'}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-black text-white">{arena.icon} {arena.name}</div>
                                                        <div className="mt-1 text-[11px] text-white/52">{assetName}</div>
                                                    </div>
                                                    <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/76">
                                                        {actionCount} ações
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => setSelectedCompetitionLinkForChallenge(null)}
                                    className="luxe-button-secondary w-full rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    id="relationship-competition-submit-button"
                                    onClick={handleCreateCompetitionChallenge}
                                    disabled={!selectedCompetitionSourceArenaId || busyKey === `competition-challenge:${selectedCompetitionLinkForChallenge.id}`}
                                    className="luxe-skin-button inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] disabled:opacity-50"
                                >
                                    {busyKey === `competition-challenge:${selectedCompetitionLinkForChallenge.id}` ? 'Forjando...' : `Forjar duelo · ${COIN_GLYPH} ${COMPETITION_DUEL_GOLD_COST}`}
                                </button>
                            </div>
                        </GlassCard>
                    </div>
                </Portal>
            )}

            {selectedMentorLinkForArena && (
                <Portal>
                    <div className="fixed inset-0 z-[181] flex items-center justify-center bg-black/78 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedMentorLinkForArena(null)}>
                        <GlassCard
                            variant="neutral"
                            className="relationship-hub-sheet w-full max-w-md rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(208,214,224,0.94)_0%,rgba(114,123,138,0.82)_20%,rgba(28,34,45,0.92)_56%,rgba(8,10,14,0.98)_100%)] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.38)]"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/42">
                                        {selectedMentorLinkForArena.linkType === 'parceria' ? 'Parceria' : 'Arena vinculada'}
                                    </div>
                                    <h3 className="mt-1 text-base font-black uppercase tracking-[0.14em] text-white">
                                        {selectedMentorLinkForArena.linkType === 'parceria'
                                            ? `Expor para ${otherParticipant(selectedMentorLinkForArena)?.nickname || 'seu parceiro'}`
                                            : `Compartilhar com ${profileFor(selectedMentorLinkForArena.pupilId)?.nickname || 'pupilo'}`}
                                    </h3>
                                </div>
                                <button onClick={() => setSelectedMentorLinkForArena(null)} className="rounded-full border border-white/12 bg-black/20 p-2 text-white/70 hover:text-white">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-4 space-y-3">
                                {selectedMentorLinkForArena.linkType === 'parceria' ? (
                                    <>
                                        <div className="rounded-[20px] border border-cyan-300/14 bg-cyan-500/8 px-4 py-3">
                                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Vitrine viva</div>
                                            <p className="mt-1 text-sm text-white/62">
                                                Escolha uma arena existente sua. O parceiro le a mesma arena em tempo real.
                                            </p>
                                        </div>

                                        <div className="space-y-2 max-h-[44vh] overflow-y-auto pr-1 custom-scrollbar">
                                            {availablePartnershipSourceArenas.length === 0 ? (
                                                <EmptyState title="Sem arena elegivel" text="Voce ja expôs tudo ou so restaram arenas arquivadas." />
                                            ) : (
                                                availablePartnershipSourceArenas.map(({ arena, assetName, actionCount }) => {
                                                    const active = selectedPartnershipArenaId === arena.id;
                                                    return (
                                                        <button
                                                            key={arena.id}
                                                            id={`relationship-partnership-source-${arena.id}`}
                                                            onClick={() => setSelectedPartnershipArenaId(arena.id)}
                                                            className={`w-full rounded-[18px] border px-3 py-3 text-left transition-all ${active ? 'border-cyan-300/40 bg-cyan-500/14' : 'border-white/10 bg-black/22 hover:bg-black/28'}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <div className="truncate text-sm font-black text-white">{arena.icon} {arena.name}</div>
                                                                    <div className="mt-1 text-[11px] text-white/52">{assetName}</div>
                                                                </div>
                                                                <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/76">
                                                                    {actionCount} ações
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {selectedPartnershipArenaId && (
                                            <div className="rounded-[18px] border border-cyan-300/14 bg-cyan-500/8 px-4 py-3 text-[11px] text-cyan-50/88">
                                                O parceiro vai ver essa mesma arena em leitura ao vivo. Se quiser parar depois, basta retirar da vitrine.
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
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
                                    </>
                                )}

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
                                        disabled={busyKey === `linked-arena:${selectedMentorLinkForArena.id}` || (selectedMentorLinkForArena.linkType === 'parceria' && !selectedPartnershipArenaId)}
                                        className="luxe-skin-button inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] disabled:opacity-50"
                                    >
                                        <span>{selectedMentorLinkForArena.linkType === 'parceria' ? 'Expor arena' : 'Criar arena'}</span>
                                        <span className="rounded-full border border-black/10 bg-black/12 px-2 py-1 text-[9px] leading-none">
                                            {COIN_GLYPH} {selectedMentorLinkForArena.linkType === 'parceria' ? PARTNERSHIP_LINKED_ARENA_GOLD_COST : MENTOR_LINKED_ARENA_GOLD_COST}
                                        </span>
                                    </button>
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
                    linkedRelationshipLinkId={selectedArenaDetail.relationshipLinkId}
                    linkedRelationshipType={selectedArenaDetail.relationshipLinkType || null}
                    collaborativeRole={selectedArenaDetail.collaborationRole || null}
                    allowLinkedMentorshipEdit={selectedArenaDetail.allowLinkedMentorshipEdit}
                    collaborativeOwnerUserId={selectedArenaDetail.collaborativeOwnerUserId || null}
                    onLinkedArenaRefresh={refreshHub}
                    onClose={() => setSelectedArenaDetail(null)}
                />
            )}
            {selectedRelationshipCampaign && (
                <CampaignsCodex
                    onClose={() => setSelectedRelationshipCampaign(null)}
                    initialCampaignId={selectedRelationshipCampaign.preview.campaign.id}
                    previewCampaign={selectedRelationshipCampaign.preview.campaign}
                    previewArenas={selectedRelationshipCampaign.preview.arenas}
                    previewActions={selectedRelationshipCampaign.preview.actions}
                    onDeletePreviewCampaign={() => handleDeleteMentorshipCodex(selectedRelationshipCampaign.codex)}
                />
            )}
        </>
    );
};
