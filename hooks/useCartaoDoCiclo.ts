import { useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import type { Cycle } from '../types';
import { buildCycleWidgetSnapshot } from '../utils/widgetSnapshots';
import { useOperationalDate } from './useOperationalDate';

/**
 * O CARTAO DO CICLO TEM UMA FONTE SO (11/10/2026).
 *
 * O cartao aparece em Ativos e em Arenas, e o widget mostra a mesma ficha na
 * tela inicial. Ativos montava os numeros por conta propria; Arenas e o widget
 * usavam o retrato do widget. Agora os tres saem de `buildCycleWidgetSnapshot`,
 * com as mesmas entradas que o GameContext manda para o widget (todas as
 * tarefas, todas as acoes, todas as arenas) — o mesmo numero nos tres lugares.
 */
export const useCartaoDoCiclo = (cycle: Cycle | null | undefined) => {
    const { tasks, actions, assets } = useGame();
    const todayDate = useOperationalDate();
    const arenas = useMemo(() => assets.flatMap((asset) => asset.arenas || []), [assets]);

    return useMemo(() => {
        if (!cycle) return null;
        const snapshot = buildCycleWidgetSnapshot({ cycle, tasks, actions, arenas, todayDate });
        if (!snapshot) return null;
        return {
            rank: snapshot.grade,
            cycleSummary: {
                name: snapshot.name,
                startDate: snapshot.startDate,
                endDate: snapshot.endDate,
                totalCompleted: snapshot.completedTaskCount,
                totalPlanned: snapshot.totalTaskCount,
                progress: Math.round(snapshot.taskProgressPercent),
                elapsedDays: snapshot.elapsedDays,
                timeProgress: Math.round(snapshot.timeProgressPercent),
                statusLabel: snapshot.timingLabel,
            },
        };
    }, [actions, arenas, cycle, tasks, todayDate]);
};
