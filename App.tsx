import React, { useState, useEffect, useRef } from 'react';
import { format, addWeeks, startOfWeek, addDays, isBefore, addMinutes, isAfter, setHours, setMinutes, startOfDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Imports types, constantes et services
import { PrepTask, ShiftType } from './types';
import { STAFF_LIST } from './constants';
import { requestNotificationPermission, checkTasksForAlerts, getNotificationStatus } from './services/notificationService';

// Composants
import WeeklyCalendar from './components/WeeklyCalendar';
import TaskModal from './components/TaskModal';
import PrintLayout from './components/PrintLayout';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<PrepTask[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PrepTask | undefined>(undefined);
  const [modalInitialData, setModalInitialData] = useState<Partial<PrepTask>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentWeekStart = startOfDay(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }));
  const currentWeekEnd = addDays(currentWeekStart, 4); // Lundi à Vendredi
  const weekLabel = `${format(currentWeekStart, 'dd/MM')} au ${format(currentWeekEnd, 'dd/MM')}`;

  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) {
      try { setTasks(JSON.parse(saved)); } catch (e) { console.error("Erreur chargement:", e); }
    }
    setNotifPermission(getNotificationStatus());
  }, []);

  useEffect(() => {
    localStorage.setItem('cuisine_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      checkTasksForAlerts(tasks);
    }, 1000); 
    return () => clearInterval(interval);
  }, [tasks]);

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotifPermission(permission || 'denied');
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    
    // On laisse le temps au DOM de se stabiliser
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(printRef.current!, { 
          scale: 2, // Haute définition
          useCORS: true,
          logging: false,
          width: 1122, // Correspond à 297mm en 96dpi
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        // Calcul des dimensions pour remplir la page A4
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`PLANNING-PROD-S${format(currentWeekStart, 'ww')}.pdf`);
      } catch (e) { 
        console.error("Erreur PDF:", e); 
      } finally { 
        setIsGeneratingPdf(false); 
      }
    }, 500);
  };

  // Les autres handlers restent identiques (handleAddTask, handleSaveTask, etc.)
  const handleAddTask = (dayIdx: number, shift: ShiftType) => {
    const dayDate = addDays(currentWeekStart, dayIdx);
    setModalInitialData({ 
      id: undefined, name: '', dayOfWeek: dayIdx, shift, 
      startTime: format(setMinutes(setHours(dayDate, 8), 0), "yyyy-MM-dd'T'HH:mm"),
      responsible: STAFF_LIST[0], prepTime: 15, cookTime: 60, packingTime: 10, shelfLifeDays: 3
    });
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleSaveTask = (task: PrepTask) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      return exists ? prev.map(t => t.id === task.id ? task : t) : [...prev, { ...task, id: task.id || crypto.randomUUID() }];
    });
    setIsModalOpen(false);
  };

  const handleDuplicateTask = (task: PrepTask) => {
    const newTask = { ...task, id: crypto.randomUUID(), name: `${task.name} (Copie)` };
    setTasks(prev => [...prev, newTask]);
  };

  const handleMoveTask = (taskId: string, newDate: Date, newShift: ShiftType) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const oldStart = parseISO(task.startTime);
        const updatedStart = setMinutes(setHours(newDate, oldStart.getHours()), oldStart.getMinutes());
        return { ...task, startTime: format(updatedStart, "yyyy-MM-dd'T'HH:mm"), shift: newShift, dayOfWeek: (updatedStart.getDay() + 6) % 7 };
      }
      return task;
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) { setTasks(imported); alert("Import réussi !"); }
      } catch (err) { alert("Erreur fichier"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 overflow-x-hidden flex flex-col font-sans">
      <div className="bg-[#0F172A] text-white py-2 px-4 flex justify-between items-center z-[65]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🍽️</span>
          <span className="font-black text-xs uppercase tracking-tighter">Planner Cuisine</span>
        </div>
        <span className="text-[7px] font-bold opacity-40">BISTROT M v2.6</span>
      </div>

      <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[60] px-2 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex-1 flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200 max-w-[240px]">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-9 h-9 flex items-center justify-center text-slate-600 font-bold hover:bg-white rounded-xl transition-all">‹</button>
            <div className="flex-1 flex flex-col items-center min-w-[100px]">
              <span className="text-[8px] font-black text-slate-400 uppercase">Période</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase whitespace-nowrap">{weekLabel}</span>
            </div>
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="w-9 h-9 flex items-center justify-center text-slate-600 font-bold hover:bg-white rounded-xl transition-all">›</button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleRequestPermission} className={`w-10 h-10 flex items-center justify-center rounded-2xl border-2 shadow-sm ${notifPermission === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-slate-300'}`}>
              <span className="text-lg">{notifPermission === 'granted' ? '🔔' : '🔕'}</span>
            </button>
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="w-10 h-10 flex items-center justify-center rounded-2xl border-2 bg-white text-slate-600">
              <span className="text-lg">⚙️</span>
            </button>
          </div>
        </div>
      </header>

      {/* Menu Settings (Séparé pour éviter le rognage) */}
      {isSettingsOpen && (
        <div className="fixed top-20 right-4 w-44 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-[100]">
           <button onClick={() => { setIsSettingsOpen(false); /* Export logic */ }} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase">📤 Exporter</button>
           <button onClick={() => { setIsSettingsOpen(false); fileInputRef.current?.click(); }} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase">📥 Importer</button>
           <button onClick={() => { if(confirm("Reset ?")) setTasks([]); setIsSettingsOpen(false); }} className="w-full text-left px-4 py-3 text-[10px] font-black text-rose-600 uppercase">🗑️ Reset</button>
        </div>
      )}

      <main className="no-print w-full max-w-7xl mx-auto px-1 mt-4 flex-1">
        <WeeklyCalendar 
          tasks={tasks}
          currentTime={currentTime}
          onAddTask={handleAddTask}
          onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
          onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
          onDuplicateTask={handleDuplicateTask}
          onMoveTask={handleMoveTask}
          weekStartDate={currentWeekStart}
        />
      </main>

      {/* Bouton PDF Flottant */}
      <div className="fixed bottom-6 right-6 z-40 no-print">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isGeneratingPdf} 
          className="bg-slate-900 text-white w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center border-2 border-slate-700"
        >
          {isGeneratingPdf ? '⏳' : <span className="font-black text-[10px]">PDF</span>}
        </button>
      </div>

      {/* ZONE DE RENDU PDF (Cachée mais optimisée pour A4 Paysage) */}
      <div style={{ 
        position: 'absolute', 
        left: '-9999px', 
        top: 0, 
        width: '297mm', // Largeur exacte A4 Paysage
        backgroundColor: 'white' 
      }}>
        <div ref={printRef}>
          <PrintLayout tasks={tasks} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
        </div>
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} initialTask={editingTask || modalInitialData} />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
    </div>
  );
};

export default App;