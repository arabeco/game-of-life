import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { hasPremiumAccess } from '../utils/premiumAccess';
import { getProfileBackgroundPrimarySource } from '../utils/profileBackgrounds';
import { ImageIcon, XIcon } from './Icons';
import { BackgroundImageSelectionModal } from './BackgroundImageSelectionModal';

interface AssetArtButtonProps {
    assetId: string;
    assetName: string;
    currentUrl?: string;
    onSave: (url: string) => void;
    onRemove?: () => void;
    compact?: boolean;
    iconOnly?: boolean;
}

export const AssetArtButton: React.FC<AssetArtButtonProps> = ({
    assetId,
    assetName,
    currentUrl,
    onSave,
    onRemove,
    compact = false,
    iconOnly = false,
}) => {
    const { userProfile, showToast } = useGame();
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const canEditAssetBackground = hasPremiumAccess(userProfile);
    void assetId;

    const handleOpenPicker = () => {
        if (!canEditAssetBackground) {
            showToast('Recurso do Premium. Fundos de ativos liberam a partir do Premium.', 'info');
            return;
        }

        setIsPickerOpen(true);
    };

    const handleSelect = (nextValue: string) => {
        onSave(getProfileBackgroundPrimarySource(nextValue));
        setIsPickerOpen(false);
    };

    const buttonClass = iconOnly
        ? 'inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-black/32 text-white/80 transition-colors hover:bg-white/10'
        : compact
        ? 'inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/28 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/82 transition-colors hover:bg-white/10'
        : 'inline-flex items-center gap-2 rounded-[18px] border border-white/15 bg-black/28 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/86 transition-colors hover:bg-white/10';

    return (
        <>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={handleOpenPicker}
                    className={buttonClass}
                    title={currentUrl ? `Editar fundo de ${assetName}` : `Escolher fundo para ${assetName}`}
                >
                    <ImageIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                    {!iconOnly && (
                        <span>{currentUrl ? 'Editar fundo' : 'Escolher fundo'}</span>
                    )}
                </button>
                {currentUrl && onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/18 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/56 transition-colors hover:bg-white/10 hover:text-white"
                        title={`Remover fundo de ${assetName}`}
                    >
                        <XIcon className="h-3.5 w-3.5" />
                        <span>Remover</span>
                    </button>
                )}
            </div>

            {isPickerOpen && (
                <BackgroundImageSelectionModal
                    currentBackground={currentUrl || ''}
                    onSelect={handleSelect}
                    onClose={() => setIsPickerOpen(false)}
                    title={`Fundo de ${assetName}`}
                />
            )}
        </>
    );
};
