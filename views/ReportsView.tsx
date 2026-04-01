


import React, { Suspense, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useGame, getLocalDateString } from '../contexts/GameContext';
import { Report, Cycle, ChestType, FeedEvent, RewardModalPayload } from '../types';
import { GlassCard } from '../components/GlassCard';
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ShareIcon, Trash2Icon, EditIcon } from '../components/Icons';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { NewCycleSetupView } from './NewCycleSetupView';
import { ReportResultCarousel } from '../components/ReportResultCarousel';
import { supabase } from '../supabaseClient';
import { SupabaseService } from '../services/SupabaseService';
import type { LegacyEraSummary } from '../components/LegacyExportDocument';
import { LegacyPlaqueArtifact } from '../components/LegacyPlaqueArtifact';
import { EraRibbon, ERA_RIBBON_SKINS, getEraRibbonSkin } from '../components/EraRibbon';
import { MetalReportCard } from '../components/MetalReportCard';
import { Portal } from '../components/Portal';
import { RewardPackModal } from '../components/RewardPackModal';

import { NOBILITY_RANKS } from '../constants/nobility';
import { filterCycleTasksByScope } from '../utils/coreLoopUtils.js';
import { buildFairScoreFromTasks } from '../utils/fairScoreUtils.js';
import { buildEraAiSummary } from '../utils/eraSummaryUtils';
import { buildChestRewardPayload } from '../utils/chestRewardPresentation';
const CycleComparator = React.lazy(() => import('../components/CycleComparator').then(m => ({ default: m.CycleComparator })));
const ReportGenerationModal = React.lazy(() => import('../components/ReportGenerationModal').then(m => ({ default: m.ReportGenerationModal })));
const LegacyExportDocument = React.lazy(() => import('../components/LegacyExportDocument').then(m => ({ default: m.LegacyExportDocument })));
const LegacyPlaqueModal = React.lazy(() => import('../components/LegacyPlaqueModal').then(m => ({ default: m.LegacyPlaqueModal })));
const LegacyPlaqueForgeModal = React.lazy(() => import('../components/LegacyPlaqueForgeModal').then(m => ({ default: m.LegacyPlaqueForgeModal })));
const LegacyProjectionModal = React.lazy(() => import('../components/LegacyProjectionModal').then(m => ({ default: m.LegacyProjectionModal })));

// --- Helper Functions ---
import { parseDate, daysBetween, formatDate, getCycleTimingSummary, getScoreGrade } from '../utils/dateUtils';
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
const ERA_METADATA_STORAGE_PREFIX = 'glyph-era-metadata-v1';
const LEGACY_PLAQUE_STORAGE_PREFIX = 'glyph-legacy-plaque-v1';
const BOOTSTRAP_ERA_KEY = 'bootstrap-era-1';
const FREE_ERA_RIBBON_SKIN_ID = ERA_RIBBON_SKINS.find((skin) => !skin.isPremium)?.id || ERA_RIBBON_SKINS[0].id;
const PREMIUM_ERA_RIBBON_SKIN_IDS = ERA_RIBBON_SKINS.filter((skin) => skin.isPremium).map((skin) => skin.id);

type EraMetadataEntry = {
    name?: string;
    skinId?: string;
    description?: string;
    finalSummary?: string;
};

type DraftEraSlot = {
    id: string;
    sourceKey?: string;
    defaultLabel: string;
    name?: string;
    skinId: string;
    description?: string;
    finalSummary?: string;
};

type DraftEraSegment = {
    start: number;
    end: number;
    slotId: string;
};

type InlineEraEditorState = {
    mode: 'saved' | 'draft';
    key: string;
    defaultLabel: string;
    eraIndex: number;
};

const OFFICIAL_COMPACT_HISTORY_CARD_CLASS = 'mx-auto w-[14.15rem] max-w-full';

const getReportMetaCounts = (report: Report) => {
    const sealedMetas = report.metrics.sealedMetas ?? report.metrics.goalsMet ?? 0;
    const plannedMetas = report.metrics.plannedMetas ?? Math.max(sealedMetas, 0);
    return { sealedMetas, plannedMetas };
};

const getReportPresenceDays = (report: Report) => report.metrics?.fairness?.activeDays ?? report.metrics.consistencyDays ?? 0;

