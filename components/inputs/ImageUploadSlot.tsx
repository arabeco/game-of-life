
import React, { Suspense, lazy, useState } from 'react';
import { SlotValueImage } from '../../types';
import { UploadIcon } from '../Icons';
import { useGame } from '../../contexts/GameContext';
import { supabase } from '../../supabaseClient';
import { compressDataUrlToWebP } from '../../utils/imageUtils';

const ImageCropper = lazy(() =>
    import('../ImageCropper').then((module) => ({ default: module.ImageCropper }))
);

interface ImageUploadSlotProps {
    value: SlotValueImage;
    onChange: (value: SlotValueImage) => void;
}

export const ImageUploadSlot: React.FC<ImageUploadSlotProps> = ({ value, onChange }) => {
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { userProfile } = useGame();
    const maxBytes = 2 * 1024 * 1024;
    const bucketName = 'user-images';
    const userFolder = userProfile.id && userProfile.id !== 'placeholder_user' ? userProfile.id : 'guest';

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > maxBytes) {
                alert('Imagem muito grande. Limite de 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageToCrop(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadDataUrl = async (dataUrl: string, pathPrefix: string) => {
        if (!(supabase as any)?.storage) return dataUrl;

        let blobToUpload: Blob;
        let extension = 'webp';

        try {
            // Convert DataUrl to WebP data url then to blob
            const webpDataUrl = await compressDataUrlToWebP(dataUrl, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
            const response = await fetch(webpDataUrl);
            blobToUpload = await response.blob();
        } catch (e) {
            console.error("Compression failed, falling back to original", e);
            const response = await fetch(dataUrl);
            blobToUpload = await response.blob();
            extension = blobToUpload.type.split('/')[1] || 'png';
            if (blobToUpload.size > maxBytes) {
                alert('Imagem muito grande. Limite de 2MB.');
                return dataUrl;
            }
        }

        const filePath = `${pathPrefix}/${crypto.randomUUID()}.${extension}`;
        // Cache control 1 year
        const { error } = await supabase.storage.from(bucketName).upload(filePath, blobToUpload, {
            contentType: `image/${extension}`,
            cacheControl: '31536000',
            upsert: true
        });
        if (error) {
            alert('Falha ao enviar imagem.');
            return dataUrl;
        }
        const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        return data.publicUrl || dataUrl;
    };

    const handleCropComplete = async (croppedImageDataUrl: string) => {
        setIsUploading(true);
        try {
            const uploadedUrl = await uploadDataUrl(croppedImageDataUrl, `slots/${userFolder}`);
            onChange({ ...value, imageUrl: uploadedUrl });
            setImageToCrop(null);
        } catch {
            alert('Falha ao enviar imagem.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCaptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...value, caption: event.target.value });
    };

    const triggerFileSelect = () => {
        if (isUploading) return;
        fileInputRef.current?.click();
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
    }

    return (
        <div className="space-y-2">
            <div onClick={triggerFileSelect} className="aspect-square w-full bg-black/20 rounded-xl flex items-center justify-center cursor-pointer">
                {isUploading ? (
                    <div className="text-center text-gray-500">
                        <p>Enviando...</p>
                    </div>
                ) : value.imageUrl ? (
                    <img src={value.imageUrl} alt="Upload preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                    <div className="text-center text-gray-500">
                        <UploadIcon className="w-12 h-12 mx-auto" />
                        <p>Selecionar Imagem</p>
                    </div>
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            <input
                type="text"
                placeholder="Legenda..."
                value={value.caption}
                onChange={handleCaptionChange}
                className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--gold)]"
            />
        </div>
    );
};
