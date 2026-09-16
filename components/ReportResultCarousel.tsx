import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { SlideAjustado } from './SlideAjustado';
import { SlideCartaz } from './SlideCartaz';
import { useGame } from '../contexts/GameContext';
import { Portal } from './Portal';
import { SKINS_DATA } from '../constants/GMboard';
import { Report, ChestType } from '../types';
import { getScoreGrade } from '../utils/dateUtils';
import { VideoPlayer } from './VideoPlayer';
import { CycleAtlasPanel } from './CycleAtlasPanel';
import { resolveItemDef } from '../constants/items';
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ShareIcon, CheckIcon, CrownIcon, ZapIcon, TrophyIcon, Trash2Icon, RefreshCwIcon } from './Icons';
import { MetalReportCard } from './MetalReportCard';
import { buildComparisonClosingLine, buildCycleComparison, isFavourable } from '../utils/cycleComparison';
import { hasPlatinumAccess } from '../utils/premiumAccess';
import { exportElementAsImage, shouldPreferNativeShare } from './Share';
import { ShareChoiceSheet } from './ShareChoiceSheet';
import './report-ui.css';
import { emitAppSensoryCue } from '../utils/sensoryCue';
import { getChestVisual, withAlpha } from '../constants/rarityVisuals';
const ReportRadarChart = React.lazy(() => import('./ReportRadarChart').then((m) => ({ default: m.ReportRadarChart })));

// Helper functions (duplicated to avoid circular dependencies)
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
const daysBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

interface ReportResultCarouselProps {
    report: Report;
    onOk: () => void;
    onCompare: () => void;
    onShare: () => void;
    onPostToFeed: () => void;
    onStartNewCycle?: () => void; // Added for reward slide
    onContinueFromHere?: () => void;
    chest?: ChestType | null;     // Added for reward slide
    expGained?: number;           // Added for reward slide
    fragmentsGained?: number;
    insignias?: string[];         // Added for reward slide
    onOpenChest?: () => void;     // Trigger chest opening
    chestOpened?: boolean;
    isOpeningChest?: boolean;
    onDelete?: () => void;        // Added for delete action
    autoPlay?: boolean;
    startAtEnd?: boolean;
}

const ChestVisual: React.FC<{ type: ChestType }> = ({ type }) => {
    const rarity = getChestVisual(type);
    const colors = {
        base: rarity.hex,
        highlight: `color-mix(in srgb, ${rarity.hex} 72%, white)`,
        glow: withAlpha(rarity.rgb, 0.6),
    };

    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            <div
                className="absolute inset-0 rounded-full blur-xl animate-pulse"
                style={{ backgroundColor: colors.glow }}
            />
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl relative z-10">
                {/* Chest Base */}
                <path d="M10 40 L90 40 L85 90 L15 90 Z" fill={colors.base} stroke="#111" strokeWidth="2" />
                {/* Chest Lid */}
                <path d="M10 40 Q50 10 90 40" fill={colors.highlight} stroke="#111" strokeWidth="2" />
                <rect x="10" y="35" width="80" height="10" fill={colors.base} stroke="#111" strokeWidth="2" />
                {/* Lock */}
                <rect x="42" y="35" width="16" height="20" rx="2" fill="#FFD700" stroke="#111" strokeWidth="1" />
                <circle cx="50" cy="45" r="3" fill="#111" />
                {/* Decorative Bands */}
                <rect x="20" y="35" width="5" height="55" fill="#111" opacity="0.3" />
                <rect x="75" y="35" width="5" height="55" fill="#111" opacity="0.3" />
            </svg>
        </div>
    );
};

