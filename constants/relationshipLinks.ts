import type { RelationshipLinkType } from '../types';

/**
 * O vinculo como produto: um preco, um prazo, um numero de vagas.
 *
 * O modelo anterior cobrava por ACAO dentro de um vinculo gratuito — 50 para
 * expor arena, 50 por duelo, 100 para forjar campanha. A tela de convite, que
 * era a unica que falava de dinheiro, falava do preco errado: os convites foram
 * zerados em agosto e o texto continuou, chegando a imprimir "cobra 0 no envio,
 * o reembolso acontece se a pessoa recusar". Quem pagava, pagava depois, num
 * momento sobre o qual nada avisava.
 *
 * Agora se paga uma vez, ao criar. Tudo que acontece dentro e de graca.
 *
 * ATENCAO: estes numeros existem em dois lugares. Aqui, que e quem EXIBE, e em
 * `public.relationship_link_price` na migracao
 * 20260826120000_relationship_link_as_timed_product.sql, que e quem COBRA.
 * Mudar um exige mudar o outro — ha teste comparando os dois arquivos.
 */

export const RELATIONSHIP_LINK_BASE_PRICE: Record<RelationshipLinkType, number> = {
    mentoria: 100,
    parceria: 50,
    competicao: 50,
};

/**
 * So a mentoria escala por vaga, e a vaga que ela vende e a de ENTREGAR.
 *
 * Olhar mais uma arena nao custa trabalho a ninguem; produzir uma custa. E
 * parceria e competicao tem forma fixa — uma arena por lado e o par espelhado —
 * entao vaga extra nao significaria nada nelas.
 */
export const RELATIONSHIP_EXTRA_SLOT_PRICE = 50;

export const RELATIONSHIP_LINK_DURATION_DAYS = 30;

/** Renovar sai por metade. Cobrar cheio de novo puniria o caso que deu certo. */
export const RELATIONSHIP_RENEWAL_DISCOUNT = 0.5;

export const getRelationshipLinkPrice = (
    linkType: RelationshipLinkType,
    arenaSlots = 1,
): number => {
    const base = RELATIONSHIP_LINK_BASE_PRICE[linkType] ?? 50;
    const extra = linkType === 'mentoria'
        ? Math.max(0, arenaSlots - 1) * RELATIONSHIP_EXTRA_SLOT_PRICE
        : 0;
    return base + extra;
};

export const getRelationshipRenewalPrice = (
    linkType: RelationshipLinkType,
    arenaSlots = 1,
): number => Math.max(
    1,
    Math.floor(getRelationshipLinkPrice(linkType, arenaSlots) * RELATIONSHIP_RENEWAL_DISCOUNT),
);

/** Quantas arenas cabem por participante quando o vinculo nasce. */
export const getRelationshipDefaultSlots = (_linkType: RelationshipLinkType): number => 1;

export type RelationshipLinkLifecycle = 'ativo' | 'expirado' | 'encerrado';

/**
 * Vencer nao apaga o vinculo, congela.
 *
 * Sumir com o card a meia-noite e o que gera raiva, e destroi justamente a
 * renovacao que se quer vender. Congelado ele continua visivel, mostra o fecho
 * do que aconteceu, e oferece renovar.
 */
export const getRelationshipLifecycle = (
    link: { endedAt?: string | null; expiresAt?: string | null },
    now: Date = new Date(),
): RelationshipLinkLifecycle => {
    if (link.endedAt) return 'encerrado';
    if (!link.expiresAt) return 'ativo';
    return new Date(link.expiresAt).getTime() > now.getTime() ? 'ativo' : 'expirado';
};

/**
 * Dias que faltam, para o selo discreto no canto do card.
 *
 * Arredonda para cima: faltando 4 horas ainda e "1d", nao "0d". Zero e o dia em
 * que vence, e nao existe numero negativo — vencido para de contar e vira
 * "expirado".
 */
export const getRelationshipDaysLeft = (
    link: { endedAt?: string | null; expiresAt?: string | null },
    now: Date = new Date(),
): number | null => {
    if (!link.expiresAt || link.endedAt) return null;
    const remainingMs = new Date(link.expiresAt).getTime() - now.getTime();
    if (remainingMs <= 0) return 0;
    return Math.ceil(remainingMs / 86400000);
};
