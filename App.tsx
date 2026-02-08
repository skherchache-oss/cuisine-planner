import React, { useState, useEffect, useRef } from 'react';
import { format, addWeeks, startOfWeek, addDays, isBefore, addMinutes, isAfter, setHours, setMinutes, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrepTask, ShiftType } from './types.ts';
import WeeklyCalendar from './components/WeeklyCalendar';
import TaskModal from './components/TaskModal';
import PrintLayout from './components/PrintLayout';
import { requestNotificationPermission, checkTasksForAlerts, getNotificationStatus } from './services/notificationService';
import { STAFF_LIST } from './constants.ts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  // CHARGEMENT
  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) {
      try { setTasks(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    setNotifPermission(getNotificationStatus());
  }, []);

  // SAUVEGARDE
  useEffect(() => {
    localStorage.setItem('cuisine_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // ALERTE & DINGUERIES
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      checkTasksForAlerts(tasks);
    }, 1000); 
    return () => clearInterval(interval);
  }, [tasks]);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = printRef.current;
      // On rend le container temporairement "visible" pour la capture
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
        width: 1122 // Largeur A4 Paysage
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      
      const startDay = format(currentWeekStart, 'dd');
      const endDay = format(currentWeekEnd, 'dd');
      pdf.save(`BistrotM-semaine${startDay}-${endDay}.pdf`);

    } catch (error) {
      console.error("PDF Fail:", error);
    } finally {
      const container = printRef.current?.parentElement;
      if (container) {
        container.style.left = '-9999px';
        container.style.opacity = '0';
      }
      setIsGeneratingPdf(false);
    }
  };

  // Filtrage des tâches pour la semaine en cours
  const tasksForCurrentWeek = tasks.filter(t => {
    const tDateStr = t.startTime.substring(0, 10);
    const weekDays = Array.from({ length: 7 }, (_, i) => 
      format(addDays(currentWeekStart, i), 'yyyy-MM-dd')
    );
    return weekDays.includes(tDateStr);
  });

  // LOGIQUE DES ACTIONS (Add, Edit, Save, etc.)
  const handleAddTask = (dayIdx: number, shift: ShiftType) => {
    const dayDate = addDays(currentWeekStart, dayIdx);
    const dateAt8AM = format(setMinutes(setHours(dayDate, 8), 0), "yyyy-MM-dd'T'HH:mm");
    setModalInitialData({ 
      id: crypto.randomUUID(),
      name: '', dayOfWeek: dayIdx, shift, startTime: dateAt8AM,
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

  const handleDeleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));
  
  const handleExportData = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    setIsSettingsOpen(false);
  };

  // MONITEUR D'ALERTES
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
      <div className="no-print bg-gray-900 text-white py-1.5 px-4 text-[9px] font-black tracking-[0.4em] text-center uppercase border-b border-gray-800">
        PRODUCTION SYSTEM v2.5
      </div>

      <header className="no-print bg-white border-b shadow-sm sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="bg-blue-600 w-9 h-9 flex items-center justify-center rounded-xl text-white font-black text-xl shadow-lg border border-white/20">🍽️</div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 leading-none">
              <span className="text-[10px] sm:text-[12px] font-black text-blue-600 uppercase tracking-[0.2em]">BISTROT M</span>
              <h1 className="font-black text-gray-900 text-sm sm:text-lg tracking-tight uppercase">CUISINE PLANNER</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
            <div className="flex items-center bg-gray-50 rounded-2xl p-0.5 shadow-inner border border-gray-100">
              <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-8 h-8 hover:bg-white rounded-xl font-black">‹</button>
              <span className="px-3 text-[10px] font-black min-w-[120px] text-center uppercase">{weekLabel}</span>
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="w-8 h-8 hover:bg-white rounded-xl font-black">›</button>
            </div>
            
            <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border bg-white"
            >⚙️</button>
            
            {isSettingsOpen && (
              <div className="absolute top-16 right-4 w-48 bg-white shadow-xl rounded-2xl p-2 z-50 border">
                <button onClick={handleExportData} className="w-full text-left p-2 text-xs font-bold hover:bg-gray-100 rounded-lg">📤 EXPORTER JSON</button>
                <button onClick={() => { if(confirm("Tout effacer ?")) setTasks([]); setIsSettingsOpen(false); }} className="w-full text-left p-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg">🗑️ RESET</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="no-print max-w-7xl mx-auto px-4 mt-6">
        <WeeklyCalendar 
          tasks={tasks}
          currentTime={currentTime}
          onAddTask={handleAddTask}
          onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
          onDeleteTask={handleDeleteTask}
          weekStartDate={currentWeekStart}
        />

        {activeAlerts.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="bg-white p-4 rounded-3xl border-2 border-orange-100 flex items-center gap-4">
                <span className="text-2xl">{alert.status === 'ongoing' ? '🔥' : '🕒'}</span>
                <div>
                  <div className="font-black text-xs uppercase">{alert.name}</div>
                  <div className="text-[10px] text-gray-500">{Math.floor(alert.remainingSeconds / 60)} min restantes</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* BOUTON PDF */}
      <div className="fixed bottom-6 right-6 z-40 no-print">
        <button 
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className="bg-gray-900 text-white px-8 h-14 rounded-full font-black uppercase text-xs shadow-2xl disabled:opacity-50"
        >
          {isGeneratingPdf ? '⏳ Génération...' : '📄 Exporter PDF Hebdo'}
        </button>
      </div>

      {/* ZONE DE CAPTURE (CACHÉE) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0', opacity: 0 }}>
        <div ref={printRef}>
          <PrintLayout tasks={tasksForCurrentWeek} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
        </div>
      </div>

      {isModalOpen && (
        <TaskModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTask}
          initialTask={editingTask || modalInitialData}
        />
      )}
    </div>
  );
};

export default App;