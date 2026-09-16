import { getLegacyCycleGrade } from '../utils/cycleGrade.js';
﻿import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ReportIdentitySnapshot } from '../types';
import { useCallback } from 'react';
import { formatDate, getScoreGrade } from '../utils/dateUtils';
import { EraRibbon, getEraRibbonSkin } from './EraRibbon';
import { RefreshCwIcon } from './Icons';
import { LegacyGrandPlaque } from './LegacyGrandPlaque';
import { MetalReportCard } from './MetalReportCard';
import { MiniCyclePlannerSnapshot } from './MiniCyclePlannerSnapshot';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { getLegacyBackdropSkin, type LegacyBackdropSkinId } from '../constants/legacyBackdropSkins';
import { useLegacyLayoutConfig } from '../hooks/useLegacyLayoutConfig';
import {
    getLegacyPlaqueScale,
    getLegacyPlaqueWidthPx,
    setStoredLegacyLayoutConfig,
    type LegacyLayoutConfig,
} from '../utils/legacyLayoutLab';
import './legacy-ui.css';

interface LegacyProjectionSceneProps {
    id?: string;
    eras: LegacyEraSummary[];
    sovereignName: string;
    projectionActive?: boolean;
    interactive?: boolean;
    showLayoutEditor?: boolean;
    autoAdvance?: boolean;
    enteringProjection?: boolean;
    fallbackIdentity?: ReportIdentitySnapshot;
    backdropSkinId?: LegacyBackdropSkinId;
    onSequenceComplete?: () => void;
    onActivatePlaque?: () => void;
    onOpenCycle?: (cycleId: string) => void;
    onOpenEra?: (era: LegacyEraSummary) => void;
}

const buildFallbackIdentity = (sovereignName: string, fallbackIdentity?: ReportIdentitySnapshot): ReportIdentitySnapshot => ({
    snapshotVersion: fallbackIdentity?.snapshotVersion,
    avatarUrl: fallbackIdentity?.avatarUrl,
    borderId: fallbackIdentity?.borderId,
    bannerUrl: fallbackIdentity?.bannerUrl,
    skinId: fallbackIdentity?.skinId,
    sovereign: fallbackIdentity?.sovereign,
    nickname: fallbackIdentity?.nickname || sovereignName,
    title: fallbackIdentity?.title,
    // Ver LegacyExportKit: zero e nivel, nao ausencia de nivel.
    level: fallbackIdentity?.level ?? 0,
    nobilityRankId: fallbackIdentity?.nobilityRankId,
    nobilityRankName: fallbackIdentity?.nobilityRankName,
    clanName: fallbackIdentity?.clanName || null,
    clanIcon: fallbackIdentity?.clanIcon || null,
    clanRankId: fallbackIdentity?.clanRankId || null,
    clanRankName: fallbackIdentity?.clanRankName || null,
    capturedAt: fallbackIdentity?.capturedAt || new Date().toISOString(),
});

const resolveLegacyIdentity = (
    sovereignName: string,
    fallbackIdentity?: ReportIdentitySnapshot,
    snapshot?: ReportIdentitySnapshot,
): ReportIdentitySnapshot => {
    const fallback = buildFallbackIdentity(sovereignName, fallbackIdentity);
    if (!snapshot) return fallback;

    return {
        snapshotVersion: snapshot.snapshotVersion,
        avatarUrl: snapshot.avatarUrl?.trim() || undefined,
        borderId: snapshot.borderId || undefined,
        bannerUrl: snapshot.bannerUrl || undefined,
        skinId: snapshot.skinId || undefined,
        sovereign: snapshot.sovereign,
        nickname: snapshot.nickname?.trim() || 'Usuario',
        title: snapshot.title?.trim() || undefined,
        // O piso era 1 CRAVADO, nem era acidente de falsy: quem estivesse no
        // degrau 0 das cinco areas aparecia como 1 na projecao do legado, e o
        // Indice renderizava 51 onde devia ser 50.
        level: Math.max(0, Number(snapshot.level ?? 0)),
        nobilityRankId: snapshot.nobilityRankId || undefined,
        nobilityRankName: snapshot.nobilityRankName?.trim() || undefined,
        clanName: snapshot.clanName ?? null,
        clanIcon: snapshot.clanIcon ?? null,
        clanRankId: snapshot.clanRankId ?? null,
        clanRankName: snapshot.clanRankName ?? null,
        capturedAt: snapshot.capturedAt || fallback.capturedAt,
    };
};

const identityKey = (identity: ReportIdentitySnapshot) => [
    identity.nickname,
    identity.level,
    identity.title || '',
    identity.borderId || '',
    identity.skinId || '',
    identity.clanName || '',
    identity.clanRankId || '',
].join('|');

