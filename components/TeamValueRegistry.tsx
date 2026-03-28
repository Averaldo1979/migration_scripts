import React, { useState } from 'react';
import { TeamRoleValue } from '../types';

interface TeamValueRegistryProps {
  values: TeamRoleValue[];
  onAdd: (value: Omit<TeamRoleValue, 'id'>) => void;
  onUpdate: (value: TeamRoleValue) => void;
  onDelete: (id: string) => void;
}

const TeamValueRegistry: React.FC<TeamValueRegistryProps> = ({ values, onAdd, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<TeamRoleValue, 'id'>>({
    role: '',
    loadValue: 0,
    active: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role || formData.loadValue < 0) {
      alert("Por favor, preencha a função e um valor válido.");
      return;
    }

    if (editingId) {
      onUpdate({ id: editingId, ...formData });
    } else {
      onAdd(formData);
    }

    handleCancel();
  };

  const handleEdit = (v: TeamRoleValue) => {
    setEditingId(v.id);
    setFormData({
      role: v.role,
      loadValue: v.loadValue,
      active: v.active
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ role: '', loadValue: 0, active: true });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Cadastro de Valores por Carga</h3>
          <p className="text-sm text-gray-500 font-medium">Definição de valores financeiros por função/cargo das equipes.</p>
        </div>
        <button
          onClick={() => showForm ? handleCancel() : setShowForm(true)}
          className={`px-6 py-3 rounded-2xl shadow-lg transition-all font-black text-xs uppercase tracking-widest ${showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
        >
          {showForm ? 'Cancelar' : 'Novo Registro'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-indigo-50 animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Função / Cargo *</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700"
                  placeholder="Ex: Motorista"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor da Carga (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.loadValue || ''}
                  onChange={(e) => setFormData({ ...formData, loadValue: parseFloat(e.target.value) || 0 })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-indigo-600"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Status do Cadastro</label>
                <div className="flex items-center gap-3 mt-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                  <span className="text-sm font-bold text-gray-700">{formData.active ? 'Ativo Para Uso' : 'Inativo / Bloqueado'}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-6 border-t border-gray-50">
              <button
                type="submit"
                className="px-16 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-2xl shadow-indigo-100"
              >
                {editingId ? 'Salvar Alterações' : 'Finalizar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Cargo / Função</th>
              <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Valor de Referência</th>
              <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {values.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50/30 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-[10px]">
                        {(v.role || '').charAt(0).toUpperCase()}
                     </div>
                     <span className="font-black text-gray-800 uppercase tracking-tight">{v.role}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="font-black text-indigo-600 text-lg">R$ {v.loadValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    v.active 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    {v.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEdit(v)} className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm bg-white border border-gray-100">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                    </button>
                    <button onClick={() => { if(window.confirm('Deseja excluir este cadastro de valor?')) onDelete(v.id) }} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm bg-white border border-gray-100">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {values.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-32 text-center">
                   <div className="flex flex-col items-center gap-4 text-gray-300">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>
                      <p className="italic font-medium">Nenhum valor de carga cadastrado para as funções.</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamValueRegistry;
