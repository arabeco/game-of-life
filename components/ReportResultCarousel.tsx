import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Report, ChestType } from '../types';
import { getScoreGrade } from '../utils/scoreUtils';
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ShareIcon, CheckIcon, CrownIcon, ZapIcon, TrophyIcon } from './Icons';

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
}

const ChestVisual: React.FC<{ type: ChestType }> = ({ type }) => {
    const getColors = (t: ChestType) => {
        switch (t) {
            case 'Incomum': return { base: '#FFFFFF', highlight: '#F0F0F0', glow: 'rgba(255, 255, 255, 0.6)' };
            case 'Raro': return { base: '#CD7F32', highlight: '#F4A460', glow: 'rgba(205, 127, 50, 0.6)' };
            case 'Épico': return { base: '#C0C0C0', highlight: '#E0E0E0', glow: 'rgba(192, 192, 192, 0.6)' };
            case 'Lendário': return { base: '#F0C843', highlight: '#FFD700', glow: 'rgba(240, 200, 67, 0.6)' };
            default: return { base: '#4B5563', highlight: '#6B7280', glow: 'rgba(75, 85, 99, 0.6)' };
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
    expGained
}) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 5;

    const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
    const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

    const { metrics, highlight, assetProgress } = report;
    const scoreInfo = getScoreGrade(report.performanceScore);
    const duration = daysBetween(new Date(report.startDate), new Date(report.endDate));
    
    // Calculate Time Progress
    const plannedEndDate = metrics.plannedEndDate ? new Date(metrics.plannedEndDate) : new Date(report.endDate);
    const plannedDuration = Math.max(1, daysBetween(new Date(report.startDate), plannedEndDate));
    const timePercentage = Math.min(100, (duration / plannedDuration) * 100);

    // Prepare data for Radar Chart
    const radarData = assetProgress.map(ap => ({
        subject: ap.asset,
        A: ap.value,
        fullMark: 100
    }));

    // Slide 1: Execução
    const renderExecutionSlide = () => (
        <div className="flex flex-col h-full space-y-6 p-4">
            <h3 className="text-xl font-bold accent-text uppercase tracking-widest text-center">Execução</h3>
            
            <div className="space-y-4">
                {/* Actions Bar */}
                <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>AÇÕES</span>
                        <span>{metrics.actionsCompleted} / {metrics.totalPlannedActions}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-500 transition-all duration-1000" 
                            style={{ width: `${Math.min((metrics.actionsCompleted / Math.max(metrics.totalPlannedActions, 1)) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Time Bar */}
                <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>TEMPO</span>
                        <span>{duration} / {plannedDuration} dias</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                         <div 
                            className="h-full bg-red-500 transition-all duration-1000" 
                            style={{ width: `${timePercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                    <p className="text-2xl font-black text-white">{metrics.totalHours}</p>
                    <p className="text-[10px] uppercase text-gray-500 tracking-wider">Horas Totais</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                    <p className="text-2xl font-black text-white">{metrics.arenasInvolved}</p>
                    <p className="text-[10px] uppercase text-gray-500 tracking-wider">Arenas</p>
                </div>
            </div>
        </div>
    );

    // Slide 2: Território
    const renderTerritorySlide = () => (
        <div className="flex flex-col h-full space-y-4 p-4">
            <h3 className="text-xl font-bold accent-text uppercase tracking-widest text-center">Território</h3>
            
            <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#333" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#999', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Nível" dataKey="A" stroke="var(--skin-accent-color)" fill="var(--skin-accent-color)" fillOpacity={0.3} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--skin-accent-color)]/20 flex items-center justify-center">
                            <ZapIcon className="w-4 h-4 text-[var(--skin-accent-color)]" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase">Arena Foco</p>
                            <p className="text-sm font-bold text-white">{highlight.mostFocusedArena}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <CheckIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase">Ação Mais Repetida</p>
                            <p className="text-sm font-bold text-white">{highlight.mostRepeatedAction}</p>
                        </div>
                    </div>
                    <div className="text-right">
                         <span className="text-xl font-bold text-blue-400">{highlight.mostRepeatedActionCount || 0}x</span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Slide 3: Conquistas
    const renderAchievementsSlide = () => {
        const hasAchievements = metrics.goalsMet > 0 || (metrics.questsCompleted || 0) > 0 || (report.clanPoints || 0) > 0;
        
        return (
            <div className="flex flex-col h-full space-y-6 p-4">
                <h3 className="text-xl font-bold accent-text uppercase tracking-widest text-center">Conquistas</h3>
                
                {hasAchievements ? (
                    <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <TrophyIcon className="w-6 h-6 text-yellow-500" />
                                <span className="text-sm font-bold text-white">Marcos Conquistados</span>
                            </div>
                            <span className="text-2xl font-black text-yellow-500">{metrics.goalsMet}</span>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <CrownIcon className="w-6 h-6 text-purple-500" />
                                <span className="text-sm font-bold text-white">Quests Completadas</span>
                            </div>
                            <span className="text-2xl font-black text-purple-500">{metrics.questsCompleted || 0}</span>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 rounded-full border-2 border-red-500 bg-red-500/20" />
                                <span className="text-sm font-bold text-white">Pontos de Clã</span>
                            </div>
                            <span className="text-2xl font-black text-red-500">{report.clanPoints || 0}</span>
                        </div>

                        <div className="text-center mt-4">
                            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">EXP TOTAL</p>
                            <p className="text-4xl font-black accent-text">+{report.expGained || expGained || 0}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-center opacity-60">
                        <div className="w-16 h-16 rounded-full bg-gray-800 mb-4 flex items-center justify-center">
                            <XIcon className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-400 italic">"Nenhum marco neste ciclo. O próximo pode mudar isso."</p>
                    </div>
                )}
            </div>
        );
    };

    // Slide 4: Veredito
    const renderVerdictSlide = () => (
        <div className="flex flex-col h-full items-center justify-center p-4 text-center space-y-6">
            <h3 className="text-xl font-bold accent-text uppercase tracking-widest absolute top-4">Veredito</h3>
            
            <div className="relative">
                <div className={`text-9xl font-black ${scoreInfo.color} filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]`}>
                    {scoreInfo.grade}
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 px-3 py-1 rounded-full border border-white/10">
                    <span className="text-xl font-bold text-white">{report.performanceScore}</span>
                </div>
            </div>

            <div className="pt-8 space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-widest">{formatDate(report.startDate)} - {formatDate(report.endDate)}</p>
                <p className="text-xs text-gray-600 uppercase">{duration} dias de jornada</p>
            </div>

            <p className="text-lg italic text-white/80 max-w-[280px]">
                "{scoreInfo.phrase}"
            </p>
        </div>
    );

    // Slide 5: Recompensa
    const renderRewardSlide = () => {
        const chestType = chest || 'Comum';
        const displayExp = expGained || metrics.expGained || 0;

        return (
            <div className="flex flex-col h-full items-center justify-center p-4 text-center space-y-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--skin-accent-color)_0%,_transparent_70%)] opacity-5 pointer-events-none" />
                
                <h3 className="text-xl font-bold accent-text uppercase tracking-widest">Recompensa</h3>
                
                <div className="transform scale-110 py-4">
                    <ChestVisual type={chestType} />
                </div>

                <div className="space-y-1">
                    <p className={`text-lg font-black uppercase tracking-widest`} style={{ color: chestType === 'Lendário' ? '#F0C843' : chestType === 'Épico' ? '#C0C0C0' : chestType === 'Raro' ? '#CD7F32' : chestType === 'Incomum' ? '#FFFFFF' : '#9ca3af' }}>
                        Baú {chestType}
                    </p>
                    <p className="text-xs text-gray-500 uppercase">Recompensa Obtida</p>
                </div>

                <div className="bg-black/40 px-6 py-3 rounded-xl border border-white/10">
                     <p className="text-3xl font-black text-[var(--skin-accent-color)]">+{displayExp}</p>
                     <p className="text-[10px] uppercase text-gray-500 tracking-wider">EXP Computada</p>
                </div>

                <p className="text-gray-400 italic text-xs max-w-[250px]">
                    "Sua disciplina forja seu destino."
                </p>

                <div className="w-full flex space-x-3 pt-4">
                    <button onClick={onOk} className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors font-bold text-xs uppercase tracking-wider">
                        Fechar
                    </button>
                    {onStartNewCycle && (
                        <button onClick={onStartNewCycle} className="flex-1 py-3 rounded-xl luxe-skin-button font-bold text-xs uppercase tracking-wider shadow-lg shadow-[var(--skin-accent-color)]/20">
                            Novo Ciclo
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const slides = [
        renderExecutionSlide,
        renderTerritorySlide,
        renderAchievementsSlide,
        renderVerdictSlide,
        renderRewardSlide
    ];

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-[380px] h-[650px] bg-black/60 border border-white/10 rounded-3xl shadow-2xl relative flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-white/5">
                    <div className="flex space-x-1">
                        {slides.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-[var(--skin-accent-color)]' : 'w-2 bg-gray-700'}`}
                            />
                        ))}
                    </div>
                    <button onClick={onOk} className="text-gray-400 hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 relative overflow-hidden">
                    <div className="absolute inset-0 p-2">
                        {slides[currentSlide]()}
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="h-20 flex items-center justify-between px-6 border-t border-white/5 bg-white/5">
                    <button 
                        onClick={prevSlide} 
                        disabled={currentSlide === 0}
                        className={`p-3 rounded-full transition-colors ${currentSlide === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-white hover:bg-white/10'}`}
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>

                    <div className="flex space-x-4">
                        <button onClick={onShare} className="p-3 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Compartilhar">
                            <ShareIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <button 
                        onClick={nextSlide} 
                        disabled={currentSlide === totalSlides - 1}
                        className={`p-3 rounded-full transition-colors ${currentSlide === totalSlides - 1 ? 'text-gray-700 cursor-not-allowed' : 'text-white hover:bg-white/10'}`}
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};
