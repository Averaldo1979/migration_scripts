
export enum EquipmentStatus {
  OPERATIONAL = 'Operacional',
  DOWN = 'Parado',
  WARNING = 'Alerta/Atenção'
}


export interface Equipment {
  id: string;
  name: string;
  type: 'Esteira' | 'Correia' | 'DR/Elétrico' | 'Motor' | 'Outros' | 'Exaustor' | 'Gerador';
  serialNumber: string;
  manufacturer?: string;
  installationDate: string;
  unitId: string;
  status: EquipmentStatus;
  lastMaintenanceDate?: string;
  photoUrl?: string;
  team?: string;
}

export interface EquipmentMaintenanceLog {
  id: string;
  equipmentId: string;
  unitId: string;
  date: string;
  type: 'Preventiva' | 'Preditiva' | 'Corretiva';
  description: string;
  responsible: string;
  cost: number;
  durationHours: number;
  partsReplaced?: string;
  technicalObservations?: string;
}

export enum VehicleStatus {
  AVAILABLE = 'Disponível',
  IN_USE = 'Em Operação',
  MAINTENANCE = 'Manutenção',
  WASHING = 'Em Lavagem'
}

export enum UserRole {
  ADMIN = 'Administrador',
  MANAGER = 'Gerente',
  OPERATOR = 'Operador'
}

export enum TyreStatus {
  STOCK = 'Estoque',
  MOUNTED = 'Montado',
  REPAIRED = 'Reparo',
  SCRAP = 'Descarte'
}

export enum TyrePosition {
  FL = 'Dian. Esq.',
  FR = 'Dian. Dir.',
  RL = 'Tras. Esq. Ext.',
  RLI = 'Tras. Esq. Int.',
  RR = 'Tras. Dir. Ext.',
  RRI = 'Tras. Dir. Int.'
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  modelYear: number;
  exerciseYear: string;
  vehicleType: string;
  ownerName: string;
  capacity: number;
  km: number;
  nextMaintenanceKm: number;
  unitId: string;
  status: VehicleStatus;
  photoUrl?: string;
  documents: VehicleDocument[];
  telemetry?: TelemetryData;
  lastExitKm?: number;
  lastExitDate?: string;
}

export interface Unit {
  id: string;
  name: string;
  code: string;
  responsible: string;
  address: string;
  phone: string;
}

export interface Team {
  id: string;
  name: string;
  number: string;
  unitId: string;
  status: 'Ativa' | 'Inativa' | 'Ativo' | 'Inativo';
  targetStaff?: Record<string, { meta: number; salary: number }>;
}

export interface Course {
  id: string;
  name: string;
  completionDate: string;
  expiryDate?: string;
  certificateFile?: string;
}

export type StaffFunction = 'Motorista' | 'Gerente' | 'Supervisor' | 'Encarregado' | 'Batedor' | 'Apanhador';

export interface Collaborator {
  id: string;
  name: string;
  cpf: string;
  role: StaffFunction;
  department: string;
  teamId?: string;
  unitId?: string;
  admissionDate?: string;
  lastVacationDate?: string;
  leasedCnpj?: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiry?: string;
  status: 'Ativo' | 'Inativo' | 'Em Viagem' | 'Férias' | 'Afastado';
  phone: string;
  email: string;
  courses: Course[];
  profilePhoto?: string;
  licenseFile?: string;
  equipe?: string;
  dataAdmissao?: string;
  funcao?: string;
  salary?: number;
}

export type Driver = Collaborator;

export interface TeamRoleValue {
  id: string;
  role: string;
  loadValue: number;
  active: boolean;
}


export interface FuelLog {
  id: string;
  vehicleId: string;
  driverId?: string;
  fuelStationId?: string;
  fuelType: string;
  date: string;
  liters: number;
  unitPrice: number;
  discount?: number;
  cost: number;
  km: number;
  invoiceNumber?: string;
  teamId?: string;
  unitId?: string;
  pumpPhotoUrl?: string;
  receiptPhotoUrl?: string;
  odometerPhotoUrl?: string;
}

export interface FuelLogEnriched extends FuelLog {
  kmTraveled: number;
  kmPerLiter: number;
  costPerKm: number;
}

export interface FuelType {
  id: string;
  name: string;
  category: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  unitId?: string;
  teamId?: string;
  date: string;
  type: 'Preventiva' | 'Corretiva';
  description: string;
  unitPrice: number;
  quantity: number;
  cost: number;
  km: number;
  team: string;
}

