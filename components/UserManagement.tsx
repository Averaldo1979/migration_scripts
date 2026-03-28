
import React, { useState } from 'react';
import { User, UserRole, Team } from '../types';

interface UserManagementProps {
  users: User[];
  teams: Team[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

const AVAILABLE_MENUS = [
  { id: 'dashboard', label: 'Painel Estratégico' },
  { id: 'board', label: 'Painel Logístico' },
  { id: 'cargo_entry', label: 'Gestão de Cargas' },
  { id: 'fleet', label: 'Gestão de Ativos' },
  { id: 'odometer', label: 'Portaria & KM' },
  { id: 'fuel', label: 'Combustível' },
  { id: 'maintenance', label: 'Manutenção' },
  { id: 'equipment_maintenance', label: 'Ativos Industriais' },
  { id: 'washing', label: 'Estética & Lavagem' },
  { id: 'tyres', label: 'Gestão de Pneus' },
  { id: 'suppliers', label: 'Hub de Parceiros' },
  { id: 'units', label: 'Unidades' },
  { id: 'teams', label: 'Equipes' },
  { id: 'drivers', label: 'Colaboradores' },
  { id: 'users', label: 'Config. Acessos' },
  { id: 'hr', label: 'Recursos Humanos' },
  { id: 'checklist', label: 'Conformidade' },
  { id: 'alerts', label: 'Auditoria Docs' },
  { id: 'epi', label: 'Segurança/EPI' },
];

const UserManagement: React.FC<UserManagementProps> = ({ users, teams, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
    username: '',
    password: '',
    role: UserRole.OPERATOR,
    status: 'Ativo',
    allowedMenus: [],
    allowedTeams: []
  });

  const toggleTeam = (teamNumber: string) => {
    setFormData(prev => {
      const teams = prev.allowedTeams || [];
      return {
        ...prev,
        allowedTeams: teams.includes(teamNumber)
          ? teams.filter(num => num !== teamNumber)
          : [...teams, teamNumber]
      };
    });
  };

  const toggleMenu = (menuId: string) => {
    setFormData(prev => {
      const menus = prev.allowedMenus || [];
      return {
        ...prev,
        allowedMenus: menus.includes(menuId)
          ? menus.filter(id => id !== menuId)
          : [...menus, menuId]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.username) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    if (!editingId && !formData.password) {
      alert("Defina uma senha para o novo usuário.");
      return;
    }

    if (editingId) {
      onUpdateUser({ id: editingId, ...formData });
    } else {
      onAddUser(formData);
    }

    handleCancel();
  };

  const handleEdit = (user: User) => {
    const { id, ...data } = user;
    setEditingId(id);
    setFormData({
      ...data,
      password: '' // Manter vazio por segurança
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', email: '', username: '', password: '', role: UserRole.OPERATOR, status: 'Ativo', allowedMenus: [], allowedTeams: [] });
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-slate-900 text-white';
      case UserRole.MANAGER: return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-blue-50 text-blue-600';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Gestão de Acessos</h3>
          <p className="text-sm text-gray-500 font-medium">Controle de credenciais e permissões da torre.</p>
        </div>
        <button
          onClick={() => showForm ? handleCancel() : setShowForm(true)}
          className={`px-6 py-3 rounded-2xl shadow-lg transition-all font-black text-xs uppercase tracking-widest ${showForm ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
            }`}
        >
          {showForm ? 'Cancelar' : 'Novo Usuário'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-blue-50 animate-in slide-in-from-top-4 duration-300">
          <h4 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            </div>
            {editingId ? 'Editar Credencial' : 'Novo Acesso'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome Completo *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" required />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">E-mail Corporativo *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" required />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Usuário (Login) *</label>
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full p-4 bg-white border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-600" required />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Senha *</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full p-4 bg-white border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder={editingId ? "Manter atual" : "••••••••"} />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Nível</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black">
                  {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black">
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-4">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Restringir a Equipes Específicas (Opcional)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 bg-white border border-blue-50 p-6 rounded-[24px]">
                  <label className="flex items-center gap-2 cursor-pointer group col-span-full mb-2 border-b border-blue-50 pb-2">
                    <input 
                      type="checkbox" 
                      checked={!formData.allowedTeams || formData.allowedTeams.length === 0}
                      onChange={() => setFormData({ ...formData, allowedTeams: [] })}
                      className="w-4 h-4 rounded text-blue-600 border-gray-300"
                    />
                    <span className="text-xs font-black text-blue-600 uppercase">Acesso Total (Todas as Equipes)</span>
                  </label>
                  {teams.map(t => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.allowedTeams?.includes(t.number) || false}
                        onChange={() => toggleTeam(t.number)}
                        className="w-4 h-4 rounded text-blue-600 border-gray-300"
                      />
                      <span className="text-[11px] font-bold text-gray-600 group-hover:text-blue-600 transition-colors">Eq. {t.number}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-blue-400 mt-2 italic font-bold">* Se nenhuma for selecionada, o usuário terá acesso a todas as equipes.</p>
              </div>
              <div className="md:col-span-2 space-y-4">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Permissões de Acesso (Menus)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  {AVAILABLE_MENUS.map(menu => (
                    <label key={menu.id} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.role === UserRole.ADMIN || (formData.allowedMenus?.includes(menu.id) || false)}
                        onChange={() => toggleMenu(menu.id)}
                        disabled={formData.role === UserRole.ADMIN}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                      />
                      <span className={`text-xs font-bold transition-colors ${formData.role === UserRole.ADMIN ? 'text-gray-400' : 'text-gray-700 group-hover:text-blue-600'}`}>{menu.label}</span>
                    </label>
                  ))}
                </div>
                {formData.role === UserRole.ADMIN && <p className="text-[10px] text-gray-400 italic font-bold">* Administradores têm acesso total ao sistema por padrão.</p>}
              </div>
            </div>
            <div className="flex justify-end pt-8 border-t border-gray-50">
              <button type="submit" className="px-16 py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-2xl">
                {editingId ? 'Confirmar Alteração' : 'Finalizar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador / Login</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Nível</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Escopo</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs uppercase">{(user.name || '').charAt(0)}</div>
                      <div className="flex flex-col">
                                 <span className="font-black text-gray-800 text-sm uppercase">{(user.name || '---').toUpperCase()}</span>
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mt-1">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${getRoleBadge(user.role)}`}>{user.role}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${user.allowedTeams && user.allowedTeams.length > 0 ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {user.allowedTeams && user.allowedTeams.length > 0 
                        ? (user.allowedTeams.length === 1 ? `Equipe ${user.allowedTeams[0]}` : `${user.allowedTeams.length} Equipes`) 
                        : 'Acesso Total'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${user.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                     {user.status || 'INATIVO'}
                                   </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg></button>
                      <button onClick={() => onDeleteUser(user.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
