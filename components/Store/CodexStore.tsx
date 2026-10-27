import { CapaDeFundoDaCampanha, capaDaCampanha } from '../CapaDaCampanha';
import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import '../campaign-plate.css';
import { CheckIcon, FilterIcon } from '../Icons';
import { EVENTO_CAMPANHA_NA_LOJA, esquecerCampanhaPendente, olharCampanhaPendente } from '../../utils/campanhaNaLoja';
import { CampaignsCodex } from '../CampaignsCodex';
import { ConfirmationModal } from '../ConfirmationModal';
import { buildCodexCampaignPreview, type CodexCampaignPreview } from '../../utils/codexPreview';
import { getCampaignPriceForProfile } from '../../utils/premiumAccess';
import { ASSET_ACCENT_COLORS } from '../../constants/assetVisuals';

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
import { gradienteMetalico, tintaMetalicaCom } from '../MetalReportCard';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAssetId, setSelectedAssetId] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<'all' | CampaignCategoryId>('all');
    const [areFiltersOpen, setFiltersOpen] = useState(false);


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
                showToast('Campanha adicionada à biblioteca. Instale quando quiser.', 'success');
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
                coverVisual: capaDaCampanha(codex.id, codex.cover_image || template.coverImage),
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

    // O quiz saiu da loja (13/10/2026): busca de campanha agora mora no Oraculo, aba Missao.
    // Quando ele recomenda, "Ver na loja" chega aqui e abre a ficha da campanha.
    useEffect(() => {
        const abrirPendente = () => {
            const catalogId = olharCampanhaPendente();
            if (!catalogId) return;
            const entrada = catalogEntries.find((entry) => entry.codex.id === catalogId);
            if (!entrada) return; // o catalogo ainda vai chegar; tenta de novo quando chegar
            esquecerCampanhaPendente();
            setCampaignPreview(entrada.preview);
        };
        abrirPendente();
        window.addEventListener(EVENTO_CAMPANHA_NA_LOJA, abrirPendente);
        return () => window.removeEventListener(EVENTO_CAMPANHA_NA_LOJA, abrirPendente);
    }, [catalogEntries]);

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
        () => new Set(allArenas.filter(arena => !arena.isArchived).map((arena) => arena.originCodexId).filter(Boolean)),
        [allArenas],
    );

    return (
        <>
            <div className="campaign-store space-y-3 animate-fade-in pb-8">
                {/* O titulo "CAMPANHAS" e a faixa do quiz sairam daqui.
                    O titulo nomeava a tela com a aba "Campanhas" ja selecionada
                    logo acima, e o quiz era um botao de largura inteira com rotulo,
                    icone e selo de status — 52px so para oferecer uma ajuda opcional,
                    antes de qualquer campanha aparecer. Os dois empurravam o conteudo
                    para fora da primeira dobra.

                    O quiz virou um botao quadrado na mesma faixa da busca e do filtro:
                    continua ao alcance, sem cobrar a abertura da tela. */}
                <div className="overflow-hidden border-white/10 p-3">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Buscar campanha, palavra-chave ou ativo..."
                                className="w-full rounded-sm border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-[var(--skin-accent-color)]/35"
                            />
                            <div className="rounded-sm border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
                                {filteredEntries.length}
                            </div>
                            <button
                                type="button"
                                onClick={() => setFiltersOpen((current) => !current)}
                                className={`relative inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-sm border transition-all ${areFiltersOpen || activeFilterCount > 0 ? 'border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/10 text-[var(--ui-text-accent)]' : 'border-white/10 bg-white/5 text-white/78 hover:border-[var(--skin-accent-color)]/35 hover:bg-white/10 hover:text-white'}`}
                                aria-expanded={areFiltersOpen}
                                aria-label="Filtros"
                                title="Filtros"
                            >
                                <FilterIcon className="h-4 w-4" />
                                {/* O numero de filtros ativos vira marcador no canto: a
                                    palavra "Filtros · 2" so cabia porque o botao era
                                    largo, e era o botao largo o problema. */}
                                {activeFilterCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-sm bg-[var(--skin-accent-color)] px-1 text-[9px] font-black leading-none text-black">
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
                            <div className="space-y-3 rounded-sm border border-white/10 bg-black/20 p-3">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Ativo principal</div>
                                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAssetId('all')}
                                            className={`rounded-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-all ${selectedAssetId === 'all' ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                                        >
                                            Todos
                                        </button>
                                        {availableAssetFilters.map((asset) => (
                                            <button
                                                key={asset.id}
                                                type="button"
                                                onClick={() => setSelectedAssetId(asset.id)}
                                                className={`rounded-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-all ${selectedAssetId === asset.id ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
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
                                            className={`rounded-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                                        >
                                            Todas
                                        </button>

                                        {TYPE_CATEGORY_ORDER.map((categoryId) => (
                                            <button
                                                key={categoryId}
                                                type="button"
                                                onClick={() => setSelectedCategory(categoryId)}
                                                className={`rounded-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-all ${selectedCategory === categoryId ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                                            >
                                                {CATEGORY_LABELS[categoryId]}
                                            </button>
                                        ))}

                                        <span className="my-1 w-px shrink-0 rounded-sm bg-white/10" aria-hidden="true" />

                                        {THEME_CATEGORY_ORDER.map((categoryId) => (
                                            <button
                                                key={categoryId}
                                                type="button"
                                                onClick={() => setSelectedCategory(categoryId)}
                                                className={`rounded-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-all ${selectedCategory === categoryId ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                                            >
                                                {CATEGORY_LABELS[categoryId]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {filteredEntries.length > 0 ? (
                    <div className="campaign-store-grid grid grid-cols-2 gap-3">
                        {filteredEntries.map(({ codex, template, preview, coverVisual, actionCount, goldPrice, listPrice, isFree }) => {
                            // A loja vende uma campanha como item de catálogo. A composição
                            // compacta com arenas pertence somente à ArenaView, depois da instalação.
                            const arenaComCor = preview.arenas.find((arena) => arena.assetId && ASSET_ACCENT_COLORS[arena.assetId as keyof typeof ASSET_ACCENT_COLORS]);
                            const tomDaCampanha = (arenaComCor?.assetId && ASSET_ACCENT_COLORS[arenaComCor.assetId as keyof typeof ASSET_ACCENT_COLORS]) || '#687380';
                            const ownedCodex = userCodexes.find((userCodex) => userCodex.catalog_id === codex.id || userCodex.name === codex.title) || null;
                            const isOwned = Boolean(ownedCodex);
                            const isInstalled = Boolean(ownedCodex && installedCodexIds.has(ownedCodex.id));

                            return (
                                <div
                                    key={codex.id}
                                    className="campaign-store-card relative flex flex-col gap-2 p-2"
                                    style={{ '--campaign-accent': tomDaCampanha } as React.CSSProperties}
                                >
                                    {/* Capa (27/10/2026): a imagem e o fundo do card, sob um veu escuro.
                                        Sem imagem, fica o tom da campanha. O emoji saiu: arena e acao ja tem o deles. */}
                                    <CapaDeFundoDaCampanha cover={coverVisual} tom={tomDaCampanha} />
                                    <div className="relative z-10 flex h-full flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCampaignPreview(preview)}
                                            className="campaign-store-preview flex flex-1 flex-col text-left"
                                        >
                                            <div className="flex items-start gap-2 px-1 pt-1">
                                                <div className="min-w-0 flex-1 pt-0.5">
                                                    <div className="campaign-store-title line-clamp-2">{codex.title}</div>
                                                    <div className="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-white/42">
                                                        Campanha
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="line-clamp-2 px-1 pt-2 text-[10px] leading-snug text-white/58">
                                                {codex.description || template.description}
                                            </div>

                                            <div className="campaign-store-meta mt-auto flex flex-wrap gap-x-1.5 gap-y-0.5 px-1 pb-1 pt-2 text-[8px] font-black uppercase tracking-[0.11em] text-white/42">
                                                <span>{codex.duration_days} {codex.duration_days === 1 ? 'dia' : 'dias'}</span>
                                                <span aria-hidden>•</span>
                                                <span>{preview.arenas.length} {preview.arenas.length === 1 ? 'arena' : 'arenas'}</span>
                                                <span aria-hidden>•</span>
                                                <span>{actionCount} {actionCount === 1 ? 'ação' : 'ações'}</span>
                                            </div>
                                        </button>

                                        {/* O selo do desconto: legivel, e dizendo de onde vem.
                                            Riscado dentro do botao ninguem lia; aqui a conta
                                            aparece inteira — quanto era, quanto e, e por que. */}
                                        {!isFree && !isOwned && !isInstalled && listPrice > goldPrice && (
                                            <div
                                                className="campaign-store-discount flex items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[7px] font-black uppercase tracking-[0.1em]"
                                                style={{ background: `${tomDaCampanha}18`, color: `${tomDaCampanha}` }}
                                            >
                                                <span className="text-white/40 line-through">{listPrice}</span>
                                                <span>Platinum · −{Math.round((1 - goldPrice / listPrice) * 100)}%</span>
                                            </div>
                                        )}

                                        <div className="border-t border-white/6 pt-2">
                                            {isInstalled ? (
                                                <div className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-xl border border-green-500/30 bg-green-500/12 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-green-400">
                                                    <CheckIcon className="h-3 w-3" />
                                                    No app
                                                </div>
                                            ) : isOwned && ownedCodex ? (
                                                <button
                                                    type="button"
                                                    onClick={() => { void installCodex(ownedCodex.id); }}
                                                    disabled={purchasing === codex.id}
                                                    className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/82 transition-all hover:border-[var(--skin-accent-color)]/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
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
                                                    className="luxe-skin-button inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-xl px-2 text-[10px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
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
                                                            {listPrice > goldPrice && (
                                                                <span
                                                                    className="rounded-[5px] px-1 py-[1px] text-[8px] leading-none tracking-[0.1em]"
                                                                    style={{ background: 'rgba(0,0,0,0.34)', color: tomDaCampanha }}
                                                                >
                                                                    {'−'}{Math.round((1 - goldPrice / listPrice) * 100)}%
                                                                </span>
                                                            )}
                                                            <span className="text-[13px] leading-none tabular-nums">{goldPrice}</span>
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
                    <div className="border-dashed border-white/10 px-4 py-12 text-center">
                        <div className="text-sm font-semibold text-white/80">Nenhuma campanha encontrada.</div>
                        <div className="mt-1 text-xs text-white/45">Tente mudar o filtro, a aba ou a busca.</div>
                    </div>
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
                            : 'Ao adquirir, fica na biblioteca para instalar quando quiser.',
                        hideArenaDetails: true,
                    }}
                />
            )}
            {pendingPurchase && (
                <ConfirmationModal
                    title="Confirmar campanha"
                    message={pendingPurchase.goldPrice <= 0
                        ? `${pendingPurchase.title} vai entrar nas suas campanhas sem custo para instalar quando quiser. Deseja continuar?`
                        : `${pendingPurchase.title} vai debitar ${pendingPurchase.goldPrice} ouro, entrar nas suas campanhas para instalar quando quiser. Deseja continuar?`}
                    confirmLabel={pendingPurchase.goldPrice <= 0 ? 'ADICIONAR' : `COMPRAR - ${pendingPurchase.goldPrice} OURO`}
                    onConfirm={() => { void handleConfirmPurchase(); }}
                    onCancel={() => setPendingPurchase(null)}
                />
            )}
        </>
    );
};

