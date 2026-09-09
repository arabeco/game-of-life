import type { Action, ScheduledTask } from '../types';

/**
 * Os MINUTOS que a acao concluida custou. Livre inclusive: ela foi executada,
 * ocupou o tempo, so nao pontua.
 */
export const getTaskMinutes = (task: ScheduledTask, action?: Action | null): number => {
    const duration = Number.isFinite(task.duration) ? Number(task.duration) : Number(action?.duration || 0);
    return Math.max(0, Math.round(duration));
};

/**
 * A EXP de uma acao concluida.
 *
 * A conta morava dentro do painel diario, onde so ele enxergava. A ficha da
 * area precisa do mesmo numero, e duas copias da mesma regra e como duas
 * regras: uma hora uma delas muda sozinha.
 *
 * EXP NAO E TEMPO, e a diferenca aparece nos dois sentidos:
 *
 *  - PARA MENOS: acao Livre nao pontua. Ela e registro, nao entrega agendada,
 *    entao o tempo dela existe e a EXP dela nao. Quem soma EXP achando que soma
 *    tempo perde exatamente essas horas.
 *  - PARA MAIS: o bonus de assinatura (getCycleXpBonusRate) entra no FECHO do
 *    ciclo ou da rodada, sobre o acumulado — nao aqui. Entao esta funcao devolve
 *    a EXP BASE, e o que cai na conta no fim e maior que a soma destes numeros.
 *
 * Ou seja: tempo executado, EXP do dia e EXP recebida sao tres numeros
 * diferentes. Nenhuma tela pode usar um deles como se fosse outro.
 */
export const getTaskExp = (task: ScheduledTask, action?: Action | null): number => {
    if (action?.actionType === 'Livre') return 0;
    return getTaskMinutes(task, action);
};
