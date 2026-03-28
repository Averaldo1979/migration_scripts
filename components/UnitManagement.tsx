
import React, { useState } from 'react';
import { Unit } from '../types';

interface UnitManagementProps {
  units: Unit[];
  onAddUnit: (unit: Omit<Unit, 'id'>) => void;
  onUpdateUnit: (unit: Unit) => void;
  onDeleteUnit: (id: string) => void;
}

const UnitManagement: React.FC<UnitManagementProps> = ({ units, onAddUnit, onUpdateUnit, onDeleteUnit }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Unit, 'id'>>({
    name: '',
    code: '',
    responsible: '',
    address: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.responsible) {
      alert("Nome, Código e Responsável são obrigatórios.");
      return;
    }

    if (editingId) {
      onUpdateUnit({ id: editingId, ...formData });
    } else {
      onAddUnit(formData);
    }

    handleCancel();
  };

  const handleEdit = (unit: Unit) => {
    const { id, ...data } = unit;
    setEditingId(id);
    setFormData(data);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', code: '', responsible: '', address: '', phone: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Unidades Operacionais</h3>
          <p className="text-sm text-gray-500">Gestão de matriz, filiais e centros de distribuição.</p>
        </div>
        <button 
          onClick={() => showForm ? handleCancel() : setShowForm(true)}
          className={`px-6 py-2.5 rounded-xl shadow-lg transition-all font-semibold flex items-center gap-2 ${
            showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {showForm ? 'Cancelar' : 'Cadastrar Nova Unidade'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>
            {editingId ? 'Editar Unidade' : 'Nova Unidade Administrativa'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome da Unidade *</label>
                <input 
                  type="text" placeholder="Ex: Filial Regional Norte"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Código Interno *</label>
                <input 
                  type="text" placeholder="Ex: UN-001"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Responsável / Gerente *</label>
                <input 
                  type="text" placeholder="Nome do gestor"
                  value={formData.responsible}
                  onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone de Contato</label>
                <input 
                  type="text" placeholder="(00) 0000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Endereço Completo</label>
                <input 
                  type="text" placeholder="Rua, Número, Cidade, Estado"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
               <button 
                 type="submit"
                 className="px-12 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg"
               >
                 {editingId ? 'Salvar Alterações' : 'Salvar Unidade'}
               </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {units.map((unit) => (
          <div key={unit.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 flex items-center justify-center pt-8 pr-8 opacity-40">
               <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase">
                Cód: {unit.code}
              </span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => handleEdit(unit)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
                <button onClick={() => onDeleteUnit(unit.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>

            <h4 className="text-xl font-bold text-gray-800 mb-2">{unit.name}</h4>
            
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-indigo-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Responsável</p>
                  <p className="font-semibold">{unit.responsible}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-indigo-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Contato</p>
                  <p className="font-semibold">{unit.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-600 pt-2 border-t border-gray-50">
                <div className="mt-1 text-indigo-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <p className="text-xs italic leading-relaxed">{unit.address}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {units.length === 0 && (
        <div className="text-center p-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>
          </div>
          <h4 className="text-gray-500 font-bold">Nenhuma unidade cadastrada</h4>
          <p className="text-gray-400 text-sm">Cadastre suas bases operacionais para melhor organização da frota.</p>
        </div>
      )}
    </div>
  );
};

export default UnitManagement;
