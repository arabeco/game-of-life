import { DayOfWeek } from '../types';

const MONTH_INDEX: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  março: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
};

export const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const isConfirmationText = (value: string): boolean =>
  /\b(sim|confirmar|confirma|pode|manda|fechar|aplicar|ok|beleza|vai|bora)\b/i.test(normalizeText(value));

export const isCancellationText = (value: string): boolean =>
  /\b(nao|não|cancelar|cancela|parar|para|deixa|deixa quieto)\b/i.test(normalizeText(value));

export const parseDurationMinutes = (text: string): number | null => {
  const durationText = normalizeText(text).replace(/\b(?:as|ass)\s*\d{1,2}(?::\d{2}|h\d{2}|h)?\b/g, ' ');
  const match = durationText.match(/\b(\d+)\s*(m|min|mins|minuto|minutos)\b/i);
  if (match) return parseInt(match[1], 10);

  const mixed = durationText.match(/\b(\d+)\s*(h|hora|horas)\s*(\d+)?\s*(m|min|mins|minuto|minutos)?\b/i);
  if (mixed) {
    const hours = parseInt(mixed[1], 10);
    const minutes = mixed[3] ? parseInt(mixed[3], 10) : 0;
    return (hours * 60) + minutes;
  }

  const matchHours = durationText.match(/\b(\d+)\s*(h|hora|horas)\b/i);
  if (matchHours) return parseInt(matchHours[1], 10) * 60;

  return null;
};

export const parseRepetitions = (text: string): number | null => {
  const match = text.match(/\b(\d+)\s*(x|vez|vezes)\b/i);
  return match ? parseInt(match[1], 10) : null;
};

export const parseTimeMinutes = (text: string): number | null => {
  const normalized = normalizeText(text).replace(/\s+/g, ' ');

  const match = normalized.match(/\b(?:as|ass)?\s*(\d{1,2})[:h](\d{2})\b/i);
  if (match) {
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    if (hour > 23 || minute > 59) return null;
    return (hour * 60) + minute;
  }

  const matchH = normalized.match(/\b(?:as|ass)?\s*(\d{1,2})h\b/i);
  if (matchH) {
    const hour = parseInt(matchH[1], 10);
    return hour <= 23 ? hour * 60 : null;
  }

  const matchPlainHour = normalized.match(/\b(?:as|ass)\s*(\d{1,2})\b/i);
  if (matchPlainHour) {
    const hour = parseInt(matchPlainHour[1], 10);
    return hour <= 23 ? hour * 60 : null;
  }

  if (/\b(de manha|demanha|manha|cedo)\b/.test(normalized)) return 9 * 60;
  if (/\btarde\b/.test(normalized)) return 14 * 60;
  if (/\b(noite|fim da tarde)\b/.test(normalized)) return 19 * 60;

  return null;
};

export const parseDaysOfWeek = (text: string): DayOfWeek[] => {
  const normalized = normalizeText(text);
  if (/\b(todo dia|todos os dias|diario|diaria)\b/.test(normalized)) {
    return ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
  }

  const days: DayOfWeek[] = [];
  if (normalized.match(/\b(seg|segunda)\b/)) days.push('SEG');
  if (normalized.match(/\b(ter|terca)\b/)) days.push('TER');
  if (normalized.match(/\b(qua|quarta)\b/)) days.push('QUA');
  if (normalized.match(/\b(qui|quinta)\b/)) days.push('QUI');
  if (normalized.match(/\b(sex|sexta)\b/)) days.push('SEX');
  if (normalized.match(/\b(sab|sabado)\b/)) days.push('SAB');
  if (normalized.match(/\b(dom|domingo)\b/)) days.push('DOM');
  return days;
};

const buildDateString = (year: number, month: number, day: number): string | null => {
  const candidate = new Date(year, month, day);
  if (
    Number.isNaN(candidate.getTime())
    || candidate.getFullYear() !== year
    || candidate.getMonth() !== month
    || candidate.getDate() !== day
  ) {
    return null;
  }

  const yyyy = candidate.getFullYear();
  const mm = String(candidate.getMonth() + 1).padStart(2, '0');
  const dd = String(candidate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const parseDateFromText = (text: string, now: Date = new Date()): string | null => {
  const normalized = normalizeText(text);

  if (/\bhoje\b/.test(normalized)) {
    return buildDateString(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (/\bamanha\b/.test(normalized)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return buildDateString(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  }

  const isoMatch = normalized.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    return buildDateString(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
  }

  const brMatch = normalized.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10) - 1;
    let year = brMatch[3] ? parseInt(brMatch[3], 10) : now.getFullYear();
    if (year < 100) year += 2000;

    const currentYearCandidate = buildDateString(year, month, day);
    if (currentYearCandidate && !brMatch[3]) {
      const currentDate = new Date(currentYearCandidate);
      const baseline = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (currentDate < baseline) {
        return buildDateString(year + 1, month, day);
      }
    }

    return currentYearCandidate;
  }

  const monthNameMatch = normalized.match(/\b(\d{1,2})\s+de\s+([a-zç]+)(?:\s+de\s+(20\d{2}))?\b/);
  if (monthNameMatch) {
    const day = parseInt(monthNameMatch[1], 10);
    const month = MONTH_INDEX[monthNameMatch[2]];
    if (typeof month !== 'number') return null;

    const year = monthNameMatch[3] ? parseInt(monthNameMatch[3], 10) : now.getFullYear();
    const candidate = buildDateString(year, month, day);
    if (candidate && !monthNameMatch[3]) {
      const currentDate = new Date(candidate);
      const baseline = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (currentDate < baseline) {
        return buildDateString(year + 1, month, day);
      }
    }
    return candidate;
  }

  return null;
};

export const parseDifficulty = (text: string): number | null => {
  const numeric = text.match(/\b(?:dificuldade|nivel|nível)\s*(\d)\b/i);
  if (numeric) {
    const value = parseInt(numeric[1], 10);
    return value >= 1 && value <= 5 ? value : null;
  }

  const normalized = normalizeText(text);
  if (/\b(muito facil|muito facilzinha)\b/.test(normalized)) return 1;
  if (/\b(facil|leve)\b/.test(normalized)) return 2;
  if (/\b(normal|media|medio)\b/.test(normalized)) return 3;
  if (/\b(dificil|forte)\b/.test(normalized)) return 4;
  if (/\b(extremo|insano)\b/.test(normalized)) return 5;
  return null;
};

export const parsePriority = (text: string): 'alta' | 'media' | 'baixa' | null => {
  const normalized = normalizeText(text);
  if (/\bprioridade alta\b|\balta\b/.test(normalized)) return 'alta';
  if (/\bprioridade media\b|\bmedia\b/.test(normalized)) return 'media';
  if (/\bprioridade baixa\b|\bbaixa\b/.test(normalized)) return 'baixa';
  return null;
};

export const parseOrganizeMode = (text: string): 'leve' | 'padrao' | 'intenso' | null => {
  const normalized = normalizeText(text);
  if (/\bleve\b/.test(normalized)) return 'leve';
  if (/\b(intenso|agressivo|forte)\b/.test(normalized)) return 'intenso';
  if (/\b(padrao|padrão|normal)\b/.test(normalized)) return 'padrao';
  return null;
};

export const formatTimeLabel = (minutes: number): string => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const formatDateLabel = (date: string): string => {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const formatDaysLabel = (days: DayOfWeek[]): string =>
  days.join(', ');
