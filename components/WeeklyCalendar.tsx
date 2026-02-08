import React, { useState } from 'react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrepTask, ShiftType } from '../types.ts';

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

const formatDuration = (minutes: number) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  }
  return `${minutes}m`;
};

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
  weekStartDate
}) => {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const shifts: ShiftType[] = ['Matin', 'Après-midi'];
  
  // État pour gérer l'affichage du menu d'actions sur mobile
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const toggleMenu = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === taskId ? null : taskId);
  };

  return (
    <div className="flex flex-col gap-6" onClick={() => setActiveMenuId(null)}>
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
            {/* Header du Jour */}
            <div className={`px-5 py-4 flex justify-between items-center ${isToday ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-900'}`}>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest opacity-80">{dayName}</span>
                <span className="text-lg font-black">{format(currentDayDate, 'dd MMMM', { locale: fr })}</span>
              </div>
              {isToday && <span className="bg-white text-blue-600 text-[10px] font-black px-2 py-1 rounded-full uppercase">Aujourd'hui</span>}
            </div>

            {/* Grille Matin / Après-midi */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {shifts.map((shift) => {
                const shiftTasks = tasks.filter(
                  (t) => isSameDay(parseISO(t.startTime.toString()), currentDayDate) && t.shift === shift
                );

                return (
                  <div key={shift} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {shift === 'Matin' ? '☀️ Matin' : '🌙 Après-midi'}
                      </h4>
                      <button
                        onClick={() => onAddTask(dayIdx, shift)}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-blue-600 shadow-sm active:scale-90"
                      >
                        <span className="text-xl font-bold">+</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {shiftTasks.length === 0 ? (
                        <p className="text-[10px] text-gray-400 italic py-2 text-center">Aucune tâche</p>
                      ) : (
                        shiftTasks.map((task) => (
                          <div
                            key={task.id}
                            className="relative"
                          >
                            <div
                              onClick={(e) => toggleMenu(e, task.id)}
                              className={`bg-white p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                activeMenuId === task.id ? 'border-blue-500 shadow-md scale-[1.02]' : 'border-gray-100 shadow-sm active:bg-gray-50'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-black text-gray-900 text-sm uppercase leading-tight">
                                  {task.name}
                                </span>
                                <span className="bg-gray-100 text-[9px] font-black px-2 py-1 rounded text-gray-500">
                                  {format(parseISO(task.startTime.toString()), 'HH:mm')}
                                </span>
                              </div>
                              
                              <div className="mt-3 flex items-center justify-between border-t pt-2 border-gray-50">
                                <span className="text-[10px] font-bold text-gray-400 truncate max-w-[100px]">
                                  👤 {task.responsible}
                                </span>
                                <span className="text-[10px] font-black text-blue-600">
                                  🔥 {formatDuration(task.cookTime)}
                                </span>
                              </div>
                            </div>

                            {/* MENU D'ACTIONS RAPIDES (Spécifique Mobile/Tablette) */}
                            {activeMenuId === task.id && (
                              <div className="absolute right-0 top-0 mt-2 mr-2 z-20 bg-white border-2 border-blue-500 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <button 
                                  onClick={() => { onEditTask(task); setActiveMenuId(null); }}
                                  className="px-4 py-3 text-[10px] font-black uppercase hover:bg-gray-50 border-b flex items-center gap-2"
                                >
                                  ✏️ Modifier
                                </button>
                                <button 
                                  onClick={() => { onDuplicateTask(task); setActiveMenuId(null); }}
                                  className="px-4 py-3 text-[10px] font-black uppercase hover:bg-gray-50 border-b flex items-center gap-2"
                                >
                                  👯 Dupliquer
                                </button>
                                <button 
                                  onClick={() => { onDeleteTask(task.id); setActiveMenuId(null); }}
                                  className="px-4 py-3 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 flex items-center gap-2"
                                >
                                  🗑️ Supprimer
                                </button>
                              </div>
                            )}
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