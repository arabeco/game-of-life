import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame, getLocalDateString } from '../contexts/GameContext';
import { useConfirmation } from '../hooks/useConfirmation';
import type {
  Action,
  Arena,
  LinkedRelationshipArena,
  RelationshipCompetitionChallenge,
  RelationshipInviteAction,
  RelationshipLink,
  RelationshipLinkInvite,
  RelationshipLinkType,
  UserProfile,
  RelationshipCapacitySummary,
} from '../types';
import { supabase } from '../supabaseClient';
import { APP_NAVIGATE_EVENT, type AppNavigatePayload } from '../utils/arenaAttention';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { CheckIcon, MessageIcon, PlusIcon, RefreshCwIcon, TrashIcon, TrophyIcon, UsersIcon, XIcon } from './Icons';
import { getDisplayLevel } from '../constants/lifeAreas';
import { ArenaCard } from './ArenaCard';
import { ArenaDetailModal } from './ArenaDetailModal';
import { NewArenaModal } from './NewArenaModal';
import { getRelationshipLifecycle, getRelationshipLinkPrice, getRelationshipRenewalPrice } from '../constants/relationshipLinks';
import { getArenaPresentationTasks } from '../utils/arenaProgressPresentation';

type VisibleConnectionType = Extract<RelationshipLinkType, 'mentoria' | 'parceria' | 'competicao'>;
type ProfileLite = Pick<UserProfile, 'id' | 'nickname' | 'avatarUrl' | 'level'>;

const typeCopy: Record<VisibleConnectionType, { label: string; invite: string; description: string }> = {
  mentoria: {
    label: 'Mentoria',
    invite: 'Orientar alguém',
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
  level: Number(profile.level ?? 0),
});

