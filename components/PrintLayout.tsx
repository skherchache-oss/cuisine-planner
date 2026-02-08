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
    <div className="bg-white text-black" style={{ width: '297mm', margin: '0 auto' }}>
      
      {/* SECTION 1 : PLANNING HEBDOMADAIRE (PAGE 1) */}
      <div className="print-page" style={{ padding: '8mm', minHeight: '210mm', pageBreakAfter: 'always' }}>
        <div className="flex justify-between items-center mb-6 border-b-[5px] border-black pb-4">
          <div className="flex items-center gap-5">
            <div className="bg-black text-white px-5 py-2 text-3xl font-black rounded-xl uppercase tracking-tighter">BISTROT M</div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">Registre de Production Hebdomadaire</h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Traçabilité HACCP - Management de Brigade</p>
            </div>
          </div>
          <div className="border-[4px] border-black px-6 py-3 font-black text-lg uppercase bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            SEMAINE DU : {weekLabel}
          </div>
        </div>

        <table className="w-full border-collapse border-[3px] border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-[2px] border-black p-2 w-[70px] text-[10px] uppercase font-black text-center">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border-[2px] border-black p-2 font-black text-center uppercase text-[12px]">
                  <div className="text-black">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[10px] text-gray-400 font-bold">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border-[2px] border-black p-2 bg-gray-50 align-middle text-center">
                  <div className="text-2xl mb-1">{shift.icon}</div>
                  <div className="text-[8px] font-black uppercase leading-tight">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && 
                    isSameDay(parseISO(t.startTime), date)
                  );
                  
                  return (
                    <td key={dayIdx} className="border-[2px] border-black p-1.5 align-top bg-white min-h-[220px] h-auto">
                      <div className="flex flex-col gap-2">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div key={task.id} 
                                 className="border-[1.5px] border-black p-1.5 rounded-md bg-white flex flex-col gap-1 shadow-sm"
                                 style={{ pageBreakInside: 'avoid' }}>
                              
                              <div className="flex justify-between items-start border-b border-black pb-1 mb-1">
                                <span className="font-black uppercase text-[9px] leading-tight flex-1 pr-1">
                                  {task.name}
                                </span>
                                <span className="font-black text-[8px] bg-black text-white px-1 py-0.5 rounded-sm">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 text-[7px] font-bold leading-none gap-y-1">
                                <span className="truncate">👤 {task.responsible}</span>
                                <span className="text-right">🔥 {formatDuration(task.cookTime)}</span>
                                <span className="col-span-2 font-black bg-gray-100 border border-black/5 p-1 text-center rounded mt-0.5 text-[8px]">
                                  DLC: {format(expiry, 'dd/MM HH:mm')}
                                </span>
                              </div>

                              <div className="mt-1 pt-1 border-t border-dotted border-black/30">
                                <div className="flex justify-between items-end gap-2">
                                  <div className="flex-1">
                                    <div className="text-[6px] font-black uppercase text-gray-400">T° Cœur</div>
                                    <div className="border-b border-black h-3 w-full"></div>
                                  </div>
                                  <div className="w-10">
                                    <div className="text-[6px] font-black uppercase text-gray-400">VISA</div>
                                    <div className="border-b border-black h-3 w-full"></div>
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

        {/* Pied de page HACCP */}
        <div className="mt-6" style={{ pageBreakInside: 'avoid' }}>
          <div className="w-full bg-gray-900 text-white p-4 rounded-xl flex items-center justify-between gap-4 border-[2px] border-black">
            <div className="flex items-center gap-4">
              <div className="text-2xl">🛡️</div>
              <div className="text-[9px] font-bold uppercase leading-snug tracking-wide">
                <span className="text-orange-400 font-black">CONTRÔLE CRITIQUE :</span> Températures de cuisson & refroidissement obligatoires.<br/>
                Validation visuelle du conditionnement et étiquetage DLC. — <span className="text-orange-400 font-black">CAS DE DOUTE : VOIR CHEF.</span>
              </div>
            </div>
            <div className="text-right whitespace-nowrap">
               <span className="text-[7px] opacity-40 italic font-black uppercase tracking-widest leading-none">Généré le {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SAUT DE PAGE POUR LES FICHES TECHNIQUES */}
      <div style={{ pageBreakBefore: 'always' }}></div>

      {/* SECTION 2 : FICHES INDIVIDUELLES */}
      <div style={{ padding: '8mm', width: '297mm' }}>
        <h2 className="text-xl font-black uppercase border-b-[4px] border-black pb-2 mb-6 flex items-center gap-4">
          <span className="bg-black text-white px-2 py-1 rounded text-lg">📋</span> 
          <span>Fiches Techniques & Instructions de Poste</span>
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          {sortedTasks.map((task) => {
            const startTime = parseISO(task.startTime);
            const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);

            return (
              <div 
                key={task.id} 
                className="border-[2px] border-black rounded-xl overflow-hidden shadow-sm flex flex-col bg-white"
                style={{ pageBreakInside: 'avoid', marginBottom: '10px' }}
              >
                <div className="bg-gray-900 text-white p-3 border-b-[2px] border-black flex justify-between items-center">
                  <div className="font-black text-sm uppercase tracking-wider">{task.name}</div>
                  <div className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full">
                    {format(startTime, 'EEEE dd MMM', { locale: fr })}
                  </div>
                </div>

                <div className="p-4 grid grid-cols-2 gap-4 flex-1">
                  <div className="space-y-3 border-r border-gray-100 pr-4">
                    <div className="flex justify-between items-center text-[10px] font-bold border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase">Chef</span>
                      <span className="text-blue-700 font-black">{task.responsible}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase">Cuisson</span>
                      <span className="bg-orange-100 px-1 rounded font-black">{formatDuration(task.cookTime)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase">Prép.</span>
                      <span className="font-black">{task.prepTime} min</span>
                    </div>
                    
                    <div className="bg-red-50 border border-red-100 p-2 mt-2 rounded-lg text-center">
                      <div className="text-[8px] font-black text-red-400 uppercase leading-none mb-1">DLC MAX</div>
                      <div className="text-xs font-black text-red-900">{format(expiry, 'dd/MM/yyyy HH:mm')}</div>
                    </div>
                  </div>

                  <div className="text-[10px] flex flex-col">
                    <div className="font-black uppercase text-gray-300 text-[8px] mb-2 tracking-widest">Instructions</div>
                    <div className="italic leading-relaxed flex-1 text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-100 min-h-[60px] text-[9px]">
                      {task.comments || "Respecter les protocoles d'hygiène habituels."}
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-black/5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[7px] font-bold uppercase text-gray-400 w-10">Lot :</span>
                          <div className="flex-1 border-b border-gray-200 h-3"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[7px] font-bold uppercase text-gray-400 w-10">T° Ref :</span>
                          <div className="flex-1 border-b border-gray-200 h-3"></div>
                        </div>
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