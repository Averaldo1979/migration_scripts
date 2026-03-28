
import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName: string;
  onLogout: () => void;
  isSyncing: boolean;
  userRole?: string;
  allowedMenus?: string[];
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, userName, onLogout, isSyncing, userRole, allowedMenus }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Fecha sidebar quando muda de aba (mobile)
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // Fecha sidebar e avatar-menu ao pressionar Escape ou clicar fora
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSidebarOpen(false); setAvatarMenuOpen(false); }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as any);
    return () => {
      document.removeEventListener('keydown', handler);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, []);

  // Previne scroll do body quando sidebar aberta
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const assetSubItems = [
    { id: 'dashboard', label: 'Painel Estratégico', icon: ICONS.Dashboard },
    { id: 'fleet', label: 'Gestão de Ativos', icon: ICONS.Truck },
    { id: 'odometer', label: 'Portaria & KM', icon: ICONS.Odometer },
    { id: 'fuel', label: 'Combustível', icon: ICONS.Fuel },
    { id: 'maintenance', label: 'Manutenção', icon: ICONS.Wrench },
    {
      id: 'equipment_maintenance', label: 'Ativos Industriais', icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>
      )
    },
    { id: 'washing', label: 'Estética & Lavagem', icon: ICONS.Sparkles },
    { id: 'tyres', label: 'Gestão de Pneus', icon: ICONS.Tyre },
    { id: 'suppliers', label: 'Hub de Parceiros', icon: ICONS.Partners },
    { id: 'units', label: 'Unidades', icon: ICONS.Building },
    {
      id: 'teams', label: 'Equipes', icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
      )
    },
    {
      id: 'team_values', label: 'Cadastro Valores', icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
      )
    },
    {
      id: 'cargas', label: 'Registro de Cargas', icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
      )
    },
    { id: 'drivers', label: 'Colaboradores', icon: ICONS.Users },
    {
      id: 'users', label: 'Config. Acessos', icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
      )
    },
    {
      id: 'hr', label: 'Recursos Humanos', icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" /></svg>
      )
    },
    { id: 'checklist', label: 'Conformidade', icon: ICONS.Check },
    { id: 'alerts', label: 'Auditoria Docs', icon: ICONS.Alert },
    { id: 'epi', label: 'Segurança/EPI', icon: ICONS.PPE },
  ];

  const filteredItems = assetSubItems.filter(
    item => userRole === 'Administrador' || (allowedMenus && allowedMenus.includes(item.id))
  );

  const activeLabel = assetSubItems.find(i => i.id === activeTab)?.label || 'Visão Geral';

  const handleSafeLogout = () => {
    if (window.confirm('Deseja realmente encerrar sua sessão?')) {
      onLogout();
    }
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 flex flex-col items-center gap-3 bg-cca-primary relative overflow-hidden shrink-0">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-cca-primary font-black text-lg shadow-xl shadow-black/20 z-10">CCA</div>
        <div className="text-center z-10">
          <span className="block font-black text-white tracking-widest text-xs uppercase">FrotaControl</span>
          <span className="block text-[8px] text-white/60 font-bold uppercase mt-0.5 tracking-[0.2em]">Torre de Controle</span>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar">
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === item.id
                ? 'bg-cca-primary text-white shadow-xl shadow-cca-primary/20'
                : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <item.icon />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 shrink-0">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-[10px] font-black border border-indigo-100 shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">Nível Direção</p>
            <p className="text-[10px] font-black text-gray-800 truncate">{userName}</p>
          </div>
        </div>
        <button
          onClick={handleSafeLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black text-red-500 hover:bg-red-50 hover:text-red-600 transition-all uppercase tracking-widest group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
          Encerrar Sessão
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-cca-light flex">

      {/* ── SIDEBAR DESKTOP (lg+) ───────────────────────── */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0 sticky top-0 h-screen z-30">
        <SidebarContent />
      </aside>

      {/* ── SIDEBAR MOBILE: OVERLAY ─────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR MOBILE: DRAWER ──────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Botão fechar drawer */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 text-white z-10 hover:bg-white/30 transition"
          aria-label="Fechar menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <SidebarContent />
      </aside>

      {/* ── CONTEÚDO PRINCIPAL ──────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm px-4 md:px-8 py-3 flex items-center gap-4">
          {/* Hamburguer (apenas mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 shrink-0"
            aria-label="Abrir menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-cca-primary rounded-lg flex items-center justify-center text-white font-black text-[10px]">CCA</div>
            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">FrotaControl</span>
          </div>

          {/* Título da aba ativa */}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm md:text-lg font-black text-slate-800 uppercase tracking-tight truncate">
              {activeLabel}
            </h1>
            {isSyncing && (
              <p className="text-[9px] text-blue-500 font-black uppercase animate-pulse tracking-widest">Sincronizando...</p>
            )}
          </div>

          {/* Status online (desktop) */}
          <div className="hidden md:flex items-center gap-2 text-right shrink-0">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase">Status</p>
              <p className="text-xs font-bold text-emerald-500 flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                Online
              </p>
            </div>
          </div>

          {/* Avatar usuário (mobile) — toque abre menu de logout */}
          <div className="lg:hidden shrink-0 relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarMenuOpen(prev => !prev)}
              className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-[11px] font-black border-2 border-indigo-200 active:scale-95 transition-transform shadow-sm"
              aria-label="Menu do usuário"
            >
              {userName.charAt(0).toUpperCase()}
            </button>

            {/* Dropdown */}
            {avatarMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in">
                {/* Info do usuário */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Sessão ativa</p>
                  <p className="text-xs font-black text-gray-800 truncate">{userName}</p>
                </div>
                {/* Botão encerrar */}
                <button
                  onClick={() => { setAvatarMenuOpen(false); handleSafeLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors uppercase tracking-widest group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-active:translate-x-1 transition-transform shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                  Encerrar Sessão
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-16 overflow-x-hidden">
          {children}
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        @media (max-width: 1023px) {
          table { font-size: 12px; }
          .px-8 { padding-left: 1rem !important; padding-right: 1rem !important; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
