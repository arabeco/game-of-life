
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { GoldenInvite, LevelUnlocks, Season, SeasonMission } from '../types';
import { useGame } from '../contexts/GameContext';
import { CheckIcon } from '../components/Icons';
import { buildDefaultLevelUnlocks, SOVEREIGN_ASSETS } from '../constants/avatar';
import { GM_CONFIG } from '../constants';
import { SupabaseService } from '../services/SupabaseService';

const InviteManager: React.FC = () => {
    const INVITE_STORAGE_KEY = 'goldenInvitesUsed';
    const isOnline = SupabaseService.isConnectionActive();
    const getUsedCodes = () => {
        try {
            const saved = localStorage.getItem(INVITE_STORAGE_KEY);
            if (saved) return new Set<string>(JSON.parse(saved));
        } catch {
            return new Set<string>();
        }
        return new Set<string>();
    };
    const getBaseCodes = () => GM_CONFIG.goldenInvites.seedCodes.length > 0
        ? GM_CONFIG.goldenInvites.seedCodes
        : Array.from({ length: GM_CONFIG.goldenInvites.seedCount }, (_, i) => `${GM_CONFIG.goldenInvites.codePrefix}${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`);
    const buildSeedInvites = () => {
        const usedCodes = getUsedCodes();
        const baseCodes = getBaseCodes();
        return baseCodes.map((code, index) => ({
            id: `seed_${index + 1}`,
            code,
            is_used: usedCodes.has(code),
            claimed_by_user_id: usedCodes.has(code) ? 'local' : null,
            claimed_at: usedCodes.has(code) ? new Date().toISOString() : null,
            created_at: new Date().toISOString(),
        } as GoldenInvite));
    };

    const [invites, setInvites] = useState<GoldenInvite[]>(() => (isOnline ? [] : buildSeedInvites()));

    useEffect(() => {
        if (!isOnline) return;
        SupabaseService.getGoldenInvites().then(setInvites);
    }, [isOnline]);

    const generateInvite = async () => {
        if (isOnline) {
            const invite = await SupabaseService.generateGoldenInvite();
            if (invite) setInvites(prev => [invite, ...prev]);
            return;
        }
        const newCode = `${GM_CONFIG.goldenInvites.codePrefix}${new Date().getFullYear()}${crypto.randomUUID().split('-')[0]}`;
        const newInvite: GoldenInvite = {
            id: crypto.randomUUID(),
            code: newCode,
            is_used: false,
            claimed_by_user_id: null,
            claimed_at: null,
            created_at: new Date().toISOString()
        };
        setInvites(prev => [newInvite, ...prev]);
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        alert(`Código "${code}" copiado!`);
    };

    const applySeedInvites = async () => {
        if (isOnline) {
            const updated = await SupabaseService.seedGoldenInvites(getBaseCodes());
            setInvites(updated);
            return;
        }
        const seeds = buildSeedInvites();
        setInvites(prev => {
            const existingCodes = new Set(prev.map(invite => invite.code));
            const nextSeeds = seeds.filter(invite => !existingCodes.has(invite.code));
            return [...nextSeeds, ...prev];
        });
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-wider">Gerenciar Convites Dourados</h2>
            <button onClick={applySeedInvites} className="w-full py-2 rounded-xl luxe-button-secondary">Aplicar 5 Iniciais</button>
            <button onClick={generateInvite} className="w-full py-2 rounded-xl luxe-button-primary">Gerar Novo Convite</button>
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
                <button onClick={handleSave} className="w-full py-2 rounded-xl luxe-button-primary">SALVAR</button>
            </GlassCard>
        </div>
    );
};

