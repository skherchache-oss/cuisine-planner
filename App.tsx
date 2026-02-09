import React, { useState, useEffect, useRef } from 'react';
import { format, addWeeks, startOfWeek, addDays, setHours, setMinutes, startOfDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Imports types, constantes et services
import { PrepTask } from './types';
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
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [isAlertsEnabled, setIsAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('alerts_enabled') === 'true';
  });
  
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentWeekStart = startOfDay(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }));
  const currentWeekEnd = addDays(currentWeekStart, 4);
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(currentWeekStart, i));
  
  const weekLabel = `Semaine du ${format(currentWeekStart, 'dd MMM', { locale: fr })} au ${format(currentWeekEnd, 'dd MMM yyyy', { locale: fr })}`;

  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) {
      try { setTasks(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cuisine_tasks', JSON.stringify(tasks));
    localStorage.setItem('alerts_enabled', String(isAlertsEnabled));
  }, [tasks, isAlertsEnabled]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (isAlertsEnabled) checkTasksForAlerts(tasks);
    }, 60000); 
    return () => clearInterval(interval);
  }, [tasks, isAlertsEnabled]);

  const handleToggleAlerts = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAlertsEnabled) {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        setIsAlertsEnabled(true);
      }
    } else {
      setIsAlertsEnabled(false);
    }
  };

  const handleSaveTask = (task: PrepTask) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      return exists ? prev.map(t => t.id === task.id ? task : t) : [...prev, { ...task, id: task.id || crypto.randomUUID() }];
    });
    setIsModalOpen(false);
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', windowWidth: 1120 });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 5, 5, pdf.internal.pageSize.getWidth() - 10, pdf.internal.pageSize.getHeight() - 10);
      pdf.save(`planning BM - ${format(currentWeekStart, 'dd-MM')}.pdf`);
    } catch (e) { alert("Erreur PDF"); } finally { setIsGeneratingPdf(false); }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] md:p-8 flex items-start justify-center font-sans overflow-x-hidden">
      
      <div className="w-full max-w-[1400px] bg-[#F8FAFC] flex flex-col md:rounded-[2.5rem] md:shadow-2xl md:border border-slate-700 min-h-screen md:h-[92vh] overflow-hidden">
        
        {/* BARRE OUTILS (FIXE) */}
        <div className="bg-[#0F172A] text-white py-2 px-4 flex justify-between items-center shrink-0 z-50">
          <div className="flex gap-5 items-center">
            <button onClick={() => setIsSettingsOpen(true)} className="text-xl">⚙️</button>
            <button onClick={handleToggleAlerts} className={`text-xl ${isAlertsEnabled ? '' : 'grayscale opacity-30'}`}>{isAlertsEnabled ? '🔔' : '🔕'}</button>
          </div>
          <button 
            onClick={handleDownloadPDF} 
            disabled={isGeneratingPdf}
            className="bg-red-600 text-white px-4 py-1.5 rounded-full font-black text-[10px] uppercase shadow-lg active:scale-95 transition-transform"
          >
            {isGeneratingPdf ? '...' : 'PDF'}
          </button>
        </div>

        {/* HEADER NAVIGATION SEMAINE */}
        <header className="bg-white border-b border-slate-200 shrink-0 shadow-sm">
          <div className="px-4 py-3 text-center">
            <div className="flex items-center justify-between gap-4 max-w-lg mx-auto bg-slate-100 rounded-2xl p-1">
              <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm active:bg-slate-200">
                <span className="text-xl font-bold">‹</span>
              </button>
              <h1 className="font-black text-sm md:text-base uppercase tracking-tight text-slate-800">
                {weekLabel}
              </h1>
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm active:bg-slate-200">
                <span className="text-xl font-bold">›</span>
              </button>
            </div>

            {/* BARRE DES JOURS (LUNDI 9, MARDI 10...) - Petite marge sous la semaine */}
            <div className="flex justify-between mt-3 gap-1 overflow-x-auto no-scrollbar pb-1">
              {weekDates.map((date, i) => (
                <div key={i} className="flex-1 min-w-[65px] bg-slate-50 py-2 rounded-lg border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-black text-slate-400 uppercase leading-none">{format(date, 'EEEE', { locale: fr })}</div>
                  <div className="text-sm font-black text-slate-900">{format(date, 'dd')}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ZONE CALENDRIER - XP FOCUS SUR LES FICHES */}
        <main className="flex-1 overflow-y-auto bg-white pt-1">
          <div className="max-w-7xl mx-auto">
            <WeeklyCalendar 
              tasks={tasks} currentTime={currentTime}
              onAddTask={(idx, shift) => {
                const dayDate = addDays(currentWeekStart, idx);
                setModalInitialData({ 
                  dayOfWeek: idx, shift, responsible: STAFF_LIST[0], prepTime: 15, cookTime: 60,
                  startTime: format(setMinutes(setHours(dayDate, 8), 0), "yyyy-MM-dd'T'HH:mm")
                });
                setEditingTask(undefined); setIsModalOpen(true);
              }}
              onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
              onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
              onDuplicateTask={(task) => setTasks(prev => [...prev, { ...task, id: crypto.randomUUID(), name: `${task.name} (C)` }])}
              onMoveTask={(taskId, newDate, newShift) => {
                 setTasks(prev => prev.map(task => {
                  if (task.id === taskId) {
                    const oldStart = parseISO(task.startTime);
                    const updatedStart = setMinutes(setHours(newDate, oldStart.getHours()), oldStart.getMinutes());
                    return { ...task, startTime: format(updatedStart, "yyyy-MM-dd'T'HH:mm"), shift: newShift };
                  }
                  return task;
                }));
              }}
              weekStartDate={currentWeekStart}
            />
          </div>
          {/* Marge de fin pour le confort de scroll */}
          <div className="h-24"></div>
        </main>
      </div>

      {/* PDF CACHÉ */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <div ref={printRef}>
          <PrintLayout tasks={tasks} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
        </div>
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} initialTask={editingTask || modalInitialData} />
      
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-black mb-6 uppercase">Menu</h2>
            <div className="space-y-3">
              <button onClick={() => { if(confirm('Tout effacer ?')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-3 bg-red-100 text-red-600 rounded-xl font-black text-xs uppercase">⚠️ Reset Global</button>
              <button onClick={() => setIsSettingsOpen(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;