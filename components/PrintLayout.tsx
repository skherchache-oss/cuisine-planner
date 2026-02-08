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
    <div 
      id="print-area" 
      className="bg-white text-black font-sans" 
      style={{ 
        width: '287mm', 
        padding: '8mm', 
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
    >
      {/* HEADER BISTROT M */}
      <div className="flex justify-between items-end mb-6 border-b-2 border-slate-900 pb-3">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
            BISTROT M
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            REGISTRE DE PRODUCTION HEBDOMADAIRE • HACCP
          </p>
        </div>
        <div className="text-right">
          <div className="inline-block bg-slate-900 text-white text-[11px] font-black px-4 py-1.5 rounded uppercase">
            {weekLabel}
          </div>
          <p className="text-[8px] text-slate-400 mt-1 font-medium italic">
            Généré le {format(new Date(), 'dd/MM/yyyy à HH:mm')}
          </p>
        </div>
      </div>

      {/* TABLEAU DE PRODUCTION CORRIGÉ */}
      <table className="w-full border-collapse border-2 border-slate-900 table-fixed">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-400 w-[60px] p-2 text-[10px] font-black uppercase">Shift</th>
            {weekDates.map(date => (
              <th key={date.toString()} className="border border-slate-400 p-2 text-center uppercase">
                <div className="text-[12px] font-black text-slate-900">
                  {format(date, 'EEEE', { locale: fr })}
                </div>
                <div className="text-[10px] text-slate-500 font-bold">
                  {format(date, 'dd/MM', { locale: fr })}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHIFTS.map(shift => (
            <tr key={shift.id}>
              {/* Colonne Shift */}
              <td className="border border-slate-400 bg-slate-50/50 p-2 text-center align-middle">
                <div className="text-xl mb-1">{shift.icon}</div>
                <div className="text-[7px] font-bold uppercase text-slate-600 leading-none">
                  {shift.label}
                </div>
              </td>

              {/* Cellules des tâches */}
              {weekDates.map((date, dayIdx) => {
                const dayTasks = tasks.filter(t => 
                  t.shift === shift.id && isSameDay(parseISO(t.startTime), date)
                ).sort((a, b) => a.startTime.localeCompare(b.startTime));
                
                return (
                  <td key={dayIdx} className="border border-slate-300 p-1.5 align-top bg-white min-h-[160px]">
                    <div className="flex flex-col gap-2">
                      {dayTasks.map(task => {
                        const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                        return (
                          <div key={task.id} className="border border-slate-200 p-2 rounded flex flex-col bg-white shadow-sm">
                            
                            {/* Heure et Nom (Ex: SD QFDFS) */}
                            <div className="flex justify-between items-center border-b border-slate-100 pb-1 mb-1">
                              <span className="text-[9px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded">
                                {format(parseISO(task.startTime), 'HH:mm')}
                              </span>
                              <span className="font-black uppercase text-[9px] text-slate-800 flex-1 text-right ml-2 truncate">
                                {task.name}
                              </span>
                            </div>

                            {/* Chef & Durée (Ex: Camille / 1h) */}
                            <div className="flex justify-between text-[8px] font-bold text-slate-500 mb-1">
                              <span className="truncate">👤 {task.responsible}</span>
                              <span className="text-slate-900 whitespace-nowrap">⏱️ {task.cookTime} min</span>
                            </div>

                            {/* DLC (Ex: 13/02 09:00) */}
                            <div className="text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-1 py-0.5 rounded text-center">
                              DLC : {format(expiry, 'dd/MM HH:mm')}
                            </div>

                            {/* Zones de suivi T° / VISA */}
                            <div className="mt-2 pt-1 border-t border-dashed border-slate-200 flex justify-between items-end gap-1">
                              <div className="flex-1 border-b border-slate-200 h-3">
                                <span className="text-[5px] text-slate-300 font-bold uppercase">T° Coeur</span>
                              </div>
                              <div className="w-8 border-b border-slate-200 h-3 text-center">
                                <span className="text-[5px] text-slate-300 font-bold uppercase">Visa</span>
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

      {/* FOOTER HACCP - Mentions obligatoires uniquement */}
      <div className="mt-6">
        <p className="text-[10px] font-black text-slate-900 uppercase mb-1">
          CONTRÔLE CRITIQUE
        </p>
        <p className="text-[8px] font-bold text-slate-500 leading-tight">
          TEMPÉRATURES DE CUISSON & REFROIDISSEMENT OBLIGATOIRES. [cite: 30, 119, 212]
          VALIDATION VISUELLE DU CONDITIONNEMENT ET ÉTIQUETAGE DLC. [cite: 30, 212]
          CONTACTER LE CHEF DE CUISINE EN CAS DE DOUTE. [cite: 31]
        </p>
      </div>
    </div>
  );
};

export default PrintLayout;