import React, { useEffect, useState } from 'react';
import { LightbulbIcon } from './Icons';
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
  const [disableFuture, setDisableFuture] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDisableFuture(false);
  }, [open, tipId]);

  if (!open || !tipId) return null;

  const tip = SCREEN_INTRO_TIPS[tipId];
  if (!tip) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[10002]"
        onClick={() => onClose({ disableFuture })}
      >
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+var(--safe-area-bottom))] flex justify-center px-3">
          <GlassCard
            variant="gold"
            className="pointer-events-auto w-full max-w-[22rem] rounded-[24px] border-white/12 bg-[linear-gradient(180deg,rgba(12,12,14,0.94),rgba(6,6,8,0.98))] px-3.5 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.34)]"
            onClick={() => onClose({ disableFuture })}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[18px] border border-[var(--skin-accent-color)]/18 bg-[var(--skin-accent-color)]/10 text-[var(--ui-text-accent)]">
                <LightbulbIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[var(--ui-text-accent-soft)]">
                  Dica inicial · {tip.label}
                </div>
                <h3 className="mt-1 text-[14px] font-black tracking-[0.02em] text-white">
                  {tip.title}
                </h3>
                <p className="mt-1.5 text-[11px] leading-snug text-white/68">
                  {tip.summary}
                </p>

                <label className="mt-2.5 flex cursor-pointer items-start gap-2 rounded-[18px] border border-white/8 bg-white/[0.03] px-2.5 py-2 text-[10px] leading-snug text-white/72">
                  <span
                    className="contents"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={disableFuture}
                      onChange={(event) => setDisableFuture(event.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-white/15 bg-black/20 accent-[var(--skin-accent-color)]"
                    />
                    <span>
                      Ocultar dicas iniciais daqui para frente.
                      <span className="mt-0.5 block text-[9px] text-white/44">
                        Se quiser religar depois, vá em Config &gt; Preferências &gt; Tutoriais.
                      </span>
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose({ disableFuture });
                }}
                className="luxe-skin-button rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em]"
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
