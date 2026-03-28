// Migrado para API Local / Node.js Backend em localhost:5000
import {
  Vehicle,
  Driver as Collaborator,
  FuelLog,
  MaintenanceLog,
  WashingLog,
  Supplier,
  Unit,
  FuelType,
  User,
  ChecklistSession,
  Team,
  Tyre,
  TyreAudit,
  TyreMovement,
  PPEItem,
  PPEMovement,
  Equipment,
  EquipmentMaintenanceLog,
  OdometerLog,
  HREvent,
  Attendance,
  TeamRoleValue,
  TyreBrand,
  TyreModel,
  TyreRepair,
  Carga,
} from '../types';

// O projeto anteriormente usava Dexie (localDb) e syncService para modo offline.
// Conforme solicitado pelo usuário, as funcionalidades offline foram DESATIVADAS.
// O sistema agora opera exclusivamente ONLINE, indo direto ao Supabase.

// Configuração de Timeout para buscas (em ms)
const FETCH_TIMEOUT = 30000;

/**
 * Helper para chamadas de API nativas (fetch)
 */
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Erro na requisição: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') throw new Error(`Timeout ao acessar ${endpoint}`);
    throw error;
  }
}


// Mappers (Copiados do original para manter compatibilidade)
const toDbVehicle = (v: Vehicle) => ({
  id: v.id,
  plate: v.plate,
  model: v.model,
  brand: v.brand,
  year: v.year,
  model_year: v.modelYear,
  exercise_year: v.exerciseYear,
  vehicle_type: v.vehicleType,
  owner_name: v.ownerName,
  capacity: v.capacity,
  km: v.km,
  next_maintenance_km: v.nextMaintenanceKm,
  unit_id: v.unitId || null,
  status: v.status,
  photo_url: v.photoUrl,
  documents: v.documents,
  telemetry: v.telemetry,
  last_exit_km: v.lastExitKm,
  last_exit_date: v.lastExitDate
});

const fromDbVehicle = (db: any): Vehicle => ({
  id: db.id,
  plate: db.plate,
  model: db.model,
  brand: db.brand,
  year: Number(db.year) || 0,
  modelYear: Number(db.model_year) || 0,
  exerciseYear: db.exercise_year,
  vehicleType: db.vehicle_type,
  ownerName: db.owner_name,
  capacity: Number(db.capacity) || 0,
  km: Number(db.km) || 0,
  nextMaintenanceKm: Number(db.next_maintenance_km) || 0,
  unitId: db.unit_id,
  status: db.status,
  photoUrl: db.photo_url,
  documents: db.documents || [],
  telemetry: db.telemetry,
  lastExitKm: db.last_exit_km ? Number(db.last_exit_km) : undefined,
  lastExitDate: db.last_exit_date
});

const toDbDriver = (d: Collaborator) => ({
  id: d.id,
  name: d.name,
  cpf: d.cpf,
  role: d.role,
  department: d.department,
  team_id: d.teamId || null,
  unit_id: d.unitId || null,
  admission_date: d.admissionDate || null,
  last_vacation_date: d.lastVacationDate || null,
  leased_cnpj: d.leasedCnpj || null,
  license_number: d.licenseNumber || null,
  license_category: d.licenseCategory || null,
  license_expiry: d.licenseExpiry || null,
  status: d.status,
  phone: d.phone || null,
  email: d.email || null,
  profile_photo: d.profilePhoto || null,
  license_file: d.licenseFile || null,
  courses: d.courses || [],
  equipe: d.equipe || null,
  data_admissao: d.dataAdmissao || null,
  funcao: d.funcao || null,
  salary: d.salary || 0
});

const fromDbDriver = (db: any): Collaborator => ({
  id: db.id,
  name: db.name,
  cpf: db.cpf,
  role: db.role,
  department: db.department,
  teamId: db.team_id,
  unitId: db.unit_id,
  admissionDate: db.admission_date,
  lastVacationDate: db.last_vacation_date,
  leasedCnpj: db.leased_cnpj,
  licenseNumber: db.license_number,
  licenseCategory: db.license_category,
  licenseExpiry: db.license_expiry,
  status: db.status,
  phone: db.phone,
  email: db.email,
  profilePhoto: db.profile_photo,
  licenseFile: db.license_file,
  courses: db.courses || [],
  equipe: db.equipe,
  dataAdmissao: db.data_admissao,
  funcao: db.funcao,
  salary: Number(db.salary) || 0
});

