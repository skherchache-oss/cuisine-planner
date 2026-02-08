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
    <div id="print-area" className="bg-white text-black font-sans" style={{ width: '287mm', padding: '5mm', margin: '0 auto' }}>
      
      {/* HEADER SIMPLE */}
      <div className="flex justify-between items-center mb-4 border-b border-slate-300 pb-2">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Registre de Production</h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Traçabilité HACCP • Bistrot M</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase bg-slate-100 border border-slate-200 px-3 py-1 rounded">
            {weekLabel}
          </div>
          <p className="text-[7px] text-slate-400 mt-1 font-medium italic">
            Généré le {format(new Date(), 'dd/MM/yyyy à HH:mm')}
          </p>
        </div>
      </div>

      {/* TABLEAU */}
      <table className="w-full border-collapse border border-slate-300 table-fixed">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-300 p-2 w-[55px]"></th> {/* Colonne Shift sans texte */}
            {weekDates.map(date => (
              <th key={date.toString()} className="border border-slate-300 p-2 font-black text-center uppercase">
                <div className="text-sm text-slate-900">{format(date, 'EEEE', { locale: fr })}</div>
                <div className="text-[10px] text-slate-400 font-bold">{format(date, 'dd/MM', { locale: fr })}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHIFTS.map(shift => (
            <tr key={shift.id}>
              {/* Icône Shift uniquement */}
              <td className="border border-slate-300 p-2 bg-slate-50/30 align-middle text-center">
                <div className="text-2xl opacity-80">{shift.icon}</div>
              </td>

              {/* Tâches */}
              {weekDates.map((date, dayIdx) => {
                const dayTasks = tasks.filter(t => 
                  t.shift === shift.id && isSameDay(parseISO(t.startTime), date)
                ).sort((a, b) => a.startTime.localeCompare(b.startTime));
                
                return (
                  <td key={dayIdx} className="border border-slate-300 p-1 align-top bg-white min-h-[140px]">
                    <div className="flex flex-col gap-1.5">
                      {dayTasks.map(task => {
                        const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                        return (
                          <div key={task.id} className="border border-slate-200 p-1.5 rounded flex flex-col bg-white">
                            
                            {/* Ligne 1 : Heure, DLC discrète et Nom */}
                            <div className="flex justify-between items-center border-b border-slate-100 pb-1 mb-1">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black bg-slate-900 text-white px-1 rounded">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                                <span className="text-[6px] text-slate-400 font-bold mt-0.5">
                                  Exp: {format(expiry, 'dd/MM')}
                                </span>
                              </div>
                              <span className="font-black uppercase text-[9px] leading-tight flex-1 text-right text-slate-800 ml-2">
                                {task.name}
                              </span>
                            </div>

                            {/* Ligne 2 : Responsable & Temps */}
                            <div className="flex justify-between text-[7px] font-bold text-slate-500">
                              <span className="truncate">👤 {task.responsible}</span>
                              <span className="text-slate-700">⏱️ {task.cookTime + (task.prepTime || 0)} min</span>
                            </div>

                            {/* Ligne 3 : Instructions / Détails (Si présents) */}
                            {task.comments && (
                              <div className="mt-1 text-[7px] text-slate-600 leading-tight italic border-l-2 border-slate-100 pl-1 py-0.5 whitespace-pre-wrap break-words">
                                {task.comments}
                              </div>
                            )}

                            {/* Zone Saisie Manuelle */}
                            <div className="mt-1.5 flex justify-between items-end gap-2">
                              <div className="flex-1 border-b border-slate-200 h-3 flex items-center">
                                <span className="text-[5px] text-slate-300 font-bold uppercase">Lot</span>
                              </div>
                              <div className="w-8 border-b border-slate-200 h-3 flex items-center justify-center">
                                <span className="text-[5px] text-slate-300 font-bold uppercase">T°</span>
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

      {/* FOOTER NETTOYÉ */}
      <div className="mt-4 pt-2 border-t border-slate-100">
        <div className="flex justify-start text-[8px] font-bold text-slate-400 uppercase tracking-widest gap-4">
          <span>• Contrôle critique : Températures de cuisson & refroidissement obligatoires</span>
          <span>• Validation visuelle du conditionnement et étiquetage DLC</span>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;