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

const filePath = 'C:\\Users\\everaldo\\Desktop\\Projeto Sistema\\teams_rows.sql';

async function importTeams() {
  console.log("🚀 Iniciando atualização das Equipes...");

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    await pool.end();
    return;
  }

  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    if (!sql.trim()) {
      console.log('⚠️ Arquivo SQL de equipes está vazio.');
      await pool.end();
      return;
    }

    console.log('📄 Processando teams_rows.sql...');
    
    // Desabilita FKs para evitar erros durante a limpeza e inserção
    await pool.query("SET session_replication_role = 'replica';");
    
    // Limpamos a tabela para garantir que os dados do seu computador correspondam ao arquivo novo
    console.log('🧹 Limpando tabela de equipes antiga...');
    await pool.query("TRUNCATE TABLE teams CASCADE;");

    console.log('📥 Inserindo dados novos...');
    await pool.query(sql);
    
    // Volta ao modo normal
    await pool.query("SET session_replication_role = 'origin';");
    
    const { rows } = await pool.query("SELECT COUNT(*) FROM teams");
    console.log(`✅ Sucesso! Total de equipes no banco agora: ${rows[0].count}`);

  } catch (err) {
    console.error('❌ Erro durante a importação:', err.message);
  }

  await pool.end();
}

importTeams();
