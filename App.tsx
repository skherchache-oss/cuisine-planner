import React, { useState, useEffect, useRef } from 'react';
import { format, addWeeks, startOfWeek, addDays, setHours, setMinutes, startOfDay, parseISO } from 'date-fns';
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
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationStatus());
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const printRef = useRef<HTMLDivElement>(null);

  const currentWeekStart = startOfDay(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }));
  const currentWeekEnd = addDays(currentWeekStart, 4);
  const weekLabel = `Semaine du ${format(currentWeekStart, 'dd MMMM', { locale: fr })} au ${format(currentWeekEnd, 'dd MMMM', { locale: fr })}`;

  // Chargement et Sauvegarde
  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) {
      try { setTasks(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cuisine_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Alertes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      checkTasksForAlerts(tasks);
    }, 60000); 
    return () => clearInterval(interval);
  }, [tasks]);

  // --- FONCTIONS ACTIONS ---

  const handleSaveTask = (task: PrepTask) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      if (exists) {
        return prev.map(t => t.id === task.id ? task : t);
      }
      return [...prev, { ...task, id: task.id || crypto.randomUUID() }];
    });
    setIsModalOpen(false);
  };

  const handleAlertButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const permission = await requestNotificationPermission();
    setNotifPermission(permission || 'default');
    if (permission === 'granted') {
      new Notification("BISTROT M", { body: "Alertes activées !" });
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        windowWidth: 1200,
        height: element.scrollHeight,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, (canvas.height * 297) / canvas.width);
      pdf.save(`PLANNING-${format(currentWeekStart, 'dd-MM')}.pdf`);
    } catch (e) { console.error(e); } finally { setIsGeneratingPdf(false); }
  };

  const handleAddTask = (dayIdx: number, shift: ShiftType) => {
    const dayDate = addDays(currentWeekStart, dayIdx);
    setModalInitialData({ 
      id: undefined, 
      name: '', 
      dayOfWeek: dayIdx, 
      shift, 
      startTime: format(setMinutes(setHours(dayDate, 8), 0), "yyyy-MM-dd'T'HH:mm"),
      responsible: STAFF_LIST[0], 
      prepTime: 15, 
      cookTime: 60,
      packingTime: 10,
      shelfLifeDays: 3
    });
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Mini Top Bar */}
      <div className="bg-[#0F172A] text-white py-1.5 px-4 flex justify-between items-center shrink-0">
        <span className="font-black text-[9px] uppercase tracking-[0.2em]">BISTROT M — PLANNER</span>
        <span className="text-[9px] opacity-60 uppercase">{format(currentTime, 'HH:mm')}</span>
      </div>

      {/* Header Principal */}
      <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 py-4 md:py-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            
            {/* SÉLECTEUR DE SEMAINE */}
            <div className="flex-1 flex items-center bg-slate-900 rounded-3xl p-1.5 shadow-xl">
              <button 
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="w-12 h-12 flex items-center justify-center text-white hover:bg-slate-800 rounded-2xl transition-all active:scale-90"
              >
                <span className="text-2xl font-bold">‹</span>
              </button>
              
              <div className="flex-1 text-center">
                <h1 className="text-white font-black text-[12px] md:text-lg uppercase tracking-tight px-2">
                  {weekLabel}
                </h1>
              </div>

              <button 
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="w-12 h-12 flex items-center justify-center text-white hover:bg-slate-800 rounded-2xl transition-all active:scale-90"
              >
                <span className="text-2xl font-bold">›</span>
              </button>
            </div>

            {/* BOUTONS ACTIONS */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleAlertButtonClick}
                className={`w-14 h-14 flex items-center justify-center rounded-[1.5rem] border-2 transition-all shadow-md active:scale-75 ${
                  notifPermission === 'granted' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <span className="text-2xl">{notifPermission === 'granted' ? '🔔' : '🔕'}</span>
              </button>

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] border-2 bg-white border-slate-200 text-slate-700 shadow-md active:scale-75"
              >
                <span className="text-2xl">⚙️</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu Principal */}
      <main className="w-full max-w-7xl mx-auto px-3 py-6 flex-1 relative z-10">
        <WeeklyCalendar 
          tasks={tasks}
          currentTime={currentTime}
          onAddTask={handleAddTask}
          onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
          onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
          onDuplicateTask={(task) => setTasks(prev => [...prev, { ...task, id: crypto.randomUUID(), name: `${task.name} (C)` }])}
          onMoveTask={(taskId, newDate, newShift) => {
             setTasks(prev => prev.map(task => {
              if (task.id === taskId) {
                const oldStart = parseISO(task.startTime);
                const updatedStart = setMinutes(setHours(newDate, oldStart.getHours()), oldStart.getMinutes());
                return { ...task, startTime: format(updatedStart, "yyyy-MM-dd'T'HH:mm"), shift: newShift, dayOfWeek: (updatedStart.getDay() + 6) % 7 };
              }
              return task;
            }));
          }}
          weekStartDate={currentWeekStart}
        />
      </main>

      {/* Bouton PDF Flottant */}
      <div className="fixed bottom-6 right-6 z-[110]">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isGeneratingPdf}
          className="bg-slate-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center border-4 border-white active:scale-90 transition-transform disabled:opacity-50"
        >
          {isGeneratingPdf ? '...' : <span className="font-black text-xs">PDF</span>}
        </button>
      </div>

      {/* Rendu PDF caché */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '297mm' }}>
        <div ref={printRef}>
          <PrintLayout tasks={tasks} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
        </div>
      </div>

      {/* Modales */}
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveTask} 
        initialTask={editingTask || modalInitialData} 
      />

      {/* Modal Paramètres */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Paramètres</h2>
            <button 
              onClick={() => { if(confirm('Tout effacer ?')) { localStorage.clear(); window.location.reload(); } }}
              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold mb-4"
            >
              ⚠️ Réinitialiser tout
            </button>
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;