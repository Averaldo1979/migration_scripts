
import React, { useState, useRef, useMemo } from 'react';
import { Vehicle, VehicleStatus, Unit, VehicleDocument, UserRole } from '../types';

interface FleetProps {
  vehicles: Vehicle[];
  units: Unit[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  currentUserRole?: UserRole;
}

const FleetManagement: React.FC<FleetProps> = ({ vehicles, units, onAddVehicle, onUpdateVehicle, onDeleteVehicle, currentUserRole }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [plateSearch, setPlateSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | VehicleStatus>('Todos');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const canModify = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.MANAGER;

  const initialFormData: Omit<Vehicle, 'id'> = {
    plate: '', model: '', brand: '', year: new Date().getFullYear(),
    modelYear: new Date().getFullYear(), exerciseYear: new Date().getFullYear().toString(),
    vehicleType: '', ownerName: '', capacity: 5, km: 0, nextMaintenanceKm: 10000,
    unitId: '', status: VehicleStatus.AVAILABLE, photoUrl: '', documents: []
  };

  const [formData, setFormData] = useState<Omit<Vehicle, 'id'>>(initialFormData);
  const [newDoc, setNewDoc] = useState<Omit<VehicleDocument, 'id'>>({ name: '', expiryDate: '', status: 'Ativo', fileUrl: '' });

  // ── Filtros ──────────────────────────────────────
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const q = plateSearch.toLowerCase();
      const matchesSearch = !q ||
        v.plate.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'Todos' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, plateSearch, statusFilter]);

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.AVAILABLE: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case VehicleStatus.IN_USE: return 'bg-blue-100 text-blue-700 border-blue-200';
      case VehicleStatus.MAINTENANCE: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    const { id, ...data } = vehicle;
    setEditingId(id);
    setFormData(data);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
    setNewDoc({ name: '', expiryDate: '', status: 'Ativo', fileUrl: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate || !formData.model || !formData.brand) {
      alert('Por favor, preencha os campos obrigatórios (Placa, Modelo e Marca).');
      return;
    }
    const vehicleData = {
      ...formData,
      km: Number(formData.km), year: Number(formData.year),
      modelYear: Number(formData.modelYear), capacity: Number(formData.capacity),
      nextMaintenanceKm: Number(formData.nextMaintenanceKm)
    };
    if (editingId) onUpdateVehicle({ id: editingId, ...vehicleData } as Vehicle);
    else onAddVehicle(vehicleData);
    handleCancel();
  };

  const addDocument = () => {
    if (!newDoc.name || !newDoc.expiryDate) { alert('Nome e data de validade são obrigatórios.'); return; }
    const docWithId: VehicleDocument = { ...newDoc, id: Math.random().toString(36).substr(2, 9) };
    setFormData({ ...formData, documents: [...formData.documents, docWithId] });
    setNewDoc({ name: '', expiryDate: '', status: 'Ativo', fileUrl: '' });
  };

  const toggleDocStatus = (docId: string) => {
    setFormData({ ...formData, documents: formData.documents.map(d => d.id === docId ? { ...d, status: d.status === 'Ativo' ? 'Inativo' : 'Ativo' } : d) });
  };

  const removeDocument = (docId: string) => {
    setFormData({ ...formData, documents: formData.documents.filter(d => d.id !== docId) });
  };

