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
          className="pointer-events-auto w-full max-w-[24rem] rounded-[26px] border-white/12 bg-[linear-gradient(180deg,rgba(12,12,14,0.94),rgba(6,6,8,0.98))] px-4 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.34)]"
          onClick={() => onClose({ disableFuture })}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--skin-accent-color)]/18 bg-[var(--skin-accent-color)]/10 text-[var(--ui-text-accent)]">
              <LightbulbIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--ui-text-accent-soft)]">
                Dica inicial · {tip.label}
              </div>
              <h3 className="mt-1 text-[15px] font-black tracking-[0.03em] text-white">
                {tip.title}
              </h3>
              <p className="mt-2 text-[12px] leading-relaxed text-white/68">
                {tip.summary}
              </p>
              <div className="mt-3 space-y-1.5">
                {tip.items.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-[11px] leading-snug text-white/78">
                    <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--skin-accent-color)]/90" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[11px] text-white/72">
                <span
                  className="contents"
                  onClick={(event) => event.stopPropagation()}
                >
                <input
                  type="checkbox"
                  checked={disableFuture}
                  onChange={(event) => setDisableFuture(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/15 bg-black/20 accent-[var(--skin-accent-color)]"
                />
                <span>
                  Ocultar dicas iniciais daqui pra frente.
                  <span className="mt-1 block text-[10px] text-white/44">
                    Se quiser religar depois, va em Config &gt; Preferencias &gt; Tutoriais.
                  </span>
                </span>
                </span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClose({ disableFuture });
              }}
              className="luxe-skin-button rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.18em]"
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