const toDbTeam = (t: Team) => ({
  id: t.id,
  name: t.name,
  number: t.number,
  unit_id: t.unitId || null,
  status: t.status,
  target_staff: t.targetStaff || {}
});

const fromDbTeam = (db: any): Team => ({
  id: db.id,
  name: db.name,
  number: db.number,
  unitId: db.unit_id,
  status: db.status,
  targetStaff: db.target_staff || {}
});

const toDbFuelLog = (l: FuelLog) => ({
  id: l.id,
  vehicle_id: l.vehicleId,
  driver_id: l.driverId || null,
  fuel_station_id: l.fuelStationId || null,
  fuel_type: l.fuelType,
  date: l.date,
  liters: l.liters,
  unit_price: l.unitPrice,
  discount: l.discount,
  cost: l.cost,
  km: l.km,
  invoice_number: l.invoiceNumber,
  team_id: l.teamId || null,
  unit_id: l.unitId || null,
  pump_photo_url: l.pumpPhotoUrl,
  receipt_photo_url: l.receiptPhotoUrl,
  odometer_photo_url: l.odometerPhotoUrl
});

const fromDbFuelLog = (db: any): FuelLog => ({
  id: db.id,
  vehicleId: db.vehicle_id,
  driverId: db.driver_id,
  fuelStationId: db.fuel_station_id,
  fuelType: db.fuel_type,
  date: db.date,
  liters: Number(db.liters) || 0,
  unitPrice: Number(db.unit_price) || 0,
  discount: Number(db.discount) || 0,
  cost: Number(db.cost) || 0,
  km: Number(db.km) || 0,
  invoiceNumber: db.invoice_number,
  teamId: db.team_id,
  unitId: db.unit_id,
  pumpPhotoUrl: db.pump_photo_url,
  receiptPhotoUrl: db.receipt_photo_url,
  odometerPhotoUrl: db.odometer_photo_url
});

const toDbMaintenanceLog = (l: MaintenanceLog) => ({
  id: l.id,
  vehicle_id: l.vehicleId || null,
  unit_id: l.unitId || null,
  team_id: l.teamId || null,
  date: l.date,
  type: l.type,
  description: l.description,
  unit_price: l.unitPrice,
  quantity: l.quantity,
  cost: l.cost,
  km: l.km,
  team: l.team
});

const fromDbMaintenanceLog = (db: any): MaintenanceLog => ({
  id: db.id,
  vehicleId: db.vehicle_id,
  unitId: db.unit_id,
  teamId: db.team_id,
  date: db.date,
  type: db.type,
  description: db.description,
  unitPrice: Number(db.unit_price) || 0,
  quantity: Number(db.quantity) || 0,
  cost: Number(db.cost) || 0,
  km: Number(db.km) || 0,
  team: db.team
});

const toDbWashingLog = (l: WashingLog) => ({
  id: l.id,
  vehicle_id: l.vehicleId || null,
  driver_id: l.driverId || null,
  driver_name: l.driverName || null,
  supplier_id: l.supplierId || null,
  unit_id: l.unitId || null,
  team_id: l.teamId || null,
  date: l.date,
  type: l.type,
  cost: l.cost,
  km: l.km,
  observations: l.observations
});

const fromDbWashingLog = (db: any): WashingLog => ({
  id: db.id,
  vehicleId: db.vehicle_id,
  driverId: db.driver_id,
  driverName: db.driver_name,
  supplierId: db.supplier_id,
  unitId: db.unit_id,
  teamId: db.team_id,
  date: db.date,
  type: db.type,
  cost: Number(db.cost) || 0,
  km: Number(db.km) || 0,
  observations: db.observations
});

const toDbChecklist = (c: ChecklistSession) => ({
  id: c.id,
  vehicle_id: c.vehicleId || null,
  driver_id: c.driverId || null,
  unit_id: c.unitId || null,
  team_id: c.teamId || null,
  date: c.date,
  items: c.items
});

