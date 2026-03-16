import React, { useMemo, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { CheckIcon } from '../Icons';
import { CampaignsCodex } from '../CampaignsCodex';
import { buildCodexCampaignPreview, CodexCampaignPreview } from '../../utils/codexPreview';
import { CampaignArenaStack } from '../CampaignArenaStack';

const isProbablyImageUrl = (value?: string | null) => {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('/') || normalized.startsWith('data:image/');
};

const CodexCoverArt: React.FC<{ cover?: string; title: string }> = ({ cover, title }) => {
    if (isProbablyImageUrl(cover)) {
        return <img src={cover} alt={title} className="absolute inset-0 h-full w-full object-cover" />;
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_58%),linear-gradient(180deg,rgba(33,24,16,0.95),rgba(10,8,10,0.98))] text-[2.8rem]">
            {cover || '??'}
        </div>
    );
};

export const CodexStore: React.FC = () => {
    const { userCodexes, codexCatalog, buyCodex, showToast } = useGame();
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [campaignPreview, setCampaignPreview] = useState<CodexCampaignPreview | null>(null);

    const handlePurchase = async (catalogId: string) => {
        if (purchasing) return;
        setPurchasing(catalogId);

        try {
            const catalogItem = codexCatalog.find((codex) => codex.id === catalogId);
            const isOwned = userCodexes.some((userCodex) => userCodex.catalog_id === catalogItem?.id || userCodex.name === catalogItem?.title);

            if (isOwned) {
                showToast('Voce ja possui este Codex.');
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

    const catalogEntries = useMemo(() => (
        (codexCatalog || []).flatMap((codex) => {
            const template = codex.template;
            if (!template) return [];

            return [{
                codex,
                template,
                preview: buildCodexCampaignPreview(codex.id, template),
                coverVisual: codex.cover_image || template.coverImage,
                authorLabel: codex.author_name || template.author || 'Autor desconhecido',
            }];
        })
    ), [codexCatalog]);

    const activePreviewEntry = useMemo(() => {
        if (!campaignPreview) return null;
        return catalogEntries.find((entry) => entry.preview.campaign.id === campaignPreview.campaign.id) || null;
    }, [campaignPreview, catalogEntries]);

    return (
        <>
            <div className="space-y-4 animate-fade-in pb-8">
                <div className="grid grid-cols-1 gap-4">
                    {catalogEntries.length > 0 ? (
                        catalogEntries.map(({ codex, template, preview, coverVisual, authorLabel }) => {
                            const isOwned = userCodexes.some((userCodex) => userCodex.catalog_id === codex.id || userCodex.name === codex.title);
                            const goldPrice = Number(codex.price_gold ?? Math.round(codex.price_brl ?? 0));
                            const actionCount = preview.actions.length;

                            return (
                                <GlassCard key={codex.id} variant="neutral" className="relative overflow-hidden border-white/10">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_38%)] pointer-events-none" />

                                    <div className="relative z-10 flex h-full flex-col gap-2.5 p-3">
                                        <div className="flex items-start gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setCampaignPreview(preview)}
                                                className="group/cover relative h-16 w-16 shrink-0 overflow-hidden rounded-[1rem] border border-white/10 bg-black/35"
                                            >
                                                <CodexCoverArt cover={coverVisual} title={codex.title} />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                                            </button>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                                                            {authorLabel}
                                                        </div>
                                                        <h2 className="mt-1 line-clamp-2 text-[15px] font-black uppercase tracking-[0.05em] leading-tight text-white">
                                                            {codex.title}
                                                        </h2>
                                                    </div>
                                                    {isOwned && (
                                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-500/30 bg-green-500/12 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-green-400">
                                                            <CheckIcon className="h-3 w-3" />
                                                            Biblioteca
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/66">
                                                    {codex.description || template.description || 'Campanha guiada pronta para instalar.'}
                                                </p>

                                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white/58">
                                                        {template.levels.length} fases
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white/58">
                                                        {actionCount} acoes
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white/58">
                                                        {codex.duration_days} dias
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setCampaignPreview(preview)}
                                            className="rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-2.5 text-left transition-all hover:border-[var(--skin-accent-color)]/35 hover:bg-white/8"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-black uppercase tracking-[0.06em] text-white">
                                                        {template.levels.length} fases, {preview.arenas.length} arenas
                                                    </div>
                                                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                                                        {actionCount} acoes distribuidas na trilha
                                                    </div>
                                                </div>
                                                <div className="shrink-0 rounded-[0.85rem] border border-white/8 bg-black/25 px-2 py-1.5">
                                                    <CampaignArenaStack arenas={preview.arenas} size="sm" />
                                                </div>
                                            </div>
                                        </button>

                                        <div className="flex justify-end border-t border-white/5 pt-3">
                                            {isOwned ? (
                                                <button
                                                    disabled
                                                    className="flex h-10 cursor-default items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-green-400"
                                                >
                                                    <CheckIcon className="h-3.5 w-3.5" />
                                                    Biblioteca
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handlePurchase(codex.id)}
                                                    disabled={!!purchasing}
                                                    className="luxe-skin-button inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-[11px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <span>{purchasing === codex.id ? '...' : goldPrice === 0 ? 'Resgatar' : `${goldPrice} ouro`}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </GlassCard>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center text-gray-500">
                            <p>Nenhum codex disponivel no catalogo no momento.</p>
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
                    previewMeta={{
                        coverImage: activePreviewEntry?.coverVisual,
                        badgeLabel: 'Codex da loja',
                        author: activePreviewEntry?.authorLabel,
                        hideArenaDetails: true,
                    }}
                />
            )}
        </>
    );
};
