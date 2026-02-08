import React from 'react';
import { PrepTask } from '../types';
import { SHIFTS } from '../constants';
import { formatDuration, calculateExpiry } from '../utils';
import { addDays, isSameDay, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintLayoutProps {
  tasks: PrepTask[];
  weekLabel: string;
  weekStartDate: Date;
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ tasks, weekLabel, weekStartDate }) => {
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="bg-white text-black" style={{ width: '280mm', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* PLANNING SECTION */}
      <div className="p-[10mm] border-b-2 border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white px-4 py-2 text-2xl font-black rounded uppercase">BISTROT M</div>
            <div>
              <h1 className="text-sm font-black uppercase leading-tight">Registre de Production</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">HACCP & Traçabilité</p>
            </div>
          </div>
          <div className="border-2 border-black px-4 py-2 font-black text-sm uppercase">{weekLabel}</div>
        </div>

        <table className="w-full border-collapse border-2 border-black table-fixed">
          <thead>
            <tr className="bg-gray-100 text-[10px] uppercase font-black">
              <th className="border-2 border-black p-2 w-[60px]">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border-2 border-black p-2 text-center">
                  <div className="text-[12px]">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[9px] text-gray-500">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border-2 border-black p-2 bg-gray-50 text-center">
                  <div className="text-2xl">{shift.icon}</div>
                  <div className="text-[8px] font-black uppercase">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => t.shift === shift.id && isSameDay(parseISO(t.startTime), date));
                  return (
                    <td key={dayIdx} className="border-2 border-black p-2 align-top bg-white h-[100px]">
                      <div className="flex flex-col gap-2">
                        {dayTasks.map(task => (
                          <div key={task.id} className="border border-gray-300 p-1.5 rounded-md">
                            <div className="font-black uppercase text-[9px] border-b pb-1 mb-1">{task.name}</div>
                            <div className="text-[8px] flex justify-between font-bold">
                              <span>👤 {task.responsible}</span>
                              <span>⏱️ {formatDuration(task.cookTime)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NEW PAGE: INSTRUCTIONS */}
      <div className="p-[10mm]" style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2 border-b-4 border-black pb-2">
          <span>📋 Fiches Techniques & Instructions</span>
        </h2>
        <div className="grid grid-cols-2 gap-6">
          {sortedTasks.map((task) => (
            <div key={task.id} className="border-2 border-black rounded-lg overflow-hidden" style={{ pageBreakInside: 'avoid' }}>
              <div className="bg-gray-900 text-white p-2 flex justify-between items-center">
                <span className="font-black uppercase text-[10px]">{task.name}</span>
                <span className="text-[8px] opacity-70">{format(parseISO(task.startTime), 'EEEE dd MMM', { locale: fr })}</span>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-[7px] font-black text-gray-400 uppercase">Chef</p>
                    <p className="text-[9px] font-bold">{task.responsible}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-[7px] font-black text-gray-400 uppercase">DLC</p>
                    <p className="text-[9px] font-bold">{format(calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays), 'dd/MM HH:mm')}</p>
                  </div>
                </div>
                <div className="bg-blue-50/50 p-2 rounded border border-blue-100 min-h-[60px]">
                  <p className="text-[7px] font-black text-blue-400 uppercase mb-1">Instructions</p>
                  <p className="text-[10px] leading-tight italic">{task.comments || "Suivre le protocole standard."}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="border-b border-black h-4 flex items-end text-[6px] text-gray-400">LOT:</div>
                  <div className="border-b border-black h-4 flex items-end text-[6px] text-gray-400">T° REF:</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;