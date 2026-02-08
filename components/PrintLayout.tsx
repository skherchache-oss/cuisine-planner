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
  // On s'assure que weekStartDate est bien un objet Date
  const startDate = typeof weekStartDate === 'string' ? parseISO(weekStartDate) : weekStartDate;
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(startDate, i));

  return (
    <div style={{ width: '1100px', backgroundColor: 'white', color: 'black', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @page { size: landscape; margin: 0; }
        .page-break { page-break-after: always; }
        .fiche-box { break-inside: avoid; border: 2px solid black; margin-bottom: 10px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid black; }
      `}</style>
      
      {/* PAGE 1 : LE PLANNING RÉCAPITULATIF */}
      <section className="page-break">
        <h1 style={{ fontSize: '24px', fontWeight: '900', borderBottom: '4px solid black', paddingBottom: '10px', marginBottom: '15px', textTransform: 'uppercase' }}>
          Planning de Production : {weekLabel}
        </h1>
        
        <table>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ width: '80px', padding: '10px', fontSize: '11px' }}>SHIFT</th>
              {weekDates.map(d => (
                <th key={d.toString()} style={{ padding: '10px', fontSize: '14px' }}>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>{format(d, 'EEEE', { locale: fr }).toUpperCase()}</div>
                  <div>{format(d, 'dd/MM')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td style={{ textAlign: 'center', backgroundColor: '#f9f9f9', padding: '10px' }}>
                  <div style={{ fontSize: '20px' }}>{shift.icon}</div>
                  <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>{shift.label}</div>
                </td>
                {weekDates.map((date, idx) => {
                  // FILTRAGE ROBUSTE : On compare les dates de manière stricte
                  const dayTasks = tasks.filter(t => {
                    const tDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
                    return t.shift === shift.id && isSameDay(tDate, date);
                  });

                  return (
                    <td key={idx} style={{ padding: '5px', verticalAlign: 'top', height: '140px', backgroundColor: dayTasks.length === 0 ? '#fcfcfc' : 'white' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {dayTasks.map(t => (
                          <div key={t.id} style={{ border: '1px solid black', padding: '4px', backgroundColor: '#f0f0f0' }}>
                            <div style={{ fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px', lineHeight: '1.1' }}>{t.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '0.5px solid black', paddingTop: '2px' }}>
                              <span style={{ fontSize: '9px', fontWeight: 'bold' }}>{format(parseISO(t.startTime.toString()), 'HH:mm')}</span>
                              <span style={{ fontSize: '11px', fontWeight: '900' }}>🔥 {formatDuration(t.cookTime)}</span>
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

      {/* PAGE 2 : DÉTAILS DES FICHES TECHNIQUES */}
      <section>
        <h2 style={{ fontSize: '20px', fontWeight: '900', marginTop: '10px', borderBottom: '2px solid black', paddingBottom: '5px' }}>DÉTAILS DES FICHES DE PRODUCTION</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
          {tasks.map(t => {
            const startTimeDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
            const expiry = calculateExpiry(t.startTime, t.cookTime, t.shelfLifeDays);
            
            return (
              <div key={t.id} className="fiche-box">
                <div style={{ background: 'black', color: 'white', padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '900', fontSize: '14px', textTransform: 'uppercase' }}>{t.name}</span>
                  <span style={{ background: 'white', color: 'black', padding: '2px 8px', fontWeight: '900', borderRadius: '4px' }}>
                    {format(startTimeDate, 'HH:mm')}
                  </span>
                </div>
                <div style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', paddingBottom: '8px', marginBottom: '8px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase' }}>Cuisson</div>
                      <div style={{ fontSize: '16px', fontWeight: '900' }}>{formatDuration(t.cookTime)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase' }}>Préparation</div>
                      <div style={{ fontSize: '16px', fontWeight: '900' }}>{t.prepTime}m</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase' }}>DLC Estimée</div>
                      <div style={{ fontSize: '16px', fontWeight: '900' }}>{format(expiry, 'dd/MM')}</div>
                    </div>
                  </div>
                  
                  <div style={{ minHeight: '40px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>Instructions / Commentaires :</div>
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>{t.comments || "Aucune instruction particulière."}</div>
                  </div>

                  <div style={{ borderTop: '1px dashed #ccc', marginTop: '10px', paddingTop: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Chef : {t.responsible}</span>
                    <span style={{ fontSize: '9px', opacity: 0.5 }}>Imprimé le {format(new Date(), 'dd/MM HH:mm')}</span>
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