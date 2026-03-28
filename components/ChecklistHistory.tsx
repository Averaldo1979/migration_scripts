
import React, { useState } from 'react';
import { ChecklistSession, Vehicle, Driver, Unit, Team } from '../types';

interface ChecklistHistoryProps {
  checklists: ChecklistSession[];
  vehicles: Vehicle[];
  drivers: Driver[];
  units: Unit[];
  teams: Team[];
  onDeleteChecklist: (id: string) => void;
}

const ChecklistHistory: React.FC<ChecklistHistoryProps> = ({ checklists, vehicles, drivers, units, teams, onDeleteChecklist }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<ChecklistSession | null>(null);

  const filteredChecklists = checklists.filter(c => {
    const vehicle = vehicles.find(v => v.id === c.vehicleId);
    const driver = drivers.find(d => d.id === c.driverId);
    const unit = units.find(u => u.id === c.unitId);
    const team = teams.find(t => t.id === c.teamId);
    const searchString = `${vehicle?.plate} ${driver?.name} ${unit?.name} ${team?.name} ${c.id}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
           <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Registro Histórico</h3>
           <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Consulta de auditoria e conformidade técnica</p>
        </div>
        <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Filtrar placa, condutor, unidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
            />
            <div className="absolute left-3.5 top-4.5 text-gray-300">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChecklists.map((session) => {
          const vehicle = vehicles.find(v => v.id === session.vehicleId);
          const driver = drivers.find(d => d.id === session.driverId);
          const unit = units.find(u => u.id === session.unitId);
          const team = teams.find(t => t.id === session.teamId);
          const nokItems = session.items.filter(i => i.status === 'NOK').length;
          
          return (
            <div 
              key={session.id} 
              className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div onClick={() => setSelectedSession(session)}>
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[9px] font-black text-gray-400 uppercase font-mono bg-gray-50 px-2 py-1 rounded">REF: {session.id}</span>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-blue-500 uppercase block leading-none">{new Date(session.date).toLocaleDateString('pt-BR')}</span>
                    <span className="text-[9px] text-gray-300 font-bold uppercase">{new Date(session.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-14 h-14 rounded-2xl bg-blue-50 flex flex-col items-center justify-center border border-blue-100 shadow-sm">
                      <span className="text-[8px] font-black text-blue-400 uppercase leading-none mb-1">PLACA</span>
                      <span className="text-sm font-black text-blue-700 leading-none">{vehicle?.plate || 'S/N'}</span>
                   </div>
                   <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-800 leading-tight truncate">{driver?.name || 'Não identificado'}</h4>
                      <p className="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-tighter line-clamp-1">
                        {unit?.name || 'Central'} • {team?.name || 'Sem Equipe'}
                      </p>
                   </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Status Conformidade</span>
                    <span className={`text-xs font-black uppercase mt-0.5 ${nokItems > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {nokItems > 0 ? `${nokItems} falhas detectadas` : '100% Operacional'}
                    </span>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteChecklist(session.id); }}
                      className="p-2.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                      title="Excluir Registro"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                    <button 
                      onClick={() => setSelectedSession(session)}
                      className="p-2.5 bg-slate-900 text-white rounded-xl transition-all shadow-xl shadow-slate-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                    </button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredChecklists.length === 0 && (
        <div className="p-32 text-center bg-white rounded-[40px] border border-dashed border-slate-100 shadow-inner">
           <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
           <p className="text-slate-300 font-black uppercase text-xs tracking-[0.3em]">Base de dados vazia para os filtros aplicados</p>
        </div>
      )}

      {/* Modal de Detalhes Completo */}
      {selectedSession && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-10 border-b border-slate-50 flex justify-between items-start shrink-0">
                    <div>
                        <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Dossiê de Inspeção</h4>
                        <div className="flex flex-wrap gap-4 mt-4">
                            <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                ATIVO: {vehicles.find(v => v.id === selectedSession.vehicleId)?.plate || '--'}
                            </div>
                            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                UNIDADE: {units.find(u => u.id === selectedSession.unitId)?.name || 'Central'}
                            </div>
                            <div className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100">
                                {new Date(selectedSession.date).toLocaleString('pt-BR')}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSelectedSession(null)} className="p-4 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-10 space-y-4">
                    <div className="grid grid-cols-2 gap-6 mb-8">
                       <div className="p-5 bg-slate-50 rounded-[32px] border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável pela Auditoria</p>
                          <p className="text-sm font-black text-slate-800">{drivers.find(d => d.id === selectedSession.driverId)?.name || '--'}</p>
                       </div>
                       <div className="p-5 bg-slate-50 rounded-[32px] border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Equipe Vinculada</p>
                          <p className="text-sm font-black text-slate-800">{teams.find(t => t.id === selectedSession.teamId)?.name || '--'}</p>
                       </div>
                    </div>

                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Verificação de Parâmetros Técnicos</h5>
                    <div className="space-y-3">
                        {selectedSession.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 hover:border-blue-100 transition-all shadow-sm">
                                <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest ${
                                    item.status === 'OK' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                    item.status === 'NOK' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-100 text-gray-400 border-gray-200'
                                }`}>
                                    {item.status === 'NOK' ? 'INCONFORME' : item.status === 'OK' ? 'CONFORME' : 'NÃO SE APLICA'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-10 bg-slate-50 border-t border-slate-100 shrink-0 flex gap-4">
                    <button onClick={() => window.print()} className="px-8 py-5 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                       Imprimir Laudo
                    </button>
                    <button onClick={() => setSelectedSession(null)} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-2xl">Encerrar Consulta</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistHistory;
