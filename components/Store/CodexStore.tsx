import React, { useMemo, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { CheckIcon, EyeIcon, FolderIcon } from '../Icons';
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
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_58%),linear-gradient(180deg,rgba(33,24,16,0.95),rgba(10,8,10,0.98))] text-[3.4rem]">
            {cover || '📜'}
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
                            const phasePreview = template.levels.slice(0, 3);

                            return (
                                <GlassCard key={codex.id} variant="neutral" className="relative overflow-hidden border-white/10">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_38%)] pointer-events-none" />
                                    <div className="absolute left-5 top-0 h-4 w-28 rounded-b-[1rem] border border-t-0 border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))] pointer-events-none" />

                                    <div className="relative z-10 flex h-full flex-col gap-4 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/62">
                                                <FolderIcon className="h-3.5 w-3.5" />
                                                Pasta de campanha
                                            </div>

                                            <div className="flex flex-wrap justify-end gap-2">
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/25 bg-black/40 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-yellow-300">
                                                    <span className="text-[11px] leading-none">🪙</span>
                                                    <span>{goldPrice === 0 ? 'Gratis' : goldPrice}</span>
                                                </span>
                                                {isOwned && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/12 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-green-400">
                                                        <CheckIcon className="h-3 w-3" />
                                                        Biblioteca
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                                            <button
                                                type="button"
                                                onClick={() => setCampaignPreview(preview)}
                                                className="group/cover relative min-h-[13rem] overflow-hidden rounded-[1.45rem] border border-white/10 bg-black/35 text-left"
                                            >
                                                <CodexCoverArt cover={coverVisual} title={codex.title} />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                                                <div className="absolute inset-x-0 bottom-0 p-4">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--skin-accent-color)]">
                                                        Codex da loja
                                                    </div>
                                                    <div className="mt-2 text-xl font-black uppercase leading-tight text-white">
                                                        {codex.title}
                                                    </div>
                                                </div>
                                            </button>

                                            <div className="space-y-3">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                                                        {authorLabel}
                                                    </div>
                                                    <h2 className="mt-2 text-xl font-black uppercase tracking-[0.04em] leading-tight text-white">
                                                        {codex.title}
                                                    </h2>
                                                    <p className="mt-3 text-sm leading-relaxed text-white/68">
                                                        {codex.description || template.description || 'Campanha guiada pronta para instalar.'}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                                                        {template.levels.length} fases
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                                                        {actionCount} acoes
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                                                        {codex.duration_days} dias
                                                    </span>
                                                    {(template.tags || []).slice(0, 3).map((tag: string) => (
                                                        <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/58">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="rounded-[1.1rem] border border-amber-400/15 bg-amber-500/8 px-3 py-3 text-xs leading-relaxed text-amber-100/78">
                                                    Veja a estrutura da campanha antes da compra. Os detalhes internos das arenas ficam protegidos ate instalar o Codex.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-3 lg:grid-cols-[0.88fr_1.12fr]">
                                            <button
                                                type="button"
                                                onClick={() => setCampaignPreview(preview)}
                                                className="rounded-[1.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-3 text-left transition-all hover:border-[var(--skin-accent-color)]/35 hover:bg-white/8"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                                                            Vista da campanha
                                                        </div>
                                                        <div className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
                                                            Pasta ativa
                                                        </div>
                                                    </div>
                                                    <EyeIcon className="h-4 w-4 text-[var(--skin-accent-color)]" />
                                                </div>

                                                <div className="mt-3 flex items-center justify-center rounded-[1rem] border border-white/8 bg-[linear-gradient(180deg,rgba(212,175,55,0.12),rgba(10,10,12,0.18))] px-2 py-3">
                                                    <CampaignArenaStack arenas={preview.arenas} size="md" />
                                                </div>
                                            </button>

                                            <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                                                        Fases em destaque
                                                    </div>
                                                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/34">
                                                        {template.levels.length} no total
                                                    </div>
                                                </div>

                                                <div className="mt-3 space-y-2">
                                                    {phasePreview.map((level) => (
                                                        <button
                                                            key={level.level}
                                                            type="button"
                                                            onClick={() => setCampaignPreview(preview)}
                                                            className="flex w-full items-center justify-between gap-3 rounded-[1rem] border border-white/8 bg-white/[0.03] px-3 py-3 text-left transition-all hover:border-[var(--skin-accent-color)]/28 hover:bg-white/[0.05]"
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--skin-accent-color)]">
                                                                    Fase {level.level}
                                                                </div>
                                                                <div className="mt-1 truncate text-sm font-bold text-white">
                                                                    {level.title}
                                                                </div>
                                                            </div>
                                                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">
                                                                {(level.actions || []).length} acoes
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 border-t border-white/5 pt-3 sm:flex-row sm:justify-end">
                                            <button
                                                onClick={() => setCampaignPreview(preview)}
                                                className="luxe-button-secondary inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/82 hover:bg-white/10"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                                Ver campanha
                                            </button>

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
                        note: 'A estrutura da campanha fica visivel aqui, mas os detalhes internos de cada arena so aparecem depois da compra.',
                        hideArenaDetails: true,
                    }}
                />
            )}
        </>
    );
};
