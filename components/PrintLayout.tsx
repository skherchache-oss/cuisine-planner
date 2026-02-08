import React from 'react';
import { PrepTask } from '../types.ts';
import { SHIFTS } from '../constants.ts';
import { calculateExpiry } from '../utils.ts';
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
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(cleanStartDate, i));

  return (
    // Wrapper à largeur fixe pour correspondre au ratio A4 Paysage (297mm)
    <div style={{ width: '297mm', backgroundColor: 'white', color: 'black', padding: '10mm', boxSizing: 'border-box' }}>
      <style>{`
        @page { size: landscape; margin: 0; }
        .page-break { page-break-after: always; }
        table { border-collapse: collapse; width: 100%; table-layout: fixed; border: 1.5pt solid black; }
        th, td { border: 1pt solid black; word-wrap: break-word; overflow: hidden; }
        .fiche-box { break-inside: avoid; border: 1.5pt solid black; margin-bottom: 10px; page-break-inside: avoid; }
      `}</style>
      
      <section className="page-break">
        <h1 style={{ fontSize: '20pt', fontWeight: '900', borderBottom: '3pt solid black', paddingBottom: '5px', marginBottom: '15px', textTransform: 'uppercase' }}>
          PRODUCTION : {weekLabel}
        </h1>
        
        <table>
          <thead>
            <tr style={{ backgroundColor: '#eeeeee' }}>
              <th style={{ width: '50px', padding: '5px', fontSize: '8pt' }}>SHIFT</th>
              {weekDates.map(d => (
                <th key={d.toISOString()} style={{ padding: '5px', textAlign: 'center' }}>
                  <div style={{ fontSize: '8pt', textTransform: 'uppercase' }}>{format(d, 'EEEE', { locale: fr })}</div>
                  <div style={{ fontSize: '12pt', fontWeight: '900' }}>{format(d, 'dd/MM')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td style={{ textAlign: 'center', backgroundColor: '#f9f9f9', padding: '5px' }}>
                  <div style={{ fontSize: '18pt' }}>{shift.icon}</div>
                  <div style={{ fontSize: '7pt', fontWeight: '900', textTransform: 'uppercase' }}>{shift.label}</div>
                </td>
                {weekDates.map((colDate, idx) => {
                  const colDateStr = format(colDate, 'yyyy-MM-dd');
                  const dayTasks = tasks.filter(t => {
                    const taskDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
                    return t.shift === shift.id && format(taskDate, 'yyyy-MM-dd') === colDateStr;
                  });

                  return (
                    <td key={idx} style={{ padding: '3px', verticalAlign: 'top', height: '140px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {dayTasks.map(t => (
                          <div key={t.id} style={{ border: '0.5pt solid black', padding: '3px', backgroundColor: '#f2f2f2' }}>
                            <div style={{ fontWeight: '900', fontSize: '8pt', textTransform: 'uppercase', lineHeight: '1' }}>{t.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', borderTop: '0.2pt solid #999', paddingTop: '2px' }}>
                              <span style={{ fontSize: '7pt', fontWeight: 'bold' }}>{format(parseISO(t.startTime.toString()), 'HH:mm')}</span>
                              <span style={{ fontSize: '7pt', fontWeight: '900' }}>{formatDuration(t.cookTime)}</span>
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

      <section>
        <h2 style={{ fontSize: '16pt', fontWeight: '900', borderBottom: '2pt solid black', paddingBottom: '5px', marginBottom: '10px', textTransform: 'uppercase' }}>
          Détails des Fiches
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {tasks.map(t => {
            const tDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
            const expiry = calculateExpiry(t.startTime, t.cookTime, t.shelfLifeDays);
            return (
              <div key={t.id} className="fiche-box" style={{ padding: '0' }}>
                <div style={{ background: 'black', color: 'white', padding: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '900', fontSize: '10pt', textTransform: 'uppercase' }}>{t.name}</span>
                  <span style={{ background: 'white', color: 'black', padding: '0 4px', fontWeight: '900', fontSize: '9pt' }}>{format(tDate, 'HH:mm')}</span>
                </div>
                <div style={{ padding: '8px', fontSize: '9pt' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '0.5pt solid black', paddingBottom: '4px', marginBottom: '4px' }}>
                    <div>CUISSON: <strong>{formatDuration(t.cookTime)}</strong></div>
                    <div>DLC: <strong>{format(expiry, 'dd/MM')}</strong></div>
                    <div>RESP: <strong>{t.responsible}</strong></div>
                  </div>
                  <div style={{ fontSize: '8pt', fontStyle: 'italic', color: '#444' }}>{t.comments || "Pas de commentaires."}</div>
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