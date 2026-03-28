
import React, { useState } from 'react';
import { ChecklistTemplateItem } from '../types';

interface ChecklistConfigProps {
  templates: ChecklistTemplateItem[];
  onAdd: (item: Omit<ChecklistTemplateItem, 'id'>) => void;
  onUpdate: (item: ChecklistTemplateItem) => void;
  onDelete: (id: string) => void;
}

const ChecklistConfig: React.FC<ChecklistConfigProps> = ({ templates, onAdd, onUpdate, onDelete }) => {
  const [newItemLabel, setNewItemLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemLabel.trim()) return;
    onAdd({ label: newItemLabel.trim() });
    setNewItemLabel('');
  };

  const startEdit = (item: ChecklistTemplateItem) => {
    setEditingId(item.id);
    setEditingLabel(item.label);
  };

  const handleUpdate = () => {
    if (editingId && editingLabel.trim()) {
      onUpdate({ id: editingId, label: editingLabel.trim() });
      setEditingId(null);
      setEditingLabel('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Configurar Verificações</h3>
        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-8">Defina os itens que devem ser inspecionados em cada checklist da frota.</p>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 mb-10">
          <input 
            type="text" 
            placeholder="Ex: Nível de fluido de arrefecimento..."
            value={newItemLabel}
            onChange={(e) => setNewItemLabel(e.target.value)}
            className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
          />
          <button 
            type="submit"
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Criar Novo Item
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.length > 0 ? templates.map((item) => (
            <div key={item.id} className="p-5 bg-gray-50 border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-md rounded-3xl flex items-center justify-between group transition-all">
              {editingId === item.id ? (
                <div className="flex-1 flex gap-2">
                  <input 
                    type="text" 
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    className="flex-1 p-3 bg-white border border-blue-400 rounded-xl outline-none font-bold text-sm text-blue-600"
                    autoFocus
                  />
                  <button onClick={handleUpdate} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-100"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>
                  <button onClick={() => setEditingId(null)} className="p-3 bg-gray-200 text-gray-500 rounded-xl"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    </div>
                    <div>
                        <span className="text-sm font-black text-gray-700 uppercase tracking-tight">{item.label}</span>
                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">ID: {item.id}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => startEdit(item)} 
                        className="p-2.5 text-blue-600 bg-white border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="Editar Item"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button 
                        onClick={() => onDelete(item.id)} 
                        className="p-2.5 text-red-500 bg-white border border-red-100 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Remover Item"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          )) : (
            <div className="col-span-2 p-24 text-center text-gray-300 italic border-4 border-dashed border-gray-50 rounded-[40px]">
                Nenhum item de verificação cadastrado para o checklist.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistConfig;
