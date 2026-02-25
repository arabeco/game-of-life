

import React, { useState, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { UploadIcon } from './Icons';
import { Portal } from './Portal';

interface AvatarUploadModalProps {
    currentAvatar: string;
    onClose: () => void;
    onSave: (newAvatarUrl: string) => void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({ currentAvatar, onClose, onSave }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('File must be an image');
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onSave(base64String);
        onClose();
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setError('Failed to process image');
      setIsUploading(false);
    }
  };

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

          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl luxe-button-secondary disabled:opacity-50 disabled:cursor-not-allowed">
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
            <button onClick={handleSave} disabled={!selectedFile || isUploading} className="w-full py-2 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed">
              {isUploading ? 'ENVIANDO...' : 'SALVAR'}
            </button>
          </div>
        </GlassCard>
      </div>
    </Portal>
  );
};
