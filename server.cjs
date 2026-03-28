const express = require('express');
const pg = require('pg');
const { Pool } = pg;
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 5000;

// Configurar o pg para retornar valores NUMERIC/DECIMAL como Number ao invés de String
// IDs de tipo: 1700 (NUMERIC), 701 (FLOAT8), 700 (FLOAT4)
pg.types.setTypeParser(1700, function(val) {
  return val === null ? null : parseFloat(val);
});

// Configuração do Banco de Dados PostgreSQL
// Em produção (VM 108): banco local 'averaldo_teste'
// Em dev local: use .env para sobrescrever (ou túnel SSH)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'averaldo_teste',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Ali@Ali12082022#',
});

app.use(cors());
app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Endpoint genérico para tabelas (Simulando Supabase)
app.get('/api/:table', async (req, res) => {
  const { table } = req.params;
  const { order, limit } = req.query;
  
  let query = `SELECT * FROM ${table}`;
  
  if (order) {
    // Se order for 'date', vira 'ORDER BY date'
    // Se precisar de desc: ORDER BY date DESC
    // Simplificando: se contiver 'date' ou 'created_at', assume DESC por padrão se for log
    const descTables = ['fuel_logs', 'maintenance_logs', 'washing_logs', 'checklists', 'tyre_audits', 'tyre_movements', 'tyre_repairs', 'ppe_movements', 'equipment_maintenance_logs', 'odometer_logs', 'hr_events', 'attendance', 'cargas'];
    const isDesc = descTables.includes(table);
    query += ` ORDER BY ${order} ${isDesc ? 'DESC' : 'ASC'}`;
  }
  
  if (limit) query += ` LIMIT ${limit}`;

  console.log(`🔍 Executando query em ${table}: ${query}`);
  try {
    const start = Date.now();
    const result = await pool.query(query);
    const duration = Date.now() - start;
    console.log(`✅ Resultado de ${table}: ${result.rows.length} linhas em ${duration}ms`);
    res.json(result.rows);
  } catch (err) {
    console.error(`❌ Erro ao buscar em ${table}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/:table/upsert', async (req, res) => {
  const { table } = req.params;
  const data = req.body;
  
  if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ error: "Dados vazios" });
  }

  const columns = Object.keys(data).join(', ');
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  const updates = Object.keys(data).map((col, i) => `${col} = EXCLUDED.${col}`).join(', ');

  const query = `
    INSERT INTO ${table} (${columns}) 
    VALUES (${placeholders}) 
    ON CONFLICT (id) DO UPDATE SET ${updates}
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Erro no upsert em ${table}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/:table', async (req, res) => {
    const { table } = req.params;
    const { id } = req.query;

    if (!id) return res.status(400).json({ error: "ID não informado" });

    try {
        await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(`Erro ao deletar em ${table}:`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected' });
});

app.listen(port, () => {
  console.log(`🚀 Backend FrotaControl rodando em http://localhost:${port}`);
  console.log(`📡 Conectado ao PostgreSQL via localhost (Túnel para 192.168.0.108:5432)`);
});
