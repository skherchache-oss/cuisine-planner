import React, { useState, useEffect, useRef } from 'react';
import { format, addWeeks, startOfWeek, addDays, setHours, setMinutes, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrepTask } from './types';
import WeeklyCalendar from './components/WeeklyCalendar';
import TaskModal from './components/TaskModal';
import PrintLayout from './components/PrintLayout';
import { STAFF_LIST } from './constants';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<PrepTask[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PrepTask | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  const currentWeekStart = startOfDay(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }));
  const weekLabel = `${format(currentWeekStart, 'dd MMM', { locale: fr })} - ${format(addDays(currentWeekStart, 4), 'dd MMM yyyy', { locale: fr })}`;

  useEffect(() => {
    const saved = localStorage.getItem('cuisine_tasks');
    if (saved) { try { setTasks(JSON.parse(saved)); } catch (e) { console.error(e); } }
  }, []);

  useEffect(() => {
    localStorage.setItem('cuisine_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // LOGIQUE DE GÉNÉRATION PDF (SANS WINDOW.PRINT)
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);

    try {
      const element = printRef.current;
      // On force temporairement l'élément à être visible pour la capture
      element.style.display = 'block';
      
      const canvas = await html2canvas(element, {
        scale: 2, // Haute qualité
        useCORS: true,
        logging: false,
        width: 1122, // Largeur A4 Paysage en pixels approx
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Planning_${format(currentWeekStart, 'yyyy-MM-dd')}.pdf`);
      
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      alert("Erreur lors de la création du PDF");
    } finally {
      if (printRef.current) printRef.current.style.display = 'none';
      setIsGenerating(false);
    }
  };

  const tasksForCurrentWeek = tasks.filter(t => {
    const tDate = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime;
    const weekDays = Array.from({ length: 7 }, (_, i) => format(addDays(currentWeekStart, i), 'yyyy-MM-dd'));
    return weekDays.includes(format(tDate, 'yyyy-MM-dd'));
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-50">
        <h1 className="font-black text-blue-600 text-center text-lg">CUISINE PLANNER</h1>
        <div className="flex bg-gray-100 p-1 rounded-xl mt-3">
          <button onClick={() => setWeekOffset(v => v - 1)} className="flex-1 font-bold">‹</button>
          <span className="flex-[4] text-center text-xs font-black uppercase self-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset(v => v + 1)} className="flex-1 font-bold">›</button>
        </div>
      </header>

      <main className="p-2">
        <WeeklyCalendar 
          tasks={tasks} 
          weekStartDate={currentWeekStart}
          onAddTask={(day, shift) => {
            const date = setMinutes(setHours(addDays(currentWeekStart, day), 8), 0);
            setEditingTask({ id: crypto.randomUUID(), startTime: format(date, "yyyy-MM-dd'T'HH:mm"), shift, responsible: STAFF_LIST[0], name: '', prepTime: 15, cookTime: 60, shelfLifeDays: 3 } as PrepTask);
            setIsModalOpen(true);
          }}
          onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
        />
      </main>

      {/* BOUTON EXPORTER PDF */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-40 flex justify-center">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isGenerating}
          className="w-full max-w-xs bg-black text-white py-4 rounded-2xl font-black uppercase shadow-2xl disabled:opacity-50"
        >
          {isGenerating ? "⏳ Création..." : "📄 Exporter PDF"}
        </button>
      </div>

      {/* ZONE CACHÉE POUR LA CAPTURE PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={printRef} style={{ width: '297mm', background: 'white', display: 'none' }}>
          <PrintLayout tasks={tasksForCurrentWeek} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={(task) => {
          setTasks(prev => {
            const exists = prev.find(t => t.id === task.id);
            return exists ? prev.map(t => t.id === task.id ? task : t) : [...prev, task];
          });
          setIsModalOpen(false);
        }} 
        initialTask={editingTask} 
      />
    </div>
  );
};

export default App;