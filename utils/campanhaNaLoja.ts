/**
 * A CAMPANHA QUE O ORACULO RECOMENDOU, ABERTA NA LOJA (13/10/2026).
 *
 * O quiz mora no Oraculo, mas a compra e na loja: antes de gastar, a pessoa
 * quer ver as outras. "Ver na loja" guarda qual campanha abrir e manda a loja
 * para Campanhas; a loja (CodexStore), ao montar ou ao receber o aviso, abre a
 * ficha dessa campanha.
 */
export const EVENTO_CAMPANHA_NA_LOJA = 'abrir-campanha-na-loja';

let pendente: string | null = null;

export function abrirCampanhaNaLoja(catalogId?: string | null): void {
    pendente = catalogId || null;
    window.dispatchEvent(new CustomEvent('navigate-to-store', { detail: { tab: 'codexes' } }));
    window.dispatchEvent(new CustomEvent(EVENTO_CAMPANHA_NA_LOJA));
}

/** Qual campanha abrir, sem esquecer: a loja so limpa quando conseguiu abrir. */
export const olharCampanhaPendente = (): string | null => pendente;

export const esquecerCampanhaPendente = (): void => { pendente = null; };
