import React, { Suspense, lazy, useRef, useState } from 'react';
import { GlassCard } from './GlassCard';
import { LockIcon, UploadIcon } from './Icons';
import { Portal } from './Portal';
import { ProfileBackgroundSurface } from './ProfileBackgroundSurface';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../supabaseClient';
import { compressDataUrlToWebP } from '../utils/imageUtils';
import { hasPremiumAccess } from '../utils/premiumAccess';
import { PROFILE_BACKGROUND_OPTIONS, resolveProfileBackgroundValue } from '../utils/profileBackgrounds';

const ImageCropper = lazy(() =>
    import('./ImageCropper').then((module) => ({ default: module.ImageCropper }))
);

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const BUCKET_NAME = 'user-images';

interface BackgroundImageSelectionModalProps {
    currentBackground: string;
    onClose: () => void;
    onSelect: (backgroundValue: string) => void;
    options?: Array<{ id: string; name: string; value: string; isPremiumOnly?: boolean }>;
    title?: string;
    showUpload?: boolean;
    isPremiumUser?: boolean;
}

export const BackgroundImageSelectionModal: React.FC<BackgroundImageSelectionModalProps> = ({
    currentBackground,
    onClose,
    onSelect,
    options,
    title,
    showUpload,
    isPremiumUser: propIsPremium,
}) => {
    const { userProfile, showToast } = useGame();
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const isPremiumUser = propIsPremium ?? hasPremiumAccess(userProfile);
    const userFolder = userProfile.id && userProfile.id !== 'placeholder_user' ? userProfile.id : 'guest';

    const backgroundOptions = (options as any) ?? PROFILE_BACKGROUND_OPTIONS;
    const modalTitle = title ?? 'Selecionar Plano de Fundo';
    const allowUpload = showUpload ?? true;

    const handleSelect = (bg: { value: string; isPremiumOnly?: boolean }) => {
        if (bg.isPremiumOnly && !isPremiumUser) {
            showToast('Acesso negado. Recurso restrito a assinantes Premium.', 'error');
            return;
        }
        onSelect(resolveProfileBackgroundValue(bg.value));
    };

    const uploadDataUrl = async (dataUrl: string): Promise<string> => {
        let blobToUpload: Blob;
        let extension = 'webp';

        try {
            const webpDataUrl = await compressDataUrlToWebP(dataUrl, {
                maxWidth: 1800,
                maxHeight: 1800,
                quality: 0.84,
            });
            const response = await fetch(webpDataUrl);
            blobToUpload = await response.blob();
        } catch (error) {
            console.error('Background compression failed, falling back to original image.', error);
            const response = await fetch(dataUrl);
            blobToUpload = await response.blob();
            extension = blobToUpload.type.split('/')[1] || 'png';
        }

        if (blobToUpload.size > MAX_UPLOAD_BYTES) {
            throw new Error('Imagem muito grande. Limite de 2MB.');
        }

        const filePath = `profile-backgrounds/${userFolder}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, blobToUpload, {
            contentType: `image/${extension}`,
            cacheControl: '31536000',
            upsert: true,
        });

        if (error) {
            throw error;
        }

        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleFileUpload = () => {
        if (!isPremiumUser) {
            showToast('Acesso negado. Recurso restrito a assinantes Premium.', 'error');
            return;
        }
        if (!isUploading) fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Escolha uma imagem valida.', 'warning');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('Imagem muito grande. Tente uma menor.', 'warning');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageToCrop(reader.result as string);
            event.target.value = '';
        };
        reader.onerror = () => {
            showToast('Nao consegui ler a imagem.', 'error');
            event.target.value = '';
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedImageDataUrl: string) => {
        setIsUploading(true);
        try {
            const uploadedUrl = await uploadDataUrl(croppedImageDataUrl);
            onSelect(uploadedUrl);
            onClose();
        } catch (error) {
            console.error('Failed to upload profile background:', error);
            showToast(error instanceof Error ? error.message : 'Nao consegui enviar a imagem agora.', 'error');
        } finally {
            setIsUploading(false);
            setImageToCrop(null);
        }
    };

    if (imageToCrop) {
        return (
            <Suspense fallback={<div className="fixed inset-0 z-[10020] bg-black/70 backdrop-blur-sm" />}>
                <ImageCropper
                    imageSrc={imageToCrop}
                    cropShape="rect"
                    onCropComplete={handleCropComplete}
                    onClose={() => setImageToCrop(null)}
                />
            </Suspense>
        );
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-center">{modalTitle}</h2>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <div className="grid grid-cols-2 gap-2 p-2 max-h-64 overflow-y-auto">
                        {backgroundOptions.map(bg => {
                            const resolvedValue = resolveProfileBackgroundValue(bg.value);
                            const resolvedCurrent = resolveProfileBackgroundValue(currentBackground);
                            const isSelected = resolvedCurrent === resolvedValue;

                            return (
                                <div key={bg.id} className="text-center relative">
                                    <button
                                        onClick={() => handleSelect(bg)}
                                        className={`aspect-[16/9] w-full rounded-lg overflow-hidden transition-all duration-200 relative ${isSelected ? 'ring-4 ring-offset-2 ring-offset-gray-800 ring-white' : ''} ${bg.isPremiumOnly && !isPremiumUser ? 'opacity-80 grayscale-[0.5]' : ''}`}
                                    >
                                        <ProfileBackgroundSurface
                                            value={resolvedValue}
                                            className="w-full h-full object-cover"
                                            alt={bg.name}
                                        />
                                        {bg.isPremiumOnly && !isPremiumUser && (
                                            <div className="absolute top-1 right-1 bg-black/80 rounded-full w-5 h-5 flex items-center justify-center border border-yellow-500/50 shadow-lg">
                                                <LockIcon className="w-2.5 h-2.5 text-yellow-300" />
                                            </div>
                                        )}
                                    </button>
                                    <p className="text-xs mt-1 uppercase font-bold tracking-tighter opacity-70">{bg.name}</p>
                                </div>
                            );
                        })}
                        {allowUpload && (
                            <div className="text-center relative">
                                <button
                                    onClick={handleFileUpload}
                                    disabled={isUploading}
                                    className={`aspect-[16/9] w-full rounded-lg bg-black/30 border-2 border-dashed flex flex-col items-center justify-center transition-colors relative disabled:cursor-not-allowed disabled:opacity-60 ${!isPremiumUser ? 'border-yellow-500/30 text-yellow-500/50 grayscale-[0.5]' : 'border-gray-500 text-gray-400 hover:border-white hover:text-white'}`}
                                >
                                    <UploadIcon className="w-8 h-8" />
                                    <span className="mt-2 text-[10px] font-black uppercase tracking-[0.14em]">
                                        {isUploading ? 'Enviando...' : 'Sua imagem'}
                                    </span>
                                    {!isPremiumUser && (
                                        <div className="absolute top-1 right-1 bg-black/80 rounded-full w-5 h-5 flex items-center justify-center border border-yellow-500/50 shadow-lg">
                                            <LockIcon className="w-2.5 h-2.5 text-yellow-300" />
                                        </div>
                                    )}
                                </button>
                                <p className="text-xs mt-1 uppercase font-bold tracking-tighter opacity-70">UPLOAD</p>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="w-full py-2 rounded-xl luxe-skin-button">
                        FECHAR
                    </button>
                </GlassCard>
            </div>
        </Portal>
    );
};
