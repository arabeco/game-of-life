import React, { useMemo } from 'react';
import { resolveItemDef } from '../constants/items';
import type { RewardMetricCard, VanguardWelcomePayload } from '../types';
import { RewardPackModal } from './RewardPackModal';

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
        label: 'Saldo',
        value: `+${payload?.gold ?? 50}`,
        detail: 'Ouro',
      },
      {
        label: 'Bau',
        value: payload?.chestType || 'Incomum',
        detail: 'Inicial',
      },
      {
        label: 'Status',
        value: 'Vanguarda',
        detail: payload?.inviteCode ? payload.inviteCode : 'ouro',
      },
    ],
    [payload?.chestType, payload?.gold, payload?.inviteCode],
  );

  const effectivePayload = useMemo<VanguardWelcomePayload | null>(() => {
    const basePayload = payload ? { ...payload } : {};
    const hasHighlights = (basePayload.rewardHighlights?.length || 0) > 0;

    return {
      ...basePayload,
      itemIds: sanitizedItemIds,
      eyebrow: basePayload.eyebrow || 'Convite dourado',
      title: basePayload.title || 'Bem-vindo a Vanguarda',
      summary:
        basePayload.summary ||
        'Seu acesso ouro foi selado. O pacote real da Vanguarda ja entrou no Arsenal.',
      buttonLabel: basePayload.buttonLabel || 'Entrar na Vanguarda',
      itemSectionTitle: basePayload.itemSectionTitle || 'Itens da Vanguarda',
      emptyMessage:
        basePayload.emptyMessage ||
        'Seu pacote da Vanguarda ja foi entregue ao Arsenal. Entre no modo Jogo quando quiser ver e equipar cada recompensa.',
      rewardHighlightsTitle: basePayload.rewardHighlightsTitle || 'Entregue agora',
      rewardHighlights:
        hasHighlights
          ? basePayload.rewardHighlights
          : [
              {
                label: 'Ouro',
                value: `+${basePayload.gold ?? 50}`,
                detail: 'Reserva inicial da Vanguarda.',
                tone: 'gold',
              },
              {
                label: 'Bau',
                value: basePayload.chestType || 'Incomum',
                detail: 'Entrega inicial do convite ouro.',
                tone: 'cyan',
              },
              {
                label: 'Arsenal',
                value: 'Kit Vanguarda',
                detail: 'Borda, banner e itens de vitrine ja foram adicionados.',
                tone: 'emerald',
              },
            ],
    };
  }, [payload, sanitizedItemIds]);

  return (
    <RewardPackModal
      open={open}
      payload={effectivePayload}
      onClose={onClose}
      fallbackEyebrow="Convite dourado"
      fallbackTitle="Bem-vindo a Vanguarda"
      fallbackSummary="Seu acesso foi selado pelo convite ouro. O pacote real da Vanguarda ja foi integrado ao seu perfil."
      fallbackButtonLabel="Entrar na Vanguarda"
      fallbackItemSectionTitle="Itens da Vanguarda"
      fallbackEmptyMessage="Seu pacote da Vanguarda ja foi entregue ao Arsenal. Entre no modo Jogo quando quiser ver e equipar cada item recebido."
      fallbackMetricCards={fallbackMetricCards}
    />
  );
};
