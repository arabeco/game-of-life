import React, { useMemo, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { CheckIcon, LightbulbIcon } from '../Icons';
import { CampaignsCodex } from '../CampaignsCodex';
import { buildCodexCampaignPreview, type CodexCampaignPreview } from '../../utils/codexPreview';
import { CampaignArenaStack } from '../CampaignArenaStack';
import {
    CATEGORY_LABELS,
    THEME_CATEGORY_ORDER,
    TYPE_CATEGORY_ORDER,
    resolveTemplateCampaignMeta,
    type CampaignCategoryId,
    type CampaignThemeId,
    type CampaignTypeId,
} from '../../utils/campaignCatalogMeta';

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
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_58%),linear-gradient(180deg,rgba(33,24,16,0.95),rgba(10,8,10,0.98))] text-[1.5rem]">
            {cover || '\u{1F4DC}'}
        </div>
    );
};

type AccessTab = 'free' | 'premium';

type CatalogEntry = {
    codex: any;
    template: any;
    preview: CodexCampaignPreview;
    goldPrice: number;
    isFree: boolean;
    actionCount: number;
    coverVisual?: string;
    assetIds: string[];
    assetLabels: string[];
    tags: string[];
    primaryAssetId: string | null;
    primaryAssetLabel: string | null;
    campaignType: CampaignTypeId;
    campaignTheme: CampaignThemeId;
    filterCategories: CampaignCategoryId[];
};

const ASSET_FILTER_ORDER = [
    'consciencia',
    'espaco-mental',
    'espiritualidade',
    'proposito',
    'projetos',
    'conexoes',
    'trabalho',
    'financas',
    'hobbies',
    'fisico',
] as const;

const ASSET_FALLBACK_LABELS: Record<string, string> = {
    consciencia: 'Consciencia',
    'espaco-mental': 'Espaco mental',
    espiritualidade: 'Espiritualidade',
    proposito: 'Proposito',
    projetos: 'Projetos',
    conexoes: 'Conexoes',
    trabalho: 'Trabalho',
    financas: 'Financas',
    hobbies: 'Hobbies',
    fisico: 'Fisico',
};

const TAG_THEME_FALLBACK: Array<{ id: CampaignThemeId; keys: string[] }> = [
    { id: 'exercicio', keys: ['fisico', 'movimento', 'explosao', 'treino', 'ativacao'] },
    { id: 'nutricao', keys: ['nutricao', 'jejum', 'alimentacao', 'biohacking'] },
    { id: 'autocuidado', keys: ['higiene', 'cuidado', 'estetica'] },
    { id: 'bem_estar', keys: ['sono', 'recuperacao', 'descanso', 'saude'] },
    { id: 'psicologia', keys: ['psicologia', 'journaling', 'diario', 'emocional', 'autopercepcao'] },
    { id: 'esportes', keys: ['esporte', 'competicao', 'atletico'] },
    { id: 'estrategia', keys: ['planejamento', 'governanca', 'ordem', 'logistica', 'ambiente'] },
    { id: 'socializacao', keys: ['social', 'amizade', 'familia', 'conexoes'] },
    { id: 'exploracao', keys: ['exploracao', 'descoberta', 'ferramenta', 'novo'] },
    { id: 'produtividade', keys: ['foco', 'flow', 'deep-work', 'eficiencia'] },
];

const TAG_TYPE_FALLBACK: Array<{ id: CampaignTypeId; keys: string[] }> = [
    { id: 'aprendizado', keys: ['clareza', 'maestria', 'identidade', 'governanca', 'diagnostico'] },
    { id: 'pratica', keys: ['movimento', 'explosao', 'foco', 'flow', 'ativacao'] },
    { id: 'arte', keys: ['criatividade', 'design', 'expressao', 'arte'] },
    { id: 'manutencao', keys: ['ordem', 'logistica', 'jejum', 'ritual', 'planejamento', 'ambiente'] },
];

const normalizeToken = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const resolveThemeFromTags = (tags: string[]): CampaignThemeId => {
    const normalized = tags.map(normalizeToken);
    const match = TAG_THEME_FALLBACK.find((option) => option.keys.some((key) => normalized.includes(key)));
    return match?.id || 'produtividade';
};

const resolveTypeFromTags = (tags: string[]): CampaignTypeId => {
    const normalized = tags.map(normalizeToken);
    const match = TAG_TYPE_FALLBACK.find((option) => option.keys.some((key) => normalized.includes(key)));
    return match?.id || 'pratica';
};

