import { getOperationalDateString } from './operationalDay.js';

export const parseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

export const daysBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

export const formatDate = (dateStr: string) => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const getCycleTimingSummary = (startDateStr: string, endDateStr: string, todayDateStr?: string) => {
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);
    const today = parseDate(todayDateStr || getOperationalDateString());
    const totalDays = Math.max(1, daysBetween(startDate, endDate) + 1);
    const isUpcoming = today.getTime() < startDate.getTime();
    const daysUntilStart = isUpcoming ? Math.max(1, daysBetween(today, startDate)) : 0;
    const elapsedDays = isUpcoming
        ? 0
        : Math.max(0, Math.min(totalDays, daysBetween(startDate, today)));
    const displayDay = isUpcoming ? 0 : Math.max(1, Math.min(totalDays, elapsedDays + 1));
    const timeProgress = isUpcoming ? 0 : Math.min(100, (elapsedDays / totalDays) * 100);

    return {
        startDate,
        endDate,
        today,
        totalDays,
        elapsedDays,
        timeProgress,
        isUpcoming,
        daysUntilStart,
        statusLabel: isUpcoming
            ? (daysUntilStart === 1 ? 'Começa amanhã' : `Começa em ${daysUntilStart} dias`)
            : `Dia ${displayDay}/${totalDays}`,
        inclusiveLabel: 'Conta o dia inicial e o dia final.',
    };
};

export { getScoreGrade } from './cycleGrade.js';
