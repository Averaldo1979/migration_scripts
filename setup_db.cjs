require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cca_diarias',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Ali@Ali12082022#', // Usando senha encontrada no server.cjs
});

async function run() {
  const sqlPath = path.join(__dirname, 'setup_local_db.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log("🛠️ Criando tabelas no banco de dados local...");
  try {
    await pool.query(sql);
    console.log("✅ Tabelas criadas com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao criar tabelas:", err.message);
  } finally {
    await pool.end();
  }
}

run();
