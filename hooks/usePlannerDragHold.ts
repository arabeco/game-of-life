import { useState } from 'react';
import { useLongPress } from './useLongPress';

/*
 * PEGAR E SEGURAR NO PLANNER: UM GESTO SO, COM DOIS TEMPOS.
 *
 * Cinco pecas se arrastam no planner — a tarefa do dia, a da semana, o cartao
 * da lista, a acao e o marco da baia — e cada uma tinha o proprio relogio:
 * 420, 420, 260, 300 e 300ms. Duas delas nem pediam segurar para arrastar no
 * toque, entao varrer a baia para o lado arrastava o marco em vez de rolar.
 *
 * E em todas o hold que liberava o arrasto era o MESMO que comecava a encher a
 * conclusao: para mover uma tarefa, a pessoa via ela comecar a se concluir.
 * Relatado em 05/10/2026: o hold demora demais, e a peca precisa "ficar no
 * dedo" para se ver que ja pegou — sem confundir com o hold de conclusao.
 *
 * Agora sao dois tempos, iguais nas cinco:
 *
 *   PEGAR      aos 240ms a peca sobe no dedo (`erguido`). Daqui em diante,
 *              mexer o dedo arrasta. Soltar sem mexer devolve a peca — nao e
 *              toque, nao abre nada.
 *   SEGURAR    se o dedo continuar parado ate 640ms, a peca desce e comeca a
 *              encher: e a conclusao, com o mesmo tempo de enchimento que
 *              cada peca ja tinha. Mexer enquanto enche cancela e arrasta.
 *
 * Subir e arrastar, encher e concluir — duas formas diferentes para dois
 * gestos diferentes, separadas por 400ms de dedo parado.
 *
 * Varrer sem segurar continua rolando a tela: o arrasto so existe depois de
 * pegar.
 */
export const PLANNER_PEGAR_MS = 240;
export const PLANNER_SEGURAR_MS = 640;

/*
 * QUANTO O ENCHIMENTO LEVA, DEPOIS DE COMECAR.
 *
 * O total de concluir segurando e SEGURAR + ENCHER. Pedido em 05/10/2026:
 * 2,0s no planner e 1,3s na baia.
 *
 * E a BARRA le o mesmo numero que o timer. Ate aqui a animacao de enchimento
 * durava 3s em todas as pecas, enquanto a tarefa concluia em 1,8s e a acao da
 * baia em 1s — a barra mostrava 60% e 33% e pulava para concluido. Quem segura
 * olha a barra para saber quando soltar; ela tem de chegar ao fim quando a
 * coisa conclui, nem antes nem depois.
 *
 * Desmarcar continua longo de proposito: desfazer o que ja foi feito nao pode
 * acontecer por um dedo distraido.
 */
export const PLANNER_ENCHER_MS = 1360;
export const BAIA_ENCHER_MS = 660;
export const DESMARCAR_ENCHER_MS = 3000;

interface PlannerDragHoldOptions {
    /** Toque curto: abrir a peca. */
    onTap: () => void;
    /** Comecou a arrastar. Sem ele, a peca nao pega — so toca e segura. */
    onDrag?: (event: MouseEvent | TouchEvent) => void;
    /** O dedo ficou parado depois de pegar: comeca a encher a conclusao. */
    onHoldStart?: () => void;
    /** O enchimento parou antes do fim — soltou ou passou a arrastar. */
    onHoldCancel?: () => void;
    dragThreshold?: number;
}

export const usePlannerDragHold = ({
    onTap,
    onDrag,
    onHoldStart,
    onHoldCancel,
    dragThreshold = 12,
}: PlannerDragHoldOptions) => {
    const [erguido, setErguido] = useState(false);

    const events = useLongPress({
        armDelay: onDrag ? PLANNER_PEGAR_MS : undefined,
        onArm: () => setErguido(true),
        onArmCancel: () => setErguido(false),
        delay: PLANNER_SEGURAR_MS,
        onLongPress: onHoldStart
            ? () => {
                // A peca desce ANTES de encher: subida e enchimento nao podem
                // aparecer juntos, senao os dois gestos voltam a se confundir.
                setErguido(false);
                onHoldStart();
            }
            : undefined,
        onLongPressCancel: onHoldCancel,
        onLongPressRelease: onHoldCancel,
        onClick: onTap,
        onDragStart: onDrag,
        dragThreshold,
        preventDefaultOnTouch: false,
        touchDragRequiresLongPress: true,
    });

    return { events, erguido };
};
