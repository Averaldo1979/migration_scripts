const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'averaldo_teste',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
});

const sqlFile = 'C:\\Users\\everaldo\\Desktop\\Projeto Sistema\\drivers_rows.sql';

async function updateDrivers() {
  console.log("🚛 Atualizando Colaboradores...");
  
  try {
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Desabilitar restrições temporariamente para limpar e inserir
    await pool.query("SET session_replication_role = 'replica';");
    
    // Garantir que a coluna updated_at existe (pode estar faltando no setup inicial)
    await pool.query("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;");
    
    console.log("🧹 Limpando tabela drivers...");
    await pool.query("TRUNCATE TABLE drivers CASCADE;");
    
    console.log("📥 Inserindo novos dados...");
    await pool.query(sql);
    
    await pool.query("SET session_replication_role = 'origin';");
    
    const { rows } = await pool.query("SELECT COUNT(*) FROM drivers");
    console.log(`✅ Sucesso! Total de colaboradores agora: ${rows[0].count}`);
    
  } catch (err) {
    console.error("❌ Erro na atualização:", err.message);
  } finally {
    await pool.end();
  }
}

updateDrivers();
