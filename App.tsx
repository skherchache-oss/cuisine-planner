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
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationStatus());
  
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentWeekStart = startOfDay(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }));
  const currentWeekEnd = addDays(currentWeekStart, 4);
  
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
      setNotifPermission(permission || 'default');
      if (permission === 'granted') {
        setIsAlertsEnabled(true);
        new Notification("BISTROT M", { body: "Alertes activées ✅" });
      }
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

  // --- LOGIQUE EXPORT PDF OPTIMISÉE (A4 Paysage) ---
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
        windowWidth: 1120, // Largeur 297mm approx en pixels écran
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({ 
        orientation: 'landscape', 
        unit: 'mm', 
        format: 'a4' 
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Ajustement pour remplir la page sans déformer
      pdf.addImage(imgData, 'JPEG', 5, 5, pdfWidth - 10, pdfHeight - 10);
      
      const fileName = `planning BM - ${format(currentWeekStart, 'dd-MM')} au ${format(currentWeekEnd, 'dd-MM')}.pdf`;
      pdf.save(fileName);
      
    } catch (e) { 
      console.error("Erreur PDF:", e); 
      alert("Erreur lors de la génération du PDF.");
    } finally { 
      setIsGeneratingPdf(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-x-hidden">
      {/* Barre supérieure discrète */}
      <div className="bg-[#0F172A] text-white py-1 px-4 flex justify-between items-center shrink-0">
        <span className="font-black text-[8px] uppercase tracking-[0.2em]">BISTROT M — Kitchen Manager</span>
        <span className="text-[9px] font-bold">{format(currentTime, 'HH:mm', { locale: fr })}</span>
      </div>

      <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* NAVIGATION SEMAINE + BOUTON PDF COLLÉ */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-slate-900 rounded-2xl p-1 shadow-lg">
                <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-8 h-8 flex items-center justify-center text-white active:scale-90">
                  <span className="text-xl font-bold">‹</span>
                </button>
                <div className="px-4 text-center">
                  <h1 className="text-white font-black text-xs uppercase tracking-tight">{weekLabel}</h1>
                </div>
                <button onClick={() => setWeekOffset(prev => prev + 1)} className="w-8 h-8 flex items-center justify-center text-white active:scale-90">
                  <span className="text-xl font-bold">›</span>
                </button>
              </div>

              {/* BOUTON PDF : RAPPROCHÉ ET BIEN VISIBLE */}
              <button 
                onClick={handleDownloadPDF} 
                disabled={isGeneratingPdf}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 border-b-4 border-red-800 disabled:opacity-50"
              >
                <span className="text-sm">{isGeneratingPdf ? '⏳' : '📄'}</span>
                <span className="font-black text-[10px] uppercase tracking-wider">
                  {isGeneratingPdf ? 'Génération...' : 'Exporter PDF'}
                </span>
              </button>
            </div>

            {/* ALERTES ET PARAMÈTRES */}
            <div className="flex items-center gap-2">
              <button onClick={handleToggleAlerts} className={`px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 font-bold text-[10px] ${isAlertsEnabled ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-200 shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>
                <span>{isAlertsEnabled ? '🔔' : '🔕'}</span>
                {isAlertsEnabled ? 'ALERTES ACTIVES' : 'ALERTES OFF'}
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl border-2 bg-white border-slate-200 text-slate-700 shadow-sm active:scale-75">
                <span className="text-xl">⚙️</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 py-6 flex-1">
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
      </main>

      {/* ZONE DE CAPTURE PDF CACHÉE */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <div ref={printRef} style={{ width: '287mm', backgroundColor: 'white' }}>
          <PrintLayout tasks={tasks} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
        </div>
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} initialTask={editingTask || modalInitialData} />
      
      {/* MODAL PARAMÈTRES */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-slate-900">
            <h2 className="text-xl font-black mb-6 uppercase italic">Configuration</h2>
            <div className="space-y-3 mb-6">
              <button onClick={handleExportJSON} className="w-full py-3 bg-blue-50 text-blue-700 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-blue-200 active:scale-95 transition-all">📤 Sauvegarde JSON</button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-slate-50 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-slate-200 active:scale-95 transition-all">📥 Restaurer JSON</button>
              <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
            </div>
            <div className="border-t-2 border-slate-100 pt-6 space-y-3">
              <button onClick={() => { if(confirm('Tout effacer ?')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-3 bg-red-100 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">⚠️ Reset Global</button>
              <button onClick={() => setIsSettingsOpen(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;