const fromDbChecklist = (db: any): ChecklistSession => ({
  id: db.id,
  vehicleId: db.vehicle_id,
  driverId: db.driver_id,
  unitId: db.unit_id,
  teamId: db.team_id,
  date: db.date,
  items: db.items || []
});

const toDbUser = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  username: u.username,
  password: u.password,
  role: u.role,
  status: u.status,
  allowed_menus: u.allowedMenus || [],
  allowed_teams: u.allowedTeams || []
});

const fromDbUser = (db: any): User => ({
  id: db.id,
  name: db.name,
  email: db.email,
  username: db.username,
  password: db.password,
  role: db.role,
  status: db.status,
  allowedMenus: db.allowed_menus || [],
  allowedTeams: db.allowed_teams || []
});

const toDbSupplier = (s: Supplier) => ({
  id: s.id,
  name: s.name,
  cnpj: s.cnpj,
  category: s.category,
  contact_name: s.contactName,
  phone: s.phone,
  email: s.email,
  address: s.address
});

const fromDbSupplier = (db: any): Supplier => ({
  id: db.id,
  name: db.name,
  cnpj: db.cnpj,
  category: db.category,
  contactName: db.contact_name,
  phone: db.phone,
  email: db.email,
  address: db.address
});

const toDbUnit = (u: Unit) => ({
  id: u.id,
  name: u.name,
  code: u.code,
  responsible: u.responsible,
  address: u.address,
  phone: u.phone
});

const fromDbUnit = (db: any): Unit => ({
  id: db.id,
  name: db.name,
  code: db.code,
  responsible: db.responsible,
  address: db.address,
  phone: db.phone
});

const toDbTyre = (t: Tyre) => ({
  id: t.id,
  serial_number: t.serialNumber,
  brand: t.brand,
  model: t.model,
  size: t.size,
  type: t.type,
  status: t.status,
  initial_thread_depth: t.initialThreadDepth,
  current_thread_depth: t.currentThreadDepth,
  purchase_date: t.purchaseDate,
  supplier: t.supplier || null,
  invoice_number: t.invoiceNumber,
  unit_value: t.unitValue,
  photo_url: t.photoUrl,
  vehicle_id: t.vehicleId || null,
  position: t.position,
  km_at_mount: t.kmAtMount
});

const fromDbTyre = (db: any): Tyre => ({
  id: db.id,
  serialNumber: db.serial_number,
  brand: db.brand,
  model: db.model,
  size: db.size,
  type: db.type,
  status: db.status,
  initialThreadDepth: Number(db.initial_thread_depth) || 0,
  currentThreadDepth: Number(db.current_thread_depth) || 0,
  purchaseDate: db.purchase_date,
  supplier: db.supplier,
  invoiceNumber: db.invoice_number,
  unitValue: Number(db.unit_value) || 0,
  photoUrl: db.photo_url,
  vehicleId: db.vehicle_id,
  position: db.position,
  kmAtMount: db.km_at_mount ? Number(db.km_at_mount) : undefined
});

const toDbTyreAudit = (a: TyreAudit) => ({
  id: a.id,
  tyre_id: a.tyreId || null,
  date: a.date,
  depth: a.depth,
  km: a.km,
  inspector: a.inspector
});

const fromDbTyreAudit = (db: any): TyreAudit => ({
  id: db.id,
  tyreId: db.tyre_id,
  date: db.date,
  depth: Number(db.depth) || 0,
  km: Number(db.km) || 0,
  inspector: db.inspector
});

const toDbTyreMovement = (m: TyreMovement) => ({
  id: m.id,
  tyre_id: m.tyreId || null,
  vehicle_id: m.vehicleId || null,
  date: m.date,
  type: m.type,
  km: m.km,
  position: m.position,
  observations: m.observations
});

const fromDbTyreMovement = (db: any): TyreMovement => ({
  id: db.id,
  tyreId: db.tyre_id,
  vehicleId: db.vehicle_id,
  date: db.date,
  type: db.type,
  km: Number(db.km) || 0,
  position: db.position,
  observations: db.observations
});

