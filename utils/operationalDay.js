export const OPERATIONAL_DAY_CUTOFF_HOUR = 4;
export const OPERATIONAL_DAY_START_MINUTE = OPERATIONAL_DAY_CUTOFF_HOUR * 60;
export const OPERATIONAL_DAY_END_HOUR = OPERATIONAL_DAY_CUTOFF_HOUR + 24;
export const OPERATIONAL_DAY_TOTAL_MINUTES = 24 * 60;

export const formatLocalDateString = (date = new Date()) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

export const buildLocalDateFromString = (dateString, hour = 12, minute = 0) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, hour, minute, 0, 0);
};

export const shiftLocalDateString = (dateString, dayDelta) => {
    const nextDate = buildLocalDateFromString(dateString);
    nextDate.setDate(nextDate.getDate() + dayDelta);
    return formatLocalDateString(nextDate);
};

export const getOperationalDate = (date = new Date()) =>
    new Date(date.getTime() - (OPERATIONAL_DAY_START_MINUTE * 60 * 1000));

export const getOperationalDateString = (date = new Date()) =>
    formatLocalDateString(getOperationalDate(date));

export const isOperationalCarryoverMinute = (startTime) =>
    Number.isFinite(startTime) && startTime >= 0 && startTime < OPERATIONAL_DAY_START_MINUTE;

export const getTaskOperationalDateString = (task) => {
    if (!task?.date) return '';
    return isOperationalCarryoverMinute(task.startTime)
        ? shiftLocalDateString(task.date, -1)
        : task.date;
};

export const taskMatchesOperationalDate = (task, operationalDateString) =>
    getTaskOperationalDateString(task) === operationalDateString;

export const getTaskDisplayStartTime = (task, operationalDateString) => {
    if (!Number.isFinite(task?.startTime) || task.startTime < 0) return task?.startTime ?? -1;
    if (!taskMatchesOperationalDate(task, operationalDateString)) return task.startTime;
    return task.date !== operationalDateString
        ? task.startTime + (24 * 60)
        : task.startTime;
};

export const getOperationalDisplayMinutes = (date = new Date()) => {
    const baseMinutes = (date.getHours() * 60) + date.getMinutes();
    return date.getHours() < OPERATIONAL_DAY_CUTOFF_HOUR
        ? baseMinutes + (24 * 60)
        : baseMinutes;
};

export const getActualDateStringForOperationalMinutes = (operationalDateString, displayMinutes) =>
    displayMinutes >= (24 * 60)
        ? shiftLocalDateString(operationalDateString, 1)
        : operationalDateString;

export const getActualStartTimeForOperationalMinutes = (displayMinutes) =>
    displayMinutes >= (24 * 60)
        ? displayMinutes - (24 * 60)
        : displayMinutes;
