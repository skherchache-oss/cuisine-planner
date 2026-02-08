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
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="bg-white text-black" style={{ width: '297mm', margin: '0 auto', padding: '5mm' }}>
      
      {/* SECTION 1 : CALENDRIER HEBDOMADAIRE AVEC DÉTAILS */}
      <div className="html2pdf__page-break" style={{ marginBottom: '10mm' }}>
        <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-2">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white px-3 py-1 text-xl font-black rounded">BISTROT M</div>
            <h1 className="text-lg font-black uppercase">Planning de Production & Instructions</h1>
          </div>
          <div className="text-sm font-black uppercase">Semaine: {weekLabel}</div>
        </div>

        <table className="w-full border-collapse border-2 border-black table-fixed">
          <thead>
            <tr className="bg-gray-100 text-[11px] font-black uppercase">
              <th className="border-2 border-black p-2 w-[70px]">Service</th>
              {weekDates.map(date => (
                <th key={date.toString()} className="border-2 border-black p-2 text-center">
                  {format(date, 'EEEE dd/MM', { locale: fr })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="border-2 border-black p-2 bg-gray-50 text-center vertical-middle">
                  <div className="text-3xl mb-1">{shift.icon}</div>
                  <div className="text-[9px] font-black uppercase leading-tight">{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && 
                    isSameDay(parseISO(t.startTime), date)
                  );
                  
                  return (
                    <td key={dayIdx} className="border-2 border-black p-1 align-top bg-white" style={{ minHeight: '180px' }}>
                      <div className="flex flex-col gap-2">
                        {dayTasks.map(task => {
                          const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                          return (
                            <div key={task.id} className="border border-black p-1.5 rounded bg-white shadow-sm">
                              <div className="flex justify-between items-start border-b border-black/10 mb-1">
                                <span className="font-black uppercase text-[10px] leading-tight flex-1">{task.name}</span>
                                <span className="font-black text-[9px] ml-1">{format(parseISO(task.startTime), 'HH:mm')}</span>
                              </div>
                              
                              {/* DÉTAILS DE LA FICHE DANS LE CALENDRIER */}
                              {task.comments && (
                                <div className="text-[8px] italic leading-tight text-gray-700 mb-1 line-clamp-3 border-l-2 border-blue-200 pl-1">
                                  "{task.comments}"
                                </div>
                              )}
                              
                              <div className="flex justify-between text-[7px] font-bold text-gray-500 mt-1 uppercase">
                                <span>👤 {task.responsible}</span>
                                <span className="text-red-600">DLC: {format(expiry, 'dd/MM HH:mm')}</span>
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

      {/* SAUT DE PAGE POUR LES FICHES DÉTAILLÉES SI BESOIN */}
      <div style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-black uppercase border-b-2 border-black mb-4">Détails des préparations (Fiches)</h2>
        <div className="grid grid-cols-2 gap-4">
          {sortedTasks.map((task) => (
            <div key={task.id} className="border-2 border-black p-3 rounded-lg" style={{ pageBreakInside: 'avoid' }}>
               <div className="flex justify-between font-black uppercase text-xs mb-2 bg-black text-white p-1">
                  <span>{task.name}</span>
                  <span>{format(parseISO(task.startTime), 'dd/MM')}</span>
               </div>
               <div className="text-[11px] mb-2">
                 <strong>Instructions:</strong> <span className="italic">{task.comments || "N/A"}</span>
               </div>
               <div className="grid grid-cols-2 text-[9px] font-bold uppercase text-gray-500">
                  <span>Responsable: {task.responsible}</span>
                  <span>Cuisson: {formatDuration(task.cookTime)}</span>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;