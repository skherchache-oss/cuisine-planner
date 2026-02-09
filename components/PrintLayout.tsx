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

  // Fonction pour formater la durée proprement
  const formatDuration = (min: number) => {
    if (min >= 60) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return m > 0 ? `${h}h${m}` : `${h}h`;
    }
    return `${min}min`;
  };

  return (
    <div className="w-full bg-white">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 landscape; margin: 5mm; }
          body { margin: 0; -webkit-print-color-adjust: exact; font-family: 'Inter', sans-serif; }
          #print-area { 
            width: 280mm !important; 
            margin: 0 auto !important;
          }
        }
        #print-area {
          width: 280mm;
          min-height: 100%;
          box-sizing: border-box;
          background: white;
          color: black;
          padding: 5mm;
        }
        .task-card {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        table { page-break-after: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
      `}} />

      <div id="print-area" className="mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
          <div>
            <h1 className="text-2xl font-black text-black tracking-tighter uppercase">BISTROT M</h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">CUISINE PLANNER</p>
          </div>
          <div className="bg-black text-white px-4 py-1.5 rounded-sm font-bold text-[11px] uppercase tracking-wide">
            {weekLabel}
          </div>
        </div>

        {/* TABLEAU */}
        <table className="w-full border-collapse border border-black table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black w-[50px] p-2 text-[9px] font-black uppercase">Service</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border border-black p-2 text-center bg-gray-50">
                  <div className="text-[11px] font-black uppercase text-black">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[9px] text-gray-600 font-bold">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border border-black bg-gray-50 p-1 text-center align-middle">
                  <div className="text-xl mb-1">{shift.icon}</div>
                  <div className="text-[8px] font-black uppercase text-gray-700 leading-tight">{shift.label}</div>
                </td>

                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && isSameDay(parseISO(t.startTime), date)
                  ).sort((a, b) => a.startTime.localeCompare(b.startTime));
                  
                  return (
                    <td key={dayIdx} className="border border-black p-2 align-top bg-white">
                      <div className="flex flex-col gap-3">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div 
                              key={task.id} 
                              className="task-card border border-slate-300 p-2 flex flex-col rounded shadow-sm bg-white"
                            >
                              {/* 1. NOM DE LA PREPA */}
                              <div className="border-b border-slate-100 pb-1 mb-1">
                                <span className="text-[10px] font-black uppercase text-black leading-tight block">
                                  {task.name}
                                </span>
                              </div>

                              {/* 2. HEURE + TEMPS */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[8px] font-black bg-slate-800 text-white px-1.5 py-0.5 rounded shrink-0">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                                <span className="text-[8px] font-bold text-slate-500">
                                  ⏱ {formatDuration(task.cookTime)}
                                </span>
                              </div>

                              {/* 3. RESPONSABLE */}
                              <div className="text-[9px] font-bold text-slate-800 mb-1 flex items-center">
                                <span className="mr-1">👤</span> {task.responsible}
                              </div>

                              {/* 4. DETAILS / COMMENTAIRES */}
                              {task.comments && (
                                <div className="text-[8px] text-slate-600 leading-tight bg-slate-50 p-1 rounded italic mb-1 border-l border-slate-200">
                                  {task.comments}
                                </div>
                              )}

                              {/* 5. DLC */}
                              <div className="text-[9px] font-black text-red-700 mt-1 mb-1 flex justify-between items-center border-t border-red-50 pt-1">
                                <span className="text-[7px] uppercase opacity-70">Fin / DLC :</span>
                                <span>{format(expiry, 'dd/MM HH:mm')}</span>
                              </div>

                              {/* 6. ESPACE NOTES LIBRE */}
                              <div className="mt-1 border-t border-dotted border-slate-300 pt-1">
                                <div className="text-[6px] uppercase font-bold text-slate-400 mb-1">Notes :</div>
                                <div className="h-4 w-full border-b border-dotted border-slate-300"></div>
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
      </div>
    </div>
  );
};

export default PrintLayout;