
import React, { useState, useMemo } from 'react';
import { Collaborator, StaffFunction } from '../types';
import { getTodayLocalDate, formatSafeDate } from '../services/dateUtils';

export interface HREvent {
  id: string;
  collaboratorId: string;
  type: 'Férias' | 'Afastamento' | 'Advertência' | 'Elogio' | 'Promoção' | 'Treinamento' | 'Demissão' | 'Admissão' | 'Alteração de Função';
  startDate: string;
  endDate?: string;
  description: string;
  responsible: string;
  createdAt: string;
}

interface HRManagementProps {
  collaborators: Collaborator[];
  hrEvents: HREvent[];
  onAddHREvent: (event: Omit<HREvent, 'id' | 'createdAt'>) => void;
  onDeleteHREvent: (id: string) => void;
  onUpdateCollaborator: (c: Collaborator) => void;
}

const EVENT_COLORS: Record<HREvent['type'], string> = {
  'Férias': 'bg-sky-50 text-sky-700 border-sky-200',
  'Afastamento': 'bg-orange-50 text-orange-700 border-orange-200',
  'Advertência': 'bg-red-50 text-red-700 border-red-200',
  'Elogio': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Promoção': 'bg-purple-50 text-purple-700 border-purple-200',
  'Alteração de Função': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Treinamento': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Demissão': 'bg-rose-50 text-rose-700 border-rose-200',
  'Admissão': 'bg-green-50 text-green-700 border-green-200',
};

const EVENT_ICONS: Record<HREvent['type'], string> = {
  'Férias': '🌴', 'Afastamento': '🏥', 'Advertência': '⚠️',
  'Elogio': '⭐', 'Promoção': '🚀', 'Treinamento': '📚', 'Alteração de Função': '🔄',
  'Demissão': '🚪', 'Admissão': '🎉',
};

