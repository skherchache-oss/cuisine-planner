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
    <div className="w-full bg-slate-50 min-h-screen p-2 md:p-0">
      {/* CONTENEUR PRINCIPAL (Optimisé pour html2canvas / PDF) */}
      <div 
        id="print-area" 
        className="bg-white mx-auto shadow-none"
        style={{ 
          width: '297mm', // Format A4 Paysage strict
          minHeight: '210mm',
          padding: '12mm',
          boxSizing: 'border-box',
          color: 'black'
        }}
      >
        {/* HEADER BISTROT M */}
        <div className="flex justify-between items-center mb-6 border-b-4 border-slate-900 pb-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">BISTROT M</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Registre de Production • HACCP</p>
          </div>
          <div className="text-right">
            <div className="bg-slate-900 text-white px-5 py-2 rounded-md font-black text-sm uppercase">
              {weekLabel}
            </div>
            <p className="text-[9px] text-slate-400 mt-2 italic">Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm')}</p>
          </div>
        </div>

        {/* TABLEAU DE PRODUCTION */}
        <table className="w-full border-collapse border-2 border-slate-900 table-fixed">
          <thead>
            <tr className="bg-slate-100">
              <th className="border-2 border-slate-900 w-[70px] p-2 text-[10px] font-black uppercase">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border-2 border-slate-900 p-2 text-center">
                  <div className="text-sm font-black uppercase">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[11px] text-slate-500 font-bold">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                {/* Colonne latérale Shift */}
                <td className="border-2 border-slate-900 bg-slate-50 p-2 text-center align-middle">
                  <div className="text-2xl mb-1">{shift.icon}</div>
                  <div className="text-[8px] font-black uppercase text-slate-700 leading-none">{shift.label}</div>
                </td>

                {/* Cellules des tâches */}
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && isSameDay(parseISO(t.startTime), date)
                  ).sort((a, b) => a.startTime.localeCompare(b.startTime));
                  
                  return (
                    <td key={dayIdx} className="border border-slate-400 p-2 align-top bg-white">
                      <div className="flex flex-col gap-3">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div 
                              key={task.id} 
                              className="flex flex-col border border-slate-300 rounded-md p-2 bg-white"
                              style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} // Empêche la coupure en milieu de fiche
                            >
                              {/* 1. LIGNE TITRE : HEURE + NOM */}
                              <div className="flex items-start gap-2 border-b border-slate-100 pb-1.5 mb-1.5">
                                <span className="text-[10px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded shrink-0">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                                <span className="text-[10px] font-black uppercase text-slate-900 leading-tight">
                                  {task.name}
                                </span>
                              </div>

                              {/* 2. RESPONSABLE ET TEMPS */}
                              <div className="flex justify-between text-[9px] font-bold text-slate-600 mb-1">
                                <span>Chef: {task.responsible}</span>
                                <span className="text-slate-900">⏱ {task.cookTime} min</span>
                              </div>

                              {/* 3. NOTES ET INSTRUCTIONS (Pleine largeur, non rogné) */}
                              {task.comments && (
                                <div className="text-[8px] text-slate-700 leading-tight italic bg-slate-50 p-1.5 rounded mb-1 border-l-2 border-slate-300">
                                  {task.comments}
                                </div>
                              )}

                              {/* 4. DLC (Simple et propre) */}
                              <div className="text-[8px] font-bold text-rose-700 mb-2">
                                DLC: {format(expiry, 'dd/MM HH:mm')}
                              </div>

                              {/* 5. ZONE DE SAISIE MANUELLE */}
                              <div className="flex justify-between items-end gap-2 mt-auto">
                                <div className="flex-1 border-b-2 border-slate-200 h-4 flex items-center">
                                  <span className="text-[6px] text-slate-400 font-bold uppercase">N° Lot / Notes</span>
                                </div>
                                <div className="w-12 border-b-2 border-slate-200 h-4 flex items-center justify-center">
                                  <span className="text-[6px] text-slate-400 font-bold uppercase text-center">T° Coeur</span>
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

        {/* FOOTER HACCP */}
        <div className="mt-6 border-t-2 border-slate-900 pt-4">
          <div className="flex justify-between items-start">
            <div className="max-w-[70%]">
              <h4 className="text-[10px] font-black uppercase text-slate-900 mb-1">⚠️ Contrôles Critiques Obligatoires</h4>
              <p className="text-[9px] font-bold text-slate-500 leading-snug">
                VÉRIFICATION DES TEMPÉRATURES DE CUISSON ET REFROIDISSEMENT. CONTRÔLE VISUEL DE L'ÉTANCHÉITÉ ET DE L'ÉTIQUETAGE DLC. 
                TOUTE ANOMALIE DOIT ÊTRE SIGNALÉE AU CHEF DE CUISINE.
              </p>
            </div>
            <div className="text-right border-b-2 border-slate-300 w-48 pb-6">
              <span className="text-[9px] font-black text-slate-400 uppercase">Visa Responsable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;