require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos em .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'averaldo_teste',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
});

const tables = [
  'vehicles',
  'drivers',
  'teams',
  'fuel_logs',
  'maintenance_logs',
  'washing_logs',
  'suppliers',
  'units',
  'fuel_types',
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
  'hr_events',
  'attendance',
  'cargas'
];

async function cloneTable(table) {
  console.log(`\n📦 Clonando tabela: ${table}...`);
  
  const { data, error } = await supabase.from(table).select('*');
  
  if (error) {
    console.error(`❌ Erro ao buscar dados de ${table} no Supabase:`, error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log(`⚠️ Nenhum dado encontrado em ${table}.`);
    return;
  }
  
  console.log(`✅ ${data.length} registros encontrados em ${table}. Inserindo no local...`);
  
  for (const row of data) {
    const columns = Object.keys(row).map(col => `"${col}"`).join(', ');
    const values = Object.values(row);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const updates = Object.keys(row).map((col, i) => `"${col}" = EXCLUDED."${col}"`).join(', ');

    const query = `
      INSERT INTO "${table}" (${columns}) 
      VALUES (${placeholders}) 
      ON CONFLICT (id) DO UPDATE SET ${updates};
    `;
    
    try {
      await pool.query(query, values);
    } catch (err) {
      console.error(`❌ Erro ao inserir registro em ${table} (ID: ${row.id}):`, err.message);
    }
  }
  console.log(`✨ Tabela ${table} sincronizada.`);
}

async function run() {
  try {
    for (const table of tables) {
      await cloneTable(table);
    }
    console.log("\n🚀 Sincronização concluída com sucesso!");
  } catch (err) {
    console.error("\n❌ Erro crítico durante a sincronização:", err.message);
  } finally {
    await pool.end();
  }
}

run();
