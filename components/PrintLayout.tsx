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

  return (
    <div style={{ width: '1100px', backgroundColor: 'white', color: 'black', padding: '10px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @page { size: landscape; margin: 0; }
        .page-break { page-break-after: always; }
        .fiche-box { break-inside: avoid; border: 2px solid black; margin-bottom: 10px; }
      `}</style>
      
      <section className="page-break">
        <h1 style={{ fontSize: '20px', fontWeight: '900', borderBottom: '3px solid black', paddingBottom: '5px' }}>
          PLANNING SEMAINE : {weekLabel}
        </h1>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid black', width: '60px', fontSize: '10px' }}>SHIFT</th>
              {weekDates.map(d => (
                <th key={d.toString()} style={{ border: '1px solid black', padding: '5px', fontSize: '12px' }}>
                  {format(d, 'EEEE dd/MM', { locale: fr }).toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td style={{ border: '1px solid black', textAlign: 'center', backgroundColor: '#f9f9f9', fontSize: '10px', fontWeight: 'bold' }}>
                  {shift.icon}<br/>{shift.label}
                </td>
                {weekDates.map((date, idx) => {
                  const dayTasks = tasks.filter(t => t.shift === shift.id && isSameDay(parseISO(t.startTime.toString()), date));
                  return (
                    <td key={idx} style={{ border: '1px solid black', padding: '2px', verticalAlign: 'top', height: '100px' }}>
                      {dayTasks.map(t => (
                        <div key={t.id} style={{ border: '1px solid black', marginBottom: '2px', padding: '2px', fontSize: '9px', backgroundColor: '#eee' }}>
                          <div style={{ fontWeight: 'bold' }}>{t.name}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{format(parseISO(t.startTime.toString()), 'HH:mm')}</span>
                            <span style={{ fontWeight: '900' }}>{formatDuration(t.cookTime)}</span>
                          </div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 style={{ fontSize: '18px', fontWeight: '900', marginTop: '20px' }}>DÉTAILS DES FICHES</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {tasks.map(t => (
            <div key={t.id} className="fiche-box">
              <div style={{ background: 'black', color: 'white', padding: '5px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>{t.name}</span>
                <span style={{ background: 'white', color: 'black', padding: '0 5px', fontWeight: '900' }}>
                  {format(parseISO(t.startTime.toString()), 'HH:mm')}
                </span>
              </div>
              <div style={{ padding: '8px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', borderBottom: '1px solid black', marginBottom: '5px' }}>
                  <div>CUISSON: <b>{formatDuration(t.cookTime)}</b></div>
                  <div>PRÉPA: <b>{t.prepTime}m</b></div>
                </div>
                <div style={{ fontStyle: 'italic', minHeight: '30px' }}>{t.comments || "R.A.S"}</div>
                <div style={{ textAlign: 'right', fontSize: '9px', marginTop: '5px' }}>Resp: {t.responsible}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PrintLayout;