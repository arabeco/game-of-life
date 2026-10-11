import React from 'react';
import { Cycle } from '../types';
import { useCartaoDoCiclo } from '../hooks/useCartaoDoCiclo';
import { CycleSummaryCard } from './CycleSummaryCard';

interface MiniCycleHUDProps {
    cycle: Cycle;
}

export const MiniCycleHUD: React.FC<MiniCycleHUDProps> = ({ cycle }) => {
    // A mesma fonte do cartao da Ativos e do widget (hooks/useCartaoDoCiclo).
    const cartao = useCartaoDoCiclo(cycle);

    if (!cartao) return null;

    return (
        <div className="flex justify-center">
            <CycleSummaryCard
                rank={cartao.rank}
                cycleSummary={cartao.cycleSummary}
                onOpenHistory={() => window.dispatchEvent(new CustomEvent('tutorialNavigate', {
                    detail: { view: 'arenas', showReports: true },
                }))}
            />
        </div>
    );
};