const getChronologyValue = (value?: string | null) => {
    const parsed = value ? new Date(value).getTime() : Number.NaN;
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const formatHoras = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

/**
 * Onde o card comeca, na mesma regua do `scrollLeft` do trilho.
 *
 * Soma os `offsetLeft` subindo ate o trilho em vez de confiar que o pai
 * posicionado e um so: quem e `offsetParent` depende de quais ancestrais tem
 * position/transform, e isso muda entre o retrato e o modo de captura.
 */
const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Mes e ano do inicio de um ciclo, para a regua do tempo. */
const marcoDoCiclo = (isoDate?: string | null) => {
    const data = isoDate ? new Date(`${String(isoDate).slice(0, 10)}T12:00:00`) : null;
    if (!data || Number.isNaN(data.getTime())) return { mes: '', ano: '' };
    return { mes: MESES_CURTOS[data.getMonth()], ano: String(data.getFullYear()) };
};

/**
 * Quantos dias a pessoa passou FORA de ciclo, entre um e o seguinte.
 *
 * Sem isto a regua mente por omissao: duas bolas ligadas por uma linha igual
 * sugerem que um ciclo emendou no outro, e a pausa de tres meses desaparece.
 * Ela faz parte da historia tanto quanto os ciclos.
 */
const intervaloEntreCiclos = (fimAnterior?: string | null, inicioAtual?: string | null) => {
    const fim = fimAnterior ? new Date(`${String(fimAnterior).slice(0, 10)}T12:00:00`) : null;
    const inicio = inicioAtual ? new Date(`${String(inicioAtual).slice(0, 10)}T12:00:00`) : null;
    if (!fim || !inicio || Number.isNaN(fim.getTime()) || Number.isNaN(inicio.getTime())) return 0;
    return Math.max(0, Math.round((inicio.getTime() - fim.getTime()) / 86400000) - 1);
};

/** Quantos dias o ciclo durou, inclusive as duas pontas. */
const duracaoDoCiclo = (inicio?: string | null, fim?: string | null) => {
    const a = inicio ? new Date(`${String(inicio).slice(0, 10)}T12:00:00`) : null;
    const b = fim ? new Date(`${String(fim).slice(0, 10)}T12:00:00`) : null;
    if (!a || !b || Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
};

/** "12 DIAS", "3 MESES" — a unidade acompanha o tamanho da pausa. */
const rotuloDoIntervalo = (dias: number) => {
    if (dias < 45) return `${dias} ${dias === 1 ? 'DIA' : 'DIAS'}`;
    const meses = Math.round(dias / 30);
    return `${meses} ${meses === 1 ? 'MES' : 'MESES'}`;
};

/**
 * Reduz a placa e devolve ao layout o espaco que a reducao liberou.
 *
 * `transform: scale` nao muda o espaco que o elemento OCUPA — ele continua
 * reservando o tamanho original, e a cena continuaria estourando. Este
 * involucro assume o tamanho reduzido e esconde o resto.
 *
 * A LARGURA E DECLARADA, e nao herdada. Na primeira tentativa o involucro nao
 * tinha largura: ele dependia do filho para se medir, o filho dependia dele, e
 * a placa saiu com largura zero — sumiu da tela. Com `transform-origin` no
 * canto superior esquerdo e a largura cravada em `medida * escalaX`, a placa
 * reduzida preenche o involucro exatamente.
 *
 * A ALTURA E MEDIDA, e nao cravada: ela vem do conteudo da placa (trilho,
 * louros, nota, titulo, quatro metricas), e um numero fixo aqui quebraria
 * calado no dia em que aquele componente ganhar mais uma linha.
 */
const PlacaReduzida: React.FC<{ escalaX: number; escalaY: number; children: React.ReactNode }> = ({ escalaX, escalaY, children }) => {
    const alvoRef = useRef<HTMLDivElement | null>(null);
    const [alturaNatural, setAlturaNatural] = useState(0);

    React.useLayoutEffect(() => {
        const alvo = alvoRef.current;
        if (!alvo) return;
        const medir = () => setAlturaNatural(alvo.offsetHeight);
        medir();
        const observador = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
        observador?.observe(alvo);
        return () => observador?.disconnect();
    }, []);

    return (
        <div
            className="shrink-0 overflow-hidden"
            style={{
                width: `${LARGURA_DA_PLACA * escalaX}px`,
                height: alturaNatural ? `${alturaNatural * escalaY}px` : undefined,
            }}
        >
            <div
                ref={alvoRef}
                style={{
                    width: `${LARGURA_DA_PLACA}px`,
                    transform: `scale(${escalaX}, ${escalaY})`,
                    transformOrigin: 'top left',
                }}
            >
                {children}
            </div>
        </div>
    );
};

const posicaoNoTrilho = (card: HTMLElement, scroller: HTMLElement) => {
    let x = 0;
    let node: HTMLElement | null = card;
    while (node && node !== scroller) {
        x += node.offsetLeft;
        node = node.offsetParent as HTMLElement | null;
    }
    return x;
};

const buildLegacyCycleMetrics = (cycle: LegacyEraSummary['cycles'][number]) => {
    const days = (cycle.weeklyAtlas || []).flatMap((week) => week.days || []);
    const totalPlanned = days.reduce((sum, day) => sum + (day.plannedCount || 0), 0);
    const totalCompleted = days.reduce((sum, day) => sum + (day.completedCount || 0), 0);
    const totalMinutes = days.reduce((sum, day) => sum + (day.completedMinutes || 0), 0);
    const activeDays = days.filter((day) => (day.completedCount || 0) > 0).length;
    const progress = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 100;
    const hours = totalMinutes / 60;
    const actionsPerDay = activeDays > 0 ? (totalCompleted / activeDays) : 0;
    const avgHoursPerDay = activeDays > 0 ? (hours / activeDays) : 0;
    const activeDates = days
        .filter((day) => (day.completedCount || 0) > 0)
        .map((day) => day.date)
        .sort();
    let maxStreak = activeDates.length > 0 ? 1 : 0;
    let currentStreak = activeDates.length > 0 ? 1 : 0;
    for (let index = 1; index < activeDates.length; index += 1) {
        const previous = new Date(activeDates[index - 1]).getTime();
        const current = new Date(activeDates[index]).getTime();
        if ((current - previous) <= (24 * 60 * 60 * 1000 * 1.5)) {
            currentStreak += 1;
        } else {
            currentStreak = 1;
        }
        maxStreak = Math.max(maxStreak, currentStreak);
    }

    return {
        progress,
        hours,
        activeDays,
        actionsPerDay,
        totalActions: totalCompleted,
        totalPlanned,
        avgHoursPerDay,
        maxStreak,
    };
};

const LayoutSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
    <label className="space-y-1">
        <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/82">{label}</span>
            <span className="text-[11px] font-bold text-white/72">{value.toFixed(step < 1 ? 2 : 0)}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-[var(--skin-accent-color)]"
        />
    </label>
);

const LEGACY_STAGE_WIDTH = 390;
const LEGACY_STAGE_HEIGHT = 844;

/**
 * O CICLO TEM UM CARD SO, E ELE E O DO HISTORICO.
 *
 * Antes existiam dois desenhos para a mesma coisa: o card do historico
 * (MetalReportCard compacto, 14.15rem) e um LegacyCycleCard exclusivo da cena,
 * de altura fixa em 8rem e largura passada por fora — 88px no modo de captura,
 * 228px no retrato. Mesma altura com duas larguras significa duas PROPORCOES:
 * o mesmo ciclo era um retrato estreito num lugar e uma faixa esticada no
 * outro, e nenhum dos dois batia com o card que a pessoa acabou de ver no
 * historico.
 *
 * Agora a cena usa o mesmo componente e a mesma medida do historico. Nao ha o
 * que sincronizar quando aquele card mudar: e o mesmo card.
 *
 * E vai SEM a classe `legacy-cycle-metal`, de proposito. Ela existe para o card
 * de 88px: encolhe padding, selo e tipografia para caber naquela miniatura.
 * Aplicada num card de 226px o desenho nao muda de proporcao — muda de
 * densidade: as mesmas tripas minusculas espalhadas na largura do historico, o
 * que le como placa larga e vazia em vez de card.
 */
/**
 * A GEOMETRIA DA REGUA, em pixel de palco.
 *
 * Um ciclo e um TRECHO, nao um ponto: barra no inicio, barra no fim, e a bola no
 * meio com quantos dias durou. A linha corre de barra a barra e acaba ali —
 * entre um ciclo e o proximo nao ha ciclo, e o vazio entre os trechos e
 * justamente o que mostra a pausa.
 *
 * O trecho tem largura fixa. Largura proporcional a duracao seria o timeline
 * literal, mas transformaria um ciclo de uma semana num tracinho ilegivel ao
 * lado de um de tres meses — e quem diz a duracao e o numero na bola, que nao
 * depende de medir pixel com regua.
 *
 * As medidas sao generosas de proposito: o trecho do ciclo aberto ocupa quase
 * toda a largura do palco, e do vizinho so aparece a barra espiando na borda.
 * Apertado, o legado inteiro cabia num relance e a passagem de tempo entre um
 * ciclo e outro parecia um passo; assim ela parece o que foi, uma distancia.
 */
const LARGURA_DO_TRECHO = 208;
const VAO_ENTRE_TRECHOS = 78;
const VAO_COM_PAUSA = 168;

/*
 * NA CENA A PLACA E REDUZIDA — INTEIRA, e nao so de largura.
 *
 * A placa de ciclo foi redesenhada e passou a medir 226x382. No palco de 844px
 * da cena isso nao fecha: abaixo da regua sobram ~490px, a placa come 382 e
 * restam ~110 para a foto do planner, que precisa de 206 para desenhar quatro
 * semanas legiveis.
 *
 * Estreitar a largura NAO resolve: a altura da placa vem do conteudo (trilho,
 * louros, nota, titulo e as quatro metricas), nao da proporcao. Diminuir so a
 * largura produziu 196x377 — proporcao 0.52 em vez de 0.59, ou seja, a placa
 * espremida, que e exatamente o que nao pode acontecer com ela.
 *
 * Entao a reducao e por ESCALA, que preserva a proporcao por definicao. O
 * inconveniente da escala e que o elemento continua ocupando o tamanho
 * original no layout; por isso o involucro mede a placa e assume a altura
 * reduzida, devolvendo os pixels de verdade.
 */
const LARGURA_DA_PLACA = 226.4;          // 14.15rem, a medida oficial
// A razao entre as duas e 0.95: a placa fica 5% mais achatada que a original.
// Chegou a 10% — o teto acordado — quando a navegacao no topo comia 44px do
// palco; com ela no rodape esses pixels voltaram, e o achatamento e uma divida
// que se paga assim que sobra espaco, nao um formato novo.
const ESCALA_X_NA_CENA = 0.80;
const ESCALA_Y_NA_CENA = 0.76;

const LEGACY_CYCLE_CARD_CLASS = 'w-[14.15rem] max-w-full';

export const LegacyProjectionScene: React.FC<LegacyProjectionSceneProps> = ({
    id,
    eras,
    sovereignName,
    projectionActive = true,
    interactive = false,
    showLayoutEditor = false,
    autoAdvance = false,
    enteringProjection = false,
    fallbackIdentity,
    backdropSkinId,
    onSequenceComplete,
    onActivatePlaque,
    onOpenCycle,
    onOpenEra,
}) => {
    const orderedEras = useMemo(
        () => [...eras]
            .map((era) => ({
                ...era,
                cycles: [...(era.cycles || [])].sort((left, right) => getChronologyValue(left.startDate || left.endDate) - getChronologyValue(right.startDate || right.endDate)),
            }))
            .sort((left, right) => getChronologyValue(left.startDate || left.endDate || left.cycles?.[0]?.startDate) - getChronologyValue(right.startDate || right.endDate || right.cycles?.[0]?.startDate)),
        [eras]
    );
    const cycleEntries = useMemo(
        () => orderedEras.flatMap((era, eraIndex) => (era.cycles || []).map((cycle, cycleIndex) => ({ era, eraIndex, cycle, cycleIndex }))),
        [orderedEras]
    );
    const backdropSkin = getLegacyBackdropSkin(backdropSkinId);
    const layout = useLegacyLayoutConfig();
    const scenePlaqueWidth = getLegacyPlaqueWidthPx('scene', layout);
    const scenePlaqueScale = getLegacyPlaqueScale('scene', layout);
    const [viewportSize, setViewportSize] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : LEGACY_STAGE_WIDTH,
        height: typeof window !== 'undefined' ? window.innerHeight : LEGACY_STAGE_HEIGHT,
    }));

    const [activeCycleId, setActiveCycleId] = useState<string>(() => {
        if (!cycleEntries.length) return '';
        return cycleEntries[0]?.cycle.id || '';
    });
    const [eraTransitionPulse, setEraTransitionPulse] = useState<string | null>(null);
    const [sequenceCompleted, setSequenceCompleted] = useState(false);
    const [timelineEdgePadding, setTimelineEdgePadding] = useState({ left: 24, right: 24 });
    /**
     * O FILME ANDA SOZINHO ATE ALGUEM ENCOSTAR.
     *
     * A projecao existe para ser assistida: ela percorre os ciclos com pausas
     * diferentes conforme o que vem a seguir (virada de era demora mais que
     * ciclo comum). Mas quem toca na seta, arrasta o trilho ou abre um ciclo
     * parou de assistir e passou a procurar — dali em diante o filme sai da
     * frente em vez de puxar a tela de volta a cada segundo e meio.
     */
    const [filmePausado, setFilmePausado] = useState(false);
    const [layoutEditorOpen, setLayoutEditorOpen] = useState(false);
    const [layoutCopyState, setLayoutCopyState] = useState<'idle' | 'copied' | 'prompt'>('idle');
    const didCompleteRef = useRef(false);
    const timelineScrollRef = useRef<HTMLDivElement | null>(null);
    const timelineContentRef = useRef<HTMLDivElement | null>(null);
    const cycleCardRefs = useRef<Record<string, HTMLButtonElement | HTMLDivElement | null>>({});
    const scrollSyncFrameRef = useRef<number | null>(null);
    const manualScrollTimeoutRef = useRef<number | null>(null);
    const layoutCopyTimeoutRef = useRef<number | null>(null);
    const userIsDraggingTimelineRef = useRef(false);
    const rolagemProgramaticaRef = useRef(0);

    useEffect(() => {
        if (!cycleEntries.length) return;
        if (!cycleEntries.some((entry) => entry.cycle.id === activeCycleId)) {
            setActiveCycleId(cycleEntries[0].cycle.id);
        }
    }, [activeCycleId, cycleEntries]);

    useEffect(() => {
        setSequenceCompleted(false);
        didCompleteRef.current = false;
    }, [eras]);

    const activeEntry = cycleEntries.find((entry) => entry.cycle.id === activeCycleId) || cycleEntries[0];
    const activeIdentity = resolveLegacyIdentity(sovereignName, fallbackIdentity, activeEntry?.cycle.identitySnapshot);
    const currentIdentity = buildFallbackIdentity(sovereignName, fallbackIdentity);
    const displayedPlaqueIdentity = sequenceCompleted ? currentIdentity : activeIdentity;
    const activeIndex = cycleEntries.findIndex((entry) => entry.cycle.id === activeCycleId);
    const noUltimoCiclo = cycleEntries.length > 0 && activeIndex >= cycleEntries.length - 1;

    const concluirSequencia = () => {
        if (didCompleteRef.current) return;
        didCompleteRef.current = true;
        onSequenceComplete?.();
    };

    const jumpToCycle = (nextIndex: number) => {
        setFilmePausado(true);
        const clampedIndex = Math.max(0, Math.min(cycleEntries.length - 1, nextIndex));
        const nextEntry = cycleEntries[clampedIndex];
        if (!nextEntry) return;

        if (activeEntry && nextEntry.era.key !== activeEntry.era.key && nextEntry.era.color) {
            setEraTransitionPulse(nextEntry.era.color);
            window.setTimeout(() => setEraTransitionPulse(null), 720);
        }

        setActiveCycleId(nextEntry.cycle.id);
    };

    /**
     * MEDIR EM COORDENADA DE LAYOUT, NAO EM PIXEL DE TELA.
     *
     * As duas funcoes abaixo comparavam `getBoundingClientRect()` — que ja vem
     * multiplicado por toda transformacao de escala acima na arvore — com
     * `scrollLeft`, que e sempre coordenada propria do elemento, sem escala. No
     * retrato o palco inteiro e escalado para caber no aparelho, entao a conta
     * errava por esse fator: cada correcao chegava a 80% do caminho e so
     * acertava porque o sincronizador de rolagem ficava tentando de novo.
     *
     * `offsetLeft` e `clientWidth` vivem na mesma coordenada do `scrollLeft`.
     * Nao ha fator nenhum para descontar e a conta acerta de primeira — que e o
     * que permite calar o sincronizador durante a rolagem, logo abaixo.
     */
    const getClosestCycleToViewportCenter = useCallback(() => {
        const scroller = timelineScrollRef.current;
        if (!scroller) return null;

        const viewportCenter = scroller.scrollLeft + (scroller.clientWidth / 2);
        let closestCycleId: string | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        cycleEntries.forEach((entry) => {
            const card = cycleCardRefs.current[entry.cycle.id];
            if (!card) return;
            const center = posicaoNoTrilho(card, scroller) + (card.offsetWidth / 2);
            const distance = Math.abs(center - viewportCenter);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestCycleId = entry.cycle.id;
            }
        });

        return closestCycleId;
    }, [cycleEntries]);

    const alignCycleToViewportCenter = useCallback((cycleId: string, behavior: ScrollBehavior = 'smooth') => {
        const scroller = timelineScrollRef.current;
        const card = cycleCardRefs.current[cycleId];
        if (!scroller || !card) return;

        const alvo = posicaoNoTrilho(card, scroller) + (card.offsetWidth / 2) - (scroller.clientWidth / 2);
        const limite = Math.max(scroller.scrollWidth - scroller.clientWidth, 0);
        const destino = Math.min(Math.max(alvo, 0), limite);
        if (Math.abs(destino - scroller.scrollLeft) < 1) return;

        // A rolagem daqui e nossa, nao da pessoa: enquanto ela acontece o
        // sincronizador fica calado (ver handleTimelineScroll). Sem isso ele lia
        // o quadro intermediario da animacao, concluia que o ciclo em foco ainda
        // era o antigo e desfazia o salto — era assim que o "proximo" comia
        // toque quando se tocava duas vezes seguidas.
        rolagemProgramaticaRef.current += 1;
        window.setTimeout(() => {
            rolagemProgramaticaRef.current = Math.max(0, rolagemProgramaticaRef.current - 1);
        }, behavior === 'smooth' ? 620 : 80);

        scroller.scrollTo({ left: destino, behavior });
    }, []);

    const updateLayout = useCallback((patch: Partial<LegacyLayoutConfig>) => {
        setStoredLegacyLayoutConfig({ ...layout, ...patch });
    }, [layout]);

    const snapTimelineToClosestCycle = useCallback((behavior: ScrollBehavior = 'smooth') => {
        const closestCycleId = getClosestCycleToViewportCenter();
        if (!closestCycleId) return;
        setActiveCycleId((current) => (current === closestCycleId ? current : closestCycleId));
        alignCycleToViewportCenter(closestCycleId, behavior);
    }, [alignCycleToViewportCenter, getClosestCycleToViewportCenter]);

    const handleCopyLayoutJson = useCallback(async () => {
        const json = JSON.stringify(layout, null, 2);
        let usedPromptFallback = false;

        try {
            await navigator.clipboard.writeText(json);
        } catch {
            usedPromptFallback = true;
            window.prompt('Copie o JSON do layout', json);
        }

        if (layoutCopyTimeoutRef.current !== null) {
            window.clearTimeout(layoutCopyTimeoutRef.current);
        }
        setLayoutCopyState(usedPromptFallback ? 'prompt' : 'copied');
        layoutCopyTimeoutRef.current = window.setTimeout(() => setLayoutCopyState('idle'), 1400);
    }, [layout]);

    useEffect(() => {
        if (!autoAdvance || filmePausado || !projectionActive || cycleEntries.length <= 1 || sequenceCompleted) return;

        const currentIndex = activeIndex >= 0 ? activeIndex : 0;
        const currentEntry = cycleEntries[currentIndex];
        const nextEntry = cycleEntries[currentIndex + 1];
        const currentIdentity = resolveLegacyIdentity(sovereignName, fallbackIdentity, currentEntry?.cycle.identitySnapshot);
        const nextIdentity = nextEntry
            ? resolveLegacyIdentity(sovereignName, fallbackIdentity, nextEntry.cycle.identitySnapshot)
            : currentIdentity;
        const eraChanged = !!currentEntry && !!nextEntry && currentEntry.era.key !== nextEntry.era.key;
        const identityChanged = identityKey(currentIdentity) !== identityKey(nextIdentity);
        const importantScore = (nextEntry?.cycle.score || currentEntry?.cycle.score || 0) >= 90;
        const delay = eraChanged ? 2400 : identityChanged ? 1900 : importantScore ? 1700 : 1500;

        const timer = window.setTimeout(() => {
            if (!nextEntry) {
                setSequenceCompleted(true);
                if (!didCompleteRef.current) {
                    didCompleteRef.current = true;
                    onSequenceComplete?.();
                }
                return;
            }
            if (eraChanged && nextEntry.era.color) {
                setEraTransitionPulse(nextEntry.era.color);
                window.setTimeout(() => setEraTransitionPulse(null), 720);
            }
            setActiveCycleId(nextEntry.cycle.id);
        }, delay);

        return () => window.clearTimeout(timer);
    }, [activeIndex, activeCycleId, autoAdvance, cycleEntries, fallbackIdentity, filmePausado, onSequenceComplete, projectionActive, sequenceCompleted, sovereignName]);

    React.useLayoutEffect(() => {
        if (!interactive) return;
        const scroller = timelineScrollRef.current;
        const firstCard = cycleCardRefs.current[cycleEntries[0]?.cycle.id || ''];
        if (!scroller || !firstCard) return;

        const updatePadding = () => {
            const scrollerWidth = scroller.clientWidth || 320;
            const cardWidth = firstCard.offsetWidth || 188;
            const edgePadding = Math.max((scrollerWidth - cardWidth) / 2, 18);
            const trailingPadding = edgePadding + Math.max(Math.round(cardWidth * 0.82), 132);

            setTimelineEdgePadding((current) => {
                if (Math.abs(current.left - edgePadding) < 1 && Math.abs(current.right - trailingPadding) < 1) {
                    return current;
                }
                return { left: edgePadding, right: trailingPadding };
            });
        };

        updatePadding();

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => updatePadding())
            : null;

        resizeObserver?.observe(scroller);
        resizeObserver?.observe(firstCard);
        window.addEventListener('resize', updatePadding);

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener('resize', updatePadding);
        };
    }, [cycleEntries, interactive]);

    React.useLayoutEffect(() => {
        if (!interactive || activeIndex < 0 || userIsDraggingTimelineRef.current) return;
        alignCycleToViewportCenter(activeCycleId, 'auto');
    }, [activeCycleId, activeIndex, alignCycleToViewportCenter, interactive, timelineEdgePadding.left, timelineEdgePadding.right]);

    useEffect(() => () => {
        if (scrollSyncFrameRef.current !== null) {
            window.cancelAnimationFrame(scrollSyncFrameRef.current);
        }
        if (manualScrollTimeoutRef.current !== null) {
            window.clearTimeout(manualScrollTimeoutRef.current);
        }
        if (layoutCopyTimeoutRef.current !== null) {
            window.clearTimeout(layoutCopyTimeoutRef.current);
        }
    }, []);

    useEffect(() => {
        if (!interactive) return;
        const handleResize = () => {
            setViewportSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [interactive]);

    if (!eras.length) return null;

    const timelineVisible = !interactive || projectionActive;
    const portraitLayout = interactive && !showLayoutEditor;
    const cycleZoom = portraitLayout ? 1 : layout.cyclesZoom;
    const sceneCyclesTranslateX = portraitLayout ? 0 : layout.cyclesOffsetX;
    const sceneCyclesTranslateY = portraitLayout ? 0 : layout.cyclesOffsetY + 8;
    const backdropScale = interactive ? layout.backdropZoom : 1.02;
    const stageScale = interactive
        ? Math.min(
            Math.max((viewportSize.width - 10) / LEGACY_STAGE_WIDTH, 0.1),
            Math.max((viewportSize.height - 10) / LEGACY_STAGE_HEIGHT, 0.1),
        )
        : 1;
    const stageWidth = LEGACY_STAGE_WIDTH * stageScale;
    const stageHeight = LEGACY_STAGE_HEIGHT * stageScale;
    const sceneClass = interactive
        ? 'relative min-h-full overflow-hidden bg-black px-0 py-0 text-white'
        : 'relative overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.08),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.035),_rgba(255,255,255,0.012))] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.42)] w-[1720px]';

    const handleTimelineScroll = () => {
        if (!interactive) return;
        if (rolagemProgramaticaRef.current > 0) return;
        setFilmePausado(true);
        userIsDraggingTimelineRef.current = true;

        if (scrollSyncFrameRef.current !== null) {
            window.cancelAnimationFrame(scrollSyncFrameRef.current);
        }

        scrollSyncFrameRef.current = window.requestAnimationFrame(() => {
            const closestCycleId = getClosestCycleToViewportCenter();
            if (closestCycleId) {
                setActiveCycleId((current) => (current === closestCycleId ? current : closestCycleId));
            }
        });

        if (manualScrollTimeoutRef.current !== null) {
            window.clearTimeout(manualScrollTimeoutRef.current);
        }

        manualScrollTimeoutRef.current = window.setTimeout(() => {
            userIsDraggingTimelineRef.current = false;
            snapTimelineToClosestCycle('smooth');
        }, 140);
    };

    const renderCycleNode = (
        cycle: LegacyEraSummary['cycles'][number],
        skin: ReturnType<typeof getEraRibbonSkin>,
        interactiveNode: boolean,
    ) => {
        const scoreInfo = getLegacyCycleGrade(cycle);
        const persistedGrade = cycle.grade?.trim().toUpperCase();
        const displayGrade = persistedGrade || scoreInfo.grade;
        const cycleMetrics = buildLegacyCycleMetrics(cycle);
        const isFocused = cycle.id === activeCycleId;
        // O vizinho espia na borda para a faixa nao parecer uma tela so — mas
        // espiando em foco e no mesmo tom ele disputa a atencao com o ciclo
        // aberto. Recuado, ele diz "tem mais aqui" sem pedir para ser lido. E o
        // mesmo recuo da trilha do historico (scale 0.94 / opacity 45).
        const baseClass = [
            'shrink-0 rounded-[12px] border border-white/0 bg-transparent p-0 text-left transition-all duration-300',
            portraitLayout ? 'h-full' : '',
            portraitLayout && !isFocused ? 'scale-[0.94] opacity-45' : 'opacity-100',
        ].filter(Boolean).join(' ');
        const style = { boxShadow: isFocused ? `0 0 0 1px ${skin.edge}18, 0 8px 14px ${skin.baseBottom}24` : 'none' } as React.CSSProperties;
        const cycleContent = (
            <div className={`legacy-cycle-focus flex flex-col items-center ${portraitLayout ? 'h-full gap-3.5' : 'gap-1'}`}>
                {portraitLayout ? (
                <PlacaReduzida escalaX={ESCALA_X_NA_CENA} escalaY={ESCALA_Y_NA_CENA}>
                <MetalReportCard
                    rank={displayGrade}
                    score={cycle.score}
                    title={cycle.name}
                    subtitle={`${formatDate(cycle.startDate)} - ${formatDate(cycle.endDate)}`}
                    metrics={[
                        { label: 'Ações', value: `${cycleMetrics.totalActions}/${cycleMetrics.totalPlanned}` },
                        { label: 'Carga', value: `${formatHoras(cycleMetrics.hours)}h` },
                        { label: 'Metas', value: `${cycle.sealedMetas ?? 0}/${cycle.plannedMetas ?? 0}` },
                        { label: 'Presença', value: `${cycleMetrics.activeDays} dias` },
                    ]}
                    compact
                    className={LEGACY_CYCLE_CARD_CLASS}
                />
                </PlacaReduzida>
                ) : (
                <MetalReportCard
                    rank={displayGrade}
                    score={cycle.score}
                    title={cycle.name}
                    subtitle={`${formatDate(cycle.startDate)} - ${formatDate(cycle.endDate)}`}
                    metrics={[
                        { label: 'Acoes', value: `${cycleMetrics.totalActions}/${cycleMetrics.totalPlanned}` },
                        { label: 'Carga', value: `${formatHoras(cycleMetrics.hours)}h` },
                        { label: 'Metas', value: `${cycle.sealedMetas ?? 0}/${cycle.plannedMetas ?? 0}` },
                        { label: 'Presenca', value: `${cycleMetrics.activeDays} dias` },
                    ]}
                    compact
                    className={LEGACY_CYCLE_CARD_CLASS}
                />
                )}
                <MiniCyclePlannerSnapshot
                    weeks={cycle.weeklyAtlas || []}
                    accentColor={skin.edge}
                    compact
                    spacious={portraitLayout}
                    fill={portraitLayout}
                    className="legacy-cycle-planner w-full"
                    style={{ transformOrigin: 'top center' }}
                />
            </div>
        );

        if (!interactiveNode) {
            return (
                <div key={cycle.id} className={baseClass} style={style}>
                    {cycleContent}
                </div>
            );
        }

        return (
            <button
                key={cycle.id}
                ref={(node) => { cycleCardRefs.current[cycle.id] = node; }}
                type="button"
                onClick={() => {
                    setFilmePausado(true);
                    setActiveCycleId(cycle.id);
                    onOpenCycle?.(cycle.id);
                }}
                className={`${baseClass} cursor-pointer`}
                style={style}
            >
                {cycleContent}
            </button>
        );
    };

    const renderInteractiveEraGroup = (
        era: LegacyEraSummary,
        eraIndex: number,
    ) => {
        const skin = getEraRibbonSkin(era.skinId);
        const isLastEra = eraIndex === orderedEras.length - 1;

        return (
            <div key={era.key || era.label} className={`relative flex shrink-0 gap-2.5 ${portraitLayout ? 'h-full items-stretch pb-2 pt-1' : 'items-start pb-5 pt-8'}`}>
                {eraIndex > 0 && (
                    <div className="pointer-events-none absolute -left-4 bottom-0 top-8 flex w-8 flex-col items-center">
                        <div className="h-7 w-px" style={{ background: `${skin.edge}66` }} />
                        <div className="mt-1 h-2.5 w-2.5 rotate-45 border" style={{ borderColor: `${skin.edge}66`, background: `${skin.baseTop}22` }} />
                        <div className="mt-1 w-px flex-1 bg-white/10" />
                    </div>
                )}

                {/* No retrato quem nomeia a era e a regua do tempo, na barra em que
                    ela comeca. Aqui a etiqueta ficava solta ao lado do card, falando
                    de um recorte que o card nao mostra. */}
                <button
                    type="button"
                    onClick={() => onOpenEra?.(era)}
                    className={`group absolute left-0 top-0.5 z-20 ${portraitLayout ? 'hidden' : ''} ${onOpenEra ? 'cursor-pointer' : 'cursor-default'}`}
                    title={onOpenEra ? `Abrir ${era.label}` : era.label}
                >
                    <span
                        className="block whitespace-nowrap rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] shadow-[0_8px_18px_rgba(0,0,0,0.18)] backdrop-blur-sm transition-colors group-hover:text-white"
                        style={{
                            borderColor: `${skin.edge}40`,
                            color: skin.edge,
                            background: 'linear-gradient(180deg, rgba(3,5,8,0.82), rgba(3,5,8,0.62))',
                        }}
                    >
                        {era.label}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => onOpenEra?.(era)}
                    className={`group flex shrink-0 flex-col items-center gap-1.5 pt-1 ${onOpenEra ? 'cursor-pointer' : 'cursor-default'}`}
                    title={onOpenEra ? `Abrir ${era.label}` : era.label}
                >
                    <div className="h-[72px] w-[10px] overflow-hidden rounded-sm">
                        <EraRibbon label="" skinId={era.skinId} className="h-full w-full" />
                    </div>
                </button>

                <div className={`relative flex pb-4 ${portraitLayout ? 'min-h-0 flex-1 gap-4' : 'gap-1.5'}`}>
                    <div className="pointer-events-none absolute inset-x-0 -top-2.5 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                    <div
                        className="pointer-events-none absolute bottom-[6px] left-2 right-2 h-px"
                        style={{
                            background: `linear-gradient(90deg, ${skin.edge}00 0%, ${skin.edge}66 18%, ${skin.edge}88 50%, ${skin.edge}66 82%, ${skin.edge}00 100%)`,
                            boxShadow: `0 0 18px ${skin.edge}28`,
                        }}
                    />
                    <div className="pointer-events-none absolute bottom-[3px] left-2 h-[7px] w-[7px] rounded-full" style={{ backgroundColor: skin.edge, boxShadow: `0 0 14px ${skin.edge}44` }} />
                    <div className="pointer-events-none absolute bottom-[3px] right-2 h-[7px] w-[7px] rounded-full" style={{ backgroundColor: skin.edge, boxShadow: `0 0 14px ${skin.edge}44` }} />
                    {(era.cycles || []).map((cycle) => renderCycleNode(cycle, skin, true))}
                </div>

                {!isLastEra && (
                    <div className="pointer-events-none flex shrink-0 flex-col items-center justify-start gap-1 pt-2">
                        <span className="rounded-full border border-white/10 bg-black/32 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.18em] text-white/55">
                            Fim
                        </span>
                        <div className="h-2.5 w-2.5 rotate-45 border" style={{ borderColor: `${skin.edge}55`, background: `${skin.baseTop}22` }} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <section id={id} className={sceneClass}>
            {/*
              * O SALAO OCUPA A TELA, ANCORADO PELO CHAO.
              *
              * A foto e um retrato 768x1365 e a tela quase nunca tem essa
              * proporcao, entao alguma coisa tem que ceder. As duas saidas que nao
              * servem: `auto 100%` mostra a foto inteira mas deixa de preencher a
              * largura, e a cena vira uma tira fina no meio; achatar para caber
              * engorda as colunas do salao, e a distorcao aparece justamente na
              * arquitetura, que e o que se olha.
              *
              * Fica `cover` — largura sempre cheia — ancorado em BAIXO. O corte
              * cai todo no teto, que e repeticao de moldura, e o chao chega
              * inteiro ate a borda de baixo da tela em qualquer aparelho. Era o
              * chao que sumia antes, e e o chao que assenta a cena.
              */}
            <div
                className="legacy-scene-backdrop"
                aria-hidden="true"
                style={{
                    backgroundImage: `${backdropSkin.overlay}, url(${backdropSkin.imageUrl})`,
                    borderRadius: interactive ? '0px' : '34px',
                    backgroundPosition: interactive ? 'center bottom' : backdropSkin.focus,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundBlendMode: 'color, normal',
                    transform: interactive
                        ? `translateY(${layout.backdropOffsetY}px) scale(${backdropScale})`
                        : `scale(${backdropScale * backdropSkin.zoom})`,
                    // Crescer pelo centro empurra o chao para fora por baixo. Pela
                    // base, o zoom so avanca no teto — que e o que sobra.
                    transformOrigin: interactive ? 'center bottom' : 'center center',
                    filter: backdropSkin.filter,
                    opacity: 1,
                }}
            />

            <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 transition-all duration-700 ${eraTransitionPulse ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    background: eraTransitionPulse
                        ? `radial-gradient(circle at center, ${eraTransitionPulse}22 0%, ${eraTransitionPulse}10 26%, rgba(0,0,0,0.32) 55%, rgba(0,0,0,0.68) 100%)`
                        : undefined,
                }}
            />

            <div className={`relative z-10 ${interactive ? 'flex min-h-full items-center justify-center p-1.5' : ''}`}>
                <div
                    className={interactive ? 'relative overflow-hidden' : 'relative z-10 flex min-h-full flex-col'}
                    style={interactive ? { width: `${stageWidth}px`, height: `${stageHeight}px` } : undefined}
                >
                <div
                    className={interactive ? 'relative flex h-full w-full flex-col overflow-hidden px-4 pb-[70px] pt-5 text-white' : 'relative z-10 flex min-h-full flex-col text-white'}
                    style={interactive ? { width: `${LEGACY_STAGE_WIDTH}px`, height: `${LEGACY_STAGE_HEIGHT}px`, transform: `scale(${stageScale})`, transformOrigin: 'top left' } : undefined}
                >
                {interactive && (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background: [
                                'linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.02) 18%, rgba(0,0,0,0.18) 100%)',
                                'radial-gradient(circle at 50% 11%, rgba(255,255,255,0.08), transparent 18%)',
                            ].join(', '),
                        }}
                    />
                )}
                {interactive && (
                    <>
                        {/* A navegacao mora embaixo: o polegar alcanca o rodape sem soltar o
                            aparelho, e la em cima ela disputava a borda com a placa do
                            legado, que e o que abre a cena. */}
                        <div className="pointer-events-none absolute inset-x-4 bottom-3 z-20 flex items-end justify-between gap-3 sm:inset-x-5">
                            <div className="pointer-events-auto rounded-[18px] border border-[var(--skin-accent-color)]/18 bg-[linear-gradient(180deg,rgba(6,10,14,0.82),rgba(3,6,10,0.66))] px-2 py-1.5 shadow-[0_14px_30px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => jumpToCycle(activeIndex - 1)}
                                        disabled={activeIndex <= 0}
                                        aria-label="Ciclo anterior"
                                        className={`flex h-9 w-9 items-center justify-center rounded-full text-[1rem] font-black leading-none transition ${activeIndex <= 0 ? 'cursor-not-allowed border border-white/8 bg-white/5 text-white/28' : 'border border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/10 text-[var(--skin-accent-color)] shadow-[0_0_18px_rgba(212,175,55,0.08)] hover:bg-[var(--skin-accent-color)]/16'}`}
                                    >
                                        <span aria-hidden="true">‹</span>
                                    </button>
                                    <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                        {Math.max(activeIndex + 1, 1)} / {cycleEntries.length}
                                    </div>
                                    {/*
                                      * NO ULTIMO CICLO O AVANCAR GANHA NOME: "OK".
                                      *
                                      * Ele sempre CHAMOU onSequenceComplete ali — mas continuava
                                      * desenhado como a mesma setinha, entao a unica pista de que
                                      * havia mais alguma coisa no fim da fila era o leitor de tela.
                                      *
                                      * E so "Ok", sem icone de compartilhar: quem compartilha e a
                                      * tela seguinte, e um icone aqui prometeria que o toque manda
                                      * a imagem — o toque so avanca.
                                      */}
                                    {noUltimoCiclo ? (
                                        <button
                                            type="button"
                                            onClick={concluirSequencia}
                                            aria-label="Ok, ir para o fim do legado"
                                            className="flex h-9 items-center rounded-full border border-[var(--skin-accent-color)]/40 bg-[var(--skin-accent-color)]/16 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--skin-accent-color)] shadow-[0_0_18px_rgba(212,175,55,0.14)] transition hover:bg-[var(--skin-accent-color)]/24"
                                        >
                                            Ok
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => jumpToCycle(activeIndex + 1)}
                                            aria-label="Próximo ciclo"
                                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/10 text-[var(--skin-accent-color)] shadow-[0_0_18px_rgba(212,175,55,0.08)] text-[1rem] font-black leading-none transition hover:bg-[var(--skin-accent-color)]/16"
                                        >
                                            <span aria-hidden="true">›</span>
                                        </button>
                                    )}
                                    {/*
                                      * O TERCEIRO BOTAO TROCA DE FUNCAO NO FIM.
                                      *
                                      * Atravessar quarenta ciclos de seta em seta para chegar no
                                      * quadro final nao e percorrer a historia, e burocracia — daí
                                      * o pular para o fim. Chegando la, pular para o fim perde o
                                      * sentido e o mesmo lugar passa a oferecer a unica coisa que
                                      * ainda falta poder fazer: voltar ao comeco.
                                      */}
                                    {noUltimoCiclo ? (
                                        <button
                                            type="button"
                                            onClick={() => jumpToCycle(0)}
                                            aria-label="Recomecar do primeiro ciclo"
                                            title="Recomecar"
                                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/60 transition hover:border-white/20 hover:text-white"
                                        >
                                            <RefreshCwIcon className="h-3.5 w-3.5" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => jumpToCycle(cycleEntries.length - 1)}
                                            aria-label="Ir para o ultimo ciclo"
                                            title="Ir para o fim"
                                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-[0.95rem] font-black leading-none text-white/60 transition hover:border-white/20 hover:text-white"
                                        >
                                            <span aria-hidden="true">»</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {showLayoutEditor && (
                                <div className="pointer-events-auto flex flex-col items-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setLayoutEditorOpen((current) => !current)}
                                        className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl transition ${layoutEditorOpen ? 'border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/12 text-[var(--skin-accent-color)]' : 'border-white/10 bg-black/35 text-white/56 hover:text-white/82'}`}
                                    >
                                        {layoutEditorOpen ? 'Fechar ajuste' : 'Ajustar cena'}
                                    </button>
                                    {layoutEditorOpen && (
                                        <div className="w-[228px] rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(6,10,14,0.82),rgba(3,6,10,0.7))] px-3.5 py-3.5 shadow-[0_16px_30px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
                                            <div className="space-y-2.5">
                                                <LayoutSlider label="Zoom do fundo" value={layout.backdropZoom} min={1} max={1.6} step={0.01} onChange={(value) => updateLayout({ backdropZoom: value })} />
                                                <LayoutSlider label="Altura do fundo" value={layout.backdropOffsetY} min={-260} max={260} step={2} onChange={(value) => updateLayout({ backdropOffsetY: value })} />
                                                <LayoutSlider label="Zoom da placa" value={layout.plaqueZoom} min={0.8} max={1.55} step={0.01} onChange={(value) => updateLayout({ plaqueZoom: value })} />
                                                <LayoutSlider label="Y da placa" value={layout.plaqueOffsetY} min={-120} max={120} step={1} onChange={(value) => updateLayout({ plaqueOffsetY: value })} />
                                                <LayoutSlider label="Zoom do ciclo" value={layout.cyclesZoom} min={0.75} max={1.8} step={0.01} onChange={(value) => updateLayout({ cyclesZoom: value })} />
                                                <LayoutSlider label="Y do ciclo" value={layout.cyclesOffsetY} min={-360} max={140} step={1} onChange={(value) => updateLayout({ cyclesOffsetY: value })} />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleCopyLayoutJson}
                                                className="mt-3 w-full rounded-full border border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--skin-accent-color)] transition hover:bg-[var(--skin-accent-color)]/16"
                                            >
                                                {layoutCopyState === 'copied' ? 'JSON copiado' : layoutCopyState === 'prompt' ? 'JSON aberto' : 'Gravar JSON'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
                <div
                    className={`mx-auto transition-all duration-700 ${timelineVisible ? 'opacity-100' : 'pointer-events-none opacity-40'} ${interactive ? 'cursor-pointer' : ''}`}
                    onClick={interactive ? onActivatePlaque : undefined}
                    style={{
                        // Estes 44px eram a folga por baixo da navegacao, quando ela
                        // morava no topo. Com ela embaixo, aquilo virou um buraco: a
                        // cena comecava no meio do palco e estourava no rodape. Ficam
                        // 4px de respiro da borda, e os 40 restantes voltam para a
                        // coluna do ciclo, que e quem estava sem espaco.
                        marginTop: interactive ? '4px' : undefined,
                        width: interactive ? `${portraitLayout ? 368 : scenePlaqueWidth}px` : undefined,
                        maxWidth: interactive ? `${LEGACY_STAGE_WIDTH - 20}px` : undefined,
                        transform: `translate(${portraitLayout ? 0 : layout.plaqueOffsetX}px, ${(timelineVisible ? 0 : -16) + (portraitLayout ? 0 : layout.plaqueOffsetY)}px) scale(${(enteringProjection ? 0.985 : 1) * (portraitLayout ? 1 : scenePlaqueScale)})`,
                        transformOrigin: 'top center',
                        boxShadow: eraTransitionPulse
                            ? `0 -10px 60px ${eraTransitionPulse}22, inset 0 0 70px ${eraTransitionPulse}11`
                            : undefined,
                    }}
                >
                    <div
                        className={`transition-all duration-700 ${timelineVisible ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-80'} ${enteringProjection ? 'animate-pulse' : ''}`}
                        style={{
                            boxShadow: eraTransitionPulse
                                ? `0 0 36px ${eraTransitionPulse}40, inset 0 0 28px ${eraTransitionPulse}12`
                                : undefined,
                        }}
                    >
                        <LegacyGrandPlaque
                            eras={orderedEras}
                            sovereignName={sovereignName}
                            identity={displayedPlaqueIdentity}
                            compact
                            portrait={interactive}
                        />
                    </div>
                </div>

                {/*
                  * A REGUA DO TEMPO.
                  *
                  * O trilho mostra UM ciclo por vez: dentro dele nao da para saber
                  * se o proximo e a semana seguinte ou o ano seguinte, nem quantos
                  * faltam. A regua e a estrada por baixo dos cards, e ela desliza no
                  * mesmo compasso — o ciclo aberto fica sempre no meio da tela.
                  *
                  * Cada ciclo e um trecho: | inicio ---- (o) dias ---- fim |. O nome
                  * da era mora na barra em que a era comeca; antes era uma etiqueta
                  * solta ao lado do card, falando de um recorte que o card nao
                  * mostrava.
                  */}
                {portraitLayout && cycleEntries.length > 0 && (() => {
                    // Posicao acumulada de cada trecho. O vao cresce quando houve
                    // pausa, para o buraco no desenho ter o tamanho do buraco na
                    // historia.
                    let cursor = 0;
                    const trechos = cycleEntries.map((entry, index) => {
                        const pausa = index > 0
                            ? intervaloEntreCiclos(cycleEntries[index - 1].cycle.endDate, entry.cycle.startDate)
                            : 0;
                        if (index > 0) cursor += pausa >= 3 ? VAO_COM_PAUSA : VAO_ENTRE_TRECHOS;
                        const inicio = cursor;
                        cursor += LARGURA_DO_TRECHO;
                        return { entry, index, pausa, inicio, fim: cursor, centro: inicio + (LARGURA_DO_TRECHO / 2) };
                    });
                    const centroAtivo = trechos[Math.max(activeIndex, 0)]?.centro ?? 0;

                    return (
                        <div
                            className={`relative mt-2 h-[84px] shrink-0 select-none overflow-hidden transition-opacity duration-700 ${timelineVisible ? 'opacity-100' : 'opacity-0'}`}
                            style={{
                                // O que sai de cena se desmancha em vez de ser
                                // cortado ao meio: uma etiqueta fatiada na borda
                                // ("...AS") le como defeito, nao como continuacao.
                                maskImage: 'linear-gradient(90deg, transparent 0, #000 13%, #000 87%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 13%, #000 87%, transparent 100%)',
                            }}
                        >
                            <div
                                className="absolute left-1/2 top-0 h-full transition-transform duration-500 ease-out"
                                style={{ transform: `translateX(${-centroAtivo}px)` }}
                            >
                                {trechos.map(({ entry, index, pausa, inicio, fim, centro }) => {
                                    const skin = getEraRibbonSkin(entry.era.skinId);
                                    const ativo = index === activeIndex;
                                    const passado = index < activeIndex;
                                    const aceso = ativo || passado;
                                    const comecaEra = index === 0 || entry.era.key !== cycleEntries[index - 1]?.era.key;
                                    const dias = duracaoDoCiclo(entry.cycle.startDate, entry.cycle.endDate);
                                    const marcoInicio = marcoDoCiclo(entry.cycle.startDate);
                                    const marcoFim = marcoDoCiclo(entry.cycle.endDate);
                                    const fimAnterior = index > 0 ? trechos[index - 1].fim : null;

                                    return (
                                        <React.Fragment key={entry.cycle.id || `${entry.era.key}-${index}`}>
                                            {/* O vazio entre ciclos. Pontilhado fraco: passou tempo,
                                                e nele nao houve ciclo. */}
                                            {fimAnterior !== null && (
                                                <div
                                                    aria-hidden="true"
                                                    className="pointer-events-none absolute top-[37px] h-[2px]"
                                                    style={{
                                                        left: `${fimAnterior}px`,
                                                        width: `${inicio - fimAnterior}px`,
                                                        background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 2px, transparent 2px 6px)',
                                                        opacity: 0.5,
                                                    }}
                                                />
                                            )}
                                            {pausa >= 3 && fimAnterior !== null && (
                                                <span
                                                    className="pointer-events-none absolute top-[37px] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[rgba(4,7,11,0.94)] px-2 py-[3px] text-[10px] font-black uppercase tracking-[0.08em] text-white/55"
                                                    style={{ left: `${(fimAnterior + inicio) / 2}px` }}
                                                    title={`${pausa} dias fora de ciclo`}
                                                >
                                                    {rotuloDoIntervalo(pausa)}
                                                </span>
                                            )}

                                            {/* A linha do ciclo: corre de barra a barra e acaba ali. */}
                                            <div
                                                aria-hidden="true"
                                                className="pointer-events-none absolute top-[37px] h-[2px] rounded-full transition-all duration-500"
                                                style={{
                                                    left: `${inicio}px`,
                                                    width: `${LARGURA_DO_TRECHO}px`,
                                                    background: aceso ? skin.edge : `${skin.edge}4d`,
                                                    boxShadow: ativo ? `0 0 12px ${skin.edge}80` : 'none',
                                                }}
                                            />

                                            {[inicio, fim].map((x, ponta) => (
                                                <React.Fragment key={`ponta-${ponta}`}>
                                                    <div
                                                        aria-hidden="true"
                                                        className="pointer-events-none absolute top-[37px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500"
                                                        style={{
                                                            left: `${x}px`,
                                                            height: aceso ? '26px' : '19px',
                                                            background: aceso ? skin.edge : `${skin.edge}73`,
                                                        }}
                                                    />
                                                    <span
                                                        className="pointer-events-none absolute top-[51px] -translate-x-1/2 whitespace-nowrap text-center text-[12.5px] font-black leading-[1.15] tracking-[0.02em]"
                                                        style={{
                                                            left: `${x}px`,
                                                            color: aceso ? 'rgba(255,255,255,0.68)' : 'rgba(255,255,255,0.32)',
                                                            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                                                        }}
                                                    >
                                                        {(ponta === 0 ? marcoInicio : marcoFim).mes}
                                                        <br />
                                                        <span className="text-[10.5px] font-black opacity-55">
                                                            {(ponta === 0 ? marcoInicio : marcoFim).ano}
                                                        </span>
                                                    </span>
                                                </React.Fragment>
                                            ))}

                                            {comecaEra && (
                                                <span
                                                    className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full border px-2.5 py-[4px] text-[10px] font-black uppercase tracking-[0.16em] backdrop-blur-sm"
                                                    style={{
                                                        left: `${inicio}px`,
                                                        borderColor: `${skin.edge}4d`,
                                                        color: skin.edge,
                                                        background: 'linear-gradient(180deg, rgba(3,5,8,0.9), rgba(3,5,8,0.7))',
                                                    }}
                                                >
                                                    {entry.era.label}
                                                </span>
                                            )}

                                            {/* A duracao mora embaixo, na mesma linha das datas: as tres
                                                coisas que a regua diz sobre o ciclo sao do mesmo tipo e
                                                se leem de uma passada so. */}
                                            <span
                                                className="pointer-events-none absolute top-[56px] -translate-x-1/2 whitespace-nowrap text-center text-[14.5px] font-black leading-none tracking-[0.01em] transition-colors duration-300"
                                                style={{
                                                    left: `${centro}px`,
                                                    color: ativo ? skin.edge : 'rgba(255,255,255,0.4)',
                                                    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                                                }}
                                            >
                                                {dias} {dias === 1 ? 'dia' : 'dias'}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => jumpToCycle(index)}
                                                aria-label={`Ir para ${entry.cycle.name || 'ciclo'}, ${dias} dias`}
                                                aria-current={ativo ? 'true' : undefined}
                                                className="absolute top-[37px] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                                                style={{ left: `${centro}px` }}
                                            >
                                                {ativo && (
                                                    <span
                                                        aria-hidden="true"
                                                        className="pointer-events-none absolute h-[42px] w-[42px] rounded-full"
                                                        style={{ background: `radial-gradient(circle, ${skin.edge}3d 0%, ${skin.edge}00 70%)` }}
                                                    />
                                                )}
                                                <span
                                                    className="relative block rounded-full transition-all duration-300"
                                                    style={ativo
                                                        ? {
                                                            width: '23px',
                                                            height: '23px',
                                                            background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,0.92), ${skin.edge} 56%, ${skin.metal} 100%)`,
                                                            boxShadow: `0 0 0 3px rgba(3,6,10,0.92), 0 0 0 4.5px ${skin.edge}8c, 0 0 22px ${skin.edge}a6, inset 0 1px 0 rgba(255,255,255,0.5)`,
                                                        }
                                                        : {
                                                            width: '14px',
                                                            height: '14px',
                                                            background: passado ? `${skin.edge}e6` : 'rgba(6,10,14,0.9)',
                                                            boxShadow: `0 0 0 3px rgba(3,6,10,0.92), inset 0 0 0 2px ${passado ? 'transparent' : `${skin.edge}a6`}, 0 1px 3px rgba(0,0,0,0.55)`,
                                                        }}
                                                />
                                            </button>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                <div className={portraitLayout ? "mt-1 flex min-h-0 flex-1 flex-col transition-all duration-700" : "mt-auto space-y-0.5 transition-all duration-700"}>
                    <div className={`mx-auto transition-all duration-1000 ${portraitLayout ? 'flex min-h-0 w-full flex-1 flex-col' : ''} ${timelineVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}`} style={{ maxWidth: interactive ? 'min(98vw, 1480px)' : undefined }}>
                        <div
                            ref={timelineScrollRef}
                            onScroll={handleTimelineScroll}
                            className={`${interactive ? 'mx-auto overflow-x-auto pb-1 hide-scrollbar' : 'overflow-visible'} ${portraitLayout ? 'min-h-0 flex-1' : ''}`}
                            style={{
                                transform: `translate(${sceneCyclesTranslateX}px, ${sceneCyclesTranslateY}px) scale(${cycleZoom})`,
                                transformOrigin: 'top center',
                                // Keep the scaled box inside the stage: scaling from the centre would
                                // otherwise bleed past both edges and clip the era labels.
                                width: interactive ? `${(LEGACY_STAGE_WIDTH - 24) / Math.max(cycleZoom, 0.01)}px` : undefined,
                            }}
                        >
                            <div
                                ref={timelineContentRef}
                                className={`relative inline-flex min-w-full gap-1 ${portraitLayout ? 'h-full items-stretch pt-1' : interactive ? 'pt-6' : 'pt-2'} ${portraitLayout ? '' : 'items-start'}`}
                                style={interactive ? { paddingLeft: `${timelineEdgePadding.left}px`, paddingRight: `${timelineEdgePadding.right}px` } : undefined}
                            >
                                {interactive ? (
                                    orderedEras.map((era, eraIndex) => renderInteractiveEraGroup(era, eraIndex))
                                ) : (
                                    orderedEras.map((era, eraIndex) => {
                                        const skin = getEraRibbonSkin(era.skinId);
                                        return (
                                            <div key={era.key || era.label} className="relative flex shrink-0 gap-1">
                                                {eraIndex > 0 && (
                                                    <div className="absolute -left-4 bottom-0 top-0 flex w-8 flex-col items-center justify-start">
                                                        <div className="mt-[26px] h-8 w-px bg-[var(--skin-accent-color)]/42" />
                                                        <div className="mt-2 w-px flex-1 bg-white/10" />
                                                    </div>
                                                )}

                                                <button type="button" onClick={() => onOpenEra?.(era)} className={`group flex shrink-0 flex-col items-center gap-1 ${onOpenEra ? 'cursor-pointer' : 'cursor-default'}`} title="Abrir Era">
                                                    <div className="h-[72px] w-[10px] overflow-hidden rounded-sm">
                                                        <EraRibbon label="" skinId={era.skinId} className="h-full w-full" />
                                                    </div>
                                                    <span className="text-[8px] font-black uppercase tracking-[0.16em] text-gray-500 transition-colors group-hover:text-white">{era.label}</span>
                                                </button>

                                                <div className="flex gap-1.5">
                                                    {(era.cycles || []).map((cycle) => renderCycleNode(cycle, skin, false))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                </div>
                </div>
                </div>
            </div>
        </section>
    );
};

