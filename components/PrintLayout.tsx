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
          @page { size: A4 landscape; margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; font-family: sans-serif; }
          #print-area { 
            width: 297mm !important; 
            min-height: 210mm !important; 
            padding: 8mm !important;
            transform: none !important;
          }
        }
        #print-area {
          width: 297mm;
          min-height: 210mm;
          box-sizing: border-box;
          background: white;
          color: black;
        }
        /* Assure que le texte ne soit jamais coupé en milieu de ligne */
        .task-card {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      `}} />

      <div id="print-area" className="mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-end mb-3 border-b-4 border-black pb-2">
          <div>
            <h1 className="text-2xl font-black text-black uppercase tracking-tighter">BISTROT M</h1>
            <p className="text-[10px] font-bold text-gray-600 uppercase">Registre de Production • HACCP</p>
          </div>
          <div className="bg-black text-white px-4 py-1.5 rounded font-black text-xs uppercase">
            {weekLabel}
          </div>
        </div>

        {/* TABLEAU : Suppression de table-fixed pour laisser le texte respirer */}
        <table className="w-full border-collapse border-2 border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-2 border-black w-[45px] p-2 text-[9px] font-black uppercase">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border-2 border-black p-2 text-center">
                  <div className="text-xs font-black uppercase">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[10px] text-gray-600 font-bold">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border-2 border-black bg-gray-50 p-1 text-center align-middle">
                  <div className="text-xl">{shift.icon}</div>
                  <div className="text-[7px] font-black uppercase text-gray-700 leading-none">{shift.label}</div>
                </td>

                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && isSameDay(parseISO(t.startTime), date)
                  ).sort((a, b) => a.startTime.localeCompare(b.startTime));
                  
                  return (
                    <td key={dayIdx} className="border-2 border-black p-1 align-top bg-white">
                      <div className="flex flex-col gap-1.5">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div 
                              key={task.id} 
                              className="task-card border border-gray-400 rounded p-1.5 bg-white flex flex-col"
                            >
                              {/* LIGNE 1 : HEURE + NOM (WRAP AUTOMATIQUE) */}
                              <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 pb-1 mb-1">
                                <span className="text-[8px] font-black bg-black text-white px-1 py-0.5 rounded shrink-0">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                                <span className="text-[9px] font-black uppercase text-black leading-tight break-words flex-1 min-w-[60px]">
                                  {task.name}
                                </span>
                              </div>

                              {/* LIGNE 2 : RESPONSABLE (SANS COUPURE) */}
                              <div className="flex justify-between items-start text-[8px] font-bold mb-1">
                                <span className="text-black break-words flex-1">👤 {task.responsible}</span>
                                <span className="text-gray-500 ml-1 italic">{task.cookTime}m</span>
                              </div>

                              {/* LIGNE 3 : NOTES (SI PRÉSENTES) */}
                              {task.comments && (
                                <div className="text-[7.5px] text-gray-700 leading-tight italic bg-gray-50 p-1 rounded border-l border-gray-300 mb-1 break-words">
                                  {task.comments}
                                </div>
                              )}

                              {/* LIGNE 4 : DLC */}
                              <div className="text-[8px] font-black text-red-700 mt-auto">
                                DLC: {format(expiry, 'dd/MM HH:mm')}
                              </div>

                              {/* LIGNES DE SAISIE MANUELLE */}
                              <div className="flex justify-between items-end gap-1 mt-1 border-t border-gray-100 pt-1">
                                <div className="flex-1 border-b border-gray-400 h-3">
                                  <span className="text-[5px] text-gray-500 font-bold uppercase">Lot No.</span>
                                </div>
                                <div className="w-6 border-b border-gray-400 h-3 text-center">
                                  <span className="text-[5px] text-gray-500 font-bold uppercase">T°</span>
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
        <div className="mt-4 flex justify-between items-start border-t-2 border-black pt-2">
          <p className="text-[8px] font-bold text-gray-600 max-w-[70%] leading-tight uppercase">
            🚨 CONTRÔLE CRITIQUE : TEMPÉRATURES DE CUISSON & DLC OBLIGATOIRES. 
            VÉRIFIER L'INTÉGRITÉ DES EMBALLAGES ET LA PROPRETÉ DES CONTENANTS.
          </p>
          <div className="text-right border-b-2 border-gray-400 w-32 pb-4">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">VISA CHEF</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;