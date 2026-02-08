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
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [isAlertsEnabled, setIsAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('alerts_enabled') === 'true';
  });
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationStatus());
  
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentWeekStart = startOfDay(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }));
  const currentWeekEnd = addDays(currentWeekStart, 4);
  
  // Formatage pour l'affichage header
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

  // --- LOGIQUE EXPORT PDF OPTIMISÉE ---
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    
    // On laisse un petit délai pour le rendu
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1200, // Largeur fixe pour garantir le ratio paysage
        onclone: (clonedDoc) => {
          // Force l'élément cloné à être visible pour la capture
          const el = clonedDoc.getElementById('print-area');
          if (el) el.style.display = 'block';
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({ 
        orientation: 'landscape', 
        unit: 'mm', 
        format: 'a4' 
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const contentHeightInPdf = (imgProps.height * pdfWidth) / imgProps.width;

      // Centrage vertical si le contenu est plus court que la page
      const positionY = contentHeightInPdf < pdfHeight ? (pdfHeight - contentHeightInPdf) / 2 : 0;

      pdf.addImage(imgData, 'JPEG', 0, positionY, pdfWidth, contentHeightInPdf);
      
      // Nom du fichier personnalisé : planning BM - semaine dd mm dd mm
      const fileName = `planning BM - semaine ${format(currentWeekStart, 'dd MM')} ${format(currentWeekEnd, 'dd MM')}.pdf`;
      pdf.save(fileName);
      
    } catch (e) { 
      console.error("Erreur PDF:", e); 
      alert("Erreur lors de la génération du PDF.");
    } finally { 
      setIsGeneratingPdf(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <div className="bg-[#0F172A] text-white py-1.5 px-4 flex justify-between items-center shrink-0">
        <span className="font-black text-[9px] uppercase tracking-[0.2em]">BISTROT M — PLANIFICATEUR</span>
        <span className="text-[9px] opacity-60 uppercase">{format(currentTime, 'HH:mm')}</span>
      </div>

      <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 py-4 md:py-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 flex items-center bg-slate-900 rounded-3xl p-1 shadow-xl max-w-[70%]">
              <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-10 h-10 flex items-center justify-center text-white active:scale-90">
                <span className="text-xl font-bold">‹</span>
              </button>
              <div className="flex-1 text-center py-1">
                <h1 className="text-white font-black text-[11px] md:text-base uppercase tracking-tight leading-tight px-1">{weekLabel}</h1>
              </div>
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="w-10 h-10 flex items-center justify-center text-white active:scale-90">
                <span className="text-xl font-bold">›</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleToggleAlerts} className={`w-14 h-14 flex flex-col items-center justify-center rounded-[1.5rem] border-2 transition-all shadow-md active:scale-75 ${isAlertsEnabled ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                <span className="text-xl">{isAlertsEnabled ? '🔔' : '🔕'}</span>
                <span className="text-[7px] font-black mt-0.5">{isAlertsEnabled ? 'ACTIF' : 'OFF'}</span>
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] border-2 bg-white border-slate-200 text-slate-700 shadow-md active:scale-75">
                <span className="text-2xl">⚙️</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-3 py-6 flex-1 relative z-10">
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

      <div className="fixed bottom-6 right-6 z-[110]">
        <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="bg-slate-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center border-4 border-white active:scale-90 transition-transform">
          {isGeneratingPdf ? '...' : <span className="font-black text-xs">PDF</span>}
        </button>
      </div>

      {/* ZONE DE CAPTURE PDF - CACHÉE MAIS OPTIMISÉE */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={printRef} id="print-area" style={{ width: '1200px', backgroundColor: 'white' }}>
          <PrintLayout tasks={tasks} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
        </div>
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} initialTask={editingTask || modalInitialData} />
      
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Paramètres</h2>
            <div className="space-y-3 mb-8">
              <button onClick={handleExportJSON} className="w-full py-4 bg-blue-50 text-blue-700 rounded-2xl font-bold active:scale-95 transition-all">📤 Sauvegarder JSON</button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-slate-50 text-slate-700 rounded-2xl font-bold active:scale-95 transition-all">📥 Restaurer JSON</button>
              <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
            </div>
            <div className="border-t pt-6 space-y-3">
              <button onClick={() => { if(confirm('Tout effacer ?')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold active:scale-95 transition-all">⚠️ Réinitialiser</button>
              <button onClick={() => setIsSettingsOpen(false)} className="w-full py-4 bg-slate-200 text-slate-600 rounded-2xl font-bold active:scale-95 transition-all">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;