


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useGame } from '../contexts/GameContext';
import { Report, Cycle, ChestType, FeedEvent } from '../types';
import { GlassCard } from '../components/GlassCard';
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ShareIcon } from '../components/Icons';
import { CycleComparator } from '../components/CycleComparator';
import { handleShare } from '../components/Share';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { NewCycleSetupView } from './NewCycleSetupView';
import { ReportResultCarousel } from '../components/ReportResultCarousel';
import { getScoreGrade } from '../utils/scoreUtils';
import { supabase } from '../supabaseClient';
import { ReportGenerationModal } from '../components/ReportGenerationModal';
import { ChestOpeningModal } from '../components/ChestOpeningModal';

// --- Helper Functions ---
export const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
const parseDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};
export const daysBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
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

// --- Sub-components for Active Cycle HUD ---
const SimplifiedCycleHUD: React.FC<{ cycle: Cycle }> = ({ cycle }) => {
    const { tasks, assets, actions, userProfile, session, seasons } = useGame();
    const startDate = cycle.startDate;
    const endDate = cycle.endDate;
    const today = new Date().toISOString().split('T')[0];

    const isClanQuestActionId = (actionId: string) => {
        const action = actions.find(a => a.id === actionId);
        if (!action) return false;
        const arena = assets.flatMap(asset => asset.arenas).find(ar => ar.id === action.arenaId);
        if (!arena?.name) return false;
        const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return normalized.includes('quests - cla');
    };
    
    // Cálculo de dias
    const startD = parseDate(startDate);
    const endD = parseDate(endDate);
    const todayD = parseDate(today);
    
    const totalDays = Math.max(1, daysBetween(startD, endD) + 1);
    const daysElapsed = Math.max(0, daysBetween(startD, todayD) + 1);
    const timeProgress = Math.min(100, (daysElapsed / totalDays) * 100);

    // Filtrar tarefas apenas do usuário atual e dentro do período do ciclo
    const cycleTasks = tasks.filter(t => t.date >= startDate && t.date <= endDate && !isClanQuestActionId(t.actionId));
    const completedTasks = cycleTasks.filter(t => t.completed);

    // Quest Tasks
    const questTasks = tasks.filter(t => t.date >= startDate && t.date <= endDate && isClanQuestActionId(t.actionId));
    const completedQuests = questTasks.filter(t => t.completed);

    // 1. Fidelity
    const fidelity = cycleTasks.length > 0 ? (completedTasks.length / cycleTasks.length) * 100 : 100;

    // 2. Bonuses
    // Milestones
    const milestonesCompleted = completedTasks.filter(t => {
        const action = actions.find(a => a.id === t.actionId);
        return action?.actionType === 'Marco';
    }).length;
    const milestoneBonus = milestonesCompleted * 10;

    // Quests
    const questsCompletedCount = completedQuests.length;
    const questBonus = questsCompletedCount * 5;

    // Consistency
    const uniqueDays = new Set([...completedTasks, ...completedQuests].map(t => t.date)).size;
    const consistencyBonus = uniqueDays >= 4 ? 5 : 0;

    // Total Fidelity
    const totalFidelityBonus = (cycleTasks.length > 0 && completedTasks.length === cycleTasks.length) ? 5 : 0;

    // Score
    const currentScore = Math.round(fidelity + milestoneBonus + questBonus + consistencyBonus + totalFidelityBonus);
    const scoreInfo = getScoreGrade(currentScore);

    // Arenas e Ações envolvidas (seguindo a mesma lógica do endCycle)
    const actionIdsInCycle = new Set(cycleTasks.map(t => t.actionId));
    const involvedActions = actions.filter(a => actionIdsInCycle.has(a.id));
    
    const arenaIdsInCycle = new Set(involvedActions.map(a => a.arenaId));
    const involvedArenas = assets.flatMap(as => as.arenas).filter(ar => arenaIdsInCycle.has(ar.id));
    
    return (
        <GlassCard variant="accent" className="p-4 space-y-4">
            <div className="text-center">
                <p className="font-bold text-lg">"{cycle.name}"</p>
                <p className="text-xs text-gray-400">{formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}</p>
                 <p className="font-bold text-sm mt-1">Dia {daysElapsed} de {totalDays}</p>
            </div>
            
            <div className='space-y-3'>
                <div>
                    <div className="flex justify-between text-xs font-bold text-gray-400"><span>TEMPO</span><span>{timeProgress.toFixed(0)}%</span></div>
                    <div className="w-full bg-red-900/50 rounded-full h-2.5 mt-1 border border-red-500/20"><div className="bg-red-500 h-full rounded-full" style={{ width: `${timeProgress}%` }}></div></div>
                </div>
                 <div>
                    <div className="flex justify-between text-xs font-bold text-gray-400"><span>FIDELIDADE</span><span>{fidelity.toFixed(0)}%</span></div>
                    <div className="w-full bg-green-900/50 rounded-full h-2.5 mt-1 border border-green-500/20"><div className="bg-green-500 h-full rounded-full" style={{ width: `${fidelity}%` }}></div></div>
                </div>
            </div>
            <div className='text-center border-t border-[var(--skin-accent-color)]/20 pt-3'>
                 <p className="text-xs font-bold text-gray-400">RANK PROJETADO</p>
                 <p className={`text-4xl font-black ${scoreInfo.color}`}>{scoreInfo.grade}</p>
                 <p className="text-sm font-bold text-white mt-1">Score: {currentScore}</p>
                 <div className="flex justify-center space-x-3 mt-2 text-[10px] text-gray-500 uppercase font-mono">
                    <span>🏆 {milestonesCompleted} Marcos</span>
                    <span>⚔️ {questsCompletedCount} Quests</span>
                    <span>🔥 {uniqueDays} Dias</span>
                 </div>
            </div>
        </GlassCard>
    );
};

