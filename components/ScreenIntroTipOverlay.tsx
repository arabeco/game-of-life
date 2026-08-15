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
        className="pointer-events-none fixed inset-0 z-[10002] bg-black/18"
      >
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(78px+var(--safe-area-bottom))] flex justify-center px-4">
          <OracleSpeakerMark
            tone="guide"
            size="md"
            badge
            className="pointer-events-none absolute bottom-1 left-[max(18px,calc(50%-11.1rem))] z-10"
          />
          <GlassCard
            variant="gold"
            className="pointer-events-auto relative w-full max-w-[21rem] overflow-hidden rounded-[18px] border-[#d8e6ff]/28 bg-[linear-gradient(180deg,rgba(18,17,16,0.96),rgba(8,8,9,0.98))] px-3 pb-2.5 pl-[4.45rem] pt-2.5 shadow-[0_16px_56px_rgba(0,0,0,0.42),0_0_20px_rgba(216,230,255,0.07)] backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-[radial-gradient(circle_at_top,rgba(216,230,255,0.13),transparent_70%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d8e6ff]/45 to-transparent" />
            <div className="pointer-events-none absolute bottom-6 left-[3.38rem] h-3 w-3 -translate-x-1/2 rotate-45 border-b border-l border-[#d8e6ff]/22 bg-[#080809]" />

            <button
              type="button"
              onClick={() => onClose()}
              className="absolute right-2.5 top-2.5 rounded-full border border-white/8 bg-white/[0.04] p-1 text-white/45 transition-colors hover:text-white"
              aria-label="Fechar dica inicial"
            >
              <XIcon className="h-3 w-3" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-[8px] font-black uppercase tracking-[0.18em] text-[var(--ui-text-accent-soft)]">
                    Oraculo
                  </div>
                  <div className="h-1 w-1 rounded-full bg-white/18" />
                  <div className="text-[8px] font-black uppercase tracking-[0.14em] text-white/42">
                    {tip.label}
                  </div>
                </div>

                <h3 className="mt-1 text-[13px] font-black leading-tight tracking-[0.01em] text-white">
                  {tip.title}
                </h3>

                <p className="mt-1.5 min-h-[2.05rem] whitespace-pre-wrap text-[11px] font-semibold leading-snug text-white/82">
                  {displayedText}
                  {isTyping && <span className="ml-1 inline-block h-3 w-1 animate-pulse align-middle bg-[#f3d48a] opacity-80" />}
                </p>

                {tip.items[0] && !isTyping && (
                  <p className="mt-1.5 text-[10px] font-semibold leading-snug text-white/58">
                    <span className="text-[var(--ui-text-accent)]">Agora:</span> {tip.items[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => onClose({ disableFuture: true })}
                className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-white/46 transition-colors hover:bg-white/[0.06] hover:text-white/72"
              >
                Desligar dicas
              </button>
              <button
                type="button"
                onClick={() => onClose()}
                className="luxe-skin-button rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em]"
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
