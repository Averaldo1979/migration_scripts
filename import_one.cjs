const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'averaldo_teste',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
});

async function importOne() {
  const sql = fs.readFileSync('C:\\Users\\everaldo\\Desktop\\Projeto Sistema\\app_users_rows.sql', 'utf8');
  console.log("Importing...");
  try {
    await pool.query(sql);
    console.log("Done!");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

importOne();
