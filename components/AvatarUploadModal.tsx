import React, { Suspense, lazy, useRef, useState } from 'react';
import { GlassCard } from './GlassCard';
import { UploadIcon } from './Icons';
import { Portal } from './Portal';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../supabaseClient';
import { compressDataUrlToWebP } from '../utils/imageUtils';

const ImageCropper = lazy(() =>
  import('./ImageCropper').then((module) => ({ default: module.ImageCropper }))
);

interface AvatarUploadModalProps {
  currentAvatar: string;
  onClose: () => void;
  onSave: (newAvatarUrl: string) => void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({ currentAvatar, onClose, onSave }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [preparedImageDataUrl, setPreparedImageDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userProfile } = useGame();
  const maxUploadBytes = 2 * 1024 * 1024;
  const bucketName = 'user-images';
  const userFolder = userProfile.id && userProfile.id !== 'placeholder_user' ? userProfile.id : 'guest';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImageToCrop(dataUrl);
      setPreparedImageDataUrl(null);
      setError(null);
    };
    reader.onerror = () => setError('Failed to read image');
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImageDataUrl: string) => {
    setPreparedImageDataUrl(croppedImageDataUrl);
    setPreviewUrl(croppedImageDataUrl);
    setImageToCrop(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!preparedImageDataUrl) return;

    setIsUploading(true);
    setError(null);
    try {
      const webpDataUrl = await compressDataUrlToWebP(preparedImageDataUrl, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
      });

      let blobToUpload: Blob;
      let extension = 'webp';

      try {
        const response = await fetch(webpDataUrl);
        blobToUpload = await response.blob();
      } catch {
        const response = await fetch(preparedImageDataUrl);
        blobToUpload = await response.blob();
        extension = blobToUpload.type.split('/')[1] || 'jpg';
      }

      if (blobToUpload.size > maxUploadBytes) {
        setError('Imagem muito grande. Tente uma foto menor.');
        return;
      }

      const filePath = `avatars/${userFolder}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, blobToUpload, {
        contentType: `image/${extension}`,
        cacheControl: '31536000',
        upsert: true,
      });

      if (uploadError) {
        setError('Nao consegui enviar a imagem agora.');
        return;
      }

      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      const nextAvatarUrl = data.publicUrl || webpDataUrl;
      onSave(nextAvatarUrl);
    } catch {
      setError('Nao consegui processar a imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  if (imageToCrop) {
    return (
      <Suspense fallback={<div className="fixed inset-0 z-[10020] bg-black/70 backdrop-blur-sm" />}>
        <ImageCropper
          imageSrc={imageToCrop}
          cropShape="round"
          onCropComplete={handleCropComplete}
          onClose={() => setImageToCrop(null)}
        />
      </Suspense>
    );
  }

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center animate-fade-in" onClick={onClose}>
        <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
          <h2 className="text-lg font-bold uppercase tracking-wider text-center">Editor de Imagem de Perfil</h2>

          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-full bg-black/20 overflow-hidden">
              <img src={previewUrl || currentAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl luxe-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadIcon className="w-5 h-5" />
            <span>{isUploading ? 'Enviando...' : 'Escolher Imagem'}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          <div className="flex space-x-2">
            <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-secondary">
              CANCELAR
            </button>
            <button
              onClick={handleSave}
              disabled={!preparedImageDataUrl || isUploading}
              className="w-full py-2 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'ENVIANDO...' : 'SALVAR'}
            </button>
          </div>
        </GlassCard>
      </div>
    </Portal>
  );
};
