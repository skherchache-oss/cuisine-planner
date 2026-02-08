import React, { useState, useEffect, useRef } from 'react';
import { format, addWeeks, startOfWeek, addDays, setHours, setMinutes, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrepTask } from './types.ts';
import { STAFF_LIST } from './constants.ts';
import WeeklyCalendar from './components/WeeklyCalendar';
import TaskModal from './components/TaskModal';
import PrintLayout from './components/PrintLayout';
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

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);

    try {
      const element = printRef.current;
      // On rend l'élément visible et bien positionné pour la capture
      element.style.display = 'block';
      element.style.position = 'fixed';
      element.style.left = '0';
      element.style.top = '0';
      element.style.zIndex = '9999';
      
      // CRUCIAL : On attend que React dessine les données dans le composant
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 1122,
        windowWidth: 1122,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      pdf.save(`Planning_${format(currentWeekStart, 'yyyy-MM-dd')}.pdf`);
      
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création du PDF");
    } finally {
      if (printRef.current) {
        printRef.current.style.display = 'none';
        printRef.current.style.position = 'absolute';
        printRef.current.style.left = '-10000px';
      }
      setIsGenerating(false);
    }
  };

  // Filtrage ultra-simple par comparaison de chaînes (YYYY-MM-DD)
  const tasksForCurrentWeek = tasks.filter(t => {
    const tDateStr = t.startTime.substring(0, 10);
    const weekDays = Array.from({ length: 7 }, (_, i) => 
      format(addDays(currentWeekStart, i), 'yyyy-MM-dd')
    );
    return weekDays.includes(tDateStr);
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-50">
        <h1 className="font-black text-blue-600 text-center uppercase tracking-tighter">Cuisine Planner</h1>
        <div className="flex bg-gray-100 p-1 rounded-xl mt-3 border">
          <button onClick={() => setWeekOffset(v => v - 1)} className="flex-1 font-bold py-1">‹</button>
          <span className="flex-[4] text-center text-[10px] font-black uppercase self-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset(v => v + 1)} className="flex-1 font-bold py-1">›</button>
        </div>
      </header>

      <main className="p-2">
        <WeeklyCalendar 
          tasks={tasks} 
          weekStartDate={currentWeekStart}
          onAddTask={(day, shift) => {
            const date = setMinutes(setHours(addDays(currentWeekStart, day), 8), 0);
            setEditingTask({
              id: crypto.randomUUID(),
              name: '',
              responsible: STAFF_LIST[0],
              prepTime: 15,
              cookTime: 60,
              packingTime: 10,
              shelfLifeDays: 3,
              startTime: date.toISOString(),
              dayOfWeek: day,
              shift: shift,
              color: 'bg-blue-100',
              comments: ''
            } as PrepTask);
            setIsModalOpen(true);
          }}
          onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }}
        />
      </main>

      <div className="fixed bottom-6 left-0 right-0 px-4 z-40 flex justify-center">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isGenerating}
          className="w-full max-w-xs bg-black text-white py-4 rounded-2xl font-black uppercase shadow-2xl disabled:opacity-50"
        >
          {isGenerating ? "⏳ Création..." : "📄 Exporter PDF"}
        </button>
      </div>

      {/* ZONE DE CAPTURE (Invisible à l'écran mais accessible à html2canvas) */}
      <div ref={printRef} style={{ display: 'none', position: 'absolute', left: '-10000px' }}>
        <PrintLayout tasks={tasksForCurrentWeek} weekLabel={weekLabel} weekStartDate={currentWeekStart} />
      </div>

      {isModalOpen && (
        <TaskModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          initialTask={editingTask}
          onSave={(task) => {
            setTasks(prev => {
              const exists = prev.find(t => t.id === task.id);
              return exists ? prev.map(t => t.id === task.id ? task : t) : [...prev, task];
            });
            setIsModalOpen(false);
          }} 
        />
      )}
    </div>
  );
};

export default App;