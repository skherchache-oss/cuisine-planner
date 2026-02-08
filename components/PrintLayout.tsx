import React from 'react';
import { PrepTask } from '../types.ts';
import { SHIFTS } from '../constants.ts';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintLayoutProps {
  tasks: PrepTask[];
  weekLabel: string;
  weekStartDate: Date | string;
}

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
  // On génère les 5 jours de la semaine (Lundi au Vendredi)
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(cleanStartDate, i));

  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="bg-white text-black font-sans" style={{ width: '297mm', padding: '10mm', boxSizing: 'border-box' }}>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none; }
        }
        table { table-layout: fixed; width: 100%; border-collapse: collapse; }
        th, td { word-wrap: break-word; overflow: hidden; }
      `}</style>
      
      {/* SECTION 1 : LE PLANNING HEBDOMADAIRE */}
      <section style={{ pageBreakAfter: 'always', marginBottom: '10mm' }}>
        <div className="flex justify-between items-center mb-4 border-b-[4px] border-black pb-3">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white px-3 py-2 text-2xl font-black rounded-lg">CUISINE</div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter">Planning de Production</h1>
              <p className="text-[9px] font-bold text-gray-500 uppercase">Registre de traçabilité</p>
            </div>
          </div>
          <div className="border-[3px] border-black px-6 py-2 font-black text-lg uppercase">
            Semaine : {weekLabel}
          </div>
        </div>

        <table className="border-[2px] border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-2 border-black p-1 w-[70px] text-[10px] uppercase font-black">Shift</th>
              {weekDates.map(date => (
                <th key={date.toISOString()} className="border-2 border-black p-2 font-black text-center uppercase">
                  <div className="text-[11px]">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-[9px] opacity-60">{format(date, 'dd/MM')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border-2 border-black p-2 bg-gray-50 text-center">
                  <div className="text-2xl">{shift.icon}</div>
                  <div className="text-[8px] font-black uppercase">{shift.label}</div>
                </td>
                {weekDates.map(currentColDate => {
                  const targetDateStr = format(currentColDate, 'yyyy-MM-dd');
                  
                  // FILTRAGE ROBUSTE : On compare les chaînes de caractères "yyyy-MM-dd"
                  const dayTasks = tasks.filter(t => {
                    const tDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
                    return t.shift === shift.id && format(tDate, 'yyyy-MM-dd') === targetDateStr;
                  });

                  return (
                    <td key={currentColDate.toISOString()} className="border-2 border-black p-1 align-top bg-white h-[110px]">
                      <div className="flex flex-col gap-1">
                        {dayTasks.map(task => (
                          <div key={task.id} className="border border-black p-1 rounded-sm bg-gray-50 shadow-sm">
                            <div className="font-black uppercase text-[8px] border-b border-black/10 pb-1 truncate">
                              {task.name}
                            </div>
                            <div className="flex justify-between items-center text-[7px] font-bold mt-1">
                              <span>👤 {task.responsible.split(' ')[0]}</span>
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
      </section>

      {/* SECTION 2 : FICHES DÉTAILLÉES */}
      <section>
        <h2 className="text-xl font-black uppercase border-b-4 border-black pb-1 mb-4">Détails des Fiches</h2>
        <div className="grid grid-cols-2 gap-4">
          {sortedTasks.map((task) => {
            const startTime = parseISO(task.startTime.toString());
            const dlcDate = addDays(startTime, task.shelfLifeDays);

            return (
              <div key={task.id} style={{ breakInside: 'avoid' }} className="border-2 border-black rounded-lg overflow-hidden mb-2">
                <div className="bg-gray-100 p-2 border-b-2 border-black flex justify-between items-center">
                  <div className="font-black text-[10px] uppercase">{task.name}</div>
                  <div className="text-[8px] font-bold uppercase">
                    {format(startTime, 'dd/MM', { locale: fr })} | 👤 {task.responsible}
                  </div>
                </div>
                <div className="p-2 grid grid-cols-3 gap-2 text-[9px]">
                  <div className="col-span-1 border-r border-black/10 pr-2">
                    <div className="flex justify-between"><span>Prép:</span><strong>{task.prepTime}m</strong></div>
                    <div className="flex justify-between"><span>Cuis:</span><strong>{formatDuration(task.cookTime)}</strong></div>
                    <div className="bg-black text-white p-1 mt-1 text-center rounded-sm">
                      <div className="text-[7px] uppercase opacity-60">DLC</div>
                      <div className="font-black">{format(dlcDate, 'dd/MM/yy')}</div>
                    </div>
                  </div>
                  <div className="col-span-2 italic text-gray-700 leading-tight">
                    {task.comments || "Aucune instruction particulière."}
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