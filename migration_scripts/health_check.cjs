const ADODB = require('node-adodb');
const dbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;
const connection = ADODB.open(connectionString, process.arch === 'x64');

const tables = [
    'units', 'teams', 'vehicles', 'drivers', 'fuel_logs', 'maintenance_logs', 
    'suppliers', 'washing_logs', 'app_users', 'checklists', 'tyres', 'tyre_audits', 
    'tyre_movements', 'tyre_repairs', 'ppe_items', 'ppe_movements', 'equipments', 
    'equipment_maintenance_logs', 'odometer_logs', 'attendance', 'cargas', 
    'history_logs', 'hr_events', 'fuel_types', 'tyre_brands', 'tyre_models', 'team_role_values'
];

async function checkHealth() {
    console.log("🔍 INICIANDO VARREDURA DO SISTEMA LOCAL...\n");
    console.log("------------------------------------------");
    console.log("TABELA                       | REGISTROS");
    console.log("------------------------------------------");

    for (const table of tables) {
        try {
            const result = await connection.query(`SELECT COUNT(*) as total FROM [${table}]`);
            const count = result[0].total;
            const status = count > 0 ? "✅" : "⚠️ VAZIO";
            console.log(`${table.padEnd(28)} | ${String(count).padStart(9)} ${status}`);
        } catch (e) {
            console.log(`${table.padEnd(28)} | ❌ ERRO: ${e.message.split('\n')[0]}`);
        }
    }
    console.log("------------------------------------------");
    
    try {
        console.log("\n📅 VERIFICANDO INTEGRIDADE DE DATAS (EPI):");
        const recentMove = await connection.query("SELECT TOP 1 [date] FROM ppe_movements ORDER BY [date] DESC");
        if (recentMove.length > 0) {
            console.log(`Última movimentação de EPI: ${recentMove[0].date}`);
        }
    } catch (e) {}

    process.exit(0);
}

checkHealth();
