/**
 * O MAPA DA VIBRACAO (15/10/2026). Puro: sem plugin, para poder testar.
 *
 * Cada sinal do app (os mesmos de useSensoryFeedback) vira um TOQUE nativo do
 * @capacitor/haptics. Os dois marcos raros (level_up e streak_milestone) ficam
 * de fora de proposito: eles tem um desenho proprio, longo, que a pessoa deve
 * reconhecer na segunda vez — esses continuam no padrao de vibracao.
 */
export type ToqueNativo = 'leve' | 'medio' | 'forte' | 'passo' | 'sucesso' | 'aviso' | 'erro';

export type SinalDeFeedback =
    | 'streak_milestone' | 'click' | 'click_soft' | 'click_crisp' | 'click_metal'
    | 'success' | 'error' | 'warning' | 'impact' | 'whoosh' | 'fanfare' | 'notification' | 'level_up'
    | 'drag_step' | 'drop' | 'drag_cancel';

export const TOQUE_DO_SINAL: Record<SinalDeFeedback, ToqueNativo | null> = {
    click: 'leve',
    click_soft: 'leve',
    click_crisp: 'leve',
    click_metal: 'leve',
    whoosh: 'leve',
    impact: 'medio',
    notification: 'aviso',
    success: 'sucesso',
    warning: 'aviso',
    error: 'erro',
    fanfare: null,
    level_up: null,
    streak_milestone: null,
    // O arraste do planner: um tique a cada horario novo, medio ao soltar num
    // lugar, leve ao cancelar. Pegar ja vibra pelo onArm (click_soft).
    drag_step: 'passo',
    drop: 'medio',
    drag_cancel: 'leve',
};

export interface EstadoDoArraste {
    arrastando: boolean;
    /** Onde o cartao cairia agora (horario, dia, baia); null fora de qualquer alvo. */
    alvo: string | null;
}

/** O toque que a mudanca de estado do arraste pede, ou null. */
export function decidirToqueDoArraste(anterior: EstadoDoArraste, atual: EstadoDoArraste): SinalDeFeedback | null {
    if (anterior.arrastando && !atual.arrastando) return anterior.alvo ? 'drop' : 'drag_cancel';
    if (!atual.arrastando) return null;
    if (anterior.arrastando && anterior.alvo && atual.alvo && atual.alvo !== anterior.alvo) return 'drag_step';
    return null;
}
