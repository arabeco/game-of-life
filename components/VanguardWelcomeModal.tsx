import React, { useMemo } from 'react';
import { resolveItemDef } from '../constants/items';
import type { RewardMetricCard, VanguardWelcomePayload } from '../types';
import { RewardPackModal } from './RewardPackModal';
import { getRewardEmblemUrl, getRewardToneRgb } from '../constants/rewardEmblems';
import { getChestArtUrl } from '../constants/catalogAssets';
import { getChestDisplayName, getChestVisual } from '../constants/rarityVisuals';

interface VanguardWelcomeModalProps {
  open: boolean;
  payload?: VanguardWelcomePayload | null;
  onClose: () => void;
}

export const VanguardWelcomeModal: React.FC<VanguardWelcomeModalProps> = ({
  open,
  payload,
  onClose,
}) => {
  const sanitizedItemIds = useMemo(
    () =>
      Array.from(
        new Set(
          (payload?.itemIds || []).filter((itemId) => {
            const itemDef = resolveItemDef(itemId);
            return !!itemDef && itemDef.category !== 'hair';
          }),
        ),
      ),
    [payload?.itemIds],
  );

  const fallbackMetricCards = useMemo<RewardMetricCard[]>(
    () => [
      {
        // O simbolo do ouro diz o que o numero e; "Saldo" com detalhe "Ouro"
        // gastava duas linhas para a mesma informacao.
        label: 'Ouro',
        simbolo: 'ouro',
        value: `+${payload?.gold ?? 50}`,
      },
    ],
    [payload?.gold],
  );

  const effectivePayload = useMemo<VanguardWelcomePayload | null>(() => {
    const basePayload = payload ? { ...payload } : {};
    const hasHighlights = (basePayload.rewardHighlights?.length || 0) > 0;
    const codeLabel = String(basePayload.inviteCode || basePayload.subtitle || 'VANGUARDA25');

    return {
      ...basePayload,
      itemIds: sanitizedItemIds,
      eyebrow: '',
      title: 'Recompensa entregue!',
      subtitle: /^código:/i.test(codeLabel) ? codeLabel : `Código: ${codeLabel}`,
      summary:
        basePayload.summary ||
        'O código foi validado e o pacote bônus já entrou no seu Arsenal.',
      buttonLabel: basePayload.buttonLabel || 'Receber bônus',
      itemSectionTitle: basePayload.itemSectionTitle || 'Itens resgatados',
      emptyMessage:
        basePayload.emptyMessage ||
        'Seu pacote da Vanguarda ja foi entregue ao Arsenal. Abra o inventario quando quiser ver e equipar cada recompensa.',
      rewardHighlightsTitle: basePayload.rewardHighlightsTitle || 'Entregue agora',
      rewardHighlights:
        hasHighlights
          ? basePayload.rewardHighlights
          : [
              {
                label: 'Ouro',
                value: `+${basePayload.gold ?? 50}`,
                detail: 'Crédito entregue pelo código.',
                tone: 'gold',
              },
              ...(basePayload.chestType ? [{
                label: getChestVisual(basePayload.chestType).label,
                value: getChestDisplayName(basePayload.chestType),
                detail: 'Baú incluído no resgate.',
                rarityRgb: getChestVisual(basePayload.chestType).rgb,
                imageUrl: getChestArtUrl(basePayload.chestType),
              }] : []),
              {
                label: 'Arsenal',
                value: 'Kit Vanguarda',
                detail: 'Os itens do bônus já foram adicionados.',
                tone: 'emerald',
              },
            ],
    };
  }, [payload, sanitizedItemIds]);

  return (
    <RewardPackModal
      open={open}
      payload={effectivePayload}
      emblema={getRewardEmblemUrl('geral')}
      tom={getRewardToneRgb('geral')}
      onClose={onClose}
      fallbackEyebrow=""
      fallbackTitle="Recompensa entregue!"
      fallbackSummary="O código foi validado e o pacote bônus já entrou no seu Arsenal."
      fallbackButtonLabel="Receber bônus"
      fallbackItemSectionTitle="Itens resgatados"
      fallbackEmptyMessage="Seu pacote da Vanguarda ja foi entregue ao Arsenal. Abra o inventario quando quiser ver e equipar cada item recebido."
      fallbackMetricCards={fallbackMetricCards}
    />
  );
};
