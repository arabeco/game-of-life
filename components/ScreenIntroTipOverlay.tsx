import React, { useEffect, useMemo, useState } from 'react';
import { XIcon } from './Icons';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { SCREEN_INTRO_TIPS, type ScreenIntroTipId } from '../utils/screenIntroTips';
import { OracleSpeakerMark } from './OracleSpeakerMark';

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
  const tip = tipId ? SCREEN_INTRO_TIPS[tipId] : null;
  const fullText = useMemo(() => tip?.summary || '', [tip?.summary]);
  const [displayedText, setDisplayedText] = useState(fullText);

  useEffect(() => {
    setDisplayedText('');
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayedText(fullText.slice(0, index));
      if (index >= fullText.length) {
        window.clearInterval(timer);
      }
    }, 14);

    return () => window.clearInterval(timer);
  }, [fullText, tipId]);

  const isTyping = displayedText.length < fullText.length;

  if (!open || !tipId || !tip) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[10002] bg-black/18"
        onClick={() => onClose()}
      >
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+var(--safe-area-bottom))] flex justify-center px-4">
          <OracleSpeakerMark
            tone="guide"
            size="lg"
            badge
            className="pointer-events-none absolute bottom-1 left-[max(18px,calc(50%-12.4rem))] z-10"
          />
          <GlassCard
            variant="gold"
            className="pointer-events-auto relative w-full max-w-[23.5rem] overflow-hidden rounded-[22px] border-[#d8e6ff]/30 bg-[linear-gradient(180deg,rgba(18,17,16,0.96),rgba(8,8,9,0.98))] px-3.5 pb-3.5 pl-[5.35rem] pt-3.5 shadow-[0_20px_80px_rgba(0,0,0,0.45),0_0_24px_rgba(216,230,255,0.08)] backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(216,230,255,0.15),transparent_70%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d8e6ff]/45 to-transparent" />
            <div className="pointer-events-none absolute bottom-7 left-[4.05rem] h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-b border-l border-[#d8e6ff]/22 bg-[#080809]" />

            <button
              type="button"
              onClick={() => onClose()}
              className="absolute right-3 top-3 rounded-full border border-white/8 bg-white/[0.04] p-1.5 text-white/45 transition-colors hover:text-white"
              aria-label="Fechar dica inicial"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-start gap-3 pr-7">
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

                <p className="mt-2 min-h-[2.6rem] whitespace-pre-wrap text-[13px] leading-relaxed text-white/82">
                  {displayedText}
                  {isTyping && <span className="ml-1 inline-block h-3 w-1 animate-pulse align-middle bg-[#f3d48a] opacity-80" />}
                </p>

                {tip.items[0] && !isTyping && (
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