export interface WashingLog {
  id: string;
  vehicleId: string;
  driverId?: string;
  driverName?: string;
  supplierId: string;
  unitId?: string;
  teamId?: string;
  date: string;
  type: 'Simples' | 'Completa' | 'Motor' | 'Chassi' | 'Higienização Interna';
  cost: number;
  km: number;
  observations?: string;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

export interface SupplierCategory {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  status: 'Ativo' | 'Inativo';
  allowedMenus?: string[];
  allowedTeams?: string[];
}

export interface ChecklistTemplateItem {
  id: string;
  label: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: 'OK' | 'NOK' | 'NA';
}

export interface ChecklistSession {
  id: string;
  vehicleId: string;
  driverId: string;
  unitId?: string;
  teamId?: string;
  date: string;
  items: ChecklistItem[];
}

export interface Tyre {
  id: string;
  serialNumber: string;
  batchId?: string;
  brand: string;
  model: string;
  size: string;
  type: 'Novo' | 'Recapado';
  status: TyreStatus;
  initialThreadDepth: number;
  currentThreadDepth: number;
  purchaseDate: string;
  supplier?: string;
  invoiceNumber?: string;
  unitValue?: number;
  photoUrl?: string;
  vehicleId?: string;
  position?: TyrePosition;
  kmAtMount?: number;
}

export interface TyreAudit {
  id: string;
  tyreId: string;
  date: string;
  depth: number;
  km: number;
  inspector: string;
}

export interface TyreMovement {
  id: string;
  tyreId: string;
  vehicleId?: string;
  date: string;
  type: 'Montagem' | 'Desmontagem' | 'Entrada' | 'Saída';
  km: number;
  position?: TyrePosition;
  observations?: string;
}

export interface OdometerLog {
  id: string;
  vehicleId: string;
  km: number;
  date: string;
  type: 'Saída' | 'Retorno' | 'Ajuste';
  driverId?: string;
  tripKm?: number;
}

export interface PPEItem {
  id: string;
  name: string;
  category: 'Proteção Cabeça' | 'Proteção Visual' | 'Proteção Auditiva' | 'Proteção Respiratória' | 'Proteção Mãos' | 'Proteção Pés' | 'Vestuário' | 'Outros';
  certificateNumber: string;
  caExpiryDate: string;
  size?: string;
  currentStock: number;
  minStock: number;
  unitValue?: number;
  manufacturer?: string;
  photoUrl?: string;
  caFileUrl?: string;
}

export interface PPEMovement {
  id: string;
  ppeId: string;
  personId?: string;
  personName?: string;
  date: string;
  type: 'Entrada' | 'Saída' | 'Ajuste';
  quantity: number;
  unitValue?: number;
  totalValue?: number;
  batchId?: string;
  size?: string;
  invoiceNumber?: string;
  certificateNumber?: string;
  observations?: string;
  responsibleUser: string;
}

export interface VehicleDocument {
  id: string;
  name: string;
  expiryDate: string;
  status: 'Ativo' | 'Inativo';
  fileUrl?: string;
}

export interface TelemetryData {
  ignition: boolean;
  speed: number;
  rpm: number;
  engineTemp: number;
  fuelLevel: number;
  odometer: number;
  latitude: number;
  longitude: number;
  safetyScore: number;
  idlingTime: number;
}

export interface LocationPoint {
  id: string;
  name: string;
  address: string;
  type: 'Base' | 'Cliente' | 'Apoio' | 'Posto';
  latitude?: string;
  longitude?: string;
}

export interface FuelStation {
  id: string;
  name: string;
  address: string;
  brand?: string;
  latitude?: string;
  longitude?: string;
}

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

export type AttendanceStatus = 'Presente' | 'Falta' | 'Atestado' | 'Folga';

export interface Attendance {
  id: string;
  collaboratorId: string;
  teamId: string;
  date: string;
  status: AttendanceStatus;
  recordedBy?: string;
  replacedByDiarista?: boolean;
  diaristaName?: string;
  certificateUrl?: string;
  certificateType?: 'photo' | 'file';
  isExtra?: boolean;
  createdAt: string;
}

export interface TyreBrand {
  id: string;
  name: string;
}

export interface TyreModel {
  id: string;
  brandId: string;
  name: string;
}

export interface TyreRepair {
  id: string;
  date: string;
  vehicleId: string;
  partnerId: string;
  quantity: number;
  unitValue: number;
  description: string;
  observations?: string;
}
export interface Carga {
  id: string;
  date: string;
  teamId: string;
  birdsCount: number;
  tons: number;
  cargasCount: number;
  createdAt?: string;
  updatedAt?: string;
}

