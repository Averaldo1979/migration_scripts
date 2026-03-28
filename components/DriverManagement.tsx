
import React, { useState, useRef } from 'react';
import { Driver, Course } from '../types';

interface DriverManagementProps {
  drivers: Driver[];
  onAddDriver: (driver: Omit<Driver, 'id'>) => void;
  onUpdateDriver: (driver: Driver) => void;
  onDeleteDriver: (id: string) => void;
}

const DriverManagement: React.FC<DriverManagementProps> = ({ drivers, onAddDriver, onUpdateDriver, onDeleteDriver }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBadgeDriver, setSelectedBadgeDriver] = useState<Driver | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Added missing properties 'role' and 'department' to satisfy the Collaborator interface (which is the Driver type)
  const initialFormData: Omit<Driver, 'id'> = {
    name: '',
    cpf: '',
    role: 'Motorista',
    department: 'Operacional',
    licenseNumber: '',
    licenseCategory: 'B',
    licenseExpiry: '',
    status: 'Ativo',
    phone: '',
    email: '',
    courses: [],
    profilePhoto: '',
    licenseFile: '',
    salary: 0
  };

  const [formData, setFormData] = useState<Omit<Driver, 'id'>>(initialFormData);
  const [newCourse, setNewCourse] = useState<Omit<Course, 'id'>>({ name: '', completionDate: '', expiryDate: '', certificateFile: '' });

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
    if (!formData.name || !formData.licenseNumber || !formData.licenseExpiry) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    if (editingId) {
      onUpdateDriver({ id: editingId, ...formData });
    } else {
      onAddDriver(formData);
    }

    handleCancel();
  };

  const handleEdit = (driver: Driver) => {
    const { id, ...data } = driver;
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
                    className={`px-3 py-1.5 text-[9px] font-black rounded-lg border transition-all ${
                        currentFile ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-gray-400 border-gray-200 hover:border-blue-400 hover:text-blue-500'
                    }`}
                >
                    {currentFile ? '✓ ANEXADO' : 'FAZER UPLOAD'}
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Prontuário de Motoristas</h3>
          <p className="text-sm text-gray-500">Gestão de condutores, documentos e identificação.</p>
        </div>
        <button 
          onClick={() => showForm ? handleCancel() : setShowForm(true)}
          className={`px-6 py-2.5 rounded-xl shadow-lg transition-all font-bold text-xs uppercase tracking-widest ${
            showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showForm ? 'Cancelar' : 'Novo Motorista'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-10 rounded-[40px] shadow-xl border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="flex flex-col lg:flex-row gap-10 items-start">
               {/* Foto do Motorista */}
               <div className="flex flex-col items-center gap-4">
                  <div 
                    onClick={() => photoInputRef.current?.click()}
                    className="w-40 h-40 bg-gray-50 border-4 border-dashed border-gray-100 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-all group relative"
                  >
                    {formData.profilePhoto ? (
                      <img src={formData.profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-gray-300 group-hover:text-blue-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span className="text-[8px] font-black mt-2">FOTO 3X4</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <span className="text-white text-[9px] font-black uppercase">Alterar Foto</span>
                    </div>
                  </div>
                  <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Identificação Biométrica</p>
               </div>

               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="md:col-span-2 lg:col-span-3 border-b border-gray-50 pb-2 mb-2">
                      <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Dados do Condutor</h5>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Nome Completo *</label>
                    <input 
                      type="text" placeholder="Nome completo do colaborador"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">CPF</label>
                    <input 
                      type="text" placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Registro CNH *</label>
                    <input 
                      type="text" placeholder="Nº Registro"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Categoria *</label>
                    <select 
                      value={formData.licenseCategory}
                      onChange={(e) => setFormData({...formData, licenseCategory: e.target.value})}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black"
                    >
                      {['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Vencimento CNH *</label>
                    <input 
                      type="date"
                      value={formData.licenseExpiry}
                      onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Status</label>
                    <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-700"
                    >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                        <option value="Em Viagem">Em Viagem</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Telefone</label>
                    <input 
                      type="text" placeholder="(00) 0.0000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">E-mail</label>
                    <input 
                      type="email" placeholder="email@empresa.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Remuneração (R$)</label>
                    <input 
                      type="number" step="0.01" placeholder="0,00"
                      value={formData.salary || ''}
                      onChange={(e) => setFormData({...formData, salary: parseFloat(e.target.value) || 0})}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-emerald-600"
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
                        <input type="text" placeholder="MOPP, Carga Pesada..." value={newCourse.name} onChange={(e) => setNewCourse({...newCourse, name: e.target.value})} className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Conclusão</label>
                        <input type="date" value={newCourse.completionDate} onChange={(e) => setNewCourse({...newCourse, completionDate: e.target.value})} className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Validade</label>
                        <input type="date" value={newCourse.expiryDate} onChange={(e) => setNewCourse({...newCourse, expiryDate: e.target.value})} className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-sm" />
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="flex-1">
                           <FileUploadField label="Anexo PDF" field="certificateFile" currentFile={newCourse.certificateFile} isCourse />
                        </div>
                        <button type="button" onClick={addCourse} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                     </div>
                  </div>

                  {formData.courses.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {formData.courses.map((c) => (
                            <div key={c.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                                    </div>
                                    <div>
                                      <span className="text-xs font-black text-gray-700 uppercase">{c.name}</span>
                                      <p className="text-[9px] text-gray-400 font-bold">VENCE: {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => removeCourse(c.id)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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
                 className="px-16 py-5 bg-blue-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-2xl shadow-blue-100"
               >
                 {editingId ? 'Salvar Alterações' : 'Concluir Cadastro de Operador'}
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Motoristas Reestilizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver) => {
            const isExpiring = new Date(driver.licenseExpiry).getTime() < new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
            return (
              <div key={driver.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 opacity-5 ${
                    driver.status === 'Ativo' ? 'bg-emerald-500' : driver.status === 'Em Viagem' ? 'bg-blue-500' : 'bg-gray-500'
                }`} />
                
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 border-2 border-white shadow-md overflow-hidden shrink-0">
                        {driver.profilePhoto ? <img src={driver.profilePhoto} alt={driver.name} className="w-full h-full object-cover" /> : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-black text-gray-800 text-lg leading-tight truncate">{driver.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                                driver.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 
                                driver.status === 'Em Viagem' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {driver.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3 rounded-2xl border ${isExpiring ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">CNH ({driver.licenseCategory})</p>
                            <p className={`text-xs font-black ${isExpiring ? 'text-red-600' : 'text-gray-700'}`}>{new Date(driver.licenseExpiry).toLocaleDateString()}</p>
                        </div>
                        <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Cursos</p>
                            <p className="text-xs font-black text-blue-600">{driver.courses.length} Ativos</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 relative z-10">
                    <button 
                      onClick={() => setSelectedBadgeDriver(driver)}
                      className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M8 16h8"/><path d="M8 8h3"/></svg>
                      Gerar Crachá
                    </button>
                    <button onClick={() => handleEdit(driver)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button onClick={() => onDeleteDriver(driver.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
              </div>
            );
        })}
      </div>

      {/* MODAL DO CRACHÁ DIGITAL */}
      {selectedBadgeDriver && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative">
                {/* Crachá Físico Simulado */}
                <div className="w-[320px] h-[500px] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-gray-200 animate-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16" />
                        <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
                            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px] font-black text-white">FC</div>
                            <span className="text-white text-xs font-black tracking-widest">FROTACONTROL</span>
                        </div>
                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.4em] relative z-10">Torre de Controle Logística</p>
                    </div>

                    {/* Corpo */}
                    <div className="flex-1 flex flex-col items-center pt-8 pb-4 px-8 text-center">
                        <div className={`w-32 h-32 rounded-full border-4 p-1 shadow-xl mb-6 ${
                            selectedBadgeDriver.status === 'Ativo' ? 'border-emerald-500' : 'border-blue-500'
                        }`}>
                            <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden">
                                {selectedBadgeDriver.profilePhoto ? (
                                    <img src={selectedBadgeDriver.profilePhoto} alt={selectedBadgeDriver.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    </div>
                                )}
                            </div>
                        </div>

                        <h4 className="text-2xl font-black text-slate-900 leading-tight mb-1">{selectedBadgeDriver.name.split(' ')[0]}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Condutor Profissional</p>

                        <div className="w-full grid grid-cols-2 gap-4 text-left border-t border-gray-100 pt-6">
                            <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Identificação</p>
                                <p className="text-[11px] font-black text-slate-800">***.{selectedBadgeDriver.cpf.split('.')[1] || '000'}.***</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Categoria</p>
                                <p className="text-[11px] font-black text-slate-800">CNH {selectedBadgeDriver.licenseCategory}</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-dashed border-gray-200 w-full flex justify-center">
                            <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center p-2">
                                {/* Simulação de QR Code */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2"><rect width="8" height="8" x="2" y="2" rx="1"/><rect width="8" height="8" x="14" y="2" rx="1"/><rect width="8" height="8" x="2" y="14" rx="1"/><rect width="4" height="4" x="14" y="14" rx="1"/><rect width="4" height="4" x="20" y="20" rx="1"/></svg>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={`p-4 text-center ${
                         selectedBadgeDriver.status === 'Ativo' ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}>
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{selectedBadgeDriver.status}</span>
                    </div>
                </div>

                {/* Ações do Modal */}
                <div className="absolute -right-20 top-0 flex flex-col gap-4">
                    <button 
                      onClick={() => window.print()}
                      className="p-4 bg-white rounded-2xl shadow-xl text-slate-800 hover:bg-slate-50 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                    </button>
                    <button 
                      onClick={() => setSelectedBadgeDriver(null)}
                      className="p-4 bg-red-500 rounded-2xl shadow-xl text-white hover:bg-red-600 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
