


import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useGame } from '../contexts/GameContext';
import { Report, Cycle, ChestType, FeedEvent } from '../types';
import { GlassCard } from '../components/GlassCard';
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ShareIcon } from '../components/Icons';
import { CycleComparator } from '../components/CycleComparator';
import { handleShare } from '../components/Share';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { NewCycleSetupView } from './NewCycleSetupView';
import { ChestOpeningModal } from '../components/ChestOpeningModal';

// --- Helper Functions ---
export const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
const parseDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};
export const daysBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

const getScoreGrade = (score: number) => {
    if (score >= 95) return { grade: 'S', color: 'text-cyan-400' };
    if (score >= 85) return { grade: 'A', color: 'text-green-400' };
    if (score >= 75) return { grade: 'B', color: 'text-yellow-400' };
    if (score >= 60) return { grade: 'C', color: 'text-orange-400' };
    if (score >= 40) return { grade: 'D', color: 'text-red-400' };
    return { grade: 'E', color: 'text-red-600' };
};

// --- Sub-components for Active Cycle HUD ---
const SimplifiedCycleHUD: React.FC<{ cycle: Cycle }> = ({ cycle }) => {
    const { tasks, assets, actions, userProfile, session } = useGame();
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

    // Arenas e Ações envolvidas (seguindo a mesma lógica do endCycle)
    const actionIdsInCycle = new Set(cycleTasks.map(t => t.actionId));
    const involvedActions = actions.filter(a => actionIdsInCycle.has(a.id));
    
    const arenaIdsInCycle = new Set(involvedActions.map(a => a.arenaId));
    const involvedArenas = assets.flatMap(as => as.arenas).filter(ar => arenaIdsInCycle.has(ar.id));

    // Progresso baseado no planejado vs realizado
    const conquestProgress = cycleTasks.length > 0
        ? (completedTasks.length / cycleTasks.length) * 100
        : 0;

    const delta = conquestProgress - timeProgress;
    let rank: { label: string, color: string };
    if (delta > 5) rank = { label: 'A', color: 'text-green-400' };
    else if (delta > -5) rank = { label: 'B', color: 'text-yellow-400' };
    else if (delta > -15) rank = { label: 'C', color: 'text-orange-400' };
    else rank = { label: 'D', color: 'text-red-400' };
    
    return (
        <GlassCard variant="gold" className="p-4 space-y-4">
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
                    <div className="flex justify-between text-xs font-bold text-gray-400"><span>AÇÕES</span><span>{conquestProgress.toFixed(0)}%</span></div>
                    <div className="w-full bg-green-900/50 rounded-full h-2.5 mt-1 border border-green-500/20"><div className="bg-green-500 h-full rounded-full" style={{ width: `${conquestProgress}%` }}></div></div>
                </div>
            </div>
            <div className='text-center border-t border-yellow-800/50 pt-3'>
                 <p className="text-xs font-bold text-gray-400">RANK ATUAL</p>
                 <p className={`text-4xl font-black ${rank.color}`}>{rank.label}</p>
                 <p className="text-[10px] text-gray-500 mt-1 uppercase">
                    {completedTasks.length} de {cycleTasks.length} tarefas | {involvedArenas.length} Arenas
                 </p>
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
                <button onClick={handleStart} disabled={!endDate || !name} className="w-full py-3 rounded-xl luxe-gold-button disabled:opacity-50">INICIAR CICLO</button>
            </GlassCard>
        </div>
    );
};

