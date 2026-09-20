import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { CheckIcon, FilterIcon, LightbulbIcon } from '../Icons';
import { CampaignsCodex } from '../CampaignsCodex';
import { ConfirmationModal } from '../ConfirmationModal';
import { buildCodexCampaignPreview, type CodexCampaignPreview } from '../../utils/codexPreview';
import { getCampaignPriceForProfile } from '../../utils/premiumAccess';
import { CampaignArenaStack } from '../CampaignArenaStack';
import { CodexCoverArt as SharedCodexCoverArt } from '../CodexCoverArt';
import { ASSET_ACCENT_COLORS } from '../../constants/assetVisuals';
import { CampaignRecommendationQuizModal } from './CampaignRecommendationQuizModal';

/* O mesmo chanfro de oito cantos da placa de ciclo e da placa do legado. */
const CANTO_DO_CARD = 14;
const recorteDoCard = {
    clipPath: `polygon(${CANTO_DO_CARD}px 0, calc(100% - ${CANTO_DO_CARD}px) 0, 100% ${CANTO_DO_CARD}px, 100% calc(100% - ${CANTO_DO_CARD}px), calc(100% - ${CANTO_DO_CARD}px) 100%, ${CANTO_DO_CARD}px 100%, 0 calc(100% - ${CANTO_DO_CARD}px), 0 ${CANTO_DO_CARD}px)`,
};
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
import { LIFE_AREAS } from '../../constants/lifeAreas';

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
    /* O preco de tabela, antes do desconto do Platinum. O card compara os dois
       para dizer de quanto foi o abatimento — sem ele, o beneficio pago some
       justamente na tela da compra. */
    listPrice: number;
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

const ASSET_FILTER_ORDER = LIFE_AREAS.map((area) => area.id);

