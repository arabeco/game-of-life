import { getChestVisual } from '../constants/rarityVisuals';
import type { RewardMetricCard, RewardModalPayload } from '../types';

/**
 * Traduz o premio de um feito para o mesmo payload que o modal de recompensa
 * ja entende.
 *
 * O modal de feito recebia `achievement.data.rewards` e desenhava os proprios
 * cards a partir dele: a letra "G" no lugar do simbolo de ouro, um "?" no
 * lugar do de EXP, emoji no lugar da arte do item, nenhuma cor de raridade e
 * nenhum limite de altura. Nada disso era decisao de desenho — era so codigo
 * que nasceu antes e nunca recebeu as correcoes feitas do outro lado.
 *
 * A forma de `rewards` e frouxa de proposito: ela vem do servidor e de varios
 * caminhos do jogo, com `item` ou `items`, com ou sem `rewardDetails`. Toda a
 * bagunca fica contida aqui.
 */

type PremioDeFeito = {
    exp?: number;
    gold?: number;
    chest?: string | null;
    ornament?: string | null;
    item?: string;
    items?: string[];
    rewardDetails?: Array<{ category?: string; itemId?: string; name?: string }>;
};

export const buildAchievementRewardPayload = (
    titulo: string,
    mensagem: string,
    sobrancelha: string,
    premio: PremioDeFeito | null | undefined,
): RewardModalPayload => {
    const recompensa = premio || {};

    const metricCards: RewardMetricCard[] = [];
    if (Number(recompensa.exp) > 0) {
        metricCards.push({ label: 'EXP', simbolo: 'exp', value: `+${Number(recompensa.exp).toLocaleString('pt-BR')}` });
    }
    if (Number(recompensa.gold) > 0) {
        metricCards.push({ label: 'Ouro', simbolo: 'ouro', value: `+${Number(recompensa.gold)}` });
    }
    if (recompensa.chest) {
        // O nome da raridade, nao a chave: "Season" virava titulo na tela.
        metricCards.push({ label: 'Baú', value: getChestVisual(recompensa.chest).label, detail: 'no Arsenal' });
    }

    // Tres caminhos entregam item, e um feito pode usar mais de um ao mesmo
    // tempo. Sem o Set, o mesmo item aparecia duas vezes na grade.
    const ids = new Set<string>();
    (recompensa.items || (recompensa.item ? [recompensa.item] : [])).forEach((id) => {
        if (id) ids.add(String(id));
    });
    (recompensa.rewardDetails || []).forEach((detalhe) => {
        if (detalhe?.itemId) ids.add(String(detalhe.itemId));
    });
    if (recompensa.ornament) ids.add(String(recompensa.ornament));

    return {
        eyebrow: sobrancelha,
        title: titulo,
        summary: mensagem,
        buttonLabel: 'Prosseguir',
        itemSectionTitle: 'Itens recebidos',
        // Sem itens o modal nao mostra caixa nenhuma: o feito em si ja e o
        // conteudo, e "nenhum item novo" nao e informacao que alguem precise.
        emptyMessage: '',
        itemIds: [...ids],
        metricCards,
    };
};
