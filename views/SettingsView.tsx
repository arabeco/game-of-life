import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useTutorial } from '../contexts/TutorialContext';
import { GM_CONFIG } from '../constants';
import { SovereignConfig, RelationshipLink, RelationshipLinkInvite, LinkNotificationType, UserProfile, Arena, Action, ScheduledTask } from '../types';
import { ChevronRightIcon, XIcon, LightbulbIcon, ClockIcon, TrashIcon, CheckIcon, SendIcon } from '../components/Icons';
import { GlassCard } from '../components/GlassCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { MasteryView } from './MasteryView';
import { SovereignPanelView } from './SovereignPanelView';
import { supabase } from '../supabaseClient';
import { SovereignCustomizer } from '../components/SovereignCustomizer';
import { SpectatorArenaModal } from '../components/SpectatorArenaModal';
import { CODEXES } from '../constants/items';

import { CodexModal } from '../components/CodexModal';

type SettingsTab = 'Geral' | 'Preferências' | 'Premium';
type NotificationMode = 'Silencioso' | 'Reflexivo' | 'Essencial' | 'Militar';
type PrivacyMode = 'Todos' | 'Amigos' | 'Personalizado' | 'Ninguém';

const notificationModes: { id: NotificationMode, name: string, icon: string, description: string }[] = [
    { id: 'Silencioso', name: 'O Monge', icon: '🧘', description: "Nenhuma notificação será enviada. O sistema aguarda sua busca ativa." },
    { id: 'Reflexivo', name: 'O Estoico', icon: '⚖️', description: "Um resumo diário com seu score e ações restantes é enviado à noite." },
    { id: 'Essencial', name: 'O Executivo', icon: '👔', description: "Apenas alertas para compromissos com horário fixo." },
    { id: 'Militar', name: 'O Soldado', icon: '⚔️', description: "Modo ativo com lembretes para planejar, executar e revisar seu dia." },
];

const NotificationCard: React.FC<{ icon: React.ReactNode, title: string, time?: string, message: string, fixedAtTop?: boolean, stackIndex?: number }> = ({ icon, title, time, message, fixedAtTop = true, stackIndex = 0 }) => {
    const topClasses = ['top-[88px]', 'top-[168px]', 'top-[248px]'];
    const topClass = topClasses[Math.max(0, Math.min(stackIndex, topClasses.length - 1))];
    const fixedClasses = fixedAtTop ? `fixed left-1/2 -translate-x-1/2 z-[90] w-[min(360px,92vw)] ${topClass}` : '';

    return (
    <GlassCard variant="neutral" className={`p-3 animate-fade-in ${fixedClasses}`}>
        <div className="flex items-start space-x-3">
            <div className="mt-1">{icon}</div>
            <div className="flex-grow">
                <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-sm text-white">{title}</h4>
                    {time && <p className="text-xs text-gray-400">{time}</p>}
                </div>
                <p className="text-sm text-gray-300">{message}</p>
            </div>
            <button className="p-1 text-gray-500 hover:text-white"><XIcon className="w-4 h-4" /></button>
        </div>
    </GlassCard>
    );
};

const NotificationSettingsModal: React.FC<{ currentMode: NotificationMode, onSave: (mode: NotificationMode) => void, onClose: () => void }> = ({ currentMode, onSave, onClose }) => {
    const [selectedMode, setSelectedMode] = useState<NotificationMode>(currentMode);
    
    const handleSave = () => { onSave(selectedMode); onClose(); };

    const renderPreview = () => {
        switch(selectedMode) {
            case 'Silencioso': return (<div className="text-center text-gray-400 space-y-2 p-4"><svg viewBox="0 0 100 20" className="w-24 mx-auto"><path d="M 0 10 Q 25 10, 50 10 T 100 10" stroke="currentColor" strokeWidth="2" fill="none"/></svg><p className="text-sm">{notificationModes.find(m => m.id === 'Silencioso')?.description}</p></div>);
            case 'Reflexivo': return (<NotificationCard icon={<ClockIcon className="w-5 h-5 accent-text" />} title="O Boletim Diário" time="20:00" message="Score: 85 | Ações Restantes: 2. 'A felicidade da sua vida depende da qualidade dos seus pensamentos.'" fixedAtTop stackIndex={0} />);
            case 'Essencial': return (<NotificationCard icon={<ClockIcon className="w-5 h-5 text-blue-400" />} title="Alerta de Compromisso" time="12:00" message="Reunião de Alinhamento em 2h." fixedAtTop stackIndex={0} />);
            case 'Militar': return (
                <>
                    <NotificationCard icon={<LightbulbIcon className="w-5 h-5 text-green-400" />} title="Alvorada (Planning)" time="08:00" message="Inicie o Planejamento Tático. Verifique o Grid ou o Sitrep." fixedAtTop stackIndex={0} />
                    <NotificationCard icon={<ClockIcon className="w-5 h-5 text-orange-400" />} title="Radar de Batalha" time="09:00" message="Próxima ação: Treino de Força (11:00). Prepare-se." fixedAtTop stackIndex={1} />
                    <NotificationCard icon={<ClockIcon className="w-5 h-5 accent-text" />} title="O Boletim Diário" time="20:00" message="Score: 85 | Ações Restantes: 2." fixedAtTop stackIndex={2} />
                </>
            );
            default: return null;
        }
    };

    return (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">Configurar Notificações</h2>
                <div className="grid grid-cols-2 gap-2">
                    {notificationModes.map(mode => (<button key={mode.id} onClick={() => setSelectedMode(mode.id)} className={`p-3 rounded-xl transition-colors text-center ${selectedMode === mode.id ? 'bg-white/20 ring-2 ring-white/30' : 'bg-black/20 hover:bg-white/10'}`}><span className="text-2xl">{mode.icon}</span><p className="text-sm font-bold">{mode.name}</p></button>))}
                </div>
                <div className="p-3 bg-black/20 rounded-xl min-h-[150px] flex flex-col justify-center">{renderPreview()}</div>
                <button onClick={handleSave} className="w-full py-2 rounded-xl luxe-skin-button">SALVAR</button>
            </GlassCard>
        </div>
    );
};

const SettingSelector: React.FC<{ label: string; value: string; onClick: () => void; }> = ({ label, value, onClick }) => (
    <div className="p-3 bg-black/20 rounded-xl">
        <div className="flex justify-between items-center">
            <label className="text-sm font-semibold">{label}</label>
            <button onClick={onClick} className="flex items-center space-x-2 text-sm text-gray-400"><span>{value}</span><ChevronRightIcon className="w-4 h-4" /></button>
        </div>
    </div>
);

const TutorialSettings: React.FC = () => {
    const { isTutorialCompleted, startTutorial } = useTutorial();
    return (
        <div className="p-3 bg-black/20 rounded-xl">
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="text-sm font-semibold">Nível 1 (Básico)</h4>
                    <p className={`text-xs ${isTutorialCompleted ? 'text-green-400' : 'accent-text'}`}>{isTutorialCompleted ? 'Concluído' : 'Não concluído'}</p>
                </div>
                <button onClick={startTutorial} className="text-sm font-bold bg-white/10 px-3 py-1 rounded-lg hover:bg-white/20">REPLAY</button>
            </div>
             <div className="flex justify-between items-center mt-2 opacity-50">
                <div><h4 className="text-sm font-semibold">Nível 2 (Intermediário)</h4><p className="text-xs text-gray-500">Em breve</p></div>
                <button disabled className="text-sm font-bold bg-white/5 px-3 py-1 rounded-lg cursor-not-allowed">Bloqueado</button>
            </div>
             <div className="flex justify-between items-center mt-2 opacity-50">
                <div><h4 className="text-sm font-semibold">Nível 3 (Avançado)</h4><p className="text-xs text-gray-500">Em breve</p></div>
                <button disabled className="text-sm font-bold bg-white/5 px-3 py-1 rounded-lg cursor-not-allowed">Bloqueado</button>
            </div>
        </div>
    );
};

const TutorialSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}>
        <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold uppercase tracking-wider text-center">Tutoriais</h2>
            <TutorialSettings />
            <button onClick={onClose} className="w-full py-2 rounded-xl luxe-skin-button">OK</button>
        </GlassCard>
    </div>
);

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const mapDbProfileToUserProfile = (row: any): UserProfile => {
    const normalizedRole = typeof row.role === 'string' ? row.role.toLowerCase() : 'user';
    const role = normalizedRole === 'admin' || normalizedRole === 'gm' ? normalizedRole : 'user';
    return {
    id: row.id,
    email: row.email ?? undefined,
    nickname: row.nickname ?? 'Soberano',
    avatarUrl: row.avatar_url ?? row.avatarUrl ?? '',
    border: row.border ?? 'default',
    level: typeof row.level === 'number' ? row.level : 1,
    backgroundUrl: row.background_url ?? row.backgroundUrl ?? '',
    bannerUrl: row.banner_url ?? row.bannerUrl ?? undefined,
    isOnline: !!(row.is_online ?? row.isOnline),
    visibleWidgets: Array.isArray(row.visible_widgets) ? row.visible_widgets : (Array.isArray(row.visibleWidgets) ? row.visibleWidgets : []),
    skin: row.skin ?? 'default',
    sovereign: row.sovereign ?? undefined,
    nobility: row.nobility ?? { exp: 0, rankId: 'vagante' },
    mood: typeof row.mood === 'number' ? row.mood : 50,
    chests: row.chests ?? undefined,
    wallet: row.wallet ?? { gold: row.gold ?? 0, fragments: row.fragments ?? 0 },
    inventory: [],
    role,
};
};

const mapToCamelCase = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(v => mapToCamelCase(v));
    if (obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));
            result[camelKey] = mapToCamelCase(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
};

const LinksModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userProfile, friends } = useGame();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invites, setInvites] = useState<RelationshipLinkInvite[]>([]);
    const [links, setLinks] = useState<RelationshipLink[]>([]);
    const [profilesById, setProfilesById] = useState<Record<string, UserProfile>>({});
    const [activeTab, setActiveTab] = useState<'mentoria' | 'parcerias' | 'desafios'>('mentoria');
    const [savingLinkId, setSavingLinkId] = useState<string | null>(null);
    const [sessionUid, setSessionUid] = useState<string | null>(null);
    const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
    const [spectatorData, setSpectatorData] = useState<{ arena: Arena, actions: Action[], tasks: ScheduledTask[], pupilName: string } | null>(null);

    const sessionReady = useMemo(() => !!sessionUid && isUuid(sessionUid), [sessionUid]);

    const hydrateProfiles = async (ids: string[]) => {
        const missing = ids.filter(id => !profilesById[id]);
        const toFetch = missing.filter(isUuid);
        if (toFetch.length === 0) return;

        const { data, error } = await supabase.from('user_profiles').select('*').in('id', toFetch);
        if (error || !data) return;
        setProfilesById(prev => {
            const next = { ...prev };
            for (const row of data as any[]) next[row.id] = mapDbProfileToUserProfile(row);
            return next;
        });
    };

    const refresh = async () => {
        setLoading(true);
        setError(null);

        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user.id;
        if (!uid || !isUuid(uid)) {
            setSessionUid(null);
            setInvites([]);
            setLinks([]);
            setLoading(false);
            return;
        }
        setSessionUid(uid);

        const [{ data: invitesData, error: invitesError }, { data: linksData, error: linksError }] = await Promise.all([
            supabase
                .from('relationship_link_invites')
                .select('*')
                .eq('recipient_id', uid)
                .eq('status', 'pending')
                .order('created_at', { ascending: false }),
            supabase
                .from('relationship_links')
                .select('*')
                .or(`mentor_id.eq.${uid},pupil_id.eq.${uid}`)
                .is('ended_at', null)
                .order('created_at', { ascending: false }),
        ]);

        if (invitesError) setError(invitesError.message);
        if (linksError) setError(linksError.message);

        const mappedInvites: RelationshipLinkInvite[] = (invitesData || []).map((r: any) => ({
            id: r.id,
            senderId: r.sender_id,
            recipientId: r.recipient_id,
            linkType: r.link_type,
            arenaId: r.arena_id,
            arenaSnapshot: r.arena_snapshot,
            status: r.status,
            createdAt: r.created_at,
            respondedAt: r.responded_at,
        }));
        const mappedLinks: RelationshipLink[] = (linksData || []).map((r: any) => ({
            id: r.id,
            mentorId: r.mentor_id,
            pupilId: r.pupil_id,
            linkType: r.link_type,
            arenaId: r.arena_id,
            arenaSnapshot: r.arena_snapshot,
            satisfactionLevel: typeof r.satisfaction_level === 'number' ? r.satisfaction_level : 50,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            endedAt: r.ended_at,
        }));

        setInvites(mappedInvites);
        setLinks(mappedLinks);
        setSliderValues(prev => {
            const next = { ...prev };
            for (const link of mappedLinks) {
                if (typeof next[link.id] !== 'number') next[link.id] = link.satisfactionLevel;
            }
            return next;
        });

        const idsToHydrate = [
            ...new Set([
                ...mappedInvites.flatMap(i => [i.senderId, i.recipientId]),
                ...mappedLinks.flatMap(l => [l.mentorId, l.pupilId]),
            ]),
        ];

        const prefilled: Record<string, UserProfile> = {};
        prefilled[userProfile.id] = userProfile;
        for (const friend of friends) prefilled[friend.id] = friend;
        setProfilesById(prev => ({ ...prefilled, ...prev }));
        await hydrateProfiles(idsToHydrate);
        setLoading(false);
    };

    useEffect(() => {
        refresh();
    }, []);

    const fetchSpectatorData = async (targetUserId: string, targetArenaId: string, targetName: string) => {
        setLoading(true);
        try {
            const { data: arenaData, error: arenaError } = await supabase.from('arenas').select('*').eq('id', targetArenaId).single();
            if (arenaError || !arenaData) throw new Error("Arena não encontrada.");

            const { data: actionsData } = await supabase.from('actions').select('*').eq('arena_id', targetArenaId);
            
            const today = new Date().toISOString().split('T')[0];
            const { data: tasksData } = await supabase.from('scheduled_tasks').select('*').in('action_id', (actionsData || []).map((a: any) => a.id)).eq('date', today);

            setSpectatorData({
                arena: mapToCamelCase(arenaData),
                actions: mapToCamelCase(actionsData || []),
                tasks: mapToCamelCase(tasksData || []),
                pupilName: targetName
            });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const acceptInvite = async (invite: RelationshipLinkInvite) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user.id;
        if (!uid || !isUuid(uid)) return;

        const { error: updateError } = await supabase
            .from('relationship_link_invites')
            .update({ status: 'accepted', responded_at: new Date().toISOString() })
            .eq('id', invite.id)
            .eq('recipient_id', uid);
        if (updateError) {
            setError(updateError.message);
            return;
        }

        const { error: insertError } = await supabase.from('relationship_links').insert({
            mentor_id: uid,
            pupil_id: invite.senderId,
            link_type: invite.linkType,
            arena_id: invite.arenaId,
            arena_snapshot: invite.arenaSnapshot,
            satisfaction_level: 50,
        });
        if (insertError) setError(insertError.message);
        await refresh();
    };

    const declineInvite = async (invite: RelationshipLinkInvite) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user.id;
        if (!uid || !isUuid(uid)) return;

        const { error } = await supabase
            .from('relationship_link_invites')
            .update({ status: 'declined', responded_at: new Date().toISOString() })
            .eq('id', invite.id)
            .eq('recipient_id', uid);
        if (error) setError(error.message);
        await refresh();
    };

    const setSatisfaction = async (link: RelationshipLink, level: number) => {
        setSavingLinkId(link.id);
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user.id;
        if (!uid || !isUuid(uid)) {
            setSavingLinkId(null);
            return;
        }

        const clamped = Math.max(0, Math.min(100, Math.round(level)));
        const { error } = await supabase
            .from('relationship_links')
            .update({ satisfaction_level: clamped })
            .eq('id', link.id)
            .eq('mentor_id', uid);
        if (error) setError(error.message);
        await refresh();
        setSavingLinkId(null);
    };

    const sendSignal = async (link: RelationshipLink, notificationType: LinkNotificationType) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user.id;
        if (!uid || !isUuid(uid)) return;

        const recipientId = uid === link.mentorId ? link.pupilId : link.mentorId;
        const { error } = await supabase.from('link_notifications_log').insert({
            link_id: link.id,
            sender_id: uid,
            recipient_id: recipientId,
            notification_type: notificationType,
        });
        if (error) setError(error.message);
    };

    const myPupils = links.filter(l => l.linkType === 'mentoria' && !!sessionUid && l.mentorId === sessionUid);
    const myMentors = links.filter(l => l.linkType === 'mentoria' && !!sessionUid && l.pupilId === sessionUid);
    const myPartners = links.filter(l => l.linkType === 'parceria');

    const getProfile = (id: string) => profilesById[id];

    const sliderColor = (value: number) => {
        if (value <= 33) return 'from-red-500/70 to-red-300/40';
        if (value <= 66) return 'from-[var(--skin-accent-color)]/70 to-[var(--skin-accent-color)]/40';
        return 'from-green-500/70 to-green-300/40';
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <div className="text-xs font-bold uppercase tracking-wider accent-text">VÍNCULOS</div>
                    <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                </div>

                <div className="flex space-x-2">
                    <button onClick={() => setActiveTab('mentoria')} className={`w-full py-2 rounded-xl font-bold text-xs tracking-widest border border-white/10 ${activeTab === 'mentoria' ? 'bg-black/30 accent-text' : 'bg-black/10 text-gray-300 hover:bg-black/20'}`}>MENTORIA</button>
                    <button onClick={() => setActiveTab('parcerias')} className={`w-full py-2 rounded-xl font-bold text-xs tracking-widest border border-white/10 ${activeTab === 'parcerias' ? 'bg-black/30 accent-text' : 'bg-black/10 text-gray-300 hover:bg-black/20'}`}>PARCERIAS</button>
                    <button onClick={() => setActiveTab('desafios')} className={`w-full py-2 rounded-xl font-bold text-xs tracking-widest border border-white/10 ${activeTab === 'desafios' ? 'bg-black/30 accent-text' : 'bg-black/10 text-gray-300 hover:bg-black/20'}`}>DESAFIOS</button>
                </div>

                {!sessionReady && (
                    <div className="text-center text-sm text-gray-400 bg-black/20 border border-white/10 rounded-xl p-3">
                        Faça login no Supabase para usar Vínculos.
                    </div>
                )}

                {sessionReady && (
                    <div className="space-y-4">
                        {error && <div className="text-xs text-red-400 bg-black/20 border border-red-500/20 rounded-xl p-2">{error}</div>}
                        {loading ? (
                            <div className="text-center text-sm text-gray-500 py-4">Carregando...</div>
                        ) : (
                            <>
                                {activeTab === 'mentoria' && (
                                    <>
                                        {invites.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-black tracking-widest text-gray-400">CONVITES</div>
                                                {invites.map(invite => {
                                                    const sender = getProfile(invite.senderId);
                                                    return (
                                                        <div key={invite.id} className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                                                                    {sender?.avatarUrl ? <img src={sender.avatarUrl} alt={sender.nickname} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-500">?</span>}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-bold text-white">{sender?.nickname || 'Soberano'}</div>
                                                                    <div className="text-xs text-gray-400">convoca você para observar {invite.arenaSnapshot?.name || 'uma arena'}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => declineInvite(invite)} className="w-full py-2 rounded-xl luxe-button-secondary">RECUSAR</button>
                                                                <button onClick={() => acceptInvite(invite)} className="w-full py-2 rounded-xl luxe-skin-button">ACEITAR</button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <div className="text-[10px] font-black tracking-widest text-gray-400">MEUS PUPILOS</div>
                                            {myPupils.length === 0 ? (
                                                <div className="text-center text-sm text-gray-500 py-4">Nenhum vínculo ativo.</div>
                                            ) : (
                                                myPupils.map(link => {
                                                    const pupil = getProfile(link.pupilId);
                                                    const localValue = typeof sliderValues[link.id] === 'number' ? sliderValues[link.id] : link.satisfactionLevel;
                                                    return (
                                                        <div key={link.id} className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-2">
                                                            <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-xl p-1 transition-colors" onClick={() => fetchSpectatorData(link.pupilId, link.arenaId, pupil?.nickname || 'Pupilo')}>
                                                                <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                                                                    {pupil?.avatarUrl ? <img src={pupil.avatarUrl} alt={pupil.nickname} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-500">?</span>}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-bold text-white">{pupil?.nickname || 'Pupilo'}</div>
                                                                    <div className="text-xs text-gray-400">{link.arenaSnapshot?.icon || '👁️'} {link.arenaSnapshot?.name || 'Arena'}</div>
                                                                </div>
                                                                <div className="text-xs font-bold text-gray-400">{Math.round(localValue)}%</div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <input
                                                                    type="range"
                                                                    min={0}
                                                                    max={100}
                                                                    value={localValue}
                                                                    onChange={(e) => {
                                                                        const next = Number(e.target.value);
                                                                        setSliderValues(prev => ({ ...prev, [link.id]: next }));
                                                                    }}
                                                                    onMouseUp={() => setSatisfaction(link, localValue)}
                                                                    onTouchEnd={() => setSatisfaction(link, localValue)}
                                                                    className={`w-full h-2 rounded-full appearance-none bg-gradient-to-r ${sliderColor(localValue)} outline-none`}
                                                                />
                                                                {savingLinkId === link.id && <div className="text-[10px] text-gray-500">Salvando...</div>}
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <button onClick={() => sendSignal(link, 'praise')} className="py-2 rounded-xl bg-black/20 border border-white/10 text-xs font-bold hover:bg-black/30">ELOGIO</button>
                                                                <button onClick={() => sendSignal(link, 'support')} className="py-2 rounded-xl bg-black/20 border border-white/10 text-xs font-bold hover:bg-black/30">FORÇA</button>
                                                                <button onClick={() => sendSignal(link, 'scold')} className="py-2 rounded-xl bg-black/20 border border-white/10 text-xs font-bold hover:bg-black/30">BRONCA</button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-[10px] font-black tracking-widest text-gray-400">MEUS MENTORES</div>
                                            {myMentors.length === 0 ? (
                                                <div className="text-center text-sm text-gray-500 py-4">Nenhum mentor te observando.</div>
                                            ) : (
                                                myMentors.map(link => {
                                                    const mentor = getProfile(link.mentorId);
                                                    const value = link.satisfactionLevel;
                                                    return (
                                                        <div key={link.id} className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                                                                    {mentor?.avatarUrl ? <img src={mentor.avatarUrl} alt={mentor.nickname} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-500">?</span>}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-bold text-white">{mentor?.nickname || 'Mentor'}</div>
                                                                    <div className="text-xs text-gray-400">observa {link.arenaSnapshot?.icon || '👁️'} {link.arenaSnapshot?.name || 'Arena'}</div>
                                                                </div>
                                                                <div className={`text-xs font-bold ${value < 34 ? 'text-red-400' : value < 67 ? 'text-yellow-400' : 'text-green-400'}`}>{value}%</div>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min={0}
                                                                max={100}
                                                                value={value}
                                                                readOnly
                                                                className={`w-full h-2 rounded-full appearance-none bg-gradient-to-r ${sliderColor(value)} outline-none opacity-80`}
                                                            />
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </>
                                )}

                                {activeTab === 'parcerias' && (
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-black tracking-widest text-gray-400">VÍNCULOS DE SANGUE</div>
                                        {myPartners.length === 0 ? (
                                            <div className="text-center text-sm text-gray-500 py-4">Nenhuma parceria ativa.</div>
                                        ) : (
                                            myPartners.map(link => {
                                                const isMeMentor = link.mentorId === sessionUid;
                                                const partnerId = isMeMentor ? link.pupilId : link.mentorId;
                                                const partner = getProfile(partnerId);
                                                
                                                return (
                                                    <div key={link.id} className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                                                                {partner?.avatarUrl ? <img src={partner.avatarUrl} alt={partner.nickname} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-500">?</span>}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-sm font-bold text-white">{partner?.nickname || 'Parceiro'}</div>
                                                                <div className="text-xs text-gray-400">Parceria em {link.arenaSnapshot?.name || 'Arena'}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex gap-2">
                                                             <div className="flex-1 bg-black/30 rounded-xl p-2 text-center border border-white/5 cursor-pointer hover:border-white/20" onClick={() => isMeMentor ? null : fetchSpectatorData(partnerId, link.arenaId, partner?.nickname || 'Parceiro')}>
                                                                 <div className="text-[10px] text-gray-500 uppercase">Eu</div>
                                                                 <div className="text-sm font-bold text-white">{link.arenaSnapshot?.name}</div>
                                                                 {/* Sync status would go here */}
                                                             </div>
                                                             <div className="flex-1 bg-black/30 rounded-xl p-2 text-center border border-white/5 cursor-pointer hover:border-white/20" onClick={() => !isMeMentor ? null : fetchSpectatorData(partnerId, link.arenaId, partner?.nickname || 'Parceiro')}>
                                                                 <div className="text-[10px] text-gray-500 uppercase">Parceiro</div>
                                                                 <div className="text-sm font-bold text-white">{link.arenaSnapshot?.name}</div>
                                                             </div>
                                                        </div>
                                                        
                                                        <div className="text-center text-[10px] text-gray-500 italic">
                                                            "Aguardando sincronia..."
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                {activeTab === 'desafios' && (
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-black tracking-widest text-gray-400">EVENTOS PVP</div>
                                        <div className="bg-black/20 border border-white/10 rounded-2xl p-4 text-center space-y-2 opacity-70">
                                            <div className="text-2xl">⚔️</div>
                                            <div className="text-sm font-bold text-white">Corrida de XP</div>
                                            <div className="text-xs text-gray-400">Quem faz 1000xp primeiro?</div>
                                            <div className="w-full bg-black/30 rounded-full h-2 mt-2 overflow-hidden">
                                                <div className="bg-blue-500 h-full w-1/2"></div>
                                            </div>
                                            <div className="text-[10px] text-gray-500">Expira em 2d 4h</div>
                                        </div>
                                        <div className="text-center text-xs text-gray-500 py-4">Mais desafios em breve.</div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </GlassCard>
            {spectatorData && (
                <SpectatorArenaModal
                    arena={spectatorData.arena}
                    actions={spectatorData.actions}
                    tasks={spectatorData.tasks}
                    pupilName={spectatorData.pupilName}
                    onClose={() => setSpectatorData(null)}
                >
                    {/* Add controls here if needed, like slider for mentor */}
                </SpectatorArenaModal>
            )}
        </div>
    );
};

type FeedbackQuestion = { id: number; label: string; category: 'Core' | 'Dopamina' | 'Valor' };

const feedbackQuestions: FeedbackQuestion[] = [
    { id: 1, label: 'Fluidez do Campo de Batalha (Planner)', category: 'Core' },
    { id: 2, label: 'Estabilidade do Sistema (Bugs & Performance)', category: 'Core' },
    { id: 3, label: 'Ritualística (SITREP & Fechamento)', category: 'Core' },
    { id: 4, label: 'Senso de Progresso (XP & Níveis)', category: 'Dopamina' },
    { id: 5, label: 'Identidade Visual (UI & Avatar)', category: 'Dopamina' },
    { id: 6, label: 'Mecânica do Santuário (Manutenção)', category: 'Dopamina' },
    { id: 7, label: 'Pressão Social (Clãs & Vínculos)', category: 'Valor' },
    { id: 8, label: 'Utilidade do Codex (Templates)', category: 'Valor' },
    { id: 9, label: 'Impacto na Realidade', category: 'Valor' },
    { id: 10, label: 'Nível de Recomendação (NPS)', category: 'Valor' },
];

const getSovereignLabel = (value: number) => {
    const rounded = Math.max(1, Math.min(5, Math.round(value)));
    if (rounded === 1) return 'Péssimo / Caos';
    if (rounded === 2) return 'Fraco';
    if (rounded === 3) return 'Aceitável';
    if (rounded === 4) return 'Muito Bom';
    return 'Excelente / Soberano';
};

const getSovereignPhrase = (questionId: number, value: number) => {
    const rounded = Math.max(1, Math.min(5, Math.round(value)));
    const core = questionId <= 3;
    const dopamine = questionId >= 4 && questionId <= 6;
    const valueBlock = questionId >= 7;

    const prefix = core ? 'Motor:' : dopamine ? 'Dopamina:' : 'Valor:';

    if (rounded === 1) return `${prefix} em colapso. Precisa de reforço imediato.`;
    if (rounded === 2) return `${prefix} instável. Dá pra usar, mas sangra fricção.`;
    if (rounded === 3) return `${prefix} funcional. Ainda falta impacto e polimento.`;
    if (rounded === 4) return `${prefix} forte. Começa a parecer uma ferramenta séria.`;
    return `${prefix} soberano. Está virando extensão da mente.`;
};

const SovereignSlider: React.FC<{ value: number; onChange: (next: number) => void }> = ({ value, onChange }) => {
    const clamped = Math.max(1, Math.min(5, value));
    const pct = ((clamped - 1) / 4) * 100;
    const fill = pct < 20 ? 'rgba(239,68,68,0.85)' : pct < 70 ? 'var(--skin-accent-color)' : 'var(--skin-accent-color)';
    const track = `linear-gradient(90deg, ${fill} 0%, ${fill} ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`;

    return (
        <div className="relative w-full">
            <div className="h-3 rounded-full border border-white/10" style={{ background: track }} />
            <div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rotate-45 bg-black/70 border border-[var(--skin-accent-color)] shadow-[0_0_12px_var(--sephirot-glow-color)]"
                style={{ left: `calc(${pct}% - 10px)` }}
            />
            <input
                type="range"
                min={1}
                max={5}
                step={0.1}
                value={clamped}
                onChange={(e) => onChange(Number(e.target.value))}
                className="absolute inset-0 w-full h-6 opacity-0"
            />
        </div>
    );
};

const FeedbackBetaModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userProfile } = useGame();
    const [answers, setAnswers] = useState<Record<number, number>>(() => {
        const initial: Record<number, number> = {};
        for (const q of feedbackQuestions) initial[q.id] = 3;
        return initial;
    });
    const [notes, setNotes] = useState('');
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const sendReport = async () => {
        setSending(true);
        setStatus('Enviando dados para o QG...');

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const uid = sessionData.session?.user.id;
            if (!uid || !isUuid(uid)) {
                setStatus('Faça login para enviar o relatório.');
                setSending(false);
                return;
            }

            const payload = {
                schemaVersion: 1,
                questions: feedbackQuestions.map(q => ({
                    id: q.id,
                    label: q.label,
                    category: q.category,
                    value: Number((answers[q.id] ?? 3).toFixed(1)),
                })),
                notes: notes.trim() || undefined,
                client: {
                    submittedAt: new Date().toISOString(),
                },
            };

            const { error } = await supabase.from('feedback_reports').insert({
                user_id: uid,
                responses: payload,
            });

            if (error) {
                setStatus(error.message);
                setSending(false);
                return;
            }

            setStatus('Relatório enviado.');
            window.setTimeout(() => {
                setSending(false);
                onClose();
            }, 700);
        } catch (e: any) {
            setStatus(e?.message || 'Falha ao enviar.');
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider accent-text">Relatório de Inteligência Beta</div>
                        <div className="text-[10px] text-gray-500">ID: {userProfile.nickname}</div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                </div>

                <div className="space-y-5 max-h-[62vh] overflow-y-auto pr-1">
                    {feedbackQuestions.map(q => {
                        const v = answers[q.id] ?? 3;
                        return (
                            <div key={q.id} className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="text-[10px] font-black tracking-widest text-gray-500">{q.category.toUpperCase()}</div>
                                        <div className="text-sm font-bold text-white">{q.id}. {q.label}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black accent-text">{v.toFixed(1)}</div>
                                        <div className="text-[10px] font-bold text-gray-400">{getSovereignLabel(v)}</div>
                                    </div>
                                </div>

                                <SovereignSlider value={v} onChange={(next) => setAnswers(prev => ({ ...prev, [q.id]: next }))} />
                                <div className="text-xs text-gray-400">{getSovereignPhrase(q.id, v)}</div>
                            </div>
                        );
                    })}

                    <div className="bg-black/20 border border-white/10 rounded-2xl p-3 space-y-2">
                        <div className="text-xs font-bold text-gray-400">Observações Táticas (Bugs ou Ideias)</div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] text-sm"
                            placeholder="Descreva o bug, a ideia ou o ajuste que você quer ver no campo."
                        />
                    </div>
                </div>

                {status && (
                    <div className={`text-center text-xs ${sending ? 'text-[var(--skin-accent-color)] animate-pulse' : 'text-gray-400'}`}>{status}</div>
                )}

                <button
                    onClick={sendReport}
                    disabled={sending}
                    className="w-full py-3 rounded-xl luxe-skin-button disabled:opacity-60"
                >
                    {sending ? 'ENVIANDO DADOS PARA O QG...' : 'ENVIAR RELATÓRIO'}
                </button>
            </GlassCard>
        </div>
    );
};

const NobrezaHierarchyView: React.FC = () => {
    const { userProfile, nobilityRanks } = useGame();
    const currentRank = nobilityRanks.find(r => r.id === userProfile.nobility.rankId);
    const nextRankIndex = nobilityRanks.findIndex(r => r.id === userProfile.nobility.rankId) + 1;
    const nextRank = nobilityRanks[nextRankIndex];
    const expForCurrentRank = currentRank?.expTotalRequired || 0;
    const expForNextRank = nextRank?.expTotalRequired || expForCurrentRank;
    const progressInRank = userProfile.nobility.exp - expForCurrentRank;
    const expToNextRank = expForNextRank - expForCurrentRank;
    const progressPercentage = expToNextRank > 0 ? (progressInRank / expToNextRank) * 100 : 100;

    return (
        <div className="space-y-6">
            <GlassCard variant="accent" className="text-center">
                <p className="text-sm uppercase tracking-wider">NOBREZA</p>
                <h2 className="text-3xl font-black accent-text">{currentRank?.name || 'N/A'}</h2>
                <div className="mt-4">
                    <div className="flex justify-between text-xs font-bold">
                        <span>XP ATUAL: {userProfile.nobility.exp.toLocaleString('pt-BR')}</span>
                        <span>{nextRank ? `PRÓXIMO: ${nextRank.expTotalRequired.toLocaleString('pt-BR')} XP` : 'Topo'}</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2.5 mt-1">
                        <div className="bg-[var(--skin-accent-color)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%`}}></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-white/70 mt-2">
                        <span>{currentRank ? `${currentRank.expTotalRequired.toLocaleString('pt-BR')} XP (patente)` : ''}</span>
                        <span>{nextRank ? `${nextRank.expTotalRequired.toLocaleString('pt-BR')} XP (próxima)` : 'Topo'}</span>
                    </div>
                </div>
            </GlassCard>
            <div>
                <h3 className="text-lg font-bold tracking-wider mb-2">Hierarquia da Nobreza</h3>
                <div className="space-y-2">
                    {nobilityRanks.map(rank => (
                        <GlassCard key={rank.id} variant="neutral" className={`p-3 ${rank.id === currentRank?.id ? 'ring-2 ring-[var(--skin-accent-color)]' : 'opacity-70'}`}>
                            <div className="flex justify-between items-center">
                                <span className="font-bold">{rank.name}</span>
                                <span className="text-sm text-gray-400">{rank.expTotalRequired.toLocaleString('pt-BR')} XP</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-white/60 mt-1">
                                <span>{rank.expTotalRequired.toLocaleString('pt-BR')} XP total</span>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
};

const GeralTab: React.FC = () => {
    const { userProfile, updateUserProfile, nobilityRanks, activeCycle, startCycle, assets } = useGame();
    const [nickname, setNickname] = useState(() => userProfile.nickname);
    const [isHierarchyVisible, setIsHierarchyVisible] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showStartCycle, setShowStartCycle] = useState(false);
    const [showMastery, setShowMastery] = useState(false);
    const [cycleName, setCycleName] = useState('');
    const [cycleEndDate, setCycleEndDate] = useState('');

    const handleSave = () => { updateUserProfile({ nickname }); alert("Perfil salvo!"); };
    
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error.message);
        }
    };

    const currentRank = nobilityRanks.find(r => r.id === userProfile.nobility.rankId);
    const nextRankIndex = nobilityRanks.findIndex(r => r.id === userProfile.nobility.rankId) + 1;
    const nextRank = nobilityRanks[nextRankIndex];
    const expForCurrentRank = currentRank?.expTotalRequired || 0;
    const expForNextRank = nextRank?.expTotalRequired || expForCurrentRank;
    const progressInRank = userProfile.nobility.exp - expForCurrentRank;
    const expToNextRank = expForNextRank - expForCurrentRank;
    const progressPercentage = expToNextRank > 0 ? (progressInRank / expToNextRank) * 100 : 100;

    const masteryTotalLevel = assets
        .filter(a => a.id !== 'geral')
        .reduce((sum, a) => sum + (a.level === 0 ? 1 : (a.level || 1)), 0);

    useEffect(() => {
        const today = new Date();
        const defaultEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        if (!cycleEndDate) setCycleEndDate(formatDate(defaultEnd));
        if (!cycleName) {
            const month = today.toLocaleString('pt-BR', { month: 'long' });
            setCycleName(`Ciclo de ${month}`);
        }
    }, [cycleEndDate, cycleName]);

    if (isHierarchyVisible) return (<div><button onClick={() => setIsHierarchyVisible(false)} className="mb-4 text-sm font-bold text-gray-400 hover:text-white">&larr; Voltar</button><NobrezaHierarchyView /></div>);

    return (
        <div className="space-y-6">
            <GlassCard variant="accent" className="text-center cursor-pointer relative overflow-hidden group" onClick={() => setIsHierarchyVisible(true)}>
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--sephirot-glow-color)] to-black/60 pointer-events-none" />
                <div className="relative z-10">
                    <p className="text-[10px] uppercase tracking-[0.2em] accent-text mb-1">Seu Status</p>
                    <h2 className="text-3xl font-black accent-text drop-shadow-lg">{currentRank?.name || 'N/A'}</h2>
                    
                    <div className="mt-6 px-2">
                        <div className="flex justify-between text-[10px] font-bold tracking-wider accent-text opacity-80 mb-2">
                            <span>XP ATUAL: {userProfile.nobility.exp.toLocaleString('pt-BR')}</span>
                            <span>{nextRank ? `PRÓXIMO: ${nextRank.expTotalRequired.toLocaleString('pt-BR')}` : 'MÁXIMO'}</span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-3 p-0.5 border border-white/5">
                            <div className="bg-[var(--skin-accent-color)] h-full rounded-full transition-all duration-700 shadow-[0_0_10px_var(--sephirot-glow-color)]" style={{ width: `${progressPercentage}%`}}></div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            <GlassCard variant="neutral" className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ciclo atual</div>
                        {activeCycle ? (
                            <>
                                <div className="text-lg font-bold text-white truncate">{activeCycle.name}</div>
                                <div className="text-xs text-gray-500 mt-1 font-mono">{activeCycle.startDate} → {activeCycle.endDate}</div>
                            </>
                        ) : (
                            <>
                                <div className="text-lg font-bold text-white">Sem ciclo ativo</div>
                                <div className="text-xs text-gray-500 mt-1">Crie um ciclo para registrar sua história.</div>
                            </>
                        )}
                    </div>
                    {!activeCycle && (
                        <button
                            onClick={() => setShowStartCycle(true)}
                            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
                        >
                            Criar
                        </button>
                    )}
                </div>
            </GlassCard>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-wider">Maestria</h2>
                    <button
                        onClick={() => setShowMastery(true)}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
                    >
                        Abrir sliders
                    </button>
                </div>

                <GlassCard variant="neutral" className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Seu nível</div>
                            <div className="text-2xl font-black text-white">{masteryTotalLevel}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500">Legado / Soberano</div>
                            <div className="text-xs text-gray-400">Editar por área ao abrir</div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                    <label className="text-sm font-semibold">Nickname</label>
                    <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="px-3 py-1 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:border-[var(--skin-accent-color)] transition-colors w-40 text-right"/>
                </div>
                <div className="flex space-x-2">
                    <button onClick={handleSave} className="w-1/2 py-3 rounded-xl luxe-skin-button transition-transform hover:scale-105">SALVAR PERFIL</button>
                    <button onClick={handleLogout} className="w-1/2 py-3 rounded-xl bg-red-900/50 text-red-300 hover:bg-red-800/80 shadow-[0_0_8px_rgba(255,50,50,0.3)] transition-all">SAIR</button>
                </div>
            </div>

             <div className="text-center pt-4">
                 <button onClick={() => setShowDeleteConfirm(true)} className="text-red-500 hover:text-red-400 text-sm font-semibold">Deletar Conta</button>
            </div>

            {showDeleteConfirm && (
                <ConfirmationModal
                    title="Deletar Conta"
                    message="Tem certeza? Esta ação é irreversível."
                    onConfirm={() => alert('Conta deletada!')}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}

            {showStartCycle && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={() => setShowStartCycle(false)}>
                    <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold uppercase tracking-wider text-center">Criar Ciclo</h2>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={cycleName}
                                onChange={(e) => setCycleName(e.target.value)}
                                placeholder="Nome do ciclo"
                                className="w-full p-2 bg-black/30 rounded-lg border border-white/20"
                            />
                            <input
                                type="date"
                                value={cycleEndDate}
                                onChange={(e) => setCycleEndDate(e.target.value)}
                                className="w-full p-2 bg-black/30 rounded-lg border border-white/20"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => setShowStartCycle(false)} className="w-1/2 py-2 rounded-xl luxe-button-secondary">Cancelar</button>
                            <button
                                onClick={() => {
                                    if (!cycleName.trim() || !cycleEndDate) return;
                                    startCycle(cycleName.trim(), cycleEndDate);
                                    setShowStartCycle(false);
                                }}
                                className="w-1/2 py-2 rounded-xl luxe-skin-button"
                            >
                                Criar
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {showMastery && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={() => setShowMastery(false)}>
                    <GlassCard variant="neutral" className="w-full max-w-sm m-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                        <div className="p-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold tracking-wider">Maestria</h2>
                            <button onClick={() => setShowMastery(false)} className="p-1 rounded-full bg-black/20 hover:bg-black/50">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-4 pb-4 max-h-[75vh] overflow-y-auto">
                            <MasteryView />
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

type AssistantMode = 1 | 2 | 3;

const AssistantModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [mode, setMode] = useState<AssistantMode>(1);
    const options: { id: AssistantMode; title: string; subtitle: string }[] = [
        { id: 1, title: 'Opção 1', subtitle: 'Curta e objetiva' },
        { id: 2, title: 'Opção 2', subtitle: 'Orientadora (passo a passo)' },
        { id: 3, title: 'Opção 3', subtitle: 'Ritual / narrativa' },
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <div className="text-xs font-bold uppercase tracking-wider accent-text">Assistente IA</div>
                    <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="space-y-2">
                    {options.map(o => (
                        <button
                            key={o.id}
                            onClick={() => setMode(o.id)}
                            className={`w-full text-left p-3 rounded-2xl border border-white/10 ${mode === o.id ? 'bg-white/10' : 'bg-black/20 hover:bg-black/30'}`}
                        >
                            <div className="font-bold">{o.title}</div>
                            <div className="text-xs text-gray-500">{o.subtitle}</div>
                        </button>
                    ))}
                </div>
                <div className="text-xs text-gray-500">Mock: conversa não implementada.</div>
                <button onClick={onClose} className="w-full py-2 rounded-xl luxe-skin-button">OK</button>
            </GlassCard>
        </div>
    );
};

// --- NEW TABS ---

const PreferenciasTab: React.FC = () => {
    const { userProfile } = useGame();
    const [notificationMode, setNotificationMode] = useState<NotificationMode>('Militar');
    const [privacyMode, setPrivacyMode] = useState<PrivacyMode>('Amigos');
    const [modal, setModal] = useState<'notification' | 'privacy' | 'tutorial' | null>(null);
    const [isFeedbackOpen, setFeedbackOpen] = useState(false);

    const currentNotificationName = notificationModes.find(m => m.id === notificationMode)?.name || 'N/A';

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Grupo Geral */}
            <section className="space-y-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1 border-b border-white/5 pb-2">Preferências</h2>
                <div className="space-y-2">
                    <SettingSelector label="Tutoriais" value="Revisar" onClick={() => setModal('tutorial')} />
                    <SettingSelector label="Privacidade" value={privacyMode} onClick={() => setModal('privacy')} />
                    <SettingSelector label="Notificações" value={currentNotificationName} onClick={() => setModal('notification')} />
                </div>
            </section>

            {/* Grupo Feedback */}
            <section className="space-y-4">
                 <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1 border-b border-white/5 pb-2">Suporte</h2>
                 <button
                    onClick={() => setFeedbackOpen(true)}
                    className="w-full py-4 rounded-xl border border-white/10 bg-black/20 hover:bg-black/30 font-bold text-xs tracking-widest accent-text flex items-center justify-center gap-2 transition-all"
                >
                    <span>📊</span> ENVIAR FEEDBACK BETA
                </button>
            </section>

            {modal === 'notification' && <NotificationSettingsModal currentMode={notificationMode} onSave={setNotificationMode} onClose={() => setModal(null)} />}
            {modal === 'privacy' && <ConfirmationModal title="Modo de Privacidade" message="Função ainda não implementada." onConfirm={() => setModal(null)} onCancel={() => setModal(null)} />}
            {modal === 'tutorial' && <TutorialSettingsModal onClose={() => setModal(null)} />}
            {isFeedbackOpen && <FeedbackBetaModal onClose={() => setFeedbackOpen(false)} />}
        </div>
    );
};

const PremiumTab: React.FC = () => {
    const { userProfile } = useGame();
    const [isLinksOpen, setLinksOpen] = useState(false);
    const [isAssistantOpen, setAssistantOpen] = useState(false);
    const [isCodexOpen, setCodexOpen] = useState(false);
    const isPremium = userProfile.isPremium || userProfile.role === 'admin' || userProfile.role === 'gm';

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1 border-b border-[var(--skin-accent-color)]/20 pb-2">
                    <h2 className="text-sm font-bold accent-text uppercase tracking-widest">Soberania (Premium)</h2>
                    {!isPremium && <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">BLOQUEADO</span>}
                </div>
                
                <GlassCard variant="neutral" className={`p-4 space-y-3 ${!isPremium ? 'opacity-50 grayscale' : ''}`}>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { if (isPremium) setLinksOpen(true); }}
                            disabled={!isPremium}
                            className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-[var(--skin-accent-color)]/50 transition-all flex flex-col items-center gap-2 text-center group aspect-square justify-center"
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">🔗</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 group-hover:text-white">Vínculos</span>
                        </button>
                        <button
                            onClick={() => { if (isPremium) setCodexOpen(true); }}
                            disabled={!isPremium}
                            className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-[var(--skin-accent-color)]/50 transition-all flex flex-col items-center gap-2 text-center group aspect-square justify-center"
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">📜</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 group-hover:text-white">Codex</span>
                        </button>
                        <button
                            onClick={() => { if (isPremium) setAssistantOpen(true); }}
                            disabled={!isPremium}
                            className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-[var(--skin-accent-color)]/50 transition-all flex flex-col items-center gap-2 text-center group aspect-square justify-center"
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">🤖</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 group-hover:text-white">Assistente</span>
                        </button>
                        <button
                            onClick={() => alert('Mock: campanhas não implementadas.')}
                            disabled={!isPremium}
                            className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-[var(--skin-accent-color)]/50 transition-all flex flex-col items-center gap-2 text-center group aspect-square justify-center"
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">🎯</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 group-hover:text-white">Campanhas</span>
                        </button>
                    </div>
                    {!isPremium && (
                        <div className="text-center pt-2">
                            <p className="text-xs text-gray-400">Torne-se um Soberano para desbloquear.</p>
                        </div>
                    )}
                </GlassCard>
            </section>

            {(userProfile.role === 'admin' || userProfile.role === 'gm') && (
                <div className="pt-6 mt-6 border-t border-[var(--skin-accent-color)]/30">
                    <SovereignPanelView />
                </div>
            )}

            {isLinksOpen && <LinksModal onClose={() => setLinksOpen(false)} />}
            {isAssistantOpen && <AssistantModal onClose={() => setAssistantOpen(false)} />}
            {isCodexOpen && <CodexListModal onClose={() => setCodexOpen(false)} />}
        </div>
    );
};

interface CodexActionModalProps {
    codex: typeof CODEXES[0];
    onClose: () => void;
    onApply: () => void;
    onDelete: () => void;
    onDonate: (friendId: string) => void;
}

const CodexActionModal: React.FC<CodexActionModalProps> = ({ codex, onClose, onApply, onDelete, onDonate }) => {
    const { friends } = useGame();
    const [view, setView] = useState<'main' | 'donate'>('main');
    const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

    const handleDonateClick = () => {
        if (!selectedFriend) return;
        onDonate(selectedFriend);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 p-6 space-y-6 rounded-3xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-[var(--skin-accent-color)]/10 blur-[50px] pointer-events-none" />
                
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full bg-black/20 hover:bg-black/50 z-10">
                    <XIcon className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                    <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-6xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        {codex.icon}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{codex.name}</h2>
                        <p className="text-sm text-gray-400 mt-1">Codex de Conhecimento</p>
                    </div>
                </div>

                {view === 'main' ? (
                    <div className="grid grid-cols-3 gap-3 pt-4">
                        <button 
                            onClick={onApply}
                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/40 border border-white/10 hover:bg-white/5 hover:border-green-500/50 transition-all group"
                        >
                            <CheckIcon className="w-6 h-6 text-green-400 mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold text-gray-300">APLICAR</span>
                        </button>
                        <button 
                            onClick={() => setView('donate')}
                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/40 border border-white/10 hover:bg-white/5 hover:border-blue-500/50 transition-all group"
                        >
                            <SendIcon className="w-6 h-6 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold text-gray-300">DOAR</span>
                        </button>
                        <button 
                            onClick={onDelete}
                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/40 border border-white/10 hover:bg-red-900/20 hover:border-red-500/50 transition-all group"
                        >
                            <TrashIcon className="w-6 h-6 text-red-400 mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold text-gray-300">DELETAR</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center">Selecione o Aliado</h3>
                        
                        {friends.length === 0 ? (
                            <div className="text-center text-xs text-gray-500 py-4">
                                Você não possui aliados conectados.
                            </div>
                        ) : (
                            <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1">
                                {friends.map(friend => (
                                    <button
                                        key={friend.id}
                                        onClick={() => setSelectedFriend(friend.id)}
                                        className={`w-full flex items-center p-2 rounded-xl border transition-all ${selectedFriend === friend.id ? 'bg-white/10 border-[var(--skin-accent-color)]' : 'bg-black/30 border-white/5 hover:bg-white/5'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-black/50 overflow-hidden mr-3">
                                            {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">?</div>}
                                        </div>
                                        <span className="text-sm font-bold text-gray-200">{friend.nickname}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex space-x-2 pt-2">
                            <button onClick={() => setView('main')} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400">
                                Voltar
                            </button>
                            <button 
                                onClick={handleDonateClick}
                                disabled={!selectedFriend}
                                className="flex-1 py-2 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Enviar
                            </button>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

const CodexListModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userProfile, updateUserProfile, friends } = useGame();
    const [selectedCodex, setSelectedCodex] = useState<typeof CODEXES[0] | null>(null);
    const [isCreatorOpen, setCreatorOpen] = useState(false);

    // Filter owned codexes
    const myCodexes = useMemo(() => {
        const unlockedIds = Object.keys(userProfile.unlockedItems?.codexes || {});
        // Also check legacy/default unlocked logic if needed, but assuming userProfile has them
        return CODEXES.filter(c => unlockedIds.includes(c.id));
    }, [userProfile.unlockedItems]);

    const handleApply = () => {
        // In the future, this could equip a related border or background
        alert(`Codex "${selectedCodex?.name}" ativado com sucesso!`);
        setSelectedCodex(null);
    };

    const handleDelete = () => {
        if (!selectedCodex) return;
        if (confirm(`Tem certeza que deseja deletar ${selectedCodex.name}? Esta ação não pode ser desfeita.`)) {
            // Remove from unlockedItems
            const updatedCodexes = { ...(userProfile.unlockedItems?.codexes || {}) };
            delete updatedCodexes[selectedCodex.id];
            
            updateUserProfile({
                unlockedItems: {
                    ...userProfile.unlockedItems,
                    codexes: updatedCodexes
                } as any
            });
            setSelectedCodex(null);
        }
    };
    
    const handleCreateCodex = () => {
        setCreatorOpen(true);
    };

    const handleDonate = async (friendId: string) => {
        if (!selectedCodex) return;
        const friend = friends.find(f => f.id === friendId);
        
        if (confirm(`Confirmar envio de "${selectedCodex.name}" para ${friend?.nickname || 'Aliado'}? O item será removido do seu inventário.`)) {
            try {
                // 1. Get friend's current unlocked items
                const { data: friendData, error: fetchError } = await supabase
                    .from('user_profiles')
                    .select('unlocked_items')
                    .eq('id', friendId)
                    .single();

                if (fetchError) throw fetchError;

                const friendUnlockedItems = friendData.unlocked_items || {};
                const friendCodexes = friendUnlockedItems.codexes || {};

                // 2. Add codex to friend (using 1 as boolean/true equivalent)
                const updatedFriendCodexes = { ...friendCodexes, [selectedCodex.id]: 1 };
                const updatedFriendUnlockedItems = {
                    ...friendUnlockedItems,
                    codexes: updatedFriendCodexes
                };

                const { error: updateError } = await supabase
                    .from('user_profiles')
                    .update({ unlocked_items: updatedFriendUnlockedItems })
                    .eq('id', friendId);

                if (updateError) throw updateError;

                // 3. Remove from me
                const myUpdatedCodexes = { ...(userProfile.unlockedItems?.codexes || {}) };
                delete myUpdatedCodexes[selectedCodex.id];
                
                updateUserProfile({
                    unlockedItems: {
                        ...userProfile.unlockedItems,
                        codexes: myUpdatedCodexes
                    } as any
                });
                
                alert(`Codex enviado com sucesso para ${friend?.nickname}!`);
                setSelectedCodex(null);
            } catch (error: any) {
                console.error("Erro ao doar Codex:", error);
                alert("Erro ao enviar Codex. Tente novamente.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-lg m-4 rounded-3xl h-[80vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                    <h2 className="text-lg font-bold uppercase tracking-wider">Meus Codex</h2>
                    <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
                    <section className="space-y-4">
                        <div className="flex items-center justify-end px-1 pb-2">
                            <button onClick={handleCreateCodex} className="text-[10px] font-bold text-[var(--skin-accent-color)] uppercase hover:underline">Criar Novo</button>
                        </div>

                        {myCodexes.length === 0 ? (
                            <GlassCard variant="neutral" className="p-8 text-center opacity-70">
                                <div className="text-4xl mb-3">📜</div>
                                <h3 className="text-lg font-bold text-white">Nenhum Codex Encontrado</h3>
                                <p className="text-sm text-gray-400 mt-2">Adquira novos conhecimentos na Loja ou crie os seus próprios.</p>
                            </GlassCard>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {myCodexes.map(codex => (
                                    <button
                                        key={codex.id}
                                        onClick={() => setSelectedCodex(codex)}
                                        className="aspect-square rounded-xl bg-black/40 border border-white/10 hover:bg-white/5 transition-all flex flex-col items-center justify-center p-2 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform relative z-10 drop-shadow-lg">{codex.icon}</div>
                                        <span className="text-[10px] font-bold text-gray-400 text-center truncate w-full relative z-10 group-hover:text-white transition-colors">{codex.name.replace('Codex: ', '')}</span>
                                        
                                        {/* Rarity Dot */}
                                        <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${
                                            codex.rarity === 'legendary' ? 'bg-yellow-500 shadow-[0_0_5px_#eab308]' :
                                            codex.rarity === 'epic' ? 'bg-purple-500 shadow-[0_0_5px_#a855f7]' :
                                            codex.rarity === 'rare' ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6]' :
                                            'bg-gray-600'
                                        }`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
                
                {selectedCodex && (
                    <CodexActionModal 
                        codex={selectedCodex} 
                        onClose={() => setSelectedCodex(null)} 
                        onApply={handleApply}
                        onDelete={handleDelete}
                        onDonate={handleDonate}
                    />
                )}
            </GlassCard>
            {isCreatorOpen && <CodexModal onClose={() => setCreatorOpen(false)} />}
        </div>
    );
};

export const SettingsView: React.FC = () => {
    const { updateUserProfile, userProfile } = useGame();
    const [activeTab, setActiveTab] = useState<SettingsTab>('Geral');
    const [isSovereignEditorOpen, setSovereignEditorOpen] = useState(false);

    const handleSovereignSave = (newSovereignConfig: SovereignConfig) => {
        updateUserProfile({ sovereign: newSovereignConfig });
        setSovereignEditorOpen(false);
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'Geral': return <GeralTab />;
            case 'Preferências': return <PreferenciasTab />;
            case 'Premium': return <PremiumTab />;
            default: return null;
        }
    }
    
    let tabs: SettingsTab[] = ['Geral', 'Preferências', 'Premium'];

    return (
        <>
            <div id="settings-container" className="p-4 space-y-6 h-full flex flex-col">
                <div className="flex-shrink-0 flex items-center justify-center space-x-1 bg-black/20 p-1 rounded-2xl">
                    {tabs.map(tab => (
                         <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full px-2 py-2 text-xs font-semibold rounded-xl transition-colors ${
                                activeTab === tab ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex-grow min-h-0 overflow-y-auto">
                   {renderContent()}
                </div>
            </div>
            {isSovereignEditorOpen && (
                <SovereignCustomizer 
                    initialConfig={userProfile?.sovereign}
                    onClose={() => setSovereignEditorOpen(false)} 
                    onSave={handleSovereignSave} 
                />
            )}
        </>
    );
};
