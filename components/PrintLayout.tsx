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
    <div id="print-area" className="bg-white text-black font-sans" style={{ width: '287mm', padding: '8mm', margin: '0 auto' }}>
      
      {/* HEADER : Texte ajusté et simplifié */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Registre de Production</h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Traçabilité HACCP • Bistrot M</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase bg-slate-100 border border-slate-200 px-3 py-1.5 rounded">
            {weekLabel}
          </div>
          <p className="text-[7px] text-slate-400 mt-1 font-medium uppercase italic">
            Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm')}
          </p>
        </div>
      </div>

      {/* TABLEAU : Bordures fines et mise en page optimisée */}
      <table className="w-full border-collapse border border-slate-300 table-fixed">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-300 p-2 w-[65px] text-[9px] uppercase font-black text-slate-600">Shift</th>
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
              {/* Colonne Shift avec icônes ajustées */}
              <td className="border border-slate-300 p-2 bg-slate-50/50 align-middle text-center">
                <div className="text-xl mb-1 opacity-80">{shift.icon}</div>
                <div className="text-[7px] font-black uppercase text-slate-500 tracking-tighter leading-none">
                  {shift.label}
                </div>
              </td>

              {/* Cellules de tâches quotidiennes */}
              {weekDates.map((date, dayIdx) => {
                const dayTasks = tasks.filter(t => 
                  t.shift === shift.id && isSameDay(parseISO(t.startTime), date)
                ).sort((a, b) => a.startTime.localeCompare(b.startTime));
                
                return (
                  <td key={dayIdx} className="border border-slate-300 p-1.5 align-top bg-white min-h-[140px]">
                    <div className="flex flex-col gap-2">
                      {dayTasks.map(task => {
                        const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                        return (
                          <div key={task.id} className="border border-slate-200 p-2 rounded flex flex-col bg-white">
                            
                            {/* Heure et Nom de la production */}
                            <div className="flex justify-between items-start border-b border-slate-100 pb-1.5 mb-1.5 gap-2">
                              <span className="text-[9px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded shadow-sm">
                                {format(parseISO(task.startTime), 'HH:mm')}
                              </span>
                              <span className="font-black uppercase text-[9px] leading-tight flex-1 text-right text-slate-800 truncate">
                                {task.name}
                              </span>
                            </div>

                            {/* Données Fiche : Responsable et Temps */}
                            <div className="flex justify-between text-[7px] font-bold text-slate-500 mb-1">
                              <span className="truncate">👤 {task.responsible}</span>
                              <span className="text-slate-900">⏱️ {task.cookTime + (task.prepTime || 0)} min</span>
                            </div>

                            {/* Conservation et DLC */}
                            <div className="bg-rose-50 border border-rose-100 text-rose-700 py-1 px-1.5 text-[7px] font-black flex justify-between rounded-sm">
                              <span>DLC MAX :</span>
                              <span>{format(expiry, 'dd/MM HH:mm')}</span>
                            </div>

                            {/* Espace libre Notes / T° (Ajusté pour écriture manuelle) */}
                            <div className="mt-2 border-t border-dashed border-slate-200 pt-1.5 flex justify-between items-end">
                              <div className="flex-1 border-b border-slate-100 h-3">
                                <span className="text-[5px] text-slate-300 uppercase font-bold">Lot / Notes</span>
                              </div>
                              <div className="w-10 border-b border-slate-100 h-3 text-center ml-2">
                                <span className="text-[5px] text-slate-300 uppercase font-bold">T° Cœur</span>
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

      {/* FOOTER : Texte HACCP simplifié et centré */}
      <div className="mt-8 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex flex-col gap-1">
            <span>• Contrôle critique : Températures de cuisson & refroidissement obligatoires</span>
            <span>• Validation visuelle du conditionnement et étiquetage DLC</span>
          </div>
          <div className="text-right border-b border-slate-300 w-48 pb-1">
            Signature Responsable :
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;