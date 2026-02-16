import { SanctuaryArea, SanctuaryPosition, SanctuaryTimeTracker, SanctuaryAreaStats } from '../types';

// Mapeamento do grid 6x6 para áreas do santuário
export const getSanctuaryArea = (row: number, col: number): SanctuaryArea => {
  // Divisão do grid:
  // 🌳 [0-1, 0-5] = Meditação (Esquerda)
  // 💎 [2-3, 2-3] = Devoção (Centro) 
  // 😌 [4-5, 0-5] = Descanso (Direita)
  // 🌱 [0-5, 4-5] = Jardim (Embaixo)
  
  if (col >= 4) return 'garden'; // Jardim (direita inferior)
  if (row >= 4) return 'rest'; // Descanso (baixo)
  if (row >= 2 && row <= 3 && col >= 2 && col <= 3) return 'devotion'; // Cristal (centro)
  if (col <= 1) return 'meditation'; // Meditação (esquerda)
  
  return 'rest'; // Default
};

// Cores das barrinhas douradas por área
export const getAreaColor = (area: SanctuaryArea): string => {
  switch (area) {
    case 'meditation': return '#FFD700'; // Dourado brilhante
    case 'devotion': return '#FFA500'; // Laranja dourado
    case 'rest': return '#FFE4B5'; // Dourado claro
    case 'garden': return '#DAA520'; // Goldenrod
    default: return '#FFD700';
  }
};

// Nomes das áreas em português
export const getAreaName = (area: SanctuaryArea): string => {
  switch (area) {
    case 'meditation': return 'Árvore de Meditação';
    case 'devotion': return 'Cristal de Devoção';
    case 'rest': return 'Área de Descanso';
    case 'garden': return 'Jardim';
    default: return 'Área Indefinida';
  }
};

// Calcular estatísticas das áreas
export const calculateAreaStats = (
  positions: SanctuaryPosition[],
  trackers: SanctuaryTimeTracker[]
): SanctuaryAreaStats[] => {
  const areas: SanctuaryArea[] = ['meditation', 'devotion', 'rest', 'garden'];
  
  return areas.map(area => {
    const areaPositions = positions.filter(p => p.area === area);
    const areaTrackers = trackers.filter(t => t.area === area);
    
    const totalTime = areaTrackers.reduce((sum, tracker) => {
      return sum + tracker.totalTime;
    }, 0);
    
    return {
      area,
      totalTime,
      activeUsers: areaPositions.length,
      lastUpdated: new Date().toISOString(),
      decayRate: 3600 // 1 hora = 3600 segundos de decaimento quando vazio
    };
  });
};

// Calcular decaimento das barrinhas
export const calculateDecay = (
  stats: SanctuaryAreaStats[],
  lastCalculation: Date
): SanctuaryAreaStats[] => {
  const now = new Date();
  const hoursPassed = (now.getTime() - lastCalculation.getTime()) / (1000 * 60 * 60);
  
  return stats.map(stat => {
    if (stat.activeUsers === 0) {
      // Se não há usuários, aplicar decaimento
      const decayAmount = stat.decayRate * hoursPassed;
      const newTotalTime = Math.max(0, stat.totalTime - decayAmount);
      
      return {
        ...stat,
        totalTime: newTotalTime,
        lastUpdated: now.toISOString()
      };
    }
    
    return {
      ...stat,
      lastUpdated: now.toISOString()
    };
  });
};

// Converter segundos para formato de barrinha (0-100%)
export const secondsToPercentage = (seconds: number, maxSeconds: number = 3600): number => {
  return Math.min(100, (seconds / maxSeconds) * 100);
};

// Formatar tempo para exibição
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Verificar se player tem posição válida
export const hasValidPosition = (position?: SanctuaryPosition | null): boolean => {
  if (!position) return false;
  return position.row >= 0 && position.row < 6 && position.col >= 0 && position.col < 6;
};