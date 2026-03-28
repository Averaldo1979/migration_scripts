const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'averaldo_teste',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
});

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'team_role_values'
    `);
    console.log("Columns in team_role_values:", res.rows.map(r => r.column_name));
  } catch (err) {
    console.error("Error checking schema:", err.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
