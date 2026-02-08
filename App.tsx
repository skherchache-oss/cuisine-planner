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
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      pdf.save(`Planning-Semaine-${format(currentWeekStart, 'dd-MM')}.pdf`);
    } catch (e) { console.error(e); } finally { setIsGeneratingPdf(false); }
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
      return exists ? prev.map(t => t.id === task.id ? task : t) : [...prev, task];
    });
    setIsModalOpen(false);
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

  const handleExportData = () => {
    const dataBlob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_cuisine.json`;
    link.click();
    setIsSettingsOpen(false);
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
    <div className="min-h-screen bg-gray-50 pb-24 overflow-x-hidden flex flex-col">
      {/* Top Brand Bar */}
      <div className="no-print bg-gray-900 text-white py-1.5 px-4 flex justify-between items-center text-[8px] font-black uppercase border-b border-gray-800">
        <span className="tracking-[0.4em]">BISTROT M</span>
        <span className="tracking-[0.4em] opacity-40">PRODUCTION SYSTEM v2.5</span>
      </div>

      <header className="no-print bg-white border-b shadow-sm sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-2 h-14 flex items-center justify-between gap-1">
          {/* Logo & Titre (Compact sur mobile) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-blue-600 w-8 h-8 flex items-center justify-center rounded-lg text-white font-black text-lg shadow-md">🍽️</div>
            <h1 className="font-black text-gray-900 text-xs sm:text-base tracking-tight uppercase leading-none">
              CUISINE PLANNER
            </h1>
          </div>

          {/* Navigation & Contrôles */}
          <div className="flex items-center gap-1 sm:gap-3 flex-1 justify-end">
            <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
              <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-7 h-7 hover:bg-white rounded-lg font-black text-sm">‹</button>
              <span className="px-1 text-[9px] font-black min-w-[90px] text-center text-gray-600 uppercase tracking-tighter">{weekLabel}</span>
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="w-7 h-7 hover:bg-white rounded-lg font-black text-sm">›</button>
            </div>

            <button 
              onClick={handleRequestPermission}
              className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all ${
                notifPermission === 'granted' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-300 border-gray-100'
              }`}
            >
              {notifPermission === 'granted' ? '🔔' : '🔕'}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all ${isSettingsOpen ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <span className="text-sm">⚙️</span>
              </button>

              {isSettingsOpen && (
                <div className="absolute top-full right-0 mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-[70]">
                  <button onClick={handleExportData} className="w-full text-left px-4 py-2 text-[10px] font-black text-gray-700 hover:bg-blue-50 flex items-center gap-3 uppercase">
                    <span>📤</span> Exporter
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-2 text-[10px] font-black text-gray-700 hover:bg-blue-50 flex items-center gap-3 uppercase">
                    <span>📥</span> Importer
                  </button>
                  <button onClick={() => { if(confirm("Reset ?")) setTasks([]); setIsSettingsOpen(false); }} className="w-full text-left px-4 py-2 text-[10px] font-black text-red-600 hover:bg-red-50 flex items-center gap-3 uppercase">
                    <span>🗑️</span> Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      </header>

      {/* Main Content - No Scroll Horizontal */}
      <main className="no-print w-full max-w-7xl mx-auto px-1 sm:px-4 mt-4 flex-1">
        <div className="w-full overflow-hidden">
          <WeeklyCalendar 
            tasks={tasks}
            currentTime={currentTime}
            onAddTask={handleAddTask}
            onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
            onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
            onMoveTask={handleMoveTask}
            weekStartDate={currentWeekStart}
          />
        </div>
        
        {/* Moniteur Mobile friendly */}
        {activeAlerts.length > 0 && (
          <div className="mt-8 px-2">
            <h3 className="text-[10px] font-black text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-[0.2em]">
              <span className="w-6 h-px bg-gray-200"></span> MONITOR <span className="w-6 h-px bg-gray-200"></span>
            </h3>
            <div className="flex flex-col gap-2">
              {activeAlerts.map(alertTask => (
                <div key={alertTask.id} className={`p-3 rounded-2xl border flex items-center gap-3 bg-white ${alertTask.status === 'ongoing' ? 'border-orange-200' : 'border-blue-100'}`}>
                  <span className="text-xl">{alertTask.status === 'ongoing' ? '🔥' : '🕒'}</span>
                  <div className="flex-1">
                    <div className="font-black text-[11px] uppercase truncate">{alertTask.name}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">
                      {Math.floor(alertTask.remainingSeconds / 60)} min restantes
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FAB Floating Action Button */}
      <div className="fixed bottom-4 right-4 z-40 no-print flex flex-col gap-2">
        <button 
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className="bg-gray-900 text-white p-4 rounded-full shadow-2xl transition-all active:scale-95 disabled:opacity-50 border border-white/20"
        >
          {isGeneratingPdf ? '⏳' : <span className="font-black text-[10px]">PDF</span>}
        </button>
      </div>

      {/* Hidden Print Area */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '297mm' }}>
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