const toDbTyreRepair = (r: TyreRepair) => ({
  id: r.id,
  date: r.date,
  vehicle_id: r.vehicleId,
  partner_id: r.partnerId,
  quantity: r.quantity,
  unit_value: r.unitValue,
  description: r.description,
  observations: r.observations
});

const fromDbTyreRepair = (db: any): TyreRepair => ({
  id: db.id,
  date: db.date,
  vehicleId: db.vehicle_id,
  partnerId: db.partner_id,
  quantity: Number(db.quantity) || 0,
  unitValue: Number(db.unit_value) || 0,
  description: db.description,
  observations: db.observations
});

const toDbPPEItem = (i: PPEItem) => ({
  id: i.id,
  name: i.name,
  category: i.category,
  certificate_number: i.certificateNumber,
  ca_expiry_date: i.caExpiryDate || null,
  size: i.size,
  current_stock: i.currentStock,
  min_stock: i.minStock,
  unit_value: i.unitValue,
  manufacturer: i.manufacturer,
  photo_url: i.photoUrl,
  ca_file_url: i.caFileUrl
});

const fromDbPPEItem = (db: any): PPEItem => ({
  id: db.id,
  name: db.name,
  category: db.category,
  certificateNumber: db.certificate_number,
  caExpiryDate: db.ca_expiry_date,
  size: db.size,
  currentStock: Number(db.current_stock) || 0,
  minStock: Number(db.min_stock) || 0,
  unitValue: Number(db.unit_value) || 0,
  manufacturer: db.manufacturer,
  photoUrl: db.photo_url,
  caFileUrl: db.ca_file_url
});

const toDbPPEMovement = (m: PPEMovement) => ({
  id: m.id,
  ppe_id: m.ppeId || null,
  person_id: m.personId || null,
  person_name: m.personName,
  date: m.date || null,
  type: m.type,
  quantity: m.quantity,
  unit_value: m.unitValue,
  total_value: m.totalValue,
  batch_id: m.batchId || null,
  size: m.size,
  invoice_number: m.invoiceNumber,
  certificate_number: m.certificateNumber,
  observations: m.observations,
  responsible_user: m.responsibleUser
});

const fromDbPPEMovement = (db: any): PPEMovement => ({
  id: db.id,
  ppeId: db.ppe_id,
  personId: db.person_id,
  personName: db.person_name,
  date: db.date,
  type: db.type,
  quantity: Number(db.quantity) || 0,
  unitValue: Number(db.unit_value) || 0,
  totalValue: Number(db.total_value) || 0,
  batchId: db.batch_id,
  size: db.size,
  invoiceNumber: db.invoice_number,
  certificateNumber: db.certificate_number,
  observations: db.observations,
  responsibleUser: db.responsible_user
});

const toDbEquipment = (e: Equipment) => ({
  id: e.id,
  name: e.name,
  type: e.type,
  serial_number: e.serialNumber,
  manufacturer: e.manufacturer,
  installation_date: e.installationDate,
  unit_id: e.unitId || null,
  status: e.status,
  last_maintenance_date: e.lastMaintenanceDate,
  photo_url: e.photoUrl,
  team: e.team
});

const fromDbEquipment = (db: any): Equipment => ({
  id: db.id,
  name: db.name,
  type: db.type,
  serialNumber: db.serial_number,
  manufacturer: db.manufacturer,
  installationDate: db.installation_date,
  unitId: db.unit_id,
  status: db.status,
  lastMaintenanceDate: db.last_maintenance_date,
  photoUrl: db.photo_url,
  team: db.team
});

const toDbEquipmentMaintenanceLog = (l: EquipmentMaintenanceLog) => ({
  id: l.id,
  equipment_id: l.equipmentId || null,
  unit_id: l.unitId || null,
  date: l.date,
  type: l.type,
  description: l.description,
  responsible: l.responsible,
  cost: l.cost,
  duration_hours: l.durationHours,
  parts_replaced: l.partsReplaced,
  technical_observations: l.technicalObservations
});

