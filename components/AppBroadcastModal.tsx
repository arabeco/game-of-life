import React from 'react';
import { Megaphone, ExternalLink } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import type { AppMode } from '../types';

export type AppBroadcast = {
  id: string;
  eyebrow?: string | null;
  title: string;
  summary: string;
  body?: string | null;
  imageUrl?: string | null;
  buttonLabel?: string | null;
  secondaryLabel?: string | null;
  ctaType?: 'none' | 'view' | 'url' | null;
  ctaTarget?: string | null;
  dismissible?: boolean | null;
  showOnce?: boolean | null;
};

interface AppBroadcastModalProps {
  broadcast: AppBroadcast;
  mode?: AppMode;
  onClose: () => void;
  onCta?: (broadcast: AppBroadcast) => void;
}

export const AppBroadcastModal: React.FC<AppBroadcastModalProps> = ({
  broadcast,
  mode,
  onClose,
  onCta,
}) => {
  const isBasic = mode === 'BASIC';
  const hasCta = !!broadcast.ctaType && broadcast.ctaType !== 'none' && !!broadcast.ctaTarget;
  const primaryLabel = broadcast.buttonLabel || (hasCta ? 'Abrir agora' : 'Entendido');

  const handlePrimary = () => {
    if (hasCta) {
      onCta?.(broadcast);
      return;
    }
    onClose();
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/88 px-4 py-5 backdrop-blur-md"
        onClick={broadcast.dismissible === false ? undefined : onClose}
      >
        <GlassCard
          variant={isBasic ? 'neutral' : 'gold'}
          className="relative w-full max-w-sm overflow-hidden rounded-[28px] border-white/12 bg-[#050505] p-0 shadow-[0_0_56px_rgba(0,0,0,0.72)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(234,179,8,0.16),_transparent_58%)]" />
          <div className="relative flex max-h-[84svh] flex-col">
            {broadcast.imageUrl && (
              <div className="relative h-36 overflow-hidden border-b border-white/8">
                <img src={broadcast.imageUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.72))]" />
              </div>
            )}

            <div className="border-b border-white/8 px-4 py-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.28em] text-yellow-400/80">
                <Megaphone className="h-3.5 w-3.5" />
                <span>{broadcast.eyebrow || 'Aviso do Beco'}</span>
              </div>
              <h2 className="mt-2 text-xl font-black uppercase tracking-[0.13em] text-white sm:text-2xl">
                {broadcast.title}
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-gray-300">
                {broadcast.summary}
              </p>
            </div>

            {broadcast.body && (
              <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4">
                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-[12px] leading-relaxed text-gray-300 whitespace-pre-line">
                  {broadcast.body}
                </div>
              </div>
            )}

            <div className="space-y-2 border-t border-white/8 p-4">
              <button
                type="button"
                onClick={handlePrimary}
                className="luxe-skin-button flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em]"
              >
                {primaryLabel}
                {broadcast.ctaType === 'url' && <ExternalLink className="h-3.5 w-3.5" />}
              </button>
              {hasCta && broadcast.dismissible !== false && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/62"
                >
                  {broadcast.secondaryLabel || 'Depois'}
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </Portal>
  );
};
