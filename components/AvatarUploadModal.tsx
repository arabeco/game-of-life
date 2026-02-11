

import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { UploadIcon } from './Icons';
import { ImageCropper } from './ImageCropper';

interface AvatarUploadModalProps {
    currentAvatar: string;
    onClose: () => void;
    onSave: (newAvatarUrl: string) => void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({ currentAvatar, onClose, onSave }) => {
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [croppedAvatar, setCroppedAvatar] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
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

    const handleSave = () => {
        if (croppedAvatar) {
            onSave(croppedAvatar);
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">Editor de Imagem de Perfil</h2>
                
                <div className="flex justify-center">
                    <div className="w-48 h-48 rounded-full bg-black/20 overflow-hidden">
                        <img src={croppedAvatar || currentAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                    </div>
                </div>

                <button onClick={triggerFileSelect} className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl luxe-button-secondary">
                    <UploadIcon className="w-5 h-5" />
                    <span>Escolher Imagem</span>
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
                    <button onClick={handleSave} disabled={!croppedAvatar} className="w-full py-2 rounded-xl luxe-button-primary disabled:opacity-50 disabled:cursor-not-allowed">
                        SALVAR
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};