const fromDbEquipmentMaintenanceLog = (db: any): EquipmentMaintenanceLog => ({
  id: db.id,
  equipmentId: db.equipment_id,
  unitId: db.unit_id,
  date: db.date,
  type: db.type,
  description: db.description,
  responsible: db.responsible,
  cost: Number(db.cost) || 0,
  durationHours: Number(db.duration_hours) || 0,
  partsReplaced: db.parts_replaced,
  technicalObservations: db.technical_observations
});

const toDbOdometerLog = (l: OdometerLog) => ({
  id: l.id,
  vehicle_id: l.vehicleId || null,
  km: l.km,
  date: l.date,
  type: l.type,
  driver_id: l.driverId || null,
  trip_km: l.tripKm
});

const fromDbOdometerLog = (db: any): OdometerLog => ({
  id: db.id,
  vehicleId: db.vehicle_id,
  km: Number(db.km) || 0,
  date: db.date,
  type: db.type,
  driverId: db.driver_id,
  tripKm: db.trip_km ? Number(db.trip_km) : undefined
});

const fromDbAttendance = (d: any): Attendance => ({
  id: d.id,
  collaboratorId: d.collaborator_id,
  teamId: d.team_id,
  date: d.date,
  status: d.status,
  recordedBy: d.recorded_by,
  replacedByDiarista: d.replaced_by_diarista,
  diaristaName: d.diarista_name,
  createdAt: d.created_at,
});

const toDbAttendance = (a: Attendance) => ({
  id: a.id,
  collaborator_id: a.collaboratorId,
  team_id: a.teamId,
  date: a.date,
  status: a.status,
  recorded_by: a.recordedBy,
  replaced_by_diarista: a.replacedByDiarista,
  diarista_name: a.diaristaName,
  created_at: a.createdAt,
});