const ASSET_FALLBACK_LABELS: Record<string, string> = Object.fromEntries(
    LIFE_AREAS.map((area) => [area.id, area.name]),
);

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
    const { userCodexes, userProfile, codexCatalog, refreshCodexes, buyCodex, installCodex, getArenas, showToast, assets } = useGame();
    useEffect(() => { void refreshCodexes(); }, [refreshCodexes]);
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

        const goldPrice = getCampaignPriceForProfile(Number(catalogItem.price_gold ?? Math.round(catalogItem.price_brl ?? 0)), userProfile);
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
            const listPrice = Number(codex.price_gold ?? Math.round(codex.price_brl ?? 0));
            // O Platinum paga menos pela campanha. Guardamos os dois precos para a
            // etiqueta mostrar de quanto era e de quanto ficou.
            const goldPrice = getCampaignPriceForProfile(listPrice, userProfile);
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
                listPrice,
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
    const quizButtonLabel = hasPendingFreeQuiz
        ? 'Fazer quiz grátis'
        : totalQuizCredits > 0
            ? 'Usar quiz disponível'
            : 'Encontrar minha campanha';
    const quizStatusLabel = hasPendingFreeQuiz
        ? 'Grátis'
        : totalQuizCredits > 0
            ? `${totalQuizCredits} ${totalQuizCredits === 1 ? 'ficha' : 'fichas'}`
            : 'Personalizado';

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
                {/* O titulo "CAMPANHAS" e a faixa do quiz sairam daqui.
                    O titulo nomeava a tela com a aba "Campanhas" ja selecionada
                    logo acima, e o quiz era um botao de largura inteira com rotulo,
                    icone e selo de status — 52px so para oferecer uma ajuda opcional,
                    antes de qualquer campanha aparecer. Os dois empurravam o conteudo
                    para fora da primeira dobra.

                    O quiz virou um botao quadrado na mesma faixa da busca e do filtro:
                    continua ao alcance, sem cobrar a abertura da tela. */}
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
                                onClick={handleQuizTeaser}
                                className="luxe-skin-button relative inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl"
                                aria-label={quizButtonLabel}
                                title={quizButtonLabel}
                            >
                                <LightbulbIcon className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setFiltersOpen((current) => !current)}
                                className={`relative inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border transition-all ${areFiltersOpen || activeFilterCount > 0 ? 'border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/10 text-[var(--ui-text-accent)]' : 'border-white/10 bg-white/5 text-white/78 hover:border-[var(--skin-accent-color)]/35 hover:bg-white/10 hover:text-white'}`}
                                aria-expanded={areFiltersOpen}
                                aria-label="Filtros"
                                title="Filtros"
                            >
                                <FilterIcon className="h-4 w-4" />
                                {/* O numero de filtros ativos vira marcador no canto: a
                                    palavra "Filtros · 2" so cabia porque o botao era
                                    largo, e era o botao largo o problema. */}
                                {activeFilterCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--skin-accent-color)] px-1 text-[9px] font-black leading-none text-black">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {activeFilterLabel && (
                            <div className="truncate px-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/45">
                                Exibindo: {activeFilterLabel}
                            </div>
                        )}

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
                        {filteredEntries.map(({ codex, template, preview, coverVisual, actionCount, goldPrice, listPrice, isFree }) => {
                            /*
                             * A COR DA CAMPANHA VEM DAS ARENAS QUE ELA REUNE.
                             *
                             * Nao ha paleta nova a inventar nem escolha a pedir: arena ja
                             * tem `assetId`, e `ASSET_ACCENT_COLORS` e a MESMA fonte que
                             * pinta os Feitos. Assim a familia fecha — a placa e pintada
                             * pelo patamar, o Feito pela arena, e a campanha pelas arenas
                             * que ela junta. Sem nenhuma declarada, cai num aco neutro.
                             */
                            const arenaComCor = preview.arenas.find((arena) => arena.assetId && ASSET_ACCENT_COLORS[arena.assetId as keyof typeof ASSET_ACCENT_COLORS]);
                            const tomDaCampanha = (arenaComCor?.assetId && ASSET_ACCENT_COLORS[arenaComCor.assetId as keyof typeof ASSET_ACCENT_COLORS]) || '#687380';
                            const ownedCodex = userCodexes.find((userCodex) => userCodex.catalog_id === codex.id || userCodex.name === codex.title) || null;
                            const isOwned = Boolean(ownedCodex);
                            const isInstalled = Boolean(ownedCodex && installedCodexIds.has(ownedCodex.id));

                            return (
                                /*
                                 * O CARD DA CAMPANHA NA GRAMATICA DAS PLACAS.
                                 *
                                 * Era um `GlassCard` arredondado com borda de 1px — o dialeto
                                 * anterior, o mesmo que os quadros do ciclo falavam antes de
                                 * entrarem na familia. Agora usa o chanfro de oito cantos e a
                                 * moldura de `border-image` que corre do escuro ao claro varias
                                 * vezes, igual a placa de ciclo e a do legado.
                                 */
                                <div
                                    key={codex.id}
                                    className="relative flex min-h-[17rem] flex-col gap-2 overflow-hidden p-2"
                                    style={{
                                        background: [
                                            `radial-gradient(ellipse at 50% 0%, ${tomDaCampanha}26, transparent 62%)`,
                                            'linear-gradient(180deg, rgba(14,14,16,0.98), rgba(8,8,10,0.98))',
                                        ].join(', '),
                                        ...recorteDoCard,
                                    }}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-[3px] z-[2]"
                                        style={{
                                            border: '1px solid transparent',
                                            borderImageSource: `linear-gradient(135deg, ${tomDaCampanha}cc 0%, ${tomDaCampanha}44 26%, ${tomDaCampanha}aa 52%, rgba(255,255,255,0.12) 78%, ${tomDaCampanha}88 100%)`,
                                            borderImageSlice: 1,
                                            ...recorteDoCard,
                                        }}
                                    />
                                    <div className="relative z-10 flex h-full flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCampaignPreview(preview)}
                                            className="flex flex-1 flex-col overflow-hidden rounded-lg border border-white/8 bg-black/25 text-left transition-all hover:border-[var(--skin-accent-color)]/35 hover:bg-white/[0.04]"
                                        >
                                            {/*
                                              * A HIERARQUIA DO CARD ESTAVA DE CABECA PARA BAIXO.
                                              *
                                              * O maior elemento era uma arte de emoji de 4.75rem — o
                                              * que menos informa. Logo abaixo, tres numeros do mesmo
                                              * peso (dias, acoes, arenas), nenhum protagonista. E a
                                              * DESCRICAO, que e o unico texto que responde "isto
                                              * serve para mim?", vinha por ultimo, em 9px cinza,
                                              * cortada em duas linhas no meio da frase.
                                              *
                                              * Aqui o emoji vira selo do tamanho de um selo, ao lado
                                              * do titulo; a descricao ganha o corpo e o espaco que
                                              * ela merece; as arenas viram lista com nome, que e a
                                              * prova do que vem dentro; e a exigencia — dias e acoes
                                              * — cabe numa linha, porque numero que qualifica nao
                                              * precisa de bloco proprio.
                                              */}
                                            <div className="flex items-start gap-2 px-2 pt-2">
                                                <div
                                                    className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg"
                                                    style={{ background: `linear-gradient(160deg, ${tomDaCampanha}2e, rgba(0,0,0,0.35))` }}
                                                >
                                                    <SharedCodexCoverArt cover={coverVisual} title={codex.title} emojiSize="cover-sm" />
                                                </div>
                                                <div
                                                    className="min-w-0 flex-1 text-[12px] font-black uppercase leading-[1.05] tracking-[0.04em]"
                                                    style={{
                                                        /* A sequencia de paradas e a mesma da placa: comeca
                                                           e passa pelo tom, mas TERMINA claro. Fechar no tom
                                                           escuro apagava as letras das pontas — "RESET"
                                                           entrava sumindo. */
                                                        background: `linear-gradient(103deg, ${tomDaCampanha} 2%, #e9edf2 26%, #fff8ea 46%, #e9edf2 66%, ${tomDaCampanha} 88%, #e9edf2 100%)`,
                                                        backgroundClip: 'text',
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent',
                                                        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.75))',
                                                    }}
                                                >
                                                    {codex.title}
                                                </div>
                                            </div>

                                            <div className="px-2 pt-2 text-[10px] leading-[1.45] text-white/72">
                                                {codex.description || template.description}
                                            </div>

                                            <div className="mt-auto space-y-1.5 px-2 pb-2 pt-2.5">
                                                <div className="space-y-1">
                                                    {preview.arenas.slice(0, 3).map((arena) => {
                                                        const quantas = preview.actions.filter((action) => action.arenaId === arena.id).length;
                                                        return (
                                                            <div key={arena.id} className="flex items-center gap-1.5">
                                                                <span className="text-[11px] leading-none" aria-hidden>{arena.icon || '◇'}</span>
                                                                <span className="min-w-0 flex-1 truncate text-[9px] font-black uppercase tracking-[0.08em] text-white/62">
                                                                    {arena.name}
                                                                </span>
                                                                {quantas > 0 && (
                                                                    <span className="shrink-0 text-[9px] font-black tabular-nums text-white/34">{quantas}</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {preview.arenas.length > 3 && (
                                                        <div className="text-[8.5px] font-black uppercase tracking-[0.14em] text-white/28">
                                                            + {preview.arenas.length - 3} arenas
                                                        </div>
                                                    )}
                                                </div>

                                                <div
                                                    className="flex items-baseline gap-1 pt-1 text-[8.5px] font-black uppercase tracking-[0.14em] text-white/34"
                                                    style={{ borderTop: `1px solid ${tomDaCampanha}22` }}
                                                >
                                                    <span className="text-[11px] leading-none text-white/80">{codex.duration_days}</span>
                                                    <span>dias</span>
                                                    <span className="px-1 text-white/20">·</span>
                                                    <span className="text-[11px] leading-none text-white/80">{actionCount}</span>
                                                    <span>{actionCount === 1 ? 'ação' : 'ações'}</span>
                                                </div>
                                            </div>
                                        </button>

                                        {/* O selo do desconto: legivel, e dizendo de onde vem.
                                            Riscado dentro do botao ninguem lia; aqui a conta
                                            aparece inteira — quanto era, quanto e, e por que. */}
                                        {!isFree && !isOwned && !isInstalled && listPrice > goldPrice && (
                                            <div
                                                className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em]"
                                                style={{ background: `${tomDaCampanha}18`, color: `${tomDaCampanha}` }}
                                            >
                                                <span className="text-white/40 line-through">{listPrice}</span>
                                                <span>Platinum · −{Math.round((1 - goldPrice / listPrice) * 100)}%</span>
                                            </div>
                                        )}

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
                                                    aria-label={`Comprar campanha ${codex.title}`}
                                                    data-catalog-id={codex.id}
                                                    data-price={goldPrice}
                                                    onClick={() => handlePurchase(codex.id)}
                                                    disabled={!!purchasing}
                                                    className="luxe-skin-button inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-[10px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {/*
                                                      * NO BOTAO, SO O NUMERO E O OURO.
                                                      *
                                                      * Aqui vinha o preco de tabela riscado. Em 10px,
                                                      * branco a 45% e com um risco vermelho de 2px por
                                                      * cima, ele nao se lia como preco: virava um borrao
                                                      * de tres, dois ou um pontinho conforme a
                                                      * quantidade de digitos.
                                                      *
                                                      * O desconto NAO sumiu — ele e o beneficio do
                                                      * Platinum (20%), e esconde-lo no momento da compra
                                                      * seria o pior lugar possivel. Ele so saiu de
                                                      * dentro do botao, onde era ilegivel e roubava a
                                                      * largura do preco, e virou um selo proprio acima
                                                      * da faixa — onde cabe dizer de quanto e e de onde
                                                      * vem.
                                                      */}
                                                    {purchasing === codex.id ? '...' : isFree ? 'Gratis' : (
                                                        <>
                                                            <span>{goldPrice}</span>
                                                            <span aria-hidden>{'\u{1FA99}'}</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {/* A COMPRA POR FRAGMENTO SAIU DAQUI.

                                                Ela ja tinha mudado de lugar uma vez: morava na
                                                aba Forja e veio para ca, porque campanha nao e
                                                forja. O erro nao era o lugar — era existir.

                                                O mesmo cosmetico custa 15 de ouro ou 40 de
                                                fragmento na forja, o que fixa o cambio em ~2,7
                                                fragmentos por ouro — e ouro vale R$ 0,10. Nessa
                                                regua, um bau lendario dava ate R$ 18 de conteudo
                                                comprável e um duplicado tier 5 dava R$ 37, tudo
                                                de graca. A campanha, a 22 fragmentos, saia por
                                                R$ 0,81.

                                                Enquanto fragmento comprar o que dinheiro compra,
                                                qualquer taxa de cunhagem vira taxa de cambio, e
                                                o farm ganha sempre: e de graca, e o tempo da
                                                pessoa nao entra na conta dela.

                                                O corte e por natureza, e nao por preco. Fragmento
                                                fica sendo a moeda do "transformei o repetido em
                                                algo meu" — forja e reciclagem, fechada em si.
                                                Campanha e conteudo, e conteudo se paga em ouro ou
                                                vem no premium.

                                                O buyCodexWithFragments continua no contexto e a
                                                coluna price_fragments continua no catalogo: o que
                                                saiu foi o caminho, nao a capacidade. Se um dia a
                                                campanha voltar a ter preco em fragmento, que seja
                                                por decisao, e nao porque o botao nunca foi tirado. */}

                                            {/* O "VER" SAIU.
                                                O card inteiro ja abre o dossie ao toque — o botao
                                                repetia, ocupando um terco da faixa, a acao que a
                                                tela toda ja fazia, e espremia o preco, que e o
                                                unico ali que precisa de espaco. */}
                                        </div>
                                    </div>
                                </div>
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

