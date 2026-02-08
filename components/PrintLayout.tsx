import React from 'react';
import { PrepTask } from '../types.ts';
import { SHIFTS } from '../constants.ts';
import { addDays, format, parseISO, startOfDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintLayoutProps {
  tasks: PrepTask[];
  weekLabel: string;
  weekStartDate: Date | string;
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ tasks, weekLabel, weekStartDate }) => {
  const baseDate = typeof weekStartDate === 'string' ? parseISO(weekStartDate) : weekStartDate;
  const cleanStartDate = startOfDay(baseDate);
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(cleanStartDate, i));

  return (
    <div style={{ padding: '10mm', fontFamily: 'sans-serif' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '10px', marginBottom: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>CUISINE PRODUCTION</h1>
          <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold', color: '#666' }}>SEMAINE : {weekLabel}</p>
        </div>
        <div style={{ border: '2px solid black', padding: '5px 15px', fontWeight: '900' }}>DOC. OFFICIEL</div>
      </div>

      {/* TABLEAU PLANNING */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ border: '1px solid black', padding: '5px', width: '80px', fontSize: '10px' }}>SHIFT</th>
            {weekDates.map(date => (
              <th key={date.toISOString()} style={{ border: '1px solid black', padding: '5px' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase' }}>{format(date, 'EEEE', { locale: fr })}</div>
                <div style={{ fontSize: '10px' }}>{format(date, 'dd/MM')}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHIFTS.map(shift => (
            <tr key={shift.id}>
              <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                <div style={{ fontSize: '20px' }}>{shift.icon}</div>
                <div style={{ fontSize: '8px', fontWeight: 'bold' }}>{shift.label}</div>
              </td>
              {weekDates.map(currentDate => {
                const dayTasks = tasks.filter(t => {
                  const tDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
                  return t.shift === shift.id && isSameDay(tDate, currentDate);
                });

                return (
                  <td key={currentDate.toISOString()} style={{ border: '1px solid black', padding: '5px', verticalAlign: 'top', height: '100px' }}>
                    {dayTasks.map(task => (
                      <div key={task.id} style={{ border: '1px solid black', padding: '3px', marginBottom: '4px', backgroundColor: '#eee', borderRadius: '2px' }}>
                        <div style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase' }}>{task.name}</div>
                        <div style={{ fontSize: '7px' }}>👤 {task.responsible} | 🕒 {format(parseISO(task.startTime.toString()), 'HH:mm')}</div>
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* SECTION FICHES DÉTAILLÉES (Bas de page) */}
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '900', borderBottom: '2px solid black' }}>DÉTAILS DES FICHES</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
          {tasks.map(task => (
            <div key={task.id} style={{ border: '1px solid black', padding: '5px', fontSize: '9px' }}>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>{task.name.toUpperCase()}</div>
              <div>Cuisson: {task.cookTime} min | DLC: +{task.shelfLifeDays}j</div>
              <div style={{ fontStyle: 'italic', color: '#444', marginTop: '3px' }}>{task.comments || "Pas d'instructions."}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;