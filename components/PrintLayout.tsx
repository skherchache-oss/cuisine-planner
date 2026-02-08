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
    <div className="bg-white text-black" style={{ width: '280mm', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* SECTION 1 : PLANNING HEBDOMADAIRE */}
      <div className="html2pdf__page-break" style={{ padding: '5mm' }}>
        <div className="flex justify-between items-center mb-4 border-b border-black pb-2">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white px-3 py-1 text-xl font-black rounded uppercase">
              BISTROT M
            </div>
            <div>
              <h1 className="text-sm font-black uppercase leading-none">Registre de Production</h1>
              <p className="text-[8px] font-bold text-gray-400 uppercase">HACCP & Traçabilité</p>
            </div>
          </div>
          <div className="border border-black px-4 py-1 font-black text-sm uppercase bg-gray-50">
            SEMAINE DU : {weekLabel}
          </div>
        </div>

        <table className="w-full border-collapse border border-black table-fixed">
          <thead>
            <tr className="bg-gray-100 text-[9px] uppercase font-black">
              <th className="border border-black p-1 w-[50px]">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border border-black p-1 text-center">
                  <div>{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[7px] text-gray-400">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id} className="avoid-break">
                <td className="border border-black p-1 bg-gray-50 text-center">
                  <div className="text-xl">{shift.icon}</div>
                  <div className="text-[7px] font-black uppercase">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && 
                    isSameDay(parseISO(t.startTime), date)
                  );
                  
                  return (
                    <td key={dayIdx} className="border border-black p-1 align-top bg-white" style={{ height: 'auto' }}>
                      <div className="flex flex-col gap-1.5">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div key={task.id} className="border border-black p-1 rounded-sm bg-white" style={{ pageBreakInside: 'avoid', display: 'block' }}>
                              <div className="flex justify-between items-start border-b border-black/10 pb-1 mb-1">
                                <span className="font-black uppercase text-[7px] leading-tight break-words flex-1 pr-1">
                                  {task.name}
                                </span>
                                <span className="font-black text-[6px] bg-black text-white px-1 rounded-xs">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                              </div>
                              <div className="text-[6px] font-bold leading-none space-y-1">
                                <div className="flex justify-between">
                                  <span className="truncate">👤 {task.responsible}</span>
                                  <span>🔥 {formatDuration(task.cookTime)}</span>
                                </div>
                                <div className="bg-gray-50 border border-black/5 p-0.5 text-center font-black rounded-xs">
                                  DLC: {format(expiry, 'dd/MM HH:mm')}
                                </div>
                              </div>
                              <div className="mt-1 flex gap-1 border-t border-dotted border-black/20 pt-1">
                                <div className="flex-1 border-b border-black h-2"></div>
                                <div className="w-4 border-b border-black h-2"></div>
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

      {/* SAUT DE PAGE POUR LES FICHES */}
      <div className="html2pdf__page-break" style={{ height: '1px' }}></div>

      {/* SECTION 2 : FICHES D'INSTRUCTIONS */}
      <div style={{ padding: '5mm' }}>
        <h2 className="text-lg font-black uppercase border-b border-black pb-2 mb-4 flex items-center gap-2">
          <span>📋 Fiches Techniques & Instructions</span>
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {sortedTasks.map((task) => {
            const startTime = parseISO(task.startTime);
            const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);

            return (
              <div key={task.id} 
                   className="border border-black rounded bg-white" 
                   style={{ pageBreakInside: 'avoid', marginBottom: '10px', display: 'block' }}>
                
                <div className="bg-gray-900 text-white p-2 border-b border-black flex justify-between items-center">
                  <div className="font-black text-[10px] uppercase truncate">{task.name}</div>
                  <div className="text-[7px] font-black bg-white/20 px-2 py-0.5 rounded uppercase">
                    {format(startTime, 'EEEE dd MMM', { locale: fr })}
                  </div>
                </div>

                <div className="p-2 flex flex-row gap-3">
                  {/* Gauche : Data */}
                  <div className="w-1/3 space-y-2 border-r border-gray-100 pr-2 shrink-0">
                    <div className="flex flex-col text-[8px] font-bold border-b border-gray-50 pb-1">
                      <span className="text-gray-400 text-[6px]">CHEF</span>
                      <span className="text-blue-700 font-black truncate">{task.responsible}</span>
                    </div>
                    <div className="flex flex-col text-[8px] font-bold border-b border-gray-50 pb-1">
                      <span className="text-gray-400 text-[6px]">CUISSON</span>
                      <span className="font-black">{formatDuration(task.cookTime)}</span>
                    </div>
                    <div className="bg-red-50 border border-red-100 p-1 text-center rounded">
                      <div className="text-[6px] font-black text-red-400 mb-0.5">DLC</div>
                      <div className="text-[8px] font-black text-red-900">{format(expiry, 'dd/MM/yy HH:mm')}</div>
                    </div>
                  </div>

                  {/* Droite : Instructions (CORRIGÉ POUR VERCEL) */}
                  <div className="flex-1" style={{ display: 'block' }}>
                    <div className="font-black uppercase text-gray-300 text-[7px] mb-1">Instructions</div>
                    <div className="italic text-gray-800 bg-gray-50 p-2 rounded text-[9px] leading-tight break-words" 
                         style={{ display: 'block', height: 'auto', minHeight: '50px' }}>
                      {task.comments || "Suivre les protocoles d'hygiène habituels."}
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-black/5 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[6px] font-black text-gray-400 uppercase w-8">Lot:</span>
                        <div className="flex-1 border-b border-gray-200 h-2"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[6px] font-black text-gray-400 uppercase w-8">T° Ref:</span>
                        <div className="flex-1 border-b border-gray-200 h-2"></div>
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