export const CodexStore: React.FC = () => {
    const { userCodexes, codexCatalog, buyCodex, showToast, assets } = useGame();
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [campaignPreview, setCampaignPreview] = useState<CodexCampaignPreview | null>(null);
    const [accessTab, setAccessTab] = useState<AccessTab>('free');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAssetId, setSelectedAssetId] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<'all' | CampaignCategoryId>('all');

    const handleQuizTeaser = () => {
        showToast('Quiz de recomendacao de campanhas em breve.');
    };

    const handlePurchase = async (catalogId: string) => {
        if (purchasing) return;
        setPurchasing(catalogId);

        try {
            const catalogItem = codexCatalog.find((codex) => codex.id === catalogId);
            const isOwned = userCodexes.some((userCodex) => userCodex.catalog_id === catalogItem?.id || userCodex.name === catalogItem?.title);

            if (isOwned) {
                showToast('Voce ja possui esta campanha.');
                return;
            }

            await buyCodex(catalogId);
        } catch (error) {
            console.error('Failed to purchase campaign', error);
            showToast('Erro ao adquirir campanha.');
        } finally {
            setPurchasing(null);
        }
    };

    const catalogEntries = useMemo<CatalogEntry[]>(() => (
        (codexCatalog || []).flatMap((codex) => {
            const template = codex.template;
            if (!template) return [];

            const preview = buildCodexCampaignPreview(codex.id, template);
            const goldPrice = Number(codex.price_gold ?? Math.round(codex.price_brl ?? 0));
            const templateMeta = resolveTemplateCampaignMeta(codex.id, template);
            const previewAssetIds = preview.arenas
                .map((arena) => arena.assetId)
                .filter((assetId): assetId is string => Boolean(assetId) && assetId !== 'geral');
            const assetIds = Array.from(new Set([
                ...(templateMeta.primaryAssetId ? [templateMeta.primaryAssetId] : []),
                ...previewAssetIds,
            ]));
            const assetLabels = assetIds
                .map((assetId) => assets.find((asset) => asset.id === assetId)?.name || ASSET_FALLBACK_LABELS[assetId] || assetId)
                .filter((label): label is string => Boolean(label));
            const tags = Array.isArray(template.tags)
                ? template.tags.map((tag: string) => String(tag).trim()).filter(Boolean)
                : [];
            const campaignType = templateMeta.campaignType || resolveTypeFromTags(tags);
            const campaignTheme = templateMeta.campaignTheme || resolveThemeFromTags(tags);

            return [{
                codex,
                template,
                preview,
                goldPrice,
                isFree: goldPrice <= 0,
                actionCount: preview.actions.length,
                coverVisual: codex.cover_image || template.coverImage,
                assetIds,
                assetLabels,
                tags,
                primaryAssetId: assetIds[0] || null,
                primaryAssetLabel: assetLabels[0] || null,
                campaignType,
                campaignTheme,
                filterCategories: [campaignType, campaignTheme],
            }];
        })
    ), [assets, codexCatalog]);

    const visibleByAccess = useMemo(() => (
        catalogEntries.filter((entry) => accessTab === 'free' ? entry.isFree : !entry.isFree)
    ), [accessTab, catalogEntries]);

    const availableAssetFilters = useMemo(() => (
        ASSET_FILTER_ORDER.map((assetId) => ({
            id: assetId,
            label: assets.find((asset) => asset.id === assetId)?.name || ASSET_FALLBACK_LABELS[assetId],
        }))
    ), [assets]);

    const filteredEntries = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return visibleByAccess.filter((entry) => {
            if (selectedAssetId !== 'all' && !entry.assetIds.includes(selectedAssetId)) return false;
            if (selectedCategory !== 'all' && !entry.filterCategories.includes(selectedCategory)) return false;
            if (!normalizedQuery) return true;

            const haystack = [
                entry.codex.title,
                entry.codex.description,
                entry.template.description,
                ...entry.tags,
                ...entry.assetLabels,
                CATEGORY_LABELS[entry.campaignType],
                CATEGORY_LABELS[entry.campaignTheme],
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(normalizedQuery);
        });
    }, [searchQuery, selectedAssetId, selectedCategory, visibleByAccess]);

    const activePreviewEntry = useMemo(() => {
        if (!campaignPreview) return null;
        return catalogEntries.find((entry) => entry.preview.campaign.id === campaignPreview.campaign.id) || null;
    }, [campaignPreview, catalogEntries]);

    return (
        <>
            <div className="space-y-3 animate-fade-in pb-8">
                <GlassCard variant="neutral" className="overflow-hidden border-white/10 p-3">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Buscar campanha, palavra-chave ou ativo..."
                                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-[var(--skin-accent-color)]/35"
                            />
                            <div className="rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
                                {filteredEntries.length}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex flex-1 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
                                <button
                                    type="button"
                                    onClick={() => setAccessTab('free')}
                                    className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all ${accessTab === 'free' ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                                >
                                    Gratis
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAccessTab('premium')}
                                    className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all ${accessTab === 'premium' ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                                >
                                    Premium
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleQuizTeaser}
                                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/78 transition-all hover:border-[var(--skin-accent-color)]/35 hover:bg-white/10 hover:text-white"
                                title="Quiz de recomendacao"
                                aria-label="Quiz de recomendacao"
                            >
                                <LightbulbIcon className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Ativo principal</div>
                            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setSelectedAssetId('all')}
                                    className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-all ${selectedAssetId === 'all' ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                                >
                                    Todos
                                </button>
                                {availableAssetFilters.map((asset) => (
                                    <button
                                        key={asset.id}
                                        type="button"
                                        onClick={() => setSelectedAssetId(asset.id)}
                                        className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-all ${selectedAssetId === asset.id ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                                    >
                                        {asset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Tipo e tema</div>
                            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory('all')}
                                    className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                                >
                                    Todas
                                </button>

                                {TYPE_CATEGORY_ORDER.map((categoryId) => (
                                    <button
                                        key={categoryId}
                                        type="button"
                                        onClick={() => setSelectedCategory(categoryId)}
                                        className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-all ${selectedCategory === categoryId ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                                    >
                                        {CATEGORY_LABELS[categoryId]}
                                    </button>
                                ))}

                                <span className="my-1 w-px shrink-0 rounded-full bg-white/10" aria-hidden="true" />

                                {THEME_CATEGORY_ORDER.map((categoryId) => (
                                    <button
                                        key={categoryId}
                                        type="button"
                                        onClick={() => setSelectedCategory(categoryId)}
                                        className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-all ${selectedCategory === categoryId ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                                    >
                                        {CATEGORY_LABELS[categoryId]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {filteredEntries.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredEntries.map(({ codex, preview, coverVisual, actionCount, goldPrice, isFree, primaryAssetLabel, campaignTheme }) => {
                            const isOwned = userCodexes.some((userCodex) => userCodex.catalog_id === codex.id || userCodex.name === codex.title);

                            return (
                                <GlassCard
                                    key={codex.id}
                                    variant="neutral"
                                    className={`relative overflow-hidden border-white/10 p-2 ${!isFree ? 'bg-[radial-gradient(circle_at_top,rgba(168,36,36,0.14),transparent_58%),linear-gradient(180deg,rgba(26,16,18,0.98),rgba(11,10,12,0.98))]' : ''}`}
                                >
                                    <div className="relative z-10 flex h-full flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCampaignPreview(preview)}
                                            className="rounded-[1.05rem] border border-white/10 bg-black/20 px-2 py-1.5 text-left transition-all hover:border-[var(--skin-accent-color)]/35 hover:bg-white/[0.05]"
                                        >
                                            <div className="relative h-12 overflow-hidden rounded-[0.95rem] border border-white/8 bg-black/30">
                                                <CodexCoverArt cover={coverVisual} title={codex.title} />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                            </div>

                                            <div className="mt-1 line-clamp-2 min-h-[1.75rem] text-[11px] font-black uppercase tracking-[0.05em] leading-tight text-white">
                                                {codex.title}
                                            </div>

                                            <div className="mt-1 flex flex-wrap gap-1">
                                                <span className="rounded-full border border-white/10 bg-white/6 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/72">
                                                    {actionCount} acoes
                                                </span>
                                                <span className="rounded-full border border-white/10 bg-white/6 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/72">
                                                    {codex.duration_days} dias
                                                </span>
                                                {primaryAssetLabel && (
                                                    <span className="rounded-full border border-white/10 bg-white/6 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/68">
                                                        {primaryAssetLabel}
                                                    </span>
                                                )}
                                                <span className="rounded-full border border-white/10 bg-white/6 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/68">
                                                    {CATEGORY_LABELS[campaignTheme]}
                                                </span>
                                            </div>

                                            <div className="mt-1 flex items-center justify-center rounded-[0.95rem] border border-white/8 bg-black/20 px-1 py-0.5">
                                                <CampaignArenaStack arenas={preview.arenas} size="xs" actions={preview.actions} />
                                            </div>
                                        </button>

                                        <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/6 pt-1.5">
                                            {isOwned ? (
                                                <div className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/12 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-green-400">
                                                    <CheckIcon className="h-3 w-3" />
                                                    Biblioteca
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handlePurchase(codex.id)}
                                                    disabled={!!purchasing}
                                                    className="luxe-skin-button inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-[10px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {purchasing === codex.id ? '...' : isFree ? 'Gratis' : <><span>{goldPrice}</span><span aria-hidden>{'\u{1FA99}'}</span></>}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setCampaignPreview(preview)}
                                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-white/82 transition-all hover:border-[var(--skin-accent-color)]/30 hover:bg-white/10"
                                            >
                                                Ver
                                            </button>
                                        </div>
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                ) : (
                    <GlassCard variant="neutral" className="border-dashed border-white/10 px-4 py-12 text-center">
                        <div className="text-sm font-semibold text-white/80">Nenhuma campanha encontrada.</div>
                        <div className="mt-1 text-xs text-white/45">Tente mudar o filtro, a aba ou a busca.</div>
                    </GlassCard>
                )}
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
                        badgeLabel: activePreviewEntry?.isFree ? 'Campanha gratis' : 'Campanha premium',
                        note: activePreviewEntry?.isFree
                            ? 'Disponivel para instalar sem custo.'
                            : 'Pronta para instalar pela loja.',
                        hideArenaDetails: true,
                    }}
                />
            )}
        </>
    );
};
