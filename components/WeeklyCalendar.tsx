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
      className={`relative select-none transition-all ${isBeingDragged ? 'opacity-20 scale-95' : 'opacity-100'}`}
      draggable={!isMobile}
      onDragStart={!isMobile && onDragStart ? (e) => onDragStart(e, task.id) : undefined}
      onDragEnd={!isMobile && onDragEnd ? (e) => onDragEnd(e, task.id) : undefined}
    >
      <div 
        onClick={() => onEdit(task)}
        className={`p-4 rounded-2xl border-2 shadow-sm active:scale-[0.98] transition-transform bg-white ${
          isOngoing ? 'border-orange-400 ring-4 ring-orange-50' : 'border-slate-100'
        }`}
      >
        <div className="flex justify-between items-start gap-3 mb-3">
          <h4 className="font-black text-[14px] uppercase tracking-tight text-slate-800 flex-1 leading-snug">
            {task.name}
          </h4>
          <span className="text-[11px] font-black bg-slate-900 text-white px-2 py-1 rounded-md shrink-0">
            {format(start, 'HH:mm')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
             <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
               👤 {task.responsible}
             </span>
             <span className="text-[11px] font-black text-blue-600 flex items-center gap-1">
               ⏱️ {formatDuration(task.cookTime)}
             </span>
          </div>
          
          {/* Actions discrètes en bas à droite sur Mobile */}
          <div className="flex gap-2 items-center">
            <button 
              onClick={(e) => { e.stopPropagation(); onDuplicate(task); }}
              className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 border border-slate-100 active:bg-blue-100 active:text-blue-600"
            >
              📋
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 border border-slate-100 active:bg-red-100 active:text-red-600 font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {isOngoing && (
          <div className="mt-3 bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-full w-fit animate-pulse">
            🔥 EN COURS
          </div>
        )}
      </div>
    </div>
  );
};

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ 
  tasks, currentTime, onAddTask, onEditTask, onDeleteTask, onDuplicateTask, onMoveTask, weekStartDate 
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ dayIdx: number, shiftId: string } | null>(null);

  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));

  // Styles spécifiques par service pour mobile
  const getShiftStyles = (shiftId: string) => {
    switch(shiftId) {
      case 'morning': return { bg: 'bg-blue-50/50', text: 'text-blue-700', border: 'border-blue-100', icon: '☀️' };
      case 'afternoon': return { bg: 'bg-emerald-50/50', text: 'text-emerald-700', border: 'border-emerald-100', icon: '🌤️' };
      case 'evening': return { bg: 'bg-indigo-50/50', text: 'text-indigo-700', border: 'border-indigo-100', icon: '🌙' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', icon: '📅' };
    }
  };

  return (
    <div className="w-full">
      {/* MOBILE VIEW */}
      <div className="md:hidden">
        {/* Navigation des jours tactile */}
        <div className="sticky top-0 z-40 bg-[#F8FAFC]/90 backdrop-blur-md pt-2 pb-4">
          <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar">
            {weekDates.map((date, idx) => {
              const active = selectedDayIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`flex-1 min-w-[75px] py-3 rounded-2xl flex flex-col items-center transition-all border-2 shadow-sm ${
                    active ? 'bg-slate-900 border-slate-900 text-white scale-105' : 'bg-white border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{format(date, 'EEE', { locale: fr })}</span>
                  <span className="text-lg font-black">{format(date, 'dd')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste des Shifts Mobile */}
        <div className="px-4 space-y-8 mt-2">
          {SHIFTS.map((shift) => {
            const styles = getShiftStyles(shift.id);
            const shiftTasks = tasks
              .filter(t => t.shift === shift.id && isSameDay(parseISO(t.startTime), weekDates[selectedDayIdx]))
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={shift.id} className={`rounded-[2.5rem] p-5 border-2 ${styles.border} ${styles.bg}`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{styles.icon}</span>
                    <h3 className={`font-black text-[13px] uppercase tracking-widest ${styles.text}`}>
                      {shift.label}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold opacity-50 uppercase">{shiftTasks.length} tâches</span>
                </div>

                <div className="space-y-4">
                  {shiftTasks.map(task => (
                    <TaskCard key={task.id} task={task} currentTime={currentTime} isMobile onEdit={onEditTask} onDuplicate={onDuplicateTask} onDelete={onDeleteTask} />
                  ))}
                  
                  <button 
                    onClick={() => onAddTask(selectedDayIdx, shift.id as ShiftType)}
                    className={`w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 font-black text-[11px] uppercase transition-colors bg-white/50 ${styles.border} ${styles.text}`}
                  >
                    <span>+</span> AJOUTER AU {shift.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DESKTOP VIEW (Inchangée pour la stabilité sur ordi) */}
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
                  return (
                    <td key={`${dayIdx}-${shift.id}`} className="border-r last:border-r-0 align-top">
                      <div className="p-3 flex flex-col gap-3 min-h-[150px]">
                        {dayTasks.map(task => (
                          <TaskCard key={task.id} task={task} currentTime={currentTime} onEdit={onEditTask} onDuplicate={onDuplicateTask} onDelete={onDeleteTask} />
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