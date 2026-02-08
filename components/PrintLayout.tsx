import React from 'react';
import { PrepTask } from '../types';
import { SHIFTS } from '../constants';
import { calculateExpiry } from '../utils';
import { addDays, isSameDay, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintLayoutProps {
  tasks: PrepTask[];
  weekLabel: string;
  weekStartDate: Date;
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ tasks, weekLabel, weekStartDate }) => {
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));

  // Contenu d'une carte de tâche (réutilisé pour éviter la duplication)
  const TaskCard = ({ task }: { task: PrepTask }) => {
    const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
    return (
      <div className="border border-slate-300 p-3 rounded-lg bg-white shadow-sm flex flex-col gap-1 mb-2">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded w-fit">
              {format(parseISO(task.startTime), 'HH:mm')}
            </span>
            <span className="text-[9px] font-bold text-rose-600 mt-1">
              DLC: {format(expiry, 'dd/MM HH:mm')}
            </span>
          </div>
          <span className="font-black uppercase text-xs text-slate-900 text-right flex-1 ml-4">
            {task.name}
          </span>
        </div>

        <div className="flex justify-between text-[10px] font-bold text-slate-600">
          <span>👤 {task.responsible}</span>
          <span>⏱️ {task.cookTime} min</span>
        </div>

        {task.comments && (
          <div className="mt-2 text-[10px] text-slate-700 italic border-l-4 border-blue-500 pl-2 py-1 bg-blue-50/50 rounded-r">
            <strong>Notes:</strong> {task.comments}
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-dashed border-slate-200 flex justify-between gap-4">
          <div className="flex-1 border-b-2 border-slate-200 h-6 flex items-end">
            <span className="text-[8px] text-slate-400 font-bold uppercase">N° Lot</span>
          </div>
          <div className="w-16 border-b-2 border-slate-200 h-6 flex items-end justify-center">
            <span className="text-[8px] text-slate-400 font-bold uppercase">T° Cœur</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white">
      {/* 1. VUE MOBILE : S'affiche uniquement sur petit écran (cards) */}
      <div className="block md:hidden p-4">
        <h1 className="text-xl font-black text-slate-900 mb-1">BISTROT M</h1>
        <p className="text-xs font-bold text-slate-500 mb-4 uppercase">{weekLabel}</p>
        
        {weekDates.map((date) => (
          <div key={date.toString()} className="mb-8">
            <h2 className="bg-slate-900 text-white p-2 rounded-t-lg font-black uppercase text-sm">
              {format(date, 'EEEE dd MMMM', { locale: fr })}
            </h2>
            <div className="border-2 border-t-0 border-slate-900 rounded-b-lg p-2 bg-slate-50">
              {SHIFTS.map(shift => {
                const dayTasks = tasks.filter(t => 
                  t.shift === shift.id && isSameDay(parseISO(t.startTime), date)
                );
                if (dayTasks.length === 0) return null;
                return (
                  <div key={shift.id} className="mt-2">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2">
                      {shift.icon} {shift.label}
                    </div>
                    {dayTasks.map(task => <TaskCard key={task.id} task={task} />)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 2. VUE TABLEAU (PDF & DESKTOP) : Cachée sur mobile mais utilisée pour l'export */}
      <div 
        id="print-area" 
        className="hidden md:block" 
        style={{ width: '287mm', padding: '10mm', margin: '0 auto' }}
      >
        <div className="flex justify-between items-end mb-4 border-b-2 border-slate-900 pb-2">
          <h1 className="text-2xl font-black text-slate-900 uppercase">BISTROT M</h1>
          <div className="bg-slate-900 text-white px-4 py-1.5 rounded font-black text-sm uppercase">
            {weekLabel}
          </div>
        </div>

        <table className="w-full border-collapse border-2 border-slate-900 table-fixed">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-400 w-[60px] p-2 text-[10px] font-black uppercase">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border border-slate-400 p-2 text-center uppercase">
                  <div className="text-sm font-black">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[10px] text-slate-500">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border border-slate-400 bg-slate-50 p-2 text-center align-middle">
                  <div className="text-xl">{shift.icon}</div>
                  <div className="text-[8px] font-bold text-slate-500 uppercase">{shift.label}</div>
                </td>
                {weekDates.map((date, idx) => (
                  <td key={idx} className="border border-slate-300 p-2 align-top bg-white min-h-[150px]">
                    {tasks
                      .filter(t => t.shift === shift.id && isSameDay(parseISO(t.startTime), date))
                      .map(task => <TaskCard key={task.id} task={task} />)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-4 text-[9px] font-black text-slate-900 uppercase">
          ⚠️ CONTRÔLE CRITIQUE : TEMPÉRATURES ET DLC OBLIGATOIRES.
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;