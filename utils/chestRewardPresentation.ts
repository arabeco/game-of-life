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

/**
 * O que o fecho de ciclo entrega, numa tela so.
 *
 * O relatorio ja concedia tudo — EXP, fragmentos, insignia e o bau — mas
 * apresentava isso ABRINDO o bau ali mesmo e mostrando o conteudo dele. Duas
 * coisas davam errado: encadeava o video do selo com o video do bau, e o modal
 * falava com o vocabulario de uma compra, porque reusava o payload do bau.
 *
 * Aqui o bau aparece como CONQUISTADO e guardado. Ele continua sendo entregue —
 * so nao e aberto por aqui. Abrir e escolha de quem ganhou, e o Arsenal ja sabe
 * fazer isso.
 */
export const buildCycleRewardPayload = (premio: {
  exp: number;
  fragments: number;
  insigniaIds: string[];
  chestType: ChestType | null;
  cycleName?: string | null;
}): RewardModalPayload => {
  const metricCards = [
    { label: 'EXP', value: `+${premio.exp.toLocaleString('pt-BR')}`, detail: 'creditada no perfil' },
  ];

  if (premio.fragments > 0) {
    metricCards.push({ label: '\u{1F48E} Fragmentos', value: `+${premio.fragments}`, detail: '' });
  }
  if (premio.chestType) {
    metricCards.push({ label: 'Baú', value: premio.chestType, detail: 'no Arsenal' });
  }

  const rewardHighlights = premio.chestType
    ? [{
        label: 'Baú conquistado',
        value: `${premio.chestType} · guardado no Arsenal`,
        detail: 'Abra quando quiser, pelo Arsenal.',
        tone: 'gold' as const,
      }]
    : [];

  return {
    eyebrow: 'Ciclo fechado',
    title: premio.cycleName || 'Ciclo concluído',
    summary: premio.chestType
      ? 'A EXP já entrou no seu perfil e o baú está esperando no Arsenal.'
      : 'A EXP já entrou no seu perfil.',
    buttonLabel: 'Continuar',
    rewardHighlightsTitle: 'Entregue agora',
    rewardHighlights,
    itemSectionTitle: 'Insígnias do ciclo',
    emptyMessage: 'Nenhuma insígnia nova neste ciclo.',
    itemIds: premio.insigniaIds,
    metricCards,
  };
};
