import React from 'react';
import { PrepTask } from '../types.ts';
import { SHIFTS } from '../constants.ts';
import { calculateExpiry } from '../utils.ts';
import { addDays, isSameDay, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintLayoutProps {
  tasks: PrepTask[];
  weekLabel: string;
  weekStartDate: Date;
}

// Fonction utilitaire pour l'affichage intelligent de la durée
const formatDuration = (minutes: number) => {
  if (minutes >= 60 && minutes % 15 === 0) {
    return `${minutes / 60}H`;
  }
  return `${minutes} MIN`;
};

const PrintLayout: React.FC<PrintLayoutProps> = ({ tasks, weekLabel, weekStartDate }) => {
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));

  const sortedTasks = [...tasks]
    .filter(t => {
      const taskDate = new Date(t.startTime);
      return taskDate >= weekStartDate && taskDate <= addDays(weekStartDate, 5);
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="bg-white text-black font-sans" style={{ width: '287mm', padding: '5mm', boxSizing: 'border-box' }}>
      <style>{`
        @page { size: landscape; margin: 0; }
        .print-card { page-break-inside: avoid; break-inside: avoid; }
      `}</style>
      
      {/* SECTION 1 : LE PLANNING HEBDOMADAIRE */}
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
              <tr key={shift.id}>
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
                          <div key={task.id} className="border-[1px] border-black p-1.5 rounded-sm bg-gray-50 flex flex-col gap-0.5">
                            <div className="font-black uppercase text-[8px] leading-none border-b border-black/10 pb-1 mb-0.5 truncate">
                              {task.name}
                            </div>
                            <div className="flex justify-between items-center text-[6.5px] font-bold">
                              <span className="truncate max-w-[35%]">👤 {task.responsible}</span>
                              <span className="whitespace-nowrap">🕒 {format(parseISO(task.startTime), 'HH:mm')}</span>
                              <span className="whitespace-nowrap">🔥 {formatDuration(task.cookTime)}</span>
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
      </section>

      {/* SECTION 2 : FICHES DÉTAILLÉES (Une fiche = un bloc aéré) */}
      <section>
        <h2 className="text-xl font-black uppercase border-b-4 border-black pb-1 mb-6">Détails des Fiches de Production</h2>
        <div className="grid grid-cols-2 gap-6"> {/* Deux fiches par ligne pour plus d'espace */}
          {sortedTasks.map((task) => {
            const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);

            return (
              <div key={task.id} className="print-card border-[3px] border-black flex flex-col min-h-[120mm]">
                <div className="bg-black text-white p-4 flex justify-between items-center">
                  <div className="font-black text-lg uppercase leading-tight">{task.name}</div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase opacity-70">Date de Prod</div>
                    <div className="text-sm font-black">{format(parseISO(task.startTime), 'dd/MM/yyyy')}</div>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="grid grid-cols-3 gap-4 mb-6 border-b-2 border-black pb-6 text-center">
                    <div>
                      <div className="text-[10px] font-black uppercase opacity-40">Préparation</div>
                      <div className="text-2xl font-black">{task.prepTime}m</div>
                    </div>
                    <div className="border-x-2 border-black/10">
                      <div className="text-[10px] font-black uppercase opacity-40">Cuisson</div>
                      <div className="text-4xl font-black">{formatDuration(task.cookTime)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase opacity-40">Conditionnement</div>
                      <div className="text-2xl font-black">{task.packingTime}m</div>
                    </div>
                  </div>

                  <div className="mb-6 flex-1 bg-gray-50 p-4 border border-black/5">
                    <div className="text-[10px] font-black uppercase opacity-30 mb-2">Instructions de Recette</div>
                    <div className="text-sm italic whitespace-pre-wrap">{task.comments || "Aucune instruction spécifique."}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end mt-auto">
                    <div className="bg-gray-100 p-4 border-2 border-black">
                      <div className="text-[10px] font-black uppercase opacity-50 mb-1">DLC (À consommer avant)</div>
                      <div className="text-lg font-black">{format(expiry, 'dd/MM/yyyy HH:mm')}</div>
                    </div>
                    <div className="text-right pb-2">
                      <div className="text-[9px] font-black uppercase opacity-30">Responsable</div>
                      <div className="text-sm font-black uppercase">{task.responsible}</div>
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