
import React, { useState } from 'react';
import { Vehicle, Driver, WashingLog, Supplier, Unit, Team } from '../types';
import { getTodayLocalDate, formatSafeDate } from '../services/dateUtils';

interface WashingManagementProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  suppliers: Supplier[];
  units: Unit[];
  teams: Team[];
  washingLogs: WashingLog[];
  onAddWashing: (log: Omit<WashingLog, 'id'>) => void;
  onUpdateWashing: (log: WashingLog) => void;
  onDeleteWashing: (id: string) => void;
}

const WashingManagement: React.FC<WashingManagementProps> = ({ 
  vehicles, 
  drivers, 
  suppliers, 
  units,
  teams,
  washingLogs, 
  onAddWashing,
  onUpdateWashing,
  onDeleteWashing 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const initialFormData: Omit<WashingLog, 'id'> = {
    vehicleId: '',
    driverId: '',
    driverName: '',
    supplierId: '',
    unitId: '',
    teamId: '',
    date: getTodayLocalDate(),
    type: 'Simples',
    cost: 0,
    km: 0,
    observations: ''
  };

  const [formData, setFormData] = useState<Omit<WashingLog, 'id'>>(initialFormData);

  const washTypes: WashingLog['type'][] = [
    'Simples', 
    'Completa', 
    'Motor', 
    'Chassi', 
    'Higienização Interna'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || (!formData.driverId && !formData.driverName) || !formData.supplierId) {
      alert("Por favor, preencha os campos obrigatórios (*)");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      if (editingId) {
        onUpdateWashing({ id: editingId, ...formData } as WashingLog);
      } else {
        onAddWashing(formData);
      }
      handleCancel();
      setIsSaving(false);
    }, 600);
  };

  const handleEdit = (log: WashingLog) => {
    const { id, ...data } = log;
    setEditingId(id);
    setFormData(data);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Excluir este registro de lavagem?")) {
      onDeleteWashing(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Estética & Lavagem</h3>
          <p className="text-sm text-gray-500">Controle de conservação e limpeza da frota.</p>
        </div>
        <button 
          onClick={() => showForm ? handleCancel() : setShowForm(true)}
          className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${
            showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
          }`}
        >
          {showForm ? 'Cancelar' : 'Nova Lavagem'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h4 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2"/><path d="M3 12c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2"/><path d="M3 19c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2"/></svg>
             </div>
             {editingId ? 'Editar Lavagem' : 'Novo Lançamento de Lavagem'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Data *</label>
                <input 
                  type="date" 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Veículo *</label>
                <select 
                  value={formData.vehicleId} 
                  onChange={e => setFormData({...formData, vehicleId: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                >
                  <option value="">Selecione...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Motorista *</label>
                <input 
                  type="text"
                  value={formData.driverName} 
                  onChange={e => setFormData({...formData, driverName: e.target.value})}
                  placeholder="Digite o nome do motorista..."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Lava-Jato / Fornecedor *</label>
                <select 
                  value={formData.supplierId} 
                  onChange={e => setFormData({...formData, supplierId: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                >
                  <option value="">Selecione...</option>
                  {suppliers.filter(s => s.category === 'Lava-jato').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Unidade Operacional</label>
                <select 
                  value={formData.unitId} 
                  onChange={e => setFormData({...formData, unitId: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Selecione a Unidade...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Equipe</label>
                <select 
                  value={formData.teamId} 
                  onChange={e => setFormData({...formData, teamId: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Selecione a Equipe...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.number})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tipo de Lavagem *</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {washTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">KM Atual *</label>
                <input 
                  type="number" 
                  value={formData.km} 
                  onChange={e => setFormData({...formData, km: parseInt(e.target.value) || 0})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Custo (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={formData.cost} 
                  onChange={e => setFormData({...formData, cost: parseFloat(e.target.value) || 0})}
                  className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-50">
              <button 
                type="submit" 
                disabled={isSaving}
                className={`px-16 py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 transition-all flex items-center gap-3 ${isSaving ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:bg-blue-700 active:scale-95'}`}
              >
                {isSaving ? 'Sincronizando...' : editingId ? 'Salvar Alterações' : 'Registrar Lavagem'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / KM</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Veículo / Motorista</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidade / Equipe</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Custo</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {washingLogs.map(log => {
                const vehicle = vehicles.find(v => v.id === log.vehicleId);
                const driver = drivers.find(d => d.id === log.driverId);
                const unit = units.find(u => u.id === log.unitId);
                const team = teams.find(t => t.id === log.teamId);
                return (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800">{new Date(log.date).toLocaleDateString('pt-BR')}</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase mt-1">{log.km.toLocaleString()} KM</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-blue-600 uppercase">{vehicle?.plate}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">{log.driverName || driver?.name || '---'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-600 uppercase">{unit?.name || '---'}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">{team?.name || 'Sem Equipe'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[9px] font-black rounded-full uppercase">
                          {log.type}
                        </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="text-sm font-black text-slate-800">R$ {log.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEdit(log)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                         <button onClick={() => handleDelete(log.id)} className="p-2 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {washingLogs.length === 0 && (
          <div className="p-24 text-center text-gray-300 italic">
            Nenhum registro de lavagem realizado.
          </div>
        )}
      </div>
    </div>
  );
};

export default WashingManagement;
