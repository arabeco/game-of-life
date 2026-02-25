
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { GoldenInvite, LevelUnlocks, Season, SeasonMission } from '../types';
import { useGame } from '../contexts/GameContext';
import { CheckIcon } from '../components/Icons';
import { SeasonDetailModal } from '../components/SeasonDetailModal';
import { Portal } from '../components/Portal';
import { buildDefaultLevelUnlocks, SOVEREIGN_ASSETS } from '../constants/avatar';
import { GM_CONFIG } from '../constants';
import { SupabaseService } from '../services/SupabaseService';

const InviteManager: React.FC = () => {
    const [invites, setInvites] = useState<GoldenInvite[]>([]);

    useEffect(() => {
        SupabaseService.getGoldenInvites().then(setInvites);
    }, []);

    const generateInvite = async () => {
        const invite = await SupabaseService.generateGoldenInvite();
        if (invite) setInvites(prev => [invite, ...prev]);
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        alert(`Código "${code}" copiado!`);
    };

    const applySeedInvites = async () => {
        const baseCodes = GM_CONFIG.goldenInvites.seedCodes.length > 0
            ? GM_CONFIG.goldenInvites.seedCodes
            : Array.from({ length: GM_CONFIG.goldenInvites.seedCount }, (_, i) => `${GM_CONFIG.goldenInvites.codePrefix}${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`);
            
        const updated = await SupabaseService.seedGoldenInvites(baseCodes);
        setInvites(updated);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-wider">Gerenciar Convites Dourados</h2>
            <button onClick={applySeedInvites} className="w-full py-2 rounded-xl luxe-button-secondary">Aplicar 5 Iniciais</button>
            <button onClick={generateInvite} className="w-full py-2 rounded-xl luxe-skin-button">Gerar Novo Convite</button>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {invites.map(invite => (
                    <GlassCard key={invite.id} variant={invite.is_used ? 'neutral' : 'gold'} className="p-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className={`font-mono ${invite.is_used ? 'text-gray-500 line-through' : ''}`}>{invite.code}</span>
                            {invite.is_used ? (
                                <span className="text-xs font-bold text-gray-400">USADO</span>
                            ) : (
                                <button onClick={() => copyToClipboard(invite.code)} className="text-xs font-bold">COPIAR</button>
                            )}
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};

// --- Season Manager Components ---

const SeasonEditorModal: React.FC<{ season: Season | null; onClose: () => void; }> = ({ season, onClose }) => {
    const { addSeason, updateSeason } = useGame();
    const [formData, setFormData] = useState({
        name: season?.name || '',
        start_date: season?.start_date || '',
        end_date: season?.end_date || '',
        background_png_url: season?.background_png_url || '',
        lore_text: season?.lore_text || '',
        is_active: season?.is_active || false,
    });

    const handleSave = async () => {
        if (season) {
            await updateSeason(season.id, formData);
        } else {
            await addSeason(formData);
        }
        onClose();
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center" onClick={onClose}>
                <GlassCard variant='neutral' className='p-4 space-y-3 w-full max-w-sm' onClick={e => e.stopPropagation()}>
                    <h3 className='text-center font-bold uppercase'>{season ? 'Editar Era' : 'Criar Nova Era'}</h3>
                    <input type="text" placeholder="Nome da Season" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full p-2 bg-black/30 rounded-lg border border-white/20" />
                    <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} className="w-full p-2 bg-black/30 rounded-lg border border-white/20" />
                        <input type="date" value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} className="w-full p-2 bg-black/30 rounded-lg border border-white/20" />
                    </div>
                    <input type="text" placeholder="URL da Imagem de Fundo" value={formData.background_png_url} onChange={e => setFormData(p => ({ ...p, background_png_url: e.target.value }))} className="w-full p-2 bg-black/30 rounded-lg border border-white/20" />
                    <textarea placeholder="Lore / Descrição" value={formData.lore_text} onChange={e => setFormData(p => ({ ...p, lore_text: e.target.value }))} rows={3} className="w-full p-2 bg-black/30 rounded-lg border border-white/20" />
                    <label className="flex items-center space-x-2"><input type="checkbox" checked={formData.is_active} onChange={e => setFormData(p => ({...p, is_active: e.target.checked}))} /> <span>Ativar esta Season?</span></label>
                    <button onClick={handleSave} className="w-full py-2 rounded-xl luxe-skin-button">SALVAR</button>
                </GlassCard>
            </div>
        </Portal>
    );
};

const MissionEditorModal: React.FC<{ season: Season; onClose: () => void; }> = ({ season, onClose }) => {
    const { seasonMissions, addSeasonMission } = useGame();
    const missionsForSeason = seasonMissions.filter(m => m.season_id === season.id);
    const [formData, setFormData] = useState<Omit<SeasonMission, 'id'>>({
        season_id: season.id, title: '', description: '', goal_type: 'actions_completed', goal_value: 10, reward_type: 'exp', reward_value: 100,
        action_name: '', icon: '🛡️', type: 'individual'
    });

    const handleAddMission = async () => {
        await addSeasonMission(formData);
        setFormData({ 
            season_id: season.id, title: '', description: '', goal_type: 'actions_completed', goal_value: 10, reward_type: 'exp', reward_value: 100,
            action_name: '', icon: '🛡️', type: 'individual'
        });
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center" onClick={onClose}>
                <GlassCard variant='neutral' className='p-4 space-y-3 w-full max-w-sm max-h-[90vh] flex flex-col' onClick={e => e.stopPropagation()}>
                    <h3 className='text-center font-bold uppercase'>Missões de "{season.name}"</h3>
                    <div className='flex-grow space-y-2 overflow-y-auto pr-2'>
                        {missionsForSeason.map(m => (
                            <div key={m.id} className="p-2 bg-black/20 rounded-lg text-xs">
                                <div className="flex justify-between">
                                    <p className="font-bold">{m.title}</p>
                                    <span className="text-[10px] bg-white/10 px-1 rounded">{m.type}</span>
                                </div>
                                <p className="text-gray-400">{m.description} ({m.goal_value} {m.goal_type})</p>
                                {m.action_name && <p className="text-[10px] text-gray-500">Action: {m.action_name}</p>}
                            </div>
                        ))}
                    </div>
                    <div className='flex-shrink-0 border-t border-white/10 pt-3 space-y-2'>
                        <h4 className="text-center font-bold text-sm">Nova Missão</h4>
                        <div className="grid grid-cols-2 gap-2">
                             <select value={formData.type} onChange={e => setFormData(p => ({...p, type: e.target.value as any}))} className="w-full p-2 bg-black/30 rounded-lg text-sm"><option value="individual">Individual</option><option value="clan">Clã</option></select>
                             <input type="text" placeholder="Ícone (ex: 🛡️)" value={formData.icon} onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))} className="w-full p-2 bg-black/30 rounded-lg text-sm" />
                        </div>
                        <input type="text" placeholder="Título" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full p-2 bg-black/30 rounded-lg text-sm" />
                        <input type="text" placeholder="Descrição" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full p-2 bg-black/30 rounded-lg text-sm" />
                        
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 ml-1">Vincular a Ação (Nome exato)</label>
                            <input type="text" placeholder="Nome da Ação (opcional)" value={formData.action_name} onChange={e => setFormData(p => ({ ...p, action_name: e.target.value }))} className="w-full p-2 bg-black/30 rounded-lg text-sm" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <select value={formData.goal_type} onChange={e => setFormData(p => ({...p, goal_type: e.target.value as SeasonMission['goal_type']}))} className="w-full p-2 bg-black/30 rounded-lg text-sm"><option value="actions_completed">Ações Completas</option><option value="km_run">KM Corridos</option><option value="books_read">Livros Lidos</option><option value="meditation_days">Dias de Meditação</option></select>
                            <input type="number" placeholder="Meta" value={formData.goal_value} onChange={e => setFormData(p => ({ ...p, goal_value: Number(e.target.value) }))} className="w-full p-2 bg-black/30 rounded-lg text-sm" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <select value={formData.reward_type} onChange={e => setFormData(p => ({...p, reward_type: e.target.value as SeasonMission['reward_type']}))} className="w-full p-2 bg-black/30 rounded-lg text-sm"><option value="exp">EXP</option><option value="item_id">Item ID</option></select>
                            <input type="text" placeholder="Recompensa" value={String(formData.reward_value)} onChange={e => setFormData(p => ({ ...p, reward_value: p.reward_type === 'exp' ? Number(e.target.value) : e.target.value }))} className="w-full p-2 bg-black/30 rounded-lg text-sm" />
                        </div>
                        
                        <button onClick={handleAddMission} className="w-full py-2 rounded-xl luxe-skin-button">Adicionar Missão</button>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};


