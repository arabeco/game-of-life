import React, { useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useGame } from '../contexts/GameContext';
import { Arena, Campaign, ChestType, Report, ReportAtlasWeek, ReportIdentitySnapshot, SeasonMission } from '../types';
import { GlassCard } from './GlassCard';
import { ChestOpeningModal } from './ChestOpeningModal';
import { ReportGenerationModal } from './ReportGenerationModal';
import { MissionCompletionModal } from './MissionCompletionModal';
import { ReportResultCarousel } from './ReportResultCarousel';
import { MetalReportCard } from './MetalReportCard';
import { LegacyProjectionModal } from './LegacyProjectionModal';
import { CampaignsCodex } from './CampaignsCodex';
import { CampaignArenaStack } from './CampaignArenaStack';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { getScoreGrade } from '../utils/dateUtils';
import { useSensoryFeedback } from '../hooks/useSensoryFeedback';

const buildMockAtlasWeeks = (seed: number, accentAction: string): ReportAtlasWeek[] => {
    const baseDate = new Date(Date.UTC(2026, 0, 6 + seed * 7));
    return Array.from({ length: 2 }).map((_, weekIndex) => {
        const weekStart = new Date(baseDate);
        weekStart.setUTCDate(baseDate.getUTCDate() + weekIndex * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
        return {
            weekIndex,
            startDate: weekStart.toISOString().slice(0, 10),
            endDate: weekEnd.toISOString().slice(0, 10),
            plannedCount: 8,
            completedCount: 6,
            plannedMinutes: 480,
            completedMinutes: 360,
            dominantArenaId: `arena-${seed}`,
            dominantArenaName: accentAction,
            days: Array.from({ length: 7 }).map((__, dayIndex) => {
                const dayDate = new Date(weekStart);
                dayDate.setUTCDate(weekStart.getUTCDate() + dayIndex);
                return {
                    date: dayDate.toISOString().slice(0, 10),
                    plannedCount: dayIndex % 2 === 0 ? 2 : 1,
                    completedCount: dayIndex % 3 === 0 ? 2 : 1,
                    plannedMinutes: dayIndex % 2 === 0 ? 120 : 60,
                    completedMinutes: dayIndex % 3 === 0 ? 120 : 45,
                    arenaBuckets: [
                        {
                            arenaId: `arena-${seed}`,
                            arenaName: accentAction,
                            total: dayIndex % 2 === 0 ? 2 : 1,
                            completed: dayIndex % 3 === 0 ? 2 : 1,
                        },
                    ],
                    scheduledItems: [
                        {
                            taskId: `task-${seed}-${weekIndex}-${dayIndex}`,
                            actionId: `action-${seed}`,
                            actionName: accentAction,
                            actionIcon: dayIndex % 2 === 0 ? '??' : '??',
                            arenaId: `arena-${seed}`,
                            arenaName: accentAction,
                            startTime: 8 * 60 + dayIndex * 20,
                            duration: dayIndex % 2 === 0 ? 90 : 45,
                            completed: dayIndex % 3 !== 1,
                            actionType: dayIndex % 2 === 0 ? 'Compromisso' : 'Marco',
                        },
                    ],
                    unscheduledItems: dayIndex % 3 === 0 ? [] : [
                        {
                            taskId: `task-unscheduled-${seed}-${weekIndex}-${dayIndex}`,
                            actionId: `action-unscheduled-${seed}`,
                            actionName: `Reserva ${accentAction}`,
                            actionIcon: '?',
                            arenaId: `arena-${seed}`,
                            arenaName: accentAction,
                            startTime: -1,
                            duration: 30,
                            completed: false,
                            actionType: 'A\u00e7\u00e3o Recorrente',
                        },
                    ],
                };
            }),
        };
    });
};

export const DebugRewardControls: React.FC = () => {
    const { userProfile, updateUserProfile, showToast, setAchievementUnlocked, getArenas } = useGame();
    const { trigger } = useSensoryFeedback();
    const [loading, setLoading] = useState(false);
    const [showChestModal, setShowChestModal] = useState<ChestType | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReportResult, setShowReportResult] = useState<Report | null>(null);
    const [testMission, setTestMission] = useState<SeasonMission | null>(null);
    const [showLegacyPreview, setShowLegacyPreview] = useState(false);
    const [showCampaignPreview, setShowCampaignPreview] = useState(false);
    const mockCampaignArenas: Arena[] = useMemo(() => getArenas().slice(0, 2), [getArenas]);
    const mockCampaign: Campaign | null = useMemo(() => {
        if (mockCampaignArenas.length < 2) return null;

        return {
            id: '__gm_reward_panel_campaign__',
            userId: 'gm-board',
            title: 'Campanha Mock de UI',
            description: 'Preview visual com 2 arenas para validar miniatura e tela interna na aba Ver Arenas.',
            status: 'active',
            createdAt: new Date().toISOString(),
            arenaIds: mockCampaignArenas.map(arena => arena.id),
            arenaConfig: {
                [mockCampaignArenas[0].id]: { isLocked: false, isHidden: false },
                [mockCampaignArenas[1].id]: {
                    isLocked: false,
                    isHidden: false,
                    prerequisiteArenaIds: [mockCampaignArenas[0].id],
                },
            },
            priority: 'media',
            type: 'parallel',
            order: -1,
            priorityOrder: -1,
        };
    }, [mockCampaignArenas]);

    const mockReport: Report = {
        id: 'debug-report',
        cycleId: 'debug-cycle',
        seasonId: 'season-debug',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        expGained: 1100,
        metrics: {
            totalHours: 42,
            arenasInvolved: 5,
            actionsCompleted: 150,
            totalPlannedActions: 180,
            goalsMet: 3,
            plannedMetas: 4,
            sealedMetas: 3,
            questsCompleted: 2,
            expGained: 1100,
            consistencyDays: 6,
            avgHoursPerDay: 6,
            maxStreak: 5,
            bestDay: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            bestDayCount: 28,
            top3Actions: [
                { name: 'Codar', count: 50 },
                { name: 'Treinar', count: 30 },
                { name: 'Ler', count: 20 }
            ],
            scoreModelVersion: 'fair_v2_1',
            fairness: {
                planLoadUnits: 30,
                honoredLoadUnits: 24,
                planHonorRate: 0.8,
                plannedMetas: 4,
                sealedMetas: 3,
                metaSealRate: 0.75,
                baselineLoadUnits: 22,
                baselineActiveDays: 6,
                activeDays: 6,
                personalCadenceRate: 1,
                planLoadRatio: 1.36,
                planRealismPts: 3,
                selfGrowthRate: 1.09,
                ascensionPts: 4,
                frictionRate: 0.2,
                focusRatio: 0.42,
                measurementStatus: 'scored',
                historyConfidence: 'stable',
                scoreBreakdown: {
                    honorPts: 32,
                    metaPts: 23,
                    cadencePts: 15,
                    realismPts: 3,
                    ascensionPts: 4,
                },
                legacyPerformanceScore: 95,
                grade: 'A',
            },
            scoreBreakdown: {
                progressPts: 33,
                milestonePts: 15,
                questPts: 10,
                consistencyPts: 17,
                volumePts: 20,
                premiumBonusPts: 100,
            },
        },
        highlight: {
            mostFocusedArena: 'Arena de Teste',
            mostRepeatedAction: 'Codar',
            mostRepeatedActionCount: 50
        },
        assetProgress: [
            { asset: 'Fisico', value: 80 },
            { asset: 'Mental', value: 90 },
            { asset: 'Social', value: 60 },
            { asset: 'Espiritual', value: 70 },
            { asset: 'Financeiro', value: 85 }
        ],
        performanceScore: 95,
        clanPoints: 50
    };

    const mockFallbackIdentity: ReportIdentitySnapshot = useMemo(() => ({
        avatarUrl: userProfile.avatarUrl,
        nickname: userProfile.nickname || 'Soberano Demo',
        title: userProfile.title,
        level: Math.max(userProfile.level || 1, 12),
        nobilityRankId: userProfile.nobility?.rankId,
        nobilityRankName: 'Vagante',
        clanName: userProfile.clanName || 'Cla Atlas',
        clanIcon: userProfile.clanIcon || '???',
        clanRankName: 'Feudo',
        capturedAt: new Date().toISOString(),
    }), [userProfile.avatarUrl, userProfile.clanIcon, userProfile.clanName, userProfile.level, userProfile.nickname, userProfile.nobility, userProfile.title]);

    const mockLegacyEras: LegacyEraSummary[] = useMemo(() => ([
        {
            key: 'gm-era-1',
            label: 'Fundacao',
            defaultLabel: 'ERA I',
            skinId: 'foundry',
            startDate: '2026-01-06',
            endDate: '2026-02-02',
            avgScore: 78,
            totalHours: 31,
            totalMetas: 5,
            cycleCount: 2,
            dominantArena: 'Alicerce',
            topActions: [{ name: 'Planejar', count: 8 }, { name: 'Codar', count: 6 }, { name: 'Treinar', count: 4 }],
            bestStreak: 5,
            grade: 'A',
            color: '#f59e0b',
            description: 'Primeira fase de organizacao do sistema e das rotinas-base.',
            finalSummary: 'A base foi erguida e a rotina deixou de depender de impulso.',
            aiSummary: 'Fase de fundacao, consistencia e estrutura.',
            cycles: [
                {
                    id: 'gm-cycle-1',
                    name: 'Ciclo de Fundacao',
                    startDate: '2026-01-06',
                    endDate: '2026-01-19',
                    score: 74,
                    grade: 'B',
                    focusArena: 'Alicerce',
                    signatureAction: 'Planejar',
                    sealedMetas: 2,
                    weeklyAtlas: buildMockAtlasWeeks(1, 'Alicerce'),
                    identitySnapshot: { ...mockFallbackIdentity, level: 7, nobilityRankName: 'Vagante', clanName: 'Sem cla', clanIcon: null, capturedAt: '2026-01-19T23:59:59.000Z' },
                },
                {
                    id: 'gm-cycle-2',
                    name: 'Ciclo de Ritual Diario',
                    startDate: '2026-01-20',
                    endDate: '2026-02-02',
                    score: 82,
                    grade: 'B',
                    focusArena: 'Protocolo',
                    signatureAction: 'Codar',
                    sealedMetas: 3,
                    weeklyAtlas: buildMockAtlasWeeks(2, 'Protocolo'),
                    identitySnapshot: { ...mockFallbackIdentity, level: 9, nobilityRankName: 'Escudeiro', clanName: 'Cla Atlas', clanIcon: '???', capturedAt: '2026-02-02T23:59:59.000Z' },
                },
            ],
        },
        {
            key: 'gm-era-2',
            label: 'Cerco',
            defaultLabel: 'ERA II',
            skinId: 'royal-gold',
            startDate: '2026-02-03',
            endDate: '2026-03-02',
            avgScore: 88,
            totalHours: 46,
            totalMetas: 7,
            cycleCount: 2,
            dominantArena: 'Dominio',
            topActions: [{ name: 'Publicar', count: 9 }, { name: 'Mentorar', count: 5 }, { name: 'Fechar loop', count: 5 }],
            bestStreak: 7,
            grade: 'S',
            color: '#eab308',
            description: 'Fase de expansao, pressao externa e consolidacao do uso diario.',
            finalSummary: 'A ofensiva elevou o ritmo e trouxe peso historico ao progresso.',
            aiSummary: 'Fase de expansao, consistencia alta e ganho de autoridade.',
            cycles: [
                {
                    id: 'gm-cycle-3',
                    name: 'Ciclo de Cerco Externo',
                    startDate: '2026-02-03',
                    endDate: '2026-02-16',
                    score: 86,
                    grade: 'A',
                    focusArena: 'Dominio',
                    signatureAction: 'Publicar',
                    sealedMetas: 3,
                    weeklyAtlas: buildMockAtlasWeeks(3, 'Dominio'),
                    identitySnapshot: { ...mockFallbackIdentity, level: 12, nobilityRankName: 'Cavaleiro', clanName: 'Cla Atlas', clanIcon: '???', capturedAt: '2026-02-16T23:59:59.000Z' },
                },
                {
                    id: 'gm-cycle-4',
                    name: 'Ciclo de Fecho Tatico',
                    startDate: '2026-02-17',
                    endDate: '2026-03-02',
                    score: 91,
                    grade: 'A',
                    focusArena: 'Tesouro',
                    signatureAction: 'Fechar loop',
                    sealedMetas: 4,
                    weeklyAtlas: buildMockAtlasWeeks(4, 'Tesouro'),
                    identitySnapshot: { ...mockFallbackIdentity, level: 14, nobilityRankName: 'Barao', clanName: 'Cla Atlas', clanIcon: '???', capturedAt: '2026-03-02T23:59:59.000Z' },
                },
            ],
        },
        {
            key: 'gm-era-3',
            label: 'Ascensao',
            defaultLabel: 'ERA III',
            skinId: 'verdigris-relic',
            startDate: '2026-03-03',
            endDate: '2026-03-28',
            avgScore: 93,
            totalHours: 52,
            cycleCount: 2,
            dominantArena: 'Legado',
            topActions: [{ name: 'Gravar legado', count: 7 }, { name: 'Ensinar', count: 5 }, { name: 'Refinar ciclo', count: 4 }],
            bestStreak: 8,
            grade: 'SS',
            color: '#34d399',
            description: 'Fase de consolidacao historica e leitura de identidade.',
            finalSummary: 'A soberania deixou de ser rotina e virou memoria estrategica.',
            aiSummary: 'Fase de maturacao e leitura historica do proprio sistema.',
            cycles: [
                {
                    id: 'gm-cycle-5',
                    name: 'Ciclo de Memoria',
                    startDate: '2026-03-03',
                    endDate: '2026-03-14',
                    score: 92,
                    focusArena: 'Legado',
                    signatureAction: 'Gravar legado',
                    weeklyAtlas: buildMockAtlasWeeks(5, 'Legado'),
                    identitySnapshot: { ...mockFallbackIdentity, level: 17, nobilityRankName: 'Visconde', clanName: 'Cla Atlas', clanIcon: '???', capturedAt: '2026-03-14T23:59:59.000Z' },
                },
                {
                    id: 'gm-cycle-6',
                    name: 'Ciclo de Projecao',
                    startDate: '2026-03-15',
                    endDate: '2026-03-28',
                    score: 95,
                    focusArena: 'Soberania',
                    signatureAction: 'Ensinar',
                    weeklyAtlas: buildMockAtlasWeeks(6, 'Soberania'),
                    identitySnapshot: { ...mockFallbackIdentity, level: 20, nobilityRankName: 'Conde', clanName: 'Cla Atlas', clanIcon: '???', capturedAt: '2026-03-28T23:59:59.000Z' },
                },
            ],
        },
    ]), [mockFallbackIdentity]);

    const rankPreviewScores = [
        { score: 100, title: 'Ascensao Total', actions: '24/24', hours: '48h', metas: '4/4', presence: '12 dias' },
        { score: 90, title: 'Ciclo Ouro', actions: '21/24', hours: '39h', metas: '4/4', presence: '10 dias' },
        { score: 76, title: 'Ciclo Prata', actions: '15/20', hours: '27h', metas: '3/4', presence: '8 dias' },
        { score: 60, title: 'Ciclo Bronze', actions: '10/18', hours: '16h', metas: '2/4', presence: '6 dias' },
        { score: 38, title: 'Ferro Velho', actions: '4/16', hours: '6h', metas: '0/3', presence: '2 dias' },
    ].map((preview) => ({
        ...preview,
        grade: getScoreGrade(preview.score),
    }));

    const addChests = async () => {
        setLoading(true);
        try {
            const types: ChestType[] = ['Comum', 'Incomum', 'Raro', '\u00c9pico', 'Lend\u00e1rio', 'Ciclo'];
            const newChests = [];
            for (const type of types) {
                for (let i = 0; i < 5; i++) {
                    newChests.push({ user_id: userProfile.id, chest_type: type, is_opened: false, earned_at: new Date().toISOString() });
                }
            }

            const { error: insertError } = await supabase.from('user_chests').insert(newChests);
            if (insertError) console.warn('Could not insert into user_chests:', insertError);

            const currentChests = userProfile.chests ? [...userProfile.chests] : [];
            types.forEach(type => {
                const existing = currentChests.find(c => c.type === type);
                if (existing) existing.count += 5;
                else currentChests.push({ type, count: 5 });
            });

            await updateUserProfile({ chests: currentChests });
            const { error: profileError } = await supabase.from('user_profiles').update({ chests: currentChests }).eq('id', userProfile.id);
            if (profileError) throw profileError;

            showToast('5 baus de cada tipo adicionados com sucesso.');
        } catch (error: any) {
            console.error(error);
            showToast(`Erro ao adicionar baus: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const addInsignias = async () => {
        setLoading(true);
        try {
            const insignias = ['insignia_rank_5_barao', 'insignia_quest_incomum', 'insignia_report_comum'];
            const newItems = insignias.map(id => ({ user_id: userProfile.id, item_id: id, acquired_at: new Date().toISOString() }));
            const { error: insertError } = await supabase.from('user_inventory').insert(newItems);
            if (insertError) throw insertError;

            const newUnlocked = { ...userProfile.unlockedItems };
            if (!newUnlocked.insignias) newUnlocked.insignias = {};
            insignias.forEach(id => { newUnlocked.insignias[id] = true; });

            const currentInventory = userProfile.inventory || [];
            const newInventoryItems = insignias.map(id => ({ id, instanceId: crypto.randomUUID(), acquiredAt: new Date().toISOString(), isEquipped: false }));

            await updateUserProfile({ unlockedItems: newUnlocked, inventory: [...currentInventory, ...newInventoryItems] });
            const { error: profileError } = await supabase.from('user_profiles').update({ unlocked_items: newUnlocked }).eq('id', userProfile.id);
            if (profileError) throw profileError;

            showToast('1 insignia de cada tipo adicionada com sucesso.');
        } catch (error: any) {
            console.error(error);
            showToast(`Erro ao adicionar insignias: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestMission = () => {
        setTestMission({
            id: 'test-mission-01',
            season_id: 'season-debug',
            title: 'Missao de Teste',
            description: 'Conclua uma tarefa para ganhar XP e insignia.',
            goal_type: 'actions_completed',
            goal_value: 1,
            reward_type: 'item_id',
            reward_value: 'insignia_quest_incomum',
            type: 'individual',
            icon: '??'
        });
    };

    const handleTestLevelUp = () => {
        setAchievementUnlocked({
            type: 'PLAYER_RANK_UP',
            data: {
                name: 'Soberano Nivel 5',
                icon: '??',
                rewards: {
                    exp: 1000,
                    chest: 'Lendario',
                    items: ['insignia_rank_5_barao']
                }
            }
        });
    };

    return (
        <GlassCard className="mt-4 space-y-4 border-yellow-500/30 p-4">
            <h3 className="flex items-center gap-2 font-bold text-yellow-400">
                <span>??</span>
                Painel de Teste de Recompensas (GM)
            </h3>

            <div className="grid grid-cols-2 gap-2">
                <button onClick={addChests} disabled={loading} className="flex flex-col items-center justify-center gap-1 rounded-lg border border-yellow-500/20 bg-yellow-600/20 p-3 text-xs font-bold text-yellow-200 transition-all hover:border-yellow-500/50 hover:bg-yellow-600/40">
                    <span>?? +5 Baus de Cada</span>
                    <span className="text-[10px] opacity-70">(Adiciona ao inventario)</span>
                </button>

                <button onClick={addInsignias} disabled={loading} className="flex flex-col items-center justify-center gap-1 rounded-lg border border-amber-500/20 bg-amber-600/20 p-3 text-xs font-bold text-amber-200 transition-all hover:border-amber-500/50 hover:bg-amber-600/40">
                    <span>+1 insignia de cada família</span>
                    <span className="text-[10px] opacity-70">(Adiciona ao inventario)</span>
                </button>

                <button onClick={handleTestMission} className="flex flex-col items-center justify-center gap-1 rounded-lg border border-green-500/20 bg-green-600/20 p-3 text-xs font-bold text-green-200 transition-all hover:border-green-500/50 hover:bg-green-600/40">
                    <span>?? Testar Completar Missao</span>
                    <span className="text-[10px] opacity-70">(Simula Modal)</span>
                </button>

                <button onClick={() => setShowChestModal('Lend\u00e1rio')} className="flex flex-col items-center justify-center gap-1 rounded-lg border border-blue-500/20 bg-blue-600/20 p-3 text-xs font-bold text-blue-200 transition-all hover:border-blue-500/50 hover:bg-blue-600/40">
                    <span>?? Testar Modal Bau</span>
                    <span className="text-[10px] opacity-70">(Visualizacao Apenas)</span>
                </button>

                <button onClick={() => setShowReportModal(true)} className="flex flex-col items-center justify-center gap-1 rounded-lg border border-purple-500/20 bg-purple-600/20 p-3 text-xs font-bold text-purple-200 transition-all hover:border-purple-500/50 hover:bg-purple-600/40">
                    <span>?? Testar Relatorio</span>
                    <span className="text-[10px] opacity-70">(Animacao de video)</span>
                </button>

                <button onClick={() => setShowReportResult({ ...mockReport, id: 'debug-report-chest' })} className="flex flex-col items-center justify-center gap-1 rounded-lg border border-purple-500/20 bg-purple-600/20 p-3 text-xs font-bold text-purple-200 transition-all hover:border-purple-500/50 hover:bg-purple-600/40">
                    <span>?? Testar Relatorio + Bau</span>
                    <span className="text-[10px] opacity-70">(Resumo Final)</span>
                </button>

                <button onClick={handleTestLevelUp} className="col-span-2 flex flex-col items-center justify-center gap-1 rounded-lg border border-orange-500/20 bg-orange-600/20 p-3 text-xs font-bold text-orange-200 transition-all hover:border-orange-500/50 hover:bg-orange-600/40">
                    <span>?? Testar Subir Nivel</span>
                    <span className="text-[10px] opacity-70">(Simula Conquista)</span>
                </button>

                <button onClick={() => setShowLegacyPreview(true)} className="col-span-2 flex flex-col items-center justify-center gap-1 rounded-lg border border-cyan-500/20 bg-cyan-600/20 p-3 text-xs font-bold text-cyan-200 transition-all hover:border-cyan-500/50 hover:bg-cyan-600/40">
                    <span>Testar Legacy Scene</span>
                    <span className="text-[10px] opacity-70">(3 Eras mockadas com timeline, placa e planner mini)</span>
                </button>

            </div>

            <div className="space-y-3 rounded-2xl border border-sky-500/20 bg-sky-950/10 p-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-300">Teste sensorial</p>
                    <p className="mt-1 text-xs text-sky-100/70">O clique padrão e o combo especial já foram definidos. Aqui fica só o warning.</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    <button data-sensory-test="true" onClick={() => trigger('warning')} className="flex flex-col items-center justify-center gap-1 rounded-lg border border-amber-500/20 bg-amber-600/20 p-3 text-xs font-bold text-amber-100 transition-all hover:border-amber-400/50 hover:bg-amber-600/35">
                        <span>Metal Travado</span>
                        <span className="text-[10px] opacity-70">bloqueio</span>
                    </button>
                </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-950/10 p-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-300">Mock de campanha</p>
                    <p className="mt-1 text-xs text-fuchsia-100/70">Aqui fica a campanha fake ja com 2 arenas dentro, para ver como ela apareceria na aba Ver Arenas.</p>
                </div>
                {mockCampaign ? (
                    <button
                        onClick={() => setShowCampaignPreview(true)}
                        className="w-full rounded-2xl border border-fuchsia-400/30 bg-[linear-gradient(180deg,rgba(120,36,161,0.28),rgba(17,17,17,0.88))] p-3 text-left transition-all hover:border-fuchsia-300/60 hover:shadow-[0_0_24px_rgba(192,38,211,0.18)]"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-bold text-white">{mockCampaign.title}</p>
                                <p className="mt-1 text-[11px] text-fuchsia-100/70">{mockCampaign.description}</p>
                            </div>
                            <div className="rounded-full border border-fuchsia-300/20 bg-black/30 px-2 py-1 text-[10px] font-bold text-fuchsia-200">
                                {mockCampaign.arenaIds.length} arenas
                            </div>
                        </div>
                        <div className="mt-3 flex justify-center rounded-xl border border-white/8 bg-black/20 px-2 py-3">
                            <CampaignArenaStack arenas={mockCampaignArenas} size="md" />
                        </div>
                    </button>
                ) : (
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-gray-400">
                        Crie pelo menos 2 arenas para o mock de campanha aparecer aqui.
                    </div>
                )}
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">Galeria metalica</p>
                    <p className="mt-1 text-xs text-gray-500">Teste rapido dos ranks S, A, B, C e ferro gasto antes de ligar no fluxo real.</p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {rankPreviewScores.map(({ score, grade, title, actions, hours, metas, presence }) => (
                        <div key={title} className="w-[12.35rem] shrink-0">
                            <MetalReportCard
                                rank={grade.grade}
                                score={score}
                                title={title}
                                subtitle="01/03 - 14/03"
                                metrics={[
                                    { label: 'Acoes', value: actions },
                                    { label: 'Carga', value: hours },
                                    { label: 'Metas', value: metas },
                                    { label: 'Presenca', value: presence },
                                ]}
                                compact
                            />
                        </div>
                    ))}
                </div>
            </div>

            {showChestModal && (
                <ChestOpeningModal
                    chestType={showChestModal}
                    onClose={() => setShowChestModal(null)}
                    onRewardClaimed={(reward) => showToast(`Recompensa reclamada: ${reward.name}`)}
                />
            )}

            {showReportModal && (
                <ReportGenerationModal
                    onFinish={() => {
                        showToast('Relatorio gerado.');
                        setShowReportResult(mockReport);
                        setShowReportModal(false);
                    }}
                />
            )}

            {showCampaignPreview && mockCampaign && (
                <CampaignsCodex
                    initialCampaignId={mockCampaign.id}
                    previewCampaign={mockCampaign}
                    onClose={() => setShowCampaignPreview(false)}
                />
            )}

            {showReportResult && (
                <ReportResultCarousel
                    report={showReportResult}
                    onOk={() => setShowReportResult(null)}
                    onCompare={() => showToast('Comparar (simulacao)')}
                    onShare={() => showToast('Compartilhar (simulacao)')}
                    onPostToFeed={() => showToast('Postar no Feed (simulacao)')}
                    onStartNewCycle={() => {
                        const msg = showReportResult.id === 'debug-report-chest'
                            ? 'Bau lendario e XP simulados no teste.'
                            : 'XP e insignia simulados no teste.';
                        showToast(msg);
                        setShowReportResult(null);
                    }}
                    expGained={1000}
                    chest={showReportResult.id === 'debug-report-chest' ? 'Lend\u00e1rio' : null}
                    insignias={['insignia_report_comum']}
                />
            )}

            {testMission && (
                <MissionCompletionModal
                    mission={testMission}
                    onOk={() => setTestMission(null)}
                    onClose={() => setTestMission(null)}
                    insignia="insignia_quest_incomum"
                />
            )}

            {showLegacyPreview && (
                <LegacyProjectionModal
                    eras={mockLegacyEras}
                    sovereignName={mockFallbackIdentity.nickname}
                    isPremium={true}
                    fallbackIdentity={mockFallbackIdentity}
                    onClose={() => setShowLegacyPreview(false)}
                    onToast={showToast}
                    onOpenCycle={(cycleId) => showToast(`Abrir ciclo mockado: ${cycleId}`)}
                    onOpenEra={(era) => showToast(`Abrir Era mockada: ${era.label}`)}
                    onOpenPlaque={() => showToast('Placa do legado ativada.')}
                    onExportRecord={() => showToast('Export do legado mockado acionado.')}
                    showLayoutLab
                />
            )}
        </GlassCard>
    );
};






