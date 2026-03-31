const express = require('express');
const ADODB = require('node-adodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 5000;

// Configuração do MS Access (Banco de Dados em D:\BDERP)
const dbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;
const connection = ADODB.open(connectionString, process.arch === 'x64');

app.use(cors());
app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helper for SQL values to handle MS Access syntax
function formatValue(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    return val;
}

// Endpoint genérico para tabelas (Simulando Supabase sobre MS Access)
app.get('/api/:table', async (req, res) => {
  const { table } = req.params;
  const { order, limit } = req.query;
  
  let query = `SELECT * FROM [${table}]`;
  
  if (order) {
    const descTables = ['fuel_logs', 'maintenance_logs', 'washing_logs', 'checklists', 'tyre_audits', 'tyre_movements', 'tyre_repairs', 'ppe_movements', 'equipment_maintenance_logs', 'odometer_logs', 'hr_events', 'attendance', 'cargas'];
    const isDesc = descTables.includes(table);
    query += ` ORDER BY [${order}] ${isDesc ? 'DESC' : 'ASC'}`;
  }
  
  // No TOP/LIMIT directly in the same way? Access uses SELECT TOP X
  if (limit) {
    query = `SELECT TOP ${limit} * FROM [${table}]` + (order ? ` ORDER BY [${order}] ${descTables.includes(table) ? 'DESC' : 'ASC'}` : '');
  }

  console.log(`🔍 Executando query em [${table}]: ${query}`);
  try {
    const start = Date.now();
    const result = await connection.query(query);
    const duration = Date.now() - start;
    console.log(`✅ Resultado de [${table}]: ${result.length} linhas em ${duration}ms`);
    res.json(result);
  } catch (err) {
    console.error(`❌ Erro ao buscar em [${table}]:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Upsert genérico para MS Access (INSERT ou UPDATE manual)
app.post('/api/:table/upsert', async (req, res) => {
  const { table } = req.params;
  const data = req.body;
  const id = data.id;
  
  if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ error: "Dados vazios" });
  }

  try {
    // 1. Verificar se registro existe (Access não tem ON CONFLICT)
    let exists = false;
    if (id) {
        const checkRes = await connection.query(`SELECT id FROM [${table}] WHERE id = ${formatValue(id)}`);
        exists = (checkRes.length > 0);
    }

    if (exists) {
        // UPDATE
        const updates = Object.keys(data)
            .filter(k => k !== 'id')
            .map(col => `[${col}] = ${formatValue(data[col])}`)
            .join(', ');
        
        const updateQuery = `UPDATE [${table}] SET ${updates} WHERE id = ${formatValue(id)}`;
        console.log(`🔄 Atualizando em [${table}]: ${id}`);
        await connection.execute(updateQuery);
    } else {
        // INSERT
        const columns = Object.keys(data).map(c => `[${c}]`).join(', ');
        const values = Object.values(data).map(v => formatValue(v)).join(', ');
        const insertQuery = `INSERT INTO [${table}] (${columns}) VALUES (${values})`;
        console.log(`📥 Inserindo em [${table}]: ${id || 'sem id'}`);
        await connection.execute(insertQuery);
    }
    
    // Retornar o dado inserido/atualizado (simulado para satisfazer o frontend)
    res.json(data);
  } catch (err) {
    console.error(`❌ Erro no upsert em ${table}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/:table', async (req, res) => {
    const { table } = req.params;
    const { id } = req.query;

    if (!id) return res.status(400).json({ error: "ID não informado" });

    try {
        const query = `DELETE FROM [${table}] WHERE id = ${formatValue(id)}`;
        await connection.execute(query);
        res.json({ success: true });
    } catch (err) {
        console.error(`❌ Erro ao deletar em ${table}:`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected', driver: 'adodb' });
});

app.listen(port, () => {
  console.log(`🚀 Backend FrotaControl (MS Access) rodando em http://localhost:${port}`);
  console.log(`📡 Conectado ao banco: ${dbPath}`);
});
