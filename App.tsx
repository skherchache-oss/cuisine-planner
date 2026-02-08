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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentWeekStart = startOfDay(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }));
  const currentWeekEnd = addDays(currentWeekStart, 4);
  const weekLabel = `${format(currentWeekStart, 'dd/MM')} au ${format(currentWeekEnd, 'dd/MM')}`;

  // Chargement initial
  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) {
      try { setTasks(JSON.parse(saved)); } catch (e) { console.error("Erreur chargement:", e); }
    }
  }, []);

  // Sauvegarde auto
  useEffect(() => {
    localStorage.setItem('cuisine_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Boucle de surveillance des alertes (chaque minute suffit pour les alertes)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      checkTasksForAlerts(tasks);
    }, 60000); 
    return () => clearInterval(interval);
  }, [tasks]);

  // FONCTION DE RÉACTIVATION DE LA CLOCHE
  const handleAlertButtonClick = async () => {
    // 1. Demander la permission
    const permission = await requestNotificationPermission();
    setNotifPermission(permission || 'default');

    // 2. Si autorisé, envoyer un test immédiat pour rassurer l'utilisateur
    if (permission === 'granted') {
      new Notification("BISTROT M", {
        body: "Système d'alertes activé. Vous serez notifié avant chaque début de cuisson.",
        icon: "/favicon.ico"
      });
      // 3. Lancer une vérification immédiate des tâches
      checkTasksForAlerts(tasks);
    } else if (permission === 'denied') {
      alert("Les notifications sont bloquées par votre navigateur. Veuillez les autoriser dans les réglages du site.");
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        height: element.scrollHeight,
        y: 0,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const contentHeightInPdf = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = contentHeightInPdf;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, contentHeightInPdf);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - contentHeightInPdf;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, contentHeightInPdf);
        heightLeft -= pdfHeight;
      }

      pdf.save(`PLANNING-PROD-S${format(currentWeekStart, 'ww')}.pdf`);
    } catch (e) { console.error("PDF Error", e); } finally { setIsGeneratingPdf(false); }
  };

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 flex flex-col font-sans">
      <div className="bg-[#0F172A] text-white py-2 px-4 flex justify-between items-center z-[65]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🍽️</span>
          <span className="font-black text-xs uppercase tracking-tighter">Planner Cuisine</span>
        </div>
        <span className="text-[7px] font-bold opacity-40 uppercase tracking-widest">BISTROT M</span>
      </div>

      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[60] px-3 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Navigation Semaine */}
          <div className="flex-1 flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200 max-w-[260px]">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-10 h-10 flex items-center justify-center text-slate-600 font-bold hover:bg-white rounded-xl transition-all">‹</button>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[10px] font-bold text-blue-600 uppercase">{weekLabel}</span>
            </div>
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="w-10 h-10 flex items-center justify-center text-slate-600 font-bold hover:bg-white rounded-xl transition-all">›</button>
          </div>

          <div className="flex items-center gap-3">
            {/* BOUTON ALERTE RÉACTIVÉ */}
            <button 
              onClick={handleAlertButtonClick} 
              className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all shadow-sm active:scale-90 ${
                notifPermission === 'granted' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <span className="text-xl">{notifPermission === 'granted' ? '🔔' : '🔕'}</span>
            </button>
            
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
              className="w-12 h-12 flex items-center justify-center rounded-2xl border-2 bg-white border-slate-200 text-slate-600 active:scale-90"
            >
              <span className="text-xl">⚙️</span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-2 mt-6 flex-1">
        <WeeklyCalendar 
          tasks={tasks}
          currentTime={currentTime}
          onAddTask={handleAddTask}
          onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
          onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
          onDuplicateTask={(task) => setTasks(prev => [...prev, { ...task, id: crypto.randomUUID(), name: `${task.name} (Copie)` }])}
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

      {/* BOUTON PDF FLOTTANT */}
      <div className="fixed bottom-8 right-8 z-40">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isGeneratingPdf} 
          className="bg-slate-900 text-white w-16 h-16 rounded-[2rem] shadow-2xl flex items-center justify-center border-2 border-slate-700 active:scale-95 transition-transform"
        >
          {isGeneratingPdf ? '⏳' : <span className="font-black text-xs uppercase">PDF</span>}
        </button>
      </div>

      {/* ZONE PDF CACHÉE */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '297mm', backgroundColor: 'white' }}>
        <div ref={printRef}>
          <PrintLayout tasks={tasks} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
        </div>
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} initialTask={editingTask || modalInitialData} />
      <input type="file" ref={fileInputRef} className="hidden" />
    </div>
  );
};

export default App;