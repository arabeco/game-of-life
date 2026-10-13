/**
 * A REGUA DE ZOOM DO PLANNER (13/10/2026).
 *
 * O 1x novo mostra o dia inteiro: 0,7 da escala do antigo 1x (0,5 -> 0,35 px
 * por minuto), as 24 horas em ~500 px. E a mesma escala do planner do widget
 * (GlyphDayWidgetProvider). Os zooms antigos ficaram iguais e andaram um numero.
 */
export const PLANNER_ZOOMS = [1, 2, 3, 4, 5] as const;
export type PlannerZoom = typeof PLANNER_ZOOMS[number];
export const PLANNER_ZOOM_FACTORS: Record<PlannerZoom, number> = { 1: 0.35, 2: 0.5, 3: 0.75, 4: 1, 5: 1.4 };
export const PLANNER_ZOOM_DIA_INTEIRO = PLANNER_ZOOM_FACTORS[1];

const ZOOM_PADRAO: PlannerZoom = 3;
const ehZoom = (valor: number): valor is PlannerZoom => PLANNER_ZOOMS.includes(valor as PlannerZoom);

/**
 * O zoom salvo. A chave v4 e a regua nova; quem so tem a v3 (regua antiga, 1 a
 * 4) anda um numero, para continuar vendo a mesma escala.
 */
export function lerZoomSalvo(armazenamento: Pick<Storage, 'getItem'> | undefined): PlannerZoom {
    try {
        if (!armazenamento) return ZOOM_PADRAO;
        const novo = Number(armazenamento.getItem('planner_zoom_v4'));
        if (ehZoom(novo)) return novo;
        const antigo = Number(armazenamento.getItem('planner_zoom_v3'));
        if (ehZoom(antigo + 1) && antigo >= 1) return (antigo + 1) as PlannerZoom;
    } catch {
        // armazenamento bloqueado: fica no padrao
    }
    return ZOOM_PADRAO;
}
