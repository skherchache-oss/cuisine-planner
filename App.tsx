import React, { useState, useEffect, useRef } from 'react';
import { format, addWeeks, startOfWeek, addDays, isBefore, addMinutes, isAfter, setHours, setMinutes, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GoogleGenerativeAI } from "@google/generative-ai";

import { PrepTask, ShiftType } from './types';
import WeeklyCalendar from './components/WeeklyCalendar';
import TaskModal from './components/TaskModal';
import PrintLayout from './components/PrintLayout';
import { requestNotificationPermission, checkTasksForAlerts, getNotificationStatus } from './services/notificationService';
import { STAFF_LIST } from './constants';

declare const html2pdf: any;

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const App: React.FC = () => {
  const [tasks, setTasks] = useState<PrepTask[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PrepTask | undefined>(undefined);
  const [modalInitialData, setModalInitialData] = useState<Partial<PrepTask>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [currentTime, setCurrentTime] = useState(new Date());
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = addDays(currentWeekStart, 4);
  const weekLabel = `${format(currentWeekStart, 'dd MMM', { locale: fr })} - ${format(currentWeekEnd, 'dd MMM yyyy', { locale: fr })}`;

  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
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

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `planning_cuisine_${format(new Date(), 'dd-MM-yyyy')}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          if (window.confirm("Importer ces données ? Cela remplacera votre planning actuel.")) {
            setTasks(json);
          }
        }
      } catch (err) {
        alert("Erreur JSON.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleResetAll = () => {
    if (window.confirm("⚠️ Supprimer TOUTES les fiches ?") && window.confirm("Action définitive. Confirmer ?")) {
      setTasks([]);
      localStorage.removeItem('cuisine_tasks');
    }
  };

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotifPermission(permission || 'denied');
  };

  const handleAddTask = (dayIdx: number, shift: ShiftType) => {
    const dayDate = addDays(currentWeekStart, dayIdx);
    const dateAt8AM = format(setMinutes(setHours(dayDate, 8), 0), "yyyy-MM-dd'T'HH:mm");
    setModalInitialData({ id: undefined, name: '', dayOfWeek: dayIdx, shift, startTime: dateAt8AM, responsible: STAFF_LIST[0], prepTime: 15, cookTime: 60, packingTime: 10, shelfLifeDays: 3, comments: '' });
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: PrepTask) => { setEditingTask(task); setIsModalOpen(true); };
  const handleDuplicateTask = (task: PrepTask) => { setTasks(prev => [...prev, { ...task, id: crypto.randomUUID(), name: `${task.name} (Copie)` }]); };
  const handleSaveTask = (task: PrepTask) => {
    if (editingTask) setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    else setTasks(prev => [...prev, task]);
    setIsModalOpen(false);
  };
  const handleDeleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));
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

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    const opt = { margin: 0, filename: `Cuisine_${weekLabel}.pdf`, image: { type: 'jpeg', quality: 1.0 }, html2canvas: { scale: 2, useCORS: true, width: 1122 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
    try { await html2pdf().set(opt).from(printRef.current).save(); } finally { setIsGeneratingPdf(false); }
  };

  const activeAlerts = tasks
    .map(task => {
      const start = new Date(task.startTime);
      const end = addMinutes(start, task.cookTime);
      const isOngoing = isBefore(start, currentTime) && isAfter(end, currentTime);
      const isStartingSoon = isAfter(start, currentTime) && isBefore(start, addMinutes(currentTime, 30));
      let status = 'none', remainingSeconds = 0;
      if (isOngoing) { status = 'ongoing'; remainingSeconds = Math.max(0, Math.floor((end.getTime() - currentTime.getTime()) / 1000)); }
      else if (isStartingSoon) { status = 'soon'; remainingSeconds = Math.max(0, Math.floor((start.getTime() - currentTime.getTime()) / 1000)); }
      return { ...task, status, remainingSeconds };
    })
    .filter(t => t.status !== 'none')
    .sort((a, b) => a.remainingSeconds - b.remainingSeconds);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="no-print bg-white border-b shadow-sm sticky top-0 z-30 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-3">
            {/* Ligne 1: Titre & Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-white font-black text-lg shadow-sm">🍽️</div>
                <h1 className="font-black text-gray-900 text-lg sm:text-xl tracking-tighter">Cuisine Planner</h1>
              </div>
              
              <button onClick={handleRequestPermission} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${notifPermission === 'granted' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'}`}>
                <span>{notifPermission === 'granted' ? '🔔' : '🔕'}</span>
                <span className="hidden xs:inline">{notifPermission === 'granted' ? 'Alertes' : 'Activer'}</span>
              </button>
            </div>

            {/* Ligne 2: Navigation & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 sm:pt-0 sm:border-t-0">
              {/* Navigation Semaine */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1 shadow-inner border border-gray-200 flex-1 sm:flex-none justify-between sm:justify-start">
                <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-8 h-8 hover:bg-white rounded-md transition-all font-black">‹</button>
                <span className="px-2 text-[10px] font-black min-w-[110px] text-center text-gray-700 uppercase">{weekLabel}</span>
                <button onClick={() => setWeekOffset(prev => prev + 1)} className="w-8 h-8 hover:bg-white rounded-md transition-all font-black">›</button>
              </div>

              {/* Actions Données */}
              <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-inner gap-1">
                <button onClick={handleExportJSON} className="px-2 py-1 text-[9px] font-black uppercase text-gray-500 hover:text-blue-600 transition-colors" title="Export">📤 <span className="hidden xs:inline">Export</span></button>
                <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 text-[9px] font-black uppercase text-gray-500 hover:text-green-600 transition-colors" title="Import">📥 <span className="hidden xs:inline">Import</span></button>
                <button onClick={handleResetAll} className="px-2 py-1 text-[9px] font-black uppercase text-gray-400 hover:text-red-600 transition-colors" title="Reset">🗑️ <span className="hidden xs:inline">Reset</span></button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportJSON} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="no-print max-w-7xl mx-auto px-4 mt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Planning</h2>
          <p className="text-blue-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Production : {activeAlerts.filter(a => a.status === 'ongoing').length} en cours
          </p>
        </div>

        <WeeklyCalendar tasks={tasks} currentTime={currentTime} onAddTask={handleAddTask} onEditTask={handleEditTask} onDeleteTask={handleDeleteTask} onDuplicateTask={handleDuplicateTask} onMoveTask={handleMoveTask} weekStartDate={currentWeekStart} />

        {activeAlerts.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">⏱️ Moniteur</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeAlerts.map(alertTask => (
                <div key={alertTask.id} className={`p-4 rounded-xl border-2 flex flex-col justify-between ${alertTask.status === 'ongoing' ? 'border-orange-200 bg-orange-50' : 'border-blue-100 bg-blue-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-xs uppercase truncate pr-2">{alertTask.name}</span>
                    <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">👤 {alertTask.responsible}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black uppercase text-gray-400">{alertTask.status === 'ongoing' ? 'Fin' : 'Début'} :</span>
                    <span className="text-base font-black font-mono">{Math.floor(alertTask.remainingSeconds / 60)}m {alertTask.remainingSeconds % 60}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action PDF */}
      <div className="fixed bottom-6 right-6 z-50 no-print">
        <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="bg-gray-900 hover:bg-blue-600 text-white w-12 h-12 sm:w-auto sm:px-5 sm:h-12 rounded-full sm:rounded-xl flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50">
          <span>{isGeneratingPdf ? '⏳' : '📄'}</span>
          <span className="hidden sm:inline font-black uppercase text-[10px] tracking-widest">PDF</span>
        </button>
      </div>

      <div style={{ position: 'absolute', left: '-9999px', top: '0', zIndex: -1 }}>
        <div ref={printRef}><PrintLayout tasks={tasks} weekLabel={weekLabel} weekStartDate={currentWeekStart} /></div>
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} initialTask={editingTask || modalInitialData} />
    </div>
  );
};

export default App;