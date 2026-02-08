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

  return (
    <div className="bg-white text-black font-sans" style={{ width: '287mm', minHeight: '200mm', padding: '5mm', margin: '0 auto' }}>
      
      {/* HEADER ÉPURÉ */}
      <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
        <div className="flex items-center gap-4">
          <div className="bg-black text-white px-3 py-1 text-xl font-black uppercase">
            BISTROT M
          </div>
          <div>
            <h1 className="text-lg font-bold uppercase leading-none">Registre de Production Hebdomadaire</h1>
            <p className="text-[9px] font-medium text-gray-500 uppercase tracking-widest mt-1">Traçabilité HACCP & Organisation de Cuisine</p>
          </div>
        </div>
        <div className="text-right">
          <div className="border-2 border-black px-4 py-1 font-black text-sm uppercase">
            Semaine du : {weekLabel}
          </div>
        </div>
      </div>

      {/* TABLEAU PRINCIPAL OPTIMISÉ */}
      <table className="w-full border-collapse border border-black text-[10px]">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 w-[70px] uppercase font-bold text-[9px]">Shift</th>
            {weekDates.map(date => (
              <th key={date.toString()} className="border border-black p-2 font-bold text-center uppercase">
                <div className="text-black text-sm">{format(date, 'EEEE', { locale: fr })}</div>
                <div className="text-[10px] text-gray-400">{format(date, 'dd/MM', { locale: fr })}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHIFTS.map(shift => (
            <tr key={shift.id}>
              <td className="border border-black p-2 bg-gray-50 align-middle text-center">
                <div className="text-2xl mb-1">{shift.icon}</div>
                <div className="text-[8px] font-black uppercase leading-tight">{shift.label}</div>
              </td>
              {weekDates.map((date, dayIdx) => {
                const dayTasks = tasks.filter(t => 
                  t.shift === shift.id && 
                  isSameDay(parseISO(t.startTime), date)
                );
                
                return (
                  <td key={dayIdx} className="border border-black p-1 align-top bg-white">
                    <div className="flex flex-col gap-2 h-full">
                      {dayTasks.length > 0 ? dayTasks.map(task => {
                        const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
                        return (
                          <div key={task.id} className="border border-gray-300 p-1.5 rounded flex flex-col gap-1 bg-white">
                            {/* Titre & Heure */}
                            <div className="flex justify-between items-start border-b border-gray-100 pb-1">
                              <span className="font-bold uppercase text-[9px] leading-tight flex-1 pr-1">{task.name}</span>
                              <span className="font-mono text-[8px] whitespace-nowrap">{format(parseISO(task.startTime), 'HH:mm')}</span>
                            </div>
                            
                            {/* Infos Clés */}
                            <div className="grid grid-cols-2 text-[7px] leading-tight text-gray-600 italic">
                              <span>👤 {task.responsible}</span>
                              <span className="text-right">🔥 {formatDuration(task.cookTime)}</span>
                            </div>

                            {/* DLC Mise en avant */}
                            <div className="bg-gray-50 border border-gray-200 py-0.5 text-center rounded text-[8px] font-bold">
                              DLC: {format(expiry, 'dd/MM HH:mm')}
                            </div>

                            {/* Champs de saisie manuelle (Température & Visa) */}
                            <div className="flex gap-2 mt-0.5">
                              <div className="flex-1">
                                <div className="text-[6px] text-gray-400 uppercase leading-none">T° Cœur</div>
                                <div className="border-b border-black h-3 w-full"></div>
                              </div>
                              <div className="w-6">
                                <div className="text-[6px] text-gray-400 uppercase leading-none">Visa</div>
                                <div className="border-b border-black h-3 w-full"></div>
                              </div>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="h-12"></div> // Espace minimal si vide
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* FOOTER HACCP LÉGER */}
      <div className="mt-4 flex justify-between items-end border-t border-gray-200 pt-2">
        <div className="text-[8px] text-gray-500 leading-tight">
          <strong>RAPPEL HACCP :</strong> Relevé de température obligatoire à cœur après cuisson.<br/>
          Refroidissement rapide de +63°C à +10°C en moins de 2h. Étiquetage DLC obligatoire.
        </div>
        <div className="text-[8px] font-mono text-gray-300 uppercase italic">
          Logiciel de gestion Bistrot M - Document de traçabilité interne
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;