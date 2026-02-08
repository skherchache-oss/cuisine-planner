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

  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) { try { setTasks(JSON.parse(saved)); } catch (e) { console.error(e); } }
  }, []);

  useEffect(() => {
    localStorage.setItem('cuisine_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `backup_cuisine_${format(new Date(), 'yyyy-MM-dd')}.json`);
    link.click();
    setShowSettings(false);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setTasks(json);
        setShowSettings(false);
      } catch (err) { alert("JSON invalide"); }
    };
    reader.readAsText(file);
  };

  const tasksForCurrentWeek = tasks.filter(t => {
    const tDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
    return Array.from({ length: 7 }, (_, i) => format(addDays(currentWeekStart, i), 'yyyy-MM-dd')).includes(format(tDate, 'yyyy-MM-dd'));
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* ON CACHE L'INTERFACE PENDANT L'IMPRESSION */}
      <div className="print:hidden">
        <header className="bg-white p-4 shadow-sm sticky top-0 z-50 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h1 className="font-black text-blue-600 uppercase text-lg">CUISINE PLANNER</h1>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full border bg-gray-100">⚙️</button>
            {showSettings && (
              <div className="absolute right-0 mt-16 w-64 bg-white border-2 rounded-2xl shadow-2xl p-2 z-[60]">
                <button onClick={handleExportJSON} className="w-full text-left p-3 text-sm font-bold hover:bg-gray-50 rounded-xl">📤 Exporter JSON</button>
                <button onClick={() => document.getElementById('file-up')?.click()} className="w-full text-left p-3 text-sm font-bold hover:bg-gray-50 rounded-xl">📥 Importer JSON</button>
                <input id="file-up" type="file" className="hidden" onChange={handleImportJSON} accept=".json" />
              </div>
            )}
          </div>
          <div className="flex bg-gray-100 p-1 rounded-2xl border">
            <button onClick={() => setWeekOffset(v => v - 1)} className="flex-1 font-black py-2">‹</button>
            <span className="flex-[3] text-center self-center text-[10px] font-black uppercase">{weekLabel}</span>
            <button onClick={() => setWeekOffset(v => v + 1)} className="flex-1 font-black py-2">›</button>
          </div>
        </header>

        <main className="p-2">
          <WeeklyCalendar 
            tasks={tasks} 
            onAddTask={(day, shift) => {
              const date = setMinutes(setHours(addDays(currentWeekStart, day), 8), 0);
              setEditingTask({ id: crypto.randomUUID(), startTime: format(date, "yyyy-MM-dd'T'HH:mm"), shift, responsible: STAFF_LIST[0], name: '', prepTime: 15, cookTime: 60, shelfLifeDays: 3 } as PrepTask);
              setIsModalOpen(true);
            }}
            onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
            weekStartDate={currentWeekStart}
          />
        </main>

        <div className="fixed bottom-6 left-0 right-0 px-4 z-40 flex justify-center">
          <button 
            onClick={() => window.print()} 
            className="w-full max-w-xs bg-black text-white py-4 rounded-2xl font-black uppercase shadow-2xl active:scale-95"
          >
            📄 Générer PDF / Imprimer
          </button>
        </div>
      </div>

      {/* ZONE D'IMPRESSION : SEULEMENT VISIBLE À L'IMPRESSION */}
      <div className="hidden print:block bg-white">
        <PrintLayout tasks={tasksForCurrentWeek} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTask(undefined); }} 
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