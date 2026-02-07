import React, { useState, useEffect } from 'react';
// AJOUT DES EXTENSIONS POUR LE CHARGEMENT DES MODULES
import { PrepTask, ShiftType } from '../types.ts';
import { STAFF_LIST, SHIFTS } from '../constants.ts';
import { calculateExpiry } from '../utils.ts';
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

  const labelClasses = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5";
  const inputClasses = "w-full border-2 border-gray-100 rounded-xl p-3 outline-none font-bold bg-white text-gray-900 transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm";

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        <div className="p-8 bg-gray-50 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">
              {formData.id ? 'Modifier la Fiche' : 'Nouvelle Production'}
            </h2>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-2">Saisie des paramètres HACCP & Temps</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-4xl font-light">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
          {/* LIGNE 1 : NOM ET RESPONSABLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>Désignation du Plat / Préparation</label>
              <input required autoFocus={!formData.id} type="text" className={inputClasses} placeholder="ex: Sauce Tomate, Fond de veau..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className={labelClasses}>Chef Responsable</label>
              <select className={inputClasses} value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})}>
                {STAFF_LIST.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              {formData.responsible === 'Autre' && (
                <input type="text" className={`${inputClasses} mt-2`} placeholder="Nom du responsable..." value={customResponsible} onChange={e => setCustomResponsible(e.target.value)} required />
              )}
            </div>
          </div>

          {/* LIGNE 2 : TEMPS DE PRODUCTION */}
          <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
            <label className={`${labelClasses} text-blue-400 mb-4`}>Chronométrie de Production (Minutes)</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 mb-1 block">Préparation</label>
                <div className="relative">
                  <input type="number" className={inputClasses} value={formData.prepTime} onChange={e => setFormData({...formData, prepTime: parseInt(e.target.value) || 0})} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase">min</span>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 mb-1 block">Cuisson</label>
                <div className="flex gap-1">
                  <input type="number" className={`${inputClasses} flex-1`} value={displayCookTime} onChange={e => setDisplayCookTime(parseFloat(e.target.value) || 0)} />
                  <select className="bg-gray-100 rounded-xl px-2 text-[10px] font-black uppercase outline-none" value={cookTimeUnit} onChange={e => setCookTimeUnit(e.target.value as 'min' | 'h')}>
                    <option value="min">min</option>
                    <option value="h">h</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 mb-1 block">Conditionnement</label>
                <div className="relative">
                  <input type="number" className={inputClasses} value={formData.packingTime} onChange={e => setFormData({...formData, packingTime: parseInt(e.target.value) || 0})} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase">min</span>
                </div>
              </div>
            </div>
          </div>

          {/* LIGNE 3 : PLANIFICATION ET DLC */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className={labelClasses}>Date & Heure de début de production</label>
              <input type="datetime-local" className={inputClasses} value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
            </div>
            <div>
              <label className={labelClasses}>DLC après cuisson</label>
              <div className="relative">
                <input type="number" className={inputClasses} value={formData.shelfLifeDays} onChange={e => setFormData({...formData, shelfLifeDays: parseInt(e.target.value) || 0})} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase">jours</span>
              </div>
            </div>
          </div>

          {/* COMMENTAIRES / RECETTE */}
          <div>
            <label className={labelClasses}>Commentaires / Instructions de Recette</label>
            <textarea 
              rows={4} 
              className={`${inputClasses} resize-none font-medium text-sm`} 
              placeholder="Détails de la mise en place, points de vigilance, étapes clés..."
              value={formData.comments}
              onChange={e => setFormData({...formData, comments: e.target.value})}
            />
          </div>

          {/* RECAPITULATIF DLC */}
          {expiry && (
            <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase opacity-50 mb-1 tracking-widest">Expiration Théorique (DLC)</div>
                <div className="text-xl font-black">{format(expiry, 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })}</div>
              </div>
              <div className="text-3xl">🛡️</div>
            </div>
          )}

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 border-2 border-gray-100 rounded-2xl text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 transition-colors">Annuler</button>
            <button type="submit" className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">Enregistrer la fiche</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;