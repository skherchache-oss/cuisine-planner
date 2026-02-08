import React, { useState, useEffect, useRef } from 'react';
import { format, addWeeks, startOfWeek, addDays, setHours, setMinutes, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrepTask, ShiftType } from './types';
import WeeklyCalendar from './components/WeeklyCalendar';
import TaskModal from './components/TaskModal';
import PrintLayout from './components/PrintLayout';
import { STAFF_LIST } from './constants';

declare const html2pdf: any;

const App: React.FC = () => {
  const [tasks, setTasks] = useState<PrepTask[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PrepTask | undefined>(undefined);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekLabel = `${format(currentWeekStart, 'dd MMM', { locale: fr })} - ${format(addDays(currentWeekStart, 4), 'dd MMM yyyy', { locale: fr })}`;

  // Persistance
  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('cuisine_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    
    // On clone l'élément pour ne pas impacter l'affichage écran
    const element = printRef.current;
    const opt = {
      margin: 0,
      filename: `Planning_${weekLabel}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, width: 1100, windowWidth: 1100 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const tasksForCurrentWeek = tasks.filter(t => {
    const d = parseISO(t.startTime.toString());
    return d >= currentWeekStart && d < addDays(currentWeekStart, 7);
  });

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-50 flex justify-between items-center">
        <h1 className="font-black text-sm uppercase">Cuisine Pro</h1>
        <div className="flex gap-2 bg-gray-200 p-1 rounded-lg">
          <button onClick={() => setWeekOffset(v => v - 1)} className="px-3">‹</button>
          <span className="text-[10px] font-bold self-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset(v => v + 1)} className="px-3">›</button>
        </div>
      </header>

      <main className="p-2">
        <WeeklyCalendar 
          tasks={tasks} 
          currentTime={new Date()}
          onAddTask={(day, shift) => {
            const date = setMinutes(setHours(addDays(currentWeekStart, day), 8), 0);
            setEditingTask(undefined);
            setIsModalOpen(true);
          }}
          onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
          onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
          onDuplicateTask={(t) => setTasks(prev => [...prev, {...t, id: crypto.randomUUID()}])}
          onMoveTask={(id, date, shift) => {
             setTasks(prev => prev.map(t => t.id === id ? {...t, startTime: format(date, "yyyy-MM-dd'T'HH:mm"), shift} : t));
          }}
          weekStartDate={currentWeekStart}
        />
      </main>

      {/* Bouton Export Fixe */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-xs px-4">
        <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase shadow-xl">
          {isGeneratingPdf ? 'Génération...' : 'Exporter PDF A4'}
        </button>
      </div>

      {/* Conteneur PDF Caché */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={printRef}>
          <PrintLayout tasks={tasksForCurrentWeek} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
        </div>
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={(task) => {
        setTasks(prev => editingTask ? prev.map(t => t.id === task.id ? task : t) : [...prev, task]);
        setIsModalOpen(false);
      }} initialTask={editingTask || { startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"), responsible: STAFF_LIST[0] }} />
    </div>
  );
};

export default App;