

import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { UploadIcon } from './Icons';
import { ImageCropper } from './ImageCropper';
import { supabase } from '../supabaseClient';
import { useGame } from '../contexts/GameContext';

interface AvatarUploadModalProps {
    currentAvatar: string;
    onClose: () => void;
    onSave: (newAvatarUrl: string) => void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({ currentAvatar, onClose, onSave }) => {
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [croppedAvatar, setCroppedAvatar] = useState<string | null>(null);
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

    const triggerFileSelect = () => fileInputRef.current?.click();

    const handleCropComplete = (croppedImageDataUrl: string) => {
        setCroppedAvatar(croppedImageDataUrl);
        setImageToCrop(null); // Close cropper
    };

    const uploadDataUrl = async (dataUrl: string, pathPrefix: string) => {
        if (!(supabase as any)?.storage) return dataUrl;
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        if (blob.size > maxBytes) {
            alert('Imagem muito grande. Limite de 2MB.');
            return dataUrl;
        }
        const mimeType = blob.type || 'image/png';
        const extension = mimeType.split('/')[1] || 'png';
        
        const fileName = `${crypto.randomUUID()}.${extension}`;
        // Standard path structure for RLS: avatars/USER_ID/filename
        const filePath = `avatars/${userFolder}/${fileName}`;
        
        console.log("Uploading to:", bucketName, filePath);

        const { error, data } = await supabase.storage.from(bucketName).upload(filePath, blob, { contentType: mimeType, upsert: true });
        
        if (error) {
            console.error("Upload error:", error);
            // Fallback: try root folder
            const fallbackPath = `${userFolder}/${fileName}`;
            console.log("Retrying with fallback path:", fallbackPath);
            
            const { error: error2 } = await supabase.storage.from(bucketName).upload(fallbackPath, blob, { contentType: mimeType, upsert: true });
            
            if (error2) {
                 console.error("Fallback upload error:", error2);
                 alert(`Falha ao enviar imagem (RLS): ${error.message} / ${error2.message}`);
                 return dataUrl;
            } else {
                 const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(fallbackPath);
                 return publicData.publicUrl || dataUrl;
            }
        }
        
        const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        return publicData.publicUrl || dataUrl;
    };

    const handleSave = async () => {
        if (!croppedAvatar || isUploading) return;
        setIsUploading(true);
        try {
            // pathPrefix is largely ignored now in favor of userFolder logic inside uploadDataUrl
            const uploadedUrl = await uploadDataUrl(croppedAvatar, `avatars/${userFolder}`);
            console.log("Avatar uploaded successfully, URL:", uploadedUrl);
            onSave(uploadedUrl);
        } catch (e) {
            console.error(e);
            alert('Falha ao enviar imagem.');
        } finally {
            setIsUploading(false);
        }
    };
    
    if (imageToCrop) {
        return (
            <ImageCropper 
                imageSrc={imageToCrop}
                cropShape="round"
                onCropComplete={handleCropComplete}
                onClose={() => setImageToCrop(null)}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">Editor de Imagem de Perfil</h2>
                
                <div className="flex justify-center">
                    <div className="w-48 h-48 rounded-full bg-black/20 overflow-hidden">
                        <img src={croppedAvatar || currentAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                    </div>
                </div>

                <button onClick={triggerFileSelect} disabled={isUploading} className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl luxe-button-secondary disabled:opacity-50 disabled:cursor-not-allowed">
                    <UploadIcon className="w-5 h-5" />
                    <span>{isUploading ? 'Enviando...' : 'Escolher Imagem'}</span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />

                <div className="flex space-x-2">
                    <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-secondary">
                        CANCELAR
                    </button>
                    <button onClick={handleSave} disabled={!croppedAvatar || isUploading} className="w-full py-2 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed">
                        {isUploading ? 'ENVIANDO...' : 'SALVAR'}
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};
