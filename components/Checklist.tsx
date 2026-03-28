
import React, { useState, useEffect } from 'react';
import { Vehicle, Driver, ChecklistSession, ChecklistItem, ChecklistTemplateItem, Unit, Team } from '../types';

interface ChecklistProps {
  templates: ChecklistTemplateItem[];
  vehicles: Vehicle[];
  drivers: Driver[];
  units: Unit[];
  teams: Team[];
  onSave: (session: ChecklistSession) => void;
}

const Checklist: React.FC<ChecklistProps> = ({ templates, vehicles, drivers, units, teams, onSave }) => {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>([]);

  // Inicializa a data com o momento atual
  useEffect(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    setEventDate(localISOTime);
  }, []);

  // Inicializa os itens com base nos templates quando o componente monta ou templates mudam
  useEffect(() => {
    setItems(templates.map(t => ({ id: t.id, label: t.label, status: 'OK' })));
  }, [templates]);

  // Filtrar equipes pela unidade selecionada
  const filteredTeams = teams.filter(t => t.unitId === selectedUnit || !selectedUnit);

  const handleFinish = () => {
    if (!selectedVehicle || !selectedDriver || !selectedUnit || !selectedTeam || !eventDate) {
        alert("Por favor, preencha todos os campos do cabeçalho da inspeção (Veículo, Motorista, Unidade, Equipe e Data).");
        return;
    }
    if (items.length === 0) {
        alert("Não há itens de verificação cadastrados. Vá em 'Configurações' para cadastrar itens.");
        return;
    }

    const newSession: ChecklistSession = {
      id: Math.random().toString(36).substr(2, 9),
      vehicleId: selectedVehicle,
      driverId: selectedDriver,
      unitId: selectedUnit,
      teamId: selectedTeam,
      date: new Date(eventDate).toISOString(),
      items: [...items]
    };

    onSave(newSession);
    
    // Reset
    setSelectedVehicle('');
    setSelectedDriver('');
    setSelectedUnit('');
    setSelectedTeam('');
    setItems(templates.map(t => ({ id: t.id, label: t.label, status: 'OK' })));
    
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    setEventDate(new Date(now.getTime() - offset).toISOString().slice(0, 16));
    
    alert("Inspeção enviada com sucesso para a Torre de Controle!");
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>

        <div className="mb-10">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Nova Inspeção de Conformidade</h3>
            <p className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mt-2">Torre de Controle Operacional • Checklist Diário de Ativos</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data e Hora da Inspeção</label>
            <input 
              type="datetime-local" 
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Veículo / Ativo *</label>
            <select 
              value={selectedVehicle} 
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
            >
              <option value="">Identificar Placa...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Inspetor / Motorista *</label>
            <select 
              value={selectedDriver} 
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
            >
              <option value="">Selecionar Responsável...</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unidade Operacional *</label>
            <select 
              value={selectedUnit} 
              onChange={(e) => {
                setSelectedUnit(e.target.value);
                setSelectedTeam(''); // Reseta equipe ao trocar unidade
              }}
              className="w-full p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-indigo-700 transition-all"
            >
              <option value="">Selecione a Filial...</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Equipe Vinculada *</label>
            <select 
              value={selectedTeam} 
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
              disabled={!selectedUnit}
            >
              <option value="">{selectedUnit ? 'Escolher Equipe...' : 'Aguardando Unidade...'}</option>
              {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.number})</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Relação de Itens Inspecionados</h4>
             <div className="flex gap-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-sm shadow-emerald-200"/> CONFORME</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-sm shadow-red-200"/> AVARIA</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-slate-400 shadow-sm shadow-slate-200"/> N/A</span>
             </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
              {items.length > 0 ? items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-5 bg-white hover:bg-slate-50 border border-gray-100 hover:border-blue-200 rounded-3xl transition-all group shadow-sm">
                  <span className="text-sm font-black text-slate-700 tracking-tight">{item.label}</span>
                  <div className="flex gap-2">
                    {[
                      { id: 'OK', label: 'OK', color: 'emerald' },
                      { id: 'NOK', label: 'FALHA', color: 'red' },
                      { id: 'NA', label: 'N/A', color: 'slate' }
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: st.id as any } : i))}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all border tracking-widest ${
                          item.status === st.id 
                            ? `bg-${st.color}-500 text-white border-${st.color}-500 shadow-lg shadow-${st.color}-200` 
                            : 'bg-white text-gray-300 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="p-20 text-center text-slate-300 italic border-4 border-dashed border-slate-50 rounded-[40px]">
                    Nenhum parâmetro de inspeção configurado no sistema.
                </div>
              )}
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-slate-100">
           <div className="w-full p-10 border-2 border-dashed border-blue-100 rounded-[32px] bg-blue-50/20 flex flex-col items-center justify-center text-blue-400 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group mb-8">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em]">Capturar Evidências</span>
              <p className="text-[10px] mt-2 font-bold text-slate-400">Obrigatório registrar fotos em caso de falha técnica</p>
           </div>
           
           <button 
             onClick={handleFinish}
             className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] hover:bg-black shadow-2xl shadow-slate-200 transition-all transform hover:-translate-y-1 active:scale-[0.98]"
           >
             Transmitir para Torre de Controle
           </button>
        </div>
      </div>
    </div>
  );
};

export default Checklist;
