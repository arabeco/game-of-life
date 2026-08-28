import type { AppSensoryCue } from '../utils/sensoryCue';

/**
 * A gramatica do toque: tres pesos, e nada fora deles.
 *
 * As dez pistas do app disparavam vibracoes escolhidas uma a uma, no lugar onde
 * cada uma era tratada, e o resultado colidia:
 *
 *   - fechar uma ACAO e fechar um dia de SEQUENCIA vibravam identico;
 *   - fechar uma ARENA e fechar o PAINEL DIARIO vibravam identico;
 *   - fechar um CICLO INTEIRO vibrava igual a fechar o painel diario.
 *
 * O corpo aprende por diferenca. Se coisas de tamanhos diferentes chegam iguais
 * no pulso, ele nao aprende nenhuma — e e justamente o corpo que gera
 * antecipacao, que e o que faz alguem querer voltar.
 *
 * A regra, entao, tem duas metades e as duas importam:
 *
 *   A MESMA coisa sempre vibra igual.
 *   Coisas DIFERENTES nunca vibram igual.
 *
 * Tres pesos bastam porque tres e o que se distingue sem olhar a tela. Mais que
 * isso vira ruido com nome de vocabulario.
 */
export type SensoryWeight = 'toque' | 'fecho' | 'marco' | 'marco_raro';

export const SENSORY_WEIGHT_INTENT: Record<SensoryWeight, string> = {
    toque: 'Registrou. Leve e seco, quase nada — acontece dezenas de vezes por dia.',
    fecho: 'Alguma coisa terminou. Duplo curto, reconhecivel sem ser evento.',
    marco: 'Isto foi grande. Longo, com cauda.',
    marco_raro: 'Isto quase nunca acontece. Reservado aos marcos de sequencia.',
};

/**
 * Todas as pistas, com o peso de cada uma. Tabela unica de proposito: peso
 * escolhido no lugar onde a pista e tratada foi exatamente o que produziu as
 * colisoes acima.
 */
export const SENSORY_GRAMMAR: Record<AppSensoryCue, SensoryWeight> = {
    // Acontece o dia inteiro. Tem de ser quase nada, senao cansa.
    task_complete: 'toque',
    report_chapter: 'toque',

    // Um dia de sequencia nao e uma tarefa a mais: e o dia inteiro fechando.
    daily_streak: 'fecho',
    daily_panel_closed: 'fecho',
    arena_complete: 'fecho',
    report_verdict: 'fecho',
    cycle_seal_start: 'toque',

    // Coisas que acontecem poucas vezes por mes.
    campaign_complete: 'marco',
    report_reward: 'marco',
    // Fechar um ciclo vibrava como fechar o painel diario. E o maior evento do
    // app depois da campanha.
    cycle_complete: 'marco',

    // 7, 14, 30, 60, 100. Raro por definicao, e por isso reconhecivel: se a
    // pessoa sentir isto duas vezes na vida, ela vai saber o que e na segunda.
    streak_milestone: 'marco_raro',
};

/** O peso de uma pista. Desconhecida cai em `toque`: errar para menos nao incomoda ninguem. */
export const getSensoryWeight = (cue: AppSensoryCue): SensoryWeight =>
    SENSORY_GRAMMAR[cue] || 'toque';
