

import React, { useState } from 'react';
import { SlotValueImage } from '../../types';
import { UploadIcon } from '../Icons';
import { ImageCropper } from '../ImageCropper';

interface ImageUploadSlotProps {
    value: SlotValueImage;
    onChange: (value: SlotValueImage) => void;
}

export const ImageUploadSlot: React.FC<ImageUploadSlotProps> = ({ value, onChange }) => {
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
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
    
    const handleCropComplete = (croppedImageDataUrl: string) => {
        onChange({ ...value, imageUrl: croppedImageDataUrl });
        setImageToCrop(null);
    };

    const handleCaptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...value, caption: event.target.value });
    };

    const triggerFileSelect = () => fileInputRef.current?.click();
    
    if (imageToCrop) {
        return (
            <ImageCropper 
                imageSrc={imageToCrop}
                cropShape="rect"
                onCropComplete={handleCropComplete}
                onClose={() => setImageToCrop(null)}
            />
        );
    }

    return (
        <div className="space-y-2">
            <div onClick={triggerFileSelect} className="aspect-square w-full bg-black/20 rounded-xl flex items-center justify-center cursor-pointer">
                {value.imageUrl ? (
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