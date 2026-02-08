import React, { useState } from 'react';
import { PrepTask, ShiftType } from '../types';
import { SHIFTS } from '../constants';
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
  const start = parseISO(task.startTime);
  const end = addMinutes(start, task.cookTime);
  const isOngoing = isBefore(start, currentTime) && isAfter(end, currentTime);

  return (
    <div 
      id={`task-${task.id}`}
      draggable={!isMobile}
      onDragStart={!isMobile && onDragStart ? (e) => onDragStart(e, task.id) : undefined}
      onDragEnd={!isMobile && onDragEnd ? (e) => onDragEnd(e, task.id) : undefined}
      className={`relative group/task select-none transition-all ${isBeingDragged ? 'scale-95 opacity-50' : 'opacity-100'} ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {/* Boutons d'action rapides */}
      <div className="absolute -top-1 -right-1 flex gap-1 z-20">
        <button 
          onClick={(e) => { e.stopPropagation(); onDuplicate(task); }}
          className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md border border-white text-[8px] active:scale-125"
        >📋</button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md border border-white text-[10px] active:scale-125"
        >✕</button>
      </div>

      <div 
        onClick={() => onEdit(task)}
        className={`p-2.5 rounded-xl border-2 transition-all shadow-sm ${
          isOngoing ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-100 animate-pulse' : 'border-slate-100 bg-white hover:border-blue-200'
        }`}
      >
        <div className="flex justify-between items-start mb-1 gap-1">
          <span className="font-black uppercase text-[10px] text-slate-800 leading-tight truncate flex-1">
            {task.name}
          </span>
          <span className="text-[8px] font-black bg-slate-100 px-1 py-0.5 rounded text-slate-500 whitespace-nowrap">
            {format(start, 'HH:mm')}
          </span>
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-[8px] font-bold text-slate-400 truncate max-w-[60px]">👤 {task.responsible}</span>
          <span className={`text-[8px] font-black ${isOngoing ? 'text-orange-600' : 'text-blue-600'}`}>
            {isOngoing ? 'EN COURS' : `⏱️ ${task.cookTime}m`}
          </span>
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

  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDrop = (e: React.DragEvent, dayIdx: number, shiftId: ShiftType) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) onMoveTask(taskId, weekDates[dayIdx], shiftId);
    setDropTarget(null);
    setDraggedTaskId(null);
  };

  return (
    <div className="w-full">
      {/* VUE MOBILE */}
      <div className="md:hidden space-y-6">
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-1.5 flex justify-between gap-1 shadow-sm">
          {weekDates.map((date, idx) => {
            const isActive = selectedDayIdx === idx;
            // Filtrage précis pour le point bleu (uniquement si tâches réelles)
            const dayTasksCount = tasks.filter(t => isSameDay(parseISO(t.startTime), date)).length;
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedDayIdx(idx)}
                className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all relative ${
                  isActive ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span className={`text-[7px] font-black uppercase mb-0.5 ${isActive ? 'text-blue-400' : ''}`}>
                  {format(date, 'EEE', { locale: fr })}
                </span>
                <span className="text-sm font-black tracking-tighter">{format(date, 'dd')}</span>
                
                {/* POINT BLEU : Uniquement s'il y a des tâches et que le jour n'est pas actif */}
                {dayTasksCount > 0 && !isActive && (
                  <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full border border-white shadow-sm"></span>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-8">
          {SHIFTS.map((shift) => {
            const shiftTasks = tasks
              .filter(t => t.shift === shift.id && isSameDay(parseISO(t.startTime), weekDates[selectedDayIdx]))
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={shift.id} className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <span className="text-lg">{shift.icon}</span>
                  <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">{shift.label}</span>
                  <div className="h-[1px] bg-slate-100 flex-1"></div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 px-1">
                  {shiftTasks.map(task => (
                    <TaskCard key={task.id} task={task} currentTime={currentTime} isMobile onEdit={onEditTask} onDuplicate={onDuplicateTask} onDelete={onDeleteTask} />
                  ))}
                  <button 
                    onClick={() => onAddTask(selectedDayIdx, shift.id)} 
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-300 font-black text-[10px] uppercase bg-white/50 active:bg-slate-50 transition-colors"
                  >
                    + Ajouter {shift.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VUE DESKTOP */}
      <div className="hidden md:block overflow-hidden border-2 border-slate-100 rounded-[2rem] bg-white shadow-xl">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-4 w-28 border-r border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Service</th>
              {weekDates.map((date) => (
                <th key={date.toString()} className="p-4 text-center border-r border-slate-100 last:border-r-0">
                  <div className="text-[9px] uppercase font-black text-blue-500 mb-1">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="font-black text-slate-900 text-lg">{format(date, 'dd MMM')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map((shift) => (
              <tr key={shift.id} className="border-b border-slate-100 last:border-b-0">
                <td className="p-4 bg-slate-50/20 border-r border-slate-100 text-center">
                  <div className="text-3xl mb-1">{shift.icon}</div>
                  <div className="text-[8px] uppercase font-black text-slate-400 tracking-tighter">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => t.shift === shift.id && isSameDay(parseISO(t.startTime), date));
                  const isOver = dropTarget?.dayIdx === dayIdx && dropTarget?.shiftId === shift.id;
                  
                  return (
                    <td 
                      key={`${dayIdx}-${shift.id}`} 
                      onDragOver={(e) => { e.preventDefault(); setDropTarget({dayIdx, shiftId: shift.id}); }}
                      onDragLeave={() => setDropTarget(null)}
                      onDrop={(e) => handleDrop(e, dayIdx, shift.id)}
                      className={`border-r border-slate-100 last:border-r-0 align-top p-3 min-h-[180px] transition-all ${isOver ? 'bg-blue-50/60' : ''}`}
                    >
                      <div className="flex flex-col gap-3">
                        {dayTasks.map(task => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            currentTime={currentTime} 
                            isBeingDragged={draggedTaskId === task.id} 
                            onEdit={onEditTask} 
                            onDuplicate={onDuplicateTask} 
                            onDelete={onDeleteTask} 
                            onDragStart={handleDragStart} 
                            onDragEnd={() => setDraggedTaskId(null)} 
                          />
                        ))}
                        <button 
                          onClick={() => onAddTask(dayIdx, shift.id)} 
                          className="w-full py-3 border-2 border-dashed border-slate-100 rounded-xl text-slate-200 hover:text-blue-400 hover:border-blue-200 hover:bg-blue-50/30 transition-all font-black text-2xl"
                        >+</button>
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