const profileFromRow = (row: any): ProfileLite => ({
  id: String(row.id),
  nickname: String(row.nickname || row.username || 'Aliado'),
  avatarUrl: String(row.avatar_url || ''),
  level: Number(row.level ?? 0),
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

const tasksForEntry = (entry: LinkedRelationshipArena) => {
  if (entry.linkType === 'competicao') return entry.tasks || [];
  const scope = entry.metadata?.presentationScope;
  return scope ? getArenaPresentationTasks(entry.tasks || [], scope.cycle, scope.reset_at, getLocalDateString()) : [];
};
const getArenaProgress = (entry: LinkedRelationshipArena) => {
  const counts = new Map<string, number>();
  tasksForEntry(entry).forEach(t => { if(t.completed) counts.set(t.actionId,(counts.get(t.actionId)||0)+1); });
  let target=0, done=0;
  (entry.actions||[]).filter(a=>a.actionType!=='Livre').forEach(a=>{const n=Math.max(1,Number(a.repetitions||1));target+=n;done+=Math.min(n,counts.get(a.id)||0);});
  return target ? Math.round(done/target*100) : 0;
};
const formatChallengeTime = (deadlineAt?: string | null, completedAt?: string | null) => {
  if (completedAt) return 'Encerrado';
  if (!deadlineAt) return 'Sem prazo registrado';
  const remainingMs = new Date(deadlineAt).getTime() - Date.now();
  if (remainingMs <= 0) return 'Prazo encerrado · apurando resultado';
  const hours = Math.ceil(remainingMs / 3_600_000);
  if (hours < 24) return `${hours}h restantes`;
  return `${Math.ceil(hours / 24)} dia(s) restantes`;
};

/** A arena de um vinculo, montada a partir do que o servidor mandou. */
const previewArenaFromEntry = (entry: LinkedRelationshipArena): Arena => (
  entry.arena || {
    id: entry.arenaId || `shared-preview-${entry.id}`,
    assetId: String(entry.metadata?.asset_id || 'geral'),
    name: String(entry.metadata?.name || 'Arena compartilhada'),
    description: String(entry.metadata?.description || ''),
    icon: String(entry.metadata?.icon || '\u{1F3DB}\uFE0F'),
    actionIds: [],
    isArchived: false,
  }
);

const ArenaProgress: React.FC<{entry: LinkedRelationshipArena; owner: string; onOpen:()=>void; arenaViva?:Arena|null; acoesVivas?:Action[]}> = ({entry,owner,onOpen,arenaViva,acoesVivas}) => {
  const own = Boolean(arenaViva) && entry.linkType !== 'competicao';
  return <div className="flex flex-col gap-1"><span className="text-[9px] font-bold text-white/45">{owner}</span><ArenaCard arena={arenaViva||previewArenaFromEntry(entry)} actions={(own?acoesVivas:entry.actions)||[]} tasks={own?undefined:tasksForEntry(entry)} relationshipBadgeType={entry.linkType??null} progressPercent={own?undefined:getArenaProgress(entry)} onClick={onOpen} variant="compact" /></div>;
};

export const ConnectionsModal: React.FC<{
  onClose: () => void;
  initialTab?: VisibleConnectionType;
  initialRecipientId?: string;
}> = ({ onClose, initialTab = 'mentoria', initialRecipientId }) => {
  const {
    actions,
    assets,
    renewRelationshipLink,
    createCompetitionInvite,
    cancelCompetitionChallenge,
    createRelationshipInvite,
    endRelationshipLink,
    fetchRelationshipHubData,
    buyRelationshipCapacitySlot,
    friends,
    getActionsForArena,
    respondToRelationshipInvite,
    selectMentorshipArena,
    shareRelationshipArena,
    showToast,
    userProfile,
  } = useGame();
  const { confirm, confirmationElement } = useConfirmation();
  const [selectedMentorshipIds,setSelectedMentorshipIds]=useState<string[]>([]);
  const [mentorshipRole,setMentorshipRole]=useState<'mentor'|'pupil'>('mentor');
  const [creatingArena,setCreatingArena]=useState(false);
  const [editingCreatedArena,setEditingCreatedArena]=useState<Arena|null>(null);
  const [reviewInvite,setReviewInvite]=useState<RelationshipLinkInvite|null>(null);
  const [,tick]=useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [invites, setInvites] = useState<RelationshipLinkInvite[]>([]);
  const [links, setLinks] = useState<RelationshipLink[]>([]);
  const [linkedArenas, setLinkedArenas] = useState<LinkedRelationshipArena[]>([]);
  /* O resumo de capacidade JA vinha do hub e era descartado aqui. Enquanto a
     regra era de enfeite — limite sempre igual ao usado, `unlimited: true` —
     guardar nao adiantava nada. Agora ela conta, e sem isto a pessoa continua
     sem saber quantos espacos tem nem que da para abrir outro. */
  const [capacidade, setCapacidade] = useState<RelationshipCapacitySummary | null>(null);
  const [comprandoEspaco, setComprandoEspaco] = useState(false);
  const [competitionChallenges, setCompetitionChallenges] = useState<RelationshipCompetitionChallenge[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [activeType, setActiveType] = useState<VisibleConnectionType>(initialTab);
  const [inviteType, setInviteType] = useState<VisibleConnectionType | null>(initialRecipientId ? initialTab : null);
  const [arenaPickerLink, setArenaPickerLink] = useState<RelationshipLink | null>(null);
  const [mentorshipPickerLink, setMentorshipPickerLink] = useState<RelationshipLink | null>(null);
  const [competitionInviteFriend, setCompetitionInviteFriend] = useState<UserProfile | null>(null);
  const [selectedArenaId, setSelectedArenaId] = useState('');
  /** Arena de vinculo aberta em detalhe. Ver abrirArenaDoVinculo. */
  const [arenaDoVinculoAberta, setArenaDoVinculoAberta] = useState<LinkedRelationshipArena | null>(null);

  /**
   * A arena do contexto, quando a do vinculo e sua.
   *
   * Devolve null para a arena do par: ela nao existe no seu contexto e a foto do
   * payload e a unica fonte. Para a sua, devolve o objeto vivo — o MESMO que a
   * aba Arenas desenha — para os dois lugares nunca discordarem.
   */
  const arenaVivaDoVinculo = useCallback((entry: LinkedRelationshipArena): Arena | null => (
    assets.flatMap((asset) => asset.arenas).find((arena) => arena.id === entry.arenaId) || null
  ), [assets]);
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
        // Pelo cartao publico: a tabela so devolve a propria linha, e o outro
        // lado de cada vinculo aparecia sem nome.
        const { data, error } = await supabase
          .rpc('get_public_profile_cards', { p_user_ids: participantIds });
        if (error) console.error('Connections profile hydration failed:', error);
        (data || []).forEach((row) => {
          seeded[row.id] = profileFromRow(row);
        });
      }

      if (isStale()) return;

      setInvites(nextInvites);
      setLinks(nextLinks);
      setLinkedArenas(hub.linkedArenas || []);
      setCapacidade(hub.summary || null);
      setCompetitionChallenges(hub.competitionChallenges || []);
      setProfiles(seeded);
    } catch (error) {
      if (isStale()) return;
      console.error('Connections load failed:', error);
      showToast('Não foi possível carregar suas conexões.', 'error');
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
    const timer=window.setInterval(()=>{tick(v=>v+1);if(!document.hidden)handleUpdate();},30000);
    window.addEventListener('focus',handleUpdate);
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
      const sent=inviteType==='mentoria' ? await runRelationshipRpc('propose_relationship_v3',{p_recipient_id:friendId,p_link_type:'mentoria',p_pupil_id:mentorshipRole==='pupil'?userProfile.id:friendId}) : await createRelationshipInvite(friendId,inviteType);
      if(sent){
        setInviteType(null);
        await refresh();
      }
    } finally {
      setBusyKey(null);
    }
  };

  // Desistir encerra o duelo sem declarar vencedor. Fica atras de confirmacao
  // porque o ouro nao volta e a dupla so libera depois disso.
  const desistChallenge = async (challengeId: string) => {
    if (!(await confirm({
      title: 'Desistir do duelo?',
      message: 'Seu rival vence. O valor pago não é devolvido.',
      confirmLabel: 'DESISTIR',
      variant: 'danger',
    }))) return;
    setBusyKey(`challenge-cancel:${challengeId}`);
    try {
      if (await cancelCompetitionChallenge(challengeId)) {
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

  const runRelationshipRpc=async(name:string,args:Record<string,unknown>)=>{
    const {error}=await supabase.rpc(name,args);
    if(error){showToast('Não foi possível concluir: '+error.message,'error');return false;}
    await refresh();window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));return true;
  };
  const runBusy=async(key:string,action:()=>Promise<unknown>)=>{if(busyKey)return;setBusyKey(key);try{await action();}finally{setBusyKey(null);}};
  const renewLink=async(link:RelationshipLink)=>{
    if(!await confirm({title:'Propor renovação?',message:getRelationshipRenewalPrice(link.linkType)+' ouros serão reservados. Os 30 dias começam no aceite da outra pessoa.',confirmLabel:'PROPOR'}))return;
    await runBusy('renew:'+link.id,async()=>{if(await renewRelationshipLink(link.id))await refresh();});
  };
  const endLink = async (link: RelationshipLink) => {
    if (!(await confirm({
      title: 'Encerrar esta conexão?',
      message: 'O acesso compartilhado será encerrado. As arenas pessoais e a conversa continuam.',
      confirmLabel: 'ENCERRAR',
      variant: 'danger',
    }))) return;
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
    if (!mentorshipPickerLink) return;
    setBusyKey(`mentorship-arena:${mentorshipPickerLink.id}`);
    try {
      const selected=await runRelationshipRpc('select_relationship_arenas',{p_link_id:mentorshipPickerLink.id,p_arena_ids:selectedMentorshipIds});
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
      <div style={{display:creatingArena||editingCreatedArena?'none':undefined}} className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm" onClick={onClose}>
        <GlassCard className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden !rounded-lg !p-0" onClick={(event) => event.stopPropagation()}>
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45">Social</div>
              <h2 className="mt-0.5 text-lg font-black text-white">Conexões</h2>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => void refresh()} className="p-2 text-white/55 hover:text-white" aria-label="Atualizar conexões">
                <RefreshCwIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button type="button" onClick={onClose} className="p-2 text-white/55 hover:text-white" aria-label="Fechar conexões">
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
                  className={`min-h-10 rounded-md px-2 py-2 text-center text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${activeType === type ? 'bg-white/12 text-white' : 'text-white/45 hover:text-white/72'}`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {type === 'mentoria' ? <CheckIcon className="h-4 w-4 text-amber-300" /> : type === 'parceria' ? <UsersIcon className="h-4 w-4 text-cyan-300" /> : <TrophyIcon className="h-4 w-4 text-rose-300" />}
                    {typeCopy[type].label}
                    {invites.some(invite => invite.linkType === type && invite.recipientId === userProfile.id) && <span className="rounded-full bg-amber-200 px-1.5 text-[9px] text-black" aria-label="Convites recebidos">{invites.filter(invite => invite.linkType === type && invite.recipientId === userProfile.id).length}</span>}
                  </span>
                </button>
              ))}
            </section>

            <section className="flex items-center justify-between gap-3">
              <p className="text-[11px] leading-relaxed text-white/45">{typeCopy[activeType].description} · {getRelationshipLinkPrice(activeType)} ouro{activeType!=='competicao'?' / 30 dias':' por duelo'}</p>
              <button id="connections-invite-open" type="button" onClick={() => setInviteType(activeType)} className="shrink-0 rounded-md bg-[var(--skin-accent-color)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-black">
                {typeCopy[activeType].invite}
              </button>
            </section>

            {visibleInvites.length > 0 && (
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Convites</h3>
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
                            {invite.renewalLinkId?'Renovação':incoming?'Convidou você para':'Aguardando resposta'} · {typeCopy[invite.linkType as VisibleConnectionType].label}
                            {invite.linkType === 'competicao' && invite.arenaSnapshot?.name ? `: ${invite.arenaSnapshot.name}` : ''}
                          </div>
                          {invite.linkType === 'competicao' && (
                            <div className="mt-1 text-[9px] font-semibold text-rose-100/65">
                              {invite.arenaSnapshot?.durationDays || 7} dia(s) · {invite.arenaSnapshot?.plannedTotal || 0} execuções
                              {invite.arenaSnapshot?.rewardChestType ? ` · Baú ${invite.arenaSnapshot.rewardChestType} + ${invite.arenaSnapshot.rewardXp || 0} EXP` : ''}
                              {incoming?' · quem convidou paga':' · 50 ouros reservados'}
                            </div>
                          )}
                        </div>
                        {incoming ? (
                          <div className="flex gap-1">
                            <button id={`connections-invite-accept-${invite.id}`} data-invite-accept={invite.linkType} type="button" disabled={Boolean(busyKey)} onClick={()=>setReviewInvite(invite)} className="min-h-11 min-w-11 flex items-center justify-center rounded-md bg-emerald-400/15 p-2 text-emerald-200" aria-label="Aceitar convite"><CheckIcon className="h-4 w-4" /></button>
                            <button id={`connections-invite-decline-${invite.id}`} type="button" disabled={Boolean(busyKey)} onClick={() => void respond(invite, 'decline')} className="min-h-11 min-w-11 flex items-center justify-center rounded-md bg-white/5 p-2 text-white/55" aria-label="Recusar convite"><XIcon className="h-4 w-4" /></button>
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
              <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Conexões</h3>

              {/*
                * A REGRA DO ESPACO, ESCRITA ONDE ELA ACONTECE.
                *
                * Ela existia so no banco, e nem la contava: o limite era sempre
                * igual ao usado e tudo dizia `unlimited`. Agora conta — e uma
                * regra que ninguem ve e uma regra que ninguem segue. A frase e
                * curta de proposito: uma arena viva por conexao, concluida
                * libera, e o resto se compra.
                */}
              {loading ? (
                <div className="mt-3 h-24 animate-pulse rounded-lg bg-white/5" />
              ) : visibleLinks.length === 0 ? (
                <div id="connections-active-empty" className="mt-2 rounded-lg border border-dashed border-white/12 p-4 text-center text-xs text-white/45">Nenhuma conexão nesta categoria.</div>
              ) : (
                <div id="connections-active-list" data-active-count={visibleLinks.length} className="mt-2 space-y-3">
                  {visibleLinks.map((link) => {
                    const otherId = otherIdFor(link);
                    const other = profileFor(otherId);
                    const relationshipArenas = arenasForLink(link.id);
                    const lifecycle=getRelationshipLifecycle(link);
                    const live=lifecycle==='ativo';
                    const isMentor = link.linkType === 'mentoria' && link.mentorId === userProfile.id;
                    return (
                      <article key={link.id} data-connection-link={link.id} data-link-type={link.linkType} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                        <div className="flex items-center gap-3">
                          <Avatar profile={other} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-black text-white">{other?.nickname || 'Aliado'}</div>
                            <div className="mt-0.5 text-[10px] text-white/45">
                              {link.linkType==='mentoria'?(isMentor?'Você acompanha':'Acompanha você'):typeCopy[link.linkType as VisibleConnectionType].label}{link.linkType!=='competicao'&&<> · {live?'Até ':lifecycle==='expirado'?'Expirada em ':'Encerrada em '}{new Date(link.endedAt||link.expiresAt||link.createdAt).toLocaleDateString('pt-BR')}</>}
                            </div>
                          </div>
                          <button type="button" onClick={() => openMessages(otherId)} className="rounded-md border border-white/10 p-2 text-white/65 hover:text-white" aria-label={`Conversar com ${other?.nickname || 'aliado'}`}><MessageIcon className="h-4 w-4" /></button>
                          <button type="button" disabled={Boolean(busyKey)} onClick={() => void endLink(link)} className="p-2 text-white/45 hover:text-rose-200" aria-label="Encerrar conexão"><TrashIcon className="h-4 w-4" /></button>
                        </div>

                        {!live && link.linkType!=='competicao' ? (<div className="mt-3 flex gap-2"><button disabled={Boolean(busyKey)} onClick={()=>void renewLink(link)} className="rounded border border-white/20 px-3 py-2 text-xs text-white">Renovar · {getRelationshipRenewalPrice(link.linkType)} ouro</button><button disabled={Boolean(busyKey)} onClick={()=>void runBusy('hide:'+link.id,()=>runRelationshipRpc('hide_relationship_link',{p_link_id:link.id}))} className="text-xs text-white/50">Remover da minha lista</button></div>) : link.linkType === 'competicao' ? (
                          <div className="mt-3 space-y-2">
                            {challengesForLink(link.id).length === 0 ? (
                              <p className="text-[11px] leading-relaxed text-white/45">Nenhum desafio registrado.</p>
                            ) : challengesForLink(link.id).map((challenge) => {
                              const ownDone = challenge.challengerUserId === userProfile.id ? challenge.challengerCompletedAt : challenge.opponentCompletedAt;
                              const rivalDone = challenge.challengerUserId === userProfile.id ? challenge.opponentCompletedAt : challenge.challengerCompletedAt;
                              const ownArenaId = challenge.challengerUserId === userProfile.id ? challenge.challengerArenaId : challenge.opponentArenaId;
                              const rivalArenaId = challenge.challengerUserId === userProfile.id ? challenge.opponentArenaId : challenge.challengerArenaId;
                              const ownArena = relationshipArenas.find((entry) => entry.arenaId === ownArenaId);
                              const rivalArena = relationshipArenas.find((entry) => entry.arenaId === rivalArenaId);
                              const name = String(challenge.metadata?.source_name || 'Duelo');
                              const deadlinePassed=Boolean(challenge.deadlineAt && Date.parse(challenge.deadlineAt)<=Date.now());
                              const closed=Boolean(challenge.sealedAt);
                              const result=challenge.completedAt ? challenge.resultKind==='draw'?'Empate':challenge.winnerUserId===userProfile.id?'Você venceu':'Você perdeu' : deadlinePassed?'Apurando':'Em disputa';
                              return (
                                <div key={challenge.id} className="rounded-lg border border-rose-300/12 bg-rose-500/[0.05] p-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-bold text-white">{name}</div>
                                      <div className="mt-1 text-[10px] text-white/45">Você: {ownDone?'concluiu':closed?'não concluiu':'em andamento'} · Rival: {rivalDone?'concluiu':closed?'não concluiu':'em andamento'}</div>
                                      <div className="mt-1 text-[9px] font-semibold text-rose-100/58">{formatChallengeTime(challenge.deadlineAt, challenge.sealedAt)}{challenge.deadlineAt&&' · '+new Date(challenge.deadlineAt).toLocaleString('pt-BR')}</div>
                                    </div>
                                    <div className="flex flex-shrink-0 items-center gap-2">
                                      <span className="text-[9px] font-black uppercase tracking-[0.12em] text-rose-200">{result}</span>
                                      {!challenge.completedAt && !deadlinePassed && (
                                        <button
                                          type="button"
                                          disabled={Boolean(busyKey)}
                                          onClick={() => void desistChallenge(challenge.id)}
                                          className="rounded-md border border-white/12 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/45 transition-colors hover:border-rose-300/30 hover:text-rose-200 disabled:opacity-40"
                                        >
                                          Desistir
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {challenge.completedAt&&!closed&&!ownDone&&<p className="mt-2 text-xs text-white/65">O resultado está definido. Você ainda pode concluir sua arena até o prazo.</p>}
                                  {closed&&<div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    {ownArena&&<><button disabled={Boolean(busyKey)} onClick={()=>void runBusy('copy:'+challenge.id,()=>runRelationshipRpc('manage_duel_copy',{p_challenge_id:challenge.id,p_action:'copy'}))} className="rounded border border-white/20 p-2">Copiar para minhas arenas</button><button disabled={Boolean(busyKey)} onClick={()=>void runBusy('delete:'+challenge.id,async()=>{if(await confirm({title:'Excluir cópia do duelo?',message:'O resultado e as recompensas ficam no histórico.',confirmLabel:'EXCLUIR',variant:'danger'}))await runRelationshipRpc('manage_duel_copy',{p_challenge_id:challenge.id,p_action:'delete'});})} className="p-2 text-white/50">Excluir cópia</button></>}
                                    <button onClick={()=>{setCompetitionInviteFriend(friends.find(f=>f.id===otherId)||({id:otherId,nickname:other?.nickname||'Rival'} as UserProfile));setSelectedArenaId('');}} className="rounded border border-white/20 p-2">Revanche</button>
                                  </div>}
                                  {(ownArena || rivalArena) && (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                      {ownArena ? <ArenaProgress entry={ownArena} owner="Você" arenaViva={arenaVivaDoVinculo(ownArena)} acoesVivas={getActionsForArena(ownArena.arenaId)} onOpen={() => setArenaDoVinculoAberta(ownArena)} /> : <div />}
                                      {rivalArena ? <ArenaProgress entry={rivalArena} owner={other?.nickname || 'Rival'} onOpen={() => setArenaDoVinculoAberta(rivalArena)} /> : <div />}
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
                                <ArenaProgress key={ownerId} entry={entry} owner={owner} arenaViva={arenaVivaDoVinculo(entry)} acoesVivas={getActionsForArena(entry.arenaId)} onOpen={() => setArenaDoVinculoAberta(entry)} />
                              ) : (
                                <div key={ownerId} className="flex min-h-[5.6rem] flex-col justify-center rounded-lg border border-dashed border-white/12 bg-black/15 p-3">
                                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">{owner}</div>
                                  <div className="mt-2 text-[10px] leading-relaxed text-white/45">Ainda não escolhida.</div>
                                </div>
                              );
                            })}
                          </div>
                        ) : relationshipArenas.length > 0 ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {relationshipArenas.map((entry) => {
                              const ownerId = /* arena.userId e resto de uma forma antiga de Arena: o dono sai do vinculo */ String(entry.metadata?.owner_user_id || entry.createdByUserId || '');
                              const owner = ownerId === userProfile.id ? 'Sua arena' : `Arena de ${other?.nickname || 'aliado'}`;
                              return <ArenaProgress key={entry.id} entry={entry} owner={owner} arenaViva={arenaVivaDoVinculo(entry)} acoesVivas={getActionsForArena(entry.arenaId)} onOpen={() => setArenaDoVinculoAberta(entry)} />;
                            })}
                          </div>
                        ) : (
                          <p className="mt-3 text-[11px] leading-relaxed text-white/45">
                            {link.linkType === 'mentoria'
                              ? (isMentor ? `Aguardando ${other?.nickname || 'o orientado'} escolher uma arena.` : 'Escolha uma arena sua para receber acompanhamento. O mentor não pode editar suas ações.')
                              : 'Escolha uma arena para acompanhar junto.'}
                          </p>
                        )}

                        {live && link.linkType === 'mentoria' && !isMentor && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMentorshipIds(relationshipArenas.map(e=>e.arenaId));
                              setMentorshipPickerLink(link);
                            }}
                            className="mt-3 inline-flex items-center gap-2 rounded-md border border-amber-300/18 bg-amber-300/[0.06] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-amber-100"
                          >
                            <PlusIcon className="h-3.5 w-3.5" /> Selecionar arenas
                          </button>
                        )}

                        {live && link.linkType === 'parceria' && (
                          <button
                            id={`connections-partnership-pick-arena-${link.id}`}
                            type="button"
                            onClick={() => {
                              const ownShare = relationshipArenas.find((entry) => entry.createdByUserId === userProfile.id || String(entry.metadata?.owner_user_id || '') === userProfile.id);
                              setSelectedArenaId(ownShare?.arenaId || '');
                              setArenaPickerLink(link);
                            }}
                            className="mt-3 inline-flex items-center gap-2 rounded-md border border-cyan-300/18 bg-cyan-300/[0.06] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100"
                          >
                            <PlusIcon className="h-3.5 w-3.5" /> {relationshipArenas.some((entry) => entry.createdByUserId === userProfile.id || String(entry.metadata?.owner_user_id || '') === userProfile.id) ? 'Trocar minha arena' : 'Escolher arena'}
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
            <p className="my-2 text-xs text-white/60">{getRelationshipLinkPrice(inviteType)} ouros reservados no envio. Aceite confirma o pagamento; recusa ou expiração devolve a reserva.</p>
            {inviteType==='mentoria'&&<label className="block text-xs text-white">Meu papel<select value={mentorshipRole} onChange={e=>setMentorshipRole(e.target.value as 'mentor'|'pupil')} className="ml-2 bg-black p-2"><option value="mentor">Acompanhar a outra pessoa</option><option value="pupil">Compartilhar minhas arenas</option></select></label>}
              <button aria-label="Voltar" type="button" onClick={() => setInviteType(null)} className="p-2 text-white/55"><XIcon className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 space-y-2">
              {inviteCandidates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/12 p-4 text-center text-xs text-white/45">Adicione a pessoa como amiga primeiro.</div>
              ) : inviteCandidates.map((friend) => (
                <button key={friend.id} id={`connections-invite-friend-${friend.id}`} type="button" disabled={Boolean(busyKey)} onClick={() => void sendInvite(friend.id)} className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-left hover:bg-white/[0.07]">
                  <Avatar profile={profileFromUser(friend)} />
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-white">{friend.nickname}</div><div className="text-[10px] text-white/45">Nivel {getDisplayLevel(friend.level)}</div></div>
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
            <p className="mt-1 text-[11px] text-white/45">A outra pessoa acompanha o progresso. Você continua sendo dono da arena.</p>
            <select id="connections-partnership-arena-select" value={selectedArenaId} onChange={(event) => setSelectedArenaId(event.target.value)} className="mt-4 w-full rounded-md border border-white/12 bg-black/50 px-3 py-3 text-sm text-white">
              <option value="">Escolher arena</option>
              {ownArenas.map((arena: Arena) => <option key={arena.id} value={arena.id}>{arena.name}</option>)}
            </select>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setArenaPickerLink(null)} className="flex-1 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-white/60">Cancelar</button>
              <button id="connections-partnership-save" type="button" disabled={!selectedArenaId || Boolean(busyKey)} onClick={() => void savePartnershipArena()} className="flex-1 rounded-md bg-[var(--skin-accent-color)] px-3 py-2 text-xs font-black text-black disabled:opacity-40">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {competitionInviteFriend && !creatingArena && !editingCreatedArena && (
        <div className="fixed inset-0 z-[10030] flex items-end justify-center bg-black/70 p-3 sm:items-center" onClick={() => setCompetitionInviteFriend(null)}>
          <div className="w-full max-w-sm rounded-lg border border-white/12 bg-[#0b0c0f] p-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3">
              <Avatar profile={profileFromUser(competitionInviteFriend)} />
              <div>
                <h3 className="text-base font-black text-white">Desafiar {competitionInviteFriend.nickname}</h3>
                <p className="mt-0.5 text-[10px] text-white/45">A pessoa verá arena, prazo e recompensa antes de aceitar.</p>
              </div>
            </div>
            <select id="connections-competition-arena-select" value={selectedArenaId} onChange={(event) => setSelectedArenaId(event.target.value)} className="mt-4 w-full rounded-md border border-white/12 bg-black/50 px-3 py-3 text-sm text-white">
              <option value="">Escolher arena</option>
              {competitionArenas.map((arena: Arena) => <option key={arena.id} value={arena.id}>{arena.name}</option>)}
            </select>
            <button type="button" onClick={()=>setCreatingArena(true)} className="mt-2 rounded border border-white/20 px-3 py-2 text-xs text-white">Criar arena</button>
            {competitionArenas.length === 0 && <p className="mt-2 text-[10px] text-rose-200/70">Crie uma arena com ao menos uma ação mensurável.</p>}

            <div className="mt-4 flex items-center justify-between border-y border-white/8 py-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">Prazo</div>
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
                <div><div className="text-sm font-black text-white">{selectedCompetitionStats.actionCount}</div><div className="text-[8px] font-bold uppercase text-white/45">Ações</div></div>
                <div><div className="text-sm font-black text-white">{selectedCompetitionStats.plannedTotal}</div><div className="text-[8px] font-bold uppercase text-white/45">Execuções</div></div>
                <div><div className="text-sm font-black text-amber-200">{selectedCompetitionStats.rewardXp} EXP</div><div className="text-[8px] font-bold uppercase text-white/45">Baú {selectedCompetitionStats.rewardChestType}</div></div>
              </div>
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-white/45">50 ouros reservados no envio e pagos no aceite. Recusa, cancelamento ou expiração do convite devolvem a reserva. Os dois começam do zero.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setCompetitionInviteFriend(null)} className="flex-1 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-white/60">Cancelar</button>
              <button id="connections-competition-submit" type="button" disabled={!selectedArenaId || Boolean(busyKey)} onClick={() => void sendCompetitionInvite()} className="flex-1 rounded-md bg-rose-300 px-3 py-2 text-xs font-black text-black disabled:opacity-40">Enviar convite</button>
            </div>
          </div>
        </div>
      )}

      {mentorshipPickerLink && (
        <div className="fixed inset-0 z-[10030] flex items-end justify-center bg-black/70 p-3 sm:items-center" onClick={() => setMentorshipPickerLink(null)}>
          <div className="w-full max-w-sm rounded-lg border border-white/12 bg-[#0b0c0f] p-4" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-base font-black text-white">Arena acompanhada</h3>
            <p className="mt-1 text-xs text-white/50">Escolha quais arenas o mentor pode abrir e acompanhar. Alterações incluídas no período.</p>
            <button onClick={()=>setSelectedMentorshipIds(selectedMentorshipIds.length===ownArenas.length?[]:ownArenas.map(a=>a.id))} className="my-2 text-xs text-amber-200">{selectedMentorshipIds.length===ownArenas.length?'Desmarcar todas':'Selecionar todas'}</button>
            <div className="max-h-64 overflow-y-auto">{ownArenas.map(arena=><label key={arena.id} className="flex items-center gap-2 py-2 text-sm text-white"><input type="checkbox" checked={selectedMentorshipIds.includes(arena.id)} onChange={e=>setSelectedMentorshipIds(ids=>e.target.checked?[...ids,arena.id]:ids.filter(id=>id!==arena.id))}/>{arena.name}</label>)}</div>
            {ownArenas.length === 0 && <p className="mt-2 text-[10px] text-amber-200/70">Crie uma arena primeiro; o mentor não fará isso por você.</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setMentorshipPickerLink(null)} className="flex-1 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-white/60">Cancelar</button>
              <button type="button" disabled={Boolean(busyKey)} onClick={() => void saveMentorshipArena()} id="connections-mentorship-share" className="flex-1 rounded-md bg-amber-300 px-3 py-2 text-xs font-black text-black disabled:opacity-40">Compartilhar</button>
            </div>
          </div>
        </div>
      )}

      {arenaDoVinculoAberta && (() => {
        // Quando a arena e sua, o modal recebe a arena VIVA do contexto: assim
        // ele abre editavel e mostra o seu estado de agora, nao a foto que o
        // servidor mandou junto do vinculo. Sendo do outro, vai a previa e
        // trava em readOnly — ninguem edita arena alheia por aqui.
        const previa = previewArenaFromEntry(arenaDoVinculoAberta);
        const minha = arenaVivaDoVinculo(arenaDoVinculoAberta);
        return (
          <ArenaDetailModal
            arena={minha || previa}
            actionsOverride={minha ? undefined : (arenaDoVinculoAberta.actions || [])}
            tasksOverride={minha&&arenaDoVinculoAberta.linkType!=='competicao'?undefined:tasksForEntry(arenaDoVinculoAberta)}
            readOnly={!minha}
            linkedRelationshipLinkId={arenaDoVinculoAberta.relationshipLinkId}
            linkedRelationshipType={arenaDoVinculoAberta.linkType || null}
            onClose={() => setArenaDoVinculoAberta(null)}
          />
        );
      })()}

      {creatingArena&&<NewArenaModal isOpen onClose={()=>setCreatingArena(false)} onArenaCreated={arena=>{setCreatingArena(false);setSelectedArenaId(arena.id);setEditingCreatedArena(arena);}}/>}
      {editingCreatedArena&&<ArenaDetailModal arena={assets.flatMap(a=>a.arenas).find(a=>a.id===editingCreatedArena.id)||editingCreatedArena} onClose={()=>setEditingCreatedArena(null)}/>}
      {reviewInvite&&<div className="fixed inset-0 z-[10040] flex items-center justify-center bg-black/80 p-4"><div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg bg-[#10131a] p-5 text-white">
        <h3 className="font-bold">{reviewInvite.renewalLinkId?'Renovar por 30 dias':'Revisar convite'}</h3><p className="my-2 text-sm">Quem enviou paga {reviewInvite.costGold} ouros. Você não será cobrado.</p>
        {reviewInvite.linkType==='mentoria'&&<p className="text-sm">{reviewInvite.pupilUserId===userProfile.id?'Você escolhe as arenas que a outra pessoa poderá acompanhar.':'Você acompanhará as arenas autorizadas pela outra pessoa.'}</p>}
        {reviewInvite.linkType==='competicao'&&<p className="text-sm">{reviewInvite.arenaSnapshot?.name} · {reviewInvite.arenaSnapshot?.durationDays} dias. Os dois começam do zero.</p>}
        {reviewInvite.actionsSnapshot?.map((a,index)=><p key={index} className="mt-2 text-xs text-white/70">{a.name} · {a.repetitions||1} repetições · {a.duration||0} min</p>)}
        {reviewInvite.arenaSnapshot?.selection?.map(a=><p key={a.arenaId} className="mt-2 text-sm">{a.name}</p>)}
        <div className="mt-4 flex gap-3"><button onClick={()=>setReviewInvite(null)}>Voltar</button><button disabled={Boolean(busyKey)} onClick={async()=>{await respond(reviewInvite,'accept');setReviewInvite(null);}} className="rounded bg-amber-200 px-4 py-2 text-black">Aceitar</button></div>
      </div></div>}
      {confirmationElement}
    </Portal>
  );
};
