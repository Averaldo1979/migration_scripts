
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import FleetManagement from './components/FleetManagement';
import TeamManagement from './components/TeamManagement';
import TeamRegistry from './components/TeamRegistry';
import FuelManagement from './components/FuelManagement';
import MaintenanceManagement from './components/MaintenanceManagement';
import EquipmentMaintenance from './components/EquipmentMaintenance';
import WashingManagement from './components/WashingManagement';
import TyreManagement from './components/TyreManagement';
import SupplierManagement from './components/SupplierManagement';
import UnitManagement from './components/UnitManagement';
import UserManagement from './components/UserManagement';
import Checklist from './components/Checklist';
import ChecklistConfig from './components/ChecklistConfig';
import ChecklistHistory from './components/ChecklistHistory';
import DocumentPanel from './components/DocumentPanel';
import OdometerManagement from './components/OdometerManagement';
import PPEControl from './components/PPEControl';
import HRManagement from './components/HRManagement';
import TeamValueRegistry from './components/TeamValueRegistry';
import CargaRegistry from './components/CargaRegistry';
import OfflineIndicator from './components/OfflineIndicator';
import { INITIAL_PPE_ITEMS } from './constants';
import {
  Vehicle, Collaborator, FuelLog, MaintenanceLog, WashingLog, Supplier, Unit, Team, FuelType, User,
  ChecklistSession, ChecklistTemplateItem, PPEItem, PPEMovement, VehicleStatus, Equipment, EquipmentMaintenanceLog, EquipmentStatus, UserRole, SupplierCategory, Tyre, TyreAudit, TyreMovement, TyreStatus, OdometerLog, HREvent, Attendance, TeamRoleValue, TyreBrand, TyreModel, TyreRepair, Carga
} from './types';
import { db } from './services/databaseService';
import { useSystemCleanup } from './services/cleanupService';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '');
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem('userRole') as UserRole) || UserRole.ADMIN);
  const [allowedMenus, setAllowedMenus] = useState<string[] | undefined>(() => {
    try {
      const saved = localStorage.getItem('allowedMenus');
      if (!saved || saved === "undefined") return undefined;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch (e) {
      console.error("Erro ao carregar allowedMenus:", e);
      return undefined;
    }
  });
  const [userAllowedTeams, setUserAllowedTeams] = useState<string[] | undefined>(() => {
    try {
      const saved = localStorage.getItem('userAllowedTeams');
      if (!saved || saved === "undefined") return undefined;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch (e) {
      console.error("Erro ao carregar userAllowedTeams:", e);
      return undefined;
    }
  });
  useSystemCleanup();
  const [activeTab, setActiveTab] = useState(() => {
    // Ao recarregar com sessão salva, respeita as permissões do usuário
    const savedRole = localStorage.getItem('userRole');
    const savedMenus = localStorage.getItem('allowedMenus');
    let menus: string[] | undefined = undefined;
    try {
      if (savedMenus && savedMenus !== 'undefined') {
        const parsed = JSON.parse(savedMenus);
        if (Array.isArray(parsed)) menus = parsed;
      }
    } catch (e) {
      console.error("Erro ao carregar menus na inicialização:", e);
    }
    if (savedRole && savedRole !== UserRole.ADMIN && menus && !menus.includes('dashboard') && menus.length > 0) {
      return menus[0];
    }
    return 'dashboard';
  });

  // States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [washingLogs, setWashingLogs] = useState<WashingLog[]>([]);

  // Tyre States
  const [tyres, setTyres] = useState<Tyre[]>([]);
  const [tyreAudits, setTyreAudits] = useState<TyreAudit[]>([]);
  const [tyreMovements, setTyreMovements] = useState<TyreMovement[]>([]);
  const [tyreBrands, setTyreBrands] = useState<TyreBrand[]>([]);
  const [tyreModels, setTyreModels] = useState<TyreModel[]>([]);
  const [tyreRepairs, setTyreRepairs] = useState<TyreRepair[]>([]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierCategories, setSupplierCategories] = useState<SupplierCategory[]>([
    { id: '1', name: 'Oficina' },
    { id: '2', name: 'Posto' },
    { id: '3', name: 'Lava-jato' },
    { id: '4', name: 'Peças' },
    { id: '5', name: 'Borracharia' },
    { id: '6', name: 'Outros' }
  ]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamRoleValues, setTeamRoleValues] = useState<TeamRoleValue[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([{ id: '1', name: 'Diesel S10', category: 'Combustível' }, { id: '2', name: 'Arla 32', category: 'Aditivo' }]);
  const [users, setUsers] = useState<User[]>([{ id: 'admin-1', name: 'Controlador', email: 'admin@frotacontrol.com', username: 'admin', password: 'admin', role: UserRole.ADMIN, status: 'Ativo' }]);
  const [ppeItems, setPpeItems] = useState<PPEItem[]>(INITIAL_PPE_ITEMS);
  const [ppeMovements, setPpeMovements] = useState<PPEMovement[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplateItem[]>([{ id: '1', label: 'Nível do Óleo' }, { id: '2', label: 'Luzes/Sinalização' }]);
  const [checklistSessions, setChecklistSessions] = useState<ChecklistSession[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [equipmentLogs, setEquipmentLogs] = useState<EquipmentMaintenanceLog[]>([]);
  const [odometerLogs, setOdometerLogs] = useState<OdometerLog[]>([]);
  const [hrEvents, setHrEvents] = useState<HREvent[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  const loadUsers = async () => {
    try {
      const fetchedUsers = await db.users.getAll();
      if (fetchedUsers && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleLogin = (user: User) => {
    const name = user.username || user.name;
    setUserId(user.id);
    setUserName(name);
    setUserRole(user.role);
    setAllowedMenus(user.allowedMenus);
    setUserAllowedTeams(user.allowedTeams);
    setIsLoggedIn(true);

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userName', name);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('allowedMenus', JSON.stringify(user.allowedMenus || []));
    localStorage.setItem('userAllowedTeams', JSON.stringify(user.allowedTeams || []));

    // Redirecionar para a primeira aba permitida se o dashboard estiver bloqueado
    if (user.role !== UserRole.ADMIN && user.allowedMenus && !user.allowedMenus.includes('dashboard') && user.allowedMenus.length > 0) {
      setActiveTab(user.allowedMenus[0]);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId('');
    setUserName('');
    setUserRole(UserRole.ADMIN);
    setAllowedMenus(undefined);
    setUserAllowedTeams(undefined);
    
    // Clear persisted state
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('allowedMenus');
    localStorage.removeItem('userAllowedTeams');
  };

  useEffect(() => {
    loadUsers();
  }, []);


  const [isRefreshing, setIsRefreshing] = useState(false);
  const focusDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
      
      // Atualização periódica a cada 2 minutos se estiver online
      const interval = setInterval(() => {
        if (navigator.onLine) {
          loadData();
        }
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleFocus = () => {
      if (!isLoggedIn || !navigator.onLine) return;
      // Debounce: evita múltiplos disparos ao trocar de aba rapidamente
      if (focusDebounceRef.current) clearTimeout(focusDebounceRef.current);
      focusDebounceRef.current = setTimeout(() => {
        loadData();
      }, 500);
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (focusDebounceRef.current) clearTimeout(focusDebounceRef.current);
    };
  }, [isLoggedIn]);

  // ─── Supabase Realtime: Push instantâneo nas tabelas críticas ───────────────
  useEffect(() => {
    if (!isLoggedIn || !supabase) return;

    const channel = supabase
      .channel('realtime-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const record = db.mappers.fromDbAttendance(payload.new);
          setAttendance(prev => [...prev.filter(a => a.id !== record.id), record]);
        } else if (payload.eventType === 'DELETE') {
          setAttendance(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const record = db.mappers.fromDbDriver(payload.new);
          setCollaborators(prev => [...prev.filter(c => c.id !== record.id), record]);
        } else if (payload.eventType === 'DELETE') {
          setCollaborators(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const record = db.mappers.fromDbVehicle(payload.new);
          setVehicles(prev => [...prev.filter(v => v.id !== record.id), record]);
        } else if (payload.eventType === 'DELETE') {
          setVehicles(prev => prev.filter(v => v.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const record = db.mappers.fromDbTeam(payload.new);
          setTeams(prev => [...prev.filter(t => t.id !== record.id), record]);
        } else if (payload.eventType === 'DELETE') {
          setTeams(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_logs' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const record = db.mappers.fromDbFuelLog(payload.new);
          setFuelLogs(prev => [...prev.filter(f => f.id !== record.id), record]);
        } else if (payload.eventType === 'DELETE') {
          setFuelLogs(prev => prev.filter(f => f.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'washing_logs' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const record = db.mappers.fromDbWashingLog(payload.new);
          setWashingLogs(prev => [...prev.filter(w => w.id !== record.id), record]);
        } else if (payload.eventType === 'DELETE') {
          setWashingLogs(prev => prev.filter(w => w.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cargas' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const record = db.mappers.fromDbCarga(payload.new);
          setCargas(prev => [...prev.filter(c => c.id !== record.id), record]);
        } else if (payload.eventType === 'DELETE') {
          setCargas(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const record = db.mappers.fromDbUser(payload.new);
          setUsers(prev => {
            const updated = [...prev.filter(u => u.id !== record.id), record];
            syncActiveUserPermissions(updated);
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => {
            const updated = prev.filter(u => u.id !== payload.old.id);
            syncActiveUserPermissions(updated);
            return updated;
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tyres' }, async (payload) => {
        const ty = await db.tyres.getAll(); if (ty) setTyres(ty);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ppe_items' }, async () => {
        const pi = await db.ppeItems.getAll(); if (pi) setPpeItems(pi);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, async () => {
        const un = await db.units.getAll(); if (un) setUnits(un);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklists' }, async () => {
        const ch = await db.checklists.getAll(); if (ch) setChecklistSessions(ch);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tyre_movements' }, async () => {
        const tm = await db.tyreMovements.getAll(); if (tm) setTyreMovements(tm);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tyre_brands' }, async () => {
        const tb = await db.tyreBrands.getAll(); if (tb) setTyreBrands(tb);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tyre_models' }, async () => {
        const tm = await db.tyreModels.getAll(); if (tm) setTyreModels(tm);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tyre_repairs' }, async () => {
        const tr = await db.tyreRepairs.getAll(); if (tr) setTyreRepairs(tr);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'odometer_logs' }, async () => {
        const od = await db.odometerLogs.getAll(); if (od) setOdometerLogs(od);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tyre_audits' }, async () => {
        const ta = await db.tyreAudits.getAll(); if (ta) setTyreAudits(ta);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipments' }, async () => {
        const eq = await db.equipments.getAll(); if (eq) setEquipments(eq);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_maintenance_logs' }, async () => {
        const eml = await db.equipmentMaintenanceLogs.getAll(); if (eml) setEquipmentLogs(eml);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hr_events' }, async () => {
        const hr = await db.hrEvents.getAll(); if (hr) setHrEvents(hr);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_role_values' }, async () => {
        const trv = await db.teamRoleValues.getAll(); if (trv) setTeamRoleValues(trv);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_types' }, async () => {
        const ft = await db.fuelTypes.getAll(); if (ft) setFuelTypes(ft);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, async () => {
        const s = await db.suppliers.getAll(); if (s) setSuppliers(s);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('✅ Realtime: Conectado ao Supabase.');
      });

    realtimeChannelRef.current = channel as any;

    return () => {
      if (supabase && realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current as any);
        realtimeChannelRef.current = null;
      }
    };
  }, [isLoggedIn]);
  // ────────────────────────────────────────────────────────────────────────────



  const loadData = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      // Carregamento resiliente: se um módulo falha, os outros continuam
      const modules = [
        { name: 'veículos', task: db.vehicles.getAll, setter: setVehicles },
        { name: 'colaboradores', task: db.drivers.getAll, setter: setCollaborators },
        { name: 'equipes', task: db.teams.getAll, setter: setTeams },
        { name: 'combustível', task: db.fuelLogs.getAll, setter: setFuelLogs },
        { name: 'manutenção', task: db.maintenanceLogs.getAll, setter: setMaintenanceLogs },
        { name: 'lavagem', task: db.washingLogs.getAll, setter: setWashingLogs },
        { name: 'fornecedores', task: db.suppliers.getAll, setter: setSuppliers },
        { name: 'unidades', task: db.units.getAll, setter: setUnits },
        { name: 'tipos_combustível', task: db.fuelTypes.getAll, setter: setFuelTypes },
        { name: 'usuários', task: db.users.getAll, setter: setUsers },
        { name: 'checklists', task: db.checklists.getAll, setter: setChecklistSessions },
        { name: 'pneus', task: db.tyres.getAll, setter: setTyres },
        { name: 'auditorias_pneus', task: db.tyreAudits.getAll, setter: setTyreAudits },
        { name: 'movimentacoes_pneus', task: db.tyreMovements.getAll, setter: setTyreMovements },
        { name: 'epis', task: db.ppeItems.getAll, setter: setPpeItems },
        { name: 'movimentacoes_epi', task: db.ppeMovements.getAll, setter: setPpeMovements },
        { name: 'equipamentos', task: db.equipments.getAll, setter: setEquipments },
        { name: 'manutencao_equip', task: db.equipmentMaintenanceLogs.getAll, setter: setEquipmentLogs },
        { name: 'odômetro', task: db.odometerLogs.getAll, setter: setOdometerLogs },
        { name: 'rh', task: db.hrEvents.getAll, setter: setHrEvents },
        { name: 'frequência', task: db.attendance.getAll, setter: setAttendance },
        { name: 'config_cargas', task: db.teamRoleValues.getAll, setter: setTeamRoleValues },
        { name: 'marcas_pneus', task: db.tyreBrands.getAll, setter: setTyreBrands },
        { name: 'modelos_pneus', task: db.tyreModels.getAll, setter: setTyreModels },
        { name: 'reparos_pneus', task: db.tyreRepairs.getAll, setter: setTyreRepairs },
        { name: 'cargas', task: db.cargas.getAll, setter: setCargas }
      ];

      await Promise.allSettled(modules.map(async (m) => {
        try {
          const data = await m.task();
          if (data) m.setter(data);
        } catch (e) {
          console.warn(`[FrotaControl] Falha ao atualizar ${m.name}:`, e);
        }
      }));

      // ✨ Atualiza permissões em tempo real se o usuário logado tiver alterações
      const allUsersFetched = await db.users.getAll().catch(() => null);
      if (allUsersFetched) {
        syncActiveUserPermissions(allUsersFetched);
      }

      localStorage.setItem('last_data_update', new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error("Erro crítico no carregamento de dados:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const syncActiveUserPermissions = (allUsers: User[]) => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId || !allUsers) return;

    const me = allUsers.find(usr => usr.id === currentUserId);
    if (me) {
      const storedMenus = localStorage.getItem('allowedMenus');
      const storedTeams = localStorage.getItem('userAllowedTeams');
      const newMenusArr = me.allowedMenus || [];
      const newTeamsArr = me.allowedTeams || [];
      const newMenus = JSON.stringify(newMenusArr);
      const newTeams = JSON.stringify(newTeamsArr);

      if (storedMenus !== newMenus || storedTeams !== newTeams || userRole !== me.role) {
        console.info('[FrotaControl] Sincronizando permissões do usuário:', me.username);
        setAllowedMenus(newMenusArr);
        setUserAllowedTeams(newTeamsArr);
        setUserRole(me.role);
        localStorage.setItem('allowedMenus', newMenus);
        localStorage.setItem('userAllowedTeams', newTeams);
        localStorage.setItem('userRole', me.role);
      }
    }
  };



  // --- Lógica de Pneus ---
  const handleAddTyre = async (tyre: Omit<Tyre, 'id'>) => {
    const newId = crypto.randomUUID();
    const newTyre = { ...tyre, id: newId };
    await db.tyres.upsert(newTyre);
    setTyres(prev => [...prev, newTyre]);

    const movement: TyreMovement = {
      id: crypto.randomUUID(),
      tyreId: newId,
      date: tyre.purchaseDate,
      type: 'Entrada',
      km: 0,
      observations: `Entrada via Lote NF: ${tyre.invoiceNumber || 'S/N'}`
    };
    await db.tyreMovements.upsert(movement);
    setTyreMovements(prev => [movement, ...prev]);
  };

  const handleMoveTyre = async (movement: Omit<TyreMovement, 'id'>) => {
    const newMove = { ...movement, id: crypto.randomUUID() };
    await db.tyreMovements.upsert(newMove);
    setTyreMovements(prev => [newMove, ...prev]);

    let updatedTyre: Tyre | undefined;
    const updatedTyres = tyres.map(t => {
      if (t.id === movement.tyreId) {
        let updates: Partial<Tyre> = {};
        if (movement.type === 'Montagem') updates = { status: TyreStatus.MOUNTED, vehicleId: movement.vehicleId, position: movement.position, kmAtMount: movement.km };
        if (movement.type === 'Desmontagem') updates = { status: TyreStatus.STOCK, vehicleId: undefined, position: undefined };
        if (movement.type === 'Saída') updates = { status: TyreStatus.SCRAP, vehicleId: undefined, position: undefined };

        updatedTyre = { ...t, ...updates };
        return updatedTyre;
      }
      return t;
    });

    if (updatedTyre) {
      await db.tyres.upsert(updatedTyre);
      setTyres(updatedTyres);
    }
  };

  const handleUpdateMovement = async (movement: TyreMovement) => {
    await db.tyreMovements.upsert(movement);
    setTyreMovements(prev => prev.map(m => m.id === movement.id ? movement : m));
  };

  const handleDeleteMovement = async (id: string) => {
    if (window.confirm("Deseja excluir este registro de movimentação permanentemente?")) {
      await db.tyreMovements.delete(id);
      setTyreMovements(prev => prev.filter(m => m.id !== id));
    }
  };

  // Lógica EPI com Estorno e Edição
  const handleAddPPEMovement = async (movement: Omit<PPEMovement, 'id'>) => {
    const newMove = { ...movement, id: crypto.randomUUID() };
    await db.ppeMovements.upsert(newMove);
    setPpeMovements([newMove, ...ppeMovements]);

    let updatedItem: PPEItem | undefined;
    const updatedItems = ppeItems.map(item => {
      if (item.id === movement.ppeId) {
        const factor = movement.type === 'Entrada' ? 1 : -1;
        updatedItem = { ...item, currentStock: item.currentStock + (movement.quantity * factor) };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem) {
      await db.ppeItems.upsert(updatedItem);
      setPpeItems(updatedItems);
    }
  };

  const handleUpdatePPEMovement = async (movement: PPEMovement) => {
    const oldMove = ppeMovements.find(m => m.id === movement.id);
    if (!oldMove) return;

    let updatedItem: PPEItem | undefined;
    const updatedItems = ppeItems.map(item => {
      if (item.id === movement.ppeId) {
        const factorOld = oldMove.type === 'Entrada' ? -1 : 1;
        const factorNew = movement.type === 'Entrada' ? 1 : -1;
        const adjustment = (oldMove.quantity * factorOld) + (movement.quantity * factorNew);
        updatedItem = { ...item, currentStock: item.currentStock + adjustment };
        return updatedItem;
      }
      return item;
    });

    await db.ppeMovements.upsert(movement);
    setPpeMovements(prev => prev.map(m => m.id === movement.id ? movement : m));

    if (updatedItem) {
      await db.ppeItems.upsert(updatedItem);
      setPpeItems(updatedItems);
    }
  };

  const handleDeletePPEMovement = async (id: string) => {
    const logFound = ppeMovements.find(m => m.id === id);
    if (!logFound) return;
    if (window.confirm(`Excluir permanentemente este registro de ${logFound.type}? O estoque será estornado.`)) {
      await db.ppeMovements.delete(id);
      setPpeMovements(prev => prev.filter(m => m.id !== id));

      let updatedItem: PPEItem | undefined;
      const updatedItems = ppeItems.map(item => {
        if (item.id === logFound.ppeId) {
          const factor = logFound.type === 'Entrada' ? -1 : 1;
          updatedItem = { ...item, currentStock: item.currentStock + (logFound.quantity * factor) };
          return updatedItem;
        }
        return item;
      });

      if (updatedItem) {
        await db.ppeItems.upsert(updatedItem);
        setPpeItems(updatedItems);
      }
    }
  };

  const allowedTeamNumbers = userAllowedTeams || [];
  const teamIdsRestrict = userAllowedTeams && userAllowedTeams.length > 0 && teams.length > 0
    ? teams.filter(t => allowedTeamNumbers.includes(t.number)).map(t => t.id) 
    : undefined;

  const filteredTeams = teamIdsRestrict ? teams.filter(t => teamIdsRestrict.includes(t.id)) : teams;
  
  const filteredCollaborators = teamIdsRestrict || (userAllowedTeams && userAllowedTeams.length > 0)
    ? collaborators.filter(c => 
        (c.teamId && teamIdsRestrict?.includes(c.teamId)) || 
        (c.equipe && userAllowedTeams?.includes(c.equipe)) ||
        (c.teamId && userAllowedTeams?.includes(c.teamId)) // Caso o teamId seja o número
      ) 
    : collaborators;
    
  const filteredFuelLogs = teamIdsRestrict || (userAllowedTeams && userAllowedTeams.length > 0)
    ? fuelLogs.filter(l => 
        (l.teamId && teamIdsRestrict?.includes(l.teamId)) || 
        (l.teamId && userAllowedTeams?.includes(l.teamId))
      ) 
    : fuelLogs;
  const filteredMaintenanceLogs = teamIdsRestrict || (userAllowedTeams && userAllowedTeams.length > 0)
    ? maintenanceLogs.filter(l => 
        (l.teamId && teamIdsRestrict?.includes(l.teamId)) || 
        (l.teamId && userAllowedTeams?.includes(l.teamId))
      ) 
    : maintenanceLogs;
  const filteredWashingLogs = teamIdsRestrict || (userAllowedTeams && userAllowedTeams.length > 0)
    ? washingLogs.filter(l => 
        (l.teamId && teamIdsRestrict?.includes(l.teamId)) || 
        (l.teamId && userAllowedTeams?.includes(l.teamId))
      ) 
    : washingLogs;
  const filteredChecklistSessions = teamIdsRestrict || (userAllowedTeams && userAllowedTeams.length > 0)
    ? checklistSessions.filter(s => 
        (s.teamId && teamIdsRestrict?.includes(s.teamId)) || 
        (s.teamId && userAllowedTeams?.includes(s.teamId))
      ) 
    : checklistSessions;
  const filteredAttendance = teamIdsRestrict || (userAllowedTeams && userAllowedTeams.length > 0)
    ? attendance.filter(a => 
        (a.teamId && teamIdsRestrict?.includes(a.teamId)) || 
        (a.teamId && userAllowedTeams?.includes(a.teamId))
      ) 
    : attendance;
  const filteredOdometerLogs = teamIdsRestrict || (userAllowedTeams && userAllowedTeams.length > 0)
    ? odometerLogs.filter(l => l.driverId && filteredCollaborators.some(c => c.id === l.driverId)) 
    : odometerLogs;
  const filteredPPEMovements = teamIdsRestrict || (userAllowedTeams && userAllowedTeams.length > 0)
    ? ppeMovements.filter(m => m.personId && filteredCollaborators.some(c => c.id === m.personId)) 
    : ppeMovements;
  const filteredHrEvents = teamIdsRestrict || (userAllowedTeams && userAllowedTeams.length > 0)
    ? hrEvents.filter(e => filteredCollaborators.some(c => c.id === e.collaboratorId)) 
    : hrEvents;
  const filteredCargas = teamIdsRestrict || (userAllowedTeams && userAllowedTeams.length > 0)
    ? cargas.filter(c => 
        (c.teamId && teamIdsRestrict?.includes(c.teamId)) || 
        (c.teamId && userAllowedTeams?.includes(c.teamId))
      ) 
    : cargas;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard vehicles={vehicles} units={units} fuelLogs={filteredFuelLogs} maintenanceLogs={filteredMaintenanceLogs} washingLogs={filteredWashingLogs} collaborators={filteredCollaborators} ppeItems={ppeItems} ppeMovements={filteredPPEMovements} tyres={tyres} checklistSessions={filteredChecklistSessions} />;
      case 'fleet': return <FleetManagement
        vehicles={vehicles}
        units={units}
        onAddVehicle={async (v) => {
          try {
            const newVehicle = { ...v, id: crypto.randomUUID() };
            await db.vehicles.upsert(newVehicle);
            setVehicles(prev => [...prev, newVehicle]);
          } catch (error: any) {
            console.error("Erro ao cadastrar veículo:", error);
            alert(`Erro ao cadastrar veículo: ${error.message}`);
          }
        }}
        onUpdateVehicle={async (v) => {
          try {
            await db.vehicles.upsert(v);
            setVehicles(vehicles.map(ve => ve.id === v.id ? v : ve));
          } catch (error: any) {
            console.error("Erro ao atualizar veículo:", error);
            alert(`Erro ao atualizar veículo: ${error.message}`);
          }
        }}
        onDeleteVehicle={async (id) => {
          if (window.confirm("Deseja excluir este veículo permanentemente?")) {
            try {
              await db.vehicles.delete(id);
              setVehicles(vehicles.filter(v => v.id !== id));
            } catch (error: any) {
              console.error("Erro ao excluir veículo:", error);
              alert("Erro ao excluir veículo.");
            }
          }
        }}
        currentUserRole={userRole}
      />;
      case 'odometer': return <OdometerManagement
        vehicles={vehicles}
        drivers={filteredCollaborators}
        odometerLogs={filteredOdometerLogs}
        onUpdateKm={async (vid, km, type, driverId, date) => {
          try {
            const vehicle = vehicles.find(v => v.id === vid);
            if (vehicle) {
              const updatedVehicle = { ...vehicle, km };
              await db.vehicles.upsert(updatedVehicle);
              setVehicles(vehicles.map(v => v.id === vid ? updatedVehicle : v));

              if (type && date) {
                const newLog: OdometerLog = {
                  id: crypto.randomUUID(),
                  vehicleId: vid,
                  km: km,
                  type: type,
                  date: date,
                  driverId: driverId,
                  tripKm: type === 'Retorno' ? (km - (vehicle.km || 0)) : 0
                };
                await db.odometerLogs.insert(newLog);
                setOdometerLogs([newLog, ...odometerLogs]);
              }
            }
          } catch (error: any) {
            console.error("Erro ao atualizar quilometragem:", error);
            alert(`Erro ao atualizar quilometragem: ${error.message}`);
          }
        }}
        onUpdateLog={async (log) => {
          try {
            await db.odometerLogs.upsert(log);
            setOdometerLogs(odometerLogs.map(l => l.id === log.id ? log : l));
          } catch (error: any) {
            console.error("Erro ao atualizar log de odômetro:", error);
            alert("Erro ao atualizar registro.");
          }
        }}
        onDeleteLog={async (id) => {
          if (window.confirm("VAI EXCLUIR ESTE REGISTRO?")) {
            try {
              await db.odometerLogs.delete(id);
              setOdometerLogs(odometerLogs.filter(l => l.id !== id));
            } catch (error: any) {
              console.error("Erro ao excluir log:", error);
              alert("Erro ao excluir registro.");
            }
          }
        }}
      />;
      case 'fuel': return <FuelManagement
        drivers={filteredCollaborators}
        teams={filteredTeams}
        vehicles={vehicles}
        suppliers={suppliers}
        units={units}
        fuelLogs={filteredFuelLogs}
        fuelTypes={fuelTypes}
        onAddFuelLog={async (l) => {
          try {
            const newLog = { ...l, id: crypto.randomUUID() };
            await db.fuelLogs.insert(newLog);
            setFuelLogs([newLog, ...fuelLogs]);
          } catch (error: any) {
            console.error("Erro ao cadastrar abastecimento:", error);
            alert(`Erro ao cadastrar abastecimento: ${error.message}`);
          }
        }}
        onUpdateFuelLog={async (l) => {
          try {
            await db.fuelLogs.upsert(l);
            setFuelLogs(fuelLogs.map(log => log.id === l.id ? l : log));
          } catch (error: any) {
            console.error("Erro ao atualizar abastecimento:", error);
            alert("Erro ao salvar alterações.");
          }
        }}
        onDeleteFuelLog={async (id) => {
          if (window.confirm("Excluir registro de abastecimento?")) {
            try {
              await db.fuelLogs.delete(id);
              setFuelLogs(fuelLogs.filter(l => l.id !== id));
            } catch (error: any) {
              alert("Erro ao excluir registro.");
            }
          }
        }}
        onAddFuelType={async (t) => {
          try {
            const newType = { ...t, id: crypto.randomUUID() };
            await db.fuelTypes.upsert(newType);
            setFuelTypes([...fuelTypes, newType]);
          } catch (error: any) {
            alert("Erro ao cadastrar tipo de combustível.");
          }
        }}
        onUpdateFuelType={async (t) => {
          try {
            await db.fuelTypes.upsert(t);
            setFuelTypes(fuelTypes.map(ty => ty.id === t.id ? t : ty));
          } catch (error: any) {
            alert("Erro ao atualizar tipo.");
          }
        }}
        onDeleteFuelType={async (id) => {
          if (window.confirm("Excluir este tipo de combustível?")) {
            try {
              await db.fuelTypes.delete(id);
              setFuelTypes(fuelTypes.filter(t => t.id !== id));
            } catch (error: any) {
              alert("Erro ao excluir.");
            }
          }
        }}
      />;
      case 'maintenance': return <MaintenanceManagement
        vehicles={vehicles}
        suppliers={suppliers}
        units={units}
        maintenanceLogs={filteredMaintenanceLogs}
        onAddMaintenance={async (l) => {
          try {
            const newLog = { ...l, id: crypto.randomUUID() };
            await db.maintenanceLogs.insert(newLog);
            setMaintenanceLogs(prev => [newLog, ...prev]);
          } catch (error: any) {
            console.error("Erro ao cadastrar manutenção:", error);
            alert(`Erro ao cadastrar manutenção: ${error.message}`);
          }
        }}
        onUpdateMaintenance={async (l) => {
          try {
            await db.maintenanceLogs.upsert(l);
            setMaintenanceLogs(maintenanceLogs.map(log => log.id === l.id ? l : log));
          } catch (error: any) {
            alert("Erro ao atualizar registro.");
          }
        }}
        onDeleteMaintenance={async (id) => {
          if (window.confirm("Excluir esta manutenção?")) {
            try {
              await db.maintenanceLogs.delete(id);
              setMaintenanceLogs(maintenanceLogs.filter(l => l.id !== id));
            } catch (error: any) {
              alert("Erro ao excluir.");
            }
          }
        }}
        currentUserRole={userRole}
      />;
      case 'equipment_maintenance': return <EquipmentMaintenance
        equipments={equipments}
        maintenanceLogs={equipmentLogs}
        units={units}
        onAddEquipment={async (e) => {
          const newEquipment = { ...e, id: crypto.randomUUID() };
          await db.equipments.upsert(newEquipment);
          setEquipments([...equipments, newEquipment]);
        }}
        onAddMaintenanceLog={async (l) => {
          const newLog = { ...l, id: crypto.randomUUID() };
          await db.equipmentMaintenanceLogs.upsert(newLog);
          setEquipmentLogs([...equipmentLogs, newLog]);
        }}
        onDeleteEquipment={async (id) => {
          await db.equipments.delete(id);
          setEquipments(equipments.filter(e => e.id !== id));
        }}
        onDeleteLog={async (id) => {
          await db.equipmentMaintenanceLogs.delete(id);
          setEquipmentLogs(equipmentLogs.filter(l => l.id !== id));
        }}
      />;
      case 'washing': return <WashingManagement
        vehicles={vehicles}
        drivers={filteredCollaborators}
        suppliers={suppliers}
        units={units}
        teams={filteredTeams}
        washingLogs={filteredWashingLogs}
        onAddWashing={async (l) => {
          try {
            const newLog = { ...l, id: crypto.randomUUID() };
            await db.washingLogs.insert(newLog);
            setWashingLogs([newLog, ...washingLogs]);
          } catch (error: any) {
            alert(`Erro ao salvar lavagem: ${error.message}`);
          }
        }}
        onUpdateWashing={async (l) => {
          try {
            await db.washingLogs.upsert(l);
            setWashingLogs(washingLogs.map(log => log.id === l.id ? l : log));
          } catch (error: any) {
            alert("Erro ao atualizar lavagem.");
          }
        }}
        onDeleteWashing={async (id) => {
          if (window.confirm("Excluir este registro de lavagem?")) {
            try {
              await db.washingLogs.delete(id);
              setWashingLogs(washingLogs.filter(l => l.id !== id));
            } catch (error: any) {
              alert("Erro ao excluir.");
            }
          }
        }}
      />;
      case 'tyres': return <TyreManagement
        tyres={tyres}
        tyreAudits={tyreAudits}
        tyreMovements={tyreMovements}
        vehicles={vehicles}
        onAddTyre={handleAddTyre}
        onUpdateTyre={async (t) => {
          await db.tyres.upsert(t);
          setTyres(prev => prev.map(ty => ty.id === t.id ? t : ty));
        }}
        onDeleteTyre={async (id) => {
          await db.tyres.delete(id);
          setTyres(tyres.filter(t => t.id !== id));
        }}
        onAddAudit={async (a) => {
          const newAudit = { ...a, id: crypto.randomUUID() };
          await db.tyreAudits.insert(newAudit);
          setTyreAudits([newAudit, ...tyreAudits]);

          // ATUALIZAR: Sincronizar sulco atual no pneu
          const tyre = tyres.find(t => t.id === a.tyreId);
          if (tyre) {
            const updatedTyre = { ...tyre, currentThreadDepth: a.depth };
            await db.tyres.upsert(updatedTyre);
            setTyres(tyres.map(t => t.id === tyre.id ? updatedTyre : t));
          }
        }}
        onMoveTyre={handleMoveTyre}
        onUpdateMovement={handleUpdateMovement}
        onDeleteMovement={handleDeleteMovement}
        tyreBrands={tyreBrands}
        tyreModels={tyreModels}
        onAddTyreBrand={async (b) => {
          const newBrand = { ...b, id: crypto.randomUUID() };
          await db.tyreBrands.upsert(newBrand);
          setTyreBrands(prev => [...prev, newBrand]);
        }}
        onUpdateTyreBrand={async (b) => {
          await db.tyreBrands.upsert(b);
          setTyreBrands(prev => prev.map(item => item.id === b.id ? b : item));
        }}
        onDeleteTyreBrand={async (id) => {
          await db.tyreBrands.delete(id);
          setTyreBrands(prev => prev.filter(item => item.id !== id));
        }}
        onAddTyreModel={async (m) => {
          const newModel = { ...m, id: crypto.randomUUID() };
          await db.tyreModels.upsert(newModel);
          setTyreModels(prev => [...prev, newModel]);
        }}
        onUpdateTyreModel={async (m) => {
          await db.tyreModels.upsert(m);
          setTyreModels(prev => prev.map(item => item.id === m.id ? m : item));
        }}
        onDeleteTyreModel={async (id) => {
          await db.tyreModels.delete(id);
          setTyreModels(prev => prev.filter(item => item.id !== id));
        }}
        tyreRepairs={tyreRepairs}
        suppliers={suppliers}
        onAddTyreRepair={async (r) => {
          const newRepair = { ...r, id: crypto.randomUUID() };
          await db.tyreRepairs.upsert(newRepair);
          setTyreRepairs(prev => [newRepair, ...prev]);
        }}
        onUpdateTyreRepair={async (r) => {
          await db.tyreRepairs.upsert(r);
          setTyreRepairs(prev => prev.map(item => item.id === r.id ? r : item));
        }}
        onDeleteTyreRepair={async (id) => {
          await db.tyreRepairs.delete(id);
          setTyreRepairs(prev => prev.filter(item => item.id !== id));
        }}
      />;
      case 'suppliers': return <SupplierManagement
        suppliers={suppliers}
        categories={supplierCategories}
        onAddSupplier={async (s) => {
          try {
            const newSupplier = { ...s, id: crypto.randomUUID() };
            await db.suppliers.upsert(newSupplier);
            setSuppliers(prev => [...prev, newSupplier]);
          } catch (error: any) {
            alert(`Erro ao cadastrar fornecedor: ${error.message}`);
          }
        }}
        onUpdateSupplier={async (s) => {
          try {
            await db.suppliers.upsert(s);
            setSuppliers(suppliers.map(su => su.id === s.id ? s : su));
          } catch (error: any) {
            alert("Erro ao atualizar fornecedor.");
          }
        }}
        onDeleteSupplier={async (id) => {
          if (window.confirm("Excluir este fornecedor permanentemente?")) {
            try {
              await db.suppliers.delete(id);
              setSuppliers(suppliers.filter(s => s.id !== id));
            } catch (error: any) {
              alert("Erro ao excluir fornecedor.");
            }
          }
        }}
        onAddCategory={(name) => setSupplierCategories([...supplierCategories, { id: crypto.randomUUID(), name }])}
        onDeleteCategory={(id) => setSupplierCategories(supplierCategories.filter(c => c.id !== id))}
      />;
      case 'units': return <UnitManagement
        units={units}
        onAddUnit={async (u) => {
          try {
            const newUnit = { ...u, id: crypto.randomUUID() };
            await db.units.upsert(newUnit);
            setUnits(prev => [...prev, newUnit]);
          } catch (error: any) {
            console.error("Erro ao cadastrar unidade:", error);
            alert(`Erro ao cadastrar unidade: ${error.message}`);
          }
        }}
        onUpdateUnit={async (u) => {
          try {
            await db.units.upsert(u);
            setUnits(prev => prev.map(un => un.id === u.id ? u : un));
          } catch (error: any) {
            console.error("Erro ao atualizar unidade:", error);
            alert(`Erro ao atualizar unidade: ${error.message}`);
          }
        }}
        onDeleteUnit={async (id) => {
          if (window.confirm("Deseja excluir esta unidade permanentemente?")) {
            try {
              await db.units.delete(id);
              setUnits(prev => prev.filter(u => u.id !== id));
            } catch (error: any) {
              console.error("Erro ao excluir unidade:", error);
              alert("Erro ao excluir unidade.");
            }
          }
        }}
      />;
      case 'teams': return <TeamRegistry
        teams={filteredTeams}
        units={units}
        collaborators={filteredCollaborators}
        attendance={filteredAttendance}
        onAddTeam={async (t) => {
          try {
            const newTeam = { ...t, id: crypto.randomUUID() };
            await db.teams.upsert(newTeam);
            setTeams(prev => [...prev, newTeam]);
          } catch (error: any) {
            alert(`Erro ao cadastrar equipe: ${error.message}`);
          }
        }}
        onUpdateTeam={async (t) => {
          try {
            await db.teams.upsert(t);
            setTeams(prev => prev.map(te => te.id === t.id ? t : te));
          } catch (error: any) {
            alert("Erro ao atualizar equipe.");
          }
        }}
        onDeleteTeam={async (id) => {
          if (window.confirm("Deseja excluir esta equipe permanentemente?")) {
            try {
              await db.teams.delete(id);
              setTeams(prev => prev.filter(t => t.id !== id));
            } catch (error: any) {
              alert("Erro ao excluir equipe.");
            }
          }
        }}
        onDeleteAllTeams={async () => {
          if (window.confirm("CUIDADO: Isso excluirá TODAS as equipes. Deseja continuar?")) {
            try {
              await db.teams.deleteAll();
              setTeams([]);
            } catch (error: any) {
              alert("Erro ao excluir equipes.");
            }
          }
        }}
        onUpdateAttendance={async (a) => {
          await db.attendance.upsert(a);
          setAttendance(prev => {
            const filtered = prev.filter(item => !(item.collaboratorId === a.collaboratorId && item.date === a.date));
            return [a, ...filtered];
          });
        }}
        onDeleteAttendance={async (id) => {
          await db.attendance.delete(id);
          setAttendance(prev => prev.filter(a => a.id !== id));
        }}
        onUpdateCollaborator={async (c) => {
          await db.drivers.upsert(c);
          setCollaborators(prev => prev.map(co => co.id === c.id ? c : co));
        }}
        onAddHREvent={async (e) => {
          const newEvent = { ...e, id: crypto.randomUUID() };
          await db.hrEvents.insert(newEvent);
          setHrEvents(prev => [newEvent, ...prev]);
        }}
        roleValues={teamRoleValues}
        userRole={userRole}
        cargas={filteredCargas}
      />;
      case 'team_values': return <TeamValueRegistry
        values={teamRoleValues}
        onAdd={async (v) => {
          try {
            const newVal = { ...v, id: crypto.randomUUID() };
            await db.teamRoleValues.upsert(newVal);
            setTeamRoleValues(prev => [...prev, newVal]);
          } catch (error: any) {
            alert("Erro ao cadastrar valor.");
          }
        }}
        onUpdate={async (v) => {
          try {
            await db.teamRoleValues.upsert(v);
            setTeamRoleValues(prev => prev.map(item => item.id === v.id ? v : item));
          } catch (error: any) {
            alert("Erro ao atualizar valor.");
          }
        }}
        onDelete={async (id) => {
          if (window.confirm("Excluir este valor permanentemente?")) {
            try {
              await db.teamRoleValues.delete(id);
              setTeamRoleValues(prev => prev.filter(v => v.id !== id));
            } catch (error: any) {
              alert("Erro ao excluir valor.");
            }
          }
        }}
      />;
      case 'cargas': return <CargaRegistry
        cargas={filteredCargas}
        teams={filteredTeams}
        onAdd={async (c) => {
          try {
            const newCarga = { ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            await db.cargas.upsert(newCarga);
            setCargas(prev => [newCarga, ...prev]);
          } catch (error: any) {
            alert(`Erro ao cadastrar carga: ${error.message}`);
          }
        }}
        onUpdate={async (c) => {
          try {
            const updatedCarga = { ...c, updatedAt: new Date().toISOString() };
            await db.cargas.upsert(updatedCarga);
            setCargas(prev => prev.map(item => item.id === c.id ? updatedCarga : item));
          } catch (error: any) {
            alert("Erro ao atualizar carga.");
          }
        }}
        onDelete={async (id) => {
          if (window.confirm("Excluir registro de carga?")) {
            try {
              await db.cargas.delete(id);
              setCargas(prev => prev.filter(c => c.id !== id));
            } catch (error: any) {
              alert("Erro ao excluir carga.");
            }
          }
        }}
      />;
      case 'drivers': return <TeamManagement
        collaborators={filteredCollaborators}
        units={units}
        teams={filteredTeams}
        onAddCollaborator={async (c) => {
          try {
            const newDriver = { ...c, id: crypto.randomUUID() };
            await db.drivers.upsert(newDriver);
            setCollaborators(prev => [...prev, newDriver]);
          } catch (error: any) {
            alert(`Erro ao cadastrar colaborador: ${error.message}`);
          }
        }}
        onUpdateCollaborator={async (c) => {
          try {
            await db.drivers.upsert(c);
            setCollaborators(prev => prev.map(co => co.id === c.id ? c : co));
          } catch (error: any) {
            alert("Erro ao atualizar colaborador.");
          }
        }}
        onDeleteCollaborator={async (id) => {
          if (window.confirm("Excluir colaborador permanentemente?")) {
            try {
              await db.drivers.delete(id);
              setCollaborators(prev => prev.filter(c => c.id !== id));
            } catch (error: any) {
              alert("Erro ao excluir colaborador.");
            }
          }
        }}
        onDeleteAllCollaborators={async () => {
          if (window.confirm("CUIDADO: Isso excluirá TODOS os colaboradores. Continuar?")) {
            try {
              await db.drivers.deleteAll();
              setCollaborators([]);
            } catch (error: any) {
              alert("Erro ao excluir registros.");
            }
          }
        }}
      />;
      case 'users': return <UserManagement
        users={users}
        teams={teams}
        onAddUser={async (u) => {
          try {
            const newUser = { ...u, id: crypto.randomUUID() };
            await db.users.upsert(newUser);
            setUsers(prev => [...prev, newUser]);
          } catch (error: any) {
            console.error("Erro ao adicionar usuário:", error);
            alert(`Erro ao cadastrar usuário: ${error.message || 'Verifique sua conexão ou limites do Supabase'}`);
          }
        }}
        onUpdateUser={async (u) => {
          try {
            await db.users.upsert(u);
            setUsers(prev => prev.map(us => us.id === u.id ? u : us));
            if (u.id === userId) {
              setAllowedMenus(u.allowedMenus || []);
              setUserAllowedTeams(u.allowedTeams || []);
              setUserRole(u.role);
              localStorage.setItem('allowedMenus', JSON.stringify(u.allowedMenus || []));
              localStorage.setItem('userAllowedTeams', JSON.stringify(u.allowedTeams || []));
              localStorage.setItem('userRole', u.role);
            }
          } catch (error: any) {
            console.error("Erro ao atualizar usuário:", error);
            alert(`Erro ao atualizar usuário: ${error.message}`);
          }
        }}
        onDeleteUser={async (id) => {
          if (window.confirm("Deseja excluir este usuário permanentemente?")) {
            try {
              await db.users.delete(id);
              setUsers(prev => prev.filter(u => u.id !== id));
            } catch (error: any) {
              console.error("Erro ao excluir usuário:", error);
              alert("Erro ao excluir usuário.");
            }
          }
        }}
      />;
      case 'checklist': return <Checklist
        templates={checklistTemplates}
        vehicles={vehicles}
        drivers={filteredCollaborators}
        units={units}
        teams={filteredTeams}
        onSave={async (s) => {
          try {
            await db.checklists.insert(s);
            setChecklistSessions([s, ...checklistSessions]);
          } catch (error: any) {
            alert(`Erro ao salvar checklist: ${error.message}`);
          }
        }}
      />;
      case 'alerts': return <DocumentPanel vehicles={vehicles} drivers={filteredCollaborators} ppeItems={ppeItems} />;
      case 'hr': return <HRManagement
        collaborators={filteredCollaborators}
        hrEvents={filteredHrEvents}
        onAddHREvent={async (ev) => {
          try {
            const newEvent: HREvent = { ...ev, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
            await db.hrEvents.insert(newEvent);
            setHrEvents(prev => [newEvent, ...prev]);
          } catch (error: any) {
            alert(`Erro ao salvar evento RH: ${error.message}`);
          }
        }}
        onDeleteHREvent={async (id) => {
          if (window.confirm("Excluir evento permanentemente?")) {
            try {
              await db.hrEvents.delete(id);
              setHrEvents(prev => prev.filter(e => e.id !== id));
            } catch (error: any) {
              alert("Erro ao excluir evento.");
            }
          }
        }}
        onUpdateCollaborator={async (c) => {
          try {
            await db.drivers.upsert(c);
            setCollaborators(prev => prev.map(co => co.id === c.id ? c : co));
          } catch (error: any) {
            alert("Erro ao atualizar colaborador.");
          }
        }}
      />;
      case 'epi': return <PPEControl
        items={ppeItems}
        movements={filteredPPEMovements}
        drivers={filteredCollaborators}
        teams={filteredTeams}
        onAddMovement={handleAddPPEMovement}
        onUpdateMovement={handleUpdatePPEMovement}
        onDeleteMovement={handleDeletePPEMovement}
        onAddItem={async (i) => {
          try {
            const newItem = { ...i, id: crypto.randomUUID() };
            await db.ppeItems.upsert(newItem);
            setPpeItems([...ppeItems, newItem]);
          } catch (error: any) {
            alert(`Erro ao cadastrar EPI: ${error.message}`);
          }
        }}
        onUpdateItem={async (i) => {
          try {
            await db.ppeItems.upsert(i);
            setPpeItems(ppeItems.map(p => p.id === i.id ? i : p));
          } catch (error: any) {
            alert("Erro ao atualizar EPI.");
          }
        }}
        onDeleteItem={async (id) => {
          if (window.confirm("Excluir este EPI permanentemente?")) {
            try {
              await db.ppeItems.delete(id);
              setPpeItems(ppeItems.filter(p => p.id !== id));
            } catch (error: any) {
              alert("Erro ao excluir EPI.");
            }
          }
        }}
      />;
      default: return <Dashboard vehicles={vehicles} units={units} fuelLogs={fuelLogs} maintenanceLogs={maintenanceLogs} washingLogs={washingLogs} collaborators={collaborators} ppeItems={ppeItems} tyres={tyres} checklistSessions={filteredChecklistSessions} />;
    }
  };

  const renderMainContent = () => {
    try {
      if (!isLoggedIn) return <Login onLogin={handleLogin} users={users} />;

      return (
        <>
          <Layout activeTab={activeTab} setActiveTab={setActiveTab} userName={userName} onLogout={handleLogout} isSyncing={isRefreshing} userRole={userRole} allowedMenus={allowedMenus}>
            {renderContent()}
          </Layout>
          <OfflineIndicator onFullRefresh={loadData} onLogout={handleLogout} />
        </>
      );
    } catch (error) {
      console.error("Critical rendering error:", error);
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /></svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Ops! Ocorreu um erro técnico.</h1>
          <p className="text-slate-500 max-w-md mb-8">Não foi possível carregar a interface. Isso pode acontecer devido a dados antigos em cache após uma atualização.</p>
          <button 
            onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }}
            className="px-8 py-4 bg-cca-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-cca-primary/20 hover:bg-cca-accent transition-all"
          >
            Limpar Cache e Reiniciar Sistema
          </button>
          <pre className="mt-8 text-[10px] text-slate-400 font-bold p-4 bg-gray-100 rounded text-left overflow-auto max-w-full">
            {String(error)}
          </pre>
        </div>
      );
    }
  };

  return renderMainContent();
};

export default App;
