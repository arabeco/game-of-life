
import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useTutorial } from '../contexts/TutorialContext';
import { SKINS_DATA, BORDERS_DATA, BANNERS_DATA } from '../constants';
import { SOVEREIGN_ASSETS } from '../constants/avatar';
import { MasteryView } from './MasteryView';
import { SovereignEditorModal } from '../components/AvatarCustomizerModal';
import { SovereignConfig, ChestType, Season, SeasonMission, RelationshipLink, RelationshipLinkInvite, LinkNotificationType, UserProfile } from '../types';
import { ChevronRightIcon, CheckIcon, XIcon, LightbulbIcon, ClockIcon } from '../components/Icons';
import { GlassCard } from '../components/GlassCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ChestOpeningModal } from '../components/ChestOpeningModal';
import { ItemDetailModal } from '../components/ItemDetailModal';
import { SovereignPanelView } from './SovereignPanelView';
import { HallOfFameView } from './HallOfFameView';
import { supabase } from '../supabaseClient';
import { SeasonDetailModal } from '../components/SeasonDetailModal';
import { CodexModal } from '../components/CodexModal';

type SettingsTab = 'Geral' | 'Arsenal' | 'Maestria' | 'Missões' | 'Hall da Fama';
type NotificationMode = 'Silencioso' | 'Reflexivo' | 'Essencial' | 'Militar';
type PrivacyMode = 'Todos' | 'Amigos' | 'Personalizado' | 'Ninguém';
type ItemType = 'Artefato' | 'Skin' | 'Borda' | 'Banner' | 'Consumível' | 'Baú';

const notificationModes: { id: NotificationMode, name: string, icon: string, description: string }[] = [
    { id: 'Silencioso', name: 'O Monge', icon: '🧘', description: "Nenhuma notificação será enviada. O sistema aguarda sua busca ativa." },
    { id: 'Reflexivo', name: 'O Estoico', icon: '⚖️', description: "Um resumo diário com seu score e ações restantes é enviado à noite." },
    { id: 'Essencial', name: 'O Executivo', icon: '👔', description: "Apenas alertas para compromissos com horário fixo." },
    { id: 'Militar', name: 'O Soldado', icon: '⚔️', description: "Modo ativo com lembretes para planejar, executar e revisar seu dia." },
];

