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

  // Tri global pour les fiches techniques (Section 2)
  const sortedTasks = [...tasks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div id="print-area" className="bg-white text-black font-sans" style={{ width: '287mm', margin: '0 auto' }}>
      
      {/* SECTION 1 : TABLEAU PLANNING (PAGE 1) */}
      <div className="p-[10mm] bg-white">
        <div className="flex justify-between items-end mb-6 border-b-2 border-black pb-2">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Registre de Production</h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Traçabilité HACCP • Bistrot M</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-black uppercase border border-black px-2 py-1 inline-block">Semaine : {weekLabel}</div>
            <div className="text-[8px] text-gray-400 mt-1 uppercase italic font-bold">Généré le {format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
          </div>
        </div>

        <table className="w-full border-collapse border border-black table-fixed">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-black p-2 w-[70px] text-[10px] uppercase font-black">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border border-black p-2 font-black text-center uppercase">
                  <div className="text-sm">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[9px] text-gray-400">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border border-black p-2 bg-gray-50 align-middle text-center">
                  <div className="text-2xl mb-1">{shift.icon}</div>
                  <div className="text-[8px] font-black uppercase leading-tight">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && isSameDay(parseISO(t.startTime), date)
                  ).sort((a, b) => a.startTime.localeCompare(b.startTime));
                  
                  return (
                    <td key={dayIdx} className="border border-black p-1 align-top bg-white min-h-[150px]">
                      <div className="flex flex-col gap-1.5">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div key={task.id} className="border border-gray-300 p-1.5 rounded-sm flex flex-col bg-white">
                              <div className="flex justify-between items-start border-b border-gray-100 pb-1 mb-1 gap-1">
                                <span className="text-[9px] font-black bg-slate-100 px-1 rounded">{format(parseISO(task.startTime), 'HH:mm')}</span>
                                <span className="font-bold uppercase text-[8px] leading-tight flex-1 text-right truncate">{task.name}</span>
                              </div>
                              <div className="flex justify-between text-[7px] font-medium text-gray-500 mb-1">
                                <span>👤 {task.responsible}</span>
                                <span>DLC: {format(expiry, 'dd/MM')}</span>
                              </div>
                              {/* Ligne pour note manuelle (T° ou Lot) */}
                              <div className="border-t border-dotted border-gray-300 mt-1 flex justify-between pt-0.5">
                                <span className="text-[6px] text-gray-400">T°: ____</span>
                                <span className="text-[6px] text-gray-400">VISA: ____</span>
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
        
        <div className="mt-4 text-[8px] font-bold text-gray-400 uppercase text-center border-t border-gray-100 pt-2">
          Contrôle critique : Températures de cuisson & refroidissement obligatoires. Signature Responsable : ___________________
        </div>
      </div>

      {/* SAUT DE PAGE POUR LES FICHES TECHNIQUES */}
      <div className="html2pdf__page-break"></div>

      {/* SECTION 2 : FICHES DÉTAILLÉES (PAGES SUIVANTES) */}
      <div className="p-[10mm] bg-white">
        <h2 className="text-xl font-black uppercase border-b-4 border-black pb-2 mb-8 flex items-center gap-3">
          <span>📋</span> Fiches Techniques & Instructions de Poste
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          {sortedTasks.map((task) => {
            const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
            return (
              <div key={task.id} className="border border-black rounded-lg overflow-hidden flex flex-col avoid-break bg-white shadow-sm">
                <div className="bg-slate-900 text-white p-3 flex justify-between items-center">
                  <div className="font-black text-sm uppercase">{task.name}</div>
                  <div className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded">
                    {format(parseISO(task.startTime), 'EEEE dd/MM', { locale: fr })}
                  </div>
                </div>

                <div className="p-4 grid grid-cols-3 gap-4 border-b border-gray-100">
                  <div className="text-center">
                    <div className="text-[7px] text-gray-400 font-black uppercase">Responsable</div>
                    <div className="text-[10px] font-bold">{task.responsible}</div>
                  </div>
                  <div className="text-center border-x border-gray-100">
                    <div className="text-[7px] text-gray-400 font-black uppercase">Temps Global</div>
                    <div className="text-[10px] font-bold">{task.cookTime + (task.prepTime || 0)} min</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[7px] text-red-400 font-black uppercase tracking-tighter">DLC Maximum</div>
                    <div className="text-[9px] font-black text-red-600">{format(expiry, 'dd/MM/yyyy HH:mm')}</div>
                  </div>
                </div>

                <div className="p-4 flex-1">
                  <div className="text-[8px] font-black text-slate-300 uppercase mb-2">Procédure & Notes</div>
                  <div className="text-[10px] leading-relaxed text-gray-700 whitespace-pre-wrap italic">
                    {task.comments || "Aucune instruction spécifique renseignée."}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div className="border-b border-gray-300 h-6 flex items-end pb-1">
                    <span className="text-[7px] text-gray-400 uppercase mr-2 font-bold">N° Lot :</span>
                  </div>
                  <div className="border-b border-gray-300 h-6 flex items-end pb-1">
                    <span className="text-[7px] text-gray-400 uppercase mr-2 font-bold">T° Fin :</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;