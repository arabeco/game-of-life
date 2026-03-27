import React, { Suspense, lazy, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../supabaseClient';
import { compressDataUrlToWebP } from '../utils/imageUtils';
import { ImageIcon, XIcon } from './Icons';

const ImageCropper = lazy(() =>
    import('./ImageCropper').then((module) => ({ default: module.ImageCropper }))
);

interface AssetArtButtonProps {
    assetId: string;
    assetName: string;
    currentUrl?: string;
    onSave: (url: string) => void;
    onRemove?: () => void;
    compact?: boolean;
    iconOnly?: boolean;
}

const MAX_BYTES = 2 * 1024 * 1024;
const BUCKET_NAME = 'user-images';

export const AssetArtButton: React.FC<AssetArtButtonProps> = ({
    assetId,
    assetName,
    currentUrl,
    onSave,
    onRemove,
    compact = false,
    iconOnly = false,
}) => {
    const { userProfile } = useGame();
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const userFolder = userProfile.id && userProfile.id !== 'placeholder_user' ? userProfile.id : 'guest';

    const uploadDataUrl = async (dataUrl: string): Promise<string> => {
        if (!(supabase as any)?.storage) return dataUrl;

        let blobToUpload: Blob;
        let extension = 'webp';

        try {
            const webpDataUrl = await compressDataUrlToWebP(dataUrl, {
                maxWidth: 1800,
                maxHeight: 1800,
                quality: 0.82,
            });
            const response = await fetch(webpDataUrl);
            blobToUpload = await response.blob();
        } catch (error) {
            console.error('Asset art compression failed, falling back to original image.', error);
            const response = await fetch(dataUrl);
            blobToUpload = await response.blob();
            extension = blobToUpload.type.split('/')[1] || 'png';
        }

        if (blobToUpload.size > MAX_BYTES) {
            alert('Imagem muito grande. Limite de 2MB.');
            return dataUrl;
        }

        const filePath = `asset-art/${userFolder}/${assetId}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, blobToUpload, {
            contentType: `image/${extension}`,
            cacheControl: '31536000',
            upsert: true,
        });

        if (error) {
            console.warn('Asset art upload failed, keeping local data URL fallback.', error);
            return dataUrl;
        }

        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        return data.publicUrl || dataUrl;
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_BYTES) {
            alert('Imagem muito grande. Limite de 2MB.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageToCrop(reader.result as string);
            event.target.value = '';
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedImageDataUrl: string) => {
        setIsUploading(true);
        try {
            const uploadedUrl = await uploadDataUrl(croppedImageDataUrl);
            onSave(uploadedUrl);
            setImageToCrop(null);
        } catch (error) {
            console.error('Failed to upload asset art:', error);
            onSave(croppedImageDataUrl);
            setImageToCrop(null);
        } finally {
            setIsUploading(false);
        }
    };

    const buttonClass = iconOnly
        ? 'inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-black/32 text-white/80 transition-colors hover:bg-white/10'
        : compact
        ? 'inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/28 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/82 transition-colors hover:bg-white/10'
        : 'inline-flex items-center gap-2 rounded-[18px] border border-white/15 bg-black/28 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/86 transition-colors hover:bg-white/10';

    return (
        <>
            <div className="flex flex-wrap items-center gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={buttonClass}
                    title={currentUrl ? `Editar imagem de ${assetName}` : `Adicionar imagem em ${assetName}`}
                >
                    <ImageIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                    {!iconOnly && (
                        <span>{isUploading ? 'Enviando...' : currentUrl ? 'Editar imagem' : 'Adicionar imagem'}</span>
                    )}
                </button>
                {currentUrl && onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/18 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/56 transition-colors hover:bg-white/10 hover:text-white"
                        title={`Remover arte de ${assetName}`}
                    >
                        <XIcon className="h-3.5 w-3.5" />
                        <span>Remover</span>
                    </button>
                )}
            </div>

            {imageToCrop && (
                <Suspense fallback={<div className="fixed inset-0 z-[10020] bg-black/70 backdrop-blur-sm" />}>
                    <ImageCropper
                        imageSrc={imageToCrop}
                        cropShape="rect"
                        onCropComplete={handleCropComplete}
                        onClose={() => setImageToCrop(null)}
                    />
                </Suspense>
            )}
        </>
    );
};
