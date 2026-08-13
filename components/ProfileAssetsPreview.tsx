import React, { useMemo, useState } from 'react';
import { Asset, Slot, SlotValue } from '../types';
import { AssetArenaBoard } from './AssetArenaBoard';
import { ASSET_ACCENT_COLORS, DEFAULT_ASSET_ART_BY_ID } from '../constants/assetVisuals';
import { LIFE_AREAS } from '../constants/lifeAreas';
import { getProfileBackgroundPrimarySource, isCssProfileBackground } from '../utils/profileBackgrounds';

const hexToRgb = (hex: string): [number, number, number] | null => {
    const normalized = hex.replace('#', '').trim();
    if (normalized.length !== 6) return null;
    const value = Number.parseInt(normalized, 16);
    if (Number.isNaN(value)) return null;
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbaString = (rgb: [number, number, number] | null, alpha: number): string =>
    rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : `rgba(212, 175, 55, ${alpha})`;

const escapeCssUrl = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const buildAssetArtLayer = (value?: string): string | null => {
    const normalized = (value || '').trim();
    if (!normalized) return null;

    const primarySource = getProfileBackgroundPrimarySource(normalized).trim();
    if (!primarySource) return null;

    return isCssProfileBackground(primarySource)
        ? primarySource
        : `url("${escapeCssUrl(primarySource)}")`;
};

const getDefaultAssetArt = (assetId: string): string | undefined =>
    DEFAULT_ASSET_ART_BY_ID[assetId as keyof typeof DEFAULT_ASSET_ART_BY_ID];

const isSlotValueEmpty = (value: SlotValue | undefined): boolean => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized.length === 0 || normalized === 'nao definido' || normalized === 'não definido';
    }
    if (typeof value === 'number') return false;
    return !value.imageUrl?.trim();
};

const getPrimaryAssetSlot = (asset: Asset, assetWidgetValues: Partial<Record<string, SlotValue>>): Slot | null => {
    const baseSlot = asset.slots?.[0];
    if (!baseSlot) return null;
    const storedValue = assetWidgetValues[asset.id];
    return {
        ...baseSlot,
        value: storedValue !== undefined ? storedValue : baseSlot.value,
    };
};

