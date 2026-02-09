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
  
  const weekLabel = `Semaine du ${format(currentWeekStart, 'dd MMM', { locale: fr })} au ${format(currentWeekEnd, 'dd MMM yyyy', { locale: fr })}`;

  // GESTION DU BOUTON RETOUR SMARTPHONE
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isModalOpen || isSettingsOpen) {
        // Si une modal est ouverte, on la ferme et on empêche le retour arrière réel
        setIsModalOpen(false);
        setIsSettingsOpen(false);
      }
    };

    if (isModalOpen || isSettingsOpen) {
      // Quand on ouvre, on ajoute une entrée fictive dans l'historique
      window.history.pushState({ modalOpen: true }, '');
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isModalOpen, isSettingsOpen]);

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
      if (permission === 'granted') setIsAlertsEnabled(true);
    } else {
      setIsAlertsEnabled(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `sauvegarde-BM-${format(new Date(), 'dd-MM-yy')}.json`);
    link.click();
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    if (!event.target.files?.[0]) return;
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) { setTasks(imported); setIsSettingsOpen(false); }
      } catch (err) { alert('Fichier invalide'); }
    };
    reader.readAsText(event.target.files[0]);
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
        
        {/* BARRE SUPÉRIEURE UNIQUE */}
        <div className="bg-[#0F172A] text-white py-3 px-4 flex justify-between items-center shrink-0 z-50">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">CUISINE PLANNER</span>
          
          <div className="flex gap-4 md:gap-6 items-center">
            <button onClick={() => setIsSettingsOpen(true)} className="text-xl active:scale-90 transition-transform" title="Paramètres">⚙️</button>
            <button onClick={handleToggleAlerts} className={`text-xl active:scale-90 transition-transform ${isAlertsEnabled ? '' : 'grayscale opacity-30'}`} title="Alertes">
              {isAlertsEnabled ? '🔔' : '🔕'}
            </button>
            <button 
              onClick={handleDownloadPDF} 
              className="bg-red-600 text-white px-3 py-1 rounded-lg font-black text-[10px] uppercase shadow-lg active:scale-95 border-b-2 border-red-800"
            >
              PDF
            </button>
          </div>
        </div>

        {/* NAVIGATION SEMAINE */}
        <header className="bg-white border-b-2 border-slate-100 shrink-0 shadow-sm">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between gap-3 max-w-xl mx-auto bg-slate-900 rounded-2xl p-1.5 shadow-inner">
              <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-12 h-12 flex items-center justify-center bg-slate-800 text-white rounded-xl active:scale-95 transition-transform">
                <span className="text-2xl font-bold">‹</span>
              </button>
              <h1 className="font-black text-xs md:text-lg uppercase tracking-tight text-white text-center flex-1 leading-tight">
                {weekLabel}
              </h1>
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="w-12 h-12 flex items-center justify-center bg-slate-800 text-white rounded-xl active:scale-95 transition-transform">
                <span className="text-2xl font-bold">›</span>
              </button>
            </div>
          </div>
        </header>

        {/* PLANNING MATIN / APRÈS-MIDI / SOIR */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
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
          <div className="h-32"></div>
        </main>
      </div>

      {/* MODAL CONFIGURATION */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl border-2 border-slate-200">
            <h2 className="text-xl font-black mb-6 uppercase italic text-slate-800">Paramètres</h2>
            <div className="space-y-3 mb-6">
              <button onClick={handleExportJSON} className="w-full py-4 bg-blue-50 text-blue-700 rounded-2xl font-black text-[10px] uppercase border-2 border-blue-100 active:scale-95 transition-all">📤 Sauvegarder JSON</button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-slate-50 text-slate-700 rounded-2xl font-black text-[10px] uppercase border-2 border-slate-100 active:scale-95 transition-all">📥 Restaurer JSON</button>
              <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
            </div>
            <div className="border-t-2 border-slate-50 pt-6 space-y-3">
              <button onClick={() => { if(confirm('Réinitialiser tout ?')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-4 bg-red-100 text-red-600 rounded-2xl font-black text-[10px] uppercase border-2 border-red-200 active:scale-95 transition-all">⚠️ Reset Global</button>
              <button onClick={() => setIsSettingsOpen(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all">Fermer</button>
            </div>
          </div>
        </div>
      )}

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} initialTask={editingTask || modalInitialData} />
      
      <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <div ref={printRef}>
          <PrintLayout tasks={tasks} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
        </div>
      </div>
    </div>
  );
};

export default App;