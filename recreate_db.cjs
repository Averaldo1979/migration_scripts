const fs = require('fs');
const { Pool } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  database: 'averaldo_teste',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
};

async function recreate() {
  const pool = new Pool(config);
  
  try {
    console.log("🧨 Limpando banco de dados 'averaldo_teste'...");
    
    // Drop all tables in public schema
    await pool.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);
    
    console.log("🛠️ Rebuilding schema from setup_local_db.sql...");
    const sql = fs.readFileSync('setup_local_db.sql', 'utf8');
    await pool.query(sql);
    
    console.log("✨ Banco de dados recriado com sucesso!");
  } catch (err) {
    console.error("❌ Erro:", err.message);
  } finally {
    await pool.end();
  }
}

recreate();
