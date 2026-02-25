import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { Portal } from './Portal';

interface DatePickerModalProps {
    selectedDate: Date | null;
    onSelect: (date: Date) => void;
    onClose: () => void;
    title?: string;
    minDate?: Date;
    maxDate?: Date;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({ 
    selectedDate, 
    onSelect, 
    onClose, 
    title = "Selecionar Data",
    minDate,
    maxDate 
}) => {
    const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
    
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
        const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        
        // Dias da semana
        weekDays.forEach((day, index) => {
            days.push(
                <div key={`weekday-${index}-${day}`} className="text-center text-xs font-bold text-gray-400 p-2">
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
            const isSelected = selectedDate && 
                currentDate.getDate() === selectedDate.getDate() &&
                currentDate.getMonth() === selectedDate.getMonth() &&
                currentDate.getFullYear() === selectedDate.getFullYear();
            
            // Verificar se está dentro dos limites
            const isDisabled = (minDate && currentDate < minDate) || (maxDate && currentDate > maxDate);
            
            days.push(
                <button
                    key={`day-${day}`}
                    onClick={() => handleDateSelect(day)}
                    disabled={isDisabled}
                    className={`p-2 text-sm font-bold rounded-lg transition-colors ${
                        isSelected 
                            ? 'bg-[var(--bronze)] text-white' 
                            : isToday
                            ? 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50'
                            : isDisabled
                            ? 'text-gray-500 cursor-not-allowed'
                            : 'hover:bg-white/10 text-gray-300'
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
            <GlassCard variant="bronze" className="w-full max-w-sm m-4 rounded-3xl p-0">
                <div className="dossier-bg p-4 rounded-3xl">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase">{title}</h3>
                        <button onClick={onClose} className="p-2 rounded-full border border-white/20 hover:bg-white/10">
                            <XIcon className="w-4 h-4 text-gray-300" />
                        </button>
                    </div>
                    
                    {/* Month Navigation */}
                    <div className="flex justify-between items-center mb-4">
                        <button 
                            onClick={handlePreviousMonth}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeftIcon className="w-4 h-4 text-gray-300" />
                        </button>
                        <h4 className="text-lg font-bold text-white">{formatMonth(currentMonth)}</h4>
                        <button 
                            onClick={handleNextMonth}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <ChevronRightIcon className="w-4 h-4 text-gray-300" />
                        </button>
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {renderCalendarDays()}
                    </div>
                    
                    {/* Selected Date Display */}
                    {selectedDate && (
                        <div className="mt-4 p-3 bg-black/20 rounded-xl text-center">
                            <p className="text-xs text-gray-400">Data selecionada</p>
                            <p className="text-sm font-bold text-white">
                                {selectedDate.toLocaleDateString('pt-BR', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
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
