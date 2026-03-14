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
    codexLevel: level.level,
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
            const isOwned = userCodexes.some(uc => uc.catalog_id === catalogItem?.id || uc.name === catalogItem?.title);

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
            <div className="space-y-4 animate-fade-in pb-8">
                <div className="grid grid-cols-1 gap-4">
                    {codexCatalog && codexCatalog.length > 0 ? (
                        codexCatalog.map(codex => {
                            const isOwned = userCodexes.some(uc => uc.catalog_id === codex.id || uc.name === codex.title);
                            const goldPrice = Number(codex.price_gold ?? Math.round(codex.price_brl ?? 0));
                            const template = codex.template;

                            if (!template) return null;

                            return (
                                <GlassCard key={codex.id} variant="neutral" className="relative group overflow-hidden border-white/10 sm:border-purple-500/30">
                                    <div className="absolute top-0 left-0 w-full h-28 sm:h-36 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

                                    <div className="relative z-10 flex flex-col h-full space-y-4 p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row gap-3 items-start">
                                            <div className="p-3 bg-black/40 rounded-2xl border border-purple-500/20 text-3xl sm:text-4xl shadow-[0_0_20px_rgba(168,85,247,0.2)] flex-shrink-0">
                                                {codex.cover_image || '📜'}
                                            </div>
                                            <div className="flex-grow space-y-2 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                                    <h2 className="text-base sm:text-xl font-black text-gray-100 uppercase tracking-tight leading-tight">
                                                        {codex.title}
                                                    </h2>
                                                    {isOwned ? (
                                                        <span className="inline-flex items-center gap-1 self-start px-2.5 py-1 bg-green-500/20 text-green-400 text-[9px] font-black uppercase tracking-[0.18em] rounded-full border border-green-500/30 whitespace-nowrap">
                                                            <CheckIcon className="w-3 h-3" /> Biblioteca
                                                        </span>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 bg-black/40 text-yellow-300 text-[9px] font-black uppercase tracking-[0.18em] rounded-full border border-yellow-500/30 whitespace-nowrap">
                                                            <span className="text-[11px] leading-none">🪙</span>
                                                            <span>{goldPrice === 0 ? 'Grátis' : goldPrice}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-2xl">{codex.description}</p>
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

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Estrutura do Protocolo</div>
                                                <div className="text-[10px] text-gray-600">{template.levels.length} Fases</div>
                                            </div>

                                            <div className="flex overflow-x-auto gap-3 pb-3 px-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent overscroll-x-contain" style={{ touchAction: 'pan-x' }}>
                                                {template.levels.map((level: any) => {
                                                    const mockArena = createMockArena(level, codex.id);
                                                    const mockActions = createMockActions(level.actions, mockArena.id);

                                                    return (
                                                        <div
                                                            key={level.level}
                                                            className="snap-center flex-shrink-0 w-44 sm:w-52 lg:w-56 transform transition-transform hover:scale-[1.02]"
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

                                        <div className="pt-3 border-t border-white/5 flex justify-end gap-2">
                                            <button
                                                onClick={() => setCampaignPreview(buildCodexCampaignPreview(codex.id, template))}
                                                className="luxe-button-secondary h-9 rounded-xl px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/82 hover:bg-white/10"
                                            >
                                                Campanha
                                            </button>
                                            {isOwned ? (
                                                <button
                                                    disabled
                                                    className="h-9 px-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-[11px] uppercase tracking-[0.14em] flex items-center gap-2 cursor-default"
                                                >
                                                    <CheckIcon className="w-3.5 h-3.5" /> Biblioteca
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handlePurchase(codex.id)}
                                                    disabled={!!purchasing}
                                                    className="luxe-skin-button h-9 px-4 rounded-xl text-[11px] font-black uppercase tracking-[0.16em] inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span className="text-[12px] leading-none">🪙</span>
                                                    <span>{purchasing === codex.id ? '...' : goldPrice === 0 ? 'Resgatar' : goldPrice}</span>
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
