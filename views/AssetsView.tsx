import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Asset } from '../types';
import { AssetDossier } from '../components/AssetDossier';
import { AssetArenaBoard } from '../components/AssetArenaBoard';
import { Sephirot } from '../components/Sephirot';
import { SKINS_DATA } from '../constants';
import { SephirotFog } from '../components/SephirotFog';

const SEPHIROT_COORDS = [
    { id: 'consciencia', x: 50, y: 7 },
    { id: 'espaco-mental', x: 16.66, y: 21.5 },
    { id: 'espiritualidade', x: 83.33, y: 21.5 },
    { id: 'proposito', x: 16.66, y: 35.5 },
    { id: 'projetos', x: 83.33, y: 35.5 },
    { id: 'conexoes', x: 50, y: 49.5 },
    { id: 'trabalho', x: 16.66, y: 64.5 },
    { id: 'financas', x: 83.33, y: 64.5 },
    { id: 'hobbies', x: 50, y: 78.5 },
    { id: 'fisico', x: 50, y: 93 },
];

type AssetSubview = 'arenas' | 'widgets';

const SegmentedButton: React.FC<{
    active: boolean;
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
}> = ({ active, icon, title, onClick }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        className={`rounded-full px-2.5 py-1.5 text-[10px] font-black transition-all ${
            active
                ? 'bg-[var(--skin-accent-color)] text-black shadow-[0_6px_16px_rgba(0,0,0,0.22)]'
                : 'bg-white/5 text-white/55 hover:bg-white/10'
        }`}
    >
        <span aria-hidden="true" className="inline-flex h-3.5 w-3.5 items-center justify-center">
            {icon}
        </span>
    </button>
);

export const AssetsView: React.FC = () => {
    const { assets, userProfile, appMode } = useGame();
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [assetSubview, setAssetSubview] = useState<AssetSubview>('arenas');
    const [isWidgetEditing, setIsWidgetEditing] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const isBasicMode = appMode === 'BASIC';
    const selectedAsset = assets.find(a => a.id === selectedAssetId) || null;

    const skinColor = SKINS_DATA.find(s => s.id === userProfile.skin)?.color || '#d4af37';
    const baseAspect = 9 / 16;
    const containerAspect = containerSize.width > 0 && containerSize.height > 0
        ? containerSize.width / containerSize.height
        : baseAspect;
    const stretchY = containerAspect < baseAspect ? baseAspect / containerAspect : 1;

    const fogPoints = useMemo(() => {
        const assetById = new Map<string, Asset>(assets.map(asset => [asset.id, asset]));

        return SEPHIROT_COORDS.map(coord => {
            const yNorm = coord.y / 100;
            const yStretched = Math.min(1, Math.max(0, (yNorm - 0.5) * stretchY + 0.5));
            const asset = assetById.get(coord.id);
            return {
                x: coord.x,
                y: yStretched * 100,
                level: asset ? asset.level : 1,
            };
        });
    }, [assets, stretchY]);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateSize = () => {
            const rect = container.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
        };

        updateSize();

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => updateSize());
            observer.observe(container);
            return () => observer.disconnect();
        }

        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const handleOpenAsset = (asset: Asset) => {
        setSelectedAssetId(asset.id);
        setAssetSubview('arenas');
        setIsWidgetEditing(false);
    };

    const handleBack = () => {
        setSelectedAssetId(null);
        setAssetSubview('arenas');
        setIsWidgetEditing(false);
    };

    const handleSubviewChange = (view: AssetSubview) => {
        setAssetSubview(view);
        if (view !== 'widgets') {
            setIsWidgetEditing(false);
        }
    };

    if (selectedAsset) {
        return (
            <div className="h-full overflow-y-auto px-4 pb-4">
                <div className="mx-auto max-w-[520px]">
                    <div className="dossier-bg flex flex-col overflow-hidden rounded-[28px] border border-[color:var(--skin-accent-color)] px-4 pb-4 pt-4 shadow-2xl shadow-black/50">
                        <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
                            {!isBasicMode && assetSubview === 'widgets' ? (
                                <button
                                    type="button"
                                    onClick={() => setIsWidgetEditing((value) => !value)}
                                    className={`justify-self-start rounded-full border border-white/20 p-1.5 transition-colors ${isWidgetEditing ? 'bg-[var(--skin-accent-color)]/20 border-[var(--skin-accent-color)]/40' : 'bg-transparent'}`}
                                    title="Editar widgets"
                                >
                                    <svg className={`h-4 w-4 ${isWidgetEditing ? 'text-white' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                                    </svg>
                                </button>
                            ) : (
                                <div className="h-8 w-8 justify-self-start" />
                            )}

                            {!isBasicMode ? (
                                <div className="mt-0.5 flex items-center justify-self-center gap-1 rounded-full border border-white/10 bg-black/20 p-1">
                                    <SegmentedButton
                                        active={assetSubview === 'arenas'}
                                        icon="▥"
                                        title="Arenas"
                                        onClick={() => handleSubviewChange('arenas')}
                                    />
                                    <SegmentedButton
                                        active={assetSubview === 'widgets'}
                                        icon="◫"
                                        title="Widgets"
                                        onClick={() => handleSubviewChange('widgets')}
                                    />
                                </div>
                            ) : (
                                <div className="justify-self-center" />
                            )}

                            <button
                                type="button"
                                onClick={handleBack}
                                className="justify-self-end px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] rounded-lg luxe-skin-button"
                            >
                                OK
                            </button>
                        </div>

                        <div className="min-w-0 pb-3 pt-2 text-center">
                            <p className="luxe-title-ornate truncate px-6 text-lg font-black uppercase tracking-[0.18em] text-[color:var(--skin-accent-color)] luxe-title-shadow">
                                {selectedAsset.name}
                            </p>
                        </div>

                        <div className="overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                            {isBasicMode || assetSubview === 'arenas' ? (
                                <div className="space-y-2">
                                    <div className="pt-0 text-center">
                                        <p className="text-xs font-medium tracking-[0.08em] text-white/62">Nivel {selectedAsset.level}</p>
                                    </div>
                                    <AssetArenaBoard asset={selectedAsset} />
                                </div>
                            ) : (
                                <AssetDossier
                                    asset={selectedAsset}
                                    onBack={handleBack}
                                    embedded
                                    showArenas={false}
                                    showHeader={false}
                                    showLevelPanel
                                    showEditButton={false}
                                    isEditingOverride={isWidgetEditing}
                                    onToggleEditing={() => setIsWidgetEditing((value) => !value)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative flex h-full items-center justify-center overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_30%),linear-gradient(180deg,#070707_0%,#020202_100%)]"
            style={{ height: 'calc(100vh - 80px - var(--safe-area-top) - 64px - var(--safe-area-bottom))' }}
        >
            {!isBasicMode && (
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black" />
                    <SephirotFog
                        points={fogPoints}
                        color={skinColor}
                        mode="sephirot"
                    />
                </div>
            )}

            <div className="relative z-10 h-full w-full">
                <div id="assets-grid" className="relative h-full w-full">
                    {SEPHIROT_COORDS.map(coord => {
                        const asset = assets.find(a => a.id === coord.id);
                        if (!asset) return null;

                        const yNorm = coord.y / 100;
                        const yStretched = Math.min(1, Math.max(0, (yNorm - 0.5) * stretchY + 0.5));

                        return (
                            <div
                                key={asset.id}
                                className="absolute flex items-center justify-center"
                                style={{
                                    left: `${coord.x}%`,
                                    top: `${yStretched * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                <Sephirot asset={asset} onClick={() => handleOpenAsset(asset)} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
