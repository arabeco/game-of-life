import React, { useMemo } from 'react';
import type { AppMode, RewardMetricCard, VanguardWelcomePayload } from '../types';
import { RewardPackModal } from './RewardPackModal';

interface VanguardWelcomeModalProps {
  open: boolean;
  mode?: AppMode;
  payload?: VanguardWelcomePayload | null;
  onClose: () => void;
}

export const VanguardWelcomeModal: React.FC<VanguardWelcomeModalProps> = ({
  open,
  mode,
  payload,
  onClose,
}) => {
  const fallbackMetricCards = useMemo<RewardMetricCard[]>(
    () => [
      {
        label: 'Saldo',
        value: `+${payload?.gold ?? 50}`,
        detail: 'Ouro',
      },
      {
        label: 'Baú',
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

  return (
    <RewardPackModal
      open={open}
      mode={mode}
      payload={payload}
      onClose={onClose}
      fallbackEyebrow="Convite dourado"
      fallbackTitle="Bem-vindo a Vanguarda"
      fallbackSummary="Seu acesso foi selado pelo convite ouro. O pacote inicial da Vanguarda já foi integrado ao seu perfil."
      fallbackButtonLabel="Entrar na Vanguarda"
      fallbackItemSectionTitle="Itens do pack inicial"
      fallbackEmptyMessage="Seu pacote inicial da Vanguarda já foi entregue ao Arsenal. Entre no modo Jogo quando quiser ver e equipar cada item recebido."
      fallbackMetricCards={fallbackMetricCards}
    />
  );
};
