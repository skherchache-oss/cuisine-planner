import React, { useState } from 'react';
import { PrepTask, ShiftType } from '../types';
import { SHIFTS } from '../constants';
import { formatDuration } from '../utils';
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

interface TaskCardProps {
  task: PrepTask;
  currentTime: Date;
  isMobile?: boolean;
  isBeingDragged?: boolean;
  onEdit: (task: PrepTask) => void;
  onDuplicate: (task: PrepTask) => void;
  onDelete: (id: string) => void;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDragEnd?: (e: React.DragEvent, taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  currentTime, 
  isMobile = false, 
  isBeingDragged = false,
  onEdit, 
  onDuplicate, 
  onDelete,
  onDragStart,
  onDragEnd
}) => {
  const start = new Date(task.startTime);
  const end = addMinutes(start, task.cookTime);
  const isOngoing = isBefore(start, currentTime) && isAfter(end, currentTime);

  return (
    <div 
      id={`task-${task.id}`}
      draggable={!isMobile}
      onDragStart={!isMobile && onDragStart ? (e) => onDragStart(e, task.id) : undefined}
      onDragEnd={!isMobile && onDragEnd ? (e) => onDragEnd(e, task.id) : undefined}
      className={`relative group/task select-none transition-all ${isBeingDragged ? 'scale-90 opacity-20' : 'opacity-100'} ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="absolute -top-1.5 -right-1.5 flex gap-1 z-20">
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onDuplicate(task); }}
          className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white text-[9px] active:scale-125 md:opacity-0 md:group-hover/task:opacity-100 transition-opacity"
        >📋</button>
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white text-xs active:scale-125 md:opacity-0 md:group-hover/task:opacity-100 transition-opacity"
        >×</button>
      </div>

      <div 
        onClick={() => onEdit(task)}
        className={`p-2 sm:p-3.5 rounded-2xl border-2 shadow-sm transition-all active:scale-[0.98] ${
          isOngoing ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-100' : 'border-blue-50 bg-white group-hover/task:border-blue-200'
        }`}
      >
        <div className="flex justify-between items-start mb-1 sm:mb-2.5 pr-8">
          <span className="font-black uppercase tracking-tight text-[10px] sm:text-[11px] text-gray-900 leading-tight truncate">
            {task.name}
          </span>
          <span className="text-[9px] font-black bg-gray-50 px-1.5 py-0.5 rounded text-gray-500">
            {format(start, 'HH:mm')}
          </span>
        </div>
        
        {isOngoing && (
          <div className="mb-2 flex items-center gap-1 bg-orange-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black animate-pulse w-fit">
            🔥 EN COURS
          </div>
        )}

        <div className="flex justify-between items-center text-[9px] font-bold">
          <span className="text-gray-400 truncate max-w-[80px]">👤 {task.responsible.split(' ')[0]}</span>
          <span className={`${isOngoing ? 'text-orange-700' : 'text-blue-700'}`}>⏱️ {task.cookTime}m</span>
        </div>
      </div>
    </div>
  );
};

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
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  // Limité à 5 jours (Lundi à Vendredi)
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    const el = document.getElementById(`task-${taskId}`);
    if (el) setTimeout(() => { el.style.opacity = '0.3'; }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(null);
    setDropTarget(null);
    const el = document.getElementById(`task-${taskId}`);
    if (el) el.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, dayIdx: number, shiftId: string) => {
    e.preventDefault();
    if (dropTarget?.dayIdx !== dayIdx || dropTarget?.shiftId !== shiftId) {
      setDropTarget({ dayIdx, shiftId });
    }
  };

  const handleDrop = (e: React.DragEvent, dayIdx: number, shiftId: ShiftType) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) onMoveTask(taskId, weekDates[dayIdx], shiftId);
    setDropTarget(null);
    setDraggedTaskId(null);
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* VUE MOBILE : Jours en une ligne sans scroll horizontal */}
      <div className="block md:hidden">
        <div className="bg-white border rounded-[2rem] p-1 mb-6 flex justify-between items-center gap-1 shadow-sm">
          {weekDates.map((date, idx) => {
            const isActive = selectedDayIdx === idx;
            const count = tasks.filter(t => isSameDay(new Date(t.startTime), date)).length;
            return (
              <button
                key={idx}
                onClick={() => setSelectedDayIdx(idx)}
                className={`flex-1 flex flex-col items-center py-3 rounded-2xl transition-all relative ${
                  isActive ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400'
                }`}
              >
                <span className={`text-[8px] font-black uppercase mb-1 ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>
                  {format(date, 'EEE', { locale: fr })}
                </span>
                <span className="text-sm font-black tracking-tighter">{format(date, 'dd')}</span>
                {count > 0 && !isActive && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Détail du jour sélectionné */}
        <div className="space-y-8">
          {SHIFTS.map((shift) => {
            const shiftTasks = tasks
              .filter(t => t.shift === shift.id && isSameDay(new Date(t.startTime), weekDates[selectedDayIdx]))
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={shift.id} className="space-y-4">
                <div className="flex items-center gap-2 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] ml-2">
                  <span>{shift.icon}</span> {shift.label}
                  <div className="h-px bg-gray-100 flex-1"></div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {shiftTasks.map(task => (
                    <TaskCard key={task.id} task={task} currentTime={currentTime} isMobile onEdit={onEditTask} onDuplicate={onDuplicateTask} onDelete={onDeleteTask} />
                  ))}
                  <button onClick={() => onAddTask(selectedDayIdx, shift.id)} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-300 font-black text-xs bg-white/50">
                    + Ajouter {shift.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VUE DESKTOP (Lundi-Vendredi) */}
      <div className="hidden md:block overflow-hidden shadow-sm border rounded-[2.5rem] bg-white">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 w-24 border-r text-[10px] font-black uppercase text-gray-300">Service</th>
              {weekDates.map((date) => (
                <th key={date.toString()} className="p-4 text-center border-r last:border-r-0">
                  <div className="text-[10px] uppercase font-black text-gray-400 mb-1">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="font-black text-gray-900 text-base">{format(date, 'dd MMM')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map((shift) => (
              <tr key={shift.id} className="border-b last:border-b-0">
                <td className="p-4 bg-gray-50/30 border-r text-center">
                  <div className="text-2xl mb-1">{shift.icon}</div>
                  <div className="text-[9px] uppercase font-black text-gray-400">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => t.shift === shift.id && isSameDay(new Date(t.startTime), date));
                  const isOver = dropTarget?.dayIdx === dayIdx && dropTarget?.shiftId === shift.id;
                  return (
                    <td 
                      key={`${dayIdx}-${shift.id}`} 
                      onDragOver={(e) => handleDragOver(e, dayIdx, shift.id)}
                      onDragLeave={() => setDropTarget(null)}
                      onDrop={(e) => handleDrop(e, dayIdx, shift.id)}
                      className={`border-r last:border-r-0 align-top p-2 min-h-[160px] transition-colors ${isOver ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className="flex flex-col gap-2">
                        {dayTasks.map(task => (
                          <TaskCard key={task.id} task={task} currentTime={currentTime} isBeingDragged={draggedTaskId === task.id} onEdit={onEditTask} onDuplicate={onDuplicateTask} onDelete={onDeleteTask} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
                        ))}
                        <button onClick={() => onAddTask(dayIdx, shift.id)} className="w-full py-2 border-2 border-dashed border-gray-50 rounded-xl text-gray-200 hover:text-blue-300 hover:border-blue-200 transition-all font-black text-xl">+</button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyCalendar;