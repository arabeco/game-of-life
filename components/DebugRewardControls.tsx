import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useGame } from '../contexts/GameContext';
import { ChestType, SeasonMission } from '../types';
import { GlassCard } from './GlassCard';
import { ChestOpeningModal } from './ChestOpeningModal';
import { ReportGenerationModal } from './ReportGenerationModal';
import { MissionCompletionModal } from './MissionCompletionModal';

import { ReportResultCarousel } from './ReportResultCarousel';
import { Report } from '../types';

export const DebugRewardControls: React.FC = () => {
    const { userProfile, updateUserProfile, showToast, setAchievementUnlocked } = useGame();
    const [loading, setLoading] = useState(false);
    const [showChestModal, setShowChestModal] = useState<ChestType | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReportResult, setShowReportResult] = useState<Report | null>(null);
    const [testMission, setTestMission] = useState<SeasonMission | null>(null);

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
            { asset: 'Físico', value: 80 },
            { asset: 'Mental', value: 90 },
            { asset: 'Social', value: 60 },
            { asset: 'Espiritual', value: 70 },
            { asset: 'Financeiro', value: 85 }
        ],
        performanceScore: 95,
        clanPoints: 50
    };

    const addChests = async () => {
        setLoading(true);
        try {
            const types: ChestType[] = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário', 'Ciclo'];

            // 1. Add to user_chests table (if exists)
            const newChests = [];
            for (const type of types) {
                for (let i = 0; i < 5; i++) {
                    newChests.push({
                        user_id: userProfile.id,
                        chest_type: type,
                        is_opened: false,
                        earned_at: new Date().toISOString()
                    });
                }
            }

            const { error: insertError } = await supabase.from('user_chests').insert(newChests);

            if (insertError) {
                console.warn("Could not insert into user_chests (table might not exist or RLS issue):", insertError);
            }

            // 2. Update user_profiles JSONB for immediate UI update
            const currentChests = userProfile.chests ? [...userProfile.chests] : [];

            types.forEach(type => {
                const existing = currentChests.find(c => c.type === type);
                if (existing) {
                    existing.count += 5;
                } else {
                    currentChests.push({ type, count: 5 });
                }
            });

            // Optimistic update
            await updateUserProfile({ chests: currentChests });

            // Force sync with DB for profile
            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({ chests: currentChests })
                .eq('id', userProfile.id);

            if (profileError) throw profileError;

            showToast("5 Baús de cada tipo adicionados com sucesso!");
        } catch (error: any) {
            console.error(error);
            showToast(`Erro ao adicionar baús: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const addInsignias = async () => {
        setLoading(true);
        try {
            const insignias = [
                'insignia_rank_5_barao', // Ouro
                'insignia_quest_incomum', // Prata
                'insignia_sitrep_s' // Bronze
            ];

            // 1. Add to user_inventory table
            const newItems = insignias.map(id => ({
                user_id: userProfile.id,
                item_id: id,
                acquired_at: new Date().toISOString()
            }));

            const { error: insertError } = await supabase.from('user_inventory').insert(newItems);

            if (insertError) {
                console.warn("Could not insert into user_inventory:", insertError);
                throw insertError;
            }

            // 2. Add to unlocked items (JSONB)
            const newUnlocked = { ...userProfile.unlockedItems };
            if (!newUnlocked.insignias) newUnlocked.insignias = {};

            insignias.forEach(id => {
                newUnlocked.insignias[id] = true;
            });

            // Optimistic update
            const currentInventory = userProfile.inventory || [];
            const newInventoryItems = insignias.map(id => ({
                id,
                instanceId: crypto.randomUUID(),
                acquiredAt: new Date().toISOString(),
                isEquipped: false
            }));

            await updateUserProfile({
                unlockedItems: newUnlocked,
                inventory: [...currentInventory, ...newInventoryItems]
            });

            // Force sync with DB
            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({ unlocked_items: newUnlocked })
                .eq('id', userProfile.id);

            if (profileError) throw profileError;

            showToast("1 Insígnia de cada tipo adicionada com sucesso!");
        } catch (error: any) {
            console.error(error);
            showToast(`Erro ao adicionar insígnias: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestMission = () => {
        setTestMission({
            id: 'test-mission-01',
            season_id: 'season-debug',
            title: 'Missão de Teste',
            description: 'Conclua uma tarefa para ganhar XP e Insígnia.',
            goal_type: 'actions_completed',
            goal_value: 1,
            reward_type: 'item_id',
            reward_value: 'insignia_quest_incomum',
            type: 'individual',
            icon: '🎯'
        });
    };

    const handleTestLevelUp = () => {
        setAchievementUnlocked({
            type: 'PLAYER_RANK_UP',
            data: {
                name: 'Soberano Nível 5',
                icon: '👑',
                rewards: {
                    exp: 1000,
                    chest: 'Lendário',
                    items: ['insignia_rank_5_barao']
                }
            }
        });
    };

    return (
        <GlassCard className="p-4 mt-4 space-y-4 border-yellow-500/30">
            <h3 className="text-yellow-400 font-bold flex items-center gap-2">
                <span>🛠️</span>
                Painel de Teste de Recompensas (GM)
            </h3>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={addChests}
                    disabled={loading}
                    className="p-3 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-200 rounded-lg text-xs font-bold transition-all border border-yellow-500/20 hover:border-yellow-500/50 flex flex-col items-center justify-center gap-1"
                >
                    <span>🎁 +5 Baús de Cada</span>
                    <span className="text-[10px] opacity-70">(Adiciona ao Inventário)</span>
                </button>

                <button
                    onClick={addInsignias}
                    disabled={loading}
                    className="p-3 bg-amber-600/20 hover:bg-amber-600/40 text-amber-200 rounded-lg text-xs font-bold transition-all border border-amber-500/20 hover:border-amber-500/50 flex flex-col items-center justify-center gap-1"
                >
                    <span>🎖️ +1 Insígnia de Cada</span>
                    <span className="text-[10px] opacity-70">(Adiciona ao Inventário)</span>
                </button>

                <button
                    onClick={handleTestMission}
                    className="p-3 bg-green-600/20 hover:bg-green-600/40 text-green-200 rounded-lg text-xs font-bold transition-all border border-green-500/20 hover:border-green-500/50 flex flex-col items-center justify-center gap-1"
                >
                    <span>✅ Testar Completar Missão</span>
                    <span className="text-[10px] opacity-70">(Simula Modal)</span>
                </button>

                <button
                    onClick={() => setShowChestModal('Lendário')}
                    className="p-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 rounded-lg text-xs font-bold transition-all border border-blue-500/20 hover:border-blue-500/50 flex flex-col items-center justify-center gap-1"
                >
                    <span>📦 Testar Modal Baú</span>
                    <span className="text-[10px] opacity-70">(Visualização Apenas)</span>
                </button>

                <button
                    onClick={() => {
                        setShowReportModal(true);
                        // We will inject the chest in the onOpen callback
                    }}
                    className="p-3 bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 rounded-lg text-xs font-bold transition-all border border-purple-500/20 hover:border-purple-500/50 flex flex-col items-center justify-center gap-1"
                >
                    <span>📜 Testar Relatório</span>
                    <span className="text-[10px] opacity-70">(Animação Vídeo)</span>
                </button>

                <button
                    onClick={() => {
                        setShowReportResult({
                            ...mockReport,
                            id: 'debug-report-chest'
                        });
                        // Directly show result with chest for testing UI
                    }}
                    className="p-3 bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 rounded-lg text-xs font-bold transition-all border border-purple-500/20 hover:border-purple-500/50 flex flex-col items-center justify-center gap-1"
                >
                    <span>🎁 Testar Relatório + Baú</span>
                    <span className="text-[10px] opacity-70">(Resumo Final)</span>
                </button>

                <button
                    onClick={handleTestLevelUp}
                    className="p-3 bg-orange-600/20 hover:bg-orange-600/40 text-orange-200 rounded-lg text-xs font-bold transition-all border border-orange-500/20 hover:border-orange-500/50 flex flex-col items-center justify-center gap-1 col-span-2"
                >
                    <span>⭐ Testar Subir Nível</span>
                    <span className="text-[10px] opacity-70">(Simula Conquista)</span>
                </button>
            </div>

            {showChestModal && (
                <ChestOpeningModal
                    chestType={showChestModal}
                    onClose={() => setShowChestModal(null)}
                    onRewardClaimed={(reward) => {
                        showToast(`Recompensa reclamada: ${reward.name}`);
                    }}
                />
            )}

            {showReportModal && (
                <ReportGenerationModal
                    onComplete={() => showToast("Relatório Gerado!")}
                    onOpen={() => {
                        setShowReportModal(false);
                        setShowReportResult(mockReport);
                    }}
                    onClose={() => setShowReportModal(false)}
                />
            )}

            {showReportResult && (
                <ReportResultCarousel
                    report={showReportResult}
                    onOk={() => setShowReportResult(null)}
                    onCompare={() => showToast("Comparar (Simulação)")}
                    onShare={() => showToast("Compartilhar (Simulação)")}
                    onPostToFeed={() => showToast("Postar no Feed (Simulação)")}
                    onStartNewCycle={() => {
                        const msg = showReportResult.id === 'debug-report-chest'
                            ? `✦ Baú Lendário e 1 Insígnia(s) adicionados\n✦ +1000 XP computados`
                            : `✦ 1 Insígnia(s) adicionada(s) ao inventário\n✦ +1000 XP computados`;
                        showToast(msg);
                        setShowReportResult(null);
                    }}
                    expGained={1000}
                    chest={showReportResult.id === 'debug-report-chest' ? 'Lendário' : null}
                    insignias={['insignia_sitrep_s']}
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
        </GlassCard>
    );
};
