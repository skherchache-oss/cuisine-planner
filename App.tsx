import React, { useState, useEffect, useRef } from 'react';
import { format, addWeeks, startOfWeek, addDays, setHours, setMinutes, parseISO, startOfDay, endOfDay } from 'date-fns';
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

  // Correction : On s'assure que le début de semaine est bien à 00:00:00
  const currentWeekStart = startOfDay(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }));
  const weekLabel = `${format(currentWeekStart, 'dd MMM', { locale: fr })} - ${format(addDays(currentWeekStart, 4), 'dd MMM yyyy', { locale: fr })}`;

  // --- PERSISTANCE ---
  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur de chargement des données", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cuisine_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // --- PARAMÈTRES ---
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
        if (window.confirm("Remplacer toutes les données existantes par ce fichier ?")) {
          setTasks(json);
          setShowSettings(false);
        }
      } catch (err) { alert("Fichier JSON invalide."); }
    };
    reader.readAsText(file);
  };

  // --- ACTIONS TACHES ---
  const handleAddTask = (day: number, shift: ShiftType) => {
    const date = setMinutes(setHours(addDays(currentWeekStart, day), 8), 0);
    setEditingTask({ 
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

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    
    const opt = {
      margin: 0,
      filename: `Planning_${weekLabel.replace(/ /g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        width: 1100, 
        windowWidth: 1100,
        logging: false 
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
  };

  // FILTRAGE CORRIGÉ : On vérifie que la tâche appartient bien à l'intervalle de la semaine
  const tasksForCurrentWeek = tasks.filter(t => {
    const taskDate = parseISO(t.startTime.toString());
    const weekEnd = endOfDay(addDays(currentWeekStart, 6));
    return taskDate >= currentWeekStart && taskDate <= weekEnd;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-50 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h1 className="font-black text-blue-600 uppercase text-lg tracking-tighter">Cuisine Dash</h1>
          <div className="flex gap-2 relative">
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className={`p-2 rounded-full border transition-colors ${showSettings ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 border-gray-200'}`}
            >
              ⚙️
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-10 w-56 bg-white border-2 border-gray-100 rounded-2xl shadow-2xl p-2 z-[60] animate-in zoom-in-95 duration-100">
                <div className="text-[10px] font-black uppercase text-gray-400 p-2 border-b mb-1">Système Generative AI</div>
                <button onClick={handleExportJSON} className="w-full text-left p-3 text-sm font-bold hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors flex items-center gap-2">
                  📤 Sauvegarder (JSON)
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full text-left p-3 text-sm font-bold hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors flex items-center gap-2">
                  📥 Importer
                </button>
                <button onClick={() => {if(window.confirm("Tout supprimer ?")) {setTasks([]); setShowSettings(false);}}} className="w-full text-left p-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2">
                  🗑️ Réinitialiser tout
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleImportJSON} accept=".json" />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-2xl border">
          <button onClick={() => setWeekOffset(v => v - 1)} className="flex-1 font-black py-2 active:bg-white rounded-xl transition-all">‹</button>
          <span className="flex-[3] text-center self-center text-[10px] font-black uppercase tracking-widest">{weekLabel}</span>
          <button onClick={() => setWeekOffset(v => v + 1)} className="flex-1 font-black py-2 active:bg-white rounded-xl transition-all">›</button>
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
            const newTask = { ...t, id: crypto.randomUUID(), name: t.name + " (Copie)" };
            setTasks(prev => [...prev, newTask]);
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
          className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isGeneratingPdf ? <>⏳ Génération...</> : <>📄 Exporter PDF Semaine</>}
        </button>
      </div>

      {/* Rendu masqué pour html2pdf */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={printRef}>
          <PrintLayout tasks={tasksForCurrentWeek} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(undefined);
        }} 
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