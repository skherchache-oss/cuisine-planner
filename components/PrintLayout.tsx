import React from 'react';
import { PrepTask } from '../types.ts';
import { SHIFTS } from '../constants.ts';
import { addDays, format, parseISO, startOfDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintLayoutProps {
  tasks: PrepTask[];
  weekLabel: string;
  weekStartDate: Date;
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ tasks, weekLabel, weekStartDate }) => {
  const cleanStartDate = startOfDay(weekStartDate);
  // Génération des 5 jours (Lundi à Vendredi)
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(cleanStartDate, i));

  return (
    <div style={{ 
      width: '297mm', 
      padding: '10mm', 
      backgroundColor: 'white', 
      color: 'black',
      fontFamily: 'sans-serif' 
    }}>
      {/* HEADER PROFESSIONNEL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', borderBottom: '4px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>REGISTRE DE PRODUCTION</h1>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#666 uppercase' }}>Cuisine Planner • Traçabilité HACCP</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ border: '3px solid black', padding: '5px 15px', fontWeight: '900', fontSize: '14px' }}>
            SEMAINE : {weekLabel}
          </div>
        </div>
      </div>

      {/* LE PLANNING (GRILLE) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ border: '1px solid black', width: '70px', padding: '10px', fontSize: '10px', fontWeight: '900' }}>SHIFT</th>
            {weekDates.map(date => (
              <th key={date.toISOString()} style={{ border: '1px solid black', padding: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>{format(date, 'EEEE', { locale: fr })}</div>
                <div style={{ fontSize: '11px', opacity: 0.6 }}>{format(date, 'dd MMMM', { locale: fr })}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHIFTS.map(shift => (
            <tr key={shift.id}>
              <td style={{ border: '1px solid black', textAlign: 'center', backgroundColor: '#f9fafb', padding: '10px' }}>
                <div style={{ fontSize: '24px' }}>{shift.icon}</div>
                <div style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase' }}>{shift.label}</div>
              </td>
              {weekDates.map(currentDate => {
                // FILTRAGE ROBUSTE
                const dayTasks = tasks.filter(t => {
                  const taskDate = parseISO(t.startTime);
                  return t.shift === shift.id && isSameDay(taskDate, currentDate);
                });

                return (
                  <td key={currentDate.toISOString()} style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top', height: '120px', backgroundColor: 'white' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {dayTasks.map(task => (
                        <div key={task.id} style={{ border: '1px solid black', padding: '4px', borderRadius: '3px', backgroundColor: '#f3f4f6' }}>
                          <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,0,0,0.1)', pb: '2px', marginBottom: '2px' }}>
                            {task.name}
                          </div>
                          <div style={{ fontSize: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>👤 {task.responsible.split(' ')[0]}</span>
                            <span>🕒 {format(parseISO(task.startTime), 'HH:mm')}</span>
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

      {/* SECTION FICHES DÉTAILLÉES */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '900', borderBottom: '2px solid black', paddingBottom: '5px', marginBottom: '15px' }}>DÉTAILS DES OPÉRATIONS</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {tasks.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(task => (
            <div key={task.id} style={{ border: '2px solid black', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ backgroundColor: '#000', color: '#fff', padding: '5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>{task.name}</span>
                <span style={{ fontSize: '9px' }}>{format(parseISO(task.startTime), 'dd/MM HH:mm')}</span>
              </div>
              <div style={{ padding: '8px', fontSize: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ borderBottom: '1px solid #eee' }}><strong>Prép :</strong> {task.prepTime}m</div>
                  <div style={{ borderBottom: '1px solid #eee' }}><strong>Cuis :</strong> {task.cookTime}m</div>
                  <div><strong>Cond :</strong> {task.packingTime}m</div>
                </div>
                <div style={{ backgroundColor: '#f3f4f6', padding: '5px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '8px', fontWeight: 'bold', opacity: 0.6 }}>INSTRUCTIONS :</div>
                  <div style={{ fontStyle: 'italic' }}>{task.comments || "R.A.S."}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;