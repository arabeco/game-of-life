import { getChestDisplayName, getChestVisual } from '../constants/rarityVisuals';
import { getChestArtUrl } from '../constants/catalogAssets';
import type { RewardCodeRedeemResult, RewardMetricCard, RewardModalPayload } from '../types';

/**
 * O resgate de codigo, como recompensa de verdade.
 *
 * Ate aqui o resgate terminava em `showToast(...)`: uma linha de texto que some
 * em segundos, para a unica tela do jogo em que a pessoa DIGITOU alguma coisa
 * esperando um premio. Ouro, bau, itens e dias de Premium chegavam todos na
 * mesma frase corrida, e o item nem aparecia.
 *
 * O emblema e o `recompensa_geral.png` — a peca desenhada exatamente para isto
 * e que estava no disco sem uma referencia sequer no codigo.
 */
export const buildRedeemRewardPayload = (resultado: RewardCodeRedeemResult): RewardModalPayload => {
    const metricCards: RewardMetricCard[] = [];
    const rewardHighlights: NonNullable<RewardModalPayload['rewardHighlights']> = [];

    const ouro = Number(resultado.wallet?.gold || 0);
    if (ouro > 0) metricCards.push({ label: 'Ouro', simbolo: 'ouro', value: `+${ouro.toLocaleString('pt-BR')}` });

    const fragmentos = Number(resultado.wallet?.fragments || 0);
    if (fragmentos > 0) metricCards.push({ label: 'Fragmentos', simbolo: 'fragmento', value: `+${fragmentos}` });

    const dias = Number(resultado.premiumDaysGranted || 0);
    if (dias > 0) metricCards.push({ label: 'Premium', value: `${dias} dias`, detail: 'ativo agora' });

    const baus = Number(resultado.chestCount || 0);
    if (resultado.chestType && baus > 0) {
        const visualDoBau = getChestVisual(resultado.chestType);
        rewardHighlights.push({
            label: visualDoBau.label,
            value: getChestDisplayName(resultado.chestType),
            detail: baus > 1 ? `${baus} unidades adicionadas ao Arsenal` : 'Adicionado ao Arsenal',
            rarityRgb: visualDoBau.rgb,
            imageUrl: getChestArtUrl(resultado.chestType),
        });
    }

    const fichas = Number(resultado.campaignQuizFreeCreditsGranted || 0) + Number(resultado.campaignQuizMediumCreditsGranted || 0);
    if (fichas > 0) metricCards.push({ label: 'Fichas de quiz', value: `+${fichas}` });

    const cenas = Number(resultado.legacySceneCreditsGranted || 0);
    if (cenas > 0) metricCards.push({ label: 'Cenas de legado', value: `+${cenas}` });

    return {
        eyebrow: '',
        title: 'Recompensa entregue!',
        subtitle: `Código: ${resultado.code}`,
        summary: resultado.description || resultado.rewardSummary || 'Tudo já entrou na sua conta.',
        buttonLabel: 'Continuar',
        itemSectionTitle: 'Itens recebidos',
        emptyMessage: '',
        itemIds: resultado.itemIds || [],
        metricCards,
        rewardHighlightsTitle: 'Itens recebidos',
        rewardHighlights,
    };
};
