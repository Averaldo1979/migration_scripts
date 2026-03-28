
import Dexie, { Table } from 'dexie';
import {
  Vehicle,
  Driver,
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

export interface OfflineAction {
  id?: number;
  table: string;
  action: 'UPSERT' | 'DELETE' | 'INSERT';
  data: any;
  timestamp: number;
}

export class AppDatabase extends Dexie {
  vehicles!: Table<Vehicle>;
  drivers!: Table<Driver>;
  fuelLogs!: Table<FuelLog>;
  maintenanceLogs!: Table<MaintenanceLog>;
  washingLogs!: Table<WashingLog>;
  suppliers!: Table<Supplier>;
  units!: Table<Unit>;
  fuelTypes!: Table<FuelType>;
  users!: Table<User>;
  teams!: Table<Team>;
  tyres!: Table<Tyre>;
  tyreAudits!: Table<TyreAudit>;
  tyreMovements!: Table<TyreMovement>;
  ppeItems!: Table<PPEItem>;
  ppeMovements!: Table<PPEMovement>;
  equipments!: Table<Equipment>;
  equipmentMaintenanceLogs!: Table<EquipmentMaintenanceLog>;
  odometerLogs!: Table<OdometerLog>;
  hrEvents!: Table<HREvent>;
  attendance!: Table<Attendance>;
  teamRoleValues!: Table<TeamRoleValue>;
  tyreBrands!: Table<TyreBrand>;
  tyreModels!: Table<TyreModel>;
  tyreRepairs!: Table<TyreRepair>;
  checklistSessions!: Table<ChecklistSession>;
  cargas!: Table<Carga>;
  
  offlineQueue!: Table<OfflineAction>;

  constructor() {
    super('FrotaControlLocalDB');
    this.version(1).stores({
      vehicles: 'id, plate',
      drivers: 'id, name, cpf',
      fuelLogs: 'id, date, vehicleId',
      maintenanceLogs: 'id, date, vehicleId',
      washingLogs: 'id, date, vehicleId',
      suppliers: 'id, name',
      units: 'id, name',
      fuelTypes: 'id, name',
      users: 'id, email',
      teams: 'id, number',
      tyres: 'id, serialNumber',
      tyreAudits: 'id, tyreId, date',
      tyreMovements: 'id, tyreId, date',
      ppeItems: 'id, name',
      ppeMovements: 'id, date',
      equipments: 'id, name',
      equipmentMaintenanceLogs: 'id, date',
      odometerLogs: 'id, date',
      hrEvents: 'id, collaboratorId, date',
      attendance: 'id, collaboratorId, date',
      teamRoleValues: 'id, role',
      tyreBrands: 'id, name',
      tyreModels: 'id, name',
      tyreRepairs: 'id, date',
      checklistSessions: 'id, date, vehicleId',
      cargas: 'id, date',
      offlineQueue: '++id, table, action'
    });
  }
}

export const localDb = new AppDatabase();
