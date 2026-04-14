import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { Portal } from './Portal';

interface DatePickerModalProps {
    selectedDate: Date | null;
    initialDate?: Date | null;
    onSelect: (date: Date) => void;
    onClose: () => void;
    title?: string;
    minDate?: Date;
    maxDate?: Date;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({ 
    selectedDate, 
    initialDate,
    onSelect, 
    onClose, 
    title = "Selecionar Data",
    minDate,
    maxDate 
}) => {
    const effectiveSelectedDate = selectedDate || initialDate || null;
    const [currentMonth, setCurrentMonth] = useState(effectiveSelectedDate || new Date());
    
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };
    
    const formatMonth = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    };
    
    const handlePreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };
    
    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };
    
    const handleDateSelect = (day: number) => {
        const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        
        // Verificar se está dentro dos limites
        if (minDate && selected < minDate) return;
        if (maxDate && selected > maxDate) return;
        
        onSelect(selected);
        onClose();
    };
    
    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const days = [];
        const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
        
        // Dias da semana
        weekDays.forEach((day, index) => {
            days.push(
                <div key={`weekday-${index}-${day}`} className="px-1 py-2 text-center text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                    {day}
                </div>
            );
        });
        
        // Dias vazios antes do primeiro dia do mês
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }
        
        // Dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isToday = currentDate.getTime() === today.getTime();
            const isSelected = effectiveSelectedDate && 
                currentDate.getDate() === effectiveSelectedDate.getDate() &&
                currentDate.getMonth() === effectiveSelectedDate.getMonth() &&
                currentDate.getFullYear() === effectiveSelectedDate.getFullYear();
            
            // Verificar se está dentro dos limites
            const isDisabled = (minDate && currentDate < minDate) || (maxDate && currentDate > maxDate);
            
            days.push(
                <button
                    key={`day-${day}`}
                    onClick={() => handleDateSelect(day)}
                    disabled={isDisabled}
                    className={`min-h-[2.65rem] rounded-xl border text-sm font-black transition-all ${
                        isSelected 
                            ? 'border-[var(--skin-accent-color)]/40 bg-[var(--skin-accent-color)] text-black shadow-[0_8px_24px_rgba(0,0,0,0.24)]' 
                            : isToday
                            ? 'border-sky-400/25 bg-sky-500/12 text-sky-200 hover:bg-sky-500/18'
                            : isDisabled
                            ? 'border-transparent text-gray-600 cursor-not-allowed opacity-50'
                            : 'border-white/6 bg-black/10 text-gray-200 hover:border-white/12 hover:bg-white/8'
                    }`}
                >
                    {day}
                </button>
            );
        }
        
        return days;
    };
    
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };
    
    return (
        <Portal>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in" onClick={handleBackdropClick}>
            <GlassCard variant="bronze" className="w-full max-w-md m-4 rounded-[2rem] p-0">
                <div className="dossier-bg rounded-[2rem] p-4">
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--skin-accent-color)]">Calendario</p>
                            <h3 className="mt-1 text-base font-black tracking-[0.04em] text-white">{title}</h3>
                        </div>
                        <button onClick={onClose} className="rounded-full border border-white/12 bg-white/5 p-2 transition-colors hover:bg-white/10">
                            <XIcon className="w-4 h-4 text-gray-300" />
                        </button>
                    </div>
                    
                    {/* Month Navigation */}
                    <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-2 py-2">
                        <button 
                            onClick={handlePreviousMonth}
                            className="rounded-xl p-2 transition-colors hover:bg-white/10"
                        >
                            <ChevronLeftIcon className="w-4 h-4 text-gray-300" />
                        </button>
                        <h4 className="text-sm font-black uppercase tracking-[0.14em] text-white">{formatMonth(currentMonth)}</h4>
                        <button 
                            onClick={handleNextMonth}
                            className="rounded-xl p-2 transition-colors hover:bg-white/10"
                        >
                            <ChevronRightIcon className="w-4 h-4 text-gray-300" />
                        </button>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                const date = new Date();
                                date.setHours(0, 0, 0, 0);
                                if ((minDate && date < minDate) || (maxDate && date > maxDate)) return;
                                onSelect(date);
                                onClose();
                            }}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-gray-200 transition-colors hover:bg-white/10"
                        >
                            Hoje
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const date = new Date();
                                date.setHours(0, 0, 0, 0);
                                date.setDate(date.getDate() + 7);
                                if ((minDate && date < minDate) || (maxDate && date > maxDate)) return;
                                onSelect(date);
                                onClose();
                            }}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-gray-200 transition-colors hover:bg-white/10"
                        >
                            +7 dias
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const date = new Date();
                                date.setHours(0, 0, 0, 0);
                                date.setDate(date.getDate() + 30);
                                if ((minDate && date < minDate) || (maxDate && date > maxDate)) return;
                                onSelect(date);
                                onClose();
                            }}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-gray-200 transition-colors hover:bg-white/10"
                        >
                            +30 dias
                        </button>
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                        {renderCalendarDays()}
                    </div>
                    
                    {/* Selected Date Display */}
                    {effectiveSelectedDate && (
                        <div className="mt-4 rounded-2xl border border-[var(--skin-accent-color)]/16 bg-[var(--skin-accent-color)]/8 p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--skin-accent-color)]/85">Data selecionada</p>
                            <p className="mt-1 text-sm font-bold text-white">
                                {effectiveSelectedDate.toLocaleDateString('pt-BR', { 
                                    day: '2-digit', 
                                    month: 'long', 
                                    year: 'numeric',
                                    weekday: 'short'
                                })}
                            </p>
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
        </Portal>
    );
};
