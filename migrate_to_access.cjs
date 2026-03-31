const { Pool } = require('pg');
const ADODB = require('node-adodb');
const path = require('path');

// PostgreSQL Source
const pgPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'averaldo_teste',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
});

// MS Access Destination
const accessDbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${accessDbPath};Persist Security Info=False;`;
const access = ADODB.open(connectionString, process.arch === 'x64');

const tables = [
  'units',
  'teams',
  'vehicles',
  'drivers',
  'fuel_stations',
  'fuel_logs',
  'maintenance_logs',
  'suppliers',
  'washing_logs',
  'app_users',
  'checklists',
  'tyres',
  'tyre_audits',
  'tyre_movements',
  'tyre_repairs',
  'ppe_items',
  'ppe_movements',
  'equipments',
  'equipment_maintenance_logs',
  'odometer_logs',
  'attendance',
  'cargas',
  'history_logs',
  'hr_events',
  'fuel_types',
  'tyre_brands',
  'tyre_models',
  'team_role_values'
];

async function migrate() {
  console.log("🚀 Iniciando migração para MS Access...");
  
  for (const table of tables) {
    try {
      console.log(`\n📦 Analisando tabela ${table}...`);
      
      // 1. Get data from PostgreSQL
      const { rows } = await pgPool.query(`SELECT * FROM "${table}"`);
      if (rows.length === 0) {
        console.log(`⚠️ Tabela ${table} está vazia. Ignorando.`);
        continue;
      }

      console.log(`📥 Importando ${rows.length} registros para Access...`);

      // 2. Prepare Insert
      for (const row of rows) {
        const columns = Object.keys(row).map(c => `[${c}]`).join(', ');
        const values = Object.values(row).map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`; // Local storage for JSONB
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          return val;
        }).join(', ');

        const sql = `INSERT INTO [${table}] (${columns}) VALUES (${values})`;
        
        try {
          await access.execute(sql);
        } catch (e) {
          if (e.message.includes("does not exist") || e.message.includes("could not find the object")) {
             console.error(`❌ Erro: Tabela [${table}] não existe no MS Access! Crucial criar estrutura primeiro.`);
             break;
          }
          console.error(`❌ Erro ao inserir na linha de ${table}:`, e.message);
        }
      }
      console.log(`✅ Tabela ${table} finalizada.`);
    } catch (err) {
      console.error(`❌ Erro ao processar ${table}:`, err.message);
    }
  }

  await pgPool.end();
  console.log("\n✨ Migração concluída!");
}

migrate();
