import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';

interface CompactSanctuaryStatsProps {
  clanId: string;
  onOpenDescription?: () => void;
}

export const CompactSanctuaryStats = React.memo<CompactSanctuaryStatsProps>(({ clanId, onOpenDescription }) => {
  const { getSanctuaryAreaStats } = useGame();
  const [stats, setStats] = useState<Record<string, { totalSeconds: number; lastUpdated: string }>>({
    meditation: { totalSeconds: 14400, lastUpdated: new Date().toISOString() },
    devotion: { totalSeconds: 14400, lastUpdated: new Date().toISOString() },
    rest: { totalSeconds: 14400, lastUpdated: new Date().toISOString() },
    garden: { totalSeconds: 14400, lastUpdated: new Date().toISOString() },
  });

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

  // Função para calcular porcentagem baseada no tempo máximo (8 horas = 28800 segundos)
  const getPercentage = (seconds: number): number => {
    const maxSeconds = 28800; // 8 horas (Base 100%)
    const pct = (seconds / maxSeconds) * 100;
    return Math.floor(Math.max(0, Math.min(100, pct)));
  };

  // Buscar estatísticas apenas uma vez ao montar
  useEffect(() => {
    const loadStats = async () => {
      try {
        const areaStats = await getSanctuaryAreaStats(clanId);
        if (areaStats && Object.keys(areaStats).length > 0) {
          setStats(prev => ({ ...prev, ...areaStats }));
        }
      } catch (error) {
        console.error('Failed to load sanctuary area stats:', error);
      }
    };

    if (clanId) {
      loadStats();
    }
  }, [clanId]);

  return (
    <GlassCard variant="neutral" className="p-2">
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(areaEmojis).map(([area, emoji]) => {
                const areaStats = stats[area] || { totalSeconds: 14400, lastUpdated: new Date().toISOString() };
                const percentage = getPercentage(areaStats.totalSeconds);
          
          return (
            <div key={area} className="flex items-center space-x-2">
              <span className="text-xs">{emoji}</span>
              <div className="flex-1 bg-black/30 rounded-full h-1.5">
                <div 
                  className={`${areaColors[area as keyof typeof areaColors]} h-full rounded-full`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-300 font-medium">{percentage}%</span>
            </div>
          );
        })}
      </div>
      {onOpenDescription && (
        <div className="text-center mt-1">
          <button
            type="button"
            onClick={onOpenDescription}
            className="text-xs text-gray-300 hover:text-white underline decoration-dotted"
          >
            Ver descrição
          </button>
        </div>
      )}
    </GlassCard>
  );
});

CompactSanctuaryStats.displayName = 'CompactSanctuaryStats';
