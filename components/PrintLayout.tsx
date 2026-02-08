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
    <div className="w-full bg-white overflow-visible">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 landscape; margin: 5mm; }
          body { margin: 0; -webkit-print-color-adjust: exact; font-family: 'Inter', sans-serif; }
          #print-area { 
            width: 280mm !important; 
            margin: 0 auto !important;
            padding: 0 !important;
          }
        }
        #print-area {
          width: 280mm;
          min-height: 190mm;
          box-sizing: border-box;
          background: white;
          color: black;
        }
        .task-card {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      `}} />

      <div id="print-area" className="mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4 border-b border-black pb-2">
          <div>
            <h1 className="text-xl font-black text-black tracking-tighter">BISTROT M</h1>
            <p className="text-[9px] font-medium text-gray-500 uppercase tracking-widest">Registre de Production • HACCP</p>
          </div>
          <div className="border border-black px-3 py-1 rounded-sm font-bold text-[11px] uppercase">
            {weekLabel}
          </div>
        </div>

        {/* TABLEAU */}
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-black w-[50px] p-1 text-[8px] font-bold uppercase">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border border-black p-2 text-center">
                  <div className="text-[10px] font-black uppercase text-black">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[9px] text-gray-500 font-medium">{format(date, 'dd MMMM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border border-black bg-gray-50 p-1 text-center align-middle">
                  <div className="text-lg mb-1">{shift.icon}</div>
                  <div className="text-[7px] font-bold uppercase text-gray-600 leading-none">{shift.label}</div>
                </td>

                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && isSameDay(parseISO(t.startTime), date)
                  ).sort((a, b) => a.startTime.localeCompare(b.startTime));
                  
                  return (
                    <td key={dayIdx} className="border border-black p-1.5 align-top bg-white w-[19%]">
                      <div className="flex flex-col gap-2">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div 
                              key={task.id} 
                              className="task-card border border-gray-200 rounded-sm p-1.5 bg-white flex flex-col shadow-sm"
                            >
                              {/* LIGNE 1 : NOM & HEURE */}
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <span className="text-[9px] font-bold uppercase text-black leading-tight flex-1">
                                  {task.name}
                                </span>
                                <span className="text-[8px] font-medium text-gray-500 shrink-0">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                              </div>

                              {/* LIGNE 2 : RESPONSABLE */}
                              <div className="flex justify-between items-center text-[8px] text-gray-600 mb-1 italic">
                                <span>{task.responsible}</span>
                                <span className="text-[7px] bg-gray-100 px-1 rounded">{task.cookTime} min</span>
                              </div>

                              {/* NOTES */}
                              {task.comments && (
                                <div className="text-[7px] text-gray-500 leading-tight border-l-2 border-gray-200 pl-1 mb-1">
                                  {task.comments}
                                </div>
                              )}

                              {/* DLC */}
                              <div className="text-[8px] font-bold text-red-600 mt-1 flex justify-between">
                                <span>DLC:</span>
                                <span>{format(expiry, 'dd/MM HH:mm')}</span>
                              </div>

                              {/* SAISIE MANUELLE */}
                              <div className="flex gap-1 mt-1 pt-1 border-t border-dotted border-gray-300">
                                <div className="flex-1 border-b border-gray-300 h-3 flex items-end">
                                  <span className="text-[5px] text-gray-400 uppercase">Lot</span>
                                </div>
                                <div className="w-6 border-b border-gray-300 h-3 flex items-end justify-center">
                                  <span className="text-[5px] text-gray-400 uppercase">T°</span>
                                </div>
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
        <div className="mt-4 flex justify-between items-center border-t border-black pt-2">
          <p className="text-[7px] font-medium text-gray-400 max-w-[60%] uppercase leading-normal">
            Contrôle sanitaire obligatoire. Vérifier les températures de stockage et la conformité des étiquetages DLC.
          </p>
          <div className="text-right border-b border-gray-300 w-24 pb-1">
            <span className="text-[7px] font-bold text-gray-300 uppercase">VISA</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;