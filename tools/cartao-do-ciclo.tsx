/**
 * O CARTAO DO CICLO DO APP (o de Ativos e Arenas), de verdade, em tres notas —
 * para comparar com tools/widget-ciclo.html. As barras saem da mesma receita
 * (constants/barrasDoCiclo.ts). `npm run bancada` e abra /cartao-do-ciclo.html
 */
import '../index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CycleSummaryCard } from '../components/CycleSummaryCard';

const resumo = (progress: number, timeProgress: number) => ({
    name: 'Ciclo de Outubro', startDate: '2026-10-05', endDate: '2026-10-11',
    totalCompleted: Math.round(progress * 0.86), totalPlanned: 86, progress,
    elapsedDays: 4, timeProgress, statusLabel: 'Dia 5/7',
});

createRoot(document.getElementById('root')!).render(
    <main style={{ display: 'grid', gap: 22, maxWidth: 480 }}>
        {[['A', 75, 40], ['C', 30, 70], ['SS', 95, 90]].map(([nota, p, t]) => (
            <section key={nota as string}>
                <div style={{ fontSize: 11, letterSpacing: '.14em', color: '#7d8ea3', marginBottom: 6 }}>NOTA {nota}</div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <CycleSummaryCard rank={nota as string} cycleSummary={resumo(p as number, t as number)} onOpenHistory={() => {}} />
                </div>
            </section>
        ))}
    </main>,
);
