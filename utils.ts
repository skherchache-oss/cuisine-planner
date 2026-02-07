
import { format, addDays, addMinutes, startOfWeek, addWeeks, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const getWeekId = (date: Date): string => {
  return format(date, 'yyyy-ww');
};

export const getWeekDates = (weekOffset: number = 0): Date[] => {
  const start = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  // Retourne seulement 5 jours (Lundi à Vendredi)
  return Array.from({ length: 5 }, (_, i) => addDays(start, i));
};

export const calculateExpiry = (startTime: string, cookTime: number, shelfLife: number): Date => {
  const start = parseISO(startTime);
  return addDays(addMinutes(start, cookTime), shelfLife);
};

export const formatDuration = (mins: number): string => {
  if (mins <= 0) return '0mn';
  if (mins < 60) return `${mins}mn`;
  
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
};
