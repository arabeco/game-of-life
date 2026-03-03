import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { StoreTopBar } from './Store/StoreTopBar';
import { CheckIcon } from './Icons';
import { Action } from '../types';
import { BIOLOGICAL_MACHINE_CODEX } from '../data/initialCodex';

export { BIOLOGICAL_MACHINE_CODEX }; // Re-export for compatibility

export const CodexLibrary: React.FC = () => {
  const { userCodexes, installCodex, showToast } = useGame();
  
  const [installing, setInstalling] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleInstallCodex = async (codexId: string) => {
      if (confirmId !== codexId) {
          setConfirmId(codexId);
          return;
      }
      
      setInstalling(true);
      try {
          await installCodex(codexId);
          showToast("Campanha instalada com sucesso!");
      } catch (error) {
          console.error("Failed to install codex", error);
          showToast("Erro ao instalar campanha.");
      } finally {
          setInstalling(false);
          setConfirmId(null);
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
        {userCodexes.length > 0 ? (
            userCodexes.map(codex => (
                <GlassCard key={codex.id} variant="neutral" className="relative group overflow-hidden border-green-500/30">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-900/40 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col h-full space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-black/40 rounded-2xl border border-green-500/20 text-4xl shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                {codex.template.coverImage || '📜'}
                            </div>
                            <span className="px-3 py-1 bg-[var(--skin-accent-color)]/20 accent-text text-[10px] font-black uppercase tracking-widest rounded-full border border-[var(--skin-accent-color)]/30">
                                Adquirido
                            </span>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-100">{codex.name}</h2>
                            <p className="text-sm text-gray-400 leading-relaxed">{codex.description}</p>
                            <p className="text-xs text-gray-500 mt-1">Autor: {codex.author}</p>
                        </div>
                        
                        <div className="space-y-2 mt-4 overflow-y-auto max-h-[200px] pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                             <div className="text-xs font-bold text-gray-400 uppercase mb-2">Conteúdo da Campanha:</div>
                             {codex.template.levels.map((level: any) => (
                                 <div key={level.level} className="p-2 rounded bg-white/5 border border-white/5 flex justify-between items-center">
                                     <span className="text-sm font-medium text-gray-300">Nível {level.level}: {level.title}</span>
                                     <span className="text-[10px] text-gray-500">{level.actions.length} ações</span>
                                 </div>
                             ))}
                        </div>

                        <div className="flex-1" />

                        <div className="pt-4 border-t border-white/5 flex gap-3">
                            <button 
                                onClick={() => handleInstallCodex(codex.id)}
                                disabled={installing}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                    confirmId === codex.id 
                                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' 
                                        : 'bg-[var(--skin-accent-color)] text-black hover:brightness-110'
                                }`}
                            >
                                {installing ? 'Instalando...' : confirmId === codex.id ? 'CLIQUE PARA CONFIRMAR' : 'INSTALAR CAMPANHA'}
                            </button>
                        </div>
                    </div>
                </GlassCard>
            ))
        ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="text-6xl opacity-30">📚</div>
                <h2 className="text-xl font-bold text-gray-500">Sua biblioteca está vazia</h2>
                <p className="text-gray-600 max-w-xs">Adquira Codexes na Loja para vê-los aqui.</p>
            </div>
        )}
    </div>
  );
};
