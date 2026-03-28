const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'averaldo_teste',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
});

async function update() {
  console.log("🛠️ Atualizando usuário gerenciafb...");
  try {
    // Primeiro limpamos duplicatas para garantir que o username seja único
    await pool.query("UPDATE app_users SET username = 'gerenciafb', password = 'ba@0832#', \"allowedMenus\" = '[\"dashboard\", \"units\", \"vehicles\", \"drivers\", \"suppliers\", \"teams\", \"fuel\", \"maintenance\", \"washing\", \"tyre_config\", \"tyres\", \"checklist\", \"alerts\", \"hr\", \"epi\"]' WHERE email = 'gerenciafb@ccacarregamentos.com.br' OR username = 'gerenciafb'");
    
    // Verificamos o resultado
    const res = await pool.query("SELECT * FROM app_users WHERE username = 'gerenciafb'");
    if (res.rowCount > 0) {
      console.log("✅ Usuário atualizado com sucesso!");
      console.log("👤 Nome:", res.rows[0].name);
      console.log("🔑 Novo Usuário:", res.rows[0].username);
      console.log("🔐 Nova Senha:", res.rows[0].password);
    } else {
      console.error("❌ Erro: Usuário com o e-mail informado não foi encontrado.");
    }
  } catch (err) {
    console.error("❌ Erro ao atualizar:", err.message);
  } finally {
    await pool.end();
  }
}

update();
