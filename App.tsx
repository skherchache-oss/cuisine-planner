import React, { useState, useEffect } from 'react';
import { format, addWeeks, startOfWeek, addDays, setHours, setMinutes, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrepTask } from './types';
import WeeklyCalendar from './components/WeeklyCalendar';
import TaskModal from './components/TaskModal';
import PrintLayout from './components/PrintLayout';
import { STAFF_LIST } from './constants';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<PrepTask[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PrepTask | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  
  const currentWeekStart = startOfDay(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }));
  const weekLabel = `${format(currentWeekStart, 'dd MMM', { locale: fr })} - ${format(addDays(currentWeekStart, 4), 'dd MMM yyyy', { locale: fr })}`;

  // Chargement des données
  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) { try { setTasks(JSON.parse(saved)); } catch (e) { console.error(e); } }
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    localStorage.setItem('cuisine_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const tasksForCurrentWeek = tasks.filter(t => {
    const tDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
    const weekDays = Array.from({ length: 7 }, (_, i) => format(addDays(currentWeekStart, i), 'yyyy-MM-dd'));
    return weekDays.includes(format(tDate, 'yyyy-MM-dd'));
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* SECTION CACHÉE À L'IMPRESSION */}
      <div className="print:hidden pb-32">
        <header className="bg-white p-4 shadow-md sticky top-0 z-50">
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-black text-blue-600 text-xl tracking-tighter">CUISINE PLANNER</h1>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-gray-100 rounded-full">⚙️</button>
          </div>
          
          <div className="flex bg-gray-200 p-1 rounded-xl">
            <button onClick={() => setWeekOffset(v => v - 1)} className="flex-1 font-bold py-2">‹</button>
            <span className="flex-[4] text-center self-center text-xs font-black uppercase">{weekLabel}</span>
            <button onClick={() => setWeekOffset(v => v + 1)} className="flex-1 font-bold py-2">›</button>
          </div>
        </header>

        <main className="p-2">
          <WeeklyCalendar 
            tasks={tasks} 
            weekStartDate={currentWeekStart}
            onAddTask={(day, shift) => {
              const date = setMinutes(setHours(addDays(currentWeekStart, day), 8), 0);
              setEditingTask({ id: crypto.randomUUID(), startTime: format(date, "yyyy-MM-dd'T'HH:mm"), shift, responsible: STAFF_LIST[0], name: '', prepTime: 15, cookTime: 60, shelfLifeDays: 3 } as PrepTask);
              setIsModalOpen(true);
            }}
            onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
            onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
          />
        </main>

        <div className="fixed bottom-6 left-0 right-0 px-4 z-40 flex justify-center">
          <button 
            onClick={() => window.print()} 
            className="w-full max-w-xs bg-blue-600 text-white py-4 rounded-2xl font-black uppercase shadow-2xl active:scale-95"
          >
            📄 Exporter PDF (Paysage)
          </button>
        </div>
      </div>

      {/* SECTION RÉSERVÉE À L'IMPRESSION (Invisible sur écran) */}
      <div className="hidden print:block bg-white">
        <PrintLayout tasks={tasksForCurrentWeek} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
      </div>

      {/* Modal */}
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={(task) => {
          setTasks(prev => {
            const exists = prev.find(t => t.id === task.id);
            return exists ? prev.map(t => t.id === task.id ? task : t) : [...prev, task];
          });
          setIsModalOpen(false);
        }} 
        initialTask={editingTask} 
      />
    </div>
  );
};

export default App;