export const ProfileAssetsPreview: React.FC<{
    assets: Asset[];
    skinId?: string;
    assetArtById?: Partial<Record<string, string>>;
    assetWidgetValues?: Partial<Record<string, SlotValue>>;
    visibleWidgetAssetIds?: string[];
    showArenaBoards?: boolean;
    onClose: () => void;
}> = ({
    assets,
    skinId = 'BASIC',
    assetArtById = {},
    assetWidgetValues = {},
    visibleWidgetAssetIds = [],
    showArenaBoards = true,
    onClose,
}) => {
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

    const selectedAsset = useMemo(
        () => assets.find((asset) => asset.id === selectedAssetId) || null,
        [assets, selectedAssetId]
    );

    const selectedAssetAccent = selectedAsset
        ? ASSET_ACCENT_COLORS[selectedAsset.id as keyof typeof ASSET_ACCENT_COLORS] || '#4b5563'
        : '#4b5563';
    const selectedAssetLevel = selectedAsset ? Math.max(1, Number(selectedAsset.level || 1)) : 1;
    const selectedAssetMasteryPhrase = selectedAsset?.levelDescriptions?.[selectedAssetLevel] || '';
    const selectedAssetAccentRgb = hexToRgb(selectedAssetAccent);
    const selectedAssetArtUrl = selectedAsset
        ? assetArtById[selectedAsset.id] || getDefaultAssetArt(selectedAsset.id)
        : undefined;
    const selectedAssetArtLayer = buildAssetArtLayer(selectedAssetArtUrl);
    const selectedAssetPrimarySlot = selectedAsset
        ? getPrimaryAssetSlot(selectedAsset, assetWidgetValues)
        : null;
    const canShowSelectedAssetWidget = !!(
        selectedAsset &&
        selectedAssetPrimarySlot &&
        visibleWidgetAssetIds.includes(selectedAsset.id) &&
        !isSlotValueEmpty(selectedAssetPrimarySlot.value)
    );
    const selectedAssetShellStyle: React.CSSProperties = {
        backgroundImage: `radial-gradient(circle at 16% 0%, rgba(255,246,204,0.26), transparent 29%),
            radial-gradient(circle at 24% 22%, rgba(226,192,98,0.16), transparent 25%),
            radial-gradient(circle at 92% 88%, ${rgbaString(selectedAssetAccentRgb, 0.14)}, transparent 24%),
            linear-gradient(135deg, rgba(224,186,84,0.24) 0%, rgba(255,250,230,0.06) 18%, rgba(8,8,8,0.94) 46%, rgba(2,2,2,0.98) 66%, ${rgbaString(selectedAssetAccentRgb, 0.08)} 100%)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 48px rgba(0,0,0,0.42)',
    };
    const selectedAssetCanvasStyle: React.CSSProperties = {
        backgroundImage: `${selectedAssetArtLayer ? `linear-gradient(180deg, rgba(5,5,7,0.18) 0%, rgba(5,5,7,0.78) 46%, rgba(5,5,7,0.94) 100%), ${selectedAssetArtLayer}, ` : ''}radial-gradient(circle at 16% 0%, rgba(255,246,204,0.28), transparent 29%),
            radial-gradient(circle at 92% 88%, ${rgbaString(selectedAssetAccentRgb, 0.16)}, transparent 24%),
            linear-gradient(180deg, rgba(9,11,16,0.9) 0%, rgba(5,6,9,0.96) 100%)`,
        backgroundSize: selectedAssetArtLayer ? 'cover, cover, auto, auto' : undefined,
        backgroundPosition: selectedAssetArtLayer ? 'center, center, center, center' : undefined,
        backgroundRepeat: selectedAssetArtLayer ? 'no-repeat, no-repeat, no-repeat, no-repeat' : undefined,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -40px 90px rgba(0,0,0,0.2)',
    };

    if (selectedAsset) {
        return (
            <div data-skin={skinId} className="flex h-full flex-col">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-1 pb-3">
                    <button
                        type="button"
                        onClick={() => setSelectedAssetId(null)}
                        className="rounded-xl border border-white/10 bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/78 transition-colors hover:bg-white/10"
                    >
                        Voltar
                    </button>
                    <div className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                        Painel do ativo
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] luxe-skin-button"
                    >
                        OK
                    </button>
                </div>

                <div className="mt-3 flex-1 overflow-y-auto">
                    <div
                        className="dossier-bg relative flex flex-col overflow-hidden rounded-[28px] border border-[color:var(--skin-accent-color)] px-4 pb-4 pt-4 shadow-2xl shadow-black/50"
                        style={selectedAssetShellStyle}
                    >
                        <div
                            className="modal-aura-overlay"
                            style={{ '--modal-aura-color': 'rgba(229, 191, 88, 0.16)' } as React.CSSProperties}
                        />
                        <div
                            className="modal-sheen-overlay"
                            style={{ '--modal-sheen-color': 'rgba(255, 222, 120, 0.82)', zIndex: 24 } as React.CSSProperties}
                        />
                        <div className="relative z-10">
                            <div
                                className="mt-3 overflow-hidden rounded-[24px] border border-white/10"
                                style={selectedAssetCanvasStyle}
                            >
                                <div className="space-y-2 px-1 pb-1 pt-4">
                                    <div className="text-center">
                                        <p className="luxe-title-ornate truncate px-5 text-lg font-black uppercase tracking-[0.18em] luxe-title-shadow text-[var(--ui-card-text)]">
                                            {selectedAsset.name}
                                        </p>
                                    </div>

                                    <div className="mx-3 rounded-[20px] border border-white/10 bg-black/34 px-3 py-3 backdrop-blur-sm">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-base font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.24)]"
                                                style={{
                                                    borderColor: rgbaString(selectedAssetAccentRgb, 0.34),
                                                    background: `linear-gradient(135deg, ${rgbaString(selectedAssetAccentRgb, 0.32)} 0%, rgba(10,12,16,0.92) 100%)`,
                                                }}
                                            >
                                                {selectedAssetLevel}
                                            </div>
                                            <div className="min-w-0 text-left">
                                                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/42">
                                                    Maestria atual
                                                </p>
                                                <p className="mt-1 text-[12px] font-semibold leading-snug text-white/86">
                                                    {selectedAssetMasteryPhrase || 'Essa area ainda nao tem uma frase de maestria definida.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {canShowSelectedAssetWidget && selectedAssetPrimarySlot && (
                                        <div className="mx-3 rounded-[20px] border border-white/10 bg-black/30 px-4 py-4 backdrop-blur-sm">
                                            <p className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-white/84">
                                                {selectedAssetPrimarySlot.label}
                                            </p>
                                            <div className="mt-3 flex min-h-[3.1rem] items-center justify-center rounded-xl border border-[color:var(--skin-accent-color)] bg-black/42 px-3 py-2 text-center">
                                                <p className="line-clamp-3 text-sm font-semibold text-white">
                                                    {String(selectedAssetPrimarySlot.value)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {showArenaBoards ? (
                                        <div className={canShowSelectedAssetWidget ? 'pt-1' : ''}>
                                            <AssetArenaBoard asset={selectedAsset} showArchived={false} interactive={false} />
                                        </div>
                                    ) : canShowSelectedAssetWidget ? null : (
                                        <div className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-6 text-center text-sm text-white/58">
                                            Este ativo nao expõe detalhes neste perfil.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div data-skin={skinId} className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-1 pb-3">
                <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/72">
                    Ativos
                </div>
                <div className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                    Mapa de ativos
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] luxe-skin-button"
                >
                    OK
                </button>
            </div>

            <div className="mt-3 grid min-h-0 flex-1 grid-rows-5 gap-2 overflow-hidden rounded-lg bg-black/45 p-2">
                {LIFE_AREAS.map((area) => {
                    const asset = assets.find((item) => item.id === area.id);
                    if (!asset) return null;
                    const assetArtLayer = buildAssetArtLayer(assetArtById[asset.id] || getDefaultAssetArt(asset.id));
                    const accentRgb = hexToRgb(area.color);
                    const activeArenas = asset.arenas.filter((arena) => !arena.isArchived).length;
                    const totalActions = asset.arenas.reduce((sum, arena) => sum + (arena.actionIds?.length || 0), 0);

                    return (
                        <button
                            key={asset.id}
                            type="button"
                            onClick={() => setSelectedAssetId(asset.id)}
                            className="grid min-h-0 grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-lg border px-3 text-left transition-transform hover:-translate-y-px"
                            style={{
                                borderColor: rgbaString(accentRgb, 0.45),
                                backgroundImage: `${assetArtLayer ? `linear-gradient(90deg, rgba(5,6,9,0.42), rgba(5,6,9,0.8)), ${assetArtLayer}, ` : ''}linear-gradient(105deg, ${rgbaString(accentRgb, 0.42)} 0%, ${rgbaString(accentRgb, 0.16)} 48%, rgba(7,9,13,0.94) 100%)`,
                                backgroundSize: assetArtLayer ? 'cover, cover, auto' : undefined,
                                backgroundPosition: 'center',
                                boxShadow: `inset 4px 0 0 ${rgbaString(accentRgb, 0.8)}, inset 0 1px 0 rgba(255,255,255,0.08)`,
                            }}
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-xl">
                                {area.icon}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-[10px] font-black uppercase tracking-[0.08em] text-white">{area.name}</span>
                                <span className="mt-0.5 block truncate text-[9px] text-white/55">{area.description}</span>
                            </span>
                            <span className="text-right text-[9px] font-bold uppercase text-white/68">
                                <span className="block text-sm font-black text-white">{Math.max(1, asset.level || 1)}</span>
                                <span>{activeArenas} arenas · {totalActions} ações</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
