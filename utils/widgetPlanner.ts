import type { Action, Arena, ScheduledTask } from '../types';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals.ts';
import { OPERATIONAL_DAY_START_MINUTE, getTaskDisplayStartTime, taskMatchesOperationalDate } from './operationalDay.js';
import { getArenaDomainFlags, hasScheduledTime } from './taskDomain.js';

/**
 * O PLANNER DO DIA QUE VAI PARA O WIDGET (13/10/2026).
 *
 * O widget e Java puro, fora da WebView: nao roda CSS nem conhece o app. Por
 * isso tudo chega pronto daqui — o inicio em minutos desde o comeco do dia do
 * planner (04:00), a duracao, o estado e as duas cores do degrade do bloco, ja
 * misturadas como o `color-mix` do app faz (buildAssetActionGradient, em
 * GameContext, e os --quest-grad-* do index.css).
 */
export interface BlocoDoWidget {
    nome: string;
    arena: string;
    icone: string;
    inicio: number;
    duracao: number;
    feita: boolean;
    marco: boolean;
    /** Acao Livre: o planner desenha como pilula. */
    livre: boolean;
    /** Tem lembrete; o planner mostra o sininho enquanto nao foi feita. */
    lembrete: boolean;
    cores: [string, string];
}

const hex = (cor: string): [number, number, number] => {
    const limpo = cor.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(limpo.slice(i, i + 2), 16)) as [number, number, number];
};

/** `color-mix(in srgb, A p%, B)`. */
export const misturarCor = (a: string, porcento: number, b: string): string => {
    const [ra, ga, ba] = hex(a);
    const [rb, gb, bb] = hex(b);
    const p = porcento / 100;
    return '#' + [ra * p + rb * (1 - p), ga * p + gb * (1 - p), ba * p + bb * (1 - p)]
        .map((v) => Math.round(v).toString(16).padStart(2, '0'))
        .join('');
};

const degradeDe = (corA: string, pA: number, corB: string, pB: number): [string, string] =>
    [misturarCor(corA, pA, '#10141b'), misturarCor(corB, pB, '#111827')];

const coresDoBloco = (arena: Arena | undefined): [string, string] => {
    if (arena) {
        const flags = getArenaDomainFlags(arena);
        if (flags.isSeasonQuest) return degradeDe('#7928CA', 52, '#00DFD8', 40);
        if (flags.isClanQuest) return degradeDe('#14B8A6', 50, '#14B8A6', 72);
        if (flags.isSideQuest) return degradeDe('#22C55E', 50, '#22C55E', 72);
    }
    const acento = (ASSET_ACCENT_COLORS as Record<string, string>)[arena?.assetId || ''] || '#5d6874';
    return degradeDe(acento, 50, acento, 72);
};

export function montarPlannerDoWidget({ tasks, actions, arenas, dataOperacional }: {
    tasks: ScheduledTask[];
    actions: Action[];
    arenas: Arena[];
    dataOperacional: string;
}): { blocos: BlocoDoWidget[]; tempoRegistradoMin: number; diaComecaEm: number } {
    const acaoPorId = new Map(actions.map((acao) => [acao.id, acao]));
    const arenaPorId = new Map(arenas.map((arena) => [arena.id, arena]));
    const doDia = tasks.filter((task) => taskMatchesOperationalDate(task, dataOperacional));

    const blocos = doDia
        .filter((task) => hasScheduledTime(task))
        .map((task) => {
            const acao = acaoPorId.get(task.actionId);
            const duracao = Number.isFinite(task.duration) && task.duration > 0 ? task.duration : (acao?.duration || 30);
            return {
                nome: acao?.name || 'Ação',
                arena: acao ? (arenaPorId.get(acao.arenaId)?.name || 'Sem arena') : 'Sem arena',
                icone: acao?.icon || '•',
                inicio: getTaskDisplayStartTime(task, dataOperacional) - OPERATIONAL_DAY_START_MINUTE,
                duracao,
                feita: Boolean(task.completed),
                marco: acao?.actionType === 'Marco',
                livre: acao?.actionType === 'Livre',
                // A mesma regra do PlannerView: o lembrete da ocorrencia manda;
                // sem ele, vale o aviso configurado na acao.
                lembrete: task.reminderEnabled === false
                    ? false
                    : task.reminderEnabled === true || Number(acao?.context?.schedule?.notifyBeforeMinutes) > 0,
                cores: coresDoBloco(acao ? arenaPorId.get(acao.arenaId) : undefined),
            };
        })
        .sort((a, b) => a.inicio - b.inicio)
        // Teto so para o snapshot nao virar payload gigante num dia fora do comum.
        .slice(0, 60);

    const tempoRegistradoMin = doDia
        .filter((task) => task.completed)
        .reduce((soma, task) => soma + Math.max(0, Math.round(Number(task.duration) || acaoPorId.get(task.actionId)?.duration || 0)), 0);

    return { blocos, tempoRegistradoMin, diaComecaEm: OPERATIONAL_DAY_START_MINUTE };
}
