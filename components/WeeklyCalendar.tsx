import React, { useState } from 'react';
// AJOUT DES EXTENSIONS POUR LE CHARGEMENT BROWSER
import { PrepTask, ShiftType } from '../types.ts';
import { SHIFTS, CATEGORY_COLORS } from '../constants.ts';
import { formatDuration } from '../utils.ts';
import { isBefore, addMinutes, isAfter, isSameDay, addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WeeklyCalendarProps {
  tasks: PrepTask[];
  currentTime: Date;
  onAddTask: (dayIndex: number, shift: ShiftType) => void;
  onEditTask: (task: PrepTask) => void;
  onDeleteTask: (id: string) => void;
  onDuplicateTask: (task: PrepTask) => void;
  onMoveTask: (taskId: string, newDate: Date, newShift: ShiftType) => void;
  weekStartDate: Date;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ 
  tasks, 
  currentTime, 
  onAddTask, 
  onEditTask, 
  onDeleteTask, 
  onDuplicateTask, 
  onMoveTask, 
  weekStartDate 
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ dayIdx: number, shiftId: string } | null>(null);

  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    
    const ghost = (e.currentTarget as HTMLElement).cloneNode(true) as HTMLElement;
    ghost.style.opacity = '0.5';
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 20, 20);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e: React.DragEvent, dayIdx: number, shiftId: string) => {
    e.preventDefault();
    setDropTarget({ dayIdx, shiftId });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, dayIdx: number, shiftId: ShiftType) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onMoveTask(taskId, weekDates[dayIdx], shiftId);
    }
    setDropTarget(null);
    setDraggedTaskId(null);
  };

  return (
    <div className="overflow-x-auto shadow-sm border rounded-xl bg-white">
      <table className="w-full border-collapse min-w-[800px] table-fixed">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-4 text-left font-semibold text-gray-600 w-24 border-r">Créneau</th>
            {weekDates.map((date) => (
              <th key={date.toString()} className="p-4 text-center border-r">
                <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                  {format(date, 'EEEE', { locale: fr })}
                </div>
                <div className="font-black text-gray-800 text-sm">
                  {format(date, 'dd MMM', { locale: fr })}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHIFTS.map((shift) => (
            <tr key={shift.id} className="border-b last:border-b-0 group">
              <td className="p-4 bg-gray-50 border-r font-medium text-gray-700 flex flex-col items-center justify-center min-h-[120px]">
                <span className="text-2xl mb-1">{shift.icon}</span>
                <span className="text-[10px] uppercase tracking-widest font-black">{shift.label}</span>
              </td>
              {weekDates.map((date, dayIdx) => {
                const dayTasks = tasks.filter(t => 
                  t.shift === shift.id && 
                  isSameDay(new Date(t.startTime), date)
                );

                const isOver = dropTarget?.dayIdx === dayIdx && dropTarget?.shiftId === shift.id;

                return (
                  <td 
                    key={dayIdx} 
                    onDragOver={(e) => handleDragOver(e, dayIdx, shift.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dayIdx, shift.id)}
                    className={`p-2 border-r align-top relative transition-all duration-200 ${
                      isOver ? 'bg-blue-100/50 ring-2 ring-inset ring-blue-400' : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col gap-2 h-full min-h-[100px]">
                      {dayTasks.map(task => {
                        const start = new Date(task.startTime);
                        const end = addMinutes(start, task.cookTime);
                        const isOngoing = isBefore(start, currentTime) && isAfter(end, currentTime);
                        const remainingSeconds = isOngoing ? Math.max(0, Math.floor((end.getTime() - currentTime.getTime()) / 1000)) : 0;
                        const isBeingDragged = draggedTaskId === task.id;

                        return (
                          <div 
                            key={task.id} 
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={() => setDraggedTaskId(null)}
                            className={`relative mb-1 group/task ${isBeingDragged ? 'opacity-30' : ''}`}
                          >
                            <div className="absolute -top-1.5 -right-1.5 flex gap-1 z-50 opacity-0 group-hover/task:opacity-100 transition-opacity">
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onDuplicateTask(task);
                                }}
                                className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg border border-white transition-transform active:scale-125"
                                title="Dupliquer"
                              >
                                <span className="text-[10px] leading-none pointer-events-none">📋</span>
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onDeleteTask(task.id);
                                }}
                                className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg border border-white transition-transform active:scale-125"
                                title="Supprimer"
                              >
                                <span className="text-[12px] font-black leading-none pointer-events-none">×</span>
                              </button>
                            </div>

                            <div 
                              onClick={() => onEditTask(task)}
                              className={`p-2 rounded-lg border text-xs cursor-grab active:cursor-grabbing shadow-sm transition-all select-none ${
                                isOngoing ? 'ring-2 ring-orange-400 border-orange-400 bg-orange-50' : CATEGORY_COLORS.prep
                              }`}
                            >
                              <div className="font-black uppercase tracking-tighter truncate mb-1 pr-10 text-gray-900">
                                {task.name}
                              </div>
                              
                              {isOngoing && (
                                <div className="mb-1 flex items-center gap-1 bg-orange-500 text-white px-1.5 py-0.5 rounded-[4px] text-[8px] font-black animate-pulse">
                                  <span>⌛</span>
                                  <span>{Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s</span>
                                </div>
                              )}

                              <div className="text-[9px] flex justify-between items-center opacity-80 font-bold">
                                <span className="truncate mr-1 text-gray-600 font-black">👤 {task.responsible}</span>
                                <span className={`whitespace-nowrap font-black ${isOngoing ? 'text-orange-700' : 'text-gray-600'}`}>🔥 {formatDuration(task.cookTime)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      <button 
                        onClick={() => onAddTask(dayIdx, shift.id)}
                        className="mt-auto w-full py-2 border-2 border-dashed border-gray-100 rounded-lg text-gray-300 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center group/add"
                      >
                        <span className="text-lg leading-none group-hover/add:scale-125 transition-transform">+</span>
                      </button>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-2 bg-gray-50 border-t text-[9px] text-gray-400 font-bold uppercase text-center tracking-widest">
        💡 Astuce : Utilisez 📋 pour dupliquer une fiche, puis faites-la glisser vers un autre jour
      </div>
    </div>
  );
};

export default WeeklyCalendar;