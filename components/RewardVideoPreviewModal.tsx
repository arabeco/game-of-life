import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { VideoPlayer } from './VideoPlayer';
import { XIcon } from './Icons';

type PreviewKind = 'chest' | 'levelup' | 'report';

interface RewardVideoPreviewModalProps {
    onClose: () => void;
}

const PREVIEWS: Record<PreviewKind, { label: string; src: string; duration: number; placeholder: string }> = {
    chest: {
        label: 'Bau',
        src: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_normal.mp4`,
        duration: 4000,
        placeholder: 'Abrindo bau...',
    },
    levelup: {
        label: 'Level up',
        src: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/levelup.mp4`,
        duration: 4000,
        placeholder: 'Level up...',
    },
    report: {
        label: 'Relatorio',
        src: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/report_seal.mp4`,
        duration: 5000,
        placeholder: 'Selando relatorio...',
    },
};

export const RewardVideoPreviewModal: React.FC<RewardVideoPreviewModalProps> = ({ onClose }) => {
    const [activePreview, setActivePreview] = useState<PreviewKind>('chest');
    const preview = PREVIEWS[activePreview];

    return (
        <Portal>
            <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-fade-in" onClick={onClose}>
                <GlassCard
                    variant="neutral"
                    className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-[var(--skin-accent-color)]/25 bg-[#050505] shadow-[0_0_70px_rgba(0,0,0,0.86)]"
                    onClick={(event) => event.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-3 top-3 z-40 rounded-full border border-white/10 bg-black/55 p-2 text-white/75 backdrop-blur-md transition-colors hover:text-white"
                        aria-label="Fechar preview de videos"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>

                    <div className="border-b border-white/8 px-5 pb-3 pt-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--skin-accent-color)]">Preview QA</p>
                        <h2 className="mt-1 text-lg font-black uppercase tracking-[0.16em] text-white">Videos de recompensa</h2>
                        <p className="mt-1 text-xs leading-relaxed text-white/45">Use para checar a marca d'agua depois do zoom, sem conceder recompensa real.</p>
                    </div>

                    <div className="flex gap-1 border-b border-white/8 bg-white/[0.025] p-2">
                        {(Object.keys(PREVIEWS) as PreviewKind[]).map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActivePreview(key)}
                                className={`flex-1 rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition-colors ${
                                    activePreview === key
                                        ? 'bg-[var(--skin-accent-color)] text-black'
                                        : 'bg-black/30 text-white/45 hover:text-white'
                                }`}
                            >
                                {PREVIEWS[key].label}
                            </button>
                        ))}
                    </div>

                    <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
                        <VideoPlayer
                            key={activePreview}
                            src={preview.src}
                            onEnd={() => {}}
                            className="h-full w-full"
                            videoClassName="scale-[1.08]"
                            placeholderLabel={preview.placeholder}
                            duration={preview.duration}
                            playbackRate={activePreview === 'report' ? 0.85 : 1}
                            preload="auto"
                            loop
                        />
                        <div className="pointer-events-none absolute inset-0 border border-white/8" />
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
