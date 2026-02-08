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

const formatDuration = (minutes: number) => {
  if (minutes >= 60 && minutes % 15 === 0) return `${minutes / 60}H`;
  return `${minutes} MIN`;
};

const PrintLayout: React.FC<PrintLayoutProps> = ({ tasks, weekLabel, weekStartDate }) => {
  // On génère 5 jours (Lundi à Vendredi)
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));

  // Tri des tâches pour les fiches détaillées
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div style={{ width: '1120px', backgroundColor: 'white', color: 'black', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @page { size: landscape; margin: 0; }
        .page-break { page-break-after: always; }
        .print-card { break-inside: avoid; border: 3px solid black; margin-bottom: 20px; }
      `}</style>
      
      {/* SECTION 1 : LE PLANNING HEBDOMADAIRE (TABLEAU) */}
      <section className="page-break" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '5px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>
            Planning de Production - {weekLabel}
          </h1>
          <div style={{ backgroundColor: 'black', color: 'white', padding: '5px 15px', fontWeight: '900' }}>CUISINE</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '3px solid black' }}>
          <thead>
            <tr style={{ backgroundColor: '#eeeeee' }}>
              <th style={{ border: '2px solid black', padding: '10px', width: '100px', fontSize: '12px' }}>SHIFT</th>
              {weekDates.map(date => (
                <th key={date.toString()} style={{ border: '2px solid black', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>{format(date, 'EEEE', { locale: fr })}</div>
                  <div style={{ fontSize: '12px' }}>{format(date, 'dd/MM')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td style={{ border: '2px solid black', padding: '15px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
                  <div style={{ fontSize: '24px' }}>{shift.icon}</div>
                  <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  // Filtrage précis des tâches pour ce jour et ce shift
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && 
                    isSameDay(parseISO(t.startTime.toString()), date)
                  );

                  return (
                    <td key={dayIdx} style={{ border: '2px solid black', padding: '5px', verticalAlign: 'top', height: '120px', backgroundColor: 'white' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {dayTasks.map(task => (
                          <div key={task.id} style={{ border: '1px solid black', padding: '4px', borderRadius: '2px', backgroundColor: '#f0f0f0' }}>
                            <div style={{ fontWeight: '900', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>{task.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontWeight: 'bold' }}>
                              <span>🕒 {format(parseISO(task.startTime.toString()), 'HH:mm')}</span>
                              <span>👤 {task.responsible.split(' ')[0]}</span>
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
        <h2 style={{ fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '3px solid black', paddingBottom: '5px', marginBottom: '20px' }}>
          Détails des Fiches de Fabrication
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {sortedTasks.map((task) => {
            const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
            return (
              <div key={task.id} className="print-card">
                <div style={{ backgroundColor: 'black', color: 'white', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', textTransform: 'uppercase' }}>{task.name}</div>
                  <div style={{ backgroundColor: 'white', color: 'black', padding: '2px 10px', fontWeight: '900', fontSize: '18px', borderRadius: '4px' }}>
                    {format(parseISO(task.startTime.toString()), 'HH:mm')}
                  </div>
                </div>

                <div style={{ padding: '15px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center', marginBottom: '15px', borderBottom: '1px solid black', paddingBottom: '15px' }}>
                    <div>
                      <div style={{ fontSize: '8px', fontWeight: 'bold', opacity: 0.5 }}>PRÉPA</div>
                      <div style={{ fontSize: '16px', fontWeight: '900' }}>{task.prepTime}m</div>
                    </div>
                    <div style={{ borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
                      <div style={{ fontSize: '8px', fontWeight: 'bold', opacity: 0.5 }}>CUISSON</div>
                      <div style={{ fontSize: '16px', fontWeight: '900' }}>{formatDuration(task.cookTime)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', fontWeight: 'bold', opacity: 0.5 }}>DLC</div>
                      <div style={{ fontSize: '14px', fontWeight: '900' }}>{format(expiry, 'dd/MM')}</div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f9f9f9', padding: '10px', border: '1px dashed #ccc', marginBottom: '15px', minHeight: '60px' }}>
                    <div style={{ fontSize: '8px', fontWeight: '900', marginBottom: '5px', opacity: 0.4 }}>INSTRUCTIONS</div>
                    <div style={{ fontSize: '11px', fontStyle: 'italic' }}>{task.comments || "Aucune consigne particulière."}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: '900' }}>
                      RESPONSABLE : <span style={{ textTransform: 'uppercase' }}>{task.responsible}</span>
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 'bold' }}>Visa : __________</div>
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