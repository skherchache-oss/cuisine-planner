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
      <div style={{ padding: '5mm', pageBreakAfter: 'always' }}>
        <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-3">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white px-4 py-1.5 text-xl font-black rounded uppercase whitespace-nowrap">
              BISTROT M
            </div>
            <div>
              <h1 className="text-base font-black uppercase leading-tight">Registre de Production</h1>
              <p className="text-[8px] font-bold text-gray-500 uppercase">Traçabilité HACCP</p>
            </div>
          </div>
          <div className="border-2 border-black px-3 py-1.5 font-black text-xs uppercase bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            SEMAINE DU : {weekLabel}
          </div>
        </div>

        <table className="w-full border-collapse border-2 border-black">
          <thead>
            <tr className="bg-gray-100 text-[10px] uppercase font-black">
              <th className="border border-black p-2 w-[60px]">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border border-black p-2 text-center">
                  <div>{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[8px] text-gray-400">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border border-black p-2 bg-gray-50 text-center">
                  <div className="text-xl">{shift.icon}</div>
                  <div className="text-[7px] font-black uppercase">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && 
                    isSameDay(parseISO(t.startTime), date)
                  );
                  
                  return (
                    <td key={dayIdx} className="border border-black p-1 align-top bg-white" style={{ height: 'auto', minHeight: '140px' }}>
                      <div className="flex flex-col gap-1.5">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div key={task.id} className="border border-black p-1.5 rounded bg-white" style={{ pageBreakInside: 'avoid' }}>
                              <div className="flex justify-between items-start border-b border-black/10 pb-1 mb-1">
                                <span className="font-black uppercase text-[7px] leading-tight break-words pr-1 flex-1">
                                  {task.name}
                                </span>
                                <span className="font-black text-[6px] bg-black text-white px-1 rounded-sm whitespace-nowrap">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                              </div>
                              <div className="text-[6px] font-bold leading-tight space-y-1">
                                <div className="flex justify-between">
                                  <span className="truncate">👤 {task.responsible}</span>
                                  <span>🔥 {formatDuration(task.cookTime)}</span>
                                </div>
                                <div className="bg-gray-50 border border-black/5 p-0.5 text-center font-black rounded">
                                  DLC: {format(expiry, 'dd/MM HH:mm')}
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
      </div>

      {/* SECTION 2 : FICHES TECHNIQUES (PAGE 2 ET PLUS) */}
      <div style={{ padding: '5mm' }}>
        <h2 className="text-lg font-black uppercase border-b-2 border-black pb-2 mb-6 flex items-center gap-2">
          <span className="bg-black text-white px-2 py-0.5 rounded">📋</span> 
          <span>Fiches Techniques & Instructions</span>
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          {sortedTasks.map((task) => {
            const startTime = parseISO(task.startTime);
            const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);

            return (
              <div 
                key={task.id} 
                className="border-2 border-black rounded-lg bg-white overflow-hidden" 
                style={{ pageBreakInside: 'avoid', marginBottom: '20px', display: 'block' }}
              >
                <div className="bg-gray-900 text-white p-3 border-b-2 border-black flex justify-between items-center">
                  <div className="font-black text-[11px] uppercase tracking-wider">{task.name}</div>
                  <div className="text-[8px] font-black bg-white/20 px-2 py-0.5 rounded uppercase">
                    {format(startTime, 'EEEE dd MMM', { locale: fr })}
                  </div>
                </div>

                <div className="p-4 flex flex-row gap-4" style={{ height: 'auto' }}>
                  {/* Data Column */}
                  <div className="w-[100px] space-y-2 border-r border-gray-100 pr-3 shrink-0">
                    <div className="flex flex-col text-[8px] font-bold border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase text-[6px]">Responsable</span>
                      <span className="text-blue-700 font-black truncate">{task.responsible}</span>
                    </div>
                    <div className="flex flex-col text-[8px] font-bold border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase text-[6px]">Cuisson</span>
                      <span className="font-black">{formatDuration(task.cookTime)}</span>
                    </div>
                    <div className="bg-red-50 border border-red-100 p-2 rounded text-center">
                      <div className="text-[6px] font-black text-red-400 uppercase mb-0.5">DLC Max</div>
                      <div className="text-[9px] font-black text-red-900">{format(expiry, 'dd/MM/yy HH:mm')}</div>
                    </div>
                  </div>

                  {/* Instructions Column - Utilisation de block pour éviter le rognage */}
                  <div className="flex-1" style={{ display: 'block' }}>
                    <div className="font-black uppercase text-gray-300 text-[7px] mb-1.5 tracking-widest">Procédure & Notes</div>
                    <div 
                      className="italic text-gray-800 bg-gray-50 p-3 rounded border border-gray-100 text-[10px] leading-relaxed break-words" 
                      style={{ display: 'block', height: 'auto', minHeight: '80px' }}
                    >
                      {task.comments || "Respecter les protocoles d'hygiène habituels (HACCP)."}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-black/5 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[7px] font-black text-gray-400 uppercase w-10">Lot :</span>
                        <div className="flex-1 border-b border-gray-200 h-3"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[7px] font-black text-gray-400 uppercase w-10">T° Ref :</span>
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