const MissionEditorModal: React.FC<{ season: Season; onClose: () => void; }> = ({ season, onClose }) => {
    const { seasonMissions, addSeasonMission } = useGame();
    const missionsForSeason = seasonMissions.filter(m => m.season_id === season.id);
    const [formData, setFormData] = useState<Omit<SeasonMission, 'id'>>({
        season_id: season.id, title: '', description: '', goal_type: 'actions_completed', goal_value: 10, reward_type: 'exp', reward_value: 100
    });

    const handleAddMission = async () => {
        await addSeasonMission(formData);
        setFormData({ season_id: season.id, title: '', description: '', goal_type: 'actions_completed', goal_value: 10, reward_type: 'exp', reward_value: 100 });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center" onClick={onClose}>
            <GlassCard variant='neutral' className='p-4 space-y-3 w-full max-w-sm max-h-[90vh] flex flex-col' onClick={e => e.stopPropagation()}>
                <h3 className='text-center font-bold uppercase'>Missões de "{season.name}"</h3>
                <div className='flex-grow space-y-2 overflow-y-auto pr-2'>
                    {missionsForSeason.map(m => (
                        <div key={m.id} className="p-2 bg-black/20 rounded-lg text-xs">
                            <p className="font-bold">{m.title}</p>
                            <p className="text-gray-400">{m.description} ({m.goal_value} {m.goal_type})</p>
                        </div>
                    ))}
                </div>
                <div className='flex-shrink-0 border-t border-white/10 pt-3 space-y-2'>
                    <h4 className="text-center font-bold text-sm">Nova Missão</h4>
                    <input type="text" placeholder="Título" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full p-2 bg-black/30 rounded-lg text-sm" />
                    <input type="text" placeholder="Descrição" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full p-2 bg-black/30 rounded-lg text-sm" />
                    <select value={formData.goal_type} onChange={e => setFormData(p => ({...p, goal_type: e.target.value as SeasonMission['goal_type']}))} className="w-full p-2 bg-black/30 rounded-lg text-sm"><option value="actions_completed">Ações Completas</option><option value="km_run">KM Corridos</option><option value="books_read">Livros Lidos</option><option value="meditation_days">Dias de Meditação</option></select>
                    <input type="number" placeholder="Valor da Meta" value={formData.goal_value} onChange={e => setFormData(p => ({ ...p, goal_value: Number(e.target.value) }))} className="w-full p-2 bg-black/30 rounded-lg text-sm" />
                    <select value={formData.reward_type} onChange={e => setFormData(p => ({...p, reward_type: e.target.value as SeasonMission['reward_type']}))} className="w-full p-2 bg-black/30 rounded-lg text-sm"><option value="exp">EXP</option><option value="item_id">Item ID</option></select>
                    <input type="text" placeholder="Valor da Recompensa" value={String(formData.reward_value)} onChange={e => setFormData(p => ({ ...p, reward_value: p.reward_type === 'exp' ? Number(e.target.value) : e.target.value }))} className="w-full p-2 bg-black/30 rounded-lg text-sm" />
                    <button onClick={handleAddMission} className="w-full py-2 rounded-xl luxe-button-primary">Adicionar Missão</button>
                </div>
            </GlassCard>
        </div>
    );
};


const SeasonCard: React.FC<{ season: Season; onEdit: () => void; onManageMissions: () => void }> = ({ season, onEdit, onManageMissions }) => {
    const getStatus = () => {
        if (season.is_active) return { text: 'ATIVA', color: 'text-green-400' };
        if (new Date(season.start_date) > new Date()) return { text: 'FUTURA', color: 'text-blue-400' };
        return { text: 'ENCERRADA', color: 'text-gray-500' };
    };
    const status = getStatus();

    return (
        <GlassCard variant="neutral" className="p-2">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-bold">{season.name}</p>
                    <p className={`text-xs font-bold ${status.color}`}>{status.text}</p>
                </div>
                <div className="flex space-x-1">
                    <button onClick={onEdit} className="text-xs font-bold p-2 bg-black/20 rounded-lg">Editar</button>
                    <button onClick={onManageMissions} className="text-xs font-bold p-2 bg-black/20 rounded-lg">Missões</button>
                </div>
            </div>
        </GlassCard>
    );
};

