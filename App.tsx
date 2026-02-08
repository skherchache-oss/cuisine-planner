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
  const currentWeekEnd = addDays(currentWeekStart, 4);
  const weekLabel = `${format(currentWeekStart, 'dd MMM', { locale: fr })} - ${format(currentWeekEnd, 'dd MMM yyyy', { locale: fr })}`;

  // CHARGEMENT INITIAL & PERMISSIONS
  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) {
      try { setTasks(JSON.parse(saved)); } catch (e) { console.error("Erreur chargement:", e); }
    }
    setNotifPermission(getNotificationStatus());
  }, []);

  // SAUVEGARDE AUTO
  useEffect(() => {
    localStorage.setItem('cuisine_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // MONITORING TEMPS RÉEL ET ALERTES
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
    try {
      const element = printRef.current;
      const container = element.parentElement;
      if (container) {
        container.style.left = '0';
        container.style.opacity = '1';
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      const startDay = format(currentWeekStart, 'dd');
      pdf.save(`Planning-BistrotM-Semaine-${startDay}.pdf`);
    } catch (error) {
      console.error("Erreur PDF:", error);
    } finally {
      if (printRef.current?.parentElement) {
        printRef.current.parentElement.style.left = '-9999px';
        printRef.current.parentElement.style.opacity = '0';
      }
      setIsGeneratingPdf(false);
    }
  };

  // LOGIQUE DES TÂCHES
  const handleAddTask = (dayIdx: number, shift: ShiftType) => {
    const dayDate = addDays(currentWeekStart, dayIdx);
    const dateAt8AM = format(setMinutes(setHours(dayDate, 8), 0), "yyyy-MM-dd'T'HH:mm");
    setModalInitialData({ 
      id: undefined, name: '', dayOfWeek: dayIdx, shift, startTime: dateAt8AM,
      responsible: STAFF_LIST[0], prepTime: 15, cookTime: 60, packingTime: 10, shelfLifeDays: 3, comments: ''
    });
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleSaveTask = (task: PrepTask) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      return exists ? prev.map(t => t.id === task.id ? task : t) : [...prev, task];
    });
    setIsModalOpen(false);
  };

  const handleDuplicateTask = (task: PrepTask) => {
    const duplicatedTask: PrepTask = { ...task, id: crypto.randomUUID(), name: `${task.name} (Copie)` };
    setTasks(prev => [...prev, duplicatedTask]);
  };

  const handleDeleteTask = (id: string) => {
    if(confirm("Supprimer cette tâche ?")) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleMoveTask = (taskId: string, newDate: Date, newShift: ShiftType) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const oldStart = parseISO(task.startTime);
        const updatedStart = setMinutes(setHours(newDate, oldStart.getHours()), oldStart.getMinutes());
        return {
          ...task,
          startTime: format(updatedStart, "yyyy-MM-dd'T'HH:mm"),
          shift: newShift,
          dayOfWeek: (updatedStart.getDay() + 6) % 7 
        };
      }
      return task;
    }));
  };

  // GESTION DES DONNÉES
  const handleExportData = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cuisine_planner_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    setIsSettingsOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json) && confirm(`Importer ${json.length} fiches ?`)) {
          setTasks(json);
          setIsSettingsOpen(false);
        }
      } catch (err) { alert("Format invalide."); }
    };
    reader.readAsText(file);
  };

  const activeAlerts = tasks
    .map(task => {
      const start = new Date(task.startTime);
      const end = addMinutes(start, task.cookTime);
      const isOngoing = isBefore(start, currentTime) && isAfter(end, currentTime);
      const isStartingSoon = isAfter(start, currentTime) && isBefore(start, addMinutes(currentTime, 30));
      let status = 'none';
      let remainingSeconds = 0;
      if (isOngoing) {
        status = 'ongoing';
        remainingSeconds = Math.max(0, Math.floor((end.getTime() - currentTime.getTime()) / 1000));
      } else if (isStartingSoon) {
        status = 'soon';
        remainingSeconds = Math.max(0, Math.floor((start.getTime() - currentTime.getTime()) / 1000));
      }
      return { ...task, status, remainingSeconds };
    })
    .filter(t => t.status !== 'none')
    .sort((a, b) => a.remainingSeconds - b.remainingSeconds);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-20 overflow-x-hidden">
      {/* Barre supérieure noire : BISTROT M à gauche */}
      <div className="no-print bg-gray-900 text-white py-1.5 px-6 flex justify-between items-center text-[9px] font-black uppercase border-b border-gray-800">
        <span className="tracking-[0.4em]">BISTROT M</span>
        <span className="tracking-[0.4em] opacity-40">PRODUCTION SYSTEM v2.5</span>
      </div>

      <header className="no-print bg-white border-b shadow-sm sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Logo & Titre uniquement */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="bg-blue-600 w-9 h-9 flex items-center justify-center rounded-xl text-white font-black text-xl shadow-lg border border-white/20">🍽️</div>
            <h1 className="font-black text-gray-900 text-sm sm:text-lg tracking-tight uppercase leading-none">
              CUISINE PLANNER
            </h1>
          </div>

          {/* Navigation & Contrôles */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
            <div className="flex items-center bg-gray-50 rounded-2xl p-0.5 shadow-inner border border-gray-100">
              <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-8 h-8 hover:bg-white rounded-xl font-black text-lg">‹</button>
              <span className="px-3 text-[10px] font-black min-w-[120px] sm:min-w-[160px] text-center text-gray-700 uppercase">{weekLabel}</span>
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="w-8 h-8 hover:bg-white rounded-xl font-black text-lg">›</button>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleRequestPermission}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${
                  notifPermission === 'granted' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-300 border-gray-100'
                }`}
              >
                {notifPermission === 'granted' ? '🔔' : '🔕'}
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all shadow-sm ${isSettingsOpen ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="text-base">⚙️</span>
                </button>

                {isSettingsOpen && (
                  <>
                    <div className="fixed inset-0 z-[-1]" onClick={() => setIsSettingsOpen(false)} />
                    <div className="absolute top-full right-0 mt-3 w-52 bg-white border border-gray-100 rounded-[1.5rem] shadow-2xl py-3 z-50">
                      <div className="px-4 py-2 border-b border-gray-50 mb-2">
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Base de données</span>
                      </div>
                      <button onClick={handleExportData} className="w-full text-left px-5 py-2.5 text-[11px] font-black text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-4 uppercase transition-colors">
                        <span>📤</span> Exporter
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-5 py-2.5 text-[11px] font-black text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-4 uppercase transition-colors">
                        <span>📥</span> Importer
                      </button>
                      <div className="border-t border-gray-50 my-2"></div>
                      <button onClick={() => { if(confirm("Reset complet ?")) setTasks([]); setIsSettingsOpen(false); }} className="w-full text-left px-5 py-2.5 text-[11px] font-black text-red-600 hover:bg-red-50 flex items-center gap-4 uppercase transition-colors">
                        <span>🗑️</span> Réinitialiser
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      </header>

      <main className="no-print max-w-7xl mx-auto px-4 mt-6">
        <WeeklyCalendar 
          tasks={tasks}
          currentTime={currentTime}
          onAddTask={handleAddTask}
          onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
          onDeleteTask={handleDeleteTask}
          onDuplicateTask={handleDuplicateTask}
          onMoveTask={handleMoveTask}
          weekStartDate={currentWeekStart}
        />
        
        {activeAlerts.length > 0 && (
          <div className="mt-12 mb-8">
            <h3 className="text-[11px] font-black text-gray-400 mb-5 flex items-center gap-4 uppercase tracking-[0.3em]">
              <span className="w-10 h-px bg-gray-200"></span>
              Moniteur de Production
              <span className="w-10 h-px bg-gray-200"></span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeAlerts.map(alertTask => (
                <div key={alertTask.id} className={`p-5 rounded-[2rem] border flex items-center gap-5 shadow-sm bg-white hover:shadow-md transition-all ${alertTask.status === 'ongoing' ? 'border-orange-200' : 'border-blue-100'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${alertTask.status === 'ongoing' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                    {alertTask.status === 'ongoing' ? '🔥' : '🕒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-[13px] uppercase truncate text-gray-900">{alertTask.name}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                      {alertTask.status === 'ongoing' ? 'Fini dans' : 'Prévu dans'} {Math.floor(alertTask.remainingSeconds / 60)} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-40 no-print">
        <button 
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className="bg-gray-900 hover:bg-blue-600 text-white px-10 h-16 rounded-[2rem] flex items-center gap-4 shadow-2xl transition-all disabled:opacity-50 group"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">{isGeneratingPdf ? '⏳' : '📄'}</span> 
          <span className="font-black uppercase text-[11px] tracking-widest">{isGeneratingPdf ? 'Génération...' : 'Exporter PDF Hebdo'}</span>
        </button>
      </div>

      <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '297mm', background: 'white', opacity: 0 }}>
        <div ref={printRef}>
          <PrintLayout tasks={tasks} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask || modalInitialData}
      />
    </div>
  );
};

export default App;