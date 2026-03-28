const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pgPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'averaldo_teste',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
});

const tables = [
  'units', 'teams', 'vehicles', 'drivers', 'fuel_stations', 'fuel_logs', 
  'maintenance_logs', 'suppliers', 'washing_logs', 'app_users', 'checklists', 
  'tyres', 'tyre_audits', 'tyre_movements', 'tyre_repairs', 'ppe_items', 
  'ppe_movements', 'equipments', 'equipment_maintenance_logs', 'odometer_logs', 
  'attendance', 'cargas', 'history_logs', 'hr_events', 'fuel_types', 
  'tyre_brands', 'tyre_models', 'team_role_values'
];

async function exportToJSON() {
  console.log("💾 Exportando dados do PostgreSQL para JSON...");
  for (const table of tables) {
    try {
      const { rows } = await pgPool.query(`SELECT * FROM "${table}"`);
      if (rows.length > 0) {
          fs.writeFileSync(`temp_${table}.json`, JSON.stringify(rows));
          console.log(`✅ ${table} exportado.`);
      }
    } catch (err) {
      console.error(`❌ Erro ao exportar ${table}:`, err.message);
    }
  }
  await pgPool.end();
}

exportToJSON();