export const ReportResultCarousel: React.FC<ReportResultCarouselProps> = ({
    report,
    onOk,
    onCompare,
    onShare,
    onPostToFeed,
    onStartNewCycle,
    onContinueFromHere,
    chest,
    expGained,
    fragmentsGained,
    insignias = [],
    onOpenChest,
    chestOpened = false,
    isOpeningChest = false,
    onDelete,
    autoPlay = true,
    startAtEnd = false,
}) => {
    const REWARD_CARD_CAPTURE_ID = 'report-metal-card-capture';
    const preferNativeShare = shouldPreferNativeShare();
    const { userProfile, showToast, reports } = useGame();
    const userSkinId = userProfile.skin;
    const userSkin = SKINS_DATA.find(s => s.id === userSkinId);
    const skinColor = userSkin?.color || '#ffffff';

    const [currentSlide, setCurrentSlide] = useState(0);
    const previousSensorySlideRef = React.useRef<number | null>(null);
    const [autoPlayPaused, setAutoPlayPaused] = useState(false);
    const [rewardReveal, setRewardReveal] = useState(false);
    const [rewardFlashActive, setRewardFlashActive] = useState(false);
    const [isExportingRewardCard, setIsExportingRewardCard] = useState(false);
    const [isShareChoiceOpen, setIsShareChoiceOpen] = useState(false);

    const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
    const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));
    const openShareChoice = () => setIsShareChoiceOpen(true);
    const handleShareImageChoice = () => {
        if (isRewardSlide) {
            void handleExportRewardCard(true);
            return;
        }
        onShare();
    };

    const { metrics, highlight, assetProgress } = report;
    const weeklyAtlas = metrics.weeklyAtlas || [];
    const fairness = metrics.fairness;
    const isFairScoreModel = metrics.scoreModelVersion === 'fair_v2_1' && !!fairness?.scoreBreakdown;
    const isLowSignal = fairness?.measurementStatus === 'low_signal';
    const sealedMetas = metrics.sealedMetas ?? metrics.goalsMet ?? 0;
    const plannedMetas = metrics.plannedMetas ?? Math.max(sealedMetas, 0);
    const scoreInfo = getScoreGrade(report.performanceScore, fairness);
    const duration = daysBetween(new Date(report.startDate), new Date(report.endDate));
    const totalDays = Math.max(1, duration + 1);

    // Calculate Time Progress
    const plannedEndDate = metrics.plannedEndDate ? new Date(metrics.plannedEndDate) : new Date(report.endDate);
    const plannedDuration = Math.max(1, daysBetween(new Date(report.startDate), plannedEndDate));
    const timePercentage = Math.min(100, (duration / plannedDuration) * 100);
    const consistencyPct = metrics.consistencyDays ? Math.min(100, Math.round((metrics.consistencyDays / totalDays) * 100)) : 0;
    const executionPercentage = metrics.executionRatePct ?? Math.min(100, Math.round((metrics.actionsCompleted / Math.max(metrics.totalPlannedActions, 1)) * 100));
    const timeElapsedPercentage = metrics.timeElapsedPct ?? Math.round(timePercentage);
    const zeroDays = metrics.daysWithoutCompletion ?? Math.max(0, totalDays - (metrics.consistencyDays || 0));
    const paceDelta = metrics.paceDeltaPct ?? (executionPercentage - timeElapsedPercentage);
    const paceLabel = paceDelta >= 5 ? 'Adiantado' : paceDelta <= -5 ? 'Atrasado' : 'No compasso';
    const paceColor = paceDelta >= 5 ? 'text-green-400' : paceDelta <= -5 ? 'text-red-400' : 'text-white';

    const handleExportRewardCard = async (forcePreferShare?: boolean) => {
        if (isExportingRewardCard) return;
        setIsExportingRewardCard(true);
        const preferShareForThisRun = forcePreferShare ?? preferNativeShare;
        try {
            if (preferShareForThisRun) {
                showToast('Preparando compartilhamento do card...', 'info');
            }

            const result = await exportElementAsImage(REWARD_CARD_CAPTURE_ID, {
                fileName: `glyph-card-ciclo-${formatDate(report.endDate).replace(/\//g, '-')}-${scoreInfo.grade}.png`,
                title: 'Card do ciclo - Glyph',
                backgroundColor: '#050505',
                preferShare: preferShareForThisRun,
            });

            if (result === 'shared') {
                showToast('Card do ciclo compartilhado.', 'success');
            } else if (result === 'cancelled') {
                showToast('Compartilhamento cancelado.', 'info');
            } else {
                showToast('Card do ciclo exportado.', 'success');
            }
        } catch (error) {
            console.error('Erro ao exportar card do relatório:', error);
            showToast('Não foi possível exportar o card do ciclo.', 'error');
        } finally {
            setIsExportingRewardCard(false);
        }
    };


    // Prepare data for Radar Chart
    const radarData = assetProgress.map(ap => ({
        subject: ap.asset,
        A: ap.value,
        fullMark: 100
    }));

    /*
     * EXECUCAO: O PROTAGONISTA E O QUANTO SAIU DO PAPEL.
     *
     * Este slide empilhava sete blocos do mesmo peso — barra de acoes, barra de
     * tempo, quatro caixas de numero e uma barra de consistencia — em 706px de
     * conteudo para 626px de tela. Nao havia o que olhar primeiro, e ainda
     * encolhia 16% para caber.
     *
     * O numero e a porcentagem de execucao porque e ela que responde a pergunta
     * do ciclo: do que voce prometeu, quanto virou feito. Carga, ritmo e presenca
     * qualificam essa resposta — elas nao sao a resposta.
     */
    const renderExecutionSlide = () => {
        const diasSemNada = Math.max(0, totalDays - (metrics.consistencyDays || 0));

        /*
         * CICLO SEM NADA PLANEJADO NAO TEM PORCENTAGEM.
         *
         * `executionRatePct` devolve 100 quando o ciclo nao teve nenhuma tarefa
         * (coreLoopUtils: `cycleTasks.length > 0 ? ... : 100`). Como metrica
         * interna passa — nao ha pendencia —, mas aqui virava a frase mais
         * destacada da apresentacao: "100% DAS ACOES PLANEJADAS VIRARAM FEITO"
         * para quem nao fez nada, com o ritmo ao lado dizendo "adiantado".
         *
         * Mentir para o lado que agrada e a pior forma de mentir num relatorio.
         * O numero de la continua como esta — ele alimenta o painel, o comparativo
         * e os testes. Quem para de afirmar e o cartaz: sem acao planejada, o
         * protagonista passa a ser o que de fato aconteceu, e o ritmo sai, porque
         * ritmo contra nada tambem nao quer dizer nada.
         */
        const semPlano = (metrics.totalPlannedActions || 0) === 0;

        if (semPlano) {
            return (
                <SlideCartaz
                    rank={scoreInfo.grade}
                    titulo="Execução"
                    numero={metrics.consistencyDays || 0}
                    sufixo={(metrics.consistencyDays || 0) === 1 ? 'dia' : 'dias'}
                    rotulo="com alguma presença, em um ciclo sem plano"
                    legenda={[
                        { rotulo: 'Ações planejadas', valor: '0' },
                        { rotulo: 'Carga', valor: `${metrics.totalHours}h` },
                        { rotulo: 'Duração', valor: `${totalDays} dias` },
                        { rotulo: 'Dias zerados', valor: `${diasSemNada}`, tom: diasSemNada > 0 ? 'alerta' : 'normal' },
                    ]}
                    remate="Este ciclo não teve ações planejadas — não há execução a medir."
                />
            );
        }

        return (
        <SlideCartaz
            rank={scoreInfo.grade}
            titulo="Execução"
            numero={executionPercentage}
            sufixo="%"
            rotulo="das ações planejadas viraram feito"
            progresso={executionPercentage}
            legenda={[
                { rotulo: 'Ações', valor: `${metrics.actionsCompleted}/${metrics.totalPlannedActions}` },
                { rotulo: 'Carga', valor: `${metrics.totalHours}h`, nota: `${metrics.avgHoursPerDay ?? (metrics.totalHours / totalDays).toFixed(1)}h por dia` },
                {
                    rotulo: 'Presença',
                    valor: `${metrics.consistencyDays || 0}/${totalDays}`,
                    /* A nota vem da SUBTRACAO, e nao de `daysWithoutCompletion`.
                       Aquele campo chega zerado em relatorio antigo, e o slide
                       dizia "nenhum dia zerado" logo ao lado de "24/28" — duas
                       afirmacoes contrarias na mesma linha. O que a pessoa ve tem
                       de fechar com o que ela ve. */
                    nota: diasSemNada > 0 ? `${diasSemNada} ${diasSemNada === 1 ? 'dia zerado' : 'dias zerados'}` : 'nenhum dia zerado',
                    tom: diasSemNada === 0 ? 'bom' : 'normal',
                },
                {
                    rotulo: 'Ritmo',
                    valor: paceDelta > 0 ? `+${paceDelta}` : `${paceDelta}`,
                    nota: paceLabel.toLowerCase(),
                    tom: paceDelta >= 5 ? 'bom' : paceDelta <= -5 ? 'alerta' : 'normal',
                },
            ]}
        />
        );
    };

    /*
     * ATLAS: A GRADE E A FIGURA, E O CARTAZ DA A MOLDURA.
     *
     * O painel desenhava o proprio cabecalho — titulo, regua e quatro pilulas
     * cinzas — e ficava sendo o unico slide da serie sem moldura e sem
     * acabamento, no dialeto antigo. Agora ele entra como figura, e o cartaz
     * cuida do titulo, do acabamento e da legenda, como nos outros cinco.
     */
    const renderAtlasSlide = () => (
        <SlideCartaz
            rank={scoreInfo.grade}
            titulo="Atlas"
            figura={<CycleAtlasPanel weeks={weeklyAtlas} semMoldura />}
            rotulo="o ciclo inteiro, dia a dia"
            legenda={[
                { rotulo: 'Semanas', valor: `${weeklyAtlas.length}` },
                { rotulo: 'Dias ativos', valor: `${metrics.consistencyDays || 0}/${totalDays}` },
                { rotulo: 'Feitas', valor: `${metrics.actionsCompleted}/${metrics.totalPlannedActions}` },
                { rotulo: 'Carga', valor: `${metrics.totalHours}h` },
            ]}
        />
    );

    /*
     * TERRITORIO: O PROTAGONISTA E O DESENHO, E NAO UM NUMERO.
     *
     * Este slide tinha o radar dentro de uma caixa de altura minima 200px, com a
     * arena foco e as acoes dominantes em paineis abaixo — e quando o ciclo nao
     * tinha progresso por area, o radar sumia e sobrava um RETANGULO CINZA VAZIO
     * no meio da tela, com um painel pequeno embaixo. Era o mesmo buraco que
     * Conquistas tinha.
     *
     * Aqui o radar e o protagonista e ocupa o quadro. Quando nao ha area medida
     * para desenhar — um radar precisa de pelo menos tres vertices para ser um
     * radar, e nao um risco —, quem assume e a arena que dominou o ciclo: ela e
     * a resposta que este slide da, com ou sem grafico.
     */
    const renderTerritorySlide = () => {
        const temRadar = radarData.length >= 3;
        const dominantes = (metrics.top3Actions || []).slice(0, 3);

        const legenda = dominantes.length > 0
            ? dominantes.map((acao, idx) => ({
                rotulo: `${['I', 'II', 'III'][idx]} · ${acao.name}`,
                valor: `${acao.count}x`,
            }))
            : [{ rotulo: 'Arenas no ciclo', valor: `${metrics.arenasInvolved || 0}` }];

        if (temRadar) {
            return (
                <SlideCartaz
                    rank={scoreInfo.grade}
                    titulo="Território"
                    figura={(
                        <Suspense fallback={<div className="h-[240px] w-full" />}>
                            <ReportRadarChart data={radarData} />
                        </Suspense>
                    )}
                    rotulo={`${highlight.mostFocusedArena} puxou o ciclo`}
                    legenda={legenda}
                />
            );
        }

        return (
            <SlideCartaz
                rank={scoreInfo.grade}
                titulo="Território"
                numero={highlight.mostFocusedArena}
                rotulo="a arena que puxou o ciclo"
                legenda={legenda}
                remate={`${metrics.arenasInvolved || 0} ${(metrics.arenasInvolved || 0) === 1 ? 'arena entrou' : 'arenas entraram'} neste ciclo.`}
            />
        );
    };


    /*
     * CONQUISTAS: O PROTAGONISTA E O QUE O CICLO RENDEU.
     *
     * Este era o deserto da apresentacao: 376px de conteudo numa area de 626,
     * com 250px de preto embaixo — e, quando o ciclo nao selava meta nenhuma,
     * virava um X apagado e uma frase no meio do vazio.
     *
     * A EXP e o unico numero que existe em todo ciclo, inclusive no ciclo ruim:
     * ela mede o que foi feito, e nao o que foi prometido. Entao e ela que ocupa
     * o lugar do protagonista, e metas e desafios viram o detalhe que ela pede.
     * Um ciclo sem meta selada passa a ter o que mostrar em vez de um vazio.
     */
    const renderAchievementsSlide = () => {
        const expDoCiclo = report.expGained || expGained || metrics.expGained || 0;
        const semNada = sealedMetas === 0 && (metrics.questsCompleted || 0) === 0 && expDoCiclo === 0;

        const legenda: { rotulo: string; valor: string; nota?: string; tom?: 'normal' | 'bom' | 'alerta' }[] = [
            {
                rotulo: 'Metas',
                valor: plannedMetas > 0 ? `${sealedMetas}/${plannedMetas}` : `${sealedMetas}`,
                nota: plannedMetas > 0 && sealedMetas === plannedMetas ? 'todas seladas' : undefined,
                tom: plannedMetas > 0 && sealedMetas === plannedMetas ? 'bom' : 'normal',
            },
            { rotulo: 'Desafios', valor: `${metrics.questsCompleted || 0}` },
        ];

        if ((report.clanPoints || 0) > 0) {
            legenda.push({ rotulo: 'Clã', valor: `${report.clanPoints}`, nota: 'pontos levados' });
        }
        if ((metrics.goldGained || 0) > 0) {
            legenda.push({ rotulo: 'Ouro', valor: `+${metrics.goldGained}` });
        }

        return (
            <SlideCartaz
                rank={scoreInfo.grade}
                titulo="Conquistas"
                numero={semNada ? '0' : `+${expDoCiclo}`}
                sufixo="EXP"
                rotulo={semNada ? 'este ciclo não depositou nada' : 'depositados na sua nobreza'}
                legenda={legenda}
                remate={semNada ? 'Nenhuma meta selada. O ciclo ainda pede forma.' : undefined}
            />
        );
    };

    // Platinum: o relatorio deixa de descrever um ciclo solto e passa a compara-lo
    // com os ciclos ja fechados. Entra condicionalmente, como o Atlas.
    const isPlatinum = hasPlatinumAccess(userProfile);
    const comparison = useMemo(
        () => (isPlatinum ? buildCycleComparison(report, reports || []) : null),
        [isPlatinum, report, reports],
    );
    const showComparisonSlide = Boolean(comparison && comparison.metrics.length > 0);
    const closingLine = comparison ? buildComparisonClosingLine(comparison) : null;

    /*
     * CONTRA VOCE: O QUADRO DO PLATINUM.
     *
     * Conceitualmente este ja era o melhor slide da serie — e o unico que conta
     * uma HISTORIA em vez de listar numeros: o ciclo contra a mediana dos ciclos
     * fechados da propria pessoa. Mas era o ultimo a falar o dialeto antigo:
     * fileiras cinzas arredondadas sobre preto, sem moldura e sem acabamento,
     * justamente na tela que precisa parecer valer uma assinatura.
     *
     * Duas coisas alem do estilo:
     *
     * AS LINHAS NULAS SAEM. Num ciclo sem sequencia e sem falha, tres das cinco
     * fileiras eram "0, seu normal: 0, = 0" — ruido ocupando o lugar do que
     * mudou. Comparacao que compara nada nao e comparacao.
     *
     * O SINAL DE ESTAVEL DEIXA DE SER "=". Ao lado do numero saia "= 3", que se
     * le como igualdade e nao como variacao. Estavel vira um ponto.
     */
    const renderComparisonSlide = () => {
        /*
         * O PROTAGONISTA E O LUGAR DESTE CICLO NA SUA PROPRIA FILA.
         *
         * A tela mostrava so as variacoes contra a mediana. Util, mas sem
         * manchete: uma lista de setinhas — e num ciclo tranquilo restavam tres
         * linhas magras depois de tirar as que comparavam zero com zero.
         *
         * "2o melhor de 6" responde numa olhada o que a pessoa quer saber ao
         * fechar um ciclo, e e a unica coisa desta apresentacao que SO existe
         * para quem tem historico guardado — que e exatamente o que a assinatura
         * paga. As variacoes viram a legenda: elas explicam a posicao em vez de
         * concorrer com ela.
         *
         * Empate conta a favor: dois ciclos com a mesma nota ocupam a mesma
         * posicao, e nao uma atras da outra. Quem repetiu o melhor resultado nao
         * caiu para segundo.
         */
        const notas = (reports || [])
            .map((outro) => Number(outro.performanceScore || 0))
            .filter((nota) => Number.isFinite(nota));
        const minhaNota = Number(report.performanceScore || 0);
        const posicao = notas.filter((nota) => nota > minhaNota).length + 1;
        const temFila = notas.length > 1;

        const metricas = (comparison?.metrics || []).filter(
            (metric) => !(Number(metric.current) === 0 && Number(metric.baseline) === 0),
        );

        const legenda = metricas.map((metric) => {
            const estavel = metric.direction === 'estavel';
            const favoravel = isFavourable(metric);
            const variacao = estavel
                ? 'no seu normal'
                : `${metric.delta > 0 ? '▲' : '▼'} ${Math.abs(metric.delta)}${metric.suffix} · normal ${metric.baseline}${metric.suffix}`;
            return {
                rotulo: metric.label,
                valor: `${metric.current}${metric.suffix}`,
                nota: variacao,
                tom: (estavel ? 'normal' : favoravel ? 'bom' : 'alerta') as 'normal' | 'bom' | 'alerta',
            };
        });

        return (
            <SlideCartaz
                rank={scoreInfo.grade}
                titulo="Contra você"
                /* O selo e a razao de esta tela existir: ela e a unica que so
                   funciona com historico guardado. Ele voltou para o lado do
                   titulo quando as metricas viraram legenda. */
                selo={(
                    <span
                        className="rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.22em]"
                        style={{
                            color: skinColor,
                            border: `1px solid ${skinColor}66`,
                            background: `${skinColor}14`,
                            boxShadow: `0 0 14px ${skinColor}30`,
                        }}
                    >
                        Platinum
                    </span>
                )}
                numero={temFila ? `${posicao}º` : `${metricas.length}`}
                rotulo={temFila
                    ? `melhor dos seus ${notas.length} ciclos fechados`
                    : `medidas contra a mediana de ${comparison?.sampleSize} ciclos`}
                legenda={legenda}
                remate={closingLine || comparison?.headline || undefined}
            />
        );
    };

    /*
     * VEREDITO: O CLIMAX, E ELE E UMA LETRA.
     *
     * Ja era um cartaz — a letra em corpo enorme e a frase embaixo —, mas em
     * branco chapado sobre preto, com a decomposicao em cinco fios cinzas de 1px
     * que ninguem lia. A letra e o simbolo mais importante da apresentacao
     * inteira: ela merece o acabamento do patamar, que e justamente o que ela
     * nomeia.
     */
    const renderVerdictSlide = () => {
        const decomposicao = isFairScoreModel
            ? [
                { rotulo: 'Honra', pts: fairness!.scoreBreakdown.honorPts, max: 40 },
                { rotulo: 'Metas', pts: fairness!.scoreBreakdown.metaPts, max: 30 },
                { rotulo: 'Cadência', pts: fairness!.scoreBreakdown.cadencePts, max: 15 },
                { rotulo: 'Realismo', pts: fairness!.scoreBreakdown.realismPts, max: 10 },
                { rotulo: 'Ascensão', pts: fairness!.scoreBreakdown.ascensionPts, max: 5 },
            ]
            : metrics.scoreBreakdown
                ? [
                    { rotulo: 'Progresso', pts: metrics.scoreBreakdown.progressPts, max: 40 },
                    { rotulo: 'Marcos', pts: metrics.scoreBreakdown.milestonePts, max: Math.max(metrics.scoreBreakdown.milestonePts, 30) },
                    { rotulo: 'Desafios', pts: metrics.scoreBreakdown.questPts, max: Math.max(metrics.scoreBreakdown.questPts, 20) },
                    { rotulo: 'Consistência', pts: metrics.scoreBreakdown.consistencyPts, max: 20 },
                    { rotulo: 'Volume', pts: metrics.scoreBreakdown.volumePts, max: 30 },
                    ...((metrics.scoreBreakdown.premiumBonusPts ?? 0) > 0
                        ? [{ rotulo: 'Premium', pts: metrics.scoreBreakdown.premiumBonusPts!, max: Math.max(metrics.scoreBreakdown.premiumBonusPts!, 50), destaque: true }]
                        : []),
                ]
                : [];

        if (isLowSignal) {
            return (
                <SlideCartaz
                    rank={scoreInfo.grade}
                    titulo="Veredito"
                    numero="—"
                    rotulo="sinal insuficiente"
                    remate="Ainda não há sinal suficiente para julgar este ciclo com justiça."
                    legenda={[
                        { rotulo: 'Período', valor: `${duration} dias` },
                        { rotulo: 'Ações', valor: `${metrics.actionsCompleted}/${metrics.totalPlannedActions}` },
                    ]}
                />
            );
        }

        return (
            <SlideCartaz
                rank={scoreInfo.grade}
                titulo="Veredito"
                numero={scoreInfo.grade}
                rotulo={`${formatDate(report.startDate)} — ${formatDate(report.endDate)} · ${duration} dias`}
                legenda={[
                    { rotulo: 'Índice', valor: `${report.performanceScore}` },
                    { rotulo: 'Ações', valor: `${metrics.actionsCompleted}/${metrics.totalPlannedActions}` },
                ]}
                barras={decomposicao}
                remate={scoreInfo.phrase}
            />
        );
    };

    // Slide 5: Resumo do Relatorio
    const renderRewardSlide = () => {
        /*
         * A PLACA MOSTRA VALORES. ITEM E COM O QUADRADINHO.
         *
         * Aqui entravam o bau e ate tres insignias como BADGE DE TEXTO — uma
         * caixinha escrita "Insignia / Insignia de Relatorio de Ciclo". Item no
         * app tem uma forma: o quadrado com a borda e o degrade da raridade, a
         * arte dentro e o nome na cor dela. Essa forma existe no RewardPackBody
         * e e onde os itens deste ciclo aparecem — a tela de recompensas, que
         * agora fecha a apresentacao.
         *
         * Entao a divisao e limpa: a placa carrega o que e NUMERO (EXP,
         * fragmentos, ouro), e o que e OBJETO vai para a tela que sabe desenhar
         * objeto.
         */
        const rewardBadges = [
            ((report.expGained || expGained) && (report.expGained || expGained) > 0)
                ? { label: 'XP', value: `+${report.expGained || expGained}` }
                : null,
            ((fragmentsGained || 0) > 0)
                ? { label: '\u{1F48E} Fragmentos', value: `+${fragmentsGained}` }
                : null,
            ((report.metrics.goldGained || 0) > 0)
                ? { label: 'Ouro', value: `+${report.metrics.goldGained}` }
                : null,
        ].filter(Boolean) as { label: string; value?: string }[];

        return (
            <div className={`flex min-h-full flex-col items-center justify-center gap-3 p-2 text-center transition-all duration-700 ${rewardReveal ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'}`}>
                {/*
                  * SEM TITULO E SEM REGUA AQUI.
                  *
                  * "RESUMO" mais a regua comiam 60px acima de uma placa que ja diz o
                  * que e: ela tem o nome do ciclo, as datas, a nota e as metricas. O
                  * titulo anunciava o que estava logo abaixo, e a conta era paga pela
                  * placa, que encolhia para caber.
                  */}
                <div className="flex w-full items-center justify-center">
                    <MetalReportCard
                        captureId={REWARD_CARD_CAPTURE_ID}
                        entryFlash={rewardFlashActive}
                        rank={scoreInfo.grade}
                        score={report.performanceScore}
                        title={report.cycleName || 'Ciclo concluído'}
                        subtitle="Ciclo consolidado"
                        dateRange={`${formatDate(report.startDate)} - ${formatDate(report.endDate)}`}
                        metrics={[
                            { label: 'Ações', value: `${metrics.actionsCompleted}/${metrics.totalPlannedActions}` },
                            { label: 'Carga', value: `${metrics.totalHours}h` },
                            { label: 'Metas', value: `${sealedMetas}/${plannedMetas}` },
                            { label: 'Presença', value: `${fairness?.activeDays ?? metrics.consistencyDays ?? 0} dias` },
                        ]}
                        badges={rewardBadges}
                        className="w-full max-w-[360px]"
                    />
                </div>

                {/* O bau mora JUNTO da recompensa, e nao no rodape.
                    La embaixo ele disputava a faixa com Sair, Continuar e Novo Ciclo
                    — quatro chamadas na mesma linha de 343px, e a principal quebrava
                    em duas linhas. Aqui ele e o que e: parte do premio. */}
                {chest && onOpenChest && (
                    <button
                        onClick={onOpenChest}
                        disabled={chestOpened || isOpeningChest}
                        className={`rounded-xl border px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${chestOpened || isOpeningChest ? 'cursor-default border-white/[0.04] bg-white/[0.03] text-gray-600' : 'border-[var(--skin-accent-color)]/40 bg-[var(--skin-accent-color)]/10 text-[var(--skin-accent-color)] hover:bg-[var(--skin-accent-color)]/16'}`}
                        title={chestOpened ? 'Recompensas ja entregues' : 'Ver o que este ciclo rendeu'}
                    >
                        {/* NAO diz "abrir". O bau e concedido e guardado FECHADO no
                            Arsenal — abrir ali encadeava o video do selo com o video
                            do bau e fazia a tela falar com vocabulario de compra. O
                            botao promete o que ele faz: mostrar o que o ciclo rendeu. */}
                        {isOpeningChest ? 'Entregando...' : chestOpened ? 'Recompensas entregues' : 'Ver o que este ciclo rendeu'}
                    </button>
                )}

                {/* A legenda que ensinava "compartilhe o card ou sele o proximo ciclo"
                    saiu: ela narrava os botoes que estao logo abaixo, ja escritos com
                    todas as letras, e custava 40px da placa — que e o que a pessoa
                    veio ver. */}
            </div>
        );
    };

    const slides = [
        renderExecutionSlide,
        ...(weeklyAtlas.length > 0 ? [renderAtlasSlide] : []),
        renderTerritorySlide,
        renderAchievementsSlide,
        ...(showComparisonSlide ? [renderComparisonSlide] : []),
        renderVerdictSlide,
        renderRewardSlide
    ];
    const totalSlides = slides.length;

    useEffect(() => {
        setCurrentSlide(startAtEnd ? Math.max(0, totalSlides - 1) : 0);
    }, [report.id, startAtEnd, totalSlides]);

    // If it's the reward slide, hide the standard footer and show the special action button
    const isRewardSlide = currentSlide === totalSlides - 1;

    useEffect(() => {
        const previousSlide = previousSensorySlideRef.current;
        previousSensorySlideRef.current = currentSlide;
        if (previousSlide === null && !isRewardSlide) return;

        if (isRewardSlide) {
            emitAppSensoryCue('report_reward');
        } else if (currentSlide === totalSlides - 2) {
            emitAppSensoryCue('report_verdict');
        } else {
            emitAppSensoryCue('report_chapter');
        }
    }, [currentSlide, isRewardSlide, totalSlides]);

    useEffect(() => {
        if (!isRewardSlide) {
            setRewardReveal(false);
            setRewardFlashActive(false);
            return;
        }
        setRewardReveal(false);
        setRewardFlashActive(false);
        const revealTimer = window.setTimeout(() => setRewardReveal(true), 160);
        const flashTimer = window.setTimeout(() => setRewardFlashActive(true), 320);
        const flashResetTimer = window.setTimeout(() => setRewardFlashActive(false), 1450);
        return () => {
            window.clearTimeout(revealTimer);
            window.clearTimeout(flashTimer);
            window.clearTimeout(flashResetTimer);
        };
    }, [isRewardSlide]);

    useEffect(() => {
        if (!autoPlay || autoPlayPaused || isRewardSlide) return;
        const timer = window.setTimeout(() => {
            setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
        }, 3300);
        return () => window.clearTimeout(timer);
    }, [autoPlay, autoPlayPaused, currentSlide, isRewardSlide, totalSlides]);

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[10001] flex items-center justify-center p-4 animate-fade-in">
                <div
                    className="report-shell"
                    style={{
                        borderColor: `${skinColor}30`,
                        boxShadow: `0 0 60px ${skinColor}10, inset 0 0 30px ${skinColor}05`
                    }}
                >
                    {/* Premium border gradient effect */}
                    <div className="absolute inset-0 pointer-events-none z-50">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--skin-accent-color)]/40 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--skin-accent-color)]/10 to-transparent" />
                    </div>

                    {/* Header */}
                    <div className="report-header h-14 flex items-center justify-between px-6 border-b">
                        <div className="flex space-x-1.5">
                            {slides.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-10 bg-[var(--skin-accent-color)] shadow-[0_0_10px_var(--skin-accent-color)]' : 'w-2 bg-white/[0.05]'}`}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-1">
                            {autoPlay && !isRewardSlide && (
                                <span className={`mr-2 text-[9px] font-black uppercase tracking-[0.22em] ${autoPlayPaused ? 'text-gray-500' : 'text-[var(--skin-accent-color)]'}`}>
                                    {autoPlayPaused ? 'Pausado' : 'Auto'}
                                </span>
                            )}
                            {/* Compartilhar e uma acao de tela, e nao de slide: ela vale
                                igual nos seis. No rodape ela ficava no meio do caminho
                                entre voltar e avancar, e no ultimo slide ainda disputava
                                espaco com as tres chamadas do fim do ciclo. */}
                            <button
                                aria-label="Compartilhar"
                                onClick={openShareChoice}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-gray-500 transition-all hover:border-white/[0.05] hover:bg-white/[0.05] hover:text-white"
                            >
                                <ShareIcon className="h-[18px] w-[18px]" />
                            </button>
                            <button aria-label="Fechar"
                                onClick={onOk}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all border border-transparent hover:border-white/[0.05]"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 relative overflow-hidden bg-[#050505]" id="report-summary-card-capture" onMouseEnter={() => setAutoPlayPaused(true)} onMouseLeave={() => setAutoPlayPaused(false)}>
                        {/* Background decoration */}
                        <div className="absolute inset-0 z-0 opacity-20">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_var(--skin-accent-color)_0%,_transparent_70%)]" />
                        </div>

                        {/* A apresentacao nao rola: o slide e medido e reduzido ate caber.
                            Ver SlideAjustado — aqui havia `overflow-y-auto`, e a placa do
                            resumo saia cortada com uma barra de rolagem atravessada. */}
                        <div className="absolute inset-0 z-10 p-4">
                            <SlideAjustado chave={currentSlide}>
                                {slides[currentSlide]()}
                            </SlideAjustado>
                        </div>
                    </div>

                    {/* Footer Navigation */}
                    <div className={`report-footer flex items-center justify-between border-t px-5 ${isRewardSlide ? 'py-2.5' : 'h-16'}`}>
                        {!isRewardSlide ? (
                            <>
                                <button
                                    onClick={prevSlide}
                                    disabled={currentSlide === 0}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${currentSlide === 0 ? 'text-gray-800 border-transparent' : 'text-white border-white/[0.05] hover:bg-white/[0.05] active:scale-90'}`}
                                >
                                    <ChevronLeftIcon className="w-6 h-6" />
                                </button>

                                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-600 tabular-nums">
                                    {currentSlide + 1} <span className="text-gray-700">/</span> {totalSlides}
                                </span>

                                <button
                                    onClick={nextSlide}
                                    disabled={currentSlide === totalSlides - 1}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${currentSlide === totalSlides - 1 ? 'text-gray-800 border-transparent' : 'text-white border-white/[0.05] hover:bg-white/[0.05] active:scale-90'}`}
                                >
                                    <ChevronRightIcon className="w-6 h-6" />
                                </button>
                            </>
                        ) : (
                            /*
                              * UMA CHAMADA PRINCIPAL POR LINHA.
                              *
                              * Isto era uma fileira so com ate seis botoes numa faixa de
                              * 343px: compartilhar, apagar, bau, Sair, Continuar e Novo
                              * Ciclo. O ultimo — que e o que a pessoa veio fazer — era o
                              * que sobrava, e quebrava "NOVO CICLO" em duas linhas dentro
                              * de um losango de 62px.
                              *
                              * Agora sao duas alturas: as saidas discretas em cima, e
                              * embaixo, sozinha e larga, a que continua a jornada.
                              */
                            <div className="w-full space-y-2">
                                {(onDelete || (onStartNewCycle && (onContinueFromHere || true))) && (
                                    /* `flex-wrap`: no fechamento de ciclo esta linha
                                       chega a quatro — Rever, Apagar, Sair e Continuar —
                                       e 341px de botao nao cabem nos 302 da faixa. Sem
                                       isso, Rever saia cortado a esquerda e Continuar a
                                       direita. */
                                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                                        {/* O ULTIMO SLIDE TAMBEM TEM VOLTA.
                                            O rodape do fim trocava as setas pelas chamadas de
                                            encerramento, e com isso a apresentacao virava rua sem
                                            saida: quem chegasse ao resumo — inclusive quem abre um
                                            ciclo antigo, que ja nasce aqui — nao tinha como rever
                                            nenhum dos cinco quadros anteriores. */}
                                        {currentSlide > 0 && (
                                            <button
                                                onClick={prevSlide}
                                                className="report-footer-menor"
                                                title="Rever os quadros anteriores"
                                            >
                                                <ChevronLeftIcon className="h-4 w-4" />
                                                <span>Rever</span>
                                            </button>
                                        )}

                                        {onDelete && (
                                            <button
                                                onClick={onDelete}
                                                className="report-footer-menor report-danger-button"
                                                title="Deletar Ciclo"
                                            >
                                                <Trash2Icon className="h-4 w-4" />
                                                <span>Apagar</span>
                                            </button>
                                        )}

                                        {onStartNewCycle && (
                                            <button
                                                onClick={onOk}
                                                className="report-footer-menor"
                                                title="Sair com metas livres zeradas"
                                            >
                                                <XIcon className="h-4 w-4" />
                                                <span>Sair</span>
                                            </button>
                                        )}

                                        {onStartNewCycle && onContinueFromHere && (
                                            <button
                                                onClick={onContinueFromHere}
                                                className="report-footer-menor"
                                                title="Manter este progresso no modo livre"
                                            >
                                                <RefreshCwIcon className="h-4 w-4" />
                                                <span>Continuar</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                <button
                                    id={onStartNewCycle ? 'report-new-cycle-button' : undefined}
                                    onClick={onStartNewCycle || onOk}
                                    className="report-primary-cta luxe-skin-button luxe-brilho w-full shadow-xl"
                                >
                                    {onStartNewCycle ? 'Novo Ciclo' : 'OK'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ShareChoiceSheet
                isOpen={isShareChoiceOpen}
                title={isRewardSlide ? 'Compartilhar resultado do ciclo' : 'Compartilhar relatorio'}
                subtitle={isRewardSlide
                    ? 'Escolha se quer compartilhar a imagem do fechamento ou publicar esse resultado em Feitos.'
                    : 'Escolha se quer compartilhar a imagem do relatorio ou publicar esse resultado em Feitos.'}
                onShareImage={handleShareImageChoice}
                onPostToFeed={onPostToFeed}
                onClose={() => setIsShareChoiceOpen(false)}
            />
        </Portal>
    );
};



