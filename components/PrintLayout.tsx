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

const PrintLayout: React.FC<PrintLayoutProps> = ({ tasks, weekLabel, weekStartDate }) => {
  const baseDate = typeof weekStartDate === 'string' ? parseISO(weekStartDate) : weekStartDate;
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(startOfDay(baseDate), i));

  return (
    <div style={{ width: '1122px', backgroundColor: 'white', padding: '40px', boxSizing: 'border-box', fontFamily: 'Arial' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '4px solid black', paddingBottom: '10px' }}>
        CUISINE PLANNER : {weekLabel}
      </h1>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', border: '2px solid black' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ border: '1px solid black', width: '80px', padding: '10px' }}>SHIFT</th>
            {weekDates.map(d => (
              <th key={d.toISOString()} style={{ border: '1px solid black', padding: '10px' }}>
                <div style={{ fontSize: '12px' }}>{format(d, 'EEEE', { locale: fr })}</div>
                <div style={{ fontSize: '18px' }}>{format(d, 'dd/MM')}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHIFTS.map(shift => (
            <tr key={shift.id}>
              <td style={{ border: '1px solid black', textAlign: 'center', padding: '10px' }}>
                <div style={{ fontSize: '24px' }}>{shift.icon}</div>
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{shift.label}</div>
              </td>
              {weekDates.map(date => {
                const dayTasks = tasks.filter(t => t.shift === shift.id && format(parseISO(t.startTime.toString()), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
                return (
                  <td key={date.toISOString()} style={{ border: '1px solid black', padding: '5px', verticalAlign: 'top', height: '150px' }}>
                    {dayTasks.map(t => (
                      <div key={t.id} style={{ border: '1px solid black', marginBottom: '4px', padding: '4px', backgroundColor: '#eee', fontSize: '11px' }}>
                        <div style={{ fontWeight: 'bold' }}>{t.name}</div>
                        <div style={{ fontSize: '10px' }}>{format(parseISO(t.startTime.toString()), 'HH:mm')} - {t.cookTime}min</div>
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PrintLayout;