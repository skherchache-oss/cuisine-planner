
import { ShiftType } from './types';

export const DAYS_FR = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi'
];

export const SHIFTS: { id: ShiftType; label: string; icon: string }[] = [
  { id: 'morning', label: 'Matin', icon: '☀️' },
  { id: 'afternoon', label: 'Après-midi', icon: '🌤️' },
  { id: 'evening', label: 'Soir', icon: '🌙' }
];

export const CATEGORY_COLORS = {
  prep: 'bg-blue-100 border-blue-300 text-blue-800',
  cook: 'bg-orange-100 border-orange-300 text-orange-800',
  pack: 'bg-green-100 border-green-300 text-green-800',
};

export const STAFF_LIST = [
  'Camille',
  'Evan',
  'Bruce',
  'Autre'
];
