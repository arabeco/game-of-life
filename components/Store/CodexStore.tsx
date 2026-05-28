import React, { useMemo, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { CheckIcon, LightbulbIcon } from '../Icons';
import { CampaignsCodex } from '../CampaignsCodex';
import { ConfirmationModal } from '../ConfirmationModal';
import { buildCodexCampaignPreview, type CodexCampaignPreview } from '../../utils/codexPreview';
import { CampaignArenaStack } from '../CampaignArenaStack';
import { CodexCoverArt as SharedCodexCoverArt } from '../CodexCoverArt';
import { CampaignRecommendationQuizModal } from './CampaignRecommendationQuizModal';
import { hasCompletedFreeCampaignQuiz } from '../../utils/campaignQuiz';
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
    { id: 'expressao', keys: ['arte', 'expressao', 'criatividade', 'escrita', 'desenho', 'musica', 'fotografia'] },
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
    const { userCodexes, userProfile, codexCatalog, buyCodex, installCodex, getArenas, showToast, assets } = useGame();
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [campaignPreview, setCampaignPreview] = useState<CodexCampaignPreview | null>(null);
    const [pendingPurchase, setPendingPurchase] = useState<{ id: string; title: string; goldPrice: number } | null>(null);
    const [isRecommendationQuizOpen, setRecommendationQuizOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAssetId, setSelectedAssetId] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<'all' | CampaignCategoryId>('all');
    const [areFiltersOpen, setFiltersOpen] = useState(false);

    const handleQuizTeaser = () => {
        setRecommendationQuizOpen(true);
    };

    const handlePurchase = async (catalogId: string) => {
        const catalogItem = codexCatalog.find((codex) => codex.id === catalogId);
        if (!catalogItem) return;

        const isOwned = userCodexes.some((userCodex) => userCodex.catalog_id === catalogItem.id || userCodex.name === catalogItem.title);
        if (isOwned) {
            showToast('Você já possui esta campanha na sua biblioteca.');
            return;
        }

        const goldPrice = Number(catalogItem.price_gold ?? Math.round(catalogItem.price_brl ?? 0));
        setPendingPurchase({ id: catalogItem.id, title: catalogItem.title, goldPrice });
    };

    const handleConfirmPurchase = async () => {
        if (!pendingPurchase || purchasing) return;
        setPurchasing(pendingPurchase.id);

        try {
            const acquiredCodex = await buyCodex(pendingPurchase.id, { silentSuccess: true });
            if (acquiredCodex) {
                await installCodex(acquiredCodex.id);
            }
        } catch (error) {
            console.error('Failed to purchase campaign', error);
            showToast('Erro ao adquirir campanha.');
        } finally {
            setPurchasing(null);
            setPendingPurchase(null);
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

    const visibleCatalogEntries = useMemo(() => (
        catalogEntries.filter((entry) => !entry.isFree)
    ), [catalogEntries]);

    const hasOwnedFreeCampaign = useMemo(() => userCodexes.some((userCodex) => {
        if (!userCodex.catalog_id) return false;
        const catalogEntry = catalogEntries.find((entry) => entry.codex.id === userCodex.catalog_id);
        return Boolean(catalogEntry?.isFree);
    }), [catalogEntries, userCodexes]);

    const hasPendingFreeQuiz = !hasCompletedFreeCampaignQuiz() && !hasOwnedFreeCampaign;
    const campaignQuizFreeCredits = Math.max(0, Number(userProfile.campaignQuizFreeCredits || 0));
    const campaignQuizMediumCredits = Math.max(0, Number(userProfile.campaignQuizMediumCredits || 0));
    const totalQuizCredits = campaignQuizFreeCredits + campaignQuizMediumCredits;
    const hasMediumQuizCredit = campaignQuizMediumCredits > 0;
    const hasFreeQuizCredit = campaignQuizFreeCredits > 0;
    const quizHeroTitle = hasPendingFreeQuiz
        ? 'Seu primeiro quiz libera uma campanha recomendada'
        : hasFreeQuizCredit
            ? 'Você tem uma ficha grátis pronta para usar'
        : hasMediumQuizCredit
            ? 'Você tem uma ficha média pronta para usar'
            : 'Escolha uma campanha pronta para instalar agora';
    const quizHeroCopy = hasPendingFreeQuiz
        ? 'As campanhas grátis não ficam mais espalhadas no catálogo. O quiz encontra a melhor para o seu momento e ainda mostra uma opção premium como veja também.'
        : hasFreeQuizCredit
            ? `Seu plano liberou ${campaignQuizFreeCredits} ficha${campaignQuizFreeCredits === 1 ? '' : 's'} grátis para usar no próximo quiz e puxar uma campanha recomendada sem custo.`
        : hasMediumQuizCredit
            ? `Seu plano liberou ${campaignQuizMediumCredits} ficha${campaignQuizMediumCredits === 1 ? '' : 's'} média${campaignQuizMediumCredits === 1 ? '' : 's'} para usar no próximo quiz e liberar uma campanha recomendada sem custo em ouro.`
            : 'O catálogo aberto foca nas campanhas premium. Se quiser uma rota mais guiada, o quiz ainda recomenda a próxima campanha certa para você.';
    const quizButtonLabel = hasPendingFreeQuiz
        ? 'Fazer quiz grátis'
        : totalQuizCredits > 0
            ? `Quiz · ${totalQuizCredits}`
            : 'Fazer quiz';

    const availableAssetFilters = useMemo(() => (
        ASSET_FILTER_ORDER.map((assetId) => ({
            id: assetId,
            label: assets.find((asset) => asset.id === assetId)?.name || ASSET_FALLBACK_LABELS[assetId],
        }))
    ), [assets]);
    const activeFilterCount = (selectedAssetId !== 'all' ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0);
    const activeFilterLabel = [
        selectedAssetId !== 'all'
            ? availableAssetFilters.find((asset) => asset.id === selectedAssetId)?.label
            : null,
        selectedCategory !== 'all' ? CATEGORY_LABELS[selectedCategory] : null,
    ].filter(Boolean).join(' / ');

    const filteredEntries = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return visibleCatalogEntries.filter((entry) => {
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
    }, [searchQuery, selectedAssetId, selectedCategory, visibleCatalogEntries]);

    const activePreviewEntry = useMemo(() => {
        if (!campaignPreview) return null;
        return catalogEntries.find((entry) => entry.preview.campaign.id === campaignPreview.campaign.id) || null;
    }, [campaignPreview, catalogEntries]);

    const allArenas = getArenas();
    const installedCodexIds = useMemo(
        () => new Set(allArenas.map((arena) => arena.originCodexId).filter(Boolean)),
        [allArenas],
    );

    return (
        <>
            <div className="space-y-3 animate-fade-in pb-8">
                <GlassCard variant="neutral" className="overflow-hidden border-[var(--skin-accent-color)]/18 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_58%),linear-gradient(180deg,rgba(22,18,12,0.96),rgba(8,8,10,0.98))] p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl">
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--skin-accent-color)]/82">
                                Porta principal das campanhas
                            </div>
                            <h2 className="mt-2 text-lg font-black uppercase tracking-[0.05em] text-white">
                                {quizHeroTitle}
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-white/62">
                                {quizHeroCopy}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                                type="button"
                                onClick={handleQuizTeaser}
                                className="luxe-skin-button inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em]"
                            >
                                <LightbulbIcon className="h-4 w-4" />
                                {quizButtonLabel}
                            </button>
                        </div>
                    </div>
                </GlassCard>

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
                            <button
                                type="button"
                                onClick={() => setFiltersOpen((current) => !current)}
                                className={`inline-flex min-h-[42px] shrink-0 items-center justify-center rounded-xl border px-3 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${areFiltersOpen || activeFilterCount > 0 ? 'border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/10 text-[var(--ui-text-accent)]' : 'border-white/10 bg-white/5 text-white/78 hover:border-[var(--skin-accent-color)]/35 hover:bg-white/10 hover:text-white'}`}
                                aria-expanded={areFiltersOpen}
                            >
                                Filtros{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                            <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Catálogo premium</div>
                                <div className="mt-1 truncate text-[11px] leading-relaxed text-white/62">
                                    {activeFilterLabel || (hasMediumQuizCredit
                                        ? 'Ficha disponível no quiz ou compra direta por ouro.'
                                        : 'Campanhas grátis entram pelo quiz. Compra direta fica aqui.')}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleQuizTeaser}
                                className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-white/78 transition-all hover:border-[var(--skin-accent-color)]/35 hover:bg-white/10 hover:text-white"
                                title="Quiz de recomendação"
                                aria-label="Quiz de recomendação"
                            >
                                <LightbulbIcon className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.16em]">
                                    {hasPendingFreeQuiz ? 'Quiz grátis' : totalQuizCredits > 0 ? `Quiz · ${totalQuizCredits}` : 'Quiz'}
                                </span>
                            </button>
                        </div>

                        {areFiltersOpen && (
                            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3">
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
                        )}
                    </div>
                </GlassCard>

                {filteredEntries.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredEntries.map(({ codex, preview, coverVisual, actionCount, goldPrice, isFree, primaryAssetLabel, campaignTheme }) => {
                            const ownedCodex = userCodexes.find((userCodex) => userCodex.catalog_id === codex.id || userCodex.name === codex.title) || null;
                            const isOwned = Boolean(ownedCodex);
                            const isInstalled = Boolean(ownedCodex && installedCodexIds.has(ownedCodex.id));

                            return (
                                <GlassCard
                                    key={codex.id}
                                    variant="neutral"
                                    className={`relative h-[17.35rem] overflow-hidden border-white/10 p-2 ${!isFree ? 'bg-[radial-gradient(circle_at_top,rgba(168,36,36,0.14),transparent_58%),linear-gradient(180deg,rgba(26,16,18,0.98),rgba(11,10,12,0.98))]' : ''}`}
                                >
                                    <div className="relative z-10 flex h-full flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCampaignPreview(preview)}
                                            className="flex flex-1 flex-col rounded-[1.05rem] border border-white/10 bg-black/20 px-2 py-1.5 text-left transition-all hover:border-[var(--skin-accent-color)]/35 hover:bg-white/[0.05]"
                                        >
                                            <div className="relative h-12 overflow-hidden rounded-[0.95rem] border border-white/8 bg-black/30">
                                                <SharedCodexCoverArt cover={coverVisual} title={codex.title} />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                            </div>

                                            <div className="mt-1 line-clamp-2 min-h-[1.85rem] text-[11px] font-black uppercase tracking-[0.05em] leading-tight text-white">
                                                {codex.title}
                                            </div>

                                            <div className="mt-1 flex min-h-[2.95rem] max-h-[2.95rem] flex-wrap content-start gap-1 overflow-y-auto pr-1 hide-scrollbar">
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

                                            <div className="mt-auto flex items-center justify-center rounded-[0.95rem] border border-white/8 bg-black/20 px-1 py-0.5">
                                                <CampaignArenaStack arenas={preview.arenas} size="xs" actions={preview.actions} />
                                            </div>
                                        </button>

                                        <div className="flex items-center justify-between gap-2 border-t border-white/6 pt-1.5">
                                            {isInstalled ? (
                                                <div className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-xl border border-green-500/30 bg-green-500/12 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-green-400">
                                                    <CheckIcon className="h-3 w-3" />
                                                    No app
                                                </div>
                                            ) : isOwned && ownedCodex ? (
                                                <button
                                                    type="button"
                                                    onClick={() => { void installCodex(ownedCodex.id); }}
                                                    disabled={purchasing === codex.id}
                                                    className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/82 transition-all hover:border-[var(--skin-accent-color)]/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Instalar
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handlePurchase(codex.id)}
                                                    disabled={!!purchasing}
                                                    className="luxe-skin-button inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-[10px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {purchasing === codex.id ? '...' : isFree ? 'Gratis' : <><span>{goldPrice}</span><span aria-hidden>{'\u{1FA99}'}</span></>}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setCampaignPreview(preview)}
                                                className="h-9 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-white/82 transition-all hover:border-[var(--skin-accent-color)]/30 hover:bg-white/10"
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
                        badgeLabel: activePreviewEntry?.isFree ? 'Campanha grátis' : 'Campanha premium',
                        note: activePreviewEntry?.isFree
                            ? 'Disponível para instalar agora sem custo.'
                            : 'Ao adquirir, entra nas suas campanhas e tenta instalar na hora.',
                        hideArenaDetails: true,
                    }}
                />
            )}
            {pendingPurchase && (
                <ConfirmationModal
                    title="Confirmar campanha"
                    message={pendingPurchase.goldPrice <= 0
                        ? `${pendingPurchase.title} vai entrar nas suas campanhas sem custo e tentar instalar no app agora. Deseja continuar?`
                        : `${pendingPurchase.title} vai debitar ${pendingPurchase.goldPrice} ouro, entrar nas suas campanhas e tentar instalar no app agora. Deseja continuar?`}
                    confirmLabel={pendingPurchase.goldPrice <= 0 ? 'ADICIONAR' : `COMPRAR - ${pendingPurchase.goldPrice} OURO`}
                    onConfirm={() => { void handleConfirmPurchase(); }}
                    onCancel={() => setPendingPurchase(null)}
                />
            )}
            {isRecommendationQuizOpen && (
                <CampaignRecommendationQuizModal onClose={() => setRecommendationQuizOpen(false)} />
            )}
        </>
    );
};

