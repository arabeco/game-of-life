import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import type {
  Arena,
  LinkedRelationshipArena,
  RelationshipCompetitionChallenge,
  RelationshipInviteAction,
  RelationshipLink,
  RelationshipLinkInvite,
  RelationshipLinkType,
  UserProfile,
} from '../types';
import { supabase } from '../supabaseClient';
import { APP_NAVIGATE_EVENT, type AppNavigatePayload } from '../utils/arenaAttention';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { CheckIcon, MessageIcon, PlusIcon, RefreshCwIcon, TrashIcon, TrophyIcon, UsersIcon, XIcon } from './Icons';

type VisibleConnectionType = Extract<RelationshipLinkType, 'mentoria' | 'parceria' | 'competicao'>;
type ProfileLite = Pick<UserProfile, 'id' | 'nickname' | 'avatarUrl' | 'level'>;

const typeCopy: Record<VisibleConnectionType, { label: string; invite: string; description: string }> = {
  mentoria: {
    label: 'Mentoria',
    invite: 'Orientar alguem',
    description: 'Uma pessoa acompanha o progresso e ajuda a ajustar o caminho.',
  },
  parceria: {
    label: 'Parceria',
    invite: 'Criar parceria',
    description: 'Duas pessoas acompanham uma arena de cada lado, sem hierarquia.',
  },
  competicao: {
    label: 'Desafio',
    invite: 'Desafiar alguém',
    description: 'Você escolhe a arena e o prazo. Ao aceitar, os dois recebem a mesma cópia selada.',
  },
};

const profileFromUser = (profile: UserProfile): ProfileLite => ({
  id: profile.id,
  nickname: profile.nickname || 'Aliado',
  avatarUrl: profile.avatarUrl || '',
  level: Number(profile.level || 1),
});

const profileFromRow = (row: any): ProfileLite => ({
  id: String(row.id),
  nickname: String(row.nickname || row.username || 'Aliado'),
  avatarUrl: String(row.avatar_url || ''),
  level: Number(row.level || 1),
});

const Avatar: React.FC<{ profile?: ProfileLite | null }> = ({ profile }) => (
  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-black/35">
    {profile?.avatarUrl ? (
      <img src={profile.avatarUrl} alt={profile.nickname} className="h-full w-full object-cover" />
    ) : (
      <span className="text-xs font-black text-white/70">{profile?.nickname?.slice(0, 1).toUpperCase() || '?'}</span>
    )}
  </div>
);

const getArenaProgress = (entry: LinkedRelationshipArena) => {
  const actions = entry.actions || [];
  const target = actions.reduce((sum, action) => {
    const repetitions = Number(action.repetitions || 0);
    return sum + (repetitions > 0 ? repetitions : 0);
  }, 0);
  const completed = (entry.tasks || []).filter((task) => task.completed).length;
  return {
    completed,
    target,
    percent: target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : null,
  };
};

const formatChallengeTime = (deadlineAt?: string | null, completedAt?: string | null) => {
  if (completedAt) return 'Encerrado';
  if (!deadlineAt) return 'Sem prazo registrado';
  const remainingMs = new Date(deadlineAt).getTime() - Date.now();
  if (remainingMs <= 0) return 'Encerrando';
  const hours = Math.ceil(remainingMs / 3_600_000);
  if (hours < 24) return `${hours}h restantes`;
  return `${Math.ceil(hours / 24)} dia(s) restantes`;
};

const ArenaProgress: React.FC<{ entry: LinkedRelationshipArena; owner: string }> = ({ entry, owner }) => {
  const progress = getArenaProgress(entry);
  const name = entry.arena?.name || String(entry.metadata?.name || 'Arena');

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40">{owner}</div>
          <div className="mt-1 truncate text-sm font-bold text-white">{name}</div>
        </div>
        <div className="text-xs font-black text-white/66">
          {progress.percent === null ? 'Livre' : `${progress.percent}%`}
        </div>
      </div>
      {progress.percent !== null ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-[var(--skin-accent-color)]" style={{ width: `${progress.percent}%` }} />
        </div>
      ) : (
        <div className="mt-2 text-[10px] leading-relaxed text-white/42">Acompanhamento livre, sem meta de repeticoes.</div>
      )}
    </div>
  );
};

