import React from 'react';
import { Portal } from './Portal';
import { GlassCard } from './GlassCard';
import { ImageIcon, MessageIcon, XIcon } from './Icons';

interface ShareChoiceSheetProps {
    isOpen: boolean;
    title?: string;
    subtitle?: string;
    imageLabel?: string;
    feedLabel?: string;
    onShareImage: () => void;
    onPostToFeed: () => void;
    onClose: () => void;
}

export const ShareChoiceSheet: React.FC<ShareChoiceSheetProps> = ({
    isOpen,
    title = 'Compartilhar',
    subtitle = 'Escolha como quer mostrar esse resultado.',
    imageLabel = 'Compartilhar imagem',
    feedLabel = 'Postar no feed',
    onShareImage,
    onPostToFeed,
    onClose,
}) => {
    if (!isOpen) return null;

    const handleShareImage = () => {
        onClose();
        onShareImage();
    };

    const handlePostToFeed = () => {
        onClose();
        onPostToFeed();
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[10020] flex items-end justify-center p-4" onClick={onClose}>
                <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px]" />
                <GlassCard
                    variant="neutral"
                    className="relative w-full max-w-md rounded-[28px] border border-white/10 p-0 shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4">
                        <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--skin-accent-color)]">
                                Compartilhar
                            </div>
                            <h3 className="mt-1 text-lg font-black text-white">{title}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-white/60">{subtitle}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full bg-white/5 p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label="Fechar"
                        >
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="space-y-3 px-5 py-5">
                        <button
                            onClick={handleShareImage}
                            className="flex w-full items-center gap-3 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-4 py-4 text-left transition-all hover:border-[var(--skin-accent-color)]/26 hover:bg-[var(--skin-accent-color)]/10"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[var(--skin-accent-color)]">
                                <ImageIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-black text-white">{imageLabel}</div>
                                <div className="mt-1 text-xs text-white/55">Gera uma imagem pronta para compartilhar fora do app.</div>
                            </div>
                        </button>

                        <button
                            onClick={handlePostToFeed}
                            className="flex w-full items-center gap-3 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-4 py-4 text-left transition-all hover:border-[var(--skin-accent-color)]/26 hover:bg-[var(--skin-accent-color)]/10"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[var(--skin-accent-color)]">
                                <MessageIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-black text-white">{feedLabel}</div>
                                <div className="mt-1 text-xs text-white/55">Publica esse resultado dentro do feed social do app.</div>
                            </div>
                        </button>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
