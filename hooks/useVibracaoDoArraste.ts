import { useEffect, useRef } from 'react';
import { useSensoryFeedback } from './useSensoryFeedback';
import { decidirToqueDoArraste, type EstadoDoArraste } from '../utils/hapticsMapa';

/**
 * A VIBRACAO DO ARRASTE NO PLANNER (15/10/2026).
 *
 * Pegar ja vibra pelo onArm de usePlannerDragHold. Aqui: um tique a cada
 * horario novo (ou dia, ou quadrante da baia) enquanto arrasta, toque medio ao
 * soltar num lugar e leve ao soltar fora. O tique tem um intervalo minimo: no
 * zoom 1x um horario de 15 minutos tem poucos pixels, e passar o dedo rapido
 * viraria um zumbido.
 */
const INTERVALO_MINIMO_DO_TIQUE_MS = 55;

export function useVibracaoDoArraste(arrastando: boolean, alvo: string | null): void {
    const { trigger } = useSensoryFeedback();
    const anterior = useRef<EstadoDoArraste>({ arrastando: false, alvo: null });
    const ultimoTique = useRef(0);

    useEffect(() => {
        const atual: EstadoDoArraste = { arrastando, alvo: arrastando ? alvo : null };
        const toque = decidirToqueDoArraste(anterior.current, atual);
        if (toque === 'drag_step') {
            const agora = Date.now();
            if (agora - ultimoTique.current >= INTERVALO_MINIMO_DO_TIQUE_MS) {
                ultimoTique.current = agora;
                trigger(toque);
            }
        } else if (toque) {
            trigger(toque);
        }
        // Ao soltar, o alvo do quadro anterior e o que vale: o mesmo quadro que
        // encerra o arraste ja limpa o indicador.
        anterior.current = atual;
    }, [arrastando, alvo, trigger]);
}
