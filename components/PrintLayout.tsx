import React from 'react';
import { PrepTask } from '../types.ts';
import { SHIFTS } from '../constants.ts';
import { addDays, isSameDay, format, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintLayoutProps {
  tasks: PrepTask[];
  weekLabel: string;
  weekStartDate: Date | string;
}

// Fonction utilitaire locale pour éviter les imports manquants
const formatDuration = (minutes: number) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}H${mins}` : `${hours}H`;
  }
  return `${minutes}M`;
};

const PrintLayout: React.FC<PrintLayoutProps> = ({ tasks, weekLabel, weekStartDate }) => {
  const baseDate = typeof weekStartDate === 'string' ? parseISO(weekStartDate) : weekStartDate;
  const cleanStartDate = startOfDay(baseDate);
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(cleanStartDate, i));

  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = new Date(a.startTime).getTime();
    const dateB = new Date(b.startTime).getTime();
    return dateA - dateB;
  });

  return (
    <div className="bg-white text-black font-sans" style={{ width: '297mm', padding: '8mm', boxSizing: 'border-box' }}>
      <style>{`
        @media print {
          @page { size: landscape; margin: 0; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
        }
        .page-break { page-break-after: always; }
      `}</style>
      
      {/* SECTION 1 : LE PLANNING HEBDOMADAIRE */}
      <section className="page-break" style={{ marginBottom: '10mm' }}>
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
                  <div className="text-[8px] opacity-60">{format(date, 'dd/MM')}</div>
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
                    isSameDay(parseISO(t.startTime.toString()), date)
                  );
                  return (
                    <td key={dayIdx} className="border-[1.5px] border-black p-1 align-top bg-white min-h-[100px]">
                      <div className="flex flex-col gap-1.5">
                        {dayTasks.map(task => (
                          <div key={task.id} className="border-[1px] border-black p-1.5 rounded-sm bg-gray-50 flex flex-col gap-0.5 shadow-sm">
                            <div className="font-black uppercase text-[8px] border-b border-black/10 pb-1 mb-0.5 truncate">
                              {task.name}
                            </div>
                            <div className="flex justify-between items-center text-[6.5px] font-bold">
                              <span className="truncate max-w-[35%]">👤 {task.responsible}</span>
                              <span>🕒 {format(parseISO(task.startTime.toString()), 'HH:mm')}</span>
                              <span>🔥 {formatDuration(task.cookTime)}</span>
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
              Alerte HACCP : Tout produit non étiqueté sera jeté. <br/> Respect strict des temps de refroidissement (&lt; 10°C en 120 min).
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
        <h2 className="text-xl font-black uppercase border-b-4 border-black pb-1 mb-6">Détails des Fiches de Production</h2>
        <div className="grid grid-cols-2 gap-4">
          {sortedTasks.map((task) => {
            const startTime = parseISO(task.startTime.toString());
            const dlcDate = addDays(startTime, task.shelfLifeDays);

            return (
              <div key={task.id} style={{ breakInside: 'avoid' }} className="border-[2px] border-black rounded-lg overflow-hidden mb-4">
                <div className="bg-gray-100 p-2 border-b-[2px] border-black flex justify-between items-center">
                  <div className="font-black text-xs uppercase">{task.name}</div>
                  <div className="text-[9px] font-bold uppercase">
                    {format(startTime, 'EEEE dd MMMM', { locale: fr })} | 👤 {task.responsible}
                  </div>
                </div>
                <div className="p-3 grid grid-cols-3 gap-2">
                  <div className="col-span-1 text-[9px] space-y-1">
                    <div className="flex justify-between border-b border-black/10 pb-1">
                      <span className="font-black opacity-50 uppercase">Cuisson</span>
                      <span className="font-bold">{formatDuration(task.cookTime)}</span>
                    </div>
                    <div className="bg-black text-white p-1.5 mt-2 rounded-sm text-center">
                      <div className="text-[7px] font-black opacity-60 uppercase">DLC Estimée</div>
                      <div className="text-[9px] font-black">{format(dlcDate, 'dd/MM/yy')}</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-[9px] bg-gray-50 p-2 rounded-sm border border-black/5">
                    <div className="font-black uppercase opacity-30 text-[7px] mb-1">Instructions</div>
                    <div className="italic leading-relaxed truncate-3-lines">
                      {task.comments || "Aucune instruction."}
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