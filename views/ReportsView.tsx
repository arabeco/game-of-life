


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useGame, getLocalDateString } from '../contexts/GameContext';
import { Report, Cycle, ChestType, FeedEvent } from '../types';
import { GlassCard } from '../components/GlassCard';
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ShareIcon, Trash2Icon } from '../components/Icons';
import { CycleComparator } from '../components/CycleComparator';
import { exportElementAsImage, handleShare } from '../components/Share';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { NewCycleSetupView } from './NewCycleSetupView';
import { ReportResultCarousel } from '../components/ReportResultCarousel';
import { supabase } from '../supabaseClient';
import { ReportGenerationModal } from '../components/ReportGenerationModal';
import { LegacyExportDocument, LegacyEraSummary } from '../components/LegacyExportDocument';
import { LegacyGenerationModal } from '../components/LegacyGenerationModal';
import { ChestOpeningModal } from '../components/ChestOpeningModal';
import { Portal } from '../components/Portal';

import { NOBILITY_RANKS } from '../constants/nobility';
import { resolveItemDef } from '../constants/items';
import { filterCycleTasksByScope } from '../utils/coreLoopUtils.js';

// --- Helper Functions ---
import { parseDate, daysBetween, formatDate, getScoreGrade } from '../utils/dateUtils';
const toRoman = (num: number) => {
    const map = [
        { value: 1000, symbol: 'M' },
        { value: 900, symbol: 'CM' },
        { value: 500, symbol: 'D' },
        { value: 400, symbol: 'CD' },
        { value: 100, symbol: 'C' },
        { value: 90, symbol: 'XC' },
        { value: 50, symbol: 'L' },
        { value: 40, symbol: 'XL' },
        { value: 10, symbol: 'X' },
        { value: 9, symbol: 'IX' },
        { value: 5, symbol: 'V' },
        { value: 4, symbol: 'IV' },
        { value: 1, symbol: 'I' }
    ];
    let result = '';
    let remaining = num;
    for (const item of map) {
        while (remaining >= item.value) {
            result += item.symbol;
            remaining -= item.value;
        }
    }
    return result;
};
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const LEGACY_EXPORT_CAPTURE_ID = 'legacy-complete-capture';

// --- Sub-components for Active Cycle HUD ---
const SimplifiedCycleHUD: React.FC<{ cycle: Cycle }> = ({ cycle }) => {
    const { tasks, assets, actions, userProfile, session, seasons, deleteCycle } = useGame();
    const startDate = cycle.startDate;
    const endDate = cycle.endDate;
    const today = getLocalDateString();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Tem certeza que deseja excluir este ciclo? Isso nÃ£o pode ser desfeito.")) {
            deleteCycle(cycle.id);
        }
    };

    const isQuestActionId = (actionId: string) => {
        const action = actions.find(a => a.id === actionId);
        if (!action) return false;
        const arena = assets.flatMap(asset => asset.arenas).find(ar => ar.id === action.arenaId);
        if (!arena?.name) return false;
        const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return normalized.includes('quests');
    };

    const isClanQuestActionId = (actionId: string) => {
        const action = actions.find(a => a.id === actionId);
        if (!action) return false;
        const arena = assets.flatMap(asset => asset.arenas).find(ar => ar.id === action.arenaId);
        if (!arena?.name) return false;
        const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return normalized.includes('quests - cla');
    };

    // CÃ¡lculo de dias
    const startD = parseDate(startDate);
    const endD = parseDate(endDate);
    const todayD = parseDate(today);

    const totalDays = Math.max(1, daysBetween(startD, endD) + 1);
    const daysElapsed = Math.max(0, daysBetween(startD, todayD) + 1);
    const timeProgress = Math.min(100, (daysElapsed / totalDays) * 100);

    const cycleTasks = filterCycleTasksByScope(tasks, actions, cycle, startDate, endDate);
    const completedTasks = cycleTasks.filter(t => t.completed);

    // Quest Tasks (mantidas para exibiÃ§Ã£o de bÃ´nus especÃ­fica se necessÃ¡rio)
    const questTasks = cycleTasks.filter(t => isQuestActionId(t.actionId) || isClanQuestActionId(t.actionId));
    const completedQuests = questTasks.filter(t => t.completed);

    // 1. Progress
    const progress = cycleTasks.length > 0 ? (completedTasks.length / cycleTasks.length) * 100 : 100;

    // 2. Bonuses
    // Milestones
    const milestonesCompleted = completedTasks.filter(t => {
        const action = actions.find(a => a.id === t.actionId);
        return action?.actionType === 'Marco';
    }).length;
    const milestoneBonus = milestonesCompleted * 15;

    // Quests
    const questsCompletedCount = completedQuests.length;
    const questBonus = questsCompletedCount * 10;

    // Consistency
    const uniqueDays = new Set([...completedTasks, ...completedQuests].map(t => t.date)).size;
    const consistencyRatio = uniqueDays / totalDays;
    const consistencyBonus = consistencyRatio >= 0.8 ? 20 : (consistencyRatio >= 0.5 ? 10 : 0);

    // Volume Bonus
    const totalMinutes = completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const volumeBonus = Math.min(30, Math.floor(totalHours / 2));

    // Score
    const currentScore = Math.round((progress * 0.4) + milestoneBonus + questBonus + consistencyBonus + volumeBonus);
    const scoreInfo = getScoreGrade(currentScore);

    // Avg Hours per Day + Max Streak (Phase 10)
    const avgHoursPerDay = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : '0';
    const activeDatesHUD = completedTasks.map(t => t.date).filter((v, i, a) => a.indexOf(v) === i).sort();
    let maxStreakHUD = activeDatesHUD.length > 0 ? 1 : 0;
    let currentStreakHUD = 1;
    for (let i = 1; i < activeDatesHUD.length; i++) {
        const diffMs = new Date(activeDatesHUD[i]).getTime() - new Date(activeDatesHUD[i - 1]).getTime();
        if (diffMs <= 86400000 * 1.5) { currentStreakHUD++; } else { currentStreakHUD = 1; }
        maxStreakHUD = Math.max(maxStreakHUD, currentStreakHUD);
    }

    return (
        <GlassCard variant="accent" className="p-4 space-y-4 relative group">
            <div className="text-center relative">
                <p className="font-bold text-lg">"{cycle.name}"</p>
                <p className="text-xs text-gray-400">{formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}</p>
                <p className="font-bold text-sm mt-1">Dia {daysElapsed} de {totalDays}</p>

                <button
                    onClick={handleDelete}
                    className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded-full text-red-500"
                    title="Excluir Ciclo"
                >
                    <Trash2Icon className="w-4 h-4" />
                </button>
            </div>

            <div className='space-y-3'>
                <div>
                    <div className="flex justify-between text-xs font-bold text-gray-400"><span>TEMPO</span><span>{timeProgress.toFixed(0)}%</span></div>
                    <div className="w-full bg-red-900/50 rounded-full h-2.5 mt-1 border border-red-500/20"><div className="bg-red-500 h-full rounded-full" style={{ width: `${timeProgress}%` }}></div></div>
                </div>
                <div>
                    <div className="flex justify-between text-xs font-bold text-gray-400"><span>PROGRESSO</span><span>{progress.toFixed(0)}%</span></div>
                    <div className="w-full bg-green-900/50 rounded-full h-2.5 mt-1 border border-green-500/20"><div className="bg-green-500 h-full rounded-full" style={{ width: `${progress}%` }}></div></div>
                </div>
            </div>
            <div className='text-center border-t border-[var(--skin-accent-color)]/20 pt-3'>
                <p className="text-xs font-bold text-gray-400">RANK PROJETADO</p>
                <p className={`text-4xl font-black ${scoreInfo.color}`}>{scoreInfo.grade}</p>
                <p className="text-sm font-bold text-white mt-1">Score: {currentScore}</p>
                <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-gray-500 uppercase font-mono">
                    <span>ðŸ† {milestonesCompleted} Marcos</span>
                    <span>âš”ï¸ {questsCompletedCount} Quests</span>
                    <span>ðŸ”¥ {uniqueDays} Dias</span>
                    <span>â±ï¸ {avgHoursPerDay} h/dia</span>
                    <span>ðŸ”— {maxStreakHUD} Streak</span>
                </div>
            </div>
        </GlassCard>
    );
};

const StartCycleModal: React.FC<{ onClose: () => void; onStart: (name: string, endDate: string) => void; }> = ({ onClose, onStart }) => {
    const [name, setName] = useState('');
    const [endDate, setEndDate] = useState('');
    const today = getLocalDateString();

    const handleStart = () => {
        if (endDate && name) {
            onStart(name, endDate);
            onClose();
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant='neutral' className='p-4 space-y-4 w-full max-w-sm' onClick={e => e.stopPropagation()}>
                    <h2 className='text-center font-bold text-lg uppercase'>Definir Ciclo de Soberania</h2>
                    <p className="text-center text-sm text-gray-400">DÃª um nome Ã  sua campanha e escolha a data de tÃ©rmino para formalizar seu compromisso.</p>
                    <div>
                        <label className='text-sm font-bold'>Nome do Ciclo</label>
                        <input
                            type='text'
                            placeholder='Ex: Conquista de Fevereiro'
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className='w-full p-3 bg-black/30 rounded-lg border border-white/20 mt-1'
                        />
                    </div>
                    <div>
                        <label className='text-sm font-bold'>Data de TÃ©rmino</label>
                        <input
                            type='date'
                            value={endDate}
                            min={today}
                            onChange={e => setEndDate(e.target.value)}
                            className='w-full p-3 bg-black/30 rounded-lg border border-white/20 mt-1'
                        />
                    </div>
                    <button onClick={handleStart} disabled={!endDate || !name} className="w-full py-3 rounded-xl luxe-skin-button disabled:opacity-50">INICIAR CICLO</button>
                </GlassCard>
            </div>
        </Portal>
    );
};

// --- Timeline Components ---

const TimelineCard: React.FC<{ report: Report, isLatest: boolean, onClick: () => void, seasonName?: string, isEditing?: boolean }> = ({ report, isLatest, onClick, seasonName, isEditing }) => {
    const scoreInfo = getScoreGrade(report.performanceScore);
    const startDate = formatDate(report.startDate);
    const endDate = formatDate(report.endDate);

    return (
        <div className="relative pl-8">
            <div className={`absolute left-0 top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-500 ${isLatest ? 'bg-black border-[var(--skin-accent-color)] shadow-[0_0_15px_var(--sephirot-glow-color)] scale-110' : 'bg-black border-white/20'}`}>
                {isLatest && <div className="w-2 h-2 bg-[var(--skin-accent-color)] rounded-full animate-pulse"></div>}
            </div>
            <div
                onClick={onClick}
                className={`
                    relative overflow-hidden rounded-xl p-3 cursor-pointer transition-all duration-300 group
                    ${isLatest
                        ? 'bg-gradient-to-br from-gray-900 to-black border border-[var(--skin-accent-color)] shadow-[0_0_20px_rgba(var(--skin-accent-rgb),0.1)] transform scale-[1.02]'
                        : 'bg-black/40 border border-white/10 hover:bg-white/5 hover:border-white/20'
                    }
                    ${isEditing ? 'scale-[0.98]' : ''}
                `}
            >
                {isLatest && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-[var(--skin-accent-color)] text-black text-[10px] font-black uppercase tracking-wider rounded-bl-lg shadow-lg">
                        Atual
                    </div>
                )}

                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h4 className={`font-bold text-sm truncate ${isLatest ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                            {report.cycleName || 'Ciclo'}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            {seasonName && (
                                <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500 uppercase tracking-widest border border-white/5">
                                    {seasonName}
                                </span>
                            )}
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
                                {startDate} - {endDate}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-2xl font-black ${scoreInfo.color}`}>{scoreInfo.grade}</span>
                        <p className="text-[10px] text-gray-500">Score {report.performanceScore}</p>
                    </div>
                </div>

                <div className={`flex items-center flex-wrap gap-3 mt-2 pt-2 border-t ${isLatest ? 'border-[var(--skin-accent-color)]/20' : 'border-white/5'}`}>
                    {report.highlight?.mostFocusedArena && (
                        <div className="flex items-center gap-2 text-xs min-w-0">
                            <span className="text-[var(--skin-accent-color)]">ðŸŽ¯</span>
                            <span className="text-gray-400 truncate">Foco: <span className="text-gray-300">{report.highlight.mostFocusedArena}</span></span>
                        </div>
                    )}
                    {report.highlight?.mostRepeatedAction && (
                        <div className="flex items-center gap-2 text-xs min-w-0">
                            <span className="text-blue-400">âš¡</span>
                            <span className="text-gray-400 truncate">HÃ¡bito: <span className="text-gray-300">{report.highlight.mostRepeatedAction}</span></span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main View ---
export const ReportsView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const {
        reports, activeCycle, startCycle, endCycle, assets, actions,
        applyExp, addChest, addFeedEvent, seasons, userProfile,
        oraclePreferences, showToast, grantInventoryItem, grantUserUnlock,
        setAchievementUnlocked, deleteCycle // Added deleteCycle here
    } = useGame();
    const [view, setView] = useState<'hub' | 'scanning' | 'results' | 'comparing' | 'reward'>('hub');
    const [isStartingCycle, setIsStartingCycle] = useState(false);
    const [showConfirmEndCycle, setShowConfirmEndCycle] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [reportsToCompare, setReportsToCompare] = useState<[Report, Report] | null>(null);
    const [reportForComparison, setReportForComparison] = useState<Report | null>(null);
    const [showNewCycleSetup, setShowNewCycleSetup] = useState(false);
    const [expGained, setExpGained] = useState(0);
    const [grantedInsignias, setGrantedInsignias] = useState<string[]>([]);
    const [earnedChest, setEarnedChest] = useState<ChestType | null>(null);
    const [isPostCycleFlow, setIsPostCycleFlow] = useState(false);
    const [cycleShimmer, setCycleShimmer] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scanAttempt, setScanAttempt] = useState(0);
    const [showChestModal, setShowChestModal] = useState(false);
    const [isExportingLegacy, setIsExportingLegacy] = useState(false);
    const [showLegacyGenerationModal, setShowLegacyGenerationModal] = useState(false);
    const assetsRef = useRef(assets);
    const actionsRef = useRef(actions);
    const endCycleRef = useRef(endCycle);
    const [isEditingEras, setIsEditingEras] = useState(false);
    const [eraBreaks, setEraBreaks] = useState<number[]>([]);
    const [hasCustomEras, setHasCustomEras] = useState(false);
    const [draggingBoundary, setDraggingBoundary] = useState<number | null>(null);
    const sortedReports = useMemo(() => [...reports].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()), [reports]);
    const defaultEraBreaks = useMemo(() => {
        const breaks: number[] = [];
        for (let i = 0; i < sortedReports.length - 1; i += 1) {
            if (sortedReports[i].seasonId !== sortedReports[i + 1].seasonId) {
                breaks.push(i + 1);
            }
        }
        return breaks;
    }, [sortedReports]);

    const getUserId = () => (isUuid(userProfile.id) ? userProfile.id : null);

    useEffect(() => {
        if (!hasCustomEras) {
            setEraBreaks(defaultEraBreaks);
        }
    }, [defaultEraBreaks, hasCustomEras]);

    useEffect(() => {
        if (hasCustomEras) {
            setEraBreaks(prev => prev.filter(b => b > 0 && b < sortedReports.length));
        }
    }, [sortedReports.length, hasCustomEras]);

    useEffect(() => {
        const loadEraBoundaries = async () => {
            const userId = getUserId();
            if (!userId) {
                setHasCustomEras(false);
                return;
            }
            const { data, error } = await supabase
                .from('era_boundaries')
                .select('after_report_id')
                .eq('user_id', userId);
            if (error) {
                console.error('Erro ao carregar Eras:', error.message);
                return;
            }
            if (!data || data.length === 0) {
                setHasCustomEras(false);
                return;
            }
            const nextBreaks = data
                .map((row: any) => {
                    const index = sortedReports.findIndex(r => r.id === row.after_report_id);
                    return index >= 0 ? index + 1 : null;
                })
                .filter((value: number | null): value is number => value !== null);
            if (nextBreaks.length === 0) {
                setHasCustomEras(false);
                return;
            }
            const uniqueBreaks = Array.from(new Set(nextBreaks)).sort((a, b) => a - b);
            setEraBreaks(uniqueBreaks);
            setHasCustomEras(true);
        };
        if (!isEditingEras) {
            loadEraBoundaries();
        }
    }, [sortedReports, userProfile.id, isEditingEras]);

    useEffect(() => {
        assetsRef.current = assets;
    }, [assets]);

    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    useEffect(() => {
        endCycleRef.current = endCycle;
    }, [endCycle]);

    const performEndOfCycle = () => {
        try {
            const result = endCycleRef.current(assetsRef.current, actionsRef.current);
            if (!result?.report) throw new Error('RelatÃ³rio invÃ¡lido');
            const { report, expGained } = result;
            setSelectedReport(report);
            setExpGained(expGained);

            const startD = parseDate(report.startDate);
            const endD = parseDate(report.endDate);
            const durationDays = Math.max(1, daysBetween(startD, endD) + 1);
            const score = report.performanceScore;

            let chestType: ChestType | null = null;

            if (expGained >= 25000 && score >= 90) chestType = 'Lendário';
            else if (expGained >= 12000 && score >= 80) chestType = 'Épico';
            else if (expGained >= 5000 && score >= 70) chestType = 'Raro';
            else if (expGained >= 2250 && score >= 60) chestType = 'Incomum';
            else if (expGained >= 750) chestType = 'Comum';

            if (chestType && chestType !== 'Lendário') {
                const roll = Math.random();
                if (roll < 0.05) {
                    if (chestType === 'Comum') chestType = 'Incomum';
                    else if (chestType === 'Incomum') chestType = 'Raro';
                    else if (chestType === 'Raro') chestType = 'Épico';
                    else if (chestType === 'Épico') chestType = 'Lendário';
                }
            }

            if (durationDays < 7) {
                chestType = null;
            }

            setEarnedChest(chestType);

            const insigniasToGrant: string[] = [];

            if (score === 100) {
                insigniasToGrant.push('insignia_sitrep_s');
            } else if (score >= 90) {
                insigniasToGrant.push('insignia_sitrep_a');
            } else if (score >= 80) {
                insigniasToGrant.push('insignia_sitrep_b');
            } else if (score >= 70) {
                insigniasToGrant.push('insignia_sitrep_c');
            } else {
                insigniasToGrant.push('insignia_report_comum');
            }

            const currentExp = userProfile.nobility?.exp || 0;
            const nextExp = currentExp + expGained;

            const nextRank = NOBILITY_RANKS.find(r => r.expTotalRequired <= nextExp && r.expTotalRequired > currentExp);

            if (nextRank) {
                const rankIndex = NOBILITY_RANKS.indexOf(nextRank);
                insigniasToGrant.push(`insignia_rank_${rankIndex + 1}_${nextRank.id}`);
            }

            setGrantedInsignias(insigniasToGrant);
            setIsPostCycleFlow(true);
            return chestType;
        } catch (error) {
            console.error('Erro ao analisar ciclo:', error);
            setScanError('NÃ£o foi possÃ­vel analisar o ciclo. Tente novamente.');
            return null;
        }
    };

    useEffect(() => {
        if (view === 'scanning') {
            setScanError(null);

            // Check preferences for animation
            if (oraclePreferences?.animationsEnabled) {
                // Do nothing, ReportGenerationModal handles calling performEndOfCycle
                return;
            }

            // Fallback for NO animations (Legacy behavior)
            const timer = window.setTimeout(() => {
                const chest = performEndOfCycle();
                if (chest) setView('results');
            }, 3000);
            return () => window.clearTimeout(timer);
        }
    }, [view, scanAttempt, oraclePreferences?.animationsEnabled]);

    useEffect(() => {
        if (view === 'results' && isPostCycleFlow) {
            setCycleShimmer(true);
            const timer = window.setTimeout(() => setCycleShimmer(false), 1500);
            return () => window.clearTimeout(timer);
        }
        setCycleShimmer(false);
    }, [view, isPostCycleFlow]);

    const handleEndCycle = () => setShowConfirmEndCycle(true);
    const confirmEndCycle = () => {
        setShowConfirmEndCycle(false);
        if (!activeCycle) {
            setScanError('Nenhum ciclo ativo para analisar.');
            setView('scanning');
            return;
        }
        setScanError(null);
        setScanAttempt(prev => prev + 1);
        setView('scanning');
    };

    const handleViewReport = (report: Report) => {
        if (reportForComparison) {
            setReportsToCompare([reportForComparison, report]);
            setView('comparing');
            setReportForComparison(null);
        } else {
            setSelectedReport(report);
            setView('results');
        }
    };
    const handleStartCompare = () => { if (reports.length >= 2) { setReportsToCompare([reports[0], reports[1]]); setView('comparing'); } };

    const handlePostToFeed = (report: Report) => {
        addFeedEvent({
            type: 'CYCLE_COMPLETED',
            content: {
                title: activeCycle?.name || "um ciclo",
                score: report.performanceScore,
            },
        });
        alert('Postado no feed!');
    };

    const handleCloseDynamic = () => {
        switch (view) {
            case 'results':
            case 'comparing':
                setView('hub');
                setSelectedReport(null);
                setReportsToCompare(null);
                setReportForComparison(null);
                break;
            default:
                onClose();
        }
    };

    const handlePostCycleResultsOk = () => {
        const currentExp = userProfile.nobility.exp;
        const nextExp = currentExp + expGained;

        applyExp(expGained);

        const earnedItems: string[] = [];
        const itemNames: string[] = [];

        // Grant Insignias if earned (Cycle Report Insignias - Bronze)
        if (grantedInsignias.length > 0) {
            grantedInsignias.forEach(insigniaId => {
                grantUserUnlock('insignias', insigniaId);
                grantInventoryItem(insigniaId, true);
                earnedItems.push(insigniaId);
                const def = resolveItemDef(insigniaId);
                if (def) itemNames.push(def.name);
            });
        }

        if (earnedChest) {
            addChest(earnedChest);
        }

        // Check for Rank Up (Gold Insignia)
        const nextRank = NOBILITY_RANKS.find(r => r.expTotalRequired <= nextExp && r.expTotalRequired > currentExp);
        if (nextRank) {
            const rankInsigniaId = `insignia_rank_${NOBILITY_RANKS.indexOf(nextRank) + 1}_${nextRank.id}`;
            grantUserUnlock('insignias', rankInsigniaId);
            grantInventoryItem(rankInsigniaId, true);
            earnedItems.push(rankInsigniaId);
            const rankDef = resolveItemDef(rankInsigniaId);
            if (rankDef) itemNames.push(rankDef.name);
        }

        // Determine all items to show in modal (using names to resolve defs if needed, or IDs directly)
        const allEarnedItems: string[] = [...earnedItems];

        // Show Achievement Modal
        // If Ranked Up, prioritize PLAYER_RANK_UP modal
        if (nextRank) {
            setAchievementUnlocked({
                type: 'PLAYER_RANK_UP',
                data: {
                    name: nextRank.name,
                    rank: nextRank,
                    rewards: {
                        exp: expGained,
                        items: allEarnedItems,
                        chest: earnedChest
                    }
                }
            });
        } else {
            setAchievementUnlocked({
                type: 'REPORT_COMPLETED',
                data: {
                    title: `RelatÃ³rio de Ciclo - ${selectedReport?.performanceScore || 0}%`,
                    reward: {
                        exp: expGained,
                        items: allEarnedItems,
                        chest: earnedChest
                    }
                }
            });
        }

        setIsPostCycleFlow(false);
        setGrantedInsignias([]);
        setView('hub');
    };

    const getSeasonById = (seasonId?: string) => seasons.find(s => s.id === seasonId);
    const getSeasonByDate = (date: string) => seasons.find(s => date >= s.start_date && date <= s.end_date);
    const getEraTone = (grade: string) => {
        if (grade === 'S' || grade === 'A') return '#D4AF37';
        if (grade === 'B') return '#C0C0C0';
        if (grade === 'C') return '#CD7F32';
        return '#6B7280';
    };
    const getEraLabel = (index: number) => `ERA ${toRoman(index + 1)}`;
    const normalizedEraBreaks = useMemo(
        () => Array.from<number>(new Set(eraBreaks.filter((b): b is number => typeof b === 'number' && b > 0 && b < sortedReports.length))).sort((a, b) => a - b),
        [eraBreaks, sortedReports.length]
    );
    const eraSegments = useMemo(() => {
        if (sortedReports.length === 0) return [] as Array<{ start: number; end: number }>;
        const segments: Array<{ start: number; end: number }> = [];
        let start = 0;
        normalizedEraBreaks.forEach((breakIndex) => {
            segments.push({ start, end: breakIndex - 1 });
            start = breakIndex;
        });
        segments.push({ start, end: sortedReports.length - 1 });
        return segments;
    }, [sortedReports, normalizedEraBreaks]);
    const eraSummaries = useMemo<LegacyEraSummary[]>(() => {
        return eraSegments.map((segment, index) => {
            const segmentReports = sortedReports.slice(segment.start, segment.end + 1);
            const newestReport = segmentReports[0];
            const oldestReport = segmentReports[segmentReports.length - 1];
            const avgScore = Math.round(segmentReports.reduce((sum, report) => sum + report.performanceScore, 0) / Math.max(segmentReports.length, 1));
            const totalHours = segmentReports.reduce((sum, report) => sum + (report.metrics.totalHours || 0), 0);
            const bestStreak = segmentReports.reduce((best, report) => Math.max(best, report.metrics.maxStreak || 0), 0);
            const grade = getScoreGrade(avgScore).grade;
            const color = getEraTone(grade);

            const arenaCounts = new Map<string, number>();
            const actionCounts = new Map<string, number>();

            segmentReports.forEach((report) => {
                const arenaName = report.highlight?.mostFocusedArena?.trim() || 'Sem arena dominante';
                arenaCounts.set(arenaName, (arenaCounts.get(arenaName) || 0) + 1);

                const dominantActions = report.metrics.top3Actions && report.metrics.top3Actions.length > 0
                    ? report.metrics.top3Actions
                    : (report.highlight?.mostRepeatedAction
                        ? [{ name: report.highlight.mostRepeatedAction, count: report.highlight.mostRepeatedActionCount || 1 }]
                        : []);

                dominantActions.forEach((action) => {
                    const actionName = action.name?.trim();
                    if (!actionName) return;
                    actionCounts.set(actionName, (actionCounts.get(actionName) || 0) + Math.max(action.count || 1, 1));
                });
            });

            const dominantArena = [...arenaCounts.entries()]
                .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))[0]?.[0] || 'Sem arena dominante';

            const topActions = [...actionCounts.entries()]
                .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
                .slice(0, 3)
                .map(([name, count]) => ({ name, count }));

            return {
                label: getEraLabel(index),
                startDate: oldestReport?.startDate || newestReport?.startDate || '',
                endDate: newestReport?.endDate || oldestReport?.endDate || '',
                avgScore,
                totalHours,
                cycleCount: segmentReports.length,
                dominantArena,
                topActions,
                bestStreak,
                grade,
                color,
            };
        });
    }, [eraSegments, sortedReports]);
    const sovereignName = userProfile.nickname || userProfile.username || 'Soberano';
    const historicalAverageScore = useMemo(
        () => sortedReports.length > 0 ? sortedReports.reduce((sum, report) => sum + report.performanceScore, 0) / sortedReports.length : 0,
        [sortedReports]
    );
    const totalHistoricalHours = useMemo(
        () => sortedReports.reduce((sum, report) => sum + (report.metrics.totalHours || 0), 0),
        [sortedReports]
    );
    const historyStartDate = eraSummaries[eraSummaries.length - 1]?.startDate;
    const historyEndDate = eraSummaries[0]?.endDate;

    const handleExportLegacy = async () => {
        if (eraSummaries.length === 0) {
            showToast('Nao ha Eras concluidas para exportar.');
            return;
        }

        setIsExportingLegacy(true);
        try {
            await exportElementAsImage(LEGACY_EXPORT_CAPTURE_ID, {
                fileName: `glyph-registro-de-soberania-${getLocalDateString()}.png`,
                title: `Registro de Soberania - ${sovereignName}`,
                backgroundColor: '#050505',
                preferShare: false,
            });
            showToast('Registro de Soberania exportado.');
        } catch (error) {
            console.error('Erro ao exportar legado completo:', error);
            showToast('Nao foi possivel exportar o Legado Completo.');
        } finally {
            setIsExportingLegacy(false);
        }
    };

    const handleStartLegacyExport = () => {
        if (eraSummaries.length === 0) {
            showToast('Nao ha Eras concluidas para exportar.');
            return;
        }

        setShowLegacyGenerationModal(true);
    };


    const handleStartEraEdit = () => setIsEditingEras(true);
    const handleResetEras = async () => {
        setIsEditingEras(false);
        setHasCustomEras(false);
        setEraBreaks(defaultEraBreaks);
        const userId = getUserId();
        if (!userId) return;
        const { error } = await supabase.from('era_boundaries').delete().eq('user_id', userId);
        if (error) console.error('Erro ao resetar Eras:', error.message);
    };
    const handleConfirmEraEdit = async () => {
        setIsEditingEras(false);
        const normalized = Array.from<number>(new Set(eraBreaks.filter((b): b is number => typeof b === 'number' && b > 0 && b < sortedReports.length))).sort((a, b) => a - b);
        setEraBreaks(normalized);
        setHasCustomEras(true);

        const userId = getUserId();
        if (!userId) return;
        await supabase.from('era_boundaries').delete().eq('user_id', userId);
        const payload = normalized
            .map(b => sortedReports[b - 1]?.id)
            .filter(Boolean)
            .map(afterReportId => ({ user_id: userId, after_report_id: afterReportId }));
        if (payload.length > 0) {
            const { error } = await supabase.from('era_boundaries').insert(payload);
            if (error) console.error('Erro ao salvar Eras:', error.message);
        }
    };
    const handleDragStart = (boundaryIndex: number) => (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('text/plain', String(boundaryIndex));
        setDraggingBoundary(boundaryIndex);
    };
    const handleDragEnd = () => setDraggingBoundary(null);
    const handleDropBoundary = (targetIndex: number) => (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const source = Number(e.dataTransfer.getData('text/plain'));
        if (!source || source === targetIndex) return;
        setEraBreaks(prev => {
            const next = prev.filter(b => b !== source);
            if (!next.includes(targetIndex)) next.push(targetIndex);
            return next.sort((a, b) => a - b);
        });
        setDraggingBoundary(null);
    };
    const allowDrop = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    const renderContent = () => {
        switch (view) {
            case 'scanning':
                // Show ReportGenerationModal only if animations enabled AND no error
                if (oraclePreferences?.animationsEnabled && !scanError) {
                    return (
                        <ReportGenerationModal
                            onComplete={() => {
                                const chest = performEndOfCycle();
                                if (chest || true) setView('results'); // Always go to results after generation
                            }}
                            onOpen={() => {
                                // Legacy/Unused if we auto-transition
                                setView('results');
                            }}
                            onClose={() => {
                                setView('hub');
                            }}
                        />
                    );
                }

                // Legacy/Error View
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        {scanError ? (
                            <>
                                <p className="text-sm text-gray-300 text-center max-w-[260px]">{scanError}</p>
                                <div className="mt-4 w-full space-y-2">
                                    <button onClick={() => { setScanError(null); setScanAttempt(prev => prev + 1); }} className="w-full py-2 rounded-xl luxe-skin-button text-xs">TENTAR NOVAMENTE</button>
                                    <button onClick={() => { setScanError(null); setView('hub'); }} className="w-full py-2 rounded-xl luxe-button-secondary text-xs">VOLTAR</button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in text-center mt-20">
                                <p className="text-gray-400 font-mono animate-pulse uppercase tracking-[0.2em] text-[10px]">Gerando RelatÃ³rio...</p>
                            </div>
                        )}
                    </div>
                );
            case 'hub': {
                const items: Array<
                    | { type: 'active'; cycle: Cycle }
                    | { type: 'report'; report: Report; reportIndex: number; seasonName?: string }
                    | { type: 'boundary'; boundaryIndex: number; seasonDate?: string }
                > = [];
                const reportRowIndexMap = new Map<number, number>();

                if (activeCycle) {
                    items.push({ type: 'active', cycle: activeCycle });
                }

                sortedReports.forEach((report, index) => {
                    const season = getSeasonById(report.seasonId) || getSeasonByDate(report.endDate);
                    items.push({ type: 'report', report, reportIndex: index, seasonName: season?.name });
                    reportRowIndexMap.set(index, items.length - 1);

                    if (index < sortedReports.length - 1) {
                        const nextReport = sortedReports[index + 1];
                        const seasonChanged = report.seasonId !== nextReport.seasonId;
                        const seasonDate = seasonChanged ? (season?.end_date || report.endDate) : undefined;
                        items.push({ type: 'boundary', boundaryIndex: index + 1, seasonDate });
                    }
                });

                return (
                    <div className="pb-12">
                        {reportForComparison && (
                            <div className="p-3 bg-blue-900/30 rounded-lg text-center text-sm mb-6">Selecione um relatÃ³rio para comparar com o ciclo de {formatDate(reportForComparison.startDate)}.</div>
                        )}

                        {activeCycle ? (
                            <div className="relative z-20 space-y-2">
                                <button id="end-cycle-button" onClick={handleEndCycle} className="w-full py-3 rounded-xl luxe-skin-button shadow-lg shadow-[var(--skin-accent-color)]/20">ENCERRAR CICLO ATUAL</button>
                                <button id="eras-button" onClick={handleStartEraEdit} disabled={isEditingEras || sortedReports.length < 2} className="w-full py-2 rounded-xl luxe-button-secondary text-xs disabled:opacity-40">SETAR ERAS</button>
                                <button onClick={handleResetEras} disabled={sortedReports.length < 2 || (!hasCustomEras && eraBreaks.length === defaultEraBreaks.length)} className="w-full py-2 rounded-xl luxe-button-secondary text-xs disabled:opacity-40">RESETAR ERAS</button>
                            </div>
                        ) : (
                            <div className="relative z-20 space-y-2">
                                <button id="start-new-cycle-button" onClick={() => setIsStartingCycle(true)} className="w-full py-3 rounded-xl luxe-skin-button mb-4 shadow-lg shadow-[var(--skin-accent-color)]/20">INICIAR NOVO CICLO</button>
                                {reports.length < 1 && <div className="text-center text-sm text-gray-500 py-4 italic">Sem histÃ³rico. Inicie sua jornada.</div>}
                                <button id="eras-button" onClick={handleStartEraEdit} disabled={isEditingEras || sortedReports.length < 2} className="w-full py-2 rounded-xl luxe-button-secondary text-xs disabled:opacity-40">SETAR ERAS</button>
                                <button onClick={handleResetEras} disabled={sortedReports.length < 2 || (!hasCustomEras && eraBreaks.length === defaultEraBreaks.length)} className="w-full py-2 rounded-xl luxe-button-secondary text-xs disabled:opacity-40">RESETAR ERAS</button>
                            </div>
                        )}

                        {(sortedReports.length > 0 || activeCycle) && (
                            <div className="relative mt-6">
                                {isEditingEras && (
                                    <div className="mb-3">
                                        <button onClick={handleConfirmEraEdit} className="w-full py-2 rounded-xl luxe-skin-button text-xs">CONFIRMAR</button>
                                    </div>
                                )}
                                <div className="grid grid-cols-[72px_1fr_36px] gap-x-2">
                                    {items.map((item, rowIndex) => {
                                        if (item.type === 'active') {
                                            return (
                                                <React.Fragment key={`active-${item.cycle.id}`}>
                                                    <div className="relative py-3"></div>
                                                    <div className="relative py-3">
                                                        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-white/10"></div>
                                                        <div className="relative pl-8">
                                                            <div className="absolute left-0 top-4 w-6 h-6 rounded-full border-2 border-[var(--skin-accent-color)] bg-black shadow-[0_0_15px_var(--sephirot-glow-color)] flex items-center justify-center">
                                                                <div className="w-2 h-2 bg-[var(--skin-accent-color)] rounded-full animate-pulse"></div>
                                                            </div>
                                                            <div className={isEditingEras ? 'scale-[0.98]' : ''}>
                                                                <SimplifiedCycleHUD cycle={item.cycle} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="relative py-3"></div>
                                                </React.Fragment>
                                            );
                                        }

                                        if (item.type === 'report') {
                                            return (
                                                <React.Fragment key={item.report.id}>
                                                    <div className="relative py-3"></div>
                                                    <div className="relative py-3">
                                                        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-white/10"></div>
                                                        <TimelineCard
                                                            report={item.report}
                                                            isLatest={item.reportIndex === 0 && !activeCycle}
                                                            onClick={() => handleViewReport(item.report)}
                                                            seasonName={item.seasonName}
                                                            isEditing={isEditingEras}
                                                        />
                                                    </div>
                                                    <div className="relative py-3"></div>
                                                </React.Fragment>
                                            );
                                        }

                                        const isBoundarySet = eraBreaks.includes(item.boundaryIndex);
                                        return (
                                            <React.Fragment key={`boundary-${item.boundaryIndex}-${rowIndex}`}>
                                                <div className="relative py-2 flex items-center justify-end">
                                                    {item.seasonDate && (
                                                        <div className="flex items-center justify-end w-full">
                                                            <span className="text-[10px] text-gray-400 font-mono">{formatDate(item.seasonDate)}</span>
                                                            <div className="ml-2 h-px w-4 bg-white/20"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="relative py-2">
                                                    <div className="absolute left-[11px] top-0 bottom-0 w-px bg-white/10"></div>
                                                    {item.seasonDate && (
                                                        <>
                                                            <div className="absolute left-[11px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/20"></div>
                                                            <div className="absolute left-[11px] right-0 top-1/2 h-px bg-white/10"></div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="relative py-2 flex items-center justify-center">
                                                    {isEditingEras && (
                                                        <div
                                                            onDragOver={allowDrop}
                                                            onDrop={handleDropBoundary(item.boundaryIndex)}
                                                            className={`w-6 h-6 rounded-full border flex items-center justify-center ${isBoundarySet ? 'border-[var(--skin-accent-color)]' : 'border-white/10'} ${draggingBoundary !== null ? 'bg-white/5' : ''}`}
                                                        >
                                                            {isBoundarySet && (
                                                                <div
                                                                    draggable
                                                                    onDragStart={handleDragStart(item.boundaryIndex)}
                                                                    onDragEnd={handleDragEnd}
                                                                    className="w-3 h-3 rounded-full bg-[var(--skin-accent-color)] cursor-grab"
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                    {eraSegments.map((segment, index) => {
                                        const rowStart = reportRowIndexMap.get(segment.start);
                                        const rowEnd = reportRowIndexMap.get(segment.end);
                                        if (rowStart === undefined || rowEnd === undefined) return null;
                                        const segmentReports = sortedReports.slice(segment.start, segment.end + 1);
                                        const avgScore = segmentReports.reduce((sum, report) => sum + report.performanceScore, 0) / Math.max(segmentReports.length, 1);
                                        const grade = getScoreGrade(Math.round(avgScore)).grade;
                                        const eraColor = getEraTone(grade);

                                        return (
                                            <div
                                                key={`era-${segment.start}-${segment.end}`}
                                                className="col-start-3 flex justify-center pointer-events-none"
                                                style={{ gridRow: `${rowStart + 1} / ${rowEnd + 2}`, marginTop: index === 0 ? 0 : 8, marginBottom: index === eraSegments.length - 1 ? 0 : 8 }}
                                            >
                                                <div className="w-8 h-full rounded-sm flex items-center justify-center" style={{ backgroundColor: eraColor, opacity: 0.25 }}>
                                                    <span className="text-[9px] tracking-[0.3em] text-gray-400 uppercase rotate-90">{getEraLabel(index)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {reports.length >= 2 && !activeCycle && !reportForComparison && (
                                    <div className="mt-4">
                                        <button onClick={handleStartCompare} className="w-full py-2 rounded-xl luxe-button-secondary text-xs">COMPARAR ÃšLTIMOS 2 CICLOS</button>
                                    </div>
                                )}
                                {sortedReports.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <button
                                            onClick={handleStartLegacyExport}
                                            disabled={isExportingLegacy || showLegacyGenerationModal}
                                            className="w-full py-3 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {(isExportingLegacy || showLegacyGenerationModal) ? 'SELANDO LEGADO...' : 'EXPORTAR LEGADO COMPLETO'}
                                        </button>
                                        <p className="text-[10px] text-center text-gray-500 uppercase tracking-[0.25em]">
                                            Gera uma imagem longa com todas as Eras, scores historicos e acoes dominantes.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            }
            case 'results':
                return selectedReport ? (
                    <ReportResultCarousel
                        report={selectedReport}
                        onOk={isPostCycleFlow ? handlePostCycleResultsOk : handleCloseDynamic}
                        onCompare={() => { setReportForComparison(selectedReport); setView('hub'); }}
                        onShare={() => handleShare('report-summary-card-capture', `RelatÃ³rio de Ciclo ${formatDate(selectedReport.startDate)} - Life OS`)}
                        onPostToFeed={() => handlePostToFeed(selectedReport)}
                        onDelete={() => {
                            if (confirm("Tem certeza que deseja excluir este relatÃ³rio?")) {
                                // We need a way to delete historical reports.
                                // For now, maybe just hide it or we need a proper deleteReport function
                                // But the user asked to delete "cycles". A past report IS a cycle.
                                // Since deleteCycle takes an ID, and report.id matches cycle.id (usually), we can try that.
                                deleteCycle(selectedReport.id);
                                setView('hub');
                                setSelectedReport(null);
                            }
                        }}
                        onStartNewCycle={() => {
                            applyExp(expGained);

                            // Grant Insignias if earned
                            if (grantedInsignias.length > 0) {
                                grantedInsignias.forEach(insigniaId => {
                                    grantUserUnlock('insignias', insigniaId);
                                    grantInventoryItem(insigniaId, true);
                                });
                            }

                            if (earnedChest) {
                                addChest(earnedChest);
                                const msg = grantedInsignias.length > 0
                                    ? `âœ¦ BaÃº ${earnedChest} e ${grantedInsignias.length} InsÃ­gnia(s) adicionados\nâœ¦ +${expGained} XP computados`
                                    : `âœ¦ BaÃº ${earnedChest} adicionado ao inventÃ¡rio\nâœ¦ +${expGained} XP computados`;
                                showToast(msg);
                            } else {
                                const msg = grantedInsignias.length > 0
                                    ? `âœ¦ ${grantedInsignias.length} InsÃ­gnia(s) adicionada(s) ao inventÃ¡rio\nâœ¦ +${expGained} XP computados`
                                    : `âœ¦ +${expGained} XP foram computados ao seu perfil`;
                                showToast(msg);
                            }
                            setIsPostCycleFlow(false);
                            setGrantedInsignias([]);
                            setShowNewCycleSetup(true);
                        }}
                        chest={isPostCycleFlow ? earnedChest : null}
                        expGained={isPostCycleFlow ? expGained : undefined}
                        insignias={isPostCycleFlow ? grantedInsignias : []}
                    />
                ) : <p>Erro ao carregar relatÃ³rio.</p>;
            case 'comparing':
                return reportsToCompare ? (
                    <CycleComparator
                        currentCycleReport={reportsToCompare[0]}
                        pastCycleReport={reportsToCompare[1]}
                    />
                ) : <p>Erro ao carregar comparaÃ§Ã£o.</p>;
        }
    };

    const getTitle = () => {
        switch (view) {
            case 'results': return 'Resultados';
            case 'comparing': return 'AnÃ¡lise Comparativa';
            case 'reward':
                return 'Fim do Ciclo';
            default: return 'Ciclos';
        }
    }

    if (showNewCycleSetup) {
        return <NewCycleSetupView onComplete={onClose} onCancel={() => { setShowNewCycleSetup(false); setView('hub'); }} />
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 animate-fade-in" onClick={handleCloseDynamic}>
                <div className="w-full max-w-[420px] mx-auto h-full p-4 flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex-shrink-0 flex justify-between items-center text-white pb-4">
                        <div className="flex items-center space-x-2">
                            {(view === 'results' || view === 'comparing') && (
                                <button onClick={handleCloseDynamic} className="p-2 -ml-2"><ChevronLeftIcon /></button>
                            )}
                            <h1 className="text-xl font-black uppercase tracking-widest">{getTitle()}</h1>
                        </div>
                        <button onClick={onClose}><XIcon /></button>
                    </div>
                    <div className="flex-grow overflow-y-auto relative overflow-hidden">
                        {renderContent()}
                    </div>
                </div>
            </div>
            {showLegacyGenerationModal && (
                <LegacyGenerationModal
                    onComplete={handleExportLegacy}
                    onClose={() => setShowLegacyGenerationModal(false)}
                />
            )}
            {eraSummaries.length > 0 && (
                <div className="fixed left-[-20000px] top-0 pointer-events-none z-[-1]" aria-hidden="true">
                    <LegacyExportDocument
                        id={LEGACY_EXPORT_CAPTURE_ID}
                        userName={sovereignName}
                        generatedAt={new Date().toLocaleString('pt-BR')}
                        eraSummaries={eraSummaries}
                        totalCycles={sortedReports.length}
                        historicalAverageScore={historicalAverageScore}
                        totalHistoricalHours={totalHistoricalHours}
                        historyStartDate={historyStartDate}
                        historyEndDate={historyEndDate}
                    />
                </div>
            )}
            {isStartingCycle && <StartCycleModal onClose={() => setIsStartingCycle(false)} onStart={startCycle} />}
            {showConfirmEndCycle && (
                <ConfirmationModal
                    title="Encerrar Ciclo?"
                    message="Ao fechar este ciclo, suas aÃ§Ãµes nÃ£o concluÃ­das no grid serÃ£o movidas para o pool de aÃ§Ãµes e suas arenas serÃ£o revisadas."
                    onConfirm={confirmEndCycle}
                    onCancel={() => setShowConfirmEndCycle(false)}
                />
            )}
            {showChestModal && earnedChest && (
                <div className="fixed inset-0 z-[300]">
                    <ChestOpeningModal
                        chestType={earnedChest}
                        onClose={() => {
                            setShowChestModal(false);
                            setView('results');
                        }}
                    />
                </div>
            )}
        </>
    );
};







