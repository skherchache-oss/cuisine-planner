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
  const weekLabel = `${format(currentWeekStart, 'dd MMM', { locale: fr })} - ${format(currentWeekEnd, 'dd MMM', { locale: fr })}`;

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

  const handleExportData = () => {
    const dataBlob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_cuisine.json`;
    link.click();
    setIsSettingsOpen(false);
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
    <div className="min-h-screen bg-[#F8FAFC] pb-24 overflow-x-hidden flex flex-col font-sans">
      {/* Fine Brand Line */}
      <div className="no-print bg-[#0F172A] text-white py-1 px-4 flex justify-between items-center text-[7px] font-bold uppercase tracking-[0.3em] opacity-90">
        <span>BISTROT M</span>
        <span>PRODUCTION v2.6</span>
      </div>

      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-[60] shadow-sm px-3 sm:px-6">
        <div className="max-w-7xl mx-auto h-20 sm:h-24 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          
          {/* GAUCHE : LOGO + TITRE PLANNER */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-11 h-11 flex items-center justify-center rounded-2xl text-white text-xl shadow-lg ring-2 ring-white">
              🍽️
            </div>
            <h1 className="font-black text-slate-900 text-lg sm:text-2xl tracking-tighter uppercase leading-none">
              Planner
            </h1>
          </div>

          {/* CENTRE : NAVIGATION SEMAINE AGRANDIE */}
          <div className="flex items-center bg-slate-100/80 rounded-2xl p-1 border border-slate-200 shadow-inner">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-slate-600 font-bold hover:bg-white rounded-xl transition-all">‹</button>
            <div className="px-3 sm:px-6 flex flex-col items-center min-w-[110px] sm:min-w-[160px]">
              <span className="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-widest">Semaine</span>
              <span className="text-[9px] sm:text-[11px] font-bold text-blue-600 uppercase mt-0.5 whitespace-nowrap">{weekLabel}</span>
            </div>
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-slate-600 font-bold hover:bg-white rounded-xl transition-all">›</button>
          </div>

          {/* DROITE : ACTIONS */}
          <div className="flex items-center gap-2 justify-self-end">
            <button 
              onClick={handleRequestPermission}
              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl border-2 transition-all ${
                notifPermission === 'granted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-300 border-slate-100'
              }`}
            >
              <span className="text-xl">{notifPermission === 'granted' ? '🔔' : '🔕'}</span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl border-2 transition-all ${
                  isSettingsOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-100 shadow-sm'
                }`}
              >
                <span className="text-xl">⚙️</span>
              </button>

              {isSettingsOpen && (
                <div className="absolute top-[120%] right-0 w-48 bg-white border border-slate-200 rounded-[2rem] shadow-2xl py-3 z-[70] animate-in fade-in zoom-in duration-200">
                  <button onClick={handleExportData} className="w-full text-left px-5 py-3 text-[10px] font-black text-slate-700 hover:bg-slate-50 flex items-center gap-3 uppercase"><span>📤</span> Exporter</button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-5 py-3 text-[10px] font-black text-slate-700 hover:bg-slate-50 flex items-center gap-3 uppercase"><span>📥</span> Importer</button>
                  <div className="mx-4 my-2 border-t border-slate-100"></div>
                  <button onClick={() => { if(confirm("Reset ?")) setTasks([]); setIsSettingsOpen(false); }} className="w-full text-left px-5 py-3 text-[10px] font-black text-rose-600 hover:bg-rose-50 flex items-center gap-3 uppercase"><span>🗑️</span> Reset</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      </header>

      <main className="no-print w-full max-w-7xl mx-auto px-2 sm:px-4 mt-6 flex-1">
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
        
        {/* Alerts Monitor */}
        {activeAlerts.length > 0 && (
          <div className="mt-10 px-2 pb-10">
            <h3 className="text-[11px] font-black text-slate-400 mb-4 flex items-center gap-3 uppercase tracking-[0.3em]">
              <div className="h-1 flex-1 bg-slate-200 rounded-full"></div>
              Live Monitor
              <div className="h-1 flex-1 bg-slate-200 rounded-full"></div>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeAlerts.map(alertTask => (
                <div key={alertTask.id} className="p-4 rounded-3xl border-2 flex items-center gap-4 bg-white shadow-sm border-slate-100">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${alertTask.status === 'ongoing' ? 'bg-orange-100' : 'bg-blue-50'}`}>
                    {alertTask.status === 'ongoing' ? '🔥' : '🕒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-xs uppercase text-slate-800 truncate">{alertTask.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      {Math.floor(alertTask.remainingSeconds / 60)} min restantes
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FAB PDF */}
      <div className="fixed bottom-6 right-6 z-40 no-print">
        <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="bg-slate-900 text-white w-16 h-16 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center transition-all active:scale-95 border-2 border-slate-700">
          {isGeneratingPdf ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
            <>
              <span className="text-xl">📄</span>
              <span className="font-black text-[9px] mt-1">PDF</span>
            </>
          )}
        </button>
      </div>

      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '297mm' }}>
        <div ref={printRef}><PrintLayout tasks={tasks} weekLabel={weekLabel} weekStartDate={currentWeekStart} /></div>
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} initialTask={editingTask || modalInitialData} />
    </div>
  );
};

export default App;