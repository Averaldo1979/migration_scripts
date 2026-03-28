
import React, { useState } from 'react';
import { Supplier, SupplierCategory } from '../types';

interface SupplierManagementProps {
  suppliers: Supplier[];
  categories: SupplierCategory[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
}

const SupplierManagement: React.FC<SupplierManagementProps> = ({ 
  suppliers, 
  categories,
  onAddSupplier, 
  onUpdateSupplier, 
  onDeleteSupplier,
  onAddCategory,
  onDeleteCategory
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
    name: '',
    cnpj: '',
    category: 'Oficina',
    contactName: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cnpj) {
      alert("Nome e CNPJ são obrigatórios.");
      return;
    }
    if (editingId) {
      onUpdateSupplier({ id: editingId, ...formData });
    } else {
      onAddSupplier(formData);
    }
    handleCancel();
  };

  const handleEdit = (s: Supplier) => {
    const { id, ...data } = s;
    setEditingId(id);
    setFormData(data);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      cnpj: '',
      category: categories[0]?.name || 'Outros',
      contactName: '',
      phone: '',
      email: '',
      address: ''
    });
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'Oficina': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Posto': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Lava-jato': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Peças': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Borracharia': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const handleAddCategoryLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim());
    setNewCatName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Hub de Fornecedores</h3>
          <p className="text-sm text-gray-500">Gestão de parceiros e prestadores de serviço.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCatManager(true)}
            className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Categorias
          </button>
          <button 
            onClick={() => showForm ? handleCancel() : setShowForm(true)}
            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              showForm ? 'bg-gray-200 text-gray-700' : 'bg-slate-900 text-white shadow-lg hover:bg-black'
            }`}
          >
            {showForm ? 'Cancelar' : 'Novo Fornecedor'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Razão Social / Nome Fantasia *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CNPJ *</label>
                <input type="text" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold" placeholder="00.000.000/0001-00" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Categoria *</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black">
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome do Contato</label>
                <input type="text" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Telefone</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
              </div>
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Endereço Completo</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="submit" className="px-16 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                {editingId ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showCatManager && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 animate-in zoom-in-95 duration-200">
              <h4 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">Gerenciar Categorias</h4>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8 border-b pb-4">Personalize os tipos de fornecedores</p>
              
              <form onSubmit={handleAddCategoryLocal} className="flex gap-2 mb-8">
                 <input 
                   type="text" 
                   value={newCatName} 
                   onChange={e => setNewCatName(e.target.value)} 
                   placeholder="Nova Categoria..."
                   className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                 />
                 <button type="submit" className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                 </button>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto mb-8 pr-2 custom-scrollbar">
                 {categories.map(cat => (
                   <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all">
                      <span className="text-sm font-black text-gray-700 uppercase">{cat.name}</span>
                      <button onClick={() => onDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600 transition-all">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                   </div>
                 ))}
              </div>

              <button 
                onClick={() => setShowCatManager(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
              >
                Concluir
              </button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getCategoryColor(s.category)}`}>
                {s.category}
              </span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                <button onClick={() => onDeleteSupplier(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
              </div>
            </div>
            <h4 className="text-lg font-black text-gray-800 leading-tight mb-2">{s.name}</h4>
            <div className="space-y-3">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  </div>
                  <span className="text-xs font-black text-slate-500 font-mono tracking-tighter">{s.cnpj}</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase">Falar com {s.contactName}</p>
                    <p className="text-xs font-bold text-slate-800">{s.phone}</p>
                  </div>
               </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-50 flex items-start gap-3">
               <div className="mt-1 text-gray-300"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>
               <p className="text-[10px] text-gray-400 font-bold leading-relaxed">{s.address}</p>
            </div>
          </div>
        ))}
      </div>
      {suppliers.length === 0 && <div className="p-20 text-center text-gray-300 italic">Nenhum fornecedor cadastrado.</div>}
    </div>
  );
};

export default SupplierManagement;
