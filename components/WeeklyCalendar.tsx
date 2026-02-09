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
      className={`relative select-none transition-all ${isBeingDragged ? 'scale-90 opacity-20' : 'opacity-100'}`}
      draggable={!isMobile}
      onDragStart={!isMobile && onDragStart ? (e) => onDragStart(e, task.id) : undefined}
      onDragEnd={!isMobile && onDragEnd ? (e) => onDragEnd(e, task.id) : undefined}
    >
      <div 
        onClick={() => onEdit(task)}
        className={`p-4 rounded-2xl border-2 shadow-sm transition-all active:scale-[0.98] bg-white ${
          isOngoing ? 'border-orange-400 ring-2 ring-orange-100' : 'border-slate-100 hover:border-blue-200'
        }`}
      >
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <h4 className="font-black uppercase tracking-tight text-[13px] text-slate-900 leading-tight mb-1">
              {task.name}
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-blue-600 italic">
                {format(start, 'HH:mm')}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                👤 {task.responsible}
              </span>
            </div>
          </div>

          <div className="flex gap-1.5 shrink-0 ml-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onDuplicate(task); }}
              className="w-7 h-7 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center border border-slate-100 active:bg-blue-600 active:text-white transition-colors"
            >
              <span className="text-[10px]">📋</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="w-7 h-7 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center border border-slate-100 active:bg-red-600 active:text-white transition-colors"
            >
              <span className="text-xs">✕</span>
            </button>
          </div>
        </div>

        {isOngoing && (
          <div className="mt-2 flex items-center gap-1.5 bg-orange-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black animate-pulse w-fit">
            EN COURS
          </div>
        )}
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

  // Couleurs demandées pour les blocs mobile
  const getShiftBgColor = (shiftId: string) => {
    switch (shiftId) {
      case 'morning': return 'bg-orange-50/50';
      case 'afternoon': return 'bg-blue-50/50';
      case 'evening': return 'bg-green-50/50';
      default: return 'bg-slate-50/50';
    }
  };

  return (
    <div className="w-full">
      {/* --- VERSION MOBILE --- */}
      <div className="md:hidden space-y-4 pb-20">
        <div className="sticky top-0 z-40 bg-[#F8FAFC]/95 backdrop-blur-sm py-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
          {weekDates.map((date, idx) => {
            const active = selectedDayIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedDayIdx(idx)}
                className={`flex-1 min-w-[65px] py-2.5 rounded-2xl flex flex-col items-center border-2 transition-all ${
                  active ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-tighter">{format(date, 'EEE', { locale: fr })}</span>
                <span className="text-base font-black">{format(date, 'dd')}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-6 px-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {SHIFTS.map((shift) => {
            const shiftTasks = tasks
              .filter(t => t.shift === shift.id && isSameDay(parseISO(t.startTime), weekDates[selectedDayIdx]))
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={shift.id} className={`p-4 rounded-[2rem] border border-slate-100/50 space-y-4 ${getShiftBgColor(shift.id)}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{shift.icon}</span>
                  <h3 className="font-black text-[12px] uppercase tracking-[0.2em] text-slate-500">
                    {shift.label}
                  </h3>
                  <div className="h-[1px] flex-1 bg-slate-200/50"></div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {shiftTasks.map(task => (
                    <TaskCard key={task.id} task={task} currentTime={currentTime} isMobile onEdit={onEditTask} onDuplicate={onDuplicateTask} onDelete={onDeleteTask} />
                  ))}
                  
                  <button 
                    onClick={() => onAddTask(selectedDayIdx, shift.id as ShiftType)}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 text-slate-400 font-black text-[10px] uppercase tracking-widest active:bg-slate-100 transition-colors"
                  >
                    + Ajouter au {shift.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- VERSION ORDINATEUR (NON TOUCHÉE) --- */}
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
                        <button onClick={() => onAddTask(dayIdx, shift.id as ShiftType)} className="w-full py-2 border-2 border-dashed border-slate-100 rounded-xl text-slate-200 hover:text-blue-400 transition-all font-black text-xl">
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