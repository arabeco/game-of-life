import React from 'react';
import { Asset } from '../types';
import { AssetArenaBoard } from './AssetArenaBoard';

interface AssetDossierProps {
    asset: Asset;
    onBack?: () => void;
    embedded?: boolean;
    showArenas?: boolean;
    showHeader?: boolean;
    showLevelPanel?: boolean;
    showEditButton?: boolean;
    isEditingOverride?: boolean;
    onToggleEditing?: () => void;
}

// Legacy wrapper kept only for compatibility with older flows.
// The active product surface is now arenas-first.
export const AssetDossier: React.FC<AssetDossierProps> = ({
    asset,
    showArenas = true,
    showHeader = true,
    showLevelPanel = true,
}) => (
    <div className="space-y-3">
        {showHeader && (
            <div className="text-center">
                <p className="luxe-title-ornate text-lg font-black uppercase tracking-[0.18em] text-[var(--ui-card-text)]">
                    {asset.name}
                </p>
            </div>
        )}

        {showLevelPanel && (
            <div className="rounded-[22px] border border-white/10 bg-black/24 px-4 py-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Nível atual</p>
                <p className="mt-1 text-3xl font-black text-white">{asset.level}</p>
            </div>
        )}

        {showArenas ? (
            <AssetArenaBoard asset={asset} />
        ) : (
            <div className="rounded-[22px] border border-white/10 bg-black/24 px-4 py-6 text-center text-sm text-white/55">
                Este dossiê agora prioriza arenas e progresso do ativo.
            </div>
        )}
    </div>
);
