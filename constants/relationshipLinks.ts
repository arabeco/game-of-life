import type { RelationshipLinkType } from '../types';

// Prices mirror relationship_lifecycle_v3.sql. Selection changes are included.
export const RELATIONSHIP_LINK_BASE_PRICE: Record<RelationshipLinkType, number> = {
    mentoria: 75, parceria: 50, competicao: 50,
};
export const RELATIONSHIP_EXTRA_SLOT_PRICE = 0;
export const RELATIONSHIP_LINK_DURATION_DAYS = 30;
export const RELATIONSHIP_RENEWAL_DISCOUNT = 0.5;
export const getRelationshipLinkPrice = (type: RelationshipLinkType, _slots = 1): number => RELATIONSHIP_LINK_BASE_PRICE[type];
export const getRelationshipRenewalPrice = (type: RelationshipLinkType, _slots = 1): number => type === 'mentoria' ? 40 : 25;
export const getRelationshipDefaultSlots = (_type: RelationshipLinkType): number => 1;

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
