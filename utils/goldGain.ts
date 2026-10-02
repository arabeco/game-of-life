/**
 * O AVISO DE OURO QUE ENTROU.
 *
 * O credito acontece com o modal de pagamento AINDA ABERTO: a sondagem detecta
 * o ouro, grava no perfil e so 1,6s depois o modal fecha. A barra de moedas
 * fica atras do modal esse tempo todo, entao o numero ja subiu quando a pessoa
 * volta a ve-lo — ela recebe o toast e um saldo maior, mas nao assiste a nada
 * acontecer. O movimento, que e a parte que da gosto, roda escondido.
 *
 * Por isso quem paga nao anuncia no credito, e sim no FECHAMENTO: o aviso sai
 * quando a tela de compra ja saiu da frente, e a barra anima para quem esta
 * olhando.
 *
 * E um evento de janela, e nao uma prop, porque quem credita (o modal de
 * pagamento) e quem desenha (a barra da loja) nao se conhecem e nao deveriam
 * passar a se conhecer so por causa de uma animacao.
 */

export const GOLD_GAIN_EVENT = 'glyph:gold-gained';

export type GoldGainDetail = {
    /** Quanto ENTROU, nao o saldo final. */
    delta: number;
};

export const anunciarGanhoDeOuro = (delta: number): void => {
    if (typeof window === 'undefined') return;
    const quantia = Math.round(Number(delta) || 0);
    // Zero ou negativo nao e ganho. Gasto tem o proprio aviso, e animar uma
    // entrada que nao houve ensina a pessoa a desconfiar da animacao.
    if (quantia <= 0) return;
    window.dispatchEvent(new CustomEvent<GoldGainDetail>(GOLD_GAIN_EVENT, {
        detail: { delta: quantia },
    }));
};
