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

  return (
    <div className="w-full bg-white overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 landscape; margin: 3mm; }
          body { margin: 0; -webkit-print-color-adjust: exact; font-family: 'Inter', sans-serif; }
          #print-area { 
            width: 270mm !important; 
            margin: 0 auto !important;
            padding: 5mm !important;
          }
        }
        #print-area {
          width: 270mm;
          min-height: 185mm;
          box-sizing: border-box;
          background: white;
          color: black;
          overflow: hidden;
        }
        .task-card {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      `}} />

      <div id="print-area" className="mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-3 border-b-2 border-black pb-2">
          <div>
            <h1 className="text-xl font-black text-black tracking-tighter">BISTROT M</h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em]">Kitchen Production Manager</p>
          </div>
          <div className="bg-black text-white px-3 py-1 rounded-sm font-bold text-[10px] uppercase">
            {weekLabel}
          </div>
        </div>

        {/* TABLEAU FORCE FIXE */}
        <table className="w-full border-collapse border border-black table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black w-[45px] p-1 text-[8px] font-black uppercase">Service</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border border-black p-1 text-center bg-gray-50">
                  <div className="text-[9px] font-black uppercase text-black">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[8px] text-gray-600 font-bold">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border border-black bg-gray-50 p-1 text-center align-middle">
                  <div className="text-lg">{shift.icon}</div>
                  <div className="text-[7px] font-black uppercase text-gray-700 leading-none">{shift.label}</div>
                </td>

                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && isSameDay(parseISO(t.startTime), date)
                  ).sort((a, b) => a.startTime.localeCompare(b.startTime));
                  
                  return (
                    <td key={dayIdx} className="border border-black p-1 align-top bg-white overflow-hidden">
                      <div className="flex flex-col gap-2">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div 
                              key={task.id} 
                              className="task-card border-l-2 border-black bg-gray-50 p-1.5 flex flex-col rounded-r shadow-sm"
                            >
                              <div className="mb-0.5">
                                <span className="text-[9px] font-black uppercase text-black leading-tight break-words block">
                                  {task.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[7px] font-black bg-black text-white px-1 py-0.5 rounded shrink-0">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                                <span className="text-[7px] font-bold text-gray-500 italic">
                                  {task.cookTime}m
                                </span>
                              </div>

                              <div className="text-[8px] font-bold text-gray-700 truncate">
                                👤 {task.responsible}
                              </div>

                              {task.comments && (
                                <div className="text-[7.5px] text-gray-600 leading-tight border-t border-gray-200 pt-1 mt-1 italic break-words">
                                  {task.comments}
                                </div>
                              )}

                              <div className="text-[8px] font-black text-red-700 mt-1 flex justify-between border-t border-red-100 pt-1">
                                <span className="text-[6px] uppercase opacity-60">DLC:</span>
                                <span>{format(expiry, 'dd/MM HH:mm')}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="mt-3 flex justify-between items-end border-t border-black pt-2">
          <p className="text-[7px] font-bold text-gray-400 uppercase">
            Traçabilité Interne • Document Confidentiel
          </p>
          <div className="text-right border-b border-black w-24 pb-1">
            <span className="text-[7px] font-black text-gray-300 uppercase">Visa</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;