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
          body { margin: 0; -webkit-print-color-adjust: exact; }
          #print-area { 
            width: 297mm !important; 
            min-height: 210mm !important; 
            padding: 10mm !important;
            transform: none !important;
          }
        }
        #print-area {
          width: 297mm;
          min-height: 210mm;
          box-sizing: border-box;
          background: white;
          font-family: sans-serif;
        }
      `}} />

      <div id="print-area" className="mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-end mb-4 border-b-4 border-slate-900 pb-2">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">BISTROT M</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Registre de Production • HACCP</p>
          </div>
          <div className="bg-slate-900 text-white px-4 py-1.5 rounded font-black text-xs uppercase">
            {weekLabel}
          </div>
        </div>

        {/* TABLEAU */}
        <table className="w-full border-collapse border-2 border-slate-900 table-fixed">
          <thead>
            <tr className="bg-slate-100">
              <th className="border-2 border-slate-900 w-[50px] p-2 text-[10px] font-black uppercase">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border-2 border-slate-900 p-2 text-center">
                  <div className="text-sm font-black uppercase">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[10px] text-slate-500 font-bold">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border-2 border-slate-900 bg-slate-50/50 p-1 text-center align-middle">
                  <div className="text-xl">{shift.icon}</div>
                  <div className="text-[7px] font-black uppercase text-slate-600 leading-none">{shift.label}</div>
                </td>

                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && isSameDay(parseISO(t.startTime), date)
                  ).sort((a, b) => a.startTime.localeCompare(b.startTime));
                  
                  return (
                    <td key={dayIdx} className="border-2 border-slate-900 p-1 align-top bg-white">
                      <div className="flex flex-col gap-2">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div 
                              key={task.id} 
                              className="border border-slate-300 rounded p-1.5 bg-white flex flex-col gap-1"
                              style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                            >
                              {/* HEURE + NOM (Retour à la ligne si long) */}
                              <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 pb-1">
                                <span className="text-[8px] font-black bg-slate-800 text-white px-1 py-0.5 rounded shrink-0">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                                <span className="text-[9px] font-black uppercase text-slate-900 leading-tight flex-1 min-w-0 break-words">
                                  {task.name}
                                </span>
                              </div>

                              {/* RESPONSABLE ET TEMPS (Pas de rognage) */}
                              <div className="flex justify-between items-start text-[8.5px] font-bold text-slate-700">
                                <span className="break-words flex-1 pr-1">👤 {task.responsible}</span>
                                <span className="shrink-0 text-slate-400 italic font-medium">{task.cookTime}m</span>
                              </div>

                              {/* NOTES (Affichage intégral) */}
                              {task.comments && (
                                <div className="text-[7.5px] text-slate-600 leading-tight italic bg-slate-50 p-1 rounded border-l-2 border-slate-200 break-words">
                                  {task.comments}
                                </div>
                              )}

                              {/* DLC */}
                              <div className="text-[8px] font-black text-rose-700">
                                DLC: {format(expiry, 'dd/MM HH:mm')}
                              </div>

                              {/* LIGNES DE SAISIE */}
                              <div className="flex justify-between items-end gap-1 mt-1">
                                <div className="flex-1 border-b border-slate-300 h-3">
                                  <span className="text-[5px] text-slate-400 font-bold uppercase">Lot</span>
                                </div>
                                <div className="w-6 border-b border-slate-300 h-3 text-center">
                                  <span className="text-[5px] text-slate-400 font-bold uppercase">T°</span>
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
        <div className="mt-4 flex justify-between items-start border-t-2 border-slate-900 pt-2">
          <p className="text-[8px] font-bold text-slate-500 max-w-[65%] leading-tight uppercase">
            🚨 CONTRÔLE CRITIQUE : TEMPÉRATURES DE CUISSON & DLC OBLIGATOIRES. 
            VÉRIFIER L'ÉTAT DES MATIÈRES PREMIÈRES.
          </p>
          <div className="text-right border-b border-slate-300 w-32 pb-4">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Visa</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;