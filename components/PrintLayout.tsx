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

  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = new Date(a.startTime).getTime();
    const dateB = new Date(b.startTime).getTime();
    if (dateA !== dateB) return dateA - dateB;
    const shiftOrder: Record<string, number> = { morning: 1, afternoon: 2, evening: 3 };
    return (shiftOrder[a.shift] || 99) - (shiftOrder[b.shift] || 99);
  });

  return (
    <div className="bg-white text-black font-sans" style={{ width: '290mm', margin: '0 auto' }}>
      
      {/* SECTION 1 : PLANNING HEBDOMADAIRE */}
      <div className="html2pdf__page-break" style={{ padding: '5mm' }}>
        <div className="flex justify-between items-end mb-4 border-b border-gray-300 pb-2">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">Registre de Production</h1>
            <p className="text-[9px] text-gray-500 font-medium uppercase tracking-widest">Traçabilité HACCP • Bistrot M</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold uppercase">Semaine du {weekLabel}</div>
            <div className="text-[8px] text-gray-400 italic">Imprimé le {format(new Date(), 'dd/MM/yyyy')}</div>
          </div>
        </div>

        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-2 w-[60px] text-[10px] uppercase font-bold">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border border-gray-300 p-2 font-bold text-center uppercase text-[11px]">
                  <div>{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[9px] text-gray-400">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border border-gray-300 p-1 bg-gray-50 align-middle text-center">
                  <div className="text-xl">{shift.icon}</div>
                  <div className="text-[8px] font-bold uppercase leading-tight">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && 
                    isSameDay(parseISO(t.startTime), date)
                  );
                  
                  return (
                    <td key={dayIdx} className="border border-gray-300 p-1 align-top bg-white" style={{ minHeight: '150px' }}>
                      <div className="flex flex-col gap-2">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div key={task.id} className="avoid-break border border-gray-200 p-1.5 rounded bg-white flex flex-col gap-1">
                              <div className="flex justify-between items-start border-b border-gray-100 pb-1 mb-1">
                                <span className="font-bold uppercase text-[9px] leading-tight flex-1 pr-1">{task.name}</span>
                                <span className="font-mono text-[8px] bg-gray-100 px-1 rounded">{format(parseISO(task.startTime), 'HH:mm')}</span>
                              </div>
                              <div className="grid grid-cols-2 text-[7px] gap-y-1">
                                <span className="truncate">👤 {task.responsible}</span>
                                <span className="text-right font-medium">DLC: {format(expiry, 'dd/MM HH:mm')}</span>
                              </div>
                              <div className="flex gap-1 mt-1">
                                <div className="flex-1 border-b border-gray-300 h-3"></div>
                                <div className="w-6 border-b border-gray-300 h-3"></div>
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
      </div>

      <div className="html2pdf__page-break"></div>

      {/* SECTION 2 : FICHES INDIVIDUELLES ÉPURÉES */}
      <div style={{ padding: '5mm' }}>
        <h2 className="text-xl font-bold uppercase border-b-2 border-black pb-2 mb-6 flex items-center gap-3">
          <span>📋</span> 
          <span>Fiches Techniques & Instructions</span>
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {sortedTasks.map((task) => {
            const startTime = parseISO(task.startTime);
            const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);

            return (
              <div 
                key={task.id} 
                className="avoid-break border border-gray-300 rounded-lg overflow-hidden flex flex-col bg-white"
              >
                {/* Header plus fin */}
                <div className="bg-gray-100 p-3 border-b border-gray-300 flex justify-between items-center">
                  <div className="font-bold text-sm uppercase">{task.name}</div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase">
                    {format(startTime, 'EEEE dd MMM', { locale: fr })}
                  </div>
                </div>

                <div className="p-4 grid grid-cols-2 gap-4">
                  {/* Colonne Gauche : Données */}
                  <div className="space-y-2 text-[10px] border-r border-gray-100 pr-4">
                    <div className="flex justify-between border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase">Chef</span>
                      <span className="font-bold">{task.responsible}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase">Cuisson</span>
                      <span className="font-bold">{formatDuration(task.cookTime)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase">Prépa+Pack</span>
                      <span className="font-bold">{task.prepTime + (task.packingTime || 0)} min</span>
                    </div>
                    <div className="bg-gray-50 p-2 mt-2 rounded border border-gray-100 text-center">
                      <div className="text-[8px] text-gray-400 uppercase">DLC Maximum</div>
                      <div className="font-bold text-red-600">{format(expiry, 'dd/MM/yyyy HH:mm')}</div>
                    </div>
                  </div>

                  {/* Colonne Droite : Instructions (Espace maximum ici) */}
                  <div className="text-[10px] flex flex-col">
                    <div className="font-bold uppercase text-gray-300 text-[8px] mb-1">Procédure</div>
                    <div className="leading-snug text-gray-700 whitespace-pre-wrap italic">
                      {task.comments || "Suivre le protocole standard."}
                    </div>
                    
                    <div className="mt-auto pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[8px] text-gray-400 uppercase">Lot:</span>
                        <div className="flex-1 border-b border-gray-200 h-3"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-gray-400 uppercase">T°:</span>
                        <div className="flex-1 border-b border-gray-200 h-3"></div>
                      </div>
                    </div>
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