const fromDbCarga = (db: any): Carga => ({
  id: db.id,
  date: db.date,
  teamId: db.team_id,
  birdsCount: Number(db.birds_count) || 0,
  tons: Number(db.tons) || 0,
  cargasCount: Number(db.cargas_count) || 0,
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

const toDbCarga = (c: Carga) => ({
  id: c.id,
  date: c.date,
  team_id: c.teamId,
  birds_count: c.birdsCount,
  tons: c.tons,
  cargas_count: c.cargasCount || 0,
  created_at: c.createdAt,
  updated_at: c.updatedAt
});

const toDbFuelType = (t: FuelType) => ({
  id: t.id,
  name: t.name,
  category: t.category
});

const fromDbFuelType = (db: any): FuelType => ({
  id: db.id,
  name: db.name,
  category: db.category
});

const toDbTyreBrand = (b: TyreBrand) => ({
  id: b.id,
  name: b.name
});

const fromDbTyreBrand = (db: any): TyreBrand => ({
  id: db.id,
  name: db.name
});

const toDbTyreModel = (m: TyreModel) => ({
  id: m.id,
  brand_id: m.brandId,
  name: m.name
});

const fromDbTyreModel = (db: any): TyreModel => ({
  id: db.id,
  brandId: db.brand_id,
  name: db.name
});

const toDbHREvent = (e: HREvent) => ({
  id: e.id,
  collaborator_id: e.collaboratorId,
  type: e.type,
  start_date: e.startDate,
  end_date: e.endDate || null,
  description: e.description,
  responsible: e.responsible,
  created_at: e.createdAt,
});

const fromDbHREvent = (db: any): HREvent => ({
  id: db.id,
  collaboratorId: db.collaborator_id,
  type: db.type,
  startDate: db.start_date,
  endDate: db.end_date,
  description: db.description,
  responsible: db.responsible,
  createdAt: db.created_at,
});

const toDbTeamRoleValue = (v: TeamRoleValue) => ({
  id: v.id,
  role: v.role,
  load_value: v.loadValue,
  active: v.active
});

const fromDbTeamRoleValue = (db: any): TeamRoleValue => ({
  id: db.id,
  role: db.role,
  loadValue: db.load_value || db.value || 0, // Fallback para nomes de colunas alternativos
  active: db.active
});

/**
 * HELPERS DE DATABASE (ONLINE ONLY)
 */
export const db = {
  vehicles: {
    getAll: async () => {
      const data = await apiFetch('/vehicles');
      return (data || []).map(fromDbVehicle);
    },
    upsert: async (v: Vehicle) => {
      await apiFetch('/vehicles/upsert', { method: 'POST', body: JSON.stringify(toDbVehicle(v)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/vehicles?id=${id}`, { method: 'DELETE' });
    }
  },
  drivers: {
    getAll: async () => {
      const data = await apiFetch('/drivers');
      return (data || []).map(fromDbDriver);
    },
    upsert: async (d: Collaborator) => {
      await apiFetch('/drivers/upsert', { method: 'POST', body: JSON.stringify(toDbDriver(d)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/drivers?id=${id}`, { method: 'DELETE' });
    },
    deleteAll: async () => {
        // Implementação simplificada se necessário
    }
  },
  teams: {
    getAll: async () => {
      const data = await apiFetch('/teams');
      return (data || []).map(fromDbTeam);
    },
    upsert: async (t: Team) => {
      await apiFetch('/teams/upsert', { method: 'POST', body: JSON.stringify(toDbTeam(t)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/teams?id=${id}`, { method: 'DELETE' });
    }
  },
  fuelLogs: {
    getAll: async () => {
      const data = await apiFetch('/fuel_logs?order=date&limit=1000');
      return (data || []).map(fromDbFuelLog);
    },
    insert: async (l: FuelLog) => {
      await apiFetch('/fuel_logs/upsert', { method: 'POST', body: JSON.stringify(toDbFuelLog(l)) });
    },
    upsert: async (l: FuelLog) => {
      await apiFetch('/fuel_logs/upsert', { method: 'POST', body: JSON.stringify(toDbFuelLog(l)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/fuel_logs?id=${id}`, { method: 'DELETE' });
    }
  },
  maintenanceLogs: {
    getAll: async () => {
      const data = await apiFetch('/maintenance_logs?order=date&limit=1000');
      return (data || []).map(fromDbMaintenanceLog);
    },
    insert: async (l: MaintenanceLog) => {
      await apiFetch('/maintenance_logs/upsert', { method: 'POST', body: JSON.stringify(toDbMaintenanceLog(l)) });
    },
    upsert: async (l: MaintenanceLog) => {
      await apiFetch('/maintenance_logs/upsert', { method: 'POST', body: JSON.stringify(toDbMaintenanceLog(l)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/maintenance_logs?id=${id}`, { method: 'DELETE' });
    }
  },
  washingLogs: {
    getAll: async () => {
      const data = await apiFetch('/washing_logs?order=date&limit=1000');
      return (data || []).map(fromDbWashingLog);
    },
    insert: async (l: WashingLog) => {
      await apiFetch('/washing_logs/upsert', { method: 'POST', body: JSON.stringify(toDbWashingLog(l)) });
    },
    upsert: async (l: WashingLog) => {
      await apiFetch('/washing_logs/upsert', { method: 'POST', body: JSON.stringify(toDbWashingLog(l)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/washing_logs?id=${id}`, { method: 'DELETE' });
    }
  },
  suppliers: {
    getAll: async () => {
      const data = await apiFetch('/suppliers');
      return (data || []).map(fromDbSupplier);
    },
    upsert: async (s: Supplier) => {
      await apiFetch('/suppliers/upsert', { method: 'POST', body: JSON.stringify(toDbSupplier(s)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/suppliers?id=${id}`, { method: 'DELETE' });
    }
  },
  units: {
    getAll: async () => {
      const data = await apiFetch('/units');
      return (data || []).map(fromDbUnit);
    },
    upsert: async (u: Unit) => {
      await apiFetch('/units/upsert', { method: 'POST', body: JSON.stringify(toDbUnit(u)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/units?id=${id}`, { method: 'DELETE' });
    }
  },
  fuelTypes: {
    getAll: async () => {
      const data = await apiFetch('/fuel_types');
      return (data || []).map(fromDbFuelType);
    },
    upsert: async (t: FuelType) => {
      await apiFetch('/fuel_types/upsert', { method: 'POST', body: JSON.stringify(toDbFuelType(t)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/fuel_types?id=${id}`, { method: 'DELETE' });
    }
  },
  users: {
    getAll: async () => {
      const data = await apiFetch('/app_users');
      return (data || []).map(fromDbUser);
    },
    upsert: async (u: User) => {
      await apiFetch('/app_users/upsert', { method: 'POST', body: JSON.stringify(toDbUser(u)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/app_users?id=${id}`, { method: 'DELETE' });
    }
  },
  checklists: {
    getAll: async () => {
      const data = await apiFetch('/checklists?order=date&limit=1000');
      return (data || []).map(fromDbChecklist);
    },
    insert: async (c: ChecklistSession) => {
      await apiFetch('/checklists/upsert', { method: 'POST', body: JSON.stringify(toDbChecklist(c)) });
    }
  },
  tyres: {
    getAll: async () => {
      const data = await apiFetch('/tyres');
      return (data || []).map(fromDbTyre);
    },
    upsert: async (t: Tyre) => {
      await apiFetch('/tyres/upsert', { method: 'POST', body: JSON.stringify(toDbTyre(t)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/tyres?id=${id}`, { method: 'DELETE' });
    }
  },
  tyreAudits: {
    getAll: async () => {
      const data = await apiFetch('/tyre_audits?order=date&limit=1000');
      return (data || []).map(fromDbTyreAudit);
    },
    insert: async (a: TyreAudit) => {
      await apiFetch('/tyre_audits/upsert', { method: 'POST', body: JSON.stringify(toDbTyreAudit(a)) });
    }
  },
  tyreMovements: {
    getAll: async () => {
      const data = await apiFetch('/tyre_movements?order=date&limit=1000');
      return (data || []).map(fromDbTyreMovement);
    },
    upsert: async (m: TyreMovement) => {
      await apiFetch('/tyre_movements/upsert', { method: 'POST', body: JSON.stringify(toDbTyreMovement(m)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/tyre_movements?id=${id}`, { method: 'DELETE' });
    }
  },
  tyreBrands: {
    getAll: async () => {
      const data = await apiFetch('/tyre_brands?order=name');
      return (data || []).map(fromDbTyreBrand);
    },
    upsert: async (b: TyreBrand) => {
      await apiFetch('/tyre_brands/upsert', { method: 'POST', body: JSON.stringify(toDbTyreBrand(b)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/tyre_brands?id=${id}`, { method: 'DELETE' });
    }
  },
  tyreModels: {
    getAll: async () => {
      const data = await apiFetch('/tyre_models?order=name');
      return (data || []).map(fromDbTyreModel);
    },
    upsert: async (m: TyreModel) => {
      await apiFetch('/tyre_models/upsert', { method: 'POST', body: JSON.stringify(toDbTyreModel(m)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/tyre_models?id=${id}`, { method: 'DELETE' });
    }
  },
  tyreRepairs: {
    getAll: async () => {
      const data = await apiFetch('/tyre_repairs?order=date&limit=1000');
      return (data || []).map(fromDbTyreRepair);
    },
    upsert: async (r: TyreRepair) => {
      await apiFetch('/tyre_repairs/upsert', { method: 'POST', body: JSON.stringify(toDbTyreRepair(r)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/tyre_repairs?id=${id}`, { method: 'DELETE' });
    }
  },
  ppeItems: {
    getAll: async () => {
      const data = await apiFetch('/ppe_items');
      return (data || []).map(fromDbPPEItem);
    },
    upsert: async (i: PPEItem) => {
      await apiFetch('/ppe_items/upsert', { method: 'POST', body: JSON.stringify(toDbPPEItem(i)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/ppe_items?id=${id}`, { method: 'DELETE' });
    }
  },
  ppeMovements: {
    getAll: async () => {
      const data = await apiFetch('/ppe_movements?order=date&limit=1000');
      return (data || []).map(fromDbPPEMovement);
    },
    upsert: async (m: PPEMovement) => {
      await apiFetch('/ppe_movements/upsert', { method: 'POST', body: JSON.stringify(toDbPPEMovement(m)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/ppe_movements?id=${id}`, { method: 'DELETE' });
    }
  },
  equipments: {
    getAll: async () => {
      const data = await apiFetch('/equipments');
      return (data || []).map(fromDbEquipment);
    },
    upsert: async (e: Equipment) => {
      await apiFetch('/equipments/upsert', { method: 'POST', body: JSON.stringify(toDbEquipment(e)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/equipments?id=${id}`, { method: 'DELETE' });
    }
  },
  equipmentMaintenanceLogs: {
    getAll: async () => {
      const data = await apiFetch('/equipment_maintenance_logs?order=date&limit=1000');
      return (data || []).map(fromDbEquipmentMaintenanceLog);
    },
    upsert: async (l: EquipmentMaintenanceLog) => {
      await apiFetch('/equipment_maintenance_logs/upsert', { method: 'POST', body: JSON.stringify(toDbEquipmentMaintenanceLog(l)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/equipment_maintenance_logs?id=${id}`, { method: 'DELETE' });
    }
  },
  odometerLogs: {
    getAll: async () => {
      const data = await apiFetch('/odometer_logs?order=date&limit=1000');
      return (data || []).map(fromDbOdometerLog);
    },
    insert: async (l: OdometerLog) => {
      await apiFetch('/odometer_logs/upsert', { method: 'POST', body: JSON.stringify(toDbOdometerLog(l)) });
    },
    upsert: async (l: OdometerLog) => {
      await apiFetch('/odometer_logs/upsert', { method: 'POST', body: JSON.stringify(toDbOdometerLog(l)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/odometer_logs?id=${id}`, { method: 'DELETE' });
    }
  },
  hrEvents: {
    getAll: async () => {
      const data = await apiFetch('/hr_events?order=created_at&limit=1000');
      return (data || []).map(fromDbHREvent);
    },
    insert: async (e: HREvent) => {
      await apiFetch('/hr_events/upsert', { method: 'POST', body: JSON.stringify(toDbHREvent(e)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/hr_events?id=${id}`, { method: 'DELETE' });
    }
  },
  attendance: {
    getAll: async () => {
      const data = await apiFetch('/attendance?order=date&limit=1000');
      return (data || []).map(fromDbAttendance);
    },
    upsert: async (a: Attendance) => {
      await apiFetch('/attendance/upsert', { method: 'POST', body: JSON.stringify(toDbAttendance(a)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/attendance?id=${id}`, { method: 'DELETE' });
    }
  },
  teamRoleValues: {
    getAll: async () => {
      const data = await apiFetch('/team_role_values?order=role');
      return (data || []).map(fromDbTeamRoleValue);
    },
    upsert: async (v: TeamRoleValue) => {
      await apiFetch('/team_role_values/upsert', { method: 'POST', body: JSON.stringify(toDbTeamRoleValue(v)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/team_role_values?id=${id}`, { method: 'DELETE' });
    }
  },
  cargas: {
    getAll: async () => {
      const data = await apiFetch('/cargas?order=date&limit=1000');
      return (data || []).map(fromDbCarga);
    },
    upsert: async (c: Carga) => {
      await apiFetch('/cargas/upsert', { method: 'POST', body: JSON.stringify(toDbCarga(c)) });
    },
    delete: async (id: string) => {
      await apiFetch(`/cargas?id=${id}`, { method: 'DELETE' });
    }
  },
  mappers: {
    fromDbVehicle,
    fromDbDriver,
    fromDbTeam,
    fromDbFuelLog,
    fromDbMaintenanceLog,
    fromDbWashingLog,
    fromDbCarga,
    fromDbAttendance,
    fromDbUser,
    fromDbSupplier,
    fromDbUnit,
    fromDbFuelType,
    fromDbTyreBrand,
    fromDbTyreModel,
    fromDbHREvent,
    fromDbTeamRoleValue,
    fromDbTyre,
    fromDbTyreAudit,
    fromDbTyreMovement,
    fromDbTyreRepair,
    fromDbPPEItem,
    fromDbPPEMovement,
    fromDbEquipment,
    fromDbEquipmentMaintenanceLog,
    fromDbOdometerLog,
    fromDbChecklist
  }
};
