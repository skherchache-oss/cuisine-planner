
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
    return shiftOrder[a.shift] - shiftOrder[b.shift];
  });

  return (
    <div className="bg-white text-black" style={{ width: '297mm' }}>
      
      {/* SECTION 1 : PLANNING HEBDOMADAIRE (PAGE 1) */}
      <div className="html2pdf__page-break" style={{ padding: '10mm', minHeight: '210mm' }}>
        <div className="flex justify-between items-center mb-6 border-b-[5px] border-black pb-4">
          <div className="flex items-center gap-5">
            <div className="bg-black text-white px-5 py-2 text-3xl font-black rounded-xl uppercase tracking-tighter">BISTROT M</div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">Registre de Production Hebdomadaire</h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Traçabilité HACCP - Management de Brigade</p>
            </div>
          </div>
          <div className="border-[4px] border-black px-8 py-3 font-black text-xl uppercase bg-gray-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            SEMAINE DU : {weekLabel}
          </div>
        </div>

        <table className="w-full border-collapse border-[3px] border-black table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-[2px] border-black p-3 w-[80px] text-[11px] uppercase font-black">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border-[2px] border-black p-3 font-black text-center uppercase text-[12px]">
                  <div className="text-black">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[10px] text-gray-400 font-bold">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id} className="avoid-break">
                <td className="border-[2px] border-black p-3 bg-gray-50 align-middle text-center">
                  <div className="text-3xl mb-1">{shift.icon}</div>
                  <div className="text-[9px] font-black uppercase leading-tight">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && 
                    isSameDay(new Date(t.startTime), date)
                  );
                  
                  return (
                    <td key={dayIdx} className="border-[2px] border-black p-2 align-top bg-white h-full min-h-[160px]">
                      <div className="flex flex-col gap-3">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div key={task.id} 
                                 className="avoid-break border-[2px] border-black p-2 rounded-md bg-white flex flex-col gap-1.5 shadow-sm">
                              
                              <div className="flex justify-between items-start border-b-[1.5px] border-black pb-1.5 mb-1.5">
                                <span className="font-black uppercase text-[10px] leading-none flex-1 pr-2">
                                  {task.name}
                                </span>
                                <span className="font-black text-[9px] bg-black text-white px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                                  {format(parseISO(task.startTime), 'HH:mm')}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 text-[8px] font-bold leading-none gap-y-1.5">
                                <span className="truncate">👤 Chef: {task.responsible}</span>
                                <span className="text-right">🔥 {formatDuration(task.cookTime)}</span>
                                <span className="col-span-2 font-black bg-gray-100 border border-black/10 px-1.5 py-1 text-center rounded">
                                  DLC: {format(expiry, 'dd/MM HH:mm')}
                                </span>
                              </div>

                              {/* Zone de relevé manuel obligatoire */}
                              <div className="mt-2 pt-2 border-t border-dashed border-black/30">
                                <div className="flex justify-between items-end gap-3">
                                  <div className="flex-1">
                                    <div className="text-[7px] font-black uppercase text-gray-400 mb-0.5">T° Cœur</div>
                                    <div className="border-b-2 border-black h-5 w-full"></div>
                                  </div>
                                  <div className="w-14">
                                    <div className="text-[7px] font-black uppercase text-gray-400 mb-0.5">VISA</div>
                                    <div className="border-b-2 border-black h-5 w-full"></div>
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

        {/* Pied de page HACCP mis à jour */}
        <div className="mt-8 avoid-break">
          <div className="w-full bg-gray-900 text-white p-5 rounded-xl flex items-center justify-between gap-8 border-[3px] border-black">
            <div className="flex items-center gap-6">
              <div className="text-4xl">🛡️</div>
              <div className="text-[10px] font-bold uppercase leading-relaxed tracking-wide">
                <span className="text-orange-400 font-black">CONTRÔLE CRITIQUE :</span> Températures de cuisson & refroidissement obligatoires.<br/>
                Validation visuelle du conditionnement et étiquetage DLC.<br/>
                <span className="text-orange-400 font-black">CONTACTER LE CHEF DE CUISINE EN CAS DE DOUTE.</span>
              </div>
            </div>
            <div className="text-right">
               <span className="text-[8px] opacity-40 italic font-black uppercase tracking-widest leading-none">Généré le {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SAUT DE PAGE FORCE POUR LES FICHES TECHNIQUES */}
      <div className="html2pdf__page-break"></div>

      {/* SECTION 2 : FICHES INDIVIDUELLES POUR AFFICHAGE (PAGE 2 ET +) */}
      <div style={{ padding: '10mm', width: '297mm' }}>
        <h2 className="text-2xl font-black uppercase border-b-[6px] border-black pb-3 mb-8 flex items-center gap-5">
          <span className="bg-black text-white p-2 rounded-lg text-xl">📋</span> 
          <span>Fiches Techniques & Instructions de Poste</span>
        </h2>
        
        <div className="grid grid-cols-2 gap-8">
          {sortedTasks.map((task) => {
            const startTime = parseISO(task.startTime);
            const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);

            return (
              <div 
                key={task.id} 
                className="avoid-break border-[3px] border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] flex flex-col bg-white"
              >
                <div className="bg-gray-900 text-white p-4 border-b-[3px] border-black flex justify-between items-center">
                  <div className="font-black text-base uppercase tracking-widest">{task.name}</div>
                  <div className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-tighter">
                    {format(startTime, 'EEEE dd MMM', { locale: fr })}
                  </div>
                </div>

                <div className="p-5 grid grid-cols-2 gap-6 flex-1">
                  <div className="space-y-4 border-r-2 border-gray-100 pr-6">
                    <div className="flex justify-between items-center text-[11px] font-bold border-b border-gray-100 pb-2">
                      <span className="text-gray-400 uppercase tracking-widest">Responsable</span>
                      <span className="text-blue-700 font-black">{task.responsible}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold border-b border-gray-100 pb-2">
                      <span className="text-gray-400 uppercase tracking-widest">Temps Cuisson</span>
                      <span className="bg-orange-100 px-2 py-0.5 rounded-md font-black">{formatDuration(task.cookTime)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold border-b border-gray-100 pb-2">
                      <span className="text-gray-400 uppercase tracking-widest">Préparation</span>
                      <span className="font-black">{task.prepTime} min</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold border-b border-gray-100 pb-2">
                      <span className="text-gray-400 uppercase tracking-widest">Cond.</span>
                      <span className="font-black">{task.packingTime} min</span>
                    </div>
                    <div className="bg-red-50 border-2 border-red-100 p-3 mt-4 rounded-xl text-center">
                      <div className="text-[9px] font-black text-red-400 uppercase mb-1 tracking-widest leading-none">DLC MAX CALCULÉE</div>
                      <div className="text-sm font-black text-red-900">{format(expiry, 'dd/MM/yyyy HH:mm')}</div>
                    </div>
                  </div>

                  <div className="text-[11px] flex flex-col">
                    <div className="font-black uppercase text-gray-300 text-[9px] mb-3 tracking-[0.2em]">Procédure & Notes</div>
                    <div className="italic leading-relaxed flex-1 text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 min-h-[100px]">
                      {task.comments || "Aucune instruction spécifique. Respecter les protocoles d'hygiène habituels."}
                    </div>
                    
                    <div className="mt-5 pt-4 border-t-2 border-black/5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-black uppercase text-[9px] text-gray-300 tracking-widest">Suivi de Prod</span>
                        <div className="h-4 w-4 rounded-full border-2 border-gray-200"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-[8px] font-bold uppercase text-gray-400 w-12">Lot :</span>
                          <div className="flex-1 border-b-2 border-gray-100 h-4"></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[8px] font-bold uppercase text-gray-400 w-12">T° Refr. :</span>
                          <div className="flex-1 border-b-2 border-gray-100 h-4"></div>
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
