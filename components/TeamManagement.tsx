
import React, { useState, useRef } from 'react';
import { Collaborator, Course, StaffFunction, Unit, Team } from '../types';
import { getTodayLocalDate, formatSafeDate } from '../services/dateUtils';

interface TeamManagementProps {
  collaborators: Collaborator[];
  units: Unit[];
  teams: Team[];
  onAddCollaborator: (collab: Omit<Collaborator, 'id'>) => void;
  onUpdateCollaborator: (collab: Collaborator) => void;
  onDeleteCollaborator: (id: string) => void;
  onDeleteAllCollaborators: () => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ collaborators, units, teams, onAddCollaborator, onUpdateCollaborator, onDeleteCollaborator, onDeleteAllCollaborators }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBadgeCollaborator, setSelectedBadgeCollaborator] = useState<Collaborator | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const initialFormData: Omit<Collaborator, 'id'> = {
    name: '',
    cpf: '',
    role: 'Motorista',
    department: 'Operacional',
    unitId: '',
    teamId: '',
    admissionDate: getTodayLocalDate(),
    lastVacationDate: '',
    leasedCnpj: '',
    licenseNumber: '',
    licenseCategory: 'B',
    licenseExpiry: '',
    status: 'Ativo',
    phone: '',
    email: '',
    courses: [],
    profilePhoto: '',
    licenseFile: ''
  };

  const [formData, setFormData] = useState<Omit<Collaborator, 'id'>>(initialFormData);
  const [newCourse, setNewCourse] = useState<Omit<Course, 'id'>>({ name: '', completionDate: '', expiryDate: '', certificateFile: '' });

  const staffFunctions: StaffFunction[] = ['Gerente', 'Supervisor', 'Encarregado', 'Motorista', 'Batedor', 'Apanhador'];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cpf) {
      alert("Por favor, preencha o Nome e o CPF.");
      return;
    }

    if (formData.role === 'Motorista' && (!formData.licenseNumber || !formData.licenseExpiry)) {
      alert("Para a função Motorista, os dados da CNH são obrigatórios.");
      return;
    }

    if (editingId) {
      onUpdateCollaborator({ id: editingId, ...formData });
    } else {
      onAddCollaborator(formData);
    }

    handleCancel();
  };

  const handleEdit = (collab: Collaborator) => {
    const { id, ...data } = collab;
    setEditingId(id);
    setFormData(data);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const addCourse = () => {
    if (!newCourse.name || !newCourse.completionDate) {
      alert("Nome do curso e data de conclusão são obrigatórios.");
      return;
    }
    const courseWithId: Course = { ...newCourse, id: Math.random().toString(36).substr(2, 9) };
    setFormData({ ...formData, courses: [...formData.courses, courseWithId] });
    setNewCourse({ name: '', completionDate: '', expiryDate: '', certificateFile: '' });
  };

  const removeCourse = (courseId: string) => {
    setFormData({ ...formData, courses: formData.courses.filter(c => c.id !== courseId) });
  };

  const handleFileUpload = (field: string, fileName: string, isCourse: boolean = false) => {
    if (isCourse) {
      setNewCourse({ ...newCourse, certificateFile: fileName });
    } else {
      setFormData({ ...formData, [field]: fileName });
    }
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

      // Detectar separador (vírgula ou ponto-e-vírgula)
      const headerLine = lines[0];
      const separator = headerLine.includes(';') ? ';' : ',';

      // Limpar BOM e espaços dos cabeçalhos
      const headers = headerLine.replace(/^\uFEFF/, '').split(separator).map(h => h.trim().toLowerCase());
      const rows = lines.slice(1);

      let countAdded = 0;
      let countUpdated = 0;

      console.log("Iniciando processamento de CSV:", { separator, headers });

      for (const row of rows) {
        const values = row.split(separator).map(v => v.trim());
        const data: any = {};
        headers.forEach((header, i) => {
          if (header) data[header] = values[i];
        });

        // Limpeza de CPF para comparação (remove tudo que não é número)
        const cpfRaw = (data.cpf || data.documento || '').replace(/\D/g, '');
        if (!cpfRaw) {
          console.warn("Linha ignorada por falta de CPF:", data);
          continue;
        }

        // Encontrar existente comparando CPFs normalizados
        const existing = collaborators.find(c => {
          const cCpf = (c.cpf || '').replace(/\D/g, '');
          return cCpf === cpfRaw;
        });

        // Função auxiliar para datas: se estiver vazio, manda null ao invés de ""
        const cleanDate = (d: string) => {
          if (!d) return null;
          // Se estiver no formato DD/MM/AAAA, tenta inverter
          if (d.includes('/') && d.split('/').length === 3) {
            const [day, month, year] = d.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          return d;
        };

        // Normalização inteligente da Função / Cargo
        const rawRole = (data.funcao || data.role || data.cargo || '').trim().toLowerCase();
        // Tenta encontrar o cargo exato na nossa lista permitida
        const matchedRole = staffFunctions.find(fn => fn.toLowerCase() === rawRole) ||
          (rawRole.includes('motorista') ? 'Motorista' :
            rawRole.includes('gerente') ? 'Gerente' :
              rawRole.includes('supervisor') ? 'Supervisor' :
                rawRole.includes('encarregado') ? 'Encarregado' :
                  rawRole.includes('batedor') ? 'Batedor' :
                    rawRole.includes('apanhador') ? 'Apanhador' : 'Motorista');

        const collabData: any = {
          name: data.nome || data.name || data.fullname || '',
          cpf: cpfRaw,
          role: matchedRole as StaffFunction,
          department: data.setor || data.department || data.departamento || 'Operacional',
          admissionDate: cleanDate(data.admissao || data.admissiondate || data.data_admissao || ''),
          lastVacationDate: cleanDate(data.ferias || data.lastvacationdate || data.data_ferias || ''),
          leasedCnpj: data.cnpj || data.leasedcnpj || data.empresa_cnpj || '',
          licenseNumber: data.cnh || data.licensenumber || data.registro_cnh || '',
          licenseCategory: data.categoria || data.licensecategory || data.categoria_cnh || 'B',
          licenseExpiry: cleanDate(data.vencimento || data.licenseexpiry || data.vencimento_cnh || ''),
          status: (data.status || 'Ativo') as any,
          phone: data.telefone || data.phone || data.contato || '',
          email: data.email || data.correio || '',
          courses: existing?.courses || [],
          // Busca Unidade por Nome ou Código
          unitId: units.find(u =>
            u.name?.toLowerCase() === (data.unidade || '').toLowerCase() ||
            u.code?.toLowerCase() === (data.unidade || '').toLowerCase() ||
            u.id === data.unitid
          )?.id || '',
          // Busca Equipe por Nome ou Número
          teamId: teams.find(t =>
            t.name?.toLowerCase() === (data.equipe || '').toLowerCase() ||
            t.number?.toLowerCase() === (data.equipe || '').toLowerCase() ||
            t.id === data.teamid
          )?.id || '',
          // Campos literais adicionais
          equipe: data.equipe || data.equipe_name || '',
          dataAdmissao: cleanDate(data.admissao || data.data_admissao || data.admissiondate || ''),
          funcao: data.funcao || data.role || data.cargo || matchedRole
        };

        try {
          if (existing) {
            console.log(`Atualizando colaborador: ${collabData.name} (CPF: ${cpfRaw})`);
            await onUpdateCollaborator({ ...existing, ...collabData });
            countUpdated++;
          } else if (collabData.name && collabData.cpf) {
            console.log(`Adicionando novo colaborador: ${collabData.name} (CPF: ${cpfRaw})`);
            await onAddCollaborator(collabData);
            countAdded++;
          }
        } catch (error) {
          console.error("ERRO CRÍTICO NA LINHA:", error, collabData);
        }
      }

      alert(`Importação concluída!\nAdicionados: ${countAdded}\nAtualizados: ${countUpdated}`);
    };
    reader.readAsText(file);
  };

  const FileUploadField = ({ label, field, currentFile, isCourse = false }: { label: string, field: string, currentFile?: string, isCourse?: boolean }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
        <div className="flex items-center gap-2">
          <input type="file" ref={inputRef} className="hidden" onChange={(e) => handleFileUpload(field, e.target.files?.[0]?.name || '', isCourse)} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`px-3 py-1.5 text-[9px] font-black rounded-lg border transition-all ${currentFile ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-gray-400 border-gray-200 hover:border-blue-400 hover:text-blue-500'
              }`}
          >
            {currentFile ? '✓ ANEXADO' : 'UPLOAD PDF'}
          </button>
        </div>
      </div>
    );
  };

  const getRoleBadge = (role: StaffFunction) => {
    switch (role) {
      case 'Gerente': return 'bg-slate-900 text-white border-slate-900';
      case 'Supervisor': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Encarregado': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Motorista': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Batedor': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Apanhador': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const [showCsvHelp, setShowCsvHelp] = useState(false);

  const csvHeaders = ['nome', 'cpf', 'funcao', 'setor', 'unidade', 'equipe', 'admissao', 'ferias', 'cnpj', 'status', 'telefone', 'email', 'cnh', 'categoria', 'vencimento'];
  const csvExample = ['João Silva', '123.456.789-00', 'Motorista', 'Logística', 'Unidade SP', 'Torre A', '2022-01-10', '2024-07-15', '12.345.678/0001-99', 'Ativo', '(11) 9.9999-9999', 'joao@empresa.com', '12345678', 'E', '2027-05-20'];

  const handleDownloadCsvTemplate = () => {
    const rows = [
      csvHeaders.join(','),
      csvExample.join(','),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_colaboradores.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Equipe Operacional</h3>
          <p className="text-sm text-gray-500 font-medium">Gestão centralizada de condutores, mecânicos e staff.</p>
        </div>
        <div className="flex gap-4">
          {collaborators.length > 0 && !showForm && (
            <button
              onClick={() => {
                if (window.confirm("ATENÇÃO: Deseja realmente excluir TODOS os colaboradores cadastrados? Esta ação não pode ser desfeita.")) {
                  onDeleteAllCollaborators();
                }
              }}
              className="px-6 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all font-black text-[10px] uppercase tracking-widest border border-red-100 shadow-sm"
            >
              Limpar Todos
            </button>
          )}
          <button
            onClick={() => setShowCsvHelp(v => !v)}
            className="flex items-center gap-2 px-4 py-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 hover:bg-amber-100 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            Formato CSV
          </button>
          <label className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Atualizar CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          </label>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest shadow-sm ${
              showInactive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {showInactive ? 'Ocultar Inativos' : 'Ver Inativos'}
          </button>
          <button
            onClick={() => showForm ? handleCancel() : setShowForm(true)}
            className={`px-6 py-3 rounded-2xl shadow-lg transition-all font-black text-xs uppercase tracking-widest ${showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
              }`}
          >
            {showForm ? 'Cancelar' : 'Novo Integrante'}
          </button>
        </div>
      </div>

      {/* Painel de ajuda para o formato CSV */}
      {showCsvHelp && (
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-black text-amber-800 text-sm uppercase tracking-widest mb-1">📋 Formato do Arquivo CSV</h4>
              <p className="text-xs text-amber-600 font-medium">A primeira linha deve conter os cabeçalhos exatamente como abaixo. O sistema usa o CPF para identificar e atualizar registros existentes.</p>
            </div>
            <button onClick={handleDownloadCsvTemplate} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shrink-0 ml-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
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

          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { campo: 'funcao', valores: 'Motorista, Mecânico, Ajudante, Gestor, Administrativo, Operador de Torre' },
              { campo: 'status', valores: 'Ativo, Inativo, Em Viagem, Férias, Afastado' },
              { campo: 'categoria', valores: 'A, B, C, D, E, AB, AC, AD, AE' },
              { campo: 'admissao / ferias / vencimento', valores: 'Formato: AAAA-MM-DD (ex: 2024-07-15)' },
              { campo: 'unidade', valores: 'Nome exato da unidade cadastrada no sistema' },
              { campo: 'equipe', valores: 'Nome exato da equipe cadastrada no sistema' },
            ].map(item => (
              <div key={item.campo} className="bg-white rounded-xl p-3 border border-amber-100">
                <p className="font-black text-amber-700 uppercase text-[9px] mb-1">{item.campo}</p>
                <p className="text-[9px] text-gray-500 leading-relaxed">{item.valores}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-blue-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="flex flex-col lg:flex-row gap-10 items-start">
              {/* Foto do Colaborador */}
              <div className="flex flex-col items-center gap-4">
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="w-40 h-40 bg-gray-50 border-4 border-dashed border-gray-100 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-all group relative"
                >
                  {formData.profilePhoto ? (
                    <img src={formData.profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-300 group-hover:text-blue-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      <span className="text-[8px] font-black mt-2">ADICIONAR FOTO</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-[9px] font-black uppercase">Alterar Foto</span>
                  </div>
                </div>
                <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Identificação da Equipe</p>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="md:col-span-2 lg:col-span-3 border-b border-gray-50 pb-2 mb-2">
                  <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Dados do Colaborador</h5>
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Nome Completo *</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">CPF *</label>
                  <input
                    type="text" required placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Função / Cargo *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffFunction })}
                    className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-600"
                  >
                    {staffFunctions.map(fn => <option key={fn} value={fn}>{fn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Setor / Departamento</label>
                  <input
                    type="text" placeholder="Ex: Logística, Oficina..."
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Unidade Operacional</label>
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                  >
                    <option value="">Selecione uma Unidade</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Equipe / Torre</label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                  >
                    <option value="">Selecione uma Equipe</option>
                    {teams.filter(t => !formData.unitId || t.unitId === formData.unitId).map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.number})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Data de Admissão</label>
                  <input
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Última Férias Gozada</label>
                  <input
                    type="date"
                    value={formData.lastVacationDate}
                    onChange={(e) => setFormData({ ...formData, lastVacationDate: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">CNPJ Locado</label>
                  <input
                    type="text" placeholder="00.000.000/0000-00"
                    value={formData.leasedCnpj}
                    onChange={(e) => setFormData({ ...formData, leasedCnpj: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                  />
                </div>

                {/* CAMPOS ESPECÍFICOS DE MOTORISTA */}
                {formData.role === 'Motorista' && (
                  <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 animate-in slide-in-from-top-2">
                    <div className="md:col-span-3">
                      <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Dados de Habilitação Profissional</h5>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Nº Registro CNH *</label>
                      <input
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Categoria *</label>
                      <select
                        value={formData.licenseCategory}
                        onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black"
                      >
                        {['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Vencimento CNH *</label>
                      <input
                        type="date"
                        value={formData.licenseExpiry}
                        onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-bold"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Status Operacional</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-700"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Em Viagem">Em Viagem</option>
                    <option value="Férias">Férias</option>
                    <option value="Afastado">Afastado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Telefone Direto</label>
                  <input
                    type="text" placeholder="(00) 0.0000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">E-mail Corporativo</label>
                  <input
                    type="email" placeholder="email@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <h5 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-widest">
                Treinamentos e Qualificações
              </h5>

              <div className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Curso / Certificação</label>
                    <input type="text" placeholder="MOPP, NR-12, Manutenção..." value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })} className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Conclusão</label>
                    <input type="date" value={newCourse.completionDate} onChange={(e) => setNewCourse({ ...newCourse, completionDate: e.target.value })} className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Validade</label>
                    <input type="date" value={newCourse.expiryDate} onChange={(e) => setNewCourse({ ...newCourse, expiryDate: e.target.value })} className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <FileUploadField label="Documento PDF" field="certificateFile" currentFile={newCourse.certificateFile} isCourse />
                    </div>
                    <button type="button" onClick={addCourse} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                  </div>
                </div>

                {formData.courses.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {formData.courses.map((c) => (
                      <div key={c.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                          </div>
                          <div>
                            <span className="text-xs font-black text-gray-700 uppercase">{c.name}</span>
                            <p className="text-[9px] text-gray-400 font-bold">VENCE EM: {c.expiryDate ? formatSafeDate(c.expiryDate) : 'N/A'}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeCourse(c.id)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-50">
              <button
                type="submit"
                className="px-16 py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-2xl shadow-blue-100"
              >
                {editingId ? 'Salvar Alterações' : 'Finalizar Cadastro da Equipe'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campo de Consultas */}
      {!showForm && (
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Consultar por Nome, CPF, Função ou Equipe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[24px] shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-gray-700 placeholder:text-gray-400 transition-all uppercase text-xs tracking-widest"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-300 hover:text-red-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Grid da Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collaborators
          .filter(c => {
            // Se showInactive for falso, oculta os inativos
            const statusStr = (c.status || 'Ativo').toString().toLowerCase().trim();
            const isInactive = ['inativo', 'inativa', 'desativado', 'desligado'].includes(statusStr);
            if (!showInactive && isInactive) return false;

            const term = searchTerm.trim();
            if (!term) return true;
            
            const termLower = term.toLowerCase();
            const isNumeric = /^\d+$/.test(term);
            
            const team = teams.find(t => t.id === c.teamId);
            const teamNumber = (team?.number || c.equipe || '').toString();
            
            if (isNumeric) {
              // Verifica se o número digitado existe como número de equipe em QUALQUER lugar da base
              const existsAsTeamNumber = teams.some(t => t.number === term) || 
                                       collaborators.some(col => col.equipe === term);
              
              if (existsAsTeamNumber) {
                // Se o termo existe como número de equipe, mostramos SOMENTE os dessa equipe
                return teamNumber === term;
              }
              
              // Se não for um número de equipe conhecido, busca no CPF
              const cpfNumbers = c.cpf.replace(/\D/g, '');
              return cpfNumbers.includes(term);
            }

            // Busca por texto (Nome, Função, Setor, Nome da Equipe)
            return (
              c.name.toLowerCase().includes(termLower) ||
              c.role.toLowerCase().includes(termLower) ||
              (c.funcao && c.funcao.toLowerCase().includes(termLower)) ||
              (team?.name || '').toLowerCase().includes(termLower) ||
              (c.department && c.department.toLowerCase().includes(termLower))
            );
          })
          .map((collab) => {
          const isDriver = collab.role === 'Motorista';
          const isExpiring = isDriver && collab.licenseExpiry && new Date(collab.licenseExpiry).getTime() < new Date().getTime() + (30 * 24 * 60 * 60 * 1000);

          return (
            <div key={collab.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 opacity-5 ${collab.status === 'Ativo' ? 'bg-emerald-500' : 'bg-gray-500'
                }`} />

              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 border-2 border-white shadow-md overflow-hidden shrink-0">
                  {collab.profilePhoto ? <img src={collab.profilePhoto} alt={collab.name} className="w-full h-full object-cover" /> : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-800 text-lg leading-tight truncate">{collab.name}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${getRoleBadge(collab.role)}`}>
                      {collab.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${collab.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                      {collab.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex flex-col gap-1 text-[10px] font-bold text-gray-400 mb-2">
                  <div className="flex justify-between">
                    <span>Unid: <span className="text-gray-700">{units.find(u => u.id === collab.unitId)?.name || 'N/A'}</span></span>
                    <span>Equipe: <span className="text-blue-600">{teams.find(t => t.id === collab.teamId)?.name || 'N/A'}</span></span>
                  </div>
                  <span>CNPJ Locado: <span className="text-gray-700">{collab.leasedCnpj || 'N/A'}</span></span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {isDriver ? (
                    <div className={`p-3 rounded-2xl border ${isExpiring ? 'bg-red-50 border-red-100' : 'bg-blue-50/30 border-blue-100'}`}>
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter mb-1">CNH ({collab.licenseCategory})</p>
                      <p className={`text-xs font-black ${isExpiring ? 'text-red-600' : 'text-blue-700'}`}>
                        {collab.licenseExpiry ? formatSafeDate(collab.licenseExpiry) : 'Não inf.'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Última Férias</p>
                      <p className="text-xs font-black text-gray-700">
                        {collab.lastVacationDate ? formatSafeDate(collab.lastVacationDate) : 'N/A'}
                      </p>
                    </div>
                  )}
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Certificações</p>
                    <p className="text-xs font-black text-indigo-600">{collab.courses.length} Ativos</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 relative z-10">
                <button
                  onClick={() => setSelectedBadgeCollaborator(collab)}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M8 12h8" /><path d="M8 16h8" /><path d="M8 8h3" /></svg>
                  Identificação
                </button>
                <button onClick={() => handleEdit(collab)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all" title="Editar">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                 </button>
                 <button 
                  onClick={() => {
                    if (collab.status === 'Inativo') {
                      onUpdateCollaborator({ ...collab, status: 'Ativo' });
                    } else if (window.confirm(`Deseja realmente inativar o colaborador ${collab.name}?`)) {
                      onUpdateCollaborator({ ...collab, status: 'Inativo' });
                    }
                  }} 
                  className={`p-3 rounded-xl transition-all ${
                    collab.status === 'Inativo' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white' : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'
                  }`}
                  title={collab.status === 'Inativo' ? 'Ativar Colaborador' : 'Inativar Colaborador'}
                 >
                   {collab.status === 'Inativo' ? (
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7"/></svg>
                   ) : (
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                   )}
                 </button>
                 <button onClick={() => onDeleteCollaborator(collab.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Excluir Permanentemente">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DO CRACHÁ DIGITAL (Reutilizando estrutura anterior mas adaptada para roles) */}
      {selectedBadgeCollaborator && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-[320px] h-[500px] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-gray-200 animate-in zoom-in-95 duration-300">
              <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16" />
                <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px] font-black text-white">FC</div>
                  <span className="text-white text-xs font-black tracking-widest">FROTACONTROL</span>
                </div>
                <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.4em] relative z-10">Torre de Controle Logística</p>
              </div>

              <div className="flex-1 flex flex-col items-center pt-8 pb-4 px-8 text-center">
                <div className={`w-32 h-32 rounded-full border-4 p-1 shadow-xl mb-6 ${selectedBadgeCollaborator.status === 'Ativo' ? 'border-emerald-500' : 'border-blue-500'
                  }`}>
                  <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden">
                    {selectedBadgeCollaborator.profilePhoto ? (
                      <img src={selectedBadgeCollaborator.profilePhoto} alt={selectedBadgeCollaborator.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      </div>
                    )}
                  </div>
                </div>

                <h4 className="text-2xl font-black text-slate-900 leading-tight mb-1">{selectedBadgeCollaborator.name.split(' ')[0]}</h4>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6">{selectedBadgeCollaborator.role}</p>

                <div className="w-full grid grid-cols-2 gap-4 text-left border-t border-gray-100 pt-6">
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Identificação</p>
                    <p className="text-[11px] font-black text-slate-800">***.{selectedBadgeCollaborator.cpf.split('.')[1] || '000'}.***</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Setor</p>
                    <p className="text-[11px] font-black text-slate-800 uppercase">{selectedBadgeCollaborator.department}</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-dashed border-gray-200 w-full flex justify-center">
                  <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><rect width="8" height="8" x="2" y="2" rx="1" /><rect width="8" height="8" x="14" y="2" rx="1" /><rect width="8" height="8" x="2" y="14" rx="1" /><rect width="4" height="4" x="14" y="14" rx="1" /></svg>
                  </div>
                </div>
              </div>

              <div className={`p-4 text-center ${selectedBadgeCollaborator.status === 'Ativo' ? 'bg-emerald-500' : 'bg-blue-600'
                }`}>
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{selectedBadgeCollaborator.status}</span>
              </div>
            </div>

            <div className="absolute -right-20 top-0 flex flex-col gap-4">
              <button onClick={() => window.print()} className="p-4 bg-white rounded-2xl shadow-xl text-slate-800 hover:bg-slate-50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></svg>
              </button>
              <button onClick={() => setSelectedBadgeCollaborator(null)} className="p-4 bg-red-500 rounded-2xl shadow-xl text-white hover:bg-red-600 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
