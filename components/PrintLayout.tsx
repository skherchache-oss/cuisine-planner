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
  // Définition des 5 jours de la semaine (Lundi au Vendredi)
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));

  return (
    <div 
      id="print-area" 
      className="bg-white text-black font-sans shadow-none" 
      style={{ 
        width: '287mm', 
        minHeight: '200mm', 
        padding: '10mm', 
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
    >
      {/* HEADER : Titre et Informations de la semaine */}
      <div className="flex justify-between items-end mb-4 border-b-2 border-slate-900 pb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
            [cite_start]Registre de Production [cite: 2, 107]
          </h1>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            [cite_start]Traçabilité HACCP • Bistrot M [cite: 2, 108, 171]
          </p>
        </div>
        <div className="text-right">
          <div className="inline-block bg-slate-900 text-white text-[11px] font-black px-4 py-1.5 rounded-md uppercase mb-1">
            [cite_start]{weekLabel} [cite: 33, 137, 200]
          </div>
          <p className="text-[8px] text-slate-400 font-medium italic">
            [cite_start]Généré le {format(new Date(), 'dd/MM/yyyy à HH:mm')} [cite: 43]
          </p>
        </div>
      </div>

      {/* TABLEAU PRINCIPAL : Structure fixe pour éviter le rognage */}
      <table className="w-full border-collapse border-2 border-slate-900 table-fixed">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-400 w-[60px] p-2"></th> {/* Colonne Shift */}
            {weekDates.map(date => (
              <th key={date.toString()} className="border border-slate-400 p-2 text-center">
                <div className="text-[12px] font-black uppercase text-slate-900">
                  [cite_start]{format(date, 'EEEE', { locale: fr })} [cite: 4, 115]
                </div>
                <div className="text-[10px] text-slate-500 font-bold">
                  [cite_start]{format(date, 'dd/MM', { locale: fr })} [cite: 4, 115]
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHIFTS.map(shift => (
            <tr key={shift.id} className="min-h-[150px]">
              {/* Colonne latérale Shift (Matin, Après-midi, Soir) */}
              <td className="border border-slate-400 bg-slate-50 p-2 align-middle text-center">
                <div className="text-2xl mb-1">{shift.icon}</div>
                <div className="text-[8px] font-black uppercase text-slate-700 leading-none">
                  [cite_start]{shift.label} [cite: 3, 5, 110]
                </div>
              </td>

              {/* Cellules des tâches quotidiennes */}
              {weekDates.map((date, dayIdx) => {
                const dayTasks = tasks.filter(t => 
                  t.shift === shift.id && isSameDay(parseISO(t.startTime), date)
                ).sort((a, b) => a.startTime.localeCompare(b.startTime));
                
                return (
                  <td key={dayIdx} className="border border-slate-300 p-1.5 align-top bg-white">
                    <div className="flex flex-col gap-2">
                      {dayTasks.map(task => {
                        const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                        return (
                          <div 
                            key={task.id} 
                            className="border border-slate-200 p-2 rounded-md bg-white shadow-sm flex flex-col"
                            style={{ breakInside: 'avoid' }}
                          >
                            {/* Ligne 1 : Heure et Nom de la production */}
                            <div className="flex justify-between items-start border-b border-slate-100 pb-1 mb-1 gap-1">
                              <span className="text-[9px] font-black bg-slate-800 text-white px-1.5 py-0.5 rounded">
                                [cite_start]{format(parseISO(task.startTime), 'HH:mm')} [cite: 8, 113]
                              </span>
                              <span className="font-black uppercase text-[9px] text-slate-900 flex-1 text-right truncate">
                                [cite_start]{task.name} [cite: 7, 75, 126]
                              </span>
                            </div>

                            {/* Ligne 2 : Chef et Temps de cuisson */}
                            <div className="flex justify-between text-[8px] font-bold text-slate-500 mb-1">
                              [cite_start]<span className="truncate">👤 {task.responsible} [cite: 9, 77, 129]</span>
                              [cite_start]<span className="text-slate-900 shrink-0">⏱️ {task.cookTime} min [cite: 10, 131, 191]</span>
                            </div>

                            {/* Ligne 3 : DLC discrète */}
                            <div className="text-[8px] font-black text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-100 mb-1">
                              [cite_start]EXP: {format(expiry, 'dd/MM HH:mm')} [cite: 11, 86, 132]
                            </div>

                            {/* Ligne 4 : Instructions (si présentes) */}
                            {task.comments && (
                              <div className="text-[7px] text-slate-600 italic leading-tight border-l-2 border-slate-200 pl-1 mb-1">
                                [cite_start]{task.comments} [cite: 51, 81, 148]
                              </div>
                            )}

                            {/* Ligne 5 : Zones de saisie manuelle (T° et Lot) */}
                            <div className="flex justify-between items-center gap-1 mt-1 pt-1 border-t border-dashed border-slate-200">
                              <div className="flex-1 border-b border-slate-300 h-3 flex items-center">
                                [cite_start]<span className="text-[5px] text-slate-400 font-bold uppercase">LOT</span> [cite: 57, 103]
                              </div>
                              <div className="w-8 border-b border-slate-300 h-3 flex items-center justify-center">
                                [cite_start]<span className="text-[5px] text-slate-400 font-bold uppercase text-center">T°C</span> [cite: 13, 88, 104]
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

      {/* FOOTER : Mentions Légales et HACCP */}
      <div className="mt-4 flex justify-between items-start border-t-2 border-slate-900 pt-3">
        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-900 uppercase">
            [cite_start]⚠️ CONTRÔLE CRITIQUE [cite: 30, 119, 199]
          </p>
          <p className="text-[8px] font-bold text-slate-500 leading-tight max-w-[500px]">
            TEMPÉRATURES DE CUISSON & REFROIDISSEMENT OBLIGATOIRES. [cite_start]VALIDATION VISUELLE DU CONDITIONNEMENT ET ÉTIQUETAGE DLC. [cite: 30, 199]
          </p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black uppercase text-slate-400 italic">
            Document Interne • Confidentialité HACCP
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;