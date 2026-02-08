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
  const [showSettings, setShowSettings] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekLabel = `${format(currentWeekStart, 'dd MMM', { locale: fr })} - ${format(addDays(currentWeekStart, 4), 'dd MMM yyyy', { locale: fr })}`;

  // --- PERSISTANCE & PARAMÈTRES ---
  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) setTasks(JSON.parse(saved));
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
        if (window.confirm("Remplacer toutes les données ?")) {
          setTasks(json);
          setShowSettings(false);
        }
      } catch (err) { alert("Fichier invalide"); }
    };
    reader.readAsText(file);
  };

  // --- ACTIONS TACHES ---
  const handleAddTask = (day: number, shift: ShiftType) => {
    const date = setMinutes(setHours(addDays(currentWeekStart, day), 8), 0);
    setEditingTask({ startTime: format(date, "yyyy-MM-dd'T'HH:mm"), shift, responsible: STAFF_LIST[0] } as PrepTask);
    setIsModalOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    const opt = {
      margin: 0,
      filename: `Planning_${weekLabel}.pdf`,
      html2canvas: { scale: 2, useCORS: true, width: 1100, windowWidth: 1100 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    try { await html2pdf().set(opt).from(printRef.current).save(); } 
    finally { setIsGeneratingPdf(false); }
  };

  const tasksForCurrentWeek = tasks.filter(t => {
    const d = parseISO(t.startTime.toString());
    return d >= currentWeekStart && d < addDays(currentWeekStart, 7);
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-50 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h1 className="font-black text-blue-600 uppercase text-lg tracking-tighter">Cuisine Dash</h1>
          <div className="flex gap-2 relative">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-gray-100 rounded-full border">⚙️</button>
            {showSettings && (
              <div className="absolute right-0 mt-10 w-48 bg-white border rounded-2xl shadow-2xl p-2 z-[60]">
                <button onClick={handleExportJSON} className="w-full text-left p-3 text-sm font-bold hover:bg-gray-50 rounded-xl">📤 Sauvegarder</button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full text-left p-3 text-sm font-bold hover:bg-gray-50 rounded-xl">📥 Importer</button>
                <button onClick={() => {if(window.confirm("Tout vider ?")) setTasks([]); setShowSettings(false);}} className="w-full text-left p-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl">🗑️ Reset</button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleImportJSON} accept=".json" />
              </div>
            )}
          </div>
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
          currentTime={new Date()}
          onAddTask={handleAddTask}
          onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
          onDeleteTask={(id) => { if(window.confirm("Supprimer ?")) setTasks(prev => prev.filter(t => t.id !== id)); }}
          onDuplicateTask={(t) => setTasks(prev => [...prev, {...t, id: crypto.randomUUID(), name: t.name + " (Copie)"}])}
          onMoveTask={(id, date, shift) => {
            setTasks(prev => prev.map(t => t.id === id ? {...t, startTime: format(date, "yyyy-MM-dd'T'HH:mm"), shift} : t));
          }}
          weekStartDate={currentWeekStart}
        />
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-40">
        <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase shadow-2xl transition-all active:scale-95">
          {isGeneratingPdf ? '⏳ Génération...' : '📄 Exporter PDF'}
        </button>
      </div>

      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}><div ref={printRef}>
        <PrintLayout tasks={tasksForCurrentWeek} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
      </div></div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={(task) => {
        setTasks(prev => editingTask?.id ? prev.map(t => t.id === task.id ? task : t) : [...prev, task]);
        setIsModalOpen(false);
      }} initialTask={editingTask} />
    </div>
  );
};

export default App;