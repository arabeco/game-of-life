import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { StoreTopBar } from './Store/StoreTopBar';
import { CheckIcon } from './Icons';
import { Action } from '../types';

// --- Types for Codex System ---

interface CodexLevel {
  level: number;
  title: string;
  description: string;
  actions: Omit<Action, 'id' | 'arenaId'>[];
}

interface CodexTemplate {
  id: string;
  title: string;
  description: string;
  author: string;
  price: number; // 0 for free
  durationDays: number;
  levels: CodexLevel[];
  coverImage?: string; // Emoji or URL
  tags: string[];
}

// --- Data: Máquina Biológica Codex ---

export const BIOLOGICAL_MACHINE_CODEX: CodexTemplate = {
  id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  title: 'Máquina Biológica',
  description: 'Reconfigure sua biologia para performance máxima em 28 dias. Protocolos de sono, nutrição e ativação física.',
  author: 'Soberano System',
  price: 0,
  durationDays: 28,
  tags: ['Saúde', 'Biohacking', 'Energia'],
  coverImage: '🧬',
  levels: [
    {
      level: 1,
      title: 'Fase 1: Desintoxicação & Reset',
      description: 'Limpeza metabólica e estabelecimento do ritmo circadiano.',
      actions: [
        {
          name: 'Hidratação Matinal',
          description: 'Beber 500ml de água com limão e sal integral ao acordar.',
          icon: '💧',
          duration: 5,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 1,
          briefing: 'Sua biologia acorda desidratada. A água ativa o metabolismo e o sal repõe eletrólitos fundamentais para a condução nervosa.',
          preFlight: ['Água filtrada', 'Meio limão', 'Pitada de sal integral'],
          context: { energyLevel: 'low', timeOfDay: 'morning' },
          scheduledDays: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'],
          scheduledStartTime: 420 // 07:00
        },
        {
          name: 'Higiene de Luz (Manhã)',
          description: 'Exposição direta à luz solar nos primeiros 30 min do dia.',
          icon: '☀️',
          duration: 15,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 2,
          briefing: 'A luz solar no nervo óptico sinaliza ao núcleo supraquiasmático que o dia começou, regulando a produção de cortisol e melatonina para a noite.',
          context: { energyLevel: 'medium', timeOfDay: 'morning' },
          scheduledDays: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'],
          scheduledStartTime: 450 // 07:30
        },
        {
          name: 'Jejum 12h',
          description: 'Janela de alimentação restrita a 12 horas.',
          icon: '🍽️',
          duration: 0,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 3,
          briefing: 'Dê descanso ao seu sistema digestivo para focar em reparo celular (autofagia incipiente).',
          context: { energyLevel: 'medium', timeOfDay: 'night' }
        },
        {
          name: 'Bloqueio de Luz Azul',
          description: 'Evitar telas ou usar filtro 1h antes de dormir.',
          icon: '🕶️',
          duration: 60,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 3,
          briefing: 'A luz azul inibe a melatonina. Proteja seu sono profundo evitando telas à noite.',
          context: { energyLevel: 'low', timeOfDay: 'night' },
          scheduledDays: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'],
          scheduledStartTime: 1320 // 22:00
        }
      ]
    },
    {
      level: 2,
      title: 'Fase 2: Ativação Mitocondrial',
      description: 'Otimização da produção de energia celular.',
      actions: [
        {
          name: 'Banho Frio',
          description: 'Exposição ao frio por 2-3 minutos.',
          icon: '❄️',
          duration: 3,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 4,
          briefing: 'O choque térmico aumenta a noradrenalina e dopamina, além de converter gordura branca em marrom (termogênica).',
          preFlight: ['Chuveiro gelado', 'Respiração controlada'],
          context: { energyLevel: 'high', timeOfDay: 'morning' }
        },
        {
          name: 'Treino HIIT',
          description: 'Alta intensidade intervalada.',
          icon: '🔥',
          duration: 20,
          repetitions: 3, // 3x por semana
          actionType: 'Ação Recorrente',
          difficulty: 4,
          briefing: 'Explosões de esforço máximo melhoram a capacidade cardiovascular e a sensibilidade à insulina.',
          scheduledDays: ['SEG', 'QUA', 'SEX']
        },
        {
          name: 'Respiração Wim Hof',
          description: '3 rounds de respiração profunda e retenção.',
          icon: '🫁',
          duration: 15,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 3,
          briefing: 'Alcaliniza o sangue temporariamente e treina o sistema nervoso autônomo.',
          context: { energyLevel: 'medium', timeOfDay: 'morning' }
        },
        {
          name: 'Grounding',
          description: 'Pés descalços na terra/grama.',
          icon: '🌱',
          duration: 10,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 1,
          briefing: 'Descarga elétrica e redução de inflamação através do contato com a terra.',
          context: { energyLevel: 'low', timeOfDay: 'afternoon' }
        }
      ]
    },
    {
      level: 3,
      title: 'Fase 3: Alta Performance Cognitiva',
      description: 'Foco, memória e clareza mental.',
      actions: [
        {
          name: 'Deep Work (Bloco 1)',
          description: '90 minutos de trabalho focado sem distrações.',
          icon: '🧠',
          duration: 90,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 4,
          briefing: 'Atenção plena em uma única tarefa complexa. Onde a mágica acontece.',
          preFlight: ['Celular longe', 'Notificações off', 'Água na mesa'],
          context: { energyLevel: 'high', timeOfDay: 'morning' }
        },
        {
          name: 'Meditação Mindfulness',
          description: 'Observação dos pensamentos sem julgamento.',
          icon: '🧘',
          duration: 10,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 2,
          briefing: 'Treino de foco e redução de ansiedade. O "bíceps" da mente.',
          context: { energyLevel: 'low', timeOfDay: 'evening' }
        },
        {
          name: 'Leitura Técnica',
          description: 'Absorção de conhecimento denso.',
          icon: '📚',
          duration: 30,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 3,
          briefing: 'Expansão do repertório mental.',
          context: { energyLevel: 'medium', timeOfDay: 'afternoon' }
        },
        {
          name: 'Diário de Gratidão',
          description: '3 coisas pelas quais é grato hoje.',
          icon: '📔',
          duration: 5,
          repetitions: 1,
          actionType: 'Ação Recorrente',
          difficulty: 1,
          briefing: 'Recalibração do viés cognitivo para o positivo antes de dormir.',
          context: { energyLevel: 'low', timeOfDay: 'night' }
        }
      ]
    }
  ]
};

