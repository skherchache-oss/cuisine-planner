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
      
      {/* SECTION 1 : PLANNING HEBDOMADAIRE */}
      <div className="print-page" style={{ padding: '8mm', minHeight: '210mm', pageBreakAfter: 'always' }}>
        <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
          <div className="flex items-center gap-4">
            {/* Taille réduite pour tenir sur une ligne */}
            <div className="bg-black text-white px-4 py-2 text-2xl font-black rounded-lg uppercase tracking-tighter whitespace-nowrap">
              BISTROT M
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight leading-none">Registre de Production</h1>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.1em]">Traçabilité HACCP</p>
            </div>
          </div>
          <div className="border-2 border-black px-4 py-2 font-black text-sm uppercase bg-gray-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            SEMAINE DU : {weekLabel}
          </div>
        </div>

        <table className="w-full border-collapse border-2 border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-[65px] text-[9px] uppercase font-black text-center">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border border-black p-2 font-black text-center uppercase text-[11px]">
                  <div className="text-black">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[9px] text-gray-400 font-bold">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border border-black p-2 bg-gray-50 align-middle text-center">
                  <div className="text-xl mb-1">{shift.icon}</div>
                  <div className="text-[7px] font-black uppercase leading-tight">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && 
                    isSameDay(parseISO(t.startTime), date)
                  );
                  
                  return (
                    <td key={dayIdx} className="border border-black p-1 align-top bg-white h-auto min-h-[180px]">
                      <div className="flex flex-col gap-1.5">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div key={task.id} 
                                 className="border border-black p-1.5 rounded bg-white flex flex-col gap-1 shadow-sm"
                                 style={{ pageBreakInside: 'avoid' }}>
                              
                              <div className="flex justify-between items-start border-b border-black/10 pb-1 mb-1">
                                <span className="font-black uppercase text-[8px] leading-tight flex-1 pr-1 break-words">
                                  {task.name}
                                </span>
                                <span className="font-black text-[7px] bg-black text-white px-1 py-0.5 rounded-sm">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 text-[7px] font-bold leading-none gap-y-1">
                                <span className="truncate">👤 {task.responsible}</span>
                                <span className="text-right">🔥 {formatDuration(task.cookTime)}</span>
                                <span className="col-span-2 font-black bg-gray-50 border border-black/5 p-1 text-center rounded text-[7px]">
                                  DLC: {format(expiry, 'dd/MM HH:mm')}
                                </span>
                              </div>

                              <div className="mt-1 pt-1 border-t border-dotted border-black/20">
                                <div className="flex justify-between items-end gap-1">
                                  <div className="flex-1">
                                    <div className="text-[5px] font-black uppercase text-gray-400">T° Cœur</div>
                                    <div className="border-b border-black h-2.5 w-full"></div>
                                  </div>
                                  <div className="w-8">
                                    <div className="text-[5px] font-black uppercase text-gray-400">VISA</div>
                                    <div className="border-b border-black h-2.5 w-full"></div>
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
        <div className="mt-4" style={{ pageBreakInside: 'avoid' }}>
          <div className="w-full bg-gray-900 text-white p-3 rounded-lg flex items-center justify-between gap-4 border border-black">
            <div className="flex items-center gap-3">
              <div className="text-xl">🛡️</div>
              <div className="text-[8px] font-bold uppercase leading-snug tracking-wide">
                <span className="text-orange-400 font-black">CONTRÔLE CRITIQUE :</span> Températures obligatoires.
                Validation étiquetage DLC. — <span className="text-orange-400 font-black">CONTACTER LE CHEF EN CAS DE DOUTE.</span>
              </div>
            </div>
            <div className="text-right">
               <span className="text-[6px] opacity-40 italic font-black uppercase">Généré le {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 : FICHES INDIVIDUELLES */}
      <div style={{ padding: '8mm', width: '297mm' }}>
        <h2 className="text-lg font-black uppercase border-b-2 border-black pb-2 mb-6 flex items-center gap-3">
          <span className="bg-black text-white px-2 py-1 rounded text-sm">📋</span> 
          <span>Fiches Techniques & Instructions</span>
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {sortedTasks.map((task) => {
            const startTime = parseISO(task.startTime);
            const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);

            return (
              <div 
                key={task.id} 
                className="border-2 border-black rounded-lg overflow-hidden flex flex-col bg-white"
                style={{ pageBreakInside: 'avoid', marginBottom: '10px' }}
              >
                <div className="bg-gray-900 text-white p-2.5 border-b-2 border-black flex justify-between items-center">
                  <div className="font-black text-xs uppercase tracking-wider truncate mr-2">{task.name}</div>
                  <div className="text-[8px] font-black bg-white/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {format(startTime, 'EEEE dd MMM', { locale: fr })}
                  </div>
                </div>

                <div className="p-3 grid grid-cols-2 gap-3 flex-1">
                  <div className="space-y-2 border-r border-gray-100 pr-3">
                    <div className="flex justify-between items-center text-[9px] font-bold border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase">Chef</span>
                      <span className="text-blue-700 font-black">{task.responsible}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase">Cuisson</span>
                      <span className="bg-orange-50 px-1 rounded font-black text-orange-700">{formatDuration(task.cookTime)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase">Prép.</span>
                      <span className="font-black">{task.prepTime} min</span>
                    </div>
                    
                    <div className="bg-red-50 border border-red-100 p-2 mt-2 rounded text-center">
                      <div className="text-[7px] font-black text-red-400 uppercase leading-none mb-1">DLC MAX</div>
                      <div className="text-[10px] font-black text-red-900">{format(expiry, 'dd/MM/yyyy HH:mm')}</div>
                    </div>
                  </div>

                  <div className="text-[9px] flex flex-col overflow-hidden">
                    <div className="font-black uppercase text-gray-300 text-[7px] mb-1.5 tracking-widest">Instructions</div>
                    {/* Le texte ici est protégé contre le rognage */}
                    <div className="italic leading-relaxed flex-1 text-gray-800 bg-gray-50 p-2 rounded border border-gray-100 text-[9px] break-words">
                      {task.comments || "Respecter les protocoles d'hygiène habituels."}
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-black/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[6px] font-bold uppercase text-gray-400 w-8">Lot :</span>
                        <div className="flex-1 border-b border-gray-200 h-2.5"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[6px] font-bold uppercase text-gray-400 w-8">T° Ref :</span>
                        <div className="flex-1 border-b border-gray-200 h-2.5"></div>
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