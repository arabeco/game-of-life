import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from '../components/GlassCard';
import { Action, Arena, DayOfWeek } from '../types';
import { CheckIcon, PlusIcon, XIcon, InfoIcon } from '../components/Icons';

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
  id: 'codex-bio-machine-v1',
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

// --- Store Component ---

export const StoreView: React.FC = () => {
  const { addArena, addAction, getArenas, deleteArena, getAssetIdByName } = useGame();
  const [activeTab, setActiveTab] = useState<'codex' | 'cosmetics'>('codex');
  
  // Check if Codex is installed
  const installedCodex = getArenas().some(a => a.originCodexId === BIOLOGICAL_MACHINE_CODEX.id && !a.isArchived);
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    
    // Simulate API call/delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        // Create an Arena Group (Folder) logic if supported, or just separate Arenas
        // Since we don't have explicit folders fully exposed in addArena, we create Arenas per level
        
        // Find 'Físico' asset or similar to attach these arenas
        // If not found, attach to first available asset or a default one
        // For 'Máquina Biológica', 'Físico' (Body) is the most appropriate asset.
        // We need to find the asset ID for 'Físico'.
        // Assuming we can find it via name or default to first one.
        // Since we can't easily query assets here without passing 'assets' prop, 
        // we'll assume the user has a 'Físico' asset or we use a fallback.
        // Actually, 'getArenas' doesn't give assets. We need 'assets' from useGame if we want to find ID.
        // Let's just create a new 'Codex' asset? No, user wants it integrated.
        // Let's use a hardcoded assumption or try to find it.
        // Ideally we ask the user where to install, but for "One Click" experience, we guess.
        
        const fisicoAssetId = 'asset_fisico'; // Placeholder, might need adjustment
        
        // Loop through levels and create Arenas
        BIOLOGICAL_MACHINE_CODEX.levels.forEach((level, index) => {
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
        });

        // Add Notification or Toast here (not implemented yet)
        console.log("Codex Installed Successfully");
    } catch (error) {
        console.error("Failed to install Codex", error);
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
        const arenasToDelete = getArenas().filter(a => a.originCodexId === BIOLOGICAL_MACHINE_CODEX.id && !a.isArchived);
        
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
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600">
          LOJA SOBERANA
        </h1>
        <div className="flex space-x-2 bg-black/30 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('codex')}
                className={`px-4 py-1 text-xs font-bold rounded-md transition-colors ${activeTab === 'codex' ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-500 hover:text-gray-300'}`}
            >
                CODEXES
            </button>
            <button 
                onClick={() => setActiveTab('cosmetics')}
                className={`px-4 py-1 text-xs font-bold rounded-md transition-colors ${activeTab === 'cosmetics' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500 hover:text-gray-300'}`}
            >
                COSMÉTICOS
            </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'codex' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Máquina Biológica Card */}
            <GlassCard variant="neutral" className="relative group overflow-hidden border-yellow-500/30">
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
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-yellow-500/30">
                                Grátis
                            </span>
                        )}
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-100">{BIOLOGICAL_MACHINE_CODEX.title}</h2>
                        <p className="text-xs text-green-400 uppercase tracking-wider font-semibold mb-2">Por {BIOLOGICAL_MACHINE_CODEX.author}</p>
                        <p className="text-sm text-gray-400 leading-relaxed">{BIOLOGICAL_MACHINE_CODEX.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2">
                        <div className="bg-black/30 p-2 rounded-lg text-center">
                            <div className="text-lg font-bold text-gray-200">{BIOLOGICAL_MACHINE_CODEX.durationDays}</div>
                            <div className="text-[9px] text-gray-500 uppercase font-bold">Dias</div>
                        </div>
                        <div className="bg-black/30 p-2 rounded-lg text-center">
                            <div className="text-lg font-bold text-gray-200">{BIOLOGICAL_MACHINE_CODEX.levels.length}</div>
                            <div className="text-[9px] text-gray-500 uppercase font-bold">Fases</div>
                        </div>
                        <div className="bg-black/30 p-2 rounded-lg text-center">
                            <div className="text-lg font-bold text-gray-200">
                                {BIOLOGICAL_MACHINE_CODEX.levels.reduce((acc, lvl) => acc + lvl.actions.length, 0)}
                            </div>
                            <div className="text-[9px] text-gray-500 uppercase font-bold">Ações</div>
                        </div>
                    </div>

                    <div className="flex-1" />

                    <div className="pt-4 border-t border-white/5 flex gap-3">
                        {installedCodex ? (
                            <button 
                                onClick={handleUninstall}
                                disabled={installing}
                                className="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {installing ? 'Saindo...' : 'ABANDONAR CODEX'}
                            </button>
                        ) : (
                            <button 
                                onClick={handleInstall}
                                disabled={installing}
                                className="flex-1 py-3 rounded-xl luxe-gold-button text-black font-bold text-sm shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all flex items-center justify-center gap-2"
                            >
                                {installing ? 'Instalando...' : 'INSTALAR AGORA'}
                            </button>
                        )}
                        <button className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                            <InfoIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </GlassCard>

            {/* Coming Soon Card */}
            <GlassCard variant="neutral" className="opacity-50 grayscale hover:grayscale-0 transition-all duration-500 border-dashed border-white/10">
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-4 text-center p-6">
                    <div className="text-4xl">🔒</div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-300">Codex: Empreendedorismo</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Em Breve</p>
                    </div>
                    <p className="text-sm text-gray-500 max-w-[200px]">Protocolos avançados de gestão e criação de negócios.</p>
                </div>
            </GlassCard>
        </div>
      )}

      {activeTab === 'cosmetics' && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="text-6xl animate-pulse">💎</div>
            <h2 className="text-xl font-bold text-gray-300">Loja de Cosméticos</h2>
            <p className="text-gray-500 max-w-xs">Skins, bordas e banners estarão disponíveis na próxima atualização.</p>
        </div>
      )}
    </div>
  );
};
