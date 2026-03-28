const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'averaldo_teste',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
});

async function check() {
  console.log("Checking user...");
  try {
    const res = await pool.query("SELECT * FROM app_users");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

check();
