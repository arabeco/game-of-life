import type { ChestType, RewardMetricCard, RewardModalPayload } from '../types';
import { getChestDisplayName, getChestVisual } from '../constants/rarityVisuals';
import { getChestArtUrl } from '../constants/catalogAssets';

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
  // O tipo vem explicito porque o primeiro elemento nao pode ditar a forma do
  // array: inferido dele, todo push seguinte teria de repetir `simbolo`, e o bau
  // nao tem simbolo nenhum — o tipo dele e o proprio valor.
  const metricCards: RewardMetricCard[] = [
    // Sem `detail`: card com simbolo mostra so numero, simbolo e legenda — e o
    // resumo la em cima ja diz que a EXP entrou no perfil.
    { label: 'EXP', simbolo: 'exp', value: `+${premio.exp.toLocaleString('pt-BR')}` },
  ];

  if (premio.fragments > 0) {
    metricCards.push({ label: 'Fragmentos', simbolo: 'fragmento', value: `+${premio.fragments}` });
  }
  const rewardHighlights = premio.chestType
    ? [{
        label: 'Baú conquistado',
        value: `${getChestDisplayName(premio.chestType)} · guardado no Arsenal`,
        detail: 'Abra quando quiser, pelo Arsenal.',
        // Dourado era a cor de UMA raridade servindo para todas. O bau de
        // ciclo e raro, e raro e azul.
        rarityRgb: getChestVisual(premio.chestType).rgb,
        imageUrl: getChestArtUrl(premio.chestType),
      }]
    : [];

  return {
    eyebrow: '',
    title: 'Ciclo concluído!',
    subtitle: premio.cycleName || undefined,
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