const HRManagement: React.FC<HRManagementProps> = ({
  collaborators, hrEvents, onAddHREvent, onDeleteHREvent, onUpdateCollaborator
}) => {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'events' | 'birthdays'>('dashboard');
  const [showEventForm, setShowEventForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterRole, setFilterRole] = useState('Todos');
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('');

  const today = new Date();
  const todayStr = getTodayLocalDate();

  const initialEvent: Omit<HREvent, 'id' | 'createdAt'> = {
    collaboratorId: '',
    type: 'Férias',
    startDate: todayStr,
    endDate: '',
    description: '',
    responsible: '',
  };
  const [eventForm, setEventForm] = useState(initialEvent);

  // KPIs
  const kpis = useMemo(() => {
    const total = collaborators.length;
    const ativos = collaborators.filter(c => c.status === 'Ativo').length;
    const ferias = collaborators.filter(c => c.status === 'Férias').length;
    const afastados = collaborators.filter(c => c.status === 'Afastado').length;
    const motoristas = collaborators.filter(c => c.role === 'Motorista').length;

    // CNH vencendo em 30 dias
    const cnh30 = collaborators.filter(c => {
      if (c.role !== 'Motorista' || !c.licenseExpiry) return false;
      const exp = new Date(c.licenseExpiry);
      const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    }).length;

    // Aniversariantes do mês
    const thisMonth = today.getMonth() + 1;
    const aniversariantes = collaborators.filter(c => {
      if (!c.admissionDate) return false;
      return new Date(c.admissionDate).getMonth() + 1 === thisMonth;
    }).length;

    return { total, ativos, ferias, afastados, motoristas, cnh30, aniversariantes };
  }, [collaborators]);

  // Filtered collaborators
  const filtered = useMemo(() => {
    return collaborators.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cpf.includes(searchTerm) || c.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'Todos' || c.status === filterStatus;
      const matchRole = filterRole === 'Todos' || c.role === filterRole;
      return matchSearch && matchStatus && matchRole;
    });
  }, [collaborators, searchTerm, filterStatus, filterRole]);

  // Birthdays this month (by admission date month)
  const birthdaysThisMonth = useMemo(() => {
    const m = today.getMonth() + 1;
    return collaborators.filter(c => c.admissionDate && new Date(c.admissionDate).getMonth() + 1 === m)
      .sort((a, b) => new Date(a.admissionDate!).getDate() - new Date(b.admissionDate!).getDate());
  }, [collaborators]);

  // Events for a selected collaborator
  const collaboratorEvents = (colId: string) =>
    hrEvents.filter(e => e.collaboratorId === colId).sort((a, b) => b.startDate.localeCompare(a.startDate));

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.collaboratorId || !eventForm.description || !eventForm.responsible) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    onAddHREvent(eventForm);
    // Update collaborator status for Férias/Afastamento/Demissão
    const collab = collaborators.find(c => c.id === eventForm.collaboratorId);
    if (collab) {
      if (eventForm.type === 'Férias') onUpdateCollaborator({ ...collab, status: 'Férias' });
      else if (eventForm.type === 'Afastamento') onUpdateCollaborator({ ...collab, status: 'Afastado' });
      else if (eventForm.type === 'Demissão') onUpdateCollaborator({ ...collab, status: 'Inativo' });
      else if (eventForm.type === 'Admissão') onUpdateCollaborator({ ...collab, status: 'Ativo' });
    }
    setEventForm(initialEvent);
    setShowEventForm(false);
  };

  const staffFunctions: StaffFunction[] = ['Gerente', 'Supervisor', 'Encarregado', 'Motorista', 'Batedor', 'Apanhador'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Inativo': return 'bg-gray-50 text-gray-500 border-gray-200';
      case 'Férias': return 'bg-sky-50 text-sky-600 border-sky-200';
      case 'Afastado': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Em Viagem': return 'bg-blue-50 text-blue-600 border-blue-200';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const calcSeniority = (admissionDate?: string) => {
    if (!admissionDate) return null;
    const adm = new Date(admissionDate);
    const diff = today.getTime() - adm.getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    if (years > 0) return `${years}a ${months}m`;
    return `${months} meses`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Recursos Humanos</h3>
          <p className="text-sm text-gray-500 font-medium">Gestão de pessoas, ocorrências e indicadores de RH.</p>
        </div>
        <button
          onClick={() => { setShowEventForm(!showEventForm); setSelectedCollaboratorId(''); }}
          className={`px-6 py-3 rounded-2xl shadow-lg font-black text-xs uppercase tracking-widest transition-all ${showEventForm ? 'bg-gray-200 text-gray-700' : 'bg-violet-600 text-white shadow-violet-100 hover:bg-violet-700'
            }`}
        >
          {showEventForm ? 'Cancelar' : '+ Nova Ocorrência'}
        </button>
      </div>

      {/* Form */}
      {showEventForm && (
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-violet-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <h4 className="text-sm font-black text-violet-600 uppercase tracking-widest mb-6">Registrar Ocorrência / Evento de RH</h4>
          <form onSubmit={handleSubmitEvent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Colaborador *</label>
              <select
                required value={eventForm.collaboratorId}
                onChange={e => setEventForm({ ...eventForm, collaboratorId: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-violet-400 outline-none"
              >
                <option value="">Selecione...</option>
                {collaborators.map(c => <option key={c.id} value={c.id}>{(c.name || '---').toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Tipo de Evento *</label>
              <select
                value={eventForm.type}
                onChange={e => setEventForm({ ...eventForm, type: e.target.value as HREvent['type'] })}
                className="w-full p-3 bg-violet-50 border border-violet-100 rounded-xl font-black text-violet-600 focus:ring-2 focus:ring-violet-400 outline-none"
              >
                {Object.keys(EVENT_COLORS).map(t => <option key={t} value={t}>{EVENT_ICONS[t as HREvent['type']]} {t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Responsável *</label>
              <input
                required type="text" placeholder="Nome do gestor..."
                value={eventForm.responsible}
                onChange={e => setEventForm({ ...eventForm, responsible: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:ring-2 focus:ring-violet-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Data Início</label>
              <input
                type="date" value={eventForm.startDate}
                onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:ring-2 focus:ring-violet-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Data Fim (se aplicável)</label>
              <input
                type="date" value={eventForm.endDate}
                onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:ring-2 focus:ring-violet-400 outline-none"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Descrição / Observações *</label>
              <input
                required type="text" placeholder="Detalhes do evento..."
                value={eventForm.description}
                onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:ring-2 focus:ring-violet-400 outline-none"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end">
              <button type="submit" className="px-10 py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-violet-700 transition shadow-xl shadow-violet-100">
                Registrar Evento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Nav Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
        {(['dashboard', 'events', 'birthdays'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSection === s ? 'bg-white text-violet-600 shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            {s === 'dashboard' ? '👥 Colaboradores' : s === 'events' ? '📋 Histórico' : '🎂 Aniversários'}
          </button>
        ))}
      </div>

      {/* SECTION: DASHBOARD / Collaborators */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Colaboradores', value: kpis.total, color: 'from-violet-500 to-purple-600', icon: '👥' },
              { label: 'Ativos', value: kpis.ativos, color: 'from-emerald-500 to-green-600', icon: '✅' },
              { label: 'Férias / Afastados', value: kpis.ferias + kpis.afastados, color: 'from-sky-500 to-blue-600', icon: '🌴' },
              { label: 'CNH vencendo (30d)', value: kpis.cnh30, color: 'from-red-500 to-rose-600', icon: '⚠️' },
            ].map(k => (
              <div key={k.label} className={`bg-gradient-to-br ${k.color} p-5 rounded-[24px] text-white shadow-lg`}>
                <div className="text-2xl mb-2">{k.icon}</div>
                <p className="text-3xl font-black">{k.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Role breakdown */}
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Distribuição por Cargo</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {staffFunctions.map(fn => {
                const count = collaborators.filter(c => c.role === fn).length;
                const pct = kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0;
                const icon = fn === 'Gerente' ? '👔' : 
                            fn === 'Supervisor' ? '👨‍💼' : 
                            fn === 'Encarregado' ? '📋' : 
                            fn === 'Motorista' ? '🚛' : 
                            fn === 'Batedor' ? '🏎️' : 
                            fn === 'Apanhador' ? '🧤' : '👤';
                return (
                  <div key={fn} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center hover:bg-white hover:shadow-md transition-all group">
                    <div className="text-xl mb-1 group-hover:scale-110 transition-transform">{icon}</div>
                    <p className="text-2xl font-black text-gray-800">{count}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mt-1">{fn}</p>
                    <div className="h-1 bg-gray-100 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters + Collaborator list */}
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text" placeholder="🔍 Buscar por nome, CPF ou setor..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-violet-400 outline-none"
              />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-violet-400 outline-none">
                {['Todos', 'Ativo', 'Inativo', 'Férias', 'Afastado', 'Em Viagem'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-violet-400 outline-none">
                <option value="Todos">Todos os cargos</option>
                {staffFunctions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-2">👤</p>
                  <p className="font-bold text-sm">Nenhum colaborador encontrado</p>
                </div>
              )}
              {filtered.map(c => {
                const isExpiring = c.role === 'Motorista' && c.licenseExpiry &&
                  (new Date(c.licenseExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 30 &&
                  (new Date(c.licenseExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24) >= 0;
                const eventsCount = hrEvents.filter(e => e.collaboratorId === c.id).length;
                const seniority = calcSeniority(c.admissionDate);
                return (
                  <div key={c.id}
                    onClick={() => setSelectedCollaboratorId(selectedCollaboratorId === c.id ? '' : c.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${selectedCollaboratorId === c.id ? 'border-violet-200 bg-violet-50' : 'border-gray-100 bg-gray-50/50 hover:bg-white'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {c.profilePhoto
                          ? <img src={c.profilePhoto} alt={c.name} className="w-full h-full object-cover" />
                          : <span className="text-xl font-black text-gray-300">{(c.name || '').charAt(0)}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-gray-800 text-sm uppercase">{(c.name || 'Sem Nome').toUpperCase()}</span>
                          {isExpiring && <span className="text-[8px] font-black bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">⚠ CNH Vencendo</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">{c.role}</span>
                          <span className="text-[9px] text-gray-300">•</span>
                          <span className="text-[9px] font-bold text-gray-400">{c.department}</span>
                          {seniority && <><span className="text-[9px] text-gray-300">•</span><span className="text-[9px] font-bold text-violet-500">{seniority}</span></>}
                          {c.salary && c.salary > 0 && (
                            <>
                              <span className="text-[9px] text-gray-300">•</span>
                              <span className="text-[9px] font-black text-emerald-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.salary)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {eventsCount > 0 && (
                          <span className="text-[9px] font-black bg-violet-100 text-violet-600 px-2.5 py-1 rounded-full">{eventsCount} eventos</span>
                        )}
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${getStatusColor(c.status)}`}>{c.status}</span>
                      </div>
                    </div>

                    {/* Expanded: collaborator events */}
                    {selectedCollaboratorId === c.id && (
                      <div className="mt-4 pt-4 border-t border-violet-100 space-y-2 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Histórico de Ocorrências</p>
                          <button
                            onClick={e => { e.stopPropagation(); setEventForm({ ...initialEvent, collaboratorId: c.id }); setShowEventForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="text-[9px] font-black text-violet-600 bg-violet-100 px-3 py-1.5 rounded-lg hover:bg-violet-200 transition"
                          >
                            + Adicionar
                          </button>
                        </div>
                        {collaboratorEvents(c.id).length === 0
                          ? <p className="text-[10px] text-gray-400 font-bold">Nenhum evento registrado.</p>
                          : collaboratorEvents(c.id).map(ev => (
                            <div key={ev.id} className={`flex items-start gap-3 p-3 rounded-xl border ${EVENT_COLORS[ev.type]}`}>
                              <span className="text-lg">{EVENT_ICONS[ev.type]}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-black uppercase">{ev.type}</span>
                                  <span className="text-[9px] opacity-70">{formatSafeDate(ev.startDate)}</span>
                                  {ev.endDate && <span className="text-[9px] opacity-70">→ {formatSafeDate(ev.endDate)}</span>}
                                </div>
                                <p className="text-[10px] font-bold mt-0.5 opacity-80">{ev.description}</p>
                                <p className="text-[9px] opacity-60 mt-0.5">Resp: {ev.responsible}</p>
                              </div>
                              <button
                                onClick={e => { e.stopPropagation(); if (window.confirm('Excluir este evento?')) onDeleteHREvent(ev.id); }}
                                className="text-red-400 hover:text-red-600 transition p-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                              </button>
                            </div>
                          ))
                        }
                        {/* CNH info for drivers */}
                        {c.role === 'Motorista' && c.licenseExpiry && (
                          <div className={`p-3 rounded-xl border text-[10px] font-bold ${isExpiring ? 'bg-red-50 border-red-200 text-red-600' : 'bg-blue-50 border-blue-200 text-blue-600'
                            }`}>
                            🪪 CNH {c.licenseCategory} — Vence: {formatSafeDate(c.licenseExpiry)}
                            {isExpiring && ' ⚠️ VENCIMENTO PRÓXIMO!'}
                          </div>
                        )}
                        {/* Courses */}
                        {c.courses.length > 0 && (
                          <div className="p-3 bg-white border border-gray-100 rounded-xl">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">Certificações ({c.courses.length})</p>
                            <div className="flex flex-wrap gap-1.5">
                              {c.courses.map(course => (
                                <span key={course.id} className="text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                                  {course.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Events history */}
      {activeSection === 'events' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Histórico Geral de Eventos</h5>
            {hrEvents.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-5xl mb-3">📋</p>
                <p className="font-bold">Nenhum evento registrado ainda.</p>
                <p className="text-sm mt-1">Use o botão "Nova Ocorrência" para registrar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...hrEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(ev => {
                  const collab = collaborators.find(c => c.id === ev.collaboratorId);
                  return (
                    <div key={ev.id} className={`flex items-start gap-4 p-4 rounded-2xl border ${EVENT_COLORS[ev.type]}`}>
                      <span className="text-2xl">{EVENT_ICONS[ev.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                           <span className="font-black text-sm uppercase">{(collab?.name || 'Colaborador removido').toUpperCase()}</span>
                          <span className="text-[9px] font-black uppercase bg-white/60 px-2 py-0.5 rounded-full">{ev.type}</span>
                        </div>
                        <p className="text-xs font-bold mt-0.5 opacity-80">{ev.description}</p>
                        <div className="flex gap-3 mt-1 text-[9px] opacity-60 font-bold flex-wrap">
                          <span>📅 {formatSafeDate(ev.startDate)}</span>
                          {ev.endDate && <span>→ {formatSafeDate(ev.endDate)}</span>}
                          <span>👤 Resp: {ev.responsible}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => { if (window.confirm('Excluir este evento?')) onDeleteHREvent(ev.id); }}
                        className="text-red-400 hover:text-red-600 transition p-1.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: Aniversários (Admissão este mês) */}
      {activeSection === 'birthdays' && (
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Aniversários de Empresa – {today.toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}</h5>
          <p className="text-[10px] text-gray-400 font-bold mb-5">Colaboradores admitidos neste mês (por data de admissão)</p>
          {birthdaysThisMonth.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-3">🎂</p>
              <p className="font-bold">Nenhum aniversariante este mês.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {birthdaysThisMonth.map(c => {
                const admDate = new Date(c.admissionDate!);
                const years = today.getFullYear() - admDate.getFullYear();
                return (
                  <div key={c.id} className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 p-5 rounded-[20px] flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border-2 border-violet-200 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                      {c.profilePhoto
                        ? <img src={c.profilePhoto} alt={c.name} className="w-full h-full object-cover" />
                        : <span className="text-2xl font-black text-violet-300">{(c.name || '').charAt(0)}</span>
                      }
                    </div>
                    <div>
                       <p className="font-black text-gray-800 uppercase">{(c.name || '').toUpperCase()}</p>
                      <p className="text-[9px] font-bold text-violet-500 uppercase">{c.role}</p>
                      <p className="text-[10px] font-bold text-gray-500 mt-1">
                        🎉 {years} {years === 1 ? 'ano' : 'anos'} de empresa — dia {admDate.getDate()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HRManagement;
