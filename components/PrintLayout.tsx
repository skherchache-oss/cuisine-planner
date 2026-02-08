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
    /* On utilise une largeur en PX pour que html2canvas le "voie" bien (1122px = A4 Paysage) */
    <div style={{ 
      width: '1122px', 
      backgroundColor: 'white', 
      color: 'black', 
      padding: '40px', 
      boxSizing: 'border-box',
      fontFamily: 'Arial, sans-serif' 
    }}>
      <style>{`
        @media print {
          @page { size: landscape; margin: 0; }
        }
        .page-break { page-break-after: always; margin-bottom: 50px; }
        table { border-collapse: collapse; width: 100%; table-layout: fixed; border: 2px solid black; }
        th, td { border: 1px solid black; word-wrap: break-word; overflow: hidden; }
        .fiche-box { break-inside: avoid; border: 2px solid black; margin-bottom: 15px; }
      `}</style>
      
      {/* PAGE 1 : PLANNING */}
      <section className="page-break">
        <h1 style={{ fontSize: '24pt', fontWeight: '900', borderBottom: '4px solid black', paddingBottom: '10px', marginBottom: '20px', textTransform: 'uppercase' }}>
          CUISINE PLANNER : {weekLabel}
        </h1>
        
        <table>
          <thead>
            <tr style={{ backgroundColor: '#eeeeee' }}>
              <th style={{ width: '80px', padding: '10px', fontSize: '10pt' }}>SHIFT</th>
              {weekDates.map(d => (
                <th key={d.toISOString()} style={{ padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10pt', textTransform: 'uppercase' }}>{format(d, 'EEEE', { locale: fr })}</div>
                  <div style={{ fontSize: '16pt', fontWeight: '900' }}>{format(d, 'dd/MM')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td style={{ textAlign: 'center', backgroundColor: '#f9f9f9', padding: '10px' }}>
                  <div style={{ fontSize: '24pt' }}>{shift.icon}</div>
                  <div style={{ fontSize: '9pt', fontWeight: '900', textTransform: 'uppercase' }}>{shift.label}</div>
                </td>
                {weekDates.map((colDate, idx) => {
                  const colDateStr = format(colDate, 'yyyy-MM-dd');
                  const dayTasks = tasks.filter(t => {
                    const taskDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
                    return t.shift === shift.id && format(taskDate, 'yyyy-MM-dd') === colDateStr;
                  });

                  return (
                    <td key={idx} style={{ padding: '5px', verticalAlign: 'top', height: '160px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {dayTasks.map(t => (
                          <div key={t.id} style={{ border: '1px solid black', padding: '5px', backgroundColor: '#f2f2f2' }}>
                            <div style={{ fontWeight: '900', fontSize: '10pt', textTransform: 'uppercase', lineHeight: '1.1' }}>{t.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', borderTop: '1px solid #999', paddingTop: '3px' }}>
                              <span style={{ fontSize: '9pt', fontWeight: 'bold', background: 'black', color: 'white', padding: '0 4px' }}>
                                {format(typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime, 'HH:mm')}
                              </span>
                              <span style={{ fontSize: '9pt', fontWeight: '900' }}>{formatDuration(t.cookTime)}</span>
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

      {/* PAGE 2 : FICHES DÉTAILLÉES */}
      <section>
        <h2 style={{ fontSize: '20pt', fontWeight: '900', borderBottom: '3px solid black', paddingBottom: '8px', marginBottom: '20px', textTransform: 'uppercase' }}>
          Détails des Productions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {tasks.map(t => {
            const tDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
            const expiry = calculateExpiry(t.startTime, t.cookTime, t.shelfLifeDays);
            return (
              <div key={t.id} className="fiche-box">
                <div style={{ background: 'black', color: 'white', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '900', fontSize: '12pt', textTransform: 'uppercase' }}>{t.name}</span>
                  <span style={{ background: 'white', color: 'black', padding: '0 6px', fontWeight: '900', fontSize: '11pt' }}>{format(tDate, 'HH:mm')}</span>
                </div>
                <div style={{ padding: '12px', fontSize: '11pt' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1.5px solid black', paddingBottom: '8px', marginBottom: '8px' }}>
                    <div>CUISSON: <strong>{formatDuration(t.cookTime)}</strong></div>
                    <div>DLC: <strong>{format(expiry, 'dd/MM')}</strong></div>
                    <div>RESP: <strong>{t.responsible.toUpperCase()}</strong></div>
                  </div>
                  <div style={{ fontSize: '10pt', minHeight: '30px' }}>
                    <span style={{ fontWeight: 'bold', color: '#666', fontSize: '9pt' }}>NOTES: </span>
                    {t.comments || "R.A.S."}
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