import React, { Suspense, useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Portal } from './Portal';
import { SKINS_DATA } from '../constants/GMboard';
import { Report, ChestType } from '../types';
import { getScoreGrade } from '../utils/dateUtils';
import { VideoPlayer } from './VideoPlayer';
import { CycleAtlasPanel } from './CycleAtlasPanel';
import { resolveItemDef } from '../constants/items';
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ShareIcon, CheckIcon, CrownIcon, ZapIcon, TrophyIcon, Trash2Icon, ImageIcon } from './Icons';
import { MetalReportCard } from './MetalReportCard';
import { exportElementAsImage, shouldPreferNativeShare } from './Share';
import './report-ui.css';
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
    chest?: ChestType | null;     // Added for reward slide
    expGained?: number;           // Added for reward slide
    insignias?: string[];         // Added for reward slide
    onOpenChest?: () => void;     // Trigger chest opening
    onDelete?: () => void;        // Added for delete action
    autoPlay?: boolean;
}

const ChestVisual: React.FC<{ type: ChestType }> = ({ type }) => {
    const getColors = (t: ChestType) => {
        switch (t) {
            case 'Incomum': return { base: '#C0C0C0', highlight: '#E0E0E0', glow: 'rgba(192, 192, 192, 0.6)' }; // Prata
            case 'Raro': return { base: '#FFD700', highlight: '#FFFACD', glow: 'rgba(255, 215, 0, 0.6)' };      // Ouro
            case '\u00c9pico': return { base: '#3B82F6', highlight: '#60A5FA', glow: 'rgba(59, 130, 246, 0.6)' };    // Azul
            case 'Lend\u00e1rio': return { base: '#A855F7', highlight: '#C084FC', glow: 'rgba(168, 85, 247, 0.6)' }; // Roxo
            default: return { base: '#A0522D', highlight: '#CD853F', glow: 'rgba(160, 82, 45, 0.6)' };          // Comum (Marrom)
        }
    };

    const colors = getColors(type);

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
    chest,
    expGained,
    insignias = [],
    onOpenChest,
    onDelete,
    autoPlay = true
}) => {
    const REWARD_CARD_CAPTURE_ID = 'report-metal-card-capture';
    const preferNativeShare = shouldPreferNativeShare();
    const { userProfile } = useGame();
    const userSkinId = userProfile.skin;
    const userSkin = SKINS_DATA.find(s => s.id === userSkinId);
    const skinColor = userSkin?.color || '#ffffff';

    const [currentSlide, setCurrentSlide] = useState(0);
    const [autoPlayPaused, setAutoPlayPaused] = useState(false);
    const [rewardReveal, setRewardReveal] = useState(false);
    const [rewardFlashActive, setRewardFlashActive] = useState(false);
    const [isExportingRewardCard, setIsExportingRewardCard] = useState(false);

    const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
    const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

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
        try {
            await exportElementAsImage(REWARD_CARD_CAPTURE_ID, {
                fileName: `glyph-card-ciclo-${formatDate(report.endDate).replace(/\//g, '-')}-${scoreInfo.grade}.png`,
                title: 'Card do ciclo - Glyph',
                backgroundColor: '#050505',
                preferShare: forcePreferShare ?? preferNativeShare,
            });
        } catch (error) {
            console.error('Erro ao exportar card do relatorio:', error);
            alert('Nao foi possivel exportar o card do ciclo.');
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

    // Slide 1: Execucao
    const renderExecutionSlide = () => (
        <div className="flex flex-col h-full space-y-8 p-6">
            <div className="text-center">
                <h3 className="text-2xl font-black text-white uppercase tracking-[0.3em] mb-2">Execucao</h3>
                <div className="report-rule" />
            </div>

            <div className="space-y-6">
                <div className="report-panel p-4">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-3 font-black tracking-widest uppercase">
                        <span>Acoes</span>
                        <span className="text-white">{metrics.actionsCompleted} <span className="text-gray-600">/</span> {metrics.totalPlannedActions}</span>
                    </div>
                    <div className="report-track">
                        <div
                            className="h-full bg-gradient-to-r from-[var(--skin-accent-color)] to-white transition-all duration-1000 shadow-[0_0_10px_var(--skin-accent-color)]"
                            style={{ width: `${Math.min((metrics.actionsCompleted / Math.max(metrics.totalPlannedActions, 1)) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="report-panel p-4">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-3 font-black tracking-widest uppercase">
                        <span>Tempo</span>
                        <span className="text-white">{duration} <span className="text-gray-600">/</span> {plannedDuration} <span className="text-gray-600 text-[8px]">DIAS</span></span>
                    </div>
                    <div className="report-track">
                        <div
                            className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                            style={{ width: `${timePercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="report-panel report-panel-hover p-6 text-center group">
                    <p className="text-3xl font-black text-white mb-1 tracking-tighter">{metrics.totalHours}</p>
                    <p className="report-micro">Horas Totais</p>
                </div>
                <div className="report-panel report-panel-hover p-6 text-center group">
                    <p className="text-3xl font-black text-white mb-1 tracking-tighter">{metrics.avgHoursPerDay ?? (metrics.totalHours / totalDays).toFixed(1)}</p>
                    <p className="report-micro">Media h/dia</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="report-panel report-panel-hover p-6 text-center group">
                    <p className="text-3xl font-black text-white mb-1 tracking-tighter">{zeroDays}</p>
                    <p className="report-micro">Dias Zerados</p>
                    <p className="text-[9px] text-gray-600 mt-1">{metrics.consistencyDays || 0}/{totalDays} dias ativos</p>
                </div>
                <div className="report-panel report-panel-hover p-6 text-center group">
                    <p className={`text-3xl font-black mb-1 tracking-tighter ${paceColor}`}>{paceDelta > 0 ? `+${paceDelta}` : paceDelta}</p>
                    <p className="report-micro">Ritmo</p>
                    <p className="text-[9px] text-gray-600 mt-1">{paceLabel} - exec {executionPercentage}% x tempo {timeElapsedPercentage}%</p>
                </div>
            </div>

            <div className="report-panel p-4">
                <div className="flex justify-between text-[10px] text-gray-500 mb-3 font-black tracking-widest uppercase">
                    <span>Consistencia</span>
                    <span className="text-white">{metrics.consistencyDays || 0} <span className="text-gray-600">/</span> {totalDays} <span className="text-gray-600 text-[8px]">DIAS</span></span>
                </div>
                <div className="report-track">
                    <div
                        className="h-full bg-gradient-to-r from-[var(--skin-accent-color)] to-white/80 transition-all duration-1000 shadow-[0_0_10px_var(--skin-accent-color)]"
                        style={{ width: `${consistencyPct}%` }}
                    />
                </div>
            </div>
        </div>
    );

    // Slide 2: Territorio
    const renderAtlasSlide = () => (
        <CycleAtlasPanel weeks={weeklyAtlas} />
    );

    const renderTerritorySlide = () => (
        <div className="flex flex-col h-full space-y-6 p-6">
            <div className="text-center">
                <h3 className="text-2xl font-black text-white uppercase tracking-[0.3em] mb-2">Territorio</h3>
                <div className="report-rule" />
            </div>

            <div className="flex-1 relative bg-white/[0.02] rounded-3xl border border-white/[0.03] p-2" style={{ minHeight: 200 }}>
                <Suspense fallback={<div className="w-full h-[200px] rounded-2xl bg-white/[0.02] border border-white/[0.03]" />}>
                    <ReportRadarChart data={radarData} />
                </Suspense>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between report-panel p-4 hover:bg-white/[0.05] transition-all">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--skin-accent-color)]/10 border border-[var(--skin-accent-color)]/20 flex items-center justify-center shadow-inner">
                            <ZapIcon className="w-5 h-5 text-[var(--skin-accent-color)] filter drop-shadow-[0_0_5px_var(--skin-accent-color)]" />
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Arena Foco</p>
                            <p className="text-sm font-black text-white tracking-tight">{highlight.mostFocusedArena}</p>
                        </div>
                    </div>
                </div>

                {/* Top 3 Acoes - Roman Numeral Indicators */}
                {metrics.top3Actions && metrics.top3Actions.length > 0 && (
                    <div className="report-panel p-4 space-y-2">
                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Acoes Dominantes</p>
                        {metrics.top3Actions.map((action, idx) => (
                            <div key={idx} className="flex items-center justify-between py-1.5">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-gray-600 w-5 text-right tracking-widest">{['I', 'II', 'III'][idx]}</span>
                                    <span className="text-xs font-bold text-white truncate max-w-[180px]">{action.name}</span>
                                </div>
                                <span className="text-sm font-black text-[var(--skin-accent-color)] tabular-nums">{action.count}<span className="text-[9px] ml-0.5 opacity-40">x</span></span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // Slide 3: Conquistas
    const renderAchievementsSlide = () => {
        const hasAchievements = sealedMetas > 0 || (metrics.questsCompleted || 0) > 0 || (report.clanPoints || 0) > 0;

        return (
            <div className="flex flex-col h-full space-y-6 p-6">
                <div className="text-center">
                    <h3 className="text-2xl font-black text-white uppercase tracking-[0.3em] mb-2">Conquistas</h3>
                    <div className="report-rule" />
                </div>

                {hasAchievements ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="report-panel p-4 flex flex-col items-center group hover:bg-white/[0.05] transition-all">
                                <TrophyIcon className="w-5 h-5 text-[var(--skin-accent-color)] mb-2 filter drop-shadow-[0_0_8px_var(--skin-accent-color)]" />
                                <span className="text-2xl font-black text-[var(--skin-accent-color)] tabular-nums">{plannedMetas > 0 ? `${sealedMetas}/${plannedMetas}` : sealedMetas}</span>
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Metas</span>
                            </div>
                            <div className="report-panel p-4 flex flex-col items-center group hover:bg-white/[0.05] transition-all">
                                <CrownIcon className="w-5 h-5 text-purple-500 mb-2 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                <span className="text-2xl font-black text-purple-500 tabular-nums">{metrics.questsCompleted || 0}</span>
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Quests</span>
                            </div>
                        </div>

                        {/* Best Day + Max Streak */}
                        <div className="grid grid-cols-2 gap-3">
                            {metrics.bestDay && (
                                <div className="report-panel p-4 flex flex-col items-center hover:bg-white/[0.05] transition-all">
                                    <span className="text-2xl font-black text-white tabular-nums">{metrics.bestDayCount || 0}</span>
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Melhor Dia</span>
                                    <span className="text-[9px] text-gray-600 font-mono mt-0.5">{formatDate(metrics.bestDay)}</span>
                                </div>
                            )}
                            {(metrics.maxStreak ?? 0) > 0 && (
                                <div className="report-panel p-4 flex flex-col items-center hover:bg-white/[0.05] transition-all">
                                    <span className="text-2xl font-black text-white tabular-nums">{metrics.maxStreak}</span>
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Maior Streak</span>
                                    <span className="text-[9px] text-gray-600 font-mono mt-0.5">dias</span>
                                </div>
                            )}
                        </div>

                        <div className="text-center mt-4 p-6 bg-white/[0.02] rounded-[32px] border border-white/[0.03]">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-2">Total Acumulado</p>
                            <p className="text-5xl font-black text-white tracking-tighter">
                                <span className="text-[var(--skin-accent-color)] opacity-50">+</span>{report.expGained || expGained || 0}<span className="text-xs ml-1 opacity-30 tracking-widest">XP</span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
                        <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/[0.05] mb-6 flex items-center justify-center shadow-inner opacity-40">
                            <XIcon className="w-10 h-10 text-gray-700" />
                        </div>
                        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] leading-relaxed max-w-[200px] opacity-60">
                            "Nenhuma meta selada. <br />O ciclo ainda pede forma."
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // Slide 4: Veredito
    const renderVerdictSlide = () => (
        <div className="flex flex-col h-full items-center justify-center p-6 text-center space-y-8">
            <div className="absolute top-10 text-center">
                <h3 className="text-2xl font-black text-white uppercase tracking-[0.3em] mb-2">Veredito</h3>
                <div className="report-rule" />
            </div>

            {isLowSignal ? (
                <div className="relative group flex flex-col items-center gap-4">
                    <div className="absolute inset-0 bg-white/10 opacity-20 blur-[60px] transition-opacity duration-1000" />
                    <div className="relative z-10 rounded-[32px] border border-white/10 bg-black/60 px-8 py-6 shadow-2xl backdrop-blur-md">
                        <p className="text-[10px] font-black uppercase tracking-[0.36em] text-gray-500">Medicao</p>
                        <p className="mt-3 text-3xl font-black tracking-tight text-white">Sinal insuficiente</p>
                    </div>
                </div>
            ) : (
                <div className="relative group">
                    <div className="absolute inset-0 bg-[var(--skin-accent-color)] opacity-20 blur-[60px] group-hover:opacity-40 transition-opacity duration-1000" />
                    <div className={`text-[7rem] font-black ${scoreInfo.color} leading-none tracking-tighter filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative z-10 select-none`}>
                        {scoreInfo.grade}
                    </div>
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/[0.1] shadow-2xl z-20">
                        <span className="text-2xl font-black text-white tracking-tight">{report.performanceScore}</span>
                    </div>
                </div>
            )}

            <div className="pt-12 space-y-2 relative z-10">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{formatDate(report.startDate)}  {formatDate(report.endDate)}</p>
                <p className="text-[10px] font-black text-[var(--skin-accent-color)] uppercase tracking-[0.1em] opacity-60">{duration} dias de operacao</p>
            </div>

            <p className="text-xl font-black text-white leading-tight tracking-tight max-w-[320px] italic opacity-90 relative z-10">
                "{isLowSignal ? 'Ainda nao ha sinal suficiente para julgar este ciclo com justica.' : scoreInfo.phrase}"
            </p>

            {/* Score Decomposition  Mono-tone accent bars */}
            {(isFairScoreModel || metrics.scoreBreakdown) && (
                <div className="w-full max-w-[280px] mx-auto mt-6 space-y-2 relative z-10">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] text-center mb-3">Decomposicao</p>
                    {(
                        isFairScoreModel
                            ? [
                                { label: 'Honra', pts: fairness!.scoreBreakdown.honorPts, max: 40, opacity: 1 },
                                { label: 'Metas', pts: fairness!.scoreBreakdown.metaPts, max: 30, opacity: 0.82 },
                                { label: 'Cadencia', pts: fairness!.scoreBreakdown.cadencePts, max: 15, opacity: 0.68 },
                                { label: 'Realismo', pts: fairness!.scoreBreakdown.realismPts, max: 10, opacity: 0.54 },
                                { label: 'Ascensao', pts: fairness!.scoreBreakdown.ascensionPts, max: 5, opacity: 0.42 },
                            ]
                            : [
                                { label: 'Progresso', pts: metrics.scoreBreakdown!.progressPts, max: 40, opacity: 1 },
                                { label: 'Marcos', pts: metrics.scoreBreakdown!.milestonePts, max: Math.max(metrics.scoreBreakdown!.milestonePts, 30), opacity: 0.8 },
                                { label: 'Quests', pts: metrics.scoreBreakdown!.questPts, max: Math.max(metrics.scoreBreakdown!.questPts, 20), opacity: 0.65 },
                                { label: 'Consistencia', pts: metrics.scoreBreakdown!.consistencyPts, max: 20, opacity: 0.5 },
                                { label: 'Volume', pts: metrics.scoreBreakdown!.volumePts, max: 30, opacity: 0.4 },
                                ...((metrics.scoreBreakdown?.premiumBonusPts ?? 0) > 0 ? [{ label: 'Premium +10%', pts: metrics.scoreBreakdown!.premiumBonusPts!, max: Math.max(metrics.scoreBreakdown!.premiumBonusPts!, 50), opacity: 1, isPremium: true }] : []),
                            ]
                    ).map(({ label, pts, max, opacity, ...rest }) => (
                        <div key={label} className="flex items-center gap-3">
                            <span className={`text-[8px] font-black uppercase tracking-widest w-[72px] text-right ${'isPremium' in rest ? 'text-yellow-500' : 'text-gray-600'}`}>{label}</span>
                            <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${max > 0 ? (pts / max) * 100 : 0}%`, backgroundColor: 'isPremium' in rest ? '#EAB308' : `var(--skin-accent-color)`, opacity }}
                                />
                            </div>
                            <span className={`text-[9px] font-black tabular-nums w-6 text-right ${'isPremium' in rest ? 'text-yellow-500' : 'text-gray-500'}`}>+{pts}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Slide 5: Resumo do Relatorio
    const renderRewardSlide = () => {
        const rewardBadges = [
            chest ? { label: 'Bau', value: chest } : null,
            ((report.expGained || expGained) && (report.expGained || expGained) > 0)
                ? { label: 'XP', value: `+${report.expGained || expGained}` }
                : null,
            ...(insignias || []).slice(0, 3).map((insigniaId) => ({
                label: 'Insignia',
                value: resolveItemDef(insigniaId)?.name || insigniaId.replace(/_/g, ' '),
            })),
        ].filter(Boolean) as { label: string; value?: string }[];

        return (
            <div className={`flex h-full flex-col items-center justify-center p-6 text-center transition-all duration-700 ${rewardReveal ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'}`}>
                <div className="text-center">
                    <h3 className="text-2xl font-black text-white uppercase tracking-[0.3em] mb-2">Resumo</h3>
                    <div className="report-rule" />
                </div>

                <div className="flex w-full flex-1 items-center justify-center py-4">
                    <MetalReportCard
                        captureId={REWARD_CARD_CAPTURE_ID}
                        entryFlash={rewardFlashActive}
                        rank={scoreInfo.grade}
                        score={report.performanceScore}
                        title="Card de encerramento"
                        subtitle="Ciclo consolidado"
                        dateRange={`${formatDate(report.startDate)} - ${formatDate(report.endDate)}`}
                        metrics={[
                            { label: 'Acoes', value: `${metrics.actionsCompleted}/${metrics.totalPlannedActions}` },
                            { label: 'Carga', value: `${metrics.totalHours}h` },
                            { label: 'Metas', value: `${sealedMetas}/${plannedMetas}` },
                            { label: 'Presenca', value: `${fairness?.activeDays ?? metrics.consistencyDays ?? 0} dias` },
                        ]}
                        badges={rewardBadges}
                        className="w-full max-w-[360px]"
                    />
                </div>

                <p className={`max-w-[280px] text-[11px] font-black uppercase tracking-[0.18em] text-gray-500 transition-all duration-700 ${rewardReveal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    Compartilhe o card ou sele o proximo ciclo.
                </p>
            </div>
        );
    };

    const slides = [
        renderExecutionSlide,
        ...(weeklyAtlas.length > 0 ? [renderAtlasSlide] : []),
        renderTerritorySlide,
        renderAchievementsSlide,
        renderVerdictSlide,
        renderRewardSlide
    ];
    const totalSlides = slides.length;

    // If it's the reward slide, hide the standard footer and show the special action button
    const isRewardSlide = currentSlide === totalSlides - 1;

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
                        <div className="flex items-center gap-3">
                            {autoPlay && !isRewardSlide && (
                                <span className={`text-[9px] font-black uppercase tracking-[0.22em] ${autoPlayPaused ? 'text-gray-500' : 'text-[var(--skin-accent-color)]'}`}>
                                    {autoPlayPaused ? 'Pausado' : 'Auto'}
                                </span>
                            )}
                            <button
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

                        <div className="absolute inset-0 p-4 z-10 overflow-y-auto">
                            {slides[currentSlide]()}
                        </div>
                    </div>

                    {/* Footer Navigation */}
                    <div className="report-footer h-16 flex items-center justify-between px-6 border-t">
                        {!isRewardSlide ? (
                            <>
                                <button
                                    onClick={prevSlide}
                                    disabled={currentSlide === 0}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${currentSlide === 0 ? 'text-gray-800 border-transparent' : 'text-white border-white/[0.05] hover:bg-white/[0.05] active:scale-90'}`}
                                >
                                    <ChevronLeftIcon className="w-6 h-6" />
                                </button>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={onShare}
                                        className="report-icon-button"
                                        title="Compartilhar"
                                    >
                                        <ShareIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <button
                                    onClick={nextSlide}
                                    disabled={currentSlide === totalSlides - 1}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${currentSlide === totalSlides - 1 ? 'text-gray-800 border-transparent' : 'text-white border-white/[0.05] hover:bg-white/[0.05] active:scale-90'}`}
                                >
                                    <ChevronRightIcon className="w-6 h-6" />
                                </button>
                            </>
                        ) : (
                            <div className="w-full flex gap-3 items-center">
                                <button
                                    onClick={() => {
                                        void handleExportRewardCard(true);
                                    }}
                                    className="report-icon-button shrink-0"
                                    title="Compartilhar"
                                >
                                    <ShareIcon className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => {
                                        void handleExportRewardCard(false);
                                    }}
                                    className="report-icon-button shrink-0"
                                    title="Baixar card"
                                    disabled={isExportingRewardCard}
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </button>

                                {onDelete && (
                                    <button
                                        onClick={onDelete}
                                        className="report-icon-button report-danger-button shrink-0"
                                        title="Deletar Ciclo"
                                    >
                                        <Trash2Icon className="w-5 h-5" />
                                    </button>
                                )}

                                <button
                                    id={onStartNewCycle ? 'report-new-cycle-button' : undefined}
                                    onClick={onStartNewCycle || onOk}
                                    className="report-primary-cta luxe-skin-button group shadow-xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    {onStartNewCycle ? 'Novo Ciclo' : 'OK'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Portal>
    );
};




