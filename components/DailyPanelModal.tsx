
import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { XIcon, LightbulbIcon } from './Icons';
import { Portal } from './Portal';
import { DailyPanelContent } from './DailyPanelContent';
import { getOperationalDateString, shiftLocalDateString } from '../utils/operationalDay.js';

export const DailyPanelModal: React.FC<{ onClose: () => void; selectedDate?: string | null }> = ({ onClose, selectedDate }) => {
    const today = getOperationalDateString();
    const [date, setDate] = useState(selectedDate || today);
    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="daily-review-modal w-full max-w-md m-4 rounded-3xl flex flex-col h-[min(760px,90dvh)] overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="relative flex items-center justify-center p-4 border-b border-white/10 shrink-0">
                        <div className="flex items-center space-x-2">
                            <LightbulbIcon className="w-6 h-6 accent-text" />
                            <h2 className="text-lg font-bold uppercase tracking-wider text-center">Resumo Diário</h2>
                        </div>
                        <button aria-label="Fechar" onClick={onClose} className="absolute right-4 p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                    </div>
                    <nav className="daily-review-date-nav" aria-label="Data do resumo">
                        <button aria-label="Resumo do dia anterior" onClick={() => setDate(shiftLocalDateString(date, -1))}>← Anterior</button>
                        <button onClick={() => setDate(today)} disabled={date === today}>Hoje</button>
                        <button aria-label="Resumo do dia seguinte" onClick={() => setDate(shiftLocalDateString(date, 1))} disabled={date >= today}>Seguinte →</button>
                    </nav>
                    <div className="flex-1 min-h-0 overflow-hidden p-3">
                        <DailyPanelContent fillHeight key={date} onClose={onClose} selectedDateOverride={date} />
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
