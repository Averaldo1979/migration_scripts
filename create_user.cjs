const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'cca_diarias',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
});

async function createUser() {
  try {
    console.log("👤 Criando usuário 'gerenciafb' no banco local...");
    
    const user = {
      id: crypto?.randomUUID?.() || 'user-' + Date.now(),
      name: 'Gerencia FB',
      email: 'gerenciafb@frotacontrol.com',
      username: 'gerenciafb',
      password: 'ba@0832#',
      role: 'Administrador',
      status: 'Ativo',
      allowed_menus: JSON.stringify(['dashboard', 'fleet', 'fuel', 'maintenance', 'washing', 'tyres', 'suppliers', 'units', 'users', 'checklists', 'ppe', 'hr', 'tasks', 'odometer']),
      allowed_teams: JSON.stringify([])
    };

    const query = `
      INSERT INTO app_users (id, name, email, username, password, role, status, allowed_menus, allowed_teams)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (email) DO UPDATE SET 
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        allowed_menus = EXCLUDED.allowed_menus;
    `;

    const values = [
      user.id,
      user.name,
      user.email,
      user.username,
      user.password,
      user.role,
      user.status,
      user.allowed_menus,
      user.allowed_teams
    ];

    await pool.query(query, values);
    console.log("✅ Usuário 'gerenciafb' criado/atualizado com sucesso!");
    
    // Adicionar também o admin padrão se não existir
    await pool.query(`
      INSERT INTO app_users (id, name, email, username, password, role, status, allowed_menus, allowed_teams)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (email) DO NOTHING;
    `, ['admin-1', 'Controlador', 'admin@frotacontrol.com', 'admin', 'admin', 'Administrador', 'Ativo', JSON.stringify(['dashboard', 'fleet', 'fuel', 'maintenance', 'washing', 'tyres', 'suppliers', 'units', 'users', 'checklists', 'ppe', 'hr', 'tasks', 'odometer']), JSON.stringify([])]);

  } catch (err) {
    console.error("❌ Erro ao criar usuário:", err.message);
  } finally {
    await pool.end();
  }
}

createUser();
