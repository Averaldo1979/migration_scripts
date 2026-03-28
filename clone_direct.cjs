const { Pool } = require('pg');

const supabaseConfig = {
  host: 'db.mqnhvrlhnacktwbuoinz.supabase.co',
  port: 5432, // Porta padrão. Se falhar, tente a 6543
  database: 'postgres',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
};

const localConfig = {
  host: 'localhost',
  port: 5432,
  database: 'averaldo_teste',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
};

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
  'hr_events',
  'fuel_types',
  'tyre_brands',
  'tyre_models',
  'team_role_values'
];

async function cloneData() {
  const supabasePool = new Pool(supabaseConfig);
  const localPool = new Pool(localConfig);

  console.log("🚀 Iniciando clonagem direta via Postgres...");

  try {
    for (const table of tables) {
      console.log(`\n📦 Processando tabela: ${table}...`);
      
      let result;
      try {
        result = await supabasePool.query(`SELECT * FROM "${table}"`);
      } catch (err) {
        console.error(`❌ Erro ao buscar dados de ${table} no Supabase:`, err.message);
        if (err.message.includes('restricted') || err.message.includes('quota')) {
           console.log("🛑 O projeto Supabase está bloqueado. Sincronização interrompida.");
           break;
        }
        continue;
      }
      const rows = result.rows;

      if (rows.length === 0) {
        console.log(`⚠️ Tabela ${table} está vazia.`);
        continue;
      }

      console.log(`✅ ${rows.length} registros encontrados. Inserindo no local...`);

      for (const row of rows) {
        const columns = Object.keys(row).map(c => `"${c}"`).join(', ');
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const updates = Object.keys(row).map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');

        const query = `
          INSERT INTO "${table}" (${columns}) 
          VALUES (${placeholders}) 
          ON CONFLICT (id) DO UPDATE SET ${updates};
        `;

        try {
          await localPool.query(query, values);
        } catch (err) {
          console.error(`❌ Erro ao inserir ID ${row.id} em ${table}:`, err.message);
        }
      }
      console.log(`✨ Sincronização de ${table} completa.`);
    }
    console.log("\n✅ SINCROINIZAÇÃO TOTAL CONCLUÍDA!");
  } catch (err) {
    console.error("\n❌ Erro crítico:", err.message);
  } finally {
    await supabasePool.end();
    await localPool.end();
  }
}

cloneData();
