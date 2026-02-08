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
      <div className="html2pdf__page-break" style={{ padding: '8mm' }}>
        <div className="flex justify-between items-center mb-6 border-b-[3px] border-black pb-4">
          <div className="flex items-center gap-4">
            {/* BISTROT M : Ajusté pour tenir sur une ligne */}
            <div className="bg-black text-white px-4 py-1.5 text-2xl font-black rounded-lg uppercase tracking-tighter whitespace-nowrap">
              BISTROT M
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight leading-none">Registre de Production</h1>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Traçabilité HACCP</p>
            </div>
          </div>
          <div className="border-[3px] border-black px-5 py-2 font-black text-lg uppercase bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            SEMAINE DU : {weekLabel}
          </div>
        </div>

        <table className="w-full border-collapse border-[2px] border-black table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-[2px] border-black p-2 w-[70px] text-[10px] uppercase font-black text-center">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border-[2px] border-black p-2 font-black text-center uppercase text-[11px]">
                  <div className="text-black">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[9px] text-gray-400 font-bold">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id} className="avoid-break">
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
                    <td key={dayIdx} className="border-[2px] border-black p-1.5 align-top bg-white h-auto" style={{ minHeight: '140px' }}>
                      <div className="flex flex-col gap-2">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div key={task.id} 
                                 className="avoid-break border-[1.5px] border-black p-1.5 rounded-md bg-white flex flex-col gap-1 shadow-sm">
                              
                              <div className="flex justify-between items-start border-b border-black/20 pb-1 mb-1">
                                <span className="font-black uppercase text-[8px] leading-tight flex-1 pr-1 break-words">
                                  {task.name}
                                </span>
                                <span className="font-black text-[7px] bg-black text-white px-1 py-0.5 rounded-sm">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 text-[7px] font-bold leading-none gap-y-1">
                                <span className="truncate">👤 {task.responsible}</span>
                                <span className="text-right whitespace-nowrap">🔥 {formatDuration(task.cookTime)}</span>
                                <span className="col-span-2 font-black bg-gray-100 border border-black/5 p-1 text-center rounded mt-0.5 text-[7px]">
                                  DLC: {format(expiry, 'dd/MM HH:mm')}
                                </span>
                              </div>

                              <div className="mt-1 pt-1 border-t border-dotted border-black/30">
                                <div className="flex justify-between items-end gap-2">
                                  <div className="flex-1">
                                    <div className="text-[5px] font-black uppercase text-gray-400">T° Cœur</div>
                                    <div className="border-b border-black h-3 w-full"></div>
                                  </div>
                                  <div className="w-8">
                                    <div className="text-[5px] font-black uppercase text-gray-400">VISA</div>
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

        <div className="mt-6 avoid-break">
          <div className="w-full bg-gray-900 text-white p-4 rounded-xl flex items-center justify-between gap-4 border-[2px] border-black">
            <div className="flex items-center gap-4">
              <div className="text-2xl">🛡️</div>
              <div className="text-[9px] font-bold uppercase leading-snug tracking-wide">
                <span className="text-orange-400 font-black">CONTRÔLE CRITIQUE :</span> Températures cuisson & refroidissement obligatoires.
                Validation étiquetage DLC. — <span className="text-orange-400 font-black">VOIR CHEF EN CAS DE DOUTE.</span>
              </div>
            </div>
            <div className="text-right whitespace-nowrap">
                <span className="text-[7px] opacity-40 italic font-black uppercase tracking-widest">Généré le {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="html2pdf__page-break"></div>

      {/* SECTION 2 : FICHES INDIVIDUELLES - ANTI ROGNAGE */}
      <div style={{ padding: '8mm', width: '297mm' }}>
        <h2 className="text-xl font-black uppercase border-b-[4px] border-black pb-2 mb-6 flex items-center gap-4">
          <span className="bg-black text-white px-2 py-1 rounded text-lg">📋</span> 
          <span>Fiches Techniques & Instructions</span>
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          {sortedTasks.map((task) => {
            const startTime = parseISO(task.startTime);
            const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);

            return (
              <div 
                key={task.id} 
                className="avoid-break border-[2px] border-black rounded-xl overflow-hidden shadow-sm bg-white"
                style={{ marginBottom: '10px' }}
              >
                <div className="bg-gray-900 text-white p-3 border-b-[2px] border-black flex justify-between items-center">
                  <div className="font-black text-sm uppercase tracking-wider truncate mr-2">{task.name}</div>
                  <div className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {format(startTime, 'EEEE dd MMM', { locale: fr })}
                  </div>
                </div>

                <div className="p-4 grid grid-cols-2 gap-4">
                  <div className="space-y-3 border-r border-gray-100 pr-4">
                    <div className="flex justify-between items-center text-[10px] font-bold border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase">Chef</span>
                      <span className="text-blue-700 font-black truncate max-w-[80px] text-right">{task.responsible}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase">Cuisson</span>
                      <span className="font-black whitespace-nowrap">{formatDuration(task.cookTime)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold border-b border-gray-50 pb-1">
                      <span className="text-gray-400 uppercase">Prép.</span>
                      <span className="font-black">{task.prepTime} min</span>
                    </div>
                    
                    <div className="bg-red-50 border border-red-100 p-2 mt-2 rounded-lg text-center">
                      <div className="text-[8px] font-black text-red-400 uppercase leading-none mb-1">DLC MAX</div>
                      <div className="text-[11px] font-black text-red-900">{format(expiry, 'dd/MM/yyyy HH:mm')}</div>
                    </div>
                  </div>

                  {/* Correction texte masqué : Utilisation de block et break-words */}
                  <div className="text-[10px] flex flex-col overflow-hidden">
                    <div className="font-black uppercase text-gray-300 text-[8px] mb-2 tracking-widest">Instructions</div>
                    <div className="italic leading-relaxed text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-100 text-[9px] break-words h-auto min-h-[80px] block">
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