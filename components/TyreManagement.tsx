
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tyre, TyreAudit, TyreMovement, TyreStatus, TyrePosition, Vehicle, TyreBrand, TyreModel, TyreRepair, Supplier } from '../types';
import { getTodayLocalDate, formatSafeDate, getLocalNowISO } from '../services/dateUtils';

interface TyreManagementProps {
  tyres: Tyre[];
  tyreAudits: TyreAudit[];
  tyreMovements: TyreMovement[];
  vehicles: Vehicle[];
  onAddTyre: (tyre: Omit<Tyre, 'id'>) => void;
  onUpdateTyre: (tyre: Tyre) => void;
  onDeleteTyre: (id: string) => void;
  onAddAudit: (audit: Omit<TyreAudit, 'id'>) => void;
  onMoveTyre: (movement: Omit<TyreMovement, 'id'>) => void;
  onDeleteMovement?: (id: string) => void;
  tyreBrands: TyreBrand[];
  tyreModels: TyreModel[];
  onAddTyreBrand: (brand: Omit<TyreBrand, 'id'>) => void;
  onUpdateTyreBrand: (brand: TyreBrand) => void;
  onDeleteTyreBrand: (id: string) => void;
  onAddTyreModel: (model: Omit<TyreModel, 'id'>) => void;
  onUpdateTyreModel: (model: TyreModel) => void;
  onDeleteTyreModel: (id: string) => void;
  tyreRepairs: TyreRepair[];
  suppliers: Supplier[];
  onAddTyreRepair: (repair: Omit<TyreRepair, 'id'>) => void;
  onUpdateTyreRepair: (repair: TyreRepair) => void;
  onDeleteTyreRepair: (id: string) => void;
  onUpdateMovement?: (movement: TyreMovement) => void;
}

