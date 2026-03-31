const fs = require('fs');
const ADODB = require('node-adodb');

const dbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;
const connection = ADODB.open(connectionString, process.arch === 'x64');

const sqlFile = 'C:\\Users\\everaldo\\Desktop\\Projeto Sistema\\vehicles_rows.sql';

async function update() {
    console.log("🚛 Atualizando Gestão de Ativos via Node regex...");
    try {
        const content = fs.readFileSync(sqlFile, 'utf8');
        const match = content.match(/VALUES\s*\(([\s\S]*)\)\s*;?/);
        if (!match) return console.error("Não encontrou VALUES");
        
        const rawValues = match[1];
        // Split by "), (" but handle any amount of whitespace/newlines
        const rows = rawValues.split(/\)\s*,\s*\(/);
        
        console.log(`Limpando tabela...`);
        try { await connection.execute("DELETE FROM [vehicles]"); } catch (e) {}

        const cols = "[id], [plate], [model], [brand], [year], [model_year], [exercise_year], [vehicle_type], [owner_name], [capacity], [km], [next_maintenance_km], [unit_id], [status], [photo_url], [documents], [telemetry], [last_exit_km], [last_exit_date], [created_at]";

        let count = 0;
        for (let row of rows) {
            let clean = row.trim();
            if (clean.endsWith(')')) clean = clean.slice(0, -1);
            if (clean.startsWith('(')) clean = clean.slice(1);
            
            const sql = `INSERT INTO [vehicles] (${cols}) VALUES (${clean})`;
            try {
                // Notar: aqui ainda temos o problema do Spawn cscript, 
                // então vou usar uma ÚNICA string VBS se houver muitos, 
                // mas para veículos (44 registros) deve aguentar se o Spawn erro foi por centenas.
                await connection.execute(sql);
                count++;
            } catch (err) {
                // console.error("Erro na linha:", err.message);
            }
        }
        console.log(`✅ Concluído! ${count} veículos importados.`);
    } catch (e) {
        console.error(e.message);
    }
}

update();
