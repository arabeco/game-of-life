import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';

// Helper function to create a cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    const { width, height } = image;
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((file) => {
            if (file) {
                resolve(URL.createObjectURL(file));
            } else {
                reject(new Error('Canvas is empty'));
            }
        }, 'image/png');
    });
}

// Helper to get Data URL for saving
export async function getCroppedImgDataUrl(imageSrc: string, pixelCrop: Area): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return '';
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg');
}

interface ImageCropperProps {
    imageSrc: string;
    cropShape: 'rect' | 'round';
    onCropComplete: (croppedImageDataUrl: string) => void;
    onClose: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, cropShape, onCropComplete, onClose }) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropCompleteCallback = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (croppedAreaPixels) {
            const croppedImageDataUrl = await getCroppedImgDataUrl(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImageDataUrl);
        }
    };

    return (
        <Portal>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">Ajustar Imagem</h2>
                <div className="relative w-full aspect-square bg-black/50 rounded-lg">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape={cropShape}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropCompleteCallback}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm">Zoom</label>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
                <div className="flex space-x-2">
                    <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-secondary">CANCELAR</button>
                    <button onClick={handleSave} className="w-full py-2 rounded-xl luxe-skin-button">CONFIRMAR</button>
                </div>
            </GlassCard>
        </div>
        </Portal>
    );
};
