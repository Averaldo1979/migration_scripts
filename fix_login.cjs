const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'averaldo_teste',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
});

async function fix() {
  console.log("Connecting...");
  await client.connect();
  console.log("Connected.");
  try {
    console.log("Inserting user...");
    await client.query(`
      INSERT INTO app_users (id, name, email, username, password, role, status)
      VALUES ('manual-final', 'Gerencia FB', 'gerenciafb@cca.com.br', 'gerenciafb', 'ba@0832#', 'Administrador', 'Ativo')
      ON CONFLICT (id) DO UPDATE SET username = 'gerenciafb', password = 'ba@0832#', status = 'Ativo';
    `);
    console.log("Success!");
    const res = await client.query("SELECT COUNT(*) FROM app_users");
    console.log("Total users now:", res.rows[0].count);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

fix();