// --- New Post-Cycle Reward Components ---
const CycleRewardView: React.FC<{ exp: number; chest: ChestType; onContinue: () => void; onClose: () => void; }> = ({ exp, chest, onContinue, onClose }) => {

    const getChestStyle = (type: ChestType) => {
        switch (type) {
            case 'Raro': return { color: '#3b82f6', shadow: 'shadow-blue-500/50' };
            case 'Épico': return { color: '#a855f7', shadow: 'shadow-purple-500/50' };
            case 'Lendário': return { color: '#f59e0b', shadow: 'shadow-yellow-500/50' };
            default: return { color: 'gray', shadow: 'shadow-gray-500/50' };
        }
    }
    const chestStyle = getChestStyle(chest);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold uppercase tracking-widest">Parabéns!</h2>
            <div>
                <p className="text-6xl font-black text-[var(--gold)]">{exp.toLocaleString('pt-BR')}</p>
                <p className="text-lg font-bold tracking-wider">de EXP computada!</p>
            </div>
            <div>
                <p>Você recebeu:</p>
                <div className={`mt-2 w-32 h-32 mx-auto bg-gray-800 rounded-lg flex items-center justify-center border-4 ${chestStyle.shadow}`} style={{borderColor: chestStyle.color}}>
                    <span className="text-6xl">?</span>
                </div>
                <p className="font-bold mt-2" style={{color: chestStyle.color}}>Baú {chest}</p>
            </div>
            <p className="text-gray-400">"Baú adicionado ao Arsenal!"</p>
            <div className="w-full max-w-xs space-y-3 pt-2">
                 <div className="flex space-x-2">
                    <button onClick={onClose} className="w-full py-3 rounded-xl luxe-button-secondary">FECHAR</button>
                    <button onClick={onContinue} className="w-full py-3 rounded-xl luxe-gold-button">EDITAR NOVO CICLO</button>
                </div>
            </div>
        </div>
    );
};


// --- Report Result Display ---
const ReportListItem: React.FC<{ report: Report, onClick: () => void }> = ({ report, onClick }) => (
    <GlassCard variant="silver" className="p-3 cursor-pointer" onClick={onClick}>
        <div className="flex justify-between items-center">
            <div>
                <p className="font-bold text-sm">{formatDate(report.startDate)} - {formatDate(report.endDate)}</p>
                <p className="text-xs text-gray-400">Score: {report.performanceScore} | {report.metrics.actionsCompleted} Ações | {report.metrics.totalHours.toFixed(1)}h</p>
            </div>
            <ChevronRightIcon />
        </div>
    </GlassCard>
);

