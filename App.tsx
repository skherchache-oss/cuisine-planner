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
  const weekLabel = `${format(currentWeekStart, 'dd MMM', { locale: fr })} - ${format(addDays(currentWeekStart, 4), 'dd MMM yyyy', { locale: fr })}`;

  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) {
      try { setTasks(JSON.parse(saved)); } catch (e) { console.error(e); }
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

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    
    const element = printRef.current;
    const opt = { 
      margin: 0, 
      filename: `Planning_Cuisine_${weekLabel}.pdf`, 
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        width: 1120, // Forcer la largeur du tableau
        windowWidth: 1120 
      }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } 
    };

    try { 
      await html2pdf().set(opt).from(element).save(); 
    } catch (err) {
      console.error(err);
    } finally { 
      setIsGeneratingPdf(false); 
    }
  };

  // Logique métier tâches
  const handleAddTask = (dayIdx: number, shift: ShiftType) => {
    const dayDate = addDays(currentWeekStart, dayIdx);
    const dateAt8AM = format(setMinutes(setHours(dayDate, 8), 0), "yyyy-MM-dd'T'HH:mm");
    setModalInitialData({ dayOfWeek: dayIdx, shift, startTime: dateAt8AM, responsible: STAFF_LIST[0], prepTime: 15, cookTime: 60, packingTime: 10, shelfLifeDays: 3 });
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleSaveTask = (task: PrepTask) => {
    if (editingTask) setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    else setTasks(prev => [...prev, task]);
    setIsModalOpen(false);
  };

  const handleMoveTask = (taskId: string, newDate: Date, newShift: ShiftType) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const oldStart = parseISO(task.startTime.toString());
        const updatedStart = setMinutes(setHours(newDate, oldStart.getHours()), oldStart.getMinutes());
        return { ...task, startTime: format(updatedStart, "yyyy-MM-dd'T'HH:mm"), shift: newShift, dayOfWeek: (updatedStart.getDay() + 6) % 7 };
      }
      return task;
    }));
  };

  const tasksForCurrentWeek = tasks.filter(task => {
    const taskDate = parseISO(task.startTime.toString());
    return taskDate >= currentWeekStart && taskDate < addDays(currentWeekStart, 7);
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <header className="no-print bg-white border-b shadow-sm sticky top-0 z-40 py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="font-black text-gray-900 text-lg uppercase">Cuisine Planner</h1>
              <div className="flex gap-2">
                <button onClick={() => setShowSettings(!showSettings)} className="bg-gray-100 p-2 rounded-full border">⚙️</button>
                {showSettings && (
                  <div className="absolute right-4 mt-12 w-48 bg-white border rounded-xl shadow-xl p-2 z-50">
                    <button onClick={() => {setTasks([]); setShowSettings(false);}} className="w-full text-left p-2 text-red-500 font-bold">🗑️ Vider tout</button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center bg-gray-100 rounded-xl p-1 border">
              <button onClick={() => setWeekOffset(prev => prev - 1)} className="flex-1 py-1 font-bold">‹</button>
              <div className="flex-[3] text-center font-black text-[10px] uppercase">{weekLabel}</div>
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="flex-1 py-1 font-bold">›</button>
            </div>
          </div>
      </header>

      <main className="no-print max-w-7xl mx-auto px-4 mt-6">
        <WeeklyCalendar 
          tasks={tasks} 
          currentTime={currentTime} 
          onAddTask={handleAddTask} 
          onEditTask={(t) => {setEditingTask(t); setIsModalOpen(true);}} 
          onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))} 
          onDuplicateTask={(t) => setTasks(prev => [...prev, {...t, id: crypto.randomUUID(), name: t.name + " (Copie)"}])} 
          onMoveTask={handleMoveTask} 
          weekStartDate={currentWeekStart} 
        />
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-40 no-print">
        <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="w-full bg-black text-white py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl font-black uppercase text-sm">
          {isGeneratingPdf ? 'Génération...' : 'Exporter PDF'}
        </button>
      </div>

      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        <div ref={printRef}>
          <PrintLayout tasks={tasksForCurrentWeek} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
        </div>
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} initialTask={editingTask || modalInitialData} />
    </div>
  );
};

export default App;