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
      className={`relative group/task select-none transition-all ${isBeingDragged ? 'scale-95 opacity-50' : 'opacity-100'}`}
    >
      <div className="absolute -top-2 -right-1 flex gap-2 z-20">
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onDuplicate(task); }}
          className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white text-xs active:scale-150"
        >📋</button>
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white text-sm active:scale-150"
        >✕</button>
      </div>

      <div 
        onClick={() => onEdit(task)}
        className={`p-5 rounded-2xl border-2 transition-all shadow-md ${
          isOngoing ? 'border-orange-500 bg-orange-50 ring-4 ring-orange-100' : 'border-slate-100 bg-white'
        }`}
      >
        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="font-black uppercase text-[14px] text-slate-900 leading-tight">
            {task.name}
          </span>
          <span className="text-[11px] font-black bg-slate-900 text-white px-2 py-1 rounded-md whitespace-nowrap">
            {format(start, 'HH:mm')}
          </span>
        </div>
        
        <div className="flex justify-between items-center mt-3 border-t border-slate-50 pt-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">👤 {task.responsible}</span>
          <span className={`text-[11px] font-black flex items-center gap-1 ${isOngoing ? 'text-orange-600 animate-pulse' : 'text-blue-600'}`}>
            {isOngoing ? '🔥 EN COURS' : `⏱️ ${task.cookTime}m`}
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

  return (
    <div className="w-full px-2">
      {/* VUE MOBILE : NAVIGATION SANS POINTS BLEUS */}
      <div className="md:hidden space-y-8">
        <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-1.5 flex justify-between gap-1 shadow-lg">
          {weekDates.map((date, idx) => {
            const isActive = selectedDayIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedDayIdx(idx)}
                className={`flex-1 flex flex-col items-center py-4 rounded-2xl transition-all ${
                  isActive ? 'bg-slate-900 text-white shadow-xl scale-[1.05] z-10' : 'text-slate-400'
                }`}
              >
                <span className={`text-[10px] font-black uppercase mb-1 ${isActive ? 'text-blue-400' : ''}`}>
                  {format(date, 'EEE', { locale: fr })}
                </span>
                <span className="text-xl font-black tracking-tighter leading-none">{format(date, 'dd')}</span>
              </button>
            );
          })}
        </div>

        {/* CONTENU MOBILE */}
        <div className="space-y-12 pb-16">
          {SHIFTS.map((shift) => {
            const shiftTasks = tasks
              .filter(t => t.shift === shift.id && isSameDay(parseISO(t.startTime), weekDates[selectedDayIdx]))
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={shift.id} className="space-y-5">
                <div className="flex items-center gap-4 px-1">
                  <span className="text-3xl">{shift.icon}</span>
                  <span className="font-black text-[13px] uppercase tracking-[0.25em] text-slate-400">{shift.label}</span>
                  <div className="h-0.5 bg-slate-200 flex-1 rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-1 gap-5">
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
                    className="w-full py-6 border-3 border-dashed border-slate-300 rounded-[2.5rem] text-slate-400 font-black text-[13px] uppercase bg-slate-50/50 active:bg-blue-50 active:text-blue-600 active:border-blue-300 transition-all shadow-inner"
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
      <div className="hidden md:block overflow-hidden border-2 border-slate-200 rounded-[2.5rem] bg-white shadow-2xl">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-100">
              <th className="p-6 w-32 border-r border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Service</th>
              {weekDates.map((date) => (
                <th key={date.toString()} className="p-6 text-center border-r border-slate-100 last:border-r-0">
                  <div className="text-[10px] uppercase font-black text-blue-500 mb-1">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="font-black text-slate-900 text-xl">{format(date, 'dd MMM')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map((shift) => (
              <tr key={shift.id} className="border-b border-slate-100 last:border-b-0">
                <td className="p-6 bg-slate-50/30 border-r border-slate-100 text-center">
                  <div className="text-4xl mb-2">{shift.icon}</div>
                  <div className="text-[10px] uppercase font-black text-slate-400">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => t.shift === shift.id && isSameDay(parseISO(t.startTime), date));
                  return (
                    <td key={`${dayIdx}-${shift.id}`} className="border-r border-slate-100 last:border-r-0 align-top p-4 min-h-[220px]">
                      <div className="flex flex-col gap-4">
                        {dayTasks.map(task => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            currentTime={currentTime} 
                            onEdit={onEditTask} 
                            onDuplicate={onDuplicateTask} 
                            onDelete={onDeleteTask} 
                          />
                        ))}
                        <button onClick={() => onAddTask(dayIdx, shift.id)} className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-slate-200 hover:text-blue-400 hover:border-blue-200 transition-all font-black text-3xl">+</button>
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