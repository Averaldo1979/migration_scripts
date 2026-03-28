
import React, { useState, useEffect, useRef } from 'react';
import { Vehicle, MaintenanceLog, Unit, Supplier, UserRole } from '../types';
import { getTodayLocalDate, formatSafeDate } from '../services/dateUtils';

interface MaintenanceManagementProps {
  vehicles: Vehicle[];
  suppliers: Supplier[];
  units: Unit[];
  maintenanceLogs: MaintenanceLog[];
  onAddMaintenance: (log: Omit<MaintenanceLog, 'id'>) => void;
  onUpdateMaintenance: (log: MaintenanceLog) => void;
  onDeleteMaintenance: (id: string) => void;
  currentUserRole?: UserRole;
}

interface CsvRow {
  id?: string;
  placa: string;
  data: string;
  tipo: string;
  descricao: string;
  oficina: string;
  km: string;
  preco_unitario: string;
  quantidade: string;
  custo_total: string;
  unidade?: string;
  valid?: boolean;
  errors?: string[];
  vehicleId?: string;
  unitId?: string;
}

type FormTab = 'manual' | 'csv';

const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({
  vehicles,
  suppliers,
  units,
  maintenanceLogs,
  onAddMaintenance,
  onUpdateMaintenance,
  onDeleteMaintenance,
  currentUserRole
}) => {
  const [showForm, setShowForm] = useState(false);

  // Helper para formatar data sem erro de fuso horário
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '---';
    const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };
  const [formTab, setFormTab] = useState<FormTab>('manual');
  const [editingId, setEditingId] = useState<string | null>(null);

  // CSV state
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvUploadResult, setCsvUploadResult] = useState<{ success: number; errors: number } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const canModify = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.MANAGER;

  const [formData, setFormData] = useState<Omit<MaintenanceLog, 'id'>>({
    vehicleId: '',
    unitId: '',
    date: getTodayLocalDate(),
    type: 'Preventiva',
    description: '',
    unitPrice: 0,
    quantity: 1,
    cost: 0,
    km: 0,
    team: ''
  });

  // Filtrar parceiros que são oficinas
  const repairShops = suppliers.filter(s => s.category === 'Oficina' || s.category === 'Peças');

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      cost: prev.unitPrice * prev.quantity
    }));
  }, [formData.unitPrice, formData.quantity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.description || formData.cost <= 0 || !formData.km || !formData.team) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (editingId) {
      onUpdateMaintenance({ id: editingId, ...formData } as MaintenanceLog);
    } else {
      onAddMaintenance(formData);
    }

    handleCancel();
  };

  const handleEdit = (log: MaintenanceLog) => {
    const { id, ...data } = log;
    setEditingId(id);
    setFormData(data);
    setFormTab('manual');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormTab('manual');
    setCsvRows([]);
    setCsvFileName('');
    setCsvUploadResult(null);
    if (csvInputRef.current) csvInputRef.current.value = '';
    setFormData({
      vehicleId: '',
      unitId: '',
      date: getTodayLocalDate(),
      type: 'Preventiva',
      description: '',
      unitPrice: 0,
      quantity: 1,
      cost: 0,
      km: 0,
      team: ''
    });
  };

  // ─── CSV ────────────────────────────────────────────────────────────────────

  const CSV_TEMPLATE_HEADERS = [
    'id',
    'placa',
    'data',
    'tipo',
    'descricao',
    'oficina',
    'km',
    'preco_unitario',
    'quantidade',
    'custo_total',
    'unidade'
  ];

  const CSV_TEMPLATE_EXAMPLE_ROWS = [
    [
      '',
      'ABC-1234',
      getTodayLocalDate(),
      'Preventiva',
      'Troca de óleo e filtros',
      'Oficina Central',
      '85000',
      '250.00',
      '1',
      '250.00',
      ''
    ],
    [
      '',
      'DEF-5678',
      getTodayLocalDate(),
      'Corretiva',
      'Reparo no sistema de freios',
      'AutoPeças Bom Preço',
      '42000',
      '180.50',
      '2',
      '361.00',
      'Sede'
    ],
    [
      '',
      'GHI-9012',
      getTodayLocalDate(),
      'Preventiva',
      'Alinhamento e balanceamento',
      'Borracharia do Zé',
      '67500',
      '120.00',
      '1.5',
      '180.00',
      ''
    ],
  ];

  const handleDownloadTemplate = () => {
    const hint = [
      '# INSTRUÇÕES:',
      '# - id: ID do registro (vazio para criar novo, ou preencha para ATUALIZAR existente)',
      '# - placa: placa do veículo cadastrado (obrigatório)',
      '# - data: formato AAAA-MM-DD (obrigatório)',
      '# - tipo: "Preventiva" ou "Corretiva" (obrigatório)',
      '# - descricao: descrição dos serviços (obrigatório)',
      '# - oficina: nome da oficina/parceiro (obrigatório)',
      '# - km: quilometragem atual do veículo (obrigatório)',
      '# - preco_unitario: preço unitário (aceita decimais, ex: 250.50)',
      '# - quantidade: quantidade de itens (aceita decimais, ex: 1.5)',
      '# - custo_total: valor total (opcional - calculado automaticamente)',
      '# - unidade: nome da unidade (opcional)',
      '# Remova estas linhas de comentário antes de importar',
    ].join('\n');

    const header = CSV_TEMPLATE_HEADERS.join(';');
    const examples = CSV_TEMPLATE_EXAMPLE_ROWS.map(r => r.join(';')).join('\n');
    const csvContent = `\uFEFF${hint}\n${header}\n${examples}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_ordens_de_servico.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if ((ch === ';' || ch === ',') && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const validateAndParseCsv = (text: string): CsvRow[] => {
    const lines = text
      .split(/\r?\n/)
      .filter(l => l.trim() !== '' && !l.trim().startsWith('#'));

    if (lines.length < 2) return [];

    const headerLine = lines[0];
    const headers = parseCsvLine(headerLine).map(h => h.toLowerCase().replace(/\s/g, '_'));

    const idIdx = headers.findIndex(h => h === 'id' || h === 'id_os');
    const plateIdx = headers.findIndex(h => h.includes('placa'));
    const dateIdx = headers.findIndex(h => h.includes('data'));
    const typeIdx = headers.findIndex(h => h.includes('tipo'));
    const descIdx = headers.findIndex(h => h.includes('descri'));
    const shopIdx = headers.findIndex(h => h.includes('oficina'));
    const kmIdx = headers.findIndex(h => h.includes('km'));
    const priceIdx = headers.findIndex(h => h.includes('preco') || h.includes('preço') || h.includes('unit'));
    const qtyIdx = headers.findIndex(h => h.includes('qtd') || h.includes('quantidade'));
    const costIdx = headers.findIndex(h => h.includes('custo') || h.includes('total'));
    const unitIdx = headers.findIndex(h => h.includes('unidade'));

    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const id = idIdx >= 0 ? cols[idIdx] || undefined : undefined;
      const placa = plateIdx >= 0 ? cols[plateIdx] || '' : '';
      const data = dateIdx >= 0 ? cols[dateIdx] || '' : '';
      const tipo = typeIdx >= 0 ? cols[typeIdx] || '' : '';
      const descricao = descIdx >= 0 ? cols[descIdx] || '' : '';
      const oficina = shopIdx >= 0 ? cols[shopIdx] || '' : '';
      const km = kmIdx >= 0 ? cols[kmIdx] || '0' : '0';
      const preco_unitario = priceIdx >= 0 ? cols[priceIdx] || '0' : '0';
      const quantidade = qtyIdx >= 0 ? cols[qtyIdx] || '1' : '1';
      const custo_total = costIdx >= 0 ? cols[costIdx] || '0' : '0';
      const unidade = unitIdx >= 0 ? cols[unitIdx] || '' : '';

      const errors: string[] = [];

      if (id) {
        const foundLog = maintenanceLogs.find(l => l.id === id);
        if (!foundLog) errors.push(`ID "${id}" não encontrado para atualização`);
      }

      const foundVehicle = vehicles.find(
        v => v.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
          === placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
      );
      if (!placa) errors.push('Placa obrigatória');
      else if (!foundVehicle) errors.push(`Veículo "${placa}" não cadastrado`);

      if (!data) errors.push('Data obrigatória');
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) errors.push('Data inválida (use AAAA-MM-DD)');

      if (!tipo || !['Preventiva', 'Corretiva'].includes(tipo)) {
        errors.push('Tipo deve ser "Preventiva" ou "Corretiva"');
      }
      if (!descricao) errors.push('Descrição obrigatória');
      if (!oficina) errors.push('Oficina obrigatória');
      if (!km || isNaN(Number(km))) errors.push('KM inválido');

      const unitPrice = parseFloat(preco_unitario.replace(',', '.'));
      const qty = parseFloat(quantidade.replace(',', '.'));
      if (isNaN(unitPrice) || unitPrice < 0) errors.push('Preço unitário inválido');
      if (isNaN(qty) || qty <= 0) errors.push('Quantidade inválida');

      const foundUnit = unidade
        ? units.find(u => u.name.toLowerCase() === unidade.toLowerCase())
        : undefined;

      rows.push({
        id,
        placa,
        data,
        tipo,
        descricao,
        oficina,
        km,
        preco_unitario,
        quantidade,
        custo_total,
        unidade,
        valid: errors.length === 0,
        errors,
        vehicleId: foundVehicle?.id,
        unitId: foundUnit?.id
      });
    }

    return rows;
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setCsvUploadResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const parsed = validateAndParseCsv(text);
      setCsvRows(parsed);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleCsvImport = async () => {
    const validRows = csvRows.filter(r => r.valid);
    if (validRows.length === 0) {
      alert('Nenhuma linha válida para importar.');
      return;
    }

    setCsvUploading(true);
    let success = 0;
    let errors = 0;

    for (const row of validRows) {
      try {
        const unitPrice = parseFloat(row.preco_unitario.replace(',', '.')) || 0;
        const qty = parseFloat(row.quantidade.replace(',', '.')) || 1;
        const cost = unitPrice * qty;

        const logData: Omit<MaintenanceLog, 'id'> = {
          vehicleId: row.vehicleId || '',
          unitId: row.unitId || '',
          teamId: undefined,
          date: row.data,
          type: row.tipo as 'Preventiva' | 'Corretiva',
          description: row.descricao,
          unitPrice,
          quantity: qty,
          cost,
          km: parseInt(row.km) || 0,
          team: row.oficina
        };

        if (row.id) {
          await onUpdateMaintenance({ id: row.id, ...logData } as MaintenanceLog);
        } else {
          await onAddMaintenance(logData);
        }
        success++;
      } catch {
        errors++;
      }
    }

    setCsvUploading(false);
    setCsvUploadResult({ success, errors });
    setCsvRows([]);
    setCsvFileName('');
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const validCount = csvRows.filter(r => r.valid).length;
  const invalidCount = csvRows.filter(r => !r.valid).length;

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Ordens de Serviço (O.S.)</h3>
          <p className="text-sm text-gray-500 font-medium">Controle técnico e financeiro de intervenções mecânicas.</p>
        </div>
        {canModify && (
          <button
            onClick={() => showForm ? handleCancel() : setShowForm(true)}
            className={`px-6 py-2.5 rounded-xl shadow-lg transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 ${showForm
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
              }`}
          >
            {showForm ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                Fechar Formulário
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Nova Ordem de Serviço
              </>
            )}
          </button>
        )}
      </div>

      {/* ── Formulário com Abas ── */}
      {showForm && (
        <div className="bg-white rounded-[40px] shadow-xl border border-blue-50 overflow-hidden">

          {/* Abas do formulário */}
          {!editingId && (
            <div className="flex border-b border-gray-100">
              <button
                type="button"
                onClick={() => setFormTab('manual')}
                className={`flex-1 py-4 px-6 flex items-center justify-center gap-2.5 font-black text-[11px] uppercase tracking-widest transition-all ${formTab === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                Preencher Manualmente
              </button>
              <button
                type="button"
                onClick={() => setFormTab('csv')}
                className={`flex-1 py-4 px-6 flex items-center justify-center gap-2.5 font-black text-[11px] uppercase tracking-widest transition-all ${formTab === 'csv'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Importar via CSV
              </button>
            </div>
          )}

          {/* ── Aba: Preenchimento Manual ── */}
          {(formTab === 'manual' || editingId) && (
            <div className="p-8">
              <h4 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                </div>
                {editingId ? 'Editar O.S.' : 'Abertura de O.S.'}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Ativo Inspecionado *</label>
                    <select value={formData.vehicleId} onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700">
                      <option value="">Selecione o veículo...</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Oficina / Parceiro Credenciado *</label>
                    <select
                      value={formData.team}
                      onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                      className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-700"
                      required
                    >
                      <option value="">Escolher Oficina...</option>
                      {repairShops.map(s => <option key={s.id} value={s.name}>{s.name} ({s.cnpj})</option>)}
                      {repairShops.length === 0 && <option disabled>Nenhuma oficina cadastrada no Hub</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Data *</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipo *</label>
                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black">
                      <option value="Preventiva">Preventiva</option>
                      <option value="Corretiva">Corretiva</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">KM Atual *</label>
                    <input type="number" value={formData.km} onChange={(e) => setFormData({ ...formData, km: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-lg" placeholder="0" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Unidade</label>
                    <select value={formData.unitId} onChange={(e) => setFormData({ ...formData, unitId: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-indigo-700">
                      <option value="">Selecione...</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Descrição dos Serviços *</label>
                    <input type="text" placeholder="Ex: Troca de pastilhas, suspensão dianteira..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">R$ Unitário *</label>
                    <input type="number" step="0.01" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Qtd *</label>
                    <input type="number" step="0.01" min="0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-black text-blue-600 uppercase tracking-widest mb-2">Total da O.S. (R$)</label>
                    <input type="number" readOnly value={formData.cost} className="w-full p-5 bg-blue-50 border border-blue-100 rounded-2xl font-black text-2xl text-blue-700 shadow-inner" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                  <button type="button" onClick={handleCancel} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition">
                    Cancelar
                  </button>
                  <button type="submit" className="px-16 py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-2xl shadow-blue-100">
                    {editingId ? 'Confirmar Atualização' : 'Efetivar Ordem de Serviço'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Aba: Importar CSV ── */}
          {formTab === 'csv' && !editingId && (
            <div className="p-8 space-y-6">

              {/* Resultado de upload */}
              {csvUploadResult && (
                <div className={`rounded-2xl p-5 flex items-center gap-4 ${csvUploadResult.errors > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${csvUploadResult.errors > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {csvUploadResult.errors > 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </div>
                  <div>
                    <p className={`font-black text-sm ${csvUploadResult.errors > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      Importação concluída! {csvUploadResult.success} registros importados com sucesso.
                      {csvUploadResult.errors > 0 && ` ${csvUploadResult.errors} falharam.`}
                    </p>
                    <button onClick={() => setCsvUploadResult(null)} className="text-xs text-gray-400 hover:text-gray-600 font-bold mt-1">
                      Fazer nova importação →
                    </button>
                  </div>
                </div>
              )}

              {/* Passo 1 – Download do template */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">1</div>
                  <div className="flex-1">
                    <p className="font-black text-gray-800 text-sm mb-1">Baixe o modelo de planilha</p>
                    <p className="text-xs text-gray-500 mb-4">
                      O template já vem com <strong>3 linhas de exemplo</strong> preenchidas para orientar o preenchimento.
                      Aceita separador <code className="bg-white px-1 rounded font-bold text-emerald-600">;</code> ou <code className="bg-white px-1 rounded font-bold text-emerald-600">,</code>
                    </p>

                    {/* Preview inline do template */}
                    <div className="bg-white border border-emerald-100 rounded-xl overflow-hidden mb-4">
                      <div className="px-4 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest">
                        Preview do Template — 3 linhas de exemplo
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                          <thead className="bg-gray-50">
                            <tr>
                              {CSV_TEMPLATE_HEADERS.map(h => (
                                <th key={h} className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {CSV_TEMPLATE_EXAMPLE_ROWS.map((row, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                                {row.map((cell, ci) => (
                                  <td key={ci} className="px-3 py-2 text-[10px] font-medium text-gray-600 border-b border-gray-50">{cell || <span className="text-gray-300 italic">vazio</span>}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadTemplate}
                      className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      Baixar Template CSV com Exemplos
                    </button>
                  </div>
                </div>
              </div>

              {/* Passo 2 – Selecionar arquivo */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-gray-700 text-white text-xs font-black flex items-center justify-center flex-shrink-0">2</div>
                  <div className="flex-1">
                    <p className="font-black text-gray-800 text-sm mb-1">Selecione o arquivo CSV preenchido</p>
                    <p className="text-xs text-gray-500 mb-3">Aceita arquivos <code className="font-bold">.csv</code> com separador <code className="font-bold">;</code> ou <code className="font-bold">,</code></p>
                    <label className="cursor-pointer">
                      <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${csvFileName ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30'}`}>
                        <input
                          ref={csvInputRef}
                          type="file"
                          accept=".csv,text/csv"
                          onChange={handleCsvFileChange}
                          className="hidden"
                          id="csv-upload-input"
                        />
                        {csvFileName ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                            <div className="text-left">
                              <p className="font-black text-emerald-700 text-sm">{csvFileName}</p>
                              <p className="text-xs text-emerald-500">{csvRows.length} linha(s) detectada(s)</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setCsvFileName(''); setCsvRows([]); if (csvInputRef.current) csvInputRef.current.value = ''; }}
                              className="ml-auto p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                            </div>
                            <p className="font-bold text-gray-500 text-sm">Clique para selecionar o arquivo CSV</p>
                            <p className="text-xs text-gray-400 mt-1">Formato .CSV — separador ; ou ,</p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Passo 3 – Preview e Importação */}
              {csvRows.length > 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">3</div>
                    <div className="flex-1">
                      <p className="font-black text-gray-800 text-sm mb-1">Revise e confirme a importação</p>

                      {/* Resumo */}
                      <div className="flex items-center gap-3 mb-4 mt-3">
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase tracking-widest">{validCount} válidas</span>
                        {invalidCount > 0 && (
                          <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 font-black text-[10px] uppercase tracking-widest">{invalidCount} com erros</span>
                        )}
                        <span className="text-xs text-gray-400 font-medium">Verifique as linhas antes de importar</span>
                      </div>

                      {/* Tabela de preview */}
                      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-5">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-gray-50 border-b border-gray-100">
                              <tr>
                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">ID (Ação)</th>
                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Placa</th>
                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Descrição</th>
                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Oficina</th>
                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">KM</th>
                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Qtd</th>
                                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Custo (R$)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {csvRows.map((row, idx) => (
                                <tr key={idx} className={row.valid ? 'bg-white' : 'bg-red-50/60'}>
                                  <td className="px-4 py-3">
                                    {row.valid ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                        OK
                                      </span>
                                    ) : (
                                      <div>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[9px] font-black uppercase">
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                          Erro
                                        </span>
                                        <div className="mt-1">
                                          {row.errors?.map((err, ei) => (
                                            <p key={ei} className="text-[9px] text-red-500 font-bold">• {err}</p>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {row.id ? (
                                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">Atualizar</span>
                                    ) : (
                                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Novo</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 font-black text-xs text-blue-700 uppercase">{row.placa || '—'}</td>
                                  <td className="px-4 py-3 text-xs font-bold text-gray-600">{row.data || '—'}</td>
                                  <td className="px-4 py-3">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${row.tipo === 'Preventiva' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                      {row.tipo || '—'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-600 font-medium max-w-[160px] truncate">{row.descricao || '—'}</td>
                                  <td className="px-4 py-3 text-xs text-gray-600 font-medium">{row.oficina || '—'}</td>
                                  <td className="px-4 py-3 text-xs font-bold text-gray-500">{Number(row.km).toLocaleString()}</td>
                                  <td className="px-4 py-3 text-xs font-bold text-gray-600">{parseFloat(row.quantidade || '1').toLocaleString('pt-BR')}</td>
                                  <td className="px-4 py-3 text-xs font-black text-gray-800 text-right">
                                    {(parseFloat(row.preco_unitario.replace(',', '.')) * parseFloat(row.quantidade.replace(',', '.') || '1')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => { setCsvRows([]); setCsvFileName(''); if (csvInputRef.current) csvInputRef.current.value = ''; }}
                          className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition"
                        >
                          Trocar Arquivo
                        </button>
                        <button
                          type="button"
                          onClick={handleCsvImport}
                          disabled={csvUploading || validCount === 0}
                          className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-100"
                        >
                          {csvUploading ? (
                            <>
                              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                              Importando...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                              Importar {validCount} Registro{validCount !== 1 ? 's' : ''}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Legenda das colunas (só aparece se nenhum arquivo ainda) */}
              {csvRows.length === 0 && !csvUploadResult && (
                <div className="border border-gray-100 rounded-2xl p-5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Colunas esperadas no CSV</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { col: 'id', desc: 'ID da O.S. (Só para atualizar)' },
                      { col: 'placa', desc: 'Placa do veículo *' },
                      { col: 'data', desc: 'Data (AAAA-MM-DD) *' },
                      { col: 'tipo', desc: 'Preventiva ou Corretiva *' },
                      { col: 'descricao', desc: 'Descrição dos serviços *' },
                      { col: 'oficina', desc: 'Nome da oficina *' },
                      { col: 'km', desc: 'KM atual *' },
                      { col: 'preco_unitario', desc: 'Preço unitário (decimal) *' },
                      { col: 'quantidade', desc: 'Quantidade (decimal) *' },
                      { col: 'custo_total', desc: 'Total (calculado auto)' },
                      { col: 'unidade', desc: 'Unidade (opcional)' },
                    ].map(item => (
                      <div key={item.col} className="bg-gray-50 rounded-xl p-3">
                        <code className="text-[10px] font-black text-emerald-600">{item.col}</code>
                        <p className="text-[9px] text-gray-400 font-medium mt-0.5">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão cancelar */}
              <div className="flex justify-end pt-2">
                <button type="button" onClick={handleCancel} className="px-8 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tabela de Registros ── */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / Tipo</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativo / Oficina</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Custo Total</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {maintenanceLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                      </div>
                      <p className="text-sm font-bold text-gray-400">Nenhuma O.S. registrada</p>
                      <p className="text-xs text-gray-300">Clique em "Nova Ordem de Serviço" para começar</p>
                    </div>
                  </td>
                </tr>
              ) : (
                maintenanceLogs.map((log) => {
                  const vehicle = vehicles.find(v => v.id === log.vehicleId);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-gray-800">{formatDisplayDate(log.date)}</span>
                        <span className={`block text-[9px] font-black uppercase mt-1 ${log.type === 'Preventiva' ? 'text-emerald-600' : 'text-red-500'}`}>{log.type}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-black text-blue-600 uppercase leading-none">{vehicle?.plate}</span>
                        <p className="text-[10px] text-gray-400 font-black uppercase mt-1 italic line-clamp-1">{log.team}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-gray-700 line-clamp-1">{log.description}</p>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">{log.km.toLocaleString()} KM</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-sm font-black text-slate-800">R$ {log.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {canModify ? (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(log)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg></button>
                            <button onClick={() => onDeleteMaintenance(log.id)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg></button>
                          </div>
                        ) : (
                          <span className="text-[9px] text-gray-300 font-bold uppercase italic">Sem Permissão</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceManagement;