// --- Sub-components for Active Cycle HUD ---
const SimplifiedCycleHUD: React.FC<{ cycle: Cycle; onEdit: (cycle: Cycle) => void; showTimelineMarker?: boolean; showControls?: boolean }> = ({ cycle, onEdit, showTimelineMarker = true, showControls = true }) => {
    const { tasks, assets, actions, reports, deleteCycle } = useGame();
    const startDate = cycle.startDate;
    const endDate = cycle.endDate;
    const cycleTiming = getCycleTimingSummary(startDate, endDate);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Tem certeza que deseja excluir este ciclo? Isso n\u00E3o pode ser desfeito.")) {
            await deleteCycle(cycle.id);
        }
    };
    const totalDays = Math.max(1, daysBetween(parseDate(startDate), parseDate(endDate)) + 1);
    const cycleTasks = filterCycleTasksByScope(tasks, actions, cycle, startDate, endDate);
    const completedTasks = cycleTasks.filter(t => t.completed);
    const cycleProgress = cycleTasks.length > 0 ? Math.round((completedTasks.length / cycleTasks.length) * 100) : 0;
    const totalMinutes = completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const reportsChronological = [...reports].sort((left, right) => new Date(left.endDate).getTime() - new Date(right.endDate).getTime());
    const fairScoreResult = buildFairScoreFromTasks({
        tasks: cycleTasks.map((task) => {
            const action = actions.find(a => a.id === task.actionId);
            return {
                ...task,
                actionType: action?.actionType,
                arenaId: action?.arenaId,
            };
        }),
        actions,
        arenas: assets.flatMap(asset => asset.arenas),
        previousReports: reportsChronological,
        durationDays: totalDays,
    });
    const currentScore = fairScoreResult.fairScore;
    const scoreInfo = getScoreGrade(currentScore, fairScoreResult.fairness as Report['metrics']['fairness']);

    return (
        <div className={`relative ${showTimelineMarker ? 'pl-4' : ''} group`}>
            {showTimelineMarker && (
                <div className="absolute left-0 top-3 w-5 h-5 rounded-full border-2 border-[var(--skin-accent-color)] bg-black flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-[var(--skin-accent-color)] animate-pulse" />
                </div>
            )}
            <div className="relative">
                {showControls && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(cycle);
                            }}
                            className="absolute left-3 top-3 z-20 rounded-full p-1.5 text-white/75 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100"
                            title="Editar data final do ciclo"
                        >
                            <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="absolute right-3 top-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded-full text-red-500"
                            title="Excluir Ciclo"
                        >
                            <Trash2Icon className="w-4 h-4" />
                        </button>
                    </>
                )}
                <MetalReportCard
                    rank={scoreInfo.grade}
                    score={currentScore}
                    title={cycle.name || 'Ciclo ativo'}
                    subtitle={`${formatDate(cycle.startDate)} - ${formatDate(cycle.endDate)} · ${cycleTiming.totalDays} dias`}
                    dualProgress={{
                        progress: cycleProgress,
                        time: cycleTiming.timeProgress,
                        progressLabel: 'Progresso',
                        progressValue: `${completedTasks.length}/${cycleTasks.length} · ${Math.round(cycleProgress)}%`,
                        timeLabel: 'Tempo',
                        timeValue: cycleTiming.isUpcoming ? cycleTiming.statusLabel : `Dia ${cycleTiming.elapsedDays}/${cycleTiming.totalDays}`,
                    }}
                    metrics={[
                        { label: 'Acoes', value: `${completedTasks.length}/${cycleTasks.length}` },
                        { label: 'Carga', value: `${totalHours}h` },
                        { label: 'Metas', value: `${fairScoreResult.fairness.sealedMetas}/${fairScoreResult.fairness.plannedMetas}` },
                        { label: 'Presenca', value: `${fairScoreResult.fairness.activeDays} dias` },
                    ]}
                    compact
                    className={OFFICIAL_COMPACT_HISTORY_CARD_CLASS}
                />
            </div>
        </div>
    );
};
const EditCycleEndDateModal: React.FC<{
    cycle: Cycle;
    onClose: () => void;
    onSave: (updates: Partial<Pick<Cycle, 'name' | 'endDate'>>) => Promise<void>;
    onDelete: () => Promise<void>;
}> = ({ cycle, onClose, onSave, onDelete }) => {
    const [name, setName] = useState(cycle.name || '');
    const [endDate, setEndDate] = useState(cycle.endDate);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const today = getLocalDateString();
    const minDate = cycle.startDate && cycle.startDate > today ? cycle.startDate : today;
    const todayDate = minDate;
    const hasChanges = name.trim() !== (cycle.name || '') || endDate !== cycle.endDate;

    const handleSave = async () => {
        if (!endDate || isSaving) return;
        setIsSaving(true);
        try {
            await onSave({
                name: name.trim() || cycle.name || 'Ciclo ativo',
                endDate,
            });
            onClose();
        } catch (error) {
            console.error('Erro ao salvar ciclo:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (isDeleting) return;
        const confirmed = window.confirm('Tem certeza que deseja excluir este ciclo atual? Isso nao pode ser desfeito.');
        if (!confirmed) return;
        setIsDeleting(true);
        try {
            await onDelete();
            onClose();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm p-4 space-y-4" onClick={(event) => event.stopPropagation()}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500">Editar ciclo</p>
                        <h2 className="mt-2 text-lg font-black uppercase text-white">{cycle.name || 'Ciclo ativo'}</h2>
                        <p className="mt-1 text-sm text-gray-400">Ajuste o nome e a data final do ciclo atual.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Nome</div>
                        <input
                            type="text"
                            value={name}
                            maxLength={48}
                            onChange={(event) => setName(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white"
                            placeholder="Nome do ciclo"
                        />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Data final</div>
                            <button
                                type="button"
                                onClick={() => setEndDate(todayDate)}
                                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/75"
                            >
                                Hoje
                            </button>
                        </div>
                        <input
                            type="date"
                            value={endDate}
                            min={minDate}
                            onChange={(event) => setEndDate(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => { void handleDelete(); }}
                            disabled={isDeleting || isSaving}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-3 text-xs font-bold text-red-300 disabled:opacity-50"
                        >
                            <Trash2Icon className="h-4 w-4" />
                            {isDeleting ? 'EXCLUINDO...' : 'EXCLUIR'}
                        </button>
                        <div className="flex flex-1 gap-2">
                            <button onClick={onClose} className="flex-1 py-3 rounded-xl luxe-button-secondary text-xs">Cancelar</button>
                            <button onClick={() => { void handleSave(); }} disabled={!endDate || isSaving || !hasChanges} className="flex-1 py-3 rounded-xl luxe-skin-button text-xs disabled:opacity-50">
                                {isSaving ? 'SALVANDO...' : 'SALVAR'}
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};

const EditHistoricalCycleModal: React.FC<{
    report: Report;
    onClose: () => void;
    onSave: (name: string) => Promise<void>;
    onDelete: () => Promise<void>;
}> = ({ report, onClose, onSave, onDelete }) => {
    const [name, setName] = useState(report.cycleName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const normalizedName = name.trim();
    const hasChanges = normalizedName.length > 0 && normalizedName !== (report.cycleName || '');

    const handleSave = async () => {
        if (!hasChanges || isSaving) return;
        setIsSaving(true);
        try {
            await onSave(normalizedName);
            onClose();
        } catch (error) {
            console.error('Erro ao salvar ciclo antigo:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (isDeleting) return;
        const confirmed = window.confirm(`Excluir o ciclo "${report.cycleName || 'Ciclo'}"? Isso tambem remove o relatorio dele.`);
        if (!confirmed) return;
        setIsDeleting(true);
        try {
            await onDelete();
            onClose();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm p-4 space-y-4" onClick={(event) => event.stopPropagation()}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500">Editar ciclo</p>
                        <h2 className="mt-2 text-lg font-black uppercase text-white">{report.cycleName || 'Ciclo'}</h2>
                        <p className="mt-1 text-sm text-gray-400">Para ciclos fechados, so o nome pode ser alterado.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Nome</div>
                        <input
                            type="text"
                            value={name}
                            maxLength={48}
                            onChange={(event) => setName(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white"
                            placeholder="Nome do ciclo"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => { void handleDelete(); }}
                            disabled={isDeleting || isSaving}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-3 text-xs font-bold text-red-300 disabled:opacity-50"
                        >
                            <Trash2Icon className="h-4 w-4" />
                            {isDeleting ? 'EXCLUINDO...' : 'EXCLUIR'}
                        </button>
                        <div className="flex flex-1 gap-2">
                            <button onClick={onClose} className="flex-1 py-3 rounded-xl luxe-button-secondary text-xs">Cancelar</button>
                            <button onClick={() => { void handleSave(); }} disabled={!hasChanges || isSaving} className="flex-1 py-3 rounded-xl luxe-skin-button text-xs disabled:opacity-50">
                                {isSaving ? 'SALVANDO...' : 'SALVAR'}
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
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
        </Portal>
    );
};

// --- Timeline Components ---

const TimelineCard: React.FC<{ report: Report, isLatest: boolean, onClick: () => void, seasonName?: string, isEditing?: boolean, eraLabel?: string, eraSkinId?: string, isSelectedForEraEdit?: boolean, showTimelineMarker?: boolean, onDelete?: () => void }> = ({ report, isLatest, onClick, seasonName, isEditing, eraLabel, eraSkinId, isSelectedForEraEdit, showTimelineMarker = true, onDelete }) => {
    const scoreInfo = getScoreGrade(report.performanceScore, report.metrics?.fairness);
    const startDate = formatDate(report.startDate);
    const endDate = formatDate(report.endDate);
    const { sealedMetas, plannedMetas } = getReportMetaCounts(report);
    const presenceDays = getReportPresenceDays(report);
    const eraSkin = getEraRibbonSkin(eraSkinId);
    const hasEraAccent = isEditing ? Boolean(eraSkinId && isSelectedForEraEdit) : Boolean(eraLabel && eraSkinId);
    const wrapperStyle = hasEraAccent ?{
        boxShadow: `0 0 0 1px ${eraSkin.edge}12, 0 14px 30px ${eraSkin.baseBottom}55`,
    } : undefined;
    const editHighlightStyle = isEditing && isSelectedForEraEdit ?{
        boxShadow: `0 0 0 1px ${eraSkin.edge}65, 0 0 0 4px ${eraSkin.glow}18, 0 14px 30px ${eraSkin.baseBottom}88`,
    } : undefined;

    return (
        <div className={`relative group ${showTimelineMarker ? 'pl-4' : ''}`}>
            {showTimelineMarker && (
                <div className={`absolute left-0 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-500 ${isLatest ?'bg-black border-[var(--skin-accent-color)] shadow-[0_0_15px_var(--sephirot-glow-color)] scale-110' : 'bg-black border-white/20'}`}>
                    {isLatest && <div className="w-2 h-2 bg-[var(--skin-accent-color)] rounded-full animate-pulse"></div>}
                </div>
            )}
            {onDelete && !isEditing && (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onDelete();
                    }}
                    className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-500/20 bg-black/60 text-red-300 opacity-85 transition hover:bg-red-500/18 hover:text-red-200"
                    title="Excluir ciclo"
                >
                    <Trash2Icon className="h-4 w-4" />
                </button>
            )}
            <button
                onClick={onClick}
                style={{ ...wrapperStyle, ...editHighlightStyle }}
                className={`relative block w-full cursor-pointer rounded-[1.75rem] text-left transition-all duration-300 ${isLatest ?'scale-[1.01]' : 'hover:-translate-y-0.5'} ${isEditing ?'scale-[0.985]' : ''}`}
            >
                {hasEraAccent && (
                    <div className="pointer-events-none absolute inset-y-5 left-0 z-10 w-[3px] rounded-r-full" style={{ background: `linear-gradient(180deg, ${eraSkin.edge} 0%, ${eraSkin.glow} 55%, ${eraSkin.metal} 100%)` }} />
                )}
                <MetalReportCard
                    rank={scoreInfo.grade}
                    score={report.performanceScore}
                    title={report.cycleName || 'Ciclo'}
                    subtitle={`${startDate} - ${endDate}`}
                    metrics={[
                        { label: 'Acoes', value: `${report.metrics.actionsCompleted || 0}/${report.metrics.totalPlannedActions || 0}` },
                        { label: 'Carga', value: `${report.metrics.totalHours || 0}h` },
                        { label: 'Metas', value: `${sealedMetas}/${plannedMetas}` },
                        { label: 'Presenca', value: `${presenceDays} dias` },
                    ]}
                    compact
                    className={OFFICIAL_COMPACT_HISTORY_CARD_CLASS}
                />
            </button>
        </div>
    );
};

// --- Main View ---
export const ReportsView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const {
        reports, activeCycle, startCycle, updateCycle, endCycle, assets, actions,
        applyExp, addChest, addFeedEvent, seasons, userProfile,
        oraclePreferences, showToast, grantInventoryItem, grantUserUnlock,
        setAchievementUnlocked, deleteCycle, fetchNotifications, openChest // Added deleteCycle here
    } = useGame();
    const [view, setView] = useState<'hub' | 'scanning' | 'results' | 'comparing' | 'reward'>('hub');
    const [isStartingCycle, setIsStartingCycle] = useState(false);
    const [showConfirmEndCycle, setShowConfirmEndCycle] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [reportsToCompare, setReportsToCompare] = useState<[Report, Report] | null>(null);
    const [reportForComparison, setReportForComparison] = useState<Report | null>(null);
    const [showNewCycleSetup, setShowNewCycleSetup] = useState(false);
    const [cycleBeingEdited, setCycleBeingEdited] = useState<Cycle | null>(null);
    const [historicalCycleBeingEdited, setHistoricalCycleBeingEdited] = useState<Report | null>(null);
    const [isEditingHistoryCycles, setIsEditingHistoryCycles] = useState(false);
    const [expGained, setExpGained] = useState(0);
    const [grantedInsignias, setGrantedInsignias] = useState<string[]>([]);
    const [earnedChest, setEarnedChest] = useState<ChestType | null>(null);
    const [isPostCycleFlow, setIsPostCycleFlow] = useState(false);
    const [cycleShimmer, setCycleShimmer] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scanAttempt, setScanAttempt] = useState(0);
    const [postCycleRewardsGranted, setPostCycleRewardsGranted] = useState(false);
    const [postCycleChestOpened, setPostCycleChestOpened] = useState(false);
    const [isOpeningPostCycleChest, setIsOpeningPostCycleChest] = useState(false);
    const [reportRewardPayload, setReportRewardPayload] = useState<RewardModalPayload | null>(null);
    const [isExportingLegacy, setIsExportingLegacy] = useState(false);
    const [showLegacyProjectionModal, setShowLegacyProjectionModal] = useState(false);
    const [legacyShareUnlocked, setLegacyShareUnlocked] = useState(false);
    const [eraMetadata, setEraMetadata] = useState<Record<string, EraMetadataEntry>>({});
    const [hasLoadedEraMetadata, setHasLoadedEraMetadata] = useState(false);
    const [legacyPlaqueForged, setLegacyPlaqueForged] = useState(false);
    const [hasLoadedLegacyPlaqueState, setHasLoadedLegacyPlaqueState] = useState(false);
    const [showLegacyPlaqueModal, setShowLegacyPlaqueModal] = useState(false);
    const [showLegacyPlaqueForgeModal, setShowLegacyPlaqueForgeModal] = useState(false);
    const assetsRef = useRef(assets);
    const actionsRef = useRef(actions);
    const endCycleRef = useRef(endCycle);
    const eraMetadataRemoteMissingRef = useRef(false);
    const [isEditingEras, setIsEditingEras] = useState(false);
    const [eraBreaks, setEraBreaks] = useState<number[]>([]);
    const [hasCustomEras, setHasCustomEras] = useState(false);
    const [draftEraSlots, setDraftEraSlots] = useState<DraftEraSlot[]>([]);
    const [draftReportEraIds, setDraftReportEraIds] = useState<Record<string, string>>({});
    const [activeDraftEraId, setActiveDraftEraId] = useState<string | null>(null);
    const [inlineEraEditor, setInlineEraEditor] = useState<InlineEraEditorState | null>(null);
    const [inlineEraName, setInlineEraName] = useState('');
    const [inlineEraSkinId, setInlineEraSkinId] = useState(FREE_ERA_RIBBON_SKIN_ID);
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

    const getUserId = () => (isUuid(userProfile.id) ?userProfile.id : null);
    const isEraMetadataRemoteUnsupported = (rawMessage: unknown) => {
        const message = String(rawMessage || '').toLowerCase();
        return (
            (message.includes('era_metadata') && (
                message.includes('does not exist')
                || message.includes('relation')
                || message.includes('column')
                || message.includes('bad request')
                || message.includes('could not find')
                || message.includes('pgrst')
            ))
            || (message.includes('column') && (
                message.includes('skin_id')
                || message.includes('description')
                || message.includes('final_summary')
            ))
        );
    };
    const eraMetadataStorageKey = `${ERA_METADATA_STORAGE_PREFIX}:${String(userProfile.id || 'local-user')}`;
    const legacyPlaqueStorageKey = `${LEGACY_PLAQUE_STORAGE_PREFIX}:${String(userProfile.id || 'local-user')}`;

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = window.localStorage.getItem(eraMetadataStorageKey);
            if (!raw) {
                setEraMetadata({});
                return;
            }
            const parsed = JSON.parse(raw);
            setEraMetadata(parsed && typeof parsed === 'object' ?parsed : {});
        } catch (error) {
            console.error('Erro ao carregar metadata das Eras:', error);
            setEraMetadata({});
        } finally {
            setHasLoadedEraMetadata(true);
        }
    }, [eraMetadataStorageKey]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = window.localStorage.getItem(legacyPlaqueStorageKey);
            if (!raw) {
                setLegacyPlaqueForged(false);
                return;
            }
            const parsed = JSON.parse(raw);
            setLegacyPlaqueForged(Boolean(parsed?.forgedAt));
        } catch (error) {
            console.error('Erro ao carregar estado da Placa do Legado:', error);
            setLegacyPlaqueForged(false);
        } finally {
            setHasLoadedLegacyPlaqueState(true);
        }
    }, [legacyPlaqueStorageKey]);

    useEffect(() => {
        if (typeof window === 'undefined' || !hasLoadedEraMetadata) return;
        try {
            if (Object.keys(eraMetadata).length === 0) {
                window.localStorage.removeItem(eraMetadataStorageKey);
            } else {
                window.localStorage.setItem(eraMetadataStorageKey, JSON.stringify(eraMetadata));
            }
        } catch (error) {
            console.error('Erro ao salvar metadata das Eras:', error);
        }
    }, [eraMetadata, eraMetadataStorageKey, hasLoadedEraMetadata]);

    useEffect(() => {
        if (typeof window === 'undefined' || !hasLoadedLegacyPlaqueState) return;
        try {
            if (!legacyPlaqueForged) {
                window.localStorage.removeItem(legacyPlaqueStorageKey);
            } else {
                window.localStorage.setItem(legacyPlaqueStorageKey, JSON.stringify({ forgedAt: new Date().toISOString() }));
            }
        } catch (error) {
            console.error('Erro ao salvar estado da Placa do Legado:', error);
        }
    }, [hasLoadedLegacyPlaqueState, legacyPlaqueForged, legacyPlaqueStorageKey]);

    useEffect(() => {
        if (!hasLoadedEraMetadata || eraMetadataRemoteMissingRef.current) return;
        const userId = getUserId();
        if (!userId) return;

        let isMounted = true;
        const loadRemoteEraMetadata = async () => {
            const { data, error } = await supabase
                .from('era_metadata')
                .select('era_key, name, skin_id, description, final_summary')
                .eq('user_id', userId);

            if (error) {
                if (isEraMetadataRemoteUnsupported(error.message)) {
                    eraMetadataRemoteMissingRef.current = true;
                    return;
                }
                console.error('Erro ao carregar metadata remota das Eras:', error.message);
                return;
            }

            if (!isMounted || !data) return;

            const nextMetadata = data.reduce((accumulator, row) => {
                if (!row.era_key) return accumulator;
                accumulator[row.era_key] = {
                    name: row.name || undefined,
                    skinId: row.skin_id || undefined,
                    description: row.description || undefined,
                    finalSummary: row.final_summary || undefined,
                };
                return accumulator;
            }, {} as Record<string, { name?: string; skinId?: string; description?: string; finalSummary?: string }>);

            if (Object.keys(nextMetadata).length > 0) {
                setEraMetadata((previous) => ({ ...previous, ...nextMetadata }));
            }
        };

        loadRemoteEraMetadata();
        return () => {
            isMounted = false;
        };
    }, [hasLoadedEraMetadata, userProfile.id]);

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
                    return index >= 0 ?index + 1 : null;
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

    const primePostCycleResults = useCallback((report: Report, awardedExp: number): { ok: boolean; chest: ChestType | null } => {
        setSelectedReport(report);
        setExpGained(awardedExp);
        setScanError(null);
        setShowNewCycleSetup(false);

        const startD = parseDate(report.startDate);
        const endD = parseDate(report.endDate);
        const durationDays = Math.max(1, daysBetween(startD, endD) + 1);
        const score = report.performanceScore;

        let chestType: ChestType | null = null;

        if (awardedExp >= 25000 && score >= 90) chestType = 'Lendário';
        else if (awardedExp >= 12000 && score >= 80) chestType = 'Épico';
        else if (awardedExp >= 5000 && score >= 70) chestType = 'Raro';
        else if (awardedExp >= 2250 && score >= 60) chestType = 'Incomum';
        else if (awardedExp >= 750) chestType = 'Comum';

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
        setGrantedInsignias(['insignia_report_comum']);
        setIsPostCycleFlow(true);
        setPostCycleRewardsGranted(false);
        setPostCycleChestOpened(false);
        setReportRewardPayload(null);
        setIsOpeningPostCycleChest(false);

        return { ok: true, chest: chestType };
    }, []);

    const performEndOfCycle = (): { ok: boolean; chest: ChestType | null } => {
        try {
            const result = endCycleRef.current(assetsRef.current, actionsRef.current);
            if (!result?.report) throw new Error('Relatório inválido');
            return primePostCycleResults(result.report, result.expGained);

        } catch (error) {
            console.error('Erro ao analisar ciclo:', error);
            setScanError('Não foi possível analisar o ciclo. Tente novamente.');
            return { ok: false, chest: null };
        }
    };

    const finalizeReportGeneration = () => {
        const outcome = performEndOfCycle();
        if (outcome.ok) {
            setView('results');
        }
        return outcome;
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const pending = (window as any).__glyphPendingCycleResults as { report?: Report; expGained?: number } | undefined;
        if (!pending?.report) return;

        (window as any).__glyphPendingCycleResults = null;
        primePostCycleResults(pending.report, pending.expGained || 0);
        setView('results');
    }, [primePostCycleResults]);

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
                finalizeReportGeneration();
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

    const buildCycleFinalizedNotificationContent = useCallback((report: Report) => {
        const cycleName = report.cycleName || 'seu ciclo';
        const mode = oraclePreferences?.activeMode || 'neutro';
        const focus = report.highlight?.mostFocusedArena || 'sua arena principal';
        const score = Math.round(report.performanceScore || 0);
        const hours = Math.round(report.metrics?.totalHours || 0);

        switch (mode) {
            case 'coach':
                return `${cycleName} fechou em ${score}. Agora revisa o que te deu mais resultado em ${focus} e sobe o proximo ciclo.`;
            case 'tatico':
                return `${cycleName} encerrou com score ${score}. Consolide o que funcionou em ${focus} e descarte o resto.`;
            case 'estrategico':
                return `${cycleName} encerrou com ${hours}h registradas. A revisao fecha a leitura da fase e mostra onde insistir.`;
            case 'reflexivo':
                return `${cycleName} foi encerrado. Vale rever o que ${focus} te ensinou nesta fase.`;
            case 'calmo':
                return `${cycleName} foi concluido. Seu relatorio ja pode ser revisado com calma.`;
            case 'personalizado':
            case 'neutro':
            default:
                return `O relatorio de ${cycleName} esta pronto para revisao.`;
        }
    }, [oraclePreferences?.activeMode]);

    const buildPostCycleRewardToast = useCallback((awardedExp: number, awardedChest: ChestType | null, awardedInsignias: string[]) => {
        if (awardedChest) {
            return awardedInsignias.length > 0
                ? `📦 Baú ${awardedChest} e ${awardedInsignias.length} insígnia(s) adicionados\n✨ +${awardedExp} XP computados`
                : `📦 Baú ${awardedChest} adicionado ao inventário\n✨ +${awardedExp} XP computados`;
        }

        return awardedInsignias.length > 0
            ? `🏅 ${awardedInsignias.length} insígnia(s) adicionada(s) ao inventário\n✨ +${awardedExp} XP computados`
            : `✨ +${awardedExp} XP foram computados ao seu perfil`;
    }, []);

    const ensurePostCycleRewardsGranted = useCallback(async (options?: { suppressToast?: boolean }) => {
        const awardedChest = earnedChest;
        const awardedInsignias = [...grantedInsignias];
        const awardedExp = expGained;

        if (!isPostCycleFlow) {
            return {
                justGranted: false,
                awardedChest,
                awardedInsignias,
                awardedExp,
                chestReady: Boolean(awardedChest),
            };
        }

        if (postCycleRewardsGranted) {
            return {
                justGranted: false,
                awardedChest,
                awardedInsignias,
                awardedExp,
                chestReady: Boolean(awardedChest),
            };
        }

        applyExp(awardedExp);

        if (awardedInsignias.length > 0) {
            awardedInsignias.forEach(insigniaId => {
                grantUserUnlock('insignias', insigniaId);
                void grantInventoryItem(insigniaId, true);
            });
        }

        let chestReady = true;
        if (awardedChest) {
            chestReady = Boolean(await addChest(awardedChest));
        }

        setAchievementUnlocked({
            type: 'REPORT_COMPLETED',
            data: {
                title: `Relatório de Ciclo - ${selectedReport?.performanceScore || 0}%`,
                reward: {
                    exp: awardedExp,
                    items: [...awardedInsignias],
                    chest: awardedChest
                }
            }
        });

        if (userProfile?.id && selectedReport && oraclePreferences?.notificationsEnabled !== false) {
            try {
                await SupabaseService.createNotification(
                    userProfile.id,
                    'cycle_finalized',
                    buildCycleFinalizedNotificationContent(selectedReport),
                );
                await fetchNotifications();
            } catch (error) {
                console.error('Erro ao criar notificação de ciclo finalizado:', error);
            }
        }

        setPostCycleRewardsGranted(true);

        if (!options?.suppressToast) {
            showToast(buildPostCycleRewardToast(awardedExp, awardedChest, awardedInsignias));
        }

        return {
            justGranted: true,
            awardedChest,
            awardedInsignias,
            awardedExp,
            chestReady,
        };
    }, [
        earnedChest,
        grantedInsignias,
        expGained,
        isPostCycleFlow,
        postCycleRewardsGranted,
        applyExp,
        grantUserUnlock,
        grantInventoryItem,
        addChest,
        selectedReport,
        userProfile?.id,
        oraclePreferences?.notificationsEnabled,
        fetchNotifications,
        showToast,
        buildPostCycleRewardToast,
        buildCycleFinalizedNotificationContent,
        setAchievementUnlocked,
    ]);

    const handleOpenPostCycleChest = useCallback(async () => {
        if (!earnedChest || postCycleChestOpened || isOpeningPostCycleChest) return;

        setIsOpeningPostCycleChest(true);
        try {
            const rewardState = await ensurePostCycleRewardsGranted({ suppressToast: true });
            if (!rewardState.chestReady) {
                showToast('Não foi possível preparar o baú deste ciclo.', 'error');
                return;
            }

            const result = await openChest(earnedChest);
            if (!result) return;

            setPostCycleChestOpened(true);
            setReportRewardPayload(buildChestRewardPayload(result, earnedChest));
        } catch (error) {
            console.error('Erro ao abrir o baú do ciclo:', error);
            showToast('Não foi possível abrir o baú deste ciclo.', 'error');
        } finally {
            setIsOpeningPostCycleChest(false);
        }
    }, [
        earnedChest,
        postCycleChestOpened,
        isOpeningPostCycleChest,
        ensurePostCycleRewardsGranted,
        openChest,
        showToast,
    ]);

    const handleStartNewCycleFromResults = async () => {
        setShowNewCycleSetup(true);

        try {
            await ensurePostCycleRewardsGranted();
        } catch (error) {
            console.error('Erro ao preparar o novo ciclo a partir do relatório:', error);
            showToast('O novo ciclo foi aberto, mas houve falha ao processar algumas recompensas.');
        }

        setIsPostCycleFlow(false);
        setGrantedInsignias([]);
        setReportRewardPayload(null);
    };

    const handleForceClose = useCallback((event?: { preventDefault?: () => void; stopPropagation?: () => void }) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        setView('hub');
        setSelectedReport(null);
        setReportsToCompare(null);
        setReportForComparison(null);
        setShowConfirmEndCycle(false);
        setScanError(null);
        setIsPostCycleFlow(false);
        setPostCycleRewardsGranted(false);
        setPostCycleChestOpened(false);
        setIsOpeningPostCycleChest(false);
        setReportRewardPayload(null);
        if (typeof window !== 'undefined') {
            (window as any).__glyphPendingCycleResults = null;
        }
        onClose();
    }, [onClose]);

    const handleCloseDynamic = useCallback(() => {
        switch (view) {
            case 'results':
            case 'comparing':
                setView('hub');
                setSelectedReport(null);
                setReportsToCompare(null);
                setReportForComparison(null);
                break;
            default:
                handleForceClose();
        }
    }, [handleForceClose, onClose, view]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            handleCloseDynamic();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleCloseDynamic]);

    const handlePostCycleResultsOk = async () => {
        await ensurePostCycleRewardsGranted({ suppressToast: true });
        setIsPostCycleFlow(false);
        setGrantedInsignias([]);
        setReportRewardPayload(null);
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
    const getEraLabel = (index: number) => `ERA ${index + 1}`;
    const getEraSegmentKey = (oldestReport?: Report, newestReport?: Report, index = 0) => `${oldestReport?.id || oldestReport?.startDate || 'start'}:${newestReport?.id || newestReport?.endDate || 'end'}:${index}`;
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
            const totalMetas = segmentReports.reduce((sum, report) => sum + (report.metrics.sealedMetas ?? report.metrics.goalsMet ?? 0), 0);
            const bestStreak = segmentReports.reduce((best, report) => Math.max(best, report.metrics.maxStreak || 0), 0);
            const grade = getScoreGrade(avgScore).grade;
            const color = getEraTone(grade);

            const arenaCounts = new Map<string, number>();
            const actionCounts = new Map<string, number>();

            segmentReports.forEach((report) => {
                const arenaName = report.highlight?.mostFocusedArena?.trim() || 'Sem arena dominante';
                arenaCounts.set(arenaName, (arenaCounts.get(arenaName) || 0) + 1);

                const dominantActions = report.metrics.top3Actions && report.metrics.top3Actions.length > 0
                    ?report.metrics.top3Actions
                    : (report.highlight?.mostRepeatedAction
                        ?[{ name: report.highlight.mostRepeatedAction, count: report.highlight.mostRepeatedActionCount || 1 }]
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
            const totalExp = segmentReports.reduce((sum, report) => sum + (report.expGained || report.metrics.expGained || 0), 0);

            const key = getEraSegmentKey(oldestReport, newestReport, index);
            const defaultLabel = getEraLabel(index);
            const customLabel = eraMetadata[key]?.name?.trim();
            const customDescription = eraMetadata[key]?.description?.trim();
            const customFinalSummary = eraMetadata[key]?.finalSummary?.trim();

            const requestedSkinId = eraMetadata[key]?.skinId;
            const matchedSkin = ERA_RIBBON_SKINS.find((skin) => skin.id === requestedSkinId);
            const defaultSkinId = (!userProfile.isPremium || PREMIUM_ERA_RIBBON_SKIN_IDS.length === 0)
                ?FREE_ERA_RIBBON_SKIN_ID
                : (PREMIUM_ERA_RIBBON_SKIN_IDS[index % PREMIUM_ERA_RIBBON_SKIN_IDS.length] || FREE_ERA_RIBBON_SKIN_ID);
            const skinId = matchedSkin ?((matchedSkin.isPremium && !userProfile.isPremium) ?FREE_ERA_RIBBON_SKIN_ID : matchedSkin.id) : defaultSkinId;
            const aiSummary = buildEraAiSummary({
                cycleCount: segmentReports.length,
                avgScore,
                dominantArena,
                bestStreak,
                topActions,
                startDate: oldestReport?.startDate,
                endDate: newestReport?.endDate,
            });
            const cycles = [...segmentReports]
                .reverse()
                .map((report) => ({
                    id: report.id,
                    name: report.cycleName || 'Ciclo',
                    startDate: report.startDate,
                    endDate: report.endDate,
                    score: report.performanceScore,
                    grade: getScoreGrade(report.performanceScore, report.metrics?.fairness).grade,
                    focusArena: report.highlight?.mostFocusedArena?.trim() || dominantArena,
                    signatureAction: report.metrics.top3Actions?.[0]?.name || report.highlight?.mostRepeatedAction || 'Nenhuma',
                    plannedMetas: report.metrics.plannedMetas,
                    sealedMetas: report.metrics.sealedMetas ?? report.metrics.goalsMet ?? 0,
                    weeklyAtlas: report.metrics.weeklyAtlas || [],
                    identitySnapshot: report.identitySnapshot,
                }));

            return {
                key,
                defaultLabel,
                skinId,
                description: customDescription || undefined,
                finalSummary: customFinalSummary || undefined,
                aiSummary,
                cycles,
                label: customLabel || defaultLabel,
                startDate: oldestReport?.startDate || newestReport?.startDate || '',
                endDate: newestReport?.endDate || oldestReport?.endDate || '',
                avgScore,
                totalExp,
                totalHours,
                totalMetas,
                cycleCount: segmentReports.length,
                dominantArena,
                topActions,
                bestStreak,
                grade,
                color,
            };
        });
    }, [eraMetadata, eraSegments, sortedReports, userProfile.isPremium]);
    const reportEraSummaryByIndex = useMemo(() => {
        const map = new Map<number, LegacyEraSummary>();
        eraSegments.forEach((segment, index) => {
            const summary = eraSummaries[index];
            if (!summary) return;
            for (let reportIndex = segment.start; reportIndex <= segment.end; reportIndex += 1) {
                map.set(reportIndex, summary);
            }
        });
        return map;
    }, [eraSegments, eraSummaries]);
    const draftEraSegments = useMemo(() => {
        if (sortedReports.length === 0 || draftEraSlots.length === 0) return [] as DraftEraSegment[];
        const fallbackSlotId = draftEraSlots[0].id;
        const segments: DraftEraSegment[] = [];
        let start = 0;
        let currentSlotId = draftReportEraIds[sortedReports[0].id] || fallbackSlotId;
        for (let index = 1; index < sortedReports.length; index += 1) {
            const nextSlotId = draftReportEraIds[sortedReports[index].id] || fallbackSlotId;
            if (nextSlotId !== currentSlotId) {
                segments.push({ start, end: index - 1, slotId: currentSlotId });
                start = index;
                currentSlotId = nextSlotId;
            }
        }
        segments.push({ start, end: sortedReports.length - 1, slotId: currentSlotId });
        return segments;
    }, [draftEraSlots, draftReportEraIds, sortedReports]);
    const draftEraByReportIndex = useMemo(() => {
        const map = new Map<number, DraftEraSlot>();
        if (!isEditingEras) return map;
        sortedReports.forEach((report, reportIndex) => {
            const slotId = draftReportEraIds[report.id];
            const slot = draftEraSlots.find((entry) => entry.id === slotId);
            if (slot) map.set(reportIndex, slot);
        });
        return map;
    }, [draftEraSlots, draftReportEraIds, isEditingEras, sortedReports]);
    const draftEraSelectionSummary = useMemo(() => {
        const counts = new Map<string, number>();
        const ranges = new Map<string, { newest?: string; oldest?: string }>();
        sortedReports.forEach((report, reportIndex) => {
            const slotId = draftReportEraIds[report.id];
            if (!slotId) return;
            counts.set(slotId, (counts.get(slotId) || 0) + 1);
            const current = ranges.get(slotId) || {};
            if (!current.newest) current.newest = report.endDate;
            current.oldest = report.startDate;
            ranges.set(slotId, current);
        });
        return draftEraSlots.map((slot) => ({
            slot,
            count: counts.get(slot.id) || 0,
            newest: ranges.get(slot.id)?.newest,
            oldest: ranges.get(slot.id)?.oldest,
        }));
    }, [draftEraSlots, draftReportEraIds, sortedReports]);
    function getEraRibbonSkinId(index: number) {
        if (!userProfile.isPremium || PREMIUM_ERA_RIBBON_SKIN_IDS.length === 0) {
            return FREE_ERA_RIBBON_SKIN_ID;
        }
        return PREMIUM_ERA_RIBBON_SKIN_IDS[index % PREMIUM_ERA_RIBBON_SKIN_IDS.length] || FREE_ERA_RIBBON_SKIN_ID;
    }

    function resolveEraSkinId(summary: LegacyEraSummary | null | undefined, index: number) {
        if (!summary?.key) return getEraRibbonSkinId(index);
        const requestedSkinId = eraMetadata[summary.key]?.skinId;
        const matchedSkin = ERA_RIBBON_SKINS.find((skin) => skin.id === requestedSkinId);
        if (!matchedSkin) return getEraRibbonSkinId(index);
        if (matchedSkin.isPremium && !userProfile.isPremium) return FREE_ERA_RIBBON_SKIN_ID;
        return matchedSkin.id;
    }

    const displayedEraByReportIndex = useMemo(() => {
        if (isEditingEras) {
            const map = new Map<number, { label: string; skinId: string; isActive: boolean }>();
            sortedReports.forEach((report, reportIndex) => {
                const slotId = draftReportEraIds[report.id];
                const slot = draftEraSlots.find((entry) => entry.id === slotId);
                if (!slot) return;
                map.set(reportIndex, {
                    label: slot.name?.trim() || slot.defaultLabel,
                    skinId: slot.skinId,
                    isActive: slot.id === activeDraftEraId,
                });
            });
            return map;
        }

        const map = new Map<number, { label: string; skinId: string; isActive: boolean }>();
        eraSegments.forEach((segment, index) => {
            const summary = eraSummaries[index];
            if (!summary) return;
            for (let reportIndex = segment.start; reportIndex <= segment.end; reportIndex += 1) {
                map.set(reportIndex, {
                    label: summary.label,
                    skinId: resolveEraSkinId(summary, index),
                    isActive: false,
                });
            }
        });
        return map;
    }, [activeDraftEraId, draftEraSlots, draftReportEraIds, eraSegments, eraSummaries, isEditingEras, sortedReports]);
    const displayedEraBands = useMemo(() => {
        if (isEditingEras) {
            return draftEraSegments.map((segment, index) => {
                const slot = draftEraSlots.find((entry) => entry.id === segment.slotId);
                if (!slot) return null;
                return {
                    key: slot.id,
                    label: slot.name?.trim() || slot.defaultLabel,
                    skinId: slot.skinId,
                    start: segment.start,
                    end: segment.end,
                    eraIndex: index,
                    isActive: slot.id === activeDraftEraId,
                    slot,
                };
            }).filter(Boolean) as Array<{ key: string; label: string; skinId: string; start: number; end: number; eraIndex: number; isActive: boolean; slot: DraftEraSlot }>;
        }

        if (eraSummaries.length === 0 && (activeCycle || sortedReports.length > 0)) {
            return [{
                key: BOOTSTRAP_ERA_KEY,
                label: eraMetadata[BOOTSTRAP_ERA_KEY]?.name?.trim() || 'ERA 1',
                skinId: eraMetadata[BOOTSTRAP_ERA_KEY]?.skinId || getEraRibbonSkinId(0),
                start: -1,
                end: -1,
                eraIndex: 0,
                isActive: false,
                summary: null,
            }] as Array<{ key: string; label: string; skinId: string; start: number; end: number; eraIndex: number; isActive: boolean; summary: LegacyEraSummary | null }>;
        }

        return eraSegments.map((segment, index) => {
            const summary = eraSummaries[index];
            if (!summary) return null;
            return {
                key: summary.key,
                label: summary.label,
                skinId: resolveEraSkinId(summary, index),
                start: segment.start,
                end: segment.end,
                eraIndex: index,
                isActive: false,
                summary,
            };
        }).filter(Boolean) as Array<{ key: string; label: string; skinId: string; start: number; end: number; eraIndex: number; isActive: boolean; summary: LegacyEraSummary }>;
    }, [activeCycle, activeDraftEraId, draftEraSegments, draftEraSlots, eraMetadata, eraSegments, eraSummaries, isEditingEras, sortedReports.length]);

    const legacyFallbackIdentity = useMemo(() => ({
        avatarUrl: userProfile.avatarUrl,
        nickname: userProfile.nickname || userProfile.username || 'Usuario',
        title: userProfile.title,
        level: userProfile.level || 1,
        nobilityRankId: userProfile.nobility?.rankId,
        nobilityRankName: NOBILITY_RANKS.find((rank) => rank.id === userProfile.nobility?.rankId)?.name || undefined,
        clanName: userProfile.clanName || null,
        clanIcon: userProfile.clanIcon || null,
        clanRankName: null,
        capturedAt: new Date().toISOString(),
    }), [userProfile.avatarUrl, userProfile.clanIcon, userProfile.clanName, userProfile.level, userProfile.nickname, userProfile.nobility, userProfile.title, userProfile.username]);

    const sovereignName = userProfile.nickname || userProfile.username || 'Usuario';
    const historicalAverageScore = useMemo(
        () => sortedReports.length > 0 ?sortedReports.reduce((sum, report) => sum + report.performanceScore, 0) / sortedReports.length : 0,
        [sortedReports]
    );
    const effectiveEraCount = useMemo(
        () => eraSummaries.length > 0 ?eraSummaries.length : ((sortedReports.length > 0 || !!activeCycle) ?1 : 0),
        [activeCycle, eraSummaries.length, sortedReports.length]
    );
    const totalHistoricalHours = useMemo(
        () => sortedReports.reduce((sum, report) => sum + (report.metrics.totalHours || 0), 0),
        [sortedReports]
    );
    const historyStartDate = eraSummaries[eraSummaries.length - 1]?.startDate;
    const historyEndDate = eraSummaries[0]?.endDate;
    const legacyPlaqueUnlocked = useMemo(() => !!userProfile.isPremium || eraSummaries.length >= 3, [eraSummaries.length, userProfile.isPremium]);

    const openInlineEraEditor = (payload: InlineEraEditorState, initialName: string, initialSkinId: string) => {
        setInlineEraEditor(payload);
        setInlineEraName(initialName);
        setInlineEraSkinId(initialSkinId);
    };

    const buildDraftSegments = (assignments: Record<string, string>, slots: DraftEraSlot[]) => {
        if (sortedReports.length === 0 || slots.length === 0) return [] as DraftEraSegment[];
        const fallbackSlotId = slots[0].id;
        const segments: DraftEraSegment[] = [];
        let start = 0;
        let currentSlotId = assignments[sortedReports[0].id] || fallbackSlotId;
        for (let index = 1; index < sortedReports.length; index += 1) {
            const nextSlotId = assignments[sortedReports[index].id] || fallbackSlotId;
            if (nextSlotId !== currentSlotId) {
                segments.push({ start, end: index - 1, slotId: currentSlotId });
                start = index;
                currentSlotId = nextSlotId;
            }
        }
        segments.push({ start, end: sortedReports.length - 1, slotId: currentSlotId });
        return segments;
    };

    const beginEraEditing = () => {
        if (sortedReports.length === 0) {
            if (activeCycle) {
                openBootstrapEraInlineEditor();
            }
            return;
        }
        const slots = eraSummaries.map((summary, index) => ({
            id: summary.key,
            sourceKey: summary.key,
            defaultLabel: summary.defaultLabel || getEraLabel(index),
            name: eraMetadata[summary.key]?.name,
            skinId: resolveEraSkinId(summary, index),
            description: eraMetadata[summary.key]?.description,
            finalSummary: eraMetadata[summary.key]?.finalSummary,
        }));
        const assignments = sortedReports.reduce<Record<string, string>>((accumulator, report, reportIndex) => {
            const summary = reportEraSummaryByIndex.get(reportIndex);
            accumulator[report.id] = summary?.key || slots[0]?.id || '';
            return accumulator;
        }, {});
        setDraftEraSlots(slots);
        setDraftReportEraIds(assignments);
        setActiveDraftEraId(slots[0]?.id || null);
        setInlineEraEditor(null);
        setIsEditingEras(true);
    };

    const persistEraMetadataRemote = async (key: string, entry?: { name?: string; skinId?: string; description?: string; finalSummary?: string }) => {
        if (eraMetadataRemoteMissingRef.current) return;
        const userId = getUserId();
        if (!userId) return;

        if (!entry?.name && !entry?.skinId && !entry?.description && !entry?.finalSummary) {
            const { error } = await supabase.from('era_metadata').delete().match({ user_id: userId, era_key: key });
            if (error) {
                if (isEraMetadataRemoteUnsupported(error.message)) {
                    eraMetadataRemoteMissingRef.current = true;
                    return;
                }
                console.error('Erro ao remover metadata remota da Era:', error.message);
            }
            return;
        }

        const { error } = await supabase.from('era_metadata').upsert({
            user_id: userId,
            era_key: key,
            name: entry.name || null,
            skin_id: entry.skinId || null,
            description: entry.description || null,
            final_summary: entry.finalSummary || null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,era_key' });

        if (error) {
            if (isEraMetadataRemoteUnsupported(error.message)) {
                eraMetadataRemoteMissingRef.current = true;
                return;
            }
            console.error('Erro ao salvar metadata remota da Era:', error.message);
        }
    };

    const persistAllEraMetadataRemote = async (nextState: Record<string, EraMetadataEntry>) => {
        if (eraMetadataRemoteMissingRef.current) return;
        const userId = getUserId();
        if (!userId) return;

        const { error: deleteError } = await supabase.from('era_metadata').delete().eq('user_id', userId);
        if (deleteError) {
            if (isEraMetadataRemoteUnsupported(deleteError.message)) {
                eraMetadataRemoteMissingRef.current = true;
                return;
            }
            console.error('Erro ao resetar metadata remota das Eras:', deleteError.message);
            return;
        }

        const payload = Object.entries(nextState).map(([key, entry]) => ({
            user_id: userId,
            era_key: key,
            name: entry.name || null,
            skin_id: entry.skinId || null,
            description: entry.description || null,
            final_summary: entry.finalSummary || null,
            updated_at: new Date().toISOString(),
        }));
        if (payload.length === 0) return;

        const { error } = await supabase.from('era_metadata').upsert(payload, { onConflict: 'user_id,era_key' });
        if (error) {
            if (isEraMetadataRemoteUnsupported(error.message)) {
                eraMetadataRemoteMissingRef.current = true;
                return;
            }
            console.error('Erro ao salvar metadata remota das Eras:', error.message);
        }
    };

    const openSavedEraInlineEditor = (summary: LegacyEraSummary | null, eraIndex: number) => {
        if (!summary?.key) {
            if (eraIndex === 0 && activeCycle && sortedReports.length === 0) {
                openBootstrapEraInlineEditor();
            }
            return;
        }
        openInlineEraEditor({
            mode: 'saved',
            key: summary.key,
            defaultLabel: summary.defaultLabel || getEraLabel(eraIndex),
            eraIndex,
        }, eraMetadata[summary.key]?.name || '', resolveEraSkinId(summary, eraIndex));
    };

    const openDraftEraInlineEditor = (slot: DraftEraSlot, eraIndex: number) => {
        openInlineEraEditor({
            mode: 'draft',
            key: slot.id,
            defaultLabel: slot.defaultLabel,
            eraIndex,
        }, slot.name || '', slot.skinId);
    };

    const openBootstrapEraInlineEditor = () => {
        openInlineEraEditor({
            mode: 'saved',
            key: BOOTSTRAP_ERA_KEY,
            defaultLabel: 'ERA 1',
            eraIndex: 0,
        }, eraMetadata[BOOTSTRAP_ERA_KEY]?.name || '', eraMetadata[BOOTSTRAP_ERA_KEY]?.skinId || getEraRibbonSkinId(0));
    };

    const handleSaveInlineEraEditor = async () => {
        if (!inlineEraEditor) return;
        const normalizedName = inlineEraName.trim();
        const defaultSkinId = getEraRibbonSkinId(inlineEraEditor.eraIndex);

        if (inlineEraEditor.mode === 'draft') {
            setDraftEraSlots((previous) => previous.map((slot) => {
                if (slot.id !== inlineEraEditor.key) return slot;
                return {
                    ...slot,
                    name: normalizedName || undefined,
                    skinId: inlineEraSkinId || defaultSkinId,
                };
            }));
            setInlineEraEditor(null);
            return;
        }

        const existing = eraMetadata[inlineEraEditor.key] || {};
        const nextEntry: EraMetadataEntry = {
            name: normalizedName && normalizedName !== inlineEraEditor.defaultLabel ?normalizedName : undefined,
            skinId: inlineEraSkinId !== defaultSkinId ?inlineEraSkinId : undefined,
            description: existing.description,
            finalSummary: existing.finalSummary,
        };
        const cleanedEntry = !nextEntry.name && !nextEntry.skinId && !nextEntry.description && !nextEntry.finalSummary
            ?undefined
            : nextEntry;

        setEraMetadata((previous) => {
            const nextState = { ...previous };
            if (!cleanedEntry) {
                delete nextState[inlineEraEditor.key];
            } else {
                nextState[inlineEraEditor.key] = cleanedEntry;
            }
            return nextState;
        });
        await persistEraMetadataRemote(inlineEraEditor.key, cleanedEntry);
        setInlineEraEditor(null);
    };

    const handleLegacyPlaqueForged = () => {
        setLegacyPlaqueForged(true);
        setShowLegacyPlaqueForgeModal(false);
        setShowLegacyPlaqueModal(true);
        showToast('Placa do Legado forjada.');
    };

    const handleOpenLegacyPlaque = () => {
        if (!legacyPlaqueUnlocked) {
            showToast('A Placa do Legado ainda esta bloqueada.');
            return;
        }
        if (!legacyPlaqueForged) {
            setShowLegacyPlaqueForgeModal(true);
            return;
        }
        setShowLegacyPlaqueModal(true);
    };

    const handleOpenLegacyCycle = (cycleId: string) => {
        setShowLegacyProjectionModal(false);
        const report = sortedReports.find((entry) => entry.id === cycleId);
        if (report) handleViewReport(report);
    };

    const renderLegacySummary = () => {
        if (sortedReports.length === 0) return null;
        return (
            <GlassCard variant="neutral" className="mb-4 px-4 py-3">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                        <span className="text-[var(--skin-accent-color)]">Legado</span>
                        <span>{sortedReports.length} ciclos</span>
                        <span className="text-white/15">/</span>
                        <span>{effectiveEraCount} eras</span>
                        <span className="text-white/15">/</span>
                        <span>{Math.round(totalHistoricalHours)}h</span>
                        <span className="text-white/15">/</span>
                        <span>score {Math.round(historicalAverageScore)}</span>
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={handleStartLegacyExport}
                            className="w-full max-w-[260px] rounded-xl luxe-skin-button px-5 py-3.5 text-xs"
                        >
                            VER LEGADO
                        </button>
                    </div>
                </div>
            </GlassCard>
        );
    }; 
    const handleExportLegacy = async () => {
        if (eraSummaries.length === 0) {
            showToast('Nao ha Eras concluidas para exportar.');
            return;
        }

        setIsExportingLegacy(true);
        try {
            await import('../components/LegacyExportDocument');
            const { exportElementAsImage, shouldPreferNativeShare } = await import('../components/Share');
            const preferNativeShare = shouldPreferNativeShare();
            await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
            if (preferNativeShare) {
                showToast('Preparando compartilhamento do registro...', 'info');
            }
            const result = await exportElementAsImage(LEGACY_EXPORT_CAPTURE_ID, {
                fileName: `glyph-registro-de-soberania-${getLocalDateString()}.png`,
                title: `Registro de Soberania - ${sovereignName}`,
                backgroundColor: '#050505',
                preferShare: preferNativeShare,
            });
            showToast(
                result === 'shared'
                    ? 'Registro de Soberania compartilhado.'
                    : result === 'cancelled'
                        ? 'Compartilhamento cancelado.'
                        : 'Registro de Soberania exportado.'
            );
        } catch (error) {
            console.error('Erro ao exportar legado completo:', error);
            showToast('Nao foi possivel exportar o Legado Completo.');
        } finally {
            setIsExportingLegacy(false);
        }
    };

    const handleStartLegacyExport = () => {
        if (eraSummaries.length === 0) {
            showToast('Nao ha Eras concluidas para gerar o legado.');
            return;
        }

        setShowLegacyProjectionModal(true);
    };

    const handleShareReport = async (report: Report) => {
        const { shareElementWithFeedback } = await import('../components/Share');
        await shareElementWithFeedback(showToast, 'report-summary-card-capture', {
            title: `Relatorio de Ciclo ${formatDate(report.startDate)} - Life OS`,
            preparingMessage: 'Preparando compartilhamento do relatorio...',
            sharedMessage: 'Relatorio compartilhado.',
            cancelledMessage: 'Compartilhamento cancelado.',
            errorMessage: 'Nao foi possivel preparar o relatorio para compartilhar.',
        });
    };

    const handleCancelEraEdit = () => {
        setIsEditingEras(false);
        setDraftEraSlots([]);
        setDraftReportEraIds({});
        setActiveDraftEraId(null);
        setInlineEraEditor(null);
    };

    const toggleHistoryCycleEditing = () => {
        if (isEditingEras) {
            showToast('Finalize a organizacao das Eras antes de editar ciclos.');
            return;
        }
        setIsEditingHistoryCycles((previous) => !previous);
        setCycleBeingEdited(null);
        setHistoricalCycleBeingEdited(null);
    };

    const handleResetEras = async () => {
        setIsEditingEras(false);
        setDraftEraSlots([]);
        setDraftReportEraIds({});
        setActiveDraftEraId(null);
        setInlineEraEditor(null);
        setHasCustomEras(false);
        setEraBreaks(defaultEraBreaks);
        const userId = getUserId();
        if (!userId) return;
        const { error } = await supabase.from('era_boundaries').delete().eq('user_id', userId);
        if (error) console.error('Erro ao resetar Eras:', error.message);
    };

    const handleAddDraftEra = () => {
        const index = draftEraSlots.length;
        const slot: DraftEraSlot = {
            id: `draft-era-${Date.now()}-${index}`,
            defaultLabel: getEraLabel(index),
            skinId: getEraRibbonSkinId(index),
        };
        setDraftEraSlots((previous) => [...previous, slot]);
        setActiveDraftEraId(slot.id);
        setInlineEraEditor(null);
    };

    const handleRemoveActiveDraftEra = () => {
        if (!activeDraftEraId || draftEraSlots.length <= 1) return;
        const currentIndex = draftEraSlots.findIndex((slot) => slot.id === activeDraftEraId);
        if (currentIndex === -1) return;

        const fallbackSlot = draftEraSlots[currentIndex - 1] || draftEraSlots[currentIndex + 1] || draftEraSlots[0];
        if (!fallbackSlot) return;

        setDraftReportEraIds((previous) => {
            const next = { ...previous };
            sortedReports.forEach((report) => {
                if (next[report.id] === activeDraftEraId) {
                    next[report.id] = fallbackSlot.id;
                }
            });
            return next;
        });
        setDraftEraSlots((previous) => previous.filter((slot) => slot.id !== activeDraftEraId));
        setActiveDraftEraId(fallbackSlot.id);
        if (inlineEraEditor?.key === activeDraftEraId) {
            setInlineEraEditor(null);
        }
    };

    const handleAssignReportToDraftEra = (reportIndex: number) => {
        if (!isEditingEras || !activeDraftEraId) return;
        const report = sortedReports[reportIndex];
        if (!report) return;

        let toastMessage: string | null = null;
        setDraftReportEraIds((previous) => {
            const fallbackSlotId = draftEraSlots[0]?.id;
            if (!fallbackSlotId) return previous;

            const next = { ...previous };
            const assignments = sortedReports.map((entry) => previous[entry.id] || fallbackSlotId);
            const currentSlotId = assignments[reportIndex];
            if (!currentSlotId) return previous;

            const activeIndexes = assignments.reduce<number[]>((accumulator, slotId, currentIndex) => {
                if (slotId === activeDraftEraId) accumulator.push(currentIndex);
                return accumulator;
            }, []);

            if (activeIndexes.length === 0) {
                next[report.id] = activeDraftEraId;
                return next;
            }

            const firstIndex = activeIndexes[0];
            const lastIndex = activeIndexes[activeIndexes.length - 1];
            const hasGapInsideActiveEra = activeIndexes.length !== (lastIndex - firstIndex + 1);

            if (currentSlotId === activeDraftEraId) {
                if (draftEraSlots.length <= 1) {
                    toastMessage = 'Com uma Era so, os ciclos precisam ficar nela.';
                    return previous;
                }

                if (hasGapInsideActiveEra) {
                    for (let index = firstIndex; index <= lastIndex; index += 1) {
                        next[sortedReports[index].id] = activeDraftEraId;
                    }
                    return next;
                }

                if (reportIndex !== firstIndex && reportIndex !== lastIndex) {
                    toastMessage = 'Para manter a Era continua, so da para tirar ciclos pelas pontas.';
                    return previous;
                }

                const candidateIds = reportIndex === firstIndex
                    ? [
                        firstIndex > 0 ? assignments[firstIndex - 1] : null,
                        lastIndex < assignments.length - 1 ? assignments[lastIndex + 1] : null,
                        ...draftEraSlots.map((slot) => slot.id),
                    ]
                    : [
                        lastIndex < assignments.length - 1 ? assignments[lastIndex + 1] : null,
                        firstIndex > 0 ? assignments[firstIndex - 1] : null,
                        ...draftEraSlots.map((slot) => slot.id),
                    ];

                const reassignmentSlotId = candidateIds.find((slotId) => !!slotId && slotId !== activeDraftEraId);

                if (!reassignmentSlotId) {
                    toastMessage = 'Essa Era precisa continuar como um bloco.';
                    return previous;
                }

                next[report.id] = reassignmentSlotId;
                return next;
            }

            if (reportIndex < firstIndex) {
                for (let index = reportIndex; index <= firstIndex; index += 1) {
                    next[sortedReports[index].id] = activeDraftEraId;
                }
                return next;
            }

            if (reportIndex > lastIndex) {
                for (let index = lastIndex; index <= reportIndex; index += 1) {
                    next[sortedReports[index].id] = activeDraftEraId;
                }
                return next;
            }

            for (let index = firstIndex; index <= lastIndex; index += 1) {
                next[sortedReports[index].id] = activeDraftEraId;
            }
            next[report.id] = activeDraftEraId;
            return next;
        });

        if (toastMessage) {
            showToast(toastMessage);
        }
    };

    const handleConfirmEraEdit = async () => {
        const effectiveSlots = draftEraSlots.filter((slot) => sortedReports.some((report) => draftReportEraIds[report.id] === slot.id));
        if (effectiveSlots.length === 0) {
            handleResetEras();
            return;
        }

        const segments = buildDraftSegments(draftReportEraIds, effectiveSlots);
        const normalized = segments.slice(0, -1).map((segment) => segment.end + 1);
        setEraBreaks(normalized);
        setHasCustomEras(JSON.stringify(normalized) !== JSON.stringify(defaultEraBreaks));

        const nextMetadata: Record<string, EraMetadataEntry> = {};
        segments.forEach((segment, index) => {
            const slot = effectiveSlots.find((entry) => entry.id === segment.slotId);
            if (!slot) return;
            const segmentReports = sortedReports.slice(segment.start, segment.end + 1);
            const newestReport = segmentReports[0];
            const oldestReport = segmentReports[segmentReports.length - 1];
            const key = getEraSegmentKey(oldestReport, newestReport, index);
            const defaultLabel = getEraLabel(index);
            const defaultSkinId = getEraRibbonSkinId(index);
            const entry: EraMetadataEntry = {
                name: slot.name?.trim() && slot.name.trim() !== defaultLabel ?slot.name.trim() : undefined,
                skinId: slot.skinId !== defaultSkinId ?slot.skinId : undefined,
                description: slot.description,
                finalSummary: slot.finalSummary,
            };
            if (entry.name || entry.skinId || entry.description || entry.finalSummary) {
                nextMetadata[key] = entry;
            }
        });
        setEraMetadata(nextMetadata);
        setIsEditingEras(false);
        setDraftEraSlots([]);
        setDraftReportEraIds({});
        setActiveDraftEraId(null);
        setInlineEraEditor(null);

        const userId = getUserId();
        if (userId) {
            await supabase.from('era_boundaries').delete().eq('user_id', userId);
            const payload = normalized
                .map((boundary) => sortedReports[boundary - 1]?.id)
                .filter(Boolean)
                .map((afterReportId) => ({ user_id: userId, after_report_id: afterReportId }));
            if (payload.length > 0) {
                const { error } = await supabase.from('era_boundaries').insert(payload);
                if (error) console.error('Erro ao salvar Eras:', error.message);
            }
        }
        await persistAllEraMetadataRemote(nextMetadata);
    };

    const renderEraControls = () => {
        if (sortedReports.length === 0) return null;
        const activeDraftEraSlot = draftEraSlots.find((slot) => slot.id === activeDraftEraId) || draftEraSlots[0] || null;
        const primaryEraSummary = eraSummaries[0];
        const eraStatusLabel = primaryEraSummary && eraSummaries.length === 1
            ?`${primaryEraSummary.label} - ${primaryEraSummary.cycleCount} ciclos`
            : hasCustomEras
                ?`${effectiveEraCount} eras - manual`
                : `${effectiveEraCount} eras - automaticas`;

        if (!isEditingEras) {
            return (
                <div className="relative z-20 mt-3 rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500">Eras</p>
                            <p className="mt-1 text-xs font-semibold text-gray-300">{eraStatusLabel}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                            <button id="eras-button" onClick={beginEraEditing} className="rounded-xl luxe-button-secondary px-4 py-2.5 text-xs">ORGANIZAR</button>
                            {sortedReports.length > 0 && hasCustomEras && (
                                <button onClick={handleResetEras} className="rounded-xl luxe-button-secondary px-4 py-2.5 text-xs">RESTAURAR</button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="relative z-20 mt-3 rounded-[20px] border border-[var(--skin-accent-color)]/18 bg-[linear-gradient(180deg,_rgba(212,175,55,0.06),_rgba(255,255,255,0.02))] px-4 py-3 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--skin-accent-color)]">Organizar Eras</p>
                        <p className="mt-1 text-[11px] font-semibold text-gray-400">A barrinha dourada mostra a Era ativa. Ela so cresce ou encolhe pelas pontas.</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                        {draftEraSlots.length < Math.max(sortedReports.length, 1) && <button type="button" onClick={handleAddDraftEra} className="rounded-xl luxe-button-secondary px-3 py-2 text-[11px]">+ ERA</button>}
                        {draftEraSlots.length > 1 && <button type="button" onClick={handleRemoveActiveDraftEra} className="rounded-xl luxe-button-secondary px-3 py-2 text-[11px]">APAGAR ERA</button>}
                        <button type="button" onClick={handleCancelEraEdit} className="rounded-xl luxe-button-secondary px-3 py-2 text-[11px]">CANCELAR</button>
                        {hasCustomEras && <button type="button" onClick={handleResetEras} className="rounded-xl luxe-button-secondary px-3 py-2 text-[11px]">RESTAURAR</button>}
                        <button type="button" onClick={() => { void handleConfirmEraEdit(); }} className="rounded-xl luxe-skin-button px-3 py-2 text-[11px]">SALVAR</button>
                    </div>
                </div>

                {activeDraftEraSlot && (
                    <div className="rounded-[16px] border border-white/8 bg-black/18 px-3 py-2 text-[11px] text-gray-300">
                        <span className="font-black uppercase tracking-[0.18em] text-[var(--skin-accent-color)]">Era ativa:</span>{' '}
                        <span className="font-semibold text-white">{activeDraftEraSlot.name?.trim() || activeDraftEraSlot.defaultLabel}</span>
                    </div>
                )}

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {draftEraSelectionSummary.map(({ slot, count, newest, oldest }, index) => {
                        const active = activeDraftEraId === slot.id;
                        return (
                            <div key={slot.id} className="relative min-w-[160px] shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setActiveDraftEraId(slot.id)}
                                    className={`w-full rounded-[18px] border px-3 py-2.5 pr-10 text-left transition-all ${active ?'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/10 text-white shadow-[0_0_0_1px_rgba(212,175,55,0.16),0_16px_32px_rgba(0,0,0,0.22)]' : 'border-white/10 bg-black/20 text-gray-300'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getEraRibbonSkin(slot.skinId).edge }} />
                                        <span className="text-[11px] font-black uppercase tracking-[0.18em]">{slot.name?.trim() || slot.defaultLabel}</span>
                                    </div>
                                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-gray-500">{count} ciclos{count > 0 && newest && oldest ?` - ${formatDate(oldest)} a ${formatDate(newest)}` : ''}</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        openDraftEraInlineEditor(slot, index);
                                    }}
                                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/75 transition hover:border-[var(--skin-accent-color)]/45 hover:text-white"
                                    title="Editar nome e skin da Era"
                                >
                                    <EditIcon className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (view) {
            case 'scanning':
                // Show ReportGenerationModal only if animations enabled AND no error
                if (oraclePreferences?.animationsEnabled && !scanError) {
                    return (
                        <Suspense fallback={<div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in text-center mt-20"><p className="text-gray-400 font-mono animate-pulse uppercase tracking-[0.2em] text-[10px]">Gerando Relatorio...</p></div>}>
                            <ReportGenerationModal
                                onFinish={() => {
                                    finalizeReportGeneration();
                                }}
                            />
                        </Suspense>
                    );
                }

                // Legacy/Error View
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        {scanError ?(
                            <>
                                <p className="text-sm text-gray-300 text-center max-w-[260px]">{scanError}</p>
                                <div className="mt-4 w-full space-y-2">
                                    <button onClick={() => { setScanError(null); setScanAttempt(prev => prev + 1); }} className="w-full py-2 rounded-xl luxe-skin-button text-xs">TENTAR NOVAMENTE</button>
                                    <button onClick={() => { setScanError(null); setView('hub'); }} className="w-full py-2 rounded-xl luxe-button-secondary text-xs">VOLTAR</button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in text-center mt-20">
                                <p className="text-gray-400 font-mono animate-pulse uppercase tracking-[0.2em] text-[10px]">Gerando Relatório...</p>
                            </div>
                        )}
                    </div>
                );
            case 'hub': {
                const items: Array<
                    | { type: 'report'; report: Report; reportIndex: number; seasonName?: string }
                > = [];
                const reportRowIndexMap = new Map<number, number>();

                sortedReports.forEach((report, index) => {
                    const season = getSeasonById(report.seasonId) || getSeasonByDate(report.endDate);
                    items.push({ type: 'report', report, reportIndex: index, seasonName: season?.name });
                    reportRowIndexMap.set(index, items.length - 1);
                });

                return (
                    <div className="pb-12">
                        {reportForComparison && (
                            <div className="p-3 bg-blue-900/30 rounded-lg text-center text-sm mb-6">Selecione um relatório para comparar com o ciclo de {formatDate(reportForComparison.startDate)}.</div>
                        )}

                        {activeCycle && (
                            <GlassCard variant="neutral" className="mb-4 px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--skin-accent-color)]">Ciclo atual</p>
                                    </div>
                                </div>
                                <div
                                    className={`mt-3 ${isEditingHistoryCycles ? 'cursor-pointer' : ''}`}
                                    onClick={() => {
                                        if (isEditingHistoryCycles) {
                                            setCycleBeingEdited(activeCycle);
                                        }
                                    }}
                                >
                                    <SimplifiedCycleHUD cycle={activeCycle} onEdit={setCycleBeingEdited} showTimelineMarker={false} showControls={false} />
                                </div>
                                <div className="mt-3">
                                    <button id="end-cycle-button" onClick={handleEndCycle} className="w-full py-3 rounded-xl luxe-skin-button shadow-lg shadow-[var(--skin-accent-color)]/20">ENCERRAR CICLO ATUAL</button>
                                </div>
                            </GlassCard>
                        )}

                        {renderLegacySummary()}

                        {!activeCycle ? (
                            <div className="relative z-20 space-y-2">
                                <button id="start-new-cycle-button" onClick={() => setShowNewCycleSetup(true)} className="w-full py-3 rounded-xl luxe-skin-button mb-4 shadow-lg shadow-[var(--skin-accent-color)]/20">INICIAR NOVO CICLO</button>
                                {reports.length < 1 && <div className="text-center text-sm text-gray-500 py-4 italic">Sem legado fechado ainda. Inicie sua jornada.</div>}
                            </div>
                        ) : null}

                        {renderEraControls()}

                        {isEditingEras ? (
                            <div className="mt-4 space-y-3">
                                {sortedReports.map((report, reportIndex) => {
                                    const assignedEra = draftEraByReportIndex.get(reportIndex);
                                    const isAssignedToActiveEra = assignedEra?.id === activeDraftEraId;
                                    const season = getSeasonById(report.seasonId) || getSeasonByDate(report.endDate);

                                    return (
                                        <div
                                            key={`era-edit-${report.id}`}
                                            className={`flex flex-col items-center gap-2 transition-transform ${isAssignedToActiveEra ?'scale-[1.01]' : 'opacity-90'}`}
                                        >
                                            <TimelineCard
                                                report={report}
                                                isLatest={reportIndex === 0}
                                                onClick={() => handleAssignReportToDraftEra(reportIndex)}
                                                seasonName={season?.name}
                                                isEditing
                                                eraLabel={assignedEra ?(assignedEra.name?.trim() || assignedEra.defaultLabel) : undefined}
                                                eraSkinId={assignedEra?.skinId}
                                                isSelectedForEraEdit={isAssignedToActiveEra}
                                                showTimelineMarker={false}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : sortedReports.length > 0 && (
                            <div className="relative mt-6">
                                <div className={`grid ${displayedEraBands.length > 1 || isEditingEras ? 'grid-cols-[16px_minmax(0,1fr)_18px]' : 'grid-cols-[16px_minmax(0,1fr)]'} gap-x-1`}>
                                    {items.map((item, rowIndex) => {
                                        if (item.type === 'report') {
                                            const eraDisplay = displayedEraByReportIndex.get(item.reportIndex);
                                            return (
                                                <React.Fragment key={item.report.id}>
                                                    <div className="relative py-3"></div>
                                                    <div className="relative py-3">
                                                        <div className="absolute left-[6px] top-0 bottom-0 w-px bg-white/10"></div>
                                                        <TimelineCard
                                                            report={item.report}
                                                            isLatest={item.reportIndex === 0}
                                                            onClick={() => {
                                                                if (isEditingEras) {
                                                                    handleAssignReportToDraftEra(item.reportIndex);
                                                                    return;
                                                                }
                                                                if (isEditingHistoryCycles) {
                                                                    setHistoricalCycleBeingEdited(item.report);
                                                                    return;
                                                                }
                                                                handleViewReport(item.report);
                                                            }}
                                                            seasonName={item.seasonName}
                                                            isEditing={isEditingEras}
                                                            eraLabel={eraDisplay?.label}
                                                            eraSkinId={eraDisplay?.skinId}
                                                            isSelectedForEraEdit={!!eraDisplay?.isActive}
                                                            onDelete={isEditingHistoryCycles && !isEditingEras ? async () => {
                                                                const confirmed = window.confirm(`Excluir o ciclo "${item.report.cycleName || 'Ciclo'}"? Isso tambem remove o relatorio dele.`);
                                                                if (!confirmed) return;
                                                                await deleteCycle(item.report.cycleId || item.report.id);
                                                            } : undefined}
                                                        />
                                                    </div>
                                                    {(displayedEraBands.length > 1 || isEditingEras) && <div className="relative py-3"></div>}
                                                </React.Fragment>
                                            );
                                        }

                                        return null;
                                    })}
                                    {(displayedEraBands.length > 1 || isEditingEras) && displayedEraBands.map((band) => {
                                        const rowStart = reportRowIndexMap.get(band.start);
                                        const rowEnd = reportRowIndexMap.get(band.end);
                                        if (rowStart == null || rowEnd == null) return null;

                                        return (
                                            <div
                                                key={`era-${band.key}-${band.start}-${band.end}`}
                                                className="col-start-3 flex justify-center"
                                                style={{ gridRow: `${rowStart + 1} / ${rowEnd + 2}`, marginTop: band.eraIndex === 0 ?0 : 8, marginBottom: band.eraIndex === displayedEraBands.length - 1 ?0 : 8 }}
                                            >
                                                <div className="relative h-full">
                                                    <button
                                                        id={`era-ribbon-button-${band.eraIndex}`}
                                                        type="button"
                                                        onClick={() => {
                                                            if (isEditingEras && 'slot' in band) {
                                                                setActiveDraftEraId(band.slot.id);
                                                                return;
                                                            }
                                                        }}
                                                        disabled={!isEditingEras || !('slot' in band)}
                                                        title={isEditingEras ?'Selecionar Era' : band.label}
                                                        className={`h-full rounded-sm transition-all ${isEditingEras && band.isActive ?'scale-[1.03]' : ''} ${isEditingEras && 'slot' in band ?'cursor-pointer' : 'cursor-default'}`}
                                                    >
                                                        <EraRibbon
                                                            label={band.label}
                                                            skinId={band.skinId}
                                                            className={`w-5 ${band.isActive ?'shadow-[0_0_0_1px_rgba(212,175,55,0.55),0_0_24px_rgba(212,175,55,0.16)]' : ''}`}
                                                        />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if ('slot' in band) {
                                                                openDraftEraInlineEditor(band.slot, band.eraIndex);
                                                                setActiveDraftEraId(band.slot.id);
                                                                return;
                                                            }
                                                            if ('summary' in band) {
                                                                openSavedEraInlineEditor(band.summary, band.eraIndex);
                                                            }
                                                        }}
                                                        title="Editar nome e skin da Era"
                                                        className="absolute -right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-black/75 text-[10px] text-white/80 shadow-[0_8px_18px_rgba(0,0,0,0.35)] transition hover:border-[var(--skin-accent-color)]/45 hover:text-white"
                                                    >
                                                        <EditIcon className="h-3 w-3" />
                                                    </button>
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
                return selectedReport ?(
                    <ReportResultCarousel
                        report={selectedReport}
                        onOk={isPostCycleFlow ?() => { void handlePostCycleResultsOk(); } : handleCloseDynamic}
                        onCompare={() => { setReportForComparison(selectedReport); setView('hub'); }}
                        onShare={() => handleShareReport(selectedReport)}
                        onPostToFeed={() => handlePostToFeed(selectedReport)}
                        onDelete={async () => {
                            if (confirm("Tem certeza que deseja excluir este relat\u00F3rio?")) {
                                await deleteCycle(selectedReport.cycleId || selectedReport.id);
                                setView('hub');
                                setSelectedReport(null);
                            }
                        }}
                        onStartNewCycle={handleStartNewCycleFromResults}
                        chest={isPostCycleFlow ?earnedChest : null}
                        expGained={isPostCycleFlow ?expGained : undefined}
                        insignias={isPostCycleFlow ?grantedInsignias : []}
                        onOpenChest={isPostCycleFlow && earnedChest ?() => { void handleOpenPostCycleChest(); } : undefined}
                        chestOpened={postCycleChestOpened}
                        isOpeningChest={isOpeningPostCycleChest}
                    />
                ) : <p>Erro ao carregar relat\u00F3rio.</p>;
            case 'comparing':
                return reportsToCompare ?(
                    <CycleComparator
                        currentCycleReport={reportsToCompare[0]}
                        pastCycleReport={reportsToCompare[1]}
                    />
                ) : <p>Erro ao carregar compara\u00E7\u00E3o.</p>;
        }
    };

    const getTitle = () => {
        switch (view) {
            case 'results': return 'Resultados';
            case 'comparing': return 'An\u00E1lise Comparativa';
            case 'reward':
                return 'Fim do Ciclo';
            default: return 'Hist\u00F3rico';
        }
    }

    if (showNewCycleSetup) {
        return (
            <>
                <button
                    type="button"
                    aria-label="Fechar historico"
                    onClick={handleForceClose}
                    onPointerUp={handleForceClose}
                    onTouchEnd={handleForceClose}
                    onMouseUp={handleForceClose}
                    className="fixed right-4 top-[calc(var(--safe-area-top)+12px)] z-[10005] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/90 shadow-[0_10px_28px_rgba(0,0,0,0.34)] transition-colors hover:bg-white/10 hover:text-white"
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                    <XIcon />
                </button>
                <NewCycleSetupView onComplete={onClose} onCancel={() => { setShowNewCycleSetup(false); setView('hub'); }} />
            </>
        );
    }

    return (
        <>
            <button
                type="button"
                aria-label="Fechar historico"
                onClick={handleForceClose}
                onPointerUp={handleForceClose}
                onTouchEnd={handleForceClose}
                onMouseUp={handleForceClose}
                className="fixed right-4 top-[calc(var(--safe-area-top)+12px)] z-[10005] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/90 shadow-[0_10px_28px_rgba(0,0,0,0.34)] transition-colors hover:bg-white/10 hover:text-white"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
                <XIcon />
            </button>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 animate-fade-in" onClick={handleCloseDynamic}>
                <div className="w-full max-w-[420px] mx-auto h-full p-4 flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="relative z-10 flex-shrink-0 flex justify-between items-center text-white pb-4">
                        <div className="flex items-center space-x-2">
                            {(view === 'results' || view === 'comparing') && (
                                <button id="reports-view-back-button" onClick={handleCloseDynamic} className="p-2 -ml-2"><ChevronLeftIcon /></button>
                            )}
                            <h1 className="text-xl font-black uppercase tracking-widest">{getTitle()}</h1>
                        </div>
                        {view === 'hub' && (activeCycle || sortedReports.length > 0) && (
                            <button
                                type="button"
                                onClick={toggleHistoryCycleEditing}
                                className={`inline-flex h-9 min-w-[3.25rem] items-center justify-center rounded-xl border px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                    isEditingHistoryCycles
                                        ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/12 text-white'
                                        : 'border-white/10 bg-black/35 text-white/80 hover:bg-white/10 hover:text-white'
                                }`}
                                title={isEditingHistoryCycles ? 'Finalizar edicao de ciclos' : 'Editar ciclos'}
                            >
                                {isEditingHistoryCycles ? 'OK' : <EditIcon className="h-4 w-4" />}
                            </button>
                        )}
                    </div>
                    <div className="flex-grow overflow-y-auto relative overflow-hidden">
                        {renderContent()}
                    </div>
                </div>
            </div>
            {inlineEraEditor && (
                <Portal>
                    <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/72 backdrop-blur-sm p-4" onClick={() => setInlineEraEditor(null)}>
                        <GlassCard variant="neutral" className="w-full max-w-sm p-4 space-y-4" onClick={(event) => event.stopPropagation()}>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500">Era</p>
                                <h2 className="mt-2 text-lg font-black uppercase text-white">{inlineEraEditor.defaultLabel}</h2>
                                <p className="mt-1 text-sm text-gray-400">Ajuste o nome e a skin da Era.</p>
                            </div>
                            <div className="rounded-[18px] border border-white/10 bg-black/20 p-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Nome</label>
                                <input
                                    value={inlineEraName}
                                    onChange={(event) => setInlineEraName(event.target.value.slice(0, 48))}
                                    placeholder={inlineEraEditor.defaultLabel}
                                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none transition-colors focus:border-[var(--skin-accent-color)]"
                                />
                                <div className="mt-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Skin</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {ERA_RIBBON_SKINS.map((skin) => {
                                            const locked = skin.isPremium && !userProfile.isPremium;
                                            const active = inlineEraSkinId === skin.id;
                                            return (
                                                <button
                                                    key={skin.id}
                                                    type="button"
                                                    disabled={locked}
                                                    onClick={() => setInlineEraSkinId(skin.id)}
                                                    className={`flex h-9 w-9 items-center justify-center rounded-full border ${active ?'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/10' : 'border-white/10 bg-black/25'} ${locked ?'cursor-not-allowed opacity-40' : ''}`}
                                                    title={locked ?'Disponivel no premium' : skin.name}
                                                >
                                                    <span className="inline-flex h-4 w-4 rounded-full" style={{ backgroundColor: skin.edge }} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setInlineEraEditor(null)} className="flex-1 rounded-xl luxe-button-secondary px-3 py-3 text-xs">Cancelar</button>
                                <button type="button" onClick={() => { void handleSaveInlineEraEditor(); }} className="flex-1 rounded-xl luxe-skin-button px-3 py-3 text-xs">Salvar</button>
                            </div>
                        </GlassCard>
                    </div>
                </Portal>
            )}
            {showLegacyProjectionModal && (
                <LegacyProjectionModal
                    eras={eraSummaries}
                    sovereignName={sovereignName}
                    onToast={showToast}
                    onClose={() => setShowLegacyProjectionModal(false)}
                    isPremium={!!userProfile.isPremium}
                    onOpenCycle={handleOpenLegacyCycle}
                    onOpenEra={(era) => {
                        setShowLegacyProjectionModal(false);
                        const eraIndex = Math.max(eraSummaries.findIndex((summary) => summary.key === era.key), 0);
                        openSavedEraInlineEditor(era, eraIndex);
                    }}
                    onOpenPlaque={() => {
                        setShowLegacyProjectionModal(false);
                        setLegacyShareUnlocked(true);
                        handleOpenLegacyPlaque();
                    }}
                />
            )}
            {showLegacyPlaqueForgeModal && (
                <LegacyPlaqueForgeModal
                    eras={eraSummaries}
                    sovereignName={sovereignName}
                    onComplete={handleLegacyPlaqueForged}
                    onClose={() => setShowLegacyPlaqueForgeModal(false)}
                />
            )}
            {showLegacyPlaqueModal && (
                <LegacyPlaqueModal
                    eras={eraSummaries}
                    sovereignName={sovereignName}
                    plaqueForged={legacyPlaqueForged}
                    shareUnlocked={legacyShareUnlocked}
                    onToast={showToast}
                    onClose={() => setShowLegacyPlaqueModal(false)}
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
            {cycleBeingEdited && (
                <EditCycleEndDateModal
                    cycle={cycleBeingEdited}
                    onClose={() => setCycleBeingEdited(null)}
                    onSave={async (updates) => {
                        await updateCycle(cycleBeingEdited.id, updates);
                    }}
                    onDelete={async () => {
                        await deleteCycle(cycleBeingEdited.id);
                    }}
                />
            )}
            {historicalCycleBeingEdited && (
                <EditHistoricalCycleModal
                    report={historicalCycleBeingEdited}
                    onClose={() => setHistoricalCycleBeingEdited(null)}
                    onSave={async (name) => {
                        await updateCycle(historicalCycleBeingEdited.cycleId || historicalCycleBeingEdited.id, { name });
                    }}
                    onDelete={async () => {
                        await deleteCycle(historicalCycleBeingEdited.cycleId || historicalCycleBeingEdited.id);
                    }}
                />
            )}
            {showConfirmEndCycle && (
                <ConfirmationModal
                    title="Encerrar Ciclo?"
                    message="Ao fechar este ciclo, suas ações não concluídas no grid serão movidas para o estoque de ações e suas arenas serão revisadas."
                    onConfirm={confirmEndCycle}
                    onCancel={() => setShowConfirmEndCycle(false)}
                />
            )}
            <RewardPackModal
                open={!!reportRewardPayload}
                payload={reportRewardPayload}
                onClose={() => setReportRewardPayload(null)}
            />
        </>
    );
};
