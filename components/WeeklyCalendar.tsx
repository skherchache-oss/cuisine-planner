import React from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrepTask, ShiftType } from '../types';

interface WeeklyCalendarProps {
  tasks: PrepTask[];
  currentTime: Date;
  onAddTask: (dayIdx: number, shift: ShiftType) => void;
  onEditTask: (task: PrepTask) => void;
  onDeleteTask: (id: string) => void;
  onDuplicateTask: (task: PrepTask) => void;
  onMoveTask: (taskId: string, newDate: Date, newShift: ShiftType) => void;
  weekStartDate: Date;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  tasks,
  onAddTask,
  onEditTask,
  weekStartDate
}) => {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const shifts: ShiftType[] = ['Matin', 'Après-midi'];

  return (
    <div className="flex flex-col gap-6">
      {days.map((dayName, dayIdx) => {
        const currentDayDate = addDays(weekStartDate, dayIdx);
        const isToday = isSameDay(currentDayDate, new Date());

        return (
          <div 
            key={dayName} 
            className={`rounded-3xl border-2 transition-all ${
              isToday ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 bg-white'
            } overflow-hidden shadow-sm`}
          >
            {/* Header du jour */}
            <div className={`px-5 py-4 flex justify-between items-center ${isToday ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-900'}`}>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest opacity-80">{dayName}</span>
                <span className="text-lg font-black">{format(currentDayDate, 'dd MMMM', { locale: fr })}</span>
              </div>
              {isToday && <span className="bg-white text-blue-600 text-[10px] font-black px-2 py-1 rounded-full uppercase">Aujourd'hui</span>}
            </div>

            {/* Grille des shifts */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {shifts.map((shift) => {
                // CORRECTION : Filtrage par date exacte pour éviter les répétitions hebdomadaires
                const shiftTasks = tasks.filter(
                  (t) => isSameDay(new Date(t.startTime), currentDayDate) && t.shift === shift
                );

                return (
                  <div key={shift} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {shift === 'Matin' ? '☀️ Matin' : '🌙 Après-midi'}
                      </h4>
                      <button
                        onClick={() => onAddTask(dayIdx, shift)}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-blue-600 shadow-sm active:scale-90 transition-transform"
                      >
                        <span className="text-xl font-bold">+</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {shiftTasks.length === 0 ? (
                        <p className="text-[10px] text-gray-400 italic py-2">Aucune tâche</p>
                      ) : (
                        shiftTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => onEditTask(task)}
                            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm active:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-black text-gray-900 text-sm uppercase leading-tight">
                                {task.name}
                              </span>
                              <span className="bg-gray-100 text-[9px] font-black px-2 py-1 rounded text-gray-500 whitespace-nowrap">
                                {format(new Date(task.startTime), 'HH:mm')}
                              </span>
                            </div>
                            
                            <div className="mt-3 flex items-center justify-between border-t pt-2 border-gray-50">
                              <span className="text-[10px] font-bold text-gray-400">
                                👤 {task.responsible}
                              </span>
                              <span className="text-[10px] font-black text-blue-600">
                                {task.cookTime} min
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyCalendar;