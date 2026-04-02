import React, { useMemo } from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { resolveItemDef } from '../constants/items';
import { Check, Gift } from 'lucide-react';
import type { AppMode, RewardHighlightLine, RewardMetricCard, RewardModalPayload } from '../types';

interface RewardPackModalProps {
  open: boolean;
  mode?: AppMode;
  payload?: RewardModalPayload | null;
  onClose: () => void;
  fallbackEyebrow: string;
  fallbackTitle: string;
  fallbackSummary: string;
  fallbackButtonLabel: string;
  fallbackItemSectionTitle?: string;
  fallbackEmptyMessage?: string;
  fallbackMetricCards?: RewardMetricCard[];
}

const rewardCardClasses =
  'rounded-xl border border-white/8 bg-white/[0.03] p-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';

const rewardHighlightToneStyles: Record<NonNullable<RewardHighlightLine['tone']>, string> = {
  gold: 'border-yellow-500/18 bg-yellow-500/[0.06] text-yellow-100',
  emerald: 'border-emerald-500/18 bg-emerald-500/[0.06] text-emerald-100',
  cyan: 'border-cyan-500/18 bg-cyan-500/[0.06] text-cyan-100',
  violet: 'border-violet-500/18 bg-violet-500/[0.08] text-violet-100',
};

export const RewardPackModal: React.FC<RewardPackModalProps> = ({
  open,
  payload,
  onClose,
  fallbackEyebrow,
  fallbackTitle,
  fallbackSummary,
  fallbackButtonLabel,
  fallbackItemSectionTitle = 'Itens recebidos',
  fallbackEmptyMessage = 'Seu pacote ja foi integrado ao Arsenal.',
  fallbackMetricCards = [],
}) => {
  const showItems = (payload?.itemIds?.length || 0) > 0;
  const itemIds = payload?.itemIds || [];
  const metricCards = payload?.metricCards?.length ? payload.metricCards : fallbackMetricCards;
  const rewardHighlights = payload?.rewardHighlights || [];
  const activeBenefits = payload?.activeBenefits || [];

  const rewardItems = useMemo(
    () =>
      itemIds
        .map((itemId) => {
          const itemDef = resolveItemDef(itemId);
          return itemDef ? { itemId, itemDef } : null;
        })
        .filter((entry): entry is { itemId: string; itemDef: NonNullable<ReturnType<typeof resolveItemDef>> } => Boolean(entry)),
    [itemIds],
  );
  const visibleRewardItems = rewardItems.slice(0, 2);
  const hiddenRewardItemsCount = Math.max(0, rewardItems.length - visibleRewardItems.length);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/88 px-4 py-5 backdrop-blur-md"
        onClick={onClose}
      >
        <GlassCard
          variant="gold"
          className="relative w-full max-w-sm overflow-hidden rounded-[30px] border-yellow-500/25 bg-[#050505] p-0 shadow-[0_0_56px_rgba(234,179,8,0.14)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(234,179,8,0.18),_transparent_58%)]" />

          <div className="relative flex max-h-[84svh] flex-col">
            <div className="border-b border-white/8 px-4 py-4">
              <div className="text-[9px] font-black uppercase tracking-[0.32em] text-yellow-400/80">
                {payload?.eyebrow || fallbackEyebrow}
              </div>
              <h2 className="mt-2 text-xl font-black uppercase tracking-[0.14em] text-white sm:text-2xl">
                {payload?.title || fallbackTitle}
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-gray-300">
                {payload?.summary || fallbackSummary}
              </p>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto px-4 pb-4 pt-4">
              {metricCards.length > 0 && (
                <div className={`grid gap-2 ${metricCards.length >= 3 ? 'grid-cols-3' : metricCards.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {metricCards.map((card, index) => (
                    <div key={`${card.label}-${index}`} className={rewardCardClasses}>
                      <div className="text-[8px] font-black uppercase tracking-[0.18em] text-yellow-400/80">{card.label}</div>
                      <div className="mt-1 text-sm font-black text-white">{card.value}</div>
                      {card.detail && <div className="mt-1 text-[10px] text-gray-500">{card.detail}</div>}
                    </div>
                  ))}
                </div>
              )}

              {rewardHighlights.length > 0 && (
                <div className={`${metricCards.length > 0 ? 'mt-4' : ''}`}>
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">
                    {payload?.rewardHighlightsTitle || 'Entregue agora'}
                  </div>
                  <div className="space-y-2">
                    {rewardHighlights.map((highlight, index) => {
                      const toneClass = rewardHighlightToneStyles[highlight.tone || 'gold'];
                      return (
                        <div key={`${highlight.label}-${index}`} className={`rounded-xl border px-3 py-3 ${toneClass}`}>
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20">
                              <Gift className="h-4 w-4 text-current opacity-80" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-current opacity-70">{highlight.label}</div>
                              <div className="mt-1 text-sm font-black text-current">{highlight.value}</div>
                              {highlight.detail && <div className="mt-1 text-[11px] leading-relaxed text-current opacity-70">{highlight.detail}</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {showItems ? (
                <div className={`${metricCards.length > 0 || rewardHighlights.length > 0 ? 'mt-4' : ''}`}>
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">
                    {payload?.itemSectionTitle || fallbackItemSectionTitle}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleRewardItems.map(({ itemId, itemDef }) => (
                      <div key={itemId} className={rewardCardClasses}>
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/8 bg-black/30">
                            {itemDef.imageUrl ? (
                              <img
                                src={itemDef.imageUrl}
                                alt={itemDef.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-base text-white/70">{itemDef.icon || '?'}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="line-clamp-2 text-[11px] font-black leading-tight text-white">{itemDef.name}</div>
                            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-500">
                              {itemDef.category} T{itemDef.tier}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {hiddenRewardItemsCount > 0 && (
                      <div className={rewardCardClasses}>
                        <div className="flex h-full min-h-[64px] items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/20 px-3 text-center">
                            <div>
                              <div className="text-lg font-black text-white">+{hiddenRewardItemsCount}</div>
                              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                              {hiddenRewardItemsCount === 1 ? 'item extra' : 'itens extras'}
                              </div>
                            </div>
                          </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`${metricCards.length > 0 || rewardHighlights.length > 0 ? 'mt-4' : ''} rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-[12px] leading-relaxed text-gray-300`}>
                  {payload?.emptyMessage || fallbackEmptyMessage}
                </div>
              )}

              {activeBenefits.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">
                    {payload?.activeBenefitsTitle || 'Vantagens ativas'}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeBenefits.map((benefit, index) => (
                      <div key={`${benefit}-${index}`} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[11px] font-semibold leading-snug text-gray-100">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/8 p-4">
              <button
                onClick={onClose}
                className="luxe-skin-button w-full rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em]"
              >
                {payload?.buttonLabel || fallbackButtonLabel}
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </Portal>
  );
};
