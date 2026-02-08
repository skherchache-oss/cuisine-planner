import React from 'react';
import { PrepTask } from '../types.ts';
import { SHIFTS } from '../constants.ts';
import { calculateExpiry } from '../utils.ts';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintLayoutProps {
  tasks: PrepTask[];
  weekLabel: string;
  weekStartDate: Date | string; // Accepte les deux types au cas où
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
  // SÉCURITÉ : On s'assure que weekStartDate est un objet Date valide et mis à 00:00
  const baseDate = typeof weekStartDate === 'string' ? parseISO(weekStartDate) : weekStartDate;
  const cleanStartDate = startOfDay(baseDate);

  // Génération des 5 jours (Lundi à Vendredi)
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(cleanStartDate, i));

  return (
    <div style={{ width: '1050px', backgroundColor: 'white', color: 'black', padding: '25px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @page { size: landscape; margin: 0; }
        .page-break { page-break-after: always; }
        table { border-collapse: collapse; width: 100%; table-layout: fixed; border: 2px solid black; }
        th, td { border: 1px solid black; word-wrap: break-word; overflow: hidden; }
        .fiche-box { break-inside: avoid; border: 2px solid black; margin-bottom: 15px; page-break-inside: avoid; }
      `}</style>
      
      {/* --- PAGE 1 : LE PLANNING --- */}
      <section className="page-break">
        <h1 style={{ fontSize: '24px', fontWeight: '900', borderBottom: '4px solid black', paddingBottom: '10px', marginBottom: '15px', textTransform: 'uppercase' }}>
          Planning de Production : {weekLabel}
        </h1>
        
        <table>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ width: '80px', padding: '10px', fontSize: '10px' }}>SHIFT</th>
              {weekDates.map(d => (
                <th key={d.toISOString()} style={{ padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>{format(d, 'EEEE', { locale: fr })}</div>
                  <div style={{ fontSize: '14px', fontWeight: '900' }}>{format(d, 'dd/MM')}</div>
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
                {weekDates.map((colDate, idx) => {
                  // Comparaison stricte par chaîne YYYY-MM-DD
                  const colDateStr = format(colDate, 'yyyy-MM-dd');
                  
                  const dayTasks = tasks.filter(t => {
                    const taskDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
                    return t.shift === shift.id && format(taskDate, 'yyyy-MM-dd') === colDateStr;
                  });

                  return (
                    <td key={idx} style={{ padding: '4px', verticalAlign: 'top', height: '160px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {dayTasks.map(t => (
                          <div key={t.id} style={{ border: '1px solid black', padding: '5px', backgroundColor: '#f2f2f2' }}>
                            <div style={{ fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', lineHeight: '1.1', marginBottom: '4px' }}>
                              {t.name}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', borderTop: '1px solid #999', paddingTop: '2px' }}>
                              <span style={{ fontSize: '9px', fontWeight: 'bold', background: 'black', color: 'white', padding: '0 3px' }}>
                                {format(typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime, 'HH:mm')}
                              </span>
                              <span style={{ fontSize: '10px', fontWeight: '900' }}>🔥 {formatDuration(t.cookTime)}</span>
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

      {/* --- PAGE 2 : DÉTAILS --- */}
      <section>
        <h2 style={{ fontSize: '20px', fontWeight: '900', borderBottom: '2px solid black', paddingBottom: '5px', marginBottom: '15px', textTransform: 'uppercase' }}>
          Détails des Fiches de Production
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {tasks.map(t => {
            const tDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
            const expiry = calculateExpiry(t.startTime, t.cookTime, t.shelfLifeDays);
            
            return (
              <div key={t.id} className="fiche-box">
                <div style={{ background: 'black', color: 'white', padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '900', fontSize: '13px', textTransform: 'uppercase' }}>{t.name}</span>
                  <span style={{ background: 'white', color: 'black', padding: '0 6px', fontWeight: '900', fontSize: '12px' }}>
                    {format(tDate, 'HH:mm')}
                  </span>
                </div>
                <div style={{ padding: '12px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid black', paddingBottom: '8px', marginBottom: '8px' }}>
                    <div>CUISSON: <strong style={{ fontSize: '13px' }}>{formatDuration(t.cookTime)}</strong></div>
                    <div>PRÉPA: <strong style={{ fontSize: '13px' }}>{t.prepTime}m</strong></div>
                    <div>DLC: <strong style={{ fontSize: '13px' }}>{format(expiry, 'dd/MM')}</strong></div>
                  </div>
                  <div style={{ minHeight: '40px', fontSize: '10px', lineHeight: '1.3' }}>
                    <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px', color: '#666' }}>Commentaires :</div>
                    {t.comments || "Aucune consigne spécifique."}
                  </div>
                  <div style={{ borderTop: '1px solid #eee', textAlign: 'right', fontSize: '9px', fontWeight: 'bold', marginTop: '8px', paddingTop: '4px' }}>
                    RESPONSABLE : {t.responsible.toUpperCase()}
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