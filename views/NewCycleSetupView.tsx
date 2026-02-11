import React, { useState } from 'react';
import { useGame, ArenaSetupChange } from '../contexts/GameContext';
import { Arena } from '../types';
import { GlassCard } from '../components/GlassCard';
import { EditIcon, RefreshCwIcon, ArchiveBoxIcon, Trash2Icon, XIcon, ChevronLeftIcon } from '../components/Icons';
import { ArenaDetailModal } from '../components/ArenaDetailModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

type ArenaStatus = 'renew' | 'archive' | 'delete';

interface ArenaSetupCardProps {
    arena: Arena;
    status: ArenaStatus;
    onStatusChange: (status: ArenaStatus) => void;
    onEdit: () => void;
}

const ArenaSetupCard: React.FC<ArenaSetupCardProps> = ({ arena, status, onStatusChange, onEdit }) => {
    const isArchived = status === 'archive';
    const isDeleted = status === 'delete';

    if (isDeleted) {
        return (
            <GlassCard variant="neutral" className="p-3 flex items-center justify-between bg-red-900/50 animate-fade-in">
                <span className="text-red-300 line-through">{arena.name}</span>
                <button onClick={() => onStatusChange('renew')} className="text-sm font-bold text-gray-300">DESFAZER</button>
            </GlassCard>
        );
    }
    
    return (
        <GlassCard variant="neutral" className={`p-3 transition-all ${isArchived ? 'bg-gray-800/50 opacity-60' : ''}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold">{arena.icon} {arena.name}</h3>
                    <p className="text-xs text-gray-400">{isArchived ? 'ARQUIVADA' : 'ATIVA NO PRÓXIMO CICLO'}</p>
                </div>
                <div className="flex items-center space-x-1">
                    <button onClick={() => onStatusChange(isArchived ? 'renew' : 'archive')} className={`p-2 rounded-full ${!isArchived ? 'bg-white/10' : ''}`} title={isArchived ? 'Renovar' : 'Arquivar'}>
                        {isArchived ? <RefreshCwIcon className="w-4 h-4 text-green-400"/> : <ArchiveBoxIcon className="w-4 h-4"/>}
                    </button>
                     <button onClick={onEdit} className="p-2 rounded-full" title="Editar"><EditIcon className="w-4 h-4" /></button>
                     <button onClick={() => onStatusChange('delete')} className="p-2 rounded-full" title="Remover"><Trash2Icon className="w-4 h-4 text-red-500" /></button>
                </div>
            </div>
        </GlassCard>
    );
};


interface NewCycleSetupViewProps {
    onCancel: () => void;
    onComplete: () => void;
}

export const NewCycleSetupView: React.FC<NewCycleSetupViewProps> = ({ onCancel, onComplete }) => {
    const { getArenas, startNewCycle } = useGame();
    const [arenas] = useState<Arena[]>(() => getArenas());
    const [arenaChanges, setArenaChanges] = useState<Map<string, ArenaStatus>>(new Map());
    const [editingArena, setEditingArena] = useState<Arena | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [cycleName, setCycleName] = useState(`Ciclo de ${new Date().toLocaleString('default', { month: 'long' })}`);
    const [cycleEndDate, setCycleEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const today = new Date().toISOString().split('T')[0];

    const handleStatusChange = (arenaId: string, status: ArenaStatus) => {
        setArenaChanges(prev => new Map(prev).set(arenaId, status));
    };

    const handleStartCycle = () => {
        const changes: ArenaSetupChange[] = Array.from(arenaChanges.entries()).map(([id, status]) => ({ id, status }));
        const cycleDetails = { name: cycleName, endDate: cycleEndDate };
        startNewCycle(changes, cycleDetails);
        onComplete();
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 animate-fade-in" onClick={onCancel}>
                <div className="w-full max-w-[420px] mx-auto h-full p-4 flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex-shrink-0 flex justify-between items-center text-white pb-4">
                        <div className="flex items-center space-x-2">
                           <button onClick={onCancel} className="p-2 -ml-2"><ChevronLeftIcon /></button>
                           <h1 className="text-xl font-black uppercase tracking-widest">Setup de Ciclo</h1>
                        </div>
                    </div>
                    
                    <div className="flex-shrink-0 space-y-3 mb-4">
                        <GlassCard variant="gold" className="p-3">
                             <h3 className='text-center text-xs font-bold uppercase tracking-wider text-gray-800 mb-2'>Detalhes da Campanha</h3>
                             <div className="space-y-2">
                                 <input 
                                    type='text'
                                    placeholder='Nome do Novo Ciclo'
                                    value={cycleName}
                                    onChange={e => setCycleName(e.target.value)}
                                    className='w-full p-2 bg-black/20 text-white rounded-lg border border-yellow-800/50' 
                                />
                                <input 
                                    type='date' 
                                    value={cycleEndDate} 
                                    min={today}
                                    onChange={e => setCycleEndDate(e.target.value)} 
                                    className='w-full p-2 bg-black/20 text-white rounded-lg border border-yellow-800/50' 
                                />
                            </div>
                        </GlassCard>
                    </div>

                    <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                        <p className="text-sm text-gray-400 pb-2">Revise suas arenas. Arenas arquivadas não aparecerão no seu Planner até serem renovadas.</p>
                        {arenas.map(arena => (
                            <ArenaSetupCard 
                                key={arena.id}
                                arena={arena}
                                status={arenaChanges.get(arena.id) || 'renew'}
                                onStatusChange={(status) => handleStatusChange(arena.id, status)}
                                onEdit={() => setEditingArena(arena)}
                            />
                        ))}
                    </div>
                    <div className="flex-shrink-0 pt-4">
                        <button onClick={() => setShowConfirm(true)} disabled={!cycleName || !cycleEndDate} className="w-full py-3 rounded-xl luxe-gold-button disabled:opacity-50">INICIAR NOVO CICLO</button>
                    </div>
                </div>
            </div>
            {editingArena && <ArenaDetailModal arena={editingArena} onClose={() => setEditingArena(null)} />}
            {showConfirm && <ConfirmationModal title="Iniciar Novo Ciclo?" message="Suas arenas serão atualizadas e o Planner será reiniciado. Esta ação não pode ser desfeita." onConfirm={() => { setShowConfirm(false); handleStartCycle(); }} onCancel={() => setShowConfirm(false)} />}
        </>
    );
};
