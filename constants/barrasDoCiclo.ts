/**
 * AS DUAS BARRAS DO CICLO — UMA RECEITA SO, NO APP E NO WIDGET (11/10/2026).
 *
 * Pedido do Afonso: "dourada e prata, que e a cor que quero, so que brilhante,
 * e igual nos dois". Ate aqui eram duas receitas: no app a barra de progresso
 * mudava de metal com a nota do ciclo; no widget era sempre ouro, com o
 * gradiente espalhado pela largura inteira. Agora:
 *
 *   - PROGRESSO e sempre OURO, TEMPO e sempre PRATA — a nota aparece na pedra e
 *     na moldura, nao na barra;
 *   - o gradiente cobre so o pedaco PREENCHIDO, entao a ponta e sempre a parte
 *     mais clara, ate com pouco progresso;
 *   - um reflexo branco na metade de cima da o brilho de metal polido.
 *
 * O widget (GlyphWidgetPaint.java) repete estes mesmos valores; o teste
 * tests/barras-do-ciclo.regression.mjs confere que os dois nao se separam.
 */

export interface MetalDaBarra {
    escuro: string;
    meio: string;
    claro: string;
}

export const BARRA_OURO: MetalDaBarra = { escuro: '#a8822a', meio: '#f0c95c', claro: '#fff4c4' };
export const BARRA_PRATA: MetalDaBarra = { escuro: '#7f95a3', meio: '#d5e2ea', claro: '#ffffff' };

/** Opacidade do reflexo branco no topo da barra. */
export const REFLEXO_DA_BARRA = 0.55;

/** O preenchimento: reflexo por cima, metal por baixo (no CSS a primeira camada fica por cima). */
export const fundoDaBarra = (metal: MetalDaBarra) => [
    `linear-gradient(180deg, rgba(255,255,255,${REFLEXO_DA_BARRA}) 0%, rgba(255,255,255,0) 55%)`,
    `linear-gradient(90deg, ${metal.escuro} 0%, ${metal.meio} 55%, ${metal.claro} 100%)`,
].join(', ');

/** O halo em volta da barra (so no app: o widget nao desenha fora dos 3dp dele). */
export const haloDaBarra = (metal: MetalDaBarra) => `0 0 8px ${metal.meio}99, 0 0 2px rgba(255,255,255,0.8)`;
