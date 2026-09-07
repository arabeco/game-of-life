/**
 * "TEM UMA TELA CHEIA ABERTA AQUI EMBAIXO."
 *
 * O AuthenticatedApp segura os modais de celebracao enquanto existe algo
 * bloqueando a tela — perfil, relatorios, tela de descanso. Ele sabe desses tres
 * porque eles moram nele.
 *
 * O DailyPanelModal nao mora. Ele nasce dentro do PlannerView, fundo na arvore, e o
 * app nunca soube que ele existia. O resultado aparecia na primeira abertura: a
 * pessoa completava a missao inicial e o "MISSAO CONCLUIDA" empilhava por cima do
 * RESUMO DIARIO, antes dela ter lido o proprio dia.
 *
 * Passar uma prop por toda a arvore para resolver isso seria pior que o problema.
 * Este anuncio existe para quem esta longe demais para ser perguntado.
 *
 * NAO use isto para overlay que o AuthenticatedApp ja controla — ali a prop
 * direta continua sendo a resposta certa, porque ela nao pode dessincronizar.
 */
export const BLOCKING_OVERLAY_EVENT = 'glyph:blocking-overlay';

export type BlockingOverlayDetail = { visible: boolean };

export const announceBlockingOverlay = (visible: boolean): void => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
        new CustomEvent<BlockingOverlayDetail>(BLOCKING_OVERLAY_EVENT, { detail: { visible } })
    );
};
