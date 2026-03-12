import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { CheckIcon } from '../Icons';
import { ArenaCard } from '../ArenaCard';
import { Arena, Action } from '../../types';
import { CampaignsCodex } from '../CampaignsCodex';
import { buildCodexCampaignPreview, CodexCampaignPreview } from '../../utils/codexPreview';

const createMockArena = (level: any, codexId: string): Arena => ({
    id: `codex-mock-arena-${codexId}-${level.level}`,
    assetId: 'geral',
    name: level.title,
    description: level.description,
    icon: level.actions?.[0]?.icon || '🧬',
    actionIds: [],
    isArchived: false,
    originCodexId: codexId,
    codexLevel: level.level
});

const createMockActions = (actions: any[], arenaId: string): Action[] =>
    (actions || []).map((action, index) => ({
        id: `mock-action-${arenaId}-${index}`,
        arenaId,
        name: action.name,
        description: action.description || '',
        icon: action.icon || '✨',
        duration: typeof action.duration === 'number' ? action.duration : 15,
        repetitions: typeof action.repetitions === 'number' ? Math.max(1, action.repetitions) : 1,
        actionType: action.actionType === 'Marco' || action.actionType === 'Compromisso' || action.actionType === 'Ação Recorrente'
            ? action.actionType
            : 'Ação Recorrente',
        difficulty: typeof action.difficulty === 'number' ? action.difficulty : 1,
        briefing: action.briefing,
        assets: action.assets,
        preFlight: action.preFlight,
        context: action.context,
        scheduledDays: action.scheduledDays,
        scheduledStartTime: action.scheduledStartTime,
    }));

export const CodexStore: React.FC = () => {
    const { userCodexes, codexCatalog, buyCodex, showToast } = useGame();
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [campaignPreview, setCampaignPreview] = useState<CodexCampaignPreview | null>(null);

    const handlePurchase = async (catalogId: string) => {
        if (purchasing) return;
        setPurchasing(catalogId);
        try {
            const catalogItem = codexCatalog.find(c => c.id === catalogId);
            const isOwned = userCodexes.some(uc => uc.name === catalogItem?.title);

            if (isOwned) {
                showToast('Você já possui este Codex.');
                return;
            }

            await buyCodex(catalogId);
        } catch (error) {
            console.error('Failed to purchase Codex', error);
            showToast('Erro ao adquirir Codex.');
        } finally {
            setPurchasing(null);
        }
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in pb-10">
                <div className="grid grid-cols-1 gap-6">
                    {codexCatalog && codexCatalog.length > 0 ? (
                        codexCatalog.map(codex => {
                            const isOwned = userCodexes.some(uc => uc.name === codex.title);
                            const template = codex.template;

                            if (!template) return null;

                            return (
                                <GlassCard key={codex.id} variant="neutral" className="relative group overflow-hidden border-purple-500/30">
                                    <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

                                    <div className="relative z-10 flex flex-col h-full space-y-6 p-2">
                                        <div className="flex flex-col md:flex-row gap-4 items-start">
                                            <div className="p-4 bg-black/40 rounded-2xl border border-purple-500/20 text-5xl shadow-[0_0_20px_rgba(168,85,247,0.2)] flex-shrink-0">
                                                {codex.cover_image || '📜'}
                                            </div>
                                            <div className="flex-grow space-y-2">
                                                <div className="flex justify-between items-start gap-3">
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
                                                    {(template.tags || []).map((tag: string) => (
                                                        <span key={tag} className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-500 uppercase font-bold tracking-wider border border-white/5">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Estrutura do Protocolo</div>
                                                <div className="text-[10px] text-gray-600">{template.levels.length} Fases</div>
                                            </div>

                                            <div className="flex overflow-x-auto gap-4 pb-4 px-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent overscroll-x-contain" style={{ touchAction: 'pan-x' }}>
                                                {template.levels.map((level: any) => {
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
                                                                onClick={() => setCampaignPreview(buildCodexCampaignPreview(codex.id, template))}
                                                                variant="dossier"
                                                                tasks={[]}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                                            <button
                                                onClick={() => setCampaignPreview(buildCodexCampaignPreview(codex.id, template))}
                                                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
                                            >
                                                VER CAMPANHA
                                            </button>
                                            {isOwned ? (
                                                <button
                                                    disabled
                                                    className="px-8 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-sm flex items-center gap-2 cursor-default"
                                                >
                                                    <CheckIcon className="w-4 h-4" /> NA BIBLIOTECA
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handlePurchase(codex.id)}
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
            </div>

            {campaignPreview && (
                <CampaignsCodex
                    onClose={() => setCampaignPreview(null)}
                    initialCampaignId={campaignPreview.campaign.id}
                    previewCampaign={campaignPreview.campaign}
                    previewArenas={campaignPreview.arenas}
                    previewActions={campaignPreview.actions}
                />
            )}
        </>
    );
};
