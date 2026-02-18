import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';

interface SanctuaryAreaStatsProps {
  clanId: string;
}

export const SanctuaryAreaStats: React.FC<SanctuaryAreaStatsProps> = ({ clanId }) => {
  const { getSanctuaryAreaStats, updateSanctuaryAreaTime } = useGame();
  const [stats, setStats] = useState<Record<string, { totalSeconds: number; lastUpdated: string }>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Emojis para as áreas do santuário
  const areaEmojis = {
    meditation: '🧘‍♂️',
    devotion: '🙏',
    rest: '😴',
    garden: '🌱'
  };

  // Cores para cada área
  const areaColors = {
    meditation: 'bg-purple-500',
    devotion: 'bg-yellow-500',
    rest: 'bg-blue-500',
    garden: 'bg-green-500'
  };

  // Buscar estatísticas ao montar
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        const areaStats = await getSanctuaryAreaStats(clanId);
        setStats(areaStats);
      } catch (error) {
        console.error('Failed to load sanctuary area stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (clanId) {
      loadStats();
    }
  }, [clanId, getSanctuaryAreaStats]);

  // Não atualizar automaticamente - as estatísticas agora são atualizadas diariamente pelo ClanDetailModal

  // Função para formatar tempo em formato legível
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Função para calcular porcentagem baseada no tempo máximo (8 horas = 28800 segundos)
  const getPercentage = (seconds: number): number => {
    const maxSeconds = 28800; // 8 horas
    const pct = (seconds / maxSeconds) * 100;
    return Math.floor(Math.max(0, Math.min(100, pct)));
  };

  if (isLoading) {
    return (
      <GlassCard variant="neutral" className="p-3">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
          <span className="ml-2 text-xs text-gray-400">Loading stats...</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="neutral" className="p-3 space-y-2">
      <h3 className="text-sm font-bold text-yellow-400 text-center mb-2">Sanctuary Activity</h3>
      
      {Object.entries(areaEmojis).map(([area, emoji]) => {
        const areaStats = stats[area] || { totalSeconds: 0, lastUpdated: new Date().toISOString() };
        const percentage = getPercentage(areaStats.totalSeconds);
        
        return (
          <div key={area} className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300 font-medium">{emoji} {percentage}%</span>
            </div>
            
            <div className="w-full bg-black/30 rounded-full h-2">
              <div 
                className={`${areaColors[area as keyof typeof areaColors]} h-full rounded-full`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      })}
      
      <div className="text-xs text-gray-500 text-center mt-2">
        Daily updates • Max: 8h per area
      </div>
    </GlassCard>
  );
};