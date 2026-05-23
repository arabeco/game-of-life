import React from 'react';
import { MessageIcon, SparklesIcon, XIcon } from './Icons';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { SCREEN_INTRO_TIPS, type ScreenIntroTipId } from '../utils/screenIntroTips';

interface ScreenIntroTipOverlayProps {
  open: boolean;
  tipId: ScreenIntroTipId | null;
  onClose: (options?: { disableFuture?: boolean }) => void;
}

export const ScreenIntroTipOverlay: React.FC<ScreenIntroTipOverlayProps> = ({
  open,
  tipId,
  onClose,
}) => {
  if (!open || !tipId) return null;

  const tip = SCREEN_INTRO_TIPS[tipId];
  if (!tip) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[10002] bg-black/18"
        onClick={() => onClose()}
      >
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+var(--safe-area-bottom))] flex justify-center px-3">
          <GlassCard
            variant="gold"
            className="pointer-events-auto relative w-full max-w-[23rem] rounded-[22px] border-[var(--skin-accent-color)]/24 bg-[linear-gradient(180deg,rgba(18,18,20,0.97),rgba(5,5,7,0.99))] px-3.5 pb-3 pt-3.5 shadow-[0_20px_54px_rgba(0,0,0,0.48),0_0_24px_rgba(234,179,8,0.10)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute -bottom-2 left-8 h-4 w-4 rotate-45 border-b border-r border-[var(--skin-accent-color)]/20 bg-[#060607]" />

            <button
              type="button"
              onClick={() => onClose()}
              className="absolute right-3 top-3 rounded-full border border-white/8 bg-white/[0.04] p-1.5 text-white/45 transition-colors hover:text-white"
              aria-label="Fechar dica inicial"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-start gap-3 pr-7">
              <div className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--skin-accent-color)]/30 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.24),transparent_34%),rgba(234,179,8,0.12)] text-[var(--ui-text-accent)] shadow-[0_0_22px_rgba(234,179,8,0.18)]">
                <MessageIcon className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--skin-accent-color)] text-black">
                  <SparklesIcon className="h-2.5 w-2.5" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--ui-text-accent-soft)]">
                    Oraculo
                  </div>
                  <div className="h-1 w-1 rounded-full bg-white/18" />
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/42">
                    {tip.label}
                  </div>
                </div>

                <h3 className="mt-1.5 text-[16px] font-black leading-tight tracking-[0.01em] text-white">
                  {tip.title}
                </h3>

                <p className="mt-2 text-[13px] leading-relaxed text-white/76">
                  {tip.summary}
                </p>

                {tip.items[0] && (
                  <div className="mt-2.5 rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2 text-[11px] font-semibold leading-snug text-white/72">
                    <span className="text-[var(--ui-text-accent)]">Agora:</span> {tip.items[0]}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onClose({ disableFuture: true })}
                className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-white/46 transition-colors hover:bg-white/[0.06] hover:text-white/72"
              >
                Desligar dicas
              </button>
              <button
                type="button"
                onClick={() => onClose()}
                className="luxe-skin-button rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em]"
              >
                Entendi
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </Portal>
  );
};
