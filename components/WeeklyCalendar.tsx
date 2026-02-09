import React, { useState } from 'react';
import { PrepTask, ShiftType } from '../types';
import { SHIFTS } from '../constants';
import { formatDuration } from '../utils';
import { isBefore, addMinutes, isAfter, isSameDay, addDays, format, parseISO } from 'date-fns';
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
  task, currentTime, isMobile = false, isBeingDragged = false,
  onEdit, onDuplicate, onDelete, onDragStart, onDragEnd
}) => {
  const start = parseISO(task.startTime);
  const end = addMinutes(start, task.cookTime);
  const isOngoing = isBefore(start, currentTime) && isAfter(end, currentTime);

  return (
    <div 
      id={`task-${task.id}`}
      draggable={!isMobile}
      onDragStart={!isMobile && onDragStart ? (e) => onDragStart(e, task.id) : undefined}
      onDragEnd={!isMobile && onDragEnd ? (e) => onDragEnd(e, task.id) : undefined}
      className={`relative group/task select-none transition-all ${isBeingDragged ? 'scale-90 opacity-20' : 'opacity-100'} ${isMobile ? 'w-full' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {/* Boutons d'action rapides */}
      <div className="absolute -top-1 -right-1 flex gap-1 z-20">
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onDuplicate(task); }}
          className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-125 transition-transform"
        >
          📋
        </button>
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-125 transition-transform"
        >
          ×
        </button>
      </div>

      <div 
        onClick={() => onEdit(task)}
        className={`p-4 rounded-2xl border-2 shadow-sm transition-all active:scale-[0.98] ${
          isOngoing ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-100' : 'border-slate-100 bg-white'
        }`}
      >
        <div className="flex justify-between items-start mb-3">
          <span className="font-black uppercase tracking-tight text-[13px] text-slate-900 leading-tight flex-1 pr-8">
            {task.name}
          </span>
          <span className="text-[11px] font-black bg-slate-100 px-2 py-1 rounded-lg text-slate-600">
            {format(start, 'HH:mm')}
          </span>
        </div>
        
        {isOngoing && (
          <div className="mb-3 flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse w-fit">
            🔥 EN COURS
          </div>
        )}

        <div className="flex justify-between items-center text-[11px] font-bold border-t border-slate-50 pt-3">
          <span className="text-slate-400">👤 {task.responsible}</span>
          <span className="text-blue-700 font-black">⏱️ {formatDuration(task.cookTime)}</span>
        </div>
      </div>
    </div>
  );
};

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ 
  tasks, currentTime, onAddTask, onEditTask, onDeleteTask, onDuplicateTask, onMoveTask, weekStartDate 
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ dayIdx: number, shiftId: string } | null>(null);

  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDropTarget(null);
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
  };

  return (
    <div className="w-full">
      {/* VUE MOBILE : UN JOUR APRÈS L'AUTRE */}
      <div className="block md:hidden px-4 space-y-10 py-4">
        {weekDates.map((date, dayIdx) => (
          <div key={dayIdx} className="space-y-6">
            {/* Titre du jour séparé */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-lg">
                <span className="text-[10px] font-black uppercase block leading-none opacity-60">
                  {format(date, 'EEEE', { locale: fr })}
                </span>
                <span className="text-xl font-black">{format(date, 'dd')}</span>
              </div>
              <div className="h-[2px] flex-1 bg-slate-200 rounded-full"></div>
            </div>

            {/* Services Matin / Après-midi / Soir */}
            <div className="space-y-8 pl-2">
              {SHIFTS.map((shift) => {
                const shiftTasks = tasks
                  .filter(t => t.shift === shift.id && isSameDay(parseISO(t.startTime), date))
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div key={shift.id} className="relative border-l-2 border-slate-100 pl-6">
                    {/* Indicateur de service */}
                    <div className="absolute -left-[9px] top-0 bg-white p-1">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-slate-100"></div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">{shift.icon}</span>
                      <h3 className="font-black text-[12px] uppercase tracking-tighter text-slate-500">
                        SERVICE {shift.label}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {shiftTasks.map(task => (
                        <TaskCard key={task.id} task={task} currentTime={currentTime} isMobile onEdit={onEditTask} onDuplicate={onDuplicateTask} onDelete={onDeleteTask} />
                      ))}
                      
                      <button 
                        onClick={() => onAddTask(dayIdx, shift.id as ShiftType)} 
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] bg-slate-50 active:bg-slate-100 transition-colors"
                      >
                        + AJOUTER AU {shift.label}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* VUE DESKTOP (Inchangée mais optimisée) */}
      <div className="hidden md:block overflow-hidden shadow-sm border rounded-[2rem] bg-white">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="p-4 text-center w-24 border-r">
                <span className="text-[10px] font-black uppercase text-slate-300">Shift</span>
              </th>
              {weekDates.map((date) => (
                <th key={date.toString()} className="p-4 text-center border-r last:border-r-0">
                  <div className="text-[10px] uppercase font-black text-slate-400 mb-1">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="font-black text-slate-900 text-base">{format(date, 'dd MMM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map((shift) => (
              <tr key={shift.id} className="border-b last:border-b-0">
                <td className="p-4 bg-slate-50/30 border-r text-center">
                  <div className="text-2xl mb-1">{shift.icon}</div>
                  <div className="text-[9px] uppercase font-black text-slate-500">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => t.shift === shift.id && isSameDay(parseISO(t.startTime), date));
                  const isOver = dropTarget?.dayIdx === dayIdx && dropTarget?.shiftId === shift.id;
                  
                  return (
                    <td 
                      key={`${dayIdx}-${shift.id}`} 
                      onDragOver={(e) => handleDragOver(e, dayIdx, shift.id)}
                      onDrop={(e) => handleDrop(e, dayIdx, shift.id as ShiftType)}
                      className={`border-r last:border-r-0 align-top transition-colors ${isOver ? 'bg-blue-50' : ''}`}
                    >
                      <div className="p-3 flex flex-col gap-3 min-h-[180px]">
                        {dayTasks.map(task => (
                          <TaskCard 
                            key={task.id} task={task} currentTime={currentTime} 
                            isBeingDragged={draggedTaskId === task.id}
                            onEdit={onEditTask} onDuplicate={onDuplicateTask} onDelete={onDeleteTask}
                            onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                          />
                        ))}
                        <button onClick={() => onAddTask(dayIdx, shift.id as ShiftType)} className="w-full py-2 border-2 border-dashed border-slate-100 rounded-xl text-slate-200 hover:border-blue-200 hover:text-blue-400 transition-all font-black text-xl">
                          +
                        </button>
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