const StartCycleModal: React.FC<{ onClose: () => void; onStart: (name: string, endDate: string) => void; }> = ({ onClose, onStart }) => {
    const [name, setName] = useState('');
    const [endDate, setEndDate] = useState('');
    const today = new Date().toISOString().split('T')[0];

    const handleStart = () => {
        if(endDate && name) {
            onStart(name, endDate);
            onClose();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant='neutral' className='p-4 space-y-4 w-full max-w-sm' onClick={e => e.stopPropagation()}>
                <h2 className='text-center font-bold text-lg uppercase'>Definir Ciclo de Soberania</h2>
                <p className="text-center text-sm text-gray-400">Dê um nome à sua campanha e escolha a data de término para formalizar seu compromisso.</p>
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
                    <label className='text-sm font-bold'>Data de Término</label>
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
                            <span className="text-[var(--skin-accent-color)]">🎯</span>
                            <span className="text-gray-400 truncate">Foco: <span className="text-gray-300">{report.highlight.mostFocusedArena}</span></span>
                        </div>
                    )}
                    {report.highlight?.mostRepeatedAction && (
                        <div className="flex items-center gap-2 text-xs min-w-0">
                            <span className="text-blue-400">⚡</span>
                            <span className="text-gray-400 truncate">Hábito: <span className="text-gray-300">{report.highlight.mostRepeatedAction}</span></span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main View ---
export const ReportsView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { reports, activeCycle, startCycle, endCycle, assets, actions, applyExp, addChest, addFeedEvent, seasons, userProfile, oraclePreferences } = useGame();
    const [view, setView] = useState<'hub' | 'scanning' | 'results' | 'comparing' | 'reward'>('hub');
    const [isStartingCycle, setIsStartingCycle] = useState(false);
    const [showConfirmEndCycle, setShowConfirmEndCycle] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [reportsToCompare, setReportsToCompare] = useState<[Report, Report] | null>(null);
    const [reportForComparison, setReportForComparison] = useState<Report | null>(null);
    const [showNewCycleSetup, setShowNewCycleSetup] = useState(false);
    const [expGained, setExpGained] = useState(0);
    const [earnedChest, setEarnedChest] = useState<ChestType | null>(null);
    const [isPostCycleFlow, setIsPostCycleFlow] = useState(false);
    const [cycleShimmer, setCycleShimmer] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scanAttempt, setScanAttempt] = useState(0);
    const [showChestModal, setShowChestModal] = useState(false);
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
            if (!result?.report) throw new Error('Relatório inválido');
            const { report, expGained } = result;
            setSelectedReport(report);
            setExpGained(expGained);

            let chestType: ChestType = 'Comum';
            if (expGained > 5000) chestType = 'Lendário';
            else if (expGained > 2000) chestType = 'Épico';
            else if (expGained > 800) chestType = 'Raro';
            else if (expGained > 300) chestType = 'Incomum';
            setEarnedChest(chestType);

            setIsPostCycleFlow(true);
            return chestType;
        } catch (error) {
            console.error('Erro ao analisar ciclo:', error);
            setScanError('Não foi possível analisar o ciclo. Tente novamente.');
            // Do not switch to hub, let the user see the error in scanning view
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
        applyExp(expGained);
        if (earnedChest) {
            addChest(earnedChest);
            showToast(`✦ Baú ${earnedChest} adicionado ao inventário · +${expGained} XP computados`);
        } else {
            showToast(`✦ +${expGained} XP foram computados ao seu perfil`);
        }
        setIsPostCycleFlow(false);
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
                                performEndOfCycle();
                            }}
                            onOpen={() => {
                                setShowChestModal(true);
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
                                <div className="w-16 h-16 border-4 border-[var(--skin-accent-color)] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-gray-400 font-mono animate-pulse">Gerando Relatório...</p>
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

                const uniqueBreaks = Array.from<number>(new Set(eraBreaks.filter((b): b is number => typeof b === 'number' && b > 0 && b < sortedReports.length))).sort((a, b) => a - b);
                const eraSegments = sortedReports.length > 0 ? (() => {
                    const segments: Array<{ start: number; end: number }> = [];
                    let start = 0;
                    uniqueBreaks.forEach(b => {
                        segments.push({ start, end: b - 1 });
                        start = b;
                    });
                    segments.push({ start, end: sortedReports.length - 1 });
                    return segments;
                })() : [];

                return (
                    <div className="pb-12">
                        {reportForComparison && (
                            <div className="p-3 bg-blue-900/30 rounded-lg text-center text-sm mb-6">Selecione um relatório para comparar com o ciclo de {formatDate(reportForComparison.startDate)}.</div>
                        )}
                        
                        {activeCycle ? (
                            <div className="relative z-20 space-y-2">
                                <button onClick={handleEndCycle} className="w-full py-3 rounded-xl luxe-skin-button shadow-lg shadow-[var(--skin-accent-color)]/20">ENCERRAR CICLO ATUAL</button>
                                <button onClick={handleStartEraEdit} disabled={isEditingEras || sortedReports.length < 2} className="w-full py-2 rounded-xl luxe-button-secondary text-xs disabled:opacity-40">SETAR ERAS</button>
                                <button onClick={handleResetEras} disabled={sortedReports.length < 2 || (!hasCustomEras && eraBreaks.length === defaultEraBreaks.length)} className="w-full py-2 rounded-xl luxe-button-secondary text-xs disabled:opacity-40">RESETAR ERAS</button>
                            </div>
                        ) : (
                            <div className="relative z-20 space-y-2">
                                <button onClick={() => setIsStartingCycle(true)} className="w-full py-3 rounded-xl luxe-skin-button mb-4 shadow-lg shadow-[var(--skin-accent-color)]/20">INICIAR NOVO CICLO</button>
                                {reports.length < 1 && <div className="text-center text-sm text-gray-500 py-4 italic">Sem histórico. Inicie sua jornada.</div>}
                                <button onClick={handleStartEraEdit} disabled={isEditingEras || sortedReports.length < 2} className="w-full py-2 rounded-xl luxe-button-secondary text-xs disabled:opacity-40">SETAR ERAS</button>
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
                                        <button onClick={handleStartCompare} className="w-full py-2 rounded-xl luxe-button-secondary text-xs">COMPARAR ÚLTIMOS 2 CICLOS</button>
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
                        onShare={() => handleShare('report-summary-card-capture', `Relatório de Ciclo ${formatDate(selectedReport.startDate)} - Life OS`)} 
                        onPostToFeed={() => handlePostToFeed(selectedReport)}
                        onStartNewCycle={() => {
                             applyExp(expGained);
                             if (earnedChest) addChest(earnedChest);
                             setIsPostCycleFlow(false);
                             setShowNewCycleSetup(true);
                        }}
                        chest={isPostCycleFlow ? earnedChest : null}
                        expGained={isPostCycleFlow ? expGained : undefined}
                    />
                ) : <p>Erro ao carregar relatório.</p>;
            case 'comparing':
                 return reportsToCompare ? (
                    <CycleComparator
                        currentCycleReport={reportsToCompare[0]}
                        pastCycleReport={reportsToCompare[1]}
                    />
                ) : <p>Erro ao carregar comparação.</p>;
        }
    };
    
    const getTitle = () => {
        switch(view) {
            case 'results': return 'Resultados';
            case 'comparing': return 'Análise Comparativa';
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
                    <div className={`flex-grow overflow-y-auto relative overflow-hidden ${cycleShimmer ? 'shimmer-effect' : ''}`}>
                        {renderContent()}
                    </div>
                </div>
            </div>
            {isStartingCycle && <StartCycleModal onClose={() => setIsStartingCycle(false)} onStart={startCycle} />}
            {showConfirmEndCycle && (
                <ConfirmationModal 
                    title="Encerrar Ciclo?"
                    message="Ao fechar este ciclo, suas ações não concluídas no grid serão movidas para o pool de ações e suas arenas serão revisadas."
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