const ReportResultCarousel: React.FC<{ report: Report; onOk: () => void; onCompare: () => void; onShare: () => void; onPostToFeed: () => void; }> = ({ report, onOk, onCompare, onShare, onPostToFeed }) => {
    const slides = [
        <RatingCard report={report} />, <MetricsCard report={report} />, <HighlightCard report={report} />,
        <ReportSummaryCard report={report} onOk={onOk} onCompare={onCompare} onShare={onShare} onPostToFeed={onPostToFeed} />,
    ];
    const [slide, setSlide] = useState(0);
    const next = () => setSlide(s => (s + 1) % slides.length);
    const prev = () => setSlide(s => (s - 1 + slides.length) % slides.length);
    const isLastSlide = slide === slides.length - 1;

    return (
        <div className="relative h-full flex flex-col justify-center items-center">
            <div className="w-full flex-grow flex items-center justify-center">{slides[slide]}</div>
            <div className="flex items-center justify-center space-x-4 p-2">
                <button onClick={prev} className="p-2 rounded-full bg-white/10 hover:bg-white/20" disabled={slide === 0}><ChevronLeftIcon /></button>
                <div className="flex space-x-2">{slides.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === slide ? 'bg-white' : 'bg-white/30'}`} />)}</div>
                <button onClick={next} className="p-2 rounded-full bg-white/10 hover:bg-white/20" disabled={isLastSlide}><ChevronRightIcon /></button>
            </div>
        </div>
    );
};

const RatingCard: React.FC<{report: Report}> = ({ report }) => {
    const scoreInfo = getScoreGrade(report.performanceScore);
    return (
        <GlassCard variant='gold' className='text-center space-y-2 flex flex-col items-center justify-center w-64 h-72'>
            <p className='text-sm uppercase tracking-widest'>Performance</p>
            <p className={`text-7xl font-black ${scoreInfo.color}`}>{scoreInfo.grade}</p>
            <p className='text-xs text-gray-400'>Score: {report.performanceScore}</p>
            
            <div className="w-full pt-2 mt-2 border-t border-yellow-800/50">
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <p className="font-bold text-lg">{report.metrics.actionsCompleted}</p>
                        <p className="text-gray-400">Cumpridas</p>
                    </div>
                    <div>
                        <p className="font-bold text-lg">{report.metrics.totalPlannedActions}</p>
                        <p className="text-gray-400">Planejadas</p>
                    </div>
                </div>
            </div>

            <p className='text-xs text-gray-400 mt-2'>{formatDate(report.startDate)} - {formatDate(report.endDate)}</p>
        </GlassCard>
    );
};

const MetricsCard: React.FC<{report: Report}> = ({ report }) => (
     <GlassCard variant='neutral' className='w-full max-w-xs p-4 space-y-3'>
        <h3 className='text-center font-bold uppercase'>Métricas</h3>
        <div className='grid grid-cols-2 gap-3 text-center'>
            <div><p className='text-3xl font-bold'>{report.metrics.actionsCompleted}</p><p className='text-xs text-gray-400'>Ações Cumpridas</p></div>
            <div><p className='text-3xl font-bold'>{report.metrics.arenasInvolved}</p><p className='text-xs text-gray-400'>Arenas Envolvidas</p></div>
            <div><p className='text-3xl font-bold'>{report.metrics.goalsMet}</p><p className='text-xs text-gray-400'>Metas Batidas</p></div>
            <div><p className='text-3xl font-bold'>{report.metrics.totalHours.toFixed(1)}</p><p className='text-xs text-gray-400'>Horas Totais</p></div>
        </div>
     </GlassCard>
);

const HighlightCard: React.FC<{report: Report}> = ({ report }) => (
     <GlassCard variant='neutral' className='w-full max-w-xs p-4 space-y-3 text-center'>
         <h3 className='font-bold uppercase'>Destaques</h3>
        <div>
            <p className='text-xs text-gray-400'>Arena mais focada</p>
            <p className='text-lg font-bold text-[var(--gold)]'>{report.highlight.mostFocusedArena}</p>
        </div>
        <div>
            <p className='text-xs text-gray-400'>Ação mais repetida</p>
            <p className='text-lg font-bold text-[var(--gold)]'>{report.highlight.mostRepeatedAction}</p>
        </div>
     </GlassCard>
);

const ReportSummaryCard: React.FC<{report: Report; onOk: () => void; onCompare: () => void; onShare: () => void; onPostToFeed: () => void;}> = ({ report, onOk, onCompare, onShare, onPostToFeed }) => (
     <GlassCard variant='neutral' className='w-full max-w-xs p-2' id="report-summary-card-capture">
        <h3 className='text-center font-bold uppercase text-sm mb-2'>Resumo do Ciclo</h3>
        <ResponsiveContainer width="100%" height={200}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={report.assetProgress}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
                <PolarAngleAxis dataKey="asset" tick={{ fill: 'white', fontSize: 8 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 1']} tick={false} axisLine={false} />
                <Radar name="Progress" dataKey="value" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.6} />
            </RadarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 my-2 text-center">Seu progresso entre {formatDate(report.startDate)} e {formatDate(report.endDate)} foi analisado.</p>
        <div className="text-center share-ignore space-y-2">
             <div className="flex items-center space-x-2">
                 <button onClick={onShare} className='p-3 rounded-xl luxe-button-secondary flex-shrink-0'><ShareIcon className="w-5 h-5" /></button>
                 <button onClick={onPostToFeed} className="w-full py-3 rounded-xl luxe-button-secondary">Postar no Feed</button>
                 <button onClick={onCompare} className="w-full py-3 rounded-xl luxe-button-secondary">Comparar</button>
            </div>
             <button onClick={onOk} className="w-full py-3 rounded-xl luxe-gold-button">OK</button>
        </div>
     </GlassCard>
);

// --- Main View ---
export const ReportsView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { reports, activeCycle, startCycle, endCycle, assets, actions, applyExp, addChest, addFeedEvent } = useGame();
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
    
    useEffect(() => {
        if (view === 'scanning') {
            const timer = setTimeout(() => {
                const { report, expGained } = endCycle(assets, actions);
                setSelectedReport(report);
                setExpGained(expGained);

                let chestType: ChestType = 'Comum';
                if (expGained > 5000) chestType = 'Lendário';
                else if (expGained > 2000) chestType = 'Épico';
                else if (expGained > 800) chestType = 'Raro';
                setEarnedChest(chestType);

                setIsPostCycleFlow(true);
                setView('results');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [view, endCycle, assets, actions]);

    const handleEndCycle = () => setShowConfirmEndCycle(true);
    const confirmEndCycle = () => { setShowConfirmEndCycle(false); setView('scanning'); };
    
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
        }
        setIsPostCycleFlow(false);
        setView('reward');
    };
    
    const renderContent = () => {
        switch (view) {
            case 'hub':
                return (
                    <div className="space-y-4">
                        {reportForComparison && (
                            <div className="p-3 bg-blue-900/30 rounded-lg text-center text-sm">Selecione um relatório para comparar com o ciclo de {formatDate(reportForComparison.startDate)}.</div>
                        )}
                        {activeCycle ? (
                            <>
                                <SimplifiedCycleHUD cycle={activeCycle} />
                                <button onClick={handleEndCycle} className="w-full py-3 rounded-xl luxe-gold-button">ENCERRAR CICLO</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsStartingCycle(true)} className="w-full py-3 rounded-xl luxe-gold-button">INICIAR CICLO</button>
                                {reports.length < 1 && <div className="text-center text-sm text-gray-500 py-4">Sem ciclo ativo. Inicie um para começar.</div>}
                            </>
                        )}
                        {reports.length > 0 && (
                            <>
                                {reports.length >= 2 && !activeCycle && !reportForComparison && <button onClick={handleStartCompare} className="w-full mt-4 py-2 rounded-xl luxe-button-secondary">COMPARAR ÚLTIMOS 2 CICLOS</button>}
                                <hr className="border-white/10 my-4" />
                                <h3 className='text-center text-xs font-bold uppercase tracking-wider text-gray-400'>Ciclos Anteriores</h3>
                                {reports.map(report => <ReportListItem key={report.id} report={report} onClick={() => handleViewReport(report)} />)}
                            </>
                        )}
                    </div>
                );
            case 'scanning':
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-48 h-48 border-4 border-dashed border-[var(--gold)] rounded-full animate-spin"></div>
                        <p className="mt-4 text-lg font-bold tracking-widest animate-pulse">ANALISANDO CICLO...</p>
                    </div>
                );
            case 'reward':
                return earnedChest ? (
                    <CycleRewardView 
                        exp={expGained}
                        chest={earnedChest}
                        onContinue={() => setShowNewCycleSetup(true)}
                        onClose={onClose}
                    />
                ) : <p>Erro ao carregar recompensa.</p>;
            case 'results':
                return selectedReport ? (
                    <ReportResultCarousel 
                        report={selectedReport}
                        onOk={isPostCycleFlow ? handlePostCycleResultsOk : handleCloseDynamic}
                        onCompare={() => { setReportForComparison(selectedReport); setView('hub'); }}
                        onShare={() => handleShare('report-summary-card-capture', `Relatório de Ciclo ${formatDate(selectedReport.startDate)} - Life OS`)} 
                        onPostToFeed={() => handlePostToFeed(selectedReport)}
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
                    <div className="flex-grow overflow-y-auto">
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
        </>
    );
};
