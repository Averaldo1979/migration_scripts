const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  database: 'averaldo_teste',
  user: 'postgres',
  password: 'Ali@Ali12082022#',
});

async function check() {
  try {
    const { rows } = await pool.query('SELECT count(*) FROM vehicles');
    console.log(`Count: ${rows[0].count}`);
  } catch (err) {
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

check();