  // ── Componente de upload/foto do documento ───────
  const DocFileUploadButton = ({ currentFile }: { currentFile?: string }) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setNewDoc(prev => ({ ...prev, fileUrl: reader.result as string }));
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Anexo / Foto</label>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileRef} className="hidden" accept=".pdf,image/*" onChange={handleFile} />
          <input type="file" ref={cameraRef} className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className={`flex-1 px-3 py-2 text-[9px] font-black rounded-xl border transition-all flex items-center justify-center gap-1 ${currentFile ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-gray-400 border-gray-200 hover:border-blue-400 hover:text-blue-500'}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
            {currentFile ? '✓ Anexado' : 'Upload'}
          </button>
          <button type="button" onClick={() => cameraRef.current?.click()}
            className="px-3 py-2 text-[9px] font-black rounded-xl border bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
            Câmera
          </button>
        </div>
        {currentFile && currentFile.startsWith('data:image') && (
          <img src={currentFile} alt="Preview" className="mt-1 h-16 w-full object-cover rounded-xl border border-gray-100" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Gestão de Veículos</h3>
          <p className="text-gray-500 text-sm">Gestão completa dos ativos da frota. {filteredVehicles.length} de {vehicles.length} veículo(s)</p>
        </div>
        {canModify && (
          <button onClick={() => showForm ? handleCancel() : setShowForm(true)}
            className={`px-5 py-3 rounded-2xl transition shadow-md flex items-center gap-2 font-black text-[11px] uppercase tracking-widest whitespace-nowrap ${showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-cca-primary text-white hover:bg-cca-accent'}`}>
            {showForm ? 'Cancelar' : '+ Novo Veículo'}
          </button>
        )}
      </div>

      {/* ── Barra de filtros ─────────────────────── */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-cca-primary shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text" placeholder="Filtrar por placa, modelo ou marca..."
            value={plateSearch} onChange={e => setPlateSearch(e.target.value)}
            className="w-full bg-transparent font-bold text-sm outline-none text-gray-700 placeholder:text-gray-300"
          />
          {plateSearch && (
            <button onClick={() => setPlateSearch('')} className="text-gray-300 hover:text-red-400 shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-2xl px-2 py-2 shadow-sm flex-wrap">
          {(['Todos', ...Object.values(VehicleStatus)] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s as any)}
              className={`px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === s ? 'bg-cca-primary text-white shadow' : 'text-gray-400 hover:bg-gray-50'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Formulário ───────────────────────────── */}
      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-xl border border-blue-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <h4 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>
            </div>
            {editingId ? `Editando: ${formData.plate}` : 'Cadastro de Veículo e Documentação'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Foto */}
              <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
                <div onClick={() => photoInputRef.current?.click()}
                  className="w-full lg:w-44 h-44 bg-gray-50 border-4 border-dashed border-gray-100 rounded-[28px] flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-all group relative">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-300 group-hover:text-blue-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                      <span className="text-[10px] font-black mt-2 uppercase tracking-widest">Foto do Ativo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-[24px]">
                    <span className="text-white text-xs font-black uppercase">Alterar Foto</span>
                  </div>
                </div>
                <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                {/* Botão câmera (mobile) */}
                <button type="button" onClick={() => {
                  const inp = document.createElement('input');
                  inp.type = 'file'; inp.accept = 'image/*'; inp.setAttribute('capture', 'environment');
                  inp.onchange = (ev) => {
                    const file = (ev.target as HTMLInputElement).files?.[0];
                    if (file) { const r = new FileReader(); r.onloadend = () => setFormData(p => ({ ...p, photoUrl: r.result as string })); r.readAsDataURL(file); }
                  };
                  inp.click();
                }} className="lg:hidden w-full py-2.5 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                  Usar Câmera
                </button>
              </div>

              <div className="flex-1 space-y-6 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 lg:col-span-3 border-b border-gray-50 pb-2">
                    <h5 className="text-[10px] font-black text-cca-primary uppercase tracking-widest">Ficha Técnica e Operacional</h5>
                  </div>
                  {[
                    { label: 'Placa *', field: 'plate', type: 'text', placeholder: 'ABC-1234', extra: 'uppercase font-mono' },
                    { label: 'Marca *', field: 'brand', type: 'text', placeholder: 'Scania, VW, Volvo' },
                    { label: 'Modelo *', field: 'model', type: 'text', placeholder: 'R450, Constellation' },
                    { label: 'Ano Fabricação', field: 'year', type: 'number' },
                    { label: 'Ano Modelo', field: 'modelYear', type: 'number' },
                    { label: 'Ano Exercício', field: 'exerciseYear', type: 'text', placeholder: '2024' },
                    { label: 'Espécie / Tipo', field: 'vehicleType', type: 'text', placeholder: 'Carga/Caminhão' },
                    { label: 'Nome Proprietário', field: 'ownerName', type: 'text', placeholder: 'Razão Social' },
                    { label: 'KM Atual', field: 'km', type: 'number' },
                  ].map(({ label, field, type, placeholder, extra }) => (
                    <div key={field}>
                      <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">{label}</label>
                      <input type={type} placeholder={placeholder} value={(formData as any)[field]}
                        onChange={e => setFormData({ ...formData, [field]: type === 'number' ? Number(e.target.value) : e.target.value })}
                        className={`w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-800 ${extra || ''}`} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Unidade Operacional</label>
                    <select value={formData.unitId} onChange={e => setFormData({ ...formData, unitId: e.target.value })}
                      className="w-full p-4 bg-indigo-50 border border-indigo-100 rounded-2xl outline-none font-bold text-indigo-700">
                      <option value="">Selecione...</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Status</label>
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black">
                      {Object.values(VehicleStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Gestão Documental ─── */}
            <div className="pt-6 border-t border-gray-50">
              <h5 className="text-sm font-black text-gray-800 mb-6 uppercase tracking-widest">Gestão Documental e Vencimentos Técnicos</h5>
              <div className="bg-gray-50/50 p-5 md:p-8 rounded-[28px] border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Tipo de Documento</label>
                    <input type="text" placeholder="Licenciamento, CRLV, Tacógrafo..." value={newDoc.name}
                      onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
                      className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Data de Vencimento</label>
                    <input type="date" value={newDoc.expiryDate} onChange={e => setNewDoc({ ...newDoc, expiryDate: e.target.value })}
                      className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-sm" />
                  </div>
                  <div>
                    <DocFileUploadButton currentFile={newDoc.fileUrl} />
                  </div>
                  <div>
                    <button type="button" onClick={addDocument}
                      className="w-full py-4 bg-cca-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cca-accent transition shadow-xl flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      Lançar Documento
                    </button>
                  </div>
                </div>

                {formData.documents.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {formData.documents.map(doc => {
                      const isExpired = new Date(doc.expiryDate).getTime() < new Date().getTime();
                      const isExpiring = !isExpired && new Date(doc.expiryDate).getTime() < new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
                      return (
                        <div key={doc.id} className={`p-4 rounded-[20px] border flex flex-col gap-2 group ${doc.status === 'Inativo' ? 'bg-gray-100 border-gray-200 opacity-60' : isExpired ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="text-[11px] font-black text-slate-800 uppercase">{doc.name}</span>
                              <p className={`text-[10px] font-bold mt-0.5 ${isExpired ? 'text-red-600' : isExpiring ? 'text-orange-500' : 'text-gray-400'}`}>
                                Vence: {new Date(doc.expiryDate).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button type="button" onClick={() => toggleDocStatus(doc.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>
                              </button>
                              <button type="button" onClick={() => removeDocument(doc.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                              </button>
                            </div>
                          </div>
                          {/* Preview da foto do documento */}
                          {doc.fileUrl && doc.fileUrl.startsWith('data:image') && (
                            <img src={doc.fileUrl} alt={doc.name} className="w-full h-20 object-cover rounded-xl border border-gray-100" />
                          )}
                          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${doc.status === 'Inativo' ? 'bg-gray-200 text-gray-500' : isExpired ? 'bg-red-500 text-white' : isExpiring ? 'bg-orange-400 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                              {doc.status === 'Inativo' ? 'Inativo' : isExpired ? 'Vencido' : isExpiring ? 'A vencer' : 'Ativo'}
                            </span>
                            {doc.fileUrl && <span className="text-[8px] font-black text-blue-500 uppercase">{doc.fileUrl.startsWith('data:image') ? '📷 Foto' : 'PDF ✓'}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-50">
              <button type="submit"
                className="w-full sm:w-auto px-10 py-5 bg-cca-primary text-white rounded-[20px] font-black text-sm uppercase tracking-widest hover:bg-cca-accent transition shadow-2xl shadow-cca-primary/20">
                {editingId ? 'Confirmar Atualização' : 'Efetivar Cadastro de Ativo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── LISTAGEM DESKTOP (tabela) ─────────────── */}
      <div className="hidden md:block bg-white rounded-[28px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Veículo</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidade / Marca</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Docs</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVehicles.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhum veículo encontrado com os filtros aplicados.</td></tr>
              ) : filteredVehicles.map(v => (
                <tr key={v.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                        {v.photoUrl ? <img src={v.photoUrl} alt={v.model} className="w-full h-full object-cover" /> : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-black text-gray-900">{v.model}</span>
                        <span className="block text-[10px] text-cca-primary font-black uppercase tracking-widest mt-0.5">{v.plate}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-indigo-600 uppercase block">{units.find(u => u.id === v.unitId)?.name || 'Central'}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">{v.brand} {v.year}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(v.status as VehicleStatus)}`}>{v.status}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black">
                      {v.documents?.filter(d => d.status === 'Ativo').length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canModify ? (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(v)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                        </button>
                        <button onClick={() => onDeleteVehicle(v.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </button>
                      </div>
                    ) : <span className="text-[10px] text-gray-300 font-bold uppercase italic">Apenas Leitura</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── LISTAGEM MOBILE (cartões) ─────────────── */}
      <div className="md:hidden space-y-3">
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[24px] border border-gray-100">
            <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhum veículo encontrado</p>
          </div>
        ) : filteredVehicles.map(v => (
          <div key={v.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 p-4 border-b border-gray-50">
              {/* Foto */}
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                {v.photoUrl ? <img src={v.photoUrl} alt={v.model} className="w-full h-full object-cover" /> : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-gray-900 truncate">{v.model}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border shrink-0 ${getStatusColor(v.status as VehicleStatus)}`}>{v.status}</span>
                </div>
                <span className="text-sm font-black text-cca-primary tracking-widest uppercase font-mono">{v.plate}</span>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{v.brand} {v.year} • {units.find(u => u.id === v.unitId)?.name || 'Central'}</p>
              </div>
            </div>
            {/* Rodapé do cartão */}
            <div className="px-4 py-3 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-500">{v.km?.toLocaleString('pt-BR')} km</span>
                <span className="text-[10px] font-bold text-gray-400">•</span>
                <span className="text-[10px] font-black text-slate-600">{v.documents?.filter(d => d.status === 'Ativo').length || 0} doc(s)</span>
              </div>
              {canModify && (
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(v)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                    Editar
                  </button>
                  <button onClick={() => onDeleteVehicle(v.id)}
                    className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FleetManagement;
