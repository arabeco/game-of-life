import React from 'react';
import { formatDate } from '../utils/dateUtils';
import { getMetalRankPalette, getPlateFinish, TEXTURA_POR_PATAMAR } from './MetalReportCard';

interface CycleSummaryCardProps {
    cycleSummary: {
        name: string;
        startDate: string;
        endDate: string;
        totalCompleted: number;
        totalPlanned: number;
        progress: number;
        elapsedDays: number;
        timeProgress: number;
        statusLabel: string;
    } | null;
    rank?: string;
    buttonRef?: React.Ref<HTMLButtonElement>;
    onOpenHistory: () => void;
}

const CYCLE_WIDGET_CLIP_PATH = 'polygon(5% 0, 95% 0, 100% 20%, 100% 80%, 95% 100%, 5% 100%, 0 80%, 0 20%)';

export const CycleSummaryCard: React.FC<CycleSummaryCardProps> = ({ cycleSummary, rank, buttonRef, onOpenHistory }) => {
    const patamarDoCiclo = rank ? getMetalRankPalette(rank) : null;
    /*
     * O acabamento do mini ciclo e a mesma peca do widget Android:
     * a face identifica o patamar, a borda e o fio claro dao o volume.
     * Sem ciclo, cai no ouro padrao que o widget usa enquanto aguarda dados.
     */
    const cycleWidgetFinish = patamarDoCiclo
        ? getPlateFinish(patamarDoCiclo.rank)
        : getPlateFinish('A');
    const cycleWidgetFrameBackground = `linear-gradient(118deg, ${cycleWidgetFinish.dark} 0%, ${cycleWidgetFinish.pale} 12%, ${cycleWidgetFinish.mid} 40%, ${cycleWidgetFinish.pale} 52%, ${cycleWidgetFinish.dark} 84%, ${cycleWidgetFinish.pale} 100%)`;
    /*
     * A PEDRA TAMBEM AQUI — ESTE CARD E O ORIGINAL QUE O WIDGET IMITA.
     *
     * A ficha grande ganhou textura, o widget ganhou textura, e este ficou com
     * a face de gradiente: o unico dos tres sem pedra, sendo justamente o que
     * os outros dois copiam.
     *
     * A ordem das camadas importa: no CSS a primeira da lista fica POR CIMA.
     * Entao vem o veu, depois a pedra, e so entao os gradientes de antes, que
     * seguem dando a chapa escura sob os cantos que a foto nao alcanca.
     *
     * O veu e o mesmo 42% do widget, pela mesma razao: este card tambem e
     * estreito, com barras finas e texto pequeno sobre a mesma foto.
     */
    const pedraDoCiclo = patamarDoCiclo ? TEXTURA_POR_PATAMAR[patamarDoCiclo.rank] : undefined;
    const cycleWidgetFaceBackground = [
        ...(pedraDoCiclo ? [
            'linear-gradient(rgba(6, 8, 12, 0.42), rgba(6, 8, 12, 0.42))',
            `url("${pedraDoCiclo}") center / cover no-repeat`,
        ] : []),
        `radial-gradient(circle at 45% 0%, ${cycleWidgetFinish.mid}2a 0%, transparent 44%)`,
        `linear-gradient(135deg, ${cycleWidgetFinish.mid}0e 0%, transparent 35%, ${cycleWidgetFinish.mid}07 72%, transparent 100%)`,
        `radial-gradient(circle at 45% 10%, ${cycleWidgetFinish.face} 0%, #090a0c 66%, #111315 100%)`,
    ].join(', ');
    const cycleWidgetProgressBackground = `linear-gradient(90deg, ${cycleWidgetFinish.dark} 0%, ${cycleWidgetFinish.mid} 55%, ${cycleWidgetFinish.pale} 100%)`;
    const cycleWidgetTimeFinish = getPlateFinish('B');
    const cycleWidgetTimeBackground = `linear-gradient(90deg, ${cycleWidgetTimeFinish.dark} 0%, ${cycleWidgetTimeFinish.mid} 55%, ${cycleWidgetTimeFinish.pale} 100%)`;
    const cycleWidgetTitleColor = cycleWidgetFinish.pale;
    const cycleWidgetMetaColor = '#a8b6c9';
    const cycleWidgetSubtitleColor = '#c7d1df';

    return (
    <button
        ref={buttonRef}
        type="button"
        onClick={onOpenHistory}
        aria-label={cycleSummary ? `Abrir histórico do ciclo ${cycleSummary.name}` : 'Abrir histórico de ciclos'}
        /*
         * `flex-col justify-center` pelo mesmo motivo do
         * android:gravity="center_vertical" no widget.
         *
         * A placa tem 68px de altura minima e o conteudo
         * soma ~42: titulo, as duas linhas de rotulo e as
         * duas barras de 3px. Como bloco, tudo isso
         * encostava no topo e os ~18px que sobravam viravam
         * uma faixa vazia embaixo da barra de tempo — o
         * cartao parecia cortado pela metade.
         *
         * Este card e o ORIGINAL que o widget imita, entao
         * os dois tinham o mesmo defeito pela mesma razao, e
         * agora repartem a folga da mesma forma.
         */
        className={`group relative flex flex-col justify-center overflow-hidden px-3 text-left transition-all duration-300 hover:-translate-y-[1px] ${cycleSummary ? 'pb-1 pt-1' : 'py-2'}`}
        style={{
            width: cycleSummary ? '96%' : '82%',
            maxWidth: cycleSummary ? '460px' : '300px',
            clipPath: CYCLE_WIDGET_CLIP_PATH,
            background: cycleWidgetFrameBackground,
            filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.32))',
            minHeight: cycleSummary ? '68px' : '42px',
        }}
    >
        <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[3px]"
            style={{ clipPath: CYCLE_WIDGET_CLIP_PATH, background: cycleWidgetFaceBackground }}
        />
        <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[5px]"
            style={{
                clipPath: CYCLE_WIDGET_CLIP_PATH,
                border: `1px solid ${cycleWidgetFinish.pale}38`,
            }}
        />
        {cycleSummary ? (
            <div className="relative z-10 space-y-0.5">
                <div className="relative flex min-h-[14px] items-center gap-1.5 px-8">
                    <span className="absolute left-0 top-1/2 max-w-[86px] -translate-y-1/2 truncate text-left text-[8px] font-black tracking-[0.02em]" style={{ color: cycleWidgetMetaColor }}>
                        {`${formatDate(cycleSummary.startDate)}-${formatDate(cycleSummary.endDate)}`}
                    </span>
                    <span className="h-px min-w-0 flex-1" style={{ background: `linear-gradient(90deg, transparent, ${cycleWidgetFinish.pale}b8)` }} />
                    <h3 className="max-w-[200px] truncate text-center text-[10px] font-black uppercase tracking-[0.09em]" style={{ color: cycleWidgetTitleColor }}>
                        {cycleSummary.name}
                    </h3>
                    <span className="h-px min-w-0 flex-1" style={{ background: `linear-gradient(90deg, ${cycleWidgetFinish.pale}b8, transparent)` }} />
                </div>
                <div className="space-y-0.5 px-1">
                    <div>
                        <div className="flex items-center justify-between gap-2 text-[7px] font-black uppercase tracking-[0.08em]">
                            <span style={{ color: cycleWidgetMetaColor }}>Progresso</span>
                            <span className="shrink-0" style={{ color: '#f7f3e9' }}>{`${cycleSummary.totalCompleted}/${cycleSummary.totalPlanned} (${cycleSummary.progress}%)`}</span>
                        </div>
                        <div className="mt-0.5 h-[3px] w-full overflow-hidden rounded-full bg-black/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${cycleSummary.progress}%`,
                                    background: cycleWidgetProgressBackground,
                                    boxShadow: `0 0 10px ${cycleWidgetFinish.pale}55, 0 0 2px rgba(255,255,255,0.72)`,
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between gap-2 text-[7px] font-black uppercase tracking-[0.08em]">
                            <span style={{ color: cycleWidgetMetaColor }}>Tempo</span>
                            <span className="shrink-0" style={{ color: cycleWidgetSubtitleColor }} title={`${cycleSummary.elapsedDays} dias encerrados (${cycleSummary.timeProgress}%)`}>{cycleSummary.statusLabel}</span>
                        </div>
                        <div className="mt-0.5 h-[3px] w-full overflow-hidden rounded-full bg-black/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${cycleSummary.timeProgress}%`,
                                    background: cycleWidgetTimeBackground,
                                    boxShadow: '0 0 10px rgba(226,237,255,0.34), 0 0 2px rgba(255,255,255,0.68)',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="relative z-10 min-h-[26px]">
                <div className="mx-auto min-w-0 max-w-[150px] text-center">
                    <h3 className="truncate text-[10px] font-black uppercase tracking-[0.09em]" style={{ color: cycleWidgetTitleColor }}>
                        Sem ciclo ativo
                    </h3>
                    <p className="text-[7px] font-semibold uppercase tracking-[0.08em]" style={{ color: cycleWidgetMetaColor }}>
                        Historico
                    </p>
                </div>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-[0.08em]" style={{ color: cycleWidgetMetaColor }}>
                    Abrir
                </span>
            </div>
        )}
    </button>
    );
};