export const ConnectionsModal: React.FC<{
  onClose: () => void;
  initialTab?: VisibleConnectionType;
  initialRecipientId?: string;
}> = ({ onClose, initialTab = 'mentoria', initialRecipientId }) => {
  const {
    actions,
    assets,
    createCompetitionInvite,
    createRelationshipInvite,
    endRelationshipLink,
    fetchRelationshipHubData,
    friends,
    respondToRelationshipInvite,
    selectMentorshipArena,
    shareRelationshipArena,
    showToast,
    userProfile,
  } = useGame();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [invites, setInvites] = useState<RelationshipLinkInvite[]>([]);
  const [links, setLinks] = useState<RelationshipLink[]>([]);
  const [linkedArenas, setLinkedArenas] = useState<LinkedRelationshipArena[]>([]);
  const [competitionChallenges, setCompetitionChallenges] = useState<RelationshipCompetitionChallenge[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [activeType, setActiveType] = useState<VisibleConnectionType>(initialTab);
  const [inviteType, setInviteType] = useState<VisibleConnectionType | null>(initialRecipientId ? initialTab : null);
  const [arenaPickerLink, setArenaPickerLink] = useState<RelationshipLink | null>(null);
  const [mentorshipPickerLink, setMentorshipPickerLink] = useState<RelationshipLink | null>(null);
  const [competitionInviteFriend, setCompetitionInviteFriend] = useState<UserProfile | null>(null);
  const [selectedArenaId, setSelectedArenaId] = useState('');
  const [competitionDurationDays, setCompetitionDurationDays] = useState(7);

  const visibleInvites = useMemo(
    () => invites.filter((invite) => invite.linkType === activeType),
    [activeType, invites],
  );
  const visibleLinks = useMemo(
    () => links.filter((link) => link.linkType === activeType),
    [activeType, links],
  );
  const ownArenas = useMemo(
    () => assets.flatMap((asset) => asset.arenas).filter((arena) => !arena.isArchived),
    [assets],
  );
  const competitionArenas = useMemo(
    () => ownArenas.filter((arena) => actions.some((action) => action.arenaId === arena.id && action.actionType !== 'Livre')),
    [actions, ownArenas],
  );
  const selectedCompetitionArena = useMemo(
    () => competitionArenas.find((arena) => arena.id === selectedArenaId) || null,
    [competitionArenas, selectedArenaId],
  );
  const selectedCompetitionStats = useMemo(() => {
    if (!selectedCompetitionArena) return null;
    const measurableActions = actions.filter((action) => action.arenaId === selectedCompetitionArena.id && action.actionType !== 'Livre');
    const plannedTotal = measurableActions.reduce((sum, action) => sum + Math.max(1, Number(action.repetitions || 1)), 0);
    const rewardChestType = plannedTotal >= 6 || measurableActions.length >= 4 ? 'Incomum' : 'Comum';
    const rewardXp = measurableActions.length >= 6 || plannedTotal >= 12 ? 120 : measurableActions.length >= 4 || plannedTotal >= 6 ? 90 : 60;
    return { actionCount: measurableActions.length, plannedTotal, rewardChestType, rewardXp };
  }, [actions, selectedCompetitionArena]);
  const inviteCandidates = useMemo(
    () => initialRecipientId ? friends.filter((friend) => friend.id === initialRecipientId) : friends,
    [friends, initialRecipientId],
  );

  // Accepting an invite triggers two refreshes: respond() awaits one, and
  // respondToRelationshipInvite dispatches glyph:relationships-updated, whose listener
  // fires another. Whichever started first can resolve last, overwriting the list that
  // already had the new link — the partnership appeared and then vanished. Only the
  // newest request is allowed to write.
  const refreshRequestIdRef = useRef(0);

  const refresh = useCallback(async (initial = false) => {
    const requestId = refreshRequestIdRef.current + 1;
    refreshRequestIdRef.current = requestId;
    const isStale = () => requestId !== refreshRequestIdRef.current;

    initial ? setLoading(true) : setRefreshing(true);
    try {
      const hub = await fetchRelationshipHubData();
      if (isStale()) return;
      const nextInvites = hub.invites || [];
      const nextLinks = hub.links || [];
      const seeded: Record<string, ProfileLite> = {
        [userProfile.id]: profileFromUser(userProfile),
      };
      friends.forEach((friend) => {
        seeded[friend.id] = profileFromUser(friend);
      });

      const participantIds = [...new Set([
        ...nextInvites.flatMap((invite) => [invite.senderId, invite.recipientId]),
        ...nextLinks.flatMap((link) => [link.mentorId, link.pupilId]),
      ])].filter((id) => id && !seeded[id]);

      if (participantIds.length > 0) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id,nickname,avatar_url,level')
          .in('id', participantIds);
        if (error) console.error('Connections profile hydration failed:', error);
        (data || []).forEach((row) => {
          seeded[row.id] = profileFromRow(row);
        });
      }

      if (isStale()) return;

      setInvites(nextInvites);
      setLinks(nextLinks);
      setLinkedArenas(hub.linkedArenas || []);
      setCompetitionChallenges(hub.competitionChallenges || []);
      setProfiles(seeded);
    } catch (error) {
      if (isStale()) return;
      console.error('Connections load failed:', error);
      showToast('Nao foi possivel carregar suas conexoes.', 'error');
    } finally {
      if (!isStale()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [fetchRelationshipHubData, friends, showToast, userProfile]);

  // refresh is rebuilt on every provider render because fetchRelationshipHubData is
  // not memoised. Depending on it here re-ran the initial load continuously, and with
  // the request guard each in-flight load was invalidated by the next one, so nothing
  // ever rendered. Go through a ref: load once, and keep one stable listener.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    void refreshRef.current(true);
    const handleUpdate = () => void refreshRef.current();
    window.addEventListener('glyph:relationships-updated', handleUpdate);
    return () => window.removeEventListener('glyph:relationships-updated', handleUpdate);
  }, []);

  const profileFor = (id: string) => profiles[id] || null;
  const otherIdFor = (link: RelationshipLink) => link.mentorId === userProfile.id ? link.pupilId : link.mentorId;
  const arenasForLink = (linkId: string) => linkedArenas.filter((entry) => entry.relationshipLinkId === linkId);
  const challengesForLink = (linkId: string) => competitionChallenges.filter((entry) => entry.relationshipLinkId === linkId);

  const openMessages = (participantId: string) => {
    onClose();
    window.dispatchEvent(new CustomEvent<AppNavigatePayload>(APP_NAVIGATE_EVENT, { detail: { view: 'social' } }));
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('mundo-tab-request', {
        detail: { tab: 'social', socialSection: 'messages', participantId },
      }));
    }, 100);
  };

  const respond = async (invite: RelationshipLinkInvite, action: RelationshipInviteAction) => {
    setBusyKey(`${action}:${invite.id}`);
    try {
      if (await respondToRelationshipInvite(invite.id, action)) await refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const sendInvite = async (friendId: string) => {
    if (!inviteType) return;
    if (inviteType === 'competicao') {
      const friend = inviteCandidates.find((candidate) => candidate.id === friendId) || null;
      setCompetitionInviteFriend(friend);
      setInviteType(null);
      setSelectedArenaId('');
      setCompetitionDurationDays(7);
      return;
    }
    setBusyKey(`invite:${friendId}`);
    try {
      if (await createRelationshipInvite(friendId, inviteType)) {
        setInviteType(null);
        await refresh();
      }
    } finally {
      setBusyKey(null);
    }
  };

  const sendCompetitionInvite = async () => {
    if (!competitionInviteFriend || !selectedArenaId) return;
    setBusyKey(`competition-invite:${competitionInviteFriend.id}`);
    try {
      if (await createCompetitionInvite(competitionInviteFriend.id, selectedArenaId, competitionDurationDays)) {
        setCompetitionInviteFriend(null);
        setSelectedArenaId('');
        setCompetitionDurationDays(7);
        await refresh();
      }
    } finally {
      setBusyKey(null);
    }
  };

  const endLink = async (link: RelationshipLink) => {
    if (!window.confirm('Encerrar esta conexao? O historico de progresso nao sera apagado.')) return;
    setBusyKey(`end:${link.id}`);
    try {
      if (await endRelationshipLink(link.id)) await refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const savePartnershipArena = async () => {
    if (!arenaPickerLink || !selectedArenaId) return;
    setBusyKey(`arena:${arenaPickerLink.id}`);
    try {
      const shared = await shareRelationshipArena(arenaPickerLink.id, selectedArenaId);
      if (!shared) return;
      setArenaPickerLink(null);
      setSelectedArenaId('');
      await refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const saveMentorshipArena = async () => {
    if (!mentorshipPickerLink || !selectedArenaId) return;
    const alreadyHasSharedArena = arenasForLink(mentorshipPickerLink.id).length > 0;
    if (!alreadyHasSharedArena && Number(userProfile.wallet?.gold || 0) < 50) {
      showToast(`Faltam ${50 - Number(userProfile.wallet?.gold || 0)} de ouro para compartilhar a primeira arena.`, 'warning');
      return;
    }
    setBusyKey(`mentorship-arena:${mentorshipPickerLink.id}`);
    try {
      const selected = await selectMentorshipArena(mentorshipPickerLink.id, selectedArenaId);
      if (!selected) return;
      setMentorshipPickerLink(null);
      setSelectedArenaId('');
      await refresh();
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm" onClick={onClose}>
        <GlassCard className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden !rounded-lg !p-0" onClick={(event) => event.stopPropagation()}>
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Social</div>
              <h2 className="mt-0.5 text-lg font-black text-white">Conexões</h2>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => void refresh()} className="p-2 text-white/55 hover:text-white" aria-label="Atualizar conexoes">
                <RefreshCwIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button type="button" onClick={onClose} className="p-2 text-white/55 hover:text-white" aria-label="Fechar conexoes">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-4">
            <section className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-black/25 p-1">
              {(Object.keys(typeCopy) as VisibleConnectionType[]).map((type) => (
                <button
                  key={type}
                  id={`connections-tab-${type}`}
                  data-active={activeType === type ? 'true' : 'false'}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`min-h-10 rounded-md px-2 py-2 text-center text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${activeType === type ? 'bg-white/12 text-white' : 'text-white/42 hover:text-white/72'}`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {type === 'mentoria' ? <CheckIcon className="h-4 w-4 text-amber-300" /> : type === 'parceria' ? <UsersIcon className="h-4 w-4 text-cyan-300" /> : <TrophyIcon className="h-4 w-4 text-rose-300" />}
                    {typeCopy[type].label}
                  </span>
                </button>
              ))}
            </section>

            <section className="flex items-center justify-between gap-3">
              <p className="text-[11px] leading-relaxed text-white/45">{typeCopy[activeType].description}</p>
              <button type="button" onClick={() => setInviteType(activeType)} className="shrink-0 rounded-md bg-[var(--skin-accent-color)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-black">
                {typeCopy[activeType].invite}
              </button>
            </section>

            {visibleInvites.length > 0 && (
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Convites</h3>
                <div className="mt-2 space-y-2">
                  {visibleInvites.map((invite) => {
                    const incoming = invite.recipientId === userProfile.id;
                    const other = profileFor(incoming ? invite.senderId : invite.recipientId);
                    return (
                      <div key={invite.id} data-connection-invite={invite.id} data-invite-type={invite.linkType} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/24 p-3">
                        <Avatar profile={other} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-white">{other?.nickname || 'Aliado'}</div>
                          <div className="mt-0.5 text-[10px] text-white/45">
                            {incoming ? 'Convidou você para' : 'Aguardando resposta'} · {typeCopy[invite.linkType as VisibleConnectionType].label}
                            {invite.linkType === 'competicao' && invite.arenaSnapshot?.name ? `: ${invite.arenaSnapshot.name}` : ''}
                          </div>
                          {invite.linkType === 'competicao' && (
                            <div className="mt-1 text-[9px] font-semibold text-rose-100/65">
                              {invite.arenaSnapshot?.durationDays || 7} dia(s) · {invite.arenaSnapshot?.plannedTotal || 0} execuções
                              {invite.arenaSnapshot?.rewardChestType ? ` · Baú ${invite.arenaSnapshot.rewardChestType} + ${invite.arenaSnapshot.rewardXp || 0} EXP` : ''}
                              {incoming ? ' · 50 de ouro cobrados de quem enviou ao aceitar' : ' · sem cobrança até a aceitação'}
                            </div>
                          )}
                        </div>
                        {incoming ? (
                          <div className="flex gap-1">
                            <button id={`connections-invite-accept-${invite.id}`} data-invite-accept={invite.linkType} type="button" disabled={Boolean(busyKey)} onClick={() => void respond(invite, 'accept')} className="rounded-md bg-emerald-400/15 p-2 text-emerald-200" aria-label="Aceitar convite"><CheckIcon className="h-4 w-4" /></button>
                            <button id={`connections-invite-decline-${invite.id}`} type="button" disabled={Boolean(busyKey)} onClick={() => void respond(invite, 'decline')} className="rounded-md bg-white/5 p-2 text-white/55" aria-label="Recusar convite"><XIcon className="h-4 w-4" /></button>
                          </div>
                        ) : (
                          <button type="button" disabled={Boolean(busyKey)} onClick={() => void respond(invite, 'revoke')} className="p-2 text-white/45 hover:text-rose-200" aria-label="Cancelar convite"><TrashIcon className="h-4 w-4" /></button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Ativas</h3>
              {loading ? (
                <div className="mt-3 h-24 animate-pulse rounded-lg bg-white/5" />
              ) : visibleLinks.length === 0 ? (
                <div id="connections-active-empty" className="mt-2 rounded-lg border border-dashed border-white/12 p-4 text-center text-xs text-white/42">Nenhuma conexao ativa.</div>
              ) : (
                <div id="connections-active-list" data-active-count={visibleLinks.length} className="mt-2 space-y-3">
                  {visibleLinks.map((link) => {
                    const otherId = otherIdFor(link);
                    const other = profileFor(otherId);
                    const relationshipArenas = arenasForLink(link.id);
                    const isMentor = link.linkType === 'mentoria' && link.mentorId === userProfile.id;
                    return (
                      <article key={link.id} data-connection-link={link.id} data-link-type={link.linkType} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                        <div className="flex items-center gap-3">
                          <Avatar profile={other} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-black text-white">{other?.nickname || 'Aliado'}</div>
                            <div className="mt-0.5 text-[10px] text-white/44">
                              {link.linkType === 'mentoria' ? (isMentor ? 'Voce orienta' : 'Orienta voce') : typeCopy[link.linkType as VisibleConnectionType].label}
                            </div>
                          </div>
                          <button type="button" onClick={() => openMessages(otherId)} className="rounded-md border border-white/10 p-2 text-white/65 hover:text-white" aria-label={`Conversar com ${other?.nickname || 'aliado'}`}><MessageIcon className="h-4 w-4" /></button>
                          <button type="button" disabled={Boolean(busyKey)} onClick={() => void endLink(link)} className="p-2 text-white/35 hover:text-rose-200" aria-label="Encerrar conexao"><TrashIcon className="h-4 w-4" /></button>
                        </div>

                        {link.linkType === 'competicao' ? (
                          <div className="mt-3 space-y-2">
                            {challengesForLink(link.id).length === 0 ? (
                              <p className="text-[11px] leading-relaxed text-white/42">Nenhum desafio ativo. Use “Desafiar alguém” acima para escolher arena e prazo.</p>
                            ) : challengesForLink(link.id).map((challenge) => {
                              const ownDone = challenge.challengerUserId === userProfile.id ? challenge.challengerCompletedAt : challenge.opponentCompletedAt;
                              const rivalDone = challenge.challengerUserId === userProfile.id ? challenge.opponentCompletedAt : challenge.challengerCompletedAt;
                              const ownArenaId = challenge.challengerUserId === userProfile.id ? challenge.challengerArenaId : challenge.opponentArenaId;
                              const rivalArenaId = challenge.challengerUserId === userProfile.id ? challenge.opponentArenaId : challenge.challengerArenaId;
                              const ownArena = relationshipArenas.find((entry) => entry.arenaId === ownArenaId);
                              const rivalArena = relationshipArenas.find((entry) => entry.arenaId === rivalArenaId);
                              const name = String(challenge.metadata?.source_name || 'Duelo');
                              return (
                                <div key={challenge.id} className="rounded-lg border border-rose-300/12 bg-rose-500/[0.05] p-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-bold text-white">{name}</div>
                                      <div className="mt-1 text-[10px] text-white/42">Você: {ownDone ? 'concluiu' : 'em andamento'} · Rival: {rivalDone ? 'concluiu' : 'em andamento'}</div>
                                      <div className="mt-1 text-[9px] font-semibold text-rose-100/58">{formatChallengeTime(challenge.deadlineAt, challenge.completedAt)}</div>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.12em] text-rose-200">{challenge.completedAt ? (challenge.resultKind === 'draw' ? 'Empate' : 'Concluído') : 'Ativo'}</span>
                                  </div>
                                  {(ownArena || rivalArena) && (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                      {ownArena ? <ArenaProgress entry={ownArena} owner="Você" /> : <div />}
                                      {rivalArena ? <ArenaProgress entry={rivalArena} owner={other?.nickname || 'Rival'} /> : <div />}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : link.linkType === 'parceria' ? (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {[userProfile.id, otherId].map((ownerId) => {
                              const entry = relationshipArenas.find((candidate) => (
                                candidate.createdByUserId === ownerId
                                || String(candidate.metadata?.owner_user_id || '') === ownerId
                              ));
                              const owner = ownerId === userProfile.id ? 'Sua arena' : `Arena de ${other?.nickname || 'aliado'}`;
                              return entry ? (
                                <ArenaProgress key={ownerId} entry={entry} owner={owner} />
                              ) : (
                                <div key={ownerId} className="flex min-h-[5.6rem] flex-col justify-center rounded-lg border border-dashed border-white/12 bg-black/15 p-3">
                                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40">{owner}</div>
                                  <div className="mt-2 text-[10px] leading-relaxed text-white/38">Ainda não escolhida.</div>
                                </div>
                              );
                            })}
                          </div>
                        ) : relationshipArenas.length > 0 ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {relationshipArenas.map((entry) => {
                              const ownerId = entry.arena?.userId || String(entry.metadata?.owner_user_id || entry.createdByUserId || '');
                              const owner = ownerId === userProfile.id ? 'Sua arena' : `Arena de ${other?.nickname || 'aliado'}`;
                              return <ArenaProgress key={entry.id} entry={entry} owner={owner} />;
                            })}
                          </div>
                        ) : (
                          <p className="mt-3 text-[11px] leading-relaxed text-white/42">
                            {link.linkType === 'mentoria'
                              ? (isMentor ? `Aguardando ${other?.nickname || 'o orientado'} escolher uma arena.` : 'Escolha uma arena sua para receber acompanhamento. O mentor não pode editar suas ações.')
                              : 'Escolha uma arena para acompanhar junto.'}
                          </p>
                        )}

                        {link.linkType === 'mentoria' && !isMentor && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedArenaId(relationshipArenas[0]?.arenaId || '');
                              setMentorshipPickerLink(link);
                            }}
                            className="mt-3 inline-flex items-center gap-2 rounded-md border border-amber-300/18 bg-amber-300/[0.06] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-amber-100"
                          >
                            <PlusIcon className="h-3.5 w-3.5" /> {relationshipArenas.length > 0 ? 'Trocar arena' : 'Escolher arena · 50 ouro'}
                          </button>
                        )}

                        {link.linkType === 'parceria' && (
                          <button
                            id={`connections-partnership-pick-arena-${link.id}`}
                            type="button"
                            onClick={() => {
                              const ownShare = relationshipArenas.find((entry) => entry.arena?.userId === userProfile.id || entry.createdByUserId === userProfile.id || String(entry.metadata?.owner_user_id || '') === userProfile.id);
                              setSelectedArenaId(ownShare?.arenaId || '');
                              setArenaPickerLink(link);
                            }}
                            className="mt-3 inline-flex items-center gap-2 rounded-md border border-cyan-300/18 bg-cyan-300/[0.06] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100"
                          >
                            <PlusIcon className="h-3.5 w-3.5" /> {relationshipArenas.some((entry) => entry.createdByUserId === userProfile.id || String(entry.metadata?.owner_user_id || '') === userProfile.id) ? 'Trocar minha arena' : 'Escolher minha arena · 50 ouro'}
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </GlassCard>
      </div>

      {inviteType && (
        <div className="fixed inset-0 z-[10030] flex items-end justify-center bg-black/70 p-3 sm:items-center" onClick={() => setInviteType(null)}>
          <div className="max-h-[70vh] w-full max-w-sm overflow-y-auto rounded-lg border border-white/12 bg-[#0b0c0f] p-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">{typeCopy[inviteType].invite}</h3>
              <button type="button" onClick={() => setInviteType(null)} className="p-2 text-white/55"><XIcon className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 space-y-2">
              {inviteCandidates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/12 p-4 text-center text-xs text-white/42">Adicione a pessoa como amiga primeiro.</div>
              ) : inviteCandidates.map((friend) => (
                <button key={friend.id} type="button" disabled={Boolean(busyKey)} onClick={() => void sendInvite(friend.id)} className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-left hover:bg-white/[0.07]">
                  <Avatar profile={profileFromUser(friend)} />
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-white">{friend.nickname}</div><div className="text-[10px] text-white/40">Nivel {friend.level || 1}</div></div>
                  <PlusIcon className="h-4 w-4 text-white/55" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {arenaPickerLink && (
        <div className="fixed inset-0 z-[10030] flex items-end justify-center bg-black/70 p-3 sm:items-center" onClick={() => setArenaPickerLink(null)}>
          <div className="w-full max-w-sm rounded-lg border border-white/12 bg-[#0b0c0f] p-4" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-base font-black text-white">Minha arena na parceria</h3>
            <p className="mt-1 text-[11px] text-white/45">A outra pessoa acompanha o progresso. Voce continua sendo dono da arena.</p>
            <select value={selectedArenaId} onChange={(event) => setSelectedArenaId(event.target.value)} className="mt-4 w-full rounded-md border border-white/12 bg-black/50 px-3 py-3 text-sm text-white">
              <option value="">Escolha uma arena</option>
              {ownArenas.map((arena: Arena) => <option key={arena.id} value={arena.id}>{arena.name}</option>)}
            </select>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setArenaPickerLink(null)} className="flex-1 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-white/60">Cancelar</button>
              <button type="button" disabled={!selectedArenaId || Boolean(busyKey)} onClick={() => void savePartnershipArena()} className="flex-1 rounded-md bg-[var(--skin-accent-color)] px-3 py-2 text-xs font-black text-black disabled:opacity-40">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {competitionInviteFriend && (
        <div className="fixed inset-0 z-[10030] flex items-end justify-center bg-black/70 p-3 sm:items-center" onClick={() => setCompetitionInviteFriend(null)}>
          <div className="w-full max-w-sm rounded-lg border border-white/12 bg-[#0b0c0f] p-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3">
              <Avatar profile={profileFromUser(competitionInviteFriend)} />
              <div>
                <h3 className="text-base font-black text-white">Desafiar {competitionInviteFriend.nickname}</h3>
                <p className="mt-0.5 text-[10px] text-white/42">A pessoa verá arena, prazo e recompensa antes de aceitar.</p>
              </div>
            </div>
            <select value={selectedArenaId} onChange={(event) => setSelectedArenaId(event.target.value)} className="mt-4 w-full rounded-md border border-white/12 bg-black/50 px-3 py-3 text-sm text-white">
              <option value="">Escolha uma arena</option>
              {competitionArenas.map((arena: Arena) => <option key={arena.id} value={arena.id}>{arena.name}</option>)}
            </select>
            {competitionArenas.length === 0 && <p className="mt-2 text-[10px] text-rose-200/70">Crie uma arena com ao menos uma ação mensurável.</p>}

            <div className="mt-4 flex items-center justify-between border-y border-white/8 py-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/42">Prazo</div>
                <div className="mt-1 text-[10px] text-white/58">Começa quando o convite for aceito</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Diminuir prazo"
                  onClick={() => setCompetitionDurationDays((value) => Math.max(1, value - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/12 text-lg font-bold text-white/70"
                >−</button>
                <label className="flex h-9 w-16 items-center gap-1 rounded-md border border-rose-300/20 bg-rose-300/[0.06] px-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={competitionDurationDays}
                    onChange={(event) => setCompetitionDurationDays(Math.max(1, Math.min(30, Number(event.target.value) || 1)))}
                    className="w-7 bg-transparent text-center text-sm font-black text-white outline-none"
                    aria-label="Prazo do desafio em dias"
                  />
                  <span className="text-[9px] font-bold text-white/45">d</span>
                </label>
                <button
                  type="button"
                  aria-label="Aumentar prazo"
                  onClick={() => setCompetitionDurationDays((value) => Math.min(30, value + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/12 text-lg font-bold text-white/70"
                >+</button>
              </div>
            </div>

            {selectedCompetitionStats && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div><div className="text-sm font-black text-white">{selectedCompetitionStats.actionCount}</div><div className="text-[8px] font-bold uppercase text-white/38">Ações</div></div>
                <div><div className="text-sm font-black text-white">{selectedCompetitionStats.plannedTotal}</div><div className="text-[8px] font-bold uppercase text-white/38">Execuções</div></div>
                <div><div className="text-sm font-black text-amber-200">{selectedCompetitionStats.rewardXp} EXP</div><div className="text-[8px] font-bold uppercase text-white/38">Baú {selectedCompetitionStats.rewardChestType}</div></div>
              </div>
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-white/42">O envio é gratuito. Se o convite for aceito, 50 de ouro serão cobrados de você e as duas cópias serão seladas.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setCompetitionInviteFriend(null)} className="flex-1 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-white/60">Cancelar</button>
              <button type="button" disabled={!selectedArenaId || Boolean(busyKey)} onClick={() => void sendCompetitionInvite()} className="flex-1 rounded-md bg-rose-300 px-3 py-2 text-xs font-black text-black disabled:opacity-40">Enviar convite</button>
            </div>
          </div>
        </div>
      )}

      {mentorshipPickerLink && (
        <div className="fixed inset-0 z-[10030] flex items-end justify-center bg-black/70 p-3 sm:items-center" onClick={() => setMentorshipPickerLink(null)}>
          <div className="w-full max-w-sm rounded-lg border border-white/12 bg-[#0b0c0f] p-4" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-base font-black text-white">Arena acompanhada</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-white/45">O mentor podera ver o progresso e conversar com voce, mas nao podera criar, editar ou apagar suas acoes. A primeira escolha custa 50 de ouro; trocar depois nao cobra novamente.</p>
            <select value={selectedArenaId} onChange={(event) => setSelectedArenaId(event.target.value)} className="mt-4 w-full rounded-md border border-white/12 bg-black/50 px-3 py-3 text-sm text-white">
              <option value="">Escolha uma arena</option>
              {ownArenas.map((arena: Arena) => <option key={arena.id} value={arena.id}>{arena.name}</option>)}
            </select>
            {ownArenas.length === 0 && <p className="mt-2 text-[10px] text-amber-200/70">Crie uma arena primeiro; o mentor nao fara isso por voce.</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setMentorshipPickerLink(null)} className="flex-1 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-white/60">Cancelar</button>
              <button type="button" disabled={!selectedArenaId || Boolean(busyKey)} onClick={() => void saveMentorshipArena()} className="flex-1 rounded-md bg-amber-300 px-3 py-2 text-xs font-black text-black disabled:opacity-40">Compartilhar</button>
            </div>
          </div>
        </div>
      )}

    </Portal>
  );
};
