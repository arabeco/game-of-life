import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { BIOLOGICAL_MACHINE_CODEX } from '../../data/initialCodex';
import { CheckIcon, PlusIcon, CloseIcon } from '../Icons';
import { ArenaCard } from '../ArenaCard';
import { Arena, Action } from '../../types';
import { ArenaDetailModal } from '../ArenaDetailModal';
import { ActionModal } from '../ActionModal';
import { Portal } from '../Portal';

const CODEX_SKIN_COLOR = '#F0F8FF'; // Branco Gelo

const hexToRgb = (hex: string) => {
    const trimmed = hex.trim();
    if (trimmed.startsWith('rgb')) {
        const values = trimmed.replace(/rgba?\(|\)/g, '').split(',').map(val => Number.parseFloat(val.trim()));
        return { r: values[0] || 0, g: values[1] || 0, b: values[2] || 0 };
    }
    const normalized = trimmed.replace('#', '');
    const value = normalized.length === 3
        ? normalized.split('').map(ch => ch + ch).join('')
        : normalized;
    const intValue = Number.parseInt(value, 16);
    return {
        r: (intValue >> 16) & 255,
        g: (intValue >> 8) & 255,
        b: intValue & 255,
    };
};

const PlasmaCanvas: React.FC<{ color: string; opacity: number; className?: string; }> = ({ color, opacity, className }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sizeRef = useRef({ width: 0, height: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
            const nextHeight = Math.max(1, Math.floor(rect.height * dpr));
            if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
                canvas.width = nextWidth;
                canvas.height = nextHeight;
                sizeRef.current = { width: nextWidth, height: nextHeight };
            }
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        window.addEventListener('resize', resize);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', resize);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { r, g, b } = hexToRgb(color);
        let frame = 0;
        const draw = () => {
            const { width, height } = sizeRef.current;
            if (!width || !height) {
                requestAnimationFrame(draw);
                return;
            }
            frame += 0.006;
            ctx.clearRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'lighter';
            const pulse = (Math.sin(frame * 0.7) + 1) * 0.5;
            const blobs = [
                { x: width * (0.3 + Math.sin(frame * 1.2) * 0.18), y: height * (0.4 + Math.cos(frame * 0.9) * 0.2), radius: width * 0.5 },
                { x: width * (0.65 + Math.cos(frame * 1.1) * 0.22), y: height * (0.35 + Math.sin(frame * 1.3) * 0.18), radius: width * 0.45 },
                { x: width * (0.5 + Math.sin(frame * 0.8) * 0.16), y: height * (0.65 + Math.cos(frame * 1.05) * 0.16), radius: width * 0.55 },
            ];
            const centerGradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, width * 0.45);
            centerGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity * (0.7 + pulse * 0.6)})`);
            centerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = centerGradient;
            ctx.fillRect(0, 0, width, height);
            ctx.save();
            ctx.translate(width * 0.5, height * 0.5);
            ctx.rotate(frame * 0.35);
            const beamGradient = ctx.createLinearGradient(-width * 0.5, 0, width * 0.5, 0);
            beamGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            beamGradient.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${opacity * 0.6})`);
            beamGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${opacity * 0.9})`);
            beamGradient.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${opacity * 0.6})`);
            beamGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = beamGradient;
            ctx.fillRect(-width * 0.75, -height * 0.08, width * 1.5, height * 0.16);
            ctx.restore();
            blobs.forEach(blob => {
                const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            });
            ctx.globalCompositeOperation = 'source-over';
            requestAnimationFrame(draw);
        };
        const id = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(id);
    }, [color, opacity]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
        />
    );
};

const CodexActionSquare: React.FC<{ action: Action, onClick: () => void }> = ({ action, onClick }) => {
    const displayIcon = action.icon || '🏆';
    const totalProposed = action.repetitions;

    return (
        <div className="relative flex-shrink-0">
            <button 
                onClick={onClick}
                className="relative w-24 h-24 border border-[var(--skin-accent-color)] rounded-xl hover:opacity-80 transition-opacity overflow-hidden"
                style={{ borderColor: CODEX_SKIN_COLOR, boxShadow: `0 0 10px ${CODEX_SKIN_COLOR}20` }}
            >
                <div className="arena-plasma">
                    <PlasmaCanvas color={CODEX_SKIN_COLOR} opacity={0.3} className="arena-plasma-canvas" />
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-1 space-y-1">
                    <span className="text-3xl">{displayIcon}</span>
                    <p className="text-xs font-bold leading-tight line-clamp-2 text-white">{action.name}</p>
                </div>
            </button>
            <div className="absolute top-1 right-1 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none border border-white/10">
                <span>0/{totalProposed}</span>
            </div>
        </div>
    );
};

// Temporary Mock Arena for visual representation in Codex
const createMockArena = (level: any, codexId: string): Arena => ({
    id: `codex-mock-arena-${level.level}`,
    assetId: 'geral', // Default
    name: level.title,
    description: level.description,
    icon: '🧬',
    actionIds: [], // Actions are passed separately
    isArchived: false,
    originCodexId: codexId,
    codexLevel: level.level
});

