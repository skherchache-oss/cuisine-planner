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
  const [showSettings, setShowSettings] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = addDays(currentWeekStart, 4);
  const weekLabel = `${format(currentWeekStart, 'dd MMM', { locale: fr })} - ${format(currentWeekEnd, 'dd MMM yyyy', { locale: fr })}`;

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) {
      try { setTasks(JSON.parse(saved)); } catch (e) { console.error("Failed to load tasks", e); }
    }
    setNotifPermission(getNotificationStatus());
  }, []);

  useEffect(() => {
    localStorage.setItem('cuisine_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      checkTasksForAlerts(tasks);
    }, 1000); 
    return () => clearInterval(interval);
  }, [tasks]);

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `backup_planning_${format(new Date(), 'dd-MM-yyyy')}.json`);
    linkElement.click();
    setShowSettings(false);
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json) && window.confirm("Remplacer tout le planning par ce fichier ?")) {
          setTasks(json);
          setShowSettings(false);
        }
      } catch (err) { alert("Erreur fichier"); }
    };
    reader.readAsText(file);
  };

  const handleResetAll = () => {
    if (window.confirm("🗑️ Supprimer TOUTES les données ?") && window.confirm("Confirmation finale ?")) {
      setTasks([]);
      localStorage.removeItem('cuisine_tasks');
      setShowSettings(false);
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

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    const opt = { margin: 0, filename: `Planning_${weekLabel}.pdf`, image: { type: 'jpeg', quality: 1.0 }, html2canvas: { scale: 2, useCORS: true, width: 1122 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
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
    .filter(t => t.status !== 'none');

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <header className="no-print bg-white border-b shadow-sm sticky top-0 z-40 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-4">
            {/* Ligne 1: Logo & Menu secondaire */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 w-9 h-9 flex items-center justify-center rounded-xl text-white shadow-md">🍽️</div>
                <h1 className="font-black text-gray-900 text-lg tracking-tighter uppercase">Cuisine Planner</h1>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={handleRequestPermission} className={`p-2 rounded-full border transition-all ${notifPermission === 'granted' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200 animate-pulse'}`}>
                  {notifPermission === 'granted' ? '🔔' : '🔕'}
                </button>
                
                {/* Menu Options */}
                <div className="relative" ref={settingsRef}>
                  <button onClick={() => setShowSettings(!showSettings)} className="bg-gray-100 p-2 rounded-full border border-gray-200 hover:bg-gray-200 transition-all font-bold text-sm">
                    ⚙️ <span className="hidden sm:inline ml-1">Options</span>
                  </button>

                  {showSettings && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                      <p className="text-[10px] font-black text-gray-400 uppercase px-3 py-2 border-b mb-1 tracking-widest">Données</p>
                      <button onClick={handleExportJSON} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl flex items-center gap-3 transition-colors"><span>📤</span> Sauvegarder</button>
                      <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-xl flex items-center gap-3 transition-colors"><span>📥</span> Restaurer</button>
                      <button onClick={handleResetAll} className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors"><span>🗑️</span> Vider tout</button>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportJSON} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ligne 2: Navigation Semaine (Grosse zone de clic) */}
            <div className="flex items-center bg-gray-100 rounded-2xl p-1.5 shadow-inner border border-gray-200">
              <button onClick={() => setWeekOffset(prev => prev - 1)} className="flex-1 py-2 hover:bg-white rounded-xl transition-all font-black text-xl">‹</button>
              <div className="flex-[3] text-center">
                <span className="text-xs font-black text-gray-800 uppercase tracking-tighter">{weekLabel}</span>
              </div>
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="flex-1 py-2 hover:bg-white rounded-xl transition-all font-black text-xl">›</button>
            </div>
          </div>
        </div>
      </header>

      <main className="no-print max-w-7xl mx-auto px-4 mt-6">
        <div className="mb-6">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Planning</h2>
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase mt-2 tracking-widest">
            {activeAlerts.length} production{activeAlerts.length > 1 ? 's' : ''} active{activeAlerts.length > 1 ? 's' : ''}
          </div>
        </div>

        <WeeklyCalendar tasks={tasks} currentTime={currentTime} onAddTask={handleAddTask} onEditTask={handleEditTask} onDeleteTask={handleDeleteTask} onDuplicateTask={handleDuplicateTask} onMoveTask={handleMoveTask} weekStartDate={currentWeekStart} />
        
        {/* Moniteur Mobile-First */}
        {activeAlerts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">⏱️ Moniteur Actif</h3>
            <div className="space-y-3">
              {activeAlerts.map(alertTask => (
                <div key={alertTask.id} className={`p-4 rounded-2xl border-l-8 shadow-sm flex items-center justify-between ${alertTask.status === 'ongoing' ? 'border-orange-500 bg-white' : 'border-blue-500 bg-white'}`}>
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase">{alertTask.name}</span>
                    <span className="text-[10px] font-bold text-gray-400">👤 {alertTask.responsible}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] font-black text-gray-400 uppercase leading-none">{alertTask.status === 'ongoing' ? 'Prêt dans' : 'Début dans'}</span>
                    <span className="text-xl font-black font-mono text-gray-800">{Math.floor(alertTask.remainingSeconds / 60)}:{String(alertTask.remainingSeconds % 60).padStart(2, '0')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* BOUTON PDF : Le plus important, bien visible en bas */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-40 no-print">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isGeneratingPdf} 
          className="w-full bg-gray-900 text-white py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="text-xl">{isGeneratingPdf ? '⏳' : '📄'}</span>
          <span className="font-black uppercase text-sm tracking-widest">
            {isGeneratingPdf ? 'Génération...' : 'Exporter en PDF'}
          </span>
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