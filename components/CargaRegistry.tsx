import React, { useState } from 'react';
import { Carga, Team } from '../types';

interface CargaRegistryProps {
  cargas: Carga[];
  teams: Team[];
  onAdd: (carga: Omit<Carga, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (carga: Carga) => void;
  onDelete: (id: string) => void;
}

const CargaRegistry: React.FC<CargaRegistryProps> = ({ cargas, teams, onAdd, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    teamId: ''
  });
  const [formData, setFormData] = useState<Partial<Carga>>({
    date: new Date().toISOString().split('T')[0],
    teamId: '',
    birdsCount: 0,
    tons: 0,
    cargasCount: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Allow 0 for birdsCount, tons, and cargasCount.
    // Only date and teamId are strictly required to be non-empty.
    if (!formData.date || !formData.teamId) {
      alert("Por favor, preencha a Data e a Equipe.");
      return;
    }

    try {
      if (editingId) {
        await onUpdate({ id: editingId, ...formData } as Carga);
      } else {
        await onAdd(formData as Omit<Carga, 'id' | 'createdAt' | 'updatedAt'>);
      }
      handleCancel();
    } catch (error) {
      console.error("Erro ao salvar carga:", error);
      alert("Ocorreu um erro ao salvar o registro. Verifique sua conexão.");
    }
  };

  const handleEdit = (c: Carga) => {
    setEditingId(c.id);
    setFormData({
      date: c.date,
      teamId: c.teamId,
      birdsCount: c.birdsCount,
      tons: c.tons,
      cargasCount: c.cargasCount
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      teamId: '',
      birdsCount: 0,
      tons: 0,
      cargasCount: 0
    });
  };

  const getTeamName = (id: string) => {
    const t = teams.find(t => t.id === id);
    return t ? `${t.name} - ${t.number}` : 'Desconhecido';
  };

  const filteredAndSortedCargas = React.useMemo(() => {
    return [...cargas]
      .filter(c => {
        const matchesTeam = !filter.teamId || c.teamId === filter.teamId;
        const matchesStart = !filter.startDate || c.date >= filter.startDate;
        const matchesEnd = !filter.endDate || c.date <= filter.endDate;
        return matchesTeam && matchesStart && matchesEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cargas, filter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Registro de Cargas</h3>
          <p className="text-sm text-gray-500 font-medium">Controle de toneladas e quantidade de aves por equipe.</p>
        </div>
        <button
          onClick={() => showForm ? handleCancel() : setShowForm(true)}
          className={`px-6 py-3 rounded-2xl shadow-lg transition-all font-black text-xs uppercase tracking-widest ${showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
        >
          {showForm ? 'Cancelar' : 'Nova Carga'}
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Equipe</label>
          <select
            value={filter.teamId}
            onChange={(e) => setFilter({ ...filter, teamId: e.target.value })}
            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold text-gray-700"
          >
            <option value="">Todas as Equipes</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name} - {t.number}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Início</label>
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold text-gray-700"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Fim</label>
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold text-gray-700"
          />
        </div>
        <button
          onClick={() => setFilter({ startDate: '', endDate: '', teamId: '' })}
          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Limpar Filtros"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-indigo-50 animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Data *</label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Equipe *</label>
                <select
                  value={formData.teamId || ''}
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700"
                >
                  <option value="">Selecione...</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name} - {t.number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Número de Aves *</label>
                <input
                  type="number"
                  value={formData.birdsCount || ''}
                  onChange={(e) => setFormData({ ...formData, birdsCount: parseInt(e.target.value) || 0 })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700"
                  placeholder="Ex: 5000"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Número de Cargas *</label>
                <input
                  type="number"
                  step="any"
                  value={formData.cargasCount || ''}
                  onChange={(e) => setFormData({ ...formData, cargasCount: parseFloat(e.target.value) || 0 })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700"
                  placeholder="Ex: 5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Toneladas *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tons || ''}
                  onChange={(e) => setFormData({ ...formData, tons: parseFloat(e.target.value) || 0 })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700"
                  placeholder="Ex: 12.5"
                />
              </div>
            </div>
            <div className="flex justify-end pt-6 border-t border-gray-50">
              <button
                type="submit"
                className="px-16 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-2xl shadow-indigo-100"
              >
                {editingId ? 'Salvar Alterações' : 'Finalizar Registro'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Data</th>
              <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Equipe</th>
              <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Aves</th>
              <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Nº Cargas</th>
              <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Toneladas</th>
              <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredAndSortedCargas.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/30 transition-colors group">
                <td className="px-8 py-5 font-bold text-gray-800">
                  {new Date(c.date + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                </td>
                <td className="px-8 py-5 font-bold text-gray-700">
                  {getTeamName(c.teamId)}
                </td>
                <td className="px-8 py-5 font-black text-indigo-600">
                  {c.birdsCount.toLocaleString('pt-BR')}
                </td>
                <td className="px-8 py-5 font-black text-indigo-600">
                  {c.cargasCount.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </td>
                <td className="px-8 py-5 font-black text-indigo-600">
                  {c.tons.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} t
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEdit(c)} className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm bg-white border border-gray-100">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                    </button>
                    <button onClick={() => { if(window.confirm('Deseja excluir esta carga?')) onDelete(c.id) }} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm bg-white border border-gray-100">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAndSortedCargas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-32 text-center">
                   <div className="flex flex-col items-center gap-4 text-gray-300">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>
                      <p className="italic font-medium">Nenhuma carga cadastrada.</p>
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

export default CargaRegistry;
