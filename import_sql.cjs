const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'averaldo_teste',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
});

const sqlDir = 'C:\\Users\\everaldo\\Desktop\\Projeto Sistema';

// Ordem sugerida para evitar erros de FK
const sqlFiles = [
  'units_rows.sql',
  'teams_rows.sql',
  'drivers_rows.sql',
  'vehicles_rows.sql',
  'suppliers_rows.sql',
  'app_users_rows.sql',
  'fuel_types_rows.sql',
  'tyre_brands_rows.sql',
  'tyre_models_rows.sql',
  'tyres_rows.sql',
  'fuel_logs_rows.sql',
  'maintenance_logs_rows.sql',
  'washing_logs_rows.sql',
  'ppe_items_rows.sql',
  'ppe_movements_rows.sql',
  'attendance_rows.sql',
  'cargas_rows.sql',
  'hr_events_rows.sql',
  'history_logs_rows.sql',
  'odometer_logs_rows.sql',
  'tyre_movements_rows.sql',
  'tyre_repairs_rows.sql',
  'team_role_values_rows.sql'
];

async function importSQL() {
  console.log("🚀 Iniciando importação de dados SQL...");

  for (const file of sqlFiles) {
    const filePath = path.join(sqlDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Arquivo ignorado (não encontrado): ${file}`);
      continue;
    }

    console.log(`\n📄 Importando ${file}...`);
    
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Alguns arquivos podem estar vazios ou sem comandos válidos
      if (!sql.trim()) {
        console.log(`⚠️ Arquivo ${file} está vazio.`);
        continue;
      }

      await pool.query("SET session_replication_role = 'replica';");
      await pool.query(sql);
      await pool.query("SET session_replication_role = 'origin';");
      console.log(`✅ ${file} importado com sucesso!`);
    } catch (err) {
      console.error(`❌ Erro ao importar ${file}:`, err.message);
    }
  }

  console.log("\n✨ TODOS OS ARQUIVOS PROCESSADOS!");
  
  try {
    const { rows } = await pool.query("SELECT COUNT(*) FROM app_users");
    console.log(`📊 Total de usuários no banco: ${rows[0].count}`);
  } catch (e) {
    console.error("Erro ao verificar usuários:", e.message);
  }

  await pool.end();
}

importSQL();