const createMockActions = (actions: any[], arenaId: string): Action[] => {
    return actions.map((a, i) => ({
        id: `mock-action-${i}`,
        arenaId: arenaId,
        ...a
    }));
}

export const CodexStore: React.FC = () => {
    const { userCodexes, codexCatalog, buyCodex, showToast } = useGame();
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [selectedLevelArena, setSelectedLevelArena] = useState<{ arena: Arena, actions: Action[] } | null>(null);
    const [previewAction, setPreviewAction] = useState<Action | null>(null);

    const handlePurchase = async (catalogId: string, price: number) => {
        if (purchasing) return;
        setPurchasing(catalogId);
        try {
            // Check if already owned by catalog title (since catalog ID != user codex ID)
            const catalogItem = codexCatalog.find(c => c.id === catalogId);
            const isOwned = userCodexes.some(uc => uc.name === catalogItem?.title);
            
            if (isOwned) {
                showToast("Você já possui este Codex.");
                return;
            }
            await buyCodex(catalogId);
        } catch (error) {
            console.error("Failed to purchase Codex", error);
            showToast("Erro ao adquirir Codex.");
        } finally {
            setPurchasing(null);
        }
    };

    console.log("CodexStore rendering with catalog:", codexCatalog);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="grid grid-cols-1 gap-6">
                {codexCatalog && codexCatalog.length > 0 ? (
                    codexCatalog.map(codex => {
                        console.log("Rendering Codex Card for:", codex.title);
                        const isOwned = userCodexes && userCodexes.some(uc => uc.name === codex.title);
                        const template = codex.template;

                        if (!template) {
                            console.warn("Codex missing template, skipping:", codex.id);
                            return null; // Skip invalid entries
                        }

                        return (
                            <GlassCard key={codex.id} variant="neutral" className="relative group overflow-hidden border-purple-500/30">
                                <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
                                
                                <div className="relative z-10 flex flex-col h-full space-y-6 p-2">
                                    {/* Header */}
                                    <div className="flex flex-col md:flex-row gap-4 items-start">
                                        <div className="p-4 bg-black/40 rounded-2xl border border-purple-500/20 text-5xl shadow-[0_0_20px_rgba(168,85,247,0.2)] flex-shrink-0">
                                            {codex.cover_image || '📜'}
                                        </div>
                                        <div className="flex-grow space-y-2">
                                            <div className="flex justify-between items-start">
                                                <h2 className="text-2xl font-black text-gray-100 uppercase tracking-tight">{codex.title}</h2>
                                                {isOwned ? (
                                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/30 flex items-center gap-1">
                                                        <CheckIcon className="w-3 h-3" /> Adquirido
                                                    </span>
                                                ) : (
                                                    <div className="px-3 py-1 bg-black/40 text-yellow-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-yellow-500/30">
                                                        {codex.price_brl === 0 ? 'GRÁTIS' : `R$ ${codex.price_brl}`}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{codex.description}</p>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-500 uppercase font-bold tracking-wider border border-white/5">
                                                    {codex.duration_days} Dias
                                                </span>
                                                {template.tags.map(tag => (
                                                    <span key={tag} className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-500 uppercase font-bold tracking-wider border border-white/5">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Levels Slider with Arena Cards */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Estrutura do Protocolo</div>
                                            <div className="text-[10px] text-gray-600">{template.levels.length} Fases</div>
                                        </div>
                                        
                                        <div className="flex overflow-x-auto gap-4 pb-4 px-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent overscroll-x-contain" style={{ touchAction: 'pan-x' }}>
                                            {template.levels.map((level) => {
                                                const mockArena = createMockArena(level, codex.id);
                                                const mockActions = createMockActions(level.actions, mockArena.id);
                                                
                                                return (
                                                    <div 
                                                        key={level.level} 
                                                        className="snap-center flex-shrink-0 w-64 transform transition-transform hover:scale-105"
                                                    >
                                                        <ArenaCard
                                                            arena={mockArena}
                                                            actions={mockActions}
                                                            onClick={() => setSelectedLevelArena({ arena: mockArena, actions: mockActions })}
                                                            variant="dossier"
                                                            // Pass empty tasks to ensure no completion checks interfere with store view
                                                            tasks={[]}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex justify-end">
                                        {isOwned ? (
                                            <button 
                                                disabled
                                                className="px-8 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-sm flex items-center gap-2 cursor-default"
                                            >
                                                <CheckIcon className="w-4 h-4" /> NA BIBLIOTECA
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handlePurchase(codex.id, codex.price_brl)}
                                                disabled={!!purchasing}
                                                className="px-8 py-3 rounded-xl bg-[var(--skin-accent-color)] text-black font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-[0_0_15px_var(--sephirot-glow-color)] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {purchasing === codex.id ? 'PROCESSANDO...' : codex.price_brl === 0 ? 'RESGATAR AGORA' : `COMPRAR • R$ ${codex.price_brl}`}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        );
                    })
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        <p>Nenhum codex disponível no catálogo no momento.</p>
                    </div>
                )}
            </div>

            {/* Arena Detail Modal Overlay */}
            {selectedLevelArena && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedLevelArena(null)}>
                        <div 
                            className="dossier-bg arena-plate border w-full max-w-sm m-4 rounded-2xl p-4 flex flex-col h-auto max-h-[90vh] relative overflow-hidden"
                            style={{ borderColor: CODEX_SKIN_COLOR, backgroundImage: 'linear-gradient(135deg, rgba(20,20,20,0.96) 0%, rgba(10,10,10,1) 58%, rgba(18,18,18,0.9) 100%)' }}
                            onClick={e => e.stopPropagation()}
                        >
                        <div className="arena-plasma" style={{ opacity: 0.45 }}>
                            <PlasmaCanvas color={CODEX_SKIN_COLOR} opacity={0.189} className="arena-plasma-canvas" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col h-full overflow-hidden">
                            {/* Reuse styles from ArenaDetailModal */}
                            <div className="arena-plate-header flex justify-between items-start flex-shrink-0 gap-2 rounded-xl px-2 py-2 bg-black/20 mb-4">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-16 h-16 bg-black/40 rounded-xl flex items-center justify-center border border-white/10 text-4xl">
                                        {selectedLevelArena.arena.icon}
                                    </div>
                                </div>
                                <div className="flex-grow pt-1">
                                    <h2 className="text-lg font-black text-white leading-tight uppercase" style={{ color: CODEX_SKIN_COLOR }}>{selectedLevelArena.arena.name}</h2>
                                    <p className="text-xs text-gray-400 line-clamp-2">{selectedLevelArena.arena.description}</p>
                                </div>
                                <button onClick={() => setSelectedLevelArena(null)} className="p-1 rounded-full hover:bg-white/10">
                                    <CloseIcon className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Actions Display */}
                            <div className="flex-grow overflow-y-auto custom-scrollbar p-1 flex flex-col">
                                {(() => {
                                    const milestoneActions = selectedLevelArena.actions.filter(a => a.actionType === 'Marco');
                                    const normalActions = selectedLevelArena.actions.filter(a => a.actionType !== 'Marco');
                                    
                                    return (
                                        <>
                                            {milestoneActions.length > 0 && (
                                                <div className="flex-shrink-0 mb-4">
                                                    <div className='relative text-center mb-2'>
                                                    <hr className="border-t border-gray-800" />
                                                    <h3 className="text-xs font-semibold uppercase tracking-wider absolute -top-2 left-1/2 -translate-x-1/2 bg-[#101010] px-2" style={{ color: CODEX_SKIN_COLOR }}>Marcos</h3>
                                                    </div>
                                                    <div className="flex flex-col items-center space-y-2 py-2">
                                                        {milestoneActions.map(action => (
                                                            <div key={action.id} className="relative">
                                                                <button 
                                                                    onClick={() => setPreviewAction(action)}
                                                                    className="relative w-20 h-20 flex-shrink-0 border border-[var(--skin-accent-color)] rounded-xl hover:scale-105 transition-transform overflow-hidden p-1 transform rotate-45"
                                                                    style={{ borderColor: CODEX_SKIN_COLOR, boxShadow: `0 0 10px ${CODEX_SKIN_COLOR}20` }}
                                                                >
                                                                    <div className="arena-plasma">
                                                                        <PlasmaCanvas color={CODEX_SKIN_COLOR} opacity={0.3} className="arena-plasma-canvas" />
                                                                    </div>
                                                                    <div className="relative z-10 transform -rotate-45 flex flex-col items-center justify-center space-y-1">
                                                                        <span className="text-3xl">{action.icon}</span>
                                                                        <p className="text-xs font-bold leading-tight line-clamp-2 text-white">{action.name}</p>
                                                                    </div>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className='relative text-center mb-2 flex-shrink-0'>
                                            <hr className="border-t border-gray-800" />
                                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider absolute -top-2 left-1/2 -translate-x-1/2 bg-[#101010] px-2">Ações</h3>
                                            </div>
                                            <div className="flex-grow overflow-x-auto overflow-y-hidden py-2 min-h-[120px]">
                                            <div className="flex space-x-2 h-full items-center px-2">
                                                {normalActions.map(action => (
                                                        <CodexActionSquare 
                                                            key={action.id} 
                                                            action={action} 
                                                            onClick={() => setPreviewAction(action)} 
                                                        />
                                                ))}
                                            </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
                </Portal>
            )}

            {/* Action Preview Modal */}
            {previewAction && (
                <ActionModal
                    arenaId={previewAction.arenaId}
                    action={previewAction}
                    initialMode="view"
                    onClose={() => setPreviewAction(null)}
                    isPreview={true}
                    customThemeColor={CODEX_SKIN_COLOR}
                />
            )}
        </div>
    );
};