const SeasonManager: React.FC = () => {
    const { seasons } = useGame();
    const [editorModal, setEditorModal] = useState<{ open: boolean, season: Season | null }>({ open: false, season: null });
    const [missionModal, setMissionModal] = useState<{ open: boolean, season: Season | null }>({ open: false, season: null });

    const sortedSeasons = [...seasons].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    const activeSeason = sortedSeasons.find(s => s.is_active);
    const futureSeasons = sortedSeasons.filter(s => !s.is_active && new Date(s.start_date) > new Date());
    const pastSeasons = sortedSeasons.filter(s => !s.is_active && new Date(s.start_date) <= new Date() && s.id !== activeSeason?.id);
    
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-wider">Gerenciar Seasons</h2>
            <button onClick={() => setEditorModal({ open: true, season: null })} className="w-full py-2 rounded-xl luxe-button-primary">Criar Nova Era</button>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {activeSeason && <SeasonCard season={activeSeason} onEdit={() => setEditorModal({open: true, season: activeSeason})} onManageMissions={() => setMissionModal({open: true, season: activeSeason})} />}
                
                {futureSeasons.length > 0 && <h3 className="text-xs font-bold text-gray-400 pt-2">FUTURAS</h3>}
                {futureSeasons.map(s => <SeasonCard key={s.id} season={s} onEdit={() => setEditorModal({open: true, season: s})} onManageMissions={() => setMissionModal({open: true, season: s})} />)}
                
                {pastSeasons.length > 0 && <h3 className="text-xs font-bold text-gray-400 pt-2">ENCERRADAS</h3>}
                {pastSeasons.map(s => <SeasonCard key={s.id} season={s} onEdit={() => setEditorModal({open: true, season: s})} onManageMissions={() => setMissionModal({open: true, season: s})} />)}
            </div>
            
            {editorModal.open && <SeasonEditorModal season={editorModal.season} onClose={() => setEditorModal({open: false, season: null})} />}
            {missionModal.open && missionModal.season && <MissionEditorModal season={missionModal.season} onClose={() => setMissionModal({open: false, season: null})} />}
        </div>
    );
}

const UnlocksManager: React.FC = () => {
    const { levelUnlocks, updateLevelUnlocks } = useGame();
    const [draftUnlocks, setDraftUnlocks] = useState<LevelUnlocks>(levelUnlocks);

    useEffect(() => {
        setDraftUnlocks(levelUnlocks);
    }, [levelUnlocks]);

    const handleLevelChange = (category: keyof LevelUnlocks, itemId: string, value: number) => {
        setDraftUnlocks(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [itemId]: value,
            },
        }));
    };

    const categories: { id: keyof LevelUnlocks; label: string; items: { id: string; name: string }[] }[] = [
        { id: 'bodyStyles', label: 'Corpo', items: SOVEREIGN_ASSETS.bodyStyles },
        { id: 'hairStyles', label: 'Cabelo', items: SOVEREIGN_ASSETS.hairStyles },
        { id: 'outfits', label: 'Roupa', items: SOVEREIGN_ASSETS.outfits },
        { id: 'head_under_items', label: 'Rosto', items: SOVEREIGN_ASSETS.head_under_items },
        { id: 'helmets', label: 'Elmo', items: SOVEREIGN_ASSETS.helmets },
        { id: 'head_over_items', label: 'Topo', items: SOVEREIGN_ASSETS.head_over_items },
        { id: 'artifacts', label: 'Artefato', items: SOVEREIGN_ASSETS.artifacts },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-wider">Desbloqueios por Nível</h2>
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
                {categories.map(category => (
                    <GlassCard key={category.id} variant="neutral" className="p-3 space-y-2">
                        <div className="text-xs font-bold tracking-widest text-gray-300">{category.label}</div>
                        <div className="space-y-2">
                            {category.items.map(item => (
                                <div key={item.id} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-200 truncate max-w-[180px]">{item.name}</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={draftUnlocks[category.id]?.[item.id] ?? 1}
                                        onChange={e => handleLevelChange(category.id, item.id, Math.max(1, Number(e.target.value) || 1))}
                                        className="w-20 p-1 bg-black/30 rounded-lg border border-white/20 text-center"
                                    />
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setDraftUnlocks(buildDefaultLevelUnlocks())} className="py-2 rounded-xl luxe-button-secondary">Padrão</button>
                <button onClick={() => updateLevelUnlocks(draftUnlocks)} className="py-2 rounded-xl luxe-button-primary">Salvar</button>
            </div>
        </div>
    );
};

export const SovereignPanelView: React.FC = () => {
    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-xl font-black text-center uppercase tracking-widest text-white luxe-title-shadow">Painel do Soberano</h1>
            
            <InviteManager />
            
            <SeasonManager />

            <UnlocksManager />
        </div>
    );
};
