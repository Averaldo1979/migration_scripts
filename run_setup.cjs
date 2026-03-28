const fs = require('fs');
const { Pool } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Ali@Ali12082022#',
};

async function setup() {
  // Conectar primeiro ao banco default 'postgres'
  let pool = new Pool({ ...config, database: 'postgres' });
  
  try {
    console.log("🛠️ Verificando banco de dados...");
    const res = await pool.query("SELECT 1 FROM pg_database WHERE datname = 'averaldo_teste'");

    if (res.rowCount === 0) {
      console.log("📦 Criando banco de dados 'averaldo_teste'...");
      await pool.query("CREATE DATABASE averaldo_teste");
    } else {
      console.log("✅ Banco de dados 'averaldo_teste' já existe.");
    }
  } catch (err) {
    console.error("❌ Erro ao verificar/criar banco:", err.message);
    await pool.end();
    return;
  } finally {
    await pool.end();
  }

  // Agora conectar ao banco 'cca_diarias' e rodar o SQL
  pool = new Pool({ ...config, database: 'averaldo_teste' });
  
  try {
    const sql = fs.readFileSync('setup_local_db.sql', 'utf8');
    console.log("🛠️ Criando tabelas no banco 'cca_diarias'...");
    await pool.query(sql);
    console.log("✨ Estrutura do banco configurada com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao criar tabelas:", err.message);
  } finally {
    await pool.end();
  }
}

setup();