const TyreManagement: React.FC<TyreManagementProps> = ({
  tyres,
  tyreAudits,
  tyreMovements,
  vehicles,
  onAddTyre,
  onUpdateTyre,
  onDeleteTyre,
  onAddAudit,
  onMoveTyre,
  onUpdateMovement,
  onDeleteMovement,
  tyreBrands,
  tyreModels,
  onAddTyreBrand,
  onUpdateTyreBrand,
  onDeleteTyreBrand,
  onAddTyreModel,
  onUpdateTyreModel,
  onDeleteTyreModel,
  tyreRepairs,
  suppliers,
  onAddTyreRepair,
  onUpdateTyreRepair,
  onDeleteTyreRepair
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'audit' | 'movements' | 'repairs' | 'settings'>('inventory');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMovement, setEditingMovement] = useState<TyreMovement | null>(null);
  const [showMoveModal, setShowMoveModal] = useState<string | null>(null);
  const [showDisposalModal, setShowDisposalModal] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper para formatar data sem erro de fuso horário
  const formatDisplayDateLocal = (dateStr: string) => {
    return formatSafeDate(dateStr);
  };

  // ── Filtros ──
  const [invSearch, setInvSearch] = useState('');
  const [invStatus, setInvStatus] = useState<'all' | 'Estoque' | 'Operação'>('all');
  const [movSearch, setMovSearch] = useState('');
  const [movType, setMovType] = useState<'Todos' | 'Montagem' | 'Desmontagem' | 'Saída'>('Todos');
  const [auditSearch, setAuditSearch] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [totalValue, setTotalValue] = useState(0);

  const initialFormState: Omit<Tyre, 'id'> = {
    serialNumber: '',
    brand: '',
    model: '',
    size: '',
    type: 'Novo',
    status: TyreStatus.STOCK,
    initialThreadDepth: 16,
    currentThreadDepth: 16,
    purchaseDate: getTodayLocalDate(),
    supplier: '',
    invoiceNumber: '',
    unitValue: 0,
    photoUrl: '',
    vehicleId: '',
    position: undefined,
    kmAtMount: undefined
  };

  const [formData, setFormData] = useState<Omit<Tyre, 'id'>>(initialFormState);

  const [moveFormData, setMoveFormData] = useState({
    vehicleId: '',
    position: TyrePosition.FL,
    km: 0,
    observations: ''
  });

  const [disposalFormData, setDisposalFormData] = useState({
    tyreId: '',
    date: getTodayLocalDate(),
    reason: 'Fim de Vida Útil',
    observations: ''
  });

  const [auditFormData, setAuditFormData] = useState({
    tyreId: '',
    date: getTodayLocalDate(),
    depth: 0,
    km: 0,
    inspector: ''
  });

  const [brandFormData, setBrandFormData] = useState({ name: '' });
  const [modelFormData, setModelFormData] = useState({ brandId: '', name: '' });
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  const [repairFormData, setRepairFormData] = useState<Omit<TyreRepair, 'id'>>({
    date: getTodayLocalDate(),
    vehicleId: '',
    partnerId: '',
    quantity: 1,
    unitValue: 0,
    description: '',
    observations: ''
  });
  const [editingRepairId, setEditingRepairId] = useState<string | null>(null);
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [repairFilter, setRepairFilter] = useState('');
  const [repairBatch, setRepairBatch] = useState<Omit<TyreRepair, 'id'>[]>([]);

  // Cálculo do total em tempo real para entradas
  useEffect(() => {
    setTotalValue(quantity * (formData.unitValue || 0));
  }, [quantity, formData.unitValue]);

  // ── Filtros computados ──
  const filteredInventory = useMemo(() => {
    return tyres.filter(t => {
      const matchesSearch = !invSearch ||
        t.brand.toLowerCase().includes(invSearch.toLowerCase()) ||
        t.model.toLowerCase().includes(invSearch.toLowerCase()) ||
        t.size.toLowerCase().includes(invSearch.toLowerCase()) ||
        t.serialNumber.toLowerCase().includes(invSearch.toLowerCase()) ||
        (t.supplier || '').toLowerCase().includes(invSearch.toLowerCase());
      const matchesStatus = invStatus === 'all' ||
        (invStatus === 'Estoque' && t.status === TyreStatus.STOCK) ||
        (invStatus === 'Operação' && t.status === TyreStatus.MOUNTED);
      return matchesSearch && matchesStatus && t.status !== TyreStatus.SCRAP;
    });
  }, [tyres, invSearch, invStatus]);

  const filteredMovements = useMemo(() => {
    return tyreMovements.filter(m => {
      const tyre = tyres.find(t => t.id === m.tyreId);
      const vehicle = vehicles.find(v => v.id === m.vehicleId);
      const searchStr = `${tyre?.brand} ${tyre?.model} ${tyre?.serialNumber} ${vehicle?.plate} ${m.observations}`.toLowerCase();
      const matchesSearch = !movSearch || searchStr.includes(movSearch.toLowerCase());
      const matchesType = movType === 'Todos' || m.type === movType;
      return matchesSearch && matchesType;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tyreMovements, tyres, vehicles, movSearch, movType]);

  const filteredAudits = useMemo(() => {
    return tyreAudits.filter(a => {
      const tyre = tyres.find(t => t.id === a.tyreId);
      const searchStr = `${tyre?.brand} ${tyre?.model} ${tyre?.serialNumber} ${a.inspector}`.toLowerCase();
      return !auditSearch || searchStr.includes(auditSearch.toLowerCase());
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tyreAudits, tyres, auditSearch]);

  // ── Saldos consolidados ──
  const inventorySummary = useMemo(() => {
    const summary: Record<string, {
      brand: string,
      model: string,
      size: string,
      entries: number, // Total Adquirido (Entradas no Lote)
      stock: number,   // Disponível em Almoxarifado
      mounted: number, // Rodando na Frota
      scrap: number,   // Descartado (Saída Definitiva)
      balance: number, // Saldo Patrimonial Ativo (Estoque + Operação)
      totalInvestment: number,
      avgPrice: number
    }> = {};

    tyres.forEach(t => {
      const key = `${t.brand}-${t.model}-${t.size}`;
      if (!summary[key]) {
        summary[key] = { brand: t.brand, model: t.model, size: t.size, entries: 0, stock: 0, mounted: 0, scrap: 0, balance: 0, totalInvestment: 0, avgPrice: 0 };
      }

      summary[key].entries++;
      if (t.status === TyreStatus.STOCK) {
        summary[key].stock++;
        summary[key].balance++;
      }
      if (t.status === TyreStatus.MOUNTED) {
        summary[key].mounted++;
        summary[key].balance++;
      }
      if (t.status === TyreStatus.SCRAP) summary[key].scrap++;

      summary[key].totalInvestment += (t.unitValue || 0);
    });

    Object.keys(summary).forEach(key => {
      const item = summary[key];
      item.avgPrice = item.entries > 0 ? item.totalInvestment / item.entries : 0;
    });

    return Object.values(summary);
  }, [tyres]);

  const handleVehicleChangeInMove = (vId: string) => {
    const vehicle = vehicles.find(v => v.id === vId);
    setMoveFormData(prev => ({
      ...prev,
      vehicleId: vId,
      km: vehicle ? vehicle.km : 0
    }));
  };

  const startScanner = async (targetField: 'entry' | 'move') => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;

      setTimeout(() => {
        const mockCode = "SN-" + Math.floor(1000 + Math.random() * 9000);
        if (targetField === 'entry') setFormData(prev => ({ ...prev, serialNumber: mockCode }));
        else {
          const found = tyres.find(t => t.serialNumber === mockCode);
          if (found) setShowMoveModal(found.id);
          else alert("Código lido: " + mockCode + ". Pneu não encontrado.");
        }
        stopScanner();
      }, 2000);
    } catch (err) {
      alert("Câmera não disponível.");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    setIsScanning(false);
  };

  const handleEdit = (tyre: Tyre) => {
    const { id, ...data } = tyre;
    setEditingId(id);
    setFormData(data);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormState);
    setQuantity(1);
  };

  const handleTyreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateTyre({ id: editingId, ...formData } as Tyre);
    } else {
      const currentBatchId = `LOT-${Date.now()}`;
      for (let i = 0; i < quantity; i++) {
        const currentSerial = quantity > 1 ? `${formData.serialNumber}-${String(i + 1).padStart(3, '0')}` : formData.serialNumber;
        onAddTyre({
          ...formData,
          serialNumber: currentSerial,
          batchId: currentBatchId
        });
      }
    }
    handleCancelForm();
  };

  const handleMoveTyreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tyre = tyres.find(t => t.id === showMoveModal);
    if (!tyre) return;
    const isMounting = tyre.status === TyreStatus.STOCK;
    onMoveTyre({
      tyreId: tyre.id,
      vehicleId: isMounting ? moveFormData.vehicleId : tyre.vehicleId,
      date: getTodayLocalDate(),
      type: isMounting ? 'Montagem' : 'Desmontagem',
      km: moveFormData.km,
      position: isMounting ? moveFormData.position : tyre.position,
      observations: moveFormData.observations
    });
    setShowMoveModal(null);
    setMoveFormData({ vehicleId: '', position: TyrePosition.FL, km: 0, observations: '' });
  };

  const handleDisposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = disposalFormData.tyreId || showDisposalModal;
    const tyre = tyres.find(t => t.id === targetId);
    if (!tyre) return;

    onMoveTyre({
      tyreId: tyre.id,
      date: disposalFormData.date,
      type: 'Saída',
      km: 0,
      observations: `${disposalFormData.reason}: ${disposalFormData.observations}`
    });

    setShowDisposalModal(null);
    setDisposalFormData({ tyreId: '', date: getTodayLocalDate(), reason: 'Fim de Vida Útil', observations: '' });
  };

  const handleUpdateMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMovement && onUpdateMovement) {
      onUpdateMovement(editingMovement);
      setEditingMovement(null);
    }
  };

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAudit(auditFormData);
    // Update tyre depth locally or rely on parent refetch ideally 
    // Ideally the onAddAudit parent handler should also update the tyre's current depth
    // But here we can just reset form
    setAuditFormData({
      tyreId: '',
      date: getTodayLocalDate(),
      depth: 0,
      km: 0,
      inspector: ''
    });
  };

  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBrandId) {
      onUpdateTyreBrand({ id: editingBrandId, name: brandFormData.name });
    } else {
      onAddTyreBrand({ name: brandFormData.name });
    }
    setBrandFormData({ name: '' });
    setEditingBrandId(null);
  };

  const handleModelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingModelId) {
      onUpdateTyreModel({ id: editingModelId, ...modelFormData });
    } else {
      onAddTyreModel(modelFormData);
    }
    setModelFormData({ brandId: '', name: '' });
    setEditingModelId(null);
  };

  const handleAddToBatch = () => {
    if (!repairFormData.vehicleId || !repairFormData.partnerId || !repairFormData.description) {
      alert("Preencha os campos obrigatórios (Veículo, Fornecedor e Serviço).");
      return;
    }
    setRepairBatch([...repairBatch, { ...repairFormData }]);
    // Mantém veículo e fornecedor, limpa apenas serviço
    setRepairFormData(prev => ({
      ...prev,
      quantity: 1,
      description: '',
      observations: ''
    }));
  };

  const handleRemoveFromBatch = (index: number) => {
    setRepairBatch(prev => prev.filter((_, i) => i !== index));
  };

  const handleRepairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRepairId) {
      onUpdateTyreRepair({ id: editingRepairId, ...repairFormData } as TyreRepair);
    } else {
      // Se tiver lote, lança todos. Se estiver vazio mas o form atual tiver dados, lança o atual.
      if (repairBatch.length > 0) {
        // Lança os itens do lote sequencialmente para evitar conflitos de estado
        for (const item of repairBatch) {
          await onAddTyreRepair(item);
        }
        
        // Também verifica se o item que ESTÁ no form (não adicionado ao lote ainda) deve ser lançado
        if (repairFormData.description) {
          await onAddTyreRepair(repairFormData);
        }
      } else {
        if (!repairFormData.description) {
          alert("Adicione pelo menos um serviço ou preencha os dados do serviço atual.");
          return;
        }
        await onAddTyreRepair(repairFormData);
      }
    }

    setRepairFormData({
      date: getTodayLocalDate(),
      vehicleId: '',
      partnerId: '',
      quantity: 1,
      unitValue: 0,
      description: '',
      observations: ''
    });
    setRepairBatch([]);
    setEditingRepairId(null);
    setShowRepairForm(false);
  };

  const repairTypes = ['Conserto', 'Montagem', 'Câmara', 'Protetor', 'Troca', 'Bico e Plaqueta', 'Tip Top', 'Balanceamento', 'Outros'];

  const filteredRepairs = useMemo(() => {
    return tyreRepairs.filter(r => {
      const vehicle = vehicles.find(v => v.id === r.vehicleId);
      const partner = suppliers.find(s => s.id === r.partnerId);
      const searchStr = `${vehicle?.plate} ${partner?.name} ${r.description} ${r.observations}`.toLowerCase();
      return !repairFilter || searchStr.includes(repairFilter.toLowerCase());
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tyreRepairs, vehicles, suppliers, repairFilter]);

  const totals = useMemo(() => {
    return {
      inStock: tyres.filter(t => t.status === TyreStatus.STOCK).length,
      mounted: tyres.filter(t => t.status === TyreStatus.MOUNTED).length,
      scrap: tyres.filter(t => t.status === TyreStatus.SCRAP).length,
      totalActive: tyres.filter(t => t.status !== TyreStatus.SCRAP).length,
      totalValue: tyres.filter(t => t.status !== TyreStatus.SCRAP).reduce((acc, t) => acc + (t.unitValue || 0), 0),
      stockValue: tyres.filter(t => t.status === TyreStatus.STOCK).reduce((acc, t) => acc + (t.unitValue || 0), 0)
    };
  }, [tyres]);

  return (
    <div className="space-y-6">
      {isScanning && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-4 border-blue-50 rounded-3xl relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-500 animate-bounce" />
            </div>
            <p className="text-white font-black mt-8 text-xl uppercase tracking-widest">Scanner Ativo</p>
          </div>
          <button onClick={stopScanner} className="absolute bottom-10 px-8 py-3 bg-red-600 text-white rounded-full font-bold z-[101]">Cancelar</button>
        </div>
      )}

      <div className="flex border-b border-gray-200 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-full sm:w-fit">
        {[
          { id: 'inventory', label: 'Inventário Geral' },
          { id: 'movements', label: 'Fluxos & Saldos' },
          { id: 'repairs', label: 'Consertos & Serviços' },
          { id: 'audit', label: 'Auditoria Técnica' },
          { id: 'settings', label: 'Configurações' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">
            {activeSubTab === 'inventory' ? 'Pneus Disponíveis em Estoque' : activeSubTab === 'movements' ? 'Painel de Fluxo e Saldos' : activeSubTab === 'audit' ? 'Auditoria Técnica' : 'Configurações de Marcas e Modelos'}
          </h3>
          <p className="text-sm text-gray-500 font-medium tracking-tight">
            {activeSubTab === 'inventory'
              ? `${totals.inStock} pneus disponíveis para instalação • ${totals.mounted} em operação na frota`
              : `Contabilização Total: ${totals.totalActive} ativos registrados no patrimônio operacional.`}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {activeSubTab === 'movements' && (
            <button
              onClick={() => setShowDisposalModal('select')}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 shadow-sm"
            >
              Lançar Baixa (Saída)
            </button>
          )}
          <button
            onClick={() => showForm ? handleCancelForm() : setShowForm(true)}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl shadow-lg transition-all font-black text-[10px] uppercase tracking-widest ${showForm ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            {showForm ? 'Cancelar' : 'Nova Entrada (Lote)'}
          </button>
        </div>
      </div>

      {/* Cartões de KPI Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Valor em Estoque</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-gray-400 uppercase mb-1">Patrimônio Disponível</p>
            <p className="text-4xl font-black text-gray-800 tracking-tight">R$ {totals.stockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Pneus em Estoque</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-gray-400 uppercase mb-1">Quantidade Física</p>
            <p className="text-4xl font-black text-gray-800 tracking-tight">{totals.inStock} <span className="text-xl text-gray-300 font-bold">UN</span></p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Valor em Operação</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-gray-400 uppercase mb-1">Patrimônio Rodando</p>
            <p className="text-4xl font-black text-gray-800 tracking-tight">R$ {(totals.totalValue - totals.stockValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[32px] shadow-xl flex flex-col justify-between group transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Patrimônio Total Ativo</span>
            <div className="p-2 bg-white/10 rounded-xl text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-white/40 uppercase mb-1">Consolidação (Estoque + Frota)</p>
            <p className="text-4xl font-black text-white tracking-tight">R$ {totals.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-blue-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleTyreSubmit} className="space-y-8">
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M7 7h10M7 12h10M7 17h10" /></svg>
                  Lançamento de Entrada por Lote (Contabilização Unitária)
                </h4>
                {!editingId && (
                  <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-blue-100 shadow-sm">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Qtd. Itens no Lote:</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black hover:bg-gray-200">-</button>
                      <input type="number" min="1" max="100" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="w-12 p-1 bg-white border border-gray-100 rounded text-sm font-black text-center outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={() => setQuantity(Math.min(100, quantity + 1))} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black hover:bg-gray-200">+</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-1.5 ml-1">Prefixo de Série / Código *</label>
                  <div className="relative">
                    <input type="text" placeholder="Ex: MIC-2025" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} className="w-full p-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 font-mono pr-12 text-sm font-bold shadow-sm" required />
                    <button type="button" onClick={() => startScanner('entry')} className="absolute right-2 top-2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /></svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-blue-600 uppercase mb-1.5 ml-1">Número NF-e *</label>
                  <input type="text" value={formData.invoiceNumber} onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })} className="w-full p-4 bg-white border-2 border-blue-100 rounded-2xl font-black text-xl text-blue-600 shadow-sm" placeholder="000.000" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-1.5 ml-1">Data Compra</label>
                  <input type="date" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} className="w-full p-3.5 bg-white border border-gray-200 rounded-2xl font-bold text-sm shadow-sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Marca *</label>
                <select 
                  value={formData.brand} 
                  onChange={e => {
                    const selectedBrand = tyreBrands.find(b => b.name === e.target.value);
                    setFormData({ ...formData, brand: e.target.value, model: '' });
                  }} 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" 
                  required
                >
                  <option value="">Selecione a Marca</option>
                  {tyreBrands.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Modelo *</label>
                <select 
                  value={formData.model} 
                  onChange={e => setFormData({ ...formData, model: e.target.value })} 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" 
                  required
                  disabled={!formData.brand}
                >
                  <option value="">Selecione o Modelo</option>
                  {tyreModels
                    .filter(m => {
                      const brand = tyreBrands.find(b => b.id === m.brandId);
                      return brand && brand.name === formData.brand;
                    })
                    .map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Preço Unitário (R$) *</label>
                <input type="number" step="0.01" value={formData.unitValue} onChange={e => setFormData({ ...formData, unitValue: parseFloat(e.target.value) || 0 })} className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-lg text-blue-700 outline-none" required />
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl flex flex-col justify-center text-center shadow-xl">
                <label className="block text-[8px] font-black text-blue-400 uppercase mb-1">Total do Lote Financeiro</label>
                <p className="text-white text-xl font-black">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Medida *</label>
                <input type="text" placeholder="295/80 R22.5" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Estado</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm text-blue-600">
                  <option value="Novo">Pneu Novo</option>
                  <option value="Recapado">Recapado</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Sulco Original (mm)</label>
                <input type="number" step="0.5" value={formData.initialThreadDepth} onChange={e => setFormData({ ...formData, initialThreadDepth: parseFloat(e.target.value) || 0, currentThreadDepth: parseFloat(e.target.value) || 0 })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Fornecedor / Loja</label>
                <input type="text" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
              <button type="button" onClick={handleCancelForm} className="px-8 py-4 font-black text-gray-400 uppercase text-[10px] tracking-widest hover:text-gray-600 transition-colors">Voltar</button>
              <button type="submit" className="px-16 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all text-[10px] uppercase tracking-widest">
                {editingId ? 'Salvar Alterações' : `Efetivar Lote (${quantity} unidades)`}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeSubTab === 'movements' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* KPI Section para Fluxos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Entradas (Histórico)</span>
              <div className="mt-6">
                <p className="text-5xl font-black text-blue-600 tracking-tighter">{tyres.length}</p>
                <p className="text-sm font-bold text-gray-400 uppercase mt-2">Total Adquirido</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Saldo em Estoque</span>
              <div className="mt-6">
                <p className="text-5xl font-black text-gray-800 tracking-tighter">{totals.inStock}</p>
                <p className="text-sm font-bold text-gray-400 uppercase mt-2">Almoxarifado</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Saldo em Operação</span>
              <div className="mt-6">
                <p className="text-5xl font-black text-gray-800 tracking-tighter">{totals.mounted}</p>
                <p className="text-sm font-bold text-gray-400 uppercase mt-2">Frota Ativa</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-black text-red-500 uppercase tracking-widest">Saídas (Sucata)</span>
              <div className="mt-6">
                <p className="text-5xl font-black text-gray-800 tracking-tighter">{totals.scrap}</p>
                <p className="text-sm font-bold text-gray-400 uppercase mt-2">Baixas Definitivas</p>
              </div>
            </div>
          </div>

          {/* Tabela de Saldos por Medida Reconciliada (Contabilização por Medida) */}
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Saldos de Inventário (Consolidado por Medida)</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Contabilização exata de fluxos unitários</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg shadow-blue-100">Balanço Patrimonial Ativo</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100/50">
                  <tr>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase">Medida / Modelo</th>
                    <th className="px-8 py-4 text-[9px] font-black text-blue-600 uppercase text-center border-l border-gray-100">Qtd Entradas</th>
                    <th className="px-8 py-4 text-[9px] font-black text-red-600 uppercase text-center">Qtd Saídas</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-800 uppercase text-center bg-slate-50 border-x border-gray-100">Saldo Ativo</th>
                    <th className="px-8 py-4 text-[9px] font-black text-emerald-600 uppercase text-center">No Estoque</th>
                    <th className="px-8 py-4 text-[9px] font-black text-indigo-600 uppercase text-center">Em Operação</th>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase text-right">Patrimônio (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inventorySummary.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-gray-800">{item.size}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{item.brand} - {item.model}</p>
                      </td>
                      <td className="px-8 py-5 text-center font-black text-blue-600 border-l border-gray-100">
                        <span className="bg-blue-50 px-3 py-1 rounded-lg text-sm">{item.entries}</span>
                      </td>
                      <td className="px-8 py-5 text-center font-black text-red-600">
                        <span className="bg-red-50 px-3 py-1 rounded-lg text-sm">{item.scrap}</span>
                      </td>
                      <td className="px-8 py-5 text-center font-black text-slate-900 bg-slate-100/50 border-x border-gray-100">
                        <span className="text-lg">{item.balance}</span>
                      </td>
                      <td className="px-8 py-5 text-center font-bold text-emerald-600">
                        {item.stock}
                      </td>
                      <td className="px-8 py-5 text-center font-bold text-indigo-600">
                        {item.mounted}
                      </td>
                      <td className="px-8 py-5 text-right font-black text-slate-800">
                        R$ {item.totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Histórico Detalhado de Movimentações */}
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row gap-3 items-start md:items-center">
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest shrink-0">Livro Digital de Movimentações</h4>
              <div className="flex flex-1 gap-3 w-full">
                <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-100 px-4 py-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-400 shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  <input
                    type="text"
                    placeholder="Marca, placa, série..."
                    value={movSearch}
                    onChange={e => setMovSearch(e.target.value)}
                    className="w-full bg-transparent font-bold text-xs outline-none text-gray-700 placeholder:text-gray-300"
                  />
                  {movSearch && (
                    <button onClick={() => setMovSearch('')} className="text-gray-300 hover:text-red-400 shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl px-1.5 py-1">
                  {(['Todos', 'Montagem', 'Desmontagem', 'Saída'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setMovType(type)}
                      className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${movType === type
                        ? type === 'Montagem' ? 'bg-blue-600 text-white'
                          : type === 'Desmontagem' ? 'bg-orange-500 text-white'
                            : type === 'Saída' ? 'bg-red-500 text-white'
                              : 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:bg-gray-50'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 shrink-0">{filteredMovements.length} registro(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase">Data</th>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase">Tipo de Fluxo</th>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase">Pneu / Série</th>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase">Local / Veículo</th>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase">Notas</th>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredMovements.map(m => {
                    const tyre = tyres.find(t => t.id === m.tyreId);
                    const vehicle = vehicles.find(v => v.id === m.vehicleId);
                    return (
                      <tr key={m.id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="px-8 py-5 text-xs font-bold text-gray-600">{formatDisplayDateLocal(m.date)}</td>
                        <td className="px-8 py-5">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${m.type === 'Entrada' ? 'bg-emerald-50 text-emerald-600' :
                            m.type === 'Saída' ? 'bg-red-50 text-red-600' :
                              m.type === 'Montagem' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                            }`}>
                            {m.type}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-[10px] font-black text-gray-700">{tyre?.brand} {tyre?.model}</p>
                          <p className="text-[9px] text-blue-500 font-mono font-bold uppercase tracking-widest">{tyre?.serialNumber || 'S/N'}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-black text-slate-700">{vehicle?.plate || (m.type === 'Saída' ? 'ÁREA DE SUCATA' : 'ALMOXARIFADO')}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">{m.position || '--'}</p>
                        </td>
                        <td className="px-8 py-5 text-[10px] font-medium text-gray-500 italic max-w-xs truncate">{m.observations || 'Fluxo regular.'}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingMovement(m)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                            </button>
                            <button onClick={() => onDeleteMovement?.(m.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
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
        </div>
      ) : activeSubTab === 'inventory' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Filtros do Inventário */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-400 shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input
                type="text"
                placeholder="Marca, modelo, medida, série, fornecedor..."
                value={invSearch}
                onChange={e => setInvSearch(e.target.value)}
                className="w-full bg-transparent font-bold text-sm outline-none text-gray-700 placeholder:text-gray-300"
              />
              {invSearch && (
                <button onClick={() => setInvSearch('')} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-2 py-2 shadow-sm">
              {(['all', 'Estoque', 'Operação'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setInvStatus(s)}
                  className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${invStatus === s
                    ? s === 'Estoque' ? 'bg-emerald-600 text-white shadow'
                      : s === 'Operação' ? 'bg-indigo-600 text-white shadow'
                        : 'bg-gray-800 text-white shadow'
                    : 'text-gray-400 hover:bg-gray-50'
                    }`}
                >
                  {s === 'all' ? 'Todos' : s}
                </button>
              ))}
            </div>
          </div>
          {(invSearch || invStatus !== 'all') && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 px-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
              <span>{filteredInventory.length} de {tyres.filter(t => t.status !== TyreStatus.SCRAP).length} pneus ativos
              </span>
              <button onClick={() => { setInvSearch(''); setInvStatus('all'); }} className="ml-1 text-blue-500 hover:text-blue-700">Limpar filtros</button>
            </div>
          )}

          {/* Cartões */}
          {filteredInventory.filter(t => t.status === TyreStatus.STOCK).length === 0 && invStatus !== 'Operação' ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[40px] border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-slate-900 rounded-full border-[8px] border-slate-800 mb-6 relative flex items-center justify-center">
                <div className="w-10 h-10 bg-white rounded-full border-4 border-slate-50 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
                </div>
              </div>
              <p className="font-black text-gray-700 text-lg uppercase tracking-tight">Nenhum pneu em estoque</p>
              <p className="text-sm text-gray-400 font-medium mt-2 max-w-xs">Todos os pneus estão instalados nos veículos ou foram baixados. Registre uma nova entrada de lote para adicionar pneus ao estoque.</p>
              <div className="flex gap-3 mt-6">
                <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase">{totals.mounted} em operação</span>
                <span className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase">{totals.scrap} baixados</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInventory.filter(t => t.status === TyreStatus.STOCK).length > 0 && (
                <>
                  {invStatus !== 'Operação' && <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">Em Estoque ({filteredInventory.filter(t => t.status === TyreStatus.STOCK).length})</p>}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredInventory.filter(t => t.status === TyreStatus.STOCK).map(tyre => {
                      const progress = (tyre.currentThreadDepth / tyre.initialThreadDepth) * 100;

                      const getProgressColor = (pct: number) => {
                        if (pct < 30) return '#ef4444';
                        if (pct < 60) return '#f59e0b';
                        return '#6366f1';
                      };

                      return (
                        <div key={tyre.id} className="relative group perspective-1000">
                          {/* Pneu Compacto */}
                          <div className="absolute inset-0 bg-slate-900 rounded-full shadow-lg transform transition-all duration-500 group-hover:scale-105 group-hover:rotate-6 border-[8px] border-slate-800 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)]"></div>
                            <div className="absolute inset-0 border border-dashed border-slate-700/30 rounded-full m-2"></div>
                          </div>

                          {/* Aro Compacto */}
                          <div className="relative bg-white rounded-full aspect-square m-1.5 shadow-inner border-4 border-slate-50 p-4 flex flex-col items-center justify-center text-center transition-transform duration-500 group-hover:scale-95 z-10">
                            <div className="mb-1">
                              <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tight ${tyre.status === TyreStatus.STOCK ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'
                                }`}>
                                {tyre.status === TyreStatus.STOCK ? 'Estoque' : 'Operação'}
                              </span>
                            </div>

                            <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-tighter leading-none mb-0.5">
                              {tyre.serialNumber}
                            </p>
                            <h4 className="text-[14px] font-black text-slate-800 leading-tight uppercase truncate w-full px-1">
                              {tyre.brand}
                            </h4>
                            <p className="text-[11px] font-bold text-slate-500 mb-0.5 truncate w-full px-1">
                              {tyre.size}
                            </p>
                            {tyre.invoiceNumber && (
                              <p className="text-[11px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full mb-2">
                                NF: {tyre.invoiceNumber}
                              </p>
                            )}

                            {/* Indicador de Desgaste Menor */}
                            <div className="relative w-12 h-12 mb-2">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-50" />
                                <circle
                                  cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="4" fill="transparent"
                                  strokeDasharray={132}
                                  strokeDashoffset={132 - (132 * progress) / 100}
                                  strokeLinecap="round"
                                  style={{ color: getProgressColor(progress), transition: 'stroke-dashoffset 1s ease-in-out' }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[13px] font-black text-slate-900 leading-none">{progress.toFixed(0)}%</span>
                              </div>
                            </div>

                            {/* Veículo ou Ação Rápida */}
                            <div className="flex flex-col gap-1.5 w-full">
                              <button
                                onClick={() => setShowMoveModal(tyre.id)}
                                className="w-full py-1.5 bg-blue-600 text-white rounded-xl text-[8px] font-black uppercase hover:bg-blue-700 transition-all shadow-md"
                              >
                                Instalar
                              </button>

                              <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(tyre)} className="p-1 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg transition-colors border border-slate-100">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                </button>
                                <button onClick={() => setShowDisposalModal(tyre.id)} className="p-1 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg transition-colors border border-slate-100">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {filteredInventory.filter(t => t.status === TyreStatus.MOUNTED).length > 0 && invStatus !== 'Estoque' && (
                <>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-1 mt-4">Em Operação ({filteredInventory.filter(t => t.status === TyreStatus.MOUNTED).length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredInventory.filter(t => t.status === TyreStatus.MOUNTED).map(tyre => {
                      const progress = (tyre.currentThreadDepth / tyre.initialThreadDepth) * 100;
                      const getProgressColor = (pct: number) => { if (pct < 30) return '#ef4444'; if (pct < 60) return '#f59e0b'; return '#6366f1'; };
                      const vehiclePlate = vehicles.find(v => v.id === tyre.vehicleId)?.plate || '—';
                      return (
                        <div key={tyre.id} className="relative group perspective-1000">
                          <div className="absolute inset-0 bg-indigo-900 rounded-full shadow-lg transform transition-all duration-500 group-hover:scale-105 group-hover:rotate-6 border-[8px] border-indigo-800 flex items-center justify-center overflow-hidden" />
                          <div className="relative bg-white rounded-full aspect-square m-3 shadow-inner border-4 border-slate-50 p-3 flex flex-col items-center justify-center text-center transition-transform duration-500 group-hover:scale-95 z-10">
                            <div className="mb-1"><span className="px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase bg-indigo-50 text-indigo-600">{vehiclePlate}</span></div>
                            <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-tighter leading-none mb-0.5">{tyre.serialNumber}</p>
                            <h4 className="text-[14px] font-black text-slate-800 leading-tight uppercase truncate w-full px-1">{tyre.brand}</h4>
                            <p className="text-[11px] font-bold text-slate-500 mb-0.5 truncate w-full px-1">{tyre.size}</p>
                            {tyre.invoiceNumber && (
                              <p className="text-[11px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full mb-2">
                                NF: {tyre.invoiceNumber}
                              </p>
                            )}
                            <div className="relative w-12 h-12 mb-2">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-50" />
                                <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={132} strokeDashoffset={132 - (132 * progress) / 100} strokeLinecap="round" style={{ color: getProgressColor(progress), transition: 'stroke-dashoffset 1s ease-in-out' }} />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-[13px] font-black text-slate-900 leading-none">{progress.toFixed(0)}%</span></div>
                            </div>
                            <div className="flex flex-col gap-1.5 w-full">
                              <button onClick={() => setShowMoveModal(tyre.id)} className="w-full py-1.5 bg-orange-500 text-white rounded-xl text-[8px] font-black uppercase hover:bg-orange-600 transition-all shadow-md">Desmontar</button>
                              <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(tyre)} className="p-1 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg transition-colors border border-slate-100"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {filteredInventory.length === 0 && (
                <div className="text-center py-16 text-gray-300">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  <p className="font-black text-gray-400 uppercase">Nenhum pneu encontrado</p>
                  <p className="text-sm mt-1">Ajuste os filtros de busca.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-orange-100">
            <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight mb-6">Nova Aferição de Sulco (Auditoria)</h4>
            <form onSubmit={handleAuditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Pneu / Ativo *</label>
                  <select required value={auditFormData.tyreId} onChange={e => setAuditFormData({ ...auditFormData, tyreId: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none">
                    <option value="">Selecione para aferição...</option>
                    {tyres.filter(t => t.status !== TyreStatus.SCRAP).map(t => (
                      <option key={t.id} value={t.id}>{t.serialNumber} - {t.brand} [{t.position || 'Estoque'}]</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Data da Aferição *</label>
                  <input type="date" required value={auditFormData.date} onChange={e => setAuditFormData({ ...auditFormData, date: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Técnico / Inspetor *</label>
                  <input type="text" required value={auditFormData.inspector} onChange={e => setAuditFormData({ ...auditFormData, inspector: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" placeholder="Nome do Responsável" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Sulco Atual (mm) *</label>
                  <input type="number" step="0.1" required value={auditFormData.depth} onChange={e => setAuditFormData({ ...auditFormData, depth: parseFloat(e.target.value) })} className="w-full p-4 bg-orange-50 border border-orange-100 rounded-2xl font-black text-orange-600 outline-none" placeholder="0.0" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">KM no Momento</label>
                  <input type="number" value={auditFormData.km} onChange={e => setAuditFormData({ ...auditFormData, km: parseFloat(e.target.value) })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all">Registrar Aferição</button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row gap-3 items-start md:items-center">
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest shrink-0">Histórico de Auditorias Técnicas</h4>
              <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-100 px-4 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-400 shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                <input
                  type="text"
                  placeholder="Marca, série, inspetor..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  className="w-full bg-transparent font-bold text-xs outline-none text-gray-700 placeholder:text-gray-300"
                />
                {auditSearch && (
                  <button onClick={() => setAuditSearch('')} className="text-gray-300 hover:text-red-400 shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              <span className="text-[10px] font-bold text-gray-400 shrink-0">{filteredAudits.length} registro(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase">Data</th>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase">Pneu / Série</th>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase text-center">Sulco Medido</th>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase text-center">KM Aferido</th>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase text-center">Inspetor</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Vida Útil Restante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAudits && filteredAudits.length > 0 ? (
                    filteredAudits.map(audit => {
                      const tyre = tyres.find(t => t.id === audit.tyreId);
                      const progress = tyre ? (audit.depth / tyre.initialThreadDepth) * 100 : 0;
                      return (
                        <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-5 text-xs font-bold text-gray-600">{formatDisplayDateLocal(audit.date)}</td>
                          <td className="px-8 py-5">
                            <p className="text-sm font-black text-gray-800">{tyre?.brand} {tyre?.model}</p>
                            <p className="text-[10px] font-mono text-blue-500 uppercase">{tyre?.serialNumber}</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg font-black text-sm">{audit.depth} mm</span>
                          </td>
                          <td className="px-8 py-5 text-center font-bold text-gray-600">{audit.km.toLocaleString()} KM</td>
                          <td className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            {audit.inspector}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3 justify-end">
                              <span className="text-[10px] font-black text-gray-400">{progress.toFixed(0)}%</span>
                              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full ${progress < 30 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center text-gray-400 italic font-medium">Nenhuma auditoria realizada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'repairs' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1 w-full max-w-md flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-400 shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input
                type="text"
                placeholder="Buscar por placa, parceiro ou serviço..."
                value={repairFilter}
                onChange={e => setRepairFilter(e.target.value)}
                className="w-full bg-transparent font-bold text-sm outline-none text-gray-700 placeholder:text-gray-300"
              />
            </div>
            <button
              onClick={() => {
                setEditingRepairId(null);
                setRepairFormData({
                  date: getTodayLocalDate(),
                  vehicleId: '',
                  partnerId: '',
                  quantity: 1,
                  unitValue: 0,
                  description: '',
                  observations: ''
                });
                setRepairBatch([]);
                setShowRepairForm(true);
              }}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              Lançar Novo Conserto/Serviço
            </button>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-5 py-4 text-[9px] font-black text-gray-400 uppercase">Data</th>
                    <th className="px-5 py-4 text-[9px] font-black text-gray-400 uppercase">Veículo</th>
                    <th className="px-5 py-4 text-[9px] font-black text-gray-400 uppercase">Parceiro / Hub</th>
                    <th className="px-5 py-4 text-[9px] font-black text-gray-400 uppercase">Serviço</th>
                    <th className="px-5 py-4 text-[9px] font-black text-gray-400 uppercase text-center">Qtd</th>
                    <th className="px-5 py-4 text-[9px] font-black text-gray-400 uppercase text-center">Vlr. Unit</th>
                    <th className="px-5 py-4 text-[9px] font-black text-gray-400 uppercase text-center">Total</th>
                    <th className="px-5 py-4 text-[9px] font-black text-gray-400 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRepairs.length > 0 ? (
                    filteredRepairs.map(r => {
                      const vehicle = vehicles.find(v => v.id === r.vehicleId);
                      const partner = suppliers.find(s => s.id === r.partnerId);
                      return (
                        <tr key={r.id} className="hover:bg-gray-50/30 transition-colors group">
                          <td className="px-5 py-5 text-xs font-bold text-gray-600">{formatDisplayDateLocal(r.date)}</td>
                          <td className="px-5 py-5">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-700">{vehicle?.plate || '---'}</span>
                          </td>
                          <td className="px-5 py-5">
                            <p className="text-xs font-black text-gray-700">{partner?.name || 'Parceiro não encontrado'}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{partner?.category}</p>
                          </td>
                          <td className="px-5 py-5">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase">{r.description}</span>
                            {r.observations && <p className="text-[9px] text-gray-400 mt-1 truncate max-w-[200px]">{r.observations}</p>}
                          </td>
                          <td className="px-5 py-5 text-center font-black text-gray-700">{r.quantity}</td>
                          <td className="px-5 py-5 text-center font-bold text-gray-600">R$ {r.unitValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="px-5 py-5 text-center font-black text-blue-600">R$ {(r.quantity * (r.unitValue || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="px-5 py-5 text-right">
                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingRepairId(r.id); setRepairFormData(r); setShowRepairForm(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                              </button>
                              <button onClick={() => onDeleteTyreRepair(r.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-8 py-10 text-center text-gray-400 italic font-medium">Nenhum conserto ou serviço registrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gestão de Marcas */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                </div>
                Cadastro de Marcas
              </h4>

              <form onSubmit={handleBrandSubmit} className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Nome da Marca (ex: Michelin)"
                  value={brandFormData.name}
                  onChange={e => setBrandFormData({ name: e.target.value })}
                  className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button type="submit" className="px-6 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                  {editingBrandId ? 'Salvar' : 'Adicionar'}
                </button>
              </form>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {tyreBrands.map(brand => (
                  <div key={brand.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl group hover:bg-gray-100 transition-all">
                    <span className="font-bold text-gray-700">{brand.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingBrandId(brand.id); setBrandFormData({ name: brand.name }); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                      </button>
                      <button onClick={() => onDeleteTyreBrand(brand.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-xl">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gestão de Modelos */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M7 7h10M7 12h10M7 17h10" /></svg>
                </div>
                Cadastro de Modelos
              </h4>

              <form onSubmit={handleModelSubmit} className="space-y-3 mb-6">
                <select
                  value={modelFormData.brandId}
                  onChange={e => setModelFormData({ ...modelFormData, brandId: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Selecione a Marca</option>
                  {tyreBrands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome do Modelo (ex: Multi D)"
                    value={modelFormData.name}
                    onChange={e => setModelFormData({ ...modelFormData, name: e.target.value })}
                    className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <button type="submit" className="px-6 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    {editingModelId ? 'Salvar' : 'Adicionar'}
                  </button>
                </div>
              </form>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {tyreModels.map(model => {
                  const brand = tyreBrands.find(b => b.id === model.brandId);
                  return (
                    <div key={model.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl group hover:bg-gray-100 transition-all">
                      <div>
                        <p className="font-bold text-gray-700">{model.name}</p>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{brand?.name || 'Marca Desconhecida'}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingModelId(model.id); setModelFormData({ brandId: model.brandId, name: model.name }); }} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                        </button>
                        <button onClick={() => onDeleteTyreModel(model.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-xl">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Movimentação (LOG) */}
      {editingMovement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[105] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 animate-in zoom-in-95 duration-200">
            <h4 className="text-2xl font-black text-gray-800 mb-2 leading-tight">Ajuste de Registro (LOG)</h4>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-8 border-b pb-4">
              EDITANDO: <span className="text-blue-600 font-mono">{editingMovement.type}</span>
            </p>

            <form onSubmit={handleUpdateMovementSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Data do Evento</label>
                <input type="date" value={editingMovement.date} onChange={e => setEditingMovement({ ...editingMovement, date: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" required />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Odômetro Registrado</label>
                <input type="number" value={editingMovement.km} onChange={e => setEditingMovement({ ...editingMovement, km: parseInt(e.target.value) })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-lg" required />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Notas de Auditoria</label>
                <textarea value={editingMovement.observations} onChange={e => setEditingMovement({ ...editingMovement, observations: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none resize-none" rows={3} />
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setEditingMovement(null)} className="flex-1 py-4 font-black text-gray-400 uppercase text-[11px]">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 uppercase text-[11px]">Salvar LOG</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Movimentação (Montagem/Desmontagem) */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[105] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 animate-in zoom-in-95 duration-200">
            <h4 className="text-2xl font-black text-gray-800 mb-2 leading-tight">
              {tyres.find(t => t.id === showMoveModal)?.status === TyreStatus.STOCK ? 'Ordem de Montagem' : 'Ordem de Desmontagem'}
            </h4>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-8 border-b pb-4">
              PNEU SÉRIE: <span className="text-blue-600 font-mono">{tyres.find(t => t.id === showMoveModal)?.serialNumber}</span>
            </p>

            <form onSubmit={handleMoveTyreSubmit} className="space-y-6">
              {tyres.find(t => t.id === showMoveModal)?.status === TyreStatus.STOCK && (
                <>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Veículo de Destino</label>
                    <select value={moveFormData.vehicleId} onChange={e => handleVehicleChangeInMove(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500" required>
                      <option value="">Buscar placa...</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Posição Técnica</label>
                    <select value={moveFormData.position} onChange={e => setMoveFormData({ ...moveFormData, position: e.target.value as TyrePosition })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm">
                      {Object.values(TyrePosition).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Odômetro do Veículo (KM)</label>
                <input type="number" required value={moveFormData.km} onChange={e => setMoveFormData({ ...moveFormData, km: parseInt(e.target.value) })} className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-2xl text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowMoveModal(null)} className="flex-1 py-4 font-black text-gray-400 uppercase text-[11px] tracking-widest">Voltar</button>
                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 uppercase text-[11px] tracking-widest">Efetivar Operação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Saída Permanente (Sucata / Baixa) */}
      {showDisposalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[105] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
            </div>
            <h4 className="text-2xl font-black text-gray-800 mb-2 leading-tight">Baixa Definitiva (Saída de Estoque)</h4>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-8 border-b pb-4">
              {showDisposalModal === 'select' ? 'Selecione o pneu para remoção' : `PNEU SÉRIE: ${tyres.find(t => t.id === showDisposalModal)?.serialNumber}`}
            </p>

            <form onSubmit={handleDisposalSubmit} className="space-y-6">
              {showDisposalModal === 'select' && (
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Pneu para Baixa</label>
                  <select
                    value={disposalFormData.tyreId}
                    onChange={e => setDisposalFormData({ ...disposalFormData, tyreId: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold"
                    required
                  >
                    <option value="">Escolher pneu...</option>
                    {tyres.filter(t => t.status !== TyreStatus.SCRAP).map(t => (
                      <option key={t.id} value={t.id}>{t.serialNumber} - {t.brand} ({t.status})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Data da Baixa</label>
                <input type="date" value={disposalFormData.date} onChange={e => setDisposalFormData({ ...disposalFormData, date: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" required />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Motivo do Descarte</label>
                <select value={disposalFormData.reason} onChange={e => setDisposalFormData({ ...disposalFormData, reason: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-red-600">
                  <option value="Fim de Vida Útil">Fim de Vida Útil (Sulco)</option>
                  <option value="Avaria Crítica">Avaria / Corte / Estouro</option>
                  <option value="Sem Condição de Recape">Carcaça Rejeitada</option>
                  <option value="Venda">Venda de Ativo</option>
                  <option value="Roubo/Extravio">Roubo / Extravio</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Relatório de Baixa</label>
                <textarea value={disposalFormData.observations} onChange={e => setDisposalFormData({ ...disposalFormData, observations: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none resize-none" rows={2} placeholder="Descreva os detalhes técnicos da saída..." />
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowDisposalModal(null)} className="flex-1 py-4 font-black text-gray-400 uppercase text-[11px] tracking-widest">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-100 uppercase text-[11px] tracking-widest">Confirmar Baixa</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Lançamento de Conserto */}
      {showRepairForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-4xl w-full p-10 animate-in zoom-in-95 duration-200">
            <h4 className="text-2xl font-black text-gray-800 mb-6 uppercase tracking-tight">Lançar Conserto / Serviço</h4>
            
            <form onSubmit={handleRepairSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Data do Serviço</label>
                <input type="date" value={repairFormData.date} onChange={e => setRepairFormData({ ...repairFormData, date: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" required />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Veículo (Placa)</label>
                <select value={repairFormData.vehicleId} onChange={e => setRepairFormData({ ...repairFormData, vehicleId: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" required>
                  <option value="">Selecione o Veículo</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Parceiro / Fornecedor</label>
                <select value={repairFormData.partnerId} onChange={e => setRepairFormData({ ...repairFormData, partnerId: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" required>
                  <option value="">Selecione o Parceiro</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Discriminação do Serviço</label>
                  <select value={repairFormData.description} onChange={e => setRepairFormData({ ...repairFormData, description: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-blue-600" required>
                    <option value="">Selecione o Serviço</option>
                    {repairTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Qtd</label>
                    <input type="number" min="1" value={repairFormData.quantity} onChange={e => setRepairFormData({ ...repairFormData, quantity: parseInt(e.target.value) || 1 })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Vlr Unit. (R$)</label>
                    <input type="number" step="0.01" value={repairFormData.unitValue} onChange={e => setRepairFormData({ ...repairFormData, unitValue: parseFloat(e.target.value) || 0 })} className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-black text-emerald-600" required />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Observações Detalhadas</label>
                <textarea value={repairFormData.observations} onChange={e => setRepairFormData({ ...repairFormData, observations: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium text-sm h-24 resize-none" placeholder="Descreva detalhes do conserto ou peças utilizadas..." />
              </div>
              {repairBatch.length > 0 && !editingRepairId && (
                <div className="md:col-span-2 bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-2">
                  <h5 className="text-[9px] font-black text-gray-400 uppercase mb-3 tracking-widest">Serviços no Lote ({repairBatch.length})</h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {repairBatch.map((item, idx) => {
                      const v = vehicles.find(veh => veh.id === item.vehicleId);
                      return (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-50 group">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-600">{v?.plate}</span>
                              <span className="text-[10px] font-black text-blue-600 uppercase">{item.description}</span>
                            </div>
                            <p className="text-[9px] text-gray-400 mt-0.5">
                              Qtd: {item.quantity} • Vlr: R$ {item.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • 
                              <span className="font-bold text-blue-600 ml-1">Total: R$ {(item.quantity * item.unitValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </p>
                          </div>
                          <button type="button" onClick={() => handleRemoveFromBatch(idx)} className="p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="md:col-span-2 flex flex-col md:flex-row justify-between gap-4 mt-4">
                <div className="flex gap-3">
                  {!editingRepairId && (
                    <button type="button" onClick={handleAddToBatch} className="px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 flex items-center gap-2 shadow-sm border border-emerald-100">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Adicionar ao Lote
                    </button>
                  )}
                </div>
                <div className="flex gap-3 items-center">
                  <button type="button" onClick={() => { setShowRepairForm(false); setEditingRepairId(null); setRepairBatch([]); }} className="px-8 py-4 font-black text-gray-400 uppercase text-[10px] tracking-widest">Cancelar</button>
                  <button type="submit" className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 text-[10px] uppercase tracking-widest transition-all">
                    {editingRepairId ? 'Salvar Alterações' : repairBatch.length > 0 ? `Finalizar Lote (${repairBatch.length + (repairFormData.description ? 1 : 0)})` : 'Confirmar Lançamento'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TyreManagement;