const SeasonCard: React.FC<{ season: Season; onEdit: () => void; onMissions: () => void; onOpen: () => void; }> = ({ season, onEdit, onMissions, onOpen }) => {
    const getStatus = () => {
        if (season.is_active) return { text: 'ATIVA', color: 'text-green-400' };
        if (new Date(season.start_date) > new Date()) return { text: 'FUTURA', color: 'text-blue-400' };
        return { text: 'ENCERRADA', color: 'text-gray-500' };
    };
    const status = getStatus();

    return (
        <GlassCard variant="neutral" className="p-2 cursor-pointer" onClick={onOpen}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-bold">{season.name}</p>
                    <p className={`text-xs font-bold ${status.color}`}>{status.text}</p>
                </div>
                <div className="flex space-x-1">
                    <button onClick={(event) => { event.stopPropagation(); onMissions(); }} className="text-xs font-bold p-2 bg-black/20 rounded-lg hover:bg-white/10">Missões</button>
                    <button onClick={(event) => { event.stopPropagation(); onEdit(); }} className="text-xs font-bold p-2 bg-black/20 rounded-lg hover:bg-white/10">Editar</button>
                </div>
            </div>
        </GlassCard>
    );
};

const SeasonManager: React.FC = () => {
    const { seasons } = useGame();
    const [editorModal, setEditorModal] = useState<{ open: boolean, season: Season | null }>({ open: false, season: null });
    const [missionsModal, setMissionsModal] = useState<{ open: boolean, season: Season | null }>({ open: false, season: null });
    const [detailSeason, setDetailSeason] = useState<Season | null>(null);

    const sortedSeasons = [...seasons].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    const activeSeason = sortedSeasons.find(s => s.is_active);
    const futureSeasons = sortedSeasons.filter(s => !s.is_active && new Date(s.start_date) > new Date());
    const pastSeasons = sortedSeasons.filter(s => !s.is_active && new Date(s.start_date) <= new Date() && s.id !== activeSeason?.id);
    
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-wider">Gerenciar Seasons</h2>
            <button onClick={() => setEditorModal({ open: true, season: null })} className="w-full py-2 rounded-xl luxe-skin-button">Criar Nova Era</button>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {activeSeason && <SeasonCard season={activeSeason} onEdit={() => setEditorModal({open: true, season: activeSeason})} onMissions={() => setMissionsModal({open: true, season: activeSeason})} onOpen={() => setDetailSeason(activeSeason)} />}
                
                {futureSeasons.length > 0 && <h3 className="text-xs font-bold text-gray-400 pt-2">FUTURAS</h3>}
                {futureSeasons.map(s => <SeasonCard key={s.id} season={s} onEdit={() => setEditorModal({open: true, season: s})} onMissions={() => setMissionsModal({open: true, season: s})} onOpen={() => setDetailSeason(s)} />)}
                
                {pastSeasons.length > 0 && <h3 className="text-xs font-bold text-gray-400 pt-2">ENCERRADAS</h3>}
                {pastSeasons.map(s => <SeasonCard key={s.id} season={s} onEdit={() => setEditorModal({open: true, season: s})} onMissions={() => setMissionsModal({open: true, season: s})} onOpen={() => setDetailSeason(s)} />)}
            </div>
            
            {editorModal.open && <SeasonEditorModal season={editorModal.season} onClose={() => setEditorModal({open: false, season: null})} />}
            {missionsModal.open && missionsModal.season && <MissionEditorModal season={missionsModal.season} onClose={() => setMissionsModal({open: false, season: null})} />}
            {detailSeason && <SeasonDetailModal season={detailSeason} onClose={() => setDetailSeason(null)} />}
        </div>
    );
}

export const SovereignPanelView: React.FC = () => {
    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-xl font-black text-center uppercase tracking-widest text-white luxe-title-shadow">Painel do Soberano</h1>
            
            <InviteManager />
            
            <SeasonManager />
        </div>
    );
};
