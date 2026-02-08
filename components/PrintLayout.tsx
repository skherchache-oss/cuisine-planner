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
    const shiftOrder = { morning: 1, afternoon: 2, evening: 3 };
    return shiftOrder[a.shift as keyof typeof shiftOrder] - shiftOrder[b.shift as keyof typeof shiftOrder];
  });

  return (
    <div className="bg-white text-black" style={{ width: '297mm', margin: '0 auto', padding: '10mm' }}>
      
      {/* SECTION 1 : PLANNING HEBDOMADAIRE (PAGE 1) */}
      <div className="html2pdf__page-break" style={{ marginBottom: '20mm' }}>
        <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white px-4 py-2 text-2xl font-black rounded uppercase">
              BISTROT M
            </div>
            <div>
              <h1 className="text-xl font-black uppercase leading-none">Registre de Production</h1>
              <p className="text-xs font-bold text-gray-500 uppercase">Traçabilité HACCP - Semaine {weekLabel}</p>
            </div>
          </div>
        </div>

        <table className="w-full border-collapse border-2 border-black table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-2 border-black p-2 w-[70px] text-[12px] font-black uppercase">Service</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border-2 border-black p-2 text-center">
                  <div className="text-[14px] font-black uppercase">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[12px] font-bold text-gray-600">{format(date, 'dd MMMM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border-2 border-black p-2 bg-gray-50 text-center">
                  <div className="text-3xl mb-1">{shift.icon}</div>
                  <div className="text-[10px] font-black uppercase leading-tight">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && 
                    isSameDay(parseISO(t.startTime), date)
                  );
                  
                  return (
                    <td key={dayIdx} className="border-2 border-black p-2 align-top bg-white min-h-[120px]">
                      <div className="flex flex-col gap-2">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div key={task.id} className="border border-black p-2 rounded bg-white shadow-sm">
                              <div className="flex justify-between items-start border-b border-black/20 pb-1 mb-1">
                                <span className="font-black uppercase text-[10px] leading-tight flex-1">
                                  {task.name}
                                </span>
                                <span className="font-black text-[9px] ml-2 whitespace-nowrap">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                              </div>
                              <div className="flex justify-between text-[8px] font-bold">
                                <span>👤 {task.responsible}</span>
                                <span className="text-blue-800">DLC: {format(expiry, 'dd/MM HH:mm')}</span>
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

      {/* SAUT DE PAGE FORCÉ */}
      <div className="html2pdf__page-break"></div>

      {/* SECTION 2 : FICHES D'INSTRUCTIONS (NOUVELLE PAGE) */}
      <div style={{ paddingTop: '10mm' }}>
        <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-6 flex items-center gap-3">
          <span>📋 Fiches Techniques & Instructions de Production</span>
        </h2>
        
        <div className="grid grid-cols-1 gap-6">
          {sortedTasks.map((task) => {
            const startTime = parseISO(task.startTime);
            const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);

            return (
              <div key={task.id} 
                   className="border-2 border-black rounded-lg overflow-hidden bg-white" 
                   style={{ pageBreakInside: 'avoid', display: 'block' }}>
                
                <div className="bg-black text-white p-3 flex justify-between items-center">
                  <div className="font-black text-lg uppercase">{task.name}</div>
                  <div className="text-sm font-black bg-white/20 px-3 py-1 rounded">
                    {format(startTime, 'EEEE dd MMMM', { locale: fr })} à {format(startTime, 'HH:mm')}
                  </div>
                </div>

                <div className="p-4 flex gap-6">
                  {/* DATA BOX */}
                  <div className="w-1/4 space-y-3">
                    <div className="bg-gray-100 p-2 rounded">
                      <div className="text-[10px] font-black text-gray-500 uppercase">Responsable</div>
                      <div className="text-sm font-black text-blue-800">{task.responsible}</div>
                    </div>
                    <div className="bg-gray-100 p-2 rounded">
                      <div className="text-[10px] font-black text-gray-500 uppercase">Temps Cuisson</div>
                      <div className="text-sm font-black">{formatDuration(task.cookTime)}</div>
                    </div>
                    <div className="bg-red-600 text-white p-2 rounded text-center">
                      <div className="text-[10px] font-black uppercase">Consommer avant</div>
                      <div className="text-lg font-black">{format(expiry, 'dd/MM/yy HH:mm')}</div>
                    </div>
                  </div>

                  {/* INSTRUCTIONS BOX (TEXTE COMPLET) */}
                  <div className="flex-1 border-l-2 border-gray-100 pl-6">
                    <div className="text-[12px] font-black uppercase text-gray-400 mb-2">Instructions de préparation :</div>
                    <div className="text-[14px] leading-relaxed font-medium text-gray-900 whitespace-pre-wrap">
                      {task.comments || "Aucune instruction spécifique. Respecter les protocoles de sécurité alimentaire standards."}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t-2 border-dotted border-gray-200 grid grid-cols-2 gap-4">
                      <div className="border-b-2 border-black h-10 flex items-end pb-1 text-[10px] font-black uppercase text-gray-400">N° de Lot / Étiquette</div>
                      <div className="border-b-2 border-black h-10 flex items-end pb-1 text-[10px] font-black uppercase text-gray-400">Température de Refroidissement</div>
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