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
      className={`relative group/task select-none transition-all ${isBeingDragged ? 'scale-90 opacity-20' : 'opacity-100'} ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="absolute -top-1.5 -right-1.5 flex gap-1 z-20">
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onDuplicate(task); }}
          className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white text-[10px] active:scale-125 md:opacity-0 md:group-hover/task:opacity-100 transition-opacity"
          title="Dupliquer"
        >📋</button>
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white text-xs active:scale-125 md:opacity-0 md:group-hover/task:opacity-100 transition-opacity"
          title="Supprimer"
        >×</button>
      </div>

      <div 
        onClick={() => onEdit(task)}
        className={`p-3.5 rounded-2xl border-2 shadow-sm transition-all active:scale-[0.98] ${
          isOngoing ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-100 shadow-orange-100' : 'border-blue-100 bg-white group-hover/task:border-blue-300'
        }`}
      >
        <div className="flex justify-between items-start mb-2.5 pr-10">
          <span className="font-black uppercase tracking-tight text-[11px] text-gray-900 leading-tight break-words flex-1 pr-2">
            {task.name}
          </span>
          <span className="text-[10px] font-black bg-gray-100 px-2 py-0.5 rounded-lg text-gray-600 whitespace-nowrap">
            {format(start, 'HH:mm')}
          </span>
        </div>
        
        {isOngoing && (
          <div className="mb-2.5 flex items-center gap-1.5 bg-orange-500 text-white px-2.5 py-1 rounded-full text-[9px] font-black animate-pulse w-fit shadow-sm">
            <span className="text-[10px]">🔥</span> EN COURS
          </div>
        )}

        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-gray-400 truncate max-w-[80px]">👤 {task.responsible}</span>
          <div className="flex items-center gap-1 text-blue-700">
            <span className="font-black">⏱️ {formatDuration(task.cookTime)}</span>
          </div>
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
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
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
      {/* MOBILE VIEW */}
      <div className="block md:hidden space-y-4">
        <div className="sticky top-[84px] z-40 bg-gray-50/95 backdrop-blur-sm py-2 -mx-4 px-4 overflow-x-auto">
          <div className="flex justify-between items-center gap-1">
            {weekDates.map((date, idx) => {
              const isActive = selectedDayIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all border-2 ${
                    isActive ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="text-[8px] font-black uppercase">{format(date, 'EEE', { locale: fr })}</span>
                  <span className="text-sm font-black">{format(date, 'dd')}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {SHIFTS.map((shift) => {
            const shiftTasks = tasks
              .filter(t => t.shift === shift.id && isSameDay(parseISO(t.startTime), weekDates[selectedDayIdx]))
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={shift.id} className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                  <span className="text-lg">{shift.icon}</span> {shift.label}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {shiftTasks.map(task => (
                    <TaskCard key={task.id} task={task} currentTime={currentTime} isMobile onEdit={onEditTask} onDuplicate={onDuplicateTask} onDelete={onDeleteTask} />
                  ))}
                  <button onClick={() => onAddTask(selectedDayIdx, shift.id)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] bg-white/50">
                    + AJOUTER {shift.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DESKTOP VIEW */}
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
                        <button onClick={() => onAddTask(dayIdx, shift.id)} className="w-full py-2 border-2 border-dashed border-slate-100 rounded-xl text-slate-200 hover:border-blue-200 hover:text-blue-400 transition-all font-black text-xl">
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