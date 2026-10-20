/**
 * Roupas redesenhadas contra body_masc_1: o punho e a mao pertencem a camadas
 * diferentes. O antebraco da roupa fica na frente do corpo, mas a mao original
 * volta por cima da abertura da manga. Valores no quadro-base de 500x500.
 */
export const HAND_FRONT_CUTOFF: Record<string, number> = {
    'SKIN_SEASON_ZENITE_I.png': 246,
    'SKIN_SEASON_ECLIPSE_I.png': 246,
    'SKIN_SEASON_EGIDE_I.png': 246,
    'SKIN_SEASON_AURORA_II.png': 246,
    'SKIN_SEASON_ZENITE_II.png': 246,

    'SKIN_T2_CAVALEIRO.png': 248,
    'SKIN_T2_TRILHA.png': 248,
    'SKIN_T4_REI.png': 248,
    'SKIN_T3_DUQUE.png': 248,
    'SKIN_T3_NOTURNO.png': 248,
    'SKIN_T3_INVERNO.png': 248,
    'SKIN_T2_BARAO.png': 248,
    'SKIN_T3_CONDE.png': 246,
    'SKIN_T4_PRINCIPE.png': 246,
    'SKIN_T5_SOBERANO.png': 254,
    'SKIN_T1_ESCUDEIRO.png': 246,
    'SKIN_T1_CHUVA.png': 248,
    'SKIN_T4_EMPREENDEDOR.png': 248,
    'SKIN_T2_OFICINA.png': 210,
    'SKIN_T3_ATELIE.png': 187,
};

export const getHandFrontCutoff = (url?: string | null): number | undefined => {
    if (!url) return undefined;
    const name = decodeURIComponent(url.split('?')[0].split('/').pop() || '');
    return HAND_FRONT_CUTOFF[name];
};

/** Redesenha so as maos, sem alterar o resto do corpo ou os offsets da roupa. */
export const drawHandsInFront = (
    target: CanvasRenderingContext2D,
    bodyLayer: HTMLCanvasElement,
    outfitUrl: string | null | undefined,
    width: number,
    height: number,
): void => {
    const cutoff = getHandFrontCutoff(outfitUrl);
    if (cutoff === undefined) return;
    // As candidatas de temporada deixam a lateral da saia livre: excluir a coxa
    // da faixa das mãos evita restaurar uma tira do corpo junto ao punho.
    const seasonReview = /SKIN_SEASON_(ZENITE_I|ECLIPSE_I|EGIDE_I|AURORA_II|ZENITE_II)\.png(?:\?|$)/.test(outfitUrl || '');
    const leftEdge = seasonReview ? 194 : 199;
    const rightEdge = seasonReview ? 302 : 296;
    target.save();
    target.beginPath();
    target.rect(0, height * cutoff / 500, width * leftEdge / 500, height * (290 - cutoff) / 500);
    target.rect(width * rightEdge / 500, height * cutoff / 500, width * (500 - rightEdge) / 500, height * (290 - cutoff) / 500);
    target.clip();
    target.drawImage(bodyLayer, 0, 0);
    target.restore();
};