const privacyModes: PrivacyMode[] = ['Todos', 'Amigos', 'Personalizado', 'Ninguém'];

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
            case 'Reflexivo': return (<NotificationCard icon={<ClockIcon className="w-5 h-5 text-yellow-400" />} title="O Boletim Diário" time="20:00" message="Score: 85 | Ações Restantes: 2. 'A felicidade da sua vida depende da qualidade dos seus pensamentos.'" fixedAtTop stackIndex={0} />);
            case 'Essencial': return (<NotificationCard icon={<ClockIcon className="w-5 h-5 text-blue-400" />} title="Alerta de Compromisso" time="12:00" message="Reunião de Alinhamento em 2h." fixedAtTop stackIndex={0} />);
            case 'Militar': return (
                <>
                    <NotificationCard icon={<LightbulbIcon className="w-5 h-5 text-green-400" />} title="Alvorada (Planning)" time="08:00" message="Inicie o Planejamento Tático. Verifique o Grid ou o Sitrep." fixedAtTop stackIndex={0} />
                    <NotificationCard icon={<ClockIcon className="w-5 h-5 text-orange-400" />} title="Radar de Batalha" time="09:00" message="Próxima ação: Treino de Força (11:00). Prepare-se." fixedAtTop stackIndex={1} />
                    <NotificationCard icon={<ClockIcon className="w-5 h-5 text-yellow-400" />} title="O Boletim Diário" time="20:00" message="Score: 85 | Ações Restantes: 2." fixedAtTop stackIndex={2} />
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
                <button onClick={handleSave} className="w-full py-2 rounded-xl luxe-button-primary">SALVAR</button>
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
                    <p className={`text-xs ${isTutorialCompleted ? 'text-green-400' : 'text-yellow-400'}`}>{isTutorialCompleted ? 'Concluído' : 'Não concluído'}</p>
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
            <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-primary">OK</button>
        </GlassCard>
    </div>
);

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const mapDbProfileToUserProfile = (row: any): UserProfile => ({
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
    role: row.role === 'admin' ? 'admin' : 'user',
});

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

    const getProfile = (id: string) => profilesById[id];

    const sliderColor = (value: number) => {
        if (value <= 33) return 'from-red-500/70 to-red-300/40';
        if (value <= 66) return 'from-yellow-500/70 to-yellow-300/40';
        return 'from-green-500/70 to-green-300/40';
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">VÍNCULOS</div>
                    <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                </div>

                <div className="flex space-x-2">
                    <button onClick={() => setActiveTab('mentoria')} className={`w-full py-2 rounded-xl font-bold text-xs tracking-widest border border-white/10 ${activeTab === 'mentoria' ? 'bg-black/30 text-[var(--gold)]' : 'bg-black/10 text-gray-300 hover:bg-black/20'}`}>MENTORIA</button>
                    <button disabled className="w-full py-2 rounded-xl font-bold text-xs tracking-widest border border-white/10 bg-black/10 text-gray-500 cursor-not-allowed">PARCERIAS</button>
                    <button disabled className="w-full py-2 rounded-xl font-bold text-xs tracking-widest border border-white/10 bg-black/10 text-gray-500 cursor-not-allowed">DESAFIOS</button>
                </div>

                {!sessionReady && (
                    <div className="text-center text-sm text-gray-400 bg-black/20 border border-white/10 rounded-xl p-3">
                        Faça login no Supabase para usar Vínculos.
                    </div>
                )}

                {sessionReady && activeTab === 'mentoria' && (
                    <div className="space-y-4">
                        {error && <div className="text-xs text-red-400 bg-black/20 border border-red-500/20 rounded-xl p-2">{error}</div>}
                        {loading ? (
                            <div className="text-center text-sm text-gray-500 py-4">Carregando...</div>
                        ) : (
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
                                                        <button onClick={() => acceptInvite(invite)} className="w-full py-2 rounded-xl luxe-gold-button">ACEITAR</button>
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
                                                    <div className="flex items-center gap-3">
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
                    </div>
                )}
            </GlassCard>
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
    const fill = pct < 20 ? 'rgba(239,68,68,0.85)' : pct < 70 ? 'rgba(234,179,8,0.85)' : 'rgba(245,158,11,0.9)';
    const track = `linear-gradient(90deg, ${fill} 0%, ${fill} ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`;

    return (
        <div className="relative w-full">
            <div className="h-3 rounded-full border border-white/10" style={{ background: track }} />
            <div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rotate-45 bg-black/70 border border-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
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
                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">Relatório de Inteligência Beta</div>
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
                                        <div className="text-2xl font-black text-[var(--gold)]">{v.toFixed(1)}</div>
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
                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:border-[var(--gold)] text-sm"
                            placeholder="Descreva o bug, a ideia ou o ajuste que você quer ver no campo."
                        />
                    </div>
                </div>

                {status && (
                    <div className={`text-center text-xs ${sending ? 'text-yellow-300 animate-pulse' : 'text-gray-400'}`}>{status}</div>
                )}

                <button
                    onClick={sendReport}
                    disabled={sending}
                    className="w-full py-3 rounded-xl luxe-gold-button disabled:opacity-60"
                >
                    {sending ? 'ENVIANDO DADOS PARA O QG...' : 'ENVIAR RELATÓRIO'}
                </button>
            </GlassCard>
        </div>
    );
};

const GeralTab: React.FC = () => {
    const { userProfile, updateUserProfile } = useGame();
    const [nickname, setNickname] = useState(userProfile.nickname);
    const [notificationMode, setNotificationMode] = useState<NotificationMode>('Militar');
    const [privacyMode, setPrivacyMode] = useState<PrivacyMode>('Amigos');
    const [modal, setModal] = useState<'notification' | 'privacy' | 'delete' | 'tutorial' | null>(null);
    const [isCodexOpen, setCodexOpen] = useState(false);
    const [isLinksOpen, setLinksOpen] = useState(false);
    const [isFeedbackOpen, setFeedbackOpen] = useState(false);

    const handleSave = () => { updateUserProfile({ nickname }); alert("Perfil salvo!"); };
    const handleNotificationSave = (mode: NotificationMode) => { setNotificationMode(mode); };
    
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error.message);
        }
        // The onAuthStateChange listener in App.tsx will handle redirecting to LoginView
    };

    const currentNotificationName = notificationModes.find(m => m.id === notificationMode)?.name || 'N/A';
    const isPremium = userProfile.role === 'admin';

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h2 className="text-lg font-bold tracking-wider">IDENTIDADE</h2>
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                    <label className="text-sm font-semibold">Nickname</label>
                    <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="px-3 py-1 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:border-[var(--gold)] transition-colors w-40 text-right"/>
                </div>
                <div className="flex space-x-2">
                    <button onClick={handleSave} className="w-1/2 py-3 rounded-xl luxe-gold-button transition-transform hover:scale-105">SALVAR PERFIL</button>
                    <button onClick={handleLogout} className="w-1/2 py-3 rounded-xl bg-red-900/50 text-red-300 hover:bg-red-800/80 shadow-[0_0_8px_rgba(255,50,50,0.3)] transition-all">SAIR</button>
                </div>
            </div>

            <div className="space-y-4">
                 <h2 className="text-lg font-bold tracking-wider">CONFIGURAÇÕES</h2>
                 <SettingSelector label="Tutoriais" value="Revisar" onClick={() => setModal('tutorial')} />
                 <SettingSelector label="Privacidade" value={privacyMode} onClick={() => setModal('privacy')} />
                 <SettingSelector label="Notificações" value={currentNotificationName} onClick={() => setModal('notification')} />
                 <button
                    onClick={() => setFeedbackOpen(true)}
                    className="w-full py-3 rounded-2xl border border-white/10 bg-black/20 hover:bg-black/30 font-bold text-xs tracking-widest text-[var(--gold)]"
                 >
                    📊 FEEDBACK BETA
                 </button>
                <button
                    onClick={() => {
                        if (!isPremium) return;
                        setCodexOpen(true);
                    }}
                    disabled={!isPremium}
                    className={`w-full py-3 rounded-2xl border border-white/10 bg-black/20 font-bold text-xs tracking-widest ${isPremium ? 'text-[var(--gold)] hover:bg-black/30' : 'opacity-60 cursor-not-allowed'}`}
                >
                    📚 CODEXES
                </button>
                <button
                    onClick={() => {
                        if (!isPremium) return;
                        setLinksOpen(true);
                    }}
                    disabled={!isPremium}
                    className={`w-full py-3 rounded-2xl border border-white/10 bg-black/20 font-bold text-xs tracking-widest ${isPremium ? 'text-[var(--gold)] hover:bg-black/30' : 'opacity-60 cursor-not-allowed'}`}
                >
                    🔗 VÍNCULOS
                </button>
            </div>
             <div className="text-center pt-4">
                 <button onClick={() => setModal('delete')} className="text-red-500 hover:text-red-400 text-sm font-semibold">Deletar Conta</button>
            </div>
            
            {userProfile.role === 'admin' && (
                <div className="pt-6 mt-6 border-t border-yellow-800/50">
                    <SovereignPanelView />
                </div>
            )}

            {modal === 'notification' && <NotificationSettingsModal currentMode={notificationMode} onSave={handleNotificationSave} onClose={() => setModal(null)} />}
            {modal === 'privacy' && <ConfirmationModal title="Modo de Privacidade" message="Função ainda não implementada." onConfirm={() => setModal(null)} onCancel={() => setModal(null)} />}
            {modal === 'delete' && <ConfirmationModal title="Deletar Conta" message="Tem certeza? Esta ação é irreversível." onConfirm={() => alert("Conta deletada!")} onCancel={() => setModal(null)} />}
            {modal === 'tutorial' && <TutorialSettingsModal onClose={() => setModal(null)} />}
            {isPremium && isCodexOpen && <CodexModal onClose={() => setCodexOpen(false)} />}
            {isPremium && isLinksOpen && <LinksModal onClose={() => setLinksOpen(false)} />}
            {isFeedbackOpen && <FeedbackBetaModal onClose={() => setFeedbackOpen(false)} />}
        </div>
    );
};

