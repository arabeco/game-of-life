import type { ChestOpenResult, ChestType, RewardModalPayload } from '../types';

export const buildChestRewardPayload = (
  result: ChestOpenResult,
  chestType: ChestType,
): RewardModalPayload => {
  const metricCards = [
    { label: 'Baú', value: chestType },
    { label: '\u{1F48E} Fragmentos', value: `+${result.fragmentsGained || 0}` },
    { label: 'Status', value: result.isDuplicate ? 'Duplicado' : 'Novo' },
  ];

  if ((result.goldGained || 0) > 0) {
    metricCards.push({ label: 'Ouro bônus', value: `+${result.goldGained}` });
  }

  return {
    eyebrow: 'RECOMPENSA',
    title: result.itemName || 'Recompensa recebida',
    summary: result.isDuplicate
      ? `Você já tinha esse item. Convertido em ${result.fragmentsGained || 0} \u{1F48E} fragmentos.`
      : `Seu baú ${chestType.toLowerCase()} foi aberto e o prêmio já entrou no Arsenal.`,
    buttonLabel: 'Fechar',
    itemSectionTitle: 'Item recebido',
    emptyMessage: 'O resultado já foi integrado ao inventário.',
    itemIds: result.itemId ? [result.itemId] : [],
    metricCards,
  };
};
