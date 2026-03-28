
import React, { useState, useRef } from 'react';
import { Equipment, EquipmentMaintenanceLog, EquipmentStatus, Unit } from '../types';
import { getTodayLocalDate, formatSafeDate } from '../services/dateUtils';

interface EquipmentMaintenanceProps {
  equipments: Equipment[];
  maintenanceLogs: EquipmentMaintenanceLog[];
  units: Unit[];
  onAddEquipment: (eq: Omit<Equipment, 'id'>) => void;
  onAddMaintenanceLog: (log: Omit<EquipmentMaintenanceLog, 'id'>) => void;
  onDeleteEquipment: (id: string) => void;
  onDeleteLog: (id: string) => void;
}

const EquipmentMaintenance: React.FC<EquipmentMaintenanceProps> = ({
  equipments,
  maintenanceLogs,
  units,
  onAddEquipment,
  onAddMaintenanceLog,
  onDeleteEquipment,
  onDeleteLog
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'assets' | 'logs'>('assets');
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const initialAssetFormData: Omit<Equipment, 'id'> = {
    name: '',
    type: 'Esteira',
    serialNumber: '',
    installationDate: getTodayLocalDate(),
    unitId: '',
    status: EquipmentStatus.OPERATIONAL,
    photoUrl: '',
    team: ''
  };

  const [assetFormData, setAssetFormData] = useState<Omit<Equipment, 'id'>>(initialAssetFormData);

  const [logFormData, setLogFormData] = useState<Omit<EquipmentMaintenanceLog, 'id'>>({
    equipmentId: '',
    unitId: '',
    date: getTodayLocalDate(),
    type: 'Preventiva',
    description: '',
    responsible: '',
    cost: 0,
    durationHours: 1
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAssetFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEquipment(assetFormData);
    setShowAssetForm(false);
    setAssetFormData(initialAssetFormData);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const equipment = equipments.find(eq => eq.id === logFormData.equipmentId);
    onAddMaintenanceLog({ ...logFormData, unitId: equipment?.unitId || '' });
    setShowLogForm(false);
    setLogFormData({ equipmentId: '', unitId: '', date: getTodayLocalDate(), type: 'Preventiva', description: '', responsible: '', cost: 0, durationHours: 1 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Manutenção de Ativos Operacionais</h3>
          <p className="text-sm text-gray-500">Gestão técnica de esteiras, sistemas elétricos e correias.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
           <button onClick={() => setActiveSubTab('assets')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'assets' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>Inventário</button>
           <button onClick={() => setActiveSubTab('logs')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'logs' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>O.S. Técnica</button>
        </div>
      </div>

      {activeSubTab === 'assets' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
             <button onClick={() => setShowAssetForm(true)} className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Novo Equipamento</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipments.map(eq => (
              <div key={eq.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-4">
                      {eq.photoUrl && (
                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 shadow-sm">
                          <img src={eq.photoUrl} alt={eq.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase w-fit">{eq.type}</span>
                        <span className="text-[10px] font-bold text-gray-400">SN: {eq.serialNumber}</span>
                      </div>
                   </div>
                   <div className="flex gap-1 transition-all opacity-0 group-hover:opacity-100">
                      <button onClick={() => onDeleteEquipment(eq.id)} className="p-2 text-gray-300 hover:text-red-500 transition-all bg-gray-50 rounded-lg">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                   </div>
                </div>
                <h4 className="text-lg font-black text-gray-800 leading-tight mb-2">{eq.name}</h4>
                {eq.team && <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Equipe: {eq.team}</p>}
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Status</p>
                        <p className={`text-xs font-black uppercase ${eq.status === EquipmentStatus.OPERATIONAL ? 'text-emerald-600' : 'text-red-600'}`}>{eq.status}</p>
                    </div>
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Unidade</p>
                        <p className="text-xs font-black text-gray-700 truncate">{units.find(u => u.id === eq.unitId)?.name || 'N/A'}</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] font-bold text-gray-400">
                    <span>Instalado: {formatSafeDate(eq.installationDate)}</span>
                    <span className="text-blue-500 uppercase">Mnt: {eq.lastMaintenanceDate ? formatSafeDate(eq.lastMaintenanceDate) : 'Nunca'}</span>
                </div>
              </div>
            ))}
            {equipments.length === 0 && <div className="col-span-full py-20 text-center text-gray-300 italic">Nenhum equipamento industrial cadastrado.</div>}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end gap-3">
             <button onClick={() => setShowLogForm(true)} className="px-5 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">Abrir O.S. Técnica</button>
          </div>

          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / Tipo O.S.</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipamento / SN</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição Técnica</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valores (R$)</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Responsável</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {maintenanceLogs.map(log => {
                    const eq = equipments.find(e => e.id === log.equipmentId);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className={`text-[9px] font-black uppercase mb-1 px-2 py-0.5 rounded-lg w-fit ${
                              log.type === 'Preventiva' ? 'bg-emerald-50 text-emerald-600' : 
                              log.type === 'Preditiva' ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'
                            }`}>{log.type}</span>
                            <span className="text-xs font-bold text-gray-800">{formatSafeDate(log.date)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-gray-700">{eq?.name}</span>
                              <span className="text-[9px] text-gray-400 font-mono uppercase">SN: {eq?.serialNumber}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-medium text-gray-600 max-w-xs truncate" title={log.description}>{log.description}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex flex-col">
                             <span className="text-sm font-black text-slate-800">R$ {log.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             <span className="text-[9px] text-gray-400 uppercase font-black">{log.durationHours}h Duração</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                          {log.responsible}
                        </td>
                        <td className="px-8 py-5 text-center">
                           <button onClick={() => onDeleteLog(log.id)} className="p-2 text-gray-300 hover:text-red-500 transition-all">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                           </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {maintenanceLogs.length === 0 && <div className="p-20 text-center text-gray-300 italic">Nenhuma O.S. técnica registrada.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro Ativo */}
      {showAssetForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full p-10 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <h4 className="text-2xl font-black text-gray-800 mb-8 uppercase tracking-tight">Cadastrar Máquina / Equipamento</h4>
            <form onSubmit={handleAddAsset} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Foto do Equipamento */}
              <div className="md:col-span-2 flex flex-col items-center gap-4 mb-4">
                  <div 
                    onClick={() => photoInputRef.current?.click()}
                    className="w-32 h-32 bg-gray-50 border-4 border-dashed border-gray-100 rounded-3xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-all group relative"
                  >
                    {assetFormData.photoUrl ? (
                      <img src={assetFormData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-gray-300 group-hover:text-blue-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                        <span className="text-[8px] font-black mt-1 uppercase tracking-widest">Foto Ativo</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Imagem Ilustrativa do Ativo</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nome Identificador *</label>
                <input type="text" required value={assetFormData.name} onChange={e => setAssetFormData({...assetFormData, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" placeholder="Ex: Esteira Transportadora 04 - Setor A" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Tipo de Ativo *</label>
                <select value={assetFormData.type} onChange={e => setAssetFormData({...assetFormData, type: e.target.value as any})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-blue-600">
                  <option value="Esteira">Esteira</option>
                  <option value="DR/Elétrico">DR / Sist. Elétrico</option>
                  <option value="Correia">Correia Transmissão</option>
                  <option value="Motor">Motor Industrial</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Número de Série / Tag *</label>
                <input type="text" required value={assetFormData.serialNumber} onChange={e => setAssetFormData({...assetFormData, serialNumber: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-mono font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Unidade Operacional *</label>
                <select required value={assetFormData.unitId} onChange={e => setAssetFormData({...assetFormData, unitId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-indigo-600">
                  <option value="">Selecione...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Equipe Responsável</label>
                <input type="text" value={assetFormData.team || ''} onChange={e => setAssetFormData({...assetFormData, team: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" placeholder="Ex: Manutenção Mecânica" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Data de Instalação</label>
                <input type="date" value={assetFormData.installationDate} onChange={e => setAssetFormData({...assetFormData, installationDate: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
              </div>
              <div className="md:col-span-2 flex gap-4 pt-6">
                <button type="button" onClick={() => setShowAssetForm(false)} className="flex-1 py-4 font-black text-gray-400 uppercase text-[11px] tracking-widest">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl">Salvar no Inventário</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal O.S. Técnica */}
      {showLogForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full p-10 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <h4 className="text-2xl font-black text-gray-800 mb-8 uppercase tracking-tight text-blue-600">Lançamento de O.S. Técnica</h4>
            <form onSubmit={handleAddLog} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Equipamento Selecionado *</label>
                <select required value={logFormData.equipmentId} onChange={e => setLogFormData({...logFormData, equipmentId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold">
                  <option value="">Selecione o ativo...</option>
                  {equipments.map(eq => <option key={eq.id} value={eq.id}>{eq.name} (SN: {eq.serialNumber})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Tipo de Manutenção *</label>
                <select required value={logFormData.type} onChange={e => setLogFormData({...logFormData, type: e.target.value as any})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-indigo-600">
                  <option value="Preventiva">Preventiva (Rotina)</option>
                  <option value="Preditiva">Preditiva (Monitoramento)</option>
                  <option value="Corretiva">Corretiva (Falha)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Data do Serviço *</label>
                <input type="date" required value={logFormData.date} onChange={e => setLogFormData({...logFormData, date: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Descrição da Intervenção *</label>
                <textarea required value={logFormData.description} onChange={e => setLogFormData({...logFormData, description: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-medium resize-none" rows={2} placeholder="Descreva os serviços realizados, peças trocadas, lubrificação, etc." />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Técnico Responsável *</label>
                <input type="text" required value={logFormData.responsible} onChange={e => setLogFormData({...logFormData, responsible: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" placeholder="Nome do Técnico ou Equipe" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Custo Total (R$)</label>
                <input type="number" step="0.01" value={logFormData.cost} onChange={e => setLogFormData({...logFormData, cost: parseFloat(e.target.value) || 0})} className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl outline-none font-black text-blue-700" />
              </div>
              <div className="md:col-span-2 flex gap-4 pt-6">
                <button type="button" onClick={() => setShowLogForm(false)} className="flex-1 py-4 font-black text-gray-400 uppercase text-[11px] tracking-widest">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-blue-100">Efetivar Ordem Técnica</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentMaintenance;
