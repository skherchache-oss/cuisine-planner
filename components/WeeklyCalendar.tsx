import React, { useState } from 'react';
import { PrepTask, ShiftType } from '../types';
import { SHIFTS } from '../constants';
import { formatDuration } from '../utils';
import { isBefore, addMinutes, isAfter, isSameDay, addDays, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// ... (Garder TaskCard identique à ton code précédent)

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ 
  tasks, currentTime, onAddTask, onEditTask, onDeleteTask, onDuplicateTask, onMoveTask, weekStartDate 
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ dayIdx: number, shiftId: string } | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));

  // --- LOGIQUE DRAG & DROP (Garder identique) ---

  return (
    <div className="w-full">
      {/* VUE MOBILE : OPTIMISÉE POUR PETITS ÉCRANS */}
      <div className="block md:hidden space-y-4 pb-12">
        {/* Navigation des jours compacte */}
        <div className="sticky top-[84px] z-40 bg-white/95 backdrop-blur-md py-3 -mx-4 px-4 shadow-sm">
          <div className="flex justify-between items-center gap-1">
            {weekDates.map((date, idx) => {
              const isActive = selectedDayIdx === idx;
              const hasTasks = tasks.some(t => isSameDay(parseISO(t.startTime), date));
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all border-2 ${
                    isActive 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105' 
                      : 'bg-white border-gray-100 text-gray-500'
                  }`}
                >
                  <span className={`text-[8px] font-black uppercase ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                    {format(date, 'EEE', { locale: fr }).replace('.', '')}
                  </span>
                  <span className="text-sm font-black">{format(date, 'dd')}</span>
                  {hasTasks && !isActive && <div className="w-1 h-1 bg-blue-400 rounded-full mt-0.5"></div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Titre du jour sélectionné */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black uppercase text-gray-900">
            {format(weekDates[selectedDayIdx], 'EEEE dd MMMM', { locale: fr })}
          </h2>
        </div>

        {/* Liste des shifts mobile */}
        <div className="space-y-6">
          {SHIFTS.map((shift) => {
            const shiftTasks = tasks
              .filter(t => t.shift === shift.id && isSameDay(parseISO(t.startTime), weekDates[selectedDayIdx]))
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={shift.id} className="bg-gray-50 rounded-3xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-[11px] font-black uppercase text-gray-400 tracking-tighter">
                  <span className="text-xl">{shift.icon}</span> {shift.label}
                  <div className="ml-auto bg-gray-200 text-gray-600 px-2 py-0.5 rounded-lg text-[9px]">
                    {shiftTasks.length}
                  </div>
                </div>
                
                <div className="grid gap-3">
                  {shiftTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      currentTime={currentTime} 
                      isMobile 
                      onEdit={onEditTask}
                      onDuplicate={onDuplicateTask}
                      onDelete={onDeleteTask}
                    />
                  ))}
                  <button 
                    onClick={() => onAddTask(selectedDayIdx, shift.id)} 
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold text-xs bg-white/50"
                  >
                    + AJOUTER {shift.label.toUpperCase()}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VUE DESKTOP (Garder identique) */}
      <div className="hidden md:block">
        {/* ... ton code desktop table ... */}
      </div>
    </div>
  );
};