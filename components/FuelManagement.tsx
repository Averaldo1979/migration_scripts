import React, { useState, useEffect, useMemo } from 'react';
import { Vehicle, FuelLog, Unit, FuelLogEnriched, FuelType, Driver, Supplier, Team } from '../types';
import { getTodayLocalDate, formatSafeDate } from '../services/dateUtils';

interface FuelManagementProps {
  drivers: Driver[];
  teams: Team[];
  vehicles: Vehicle[];
  suppliers: Supplier[];
  units: Unit[];
  fuelLogs: FuelLog[];
  fuelTypes: FuelType[];
  onAddFuelLog: (log: Omit<FuelLog, 'id'>) => void;
  onUpdateFuelLog: (log: FuelLog) => void;
  onDeleteFuelLog: (id: string) => void;
  onAddFuelType: (type: Omit<FuelType, 'id'>) => void;
  onUpdateFuelType: (type: FuelType) => void;
  onDeleteFuelType: (id: string) => void;
}

const FuelManagement: React.FC<FuelManagementProps> = ({ 
  drivers,
  teams,
  vehicles, 
  suppliers, 
  units, 
  fuelLogs, 
  fuelTypes,
  onAddFuelLog, 
  onUpdateFuelLog, 
  onDeleteFuelLog,
  onAddFuelType, 
  onUpdateFuelType, 
  onDeleteFuelType
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'types'>('logs');
  const [showCsvHelp, setShowCsvHelp] = useState(false);

  const csvHeaders = ['data', 'placa', 'motorista', 'posto', 'insumo', 'litros', 'preco_unitario', 'desconto', 'km', 'nf', 'equipe', 'unidade'];
  const csvExample = [getTodayLocalDate(), 'ABC-1234', drivers[0]?.name || 'João Silva', suppliers[0]?.name || 'Posto Central', fuelTypes[0]?.name || 'Diesel S10', '50.5', '5.89', '0', '150000', '123456', teams[0]?.number || '001', units[0]?.name || 'Central'];

  const handleDownloadCsvTemplate = () => {
    const rows = [
      csvHeaders.join(','),
      csvExample.join(','),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_combustivel.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) {
        alert("O arquivo parece estar vazio ou sem dados.");
        return;
      }

      const headerLine = lines[0];
      const separator = headerLine.includes(';') ? ';' : ',';
      const headers = headerLine.replace(/^\uFEFF/, '').split(separator).map(h => h.trim().toLowerCase());
      const rows = lines.slice(1);

      let countAdded = 0;
      let countErrors = 0;

      for (const row of rows) {
        const values = row.split(separator).map(v => v.trim());
        if (values.length < headers.length) continue;
        
        const data: Record<string, string> = {};
        headers.forEach((header, i) => {
          if (header) data[header] = values[i];
        });

        const vehicle = vehicles.find((v: Vehicle) => v.plate.toLowerCase() === (data.placa || '').toLowerCase());
        const driver = drivers.find((d: Driver) => d.name.toLowerCase() === (data.motorista || '').toLowerCase());
        const supplier = suppliers.find((s: Supplier) => s.name.toLowerCase() === (data.posto || '').toLowerCase());
        const team = teams.find((t: Team) => t.name.toLowerCase() === (data.equipe || '').toLowerCase() || t.number === (data.equipe || ''));
        const unit = units.find((u: Unit) => u.name.toLowerCase() === (data.unidade || '').toLowerCase());

        if (!vehicle || !driver) {
          console.warn("Veículo ou Motorista não encontrado:", data);
          countErrors++;
          continue;
        }

        const litersValue = parseFloat(data.litros?.replace(',', '.') || '0');
        const unitPriceValue = parseFloat(data.preco_unitario?.replace(',', '.') || '0');
        const discountValue = parseFloat(data.desconto?.replace(',', '.') || '0');
        const costValue = (litersValue * unitPriceValue) - discountValue;

        const logPayload: Omit<FuelLog, "id"> = {
          date: data.data || getTodayLocalDate(),
          vehicleId: vehicle.id,
          driverId: driver.id,
          fuelStationId: supplier?.id || '',
          fuelType: data.insumo || fuelTypes[0]?.name || 'Diesel S10',
          liters: litersValue,
          unitPrice: unitPriceValue,
          discount: discountValue,
          cost: costValue,
          km: parseInt(data.km || '0'),
          invoiceNumber: data.nf || '',
          teamId: team?.id || '',
          unitId: unit?.id || '',
          receiptPhotoUrl: '',
          pumpPhotoUrl: ''
        };

        try {
          await onAddFuelLog(logPayload);
          countAdded++;
        } catch (err) {
          console.error("Erro ao adicionar registro via CSV:", err, logPayload);
          countErrors++;
        }
      }

      alert(`Importação concluída!\nAdicionados: ${countAdded}\nErros: ${countErrors}`);
      e.target.value = '';
    };
    reader.readAsText(file);
  };


  // Helper para formatar data sem erro de fuso horário
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '---';
    const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };
  const [showLogForm, setShowLogForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  
  const initialLogFormData = {
    vehicleId: '',
    driverId: '',
    fuelStationId: '',
    fuelType: '',
    date: getTodayLocalDate(),
    liters: '',
    unitPrice: '',
    discount: '', 
    cost: '',
    km: '',
    invoiceNumber: '',
    teamId: '',
    unitId: '',
    receiptPhotoUrl: '',
    pumpPhotoUrl: ''
  };

  const initialTypeFormData = {
    name: '',
    category: 'Combustível'
  };

  const [logFormData, setLogFormData] = useState(initialLogFormData);
  const [typeFormData, setTypeFormData] = useState(initialTypeFormData);

  useEffect(() => {
    const l = parseFloat(logFormData.liters);
    const up = parseFloat(logFormData.unitPrice);
    const disc = parseFloat(logFormData.discount) || 0;
    
    if (!isNaN(l) && !isNaN(up)) {
      const total = ((l * up) - disc).toFixed(2);
      setLogFormData((prev: any) => ({ ...prev, cost: total }));
    }
  }, [logFormData.liters, logFormData.unitPrice, logFormData.discount]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'receiptPhotoUrl' | 'pumpPhotoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogFormData((prev: any) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...logFormData,
      liters: parseFloat(logFormData.liters),
      unitPrice: parseFloat(logFormData.unitPrice),
      discount: logFormData.discount ? parseFloat(logFormData.discount) : 0,
      cost: parseFloat(logFormData.cost),
      km: parseInt(logFormData.km),
    };

    if (editingLogId) onUpdateFuelLog({ id: editingLogId, ...payload } as any);
    else onAddFuelLog(payload as any);
    
    setShowLogForm(false);
    setEditingLogId(null);
    setLogFormData(initialLogFormData);
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTypeId) {
      onUpdateFuelType({ id: editingTypeId, ...typeFormData } as FuelType);
    } else {
      onAddFuelType(typeFormData);
    }
    setShowTypeForm(false);
    setEditingTypeId(null);
    setTypeFormData(initialTypeFormData);
  };

  const handleEditType = (type: FuelType) => {
    setEditingTypeId(type.id);
    setTypeFormData({ name: type.name, category: type.category });
    setShowTypeForm(true);
  };

  const enrichedLogs = useMemo((): FuelLogEnriched[] => {
    // Sort all logs by date and km descending
    const sortedLogs = [...fuelLogs].sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.km - a.km;
    });

    return sortedLogs.map((log, index) => {
      // Find the previous log for the same vehicle to calculate kmTraveled
      // "Previous" in time means the one that comes AFTER in the sorted (descending) list
      const sameVehicleLogs = sortedLogs.slice(index + 1).filter(l => l.vehicleId === log.vehicleId);
      const previousLog = sameVehicleLogs[0];

      let kmTraveled = 0;
      if (previousLog && log.km > previousLog.km) {
        kmTraveled = log.km - previousLog.km;
      }

      const kmPerLiter = kmTraveled > 0 && log.liters > 0 ? kmTraveled / log.liters : 0;
      const costPerKm = kmTraveled > 0 ? log.cost / kmTraveled : 0;

      return {
        ...log,
        kmTraveled,
        kmPerLiter,
        costPerKm
      };
    });
  }, [fuelLogs]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Gestão de Combustível</h3>
          <p className="text-sm text-gray-500 font-medium">Controle de consumo e auditoria fiscal de notas (NF-e).</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
           <button onClick={() => setActiveTab('logs')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'logs' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>Lançamentos</button>
           <button onClick={() => setActiveTab('types')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'types' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>Configurar Insumos</button>
        </div>
      </div>

      {activeTab === 'logs' ? (
        <>
          <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCsvHelp(!showCsvHelp)}
                className="flex items-center gap-2 px-4 py-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 hover:bg-amber-100 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                Formato CSV
              </button>
              
              <label className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Importar CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
              </label>

              <button onClick={() => setShowLogForm(!showLogForm)} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${showLogForm ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white shadow-lg'}`}>
                {showLogForm ? 'Cancelar' : 'Lançar Abastecimento'}
              </button>
          </div>

          {showCsvHelp && (
            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-amber-800 text-sm uppercase tracking-widest mb-1">📋 Formato do Arquivo de Combustível</h4>
                  <p className="text-xs text-amber-600 font-medium">A primeira linha deve conter os cabeçalhos. O sistema identifica veículos pela Placa e motoristas pelo Nome exato.</p>
                </div>
                <button onClick={handleDownloadCsvTemplate} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shrink-0 ml-4">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Baixar Modelo
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-amber-200">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-amber-700">
                      {csvHeaders.map(h => (
                        <th key={h} className="px-3 py-2 text-white font-black uppercase tracking-wider whitespace-nowrap text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      {csvExample.map((v, i) => (
                        <td key={i} className="px-3 py-2 text-gray-600 font-mono whitespace-nowrap border-r border-amber-100 last:border-0">{v}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {showLogForm && (
            <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-blue-50 animate-in fade-in slide-in-from-top-4 duration-300">
              <form onSubmit={handleLogSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Data *</label>
                    <input type="date" required value={logFormData.date} onChange={e => setLogFormData({...logFormData, date: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ativo (Placa) *</label>
                    <select required value={logFormData.vehicleId} onChange={e => setLogFormData({...logFormData, vehicleId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold">
                      <option value="">Selecione...</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Motorista Responsável *</label>
                    <select required value={logFormData.driverId} onChange={e => setLogFormData({...logFormData, driverId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold">
                      <option value="">Selecione o motorista...</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipo Insumo *</label>
                    <select required value={logFormData.fuelType} onChange={e => setLogFormData({...logFormData, fuelType: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold">
                      <option value="">Selecione...</option>
                      {fuelTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Equipe / Centro de Custo</label>
                    <select value={logFormData.teamId} onChange={e => setLogFormData({...logFormData, teamId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold">
                      <option value="">Selecione a equipe...</option>
                      {teams.map((t: Team) => <option key={t.id} value={t.id}>{t.name} ({t.number})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Unidade Operacional</label>
                    <select value={logFormData.unitId} onChange={e => setLogFormData({...logFormData, unitId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold">
                      <option value="">Selecione a unidade...</option>
                      {units.map((u: Unit) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Posto / Fornecedor *</label>
                    <select required value={logFormData.fuelStationId} onChange={e => setLogFormData({...logFormData, fuelStationId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-blue-700">
                      <option value="">Selecione o posto...</option>
                      {suppliers.map((s: Supplier) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Número da NF-e / Cupom</label>
                    <input type="text" placeholder="Ex: 001.234" value={logFormData.invoiceNumber} onChange={e => setLogFormData({...logFormData, invoiceNumber: e.target.value})} className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-blue-700 outline-none" />
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Litros *</label>
                    <input type="number" step="0.01" value={logFormData.liters} onChange={e => setLogFormData({...logFormData, liters: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl font-black" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Preço Unitário *</label>
                    <input type="number" step="0.001" value={logFormData.unitPrice} onChange={e => setLogFormData({...logFormData, unitPrice: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl font-black" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-orange-600 uppercase mb-1">Desconto (R$)</label>
                    <input type="number" step="0.01" value={logFormData.discount} onChange={e => setLogFormData({...logFormData, discount: e.target.value})} className="w-full p-3 bg-orange-50 border border-orange-200 rounded-xl font-black text-orange-700" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">KM Atual *</label>
                    <input type="number" value={logFormData.km} onChange={e => setLogFormData({...logFormData, km: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl font-black" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-blue-600 uppercase mb-1">Valor Total (R$)</label>
                    <input type="number" readOnly value={logFormData.cost} className="w-full p-3 bg-blue-100 border border-blue-200 rounded-xl font-black text-blue-700" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
                   {/* NF Photo */}
                   <div className="flex flex-col gap-3">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Foto da Nota Fiscal / Cupom</label>
                      <div className="flex items-center gap-6">
                         <div className="w-32 h-32 bg-gray-50 rounded-[24px] flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 group relative shadow-inner">
                            {logFormData.receiptPhotoUrl ? (
                               <div className="w-full h-full relative">
                                  <img src={logFormData.receiptPhotoUrl} className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => setLogFormData(p => ({...p, receiptPhotoUrl: ''}))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                  </button>
                               </div>
                            ) : (
                               <svg className="text-gray-200" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            )}
                         </div>
                         <div className="flex flex-col gap-3">
                            <div>
                               <input type="file" accept="image/*" capture="environment" className="hidden" id="receipt-photo" onChange={(e) => handlePhotoUpload(e, 'receiptPhotoUrl')} />
                               <label htmlFor="receipt-photo" className="flex items-center gap-2 px-5 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-blue-100 transition-all border border-blue-100">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                  Tirar Foto NF
                               </label>
                            </div>
                            <div>
                               <input type="file" accept="image/*" className="hidden" id="receipt-file" onChange={(e) => handlePhotoUpload(e, 'receiptPhotoUrl')} />
                               <label htmlFor="receipt-file" className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-700 uppercase cursor-pointer hover:bg-gray-50 transition-all">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                                  Anexar PDF/IMG
                               </label>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Pump Photo */}
                   <div className="flex flex-col gap-3">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Foto da Bomba (Auditoria)</label>
                      <div className="flex items-center gap-6">
                         <div className="w-32 h-32 bg-gray-50 rounded-[24px] flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 group relative shadow-inner">
                            {logFormData.pumpPhotoUrl ? (
                               <div className="w-full h-full relative">
                                  <img src={logFormData.pumpPhotoUrl} className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => setLogFormData(p => ({...p, pumpPhotoUrl: ''}))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                  </button>
                               </div>
                            ) : (
                               <svg className="text-gray-200" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                            )}
                         </div>
                         <div className="flex flex-col gap-3">
                            <div>
                               <input type="file" accept="image/*" capture="environment" className="hidden" id="pump-photo" onChange={(e) => handlePhotoUpload(e, 'pumpPhotoUrl')} />
                               <label htmlFor="pump-photo" className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-emerald-100 transition-all border border-emerald-100">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                  Tirar Foto Bomba
                               </label>
                            </div>
                            <div>
                               <input type="file" accept="image/*" className="hidden" id="pump-file" onChange={(e) => handlePhotoUpload(e, 'pumpPhotoUrl')} />
                               <label htmlFor="pump-file" className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-700 uppercase cursor-pointer hover:bg-gray-50 transition-all">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                                  Anexar Arquivo
                               </label>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                   <button type="submit" className="px-16 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 transition-all">Efetivar Lançamento</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1100px]">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / KM</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativo / NF-e</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operação (Condutor/Equipe)</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Insumo / Local</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Métricas / Volume</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {enrichedLogs.map(log => {
                      const vehicle = vehicles.find(v => v.id === log.vehicleId);
                      const driver = drivers.find(d => d.id === log.driverId);
                      const team = teams.find(t => t.id === log.teamId);
                      const unit = units.find(u => u.id === log.unitId);
                      
                      return (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-800">{formatDisplayDate(log.date)}</span>
                              <span className="text-[9px] text-gray-400 font-black">{log.km.toLocaleString()} KM</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex flex-col gap-1">
                               <span className="text-sm font-black text-blue-600 uppercase">{vehicle?.plate}</span>
                               {log.invoiceNumber && (
                                 <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-mono font-bold w-fit border border-emerald-100 uppercase">
                                   NF: {log.invoiceNumber}
                                 </span>
                               )}
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex flex-col">
                               <span className="text-xs font-bold text-gray-800">{driver?.name || 'Não Identificado'}</span>
                               <div className="flex gap-2 items-center mt-1">
                                  <span className="text-[9px] text-gray-400 font-black uppercase">{team?.name || 'Sem Equipe'}</span>
                                  <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                  <span className="text-[9px] text-indigo-500 font-black uppercase">{unit?.name || 'Central'}</span>
                               </div>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-1 text-center">
                               <span className="text-xs font-bold text-gray-700 uppercase">{log.fuelType}</span>
                               <span className="text-[9px] text-gray-400 font-black uppercase">{suppliers.find(s => s.id === log.fuelStationId)?.name || 'Posto Desconhecido'}</span>
                               {(log.receiptPhotoUrl || log.pumpPhotoUrl) && (
                                 <div className="flex gap-1 mt-1 justify-center">
                                    {log.receiptPhotoUrl && (
                                       <button 
                                          onClick={() => {
                                             const win = window.open();
                                             win?.document.write(`<img src="${log.receiptPhotoUrl}" style="max-width:100%">`);
                                          }}
                                          title="Ver Nota"
                                          className="w-5 h-5 bg-blue-50 text-blue-600 rounded flex items-center justify-center hover:bg-blue-100 transition-all border border-blue-100"
                                       >
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                       </button>
                                    )}
                                    {log.pumpPhotoUrl && (
                                       <button 
                                          onClick={() => {
                                             const win = window.open();
                                             win?.document.write(`<img src="${log.pumpPhotoUrl}" style="max-width:100%">`);
                                          }}
                                          title="Ver Bomba"
                                          className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center hover:bg-emerald-100 transition-all border border-emerald-100"
                                       >
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                       </button>
                                    )}
                                 </div>
                               )}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-800">{log.liters.toFixed(1)} L</span>
                                {log.kmTraveled > 0 && (
                                  <div className="flex flex-col mt-1">
                                    <span className="text-[10px] font-black text-emerald-600 italic">+{log.kmTraveled} KM Rodado</span>
                                    <div className="flex gap-2 justify-end mt-0.5">
                                      <span className="text-[9px] font-bold text-gray-400">{log.kmPerLiter.toFixed(2)} KM/L</span>
                                      <span className="text-[9px] font-bold text-gray-400">R$ {log.costPerKm.toFixed(2)}/KM</span>
                                    </div>
                                  </div>
                                )}
                             </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className="text-sm font-black text-slate-800">R$ {log.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2 text-right items-center">
                               <button 
                                 onClick={() => {
                                   if(window.confirm('Deseja realmente excluir este lançamento de combustível?')) {
                                     onDeleteFuelLog(log.id);
                                   }
                                 }} 
                                 className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100 group-hover:scale-110"
                               >
                                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                               </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="flex justify-end">
              <button 
                onClick={() => { setShowTypeForm(!showTypeForm); if(showTypeForm) setEditingTypeId(null); }} 
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${showTypeForm ? 'bg-gray-200 text-gray-700' : 'bg-slate-900 text-white shadow-lg'}`}
              >
                {showTypeForm ? 'Cancelar' : 'Cadastrar Novo Insumo'}
              </button>
           </div>

           {showTypeForm && (
             <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 animate-in slide-in-from-top-4">
                <form onSubmit={handleTypeSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                   <div className="flex-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome do Insumo *</label>
                      <input 
                        type="text" 
                        required 
                        value={typeFormData.name} 
                        onChange={e => setTypeFormData({...typeFormData, name: e.target.value})} 
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Ex: Diesel S10, Arla 32, Gasolina Comum..."
                      />
                   </div>
                   <div className="w-full md:w-64">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Categoria *</label>
                      <select 
                        value={typeFormData.category} 
                        onChange={e => setTypeFormData({...typeFormData, category: e.target.value})} 
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black outline-none focus:ring-2 focus:ring-blue-500"
                      >
                         <option value="Combustível">Combustível</option>
                         <option value="Aditivo">Aditivo</option>
                         <option value="Lubrificante">Lubrificante</option>
                         <option value="Outros">Outros</option>
                      </select>
                   </div>
                   <button type="submit" className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                      {editingTypeId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                   </button>
                </form>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fuelTypes.map(type => (
                <div key={type.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                   <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                        type.category === 'Combustível' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        type.category === 'Aditivo' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {type.category}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEditType(type)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                         </button>
                         <button onClick={() => onDeleteFuelType(type.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
                         </button>
                      </div>
                   </div>
                   <h4 className="text-lg font-black text-gray-800 mb-1">{type.name}</h4>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Insumo Operacional</p>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default FuelManagement;
