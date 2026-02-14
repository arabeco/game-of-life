
import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useTutorial } from '../contexts/TutorialContext';
import { SKINS_DATA, BORDERS_DATA, BANNERS_DATA } from '../constants';
import { SOVEREIGN_ASSETS } from '../constants/avatar';
import { MasteryView } from './MasteryView';
import { SovereignEditorModal } from '../components/AvatarCustomizerModal';
import { SovereignConfig, ChestType, Season, SeasonMission } from '../types';
import { ChevronRightIcon, CheckIcon, XIcon, LightbulbIcon, ClockIcon } from '../components/Icons';
import { GlassCard } from '../components/GlassCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ChestOpeningModal } from '../components/ChestOpeningModal';
import { ItemDetailModal } from '../components/ItemDetailModal';
import { SovereignPanelView } from './SovereignPanelView';
import { HallOfFameView } from './HallOfFameView';
import { supabase } from '../supabaseClient';
import { SeasonDetailModal } from '../components/SeasonDetailModal';

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

const NotificationCard: React.FC<{ icon: React.ReactNode, title: string, time?: string, message: string }> = ({ icon, title, time, message }) => (
    <GlassCard variant="neutral" className="p-3 animate-fade-in">
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

const NotificationSettingsModal: React.FC<{ currentMode: NotificationMode, onSave: (mode: NotificationMode) => void, onClose: () => void }> = ({ currentMode, onSave, onClose }) => {
    const [selectedMode, setSelectedMode] = useState<NotificationMode>(currentMode);
    
    const handleSave = () => { onSave(selectedMode); onClose(); };

    const renderPreview = () => {
        switch(selectedMode) {
            case 'Silencioso': return (<div className="text-center text-gray-400 space-y-2 p-4"><svg viewBox="0 0 100 20" className="w-24 mx-auto"><path d="M 0 10 Q 25 10, 50 10 T 100 10" stroke="currentColor" strokeWidth="2" fill="none"/></svg><p className="text-sm">{notificationModes.find(m => m.id === 'Silencioso')?.description}</p></div>);
            case 'Reflexivo': return (<NotificationCard icon={<ClockIcon className="w-5 h-5 text-yellow-400" />} title="O Boletim Diário" time="20:00" message="Score: 85 | Ações Restantes: 2. 'A felicidade da sua vida depende da qualidade dos seus pensamentos.'"/>);
            case 'Essencial': return (<NotificationCard icon={<ClockIcon className="w-5 h-5 text-blue-400" />} title="Alerta de Compromisso" time="12:00" message="Reunião de Alinhamento em 2h."/>);
            case 'Militar': return (<div className="space-y-2"><NotificationCard icon={<LightbulbIcon className="w-5 h-5 text-green-400" />} title="Alvorada (Planning)" time="08:00" message="Inicie o Planejamento Tático. Verifique o Grid ou o Sitrep."/><NotificationCard icon={<ClockIcon className="w-5 h-5 text-orange-400" />} title="Radar de Batalha" time="09:00" message="Próxima ação: Treino de Força (11:00). Prepare-se."/><NotificationCard icon={<ClockIcon className="w-5 h-5 text-yellow-400" />} title="O Boletim Diário" time="20:00" message="Score: 85 | Ações Restantes: 2."/></div>);
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

const GeralTab: React.FC = () => {
    const { userProfile, updateUserProfile } = useGame();
    const [nickname, setNickname] = useState(userProfile.nickname);
    const [notificationMode, setNotificationMode] = useState<NotificationMode>('Militar');
    const [privacyMode, setPrivacyMode] = useState<PrivacyMode>('Amigos');
    const [modal, setModal] = useState<'notification' | 'privacy' | 'delete' | 'tutorial' | null>(null);

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
                 <SettingSelector label="Notificações" value={currentNotificationName} onClick={() => setModal('notification')} />
                 <SettingSelector label="Privacidade" value={privacyMode} onClick={() => setModal('privacy')} />
                 <SettingSelector label="Tutoriais" value="Revisar" onClick={() => setModal('tutorial')} />
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
    const levelForCurrentRank = currentRank?.levelRequired || 0;
    const levelForNextRank = nextRank?.levelRequired || (currentRank?.levelRequired || 0) + 10;
    const progressInRank = userProfile.level - levelForCurrentRank;
    const levelsToNextRank = levelForNextRank - levelForCurrentRank;
    const progressPercentage = levelsToNextRank > 0 ? (progressInRank / levelsToNextRank) * 100 : 100;

    return (
        <div className="space-y-6">
            <GlassCard variant="gold" className="text-center">
                <p className="text-sm uppercase tracking-wider">NOBREZA</p>
                <h2 className="text-3xl font-black" style={{ color: 'var(--gold)' }}>{currentRank?.name || 'N/A'}</h2>
                <div className="mt-4">
                    <div className="flex justify-between text-xs font-bold">
                        <span>NÍVEL ATUAL: {userProfile.level}</span>
                        <span>{nextRank ? `PRÓXIMO: NÍVEL ${nextRank.levelRequired}`: 'Nível Máximo'}</span>
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
                                <span className="text-sm text-gray-400">Nível {rank.levelRequired}</span>
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
    const levelForCurrentRank = currentRank?.levelRequired || 0;
    const levelForNextRank = nextRank?.levelRequired || (currentRank?.levelRequired || 0) + 10;
    const progressInRank = userProfile.level - levelForCurrentRank;
    const levelsToNextRank = levelForNextRank - levelForCurrentRank;
    const progressPercentage = levelsToNextRank > 0 ? (progressInRank / levelsToNextRank) * 100 : 100;

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
                            <span>NÍVEL ATUAL: {userProfile.level}</span>
                            <span>{nextRank ? `PRÓXIMO: NÍVEL ${nextRank.levelRequired}`: 'Nível Máximo'}</span>
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
