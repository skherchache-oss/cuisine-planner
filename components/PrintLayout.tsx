import React from 'react';
// AJOUT DES EXTENSIONS POUR LE CHARGEMENT DES MODULES
import { PrepTask } from '../types.ts';
import { SHIFTS } from '../constants.ts';
import { formatDuration } from '../utils.ts';
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
    <div className="bg-white text-black font-sans" style={{ width: '297mm', minHeight: '210mm', padding: '8mm', boxSizing: 'border-box' }}>
      
      {/* SECTION 1 : LE PLANNING HEBDOMADAIRE (VUE D'ENSEMBLE OPTIMISÉE) */}
      <section style={{ pageBreakAfter: 'always', marginBottom: '10mm' }}>
        <div className="flex justify-between items-center mb-4 border-b-[3px] border-black pb-3">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white px-3 py-2 text-2xl font-black rounded-lg">CUISINE</div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter">Planning de Production</h1>
              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Registre de traçabilité hebdomadaire</p>
            </div>
          </div>
          <div className="text-right">
            <div className="border-[2.5px] border-black px-4 py-1 font-black text-sm uppercase">
              Semaine : {weekLabel}
            </div>
          </div>
        </div>

        <table className="w-full border-collapse border-[2px] border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-[1.5px] border-black p-1 w-[80px] text-[9px] uppercase font-black">Shift</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border-[1.5px] border-black p-1 font-black text-center uppercase text-[10px]">
                  <div>{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[8px] opacity-60">{format(date, 'dd/MM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id} style={{ pageBreakInside: 'auto' }}>
                <td className="border-[1.5px] border-black p-2 bg-gray-50 align-middle text-center">
                  <div className="text-xl mb-0.5">{shift.icon}</div>
                  <div className="text-[8px] font-black uppercase leading-tight">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && 
                    isSameDay(new Date(t.startTime), date)
                  );
                  
                  return (
                    <td key={dayIdx} className="border-[1.5px] border-black p-1 align-top bg-white min-h-[80px]">
                      <div className="flex flex-col gap-1.5">
                        {dayTasks.map(task => (
                          <div key={task.id} className="border-[1px] border-black p-1.5 rounded-sm bg-gray-50 flex flex-col gap-0.5 shadow-sm">
                            {/* Titre */}
                            <div className="font-black uppercase text-[8px] leading-none border-b border-black/10 pb-1 mb-0.5 truncate">
                              {task.name}
                            </div>
                            
                            {/* Meta Info (Responsable + Heure Début + Cuisson) */}
                            <div className="flex justify-between items-center text-[6.5px] font-bold">
                              <span className="truncate max-w-[35%]">👤 {task.responsible}</span>
                              <span className="whitespace-nowrap">🕒 {format(parseISO(task.startTime), 'HH:mm')}</span>
                              <span className="whitespace-nowrap">🔥 {formatDuration(task.cookTime)}</span>
                            </div>

                            {/* Autres Temps (Prep + Cond) */}
                            <div className="flex justify-between text-[6.5px] font-bold opacity-70 border-t border-black/5 pt-0.5 mt-0.5">
                              <span>🔪 P:{task.prepTime}m</span>
                              <span>📦 C:{task.packingTime}m</span>
                            </div>

                            {/* Notes / Recette */}
                            {task.comments && (
                              <div className="text-[6px] leading-[1.1] italic text-gray-700 mt-0.5 pt-0.5 border-t border-dotted border-black/10 whitespace-pre-wrap">
                                <span className="font-black not-italic text-[5.5px] opacity-40 uppercase">Recette: </span>
                                {task.comments}
                              </div>
                            )}

                            {/* ZONE POUR NOTES MANUSCRITES EN PLUS */}
                            <div className="mt-1 pt-0.5 border-t border-black/5">
                              <div className="flex items-end gap-1">
                                <span className="text-[5.5px] font-black uppercase opacity-40 leading-none">Obs:</span>
                                <div className="flex-1 border-b border-dotted border-black/30 h-[8px]"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer compact */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="col-span-3 bg-black text-white p-2 rounded-sm flex items-center justify-between">
            <div className="text-[7.5px] font-bold uppercase leading-tight">
              Alerte HACCP : Tout produit non étiqueté sera jeté. <br/> Respect strict des temps de refroidissement ( &lt; 10°C en 120 min).
            </div>
            <div className="text-right border-l border-white/20 pl-4">
              <span className="text-[8px] font-black uppercase">Validation Direction :</span>
              <div className="h-4 w-24 border-b border-white mt-0.5 opacity-30"></div>
            </div>
          </div>
          <div className="col-span-1 border-[1.5px] border-black p-1 text-[7px] font-black uppercase text-center flex items-center justify-center">
            Document Contrôlé le {format(new Date(), 'dd/MM/yyyy')}
          </div>
        </div>
      </section>

      {/* SECTION 2 : FICHES DÉTAILLÉES */}
      <section>
        <div className="page-break-before-always h-1"></div>
        <h2 className="text-xl font-black uppercase border-b-4 border-black pb-1 mb-6">Détails des Fiches de Production</h2>
        
        <div className="space-y-6">
          {sortedTasks.map((task, index) => {
            const startTime = parseISO(task.startTime);
            const endTime = new Date(startTime.getTime() + (task.prepTime + task.cookTime + task.packingTime) * 60000);
            const dlcDate = new Date(endTime.getTime() + (task.shelfLifeDays * 24 * 60 * 60 * 1000));

            return (
              <div 
                key={task.id} 
                style={{ pageBreakInside: 'avoid' }}
                className="border-[2px] border-black rounded-lg overflow-hidden"
              >
                <div className="bg-gray-100 p-2 border-b-[2px] border-black flex justify-between items-center">
                  <div className="font-black text-xs uppercase">{task.name}</div>
                  <div className="text-[9px] font-bold uppercase">
                    {format(startTime, 'EEEE dd MMMM', { locale: fr })} à {format(startTime, 'HH:mm')} | 👤 {task.responsible}
                  </div>
                </div>

                <div className="p-3 grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-[9px] space-y-1">
                    <div className="flex justify-between border-b border-black/10 pb-1">
                      <span className="font-black opacity-50 uppercase">Préparation</span>
                      <span className="font-bold">{task.prepTime} min</span>
                    </div>
                    <div className="flex justify-between border-b border-black/10 pb-1">
                      <span className="font-black opacity-50 uppercase">Cuisson</span>
                      <span className="font-bold">{formatDuration(task.cookTime)}</span>
                    </div>
                    <div className="flex justify-between border-b border-black/10 pb-1">
                      <span className="font-black opacity-50 uppercase">Conditionnement</span>
                      <span className="font-bold">{task.packingTime} min</span>
                    </div>
                    <div className="bg-black text-white p-1.5 mt-2 rounded-sm text-center">
                      <div className="text-[7px] font-black opacity-60 uppercase">DLC Estimée</div>
                      <div className="text-[9px] font-black">{format(dlcDate, 'dd/MM/yy HH:mm')}</div>
                    </div>
                  </div>

                  <div className="col-span-2 text-[9px] bg-gray-50 p-2 rounded-sm border border-black/5">
                    <div className="font-black uppercase opacity-30 text-[7px] mb-1">Commentaires & Instructions de Recette</div>
                    <div className="italic leading-relaxed">
                      {task.comments || "Aucune instruction particulière."}
                    </div>
                    <div className="mt-4 border-t border-black/10 pt-2">
                      <div className="font-black uppercase opacity-30 text-[7px] mb-2">Observations de production (manuscrit)</div>
                      <div className="border-b border-dotted border-black/30 h-6"></div>
                      <div className="border-b border-dotted border-black/30 h-6"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};

export default PrintLayout;