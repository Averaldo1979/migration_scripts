
import React, { useState, useEffect } from 'react';
import { Vehicle, Driver, OdometerLog, VehicleStatus, UserRole } from '../types';

interface OdometerManagementProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  odometerLogs: OdometerLog[];
  onUpdateKm: (vehicleId: string, km: number, type: OdometerLog['type'], driverId?: string, date?: string) => void;
  onDeleteLog?: (id: string) => void;
  onUpdateLog?: (log: OdometerLog) => void;
  currentUserRole?: UserRole;
}

const OdometerManagement: React.FC<OdometerManagementProps> = ({ 
    vehicles, 
    drivers, 
    odometerLogs, 
    onUpdateKm,
    onDeleteLog,
    onUpdateLog,
    currentUserRole
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [kmInput, setKmInput] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Inicializa a data com o momento atual em formato datetime-local
  useEffect(() => {
    if (!editingLogId) {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
        setEventDate(localISOTime);
    }
  }, [editingLogId]);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const handleGateAction = (type: 'Saída' | 'Retorno') => {
    if (!selectedVehicleId || !kmInput || !eventDate) {
      alert("Por favor, preencha o veículo, KM e Data/Hora do evento.");
      return;
    }

    const kmValue = parseInt(kmInput);
    
    // Validação de KM
    if (type === 'Retorno' && kmValue < (selectedVehicle?.km || 0)) {
        alert("O KM de retorno não pode ser menor que o KM atual registrado.");
        return;
    }

    const isoDate = new Date(eventDate).toISOString();

    if (editingLogId && onUpdateLog) {
        onUpdateLog({
            id: editingLogId,
            vehicleId: selectedVehicleId,
            km: kmValue,
            date: isoDate,
            type: 'Saída',
            driverId: selectedDriverId || undefined
        });
        alert("Saída atualizada com sucesso!");
    } else {
        onUpdateKm(selectedVehicleId, kmValue, type, selectedDriverId || undefined, isoDate);
        alert(`${type} registrada com sucesso!`);
    }
    
    handleResetForm();
  };

  const handleResetForm = () => {
    setKmInput('');
    setSelectedDriverId('');
    setSelectedVehicleId('');
    setEditingLogId(null);
    // Reset date to now
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    setEventDate(localISOTime);
  };

  const handleEditCheckout = (v: Vehicle) => {
    // Busca o log de saída mais recente deste veículo que ainda não teve retorno
    const exitLog = odometerLogs.find(l => l.vehicleId === v.id && l.type === 'Saída');
    if (exitLog) {
        setEditingLogId(exitLog.id);
        setSelectedVehicleId(v.id);
        setSelectedDriverId(exitLog.driverId || '');
        setKmInput(exitLog.km.toString());
        
        // Converte ISO para datetime-local
        const d = new Date(exitLog.date);
        const offset = d.getTimezoneOffset() * 60000;
        const localISOTime = new Date(d.getTime() - offset).toISOString().slice(0, 16);
        setEventDate(localISOTime);
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteCheckout = (v: Vehicle) => {
    if (window.confirm(`Deseja realmente cancelar a saída do veículo ${v.plate}? O status voltará para Disponível.`)) {
        const exitLog = odometerLogs.find(l => l.vehicleId === v.id && l.type === 'Saída');
        if (exitLog && onDeleteLog) {
            onDeleteLog(exitLog.id);
        }
    }
  };

  const handleDeleteAuditLog = (logId: string) => {
    if (window.confirm("Deseja excluir permanentemente este registro de auditoria?")) {
        onDeleteLog?.(logId);
    }
  };

  const isAdmin = currentUserRole === UserRole.ADMIN;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel de Portaria (Controle de Saída e Entrada) */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-slate-800 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1"><path d="M12 2v20M2 12h20"/><path d="m18 8 4 4-4 4M6 8l-4 4 4 4"/></svg>
            </div>

            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8">
                {editingLogId ? 'Corrigir Saída' : 'Controle de Portaria'}
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Data e Hora do Evento</label>
                <input 
                  type="datetime-local" 
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-white appearance-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Veículo para Trânsito</label>
                <select 
                  value={selectedVehicleId} 
                  disabled={!!editingLogId}
                  onChange={(e) => {
                      setSelectedVehicleId(e.target.value);
                      const v = vehicles.find(veh => veh.id === e.target.value);
                      setKmInput(v ? v.km.toString() : '');
                  }}
                  className={`w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-white appearance-none ${editingLogId ? 'opacity-50' : ''}`}
                >
                  <option value="">Identificar Placa...</option>
                  {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                          {v.plate} - {v.model} ({v.status === VehicleStatus.IN_USE ? 'Em Trânsito' : 'Na Base'})
                      </option>
                  ))}
                </select>
              </div>

              {selectedVehicle && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                        <span className="text-[9px] font-black text-slate-500 uppercase">Status Atual</span>
                        <p className={`text-sm font-black mt-1 ${selectedVehicle.status === VehicleStatus.IN_USE ? 'text-blue-400' : 'text-emerald-400'}`}>
                            {selectedVehicle.status}
                        </p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 text-right">
                        <span className="text-[9px] font-black text-slate-500 uppercase">KM Registrado</span>
                        <p className="text-sm font-black text-white mt-1">{selectedVehicle.km.toLocaleString()}</p>
                    </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Odômetro Lido (No momento do evento)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={kmInput}
                  onChange={(e) => setKmInput(e.target.value)}
                  className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-2xl text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Condutor da Viagem</label>
                <select 
                  value={selectedDriverId} 
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-white appearance-none"
                >
                  <option value="">Selecionar Motorista...</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.status})</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                {editingLogId ? (
                   <div className="flex gap-4">
                      <button onClick={handleResetForm} className="flex-1 py-5 bg-slate-700 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all">Cancelar Edição</button>
                      <button onClick={() => handleGateAction('Saída')} className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all">Salvar Alterações</button>
                   </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleGateAction('Saída')}
                            disabled={!selectedVehicle || selectedVehicle.status === VehicleStatus.IN_USE}
                            className={`py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                selectedVehicle && selectedVehicle.status === VehicleStatus.AVAILABLE 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500' 
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                            }`}
                        >
                            Registrar Saída
                        </button>
                        <button 
                            onClick={() => handleGateAction('Retorno')}
                            disabled={!selectedVehicle || selectedVehicle.status !== VehicleStatus.IN_USE}
                            className={`py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                selectedVehicle && selectedVehicle.status === VehicleStatus.IN_USE 
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500' 
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                            }`}
                        >
                            Registrar Retorno
                        </button>
                    </div>
                )}
              </div>

              {selectedVehicle?.status === VehicleStatus.IN_USE && selectedVehicle.lastExitKm && !editingLogId && (
                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/20 rounded-2xl">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter mb-1 text-center">Resumo da Viagem Atual</p>
                      <div className="flex justify-between items-center text-xs font-bold text-blue-200">
                          <span>Saída: {selectedVehicle.lastExitKm.toLocaleString()} KM</span>
                          <span>Percorrido: {parseInt(kmInput) - selectedVehicle.lastExitKm} KM</span>
                      </div>
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboards e Histórico */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Frota em Trânsito (Check-out)</h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monitoramento de Viagens Ativas</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vehicles.filter(v => v.status === VehicleStatus.IN_USE).length > 0 ? (
                    vehicles.filter(v => v.status === VehicleStatus.IN_USE).map(v => (
                        <div key={v.id} className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 relative group transition-all hover:shadow-md">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-black text-gray-800 leading-none">{v.plate}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{v.model}</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button 
                                        onClick={() => handleEditCheckout(v)}
                                        className="p-1.5 bg-white text-blue-600 rounded-lg shadow-sm border border-blue-100 hover:bg-blue-600 hover:text-white transition-all"
                                        title="Editar Saída"
                                     >
                                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                     </button>
                                     <button 
                                        onClick={() => handleDeleteCheckout(v)}
                                        className="p-1.5 bg-white text-red-500 rounded-lg shadow-sm border border-red-100 hover:bg-red-500 hover:text-white transition-all"
                                        title="Excluir Saída (Estornar)"
                                     >
                                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                     </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase">KM de Saída</span>
                                    <span className="text-lg font-black text-blue-700">{v.lastExitKm?.toLocaleString() || v.km.toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[9px] font-black text-gray-400 uppercase">Último Evento</span>
                                    <span className="text-xs font-bold text-gray-500">
                                        {v.lastExitDate ? new Date(v.lastExitDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '--'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="md:col-span-2 p-10 bg-gray-50 border border-dashed border-gray-200 rounded-3xl text-center text-gray-400 italic text-sm">
                        Todos os ativos estão na base no momento.
                    </div>
                )}
             </div>
          </div>

          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-8 border-b border-gray-50">
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Auditoria de Odômetro e Deslocamento</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Momento / Tipo</th>
                            <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Veículo / Condutor</th>
                            <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Leitura</th>
                            <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Delta (Viagem)</th>
                            <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {odometerLogs.length > 0 ? odometerLogs.map(log => {
                            const vehicle = vehicles.find(v => v.id === log.vehicleId);
                            const driver = drivers.find(d => d.id === log.driverId);
                            return (
                                <tr key={log.id} className="hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    log.type === 'Saída' ? 'bg-blue-500' : 
                                                    log.type === 'Retorno' ? 'bg-emerald-500' : 'bg-slate-400'
                                                }`} />
                                                <span className="text-xs font-black text-gray-800 uppercase tracking-tighter">{log.type}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold">{new Date(log.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-black text-gray-700 leading-none">{vehicle?.plate}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{driver?.name || 'Não identificado'}</p>
                                    </td>
                                    <td className="px-8 py-5 text-center font-mono font-black text-gray-500 text-xs">
                                        {log.km.toLocaleString()} KM
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        {log.tripKm ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-emerald-600">+{log.tripKm.toLocaleString()} KM</span>
                                                <span className="text-[8px] font-black text-emerald-300 uppercase leading-none">Distância Percorrida</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-300 italic">--</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {isAdmin && (
                                            <button 
                                                onClick={() => handleDeleteAuditLog(log.id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                title="Excluir Registro (Admin)"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-300 italic">Nenhuma auditoria registrada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OdometerManagement;