const ArsenalTab: React.FC<{onOpenSovereignEditor: () => void}> = ({ onOpenSovereignEditor }) => {
    const { userProfile, openChest } = useGame();
    const [openingChest, setOpeningChest] = useState<ChestType | null>(null);
    const [selectedItem, setSelectedItem] = useState<{ item: any; type: ItemType } | null>(null);
    
    const InventoryPlaceholder: React.FC = () => <div className="w-20 h-20 flex-shrink-0 bg-black/30 border-2 border-dashed border-white/10 rounded-lg" />;
    
    const InventoryItem: React.FC<{ item: any; onClick: () => void; count?: number; }> = ({ item, onClick, count }) => {
        const imageUrl = item.url || item.imageUrl;
        return (
            <button onClick={onClick} className="relative w-20 h-20 flex-shrink-0 bg-black/30 border-2 border-white/10 rounded-lg flex flex-col items-center justify-center p-1 text-center hover:border-[var(--gold)] transition-colors group">
                <div className="w-full h-full flex items-center justify-center">{imageUrl ? (<img src={imageUrl} alt={item.name} className="max-w-full max-h-full object-contain" />) : item.color ? (<div className="w-10 h-10 rounded-full" style={{ backgroundColor: item.color }} />) : (<span className="text-2xl">?</span>)}</div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-bold p-0.5 truncate group-hover:bg-black/80">{item.name}</div>
                {count && count > 1 && <div className="absolute top-0 right-0 bg-black text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">x{count}</div>}
            </button>
        );
    };

    const InventoryRow: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
        <div><h4 className="text-xs font-semibold text-gray-400 mb-1 px-1">{title}</h4><div className="flex space-x-2 overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar">{children}</div></div>
    );
    
    const chestColors: Record<ChestType, string> = { 'Comum': 'gray', 'Raro': '#3b82f6', 'Épico': '#a855f7', 'Lendário': '#f59e0b' };

    return (
        <div className="space-y-6">
            <button onClick={onOpenSovereignEditor} className="w-full py-3 rounded-xl luxe-gold-button transition-transform hover:scale-105">EDITAR SOBERANO</button>
            <div>
                <h3 className="text-lg font-bold tracking-wider mb-2">Inventário</h3>
                <div className="space-y-3">
                    <InventoryRow title="BAÚS">
                        {userProfile.chests && userProfile.chests.length > 0 ? (
                            userProfile.chests.map(({ type, count }) => (
                                <InventoryItem
                                    key={type}
                                    item={{ name: `Baú ${type}`, color: chestColors[type] }}
                                    count={count}
                                    onClick={() => {
                                        if (openChest(type)) {
                                            setOpeningChest(type);
                                        }
                                    }}
                                />
                            ))
                        ) : <InventoryPlaceholder />}
                    </InventoryRow>
                    <InventoryRow title="ARTEFATOS">{SOVEREIGN_ASSETS.artifacts.filter(a => a.id !== 'none').map(item => <InventoryItem key={item.id} item={item} onClick={() => setSelectedItem({item, type: 'Artefato'})} />)}</InventoryRow>
                    <InventoryRow title="CONSUMÍVEIS"><InventoryPlaceholder /><InventoryPlaceholder /><InventoryPlaceholder /></InventoryRow>
                    <InventoryRow title="SKINS">{SKINS_DATA.map(item => <InventoryItem key={item.id} item={item} onClick={() => setSelectedItem({item, type: 'Skin'})} />)}</InventoryRow>
                    <InventoryRow title="BORDAS">{BORDERS_DATA.map(item => <InventoryItem key={item.id} item={item} onClick={() => setSelectedItem({item, type: 'Borda'})} />)}</InventoryRow>
                    <InventoryRow title="BANNERS">{BANNERS_DATA.map(item => <InventoryItem key={item.id} item={item} onClick={() => setSelectedItem({item, type: 'Banner'})} />)}</InventoryRow>
                </div>
            </div>
            {openingChest && <ChestOpeningModal chestType={openingChest} onClose={() => setOpeningChest(null)} />}
            {selectedItem && <ItemDetailModal item={selectedItem.item} type={selectedItem.type} onClose={() => setSelectedItem(null)} />}
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
            <GlassCard variant="gold" className="text-center">
                <p className="text-sm uppercase tracking-wider">NOBREZA</p>
                <h2 className="text-3xl font-black" style={{ color: 'var(--gold)' }}>{currentRank?.name || 'N/A'}</h2>
                <div className="mt-4">
                    <div className="flex justify-between text-xs font-bold">
                        <span>XP ATUAL: {userProfile.nobility.exp.toLocaleString('pt-BR')}</span>
                        <span>{nextRank ? `PRÓXIMO: ${nextRank.expTotalRequired.toLocaleString('pt-BR')} XP` : 'Topo'}</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2.5 mt-1">
                        <div className="bg-[var(--gold)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%`}}></div>
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
                        <GlassCard key={rank.id} variant="neutral" className={`p-3 ${rank.id === currentRank?.id ? 'ring-2 ring-[var(--gold)]' : 'opacity-70'}`}>
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

const MissionCard: React.FC<{ title: string; progress: number; onClick?: () => void }> = ({ title, progress, onClick }) => (
    <GlassCard variant="neutral" className={`p-3 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}><div className="flex items-center justify-between"><span className="font-semibold text-sm">{title}</span><div className="flex items-center space-x-2"><span className="text-xs font-mono">{progress}%</span><div className="w-5 h-5 rounded-full border-2 border-gray-500 flex items-center justify-center">{progress === 100 && <CheckIcon className="w-3 h-3 text-green-400" />}</div></div></div></GlassCard>
);

const MissionDetailModal: React.FC<{ mission: { title: string; progress: number }, onClose: () => void }> = ({ mission, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}><GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-6 rounded-3xl" onClick={e => e.stopPropagation()}><h2 className="text-lg font-bold uppercase tracking-wider text-center">{mission.title}</h2><div className="space-y-2"><div className="w-full bg-black/30 rounded-full h-2.5"><div className="bg-[var(--gold)] h-2.5 rounded-full" style={{ width: `${mission.progress}%` }}></div></div><p className="text-center text-sm font-bold">{mission.progress}%</p></div><div className="flex space-x-2"><button onClick={() => alert('Arquivado!')} className="w-full py-2 rounded-xl luxe-button-secondary">Arquivar Missão</button><button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-primary">OK</button></div></GlassCard></div>
    );
};

const MissionsTab: React.FC = () => {
    const { userProfile, tasks, nobilityRanks, seasons } = useGame();
    const [isHierarchyVisible, setIsHierarchyVisible] = useState(false);
    const [selectedMission, setSelectedMission] = useState<{ id: number; title: string; progress: number } | null>(null);
    const [isSeasonDetailOpen, setIsSeasonDetailOpen] = useState(false);
    const [openingChest, setOpeningChest] = useState<ChestType | null>(null);

    const activeSeason = seasons.find(s => s.is_active);
    
    const tutorialActionId = 'action_tutorial_01';
    const completedTutorialTask = tasks.find(t => t.actionId === tutorialActionId && t.completed);

    const currentRank = nobilityRanks.find(r => r.id === userProfile.nobility.rankId);
    const nextRankIndex = nobilityRanks.findIndex(r => r.id === userProfile.nobility.rankId) + 1;
    const nextRank = nobilityRanks[nextRankIndex];
    const expForCurrentRank = currentRank?.expTotalRequired || 0;
    const expForNextRank = nextRank?.expTotalRequired || expForCurrentRank;
    const progressInRank = userProfile.nobility.exp - expForCurrentRank;
    const expToNextRank = expForNextRank - expForCurrentRank;
    const progressPercentage = expToNextRank > 0 ? (progressInRank / expToNextRank) * 100 : 100;

    if (isHierarchyVisible) return (<div><button onClick={() => setIsHierarchyVisible(false)} className="mb-4 text-sm font-bold text-gray-400 hover:text-white">&larr; Voltar</button><NobrezaHierarchyView /></div>);
    
    const missions = [ { id: 1, title: 'Criar seu primeiro Ciclo', progress: userProfile.level > 0 ? 100 : 0 }, { id: 2, title: 'Preencher Perfil de Ativos', progress: 80 }, { id: 3, title: 'Preencher Níveis de Soberano', progress: 50 }, { id: 4, title: 'Criar suas primeiras Arenas', progress: 20 }, { id: 5, title: 'Criar suas primeiras Ações', progress: 10 }, { id: 6, title: 'Completar uma Ação', progress: 0 }, { id: 10, title: 'Compartilhe seu Score', progress: 0 }, ];

    return (
        <>
            <div className="space-y-6">
                <GlassCard variant="gold" className="text-center cursor-pointer" onClick={() => setIsHierarchyVisible(true)}>
                    <p className="text-sm uppercase tracking-wider">NOBREZA</p>
                    <h2 className="text-3xl font-black" style={{ color: 'var(--gold)' }}>{currentRank?.name || 'N/A'}</h2>
                    <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold">
                            <span>XP ATUAL: {userProfile.nobility.exp.toLocaleString('pt-BR')}</span>
                            <span>{nextRank ? `PRÓXIMO: ${nextRank.expTotalRequired.toLocaleString('pt-BR')} XP` : 'Topo'}</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-2.5 mt-1">
                            <div className="bg-[var(--gold)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%`}}></div>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-white/70 mt-2">
                            <span>{currentRank ? `${currentRank.expTotalRequired.toLocaleString('pt-BR')} XP (patente)` : ''}</span>
                            <span>{nextRank ? `${nextRank.expTotalRequired.toLocaleString('pt-BR')} XP (próxima)` : 'Topo'}</span>
                        </div>
                    </div>
                </GlassCard>

                {activeSeason ? (
                     <GlassCard variant="neutral" className="text-center cursor-pointer" onClick={() => setIsSeasonDetailOpen(true)}>
                        <h3 className="font-bold">{activeSeason.name}</h3>
                        <p className="text-xs text-gray-400">(Clique para ver as missões)</p>
                    </GlassCard>
                ) : (
                     <GlassCard variant="neutral" className="text-center"><p className="text-sm text-gray-500">Nenhuma Season ativa no momento.</p></GlassCard>
                )}
               
                <div>
                    <h3 className="font-bold text-center tracking-wider mb-2">Missões</h3>
                    <div className="space-y-2 mt-4"><h4 className="text-xs font-semibold text-gray-400 px-1">Missões Introdutórias</h4>{missions.map(mission => (<MissionCard key={mission.id} title={mission.title} progress={mission.progress} onClick={() => setSelectedMission(mission)} />))}</div>
                    
                    <div className="space-y-2 mt-4">
                      <h4 className="text-xs font-semibold text-gray-400 px-1">Missões Concluídas</h4>
                      {completedTutorialTask && (
                        <MissionCard
                          key={completedTutorialTask.id}
                          title="Concluir Tutorial de Iniciação"
                          progress={100}
                          onClick={() => setOpeningChest('Comum')}
                        />
                      )}
                    </div>
                </div>
            </div>
        
            {selectedMission && <MissionDetailModal mission={selectedMission} onClose={() => setSelectedMission(null)} />}
            {isSeasonDetailOpen && activeSeason && <SeasonDetailModal season={activeSeason} onClose={() => setIsSeasonDetailOpen(false)} />}
            {openingChest && <ChestOpeningModal chestType={openingChest} onClose={() => setOpeningChest(null)} />}
        </>
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
            case 'Arsenal': return <ArsenalTab onOpenSovereignEditor={() => setSovereignEditorOpen(true)} />;
            case 'Maestria': return <MasteryView />;
            case 'Missões': return <MissionsTab />;
            case 'Hall da Fama': return <HallOfFameView />;
            default: return null;
        }
    }
    
    let tabs: SettingsTab[] = ['Geral', 'Arsenal', 'Maestria', 'Missões', 'Hall da Fama'];

    return (
        <>
            <div className="p-4 space-y-6 h-full flex flex-col">
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
            {isSovereignEditorOpen && <SovereignEditorModal onClose={() => setSovereignEditorOpen(false)} onSave={handleSovereignSave} />}
        </>
    );
};
