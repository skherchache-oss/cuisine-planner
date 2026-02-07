
export type ShiftType = 'morning' | 'afternoon' | 'evening';

export interface PrepTask {
  id: string;
  name: string;
  responsible: string;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  packingTime: number; // in minutes
  shelfLifeDays: number; // in days
  startTime: string; // ISO Date String
  dayOfWeek: number; // 0 (Mon) to 6 (Sun)
  shift: ShiftType;
  color: string;
  comments?: string;
}

export interface WeeklyData {
  weekId: string; // YYYY-WW
  tasks: PrepTask[];
}

export enum TaskType {
  PREPARATION = 'Préparation',
  CUISSON = 'Cuisson',
  CONDITIONNEMENT = 'Conditionnement'
}
