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
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}H${mins}` : `${hours}H`;
  }
  return `${minutes}M`;
};

const PrintLayout: React.FC<PrintLayoutProps> = ({ tasks, weekLabel, weekStartDate }) => {
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div style={{ width: '1120px', backgroundColor: 'white', color: 'black', padding: '15px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @page { size: landscape; margin: 0; }
        .page-break { page-break-after: always; }
        .print-card { break-inside: avoid; border: 2px solid black; margin-bottom: 15px; }
        table { table-layout: fixed; width: 100%; }
        td { word-wrap: break-word; overflow: hidden; }
      `}</style>
      
      {/* SECTION 1 : PLANNING HEBDOMADAIRE */}
      <section className="page-break">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid black', paddingBottom: '8px', marginBottom: '15px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>PLANNING PRODUCTION : {weekLabel}</h1>
          <div style={{ border: '2px solid black', padding: '4px 10px', fontWeight: '900', fontSize: '14px' }}>REGISTRE CUISINE</div>
        </div>

        <table style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid black', padding: '8px', width: '70px', fontSize: '11px' }}>SHIFT</th>
              {weekDates.map(date => (
                <th key={date.toString()} style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>{format(date, 'EEEE', { locale: fr })}</div>
                  <div style={{ fontSize: '11px' }}>{format(date, 'dd/MM')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                  <div style={{ fontSize: '20px' }}>{shift.icon}</div>
                  <div style={{ fontSize: '8px', fontWeight: '900' }}>{shift.label}</div>
                </td>
                {weekDates.map((date, dayIdx) => {
                  const dayTasks = tasks.filter(t => 
                    t.shift === shift.id && isSameDay(parseISO(t.startTime.toString()), date)
                  );
                  return (
                    <td key={dayIdx} style={{ border: '1px solid black', padding: '4px', verticalAlign: 'top', height: '140px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {dayTasks.map(task => (
                          <div key={task.id} style={{ border: '1px solid #ccc', padding: '4px', borderRadius: '3px', backgroundColor: '#fff' }}>
                            <div style={{ fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', color: '#000', lineHeight: '1.1', marginBottom: '3px' }}>
                              {task.name}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                              <span style={{ backgroundColor: '#000', color: '#fff', padding: '1px 4px', borderRadius: '2px', fontSize: '9px', fontWeight: 'bold' }}>
                                {format(parseISO(task.startTime.toString()), 'HH:mm')}
                              </span>
                              <span style={{ border: '1px solid #000', padding: '1px 4px', borderRadius: '2px', fontSize: '9px', fontWeight: '900' }}>
                                🔥 {formatDuration(task.cookTime)}
                              </span>
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
        <h2 style={{ fontSize: '20px', fontWeight: '900', borderBottom: '2px solid black', marginBottom: '15px' }}>FICHES DE FABRICATION</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {sortedTasks.map((task) => {
            const expiry = calculateExpiry(task.startTime, task.cookTime, task.shelfLifeDays);
            return (
              <div key={task.id} className="print-card">
                <div style={{ backgroundColor: '#000', color: '#fff', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '900', textTransform: 'uppercase' }}>{task.name}</div>
                  <div style={{ backgroundColor: '#fff', color: '#000', padding: '3px 10px', fontWeight: '900', fontSize: '20px' }}>
                    {format(parseISO(task.startTime.toString()), 'HH:mm')}
                  </div>
                </div>

                <div style={{ padding: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center', marginBottom: '10px', borderBottom: '1px solid black', paddingBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.6 }}>CUISSON</div>
                      <div style={{ fontSize: '18px', fontWeight: '900' }}>{formatDuration(task.cookTime)}</div>
                    </div>
                    <div style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }}>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.6 }}>PRÉPA</div>
                      <div style={{ fontSize: '18px', fontWeight: '900' }}>{task.prepTime}m</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.6 }}>DLC MAX</div>
                      <div style={{ fontSize: '18px', fontWeight: '900' }}>{format(expiry, 'dd/MM')}</div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f2f2f2', padding: '8px', border: '1px solid #000', marginBottom: '10px', minHeight: '50px' }}>
                    <div style={{ fontSize: '8px', fontWeight: '900', marginBottom: '3px', textTransform: 'uppercase' }}>Instructions:</div>
                    <div style={{ fontSize: '10px', lineHeight: '1.2' }}>{task.comments || "N/A"}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                    <div><b>RESPONSABLE :</b> {task.responsible.toUpperCase()}</div>
                    <div style={{ borderBottom: '1px solid #000', width: '80px', textAlign: 'right' }}>Visa:</div>
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