export const CodexLibrary: React.FC = () => {
  const { addArena, addAction, getArenas, deleteArena, assets, userProfile } = useGame();
  
  // Check if Codex is installed
  const legacyCodexId = 'codex-bio-machine-v1';
  const installedCodex = getArenas().some(a => (a.originCodexId === BIOLOGICAL_MACHINE_CODEX.id || a.originCodexId === legacyCodexId) && !a.isArchived);
  const purchasedCodex = userProfile.unlockedItems?.codexes?.[BIOLOGICAL_MACHINE_CODEX.id] || false;

  const [installing, setInstalling] = useState(false);

  const handleInstallLevel = async (targetLevel: number) => {
    setInstalling(true);
    
    // Simulate API call/delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        const level = BIOLOGICAL_MACHINE_CODEX.levels.find(l => l.level === targetLevel);
        if (!level) throw new Error("Nível não encontrado");

        const fisicoAssetId = assets.find(asset => asset.id === 'fisico')?.id || assets[0]?.id || 'geral';
        
        const newArena = addArena(fisicoAssetId, {
            name: `${level.title}`,
            description: level.description,
            icon: '🧬',
            originCodexId: BIOLOGICAL_MACHINE_CODEX.id,
            codexLevel: level.level
        });

        // Add Actions to this Arena
        level.actions.forEach(actionTemplate => {
            addAction({
                ...actionTemplate,
                arenaId: newArena.id,
                originCodexId: BIOLOGICAL_MACHINE_CODEX.id,
            });
        });

        console.log(`Level ${targetLevel} Installed Successfully`);
    } catch (error) {
        console.error("Failed to install Codex Level", error);
    } finally {
        setInstalling(false);
    }
  };

  const handleUninstall = async () => {
    if (!confirm("Tem certeza que deseja sair do Codex 'Máquina Biológica'?\n\nTodas as arenas e ações futuras serão removidas do seu Planner. Seu histórico de XP será mantido.")) return;
    
    setInstalling(true);
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        const arenasToDelete = getArenas().filter(a => (a.originCodexId === BIOLOGICAL_MACHINE_CODEX.id || a.originCodexId === legacyCodexId) && !a.isArchived);
        
        for (const arena of arenasToDelete) {
            await deleteArena(arena.id);
        }
        
        console.log("Codex Uninstalled Successfully");
    } catch (error) {
        console.error("Failed to uninstall Codex", error);
    } finally {
        setInstalling(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
        {purchasedCodex ? (
            <GlassCard variant="neutral" className="relative group overflow-hidden border-green-500/30">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-900/40 to-transparent pointer-events-none" />
                
                <div className="relative z-10 flex flex-col h-full space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-black/40 rounded-2xl border border-green-500/20 text-4xl shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                            {BIOLOGICAL_MACHINE_CODEX.coverImage}
                        </div>
                        {installedCodex ? (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/30 flex items-center gap-1">
                                <CheckIcon className="w-3 h-3" /> Instalado
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-[var(--skin-accent-color)]/20 accent-text text-[10px] font-black uppercase tracking-widest rounded-full border border-[var(--skin-accent-color)]/30">
                                Disponível
                            </span>
                        )}
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-100">{BIOLOGICAL_MACHINE_CODEX.title}</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">{BIOLOGICAL_MACHINE_CODEX.description}</p>
                    </div>
                    
                    <div className="space-y-2 mt-4 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {BIOLOGICAL_MACHINE_CODEX.levels.map((level, idx) => {
                            const isInstalled = getArenas().some(a => 
                                (a.originCodexId === BIOLOGICAL_MACHINE_CODEX.id || a.originCodexId === legacyCodexId) && 
                                (a.codexLevel === level.level || (level.level === 1 && !a.codexLevel)) &&
                                !a.isArchived
                            );
                            
                            const prevLevelInstalled = idx === 0 || getArenas().some(a => 
                                (a.originCodexId === BIOLOGICAL_MACHINE_CODEX.id || a.originCodexId === legacyCodexId) && 
                                (a.codexLevel === level.level - 1 || (level.level - 1 === 1 && !a.codexLevel)) &&
                                !a.isArchived
                            );
                            
                            const isLocked = !prevLevelInstalled && !isInstalled;
                            
                            return (
                                <div key={level.level} className={`p-3 rounded-lg border ${isInstalled ? 'bg-green-500/10 border-green-500/30' : isLocked ? 'bg-gray-800/50 border-gray-700 opacity-50' : 'bg-gray-800 border-gray-600'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className={`font-bold text-sm ${isInstalled ? 'text-green-400' : 'text-gray-300'}`}>
                                            Nível {level.level}: {level.title}
                                        </h3>
                                        {isInstalled ? (
                                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 font-bold uppercase">Ativo</span>
                                        ) : isLocked ? (
                                            <span className="text-[10px] bg-gray-700 text-gray-500 px-2 py-0.5 rounded border border-gray-600 font-bold uppercase">Bloqueado</span>
                                        ) : (
                                            <button 
                                                onClick={() => handleInstallLevel(level.level)}
                                                disabled={installing}
                                                className="text-[10px] bg-[var(--skin-accent-color)]/20 accent-text px-3 py-1 rounded border border-[var(--skin-accent-color)]/30 hover:bg-[var(--skin-accent-color)]/30 transition-colors font-bold uppercase"
                                            >
                                                {installing ? '...' : 'Ativar'}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">{level.description}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex-1" />

                    <div className="pt-4 border-t border-white/5 flex gap-3">
                        {installedCodex && (
                            <button 
                                onClick={handleUninstall}
                                disabled={installing}
                                className="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {installing ? 'Saindo...' : 'ABANDONAR CODEX'}
                            </button>
                        )}
                    </div>
                </div>
            </GlassCard>
        ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="text-6xl opacity-30">📚</div>
                <h2 className="text-xl font-bold text-gray-500">Sua biblioteca está vazia</h2>
                <p className="text-gray-600 max-w-xs">Adquira Codexes na Loja para vê-los aqui.</p>
                {/* Navigation to Store should be handled by parent or context if needed, but here we just show info */}
            </div>
        )}
    </div>
  );
};
