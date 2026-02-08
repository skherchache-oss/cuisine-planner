import React from 'react';
import { PrepTask } from '../types';
import { SHIFTS } from '../constants';
import { formatDuration, calculateExpiry } from '../utils';
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
    <div id="pdf-content" className="bg-white text-black font-sans" style={{ width: '287mm', padding: '5mm', margin: '0 auto' }}>
      
      {/* HEADER PROFESSIONNEL */}
      <div className="flex justify-between items-end mb-4 border-b-2 border-black pb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Registre de Production Hebdomadaire</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Traçabilité HACCP • Bistrot M</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-sm font-black uppercase bg-black text-white px-3 py-1 rounded">Semaine : {weekLabel}</div>
          <span className="text-[8px] text-gray-400 mt-1 italic">Généré le {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
        </div>
      </div>

      {/* TABLEAU DE BORD DE PRODUCTION */}
      <table className="w-full border-collapse border-2 border-black table-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-2 border-black p-2 w-[65px] text-[10px] uppercase font-black">Shift</th>
            {weekDates.map(date => (
              <th key={date.toString()} className="border-2 border-black p-2 font-black text-center uppercase">
                <div className="text-base">{format(date, 'EEEE', { locale: fr })}</div>
                <div className="text-[10px] text-gray-400">{format(date, 'dd/MM', { locale: fr })}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHIFTS.map(shift => (
            <tr key={shift.id}>
              <td className="border-2 border-black p-2 bg-gray-50 align-middle text-center">
                <div className="text-2xl mb-1">{shift.icon}</div>
                <div className="text-[8px] font-black uppercase leading-tight">{shift.label}</div>
              </td>
              {weekDates.map((date, dayIdx) => {
                const dayTasks = tasks.filter(t => 
                  t.shift === shift.id && 
                  isSameDay(parseISO(t.startTime), date)
                );
                
                // Tri par heure pour le PDF
                const sortedDayTasks = [...dayTasks].sort((a, b) => 
                  a.startTime.localeCompare(b.startTime)
                );
                
                return (
                  <td key={dayIdx} className="border border-black p-1 align-top bg-white min-w-[125px]">
                    <div className="flex flex-col gap-2">
                      {sortedDayTasks.map(task => {
                        const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                        return (
                          <div key={task.id} className="border border-gray-400 p-2 rounded-sm flex flex-col bg-white">
                            
                            {/* 1. HEURE & DÉSIGNATION */}
                            <div className="border-b border-black pb-1 mb-1 flex justify-between items-start gap-1">
                              <span className="text-[10px] font-black bg-black text-white px-1 rounded whitespace-nowrap">
                                {format(parseISO(task.startTime), 'HH:mm')}
                              </span>
                              <span className="font-black uppercase text-[10px] leading-tight flex-1 text-right truncate">
                                {task.name}
                              </span>
                            </div>

                            {/* 2. RESPONSABLE & TEMPS PROD */}
                            <div className="grid grid-cols-2 text-[8px] font-bold mb-1">
                              <span className="truncate pr-1">👤 {task.responsible}</span>
                              <span className="text-right text-blue-800">⏱️ {task.cookTime + (task.prepTime || 0)} min</span>
                            </div>

                            {/* 3. CONSERVATION (DLC) */}
                            <div className="bg-red-50 text-red-700 border border-red-200 py-0.5 px-1 text-[8px] font-black flex justify-between rounded-sm">
                              <span>DLC :</span>
                              <span>{format(expiry, 'dd/MM HH:mm')}</span>
                            </div>

                            {/* 4. DÉTAILS / NOTES (Le contenu de la fiche) */}
                            {task.comments && (
                              <div className="mt-1.5 text-[7px] leading-tight text-gray-700 italic border-l border-gray-300 pl-1 whitespace-pre-wrap">
                                {task.comments}
                              </div>
                            )}

                            {/* 5. ZONE DE SAISIE MANUELLE (Espace libre) */}
                            <div className="mt-2 border-t border-dashed border-gray-300 pt-1">
                              <div className="flex justify-between items-end gap-2">
                                <div className="flex-1 border-b border-gray-200 h-4">
                                  <span className="text-[5px] text-gray-300 uppercase block leading-none">Notes / Lot</span>
                                </div>
                                <div className="w-8 border-b border-gray-200 h-4 text-center">
                                  <span className="text-[5px] text-gray-300 uppercase block leading-none">T° Cœur</span>
                                </div>
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
      <div className="mt-4 flex justify-between items-center text-[8px] font-bold text-gray-400 uppercase tracking-widest">
        <span>Vérification HACCP obligatoire - Bistrot M</span>
        <span>Signature Responsable : __________________________</span>
      </div>
    </div>
  );
};

export default PrintLayout;