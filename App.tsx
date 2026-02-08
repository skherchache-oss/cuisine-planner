import React, { useState, useEffect, useRef } from 'react';
import { format, addWeeks, startOfWeek, addDays, setHours, setMinutes, parseISO, startOfDay } from 'date-fns';
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

  // 1. Calcul de la semaine (Lundi 00:00)
  const currentWeekStart = startOfDay(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }));
  const weekLabel = `${format(currentWeekStart, 'dd MMM', { locale: fr })} - ${format(addDays(currentWeekStart, 4), 'dd MMM yyyy', { locale: fr })}`;

  // --- PERSISTANCE ---
  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur chargement:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cuisine_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // --- ACTIONS ---
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
        if (window.confirm("Remplacer les données ?")) {
          setTasks(json);
          setShowSettings(false);
        }
      } catch (err) { alert("Erreur fichier JSON"); }
    };
    reader.readAsText(file);
  };

  const handleAddTask = (day: number, shift: ShiftType) => {
    const date = setMinutes(setHours(addDays(currentWeekStart, day), 8), 0);
    setEditingTask({ 
      id: crypto.randomUUID(),
      startTime: format(date, "yyyy-MM-dd'T'HH:mm"), 
      shift, 
      responsible: STAFF_LIST[0],
      name: '',
      prepTime: 15,
      cookTime: 60,
      shelfLifeDays: 3
    } as PrepTask);
    setIsModalOpen(true);
  };

  // --- PDF LOGIQUE ---
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    
    // On attend un court instant pour s'assurer que le DOM est prêt
    setTimeout(async () => {
      const opt = {
        margin: 0,
        filename: `Planning_${format(currentWeekStart, 'yyyy-MM-dd')}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          width: 1100,
          windowWidth: 1100
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      try { 
        await html2pdf().set(opt).from(printRef.current).save(); 
      } catch (err) {
        console.error("Erreur PDF:", err);
      } finally { 
        setIsGeneratingPdf(false); 
      }
    }, 500);
  };

  // 2. FILTRAGE INFALLIBLE (Basé sur la comparaison de jours yyyy-MM-dd)
  const tasksForCurrentWeek = tasks.filter(t => {
    const tDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
    const taskDayStr = format(tDate, 'yyyy-MM-dd');
    
    // On vérifie si la tâche appartient à l'un des 7 jours de la semaine affichée
    return Array.from({ length: 7 }, (_, i) => 
      format(addDays(currentWeekStart, i), 'yyyy-MM-dd')
    ).includes(taskDayStr);
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-50 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h1 className="font-black text-blue-600 uppercase text-lg tracking-tighter">Cuisine Dash</h1>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className={`p-2 rounded-full border ${showSettings ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            ⚙️
          </button>
          
          {showSettings && (
            <div className="absolute right-4 mt-32 w-56 bg-white border-2 rounded-2xl shadow-2xl p-2 z-[60]">
              <button onClick={handleExportJSON} className="w-full text-left p-3 text-sm font-bold hover:bg-blue-50 rounded-xl">📤 Sauvegarder JSON</button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full text-left p-3 text-sm font-bold hover:bg-blue-50 rounded-xl">📥 Importer</button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleImportJSON} accept=".json" />
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
          currentTime={new Date()}
          onAddTask={handleAddTask}
          onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
          onDeleteTask={(id) => { if(window.confirm("Supprimer ?")) setTasks(prev => prev.filter(t => t.id !== id)); }}
          onDuplicateTask={(t) => {
            setTasks(prev => [...prev, { ...t, id: crypto.randomUUID(), name: t.name + " (Copie)" }]);
          }}
          onMoveTask={(id, date, shift) => {
            setTasks(prev => prev.map(t => t.id === id ? {...t, startTime: format(date, "yyyy-MM-dd'T'HH:mm"), shift} : t));
          }}
          weekStartDate={currentWeekStart}
        />
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-40">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isGeneratingPdf} 
          className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase shadow-2xl active:scale-95 disabled:opacity-50"
        >
          {isGeneratingPdf ? "⏳ Génération..." : "📄 Exporter PDF Semaine"}
        </button>
      </div>

      {/* ZONE DE RENDU PDF - On s'assure qu'elle est bien là */}
      <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
        <div ref={printRef}>
          <PrintLayout 
            tasks={tasksForCurrentWeek} 
            weekLabel={weekLabel} 
            weekStartDate={currentWeekStart} 
          />
        </div>
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
          setEditingTask(undefined);
        }} 
        initialTask={editingTask} 
      />
    </div>
  );
};

export default App;