import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PPEItem, PPEMovement, Driver, Team } from '../types';
import { getTodayLocalDate, formatSafeDate } from '../services/dateUtils';

interface PPEControlProps {
  items: PPEItem[];
  movements: PPEMovement[];
  drivers: Driver[];
  teams: Team[];
  onAddMovement: (movement: Omit<PPEMovement, 'id'>) => void;
  onUpdateMovement: (movement: PPEMovement) => void;
  onDeleteMovement: (id: string) => void;
  onAddItem: (item: Omit<PPEItem, 'id'>) => void;
  onUpdateItem: (item: PPEItem) => void;
  onDeleteItem: (id: string) => void;
}

const PPEControl: React.FC<PPEControlProps> = ({
  items,
  movements,
  drivers,
  teams,
  onAddMovement,
  onUpdateMovement,
  onDeleteMovement,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'history'>('inventory');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Helper para formatar data sem erro de fuso horário
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '---';
    const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showMovementForm, setShowMovementForm] = useState<PPEMovement['type'] | null>(null);
  const [editingMovement, setEditingMovement] = useState<PPEMovement | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'Todos' | 'Entrada' | 'Saída'>('Todos');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const applyQuickDate = (range: 'today' | '7d' | '30d' | 'month' | 'clear') => {
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const today = fmt(now);
    if (range === 'clear') { setDateFrom(''); setDateTo(''); return; }
    if (range === 'today') { setDateFrom(today); setDateTo(today); return; }
    if (range === '7d') { const d = new Date(now); d.setDate(d.getDate() - 6); setDateFrom(fmt(d)); setDateTo(today); return; }
    if (range === '30d') { const d = new Date(now); d.setDate(d.getDate() - 29); setDateFrom(fmt(d)); setDateTo(today); return; }
    if (range === 'month') { setDateFrom(fmt(new Date(now.getFullYear(), now.getMonth(), 1))); setDateTo(today); return; }
  };

  const initialItemFormData: Omit<PPEItem, 'id'> = {
    name: '',
    category: 'Proteção Mãos',
    certificateNumber: '',
    caExpiryDate: '',
    size: '',
    currentStock: 0,
    minStock: 2,
    manufacturer: '',
    photoUrl: ''
  };

  const [itemFormData, setItemFormData] = useState<Omit<PPEItem, 'id'>>(initialItemFormData);

  const initialMoveFormData = {
    ppeId: '',
    personName: '',
    teamId: '',
    responsibleUser: '', // Usado como Supervisor na entrega
    date: getTodayLocalDate(),
    quantity: 1,
    unitValue: 0,
    totalValue: 0,
    invoiceNumber: '',
    batchId: '',
    certificateNumber: ''
  };

  const [moveFormData, setMoveFormData] = useState(initialMoveFormData);

  // Cálculo detalhado de saldos por Lote (NF-e) incluindo valores
  const invoiceInfo = useMemo(() => {
    const info: Record<string, { ppeId: string, invoice: string, balance: number, unitValue: number, batchId: string }> = {};

    // Processamos as entradas para capturar valor e ID do lote original
    movements.filter(m => m.type === 'Entrada').forEach(m => {
      if (!m.invoiceNumber) return;
      const key = `${m.ppeId}|${m.invoiceNumber}`;
      if (!info[key]) {
        info[key] = {
          ppeId: m.ppeId,
          invoice: m.invoiceNumber,
          balance: m.quantity,
          unitValue: m.unitValue || 0,
          batchId: m.batchId || ''
        };
      } else {
        info[key].balance += m.quantity;
      }
    });

    // Subtraímos as saídas para saber o saldo real
    movements.filter(m => m.type === 'Saída').forEach(m => {
      if (!m.invoiceNumber) return;
      const key = `${m.ppeId}|${m.invoiceNumber}`;
      if (info[key]) {
        info[key].balance -= m.quantity;
      }
    });

    return info;
  }, [movements]);

  // Lista apenas as Notas Fiscais que possuem saldo para o item selecionado
  const activeInvoicesForSelectedPPE = useMemo(() => {
    if (!moveFormData.ppeId) return [];

    return (Object.values(invoiceInfo) as Array<{ ppeId: string, invoice: string, balance: number, unitValue: number, batchId: string }>)
      .filter(entry => entry.ppeId === moveFormData.ppeId && entry.balance > 0)
      .sort((a, b) => a.invoice.localeCompare(b.invoice));
  }, [invoiceInfo, moveFormData.ppeId]);

  // Sincroniza dados do lote quando a NF é selecionada na entrega
  useEffect(() => {
    if (showMovementForm === 'Saída' && moveFormData.invoiceNumber && moveFormData.ppeId) {
      const batch = invoiceInfo[`${moveFormData.ppeId}|${moveFormData.invoiceNumber}`];
      if (batch) {
        setMoveFormData(prev => ({
          ...prev,
          unitValue: batch.unitValue,
          batchId: batch.batchId,
          totalValue: prev.quantity * batch.unitValue
        }));
      }
    }
  }, [moveFormData.invoiceNumber, moveFormData.ppeId, moveFormData.quantity, showMovementForm, invoiceInfo]);

  // Sincroniza valor total na Entrada
  useEffect(() => {
    if (showMovementForm === 'Entrada') {
      setMoveFormData(prev => ({
        ...prev,
        totalValue: (prev.quantity || 0) * (prev.unitValue || 0)
      }));
    }
  }, [moveFormData.quantity, moveFormData.unitValue, showMovementForm]);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const item = items.find(i => i.id === m.ppeId);
      const searchStr = `${item?.name} ${m.personName} ${m.invoiceNumber} ${m.batchId} ${m.responsibleUser}`.toLowerCase();
      const matchesSearch = searchStr.includes(historySearch.toLowerCase());
      const matchesType = historyTypeFilter === 'Todos' || m.type === historyTypeFilter;
      const mDate = m.date.slice(0, 10);
      const matchesFrom = !dateFrom || mDate >= dateFrom;
      const matchesTo = !dateTo || mDate <= dateTo;
      return matchesSearch && matchesType && matchesFrom && matchesTo;
    });
  }, [movements, historySearch, historyTypeFilter, items, dateFrom, dateTo]);

  const ppeCategories = ['Proteção Cabeça', 'Proteção Visual', 'Proteção Auditiva', 'Proteção Respiratória', 'Proteção Mãos', 'Proteção Pés', 'Vestuário', 'Outros'];

  // Items ordenados para os dropdowns e listagens
  const sortedItemsList = useMemo(() => {
    return [...items].sort((a, b) => {
      const catIndexA = ppeCategories.indexOf(a.category || '');
      const catIndexB = ppeCategories.indexOf(b.category || '');
      if (catIndexA !== catIndexB) return catIndexA - catIndexB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    return sortedItemsList.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.certificateNumber.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchesCategory = !inventoryCategoryFilter || item.category === inventoryCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [sortedItemsList, inventorySearch, inventoryCategoryFilter]);

  // Helper para agrupar itens por categoria
  const groupedItems = useMemo(() => {
    const groups: Record<string, PPEItem[]> = {};
    filteredItems.forEach(item => {
      const cat = item.category || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  const CATEGORY_STYLES: Record<string, { icon: React.ReactNode, color: string, light: string, text: string, border: string }> = {
    'Proteção Cabeça': {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>,
      color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100'
    },
    'Proteção Visual': {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
      color: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100'
    },
    'Proteção Auditiva': {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H5V10a7 7 0 0 1 14 0v1h-1a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9Z" /></svg>,
      color: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100'
    },
    'Proteção Respiratória': {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22a9 9 0 0 0 9-9c0-4.9-4-9-9-9s-9 4.1-9 9a9 9 0 0 0 9 9Z" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>,
      color: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100'
    },
    'Proteção Mãos': {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" /><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>,
      color: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100'
    },
    'Proteção Pés': {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v-2.38C4 11.5 5.88 10 8.21 10h5.58c2.33 0 4.21 1.5 4.21 3.62V16h-14Z" /><path d="M7 16v4h10v-4" /></svg>,
      color: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100'
    },
    'Vestuário': {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.62 1.96V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5.42a2 2 0 0 0-1.62-1.96Z" /><path d="M12 16v4" /><path d="M8 20h8" /></svg>,
      color: 'bg-slate-500', light: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100'
    },
    'Outros': {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>,
      color: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100'
    }
  };

  // ── Exportação ──────────────────────────────────────────────────────
  const exportInventoryToXLS = () => {
    const BOM = '\uFEFF';
    const headers = ['Equipamento', 'Categoria', 'CA', 'Fabricante', 'Saldo Atual', 'Estoque Mínimo', 'Status'];
    const rows = filteredItems.map(item => {
      const status = item.currentStock <= item.minStock ? 'CRÍTICO' : 'OK';
      return [
        item.name,
        item.category,
        item.certificateNumber,
        item.manufacturer || '',
        item.currentStock,
        item.minStock,
        status
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';');
    });
    const csv = BOM + [headers.map(h => `"${h}"`).join(';'), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estoque_epi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportInventoryToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = filteredItems.map(item => {
      const isLow = item.currentStock <= item.minStock;
      const statusBadge = isLow 
        ? `<span style="background:#fef2f2;color:#991b1b;padding:2px 8px;border-radius:6px;font-size:9px;font-weight:900;text-transform:uppercase">Crítico</span>`
        : `<span style="background:#f0fdf4;color:#166534;padding:2px 8px;border-radius:6px;font-size:9px;font-weight:900;text-transform:uppercase">Estável</span>`;
      
      return `<tr>
        <td><strong>${item.name}</strong><br/><small style="color:#9ca3af">${item.category}</small></td>
        <td style="text-align:center">${item.certificateNumber}</td>
        <td>${item.manufacturer || '—'}</td>
        <td style="text-align:center;font-weight:900;${isLow ? 'color:#dc2626' : 'color:#111'}">${item.currentStock}</td>
        <td style="text-align:center">${item.minStock}</td>
        <td style="text-align:center">${statusBadge}</td>
      </tr>`;
    }).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Estoque Atual de EPI</title><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
      h1 { font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
      p.sub { font-size: 10px; color: #6b7280; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #f1f5f9; text-transform: uppercase; font-size: 9px; font-weight: 900; letter-spacing: .05em; padding: 8px 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
      td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
      tr:nth-child(even) td { background: #f8fafc; }
      @media print { body { padding: 0; } }
    </style></head><body>
      <h1>Relatório de Estoque de EPI</h1>
      <p class="sub">Gerado em ${new Date().toLocaleString('pt-BR')} • ${filteredItems.length} item(ns) listado(s)</p>
      <table>
        <thead><tr>
          <th>Equipamento</th><th style="text-align:center">Nº CA</th><th>Fabricante</th><th style="text-align:center">Saldo</th><th style="text-align:center">Mínimo</th><th style="text-align:center">Status</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
    setShowExportMenu(false);
  };

  const exportHistoryToXLS = () => {
    const BOM = '\uFEFF';
    const headers = ['Data', 'Fluxo', 'EPI', 'CA', 'Lote', 'Colaborador/Fornecedor', 'Supervisor', 'NF', 'Qtd.', 'Valor Unit. R$', 'Valor Total R$', 'Estoque Atual'];
    const rows = filteredMovements.map(m => {
      const item = items.find(i => i.id === m.ppeId);
      return [
        formatDisplayDate(m.date),
        m.type,
        item?.name || '',
        m.certificateNumber || item?.certificateNumber || '',
        m.batchId || '',
        m.personName || '',
        m.responsibleUser || '',
        m.invoiceNumber || '',
        m.quantity,
        (m.unitValue || 0).toFixed(2).replace('.', ','),
        (m.totalValue || 0).toFixed(2).replace('.', ','),
        item?.currentStock ?? ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';');
    });
    const csv = BOM + [headers.map(h => `"${h}"`).join(';'), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_epi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportHistoryToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = filteredMovements.map(m => {
      const item = items.find(i => i.id === m.ppeId);
      const badge = m.type === 'Entrada'
        ? `<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:6px;font-size:9px;font-weight:900;text-transform:uppercase">${m.type}</span>`
        : `<span style="background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:6px;font-size:9px;font-weight:900;text-transform:uppercase">${m.type}</span>`;
      return `<tr>
        <td>${formatDisplayDate(m.date)}<br/>${badge}</td>
        <td><strong>${item?.name || '—'}</strong><br/><small style="color:#9ca3af">CA: ${m.certificateNumber || item?.certificateNumber || '—'} ${m.batchId ? '• Lote: ' + m.batchId : ''}</small></td>
        <td>${m.personName || '—'}<br/><small style="color:#3b82f6">Sup: ${m.responsibleUser || '—'}</small></td>
        <td style="text-align:center">${m.quantity} un</td>
        <td style="text-align:right">R$ ${(m.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<br/><small style="color:#9ca3af">Un: R$ ${(m.unitValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</small></td>
        <td style="text-align:center;font-weight:900;color:#1d4ed8">${item?.currentStock ?? '—'}</td>
      </tr>`;
    }).join('');
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Histórico de Fluxos EPI</title><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
      h1 { font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
      p.sub { font-size: 10px; color: #6b7280; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #f1f5f9; text-transform: uppercase; font-size: 9px; font-weight: 900; letter-spacing: .05em; padding: 8px 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
      td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
      tr:nth-child(even) td { background: #f8fafc; }
      @media print { body { padding: 0; } }
    </style></head><body>
      <h1>Histórico de Fluxos — EPI</h1>
      <p class="sub">Gerado em ${new Date().toLocaleString('pt-BR')} • ${filteredMovements.length} registro(s)</p>
      <table>
        <thead><tr>
          <th>Data / Fluxo</th><th>Equipamento (EPI)</th><th>Responsáveis</th><th style="text-align:center">Qtd.</th><th style="text-align:right">Financeiro</th><th style="text-align:center">Estoque Atual</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
    setShowExportMenu(false);
  };
  // ────────────────────────────────────────────────────────────────────

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItemId) onUpdateItem({ ...itemFormData, id: editingItemId } as PPEItem);
    else onAddItem(itemFormData);
    setShowItemForm(false);
    setEditingItemId(null);
  };

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMovement) {
      onUpdateMovement(editingMovement);
      setEditingMovement(null);
    } else {
      const payload = { ...moveFormData, type: showMovementForm! };
      onAddMovement(payload as any);
      setShowMovementForm(null);
      setMoveFormData(initialMoveFormData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Segurança / Gestão de EPI</h3>
          <p className="text-sm text-gray-500 font-medium">Controle de CA, estoques industriais e entregas nominais.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          <button onClick={() => setActiveSubTab('inventory')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>Estoque Atual</button>
          <button onClick={() => setActiveSubTab('history')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeSubTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>Histórico de Fluxos</button>
        </div>
      </div>

      {activeSubTab === 'inventory' ? (
        <div className="space-y-6">
          {/* Barra de filtros do inventário */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-400 shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input
                type="text"
                placeholder="Buscar por nome, CA, fabricante..."
                value={inventorySearch}
                onChange={e => setInventorySearch(e.target.value)}
                className="w-full bg-transparent font-bold text-sm outline-none text-gray-700 placeholder:text-gray-300"
              />
              {inventorySearch && (
                <button onClick={() => setInventorySearch('')} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <select
              value={inventoryCategoryFilter}
              onChange={e => setInventoryCategoryFilter(e.target.value)}
              className="bg-white border border-gray-100 rounded-2xl px-5 py-3 font-bold text-sm text-gray-600 shadow-sm outline-none min-w-[200px]"
            >
              <option value="">Todas as Categorias</option>
              {ppeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(v => !v)}
                className="px-5 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap h-full"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Exportar Estoque
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[160px]">
                  <button
                    onClick={exportInventoryToXLS}
                    className="w-full flex items-center gap-3 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18M3 15h18" /></svg>
                    XLS / CSV
                  </button>
                  <div className="h-px bg-gray-100 mx-4" />
                  <button
                    onClick={exportInventoryToPDF}
                    className="w-full flex items-center gap-3 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>
                    PDF / Imprimir
                  </button>
                </div>
              )}
            </div>

            <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
              <button 
                onClick={() => setViewMode('cards')} 
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Visualização em Cartões"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              </button>
              <button 
                onClick={() => setViewMode('table')} 
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Visualização em Tabela"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => { setItemFormData(initialItemFormData); setShowItemForm(true); setEditingItemId(null); }} className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all whitespace-nowrap">Novo Item</button>
              <button onClick={() => { setMoveFormData({ ...initialMoveFormData, responsibleUser: 'Almoxarifado' }); setShowMovementForm('Entrada'); }} className="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-emerald-100 shadow-lg whitespace-nowrap">Registrar Compra</button>
              <button onClick={() => { setMoveFormData(initialMoveFormData); setShowMovementForm('Saída'); }} className="px-5 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-blue-100 shadow-lg whitespace-nowrap">Registrar Entrega</button>
            </div>
          </div>

          {/* Contador de resultados */}
          {(inventorySearch || inventoryCategoryFilter) && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
              <span>{filteredItems.length} de {items.length} EPIs encontrados</span>
              <button onClick={() => { setInventorySearch(''); setInventoryCategoryFilter(''); }} className="ml-2 text-blue-500 hover:text-blue-700 transition-colors">Limpar filtros</button>
            </div>
          )}

          <div className="space-y-12">
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 text-gray-300">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                <p className="font-black text-gray-400 uppercase tracking-widest">Nenhum EPI encontrado</p>
                <p className="text-sm mt-1">Tente ajustar os filtros de busca.</p>
              </div>
            ) : (
              viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredItems.map(item => {
                    const isLow = item.currentStock <= item.minStock;
                    const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES['Outros'];
                    
                    return (
                      <div key={item.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group overflow-hidden relative">
                        {/* Decorativo de fundo */}
                        <div className={`absolute top-0 right-0 w-32 h-32 ${catStyle.light} rounded-bl-full -mr-12 -mt-12 opacity-20 group-hover:scale-110 transition-transform`} />
                        
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-6">
                            <div className={`w-14 h-14 rounded-2xl ${catStyle.light} flex items-center justify-center ${catStyle.text} shadow-inner`}>
                              <div className="w-7 h-7">{catStyle.icon}</div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${catStyle.light} ${catStyle.text} border ${catStyle.border}`}>
                                {item.category}
                              </span>
                            </div>
                          </div>

                          <div className="mb-auto">
                            <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight mb-1 group-hover:text-blue-600 transition-colors">
                              {item.name}
                            </h4>
                            <div className="flex flex-wrap gap-2 mb-6">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                CA: {item.certificateNumber}
                              </span>
                              {item.size && (
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                  TAM: {item.size}
                                </span>
                              )}
                              {item.manufacturer && (
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 italic">
                                  {item.manufacturer}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-end pt-6 border-t border-gray-50">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Saldo em Estoque</span>
                              <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-black tracking-tighter ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                                  {item.currentStock}
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase">Unidades</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                              {isLow ? (
                                <div className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100 animate-pulse">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /></svg>
                                  <span className="text-[9px] font-black uppercase">Crítico</span>
                                </div>
                              ) : (
                                <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 border border-emerald-100">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                  <span className="text-[9px] font-black uppercase">Estável</span>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setEditingItemId(item.id); setItemFormData(item); setShowItemForm(true); }}
                                  className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                                  title="Editar Item"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                </button>
                                <button
                                  onClick={() => onDeleteItem(item.id)}
                                  className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                                  title="Excluir Item"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipamento</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoria</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Nº CA</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fabricante</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Saldo</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Mínimo</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50">
                      {filteredItems.map(item => {
                        const isLow = item.currentStock <= item.minStock;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-gray-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.name}</span>
                                {item.size && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tamanho: {item.size}</span>}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest leading-none block w-fit mx-auto">
                                CA: {item.certificateNumber}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-xs font-bold text-slate-600 italic">{item.manufacturer || '---'}</span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <div className="flex flex-col items-center">
                                <span className={`text-base font-black ${isLow ? 'text-red-600' : 'text-blue-700'}`}>{item.currentStock}</span>
                                <span className="text-[8px] font-bold uppercase text-slate-300">Unidades</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="text-sm font-bold text-slate-400 underline decoration-slate-200 decoration-2 underline-offset-4">{item.minStock}</span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0">
                                <button
                                  onClick={() => { setEditingItemId(item.id); setItemFormData(item); setShowItemForm(true); }}
                                  className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                                  title="Editar Item"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                </button>
                                <button
                                  onClick={() => onDeleteItem(item.id)}
                                  className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                                  title="Excluir Item"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Barra de filtros do histórico */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-400 shrink-0"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input type="text" placeholder="Filtrar por EPI, colaborador, NF, Lote ou Supervisor..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="w-full bg-transparent font-bold text-sm outline-none text-gray-700 placeholder:text-gray-300" />
              {historySearch && (
                <button onClick={() => setHistorySearch('')} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-2 py-2 shadow-sm">
              {(['Todos', 'Entrada', 'Saída'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setHistoryTypeFilter(type)}
                  className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${historyTypeFilter === type
                    ? type === 'Entrada' ? 'bg-emerald-600 text-white shadow' : type === 'Saída' ? 'bg-blue-600 text-white shadow' : 'bg-gray-800 text-white shadow'
                    : 'text-gray-400 hover:bg-gray-50'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Botão Exportar */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(v => !v)}
                className="h-full px-5 py-3 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Exportar
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[160px]">
                  <button
                    onClick={exportHistoryToXLS}
                    className="w-full flex items-center gap-3 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18M3 15h18" /></svg>
                    XLS / CSV
                  </button>
                  <div className="h-px bg-gray-100 mx-4" />
                  <button
                    onClick={exportHistoryToPDF}
                    className="w-full flex items-center gap-3 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>
                    PDF / Imprimir
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filtro de Período */}
          <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-400 shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">Período:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 outline-none"
              />
              <span className="text-gray-300 font-bold text-xs">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 ml-1">
              {([['today', 'Hoje'], ['7d', '7 dias'], ['30d', '30 dias'], ['month', 'Mês atual']] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => applyQuickDate(k)}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                >
                  {label}
                </button>
              ))}
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => applyQuickDate('clear')}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 px-1">
            <span>{filteredMovements.length} registro(s) encontrado(s)</span>
            {(dateFrom || dateTo) && (
              <span className="text-blue-500">
                • Período: {dateFrom ? new Date(dateFrom + 'T12:00:00').toLocaleDateString('pt-BR') : '...'}
                {' '}→ {dateTo ? new Date(dateTo + 'T12:00:00').toLocaleDateString('pt-BR') : '...'}
              </span>
            )}
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / Fluxo</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipamento (EPI)</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsáveis / Detalhes</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Financeiro</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Estoque Atual</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMovements.map(m => {
                  const item = items.find(i => i.id === m.ppeId);
                  const team = teams.find(t => t.id === m.personId); // Usando personId para armazenar teamId se necessário ou se m.personId for de fato colaborador
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className={`text-[9px] font-black uppercase mb-1 px-2 py-0.5 rounded-lg w-fit ${m.type === 'Entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{m.type}</span>
                          <span className="text-xs font-bold text-gray-800">{formatDisplayDate(m.date)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-black text-gray-700">{item?.name || 'Não identificado'}</span>
                        <p className="text-[9px] text-gray-400 font-mono">CA: {m.certificateNumber || item?.certificateNumber} {m.batchId && `• Lote: ${m.batchId}`}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900">{m.personName || 'Suprimentos (Entrada)'}</span>
                          <div className="flex gap-2 items-center mt-1">
                            <p className="text-[10px] font-bold text-blue-600 uppercase">Supervisor: {m.responsibleUser}</p>
                            {m.invoiceNumber && <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">NF: {m.invoiceNumber}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800">R$ {m.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '---'}</span>
                          <span className="text-[9px] text-gray-400 font-bold">{m.quantity} UNID • Un: R$ {m.unitValue?.toLocaleString('pt-BR')}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {(() => {
                          const stock = item?.currentStock ?? null;
                          if (stock === null) return <span className="text-gray-300 font-bold text-xs">—</span>;
                          const unitVal = m.unitValue || 0;
                          const stockValue = stock * unitVal;
                          const low = item && stock <= item.minStock;
                          return (
                            <div className="flex flex-col">
                              <span className={`text-xs font-black ${low ? 'text-red-600' : 'text-slate-800'}`}>
                                R$ {stockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                {low && <span className="ml-1 text-[9px]">⚠</span>}
                              </span>
                              <span className="text-[9px] text-gray-400 font-bold">{stock} UNID • Un: R$ {unitVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingMovement(m)}
                            className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                          </button>
                          <button
                            onClick={() => onDeleteMovement(m.id)}
                            className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
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
      )}

      {/* Modal Edição de Registro de Fluxo */}
      {editingMovement && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 animate-in zoom-in-95">
            <h4 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">Editar Fluxo de EPI</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-8 border-b pb-4">
              Alteração retroativa de estoque
            </p>

            <form onSubmit={handleSubmitMovement} className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Equipamento</label>
                <input type="text" disabled value={items.find(i => i.id === editingMovement.ppeId)?.name} className="w-full p-4 bg-gray-100 border border-gray-200 rounded-2xl font-bold opacity-70" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Quantidade *</label>
                  <input type="number" required value={editingMovement.quantity} onChange={e => setEditingMovement({ ...editingMovement, quantity: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-lg text-blue-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Data *</label>
                  <input type="date" required value={editingMovement.date} onChange={e => setEditingMovement({ ...editingMovement, date: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Responsável / Supervisor</label>
                <input type="text" required value={editingMovement.responsibleUser} onChange={e => setEditingMovement({ ...editingMovement, responsibleUser: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setEditingMovement(null)} className="flex-1 py-4 font-black text-gray-400 uppercase text-[11px]">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] shadow-xl">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modais de Cadastro */}
      {showItemForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-xl w-full p-10 animate-in zoom-in-95">
            <h4 className="text-2xl font-black text-gray-800 mb-8 uppercase tracking-tight">{editingItemId ? 'Editar Equipamento' : 'Novo EPI no Inventário'}</h4>
            <form onSubmit={handleSubmitItem} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nome do Equipamento *</label>
                <input type="text" required value={itemFormData.name} onChange={e => setItemFormData({ ...itemFormData, name: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Categoria *</label>
                  <select required value={itemFormData.category} onChange={e => setItemFormData({ ...itemFormData, category: e.target.value as any })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold">
                    <option value="Proteção Cabeça">Proteção Cabeça</option>
                    <option value="Proteção Visual">Proteção Visual</option>
                    <option value="Proteção Auditiva">Proteção Auditiva</option>
                    <option value="Proteção Respiratória">Proteção Respiratória</option>
                    <option value="Proteção Mãos">Proteção Mãos</option>
                    <option value="Proteção Pés">Proteção Pés</option>
                    <option value="Vestuário">Vestuário</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Fabricante / Marca</label>
                  <input type="text" value={itemFormData.manufacturer} onChange={e => setItemFormData({ ...itemFormData, manufacturer: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" placeholder="Ex: 3M, Danny..." />
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nº do CA *</label>
                  <input type="text" required value={itemFormData.certificateNumber} onChange={e => setItemFormData({ ...itemFormData, certificateNumber: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Vencimento CA</label>
                  <input type="date" value={itemFormData.caExpiryDate} onChange={e => setItemFormData({ ...itemFormData, caExpiryDate: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Tamanho</label>
                  <input type="text" value={itemFormData.size} onChange={e => setItemFormData({ ...itemFormData, size: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" placeholder="G, 42..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Mín. Estoque</label>
                  <input type="number" value={itemFormData.minStock} onChange={e => setItemFormData({ ...itemFormData, minStock: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black" />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowItemForm(false)} className="flex-1 py-4 font-black text-gray-400 uppercase text-[10px]">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Efetivar Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMovementForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-xl w-full p-10 animate-in zoom-in-95 overflow-y-auto max-h-[95vh]">
            <h4 className="text-2xl font-black text-gray-800 mb-8 uppercase tracking-tight">{showMovementForm === 'Entrada' ? 'Registrar Compra / Estoque' : 'Registrar Entrega de EPI'}</h4>
            <form onSubmit={handleSubmitMovement} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Escolher EPI *</label>
                  <select
                    required
                    value={moveFormData.ppeId}
                    onChange={e => {
                      setMoveFormData({ ...moveFormData, ppeId: e.target.value, invoiceNumber: '' });
                    }}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-800"
                  >
                    <option value="">Selecione...</option>
                    {ppeCategories.map(category => {
                      const itemsInCategory = sortedItemsList.filter(i => i.category === category);
                      if (itemsInCategory.length === 0) return null;
                      return (
                        <optgroup key={category} label={category}>
                          {itemsInCategory.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.name} (Saldo: {i.currentStock})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                {showMovementForm === 'Saída' && (
                  <div className="md:col-span-2 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <label className="block text-[10px] font-black text-blue-600 uppercase mb-2">Vincular a Lote com Saldo Ativo (NF-e)</label>
                    <select
                      required
                      value={moveFormData.invoiceNumber}
                      onChange={e => setMoveFormData({ ...moveFormData, invoiceNumber: e.target.value })}
                      className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none font-bold text-gray-700 text-sm"
                      disabled={!moveFormData.ppeId}
                    >
                      <option value="">{moveFormData.ppeId ? 'Selecione uma NF-e com estoque...' : 'Selecione primeiro o EPI'}</option>
                      {activeInvoicesForSelectedPPE.map(entry => (
                        <option key={entry.invoice} value={entry.invoice}>
                          NF: {entry.invoice} (Saldo no Lote: {entry.balance} un)
                        </option>
                      ))}
                    </select>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-[9px] text-blue-500 font-black uppercase">Lote: {moveFormData.batchId || '---'}</span>
                      <span className="text-[9px] text-blue-600 font-black uppercase">V. Unitário: R$ {moveFormData.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}
              </div>

              {showMovementForm === 'Entrada' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="md:col-span-2">
                    <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Dados da Aquisição / Lote</h5>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nota Fiscal (NF-e) *</label>
                    <input
                      type="text"
                      required
                      value={moveFormData.invoiceNumber}
                      onChange={e => setMoveFormData({ ...moveFormData, invoiceNumber: e.target.value })}
                      className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none font-black text-emerald-700"
                      placeholder="000.123"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Identificador de Lote</label>
                    <input
                      type="text"
                      value={moveFormData.batchId}
                      onChange={e => setMoveFormData({ ...moveFormData, batchId: e.target.value })}
                      className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-700"
                      placeholder="LT-2025-01"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Quantidade *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={showMovementForm === 'Saída' ? (invoiceInfo[`${moveFormData.ppeId}|${moveFormData.invoiceNumber}`]?.balance || 1) : 9999}
                    value={moveFormData.quantity}
                    onChange={e => setMoveFormData({ ...moveFormData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-lg text-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Data do Evento *</label>
                  <input type="date" required value={moveFormData.date} onChange={e => setMoveFormData({ ...moveFormData, date: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
                </div>
              </div>

              {showMovementForm === 'Entrada' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Valor Unitário (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={moveFormData.unitValue}
                      onChange={e => setMoveFormData({ ...moveFormData, unitValue: parseFloat(e.target.value) || 0 })}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-blue-600 uppercase mb-2">Valor Total do Lote</label>
                    <input
                      type="text"
                      readOnly
                      value={`R$ ${moveFormData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl outline-none font-black text-blue-800 shadow-inner"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-900 rounded-2xl shadow-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-blue-400 uppercase">Valor Financeiro da Entrega</span>
                    <span className="text-white font-black text-xl">R$ {moveFormData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">* Valor calculado automaticamente com base no custo médio do lote selecionado.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Supervisor Responsável *</label>
                  <input type="text" required value={moveFormData.responsibleUser} onChange={e => setMoveFormData({ ...moveFormData, responsibleUser: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" placeholder="Quem autorizou?" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Equipe / Setor</label>
                  <select
                    value={moveFormData.teamId}
                    onChange={e => setMoveFormData({ ...moveFormData, teamId: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700"
                  >
                    <option value="">Selecione a equipe...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.number})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">{showMovementForm === 'Saída' ? 'Nome do Colaborador (Recebedor)' : 'Fornecedor / Responsável'}</label>
                <input type="text" required value={moveFormData.personName} onChange={e => setMoveFormData({ ...moveFormData, personName: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" placeholder={showMovementForm === 'Saída' ? "Ex: João Silva" : "Ex: Distribuidora Alpha"} />
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowMovementForm(null)} className="flex-1 py-4 font-black text-gray-400 uppercase text-[10px]">Voltar</button>
                <button type="submit" className={`flex-[2] py-4 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl ${showMovementForm === 'Entrada' ? 'bg-emerald-600' : 'bg-blue-600'}`}>Confirmar Movimentação</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PPEControl;
