
import React, { useState, useEffect } from 'react';
import { PrepTask, ShiftType } from '../types';
import { STAFF_LIST, SHIFTS } from '../constants';
import { calculateExpiry } from '../utils';
import { format, setHours, setMinutes, parseISO, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: PrepTask) => void;
  initialTask?: Partial<PrepTask>;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, initialTask }) => {
  const getDefaultTime = () => format(setMinutes(setHours(new Date(), 8), 0), "yyyy-MM-dd'T'HH:mm");

  const [formData, setFormData] = useState<Partial<PrepTask>>({
    name: '',
    responsible: STAFF_LIST[0],
    prepTime: 15,
    cookTime: 60,
    packingTime: 10,
    shelfLifeDays: 3,
    startTime: getDefaultTime(),
    shift: 'morning',
    dayOfWeek: 0,
    comments: '',
  });

  const [customResponsible, setCustomResponsible] = useState('');
  const [displayCookTime, setDisplayCookTime] = useState<number>(60);
  const [cookTimeUnit, setCookTimeUnit] = useState<'min' | 'h'>('min');

  useEffect(() => {
    if (isOpen && initialTask) {
      const isEditing = !!initialTask.id;
      const isCustom = initialTask.responsible && !STAFF_LIST.includes(initialTask.responsible);
      
      setFormData({ 
        id: isEditing ? initialTask.id : undefined,
        name: isEditing ? (initialTask.name || '') : '',
        responsible: initialTask.responsible || STAFF_LIST[0],
        prepTime: initialTask.prepTime ?? 15,
        cookTime: initialTask.cookTime ?? 60,
        packingTime: initialTask.packingTime ?? 10,
        shelfLifeDays: initialTask.shelfLifeDays ?? 3,
        startTime: initialTask.startTime || getDefaultTime(),
        shift: initialTask.shift || 'morning',
        dayOfWeek: initialTask.dayOfWeek ?? 0,
        comments: initialTask.comments || '',
      });

      if (isCustom) {
        setCustomResponsible(initialTask.responsible || '');
      } else {
        setCustomResponsible('');
      }
      
      const mins = initialTask.cookTime || 60;
      if (mins >= 60 && mins % 15 === 0) {
        setDisplayCookTime(mins / 60);
        setCookTimeUnit('h');
      } else {
        setDisplayCookTime(mins);
        setCookTimeUnit('min');
      }
    }
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cookTimeInMinutes = cookTimeUnit === 'h' 
      ? Math.round(displayCookTime * 60) 
      : displayCookTime;

    const finalResponsible = formData.responsible === 'Autre' ? customResponsible : formData.responsible;
    
    const taskDate = parseISO(formData.startTime || getDefaultTime());
    let calculatedDayIdx = getDay(taskDate) - 1;
    if (calculatedDayIdx < 0) calculatedDayIdx = 6;

    onSave({
      id: formData.id || crypto.randomUUID(),
      name: formData.name || 'Sans titre',
      responsible: finalResponsible || STAFF_LIST[0],
      prepTime: Number(formData.prepTime),
      cookTime: cookTimeInMinutes,
      packingTime: Number(formData.packingTime),
      shelfLifeDays: Number(formData.shelfLifeDays),
      startTime: formData.startTime || getDefaultTime(),
      dayOfWeek: calculatedDayIdx, 
      shift: formData.shift || 'morning',
      color: 'blue',
      comments: formData.comments || ''
    } as PrepTask);
    onClose();
  };

  const currentCookMins = cookTimeUnit === 'h' ? Math.round(displayCookTime * 60) : displayCookTime;
  const expiry = formData.startTime ? calculateExpiry(formData.startTime, currentCookMins, Number(formData.shelfLifeDays || 0)) : null;

  const labelClasses = "block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5";
  const inputClasses = "w-full border-2 border-gray-100 rounded-xl p-3 outline-none font-bold bg-white text-gray-900 transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm sm:text-base";

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center sm:p-4 backdrop-blur-md">
      <div className="bg-white rounded-none sm:rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[95vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="p-6 sm:p-8 bg-gray-50 border-b flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">
              {formData.id ? 'Édition Fiche' : 'Nouvelle Prod'}
            </h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1.5">Paramètres HACCP & Temps</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-4xl leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* LIGNE 1 : NOM ET RESPONSABLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className={labelClasses}>Désignation</label>
              <input required autoFocus={!formData.id} type="text" className={inputClasses} placeholder="ex: Sauce Tomate..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className={labelClasses}>Chef</label>
              <select className={inputClasses} value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})}>
                {STAFF_LIST.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              {formData.responsible === 'Autre' && (
                <input type="text" className={`${inputClasses} mt-2`} placeholder="Prénom..." value={customResponsible} onChange={e => setCustomResponsible(e.target.value)} required />
              )}
            </div>
          </div>

          {/* CHRONOMETRIE - Adapté mobile */}
          <div className="bg-blue-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-blue-100">
            <label className={`${labelClasses} text-blue-400 mb-4`}>Production (Minutes)</label>
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
              <div>
                <label className="text-[8px] font-black uppercase text-gray-500 mb-1 block">Prep.</label>
                <div className="relative">
                  <input type="number" className={inputClasses} value={formData.prepTime} onChange={e => setFormData({...formData, prepTime: parseInt(e.target.value) || 0})} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300 uppercase">min</span>
                </div>
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-gray-500 mb-1 block">Cuisson</label>
                <div className="flex gap-1">
                  <input type="number" className={`${inputClasses} flex-1`} value={displayCookTime} onChange={e => setDisplayCookTime(parseFloat(e.target.value) || 0)} />
                  <select className="bg-white border-2 border-gray-100 rounded-xl px-1.5 text-[9px] font-black uppercase outline-none" value={cookTimeUnit} onChange={e => setCookTimeUnit(e.target.value as 'min' | 'h')}>
                    <option value="min">min</option>
                    <option value="h">h</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-gray-500 mb-1 block">Cond.</label>
                <div className="relative">
                  <input type="number" className={inputClasses} value={formData.packingTime} onChange={e => setFormData({...formData, packingTime: parseInt(e.target.value) || 0})} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300 uppercase">min</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="md:col-span-2">
              <label className={labelClasses}>Début de production</label>
              <input type="datetime-local" className={inputClasses} value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
            </div>
            <div>
              <label className={labelClasses}>Conservation (DLC)</label>
              <div className="relative">
                <input type="number" className={inputClasses} value={formData.shelfLifeDays} onChange={e => setFormData({...formData, shelfLifeDays: parseInt(e.target.value) || 0})} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300 uppercase">jours</span>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClasses}>Instructions / Recette</label>
            <textarea 
              rows={3} 
              className={`${inputClasses} resize-none font-medium`} 
              placeholder="Détails techniques..."
              value={formData.comments}
              onChange={e => setFormData({...formData, comments: e.target.value})}
            />
          </div>

          {expiry && (
            <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[10px] font-black uppercase opacity-50 mb-1 tracking-widest">Expiration (DLC)</div>
                <div className="text-sm sm:text-lg font-black truncate">{format(expiry, 'EEE dd MMM HH:mm', { locale: fr })}</div>
              </div>
              <div className="text-2xl sm:text-3xl shrink-0">🛡️</div>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={onClose} className="w-full px-6 py-3.5 border-2 border-gray-100 rounded-xl text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 text-xs">Annuler</button>
            <button type="submit" className="w-full px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 text-xs">Valider la fiche</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
